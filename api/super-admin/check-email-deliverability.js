const jwt = require('jsonwebtoken');
const dns = require('dns').promises;

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
    // Verify super admin token
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

    if (decoded.role !== 'super_admin') {
      return res.status(403).json({ message: 'Super admin access required' });
    }

    const { domain } = req.body;

    if (!domain) {
      return res.status(400).json({
        success: false,
        message: 'Domain is required'
      });
    }

    const results = {
      domain,
      spf: { configured: false, record: null, status: 'not_found' },
      dkim: { configured: false, status: 'unknown' },
      dmarc: { configured: false, record: null, status: 'not_found' },
      mx: { configured: false, records: [], status: 'not_found' }
    };

    try {
      // Check SPF record
      try {
        const txtRecords = await dns.resolveTxt(domain);
        const spfRecord = txtRecords.find(record =>
          record.join('').toLowerCase().includes('v=spf1')
        );

        if (spfRecord) {
          results.spf.configured = true;
          results.spf.record = spfRecord.join('');
          results.spf.status = 'found';
        }
      } catch (error) {
        results.spf.status = 'error';
      }

      // Check DMARC record
      try {
        const dmarcRecords = await dns.resolveTxt(`_dmarc.${domain}`);
        const dmarcRecord = dmarcRecords.find(record =>
          record.join('').toLowerCase().includes('v=dmarc1')
        );

        if (dmarcRecord) {
          results.dmarc.configured = true;
          results.dmarc.record = dmarcRecord.join('');
          results.dmarc.status = 'found';
        }
      } catch (error) {
        results.dmarc.status = 'error';
      }

      // Check MX records
      try {
        const mxRecords = await dns.resolveMx(domain);
        if (mxRecords && mxRecords.length > 0) {
          results.mx.configured = true;
          results.mx.records = mxRecords.map(mx => ({
            exchange: mx.exchange,
            priority: mx.priority
          }));
          results.mx.status = 'found';
        }
      } catch (error) {
        results.mx.status = 'error';
      }

      // Calculate overall deliverability score
      let score = 0;
      let maxScore = 3;

      if (results.spf.configured) score += 1;
      if (results.dmarc.configured) score += 1;
      if (results.mx.configured) score += 1;

      const deliverabilityScore = Math.round((score / maxScore) * 100);

      let recommendation = '';
      if (deliverabilityScore >= 80) {
        recommendation = 'Good email deliverability setup';
      } else if (deliverabilityScore >= 60) {
        recommendation = 'Decent setup, but could be improved';
      } else {
        recommendation = 'Poor setup - high risk of emails going to spam';
      }

      return res.json({
        success: true,
        domain,
        deliverabilityScore,
        recommendation,
        details: results,
        suggestions: generateSuggestions(results)
      });

    } catch (error) {
      return res.json({
        success: false,
        message: 'Failed to check email deliverability',
        error: error.message
      });
    }

  } catch (error) {
    console.error('Email deliverability check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

function generateSuggestions(results) {
  const suggestions = [];

  if (!results.spf.configured) {
    suggestions.push({
      type: 'spf',
      priority: 'high',
      message: 'Add SPF record to prevent email spoofing',
      action: 'Add TXT record: v=spf1 include:your-mail-server.com ~all'
    });
  }

  if (!results.dmarc.configured) {
    suggestions.push({
      type: 'dmarc',
      priority: 'high',
      message: 'Add DMARC record for email authentication',
      action: 'Add TXT record to _dmarc subdomain: v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com'
    });
  }

  if (!results.mx.configured) {
    suggestions.push({
      type: 'mx',
      priority: 'critical',
      message: 'No MX records found - emails cannot be received',
      action: 'Configure MX records in your DNS settings'
    });
  }

  return suggestions;
}