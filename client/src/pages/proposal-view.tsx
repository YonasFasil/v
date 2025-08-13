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
  
  const { data: proposal, isLoading, error } = useQuery({
    queryKey: ["/api/proposals/public", proposalId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/proposals/public/${proposalId}`);
      return response.json();
    },
    enabled: !!proposalId,
  });

  const acceptProposalMutation = useMutation({
    mutationFn: async () => {
      if (!proposal?.id) throw new Error("No proposal ID");
      const response = await apiRequest("POST", `/api/proposals/${proposal.id}/accept`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/proposals/public", proposalId] });
      window.location.href = `/proposal/${proposalId}/payment`;
    }
  });

  const handleAcceptProposal = () => {
    setIsAccepting(true);
    acceptProposalMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30 flex items-center justify-center">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br from-purple-400/20 to-pink-400/20 blur-3xl"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 rounded-full bg-gradient-to-br from-blue-400/20 to-cyan-400/20 blur-3xl"></div>
        <div className="absolute -bottom-40 right-1/3 w-64 h-64 rounded-full bg-gradient-to-br from-amber-400/20 to-orange-400/20 blur-3xl"></div>
      </div>

      {/* Hero Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
        
        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-16">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-full px-5 py-2.5 mb-8 shadow-sm">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-gray-700 text-sm font-medium">Venuine Events</span>
              <Badge variant="secondary" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">Premium</Badge>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-6 tracking-tight leading-tight">
              {proposal.title || "Your Event Proposal"}
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-12 font-light leading-relaxed">
              A bespoke event experience crafted exclusively for you, with every detail thoughtfully curated to exceed your expectations.
            </p>
            
            {!isExpired && proposal.status !== 'accepted' && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button 
                  onClick={handleAcceptProposal}
                  disabled={isAccepting || acceptProposalMutation.isPending}
                  size="lg"
                  className="group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-10 py-4 rounded-full font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
                >
                  {isAccepting || acceptProposalMutation.isPending ? (
                    <>
                      <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                      Accept This Proposal
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
                
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="text-sm">Total Investment:</span>
                  <span className="text-2xl font-bold text-gray-900">${proposal.totalAmount}</span>
                </div>
              </div>
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
      <div className="relative max-w-7xl mx-auto px-6 py-20">
        {proposal.eventDates && proposal.eventDates.length > 0 && (
          <div className="space-y-20">
            {proposal.eventDates.map((eventDate, index) => (
              <div key={index} className="space-y-12">
                <Card className="group border-0 shadow-2xl bg-white/90 backdrop-blur-xl hover:bg-white/95 transition-all duration-500 overflow-hidden">
                  <CardContent className="p-0">
                    {/* Elegant Header with Event Number */}
                    <div className="bg-gradient-to-r from-slate-900 via-gray-900 to-slate-900 p-12 text-white relative overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)]"></div>
                      <div className="relative z-10 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-4 mb-4">
                            {proposal.eventDates.length > 1 && (
                              <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 border border-white/30">
                                <span className="text-sm font-medium text-white">Day {index + 1} of {proposal.eventDates.length}</span>
                              </div>
                            )}
                          </div>
                          <h2 className="text-4xl font-light mb-2 tracking-wide">
                            {proposal.eventDates.length > 1 ? `Event Day ${index + 1}` : "Your Event Experience"}
                          </h2>
                          <p className="text-gray-300 text-lg font-light">Meticulously planned, elegantly executed</p>
                        </div>
                        <div className="hidden md:block">
                          <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20">
                            <Sparkles className="w-10 h-10 text-amber-300" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Event Details Grid */}
                    <div className="p-12">
                      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10 mb-16">
                        {/* Date */}
                        <div className="group text-center">
                          <div className="relative">
                            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-xl transition-all duration-300 border-2 border-blue-200/50 shadow-lg">
                              <Calendar className="w-12 h-12 text-blue-600" />
                            </div>
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mb-3 uppercase tracking-widest font-semibold">Date</p>
                          <p className="font-bold text-gray-900 text-xl leading-tight">
                            {new Date(eventDate.date).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              month: 'long', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>

                        {/* Time */}
                        <div className="group text-center">
                          <div className="relative">
                            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-50 via-purple-100 to-violet-100 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-xl transition-all duration-300 border-2 border-purple-200/50 shadow-lg">
                              <Clock className="w-12 h-12 text-purple-600" />
                            </div>
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mb-3 uppercase tracking-widest font-semibold">Time</p>
                          <p className="font-bold text-gray-900 text-xl leading-tight">
                            {eventDate.startTime} - {eventDate.endTime}
                          </p>
                        </div>

                        {/* Venue */}
                        <div className="group text-center">
                          <div className="relative">
                            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-emerald-50 via-emerald-100 to-green-100 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-xl transition-all duration-300 border-2 border-emerald-200/50 shadow-lg">
                              <MapPin className="w-12 h-12 text-emerald-600" />
                            </div>
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mb-3 uppercase tracking-widest font-semibold">Venue</p>
                          <p className="font-bold text-gray-900 text-xl leading-tight">{eventDate.venue}</p>
                          <p className="text-sm text-gray-600 mt-1">{eventDate.space}</p>
                        </div>

                        {/* Guest Count */}
                        <div className="group text-center">
                          <div className="relative">
                            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-orange-50 via-orange-100 to-amber-100 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-xl transition-all duration-300 border-2 border-orange-200/50 shadow-lg">
                              <Users className="w-12 h-12 text-orange-600" />
                            </div>
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mb-3 uppercase tracking-widest font-semibold">Guests</p>
                          <p className="font-bold text-gray-900 text-xl leading-tight">{eventDate.guestCount}</p>
                          <p className="text-sm text-gray-600 mt-1">Expected</p>
                        </div>
                      </div>

                      {/* Package Information */}
                      {eventDate.packageName && (
                        <div className="mb-12">
                          <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 shadow-lg">
                            <CardContent className="p-8">
                              <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center">
                                  <Award className="w-8 h-8 text-amber-600" />
                                </div>
                                <div>
                                  <h3 className="text-xl font-bold text-gray-900 mb-1">Selected Package</h3>
                                  <p className="text-amber-700 font-semibold text-lg">{eventDate.packageName}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      )}

                      {/* Services */}
                      {eventDate.services && eventDate.services.length > 0 && (
                        <div className="mb-12">
                          <div className="flex items-center gap-4 mb-8">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center">
                              <Sparkles className="w-8 h-8 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="text-2xl font-bold text-gray-900">Included Services</h3>
                              <p className="text-gray-600">Professional services tailored to your event</p>
                            </div>
                          </div>
                          
                          <div className="grid md:grid-cols-2 gap-6">
                            {eventDate.services.map((service, serviceIndex) => {
                              const getServiceIcon = (serviceName: string) => {
                                const name = serviceName.toLowerCase();
                                if (name.includes('bar') || name.includes('drink')) return <Utensils className="w-6 h-6" />;
                                if (name.includes('dj') || name.includes('music') || name.includes('sound')) return <Music className="w-6 h-6" />;
                                if (name.includes('photo') || name.includes('camera')) return <Camera className="w-6 h-6" />;
                                if (name.includes('food') || name.includes('catering') || name.includes('cake')) return <ChefHat className="w-6 h-6" />;
                                return <Star className="w-6 h-6" />;
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
                                <Card key={serviceIndex} className={`group bg-gradient-to-br ${getServiceColor(serviceIndex)} border-2 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden`}>
                                  <CardContent className="p-8">
                                    <div className="flex items-start justify-between">
                                      <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-white/70 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                                          {getServiceIcon(service.name)}
                                        </div>
                                        <div>
                                          <h4 className="text-lg font-bold text-gray-900 mb-1">{service.name}</h4>
                                          <p className="text-sm text-gray-600">Professional service</p>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-2xl font-bold text-gray-900">
                                          ${service.price.toLocaleString()}
                                        </p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Total Investment */}
                      <div className="mt-12">
                        <Card className="bg-gradient-to-r from-slate-900 to-gray-900 text-white shadow-2xl overflow-hidden">
                          <CardContent className="p-10">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-2xl font-light mb-2">Total Investment</h3>
                                <p className="text-gray-300">Complete event experience</p>
                              </div>
                              <div className="text-right">
                                <p className="text-5xl font-bold text-white">
                                  ${proposal.totalAmount}
                                </p>
                                {proposal.depositAmount && (
                                  <p className="text-gray-300 mt-2">
                                    Deposit: ${proposal.depositAmount}
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}

        {/* Company Information */}
        {proposal.companyInfo && (
          <div className="mt-20">
            <Card className="bg-gradient-to-br from-white to-gray-50/50 border-0 shadow-xl">
              <CardContent className="p-12">
                <div className="text-center max-w-2xl mx-auto">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="w-10 h-10 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{proposal.companyInfo.name}</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Thank you for considering us for your special event. We're committed to making your celebration extraordinary.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-6 justify-center text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{proposal.companyInfo.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span>{proposal.companyInfo.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>{proposal.companyInfo.email}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}