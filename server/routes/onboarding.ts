import type { Express } from "express";
import { db } from "../db";
import { tenants, users, featurePackages, tenantUsers } from "../../shared/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { authenticateFirebase, type AuthenticatedRequest } from "../middleware/firebase-auth";

const createTenantSchema = z.object({
  tenantName: z.string().min(2, "Business name must be at least 2 characters"),
  tenantSlug: z.string()
    .min(3, "Slug must be at least 3 characters")
    .max(30, "Slug must be less than 30 characters")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  industry: z.string().min(1, "Please select an industry"),
  contactName: z.string().min(2, "Contact name must be at least 2 characters"),
  contactEmail: z.string().email("Please enter a valid email address"),
  businessPhone: z.string().min(10, "Please enter a valid phone number"),
  businessAddress: z.string().min(10, "Please enter your business address"),
  businessDescription: z.string().min(10, "Please describe your business in at least 10 characters"),
  featurePackageSlug: z.string().optional(),
});

export function registerOnboardingRoutes(app: Express) {
  // POST /api/onboarding/create-tenant - Create a new tenant for the user
  app.post('/api/onboarding/create-tenant', authenticateFirebase, async (req: AuthenticatedRequest, res) => {
    try {
      const validationResult = createTenantSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Validation error',
          errors: validationResult.error.errors 
        });
      }

      const { tenantName, tenantSlug, industry, contactName, contactEmail, businessPhone, businessAddress, businessDescription, featurePackageSlug } = validationResult.data;
      const userUid = req.user?.uid;

      if (!userUid) {
        return res.status(401).json({ message: 'User authentication failed' });
      }

      // First, find or create the user in our database based on Firebase UID
      let user = await db
        .select()
        .from(users)
        .where(eq(users.firebaseUid, userUid))
        .limit(1);

      if (user.length === 0) {
        // Create the user if they don't exist
        user = await db
          .insert(users)
          .values({
            firebaseUid: userUid,
            email: req.user?.email || '',
            firstName: '',
            lastName: '',
            emailVerified: true, // Firebase handles verification
          })
          .returning();
      }

      const userId = user[0].id;

      // Check if user already has a tenant by checking tenant_users relationship
      const existingTenantUser = await db
        .select({
          tenantId: tenantUsers.tenantId,
          role: tenantUsers.role,
          tenantSlug: tenants.slug
        })
        .from(tenantUsers)
        .innerJoin(tenants, eq(tenants.id, tenantUsers.tenantId))
        .where(and(
          eq(tenantUsers.userId, userId),
          eq(tenants.status, 'active')
        ))
        .limit(1);

      if (existingTenantUser.length > 0) {
        return res.status(409).json({ 
          message: 'User already has a tenant',
          tenantSlug: existingTenantUser[0].tenantSlug 
        });
      }

      // Check if slug is already taken
      const slugExists = await db
        .select()
        .from(tenants)
        .where(eq(tenants.slug, tenantSlug))
        .limit(1);

      if (slugExists.length > 0) {
        return res.status(409).json({ 
          message: 'This URL is already taken. Please choose a different one.' 
        });
      }

      // Get default starter plan
      const starterPlan = await db
        .select()
        .from(featurePackages)
        .where(eq(featurePackages.slug, 'starter'))
        .limit(1);

      if (starterPlan.length === 0) {
        return res.status(500).json({ 
          message: 'Default plan not found. Please contact support.' 
        });
      }

      // Create tenant with clean environment
      const newTenant = await db
        .insert(tenants)
        .values({
          name: tenantName,
          slug: tenantSlug,
          industry: industry,
          planSlug: starterPlan[0].slug,
          featurePackageId: starterPlan[0].id,
          status: 'active',
          contactName: contactName,
          contactEmail: contactEmail,
          businessPhone: businessPhone,
          businessAddress: businessAddress,
          businessDescription: businessDescription,
          stripeCustomerId: null, // Will be set when they upgrade
          stripeSubscriptionId: null,
        })
        .returning();

      // Initialize empty tenant environment (no demo data)  
      // The tenant starts completely clean with only their selected plan
      
      // Create basic tenant user relationship
      await db
        .insert(tenantUsers)
        .values({
          tenantId: newTenant[0].id,
          userId: userId,
          role: 'owner',
        });

      res.status(201).json({
        message: 'Tenant created successfully',
        tenant: {
          id: newTenant[0].id,
          name: newTenant[0].name,
          slug: newTenant[0].slug,
        },
        tenantSlug: newTenant[0].slug,
      });

    } catch (error) {
      console.error('Create tenant error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      res.status(500).json({ message: 'Internal server error', error: (error as Error).message });
    }
  });
}