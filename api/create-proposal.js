export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      customerId,
      title,
      content,
      totalAmount,
      validUntil,
      status = 'sent',
      sentAt,
      eventType = 'corporate',
      guestCount = 1,
      depositPercentage = 25,
      depositAmount
    } = req.body || {};

    if (!customerId || !title || !content) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['customerId', 'title', 'content']
      });
    }

    // For now, create a simple proposal object with ID
    // In a real implementation, this would save to database
    const proposalId = 'prop_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    const proposal = {
      id: proposalId,
      customerId,
      title,
      content,
      totalAmount: parseFloat(totalAmount) || 0,
      validUntil: validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status,
      sentAt: sentAt || new Date().toISOString(),
      eventType,
      guestCount: parseInt(guestCount) || 1,
      depositPercentage: parseFloat(depositPercentage) || 25,
      depositAmount: parseFloat(depositAmount) || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Store the proposal in global storage so it can be retrieved
    global.proposalStorage = global.proposalStorage || new Map();
    global.proposalStorage.set(proposalId, proposal);

    console.log('✅ Proposal created and stored:', proposalId);
    console.log('📋 Total proposals in storage:', global.proposalStorage.size);

    return res.status(201).json(proposal);

  } catch (error) {
    console.error('Proposal creation error:', error);
    return res.status(500).json({
      error: 'Failed to create proposal',
      message: error.message
    });
  }
}