const { Pool } = require('pg');
const { getDatabaseUrl } = require('./db-config.js');

// Define all available features
const AVAILABLE_FEATURES = {
  // Core features (always available)
  dashboard_analytics: {
    name: "Dashboard Analytics",
    description: "View venue performance metrics and insights",
    category: "core"
  },
  venue_management: {
    name: "Venue Management",
    description: "Create and manage venue spaces",
    category: "core"
  },
  customer_management: {
    name: "Customer Management",
    description: "Manage customer information and history",
    category: "core"
  },
  event_booking: {
    name: "Event Booking",
    description: "Book and manage events",
    category: "core"
  },
  payment_processing: {
    name: "Payment Processing",
    description: "Process payments and invoices",
    category: "core"
  },

  // Premium features
  calendar_view: {
    name: "Calendar View",
    description: "Visual calendar interface for event management",
    category: "premium"
  },
  proposal_system: {
    name: "Proposal System",
    description: "Generate and send event proposals to customers",
    category: "premium"
  },
  leads_management: {
    name: "Lead Management",
    description: "Advanced lead tracking and conversion tools",
    category: "premium"
  },
  ai_analytics: {
    name: "AI Analytics",
    description: "Smart insights and predictive analytics",
    category: "premium"
  },
  voice_booking: {
    name: "Voice Booking",
    description: "Create bookings using voice commands",
    category: "premium"
  },
  floor_plans: {
    name: "Floor Plans",
    description: "Interactive floor plan designer and setup templates",
    category: "premium"
  },
  advanced_reports: {
    name: "Advanced Reports",
    description: "Detailed revenue and performance reports",
    category: "premium"
  },
  task_management: {
    name: "Task Management",
    description: "Team collaboration and task tracking",
    category: "premium"
  },
  custom_fields: {
    name: "Custom Fields",
    description: "Create custom booking and customer fields",
    category: "premium"
  }
};

// Core features that are always enabled
const CORE_FEATURES = ['dashboard_analytics', 'venue_management', 'customer_management', 'event_booking', 'payment_processing'];

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let pool;

  try {
    const databaseUrl = getDatabaseUrl();
    if (!databaseUrl) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    pool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });

    const { tenantId } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId is required' });
    }

    console.log('[TENANT-FEATURES] Fetching features for tenant:', tenantId);

    // Get tenant's subscription package and features
    const result = await pool.query(`
      SELECT
        t.id as tenant_id,
        t.name as tenant_name,
        t.subscription_package_id,
        sp.name as package_name,
        sp.features as package_features,
        sp.price as package_price
      FROM tenants t
      LEFT JOIN subscription_packages sp ON t.subscription_package_id = sp.id
      WHERE t.id = $1
    `, [tenantId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const tenant = result.rows[0];
    console.log('[TENANT-FEATURES] Found tenant:', {
      id: tenant.tenant_id,
      name: tenant.tenant_name,
      packageId: tenant.subscription_package_id,
      packageName: tenant.package_name
    });

    // Parse package features
    let packageFeatures = [];
    if (tenant.package_features) {
      try {
        packageFeatures = typeof tenant.package_features === 'string'
          ? JSON.parse(tenant.package_features)
          : tenant.package_features;

        if (!Array.isArray(packageFeatures)) {
          packageFeatures = [];
        }
      } catch (error) {
        console.error('[TENANT-FEATURES] Error parsing package features:', error);
        packageFeatures = [];
      }
    }

    console.log('[TENANT-FEATURES] Package features:', packageFeatures);

    // Determine enabled features
    let enabledFeatures = [...CORE_FEATURES]; // Always include core features

    // Add premium features from the package
    const premiumFeatures = packageFeatures.filter(feature =>
      AVAILABLE_FEATURES[feature] && AVAILABLE_FEATURES[feature].category === 'premium'
    );

    enabledFeatures = [...enabledFeatures, ...premiumFeatures];

    console.log('[TENANT-FEATURES] Final enabled features:', enabledFeatures);

    // Build feature objects
    const features = Object.keys(AVAILABLE_FEATURES).map(featureId => ({
      id: featureId,
      name: AVAILABLE_FEATURES[featureId].name,
      description: AVAILABLE_FEATURES[featureId].description,
      category: AVAILABLE_FEATURES[featureId].category,
      enabled: enabledFeatures.includes(featureId)
    }));

    // Group features by category
    const featuresByCategory = {
      core: features.filter(f => f.category === 'core'),
      premium: features.filter(f => f.category === 'premium')
    };

    const enabledCount = features.filter(f => f.enabled).length;
    const totalCount = features.length;

    return res.json({
      success: true,
      tenant: {
        id: tenant.tenant_id,
        name: tenant.tenant_name,
        subscriptionPackageId: tenant.subscription_package_id
      },
      package: {
        id: tenant.subscription_package_id,
        name: tenant.package_name || 'No Package',
        price: tenant.package_price || 0,
        features: packageFeatures
      },
      features: {
        all: features,
        byCategory: featuresByCategory,
        enabled: features.filter(f => f.enabled),
        disabled: features.filter(f => !f.enabled),
        summary: {
          enabled: enabledCount,
          total: totalCount,
          percentage: Math.round((enabledCount / totalCount) * 100)
        }
      }
    });

  } catch (error) {
    console.error('[TENANT-FEATURES] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  } finally {
    if (pool) {
      await pool.end();
    }
  }
};