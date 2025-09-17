const { Pool } = require('pg');
const { getDatabaseUrl } = require('./db-config.js');

module.exports = async function handler(req, res) {
  const pool = new Pool({
    connectionString: getDatabaseUrl()
  });

  try {
    console.log('📦 Subscription packages API called');

    // Get all active subscription packages for upgrade options
    const packagesResult = await pool.query(`
      SELECT
        id,
        name,
        description,
        price,
        billing_interval,
        trial_days,
        max_venues,
        max_users,
        max_bookings_per_month,
        max_spaces,
        features,
        is_active,
        sort_order
      FROM subscription_packages
      WHERE is_active = true
      ORDER BY price ASC
    `);

    const packages = packagesResult.rows.map(pkg => {
      // Parse features JSON if it's a string
      let features = [];
      if (pkg.features) {
        try {
          features = typeof pkg.features === 'string' ? JSON.parse(pkg.features) : pkg.features;
        } catch (error) {
          console.error('Error parsing features for package:', pkg.name, error);
          features = [];
        }
      }

      return {
        id: pkg.id,
        name: pkg.name,
        description: pkg.description,
        price: parseFloat(pkg.price),
        billingInterval: pkg.billing_interval,
        trialDays: pkg.trial_days,
        maxVenues: pkg.max_venues,
        maxUsers: pkg.max_users,
        maxBookingsPerMonth: pkg.max_bookings_per_month,
        maxSpaces: pkg.max_spaces,
        features: features,
        isActive: pkg.is_active,
        sortOrder: pkg.sort_order,
        isPopular: pkg.sort_order === 2, // Professional package
        isEnterprise: pkg.price >= 150 // Enterprise tiers
      };
    });

    console.log(`✅ Found ${packages.length} subscription packages`);

    res.json({
      success: true,
      packages
    });

  } catch (error) {
    console.error('❌ Subscription packages API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription packages',
      details: error.message
    });
  } finally {
    await pool.end();
  }
};