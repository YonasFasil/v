import type { Express } from 'express';
import { db } from '../db';
import { users, superAdmins } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Development helper routes - only available in development
export function registerDevRoutes(app: Express) {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  // Make current user a superadmin (development only)
  app.post('/api/dev/make-superadmin', async (req: any, res) => {
    try {
      // For development, use dev user ID from header or default
      const userId = req.headers['x-dev-user-id'] || req.user?.id || 'dev-user-123';

      // Check if already a superadmin
      const [existingSuperAdmin] = await db
        .select()
        .from(superAdmins)
        .where(eq(superAdmins.userId, userId))
        .limit(1);

      if (existingSuperAdmin) {
        return res.json({ 
          message: 'Already a superadmin',
          superAdmin: existingSuperAdmin 
        });
      }

      // Create superadmin record
      const [newSuperAdmin] = await db
        .insert(superAdmins)
        .values({
          userId: userId,
        })
        .returning();

      res.json({ 
        message: 'Successfully made user a superadmin',
        superAdmin: newSuperAdmin
      });
    } catch (error) {
      console.error('Error making user superadmin:', error);
      res.status(500).json({ message: 'Error creating superadmin' });
    }
  });

  // Create a test tenant (development only)
  app.post('/api/dev/create-test-tenant', async (req: any, res) => {
    try {
      const { tenants, tenantUsers } = await import('@shared/schema');
      
      const [newTenant] = await db
        .insert(tenants)
        .values({
          name: 'Test Organization',
          slug: 'test-org',
          contactName: 'Test User',
          contactEmail: 'test@example.com',
          status: 'active',
        })
        .returning();

      if (req.user?.id) {
        // Link current user to the test tenant
        await db
          .insert(tenantUsers)
          .values({
            tenantId: newTenant.id,
            userId: req.user.id,
            role: 'manager',
            status: 'active',
          });
      }

      res.json({ 
        message: 'Test tenant created successfully',
        tenant: newTenant
      });
    } catch (error) {
      console.error('Error creating test tenant:', error);
      res.status(500).json({ message: 'Error creating test tenant' });
    }
  });
}