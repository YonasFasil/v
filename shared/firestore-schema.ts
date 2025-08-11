// Firestore Collections and Document Interfaces for VENUIN
import { z } from "zod";

// User document interface
export interface UserDoc {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
  isSuperAdmin?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Super Admin collection
export interface SuperAdminDoc {
  userId: string;
  createdAt: Date;
}

// Feature Package document interface
export interface FeaturePackageDoc {
  id: string;
  name: string;
  slug: string;
  status: 'draft' | 'active' | 'archived';
  billingModes: {
    monthly: { amount: number; currency: string };
    yearly?: { amount: number; currency: string };
  };
  stripeProductId?: string;
  stripePriceIds?: {
    monthly?: string;
    yearly?: string;
  };
  description?: string;
  limits: {
    maxUsers: number;
    maxVenues: number;
    maxSpacesPerVenue: number;
  };
  features: Record<string, boolean>;
  priceMonthly?: number;
  priceYearly?: number;
  trialDays?: number;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// Tenant document interface
export interface TenantDoc {
  id: string;
  name: string;
  slug: string;
  contactName?: string;
  contactEmail?: string;
  industry?: string;
  businessPhone?: string;
  businessAddress?: string;
  businessDescription?: string;
  featurePackageId?: string;
  planSlug?: string;
  status: 'active' | 'past_due' | 'canceled' | 'suspended';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  trialEnd?: Date;
  stripeConnectAccountId?: string;
  connectStatus: 'pending' | 'complete' | 'restricted';
  createdAt: Date;
  updatedAt: Date;
}

// Tenant User relationship document
export interface TenantUserDoc {
  tenantId: string;
  userId: string;
  role: 'owner' | 'admin' | 'manager' | 'staff' | 'viewer';
  permissions: Record<string, boolean>;
  scopes: Record<string, any>;
  createdAt: Date;
}

// Venue document interface
export interface VenueDoc {
  id: string;
  tenantId: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  description?: string;
  timezone: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Space document interface  
export interface SpaceDoc {
  id: string;
  tenantId: string;
  venueId: string;
  name: string;
  capacity: number;
  description?: string;
  amenities: string[];
  basePrice?: number;
  isActive: boolean;
  floorPlanData?: any;
  createdAt: Date;
  updatedAt: Date;
}

// Customer document interface
export interface CustomerDoc {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  notes?: string;
  tags: string[];
  status: 'active' | 'inactive';
  totalBookings: number;
  totalSpent: number;
  createdAt: Date;
  updatedAt: Date;
}

// Lead document interface
export interface LeadDoc {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  eventType?: string;
  estimatedBudget?: number;
  eventDate?: Date;
  guestCount?: number;
  status: 'new' | 'contacted' | 'qualified' | 'proposal_sent' | 'converted' | 'lost';
  priority: 'low' | 'medium' | 'high';
  source?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  notes?: string;
  tags: string[];
  score?: number; // AI-generated lead score
  nextFollowUp?: Date;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Event/Booking document interface
export interface EventDoc {
  id: string;
  tenantId: string;
  customerId?: string;
  leadId?: string;
  title: string;
  description?: string;
  eventType: string;
  status: 'inquiry' | 'tentative' | 'confirmed' | 'completed' | 'cancelled';
  startDate: Date;
  endDate: Date;
  guestCount: number;
  estimatedBudget?: number;
  totalCost?: number;
  venueId?: string;
  spaceIds: string[];
  serviceIds: string[];
  packageIds: string[];
  notes?: string;
  internalNotes?: string;
  proposalSent: boolean;
  proposalId?: string;
  contractSigned: boolean;
  depositPaid: boolean;
  depositAmount?: number;
  finalPaymentDue?: Date;
  stripePaymentIntentId?: string;
  createdBy: string;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Proposal document interface
export interface ProposalDoc {
  id: string;
  tenantId: string;
  eventId: string;
  customerId?: string;
  title: string;
  content: string; // HTML content
  totalAmount: number;
  validUntil: Date;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired';
  sentAt?: Date;
  viewedAt?: Date;
  acceptedAt?: Date;
  declinedAt?: Date;
  signedBy?: string;
  signature?: string;
  emailTemplate?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Service/Package document interfaces
export interface ServiceDoc {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  category: string;
  basePrice: number;
  pricingType: 'fixed' | 'per_person' | 'per_hour';
  taxable: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PackageDoc {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  serviceIds: string[];
  totalPrice: number;
  discountAmount?: number;
  isActive: boolean;
  minGuestCount?: number;
  maxGuestCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Task document interface
export interface TaskDoc {
  id: string;
  tenantId: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  assignedTo?: string;
  eventId?: string;
  customerId?: string;
  tags: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Zod validation schemas
export const userSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  emailVerified: z.boolean().default(false),
  isSuperAdmin: z.boolean().optional(),
});

export const tenantSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional(),
  industry: z.string().optional(),
  businessPhone: z.string().optional(),
  businessAddress: z.string().optional(),
  businessDescription: z.string().optional(),
  featurePackageId: z.string().optional(),
  planSlug: z.string().optional(),
  status: z.enum(['active', 'past_due', 'canceled', 'suspended']).default('active'),
});

export const eventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  eventType: z.string().min(1),
  status: z.enum(['inquiry', 'tentative', 'confirmed', 'completed', 'cancelled']).default('inquiry'),
  startDate: z.date(),
  endDate: z.date(),
  guestCount: z.number().min(1),
  estimatedBudget: z.number().optional(),
  venueId: z.string().optional(),
  spaceIds: z.array(z.string()).default([]),
  serviceIds: z.array(z.string()).default([]),
  packageIds: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

export const customerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  status: z.enum(['active', 'inactive']).default('active'),
});

export const leadSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  eventType: z.string().optional(),
  estimatedBudget: z.number().optional(),
  eventDate: z.date().optional(),
  guestCount: z.number().optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'proposal_sent', 'converted', 'lost']).default('new'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  source: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

// Collection names constants
export const COLLECTIONS = {
  USERS: 'users',
  SUPER_ADMINS: 'super_admins',
  TENANTS: 'tenants',
  TENANT_USERS: 'tenant_users',
  FEATURE_PACKAGES: 'feature_packages',
  VENUES: 'venues',
  SPACES: 'spaces',
  CUSTOMERS: 'customers',
  LEADS: 'leads',
  EVENTS: 'events',
  PROPOSALS: 'proposals',
  SERVICES: 'services',
  PACKAGES: 'packages',
  TASKS: 'tasks',
} as const;