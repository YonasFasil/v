import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Edit, Save, Trash2 } from "lucide-react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useFormattedCurrency } from "@/lib/currency";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: any;
}

export function EditServiceModal({ open, onOpenChange, service }: Props) {
  const { toast } = useToast();
  const { formatAmount } = useFormattedCurrency();
  const queryClient = useQueryClient();
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [pricingModel, setPricingModel] = useState("");
  const [taxFeeSelection, setTaxFeeSelection] = useState({
    enabledTaxIds: [] as string[],
    enabledFeeIds: [] as string[]
  });

  // Fetch tax settings
  const { data: taxSettings = [] } = useQuery({ queryKey: ["/api/tax-settings"] });

  useEffect(() => {
    if (service && open) {
      setName(service.name || "");
      setDescription(service.description || "");
      setPrice(service.price?.toString() || "");
      setCategory(service.category || "");
      setPricingModel(service.pricingModel || "fixed");
      setTaxFeeSelection({
        enabledTaxIds: service.enabledTaxIds || [],
        enabledFeeIds: service.enabledFeeIds || []
      });
    }
  }, [service, open]);

  const updateService = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest(`/api/services/${service.id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" }
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({ title: "Service updated successfully!" });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ title: "Failed to update service", description: error.message, variant: "destructive" });
    }
  });

  const deleteService = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/services/${service.id}`, {});
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({ title: "Service deleted successfully!" });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete service", description: error.message, variant: "destructive" });
    }
  });

  // Calculate live pricing with taxes and fees
  const calculateServiceTotal = () => {
    const basePrice = parseFloat(price) || 0;
    if (basePrice === 0) return 0;
    
    let total = basePrice;
    
    // Apply fees first
    taxFeeSelection.enabledFeeIds.forEach(feeId => {
      const fee = (taxSettings as any[]).find((t: any) => t.id === feeId);
      if (fee) {
        if (fee.calculation === 'percentage') {
          total += (basePrice * parseFloat(fee.value)) / 100;
        } else {
          total += parseFloat(fee.value);
        }
      }
    });
    
    // Apply taxes on the total including fees
    taxFeeSelection.enabledTaxIds.forEach(taxId => {
      const tax = (taxSettings as any[]).find((t: any) => t.id === taxId);
      if (tax) {
        total += (total * parseFloat(tax.value)) / 100;
      }
    });
    
    return total;
  };

  const handleSave = () => {
    updateService.mutate({
      name,
      description,
      price: parseFloat(price) || 0,
      category,
      pricingModel,
      enabledTaxIds: taxFeeSelection.enabledTaxIds,
      enabledFeeIds: taxFeeSelection.enabledFeeIds
    });
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this service? This may affect existing packages and bookings.")) {
      deleteService.mutate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0" aria-describedby="edit-service-description">
        <DialogTitle className="sr-only">Edit Service</DialogTitle>
        <div id="edit-service-description" className="sr-only">
          Edit service information including name, pricing, category, and pricing model.
        </div>
        
        <div className="border-b border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <Edit className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Edit Service</h2>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <Label>Service Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
          </div>
          
          <div>
            <Label>Description</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 border rounded-md mt-1 h-20 resize-none text-sm"
              placeholder="Describe this service..."
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Price *</Label>
              <Input 
                type="number" 
                step="0.01"
                value={price} 
                onChange={(e) => setPrice(e.target.value)} 
                className="mt-1"
                placeholder="0.00"
              />
            </div>
            
            <div>
              <Label>Pricing Model</Label>
              <Select value={pricingModel} onValueChange={setPricingModel}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed Price</SelectItem>
                  <SelectItem value="per_person">Per Person</SelectItem>
                  <SelectItem value="per_hour">Per Hour</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="catering">Catering</SelectItem>
                <SelectItem value="entertainment">Entertainment</SelectItem>
                <SelectItem value="decor">Decor</SelectItem>
                <SelectItem value="photography">Photography</SelectItem>
                <SelectItem value="equipment">Equipment</SelectItem>
                <SelectItem value="additional">Additional Services</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tax and Fee Selection */}
          {(taxSettings as any[])?.length > 0 && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Apply Taxes & Fees</Label>
                <p className="text-xs text-slate-600 mt-1">Select which taxes and fees apply to this service by default</p>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {(taxSettings as any[]).map((setting: any) => (
                  <label key={setting.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer">
                    <Checkbox 
                      checked={
                        setting.type === 'tax' 
                          ? taxFeeSelection.enabledTaxIds.includes(setting.id)
                          : taxFeeSelection.enabledFeeIds.includes(setting.id)
                      }
                      onCheckedChange={(checked) => {
                        if (setting.type === 'tax') {
                          setTaxFeeSelection(prev => ({
                            ...prev,
                            enabledTaxIds: checked 
                              ? [...prev.enabledTaxIds, setting.id]
                              : prev.enabledTaxIds.filter(id => id !== setting.id)
                          }));
                        } else {
                          setTaxFeeSelection(prev => ({
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

          {/* Live Pricing Preview */}
          {price && parseFloat(price) > 0 && (
            <div className="bg-slate-50 border rounded-lg p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Base Price:</span>
                  <span className="text-green-600 font-medium">{formatAmount(parseFloat(price))}</span>
                </div>
                
                {/* Show individual fees */}
                {taxFeeSelection.enabledFeeIds.map(feeId => {
                  const fee = (taxSettings as any[]).find((t: any) => t.id === feeId);
                  if (!fee) return null;
                  const basePrice = parseFloat(price) || 0;
                  const feeAmount = fee.calculation === 'percentage' 
                    ? (basePrice * parseFloat(fee.value)) / 100
                    : parseFloat(fee.value);
                  return (
                    <div key={feeId} className="flex justify-between text-blue-600">
                      <span className="pl-2">+ {fee.name}:</span>
                      <span>+{formatAmount(feeAmount)}</span>
                    </div>
                  );
                })}
                
                {/* Show individual taxes */}
                {taxFeeSelection.enabledTaxIds.map(taxId => {
                  const tax = (taxSettings as any[]).find((t: any) => t.id === taxId);
                  if (!tax) return null;
                  const basePrice = parseFloat(price) || 0;
                  let subtotalWithFees = basePrice;
                  
                  // Add fees to subtotal for tax calculation
                  taxFeeSelection.enabledFeeIds.forEach(feeId => {
                    const fee = (taxSettings as any[]).find((t: any) => t.id === feeId);
                    if (fee) {
                      if (fee.calculation === 'percentage') {
                        subtotalWithFees += (basePrice * parseFloat(fee.value)) / 100;
                      } else {
                        subtotalWithFees += parseFloat(fee.value);
                      }
                    }
                  });
                  
                  const taxAmount = (subtotalWithFees * parseFloat(tax.value)) / 100;
                  return (
                    <div key={taxId} className="flex justify-between text-purple-600">
                      <span className="pl-2">+ {tax.name}:</span>
                      <span>+{formatAmount(taxAmount)}</span>
                    </div>
                  );
                })}
                
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Total with Taxes & Fees:</span>
                    <span className="text-blue-700">{formatAmount(calculateServiceTotal())}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 p-6 flex justify-between">
          <Button variant="destructive" onClick={handleDelete} disabled={deleteService.isPending}>
            <Trash2 className="h-4 w-4 mr-2" />
            {deleteService.isPending ? 'Deleting...' : 'Delete Service'}
          </Button>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={updateService.isPending || !name.trim() || !price}>
              <Save className="h-4 w-4 mr-2" />
              {updateService.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}