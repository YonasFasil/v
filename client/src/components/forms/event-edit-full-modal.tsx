import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, getDay } from "date-fns";
import { ChevronLeft, ChevronRight, X, Plus, RotateCcw, Trash2, Save, Edit, Minus, FileText, Send, MessageSquare, Mail, Phone, Users, Grid3X3, MapPin } from "lucide-react";
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
  packageId?: string;
  selectedServices?: string[];
  guestCount?: number;
  itemQuantities?: Record<string, number>;
  pricingOverrides?: {
    packagePrice?: number;
    servicePrices?: Record<string, number>;
  };
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
  
  // Step 2: Event Configuration - now managed per date
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  
  // Copy config functionality
  const [showCopyModal, setShowCopyModal] = useState(false);
  
  // Package and service selection states
  const [showPackageSelection, setShowPackageSelection] = useState(false);
  const [showAdditionalServices, setShowAdditionalServices] = useState(false);
  
  // New service creation
  const [showNewServiceForm, setShowNewServiceForm] = useState(false);
  const [newService, setNewService] = useState({
    name: "",
    description: "",
    category: "addon",
    price: "",
    pricingModel: "fixed"
  });
  
  // Step 3: Final Details
  const [eventName, setEventName] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [eventStatus, setEventStatus] = useState("inquiry");
  
  // Communication state
  const [showCommunication, setShowCommunication] = useState(false);
  const [communicationMessage, setCommunicationMessage] = useState("");
  const [communicationType, setCommunicationType] = useState("email");
  
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
      if (booking.isContract && booking.contractEvents) {
        // Handle contract with multiple events
        setEventName(booking.contractInfo?.contractName || "Multi-Date Contract");
        setEventStatus(booking.status || "inquiry");
        setSelectedVenue(booking.venueId || "");
        setSelectedCustomer(booking.customerId || "");
        
        // Initialize all contract events as selected dates - preserve original dates
        const contractDates = booking.contractEvents.map((event: any) => ({
          date: event.eventDate ? new Date(event.eventDate) : new Date(),
          startTime: event.startTime || "09:00",
          endTime: event.endTime || "17:00",
          spaceId: event.spaceId,
          packageId: event.packageId || "",
          selectedServices: event.selectedServices || [],
          guestCount: event.guestCount || 1,
          itemQuantities: event.itemQuantities || {},
          pricingOverrides: event.pricingOverrides || {}
        }));
        
        setSelectedDates(contractDates);
        setActiveTabIndex(0);
      } else {
        // Handle single event
        setEventName(booking.eventName || "");
        setEventStatus(booking.status || "inquiry");
        setSelectedVenue(booking.venueId || "");
        setSelectedCustomer(booking.customerId || "");
        
        // Initialize dates with existing booking data - preserve original date
        const bookingDate: SelectedDate = {
          date: booking.eventDate ? new Date(booking.eventDate) : new Date(),
          startTime: booking.startTime || "09:00",
          endTime: booking.endTime || "17:00", 
          spaceId: booking.spaceId,
          packageId: booking.packageId || "",
          selectedServices: booking.selectedServices || [],
          guestCount: booking.guestCount || 1,
          itemQuantities: booking.itemQuantities || {},
          pricingOverrides: booking.pricingOverrides || {}
        };
        
        setSelectedDates([bookingDate]);
        setActiveTabIndex(0);
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

  // Per-date configuration helpers (same as create modal)
  const updateDateTime = (index: number, field: keyof SelectedDate, value: any) => {
    setSelectedDates(prev => prev.map((date, i) => 
      i === index ? { ...date, [field]: value } : date
    ));
  };

  const updateDateConfig = (field: keyof SelectedDate, value: any) => {
    if (activeDate) {
      updateDateTime(activeTabIndex, field, value);
    }
  };

  // Get active date configuration
  const activeDate = selectedDates[activeTabIndex];
  const selectedVenueData = (venues as any[]).find((v: any) => v.id === selectedVenue);
  const selectedPackageData = (packages as any[]).find((p: any) => p.id === activeDate?.packageId);

  // Calculate total price across all dates (same as create modal)
  const totalPrice = useMemo(() => {
    return selectedDates.reduce((total, dateConfig) => {
      let dateTotal = 0;
      
      // Package price
      if (dateConfig.packageId) {
        const pkg = (packages as any[]).find((p: any) => p.id === dateConfig.packageId);
        if (pkg) {
          const packagePrice = dateConfig.pricingOverrides?.packagePrice ?? parseFloat(pkg.price || 0);
          dateTotal += pkg.pricingModel === 'per_person' 
            ? packagePrice * (dateConfig.guestCount || 1)
            : packagePrice;
        }
      }
      
      // Services price
      dateConfig.selectedServices?.forEach(serviceId => {
        const service = (services as any[]).find((s: any) => s.id === serviceId);
        if (service) {
          const servicePrice = dateConfig.pricingOverrides?.servicePrices?.[serviceId] ?? parseFloat(service.price || 0);
          if (service.pricingModel === 'per_person') {
            dateTotal += servicePrice * (dateConfig.guestCount || 1);
          } else {
            const quantity = dateConfig.itemQuantities?.[serviceId] || 1;
            dateTotal += servicePrice * quantity;
          }
        }
      });
      
      return total + dateTotal;
    }, 0);
  }, [selectedDates, packages, services]);

  // Create customer mutation
  const createCustomer = useMutation({
    mutationFn: async (customerData: any) => {
      const response = await apiRequest("/api/customers", "POST", customerData);
      return response;
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

  // Create service mutation
  const createService = useMutation({
    mutationFn: async (serviceData: any) => {
      const response = await apiRequest("/api/services", "POST", serviceData);
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      // Auto-select the new service if on the services configuration step
      if (activeDate) {
        updateDateConfig('selectedServices', [...(activeDate.selectedServices || []), data.id]);
      }
      setShowNewServiceForm(false);
      setNewService({ name: "", description: "", category: "addon", price: "", pricingModel: "fixed" });
      toast({ title: "Service created successfully!" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to create service", description: error.message, variant: "destructive" });
    }
  });

  const updateBooking = useMutation({
    mutationFn: async (bookingData: any) => {
      const response = await apiRequest(`/api/bookings/${booking.id}`, "PATCH", bookingData);
      return response;
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
      const response = await apiRequest(`/api/bookings/${booking.id}`, "DELETE");
      return response;
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

  // Handle new service creation
  const handleCreateNewService = () => {
    if (!newService.name.trim() || !newService.price.trim()) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    createService.mutate({
      ...newService,
      price: parseFloat(newService.price)
    });
  };

  // Copy configuration to other dates
  const copyConfigToOtherDates = () => {
    if (!activeDate) return;
    
    const configToCopy = {
      packageId: activeDate.packageId,
      selectedServices: activeDate.selectedServices,
      itemQuantities: activeDate.itemQuantities,
      pricingOverrides: activeDate.pricingOverrides
    };
    
    setSelectedDates(prev => prev.map(date => 
      date === activeDate ? date : { ...date, ...configToCopy }
    ));
    
    setShowCopyModal(false);
    toast({ title: "Configuration copied successfully!" });
  };

  const handleDateClick = (day: Date) => {
    if (!isSameMonth(day, currentDate)) return;
    
    const existingIndex = selectedDates.findIndex(d => isSameDay(d.date, day));
    if (existingIndex >= 0) {
      setSelectedDates(prev => prev.filter((_, i) => i !== existingIndex));
      if (activeTabIndex >= selectedDates.length - 1) {
        setActiveTabIndex(Math.max(0, selectedDates.length - 2));
      }
    } else {
      setSelectedDates(prev => [...prev, {
        date: day,
        startTime: "09:00 AM",
        endTime: "05:00 PM",
        spaceId: selectedVenueData?.spaces?.[0]?.id || "",
        guestCount: 1,
        packageId: "",
        selectedServices: [],
        itemQuantities: {},
        pricingOverrides: {}
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

    // For multi-date events, we'll submit the primary date
    const primaryDate = selectedDates[0];
    const bookingData = {
      eventName,
      eventType: selectedPackageData?.name || "Custom Event",
      eventDate: primaryDate.date,
      startTime: primaryDate.startTime,
      endTime: primaryDate.endTime,
      guestCount: primaryDate.guestCount || 1,
      venueId: selectedVenue,
      spaceId: primaryDate.spaceId,
      packageId: primaryDate.packageId || null,
      selectedServices: primaryDate.selectedServices || [],
      customerId: selectedCustomer,
      status: eventStatus,
      totalAmount: totalPrice.toString(),
      depositAmount: (totalPrice * 0.3).toString(),
      depositPaid: false,
      notes: "",
      itemQuantities: primaryDate.itemQuantities || {},
      pricingOverrides: primaryDate.pricingOverrides || {}
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

  const handleCreateService = () => {
    if (!newService.name || !newService.price) {
      toast({
        title: "Required fields missing",
        description: "Please provide service name and price",
        variant: "destructive"
      });
      return;
    }
    
    const serviceData = {
      ...newService,
      price: parseFloat(newService.price)
    };
    
    createService.mutate(serviceData);
  };

  // Copy configuration functionality
  const handleCopyConfig = (targetDateIndices: number[]) => {
    if (!activeDate) return;
    
    const configToCopy = {
      packageId: activeDate.packageId,
      selectedServices: activeDate.selectedServices,
      guestCount: activeDate.guestCount,
      itemQuantities: activeDate.itemQuantities,
      pricingOverrides: activeDate.pricingOverrides
    };
    
    setSelectedDates(prev => prev.map((date, index) => 
      targetDateIndices.includes(index) 
        ? { ...date, ...configToCopy }
        : date
    ));
    
    setShowCopyModal(false);
    toast({ title: "Configuration copied successfully!" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-6xl max-h-[90vh] p-0 flex flex-col mx-2 sm:mx-4 overflow-hidden">
        <DialogTitle className="sr-only">Edit Event</DialogTitle>
        <DialogDescription className="sr-only">
          Edit event booking with date selection, venue configuration, and customer details.
        </DialogDescription>

        <div className="flex h-full overflow-hidden">
          {/* Sidebar - Steps */}
          {currentStep > 1 && (
            <div className="hidden lg:block w-80 bg-slate-50 border-r border-slate-200 p-6 overflow-y-auto flex-shrink-0">
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
                      {activeDate && (
                        <>
                          <div>Guest Count: <span className="font-medium">{activeDate.guestCount}</span></div>
                          {selectedPackageData && (
                            <div>Package: <span className="font-medium">{selectedPackageData.name}</span></div>
                          )}
                          {activeDate.selectedServices && activeDate.selectedServices.length > 0 && (
                            <div>Services: <span className="font-medium">{activeDate.selectedServices.length} selected</span></div>
                          )}
                        </>
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
          <div className="flex-1 flex flex-col min-h-0">
            {/* Header */}
            <div className="border-b border-slate-200 p-3 sm:p-6 flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  {currentStep > 1 && (
                    <Button variant="ghost" size="sm" onClick={prevStep}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  )}
                  <div className="flex items-center gap-3">
                    <Edit className="h-5 w-5 text-blue-600" />
                    <h2 className="text-lg sm:text-xl font-semibold">
                      {booking?.isContract ? "Edit Contract" : "Edit Event"}
                    </h2>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" onClick={resetForm}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </div>
              
              {/* Contract Summary */}
              {booking?.isContract && booking?.contractInfo && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                          Contract
                        </Badge>
                        <h3 className="font-semibold text-purple-900">
                          {booking.contractInfo.contractName || "Multi-Date Contract"}
                        </h3>
                      </div>
                      <div className="text-sm text-purple-700 space-y-1">
                        <div className="flex items-center gap-4">
                          <span>{booking.eventCount} events scheduled</span>
                          <span>Total {booking.contractEvents?.reduce((sum: number, event: any) => sum + (event.guestCount || 0), 0)} guests</span>
                        </div>
                        <div className="text-xs">
                          Event dates: {booking.contractEvents?.map((event: any) => 
                            format(new Date(event.eventDate), "MMM d, yyyy")
                          ).join(" • ")}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-purple-900">
                        Total Contract Value
                      </div>
                      <div className="text-lg font-bold text-purple-800">
                        ${booking.contractEvents?.reduce((sum: number, event: any) => 
                          sum + parseFloat(event.totalAmount || '0'), 0
                        ).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Step Content */}
            <div className="flex-1 overflow-hidden">
              <div className="h-full p-3 sm:p-6 overflow-y-auto">
                {/* Step 1: Date & Venue Selection */}
              {currentStep === 1 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 h-full">
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
                        <div className="mt-3 space-y-3 max-h-64 overflow-y-auto">
                          {selectedDates.map((slot, index) => (
                            <Card key={index} className="group relative overflow-hidden border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all duration-200">
                              {/* Modern gradient header */}
                              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-100 p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-semibold text-sm">
                                      {format(slot.date, 'd')}
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-slate-900 text-sm">
                                        {format(slot.date, 'EEEE, MMMM d')}
                                      </h4>
                                      <p className="text-xs text-slate-600 mt-0.5">
                                        {format(slot.date, 'yyyy')}
                                      </p>
                                    </div>
                                  </div>
                                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                                    Available
                                  </Badge>
                                </div>
                              </div>
                              
                              {/* Configuration content */}
                              <div className="p-4">
                                <div className="grid grid-cols-3 gap-3">
                                  <div>
                                    <Label className="text-xs font-medium text-slate-700">Start Time</Label>
                                    <Input
                                      type="time"
                                      value={slot.startTime}
                                      onChange={(e) => updateDateSlot(index, 'startTime', e.target.value)}
                                      className="mt-1 h-8"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs font-medium text-slate-700">End Time</Label>
                                    <Input
                                      type="time"
                                      value={slot.endTime}
                                      onChange={(e) => updateDateSlot(index, 'endTime', e.target.value)}
                                      className="mt-1 h-8"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs font-medium text-slate-700">Space</Label>
                                    <Select 
                                      value={slot.spaceId || ""} 
                                      onValueChange={(value) => updateDateSlot(index, 'spaceId', value)}
                                    >
                                      <SelectTrigger className="mt-1 h-8">
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
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Configure Each Event Date</h3>
                    {selectedDates.length > 1 && (
                      <span className="text-sm text-slate-600">
                        {selectedDates.length} dates selected
                      </span>
                    )}
                  </div>

                  {/* Date Configuration Tabs */}
                  {selectedDates.length > 0 && (
                    <div className="space-y-6">
                      {/* Tab Navigation */}
                      {selectedDates.length > 1 && (
                        <div className="flex gap-2 p-1 bg-slate-100 rounded-lg overflow-x-auto">
                          {selectedDates.map((date, index) => (
                            <button
                              key={index}
                              onClick={() => setActiveTabIndex(index)}
                              className={cn(
                                "px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors",
                                activeTabIndex === index 
                                  ? "bg-white text-slate-900 shadow-sm" 
                                  : "text-slate-600 hover:text-slate-900"
                              )}
                            >
                              {format(date.date, 'MMM d')}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Active Date Configuration */}
                      {activeDate && (
                        <div className="space-y-6">
                          {/* Package & Services Configuration - Full Width */}
                          <div className="space-y-6">
                            {/* Modern gradient header for current date */}
                            <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
                              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-100 p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-semibold text-sm">
                                      {format(activeDate.date, 'd')}
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-slate-900 text-sm">
                                        {format(activeDate.date, 'EEEE, MMMM d')}
                                      </h4>
                                      <p className="text-xs text-slate-600 mt-0.5">
                                        {activeDate.startTime} - {activeDate.endTime}
                                      </p>
                                    </div>
                                  </div>
                                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                                    Configuring
                                  </Badge>
                                </div>
                              </div>
                              
                              {/* Configuration content inside the card */}
                              <div className="p-4">
                                <div className="flex items-center gap-6">
                              {/* Guests Field - Simplified */}
                              <div className="flex items-center gap-2">
                                <Label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                                  <Users className="w-4 h-4 text-slate-500" />
                                  Guests
                                  <span className="text-red-500 text-xs">*</span>
                                </Label>
                                <Input
                                  type="number"
                                  min="1"
                                  max="999"
                                  value={activeDate.guestCount || 1}
                                  onChange={(e) => {
                                    const value = Math.max(1, Math.min(999, parseInt(e.target.value) || 1));
                                    updateDateConfig('guestCount', value);
                                  }}
                                  className="w-20 h-8 text-center text-sm"
                                />
                                {(() => {
                                  const selectedSpace = selectedVenueData?.spaces?.find((space: any) => space.id === activeDate.spaceId);
                                  const guestCount = activeDate.guestCount || 1;
                                  const capacity = selectedSpace?.capacity || 0;
                                  
                                  if (selectedSpace && guestCount > capacity) {
                                    return (
                                      <span className="text-xs text-amber-600">
                                        Exceeds capacity ({capacity})
                                      </span>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>

                              {/* Setup Style Field with Floor Plan Integration */}
                              <div className="flex items-center gap-2">
                                <Label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                                  <Grid3X3 className="w-4 h-4 text-slate-500" />
                                  Setup Style
                                </Label>
                                <div className="flex items-center gap-2">
                                  <Select
                                    value={activeDate.setupStyle || ''}
                                    onValueChange={(value) => updateDateConfig('setupStyle', value)}
                                  >
                                    <SelectTrigger className="w-40 h-8 text-sm">
                                      <SelectValue placeholder="Select style" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="round-tables">Round Tables</SelectItem>
                                      <SelectItem value="u-shape">U-Shape</SelectItem>
                                      <SelectItem value="classroom">Classroom</SelectItem>
                                      <SelectItem value="theater">Theater</SelectItem>
                                      <SelectItem value="cocktail">Cocktail</SelectItem>
                                      <SelectItem value="banquet">Banquet</SelectItem>
                                      <SelectItem value="conference">Conference</SelectItem>
                                      <SelectItem value="custom">Custom</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  {activeDate.setupStyle && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-8 px-3 text-xs"
                                      onClick={() => {
                                        // Open floor plan designer for this setup style
                                        toast({
                                          title: "Floor Plan Designer",
                                          description: "Visit Floor Plans & Setup section to design custom layouts for this setup style"
                                        });
                                      }}
                                    >
                                      <Grid3X3 className="w-3 h-3 mr-1" />
                                      Edit Layout
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                            </Card>

                          <div className="space-y-6">
                            {/* Package & Services - Full Width */}
                            <div className="space-y-4">

                              {/* Package Selection */}
                              <div>
                                <div className="flex items-center justify-between mb-3">
                                  <Label className="text-base font-medium">Event Package</Label>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowPackageSelection(!showPackageSelection)}
                                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                  >
                                    {showPackageSelection ? "Hide Packages" : "Show Packages"}
                                  </Button>
                                </div>
                                
                                {showPackageSelection && (
                                  <div className="mt-3 max-h-80 overflow-y-auto">
                                  <div className="grid grid-cols-1 gap-3">
                                    <div
                                      className={cn(
                                        "p-3 border rounded-lg cursor-pointer transition-all relative",
                                        !activeDate.packageId ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"
                                      )}
                                      onClick={() => updateDateConfig('packageId', "")}
                                    >
                                      {!activeDate.packageId && (
                                        <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                          </svg>
                                        </div>
                                      )}
                                      <div className="font-medium text-sm">No Package</div>
                                      <div className="text-xs text-slate-600 mt-1">Build custom event with individual services</div>
                                      <div className="text-sm font-semibold text-green-600 mt-2">$0.00</div>
                                    </div>
                                    
                                    {(packages as any[]).map((pkg: any) => {
                                      const isSelected = activeDate.packageId === pkg.id;
                                      const basePrice = parseFloat(pkg.price);
                                      const overridePrice = activeDate.pricingOverrides?.packagePrice;
                                      const displayPrice = overridePrice ?? basePrice;
                                      const totalPrice = pkg.pricingModel === 'per_person' 
                                        ? displayPrice * (activeDate.guestCount || 1)
                                        : displayPrice;
                                      
                                      return (
                                        <div
                                          key={pkg.id}
                                          className={cn(
                                            "p-3 border rounded-lg cursor-pointer transition-all relative",
                                            isSelected ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"
                                          )}
                                          onClick={() => updateDateConfig('packageId', pkg.id)}
                                        >
                                          {isSelected && (
                                            <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                              </svg>
                                            </div>
                                          )}
                                          
                                          <div className="pr-8">
                                            <div className="font-medium text-sm">{pkg.name}</div>
                                            <div className="text-xs text-slate-600 mt-1">{pkg.description}</div>
                                            
                                            {/* Included Services */}
                                            {pkg.includedServiceIds && pkg.includedServiceIds.length > 0 && (
                                              <div className="mt-2">
                                                <div className="text-xs text-slate-500 mb-1">Includes:</div>
                                                <div className="space-y-1">
                                                  {pkg.includedServiceIds.map((serviceId: string) => {
                                                    const service = (services as any[]).find((s: any) => s.id === serviceId);
                                                    if (!service) return null;
                                                    
                                                    return (
                                                      <div key={serviceId} className="flex items-center justify-between">
                                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                                          {service.name}
                                                        </span>
                                                        {isSelected && service.pricingModel !== 'per_person' && (
                                                          <div className="flex items-center gap-1">
                                                            <span className="text-xs">Qty:</span>
                                                            <Input
                                                              type="number"
                                                              min="1"
                                                              value={activeDate.itemQuantities?.[serviceId] || 1}
                                                              onChange={(e) => {
                                                                const newQuantities = {
                                                                  ...activeDate.itemQuantities,
                                                                  [serviceId]: Math.max(1, parseInt(e.target.value, 10) || 1)
                                                                };
                                                                updateDateConfig('itemQuantities', newQuantities);
                                                              }}
                                                              className="w-12 h-6 text-xs text-center"
                                                            />
                                                          </div>
                                                        )}
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              </div>
                                            )}
                                            
                                            <div className="text-sm font-semibold text-green-600 mt-2">
                                              ${pkg.pricingModel === 'per_person' 
                                                ? `${displayPrice} per person` 
                                                : displayPrice.toFixed(2)}
                                            </div>
                                            {pkg.pricingModel === 'per_person' && (
                                              <div className="text-xs text-slate-500">
                                                Total: ${totalPrice.toFixed(2)} for {activeDate.guestCount || 1} guests
                                              </div>
                                            )}
                                            
                                            {/* Package Price Override */}
                                            {isSelected && (
                                              <div className="mt-2 pt-2 border-t border-slate-200">
                                                <div className="flex items-center gap-2">
                                                  <span className="text-xs">Custom Price: $</span>
                                                  <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={activeDate.pricingOverrides?.packagePrice ?? ''}
                                                    onChange={(e) => {
                                                      const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                                                      updateDateConfig('pricingOverrides', {
                                                        ...activeDate.pricingOverrides,
                                                        packagePrice: value
                                                      });
                                                    }}
                                                    className="w-20 h-6 text-xs"
                                                    placeholder={pkg.price}
                                                  />
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  </div>
                                )}
                              </div>

                              {/* Services Selection */}
                              <div>
                                <div className="flex items-center justify-between mb-3">
                                  <Label className="text-base font-medium">Additional Services</Label>
                                  <div className="flex gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setShowAdditionalServices(!showAdditionalServices)}
                                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                    >
                                      {showAdditionalServices ? "Hide Services" : "Show Services"}
                                    </Button>
                                    {showAdditionalServices && (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowNewServiceForm(!showNewServiceForm)}
                                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                      >
                                        <Plus className="w-4 h-4 mr-1" />
                                        {showNewServiceForm ? "Cancel" : "New Service"}
                                      </Button>
                                    )}
                                  </div>
                                </div>

                                {showAdditionalServices && (
                                  <div>
                                    {/* New Service Form */}
                                    {showNewServiceForm && (
                                      <Card className="p-4 mb-4 border-blue-200 bg-blue-50">
                                        <h5 className="font-medium mb-3">Create New Service</h5>
                                        <div className="grid grid-cols-2 gap-3">
                                          <div>
                                            <Label className="text-xs">Name *</Label>
                                            <Input
                                              value={newService.name}
                                              onChange={(e) => setNewService(prev => ({ ...prev, name: e.target.value }))}
                                              placeholder="Service name"
                                              className="mt-1 h-8 text-xs"
                                            />
                                          </div>
                                          <div>
                                            <Label className="text-xs">Price *</Label>
                                            <Input
                                              type="number"
                                              step="0.01"
                                              value={newService.price}
                                              onChange={(e) => setNewService(prev => ({ ...prev, price: e.target.value }))}
                                              placeholder="0.00"
                                              className="mt-1 h-8 text-xs"
                                            />
                                          </div>
                                          <div className="col-span-2">
                                            <Label className="text-xs">Description</Label>
                                            <Input
                                              value={newService.description}
                                              onChange={(e) => setNewService(prev => ({ ...prev, description: e.target.value }))}
                                              placeholder="Service description"
                                              className="mt-1 h-8 text-xs"
                                            />
                                          </div>
                                        </div>
                                        <div className="flex gap-2 mt-3">
                                          <Button
                                            type="button"
                                            size="sm"
                                            onClick={handleCreateNewService}
                                            disabled={createService.isPending}
                                            className="bg-blue-600 hover:bg-blue-700"
                                          >
                                            {createService.isPending ? "Creating..." : "Create Service"}
                                          </Button>
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowNewServiceForm(false)}
                                          >
                                            Cancel
                                          </Button>
                                        </div>
                                      </Card>
                                    )}

                                    <div className="mt-3 space-y-3 max-h-80 overflow-y-auto">
                                      {(services as any[]).map((service: any) => {
                                        const isSelected = activeDate.selectedServices?.includes(service.id) || false;
                                        const basePrice = parseFloat(service.price || 0);
                                        const overridePrice = activeDate.pricingOverrides?.servicePrices?.[service.id];
                                        const displayPrice = overridePrice ?? basePrice;
                                        
                                        return (
                                          <label key={service.id} className="block">
                                            <div className={cn(
                                              "p-3 border rounded-lg cursor-pointer transition-all",
                                              isSelected ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"
                                            )}>
                                              <div className="flex items-start gap-3">
                                                <Checkbox 
                                                  checked={isSelected}
                                                  onCheckedChange={() => {
                                                    const currentServices = activeDate.selectedServices || [];
                                                const newServices = isSelected 
                                                  ? currentServices.filter(id => id !== service.id)
                                                  : [...currentServices, service.id];
                                                updateDateConfig('selectedServices', newServices);
                                              }}
                                            />
                                            <div className="flex-1">
                                              <div className="font-medium text-sm">{service.name}</div>
                                              <div className="text-xs text-slate-600 mt-1">{service.description}</div>
                                            </div>
                                          </div>
                                          
                                          {isSelected && (
                                            <div className="mt-3 pt-3 border-t border-slate-200 flex items-center gap-4">
                                              {service.pricingModel !== 'per_person' && (
                                                <div className="flex items-center gap-2">
                                                  <span className="text-sm">Qty:</span>
                                                  <Input
                                                    type="number"
                                                    min="1"
                                                    value={activeDate.itemQuantities?.[service.id] || 1}
                                                    onChange={(e) => {
                                                      const newQuantities = {
                                                        ...activeDate.itemQuantities,
                                                        [service.id]: Math.max(1, parseInt(e.target.value, 10) || 1)
                                                      };
                                                      updateDateConfig('itemQuantities', newQuantities);
                                                    }}
                                                    className="w-16 h-8 text-xs"
                                                  />
                                                </div>
                                              )}
                                              <div className="flex items-center gap-1">
                                                <span className="text-sm">$</span>
                                                <Input
                                                  type="number"
                                                  step="0.01"
                                                  value={activeDate.pricingOverrides?.servicePrices?.[service.id] ?? ''}
                                                  onChange={(e) => {
                                                    const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                                                    updateDateConfig('pricingOverrides', {
                                                      ...activeDate.pricingOverrides,
                                                      servicePrices: {
                                                        ...activeDate.pricingOverrides?.servicePrices,
                                                        [service.id]: value
                                                      }
                                                    });
                                                  }}
                                                  className="w-20 h-8 text-xs"
                                                  placeholder={service.price}
                                                />
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </label>
                                    );
                                  })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Copy Config for Multi-Date Events */}
                            {selectedDates.length > 1 && (
                              <Card className="p-4 border-blue-200 bg-blue-50">
                                <h5 className="font-medium mb-2">Copy Configuration</h5>
                                <p className="text-sm text-slate-600 mb-3">
                                  Copy this date's configuration to other dates
                                </p>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setShowCopyModal(true)}
                                  className="w-full"
                                >
                                  Copy to Other Dates
                                </Button>
                              </Card>
                            )}

                            {/* Price Summary */}
                            <Card className="p-4">
                              <h5 className="font-medium mb-3">Price Summary</h5>
                              <div className="space-y-2 text-sm">
                                {selectedPackageData && (
                                  <div className="flex justify-between">
                                    <span>{selectedPackageData.name}</span>
                                    <span>
                                      ${selectedPackageData.pricingModel === 'per_person' 
                                        ? (parseFloat(selectedPackageData.price) * (activeDate.guestCount || 1)).toFixed(2)
                                        : parseFloat(selectedPackageData.price).toFixed(2)}
                                    </span>
                                  </div>
                                )}
                                
                                {activeDate.selectedServices?.map(serviceId => {
                                  const service = (services as any[]).find((s: any) => s.id === serviceId);
                                  if (!service) return null;
                                  
                                  const basePrice = parseFloat(service.price || 0);
                                  const overridePrice = activeDate.pricingOverrides?.servicePrices?.[serviceId];
                                  const price = overridePrice ?? basePrice;
                                  const quantity = activeDate.itemQuantities?.[serviceId] || 1;
                                  const total = service.pricingModel === 'per_person' 
                                    ? price * (activeDate.guestCount || 1)
                                    : price * quantity;
                                  
                                  return (
                                    <div key={serviceId} className="flex justify-between">
                                      <span>{service.name}</span>
                                      <span>${total.toFixed(2)}</span>
                                    </div>
                                  );
                                })}
                                
                                <div className="border-t border-slate-200 pt-2 flex justify-between font-medium">
                                  <span>Date Total</span>
                                  <span>${(
                                    (selectedPackageData && activeDate.packageId ? 
                                      (selectedPackageData.pricingModel === 'per_person' 
                                        ? parseFloat(selectedPackageData.price) * (activeDate.guestCount || 1)
                                        : parseFloat(selectedPackageData.price)) : 0) +
                                    (activeDate.selectedServices?.reduce((sum, serviceId) => {
                                      const service = (services as any[]).find((s: any) => s.id === serviceId);
                                      if (!service) return sum;
                                      const price = activeDate.pricingOverrides?.servicePrices?.[serviceId] ?? parseFloat(service.price || 0);
                                      const quantity = activeDate.itemQuantities?.[serviceId] || 1;
                                      return sum + (service.pricingModel === 'per_person' ? price * (activeDate.guestCount || 1) : price * quantity);
                                    }, 0) || 0)
                                  ).toFixed(2)}</span>
                                </div>
                              </div>
                            </Card>
                          </div>
                        </div>
                        </div>
                      )}
                    </div>
                  )}
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
                          <div className="font-medium">{activeDate?.guestCount || 0}</div>
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
                          Includes {selectedPackageData ? 'package' : 'services'} and {activeDate?.selectedServices?.length || 0} additional services
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                )}
              </div>
            </div>

            {/* Fixed Footer */}
            <div className="border-t border-slate-200 p-3 sm:p-6 flex flex-col sm:flex-row gap-3 sm:gap-0 justify-between items-center bg-white flex-shrink-0 mt-auto">
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
              
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
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

      {/* Copy Config Modal */}
      <Dialog open={showCopyModal} onOpenChange={setShowCopyModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Copy Configuration</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Copy the current date's configuration to selected dates below:
            </p>
            
            <div className="space-y-2">
              {selectedDates.map((date, index) => {
                if (index === activeTabIndex) return null; // Don't show current date
                
                return (
                  <label key={index} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer">
                    <Checkbox />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{format(date.date, 'EEEE, MMMM d, yyyy')}</div>
                      <div className="text-xs text-slate-600">{date.startTime} - {date.endTime}</div>
                    </div>
                  </label>
                );
              })}
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => {
                  const checkboxes = document.querySelectorAll('input[type="checkbox"]') as NodeListOf<HTMLInputElement>;
                  const selectedIndices = Array.from(checkboxes)
                    .map((checkbox, index) => checkbox.checked ? index : -1)
                    .filter(index => index !== -1);
                  handleCopyConfig(selectedIndices);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Copy Configuration
              </Button>
              <Button variant="outline" onClick={() => setShowCopyModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}