import 'dotenv/config';
import { db } from '../server/db';
import { users, tenants, subscriptionPackages } from '../shared/schema';
import bcryptjs from 'bcryptjs';
import { sql } from 'drizzle-orm';

async function setupDatabase() {
  console.log('🚀 Setting up database...');

  try {
    // First, let's create a basic subscription package
    console.log('📦 Creating default subscription package...');
    const [defaultPackage] = await db.insert(subscriptionPackages).values({
      name: 'Enterprise',
      description: 'Full access package for enterprise customers',
      price: '0.00', // Free for now
      billingInterval: 'monthly',
      trialDays: 30,
      maxVenues: 999,
      maxUsers: 999,
      maxBookingsPerMonth: 9999,
      features: ['all_features'],
      isActive: true,
      sortOrder: 0
    }).returning();

    console.log('✅ Default package created:', defaultPackage.name);

    // Create a default tenant for super admin operations
    console.log('🏢 Creating default tenant...');
    const [defaultTenant] = await db.insert(tenants).values({
      name: 'System Administration',
      slug: 'system-admin',
      subdomain: 'admin',
      subscriptionPackageId: defaultPackage.id,
      status: 'active',
      primaryColor: '#3b82f6',
      currentUsers: 1,
      currentVenues: 0,
      monthlyBookings: 0
    }).returning();

    console.log('✅ Default tenant created:', defaultTenant.name);

    // Create super admin user
    console.log('👤 Creating super admin user...');
    
    const username = process.env.SUPER_ADMIN_USERNAME || 'superadmin';
    const password = process.env.SUPER_ADMIN_PASSWORD || 'admin123'; // Change this!
    const email = process.env.SUPER_ADMIN_EMAIL || 'admin@yourdomain.com';
    const name = process.env.SUPER_ADMIN_NAME || 'Super Administrator';

    const hashedPassword = await bcryptjs.hash(password, 12);

    const [superAdmin] = await db.insert(users).values({
      username,
      password: hashedPassword,
      name,
      email,
      tenantId: null, // Super admin has no tenant
      role: 'super_admin',
      permissions: ['all_permissions'],
      isActive: true,
      lastLoginAt: null
    }).returning();

    console.log('✅ Super admin user created:', superAdmin.username);
    
    console.log('\n🎉 Database setup complete!');
    console.log('\n📋 Super Admin Credentials:');
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
    console.log(`   Email: ${email}`);
    console.log('\n⚠️  IMPORTANT: Change the default password after first login!');
    console.log('\n🌐 You can now access:');
    console.log('   - Super Admin Dashboard: /super-admin-login');
    console.log('   - Regular Tenant Login: /tenant-login');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

// Run the setup
setupDatabase().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('❌ Setup script failed:', error);
  process.exit(1);
});