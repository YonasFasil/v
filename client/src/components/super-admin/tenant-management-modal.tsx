import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TenantManagementModal({ open, onOpenChange }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: "",
    adminEmail: "",
    adminName: "",
    password: "",
    packageId: ""
  });

  // Fetch available subscription packages
  const { data: packages = [] } = useQuery({
    queryKey: ["/api/super-admin/packages"],
    enabled: open
  });

  const createTenantMutation = useMutation({
    mutationFn: (data: typeof formData) => {
      // Convert "none" to null for the server
      const payload = {
        ...data,
        packageId: data.packageId === "none" || data.packageId === "" ? null : data.packageId
      };
      return apiRequest("/api/super-admin/create-tenant", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      toast({ title: "Tenant created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/tenants"] });
      onOpenChange(false);
      setFormData({
        name: "",
        adminEmail: "",
        adminName: "",
        password: "",
        packageId: ""
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to create tenant", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.adminEmail || !formData.adminName || !formData.password) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    createTenantMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Tenant</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Organization Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Acme Corporation"
              required
            />
          </div>


          <div>
            <Label htmlFor="adminName">Admin Full Name *</Label>
            <Input
              id="adminName"
              value={formData.adminName}
              onChange={(e) => setFormData(prev => ({ ...prev, adminName: e.target.value }))}
              placeholder="John Smith"
              required
            />
          </div>

          <div>
            <Label htmlFor="adminEmail">Admin Email *</Label>
            <Input
              id="adminEmail"
              type="email"
              value={formData.adminEmail}
              onChange={(e) => setFormData(prev => ({ ...prev, adminEmail: e.target.value }))}
              placeholder="admin@acme.com"
              required
            />
          </div>

          <div>
            <Label htmlFor="password">Admin Password *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              placeholder="••••••••"
              required
            />
          </div>

          <div>
            <Label htmlFor="packageId">Subscription Package</Label>
            <Select 
              value={formData.packageId} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, packageId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a subscription package (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Package (Trial)</SelectItem>
                {packages.map((pkg: any) => (
                  <SelectItem key={pkg.id} value={pkg.id}>
                    {pkg.name} - ${pkg.monthlyPrice}/month
                    {pkg.features && pkg.features.length > 0 && (
                      <span className="text-xs text-muted-foreground ml-2">
                        ({pkg.features.slice(0, 2).join(', ')}{pkg.features.length > 2 ? '...' : ''})
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty for trial access. Package features will be activated upon assignment.
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createTenantMutation.isPending}
              className="flex-1"
            >
              {createTenantMutation.isPending ? "Creating..." : "Create Tenant"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}