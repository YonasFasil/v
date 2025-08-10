import {
  createTenantDocument,
  getTenantDocument,
  getTenantDocuments,
  updateTenantDocument,
  deleteTenantDocument,
  createDocument,
  getDocument,
  getDocuments,
  updateDocument,
  deleteDocument
} from './firebase';
import type { IStorage } from './storage';
import type {
  Venue,
  Space,
  Customer,
  Booking,
  Payment,
  Service,
  Package,
  Proposal,
  TenantUser,
  Lead,
  BeoTemplate,
  Task,
  InsertVenue,
  InsertSpace,
  InsertCustomer,
  InsertBooking,
  InsertPayment,
  InsertService,
  InsertPackage,
  InsertProposal,
  InsertTenantUser,
  InsertLead,
  InsertBeoTemplate,
  InsertTask
} from '@shared/schema';

export class FirebaseStorage implements IStorage {
  private readonly DEFAULT_TENANT_ID = 'main-account';

  // Helper to generate IDs
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  // Venue operations
  async getVenues(tenantId?: string): Promise<Venue[]> {
    const id = tenantId || this.DEFAULT_TENANT_ID;
    return getTenantDocuments(id, 'venues');
  }

  async getVenue(id: string, tenantId?: string): Promise<Venue | undefined> {
    const tId = tenantId || this.DEFAULT_TENANT_ID;
    const venue = await getTenantDocument(tId, 'venues', id);
    return venue || undefined;
  }

  async createVenue(venue: InsertVenue): Promise<Venue> {
    const tenantId = venue.tenantId || this.DEFAULT_TENANT_ID;
    const id = this.generateId();
    const newVenue = {
      ...venue,
      id,
      tenantId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return createTenantDocument(tenantId, 'venues', newVenue, id);
  }

  async updateVenue(id: string, venue: Partial<Venue>): Promise<Venue | undefined> {
    const tenantId = venue.tenantId || this.DEFAULT_TENANT_ID;
    const updated = await updateTenantDocument(tenantId, 'venues', id, {
      ...venue,
      updatedAt: new Date()
    });
    return updated || undefined;
  }

  async deleteVenue(id: string, tenantId?: string): Promise<boolean> {
    const tId = tenantId || this.DEFAULT_TENANT_ID;
    return deleteTenantDocument(tId, 'venues', id);
  }

  // Space operations
  async getSpaces(tenantId?: string): Promise<Space[]> {
    const id = tenantId || this.DEFAULT_TENANT_ID;
    return getTenantDocuments(id, 'spaces');
  }

  async getSpace(id: string, tenantId?: string): Promise<Space | undefined> {
    const tId = tenantId || this.DEFAULT_TENANT_ID;
    const space = await getTenantDocument(tId, 'spaces', id);
    return space || undefined;
  }

  async createSpace(space: InsertSpace): Promise<Space> {
    const tenantId = space.tenantId || this.DEFAULT_TENANT_ID;
    const id = this.generateId();
    const newSpace = {
      ...space,
      id,
      tenantId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return createTenantDocument(tenantId, 'spaces', newSpace, id);
  }

  async updateSpace(id: string, space: Partial<Space>): Promise<Space | undefined> {
    const tenantId = space.tenantId || this.DEFAULT_TENANT_ID;
    const updated = await updateTenantDocument(tenantId, 'spaces', id, {
      ...space,
      updatedAt: new Date()
    });
    return updated || undefined;
  }

  async deleteSpace(id: string, tenantId?: string): Promise<boolean> {
    const tId = tenantId || this.DEFAULT_TENANT_ID;
    return deleteTenantDocument(tId, 'spaces', id);
  }

  // Customer operations
  async getCustomers(tenantId?: string): Promise<Customer[]> {
    const id = tenantId || this.DEFAULT_TENANT_ID;
    return getTenantDocuments(id, 'customers');
  }

  async getCustomer(id: string, tenantId?: string): Promise<Customer | undefined> {
    const tId = tenantId || this.DEFAULT_TENANT_ID;
    const customer = await getTenantDocument(tId, 'customers', id);
    return customer || undefined;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const tenantId = customer.tenantId || this.DEFAULT_TENANT_ID;
    const id = this.generateId();
    const newCustomer = {
      ...customer,
      id,
      tenantId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return createTenantDocument(tenantId, 'customers', newCustomer, id);
  }

  async updateCustomer(id: string, customer: Partial<Customer>): Promise<Customer | undefined> {
    const tenantId = customer.tenantId || this.DEFAULT_TENANT_ID;
    const updated = await updateTenantDocument(tenantId, 'customers', id, {
      ...customer,
      updatedAt: new Date()
    });
    return updated || undefined;
  }

  async deleteCustomer(id: string, tenantId?: string): Promise<boolean> {
    const tId = tenantId || this.DEFAULT_TENANT_ID;
    return deleteTenantDocument(tId, 'customers', id);
  }

  // Booking operations
  async getBookings(tenantId?: string): Promise<Booking[]> {
    const id = tenantId || this.DEFAULT_TENANT_ID;
    return getTenantDocuments(id, 'bookings');
  }

  async getBooking(id: string, tenantId?: string): Promise<Booking | undefined> {
    const tId = tenantId || this.DEFAULT_TENANT_ID;
    const booking = await getTenantDocument(tId, 'bookings', id);
    return booking || undefined;
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const tenantId = booking.tenantId || this.DEFAULT_TENANT_ID;
    const id = this.generateId();
    const newBooking = {
      ...booking,
      id,
      tenantId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return createTenantDocument(tenantId, 'bookings', newBooking, id);
  }

  async updateBooking(id: string, booking: Partial<Booking>): Promise<Booking | undefined> {
    const tenantId = booking.tenantId || this.DEFAULT_TENANT_ID;
    const updated = await updateTenantDocument(tenantId, 'bookings', id, {
      ...booking,
      updatedAt: new Date()
    });
    return updated || undefined;
  }

  async deleteBooking(id: string, tenantId?: string): Promise<boolean> {
    const tId = tenantId || this.DEFAULT_TENANT_ID;
    return deleteTenantDocument(tId, 'bookings', id);
  }

  // Payment operations
  async getPayments(tenantId?: string): Promise<Payment[]> {
    const id = tenantId || this.DEFAULT_TENANT_ID;
    return getTenantDocuments(id, 'payments');
  }

  async getPayment(id: string, tenantId?: string): Promise<Payment | undefined> {
    const tId = tenantId || this.DEFAULT_TENANT_ID;
    const payment = await getTenantDocument(tId, 'payments', id);
    return payment || undefined;
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const tenantId = payment.tenantId || this.DEFAULT_TENANT_ID;
    const id = this.generateId();
    const newPayment = {
      ...payment,
      id,
      tenantId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return createTenantDocument(tenantId, 'payments', newPayment, id);
  }

  async updatePayment(id: string, payment: Partial<Payment>): Promise<Payment | undefined> {
    const tenantId = payment.tenantId || this.DEFAULT_TENANT_ID;
    const updated = await updateTenantDocument(tenantId, 'payments', id, {
      ...payment,
      updatedAt: new Date()
    });
    return updated || undefined;
  }

  async deletePayment(id: string, tenantId?: string): Promise<boolean> {
    const tId = tenantId || this.DEFAULT_TENANT_ID;
    return deleteTenantDocument(tId, 'payments', id);
  }

  // Service operations
  async getServices(tenantId?: string): Promise<Service[]> {
    const id = tenantId || this.DEFAULT_TENANT_ID;
    return getTenantDocuments(id, 'services');
  }

  async getService(id: string, tenantId?: string): Promise<Service | undefined> {
    const tId = tenantId || this.DEFAULT_TENANT_ID;
    const service = await getTenantDocument(tId, 'services', id);
    return service || undefined;
  }

  async createService(service: InsertService): Promise<Service> {
    const tenantId = service.tenantId || this.DEFAULT_TENANT_ID;
    const id = this.generateId();
    const newService = {
      ...service,
      id,
      tenantId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return createTenantDocument(tenantId, 'services', newService, id);
  }

  async updateService(id: string, service: Partial<Service>): Promise<Service | undefined> {
    const tenantId = service.tenantId || this.DEFAULT_TENANT_ID;
    const updated = await updateTenantDocument(tenantId, 'services', id, {
      ...service,
      updatedAt: new Date()
    });
    return updated || undefined;
  }

  async deleteService(id: string, tenantId?: string): Promise<boolean> {
    const tId = tenantId || this.DEFAULT_TENANT_ID;
    return deleteTenantDocument(tId, 'services', id);
  }

  // Package operations
  async getPackages(tenantId?: string): Promise<Package[]> {
    const id = tenantId || this.DEFAULT_TENANT_ID;
    return getTenantDocuments(id, 'packages');
  }

  async getPackage(id: string, tenantId?: string): Promise<Package | undefined> {
    const tId = tenantId || this.DEFAULT_TENANT_ID;
    const pkg = await getTenantDocument(tId, 'packages', id);
    return pkg || undefined;
  }

  async createPackage(pkg: InsertPackage): Promise<Package> {
    const tenantId = pkg.tenantId || this.DEFAULT_TENANT_ID;
    const id = this.generateId();
    const newPackage = {
      ...pkg,
      id,
      tenantId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return createTenantDocument(tenantId, 'packages', newPackage, id);
  }

  async updatePackage(id: string, pkg: Partial<Package>): Promise<Package | undefined> {
    const tenantId = pkg.tenantId || this.DEFAULT_TENANT_ID;
    const updated = await updateTenantDocument(tenantId, 'packages', id, {
      ...pkg,
      updatedAt: new Date()
    });
    return updated || undefined;
  }

  async deletePackage(id: string, tenantId?: string): Promise<boolean> {
    const tId = tenantId || this.DEFAULT_TENANT_ID;
    return deleteTenantDocument(tId, 'packages', id);
  }

  // Proposal operations
  async getProposals(tenantId?: string): Promise<Proposal[]> {
    const id = tenantId || this.DEFAULT_TENANT_ID;
    return getTenantDocuments(id, 'proposals');
  }

  async getProposal(id: string, tenantId?: string): Promise<Proposal | undefined> {
    const tId = tenantId || this.DEFAULT_TENANT_ID;
    const proposal = await getTenantDocument(tId, 'proposals', id);
    return proposal || undefined;
  }

  async createProposal(proposal: InsertProposal): Promise<Proposal> {
    const tenantId = proposal.tenantId || this.DEFAULT_TENANT_ID;
    const id = this.generateId();
    const newProposal = {
      ...proposal,
      id,
      tenantId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return createTenantDocument(tenantId, 'proposals', newProposal, id);
  }

  async updateProposal(id: string, proposal: Partial<Proposal>): Promise<Proposal | undefined> {
    const tenantId = proposal.tenantId || this.DEFAULT_TENANT_ID;
    const updated = await updateTenantDocument(tenantId, 'proposals', id, {
      ...proposal,
      updatedAt: new Date()
    });
    return updated || undefined;
  }

  async deleteProposal(id: string, tenantId?: string): Promise<boolean> {
    const tId = tenantId || this.DEFAULT_TENANT_ID;
    return deleteTenantDocument(tId, 'proposals', id);
  }

  // Tenant User operations
  async getTenantUsers(tenantId: string): Promise<TenantUser[]> {
    return getTenantDocuments(tenantId, 'tenantUsers');
  }

  async getTenantUser(id: string, tenantId: string): Promise<TenantUser | undefined> {
    const user = await getTenantDocument(tenantId, 'tenantUsers', id);
    return user || undefined;
  }

  async createTenantUser(user: InsertTenantUser): Promise<TenantUser> {
    const id = this.generateId();
    const newUser = {
      ...user,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return createTenantDocument(user.tenantId, 'tenantUsers', newUser, id);
  }

  async updateTenantUser(id: string, user: Partial<TenantUser>): Promise<TenantUser | undefined> {
    if (!user.tenantId) throw new Error('Tenant ID required for user update');
    const updated = await updateTenantDocument(user.tenantId, 'tenantUsers', id, {
      ...user,
      updatedAt: new Date()
    });
    return updated || undefined;
  }

  async deleteTenantUser(id: string, tenantId: string): Promise<boolean> {
    return deleteTenantDocument(tenantId, 'tenantUsers', id);
  }

  // Lead operations
  async getLeads(tenantId?: string): Promise<Lead[]> {
    const id = tenantId || this.DEFAULT_TENANT_ID;
    return getTenantDocuments(id, 'leads');
  }

  async getLead(id: string, tenantId?: string): Promise<Lead | undefined> {
    const tId = tenantId || this.DEFAULT_TENANT_ID;
    const lead = await getTenantDocument(tId, 'leads', id);
    return lead || undefined;
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const tenantId = lead.tenantId || this.DEFAULT_TENANT_ID;
    const id = this.generateId();
    const newLead = {
      ...lead,
      id,
      tenantId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return createTenantDocument(tenantId, 'leads', newLead, id);
  }

  async updateLead(id: string, lead: Partial<Lead>): Promise<Lead | undefined> {
    const tenantId = lead.tenantId || this.DEFAULT_TENANT_ID;
    const updated = await updateTenantDocument(tenantId, 'leads', id, {
      ...lead,
      updatedAt: new Date()
    });
    return updated || undefined;
  }

  async deleteLead(id: string, tenantId?: string): Promise<boolean> {
    const tId = tenantId || this.DEFAULT_TENANT_ID;
    return deleteTenantDocument(tId, 'leads', id);
  }

  // BEO Template operations
  async getBeoTemplates(tenantId?: string): Promise<BeoTemplate[]> {
    const id = tenantId || this.DEFAULT_TENANT_ID;
    return getTenantDocuments(id, 'beoTemplates');
  }

  async getBeoTemplate(id: string, tenantId?: string): Promise<BeoTemplate | undefined> {
    const tId = tenantId || this.DEFAULT_TENANT_ID;
    const template = await getTenantDocument(tId, 'beoTemplates', id);
    return template || undefined;
  }

  async createBeoTemplate(template: InsertBeoTemplate): Promise<BeoTemplate> {
    const tenantId = template.tenantId || this.DEFAULT_TENANT_ID;
    const id = this.generateId();
    const newTemplate = {
      ...template,
      id,
      tenantId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return createTenantDocument(tenantId, 'beoTemplates', newTemplate, id);
  }

  async updateBeoTemplate(id: string, template: Partial<BeoTemplate>): Promise<BeoTemplate | undefined> {
    const tenantId = template.tenantId || this.DEFAULT_TENANT_ID;
    const updated = await updateTenantDocument(tenantId, 'beoTemplates', id, {
      ...template,
      updatedAt: new Date()
    });
    return updated || undefined;
  }

  async deleteBeoTemplate(id: string, tenantId?: string): Promise<boolean> {
    const tId = tenantId || this.DEFAULT_TENANT_ID;
    return deleteTenantDocument(tId, 'beoTemplates', id);
  }

  // Task operations
  async getTasks(tenantId?: string): Promise<Task[]> {
    const id = tenantId || this.DEFAULT_TENANT_ID;
    return getTenantDocuments(id, 'tasks');
  }

  async getTask(id: string, tenantId?: string): Promise<Task | undefined> {
    const tId = tenantId || this.DEFAULT_TENANT_ID;
    const task = await getTenantDocument(tId, 'tasks', id);
    return task || undefined;
  }

  async createTask(task: InsertTask): Promise<Task> {
    const tenantId = task.tenantId || this.DEFAULT_TENANT_ID;
    const id = this.generateId();
    const newTask = {
      ...task,
      id,
      tenantId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return createTenantDocument(tenantId, 'tasks', newTask, id);
  }

  async updateTask(id: string, task: Partial<Task>): Promise<Task | undefined> {
    const tenantId = task.tenantId || this.DEFAULT_TENANT_ID;
    const updated = await updateTenantDocument(tenantId, 'tasks', id, {
      ...task,
      updatedAt: new Date()
    });
    return updated || undefined;
  }

  async deleteTask(id: string, tenantId?: string): Promise<boolean> {
    const tId = tenantId || this.DEFAULT_TENANT_ID;
    return deleteTenantDocument(tId, 'tasks', id);
  }

  // Settings operations
  async getSettings(tenantId?: string): Promise<any> {
    const tId = tenantId || this.DEFAULT_TENANT_ID;
    const settings = await getTenantDocument(tId, 'settings', 'default');
    return settings || this.getDefaultSettings();
  }

  async updateSettings(settings: any, tenantId?: string): Promise<any> {
    const tId = tenantId || this.DEFAULT_TENANT_ID;
    const updated = await updateTenantDocument(tId, 'settings', 'default', settings);
    return updated || settings;
  }

  private getDefaultSettings() {
    return {
      business: {
        companyName: "Venuine Events",
        companyEmail: "hello@venuine.com",
        companyPhone: "(555) 123-4567",
        companyAddress: "123 Event Street, City, State 12345",
        website: "https://venuine.com",
        timezone: "America/New_York",
        currency: "USD",
        logo: ""
      },
      notifications: {
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        marketingEmails: false
      },
      integrations: {
        stripe: { enabled: false, publicKey: "", secretKey: "" },
        google: { enabled: false, clientId: "", clientSecret: "" },
        outlook: { enabled: false, clientId: "", clientSecret: "" }
      },
      beo: {
        defaultTemplate: "standard",
        companyLogo: "",
        footerText: "Thank you for choosing our venue"
      },
      taxes: [],
      security: {
        twoFactorAuth: false,
        sessionTimeout: 30,
        passwordPolicy: "standard"
      }
    };
  }
}