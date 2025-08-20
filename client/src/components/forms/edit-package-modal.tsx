import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Edit, Save, Trash2 } from "lucide-react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  package: any;
}

export function EditPackageModal({ open, onOpenChange, package: pkg }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [taxFeeSelection, setTaxFeeSelection] = useState({
    enabledTaxIds: [] as string[],
    enabledFeeIds: [] as string[]
  });

  const { data: services = [] } = useQuery({ queryKey: ["/api/services"] });
  const { data: taxSettings = [] } = useQuery({ queryKey: ["/api/tax-settings"] });

  useEffect(() => {
    if (pkg && open) {
      setName(pkg.name || "");
      setDescription(pkg.description || "");
      setPrice(pkg.price?.toString() || "");
      setSelectedServices(pkg.includedServiceIds || []);
      setTaxFeeSelection({
        enabledTaxIds: pkg.enabledTaxIds || [],
        enabledFeeIds: pkg.enabledFeeIds || []
      });
    }
  }, [pkg, open]);

  const updatePackage = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PATCH", `/api/packages/${pkg.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/packages"] });
      toast({ title: "Package updated successfully!" });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ title: "Failed to update package", description: error.message, variant: "destructive" });
    }
  });

  const deletePackage = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/packages/${pkg.id}`, {});
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/packages"] });
      toast({ title: "Package deleted successfully!" });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete package", description: error.message, variant: "destructive" });
    }
  });

  // Calculate live pricing with taxes and fees
  const calculatePackageTotal = () => {
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
    updatePackage.mutate({
      name,
      description,
      price: parseFloat(price) || 0,
      includedServiceIds: selectedServices,
      enabledTaxIds: taxFeeSelection.enabledTaxIds,
      enabledFeeIds: taxFeeSelection.enabledFeeIds
    });
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this package? This may affect existing bookings.")) {
      deletePackage.mutate();
    }
  };

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const selectedServicesData = (services as any[])?.filter((s: any) => selectedServices.includes(s.id)) || [];
  const totalServicePrice = selectedServicesData.reduce((sum: number, service: any) => sum + parseFloat(service.price || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 max-h-[90vh] overflow-y-auto">
        <DialogTitle className="sr-only">Edit Package</DialogTitle>
        <DialogDescription className="sr-only">
          Edit package information including name, price, and included services.
        </DialogDescription>
        
        <div className="border-b border-slate-200 p-6 flex items-center gap-3">
          <Edit className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-semibold">Edit Package</h2>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Package Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
            </div>
            
            <div>
              <Label>Package Price *</Label>
              <Input 
                type="number" 
                step="0.01"
                value={price} 
                onChange={(e) => setPrice(e.target.value)} 
                className="mt-1"
                placeholder="0.00"
              />
            </div>
          </div>
          
          <div>
            <Label>Description</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 border rounded-md mt-1 h-20 resize-none text-sm"
              placeholder="Describe what's included in this package..."
            />
          </div>

          {/* Services Selection */}
          <div>
            <Label className="text-base font-medium">Included Services</Label>
            <p className="text-sm text-slate-600 mb-3">Select services that are bundled in this package</p>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {(services as any[])?.map((service: any) => (
                <Card 
                  key={service.id} 
                  className={`p-3 cursor-pointer transition-colors ${
                    selectedServices.includes(service.id) ? 'bg-blue-50 border-blue-200' : 'hover:bg-slate-50'
                  }`}
                  onClick={() => toggleService(service.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedServices.includes(service.id)}
                        onChange={() => toggleService(service.id)}
                        className="rounded"
                      />
                      <div>
                        <div className="font-medium">{service.name}</div>
                        <div className="text-sm text-slate-600">{service.description}</div>
                      </div>
                    </div>
                    <Badge variant="secondary">${service.price}</Badge>
                  </div>
                </Card>
              ))}
            </div>

            {selectedServices.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Selected Services ({selectedServices.length})</span>
                  <span className="font-medium">Individual Total: ${totalServicePrice.toFixed(2)}</span>
                </div>
                <div className="text-sm space-y-1">
                  {selectedServicesData.map((service: any) => (
                    <div key={service.id} className="flex justify-between">
                      <span>{service.name}</span>
                      <span>${service.price}</span>
                    </div>
                  ))}
                </div>
                {parseFloat(price) > 0 && parseFloat(price) !== totalServicePrice && (
                  <div className="mt-2 pt-2 border-t border-blue-200">
                    <div className="flex justify-between font-medium">
                      <span>Package Price (Bundled)</span>
                      <span>${parseFloat(price).toFixed(2)}</span>
                    </div>
                    <div className="text-xs text-blue-600">
                      Savings: ${(totalServicePrice - parseFloat(price)).toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

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
                  <span className="text-green-600 font-medium">${parseFloat(price).toFixed(2)}</span>
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
                      <span>+${feeAmount.toFixed(2)}</span>
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
                      <span>+${taxAmount.toFixed(2)}</span>
                    </div>
                  );
                })}
                
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Total with Taxes & Fees:</span>
                    <span className="text-blue-700">${calculatePackageTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 p-6 flex justify-between">
          <Button variant="destructive" onClick={handleDelete} disabled={deletePackage.isPending}>
            <Trash2 className="h-4 w-4 mr-2" />
            {deletePackage.isPending ? 'Deleting...' : 'Delete Package'}
          </Button>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={updatePackage.isPending || !name.trim() || !price}>
              <Save className="h-4 w-4 mr-2" />
              {updatePackage.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}