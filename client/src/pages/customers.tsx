import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Users, Mail, Phone, Building, Star, DollarSign, Calendar, 
  TrendingUp, Search, Filter, Plus, Eye, Edit2, MoreHorizontal,
  Crown, Award, Medal, Trophy, Building2, Globe, MapPin, Trash2
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useFormattedCurrency } from "@/lib/currency";
import type { Customer, Company } from "@shared/schema";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCustomerSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Types for customer analytics
interface CustomerAnalytics {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  companyId: string | null;
  status: string;
  notes: string | null;
  analytics: {
    totalRevenue: number;
    lifetimeValue: number;
    lifetimeValueCategory: string;
    bookingsCount: number;
    confirmedBookings: number;
    pendingBookings: number;
    cancelledBookings: number;
    averageBookingValue: number;
    lastEventDate: string | null;
    lastEventName: string | null;
    customerSince: string;
  };
}

export default function Customers() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [companySearchQuery, setCompanySearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [valueFilter, setValueFilter] = useState<string>("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCreateCompanyForm, setShowCreateCompanyForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerAnalytics | null>(null);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [viewingCompany, setViewingCompany] = useState<Company | null>(null);
  const [viewingCustomers, setViewingCustomers] = useState<Customer[]>([]);
  const [showAddEmployeeForm, setShowAddEmployeeForm] = useState(false);
  const { toast } = useToast();
  const { formatAmount } = useFormattedCurrency();

  // Fetch customer analytics
  const { data: customerAnalytics = [], isLoading } = useQuery<CustomerAnalytics[]>({
    queryKey: ["/api/customers/analytics"],
  });

  // Fetch companies
  const { data: companies = [], isLoading: companiesLoading } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  // Fetch all customers for company viewing
  const { data: allCustomers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const form = useForm({
    resolver: zodResolver(insertCustomerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      status: "lead",
      notes: "",
    }
  });

  // Company form state
  const [companyFormData, setCompanyFormData] = useState({
    name: "",
    industry: "",
    description: "",
    website: "",
    address: "",
    phone: "",
    email: "",
    notes: ""
  });

  // Employee form for adding to company
  const employeeForm = useForm({
    resolver: zodResolver(insertCustomerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      status: "customer",
      notes: "",
    }
  });

  const createCustomerMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/customers", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers/analytics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setShowCreateForm(false);
      form.reset();
      toast({
        title: "Success",
        description: "Customer created successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create customer. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Company mutations
  const createCompanyMutation = useMutation({
    mutationFn: async (data: typeof companyFormData) => {
      return apiRequest("POST", "/api/companies", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      setShowCreateCompanyForm(false);
      resetCompanyForm();
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

  const updateCompanyMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<typeof companyFormData> }) => {
      return apiRequest("PATCH", `/api/companies/${data.id}`, data.updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      setEditingCompany(null);
      resetCompanyForm();
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

  const deleteCompanyMutation = useMutation({
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

  const resetCompanyForm = () => {
    setCompanyFormData({
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

  const handleEditCompany = (company: Company) => {
    setEditingCompany(company);
    setCompanyFormData({
      name: company.name,
      industry: company.industry || "",
      description: company.description || "",
      website: company.website || "",
      address: company.address || "",
      phone: company.phone || "",
      email: company.email || "",
      notes: company.notes || ""
    });
    setShowCreateCompanyForm(true);
  };

  const handleViewCompany = (company: Company) => {
    setViewingCompany(company);
    const companyCustomers = allCustomers.filter(customer => customer.companyId === company.id);
    setViewingCustomers(companyCustomers);
  };

  // Update viewing customers when allCustomers data changes
  useEffect(() => {
    if (viewingCompany && allCustomers) {
      const companyCustomers = allCustomers.filter(customer => customer.companyId === viewingCompany.id);
      setViewingCustomers(companyCustomers);
    }
  }, [allCustomers, viewingCompany]);

  // Create employee mutation
  const createEmployeeMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/customers", {
        ...data,
        companyId: viewingCompany?.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers/analytics"] });
      setShowAddEmployeeForm(false);
      employeeForm.reset();
      toast({
        title: "Success",
        description: "Employee added successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add employee. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddEmployee = (data: any) => {
    createEmployeeMutation.mutate(data);
  };

  const onSubmit = async (data: any) => {
    createCustomerMutation.mutate(data);
  };

  const handleSubmitCompany = () => {
    if (editingCompany) {
      updateCompanyMutation.mutate({ id: editingCompany.id, updates: companyFormData });
    } else {
      createCompanyMutation.mutate(companyFormData);
    }
  };

  // Filter customers
  const filteredCustomers = customerAnalytics.filter(customer => {
    const companyName = customer.companyId ? companies.find(c => c.id === customer.companyId)?.name : '';
    const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (companyName?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    
    const matchesStatus = statusFilter === "all" || customer.status === statusFilter;
    
    const matchesValue = valueFilter === "all" || customer.analytics.lifetimeValueCategory === valueFilter;
    
    return matchesSearch && matchesStatus && matchesValue;
  });

  // Filter companies
  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(companySearchQuery.toLowerCase()) ||
                         (company.industry?.toLowerCase().includes(companySearchQuery.toLowerCase()) || false) ||
                         (company.email?.toLowerCase().includes(companySearchQuery.toLowerCase()) || false);
    
    return matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "customer": return "bg-green-100 text-green-800";
      case "lead": return "bg-blue-100 text-blue-800";
      case "inactive": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getValueIcon = (category: string) => {
    switch (category) {
      case "Platinum": return <Crown className="h-4 w-4 text-purple-600" />;
      case "Gold": return <Trophy className="h-4 w-4 text-yellow-600" />;
      case "Silver": return <Award className="h-4 w-4 text-gray-600" />;
      default: return <Medal className="h-4 w-4 text-orange-600" />;
    }
  };

  const getValueColor = (category: string) => {
    switch (category) {
      case "Platinum": return "bg-purple-100 text-purple-800";
      case "Gold": return "bg-yellow-100 text-yellow-800";
      case "Silver": return "bg-gray-100 text-gray-800";
      default: return "bg-orange-100 text-orange-800";
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString();
  };

  // Calculate summary stats
  const totalRevenue = customerAnalytics.reduce((sum, customer) => sum + customer.analytics.totalRevenue, 0);
  const totalCustomers = customerAnalytics.filter(c => c.status === "customer").length;
  const totalLeads = customerAnalytics.filter(c => c.status === "lead").length;
  const averageValue = customerAnalytics.length > 0 ? totalRevenue / customerAnalytics.length : 0;

  if (isLoading || companiesLoading) {
    return (
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Customers" subtitle="Loading customer data..." />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-6 bg-gray-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Card className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-96 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      
      <MobileNav 
        isOpen={mobileNavOpen} 
        onClose={() => setMobileNavOpen(false)} 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Customers" 
          subtitle="Manage individual customers and company relationships"
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <Tabs defaultValue="customers" className="space-y-6">
            <div className="flex justify-between items-center">
              <TabsList className="grid w-[400px] grid-cols-2">
                <TabsTrigger value="customers" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Individual Customers
                </TabsTrigger>
                <TabsTrigger value="companies" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Companies
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Individual Customers Tab */}
            <TabsContent value="customers" className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                        <p className="text-2xl font-bold text-green-600">{formatAmount(totalRevenue)}</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Active Customers</p>
                        <p className="text-2xl font-bold text-blue-600">{totalCustomers}</p>
                      </div>
                      <Users className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Leads</p>
                        <p className="text-2xl font-bold text-orange-600">{totalLeads}</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Average Value</p>
                        <p className="text-2xl font-bold text-purple-600">{formatAmount(averageValue)}</p>
                      </div>
                      <Star className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filters and Search */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="flex gap-2 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input
                      placeholder="Search customers..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      data-testid="input-search-customers"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={valueFilter} onValueChange={setValueFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Value" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Values</SelectItem>
                      <SelectItem value="Platinum">Platinum</SelectItem>
                      <SelectItem value="Gold">Gold</SelectItem>
                      <SelectItem value="Silver">Silver</SelectItem>
                      <SelectItem value="Bronze">Bronze</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-add-customer">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Customer
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add New Customer</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pb-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter full name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="Enter email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone (Optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter phone number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="company"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Company (Optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter company name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Status</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="lead">Lead</SelectItem>
                                  <SelectItem value="customer">Customer</SelectItem>
                                  <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Notes (Optional)</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Enter any notes about this customer" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button 
                          type="submit" 
                          className="w-full"
                          disabled={createCustomerMutation.isPending}
                        >
                          {createCustomerMutation.isPending ? "Creating..." : "Create Customer"}
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Customer Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Customer Analytics</CardTitle>
                  <CardDescription>
                    Complete overview of customer data and performance metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Value Tier</TableHead>
                        <TableHead>Total Revenue</TableHead>
                        <TableHead>Bookings</TableHead>
                        <TableHead>Last Event</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCustomers.map((customer) => {
                        const companyName = customer.companyId ? companies.find(c => c.id === customer.companyId)?.name : null;
                        return (
                          <TableRow key={customer.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{customer.name}</div>
                                <div className="text-sm text-gray-500 flex items-center">
                                  <Mail className="h-3 w-3 mr-1" />
                                  {customer.email}
                                </div>
                                {customer.phone && (
                                  <div className="text-sm text-gray-500 flex items-center">
                                    <Phone className="h-3 w-3 mr-1" />
                                    {customer.phone}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(customer.status)}>
                                {customer.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {companyName ? (
                                <div className="flex items-center">
                                  <Building className="h-4 w-4 mr-1 text-gray-500" />
                                  {companyName}
                                </div>
                              ) : (
                                <span className="text-gray-500">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge className={`${getValueColor(customer.analytics.lifetimeValueCategory)} flex items-center gap-1`}>
                                {getValueIcon(customer.analytics.lifetimeValueCategory)}
                                {customer.analytics.lifetimeValueCategory}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatAmount(customer.analytics.totalRevenue)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-4 text-sm">
                                <span className="text-green-600">{customer.analytics.confirmedBookings}</span>
                                <span className="text-orange-600">{customer.analytics.pendingBookings}</span>
                                <span className="text-red-600">{customer.analytics.cancelledBookings}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {customer.analytics.lastEventDate ? (
                                  <>
                                    <div className="font-medium">{customer.analytics.lastEventName}</div>
                                    <div className="text-gray-500">{formatDate(customer.analytics.lastEventDate)}</div>
                                  </>
                                ) : (
                                  <span className="text-gray-500">No events yet</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setSelectedCustomer(customer)}
                                data-testid={`button-view-customer-${customer.id}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Companies Tab */}
            <TabsContent value="companies" className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    placeholder="Search companies..."
                    value={companySearchQuery}
                    onChange={(e) => setCompanySearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-companies"
                  />
                </div>
                <Dialog open={showCreateCompanyForm} onOpenChange={setShowCreateCompanyForm}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-add-company">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Company
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingCompany ? "Edit Company" : "Add New Company"}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Company Name</Label>
                          <Input
                            id="name"
                            value={companyFormData.name}
                            onChange={(e) => setCompanyFormData({ ...companyFormData, name: e.target.value })}
                            placeholder="Enter company name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="industry">Industry</Label>
                          <Input
                            id="industry"
                            value={companyFormData.industry}
                            onChange={(e) => setCompanyFormData({ ...companyFormData, industry: e.target.value })}
                            placeholder="Enter industry"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={companyFormData.description}
                          onChange={(e) => setCompanyFormData({ ...companyFormData, description: e.target.value })}
                          placeholder="Brief company description"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="website">Website</Label>
                          <Input
                            id="website"
                            value={companyFormData.website}
                            onChange={(e) => setCompanyFormData({ ...companyFormData, website: e.target.value })}
                            placeholder="https://example.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={companyFormData.email}
                            onChange={(e) => setCompanyFormData({ ...companyFormData, email: e.target.value })}
                            placeholder="contact@company.com"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            value={companyFormData.phone}
                            onChange={(e) => setCompanyFormData({ ...companyFormData, phone: e.target.value })}
                            placeholder="Phone number"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="address">Address</Label>
                          <Input
                            id="address"
                            value={companyFormData.address}
                            onChange={(e) => setCompanyFormData({ ...companyFormData, address: e.target.value })}
                            placeholder="Company address"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          id="notes"
                          value={companyFormData.notes}
                          onChange={(e) => setCompanyFormData({ ...companyFormData, notes: e.target.value })}
                          placeholder="Additional notes"
                        />
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => {
                          setShowCreateCompanyForm(false);
                          setEditingCompany(null);
                          resetCompanyForm();
                        }}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleSubmitCompany}
                          disabled={createCompanyMutation.isPending || updateCompanyMutation.isPending}
                        >
                          {editingCompany ? "Update Company" : "Create Company"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Companies Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCompanies.map((company) => {
                  const employeeCount = allCustomers.filter(c => c.companyId === company.id).length;
                  return (
                    <Card key={company.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{company.name}</CardTitle>
                            {company.industry && (
                              <CardDescription className="flex items-center mt-1">
                                <Building className="h-4 w-4 mr-1" />
                                {company.industry}
                              </CardDescription>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewCompany(company)}
                              data-testid={`button-view-company-${company.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditCompany(company)}
                              data-testid={`button-edit-company-${company.id}`}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteCompanyMutation.mutate(company.id)}
                              data-testid={`button-delete-company-${company.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {company.description && (
                          <p className="text-sm text-gray-600 mb-3">{company.description}</p>
                        )}
                        
                        <div className="space-y-2 text-sm">
                          {company.email && (
                            <div className="flex items-center text-gray-600">
                              <Mail className="h-4 w-4 mr-2" />
                              {company.email}
                            </div>
                          )}
                          {company.phone && (
                            <div className="flex items-center text-gray-600">
                              <Phone className="h-4 w-4 mr-2" />
                              {company.phone}
                            </div>
                          )}
                          {company.website && (
                            <div className="flex items-center text-gray-600">
                              <Globe className="h-4 w-4 mr-2" />
                              <a href={company.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                {company.website}
                              </a>
                            </div>
                          )}
                          {company.address && (
                            <div className="flex items-center text-gray-600">
                              <MapPin className="h-4 w-4 mr-2" />
                              {company.address}
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-4 pt-3 border-t">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Employees</span>
                            <Badge variant="secondary">{employeeCount}</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {selectedCustomer.name}
              </DialogTitle>
              <DialogDescription>
                Customer since {formatDate(selectedCustomer.analytics.customerSince)}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{selectedCustomer.email}</span>
                  </div>
                  {selectedCustomer.phone && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-gray-500" />
                      <span>{selectedCustomer.phone}</span>
                    </div>
                  )}
                  {selectedCustomer.companyId && (
                    <div className="flex items-center">
                      <Building className="h-4 w-4 mr-2 text-gray-500" />
                      <span>{companies.find(c => c.id === selectedCustomer.companyId)?.name}</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <Badge className={getStatusColor(selectedCustomer.status)}>
                      {selectedCustomer.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
              
              {/* Revenue Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Revenue Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {formatAmount(selectedCustomer.analytics.totalRevenue)}
                      </div>
                      <div className="text-sm text-gray-500">Total Revenue</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {formatAmount(selectedCustomer.analytics.averageBookingValue)}
                      </div>
                      <div className="text-sm text-gray-500">Average Booking</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <Badge className={`${getValueColor(selectedCustomer.analytics.lifetimeValueCategory)} flex items-center gap-1`}>
                      {getValueIcon(selectedCustomer.analytics.lifetimeValueCategory)}
                      {selectedCustomer.analytics.lifetimeValueCategory} Customer
                    </Badge>
                  </div>
                </CardContent>
              </Card>
              
              {/* Booking Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Booking Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{selectedCustomer.analytics.bookingsCount}</div>
                      <div className="text-sm text-gray-500">Total</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{selectedCustomer.analytics.confirmedBookings}</div>
                      <div className="text-sm text-gray-500">Confirmed</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600">{selectedCustomer.analytics.pendingBookings}</div>
                      <div className="text-sm text-gray-500">Pending</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">{selectedCustomer.analytics.cancelledBookings}</div>
                      <div className="text-sm text-gray-500">Cancelled</div>
                    </div>
                  </div>
                  
                  {selectedCustomer.analytics.lastEventDate && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium">Last Event:</div>
                      <div className="text-sm text-gray-600">{selectedCustomer.analytics.lastEventName}</div>
                      <div className="text-sm text-gray-500">{formatDate(selectedCustomer.analytics.lastEventDate)}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Notes */}
              {selectedCustomer.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">{selectedCustomer.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Company Detail Modal */}
      {viewingCompany && (
        <Dialog open={!!viewingCompany} onOpenChange={() => setViewingCompany(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {viewingCompany.name}
              </DialogTitle>
              <DialogDescription>
                {viewingCompany.industry && `${viewingCompany.industry} • `}
                {viewingCustomers.length} employee{viewingCustomers.length !== 1 ? 's' : ''}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Company Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Company Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {viewingCompany.description && (
                    <p className="text-gray-600">{viewingCompany.description}</p>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    {viewingCompany.email && (
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{viewingCompany.email}</span>
                      </div>
                    )}
                    {viewingCompany.phone && (
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{viewingCompany.phone}</span>
                      </div>
                    )}
                    {viewingCompany.website && (
                      <div className="flex items-center">
                        <Globe className="h-4 w-4 mr-2 text-gray-500" />
                        <a href={viewingCompany.website} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-600">
                          {viewingCompany.website}
                        </a>
                      </div>
                    )}
                    {viewingCompany.address && (
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{viewingCompany.address}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Employees */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Employees ({viewingCustomers.length})
                    </CardTitle>
                    <Dialog open={showAddEmployeeForm} onOpenChange={setShowAddEmployeeForm}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700" data-testid="button-add-employee">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Employee
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Add Employee to {viewingCompany?.name}</DialogTitle>
                          <DialogDescription>
                            Add a new employee to this company's team.
                          </DialogDescription>
                        </DialogHeader>
                        <Form {...employeeForm}>
                          <form onSubmit={employeeForm.handleSubmit(handleAddEmployee)} className="space-y-4 pb-4">
                            <FormField
                              control={employeeForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Full Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Enter employee's full name" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={employeeForm.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email</FormLabel>
                                  <FormControl>
                                    <Input type="email" placeholder="Enter employee's email" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={employeeForm.control}
                              name="phone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Phone (Optional)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Enter phone number" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={employeeForm.control}
                              name="status"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Status</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="customer">Customer</SelectItem>
                                      <SelectItem value="lead">Lead</SelectItem>
                                      <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={employeeForm.control}
                              name="notes"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Notes (Optional)</FormLabel>
                                  <FormControl>
                                    <Textarea placeholder="Enter any notes about this employee" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <Button 
                              type="submit" 
                              className="w-full"
                              disabled={createEmployeeMutation.isPending}
                            >
                              {createEmployeeMutation.isPending ? "Adding Employee..." : "Add Employee"}
                            </Button>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {viewingCustomers.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {viewingCustomers.map((customer) => (
                          <TableRow key={customer.id}>
                            <TableCell className="font-medium">{customer.name}</TableCell>
                            <TableCell>{customer.email}</TableCell>
                            <TableCell>{customer.phone || '-'}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(customer.status)}>
                                {customer.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No employees found for this company.</p>
                  )}
                </CardContent>
              </Card>
              
              {/* Notes */}
              {viewingCompany.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">{viewingCompany.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}