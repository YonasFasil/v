import { adminDb } from './firebase-admin';

export async function setupInitialData() {
  console.log('Setting up initial Firestore data...');
  
  try {
    // Create initial super admin user document
    await adminDb.collection('users').doc('yonasfasil.sl@gmail.com').set({
      email: 'yonasfasil.sl@gmail.com',
      isSuperAdmin: true,
      role: 'super_admin',
      createdAt: new Date(),
      updatedAt: new Date()
    }, { merge: true });

    // Create some sample feature packages
    const samplePackages = [
      {
        id: 'starter',
        name: 'Starter',
        description: 'Perfect for small venues getting started',
        features: {
          venues: true,
          bookings: true,
          customers: true,
          basic_reporting: true
        },
        limits: {
          staff: 3,
          venues: 1
        },
        priceMonthly: 29,
        price_monthly: 29,
        status: 'active',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'professional',
        name: 'Professional',
        description: 'Advanced features for growing businesses',
        features: {
          venues: true,
          bookings: true,
          customers: true,
          leads: true,
          proposals: true,
          payments: true,
          reporting: true
        },
        limits: {
          staff: 10,
          venues: 3
        },
        priceMonthly: 79,
        price_monthly: 79,
        status: 'active',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const pkg of samplePackages) {
      await adminDb.collection('featurePackages').doc(pkg.id).set(pkg, { merge: true });
    }

    console.log('Initial Firestore data setup completed successfully');
  } catch (error) {
    console.error('Error setting up initial data:', error);
  }
}

// Run setup if called directly
if (require.main === module) {
  setupInitialData();
}