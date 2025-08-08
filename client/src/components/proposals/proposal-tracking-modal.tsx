import { useState } from "react";
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

  // Fetch proposal details
  const { data: proposal, isLoading } = useQuery({
    queryKey: [`/api/proposals/${proposalId}`],
    enabled: !!proposalId && open
  });

  // Fetch communications
  const { data: communications = [] } = useQuery({
    queryKey: [`/api/proposals/${proposalId}/communications`],
    enabled: !!proposalId && open
  });

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

  if (isLoading) {
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

  if (!proposal) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Proposal Tracking: {proposal.title}
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
                      {proposal.sentAt ? format(new Date(proposal.sentAt), "MMM d") : "Not sent"}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className={`rounded-full p-3 w-12 h-12 mx-auto mb-2 flex items-center justify-center ${
                      proposal.emailOpened ? 'bg-purple-100' : 'bg-gray-100'
                    }`}>
                      <Eye className={`h-6 w-6 ${proposal.emailOpened ? 'text-purple-600' : 'text-gray-400'}`} />
                    </div>
                    <div className="text-sm font-medium">Opened</div>
                    <div className="text-xs text-gray-500">
                      {proposal.emailOpenedAt ? format(new Date(proposal.emailOpenedAt), "MMM d") : "Not opened"}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className={`rounded-full p-3 w-12 h-12 mx-auto mb-2 flex items-center justify-center ${
                      proposal.status === 'accepted' ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <CheckCircle2 className={`h-6 w-6 ${proposal.status === 'accepted' ? 'text-green-600' : 'text-gray-400'}`} />
                    </div>
                    <div className="text-sm font-medium">Accepted</div>
                    <div className="text-xs text-gray-500">
                      {proposal.status === 'accepted' ? format(new Date(proposal.viewedAt), "MMM d") : "Pending"}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className={`rounded-full p-3 w-12 h-12 mx-auto mb-2 flex items-center justify-center ${
                      proposal.depositPaid ? 'bg-emerald-100' : 'bg-gray-100'
                    }`}>
                      <CreditCard className={`h-6 w-6 ${proposal.depositPaid ? 'text-emerald-600' : 'text-gray-400'}`} />
                    </div>
                    <div className="text-sm font-medium">Paid</div>
                    <div className="text-xs text-gray-500">
                      {proposal.depositPaidAt ? format(new Date(proposal.depositPaidAt), "MMM d") : "Not paid"}
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <Badge className={getStatusColor(proposal.status)}>
                      {getStatusIcon(proposal.status)}
                      <span className="ml-1">{proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}</span>
                    </Badge>
                    <div className="text-sm text-gray-600">
                      Created {format(new Date(proposal.createdAt), "MMM d, yyyy")}
                    </div>
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
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>{proposal.eventDate ? format(new Date(proposal.eventDate), "MMMM d, yyyy") : "Date TBD"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>{proposal.startTime} - {proposal.endTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span>{proposal.guestCount} guests</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>Venue & Space details</span>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Amount</span>
                    <span className="font-medium">${parseFloat(proposal.totalAmount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Required Deposit</span>
                    <span className="font-medium">${parseFloat(proposal.depositAmount).toFixed(2)}</span>
                  </div>
                  {proposal.depositPaid && (
                    <div className="flex justify-between text-emerald-600">
                      <span>✓ Deposit Paid</span>
                      <span className="font-medium">
                        {format(new Date(proposal.depositPaidAt), "MMM d, yyyy")}
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
                            {format(new Date(comm.createdAt), "MMM d, h:mm a")}
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
                  <div className="font-medium">{proposal.customer?.name}</div>
                  <div className="text-gray-600">{proposal.customer?.email}</div>
                  <div className="text-gray-600">{proposal.customer?.phone}</div>
                  {proposal.customer?.company && (
                    <div className="text-gray-600">{proposal.customer.company}</div>
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
                {!proposal.depositPaid && proposal.status === 'accepted' && (
                  <Button
                    onClick={() => processDepositMutation.mutate()}
                    disabled={processDepositMutation.isPending}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Process Deposit Payment
                  </Button>
                )}
                
                <Button variant="outline" className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  View Full Proposal
                </Button>
                
                <Button variant="outline" className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  Resend Proposal
                </Button>
                
                {proposal.status === 'accepted' && (
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Convert to Booking
                  </Button>
                )}
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