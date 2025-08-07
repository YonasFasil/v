import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Edit, Save, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: any;
}

export function EditCustomerModal({ open, onOpenChange, customer }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (customer && open) {
      setName(customer.name || "");
      setEmail(customer.email || "");
      setPhone(customer.phone || "");
      setCompany(customer.company || "");
      setAddress(customer.address || "");
    }
  }, [customer, open]);

  const updateCustomer = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PATCH", `/api/customers/${customer.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({ title: "Customer updated successfully!" });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ title: "Failed to update customer", description: error.message, variant: "destructive" });
    }
  });

  const deleteCustomer = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/customers/${customer.id}`, {});
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({ title: "Customer deleted successfully!" });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete customer", description: error.message, variant: "destructive" });
    }
  });

  const handleSave = () => {
    updateCustomer.mutate({ name, email, phone, company, address });
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this customer? This action cannot be undone.")) {
      deleteCustomer.mutate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0" aria-describedby="edit-customer-description">
        <DialogTitle className="sr-only">Edit Customer</DialogTitle>
        <div id="edit-customer-description" className="sr-only">
          Edit customer information including name, contact details, and company information.
        </div>
        
        <div className="border-b border-slate-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Edit className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Edit Customer</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <Label>Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
          </div>
          
          <div>
            <Label>Email *</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
          </div>
          
          <div>
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" />
          </div>
          
          <div>
            <Label>Company</Label>
            <Input value={company} onChange={(e) => setCompany(e.target.value)} className="mt-1" />
          </div>
          
          <div>
            <Label>Address</Label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-2 border rounded-md mt-1 h-20 resize-none text-sm"
              placeholder="Full address..."
            />
          </div>
        </div>

        <div className="border-t border-slate-200 p-6 flex justify-between">
          <Button variant="destructive" onClick={handleDelete} disabled={deleteCustomer.isPending}>
            <Trash2 className="h-4 w-4 mr-2" />
            {deleteCustomer.isPending ? 'Deleting...' : 'Delete'}
          </Button>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={updateCustomer.isPending || !name.trim() || !email.trim()}>
              <Save className="h-4 w-4 mr-2" />
              {updateCustomer.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}