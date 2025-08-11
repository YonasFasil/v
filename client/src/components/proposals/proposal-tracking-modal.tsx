import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
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

interface Proposal {
  id: string;
  title: string;
  customerId: string;
  totalAmount: string;
  depositAmount?: string;
  status: string;
  sentAt?: string;
  viewedAt?: string;
  emailOpened: boolean;
  emailOpenedAt?: string;
  openCount: number;
  depositPaid: boolean;
  depositPaidAt?: string;
  createdAt: string;
  eventType?: string;
  eventDate?: string;
  startTime?: string;
  endTime?: string;
  guestCount?: number;
  venueId?: string;
  spaceId?: string;
}

interface Booking {
  id: string;
  eventName: string;
  eventType: string;
  customerId: string;
  venueId: string;
  spaceId: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  guestCount: number;
  status: string;
  totalAmount: string;
  notes?: string;
  proposalId?: string;
  proposalStatus?: string;
  proposalSentAt?: string;
  contractEvents?: Booking[];
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
}

interface Venue {
  id: string;
  name: string;
  spaces?: Array<{
    id: string;
    name: string;
  }>;
}

interface Communication {
  id: string;
  type: string;
  direction: string;
  subject?: string;
  content: string;
  createdAt: string;
}

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

  // Fetch proposal details
  const { data: proposal, isLoading, refetch } = useQuery<Proposal>({
    queryKey: [`/api/proposals/${proposalId}`],
    enabled: !!proposalId && open && !proposalId?.startsWith('booking-')
  });

  // Refresh proposal data when modal opens
  useEffect(() => {
    if (open && proposalId && !proposalId?.startsWith('booking-')) {
      refetch();
    }
  }, [open, proposalId, refetch]);

  // Fetch communications
  const { data: communications = [] } = useQuery<Communication[]>({
    queryKey: [`/api/proposals/${proposalId}/communications`],
    enabled: !!proposalId && open
  });

  // Fetch related events/bookings
  const { data: bookings = [] } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
    enabled: !!proposalId && open
  });

  // Fetch customers
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
    enabled: !!proposalId && open
  });

  // Fetch venues
  const { data: venues = [] } = useQuery<Venue[]>({
    queryKey: ["/api/venues-with-spaces"],
    enabled: !!proposalId && open
  });

  // Find related events
  const relatedEvents = proposal ? (() => {
    console.log('Finding related events for proposal:', proposal.id, 'customer:', proposal.customerId);
    console.log('Proposal sentAt:', proposal.sentAt);
    console.log('Available bookings:', bookings.length);
    
    // For direct proposals with event data embedded in the proposal
    if (proposal.eventDate && proposal.guestCount) {
      console.log('Using embedded event data from proposal');
      return [{
        id: `proposal-event-${proposal.id}`,
        eventName: proposal.title,
        eventType: proposal.eventType || 'corporate',
        customerId: proposal.customerId,
        venueId: proposal.venueId || '',
        spaceId: proposal.spaceId || '',
        eventDate: proposal.eventDate,
        startTime: proposal.startTime || '09:00',
        endTime: proposal.endTime || '17:00',
        guestCount: proposal.guestCount,
        status: 'proposal_shared',
        totalAmount: proposal.totalAmount,
        notes: `Proposal: ${proposal.title}`
      }];
    }

    // For proposals created from booking flow - match by timing and customer
    if (proposal.sentAt) {
      const proposalTime = new Date(proposal.sentAt).getTime();
      console.log('Searching for bookings around proposal time:', proposalTime);
      
      const matchedBookings = bookings.filter((booking) => {
        console.log('Checking booking:', booking.eventName, 'customer:', booking.customerId, 'proposalStatus:', booking.proposalStatus, 'proposalSentAt:', booking.proposalSentAt);
        
        // Must be same customer
        if (booking.customerId !== proposal.customerId) return false;
        
        // Direct proposal ID link (if exists)
        if (booking.proposalId === proposal.id) {
          console.log('Found booking with direct proposalId match');
          return true;
        }
        
        // Time-based matching for proposal flow
        if (booking.proposalStatus === 'sent' && booking.proposalSentAt) {
          const bookingProposalTime = new Date(booking.proposalSentAt).getTime();
          const timeDiff = Math.abs(proposalTime - bookingProposalTime);
          console.log('Time difference:', timeDiff, 'ms');
          
          // 60-second window to be more generous
          if (timeDiff < 60000) {
            console.log('Found booking within time window');
            return true;
          }
        }
        
        return false;
      });
      
      console.log('Matched bookings:', matchedBookings.length);
      
      return matchedBookings.flatMap((booking) => {
        if (booking.contractEvents && booking.contractEvents.length > 0) {
          return booking.contractEvents;
        }
        return [booking];
      });
    }

    // Fallback: match by customer and title/name similarity
    console.log('Using fallback matching by customer and name');
    return bookings.filter((booking) => {
      if (booking.customerId !== proposal.customerId) return false;
      
      // Extract event name from proposal title (remove "Proposal for " prefix)
      const proposalEventName = proposal.title.replace(/^Proposal for\s+/i, '');
      return booking.eventName === proposalEventName || booking.eventName === proposal.title;
    }).flatMap((booking) => {
      if (booking.contractEvents && booking.contractEvents.length > 0) {
        return booking.contractEvents;
      }
      return [booking];
    });
  })() : [];

  // Get customer
  const customer = proposal ? customers.find((c) => c.id === proposal.customerId) : null;

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

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    sendMessageMutation.mutate({
      type: messageType,
      direction: 'outbound',
      subject: messageType === 'email' ? 'Follow-up on your event proposal' : null,
      content: newMessage,
      customerId: proposal?.customerId
    });
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            <span className="ml-2">Loading proposal details...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!proposal) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <div className="text-center p-6">
            <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Proposal Not Found</h3>
            <p className="text-gray-500">The proposal you're looking for could not be found.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-blue-500" />
            <span>{proposal.title || proposal.eventName}</span>
            <Badge variant={proposal.status === 'sent' ? 'default' : 'secondary'}>
              {proposal.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Proposal Status & Tracking */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Proposal Status & Tracking</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${proposal.sentAt ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <div>
                      <div className="text-sm font-medium">Sent</div>
                      <div className="text-xs text-gray-500">
                        {proposal.sentAt ? format(new Date(proposal.sentAt), "MMM d, h:mm a") : 'Not sent'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${proposal.emailOpened ? 'bg-blue-500' : 'bg-gray-300'}`} />
                    <div>
                      <div className="text-sm font-medium">Opened</div>
                      <div className="text-xs text-gray-500">
                        {proposal.emailOpenedAt ? format(new Date(proposal.emailOpenedAt), "MMM d, h:mm a") : 'Not opened'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${proposal.status === 'viewed' ? 'bg-purple-500' : 'bg-gray-300'}`} />
                    <div>
                      <div className="text-sm font-medium">Viewed</div>
                      <div className="text-xs text-gray-500">
                        {proposal.viewedAt ? format(new Date(proposal.viewedAt), "MMM d, h:mm a") : 'Not viewed'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${proposal.depositPaid ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                    <div>
                      <div className="text-sm font-medium">Paid</div>
                      <div className="text-xs text-gray-500">
                        {proposal.depositPaidAt ? format(new Date(proposal.depositPaidAt), "MMM d, h:mm a") : 'Not paid'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Eye className="h-4 w-4" />
                    <span className="text-sm font-medium">Email Opens: {proposal.openCount || 0}</span>
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    Status: {proposal.status === 'sent' && !proposal.emailOpened ? 'Waiting for customer to open' : 
                            proposal.status === 'viewed' ? 'Customer has viewed the proposal' :
                            proposal.status === 'accepted' ? 'Proposal accepted!' :
                            proposal.status === 'declined' ? 'Proposal declined' : 'Draft'}
                  </div>
                  <div className="text-xs text-gray-600 mt-2">
                    Created: {format(new Date(proposal.createdAt), "MMM d, yyyy 'at' h:mm a")}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Event Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Event Details</CardTitle>
              </CardHeader>
              <CardContent>
                {relatedEvents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No events found for this proposal</p>
                    <p className="text-sm mt-2">Events may take a moment to appear after sending a proposal</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {relatedEvents.map((event, index) => {
                      const venue = venues.find((v) => v.id === event.venueId);
                      const space = venue?.spaces?.find((s) => s.id === event.spaceId);
                      
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
                    <span className="font-medium">${parseFloat(proposal.totalAmount || '0').toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Required Deposit</span>
                    <span className="font-medium">${parseFloat(proposal.depositAmount || '0').toFixed(2)}</span>
                  </div>
                  {proposal.depositPaid && (
                    <div className="flex justify-between text-emerald-600">
                      <span>✓ Deposit Paid</span>
                      <span className="font-medium">
                        {proposal.depositPaidAt && !isNaN(new Date(proposal.depositPaidAt).getTime()) 
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
                    communications.map((comm) => (
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