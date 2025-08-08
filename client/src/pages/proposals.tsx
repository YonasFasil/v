import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { ProposalCreationModal } from "@/components/proposals/proposal-creation-modal";
import { ProposalTrackingModal } from "@/components/proposals/proposal-tracking-modal";
import { format } from "date-fns";
import { 
  FileText, 
  Plus, 
  Eye, 
  Mail, 
  DollarSign, 
  Clock, 
  TrendingUp,
  Users,
  CheckCircle2,
  XCircle,
  Send,
  Edit,
  MoreHorizontal
} from "lucide-react";

export default function Proposals() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [selectedProposalId, setSelectedProposalId] = useState("");

  // Fetch proposals data
  const { data: proposals = [], isLoading } = useQuery({ 
    queryKey: ["/api/proposals"] 
  });

  // Calculate proposal metrics
  const metrics = {
    total: proposals.length,
    sent: proposals.filter((p: any) => p.status !== 'draft').length,
    viewed: proposals.filter((p: any) => p.emailOpened).length,
    accepted: proposals.filter((p: any) => p.status === 'accepted').length,
    converted: proposals.filter((p: any) => p.status === 'converted').length,
    totalValue: proposals.reduce((sum: number, p: any) => sum + parseFloat(p.totalAmount || 0), 0),
    depositsPaid: proposals.filter((p: any) => p.depositPaid).length
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'viewed': return 'bg-purple-100 text-purple-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'converted': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <Mail className="h-4 w-4" />;
      case 'viewed': return <Eye className="h-4 w-4" />;
      case 'accepted': return <CheckCircle2 className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'converted': return <CheckCircle2 className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const handleViewProposal = (proposalId: string) => {
    setSelectedProposalId(proposalId);
    setShowTrackingModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      
      <MobileNav 
        isOpen={mobileNavOpen} 
        onClose={() => setMobileNavOpen(false)} 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Proposals" 
          subtitle="Create, track, and manage event proposals"
          onMobileMenuToggle={() => setMobileNavOpen(true)}
          action={
            <Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Proposal
            </Button>
          }
        />
        
        <main className="flex-1 overflow-y-auto p-3 sm:p-6">
          {/* Metrics Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-6">
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Total Proposals</p>
                    <div className="text-xl sm:text-2xl font-bold">{metrics.total}</div>
                  </div>
                  <div className="bg-blue-100 rounded-full p-2 sm:p-3">
                    <FileText className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Viewed Rate</p>
                    <div className="text-xl sm:text-2xl font-bold">
                      {metrics.sent > 0 ? Math.round((metrics.viewed / metrics.sent) * 100) : 0}%
                    </div>
                  </div>
                  <div className="bg-purple-100 rounded-full p-2 sm:p-3">
                    <Eye className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Acceptance Rate</p>
                    <div className="text-xl sm:text-2xl font-bold">
                      {metrics.sent > 0 ? Math.round((metrics.accepted / metrics.sent) * 100) : 0}%
                    </div>
                  </div>
                  <div className="bg-green-100 rounded-full p-2 sm:p-3">
                    <CheckCircle2 className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Total Value</p>
                    <div className="text-xl sm:text-2xl font-bold">${metrics.totalValue.toLocaleString()}</div>
                  </div>
                  <div className="bg-emerald-100 rounded-full p-2 sm:p-3">
                    <DollarSign className="h-4 w-4 sm:h-6 sm:w-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Proposals Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                All Proposals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="space-y-3 sm:space-y-4">
                <TabsList className="grid w-full grid-cols-5 text-xs sm:text-sm">
                  <TabsTrigger value="all" className="px-2 sm:px-4">All</TabsTrigger>
                  <TabsTrigger value="draft" className="px-2 sm:px-4">Drafts</TabsTrigger>
                  <TabsTrigger value="sent" className="px-2 sm:px-4">Sent</TabsTrigger>
                  <TabsTrigger value="viewed" className="px-2 sm:px-4">Viewed</TabsTrigger>
                  <TabsTrigger value="accepted" className="px-2 sm:px-4">Accepted</TabsTrigger>
                </TabsList>

                <TabsContent value="all">
                  {/* Mobile Cards View */}
                  <div className="sm:hidden space-y-3">
                    {proposals.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="flex flex-col items-center gap-3">
                          <FileText className="h-12 w-12 text-gray-300" />
                          <div>
                            <p className="font-medium text-gray-900">No proposals yet</p>
                            <p className="text-sm text-gray-500">Create your first proposal to get started</p>
                          </div>
                          <Button onClick={() => setShowCreateModal(true)} className="w-full">
                            <Plus className="h-4 w-4 mr-2" />
                            Create Proposal
                          </Button>
                        </div>
                      </div>
                    ) : (
                      proposals.map((proposal: any) => (
                        <Card key={proposal.id} className="p-3">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-medium text-sm">{proposal.title}</h3>
                                <p className="text-xs text-gray-600">{proposal.customerName}</p>
                              </div>
                              <Badge className={`${getStatusColor(proposal.status)} text-xs`}>
                                <div className="flex items-center gap-1">
                                  {getStatusIcon(proposal.status)}
                                  {proposal.status}
                                </div>
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-gray-500">Date:</span>
                                <div>{proposal.eventDate ? format(new Date(proposal.eventDate), 'MMM d, yyyy') : 'N/A'}</div>
                              </div>
                              <div>
                                <span className="text-gray-500">Amount:</span>
                                <div className="font-medium">${parseFloat(proposal.totalAmount || 0).toLocaleString()}</div>
                              </div>
                              <div>
                                <span className="text-gray-500">Created:</span>
                                <div>{format(new Date(proposal.createdAt), 'MMM d')}</div>
                              </div>
                              <div>
                                <span className="text-gray-500">Deposit:</span>
                                <div className={proposal.depositPaid ? "text-green-600" : "text-gray-500"}>
                                  {proposal.depositPaid ? "Paid" : "Pending"}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex gap-2 pt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewProposal(proposal.id)}
                                className="flex-1 text-xs"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                              <Button size="sm" variant="outline" className="flex-1 text-xs">
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden sm:block border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs sm:text-sm">Proposal</TableHead>
                          <TableHead className="text-xs sm:text-sm">Customer</TableHead>
                          <TableHead className="text-xs sm:text-sm">Event Date</TableHead>
                          <TableHead className="text-xs sm:text-sm">Amount</TableHead>
                          <TableHead className="text-xs sm:text-sm">Status</TableHead>
                          <TableHead className="text-xs sm:text-sm">Deposit</TableHead>
                          <TableHead className="text-xs sm:text-sm">Created</TableHead>
                          <TableHead className="text-xs sm:text-sm">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {proposals.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-8">
                              <div className="flex flex-col items-center gap-3">
                                <FileText className="h-12 w-12 text-gray-300" />
                                <div>
                                  <p className="font-medium text-gray-900">No proposals yet</p>
                                  <p className="text-sm text-gray-500">Create your first proposal to get started</p>
                                </div>
                                <Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700">
                                  <Plus className="h-4 w-4 mr-2" />
                                  Create Proposal
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          proposals.map((proposal: any) => (
                            <TableRow 
                              key={proposal.id}
                              className="hover:bg-gray-50 cursor-pointer"
                              onClick={() => handleViewProposal(proposal.id)}
                            >
                              <TableCell>
                                <div>
                                  <div className="font-medium">{proposal.title}</div>
                                  <div className="text-sm text-gray-500">{proposal.eventName}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{proposal.customer?.name}</div>
                                  <div className="text-sm text-gray-500">{proposal.customer?.email}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {proposal.eventDate 
                                  ? format(new Date(proposal.eventDate), "MMM d, yyyy")
                                  : "TBD"
                                }
                              </TableCell>
                              <TableCell className="font-medium">
                                ${parseFloat(proposal.totalAmount).toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(proposal.status)}>
                                  {getStatusIcon(proposal.status)}
                                  <span className="ml-1">{proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}</span>
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div className="font-medium text-green-600">
                                    ${parseFloat(proposal.depositAmount).toFixed(2)}
                                  </div>
                                  {proposal.depositPaid ? (
                                    <Badge className="bg-green-100 text-green-800 text-xs">
                                      ✓ Paid
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-xs">
                                      Pending
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-gray-500">
                                {format(new Date(proposal.createdAt), "MMM d, yyyy")}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewProposal(proposal.id);
                                    }}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                {/* Other tab contents would filter the proposals array */}
                <TabsContent value="draft">
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Draft proposals will be shown here</p>
                  </div>
                </TabsContent>

                <TabsContent value="sent">
                  <div className="text-center py-8 text-gray-500">
                    <Send className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Sent proposals will be shown here</p>
                  </div>
                </TabsContent>

                <TabsContent value="viewed">
                  <div className="text-center py-8 text-gray-500">
                    <Eye className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Viewed proposals will be shown here</p>
                  </div>
                </TabsContent>

                <TabsContent value="accepted">
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Accepted proposals will be shown here</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </main>

        {/* Modals */}
        <ProposalCreationModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
        />

        <ProposalTrackingModal
          open={showTrackingModal}
          onOpenChange={setShowTrackingModal}
          proposalId={selectedProposalId}
        />
      </div>
    </div>
  );
}