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
  Users,
  Paperclip,
  X,
  ChevronDown,
  ChevronRight,
  MessageCircle,
  Shield
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
  message?: string;
  createdAt: string;
  sentAt?: string;
  sentBy?: string;
  sender?: string;
  recipient?: string;
  status?: string;
  deliveredAt?: string;
  attachments?: Array<{
    name: string;
    size?: number;
  }>;
  openCount?: number;
  lastOpenedAt?: string;
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
  const [emailSubject, setEmailSubject] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [expandedComms, setExpandedComms] = useState<Set<string>>(new Set());


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

  // Find related events - with precise matching to avoid mixing up different proposals
  const relatedEvents = proposal ? (() => {
    console.log('=== PROPOSAL EVENT MATCHING DEBUG ===');
    console.log('Proposal ID:', proposal.id);
    console.log('Proposal Title:', proposal.title);
    console.log('Proposal Customer ID:', proposal.customerId);

    console.log('Proposal Sent At:', proposal.sentAt);
    console.log('Total Bookings Available:', bookings.length);
    
    // For direct proposals with event data embedded in the proposal
    if (proposal.eventDate && proposal.guestCount) {
      console.log('Using embedded event data from proposal');
      return [{
        id: `proposal-event-${proposal.id}`,
        eventName: proposal.title ? proposal.title.replace(/^Proposal for\s+/i, '') : 'Untitled Event',
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
        notes: `Proposal: ${proposal.title || 'Untitled'}`
      }];
    }

    // FIRST: Try direct proposal ID matching (most reliable)
    const directMatch = bookings.filter(booking => booking.proposalId === proposal.id);
    console.log('Direct proposalId matches:', directMatch.length);
    if (directMatch.length > 0) {
      console.log('Found direct proposal ID match:', directMatch.map(b => ({id: b.id, eventName: b.eventName})));
      return directMatch.flatMap((booking) => {
        if (booking.contractEvents && booking.contractEvents.length > 0) {
          console.log('Returning contract events for direct match:', booking.contractEvents.length);
          return booking.contractEvents;
        }
        return [booking];
      });
    }

    // SECOND: Skip bookingId check as this field doesn't exist in current schema

    // THIRD: For proposals created from booking flow - precise time-based matching
    if (proposal.sentAt) {
      const proposalTime = new Date(proposal.sentAt).getTime();
      console.log('Trying time-based matching for proposal sent at:', proposalTime);
      
      // Find bookings that were created at the exact same time as this proposal was sent
      const timeMatchedBookings = bookings.filter((booking) => {
        // Must be same customer
        if (booking.customerId !== proposal.customerId) return false;
        
        // Must have proposal status and timestamp
        if (booking.proposalStatus !== 'sent' || !booking.proposalSentAt) return false;
        
        const bookingProposalTime = new Date(booking.proposalSentAt).getTime();
        const timeDiff = Math.abs(proposalTime - bookingProposalTime);
        
        console.log(`Checking booking ${booking.eventName}: time diff = ${timeDiff}ms`);
        
        // Very tight window - only 5 seconds to ensure precision
        return timeDiff < 5000;
      });
      
      console.log('Time-based matches:', timeMatchedBookings.length);
      if (timeMatchedBookings.length > 0) {
        console.log('Found time-based matches:', timeMatchedBookings.map(b => ({id: b.id, eventName: b.eventName})));
        return timeMatchedBookings.flatMap((booking) => {
          if (booking.contractEvents && booking.contractEvents.length > 0) {
            console.log('Returning contract events for time match:', booking.contractEvents.length);
            return booking.contractEvents;
          }
          return [booking];
        });
      }
    }

    // FOURTH: No fallback matching to prevent mixing up different proposals
    console.log('No precise matches found - returning empty array');
    return [];
  })() : [];

  // Get customer
  const customer = proposal ? customers.find((c) => c.id === proposal.customerId) : null;

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: any) => {
      const formData = new FormData();
      formData.append('type', data.type);
      formData.append('direction', data.direction);
      if (data.subject) formData.append('subject', data.subject);
      formData.append('content', data.content);
      formData.append('customerId', data.customerId);
      
      // Add attachments
      attachments.forEach((file, index) => {
        formData.append('attachments', file);
      });
      
      const response = await fetch(`/api/proposals/${proposalId}/communications`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Message Sent",
        description: "Your message has been sent to the customer"
      });
      setNewMessage("");
      setEmailSubject("");
      setAttachments([]);
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

  // Resend proposal mutation
  const resendProposalMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/proposals/${proposalId}/resend`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Proposal Resent",
        description: "The proposal has been resent to the customer with updated event details"
      });
      queryClient.invalidateQueries({ queryKey: [`/api/proposals/${proposalId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/proposals/${proposalId}/communications`] });
    },
    onError: (error: any) => {
      console.error('Resend proposal error:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to resend proposal. Please check server logs.",
        variant: "destructive"
      });
    }
  });

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    sendMessageMutation.mutate({
      type: messageType,
      direction: 'outbound',
      subject: messageType === 'email' ? emailSubject || 'Follow-up on your event proposal' : null,
      content: newMessage,
      customerId: proposal?.customerId
    });
  };

  const handleFileAttachment = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setAttachments(prev => [...prev, ...Array.from(files)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleResendProposal = () => {
    resendProposalMutation.mutate();
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
            <span>{proposal.title || 'Untitled Event'}</span>
            <Badge variant={proposal.status === 'sent' ? 'default' : 'secondary'}>
              {proposal.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-3 space-y-6">
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
                    <div className={`w-3 h-3 rounded-full ${proposal.status === 'viewed' ? 'bg-blue-500' : 'bg-gray-300'}`} />
                    <div>
                      <div className="text-sm font-medium">Viewed</div>
                      <div className="text-xs text-gray-500">
                        {proposal.viewedAt ? format(new Date(proposal.viewedAt), "MMM d, h:mm a") : 'Not viewed'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${proposal.status === 'accepted' ? 'bg-purple-500' : 'bg-gray-300'}`} />
                    <div>
                      <div className="text-sm font-medium">Accepted</div>
                      <div className="text-xs text-gray-500">
                        {proposal.status === 'accepted' ? 'Accepted' : 'Not accepted'}
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
                  <div className="text-xs text-blue-600">
                    Status: {proposal.status === 'sent' ? 'Waiting for customer to view' : 
                            proposal.status === 'viewed' ? 'Customer has viewed the proposal' :
                            proposal.status === 'accepted' ? 'Proposal accepted - ready for payment!' :
                            proposal.status === 'declined' ? 'Proposal declined' : 
                            proposal.depositPaid ? 'Paid' : 'Draft'}
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
                    <span className="font-medium">${parseFloat(
                      relatedEvents.length > 0 && relatedEvents[0].totalAmount 
                        ? relatedEvents[0].totalAmount 
                        : proposal.totalAmount || '0'
                    ).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Required Deposit</span>
                    <span className="font-medium">${(() => {
                      const currentTotal = relatedEvents.length > 0 && relatedEvents[0].totalAmount 
                        ? relatedEvents[0].totalAmount 
                        : proposal.totalAmount || '0';
                      const currentDeposit = (parseFloat(currentTotal) * 0.3).toString();
                      return parseFloat(currentDeposit).toFixed(2);
                    })()}</span>
                  </div>
                  {/* Show pricing update indicator if amounts have changed */}
                  {(() => {
                    const currentTotal = relatedEvents.length > 0 && relatedEvents[0].totalAmount 
                      ? relatedEvents[0].totalAmount 
                      : proposal.totalAmount || '0';
                    const originalTotal = proposal.totalAmount || '0';
                    const hasChanged = currentTotal !== originalTotal;
                    
                    return hasChanged ? (
                      <div className="bg-blue-50 p-2 rounded-lg border border-blue-200">
                        <div className="text-xs text-blue-600 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Pricing updated from original proposal (was ${parseFloat(originalTotal).toFixed(2)})
                        </div>
                      </div>
                    ) : null;
                  })()}

                  {/* Resend Indicator */}
                  {communications.filter(c => c.type === 'email' && c.direction === 'outbound' && c.subject?.includes('Proposal')).length > 1 && (
                    <div className="bg-amber-50 p-2 rounded-lg border border-amber-200">
                      <div className="text-xs text-amber-600 flex items-center gap-1">
                        <Send className="h-3 w-3" />
                        Proposal has been resent {communications.filter(c => c.type === 'email' && c.direction === 'outbound' && c.subject?.includes('Proposal')).length - 1} time(s)
                      </div>
                      <div className="text-xs text-amber-500 mt-1">
                        Last resent: {communications
                          .filter(c => c.type === 'email' && c.direction === 'outbound' && c.subject?.includes('Proposal'))
                          .sort((a, b) => new Date(b.sentAt || b.createdAt).getTime() - new Date(a.sentAt || a.createdAt).getTime())[1] // Get second most recent (first resend)
                          ? format(new Date(communications
                            .filter(c => c.type === 'email' && c.direction === 'outbound' && c.subject?.includes('Proposal'))
                            .sort((a, b) => new Date(b.sentAt || b.createdAt).getTime() - new Date(a.sentAt || a.createdAt).getTime())[0].sentAt || 
                            communications
                            .filter(c => c.type === 'email' && c.direction === 'outbound' && c.subject?.includes('Proposal'))
                            .sort((a, b) => new Date(b.sentAt || b.createdAt).getTime() - new Date(a.sentAt || a.createdAt).getTime())[0].createdAt), "MMM d 'at' h:mm a")
                          : 'Unknown'
                        }
                      </div>
                    </div>
                  )}

                  {proposal.depositPaid && (
                    <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                      <div className="flex justify-between text-emerald-700 mb-2">
                        <span className="font-medium">✓ Deposit Paid</span>
                        <span className="font-medium">${parseFloat(proposal.depositAmount || '0').toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-emerald-600 text-sm">
                        <span>Remaining Balance:</span>
                        <span className="font-medium">
                          ${(() => {
                            const currentTotal = relatedEvents.length > 0 && relatedEvents[0].totalAmount 
                              ? relatedEvents[0].totalAmount 
                              : proposal.totalAmount || '0';
                            const paidDeposit = parseFloat(proposal.depositAmount || '0');
                            return (parseFloat(currentTotal) - paidDeposit).toFixed(2);
                          })()}
                        </span>
                      </div>
                      <div className="text-xs text-emerald-600 mt-1">
                        Paid on: {proposal.depositPaidAt && !isNaN(new Date(proposal.depositPaidAt).getTime()) 
                        ? format(new Date(proposal.depositPaidAt), "MMM d, yyyy 'at' h:mm a") 
                        : 'N/A'}
                      </div>
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
                    communications.map((comm) => {
                      const isExpanded = expandedComms.has(comm.id);
                      const toggleExpanded = () => {
                        const newExpanded = new Set(expandedComms);
                        if (isExpanded) {
                          newExpanded.delete(comm.id);
                        } else {
                          newExpanded.add(comm.id);
                        }
                        setExpandedComms(newExpanded);
                      };

                      // Extract preview (first line or 100 chars)
                      // Create a clean preview that strips HTML if present
                      const getCleanPreview = (content: string) => {
                        if (content.includes('<!DOCTYPE html>') || content.includes('<html>')) {
                          try {
                            // Use DOMParser instead of innerHTML to safely parse HTML without script execution
                            const parser = new DOMParser();
                            const doc = parser.parseFromString(content, 'text/html');
                            const cleanText = doc.body?.textContent || doc.body?.innerText || content;
                            return cleanText.length > 100 ? cleanText.substring(0, 100) + '...' : cleanText;
                          } catch (error) {
                            console.warn('Error parsing HTML content:', error);
                            return content.length > 100 ? content.substring(0, 100) + '...' : content;
                          }
                        }
                        return content.length > 100 ? content.substring(0, 100) + '...' : content;
                      };
                      
                      const preview = comm.content ? getCleanPreview(comm.content.split('\n')[0]) : '';

                      return (
                        <div key={comm.id} className={`border-l-4 pl-4 py-3 bg-white hover:bg-gray-50 rounded-r transition-colors ${
                          comm.direction === 'inbound' ? 'border-green-300 bg-green-50' : 'border-blue-300'
                        }`}>
                          {/* Clickable Header */}
                          <div 
                            className="flex items-center justify-between mb-2 cursor-pointer"
                            onClick={toggleExpanded}
                          >
                            <div className="flex items-center gap-2">
                              {/* Expand/Collapse Icon */}
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-gray-400" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                              )}
                              
                              {/* Communication Type Icon */}
                              {comm.type === 'email' && <Mail className="h-4 w-4 text-blue-500" />}
                              {comm.type === 'phone' && <Phone className="h-4 w-4 text-green-500" />}
                              {comm.type === 'note' && <MessageSquare className="h-4 w-4 text-gray-500" />}
                              
                              <span className="font-medium text-sm">
                                {comm.direction === 'outbound' ? 'Sent' : 'Received'}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {comm.type}
                              </Badge>
                              
                              {/* Status indicator for failed emails */}
                              {comm.status === 'failed' && (
                                <Badge variant="destructive" className="text-xs">
                                  Failed
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-col items-end text-xs text-gray-500">
                              <span>
                                {comm.direction === 'outbound' ? 'Sent' : 'Received'}:
                              </span>
                              <span className="font-medium">
                                {comm.sentAt && !isNaN(new Date(comm.sentAt).getTime()) 
                                  ? format(new Date(comm.sentAt), "MMM d, h:mm a")
                                  : comm.createdAt && !isNaN(new Date(comm.createdAt).getTime())
                                    ? format(new Date(comm.createdAt), "MMM d, h:mm a")
                                    : "Unknown"}
                              </span>
                            </div>
                          </div>

                          {/* Subject Line - Always show if exists */}
                          {comm.subject && (
                            <div 
                              className="text-sm font-medium mb-2 cursor-pointer hover:text-blue-600 text-gray-800"
                              onClick={toggleExpanded}
                            >
                              <span className="text-xs text-gray-500 mr-2">Subject:</span>
                              {comm.subject}
                            </div>
                          )}

                          {/* Content Preview/Full */}
                          <div className="text-sm text-gray-600">
                            {isExpanded ? (
                              <div className="space-y-3">
                                {/* Full Message Content */}
                                <div className="bg-gray-50 p-3 rounded border">
                                  <div className="text-xs text-gray-500 mb-2 font-medium">Message Content:</div>
                                  <div className="whitespace-pre-wrap text-gray-800">
                                    {/* Strip HTML from content and show clean text */}
                                    {(() => {
                                      const content = comm.message || comm.content;
                                      
                                      // Check if content contains HTML tags or CSS
                                      if (content.includes('<') && content.includes('>')) {
                                        try {
                                          // Use DOMParser instead of innerHTML to safely parse HTML without script execution
                                          const parser = new DOMParser();
                                          const doc = parser.parseFromString(content, 'text/html');
                                          
                                          // Remove script and style elements
                                          const scripts = doc.querySelectorAll('script, style');
                                          scripts.forEach(el => el.remove());
                                          
                                          // Get clean text content
                                          let cleanText = doc.body?.textContent || doc.body?.innerText || '';
                                          
                                          // Clean up extra whitespace and format nicely
                                          cleanText = cleanText
                                            .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
                                            .replace(/\n\s*\n/g, '\n')  // Remove extra line breaks
                                            .trim();
                                          
                                          // If we successfully extracted readable text, return it
                                          if (cleanText && cleanText.length > 10) {
                                            return cleanText;
                                          }
                                        } catch (error) {
                                          console.warn('Error parsing HTML content:', error);
                                        }
                                      }
                                      
                                      return content;
                                    })()}
                                  </div>
                                </div>

                                {/* Detailed Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                  {/* Sender/Recipient Info */}
                                  <div className="space-y-1">
                                    {comm.direction === 'outbound' ? (
                                      <>
                                        <div><span className="font-medium text-gray-700">From:</span> {comm.sentBy || comm.sender || 'Venue Team'}</div>
                                        <div><span className="font-medium text-gray-700">To:</span> {comm.recipient || 'Customer'}</div>
                                      </>
                                    ) : (
                                      <>
                                        <div><span className="font-medium text-gray-700">From:</span> {comm.sender || comm.sentBy || 'Customer'}</div>
                                        <div><span className="font-medium text-gray-700">To:</span> {comm.recipient || 'Venue Team'}</div>
                                      </>
                                    )}
                                  </div>

                                  {/* Timing & Status */}
                                  <div className="space-y-1">
                                    <div><span className="font-medium text-gray-700">Status:</span> 
                                      <Badge variant={comm.status === 'failed' ? 'destructive' : comm.direction === 'inbound' ? 'secondary' : 'outline'} className="ml-1 text-xs">
                                        {comm.status === 'failed' ? 'Failed' : 
                                         comm.status === 'received' ? 'Received' :
                                         comm.status === 'delivered' ? 'Delivered' :
                                         comm.status || (comm.direction === 'inbound' ? 'Received' : 'Sent')}
                                      </Badge>
                                    </div>
                                    {(comm.sentAt || comm.createdAt) && (
                                      <div><span className="font-medium text-gray-700">
                                        {comm.direction === 'outbound' ? 'Sent' : 'Received'}:</span> {
                                        comm.sentAt 
                                          ? format(new Date(comm.sentAt), "MMM d, yyyy 'at' h:mm a")
                                          : format(new Date(comm.createdAt), "MMM d, yyyy 'at' h:mm a")
                                      }</div>
                                    )}
                                    {comm.direction === 'outbound' && comm.deliveredAt && (
                                      <div><span className="font-medium text-gray-700">Delivered:</span> {format(new Date(comm.deliveredAt), "h:mm a")}</div>
                                    )}
                                  </div>
                                </div>

                                {/* Attachments (only show for outbound communications for security) */}
                                {comm.direction === 'outbound' && comm.attachments && comm.attachments.length > 0 && (
                                  <div className="bg-blue-50 border-blue-200 p-3 rounded border">
                                    <div className="text-xs font-medium mb-2 text-blue-700">
                                      Attachments Sent ({comm.attachments.length}):
                                    </div>
                                    <div className="space-y-1">
                                      {comm.attachments.map((attachment: any, idx: number) => (
                                        <div key={idx} className="flex items-center gap-2 text-xs">
                                          <Paperclip className="h-3 w-3 text-blue-500" />
                                          <span className="text-blue-700">
                                            {attachment.name || `Attachment ${idx + 1}`}
                                          </span>
                                          {attachment.size && (
                                            <span className="text-gray-500">({Math.round(attachment.size / 1024)} KB)</span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Security notice for inbound communications */}
                                {comm.direction === 'inbound' && (
                                  <div className="bg-amber-50 border-amber-200 p-2 rounded border">
                                    <div className="text-xs text-amber-700 flex items-center gap-1">
                                      <Shield className="h-3 w-3" />
                                      Customer attachments are not displayed for security reasons
                                    </div>
                                  </div>
                                )}

                                {/* Email tracking info for outbound emails */}
                                {comm.direction === 'outbound' && comm.type === 'email' && (
                                  <div className="bg-blue-50 p-2 rounded border border-blue-200">
                                    <div className="text-xs text-blue-600">
                                      <Clock className="h-3 w-3 inline mr-1" />
                                      Email tracking: {(comm.openCount || 0) > 0 
                                        ? `Opened ${comm.openCount} time${(comm.openCount || 0) > 1 ? 's' : ''}`
                                        : 'Not yet opened'
                                      }
                                      {comm.lastOpenedAt && (
                                        <span className="block mt-1">
                                          Last opened: {format(new Date(comm.lastOpenedAt), "MMM d 'at' h:mm a")}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div 
                                className="cursor-pointer hover:text-gray-800"
                                onClick={toggleExpanded}
                              >
                                {(() => {
                                  const content = comm.message || comm.content;
                                  let displayContent = preview || content;
                                  
                                  // If content contains HTML, extract clean text for preview
                                  if (displayContent && displayContent.includes('<') && displayContent.includes('>')) {
                                    try {
                                      const tempDiv = document.createElement('div');
                                      tempDiv.innerHTML = displayContent;
                                      const scripts = tempDiv.querySelectorAll('script, style');
                                      scripts.forEach(el => el.remove());
                                      const cleanText = tempDiv.textContent || tempDiv.innerText || '';
                                      displayContent = cleanText.replace(/\s+/g, ' ').trim();
                                    } catch (error) {
                                      // Fallback to original content if parsing fails
                                    }
                                  }
                                  
                                  const truncated = displayContent?.substring(0, 100) + (displayContent?.length > 100 ? '...' : '');
                                  return truncated;
                                })()}
                                {(comm.message || comm.content) && (comm.message || comm.content).length > 100 && (
                                  <span className="text-blue-500 ml-1 text-xs">Click to expand</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Customer & Communication */}
          <div className="lg:col-span-2 space-y-6">
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
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleResendProposal}
                  disabled={resendProposalMutation.isPending}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {resendProposalMutation.isPending ? 'Sending...' : 'Resend Proposal'}
                </Button>


              </CardContent>
            </Card>

            {/* Enhanced Communication Section */}
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Customer Communication
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Message Type Selection */}
                <div>
                  <Label htmlFor="messageType">Message Type</Label>
                  <select
                    id="messageType"
                    value={messageType}
                    onChange={(e) => {
                      setMessageType(e.target.value);
                      if (e.target.value === 'email') {
                        setShowEmailComposer(true);
                      } else {
                        setShowEmailComposer(false);
                      }
                    }}
                    className="w-full mt-1 p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="email">📧 Email Customer</option>
                    <option value="note">📝 Internal Note</option>
                  </select>
                </div>

                {/* Email Subject (only for emails) */}
                {messageType === 'email' && (
                  <div>
                    <Label htmlFor="emailSubject">Subject Line</Label>
                    <input
                      id="emailSubject"
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="Re: Your Event Proposal"
                      className="w-full mt-1 p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
                
                {/* Message Content */}
                <div>
                  <Label htmlFor="message">
                    {messageType === 'email' ? 'Email Content' : 'Note Content'}
                  </Label>
                  <Textarea
                    id="message"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={messageType === 'email' 
                      ? "Hi [Customer Name],\n\nI wanted to follow up on your event proposal...\n\nBest regards,\nYour Name" 
                      : "Internal note about this proposal..."}
                    rows={messageType === 'email' ? 8 : 4}
                    className="w-full resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {newMessage.length}/2000 characters
                  </div>
                </div>

                {/* File Attachments (only for emails) */}
                {messageType === 'email' && (
                  <div>
                    <Label>File Attachments</Label>
                    <div className="mt-2 space-y-2">
                      <input
                        type="file"
                        multiple
                        onChange={handleFileAttachment}
                        className="hidden"
                        id="file-attachment"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                      />
                      <label
                        htmlFor="file-attachment"
                        className="flex items-center gap-2 p-2 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                      >
                        <Paperclip className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          Click to attach files (PDF, DOC, JPG, PNG)
                        </span>
                      </label>
                      
                      {/* Attachment List */}
                      {attachments.length > 0 && (
                        <div className="space-y-1">
                          {attachments.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-gray-500" />
                                <span className="text-sm text-gray-700">{file.name}</span>
                                <span className="text-xs text-gray-500">
                                  ({(file.size / 1024).toFixed(1)} KB)
                                </span>
                              </div>
                              <button
                                onClick={() => removeAttachment(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Send Button */}
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                  size="lg"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {sendMessageMutation.isPending 
                    ? 'Sending...' 
                    : `Send ${messageType === 'email' ? 'Email' : 'Note'}`
                  }
                </Button>

                {messageType === 'email' && (
                  <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
                    💡 <strong>Tip:</strong> Professional email communication is automatically tracked in the communication history below.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>


    </Dialog>
  );
}