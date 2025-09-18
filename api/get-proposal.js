export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { proposalId } = req.query;

    if (!proposalId) {
      return res.status(400).json({
        error: 'Proposal ID is required'
      });
    }

    console.log('🔍 Looking up proposal:', proposalId);

    // For now, return a mock proposal that matches the structure expected by the proposal-view page
    // In a real implementation, this would fetch from database
    const proposal = {
      id: proposalId,
      title: `Proposal for Your Special Event`,
      content: `<p>This is a beautiful event proposal crafted specifically for you.</p>`,
      totalAmount: "5000.00",
      depositAmount: "1500.00",
      depositPercentage: 30,
      status: 'sent',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      eventType: 'corporate',
      guestCount: 50,
      customer: {
        name: 'Valued Customer',
        email: 'customer@example.com',
        phone: '+1-555-0123'
      },
      venue: {
        name: 'Premium Event Venue',
        description: 'A stunning venue perfect for your special occasion'
      },
      space: {
        name: 'Grand Ballroom',
        description: 'Elegant ballroom with capacity for up to 100 guests',
        capacity: 100
      },
      eventDates: [
        {
          date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks from now
          startTime: '6:00 PM',
          endTime: '11:00 PM',
          venue: 'Premium Event Venue',
          space: 'Grand Ballroom',
          guestCount: 50,
          totalAmount: 5000,
          packageDetails: {
            name: 'Premium Event Package',
            description: 'Complete event management with premium services',
            price: 3500,
            pricingModel: 'fixed',
            category: 'premium',
            services: ['catering', 'decoration', 'photography']
          },
          setupStyle: {
            name: 'Elegant Reception',
            description: 'Round tables with premium linens and centerpieces',
            category: 'formal',
            capacity: {
              min: 30,
              max: 100
            }
          },
          services: [
            {
              name: 'Premium Catering Service',
              description: 'Three-course plated dinner with wine service',
              price: 1200,
              pricingModel: 'per_person',
              category: 'catering',
              duration: '4 hours'
            },
            {
              name: 'Professional Photography',
              description: 'Full event coverage with edited gallery',
              price: 800,
              pricingModel: 'fixed',
              category: 'photography',
              duration: '6 hours'
            }
          ],
          notes: 'All dietary restrictions will be accommodated. Setup begins 2 hours before event start.',
          pricingModel: 'package'
        }
      ],
      companyInfo: {
        name: 'Venuine Events',
        address: '123 Event Plaza, City, ST 12345',
        phone: '+1-555-EVENT',
        email: 'info@venuine-events.com'
      },
      sentAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    console.log('✅ Returning proposal data for:', proposalId);

    return res.status(200).json(proposal);

  } catch (error) {
    console.error('Get proposal error:', error);
    return res.status(500).json({
      error: 'Failed to get proposal',
      message: error.message
    });
  }
}