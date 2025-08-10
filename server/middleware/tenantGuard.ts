import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

export interface TenantRequest extends Request {
  tenantId?: string;
  tenant?: any;
  featurePackage?: any;
  limits?: any;
  flags?: any;
}

/**
 * Middleware to enforce tenant isolation and billing limits
 * Resolves tenantId from session and loads tenant + feature package
 */
export async function tenantGuard(req: TenantRequest, res: Response, next: NextFunction) {
  try {
    // Skip for super admin routes
    if (req.path.startsWith('/api/super-admin/') || req.path.startsWith('/api/public/')) {
      return next();
    }

    // Skip for auth routes
    if (req.path.startsWith('/api/auth/')) {
      return next();
    }

    // Get tenant ID from session (tenant auth should set this)
    const tenantId = (req.session as any)?.tenantId;
    
    if (!tenantId) {
      return res.status(401).json({ 
        code: 'UNAUTHORIZED', 
        message: 'No tenant session found' 
      });
    }

    // Load tenant data
    const tenant = await storage.getTenant(tenantId);
    if (!tenant) {
      return res.status(401).json({ 
        code: 'TENANT_NOT_FOUND', 
        message: 'Tenant not found' 
      });
    }

    // Check tenant status
    if (tenant.status === 'suspended') {
      return res.status(403).json({
        code: 'TENANT_SUSPENDED',
        message: 'Account suspended. Contact support.'
      });
    }

    if (tenant.status === 'canceled') {
      // Only allow billing page access for canceled accounts
      if (!req.path.includes('/billing')) {
        return res.status(403).json({
          code: 'TENANT_CANCELED',
          message: 'Account canceled. Only billing access allowed.'
        });
      }
    }

    // Load feature package if tenant has one
    let featurePackage = null;
    let limits = {};
    let flags = {};

    if (tenant.planSlug) {
      featurePackage = await storage.getFeaturePackageBySlug(tenant.planSlug);
      if (featurePackage) {
        limits = featurePackage.limits || {};
        flags = featurePackage.flags || {};
      }
    }

    // Handle past_due status - read-only except billing
    if (tenant.status === 'past_due') {
      const isWriteOperation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
      const isBillingRoute = req.path.includes('/billing');
      
      if (isWriteOperation && !isBillingRoute) {
        return res.status(402).json({
          code: 'PAYMENT_REQUIRED',
          message: 'Account past due. Please update payment method.',
          status: 'past_due'
        });
      }
    }

    // Attach tenant context to request
    req.tenantId = tenantId;
    req.tenant = tenant;
    req.featurePackage = featurePackage;
    req.limits = limits;
    req.flags = flags;

    next();
  } catch (error) {
    console.error('Tenant guard error:', error);
    res.status(500).json({ 
      code: 'TENANT_GUARD_ERROR', 
      message: 'Internal server error' 
    });
  }
}

/**
 * Middleware to enforce specific limits
 */
export function limitGuard(entityType: 'venues' | 'spaces' | 'staff' | 'monthlyBookings') {
  return async (req: TenantRequest, res: Response, next: NextFunction) => {
    try {
      const limits = req.limits || {};
      const limit = limits[entityType];

      if (limit === undefined) {
        // No limit set, allow through
        return next();
      }

      // Check current usage
      let currentCount = 0;
      
      switch (entityType) {
        case 'venues':
          currentCount = await storage.countVenuesByTenant(req.tenantId!);
          break;
        case 'spaces':
          // This would need venue context from the request
          const venueId = req.params.venueId || req.body.venueId;
          if (venueId) {
            currentCount = await storage.countSpacesByVenue(venueId);
          }
          break;
        case 'staff':
          currentCount = await storage.countUsersByTenant(req.tenantId!);
          break;
        case 'monthlyBookings':
          currentCount = await storage.countMonthlyBookingsByTenant(req.tenantId!);
          break;
      }

      if (currentCount >= limit) {
        return res.status(402).json({
          code: 'LIMIT_REACHED',
          limit: entityType,
          plan: req.tenant?.planSlug,
          currentCount,
          limitValue: limit,
          message: `Your plan allows ${limit} ${entityType}. Upgrade to add more.`
        });
      }

      next();
    } catch (error) {
      console.error('Limit guard error:', error);
      res.status(500).json({ 
        code: 'LIMIT_GUARD_ERROR', 
        message: 'Internal server error' 
      });
    }
  };
}

/**
 * Middleware to check feature flags
 */
export function featureGuard(feature: string) {
  return (req: TenantRequest, res: Response, next: NextFunction) => {
    const flags = req.flags || {};
    
    if (!flags[feature]) {
      return res.status(402).json({
        code: 'FEATURE_NOT_AVAILABLE',
        feature,
        plan: req.tenant?.planSlug,
        message: `Feature "${feature}" not available in your plan. Upgrade to access this feature.`
      });
    }

    next();
  };
}