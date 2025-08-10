import type { Express } from "express";
import { db } from "../db";
import { featurePackages } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export function registerPublicRoutes(app: Express) {
  // GET /api/public/plans - Get active pricing plans
  app.get('/api/public/plans', async (req, res) => {
    try {
      const activePlans = await db
        .select({
          id: featurePackages.id,
          name: featurePackages.name,
          slug: featurePackages.slug,
          billingModes: featurePackages.billingModes,
          limits: featurePackages.limits,
          flags: featurePackages.flags,
          trialDays: featurePackages.trialDays,
        })
        .from(featurePackages)
        .where(eq(featurePackages.status, 'active'))
        .orderBy(featurePackages.sortOrder);

      res.json(activePlans);
    } catch (error) {
      console.error('Error fetching public plans:', error);
      res.status(500).json({ message: 'Error fetching plans' });
    }
  });

  // GET /api/public/features - Get curated feature list
  app.get('/api/public/features', async (req, res) => {
    try {
      // Curated list of features from the current app capabilities
      const features = [
        {
          id: 'smart-booking',
          title: 'Smart Booking Management',
          description: 'Automated scheduling with conflict detection, multi-date event support, and intelligent calendar management.',
          icon: 'Calendar',
          category: 'booking',
          benefits: [
            'Automated conflict detection',
            'Multi-date event support',
            'Interactive calendar interface',
            'Booking status tracking'
          ]
        },
        {
          id: 'customer-management',
          title: 'Customer & Lead Management',
          description: 'Complete CRM with lead scoring, UTM tracking, and automated customer lifecycle management.',
          icon: 'Users',
          category: 'crm',
          benefits: [
            'Lead capture & scoring',
            'Customer relationship tracking',
            'Communication history',
            'UTM campaign tracking'
          ]
        },
        {
          id: 'proposal-system',
          title: 'Professional Proposals',
          description: 'Generate, send, and track professional proposals with digital signatures and auto-conversion.',
          icon: 'FileText',
          category: 'proposals',
          benefits: [
            'Professional proposal generation',
            'Email delivery & tracking',
            'Digital signature collection',
            'Auto-conversion to bookings'
          ]
        },
        {
          id: 'payment-processing',
          title: 'Secure Payment Processing',
          description: 'Integrated Stripe Connect for secure payments, automated invoicing, and deposit management.',
          icon: 'CreditCard',
          category: 'payments',
          benefits: [
            'Secure Stripe integration',
            'Automated invoicing',
            'Deposit management',
            'Payment tracking'
          ]
        },
        {
          id: 'venue-management',
          title: 'Multi-Venue Management',
          description: 'Manage multiple venues and spaces with capacity tracking, amenity management, and flexible pricing.',
          icon: 'Building',
          category: 'venues',
          benefits: [
            'Multi-venue support',
            'Space capacity management',
            'Amenity tracking',
            'Flexible pricing models'
          ]
        },
        {
          id: 'ai-automation',
          title: 'AI-Powered Automation',
          description: 'Voice-to-text booking capture, smart scheduling, automated emails, and predictive analytics.',
          icon: 'Zap',
          category: 'ai',
          benefits: [
            'Voice-to-text booking',
            'Smart scheduling suggestions',
            'Automated email responses',
            'Predictive analytics'
          ]
        },
        {
          id: 'analytics-insights',
          title: 'Advanced Analytics',
          description: 'Real-time business insights, booking pipeline visualization, and comprehensive reporting.',
          icon: 'BarChart3',
          category: 'analytics',
          benefits: [
            'Real-time dashboards',
            'Pipeline visualization',
            'Performance metrics',
            'Custom reports'
          ]
        },
        {
          id: 'team-collaboration',
          title: 'Team Management',
          description: 'Task assignment, role-based access, team collaboration tools, and activity tracking.',
          icon: 'Users2',
          category: 'team',
          benefits: [
            'Task assignment & tracking',
            'Role-based permissions',
            'Team collaboration',
            'Activity monitoring'
          ]
        },
        {
          id: 'communication',
          title: 'Automated Communications',
          description: 'Gmail integration, automated workflows, custom email templates, and notification management.',
          icon: 'Mail',
          category: 'communication',
          benefits: [
            'Gmail integration',
            'Automated workflows',
            'Custom email templates',
            'Notification center'
          ]
        }
      ];

      res.json(features);
    } catch (error) {
      console.error('Error fetching features:', error);
      res.status(500).json({ message: 'Error fetching features' });
    }
  });
}