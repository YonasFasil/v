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
import { Separator } from "@/components/ui/separator";
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
  Minus
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { getStatusConfig } from "@shared/status-utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: any;
}

export function EventDetailsModal({ open, onOpenChange, booking }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("details");
  const [isEditing, setIsEditing] = useState(false);
  
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
      const response = await apiRequest(`/api/bookings/${booking?.id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
        headers: { "Content-Type": "application/json" }
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
      toast({ title: "Event updated successfully!" });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({ title: "Failed to update event", description: error.message, variant: "destructive" });
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

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form to original values
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
  };

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const deleteBooking = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/bookings/${booking?.id}`);
      return response;
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

  const handleSaveStatus = () => {
    updateBooking.mutate({
      status: eventStatus,
      depositPaid: paymentStatus === "paid",
      notes: notes
    });
  };

  const handleContact = () => {
    // Here you would integrate with email/SMS services
    toast({ 
      title: `${contactMethod === 'email' ? 'Email' : 'SMS'} sent!`, 
      description: `Message sent to customer via ${contactMethod}` 
    });
    setShowContactModal(false);
    setContactMessage("");
  };

  const getStatusColor = (status: string) => {
    // Use the centralized status utils for consistent coloring
    return getStatusConfig(status).bgColor + " " + getStatusConfig(status).textColor;
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-800";
      case "partial": return "bg-yellow-100 text-yellow-800";
      case "unpaid": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (!booking) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl p-0 max-h-[90vh] overflow-hidden">
          <DialogTitle className="sr-only">Event Details</DialogTitle>
          
          <div className="border-b border-slate-200 p-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">{booking?.eventName}</h2>
              <p className="text-sm text-slate-600">Event #{booking?.id?.slice(-8)}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
            <div className="px-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="details" className="h-full overflow-y-auto p-6 space-y-6">
                {/* Customer & Guest Info */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-slate-500" />
                    <span>Booked for</span>
                    <span className="font-medium">Customer Name</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-slate-500" />
                    <span>{booking?.guestCount || 0} guests</span>
                  </div>
                </div>

                {/* Status Controls */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Event Status</label>
                    <Select value={eventStatus} onValueChange={setEventStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="confirmed">
                          <Badge className="bg-green-100 text-green-800">Confirmed</Badge>
                        </SelectItem>
                        <SelectItem value="pending">
                          <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                        </SelectItem>
                        <SelectItem value="cancelled">
                          <Badge className="bg-red-100 text-red-800">Cancelled</Badge>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Payment Status</label>
                    <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paid">
                          <Badge className="bg-green-100 text-green-800">Paid</Badge>
                        </SelectItem>
                        <SelectItem value="partial">
                          <Badge className="bg-yellow-100 text-yellow-800">Partial</Badge>
                        </SelectItem>
                        <SelectItem value="unpaid">
                          <Badge className="bg-red-100 text-red-800">Unpaid</Badge>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Event Details */}
                <div>
                  <h3 className="font-medium mb-3">Event Details</h3>
                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-slate-500" />
                          <span>{booking?.eventDate ? format(new Date(booking.eventDate), 'EEEE, MMMM d, yyyy') : 'No date set'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-slate-500" />
                          <span>{booking?.startTime || '00:00'} - {booking?.endTime || '00:00'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-slate-500" />
                          <span>Venue Location</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Pricing */}
                <div>
                  <h3 className="font-medium mb-3">Pricing</h3>
                  <div className="text-right">
                    <div className="text-3xl font-bold">
                      ${booking?.totalAmount ? parseFloat(booking.totalAmount).toLocaleString() : '0.00'}
                    </div>
                    {booking?.depositAmount && (
                      <div className="text-sm text-slate-600 mt-1">
                        Deposit: ${parseFloat(booking.depositAmount).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Internal Notes */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Internal Notes</label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes..."
                    className="min-h-[100px]"
                  />
                </div>
              </TabsContent>

              <TabsContent value="timeline" className="h-full overflow-y-auto p-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Communication Log</h3>
                  <div className="space-y-3">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-sm">Event Created</span>
                          <span className="text-xs text-slate-500">
                            {booking?.createdAt ? format(new Date(booking.createdAt), 'MMM d, h:mm a') : 'Recently'}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">Initial booking created and confirmed</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>

          {/* Actions Footer */}
          <div className="border-t border-slate-200 p-6 flex justify-between items-center">
            <Button variant="outline" className="text-red-600 border-red-200" onClick={() => deleteBooking.mutate()}>
              <Trash2 className="h-4 w-4 mr-2" />
              Cancel Event
            </Button>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowContactModal(true)}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Contact
              </Button>
              <Button onClick={handleSaveStatus}>
                <Edit3 className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contact Customer Modal */}
      <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
        <DialogContent className="max-w-lg">
          <DialogTitle>Contact Customer</DialogTitle>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-600 mb-4">To: Customer Name (email@example.com)</p>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Method:</label>
              <div className="flex gap-2">
                <Button 
                  variant={contactMethod === 'email' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setContactMethod('email')}
                >
                  <Mail className="h-4 w-4 mr-1" />
                  Email
                </Button>
                <Button 
                  variant={contactMethod === 'phone' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setContactMethod('phone')}
                >
                  <Phone className="h-4 w-4 mr-1" />
                  SMS
                </Button>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Message</label>
              <Textarea
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="Type your message..."
                className="min-h-[120px]"
              />
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowContactModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleContact}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Send
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}