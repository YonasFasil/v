import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { Package, Sparkles } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: any;
}

export function CreatePackageModal({ open, onOpenChange, initialData }: Props) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    basePrice: "",
    category: "wedding",
    maxGuests: "",
    duration: "4",
    includedServices: [] as string[],
    features: [] as string[],
    isActive: true,
    enabledTaxIds: [] as string[],
    enabledFeeIds: [] as string[]
  });

  const { data: services } = useQuery({
    queryKey: ["/api/services"],
  });

  const { data: taxSettings = [] } = useQuery({ queryKey: ["/api/tax-settings"] });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        description: initialData.description || "",
        basePrice: initialData.basePrice || "",
        category: initialData.category || "wedding",
        maxGuests: initialData.maxGuests?.toString() || "",
        duration: initialData.duration || "4",
        includedServices: initialData.includedServices || [],
        features: initialData.features || [],
        isActive: initialData.isActive !== false,
        enabledTaxIds: initialData.enabledTaxIds || [],
        enabledFeeIds: initialData.enabledFeeIds || []
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.basePrice) {
      toast({
        title: "Required fields missing",
        description: "Please provide package name and base price",
        variant: "destructive"
      });
      return;
    }

    try {
      await apiRequest("POST", "/api/packages", {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        price: parseFloat(formData.basePrice),
        pricingModel: "fixed",
        maxGuests: formData.maxGuests ? parseInt(formData.maxGuests) : null,
        duration: parseInt(formData.duration),
        includedServiceIds: formData.includedServices,
        features: formData.features,
        isActive: formData.isActive,
        enabledTaxIds: formData.enabledTaxIds,
        enabledFeeIds: formData.enabledFeeIds
      });

      await queryClient.invalidateQueries({ queryKey: ["/api/packages"] });
      
      toast({
        title: "Package created successfully",
        description: `${formData.name} has been added to your packages`
      });
      
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Failed to create package",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      basePrice: "",
      category: "wedding",
      maxGuests: "",
      duration: "4",
      includedServices: [],
      features: [],
      isActive: true,
      enabledTaxIds: [],
      enabledFeeIds: []
    });
  };

  const handleServiceToggle = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      includedServices: prev.includedServices.includes(serviceId)
        ? prev.includedServices.filter(id => id !== serviceId)
        : [...prev.includedServices, serviceId]
    }));
  };

  const addFeature = () => {
    const feature = prompt("Enter a package feature:");
    if (feature?.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, feature.trim()]
      }));
    }
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Create New Package
            {initialData && (
              <Badge className="bg-purple-100 text-purple-800">
                <Sparkles className="w-3 h-3 mr-1" />
                AI Suggested
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Create a new event package with included services and pricing.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Package Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Premium Wedding Package"
                required
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wedding">Wedding</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                  <SelectItem value="conference">Conference</SelectItem>
                  <SelectItem value="winter">Winter</SelectItem>
                  <SelectItem value="spring">Spring</SelectItem>
                  <SelectItem value="summer">Summer</SelectItem>
                  <SelectItem value="fall">Fall</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="basePrice">Base Price ($)</Label>
              <Input
                id="basePrice"
                type="number"
                value={formData.basePrice}
                onChange={(e) => setFormData(prev => ({ ...prev, basePrice: e.target.value }))}
                placeholder="2500"
                required
              />
            </div>

            <div>
              <Label htmlFor="maxGuests">Max Guests</Label>
              <Input
                id="maxGuests"
                type="number"
                value={formData.maxGuests}
                onChange={(e) => setFormData(prev => ({ ...prev, maxGuests: e.target.value }))}
                placeholder="150"
              />
            </div>

            <div>
              <Label htmlFor="duration">Duration (hours)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                placeholder="4"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Complete package description..."
              rows={3}
            />
          </div>

          {/* Included Services */}
          {services && Array.isArray(services) && services.length > 0 && (
            <div>
              <Label>Included Services</Label>
              <div className="border rounded-lg p-4 max-h-40 overflow-y-auto">
                <div className="space-y-2">
                  {(services as any[]).map((service: any) => (
                    <div key={service.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={service.id}
                        checked={formData.includedServices.includes(service.id)}
                        onCheckedChange={() => handleServiceToggle(service.id)}
                      />
                      <Label htmlFor={service.id} className="text-sm">
                        {service.name} - ${service.price || service.basePrice}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tax and Fee Selection */}
          {(taxSettings as any[])?.length > 0 && (
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Apply Taxes & Fees</Label>
                <p className="text-sm text-slate-600 mb-3">Select which taxes and fees apply to this package by default</p>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {(taxSettings as any[]).map((setting: any) => (
                  <label key={setting.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer">
                    <Checkbox 
                      checked={
                        setting.type === 'tax' 
                          ? formData.enabledTaxIds.includes(setting.id)
                          : formData.enabledFeeIds.includes(setting.id)
                      }
                      onCheckedChange={(checked) => {
                        if (setting.type === 'tax') {
                          setFormData(prev => ({
                            ...prev,
                            enabledTaxIds: checked 
                              ? [...prev.enabledTaxIds, setting.id]
                              : prev.enabledTaxIds.filter(id => id !== setting.id)
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            enabledFeeIds: checked 
                              ? [...prev.enabledFeeIds, setting.id]
                              : prev.enabledFeeIds.filter(id => id !== setting.id)
                          }));
                        }
                      }}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{setting.name}</div>
                      <div className="text-xs text-slate-600">
                        {setting.type === 'tax' ? 'Tax' : 'Fee'} • {setting.value}%
                        {setting.calculation === 'fixed' && ' (Fixed)'}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Package Features */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Package Features</Label>
              <Button type="button" onClick={addFeature} size="sm" variant="outline">
                Add Feature
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.features.map((feature, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => removeFeature(index)}
                >
                  {feature} ×
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: !!checked }))}
            />
            <Label htmlFor="isActive">Package is active and available for booking</Label>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Package</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}