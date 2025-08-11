import type { Express } from 'express';
import { authenticateFirebase, requireSuperAdmin, type AuthenticatedRequest } from '../middleware/firebase-auth';
import { db } from '../db';
import { featurePackages, tenants, users, tenantUsers } from '@shared/schema';
import { eq, sql, like, and } from 'drizzle-orm';

export function registerSuperAdminRoutes(app: Express) {
  // Apply Firebase authentication middleware to all super admin routes
  app.use('/api/superadmin/*', authenticateFirebase, requireSuperAdmin);

  // GET /api/superadmin/users - Get all users with pagination
  app.get('/api/superadmin/users', async (req: AuthenticatedRequest, res) => {
    try {
      const allUsers = await db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          emailVerified: users.emailVerified,
          createdAt: users.createdAt
        })
        .from(users)
        .where(sql`${users.email} != 'yonasfasil.sl@gmail.com'`);
      
      res.json({
        data: allUsers,
        pagination: {
          total: allUsers.length,
          page: 1,
          limit: allUsers.length,
          totalPages: 1
        }
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  // DELETE /api/superadmin/users/:id - Delete a user
  app.delete('/api/superadmin/users/:id', async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      
      // Delete user's tenant associations first
      await db.delete(tenantUsers).where(eq(tenantUsers.userId, id));
      
      // Delete the user
      await db.delete(users).where(eq(users.id, id));
      
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Failed to delete user' });
    }
  });

  // GET /api/superadmin/analytics - Get platform analytics
  app.get('/api/superadmin/analytics', async (req: AuthenticatedRequest, res) => {
    try {
      // Get counts from PostgreSQL database
      const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
      const [tenantCount] = await db.select({ count: sql<number>`count(*)` }).from(tenants);
      const [packageCount] = await db.select({ count: sql<number>`count(*)` }).from(featurePackages);
      
      const analytics = {
        totalUsers: userCount.count,
        totalTenants: tenantCount.count,
        totalPackages: packageCount.count,
        activeUsers: userCount.count, // All users are considered active for now
        activeTenants: tenantCount.count
      };
      
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({ message: 'Failed to fetch analytics' });
    }
  });

  // GET /api/superadmin/tenants - Get all tenants with search and filter
  app.get('/api/superadmin/tenants', async (req: AuthenticatedRequest, res) => {
    try {
      const searchTerm = req.query.search as string;
      const statusFilter = req.query.status as string;
      
      let query = db.select().from(tenants);
      
      if (searchTerm) {
        query = query.where(like(tenants.name, `%${searchTerm}%`));
      }
      
      if (statusFilter) {
        query = query.where(eq(tenants.status, statusFilter));
      }
      
      const allTenants = await query;
      
      res.json({
        data: allTenants,
        pagination: {
          total: allTenants.length,
          page: 1,
          limit: allTenants.length,
          totalPages: 1
        }
      });
    } catch (error) {
      console.error('Error fetching tenants:', error);
      res.status(500).json({ message: 'Failed to fetch tenants' });
    }
  });

  // POST /api/superadmin/tenants - Create a new tenant
  app.post('/api/superadmin/tenants', async (req: AuthenticatedRequest, res) => {
    try {
      const tenantData = req.body;
      const newTenant = await firestoreStorage.createTenant(tenantData);
      res.status(201).json(newTenant);
    } catch (error) {
      console.error('Error creating tenant:', error);
      res.status(500).json({ message: 'Failed to create tenant' });
    }
  });

  // GET /api/superadmin/feature-packages - Get all feature packages
  app.get('/api/superadmin/feature-packages', async (req: AuthenticatedRequest, res) => {
    try {
      const packages = await db
        .select()
        .from(featurePackages)
        .orderBy(featurePackages.sortOrder, featurePackages.createdAt);
      res.json(packages);
    } catch (error) {
      console.error('Error fetching feature packages:', error);
      res.status(500).json({ message: 'Failed to fetch feature packages' });
    }
  });

  // POST /api/superadmin/feature-packages - Create a new feature package
  app.post('/api/superadmin/feature-packages', async (req: AuthenticatedRequest, res) => {
    try {
      const packageData = req.body;
      
      // Convert features array to features object for compatibility
      let featuresObj = packageData.features || {};
      if (Array.isArray(packageData.features)) {
        featuresObj = {};
        packageData.features.forEach((feature: string) => {
          featuresObj[feature] = true;
        });
      }
      
      // Generate slug from name
      const slug = packageData.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      
      const newPackage = await db
        .insert(featurePackages)
        .values({
          name: packageData.name,
          slug: slug,
          description: packageData.description || null,
          features: featuresObj,
          limits: {
            maxUsers: packageData.maxUsers || packageData.limits?.staff || 5,
            maxVenues: packageData.limits?.venues || 1,
            maxSpacesPerVenue: packageData.limits?.maxSpacesPerVenue || 10
          },
          billingModes: {
            monthly: {
              amount: Math.round((packageData.priceMonthly || 0) * 100), // Convert to cents
              currency: 'usd'
            }
          },
          priceMonthly: (packageData.priceMonthly || 0).toString(),
          status: packageData.isActive ? 'active' : 'draft',
          sortOrder: 0
        })
        .returning();
      
      res.status(201).json(newPackage[0]);
    } catch (error) {
      console.error('Error creating feature package:', error);
      res.status(500).json({ message: 'Failed to create feature package', details: (error as Error).message });
    }
  });

  // PUT /api/superadmin/feature-packages/:id - Update a feature package
  app.put('/api/superadmin/feature-packages/:id', async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // Convert features array to features object if needed
      if (Array.isArray(updateData.features)) {
        const featuresObj: any = {};
        updateData.features.forEach((feature: string) => {
          featuresObj[feature] = true;
        });
        updateData.features = featuresObj;
      }
      
      const updatedPackage = await firestoreStorage.updateFeaturePackage(id, updateData);
      
      if (!updatedPackage) {
        return res.status(404).json({ message: 'Feature package not found' });
      }
      
      res.json(updatedPackage);
    } catch (error) {
      console.error('Error updating feature package:', error);
      res.status(500).json({ message: 'Failed to update feature package' });
    }
  });

  // DELETE /api/superadmin/feature-packages/:id - Delete a feature package
  app.delete('/api/superadmin/feature-packages/:id', async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const success = await firestoreStorage.deleteFeaturePackage(id);
      
      if (!success) {
        return res.status(404).json({ message: 'Feature package not found' });
      }
      
      res.json({ message: 'Feature package deleted successfully' });
    } catch (error) {
      console.error('Error deleting feature package:', error);
      res.status(500).json({ message: 'Failed to delete feature package' });
    }
  });
}