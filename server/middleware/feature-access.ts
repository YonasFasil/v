import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { type TenantRequest } from "./tenant";
import { type AuthenticatedRequest } from "./auth";

export interface FeatureRequest extends TenantRequest, AuthenticatedRequest {
  hasFeature?: (featureId: string) => Promise<boolean>;
}

// Mapping of feature IDs to their descriptions and categories
export const AVAILABLE_FEATURES = {
  // Optional Features (can be included in packages)
  calendar_view: {
    name: "Calendar View",
    description: "Visual calendar interface for event management", 
    category: "advanced"
  },
  proposal_system: {
    name: "Proposal System",
    description: "Generate and send event proposals to customers",
    category: "advanced"
  },
  leads_management: {
    name: "Lead Management",
    description: "Advanced lead tracking and conversion tools",
    category: "advanced"
  },
  ai_analytics: {
    name: "AI Analytics", 
    description: "Smart insights and predictive analytics",
    category: "advanced"
  },
  voice_booking: {
    name: "Voice Booking",
    description: "Create bookings using voice commands",
    category: "advanced"
  },
  floor_plans: {
    name: "Floor Plans",
    description: "Interactive floor plan designer and setup templates", 
    category: "advanced"
  },
  advanced_reports: {
    name: "Advanced Reports",
    description: "Detailed revenue and performance reports",
    category: "advanced"
  },
  task_management: {
    name: "Task Management",
    description: "Team collaboration and task tracking",
    category: "advanced"
  },
  custom_fields: {
    name: "Custom Fields",
    description: "Create custom booking and customer fields",
    category: "advanced"
  }
};

// Default features that are always available to all tenants
const DEFAULT_FEATURES = [
  'dashboard_analytics',
  'venue_management', 
  'customer_management',
  'payment_processing',
  'event_booking'  // Event booking is now a default feature
];

/**
 * Get the features available to a tenant based on their subscription package
 */
export async function getTenantFeatures(tenantId: string): Promise<string[]> {
  const tenant = await storage.getTenant(tenantId);
  if (!tenant) {
    console.log('[TENANT-FEATURES-DEBUG] No tenant found for ID:', tenantId);
    return DEFAULT_FEATURES;
  }

  // If no package assigned, return default features only
  // Handle both camelCase and snake_case field names
  const subscriptionPackageId = tenant.subscriptionPackageId || tenant.subscription_package_id;
  console.log('[TENANT-FEATURES-DEBUG] Tenant object:', JSON.stringify(tenant, null, 2));
  console.log('[TENANT-FEATURES-DEBUG] subscriptionPackageId resolved as:', subscriptionPackageId);
  
  if (!subscriptionPackageId) {
    console.log('[TENANT-FEATURES-DEBUG] No subscription package ID found, returning default features');
    return DEFAULT_FEATURES;
  }

  // Get the subscription package
  console.log('[TENANT-FEATURES-DEBUG] Fetching subscription package with ID:', subscriptionPackageId);
  const subscriptionPackage = await storage.getSubscriptionPackage(subscriptionPackageId);
  console.log('[TENANT-FEATURES-DEBUG] getSubscriptionPackage result:', subscriptionPackage ? 'found' : 'null', subscriptionPackage?.name || 'no-name');
  
  // Handle both camelCase and snake_case field names
  const isActive = subscriptionPackage?.isActive ?? subscriptionPackage?.is_active;
  console.log('[TENANT-FEATURES-DEBUG] Package isActive:', isActive);
  
  if (!subscriptionPackage || !isActive) {
    console.log('[TENANT-FEATURES-DEBUG] Package not found or inactive, returning default features');
    return DEFAULT_FEATURES;
  }

  // Get package features
  const packageFeatures = Array.isArray(subscriptionPackage.features) ? subscriptionPackage.features : [];
  
  // If package includes "everything", grant all available features
  if (packageFeatures.includes('everything')) {
    const allFeatureIds = Object.keys(AVAILABLE_FEATURES);
    return [...DEFAULT_FEATURES, ...allFeatureIds];
  }

  // Filter package features to only include valid feature IDs from AVAILABLE_FEATURES
  const validPackageFeatures = packageFeatures.filter(feature => 
    Object.keys(AVAILABLE_FEATURES).includes(feature)
  );

  // Combine default features with valid package-specific features
  return [...DEFAULT_FEATURES, ...validPackageFeatures];
}

/**
 * Check if a tenant has access to a specific feature
 */
export async function hasFeatureAccess(tenantId: string, featureId: string): Promise<boolean> {
  const availableFeatures = await getTenantFeatures(tenantId);
  return availableFeatures.includes(featureId);
}

/**
 * Middleware to add feature checking functionality to requests
 */
export function addFeatureAccess(req: FeatureRequest, res: Response, next: NextFunction) {
  if (!req.tenant) {
    return next();
  }

  // Add hasFeature function to request object
  req.hasFeature = async (featureId: string) => {
    return await hasFeatureAccess(req.tenant!.id, featureId);
  };

  next();
}

/**
 * Middleware to require a specific feature for an endpoint
 */
export function requireFeature(featureId: string) {
  return async (req: FeatureRequest, res: Response, next: NextFunction) => {
    // Super admins have access to all features
    if (req.user?.role === 'super_admin') {
      return next();
    }
    
    if (!req.tenant) {
      return res.status(401).json({ 
        message: "Authentication required",
        code: "AUTH_REQUIRED"
      });
    }

    if (!(await hasFeatureAccess(req.tenant.id, featureId))) {
      const feature = AVAILABLE_FEATURES[featureId as keyof typeof AVAILABLE_FEATURES];
      return res.status(403).json({ 
        message: `This feature (${feature?.name || featureId}) is not available in your current subscription plan`,
        code: "FEATURE_NOT_AVAILABLE",
        featureId,
        featureName: feature?.name,
        upgradeRequired: true
      });
    }

    next();
  };
}

/**
 * Endpoint to get available features for a tenant
 */
export async function getFeaturesForTenant(req: FeatureRequest, res: Response) {
  if (!req.tenant) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const availableFeatures = await getTenantFeatures(req.tenant.id);
  const featureDetails = availableFeatures.map(featureId => ({
    id: featureId,
    ...AVAILABLE_FEATURES[featureId as keyof typeof AVAILABLE_FEATURES],
    enabled: true
  }));

  // Add disabled features for reference
  const allFeatureIds = Object.keys(AVAILABLE_FEATURES);
  const disabledFeatures = allFeatureIds
    .filter(featureId => !availableFeatures.includes(featureId))
    .map(featureId => ({
      id: featureId,
      ...AVAILABLE_FEATURES[featureId as keyof typeof AVAILABLE_FEATURES],
      enabled: false
    }));

  res.json({
    tenant: req.tenant,
    package: req.tenant.subscriptionPackageId ? await storage.getSubscriptionPackage(req.tenant.subscriptionPackageId) : null,
    features: {
      enabled: featureDetails,
      disabled: disabledFeatures,
      total: allFeatureIds.length,
      available: availableFeatures.length
    }
  });
}

/**
 * Check package limits (users, venues)
 */
export async function checkPackageLimits(tenantId: string): Promise< {
  usersWithinLimit: boolean;
  venuesWithinLimit: boolean;
  limits: {
    maxUsers: number;
    maxVenues: number;
    currentUsers: number;
    currentVenues: number;
  };
}> {
  const tenant = await storage.getTenant(tenantId);
  if (!tenant) {
    return {
      usersWithinLimit: false,
      venuesWithinLimit: false,
      limits: {
        maxUsers: 0,
        maxVenues: 0,
        currentUsers: 0,
        currentVenues: 0
      }
    };
  }

  // Get package limits or defaults
  let maxUsers = 3;
  let maxVenues = 1;

  if (tenant.subscriptionPackageId) {
    const subscriptionPackage = await storage.getSubscriptionPackage(tenant.subscriptionPackageId);
    if (subscriptionPackage && subscriptionPackage.isActive) {
      maxUsers = subscriptionPackage.maxUsers || 3;
      maxVenues = subscriptionPackage.maxVenues || 1;
    }
  }

  const currentUsers = tenant.currentUsers || 0;
  const currentVenues = tenant.currentVenues || 0;

  return {
    usersWithinLimit: currentUsers < maxUsers,
    venuesWithinLimit: currentVenues < maxVenues,
    limits: {
      maxUsers,
      maxVenues,
      currentUsers,
      currentVenues
    }
  };
}

/**
 * Middleware to check package limits before allowing actions
 */
export function requireWithinLimits(limitType: 'users' | 'venues') {
  return async (req: FeatureRequest, res: Response, next: NextFunction) => {
    if (!req.tenant) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const limits = await checkPackageLimits(req.tenant.id);
    
    let withinLimit = false;
    let limitName = '';
    let current = 0;
    let max = 0;

    switch (limitType) {
      case 'users':
        withinLimit = limits.usersWithinLimit;
        limitName = 'users';
        current = limits.limits.currentUsers;
        max = limits.limits.maxUsers;
        break;
      case 'venues':
        withinLimit = limits.venuesWithinLimit;
        limitName = 'venues';
        current = limits.limits.currentVenues;
        max = limits.limits.maxVenues;
        break;
    }

    if (!withinLimit) {
      return res.status(403).json({
        message: `You have reached your ${limitName} limit (${current}/${max}). Please upgrade your subscription to add more.`,
        code: "LIMIT_EXCEEDED",
        limitType,
        current,
        max,
        upgradeRequired: true
      });
    }

    next();
  };
}