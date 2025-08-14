import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";
import { type SubscriptionPackage, type InsertSubscriptionPackage } from "@shared/schema";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  package?: SubscriptionPackage;
}

const AVAILABLE_FEATURES = [
  // Core Venue Management
  { id: "dashboard_analytics", name: "Dashboard & Analytics", description: "Core dashboard with basic metrics and insights" },
  { id: "venue_management", name: "Venue Management", description: "Create and manage venue spaces and amenities" },
  { id: "event_booking", name: "Event Booking", description: "Calendar view and event booking system" },
  { id: "customer_management", name: "Customer Management", description: "Manage customer profiles and contact information" },
  { id: "proposal_system", name: "Proposal System", description: "Generate and send event proposals to customers" },
  { id: "payment_processing", name: "Payment Processing", description: "Accept payments and manage transactions" },
  
  // Advanced Features
  { id: "leads_management", name: "Leads Management", description: "Advanced lead tracking and conversion tools" },
  { id: "ai_analytics", name: "AI-Powered Analytics", description: "Smart insights and predictive analytics" },
  { id: "voice_booking", name: "Voice-to-Text Booking", description: "Create bookings using voice commands" },
  { id: "floor_plans", name: "Floor Plans & Setup Styles", description: "Interactive floor plan designer and setup templates" },
  { id: "advanced_reports", name: "Advanced Reports", description: "Detailed revenue and performance reports" },
  { id: "task_management", name: "Task Management", description: "Team collaboration and task tracking" },
  
  // Premium Features
  { id: "custom_branding", name: "Custom Branding", description: "White-label your venue platform" },
  { id: "api_access", name: "API Access", description: "Full REST API access for integrations" },
  { id: "priority_support", name: "Priority Support", description: "24/7 premium customer support" },
  { id: "advanced_integrations", name: "Advanced Integrations", description: "Connect to external CRM and marketing tools" },
  { id: "multi_location", name: "Multi-Location Support", description: "Manage multiple venue locations" },
  { id: "custom_fields", name: "Custom Fields", description: "Create custom booking and customer fields" },
];

export function PackageManagementModal({ open, onOpenChange, package: editPackage }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<Partial<InsertSubscriptionPackage>>({
    name: editPackage?.name || "",
    description: editPackage?.description || "",
    price: editPackage?.price || "0",
    billingInterval: editPackage?.billingInterval || "monthly",
    trialDays: editPackage?.trialDays || 14,
    maxVenues: editPackage?.maxVenues || 1,
    maxUsers: editPackage?.maxUsers || 3,
    maxBookingsPerMonth: editPackage?.maxBookingsPerMonth || 100,
    features: editPackage?.features || [],
    isActive: editPackage?.isActive ?? true,
    sortOrder: editPackage?.sortOrder || 0,
  });

  const createPackageMutation = useMutation({
    mutationFn: (data: InsertSubscriptionPackage) =>
      apiRequest("/api/super-admin/packages", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/packages"] });
      toast({ title: "Package created successfully" });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ title: "Error creating package", description: error.message, variant: "destructive" });
    },
  });

  const updatePackageMutation = useMutation({
    mutationFn: (data: Partial<InsertSubscriptionPackage>) =>
      apiRequest(`/api/super-admin/packages/${editPackage?.id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/packages"] });
      toast({ title: "Package updated successfully" });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ title: "Error updating package", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    const submitData = {
      ...formData,
      price: formData.price.toString(),
      features: Array.isArray(formData.features) ? formData.features : [],
    } as InsertSubscriptionPackage;

    if (editPackage) {
      updatePackageMutation.mutate(submitData);
    } else {
      createPackageMutation.mutate(submitData);
    }
  };

  const toggleFeature = (featureId: string) => {
    const currentFeatures = Array.isArray(formData.features) ? formData.features : [];
    const hasFeature = currentFeatures.includes(featureId);
    
    setFormData(prev => ({
      ...prev,
      features: hasFeature
        ? currentFeatures.filter(f => f !== featureId)
        : [...currentFeatures, featureId]
    }));
  };

  const selectedFeatures = Array.isArray(formData.features) ? formData.features : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editPackage ? "Edit Package" : "Create New Package"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Package Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Professional"
                  required
                />
              </div>

              <div>
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="29.99"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the package"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="billingInterval">Billing Interval</Label>
                <Select
                  value={formData.billingInterval}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, billingInterval: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="trialDays">Trial Days</Label>
                <Input
                  id="trialDays"
                  type="number"
                  value={formData.trialDays}
                  onChange={(e) => setFormData(prev => ({ ...prev, trialDays: parseInt(e.target.value) }))}
                  placeholder="14"
                />
              </div>
            </div>
          </div>

          {/* Limits */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Package Limits</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="maxVenues">Max Venues</Label>
                <Input
                  id="maxVenues"
                  type="number"
                  value={formData.maxVenues}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxVenues: parseInt(e.target.value) }))}
                  placeholder="1"
                />
              </div>

              <div>
                <Label htmlFor="maxUsers">Max Users</Label>
                <Input
                  id="maxUsers"
                  type="number"
                  value={formData.maxUsers}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxUsers: parseInt(e.target.value) }))}
                  placeholder="3"
                />
              </div>

              <div>
                <Label htmlFor="maxBookingsPerMonth">Max Bookings/Month</Label>
                <Input
                  id="maxBookingsPerMonth"
                  type="number"
                  value={formData.maxBookingsPerMonth}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxBookingsPerMonth: parseInt(e.target.value) }))}
                  placeholder="100"
                />
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Features</h3>
            <div className="grid grid-cols-1 gap-3">
              {AVAILABLE_FEATURES.map((feature) => (
                <div
                  key={feature.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedFeatures.includes(feature.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleFeature(feature.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{feature.name}</div>
                      <div className="text-sm text-muted-foreground">{feature.description}</div>
                    </div>
                    {selectedFeatures.includes(feature.id) && (
                      <Badge variant="default">Included</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Settings</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
                <Label htmlFor="isActive">Active Package</Label>
              </div>

              <div>
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) }))}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createPackageMutation.isPending || updatePackageMutation.isPending}
            >
              {editPackage ? "Update Package" : "Create Package"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}