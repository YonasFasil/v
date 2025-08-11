// Firestore database operations for VENUIN
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  QueryConstraint
} from "firebase/firestore";
import { db } from "./firebase";
import { COLLECTIONS } from "@shared/firestore-schema";
import type {
  UserDoc,
  TenantDoc,
  EventDoc,
  CustomerDoc,
  LeadDoc,
  FeaturePackageDoc,
  VenueDoc,
  SpaceDoc,
  ServiceDoc,
  PackageDoc,
  TaskDoc,
  ProposalDoc,
  SuperAdminDoc,
  TenantUserDoc
} from "@shared/firestore-schema";

// Generic Firestore operations
export class FirestoreService {
  // Generic CRUD operations
  static async create<T>(collectionName: string, data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docData = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(collection(db, collectionName), docData);
    return docRef.id;
  }

  static async get<T>(collectionName: string, id: string): Promise<T | null> {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as T;
    }
    return null;
  }

  static async update(collectionName: string, id: string, data: Record<string, any>): Promise<void> {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }

  static async delete(collectionName: string, id: string): Promise<void> {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  }

  static async list<T>(collectionName: string, constraints: QueryConstraint[] = []): Promise<T[]> {
    const q = query(collection(db, collectionName), ...constraints);
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as T[];
  }

  static subscribe<T>(
    collectionName: string, 
    callback: (docs: T[]) => void, 
    constraints: QueryConstraint[] = []
  ) {
    const q = query(collection(db, collectionName), ...constraints);
    
    return onSnapshot(q, (querySnapshot) => {
      const docs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
      callback(docs);
    });
  }
}

// User operations
export class UserService {
  static async createOrUpdateUser(userData: Partial<UserDoc>): Promise<string> {
    if (userData.email) {
      // Check if user already exists
      const existingUsers = await FirestoreService.list<UserDoc>(
        COLLECTIONS.USERS,
        [where('email', '==', userData.email)]
      );

      if (existingUsers.length > 0) {
        // Update existing user
        await FirestoreService.update(COLLECTIONS.USERS, existingUsers[0].id, userData);
        return existingUsers[0].id;
      }
    }

    // Create new user
    return await FirestoreService.create<UserDoc>(COLLECTIONS.USERS, userData as Omit<UserDoc, 'id' | 'createdAt' | 'updatedAt'>);
  }

  static async getUserByEmail(email: string): Promise<UserDoc | null> {
    const users = await FirestoreService.list<UserDoc>(
      COLLECTIONS.USERS,
      [where('email', '==', email), limit(1)]
    );
    return users.length > 0 ? users[0] : null;
  }

  static async checkIsSuperAdmin(userId: string): Promise<boolean> {
    const superAdmins = await FirestoreService.list<SuperAdminDoc>(
      COLLECTIONS.SUPER_ADMINS,
      [where('userId', '==', userId)]
    );
    return superAdmins.length > 0;
  }

  static async setSuperAdmin(userId: string): Promise<void> {
    await FirestoreService.create<SuperAdminDoc>(COLLECTIONS.SUPER_ADMINS, {
      userId,
    });
  }

  static async getUserTenant(userId: string): Promise<{tenantId: string, tenantSlug: string, tenantName: string, role: string} | null> {
    // First, check if user document has tenant info directly (onboarding flow)
    const userDoc = await FirestoreService.get<any>(COLLECTIONS.USERS, userId);
    
    if (userDoc?.tenantId && userDoc?.tenantSlug && userDoc?.role) {
      return {
        tenantId: userDoc.tenantId,
        tenantSlug: userDoc.tenantSlug,
        tenantName: userDoc.tenantSlug, // Use slug as name fallback
        role: userDoc.role,
      };
    }
    
    // Fallback: check tenant_users collection (signup flow)
    const tenantUsers = await FirestoreService.list<TenantUserDoc>(
      COLLECTIONS.TENANT_USERS,
      [where('userId', '==', userId), limit(1)]
    );
    
    if (tenantUsers.length === 0) return null;
    
    const tenantUser = tenantUsers[0];
    
    // Get tenant details
    const tenant = await FirestoreService.get<TenantDoc>(COLLECTIONS.TENANTS, tenantUser.tenantId);
    
    if (!tenant) return null;
    
    return {
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      tenantName: tenant.name,
      role: tenantUser.role,
    };
  }
}

// Tenant operations  
export class TenantService {
  static async createTenant(tenantData: Omit<TenantDoc, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return await FirestoreService.create<TenantDoc>(COLLECTIONS.TENANTS, tenantData);
  }

  static async getTenantBySlug(slug: string): Promise<TenantDoc | null> {
    const tenants = await FirestoreService.list<TenantDoc>(
      COLLECTIONS.TENANTS,
      [where('slug', '==', slug), limit(1)]
    );
    return tenants.length > 0 ? tenants[0] : null;
  }

  static async getUserTenants(userId: string): Promise<TenantDoc[]> {
    // First get tenant user relationships
    const tenantUsers = await FirestoreService.list<TenantUserDoc>(
      COLLECTIONS.TENANT_USERS,
      [where('userId', '==', userId)]
    );

    if (tenantUsers.length === 0) return [];

    // Get tenant details
    const tenantPromises = tenantUsers.map(tu => 
      FirestoreService.get<TenantDoc>(COLLECTIONS.TENANTS, tu.tenantId)
    );
    
    const tenants = await Promise.all(tenantPromises);
    return tenants.filter(Boolean) as TenantDoc[];
  }

  static async addUserToTenant(tenantId: string, userId: string, role: TenantUserDoc['role'] = 'staff'): Promise<void> {
    await FirestoreService.create<TenantUserDoc>(COLLECTIONS.TENANT_USERS, {
      tenantId,
      userId,
      role,
      permissions: {},
      scopes: {},
    });
  }

  static async getUserRole(tenantId: string, userId: string): Promise<string | null> {
    const tenantUsers = await FirestoreService.list<TenantUserDoc>(
      COLLECTIONS.TENANT_USERS,
      [where('tenantId', '==', tenantId), where('userId', '==', userId)]
    );
    return tenantUsers.length > 0 ? tenantUsers[0].role : null;
  }
}

// Feature Package operations
export class FeaturePackageService {
  static async listActivePackages(): Promise<FeaturePackageDoc[]> {
    return await FirestoreService.list<FeaturePackageDoc>(
      COLLECTIONS.FEATURE_PACKAGES,
      [where('status', '==', 'active'), orderBy('sortOrder')]
    );
  }

  static async getPackageBySlug(slug: string): Promise<FeaturePackageDoc | null> {
    const packages = await FirestoreService.list<FeaturePackageDoc>(
      COLLECTIONS.FEATURE_PACKAGES,
      [where('slug', '==', slug), limit(1)]
    );
    return packages.length > 0 ? packages[0] : null;
  }

  static async createPackage(packageData: Omit<FeaturePackageDoc, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return await FirestoreService.create<FeaturePackageDoc>(COLLECTIONS.FEATURE_PACKAGES, packageData);
  }
}

// Event operations
export class EventService {
  static async getTenantEvents(tenantId: string, limitNum: number = 50): Promise<EventDoc[]> {
    return await FirestoreService.list<EventDoc>(
      COLLECTIONS.EVENTS,
      [where('tenantId', '==', tenantId), orderBy('startDate', 'desc'), limit(limitNum)]
    );
  }

  static async createEvent(tenantId: string, eventData: Omit<EventDoc, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return await FirestoreService.create<EventDoc>(COLLECTIONS.EVENTS, {
      ...eventData,
      tenantId,
    });
  }
}

// Customer operations  
export class CustomerService {
  static async getTenantCustomers(tenantId: string): Promise<CustomerDoc[]> {
    return await FirestoreService.list<CustomerDoc>(
      COLLECTIONS.CUSTOMERS,
      [where('tenantId', '==', tenantId), orderBy('createdAt', 'desc')]
    );
  }

  static async createCustomer(tenantId: string, customerData: Omit<CustomerDoc, 'id' | 'tenantId' | 'createdAt' | 'updatedAt' | 'totalBookings' | 'totalSpent'>): Promise<string> {
    return await FirestoreService.create<CustomerDoc>(COLLECTIONS.CUSTOMERS, {
      ...customerData,
      tenantId,
      totalBookings: 0,
      totalSpent: 0,
    });
  }
}

// Lead operations
export class LeadService {
  static async getTenantLeads(tenantId: string): Promise<LeadDoc[]> {
    return await FirestoreService.list<LeadDoc>(
      COLLECTIONS.LEADS,
      [where('tenantId', '==', tenantId), orderBy('createdAt', 'desc')]
    );
  }

  static async createLead(tenantId: string, leadData: Omit<LeadDoc, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return await FirestoreService.create<LeadDoc>(COLLECTIONS.LEADS, {
      ...leadData,
      tenantId,
    });
  }
}

// Venue operations
export class VenueService {
  static async getTenantVenues(tenantId: string): Promise<VenueDoc[]> {
    return await FirestoreService.list<VenueDoc>(
      COLLECTIONS.VENUES,
      [where('tenantId', '==', tenantId), where('isActive', '==', true)]
    );
  }

  static async createVenue(tenantId: string, venueData: Omit<VenueDoc, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return await FirestoreService.create<VenueDoc>(COLLECTIONS.VENUES, {
      ...venueData,
      tenantId,
    });
  }
}

// Task operations
export class TaskService {
  static async getTenantTasks(tenantId: string): Promise<TaskDoc[]> {
    return await FirestoreService.list<TaskDoc>(
      COLLECTIONS.TASKS,
      [where('tenantId', '==', tenantId), orderBy('createdAt', 'desc')]
    );
  }

  static async createTask(tenantId: string, taskData: Omit<TaskDoc, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return await FirestoreService.create<TaskDoc>(COLLECTIONS.TASKS, {
      ...taskData,
      tenantId,
    });
  }
}