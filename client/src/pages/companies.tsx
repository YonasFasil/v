import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Building2, Users, Phone, Mail, Globe, MapPin, Plus, Edit, Trash2, Search, Eye } from "lucide-react";
import { type Company, type Customer } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function Companies() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [viewingCompany, setViewingCompany] = useState<Company | null>(null);
  const [viewingCustomers, setViewingCustomers] = useState<Customer[]>([]);
  const { toast } = useToast();

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    description: "",
    website: "",
    address: "",
    phone: "",
    email: "",
    notes: ""
  });

  const { data: companies = [], isLoading } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("POST", "/api/companies", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      setIsCreateModalOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Company created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create company",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<typeof formData> }) => {
      return apiRequest("PATCH", `/api/companies/${data.id}`, data.updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      setEditingCompany(null);
      resetForm();
      toast({
        title: "Success",
        description: "Company updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update company",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/companies/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({
        title: "Success",
        description: "Company deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete company",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      industry: "",
      description: "",
      website: "",
      address: "",
      phone: "",
      email: "",
      notes: ""
    });
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      industry: company.industry || "",
      description: company.description || "",
      website: company.website || "",
      address: company.address || "",
      phone: company.phone || "",
      email: company.email || "",
      notes: company.notes || ""
    });
  };

  const handleView = async (company: Company) => {
    setViewingCompany(company);
    // Fetch company customers
    const companyCustomers = customers.filter((c: Customer) => c.companyId === company.id);
    setViewingCustomers(companyCustomers);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCompany) {
      updateMutation.mutate({ id: editingCompany.id, updates: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredCompanies = companies.filter((company) =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (company.industry && company.industry.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getCompanyCustomerCount = (companyId: string) => {
    return customers.filter((c) => c.companyId === companyId).length;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Companies</h1>
          <p className="text-muted-foreground">
            Manage your business clients and corporate relationships
          </p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-company">
              <Plus className="w-4 h-4 mr-2" />
              Add Company
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Company</DialogTitle>
              <DialogDescription>
                Create a new business client profile
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name *</Label>
                <Input
                  id="name"
                  data-testid="input-company-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  data-testid="input-company-industry"
                  value={formData.industry}
                  onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  data-testid="input-company-email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  data-testid="input-company-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  data-testid="input-company-website"
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  data-testid="input-company-address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  rows={2}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    resetForm();
                  }}
                  data-testid="button-cancel-company"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  data-testid="button-save-company"
                >
                  {createMutation.isPending ? "Creating..." : "Create Company"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2 max-w-md">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search companies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          data-testid="input-search-companies"
          className="flex-1"
        />
      </div>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCompanies.map((company: Company) => (
          <Card key={company.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg" data-testid={`text-company-name-${company.id}`}>
                    {company.name}
                  </CardTitle>
                </div>
                <div className="flex space-x-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleView(company)}
                    data-testid={`button-view-company-${company.id}`}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(company)}
                    data-testid={`button-edit-company-${company.id}`}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(company.id)}
                    data-testid={`button-delete-company-${company.id}`}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
              {company.industry && (
                <Badge variant="secondary" data-testid={`text-company-industry-${company.id}`}>
                  {company.industry}
                </Badge>
              )}
              {company.description && (
                <CardDescription data-testid={`text-company-description-${company.id}`}>
                  {company.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center text-sm text-muted-foreground">
                <Users className="w-4 h-4 mr-2" />
                <span data-testid={`text-company-customers-${company.id}`}>
                  {getCompanyCustomerCount(company.id)} employees
                </span>
              </div>
              {company.email && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Mail className="w-4 h-4 mr-2" />
                  <span data-testid={`text-company-email-${company.id}`}>
                    {company.email}
                  </span>
                </div>
              )}
              {company.phone && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Phone className="w-4 h-4 mr-2" />
                  <span data-testid={`text-company-phone-${company.id}`}>
                    {company.phone}
                  </span>
                </div>
              )}
              {company.website && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Globe className="w-4 h-4 mr-2" />
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                    data-testid={`link-company-website-${company.id}`}
                  >
                    {company.website}
                  </a>
                </div>
              )}
              {company.address && (
                <div className="flex items-start text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 mr-2 mt-0.5" />
                  <span data-testid={`text-company-address-${company.id}`}>
                    {company.address}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCompanies.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No companies found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm ? "Try adjusting your search terms" : "Get started by adding your first company"}
          </p>
          {!searchTerm && (
            <Button onClick={() => setIsCreateModalOpen(true)} data-testid="button-create-first-company">
              <Plus className="w-4 h-4 mr-2" />
              Add Company
            </Button>
          )}
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={!!editingCompany} onOpenChange={() => {
        setEditingCompany(null);
        resetForm();
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Company</DialogTitle>
            <DialogDescription>
              Update company information
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Company Name *</Label>
              <Input
                id="edit-name"
                data-testid="input-edit-company-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-industry">Industry</Label>
              <Input
                id="edit-industry"
                data-testid="input-edit-company-industry"
                value={formData.industry}
                onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                data-testid="input-edit-company-email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                data-testid="input-edit-company-phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-website">Website</Label>
              <Input
                id="edit-website"
                data-testid="input-edit-company-website"
                value={formData.website}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Textarea
                id="edit-address"
                data-testid="input-edit-company-address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                data-testid="input-edit-company-notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingCompany(null);
                  resetForm();
                }}
                data-testid="button-cancel-edit-company"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                data-testid="button-save-edit-company"
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Company Details Modal */}
      <Dialog open={!!viewingCompany} onOpenChange={() => {
        setViewingCompany(null);
        setViewingCustomers([]);
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Building2 className="w-5 h-5" />
              <span>{viewingCompany?.name}</span>
            </DialogTitle>
            <DialogDescription>
              Company details and employee contacts
            </DialogDescription>
          </DialogHeader>
          
          {viewingCompany && (
            <div className="space-y-6">
              {/* Company Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Industry</Label>
                  <p className="text-sm text-muted-foreground">
                    {viewingCompany.industry || "Not specified"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge variant={viewingCompany.isActive ? "default" : "secondary"}>
                    {viewingCompany.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                {viewingCompany.email && (
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <p className="text-sm text-muted-foreground">{viewingCompany.email}</p>
                  </div>
                )}
                {viewingCompany.phone && (
                  <div>
                    <Label className="text-sm font-medium">Phone</Label>
                    <p className="text-sm text-muted-foreground">{viewingCompany.phone}</p>
                  </div>
                )}
                {viewingCompany.website && (
                  <div className="col-span-2">
                    <Label className="text-sm font-medium">Website</Label>
                    <p className="text-sm text-muted-foreground">
                      <a
                        href={viewingCompany.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {viewingCompany.website}
                      </a>
                    </p>
                  </div>
                )}
                {viewingCompany.address && (
                  <div className="col-span-2">
                    <Label className="text-sm font-medium">Address</Label>
                    <p className="text-sm text-muted-foreground">{viewingCompany.address}</p>
                  </div>
                )}
                {viewingCompany.description && (
                  <div className="col-span-2">
                    <Label className="text-sm font-medium">Description</Label>
                    <p className="text-sm text-muted-foreground">{viewingCompany.description}</p>
                  </div>
                )}
                {viewingCompany.notes && (
                  <div className="col-span-2">
                    <Label className="text-sm font-medium">Notes</Label>
                    <p className="text-sm text-muted-foreground">{viewingCompany.notes}</p>
                  </div>
                )}
              </div>

              {/* Employee Contacts */}
              <div>
                <h4 className="font-medium mb-3 flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  Employee Contacts ({viewingCustomers.length})
                </h4>
                {viewingCustomers.length > 0 ? (
                  <div className="space-y-2">
                    {viewingCustomers.map((customer) => (
                      <Card key={customer.id} className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium">{customer.name}</h5>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              {customer.jobTitle && <span>{customer.jobTitle}</span>}
                              {customer.department && <span>• {customer.department}</span>}
                            </div>
                          </div>
                          <div className="text-right text-sm text-muted-foreground">
                            <div>{customer.email}</div>
                            {customer.phone && <div>{customer.phone}</div>}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No employee contacts found</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}