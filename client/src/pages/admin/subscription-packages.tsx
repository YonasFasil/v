import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit2, Trash2, Package, Users, Building, Calendar, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { SubscriptionPackage, InsertSubscriptionPackage } from "@shared/schema";

interface PackageFormData {
  name: string;
  description: string;
  price: string;
  billingInterval: "month" | "year";
  maxVenues: number | null;
  maxUsers: number | null;
  maxEventsPerMonth: number | null;
  storageGB: number | null;
  features: Record<string, boolean>;
  isActive: boolean;
  isPopular: boolean;
  stripePriceId: string;
}

const AVAILABLE_FEATURES = [
  { key: 'basic_analytics', label: 'Basic Analytics', description: 'Essential metrics and reports' },
  { key: 'email_support', label: 'Email Support', description: 'Standard email customer support' },
  { key: 'calendar_integration', label: 'Calendar Integration', description: 'Sync with Google Calendar, Outlook' },
  { key: 'proposal_system', label: 'Proposal System', description: 'Create and send professional proposals' },
  { key: 'payment_processing', label: 'Payment Processing', description: 'Accept payments and manage billing' },
  { key: 'ai_insights', label: 'AI Insights', description: 'Smart analytics and recommendations' },
  { key: 'advanced_reports', label: 'Advanced Reports', description: 'Detailed analytics and custom reports' },
  { key: 'custom_branding', label: 'Custom Branding', description: 'White-label with your brand' },
  { key: 'priority_support', label: 'Priority Support', description: 'Fast-track customer support' },
  { key: 'team_collaboration', label: 'Team Collaboration', description: 'Multi-user workspace features' },
  { key: 'api_access', label: 'API Access', description: 'Programmatic access to platform' },
  { key: 'white_label', label: 'White Label', description: 'Completely branded experience' },
  { key: 'dedicated_manager', label: 'Dedicated Manager', description: 'Personal account manager' }
];

export default function SubscriptionPackages() {
  const [selectedPackage, setSelectedPackage] = useState<SubscriptionPackage | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: packages = [], isLoading } = useQuery({
    queryKey: ['/api/super-admin/packages'],
    retry: false,
  });

  const createPackageMutation = useMutation({
    mutationFn: async (data: InsertSubscriptionPackage) => {
      return await apiRequest('POST', '/api/super-admin/packages', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/packages'] });
      setIsCreateModalOpen(false);
      toast({
        title: "Package Created",
        description: "Subscription package has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create package",
        variant: "destructive",
      });
    },
  });

  const updatePackageMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertSubscriptionPackage> }) => {
      return await apiRequest('PUT', `/api/super-admin/packages/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/packages'] });
      setIsEditModalOpen(false);
      setSelectedPackage(null);
      toast({
        title: "Package Updated",
        description: "Subscription package has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update package",
        variant: "destructive",
      });
    },
  });

  const deletePackageMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/super-admin/packages/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/packages'] });
      toast({
        title: "Package Deleted",
        description: "Subscription package has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete package",
        variant: "destructive",
      });
    },
  });

  const formatPrice = (price: string, interval: string) => {
    const amount = parseFloat(price);
    return `$${amount.toLocaleString()}/${interval}`;
  };

  const formatLimit = (value: number | null, unit: string) => {
    return value === null ? "Unlimited" : `${value.toLocaleString()} ${unit}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Subscription Packages</h1>
        </div>
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-muted rounded w-1/3" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded" />
                  <div className="h-3 bg-muted rounded w-5/6" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Subscription Packages</h1>
          <p className="text-muted-foreground mt-2">
            Manage subscription tiers and pricing for tenant accounts
          </p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Package
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Subscription Package</DialogTitle>
              <DialogDescription>
                Create a new subscription tier for tenant accounts
              </DialogDescription>
            </DialogHeader>
            <PackageForm
              onSubmit={(data) => createPackageMutation.mutate(data)}
              isLoading={createPackageMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {packages.map((pkg: SubscriptionPackage) => (
          <Card key={pkg.id} className={`relative ${pkg.isPopular ? 'border-primary shadow-lg' : ''}`}>
            {pkg.isPopular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge variant="default" className="bg-primary">
                  <Crown className="h-3 w-3 mr-1" />
                  Most Popular
                </Badge>
              </div>
            )}
            
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{pkg.name}</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedPackage(pkg);
                      setIsEditModalOpen(true);
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deletePackageMutation.mutate(pkg.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="text-3xl font-bold text-primary">
                {formatPrice(pkg.price, pkg.billingInterval)}
              </div>
              <CardDescription>{pkg.description}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span>{formatLimit(pkg.maxVenues, "venues")}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{formatLimit(pkg.maxUsers, "users")}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatLimit(pkg.maxEventsPerMonth, "events/mo")}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span>{formatLimit(pkg.storageGB, "GB")}</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-2">Key Features:</p>
                <div className="space-y-1">
                  {Object.entries(pkg.features as Record<string, boolean>)
                    .filter(([_, enabled]) => enabled)
                    .slice(0, 4)
                    .map(([key]) => {
                      const feature = AVAILABLE_FEATURES.find(f => f.key === key);
                      return (
                        <div key={key} className="text-sm text-muted-foreground flex items-center">
                          <span className="w-2 h-2 bg-primary rounded-full mr-2" />
                          {feature?.label || key}
                        </div>
                      );
                    })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Badge variant={pkg.isActive ? "default" : "secondary"}>
                  {pkg.isActive ? "Active" : "Inactive"}
                </Badge>
                {pkg.stripePriceId && (
                  <span className="text-xs text-muted-foreground">
                    Stripe: {pkg.stripePriceId.slice(-6)}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Package Dialog */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Subscription Package</DialogTitle>
            <DialogDescription>
              Update the subscription package details
            </DialogDescription>
          </DialogHeader>
          {selectedPackage && (
            <PackageForm
              initialData={selectedPackage}
              onSubmit={(data) => updatePackageMutation.mutate({ 
                id: selectedPackage.id, 
                data 
              })}
              isLoading={updatePackageMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface PackageFormProps {
  initialData?: SubscriptionPackage;
  onSubmit: (data: InsertSubscriptionPackage) => void;
  isLoading: boolean;
}

function PackageForm({ initialData, onSubmit, isLoading }: PackageFormProps) {
  const [formData, setFormData] = useState<PackageFormData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    price: initialData?.price || '0',
    billingInterval: (initialData?.billingInterval as "month" | "year") || 'month',
    maxVenues: initialData?.maxVenues || null,
    maxUsers: initialData?.maxUsers || null,
    maxEventsPerMonth: initialData?.maxEventsPerMonth || null,
    storageGB: initialData?.storageGB || null,
    features: (initialData?.features as Record<string, boolean>) || {},
    isActive: initialData?.isActive ?? true,
    isPopular: initialData?.isPopular ?? false,
    stripePriceId: initialData?.stripePriceId || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: formData.name,
      description: formData.description,
      price: formData.price,
      billingInterval: formData.billingInterval,
      maxVenues: formData.maxVenues,
      maxUsers: formData.maxUsers,
      maxEventsPerMonth: formData.maxEventsPerMonth,
      storageGB: formData.storageGB,
      features: formData.features,
      isActive: formData.isActive,
      isPopular: formData.isPopular,
      stripePriceId: formData.stripePriceId || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="limits">Limits</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Package Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Basic, Professional, Enterprise"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the package"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="billingInterval">Billing Interval</Label>
              <Select
                value={formData.billingInterval}
                onValueChange={(value) => setFormData({ ...formData, billingInterval: value as "month" | "year" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Monthly</SelectItem>
                  <SelectItem value="year">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="stripePriceId">Stripe Price ID</Label>
              <Input
                id="stripePriceId"
                value={formData.stripePriceId}
                onChange={(e) => setFormData({ ...formData, stripePriceId: e.target.value })}
                placeholder="price_1234567890"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label>Package is Active</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.isPopular}
                onCheckedChange={(checked) => setFormData({ ...formData, isPopular: checked })}
              />
              <Label>Mark as Popular</Label>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="limits" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxVenues">Max Venues (blank = unlimited)</Label>
              <Input
                id="maxVenues"
                type="number"
                min="1"
                value={formData.maxVenues || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  maxVenues: e.target.value ? parseInt(e.target.value) : null 
                })}
                placeholder="Unlimited"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxUsers">Max Users (blank = unlimited)</Label>
              <Input
                id="maxUsers"
                type="number"
                min="1"
                value={formData.maxUsers || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  maxUsers: e.target.value ? parseInt(e.target.value) : null 
                })}
                placeholder="Unlimited"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxEventsPerMonth">Max Events per Month (blank = unlimited)</Label>
              <Input
                id="maxEventsPerMonth"
                type="number"
                min="1"
                value={formData.maxEventsPerMonth || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  maxEventsPerMonth: e.target.value ? parseInt(e.target.value) : null 
                })}
                placeholder="Unlimited"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="storageGB">Storage (GB, blank = unlimited)</Label>
              <Input
                id="storageGB"
                type="number"
                min="1"
                value={formData.storageGB || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  storageGB: e.target.value ? parseInt(e.target.value) : null 
                })}
                placeholder="Unlimited"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {AVAILABLE_FEATURES.map((feature) => (
              <div key={feature.key} className="flex items-start space-x-3 p-3 border rounded-lg">
                <Switch
                  checked={formData.features[feature.key] || false}
                  onCheckedChange={(checked) => setFormData({
                    ...formData,
                    features: { ...formData.features, [feature.key]: checked }
                  })}
                />
                <div className="flex-1">
                  <Label className="text-sm font-medium">{feature.label}</Label>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <div className="p-4 border rounded-lg bg-muted/50">
            <h3 className="font-medium mb-2">Package Summary</h3>
            <div className="space-y-2 text-sm">
              <p><strong>Package:</strong> {formData.name}</p>
              <p><strong>Price:</strong> ${formData.price}/{formData.billingInterval}</p>
              <p><strong>Limits:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Venues: {formatLimit(formData.maxVenues, "venues")}</li>
                <li>Users: {formatLimit(formData.maxUsers, "users")}</li>
                <li>Events: {formatLimit(formData.maxEventsPerMonth, "events/month")}</li>
                <li>Storage: {formatLimit(formData.storageGB, "GB")}</li>
              </ul>
              <p><strong>Features:</strong> {Object.values(formData.features).filter(Boolean).length} enabled</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : initialData ? "Update Package" : "Create Package"}
        </Button>
      </div>
    </form>
  );
}