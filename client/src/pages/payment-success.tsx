import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Calendar, Mail, ArrowRight, Download } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function PaymentSuccess() {
  const [location] = useLocation();
  const proposalId = location.split('/')[2]; // Extract from /proposal/:id/success
  
  const { data: proposalData, isLoading } = useQuery({
    queryKey: ["/api/proposals/public", proposalId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/proposals/public/${proposalId}`);
      return response.json();
    },
    enabled: !!proposalId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50/30">
      {/* Success Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">Payment Successful!</h1>
          <p className="text-xl text-green-100 max-w-2xl mx-auto">
            Thank you for your payment. Your event booking is now confirmed and we're excited to make your event extraordinary.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Confirmation Details */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Booking Confirmed</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Event</p>
                  <p className="font-semibold text-gray-900">{proposalData?.title}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Paid</p>
                  <p className="font-semibold text-gray-900 text-2xl">${proposalData?.totalAmount}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-1">Payment Status</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-600 font-medium">Paid & Confirmed</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">What Happens Next?</h2>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Mail className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Confirmation Email</h3>
                    <p className="text-gray-600 text-sm">You'll receive a detailed confirmation email within the next few minutes with your receipt and event details.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Calendar className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Event Planning</h3>
                    <p className="text-gray-600 text-sm">Our team will contact you within 24 hours to finalize event details and coordinate logistics.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Download className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Documentation</h3>
                    <p className="text-gray-600 text-sm">Contracts and event documentation will be prepared and sent for your review.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Information */}
        <Card className="mt-8 shadow-xl border-0 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Questions? We're Here to Help</h2>
            <p className="text-gray-600 mb-6">
              Our event planning team is ready to assist you with any questions about your upcoming event.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                <Mail className="w-5 h-5 mr-2" />
                Contact Event Team
              </Button>
              <Button variant="outline" size="lg">
                <Calendar className="w-5 h-5 mr-2" />
                View Event Details
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stripe Connect Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Payment processed securely through Stripe Connect
          </p>
        </div>
      </div>
    </div>
  );
}