require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { Agent, Ticket, setUseFallback, getUseFallback } = require('./models/Schema');
const { classifyTicket } = require('./services/aiService');
const { calculateSlaDeadline, getSlaStatus } = require('./services/slaService');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// --- DATABASE CONNECTION ---
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/support_db';
mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 2000 })
  .then(() => {
    console.log('[DB SYSTEM] Connected to MongoDB.');
    setUseFallback(false);
  })
  .catch((err) => {
    console.warn(`[DB SYSTEM] MongoDB connection failed (timeout/offline). Fallback active. Error: ${err.message}`);
    setUseFallback(true);
  });

// --- HELPER FUNCTION: REFRESH SLA STATUSES ---
// Updates tickets in-memory and in DB if SLA statuses changed
async function refreshSlaStatuses(tickets) {
  const updatedTickets = [];
  for (let ticket of tickets) {
    if (ticket.status !== 'Resolved') {
      const currentStatus = getSlaStatus(ticket);
      if (currentStatus !== ticket.slaStatus) {
        ticket.slaStatus = currentStatus;
        await Ticket.findByIdAndUpdate(ticket._id, { slaStatus: currentStatus });
      }
    }
    updatedTickets.push(ticket);
  }
  return updatedTickets;
}

// --- ROUTES ---

// 1. GET ALL TICKETS
app.get('/api/tickets', async (req, res) => {
  try {
    const rawTickets = await Ticket.find({});
    // Sort tickets manually: newest first
    rawTickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const tickets = await refreshSlaStatuses(rawTickets);
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. CREATE TICKET (AI CLASSIFIED & AUTOMATICALLY ROUTED)
app.post('/api/tickets', async (req, res) => {
  const { title, description } = req.body;
  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required.' });
  }

  try {
    // 1. Call AI Classification service
    const aiResult = await classifyTicket(description);
    const category = aiResult.category;
    const confidence = aiResult.confidence;

    // 2. Map category to default priority
    let priority = 'Medium';
    if (category === 'Technical Support') priority = 'High';
    else if (category === 'Account & Access') priority = 'High';
    else if (category === 'Billing & Invoice') priority = 'Medium';
    else if (category === 'Product Inquiry') priority = 'Low';
    else if (category === 'Manual Triage') priority = 'Medium';

    // 3. Compute SLA Deadline
    const createdAt = new Date();
    const slaDeadline = calculateSlaDeadline(priority, createdAt);

    // 4. Smart Ticket Routing: find matching online agent with lowest workload
    const onlineAgents = await Agent.find({ status: 'online' });
    let assignedAgent = null;

    if (onlineAgents.length > 0) {
      // Filter by specialty if possible
      const specialists = onlineAgents.filter(a => a.specialty === category);
      const candidates = specialists.length > 0 ? specialists : onlineAgents;

      // Select candidate with minimum active ticket count
      candidates.sort((a, b) => a.activeTickets - b.activeTickets);
      assignedAgent = candidates[0];
    }

    // 5. Create Ticket
    const ticketData = {
      title,
      description,
      status: 'Open',
      priority,
      category,
      confidence,
      createdAt,
      slaDeadline,
      slaStatus: 'Normal',
      agentId: assignedAgent ? assignedAgent._id : null,
      agentName: assignedAgent ? assignedAgent.name : 'Unassigned (Queue)'
    };

    const newTicket = await Ticket.create(ticketData);

    // 6. Update Agent workload if assigned
    if (assignedAgent) {
      await Agent.findByIdAndUpdate(assignedAgent._id, {
        $inc: { activeTickets: 1 }
      });
    }

    res.status(201).json({
      message: 'Ticket created successfully',
      ticket: newTicket,
      routingDetails: {
        classifiedCategory: category,
        confidence,
        assignedAgent: ticketData.agentName,
        priority,
        classificationSource: aiResult.source
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. RESOLVE TICKET
app.post('/api/tickets/:id/resolve', async (req, res) => {
  const { id } = req.params;
  try {
    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (ticket.status === 'Resolved') {
      return res.status(400).json({ error: 'Ticket is already resolved' });
    }

    // Calculate resolution time in minutes
    const now = new Date();
    const createdTime = new Date(ticket.createdAt);
    const resolutionTime = Math.max(1, Math.round((now - createdTime) / 60000)); // minimum 1 min

    // Determine final SLA status at the moment of resolution
    const finalSlaStatus = getSlaStatus(ticket);

    const updatedTicket = await Ticket.findByIdAndUpdate(id, {
      status: 'Resolved',
      resolutionTime,
      slaStatus: finalSlaStatus
    }, { new: true });

    // Decrement Agent workload
    if (ticket.agentId) {
      await Agent.findByIdAndUpdate(ticket.agentId, {
        $inc: { activeTickets: -1 }
      });
    }

    res.json({ message: 'Ticket resolved', ticket: updatedTicket });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. CUSTOMER SATISFACTION FEEDBACK (CSAT)
app.post('/api/tickets/:id/feedback', async (req, res) => {
  const { id } = req.params;
  const { rating, feedback } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'CSAT Rating must be between 1 and 5.' });
  }

  try {
    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (ticket.status !== 'Resolved') {
      return res.status(400).json({ error: 'Feedback can only be provided for resolved tickets.' });
    }

    const updatedTicket = await Ticket.findByIdAndUpdate(id, {
      csatRating: Number(rating),
      csatFeedback: feedback || ''
    }, { new: true });

    res.json({ message: 'CSAT logged successfully', ticket: updatedTicket });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. GET ALL AGENTS
app.get('/api/agents', async (req, res) => {
  try {
    const agents = await Agent.find({});
    res.json(agents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. ADD AGENT
app.post('/api/agents', async (req, res) => {
  const { name, email, specialty } = req.body;
  if (!name || !email || !specialty) {
    return res.status(400).json({ error: 'Name, email, and specialty are required.' });
  }

  try {
    const newAgent = await Agent.create({
      name,
      email,
      specialty,
      status: 'online',
      activeTickets: 0
    });
    res.status(201).json(newAgent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. GET ANALYTICS FOR DASHBOARD
app.get('/api/analytics', async (req, res) => {
  try {
    const tickets = await Ticket.find({});
    const agents = await Agent.find({});

    const totalTickets = tickets.length;
    const resolvedTickets = tickets.filter(t => t.status === 'Resolved');
    const openTickets = tickets.filter(t => t.status !== 'Resolved');

    // 1. SLA compliance rate
    const breachedCount = tickets.filter(t => t.slaStatus === 'Breached').length;
    const slaComplianceRate = totalTickets > 0 
      ? Math.round(((totalTickets - breachedCount) / totalTickets) * 100)
      : 100;

    // 2. CSAT details
    const ratedTickets = resolvedTickets.filter(t => t.csatRating !== null);
    const averageCsat = ratedTickets.length > 0
      ? Number((ratedTickets.reduce((acc, t) => acc + t.csatRating, 0) / ratedTickets.length).toFixed(2))
      : 0.0;

    const csatDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratedTickets.forEach(t => {
      csatDistribution[t.csatRating] = (csatDistribution[t.csatRating] || 0) + 1;
    });

    // 3. Agent Performance Leaderboard
    const agentStats = agents.map(agent => {
      const agentTickets = tickets.filter(t => String(t.agentId) === String(agent._id));
      const agentResolved = agentTickets.filter(t => t.status === 'Resolved');
      
      const avgResolutionTime = agentResolved.length > 0
        ? Math.round(agentResolved.reduce((acc, t) => acc + (t.resolutionTime || 0), 0) / agentResolved.length)
        : 0;

      const ratedAgentTickets = agentResolved.filter(t => t.csatRating !== null);
      const agentCsat = ratedAgentTickets.length > 0
        ? Number((ratedAgentTickets.reduce((acc, t) => acc + t.csatRating, 0) / ratedAgentTickets.length).toFixed(2))
        : 0.0;

      return {
        _id: agent._id,
        name: agent.name,
        specialty: agent.specialty,
        status: agent.status,
        activeTickets: agentTickets.filter(t => t.status !== 'Resolved').length,
        resolvedTickets: agentResolved.length,
        avgResolutionTimeMinutes: avgResolutionTime,
        csat: agentCsat
      };
    });

    // Sort leaderboard by resolved tickets (descending)
    agentStats.sort((a, b) => b.resolvedTickets - a.resolvedTickets);

    // 4. Ticket Categories count
    const categoryCounts = {
      'Billing & Invoice': 0,
      'Technical Support': 0,
      'Account & Access': 0,
      'Product Inquiry': 0,
      'Manual Triage': 0
    };
    tickets.forEach(t => {
      if (categoryCounts[t.category] !== undefined) {
        categoryCounts[t.category]++;
      }
    });

    // 5. Recent CSAT Feedbacks
    const recentFeedback = ratedTickets
      .map(t => ({
        ticketId: t._id,
        ticketTitle: t.title,
        rating: t.csatRating,
        feedback: t.csatFeedback,
        agentName: t.agentName,
        date: t.createdAt
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    res.json({
      summary: {
        totalTickets,
        resolvedTickets: resolvedTickets.length,
        openTickets: openTickets.length,
        slaComplianceRate,
        averageCsat,
        dbEngine: getUseFallback() ? 'Local JSON DB Fallback' : 'MongoDB'
      },
      categoryDistribution: categoryCounts,
      csatDistribution,
      leaderboard: agentStats,
      recentFeedback
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. RESET DATA (FOR DEMO SEEDING)
app.post('/api/reset', async (req, res) => {
  try {
    // Run seed file content directly to reset
    const { seedData } = require('./seed');
    await seedData();
    res.json({ message: 'Database reset and seeded successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[SERVER] Node API running at http://127.0.0.1:${PORT}`);
});
