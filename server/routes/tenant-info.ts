import type { Express } from 'express';
import { firestoreStorage } from '../storage/firestore';

export function registerTenantInfoRoutes(app: Express) {
  // GET /api/tenant/info - Get current tenant information and features
  app.get('/api/tenant/info', async (req, res) => {
    try {
      // Get tenant info from session or request headers
      const session = req.session as any;
      let tenantSlug = session?.tenantSlug;
      
      // For Firebase auth, check if we can get tenant from URL or auth context
      if (!tenantSlug) {
        // Try to get from URL path (e.g., /t/tenant-slug/...)
        const pathMatch = req.path.match(/^\/t\/([^\/]+)/);
        tenantSlug = pathMatch ? pathMatch[1] : null;
      }
      
      // If still no tenant slug, get from Firebase user context
      if (!tenantSlug) {
        // Get the Firebase user from the request
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          try {
            const { serverFirebaseOps } = await import('../firebase-client');
            const idToken = authHeader.substring(7);
            const decodedToken = await serverFirebaseOps.verifyIdToken(idToken);
            
            // For the user who just created "eventseas", return that tenant
            if (decodedToken.email === 'yonassalelew@gmail.com') {
              tenantSlug = 'eventseas';
            }
          } catch (error) {
            console.error('Error verifying Firebase token:', error);
          }
        }
        
        // Fallback to eventseas for now since it's the only tenant
        if (!tenantSlug) {
          tenantSlug = 'eventseas';
        }
      }
      
      if (!tenantSlug) {
        return res.status(401).json({ message: 'No tenant context found' });
      }

      // For now, return mock Enterprise tenant data since you just created "eventseas"
      // This will be replaced with proper Firebase lookup when needed
      const tenant = {
        id: 'f702f094-01ef-4d49-baea-01e07620928c',
        name: 'Eventsea',
        slug: 'eventseas',
        industry: 'Conference Centers',
        planId: 'enterprise',
        features: {
          "dashboard-analytics": true,
          "event-management": true,
          "customer-management": true,
          "lead-management": true,
          "proposal-system": true,
          "stripe-payments": true,
          "venue-management": true,
          "service-packages": true,
          "gmail-integration": true,
          "task-management": true,
          "ai-voice-booking": true,
          "ai-scheduling": true,
          "ai-email-replies": true,
          "ai-lead-scoring": true,
          "ai-insights": true,
          "ai-proposal-generation": true,
          "mobile-responsive": true,
          "audit-logs": true,
          "custom-branding": true,
          "priority-support": true,
          "api-access": true,
          "advanced-reporting": true,
          "calendar-integration": true,
          "floor-plan-designer": true
        },
        limits: {
          maxUsers: 10,
          maxVenues: 1,
          maxSpacesPerVenue: 1
        },
        status: 'active'
      };
      
      if (!tenant) {
        return res.status(404).json({ message: 'Tenant not found' });
      }

      // Return tenant info with features and limits
      res.json({
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        industry: tenant.industry,
        planId: tenant.planId,
        features: tenant.features || {},
        limits: tenant.limits || {},
        status: tenant.status
      });
    } catch (error) {
      console.error('Error fetching tenant info:', error);
      res.status(500).json({ message: 'Failed to fetch tenant information' });
    }
  });
}