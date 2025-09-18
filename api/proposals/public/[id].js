const { Pool } = require('pg');
const { getDatabaseUrl } = require('../../db-config.js');

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

  let pool;

  try {
    const { id: proposalId } = req.query;

    if (!proposalId) {
      return res.status(400).json({
        error: 'Proposal ID is required'
      });
    }

    console.log('🔍 Looking up proposal in database:', proposalId);

    // Setup database connection
    const databaseUrl = getDatabaseUrl();
    if (!databaseUrl) {
      console.error('Database not configured');
      return res.status(500).json({ message: 'Database not configured' });
    }

    pool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });

    // Try to fetch the proposal from database
    const proposalQuery = await pool.query(`
      SELECT p.*,
             c.name as customer_name,
             c.email as customer_email,
             c.phone as customer_phone
      FROM proposals p
      LEFT JOIN customers c ON p.customer_id = c.id
      WHERE p.id = $1
    `, [proposalId]);

    let proposal = proposalQuery.rows[0];

    if (proposal) {
      // Format the database proposal data for the frontend
      const formattedProposal = {
        id: proposal.id,
        title: proposal.title || `Event Proposal #${proposal.id}`,
        content: proposal.content || '<p>Proposal content not available</p>',
        totalAmount: proposal.total_amount?.toString() || "0.00",
        depositAmount: proposal.deposit_amount?.toString() || "0.00",
        depositPercentage: proposal.deposit_percentage || 25,
        status: proposal.status || 'sent',
        validUntil: proposal.valid_until || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        eventType: proposal.event_type || 'corporate',
        guestCount: proposal.guest_count || 50,
        customer: {
          name: proposal.customer_name || 'Valued Customer',
          email: proposal.customer_email || 'customer@example.com',
          phone: proposal.customer_phone || '+1-555-0123'
        },
        venue: {
          name: 'Premium Event Venue',
          description: 'A stunning venue perfect for your special occasion'
        },
        space: {
          name: 'Event Space',
          description: 'Beautiful space for your event',
          capacity: 100
        },
        eventDates: [
          {
            date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            startTime: '6:00 PM',
            endTime: '11:00 PM',
            venue: 'Premium Event Venue',
            space: 'Event Space',
            guestCount: proposal.guest_count || 50,
            totalAmount: parseFloat(proposal.total_amount) || 0,
            packageDetails: {
              name: 'Event Package',
              description: 'Complete event package',
              price: parseFloat(proposal.total_amount) * 0.7 || 3500,
              pricingModel: 'fixed',
              category: 'standard'
            },
            services: [
              {
                name: 'Event Services',
                description: 'Professional event management',
                price: parseFloat(proposal.total_amount) * 0.3 || 1500,
                pricingModel: 'fixed',
                category: 'management'
              }
            ],
            notes: 'This proposal was created and sent via your event management system.',
            pricingModel: 'package'
          }
        ],
        companyInfo: {
          name: 'Venuine Events',
          address: '123 Event Plaza, City, ST 12345',
          phone: '+1-555-EVENT',
          email: 'info@venuine-events.com'
        },
        sentAt: proposal.sent_at || proposal.created_at,
        createdAt: proposal.created_at
      };

      console.log('✅ Found and returning proposal from database:', proposalId);
      return res.status(200).json(formattedProposal);
    } else {
      console.log('❌ Proposal not found in database:', proposalId);
      return res.status(404).json({
        error: 'Proposal not found',
        message: 'The proposal you are looking for does not exist or may have been removed.'
      });
    }

  } catch (error) {
    console.error('Get proposal error:', error);
    return res.status(500).json({
      error: 'Failed to get proposal',
      message: error.message
    });
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}