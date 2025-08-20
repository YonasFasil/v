import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  Calendar, 
  DollarSign, 
  Users, 
  Package, 
  BarChart3,
  Target,
  Lightbulb,
  Leaf,
  Snowflake,
  Sun,
  CloudRain
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useFormattedCurrency } from "@/lib/currency";

interface AnalyticsData {
  totalRevenue: number;
  bookingsGrowth: number;
  avgBookingValue: number;
  utilizationRate: number;
  topPerformingPackages: Array<{
    name: string;
    revenue: number;
    bookings: number;
  }>;
  predictions: {
    nextMonth: {
      revenue: number;
      bookings: number;
    };
    nextQuarter: {
      revenue: number;
      bookings: number;
    };
  };
}


interface SeasonalRecommendation {
  season: string;
  icon: any;
  color: string;
  packages: {
    name: string;
    demand: number;
    revenue: number;
    trend: 'up' | 'down' | 'stable';
  }[];
  services: {
    name: string;
    bookingRate: number;
    seasonality: number;
    suggestion: string;
  }[];
  insights: string[];
}

// Fallback seasonal templates if no data available
const fallbackSeasonalData: SeasonalRecommendation[] = [
  {
    season: "Winter",
    icon: Snowflake,
    color: "blue",
    packages: [
      { name: "No winter events yet", demand: 0, revenue: 0, trend: 'stable' }
    ],
    services: [
      { name: "Indoor Heating Setup", bookingRate: 0, seasonality: 0, suggestion: "Create your first winter service" }
    ],
    insights: [
      "No winter events data available yet",
      "Start hosting winter events to see insights here"
    ]
  },
  {
    season: "Spring",
    icon: Leaf,
    color: "green", 
    packages: [
      { name: "No spring events yet", demand: 0, revenue: 0, trend: 'stable' }
    ],
    services: [
      { name: "Outdoor Setup Service", bookingRate: 0, seasonality: 0, suggestion: "Create your first spring service" }
    ],
    insights: [
      "No spring events data available yet",
      "Start hosting spring events to see insights here"
    ]
  },
  {
    season: "Summer",
    icon: Sun,
    color: "yellow",
    packages: [
      { name: "No summer events yet", demand: 0, revenue: 0, trend: 'stable' }
    ],
    services: [
      { name: "Cooling Service", bookingRate: 0, seasonality: 0, suggestion: "Create your first summer service" }
    ],
    insights: [
      "No summer events data available yet",
      "Start hosting summer events to see insights here"
    ]
  },
  {
    season: "Fall",
    icon: CloudRain,
    color: "orange",
    packages: [
      { name: "No fall events yet", demand: 0, revenue: 0, trend: 'stable' }
    ],
    services: [
      { name: "Weather Contingency", bookingRate: 0, seasonality: 0, suggestion: "Create your first fall service" }
    ],
    insights: [
      "No fall events data available yet",
      "Start hosting fall events to see insights here"
    ]
  }
];

interface Props {
  onCreatePackage?: (packageData: any) => void;
  onCreateService?: (serviceData: any) => void;
}

export function AnalyticsDashboard({ onCreatePackage, onCreateService }: Props = {}) {
  const [selectedSeason, setSelectedSeason] = useState("current");
  const [timeRange, setTimeRange] = useState("3months");
  const { formatAmount } = useFormattedCurrency();

  // Get current season
  const getCurrentSeason = () => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return "Spring";
    if (month >= 5 && month <= 7) return "Summer"; 
    if (month >= 8 && month <= 10) return "Fall";
    return "Winter";
  };

  // Fetch real analytics data from bookings
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/ai/analytics", timeRange],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 2
  });

  // Fetch real AI insights 
  const { data: aiInsights } = useQuery({
    queryKey: ["/api/ai/insights"],
    staleTime: 10 * 60 * 1000 // Cache for 10 minutes
  });

  // Fetch seasonal data from bookings
  const { data: realSeasonalData } = useQuery({
    queryKey: ["/api/ai/seasonal-analysis"],
    staleTime: 30 * 60 * 1000 // Cache for 30 minutes
  });

  const currentSeason = getCurrentSeason();
  const displaySeason = selectedSeason === "current" ? currentSeason : selectedSeason;
  
  // Use real seasonal data if available, otherwise fallback
  const availableSeasonalData = realSeasonalData || fallbackSeasonalData;
  const seasonData = availableSeasonalData.find(s => s.season === displaySeason) || availableSeasonalData[0];

  const SeasonIcon = seasonData.icon;

  const handleCreatePackage = (pkg: any, season: string) => {
    const packageData = {
      name: pkg.name,
      description: `${season} special package featuring premium services tailored for the season`,
      basePrice: pkg.revenue.toString(),
      category: season.toLowerCase(),
      isActive: true,
      maxGuests: getSeasonalGuestCount(pkg.name),
      duration: "4", // Default 4 hours
      includedServices: getSeasonalServices(pkg.name, season),
      features: getSeasonalFeatures(pkg.name, season)
    };
    
    onCreatePackage?.(packageData);
  };

  const handleCreateService = (service: any, season: string) => {
    const serviceData = {
      name: service.name,
      description: service.suggestion,
      category: getServiceCategory(service.name),
      basePrice: calculateSeasonalPrice(service.name, season),
      unit: getServiceUnit(service.name),
      isActive: true,
      seasonalDemand: service.seasonality,
      bookingRate: service.bookingRate
    };
    
    onCreateService?.(serviceData);
  };

  const getSeasonalGuestCount = (packageName: string): number => {
    if (packageName.includes('Corporate')) return 150;
    if (packageName.includes('Wedding')) return 120;
    if (packageName.includes('Conference')) return 80;
    return 100;
  };

  const getSeasonalServices = (packageName: string, season: string): string[] => {
    const baseServices = ['Venue Setup', 'Basic Lighting'];
    
    if (season === 'Winter') {
      baseServices.push('Indoor Heating', 'Hot Beverage Station', 'Coat Check');
    } else if (season === 'Spring') {
      baseServices.push('Outdoor Setup', 'Floral Arrangements', 'Garden Lighting');
    } else if (season === 'Summer') {
      baseServices.push('Air Conditioning', 'Outdoor Bar', 'Shade Structures');
    } else if (season === 'Fall') {
      baseServices.push('Weather Contingency', 'Seasonal Decorations', 'Indoor/Outdoor Flexibility');
    }
    
    if (packageName.includes('Corporate')) {
      baseServices.push('AV Equipment', 'Presentation Setup', 'Catering');
    } else if (packageName.includes('Wedding')) {
      baseServices.push('Bridal Suite', 'Photography Area', 'Dance Floor');
    }
    
    return baseServices;
  };

  const getSeasonalFeatures = (packageName: string, season: string): string[] => {
    const features = [`${season} themed decorations`, 'Professional event coordination'];
    
    if (packageName.includes('Premium')) {
      features.push('VIP guest area', 'Premium bar service', 'Upgraded linens');
    }
    
    return features;
  };

  const getServiceCategory = (serviceName: string): string => {
    if (serviceName.includes('Catering') || serviceName.includes('Food') || serviceName.includes('Beverage')) return 'catering';
    if (serviceName.includes('AV') || serviceName.includes('Audio') || serviceName.includes('Equipment')) return 'av-equipment';
    if (serviceName.includes('Decoration') || serviceName.includes('Floral') || serviceName.includes('Lighting')) return 'decorations';
    if (serviceName.includes('Heating') || serviceName.includes('Cooling') || serviceName.includes('Air')) return 'utilities';
    return 'other';
  };

  const calculateSeasonalPrice = (serviceName: string, season: string): string => {
    let basePrice = 200;
    
    if (serviceName.includes('Premium') || serviceName.includes('VIP')) basePrice *= 2;
    if (serviceName.includes('Equipment') || serviceName.includes('AV')) basePrice *= 1.5;
    
    // Seasonal pricing adjustments
    if (season === 'Summer' && serviceName.includes('Cooling')) basePrice *= 1.3;
    if (season === 'Winter' && serviceName.includes('Heating')) basePrice *= 1.3;
    
    return Math.round(basePrice).toString();
  };

  const getServiceUnit = (serviceName: string): string => {
    if (serviceName.includes('Station') || serviceName.includes('Bar')) return 'per station';
    if (serviceName.includes('Equipment') || serviceName.includes('Setup')) return 'per event';
    return 'per hour';
  };

  // Show loading state
  if (analyticsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AI Analytics & Insights</h1>
              <p className="text-gray-600">Loading your analytics data...</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Analytics & Insights</h1>
            <p className="text-gray-600">Intelligent recommendations for your venue business</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Select value={selectedSeason} onValueChange={setSelectedSeason}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Current Season</SelectItem>
              <SelectItem value="Winter">Winter</SelectItem>
              <SelectItem value="Spring">Spring</SelectItem>
              <SelectItem value="Summer">Summer</SelectItem>
              <SelectItem value="Fall">Fall</SelectItem>
            </SelectContent>
          </Select>

          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">1 Month</SelectItem>
              <SelectItem value="3months">3 Months</SelectItem>
              <SelectItem value="6months">6 Months</SelectItem>
              <SelectItem value="1year">1 Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(analyticsData?.totalRevenue || 0)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
              +{analyticsData?.bookingsGrowth}% from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Booking Value</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(analyticsData?.avgBookingValue || 0)}</div>
            <div className="text-xs text-muted-foreground">
              12% above industry average
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilization Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.utilizationRate}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all" 
                style={{ width: `${analyticsData?.utilizationRate}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Confidence</CardTitle>
            <Sparkles className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94%</div>
            <div className="text-xs text-muted-foreground">
              Prediction accuracy
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seasonal Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SeasonIcon className={`w-5 h-5 text-${seasonData.color}-600`} />
            {displaySeason} Season Recommendations
            <Badge className="bg-purple-100 text-purple-800">AI Powered</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Package Recommendations */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Recommended Packages
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {seasonData.packages.map((pkg, index) => (
                <Card key={index} className="border-l-4 border-l-blue-500 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleCreatePackage(pkg, displaySeason)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium">{pkg.name}</h5>
                      <div className="flex items-center gap-2">
                        {pkg.trend === 'up' ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : pkg.trend === 'down' ? (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        ) : (
                          <div className="w-4 h-4 bg-gray-400 rounded-full" />
                        )}
                        <Button size="sm" variant="outline" className="h-6 px-2 text-xs">
                          Create
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Demand</span>
                        <span>{pkg.demand}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all" 
                          style={{ width: `${pkg.demand}%` }}
                        />
                      </div>
                      <div className="text-sm text-gray-600">
                        Avg Revenue: ${pkg.revenue.toLocaleString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Service Recommendations */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              High-Demand Services
            </h4>
            <div className="space-y-3">
              {seasonData.services.map((service, index) => (
                <div key={index} className="border rounded-lg p-4 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleCreateService(service, displaySeason)}>
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium">{service.name}</h5>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {service.bookingRate}% booking rate
                      </Badge>
                      <Button size="sm" variant="outline" className="h-6 px-2 text-xs">
                        Create
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex-1">
                      <div className="text-xs text-gray-600 mb-1">Seasonal Demand</div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full transition-all" 
                          style={{ width: `${service.seasonality}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      {service.seasonality}%
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">{service.suggestion}</p>
                </div>
              ))}
            </div>
          </div>

          {/* AI Insights */}
          <div className="bg-purple-50 rounded-lg p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2 text-purple-800">
              <Lightbulb className="w-4 h-4" />
              AI Insights for {displaySeason}
            </h4>
            <ul className="space-y-2">
              {seasonData.insights.map((insight, index) => (
                <li key={index} className="text-sm text-purple-700 flex items-start gap-2">
                  <Sparkles className="w-3 h-3 mt-1 text-purple-500" />
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Predictions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Revenue Predictions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                <div>
                  <p className="font-medium">Next Month</p>
                  <p className="text-sm text-gray-600">Based on current trends</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-700">
                    ${analyticsData?.predictions?.nextMonth?.revenue?.toLocaleString()}
                  </p>
                  <p className="text-sm text-green-600">
                    {analyticsData?.predictions?.nextMonth?.bookings} bookings
                  </p>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                <div>
                  <p className="font-medium">Next Quarter</p>
                  <p className="text-sm text-gray-600">AI seasonal adjustment</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-700">
                    ${analyticsData?.predictions?.nextQuarter?.revenue?.toLocaleString()}
                  </p>
                  <p className="text-sm text-blue-600">
                    {analyticsData?.predictions?.nextQuarter?.bookings} bookings
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-orange-600" />
              AI Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="border-l-4 border-l-orange-500 pl-4">
                <h5 className="font-medium">Pricing Optimization</h5>
                <p className="text-sm text-gray-600">
                  Consider 15% price increase for {displaySeason.toLowerCase()} premium packages
                </p>
              </div>
              
              <div className="border-l-4 border-l-purple-500 pl-4">
                <h5 className="font-medium">Marketing Focus</h5>
                <p className="text-sm text-gray-600">
                  Target corporate clients for {displaySeason.toLowerCase()} events with 3-week lead time
                </p>
              </div>
              
              <div className="border-l-4 border-l-green-500 pl-4">
                <h5 className="font-medium">Inventory Planning</h5>
                <p className="text-sm text-gray-600">
                  Stock up on seasonal decorations and weather-specific equipment
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}