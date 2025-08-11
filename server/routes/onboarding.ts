import type { Express } from "express";
import { storage } from "../storage";
import { requireAuth } from "../middleware/auth";
import { insertTenantSchema, insertTenantUserSchema } from "@shared/schema";
import { randomUUID } from "crypto";

export function registerOnboardingRoutes(app: Express) {
  // Create tenant during onboarding
  app.post("/api/onboarding/create-tenant", requireAuth, async (req, res) => {
    try {
      const {
        tenantName,
        tenantSlug,
        industry,
        planId,
        contactName,
        contactEmail,
        businessPhone,
        businessAddress,
        businessDescription,
      } = req.body;

      // Validate required fields
      if (!tenantName || !tenantSlug || !planId) {
        return res.status(400).json({ 
          message: 'Tenant name, slug, and plan are required.' 
        });
      }

      // Check if slug is already taken
      const existingTenant = await storage.getTenantBySlug(tenantSlug);
      if (existingTenant) {
        return res.status(400).json({ 
          message: 'Tenant slug is already taken. Please choose a different one.' 
        });
      }

      // Get the selected plan
      const selectedPlan = await storage.getFeaturePackage(planId);
      if (!selectedPlan) {
        return res.status(400).json({ 
          message: 'Selected plan not found. Please choose a valid plan.' 
        });
      }

      // Create tenant
      const tenantData = insertTenantSchema.parse({
        name: tenantName,
        slug: tenantSlug,
        industry: industry,
        planId: selectedPlan.id,
        status: 'active',
        contactName: contactName,
        contactEmail: contactEmail,
        businessPhone: businessPhone,
        businessAddress: businessAddress,
        businessDescription: businessDescription,
        ownerId: req.user!.id,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
      });

      const tenant = await storage.createTenant(tenantData);

      // Add user to tenant as owner
      await storage.addUserToTenant(insertTenantUserSchema.parse({
        tenantId: tenant.id,
        userId: req.user!.id,
        role: 'owner',
        permissions: {},
      }));

      res.status(201).json({
        message: 'Tenant created successfully',
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          planId: tenant.planId,
        },
      });

    } catch (error) {
      console.error('Error creating tenant:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ 
        message: 'Failed to create tenant. Please try again.' 
      });
    }
  });
}