import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { 
  FileText, 
  Eye, 
  Mail, 
  Phone, 
  MessageSquare, 
  Clock, 
  DollarSign,
  CheckCircle2,
  XCircle,
  Send,
  CreditCard,
  Calendar,
  MapPin,
  Users
} from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposalId: string;
}

export function ProposalTrackingModal({ open, onOpenChange, proposalId }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");
  const [messageType, setMessageType] = useState("email");

  // Fetch proposal details with refreshing when modal opens
  const { data: proposal, isLoading, refetch } = useQuery({
    queryKey: [`/api/proposals/${proposalId}`],
    enabled: !!proposalId && open && !proposalId?.startsWith('booking-')
  });

  // Refresh proposal data when modal opens to get latest tracking info
  useEffect(() => {
    if (open && proposalId && !proposalId?.startsWith('booking-')) {
      refetch();
    }
  }, [open, proposalId, refetch]);

  // Handle placeholder proposals (created from bookings with sent status)
  const isPlaceholderProposal = proposalId?.startsWith('booking-');
  const placeholderProposal = isPlaceholderProposal ? {
    id: proposalId,
    eventName: "Event Proposal",
    status: "sent",
    sentAt: new Date().toISOString(),
    emailOpened: false,
    openCount: 0,
    totalAmount: "0"
  } : null;

  // Fetch communications
  const { data: communications = [] } = useQuery({
    queryKey: [`/api/proposals/${proposalId}/communications`],
    enabled: !!proposalId && open
  });

  // Fetch related events/bookings for this proposal
  const { data: bookings = [] } = useQuery({
    queryKey: ["/api/bookings"],
    enabled: !!proposalId && open
  });

  // Fetch customers data
  const { data: customers = [] } = useQuery({
    queryKey: ["/api/customers"],
    enabled: !!proposalId && open
  });

  // Fetch venues data
  const { data: venues = [] } = useQuery({
    queryKey: ["/api/venues-with-spaces"],
    enabled: !!proposalId && open
  });

  // Find the events/bookings associated with this specific proposal
  const relatedEvents = proposal ? (() => {
    console.log('Proposal:', proposal);
    console.log('All bookings:', bookings);
    
    const filtered = bookings.filter((booking: any) => {
      // First, check if this booking is for the same customer
      if (booking.customerId !== proposal.customerId) return false;
      
      // If booking has a proposalId, use exact match
      if (booking.proposalId) {
        return booking.proposalId === proposal.id;
      }
      
      // For proposals created from booking flow, match by proposal status and timing
      if (booking.proposalStatus === 'sent' && booking.proposalSentAt) {
        const proposalTime = proposal.sentAt ? new Date(proposal.sentAt).getTime() : new Date(proposal.createdAt).getTime();
        const bookingProposalTime = new Date(booking.proposalSentAt).getTime();
        const timeDiff = Math.abs(proposalTime - bookingProposalTime);
        
        console.log(`Checking booking ${booking.id}: proposalTime=${new Date(proposalTime)}, bookingProposalTime=${new Date(bookingProposalTime)}, timeDiff=${timeDiff}ms`);
        
        // Match if sent within 5 minutes of each other (increased from 2 minutes)
        if (timeDiff < 300000) {
          return true;
        }
      }
      
      return false;
    });
    
    console.log('Filtered bookings:', filtered);
    
    const events = filtered.flatMap((booking: any) => {
      // Handle contract events (multiple events under one booking)
      if (booking.contractEvents && booking.contractEvents.length > 0) {
        return booking.contractEvents;
      }
      // Handle regular single events
      return [booking];
    });
    
    console.log('Final events:', events);
    return events;
  })() : [];

  // Get customer information
  const customer = proposal ? customers.find((c: any) => c.id === proposal.customerId) : null;

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", `/api/proposals/${proposalId}/communications`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Message Sent",
        description: "Your message has been sent to the customer"
      });
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: [`/api/proposals/${proposalId}/communications`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  });

  // Process deposit payment
  const processDepositMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/proposals/${proposalId}/process-deposit`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Payment Processed",
        description: "Deposit payment has been processed successfully"
      });
      queryClient.invalidateQueries({ queryKey: [`/api/proposals/${proposalId}`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to process payment",
        variant: "destructive"
      });
    }
  });

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    sendMessageMutation.mutate({
      type: messageType,
      direction: "outbound",
      subject: messageType === "email" ? "Re: Your Event Proposal" : undefined,
      content: newMessage
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
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

  const currentProposal = proposal || placeholderProposal;

  // Early return if no proposal data available
  if (!currentProposal) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>Loading Proposal...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="text-gray-400 mb-2">Loading proposal data...</div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (isLoading && !isPlaceholderProposal) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!currentProposal) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Proposal Tracking: {currentProposal.eventName || currentProposal.title}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Proposal Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Proposal Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="bg-blue-100 rounded-full p-3 w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                      <Mail className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="text-sm font-medium">Sent</div>
                    <div className="text-xs text-gray-500">
                      {currentProposal.sentAt && !isNaN(new Date(currentProposal.sentAt).getTime()) 
                        ? format(new Date(currentProposal.sentAt), "MMM d") 
                        : "Not sent"}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className={`rounded-full p-3 w-12 h-12 mx-auto mb-2 flex items-center justify-center ${
                      currentProposal.emailOpened ? 'bg-purple-100' : 'bg-gray-100'
                    }`}>
                      <Eye className={`h-6 w-6 ${currentProposal.emailOpened ? 'text-purple-600' : 'text-gray-400'}`} />
                    </div>
                    <div className="text-sm font-medium">Opened</div>
                    <div className="text-xs text-gray-500">
                      {currentProposal.emailOpenedAt && !isNaN(new Date(currentProposal.emailOpenedAt).getTime()) 
                        ? format(new Date(currentProposal.emailOpenedAt), "MMM d") 
                        : "Not opened"}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className={`rounded-full p-3 w-12 h-12 mx-auto mb-2 flex items-center justify-center ${
                      currentProposal.status === 'accepted' ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <CheckCircle2 className={`h-6 w-6 ${currentProposal.status === 'accepted' ? 'text-green-600' : 'text-gray-400'}`} />
                    </div>
                    <div className="text-sm font-medium">Accepted</div>
                    <div className="text-xs text-gray-500">
                      {currentProposal.status === 'accepted' && (currentProposal.viewedAt || currentProposal.createdAt) 
                        ? format(new Date(currentProposal.viewedAt || currentProposal.createdAt), "MMM d") 
                        : "Pending"}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className={`rounded-full p-3 w-12 h-12 mx-auto mb-2 flex items-center justify-center ${
                      currentProposal.depositPaid ? 'bg-emerald-100' : 'bg-gray-100'
                    }`}>
                      <CreditCard className={`h-6 w-6 ${currentProposal.depositPaid ? 'text-emerald-600' : 'text-gray-400'}`} />
                    </div>
                    <div className="text-sm font-medium">Paid</div>
                    <div className="text-xs text-gray-500">
                      {currentProposal.depositPaidAt && !isNaN(new Date(currentProposal.depositPaidAt).getTime()) 
                        ? format(new Date(currentProposal.depositPaidAt), "MMM d") 
                        : "Not paid"}
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <Badge className={getStatusColor(currentProposal.status)}>
                      {getStatusIcon(currentProposal.status)}
                      <span className="ml-1">{currentProposal.status.charAt(0).toUpperCase() + currentProposal.status.slice(1)}</span>
                    </Badge>
                    <div className="text-sm text-gray-600">
                      Created {currentProposal.createdAt && !isNaN(new Date(currentProposal.createdAt).getTime()) 
                        ? format(new Date(currentProposal.createdAt), "MMM d, yyyy") 
                        : "Unknown"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Event Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Event Details {relatedEvents.length > 1 && `(${relatedEvents.length} Events)`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {relatedEvents.length === 0 ? (
                  <div className="text-gray-500 text-center py-4">
                    <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p>No events found for this proposal</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {relatedEvents.map((event: any, index: number) => {
                      const venue = venues.find((v: any) => v.id === event.venueId);
                      const space = venue?.spaces?.find((s: any) => s.id === event.spaceId);
                      
                      return (
                        <div key={event.id} className={`${index > 0 ? 'border-t pt-4' : ''}`}>
                          <div className="space-y-3">
                            <div className="font-medium text-lg">{event.eventName}</div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span>{event.eventDate && !isNaN(new Date(event.eventDate).getTime()) 
                                  ? format(new Date(event.eventDate), "MMMM d, yyyy") 
                                  : "Date TBD"}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span>{event.startTime} - {event.endTime}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-gray-400" />
                                <span>{event.guestCount} guests</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-gray-400" />
                                <span>{venue?.name || 'Venue TBD'}{space ? ` - ${space.name}` : ''}</span>
                              </div>
                            </div>
                            
                            {event.notes && (
                              <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                <strong>Notes:</strong> {event.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <Separator className="my-4" />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Amount</span>
                    <span className="font-medium">${parseFloat((proposal && proposal.totalAmount) || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Required Deposit</span>
                    <span className="font-medium">${parseFloat((proposal && proposal.depositAmount) || 0).toFixed(2)}</span>
                  </div>
                  {proposal && proposal.depositPaid && (
                    <div className="flex justify-between text-emerald-600">
                      <span>✓ Deposit Paid</span>
                      <span className="font-medium">
                        {(proposal && proposal.depositPaidAt && !isNaN(new Date(proposal.depositPaidAt).getTime())) 
                        ? format(new Date(proposal.depositPaidAt), "MMM d, yyyy") 
                        : 'N/A'}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Communication Log */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Communication History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {communications.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No communications yet</p>
                    </div>
                  ) : (
                    communications.map((comm: any) => (
                      <div key={comm.id} className="border-l-4 border-blue-200 pl-4 py-2">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            {comm.type === 'email' && <Mail className="h-4 w-4 text-blue-500" />}
                            {comm.type === 'phone' && <Phone className="h-4 w-4 text-green-500" />}
                            {comm.type === 'note' && <MessageSquare className="h-4 w-4 text-gray-500" />}
                            <span className="font-medium text-sm">
                              {comm.direction === 'outbound' ? 'Sent' : 'Received'}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {comm.type}
                            </Badge>
                          </div>
                          <span className="text-xs text-gray-500">
                            {comm.createdAt && !isNaN(new Date(comm.createdAt).getTime()) 
                              ? format(new Date(comm.createdAt), "MMM d, h:mm a")
                              : "Unknown"}
                          </span>
                        </div>
                        {comm.subject && (
                          <div className="text-sm font-medium mb-1">{comm.subject}</div>
                        )}
                        <div className="text-sm text-gray-600">{comm.content}</div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Customer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="font-medium">{customer?.name || 'Customer Name'}</div>
                  <div className="text-gray-600">{customer?.email || 'No email'}</div>
                  <div className="text-gray-600">{customer?.phone || 'No phone'}</div>
                  {customer?.company && (
                    <div className="text-gray-600">{customer.company}</div>
                  )}
                  {customer?.address && (
                    <div className="text-gray-600 text-xs">{customer.address}</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  Resend Proposal
                </Button>
                
                <div className="text-xs text-gray-500 text-center mt-4 p-2 bg-green-50 rounded">
                  <strong>Email Tracking Active:</strong><br/>
                  Tracking pixels are embedded in proposal emails.<br/>
                  Status updates automatically when emails are opened.
                </div>
              </CardContent>
            </Card>

            {/* Send Message */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Send Message</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="messageType">Message Type</Label>
                  <select
                    id="messageType"
                    value={messageType}
                    onChange={(e) => setMessageType(e.target.value)}
                    className="w-full mt-1 p-2 border rounded-md"
                  >
                    <option value="email">Email</option>
                    <option value="note">Internal Note</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    rows={4}
                  />
                </div>
                
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send {messageType === 'email' ? 'Email' : 'Note'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}