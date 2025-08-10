import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Phone, Mail, Calendar, User, Building, Clock, Tag, Plus, Search, Filter } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Lead, CampaignSource, Tag as TagType } from "@shared/schema";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";

export default function Leads() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const queryClient = useQueryClient();

  // Fetch leads with filters
  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ["/api/leads", { status: statusFilter === "all" ? undefined : statusFilter, q: searchQuery, source: sourceFilter === "all" ? undefined : sourceFilter }],
    enabled: true
  });

  // Fetch campaign sources
  const { data: sources = [] } = useQuery({
    queryKey: ["/api/campaign-sources"]
  });

  // Fetch tags
  const { data: tags = [] } = useQuery({
    queryKey: ["/api/tags"]
  });

  // Lead status update mutation
  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Lead> }) => {
      const response = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        throw new Error('Failed to update lead');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "NEW": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "CONTACTED": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "QUALIFIED": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "TOUR_SCHEDULED": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "PROPOSAL_SENT": return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200";
      case "WON": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200";
      case "LOST": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType.toLowerCase()) {
      case "wedding": return "💒";
      case "corporate": return "🏢";
      case "birthday": return "🎂";
      case "social": return "🎉";
      default: return "📅";
    }
  };

  const formatBudgetRange = (min?: number, max?: number) => {
    if (!min && !max) return "Budget not specified";
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min) return `$${min.toLocaleString()}+`;
    if (max) return `Up to $${max.toLocaleString()}`;
    return "Budget not specified";
  };

  const leadsArray = Array.isArray(leads) ? leads as Lead[] : [];
  
  const filteredLeads = leadsArray.filter((lead: Lead) => {
    const matchesSearch = !searchQuery || 
      lead.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.eventType.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    const matchesSource = sourceFilter === "all" || lead.sourceId === sourceFilter;
    
    return matchesSearch && matchesStatus && matchesSource;
  });

  const leadCounts = {
    total: leadsArray.length,
    new: leadsArray.filter((l: Lead) => l.status === "NEW").length,
    contacted: leadsArray.filter((l: Lead) => l.status === "CONTACTED").length,
    qualified: leadsArray.filter((l: Lead) => l.status === "QUALIFIED").length,
    won: leadsArray.filter((l: Lead) => l.status === "WON").length
  };

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
          title="Lead Management" 
          subtitle="Track and manage potential customers through your sales pipeline"
          onMobileMenuToggle={() => setMobileNavOpen(true)}
          onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          sidebarCollapsed={sidebarCollapsed}
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
      {/* Add Lead Button */}
      <div className="flex justify-end">
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Lead
        </Button>
      </div>

      {/* Lead Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{leadCounts.total}</p>
                <p className="text-sm text-muted-foreground">Total Leads</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <div>
                <p className="text-2xl font-bold">{leadCounts.new}</p>
                <p className="text-sm text-muted-foreground">New</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div>
                <p className="text-2xl font-bold">{leadCounts.contacted}</p>
                <p className="text-sm text-muted-foreground">Contacted</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <p className="text-2xl font-bold">{leadCounts.qualified}</p>
                <p className="text-sm text-muted-foreground">Qualified</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
              <div>
                <p className="text-2xl font-bold">{leadCounts.won}</p>
                <p className="text-sm text-muted-foreground">Won</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search leads by name, email, or event type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="NEW">New</SelectItem>
                <SelectItem value="CONTACTED">Contacted</SelectItem>
                <SelectItem value="QUALIFIED">Qualified</SelectItem>
                <SelectItem value="TOUR_SCHEDULED">Tour Scheduled</SelectItem>
                <SelectItem value="PROPOSAL_SENT">Proposal Sent</SelectItem>
                <SelectItem value="WON">Won</SelectItem>
                <SelectItem value="LOST">Lost</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {Array.isArray(sources) && sources.map((source: CampaignSource) => (
                  <SelectItem key={source.id} value={source.id}>
                    {source.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Leads List */}
      <div className="grid gap-4">
        {leadsLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading leads...</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No leads found</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== "all" || sourceFilter !== "all" 
                  ? "Try adjusting your filters to see more results."
                  : "Start capturing leads to see them here."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredLeads.map((lead: Lead) => (
            <Card key={lead.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">{getEventTypeIcon(lead.eventType)}</div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        {lead.firstName} {lead.lastName}
                      </h3>
                      <p className="text-sm text-muted-foreground capitalize">
                        {lead.eventType} Event
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(lead.status)}>
                      {lead.status.replace("_", " ")}
                    </Badge>
                    <Select 
                      value={lead.status} 
                      onValueChange={(newStatus) => 
                        updateLeadMutation.mutate({ id: lead.id, data: { status: newStatus } })
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NEW">New</SelectItem>
                        <SelectItem value="CONTACTED">Contacted</SelectItem>
                        <SelectItem value="QUALIFIED">Qualified</SelectItem>
                        <SelectItem value="TOUR_SCHEDULED">Tour Scheduled</SelectItem>
                        <SelectItem value="PROPOSAL_SENT">Proposal Sent</SelectItem>
                        <SelectItem value="WON">Won</SelectItem>
                        <SelectItem value="LOST">Lost</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{lead.email}</span>
                  </div>
                  
                  {lead.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{lead.phone}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{lead.dateStart ? new Date(lead.dateStart).toLocaleDateString() : 'No date set'}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{lead.guestCount || 0} guests</span>
                  </div>
                </div>

                <div className="mt-4 flex justify-between items-center">
                  <div className="text-sm">
                    <span className="font-medium">{formatBudgetRange(lead.budgetMin, lead.budgetMax)}</span>
                    {lead.notes && (
                      <p className="text-muted-foreground mt-1 line-clamp-2">{lead.notes}</p>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Calendar className="h-4 w-4 mr-1" />
                      Schedule Tour
                    </Button>
                    <Button variant="outline" size="sm">
                      <Mail className="h-4 w-4 mr-1" />
                      Send Proposal
                    </Button>
                    <Button size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
          </div>
        </main>
      </div>
    </div>
  );
}