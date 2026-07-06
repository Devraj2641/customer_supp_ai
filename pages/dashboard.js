import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { BarChart3, Users, Clock, Star, Activity, CheckCircle2, AlertTriangle, Play, RefreshCw, Layers, ShieldAlert, Award, UserCheck, MessageSquare } from 'lucide-react';

export default function DashboardPortal() {
  const router = useRouter();
  const { tab } = router.query;
  const activeTab = tab || 'agent'; // default to agent

  const [tickets, setTickets] = useState([]);
  const [agents, setAgents] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [selectedAgentFilter, setSelectedAgentFilter] = useState('All');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Start clock to update SLA countdowns in real-time
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      const ticketsRes = await fetch('http://127.0.0.1:4000/api/tickets');
      const ticketsData = await ticketsRes.json();
      if (Array.isArray(ticketsData)) setTickets(ticketsData);

      const agentsRes = await fetch('http://127.0.0.1:4000/api/agents');
      const agentsData = await agentsRes.json();
      if (Array.isArray(agentsData)) setAgents(agentsData);

      const analyticsRes = await fetch('http://127.0.0.1:4000/api/analytics');
      const analyticsData = await analyticsRes.json();
      if (analyticsData) setAnalytics(analyticsData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };

  const handleResolveTicket = async (ticketId) => {
    try {
      const res = await fetch(`http://127.0.0.1:4000/api/tickets/${ticketId}/resolve`, {
        method: 'POST'
      });
      if (res.ok) {
        fetchData();
      } else {
        alert('Failed to resolve ticket.');
      }
    } catch (err) {
      console.error('Error resolving ticket:', err);
    }
  };

  const handleResetSystem = async () => {
    if (!confirm('Are you sure you want to reset the support database? This will clear all custom tickets and load historical demonstration data.')) return;
    
    try {
      const res = await fetch('http://127.0.0.1:4000/api/reset', {
        method: 'POST'
      });
      if (res.ok) {
        alert('Database reset and seeded successfully.');
        fetchData();
      } else {
        alert('Failed to reset system.');
      }
    } catch (err) {
      console.error('Error resetting database:', err);
    }
  };

  // --- SLA COUNTDOWN TIMER HELPER ---
  const renderSlaTimer = (ticket) => {
    if (ticket.status === 'Resolved') {
      return (
        <span style={{ color: '#34d399', fontSize: '0.85rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <CheckCircle2 size={14} />
          Resolved ({ticket.resolutionTime}m)
        </span>
      );
    }

    const deadline = new Date(ticket.slaDeadline);
    const msDiff = deadline.getTime() - currentTime.getTime();
    const isBreached = msDiff < 0;
    const absDiff = Math.abs(msDiff);

    const hours = Math.floor(absDiff / (1000 * 60 * 60));
    const mins = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((absDiff % (1000 * 60)) / 1000);

    const text = `${hours}h ${mins}m ${secs}s ${isBreached ? 'overdue' : 'left'}`;
    const timerColor = isBreached 
      ? '#f87171' // red
      : msDiff < (deadline.getTime() - new Date(ticket.createdAt).getTime()) * 0.25 
        ? '#fbbf24' // warning yellow
        : '#60a5fa'; // normal blue

    return (
      <span style={{ color: timerColor, fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <Clock size={14} />
        {text}
      </span>
    );
  };

  const getPriorityBadgeClass = (p) => {
    if (p === 'Critical') return 'badge badge-critical';
    if (p === 'High') return 'badge badge-high';
    if (p === 'Medium') return 'badge badge-medium';
    return 'badge badge-low';
  };

  // Filters tickets based on agent dropdown selector
  const filteredTickets = selectedAgentFilter === 'All'
    ? tickets
    : tickets.filter(t => t.agentName === selectedAgentFilter);

  // Maximum value for SVG chart scalability
  const getCategoryChartMax = () => {
    if (!analytics || !analytics.categoryDistribution) return 10;
    const vals = Object.values(analytics.categoryDistribution);
    return Math.max(...vals, 5);
  };

  const getCsatChartMax = () => {
    if (!analytics || !analytics.csatDistribution) return 10;
    const vals = Object.values(analytics.csatDistribution);
    return Math.max(...vals, 5);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'hsl(var(--background))' }}>
      <Head>
        <title>Control Console | AutoRoute AI</title>
      </Head>

      {/* Nav */}
      <nav style={{ borderBottom: '1px solid hsl(var(--border))', background: 'rgba(8, 14, 28, 0.8)', padding: '1rem 2rem', backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          
          <Link href="/" style={{ fontSize: '1.25rem', fontWeight: 700, textDecoration: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={22} style={{ color: '#3b82f6' }} />
            <span>AutoRoute <span style={{ color: '#3b82f6' }}>AI</span></span>
          </Link>

          {/* Tab selector */}
          <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid hsl(var(--border))', padding: '0.25rem', borderRadius: '8px', gap: '0.25rem' }}>
            <button
              onClick={() => router.push('/dashboard?tab=agent')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: activeTab === 'agent' ? 'white' : 'hsl(var(--muted-foreground))',
                background: activeTab === 'agent' ? 'hsl(var(--primary))' : 'none'
              }}
            >
              Agent Workspace
            </button>
            <button
              onClick={() => router.push('/dashboard?tab=manager')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: activeTab === 'manager' ? 'white' : 'hsl(var(--muted-foreground))',
                background: activeTab === 'manager' ? 'hsl(var(--primary))' : 'none'
              }}
            >
              Manager Dashboard
            </button>
          </div>

          <button
            onClick={fetchData}
            style={{
              background: 'none',
              border: '1px solid hsl(var(--border))',
              color: 'hsl(var(--muted-foreground))',
              padding: '0.5rem',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Refresh Data"
          >
            <RefreshCw size={16} />
          </button>

        </div>
      </nav>

      {/* Main page wrapper */}
      <main style={{ flex: 1, padding: '2rem 1.5rem', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        
        {/* ========================================= */}
        {/* TABS 1: AGENT WORKSPACE */}
        {/* ========================================= */}
        {activeTab === 'agent' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Agent Work Queue</h1>
                <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem' }}>
                  Manage assigned inquiries and resolve issues within SLA parameters.
                </p>
              </div>

              {/* Agent dropdown filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}>Filter by Agent:</span>
                <select
                  value={selectedAgentFilter}
                  onChange={(e) => setSelectedAgentFilter(e.target.value)}
                  style={{ width: '180px', padding: '0.5rem' }}
                >
                  <option value="All">All Agents</option>
                  {agents.map(a => (
                    <option key={a._id} value={a.name}>{a.name}</option>
                  ))}
                  <option value="Unassigned (Queue)">Unassigned</option>
                </select>
              </div>
            </div>

            {/* Main content grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '2rem', alignItems: 'start' }}>
              
              {/* Tickets List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredTickets.length === 0 ? (
                  <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>
                    <CheckCircle2 size={48} style={{ color: '#34d399', opacity: 0.8, marginBottom: '1rem' }} />
                    <h4>All clean! No tickets in this queue filter.</h4>
                  </div>
                ) : (
                  filteredTickets.map(t => (
                    <div key={t._id} className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
                      
                      {/* Top Row: Badges and SLA countdown */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <span className={getPriorityBadgeClass(t.priority)}>{t.priority}</span>
                          <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)', fontWeight: 500 }}>
                            {t.category}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))' }}>
                            Conf: {Math.round(t.confidence * 100)}%
                          </span>
                        </div>
                        <div>{renderSlaTimer(t)}</div>
                      </div>

                      {/* Title & Description */}
                      <div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>{t.title}</h3>
                        <p style={{ color: 'hsl(var(--foreground))', fontSize: '0.9rem', lineHeight: 1.5, opacity: 0.95, whiteSpace: 'pre-wrap' }}>
                          {t.description}
                        </p>
                      </div>

                      {/* Footer bar containing dates and action */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid hsl(var(--border))', paddingTop: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))' }}>
                          <span>Created: {new Date(t.createdAt).toLocaleString()}</span>
                          <span>Assigned Agent: <strong style={{ color: 'white' }}>{t.agentName}</strong></span>
                        </div>

                        {t.status !== 'Resolved' ? (
                          <button
                            onClick={() => handleResolveTicket(t._id)}
                            style={{
                              background: '#34d399',
                              color: 'hsl(var(--background))',
                              padding: '0.5rem 1.25rem',
                              borderRadius: '6px',
                              fontWeight: 700,
                              fontSize: '0.85rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              boxShadow: '0 4px 10px rgba(52, 211, 153, 0.2)'
                            }}
                          >
                            <CheckCircle2 size={16} />
                            Resolve Ticket
                          </button>
                        ) : (
                          <div style={{ color: '#34d399', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <CheckCircle2 size={16} />
                            Completed
                          </div>
                        )}
                      </div>

                    </div>
                  ))
                )}
              </div>

              {/* Side Panels: Staff List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <UserCheck size={18} style={{ color: '#60a5fa' }} />
                    Support Roster
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {agents.map(a => (
                      <div key={a._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{a.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>{a.specialty}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span className="badge badge-low" style={{ display: 'inline-block', fontSize: '0.7rem' }}>
                            {a.activeTickets} active
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem', border: '1px dashed hsl(var(--border))' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem' }}>SLA Policies</h4>
                  <ul style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.8rem', paddingLeft: '1.2rem', lineHeight: 1.5 }}>
                    <li><strong style={{ color: '#f87171' }}>Critical:</strong> 4h Response</li>
                    <li><strong style={{ color: '#fbbf24' }}>High:</strong> 12h Response</li>
                    <li><strong style={{ color: '#60a5fa' }}>Medium:</strong> 24h Response</li>
                    <li><strong style={{ color: 'white' }}>Low:</strong> 48h Response</li>
                  </ul>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ========================================= */}
        {/* TABS 2: MANAGER ANALYTICS */}
        {/* ========================================= */}
        {activeTab === 'manager' && analytics && (
          <div>
            
            {/* Top row heading */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Manager & CSAT Analytics</h1>
                <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem' }}>
                  Monitor organizational response metrics, user satisfaction rankings, and ML routing logs.
                </p>
              </div>
              <button
                onClick={handleResetSystem}
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  color: '#f87171',
                  padding: '0.5rem 1.25rem',
                  borderRadius: 'var(--radius)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <RefreshCw size={14} />
                Reset Support Data
              </button>
            </div>

            {/* High level counters grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
              
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 500, letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  Overall Support Tickets
                </p>
                <h2 style={{ fontSize: '2.25rem', fontWeight: 700 }}>{analytics.summary.totalTickets}</h2>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.75rem' }}>
                  <span style={{ color: '#34d399' }}>{analytics.summary.resolvedTickets} Resolved</span>
                  <span style={{ color: '#fbbf24' }}>{analytics.summary.openTickets} Open</span>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 500, letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  SLA Compliance Rate
                </p>
                <h2 style={{ fontSize: '2.25rem', fontWeight: 700, color: analytics.summary.slaComplianceRate >= 90 ? '#34d399' : '#fbbf24' }}>
                  {analytics.summary.slaComplianceRate}%
                </h2>
                <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                  Percentage of tickets completed or open in SLA limits.
                </p>
              </div>

              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 500, letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  Customer CSAT Score
                </p>
                <h2 style={{ fontSize: '2.25rem', fontWeight: 700, color: '#c4b5fd', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  ⭐ {analytics.summary.averageCsat || '0.0'}
                </h2>
                <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                  Calculated from rating surveys out of 5 stars.
                </p>
              </div>

              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 500, letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  Active DB Mode
                </p>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#60a5fa', marginTop: '0.5rem' }}>
                  {analytics.summary.dbEngine}
                </h2>
                <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                  Database Engine running background transactions.
                </p>
              </div>

            </div>

            {/* Custom Visualizations Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
              
              {/* Category distribution chart */}
              <div className="glass-panel" style={{ padding: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Layers size={18} style={{ color: '#3b82f6' }} />
                  Ticket Category Breakdown
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {Object.keys(analytics.categoryDistribution).map((cat) => {
                    const count = analytics.categoryDistribution[cat];
                    const percent = analytics.summary.totalTickets > 0 ? (count / analytics.summary.totalTickets) * 100 : 0;
                    return (
                      <div key={cat}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                          <span>{cat}</span>
                          <strong>{count} tickets</strong>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${percent}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)', borderRadius: '4px', transition: 'width 0.5s ease' }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* CSAT Distribution chart */}
              <div className="glass-panel" style={{ padding: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Star size={18} style={{ color: '#fbbf24' }} />
                  CSAT Stars Distribution
                </h3>
                
                {/* Custom SVG Vertical Bar Chart */}
                <div style={{ height: '180px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 1rem', borderBottom: '1px solid hsl(var(--border))' }}>
                  {[5, 4, 3, 2, 1].map((star) => {
                    const val = analytics.csatDistribution[star] || 0;
                    const max = getCsatChartMax();
                    const heightPercent = (val / max) * 100;
                    
                    return (
                      <div key={star} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: val > 0 ? 'white' : 'hsl(var(--muted-foreground))' }}>{val}</span>
                        <div style={{
                          width: '32px',
                          height: `${Math.max(4, heightPercent * 1.2)}px`,
                          background: 'linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)',
                          borderRadius: '4px 4px 0 0',
                          transition: 'height 0.4s ease',
                          boxShadow: '0 4px 10px rgba(245, 158, 11, 0.15)'
                        }}></div>
                        <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', marginTop: '0.25rem' }}>{star}★</span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Performance Leaderboard Table */}
            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={18} style={{ color: '#a78bfa' }} />
                Support Agent Leaderboard
              </h3>
              
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Agent Name</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Specialty Specialty</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Active Workload</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Resolved Backlog</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Avg Speed (min)</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>CSAT Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.leaderboard.map((agent) => (
                      <tr key={agent._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '1rem', fontWeight: 600 }}>{agent.name}</td>
                        <td style={{ padding: '1rem', color: 'hsl(var(--muted-foreground))' }}>{agent.specialty}</td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <span style={{ color: agent.activeTickets > 2 ? '#fbbf24' : '#60a5fa', fontWeight: 600 }}>
                            {agent.activeTickets}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 500 }}>{agent.resolvedTickets}</td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          {agent.avgResolutionTimeMinutes ? `${agent.avgResolutionTimeMinutes} mins` : '-'}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          {agent.csat ? (
                            <span style={{ color: '#fbbf24', fontWeight: 600 }}>⭐ {agent.csat}</span>
                          ) : (
                            <span style={{ color: 'hsl(var(--muted-foreground))' }}>-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Feedbacks */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MessageSquare size={18} style={{ color: '#fbbf24' }} />
                Recent Customer Satisfaction Feedback
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
                {analytics.recentFeedback.length === 0 ? (
                  <div style={{ color: 'hsl(var(--muted-foreground))', gridColumn: '1/-1', textAlign: 'center', padding: '2rem' }}>
                    No reviews received from customers yet.
                  </div>
                ) : (
                  analytics.recentFeedback.map((f, idx) => (
                    <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.1rem' }}>
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              fill={i < f.rating ? '#fbbf24' : 'none'}
                              color="#fbbf24"
                            />
                          ))}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
                          {new Date(f.date).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <p style={{ fontSize: '0.9rem', fontStyle: 'italic', color: 'hsl(var(--foreground))', flex: 1 }}>
                        "{f.feedback || 'No written comment shared.'}"
                      </p>

                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
                        <span>Ticket: <strong style={{ color: 'white' }}>{f.ticketTitle}</strong></span>
                        <span>Agent: <strong style={{ color: '#a78bfa' }}>{f.agentName}</strong></span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
