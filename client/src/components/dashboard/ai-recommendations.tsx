import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, DollarSign, Users, TrendingUp } from "lucide-react";
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

  const getRecommendationColor = (type: string) => {
    switch (type) {
      case "pricing": return "border-purple-200 bg-purple-50";
      case "lead": return "border-blue-200 bg-blue-50";
      case "upsell": return "border-green-200 bg-green-50";
      case "scheduling": return "border-orange-200 bg-orange-50";
      default: return "border-gray-200 bg-gray-50";
    }
  };

  const getActionButtonColor = (type: string) => {
    switch (type) {
      case "pricing": return "text-purple-600 hover:text-purple-700";
      case "lead": return "text-blue-600 hover:text-blue-700";
      case "upsell": return "text-green-600 hover:text-green-700";
      case "scheduling": return "text-orange-600 hover:text-orange-700";
      default: return "text-gray-600 hover:text-gray-700";
    }
  };

  // Default recommendations when API data is not available
  const defaultRecommendations: AIRecommendation[] = [
    {
      id: "1",
      type: "pricing",
      title: "Optimize Weekend Pricing",
      description: "AI suggests increasing weekend rates by 15% based on demand patterns.",
      confidence: 85,
      action: "Apply Suggestion"
    },
    {
      id: "2",
      type: "lead",
      title: "Follow Up High-Value Lead",
      description: "Contact TechStart Inc. today - they viewed your proposal 3 times.",
      confidence: 92,
      action: "Send Follow-up"
    },
    {
      id: "3",
      type: "upsell",
      title: "Upsell Opportunity",
      description: "Johnson Wedding could add premium lighting package (+$1,200).",
      confidence: 78,
      action: "Send Proposal"
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
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Zap className="w-5 h-5 text-purple-600" />
          <CardTitle>AI Recommendations</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {defaultRecommendations.length === 0 ? (
          <div className="text-center py-8">
            <Zap className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">No AI recommendations available</p>
          </div>
        ) : (
          defaultRecommendations.slice(0, 3).map((recommendation: AIRecommendation) => (
            <div
              key={recommendation.id}
              className={`border rounded-lg p-4 ${getRecommendationColor(recommendation.type)}`}
            >
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-current rounded-full mt-2 flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    {getRecommendationIcon(recommendation.type)}
                    <h4 className="text-sm font-medium text-slate-900">
                      {recommendation.title}
                    </h4>
                    {recommendation.confidence && (
                      <span className="text-xs text-slate-500">
                        {recommendation.confidence}% confidence
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mb-3">
                    {recommendation.description}
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={`text-xs font-medium ${getActionButtonColor(recommendation.type)}`}
                    onClick={() => {
                      console.log(`AI Recommendation action clicked: ${recommendation.action}`);
                      alert(`${recommendation.action} feature coming soon!`);
                    }}
                  >
                    {recommendation.action}
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
