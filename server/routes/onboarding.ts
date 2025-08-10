import type { Express } from "express";
import { db } from "../db";
import { tenants, users, featurePackages } from "../../shared/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const createTenantSchema = z.object({
  tenantName: z.string().min(2, "Business name must be at least 2 characters"),
  tenantSlug: z.string()
    .min(3, "Slug must be at least 3 characters")
    .max(30, "Slug must be less than 30 characters")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  industry: z.string().min(1, "Please select an industry"),
});

function requireAuth(req: any, res: any, next: any) {
  if (!req.session?.userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
}

export function registerOnboardingRoutes(app: Express) {
  // POST /api/onboarding/create-tenant - Create a new tenant for the user
  app.post('/api/onboarding/create-tenant', requireAuth, async (req, res) => {
    try {
      const validationResult = createTenantSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Validation error',
          errors: validationResult.error.errors 
        });
      }

      const { tenantName, tenantSlug, industry } = validationResult.data;
      const userId = req.session?.userId;

      if (!userId) {
        return res.status(401).json({ message: 'User session not found' });
      }

      // Check if user already has a tenant by checking if they have any tenant with their email
      const userEmail = req.session.user?.email;
      if (!userEmail) {
        return res.status(401).json({ message: 'User email not found in session' });
      }

      const existingTenant = await db
        .select()
        .from(tenants)
        .where(eq(tenants.contactEmail, userEmail))
        .limit(1);

      if (existingTenant.length > 0) {
        return res.status(409).json({ 
          message: 'User already has a tenant',
          tenantSlug: existingTenant[0].slug 
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

      // Create tenant
      const newTenant = await db
        .insert(tenants)
        .values({
          name: tenantName,
          slug: tenantSlug,
          planSlug: starterPlan[0].slug,
          featurePackageId: starterPlan[0].id,
          status: 'active',
          contactName: req.session.user?.firstName + ' ' + (req.session.user?.lastName || ''),
          contactEmail: req.session.user?.email || '',
          stripeCustomerId: null, // Will be set when they upgrade
          stripeSubscriptionId: null,
        })
        .returning();

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
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  });
}