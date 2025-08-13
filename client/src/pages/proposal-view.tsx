import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Calendar, Clock, MapPin, Users, Mail, Phone, ArrowRight, Sparkles, Star, Award, ChefHat, Music, Camera, Utensils, Settings, FileText } from "lucide-react";
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
                <Card className="border border-slate-200 shadow-sm bg-white">
                  <CardContent className="p-0">
                    {/* Professional Header */}
                    <div className="bg-slate-50 border-b border-slate-200 px-8 py-6">
                      <div className="flex items-center justify-between">
                        <div>
                          {proposal.eventDates.length > 1 && (
                            <div className="inline-flex items-center gap-2 bg-slate-200 text-slate-700 px-3 py-1 rounded-md text-sm font-medium mb-3">
                              <span>Day {index + 1} of {proposal.eventDates.length}</span>
                            </div>
                          )}
                          <h2 className="text-2xl font-semibold text-slate-900 mb-1">
                            {proposal.eventDates.length > 1 ? `Event Day ${index + 1}` : "Event Details"}
                          </h2>
                          <p className="text-slate-600">Complete breakdown of services and pricing</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-500">Total for this date</p>
                          <p className="text-2xl font-bold text-slate-900">${eventDate.totalAmount?.toLocaleString() || '0'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Event Information Grid - Professional & Compact */}
                    <div className="p-8">
                      <div className="grid md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-4 h-4 text-slate-600" />
                            <span className="text-sm font-medium text-slate-600 uppercase tracking-wide">Date</span>
                          </div>
                          <p className="text-base font-semibold text-slate-900">
                            {new Date(eventDate.date).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              month: 'long', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>

                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-slate-600" />
                            <span className="text-sm font-medium text-slate-600 uppercase tracking-wide">Time</span>
                          </div>
                          <p className="text-base font-semibold text-slate-900">
                            {eventDate.startTime} - {eventDate.endTime}
                          </p>
                        </div>

                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="w-4 h-4 text-slate-600" />
                            <span className="text-sm font-medium text-slate-600 uppercase tracking-wide">Location</span>
                          </div>
                          <p className="text-base font-semibold text-slate-900">{eventDate.venue?.name || eventDate.venue}</p>
                          <p className="text-sm text-slate-600">{eventDate.space?.name || eventDate.space}</p>
                          {eventDate.space?.capacity && (
                            <p className="text-xs text-slate-500 mt-1">Max capacity: {eventDate.space.capacity}</p>
                          )}
                        </div>

                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="w-4 h-4 text-slate-600" />
                            <span className="text-sm font-medium text-slate-600 uppercase tracking-wide">Guests</span>
                          </div>
                          <p className="text-base font-semibold text-slate-900">{eventDate.guestCount}</p>
                          <p className="text-sm text-slate-600">Expected attendees</p>
                        </div>
                      </div>

                      {/* Package Details */}
                      {eventDate.packageDetails && (
                        <div className="mb-8">
                          <div className="border border-slate-200 rounded-lg">
                            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Award className="w-5 h-5 text-slate-600" />
                                  <h3 className="text-lg font-semibold text-slate-900">Package: {eventDate.packageDetails.name}</h3>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-slate-500">{eventDate.packageDetails.pricingModel === 'per_person' ? 'Per Person' : 'Fixed Price'}</p>
                                  <p className="text-lg font-bold text-slate-900">${eventDate.packageDetails.price.toLocaleString()}</p>
                                </div>
                              </div>
                            </div>
                            <div className="p-6">
                              {eventDate.packageDetails.description && (
                                <p className="text-slate-600 mb-4">{eventDate.packageDetails.description}</p>
                              )}
                              {eventDate.packageDetails.category && (
                                <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-3 py-1 rounded-md text-sm font-medium mb-4">
                                  <span>{eventDate.packageDetails.category}</span>
                                </div>
                              )}
                              {eventDate.packageDetails.services && eventDate.packageDetails.services.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-semibold text-slate-700 mb-3">Included Services:</h4>
                                  <div className="grid md:grid-cols-2 gap-2">
                                    {eventDate.packageDetails.services.map((serviceId, idx) => (
                                      <div key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                                        <span>Service ID: {serviceId}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Setup Style Information */}
                      {eventDate.setupStyle && (
                        <div className="mb-8">
                          <div className="border border-slate-200 rounded-lg">
                            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
                              <div className="flex items-center gap-3">
                                <Settings className="w-5 h-5 text-slate-600" />
                                <h3 className="text-lg font-semibold text-slate-900">Setup Style: {eventDate.setupStyle.name}</h3>
                              </div>
                            </div>
                            <div className="p-6">
                              {eventDate.setupStyle.description && (
                                <p className="text-slate-600 mb-4">{eventDate.setupStyle.description}</p>
                              )}
                              <div className="grid md:grid-cols-3 gap-4">
                                <div>
                                  <p className="text-sm font-medium text-slate-700">Category</p>
                                  <p className="text-slate-600">{eventDate.setupStyle.category}</p>
                                </div>
                                {eventDate.setupStyle.capacity?.min && (
                                  <div>
                                    <p className="text-sm font-medium text-slate-700">Min Capacity</p>
                                    <p className="text-slate-600">{eventDate.setupStyle.capacity.min} guests</p>
                                  </div>
                                )}
                                {eventDate.setupStyle.capacity?.max && (
                                  <div>
                                    <p className="text-sm font-medium text-slate-700">Max Capacity</p>
                                    <p className="text-slate-600">{eventDate.setupStyle.capacity.max} guests</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Additional Services */}
                      {eventDate.services && eventDate.services.length > 0 && (
                        <div className="mb-8">
                          <div className="border border-slate-200 rounded-lg">
                            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
                              <div className="flex items-center gap-3">
                                <Sparkles className="w-5 h-5 text-slate-600" />
                                <h3 className="text-lg font-semibold text-slate-900">Additional Services</h3>
                              </div>
                            </div>
                            <div className="p-6">
                              <div className="space-y-4">
                                {eventDate.services.map((service, serviceIndex) => (
                                  <div key={serviceIndex} className="border border-slate-100 rounded-lg p-4">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                                            <Star className="w-4 h-4 text-slate-600" />
                                          </div>
                                          <h4 className="text-base font-semibold text-slate-900">{service.name}</h4>
                                        </div>
                                        {service.description && (
                                          <p className="text-sm text-slate-600 mb-3 ml-11">{service.description}</p>
                                        )}
                                        <div className="flex items-center gap-6 ml-11">
                                          {service.category && (
                                            <div className="inline-flex items-center gap-1 text-xs text-slate-500">
                                              <span>Category:</span>
                                              <span className="font-medium">{service.category}</span>
                                            </div>
                                          )}
                                          {service.duration && (
                                            <div className="inline-flex items-center gap-1 text-xs text-slate-500">
                                              <span>Duration:</span>
                                              <span className="font-medium">{service.duration}</span>
                                            </div>
                                          )}
                                          <div className="inline-flex items-center gap-1 text-xs text-slate-500">
                                            <span>Pricing:</span>
                                            <span className="font-medium">{service.pricingModel === 'per_hour' ? 'Per Hour' : service.pricingModel === 'per_person' ? 'Per Person' : 'Fixed Price'}</span>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-lg font-bold text-slate-900">${service.price.toLocaleString()}</p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Additional Event Details */}
                      {eventDate.notes && (
                        <div className="mb-8">
                          <div className="border border-slate-200 rounded-lg">
                            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
                              <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-slate-600" />
                                <h3 className="text-lg font-semibold text-slate-900">Event Notes</h3>
                              </div>
                            </div>
                            <div className="p-6">
                              <p className="text-slate-600">{eventDate.notes}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Total Investment */}
                      <div className="mt-8">
                        <div className="border border-slate-300 rounded-lg bg-slate-50">
                          <div className="bg-slate-100 border-b border-slate-300 px-6 py-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Award className="w-5 h-5 text-slate-700" />
                                <h3 className="text-lg font-semibold text-slate-900">Total Investment for this Date</h3>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold text-slate-900">
                                  ${eventDate.totalAmount?.toLocaleString() || '0'}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="p-6">
                            <div className="grid md:grid-cols-3 gap-6">
                              <div>
                                <p className="text-sm font-medium text-slate-700 mb-1">Pricing Model</p>
                                <p className="text-slate-600 capitalize">{eventDate.pricingModel || 'Fixed'}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-700 mb-1">Payment Terms</p>
                                <p className="text-slate-600">30% deposit required</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-700 mb-1">Deposit Amount</p>
                                <p className="text-slate-600 font-semibold">${Math.round((eventDate.totalAmount || 0) * 0.3).toLocaleString()}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}

        {/* Overall Total and Company Information */}
        <div className="mt-12 space-y-8">
          {/* Overall Total for Multi-Date Events */}
          {proposal.eventDates && proposal.eventDates.length > 1 && (
            <div className="border-2 border-slate-300 rounded-lg bg-white">
              <div className="bg-slate-100 border-b-2 border-slate-300 px-8 py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Grand Total for All Event Dates</h3>
                    <p className="text-slate-600">Complete {proposal.eventDates.length}-day event package</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-slate-900">${proposal.totalAmount}</p>
                    {proposal.depositAmount && (
                      <p className="text-slate-600 mt-1">Deposit: ${proposal.depositAmount}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Company Information */}
          {proposal.companyInfo && (
            <div className="border border-slate-200 rounded-lg bg-white">
              <div className="bg-slate-50 border-b border-slate-200 px-8 py-6">
                <h3 className="text-xl font-semibold text-slate-900">{proposal.companyInfo.name}</h3>
              </div>
              <div className="p-8">
                <p className="text-slate-600 mb-6 leading-relaxed">
                  Thank you for considering us for your special event. We're committed to delivering exceptional service and creating memorable experiences.
                </p>
                <div className="grid md:grid-cols-3 gap-6 text-sm">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-700">{proposal.companyInfo.address}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-700">{proposal.companyInfo.phone}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-700">{proposal.companyInfo.email}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}