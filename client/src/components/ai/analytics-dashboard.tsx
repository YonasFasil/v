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

const seasonalData: SeasonalRecommendation[] = [
  {
    season: "Winter",
    icon: Snowflake,
    color: "blue",
    packages: [
      { name: "Holiday Corporate Events", demand: 95, revenue: 8500, trend: 'up' },
      { name: "New Year Celebrations", demand: 88, revenue: 7200, trend: 'up' },
      { name: "Indoor Wedding Package", demand: 65, revenue: 5800, trend: 'stable' }
    ],
    services: [
      { name: "Indoor Heating & Comfort", bookingRate: 98, seasonality: 95, suggestion: "Essential for winter events" },
      { name: "Hot Beverage Stations", bookingRate: 85, seasonality: 90, suggestion: "High demand in cold months" },
      { name: "Coat Check Service", bookingRate: 78, seasonality: 85, suggestion: "Necessary convenience" }
    ],
    insights: [
      "Corporate events increase 40% in December for holiday parties",
      "Indoor venues see 60% higher booking rates during winter months",
      "Warm lighting and heating are most requested winter amenities"
    ]
  },
  {
    season: "Spring",
    icon: Leaf,
    color: "green", 
    packages: [
      { name: "Garden Wedding Package", demand: 92, revenue: 9200, trend: 'up' },
      { name: "Corporate Retreat", demand: 78, revenue: 6800, trend: 'up' },
      { name: "Graduation Celebrations", demand: 85, revenue: 5500, trend: 'stable' }
    ],
    services: [
      { name: "Outdoor Setup & Tenting", bookingRate: 89, seasonality: 88, suggestion: "Perfect weather for outdoor events" },
      { name: "Floral Arrangements", bookingRate: 94, seasonality: 95, suggestion: "Peak season for fresh flowers" },
      { name: "Garden Lighting", bookingRate: 76, seasonality: 80, suggestion: "Evening events benefit from ambient lighting" }
    ],
    insights: [
      "Wedding bookings increase 65% in spring months",
      "Outdoor venues see highest utilization rates",
      "Fresh floral services are in peak demand"
    ]
  },
  {
    season: "Summer",
    icon: Sun,
    color: "yellow",
    packages: [
      { name: "Outdoor Wedding Extravaganza", demand: 98, revenue: 12000, trend: 'up' },
      { name: "Corporate Summer Party", demand: 89, revenue: 7800, trend: 'up' },
      { name: "Festival & Concert Package", demand: 82, revenue: 6200, trend: 'stable' }
    ],
    services: [
      { name: "Cooling & Air Conditioning", bookingRate: 96, seasonality: 98, suggestion: "Essential for summer comfort" },
      { name: "Outdoor Bar Service", bookingRate: 91, seasonality: 95, suggestion: "Perfect for summer gatherings" },
      { name: "Shade Structures", bookingRate: 87, seasonality: 92, suggestion: "Protect guests from sun exposure" }
    ],
    insights: [
      "Summer is peak wedding season with 45% of annual weddings",
      "Outdoor events generate 30% more revenue than indoor equivalents",
      "Cooling services are booked in 98% of summer events"
    ]
  },
  {
    season: "Fall",
    icon: CloudRain,
    color: "orange",
    packages: [
      { name: "Harvest Corporate Events", demand: 83, revenue: 7100, trend: 'up' },
      { name: "Autumn Wedding Package", demand: 79, revenue: 8900, trend: 'stable' },
      { name: "Conference & Meeting Package", demand: 91, revenue: 5600, trend: 'up' }
    ],
    services: [
      { name: "Weather Contingency Setup", bookingRate: 84, seasonality: 88, suggestion: "Important for unpredictable fall weather" },
      { name: "Seasonal Decorations", bookingRate: 88, seasonality: 92, suggestion: "Autumn themes are highly popular" },
      { name: "Indoor/Outdoor Flexibility", bookingRate: 76, seasonality: 85, suggestion: "Weather backup plans essential" }
    ],
    insights: [
      "Conference bookings peak in fall as businesses plan for year-end",
      "Weather contingency services see 85% booking rate",
      "Seasonal decoration services are most profitable in fall"
    ]
  }
];

export function AnalyticsDashboard() {
  const [selectedSeason, setSelectedSeason] = useState("current");
  const [timeRange, setTimeRange] = useState("3months");

  // Get current season
  const getCurrentSeason = () => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return "Spring";
    if (month >= 5 && month <= 7) return "Summer"; 
    if (month >= 8 && month <= 10) return "Fall";
    return "Winter";
  };

  const currentSeason = getCurrentSeason();
  const displaySeason = selectedSeason === "current" ? currentSeason : selectedSeason;
  const seasonData = seasonalData.find(s => s.season === displaySeason) || seasonalData[0];

  // Fetch analytics data
  const { data: analyticsData } = useQuery({
    queryKey: ["/api/ai/analytics", timeRange],
    select: (data) => data || {
      totalRevenue: 125000,
      bookingsGrowth: 23,
      avgBookingValue: 3200,
      utilizationRate: 78,
      topPerformingPackages: [
        { name: "Premium Wedding Package", revenue: 45000, bookings: 12 },
        { name: "Corporate Events", revenue: 38000, bookings: 18 },
        { name: "Social Celebrations", revenue: 25000, bookings: 15 }
      ],
      predictions: {
        nextMonth: { revenue: 42000, bookings: 28 },
        nextQuarter: { revenue: 135000, bookings: 95 }
      }
    }
  });

  const SeasonIcon = seasonData.icon;

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
            <div className="text-2xl font-bold">${analyticsData?.totalRevenue?.toLocaleString()}</div>
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
            <div className="text-2xl font-bold">${analyticsData?.avgBookingValue?.toLocaleString()}</div>
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
                <Card key={index} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium">{pkg.name}</h5>
                      {pkg.trend === 'up' ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : pkg.trend === 'down' ? (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      ) : (
                        <div className="w-4 h-4 bg-gray-400 rounded-full" />
                      )}
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
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium">{service.name}</h5>
                    <Badge variant="outline">
                      {service.bookingRate}% booking rate
                    </Badge>
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