import { 
  users, tenants, tenantUsers, featurePackages, venues, spaces, customers, leads, bookings, proposals, tasks,
  services, packages, setupStyles, taxSettings, settings, tags, campaignSources,
  type User, type InsertUser, type Tenant, type InsertTenant, type TenantUser, type InsertTenantUser,
  type FeaturePackage, type InsertFeaturePackage, type Venue, type InsertVenue, type Space, type InsertSpace,
  type Customer, type InsertCustomer, type Lead, type InsertLead,
  type Booking, type InsertBooking, type Proposal, type InsertProposal,
  type Task, type InsertTask, type Service, type InsertService,
  type Package, type InsertPackage, type SetupStyle, type InsertSetupStyle,
  type TaxSetting, type InsertTaxSetting, type Setting, type InsertSetting,
  type Tag, type InsertTag, type CampaignSource, type InsertCampaignSource
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sql, count } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  createUser(insertUser: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<boolean>;
  verifyPassword(email: string, password: string): Promise<User | null>;

  // Tenant operations
  getTenant(id: string): Promise<Tenant | undefined>;
  getTenantBySlug(slug: string): Promise<Tenant | undefined>;
  createTenant(insertTenant: InsertTenant): Promise<Tenant>;
  updateTenant(id: string, updates: Partial<Tenant>): Promise<Tenant>;
  deleteTenant(id: string): Promise<void>;
  getUserTenants(userId: string): Promise<(TenantUser & { tenant: Tenant })[]>;
  getUserPrimaryTenant(userId: string): Promise<{ tenant: Tenant; role: string } | null>;

  // Tenant user operations
  addUserToTenant(insertTenantUser: InsertTenantUser): Promise<TenantUser>;
  removeUserFromTenant(tenantId: string, userId: string): Promise<void>;
  getUserTenantRole(tenantId: string, userId: string): Promise<TenantUser | undefined>;

  // Feature package operations
  getFeaturePackages(): Promise<FeaturePackage[]>;
  getFeaturePackage(id: string): Promise<FeaturePackage | undefined>;
  createFeaturePackage(insertPackage: InsertFeaturePackage): Promise<FeaturePackage>;
  updateFeaturePackage(id: string, updates: Partial<FeaturePackage>): Promise<FeaturePackage>;
  deleteFeaturePackage(id: string): Promise<void>;

  // Super admin operations
  getAllTenantsWithOwners(): Promise<any[]>;

  // Venue operations
  getVenues(tenantId?: string): Promise<Venue[]>;
  getVenue(id: string): Promise<Venue | undefined>;
  createVenue(insertVenue: InsertVenue): Promise<Venue>;
  updateVenue(id: string, updates: Partial<Venue>): Promise<Venue>;
  deleteVenue(id: string): Promise<void>;

  // Space operations
  getSpaces(tenantId?: string): Promise<Space[]>;
  getSpacesByVenue(venueId: string): Promise<Space[]>;
  getSpace(id: string): Promise<Space | undefined>;
  createSpace(insertSpace: InsertSpace): Promise<Space>;
  updateSpace(id: string, updates: Partial<Space>): Promise<Space>;
  deleteSpace(id: string): Promise<void>;

  // Service operations  
  getServices(tenantId: string): Promise<Service[]>;
  createService(insertService: InsertService): Promise<Service>;
  
  // Package operations (service packages)
  getPackages(tenantId: string): Promise<Package[]>;
  createPackage(insertPackage: InsertPackage): Promise<Package>;
  
  // Tax settings operations
  getTaxSettings(tenantId: string): Promise<TaxSetting[]>;
  createTaxSettings(insertTaxSettings: InsertTaxSetting): Promise<TaxSetting>;
  
  // Setup styles operations
  getSetupStyles(tenantId: string): Promise<SetupStyle[]>;
  createSetupStyles(insertSetupStyles: InsertSetupStyle): Promise<SetupStyle>;
  
  // Settings operations
  getSettings(tenantId: string): Promise<Setting[]>;
  createSettings(insertSettings: InsertSetting): Promise<Setting>;
  
  // Payment operations
  getPayments(tenantId: string): Promise<any[]>;
  
  // Tag operations
  getTags(tenantId: string): Promise<any[]>;
  
  // Campaign source operations
  getCampaignSources(tenantId: string): Promise<any[]>;

  // Customer operations
  getCustomers(tenantId: string): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  createCustomer(insertCustomer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer>;
  deleteCustomer(id: string): Promise<void>;

  // Lead operations
  getLeads(tenantId: string): Promise<Lead[]>;
  getLead(id: string): Promise<Lead | undefined>;
  createLead(insertLead: InsertLead): Promise<Lead>;
  updateLead(id: string, updates: Partial<Lead>): Promise<Lead>;
  deleteLead(id: string): Promise<void>;

  // Booking operations
  getBookings(tenantId: string): Promise<Booking[]>;
  getBooking(id: string): Promise<Booking | undefined>;
  createBooking(insertBooking: InsertBooking): Promise<Booking>;
  updateBooking(id: string, updates: Partial<Booking>): Promise<Booking>;
  deleteBooking(id: string): Promise<void>;

  // Proposal operations
  getProposals(tenantId: string): Promise<Proposal[]>;
  getProposal(id: string): Promise<Proposal | undefined>;
  createProposal(insertProposal: InsertProposal): Promise<Proposal>;
  updateProposal(id: string, updates: Partial<Proposal>): Promise<Proposal>;
  deleteProposal(id: string): Promise<void>;

  // Task operations
  getTasks(tenantId: string): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  createTask(insertTask: InsertTask): Promise<Task>;
  updateTask(id: string, updates: Partial<Task>): Promise<Task>;
  deleteTask(id: string): Promise<void>;

  // Dashboard analytics
  getDashboardStats(tenantId: string): Promise<{
    totalBookings: number;
    totalCustomers: number;
    totalLeads: number;
    totalRevenue: number;
    recentBookings: Booking[];
    recentLeads: Lead[];
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Hash password if provided
    if (insertUser.passwordHash) {
      insertUser.passwordHash = await bcrypt.hash(insertUser.passwordHash, 10);
    }
    
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async verifyPassword(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user || !user.passwordHash) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    return isValid ? user : null;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    // Hash password if being updated
    if (updates.passwordHash) {
      updates.passwordHash = await bcrypt.hash(updates.passwordHash, 10);
    }
    
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }





  // Tenant operations
  async getTenant(id: string): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id));
    return tenant;
  }

  async getTenantBySlug(slug: string): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, slug));
    return tenant;
  }

  async createTenant(insertTenant: InsertTenant): Promise<Tenant> {
    const [tenant] = await db
      .insert(tenants)
      .values(insertTenant)
      .returning();
    return tenant;
  }

  async updateTenant(id: string, updates: Partial<Tenant>): Promise<Tenant> {
    const [tenant] = await db
      .update(tenants)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tenants.id, id))
      .returning();
    return tenant;
  }



  async getUserTenants(userId: string): Promise<(TenantUser & { tenant: Tenant })[]> {
    const userTenants = await db
      .select({
        id: tenantUsers.id,
        tenantId: tenantUsers.tenantId,
        userId: tenantUsers.userId,
        role: tenantUsers.role,
        permissions: tenantUsers.permissions,
        createdAt: tenantUsers.createdAt,
        updatedAt: tenantUsers.updatedAt,
        tenant: tenants,
      })
      .from(tenantUsers)
      .innerJoin(tenants, eq(tenantUsers.tenantId, tenants.id))
      .where(eq(tenantUsers.userId, userId));

    return userTenants;
  }

  async getUserPrimaryTenant(userId: string): Promise<{ tenant: Tenant; role: string } | null> {
    const userTenants = await this.getUserTenants(userId);
    if (userTenants.length === 0) return null;
    
    // Return the first tenant (could be enhanced to have a primary tenant concept)
    const primaryTenant = userTenants[0];
    return {
      tenant: primaryTenant.tenant,
      role: primaryTenant.role,
    };
  }

  // Tenant user operations
  async addUserToTenant(insertTenantUser: InsertTenantUser): Promise<TenantUser> {
    const [tenantUser] = await db
      .insert(tenantUsers)
      .values(insertTenantUser)
      .returning();
    return tenantUser;
  }

  async removeUserFromTenant(tenantId: string, userId: string): Promise<void> {
    await db
      .delete(tenantUsers)
      .where(and(
        eq(tenantUsers.tenantId, tenantId),
        eq(tenantUsers.userId, userId)
      ));
  }

  async getUserTenantRole(tenantId: string, userId: string): Promise<TenantUser | undefined> {
    const [tenantUser] = await db
      .select()
      .from(tenantUsers)
      .where(and(
        eq(tenantUsers.tenantId, tenantId),
        eq(tenantUsers.userId, userId)
      ));
    return tenantUser;
  }

  // Feature package operations
  async getFeaturePackages(): Promise<FeaturePackage[]> {
    return await db
      .select()
      .from(featurePackages)
      .where(eq(featurePackages.isActive, true))
      .orderBy(asc(featurePackages.order));
  }

  async getFeaturePackage(id: string): Promise<FeaturePackage | undefined> {
    const [featurePackage] = await db
      .select()
      .from(featurePackages)
      .where(eq(featurePackages.id, id));
    return featurePackage;
  }

  async createFeaturePackage(insertPackage: InsertFeaturePackage): Promise<FeaturePackage> {
    const [featurePackage] = await db
      .insert(featurePackages)
      .values(insertPackage)
      .returning();
    return featurePackage;
  }

  async updateFeaturePackage(id: string, updates: Partial<FeaturePackage>): Promise<FeaturePackage> {
    const [featurePackage] = await db
      .update(featurePackages)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(featurePackages.id, id))
      .returning();
    return featurePackage;
  }

  async deleteFeaturePackage(id: string): Promise<void> {
    await db.delete(featurePackages).where(eq(featurePackages.id, id));
  }

  // Get tenant users for usage limit checking
  async getTenantUsers(tenantId: string): Promise<TenantUser[]> {
    return await db
      .select()
      .from(tenantUsers)
      .where(eq(tenantUsers.tenantId, tenantId));
  }

  // Venue operations
  async getVenues(tenantId?: string): Promise<Venue[]> {
    const query = db.select().from(venues);
    if (tenantId) {
      return await query.where(eq(venues.tenantId, tenantId));
    }
    return await query;
  }

  async getVenue(id: string): Promise<Venue | undefined> {
    const [venue] = await db.select().from(venues).where(eq(venues.id, id));
    return venue;
  }

  async createVenue(insertVenue: InsertVenue): Promise<Venue> {
    const [venue] = await db
      .insert(venues)
      .values(insertVenue)
      .returning();
    return venue;
  }

  async updateVenue(id: string, updates: Partial<Venue>): Promise<Venue> {
    const [venue] = await db
      .update(venues)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(venues.id, id))
      .returning();
    return venue;
  }

  async deleteVenue(id: string): Promise<void> {
    await db.delete(venues).where(eq(venues.id, id));
  }

  // Space operations
  async getSpaces(tenantId?: string): Promise<Space[]> {
    const query = db.select().from(spaces);
    if (tenantId) {
      return await query.where(eq(spaces.tenantId, tenantId));
    }
    return await query;
  }

  async getSpacesByVenue(venueId: string): Promise<Space[]> {
    return await db
      .select()
      .from(spaces)
      .where(eq(spaces.venueId, venueId))
      .orderBy(desc(spaces.createdAt));
  }

  async getSpace(id: string): Promise<Space | undefined> {
    const [space] = await db.select().from(spaces).where(eq(spaces.id, id));
    return space;
  }

  async createSpace(insertSpace: InsertSpace): Promise<Space> {
    const [space] = await db
      .insert(spaces)
      .values(insertSpace)
      .returning();
    return space;
  }

  async updateSpace(id: string, updates: Partial<Space>): Promise<Space> {
    const [space] = await db
      .update(spaces)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(spaces.id, id))
      .returning();
    return space;
  }

  async deleteSpace(id: string): Promise<void> {
    await db.delete(spaces).where(eq(spaces.id, id));
  }

  // Service operations  
  async getServices(tenantId: string): Promise<Service[]> {
    try {
      console.log('Fetching services for tenant:', tenantId);
      const result = await db.select().from(services).where(eq(services.tenantId, tenantId));
      console.log('Services query result:', result);
      return result;
    } catch (error) {
      console.error('Services database error:', error);
      throw error;
    }
  }

  async createService(insertService: InsertService): Promise<Service> {
    const [service] = await db
      .insert(services)
      .values(insertService)
      .returning();
    return service;
  }
  
  // Package operations (service packages)
  async getPackages(tenantId: string): Promise<Package[]> {
    try {
      console.log('Fetching packages for tenant:', tenantId);
      const result = await db.select().from(packages).where(eq(packages.tenantId, tenantId));
      console.log('Packages query result:', result);
      return result;
    } catch (error) {
      console.error('Packages database error:', error);
      throw error;
    }
  }

  async createPackage(insertPackage: InsertPackage): Promise<Package> {
    const [pkg] = await db
      .insert(packages)
      .values(insertPackage)
      .returning();
    return pkg;
  }
  
  // Tax settings operations
  async getTaxSettings(tenantId: string): Promise<TaxSetting[]> {
    try {
      console.log('Fetching tax settings for tenant:', tenantId);
      const result = await db.select().from(taxSettings).where(eq(taxSettings.tenantId, tenantId));
      console.log('Tax settings query result:', result);
      return result;
    } catch (error) {
      console.error('Tax settings database error:', error);
      throw error;
    }
  }

  async createTaxSettings(insertTaxSettings: InsertTaxSetting): Promise<TaxSetting> {
    const [taxSetting] = await db
      .insert(taxSettings)
      .values(insertTaxSettings)
      .returning();
    return taxSetting;
  }
  
  // Setup styles operations
  async getSetupStyles(tenantId: string): Promise<SetupStyle[]> {
    return await db.select().from(setupStyles).where(eq(setupStyles.tenantId, tenantId));
  }

  async createSetupStyles(insertSetupStyles: InsertSetupStyle): Promise<SetupStyle> {
    const [setupStyle] = await db
      .insert(setupStyles)
      .values(insertSetupStyles)
      .returning();
    return setupStyle;
  }
  
  // Settings operations
  async getSettings(tenantId: string): Promise<Setting[]> {
    try {
      console.log('Fetching settings for tenant:', tenantId);
      const result = await db.select().from(settings).where(eq(settings.tenantId, tenantId));
      console.log('Settings query result:', result);
      return result;
    } catch (error) {
      console.error('Settings database error:', error);
      throw error;
    }
  }

  async createSettings(insertSettings: InsertSetting): Promise<Setting> {
    const [setting] = await db
      .insert(settings)
      .values(insertSettings)
      .returning();
    return setting;
  }
  
  // Payment operations
  async getPayments(tenantId: string): Promise<any[]> {
    // Payment operations would integrate with Stripe - return empty for now
    return [];
  }
  
  // Tag operations
  async getTags(tenantId: string): Promise<Tag[]> {
    return await db.select().from(tags).where(eq(tags.tenantId, tenantId));
  }
  
  // Campaign source operations
  async getCampaignSources(tenantId: string): Promise<CampaignSource[]> {
    return await db.select().from(campaignSources).where(eq(campaignSources.tenantId, tenantId));
  }

  // Customer operations
  async getCustomers(tenantId: string): Promise<Customer[]> {
    return await db
      .select()
      .from(customers)
      .where(eq(customers.tenantId, tenantId))
      .orderBy(desc(customers.createdAt));
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const [customer] = await db
      .insert(customers)
      .values(insertCustomer)
      .returning();
    return customer;
  }

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    const [customer] = await db
      .update(customers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return customer;
  }

  async deleteCustomer(id: string): Promise<void> {
    await db.delete(customers).where(eq(customers.id, id));
  }

  // Lead operations
  async getLeads(tenantId: string): Promise<Lead[]> {
    return await db
      .select()
      .from(leads)
      .where(eq(leads.tenantId, tenantId))
      .orderBy(desc(leads.createdAt));
  }

  async getLead(id: string): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead;
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const [lead] = await db
      .insert(leads)
      .values(insertLead)
      .returning();
    return lead;
  }

  async updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
    const [lead] = await db
      .update(leads)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(leads.id, id))
      .returning();
    return lead;
  }

  async deleteLead(id: string): Promise<void> {
    await db.delete(leads).where(eq(leads.id, id));
  }

  // Booking operations
  async getBookings(tenantId: string): Promise<Booking[]> {
    return await db
      .select()
      .from(bookings)
      .where(eq(bookings.tenantId, tenantId))
      .orderBy(desc(bookings.createdAt));
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking;
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const [booking] = await db
      .insert(bookings)
      .values(insertBooking)
      .returning();
    return booking;
  }

  async updateBooking(id: string, updates: Partial<Booking>): Promise<Booking> {
    const [booking] = await db
      .update(bookings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(bookings.id, id))
      .returning();
    return booking;
  }

  async deleteBooking(id: string): Promise<void> {
    await db.delete(bookings).where(eq(bookings.id, id));
  }

  // Proposal operations
  async getProposals(tenantId: string): Promise<Proposal[]> {
    return await db
      .select()
      .from(proposals)
      .where(eq(proposals.tenantId, tenantId))
      .orderBy(desc(proposals.createdAt));
  }

  async getProposal(id: string): Promise<Proposal | undefined> {
    const [proposal] = await db.select().from(proposals).where(eq(proposals.id, id));
    return proposal;
  }

  async createProposal(insertProposal: InsertProposal): Promise<Proposal> {
    const [proposal] = await db
      .insert(proposals)
      .values(insertProposal)
      .returning();
    return proposal;
  }

  async updateProposal(id: string, updates: Partial<Proposal>): Promise<Proposal> {
    const [proposal] = await db
      .update(proposals)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(proposals.id, id))
      .returning();
    return proposal;
  }

  async deleteProposal(id: string): Promise<void> {
    await db.delete(proposals).where(eq(proposals.id, id));
  }

  // Task operations
  async getTasks(tenantId: string): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.tenantId, tenantId))
      .orderBy(desc(tasks.createdAt));
  }

  async getTask(id: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db
      .insert(tasks)
      .values(insertTask)
      .returning();
    return task;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const [task] = await db
      .update(tasks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return task;
  }

  async deleteTask(id: string): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  // Dashboard analytics
  async getDashboardStats(tenantId: string): Promise<{
    totalBookings: number;
    totalCustomers: number;
    totalLeads: number;
    totalRevenue: number;
    recentBookings: Booking[];
    recentLeads: Lead[];
  }> {
    const [bookingsCount] = await db
      .select({ count: count() })
      .from(bookings)
      .where(eq(bookings.tenantId, tenantId));

    const [customersCount] = await db
      .select({ count: count() })
      .from(customers)
      .where(eq(customers.tenantId, tenantId));

    const [leadsCount] = await db
      .select({ count: count() })
      .from(leads)
      .where(eq(leads.tenantId, tenantId));

    const [revenueResult] = await db
      .select({ 
        total: sql<number>`COALESCE(SUM(${bookings.totalAmount}), 0)` 
      })
      .from(bookings)
      .where(eq(bookings.tenantId, tenantId));

    const recentBookings = await db
      .select()
      .from(bookings)
      .where(eq(bookings.tenantId, tenantId))
      .orderBy(desc(bookings.createdAt))
      .limit(5);

    const recentLeads = await db
      .select()
      .from(leads)
      .where(eq(leads.tenantId, tenantId))
      .orderBy(desc(leads.createdAt))
      .limit(5);

    return {
      totalBookings: bookingsCount.count,
      totalCustomers: customersCount.count,
      totalLeads: leadsCount.count,
      totalRevenue: Number(revenueResult.total) || 0,
      recentBookings,
      recentLeads,
    };
  }

  // Super Admin operations
  async getAllUsers(): Promise<User[]> {
    const results = await db.select().from(users);
    return results;
  }

  async getAllTenants(): Promise<Tenant[]> {
    const results = await db.select().from(tenants);
    return results;
  }

  async getAllFeaturePackages(): Promise<FeaturePackage[]> {
    const results = await db.select().from(featurePackages).orderBy(featurePackages.order);
    return results;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async deleteTenant(id: string): Promise<boolean> {
    const result = await db.delete(tenants).where(eq(tenants.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getAllTenantsWithOwners(): Promise<any[]> {
    const tenantsWithOwners = await db
      .select({
        id: tenants.id,
        name: tenants.name,
        slug: tenants.slug,
        industry: tenants.industry,
        planId: tenants.planId,
        status: tenants.status,
        contactName: tenants.contactName,
        contactEmail: tenants.contactEmail,
        businessPhone: tenants.businessPhone,
        createdAt: tenants.createdAt,
        owner: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(tenants)
      .leftJoin(users, eq(tenants.ownerId, users.id));

    return tenantsWithOwners;
  }
}

export const storage = new DatabaseStorage();