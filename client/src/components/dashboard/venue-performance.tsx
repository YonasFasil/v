import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Calendar, Users, Star, Target, Percent } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface PerformanceMetric {
  label: string;
  value: string;
  change: number;
  icon: any;
  color: string;
}

export function VenuePerformance() {
  // Mock data - in real app this would come from API
  const { data: performanceData } = useQuery({
    queryKey: ['venue-performance'],
    queryFn: async () => ({
      monthlyRevenue: 85600,
      bookingRate: 78,
      avgGuestCount: 142,
      customerSatisfaction: 4.8,
      changes: {
        revenue: 12.5,
        bookingRate: -3.2,
        guestCount: 8.7,
        satisfaction: 2.1
      }
    })
  });

  if (!performanceData) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const metrics: PerformanceMetric[] = [
    {
      label: "Monthly Revenue",
      value: `$${performanceData.monthlyRevenue.toLocaleString()}`,
      change: performanceData.changes.revenue,
      icon: DollarSign,
      color: "emerald"
    },
    {
      label: "Booking Rate",
      value: `${performanceData.bookingRate}%`,
      change: performanceData.changes.bookingRate,
      icon: Target,
      color: "blue"
    },
    {
      label: "Avg Guests",
      value: performanceData.avgGuestCount.toString(),
      change: performanceData.changes.guestCount,
      icon: Users,
      color: "purple"
    },
    {
      label: "Satisfaction",
      value: `${performanceData.customerSatisfaction}/5`,
      change: performanceData.changes.satisfaction,
      icon: Star,
      color: "orange"
    }
  ];

  return (
    <Card className="border border-slate-200 bg-white">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-slate-700" />
          Venue Performance
        </CardTitle>
        <p className="text-sm text-slate-600">Key metrics this month</p>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {metrics.map((metric, index) => {
          const IconComponent = metric.icon;
          const isPositive = metric.change > 0;
          const ChangeIcon = isPositive ? TrendingUp : TrendingDown;
          
          return (
            <div 
              key={index}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:bg-slate-100 transition-colors duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center">
                  <IconComponent className="w-4 h-4 text-slate-700" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{metric.value}</p>
                  <p className="text-sm text-slate-600">{metric.label}</p>
                </div>
              </div>
              
              <div className={`flex items-center gap-1 text-sm font-medium ${
                isPositive ? 'text-green-700' : 'text-red-600'
              }`}>
                <ChangeIcon className="w-4 h-4" />
                <span>{Math.abs(metric.change)}%</span>
              </div>
            </div>
          );
        })}
        
        {/* Quick insight */}
        <div className="mt-4 p-3 bg-slate-100 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-slate-700" />
            <span className="text-sm font-medium text-slate-900">Performance Insight</span>
          </div>
          <p className="text-xs text-slate-700">
            Revenue is up 12.5% this month. Focus on optimizing booking rate to maximize growth potential.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}