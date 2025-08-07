import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Mail
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: any;
  onEditClick: () => void;
}

export function EventSummaryModal({ open, onOpenChange, booking, onEditClick }: Props) {
  const { data: venues = [] } = useQuery({ queryKey: ["/api/venues-with-spaces"] });
  const { data: packages = [] } = useQuery({ queryKey: ["/api/packages"] });
  const { data: services = [] } = useQuery({ queryKey: ["/api/services"] });
  const { data: customers = [] } = useQuery({ queryKey: ["/api/customers"] });

  if (!booking) return null;

  const selectedVenueData = venues.find((v: any) => v.id === booking.venueId);
  const selectedSpaceData = selectedVenueData?.spaces?.find((s: any) => s.id === booking.spaceId);
  const selectedPackageData = packages.find((p: any) => p.id === booking.packageId);
  const selectedCustomerData = customers.find((c: any) => c.id === booking.customerId);
  const selectedServicesData = services.filter((s: any) => booking.serviceIds?.includes(s.id));

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
          <DialogTitle className="text-2xl font-bold">{booking.eventName}</DialogTitle>
          <Button variant="outline" onClick={onEditClick} className="gap-2">
            <Edit3 className="h-4 w-4" />
            Edit Event
          </Button>
        </div>

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
              </CardContent>
            </Card>

            {/* Customer Information */}
            {selectedCustomerData && (
              <Card>
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
                    <Button variant="outline" size="sm" className="gap-1">
                      <Mail className="h-3 w-3" />
                      Email
                    </Button>
                    {selectedCustomerData.phone && (
                      <Button variant="outline" size="sm" className="gap-1">
                        <Phone className="h-3 w-3" />
                        Call
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Services & Pricing */}
          <div className="space-y-6">
            {/* Package & Services */}
            <Card>
              <CardHeader>
                <CardTitle>Package & Services</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
      </DialogContent>
    </Dialog>
  );
}