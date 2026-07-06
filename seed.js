const { Agent, Ticket, setUseFallback } = require('./models/Schema');
const mongoose = require('mongoose');

// Seed agent details
const SEED_AGENTS = [
  { name: 'Alice Vance', email: 'alice.vance@support.com', specialty: 'Technical Support', status: 'online', activeTickets: 0 },
  { name: 'Bob Miller', email: 'bob.miller@support.com', specialty: 'Billing & Invoice', status: 'online', activeTickets: 0 },
  { name: 'Charlie Brown', email: 'charlie.brown@support.com', specialty: 'Account & Access', status: 'online', activeTickets: 0 },
  { name: 'Diana Prince', email: 'diana.prince@support.com', specialty: 'Product Inquiry', status: 'online', activeTickets: 0 }
];

// Helper to calculate relative dates
const hoursAgo = (h) => {
  const d = new Date();
  d.setHours(d.getHours() - h);
  return d;
};

const daysAgo = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
};

// Seed historical ticket backlog
const getSeedTickets = (agents) => {
  const agentMap = {};
  agents.forEach(a => {
    agentMap[a.specialty] = a;
  });

  return [
    // 1. Resolved with 5 star CSAT (Technical Support)
    {
      title: 'Database connection timeout in prod',
      description: 'Our analytics server is failing to resolve the primary DB shard. Getting a continuous timeout error since 3 PM.',
      status: 'Resolved',
      priority: 'Critical',
      category: 'Technical Support',
      confidence: 0.94,
      agentId: agentMap['Technical Support']?._id || null,
      agentName: agentMap['Technical Support']?.name || 'Alice Vance',
      createdAt: daysAgo(3),
      slaDeadline: new Date(daysAgo(3).getTime() + 4 * 60 * 60 * 1000), // 4h SLA
      slaStatus: 'Normal',
      csatRating: 5,
      csatFeedback: 'Incredibly fast response! Alice identified the network issue immediately and fixed the connection block. Kudos!',
      resolutionTime: 45 // 45 mins
    },
    // 2. Resolved with 4 star CSAT (Billing)
    {
      title: 'Requesting refund for double charge in May',
      description: 'I was billed twice on May 15th for the pro plan subscription. I have attached my bank transaction receipt.',
      status: 'Resolved',
      priority: 'Medium',
      category: 'Billing & Invoice',
      confidence: 0.91,
      agentId: agentMap['Billing & Invoice']?._id || null,
      agentName: agentMap['Billing & Invoice']?.name || 'Bob Miller',
      createdAt: daysAgo(5),
      slaDeadline: new Date(daysAgo(5).getTime() + 24 * 60 * 60 * 1000), // 24h SLA
      slaStatus: 'Normal',
      csatRating: 4,
      csatFeedback: 'Refund processed successfully, took a couple of days but billing support was polite.',
      resolutionTime: 180 // 3 hours
    },
    // 3. Resolved - SLA Breached with 3 star CSAT (Account)
    {
      title: 'Locked out of main admin console',
      description: 'My password was reset but I am not receiving the email link to update it. We cannot access our console.',
      status: 'Resolved',
      priority: 'High',
      category: 'Account & Access',
      confidence: 0.88,
      agentId: agentMap['Account & Access']?._id || null,
      agentName: agentMap['Account & Access']?.name || 'Charlie Brown',
      createdAt: daysAgo(4),
      slaDeadline: new Date(daysAgo(4).getTime() + 12 * 60 * 60 * 1000), // 12h SLA
      slaStatus: 'Breached', // Resolved after deadline
      csatRating: 3,
      csatFeedback: 'They resolved it and unlocked my account, but it took way too long (almost 30 hours) for an administrative block.',
      resolutionTime: 1720 // ~28.6 hours
    },
    // 4. Resolved with 5 star CSAT (Product)
    {
      title: 'How do I export historical ticket records?',
      description: 'We need to move our last quarter tickets into CSV to load into Tableau. Where is the export option?',
      status: 'Resolved',
      priority: 'Low',
      category: 'Product Inquiry',
      confidence: 0.97,
      agentId: agentMap['Product Inquiry']?._id || null,
      agentName: agentMap['Product Inquiry']?.name || 'Diana Prince',
      createdAt: daysAgo(2),
      slaDeadline: new Date(daysAgo(2).getTime() + 48 * 60 * 60 * 1000), // 48h SLA
      slaStatus: 'Normal',
      csatRating: 5,
      csatFeedback: 'Easy explanation, Diana showed me exactly where the CSV export endpoint is. Thanks!',
      resolutionTime: 15 // 15 mins
    },
    // 5. Open Ticket (Technical Support) - Normal SLA
    {
      title: 'Image uploads fail with error 413 on mobile',
      description: 'Mobile users cannot upload attachment screenshots larger than 2MB. Getting Payload Too Large server errors.',
      status: 'Open',
      priority: 'High',
      category: 'Technical Support',
      confidence: 0.89,
      agentId: agentMap['Technical Support']?._id || null,
      agentName: agentMap['Technical Support']?.name || 'Alice Vance',
      createdAt: hoursAgo(2),
      slaDeadline: new Date(hoursAgo(2).getTime() + 12 * 60 * 60 * 1000), // 12h SLA
      slaStatus: 'Normal'
    },
    // 6. Open Ticket (Billing) - Warning SLA (Close to deadline)
    {
      title: 'Enterprise subscription renewal fails',
      description: 'Our company credit card was rejected. We need to pay by wire transfer or generate an official invoice invoice before our service is cut off.',
      status: 'Open',
      priority: 'Medium',
      category: 'Billing & Invoice',
      confidence: 0.93,
      agentId: agentMap['Billing & Invoice']?._id || null,
      agentName: agentMap['Billing & Invoice']?.name || 'Bob Miller',
      createdAt: hoursAgo(19), // 19 hours ago on 24h SLA. remaining ~5h (which is less than 25% of 24h = 6h) -> Warning!
      slaDeadline: new Date(hoursAgo(19).getTime() + 24 * 60 * 60 * 1000),
      slaStatus: 'Warning'
    },
    // 7. Open Ticket (Account) - Breached SLA
    {
      title: 'Request to set up SSO / SAML for team',
      description: 'We are onboarding 50 new hires next week and urgently need to configure Okta SSO. We submitted this 2 days ago.',
      status: 'Pending',
      priority: 'High',
      category: 'Account & Access',
      confidence: 0.85,
      agentId: agentMap['Account & Access']?._id || null,
      agentName: agentMap['Account & Access']?.name || 'Charlie Brown',
      createdAt: daysAgo(2), // 48h ago on 12h SLA -> Breached!
      slaDeadline: new Date(daysAgo(2).getTime() + 12 * 60 * 60 * 1000),
      slaStatus: 'Breached'
    },
    // 8. Open Ticket (Product) - Normal SLA
    {
      title: 'Is there a Dark Mode for the main support portal?',
      description: 'Our team is working late shifts, a dark theme would help save our eyes. Is there a toggle or custom stylesheet?',
      status: 'Open',
      priority: 'Low',
      category: 'Product Inquiry',
      confidence: 0.96,
      agentId: agentMap['Product Inquiry']?._id || null,
      agentName: agentMap['Product Inquiry']?.name || 'Diana Prince',
      createdAt: hoursAgo(1),
      slaDeadline: new Date(hoursAgo(1).getTime() + 48 * 60 * 60 * 1000),
      slaStatus: 'Normal'
    },
    // 9. Resolved with 5 star CSAT (Technical Support)
    {
      title: 'Webhook callbacks failing with signature mismatch',
      description: 'We updated our client integration and now our callback validations fail. Are webhooks sending the correct hash?',
      status: 'Resolved',
      priority: 'Medium',
      category: 'Technical Support',
      confidence: 0.87,
      agentId: agentMap['Technical Support']?._id || null,
      agentName: agentMap['Technical Support']?.name || 'Alice Vance',
      createdAt: daysAgo(1),
      slaDeadline: new Date(daysAgo(1).getTime() + 24 * 60 * 60 * 1000),
      slaStatus: 'Normal',
      csatRating: 5,
      csatFeedback: 'Alice explained how the signature hashing changed in the API update. Works great now!',
      resolutionTime: 60
    },
    // 10. Resolved with 1 star CSAT (Billing)
    {
      title: 'Charged after subscription cancellation',
      description: 'I cancelled my account last month and was still charged $29 today. Please refund and close my account permanently.',
      status: 'Resolved',
      priority: 'Medium',
      category: 'Billing & Invoice',
      confidence: 0.94,
      agentId: agentMap['Billing & Invoice']?._id || null,
      agentName: agentMap['Billing & Invoice']?.name || 'Bob Miller',
      createdAt: daysAgo(2),
      slaDeadline: new Date(daysAgo(2).getTime() + 24 * 60 * 60 * 1000),
      slaStatus: 'Normal',
      csatRating: 1,
      csatFeedback: 'They charged me when they should not have. Unacceptable service.',
      resolutionTime: 480
    }
  ];
};

async function seedData() {
  console.log('[SEED] Wiping existing tickets and agents...');
  await Agent.deleteMany({});
  await Ticket.deleteMany({});

  console.log('[SEED] Creating agents...');
  const createdAgents = [];
  for (const agent of SEED_AGENTS) {
    const freshAgent = await Agent.create(agent);
    createdAgents.push(freshAgent);
  }
  console.log(`[SEED] Created ${createdAgents.length} agents.`);

  console.log('[SEED] Generating and creating tickets...');
  const seedTickets = getSeedTickets(createdAgents);
  let ticketsCreated = 0;
  for (const ticket of seedTickets) {
    await Ticket.create(ticket);
    ticketsCreated++;
  }
  console.log(`[SEED] Created ${ticketsCreated} tickets.`);

  // Recalculate agent workloads
  console.log('[SEED] Recalculating agent workloads...');
  for (const agent of createdAgents) {
    const activeCount = await Ticket.find({
      agentId: agent._id,
      status: { $ne: 'Resolved' }
    });
    await Agent.findByIdAndUpdate(agent._id, { activeTickets: activeCount.length });
  }

  console.log('[SEED] Database successfully seeded!');
}

// Support running directly from CLI
if (require.main === module) {
  // If run directly, connect database and perform seed
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/support_db';
  mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 2000 })
    .then(async () => {
      setUseFallback(false);
      await seedData();
      mongoose.connection.close();
    })
    .catch(async () => {
      console.warn('[SEED] MongoDB offline. Seeding Local JSON DB fallback instead.');
      setUseFallback(true);
      await seedData();
    });
}

module.exports = {
  seedData
};
