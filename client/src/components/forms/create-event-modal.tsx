import { useState, useMemo, useEffect } from "react";
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
import { ChevronLeft, ChevronRight, X, Plus, Minus, RotateCcw, Calendar as CalendarIcon, Mic, FileText, Save, Users, Grid3X3, MapPin } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { VoiceBookingPanel } from "../voice/voice-booking-panel";
import { ProposalCreationModal } from "../proposals/proposal-creation-modal";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  duplicateFromBooking?: any;
}

interface SelectedDate {
  date: Date;
  startTime: string;
  endTime: string;
  spaceId?: string;
  packageId?: string;
  selectedServices?: string[];
  guestCount?: number;
  setupStyle?: string;
  itemQuantities?: Record<string, number>;
  pricingOverrides?: {
    packagePrice?: number;
    servicePrices?: Record<string, number>;
  };
}

export function CreateEventModal({ open, onOpenChange, duplicateFromBooking }: Props) {
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
  const [selectedCopyIndices, setSelectedCopyIndices] = useState<number[]>([]);
  
  // New service creation
  const [showNewServiceForm, setShowNewServiceForm] = useState(false);
  const [showPackageSelection, setShowPackageSelection] = useState(false);
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

  // Voice booking integration
  const [showVoicePanel, setShowVoicePanel] = useState(false);
  const [voiceExtractedData, setVoiceExtractedData] = useState<any>(null);
  
  // Customer creation
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    company: ""
  });

  // Proposal creation
  const [showCreateProposal, setShowCreateProposal] = useState(false);
  
  // Summary details modal
  const [showSummaryDetails, setShowSummaryDetails] = useState(false);

  // Data queries
  const { data: venues = [] } = useQuery({ queryKey: ["/api/venues-with-spaces"] });
  const { data: packages = [] } = useQuery({ queryKey: ["/api/packages"] });
  const { data: services = [] } = useQuery({ queryKey: ["/api/services"] });
  const { data: customers = [] } = useQuery({ queryKey: ["/api/customers"] });
  const { data: existingBookings = [] } = useQuery({ queryKey: ["/api/bookings"] });

  // Initialize form with duplicate data when provided
  useEffect(() => {
    if (duplicateFromBooking && open) {
      // Reset to first step when duplicating
      setCurrentStep(1);
      setActiveTabIndex(0);
      
      // Set basic event details with (Copy) suffix
      setEventName(duplicateFromBooking.eventName + " (Copy)");
      setSelectedCustomer(duplicateFromBooking.customerId || "");
      setEventStatus("inquiry"); // Always start as inquiry for duplicates
      
      // Set venue from the original booking
      if (duplicateFromBooking.venueId) {
        setSelectedVenue(duplicateFromBooking.venueId);
      }
      
      // Create a new date entry for tomorrow (to avoid conflicts)
      const tomorrowDate = new Date();
      tomorrowDate.setDate(tomorrowDate.getDate() + 1);
      
      // Build selected services and packages from the original booking
      const selectedServices: string[] = [];
      const selectedPackages: string[] = [];
      
      // Add selected packages
      if (duplicateFromBooking.selectedPackages) {
        duplicateFromBooking.selectedPackages.forEach((pkg: any) => {
          selectedPackages.push(pkg.id);
        });
      }
      
      // Add selected services
      if (duplicateFromBooking.selectedServices) {
        duplicateFromBooking.selectedServices.forEach((service: any) => {
          selectedServices.push(service.id);
        });
      }
      
      // Create date configuration with original booking data
      const duplicatedDate: SelectedDate = {
        date: tomorrowDate,
        startTime: duplicateFromBooking.startTime || "09:00 AM",
        endTime: duplicateFromBooking.endTime || "05:00 PM",
        spaceId: duplicateFromBooking.spaceId || "",
        packageId: selectedPackages[0] || "",
        selectedServices: selectedServices,
        guestCount: duplicateFromBooking.guestCount || 1,
        itemQuantities: duplicateFromBooking.itemQuantities || {},
        pricingOverrides: duplicateFromBooking.pricingOverrides || {}
      };
      
      setSelectedDates([duplicatedDate]);
      
      // Show notification when duplicating
      toast({
        title: "Event Duplicated",
        description: `Event details copied from "${duplicateFromBooking.eventName}". You can now modify and save as a new event.`
      });
    }
  }, [duplicateFromBooking, open, toast]);

  // Auto-select venue when there's only one venue available
  useEffect(() => {
    if (venues && Array.isArray(venues) && venues.length === 1 && !selectedVenue && open) {
      setSelectedVenue((venues as any[])[0].id);
    }
  }, [venues, selectedVenue, open]);

  // Reset form when modal is closed (only if not duplicating)
  useEffect(() => {
    if (!open && !duplicateFromBooking) {
      // Reset all form state
      setCurrentStep(1);
      setActiveTabIndex(0);
      setSelectedVenue("");
      setSelectedDates([]);
      setEventName("");
      setSelectedCustomer("");
      setEventStatus("inquiry");
      setShowPackageSelection(false);
      setShowNewServiceForm(false);
      setShowCopyModal(false);
      setShowVoicePanel(false);
      setVoiceExtractedData(null);
      setShowNewCustomerForm(false);
      setShowCreateProposal(false);
      setShowSummaryDetails(false);
    }
  }, [open, duplicateFromBooking]);

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
  // Calculate total for a single date
  const calculateEventDuration = (startTime: string, endTime: string) => {
    const parseTime = (timeStr: string) => {
      if (timeStr.includes('AM') || timeStr.includes('PM')) {
        const cleanTime = timeStr.replace(/\s(AM|PM)/g, '');
        const [hours, minutes] = cleanTime.split(':').map(Number);
        const isAM = timeStr.includes('AM');
        const hour24 = isAM ? (hours === 12 ? 0 : hours) : (hours === 12 ? 12 : hours + 12);
        return hour24 + (minutes / 60);
      } else {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours + (minutes / 60);
      }
    };
    
    const start = parseTime(startTime);
    const end = parseTime(endTime);
    return Math.max(0, end - start); // Duration in hours
  };

  const calculateDateTotal = (dateConfig: SelectedDate) => {
    let dateTotal = 0;
    const eventDuration = calculateEventDuration(dateConfig.startTime, dateConfig.endTime);
    
    // Get selected package info
    const selectedPackage = dateConfig.packageId 
      ? (packages as any[]).find((p: any) => p.id === dateConfig.packageId)
      : null;
    
    // Package price
    if (selectedPackage) {
      const packagePrice = dateConfig.pricingOverrides?.packagePrice ?? parseFloat(selectedPackage.price || 0);
      if (selectedPackage.pricingModel === 'per_person') {
        dateTotal += packagePrice * (dateConfig.guestCount || 1);
      } else if (selectedPackage.pricingModel === 'per_hour') {
        dateTotal += packagePrice * eventDuration;
      } else {
        dateTotal += packagePrice;
      }
    }
    
    // Additional services price (only services NOT included in the package)
    const includedServiceIds = selectedPackage?.includedServiceIds || [];
    
    dateConfig.selectedServices?.forEach(serviceId => {
      // Skip if this service is included in the selected package
      if (includedServiceIds.includes(serviceId)) {
        return; // No charge for included services
      }
      
      const service = (services as any[]).find((s: any) => s.id === serviceId);
      if (service) {
        const servicePrice = dateConfig.pricingOverrides?.servicePrices?.[serviceId] ?? parseFloat(service.price || 0);
        if (service.pricingModel === 'per_person') {
          dateTotal += servicePrice * (dateConfig.guestCount || 1);
        } else if (service.pricingModel === 'per_hour') {
          dateTotal += servicePrice * eventDuration;
        } else {
          const quantity = dateConfig.itemQuantities?.[serviceId] || 1;
          dateTotal += servicePrice * quantity;
        }
      }
    });
    
    return dateTotal;
  };

  const totalPrice = useMemo(() => {
    return selectedDates.reduce((total, dateConfig) => {
      return total + calculateDateTotal(dateConfig);
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

  // Function to check space availability for a specific date and time
  const getSpaceAvailability = (spaceId: string, date: Date, startTime: string, endTime: string) => {
    if (!spaceId || !(existingBookings as any[])?.length) return { available: true, conflictingBooking: null };

    const conflicts = (existingBookings as any[]).filter(booking => {
      if (booking.status === 'cancelled') return false;
      if (booking.spaceId !== spaceId) return false;
      
      const bookingDate = new Date(booking.eventDate);
      if (bookingDate.toDateString() !== date.toDateString()) return false;

      // Parse times - handle both 24hr format and 12hr format
      const parseTime = (timeStr: string) => {
        if (timeStr.includes('AM') || timeStr.includes('PM')) {
          // Convert 12hr format to 24hr
          const cleanTime = timeStr.replace(/\s(AM|PM)/g, '');
          const [hours, minutes] = cleanTime.split(':').map(Number);
          const isAM = timeStr.includes('AM');
          const hour24 = isAM ? (hours === 12 ? 0 : hours) : (hours === 12 ? 12 : hours + 12);
          return hour24 * 60 + minutes;
        } else {
          // Already 24hr format
          const [hours, minutes] = timeStr.split(':').map(Number);
          return hours * 60 + minutes;
        }
      };

      const newStart = parseTime(startTime);
      const newEnd = parseTime(endTime);
      const existingStart = parseTime(booking.startTime);
      const existingEnd = parseTime(booking.endTime);

      return (newStart < existingEnd && newEnd > existingStart);
    });

    return {
      available: conflicts.length === 0,
      conflictingBooking: conflicts[0] || null
    };
  };

  // Copy configuration to other dates
  const handleCopyConfig = (selectedIndices: number[]) => {
    if (!activeDate || selectedIndices.length === 0) return;
    
    const currentConfig = {
      // Copy all configuration fields except date, startTime, endTime which are unique per date
      spaceId: activeDate.spaceId,
      packageId: activeDate.packageId,
      selectedServices: activeDate.selectedServices ? [...activeDate.selectedServices] : [],
      guestCount: activeDate.guestCount,
      setupStyle: activeDate.setupStyle,
      itemQuantities: activeDate.itemQuantities ? { ...activeDate.itemQuantities } : {},
      pricingOverrides: activeDate.pricingOverrides ? {
        packagePrice: activeDate.pricingOverrides.packagePrice,
        servicePrices: activeDate.pricingOverrides.servicePrices ? { ...activeDate.pricingOverrides.servicePrices } : {}
      } : {}
    };

    setSelectedDates(prev => 
      prev.map((date, index) => {
        // Apply configuration to selected indices, skip current active tab
        if (index === activeTabIndex) return date;
        
        return selectedIndices.includes(index) ? { ...date, ...currentConfig } : date;
      })
    );

    toast({ 
      title: "Settings applied", 
      description: `Configuration applied to ${selectedIndices.length} selected dates` 
    });
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



  // Create booking mutation (single event)
  const createBooking = useMutation({
    mutationFn: async (bookingData: any) => {
      const response = await apiRequest("POST", "/api/bookings", bookingData);
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
      
      // Show different success message based on submission type
      const isProposal = variables.proposalStatus === 'sent';
      toast({ 
        title: isProposal ? "Proposal sent successfully!" : "Event created successfully!",
        description: isProposal ? "The customer will receive an email with the proposal details." : undefined
      });
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

  // Create contract with multiple bookings mutation
  const createContract = useMutation({
    mutationFn: async (contractData: any) => {
      const response = await apiRequest("POST", "/api/bookings/contract", contractData);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
      toast({ 
        title: "Multi-event contract created successfully!", 
        description: `Created contract with ${data.bookings.length} events` 
      });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to create contract", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Voice booking handlers
  const handleVoiceDataExtracted = (data: any) => {
    setVoiceExtractedData(data);
    
    // Auto-populate form with extracted data
    if (data.eventName) setEventName(data.eventName);
    if (data.customerName) {
      // Try to find existing customer or prepare to create new one
      const existingCustomer = (customers as any[]).find((c: any) => 
        c.name.toLowerCase().includes(data.customerName.toLowerCase())
      );
      if (existingCustomer) {
        setSelectedCustomer(existingCustomer.id);
      } else {
        setNewCustomer(prev => ({
          ...prev,
          name: data.customerName,
          email: data.customerEmail || "",
          phone: data.customerPhone || ""
        }));
        setShowNewCustomerForm(true);
      }
    }
    
    // Set venue if mentioned
    if (data.venue) {
      const venue = (venues as any[]).find((v: any) => 
        v.name.toLowerCase().includes(data.venue.toLowerCase())
      );
      if (venue) {
        setSelectedVenue(venue.id);
      }
    }
    
    // Auto-move to step 1 (date selection) if we have extracted data
    setCurrentStep(1);
    setShowVoicePanel(false);
    
    toast({
      title: "Voice Data Applied",
      description: "Form populated with voice booking details. Please review and continue."
    });
  };

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
    setShowVoicePanel(false);
    setVoiceExtractedData(null);
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

  const convertTimeToHours = (timeStr: string) => {
    // If already in 24-hour format, return as is
    if (!timeStr.includes('AM') && !timeStr.includes('PM')) {
      return timeStr;
    }
    
    return timeStr.replace(/\s(AM|PM)/g, '').replace(/(\d+):(\d+)/, (_, h, m) => {
      const hour = parseInt(h);
      const isAM = timeStr.includes('AM');
      const hour24 = isAM ? (hour === 12 ? 0 : hour) : (hour === 12 ? 12 : hour + 12);
      return `${hour24.toString().padStart(2, '0')}:${m}`;
    });
  };

  const handleSubmit = async (submitType: 'inquiry' | 'proposal' = 'inquiry') => {
    if (!eventName || !selectedCustomer || selectedDates.length === 0) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    // Validate all dates have spaces selected
    const missingSpaces = selectedDates.filter(date => !date.spaceId);
    if (missingSpaces.length > 0) {
      toast({ 
        title: "Space selection required", 
        description: `Please select a space for ${missingSpaces.length} event date${missingSpaces.length > 1 ? 's' : ''}`,
        variant: "destructive" 
      });
      return;
    }

    if (selectedDates.length === 1) {
      // Single event - use regular booking endpoint
      const firstDate = selectedDates[0];
      const bookingData = {
        eventName,
        eventType: "corporate",
        eventDate: firstDate.date,
        startTime: convertTimeToHours(firstDate.startTime),
        endTime: convertTimeToHours(firstDate.endTime),
        guestCount: firstDate.guestCount || 1,
        status: submitType === 'proposal' ? 'pending' : eventStatus,
        customerId: selectedCustomer,
        venueId: selectedVenue,
        spaceId: firstDate.spaceId,
        setupStyle: firstDate.setupStyle || null,
        packageId: firstDate.packageId || null,
        selectedServices: firstDate.selectedServices?.length ? firstDate.selectedServices : null,
        pricingModel: selectedPackageData?.pricingModel || "fixed",
        itemQuantities: firstDate.itemQuantities || {},
        pricingOverrides: firstDate.pricingOverrides || null,
        totalAmount: totalPrice.toString(),
        notes: `Package: ${selectedPackageData?.name || 'None'}, Services: ${firstDate.selectedServices?.length || 0} selected`,
        proposalStatus: submitType === 'proposal' ? 'sent' : 'none',
        proposalSentAt: submitType === 'proposal' ? new Date().toISOString() : null
      };

      createBooking.mutate(bookingData, {
        onError: (error: any) => {
          if (error.response?.status === 409) {
            // Handle booking conflict
            const conflictData = error.response.data.conflictingBooking;
            toast({
              title: "⚠️ Booking Conflict Detected",
              description: `The selected time slot conflicts with "${conflictData.eventName}" by ${conflictData.customerName} (${conflictData.startTime} - ${conflictData.endTime}, Status: ${conflictData.status}). Would you like to overbook anyway?`,
              variant: "destructive",
              duration: 8000
            });
          } else {
            toast({
              title: "Error creating booking",
              description: error.response?.data?.message || "An unexpected error occurred",
              variant: "destructive"
            });
          }
        }
      });
    } else {
      // Multiple events - create contract with multiple bookings
      const contractData = {
        customerId: selectedCustomer,
        contractName: eventName,
        description: `Multi-date event with ${selectedDates.length} dates`,
        status: submitType === 'proposal' ? 'pending' : eventStatus
      };

      const bookingsData = selectedDates.map((date, index) => {
        // Calculate individual date price using the same logic as calculateDateTotal
        const datePrice = calculateDateTotal(date);

        return {
          eventName: `${eventName} - Day ${index + 1}`,
          eventType: "corporate",
          eventDate: date.date,
          startTime: convertTimeToHours(date.startTime),
          endTime: convertTimeToHours(date.endTime),
          guestCount: date.guestCount || 1,
          status: submitType === 'proposal' ? 'pending' : eventStatus,
          customerId: selectedCustomer,
          venueId: selectedVenue,
          spaceId: date.spaceId,
          setupStyle: date.setupStyle || null,
          packageId: date.packageId || null,
          selectedServices: date.selectedServices?.length ? date.selectedServices : null,
          pricingModel: selectedPackageData?.pricingModel || "fixed",
          itemQuantities: date.itemQuantities || {},
          pricingOverrides: date.pricingOverrides || null,
          totalAmount: datePrice.toString(),
          notes: `Package: ${selectedPackageData?.name || 'None'}, Services: ${date.selectedServices?.length || 0} selected`,
          proposalStatus: submitType === 'proposal' ? 'sent' : 'none',
          proposalSentAt: submitType === 'proposal' ? new Date().toISOString() : null
        };
      });

      createContract.mutate({ contractData, bookingsData }, {
        onError: (error: any) => {
          if (error.response?.status === 409) {
            const conflictData = error.response.data.conflictingBooking;
            toast({
              title: "⚠️ Booking Conflict Detected",
              description: `One or more dates conflict with existing bookings. First conflict: "${conflictData.eventName}" by ${conflictData.customerName} (${conflictData.startTime} - ${conflictData.endTime}, Status: ${conflictData.status}).`,
              variant: "destructive",
              duration: 8000
            });
          } else {
            toast({
              title: "Error creating contract",
              description: error.response?.data?.message || "An unexpected error occurred",
              variant: "destructive"
            });
          }
        }
      });
    }
  };

  const nextStep = () => {
    // For single venue systems, venue is auto-selected, so only check dates
    // For multi-venue systems, require both venue selection and dates
    const isMultiVenue = Array.isArray(venues) && venues.length > 1;
    const venueRequired = isMultiVenue && !selectedVenue;
    
    if (currentStep === 1 && (venueRequired || selectedDates.length === 0)) {
      if (venueRequired && selectedDates.length === 0) {
        toast({ title: "Please select a venue and at least one date", variant: "destructive" });
      } else if (venueRequired) {
        toast({ title: "Please select a venue", variant: "destructive" });
      } else {
        toast({ title: "Please select at least one date", variant: "destructive" });
      }
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
      <DialogContent className="w-full max-w-[95vw] sm:max-w-6xl max-h-[90vh] p-0 flex flex-col mx-2 sm:mx-4 overflow-hidden">
        <DialogTitle className="sr-only">Create Event</DialogTitle>
        <DialogDescription className="sr-only">
          Create a new event booking with date selection, venue configuration, and customer details.
        </DialogDescription>
        <div className="flex h-full overflow-hidden">
          {/* Left sidebar - Event dates summary (Steps 2 & 3) */}
          {currentStep > 1 && (
            <div className="hidden lg:block w-80 bg-slate-50 border-r border-slate-200 p-6 overflow-y-auto flex-shrink-0">
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
          <div className="flex-1 flex flex-col min-h-0">
            {/* Header */}
            <div className="border-b border-slate-200 p-3 sm:p-6 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-4">
                {currentStep > 1 && (
                  <Button variant="ghost" size="sm" onClick={prevStep}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                )}
                <div className="flex items-center gap-3">
                  <CalendarIcon className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg sm:text-xl font-semibold">
                    {duplicateFromBooking ? "Duplicate Event" : "Create Event"}
                  </h2>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowVoicePanel(true)}
                    className="text-purple-600 border-purple-200 hover:bg-purple-50"
                  >
                    <Mic className="h-4 w-4 mr-2" />
                    Voice Booking
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Close button space */}
              </div>
            </div>

            {/* Step Content */}
            <div className="flex-1 overflow-hidden">
              <div className="h-full p-3 sm:p-6 overflow-y-auto">
              {/* Step 1: Date & Venue Selection */}
              {currentStep === 1 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
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

                  {/* Right: Time Configuration */}
                  <div className="space-y-6">

                    <div>
                      <Label className="text-base font-medium">Configure Dates ({selectedDates.length})</Label>
                      <div className="mt-3 space-y-3 max-h-64 overflow-y-auto">
                        {selectedDates.map((dateInfo, index) => (
                          <Card key={index} className="group relative overflow-hidden border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all duration-200">
                            {/* Modern gradient header */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-100 p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-semibold text-sm">
                                    {format(dateInfo.date, 'd')}
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-slate-900 text-sm">
                                      {format(dateInfo.date, 'EEEE, MMMM d')}
                                    </h4>
                                    <p className="text-xs text-slate-600 mt-0.5">
                                      {format(dateInfo.date, 'yyyy')}
                                    </p>
                                  </div>
                                </div>
                                
                                {/* Availability indicator */}
                                {(() => {
                                  const availability = getSpaceAvailability(
                                    dateInfo.spaceId || '',
                                    dateInfo.date,
                                    dateInfo.startTime,
                                    dateInfo.endTime
                                  );
                                  
                                  if (availability.available) {
                                    return (
                                      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        Available
                                      </div>
                                    );
                                  } else {
                                    const conflict = availability.conflictingBooking;
                                    return (
                                      <div className="text-right">
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-xs font-medium mb-1">
                                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                          Conflict
                                        </div>
                                        <div className="text-xs text-red-600">
                                          {conflict?.eventName}<br/>
                                          {conflict?.startTime} - {conflict?.endTime}
                                        </div>
                                      </div>
                                    );
                                  }
                                })()}
                              </div>
                            </div>

                            {/* Form content */}
                            <div className="p-5 space-y-4">
                              {/* Space Selection */}
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                  <MapPin className="w-4 h-4 text-slate-500" />
                                  Select Space
                                  <span className="text-red-500 text-xs">*</span>
                                </Label>
                                <Select
                                  value={dateInfo.spaceId || ""}
                                  onValueChange={(value) => updateDateTime(index, 'spaceId', value)}
                                >
                                  <SelectTrigger className={cn(
                                    "w-full h-10 transition-colors",
                                    !dateInfo.spaceId 
                                      ? "border-red-200 bg-red-50/30 focus:border-red-400" 
                                      : "border-slate-200 hover:border-slate-300 focus:border-blue-400"
                                  )}>
                                    <SelectValue placeholder="Choose a space" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {selectedVenueData?.spaces?.map((space: any) => (
                                      <SelectItem key={space.id} value={space.id}>
                                        <div className="flex items-center justify-between w-full">
                                          <span>{space.name}</span>
                                          <Badge variant="outline" className="ml-2 text-xs">
                                            {space.capacity} guests
                                          </Badge>
                                        </div>
                                      </SelectItem>
                                    )) || <SelectItem value="no-spaces" disabled>No spaces available</SelectItem>}
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              {/* Time and Details Grid */}
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Event Time */}
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                    <CalendarIcon className="w-4 h-4 text-slate-500" />
                                    Event Time
                                    <span className="text-red-500 text-xs">*</span>
                                  </Label>
                                  <div className="flex items-center gap-2">
                                    <Select
                                      value={dateInfo.startTime}
                                      onValueChange={(value) => updateDateTime(index, 'startTime', value)}
                                    >
                                      <SelectTrigger className={cn(
                                        "flex-1 h-9 text-sm transition-colors",
                                        !dateInfo.startTime 
                                          ? "border-red-200 bg-red-50/30" 
                                          : "border-slate-200 hover:border-slate-300"
                                      )}>
                                        <SelectValue placeholder="Start" />
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
                                    
                                    <span className="text-slate-400 font-medium px-1">→</span>
                                    
                                    <Select
                                      value={dateInfo.endTime}
                                      onValueChange={(value) => updateDateTime(index, 'endTime', value)}
                                    >
                                      <SelectTrigger className={cn(
                                        "flex-1 h-9 text-sm transition-colors",
                                        !dateInfo.endTime 
                                          ? "border-red-200 bg-red-50/30" 
                                          : "border-slate-200 hover:border-slate-300"
                                      )}>
                                        <SelectValue placeholder="End" />
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
                                
                                {/* Guests and Setup */}
                                <div className="grid grid-cols-2 gap-3">
                                  {/* Guest Count */}
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                                      <Users className="w-4 h-4 text-slate-500" />
                                      Guests
                                      <span className="text-red-500 text-xs">*</span>
                                    </Label>
                                    <div className="space-y-1">
                                      <Input
                                        type="number"
                                        min="1"
                                        max="999"
                                        value={dateInfo.guestCount || 1}
                                        onChange={(e) => {
                                          const value = Math.max(1, Math.min(999, parseInt(e.target.value) || 1));
                                          updateDateTime(index, 'guestCount', value);
                                        }}
                                        className="h-9 text-center text-sm font-medium"
                                      />
                                      {(() => {
                                        const selectedSpace = selectedVenueData?.spaces?.find((space: any) => space.id === dateInfo.spaceId);
                                        const guestCount = dateInfo.guestCount || 1;
                                        const capacity = selectedSpace?.capacity || 0;
                                        
                                        if (selectedSpace && guestCount > capacity) {
                                          return (
                                            <div className="flex items-center gap-1 text-xs text-amber-600">
                                              <div className="w-1 h-1 bg-amber-400 rounded-full"></div>
                                              Exceeds capacity ({capacity})
                                            </div>
                                          );
                                        }
                                        return null;
                                      })()}
                                    </div>
                                  </div>

                                  {/* Setup Style */}
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                                      <Grid3X3 className="w-4 h-4 text-slate-500" />
                                      Setup
                                    </Label>
                                    <Select
                                      value={dateInfo.setupStyle || ''}
                                      onValueChange={(value) => updateDateTime(index, 'setupStyle', value)}
                                    >
                                      <SelectTrigger className="h-9 text-sm border-slate-200 hover:border-slate-300">
                                        <SelectValue placeholder="Style" />
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
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
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
                        <div className="bg-white border rounded-lg p-6 space-y-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold">
                                {format(activeDate.date, 'EEEE, MMMM d, yyyy')}
                              </h4>
                              <div className="text-sm text-slate-600 mt-1">
                                {activeDate.startTime} - {activeDate.endTime}
                              </div>
                            </div>
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
                                                                e.stopPropagation();
                                                                const newQuantities = {
                                                                  ...activeDate.itemQuantities,
                                                                  [serviceId]: Math.max(1, parseInt(e.target.value, 10) || 1)
                                                                };
                                                                updateDateConfig('itemQuantities', newQuantities);
                                                              }}
                                                              onClick={(e) => e.stopPropagation()}
                                                              className="w-12 h-5 text-xs"
                                                            />
                                                          </div>
                                                        )}
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              </div>
                                            )}
                                            
                                            <div className="flex items-center justify-between mt-2">
                                              <div className="text-sm font-semibold text-green-600">
                                                ${pkg.pricingModel === 'per_person' 
                                                  ? `${displayPrice.toFixed(2)} per person` 
                                                  : displayPrice.toFixed(2)}
                                              </div>
                                              
                                              {isSelected && (
                                                <div className="flex items-center gap-1">
                                                  <span className="text-xs">$</span>
                                                  <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={overridePrice ?? ''}
                                                    onChange={(e) => {
                                                      e.stopPropagation();
                                                      const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                                                      updateDateConfig('pricingOverrides', {
                                                        ...activeDate.pricingOverrides,
                                                        packagePrice: value
                                                      });
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="w-20 h-6 text-xs"
                                                    placeholder={pkg.price}
                                                  />
                                                </div>
                                              )}
                                            </div>
                                            
                                            {pkg.pricingModel === 'per_person' && (
                                              <div className="text-xs text-slate-500 mt-1">
                                                Total: ${totalPrice.toFixed(2)} for {activeDate.guestCount || 1} guests
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
                                </div>

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
                                        onClick={handleCreateService}
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
                                              <div className="text-sm font-medium text-green-600 mt-1">
                                                ${basePrice.toFixed(2)}
                                                <span className="text-xs text-slate-500 ml-1">
                                                  {service.pricingModel === 'per_person' && 'per person'}
                                                  {service.pricingModel === 'per_hour' && 'per hour'}
                                                  {service.pricingModel === 'fixed' && 'fixed'}
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                          
                                          {isSelected && (
                                            <div className="mt-3 pt-3 border-t border-slate-200 flex items-center gap-4">
                                              {service.pricingModel === 'fixed' && (
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
                                                <span className="text-sm">Price:</span>
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
                            </div>

                            {/* Right Column: Actions & Summary */}
                            <div className="space-y-6">
                              {/* Copy Config for Multi-Date Events */}
                              {selectedDates.length > 1 && (
                                <Card className="p-4 border-blue-200 bg-blue-50">
                                  <h5 className="font-medium mb-2">Apply Settings</h5>
                                  <p className="text-sm text-slate-600 mb-3">
                                    Apply this date's settings to other dates
                                  </p>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowCopyModal(true)}
                                    className="w-full"
                                  >
                                    Apply to Other Dates
                                  </Button>
                                </Card>
                              )}

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
                  <h3 className="text-lg font-semibold">Confirm Details</h3>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
                    <div className="space-y-6">
                      <div>
                        <Label className="text-base font-medium flex items-center gap-2">
                          Event Name
                          <span className="text-red-500 text-sm">*</span>
                        </Label>
                        <Input
                          value={eventName}
                          onChange={(e) => setEventName(e.target.value)}
                          placeholder="e.g., 'Annual Conference 2025'"
                          className={cn("mt-2", !eventName.trim() && "border-red-200 bg-red-50/30")}
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-base font-medium flex items-center gap-2">
                            Customer
                            <span className="text-red-500 text-sm">*</span>
                          </Label>
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
                            <SelectTrigger className={cn(!selectedCustomer && "border-red-200 bg-red-50/30")}>
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
                                  <Label className="text-sm flex items-center gap-1">
                                    Name
                                    <span className="text-red-500 text-xs">*</span>
                                  </Label>
                                  <Input
                                    value={newCustomer.name}
                                    onChange={(e) => setNewCustomer(prev => ({...prev, name: e.target.value}))}
                                    placeholder="Customer name"
                                    className={cn("mt-1", !newCustomer.name.trim() && "border-red-200 bg-red-50/30")}
                                  />
                                </div>
                                <div>
                                  <Label className="text-sm flex items-center gap-1">
                                    Email
                                    <span className="text-red-500 text-xs">*</span>
                                  </Label>
                                  <Input
                                    type="email"
                                    value={newCustomer.email}
                                    onChange={(e) => setNewCustomer(prev => ({...prev, email: e.target.value}))}
                                    placeholder="customer@example.com"
                                    className={cn("mt-1", !newCustomer.email.trim() && "border-red-200 bg-red-50/30")}
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
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold">Final Summary</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowSummaryDetails(true)}
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          View Details
                        </Button>
                      </div>
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
                            <span>Total Price</span>
                            <span>${totalPrice.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}


            </div>
          </div>

          {/* Fixed Footer */}
          <div className="border-t border-slate-200 p-3 sm:p-6 bg-white flex-shrink-0 mt-auto">
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
              {/* Left: Venue Selection & Summary */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                {currentStep === 1 && Array.isArray(venues) && venues.length > 1 && (
                  <div className="flex items-center gap-3">
                    <Label className="text-sm font-medium text-slate-700 whitespace-nowrap flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      Venue*
                    </Label>
                    <Select value={selectedVenue} onValueChange={setSelectedVenue}>
                      <SelectTrigger className={cn("w-64", !selectedVenue && "border-red-200 bg-red-50/30")}>
                        <SelectValue placeholder="Select venue" />
                      </SelectTrigger>
                      <SelectContent>
                        {(venues as any[]).map((venue: any) => (
                          <SelectItem key={venue.id} value={venue.id}>
                            {venue.name} ({venue.spaces?.length || 0} spaces)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                

                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">Grand Total</span>
                  <span className="text-lg font-semibold">${totalPrice.toFixed(2)}</span>
                </div>
              </div>
              
              {/* Right: Action Buttons */}
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
                    disabled={currentStep === 1 && (selectedDates.length === 0 || (Array.isArray(venues) && venues.length > 1 && !selectedVenue))}
                  >
                    {currentStep === 1 ? `Configure ${selectedDates.length} Event Date${selectedDates.length !== 1 ? 's' : ''}` : 'Next'}
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => handleSubmit('proposal')}
                      disabled={!eventName || !selectedCustomer || selectedDates.length === 0 || createBooking.isPending}
                      className="border-blue-500 text-blue-600 hover:bg-blue-50"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {createBooking.isPending ? 'Sending...' : 'Send as Proposal'}
                    </Button>
                    <Button 
                      onClick={() => handleSubmit('inquiry')}
                      className="bg-blue-600 hover:bg-blue-700"
                      disabled={createBooking.isPending}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {createBooking.isPending ? 'Creating...' : 'Save Event'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
          </div>
        </div>
      </DialogContent>

      {/* Apply Settings Modal */}
      <Dialog open={showCopyModal} onOpenChange={setShowCopyModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Apply Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Apply the current date's settings to selected dates below:
            </p>
            
            <div className="space-y-2">
              {selectedDates.map((date, index) => {
                if (index === activeTabIndex) return null; // Don't show current date
                
                const checkboxIndex = selectedDates
                  .map((_, i) => i)
                  .filter(i => i !== activeTabIndex)
                  .indexOf(index);
                
                return (
                  <label key={index} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer">
                    <Checkbox 
                      checked={selectedCopyIndices.includes(index)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedCopyIndices(prev => [...prev, index]);
                        } else {
                          setSelectedCopyIndices(prev => prev.filter(i => i !== index));
                        }
                      }}
                    />
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
                  handleCopyConfig(selectedCopyIndices);
                  setSelectedCopyIndices([]);
                }}
                disabled={selectedCopyIndices.length === 0}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Apply Settings ({selectedCopyIndices.length})
              </Button>
              <Button variant="outline" onClick={() => {
                setShowCopyModal(false);
                setSelectedCopyIndices([]);
              }}>
                Cancel
              </Button>
            </div>
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
                    <SelectItem value="additional">Additional Services</SelectItem>
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
                    <SelectItem value="per_hour">Per Hour</SelectItem>
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
                setNewService({ name: "", description: "", category: "additional", price: "", pricingModel: "fixed" });
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

      {/* Voice Booking Panel Modal */}
      <Dialog open={showVoicePanel} onOpenChange={setShowVoicePanel}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Voice Booking Assistant</DialogTitle>
            <DialogDescription>
              Use voice commands to create and populate booking forms. Perfect for capturing customer calls.
            </DialogDescription>
          </DialogHeader>
          <VoiceBookingPanel 
            onBookingDataExtracted={handleVoiceDataExtracted}
            isCallMode={true}
          />
        </DialogContent>
      </Dialog>

      {/* Summary Details Modal */}
      <Dialog open={showSummaryDetails} onOpenChange={setShowSummaryDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Event Details Summary</DialogTitle>
            <DialogDescription>
              Complete breakdown of all selected packages, services, and pricing for your event.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {selectedDates.map((date, index) => {
              const selectedPackage = date.packageId ? (packages as any[])?.find((p: any) => p.id === date.packageId) : null;
              const selectedServicesList = (date.selectedServices || []).map(serviceId => 
                (services as any[])?.find((s: any) => s.id === serviceId)
              ).filter(Boolean);
              const dateTotal = calculateDateTotal(date);
              
              return (
                <div key={index} className="border rounded-lg p-4 bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="font-semibold text-lg">
                      {format(date.date, 'EEEE, MMMM d, yyyy')}
                    </h5>
                    <div className="text-right">
                      <div className="text-sm text-slate-600">Date Total</div>
                      <div className="font-semibold text-lg">${dateTotal.toFixed(2)}</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Event Details */}
                    <div>
                      <h6 className="font-medium mb-3">Event Details</h6>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Time:</span>
                          <span>{date.startTime} - {date.endTime}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Guests:</span>
                          <span>{date.guestCount || 1}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Space:</span>
                          <span>
                            {date.spaceId 
                              ? (venues as any[])?.find((v: any) => v.id === selectedVenue)?.spaces?.find((s: any) => s.id === date.spaceId)?.name || "Not specified"
                              : "Not specified"
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Package Information */}
                    <div>
                      <h6 className="font-medium mb-3">Package & Pricing</h6>
                      {selectedPackage ? (
                        <div className="space-y-3">
                          <div className="p-3 bg-blue-50 rounded border border-blue-200">
                            <div className="font-medium text-sm">{selectedPackage.name}</div>
                            <div className="text-xs text-slate-600 mt-1">{selectedPackage.description}</div>
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-xs text-slate-600">Package Price:</span>
                              <span className="text-sm font-medium">
                                ${(date.pricingOverrides?.packagePrice ?? parseFloat(selectedPackage.price)).toFixed(2)}
                                {selectedPackage.pricingModel === 'per_person' && ` x ${date.guestCount || 1}`}
                              </span>
                            </div>
                          </div>
                          
                          {/* Included Services */}
                          {selectedPackage.includedServiceIds && selectedPackage.includedServiceIds.length > 0 && (
                            <div>
                              <div className="text-xs text-slate-600 mb-2">Included Services:</div>
                              <div className="space-y-1">
                                {selectedPackage.includedServiceIds.map((serviceId: string) => {
                                  const service = (services as any[])?.find((s: any) => s.id === serviceId);
                                  const quantity = date.itemQuantities?.[serviceId] || 1;
                                  return service ? (
                                    <div key={serviceId} className="flex justify-between text-xs">
                                      <span className="text-green-700">{service.name}</span>
                                      <span className="text-slate-600">
                                        {service.pricingModel !== 'per_person' && quantity > 1 ? `Qty: ${quantity}` : 'Included'}
                                      </span>
                                    </div>
                                  ) : null;
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-slate-500 italic">No package selected</div>
                      )}
                    </div>
                  </div>
                  
                  {/* Additional Services */}
                  {selectedServicesList.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <h6 className="font-medium mb-3">Additional Services</h6>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedServicesList.map((service: any) => {
                          const quantity = date.itemQuantities?.[service.id] || 1;
                          const overridePrice = date.pricingOverrides?.servicePrices?.[service.id];
                          const price = overridePrice ?? parseFloat(service.price || 0);
                          const eventDuration = calculateEventDuration(date.startTime, date.endTime);
                          const totalPrice = service.pricingModel === 'per_person' 
                            ? price * (date.guestCount || 1)
                            : service.pricingModel === 'per_hour'
                            ? price * eventDuration
                            : price * quantity;
                          
                          return (
                            <div key={service.id} className="p-3 bg-slate-50 rounded border">
                              <div className="font-medium text-sm">{service.name}</div>
                              <div className="text-xs text-slate-600 mt-1">{service.description}</div>
                              <div className="flex justify-between items-center mt-2">
                                <span className="text-xs text-slate-600">
                                  {service.pricingModel === 'per_person' 
                                    ? `$${price.toFixed(2)} x ${date.guestCount || 1} guests`
                                    : service.pricingModel === 'per_hour'
                                    ? `$${price.toFixed(2)} x ${eventDuration.toFixed(1)} hours`
                                    : quantity > 1 
                                      ? `$${price.toFixed(2)} x ${quantity}`
                                      : `$${price.toFixed(2)}`
                                  }
                                </span>
                                <span className="text-sm font-medium">${totalPrice.toFixed(2)}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            
            {/* Grand Total */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Grand Total</span>
                <span className="text-xl font-bold text-blue-600">${totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end mt-6">
            <Button variant="outline" onClick={() => setShowSummaryDetails(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Proposal Creation Modal */}
      {showCreateProposal && (
        <ProposalCreationModal
          open={showCreateProposal}
          onOpenChange={setShowCreateProposal}
          eventData={{
            eventName,
            customerId: selectedCustomer,
            eventDates: selectedDates.map(d => ({
              date: d.date,
              startTime: d.startTime,
              endTime: d.endTime,
              venue: selectedVenueData?.name || "",
              space: d.spaceId ? (venues as any[])?.find((v: any) => v.id === selectedVenue)?.spaces?.find((s: any) => s.id === d.spaceId)?.name || "" : "",
              guestCount: d.guestCount || 1,
              selectedPackage: d.packageId ? (packages as any[])?.find((p: any) => p.id === d.packageId) : null,
              selectedServices: d.selectedServices || [],
              totalAmount: calculateDateTotal(d)
            })),
            totalAmount: totalPrice,
            packageItems: selectedDates.map(d => d.packageId ? (packages as any[])?.find((p: any) => p.id === d.packageId) : null).filter(Boolean),
            serviceItems: selectedDates.flatMap(d => (d.selectedServices || []).map(serviceId => (services as any[])?.find((s: any) => s.id === serviceId))).filter(Boolean)
          }}
        />
      )}
    </Dialog>
  );
}