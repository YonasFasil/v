const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const { getDatabaseUrl } = require('../db-config.js');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

module.exports = async function handler(req, res) {
  // Set CORS headers
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

    pool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });

    // Extract customer ID from token if provided
    let customerId = null;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        customerId = decoded.customerId;
      } catch (error) {
        // Token invalid, but allow inquiry submission for non-authenticated users
      }
    }

    if (req.method === 'POST') {
      // Submit booking inquiry (authenticated or guest)
      const {
        venueId,
        spaceId,
        eventName,
        eventType,
        eventDate,
        startTime,
        endTime,
        isMultiDay,
        endDate,
        guestCount,
        setupStyle,
        message,
        specialRequests,
        budgetRange,
        cateringNeeded,
        avEquipmentNeeded,
        decorationsNeeded,
        // For guest users (non-authenticated)
        contactName,
        contactEmail,
        contactPhone,
        contactCompany
      } = req.body;

      // Validation
      if (!venueId || !eventName || !eventType || !eventDate || !guestCount) {
        return res.status(400).json({
          message: 'Venue ID, event name, event type, event date, and guest count are required'
        });
      }

      // If not authenticated, require contact information
      if (!customerId && (!contactName || !contactEmail)) {
        return res.status(400).json({
          message: 'Contact name and email are required for guest inquiries'
        });
      }

      // Get venue and tenant info
      const venueResult = await pool.query(`
        SELECT v.id, v.name, v.tenant_id, t.name as tenant_name
        FROM venues v
        JOIN tenants t ON v.tenant_id = t.id
        WHERE v.id = $1 AND v.is_active = true AND t.status = 'active'
      `, [venueId]);

      if (venueResult.rows.length === 0) {
        return res.status(404).json({ message: 'Venue not found or inactive' });
      }

      const venue = venueResult.rows[0];

      // Create inquiry
      const result = await pool.query(`
        INSERT INTO booking_inquiries (
          public_customer_id, tenant_id, venue_id, space_id,
          event_name, event_type, event_date, start_time, end_time,
          is_multi_day, end_date, guest_count, setup_style,
          message, special_requests, budget_range,
          catering_needed, av_equipment_needed, decorations_needed,
          contact_name, contact_email, contact_phone, contact_company
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
          $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
        ) RETURNING id, created_at
      `, [
        customerId,
        venue.tenant_id,
        venueId,
        spaceId || null,
        eventName,
        eventType,
        eventDate,
        startTime || null,
        endTime || null,
        isMultiDay || false,
        endDate || null,
        guestCount,
        setupStyle || null,
        message || null,
        specialRequests || null,
        budgetRange || null,
        cateringNeeded || false,
        avEquipmentNeeded || false,
        decorationsNeeded || false,
        contactName || null,
        contactEmail || null,
        contactPhone || null,
        contactCompany || null
      ]);

      const inquiry = result.rows[0];

      return res.status(201).json({
        message: 'Inquiry submitted successfully',
        inquiry: {
          id: inquiry.id,
          venue: {
            id: venue.id,
            name: venue.name,
            tenantName: venue.tenant_name
          },
          eventName,
          eventDate,
          guestCount,
          submittedAt: inquiry.created_at
        }
      });

    } else if (req.method === 'GET' && customerId) {
      // Get customer's inquiry history (authenticated users only)
      const { page = 1, limit = 10, status } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      let query = `
        SELECT
          bi.id, bi.event_name, bi.event_type, bi.event_date,
          bi.start_time, bi.end_time, bi.guest_count, bi.budget_range,
          bi.status, bi.priority, bi.created_at, bi.admin_response,
          bi.responded_at,
          v.name as venue_name, v.image_url as venue_image,
          t.name as tenant_name,
          s.name as space_name
        FROM booking_inquiries bi
        JOIN venues v ON bi.venue_id = v.id
        JOIN tenants t ON bi.tenant_id = t.id
        LEFT JOIN spaces s ON bi.space_id = s.id
        WHERE bi.public_customer_id = $1
      `;

      const params = [customerId];
      let paramCount = 1;

      // Add status filter
      if (status) {
        paramCount++;
        query += ` AND bi.status = $${paramCount}`;
        params.push(status);
      }

      query += `
        ORDER BY bi.created_at DESC
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;

      params.push(parseInt(limit), offset);

      const result = await pool.query(query, params);

      // Get total count
      let countQuery = `
        SELECT COUNT(*) as total
        FROM booking_inquiries
        WHERE public_customer_id = $1
      `;

      const countParams = [customerId];

      if (status) {
        countQuery += ' AND status = $2';
        countParams.push(status);
      }

      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].total);

      return res.json({
        inquiries: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      });

    } else if (req.method === 'GET' && req.query.inquiryId) {
      // Get specific inquiry details
      const { inquiryId } = req.query;

      let query = `
        SELECT
          bi.*,
          v.name as venue_name, v.description as venue_description,
          v.image_url as venue_image, v.amenities as venue_amenities,
          t.name as tenant_name, t.primary_color as tenant_color,
          s.name as space_name, s.description as space_description,
          s.capacity as space_capacity,
          u.name as responder_name
        FROM booking_inquiries bi
        JOIN venues v ON bi.venue_id = v.id
        JOIN tenants t ON bi.tenant_id = t.id
        LEFT JOIN spaces s ON bi.space_id = s.id
        LEFT JOIN users u ON bi.responded_by = u.id
        WHERE bi.id = $1
      `;

      const params = [inquiryId];

      // If authenticated, ensure user can only see their own inquiries
      if (customerId) {
        query += ' AND bi.public_customer_id = $2';
        params.push(customerId);
      }

      const result = await pool.query(query, params);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Inquiry not found' });
      }

      return res.json(result.rows[0]);

    } else if (req.method === 'PUT' && req.query.inquiryId && customerId) {
      // Update inquiry (authenticated users only, limited fields)
      const { inquiryId } = req.query;
      const { message, specialRequests } = req.body;

      const result = await pool.query(`
        UPDATE booking_inquiries
        SET message = COALESCE($1, message),
            special_requests = COALESCE($2, special_requests),
            updated_at = NOW()
        WHERE id = $3 AND public_customer_id = $4
        RETURNING id, updated_at
      `, [message, specialRequests, inquiryId, customerId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Inquiry not found' });
      }

      return res.json({
        message: 'Inquiry updated successfully',
        inquiry: result.rows[0]
      });

    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Public inquiries API error:', error);
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