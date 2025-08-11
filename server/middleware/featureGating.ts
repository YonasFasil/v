import { db } from "../db";
import { tenants, featurePackages, bookings, venues, customers, tenantUsers } from "../../shared/schema";
import { eq, sql } from "drizzle-orm";
import type { Request, Response, NextFunction } from "express";

export interface FeatureGateOptions {
  feature: string;
  redirectToUpgrade?: boolean;
  customMessage?: string;
}

// Feature enforcement middleware
export function requireFeature(options: FeatureGateOptions) {
  return async (req: any, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenant?.id;
      if (!tenantId) {
        return res.status(403).json({ 
          message: "Tenant access required",
          code: "TENANT_REQUIRED"
        });
      }

      // Get tenant's plan and features
      const [tenantWithPlan] = await db
        .select({
          planId: tenants.planId,
          features: featurePackages.features,
          limits: featurePackages.limits
        })
        .from(tenants)
        .leftJoin(featurePackages, eq(tenants.planId, featurePackages.id))
        .where(eq(tenants.id, tenantId));

      if (!tenantWithPlan) {
        return res.status(403).json({ 
          message: "Tenant plan not found",
          code: "PLAN_NOT_FOUND"
        });
      }

      const features = tenantWithPlan.features as Record<string, boolean> || {};
      const hasFeature = features[options.feature] === true;

      if (!hasFeature) {
        return res.status(403).json({ 
          message: options.customMessage || `Feature '${options.feature}' is not available in your current plan`,
          code: "FEATURE_NOT_AVAILABLE",
          feature: options.feature,
          upgradeRequired: options.redirectToUpgrade !== false
        });
      }

      // Add feature info to request for downstream use
      req.features = features;
      req.limits = tenantWithPlan.limits as Record<string, number> || {};
      
      next();
    } catch (error) {
      console.error("Feature gating error:", error);
      res.status(500).json({ message: "Feature check failed" });
    }
  };
}

// Usage limit enforcement middleware  
export function checkUsageLimit(limitName: string, customMessage?: string) {
  return async (req: any, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenant?.id;
      if (!tenantId) {
        return res.status(403).json({ 
          message: "Tenant access required",
          code: "TENANT_REQUIRED"
        });
      }

      // Get tenant's limits
      const [tenantWithPlan] = await db
        .select({
          limits: featurePackages.limits
        })
        .from(tenants)
        .leftJoin(featurePackages, eq(tenants.planId, featurePackages.id))
        .where(eq(tenants.id, tenantId));

      if (!tenantWithPlan) {
        return res.status(403).json({ 
          message: "Tenant plan not found",
          code: "PLAN_NOT_FOUND"
        });
      }

      const limits = tenantWithPlan.limits as Record<string, number> || {};
      const limit = limits[limitName];

      if (limit !== undefined && limit !== -1) { // -1 means unlimited
        // Count current usage based on limit type
        let currentUsage = 0;
        
        switch (limitName) {
          case 'maxBookings':
            const bookingsCount = await db.select({ count: sql<number>`count(*)` })
              .from(bookings)
              .where(eq(bookings.tenantId, tenantId));
            currentUsage = Number(bookingsCount[0]?.count) || 0;
            break;
            
          case 'maxVenues':
            const venuesCount = await db.select({ count: sql<number>`count(*)` })
              .from(venues)  
              .where(eq(venues.tenantId, tenantId));
            currentUsage = Number(venuesCount[0]?.count) || 0;
            break;
            
          case 'maxCustomers':
            const customersCount = await db.select({ count: sql<number>`count(*)` })
              .from(customers)
              .where(eq(customers.tenantId, tenantId));
            currentUsage = Number(customersCount[0]?.count) || 0;
            break;
            
          case 'maxStaff':
            const staffCount = await db.select({ count: sql<number>`count(*)` })
              .from(tenantUsers)
              .where(eq(tenantUsers.tenantId, tenantId));
            currentUsage = Number(staffCount[0]?.count) || 0;
            break;
        }

        if (currentUsage >= limit) {
          return res.status(403).json({ 
            message: customMessage || `You have reached the limit of ${limit} ${limitName}. Please upgrade your plan.`,
            code: "USAGE_LIMIT_EXCEEDED",
            limit: limitName,
            currentUsage,
            maxAllowed: limit,
            upgradeRequired: true
          });
        }

        // Add usage info to request
        req.currentUsage = { [limitName]: currentUsage };
        req.limits = limits;
      }
      
      next();
    } catch (error) {
      console.error("Usage limit check error:", error);
      res.status(500).json({ message: "Usage limit check failed" });
    }
  };
}

// Helper function to get all tenant features and limits
export async function getTenantFeatures(tenantId: string) {
  try {
    const [tenantWithPlan] = await db
      .select({
        planId: tenants.planId,
        planName: featurePackages.name,
        features: featurePackages.features,
        limits: featurePackages.limits
      })
      .from(tenants)
      .leftJoin(featurePackages, eq(tenants.planId, featurePackages.id))
      .where(eq(tenants.id, tenantId));

    if (!tenantWithPlan) {
      return null;
    }

    return {
      planId: tenantWithPlan.planId,
      planName: tenantWithPlan.planName,
      features: tenantWithPlan.features as Record<string, boolean> || {},
      limits: tenantWithPlan.limits as Record<string, number> || {}
    };
  } catch (error) {
    console.error("Error getting tenant features:", error);
    return null;
  }
}