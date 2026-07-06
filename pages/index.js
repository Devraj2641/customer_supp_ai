import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { LifeBuoy, ShieldAlert, BarChart3, Users, Network, Activity } from 'lucide-react';

export default function Home() {
  const [stats, setStats] = useState({
    totalTickets: 0,
    openTickets: 0,
    slaCompliance: 100,
    averageCsat: 0,
    dbEngine: 'Loading...'
  });

  useEffect(() => {
    // Fetch overview statistics for the landing page
    fetch('http://127.0.0.1:4000/api/analytics')
      .then(res => res.json())
      .then(data => {
        if (data && data.summary) {
          setStats({
            totalTickets: data.summary.totalTickets,
            openTickets: data.summary.openTickets,
            slaCompliance: data.summary.slaComplianceRate,
            averageCsat: data.summary.averageCsat,
            dbEngine: data.summary.dbEngine
          });
        }
      })
      .catch(err => {
        console.warn('Analytics fetch failed, backend might be starting up:', err);
        setStats(prev => ({ ...prev, dbEngine: 'Offline' }));
      });
  }, []);

  return (
    <div className="container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Head>
        <title>AutoRoute AI | Support Ticket Center</title>
        <meta name="description" content="AI-Powered Ticket Routing, SLA Tracking and Customer Support Dashboards" />
      </Head>

      {/* Main content wrapper */}
      <main style={{ flex: 1, padding: '2rem 1.5rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        
        {/* Header Hero */}
        <header style={{ textAlign: 'center', margin: '4rem 0 3rem 0' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', padding: '0.5rem 1rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '9999px' }}>
            <span className="pulse-dot" style={{ color: '#60a5fa', backgroundColor: '#3b82f6' }}></span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.05em', color: '#93c5fd', textTransform: 'uppercase' }}>AutoRoute AI Active</span>
          </div>
          <h1 style={{ fontSize: '3rem', fontWeight: 700, marginBottom: '1rem', lineHeight: 1.2 }}>
            Smart Customer Support <span className="gradient-text-blue">Ticketing System</span>
          </h1>
          <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '1.2rem', maxWidth: '700px', margin: '0 auto', fontWeight: 300 }}>
            Automate ticket routing with machine learning, track SLA deadlines in real-time, and monitor agent performance with high-fidelity analytics dashboards.
          </p>
        </header>

        {/* System Health Indicators */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '4rem' }}>
          <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Active Engine</p>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#60a5fa' }}>{stats.dbEngine}</h4>
          </div>
          <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>SLA Compliance</p>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: stats.slaCompliance >= 90 ? '#34d399' : '#fbbf24' }}>{stats.slaCompliance}%</h4>
          </div>
          <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Average CSAT</p>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#a78bfa' }}>{stats.averageCsat ? `⭐ ${stats.averageCsat} / 5` : 'No reviews yet'}</h4>
          </div>
          <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Open Tickets</p>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{stats.openTickets} tickets</h4>
          </div>
        </div>

        {/* Portals Choices grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
          
          {/* Choice 1: Customer Portal */}
          <Link href="/customer" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="glass-panel glow-card-primary" style={{ padding: '2.5rem 2rem', height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}>
              <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: 'var(--radius)', border: '1px solid rgba(59, 130, 246, 0.15)', width: 'fit-content', marginBottom: '1.5rem', color: '#60a5fa' }}>
                <LifeBuoy size={28} />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.75rem' }}>Customer Portal</h3>
              <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.95rem', lineHeight: 1.5, flex: 1 }}>
                File support requests instantly. Our natural language AI will automatically classify your request and assign it to the most relevant agent. Give feedback on resolved issues.
              </p>
              <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#60a5fa', fontWeight: 500, fontSize: '0.95rem' }}>
                <span>Access Support Panel</span>
                <span>→</span>
              </div>
            </div>
          </Link>

          {/* Choice 2: Support Staff Console */}
          <Link href="/dashboard?tab=agent" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="glass-panel glow-card-accent" style={{ padding: '2.5rem 2rem', height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}>
              <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: 'var(--radius)', border: '1px solid rgba(139, 92, 246, 0.15)', width: 'fit-content', marginBottom: '1.5rem', color: '#a78bfa' }}>
                <Users size={28} />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.75rem' }}>Agent Console</h3>
              <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.95rem', lineHeight: 1.5, flex: 1 }}>
                Access the agent workspace queue. View SLA countdown meters (green, warning amber, critical red) and easily resolve issues. See AI confidence parameters.
              </p>
              <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a78bfa', fontWeight: 500, fontSize: '0.95rem' }}>
                <span>Access Agent Queue</span>
                <span>→</span>
              </div>
            </div>
          </Link>

          {/* Choice 3: Manager Dashboard */}
          <Link href="/dashboard?tab=manager" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="glass-panel glow-card-primary" style={{ padding: '2.5rem 2rem', height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}>
              <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(251, 191, 36, 0.1)', borderRadius: 'var(--radius)', border: '1px solid rgba(251, 191, 36, 0.15)', width: 'fit-content', marginBottom: '1.5rem', color: '#fbbf24' }}>
                <BarChart3 size={28} />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.75rem' }}>Analytics Dashboard</h3>
              <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.95rem', lineHeight: 1.5, flex: 1 }}>
                View managerial overview. Inspect agent leaderboard sorted by resolved tickets, average resolution speed, and CSAT. Audit category distribution, reviews, and SLA compliance metrics.
              </p>
              <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fbbf24', fontWeight: 500, fontSize: '0.95rem' }}>
                <span>Inspect Analytics</span>
                <span>→</span>
              </div>
            </div>
          </Link>

        </div>

        {/* Feature Highlights Grid */}
        <section style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: '4rem', marginBottom: '3rem' }}>
          <h4 style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 600, marginBottom: '2.5rem' }}>Smart Support Engineering Features</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ color: '#60a5fa', flexShrink: 0 }}><Network size={20} /></div>
              <div>
                <h5 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>AI-Powered Routing</h5>
                <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.85rem', lineHeight: 1.4 }}>Categorizes tickets automatically with 90%+ accuracy and assigns them based on agent specialty and load.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ color: '#fbbf24', flexShrink: 0 }}><ShieldAlert size={20} /></div>
              <div>
                <h5 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>Dynamic SLA Deadlines</h5>
                <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.85rem', lineHeight: 1.4 }}>Updates warnings and breach states in real-time, enforcing priority commitments (Critical = 4 hours).</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ color: '#a78bfa', flexShrink: 0 }}><Users size={20} /></div>
              <div>
                <h5 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>Agent Leaderboard</h5>
                <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.85rem', lineHeight: 1.4 }}>Tracks agent output metrics, including ticket counts resolved, workload load balances, and response velocities.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ color: '#34d399', flexShrink: 0 }}><Activity size={20} /></div>
              <div>
                <h5 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>CSAT Survey Loops</h5>
                <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.85rem', lineHeight: 1.4 }}>Gathers feedback from customers automatically upon resolution to evaluate product support health.</p>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '2rem 1rem', borderTop: '1px solid hsl(var(--border))', background: 'rgba(4, 7, 15, 0.4)' }}>
        <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.85rem' }}>
          AutoRoute AI © 2026. Made with Next.js, FastAPI (Python), and Node.js.
        </p>
      </footer>
    </div>
  );
}
