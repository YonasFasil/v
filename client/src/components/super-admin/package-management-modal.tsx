import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
  // Premium Features (matches tenant-features.js API)
  { id: "calendar_view", name: "Calendar View", description: "Visual calendar interface for event management", category: "premium" },
  { id: "proposal_system", name: "Proposal System", description: "Generate and send event proposals to customers", category: "premium" },
  { id: "lead_management", name: "Lead Management", description: "Advanced lead tracking and conversion tools", category: "premium" },
  { id: "ai_analytics", name: "AI Analytics", description: "Smart insights and predictive analytics", category: "premium" },
  { id: "voice_booking", name: "Voice Booking", description: "Create bookings using voice commands", category: "premium" },
  { id: "floor_plans", name: "Floor Plans", description: "Interactive floor plan designer and setup templates", category: "premium" },
  { id: "advanced_reports", name: "Advanced Reports", description: "Detailed revenue and performance reports", category: "premium" },
  { id: "task_management", name: "Task Management", description: "Team collaboration and task tracking", category: "premium" },
  { id: "multidate_booking", name: "Multi-date Booking", description: "Book events across multiple dates", category: "premium" },
  { id: "package_management", name: "Package Management", description: "Create and manage service packages", category: "premium" },
];

export function PackageManagementModal({ open, onOpenChange, package: editPackage }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<Partial<InsertSubscriptionPackage>>({
    name: "",
    description: "",
    price: "0",
    billingInterval: "monthly",
    maxVenues: 1,
    maxSpaces: 5,
    maxUsers: 3,
    features: [],
    isActive: true,
    sortOrder: 0,
  });

  // Update form data when editPackage changes
  useEffect(() => {
    if (editPackage) {
      setFormData({
        name: editPackage.name || "",
        description: editPackage.description || "",
        price: editPackage.price || "0",
        billingInterval: editPackage.billingInterval || "monthly",
        maxVenues: editPackage.maxVenues || 1,
        maxSpaces: editPackage.maxSpaces || 5,
        maxUsers: editPackage.maxUsers || 3,
        features: editPackage.features || [],
        isActive: editPackage.isActive ?? true,
        sortOrder: editPackage.sortOrder || 0,
      });
    } else {
      // Reset form for new package
      setFormData({
        name: "",
        description: "",
        price: "0",
        billingInterval: "monthly",
        maxVenues: 1,
        maxSpaces: 5,
        maxUsers: 3,
        features: [],
        isActive: true,
        sortOrder: 0,
      });
    }
  }, [editPackage, open]);

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
          <DialogDescription>
            {editPackage 
              ? "Modify the subscription package details and features." 
              : "Create a new subscription package with pricing and feature selection."
            }
          </DialogDescription>
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
                <Label htmlFor="maxSpaces">Max Spaces</Label>
                <Input
                  id="maxSpaces"
                  type="number"
                  value={formData.maxSpaces}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxSpaces: parseInt(e.target.value) }))}
                  placeholder="5"
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
            </div>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Features by Category</h3>
            
            {/* Default Features Info */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-700 mb-2">Core Features (Included in All Plans)</h4>
              <div className="text-sm text-green-600 space-y-1">
                <div>• Dashboard Analytics - View venue performance metrics and insights</div>
                <div>• Venue Management - Create and manage venue spaces</div>
                <div>• Customer Management - Manage customer information and history</div>
                <div>• Event Booking - Book and manage events</div>
                <div>• Payment Processing - Process payments and invoices</div>
                <div>• Service Management - Manage services and packages</div>
              </div>
            </div>

            {/* Selectable Features */}
            <div>
              <h4 className="font-medium text-blue-700 mb-2">Optional Features</h4>
              <div className="grid grid-cols-1 gap-2">
                {AVAILABLE_FEATURES.filter(f => f.category === 'premium').map((feature) => (
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
                        <Badge className="bg-blue-100 text-blue-800">Included</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
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