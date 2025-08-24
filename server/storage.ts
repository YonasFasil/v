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
  // Import table definitions for queries
  users, venues, spaces, setupStyles, companies, customers, contracts, 
  bookings, proposals, payments, tasks, packages, services,
  settings, communications, taxSettings, campaignSources, tags, leads,
  leadActivities, leadTasks, tours, tenants, subscriptionPackages, aiInsights,

} from "@shared/schema";
import { eq, and } from 'drizzle-orm';
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
import { randomUUID } from "crypto";

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
  getVenue(id: string): Promise<Venue | undefined>;
  createVenue(venue: InsertVenue): Promise<Venue>;
  updateVenue(id: string, venue: Partial<InsertVenue>): Promise<Venue | undefined>;

  // Spaces
  getSpaces(): Promise<Space[]>;
  getSpace(id: string): Promise<Space | undefined>;
  getSpacesByVenue(venueId: string): Promise<Space[]>;
  createSpace(space: InsertSpace): Promise<Space>;
  updateSpace(id: string, space: Partial<InsertSpace>): Promise<Space | undefined>;

  // Setup Styles
  getSetupStyles(): Promise<SetupStyle[]>;
  getSetupStyle(id: string): Promise<SetupStyle | undefined>;
  createSetupStyle(setupStyle: InsertSetupStyle): Promise<SetupStyle>;
  updateSetupStyle(id: string, setupStyle: Partial<InsertSetupStyle>): Promise<SetupStyle | undefined>;
  deleteSetupStyle(id: string): Promise<boolean>;

  // Companies
  getCompanies(): Promise<Company[]>;
  getCompany(id: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: string, company: Partial<InsertCompany>): Promise<Company | undefined>;
  deleteCompany(id: string): Promise<boolean>;

  // Customers
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  getCustomerByEmail(email: string): Promise<Customer | undefined>;
  getCustomersByCompany(companyId: string): Promise<Customer[]>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;

  // Contracts
  getContracts(): Promise<Contract[]>;
  getContract(id: string): Promise<Contract | undefined>;
  getContractsByCustomer(customerId: string): Promise<Contract[]>;
  createContract(contract: InsertContract): Promise<Contract>;
  updateContract(id: string, contract: Partial<InsertContract>): Promise<Contract | undefined>;
  deleteContract(id: string): Promise<boolean>;

  // Bookings
  getBookings(): Promise<Booking[]>;
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
  getPackage(id: string): Promise<Package | undefined>;
  createPackage(pkg: InsertPackage): Promise<Package>;
  updatePackage(id: string, pkg: Partial<InsertPackage>): Promise<Package | undefined>;
  deletePackage(id: string): Promise<boolean>;

  getServices(): Promise<Service[]>;
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
  
  // User lookup methods
  getUserByEmail(email: string): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
}

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
  private settings: Map<string, Setting>;
  
  // Lead Management Maps
  private campaignSources: Map<string, CampaignSource>;
  private tags: Map<string, Tag>;
  private leads: Map<string, Lead>;
  private leadActivities: Map<string, LeadActivity>;
  private leadTasks: Map<string, LeadTask>;
  private tours: Map<string, Tour>;
  private leadTags: Set<string>; // Store leadId:tagId combinations
  
  // Multi-tenant Maps
  public tenants: Map<string, Tenant>;
  public subscriptionPackages: Map<string, SubscriptionPackage>;


  constructor() {
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
    this.settings = new Map();
    
    // Lead Management initialization
    this.campaignSources = new Map();
    this.tags = new Map();
    this.leads = new Map();
    this.leadActivities = new Map();
    this.leadTasks = new Map();
    this.tours = new Map();
    this.leadTags = new Set();
    
    // Multi-tenant initialization
    this.tenants = new Map();
    this.subscriptionPackages = new Map();

    // Initialize data asynchronously  
    this.initializeData().catch(error => {
      console.error('Error initializing storage:', error);
    });
  }

  private async initializeData() {
    this.initializeSubscriptionPackages();
    this.initializeSamplePackagesAndServices();
    this.initializeSampleSetupStyles(); 
    this.initializeLeadManagementData();
    // Initialize with some default venues
    const defaultVenues: InsertVenue[] = [
      {
        name: "Grand Ballroom",
        description: "Perfect for weddings and large corporate events",
        capacity: 200,
        pricePerHour: "500.00",
        amenities: ["Audio/Visual Equipment", "Dance Floor", "Catering Kitchen"],
        imageUrl: "https://images.unsplash.com/photo-1464207687429-7505649dae38?ixlib=rb-4.0.3",
        isActive: true
      },
      {
        name: "Conference Center",
        description: "Ideal for business meetings and presentations",
        capacity: 50,
        pricePerHour: "200.00",
        amenities: ["Projector", "Conference Table", "WiFi"],
        imageUrl: "https://images.unsplash.com/photo-1431540015161-0bf868a2d407?ixlib=rb-4.0.3",
        isActive: true
      },
      {
        name: "Private Dining",
        description: "Intimate setting for special celebrations",
        capacity: 25,
        pricePerHour: "150.00",
        amenities: ["Private Bar", "Fireplace", "Garden View"],
        imageUrl: "https://images.unsplash.com/photo-1555244162-803834f70033?ixlib=rb-4.0.3",
        isActive: true
      }
    ];

    defaultVenues.forEach(venue => this.createVenue(venue));
    
    // Initialize spaces for the venues
    this.initializeSpaces();
  }

  private initializeSpaces() {
    // Get all venue IDs to create spaces for them
    const venueIds = Array.from(this.venues.keys());
    
    // Create spaces for Grand Ballroom (first venue)
    if (venueIds[0]) {
      const grandBallroomSpaces: InsertSpace[] = [
        {
          venueId: venueIds[0],
          name: "Main Ballroom",
          description: "Large elegant space for grand events",
          capacity: 200,
          pricePerHour: "500.00",
          amenities: ["Stage", "Dance Floor", "Crystal Chandeliers"],
          imageUrl: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?ixlib=rb-4.0.3",
          isActive: true
        },
        {
          venueId: venueIds[0],
          name: "VIP Lounge",
          description: "Exclusive private area within the ballroom",
          capacity: 50,
          pricePerHour: "200.00",
          amenities: ["Private Bar", "Lounge Seating", "City View"],
          imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3",
          isActive: true
        }
      ];
      grandBallroomSpaces.forEach(space => this.createSpace(space));
    }

    // Conference Center spaces
    if (venueIds[1]) {
      const conferenceSpaces: InsertSpace[] = [
        {
          venueId: venueIds[1],
          name: "Boardroom A",
          description: "Executive boardroom for meetings",
          capacity: 20,
          pricePerHour: "150.00",
          amenities: ["Conference Table", "Video Conferencing", "Whiteboard"],
          imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3",
          isActive: true
        },
        {
          venueId: venueIds[1],
          name: "Training Room",
          description: "Flexible training and presentation space",
          capacity: 30,
          pricePerHour: "100.00",
          amenities: ["Projector", "Flip Chart", "Sound System"],
          imageUrl: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?ixlib=rb-4.0.3",
          isActive: true
        }
      ];
      conferenceSpaces.forEach(space => this.createSpace(space));
    }

    // Private Dining spaces
    if (venueIds[2]) {
      const diningSpaces: InsertSpace[] = [
        {
          venueId: venueIds[2],
          name: "Garden Room",
          description: "Intimate dining with garden views",
          capacity: 25,
          pricePerHour: "150.00",
          amenities: ["Fireplace", "Garden View", "Wine Cellar Access"],
          imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3",
          isActive: true
        }
      ];
      diningSpaces.forEach(space => this.createSpace(space));
    }

    // Update package applicableSpaceIds to match spaces
    const spaceIds = Array.from(this.spaces.keys());
    this.packages.forEach(pkg => {
      pkg.applicableSpaceIds = spaceIds; // Make packages available for all spaces
    });

    // Initialize sample bookings with simplified approach
    this.initializeSampleData();
    
    // Migrate existing users to have proper permissions
    this.migrateUserPermissions();
    
    console.log('Storage initialized with', this.companies.size, 'companies,', this.customers.size, 'customers, and', this.users.size, 'users');
  }

  private initializeSampleData() {
    const venues = Array.from(this.venues.values());
    const spaces = Array.from(this.spaces.values());

    // Create demo tenant first
    if (this.tenants.size === 0) {
      const demoTenant: Tenant = {
        id: randomUUID(),
        name: "Demo Venue",
        slug: "demo",
        customDomain: null,
        subscriptionPackageId: null,
        subscriptionStatus: "trial",
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        isActive: true,
        monthlyBookings: 0,
        lastBillingDate: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.tenants.set(demoTenant.id, demoTenant);

      // Create demo users for this tenant with pre-hashed passwords
      // demo123 hashed
      const demoUser: User = {
        id: randomUUID(),
        name: "Demo User",
        email: "demo@venue.com",
        password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // demo123
        role: "tenant_admin",
        tenantId: demoTenant.id,
        isActive: true,
        stripeAccountId: null,
        stripeAccountStatus: null,
        stripeOnboardingCompleted: false,
        stripeChargesEnabled: false,
        stripePayoutsEnabled: false,
        stripeConnectedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.users.set(demoUser.id, demoUser);

      // manager123 hashed  
      const demoManager: User = {
        id: randomUUID(),
        name: "Venue Manager",
        email: "manager@venue.com",
        password: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy", // manager123
        role: "tenant_user",
        tenantId: demoTenant.id,
        isActive: true,
        stripeAccountId: null,
        stripeAccountStatus: null,
        stripeOnboardingCompleted: false,
        stripeChargesEnabled: false,
        stripePayoutsEnabled: false,
        stripeConnectedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.users.set(demoManager.id, demoManager);
    }

    // Get the demo tenant ID for sample data
    const demoTenantId = Array.from(this.tenants.values())[0]?.id;

    // No sample customers - tenants create their own data

    // No sample bookings - tenants create their own data
  }

  private initializeSamplePackagesAndServices() {
    // Sample services for testing
    const sampleServices = [
      {
        id: randomUUID(),
        name: "Premium Catering",
        description: "Full-service catering with appetizers, main course, and dessert",
        price: "45.00",
        category: "catering",
        pricingModel: "per_person" as const,
        enabledTaxIds: [],
        enabledFeeIds: [],
        isActive: true,
        createdAt: new Date()
      },
      {
        id: randomUUID(),
        name: "Audio/Visual Setup", 
        description: "Professional sound system, microphones, and projection equipment",
        price: "500.00",
        category: "equipment",
        pricingModel: "fixed" as const,
        enabledTaxIds: [],
        enabledFeeIds: [],
        isActive: true,
        createdAt: new Date()
      },
      {
        id: randomUUID(),
        name: "Floral Arrangements",
        description: "Custom centerpieces and decorative florals",
        price: "150.00", 
        category: "decoration",
        pricingModel: "fixed" as const,
        enabledTaxIds: [],
        enabledFeeIds: [],
        isActive: true,
        createdAt: new Date()
      },
      {
        id: randomUUID(),
        name: "Photography Services",
        description: "Professional event photography with edited photos",
        price: "800.00",
        category: "entertainment",
        pricingModel: "fixed" as const,
        enabledTaxIds: [],
        enabledFeeIds: [],
        isActive: true,
        createdAt: new Date()
      },
      {
        id: randomUUID(),
        name: "Live DJ Entertainment",
        description: "Professional DJ with music and lighting",
        price: "600.00",
        category: "entertainment", 
        pricingModel: "fixed" as const,
        enabledTaxIds: [],
        enabledFeeIds: [],
        isActive: true,
        createdAt: new Date()
      },
      {
        id: randomUUID(),
        name: "Bar Service",
        description: "Full bar service with bartender and premium drinks",
        price: "25.00",
        category: "catering",
        pricingModel: "per_person" as const,
        enabledTaxIds: [],
        enabledFeeIds: [],
        isActive: true,
        createdAt: new Date()
      }
    ];

    // Sample packages for testing
    const serviceIds = sampleServices.map(s => s.id);
    const samplePackages = [
      {
        id: randomUUID(),
        name: "Corporate Essential",
        description: "Perfect for business meetings and corporate events",
        category: "corporate",
        price: "2500.00",
        pricingModel: "fixed" as const,
        includedServiceIds: [serviceIds[1]], // Audio/Visual Setup
        applicableSpaceIds: [],
        enabledTaxIds: [],
        enabledFeeIds: [],
        isActive: true,
        createdAt: new Date()
      },
      {
        id: randomUUID(), 
        name: "Wedding Premium",
        description: "Complete wedding package with catering, entertainment, and decor",
        category: "wedding",
        price: "85.00",
        pricingModel: "per_person" as const,
        includedServiceIds: [serviceIds[0], serviceIds[2], serviceIds[3], serviceIds[4]], // Catering, Florals, Photography, DJ
        applicableSpaceIds: [],
        enabledTaxIds: [],
        enabledFeeIds: [],
        isActive: true,
        createdAt: new Date()
      },
      {
        id: randomUUID(),
        name: "Cocktail Party",
        description: "Elegant cocktail reception with bar and light catering",
        category: "social",
        price: "55.00",
        pricingModel: "per_person" as const, 
        includedServiceIds: [serviceIds[5], serviceIds[2]], // Bar Service, Florals
        applicableSpaceIds: [],
        enabledTaxIds: [],
        enabledFeeIds: [],
        isActive: true,
        createdAt: new Date()
      }
    ];

    sampleServices.forEach(svc => this.services.set(svc.id, svc));
    samplePackages.forEach(pkg => this.packages.set(pkg.id, pkg));
  }

  private initializeSampleSetupStyles() {
    const sampleSetupStyles = [
      {
        id: randomUUID(),
        name: "Round Tables",
        description: "Traditional round tables for dining and socializing",
        iconName: "Circle",
        category: "dining",
        minCapacity: 50,
        maxCapacity: 200,
        floorPlan: {
          objects: [
            { id: "rt1", type: "table", x: 200, y: 150, width: 60, height: 60, rotation: 0, color: "#8B4513", seats: 8, label: "Table 1" },
            { id: "rt2", type: "table", x: 350, y: 150, width: 60, height: 60, rotation: 0, color: "#8B4513", seats: 8, label: "Table 2" },
            { id: "rt3", type: "table", x: 500, y: 150, width: 60, height: 60, rotation: 0, color: "#8B4513", seats: 8, label: "Table 3" },
            { id: "rt4", type: "table", x: 275, y: 300, width: 60, height: 60, rotation: 0, color: "#8B4513", seats: 8, label: "Table 4" },
            { id: "rt5", type: "table", x: 425, y: 300, width: 60, height: 60, rotation: 0, color: "#8B4513", seats: 8, label: "Table 5" },
            { id: "stage", type: "stage", x: 300, y: 50, width: 200, height: 80, rotation: 0, color: "#4169E1", label: "Main Stage" },
            { id: "bar", type: "bar", x: 100, y: 500, width: 120, height: 40, rotation: 0, color: "#800000", label: "Bar" }
          ],
          canvasSize: { width: 800, height: 600 },
          totalSeats: 40
        },
        isActive: true,
        createdAt: new Date()
      },
      {
        id: randomUUID(),
        name: "Theater Style",
        description: "Rows of chairs facing the presentation area",
        iconName: "Presentation",
        category: "presentation",
        minCapacity: 100,
        maxCapacity: 500,
        floorPlan: {
          objects: [
            { id: "stage", type: "stage", x: 300, y: 50, width: 200, height: 80, rotation: 0, color: "#4169E1", label: "Presentation Stage" },
            // Front row
            { id: "c1", type: "chair", x: 200, y: 200, width: 20, height: 20, rotation: 0, color: "#654321", seats: 1 },
            { id: "c2", type: "chair", x: 230, y: 200, width: 20, height: 20, rotation: 0, color: "#654321", seats: 1 },
            { id: "c3", type: "chair", x: 260, y: 200, width: 20, height: 20, rotation: 0, color: "#654321", seats: 1 },
            { id: "c4", type: "chair", x: 290, y: 200, width: 20, height: 20, rotation: 0, color: "#654321", seats: 1 },
            { id: "c5", type: "chair", x: 320, y: 200, width: 20, height: 20, rotation: 0, color: "#654321", seats: 1 },
            { id: "c6", type: "chair", x: 350, y: 200, width: 20, height: 20, rotation: 0, color: "#654321", seats: 1 },
            { id: "c7", type: "chair", x: 380, y: 200, width: 20, height: 20, rotation: 0, color: "#654321", seats: 1 },
            { id: "c8", type: "chair", x: 410, y: 200, width: 20, height: 20, rotation: 0, color: "#654321", seats: 1 },
            // Second row
            { id: "c9", type: "chair", x: 200, y: 230, width: 20, height: 20, rotation: 0, color: "#654321", seats: 1 },
            { id: "c10", type: "chair", x: 230, y: 230, width: 20, height: 20, rotation: 0, color: "#654321", seats: 1 },
            { id: "c11", type: "chair", x: 260, y: 230, width: 20, height: 20, rotation: 0, color: "#654321", seats: 1 },
            { id: "c12", type: "chair", x: 290, y: 230, width: 20, height: 20, rotation: 0, color: "#654321", seats: 1 },
            { id: "c13", type: "chair", x: 320, y: 230, width: 20, height: 20, rotation: 0, color: "#654321", seats: 1 },
            { id: "c14", type: "chair", x: 350, y: 230, width: 20, height: 20, rotation: 0, color: "#654321", seats: 1 },
            { id: "c15", type: "chair", x: 380, y: 230, width: 20, height: 20, rotation: 0, color: "#654321", seats: 1 },
            { id: "c16", type: "chair", x: 410, y: 230, width: 20, height: 20, rotation: 0, color: "#654321", seats: 1 }
          ],
          canvasSize: { width: 800, height: 600 },
          totalSeats: 16
        },
        isActive: true,
        createdAt: new Date()
      },
      {
        id: randomUUID(),
        name: "U-Shape Conference",
        description: "U-shaped table arrangement for meetings",
        iconName: "Users",
        category: "meeting",
        minCapacity: 15,
        maxCapacity: 50,
        floorPlan: {
          objects: [
            // U-shape tables
            { id: "ut1", type: "table", x: 200, y: 200, width: 80, height: 40, rotation: 0, color: "#8B4513", seats: 6, label: "Left Table" },
            { id: "ut2", type: "table", x: 300, y: 320, width: 200, height: 40, rotation: 0, color: "#8B4513", seats: 8, label: "Center Table" },
            { id: "ut3", type: "table", x: 520, y: 200, width: 80, height: 40, rotation: 0, color: "#8B4513", seats: 6, label: "Right Table" },
            // Presentation area
            { id: "screen", type: "stage", x: 350, y: 100, width: 100, height: 60, rotation: 0, color: "#4169E1", label: "Screen" }
          ],
          canvasSize: { width: 800, height: 600 },
          totalSeats: 20
        },
        isActive: true,
        createdAt: new Date()
      },
      {
        id: randomUUID(),
        name: "Cocktail Reception",
        description: "Standing reception with high-top tables",
        iconName: "Coffee",
        category: "social",
        minCapacity: 30,
        maxCapacity: 150,
        floorPlan: {
          objects: [
            { id: "ht1", type: "table", x: 200, y: 180, width: 40, height: 40, rotation: 0, color: "#8B4513", seats: 4, label: "High Table 1" },
            { id: "ht2", type: "table", x: 400, y: 180, width: 40, height: 40, rotation: 0, color: "#8B4513", seats: 4, label: "High Table 2" },
            { id: "ht3", type: "table", x: 600, y: 180, width: 40, height: 40, rotation: 0, color: "#8B4513", seats: 4, label: "High Table 3" },
            { id: "ht4", type: "table", x: 300, y: 320, width: 40, height: 40, rotation: 0, color: "#8B4513", seats: 4, label: "High Table 4" },
            { id: "ht5", type: "table", x: 500, y: 320, width: 40, height: 40, rotation: 0, color: "#8B4513", seats: 4, label: "High Table 5" },
            { id: "bar1", type: "bar", x: 150, y: 450, width: 150, height: 40, rotation: 0, color: "#800000", label: "Main Bar" },
            { id: "bar2", type: "bar", x: 500, y: 450, width: 150, height: 40, rotation: 0, color: "#800000", label: "Service Bar" }
          ],
          canvasSize: { width: 800, height: 600 },
          totalSeats: 20
        },
        isActive: true,
        createdAt: new Date()
      },
      {
        id: randomUUID(),
        name: "Classroom Setup",
        description: "Tables and chairs in classroom formation",
        iconName: "Grid3X3",
        category: "meeting",
        minCapacity: 20,
        maxCapacity: 100,
        floorPlan: {
          objects: [
            // Presentation area
            { id: "stage", type: "stage", x: 350, y: 50, width: 100, height: 60, rotation: 0, color: "#4169E1", label: "Presentation Area" },
            // Row 1
            { id: "t1", type: "table", x: 200, y: 180, width: 80, height: 40, rotation: 0, color: "#8B4513", seats: 3, label: "Table 1" },
            { id: "t2", type: "table", x: 320, y: 180, width: 80, height: 40, rotation: 0, color: "#8B4513", seats: 3, label: "Table 2" },
            { id: "t3", type: "table", x: 440, y: 180, width: 80, height: 40, rotation: 0, color: "#8B4513", seats: 3, label: "Table 3" },
            // Row 2
            { id: "t4", type: "table", x: 200, y: 260, width: 80, height: 40, rotation: 0, color: "#8B4513", seats: 3, label: "Table 4" },
            { id: "t5", type: "table", x: 320, y: 260, width: 80, height: 40, rotation: 0, color: "#8B4513", seats: 3, label: "Table 5" },
            { id: "t6", type: "table", x: 440, y: 260, width: 80, height: 40, rotation: 0, color: "#8B4513", seats: 3, label: "Table 6" },
            // Row 3
            { id: "t7", type: "table", x: 200, y: 340, width: 80, height: 40, rotation: 0, color: "#8B4513", seats: 3, label: "Table 7" },
            { id: "t8", type: "table", x: 320, y: 340, width: 80, height: 40, rotation: 0, color: "#8B4513", seats: 3, label: "Table 8" },
            { id: "t9", type: "table", x: 440, y: 340, width: 80, height: 40, rotation: 0, color: "#8B4513", seats: 3, label: "Table 9" }
          ],
          canvasSize: { width: 800, height: 600 },
          totalSeats: 27
        },
        isActive: true,
        createdAt: new Date()
      },
      {
        id: randomUUID(),
        name: "Banquet Style",
        description: "Long rectangular tables for formal dining",
        iconName: "Utensils",
        category: "dining",
        minCapacity: 40,
        maxCapacity: 300,
        floorPlan: {
          objects: [
            // Long banquet tables
            { id: "bt1", type: "table", x: 150, y: 150, width: 200, height: 50, rotation: 0, color: "#8B4513", seats: 12, label: "Banquet Table 1" },
            { id: "bt2", type: "table", x: 150, y: 230, width: 200, height: 50, rotation: 0, color: "#8B4513", seats: 12, label: "Banquet Table 2" },
            { id: "bt3", type: "table", x: 150, y: 310, width: 200, height: 50, rotation: 0, color: "#8B4513", seats: 12, label: "Banquet Table 3" },
            { id: "bt4", type: "table", x: 450, y: 150, width: 200, height: 50, rotation: 0, color: "#8B4513", seats: 12, label: "Banquet Table 4" },
            { id: "bt5", type: "table", x: 450, y: 230, width: 200, height: 50, rotation: 0, color: "#8B4513", seats: 12, label: "Banquet Table 5" },
            { id: "bt6", type: "table", x: 450, y: 310, width: 200, height: 50, rotation: 0, color: "#8B4513", seats: 12, label: "Banquet Table 6" },
            // Head table
            { id: "head", type: "table", x: 300, y: 80, width: 200, height: 50, rotation: 0, color: "#8B4513", seats: 10, label: "Head Table" }
          ],
          canvasSize: { width: 800, height: 600 },
          totalSeats: 82
        },
        isActive: true,
        createdAt: new Date()
      }
    ];

    sampleSetupStyles.forEach(style => this.setupStyles.set(style.id, style));
  }

  private migrateUserPermissions() {
    // Update all users to use the new detailed permission system
    Array.from(this.users.values()).forEach(user => {
      let defaultPermissions: string[] = [];
      
      // Always get the latest permissions for the role
      defaultPermissions = getPermissionsForRole(user.role);

      // Update the user with current permissions (force migration)
      const updatedUser = { ...user, permissions: defaultPermissions };
      this.users.set(user.id, updatedUser);
      console.log(`Migrated permissions for user ${user.name} (${user.role}): ${defaultPermissions.length} permissions`);
    });
  }

  // Users
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUsersByTenant(tenantId: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.tenantId === tenantId);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    
    // Use simple permission system
    const defaultPermissions = getPermissionsForRole(insertUser.role);

    const user: User = { 
      ...insertUser, 
      id,
      role: insertUser.role || "manager",
      permissions: insertUser.permissions || defaultPermissions,
      stripeAccountId: insertUser.stripeAccountId || null,
      stripeAccountStatus: insertUser.stripeAccountStatus || null,
      stripeOnboardingCompleted: insertUser.stripeOnboardingCompleted || false,
      stripeChargesEnabled: insertUser.stripeChargesEnabled || false,
      stripePayoutsEnabled: insertUser.stripePayoutsEnabled || false,
      stripeConnectedAt: insertUser.stripeConnectedAt || null
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const existing = this.users.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updateData };
    this.users.set(id, updated);
    return updated;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  // Venues
  async getVenues(): Promise<Venue[]> {
    const tenantContext = await getCurrentTenantContext();
    const allVenues = Array.from(this.venues.values());
    
    // Use database context if available, otherwise fall back to in-memory context
    const effectiveContext = tenantContext.tenantId 
      ? tenantContext 
      : memStorageTenantContext;
    
    // For super admin, return all venues
    if (effectiveContext.role === 'super_admin') {
      return allVenues;
    }
    
    // For tenant users, filter by tenantId
    if (effectiveContext.tenantId) {
      return allVenues.filter(venue => venue.tenantId === effectiveContext.tenantId);
    }
    
    // If no tenant context, return empty array for security
    return [];
  }

  async getVenue(id: string): Promise<Venue | undefined> {
    return this.venues.get(id);
  }

  async createVenue(insertVenue: InsertVenue): Promise<Venue> {
    console.log('🚨 WARNING: MemStorage.createVenue called instead of DbStorage!', { name: insertVenue.name });
    const id = randomUUID();
    const venue: Venue = { 
      ...insertVenue, 
      id,
      description: insertVenue.description || null,
      pricePerHour: insertVenue.pricePerHour || null,
      amenities: insertVenue.amenities || null,
      imageUrl: insertVenue.imageUrl || null,
      isActive: insertVenue.isActive ?? true
    };
    this.venues.set(id, venue);
    console.log('🚨 Venue stored in MEMORY (not database):', { id, name: venue.name });
    return venue;
  }

  async updateVenue(id: string, venue: Partial<InsertVenue>): Promise<Venue | undefined> {
    const existing = this.venues.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...venue };
    this.venues.set(id, updated);
    return updated;
  }

  // Spaces
  async getSpaces(): Promise<Space[]> {
    const tenantContext = await getCurrentTenantContext();
    const allSpaces = Array.from(this.spaces.values());
    
    // Use database context if available, otherwise fall back to in-memory context
    const effectiveContext = tenantContext.tenantId 
      ? tenantContext 
      : memStorageTenantContext;
    
    // For super admin, return all spaces
    if (effectiveContext.role === 'super_admin') {
      return allSpaces;
    }
    
    // For tenant users, filter by tenantId
    if (effectiveContext.tenantId) {
      return allSpaces.filter(space => space.tenantId === effectiveContext.tenantId);
    }
    
    // If no tenant context, return empty array for security
    return [];
  }

  async getSpace(id: string): Promise<Space | undefined> {
    return this.spaces.get(id);
  }

  async getSpacesByVenue(venueId: string): Promise<Space[]> {
    return Array.from(this.spaces.values()).filter(space => space.venueId === venueId);
  }

  async createSpace(insertSpace: InsertSpace): Promise<Space> {
    const id = randomUUID();
    const space: Space = { 
      ...insertSpace, 
      id,
      description: insertSpace.description || null,
      pricePerHour: insertSpace.pricePerHour || null,
      amenities: insertSpace.amenities || null,
      imageUrl: insertSpace.imageUrl || null,
      isActive: insertSpace.isActive ?? true,
      createdAt: new Date()
    };
    this.spaces.set(id, space);
    return space;
  }

  async updateSpace(id: string, updates: Partial<InsertSpace>): Promise<Space | undefined> {
    const space = this.spaces.get(id);
    if (!space) return undefined;
    
    const updated: Space = { ...space, ...updates };
    this.spaces.set(id, updated);
    return updated;
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    const tenantContext = await getCurrentTenantContext();
    const allCustomers = Array.from(this.customers.values());
    
    // Use database context if available, otherwise fall back to in-memory context
    const effectiveContext = tenantContext.tenantId 
      ? tenantContext 
      : memStorageTenantContext;
    
    // For super admin, return all customers
    if (effectiveContext.role === 'super_admin') {
      return allCustomers;
    }
    
    // For tenant users, filter by tenantId
    if (effectiveContext.tenantId) {
      return allCustomers.filter(customer => customer.tenantId === effectiveContext.tenantId);
    }
    
    // If no tenant context, return empty array for security
    return [];
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async getCustomerByEmail(email: string, tenantId?: string): Promise<Customer | undefined> {
    return Array.from(this.customers.values()).find(customer => 
      customer.email === email
    );
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const id = randomUUID();
    const customer: Customer = { 
      ...insertCustomer, 
      id, 
      createdAt: new Date(),
      notes: insertCustomer.notes || null,
      status: insertCustomer.status || "lead",
      phone: insertCustomer.phone || null,
      companyId: insertCustomer.companyId || null,
      leadScore: insertCustomer.leadScore || 0
    };
    this.customers.set(id, customer);
    return customer;
  }

  async updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const existing = this.customers.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...customer };
    this.customers.set(id, updated);
    return updated;
  }

  async getCustomersByCompany(companyId: string): Promise<Customer[]> {
    return Array.from(this.customers.values()).filter(customer => customer.companyId === companyId);
  }

  // Companies
  async getCompanies(): Promise<Company[]> {
    return Array.from(this.companies.values());
  }

  async getCompany(id: string): Promise<Company | undefined> {
    return this.companies.get(id);
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const id = randomUUID();
    const company: Company = { 
      ...insertCompany, 
      id, 
      createdAt: new Date(),
      updatedAt: new Date(),
      industry: insertCompany.industry || null,
      description: insertCompany.description || null,
      website: insertCompany.website || null,
      address: insertCompany.address || null,
      phone: insertCompany.phone || null,
      email: insertCompany.email || null,
      notes: insertCompany.notes || null,
      isActive: insertCompany.isActive ?? true
    };
    this.companies.set(id, company);
    return company;
  }

  async updateCompany(id: string, company: Partial<InsertCompany>): Promise<Company | undefined> {
    const existing = this.companies.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...company, updatedAt: new Date() };
    this.companies.set(id, updated);
    return updated;
  }

  async deleteCompany(id: string): Promise<boolean> {
    // First check if any customers are associated with this company
    const associatedCustomers = await this.getCustomersByCompany(id);
    if (associatedCustomers.length > 0) {
      // Update customers to remove company association
      for (const customer of associatedCustomers) {
        await this.updateCustomer(customer.id, { companyId: null, customerType: "individual" });
      }
    }
    return this.companies.delete(id);
  }

  // Contracts
  async getContracts(): Promise<Contract[]> {
    return Array.from(this.contracts.values());
  }

  async getContract(id: string): Promise<Contract | undefined> {
    return this.contracts.get(id);
  }

  async getContractsByCustomer(customerId: string): Promise<Contract[]> {
    return Array.from(this.contracts.values()).filter(contract => contract.customerId === customerId);
  }

  async createContract(insertContract: InsertContract): Promise<Contract> {
    const id = randomUUID();
    const contract: Contract = { 
      ...insertContract, 
      id, 
      createdAt: new Date(),
      updatedAt: new Date(),
      status: insertContract.status || "draft",
      totalAmount: insertContract.totalAmount || null
    };
    this.contracts.set(id, contract);
    return contract;
  }

  async updateContract(id: string, contract: Partial<InsertContract>): Promise<Contract | undefined> {
    const existing = this.contracts.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...contract, updatedAt: new Date() };
    this.contracts.set(id, updated);
    return updated;
  }

  async deleteContract(id: string): Promise<boolean> {
    return this.contracts.delete(id);
  }

  // Bookings
  async getBookings(): Promise<Booking[]> {
    const tenantContext = await getCurrentTenantContext();
    const allBookings = Array.from(this.bookings.values());
    
    // Use database context if available, otherwise fall back to in-memory context
    const effectiveContext = tenantContext.tenantId 
      ? tenantContext 
      : memStorageTenantContext;
    
    // For super admin, return all bookings
    if (effectiveContext.role === 'super_admin') {
      return allBookings;
    }
    
    // For tenant users, filter by tenantId
    if (effectiveContext.tenantId) {
      return allBookings.filter(booking => booking.tenantId === effectiveContext.tenantId);
    }
    
    // If no tenant context, return empty array for security
    return [];
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }

  async getBookingsByCustomer(customerId: string): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(booking => booking.customerId === customerId);
  }

  async getBookingsByContract(contractId: string): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(booking => booking.contractId === contractId);
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const id = randomUUID();
    const booking: Booking = { 
      ...insertBooking, 
      id, 
      createdAt: new Date(),
      contractId: insertBooking.contractId || null,
      customerId: insertBooking.customerId || null,
      venueId: insertBooking.venueId || null,
      totalAmount: insertBooking.totalAmount || null,
      depositAmount: insertBooking.depositAmount || null,
      depositPaid: insertBooking.depositPaid ?? false,
      notes: insertBooking.notes || null
    };
    this.bookings.set(id, booking);
    return booking;
  }

  async updateBooking(id: string, booking: Partial<InsertBooking>): Promise<Booking | undefined> {
    const existing = this.bookings.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...booking };
    this.bookings.set(id, updated);
    return updated;
  }

  async createMultipleBookings(bookings: InsertBooking[], contractId: string): Promise<Booking[]> {
    console.log(`🔧 createMultipleBookings called with ${bookings.length} bookings:`, bookings.map(b => ({
      eventName: b.eventName,
      eventDate: b.eventDate,
      startTime: b.startTime,
      endTime: b.endTime
    })));
    
    const createdBookings: Booking[] = [];
    for (let i = 0; i < bookings.length; i++) {
      const insertBooking = bookings[i];
      console.log(`🔧 Creating booking ${i + 1}/${bookings.length}:`, {
        eventName: insertBooking.eventName,
        eventDate: insertBooking.eventDate,
        startTime: insertBooking.startTime,
        endTime: insertBooking.endTime
      });
      
      try {
        const booking = await this.createBooking({ ...insertBooking, contractId });
        createdBookings.push(booking);
        console.log(`✅ Successfully created booking ${i + 1}: ${booking.id}`);
      } catch (error) {
        console.error(`❌ Failed to create booking ${i + 1}:`, error);
        throw error; // Re-throw to fail the entire contract creation
      }
    }
    
    console.log(`🔧 createMultipleBookings completed. Created ${createdBookings.length} bookings`);
    return createdBookings;
  }

  // Proposals
  async getProposals(): Promise<Proposal[]> {
    return Array.from(this.proposals.values());
  }

  async getProposal(id: string): Promise<Proposal | undefined> {
    return this.proposals.get(id);
  }

  async getProposalsByCustomer(customerId: string): Promise<Proposal[]> {
    return Array.from(this.proposals.values()).filter(proposal => proposal.customerId === customerId);
  }

  async createProposal(insertProposal: InsertProposal): Promise<Proposal> {
    const id = randomUUID();
    const proposal: Proposal = { 
      ...insertProposal, 
      id, 
      createdAt: new Date(),
      sentAt: null,
      viewedAt: null,
      customerId: insertProposal.customerId || null,
      bookingId: insertProposal.bookingId || null,
      status: insertProposal.status || "draft",
      totalAmount: insertProposal.totalAmount || null,
      validUntil: insertProposal.validUntil || null
    };
    this.proposals.set(id, proposal);
    return proposal;
  }

  async updateProposal(id: string, proposal: Partial<InsertProposal>): Promise<Proposal | undefined> {
    const existing = this.proposals.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...proposal };
    this.proposals.set(id, updated);
    return updated;
  }

  // Payments
  async getPayments(): Promise<Payment[]> {
    return Array.from(this.payments.values());
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    return this.payments.get(id);
  }

  async getPaymentsByBooking(bookingId: string): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(payment => payment.bookingId === bookingId);
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const id = randomUUID();
    const payment: Payment = { 
      ...insertPayment, 
      id, 
      createdAt: new Date(),
      processedAt: null,
      status: insertPayment.status || "pending",
      bookingId: insertPayment.bookingId || null,
      transactionId: insertPayment.transactionId || null
    };
    this.payments.set(id, payment);
    return payment;
  }

  async updatePayment(id: string, payment: Partial<InsertPayment>): Promise<Payment | undefined> {
    const existing = this.payments.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...payment };
    this.payments.set(id, updated);
    return updated;
  }

  // Tasks
  async getTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async getTask(id: string): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async getTasksByUser(userId: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => task.assignedTo === userId);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = randomUUID();
    const task: Task = { 
      ...insertTask, 
      id, 
      createdAt: new Date(),
      status: insertTask.status || "pending",
      priority: insertTask.priority || "medium",
      description: insertTask.description || null,
      assignedTo: insertTask.assignedTo || null,
      bookingId: insertTask.bookingId || null,
      dueDate: insertTask.dueDate || null
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined> {
    const existing = this.tasks.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...task };
    this.tasks.set(id, updated);
    return updated;
  }

  // AI Insights
  async getAiInsights(): Promise<AiInsight[]> {
    return Array.from(this.aiInsights.values());
  }

  async getActiveAiInsights(): Promise<AiInsight[]> {
    return Array.from(this.aiInsights.values()).filter(insight => insight.isActive);
  }

  async createAiInsight(insertAiInsight: InsertAiInsight): Promise<AiInsight> {
    const id = randomUUID();
    const insight: AiInsight = { 
      ...insertAiInsight, 
      id, 
      createdAt: new Date(),
      priority: insertAiInsight.priority || "medium",
      isActive: insertAiInsight.isActive ?? true,
      data: insertAiInsight.data || null
    };
    this.aiInsights.set(id, insight);
    return insight;
  }

  // Packages & Services  
  async getPackages(): Promise<Package[]> {
    const allPackages = Array.from(this.packages.values());
    
    // Apply tenant filtering based on context
    if (memStorageTenantContext.role === 'super_admin') {
      return allPackages; // Super admin sees all packages
    }
    
    if (memStorageTenantContext.tenantId) {
      return allPackages.filter(pkg => pkg.tenantId === memStorageTenantContext.tenantId);
    }
    
    return []; // No tenant context = no access
  }

  async getPackage(id: string): Promise<Package | undefined> {
    const pkg = this.packages.get(id);
    if (!pkg) return undefined;
    
    // Apply tenant filtering based on context
    if (memStorageTenantContext.role === 'super_admin') {
      return pkg; // Super admin sees all packages
    }
    
    if (memStorageTenantContext.tenantId && pkg.tenantId === memStorageTenantContext.tenantId) {
      return pkg;
    }
    
    return undefined; // Package doesn't belong to current tenant
  }

  async createPackage(insertPackage: InsertPackage): Promise<Package> {
    const id = randomUUID();
    const pkg: Package = { 
      ...insertPackage, 
      id, 
      createdAt: new Date(),
      description: insertPackage.description || null,
      applicableSpaceIds: insertPackage.applicableSpaceIds || null,
      includedServiceIds: insertPackage.includedServiceIds || null,
      isActive: insertPackage.isActive ?? true
    };
    this.packages.set(id, pkg);
    return pkg;
  }

  async updatePackage(id: string, updates: Partial<InsertPackage>): Promise<Package | undefined> {
    const pkg = this.packages.get(id);
    if (!pkg) return undefined;
    
    const updated: Package = { ...pkg, ...updates };
    this.packages.set(id, updated);
    return updated;
  }

  async getServices(): Promise<Service[]> {
    const allServices = Array.from(this.services.values());
    
    // Apply tenant filtering based on context
    if (memStorageTenantContext.role === 'super_admin') {
      return allServices; // Super admin sees all services
    }
    
    if (memStorageTenantContext.tenantId) {
      return allServices.filter(service => service.tenantId === memStorageTenantContext.tenantId);
    }
    
    return []; // No tenant context = no access
  }

  async getService(id: string): Promise<Service | undefined> {
    const service = this.services.get(id);
    if (!service) return undefined;
    
    // Apply tenant filtering based on context
    if (memStorageTenantContext.role === 'super_admin') {
      return service; // Super admin sees all services
    }
    
    if (memStorageTenantContext.tenantId && service.tenantId === memStorageTenantContext.tenantId) {
      return service;
    }
    
    return undefined; // Service doesn't belong to current tenant
  }

  async createService(insertService: InsertService): Promise<Service> {
    const id = randomUUID();
    const service: Service = { 
      ...insertService, 
      id, 
      createdAt: new Date(),
      description: insertService.description || null,
      isActive: insertService.isActive ?? true
    };
    this.services.set(id, service);
    return service;
  }

  async updateService(id: string, updates: Partial<InsertService>): Promise<Service | undefined> {
    const service = this.services.get(id);
    if (!service) return undefined;
    
    const updated: Service = { ...service, ...updates };
    this.services.set(id, updated);
    return updated;
  }

  // Delete operations
  async deleteCustomer(id: string): Promise<boolean> {
    return this.customers.delete(id);
  }

  async deleteVenue(id: string): Promise<boolean> {
    return this.venues.delete(id);
  }

  async deleteSpace(id: string): Promise<boolean> {
    return this.spaces.delete(id);
  }

  async deleteBooking(id: string): Promise<boolean> {
    return this.bookings.delete(id);
  }

  async deletePackage(id: string): Promise<boolean> {
    return this.packages.delete(id);
  }

  async deleteService(id: string): Promise<boolean> {
    return this.services.delete(id);
  }




  // Tax Settings methods
  async getTaxSettings(): Promise<TaxSetting[]> {
    return Array.from(this.taxSettings.values());
  }

  async getTaxSetting(id: string): Promise<TaxSetting | undefined> {
    return this.taxSettings.get(id);
  }

  async createTaxSetting(taxSetting: InsertTaxSetting): Promise<TaxSetting> {
    const newTaxSetting: TaxSetting = {
      id: randomUUID(),
      ...taxSetting,
      createdAt: new Date(),
    };
    this.taxSettings.set(newTaxSetting.id, newTaxSetting);
    return newTaxSetting;
  }

  async updateTaxSetting(id: string, taxSetting: Partial<InsertTaxSetting>): Promise<TaxSetting | undefined> {
    const existing = this.taxSettings.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...taxSetting };
    this.taxSettings.set(id, updated);
    return updated;
  }

  async deleteTaxSetting(id: string): Promise<boolean> {
    return this.taxSettings.delete(id);
  }

  // Proposal methods


  async deleteProposal(id: string): Promise<boolean> {
    return this.proposals.delete(id);
  }

  // Communication methods
  async getCommunications(bookingId?: string): Promise<Communication[]> {
    const allComms = Array.from(this.communications.values());
    if (bookingId) {
      return allComms.filter(comm => (comm as any).bookingId === bookingId);
    }
    return allComms;
  }

  async getCommunication(id: string): Promise<Communication | undefined> {
    return this.communications.get(id);
  }

  async getCommunicationsByProposal(proposalId: string): Promise<Communication[]> {
    return Array.from(this.communications.values()).filter(c => (c as any).proposalId === proposalId);
  }

  async getCommunicationsByCustomer(customerId: string): Promise<Communication[]> {
    return Array.from(this.communications.values()).filter(c => c.customerId === customerId);
  }

  async getCommunicationByMessageId(messageId: string): Promise<Communication | undefined> {
    return Array.from(this.communications.values()).find(c => (c as any).emailMessageId === messageId);
  }

  async createCommunication(communication: InsertCommunication): Promise<Communication> {
    const newCommunication: Communication = {
      id: randomUUID(),
      bookingId: communication.bookingId || null,
      customerId: communication.customerId || null,
      proposalId: (communication as any).proposalId || null,
      type: communication.type,
      direction: communication.direction,
      subject: communication.subject || null,
      message: communication.message,
      sender: (communication as any).sender || null,
      recipient: (communication as any).recipient || null,
      emailMessageId: (communication as any).emailMessageId || null,
      sentAt: (communication as any).sentAt || new Date(),
      readAt: communication.readAt || null,
      status: communication.status || "sent"
    };
    this.communications.set(newCommunication.id, newCommunication);
    return newCommunication;
  }

  async updateCommunication(id: string, communication: Partial<InsertCommunication>): Promise<Communication | undefined> {
    const existing = this.communications.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...communication };
    this.communications.set(id, updated);
    return updated;
  }

  // Settings methods
  async getSettings(): Promise<Setting[]> {
    return Array.from(this.settings.values());
  }

  async getSetting(key: string): Promise<Setting | undefined> {
    return Array.from(this.settings.values()).find(s => s.key === key);
  }

  async createSetting(setting: InsertSetting): Promise<Setting> {
    const newSetting: Setting = {
      id: randomUUID(),
      ...setting,
      updatedAt: new Date(),
    };
    this.settings.set(newSetting.id, newSetting);
    return newSetting;
  }

  async updateSetting(key: string, value: any): Promise<Setting | undefined> {
    const existing = Array.from(this.settings.values()).find(s => s.key === key);
    if (existing) {
      const updated = { ...existing, value, updatedAt: new Date() };
      this.settings.set(existing.id, updated);
      return updated;
    } else {
      // Create new setting if it doesn't exist
      return this.createSetting({ key, value });
    }
  }

  // Setup Styles methods
  async getSetupStyles(): Promise<SetupStyle[]> {
    return Array.from(this.setupStyles.values());
  }

  async getSetupStyle(id: string): Promise<SetupStyle | undefined> {
    return this.setupStyles.get(id);
  }

  async createSetupStyle(setupStyle: InsertSetupStyle): Promise<SetupStyle> {
    const newSetupStyle: SetupStyle = {
      id: randomUUID(),
      ...setupStyle,
      createdAt: new Date(),
      isActive: setupStyle.isActive ?? true,
      description: setupStyle.description || null,
      iconName: setupStyle.iconName || null,
      minCapacity: setupStyle.minCapacity || null,
      maxCapacity: setupStyle.maxCapacity || null
    };
    this.setupStyles.set(newSetupStyle.id, newSetupStyle);
    return newSetupStyle;
  }

  async updateSetupStyle(id: string, setupStyle: Partial<InsertSetupStyle>): Promise<SetupStyle | undefined> {
    const existing = this.setupStyles.get(id);
    if (!existing) return undefined;
    
    // Deep clone the existing setup style to avoid reference sharing
    const updated = { 
      ...existing, 
      ...setupStyle,
      // If floorPlan is being updated, ensure it's a deep clone
      floorPlan: setupStyle.floorPlan ? JSON.parse(JSON.stringify(setupStyle.floorPlan)) : existing.floorPlan
    };
    this.setupStyles.set(id, updated);
    return updated;
  }

  async deleteSetupStyle(id: string): Promise<boolean> {
    return this.setupStyles.delete(id);
  }

  // Initialize lead management sample data
  private initializeLeadManagementData() {
    // Sample campaign sources
    const websiteSource: CampaignSource = {
      id: randomUUID(),
      name: "Website Organic",
      slug: "website-organic",
      isActive: true,
      createdAt: new Date()
    };
    const googleAdsSource: CampaignSource = {
      id: randomUUID(),
      name: "Google Ads",
      slug: "google-ads",
      isActive: true,
      createdAt: new Date()
    };
    const socialMediaSource: CampaignSource = {
      id: randomUUID(),
      name: "Social Media",
      slug: "social-media",
      isActive: true,
      createdAt: new Date()
    };

    this.campaignSources.set(websiteSource.id, websiteSource);
    this.campaignSources.set(googleAdsSource.id, googleAdsSource);
    this.campaignSources.set(socialMediaSource.id, socialMediaSource);

    // Sample tags
    const hotLeadTag: Tag = {
      id: randomUUID(),
      name: "Hot Lead",
      color: "#ef4444",
      createdAt: new Date()
    };
    const corporateTag: Tag = {
      id: randomUUID(),
      name: "Corporate",
      color: "#3b82f6",
      createdAt: new Date()
    };
    const weddingTag: Tag = {
      id: randomUUID(),
      name: "Wedding",
      color: "#ec4899",
      createdAt: new Date()
    };

    this.tags.set(hotLeadTag.id, hotLeadTag);
    this.tags.set(corporateTag.id, corporateTag);
    this.tags.set(weddingTag.id, weddingTag);

    // No sample leads - tenants create their own data
  }

  // Campaign Sources implementation
  async getCampaignSources(): Promise<CampaignSource[]> {
    return Array.from(this.campaignSources.values());
  }

  async createCampaignSource(source: InsertCampaignSource): Promise<CampaignSource> {
    const newSource: CampaignSource = {
      id: randomUUID(),
      ...source,
      createdAt: new Date(),
    };
    this.campaignSources.set(newSource.id, newSource);
    return newSource;
  }

  async updateCampaignSource(id: string, source: Partial<InsertCampaignSource>): Promise<CampaignSource | undefined> {
    const existing = this.campaignSources.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...source };
    this.campaignSources.set(id, updated);
    return updated;
  }

  // Tags implementation
  async getTags(): Promise<Tag[]> {
    return Array.from(this.tags.values());
  }

  async createTag(tag: InsertTag): Promise<Tag> {
    const newTag: Tag = {
      id: randomUUID(),
      ...tag,
      createdAt: new Date(),
    };
    this.tags.set(newTag.id, newTag);
    return newTag;
  }

  async updateTag(id: string, tag: Partial<InsertTag>): Promise<Tag | undefined> {
    const existing = this.tags.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...tag };
    this.tags.set(id, updated);
    return updated;
  }

  async deleteTag(id: string): Promise<boolean> {
    // Remove all lead-tag associations for this tag
    const toRemove = Array.from(this.leadTags).filter(combo => combo.endsWith(`:${id}`));
    toRemove.forEach(combo => this.leadTags.delete(combo));
    
    return this.tags.delete(id);
  }

  // Leads implementation
  async getLeads(filters?: { status?: string; source?: string; q?: string }): Promise<Lead[]> {
    let leads = Array.from(this.leads.values());
    
    if (filters?.status) {
      leads = leads.filter(lead => lead.status === filters.status);
    }
    
    if (filters?.source) {
      leads = leads.filter(lead => lead.sourceId === filters.source);
    }
    
    if (filters?.q) {
      const query = filters.q.toLowerCase();
      leads = leads.filter(lead => 
        lead.firstName.toLowerCase().includes(query) ||
        lead.lastName.toLowerCase().includes(query) ||
        lead.email.toLowerCase().includes(query) ||
        lead.eventType.toLowerCase().includes(query) ||
        (lead.notes && lead.notes.toLowerCase().includes(query))
      );
    }
    
    return leads.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getLead(id: string): Promise<Lead | undefined> {
    return this.leads.get(id);
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const newLead: Lead = {
      id: randomUUID(),
      ...lead,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.leads.set(newLead.id, newLead);
    return newLead;
  }

  async updateLead(id: string, lead: Partial<InsertLead>): Promise<Lead | undefined> {
    const existing = this.leads.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...lead, updatedAt: new Date() };
    this.leads.set(id, updated);
    return updated;
  }

  async deleteLead(id: string): Promise<boolean> {
    // Remove all activities, tasks, and tag associations for this lead
    const activitiesToRemove = Array.from(this.leadActivities.values()).filter(a => a.leadId === id);
    activitiesToRemove.forEach(activity => this.leadActivities.delete(activity.id));
    
    const tasksToRemove = Array.from(this.leadTasks.values()).filter(t => t.leadId === id);
    tasksToRemove.forEach(task => this.leadTasks.delete(task.id));
    
    const tagsToRemove = Array.from(this.leadTags).filter(combo => combo.startsWith(`${id}:`));
    tagsToRemove.forEach(combo => this.leadTags.delete(combo));
    
    return this.leads.delete(id);
  }

  // Lead Activities implementation
  async getLeadActivities(leadId: string): Promise<LeadActivity[]> {
    return Array.from(this.leadActivities.values())
      .filter(activity => activity.leadId === leadId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createLeadActivity(activity: InsertLeadActivity): Promise<LeadActivity> {
    const newActivity: LeadActivity = {
      id: randomUUID(),
      ...activity,
      createdAt: new Date(),
    };
    this.leadActivities.set(newActivity.id, newActivity);
    return newActivity;
  }

  // Lead Tasks implementation
  async getLeadTasks(filters?: { assignee?: string; due?: string }): Promise<LeadTask[]> {
    let tasks = Array.from(this.leadTasks.values());
    
    if (filters?.assignee) {
      tasks = tasks.filter(task => task.assignedTo === filters.assignee);
    }
    
    if (filters?.due) {
      const dueDate = new Date(filters.due);
      tasks = tasks.filter(task => 
        task.dueAt && task.dueAt.toDateString() === dueDate.toDateString()
      );
    }
    
    return tasks.sort((a, b) => {
      if (!a.dueAt && !b.dueAt) return 0;
      if (!a.dueAt) return 1;
      if (!b.dueAt) return -1;
      return a.dueAt.getTime() - b.dueAt.getTime();
    });
  }

  async createLeadTask(task: InsertLeadTask): Promise<LeadTask> {
    const newTask: LeadTask = {
      id: randomUUID(),
      ...task,
      createdAt: new Date(),
    };
    this.leadTasks.set(newTask.id, newTask);
    return newTask;
  }

  async updateLeadTask(id: string, task: Partial<InsertLeadTask>): Promise<LeadTask | undefined> {
    const existing = this.leadTasks.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...task };
    this.leadTasks.set(id, updated);
    return updated;
  }

  // Tours implementation
  async getTours(): Promise<Tour[]> {
    return Array.from(this.tours.values()).sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
  }

  async getTour(id: string): Promise<Tour | undefined> {
    return this.tours.get(id);
  }

  async createTour(tour: InsertTour): Promise<Tour> {
    const newTour: Tour = {
      id: randomUUID(),
      ...tour,
      createdAt: new Date(),
    };
    this.tours.set(newTour.id, newTour);
    return newTour;
  }

  async updateTour(id: string, tour: Partial<InsertTour>): Promise<Tour | undefined> {
    const existing = this.tours.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...tour };
    this.tours.set(id, updated);
    return updated;
  }

  // Lead Tags (many-to-many) implementation
  async getLeadTags(leadId: string): Promise<Tag[]> {
    const tagIds = Array.from(this.leadTags)
      .filter(combo => combo.startsWith(`${leadId}:`))
      .map(combo => combo.split(':')[1]);
    
    return tagIds.map(tagId => this.tags.get(tagId)).filter(Boolean) as Tag[];
  }

  async addLeadTag(leadId: string, tagId: string): Promise<void> {
    this.leadTags.add(`${leadId}:${tagId}`);
  }

  async removeLeadTag(leadId: string, tagId: string): Promise<void> {
    this.leadTags.delete(`${leadId}:${tagId}`);
  }

  // ============================================================================
  // MULTI-TENANT METHODS
  // ============================================================================

  // Subscription Packages
  async getSubscriptionPackages(): Promise<SubscriptionPackage[]> {
    return Array.from(this.subscriptionPackages.values());
  }

  async getSubscriptionPackage(id: string): Promise<SubscriptionPackage | undefined> {
    return this.subscriptionPackages.get(id);
  }

  async createSubscriptionPackage(packageData: InsertSubscriptionPackage): Promise<SubscriptionPackage> {
    const id = randomUUID();
    const subscriptionPackage: SubscriptionPackage = {
      id,
      ...packageData,
      description: packageData.description || null,
      billingInterval: packageData.billingInterval || "monthly",
      trialDays: packageData.trialDays || null,
      maxVenues: packageData.maxVenues || null,
      maxUsers: packageData.maxUsers || null,
      features: packageData.features || [],
      isActive: packageData.isActive ?? null,
      sortOrder: packageData.sortOrder || null,
      createdAt: new Date(),
    };
    this.subscriptionPackages.set(id, subscriptionPackage);
    return subscriptionPackage;
  }

  async updateSubscriptionPackage(id: string, packageData: Partial<InsertSubscriptionPackage>): Promise<SubscriptionPackage | undefined> {
    const existing = this.subscriptionPackages.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...packageData };
    this.subscriptionPackages.set(id, updated);
    return updated;
  }

  async deleteSubscriptionPackage(id: string): Promise<boolean> {
    return this.subscriptionPackages.delete(id);
  }

  // Tenants
  async getTenants(): Promise<Tenant[]> {
    return Array.from(this.tenants.values());
  }

  async getTenant(id: string): Promise<Tenant | undefined> {
    return this.tenants.get(id);
  }

  async getTenantBySlug(slug: string): Promise<Tenant | undefined> {
    return Array.from(this.tenants.values()).find(t => t.slug === slug);
  }

  async createTenant(tenantData: InsertTenant): Promise<Tenant> {
    const id = randomUUID();
    const tenant: Tenant = {
      id,
      ...tenantData,
      slug: tenantData.slug || '',
      customDomain: tenantData.customDomain || null,
      trialEndsAt: tenantData.trialEndsAt || null,
      subscriptionStartedAt: tenantData.subscriptionStartedAt || null,
      subscriptionEndsAt: tenantData.subscriptionEndsAt || null,
      stripeCustomerId: tenantData.stripeCustomerId || null,
      stripeSubscriptionId: tenantData.stripeSubscriptionId || null,
      logoUrl: tenantData.logoUrl || null,
      primaryColor: tenantData.primaryColor || "#3b82f6",
      customCss: tenantData.customCss || null,
      currentUsers: tenantData.currentUsers || 0,
      currentVenues: tenantData.currentVenues || 0,
      monthlyBookings: tenantData.monthlyBookings || 0,
      lastBillingDate: tenantData.lastBillingDate || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.tenants.set(id, tenant);
    return tenant;
  }

  async updateTenant(id: string, tenantData: Partial<InsertTenant>): Promise<Tenant | undefined> {
    const existing = this.tenants.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...tenantData, updatedAt: new Date() };
    this.tenants.set(id, updated);
    return updated;
  }

  async deleteTenant(id: string): Promise<boolean> {
    return this.tenants.delete(id);
  }

  // ============================================================================
  // INITIALIZATION METHODS
  // ============================================================================

  private initializeSubscriptionPackages() {
    // Create sample subscription packages
    const starterPackage: SubscriptionPackage = {
      id: randomUUID(),
      name: "Starter",
      description: "Perfect for small venues getting started",
      price: "29.99",
      billingInterval: "monthly",
      trialDays: 14,
      maxVenues: 1,
      maxUsers: 3,
      features: ["dashboard_analytics", "venue_management", "event_booking", "customer_management", "proposal_system"],
      isActive: true,
      sortOrder: 1,
      createdAt: new Date(),
    };

    const professionalPackage: SubscriptionPackage = {
      id: randomUUID(),
      name: "Professional",
      description: "For growing venue businesses",
      price: "79.99",
      billingInterval: "monthly",
      trialDays: 14,
      maxVenues: 3,
      maxUsers: 10,
      features: ["dashboard_analytics", "venue_management", "event_booking", "customer_management", "proposal_system", "payment_processing", "leads_management", "ai_analytics", "advanced_reports", "task_management"],
      isActive: true,
      sortOrder: 2,
      createdAt: new Date(),
    };

    const enterprisePackage: SubscriptionPackage = {
      id: randomUUID(),
      name: "Enterprise",
      description: "For large venue management companies",
      price: "199.99",
      billingInterval: "monthly",
      trialDays: 30,
      maxVenues: 10,
      maxUsers: 50,
      features: ["dashboard_analytics", "venue_management", "event_booking", "customer_management", "proposal_system", "payment_processing", "leads_management", "ai_analytics", "voice_booking", "floor_plans", "advanced_reports", "task_management", "custom_branding", "api_access", "priority_support", "advanced_integrations", "multi_location", "custom_fields"],
      isActive: true,
      sortOrder: 3,
      createdAt: new Date(),
    };

    this.subscriptionPackages.set(starterPackage.id, starterPackage);
    this.subscriptionPackages.set(professionalPackage.id, professionalPackage);
    this.subscriptionPackages.set(enterprisePackage.id, enterprisePackage);
  }


}

// Database-backed storage implementation with Row-Level Security
export class DbStorage implements IStorage {
  constructor(private db: any) {
    // Database connection will be passed from db.ts
  }

  // Users
  async getUsers(): Promise<User[]> {
    // Get current tenant context for filtering
    const context = await getCurrentTenantContext();
    
    if (context.role === 'super_admin') {
      // Super admin can see all users
      return await this.db.select().from(users);
    } else if (context.tenantId) {
      // Tenant users can only see users from their tenant
      return await this.db.select().from(users).where(eq(users.tenantId, context.tenantId));
    } else {
      // No tenant context - return empty array for security
      console.warn('WARNING: getUsers() called without proper tenant context');
      return [];
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async getUsersByTenant(tenantId: string): Promise<User[]> {
    return await this.db.select().from(users).where(eq(users.tenantId, tenantId));
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Get default permissions for the role if not provided
    const defaultPermissions = getPermissionsForRole(insertUser.role);
    
    const userToInsert = {
      ...insertUser,
      permissions: insertUser.permissions || defaultPermissions
    };
    
    const result = await this.db.insert(users).values(userToInsert).returning();
    return result[0];
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    const result = await this.db.update(users).set(user).where(eq(users.id, id)).returning();
    return result[0];
  }

  // Venues
  async getVenues(): Promise<Venue[]> {
    const context = await getCurrentTenantContext();
    
    if (context.role === 'super_admin') {
      return await this.db.select().from(venues);
    } else if (context.tenantId) {
      return await this.db.select().from(venues).where(eq(venues.tenantId, context.tenantId));
    } else {
      console.warn('WARNING: getVenues() called without proper tenant context, returning all venues for manual filtering');
      // Return all venues so routes can manually filter by tenant - this maintains compatibility
      return await this.db.select().from(venues);
    }
  }

  async getVenue(id: string): Promise<Venue | undefined> {
    const result = await this.db.select().from(venues).where(eq(venues.id, id));
    return result[0];
  }

  async createVenue(venue: InsertVenue): Promise<Venue> {
    try {
      console.log('🏗️ DbStorage.createVenue called:', { name: venue.name, tenantId: venue.tenantId });
      
      // Simple direct insert without complex transactions - they were causing issues
      const insertResult = await this.db.insert(venues).values(venue).returning();
      console.log('💾 Insert result:', { resultLength: insertResult?.length, result: insertResult?.[0] });
      
      if (!insertResult || insertResult.length === 0) {
        throw new Error('Failed to insert venue - no result returned');
      }
      
      const result = insertResult[0];
      console.log('✅ Venue created in DB:', { id: result?.id, name: result?.name });
      
      // Immediate verification with debug
      console.log('🔍 Starting immediate verification for venue ID:', result.id);
      const verifyResult = await this.db.select().from(venues).where(eq(venues.id, result.id));
      console.log('🔍 Immediate verification result:', { 
        found: verifyResult.length > 0, 
        id: verifyResult[0]?.id,
        name: verifyResult[0]?.name,
        queryResult: verifyResult 
      });
      
      // Also count all venues to see total
      const totalCount = await this.db.select().from(venues);
      console.log('📊 Total venues in database after insert:', totalCount.length);
      
      return result;
    } catch (error) {
      console.error('❌ DbStorage.createVenue failed:', error);
      console.error('❌ Venue data that failed:', venue);
      throw error;
    }
  }

  async updateVenue(id: string, venue: Partial<InsertVenue>): Promise<Venue | undefined> {
    const result = await this.db.update(venues).set(venue).where(eq(venues.id, id)).returning();
    return result[0];
  }

  // Spaces
  async getSpaces(): Promise<Space[]> {
    const context = await getCurrentTenantContext();
    
    if (context.role === 'super_admin') {
      return await this.db.select().from(spaces);
    } else if (context.tenantId) {
      // Join with venues to filter spaces by tenant
      return await this.db
        .select({
          id: spaces.id,
          venueId: spaces.venueId,
          name: spaces.name,
          description: spaces.description,
          capacity: spaces.capacity,
          pricePerHour: spaces.pricePerHour,
          amenities: spaces.amenities,
          imageUrl: spaces.imageUrl,
          availableSetupStyles: spaces.availableSetupStyles,
          floorPlan: spaces.floorPlan,
          isActive: spaces.isActive,
          createdAt: spaces.createdAt
        })
        .from(spaces)
        .innerJoin(venues, eq(spaces.venueId, venues.id))
        .where(eq(venues.tenantId, context.tenantId));
    } else {
      console.warn('WARNING: getSpaces() called without proper tenant context');
      return [];
    }
  }

  async getSpace(id: string): Promise<Space | undefined> {
    const context = await getCurrentTenantContext();
    
    if (context.role === 'super_admin') {
      const result = await this.db.select().from(spaces).where(eq(spaces.id, id));
      return result[0];
    } else if (context.tenantId) {
      // Join with venues to filter space by tenant
      const result = await this.db
        .select({
          id: spaces.id,
          venueId: spaces.venueId,
          name: spaces.name,
          description: spaces.description,
          capacity: spaces.capacity,
          pricePerHour: spaces.pricePerHour,
          amenities: spaces.amenities,
          imageUrl: spaces.imageUrl,
          availableSetupStyles: spaces.availableSetupStyles,
          floorPlan: spaces.floorPlan,
          isActive: spaces.isActive,
          createdAt: spaces.createdAt
        })
        .from(spaces)
        .innerJoin(venues, eq(spaces.venueId, venues.id))
        .where(and(eq(spaces.id, id), eq(venues.tenantId, context.tenantId)));
      return result[0];
    } else {
      console.warn('WARNING: getSpace() called without proper tenant context');
      return undefined;
    }
  }

  async getSpacesByVenue(venueId: string): Promise<Space[]> {
    return await this.db.select().from(spaces).where(eq(spaces.venueId, venueId));
  }

  async createSpace(space: InsertSpace): Promise<Space> {
    const result = await this.db.insert(spaces).values(space).returning();
    return result[0];
  }

  async updateSpace(id: string, space: Partial<InsertSpace>): Promise<Space | undefined> {
    const result = await this.db.update(spaces).set(space).where(eq(spaces.id, id)).returning();
    return result[0];
  }

  // Setup Styles
  async getSetupStyles(): Promise<SetupStyle[]> {
    return await this.db.select().from(setupStyles);
  }

  async getSetupStyle(id: string): Promise<SetupStyle | undefined> {
    const result = await this.db.select().from(setupStyles).where(eq(setupStyles.id, id));
    return result[0];
  }

  async createSetupStyle(setupStyle: InsertSetupStyle): Promise<SetupStyle> {
    const result = await this.db.insert(setupStyles).values(setupStyle).returning();
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
    return await this.db.select().from(companies);
  }

  async getCompany(id: string): Promise<Company | undefined> {
    const result = await this.db.select().from(companies).where(eq(companies.id, id));
    return result[0];
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    const result = await this.db.insert(companies).values(company).returning();
    return result[0];
  }

  async updateCompany(id: string, company: Partial<InsertCompany>): Promise<Company | undefined> {
    const result = await this.db.update(companies).set(company).where(eq(companies.id, id)).returning();
    return result[0];
  }

  async deleteCompany(id: string): Promise<boolean> {
    const result = await this.db.delete(companies).where(eq(companies.id, id));
    return result.rowCount > 0;
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    const context = await getCurrentTenantContext();
    
    if (context.role === 'super_admin') {
      return await this.db.select().from(customers);
    } else if (context.tenantId) {
      return await this.db.select().from(customers).where(eq(customers.tenantId, context.tenantId));
    } else {
      console.warn('WARNING: getCustomers() called without proper tenant context');
      return [];
    }
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const result = await this.db.select().from(customers).where(eq(customers.id, id));
    return result[0];
  }

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    const result = await this.db.select().from(customers).where(eq(customers.email, email));
    return result[0];
  }

  async getCustomersByCompany(companyId: string): Promise<Customer[]> {
    return await this.db.select().from(customers).where(eq(customers.companyId, companyId));
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const result = await this.db.insert(customers).values(customer).returning();
    return result[0];
  }

  async updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const result = await this.db.update(customers).set(customer).where(eq(customers.id, id)).returning();
    return result[0];
  }

  // For brevity, I'll add placeholder implementations for remaining methods
  // Each follows the same pattern: use db.select/insert/update/delete with RLS handling filtering
  
  async getContracts(): Promise<Contract[]> {
    const context = await getCurrentTenantContext();
    
    if (context.role === 'super_admin') {
      return await this.db.select().from(contracts);
    } else if (context.tenantId) {
      return await this.db.select().from(contracts).where(eq(contracts.tenantId, context.tenantId));
    } else {
      console.warn('WARNING: getContracts() called without proper tenant context');
      return [];
    }
  }
  async getContract(id: string): Promise<Contract | undefined> { 
    const result = await this.db.select().from(contracts).where(eq(contracts.id, id));
    return result[0];
  }
  async getContractsByCustomer(customerId: string): Promise<Contract[]> { 
    return await this.db.select().from(contracts).where(eq(contracts.customerId, customerId));
  }
  async createContract(contract: InsertContract): Promise<Contract> { 
    const result = await this.db.insert(contracts).values(contract).returning();
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

  async getBookings(): Promise<Booking[]> {
    const context = await getCurrentTenantContext();
    
    if (context.role === 'super_admin') {
      return await this.db.select().from(bookings);
    } else if (context.tenantId) {
      return await this.db.select().from(bookings).where(eq(bookings.tenantId, context.tenantId));
    } else {
      console.warn('WARNING: getBookings() called without proper tenant context');
      return [];
    }
  }
  async getBooking(id: string): Promise<Booking | undefined> { 
    const result = await this.db.select().from(bookings).where(eq(bookings.id, id));
    return result[0];
  }
  async getBookingsByCustomer(customerId: string): Promise<Booking[]> { 
    return await this.db.select().from(bookings).where(eq(bookings.customerId, customerId));
  }
  async getBookingsByContract(contractId: string): Promise<Booking[]> { 
    return await this.db.select().from(bookings).where(eq(bookings.contractId, contractId));
  }
  async createBooking(booking: InsertBooking): Promise<Booking> { 
    const result = await this.db.insert(bookings).values(booking).returning();
    return result[0];
  }
  async updateBooking(id: string, booking: Partial<InsertBooking>): Promise<Booking | undefined> { 
    const result = await this.db.update(bookings).set(booking).where(eq(bookings.id, id)).returning();
    return result[0];
  }
  async createMultipleBookings(bookings: InsertBooking[], contractId: string): Promise<Booking[]> { 
    const result = await this.db.insert(bookings).values(bookings).returning();
    return result;
  }
  async deleteBooking(id: string): Promise<boolean> {
    const result = await this.db.delete(bookings).where(eq(bookings.id, id)).returning();
    return result.length > 0;
  }

  // Continue with other methods following same pattern...
  async getProposals(): Promise<Proposal[]> {
    const context = await getCurrentTenantContext();
    
    if (context.role === 'super_admin') {
      return await this.db.select().from(proposals);
    } else if (context.tenantId) {
      return await this.db.select().from(proposals).where(eq(proposals.tenantId, context.tenantId));
    } else {
      console.warn('WARNING: getProposals() called without proper tenant context');
      return [];
    }
  }
  async getProposal(id: string): Promise<Proposal | undefined> { 
    const result = await this.db.select().from(proposals).where(eq(proposals.id, id));
    return result[0];
  }
  async getProposalsByCustomer(customerId: string): Promise<Proposal[]> { 
    return await this.db.select().from(proposals).where(eq(proposals.customerId, customerId));
  }
  async createProposal(proposal: InsertProposal): Promise<Proposal> { 
    const result = await this.db.insert(proposals).values(proposal).returning();
    return result[0];
  }
  async updateProposal(id: string, proposal: Partial<InsertProposal>): Promise<Proposal | undefined> { 
    const result = await this.db.update(proposals).set(proposal).where(eq(proposals.id, id)).returning();
    return result[0];
  }

  async getPayments(): Promise<Payment[]> {
    const context = await getCurrentTenantContext();
    
    if (context.role === 'super_admin') {
      return await this.db.select().from(payments);
    } else if (context.tenantId) {
      return await this.db.select().from(payments).where(eq(payments.tenantId, context.tenantId));
    } else {
      console.warn('WARNING: getPayments() called without proper tenant context');
      return [];
    }
  }
  async getPayment(id: string): Promise<Payment | undefined> { 
    const result = await this.db.select().from(payments).where(eq(payments.id, id));
    return result[0];
  }
  async getPaymentsByCustomer(customerId: string): Promise<Payment[]> { 
    return await this.db.select().from(payments).where(eq(payments.customerId, customerId));
  }
  async createPayment(payment: InsertPayment): Promise<Payment> { 
    const result = await this.db.insert(payments).values(payment).returning();
    return result[0];
  }
  async updatePayment(id: string, payment: Partial<InsertPayment>): Promise<Payment | undefined> { 
    const result = await this.db.update(payments).set(payment).where(eq(payments.id, id)).returning();
    return result[0];
  }

  async getTasks(): Promise<Task[]> {
    const context = await getCurrentTenantContext();
    
    if (context.role === 'super_admin') {
      return await this.db.select().from(tasks);
    } else if (context.tenantId) {
      return await this.db.select().from(tasks).where(eq(tasks.tenantId, context.tenantId));
    } else {
      console.warn('WARNING: getTasks() called without proper tenant context');
      return [];
    }
  }
  async getTask(id: string): Promise<Task | undefined> { 
    const result = await this.db.select().from(tasks).where(eq(tasks.id, id));
    return result[0];
  }
  async createTask(task: InsertTask): Promise<Task> { 
    const result = await this.db.insert(tasks).values(task).returning();
    return result[0];
  }
  async updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined> { 
    const result = await this.db.update(tasks).set(task).where(eq(tasks.id, id)).returning();
    return result[0];
  }
  async deleteTask(id: string): Promise<boolean> { 
    const result = await this.db.delete(tasks).where(eq(tasks.id, id));
    return result.rowCount > 0;
  }

  async getPackages(): Promise<Package[]> {
    const context = await getCurrentTenantContext();
    
    if (context.role === 'super_admin') {
      return await this.db.select().from(packages);
    } else if (context.tenantId) {
      return await this.db.select().from(packages).where(eq(packages.tenantId, context.tenantId));
    } else {
      console.warn('WARNING: getPackages() called without proper tenant context');
      return [];
    }
  }
  async getPackage(id: string): Promise<Package | undefined> { 
    const result = await this.db.select().from(packages).where(eq(packages.id, id));
    return result[0];
  }
  async createPackage(packageData: InsertPackage): Promise<Package> { 
    const result = await this.db.insert(packages).values(packageData).returning();
    return result[0];
  }
  async updatePackage(id: string, packageData: Partial<InsertPackage>): Promise<Package | undefined> { 
    const result = await this.db.update(packages).set(packageData).where(eq(packages.id, id)).returning();
    return result[0];
  }
  async deletePackage(id: string): Promise<boolean> { 
    const result = await this.db.delete(packages).where(eq(packages.id, id));
    return result.rowCount > 0;
  }

  async getServices(): Promise<Service[]> {
    const context = await getCurrentTenantContext();
    
    if (context.role === 'super_admin') {
      return await this.db.select().from(services);
    } else if (context.tenantId) {
      return await this.db.select().from(services).where(eq(services.tenantId, context.tenantId));
    } else {
      console.warn('WARNING: getServices() called without proper tenant context');
      return [];
    }
  }
  async getService(id: string): Promise<Service | undefined> { 
    const result = await this.db.select().from(services).where(eq(services.id, id));
    return result[0];
  }
  async createService(service: InsertService): Promise<Service> { 
    const result = await this.db.insert(services).values(service).returning();
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

  // Complete implementations for remaining interface methods

  // Settings
  async getSettings(): Promise<any[]> { 
    return await this.db.select().from(settings); 
  }
  async getSetting(id: string): Promise<any> { 
    const result = await this.db.select().from(settings).where(eq(settings.id, id));
    return result[0];
  }
  async createSetting(setting: any): Promise<any> { 
    const result = await this.db.insert(settings).values(setting).returning();
    return result[0];
  }
  async updateSetting(key: string, value: any): Promise<any> { 
    // Get current tenant context to ensure tenant-specific settings
    const context = await getCurrentTenantContext();
    const tenantId = context.tenantId;
    
    if (!tenantId) {
      throw new Error('Tenant context required for settings operations');
    }
    
    // First, try to find existing setting by key and tenant
    const existingResult = await this.db.select().from(settings)
      .where(and(eq(settings.key, key), eq(settings.tenantId, tenantId)));
    
    if (existingResult.length > 0) {
      // Update existing setting
      const result = await this.db.update(settings)
        .set({ value: JSON.stringify(value), updatedAt: new Date() })
        .where(and(eq(settings.key, key), eq(settings.tenantId, tenantId)))
        .returning();
      return result[0];
    } else {
      // Create new setting if it doesn't exist
      const result = await this.db.insert(settings)
        .values({ 
          key, 
          value: JSON.stringify(value), 
          tenantId: tenantId,
          updatedAt: new Date() 
        })
        .returning();
      return result[0];
    }
  }
  async deleteSetting(id: string): Promise<boolean> { 
    const result = await this.db.delete(settings).where(eq(settings.id, id));
    return result.rowCount > 0;
  }

  // Communications
  async getCommunications(): Promise<any[]> { 
    return await this.db.select().from(communications); 
  }
  async getCommunication(id: string): Promise<any> { 
    const result = await this.db.select().from(communications).where(eq(communications.id, id));
    return result[0];
  }
  async createCommunication(communication: any): Promise<any> { 
    const result = await this.db.insert(communications).values(communication).returning();
    return result[0];
  }
  async updateCommunication(id: string, communication: any): Promise<any> { 
    const result = await this.db.update(communications).set(communication).where(eq(communications.id, id)).returning();
    return result[0];
  }

  // Tax Settings
  async getTaxSettings(): Promise<any[]> { 
    const context = await getCurrentTenantContext();
    
    if (context.role === 'super_admin') {
      return await this.db.select().from(taxSettings);
    } else if (context.tenantId) {
      return await this.db.select().from(taxSettings).where(eq(taxSettings.tenantId, context.tenantId));
    } else {
      console.warn('WARNING: getTaxSettings() called without proper tenant context');
      return [];
    }
  }
  async getTaxSetting(id: string): Promise<any> { 
    const context = await getCurrentTenantContext();
    
    if (context.role === 'super_admin') {
      const result = await this.db.select().from(taxSettings).where(eq(taxSettings.id, id));
      return result[0];
    } else if (context.tenantId) {
      const result = await this.db.select().from(taxSettings)
        .where(and(eq(taxSettings.id, id), eq(taxSettings.tenantId, context.tenantId)));
      return result[0];
    } else {
      console.warn('WARNING: getTaxSetting() called without proper tenant context');
      return null;
    }
  }
  async createTaxSetting(taxSetting: any): Promise<any> { 
    const result = await this.db.insert(taxSettings).values(taxSetting).returning();
    return result[0];
  }
  async updateTaxSetting(id: string, taxSetting: any): Promise<any> { 
    const result = await this.db.update(taxSettings).set(taxSetting).where(eq(taxSettings.id, id)).returning();
    return result[0];
  }
  async deleteTaxSetting(id: string): Promise<boolean> { 
    const result = await this.db.delete(taxSettings).where(eq(taxSettings.id, id));
    return result.rowCount > 0;
  }

  // Tags
  async getTags(): Promise<any[]> { 
    return await this.db.select().from(tags); 
  }
  async getTag(id: string): Promise<any> { 
    const result = await this.db.select().from(tags).where(eq(tags.id, id));
    return result[0];
  }
  async createTag(tag: any): Promise<any> { 
    const result = await this.db.insert(tags).values(tag).returning();
    return result[0];
  }
  async updateTag(id: string, tag: any): Promise<any> { 
    const result = await this.db.update(tags).set(tag).where(eq(tags.id, id)).returning();
    return result[0];
  }
  async deleteTag(id: string): Promise<boolean> { 
    const result = await this.db.delete(tags).where(eq(tags.id, id));
    return result.rowCount > 0;
  }

  // Leads
  async getLeads(): Promise<any[]> { 
    return await this.db.select().from(leads); 
  }
  async getLead(id: string): Promise<any> { 
    const result = await this.db.select().from(leads).where(eq(leads.id, id));
    return result[0];
  }
  async createLead(lead: any): Promise<any> { 
    const result = await this.db.insert(leads).values(lead).returning();
    return result[0];
  }
  async updateLead(id: string, lead: any): Promise<any> { 
    const result = await this.db.update(leads).set(lead).where(eq(leads.id, id)).returning();
    return result[0];
  }
  async deleteLead(id: string): Promise<boolean> { 
    const result = await this.db.delete(leads).where(eq(leads.id, id));
    return result.rowCount > 0;
  }

  // Lead Activities
  async getLeadActivities(): Promise<any[]> { 
    return await this.db.select().from(leadActivities); 
  }
  async getLeadActivity(id: string): Promise<any> { 
    const result = await this.db.select().from(leadActivities).where(eq(leadActivities.id, id));
    return result[0];
  }
  async createLeadActivity(activity: any): Promise<any> { 
    const result = await this.db.insert(leadActivities).values(activity).returning();
    return result[0];
  }

  // Campaign Sources
  async getCampaignSources(): Promise<any[]> { 
    return await this.db.select().from(campaignSources); 
  }
  async getCampaignSource(id: string): Promise<any> { 
    const result = await this.db.select().from(campaignSources).where(eq(campaignSources.id, id));
    return result[0];
  }
  async createCampaignSource(source: any): Promise<any> { 
    const result = await this.db.insert(campaignSources).values(source).returning();
    return result[0];
  }

  // Lead Tasks
  async getLeadTasks(): Promise<any[]> { 
    return await this.db.select().from(leadTasks); 
  }
  async getLeadTask(id: string): Promise<any> { 
    const result = await this.db.select().from(leadTasks).where(eq(leadTasks.id, id));
    return result[0];
  }
  async createLeadTask(task: any): Promise<any> { 
    const result = await this.db.insert(leadTasks).values(task).returning();
    return result[0];
  }

  // Tours
  async getTours(): Promise<any[]> { 
    return await this.db.select().from(tours); 
  }
  async getTour(id: string): Promise<any> { 
    const result = await this.db.select().from(tours).where(eq(tours.id, id));
    return result[0];
  }
  async createTour(tour: any): Promise<any> { 
    const result = await this.db.insert(tours).values(tour).returning();
    return result[0];
  }

  // Tenants (super admin access)
  async getTenants(): Promise<any[]> { 
    return await this.db.select().from(tenants); 
  }
  async getTenant(id: string): Promise<any> { 
    const result = await this.db.select().from(tenants).where(eq(tenants.id, id));
    return result[0];
  }
  async createTenant(tenant: any): Promise<any> { 
    const result = await this.db.insert(tenants).values(tenant).returning();
    return result[0];
  }
  async updateTenant(id: string, tenant: any): Promise<any> { 
    const result = await this.db.update(tenants).set(tenant).where(eq(tenants.id, id)).returning();
    return result[0];
  }

  // Subscription Packages (super admin access)
  async getSubscriptionPackages(): Promise<SubscriptionPackage[]> {
    return await this.db.select().from(subscriptionPackages);
  }

  async getSubscriptionPackage(id: string): Promise<SubscriptionPackage | undefined> {
    const result = await this.db.select().from(subscriptionPackages).where(eq(subscriptionPackages.id, id));
    return result[0];
  }

  async createSubscriptionPackage(packageData: InsertSubscriptionPackage): Promise<SubscriptionPackage> {
    const result = await this.db.insert(subscriptionPackages).values(packageData).returning();
    return result[0];
  }

  async updateSubscriptionPackage(id: string, packageData: Partial<InsertSubscriptionPackage>): Promise<SubscriptionPackage | undefined> {
    const result = await this.db.update(subscriptionPackages).set(packageData).where(eq(subscriptionPackages.id, id)).returning();
    return result[0];
  }

  async deleteSubscriptionPackage(id: string): Promise<boolean> {
    const result = await this.db.delete(subscriptionPackages).where(eq(subscriptionPackages.id, id));
    return result.rowCount > 0;
  }
}

// Import database instance
import { db } from './db.js';

// Use database-backed storage for production tenant isolation
// Switch to DbStorage now that database is available
export const storage = new DbStorage(db);
