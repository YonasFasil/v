const { neon } = require('@neondatabase/serverless');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ message: 'Database not configured' });
    }
    
    const sql = neon(process.env.DATABASE_URL);
    
    // Extract tenant ID from auth token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const jwt = require('jsonwebtoken');
    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
    
    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    const tenantId = decoded.tenantId;
    if (!tenantId) {
      return res.status(401).json({ message: 'No tenant access' });
    }
    
    const { resource, action, id } = req.query;
    
    // INIT MODE - Create missing tables
    if (resource === 'init') {
      const results = [];
      
      try {
        // Create events table if it doesn't exist
        await sql`
          CREATE TABLE IF NOT EXISTS events (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            customer_id UUID REFERENCES customers(id),
            venue_id UUID REFERENCES venues(id),
            space_id UUID REFERENCES spaces(id),
            title TEXT NOT NULL,
            description TEXT,
            start_date DATE NOT NULL,
            end_date DATE,
            start_time TIME,
            end_time TIME,
            event_type TEXT DEFAULT 'event',
            status TEXT DEFAULT 'inquiry',
            estimated_guests INTEGER,
            actual_guests INTEGER,
            setup_style TEXT,
            special_requirements TEXT,
            catering_notes TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            is_active BOOLEAN DEFAULT true
          )
        `;
        results.push({ table: 'events', status: 'created/verified' });
      } catch (error) {
        results.push({ table: 'events', error: error.message });
      }
      
      // Add any other missing tables here if needed
      
      return res.json({
        status: 'success',
        message: 'Database initialization completed',
        results
      });
    }

    // DEBUG MODE
    if (resource === 'debug') {
      const debug = {
        tenantId,
        userInfo: {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role
        },
        tables: {}
      };
      
      try {
        // Test customers table
        const customers = await sql`SELECT COUNT(*) as count FROM customers WHERE tenant_id = ${tenantId}`;
        debug.tables.customers = { count: customers[0].count, status: 'success' };
      } catch (error) {
        debug.tables.customers = { error: error.message, status: 'failed' };
      }
      
      try {
        // Test venues table
        const venues = await sql`SELECT COUNT(*) as count FROM venues WHERE tenant_id = ${tenantId}`;
        debug.tables.venues = { count: venues[0].count, status: 'success' };
      } catch (error) {
        debug.tables.venues = { error: error.message, status: 'failed' };
      }
      
      try {
        // Test events table
        const events = await sql`SELECT COUNT(*) as count FROM events WHERE tenant_id = ${tenantId}`;
        debug.tables.events = { count: events[0].count, status: 'success' };
      } catch (error) {
        debug.tables.events = { error: error.message, status: 'failed' };
      }
      
      try {
        // Test proposals table
        const proposals = await sql`SELECT COUNT(*) as count FROM proposals WHERE tenant_id = ${tenantId}`;
        debug.tables.proposals = { count: proposals[0].count, status: 'success' };
      } catch (error) {
        debug.tables.proposals = { error: error.message, status: 'failed' };
      }
      
      try {
        // Test bookings table
        const bookings = await sql`SELECT COUNT(*) as count FROM bookings WHERE tenant_id = ${tenantId}`;
        debug.tables.bookings = { count: bookings[0].count, status: 'success' };
      } catch (error) {
        debug.tables.bookings = { error: error.message, status: 'failed' };
      }
      
      try {
        // Test table structure
        const tableInfo = await sql`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          ORDER BY table_name
        `;
        debug.availableTables = tableInfo.map(t => t.table_name);
      } catch (error) {
        debug.availableTables = { error: error.message };
      }
      
      return res.json({
        status: 'success',
        timestamp: new Date().toISOString(),
        debug
      });
    }
    
    // CUSTOMERS
    if (resource === 'customers') {
      if (req.method === 'GET') {
        const customers = await sql`
          SELECT * FROM customers 
          WHERE tenant_id = ${tenantId}
          ORDER BY created_at DESC
        `;
        return res.json(customers);
        
      } else if (req.method === 'POST') {
        const { name, email, phone, notes } = req.body;
        
        if (!name || !email) {
          return res.status(400).json({ message: 'Name and email are required' });
        }
        
        const newCustomer = await sql`
          INSERT INTO customers (
            tenant_id, name, email, phone, notes, created_at
          ) VALUES (
            ${tenantId}, ${name}, ${email}, ${phone || null}, 
            ${notes || null}, NOW()
          )
          RETURNING *
        `;
        
        return res.status(201).json(newCustomer[0]);
      }
    }
    
    // VENUES
    if (resource === 'venues') {
      if (req.method === 'GET') {
        const venues = await sql`
          SELECT * FROM venues 
          WHERE tenant_id = ${tenantId}
          ORDER BY created_at DESC
        `;
        return res.json(venues);
        
      } else if (req.method === 'POST') {
        const { name, description, capacity, price_per_hour, amenities, image_url } = req.body;
        
        if (!name || !capacity) {
          return res.status(400).json({ message: 'Venue name and capacity are required' });
        }
        
        const newVenue = await sql`
          INSERT INTO venues (
            tenant_id, name, description, capacity, price_per_hour, 
            amenities, image_url, created_at
          ) VALUES (
            ${tenantId}, ${name}, ${description || null}, ${capacity}, 
            ${price_per_hour || null}, ${amenities || null}, ${image_url || null}, 
            NOW()
          )
          RETURNING *
        `;
        
        return res.status(201).json(newVenue[0]);
      }
    }
    
    // VENUES WITH SPACES
    if (resource === 'venues-with-spaces') {
      if (req.method === 'GET') {
        const venues = await sql`
          SELECT 
            v.*,
            COALESCE(
              JSON_AGG(
                CASE 
                  WHEN s.id IS NOT NULL THEN 
                    JSON_BUILD_OBJECT(
                      'id', s.id,
                      'name', s.name,
                      'description', s.description,
                      'capacity', s.capacity,
                      'spaceType', s.space_type,
                      'amenities', s.amenities,
                      'availableSetupStyles', s.available_setup_styles,
                      'features', s.features,
                      'isActive', s.is_active
                    )
                  ELSE NULL
                END
              ) FILTER (WHERE s.id IS NOT NULL),
              '[]'
            ) as spaces
          FROM venues v
          LEFT JOIN spaces s ON v.id = s.venue_id AND s.is_active = true
          WHERE v.tenant_id = ${tenantId} AND v.is_active = true
          GROUP BY v.id
          ORDER BY v.created_at DESC
        `;
        
        return res.json(venues);
      }
    }
    
    // EVENTS
    if (resource === 'events') {
      if (req.method === 'GET') {
        const events = await sql`
          SELECT e.*, 
                 c.name as customer_name,
                 v.name as venue_name,
                 s.name as space_name
          FROM events e
          LEFT JOIN customers c ON e.customer_id = c.id
          LEFT JOIN venues v ON e.venue_id = v.id
          LEFT JOIN spaces s ON e.space_id = s.id
          WHERE e.tenant_id = ${tenantId}
          ORDER BY e.start_date DESC
        `;
        
        return res.json(events);
        
      } else if (req.method === 'POST') {
        const { 
          customer_id, venue_id, space_id, title, description,
          start_date, end_date, start_time, end_time, 
          event_type, status, estimated_guests, actual_guests,
          setup_style, special_requirements, catering_notes
        } = req.body;
        
        if (!title || !start_date || !customer_id) {
          return res.status(400).json({ message: 'Title, start date, and customer are required' });
        }
        
        const newEvent = await sql`
          INSERT INTO events (
            tenant_id, customer_id, venue_id, space_id, title, description,
            start_date, end_date, start_time, end_time, event_type, status,
            estimated_guests, actual_guests, setup_style, special_requirements,
            catering_notes, created_at
          ) VALUES (
            ${tenantId}, ${customer_id}, ${venue_id || null}, ${space_id || null},
            ${title}, ${description || null}, ${start_date}, ${end_date || null},
            ${start_time || null}, ${end_time || null}, ${event_type || 'event'},
            ${status || 'inquiry'}, ${estimated_guests || null}, ${actual_guests || null},
            ${setup_style || null}, ${special_requirements || null}, 
            ${catering_notes || null}, NOW()
          )
          RETURNING *
        `;
        
        return res.status(201).json(newEvent[0]);
      }
    }
    
    // PROPOSALS
    if (resource === 'proposals') {
      if (req.method === 'GET') {
        const proposals = await sql`
          SELECT p.*, 
                 c.name as customer_name,
                 e.title as event_title
          FROM proposals p
          LEFT JOIN customers c ON p.customer_id = c.id
          LEFT JOIN events e ON p.event_id = e.id
          WHERE p.tenant_id = ${tenantId}
          ORDER BY p.created_at DESC
        `;
        
        return res.json(proposals);
        
      } else if (req.method === 'POST') {
        const { 
          customer_id, event_id, title, description, items,
          subtotal, tax_amount, total_amount, discount_amount,
          notes, terms_conditions, status, valid_until
        } = req.body;
        
        if (!customer_id || !title) {
          return res.status(400).json({ message: 'Customer and title are required' });
        }
        
        const newProposal = await sql`
          INSERT INTO proposals (
            tenant_id, customer_id, event_id, title, description, items,
            subtotal, tax_amount, total_amount, discount_amount, notes,
            terms_conditions, status, valid_until, created_at
          ) VALUES (
            ${tenantId}, ${customer_id}, ${event_id || null}, ${title},
            ${description || null}, ${items || null}, ${subtotal || 0},
            ${tax_amount || 0}, ${total_amount || 0}, ${discount_amount || 0},
            ${notes || null}, ${terms_conditions || null}, ${status || 'draft'},
            ${valid_until || null}, NOW()
          )
          RETURNING *
        `;
        
        return res.status(201).json(newProposal[0]);
      }
    }
    
    // BOOKINGS
    if (resource === 'bookings') {
      if (req.method === 'GET') {
        const bookings = await sql`
          SELECT b.*, 
                 c.name as customer_name,
                 e.title as event_title,
                 v.name as venue_name,
                 s.name as space_name
          FROM bookings b
          LEFT JOIN customers c ON b.customer_id = c.id
          LEFT JOIN events e ON b.event_id = e.id
          LEFT JOIN venues v ON b.venue_id = v.id
          LEFT JOIN spaces s ON b.space_id = s.id
          WHERE b.tenant_id = ${tenantId}
          ORDER BY b.booking_date DESC
        `;
        
        return res.json(bookings);
        
      } else if (req.method === 'POST') {
        const { 
          customer_id, event_id, venue_id, space_id, booking_date,
          start_time, end_time, status, total_amount, deposit_amount,
          payment_status, notes, cancellation_policy
        } = req.body;
        
        if (!customer_id || !booking_date) {
          return res.status(400).json({ message: 'Customer and booking date are required' });
        }
        
        const newBooking = await sql`
          INSERT INTO bookings (
            tenant_id, customer_id, event_id, venue_id, space_id,
            booking_date, start_time, end_time, status, total_amount,
            deposit_amount, payment_status, notes, cancellation_policy,
            created_at
          ) VALUES (
            ${tenantId}, ${customer_id}, ${event_id || null}, ${venue_id || null},
            ${space_id || null}, ${booking_date}, ${start_time || null},
            ${end_time || null}, ${status || 'pending'}, ${total_amount || 0},
            ${deposit_amount || 0}, ${payment_status || 'unpaid'}, 
            ${notes || null}, ${cancellation_policy || null}, NOW()
          )
          RETURNING *
        `;
        
        return res.status(201).json(newBooking[0]);
      }
    }
    
    return res.status(404).json({ message: 'Resource not found' });
    
  } catch (error) {
    console.error('Tenant API error:', error);
    res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message 
    });
  }
};