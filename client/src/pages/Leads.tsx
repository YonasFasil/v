import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Phone, Mail, Calendar, User, Building, Clock, Tag, Plus, Search, Filter, Eye } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useFormattedCurrency } from "@/lib/currency";
import { useTimezone } from "@/hooks/use-timezone";
import type { Lead, CampaignSource, Tag as TagType } from "@shared/schema";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { PublicQuoteForm } from "@/components/lead-capture/public-quote-form";

export default function Leads() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { formatAmount } = useFormattedCurrency();
  const { formatDate } = useTimezone();

  // Fetch leads with filters
  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ["/api/leads"],
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

  // Fetch proposals to show which proposals were sent for leads
  const { data: proposals = [] } = useQuery({
    queryKey: ["/api/proposals"]
  });

  // Lead status update mutation
  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Lead> }) => {
      return apiRequest("PATCH", `/api/leads/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
    }
  });

  // Convert lead to customer mutation
  const convertToCustomerMutation = useMutation({
    mutationFn: async (leadId: string) => {
      return apiRequest("POST", `/api/leads/${leadId}/convert`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
    }
  });

  // Handle lead status change
  const handleStatusChange = (leadId: string, newStatus: string) => {
    updateLeadMutation.mutate({ id: leadId, data: { status: newStatus } });
  };

  // Handle convert to customer
  const handleConvertToCustomer = (leadId: string) => {
    convertToCustomerMutation.mutate(leadId);
  };

  // Handle schedule tour
  const handleScheduleTour = (leadId: string) => {
    // Update status to tour scheduled and set a reminder/task
    updateLeadMutation.mutate({ 
      id: leadId, 
      data: { status: "TOUR_SCHEDULED" } 
    });
  };

  // Send proposal mutation
  const sendProposalMutation = useMutation({
    mutationFn: async (leadId: string) => {
      return await apiRequest("POST", `/api/leads/${leadId}/send-proposal`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Success",
        description: "Proposal sent successfully!",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send proposal. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle send proposal
  const handleSendProposal = (leadId: string) => {
    sendProposalMutation.mutate(leadId);
  };

  // Find proposal for a lead
  const getProposalForLead = (leadId: string) => {
    // Find lead activities to get proposalId
    const lead = leads.find(l => l.id === leadId);
    if (!lead || !lead.proposalId) return null;
    
    return proposals.find(p => p.id === lead.proposalId);
  };

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

  const formatBudgetRange = (min?: number | null, max?: number | null) => {
    if (!min && !max) return "Budget not specified";
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min) return `$${min.toLocaleString()}+`;
    if (max) return `Up to $${max.toLocaleString()}`;
    return "Budget not specified";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const leadsArray = Array.isArray(leads) ? leads as Lead[] : [];

  // Apply filters to leads
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
        <Button onClick={() => setShowAddModal(true)}>
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
                      onValueChange={(newStatus) => handleStatusChange(lead.id, newStatus)}
                      disabled={updateLeadMutation.isPending}
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
                    <span>{lead.dateStart ? formatDate(lead.dateStart, 'MMM d, yyyy') : 'No date set'}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{lead.guestCount ?? 0} guests</span>
                  </div>
                </div>

                {/* Proposal Information */}
                {lead.status === "PROPOSAL_SENT" && getProposalForLead(lead.id) && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-800">Proposal Sent</span>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">
                        {getProposalForLead(lead.id)?.status}
                      </Badge>
                    </div>
                    <div className="mt-2 text-sm text-blue-700">
                      <div><strong>Title:</strong> {getProposalForLead(lead.id)?.title}</div>
                      <div><strong>Amount:</strong> {formatAmount(parseFloat(getProposalForLead(lead.id)?.totalAmount || "0"))}</div>
                      <div><strong>Valid Until:</strong> {formatDate(getProposalForLead(lead.id)?.validUntil || "", 'MMM d, yyyy')}</div>
                    </div>
                    <div className="mt-2 flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(`/proposals/${getProposalForLead(lead.id)?.id}`, '_blank')}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Proposal
                      </Button>
                    </div>
                  </div>
                )}

                <div className="mt-4 flex justify-between items-center">
                  <div className="text-sm">
                    <span className="font-medium">{formatBudgetRange(lead.budgetMin, lead.budgetMax)}</span>
                    {lead.notes && (
                      <p className="text-muted-foreground mt-1 line-clamp-2">{lead.notes}</p>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleScheduleTour(lead.id)}
                      disabled={updateLeadMutation.isPending}
                    >
                      <Calendar className="h-4 w-4 mr-1" />
                      Schedule Tour
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleSendProposal(lead.id)}
                      disabled={sendProposalMutation.isPending || updateLeadMutation.isPending || lead.status === "PROPOSAL_SENT"}
                    >
                      <Mail className="h-4 w-4 mr-1" />
                      {sendProposalMutation.isPending ? "Sending..." : 
                       lead.status === "PROPOSAL_SENT" ? "Proposal Sent" : "Send Proposal"}
                    </Button>
                    {lead.status === "QUALIFIED" && (
                      <Button 
                        size="sm"
                        onClick={() => handleConvertToCustomer(lead.id)}
                        disabled={convertToCustomerMutation.isPending}
                      >
                        Convert to Customer
                      </Button>
                    )}
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

      {/* Proposals Tracking Section */}
      <div className="fixed bottom-6 right-6 z-50">
        <Card className="w-80 max-h-96 overflow-y-auto shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Recent Proposals Sent ({proposals.filter(p => p.status === 'sent').length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {proposals.filter(p => p.status === 'sent').slice(0, 5).map((proposal) => {
              const relatedLead = leads.find(l => l.proposalId === proposal.id);
              return (
                <div key={proposal.id} className="p-2 bg-gray-50 rounded text-xs">
                  <div className="font-medium truncate">{proposal.title}</div>
                  <div className="text-gray-600">
                    {relatedLead ? `${relatedLead.firstName} ${relatedLead.lastName}` : 'Unknown Lead'}
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-green-600 font-medium">
                      {formatAmount(parseFloat(proposal.totalAmount || "0"))}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {proposal.status}
                    </Badge>
                  </div>
                </div>
              );
            })}
            {proposals.filter(p => p.status === 'sent').length === 0 && (
              <div className="text-gray-500 text-xs text-center py-4">
                No proposals sent yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Lead Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
            <DialogDescription>
              Fill out the form below to add a new lead to your system.
            </DialogDescription>
          </DialogHeader>
          <PublicQuoteForm 
            onSuccess={() => {
              setShowAddModal(false);
              queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
            }}
            embedded={true}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}