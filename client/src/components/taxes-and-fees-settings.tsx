import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Edit, CreditCard, DollarSign, Percent } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { TaxSetting, InsertTaxSetting } from "@shared/schema";

interface TaxFeeFormData {
  name: string;
  type: "tax" | "fee" | "service_charge";
  calculation: "percentage" | "fixed";
  value: string;
  applyTo: "packages" | "services" | "both" | "total";
  description: string;
  isActive: boolean;
  isTaxable: boolean;
}

const defaultTaxFeeForm: TaxFeeFormData = {
  name: "",
  type: "tax",
  calculation: "percentage",
  value: "",
  applyTo: "both",
  description: "",
  isActive: true,
  isTaxable: false
};

export function TaxesAndFeesSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TaxSetting | null>(null);
  const [formData, setFormData] = useState<TaxFeeFormData>(defaultTaxFeeForm);

  // Fetch taxes and fees
  const { data: taxesAndFees = [], isLoading } = useQuery({
    queryKey: ["/api/tax-settings"],
  });

  // Create tax/fee mutation
  const createMutation = useMutation({
    mutationFn: async (data: InsertTaxSetting) => {
      return apiRequest("POST", `/api/tax-settings`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tax-settings"] });
      setIsAddDialogOpen(false);
      setFormData(defaultTaxFeeForm);
      toast({
        title: "Success",
        description: `${formData.type} created successfully`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: `Failed to create ${formData.type}`,
        variant: "destructive",
      });
    },
  });

  // Update tax/fee mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertTaxSetting> }) => {
      return apiRequest("PATCH", `/api/tax-settings/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tax-settings"] });
      setEditingItem(null);
      setFormData(defaultTaxFeeForm);
      toast({
        title: "Success",
        description: `${formData.type} updated successfully`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: `Failed to update ${formData.type}`,
        variant: "destructive",
      });
    },
  });

  // Delete tax/fee mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/tax-settings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tax-settings"] });
      toast({
        title: "Success",
        description: "Item deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.value) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const data: InsertTaxSetting = {
      name: formData.name,
      type: formData.type,
      calculation: formData.calculation,
      value: formData.value,
      applyTo: formData.applyTo,
      description: formData.description || null,
      isActive: formData.isActive,
      isTaxable: formData.isTaxable,
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (item: TaxSetting) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      type: item.type as "tax" | "fee" | "service_charge",
      calculation: item.calculation as "percentage" | "fixed",
      value: item.value,
      applyTo: item.applyTo as "packages" | "services" | "both" | "total",
      description: item.description || "",
      isActive: item.isActive || true,
      isTaxable: item.isTaxable || false,
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this item?")) {
      deleteMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setFormData(defaultTaxFeeForm);
    setEditingItem(null);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "tax":
        return <Percent className="w-4 h-4" />;
      case "fee":
        return <DollarSign className="w-4 h-4" />;
      case "service_charge":
        return <CreditCard className="w-4 h-4" />;
      default:
        return <Percent className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "tax":
        return "bg-blue-100 text-blue-800";
      case "fee":
        return "bg-green-100 text-green-800";
      case "service_charge":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            Taxes and Fees Configuration
          </CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Tax/Fee
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? "Edit" : "Add"} Tax/Fee
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Sales Tax, Service Fee, etc."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select value={formData.type} onValueChange={(value: "tax" | "fee" | "service_charge") => setFormData({ ...formData, type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tax">Tax</SelectItem>
                        <SelectItem value="fee">Fee</SelectItem>
                        <SelectItem value="service_charge">Service Charge</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="calculation">Calculation</Label>
                    <Select value={formData.calculation} onValueChange={(value: "percentage" | "fixed") => setFormData({ ...formData, calculation: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="value">Value *</Label>
                  <Input
                    id="value"
                    type="number"
                    step="0.01"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    placeholder={formData.calculation === "percentage" ? "8.5" : "25.00"}
                  />
                  <p className="text-xs text-slate-500">
                    {formData.calculation === "percentage" ? "Enter percentage (e.g., 8.5 for 8.5%)" : "Enter fixed amount in dollars"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="applyTo">Apply To</Label>
                  <Select value={formData.applyTo} onValueChange={(value: "packages" | "services" | "both" | "total") => setFormData({ ...formData, applyTo: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="packages">Packages Only</SelectItem>
                      <SelectItem value="services">Services Only</SelectItem>
                      <SelectItem value="both">Packages & Services</SelectItem>
                      <SelectItem value="total">Event Total</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description"
                  />
                </div>

                {(formData.type === "fee" || formData.type === "service_charge") && (
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-base font-medium">Subject to Tax</Label>
                      <p className="text-xs text-slate-500">Whether this {formData.type.replace("_", " ")} is taxable</p>
                    </div>
                    <Switch
                      checked={formData.isTaxable}
                      onCheckedChange={(checked) => setFormData({ ...formData, isTaxable: checked })}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Active</Label>
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {editingItem ? "Update" : "Create"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Loading taxes and fees...</div>
        ) : taxesAndFees.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <CreditCard className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="text-lg font-medium mb-2">No taxes or fees configured</p>
            <p className="text-sm">Add your first tax or fee to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {taxesAndFees.map((item: TaxSetting) => (
              <div key={item.id} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${getTypeColor(item.type)}`}>
                      {getTypeIcon(item.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{item.name}</h3>
                        <Badge variant="outline" className={getTypeColor(item.type)}>
                          {item.type}
                        </Badge>
                        {!item.isActive && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-600">
                        {item.calculation === "percentage" 
                          ? `${item.value}% of ${item.applyTo}`
                          : `$${item.value} ${item.calculation} fee on ${item.applyTo}`
                        }
                        {item.isTaxable && (item.type === "fee" || item.type === "service_charge") && (
                          <span className="text-orange-600 ml-2">• Taxable</span>
                        )}
                      </p>
                      {item.description && (
                        <p className="text-xs text-slate-500 mt-1">{item.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(item)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">How Taxes and Fees Work</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Taxes:</strong> Applied based on local tax requirements (sales tax, VAT, etc.)</li>
            <li>• <strong>Fees:</strong> Additional charges like processing fees, service charges</li>
            <li>• <strong>Taxable Fees:</strong> Fees can be marked as "Subject to Tax" if they need tax applied to them</li>
            <li>• <strong>Calculation Order:</strong> Base price + fees → apply taxes to taxable items</li>
            <li>• <strong>Packages/Services:</strong> Control which taxes and fees apply to each package or service</li>
            <li>• <strong>Event Level:</strong> Override tax/fee settings for individual events during creation</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}