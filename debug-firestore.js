// Debug script to check Firestore data for the problematic user
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { credential } = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
const app = initializeApp({
  credential: credential.cert(serviceAccount),
});

const db = getFirestore(app);

async function debugUserTenantData() {
  try {
    const userEmail = 'marketing@reinvimd.com';
    const userUid = 'Zg5xgNcVlQZfSNJXGykFz3wZsYw1'; // From the logs
    
    console.log('=== DEBUG: User Tenant Relationship ===');
    console.log('User UID:', userUid);
    console.log('User Email:', userEmail);
    
    // 1. Check if user exists in users collection
    const userDoc = await db.collection('users').doc(userUid).get();
    console.log('\n1. User document exists:', userDoc.exists);
    if (userDoc.exists) {
      console.log('User data:', userDoc.data());
    }
    
    // 2. Check tenant_users collection for this user
    console.log('\n2. Checking tenant_users collection...');
    const tenantUsersSnapshot = await db.collection('tenant_users')
      .where('userId', '==', userUid)
      .get();
    
    console.log('Tenant_users records found:', tenantUsersSnapshot.size);
    tenantUsersSnapshot.forEach(doc => {
      console.log('Tenant_user record:', { id: doc.id, ...doc.data() });
    });
    
    // 3. Check tenants collection
    console.log('\n3. All tenants in database...');
    const tenantsSnapshot = await db.collection('tenants').get();
    console.log('Total tenants:', tenantsSnapshot.size);
    tenantsSnapshot.forEach(doc => {
      const data = doc.data();
      console.log('Tenant:', { id: doc.id, name: data.name, slug: data.slug, contactEmail: data.contactEmail });
    });
    
    // 4. Check if there are tenant_users with different userId format
    console.log('\n4. All tenant_users records...');
    const allTenantUsersSnapshot = await db.collection('tenant_users').get();
    console.log('Total tenant_users:', allTenantUsersSnapshot.size);
    allTenantUsersSnapshot.forEach(doc => {
      const data = doc.data();
      console.log('Tenant_user:', { id: doc.id, userId: data.userId, tenantId: data.tenantId, role: data.role });
    });
    
  } catch (error) {
    console.error('Debug error:', error);
  }
  
  process.exit(0);
}

debugUserTenantData();