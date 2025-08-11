import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Edit, CreditCard } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { TaxSetting, InsertTaxSetting } from "@shared/schema";

interface TaxFormData {
  name: string;
  rate: string;
  isActive: boolean;
  isDefault: boolean;
}

const defaultForm: TaxFormData = {
  name: "",
  rate: "",
  isActive: true,
  isDefault: false
};

export function SimpleTaxSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TaxSetting | null>(null);
  const [formData, setFormData] = useState<TaxFormData>(defaultForm);

  // Fetch tax settings
  const { data: taxSettings = [], isLoading } = useQuery({
    queryKey: ["/api/tax-settings"],
  });

  const taxSettingsData = taxSettings as TaxSetting[];

  // Create tax setting mutation
  const createMutation = useMutation({
    mutationFn: async (data: InsertTaxSetting) => {
      return apiRequest("POST", `/api/tax-settings`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tax-settings"] });
      setIsAddDialogOpen(false);
      setFormData(defaultForm);
      setEditingItem(null);
      toast({
        title: "Success",
        description: "Tax setting created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create tax setting",
        variant: "destructive",
      });
    },
  });

  // Update tax setting mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertTaxSetting> }) => {
      return apiRequest("PATCH", `/api/tax-settings/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tax-settings"] });
      setEditingItem(null);
      setFormData(defaultForm);
      setIsAddDialogOpen(false);
      toast({
        title: "Success",
        description: "Tax setting updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update tax setting",
        variant: "destructive",
      });
    },
  });

  // Delete tax setting mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/tax-settings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tax-settings"] });
      toast({
        title: "Success",
        description: "Tax setting deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete tax setting",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.rate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(parseFloat(formData.rate))) {
      toast({
        title: "Error",
        description: "Rate must be a valid number",
        variant: "destructive",
      });
      return;
    }

    const data: InsertTaxSetting = {
      name: formData.name,
      rate: formData.rate,
      isActive: formData.isActive,
      isDefault: formData.isDefault,
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
      rate: item.rate,
      isActive: item.isActive || true,
      isDefault: item.isDefault || false,
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this tax setting?")) {
      deleteMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setFormData(defaultForm);
    setEditingItem(null);
  };

  if (isLoading) {
    return <div>Loading tax settings...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            Tax Settings
          </CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Tax Setting
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? "Edit" : "Add"} Tax Setting
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Sales Tax, VAT"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rate">Rate *</Label>
                  <Input
                    id="rate"
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                    placeholder="e.g., 8.25"
                    type="number"
                    step="0.01"
                  />
                  <p className="text-xs text-slate-500">
                    Enter the rate as a percentage (e.g., 8.25 for 8.25%)
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="isActive">Active</Label>
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="isDefault">Default Tax</Label>
                  <Switch
                    id="isDefault"
                    checked={formData.isDefault}
                    onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleSubmit}
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1"
                  >
                    {editingItem ? "Update" : "Create"}
                  </Button>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        {taxSettingsData.length === 0 ? (
          <p className="text-slate-500 text-center py-8">
            No tax settings configured yet. Add your first tax setting to get started.
          </p>
        ) : (
          <div className="space-y-3">
            {taxSettingsData.map((tax) => (
              <div
                key={tax.id}
                className="flex items-center justify-between p-4 border rounded-lg bg-slate-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{tax.name}</h4>
                    {tax.isDefault && (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                        Default
                      </span>
                    )}
                    {!tax.isActive && (
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mt-1">
                    Rate: {tax.rate}%
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(tax)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(tax.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}