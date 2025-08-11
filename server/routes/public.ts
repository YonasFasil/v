import type { Express } from "express";
import { firestoreStorage } from '../storage/firestore';

export function registerPublicRoutes(app: Express) {
  // GET /api/public/plans - Get active pricing plans
  app.get('/api/public/plans', async (req, res) => {
    try {
      // Get all active feature packages from Firestore
      const allPackages = await firestoreStorage.getFeaturePackages();
      const activePackages = allPackages.filter((pkg: any) => 
        pkg.isActive === true && pkg.status === 'active'
      );

      // Transform to expected format for frontend
      const transformedPlans = activePackages.map((plan: any) => ({
        id: plan.id,
        name: plan.name,
        slug: plan.slug || plan.name?.toLowerCase().replace(/\s+/g, '-'),
        description: plan.description,
        billingModes: plan.billingModes || ['monthly'],
        limits: plan.limits || { staff: 5, venues: 1 },
        flags: plan.features || {},
        trialDays: plan.trialDays || 14,
        features: Object.keys(plan.features || {}),
        priceMonthly: plan.priceMonthly || plan.price_monthly || 0
      }));

      res.json(transformedPlans);
    } catch (error) {
      console.error('Error fetching public plans:', error);
      res.status(500).json({ message: 'Error fetching plans' });
    }
  });

  // GET /api/public/features - Get curated feature list
  app.get('/api/public/features', async (req, res) => {
    try {
      // Return a standard feature list for now
      const features = [
        { id: 'venues', name: 'Multi-Venue Management', category: 'venues' },
        { id: 'bookings', name: 'Event Booking System', category: 'bookings' },
        { id: 'customers', name: 'Customer Management', category: 'customers' },
        { id: 'leads', name: 'Lead Tracking', category: 'leads' },
        { id: 'proposals', name: 'Proposal Generation', category: 'proposals' },
        { id: 'payments', name: 'Payment Processing', category: 'payments' },
        { id: 'ai_insights', name: 'AI-Powered Insights', category: 'ai' },
        { id: 'reporting', name: 'Advanced Reporting', category: 'reporting' }
      ];
      
      res.json(features);
    } catch (error) {
      console.error('Error fetching features:', error);
      res.status(500).json({ message: 'Error fetching features' });
    }
  });
}