import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, getDay } from "date-fns";
import { ChevronLeft, ChevronRight, X, Plus, RotateCcw, Trash2, Save, Edit, Minus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: any;
}

interface SelectedDate {
  date: Date;
  startTime: string;
  endTime: string;
  spaceId?: string;
}

export function EventEditFullModal({ open, onOpenChange, booking }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Step 1: Date & Venue Selection
  const [selectedVenue, setSelectedVenue] = useState("");
  const [selectedDates, setSelectedDates] = useState<SelectedDate[]>([]);
  
  // Step 2: Event Configuration  
  const [guestCount, setGuestCount] = useState(1);
  const [selectedPackage, setSelectedPackage] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  
  // Step 3: Final Details
  const [eventName, setEventName] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [eventStatus, setEventStatus] = useState("inquiry");
  
  // Customer creation
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    company: ""
  });

  // Data queries
  const { data: venues = [] } = useQuery({ queryKey: ["/api/venues-with-spaces"] });
  const { data: packages = [] } = useQuery({ queryKey: ["/api/packages"] });
  const { data: services = [] } = useQuery({ queryKey: ["/api/services"] });
  const { data: customers = [] } = useQuery({ queryKey: ["/api/customers"] });

  // Initialize form data when booking changes
  useEffect(() => {
    if (booking && open) {
      setEventName(booking.eventName || "");
      setEventStatus(booking.status || "inquiry");
      setGuestCount(booking.guestCount || 1);
      setSelectedVenue(booking.venueId || "");
      setSelectedPackage(booking.packageId || "");
      setSelectedServices(booking.selectedServices || []);
      setSelectedCustomer(booking.customerId || "");
      
      // Set the date and time from the booking
      if (booking.eventDate && booking.startTime && booking.endTime) {
        setSelectedDates([{
          date: new Date(booking.eventDate),
          startTime: booking.startTime,
          endTime: booking.endTime,
          spaceId: booking.spaceId || ""
        }]);
      }
    }
  }, [booking, open]);

  // Calendar calculations
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Pad calendar to show full weeks
  const startDay = getDay(monthStart);
  const paddedDays = [
    ...Array(startDay).fill(null).map((_, i) => {
      const date = new Date(monthStart);
      date.setDate(date.getDate() - (startDay - i));
      return date;
    }),
    ...calendarDays
  ];

  const selectedVenueData = (venues as any[]).find((v: any) => v.id === selectedVenue);
  const selectedPackageData = (packages as any[]).find((p: any) => p.id === selectedPackage);
  
  // Calculate total price
  const packagePrice = useMemo(() => {
    if (!selectedPackageData) return 0;
    return selectedPackageData.pricingModel === 'per_person' 
      ? parseFloat(selectedPackageData.price) * guestCount 
      : parseFloat(selectedPackageData.price);
  }, [selectedPackageData, guestCount]);

  const servicesPrice = useMemo(() => {
    return selectedServices.reduce((total, serviceId) => {
      const service = (services as any[]).find((s: any) => s.id === serviceId);
      if (!service) return total;
      return total + (service.pricingModel === 'per_person' 
        ? parseFloat(service.price) * guestCount 
        : parseFloat(service.price));
    }, 0);
  }, [selectedServices, services, guestCount]);

  const totalPrice = packagePrice + servicesPrice;

  // Create customer mutation
  const createCustomer = useMutation({
    mutationFn: async (customerData: any) => {
      const response = await apiRequest("POST", "/api/customers", customerData);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setSelectedCustomer(data.id);
      setShowNewCustomerForm(false);
      setNewCustomer({ name: "", email: "", phone: "", company: "" });
      toast({ title: "Customer created successfully!" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to create customer", description: error.message, variant: "destructive" });
    }
  });

  const updateBooking = useMutation({
    mutationFn: async (bookingData: any) => {
      const response = await apiRequest("PATCH", `/api/bookings/${booking.id}`, bookingData);
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
      const response = await apiRequest("DELETE", `/api/bookings/${booking.id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({ title: "Event deleted successfully!" });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete event", description: error.message, variant: "destructive" });
    }
  });

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 3));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleDateClick = (day: Date) => {
    if (selectedDates.some(d => isSameDay(d.date, day))) {
      setSelectedDates(prev => prev.filter(d => !isSameDay(d.date, day)));
    } else {
      setSelectedDates(prev => [...prev, {
        date: day,
        startTime: "09:00",
        endTime: "17:00",
        spaceId: selectedVenueData?.spaces?.[0]?.id || ""
      }]);
    }
  };

  const updateDateSlot = (index: number, field: keyof SelectedDate, value: any) => {
    setSelectedDates(prev => prev.map((slot, i) => 
      i === index ? { ...slot, [field]: value } : slot
    ));
  };

  const handleSubmit = () => {
    if (!eventName.trim() || !selectedCustomer || selectedDates.length === 0) {
      toast({
        title: "Required fields missing",
        description: "Please fill in event name, customer, and select at least one date",
        variant: "destructive"
      });
      return;
    }

    const bookingData = {
      eventName,
      eventType: selectedPackageData?.name || "Custom Event",
      eventDate: selectedDates[0].date,
      startTime: selectedDates[0].startTime,
      endTime: selectedDates[0].endTime,
      guestCount,
      venueId: selectedVenue,
      spaceId: selectedDates[0].spaceId,
      packageId: selectedPackage || null,
      selectedServices: selectedServices,
      customerId: selectedCustomer,
      status: eventStatus,
      totalAmount: totalPrice.toString(),
      depositAmount: (totalPrice * 0.3).toString(),
      depositPaid: false,
      notes: ""
    };

    updateBooking.mutate(bookingData);
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      deleteBooking.mutate();
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setSelectedDates([]);
    setSelectedVenue("");
    setGuestCount(1);
    setSelectedPackage("");
    setSelectedServices([]);
    setEventName("");
    setSelectedCustomer("");
    setEventStatus("inquiry");
    setShowNewCustomerForm(false);
    setNewCustomer({ name: "", email: "", phone: "", company: "" });
  };

  const handleCreateCustomer = () => {
    if (!newCustomer.name || !newCustomer.email) {
      toast({
        title: "Required fields missing",
        description: "Please provide customer name and email",
        variant: "destructive"
      });
      return;
    }
    createCustomer.mutate(newCustomer);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0 overflow-hidden flex flex-col" aria-describedby="edit-event-description">
        <DialogTitle className="sr-only">Edit Event</DialogTitle>
        <div id="edit-event-description" className="sr-only">
          Edit event booking with date selection, venue configuration, and customer details.
        </div>

        <div className="flex h-full">
          {/* Sidebar - Steps */}
          {currentStep > 1 && (
            <div className="w-80 bg-slate-50 border-r border-slate-200 p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-slate-900 mb-3">Selected Date & Venue</h3>
                  {selectedDates.length > 0 ? (
                    <div className="space-y-2">
                      {selectedDates.map((slot, index) => (
                        <Card key={index} className="p-3 bg-white">
                          <div className="text-sm font-medium">{format(slot.date, 'MMM d, yyyy')}</div>
                          <div className="text-xs text-slate-600">
                            {slot.startTime} - {slot.endTime}
                          </div>
                          <div className="text-xs text-slate-600">
                            {selectedVenueData?.name}
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500">No dates selected</div>
                  )}
                </div>

                {currentStep >= 2 && (
                  <div>
                    <h3 className="font-medium text-slate-900 mb-3">Configuration</h3>
                    <div className="space-y-2 text-sm">
                      <div>Guest Count: <span className="font-medium">{guestCount}</span></div>
                      {selectedPackageData && (
                        <div>Package: <span className="font-medium">{selectedPackageData.name}</span></div>
                      )}
                      {selectedServices.length > 0 && (
                        <div>Services: <span className="font-medium">{selectedServices.length} selected</span></div>
                      )}
                    </div>
                  </div>
                )}

                {currentStep >= 3 && (
                  <div>
                    <h3 className="font-medium text-slate-900 mb-3">Event Details</h3>
                    <div className="space-y-2 text-sm">
                      <div>Event: <span className="font-medium">{eventName}</span></div>
                      <div>Status: <Badge className="text-xs">{eventStatus}</Badge></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Main content area */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="border-b border-slate-200 p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {currentStep > 1 && (
                  <Button variant="ghost" size="sm" onClick={prevStep}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                )}
                <div className="flex items-center gap-3">
                  <Edit className="h-5 w-5 text-blue-600" />
                  <h2 className="text-xl font-semibold">Edit Event</h2>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={resetForm}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Step Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {/* Step 1: Date & Venue Selection */}
              {currentStep === 1 && (
                <div className="grid grid-cols-2 gap-8 h-full">
                  {/* Left: Calendar */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <Button
                        variant="ghost" 
                        size="sm"
                        onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <h3 className="text-lg font-semibold">
                        {format(currentDate, 'MMMM yyyy')}
                      </h3>
                      <Button
                        variant="ghost" 
                        size="sm"
                        onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="p-2 text-center text-sm font-medium text-slate-600">
                          {day}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {paddedDays.map((day, index) => {
                        const isCurrentMonth = isSameMonth(day, currentDate);
                        const isSelected = selectedDates.some(d => isSameDay(d.date, day));
                        
                        return (
                          <button
                            key={index}
                            onClick={() => handleDateClick(day)}
                            className={cn(
                              "h-12 w-12 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                              isCurrentMonth 
                                ? "text-slate-900 hover:bg-slate-100" 
                                : "text-slate-400",
                              isSelected && "bg-blue-600 text-white hover:bg-blue-700"
                            )}
                          >
                            {format(day, 'd')}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right: Venue & Time Configuration */}
                  <div className="space-y-6">
                    <div>
                      <Label className="text-base font-medium">Venue</Label>
                      <Select value={selectedVenue} onValueChange={setSelectedVenue}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select a venue (property)" />
                        </SelectTrigger>
                        <SelectContent>
                          {(venues as any[]).map((venue: any) => (
                            <SelectItem key={venue.id} value={venue.id}>
                              {venue.name} - {venue.spaces?.length || 0} spaces available
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedVenueData && (
                        <div className="mt-2 p-3 bg-slate-50 rounded border">
                          <p className="text-sm text-slate-600 mb-2">Available spaces in this venue:</p>
                          <div className="space-y-1">
                            {selectedVenueData.spaces?.map((space: any) => (
                              <div key={space.id} className="text-sm">
                                <span className="font-medium">{space.name}</span> - {space.capacity} guests
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Time Slots Configuration */}
                    {selectedDates.length > 0 && (
                      <div>
                        <Label className="text-base font-medium">Time Slots & Spaces</Label>
                        <div className="mt-2 space-y-3">
                          {selectedDates.map((slot, index) => (
                            <Card key={index} className="p-4">
                              <div className="text-sm font-medium mb-3">
                                {format(slot.date, 'EEEE, MMMM d, yyyy')}
                              </div>
                              
                              <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <Label className="text-xs">Start Time</Label>
                                  <Input
                                    type="time"
                                    value={slot.startTime}
                                    onChange={(e) => updateDateSlot(index, 'startTime', e.target.value)}
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">End Time</Label>
                                  <Input
                                    type="time"
                                    value={slot.endTime}
                                    onChange={(e) => updateDateSlot(index, 'endTime', e.target.value)}
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Space</Label>
                                  <Select 
                                    value={slot.spaceId || ""} 
                                    onValueChange={(value) => updateDateSlot(index, 'spaceId', value)}
                                  >
                                    <SelectTrigger className="mt-1">
                                      <SelectValue placeholder="Select space" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {selectedVenueData?.spaces?.map((space: any) => (
                                        <SelectItem key={space.id} value={space.id}>
                                          {space.name} ({space.capacity} max)
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Event Configuration */}
              {currentStep === 2 && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Event Configuration</h3>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <Label className="text-base font-medium">Guest Count</Label>
                        <div className="mt-2 flex items-center gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="text-lg font-medium px-4">{guestCount}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setGuestCount(guestCount + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Package Selection */}
                  <div>
                    <Label className="text-base font-medium">Event Package</Label>
                    <div className="mt-3 grid grid-cols-1 gap-4 max-h-60 overflow-y-auto">
                      <div className="grid grid-cols-1 gap-3">
                        <div
                          className={cn(
                            "p-4 border rounded-lg cursor-pointer transition-all",
                            !selectedPackage ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"
                          )}
                          onClick={() => setSelectedPackage("")}
                        >
                          <div className="font-medium">No Package</div>
                          <div className="text-sm text-slate-600">Build custom event with individual services</div>
                          <div className="text-lg font-semibold text-green-600 mt-2">$0.00</div>
                        </div>
                        
                        {(packages as any[]).map((pkg: any) => (
                          <div
                            key={pkg.id}
                            className={cn(
                              "p-4 border rounded-lg cursor-pointer transition-all",
                              selectedPackage === pkg.id ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"
                            )}
                            onClick={() => setSelectedPackage(pkg.id)}
                          >
                            <div className="font-medium">{pkg.name}</div>
                            <div className="text-sm text-slate-600">{pkg.description}</div>
                            <div className="text-lg font-semibold text-green-600 mt-2">
                              ${pkg.pricingModel === 'per_person' 
                                ? `${parseFloat(pkg.price)} per person` 
                                : parseFloat(pkg.price).toFixed(2)}
                            </div>
                            {pkg.pricingModel === 'per_person' && (
                              <div className="text-sm text-slate-500">
                                Total: ${(parseFloat(pkg.price) * guestCount).toFixed(2)} for {guestCount} guests
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Services Selection */}
                  <div>
                    <Label className="text-base font-medium">Additional Services</Label>
                    <div className="mt-3 grid grid-cols-2 gap-4 max-h-60 overflow-y-auto">
                      {(services as any[]).map((service: any) => {
                        const isSelected = selectedServices.includes(service.id);
                        const servicePrice = service.pricingModel === 'per_person' 
                          ? parseFloat(service.price) * guestCount 
                          : parseFloat(service.price);
                        
                        return (
                          <div
                            key={service.id}
                            className={cn(
                              "p-3 border rounded-lg cursor-pointer transition-all",
                              isSelected ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"
                            )}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedServices(prev => prev.filter(id => id !== service.id));
                              } else {
                                setSelectedServices(prev => [...prev, service.id]);
                              }
                            }}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-sm">{service.name}</div>
                                <div className="text-xs text-slate-600 mt-1">{service.description}</div>
                                <div className="text-sm font-semibold text-green-600 mt-2">
                                  ${servicePrice.toFixed(2)}
                                  {service.pricingModel === 'per_person' && (
                                    <span className="text-xs text-slate-500"> (${service.price}/person)</span>
                                  )}
                                </div>
                              </div>
                              <Checkbox checked={isSelected} className="ml-2" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Final Details */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Final Event Details</h3>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label className="text-base font-medium">Event Name *</Label>
                      <Input
                        value={eventName}
                        onChange={(e) => setEventName(e.target.value)}
                        placeholder="Enter event name"
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-base font-medium">Customer *</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowNewCustomerForm(!showNewCustomerForm)}
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          {showNewCustomerForm ? "Cancel" : "New Customer"}
                        </Button>
                      </div>
                      
                      {!showNewCustomerForm ? (
                        <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select customer" />
                          </SelectTrigger>
                          <SelectContent>
                            {(customers as any[]).map((customer: any) => (
                              <SelectItem key={customer.id} value={customer.id}>
                                {customer.name} - {customer.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Card className="p-4 border-blue-200 bg-blue-50">
                          <div className="space-y-4">
                            <h4 className="font-medium text-sm">Create New Customer</h4>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-sm">Name *</Label>
                                <Input
                                  value={newCustomer.name}
                                  onChange={(e) => setNewCustomer(prev => ({...prev, name: e.target.value}))}
                                  placeholder="Customer name"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-sm">Email *</Label>
                                <Input
                                  type="email"
                                  value={newCustomer.email}
                                  onChange={(e) => setNewCustomer(prev => ({...prev, email: e.target.value}))}
                                  placeholder="customer@example.com"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-sm">Phone</Label>
                                <Input
                                  value={newCustomer.phone}
                                  onChange={(e) => setNewCustomer(prev => ({...prev, phone: e.target.value}))}
                                  placeholder="(555) 123-4567"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-sm">Company</Label>
                                <Input
                                  value={newCustomer.company}
                                  onChange={(e) => setNewCustomer(prev => ({...prev, company: e.target.value}))}
                                  placeholder="Company name"
                                  className="mt-1"
                                />
                              </div>
                            </div>
                            <Button
                              type="button"
                              onClick={handleCreateCustomer}
                              disabled={createCustomer.isPending || !newCustomer.name || !newCustomer.email}
                              className="w-full bg-blue-600 hover:bg-blue-700"
                            >
                              {createCustomer.isPending ? "Creating..." : "Create Customer"}
                            </Button>
                          </div>
                        </Card>
                      )}
                    </div>

                    <div>
                      <Label className="text-base font-medium">Event Status</Label>
                      <Select value={eventStatus} onValueChange={setEventStatus}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="inquiry">Inquiry</SelectItem>
                          <SelectItem value="proposal">Proposal Sent</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Event Summary */}
                  <div className="border-t pt-6">
                    <h4 className="font-medium mb-4">Event Summary</h4>
                    <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-slate-600">Event:</span>
                          <div className="font-medium">{eventName || "Untitled Event"}</div>
                        </div>
                        <div>
                          <span className="text-slate-600">Guest Count:</span>
                          <div className="font-medium">{guestCount}</div>
                        </div>
                        <div>
                          <span className="text-slate-600">Venue:</span>
                          <div className="font-medium">{selectedVenueData?.name || "No venue selected"}</div>
                        </div>
                        <div>
                          <span className="text-slate-600">Status:</span>
                          <Badge className="ml-2">{eventStatus}</Badge>
                        </div>
                      </div>
                      
                      {selectedDates.length > 0 && (
                        <div>
                          <span className="text-slate-600 text-sm">Dates & Times:</span>
                          {selectedDates.map((slot, index) => (
                            <div key={index} className="font-medium text-sm">
                              {format(slot.date, 'MMM d, yyyy')} • {slot.startTime} - {slot.endTime}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="border-t pt-3">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Total Amount:</span>
                          <span className="text-xl font-bold text-green-600">${totalPrice.toFixed(2)}</span>
                        </div>
                        <div className="text-sm text-slate-600 mt-1">
                          Includes {selectedPackageData ? 'package' : 'services'} and {selectedServices.length} additional services
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Fixed Footer */}
            <div className="border-t border-slate-200 p-6 flex justify-between items-center bg-white flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">Grand Total</span>
                  <span className="text-lg font-semibold">${totalPrice.toFixed(2)}</span>
                </div>
                
                <Button 
                  variant="outline" 
                  onClick={handleDelete}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Event
                </Button>
              </div>
              
              <div className="flex gap-3">
                {currentStep === 3 && (
                  <Button variant="outline" onClick={prevStep}>
                    Back
                  </Button>
                )}
                {currentStep < 3 ? (
                  <Button 
                    onClick={nextStep}
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={currentStep === 1 && selectedDates.length === 0}
                  >
                    {currentStep === 1 ? `Configure ${selectedDates.length} Event Slot(s)` : 'Next'}
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSubmit}
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={updateBooking.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateBooking.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}