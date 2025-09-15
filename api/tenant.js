const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getDatabaseUrl } = require('./db-config.js');

module.exports = async function handler(req, res) {
  // DEBUGGING: Log ALL API calls to tenant handler
  console.log(`\n🌐 TENANT API: ${req.method} ${req.url}`);
  console.log(`   Resource: ${req.query?.resource || 'unknown'}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`   Body keys: ${Object.keys(req.body)}`);
  }

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
        // Test bookings table (events are stored as bookings)
        const bookings = await pool.query(`SELECT COUNT(*) as count FROM bookings WHERE tenant_id = $1`, [tenantId]);
        debug.tables.events = { count: bookings.rows[0].count, status: 'success' };
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

    // CUSTOMER ANALYTICS
    if (resource === 'customer-analytics') {
      if (req.method === 'GET') {
        const analytics = await pool.query(`
          SELECT
            c.*,
            COUNT(DISTINCT b.id) as "bookingCount",
            COALESCE(SUM(b.total_amount), 0) as "totalRevenue",
            MAX(b.event_date) as "lastBookingDate",
            COUNT(DISTINCT p.id) as "proposalCount"
          FROM customers c
          LEFT JOIN bookings b ON c.id = b.customer_id AND c.tenant_id = b.tenant_id
          LEFT JOIN proposals p ON c.id = p.customer_id AND c.tenant_id = p.tenant_id
          WHERE c.tenant_id = $1
          GROUP BY c.id
          ORDER BY c.created_at DESC
        `, [tenantId]);
        return res.json(analytics.rows);
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
            WHERE tenant_id = $1 AND is_active = true
            ORDER BY created_at DESC`, [tenantId]);
          return res.json(venues.rows);
        }
        
      } else if (req.method === 'POST') {
        const { 
          name, description, address, city, state, zipCode, country,
          capacity, phoneNumber, email, website, amenities, setupStyles,
          cancellationPolicy, images, pricePerHour, isActive
        } = req.body;
        
        if (!name) {
          return res.status(400).json({ message: 'Venue name is required' });
        }
        
        const newVenue = await pool.query(`INSERT INTO venues (
            tenant_id, name, description, address, city, state, zip_code, country,
            capacity, phone_number, email, website, amenities, setup_styles,
            cancellation_policy, images, price_per_hour, is_active, created_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW()
          ) RETURNING *`, [
            tenantId, name, description || null, address || null, city || null, 
            state || null, zipCode || null, country || null, capacity || null,
            phoneNumber || null, email || null, website || null, 
            amenities || [], setupStyles || [], cancellationPolicy || null,
            images || [], pricePerHour || null, isActive !== false
          ]);
        
        return res.status(201).json(newVenue.rows[0]);
        
      } else if (req.method === 'PUT' && id) {
        const { 
          name, description, address, city, state, zipCode, country,
          capacity, phoneNumber, email, website, amenities, setupStyles,
          cancellationPolicy, images, pricePerHour, isActive
        } = req.body;
        
        const updatedVenue = await pool.query(`UPDATE venues 
          SET name = $1, description = $2, address = $3, city = $4, state = $5,
              zip_code = $6, country = $7, capacity = $8, phone_number = $9,
              email = $10, website = $11, amenities = $12, setup_styles = $13,
              cancellation_policy = $14, images = $15, price_per_hour = $16,
              is_active = $17, updated_at = NOW()
          WHERE tenant_id = $18 AND id = $19
          RETURNING *`, [
            name, description, address, city, state, zipCode, country, capacity,
            phoneNumber, email, website, amenities || [], setupStyles || [],
            cancellationPolicy, images || [], pricePerHour, isActive !== false,
            tenantId, id
          ]);
        
        if (updatedVenue.rows.length === 0) {
          return res.status(404).json({ message: 'Venue not found' });
        }
        
        return res.json(updatedVenue.rows[0]);
        
      } else if (req.method === 'DELETE' && id) {
        const deletedVenue = await pool.query(`UPDATE venues 
          SET is_active = false, updated_at = NOW()
          WHERE tenant_id = $1 AND id = $2
          RETURNING *`, [tenantId, id]);
        
        if (deletedVenue.rows.length === 0) {
          return res.status(404).json({ message: 'Venue not found' });
        }
        
        return res.json({ message: 'Venue deleted successfully' });
      }
    }
    
    // BOOKINGS
    if (resource === 'bookings') {
      if (req.method === 'GET') {
        const bookings = await pool.query(`SELECT b.*,
                 b.event_name as "eventName",
                 b.event_date as "eventDate",
                 b.start_time as "startTime",
                 b.end_time as "endTime",
                 b.guest_count as "guestCount",
                 b.total_amount as "totalAmount",
                 b.customer_id as "customerId",
                 b.venue_id as "venueId",
                 b.space_id as "spaceId",
                 b.package_id as "packageId",
                 b.selected_services as "selectedServices",
                 b.item_quantities as "itemQuantities",
                 b.pricing_overrides as "pricingOverrides",
                 b.service_tax_overrides as "serviceTaxOverrides",
                 c.name as customer_name,
                 v.name as venue_name,
                 s.name as space_name
          FROM bookings b
          LEFT JOIN customers c ON b.customer_id = c.id
          LEFT JOIN venues v ON b.venue_id = v.id
          LEFT JOIN spaces s ON b.space_id = s.id
          WHERE b.tenant_id = $1
          ORDER BY b.event_date DESC`, [tenantId]);

        // Group bookings by contract_id and create contract objects
        const contracts = new Map();
        const singleBookings = [];

        bookings.rows.forEach(booking => {
          if (booking.contract_id) {
            if (!contracts.has(booking.contract_id)) {
              // Create a contract object with all expected fields (using first booking's data)
              contracts.set(booking.contract_id, {
                id: booking.contract_id,
                isContract: true,
                contractInfo: {
                  id: booking.contract_id,
                  contractName: `${booking.eventName} (Multi-Date)`
                },
                contractEvents: [],
                eventCount: 0,
                status: booking.status,
                customer_name: booking.customer_name,
                venue_name: booking.venue_name,
                // Add missing date fields that modals expect
                eventName: booking.eventName,
                eventDate: booking.eventDate,
                startTime: booking.startTime,
                endTime: booking.endTime,
                guestCount: booking.guestCount,
                totalAmount: 0,
                created_at: booking.created_at,
                // Add missing ID fields for edit modal
                customerId: booking.customerId,
                venueId: booking.venueId,
                spaceId: booking.spaceId,
                packageId: booking.packageId,
                selectedServices: booking.selectedServices,
                notes: booking.notes
              });
            }

            const contract = contracts.get(booking.contract_id);
            contract.contractEvents.push({
              ...booking,
              isPartOfContract: true
            });
            contract.eventCount = contract.contractEvents.length;
            contract.totalAmount = (parseFloat(contract.totalAmount || 0) + parseFloat(booking.totalAmount || 0)).toFixed(2);
          } else {
            // Single booking (not part of contract)
            singleBookings.push({
              ...booking,
              isContract: false,
              isPartOfContract: false
            });
          }
        });

        // Combine contracts and single bookings
        const result = [...Array.from(contracts.values()), ...singleBookings];

        // Sort by created_at or event_date
        result.sort((a, b) => {
          const dateA = new Date(a.contractEvents?.[0]?.eventDate || a.eventDate || a.created_at);
          const dateB = new Date(b.contractEvents?.[0]?.eventDate || b.eventDate || b.created_at);
          return dateB - dateA;
        });

        return res.json(result);
      }

      if (req.method === 'POST') {
        // Create new booking/event
        const {
          eventName, eventType, customerId, venueId, spaceId,
          eventDate, endDate, startTime, endTime, guestCount,
          setupStyle, status = 'inquiry', totalAmount, depositAmount,
          notes, contractId, isMultiDay, packageId, selectedServices,
          itemQuantities, pricingOverrides, serviceTaxOverrides
        } = req.body;

        if (!eventName || !eventDate || !startTime || !endTime) {
          return res.status(400).json({ message: 'Event name, date, start time, and end time are required' });
        }

        // Check space availability if spaceId is provided
        if (spaceId) {
          // Check for conflicting bookings in the same space, date, and overlapping time
          const conflictQuery = `
            SELECT
              b.id, b.event_name, b.status, b.start_time, b.end_time,
              c.name as customer_name
            FROM bookings b
            LEFT JOIN customers c ON b.customer_id = c.id
            WHERE b.tenant_id = $1
              AND b.space_id = $2
              AND b.event_date::date = $3::date
              AND b.status != 'cancelled'
              AND (
                (b.start_time < $5 AND b.end_time > $4) OR
                (b.start_time >= $4 AND b.start_time < $5)
              )
          `;

          const conflicts = await pool.query(conflictQuery, [
            tenantId, spaceId, eventDate, startTime, endTime
          ]);

          if (conflicts.rows.length > 0) {
            const conflictingBooking = conflicts.rows[0];

            // Define blocking statuses (paid bookings that cannot be overbooked)
            const blockingStatuses = ['confirmed_deposit_paid', 'confirmed_fully_paid'];
            const isBlocking = blockingStatuses.includes(conflictingBooking.status);

            const conflictResponse = {
              message: isBlocking ? 'Space is unavailable - confirmed paid booking exists' : 'Space overlap detected with tentative booking',
              conflictType: isBlocking ? 'blocking' : 'warning',
              conflictingBooking: {
                id: conflictingBooking.id,
                eventName: conflictingBooking.event_name,
                status: conflictingBooking.status,
                startTime: conflictingBooking.start_time,
                endTime: conflictingBooking.end_time,
                customerName: conflictingBooking.customer_name
              }
            };

            // For blocking conflicts, return 409 to prevent creation
            // For warnings, we could still allow creation but return conflict info
            if (isBlocking) {
              return res.status(409).json(conflictResponse);
            }

            // For non-blocking conflicts, log the warning but allow creation
            console.log('⚠️ Non-blocking booking overlap detected:', conflictResponse);
          }
        }

        const newBooking = await pool.query(`
          INSERT INTO bookings (
            tenant_id, event_name, event_type, customer_id, venue_id, space_id,
            event_date, end_date, start_time, end_time, guest_count,
            setup_style, status, total_amount, deposit_amount, notes,
            contract_id, is_multi_day, package_id, selected_services,
            item_quantities, pricing_overrides, service_tax_overrides, created_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, NOW()
          ) RETURNING *
        `, [
          tenantId, eventName, eventType, customerId, venueId, spaceId,
          eventDate, endDate, startTime, endTime, guestCount,
          setupStyle, status, totalAmount, depositAmount, notes,
          contractId, isMultiDay, packageId, selectedServices,
          itemQuantities, pricingOverrides, serviceTaxOverrides
        ]);

        return res.status(201).json(newBooking.rows[0]);
      }

      // PATCH booking (update existing booking)
      if (req.method === 'PATCH' && id) {
        try {
          const updateData = req.body;

          // DEBUGGING: Log when individual booking PATCH is called
          console.log('🔍 INDIVIDUAL BOOKING PATCH called');
          console.log('   Booking ID:', id);
          console.log('   Update data keys:', Object.keys(updateData));
          console.log('   ⚠️  This should NOT be called for multidate events!');

          // Check if this is actually a single-to-multidate conversion
          if (updateData.bookingsData && Array.isArray(updateData.bookingsData)) {
            console.log('   🚨 PROBLEM: Individual booking PATCH received bookingsData array!');
            console.log('   🚨 This should be a CONTRACT POST, not individual PATCH!');
            console.log('   🚨 Frontend is calling wrong endpoint for single-to-multidate conversion');
            return res.status(400).json({
              message: 'Single to multidate conversion should use contract endpoint',
              hint: 'Use POST /api/contracts instead of PATCH /api/bookings/{id}'
            });
          }

          // Build dynamic update query based on provided fields
          const updateFields = [];
          const updateValues = [];
          let valueIndex = 1;

          // Add tenant_id and booking id to WHERE clause values
          updateValues.push(tenantId, id);

          // Define a mapping from camelCase to snake_case for database columns
          const fieldMappings = {
            eventName: 'event_name',
            status: 'status',
            guestCount: 'guest_count',
            startTime: 'start_time',
            endTime: 'end_time',
            notes: 'notes',
            totalAmount: 'total_amount',
            eventDate: 'event_date',
            endDate: 'end_date',
            eventType: 'event_type',
            setupStyle: 'setup_style',
            depositAmount: 'deposit_amount',
            depositPaid: 'deposit_paid',
            customerId: 'customer_id',
            venueId: 'venue_id',
            spaceId: 'space_id',
            packageId: 'package_id',
            selectedServices: 'selected_services',
            itemQuantities: 'item_quantities',
            pricingOverrides: 'pricing_overrides',
            serviceTaxOverrides: 'service_tax_overrides'
          };

          for (const key in updateData) {
            if (fieldMappings[key] && updateData[key] !== undefined) {
              let value = updateData[key];

              // Handle UUID fields - convert empty strings to null
              if (['packageId', 'customerId', 'venueId', 'spaceId'].includes(key)) {
                value = value && value.trim() !== '' ? value : null;
              }

              // Handle JSON fields - convert empty objects/arrays to null
              if (['selectedServices', 'itemQuantities', 'pricingOverrides', 'serviceTaxOverrides'].includes(key)) {
                if (Array.isArray(value)) {
                  value = value.length > 0 ? value : null;
                } else if (typeof value === 'object' && value !== null) {
                  value = Object.keys(value).length > 0 ? value : null;
                } else if (typeof value === 'string' && value.trim() === '') {
                  value = null;
                }
              }

              updateFields.push(`${fieldMappings[key]} = $${valueIndex + 2}`);
              updateValues.push(value);
              valueIndex++;
            }
          }

          if (updateFields.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
          }

          // Note: updated_at column doesn't exist in bookings table
          // Using created_at instead for tracking purposes

          // Update the booking
          const updateQuery = `
            UPDATE bookings
            SET ${updateFields.join(', ')}
            WHERE tenant_id = $1 AND id = $2
            RETURNING *
          `;

          const result = await pool.query(updateQuery, updateValues);

          if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Booking not found' });
          }

          return res.json(result.rows[0]);

        } catch (error) {
          console.error('Booking update error:', error);
          return res.status(500).json({ message: 'Failed to update booking' });
        }
      }

      // DELETE booking (for single-to-multidate conversion)
      if (req.method === 'DELETE' && id) {
        try {
          console.log('🗑️ DELETING INDIVIDUAL BOOKING:', id);

          const deleteQuery = `
            DELETE FROM bookings
            WHERE tenant_id = $1 AND id = $2
            RETURNING *
          `;

          const result = await pool.query(deleteQuery, [tenantId, id]);

          if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Booking not found' });
          }

          console.log('✅ Successfully deleted booking:', id);
          return res.json({ message: 'Booking deleted successfully', deletedBooking: result.rows[0] });

        } catch (error) {
          console.error('Booking deletion error:', error);
          return res.status(500).json({ message: 'Failed to delete booking' });
        }
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
    
    // VENUES WITH SPACES
    if (resource === 'venues-with-spaces') {
      if (req.method === 'GET') {
        const venuesWithSpaces = await pool.query(`
          SELECT v.*, 
                 COALESCE(
                   JSON_AGG(
                     CASE WHEN s.id IS NOT NULL THEN 
                       JSON_BUILD_OBJECT(
                         'id', s.id,
                         'name', s.name,
                         'capacity', s.capacity,
                         'price_per_hour', s.price_per_hour
                       )
                     END
                   ) FILTER (WHERE s.id IS NOT NULL), 
                   '[]'
                 ) as spaces
          FROM venues v
          LEFT JOIN spaces s ON v.id = s.venue_id AND s.is_active = true
          WHERE v.tenant_id = $1 AND v.is_active = true
          GROUP BY v.id
          ORDER BY v.created_at DESC
        `, [tenantId]);
        return res.json(venuesWithSpaces.rows);
      }
    }
    
    // SETTINGS
    if (resource === 'settings') {
      if (req.method === 'GET') {
        const settings = await pool.query(`SELECT * FROM settings 
          WHERE tenant_id = $1
          ORDER BY key ASC`, [tenantId]);
        
        // Convert to key-value object
        const settingsObj = {};
        settings.rows.forEach(setting => {
          settingsObj[setting.key] = setting.value;
        });
        
        return res.json(settingsObj);
        
      } else if (req.method === 'POST' || req.method === 'PUT') {
        const updates = req.body;
        
        // Update or insert each setting
        for (const [key, value] of Object.entries(updates)) {
          await pool.query(`
            INSERT INTO settings (tenant_id, key, value, created_at, updated_at)
            VALUES ($1, $2, $3, NOW(), NOW())
            ON CONFLICT (tenant_id, key) 
            DO UPDATE SET value = $3, updated_at = NOW()
          `, [tenantId, key, value]);
        }
        
        return res.json({ message: 'Settings updated successfully' });
      }
    }
    
    // DASHBOARD METRICS
    if (resource === 'dashboard' && req.query.subresource === 'metrics') {
      if (req.method === 'GET') {
        const metrics = await pool.query(`
          SELECT 
            (SELECT COUNT(*) FROM venues WHERE tenant_id = $1 AND is_active = true) as total_venues,
            (SELECT COUNT(*) FROM customers WHERE tenant_id = $1) as total_customers,
            (SELECT COUNT(*) FROM bookings WHERE tenant_id = $1 AND status != 'cancelled') as total_bookings,
            (SELECT COUNT(*) FROM proposals WHERE tenant_id = $1) as total_proposals,
            (SELECT COALESCE(SUM(total_amount), 0) FROM bookings WHERE tenant_id = $1 AND status = 'confirmed') as total_revenue
        `, [tenantId]);
        
        return res.json(metrics.rows[0]);
      }
    }
    
    // PROPOSALS
    if (resource === 'proposals') {
      if (req.method === 'GET') {
        try {
          const proposals = await pool.query(`SELECT p.*, 
                   c.name as customer_name,
                   v.name as venue_name
            FROM proposals p
            LEFT JOIN customers c ON p.customer_id = c.id AND c.tenant_id = $1
            LEFT JOIN venues v ON p.venue_id = v.id AND v.tenant_id = $1
            WHERE p.tenant_id = $1
            ORDER BY p.created_at DESC`, [tenantId]);
          return res.json(proposals.rows);
        } catch (error) {
          console.error('Proposals query error:', error);
          // Return empty array if query fails
          return res.json([]);
        }
      }
    }
    
    // COMPANIES
    if (resource === 'companies') {
      if (req.method === 'GET') {
        const companies = await pool.query(`SELECT * FROM companies
          WHERE tenant_id = $1
          ORDER BY created_at DESC`, [tenantId]);
        return res.json(companies.rows);
      }
    }

    // LEADS
    if (resource === 'leads') {
      if (req.method === 'GET') {
        const leads = await pool.query(`SELECT * FROM leads
          WHERE tenant_id = $1
          ORDER BY created_at DESC`, [tenantId]);
        return res.json(leads.rows);
      }
    }

    // TAGS
    if (resource === 'tags') {
      if (req.method === 'GET') {
        const tags = await pool.query(`SELECT * FROM tags
          WHERE tenant_id = $1
          ORDER BY name ASC`, [tenantId]);
        return res.json(tags.rows);
      }
    }

    // CAMPAIGN SOURCES
    if (resource === 'campaign-sources') {
      if (req.method === 'GET') {
        const sources = await pool.query(`SELECT * FROM campaign_sources
          WHERE tenant_id = $1
          ORDER BY name ASC`, [tenantId]);
        return res.json(sources.rows);
      }
    }

    // TASKS
    if (resource === 'tasks') {
      if (req.method === 'GET') {
        const tasks = await pool.query(`SELECT * FROM tasks
          WHERE tenant_id = $1
          ORDER BY created_at DESC`, [tenantId]);
        return res.json(tasks.rows);
      }
    }

    // COMMUNICATIONS
    if (resource === 'communications') {
      if (req.method === 'GET') {
        if (id) {
          // Get specific communication
          const communication = await pool.query(`SELECT * FROM communications
            WHERE tenant_id = $1 AND id = $2`, [tenantId, id]);
          return res.json(communication.rows[0] || null);
        } else if (bookingId) {
          const communications = await pool.query(`SELECT * FROM communications WHERE tenant_id = $1 AND booking_id = $2 ORDER BY created_at DESC`, [tenantId, bookingId]);
          return res.json(communications.rows);
        } else {
          // Get all communications
          const communications = await pool.query(`SELECT * FROM communications
            WHERE tenant_id = $1
            ORDER BY created_at DESC`, [tenantId]);
          return res.json(communications.rows);
        }
      }
    }

    // PAYMENTS
    if (resource === 'payments') {
      if (req.method === 'GET') {
        const payments = await pool.query(`SELECT p.*, 
                 c.name as customer_name,
                 b.event_name
          FROM payments p
          LEFT JOIN customers c ON p.customer_id = c.id
          LEFT JOIN bookings b ON p.booking_id = b.id
          WHERE p.tenant_id = $1
          ORDER BY p.created_at DESC`, [tenantId]);
        return res.json(payments.rows);
      }
    }
    
    // TENANT FEATURES
    if (resource === 'tenant-features') {
      if (req.method === 'GET') {
        console.log('[TENANT-FEATURES-DEBUG-API] Looking up tenant features for:', tenantId);
        // Get tenant's subscription package and features
        const tenantInfo = await pool.query(`
          SELECT t.subscription_package_id, sp.features, sp.name as package_name
          FROM tenants t
          LEFT JOIN subscription_packages sp ON t.subscription_package_id = sp.id
          WHERE t.id = $1
        `, [tenantId]);
        
        console.log('[TENANT-FEATURES-DEBUG-API] Query result:', tenantInfo.rows.length, 'rows');
        if (tenantInfo.rows.length > 0) {
          console.log('[TENANT-FEATURES-DEBUG-API] Tenant found:', tenantInfo.rows[0]);
        }
        
        if (tenantInfo.rows.length > 0) {
          const packageFeatures = tenantInfo.rows[0].features || [];
          console.log('[TENANT-FEATURES-DEBUG-API] Package features:', packageFeatures);
          
          // Define available features (matching the main app)
          const AVAILABLE_FEATURES = {
            calendar_view: { name: "Calendar View", description: "Visual calendar interface for event management" },
            proposal_system: { name: "Proposal System", description: "Generate and send event proposals to customers" },
            leads_management: { name: "Lead Management", description: "Advanced lead tracking and conversion tools" },
            ai_analytics: { name: "AI Analytics", description: "Smart insights and predictive analytics" },
            voice_booking: { name: "Voice Booking", description: "Create bookings using voice commands" },
            floor_plans: { name: "Floor Plans", description: "Interactive floor plan designer and setup templates" },
            advanced_reports: { name: "Advanced Reports", description: "Detailed revenue and performance reports" },
            task_management: { name: "Task Management", description: "Team collaboration and task tracking" },
            custom_fields: { name: "Custom Fields", description: "Create custom booking and customer fields" }
          };
          
          // Default features that are always available (including event_booking)
          const DEFAULT_FEATURES = ['dashboard_analytics', 'venue_management', 'customer_management', 'payment_processing', 'event_booking'];
          
          let availableFeatures = [...DEFAULT_FEATURES];
          
          // If package includes "everything", grant all available features
          if (packageFeatures.includes('everything')) {
            console.log('[TENANT-FEATURES-DEBUG-API] Package includes "everything", granting all features');
            availableFeatures = [...DEFAULT_FEATURES, ...Object.keys(AVAILABLE_FEATURES)];
          } else {
            // Filter package features to only include valid feature IDs
            const validPackageFeatures = packageFeatures.filter(feature => 
              Object.keys(AVAILABLE_FEATURES).includes(feature)
            );
            availableFeatures = [...DEFAULT_FEATURES, ...validPackageFeatures];
          }
          
          console.log('[TENANT-FEATURES-DEBUG-API] Final available features:', availableFeatures);
          
          // Convert to expected format
          const enabledFeatures = availableFeatures.map(featureId => ({
            id: featureId,
            name: AVAILABLE_FEATURES[featureId]?.name || featureId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            enabled: true
          }));
          
          // Add disabled features for reference
          const allFeatureIds = Object.keys(AVAILABLE_FEATURES);
          const disabledFeatures = allFeatureIds
            .filter(featureId => !availableFeatures.includes(featureId))
            .map(featureId => ({
              id: featureId,
              name: AVAILABLE_FEATURES[featureId]?.name || featureId,
              enabled: false
            }));
          
          return res.json({
            tenant: {
              id: tenantId,
              subscriptionPackageId: tenantInfo.rows[0].subscription_package_id
            },
            package: {
              id: tenantInfo.rows[0].subscription_package_id,
              name: tenantInfo.rows[0].package_name
            },
            features: {
              enabled: enabledFeatures,
              disabled: disabledFeatures,
              total: allFeatureIds.length + DEFAULT_FEATURES.length,
              available: availableFeatures.length
            }
          });
        } else {
          console.log('[TENANT-FEATURES-DEBUG-API] Tenant not found in database:', tenantId);
          return res.status(404).json({ 
            message: "Tenant not found. Please check your account setup.",
            tenantId: tenantId
          });
        }
      }
    }
    
    // EVENTS / CALENDAR EVENTS
    if (resource === 'events' || resource === 'calendar-events') {
      if (req.method === 'GET') {
        try {
          // Query bookings table (events are stored as bookings)
          const events = await pool.query(`SELECT
                   b.id,
                   b.event_name as title,
                   b.event_name as "eventName",
                   b.event_date as start,
                   b.event_date as "eventDate",
                   b.start_time as "startTime",
                   b.end_time as "endTime",
                   b.guest_count as "guestCount",
                   b.total_amount as "totalAmount",
                   b.status,
                   b.contract_id as "contractId",
                   CASE WHEN b.contract_id IS NOT NULL THEN true ELSE false END as "isPartOfContract",
                   c.name as "customerName",
                   v.name as "venueName",
                   s.name as "spaceName",
                   -- Add color based on status
                   CASE
                     WHEN b.status = 'confirmed' THEN '#22c55e'
                     WHEN b.status = 'inquiry' THEN '#3b82f6'
                     WHEN b.status = 'tentative' THEN '#f59e0b'
                     WHEN b.status = 'cancelled' THEN '#ef4444'
                     ELSE '#6b7280'
                   END as color
            FROM bookings b
            LEFT JOIN customers c ON b.customer_id = c.id AND c.tenant_id = $1
            LEFT JOIN venues v ON b.venue_id = v.id AND v.tenant_id = $1
            LEFT JOIN spaces s ON b.space_id = s.id
            WHERE b.tenant_id = $1
            ORDER BY b.event_date DESC`, [tenantId]);

          // For calendar API, return the format the calendar component expects
          if (resource === 'calendar-events' || req.query.isCalendarApi === 'true') {
            const mode = req.query.mode || 'events';
            // Filter out events with invalid dates to prevent calendar crashes
            const validEvents = events.rows.filter(event =>
              event.start &&
              event.start !== null &&
              !isNaN(new Date(event.start).getTime())
            );

            return res.json({
              mode: mode,
              data: validEvents
            });
          }

          // For regular events API, return raw array
          return res.json(events.rows);
        } catch (error) {
          console.error('Events query error:', error);
          // Return appropriate empty response based on resource type
          if (resource === 'calendar-events' || req.query.isCalendarApi === 'true') {
            const mode = req.query.mode || 'events';
            return res.json({ mode: mode, data: [] });
          }
          return res.json([]);
        }
      }
    }

    // CONTRACTS - Handle multi-date event creation
    if (resource === 'contracts') {
      if (req.method === 'POST') {
        const { contractData, bookingsData } = req.body;

        // DEBUGGING: Log contract creation data
        console.log('📋 CONTRACT CREATION: Creating new multidate event');
        console.log('   Contract data:', JSON.stringify(contractData, null, 2));
        console.log('   Number of bookings:', bookingsData?.length);
        if (bookingsData && Array.isArray(bookingsData)) {
          console.log('   Package/Service data in creation:');
          bookingsData.forEach((booking, i) => {
            console.log(`     Booking ${i + 1}: packageId=${booking.packageId}, selectedServices=${JSON.stringify(booking.selectedServices)}`);
          });
        }

        if (!contractData || !bookingsData || !Array.isArray(bookingsData)) {
          return res.status(400).json({ message: 'Contract data and bookings array are required' });
        }

        // Generate a unique contract ID
        const contractId = uuidv4();

        try {
          // Check availability for all bookings first
          const conflicts = [];

          for (const bookingData of bookingsData) {
            const { spaceId, eventDate, startTime, endTime } = bookingData;

            if (spaceId) {
              const conflictQuery = `
                SELECT
                  b.id, b.event_name, b.status, b.start_time, b.end_time,
                  c.name as customer_name
                FROM bookings b
                LEFT JOIN customers c ON b.customer_id = c.id
                WHERE b.tenant_id = $1
                  AND b.space_id = $2
                  AND b.event_date::date = $3::date
                  AND b.status != 'cancelled'
                  AND (
                    (b.start_time < $5 AND b.end_time > $4) OR
                    (b.start_time >= $4 AND b.start_time < $5)
                  )
              `;

              const result = await pool.query(conflictQuery, [
                tenantId, spaceId, eventDate, startTime, endTime
              ]);

              if (result.rows.length > 0) {
                const conflictingBooking = result.rows[0];
                const blockingStatuses = ['confirmed_deposit_paid', 'confirmed_fully_paid'];
                const isBlocking = blockingStatuses.includes(conflictingBooking.status);

                if (isBlocking) {
                  conflicts.push({
                    date: eventDate,
                    conflictingBooking: {
                      id: conflictingBooking.id,
                      eventName: conflictingBooking.event_name,
                      status: conflictingBooking.status,
                      startTime: conflictingBooking.start_time,
                      endTime: conflictingBooking.end_time,
                      customerName: conflictingBooking.customer_name
                    }
                  });
                }
              }
            }
          }

          // If there are blocking conflicts, return error
          if (conflicts.length > 0) {
            return res.status(409).json({
              message: 'Contract cannot be created due to confirmed paid booking conflicts',
              conflictType: 'blocking',
              conflictingBooking: conflicts[0].conflictingBooking,
              conflicts: conflicts
            });
          }

          // First, create the contract record in the contracts table
          const customerId = bookingsData[0]?.customerId;
          if (!customerId) {
            return res.status(400).json({ message: 'Customer ID is required for contract creation' });
          }

          // Calculate total amount from all bookings
          const totalContractAmount = bookingsData.reduce((sum, booking) => {
            return sum + (parseFloat(booking.totalAmount) || 0);
          }, 0);

          const contractRecord = await pool.query(`
            INSERT INTO contracts (
              id, tenant_id, customer_id, contract_name, status, total_amount, created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, NOW(), NOW()
            ) RETURNING *
          `, [
            contractId,
            tenantId,
            customerId,
            contractData.contractName || `Multi-Date Event Contract`,
            'inquiry',
            totalContractAmount
          ]);

          // Now create all bookings with the same contract ID
          const createdBookings = [];

          for (const bookingData of bookingsData) {
            const {
              eventName, eventType, customerId, venueId, spaceId,
              eventDate, endDate, startTime, endTime, guestCount,
              setupStyle, status = 'inquiry', totalAmount, depositAmount,
              notes, isMultiDay, proposalId, proposalStatus, proposalSentAt,
              packageId, selectedServices, itemQuantities, pricingOverrides, serviceTaxOverrides
            } = bookingData;

            // Handle UUID fields - convert empty strings to null
            const safePackageId = packageId && packageId.trim() !== '' ? packageId : null;
            const safeSelectedServices = selectedServices && selectedServices.length > 0 ? selectedServices : null;
            const safeItemQuantities = itemQuantities && Object.keys(itemQuantities).length > 0 ? itemQuantities : null;
            const safePricingOverrides = pricingOverrides && Object.keys(pricingOverrides).length > 0 ? pricingOverrides : null;
            const safeServiceTaxOverrides = serviceTaxOverrides && Object.keys(serviceTaxOverrides).length > 0 ? serviceTaxOverrides : null;

            const newBooking = await pool.query(`
              INSERT INTO bookings (
                tenant_id, event_name, event_type, customer_id, venue_id, space_id,
                event_date, end_date, start_time, end_time, guest_count,
                setup_style, status, total_amount, deposit_amount, notes,
                contract_id, is_multi_day, proposal_id, proposal_status,
                proposal_sent_at, package_id, selected_services, item_quantities,
                pricing_overrides, service_tax_overrides, created_at
              ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, NOW()
              ) RETURNING *
            `, [
              tenantId, eventName, eventType, customerId, venueId, spaceId,
              eventDate, endDate, startTime, endTime, guestCount,
              setupStyle, status, totalAmount, depositAmount, notes,
              contractId, isMultiDay, proposalId, proposalStatus, proposalSentAt,
              safePackageId, safeSelectedServices, safeItemQuantities, safePricingOverrides, safeServiceTaxOverrides
            ]);

            createdBookings.push(newBooking.rows[0]);
          }

          return res.status(201).json({
            message: 'Contract created successfully',
            contractId: contractId,
            contract: contractRecord.rows[0],
            bookings: createdBookings
          });

        } catch (error) {
          console.error('Contract creation error:', error);
          return res.status(500).json({ message: 'Failed to create contract' });
        }
      }

      // GET contracts (return grouped bookings by contract_id)
      if (req.method === 'GET') {
        try {
          const contracts = await pool.query(`
            SELECT DISTINCT contract_id
            FROM bookings
            WHERE tenant_id = $1 AND contract_id IS NOT NULL
          `, [tenantId]);

          return res.json(contracts.rows);
        } catch (error) {
          console.error('Contracts query error:', error);
          return res.json([]);
        }
      }

      // PATCH contract (supports complex multidate event editing)
      if (req.method === 'PATCH') {
        const contractId = req.query.contractId;
        const action = req.query.action;

        // DEBUGGING: Log when contract PATCH is called
        console.log('🎯 CONTRACT PATCH called - This is CORRECT for multidate events!');
        console.log('   Contract ID:', contractId);
        console.log('   Action:', action);
        console.log('   Request URL:', req.url);
        console.log('   Request body keys:', Object.keys(req.body));
        console.log('   Full update data:', JSON.stringify(req.body, null, 2));

        // Handle status updates specifically
        if (action === 'status') {
          console.log('📊 CONTRACT STATUS UPDATE requested');

          if (!contractId) {
            return res.status(400).json({ message: 'Contract ID is required for status update' });
          }

          try {
            const { status } = req.body;

            if (!status) {
              return res.status(400).json({ message: 'Status is required' });
            }

            // Update status for all bookings in the contract
            const updateQuery = `
              UPDATE bookings
              SET status = $3
              WHERE tenant_id = $1 AND contract_id = $2
              RETURNING *
            `;

            const result = await pool.query(updateQuery, [tenantId, contractId, status]);

            if (result.rows.length === 0) {
              return res.status(404).json({ message: 'Contract not found' });
            }

            console.log(`✅ Updated ${result.rows.length} bookings to status: ${status}`);

            return res.json({
              message: 'Contract status updated successfully',
              contractId: contractId,
              updatedBookings: result.rows.length,
              newStatus: status,
              bookings: result.rows
            });

          } catch (error) {
            console.error('Contract status update error:', error);
            return res.status(500).json({ message: 'Failed to update contract status' });
          }
        }

        if (!contractId) {
          return res.status(400).json({ message: 'Contract ID is required' });
        }

        try {
          const updateData = req.body;

          // Handle different types of contract updates
          if (updateData.bookingsData && Array.isArray(updateData.bookingsData)) {
            // Complex multidate event update: replace all bookings in the contract
            console.log('🔄 COMPLEX CONTRACT UPDATE: Performing multidate event update for contract:', contractId);
            console.log('   Number of bookings to create:', updateData.bookingsData.length);
            console.log('   Bookings data preview:', updateData.bookingsData.map(b => `${b.eventName} on ${b.eventDate}`));
            console.log('   Package/Service data check:');
            updateData.bookingsData.forEach((booking, i) => {
              console.log(`     Booking ${i + 1}: packageId=${booking.packageId}, selectedServices=${JSON.stringify(booking.selectedServices)}`);
            });

            // First, delete existing bookings in the contract
            await pool.query(`
              DELETE FROM bookings
              WHERE tenant_id = $1 AND contract_id = $2
            `, [tenantId, contractId]);

            // Create new bookings with the updated data
            const createdBookings = [];
            for (const bookingData of updateData.bookingsData) {
              const {
                eventName, eventType, customerId, venueId, spaceId,
                eventDate, endDate, startTime, endTime, guestCount,
                setupStyle, status = 'inquiry', totalAmount, depositAmount,
                notes, isMultiDay, proposalId, proposalStatus, proposalSentAt,
                packageId, selectedServices, itemQuantities, pricingOverrides, serviceTaxOverrides
              } = bookingData;

              // Handle UUID fields - convert empty strings to null
              const safePackageId = packageId && packageId.trim() !== '' ? packageId : null;
              const safeSelectedServices = selectedServices && selectedServices.length > 0 ? selectedServices : null;
              const safeItemQuantities = itemQuantities && Object.keys(itemQuantities).length > 0 ? itemQuantities : null;
              const safePricingOverrides = pricingOverrides && Object.keys(pricingOverrides).length > 0 ? pricingOverrides : null;
              const safeServiceTaxOverrides = serviceTaxOverrides && Object.keys(serviceTaxOverrides).length > 0 ? serviceTaxOverrides : null;

              const newBooking = await pool.query(`
                INSERT INTO bookings (
                  tenant_id, event_name, event_type, customer_id, venue_id, space_id,
                  event_date, end_date, start_time, end_time, guest_count,
                  setup_style, status, total_amount, deposit_amount, notes,
                  contract_id, is_multi_day, proposal_id, proposal_status,
                  proposal_sent_at, package_id, selected_services, item_quantities,
                  pricing_overrides, service_tax_overrides, created_at
                ) VALUES (
                  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, NOW()
                ) RETURNING *
              `, [
                tenantId, eventName, eventType, customerId, venueId, spaceId,
                eventDate, endDate, startTime, endTime, guestCount,
                setupStyle, status, totalAmount, depositAmount, notes,
                contractId, isMultiDay, proposalId, proposalStatus, proposalSentAt,
                safePackageId, safeSelectedServices, safeItemQuantities, safePricingOverrides, safeServiceTaxOverrides
              ]);

              createdBookings.push(newBooking.rows[0]);
            }

            // Update the contract total amount if needed
            if (updateData.contractData?.totalAmount) {
              await pool.query(`
                UPDATE contracts
                SET total_amount = $3
                WHERE tenant_id = $1 AND id = $2
              `, [tenantId, contractId, updateData.contractData.totalAmount]);
            }

            return res.json({
              message: 'Contract updated successfully',
              contractId: contractId,
              updatedBookings: createdBookings.length,
              bookings: createdBookings
            });

          } else {
            // Simple contract update: update common fields across all bookings
            console.log('📝 SIMPLE CONTRACT UPDATE: Updating common fields across all bookings');
            console.log('   Update data:', JSON.stringify(updateData, null, 2));

            const updateFields = [];
            const updateValues = [];
            let valueIndex = 1;

            // Add tenant_id and contract_id to WHERE clause values
            updateValues.push(tenantId, contractId);

            if (updateData.status) {
              updateFields.push(`status = $${valueIndex + 2}`);
              updateValues.push(updateData.status);
              valueIndex++;
            }

            if (updateData.notes) {
              updateFields.push(`notes = $${valueIndex + 2}`);
              updateValues.push(updateData.notes);
              valueIndex++;
            }

            if (updateData.eventName) {
              updateFields.push(`event_name = $${valueIndex + 2}`);
              updateValues.push(updateData.eventName);
              valueIndex++;
            }

            if (updateData.eventType) {
              updateFields.push(`event_type = $${valueIndex + 2}`);
              updateValues.push(updateData.eventType);
              valueIndex++;
            }

            if (updateData.guestCount) {
              updateFields.push(`guest_count = $${valueIndex + 2}`);
              updateValues.push(updateData.guestCount);
              valueIndex++;
            }

            if (updateData.setupStyle) {
              updateFields.push(`setup_style = $${valueIndex + 2}`);
              updateValues.push(updateData.setupStyle);
              valueIndex++;
            }

            if (updateFields.length === 0) {
              return res.status(400).json({ message: 'No fields to update' });
            }

            // Update all bookings in the contract
            const updateQuery = `
              UPDATE bookings
              SET ${updateFields.join(', ')}
              WHERE tenant_id = $1 AND contract_id = $2
              RETURNING *
            `;

            const result = await pool.query(updateQuery, updateValues);

            if (result.rows.length === 0) {
              return res.status(404).json({ message: 'Contract not found' });
            }

            return res.json({
              message: 'Contract updated successfully',
              updatedBookings: result.rows.length,
              contractId: contractId,
              bookings: result.rows
            });
          }

        } catch (error) {
          console.error('Contract update error:', error);
          return res.status(500).json({ message: 'Failed to update contract', error: error.message });
        }
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