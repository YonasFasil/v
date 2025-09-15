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
import { Wrench, Sparkles } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: any;
}

export function CreateServiceModal({ open, onOpenChange, initialData }: Props) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    basePrice: "",
    category: "catering",
    unit: "per hour",
    isActive: true,
    seasonalDemand: "",
    bookingRate: "",
    enabledTaxIds: [] as string[],
    enabledFeeIds: [] as string[]
  });

  const { data: taxSettings = [] } = useQuery({ queryKey: ["/api/tax-settings"] });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        description: initialData.description || "",
        basePrice: initialData.basePrice || "",
        category: initialData.category || "catering",
        unit: initialData.unit || "per hour",
        isActive: initialData.isActive !== false,
        seasonalDemand: initialData.seasonalDemand?.toString() || "",
        bookingRate: initialData.bookingRate?.toString() || "",
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
        description: "Please provide service name and base price",
        variant: "destructive"
      });
      return;
    }

    try {
      await apiRequest("POST", "/api/services", {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        price: parseFloat(formData.basePrice),
        unit: formData.unit,
        isActive: formData.isActive,
        enabledTaxIds: formData.enabledTaxIds,
        enabledFeeIds: formData.enabledFeeIds
      });

      await queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      
      toast({
        title: "Service created successfully",
        description: `${formData.name} has been added to your services`
      });
      
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Failed to create service",
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
      category: "catering",
      unit: "per hour",
      isActive: true,
      seasonalDemand: "",
      bookingRate: "",
      enabledTaxIds: [],
      enabledFeeIds: []
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Create New Service
            {initialData && (
              <Badge className="bg-purple-100 text-purple-800">
                <Sparkles className="w-3 h-3 mr-1" />
                AI Suggested
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Create a new service that can be added to packages or booked individually.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Service Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Premium Catering Service"
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
                  <SelectItem value="catering">Catering</SelectItem>
                  <SelectItem value="av-equipment">AV Equipment</SelectItem>
                  <SelectItem value="decorations">Decorations</SelectItem>
                  <SelectItem value="utilities">Utilities</SelectItem>
                  <SelectItem value="entertainment">Entertainment</SelectItem>
                  <SelectItem value="photography">Photography</SelectItem>
                  <SelectItem value="transportation">Transportation</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
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
                placeholder="250"
                required
              />
            </div>

            <div>
              <Label htmlFor="unit">Pricing Unit</Label>
              <Select value={formData.unit} onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="per hour">Per Hour</SelectItem>
                  <SelectItem value="per person">Per Person</SelectItem>
                  <SelectItem value="per event">Per Event</SelectItem>
                  <SelectItem value="per day">Per Day</SelectItem>
                  <SelectItem value="per station">Per Station</SelectItem>
                  <SelectItem value="per item">Per Item</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Detailed service description..."
              rows={3}
            />
          </div>

          {/* Tax and Fee Selection */}
          {(taxSettings as any[])?.length > 0 && (
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Apply Taxes & Fees</Label>
                <p className="text-sm text-slate-600 mb-3">Select which taxes and fees apply to this service by default</p>
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

          {/* AI Analytics Data (if provided) */}
          {initialData?.seasonalDemand && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-purple-50 rounded-lg">
              <div>
                <Label>AI Seasonal Demand</Label>
                <div className="text-sm text-purple-700 font-medium">
                  {initialData.seasonalDemand}% seasonal demand
                </div>
              </div>
              {initialData?.bookingRate && (
                <div>
                  <Label>AI Booking Rate</Label>
                  <div className="text-sm text-purple-700 font-medium">
                    {initialData.bookingRate}% booking rate
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: !!checked }))}
            />
            <Label htmlFor="isActive">Service is active and available for booking</Label>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Service</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}