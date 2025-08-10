import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin SDK
const firebaseConfig = {
  // You'll need to provide these from your Firebase project
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

let app;
if (getApps().length === 0) {
  app = initializeApp({
    credential: cert(firebaseConfig as any),
    projectId: firebaseConfig.projectId,
  });
} else {
  app = getApps()[0];
}

export const db = getFirestore(app);
export const auth = getAuth(app);

// Helper functions for Firestore operations
export const createDocument = async (collection: string, data: any, id?: string) => {
  const docRef = id ? db.collection(collection).doc(id) : db.collection(collection).doc();
  await docRef.set(data);
  return { id: docRef.id, ...data };
};

export const getDocument = async (collection: string, id: string) => {
  const doc = await db.collection(collection).doc(id).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
};

export const getDocuments = async (collection: string, filters?: any[]) => {
  let query = db.collection(collection) as any;
  
  if (filters) {
    filters.forEach(filter => {
      query = query.where(filter.field, filter.operator, filter.value);
    });
  }
  
  const snapshot = await query.get();
  return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
};

export const updateDocument = async (collection: string, id: string, data: any) => {
  const docRef = db.collection(collection).doc(id);
  await docRef.update(data);
  const doc = await docRef.get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
};

export const deleteDocument = async (collection: string, id: string) => {
  await db.collection(collection).doc(id).delete();
  return true;
};

// Tenant-aware helper functions
export const getTenantCollection = (tenantId: string, collection: string) => {
  return `tenants/${tenantId}/${collection}`;
};

export const createTenantDocument = async (tenantId: string, collection: string, data: any, id?: string) => {
  return createDocument(getTenantCollection(tenantId, collection), { ...data, tenantId }, id);
};

export const getTenantDocument = async (tenantId: string, collection: string, id: string) => {
  return getDocument(getTenantCollection(tenantId, collection), id);
};

export const getTenantDocuments = async (tenantId: string, collection: string, filters?: any[]) => {
  const tenantFilter = { field: 'tenantId', operator: '==', value: tenantId };
  const allFilters = filters ? [tenantFilter, ...filters] : [tenantFilter];
  return getDocuments(getTenantCollection(tenantId, collection), allFilters);
};

export const updateTenantDocument = async (tenantId: string, collection: string, id: string, data: any) => {
  return updateDocument(getTenantCollection(tenantId, collection), id, data);
};

export const deleteTenantDocument = async (tenantId: string, collection: string, id: string) => {
  return deleteDocument(getTenantCollection(tenantId, collection), id);
};