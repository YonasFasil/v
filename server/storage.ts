import { 
  type User, type InsertUser,
  type Venue, type InsertVenue,
  type Space, type InsertSpace,
  type SetupStyle, type InsertSetupStyle,
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

} from "@shared/schema";

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

  // Customers
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  getCustomerByEmail(email: string): Promise<Customer | undefined>;
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


  constructor() {
    this.users = new Map();
    this.venues = new Map();
    this.spaces = new Map();
    this.setupStyles = new Map();
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

    // Clean start - no demo data
  }

  // Users implementation
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === username);
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      id: randomUUID(),
      ...user,
      updatedAt: new Date(),
      createdAt: new Date(),
    };
    this.users.set(newUser.id, newUser);
    return newUser;
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    const existing = this.users.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...user };
    this.users.set(id, updated);
    return updated;
  }

  // Venues implementation
  async getVenues(): Promise<Venue[]> {
    return Array.from(this.venues.values());
  }

  async getVenue(id: string): Promise<Venue | undefined> {
    return this.venues.get(id);
  }

  async createVenue(venue: InsertVenue): Promise<Venue> {
    const newVenue: Venue = {
      id: randomUUID(),
      ...venue,
    };
    this.venues.set(newVenue.id, newVenue);
    return newVenue;
  }

  async updateVenue(id: string, venue: Partial<InsertVenue>): Promise<Venue | undefined> {
    const existing = this.venues.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...venue };
    this.venues.set(id, updated);
    return updated;
  }

  async deleteVenue(id: string): Promise<boolean> {
    return this.venues.delete(id);
  }

  // Spaces implementation
  async getSpaces(): Promise<Space[]> {
    return Array.from(this.spaces.values());
  }

  async getSpace(id: string): Promise<Space | undefined> {
    return this.spaces.get(id);
  }

  async getSpacesByVenue(venueId: string): Promise<Space[]> {
    return Array.from(this.spaces.values()).filter(space => space.venueId === venueId);
  }

  async createSpace(space: InsertSpace): Promise<Space> {
    const newSpace: Space = {
      id: randomUUID(),
      ...space,
    };
    this.spaces.set(newSpace.id, newSpace);
    return newSpace;
  }

  async updateSpace(id: string, space: Partial<InsertSpace>): Promise<Space | undefined> {
    const existing = this.spaces.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...space };
    this.spaces.set(id, updated);
    return updated;
  }

  async deleteSpace(id: string): Promise<boolean> {
    return this.spaces.delete(id);
  }

  // Setup Styles implementation
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
    };
    this.setupStyles.set(newSetupStyle.id, newSetupStyle);
    return newSetupStyle;
  }

  async updateSetupStyle(id: string, setupStyle: Partial<InsertSetupStyle>): Promise<SetupStyle | undefined> {
    const existing = this.setupStyles.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...setupStyle };
    this.setupStyles.set(id, updated);
    return updated;
  }

  async deleteSetupStyle(id: string): Promise<boolean> {
    return this.setupStyles.delete(id);
  }

  // Customers implementation
  async getCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    return Array.from(this.customers.values()).find(customer => customer.email === email);
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const newCustomer: Customer = {
      id: randomUUID(),
      ...customer,
      createdAt: new Date(),
    };
    this.customers.set(newCustomer.id, newCustomer);
    return newCustomer;
  }

  async updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const existing = this.customers.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...customer };
    this.customers.set(id, updated);
    return updated;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    // Remove all related bookings, contracts, and proposals
    const customerBookings = Array.from(this.bookings.values()).filter(booking => booking.customerId === id);
    customerBookings.forEach(booking => this.bookings.delete(booking.id));
    
    const customerContracts = Array.from(this.contracts.values()).filter(contract => contract.customerId === id);
    customerContracts.forEach(contract => this.contracts.delete(contract.id));
    
    const customerProposals = Array.from(this.proposals.values()).filter(proposal => proposal.customerId === id);
    customerProposals.forEach(proposal => this.proposals.delete(proposal.id));
    
    return this.customers.delete(id);
  }

  // Contracts implementation
  async getContracts(): Promise<Contract[]> {
    return Array.from(this.contracts.values());
  }

  async getContract(id: string): Promise<Contract | undefined> {
    return this.contracts.get(id);
  }

  async getContractsByCustomer(customerId: string): Promise<Contract[]> {
    return Array.from(this.contracts.values()).filter(contract => contract.customerId === customerId);
  }

  async createContract(contract: InsertContract): Promise<Contract> {
    const newContract: Contract = {
      id: randomUUID(),
      ...contract,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.contracts.set(newContract.id, newContract);
    return newContract;
  }

  async updateContract(id: string, contract: Partial<InsertContract>): Promise<Contract | undefined> {
    const existing = this.contracts.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...contract };
    this.contracts.set(id, updated);
    return updated;
  }

  async deleteContract(id: string): Promise<boolean> {
    return this.contracts.delete(id);
  }

  // Bookings implementation
  async getBookings(): Promise<Booking[]> {
    return Array.from(this.bookings.values()).sort((a, b) => b.eventDate.getTime() - a.eventDate.getTime());
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

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const newBooking: Booking = {
      id: randomUUID(),
      ...booking,
      status: booking.status || "inquiry",
    };
    this.bookings.set(newBooking.id, newBooking);
    return newBooking;
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
    for (const booking of bookings) {
      const newBooking = await this.createBooking({ ...booking, contractId });
      createdBookings.push(newBooking);
    }
    return createdBookings;
  }

  async deleteBooking(id: string): Promise<boolean> {
    return this.bookings.delete(id);
  }

  // Proposals implementation
  async getProposals(): Promise<Proposal[]> {
    return Array.from(this.proposals.values()).sort((a, b) => 
      (b.createdAt || new Date(0)).getTime() - (a.createdAt || new Date(0)).getTime()
    );
  }

  async getProposal(id: string): Promise<Proposal | undefined> {
    return this.proposals.get(id);
  }

  async getProposalsByCustomer(customerId: string): Promise<Proposal[]> {
    return Array.from(this.proposals.values()).filter(proposal => proposal.customerId === customerId);
  }

  async createProposal(proposal: InsertProposal): Promise<Proposal> {
    const newProposal: Proposal = {
      id: randomUUID(),
      ...proposal,
    };
    this.proposals.set(newProposal.id, newProposal);
    return newProposal;
  }

  async updateProposal(id: string, proposal: Partial<InsertProposal>): Promise<Proposal | undefined> {
    const existing = this.proposals.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...proposal };
    this.proposals.set(id, updated);
    return updated;
  }

  async deleteProposal(id: string): Promise<boolean> {
    return this.proposals.delete(id);
  }

  // Communications implementation
  async getCommunications(bookingId?: string): Promise<Communication[]> {
    let communications = Array.from(this.communications.values());
    if (bookingId) {
      communications = communications.filter(comm => comm.bookingId === bookingId);
    }
    return communications.sort((a, b) => 
      (b.sentAt || new Date(0)).getTime() - (a.sentAt || new Date(0)).getTime()
    );
  }

  async getCommunication(id: string): Promise<Communication | undefined> {
    return this.communications.get(id);
  }

  async getCommunicationsByProposal(proposalId: string): Promise<Communication[]> {
    return Array.from(this.communications.values())
      .filter(comm => comm.bookingId === proposalId) // Using bookingId since proposalId doesn't exist in schema
      .sort((a, b) => (b.sentAt || new Date(0)).getTime() - (a.sentAt || new Date(0)).getTime());
  }

  async getCommunicationsByCustomer(customerId: string): Promise<Communication[]> {
    return Array.from(this.communications.values())
      .filter(comm => comm.customerId === customerId)
      .sort((a, b) => (b.sentAt || new Date(0)).getTime() - (a.sentAt || new Date(0)).getTime());
  }

  async createCommunication(communication: InsertCommunication): Promise<Communication> {
    const newCommunication: Communication = {
      id: randomUUID(),
      ...communication,
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

  // Settings implementation
  async getSettings(): Promise<Setting[]> {
    return Array.from(this.settings.values());
  }

  async getSetting(key: string): Promise<Setting | undefined> {
    return Array.from(this.settings.values()).find(setting => setting.key === key);
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
    const existing = Array.from(this.settings.values()).find(setting => setting.key === key);
    if (existing) {
      existing.value = value;
      existing.updatedAt = new Date();
      this.settings.set(existing.id, existing);
      return existing;
    } else {
      return this.createSetting({ key, value });
    }
  }

  // Payments implementation
  async getPayments(): Promise<Payment[]> {
    return Array.from(this.payments.values()).sort((a, b) => 
      (b.createdAt || new Date(0)).getTime() - (a.createdAt || new Date(0)).getTime()
    );
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    return this.payments.get(id);
  }

  async getPaymentsByBooking(bookingId: string): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(payment => payment.bookingId === bookingId);
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const newPayment: Payment = {
      id: randomUUID(),
      ...payment,
      createdAt: new Date(),
    };
    this.payments.set(newPayment.id, newPayment);
    return newPayment;
  }

  async updatePayment(id: string, payment: Partial<InsertPayment>): Promise<Payment | undefined> {
    const existing = this.payments.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...payment };
    this.payments.set(id, updated);
    return updated;
  }

  // Tasks implementation
  async getTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values()).sort((a, b) => {
      if (a.dueDate && b.dueDate) {
        return a.dueDate.getTime() - b.dueDate.getTime();
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return (b.createdAt || new Date(0)).getTime() - (a.createdAt || new Date(0)).getTime();
    });
  }

  async getTask(id: string): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async getTasksByUser(userId: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => task.assignedTo === userId);
  }

  async createTask(task: InsertTask): Promise<Task> {
    const newTask: Task = {
      id: randomUUID(),
      ...task,
    };
    this.tasks.set(newTask.id, newTask);
    return newTask;
  }

  async updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined> {
    const existing = this.tasks.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...task };
    this.tasks.set(id, updated);
    return updated;
  }

  // AI Insights implementation
  async getAiInsights(): Promise<AiInsight[]> {
    return Array.from(this.aiInsights.values()).sort((a, b) => 
      (b.createdAt || new Date(0)).getTime() - (a.createdAt || new Date(0)).getTime()
    );
  }

  async getActiveAiInsights(): Promise<AiInsight[]> {
    return Array.from(this.aiInsights.values())
      .filter(insight => insight.isActive)
      .sort((a, b) => (b.createdAt || new Date(0)).getTime() - (a.createdAt || new Date(0)).getTime());
  }

  async createAiInsight(insight: InsertAiInsight): Promise<AiInsight> {
    const newInsight: AiInsight = {
      id: randomUUID(),
      ...insight,
    };
    this.aiInsights.set(newInsight.id, newInsight);
    return newInsight;
  }

  // Packages implementation
  async getPackages(): Promise<Package[]> {
    return Array.from(this.packages.values());
  }

  async getPackage(id: string): Promise<Package | undefined> {
    return this.packages.get(id);
  }

  async createPackage(pkg: InsertPackage): Promise<Package> {
    const newPackage: Package = {
      id: randomUUID(),
      ...pkg,
    };
    this.packages.set(newPackage.id, newPackage);
    return newPackage;
  }

  async updatePackage(id: string, pkg: Partial<InsertPackage>): Promise<Package | undefined> {
    const existing = this.packages.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...pkg };
    this.packages.set(id, updated);
    return updated;
  }

  async deletePackage(id: string): Promise<boolean> {
    return this.packages.delete(id);
  }

  // Services implementation
  async getServices(): Promise<Service[]> {
    return Array.from(this.services.values());
  }

  async getService(id: string): Promise<Service | undefined> {
    return this.services.get(id);
  }

  async createService(service: InsertService): Promise<Service> {
    const newService: Service = {
      id: randomUUID(),
      ...service,
    };
    this.services.set(newService.id, newService);
    return newService;
  }

  async updateService(id: string, service: Partial<InsertService>): Promise<Service | undefined> {
    const existing = this.services.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...service };
    this.services.set(id, updated);
    return updated;
  }

  async deleteService(id: string): Promise<boolean> {
    return this.services.delete(id);
  }

  // Tax Settings implementation
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
    const activitiesToRemove = Array.from(this.leadActivities.values()).filter(activity => activity.leadId === id);
    activitiesToRemove.forEach(activity => this.leadActivities.delete(activity.id));
    
    const tasksToRemove = Array.from(this.leadTasks.values()).filter(task => task.leadId === id);
    tasksToRemove.forEach(task => this.leadTasks.delete(task.id));
    
    const tagCombosToRemove = Array.from(this.leadTags).filter(combo => combo.startsWith(`${id}:`));
    tagCombosToRemove.forEach(combo => this.leadTags.delete(combo));
    
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
      tasks = tasks.filter(task => task.assignee === filters.assignee);
    }
    
    if (filters?.due) {
      const dueDate = new Date(filters.due);
      tasks = tasks.filter(task => {
        if (!task.dueDate) return false;
        const taskDue = new Date(task.dueDate);
        return taskDue.toDateString() === dueDate.toDateString();
      });
    }
    
    return tasks.sort((a, b) => {
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return b.createdAt.getTime() - a.createdAt.getTime();
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
}

export const storage = new MemStorage();