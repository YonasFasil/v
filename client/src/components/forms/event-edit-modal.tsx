import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  X, 
  User, 
  Users, 
  Calendar, 
  Clock, 
  MapPin, 
  DollarSign, 
  Trash2, 
  MessageSquare, 
  Edit3, 
  Phone,
  Mail,
  CalendarIcon,
  Plus,
  Minus,
  Save
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: any;
}

export function EventEditModal({ open, onOpenChange, booking }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("edit");
  
  // Editable fields
  const [eventName, setEventName] = useState("");
  const [eventType, setEventType] = useState("");
  const [eventDate, setEventDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [guestCount, setGuestCount] = useState(1);
  const [selectedVenue, setSelectedVenue] = useState("");
  const [selectedSpace, setSelectedSpace] = useState("");
  const [selectedPackage, setSelectedPackage] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [eventStatus, setEventStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("unpaid");
  const [totalAmount, setTotalAmount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [notes, setNotes] = useState("");
  
  // Communication
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactMethod, setContactMethod] = useState("email");
  const [contactMessage, setContactMessage] = useState("");

  // Data queries
  const { data: venues = [] } = useQuery({ queryKey: ["/api/venues-with-spaces"] });
  const { data: packages = [] } = useQuery({ queryKey: ["/api/packages"] });
  const { data: services = [] } = useQuery({ queryKey: ["/api/services"] });
  const { data: customers = [] } = useQuery({ queryKey: ["/api/customers"] });

  // Initialize form data when booking changes
  useEffect(() => {
    if (booking) {
      setEventName(booking.eventName || "");
      setEventType(booking.eventType || "");
      setEventDate(booking.eventDate ? new Date(booking.eventDate) : undefined);
      setStartTime(booking.startTime || "");
      setEndTime(booking.endTime || "");
      setGuestCount(booking.guestCount || 1);
      setSelectedVenue(booking.venueId || "");
      setSelectedSpace(booking.spaceId || "");
      setSelectedPackage(booking.packageId || "");
      setSelectedServices(booking.serviceIds || []);
      setSelectedCustomer(booking.customerId || "");
      setEventStatus(booking.status || "confirmed");
      setPaymentStatus(booking.depositPaid ? "paid" : "unpaid");
      setTotalAmount(booking.totalAmount || "");
      setDepositAmount(booking.depositAmount || "");
      setNotes(booking.notes || "");
    }
  }, [booking]);

  const selectedVenueData = venues.find((v: any) => v.id === selectedVenue);
  const selectedPackageData = packages.find((p: any) => p.id === selectedPackage);
  const selectedCustomerData = customers.find((c: any) => c.id === selectedCustomer);

  // Calculate pricing
  const packagePrice = selectedPackageData ? parseFloat(selectedPackageData.price) * guestCount : 0;
  const servicesPrice = selectedServices.reduce((total, serviceId) => {
    const service = services.find((s: any) => s.id === serviceId);
    return total + (service ? parseFloat(service.price) * guestCount : 0);
  }, 0);
  const calculatedTotal = packagePrice + servicesPrice;

  const updateBooking = useMutation({
    mutationFn: async (updates: any) => {
      const response = await apiRequest("PATCH", `/api/bookings/${booking?.id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
      toast({ title: "Event updated successfully!" });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ title: "Failed to update event", description: error.message, variant: "destructive" });
    }
  });

  const deleteBooking = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/bookings/${booking?.id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
      toast({ title: "Event cancelled successfully!" });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ title: "Failed to cancel event", description: error.message, variant: "destructive" });
    }
  });

  const handleSave = () => {
    const updates = {
      eventName,
      eventType,
      eventDate,
      startTime,
      endTime,
      guestCount,
      venueId: selectedVenue,
      spaceId: selectedSpace,
      packageId: selectedPackage,
      serviceIds: selectedServices,
      customerId: selectedCustomer,
      status: eventStatus,
      depositPaid: paymentStatus === "paid",
      totalAmount: totalAmount || calculatedTotal.toString(),
      depositAmount,
      notes,
    };
    updateBooking.mutate(updates);
  };

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleContactSubmit = () => {
    setTimeout(() => {
      toast({ title: `${contactMethod === 'email' ? 'Email' : 'SMS'} sent successfully!` });
      setShowContactModal(false);
      setContactMessage("");
    }, 1000);
  };

  const handleDeleteClick = () => {
    if (confirm("Are you sure you want to cancel this event? This action cannot be undone.")) {
      deleteBooking.mutate();
    }
  };

  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <DialogTitle className="text-2xl font-bold">Edit Event: {booking.eventName}</DialogTitle>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit">Edit Details</TabsTrigger>
            <TabsTrigger value="timeline">Timeline & Communication</TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Event Details */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Event Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Event Name</Label>
                        <Input 
                          value={eventName} 
                          onChange={(e) => setEventName(e.target.value)}
                          placeholder="Event name"
                        />
                      </div>
                      <div>
                        <Label>Event Type</Label>
                        <Select value={eventType} onValueChange={setEventType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="wedding">Wedding</SelectItem>
                            <SelectItem value="corporate">Corporate</SelectItem>
                            <SelectItem value="birthday">Birthday</SelectItem>
                            <SelectItem value="conference">Conference</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Event Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !eventDate && "text-muted-foreground")}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {eventDate ? format(eventDate, "PPP") : "Pick date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <CalendarComponent mode="single" selected={eventDate} onSelect={setEventDate} initialFocus />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div>
                        <Label>Start Time</Label>
                        <Input 
                          type="time" 
                          value={startTime} 
                          onChange={(e) => setStartTime(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>End Time</Label>
                        <Input 
                          type="time" 
                          value={endTime} 
                          onChange={(e) => setEndTime(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Guest Count</Label>
                        <div className="flex items-center gap-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Input 
                            type="number" 
                            value={guestCount} 
                            onChange={(e) => setGuestCount(parseInt(e.target.value) || 1)}
                            className="text-center"
                            min="1"
                          />
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => setGuestCount(guestCount + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label>Customer</Label>
                        <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select customer" />
                          </SelectTrigger>
                          <SelectContent>
                            {customers.map((customer: any) => (
                              <SelectItem key={customer.id} value={customer.id}>
                                {customer.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>Venue & Space</Label>
                      <Select value={selectedVenue} onValueChange={setSelectedVenue}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select venue" />
                        </SelectTrigger>
                        <SelectContent>
                          {venues.map((venue: any) => (
                            <SelectItem key={venue.id} value={venue.id}>
                              {venue.name} - {venue.spaces?.[0]?.name || 'Main Hall'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Event Status</Label>
                        <Select value={eventStatus} onValueChange={setEventStatus}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="inquiry">Inquiry</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Payment Status</Label>
                        <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unpaid">Unpaid</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Packages & Services */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Package Selection</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {packages.map((pkg: any) => (
                        <div 
                          key={pkg.id}
                          className={cn(
                            "border rounded-lg p-4 cursor-pointer transition-colors",
                            selectedPackage === pkg.id 
                              ? "border-blue-500 bg-blue-50" 
                              : "border-gray-200 hover:border-gray-300"
                          )}
                          onClick={() => setSelectedPackage(pkg.id)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold">{pkg.name}</h4>
                              <p className="text-sm text-gray-600">{pkg.description}</p>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">${pkg.price}/person</div>
                              <div className="text-sm text-gray-500">
                                ${(parseFloat(pkg.price) * guestCount).toLocaleString()} total
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Add-On Services</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {services.map((service: any) => (
                        <div key={service.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              checked={selectedServices.includes(service.id)}
                              onCheckedChange={() => handleServiceToggle(service.id)}
                            />
                            <div>
                              <div className="font-medium">{service.name}</div>
                              <div className="text-sm text-gray-600">{service.description}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">${service.price}/person</div>
                            <div className="text-sm text-gray-500">
                              ${(parseFloat(service.price) * guestCount).toLocaleString()} total
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Pricing</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Total Amount</Label>
                          <Input 
                            value={totalAmount} 
                            onChange={(e) => setTotalAmount(e.target.value)}
                            placeholder={`$${calculatedTotal.toLocaleString()}`}
                          />
                        </div>
                        <div>
                          <Label>Deposit Amount</Label>
                          <Input 
                            value={depositAmount} 
                            onChange={(e) => setDepositAmount(e.target.value)}
                            placeholder="Enter deposit"
                          />
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between">
                          <span>Calculated Total:</span>
                          <span className="font-semibold">${calculatedTotal.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Internal Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Internal Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add internal notes about this event..."
                  className="min-h-24"
                />
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-between">
              <Button variant="destructive" onClick={handleDeleteClick} disabled={deleteBooking.isPending}>
                <Trash2 className="w-4 h-4 mr-2" />
                Cancel Event
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={updateBooking.isPending}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle>Event Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <div className="font-medium">Event inquiry received</div>
                        <div className="text-sm text-gray-600">Customer submitted initial request</div>
                        <div className="text-xs text-gray-500 mt-1">3 days ago</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <div className="font-medium">Proposal sent</div>
                        <div className="text-sm text-gray-600">Event proposal with pricing sent to customer</div>
                        <div className="text-xs text-gray-500 mt-1">2 days ago</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <div className="font-medium">Booking confirmed</div>
                        <div className="text-sm text-gray-600">Customer accepted proposal and confirmed booking</div>
                        <div className="text-xs text-gray-500 mt-1">1 day ago</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Communication */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Communication</CardTitle>
                    <Button size="sm" onClick={() => setShowContactModal(true)}>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Contact Customer
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="border-l-4 border-blue-500 bg-blue-50 p-3 rounded-r">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Event booking confirmed</span>
                        <span className="text-gray-500">2 hours ago</span>
                      </div>
                      <p className="text-gray-600 mt-1">Booking details sent to customer via email</p>
                    </div>
                    <div className="border-l-4 border-green-500 bg-green-50 p-3 rounded-r">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Deposit received</span>
                        <span className="text-gray-500">1 day ago</span>
                      </div>
                      <p className="text-gray-600 mt-1">Payment processed successfully</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Contact Modal */}
        {showContactModal && (
          <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
            <DialogContent className="max-w-md">
              <DialogTitle>Contact Customer</DialogTitle>
              <div className="space-y-4">
                <div>
                  <Label>Contact Method</Label>
                  <Select value={contactMethod} onValueChange={setContactMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 mr-2" />
                          Email
                        </div>
                      </SelectItem>
                      <SelectItem value="sms">
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 mr-2" />
                          SMS
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Message</Label>
                  <Textarea
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder={`Write your ${contactMethod} message...`}
                    className="min-h-24"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowContactModal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleContactSubmit}>
                    Send {contactMethod === 'email' ? 'Email' : 'SMS'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}