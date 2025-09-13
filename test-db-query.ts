import { db, tenants, users, bookings } from "./server/db";

async function queryTenantData() {
  try {
    console.log("🔍 Querying database for tenant 'testetest'...");
    
    // Find the tenant
    const tenantResults = await db.select().from(tenants);
    console.log("📊 All tenants:", tenantResults.map(t => ({ id: t.id, name: t.name, slug: t.slug })));
    
    const testTenant = tenantResults.find(t => t.slug === 'testetest' || t.name === 'testetest');
    if (!testTenant) {
      console.log("❌ No tenant found with name/slug 'testetest'");
      return;
    }
    
    console.log("✅ Found tenant:", { id: testTenant.id, name: testTenant.name, slug: testTenant.slug });
    
    // Find users for this tenant
    const userResults = await db.select().from(users);
    const tenantUsers = userResults.filter(u => u.tenantId === testTenant.id);
    console.log("👥 Users for tenant:", tenantUsers.map(u => ({ id: u.id, email: u.email, role: u.role })));
    
    // Find bookings for this tenant
    const bookingResults = await db.select().from(bookings);
    const tenantBookings = bookingResults.filter(b => b.tenantId === testTenant.id);
    console.log("📅 Bookings for tenant:", tenantBookings.map(b => ({ id: b.id, name: b.eventName, date: b.eventDate })));
    
  } catch (error) {
    console.error("❌ Error querying database:", error);
  }
  
  process.exit(0);
}

queryTenantData();