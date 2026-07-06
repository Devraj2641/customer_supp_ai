const axios = require('axios');

async function runVerification() {
  console.log('=== STARTING BACKEND END-TO-END VERIFICATION ===');
  
  const BASE_URL = 'http://127.0.0.1:4000/api';
  
  try {
    // 1. Reset database to starting demo state
    console.log('\n[STEP 1] Resetting database...');
    const resetRes = await axios.post(`${BASE_URL}/reset`);
    console.log('Response:', resetRes.data);

    // 2. Submit a new support ticket representing an account issue
    console.log('\n[STEP 2] Submitting support ticket...');
    const ticketPayload = {
      title: 'Locked out of account - reset code not arriving',
      description: 'I cannot login to my account. I requested a password reset code but it has not arrived in my email inbox after 15 minutes.'
    };
    
    const ticketRes = await axios.post(`${BASE_URL}/tickets`, ticketPayload);
    console.log('Response status:', ticketRes.status);
    console.log('Routing Details:', ticketRes.data.routingDetails);
    
    const ticket = ticketRes.data.ticket;
    console.log('Created Ticket ID:', ticket._id);
    console.log('Classified Category:', ticket.category);
    console.log('Model Confidence:', ticket.confidence);
    console.log('Assigned Priority:', ticket.priority);
    console.log('Assigned Agent:', ticket.agentName);
    console.log('SLA Deadline:', ticket.slaDeadline);

    if (ticket.category !== 'Account & Access') {
      throw new Error(`AI Router expected category 'Account & Access' but got '${ticket.category}'`);
    }
    if (ticket.agentName !== 'Charlie Brown') {
      throw new Error(`AI Router expected agent 'Charlie Brown' but got '${ticket.agentName}'`);
    }
    console.log('✓ AI Routing and SLA Target Assignment Verified!');

    // 3. Resolve the ticket
    console.log('\n[STEP 3] Resolving the ticket...');
    const resolveRes = await axios.post(`${BASE_URL}/tickets/${ticket._id}/resolve`);
    console.log('Response:', resolveRes.data.message);
    console.log('Resolution Time (mins):', resolveRes.data.ticket.resolutionTime);
    console.log('SLA Status at Resolution:', resolveRes.data.ticket.slaStatus);
    
    if (resolveRes.data.ticket.status !== 'Resolved') {
      throw new Error('Ticket status should be Resolved');
    }
    console.log('✓ Ticket Resolution Verified!');

    // 4. Log customer CSAT feedback
    console.log('\n[STEP 4] Logging CSAT feedback...');
    const feedbackPayload = {
      rating: 5,
      feedback: 'Charlie resolved this in record time, amazing!'
    };
    const feedbackRes = await axios.post(`${BASE_URL}/tickets/${ticket._id}/feedback`, feedbackPayload);
    console.log('Response:', feedbackRes.data.message);
    console.log('CSAT Rating logged:', feedbackRes.data.ticket.csatRating);
    console.log('CSAT Comment logged:', feedbackRes.data.ticket.csatFeedback);
    
    if (feedbackRes.data.ticket.csatRating !== 5) {
      throw new Error('CSAT Rating was not logged as 5');
    }
    console.log('✓ CSAT Feedback Logged and Verified!');

    // 5. Fetch Manager Analytics and verify updates
    console.log('\n[STEP 5] Fetching manager analytics dashboard...');
    const analyticsRes = await axios.get(`${BASE_URL}/analytics`);
    const summary = analyticsRes.data.summary;
    console.log('Summary metrics:', summary);
    console.log('Category Distribution:', analyticsRes.data.categoryDistribution);
    console.log('CSAT Stars Distribution:', analyticsRes.data.csatDistribution);
    
    const charlieLeaderboard = analyticsRes.data.leaderboard.find(a => a.name === 'Charlie Brown');
    console.log('Charlie leaderboard stats:', charlieLeaderboard);

    if (summary.totalTickets !== 11) { // 10 seeded + 1 newly added
      throw new Error(`Expected 11 total tickets but analytics reported ${summary.totalTickets}`);
    }
    
    console.log('✓ Manager Analytics Dashboard Integration Verified!');
    console.log('\n=== ALL VERIFICATION TASKS COMPLETED SUCCESSFULLY! ===');
    
  } catch (err) {
    console.error('\n❌ VERIFICATION FAILED:', err.message);
    if (err.response) {
      console.error('API Error Response:', err.response.data);
    }
  }
}

runVerification();
