import type { Express } from 'express';
import { firestoreStorage } from '../storage/firestore';

export function registerPublicRoutes(app: Express) {
  // GET /api/public/plans - Get available plans for the public (no auth required)
  app.get('/api/public/plans', async (req, res) => {
    try {
      const packages = await firestoreStorage.getFeaturePackages();
      
      // Filter for active packages and format for public consumption
      const publicPackages = packages
        .filter((pkg: any) => pkg.status === 'active')
        .map((pkg: any) => ({
          id: pkg.id,
          name: pkg.name,
          slug: pkg.slug,
          description: pkg.description,
          priceMonthly: pkg.priceMonthly,
          priceYearly: pkg.priceYearly,
          features: pkg.features,
          limits: pkg.limits,
          popular: pkg.popular || false,
          status: pkg.status
        }))
        .sort((a: any, b: any) => a.priceMonthly - b.priceMonthly);
      
      res.json(publicPackages);
    } catch (error) {
      console.error('Error fetching public plans:', error);
      res.status(500).json({ message: 'Failed to fetch plans' });
    }
  });
}