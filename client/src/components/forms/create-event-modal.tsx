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
import { ChevronLeft, ChevronRight, X, Plus, CalendarIcon, Minus } from "lucide-react";
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
  
  // Step management - 2 steps like edit modal
  const [currentStep, setCurrentStep] = useState(1);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Date & Venue Selection
  const [selectedVenue, setSelectedVenue] = useState("");
  const [selectedDates, setSelectedDates] = useState<SelectedDate[]>([]);
  
  // Event Configuration - per date
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
  
  // Final Details
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

  // Data fetching
  const { data: venues } = useQuery({ queryKey: ["/api/venues-with-spaces"] });
  const { data: packages } = useQuery({ queryKey: ["/api/packages"] });
  const { data: services } = useQuery({ queryKey: ["/api/services"] });
  const { data: customers } = useQuery({ queryKey: ["/api/customers"] });

  const selectedVenueData = useMemo(() => 
    (venues as any[])?.find(v => v.id === selectedVenue), 
    [venues, selectedVenue]
  );

  const selectedCustomerData = useMemo(() => 
    (customers as any[])?.find(c => c.id === selectedCustomer), 
    [customers, selectedCustomer]
  );

  const activeDate = selectedDates[activeTabIndex];

  // Mutations
  const createBooking = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/bookings", data);
      if (!response.ok) throw new Error("Failed to create booking");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
      toast({ title: "Event created successfully!" });
      resetForm();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create event",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const createContract = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/bookings/contract", data);
      if (!response.ok) throw new Error("Failed to create contract");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
      toast({ title: "Multi-date event created successfully!" });
      resetForm();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create event",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const createService = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/services", data);
      if (!response.ok) throw new Error("Failed to create service");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      setNewService({ name: "", description: "", category: "addon", price: "", pricingModel: "fixed" });
      setShowNewServiceForm(false);
      toast({ title: "Service created successfully!" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create service",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const createCustomer = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/customers", data);
      if (!response.ok) throw new Error("Failed to create customer");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setSelectedCustomer(data.id);
      setNewCustomer({ name: "", email: "", phone: "", company: "" });
      setShowNewCustomerForm(false);
      toast({ title: "Customer created successfully!" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create customer",
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
    setShowCopyModal(false);
    setShowNewServiceForm(false);
    setShowNewCustomerForm(false);
  };

  const handleDateClick = (date: Date) => {
    if (date < new Date()) return; // Prevent selecting past dates

    const existingIndex = selectedDates.findIndex(d => isSameDay(d.date, date));
    if (existingIndex >= 0) {
      // Remove if already selected
      setSelectedDates(prev => prev.filter((_, i) => i !== existingIndex));
      if (activeTabIndex >= selectedDates.length - 1) {
        setActiveTabIndex(Math.max(0, selectedDates.length - 2));
      }
    } else {
      // Add new date
      const newDate: SelectedDate = {
        date,
        startTime: "09:00 AM",
        endTime: "05:00 PM",
        guestCount: 1
      };
      setSelectedDates(prev => [...prev, newDate]);
    }
  };

  const updateDateConfig = (field: string, value: any) => {
    if (!activeDate) return;
    
    setSelectedDates(prev => prev.map((date, index) => 
      index === activeTabIndex 
        ? { ...date, [field]: value }
        : date
    ));
  };

  const copyConfigToOtherDates = () => {
    if (!activeDate) return;
    
    const configToCopy = {
      guestCount: activeDate.guestCount,
      packageId: activeDate.packageId,
      selectedServices: activeDate.selectedServices,
      itemQuantities: activeDate.itemQuantities,
      pricingOverrides: activeDate.pricingOverrides
    };

    setSelectedDates(prev => prev.map((date, index) => 
      index === activeTabIndex ? date : { ...date, ...configToCopy }
    ));
    
    setShowCopyModal(false);
    toast({ title: "Configuration copied to all other dates" });
  };

  const handleCreateService = () => {
    if (!newService.name || !newService.price) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    createService.mutate({
      name: newService.name,
      description: newService.description,
      category: newService.category,
      price: parseFloat(newService.price),
      pricingModel: newService.pricingModel
    });
  };

  const handleCreateCustomer = () => {
    if (!newCustomer.name || !newCustomer.email) {
      toast({ title: "Please fill in name and email", variant: "destructive" });
      return;
    }

    createCustomer.mutate(newCustomer);
  };

  // Calculate total price
  const totalPrice = useMemo(() => {
    return selectedDates.reduce((total, date) => {
      let dateTotal = 0;
      
      // Package price
      if (date.packageId) {
        const pkg = (packages as any[])?.find(p => p.id === date.packageId);
        if (pkg) {
          const price = parseFloat(pkg.price || 0);
          dateTotal += pkg.pricingModel === 'per_person' ? price * (date.guestCount || 1) : price;
        }
      }
      
      // Services price
      date.selectedServices?.forEach(serviceId => {
        const service = (services as any[])?.find(s => s.id === serviceId);
        if (service) {
          const price = parseFloat(service.price || 0);
          if (service.pricingModel === 'per_person') {
            dateTotal += price * (date.guestCount || 1);
          } else {
            const quantity = date.itemQuantities?.[serviceId] || 1;
            dateTotal += price * quantity;
          }
        }
      });
      
      return total + dateTotal;
    }, 0);
  }, [selectedDates, packages, services]);

  const convertTimeToHours = (timeStr: string) => {
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let hour24 = hours;
    
    if (period === 'PM' && hours !== 12) hour24 += 12;
    if (period === 'AM' && hours === 12) hour24 = 0;
    
    return hour24 + (minutes / 60);
  };

  const handleSubmit = () => {
    if (!selectedCustomer || !eventName || selectedDates.length === 0) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    if (selectedDates.length === 1) {
      // Single event
      const firstDate = selectedDates[0];
      let totalAmount = 0;

      if (firstDate.packageId) {
        const pkg = (packages as any[])?.find(p => p.id === firstDate.packageId);
        if (pkg) {
          const price = parseFloat(pkg.price || 0);
          totalAmount += pkg.pricingModel === 'per_person' ? price * (firstDate.guestCount || 1) : price;
        }
      }

      firstDate.selectedServices?.forEach(serviceId => {
        const service = (services as any[])?.find(s => s.id === serviceId);
        if (service) {
          const price = parseFloat(service.price || 0);
          if (service.pricingModel === 'per_person') {
            totalAmount += price * (firstDate.guestCount || 1);
          } else {
            const quantity = firstDate.itemQuantities?.[serviceId] || 1;
            totalAmount += price * quantity;
          }
        }
      });

      const bookingData = {
        eventName,
        eventType: "corporate",
        eventDate: new Date(firstDate.date),
        startTime: convertTimeToHours(firstDate.startTime),
        endTime: convertTimeToHours(firstDate.endTime),
        guestCount: firstDate.guestCount || 1,
        status: eventStatus,
        customerId: selectedCustomer,
        venueId: selectedVenue,
        spaceId: firstDate.spaceId,
        packageId: firstDate.packageId || null,
        selectedServices: firstDate.selectedServices?.length ? firstDate.selectedServices : null,
        pricingModel: (packages as any[])?.find(p => p.id === firstDate.packageId)?.pricingModel || "fixed",
        itemQuantities: firstDate.itemQuantities || {},
        pricingOverrides: firstDate.pricingOverrides || null,
        totalAmount: totalAmount.toString()
      };

      createBooking.mutate(bookingData);
    } else {
      // Multiple events - create contract
      const contractData = {
        customerId: selectedCustomer,
        contractName: eventName,
        description: `Multi-date event with ${selectedDates.length} dates`,
        status: eventStatus
      };

      const bookingsData = selectedDates.map((date, index) => {
        let dateTotal = 0;
        
        if (date.packageId) {
          const pkg = (packages as any[])?.find(p => p.id === date.packageId);
          if (pkg) {
            const price = parseFloat(pkg.price || 0);
            dateTotal += pkg.pricingModel === 'per_person' ? price * (date.guestCount || 1) : price;
          }
        }
        
        date.selectedServices?.forEach(serviceId => {
          const service = (services as any[])?.find(s => s.id === serviceId);
          if (service) {
            const price = parseFloat(service.price || 0);
            if (service.pricingModel === 'per_person') {
              dateTotal += price * (date.guestCount || 1);
            } else {
              const quantity = date.itemQuantities?.[serviceId] || 1;
              dateTotal += price * quantity;
            }
          }
        });

        return {
          eventName: `${eventName} - Day ${index + 1}`,
          eventType: "corporate",
          eventDate: new Date(date.date),
          startTime: convertTimeToHours(date.startTime),
          endTime: convertTimeToHours(date.endTime),
          guestCount: date.guestCount || 1,
          status: eventStatus,
          customerId: selectedCustomer,
          venueId: selectedVenue,
          spaceId: date.spaceId,
          packageId: date.packageId || null,
          selectedServices: date.selectedServices?.length ? date.selectedServices : null,
          pricingModel: (packages as any[])?.find(p => p.id === date.packageId)?.pricingModel || "fixed",
          itemQuantities: date.itemQuantities || {},
          pricingOverrides: date.pricingOverrides || null,
          totalAmount: dateTotal.toString()
        };
      });

      createContract.mutate({ contractData, bookingsData });
    }
  };

  const nextStep = () => {
    if (currentStep === 1 && (!selectedVenue || selectedDates.length === 0)) {
      toast({ title: "Please select a venue and at least one date", variant: "destructive" });
      return;
    }
    
    if (currentStep === 1) {
      const missingSpaces = selectedDates.filter(date => !date.spaceId);
      if (missingSpaces.length > 0) {
        toast({ 
          title: "Space selection required", 
          description: `Please select a space for ${missingSpaces.length} event date${missingSpaces.length > 1 ? 's' : ''}`,
          variant: "destructive" 
        });
        return;
      }

      if (!selectedVenueData?.spaces || selectedVenueData.spaces.length === 0) {
        toast({ 
          title: "No spaces available", 
          description: "The selected venue has no available spaces configured",
          variant: "destructive" 
        });
        return;
      }

      setActiveTabIndex(0);
    }
    if (currentStep < 2) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  // Generate calendar days
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Pad with previous month days to fill first week
  const firstDayOfWeek = getDay(monthStart);
  const previousMonthDays = firstDayOfWeek > 0 
    ? eachDayOfInterval({ 
        start: subMonths(monthStart, 1), 
        end: subMonths(monthStart, 1) 
      }).slice(-firstDayOfWeek)
    : [];
  
  const allDays = [...previousMonthDays, ...calendarDays];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {currentStep > 1 && (
                <Button variant="ghost" size="sm" onClick={prevStep}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              <div>
                <DialogTitle className="text-xl font-semibold">Create New Event</DialogTitle>
                <DialogDescription className="text-sm text-gray-600">
                  {currentStep === 1 && "Select venue and event dates"}
                  {currentStep === 2 && "Configure event details"}
                </DialogDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex h-full">
          {/* Sidebar - matches edit modal style */}
          <div className="w-72 bg-gray-50 border-r overflow-y-auto">
            <div className="p-4 space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Selected Date & Venue</h3>
                {selectedDates.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDates.map((date, index) => (
                      <div key={index} className="bg-white rounded-lg p-3 border">
                        <div className="font-medium text-sm">
                          {format(date.date, 'MMM dd, yyyy')}
                        </div>
                        <div className="text-xs text-gray-600">
                          {date.startTime} - {date.endTime}
                        </div>
                        <div className="text-xs text-gray-600">
                          {selectedVenueData?.spaces?.find((s: any) => s.id === date.spaceId)?.name || 'No space selected'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No dates selected</div>
                )}
              </div>

              {selectedDates.length > 0 && currentStep === 2 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Configuration</h3>
                  <div className="bg-white rounded-lg p-3 border">
                    {activeDate && (
                      <>
                        <div className="text-sm">
                          <span className="text-gray-600">Guest Count:</span>
                          <span className="ml-1 font-medium">{activeDate.guestCount || 1}</span>
                        </div>
                        
                        {activeDate.packageId && (
                          <div className="text-sm mt-1">
                            <span className="text-gray-600">Package:</span>
                            <span className="ml-1 font-medium">
                              {(packages as any[])?.find(p => p.id === activeDate.packageId)?.name || 'Selected'}
                            </span>
                          </div>
                        )}
                        
                        {activeDate.selectedServices && activeDate.selectedServices.length > 0 && (
                          <div className="text-sm mt-1">
                            <span className="text-gray-600">Services:</span>
                            <span className="ml-1 font-medium">{activeDate.selectedServices.length} selected</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {currentStep === 2 && eventName && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Event Details</h3>
                  <div className="bg-white rounded-lg p-3 border">
                    <div className="text-sm">
                      <span className="text-gray-600">Event:</span>
                      <span className="ml-1 font-medium">{eventName}</span>
                    </div>
                    {selectedCustomerData && (
                      <div className="text-sm mt-1">
                        <span className="text-gray-600">Customer:</span>
                        <span className="ml-1 font-medium">{selectedCustomerData.name}</span>
                      </div>
                    )}
                    <div className="text-sm mt-1">
                      <span className="text-gray-600">Status:</span>
                      <Badge className="ml-1 text-xs bg-blue-100 text-blue-800">{eventStatus}</Badge>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main content area */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-purple-50 border-b">
              <div className="text-purple-700 font-medium">
                {selectedDates.length > 1 ? 'Contract' : 'Event'}
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Total Event Value</div>
                <div className="text-xl font-bold text-purple-700">
                  ${totalPrice.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Step 1: Date & Venue Selection */}
              {currentStep === 1 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                    
                    <div className="grid grid-cols-7 gap-1 mb-4">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="p-2 text-center text-sm font-medium text-slate-500">
                          {day}
                        </div>
                      ))}
                    </div>
                    
                    <div className="grid grid-cols-7 gap-1">
                      {allDays.map((day, index) => {
                        const isCurrentMonth = isSameMonth(day, currentDate);
                        const isSelected = selectedDates.some(d => isSameDay(d.date, day));
                        const isPast = day < new Date();
                        
                        return (
                          <div
                            key={index}
                            className={cn(
                              "p-2 h-10 flex items-center justify-center text-sm cursor-pointer rounded transition-colors",
                              isCurrentMonth ? "text-slate-900" : "text-slate-400",
                              isSelected && "bg-blue-500 text-white font-semibold",
                              !isSelected && isCurrentMonth && !isPast && "hover:bg-slate-100",
                              isPast && "opacity-50 cursor-not-allowed"
                            )}
                            onClick={() => !isPast && handleDateClick(day)}
                          >
                            {format(day, 'd')}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right: Venue Selection & Date Configuration */}
                  <div className="space-y-6">
                    <div>
                      <Label className="text-base font-medium">Select Venue</Label>
                      <Select value={selectedVenue} onValueChange={setSelectedVenue}>
                        <SelectTrigger className="w-full mt-2">
                          <SelectValue placeholder="Choose a venue" />
                        </SelectTrigger>
                        <SelectContent>
                          {(venues as any[])?.map((venue: any) => (
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
                                  onValueChange={(value) => {
                                    const updatedDates = [...selectedDates];
                                    updatedDates[index] = { ...updatedDates[index], spaceId: value };
                                    setSelectedDates(updatedDates);
                                  }}
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
                                  onValueChange={(value) => {
                                    const updatedDates = [...selectedDates];
                                    updatedDates[index] = { ...updatedDates[index], startTime: value };
                                    setSelectedDates(updatedDates);
                                  }}
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
                                  onValueChange={(value) => {
                                    const updatedDates = [...selectedDates];
                                    updatedDates[index] = { ...updatedDates[index], endTime: value };
                                    setSelectedDates(updatedDates);
                                  }}
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

              {/* Step 2: Final Event Details - matches edit modal */}
              {currentStep === 2 && (
                <div>
                  <h3 className="text-lg font-semibold mb-6">Final Event Details</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-medium">Customer *</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowNewCustomerForm(!showNewCustomerForm)}
                          className="text-blue-600"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          New Customer
                        </Button>
                      </div>
                      
                      {showNewCustomerForm ? (
                        <Card className="mt-2 p-4 border-blue-200 bg-blue-50">
                          <h5 className="font-medium mb-3">Create New Customer</h5>
                          <div className="grid grid-cols-2 gap-3">
                            <Input
                              placeholder="Full Name *"
                              value={newCustomer.name}
                              onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                            />
                            <Input
                              placeholder="Email *"
                              type="email"
                              value={newCustomer.email}
                              onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                            />
                            <Input
                              placeholder="Phone"
                              value={newCustomer.phone}
                              onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                            />
                            <Input
                              placeholder="Company"
                              value={newCustomer.company}
                              onChange={(e) => setNewCustomer(prev => ({ ...prev, company: e.target.value }))}
                            />
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              onClick={handleCreateCustomer}
                              disabled={createCustomer.isPending}
                            >
                              {createCustomer.isPending ? "Creating..." : "Create"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowNewCustomerForm(false)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </Card>
                      ) : (
                        <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Select customer" />
                          </SelectTrigger>
                          <SelectContent>
                            {(customers as any[])?.map((customer: any) => (
                              <SelectItem key={customer.id} value={customer.id}>
                                {customer.name} - {customer.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                          <SelectItem value="proposal">Proposal</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Event Summary */}
                  <div className="mt-8">
                    <h4 className="font-semibold mb-4">Event Summary</h4>
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <span className="text-sm text-gray-600">Event:</span>
                          <div className="font-medium">{eventName || "Untitled Event"}</div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Guest Count:</span>
                          <div className="font-medium">
                            {selectedDates.reduce((total, date) => total + (date.guestCount || 1), 0)}
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Venue:</span>
                          <div className="font-medium">{selectedVenueData?.name || "No venue selected"}</div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Status:</span>
                          <Badge className="ml-1 text-xs bg-blue-100 text-blue-800">{eventStatus}</Badge>
                        </div>
                        <div className="col-span-2">
                          <span className="text-sm text-gray-600">Dates & Times:</span>
                          <div className="mt-1">
                            {selectedDates.map((date, index) => (
                              <div key={index} className="text-sm">
                                {format(date.date, 'MMM d, yyyy')} • {date.startTime} - {date.endTime}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-t mt-6 pt-6">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold">Total Event Value</span>
                          <span className="text-2xl font-bold text-purple-700">${totalPrice.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t p-6 flex justify-between items-center bg-white">
              <div className="text-lg font-semibold">
                Grand Total: ${totalPrice.toFixed(2)}
              </div>
              
              <div className="flex gap-3">
                {currentStep === 2 && (
                  <Button variant="outline" onClick={prevStep}>
                    Back
                  </Button>
                )}
                {currentStep < 2 ? (
                  <Button 
                    onClick={nextStep}
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={selectedDates.length === 0}
                  >
                    Next
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSubmit}
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={createBooking.isPending || createContract.isPending}
                  >
                    {(createBooking.isPending || createContract.isPending) ? 'Creating...' : 'Create Event'}
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
              <li>Selected package {(packages as any[])?.find(p => p.id === activeDate?.packageId)?.name ? `(${(packages as any[]).find(p => p.id === activeDate?.packageId)?.name})` : '(None)'}</li>
              <li>Additional services ({activeDate?.selectedServices?.length || 0} selected)</li>
            </ul>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCopyModal(false)}>
              Cancel
            </Button>
            <Button onClick={copyConfigToOtherDates}>
              Copy to All Dates
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}