// Super Admin Assume Tenant API
// This is a Vercel serverless function that handles super-admin tenant assumption

import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify super admin authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify user is super admin
    const userQuery = await pool.query('SELECT * FROM users WHERE id = $1 AND role = $2', 
      [decoded.id, 'super_admin']);
    
    if (userQuery.rows.length === 0) {
      return res.status(403).json({ message: 'Super admin access required' });
    }

    const { tenantId, reason } = req.body;

    // Validate inputs
    if (!tenantId || !reason) {
      return res.status(400).json({ message: 'tenantId and reason are required' });
    }

    if (reason.trim().length < 10) {
      return res.status(400).json({ message: 'Reason must be at least 10 characters' });
    }

    // Verify tenant exists
    const tenantQuery = await pool.query('SELECT * FROM tenants WHERE id = $1', [tenantId]);
    if (tenantQuery.rows.length === 0) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    const tenant = tenantQuery.rows[0];

    // Create short-lived token (30 minutes)
    const tokenExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
    const assumeToken = jwt.sign({
      userId: decoded.id,
      role: 'super_admin',
      assumedTenantId: tenantId,
      exp: Math.floor(tokenExpiresAt.getTime() / 1000)
    }, process.env.JWT_SECRET);

    // Insert audit record
    await pool.query(`
      INSERT INTO admin_audit (admin_user_id, tenant_id, reason, ip, user_agent, token_expires_at)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      decoded.id,
      tenantId,
      reason.trim(),
      req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      req.headers['user-agent'] || '',
      tokenExpiresAt
    ]);

    console.log(`🔐 Super admin ${userQuery.rows[0].email} assumed tenant ${tenant.name} (${tenantId})`);
    console.log(`   Reason: ${reason.trim()}`);
    console.log(`   Expires: ${tokenExpiresAt.toISOString()}`);

    res.json({
      message: 'Tenant assumed successfully',
      assumeToken,
      tenant: {
        id: tenant.id,
        name: tenant.name
      },
      expiresAt: tokenExpiresAt.toISOString(),
      expiresInMinutes: 30
    });

  } catch (error) {
    console.error('Assume tenant error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    res.status(500).json({ message: 'Failed to assume tenant' });
  } finally {
    // Don't end the pool in serverless functions
    // await pool.end();
  }
}