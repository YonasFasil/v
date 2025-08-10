import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, MapPin, Users, CheckCircle, CreditCard, Download, FileText } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Load Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');

// Payment Form Component
interface PaymentFormProps {
  proposalId: string;
  amount: number;
  onSuccess: () => void;
}

function PaymentForm({ proposalId, amount, onSuccess }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: 'if_required'
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        // Payment succeeded, notify the backend
        await fetch(`/api/proposals/${proposalId}/payment-completed`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentAmount: amount,
            paymentType: 'deposit',
            paymentMethod: 'card',
            transactionId: Date.now().toString()
          }),
        });

        onSuccess();
      }
    } catch (err: any) {
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || processing} 
        className="w-full"
      >
        {processing ? "Processing..." : `Pay $${amount}`}
      </Button>
    </form>
  );
}

interface ProposalData {
  id: string;
  eventName: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  status: 'pending' | 'accepted' | 'declined';
  proposalSentAt: string;
  validUntil: string;
  eventDates: Array<{
    date: string;
    startTime: string;
    endTime: string;
    venue: string;
    space: string;
    guestCount: number;
    packageName?: string;
    services?: Array<{
      name: string;
      price: number;
    }>;
  }>;
  companyInfo: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
}

export default function ProposalView() {
  const [location] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPayment, setShowPayment] = useState(false);
  const [signaturePad, setSignaturePad] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  
  // Extract proposal ID from URL
  const proposalId = location.split('/').pop();

  // Fetch proposal data
  const { data: proposal, isLoading, error } = useQuery<ProposalData>({
    queryKey: ['/api/proposals/view', proposalId],
    enabled: !!proposalId,
  });

  // Accept proposal mutation
  const acceptProposal = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/proposals/${proposal?.id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature: signaturePad })
      });
      if (!response.ok) throw new Error('Failed to accept proposal');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Proposal Accepted!",
        description: "Thank you for accepting our proposal. You can now proceed with payment.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/proposals/view', proposalId] });
      setShowPayment(true);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to accept proposal. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Decline proposal mutation
  const declineProposal = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/proposals/${proposal?.id}/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to decline proposal');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Proposal Declined",
        description: "Thank you for your response. We'll be in touch soon.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/proposals/view', proposalId] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to decline proposal. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Initialize payment when user accepts proposal
  useEffect(() => {
    if (showPayment && proposal && !clientSecret) {
      fetch(`/api/proposals/${proposal.id}/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      .then(res => res.json())
      .then(data => setClientSecret(data.clientSecret))
      .catch(err => {
        toast({
          title: "Payment Error",
          description: "Failed to initialize payment. Please refresh and try again.",
          variant: "destructive"
        });
      });
    }
  }, [showPayment, proposal, clientSecret, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Proposal Not Found</CardTitle>
            <CardDescription>
              The proposal you're looking for doesn't exist or has expired.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const isExpired = new Date() > new Date(proposal.validUntil);
  const isAccepted = proposal.status === 'accepted';
  const isDeclined = proposal.status === 'declined';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{proposal.eventName}</h1>
              <p className="text-lg text-gray-600">Event Proposal for {proposal.customerName}</p>
            </div>
            <div className="text-right">
              <Badge 
                variant={isAccepted ? "default" : isDeclined ? "destructive" : isExpired ? "secondary" : "outline"}
                className="text-sm"
              >
                {isAccepted ? "Accepted" : isDeclined ? "Declined" : isExpired ? "Expired" : "Pending Review"}
              </Badge>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Proposal Sent:</span> {format(new Date(proposal.proposalSentAt), 'MMMM d, yyyy')}
            </div>
            <div>
              <span className="font-medium">Valid Until:</span> {format(new Date(proposal.validUntil), 'MMMM d, yyyy')}
            </div>
            <div>
              <span className="font-medium">Total Investment:</span> 
              <span className="text-2xl font-bold text-green-600 ml-2">${proposal.totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Event Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Event Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {proposal.eventDates.map((eventDate, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="font-medium">Date</p>
                      <p className="text-sm text-gray-600">{format(new Date(eventDate.date), 'MMMM d, yyyy')}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="font-medium">Time</p>
                      <p className="text-sm text-gray-600">{eventDate.startTime} - {eventDate.endTime}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-red-500" />
                    <div>
                      <p className="font-medium">Location</p>
                      <p className="text-sm text-gray-600">{eventDate.venue}</p>
                      <p className="text-xs text-gray-500">{eventDate.space}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-500" />
                    <div>
                      <p className="font-medium">Guests</p>
                      <p className="text-sm text-gray-600">{eventDate.guestCount} people</p>
                    </div>
                  </div>
                </div>
                
                {eventDate.packageName && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="font-medium">Package: {eventDate.packageName}</p>
                  </div>
                )}
                
                {eventDate.services && eventDate.services.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="font-medium mb-2">Additional Services:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {eventDate.services.map((service, serviceIndex) => (
                        <div key={serviceIndex} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                          <span>{service.name}</span>
                          <span className="font-medium">${service.price.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Company Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium">{proposal.companyInfo.name}</h4>
                <p className="text-sm text-gray-600">{proposal.companyInfo.address}</p>
              </div>
              <div>
                <p className="text-sm"><strong>Phone:</strong> {proposal.companyInfo.phone}</p>
                <p className="text-sm"><strong>Email:</strong> {proposal.companyInfo.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        {!isExpired && !isAccepted && !isDeclined && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Proposal Response</CardTitle>
              <CardDescription>
                Please review the proposal details above and let us know your decision.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Digital Signature</label>
                <input
                  type="text"
                  placeholder="Type your full name to sign"
                  value={signaturePad}
                  onChange={(e) => setSignaturePad(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  By typing your name above, you agree to the terms and conditions outlined in this proposal.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={() => acceptProposal.mutate()}
                  disabled={!signaturePad.trim() || acceptProposal.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {acceptProposal.isPending ? "Accepting..." : "Accept Proposal"}
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => declineProposal.mutate()}
                  disabled={declineProposal.isPending}
                  className="flex-1"
                >
                  {declineProposal.isPending ? "Declining..." : "Decline Proposal"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Section */}
        {isAccepted && showPayment && clientSecret && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Secure Payment
              </CardTitle>
              <CardDescription>
                Complete your booking by making a secure payment below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <PaymentForm 
                  proposalId={proposal.id}
                  amount={proposal.totalAmount}
                  onSuccess={() => {
                    toast({
                      title: "Payment Successful!",
                      description: "Your booking is confirmed. You'll receive a confirmation email shortly.",
                    });
                    setShowPayment(false);
                  }}
                />
              </Elements>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button variant="outline" className="flex-1">
                <FileText className="h-4 w-4 mr-2" />
                Print Proposal
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

