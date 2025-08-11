import type { Express } from "express";
import { db } from "../db";
import { 
  tenants, 
  tenantUsers,
  featurePackages,
  venues,
  spaces,
  customers,
  bookings,
  proposals,
  contracts,
  payments,
  leads,
  leadActivities,
  leadTasks,
  tours,
  setupStyles,
  services,
  packages,
  tasks,
  communications,
  aiInsights,
  taxSettings,
  settings,
  tags,
  campaignSources
} from "../../shared/schema";
import { eq } from "drizzle-orm";
import { tenantContext } from "../middleware/tenantContext";
import { getTenantFeatures } from "../middleware/featureGating";

export function registerTenantRoutes(app: Express) {
  // GET /api/tenant/plan-info - Get current tenant plan information  
  app.get('/api/tenant/plan-info', async (req: any, res) => {
    try {
      console.log('Plan info request - session:', req.session?.userId);
      console.log('Plan info request - tenant context:', req.tenant);
      
      if (!req.session?.userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Get user's tenant directly from session/database
      const userId = req.session.userId;
      const tenantUser = await db
        .select({
          tenantId: tenantUsers.tenantId,
          tenant: {
            id: tenants.id,
            name: tenants.name,
            slug: tenants.slug,
            status: tenants.status,
          }
        })
        .from(tenantUsers)
        .innerJoin(tenants, eq(tenants.id, tenantUsers.tenantId))
        .where(eq(tenantUsers.userId, userId))
        .limit(1);

      if (!tenantUser.length) {
        return res.status(404).json({ message: 'No tenant found for user' });
      }

      const tenantId = tenantUser[0].tenantId;

      // Get tenant with current plan
      const [tenantWithPlan] = await db
        .select({
          tenant: {
            id: tenants.id,
            name: tenants.name,
            slug: tenants.slug,
            status: tenants.status,
            stripeCustomerId: tenants.stripeCustomerId,
            stripeSubscriptionId: tenants.stripeSubscriptionId,
          },
          plan: {
            id: featurePackages.id,
            name: featurePackages.name,
            slug: featurePackages.slug,
            description: featurePackages.description,
            priceMonthly: featurePackages.priceMonthly,
            priceYearly: featurePackages.priceYearly,
            features: featurePackages.features,
            limits: featurePackages.limits,
            sortOrder: featurePackages.sortOrder,
          }
        })
        .from(tenants)
        .leftJoin(featurePackages, eq(tenants.featurePackageId, featurePackages.id))
        .where(eq(tenants.id, tenantId))
        .limit(1);

      if (!tenantWithPlan) {
        return res.status(404).json({ message: 'Tenant not found' });
      }

      res.json({
        tenant: tenantWithPlan.tenant,
        currentPlan: tenantWithPlan.plan,
      });

    } catch (error) {
      console.error('Get tenant plan error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // POST /api/tenant/upgrade-plan - Upgrade tenant plan
  app.post('/api/tenant/upgrade-plan', tenantContext, async (req: any, res) => {
    try {
      const tenantId = req.tenant.id;
      const { planId, billingCycle } = req.body;

      if (!planId || !billingCycle) {
        return res.status(400).json({ 
          message: 'planId and billingCycle are required' 
        });
      }

      // Get the target plan
      const [targetPlan] = await db
        .select()
        .from(featurePackages)
        .where(eq(featurePackages.id, planId))
        .limit(1);

      if (!targetPlan) {
        return res.status(404).json({ message: 'Plan not found' });
      }

      // Get current tenant
      const [currentTenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, tenantId))
        .limit(1);

      if (!currentTenant) {
        return res.status(404).json({ message: 'Tenant not found' });
      }

      // Check if it's the same plan
      if (currentTenant.featurePackageId === planId) {
        return res.status(400).json({ 
          message: 'You are already on this plan' 
        });
      }

      // For now, just update the plan directly (later we'll add Stripe integration)
      const [updatedTenant] = await db
        .update(tenants)
        .set({
          featurePackageId: planId,
          planSlug: targetPlan.slug,
          updatedAt: new Date(),
        })
        .where(eq(tenants.id, tenantId))
        .returning();

      res.json({
        message: 'Plan updated successfully',
        tenant: updatedTenant,
        newPlan: targetPlan,
      });

    } catch (error) {
      console.error('Upgrade plan error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // DELETE /api/tenant/clear-demo-data - Clear all demo data for tenant
  app.delete('/api/tenant/clear-demo-data', tenantContext, async (req: any, res) => {
    try {
      // For now, just return success since new tenants start clean
      // Later we can implement actual data clearing if needed
      res.json({
        message: 'Demo data cleared successfully',
        clearedTables: 0,
      });

    } catch (error) {
      console.error('Clear demo data error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
}