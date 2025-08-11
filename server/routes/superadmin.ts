import type { Express } from 'express';
import { authenticateFirebase, requireSuperAdmin, type AuthenticatedRequest } from '../middleware/firebase-auth';
import { firestoreStorage } from '../storage/firestore';

export function registerSuperAdminRoutes(app: Express) {
  // Apply Firebase authentication middleware to all super admin routes
  app.use('/api/superadmin/*', authenticateFirebase, requireSuperAdmin);

  // GET /api/superadmin/users - Get all users with pagination
  app.get('/api/superadmin/users', async (req: AuthenticatedRequest, res) => {
    try {
      const users = await firestoreStorage.getUsers();
      
      res.json({
        data: users.filter(user => user.email !== 'yonasfasil.sl@gmail.com'),
        pagination: {
          total: users.length,
          page: 1,
          limit: users.length,
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
      await firestoreStorage.deleteUser(id);
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Failed to delete user' });
    }
  });

  // GET /api/superadmin/analytics - Get platform analytics
  app.get('/api/superadmin/analytics', async (req: AuthenticatedRequest, res) => {
    try {
      const analytics = await firestoreStorage.getAnalytics();
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
      
      const tenants = await firestoreStorage.getTenants(searchTerm, statusFilter);
      
      res.json({
        data: tenants,
        pagination: {
          total: tenants.length,
          page: 1,
          limit: tenants.length,
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
      const packages = await firestoreStorage.getFeaturePackages();
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
      if (Array.isArray(packageData.features)) {
        const featuresObj: any = {};
        packageData.features.forEach((feature: string) => {
          featuresObj[feature] = true;
        });
        packageData.features = featuresObj;
      }
      
      // Set up package structure
      const newPackage = await firestoreStorage.createFeaturePackage({
        name: packageData.name,
        description: packageData.description,
        features: packageData.features || {},
        limits: {
          staff: packageData.maxUsers || packageData.limits?.staff || 5,
          venues: packageData.limits?.venues || 1
        },
        price_monthly: packageData.priceMonthly || packageData.price_monthly || 0,
        priceMonthly: packageData.priceMonthly || packageData.price_monthly || 0,
        status: packageData.isActive ? 'active' : 'inactive',
        isActive: packageData.isActive !== false
      });
      
      res.status(201).json(newPackage);
    } catch (error) {
      console.error('Error creating feature package:', error);
      res.status(500).json({ message: 'Failed to create feature package' });
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