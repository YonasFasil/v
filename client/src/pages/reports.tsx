import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, TrendingUp, DollarSign, Calendar, Users, MapPin,
  Download, Filter, Sparkles, RefreshCw, Eye, AlertTriangle,
  Target, Zap, Clock, Award, ChevronUp, ChevronDown
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { format } from "date-fns";

interface ReportMetrics {
  totalBookings: number;
  revenue: number;
  activeLeads: number;
  utilization: number;
  revenueGrowth: number;
  bookingGrowth: number;
  averageBookingValue: number;
  conversionRate: number;
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
}

interface AIInsight {
  id: string;
  type: 'opportunity' | 'warning' | 'trend' | 'recommendation';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  actionable: boolean;
  category: string;
}

export default function Reports() {
  const [dateRange, setDateRange] = useState("3months");
  const [reportType, setReportType] = useState("overview");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch comprehensive analytics data
  const { data: analyticsData, isLoading: analyticsLoading, refetch: refetchAnalytics } = useQuery<ReportMetrics>({
    queryKey: ["/api/reports/analytics", dateRange],
    refetchInterval: autoRefresh ? 30000 : false, // Refresh every 30 seconds if auto-refresh is on
  });

  // Fetch AI-powered insights
  const { data: aiInsights, isLoading: insightsLoading } = useQuery<AIInsight[]>({
    queryKey: ["/api/ai/insights/reports", dateRange],
    refetchInterval: autoRefresh ? 60000 : false, // Refresh every minute
  });

  // Generate AI report mutation
  const generateAIReport = useMutation({
    mutationFn: async (params: { dateRange: string; focus: string }) => {
      const response = await apiRequest("POST", "/api/ai/generate-report", params);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "AI Report Generated",
        description: "Your comprehensive AI-powered report is ready!"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ai/insights/reports"] });
    }
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

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <Target className="w-4 h-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'trend': return <TrendingUp className="w-4 h-4 text-blue-600" />;
      case 'recommendation': return <Sparkles className="w-4 h-4 text-purple-600" />;
      default: return <Eye className="w-4 h-4 text-gray-600" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (analyticsLoading) {
    return (
      <AppLayout>
        <div className="p-6 space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Real-time insights and AI-powered analytics for your venue</p>
        </div>
        
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
          
          <Button
            onClick={() => generateAIReport.mutate({ dateRange, focus: reportType })}
            disabled={generateAIReport.isPending}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {generateAIReport.isPending ? 'Generating...' : 'AI Report'}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => exportReport.mutate('pdf')}
            disabled={exportReport.isPending}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
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
                ${Math.round(analyticsData?.revenue || 0).toLocaleString()} Revenue
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={reportType} onValueChange={setReportType} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="venues">Venues</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
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
                      ${Math.round(analyticsData?.revenue || 0).toLocaleString()}
                    </p>
                    <div className="flex items-center mt-1">
                      {(analyticsData?.revenueGrowth || 0) >= 0 ? (
                        <ChevronUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-red-600" />
                      )}
                      <span className={`text-sm font-medium ${
                        (analyticsData?.revenueGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {Math.abs(analyticsData?.revenueGrowth || 0)}%
                      </span>
                    </div>
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
                    <div className="flex items-center mt-1">
                      {(analyticsData?.bookingGrowth || 0) >= 0 ? (
                        <ChevronUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-red-600" />
                      )}
                      <span className={`text-sm font-medium ${
                        (analyticsData?.bookingGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {Math.abs(analyticsData?.bookingGrowth || 0)}%
                      </span>
                    </div>
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
                    <Users className="w-6 h-6 text-orange-600" />
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
                    <Tooltip />
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
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="ai-insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">AI-Powered Insights</h3>
                <div className="flex items-center gap-2">
                  <Badge className="bg-purple-100 text-purple-800">
                    {aiInsights?.length || 0} Active Insights
                  </Badge>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-300">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    AI Generated
                  </Badge>
                </div>
              </div>
              
              {/* Global AI Disclaimer */}
              <div className="bg-amber-50 border border-amber-200 rounded p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-amber-800 font-medium">
                      Important: AI-Generated Content Disclaimer
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      These insights are generated by artificial intelligence and should be treated as suggestions only. 
                      AI can make mistakes or provide recommendations that may not suit your specific business context. 
                      Please review all suggestions carefully and consult with your team before implementing any changes.
                    </p>
                  </div>
                </div>
              </div>
              
              {insightsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-24 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {aiInsights?.map((insight) => (
                    <Card key={insight.id} className="p-4 border-l-4 border-l-blue-500">
                      <div className="flex items-start gap-3">
                        {getInsightIcon(insight.type)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">{insight.title}</h4>
                            <div className="flex items-center gap-2">
                              <Badge className={getImpactColor(insight.impact)}>
                                {insight.impact} impact
                              </Badge>
                              <Badge variant="outline">
                                {insight.confidence}% confident
                              </Badge>
                            </div>
                          </div>
                          <p className="text-gray-600 text-sm mb-3">{insight.description}</p>
                          
                          {/* AI Disclaimer */}
                          <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-3">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-yellow-600" />
                              <p className="text-xs text-yellow-800">
                                <strong>AI Suggestion:</strong> This insight is AI-generated and may contain errors. 
                                Please verify with your business data before implementing.
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {insight.category}
                              </Badge>
                              {insight.actionable && (
                                <Badge className="bg-green-100 text-green-800 text-xs">
                                  Actionable
                                </Badge>
                              )}
                            </div>
                            
                            {insight.actionable && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  try {
                                    // Determine action based on insight category
                                    let action = 'general';
                                    let data = {};
                                    
                                    if (insight.category === 'Revenue') {
                                      action = 'create_package';
                                      data = {
                                        name: "Revenue Optimization Package",
                                        description: `AI-generated package based on insight: ${insight.title}`,
                                        basePrice: "2500",
                                        capacity: 100,
                                        duration: "4 hours"
                                      };
                                    } else if (insight.category === 'Operations') {
                                      action = 'create_service';
                                      data = {
                                        name: "Operational Enhancement Service",
                                        description: `AI-recommended service: ${insight.title}`,
                                        price: "500"
                                      };
                                    }
                                    
                                    const response = await apiRequest("POST", "/api/ai/apply-suggestion", {
                                      insightId: insight.id,
                                      action,
                                      data
                                    });
                                    
                                    const result = await response.json();
                                    
                                    if (result.success) {
                                      toast({
                                        title: "AI Suggestion Applied Successfully",
                                        description: result.message,
                                      });
                                      
                                      // Refresh relevant data
                                      queryClient.invalidateQueries({ queryKey: ["/api/packages"] });
                                      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
                                      queryClient.invalidateQueries({ queryKey: ["/api/ai/insights/reports"] });
                                    } else {
                                      throw new Error(result.message);
                                    }
                                  } catch (error) {
                                    toast({
                                      title: "Error Applying Suggestion",
                                      description: "Failed to implement AI suggestion. Please try again or implement manually.",
                                      variant: "destructive"
                                    });
                                  }
                                }}
                                className="text-xs"
                              >
                                <Sparkles className="w-3 h-3 mr-1" />
                                Apply Suggestion
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  )) || (
                    <Card className="p-8 text-center">
                      <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">
                        No AI insights yet
                      </h3>
                      <p className="text-gray-500 mb-2">
                        Generate your first AI report to get intelligent insights about your venue performance
                      </p>
                      
                      {/* AI Disclaimer */}
                      <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4 text-left">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5" />
                          <div>
                            <p className="text-xs text-blue-800 font-medium mb-1">
                              About AI Insights
                            </p>
                            <p className="text-xs text-blue-700">
                              AI-generated insights are suggestions based on data patterns and may not be 100% accurate. 
                              Always verify recommendations with your business knowledge and current market conditions before implementing changes.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => generateAIReport.mutate({ dateRange, focus: 'insights' })}
                        disabled={generateAIReport.isPending}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        {generateAIReport.isPending ? 'Generating...' : 'Generate AI Insights'}
                      </Button>
                    </Card>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => generateAIReport.mutate({ dateRange, focus: 'revenue' })}
                    disabled={generateAIReport.isPending}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Revenue Optimization
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => generateAIReport.mutate({ dateRange, focus: 'utilization' })}
                    disabled={generateAIReport.isPending}
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Utilization Analysis
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => generateAIReport.mutate({ dateRange, focus: 'customer' })}
                    disabled={generateAIReport.isPending}
                  >
                    <Award className="w-4 h-4 mr-2" />
                    Customer Insights
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600 mb-2">
                      {Math.round(((analyticsData?.utilization || 0) + (analyticsData?.conversionRate || 0) * 100) / 2)}
                    </div>
                    <p className="text-gray-600">Overall Performance</p>
                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Revenue Growth</span>
                        <span className="font-medium">{analyticsData?.revenueGrowth || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Booking Growth</span>
                        <span className="font-medium">{analyticsData?.bookingGrowth || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Utilization</span>
                        <span className="font-medium">{analyticsData?.utilization || 0}%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Additional tabs can be implemented similarly */}
        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Detailed revenue analytics coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="venues">
          <Card>
            <CardHeader>
              <CardTitle>Venue Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Venue-specific analytics coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <CardTitle>Customer Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Customer segmentation and behavior analysis coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </AppLayout>
  );
}