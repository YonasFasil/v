import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, CreditCard, Shield, ArrowLeft, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface PaymentCheckoutProps {
  proposalId: string;
  clientSecret: string;
  proposalData: any;
}

function PaymentForm({ proposalId, clientSecret, proposalData }: PaymentCheckoutProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'succeeded' | 'failed'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);
    setPaymentStatus('processing');

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/proposal/${proposalId}/success`,
      },
      redirect: 'if_required'
    });

    if (error) {
      setErrorMessage(error.message || 'An unexpected error occurred');
      setPaymentStatus('failed');
      setIsProcessing(false);
    } else {
      setPaymentStatus('succeeded');
      // Redirect to success page
      window.location.href = `/proposal/${proposalId}/success`;
    }
  };

  if (paymentStatus === 'succeeded') {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
        <p className="text-gray-600">Thank you for your payment. We'll be in touch soon!</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-blue-900">Secure Payment</span>
        </div>
        <p className="text-blue-700 text-sm">
          Your payment is processed securely through Stripe. We never store your payment information.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <PaymentElement />
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">{errorMessage}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        size="lg"
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 rounded-lg shadow-lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5 mr-2" />
            Pay ${proposalData?.totalAmount || '0'}
          </>
        )}
      </Button>
    </form>
  );
}

export default function PaymentCheckout() {
  const [location] = useLocation();
  const proposalId = location.split('/')[2]; // Extract from /proposal/:id/payment
  
  const { data: proposalData, isLoading: proposalLoading } = useQuery({
    queryKey: ["/api/proposals/public", proposalId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/proposals/public/${proposalId}`);
      return response.json();
    },
    enabled: !!proposalId,
  });

  const { data: paymentIntent, isLoading: paymentLoading } = useQuery({
    queryKey: ["/api/create-payment-intent", proposalId],
    queryFn: async () => {
      const response = await apiRequest("POST", "/api/create-payment-intent", {
        proposalId,
        amount: proposalData?.totalAmount || 0,
        connectAccountId: proposalData?.connectAccountId // For Stripe Connect
      });
      return response.json();
    },
    enabled: !!proposalData,
  });

  if (proposalLoading || paymentLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Setting up your payment...</p>
        </div>
      </div>
    );
  }

  if (!proposalData || !paymentIntent?.clientSecret) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Setup Error</h1>
          <p className="text-gray-600 mb-4">Unable to set up payment for this proposal.</p>
          <Button onClick={() => window.history.back()} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#2563eb',
      colorBackground: '#ffffff',
      colorText: '#1f2937',
      colorDanger: '#dc2626',
      fontFamily: 'system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '8px',
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30">
      <div className="max-w-2xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Complete Your Payment</h1>
          <p className="text-gray-600">Secure payment for {proposalData.title}</p>
        </div>

        <div className="grid gap-8">
          {/* Payment Summary */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Payment Summary</span>
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                  Stripe Connect Secure
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Event</span>
                  <span className="font-medium">{proposalData.title}</span>
                </div>
                {proposalData.depositAmount && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Deposit Amount</span>
                    <span className="font-medium">${proposalData.depositAmount}</span>
                  </div>
                )}
                <hr className="my-3" />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Amount</span>
                  <span>${proposalData.totalAmount}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent>
              <Elements 
                stripe={stripePromise} 
                options={{ 
                  clientSecret: paymentIntent.clientSecret,
                  appearance 
                }}
              >
                <PaymentForm 
                  proposalId={proposalId}
                  clientSecret={paymentIntent.clientSecret}
                  proposalData={proposalData}
                />
              </Elements>
            </CardContent>
          </Card>

          {/* Test Card Info */}
          <Card className="shadow-lg border border-yellow-200 bg-yellow-50">
            <CardContent className="p-6">
              <h3 className="font-semibold text-yellow-800 mb-3">Test Payment Instructions</h3>
              <div className="space-y-2 text-sm text-yellow-700">
                <p><strong>Success:</strong> Use card number 4000 0000 0000 0002</p>
                <p><strong>Declined:</strong> Use card number 4000 0000 0000 0341</p>
                <p>Use any future date for expiry and any 3-digit CVC</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}