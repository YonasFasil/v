import { useState, useMemo } from "react";
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
import { ChevronLeft, ChevronRight, X, Plus, RotateCcw } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function CreateEventModal({ open, onOpenChange }: Props) {
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

  // Per-date configuration helpers
  const updateDateTime = (index: number, field: keyof SelectedDate, value: any) => {
    setSelectedDates(prev => prev.map((date, i) => 
      i === index ? { ...date, [field]: value } : date
    ));
  };

  // Get active date configuration (with bounds checking)
  const activeDate = selectedDates[activeTabIndex] || selectedDates[0];
  
  const updateDateConfig = (field: keyof SelectedDate, value: any) => {
    const index = activeTabIndex < selectedDates.length ? activeTabIndex : 0;
    if (selectedDates[index]) {
      updateDateTime(index, field, value);
    }
  };
  
  // Calculate total price across all dates
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

  // Handle date selection
  const handleDateClick = (date: Date) => {
    if (!isSameMonth(date, currentDate)) return;
    
    const existingIndex = selectedDates.findIndex(d => isSameDay(d.date, date));
    if (existingIndex >= 0) {
      setSelectedDates(prev => prev.filter((_, i) => i !== existingIndex));
      if (activeTabIndex >= selectedDates.length - 1) {
        setActiveTabIndex(Math.max(0, selectedDates.length - 2));
      }
    } else {
      const defaultSpace = selectedVenueData?.spaces?.[0];
      setSelectedDates(prev => [...prev, {
        date,
        startTime: "09:00 AM",
        endTime: "05:00 PM",
        spaceId: defaultSpace?.id || "",
        guestCount: 1,
        packageId: "",
        selectedServices: [],
        itemQuantities: {},
        pricingOverrides: {}
      }]);
    }
  };


  const selectedVenueData = (venues as any[]).find((v: any) => v.id === selectedVenue);
  const selectedPackageData = (packages as any[]).find((p: any) => p.id === activeDate?.packageId);

  // Copy configuration to other dates
  const copyConfigToOtherDates = () => {
    if (!activeDate) return;
    
    const currentConfig = {
      guestCount: activeDate.guestCount,
      packageId: activeDate.packageId,
      selectedServices: [...(activeDate.selectedServices || [])],
      itemQuantities: { ...activeDate.itemQuantities },
      pricingOverrides: { ...activeDate.pricingOverrides }
    };

    setSelectedDates(prev => 
      prev.map((date, index) => 
        index === activeTabIndex ? date : { ...date, ...currentConfig }
      )
    );

    toast({ title: "Configuration copied to all other dates" });
    setShowCopyModal(false);
  };

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

  // Create service mutation
  const createService = useMutation({
    mutationFn: async (serviceData: any) => {
      const response = await apiRequest("POST", "/api/services", serviceData);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      // Auto-add the new service to current date configuration
      const currentServices = activeDate?.selectedServices || [];
      updateDateConfig('selectedServices', [...currentServices, data.id]);
      setShowNewServiceForm(false);
      setNewService({ name: "", description: "", category: "addon", price: "", pricingModel: "fixed" });
      toast({ title: "Service created and added to event!" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to create service", description: error.message, variant: "destructive" });
    }
  });

  // Create booking mutation
  const createBooking = useMutation({
    mutationFn: async (bookingData: any) => {
      const response = await apiRequest("POST", "/api/bookings", bookingData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({ title: "Event created successfully!" });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to create event", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const resetForm = () => {
    setCurrentStep(1);
    setSelectedVenue("");
    setSelectedDates([]);
    setActiveTabIndex(0);
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
    createService.mutate({
      ...newService,
      price: parseFloat(newService.price).toString()
    });
  };

  const handleSubmit = () => {
    if (!eventName || !selectedCustomer || selectedDates.length === 0) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    // Create booking for first selected date (extend for multiple dates if needed)
    const firstDate = selectedDates[0];
    
    if (!firstDate.spaceId) {
      toast({ 
        title: "Space selection required", 
        description: "Please select a space for this event",
        variant: "destructive" 
      });
      return;
    }
    const bookingData = {
      eventName,
      eventType: "corporate",
      eventDate: firstDate.date,
      startTime: firstDate.startTime.replace(/\s(AM|PM)/g, '').replace(/(\d+):(\d+)/, (_, h, m) => {
        const hour = parseInt(h);
        const isAM = firstDate.startTime.includes('AM');
        const hour24 = isAM ? (hour === 12 ? 0 : hour) : (hour === 12 ? 12 : hour + 12);
        return `${hour24.toString().padStart(2, '0')}:${m}`;
      }),
      endTime: firstDate.endTime.replace(/\s(AM|PM)/g, '').replace(/(\d+):(\d+)/, (_, h, m) => {
        const hour = parseInt(h);
        const isAM = firstDate.endTime.includes('AM');
        const hour24 = isAM ? (hour === 12 ? 0 : hour) : (hour === 12 ? 12 : hour + 12);
        return `${hour24.toString().padStart(2, '0')}:${m}`;
      }),
      guestCount: firstDate.guestCount || 1,
      status: eventStatus,
      customerId: selectedCustomer,
      venueId: selectedVenue,
      spaceId: firstDate.spaceId,
      packageId: firstDate.packageId || null,
      selectedServices: firstDate.selectedServices?.length ? firstDate.selectedServices : null,
      pricingModel: selectedPackageData?.pricingModel || "fixed",
      itemQuantities: firstDate.itemQuantities || {},
      pricingOverrides: firstDate.pricingOverrides || null,
      totalAmount: totalPrice.toString(),
      notes: `Package: ${selectedPackageData?.name || 'None'}, Services: ${firstDate.selectedServices?.length || 0} selected`
    };

    createBooking.mutate(bookingData);
  };

  const nextStep = () => {
    if (currentStep === 1 && (!selectedVenue || selectedDates.length === 0)) {
      toast({ title: "Please select a venue and at least one date", variant: "destructive" });
      return;
    }
    
    if (currentStep === 1) {
      // Validate that all selected dates have spaces selected
      const missingSpaces = selectedDates.filter(date => !date.spaceId);
      if (missingSpaces.length > 0) {
        toast({ 
          title: "Space selection required", 
          description: `Please select a space for ${missingSpaces.length} event date${missingSpaces.length > 1 ? 's' : ''}`,
          variant: "destructive" 
        });
        return;
      }

      // Validate that venue has spaces available
      if (!selectedVenueData?.spaces || selectedVenueData.spaces.length === 0) {
        toast({ 
          title: "No spaces available", 
          description: "The selected venue has no available spaces configured",
          variant: "destructive" 
        });
        return;
      }

      // Reset active tab index to first date when moving to step 2
      setActiveTabIndex(0);
    }
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0 overflow-hidden flex flex-col" aria-describedby="create-event-description">
        <DialogTitle className="sr-only">Create Event</DialogTitle>
        <div id="create-event-description" className="sr-only">
          Create a new event booking with date selection, venue configuration, and customer details.
        </div>
        <div className="flex h-full">
          {/* Left sidebar - Event dates summary (Steps 2 & 3) */}
          {currentStep > 1 && (
            <div className="w-80 bg-slate-50 border-r border-slate-200 p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-slate-900">Event Dates</h3>
                <Button variant="outline" size="sm" onClick={() => setCurrentStep(1)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              
              <div className="space-y-3">
                {selectedDates.map((dateInfo, index) => (
                  <Card key={index} className="p-3 bg-blue-50 border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-blue-900">
                        {format(dateInfo.date, 'EEEE, MMMM d, yyyy')}
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => setCurrentStep(1)}>
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-sm text-blue-700">
                      {format(dateInfo.date, 'MMMM d, yyyy')}
                    </div>
                    <div className="text-sm text-blue-600 mt-1">
                      {selectedVenueData?.name} - {selectedVenueData?.spaces?.[0]?.name || 'Main Hall'} @ {dateInfo.startTime}
                    </div>
                  </Card>
                ))}
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
                <h2 className="text-xl font-semibold">Create Event</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4" />
              </Button>
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
                                <span className="font-medium">{space.name}</span>
                                <span className="text-slate-500 ml-2">• Capacity: {space.capacity}</span>
                              </div>
                            )) || <p className="text-sm text-slate-500">No spaces configured</p>}
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label className="text-base font-medium">Configure Dates ({selectedDates.length})</Label>
                      <div className="mt-3 space-y-3 max-h-64 overflow-y-auto">
                        {selectedDates.map((dateInfo, index) => (
                          <Card key={index} className="p-4 border border-green-200 bg-green-50">
                            <div className="flex items-center justify-between mb-3">
                              <span className="font-medium text-green-900">
                                {format(dateInfo.date, 'EEEE, MMMM d, yyyy')}
                              </span>
                              <Badge variant="secondary" className="bg-green-100 text-green-700">
                                Available
                              </Badge>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="mb-2">
                                <Label className="text-sm">Select Space</Label>
                                <Select
                                  value={dateInfo.spaceId || ""}
                                  onValueChange={(value) => updateDateTime(index, 'spaceId', value)}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Choose a space" />
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
                              
                              <div className="flex items-center gap-2">
                                <Select
                                  value={dateInfo.startTime}
                                  onValueChange={(value) => updateDateTime(index, 'startTime', value)}
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Array.from({length: 24}, (_, i) => {
                                      const hour = i === 0 ? 12 : i <= 12 ? i : i - 12;
                                      const ampm = i < 12 ? 'AM' : 'PM';
                                      const time = `${hour.toString().padStart(2, '0')}:00 ${ampm}`;
                                      return (
                                        <SelectItem key={time} value={time}>{time}</SelectItem>
                                      );
                                    })}
                                  </SelectContent>
                                </Select>
                                
                                <span className="text-slate-500">to</span>
                                
                                <Select
                                  value={dateInfo.endTime}
                                  onValueChange={(value) => updateDateTime(index, 'endTime', value)}
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Array.from({length: 24}, (_, i) => {
                                      const hour = i === 0 ? 12 : i <= 12 ? i : i - 12;
                                      const ampm = i < 12 ? 'AM' : 'PM';
                                      const time = `${hour.toString().padStart(2, '0')}:00 ${ampm}`;
                                      return (
                                        <SelectItem key={time} value={time}>{time}</SelectItem>
                                      );
                                    })}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Per-Date Configuration */}
              {currentStep === 2 && (
                <div className="flex h-full">
                  {/* Left: Date Tabs */}
                  <div className="w-1/3 border-r overflow-y-auto bg-gray-50">
                    <div className="p-4 font-semibold text-lg border-b bg-white sticky top-0">
                      Event Dates
                    </div>
                    {selectedDates.map((dateInfo, index) => (
                      <div 
                        key={index} 
                        onClick={() => setActiveTabIndex(index)}
                        className={cn(
                          "p-4 cursor-pointer border-b transition-colors",
                          activeTabIndex === index 
                            ? "bg-indigo-100 border-l-4 border-indigo-500" 
                            : "hover:bg-gray-100"
                        )}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">{format(dateInfo.date, 'EEEE')}</p>
                            <p className="text-sm text-gray-600">{format(dateInfo.date, 'MMMM d, yyyy')}</p>
                            <p className="text-sm text-gray-600">
                              {selectedVenueData?.spaces?.find((s: any) => s.id === dateInfo.spaceId)?.name || 'No space selected'} 
                              @ {dateInfo.startTime}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Right: Configuration for Active Date */}
                  <div className="w-2/3 flex flex-col overflow-y-auto">
                    {activeDate && (
                      <div className="p-6 flex-grow">
                        <div className="flex justify-between items-center mb-1">
                          <h3 className="text-xl font-semibold">Configure Event</h3>
                          {selectedDates.length > 1 && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setShowCopyModal(true)}
                            >
                              Copy to Other Dates
                            </Button>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mb-4">
                          For {format(activeDate.date, 'EEEE, MMMM d')} in {selectedVenueData?.spaces?.find((s: any) => s.id === activeDate.spaceId)?.name || 'selected space'}
                        </p>

                        <div className="space-y-4">
                          <div>
                            <Label className="font-semibold text-gray-700">Number of Guests</Label>
                            <Input
                              type="number"
                              min="1"
                              value={activeDate.guestCount || 1}
                              onChange={(e) => updateDateConfig('guestCount', parseInt(e.target.value, 10) || 1)}
                              className="w-full mt-1 px-3 py-2 border rounded-md"
                            />
                          </div>

                          <div>
                            <h4 className="font-semibold text-gray-700 mb-2">Package</h4>
                            <Select 
                              value={activeDate.packageId || "none"} 
                              onValueChange={(value) => {
                                const packageId = value === "none" ? "" : value;
                                updateDateConfig('packageId', packageId);
                                // Auto-include package services
                                const pkg = (packages as any[]).find((p: any) => p.id === packageId);
                                if (pkg?.includedServiceIds) {
                                  updateDateConfig('selectedServices', [...(pkg.includedServiceIds || [])]);
                                }
                              }}
                            >
                              <SelectTrigger className="w-full px-3 py-2 border rounded-md">
                                <SelectValue placeholder="A La Carte" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">A La Carte</SelectItem>
                                {(packages as any[]).map((pkg: any) => (
                                  <SelectItem key={pkg.id} value={pkg.id}>
                                    {pkg.name} - ${pkg.price}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            
                            {selectedPackageData && (
                              <div className="p-3 bg-gray-100 rounded-md mt-2">
                                <div className="flex items-center">
                                  <span className="text-gray-700 font-medium">Price:</span>
                                  <span className="text-lg font-semibold mx-2">$</span>
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
                                    className="w-32 p-1 border rounded-md"
                                    placeholder={selectedPackageData.price}
                                  />
                                </div>
                                <div className="mt-2 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      checked={selectedPackageData.pricingModel === 'per_person'}
                                      onCheckedChange={(checked) => {
                                        // Toggle between per_person and fixed pricing for this package
                                        const newPricingModel = checked ? 'per_person' : 'fixed';
                                        // This would require updating the package configuration
                                      }}
                                    />
                                    <span className="text-sm text-gray-600">
                                      Calculate per guest ({activeDate.guestCount || 1} guests)
                                    </span>
                                  </div>
                                  {selectedPackageData.pricingModel === 'per_person' && (
                                    <span className="text-sm font-medium">
                                      Total: ${((activeDate.pricingOverrides?.packagePrice ?? parseFloat(selectedPackageData.price || 0)) * (activeDate.guestCount || 1)).toFixed(2)}
                                    </span>
                                  )}
                                </div>
                                {selectedPackageData.includedServiceIds?.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-sm font-medium">Included services:</p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {selectedPackageData.includedServiceIds.map((serviceId: string) => {
                                        const service = (services as any[]).find((s: any) => s.id === serviceId);
                                        return service ? (
                                          <Badge key={serviceId} variant="secondary" className="text-xs">
                                            {service.name}
                                          </Badge>
                                        ) : null;
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-gray-700">Add-on Services</h4>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setShowNewServiceForm(true)}
                              >
                                + New Service
                              </Button>
                            </div>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {(services as any[]).map((service: any) => {
                                const isSelected = activeDate.selectedServices?.includes(service.id) || false;
                                const quantity = activeDate.itemQuantities?.[service.id] || 1;
                                const hasOverride = activeDate.pricingOverrides?.servicePrices?.[service.id] !== undefined;
                                
                                return (
                                  <div key={service.id} className="p-3 border rounded hover:bg-gray-50">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={(checked) => {
                                          const currentServices = activeDate.selectedServices || [];
                                          const newServices = checked 
                                            ? [...currentServices, service.id]
                                            : currentServices.filter(id => id !== service.id);
                                          updateDateConfig('selectedServices', newServices);
                                        }}
                                      />
                                      <div className="flex-1">
                                        <div className="font-medium">{service.name}</div>
                                        <div className="text-sm text-gray-600">
                                          ${hasOverride ? activeDate.pricingOverrides?.servicePrices?.[service.id] : service.price} 
                                          {service.pricingModel === 'per_person' ? ' per person' : ' each'}
                                        </div>
                                      </div>
                                      {isSelected && (
                                        <div className="flex items-center gap-2">
                                          {service.pricingModel !== 'per_person' && (
                                            <div className="flex items-center gap-1">
                                              <span className="text-sm">Qty:</span>
                                              <Input
                                                type="number"
                                                min="1"
                                                value={quantity}
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
                                    </label>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Final Details */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Confirm Details</h3>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div>
                        <Label className="text-base font-medium">Event Name</Label>
                        <Input
                          value={eventName}
                          onChange={(e) => setEventName(e.target.value)}
                          placeholder="e.g., 'Annual Conference 2025'"
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-base font-medium">Customer</Label>
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
                              <SelectValue placeholder="-- Select a Customer --" />
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
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-base font-medium">Applicable Policies</Label>
                        <div className="mt-2 p-3 bg-slate-50 rounded border text-sm text-slate-600">
                          Standard venue policies apply. Cancellation and refund terms will be included in the final contract.
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-lg">
                      <h4 className="font-semibold mb-4">Final Summary</h4>
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm text-slate-600">Dates</span>
                          <div className="font-medium">
                            {selectedDates.map(d => format(d.date, 'MMM d, yyyy')).join(', ')}
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-slate-600">Venue</span>
                          <div className="font-medium">{selectedVenueData?.name}</div>
                        </div>
                        <div>
                          <span className="text-sm text-slate-600">Total Guests</span>
                          <div className="font-medium">
                            {selectedDates.reduce((total, date) => total + (date.guestCount || 1), 0)} 
                            {selectedDates.length > 1 && ` (across ${selectedDates.length} dates)`}
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-slate-600">Event Configuration</span>
                          <div className="font-medium text-sm">
                            {selectedDates.length === 1 
                              ? "Single date event"
                              : `Multi-date event (${selectedDates.length} dates)`
                            }
                          </div>
                        </div>
                        <div className="border-t pt-3 mt-4">
                          <div className="flex justify-between font-semibold text-lg">
                            <span>Grand Total</span>
                            <span>${totalPrice.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Fixed Footer */}
            <div className="border-t border-slate-200 p-6 flex justify-between items-center bg-white flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Grand Total</span>
                <span className="text-lg font-semibold">${totalPrice.toFixed(2)}</span>
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
                    {currentStep === 1 ? `Configure ${selectedDates.length} Event Date${selectedDates.length !== 1 ? 's' : ''}` : 'Next'}
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSubmit}
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={createBooking.isPending}
                  >
                    {createBooking.isPending ? 'Creating...' : 'Save Changes'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>

      {/* Copy Configuration Modal */}
      <Dialog open={showCopyModal} onOpenChange={setShowCopyModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Copy Configuration</DialogTitle>
            <DialogDescription>
              Copy the current event configuration to all other dates in this booking.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              This will copy the following settings to all other event dates:
            </p>
            <ul className="mt-2 text-sm text-gray-600 list-disc list-inside space-y-1">
              <li>Number of guests ({activeDate?.guestCount || 1})</li>
              <li>Selected package {selectedPackageData ? `(${selectedPackageData.name})` : '(None)'}</li>
              <li>Add-on services ({activeDate?.selectedServices?.length || 0} selected)</li>
              <li>Quantities and pricing overrides</li>
            </ul>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowCopyModal(false)}>
              Cancel
            </Button>
            <Button onClick={copyConfigToOtherDates}>
              Copy to All Dates
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Service Creation Modal */}
      <Dialog open={showNewServiceForm} onOpenChange={setShowNewServiceForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Service</DialogTitle>
            <DialogDescription>
              Add a new service that will be available as an add-on option.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="service-name">Service Name *</Label>
              <Input
                id="service-name"
                value={newService.name}
                onChange={(e) => setNewService(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Photography Package"
              />
            </div>
            
            <div>
              <Label htmlFor="service-description">Description</Label>
              <Input
                id="service-description"
                value={newService.description}
                onChange={(e) => setNewService(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the service"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="service-category">Category</Label>
                <Select 
                  value={newService.category} 
                  onValueChange={(value) => setNewService(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="addon">Add-on</SelectItem>
                    <SelectItem value="catering">Catering</SelectItem>
                    <SelectItem value="entertainment">Entertainment</SelectItem>
                    <SelectItem value="decor">Decor</SelectItem>
                    <SelectItem value="photography">Photography</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="service-pricing">Pricing Model</Label>
                <Select 
                  value={newService.pricingModel} 
                  onValueChange={(value) => setNewService(prev => ({ ...prev, pricingModel: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed Price</SelectItem>
                    <SelectItem value="per_person">Per Person</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="service-price">Price * ($)</Label>
              <Input
                id="service-price"
                type="number"
                step="0.01"
                min="0"
                value={newService.price}
                onChange={(e) => setNewService(prev => ({ ...prev, price: e.target.value }))}
                placeholder="0.00"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowNewServiceForm(false);
                setNewService({ name: "", description: "", category: "addon", price: "", pricingModel: "fixed" });
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateService}
              disabled={createService.isPending}
            >
              {createService.isPending ? 'Creating...' : 'Create Service'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}