import type { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

export interface TenantRequest extends Request {
  tenant?: {
    id: string;
    name: string;
    subdomain: string;
    status: string;
    subscriptionPackageId: string;
  };
}

// Extract subdomain from host header
export function extractSubdomain(host: string): string | null {
  if (!host) return null;
  
  // Remove port if present
  const hostname = host.split(':')[0];
  
  // Check if it's a subdomain (not localhost or IP)
  if (hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return null;
  }
  
  const parts = hostname.split('.');
  
  // Need at least 3 parts for subdomain (subdomain.domain.tld)
  if (parts.length < 3) {
    return null;
  }
  
  // Return the first part as subdomain
  return parts[0];
}

// Middleware to resolve tenant from subdomain
export async function resolveTenant(req: TenantRequest, res: Response, next: NextFunction) {
  try {
    const host = req.headers.host;
    const subdomain = extractSubdomain(host || '');
    
    if (subdomain) {
      // Find tenant by subdomain
      const tenants = Array.from(storage.tenants.values());
      const tenant = tenants.find(t => t.subdomain === subdomain);
      
      if (tenant) {
        req.tenant = {
          id: tenant.id,
          name: tenant.name,
          subdomain: tenant.subdomain,
          status: tenant.status,
          subscriptionPackageId: tenant.subscriptionPackageId
        };
      }
    }
    
    next();
  } catch (error) {
    console.error('Error resolving tenant:', error);
    next();
  }
}

// Middleware to require valid tenant
export function requireTenant(req: TenantRequest, res: Response, next: NextFunction) {
  if (!req.tenant) {
    return res.status(404).json({ 
      message: 'Tenant not found. Please check your subdomain.',
      code: 'TENANT_NOT_FOUND'
    });
  }
  
  // Check if tenant is active
  if (req.tenant.status === 'suspended') {
    return res.status(403).json({ 
      message: 'This account has been suspended. Please contact support.',
      code: 'TENANT_SUSPENDED'
    });
  }
  
  if (req.tenant.status === 'inactive') {
    return res.status(403).json({ 
      message: 'This account is inactive. Please contact support.',
      code: 'TENANT_INACTIVE'
    });
  }
  
  next();
}

// Middleware to check trial status
export function checkTrialStatus(req: TenantRequest, res: Response, next: NextFunction) {
  if (!req.tenant) {
    return next();
  }
  
  const tenant = storage.tenants.get(req.tenant.id);
  if (!tenant) {
    return next();
  }
  
  // Check if trial has expired
  if (tenant.status === 'trial' && tenant.trialEndsAt && new Date() > tenant.trialEndsAt) {
    return res.status(402).json({ 
      message: 'Your trial has expired. Please set up billing to continue.',
      code: 'TRIAL_EXPIRED',
      trialEndsAt: tenant.trialEndsAt
    });
  }
  
  next();
}

// Middleware to filter data by tenant
export function filterByTenant(req: TenantRequest, res: Response, next: NextFunction) {
  if (req.tenant) {
    // Add tenant context to request for data filtering
    req.query.tenantId = req.tenant.id;
  }
  
  next();
}