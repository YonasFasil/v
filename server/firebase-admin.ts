import { initializeApp, getApps, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Firebase Admin SDK
let app;

// Create temporary service account file for Firebase Admin
function createTempServiceAccountFile() {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set');
  }

  const serviceAccountData = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  
  // Write to temporary file
  const tempFilePath = path.join(process.cwd(), 'temp-service-account.json');
  fs.writeFileSync(tempFilePath, JSON.stringify(serviceAccountData, null, 2));
  
  return { serviceAccountData, tempFilePath };
}

if (getApps().length === 0) {
  try {
    console.log('Initializing Firebase Admin with service account file...');
    const { serviceAccountData, tempFilePath } = createTempServiceAccountFile();
    console.log('Service account file created, project_id:', serviceAccountData.project_id);
    
    // Set environment variable for Firebase Admin to find the service account
    process.env.GOOGLE_APPLICATION_CREDENTIALS = tempFilePath;
    
    app = initializeApp({
      credential: applicationDefault(),
      projectId: serviceAccountData.project_id,
    });
    
    console.log('Firebase Admin initialized successfully with service account file');
    
    // Clean up temp file after successful initialization
    setTimeout(() => {
      try {
        fs.unlinkSync(tempFilePath);
        console.log('Temporary service account file cleaned up');
      } catch (e) {
        console.warn('Could not clean up temporary service account file:', e.message);
      }
    }, 1000);
    
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
    
    // Fallback: try with cert() method 
    try {
      console.log('Trying fallback cert() method...');
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      
      // Ensure private key formatting
      if (serviceAccount.private_key && !serviceAccount.private_key.includes('\n')) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
      
      app = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });
      
      console.log('Firebase Admin initialized with fallback cert method');
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      throw fallbackError;
    }
  }
} else {
  app = getApps()[0];
  console.log('Using existing Firebase Admin app');
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