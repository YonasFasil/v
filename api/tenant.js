const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const { getDatabaseUrl } = require('./db-config.js');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  let pool;
  
  try {
    const databaseUrl = getDatabaseUrl();
    if (!databaseUrl) {
      return res.status(500).json({ message: 'Database not configured' });
    }
    
    // Extract tenant ID from auth token first
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ message: 'JWT secret not configured' });
    }
    
    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    const tenantId = decoded.tenantId;
    const userRole = decoded.role || 'tenant_user';
    if (!tenantId) {
      return res.status(401).json({ message: 'No tenant access' });
    }
    
    // Setup database connection
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });
    
    const { resource, action, id } = req.query;
    
    // INIT MODE - Create missing tables
    if (resource === 'init') {
      const results = [];
      
      try {
        // Create events table if it doesn't exist
        await pool.query(`CREATE TABLE IF NOT EXISTS events (
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
          )`);
        results.push({ table: 'events', status: 'created/verified' });
      } catch (error) {
        results.push({ table: 'events', error: error.message });
      }
      
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
        const customers = await pool.query(`SELECT COUNT(*) as count FROM customers WHERE tenant_id = $1`, [tenantId]);
        debug.tables.customers = { count: customers.rows[0].count, status: 'success' };
      } catch (error) {
        debug.tables.customers = { error: error.message, status: 'failed' };
      }
      
      try {
        // Test venues table
        const venues = await pool.query(`SELECT COUNT(*) as count FROM venues WHERE tenant_id = $1`, [tenantId]);
        debug.tables.venues = { count: venues.rows[0].count, status: 'success' };
      } catch (error) {
        debug.tables.venues = { error: error.message, status: 'failed' };
      }
      
      try {
        // Test events table
        const events = await pool.query(`SELECT COUNT(*) as count FROM events WHERE tenant_id = $1`, [tenantId]);
        debug.tables.events = { count: events.rows[0].count, status: 'success' };
      } catch (error) {
        debug.tables.events = { error: error.message, status: 'failed' };
      }
      
      try {
        // Test proposals table
        const proposals = await pool.query(`SELECT COUNT(*) as count FROM proposals WHERE tenant_id = $1`, [tenantId]);
        debug.tables.proposals = { count: proposals.rows[0].count, status: 'success' };
      } catch (error) {
        debug.tables.proposals = { error: error.message, status: 'failed' };
      }
      
      try {
        // Test bookings table
        const bookings = await pool.query(`SELECT COUNT(*) as count FROM bookings WHERE tenant_id = $1`, [tenantId]);
        debug.tables.bookings = { count: bookings.rows[0].count, status: 'success' };
      } catch (error) {
        debug.tables.bookings = { error: error.message, status: 'failed' };
      }
      
      try {
        // Test table structure
        const tableInfo = await pool.query(`SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          ORDER BY table_name`);
        debug.availableTables = tableInfo.rows.map(t => t.table_name);
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
        const customers = await pool.query(`SELECT * FROM customers 
          WHERE tenant_id = $1
          ORDER BY created_at DESC`, [tenantId]);
        return res.json(customers.rows);
        
      } else if (req.method === 'POST') {
        const { name, email, phone, notes } = req.body;
        
        if (!name || !email) {
          return res.status(400).json({ message: 'Name and email are required' });
        }
        
        const newCustomer = await pool.query(`INSERT INTO customers (
            tenant_id, name, email, phone, notes, created_at
          ) VALUES ($1, $2, $3, $4, $5, NOW())
          RETURNING *`, [tenantId, name, email, phone || null, notes || null]);
        
        return res.status(201).json(newCustomer.rows[0]);
      }
    }
    
    // VENUES
    if (resource === 'venues') {
      if (req.method === 'GET') {
        if (id) {
          // Get specific venue
          const venue = await pool.query(`SELECT * FROM venues 
            WHERE tenant_id = $1 AND id = $2`, [tenantId, id]);
          return res.json(venue.rows[0] || null);
        } else {
          // Get all venues
          const venues = await pool.query(`SELECT * FROM venues 
            WHERE tenant_id = $1
            ORDER BY created_at DESC`, [tenantId]);
          return res.json(venues.rows);
        }
      }
    }
    
    // BOOKINGS
    if (resource === 'bookings') {
      if (req.method === 'GET') {
        const bookings = await pool.query(`SELECT b.*, 
                 c.name as customer_name,
                 v.name as venue_name,
                 s.name as space_name
          FROM bookings b
          LEFT JOIN customers c ON b.customer_id = c.id
          LEFT JOIN venues v ON b.venue_id = v.id
          LEFT JOIN spaces s ON b.space_id = s.id
          WHERE b.tenant_id = $1
          ORDER BY b.event_date DESC`, [tenantId]);
        
        return res.json(bookings.rows);
      }
    }
    
    // PACKAGES
    if (resource === 'packages') {
      if (req.method === 'GET') {
        const packages = await pool.query(`SELECT * FROM packages 
          WHERE tenant_id = $1 AND is_active = true
          ORDER BY created_at DESC`, [tenantId]);
        return res.json(packages.rows);
        
      } else if (req.method === 'POST') {
        const { 
          name, description, category, price, pricingModel, 
          includedServiceIds, enabledTaxIds, enabledFeeIds 
        } = req.body;
        
        if (!name || price == null) {
          return res.status(400).json({ message: 'Name and price are required' });
        }
        
        const newPackage = await pool.query(`INSERT INTO packages (
            tenant_id, name, description, category, price, pricing_model, 
            included_service_ids, enabled_tax_ids, enabled_fee_ids, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
          RETURNING *`, [
            tenantId, name, description || null, category || 'general', 
            price, pricingModel || 'fixed',
            includedServiceIds || [], enabledTaxIds || [], enabledFeeIds || []
          ]);
        
        return res.status(201).json(newPackage.rows[0]);
        
      } else if (req.method === 'PUT' && id) {
        const { 
          name, description, category, price, pricingModel,
          includedServiceIds, enabledTaxIds, enabledFeeIds 
        } = req.body;
        
        const updatedPackage = await pool.query(`UPDATE packages 
          SET name = $1, description = $2, category = $3, price = $4, 
              pricing_model = $5, included_service_ids = $6, 
              enabled_tax_ids = $7, enabled_fee_ids = $8
          WHERE tenant_id = $9 AND id = $10
          RETURNING *`, [
            name, description, category, price, pricingModel,
            includedServiceIds || [], enabledTaxIds || [], enabledFeeIds || [],
            tenantId, id
          ]);
        
        if (updatedPackage.rows.length === 0) {
          return res.status(404).json({ message: 'Package not found' });
        }
        
        return res.json(updatedPackage.rows[0]);
        
      } else if (req.method === 'DELETE' && id) {
        const deletedPackage = await pool.query(`UPDATE packages 
          SET is_active = false 
          WHERE tenant_id = $1 AND id = $2
          RETURNING *`, [tenantId, id]);
        
        if (deletedPackage.rows.length === 0) {
          return res.status(404).json({ message: 'Package not found' });
        }
        
        return res.json({ message: 'Package deleted successfully' });
      }
    }
    
    // SERVICES
    if (resource === 'services') {
      if (req.method === 'GET') {
        const services = await pool.query(`SELECT * FROM services 
          WHERE tenant_id = $1 AND is_active = true
          ORDER BY created_at DESC`, [tenantId]);
        return res.json(services.rows);
        
      } else if (req.method === 'POST') {
        const { 
          name, description, category, price, pricingModel,
          enabledTaxIds, enabledFeeIds 
        } = req.body;
        
        if (!name || price == null) {
          return res.status(400).json({ message: 'Name and price are required' });
        }
        
        const newService = await pool.query(`INSERT INTO services (
            tenant_id, name, description, category, price, pricing_model, 
            enabled_tax_ids, enabled_fee_ids, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
          RETURNING *`, [
            tenantId, name, description || null, category || 'additional', 
            price, pricingModel || 'fixed',
            enabledTaxIds || [], enabledFeeIds || []
          ]);
        
        return res.status(201).json(newService.rows[0]);
        
      } else if (req.method === 'PUT' && id) {
        const { 
          name, description, category, price, pricingModel,
          enabledTaxIds, enabledFeeIds 
        } = req.body;
        
        const updatedService = await pool.query(`UPDATE services 
          SET name = $1, description = $2, category = $3, price = $4, 
              pricing_model = $5, enabled_tax_ids = $6, enabled_fee_ids = $7
          WHERE tenant_id = $8 AND id = $9
          RETURNING *`, [
            name, description, category, price, pricingModel,
            enabledTaxIds || [], enabledFeeIds || [],
            tenantId, id
          ]);
        
        if (updatedService.rows.length === 0) {
          return res.status(404).json({ message: 'Service not found' });
        }
        
        return res.json(updatedService.rows[0]);
        
      } else if (req.method === 'DELETE' && id) {
        const deletedService = await pool.query(`UPDATE services 
          SET is_active = false 
          WHERE tenant_id = $1 AND id = $2
          RETURNING *`, [tenantId, id]);
        
        if (deletedService.rows.length === 0) {
          return res.status(404).json({ message: 'Service not found' });
        }
        
        return res.json({ message: 'Service deleted successfully' });
      }
    }
    
    // TAX SETTINGS
    if (resource === 'tax-settings') {
      if (req.method === 'GET') {
        const taxSettings = await pool.query(`SELECT * FROM tax_settings 
          WHERE tenant_id = $1 AND is_active = true
          ORDER BY type, name`, [tenantId]);
        return res.json(taxSettings.rows);
        
      } else if (req.method === 'POST') {
        const { name, type, calculation, value, applyTo, isTaxable, applicableTaxIds } = req.body;
        
        if (!name || !type || !calculation || value == null || !applyTo) {
          return res.status(400).json({ message: 'Required fields missing' });
        }
        
        const newTaxSetting = await pool.query(`INSERT INTO tax_settings (
            tenant_id, name, type, calculation, value, apply_to, 
            is_taxable, applicable_tax_ids, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
          RETURNING *`, [
            tenantId, name, type, calculation, value, applyTo,
            isTaxable || false, applicableTaxIds || []
          ]);
        
        return res.status(201).json(newTaxSetting.rows[0]);
        
      } else if (req.method === 'PATCH' && id) {
        const { name, type, calculation, value, applyTo, isActive, isTaxable, applicableTaxIds } = req.body;
        
        const updatedTaxSetting = await pool.query(`UPDATE tax_settings 
          SET name = COALESCE($1, name), 
              type = COALESCE($2, type),
              calculation = COALESCE($3, calculation),
              value = COALESCE($4, value),
              apply_to = COALESCE($5, apply_to),
              is_active = COALESCE($6, is_active),
              is_taxable = COALESCE($7, is_taxable),
              applicable_tax_ids = COALESCE($8, applicable_tax_ids)
          WHERE tenant_id = $9 AND id = $10
          RETURNING *`, [
            name, type, calculation, value, applyTo, isActive, isTaxable, applicableTaxIds,
            tenantId, id
          ]);
        
        if (updatedTaxSetting.rows.length === 0) {
          return res.status(404).json({ message: 'Tax setting not found' });
        }
        
        return res.json(updatedTaxSetting.rows[0]);
        
      } else if (req.method === 'DELETE' && id) {
        const deletedTaxSetting = await pool.query(`UPDATE tax_settings 
          SET is_active = false 
          WHERE tenant_id = $1 AND id = $2
          RETURNING *`, [tenantId, id]);
        
        if (deletedTaxSetting.rows.length === 0) {
          return res.status(404).json({ message: 'Tax setting not found' });
        }
        
        return res.json({ message: 'Tax setting deleted successfully' });
      }
    }
    
    return res.status(404).json({ message: 'Resource not found' });
    
  } catch (error) {
    console.error('Tenant API error:', error);
    res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message 
    });
  } finally {
    if (pool) {
      await pool.end();
    }
  }
};