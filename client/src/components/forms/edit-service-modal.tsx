import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Edit, Save, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: any;
}

export function EditServiceModal({ open, onOpenChange, service }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [pricingModel, setPricingModel] = useState("");

  useEffect(() => {
    if (service && open) {
      setName(service.name || "");
      setDescription(service.description || "");
      setPrice(service.price?.toString() || "");
      setCategory(service.category || "");
      setPricingModel(service.pricingModel || "fixed");
    }
  }, [service, open]);

  const updateService = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PATCH", `/api/services/${service.id}`, data);
      return response.json();
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

  const handleSave = () => {
    updateService.mutate({
      name,
      description,
      price: parseFloat(price) || 0,
      category,
      pricingModel
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