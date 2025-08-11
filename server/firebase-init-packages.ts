import { adminDb } from './firebase-admin';
// Default feature packages
const DEFAULT_FEATURE_PACKAGES = [
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

// Initialize default feature packages in Firebase
export async function initializeDefaultPackages() {
  try {
    console.log('Initializing default feature packages...');
    
    const batch = adminDb.batch();
    
    for (const pkg of DEFAULT_FEATURE_PACKAGES) {
      const docRef = adminDb.collection('featurePackages').doc(pkg.id);
      
      // Check if package already exists
      const existingDoc = await docRef.get();
      if (!existingDoc.exists) {
        batch.set(docRef, {
          ...pkg,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log(`Adding package: ${pkg.name}`);
      } else {
        console.log(`Package ${pkg.name} already exists, skipping...`);
      }
    }
    
    await batch.commit();
    console.log('Default feature packages initialized successfully');
    
  } catch (error) {
    console.error('Error initializing default packages:', error);
  }
}