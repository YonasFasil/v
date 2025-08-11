import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Define actual VENUIN features based on the platform capabilities
const VENUIN_FEATURES = {
  'dashboard-analytics': 'Dashboard & Analytics',
  'event-management': 'Event & Booking Management', 
  'customer-management': 'Customer Management',
  'lead-management': 'Lead Management & Scoring',
  'proposal-system': 'Proposal Generation & Tracking',
  'stripe-payments': 'Payment Processing (Stripe Connect)',
  'venue-management': 'Multi-Venue Management',
  'service-packages': 'Service & Package Management',
  'gmail-integration': 'Gmail Integration',
  'task-management': 'Task & Team Management',
  'ai-voice-booking': 'AI Voice-to-Text Booking',
  'ai-scheduling': 'Smart AI Scheduling',
  'ai-email-replies': 'AI Email Auto-Replies',
  'ai-lead-scoring': 'AI Lead Priority Scoring',
  'ai-insights': 'AI-Powered Insights',
  'ai-proposal-generation': 'AI Proposal Content Generation',
  'mobile-responsive': 'Mobile-Responsive Interface',
  'audit-logs': 'Audit Logging & Security',
  'custom-branding': 'Custom Branding & Themes',
  'priority-support': 'Priority Customer Support',
  'api-access': 'API Access',
  'advanced-reporting': 'Advanced Reports & Export',
  'calendar-integration': 'Calendar Integration',
  'floor-plan-designer': '2D Floor Plan Designer'
};

interface FeaturePackageFormProps {
  onSubmit: (data: any) => void;
  isPending: boolean;
  onCancel: () => void;
  initialData?: any;
}

export function FeaturePackageForm({ onSubmit, isPending, onCancel, initialData }: FeaturePackageFormProps) {
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(() => {
    if (initialData?.features) {
      return Object.keys(initialData.features).filter(key => initialData.features[key]);
    }
    return [];
  });

  const handleFeatureToggle = (featureKey: string, checked: boolean) => {
    if (checked) {
      setSelectedFeatures(prev => [...prev, featureKey]);
    } else {
      setSelectedFeatures(prev => prev.filter(f => f !== featureKey));
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget as HTMLFormElement);
    
    // Create features object - set ALL features to false first, then enable selected ones
    const features: Record<string, boolean> = {};
    Object.keys(VENUIN_FEATURES).forEach(key => {
      features[key] = selectedFeatures.includes(key);
    });

    // Create limits object
    const limits = {
      maxUsers: parseInt(formData.get('maxUsers') as string) || 0,
      maxVenues: parseInt(formData.get('maxVenues') as string) || 0,
      maxSpacesPerVenue: parseInt(formData.get('maxSpaces') as string) || 0
    };

    const packageName = formData.get('name') as string;
    const packageId = initialData?.id || packageName.toLowerCase().replace(/\s+/g, '-');
    
    onSubmit({
      id: packageId,
      name: packageName,
      description: formData.get('description'),
      price: formData.get('priceMonthly') as string,
      billingCycle: 'monthly',
      features,
      limits,
      isActive: true
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Package Name</Label>
          <Input 
            name="name" 
            required 
            placeholder="e.g., Professional, Enterprise"
            defaultValue={initialData?.name || ''}
          />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea 
            name="description" 
            required 
            placeholder="Brief description of this package..."
            defaultValue={initialData?.description || ''}
          />
        </div>
      </div>

      {/* Features Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Features</CardTitle>
          <p className="text-sm text-muted-foreground">Select which VENUIN features this package includes</p>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const allFeatureKeys = Object.keys(VENUIN_FEATURES);
                  setSelectedFeatures(allFeatureKeys);
                }}
              >
                Enable All
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedFeatures([])}
              >
                Disable All
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              {selectedFeatures.length} of {Object.keys(VENUIN_FEATURES).length} features selected
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(VENUIN_FEATURES).map(([key, label]) => (
              <div key={key} className="flex items-center space-x-2">
                <Checkbox
                  id={key}
                  checked={selectedFeatures.includes(key)}
                  onCheckedChange={(checked) => handleFeatureToggle(key, checked as boolean)}
                />
                <Label htmlFor={key} className="text-sm font-normal">
                  {label}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Usage Limits</CardTitle>
          <p className="text-sm text-muted-foreground">Set maximum usage limits for this package</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="maxUsers">Max Users</Label>
              <Input 
                name="maxUsers" 
                type="number" 
                required 
                placeholder="50"
                defaultValue={initialData?.limits?.maxUsers || initialData?.limits?.staff || ''}
              />
            </div>
            <div>
              <Label htmlFor="maxVenues">Max Venues</Label>
              <Input 
                name="maxVenues" 
                type="number" 
                required 
                placeholder="5"
                defaultValue={initialData?.limits?.maxVenues || initialData?.limits?.venues || ''}
              />
            </div>
            <div>
              <Label htmlFor="maxSpaces">Max Spaces per Venue</Label>
              <Input 
                name="maxSpaces" 
                type="number" 
                required 
                placeholder="20"
                defaultValue={initialData?.limits?.maxSpacesPerVenue || ''}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pricing</CardTitle>
          <p className="text-sm text-muted-foreground">Set monthly and yearly pricing (USD)</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priceMonthly">Monthly Price ($)</Label>
              <Input 
                name="priceMonthly" 
                type="number" 
                step="0.01" 
                required 
                placeholder="99.00"
                defaultValue={initialData?.price_monthly || ''}
              />
            </div>
            <div>
              <Label htmlFor="priceYearly">Yearly Price ($)</Label>
              <Input 
                name="priceYearly" 
                type="number" 
                step="0.01" 
                required 
                placeholder="999.00"
                defaultValue={initialData?.price_yearly || ''}
              />
              <p className="text-xs text-muted-foreground mt-1">Usually ~10-15% discount from monthly</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating..." : "Create Package"}
        </Button>
      </div>
    </form>
  );
}