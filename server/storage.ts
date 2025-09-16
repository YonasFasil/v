import { 
  type User, type InsertUser,
  type Venue, type InsertVenue,
  type Space, type InsertSpace,
  type SetupStyle, type InsertSetupStyle,
  type Company, type InsertCompany,
  type Customer, type InsertCustomer,
  type Contract, type InsertContract,
  type Booking, type InsertBooking,
  type Proposal, type InsertProposal,
  type Payment, type InsertPayment,
  type Task, type InsertTask,
  type AiInsight, type InsertAiInsight,
  type Package, type InsertPackage,
  type Service, type InsertService,
  type TaxSetting, type InsertTaxSetting,
  type Communication, type InsertCommunication,
  type CampaignSource, type InsertCampaignSource,
  type Tag, type InsertTag,
  type Lead, type InsertLead,
  type LeadActivity, type InsertLeadActivity,
  type LeadTask, type InsertLeadTask,
  type Tour, type InsertTour,
  type Tenant, type InsertTenant,
  type SubscriptionPackage, type InsertSubscriptionPackage,
} from "@shared/schema";

import { 
  db, 
  eq, and, or, not, isNull, isNotNull, desc, asc, like, ilike, inArray,
  users, venues, spaces, setupStyles, companies, customers, contracts, 
  bookings, proposals, payments, tasks, packages, services,
  settings, communications, taxSettings, campaignSources, tags, leads,
  leadActivities, leadTasks, tours, tenants, subscriptionPackages, aiInsights,
} from './db';

import { randomUUID } from "crypto";
import { getPermissionsForRole } from './permissions';
import { getCurrentTenantContext } from './db/tenant-context';

// In-memory tenant context for MemStorage when database context is not available
let memStorageTenantContext: { tenantId: string | null; role: string | null } = { tenantId: null, role: null };

export function setMemStorageTenantContext(tenantId: string | null, role: string | null) {
  memStorageTenantContext = { tenantId, role };
}

// Additional types for new features
interface Setting {
  id: string;
  key: string;
  value: any;
  updatedAt: Date;
}

interface InsertSetting {
  key: string;
  value: any;
}

export interface IStorage {
  // Users
  getUsers(): Promise<User[]>;
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsersByTenant(tenantId: string): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;

  // Venues
  getVenues(): Promise<Venue[]>;
  getVenuesByTenant(tenantId: string): Promise<Venue[]>;
  getVenue(id: string): Promise<Venue | undefined>;
  createVenue(venue: InsertVenue): Promise<Venue>;
  updateVenue(id: string, venue: Partial<InsertVenue>): Promise<Venue | undefined>;

  // Spaces
  getSpaces(): Promise<Space[]>;
  getSpacesByTenant(tenantId: string): Promise<Space[]>;
  getSpace(id: string): Promise<Space | undefined>;
  getSpacesByVenue(venueId: string): Promise<Space[]>;
  createSpace(space: InsertSpace): Promise<Space>;
  updateSpace(id: string, space: Partial<InsertSpace>): Promise<Space | undefined>;

  // Setup Styles
  getSetupStyles(): Promise<SetupStyle[]>;
  getSetupStylesByTenant(tenantId: string): Promise<SetupStyle[]>;
  getSetupStyle(id: string): Promise<SetupStyle | undefined>;
  createSetupStyle(setupStyle: InsertSetupStyle): Promise<SetupStyle>;
  updateSetupStyle(id: string, setupStyle: Partial<InsertSetupStyle>): Promise<SetupStyle | undefined>;
  deleteSetupStyle(id: string): Promise<boolean>;

  // Companies
  getCompanies(): Promise<Company[]>;
  getCompaniesByTenant(tenantId: string): Promise<Company[]>;
  getCompany(id: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: string, company: Partial<InsertCompany>): Promise<Company | undefined>;
  deleteCompany(id: string): Promise<boolean>;

  // Customers
  getCustomers(): Promise<Customer[]>;
  getCustomersByTenant(tenantId: string): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  getCustomerByEmail(email: string): Promise<Customer | undefined>;
  getCustomersByCompany(companyId: string): Promise<Customer[]>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;

  // Contracts
  getContracts(): Promise<Contract[]>;
  getContractsByTenant(tenantId: string): Promise<Contract[]>;
  getContract(id: string): Promise<Contract | undefined>;
  getContractsByCustomer(customerId: string): Promise<Contract[]>;
  createContract(contract: InsertContract): Promise<Contract>;
  updateContract(id: string, contract: Partial<InsertContract>): Promise<Contract | undefined>;
  deleteContract(id: string): Promise<boolean>;

  // Bookings
  getBookings(): Promise<Booking[]>;
  getBookingsByTenant(tenantId: string): Promise<Booking[]>;
  getBooking(id: string): Promise<Booking | undefined>;
  getBookingsByCustomer(customerId: string): Promise<Booking[]>;
  getBookingsByContract(contractId: string): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: string, booking: Partial<InsertBooking>): Promise<Booking | undefined>;
  createMultipleBookings(bookings: InsertBooking[], contractId: string): Promise<Booking[]>;

  // Proposals
  getProposals(): Promise<Proposal[]>;
  getProposal(id: string): Promise<Proposal | undefined>;
  getProposalsByCustomer(customerId: string): Promise<Proposal[]>;
  createProposal(proposal: InsertProposal): Promise<Proposal>;
  updateProposal(id: string, proposal: Partial<InsertProposal>): Promise<Proposal | undefined>;
  deleteProposal(id: string): Promise<boolean>;

  // Communications
  getCommunications(bookingId?: string): Promise<Communication[]>;
  getCommunication(id: string): Promise<Communication | undefined>;
  getCommunicationsByProposal(proposalId: string): Promise<Communication[]>;
  getCommunicationsByCustomer(customerId: string): Promise<Communication[]>;
  getCommunicationByMessageId(messageId: string): Promise<Communication | undefined>;
  createCommunication(communication: InsertCommunication): Promise<Communication>;
  updateCommunication(id: string, communication: Partial<InsertCommunication>): Promise<Communication | undefined>;

  // Settings
  getSettings(): Promise<Setting[]>;
  getSetting(key: string): Promise<Setting | undefined>;
  createSetting(setting: InsertSetting): Promise<Setting>;
  updateSetting(key: string, value: any): Promise<Setting | undefined>;

  // Payments
  getPayments(): Promise<Payment[]>;
  getPayment(id: string): Promise<Payment | undefined>;
  getPaymentsByBooking(bookingId: string): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: string, payment: Partial<InsertPayment>): Promise<Payment | undefined>;

  // Tasks
  getTasks(): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  getTasksByUser(userId: string): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined>;

  // AI Insights
  getAiInsights(): Promise<AiInsight[]>;
  getActiveAiInsights(): Promise<AiInsight[]>;
  createAiInsight(insight: InsertAiInsight): Promise<AiInsight>;

  // Packages & Services
  getPackages(): Promise<Package[]>;
  getPackagesByTenant(tenantId: string): Promise<Package[]>;
  getPackage(id: string): Promise<Package | undefined>;
  createPackage(pkg: InsertPackage): Promise<Package>;
  updatePackage(id: string, pkg: Partial<InsertPackage>): Promise<Package | undefined>;
  deletePackage(id: string): Promise<boolean>;

  getServices(): Promise<Service[]>;
  getServicesByTenant(tenantId: string): Promise<Service[]>;
  getService(id: string): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: string, service: Partial<InsertService>): Promise<Service | undefined>;
  deleteService(id: string): Promise<boolean>;
  
  // Tax Settings
  getTaxSettings(): Promise<TaxSetting[]>;
  getTaxSetting(id: string): Promise<TaxSetting | undefined>;
  createTaxSetting(taxSetting: InsertTaxSetting): Promise<TaxSetting>;
  updateTaxSetting(id: string, taxSetting: Partial<InsertTaxSetting>): Promise<TaxSetting | undefined>;
  deleteTaxSetting(id: string): Promise<boolean>;

  // Lead Management
  // Campaign Sources
  getCampaignSources(): Promise<CampaignSource[]>;
  createCampaignSource(source: InsertCampaignSource): Promise<CampaignSource>;
  updateCampaignSource(id: string, source: Partial<InsertCampaignSource>): Promise<CampaignSource | undefined>;
  
  // Tags
  getTags(): Promise<Tag[]>;
  createTag(tag: InsertTag): Promise<Tag>;
  updateTag(id: string, tag: Partial<InsertTag>): Promise<Tag | undefined>;
  deleteTag(id: string): Promise<boolean>;
  
  // Leads
  getLeads(filters?: { status?: string; source?: string; q?: string }): Promise<Lead[]>;
  getLead(id: string): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: string, lead: Partial<InsertLead>): Promise<Lead | undefined>;
  deleteLead(id: string): Promise<boolean>;
  
  // Lead Activities
  getLeadActivities(leadId: string): Promise<LeadActivity[]>;
  createLeadActivity(activity: InsertLeadActivity): Promise<LeadActivity>;
  
  // Lead Tasks
  getLeadTasks(filters?: { assignee?: string; due?: string }): Promise<LeadTask[]>;
  createLeadTask(task: InsertLeadTask): Promise<LeadTask>;
  updateLeadTask(id: string, task: Partial<InsertLeadTask>): Promise<LeadTask | undefined>;
  
  // Tours
  getTours(): Promise<Tour[]>;
  getTour(id: string): Promise<Tour | undefined>;
  createTour(tour: InsertTour): Promise<Tour>;
  updateTour(id: string, tour: Partial<InsertTour>): Promise<Tour | undefined>;
  
  // Lead Tags (many-to-many)
  getLeadTags(leadId: string): Promise<Tag[]>;
  addLeadTag(leadId: string, tagId: string): Promise<void>;
  removeLeadTag(leadId: string, tagId: string): Promise<void>;
  
  // Additional CRUD operations  
  deleteCustomer(id: string): Promise<boolean>;
  updateVenue(id: string, venueData: Partial<Venue>): Promise<Venue | null>;
  deleteVenue(id: string): Promise<boolean>;
  deleteSpace(id: string): Promise<boolean>;
  deleteBooking(id: string): Promise<boolean>;
  
  // Tenant management (super admin access)
  getTenants(): Promise<any[]>;
  getTenant(id: string): Promise<any>;
  createTenant(tenant: any): Promise<any>;
  updateTenant(id: string, tenant: any): Promise<any>;
  
  // Subscription packages (super admin access)
  getSubscriptionPackages(): Promise<any[]>;
  getSubscriptionPackage(id: string): Promise<any>;
  
  // Admin-level methods that bypass tenant context for seeding
  getAllPackagesAdmin(): Promise<Package[]>;
  getAllUsersAdmin(): Promise<User[]>;
  getAllServicesAdmin(): Promise<any[]>;
  
  // Direct user lookup that bypasses tenant context (for authentication)
  getUserByIdDirect(id: string): Promise<User | undefined>;
  
  // User lookup methods
  getUserByEmail(email: string): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
}

// Memory storage implementation (keeping existing implementation for compatibility)
export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private venues: Map<string, Venue>;
  private spaces: Map<string, Space>;
  private setupStyles: Map<string, SetupStyle>;
  private companies: Map<string, Company>;
  private customers: Map<string, Customer>;
  private contracts: Map<string, Contract>;
  private bookings: Map<string, Booking>;
  private proposals: Map<string, Proposal>;
  private payments: Map<string, Payment>;
  private tasks: Map<string, Task>;
  private aiInsights: Map<string, AiInsight>;
  private packages: Map<string, Package>;
  private services: Map<string, Service>;
  private taxSettings: Map<string, TaxSetting>;
  private communications: Map<string, Communication>;
  private campaignSources: Map<string, CampaignSource>;
  private tags: Map<string, Tag>;
  private leads: Map<string, Lead>;
  private leadActivities: Map<string, LeadActivity>;
  private leadTasks: Map<string, LeadTask>;
  private tours: Map<string, Tour>;
  private leadTags: Map<string, string[]>;
  private settings: Map<string, Setting>;
  
  constructor() {
    // Initialize all Maps
    this.users = new Map();
    this.venues = new Map();
    this.spaces = new Map();
    this.setupStyles = new Map();
    this.companies = new Map();
    this.customers = new Map();
    this.contracts = new Map();
    this.bookings = new Map();
    this.proposals = new Map();
    this.payments = new Map();
    this.tasks = new Map();
    this.aiInsights = new Map();
    this.packages = new Map();
    this.services = new Map();
    this.taxSettings = new Map();
    this.communications = new Map();
    this.campaignSources = new Map();
    this.tags = new Map();
    this.leads = new Map();
    this.leadActivities = new Map();
    this.leadTasks = new Map();
    this.tours = new Map();
    this.leadTags = new Map();
    this.settings = new Map();
  }

  // Helper method to filter by tenant
  private filterByTenant<T extends { tenantId?: string | null }>(items: T[]): T[] {
    if (memStorageTenantContext.role === 'super_admin') {
      return items;
    }
    if (memStorageTenantContext.tenantId) {
      return items.filter(item => item.tenantId === memStorageTenantContext.tenantId);
    }
    return [];
  }

  // Users
  async getUsers(): Promise<User[]> {
    const allUsers = Array.from(this.users.values());
    return this.filterByTenant(allUsers);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const users = Array.from(this.users.values());
    return users.find(u => u.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const users = Array.from(this.users.values());
    return users.find(u => u.email === email);
  }

  async getUsersByTenant(tenantId: string): Promise<User[]> {
    const users = Array.from(this.users.values());
    return users.filter(u => u.tenantId === tenantId);
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = user.id || randomUUID();
    const newUser: User = {
      ...user,
      id,
      permissions: user.permissions || getPermissionsForRole(user.role || 'tenant_user'),
      isActive: user.isActive ?? true,
      createdAt: new Date(),
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    const existing = this.users.get(id);
    if (!existing) return undefined;

    const updated: User = {
      ...existing,
      ...user,
    };
    this.users.set(id, updated);
    return updated;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  // Venues
  async getVenues(): Promise<Venue[]> {
    const allVenues = Array.from(this.venues.values());
    return this.filterByTenant(allVenues);
  }

  async getVenuesByTenant(tenantId: string): Promise<Venue[]> {
    const venues = Array.from(this.venues.values());
    return venues.filter(v => v.tenantId === tenantId);
  }

  async getVenue(id: string): Promise<Venue | undefined> {
    return this.venues.get(id);
  }

  async createVenue(venue: InsertVenue): Promise<Venue> {
    const id = venue.id || randomUUID();
    const newVenue: Venue = {
      ...venue,
      id,
      isActive: venue.isActive ?? true,
      createdAt: new Date(),
    };
    this.venues.set(id, newVenue);
    return newVenue;
  }

  async updateVenue(id: string, venue: Partial<InsertVenue>): Promise<Venue | undefined> {
    const existing = this.venues.get(id);
    if (!existing) return undefined;

    const updated: Venue = { ...existing, ...venue };
    this.venues.set(id, updated);
    return updated;
  }

  async deleteVenue(id: string): Promise<boolean> {
    const existing = this.venues.get(id);
    if (!existing) return false;
    
    const updated = { ...existing, isActive: false };
    this.venues.set(id, updated);
    return true;
  }

  // Spaces 
  async getSpaces(): Promise<Space[]> {
    const allSpaces = Array.from(this.spaces.values());
    // Filter by tenant through venues
    const tenantVenues = await this.getVenues();
    const tenantVenueIds = new Set(tenantVenues.map(v => v.id));
    return allSpaces.filter(s => tenantVenueIds.has(s.venueId));
  }

  async getSpacesByTenant(tenantId: string): Promise<Space[]> {
    const venues = await this.getVenuesByTenant(tenantId);
    const venueIds = new Set(venues.map(v => v.id));
    const spaces = Array.from(this.spaces.values());
    return spaces.filter(s => venueIds.has(s.venueId));
  }

  async getSpace(id: string): Promise<Space | undefined> {
    return this.spaces.get(id);
  }

  async getSpacesByVenue(venueId: string): Promise<Space[]> {
    const spaces = Array.from(this.spaces.values());
    return spaces.filter(s => s.venueId === venueId && s.isActive);
  }

  async createSpace(space: InsertSpace): Promise<Space> {
    const id = space.id || randomUUID();
    const newSpace: Space = {
      ...space,
      id,
      isActive: space.isActive ?? true,
      createdAt: new Date(),
    };
    this.spaces.set(id, newSpace);
    return newSpace;
  }

  async updateSpace(id: string, space: Partial<InsertSpace>): Promise<Space | undefined> {
    const existing = this.spaces.get(id);
    if (!existing) return undefined;

    const updated: Space = { ...existing, ...space };
    this.spaces.set(id, updated);
    return updated;
  }

  async deleteSpace(id: string): Promise<boolean> {
    const existing = this.spaces.get(id);
    if (!existing) return false;
    
    const updated = { ...existing, isActive: false };
    this.spaces.set(id, updated);
    return true;
  }

  // Implement remaining methods with similar patterns...
  // For brevity, I'll implement key methods and indicate others follow the same pattern

  // Customers
  async getCustomers(): Promise<Customer[]> {
    const allCustomers = Array.from(this.customers.values());
    return this.filterByTenant(allCustomers);
  }

  async getCustomersByTenant(tenantId: string): Promise<Customer[]> {
    const customers = Array.from(this.customers.values());
    return customers.filter(c => c.tenantId === tenantId);
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    const customers = Array.from(this.customers.values());
    return customers.find(c => c.email === email);
  }

  async getCustomersByCompany(companyId: string): Promise<Customer[]> {
    const customers = Array.from(this.customers.values());
    return customers.filter(c => c.companyId === companyId);
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const id = customer.id || randomUUID();
    const newCustomer: Customer = {
      ...customer,
      id,
      createdAt: new Date(),
    };
    this.customers.set(id, newCustomer);
    return newCustomer;
  }

  async updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const existing = this.customers.get(id);
    if (!existing) return undefined;

    const updated: Customer = { ...existing, ...customer };
    this.customers.set(id, updated);
    return updated;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    return this.customers.delete(id);
  }

  // Bookings
  async getBookings(): Promise<Booking[]> {
    const allBookings = Array.from(this.bookings.values());
    return this.filterByTenant(allBookings);
  }

  async getBookingsByTenant(tenantId: string): Promise<Booking[]> {
    const bookings = Array.from(this.bookings.values());
    return bookings.filter(b => b.tenantId === tenantId);
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }

  async getBookingsByCustomer(customerId: string): Promise<Booking[]> {
    const bookings = Array.from(this.bookings.values());
    return bookings.filter(b => b.customerId === customerId);
  }

  async getBookingsByContract(contractId: string): Promise<Booking[]> {
    const bookings = Array.from(this.bookings.values());
    return bookings.filter(b => b.contractId === contractId);
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const id = booking.id || randomUUID();
    const newBooking: Booking = {
      ...booking,
      id,
      createdAt: new Date(),
    };
    this.bookings.set(id, newBooking);
    return newBooking;
  }

  async updateBooking(id: string, booking: Partial<InsertBooking>): Promise<Booking | undefined> {
    const existing = this.bookings.get(id);
    if (!existing) return undefined;

    const updated: Booking = { ...existing, ...booking };
    this.bookings.set(id, updated);
    return updated;
  }

  async createMultipleBookings(bookingsData: InsertBooking[], contractId: string): Promise<Booking[]> {
    const results: Booking[] = [];
    for (const bookingData of bookingsData) {
      const booking = await this.createBooking({ ...bookingData, contractId });
      results.push(booking);
    }
    return results;
  }

  async deleteBooking(id: string): Promise<boolean> {
    return this.bookings.delete(id);
  }

  // Stub implementations for remaining methods (following same patterns)
  async getSetupStyles(): Promise<SetupStyle[]> { const items = Array.from(this.setupStyles.values()); return this.filterByTenant(items); }
  async getSetupStylesByTenant(tenantId: string): Promise<SetupStyle[]> { const items = Array.from(this.setupStyles.values()); return items.filter(item => item.tenantId === tenantId); }
  async getSetupStyle(id: string): Promise<SetupStyle | undefined> { return this.setupStyles.get(id); }
  async createSetupStyle(setupStyle: InsertSetupStyle): Promise<SetupStyle> { const id = setupStyle.id || randomUUID(); const item: SetupStyle = { ...setupStyle, id, isActive: setupStyle.isActive ?? true, createdAt: new Date() }; this.setupStyles.set(id, item); return item; }
  async updateSetupStyle(id: string, setupStyle: Partial<InsertSetupStyle>): Promise<SetupStyle | undefined> { const existing = this.setupStyles.get(id); if (!existing) return undefined; const updated = { ...existing, ...setupStyle }; this.setupStyles.set(id, updated); return updated; }
  async deleteSetupStyle(id: string): Promise<boolean> { return this.setupStyles.delete(id); }

  async getCompanies(): Promise<Company[]> { const items = Array.from(this.companies.values()); return this.filterByTenant(items); }
  async getCompaniesByTenant(tenantId: string): Promise<Company[]> { const items = Array.from(this.companies.values()); return items.filter(item => item.tenantId === tenantId); }
  async getCompany(id: string): Promise<Company | undefined> { return this.companies.get(id); }
  async createCompany(company: InsertCompany): Promise<Company> { const id = company.id || randomUUID(); const item: Company = { ...company, id, createdAt: new Date(), updatedAt: new Date() }; this.companies.set(id, item); return item; }
  async updateCompany(id: string, company: Partial<InsertCompany>): Promise<Company | undefined> { const existing = this.companies.get(id); if (!existing) return undefined; const updated = { ...existing, ...company, updatedAt: new Date() }; this.companies.set(id, updated); return updated; }
  async deleteCompany(id: string): Promise<boolean> { return this.companies.delete(id); }

  // Continue with stub implementations for all other methods...
  async getContracts(): Promise<Contract[]> { const items = Array.from(this.contracts.values()); return this.filterByTenant(items); }
  async getContractsByTenant(tenantId: string): Promise<Contract[]> { const items = Array.from(this.contracts.values()); return items.filter(item => item.tenantId === tenantId); }
  async getContract(id: string): Promise<Contract | undefined> { return this.contracts.get(id); }
  async getContractsByCustomer(customerId: string): Promise<Contract[]> { const items = Array.from(this.contracts.values()); return items.filter(item => item.customerId === customerId); }
  async createContract(contract: InsertContract): Promise<Contract> { const id = contract.id || randomUUID(); const item: Contract = { ...contract, id, createdAt: new Date() }; this.contracts.set(id, item); return item; }
  async updateContract(id: string, contract: Partial<InsertContract>): Promise<Contract | undefined> { const existing = this.contracts.get(id); if (!existing) return undefined; const updated = { ...existing, ...contract }; this.contracts.set(id, updated); return updated; }
  async deleteContract(id: string): Promise<boolean> { return this.contracts.delete(id); }

  async getProposals(): Promise<Proposal[]> { const items = Array.from(this.proposals.values()); return this.filterByTenant(items); }
  async getProposal(id: string): Promise<Proposal | undefined> { return this.proposals.get(id); }
  async getProposalsByCustomer(customerId: string): Promise<Proposal[]> { const items = Array.from(this.proposals.values()); return items.filter(item => item.customerId === customerId); }
  async createProposal(proposal: InsertProposal): Promise<Proposal> { const id = proposal.id || randomUUID(); const item: Proposal = { ...proposal, id, createdAt: new Date() }; this.proposals.set(id, item); return item; }
  async updateProposal(id: string, proposal: Partial<InsertProposal>): Promise<Proposal | undefined> { const existing = this.proposals.get(id); if (!existing) return undefined; const updated = { ...existing, ...proposal }; this.proposals.set(id, updated); return updated; }
  async deleteProposal(id: string): Promise<boolean> { return this.proposals.delete(id); }

  async getCommunications(bookingId?: string): Promise<Communication[]> { const items = Array.from(this.communications.values()); return bookingId ? items.filter(item => item.bookingId === bookingId) : items; }
  async getCommunication(id: string): Promise<Communication | undefined> { return this.communications.get(id); }
  async getCommunicationsByProposal(proposalId: string): Promise<Communication[]> { const items = Array.from(this.communications.values()); return items.filter(item => item.proposalId === proposalId); }
  async getCommunicationsByCustomer(customerId: string): Promise<Communication[]> { const items = Array.from(this.communications.values()); return items.filter(item => item.customerId === customerId); }
  async getCommunicationByMessageId(messageId: string): Promise<Communication | undefined> { const items = Array.from(this.communications.values()); return items.find(item => item.messageId === messageId); }
  async createCommunication(communication: InsertCommunication): Promise<Communication> { const id = communication.id || randomUUID(); const item: Communication = { ...communication, id, createdAt: new Date() }; this.communications.set(id, item); return item; }
  async updateCommunication(id: string, communication: Partial<InsertCommunication>): Promise<Communication | undefined> { const existing = this.communications.get(id); if (!existing) return undefined; const updated = { ...existing, ...communication }; this.communications.set(id, updated); return updated; }

  async getSettings(): Promise<Setting[]> { return Array.from(this.settings.values()); }
  async getSetting(key: string): Promise<Setting | undefined> { return this.settings.get(key); }
  async createSetting(setting: InsertSetting): Promise<Setting> { const item: Setting = { ...setting, id: randomUUID(), updatedAt: new Date() }; this.settings.set(setting.key, item); return item; }
  async updateSetting(key: string, value: any): Promise<Setting | undefined> { const existing = this.settings.get(key); if (!existing) return undefined; const updated = { ...existing, value, updatedAt: new Date() }; this.settings.set(key, updated); return updated; }

  async getPayments(): Promise<Payment[]> { const items = Array.from(this.payments.values()); return this.filterByTenant(items); }
  async getPayment(id: string): Promise<Payment | undefined> { return this.payments.get(id); }
  async getPaymentsByBooking(bookingId: string): Promise<Payment[]> { const items = Array.from(this.payments.values()); return items.filter(item => item.bookingId === bookingId); }
  async createPayment(payment: InsertPayment): Promise<Payment> { const id = payment.id || randomUUID(); const item: Payment = { ...payment, id, createdAt: new Date() }; this.payments.set(id, item); return item; }
  async updatePayment(id: string, payment: Partial<InsertPayment>): Promise<Payment | undefined> { const existing = this.payments.get(id); if (!existing) return undefined; const updated = { ...existing, ...payment }; this.payments.set(id, updated); return updated; }

  async getTasks(): Promise<Task[]> { const items = Array.from(this.tasks.values()); return this.filterByTenant(items); }
  async getTask(id: string): Promise<Task | undefined> { return this.tasks.get(id); }
  async getTasksByUser(userId: string): Promise<Task[]> { const items = Array.from(this.tasks.values()); return items.filter(item => item.assignedTo === userId); }
  async createTask(task: InsertTask): Promise<Task> { const id = task.id || randomUUID(); const item: Task = { ...task, id, createdAt: new Date() }; this.tasks.set(id, item); return item; }
  async updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined> { const existing = this.tasks.get(id); if (!existing) return undefined; const updated = { ...existing, ...task }; this.tasks.set(id, updated); return updated; }

  async getAiInsights(): Promise<AiInsight[]> { return Array.from(this.aiInsights.values()); }
  async getActiveAiInsights(): Promise<AiInsight[]> { const items = Array.from(this.aiInsights.values()); return items.filter(item => item.status === 'active'); }
  async createAiInsight(insight: InsertAiInsight): Promise<AiInsight> { const id = insight.id || randomUUID(); const item: AiInsight = { ...insight, id, createdAt: new Date() }; this.aiInsights.set(id, item); return item; }

  async getPackages(): Promise<Package[]> { const items = Array.from(this.packages.values()); return this.filterByTenant(items); }
  async getPackagesByTenant(tenantId: string): Promise<Package[]> { const items = Array.from(this.packages.values()); return items.filter(item => item.tenantId === tenantId); }
  async getPackage(id: string): Promise<Package | undefined> { return this.packages.get(id); }
  async createPackage(pkg: InsertPackage): Promise<Package> { const id = pkg.id || randomUUID(); const item: Package = { ...pkg, id, createdAt: new Date() }; this.packages.set(id, item); return item; }
  async updatePackage(id: string, pkg: Partial<InsertPackage>): Promise<Package | undefined> { const existing = this.packages.get(id); if (!existing) return undefined; const updated = { ...existing, ...pkg }; this.packages.set(id, updated); return updated; }
  async deletePackage(id: string): Promise<boolean> { return this.packages.delete(id); }

  async getServices(): Promise<Service[]> { const items = Array.from(this.services.values()); return this.filterByTenant(items); }
  async getServicesByTenant(tenantId: string): Promise<Service[]> { const items = Array.from(this.services.values()); return items.filter(item => item.tenantId === tenantId); }
  async getService(id: string): Promise<Service | undefined> { return this.services.get(id); }
  async createService(service: InsertService): Promise<Service> { const id = service.id || randomUUID(); const item: Service = { ...service, id, createdAt: new Date() }; this.services.set(id, item); return item; }
  async updateService(id: string, service: Partial<InsertService>): Promise<Service | undefined> { const existing = this.services.get(id); if (!existing) return undefined; const updated = { ...existing, ...service }; this.services.set(id, updated); return updated; }
  async deleteService(id: string): Promise<boolean> { return this.services.delete(id); }

  async getTaxSettings(): Promise<TaxSetting[]> { const items = Array.from(this.taxSettings.values()); return this.filterByTenant(items); }
  async getTaxSetting(id: string): Promise<TaxSetting | undefined> { return this.taxSettings.get(id); }
  async createTaxSetting(taxSetting: InsertTaxSetting): Promise<TaxSetting> { const id = taxSetting.id || randomUUID(); const item: TaxSetting = { ...taxSetting, id, createdAt: new Date() }; this.taxSettings.set(id, item); return item; }
  async updateTaxSetting(id: string, taxSetting: Partial<InsertTaxSetting>): Promise<TaxSetting | undefined> { const existing = this.taxSettings.get(id); if (!existing) return undefined; const updated = { ...existing, ...taxSetting }; this.taxSettings.set(id, updated); return updated; }
  async deleteTaxSetting(id: string): Promise<boolean> { return this.taxSettings.delete(id); }

  async getCampaignSources(): Promise<CampaignSource[]> { return Array.from(this.campaignSources.values()); }
  async createCampaignSource(source: InsertCampaignSource): Promise<CampaignSource> { const id = source.id || randomUUID(); const item: CampaignSource = { ...source, id, createdAt: new Date() }; this.campaignSources.set(id, item); return item; }
  async updateCampaignSource(id: string, source: Partial<InsertCampaignSource>): Promise<CampaignSource | undefined> { const existing = this.campaignSources.get(id); if (!existing) return undefined; const updated = { ...existing, ...source }; this.campaignSources.set(id, updated); return updated; }

  async getTags(): Promise<Tag[]> { return Array.from(this.tags.values()); }
  async createTag(tag: InsertTag): Promise<Tag> { const id = tag.id || randomUUID(); const item: Tag = { ...tag, id, createdAt: new Date() }; this.tags.set(id, item); return item; }
  async updateTag(id: string, tag: Partial<InsertTag>): Promise<Tag | undefined> { const existing = this.tags.get(id); if (!existing) return undefined; const updated = { ...existing, ...tag }; this.tags.set(id, updated); return updated; }
  async deleteTag(id: string): Promise<boolean> { return this.tags.delete(id); }

  async getLeads(filters?: { status?: string; source?: string; q?: string }): Promise<Lead[]> { let items = Array.from(this.leads.values()); if (filters?.status) items = items.filter(item => item.status === filters.status); if (filters?.source) items = items.filter(item => item.source === filters.source); if (filters?.q) items = items.filter(item => item.name?.includes(filters.q!) || item.email?.includes(filters.q!)); return items; }
  async getLead(id: string): Promise<Lead | undefined> { return this.leads.get(id); }
  async createLead(lead: InsertLead): Promise<Lead> { const id = lead.id || randomUUID(); const item: Lead = { ...lead, id, createdAt: new Date() }; this.leads.set(id, item); return item; }
  async updateLead(id: string, lead: Partial<InsertLead>): Promise<Lead | undefined> { const existing = this.leads.get(id); if (!existing) return undefined; const updated = { ...existing, ...lead }; this.leads.set(id, updated); return updated; }
  async deleteLead(id: string): Promise<boolean> { return this.leads.delete(id); }

  async getLeadActivities(leadId: string): Promise<LeadActivity[]> { const items = Array.from(this.leadActivities.values()); return items.filter(item => item.leadId === leadId); }
  async createLeadActivity(activity: InsertLeadActivity): Promise<LeadActivity> { const id = activity.id || randomUUID(); const item: LeadActivity = { ...activity, id, createdAt: new Date() }; this.leadActivities.set(id, item); return item; }

  async getLeadTasks(filters?: { assignee?: string; due?: string }): Promise<LeadTask[]> { let items = Array.from(this.leadTasks.values()); if (filters?.assignee) items = items.filter(item => item.assignedTo === filters.assignee); return items; }
  async createLeadTask(task: InsertLeadTask): Promise<LeadTask> { const id = task.id || randomUUID(); const item: LeadTask = { ...task, id, createdAt: new Date() }; this.leadTasks.set(id, item); return item; }
  async updateLeadTask(id: string, task: Partial<InsertLeadTask>): Promise<LeadTask | undefined> { const existing = this.leadTasks.get(id); if (!existing) return undefined; const updated = { ...existing, ...task }; this.leadTasks.set(id, updated); return updated; }

  async getTours(): Promise<Tour[]> { const items = Array.from(this.tours.values()); return this.filterByTenant(items); }
  async getTour(id: string): Promise<Tour | undefined> { return this.tours.get(id); }
  async createTour(tour: InsertTour): Promise<Tour> { const id = tour.id || randomUUID(); const item: Tour = { ...tour, id, createdAt: new Date() }; this.tours.set(id, item); return item; }
  async updateTour(id: string, tour: Partial<InsertTour>): Promise<Tour | undefined> { const existing = this.tours.get(id); if (!existing) return undefined; const updated = { ...existing, ...tour }; this.tours.set(id, updated); return updated; }

  async getLeadTags(leadId: string): Promise<Tag[]> { const tagIds = this.leadTags.get(leadId) || []; return tagIds.map(tagId => this.tags.get(tagId)).filter(Boolean) as Tag[]; }
  async addLeadTag(leadId: string, tagId: string): Promise<void> { const existing = this.leadTags.get(leadId) || []; if (!existing.includes(tagId)) { this.leadTags.set(leadId, [...existing, tagId]); } }
  async removeLeadTag(leadId: string, tagId: string): Promise<void> { const existing = this.leadTags.get(leadId) || []; this.leadTags.set(leadId, existing.filter(id => id !== tagId)); }

  async getTenants(): Promise<any[]> { return []; }
  async getTenant(id: string): Promise<any> { return null; }
  async createTenant(tenant: any): Promise<any> { return null; }
  async updateTenant(id: string, tenant: any): Promise<any> { return null; }

  async getSubscriptionPackages(): Promise<any[]> { return []; }
  async getSubscriptionPackage(id: string): Promise<any> { return null; }

  async getAllPackagesAdmin(): Promise<Package[]> { return Array.from(this.packages.values()); }
  async getAllUsersAdmin(): Promise<User[]> { return Array.from(this.users.values()); }
  async getAllServicesAdmin(): Promise<any[]> { return Array.from(this.services.values()); }
  async getUserByIdDirect(id: string): Promise<User | undefined> { return this.users.get(id); }
}

// Pure Drizzle ORM implementation
export class DbStorage implements IStorage {
  constructor(private db: typeof db) {
    // Database connection is passed from db.ts
  }

  // Helper method to get tenant context and build where clauses
  private async getTenantWhereClause<T extends { tenantId: any }>(table: T) {
    const context = await getCurrentTenantContext();
    
    if (context.role === 'super_admin') {
      return isNotNull(table.tenantId); // Super admin sees all tenant data
    } else if (context.tenantId) {
      return eq(table.tenantId, context.tenantId);
    } else {
      throw new Error('No tenant context available');
    }
  }

  // Users
  async getUsers(): Promise<User[]> {
    const context = await getCurrentTenantContext();
    
    if (context.role === 'super_admin') {
      return await this.db.select().from(users);
    } else if (context.tenantId) {
      return await this.db.select().from(users).where(eq(users.tenantId, context.tenantId));
    } else {
      throw new Error('No tenant context available');
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async getUsersByTenant(tenantId: string): Promise<User[]> {
    return await this.db.select().from(users).where(eq(users.tenantId, tenantId));
  }

  async createUser(user: InsertUser): Promise<User> {
    const userToInsert = {
      ...user,
      id: user.id || randomUUID(),
      permissions: user.permissions || getPermissionsForRole(user.role || 'tenant_user'),
      isActive: user.isActive ?? true,
    };

    const result = await this.db.insert(users).values(userToInsert).returning();
    return result[0];
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    const result = await this.db.update(users).set(user).where(eq(users.id, id)).returning();
    return result[0];
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await this.db.delete(users).where(eq(users.id, id));
    return result.rowCount > 0;
  }

  // Venues
  async getVenues(): Promise<Venue[]> {
    const tenantWhere = await this.getTenantWhereClause(venues);
    return await this.db.select().from(venues).where(tenantWhere);
  }

  async getVenuesByTenant(tenantId: string): Promise<Venue[]> {
    return await this.db.select().from(venues).where(eq(venues.tenantId, tenantId));
  }

  async getVenue(id: string): Promise<Venue | undefined> {
    const context = await getCurrentTenantContext();
    
    if (context.role === 'super_admin') {
      const result = await this.db.select().from(venues).where(eq(venues.id, id)).limit(1);
      return result[0];
    } else if (context.tenantId) {
      const result = await this.db.select().from(venues)
        .where(and(eq(venues.id, id), eq(venues.tenantId, context.tenantId)))
        .limit(1);
      return result[0];
    } else {
      throw new Error('No tenant context available');
    }
  }

  async createVenue(venue: InsertVenue): Promise<Venue> {
    const venueToInsert = {
      ...venue,
      id: venue.id || randomUUID(),
      isActive: venue.isActive ?? true,
    };

    const result = await this.db.insert(venues).values(venueToInsert).returning();
    return result[0];
  }

  async updateVenue(id: string, venue: Partial<InsertVenue>): Promise<Venue | undefined> {
    const result = await this.db.update(venues).set(venue).where(eq(venues.id, id)).returning();
    return result[0];
  }

  async deleteVenue(id: string): Promise<boolean> {
    const result = await this.db.update(venues).set({ isActive: false }).where(eq(venues.id, id));
    return result.rowCount > 0;
  }

  // Spaces
  async getSpaces(): Promise<Space[]> {
    const context = await getCurrentTenantContext();
    
    if (context.role === 'super_admin') {
      return await this.db.select({
        id: spaces.id,
        venueId: spaces.venueId,
        name: spaces.name,
        description: spaces.description,
        capacity: spaces.capacity,
        pricePerHour: spaces.pricePerHour,
        amenities: spaces.amenities,
        imageUrl: spaces.imageUrl,
        isActive: spaces.isActive,
        createdAt: spaces.createdAt,
      }).from(spaces)
      .innerJoin(venues, eq(spaces.venueId, venues.id))
      .where(isNotNull(venues.tenantId));
    } else if (context.tenantId) {
      return await this.db.select({
        id: spaces.id,
        venueId: spaces.venueId,
        name: spaces.name,
        description: spaces.description,
        capacity: spaces.capacity,
        pricePerHour: spaces.pricePerHour,
        amenities: spaces.amenities,
        imageUrl: spaces.imageUrl,
        isActive: spaces.isActive,
        createdAt: spaces.createdAt,
      }).from(spaces)
      .innerJoin(venues, eq(spaces.venueId, venues.id))
      .where(eq(venues.tenantId, context.tenantId));
    } else {
      throw new Error('No tenant context available');
    }
  }

  async getSpacesByTenant(tenantId: string): Promise<Space[]> {
    return await this.db.select({
      id: spaces.id,
      venueId: spaces.venueId,
      name: spaces.name,
      description: spaces.description,
      capacity: spaces.capacity,
      pricePerHour: spaces.pricePerHour,
      amenities: spaces.amenities,
      imageUrl: spaces.imageUrl,
      isActive: spaces.isActive,
      createdAt: spaces.createdAt,
    }).from(spaces)
    .innerJoin(venues, eq(spaces.venueId, venues.id))
    .where(eq(venues.tenantId, tenantId));
  }

  async getSpace(id: string): Promise<Space | undefined> {
    const context = await getCurrentTenantContext();
    
    if (context.role === 'super_admin') {
      const result = await this.db.select().from(spaces).where(eq(spaces.id, id)).limit(1);
      return result[0];
    } else if (context.tenantId) {
      const result = await this.db.select({
        id: spaces.id,
        venueId: spaces.venueId,
        name: spaces.name,
        description: spaces.description,
        capacity: spaces.capacity,
        pricePerHour: spaces.pricePerHour,
        amenities: spaces.amenities,
        imageUrl: spaces.imageUrl,
        isActive: spaces.isActive,
        createdAt: spaces.createdAt,
      }).from(spaces)
      .innerJoin(venues, eq(spaces.venueId, venues.id))
      .where(and(eq(spaces.id, id), eq(venues.tenantId, context.tenantId)))
      .limit(1);
      return result[0];
    } else {
      throw new Error('No tenant context available');
    }
  }

  async getSpacesByVenue(venueId: string): Promise<Space[]> {
    return await this.db.select().from(spaces)
      .where(and(eq(spaces.venueId, venueId), eq(spaces.isActive, true)))
      .orderBy(asc(spaces.createdAt));
  }

  async createSpace(space: InsertSpace): Promise<Space> {
    const spaceToInsert = {
      ...space,
      id: space.id || randomUUID(),
      isActive: space.isActive ?? true,
    };

    const result = await this.db.insert(spaces).values(spaceToInsert).returning();
    return result[0];
  }

  async updateSpace(id: string, space: Partial<InsertSpace>): Promise<Space | undefined> {
    const result = await this.db.update(spaces).set(space).where(eq(spaces.id, id)).returning();
    return result[0];
  }

  async deleteSpace(id: string): Promise<boolean> {
    const result = await this.db.update(spaces).set({ isActive: false }).where(eq(spaces.id, id));
    return result.rowCount > 0;
  }

  // Setup Styles
  async getSetupStyles(): Promise<SetupStyle[]> {
    const tenantWhere = await this.getTenantWhereClause(setupStyles);
    return await this.db.select().from(setupStyles).where(tenantWhere);
  }

  async getSetupStylesByTenant(tenantId: string): Promise<SetupStyle[]> {
    return await this.db.select().from(setupStyles).where(eq(setupStyles.tenantId, tenantId));
  }

  async getSetupStyle(id: string): Promise<SetupStyle | undefined> {
    const result = await this.db.select().from(setupStyles).where(eq(setupStyles.id, id)).limit(1);
    return result[0];
  }

  async createSetupStyle(setupStyle: InsertSetupStyle): Promise<SetupStyle> {
    const setupStyleToInsert = {
      ...setupStyle,
      id: setupStyle.id || randomUUID(),
      isActive: setupStyle.isActive ?? true,
    };

    const result = await this.db.insert(setupStyles).values(setupStyleToInsert).returning();
    return result[0];
  }

  async updateSetupStyle(id: string, setupStyle: Partial<InsertSetupStyle>): Promise<SetupStyle | undefined> {
    const result = await this.db.update(setupStyles).set(setupStyle).where(eq(setupStyles.id, id)).returning();
    return result[0];
  }

  async deleteSetupStyle(id: string): Promise<boolean> {
    const result = await this.db.delete(setupStyles).where(eq(setupStyles.id, id));
    return result.rowCount > 0;
  }

  // Companies
  async getCompanies(): Promise<Company[]> {
    const tenantWhere = await this.getTenantWhereClause(companies);
    return await this.db.select().from(companies).where(tenantWhere);
  }

  async getCompaniesByTenant(tenantId: string): Promise<Company[]> {
    return await this.db.select().from(companies).where(eq(companies.tenantId, tenantId));
  }

  async getCompany(id: string): Promise<Company | undefined> {
    const result = await this.db.select().from(companies).where(eq(companies.id, id)).limit(1);
    return result[0];
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    const companyToInsert = {
      ...company,
      id: company.id || randomUUID(),
      isActive: company.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await this.db.insert(companies).values(companyToInsert).returning();
    return result[0];
  }

  async updateCompany(id: string, company: Partial<InsertCompany>): Promise<Company | undefined> {
    const companyToUpdate = {
      ...company,
      updatedAt: new Date(),
    };

    const result = await this.db.update(companies).set(companyToUpdate).where(eq(companies.id, id)).returning();
    return result[0];
  }

  async deleteCompany(id: string): Promise<boolean> {
    const result = await this.db.delete(companies).where(eq(companies.id, id));
    return result.rowCount > 0;
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    const tenantWhere = await this.getTenantWhereClause(customers);
    return await this.db.select().from(customers).where(tenantWhere);
  }

  async getCustomersByTenant(tenantId: string): Promise<Customer[]> {
    return await this.db.select().from(customers).where(eq(customers.tenantId, tenantId));
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const result = await this.db.select().from(customers).where(eq(customers.id, id)).limit(1);
    return result[0];
  }

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    const result = await this.db.select().from(customers).where(eq(customers.email, email)).limit(1);
    return result[0];
  }

  async getCustomersByCompany(companyId: string): Promise<Customer[]> {
    return await this.db.select().from(customers).where(eq(customers.companyId, companyId));
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const customerToInsert = {
      ...customer,
      id: customer.id || randomUUID(),
    };

    const result = await this.db.insert(customers).values(customerToInsert).returning();
    return result[0];
  }

  async updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const result = await this.db.update(customers).set(customer).where(eq(customers.id, id)).returning();
    return result[0];
  }

  async deleteCustomer(id: string): Promise<boolean> {
    const result = await this.db.delete(customers).where(eq(customers.id, id));
    return result.rowCount > 0;
  }

  // Contracts
  async getContracts(): Promise<Contract[]> {
    const tenantWhere = await this.getTenantWhereClause(contracts);
    return await this.db.select().from(contracts).where(tenantWhere);
  }

  async getContractsByTenant(tenantId: string): Promise<Contract[]> {
    return await this.db.select().from(contracts).where(eq(contracts.tenantId, tenantId));
  }

  async getContract(id: string): Promise<Contract | undefined> {
    const result = await this.db.select().from(contracts).where(eq(contracts.id, id)).limit(1);
    return result[0];
  }

  async getContractsByCustomer(customerId: string): Promise<Contract[]> {
    return await this.db.select().from(contracts).where(eq(contracts.customerId, customerId));
  }

  async createContract(contract: InsertContract): Promise<Contract> {
    const contractToInsert = {
      ...contract,
      id: contract.id || randomUUID(),
    };

    const result = await this.db.insert(contracts).values(contractToInsert).returning();
    return result[0];
  }

  async updateContract(id: string, contract: Partial<InsertContract>): Promise<Contract | undefined> {
    const result = await this.db.update(contracts).set(contract).where(eq(contracts.id, id)).returning();
    return result[0];
  }

  async deleteContract(id: string): Promise<boolean> {
    const result = await this.db.delete(contracts).where(eq(contracts.id, id));
    return result.rowCount > 0;
  }

  // Bookings
  async getBookings(): Promise<Booking[]> {
    const tenantWhere = await this.getTenantWhereClause(bookings);
    return await this.db.select().from(bookings).where(tenantWhere);
  }

  async getBookingsByTenant(tenantId: string): Promise<Booking[]> {
    return await this.db.select().from(bookings).where(eq(bookings.tenantId, tenantId));
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    const result = await this.db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
    return result[0];
  }

  async getBookingsByCustomer(customerId: string): Promise<Booking[]> {
    return await this.db.select().from(bookings).where(eq(bookings.customerId, customerId));
  }

  async getBookingsByContract(contractId: string): Promise<Booking[]> {
    return await this.db.select().from(bookings).where(eq(bookings.contractId, contractId));
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const bookingToInsert = {
      ...booking,
      id: booking.id || randomUUID(),
    };

    const result = await this.db.insert(bookings).values(bookingToInsert).returning();
    return result[0];
  }

  async updateBooking(id: string, booking: Partial<InsertBooking>): Promise<Booking | undefined> {
    const result = await this.db.update(bookings).set(booking).where(eq(bookings.id, id)).returning();
    return result[0];
  }

  async createMultipleBookings(bookingsData: InsertBooking[], contractId: string): Promise<Booking[]> {
    const bookingsToInsert = bookingsData.map(booking => ({
      ...booking,
      id: booking.id || randomUUID(),
      contractId,
    }));

    const result = await this.db.insert(bookings).values(bookingsToInsert).returning();
    return result;
  }

  async deleteBooking(id: string): Promise<boolean> {
    const result = await this.db.delete(bookings).where(eq(bookings.id, id));
    return result.rowCount > 0;
  }

  // Proposals
  async getProposals(): Promise<Proposal[]> {
    const tenantWhere = await this.getTenantWhereClause(proposals);
    return await this.db.select().from(proposals).where(tenantWhere);
  }

  async getProposal(id: string): Promise<Proposal | undefined> {
    const result = await this.db.select().from(proposals).where(eq(proposals.id, id)).limit(1);
    return result[0];
  }

  async getProposalsByCustomer(customerId: string): Promise<Proposal[]> {
    return await this.db.select().from(proposals).where(eq(proposals.customerId, customerId));
  }

  async createProposal(proposal: InsertProposal): Promise<Proposal> {
    const proposalToInsert = {
      ...proposal,
      id: proposal.id || randomUUID(),
    };

    const result = await this.db.insert(proposals).values(proposalToInsert).returning();
    return result[0];
  }

  async updateProposal(id: string, proposal: Partial<InsertProposal>): Promise<Proposal | undefined> {
    const result = await this.db.update(proposals).set(proposal).where(eq(proposals.id, id)).returning();
    return result[0];
  }

  async deleteProposal(id: string): Promise<boolean> {
    const result = await this.db.delete(proposals).where(eq(proposals.id, id));
    return result.rowCount > 0;
  }

  // Communications
  async getCommunications(bookingId?: string): Promise<Communication[]> {
    if (bookingId) {
      return await this.db.select().from(communications).where(eq(communications.bookingId, bookingId));
    }
    return await this.db.select().from(communications);
  }

  async getCommunication(id: string): Promise<Communication | undefined> {
    const result = await this.db.select().from(communications).where(eq(communications.id, id)).limit(1);
    return result[0];
  }

  async getCommunicationsByProposal(proposalId: string): Promise<Communication[]> {
    return await this.db.select().from(communications).where(eq(communications.proposalId, proposalId));
  }

  async getCommunicationsByCustomer(customerId: string): Promise<Communication[]> {
    return await this.db.select().from(communications).where(eq(communications.customerId, customerId));
  }

  async getCommunicationByMessageId(messageId: string): Promise<Communication | undefined> {
    const result = await this.db.select().from(communications).where(eq(communications.messageId, messageId)).limit(1);
    return result[0];
  }

  async createCommunication(communication: InsertCommunication): Promise<Communication> {
    const communicationToInsert = {
      ...communication,
      id: communication.id || randomUUID(),
    };

    const result = await this.db.insert(communications).values(communicationToInsert).returning();
    return result[0];
  }

  async updateCommunication(id: string, communication: Partial<InsertCommunication>): Promise<Communication | undefined> {
    const result = await this.db.update(communications).set(communication).where(eq(communications.id, id)).returning();
    return result[0];
  }

  // Settings
  async getSettings(): Promise<Setting[]> {
    return await this.db.select().from(settings);
  }

  async getSetting(key: string): Promise<Setting | undefined> {
    const result = await this.db.select().from(settings).where(eq(settings.key, key)).limit(1);
    return result[0];
  }

  async createSetting(setting: InsertSetting): Promise<Setting> {
    const settingToInsert = {
      ...setting,
      id: randomUUID(),
      updatedAt: new Date(),
    };

    const result = await this.db.insert(settings).values(settingToInsert).returning();
    return result[0];
  }

  async updateSetting(key: string, value: any): Promise<Setting | undefined> {
    const result = await this.db.update(settings)
      .set({ value, updatedAt: new Date() })
      .where(eq(settings.key, key))
      .returning();
    return result[0];
  }

  // Payments
  async getPayments(): Promise<Payment[]> {
    const tenantWhere = await this.getTenantWhereClause(payments);
    return await this.db.select().from(payments).where(tenantWhere);
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    const result = await this.db.select().from(payments).where(eq(payments.id, id)).limit(1);
    return result[0];
  }

  async getPaymentsByBooking(bookingId: string): Promise<Payment[]> {
    return await this.db.select().from(payments).where(eq(payments.bookingId, bookingId));
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const paymentToInsert = {
      ...payment,
      id: payment.id || randomUUID(),
    };

    const result = await this.db.insert(payments).values(paymentToInsert).returning();
    return result[0];
  }

  async updatePayment(id: string, payment: Partial<InsertPayment>): Promise<Payment | undefined> {
    const result = await this.db.update(payments).set(payment).where(eq(payments.id, id)).returning();
    return result[0];
  }

  // Tasks
  async getTasks(): Promise<Task[]> {
    const tenantWhere = await this.getTenantWhereClause(tasks);
    return await this.db.select().from(tasks).where(tenantWhere);
  }

  async getTask(id: string): Promise<Task | undefined> {
    const result = await this.db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
    return result[0];
  }

  async getTasksByUser(userId: string): Promise<Task[]> {
    return await this.db.select().from(tasks).where(eq(tasks.assignedTo, userId));
  }

  async createTask(task: InsertTask): Promise<Task> {
    const taskToInsert = {
      ...task,
      id: task.id || randomUUID(),
    };

    const result = await this.db.insert(tasks).values(taskToInsert).returning();
    return result[0];
  }

  async updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined> {
    const result = await this.db.update(tasks).set(task).where(eq(tasks.id, id)).returning();
    return result[0];
  }

  // AI Insights
  async getAiInsights(): Promise<AiInsight[]> {
    return await this.db.select().from(aiInsights);
  }

  async getActiveAiInsights(): Promise<AiInsight[]> {
    return await this.db.select().from(aiInsights).where(eq(aiInsights.status, 'active'));
  }

  async createAiInsight(insight: InsertAiInsight): Promise<AiInsight> {
    const insightToInsert = {
      ...insight,
      id: insight.id || randomUUID(),
    };

    const result = await this.db.insert(aiInsights).values(insightToInsert).returning();
    return result[0];
  }

  // Packages
  async getPackages(): Promise<Package[]> {
    const tenantWhere = await this.getTenantWhereClause(packages);
    return await this.db.select().from(packages).where(tenantWhere);
  }

  async getPackagesByTenant(tenantId: string): Promise<Package[]> {
    return await this.db.select().from(packages).where(eq(packages.tenantId, tenantId));
  }

  async getPackage(id: string): Promise<Package | undefined> {
    const result = await this.db.select().from(packages).where(eq(packages.id, id)).limit(1);
    return result[0];
  }

  async createPackage(pkg: InsertPackage): Promise<Package> {
    const packageToInsert = {
      ...pkg,
      id: pkg.id || randomUUID(),
      isActive: pkg.isActive ?? true,
    };

    const result = await this.db.insert(packages).values(packageToInsert).returning();
    return result[0];
  }

  async updatePackage(id: string, pkg: Partial<InsertPackage>): Promise<Package | undefined> {
    const result = await this.db.update(packages).set(pkg).where(eq(packages.id, id)).returning();
    return result[0];
  }

  async deletePackage(id: string): Promise<boolean> {
    const result = await this.db.delete(packages).where(eq(packages.id, id));
    return result.rowCount > 0;
  }

  // Services
  async getServices(): Promise<Service[]> {
    const tenantWhere = await this.getTenantWhereClause(services);
    return await this.db.select().from(services).where(tenantWhere);
  }

  async getServicesByTenant(tenantId: string): Promise<Service[]> {
    return await this.db.select().from(services).where(eq(services.tenantId, tenantId));
  }

  async getService(id: string): Promise<Service | undefined> {
    const result = await this.db.select().from(services).where(eq(services.id, id)).limit(1);
    return result[0];
  }

  async createService(service: InsertService): Promise<Service> {
    const serviceToInsert = {
      ...service,
      id: service.id || randomUUID(),
      isActive: service.isActive ?? true,
    };

    const result = await this.db.insert(services).values(serviceToInsert).returning();
    return result[0];
  }

  async updateService(id: string, service: Partial<InsertService>): Promise<Service | undefined> {
    const result = await this.db.update(services).set(service).where(eq(services.id, id)).returning();
    return result[0];
  }

  async deleteService(id: string): Promise<boolean> {
    const result = await this.db.delete(services).where(eq(services.id, id));
    return result.rowCount > 0;
  }

  // Tax Settings
  async getTaxSettings(): Promise<TaxSetting[]> {
    const tenantWhere = await this.getTenantWhereClause(taxSettings);
    return await this.db.select().from(taxSettings).where(tenantWhere);
  }

  async getTaxSetting(id: string): Promise<TaxSetting | undefined> {
    const result = await this.db.select().from(taxSettings).where(eq(taxSettings.id, id)).limit(1);
    return result[0];
  }

  async createTaxSetting(taxSetting: InsertTaxSetting): Promise<TaxSetting> {
    const taxSettingToInsert = {
      ...taxSetting,
      id: taxSetting.id || randomUUID(),
      isActive: taxSetting.isActive ?? true,
    };

    const result = await this.db.insert(taxSettings).values(taxSettingToInsert).returning();
    return result[0];
  }

  async updateTaxSetting(id: string, taxSetting: Partial<InsertTaxSetting>): Promise<TaxSetting | undefined> {
    const result = await this.db.update(taxSettings).set(taxSetting).where(eq(taxSettings.id, id)).returning();
    return result[0];
  }

  async deleteTaxSetting(id: string): Promise<boolean> {
    const result = await this.db.delete(taxSettings).where(eq(taxSettings.id, id));
    return result.rowCount > 0;
  }

  // Campaign Sources
  async getCampaignSources(): Promise<CampaignSource[]> {
    return await this.db.select().from(campaignSources);
  }

  async createCampaignSource(source: InsertCampaignSource): Promise<CampaignSource> {
    const sourceToInsert = {
      ...source,
      id: source.id || randomUUID(),
    };

    const result = await this.db.insert(campaignSources).values(sourceToInsert).returning();
    return result[0];
  }

  async updateCampaignSource(id: string, source: Partial<InsertCampaignSource>): Promise<CampaignSource | undefined> {
    const result = await this.db.update(campaignSources).set(source).where(eq(campaignSources.id, id)).returning();
    return result[0];
  }

  // Tags
  async getTags(): Promise<Tag[]> {
    return await this.db.select().from(tags);
  }

  async createTag(tag: InsertTag): Promise<Tag> {
    const tagToInsert = {
      ...tag,
      id: tag.id || randomUUID(),
    };

    const result = await this.db.insert(tags).values(tagToInsert).returning();
    return result[0];
  }

  async updateTag(id: string, tag: Partial<InsertTag>): Promise<Tag | undefined> {
    const result = await this.db.update(tags).set(tag).where(eq(tags.id, id)).returning();
    return result[0];
  }

  async deleteTag(id: string): Promise<boolean> {
    const result = await this.db.delete(tags).where(eq(tags.id, id));
    return result.rowCount > 0;
  }

  // Leads
  async getLeads(filters?: { status?: string; source?: string; q?: string }): Promise<Lead[]> {
    let query = this.db.select().from(leads);
    const conditions = [];

    if (filters?.status) {
      conditions.push(eq(leads.status, filters.status));
    }
    if (filters?.source) {
      conditions.push(eq(leads.source, filters.source));
    }
    if (filters?.q) {
      conditions.push(or(
        like(leads.name, `%${filters.q}%`),
        like(leads.email, `%${filters.q}%`)
      ));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query;
  }

  async getLead(id: string): Promise<Lead | undefined> {
    const result = await this.db.select().from(leads).where(eq(leads.id, id)).limit(1);
    return result[0];
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const leadToInsert = {
      ...lead,
      id: lead.id || randomUUID(),
    };

    const result = await this.db.insert(leads).values(leadToInsert).returning();
    return result[0];
  }

  async updateLead(id: string, lead: Partial<InsertLead>): Promise<Lead | undefined> {
    const result = await this.db.update(leads).set(lead).where(eq(leads.id, id)).returning();
    return result[0];
  }

  async deleteLead(id: string): Promise<boolean> {
    const result = await this.db.delete(leads).where(eq(leads.id, id));
    return result.rowCount > 0;
  }

  // Lead Activities
  async getLeadActivities(leadId: string): Promise<LeadActivity[]> {
    return await this.db.select().from(leadActivities).where(eq(leadActivities.leadId, leadId));
  }

  async createLeadActivity(activity: InsertLeadActivity): Promise<LeadActivity> {
    const activityToInsert = {
      ...activity,
      id: activity.id || randomUUID(),
    };

    const result = await this.db.insert(leadActivities).values(activityToInsert).returning();
    return result[0];
  }

  // Lead Tasks
  async getLeadTasks(filters?: { assignee?: string; due?: string }): Promise<LeadTask[]> {
    let query = this.db.select().from(leadTasks);
    const conditions = [];

    if (filters?.assignee) {
      conditions.push(eq(leadTasks.assignedTo, filters.assignee));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query;
  }

  async createLeadTask(task: InsertLeadTask): Promise<LeadTask> {
    const taskToInsert = {
      ...task,
      id: task.id || randomUUID(),
    };

    const result = await this.db.insert(leadTasks).values(taskToInsert).returning();
    return result[0];
  }

  async updateLeadTask(id: string, task: Partial<InsertLeadTask>): Promise<LeadTask | undefined> {
    const result = await this.db.update(leadTasks).set(task).where(eq(leadTasks.id, id)).returning();
    return result[0];
  }

  // Tours
  async getTours(): Promise<Tour[]> {
    const tenantWhere = await this.getTenantWhereClause(tours);
    return await this.db.select().from(tours).where(tenantWhere);
  }

  async getTour(id: string): Promise<Tour | undefined> {
    const result = await this.db.select().from(tours).where(eq(tours.id, id)).limit(1);
    return result[0];
  }

  async createTour(tour: InsertTour): Promise<Tour> {
    const tourToInsert = {
      ...tour,
      id: tour.id || randomUUID(),
    };

    const result = await this.db.insert(tours).values(tourToInsert).returning();
    return result[0];
  }

  async updateTour(id: string, tour: Partial<InsertTour>): Promise<Tour | undefined> {
    const result = await this.db.update(tours).set(tour).where(eq(tours.id, id)).returning();
    return result[0];
  }

  // Lead Tags (many-to-many relationship - simplified implementation)
  async getLeadTags(leadId: string): Promise<Tag[]> {
    // This would need a join table in practice - simplified for now
    return [];
  }

  async addLeadTag(leadId: string, tagId: string): Promise<void> {
    // Implementation would require join table
  }

  async removeLeadTag(leadId: string, tagId: string): Promise<void> {
    // Implementation would require join table
  }

  // Tenant management (super admin only)
  async getTenants(): Promise<any[]> {
    return await this.db.select().from(tenants).orderBy(desc(tenants.createdAt));
  }

  async getTenant(id: string): Promise<any> {
    const result = await this.db.select().from(tenants).where(eq(tenants.id, id)).limit(1);
    return result[0];
  }

  async createTenant(tenant: any): Promise<any> {
    const tenantToInsert = {
      ...tenant,
      id: tenant.id || randomUUID(),
    };

    const result = await this.db.insert(tenants).values(tenantToInsert).returning();
    return result[0];
  }

  async updateTenant(id: string, tenant: any): Promise<any> {
    const result = await this.db.update(tenants).set(tenant).where(eq(tenants.id, id)).returning();
    return result[0];
  }

  // Subscription packages (super admin only)
  async getSubscriptionPackages(): Promise<any[]> {
    return await this.db.select().from(subscriptionPackages);
  }

  async getSubscriptionPackage(id: string): Promise<any> {
    const result = await this.db.select().from(subscriptionPackages).where(eq(subscriptionPackages.id, id)).limit(1);
    return result[0];
  }

  // Admin-level methods that bypass tenant context for seeding operations
  async getAllPackagesAdmin(): Promise<Package[]> {
    return await this.db.select().from(packages);
  }

  async getAllUsersAdmin(): Promise<User[]> {
    return await this.db.select().from(users);
  }

  async getAllServicesAdmin(): Promise<any[]> {
    return await this.db.select().from(services);
  }

  // Direct user lookup that bypasses tenant context (for authentication middleware)
  async getUserByIdDirect(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }
}

// Create and export a singleton instance
export const storage = new DbStorage(db);