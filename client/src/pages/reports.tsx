import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { 
  BarChart3, TrendingUp, DollarSign, Calendar, Users, MapPin,
  Download, Filter, Sparkles, RefreshCw, Eye, AlertTriangle,
  Target, Zap, Clock, Award, ChevronUp, ChevronDown, PieChart,
  Building, CreditCard, UserPlus, FileText, Activity, Star
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useFormattedCurrency } from "@/lib/currency";
import { apiRequest } from "@/lib/queryClient";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart as RechartsPieChart, Pie, Cell, LineChart, Line
} from "recharts";
import { format } from "date-fns";

interface AnalyticsData {
  totalBookings: number;
  revenue: number;
  activeLeads: number;
  utilization: number;
  revenueGrowth: number;
  bookingGrowth: number;
  averageBookingValue: number;
  conversionRate: number;
  proposalConversionRate: number;
  monthlyTrends: Array<{
    month: string;
    bookings: number;
    revenue: number;
    utilization: number;
  }>;
  venuePerformance: Array<{
    name: string;
    bookings: number;
    revenue: number;
    utilization: number;
  }>;
  revenueByEventType: Array<{
    type: string;
    revenue: number;
    count: number;
  }>;
  completedEvents: number;
  cancelledEvents: number;
  cancellationRate: number;
  averageLeadValue: number;
  totalDepositsCollected: number;
  outstandingRevenue: number;
  sentProposals: number;
  acceptedProposals: number;
  totalPayments: number;
  leadSources: Record<string, number>;
  customerTypes: Record<string, number>;
}

interface RevenueAnalytics {
  revenueByStatus: {
    collected: number;
    pending: number;
    outstanding: number;
  };
  paymentBreakdown: {
    deposits: number;
    finalPayments: number;
    refunds: number;
  };
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    transactions: number;
  }>;
  revenueByCustomerType: Record<string, {
    total: number;
    count: number;
    average: number;
  }>;
  totalRevenue: number;
  projectedRevenue: number;
}

interface CustomerAnalytics {
  totalCustomers: number;
  totalLeads: number;
  acquisitionTrends: Array<{
    month: string;
    customers: number;
    leads: number;
    conversion: number;
  }>;
  customerLTV: Array<{
    id: string;
    name: string;
    type: string;
    totalValue: number;
    bookingCount: number;
    averageBookingValue: number;
  }>;
  leadSources: Record<string, {
    leads: number;
    converted: number;
    revenue: number;
    conversionRate: number;
    averageRevenue: number;
  }>;
}

interface VenueAnalytics {
  venueMetrics: Array<{
    id: string;
    name: string;
    capacity: number;
    totalBookings: number;
    confirmedBookings: number;
    totalRevenue: number;
    averageRevenue: number;
    utilization: number;
    averageGuestCount: number;
  }>;
  eventTypesByVenue: Record<string, Record<string, number>>;
  spaceMetrics: Array<{
    id: string;
    name: string;
    venueName: string;
    capacity: number;
    bookings: number;
    revenue: number;
  }>;
  totalVenues: number;
  totalSpaces: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function Reports() {
  const [dateRange, setDateRange] = useState("3months");
  const [reportType, setReportType] = useState("overview");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { toast } = useToast();
  const { formatAmount } = useFormattedCurrency();
  const queryClient = useQueryClient();

  // Fetch comprehensive analytics data
  const { data: analyticsData, isLoading: analyticsLoading, refetch: refetchAnalytics } = useQuery<AnalyticsData>({
    queryKey: ["/api/reports/analytics", { dateRange }],
    queryFn: async () => {
      const response = await fetch(`/api/reports/analytics?dateRange=${dateRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('super_admin_token') || localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
    refetchInterval: autoRefresh ? 30000 : false,
  });

  // Fetch revenue analytics
  const { data: revenueData, isLoading: revenueLoading } = useQuery<RevenueAnalytics>({
    queryKey: ["/api/reports/revenue", { dateRange }],
    queryFn: async () => {
      const response = await fetch(`/api/reports/revenue?dateRange=${dateRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('super_admin_token') || localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch revenue data');
      return response.json();
    },
    enabled: reportType === "revenue",
  });

  // Fetch customer analytics
  const { data: customerData, isLoading: customerLoading } = useQuery<CustomerAnalytics>({
    queryKey: ["/api/reports/customers", { dateRange }],
    queryFn: async () => {
      const response = await fetch(`/api/reports/customers?dateRange=${dateRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('super_admin_token') || localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch customer data');
      return response.json();
    },
    enabled: reportType === "customers",
  });

  // Fetch venue analytics
  const { data: venueData, isLoading: venueLoading } = useQuery<VenueAnalytics>({
    queryKey: ["/api/reports/venues", { dateRange }],
    queryFn: async () => {
      const response = await fetch(`/api/reports/venues?dateRange=${dateRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('super_admin_token') || localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch venue data');
      return response.json();
    },
    enabled: reportType === "venues",
  });

  // Export report mutation  
  const exportReport = useMutation({
    mutationFn: async (format: string) => {
      const response = await apiRequest("POST", "/api/reports/export", { 
        format, 
        dateRange, 
        reportType 
      });
      return response.json();
    },
    onSuccess: (data, format) => {
      toast({
        title: "Report Exported",
        description: `Report downloaded as ${format.toUpperCase()} file`
      });
    }
  });

  // Auto-refresh every 30 seconds
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        refetchAnalytics();
      }, 30000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh, refetchAnalytics]);

  const formatGrowth = (value: number) => {
    const isPositive = value >= 0;
    return (
      <div className="flex items-center">
        {isPositive ? (
          <ChevronUp className="w-4 h-4 text-green-600" />
        ) : (
          <ChevronDown className="w-4 h-4 text-red-600" />
        )}
        <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {Math.abs(value)}%
        </span>
      </div>
    );
  };

  if (analyticsLoading) {
    return (
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <div className="hidden lg:block">
          <Sidebar collapsed={sidebarCollapsed} />
        </div>
        
        <MobileNav 
          isOpen={mobileNavOpen} 
          onClose={() => setMobileNavOpen(false)} 
        />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header 
            title="Reports & Analytics" 
            subtitle="Comprehensive insights and real-time analytics"
            onMobileMenuToggle={() => setMobileNavOpen(true)}
            onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            sidebarCollapsed={sidebarCollapsed}
          />
          
          <main className="flex-1 overflow-y-auto p-6">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded"></div>
                ))}
              </div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <div className="hidden lg:block">
        <Sidebar collapsed={sidebarCollapsed} />
      </div>
      
      <MobileNav 
        isOpen={mobileNavOpen} 
        onClose={() => setMobileNavOpen(false)} 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Reports & Analytics" 
          subtitle="Comprehensive insights and real-time analytics powered by your venue data"
          onMobileMenuToggle={() => setMobileNavOpen(true)}
          onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          sidebarCollapsed={sidebarCollapsed}
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Header Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={autoRefresh ? "bg-green-50 border-green-200" : ""}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin text-green-600' : ''}`} />
                  {autoRefresh ? 'Live' : 'Manual'}
                </Button>
                
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7days">Last 7 Days</SelectItem>
                    <SelectItem value="30days">Last 30 Days</SelectItem>
                    <SelectItem value="3months">Last 3 Months</SelectItem>
                    <SelectItem value="6months">Last 6 Months</SelectItem>
                    <SelectItem value="1year">Last Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => exportReport.mutate('pdf')}
                  disabled={exportReport.isPending}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() => exportReport.mutate('excel')}
                  disabled={exportReport.isPending}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Excel
                </Button>
              </div>
            </div>

            {/* Real-time Status Bar */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">Live Data</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Last updated: {format(new Date(), 'HH:mm:ss')}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-green-600 font-medium">
                      {analyticsData?.totalBookings || 0} Total Bookings
                    </span>
                    <span className="text-blue-600 font-medium">
                      {formatAmount(analyticsData?.revenue || 0)} Revenue
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs value={reportType} onValueChange={setReportType} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="revenue">Revenue</TabsTrigger>
                <TabsTrigger value="customers">Customers</TabsTrigger>
                <TabsTrigger value="venues">Venues</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                          <p className="text-3xl font-bold text-gray-900">
                            {formatAmount(analyticsData?.revenue || 0)}
                          </p>
                          {formatGrowth(analyticsData?.revenueGrowth || 0)}
                        </div>
                        <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                          <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                          <p className="text-3xl font-bold text-gray-900">{analyticsData?.totalBookings || 0}</p>
                          {formatGrowth(analyticsData?.bookingGrowth || 0)}
                        </div>
                        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                          <Calendar className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Active Leads</p>
                          <p className="text-3xl font-bold text-gray-900">{analyticsData?.activeLeads || 0}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            {Math.round((analyticsData?.conversionRate || 0) * 100)}% conversion rate
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                          <UserPlus className="w-6 h-6 text-orange-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Venue Utilization</p>
                          <p className="text-3xl font-bold text-gray-900">{analyticsData?.utilization || 0}%</p>
                          <p className="text-sm text-gray-600 mt-1">Average across all venues</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                          <BarChart3 className="w-6 h-6 text-purple-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Additional Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Avg Booking Value</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {formatAmount(analyticsData?.averageBookingValue || 0)}
                          </p>
                        </div>
                        <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                          <TrendingUp className="w-5 h-5 text-indigo-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Proposal Success</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {Math.round((analyticsData?.proposalConversionRate || 0) * 100)}%
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {analyticsData?.acceptedProposals || 0}/{analyticsData?.sentProposals || 0} accepted
                          </p>
                        </div>
                        <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-emerald-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Outstanding Revenue</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {formatAmount(analyticsData?.outstandingRevenue || 0)}
                          </p>
                        </div>
                        <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                          <Clock className="w-5 h-5 text-yellow-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Cancellation Rate</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {analyticsData?.cancellationRate || 0}%
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {analyticsData?.cancelledEvents || 0} cancelled
                          </p>
                        </div>
                        <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        Revenue Trend
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={analyticsData?.monthlyTrends || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip formatter={(value) => [formatAmount(value as number), 'Revenue']} />
                          <Area 
                            type="monotone" 
                            dataKey="revenue" 
                            stroke="#3B82F6" 
                            fill="#3B82F6"
                            fillOpacity={0.1}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-green-600" />
                        Booking Volume
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analyticsData?.monthlyTrends || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="bookings" fill="#10B981" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Event Types and Lead Sources */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PieChart className="w-5 h-5 text-purple-600" />
                        Revenue by Event Type
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <RechartsPieChart>
                          <Pie
                            data={analyticsData?.revenueByEventType || []}
                            dataKey="revenue"
                            nameKey="type"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label
                          >
                            {(analyticsData?.revenueByEventType || []).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [formatAmount(value as number), 'Revenue']} />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-orange-600" />
                        Lead Sources
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {Object.entries(analyticsData?.leadSources || {}).map(([source, count]) => (
                          <div key={source} className="flex items-center justify-between">
                            <span className="text-sm font-medium">{source}</span>
                            <Badge variant="secondary">{count} leads</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Revenue Tab */}
              <TabsContent value="revenue" className="space-y-6">
                {revenueLoading ? (
                  <div className="animate-pulse space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-32 bg-gray-200 rounded"></div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Revenue Status Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Collected Revenue</p>
                              <p className="text-3xl font-bold text-green-600">
                                {formatAmount(revenueData?.revenueByStatus.collected || 0)}
                              </p>
                            </div>
                            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                              <DollarSign className="w-6 h-6 text-green-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Outstanding Revenue</p>
                              <p className="text-3xl font-bold text-yellow-600">
                                {formatAmount(revenueData?.revenueByStatus.outstanding || 0)}
                              </p>
                            </div>
                            <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                              <Clock className="w-6 h-6 text-yellow-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Projected Total</p>
                              <p className="text-3xl font-bold text-blue-600">
                                {formatAmount(revenueData?.projectedRevenue || 0)}
                              </p>
                            </div>
                            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                              <TrendingUp className="w-6 h-6 text-blue-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Revenue Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Monthly Revenue Trend</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={revenueData?.monthlyRevenue || []}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="month" />
                              <YAxis />
                              <Tooltip formatter={(value) => [formatAmount(value as number), 'Revenue']} />
                              <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} />
                            </LineChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Payment Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Deposits Collected</span>
                              <span className="text-lg font-bold text-green-600">
                                {formatAmount(revenueData?.paymentBreakdown.deposits || 0)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Final Payments</span>
                              <span className="text-lg font-bold text-blue-600">
                                {formatAmount(revenueData?.paymentBreakdown.finalPayments || 0)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Refunds</span>
                              <span className="text-lg font-bold text-red-600">
                                {formatAmount(revenueData?.paymentBreakdown.refunds || 0)}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </>
                )}
              </TabsContent>

              {/* Customer Tab */}
              <TabsContent value="customers" className="space-y-6">
                {customerLoading ? (
                  <div className="animate-pulse space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[...Array(2)].map((_, i) => (
                        <div key={i} className="h-64 bg-gray-200 rounded"></div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Customer Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Total Customers</p>
                              <p className="text-3xl font-bold text-gray-900">{customerData?.totalCustomers || 0}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                              <Users className="w-6 h-6 text-blue-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Active Leads</p>
                              <p className="text-3xl font-bold text-gray-900">{customerData?.totalLeads || 0}</p>
                            </div>
                            <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                              <UserPlus className="w-6 h-6 text-orange-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Customer Acquisition */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Customer Acquisition Trends</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={customerData?.acquisitionTrends || []}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="customers" fill="#3B82F6" name="New Customers" />
                            <Bar dataKey="leads" fill="#F59E0B" name="New Leads" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Top Customers */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Top Customers by Lifetime Value</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {customerData?.customerLTV.slice(0, 10).map((customer, index) => (
                            <div key={customer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                                </div>
                                <div>
                                  <p className="font-medium">{customer.name}</p>
                                  <p className="text-sm text-gray-600">{customer.bookingCount} bookings</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-green-600">{formatAmount(customer.totalValue)}</p>
                                <p className="text-sm text-gray-600">Avg: {formatAmount(customer.averageBookingValue)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>

              {/* Venues Tab */}
              <TabsContent value="venues" className="space-y-6">
                {venueLoading ? (
                  <div className="animate-pulse space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[...Array(2)].map((_, i) => (
                        <div key={i} className="h-64 bg-gray-200 rounded"></div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Venue Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Total Venues</p>
                              <p className="text-3xl font-bold text-gray-900">{venueData?.totalVenues || 0}</p>
                            </div>
                            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                              <Building className="w-6 h-6 text-purple-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Total Spaces</p>
                              <p className="text-3xl font-bold text-gray-900">{venueData?.totalSpaces || 0}</p>
                            </div>
                            <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center">
                              <MapPin className="w-6 h-6 text-indigo-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Venue Performance */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Venue Performance</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {venueData?.venueMetrics.map((venue) => (
                            <div key={venue.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                              <div>
                                <p className="font-medium">{venue.name}</p>
                                <p className="text-sm text-gray-600">
                                  Capacity: {venue.capacity} | {venue.totalBookings} bookings
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-green-600">{formatAmount(venue.totalRevenue)}</p>
                                <p className="text-sm text-gray-600">{venue.utilization}% utilization</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}