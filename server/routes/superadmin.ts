import type { Express } from 'express';
import { db } from '../db';
import { 
  tenants, 
  featurePackages, 
  tenantUsers, 
  auditLogs,
  type InsertTenant,
  type InsertFeaturePackage,
  type InsertTenantUser 
} from '@shared/schema';
import { requireSuperAdmin } from '../middleware/tenantContext';
import { AuditService } from '../services/auditService';
import { eq, desc, and, ilike, count, or } from 'drizzle-orm';

export function registerSuperAdminRoutes(app: Express) {
  // Get all tenants with pagination and search
  app.get('/api/superadmin/tenants', requireSuperAdmin, async (req: any, res) => {
    try {
      const { page = 1, limit = 10, search = '', status = '' } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      let conditions = [];
      if (search) {
        conditions.push(
          or(
            ilike(tenants.name, `%${search}%`),
            ilike(tenants.slug, `%${search}%`),
            ilike(tenants.contactEmail, `%${search}%`)
          )
        );
      }
      if (status) {
        conditions.push(eq(tenants.status, status));
      }

      const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

      const [tenantsData, totalCount] = await Promise.all([
        db.select().from(tenants)
          .where(whereCondition)
          .orderBy(desc(tenants.createdAt))
          .limit(parseInt(limit))
          .offset(offset),
        db.select({ count: count() }).from(tenants).where(whereCondition)
      ]);

      res.json({
        data: tenantsData,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount[0].count,
          totalPages: Math.ceil(totalCount[0].count / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('Error fetching tenants:', error);
      res.status(500).json({ message: 'Error fetching tenants' });
    }
  });

  // Create new tenant
  app.post('/api/superadmin/tenants', requireSuperAdmin, async (req: any, res) => {
    try {
      const tenantData: InsertTenant = req.body;
      
      const [newTenant] = await db.insert(tenants).values(tenantData).returning();

      // Log the creation
      await AuditService.logCreate(
        newTenant.id,
        req.user.id,
        'tenant',
        newTenant.id,
        newTenant
      );

      res.status(201).json(newTenant);
    } catch (error) {
      console.error('Error creating tenant:', error);
      res.status(500).json({ message: 'Error creating tenant' });
    }
  });

  // Update tenant
  app.put('/api/superadmin/tenants/:id', requireSuperAdmin, async (req: any, res) => {
    try {
      const tenantId = req.params.id;
      const updateData = req.body;

      // Get current tenant data for audit log
      const [currentTenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId));
      
      if (!currentTenant) {
        return res.status(404).json({ message: 'Tenant not found' });
      }

      const [updatedTenant] = await db
        .update(tenants)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(tenants.id, tenantId))
        .returning();

      // Log the update
      await AuditService.logUpdate(
        tenantId,
        req.user.id,
        'tenant',
        tenantId,
        currentTenant,
        updatedTenant
      );

      res.json(updatedTenant);
    } catch (error) {
      console.error('Error updating tenant:', error);
      res.status(500).json({ message: 'Error updating tenant' });
    }
  });

  // Get tenant details with user count and feature package info
  app.get('/api/superadmin/tenants/:id', requireSuperAdmin, async (req, res) => {
    try {
      const tenantId = req.params.id;

      const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId));
      
      if (!tenant) {
        return res.status(404).json({ message: 'Tenant not found' });
      }

      // Get user count
      const [userCount] = await db
        .select({ count: count() })
        .from(tenantUsers)
        .where(eq(tenantUsers.tenantId, tenantId));

      // Get feature package info if exists
      let featurePackage = null;
      if (tenant.featurePackageId) {
        [featurePackage] = await db
          .select()
          .from(featurePackages)
          .where(eq(featurePackages.id, tenant.featurePackageId));
      }

      res.json({
        ...tenant,
        userCount: userCount.count,
        featurePackage
      });
    } catch (error) {
      console.error('Error fetching tenant details:', error);
      res.status(500).json({ message: 'Error fetching tenant details' });
    }
  });

  // Get all feature packages
  app.get('/api/superadmin/feature-packages', requireSuperAdmin, async (req, res) => {
    try {
      const packages = await db.select().from(featurePackages).orderBy(desc(featurePackages.createdAt));
      res.json(packages);
    } catch (error) {
      console.error('Error fetching feature packages:', error);
      res.status(500).json({ message: 'Error fetching feature packages' });
    }
  });

  // Create feature package
  app.post('/api/superadmin/feature-packages', requireSuperAdmin, async (req: any, res) => {
    try {
      const packageData: InsertFeaturePackage = req.body;
      
      const [newPackage] = await db.insert(featurePackages).values(packageData).returning();

      res.status(201).json(newPackage);
    } catch (error) {
      console.error('Error creating feature package:', error);
      res.status(500).json({ message: 'Error creating feature package' });
    }
  });

  // Get audit logs with filtering
  app.get('/api/superadmin/audit-logs', requireSuperAdmin, async (req, res) => {
    try {
      const { 
        tenantId, 
        entityType, 
        entityId, 
        userId, 
        action, 
        page = 1, 
        limit = 50 
      } = req.query;

      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

      let conditions = [];
      if (tenantId) conditions.push(eq(auditLogs.tenantId, tenantId as string));
      if (entityType) conditions.push(eq(auditLogs.entityType, entityType as string));
      if (entityId) conditions.push(eq(auditLogs.entityId, entityId as string));
      if (userId) conditions.push(eq(auditLogs.userId, userId as string));
      if (action) conditions.push(eq(auditLogs.action, action as string));

      const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

      const [logs, totalCount] = await Promise.all([
        db.select().from(auditLogs)
          .where(whereCondition)
          .orderBy(desc(auditLogs.createdAt))
          .limit(parseInt(limit as string))
          .offset(offset),
        db.select({ count: count() }).from(auditLogs).where(whereCondition)
      ]);

      res.json({
        data: logs,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: totalCount[0].count,
          totalPages: Math.ceil(totalCount[0].count / parseInt(limit as string))
        }
      });
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      res.status(500).json({ message: 'Error fetching audit logs' });
    }
  });

  // Get platform analytics
  app.get('/api/superadmin/analytics', requireSuperAdmin, async (req, res) => {
    try {
      // Get basic counts
      const [tenantCount] = await db.select({ count: count() }).from(tenants);
      const [activeTenantsCount] = await db.select({ count: count() }).from(tenants).where(eq(tenants.status, 'active'));
      const [totalUsersCount] = await db.select({ count: count() }).from(tenantUsers);

      // Get recent activity
      const recentActivity = await db
        .select()
        .from(auditLogs)
        .orderBy(desc(auditLogs.createdAt))
        .limit(10);

      res.json({
        totalTenants: tenantCount.count,
        activeTenants: activeTenantsCount.count,
        totalUsers: totalUsersCount.count,
        recentActivity
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({ message: 'Error fetching analytics' });
    }
  });
}