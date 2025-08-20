import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import bcryptjs from 'bcryptjs';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required');
}

const sql = neon(process.env.DATABASE_URL);

async function setupDatabase() {
  console.log('🚀 Setting up database...');

  try {
    // Create subscription package with raw SQL
    console.log('📦 Creating default subscription package...');
    
    const packageId = crypto.randomUUID();
    await sql`
      INSERT INTO subscription_packages (id, name, description, price, billing_interval, trial_days, max_venues, max_users, max_bookings_per_month, features, is_active, sort_order, created_at)
      VALUES (${packageId}, 'Enterprise', 'Full access package for enterprise customers', 0.00, 'monthly', 30, 999, 999, 9999, '["all_features"]'::jsonb, true, 0, NOW())
      ON CONFLICT (id) DO NOTHING
    `;
    
    console.log('✅ Default package created');

    // Create default tenant
    console.log('🏢 Creating default tenant...');
    const tenantId = crypto.randomUUID();
    await sql`
      INSERT INTO tenants (id, name, slug, subdomain, subscription_package_id, status, primary_color, current_users, current_venues, monthly_bookings, created_at)
      VALUES (${tenantId}, 'System Administration', 'system-admin', 'admin', ${packageId}, 'active', '#3b82f6', 1, 0, 0, NOW())
      ON CONFLICT (slug) DO NOTHING
    `;

    console.log('✅ Default tenant created');

    // Create super admin user
    console.log('👤 Creating super admin user...');
    
    const username = process.env.SUPER_ADMIN_USERNAME || 'superadmin';
    const password = process.env.SUPER_ADMIN_PASSWORD || 'VenueAdmin2024!';
    const email = process.env.SUPER_ADMIN_EMAIL || 'admin@yourdomain.com';
    const name = process.env.SUPER_ADMIN_NAME || 'Super Administrator';

    const hashedPassword = await bcryptjs.hash(password, 12);
    const userId = crypto.randomUUID();

    await sql`
      INSERT INTO users (id, username, password, name, email, tenant_id, role, permissions, is_active, created_at)
      VALUES (${userId}, ${username}, ${hashedPassword}, ${name}, ${email}, NULL, 'super_admin', '["all_permissions"]'::jsonb, true, NOW())
      ON CONFLICT (username) DO UPDATE SET
        password = ${hashedPassword},
        name = ${name},
        email = ${email}
    `;

    console.log('✅ Super admin user created/updated');
    
    console.log('\n🎉 Database setup complete!');
    console.log('\n📋 Super Admin Credentials:');
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
    console.log(`   Email: ${email}`);
    console.log('\n🌐 You can now access:');
    console.log('   - Super Admin Dashboard: /super-admin-login');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    console.log('\n🔧 If you see table errors, run: npm run db:push first');
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