import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ProposalForm } from "@/components/forms/proposal-form";
import { ProposalActionsModal } from "@/components/forms/proposal-actions-modal";
import { useProposals } from "@/hooks/use-proposals";
import { FileText, Eye, Send, Calendar, DollarSign, MoreVertical } from "lucide-react";
import { format } from "date-fns";

export default function Proposals() {
  const { data: proposals, isLoading } = useProposals();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<any>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted": return "bg-green-100 text-green-800";
      case "sent": return "bg-blue-100 text-blue-800";
      case "viewed": return "bg-yellow-100 text-yellow-800";
      case "draft": return "bg-gray-100 text-gray-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent": return <Send className="w-4 h-4" />;
      case "viewed": return <Eye className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Proposals & Contracts" subtitle="Create and manage client proposals" />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </main>
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
          title="Proposals & Contracts" 
          subtitle="Create and manage client proposals"
          onMobileMenuToggle={() => setMobileNavOpen(true)}
          action={
            <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  + New Proposal
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Proposal</DialogTitle>
                </DialogHeader>
                <ProposalForm onSuccess={() => setShowCreateForm(false)} />
              </DialogContent>
            </Dialog>
          }
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          {!proposals || proposals.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No proposals yet</h3>
              <p className="text-gray-600 mb-6">Create your first proposal to send to potential clients.</p>
              <Button onClick={() => setShowCreateForm(true)} className="bg-blue-600 hover:bg-blue-700">
                Create First Proposal
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {proposals.map((proposal) => (
                <Card key={proposal.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold line-clamp-2">{proposal.title}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          Proposal #{proposal.id.slice(-8)}
                        </p>
                      </div>
                      <Badge className={`${getStatusColor(proposal.status)} flex items-center gap-1`}>
                        {getStatusIcon(proposal.status)}
                        {proposal.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      Created {proposal.createdAt ? format(new Date(proposal.createdAt), "PPP") : "Recently"}
                    </div>
                    
                    {proposal.sentAt && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Send className="w-4 h-4 mr-2" />
                        Sent {format(new Date(proposal.sentAt), "PPP")}
                      </div>
                    )}
                    
                    {proposal.viewedAt && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Eye className="w-4 h-4 mr-2" />
                        Viewed {format(new Date(proposal.viewedAt), "PPP")}
                      </div>
                    )}

                    {proposal.totalAmount && (
                      <div className="flex items-center text-lg font-semibold text-green-600">
                        <DollarSign className="w-4 h-4 mr-1" />
                        ${parseFloat(proposal.totalAmount).toLocaleString()}
                      </div>
                    )}

                    {proposal.validUntil && (
                      <div className="text-sm text-orange-600">
                        Valid until {format(new Date(proposal.validUntil), "PPP")}
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedProposal(proposal)}
                      >
                        Manage Proposal
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setSelectedProposal(proposal)}
                        className="h-8 w-8 p-0"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {proposal.status === 'accepted' && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-center">
                        <p className="text-xs text-green-700 font-medium">🎉 Ready to convert to booking!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Proposal Actions Modal */}
      <ProposalActionsModal
        open={!!selectedProposal}
        onOpenChange={(open) => !open && setSelectedProposal(null)}
        proposal={selectedProposal}
      />
    </div>
  );
}
