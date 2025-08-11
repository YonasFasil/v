import type { Express } from 'express';
import { db } from '../db';
import { tenants, featurePackages } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';
import { tenantContext } from '../middleware/tenantContext';

export function registerTenantInfoRoutes(app: Express) {
  // GET /api/tenant/info - Get current tenant information and features
  app.get('/api/tenant/info', requireAuth, async (req: any, res) => {
    try {
      const tenantId = req.user?.currentTenant?.id;
      
      if (!tenantId) {
        return res.status(403).json({ message: 'Tenant access required' });
      }

      // Get tenant with their plan features and limits
      const [tenantWithPlan] = await db
        .select({
          tenant: {
            id: tenants.id,
            name: tenants.name,
            slug: tenants.slug,
            industry: tenants.industry,
            planId: tenants.planId,
            status: tenants.status,
            contactName: tenants.contactName,
            contactEmail: tenants.contactEmail,
            businessPhone: tenants.businessPhone,
            businessAddress: tenants.businessAddress,
            businessDescription: tenants.businessDescription,
            stripeCustomerId: tenants.stripeCustomerId,
            stripeSubscriptionId: tenants.stripeSubscriptionId,
            createdAt: tenants.createdAt,
            updatedAt: tenants.updatedAt
          },
          plan: {
            id: featurePackages.id,
            name: featurePackages.name,
            features: featurePackages.features,
            limits: featurePackages.limits
          }
        })
        .from(tenants)
        .leftJoin(featurePackages, eq(tenants.planId, featurePackages.id))
        .where(eq(tenants.id, tenantId))
        .limit(1);

      if (!tenantWithPlan) {
        return res.status(404).json({ message: 'Tenant not found' });
      }

      const { tenant, plan } = tenantWithPlan;

      // Return tenant info with real features from their actual plan
      res.json({
        ...tenant,
        planId: tenant.planId || 'starter',
        planName: plan?.name || 'Starter',
        
        // Real features and limits from the tenant's actual plan
        features: plan?.features as Record<string, boolean> || {},
        limits: plan?.limits as Record<string, number> || {},
      });
    } catch (error) {
      console.error('Error fetching tenant info:', error);
      res.status(500).json({ message: 'Failed to fetch tenant information' });
    }
  });
}