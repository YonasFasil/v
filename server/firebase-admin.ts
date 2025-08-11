import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin SDK
let app;
if (getApps().length === 0) {
  // In development, we'll use the service account key
  // In production, this will use the default credentials
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      console.log('Service account key found, attempting to initialize Firebase Admin...');
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      console.log('Service account parsed, project_id:', serviceAccount.project_id);
      
      // Fix private key formatting - replace escaped newlines with actual newlines
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
      
      app = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });
      console.log('Firebase Admin initialized successfully with service account');
    } else {
      console.log('No service account key found, using default credentials');
      // Use default credentials (works in production)
      app = initializeApp({
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      });
    }
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    
    // Fallback to basic Firebase initialization for now
    console.log('Falling back to basic Firebase initialization...');
    app = initializeApp({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'venuine-519d3',
    });
  }
} else {
  app = getApps()[0];
}

export const adminDb = getFirestore(app);
export const adminAuth = getAuth(app);

// Helper function to verify Firebase ID tokens
export async function verifyIdToken(idToken: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying ID token:', error);
    return null;
  }
}

// Helper function to get user data from Firestore
export async function getFirestoreUser(uid: string) {
  try {
    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (userDoc.exists) {
      return { uid, ...userDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting user from Firestore:', error);
    return null;
  }
}