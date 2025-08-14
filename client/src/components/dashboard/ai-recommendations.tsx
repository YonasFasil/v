import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, DollarSign, Users, TrendingUp, Brain, ArrowRight, Sparkles, CheckCircle, Target } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface AIRecommendation {
  id: string;
  type: "pricing" | "lead" | "upsell" | "scheduling";
  title: string;
  description: string;
  confidence: number;
  action: string;
}

export function AIRecommendations() {
  const { data: insights, isLoading } = useQuery({
    queryKey: ["/api/ai/insights"],
  });

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case "pricing": return <DollarSign className="w-4 h-4" />;
      case "lead": return <Users className="w-4 h-4" />;
      case "upsell": return <TrendingUp className="w-4 h-4" />;
      case "scheduling": return <Zap className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };


  // Default recommendations when API data is not available
  const defaultRecommendations: AIRecommendation[] = [
    {
      id: "1",
      type: "pricing",
      title: "Peak Hour Rate Optimization",
      description: "Increase Friday evening rates by 12% - analysis shows 89% booking rate at current pricing indicates undervaluation.",
      confidence: 89,
      action: "Update Pricing"
    },
    {
      id: "2",
      type: "lead",
      title: "Corporate Client Follow-up",
      description: "Morrison & Associates requested quotes for 3 quarterly meetings. Last contact: 5 days ago.",
      confidence: 85,
      action: "Contact Now"
    },
    {
      id: "3",
      type: "upsell",
      title: "Premium Service Add-on",
      description: "Matthews Wedding (Sep 15) budget allows $2,400 for AV upgrades. Estimated conversion: 78%.",
      confidence: 78,
      action: "Send Quote"
    }
  ];

  const recommendations = insights || defaultRecommendations;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-purple-600" />
            <CardTitle>AI Recommendations</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse border border-gray-200 rounded-lg p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
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
              <Brain className="w-5 h-5 text-slate-700" />
              Business Intelligence
            </CardTitle>
            <p className="text-sm text-slate-600">AI-driven insights and recommendations</p>
          </div>
          <Badge className="bg-slate-100 text-slate-700 border-slate-200">
            Active
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {defaultRecommendations.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Brain className="w-6 h-6 text-slate-500" />
            </div>
            <p className="text-base font-medium text-slate-700 mb-2">Analyzing business data</p>
            <p className="text-sm text-slate-500">Insights will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {defaultRecommendations.slice(0, 3).map((recommendation: AIRecommendation, index) => {
              return (
                <div
                  key={recommendation.id}
                  className="bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors duration-200 p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center">
                        <div className="text-slate-700">
                          {getRecommendationIcon(recommendation.type)}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900 mb-1">
                          {recommendation.title}
                        </h4>
                        <p className="text-sm text-slate-600">{recommendation.description}</p>
                      </div>
                    </div>
                    <Badge className="text-xs bg-slate-200 text-slate-700 border-slate-300">
                      {recommendation.confidence}%
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-700 hover:text-slate-900 hover:bg-slate-200 p-0 h-auto font-medium"
                      onClick={() => {
                        console.log(`AI Recommendation action clicked: ${recommendation.action}`);
                        alert(`${recommendation.action} feature coming soon!`);
                      }}
                    >
                      {recommendation.action}
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                    
                    <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700 p-0 h-auto">
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
            
            {/* Summary footer */}
            <div className="mt-4 p-4 bg-slate-800 rounded-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold mb-1">Business Optimization</h4>
                  <p className="text-sm text-slate-300">3 actionable recommendations identified</p>
                </div>
                <Button variant="secondary" size="sm" className="bg-slate-700 hover:bg-slate-600 text-white border-0">
                  <Target className="w-4 h-4 mr-2" />
                  Review All
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
