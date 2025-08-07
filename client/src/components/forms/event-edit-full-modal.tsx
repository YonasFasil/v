import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  X, 
  Calendar, 
  CalendarIcon,
  Plus,
  Minus,
  Save,
  Trash2
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

export function EventEditFullModal({ open, onOpenChange, booking }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Form state
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
  const [totalAmount, setTotalAmount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositPaid, setDepositPaid] = useState(false);
  const [notes, setNotes] = useState("");

  // Data queries
  const { data: venues = [] } = useQuery({ queryKey: ["/api/venues-with-spaces"] });
  const { data: packages = [] } = useQuery({ queryKey: ["/api/packages"] });
  const { data: services = [] } = useQuery({ queryKey: ["/api/services"] });
  const { data: customers = [] } = useQuery({ queryKey: ["/api/customers"] });

  // Initialize form data when booking changes
  useEffect(() => {
    if (booking && open) {
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
      setTotalAmount(booking.totalAmount || "");
      setDepositAmount(booking.depositAmount || "");
      setDepositPaid(booking.depositPaid || false);
      setNotes(booking.notes || "");
    }
  }, [booking, open]);

  const selectedVenueData = venues.find((v: any) => v.id === selectedVenue);
  const selectedPackageData = packages.find((p: any) => p.id === selectedPackage);
  const selectedCustomerData = customers.find((c: any) => c.id === selectedCustomer);

  // Calculate pricing
  const packagePrice = selectedPackageData ? 
    (selectedPackageData.pricingModel === 'per_person' ? 
      parseFloat(selectedPackageData.price) * guestCount : 
      parseFloat(selectedPackageData.price)) : 0;
      
  const servicesPrice = selectedServices.reduce((total, serviceId) => {
    const service = services.find((s: any) => s.id === serviceId);
    if (!service) return total;
    return total + (service.pricingModel === 'per_person' ? 
      parseFloat(service.price) * guestCount : 
      parseFloat(service.price));
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
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({ title: "Event cancelled successfully!" });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ title: "Failed to cancel event", description: error.message, variant: "destructive" });
    }
  });

  const handleSave = () => {
    if (!eventName.trim() || !selectedCustomer || !selectedVenue || !selectedSpace) {
      toast({
        title: "Required fields missing",
        description: "Please fill in event name, customer, venue, and space",
        variant: "destructive"
      });
      return;
    }

    const updates = {
      eventName,
      eventType,
      eventDate,
      startTime,
      endTime,
      guestCount,
      venueId: selectedVenue,
      spaceId: selectedSpace,
      packageId: selectedPackage || null,
      serviceIds: selectedServices,
      customerId: selectedCustomer,
      status: eventStatus,
      totalAmount: totalAmount || calculatedTotal.toString(),
      depositAmount,
      depositPaid,
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

  const handleDeleteClick = () => {
    if (confirm("Are you sure you want to cancel this event? This action cannot be undone.")) {
      deleteBooking.mutate();
    }
  };

  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <DialogTitle className="text-2xl font-bold">Edit Event: {booking.eventName}</DialogTitle>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
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
                      <Label>Event Name *</Label>
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
                          <SelectItem value="private">Private Event</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Event Date *</Label>
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
                      <Label>Customer *</Label>
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Venue *</Label>
                      <Select value={selectedVenue} onValueChange={setSelectedVenue}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select venue" />
                        </SelectTrigger>
                        <SelectContent>
                          {venues.map((venue: any) => (
                            <SelectItem key={venue.id} value={venue.id}>
                              {venue.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Space *</Label>
                      <Select value={selectedSpace} onValueChange={setSelectedSpace}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select space" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedVenueData?.spaces?.map((space: any) => (
                            <SelectItem key={space.id} value={space.id}>
                              {space.name} (Capacity: {space.capacity})
                            </SelectItem>
                          )) || <SelectItem value="no-spaces" disabled>No spaces available</SelectItem>}
                        </SelectContent>
                      </Select>
                    </div>
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
                    <div className="flex items-center space-x-2 pt-6">
                      <Checkbox
                        id="deposit-paid"
                        checked={depositPaid}
                        onCheckedChange={setDepositPaid}
                      />
                      <Label htmlFor="deposit-paid">Deposit Paid</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Packages & Services */}
            <div className="space-y-6">
              {packages.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Package Selection</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div 
                        className={cn(
                          "border rounded-lg p-3 cursor-pointer transition-colors",
                          !selectedPackage ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                        )}
                        onClick={() => setSelectedPackage("")}
                      >
                        <div className="font-medium">No Package</div>
                        <div className="text-sm text-gray-600">Use individual services only</div>
                      </div>
                      {packages.map((pkg: any) => (
                        <div 
                          key={pkg.id}
                          className={cn(
                            "border rounded-lg p-3 cursor-pointer transition-colors",
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
                              <div className="font-semibold">
                                ${pkg.price}{pkg.pricingModel === 'per_person' ? '/person' : ''}
                              </div>
                              <div className="text-sm text-gray-500">
                                ${pkg.pricingModel === 'per_person' ? 
                                  (parseFloat(pkg.price) * guestCount).toLocaleString() : 
                                  parseFloat(pkg.price).toLocaleString()} total
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {services.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Services</CardTitle>
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
                            <div className="font-semibold">
                              ${service.price}{service.pricingModel === 'per_person' ? '/person' : ''}
                            </div>
                            <div className="text-sm text-gray-500">
                              ${service.pricingModel === 'per_person' ? 
                                (parseFloat(service.price) * guestCount).toLocaleString() : 
                                parseFloat(service.price).toLocaleString()} total
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

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
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Internal Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add internal notes about this event..."
                className="min-h-20"
              />
            </CardContent>
          </Card>
        </div>

        {/* Fixed Footer */}
        <div className="border-t p-6 flex justify-between bg-white">
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
      </DialogContent>
    </Dialog>
  );
}