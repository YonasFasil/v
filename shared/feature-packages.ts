// Pre-defined VENUIN feature packages with comprehensive feature sets

export const VENUIN_FEATURES = {
  'dashboard-analytics': 'Dashboard & Analytics',
  'event-management': 'Event & Booking Management', 
  'customer-management': 'Customer Management',
  'lead-management': 'Lead Management & Scoring',
  'proposal-system': 'Proposal Generation & Tracking',
  'stripe-payments': 'Payment Processing (Stripe Connect)',
  'venue-management': 'Multi-Venue Management',
  'service-packages': 'Service & Package Management',
  'gmail-integration': 'Gmail Integration',
  'task-management': 'Task & Team Management',
  'ai-voice-booking': 'AI Voice-to-Text Booking',
  'ai-scheduling': 'Smart AI Scheduling',
  'ai-email-replies': 'AI Email Auto-Replies',
  'ai-lead-scoring': 'AI Lead Priority Scoring',
  'ai-insights': 'AI-Powered Insights',
  'ai-proposal-generation': 'AI Proposal Content Generation',
  'mobile-responsive': 'Mobile-Responsive Interface',
  'audit-logs': 'Audit Logging & Security',
  'custom-branding': 'Custom Branding & Themes',
  'priority-support': 'Priority Customer Support',
  'api-access': 'API Access',
  'advanced-reporting': 'Advanced Reports & Export',
  'calendar-integration': 'Calendar Integration',
  'floor-plan-designer': '2D Floor Plan Designer'
};

export interface FeaturePackage {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  features: Record<string, boolean>;
  limits: {
    maxUsers: number;
    maxVenues: number;
    maxSpacesPerVenue: number;
  };
  popular?: boolean;
  status: 'active' | 'draft' | 'archived';
}

// Predefined feature packages for VENUIN
export const DEFAULT_FEATURE_PACKAGES: FeaturePackage[] = [
  {
    id: 'starter',
    name: 'Starter',
    slug: 'starter',
    description: 'Perfect for small venues and event spaces getting started with professional management.',
    priceMonthly: 29,
    priceYearly: 299,
    features: {
      'dashboard-analytics': true,
      'event-management': true,
      'customer-management': true,
      'venue-management': true,
      'mobile-responsive': true,
      'gmail-integration': true
    },
    limits: {
      maxUsers: 3,
      maxVenues: 1,
      maxSpacesPerVenue: 5
    },
    status: 'active'
  },
  {
    id: 'professional',
    name: 'Professional',
    slug: 'professional',
    description: 'Complete venue management solution with lead generation, proposals, and basic AI features.',
    priceMonthly: 79,
    priceYearly: 799,
    popular: true,
    features: {
      'dashboard-analytics': true,
      'event-management': true,
      'customer-management': true,
      'lead-management': true,
      'proposal-system': true,
      'venue-management': true,
      'service-packages': true,
      'task-management': true,
      'mobile-responsive': true,
      'gmail-integration': true,
      'calendar-integration': true,
      'advanced-reporting': true,
      'ai-lead-scoring': true,
      'ai-insights': true
    },
    limits: {
      maxUsers: 10,
      maxVenues: 3,
      maxSpacesPerVenue: 15
    },
    status: 'active'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    slug: 'enterprise',
    description: 'Full-featured platform with payments, all AI capabilities, and unlimited everything.',
    priceMonthly: 149,
    priceYearly: 1499,
    features: {
      'dashboard-analytics': true,
      'event-management': true,
      'customer-management': true,
      'lead-management': true,
      'proposal-system': true,
      'stripe-payments': true,
      'venue-management': true,
      'service-packages': true,
      'gmail-integration': true,
      'task-management': true,
      'ai-voice-booking': true,
      'ai-scheduling': true,
      'ai-email-replies': true,
      'ai-lead-scoring': true,
      'ai-insights': true,
      'ai-proposal-generation': true,
      'mobile-responsive': true,
      'audit-logs': true,
      'custom-branding': true,
      'priority-support': true,
      'api-access': true,
      'advanced-reporting': true,
      'calendar-integration': true,
      'floor-plan-designer': true
    },
    limits: {
      maxUsers: -1, // unlimited
      maxVenues: -1, // unlimited
      maxSpacesPerVenue: -1 // unlimited
    },
    status: 'active'
  }
];

// Helper function to check if a tenant has access to a specific feature
export function hasFeatureAccess(tenantFeatures: Record<string, boolean>, featureKey: string): boolean {
  return tenantFeatures?.[featureKey] === true;
}

// Helper function to get feature-limited value
export function getFeatureLimit(tenantLimits: any, limitKey: string): number {
  const limit = tenantLimits?.[limitKey];
  return limit === -1 ? Infinity : (limit || 0);
}