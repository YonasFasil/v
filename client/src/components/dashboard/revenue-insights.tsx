import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, DollarSign, Calendar, Clock, Target, ArrowRight, Zap, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface RevenueInsight {
  title: string;
  amount: number;
  period: string;
  change: number;
  priority: 'high' | 'medium' | 'low';
  actionText: string;
  icon: any;
}

export function RevenueInsights() {
  // Mock data - in real app this would come from analytics API
  const { data: insights } = useQuery({
    queryKey: ['revenue-insights'],
    queryFn: async () => ([
      {
        title: "Weekend Premium",
        amount: 15200,
        period: "This weekend",
        change: 23.5,
        priority: 'high' as const,
        actionText: "Book more weekend slots",
        icon: Calendar
      },
      {
        title: "Corporate Events",
        amount: 8900,
        period: "Next 2 weeks", 
        change: 18.2,
        priority: 'high' as const,
        actionText: "Target corporate clients",
        icon: Users
      },
      {
        title: "Peak Hours",
        amount: 5400,
        period: "6-9 PM slots",
        change: 12.8,
        priority: 'medium' as const,
        actionText: "Optimize pricing",
        icon: Clock
      }
    ])
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return '🔥';
      case 'medium': return '⚡';
      default: return '💡';
    }
  };

  if (!insights) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-6 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-slate-200 bg-white">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-slate-700" />
              Revenue Opportunities
            </CardTitle>
            <p className="text-sm text-slate-600">High-impact revenue insights</p>
          </div>
          <Button variant="ghost" size="sm" className="text-slate-700 hover:text-slate-900 hover:bg-slate-50">
            <Target className="w-4 h-4 mr-2" />
            Analytics
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {insights.map((insight, index) => {
          const IconComponent = insight.icon;
          return (
            <div 
              key={index}
              className="bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors duration-200 p-4"
            >
              {/* Priority indicator */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center">
                    <IconComponent className="w-4 h-4 text-slate-700" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 mb-1">{insight.title}</h4>
                    <p className="text-sm text-slate-600">{insight.period}</p>
                  </div>
                </div>
                <Badge className={`text-xs border ${getPriorityColor(insight.priority)}`}>
                  {getPriorityIcon(insight.priority)} {insight.priority.toUpperCase()}
                </Badge>
              </div>
              
              <div className="mb-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-slate-900">
                    ${insight.amount.toLocaleString()}
                  </span>
                  <div className="flex items-center gap-1 text-sm font-medium text-green-700">
                    <TrendingUp className="w-3 h-3" />
                    <span>+{insight.change}%</span>
                  </div>
                </div>
              </div>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-slate-700 hover:text-slate-900 hover:bg-slate-200 p-0 h-auto font-medium"
              >
                {insight.actionText}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          );
        })}
        
        {/* Quick action */}
        <div className="mt-4 p-4 bg-slate-800 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold mb-1">Revenue Boost Ready</h4>
              <p className="text-sm text-slate-300">3 high-impact opportunities identified</p>
            </div>
            <Button variant="secondary" size="sm" className="bg-slate-700 hover:bg-slate-600 text-white border-0">
              <Zap className="w-4 h-4 mr-2" />
              Act Now
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}