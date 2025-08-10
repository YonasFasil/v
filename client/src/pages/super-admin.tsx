import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Crown,
  Building2,
  Package,
  Users,
  Activity,
  Settings,
  Plus,
  Edit,
  Trash2,
  Eye,
  BarChart3,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react";

export default function SuperAdmin() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("overview");

  // Check if user is super admin
  const userRole = localStorage.getItem("userRole");
  if (userRole !== "super_admin") {
    navigate("/");
    return null;
  }

  // Queries
  const { data: stats } = useQuery({
    queryKey: ["/api/super-admin/stats"],
    staleTime: 60000,
  });

  const { data: tenants } = useQuery({
    queryKey: ["/api/super-admin/tenants"],
    staleTime: 30000,
  });

  const { data: packages } = useQuery({
    queryKey: ["/api/super-admin/packages"],
    staleTime: 60000,
  });

  const { data: activities } = useQuery({
    queryKey: ["/api/super-admin/activities"],
    staleTime: 30000,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8 text-purple-600" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Super Admin</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">Platform Management Dashboard</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="default" className="bg-purple-600">
              <Crown className="w-3 h-3 mr-1" />
              Super Admin
            </Badge>
            <Button
              onClick={() => {
                localStorage.removeItem("userRole");
                localStorage.removeItem("userRoleData");
                navigate("/login");
              }}
              variant="outline"
              size="sm"
            >
              Switch User
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tenants">Tenants</TabsTrigger>
            <TabsTrigger value="packages">Packages</TabsTrigger>
            <TabsTrigger value="activities">Activity</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalTenants || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    +{stats?.newTenantsThisMonth || 0} this month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.activeUsers || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Across all tenants
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${stats?.monthlyRevenue || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Subscription revenue
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Platform Health</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">99.9%</div>
                  <p className="text-xs text-muted-foreground">
                    Uptime this month
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Platform Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activities?.slice(0, 5).map((activity: any) => (
                    <div key={activity.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {activity.tenantName} • {new Date(activity.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )) || (
                    <p className="text-sm text-slate-600 dark:text-slate-400 text-center py-4">
                      No recent activity
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tenants Tab */}
          <TabsContent value="tenants" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Tenant Management</h2>
              <CreateTenantDialog />
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Package</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Users</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tenants?.map((tenant: any) => (
                      <TableRow key={tenant.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{tenant.name}</p>
                            <p className="text-sm text-slate-600">{tenant.contactEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{tenant.packageName}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={tenant.status === 'active' ? 'default' : 'secondary'}
                            className={tenant.status === 'active' ? 'bg-green-600' : ''}
                          >
                            {tenant.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{tenant.userCount}</TableCell>
                        <TableCell>{new Date(tenant.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )) || (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-slate-600">
                          No tenants found. Create the first tenant to get started.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Packages Tab */}
          <TabsContent value="packages" className="space-y-6">
            <PackageManagement packages={packages} />
          </TabsContent>

          {/* Activities Tab */}
          <TabsContent value="activities" className="space-y-6">
            <ActivityLog activities={activities} />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <SystemSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Create Tenant Dialog Component
function CreateTenantDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const createTenantMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/super-admin/tenants", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Tenant created successfully",
      });
      setOpen(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Tenant
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Tenant</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Organization Name</Label>
            <Input id="name" placeholder="Acme Events Inc." />
          </div>
          <div>
            <Label htmlFor="contactEmail">Contact Email</Label>
            <Input id="contactEmail" type="email" placeholder="admin@acme.com" />
          </div>
          <div>
            <Label htmlFor="contactName">Contact Name</Label>
            <Input id="contactName" placeholder="John Doe" />
          </div>
          <div>
            <Label htmlFor="package">Package</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select package" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full" disabled={createTenantMutation.isPending}>
            {createTenantMutation.isPending ? "Creating..." : "Create Tenant"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Package Management Component
function PackageManagement({ packages }: { packages: any[] }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Feature Packages</h2>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Package
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages?.map((pkg: any) => (
          <Card key={pkg.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{pkg.displayName}</CardTitle>
                <Badge variant={pkg.isActive ? "default" : "secondary"}>
                  {pkg.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="text-sm text-slate-600">{pkg.description}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-2xl font-bold">
                  ${pkg.price}/{pkg.billingInterval}
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Max Users:</span>
                    <span>{pkg.maxUsers || "Unlimited"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Max Venues:</span>
                    <span>{pkg.maxVenues || "Unlimited"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Storage:</span>
                    <span>{pkg.storageLimit}GB</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )) || (
          <Card className="col-span-full">
            <CardContent className="text-center py-8 text-slate-600">
              No packages found. Create the first package to get started.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Activity Log Component
function ActivityLog({ activities }: { activities: any[] }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Platform Activity Log</h2>
      
      <Card>
        <CardContent className="p-0">
          <div className="space-y-4 p-6">
            {activities?.map((activity: any) => (
              <div key={activity.id} className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{activity.action}</p>
                    <span className="text-xs text-slate-500">
                      {new Date(activity.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Tenant: {activity.tenantName}
                  </p>
                  {activity.details && (
                    <p className="text-xs text-slate-500 mt-1">
                      {activity.details}
                    </p>
                  )}
                </div>
              </div>
            )) || (
              <p className="text-center py-8 text-slate-600">
                No activity logs found.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// System Settings Component
function SystemSettings() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">System Settings</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Platform Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="platformName">Platform Name</Label>
              <Input id="platformName" defaultValue="Venuine" />
            </div>
            <div>
              <Label htmlFor="supportEmail">Support Email</Label>
              <Input id="supportEmail" defaultValue="support@venuine.com" />
            </div>
            <Button>Save Settings</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Default Limits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="trialDays">Trial Period (days)</Label>
              <Input id="trialDays" type="number" defaultValue="14" />
            </div>
            <div>
              <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
              <Input id="maxFileSize" type="number" defaultValue="50" />
            </div>
            <Button>Save Limits</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}