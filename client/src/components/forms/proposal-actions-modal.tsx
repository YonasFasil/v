import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle, Send, Eye, FileText, ArrowRight, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposal: any;
}

export function ProposalActionsModal({ open, onOpenChange, proposal }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isConverting, setIsConverting] = useState(false);

  const updateProposalStatus = useMutation({
    mutationFn: async ({ status }: { status: string }) => {
      const response = await apiRequest("PATCH", `/api/proposals/${proposal?.id}`, { 
        status,
        sentAt: status === 'sent' ? new Date() : undefined,
        viewedAt: status === 'viewed' ? new Date() : undefined
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/proposals"] });
      toast({ title: "Proposal status updated!" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update proposal", description: error.message, variant: "destructive" });
    }
  });

  const convertToBooking = useMutation({
    mutationFn: async () => {
      setIsConverting(true);
      const response = await apiRequest("POST", `/api/proposals/${proposal?.id}/convert-to-booking`);
      return response.json();
    },
    onSuccess: (booking) => {
      queryClient.invalidateQueries({ queryKey: ["/api/proposals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({ 
        title: "Proposal converted to booking!", 
        description: `Event "${booking.eventName}" has been created and is ready for management.`
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ title: "Failed to convert proposal", description: error.message, variant: "destructive" });
      setIsConverting(false);
    }
  });

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

  const canConvertToBooking = proposal?.status === 'accepted';
  const canMarkAsSent = proposal?.status === 'draft';
  const canMarkAsAccepted = proposal?.status === 'viewed' || proposal?.status === 'sent';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0" aria-describedby="proposal-actions-description">
        <DialogTitle className="sr-only">Proposal Actions</DialogTitle>
        <div id="proposal-actions-description" className="sr-only">
          Manage proposal status and convert accepted proposals to bookings.
        </div>
        
        <div className="border-b border-slate-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold">Proposal Actions</h2>
              <p className="text-sm text-slate-600">{proposal?.title || "Untitled Proposal"}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Current Status */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-slate-700">Current Status</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getStatusColor(proposal?.status)}>
                  {proposal?.status?.charAt(0).toUpperCase() + proposal?.status?.slice(1)}
                </Badge>
                {proposal?.sentAt && (
                  <span className="text-xs text-slate-500">
                    Sent {format(new Date(proposal.sentAt), 'MMM d')}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-blue-600">
                ${proposal?.totalAmount?.toLocaleString() || '0'}
              </p>
              <p className="text-xs text-slate-500">Total Value</p>
            </div>
          </div>

          {/* Status Actions */}
          <div className="space-y-3">
            <h3 className="font-medium text-slate-800">Status Updates</h3>
            
            {canMarkAsSent && (
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={() => updateProposalStatus.mutate({ status: 'sent' })}
                disabled={updateProposalStatus.isPending}
              >
                <Send className="w-4 h-4 mr-3" />
                Mark as Sent to Customer
              </Button>
            )}

            <Button 
              variant="outline" 
              className="w-full justify-start" 
              onClick={() => updateProposalStatus.mutate({ status: 'viewed' })}
              disabled={updateProposalStatus.isPending}
            >
              <Eye className="w-4 h-4 mr-3" />
              Mark as Viewed by Customer
            </Button>

            {canMarkAsAccepted && (
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={() => updateProposalStatus.mutate({ status: 'accepted' })}
                disabled={updateProposalStatus.isPending}
              >
                <CheckCircle className="w-4 h-4 mr-3" />
                Mark as Accepted
              </Button>
            )}
          </div>

          {/* Convert to Booking */}
          {canConvertToBooking && (
            <div className="space-y-3">
              <div className="border-t pt-4">
                <h3 className="font-medium text-slate-800 mb-3">Ready for Booking</h3>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-800">Proposal Accepted!</span>
                  </div>
                  <p className="text-sm text-green-700 mb-4">
                    This proposal has been accepted and is ready to be converted into an active booking for event management.
                  </p>
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700" 
                    onClick={() => convertToBooking.mutate()}
                    disabled={isConverting}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    <ArrowRight className="w-4 h-4 mr-2" />
                    {isConverting ? 'Converting...' : 'Convert to Booking'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Workflow Guide */}
          <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded">
            <p className="font-medium mb-1">Workflow:</p>
            <p>Draft → Sent → Viewed → Accepted → Booking Created</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}