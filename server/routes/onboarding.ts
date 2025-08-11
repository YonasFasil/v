import type { Express } from "express";
import { adminDb } from "../firebase-admin";
import { z } from "zod";
import { authenticateFirebase, type AuthenticatedRequest } from "../middleware/firebase-auth";
import { randomUUID } from 'crypto';

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
      console.log('Received onboarding data:', JSON.stringify(req.body, null, 2));
      console.log('User from request:', req.user);
      
      const validationResult = createTenantSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        console.log('Validation failed:', validationResult.error.errors);
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

      // Check if user already has a tenant in Firestore
      const existingUserDoc = await adminDb.collection('users').doc(userUid).get();
      if (existingUserDoc.exists && existingUserDoc.data()?.tenantId) {
        const tenantDoc = await adminDb.collection('tenants').doc(existingUserDoc.data()?.tenantId).get();
        if (tenantDoc.exists) {
          return res.status(409).json({ 
            message: 'User already has a tenant',
            tenantSlug: tenantDoc.data()?.slug 
          });
        }
      }

      // Check if slug is already taken
      const tenantsSnapshot = await adminDb.collection('tenants').where('slug', '==', tenantSlug).get();
      if (!tenantsSnapshot.empty) {
        return res.status(409).json({ 
          message: 'This URL is already taken. Please choose a different one.' 
        });
      }

      // Get default starter plan (or first available plan)
      const featurePackagesSnapshot = await adminDb.collection('featurePackages').limit(1).get();
      if (featurePackagesSnapshot.empty) {
        return res.status(500).json({ 
          message: 'No plans available. Please contact support.' 
        });
      }

      const defaultPlan = featurePackagesSnapshot.docs[0].data();

      // Create tenant with clean environment
      const tenantId = randomUUID();
      const tenantData = {
        id: tenantId,
        name: tenantName,
        slug: tenantSlug,
        industry: industry,
        planId: defaultPlan.id,
        status: 'active',
        contactName: contactName,
        contactEmail: contactEmail,
        businessPhone: businessPhone,
        businessAddress: businessAddress,
        businessDescription: businessDescription,
        ownerId: userUid,
        userIds: [userUid],
        stripeCustomerId: null, // Will be set when they upgrade
        stripeSubscriptionId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await adminDb.collection('tenants').doc(tenantId).set(tenantData);

      // Ensure user document exists, then update with tenant information
      const userDocRef = adminDb.collection('users').doc(userUid);
      const userDoc = await userDocRef.get();
      
      const userData = {
        tenantId: tenantId,
        tenantSlug: tenantSlug,
        role: 'owner',
        updatedAt: new Date(),
      };

      if (userDoc.exists) {
        // Update existing user document
        await userDocRef.update(userData);
      } else {
        // Create user document if it doesn't exist
        await userDocRef.set({
          uid: userUid,
          email: req.user?.email || '',
          isSuperAdmin: false,
          createdAt: new Date(),
          ...userData,
        });
      }

      res.status(201).json({
        message: 'Tenant created successfully',
        tenant: tenantData,
        tenantSlug: tenantSlug,
      });

    } catch (error) {
      console.error('Error creating tenant:', error);
      res.status(500).json({ 
        message: 'Failed to create tenant. Please try again.' 
      });
    }
  });
}