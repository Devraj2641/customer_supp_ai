import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Send, CheckCircle2, Star, ChevronLeft, Ticket as TicketIcon, Clock, ShieldAlert, Sparkles, MessageSquare } from 'lucide-react';

export default function CustomerPortal() {
  const [tickets, setTickets] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackTicketId, setFeedbackTicketId] = useState(null);
  const [rating, setRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  
  // State for the AI routing details modal/popup
  const [routingModalData, setRoutingModalData] = useState(null);
  const [isRoutingModalOpen, setIsRoutingModalOpen] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = () => {
    fetch('http://127.0.0.1:4000/api/tickets')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTickets(data);
        }
      })
      .catch(err => console.error('Error fetching tickets:', err));
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('http://127.0.0.1:4000/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description })
      });
      const data = await res.json();
      
      if (res.ok) {
        setTitle('');
        setDescription('');
        // Save the routing details to display in the micro-animation modal
        setRoutingModalData(data.routingDetails);
        setIsRoutingModalOpen(true);
        fetchTickets();
      } else {
        alert('Failed to submit ticket: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error creating ticket:', err);
      alert('Error connecting to support backend.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackTicketId) return;

    try {
      const res = await fetch(`http://127.0.0.1:4000/api/tickets/${feedbackTicketId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, feedback: feedbackText })
      });
      if (res.ok) {
        setFeedbackTicketId(null);
        setRating(5);
        setFeedbackText('');
        fetchTickets();
      } else {
        const errData = await res.json();
        alert('Failed to log feedback: ' + errData.error);
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
    }
  };

  const getPriorityBadgeClass = (p) => {
    if (p === 'Critical') return 'badge badge-critical';
    if (p === 'High') return 'badge badge-high';
    if (p === 'Medium') return 'badge badge-medium';
    return 'badge badge-low';
  };

  const getStatusBadgeClass = (s) => {
    if (s === 'Resolved') return 'badge-normal-sla';
    return 'badge-warning-sla';
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'hsl(var(--background))' }}>
      <Head>
        <title>Customer Helpdesk | AutoRoute AI</title>
      </Head>

      {/* Navigation bar */}
      <nav style={{ borderBottom: '1px solid hsl(var(--border))', background: 'rgba(8, 14, 28, 0.8)', padding: '1rem 2rem', backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#60a5fa', textDecoration: 'none', fontWeight: 500, fontSize: '0.95rem' }}>
            <ChevronLeft size={18} />
            Back to Home
          </Link>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TicketIcon size={20} style={{ color: '#3b82f6' }} />
            Customer Support Center
          </h2>
          <div style={{ width: '80px' }}></div> {/* Spacer */}
        </div>
      </nav>

      {/* Main Container */}
      <main style={{ flex: 1, padding: '2.5rem 1.5rem', maxWidth: '1200px', margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2.5rem' }}>
        
        {/* Left Side: Submit Form */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel glow-card-primary" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Send size={20} style={{ color: '#60a5fa' }} />
              Submit a Support Ticket
            </h3>
            <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Describe your issue. Our AI routes the ticket based on natural language categorization.
            </p>

            <form onSubmit={handleCreateTicket} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.5rem', color: 'hsl(var(--foreground))' }}>
                  Ticket Title
                </label>
                <input
                  type="text"
                  placeholder="e.g., Charged twice for June subscription"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.5rem', color: 'hsl(var(--foreground))' }}>
                  Describe the Issue
                </label>
                <textarea
                  rows={6}
                  placeholder="Provide as much detail as possible. E.g. what happened, account emails, transaction IDs, or error message screenshots..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: 'var(--radius)',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)',
                  opacity: isSubmitting ? 0.7 : 1
                }}
              >
                {isSubmitting ? (
                  <>
                    <span className="pulse-dot" style={{ backgroundColor: 'white', color: 'white' }}></span>
                    Analyzing ticket...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Submit Request
                  </>
                )}
              </button>
            </form>
          </div>
        </section>

        {/* Right Side: Submitted Tickets Queue */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TicketIcon size={22} style={{ color: '#a78bfa' }} />
            Your Ticket History
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '70vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
            {tickets.length === 0 ? (
              <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>
                <TicketIcon size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                <p>No support tickets filed yet. Use the form to submit one.</p>
              </div>
            ) : (
              tickets.map((t) => (
                <div key={t._id} className="glass-panel" style={{ padding: '1.5rem', position: 'relative' }}>
                  
                  {/* Top line with status & priority badges */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <span className={getPriorityBadgeClass(t.priority)}>{t.priority}</span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <span className={`badge ${t.status === 'Resolved' ? 'badge-normal-sla' : 'badge-warning-sla'}`}>{t.status}</span>
                      <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        {t.category}
                      </span>
                    </div>
                  </div>

                  <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>{t.title}</h4>
                  <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem', lineHeight: 1.4, marginBottom: '1rem', whiteSpace: 'pre-wrap' }}>
                    {t.description}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', borderTop: '1px solid hsl(var(--border))', paddingTop: '0.75rem', fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={14} />
                      {new Date(t.createdAt).toLocaleDateString()}
                    </span>
                    <span>Assigned to: <strong style={{ color: 'hsl(var(--foreground))' }}>{t.agentName}</strong></span>
                  </div>

                  {/* CSAT Feedback trigger button */}
                  {t.status === 'Resolved' && t.csatRating === null && (
                    <div style={{ marginTop: '1rem', borderTop: '1px dashed hsl(var(--border))', paddingTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => setFeedbackTicketId(t._id)}
                        style={{
                          background: 'rgba(167, 139, 250, 0.1)',
                          color: '#c4b5fd',
                          border: '1px solid rgba(167, 139, 250, 0.2)',
                          padding: '0.4rem 0.8rem',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        <Star size={14} fill="#a78bfa" />
                        Share Satisfaction Rating
                      </button>
                    </div>
                  )}

                  {/* CSAT Displayed if rated */}
                  {t.csatRating !== null && (
                    <div style={{ marginTop: '0.75rem', borderTop: '1px solid rgba(16, 185, 129, 0.1)', paddingTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#34d399' }}>
                      <CheckCircle2 size={14} />
                      <span>CSAT Logged:</span>
                      <div style={{ display: 'flex', gap: '0.1rem' }}>
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            fill={i < t.csatRating ? '#34d399' : 'none'}
                            color="#34d399"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* RATING MODAL (CSAT SUBMISSION) */}
      {feedbackTicketId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyCenter: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="glass-panel" style={{ padding: '2rem', maxWidth: '480px', width: '100%', margin: '0 auto' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageSquare size={18} style={{ color: '#a78bfa' }} />
              How was your support experience?
            </h3>
            <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Your feedback is crucial to evaluate our support agents and ML routing algorithms.
            </p>

            <form onSubmit={handleFeedbackSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Star selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                  Satisfaction Rating
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      style={{ background: 'none', border: 'none', padding: 0 }}
                    >
                      <Star
                        size={32}
                        fill={star <= rating ? '#fbbf24' : 'none'}
                        color={star <= rating ? '#fbbf24' : 'hsl(var(--border))'}
                        style={{ cursor: 'pointer', transition: 'transform 0.1s ease' }}
                      />
                    </button>
                  ))}
                </div>
                <span style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', display: 'block', marginTop: '0.25rem' }}>
                  {rating === 5 && 'Excellent - Beyond expectations'}
                  {rating === 4 && 'Good - Fully satisfied'}
                  {rating === 3 && 'Average - Met requirements'}
                  {rating === 2 && 'Poor - Unresolved issues or delayed response'}
                  {rating === 1 && 'Terrible - Very dissatisfied'}
                </span>
              </div>

              {/* Written feedback */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                  Written Review (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Share details about the speed, agent behavior, or final resolution quality..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                />
              </div>

              {/* Form buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setFeedbackTicketId(null)}
                  style={{
                    background: 'none',
                    border: '1px solid hsl(var(--border))',
                    color: 'hsl(var(--foreground))',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    fontSize: '0.9rem'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    boxShadow: '0 4px 10px rgba(139, 92, 246, 0.25)'
                  }}
                >
                  Save Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI ROUTING VISUALIZATION MODAL */}
      {isRoutingModalOpen && routingModalData && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="glass-panel" style={{ padding: '2.5rem 2rem', maxWidth: '500px', width: '100%', margin: '0 auto', textAlign: 'center', animation: 'scale-up 0.3s' }}>
            
            <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '50%', color: '#60a5fa', marginBottom: '1.25rem' }}>
              <Sparkles size={36} className="pulse-dot" style={{ color: '#60a5fa', background: 'none' }} />
            </div>

            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem', color: '#60a5fa' }}>AI Routing Successful</h3>
            <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem', marginBottom: '2rem' }}>
              Our Natural Language Processor completed the routing flow.
            </p>

            {/* Step-by-Step AI Decision logs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(4, 7, 15, 0.4)', padding: '1.25rem', borderRadius: 'var(--radius)', border: '1px solid hsl(var(--border))', textAlign: 'left', marginBottom: '2rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'hsl(var(--muted-foreground))' }}>Classification System:</span>
                <span style={{ fontWeight: 600, color: '#34d399' }}>{routingModalData.classificationSource}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'hsl(var(--muted-foreground))' }}>Predicted Category:</span>
                <span style={{ fontWeight: 600, color: '#93c5fd' }}>{routingModalData.classifiedCategory}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'hsl(var(--muted-foreground))' }}>Model Confidence:</span>
                <span style={{ fontWeight: 600 }}>{Math.round(routingModalData.confidence * 100)}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'hsl(var(--muted-foreground))' }}>SLA Target Commitment:</span>
                <span style={{ fontWeight: 600, color: routingModalData.priority === 'Critical' ? '#f87171' : '#fbbf24' }}>
                  {routingModalData.priority} Priority
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'hsl(var(--muted-foreground))' }}>Routed To Specialist:</span>
                <span style={{ fontWeight: 600, color: '#a78bfa' }}>{routingModalData.assignedAgent}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setIsRoutingModalOpen(false);
                setRoutingModalData(null);
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.15)',
                padding: '0.6rem 2rem',
                borderRadius: 'var(--radius)',
                fontWeight: 600,
                fontSize: '0.9rem',
                width: '100%'
              }}
            >
              Continue to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
