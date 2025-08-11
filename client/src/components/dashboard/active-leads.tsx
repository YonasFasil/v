import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDashboardData } from "@/contexts/dashboard-context";
import { MessageCircle, Star, Building } from "lucide-react";

export function ActiveLeads() {
  const { activeLeads, isLoading } = useDashboardData();
  
  const leads = activeLeads;

  const getPriorityColor = (score: number) => {
    if (score >= 80) return "bg-red-100 text-red-800";
    if (score >= 60) return "bg-orange-100 text-orange-800";
    if (score >= 40) return "bg-yellow-100 text-yellow-800";
    return "bg-blue-100 text-blue-800";
  };

  const getPriorityText = (score: number) => {
    if (score >= 80) return "High";
    if (score >= 60) return "Medium";
    if (score >= 40) return "Medium";
    return "Low";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Active Leads</CardTitle>
            <span className="text-sm text-slate-500">Loading...</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded mb-1 w-24"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter for leads only and sort by lead score
  const activeLeads = leads
    ?.filter(customer => customer.status === "lead")
    ?.sort((a, b) => (b.leadScore || 0) - (a.leadScore || 0))
    ?.slice(0, 5) || [];

  const highPriorityCount = activeLeads.filter(lead => (lead.leadScore || 0) >= 80).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Active Leads</CardTitle>
          <span className="text-sm text-slate-500">
            {highPriorityCount} high priority
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeLeads.length === 0 ? (
          <div className="text-center py-8">
            <Star className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">No active leads</p>
          </div>
        ) : (
          <>
            {activeLeads.map((lead) => (
              <div
                key={lead.id}
                className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-slate-700">
                      {getInitials(lead.name)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{lead.name}</p>
                    {lead.company && (
                      <p className="text-xs text-slate-500 flex items-center">
                        <Building className="w-3 h-3 mr-1" />
                        {lead.company}
                      </p>
                    )}
                    <div className="flex items-center space-x-2 mt-1">
                      {lead.leadScore && lead.leadScore > 0 && (
                        <Badge className={getPriorityColor(lead.leadScore)}>
                          {getPriorityText(lead.leadScore)}
                        </Badge>
                      )}
                      <span className="text-xs text-slate-500">
                        Score: {lead.leadScore || 0}
                      </span>
                    </div>
                  </div>
                </div>
                <Button size="sm" variant="ghost" className="text-slate-400 hover:text-slate-600">
                  <MessageCircle className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button variant="ghost" className="w-full text-blue-600 hover:text-blue-700 text-sm font-medium py-2">
              View All Leads
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
