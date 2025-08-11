import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Users, Mail, Phone, Building, Star, DollarSign, Calendar, 
  TrendingUp, Search, Filter, Plus, Eye, Edit2, MoreHorizontal,
  Crown, Award, Medal, Trophy
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useFormattedCurrency } from "@/lib/currency";
import type { Customer } from "@shared/schema";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCustomerSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface CustomerAnalytics extends Customer {
  analytics: {
    totalRevenue: number;
    eventCount: number;
    averageEventValue: number;
    lastEventDate: string | null;
    lastEventName: string | null;
    lifetimeValueCategory: "Bronze" | "Silver" | "Gold" | "Platinum";
    totalPaid: number;
    totalPending: number;
    confirmedBookings: number;
    pendingBookings: number;
    cancelledBookings: number;
    customerSince: string;
  };
}

export default function Customers() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [valueFilter, setValueFilter] = useState<string>("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerAnalytics | null>(null);
  const { toast } = useToast();
  const { formatAmount } = useFormattedCurrency();

  // Fetch customer analytics
  const { data: customerAnalytics = [], isLoading } = useQuery<CustomerAnalytics[]>({
    queryKey: ["/api/customers/analytics"],
  });

  const form = useForm({
    resolver: zodResolver(insertCustomerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      company: "",
      notes: "",
    }
  });

  const createCustomerMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/customers", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers/analytics"] });
      setShowCreateForm(false);
      form.reset();
      toast({
        title: "Success",
        description: "Customer created successfully!",
      });
    },
    onError: (error: any) => {
      console.error('Customer creation error in UI:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create customer. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: any) => {
    console.log('Form data being submitted:', data);
    createCustomerMutation.mutate(data);
  };

  // Filter customers
  const filteredCustomers = customerAnalytics.filter(customer => {
    const fullName = `${customer.firstName} ${customer.lastName}`;
    const matchesSearch = fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (customer.company?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    
    const matchesValue = valueFilter === "all" || customer.analytics.lifetimeValueCategory === valueFilter;
    
    return matchesSearch && matchesValue;
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

  // Remove this function as we'll use the hook instead

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString();
  };

  // Calculate summary stats
  const totalRevenue = customerAnalytics.reduce((sum, customer) => sum + customer.analytics.totalRevenue, 0);
  const totalCustomers = customerAnalytics.length;
  const averageValue = customerAnalytics.length > 0 ? totalRevenue / customerAnalytics.length : 0;

  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Customer Analytics" subtitle="Comprehensive customer data and revenue insights" />
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
          title="Customer Analytics" 
          subtitle="Comprehensive customer data and revenue insights"
          action={
            <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
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
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter first name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter last name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
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
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Enter any notes" {...field} />
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
          }
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-500">Total Revenue</span>
                  </div>
                  <div className="text-2xl font-bold">{formatAmount(totalRevenue)}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-500">Total Customers</span>
                  </div>
                  <div className="text-2xl font-bold">{totalCustomers}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium text-gray-500">Total Leads</span>
                  </div>
                  <div className="text-2xl font-bold">0</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Star className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium text-gray-500">Avg. Customer Value</span>
                  </div>
                  <div className="text-2xl font-bold">{formatAmount(averageValue)}</div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search customers by name, email, or company..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="lead">Leads</SelectItem>
                      <SelectItem value="customer">Customers</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={valueFilter} onValueChange={setValueFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by Value" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="Platinum">Platinum</SelectItem>
                      <SelectItem value="Gold">Gold</SelectItem>
                      <SelectItem value="Silver">Silver</SelectItem>
                      <SelectItem value="Bronze">Bronze</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Customer Analytics Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Customer Analytics ({filteredCustomers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Value Tier</TableHead>
                        <TableHead className="text-right">Total Revenue</TableHead>
                        <TableHead className="text-right">Events</TableHead>
                        <TableHead className="text-right">Avg. Event Value</TableHead>
                        <TableHead>Last Event</TableHead>
                        <TableHead>Customer Since</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCustomers.map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">{customer.firstName} {customer.lastName}</div>
                              <div className="text-sm text-gray-500 flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {customer.email}
                              </div>
                              {customer.company && (
                                <div className="text-sm text-gray-500 flex items-center gap-1">
                                  <Building className="h-3 w-3" />
                                  {customer.company}
                                </div>
                              )}
                              {customer.phone && (
                                <div className="text-sm text-gray-500 flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {customer.phone}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800">
                              Customer
                            </Badge>
                          </TableCell>
                          
                          <TableCell>
                            <Badge className={getValueColor(customer.analytics.lifetimeValueCategory)}>
                              <span className="flex items-center gap-1">
                                {getValueIcon(customer.analytics.lifetimeValueCategory)}
                                {customer.analytics.lifetimeValueCategory}
                              </span>
                            </Badge>
                          </TableCell>
                          
                          <TableCell className="text-right font-medium">
                            {formatAmount(customer.analytics.totalRevenue)}
                          </TableCell>
                          
                          <TableCell className="text-right">
                            <div className="space-y-1">
                              <div className="font-medium">{customer.analytics.eventCount}</div>
                              <div className="text-xs text-gray-500">
                                {customer.analytics.confirmedBookings}C / {customer.analytics.pendingBookings}P / {customer.analytics.cancelledBookings}X
                              </div>
                            </div>
                          </TableCell>
                          
                          <TableCell className="text-right">
                            {formatAmount(customer.analytics.averageEventValue)}
                          </TableCell>
                          
                          <TableCell>
                            {customer.analytics.lastEventDate ? (
                              <div className="space-y-1">
                                <div className="text-sm">{formatDate(customer.analytics.lastEventDate)}</div>
                                <div className="text-xs text-gray-500 truncate max-w-[120px]">
                                  {customer.analytics.lastEventName}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-500">No events</span>
                            )}
                          </TableCell>
                          
                          <TableCell>
                            {formatDate(customer.analytics.customerSince)}
                          </TableCell>
                          
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedCustomer(customer)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {filteredCustomers.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No customers found matching your criteria.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {selectedCustomer.firstName} {selectedCustomer.lastName} - Customer Details
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span>{selectedCustomer.email}</span>
                    </div>
                    {selectedCustomer.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span>{selectedCustomer.phone}</span>
                      </div>
                    )}
                    {selectedCustomer.company && (
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-500" />
                        <span>{selectedCustomer.company}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>Customer since {formatDate(selectedCustomer.analytics.customerSince)}</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Revenue Analytics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Revenue:</span>
                      <span className="font-medium">{formatAmount(selectedCustomer.analytics.totalRevenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Paid:</span>
                      <span className="font-medium text-green-600">{formatAmount(selectedCustomer.analytics.totalPaid)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Pending:</span>
                      <span className="font-medium text-orange-600">{formatAmount(selectedCustomer.analytics.totalPending)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg. Event Value:</span>
                      <span className="font-medium">{formatAmount(selectedCustomer.analytics.averageEventValue)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Event Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Event Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{selectedCustomer.analytics.eventCount}</div>
                      <div className="text-sm text-gray-500">Total Events</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{selectedCustomer.analytics.confirmedBookings}</div>
                      <div className="text-sm text-gray-500">Confirmed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{selectedCustomer.analytics.pendingBookings}</div>
                      <div className="text-sm text-gray-500">Pending</div>
                    </div>
                    <div className="text-center">
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
    </div>
  );
}