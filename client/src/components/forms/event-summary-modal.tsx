import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnhancedBeoModal } from "./enhanced-beo-modal";
import { CreateEventModal } from "./create-event-modal";
import { StatusSelector } from "../events/status-selector";
import { type EventStatus } from "@shared/status-utils";
import { 
  X, 
  Edit3, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  DollarSign, 
  MessageSquare, 
  Phone,
  Mail,
  FileText,
  Send,
  Copy,
  FileOutput
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: any;
  onEditClick: () => void;
}

export function EventSummaryModal({ open, onOpenChange, booking, onEditClick }: Props) {
  const [showCommunication, setShowCommunication] = useState(false);
  const [communicationMessage, setCommunicationMessage] = useState("");
  const [communicationType, setCommunicationType] = useState("email");
  const [showBeoModal, setShowBeoModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: venues = [] } = useQuery({ queryKey: ["/api/venues-with-spaces"] });
  const { data: packages = [] } = useQuery({ queryKey: ["/api/packages"] });
  const { data: services = [] } = useQuery({ queryKey: ["/api/services"] });
  const { data: customers = [] } = useQuery({ queryKey: ["/api/customers"] });
  const { data: communications = [] } = useQuery({ 
    queryKey: ["/api/communications", booking?.id], 
    enabled: !!booking?.id 
  });

  // Status update mutation - moved before early return to maintain hook order
  const updateStatusMutation = useMutation({
    mutationFn: async ({ bookingId, newStatus }: { bookingId: string; newStatus: EventStatus }) => {
      return apiRequest("PATCH", `/api/bookings/${bookingId}`, { status: newStatus });
    },
    onSuccess: () => {
      toast({
        title: "Status updated",
        description: "Event status has been successfully updated."
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating status",
        description: error.response?.data?.message || "An error occurred while updating the status.",
        variant: "destructive"
      });
    }
  });

  const handleStatusChange = (newStatus: EventStatus) => {
    if (booking?.id) {
      updateStatusMutation.mutate({ bookingId: booking.id, newStatus });
    }
  };

  if (!booking) return null;

  // Use enhanced data from calendar API if available, otherwise fallback to lookup
  const selectedVenueData = booking.venueData || (venues as any[]).find((v: any) => v.id === booking.venueId);
  const selectedSpaceData = booking.spaceData || selectedVenueData?.spaces?.find((s: any) => s.id === booking.spaceId);
  const selectedPackageData = (packages as any[]).find((p: any) => p.id === booking.packageId);
  const selectedCustomerData = booking.customerData || (customers as any[]).find((c: any) => c.id === booking.customerId);
  const selectedServicesData = (services as any[]).filter((s: any) => booking.serviceIds?.includes(s.id));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex flex-col gap-2">
            <DialogTitle className="text-2xl font-bold">
              {booking.isContract 
                ? booking.contractInfo?.contractName || "Multi-Date Contract"
                : booking.eventName
              }
            </DialogTitle>
            {/* Proposal Status */}
            {booking.proposalStatus && booking.proposalStatus !== 'none' && (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <Badge variant="outline" className={`${
                  booking.proposalStatus === 'sent' ? 'border-blue-500 text-blue-600' :
                  booking.proposalStatus === 'viewed' ? 'border-yellow-500 text-yellow-600' :
                  booking.proposalStatus === 'accepted' ? 'border-green-500 text-green-600' :
                  booking.proposalStatus === 'declined' ? 'border-red-500 text-red-600' :
                  'border-gray-500 text-gray-600'
                }`}>
                  Proposal {booking.proposalStatus}
                </Badge>
                {booking.proposalSentAt && (
                  <span className="text-sm text-gray-500">
                    Sent {format(new Date(booking.proposalSentAt), 'MMM d, yyyy')}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Status Selector in top right corner */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-600">Status:</span>
              <StatusSelector
                currentStatus={booking.status as EventStatus}
                onStatusChange={handleStatusChange}
              />
            </div>
          </div>
        </div>

        {/* Contract Summary Banner */}
        {booking.isContract && (
          <div className="mb-6 bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge className="bg-purple-100 text-purple-800">Contract</Badge>
                <div>
                  <h3 className="font-semibold text-purple-900">
                    {booking.contractInfo?.contractName || "Multi-Date Event Contract"}
                  </h3>
                  <p className="text-sm text-purple-700">
                    {booking.eventCount} events • Total: ${parseFloat(booking.totalAmount || '0').toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="text-right text-sm text-purple-700">
                <div>Contract ID: {booking.contractInfo?.id?.slice(-8)}</div>
                <div>{booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1)}</div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Event Details */}
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Event Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <Badge className={getStatusColor(booking.status)}>
                    {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1)}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Event Type</span>
                  <span className="font-medium">{booking.eventType || 'General Event'}</span>
                </div>

                {booking.isContract ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Event Dates</span>
                      <span className="font-medium">{booking.eventCount} events</span>
                    </div>
                    
                    <div className="space-y-2">
                      <span className="text-sm text-gray-600">Schedule:</span>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {booking.contractEvents?.map((event: any, index: number) => (
                          <div key={index} className="text-sm bg-gray-50 p-2 rounded">
                            <div className="font-medium">
                              {event.eventDate ? format(new Date(event.eventDate), 'MMM d, yyyy') : 'Date TBD'}
                            </div>
                            <div className="text-gray-600">
                              {event.startTime} - {event.endTime} • {event.guestCount} guests
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Guests</span>
                      <span className="font-medium flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {booking.contractEvents?.reduce((sum: number, event: any) => sum + (event.guestCount || 0), 0)}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Date</span>
                      <span className="font-medium">
                        {booking.eventDate ? format(new Date(booking.eventDate), 'EEEE, MMMM d, yyyy') : 'No date set'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Time</span>
                      <span className="font-medium">{booking.startTime} - {booking.endTime}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Guests</span>
                      <span className="font-medium flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {booking.guestCount}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Venue & Space */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Venue & Space
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {booking.isContract ? (
                  <div className="space-y-3">
                    <span className="text-sm text-gray-600">Venues & Spaces Used:</span>
                    <div className="max-h-24 overflow-y-auto space-y-2">
                      {booking.contractEvents?.map((event: any, index: number) => {
                        const eventVenue = (venues as any[]).find((v: any) => v.id === event.venueId);
                        const eventSpace = eventVenue?.spaces?.find((s: any) => s.id === event.spaceId);
                        return (
                          <div key={index} className="text-sm bg-gray-50 p-2 rounded">
                            <div className="font-medium">{eventVenue?.name || 'Unknown Venue'}</div>
                            <div className="text-gray-600">
                              {eventSpace?.name || 'Unknown Space'} • {event.eventDate ? format(new Date(event.eventDate), 'MMM d') : 'TBD'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <span className="text-sm text-gray-600">Venue</span>
                      <div className="font-medium">{selectedVenueData?.name || 'Venue not found'}</div>
                    </div>
                    
                    <div>
                      <span className="text-sm text-gray-600">Space</span>
                      <div className="font-medium">{selectedSpaceData?.name || 'Space not found'}</div>
                      {selectedSpaceData && (
                        <div className="text-sm text-gray-500">Capacity: {selectedSpaceData.capacity} guests</div>
                      )}
                    </div>

                    {selectedVenueData?.address && (
                      <div>
                        <span className="text-sm text-gray-600">Address</span>
                        <div className="text-sm">{selectedVenueData.address}</div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>


          </div>

          {/* Right Column - Services & Pricing */}
          <div className="space-y-6">
            {/* Package & Services */}
            <Card>
              <CardHeader>
                <CardTitle>Package & Services</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {booking.isContract ? (
                  <div className="space-y-4">
                    {/* Contract Packages Summary */}
                    {booking.contractEvents?.map((event: any, index: number) => {
                      const eventPackage = (packages as any[]).find((p: any) => p.id === event.packageId);
                      const eventServices = (services as any[]).filter((s: any) => event.selectedServices?.includes(s.id));
                      
                      return (
                        <div key={index} className="border border-gray-200 rounded-lg p-3">
                          <div className="text-sm font-medium text-gray-800 mb-2">
                            {event.eventDate ? format(new Date(event.eventDate), 'MMM d, yyyy') : 'TBD'}
                          </div>
                          
                          {eventPackage ? (
                            <div className="border-l-4 border-blue-500 bg-blue-50 p-3 rounded-r mb-3">
                              <div className="font-medium text-blue-900">{eventPackage.name}</div>
                              <div className="text-sm text-blue-700">{eventPackage.description}</div>
                              <div className="text-sm font-medium text-blue-800 mt-1">
                                ${eventPackage.price} {eventPackage.pricingModel === 'per_person' ? '/ person' : 'total'}
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500 mb-3">No package selected</div>
                          )}

                          {eventServices.length > 0 && (
                            <div>
                              <div className="text-sm font-medium text-gray-700 mb-2">Services:</div>
                              <div className="space-y-1">
                                {eventServices.map((service: any) => (
                                  <div key={service.id} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                                    <span className="font-medium">{service.name}</span>
                                    <span>${service.price} {service.pricingModel === 'per_person' ? '/ person' : ''}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <>
                    {selectedPackageData ? (
                      <div className="border-l-4 border-blue-500 bg-blue-50 p-3 rounded-r">
                        <div className="font-medium text-blue-900">{selectedPackageData.name}</div>
                        <div className="text-sm text-blue-700">{selectedPackageData.description}</div>
                        <div className="text-sm font-medium text-blue-800 mt-1">
                          ${selectedPackageData.price} {selectedPackageData.pricingModel === 'per_person' ? '/ person' : 'total'}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">No package selected</div>
                    )}

                    {selectedServicesData.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-2">Additional Services:</div>
                        <div className="space-y-2">
                          {selectedServicesData.map((service: any) => (
                            <div key={service.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <div>
                                <div className="font-medium text-sm">{service.name}</div>
                                <div className="text-xs text-gray-600">{service.description}</div>
                              </div>
                              <div className="text-sm font-medium">
                                ${service.price} {service.pricingModel === 'per_person' ? '/ person' : 'total'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Pricing Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Pricing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Amount</span>
                  <span className="font-semibold text-lg">${booking.totalAmount || '0.00'}</span>
                </div>
                
                {booking.depositAmount && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Deposit Amount</span>
                    <span className="font-medium">${booking.depositAmount}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Payment Status</span>
                  <Badge className={booking.depositPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {booking.depositPaid ? 'Paid' : 'Unpaid'}
                  </Badge>
                </div>

                {booking.depositAmount && (
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Remaining Balance</span>
                      <span className="font-medium">
                        ${((parseFloat(booking.totalAmount || '0') - parseFloat(booking.depositAmount || '0')).toFixed(2))}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            {booking.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{booking.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Customer Information - Full Width at Bottom */}
        {selectedCustomerData && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="font-medium">{selectedCustomerData.name}</div>
                <div className="text-sm text-gray-600">{selectedCustomerData.email}</div>
                {selectedCustomerData.phone && (
                  <div className="text-sm text-gray-600">{selectedCustomerData.phone}</div>
                )}
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1"
                  onClick={() => setShowCommunication(!showCommunication)}
                >
                  <MessageSquare className="h-3 w-3" />
                  Contact
                </Button>
                {selectedCustomerData.phone && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-1"
                    onClick={() => window.open(`tel:${selectedCustomerData.phone}`)}
                  >
                    <Phone className="h-3 w-3" />
                    Call
                  </Button>
                )}
              </div>
              
              {/* Communication Panel */}
              {showCommunication && (
                <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <h4 className="font-medium mb-3">Send Message to {selectedCustomerData.name}</h4>
                  <div className="space-y-3">
                    <select 
                      value={communicationType}
                      onChange={(e) => setCommunicationType(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="email">Email</option>
                      <option value="sms">SMS</option>
                      <option value="internal">Internal Note</option>
                    </select>
                    
                    <textarea
                      value={communicationMessage}
                      onChange={(e) => setCommunicationMessage(e.target.value)}
                      placeholder={`Write your ${communicationType} message here...`}
                      className="w-full p-3 border border-gray-300 rounded-md text-sm min-h-[100px] resize-none"
                    />
                    
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="gap-1"
                        onClick={async () => {
                          try {
                            // Save communication to database
                            const response = await fetch('/api/communications', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                bookingId: booking.id,
                                customerId: selectedCustomerData.id,
                                type: communicationType,
                                direction: 'outbound',
                                message: communicationMessage,
                                subject: communicationType === 'email' ? `Regarding your event: ${booking.eventName}` : null,
                                sentBy: 'Venue Manager'
                              })
                            });
                            
                            if (response.ok) {
                              console.log('Communication saved successfully');
                              // Refresh the page to show the new communication
                              window.location.reload();
                            } else {
                              console.error('Failed to save communication');
                            }
                          } catch (error) {
                            console.error('Error saving communication:', error);
                          }
                          
                          setCommunicationMessage("");
                          setShowCommunication(false);
                        }}
                        disabled={!communicationMessage.trim()}
                      >
                        <Send className="h-3 w-3" />
                        Send {communicationType === 'email' ? 'Email' : communicationType === 'sms' ? 'SMS' : 'Note'}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowCommunication(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Communication History */}
              {(communications as any[]).length > 0 && (
                <div className="mt-4 p-4 border border-blue-200 rounded-lg bg-blue-50">
                  <h4 className="font-medium mb-3 text-blue-900">Communication History</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {(communications as any[]).map((comm: any) => (
                      <div key={comm.id} className="p-3 bg-white rounded border text-sm">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-blue-800 capitalize">
                            {comm.type === 'proposal' ? 'Proposal Email' : comm.type} {comm.direction === 'outbound' ? '→' : '←'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {comm.sentAt ? format(new Date(comm.sentAt), 'MMM d, h:mm a') : 'No date'}
                          </span>
                        </div>
                        {comm.subject && (
                          <div className="text-xs text-gray-600 mb-1">Subject: {comm.subject}</div>
                        )}
                        
                        {/* Proposal Status Indicators */}
                        {comm.type === 'proposal' && (
                          <div className="flex gap-2 mb-2">
                            <Badge variant={comm.proposalViewed ? "default" : "secondary"} className="text-xs">
                              {comm.proposalViewed ? "✓ Viewed" : "Not Viewed"}
                            </Badge>
                            {comm.proposalStatus && (
                              <Badge 
                                variant={
                                  comm.proposalStatus === 'accepted' ? "default" : 
                                  comm.proposalStatus === 'declined' ? "destructive" : 
                                  "secondary"
                                } 
                                className="text-xs"
                              >
                                {comm.proposalStatus.charAt(0).toUpperCase() + comm.proposalStatus.slice(1)}
                              </Badge>
                            )}
                            {comm.depositPaid && (
                              <Badge variant="default" className="text-xs bg-green-600">
                                ✓ Deposit Paid
                              </Badge>
                            )}
                          </div>
                        )}
                        
                        <div className="text-gray-700">{comm.message}</div>
                        {comm.sentBy && (
                          <div className="text-xs text-gray-500 mt-1">by {comm.sentBy}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Action Buttons - Sticky at bottom */}
        <div className="sticky bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t mt-6 pt-4 -mx-6 px-6 -mb-6 pb-6">
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onEditClick} className="gap-2">
              <Edit3 className="h-4 w-4" />
              Edit {booking.isContract ? "Contract" : "Event"}
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => setShowDuplicateModal(true)}>
              <Copy className="h-4 w-4" />
              Duplicate Event
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => setShowBeoModal(true)}>
              <FileOutput className="h-4 w-4" />
              BEO
            </Button>
          </div>
        </div>
      </DialogContent>
      
      {/* Enhanced BEO Modal */}
      <EnhancedBeoModal 
        isOpen={showBeoModal} 
        onClose={() => setShowBeoModal(false)} 
        booking={booking} 
      />
      
      {/* Duplicate Event Modal */}
      <CreateEventModal
        open={showDuplicateModal}
        onOpenChange={setShowDuplicateModal}
        duplicateFromBooking={booking}
      />
    </Dialog>
  );
}