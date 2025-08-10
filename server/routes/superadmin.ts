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
import { eq, desc, and, ilike, count, or, sql } from 'drizzle-orm';
import { users, superAdmins } from '@shared/schema';

export function registerSuperAdminRoutes(app: Express) {
  // GET /api/superadmin/users - Get all users with pagination
  app.get('/api/superadmin/users', requireSuperAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      // Get users with tenant information
      const usersResult = await db.execute(sql`
        SELECT 
          u.id, u.email, u.first_name, u.last_name, u.email_verified, u.created_at,
          t.name as tenant_name, t.slug as tenant_slug,
          COUNT(*) OVER() as total_count
        FROM users u
        LEFT JOIN tenant_users tu ON u.id = tu.user_id
        LEFT JOIN tenants t ON tu.tenant_id = t.id
        WHERE u.email != 'eyosiasyimer@gmail.com'
        ORDER BY u.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `);

      const totalCount = usersResult.rows.length > 0 ? Number(usersResult.rows[0].total_count) : 0;

      res.json({
        data: usersResult.rows.map(row => ({
          id: row.id,
          email: row.email,
          firstName: row.first_name,
          lastName: row.last_name,
          emailVerified: row.email_verified,
          createdAt: row.created_at,
          tenantName: row.tenant_name,
          tenantSlug: row.tenant_slug,
        })),
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        }
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // DELETE /api/superadmin/users/:id - Delete a user
  app.delete('/api/superadmin/users/:id', requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;

      // Check if user exists
      const userResult = await db.execute(sql`
        SELECT id, email FROM users WHERE id = ${id} AND email != 'eyosiasyimer@gmail.com'
      `);

      if (userResult.rows.length === 0) {
        return res.status(404).json({ message: 'User not found or cannot delete the super admin' });
      }

      // Check if user has tenants
      const tenantCheck = await db.execute(sql`
        SELECT COUNT(*) as tenant_count
        FROM tenant_users
        WHERE user_id = ${id}
      `);

      const hasTenants = Number(tenantCheck.rows[0]?.tenant_count || 0) > 0;

      if (hasTenants) {
        // Delete tenant relationships first
        await db.execute(sql`DELETE FROM tenant_users WHERE user_id = ${id}`);
      }

      // Delete the user
      await db.execute(sql`DELETE FROM users WHERE id = ${id}`);

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

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
            ilike(tenants.slug, `%${search}%`)
          )
        );
      }
      if (status && status !== 'all') {
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
    } catch (error: any) {
      console.error('Error updating tenant:', error);
      res.status(500).json({ message: 'Error updating tenant' });
    }
  });

  // Get tenant details with user count and feature package info
  app.get('/api/superadmin/tenants/:id', requireSuperAdmin, async (req, res) => {
    try {
      const tenantId = req.params.id;

      // Use direct SQL to avoid schema issues
      const tenantResult = await db.execute(sql`
        SELECT * FROM tenants WHERE id = ${tenantId}
      `);
      const tenant = tenantResult.rows[0];
      
      if (!tenant) {
        return res.status(404).json({ message: 'Tenant not found' });
      }

      // Get user count - simplified since tenant_users table may not exist yet
      const userCountResult = await db.execute(sql`
        SELECT COUNT(*) as count FROM users WHERE role != 'superadmin'
      `);
      
      // Get feature package info if exists
      let featurePackage = null;
      if (tenant.feature_package_id) {
        const packageResult = await db.execute(sql`
          SELECT * FROM feature_packages WHERE id = ${tenant.feature_package_id}
        `);
        featurePackage = packageResult.rows[0];
      }

      res.json({
        ...tenant,
        userCount: Number(userCountResult.rows[0]?.count || 0),
        featurePackage
      });
    } catch (error: any) {
      console.error('Error fetching tenant details:', error);
      res.status(500).json({ message: 'Error fetching tenant details' });
    }
  });

  // Get all feature packages
  app.get('/api/superadmin/feature-packages', requireSuperAdmin, async (req, res) => {
    try {
      // Use direct SQL to avoid schema issues
      const result = await db.execute(sql`
        SELECT id, name, slug, description, price_monthly, price_yearly, limits, features, billing_modes, status, trial_days, created_at
        FROM feature_packages 
        ORDER BY sort_order ASC, name ASC
      `);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Error fetching feature packages:', error);
      res.status(500).json({ message: 'Error fetching feature packages' });
    }
  });

  // Create feature package
  app.post('/api/superadmin/feature-packages', requireSuperAdmin, async (req: any, res) => {
    try {
      console.log('Creating feature package with data:', req.body);
      
      const packageData = {
        name: req.body.name,
        slug: req.body.slug || req.body.name.toLowerCase().replace(/\s+/g, '-'),
        description: req.body.description,
        status: 'active',
        limits: JSON.stringify(req.body.limits || {}),
        features: JSON.stringify(req.body.features || {}),
        priceMonthly: parseFloat(req.body.priceMonthly) || 0,
        priceYearly: parseFloat(req.body.priceYearly) || 0,
        billingModes: JSON.stringify({
          monthly: { 
            amount: Math.round((parseFloat(req.body.priceMonthly) || 0) * 100), 
            currency: 'USD' 
          },
          yearly: { 
            amount: Math.round((parseFloat(req.body.priceYearly) || 0) * 100), 
            currency: 'USD' 
          }
        }),
        sortOrder: 0,
        trialDays: 14
      };
      
      console.log('Processed package data:', packageData);
      
      // Use direct SQL insert to avoid schema validation issues
      const result = await db.execute(sql`
        INSERT INTO feature_packages (
          name, slug, description, status, limits, features, 
          price_monthly, price_yearly, billing_modes, sort_order, trial_days
        ) VALUES (
          ${packageData.name},
          ${packageData.slug},
          ${packageData.description},
          ${packageData.status},
          ${packageData.limits},
          ${packageData.features},
          ${packageData.priceMonthly},
          ${packageData.priceYearly},
          ${packageData.billingModes},
          ${packageData.sortOrder},
          ${packageData.trialDays}
        ) RETURNING *
      `);

      const newPackage = result.rows[0];
      console.log('Created package:', newPackage);

      res.status(201).json(newPackage);
    } catch (error) {
      console.error('Error creating feature package:', error);
      console.error('Error details:', error.message, error.stack);
      res.status(500).json({ 
        message: 'Error creating feature package',
        error: error.message 
      });
    }
  });

  // Update feature package
  app.put('/api/superadmin/feature-packages/:id', requireSuperAdmin, async (req: any, res) => {
    try {
      const packageId = req.params.id;
      console.log('Updating feature package:', packageId, 'with data:', req.body);
      
      const packageData = {
        name: req.body.name,
        slug: req.body.slug || req.body.name.toLowerCase().replace(/\s+/g, '-'),
        description: req.body.description,
        status: req.body.status || 'active',
        limits: JSON.stringify(req.body.limits || {}),
        features: JSON.stringify(req.body.features || {}),
        priceMonthly: parseFloat(req.body.priceMonthly) || 0,
        priceYearly: parseFloat(req.body.priceYearly) || 0,
        billingModes: JSON.stringify({
          monthly: { 
            amount: Math.round((parseFloat(req.body.priceMonthly) || 0) * 100), 
            currency: 'USD' 
          },
          yearly: { 
            amount: Math.round((parseFloat(req.body.priceYearly) || 0) * 100), 
            currency: 'USD' 
          }
        }),
        trialDays: req.body.trialDays || 14
      };
      
      console.log('Processed update data:', packageData);
      
      // Use direct SQL update
      const result = await db.execute(sql`
        UPDATE feature_packages SET
          name = ${packageData.name},
          slug = ${packageData.slug},
          description = ${packageData.description},
          status = ${packageData.status},
          limits = ${packageData.limits},
          features = ${packageData.features},
          price_monthly = ${packageData.priceMonthly},
          price_yearly = ${packageData.priceYearly},
          billing_modes = ${packageData.billingModes},
          trial_days = ${packageData.trialDays},
          updated_at = NOW()
        WHERE id = ${packageId}
        RETURNING *
      `);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Feature package not found' });
      }

      const updatedPackage = result.rows[0];
      console.log('Updated package:', updatedPackage);

      res.json(updatedPackage);
    } catch (error) {
      console.error('Error updating feature package:', error);
      console.error('Error details:', error.message, error.stack);
      res.status(500).json({ 
        message: 'Error updating feature package',
        error: error.message 
      });
    }
  });

  // Delete feature package
  app.delete('/api/superadmin/feature-packages/:id', requireSuperAdmin, async (req: any, res) => {
    try {
      const packageId = req.params.id;
      console.log('Deleting feature package:', packageId);

      // Check if any tenants are using this package
      const tenantsUsingPackage = await db
        .select({ count: count() })
        .from(tenants)
        .where(eq(tenants.featurePackageId, packageId));

      if (tenantsUsingPackage[0].count > 0) {
        return res.status(400).json({ 
          message: `Cannot delete feature package. ${tenantsUsingPackage[0].count} tenant(s) are currently using this package.`
        });
      }

      // Delete the package
      const result = await db.execute(sql`
        DELETE FROM feature_packages 
        WHERE id = ${packageId}
        RETURNING *
      `);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Feature package not found' });
      }

      console.log('Deleted package:', result.rows[0]);
      res.json({ message: 'Feature package deleted successfully' });
    } catch (error) {
      console.error('Error deleting feature package:', error);
      res.status(500).json({ 
        message: 'Error deleting feature package',
        error: error.message 
      });
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

      // For now, return empty audit logs since the table may not be fully set up
      res.json({
        data: [],
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: 0,
          totalPages: 0
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
      // Get basic counts using direct SQL to avoid schema issues
      const tenantCount = await db.execute(sql`SELECT COUNT(*) as count FROM tenants`);
      const activeTenantsCount = await db.execute(sql`SELECT COUNT(*) as count FROM tenants`); // Remove status filter for now
      const totalUsersCount = await db.execute(sql`SELECT COUNT(*) as count FROM users`);

      // For now, return basic analytics without recent activity since audit_logs may not exist
      res.json({
        totalTenants: Number(tenantCount.rows[0]?.count || 0),
        activeTenants: Number(activeTenantsCount.rows[0]?.count || 0),
        totalUsers: Number(totalUsersCount.rows[0]?.count || 0),
        recentActivity: []
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({ message: 'Error fetching analytics' });
    }
  });

  // Transfer super admin privileges - EMERGENCY USE ONLY
  app.post('/api/superadmin/transfer-privileges', requireSuperAdmin, async (req: any, res) => {
    try {
      const { newAdminEmail } = req.body;
      
      if (!newAdminEmail) {
        return res.status(400).json({ message: 'New admin email is required' });
      }

      // Find the new admin user
      const [newAdminUser] = await db.select().from(users).where(eq(users.email, newAdminEmail));
      
      if (!newAdminUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Start transaction to transfer privileges
      await db.transaction(async (tx) => {
        // Remove current super admin
        await tx.delete(superAdmins).where(eq(superAdmins.userId, req.user.id));
        
        // Add new super admin
        await tx.insert(superAdmins).values({
          userId: newAdminUser.id,
          createdAt: new Date()
        });
      });

      // Log the transfer
      await AuditService.logCreate(
        'system',
        req.user.id,
        'super_admin_transfer',
        newAdminUser.id,
        { 
          fromUser: req.user.id,
          toUser: newAdminUser.id,
          timestamp: new Date()
        }
      );

      res.json({ 
        message: 'Super admin privileges transferred successfully',
        newAdminEmail: newAdminUser.email 
      });
    } catch (error: any) {
      console.error('Error transferring super admin privileges:', error);
      res.status(500).json({ message: 'Error transferring privileges' });
    }
  });
}