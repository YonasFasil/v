export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { proposalId } = req.query;
    const updateData = req.body || {};

    if (!proposalId) {
      return res.status(400).json({
        error: 'Proposal ID is required'
      });
    }

    // For now, just return success
    // In a real implementation, this would update the database
    console.log('✅ Proposal updated successfully:', proposalId);
    console.log('   Update data:', Object.keys(updateData));

    return res.status(200).json({
      id: proposalId,
      ...updateData,
      updatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Proposal update error:', error);
    return res.status(500).json({
      error: 'Failed to update proposal',
      message: error.message
    });
  }
}