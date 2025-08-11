import { storage } from './storage';
import { hashPassword } from './middleware/auth';

// Production initialization script
export async function initializeProduction() {
  console.log('🚀 Initializing VENUIN for production...');

  // Check if super admin already exists
  const existingSuperAdmin = await storage.getUserByEmail('yonasfasil.sl@gmail.com');
  
  if (!existingSuperAdmin) {
    console.log('📧 Creating super admin user: yonasfasil.sl@gmail.com');
    
    // Create super admin user
    const hashedPassword = await hashPassword('SuperAdmin2025!');
    
    await storage.createUser({
      tenantId: null, // Super admin has no tenant
      username: 'superadmin',
      password: hashedPassword,
      name: 'Yonas Fasil',
      email: 'yonasfasil.sl@gmail.com',
      role: 'super_admin',
      isActive: true,
    });

    console.log('✅ Super admin created successfully');
  } else {
    console.log('✅ Super admin already exists');
  }

  // Initialize default subscription packages if not exist
  const packages = await storage.getSubscriptionPackages();
  if (packages.length === 0) {
    console.log('📦 Creating default subscription packages...');
    
    await storage.createSubscriptionPackage({
      name: 'Basic',
      description: 'Perfect for small venues and events',
      price: '29.99',
      billingInterval: 'month',
      maxVenues: 1,
      maxUsers: 3,
      maxEventsPerMonth: 20,
      storageGB: 5,
      features: {
        basic_calendar: true,
        customer_management: true,
        basic_reports: true,
        email_notifications: true
      },
      isActive: true,
      isPopular: false
    });

    await storage.createSubscriptionPackage({
      name: 'Professional',
      description: 'Ideal for growing venue businesses',
      price: '99.99',
      billingInterval: 'month',
      maxVenues: 5,
      maxUsers: 10,
      maxEventsPerMonth: 100,
      storageGB: 50,
      features: {
        basic_calendar: true,
        customer_management: true,
        basic_reports: true,
        email_notifications: true,
        advanced_calendar: true,
        proposal_system: true,
        payment_processing: true,
        team_collaboration: true,
        advanced_reports: true
      },
      isActive: true,
      isPopular: true
    });

    await storage.createSubscriptionPackage({
      name: 'Enterprise',
      description: 'Full-featured solution for large operations',
      price: '299.99',
      billingInterval: 'month',
      maxVenues: null, // Unlimited
      maxUsers: null, // Unlimited
      maxEventsPerMonth: null, // Unlimited
      storageGB: null, // Unlimited
      features: {
        basic_calendar: true,
        customer_management: true,
        basic_reports: true,
        email_notifications: true,
        advanced_calendar: true,
        proposal_system: true,
        payment_processing: true,
        team_collaboration: true,
        advanced_reports: true,
        ai_insights: true,
        api_access: true,
        custom_branding: true,
        priority_support: true,
        advanced_permissions: true
      },
      isActive: true,
      isPopular: false
    });

    console.log('✅ Default subscription packages created');
  }

  console.log('🎉 Production initialization complete!');
  console.log('');
  console.log('🔐 Super Admin Login Details:');
  console.log('   Email: yonasfasil.sl@gmail.com');
  console.log('   Password: SuperAdmin2025!');
  console.log('');
  console.log('🌐 Access the super admin panel at: /admin');
  console.log('📱 Main application at: /');
}