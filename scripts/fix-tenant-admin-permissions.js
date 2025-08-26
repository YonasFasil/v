const { drizzle } = require('drizzle-orm/neon-serverless');
const { neon, neonConfig } = require('@neondatabase/serverless');
const { eq } = require('drizzle-orm');
require('dotenv/config');

// Import schema (CommonJS compatible)
const schema = require('../dist/shared/schema');
const users = schema.users;

// Configure Neon
neonConfig.fetchConnectionCache = true;

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

const ALL_PERMISSIONS = [
  'view_dashboard',
  'manage_events',
  'view_events', 
  'manage_customers',
  'view_customers',
  'manage_venues',
  'view_venues',
  'manage_payments',
  'view_payments',
  'manage_proposals',
  'view_proposals',
  'manage_settings',
  'view_reports',
  'manage_leads',
  'use_ai_features',
  // Legacy permissions for backward compatibility
  'dashboard',
  'users', 
  'venues',
  'bookings',
  'customers', 
  'proposals',
  'tasks',
  'payments',
  'settings'
];

async function fixTenantAdminPermissions() {
  try {
    console.log('🔧 Fixing tenant admin permissions...');
    
    // Find all tenant_admin users with empty or null permissions
    const tenantAdmins = await db
      .select()
      .from(users)
      .where(eq(users.role, 'tenant_admin'));
    
    console.log(`Found ${tenantAdmins.length} tenant admin users`);
    
    for (const admin of tenantAdmins) {
      console.log(`Checking user: ${admin.email} (${admin.id})`);
      console.log(`Current permissions:`, admin.permissions);
      
      // Check if permissions are empty or null
      if (!admin.permissions || admin.permissions.length === 0) {
        console.log(`📝 Updating permissions for ${admin.email}`);
        
        await db
          .update(users)
          .set({ permissions: ALL_PERMISSIONS })
          .where(eq(users.id, admin.id));
          
        console.log(`✅ Updated permissions for ${admin.email}`);
      } else {
        console.log(`✅ User ${admin.email} already has permissions`);
      }
    }
    
    console.log('🎉 Tenant admin permissions fix completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing tenant admin permissions:', error);
    process.exit(1);
  }
}

fixTenantAdminPermissions();