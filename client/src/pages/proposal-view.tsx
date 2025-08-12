import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Calendar, Clock, MapPin, Users, Mail, Phone, ArrowRight, Sparkles, Star, Award, ChefHat, Music, Camera, Utensils } from "lucide-react";
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
    name: string;
    email: string;
    phone?: string;
  };
  venue?: {
    name: string;
    description?: string;
  };
  space?: {
    name: string;
    description?: string;
  };
  eventDates?: Array<{
    date: string;
    startTime: string;
    endTime: string;
    venue: string;
    space: string;
    guestCount: number;
    packageName?: string;
    services: Array<{
      name: string;
      price: number;
    }>;
  }>;
  companyInfo?: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
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
            
            {/* Event Overview */}
            {proposal.eventDates && proposal.eventDates.length > 0 && (
              <div className="space-y-6">
                {proposal.eventDates.map((eventDate, index) => (
                  <Card key={index} className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm overflow-hidden">
                    <CardContent className="p-0">
                      {/* Event Header */}
                      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 p-8 text-white relative overflow-hidden">
                        <div className="absolute inset-0 bg-black/10"></div>
                        <div className="relative z-10">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                              <Star className="w-6 h-6 text-yellow-300" />
                            </div>
                            <div>
                              <h2 className="text-2xl font-bold">Your Event Experience</h2>
                              <p className="text-blue-100">Carefully curated for your special day</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Event Details Grid */}
                      <div className="p-8">
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                          <div className="group">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                              <Calendar className="w-8 h-8 text-blue-600" />
                            </div>
                            <p className="text-sm text-gray-500 mb-1">Event Date</p>
                            <p className="font-bold text-gray-900 text-lg">
                              {new Date(eventDate.date).toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                          </div>

                          <div className="group">
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                              <Clock className="w-8 h-8 text-purple-600" />
                            </div>
                            <p className="text-sm text-gray-500 mb-1">Event Time</p>
                            <p className="font-bold text-gray-900 text-lg">
                              {eventDate.startTime} - {eventDate.endTime}
                            </p>
                          </div>

                          <div className="group">
                            <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                              <MapPin className="w-8 h-8 text-green-600" />
                            </div>
                            <p className="text-sm text-gray-500 mb-1">Venue</p>
                            <p className="font-bold text-gray-900 text-lg">{eventDate.venue}</p>
                            <p className="text-sm text-gray-600">{eventDate.space}</p>
                          </div>

                          <div className="group">
                            <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                              <Users className="w-8 h-8 text-orange-600" />
                            </div>
                            <p className="text-sm text-gray-500 mb-1">Guest Count</p>
                            <p className="font-bold text-gray-900 text-lg">{eventDate.guestCount}</p>
                            <p className="text-sm text-gray-600">guests</p>
                          </div>
                        </div>

                        {/* Package Information */}
                        {eventDate.packageName && (
                          <div className="mb-8">
                            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-6">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                                  <Award className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                  <h3 className="font-bold text-gray-900">Selected Package</h3>
                                  <p className="text-amber-700 font-semibold">{eventDate.packageName}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Services */}
                        {eventDate.services && eventDate.services.length > 0 && (
                          <div>
                            <div className="flex items-center gap-3 mb-6">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-blue-600" />
                              </div>
                              <h3 className="text-xl font-bold text-gray-900">Included Services</h3>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                              {eventDate.services.map((service, serviceIndex) => {
                                const getServiceIcon = (serviceName: string) => {
                                  const name = serviceName.toLowerCase();
                                  if (name.includes('bar') || name.includes('drink')) return <Utensils className="w-5 h-5" />;
                                  if (name.includes('dj') || name.includes('music') || name.includes('sound')) return <Music className="w-5 h-5" />;
                                  if (name.includes('photo') || name.includes('camera')) return <Camera className="w-5 h-5" />;
                                  if (name.includes('food') || name.includes('catering') || name.includes('cake')) return <ChefHat className="w-5 h-5" />;
                                  return <Star className="w-5 h-5" />;
                                };

                                const getServiceColor = (index: number) => {
                                  const colors = [
                                    'from-blue-50 to-blue-100 border-blue-200 text-blue-700',
                                    'from-purple-50 to-purple-100 border-purple-200 text-purple-700',
                                    'from-green-50 to-green-100 border-green-200 text-green-700',
                                    'from-pink-50 to-pink-100 border-pink-200 text-pink-700',
                                    'from-indigo-50 to-indigo-100 border-indigo-200 text-indigo-700',
                                    'from-orange-50 to-orange-100 border-orange-200 text-orange-700'
                                  ];
                                  return colors[index % colors.length];
                                };

                                return (
                                  <div
                                    key={serviceIndex}
                                    className={`group bg-gradient-to-br ${getServiceColor(serviceIndex)} border rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]`}
                                  >
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white/50 backdrop-blur-sm rounded-full flex items-center justify-center">
                                          {getServiceIcon(service.name)}
                                        </div>
                                        <div>
                                          <h4 className="font-bold text-gray-900">{service.name}</h4>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-2xl font-bold text-gray-900">
                                          ${service.price.toLocaleString()}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Fallback Event Details - if no eventDates array */}
            {(!proposal.eventDates || proposal.eventDates.length === 0) && (
              <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-0">
                  {/* Event Header */}
                  <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 p-8 text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/10"></div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                          <Star className="w-6 h-6 text-yellow-300" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold">Your Event Experience</h2>
                          <p className="text-blue-100">Carefully curated for your special day</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Event Details Grid */}
                  <div className="p-8">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                      {proposal.eventDate && (
                        <div className="group">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                            <Calendar className="w-8 h-8 text-blue-600" />
                          </div>
                          <p className="text-sm text-gray-500 mb-1">Event Date</p>
                          <p className="font-bold text-gray-900 text-lg">
                            {new Date(proposal.eventDate).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      )}

                      {proposal.startTime && proposal.endTime && (
                        <div className="group">
                          <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                            <Clock className="w-8 h-8 text-purple-600" />
                          </div>
                          <p className="text-sm text-gray-500 mb-1">Event Time</p>
                          <p className="font-bold text-gray-900 text-lg">
                            {proposal.startTime} - {proposal.endTime}
                          </p>
                        </div>
                      )}

                      {proposal.venue && (
                        <div className="group">
                          <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                            <MapPin className="w-8 h-8 text-green-600" />
                          </div>
                          <p className="text-sm text-gray-500 mb-1">Venue</p>
                          <p className="font-bold text-gray-900 text-lg">{proposal.venue.name}</p>
                          {proposal.venue.description && (
                            <p className="text-sm text-gray-600">{proposal.venue.description}</p>
                          )}
                        </div>
                      )}

                      {proposal.guestCount && (
                        <div className="group">
                          <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                            <Users className="w-8 h-8 text-orange-600" />
                          </div>
                          <p className="text-sm text-gray-500 mb-1">Guest Count</p>
                          <p className="font-bold text-gray-900 text-lg">{proposal.guestCount}</p>
                          <p className="text-sm text-gray-600">guests</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Proposal Content */}
            {proposal.content && (
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Mail className="w-5 h-5 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Proposal Details</h2>
                  </div>
                  <div 
                    className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: proposal.content }}
                  />
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
            {proposal.companyInfo && (
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Contact Us</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-blue-600" />
                      <span className="text-gray-700">{proposal.companyInfo.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-blue-600" />
                      <span className="text-gray-700">{proposal.companyInfo.phone}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
                      <span className="text-gray-700 leading-relaxed">{proposal.companyInfo.address}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div className="text-center md:text-left">
              <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {proposal.companyInfo?.name || 'Venuine Events'}
              </h3>
              <p className="text-gray-300 leading-relaxed">Creating unforgettable experiences, one event at a time</p>
            </div>
            <div className="text-center">
              <h4 className="text-lg font-semibold mb-4 text-blue-300">Contact Information</h4>
              <div className="space-y-2 text-gray-300">
                <p>{proposal.companyInfo?.phone || '(555) 123-4567'}</p>
                <p>{proposal.companyInfo?.email || 'hello@venuine-events.com'}</p>
              </div>
            </div>
            <div className="text-center md:text-right">
              <h4 className="text-lg font-semibold mb-4 text-blue-300">Location</h4>
              <p className="text-gray-300 leading-relaxed">
                {proposal.companyInfo?.address || '123 Celebration Drive, Event City, EC 12345'}
              </p>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 text-center">
            <p className="text-gray-400 mb-6">Creating memorable experiences, one event at a time</p>
            <div className="flex justify-center gap-6 text-sm text-gray-400">
              <span>Professional Event Management</span>
              <span>•</span>
              <span>Trusted by thousands</span>
              <span>•</span>
              <span>Excellence guaranteed</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}