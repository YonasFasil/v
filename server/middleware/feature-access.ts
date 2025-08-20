import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { type TenantRequest } from "./tenant";

export interface FeatureRequest extends TenantRequest {
  hasFeature?: (featureId: string) => Promise<boolean>;
}

// Mapping of feature IDs to their descriptions and categories
export const AVAILABLE_FEATURES = {
  // Core Features
  dashboard_analytics: {
    name: "Dashboard & Analytics",
    description: "Core dashboard with basic metrics and insights",
    category: "core"
  },
  venue_management: {
    name: "Venue Management", 
    description: "Create and manage venue spaces and amenities",
    category: "core"
  },
  event_booking: {
    name: "Event Booking",
    description: "Calendar view and event booking system", 
    category: "core"
  },
  customer_management: {
    name: "Customer Management",
    description: "Manage customer profiles and contact information",
    category: "core"
  },
  proposal_system: {
    name: "Proposal System",
    description: "Generate and send event proposals to customers",
    category: "core"
  },
  payment_processing: {
    name: "Payment Processing",
    description: "Accept payments and manage transactions",
    category: "core"
  },
  
  // Advanced Features
  leads_management: {
    name: "Leads Management",
    description: "Advanced lead tracking and conversion tools",
    category: "advanced"
  },
  ai_analytics: {
    name: "AI-Powered Analytics", 
    description: "Smart insights and predictive analytics",
    category: "advanced"
  },
  voice_booking: {
    name: "Voice-to-Text Booking",
    description: "Create bookings using voice commands",
    category: "advanced"
  },
  floor_plans: {
    name: "Floor Plans & Setup Styles",
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
  
  // Premium Features
  custom_branding: {
    name: "Custom Branding",
    description: "White-label your venue platform",
    category: "premium"
  },
  api_access: {
    name: "API Access",
    description: "Full REST API access for integrations",
    category: "premium"
  },
  priority_support: {
    name: "Priority Support", 
    description: "24/7 premium customer support",
    category: "premium"
  },
  advanced_integrations: {
    name: "Advanced Integrations",
    description: "Connect to external CRM and marketing tools",
    category: "premium"
  },
  multi_location: {
    name: "Multi-Location Support",
    description: "Manage multiple venue locations",
    category: "premium"
  },
  custom_fields: {
    name: "Custom Fields",
    description: "Create custom booking and customer fields",
    category: "premium"
  }
};

// Basic trial features that are always available
const TRIAL_FEATURES = [
  'dashboard_analytics',
  'venue_management', 
  'event_booking',
  'customer_management'
];

/**
 * Get the features available to a tenant based on their subscription package
 */
export async function getTenantFeatures(tenantId: string): Promise<string[]> {
  const tenant = await storage.getTenant(tenantId);
  if (!tenant) {
    return TRIAL_FEATURES;
  }

  // If no package assigned, return trial features
  if (!tenant.subscriptionPackageId) {
    return TRIAL_FEATURES;
  }

  // Get the subscription package
  const subscriptionPackage = await storage.getSubscriptionPackage(tenant.subscriptionPackageId);
  if (!subscriptionPackage || !subscriptionPackage.isActive) {
    return TRIAL_FEATURES;
  }

  // Return package features or trial features if package has no features defined
  const packageFeatures = Array.isArray(subscriptionPackage.features) ? subscriptionPackage.features : [];
  return packageFeatures.length > 0 ? packageFeatures : TRIAL_FEATURES;
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
  return (req: FeatureRequest, res: Response, next: NextFunction) => {
    if (!req.tenant) {
      return res.status(401).json({ 
        message: "Authentication required",
        code: "AUTH_REQUIRED"
      });
    }

    if (!hasFeatureAccess(req.tenant.id, featureId)) {
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
 * Check package limits (users, venues, bookings)
 */
export async function checkPackageLimits(tenantId: string): Promise< {
  usersWithinLimit: boolean;
  venuesWithinLimit: boolean;
  bookingsWithinLimit: boolean;
  limits: {
    maxUsers: number;
    maxVenues: number; 
    maxBookingsPerMonth: number;
    currentUsers: number;
    currentVenues: number;
    currentBookings: number;
  };
}> {
  const tenant = await storage.getTenant(tenantId);
  if (!tenant) {
    return {
      usersWithinLimit: false,
      venuesWithinLimit: false,
      bookingsWithinLimit: false,
      limits: {
        maxUsers: 0,
        maxVenues: 0,
        maxBookingsPerMonth: 0,
        currentUsers: 0,
        currentVenues: 0,
        currentBookings: 0
      }
    };
  }

  // Get package limits or defaults for trial
  let maxUsers = 3;
  let maxVenues = 1;
  let maxBookingsPerMonth = 50;

  if (tenant.subscriptionPackageId) {
    const subscriptionPackage = await storage.getSubscriptionPackage(tenant.subscriptionPackageId);
    if (subscriptionPackage && subscriptionPackage.isActive) {
      maxUsers = subscriptionPackage.maxUsers || 3;
      maxVenues = subscriptionPackage.maxVenues || 1;
      maxBookingsPerMonth = subscriptionPackage.maxBookingsPerMonth || 50;
    }
  }

  const currentUsers = tenant.currentUsers || 0;
  const currentVenues = tenant.currentVenues || 0;
  const currentBookings = tenant.monthlyBookings || 0;

  return {
    usersWithinLimit: currentUsers < maxUsers,
    venuesWithinLimit: currentVenues < maxVenues,
    bookingsWithinLimit: currentBookings < maxBookingsPerMonth,
    limits: {
      maxUsers,
      maxVenues,
      maxBookingsPerMonth,
      currentUsers,
      currentVenues,
      currentBookings
    }
  };
}

/**
 * Middleware to check package limits before allowing actions
 */
export function requireWithinLimits(limitType: 'users' | 'venues' | 'bookings') {
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
      case 'bookings':
        withinLimit = limits.bookingsWithinLimit;
        limitName = 'bookings per month';
        current = limits.limits.currentBookings;
        max = limits.limits.maxBookingsPerMonth;
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