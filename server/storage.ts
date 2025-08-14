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
import { randomUUID } from "crypto";

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
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
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
        subdomain: "demo",
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

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      role: insertUser.role || "manager",
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

  // Venues
  async getVenues(): Promise<Venue[]> {
    return Array.from(this.venues.values());
  }

  async getVenue(id: string): Promise<Venue | undefined> {
    return this.venues.get(id);
  }

  async createVenue(insertVenue: InsertVenue): Promise<Venue> {
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
    return Array.from(this.spaces.values());
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
    return Array.from(this.customers.values());
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    return Array.from(this.customers.values()).find(customer => customer.email === email);
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
    return Array.from(this.bookings.values());
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
    const createdBookings: Booking[] = [];
    for (const insertBooking of bookings) {
      const booking = await this.createBooking({ ...insertBooking, contractId });
      createdBookings.push(booking);
    }
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
    return Array.from(this.packages.values());
  }

  async getPackage(id: string): Promise<Package | undefined> {
    return this.packages.get(id);
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
    return Array.from(this.services.values());
  }

  async getService(id: string): Promise<Service | undefined> {
    return this.services.get(id);
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

  async updatePackage(id: string, packageData: any): Promise<Package | null> {
    const pkg = this.packages.get(id);
    if (!pkg) return null;
    
    const updated = { ...pkg, ...packageData };
    this.packages.set(id, updated);
    return updated;
  }

  async updateService(id: string, serviceData: any): Promise<Service | null> {
    const service = this.services.get(id);
    if (!service) return null;
    
    const updated = { ...service, ...serviceData };
    this.services.set(id, updated);
    return updated;
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
  async getProposals(): Promise<Proposal[]> {
    return Array.from(this.proposals.values());
  }

  async getProposal(id: string): Promise<Proposal | undefined> {
    return this.proposals.get(id);
  }

  async getProposalsByCustomer(customerId: string): Promise<Proposal[]> {
    return Array.from(this.proposals.values()).filter(p => p.customerId === customerId);
  }

  async createProposal(proposal: InsertProposal): Promise<Proposal> {
    const newProposal: Proposal = {
      id: randomUUID(),
      ...proposal,
      createdAt: new Date(),
    };
    this.proposals.set(newProposal.id, newProposal);
    return newProposal;
  }


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
      maxBookingsPerMonth: packageData.maxBookingsPerMonth || null,
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

  async getTenantBySubdomain(subdomain: string): Promise<Tenant | undefined> {
    return Array.from(this.tenants.values()).find(t => t.subdomain === subdomain);
  }

  async createTenant(tenantData: InsertTenant): Promise<Tenant> {
    const id = randomUUID();
    const tenant: Tenant = {
      id,
      ...tenantData,
      subdomain: tenantData.subdomain || null,
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
      maxBookingsPerMonth: 50,
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
      maxBookingsPerMonth: 200,
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
      maxBookingsPerMonth: 1000,
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

export const storage = new MemStorage();
