import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Calendar, Clock, MapPin, Users, Mail, Phone, ArrowRight, Sparkles } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface ProposalData {
  id: string;
  title: string;
  content: string;
  totalAmount: string;
  depositAmount?: string;
  status: string;
  validUntil?: string;
  eventType?: string;
  eventDate?: string;
  startTime?: string;
  endTime?: string;
  guestCount?: number;
  customer?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    company?: string;
  };
  venue?: {
    name: string;
    description?: string;
  };
  space?: {
    name: string;
    description?: string;
  };
  services?: Array<{
    name: string;
    description?: string;
    price: string;
  }>;
}

export default function ProposalView() {
  const [location] = useLocation();
  const [isAccepting, setIsAccepting] = useState(false);
  const proposalId = location.split('/').pop();
  
  // View tracking is now automatic in the API endpoint

  const { data: proposal, isLoading, error } = useQuery({
    queryKey: ["/api/proposals/public", proposalId],
    queryFn: () => apiRequest("GET", `/api/proposals/public/${proposalId}`),
    enabled: !!proposalId,
  });

  const acceptProposalMutation = useMutation({
    mutationFn: async () => {
      if (!proposal?.id) throw new Error("No proposal ID");
      return apiRequest("POST", `/api/proposals/${proposal.id}/accept`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/proposals/view", proposalId] });
      // Redirect to payment page (we'll implement this later)
      window.location.href = `/proposal/${proposalId}/payment`;
    }
  });

  const handleAcceptProposal = () => {
    setIsAccepting(true);
    acceptProposalMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Proposal Not Found</h1>
          <p className="text-gray-600">The proposal you're looking for doesn't exist or may have expired.</p>
        </div>
      </div>
    );
  }

  const eventDate = proposal.eventDate ? new Date(proposal.eventDate) : null;
  const validUntil = proposal.validUntil ? new Date(proposal.validUntil) : null;
  const isExpired = validUntil && validUntil < new Date();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-24">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span className="text-white text-sm font-medium">Exclusive Event Proposal</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
              {proposal.title || "Your Event Proposal"}
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-8">
              We've crafted a personalized experience designed to make your event extraordinary.
            </p>
            {!isExpired && proposal.status !== 'accepted' && (
              <Button 
                onClick={handleAcceptProposal}
                disabled={isAccepting || acceptProposalMutation.isPending}
                className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                {isAccepting || acceptProposalMutation.isPending ? (
                  <>
                    <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    Accept Proposal
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Status Banner */}
      {proposal.status === 'accepted' && (
        <div className="bg-green-50 border-b border-green-200">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-center gap-2 text-green-700">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Proposal Accepted - Payment Processing Available</span>
            </div>
          </div>
        </div>
      )}

      {isExpired && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-center gap-2 text-amber-700">
              <Clock className="w-5 h-5" />
              <span className="font-medium">This proposal has expired. Please contact us for an updated quote.</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Event Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Event Information Card */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Event Details</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {eventDate && (
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Event Date</p>
                        <p className="font-semibold text-gray-900">
                          {eventDate.toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                    </div>
                  )}

                  {proposal.startTime && proposal.endTime && (
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <Clock className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Event Time</p>
                        <p className="font-semibold text-gray-900">
                          {proposal.startTime} - {proposal.endTime}
                        </p>
                      </div>
                    </div>
                  )}

                  {proposal.venue && (
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Venue</p>
                        <p className="font-semibold text-gray-900">{proposal.venue.name}</p>
                        {proposal.space && (
                          <p className="text-sm text-gray-600">{proposal.space.name}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {proposal.guestCount && (
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                        <Users className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Guest Count</p>
                        <p className="font-semibold text-gray-900">{proposal.guestCount} guests</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Proposal Content */}
            {proposal.content && (
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Proposal Details</h2>
                  <div 
                    className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: proposal.content }}
                  />
                </CardContent>
              </Card>
            )}

            {/* Services */}
            {proposal.services && proposal.services.length > 0 && (
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Included Services</h2>
                  <div className="space-y-4">
                    {proposal.services.map((service, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <h3 className="font-semibold text-gray-900">{service.name}</h3>
                          {service.description && (
                            <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">${service.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Investment Summary */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-purple-50 sticky top-6">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Investment Summary</h3>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Investment</span>
                    <span className="text-2xl font-bold text-gray-900">
                      ${parseFloat(proposal.totalAmount).toLocaleString()}
                    </span>
                  </div>
                  
                  {proposal.depositAmount && (
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                      <span className="text-gray-600">Required Deposit</span>
                      <span className="text-lg font-semibold text-blue-600">
                        ${parseFloat(proposal.depositAmount).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                {validUntil && (
                  <div className="mb-6">
                    <p className="text-sm text-gray-500 mb-2">Proposal Valid Until</p>
                    <p className="font-semibold text-gray-900">
                      {validUntil.toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </p>
                  </div>
                )}

                <Separator className="my-6" />

                {!isExpired && proposal.status !== 'accepted' && (
                  <Button 
                    onClick={handleAcceptProposal}
                    disabled={isAccepting || acceptProposalMutation.isPending}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {isAccepting || acceptProposalMutation.isPending ? (
                      <>
                        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        Accept & Continue to Payment
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                )}

                {proposal.status === 'accepted' && (
                  <Badge className="w-full justify-center py-3 bg-green-100 text-green-800 text-base">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Proposal Accepted
                  </Badge>
                )}
              </CardContent>
            </Card>

            {/* Contact Information */}
            {proposal.customer && (
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Contact Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-700">{proposal.customer.email}</span>
                    </div>
                    {proposal.customer.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-700">{proposal.customer.phone}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h3 className="text-2xl font-bold mb-4">Venuine Events</h3>
          <p className="text-gray-400 mb-6">Creating memorable experiences, one event at a time</p>
          <div className="flex justify-center gap-6 text-sm text-gray-400">
            <span>Professional Event Management</span>
            <span>•</span>
            <span>Trusted by thousands</span>
            <span>•</span>
            <span>Excellence guaranteed</span>
          </div>
        </div>
      </footer>
    </div>
  );
}