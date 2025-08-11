import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

// Initialize Firebase Admin
const serviceAccountKey = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

const app = initializeApp({
  credential: cert(serviceAccountKey),
  projectId: serviceAccountKey.project_id
});

const auth = getAuth();
const db = getFirestore();

async function deleteProblematicUser() {
  try {
    console.log('🔍 Looking for user: yonassalelew@gmail.com...');
    
    // Get user by email
    const userRecord = await auth.getUserByEmail('yonassalelew@gmail.com');
    console.log('👤 Found user:', userRecord.uid);
    
    // Delete from Firestore first
    console.log('🗑️ Deleting user document from Firestore...');
    await db.collection('users').doc(userRecord.uid).delete();
    console.log('✅ User document deleted from Firestore');
    
    // Delete from Firebase Auth
    console.log('🗑️ Deleting user from Firebase Auth...');
    await auth.deleteUser(userRecord.uid);
    console.log('✅ User deleted from Firebase Auth');
    
    console.log('🎉 User yonassalelew@gmail.com has been completely removed!');
    
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.log('ℹ️ User yonassalelew@gmail.com not found - may already be deleted');
    } else {
      console.error('❌ Error deleting user:', error);
    }
  }
}

deleteProblematicUser().then(() => {
  console.log('✅ Cleanup completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});