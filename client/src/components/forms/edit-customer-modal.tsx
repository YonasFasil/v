import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X, Edit, Save, Trash2 } from "lucide-react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Company } from "@shared/schema";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: any;
}

export function EditCustomerModal({ open, onOpenChange, customer }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch companies for the dropdown
  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (customer && open) {
      setName(customer.name || "");
      setEmail(customer.email || "");
      setPhone(customer.phone || "");
      setCompanyId(customer.companyId || "");
      setStatus(customer.status || "lead");
      setNotes(customer.notes || "");
    }
  }, [customer, open]);

  const updateCustomer = useMutation({
    mutationFn: async (data: any) => {
      // Handle "none" company selection by setting companyId to null
      const submitData = {
        ...data,
        companyId: data.companyId === "none" ? null : data.companyId
      };
      return await apiRequest(`/api/customers/${customer.id}`, {
        method: "PATCH",
        body: JSON.stringify(submitData),
        headers: { "Content-Type": "application/json" }
      });
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
    updateCustomer.mutate({ name, email, phone, companyId: companyId || null, status, notes });
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
            <Label>Company (Optional)</Label>
            <Select value={companyId} onValueChange={setCompanyId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Company</SelectItem>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1"
              placeholder="Enter any notes about this customer"
              rows={3}
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