import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Check,
  Zap,
  Star,
  Crown,
  ArrowRight,
  Calendar,
  Users,
  FileText,
  BarChart3,
  Mic,
  Building2,
  Settings,
  CheckSquare,
  CreditCard
} from 'lucide-react';
import { useLocation } from 'wouter';

interface Package {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  maxUsers: number;
  maxVenues: number;
  isActive: boolean;
  isPopular?: boolean;
  isEnterprise?: boolean;
}

interface TenantFeatures {
  enabled: Array<{id: string, name: string, enabled: boolean}>;
  disabled: Array<{id: string, name: string, enabled: boolean}>;
  total: number;
  available: number;
}

const featureIcons: Record<string, any> = {
  dashboard_analytics: BarChart3,
  venue_management: Building2,
  customer_management: Users,
  booking_management: Calendar,
  payment_processing: CreditCard,
  proposal_system: FileText,
  lead_management: Users,
  ai_analytics: BarChart3,
  voice_booking: Mic,
  floor_plans: Building2,
  advanced_reports: BarChart3,
  task_management: CheckSquare,
  multidate_booking: Calendar,
  package_management: Settings,
  service_management: Settings
};

const featureNames: Record<string, string> = {
  dashboard_analytics: 'Dashboard Analytics',
  venue_management: 'Venue Management',
  customer_management: 'Customer Management',
  booking_management: 'Booking Management',
  payment_processing: 'Payment Processing',
  proposal_system: 'Proposal System',
  lead_management: 'Lead Management',
  ai_analytics: 'AI Analytics & Insights',
  voice_booking: 'Voice Booking Assistant',
  floor_plans: 'Interactive Floor Plans',
  advanced_reports: 'Advanced Reporting',
  task_management: 'Task & Team Management',
  multidate_booking: 'Multi-date Booking',
  package_management: 'Package Management',
  service_management: 'Service Management'
};

export default function UpgradePackage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [tenantFeatures, setTenantFeatures] = useState<TenantFeatures | null>(null);
  const [currentPackage, setCurrentPackage] = useState<Package | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();
  const { user, isSuperAdmin } = usePermissions();

  // Redirect super admins away from this page
  useEffect(() => {
    if (isSuperAdmin) {
      setLocation('/super-admin');
    }
  }, [isSuperAdmin, setLocation]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get tenant ID from JWT token
        const token = localStorage.getItem('auth_token');
        let tenantId = null;
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            tenantId = payload.tenant_id || payload.tenantId;
          } catch (error) {
            console.error('Error parsing token:', error);
          }
        }

        const [featuresRes, packagesRes] = await Promise.all([
          fetch(`/api/tenant-features${tenantId ? `?tenantId=${tenantId}` : ''}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }),
          fetch('/api/subscription-packages', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
        ]);

        const featuresData = await featuresRes.json();

        if (!featuresRes.ok) {
          console.error('Failed to fetch features:', featuresData);
          setTenantFeatures(null);
        } else {
          console.log('Tenant features response:', featuresData);

          // Extract package information and available packages from the tenant-features API
          if (featuresData?.success) {
            // Set tenant features
            if (featuresData.features) {
              const legacyFormat = {
                enabled: featuresData.features.enabled || [],
                disabled: featuresData.features.disabled || [],
                total: featuresData.features.summary?.total || 0,
                available: featuresData.features.summary?.enabled || 0
              };
              setTenantFeatures(legacyFormat);
            }

            // Set current package from tenant info
            if (featuresData.tenant && featuresData.package) {
              const currentPkg: Package = {
                id: featuresData.package.id,
                name: featuresData.package.name,
                price: featuresData.package.price,
                description: `Your current ${featuresData.package.name} plan`,
                features: featuresData.package.features || [],
                maxUsers: featuresData.package.limits?.maxUsers || 0,
                maxVenues: featuresData.package.limits?.maxVenues || 0,
                isActive: true
              };
              setCurrentPackage(currentPkg);
            }

            // For now, we'll create mock available packages since we don't have a subscription packages API
            // This should be replaced with a real API call in the future
            const mockPackages: Package[] = [
              {
                id: 'basic',
                name: 'Basic',
                price: 49,
                description: 'Perfect for small venues getting started',
                features: ['dashboard_analytics', 'venue_management', 'customer_management', 'booking_management', 'payment_processing'],
                maxUsers: 3,
                maxVenues: 1,
                isActive: true
              },
              {
                id: 'professional',
                name: 'Professional',
                price: 99,
                description: 'Best for growing venues with advanced needs',
                features: ['dashboard_analytics', 'venue_management', 'customer_management', 'booking_management', 'payment_processing', 'proposal_system', 'lead_management', 'task_management', 'advanced_reports'],
                maxUsers: 10,
                maxVenues: 3,
                isActive: true,
                isPopular: true
              },
              {
                id: 'enterprise',
                name: 'Enterprise',
                price: 199,
                description: 'Full-featured solution for large operations',
                features: ['dashboard_analytics', 'venue_management', 'customer_management', 'booking_management', 'payment_processing', 'proposal_system', 'lead_management', 'task_management', 'advanced_reports', 'ai_analytics', 'voice_booking', 'floor_plans', 'multidate_booking', 'package_management'],
                maxUsers: 50,
                maxVenues: 10,
                isActive: true,
                isEnterprise: true
              }
            ];
            setPackages(mockPackages);
          } else {
            setTenantFeatures(null);
          }
        }
      } catch (error) {
        console.error('Error fetching upgrade data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleUpgrade = async (packageId: string) => {
    // In a real implementation, this would integrate with a payment system
    // For now, we'll show a contact message
    alert('Please contact our sales team to upgrade your package. We\'ll be in touch within 24 hours!');
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AppLayout>
    );
  }

  const enabledFeatureIds = tenantFeatures?.enabled.map(f => f.id) || [];
  const disabledFeatureIds = tenantFeatures?.disabled.map(f => f.id) || [];

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <Crown className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-slate-900">Upgrade Your Package</h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Unlock more features and capabilities to grow your venue business
          </p>
          
          {currentPackage && (
            <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-full">
              <span className="text-blue-700 font-medium">Current Plan: {currentPackage.name}</span>
            </div>
          )}
        </div>

        {/* Feature Overview */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Your Current Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enabledFeatureIds.map(featureId => {
              const IconComponent = featureIcons[featureId] || Settings;
              const featureName = featureNames[featureId] || featureId;
              
              return (
                <div key={featureId} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <IconComponent className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <span className="font-medium text-green-900">{featureName}</span>
                    <div className="flex items-center space-x-1">
                      <Check className="w-3 h-3 text-green-600" />
                      <span className="text-xs text-green-600">Active</span>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {disabledFeatureIds.slice(0, 3).map(featureId => {
              const IconComponent = featureIcons[featureId] || Settings;
              const featureName = featureNames[featureId] || featureId;
              
              return (
                <div key={featureId} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg opacity-60">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                    <IconComponent className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <span className="font-medium text-slate-500">{featureName}</span>
                    <div className="flex items-center space-x-1">
                      <Zap className="w-3 h-3 text-slate-400" />
                      <span className="text-xs text-slate-400">Upgrade to unlock</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Packages */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {packages.filter(pkg => pkg.isActive).map((pkg) => {
            const isCurrentPackage = currentPackage?.id === pkg.id;
            const isUpgrade = !currentPackage || (currentPackage.price < pkg.price);
            
            return (
              <Card 
                key={pkg.id} 
                className={`relative ${pkg.isPopular ? 'border-blue-500 shadow-lg scale-105' : 'border-slate-200'} ${isCurrentPackage ? 'bg-blue-50 border-blue-500' : 'bg-white'}`}
              >
                {pkg.isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1">
                      <Star className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                {isCurrentPackage && (
                  <div className="absolute -top-3 right-4">
                    <Badge className="bg-green-600 text-white px-3 py-1">
                      Current Plan
                    </Badge>
                  </div>
                )}

                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span>{pkg.name}</span>
                    {pkg.isEnterprise && <Crown className="w-5 h-5 text-yellow-500" />}
                  </CardTitle>
                  <CardDescription>{pkg.description}</CardDescription>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-3xl font-bold">${pkg.price}</span>
                    <span className="text-slate-500">/month</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Users</span>
                      <span className="font-medium">{pkg.maxUsers}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Venues</span>
                      <span className="font-medium">{pkg.maxVenues}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-slate-900">Features Included:</h4>
                    <ul className="space-y-2">
                      {pkg.features.filter(feature => featureNames[feature]).map((feature) => (
                        <li key={feature} className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm text-slate-700">{featureNames[feature]}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button 
                    className={`w-full ${isCurrentPackage 
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                      : pkg.isPopular 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'bg-slate-900 hover:bg-slate-800'
                    }`}
                    onClick={() => !isCurrentPackage && handleUpgrade(pkg.id)}
                    disabled={isCurrentPackage}
                  >
                    {isCurrentPackage ? (
                      'Current Plan'
                    ) : isUpgrade ? (
                      <>
                        Upgrade Now <ArrowRight className="w-4 h-4 ml-1" />
                      </>
                    ) : (
                      'Contact Sales'
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Contact CTA */}
        <div className="text-center bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Need a Custom Solution?</h2>
          <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
            Looking for enterprise features, white-label options, or have specific requirements? 
            Our team can create a custom package that fits your needs perfectly.
          </p>
          <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            Contact Our Sales Team
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}