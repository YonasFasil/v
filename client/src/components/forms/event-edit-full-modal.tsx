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
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, getDay, isBefore, isToday, startOfDay } from "date-fns";
import { ChevronLeft, ChevronRight, X, Plus, Trash2, Save, Edit, Minus, FileText, Send, MessageSquare, Mail, Phone, Users, Grid3X3, MapPin, Calendar as CalendarIcon } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type EventStatus, getStatusConfig } from "@shared/status-utils";

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
  setupStyle?: string;
  itemQuantities?: Record<string, number>;
  pricingOverrides?: {
    packagePrice?: number;
    servicePrices?: Record<string, number>;
  };
  serviceTaxOverrides?: Record<string, {
    enabledTaxIds: string[];
    enabledFeeIds: string[];
    disabledInheritedTaxIds?: string[];
    disabledInheritedFeeIds?: string[];
  }>;
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
  const [selectedCopyIndices, setSelectedCopyIndices] = useState<number[]>([]);
  
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
  
  // Generate time slots for dropdowns (AM/PM format)
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        const ampm = hour < 12 ? 'AM' : 'PM';
        const minuteStr = minute.toString().padStart(2, '0');
        const displayTime = `${displayHour}:${minuteStr} ${ampm}`;
        const value = `${hour.toString().padStart(2, '0')}:${minuteStr}`; // Store in 24-hour format
        slots.push({ display: displayTime, value });
      }
    }
    return slots;
  }, []);

  // Helper function to convert 24-hour format to AM/PM display
  const formatTimeForDisplay = (time24: string) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour24 = parseInt(hours, 10);
    const displayHour = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 < 12 ? 'AM' : 'PM';
    return `${displayHour}:${minutes} ${ampm}`;
  };
  
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

  // Tax/Fee configuration
  const [taxFeeOverrides, setTaxFeeOverrides] = useState<{
    enabledTaxIds: string[];
    enabledFeeIds: string[];
  }>({
    enabledTaxIds: [],
    enabledFeeIds: []
  });

  // Data queries
  const { data: venues = [] } = useQuery({ queryKey: ["/api/venues-with-spaces"] });
  const { data: packages = [] } = useQuery({ queryKey: ["/api/packages"] });
  const { data: services = [] } = useQuery({ queryKey: ["/api/services"] });
  const { data: customers = [] } = useQuery({ queryKey: ["/api/customers"] });
  const { data: taxSettings = [] } = useQuery({ queryKey: ["/api/tax-settings"] });
  const { data: existingBookings = [] } = useQuery({ queryKey: ["/api/bookings"] });

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
          pricingOverrides: event.pricingOverrides || {},
          serviceTaxOverrides: event.serviceTaxOverrides || {}
        }));
        
        setSelectedDates(contractDates);
        setActiveTabIndex(0);
        
        // Initialize tax/fee overrides from contract data if available
        if (booking.contractEvents?.[0]?.taxFeeOverrides) {
          setTaxFeeOverrides(booking.contractEvents[0].taxFeeOverrides);
        }
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
          pricingOverrides: booking.pricingOverrides || {},
          serviceTaxOverrides: booking.serviceTaxOverrides || {}
        };
        
        setSelectedDates([bookingDate]);
        setActiveTabIndex(0);
        
        // Initialize tax/fee overrides from booking data
        if (booking.taxFeeOverrides) {
          setTaxFeeOverrides(booking.taxFeeOverrides);
        }
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

  // Function to check space availability for a specific date and time (excluding current booking)
  const getSpaceAvailability = (spaceId: string, date: Date, startTime: string, endTime: string) => {
    if (!spaceId || !(existingBookings as any[])?.length) return { available: true, conflictingBooking: null };
    
    const conflicts = (existingBookings as any[]).filter(existingBooking => {
      // Exclude the current booking being edited
      if (existingBooking.id === booking?.id) return false;
      if (existingBooking.status === 'cancelled') return false;
      if (existingBooking.spaceId !== spaceId) return false;
      
      const bookingDate = new Date(existingBooking.eventDate);
      if (bookingDate.toDateString() !== date.toDateString()) return false;

      // Parse times - handle both 24hr format and 12hr format
      const parseTime = (timeStr: string) => {
        if (!timeStr) return 0;
        
        if (timeStr.includes('AM') || timeStr.includes('PM')) {
          // 12-hour format (like "09:00 AM", "05:00 PM")
          const [time, period] = timeStr.split(' ');
          const [hours, minutes] = time.split(':').map(Number);
          let hour24 = hours;
          if (period === 'PM' && hours !== 12) hour24 += 12;
          if (period === 'AM' && hours === 12) hour24 = 0;
          return hour24 + (minutes || 0) / 60;
        } else {
          // 24-hour format (like "09:00", "17:00")
          const [hours, minutes] = timeStr.split(':').map(Number);
          return hours + (minutes || 0) / 60;
        }
      };

      const newStart = parseTime(startTime);
      const newEnd = parseTime(endTime);
      const existingStart = parseTime(existingBooking.startTime);
      const existingEnd = parseTime(existingBooking.endTime);

      // Check for time overlap
      return (newStart < existingEnd && newEnd > existingStart);
    });
    
    return {
      available: conflicts.length === 0,
      conflictingBooking: conflicts[0] || null
    };
  };

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

  // Calculate total price including taxes and fees
  const totalPrice = useMemo(() => {
    let subtotal = selectedDates.reduce((total, dateConfig) => {
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

    // Calculate fees
    let feesTotal = 0;
    (taxSettings as any[])?.forEach((fee: any) => {
      if ((fee.type === 'fee' || fee.type === 'service_charge') && 
          fee.isActive && 
          taxFeeOverrides.enabledFeeIds.includes(fee.id)) {
        
        if (fee.calculation === 'percentage') {
          feesTotal += subtotal * (parseFloat(fee.value) / 100);
        } else {
          feesTotal += parseFloat(fee.value);
        }
      }
    });

    // Calculate taxes on subtotal + taxable fees
    const taxableFees = (taxSettings as any[])
      ?.filter((fee: any) => 
        (fee.type === 'fee' || fee.type === 'service_charge') && 
        fee.isActive && 
        fee.isTaxable &&
        taxFeeOverrides.enabledFeeIds.includes(fee.id))
      .reduce((sum, fee) => {
        const feeAmount = fee.calculation === 'percentage' 
          ? subtotal * (parseFloat(fee.value) / 100)
          : parseFloat(fee.value);
        return sum + feeAmount;
      }, 0) || 0;

    const taxableBase = subtotal + taxableFees;
    
    let taxesTotal = 0;
    (taxSettings as any[])?.forEach((tax: any) => {
      if (tax.type === 'tax' && 
          tax.isActive && 
          taxFeeOverrides.enabledTaxIds.includes(tax.id)) {
        
        taxesTotal += taxableBase * (parseFloat(tax.value) / 100);
      }
    });

    return subtotal + feesTotal + taxesTotal;
  }, [selectedDates, packages, services, taxSettings, taxFeeOverrides]);

  // Create customer mutation
  const createCustomer = useMutation({
    mutationFn: async (customerData: any) => {
      return await apiRequest("POST", "/api/customers", customerData);
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
      const response = await apiRequest("PATCH", `/api/bookings/${booking.id}`, bookingData);
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
      const response = await apiRequest("DELETE", `/api/bookings/${booking.id}`);
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

  const nextStep = () => {
    // Validate step 1 requirements before proceeding
    if (currentStep === 1) {
      if (selectedDates.length === 0) {
        toast({ title: "Please select at least one date", variant: "destructive" });
        return;
      }

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

      // Check for past dates
      const today = startOfDay(new Date());
      const pastDates = selectedDates.filter(dateInfo => isBefore(dateInfo.date, today));
      if (pastDates.length > 0) {
        const pastDatesList = pastDates.map(d => format(d.date, 'MMM d, yyyy')).join(', ');
        toast({
          title: "❌ Cannot Proceed - Past Date Selected",
          description: `Past dates cannot be used for event booking: ${pastDatesList}. Please remove past dates and select future dates only.`,
          variant: "destructive",
          duration: 8000
        });
        return;
      }

      // Check for blocking conflicts before proceeding to step 2
      const blockingStatuses = ['confirmed_deposit_paid', 'confirmed_fully_paid'];
      const blockingConflicts = selectedDates.filter(dateInfo => {
        const availability = getSpaceAvailability(
          dateInfo.spaceId!,
          dateInfo.date,
          dateInfo.startTime,
          dateInfo.endTime
        );
        
        if (!availability.available && availability.conflictingBooking) {
          const conflictStatus = availability.conflictingBooking.status;
          return blockingStatuses.includes(conflictStatus);
        }
        return false;
      });

      if (blockingConflicts.length > 0) {
        const firstConflict = getSpaceAvailability(
          blockingConflicts[0].spaceId!,
          blockingConflicts[0].date,
          blockingConflicts[0].startTime,
          blockingConflicts[0].endTime
        ).conflictingBooking;
        
        const statusLabel = getStatusConfig(firstConflict!.status).label;
        
        toast({
          title: "❌ Cannot Proceed - Booking Conflict",
          description: `Cannot proceed due to confirmed paid booking conflict on ${format(blockingConflicts[0].date, 'MMM d, yyyy')}. "${firstConflict!.eventName}" (${firstConflict!.startTime} - ${firstConflict!.endTime}, Status: ${statusLabel}) has confirmed payment and cannot be overbooked.`,
          variant: "destructive",
          duration: 10000
        });
        return;
      }
    }
    
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };
  
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  // Helper function to check for blocking conflicts and past dates
  const hasBlockingConflicts = () => {
    try {
      const today = startOfDay(new Date());
      
      return selectedDates.some(dateInfo => {
        // Check for past dates
        if (isBefore(dateInfo.date, today)) {
          return true;
        }
        
        if (!dateInfo.spaceId) return false;
        
        // Check for booking conflicts
        const blockingStatuses = ['confirmed_deposit_paid', 'confirmed_fully_paid'];
        const availability = getSpaceAvailability(
          dateInfo.spaceId,
          dateInfo.date,
          dateInfo.startTime,
          dateInfo.endTime
        );
        
        if (!availability.available && availability.conflictingBooking) {
          return blockingStatuses.includes(availability.conflictingBooking.status);
        }
        return false;
      });
    } catch (error) {
      console.error('Error in hasBlockingConflicts:', error);
      return false;
    }
  };

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
    
    // Block past date selection
    const today = startOfDay(new Date());
    if (isBefore(day, today)) {
      toast({
        title: "❌ Cannot Select Past Date",
        description: "Past dates cannot be selected for event booking. Please choose today or a future date.",
        variant: "destructive",
        duration: 5000
      });
      return;
    }
    
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

    // Check for past dates before saving
    const today = startOfDay(new Date());
    const pastDates = selectedDates.filter(dateInfo => isBefore(dateInfo.date, today));
    if (pastDates.length > 0) {
      const pastDatesList = pastDates.map(d => format(d.date, 'MMM d, yyyy')).join(', ');
      toast({
        title: "❌ Cannot Save - Past Date Selected",
        description: `Past dates cannot be used for event booking: ${pastDatesList}. Please remove past dates and select future dates only.`,
        variant: "destructive",
        duration: 8000
      });
      return;
    }

    // Check for blocking conflicts before saving
    const blockingStatuses = ['confirmed_deposit_paid', 'confirmed_fully_paid'];
    const blockingConflicts = selectedDates.filter(dateInfo => {
      if (!dateInfo.spaceId) return false;
      
      const availability = getSpaceAvailability(
        dateInfo.spaceId,
        dateInfo.date,
        dateInfo.startTime,
        dateInfo.endTime
      );
      
      if (!availability.available && availability.conflictingBooking) {
        const conflictStatus = availability.conflictingBooking.status;
        return blockingStatuses.includes(conflictStatus);
      }
      return false;
    });

    if (blockingConflicts.length > 0) {
      const firstConflict = getSpaceAvailability(
        blockingConflicts[0].spaceId!,
        blockingConflicts[0].date,
        blockingConflicts[0].startTime,
        blockingConflicts[0].endTime
      ).conflictingBooking;
      
      const statusLabel = getStatusConfig(firstConflict!.status).label;
      
      toast({
        title: "❌ Cannot Save - Booking Conflict",
        description: `Cannot save changes due to confirmed paid booking conflict on ${format(blockingConflicts[0].date, 'MMM d, yyyy')}. "${firstConflict!.eventName}" (${firstConflict!.startTime} - ${firstConflict!.endTime}, Status: ${statusLabel}) has confirmed payment and cannot be overbooked.`,
        variant: "destructive",
        duration: 10000
      });
      return;
    }

    // Calculate the correct total amount using the new per-service tax logic
    let calculatedTotal = 0;
    selectedDates.forEach(date => {
      // Package price
      if (date.packageId) {
        const pkg = (packages as any[])?.find((p: any) => p.id === date.packageId);
        if (pkg) {
          const packagePrice = date.pricingOverrides?.packagePrice ?? parseFloat(pkg.price || 0);
          let packageSubtotal = 0;
          if (pkg.pricingModel === 'per_person') {
            packageSubtotal = packagePrice * (date.guestCount || 1);
          } else {
            packageSubtotal = packagePrice;
          }
          calculatedTotal += packageSubtotal;

          // Calculate package fees and taxes using serviceTaxOverrides
          const currentOverrides = date.serviceTaxOverrides?.[pkg.id] || { enabledTaxIds: [], enabledFeeIds: [], disabledInheritedTaxIds: [], disabledInheritedFeeIds: [] };
          
          // Calculate effective fee IDs (inherited + additional - disabled)
          const inheritedFeeIds = pkg.enabledFeeIds || [];
          const additionalFeeIds = currentOverrides.enabledFeeIds || [];
          const disabledFeeIds = currentOverrides.disabledInheritedFeeIds || [];
          const effectiveFeeIds = [...inheritedFeeIds.filter((id: string) => !disabledFeeIds.includes(id)), ...additionalFeeIds];
          
          // Apply package fees
          effectiveFeeIds.forEach((feeId: string) => {
            const fee = (taxSettings as any[])?.find(f => f.id === feeId);
            if (fee && fee.isActive) {
              let feeAmount = 0;
              if (fee.calculation === 'percentage') {
                feeAmount = packageSubtotal * (parseFloat(fee.value) / 100);
              } else {
                feeAmount = parseFloat(fee.value);
              }
              calculatedTotal += feeAmount;
              
              // Apply taxes to fees if the fee is taxable
              if (fee.isTaxable && fee.applicableTaxIds && fee.applicableTaxIds.length > 0) {
                fee.applicableTaxIds.forEach((taxId: string) => {
                  const tax = (taxSettings as any[])?.find(t => t.id === taxId);
                  if (tax && tax.isActive) {
                    const taxOnFeeAmount = feeAmount * (parseFloat(tax.value) / 100);
                    calculatedTotal += taxOnFeeAmount;
                  }
                });
              }
            }
          });

          // Calculate effective tax IDs (inherited + additional - disabled)
          const inheritedTaxIds = pkg.enabledTaxIds || [];
          const additionalTaxIds = currentOverrides.enabledTaxIds || [];
          const disabledTaxIds = currentOverrides.disabledInheritedTaxIds || [];
          const effectiveTaxIds = [...inheritedTaxIds.filter((id: string) => !disabledTaxIds.includes(id)), ...additionalTaxIds];
          
          // Apply package taxes
          effectiveTaxIds.forEach((taxId: string) => {
            const tax = (taxSettings as any[])?.find(t => t.id === taxId);
            if (tax && tax.isActive) {
              const taxAmount = packageSubtotal * (parseFloat(tax.value) / 100);
              calculatedTotal += taxAmount;
            }
          });
        }
      }
      
      // Services price
      date.selectedServices?.forEach(serviceId => {
        const service = (services as any[]).find((s: any) => s.id === serviceId);
        if (service) {
          const servicePrice = date.pricingOverrides?.servicePrices?.[serviceId] ?? parseFloat(service.price || 0);
          let serviceSubtotal = 0;
          if (service.pricingModel === 'per_person') {
            serviceSubtotal = servicePrice * (date.guestCount || 1);
          } else {
            const quantity = date.itemQuantities?.[serviceId] || 1;
            serviceSubtotal = servicePrice * quantity;
          }
          calculatedTotal += serviceSubtotal;

          // Calculate service fees and taxes using serviceTaxOverrides
          const currentOverrides = date.serviceTaxOverrides?.[serviceId] || { enabledTaxIds: [], enabledFeeIds: [], disabledInheritedTaxIds: [], disabledInheritedFeeIds: [] };
          
          // Calculate effective fee IDs (inherited + additional - disabled)
          const inheritedFeeIds = service.enabledFeeIds || [];
          const additionalFeeIds = currentOverrides.enabledFeeIds || [];
          const disabledFeeIds = currentOverrides.disabledInheritedFeeIds || [];
          const effectiveFeeIds = [...inheritedFeeIds.filter((id: string) => !disabledFeeIds.includes(id)), ...additionalFeeIds];
          
          // Apply service fees
          effectiveFeeIds.forEach((feeId: string) => {
            const fee = (taxSettings as any[])?.find(f => f.id === feeId);
            if (fee && fee.isActive) {
              let feeAmount = 0;
              if (fee.calculation === 'percentage') {
                feeAmount = serviceSubtotal * (parseFloat(fee.value) / 100);
              } else {
                feeAmount = parseFloat(fee.value);
              }
              calculatedTotal += feeAmount;
              
              // Apply taxes to fees if the fee is taxable
              if (fee.isTaxable && fee.applicableTaxIds && fee.applicableTaxIds.length > 0) {
                fee.applicableTaxIds.forEach((taxId: string) => {
                  const tax = (taxSettings as any[])?.find(t => t.id === taxId);
                  if (tax && tax.isActive) {
                    const taxOnFeeAmount = feeAmount * (parseFloat(tax.value) / 100);
                    calculatedTotal += taxOnFeeAmount;
                  }
                });
              }
            }
          });

          // Calculate effective tax IDs (inherited + additional - disabled)
          const inheritedTaxIds = service.enabledTaxIds || [];
          const additionalTaxIds = currentOverrides.enabledTaxIds || [];
          const disabledTaxIds = currentOverrides.disabledInheritedTaxIds || [];
          const effectiveTaxIds = [...inheritedTaxIds.filter((id: string) => !disabledTaxIds.includes(id)), ...additionalTaxIds];
          
          // Apply service taxes
          effectiveTaxIds.forEach((taxId: string) => {
            const tax = (taxSettings as any[])?.find(t => t.id === taxId);
            if (tax && tax.isActive) {
              const taxAmount = serviceSubtotal * (parseFloat(tax.value) / 100);
              calculatedTotal += taxAmount;
            }
          });
        }
      });
    });

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
      totalAmount: calculatedTotal.toString(),
      depositAmount: (calculatedTotal * 0.3).toString(),
      depositPaid: false,
      notes: "",
      itemQuantities: primaryDate.itemQuantities || {},
      pricingOverrides: primaryDate.pricingOverrides || {},
      serviceTaxOverrides: primaryDate.serviceTaxOverrides || null
    };

    updateBooking.mutate(bookingData);
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      deleteBooking.mutate();
    }
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
    
    const customerData = {
      ...newCustomer,
      customerType: "individual" // CRITICAL: Add missing customerType
    };
    
    createCustomer.mutate(customerData);
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
                        ${(() => {
                          // Calculate real-time total for all contract events using current configuration
                          let contractTotal = 0;
                          
                          selectedDates.forEach(date => {
                            // Package price
                            if (date.packageId) {
                              const pkg = (packages as any[])?.find((p: any) => p.id === date.packageId);
                              if (pkg) {
                                const packagePrice = date.pricingOverrides?.packagePrice ?? parseFloat(pkg.price || 0);
                                let packageSubtotal = 0;
                                if (pkg.pricingModel === 'per_person') {
                                  packageSubtotal = packagePrice * (date.guestCount || 1);
                                } else {
                                  packageSubtotal = packagePrice;
                                }
                                contractTotal += packageSubtotal;

                                // Calculate package fees and taxes using serviceTaxOverrides
                                const currentOverrides = date.serviceTaxOverrides?.[pkg.id] || { enabledTaxIds: [], enabledFeeIds: [], disabledInheritedTaxIds: [], disabledInheritedFeeIds: [] };
                                
                                // Calculate effective fee IDs (inherited + additional - disabled)
                                const inheritedFeeIds = pkg.enabledFeeIds || [];
                                const additionalFeeIds = currentOverrides.enabledFeeIds || [];
                                const disabledFeeIds = currentOverrides.disabledInheritedFeeIds || [];
                                const effectiveFeeIds = [...inheritedFeeIds.filter((id: string) => !disabledFeeIds.includes(id)), ...additionalFeeIds];
                                
                                // Apply package fees
                                effectiveFeeIds.forEach((feeId: string) => {
                                  const fee = (taxSettings as any[])?.find(f => f.id === feeId);
                                  if (fee && fee.isActive) {
                                    let feeAmount = 0;
                                    if (fee.calculation === 'percentage') {
                                      feeAmount = packageSubtotal * (parseFloat(fee.value) / 100);
                                    } else {
                                      feeAmount = parseFloat(fee.value);
                                    }
                                    contractTotal += feeAmount;
                                    
                                    // Apply taxes to fees if the fee is taxable
                                    if (fee.isTaxable && fee.applicableTaxIds && fee.applicableTaxIds.length > 0) {
                                      fee.applicableTaxIds.forEach((taxId: string) => {
                                        const tax = (taxSettings as any[])?.find(t => t.id === taxId);
                                        if (tax && tax.isActive) {
                                          const taxOnFeeAmount = feeAmount * (parseFloat(tax.value) / 100);
                                          contractTotal += taxOnFeeAmount;
                                        }
                                      });
                                    }
                                  }
                                });

                                // Calculate effective tax IDs (inherited + additional - disabled)
                                const inheritedTaxIds = pkg.enabledTaxIds || [];
                                const additionalTaxIds = currentOverrides.enabledTaxIds || [];
                                const disabledTaxIds = currentOverrides.disabledInheritedTaxIds || [];
                                const effectiveTaxIds = [...inheritedTaxIds.filter((id: string) => !disabledTaxIds.includes(id)), ...additionalTaxIds];
                                
                                // Apply package taxes
                                effectiveTaxIds.forEach((taxId: string) => {
                                  const tax = (taxSettings as any[])?.find(t => t.id === taxId);
                                  if (tax && tax.isActive) {
                                    const taxAmount = packageSubtotal * (parseFloat(tax.value) / 100);
                                    contractTotal += taxAmount;
                                  }
                                });
                              }
                            }
                            
                            // Services price
                            date.selectedServices?.forEach(serviceId => {
                              const service = (services as any[]).find((s: any) => s.id === serviceId);
                              if (service) {
                                const servicePrice = date.pricingOverrides?.servicePrices?.[serviceId] ?? parseFloat(service.price || 0);
                                let serviceSubtotal = 0;
                                if (service.pricingModel === 'per_person') {
                                  serviceSubtotal = servicePrice * (date.guestCount || 1);
                                } else {
                                  const quantity = date.itemQuantities?.[serviceId] || 1;
                                  serviceSubtotal = servicePrice * quantity;
                                }
                                contractTotal += serviceSubtotal;

                                // Calculate service fees and taxes using serviceTaxOverrides
                                const currentOverrides = date.serviceTaxOverrides?.[serviceId] || { enabledTaxIds: [], enabledFeeIds: [], disabledInheritedTaxIds: [], disabledInheritedFeeIds: [] };
                                
                                // Calculate effective fee IDs (inherited + additional - disabled)
                                const inheritedFeeIds = service.enabledFeeIds || [];
                                const additionalFeeIds = currentOverrides.enabledFeeIds || [];
                                const disabledFeeIds = currentOverrides.disabledInheritedFeeIds || [];
                                const effectiveFeeIds = [...inheritedFeeIds.filter((id: string) => !disabledFeeIds.includes(id)), ...additionalFeeIds];
                                
                                // Apply service fees
                                effectiveFeeIds.forEach((feeId: string) => {
                                  const fee = (taxSettings as any[])?.find(f => f.id === feeId);
                                  if (fee && fee.isActive) {
                                    let feeAmount = 0;
                                    if (fee.calculation === 'percentage') {
                                      feeAmount = serviceSubtotal * (parseFloat(fee.value) / 100);
                                    } else {
                                      feeAmount = parseFloat(fee.value);
                                    }
                                    contractTotal += feeAmount;
                                    
                                    // Apply taxes to fees if the fee is taxable
                                    if (fee.isTaxable && fee.applicableTaxIds && fee.applicableTaxIds.length > 0) {
                                      fee.applicableTaxIds.forEach((taxId: string) => {
                                        const tax = (taxSettings as any[])?.find(t => t.id === taxId);
                                        if (tax && tax.isActive) {
                                          const taxOnFeeAmount = feeAmount * (parseFloat(tax.value) / 100);
                                          contractTotal += taxOnFeeAmount;
                                        }
                                      });
                                    }
                                  }
                                });

                                // Calculate effective tax IDs (inherited + additional - disabled)
                                const inheritedTaxIds = service.enabledTaxIds || [];
                                const additionalTaxIds = currentOverrides.enabledTaxIds || [];
                                const disabledTaxIds = currentOverrides.disabledInheritedTaxIds || [];
                                const effectiveTaxIds = [...inheritedTaxIds.filter((id: string) => !disabledTaxIds.includes(id)), ...additionalTaxIds];
                                
                                // Apply service taxes
                                effectiveTaxIds.forEach((taxId: string) => {
                                  const tax = (taxSettings as any[])?.find(t => t.id === taxId);
                                  if (tax && tax.isActive) {
                                    const taxAmount = serviceSubtotal * (parseFloat(tax.value) / 100);
                                    contractTotal += taxAmount;
                                  }
                                });
                              }
                            });
                          });

                          return contractTotal.toLocaleString();
                        })()}
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
                        const today = startOfDay(new Date());
                        const isPast = isBefore(day, today);
                        const isTodayDate = isToday(day);
                        
                        return (
                          <button
                            key={index}
                            onClick={() => handleDateClick(day)}
                            disabled={isPast}
                            className={cn(
                              "h-12 w-12 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                              isPast 
                                ? "text-slate-300 cursor-not-allowed bg-slate-50" 
                                : isCurrentMonth 
                                  ? "text-slate-900 hover:bg-slate-100" 
                                  : "text-slate-400",
                              isSelected && !isPast && "bg-blue-600 text-white hover:bg-blue-700",
                              isTodayDate && !isSelected && !isPast && "bg-green-50 text-green-700 border border-green-200"
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
                        <Label className="text-base font-medium">Configure Dates ({selectedDates.length})</Label>
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
                                  
                                  {/* Availability indicator */}
                                  {(() => {
                                    const availability = getSpaceAvailability(
                                      slot.spaceId || '',
                                      slot.date,
                                      slot.startTime,
                                      slot.endTime
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
                                      const statusConfig = getStatusConfig(conflict?.status || 'inquiry');
                                      return (
                                        <div className="text-right">
                                          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-xs font-medium mb-1">
                                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                            Conflict
                                          </div>
                                          <div className="text-xs text-red-600">
                                            {conflict?.eventName}<br/>
                                            {conflict?.startTime} - {conflict?.endTime}<br/>
                                            <span className="inline-flex items-center gap-1 mt-1">
                                              <div 
                                                className="w-2 h-2 rounded-full" 
                                                style={{ backgroundColor: statusConfig.color }}
                                              />
                                              {statusConfig.label}
                                            </span>
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
                                    value={slot.spaceId || ""}
                                    onValueChange={(value) => updateDateSlot(index, 'spaceId', value)}
                                  >
                                    <SelectTrigger className={cn(
                                      "w-full h-10 transition-colors",
                                      !slot.spaceId 
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
                                        value={slot.startTime}
                                        onValueChange={(value) => updateDateSlot(index, 'startTime', value)}
                                      >
                                        <SelectTrigger className={cn(
                                          "flex-1 h-9 text-sm transition-colors",
                                          !slot.startTime 
                                            ? "border-red-200 bg-red-50/30" 
                                            : "border-slate-200 hover:border-slate-300"
                                        )}>
                                          <SelectValue placeholder="Start time" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {timeSlots.map((time) => (
                                            <SelectItem key={time.value} value={time.value}>
                                              {time.display}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      
                                      <span className="text-slate-400 font-medium px-1">→</span>
                                      
                                      <Select
                                        value={slot.endTime}
                                        onValueChange={(value) => updateDateSlot(index, 'endTime', value)}
                                      >
                                        <SelectTrigger className={cn(
                                          "flex-1 h-9 text-sm transition-colors",
                                          !slot.endTime 
                                            ? "border-red-200 bg-red-50/30" 
                                            : "border-slate-200 hover:border-slate-300"
                                        )}>
                                          <SelectValue placeholder="End time" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {timeSlots.map((time) => (
                                            <SelectItem key={time.value} value={time.value}>
                                              {time.display}
                                            </SelectItem>
                                          ))}
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
                                          value={slot.guestCount || 1}
                                          onChange={(e) => {
                                            const value = Math.max(1, Math.min(999, parseInt(e.target.value) || 1));
                                            updateDateSlot(index, 'guestCount', value);
                                          }}
                                          className="h-9 text-center text-sm font-medium"
                                        />
                                        {(() => {
                                          const selectedSpace = selectedVenueData?.spaces?.find((space: any) => space.id === slot.spaceId);
                                          const guestCount = slot.guestCount || 1;
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
                                        value={slot.setupStyle || ''}
                                        onValueChange={(value) => updateDateSlot(index, 'setupStyle', value)}
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
                                        {formatTimeForDisplay(activeDate.startTime)} - {formatTimeForDisplay(activeDate.endTime)}
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

                                            {/* Package Taxes & Fees */}
                                            {isSelected && (
                                              <div className="mt-2 pt-2 border-t border-slate-200 space-y-2">
                                                {/* Additional taxes for package */}
                                                {taxSettings.filter((item: any) => item.type === 'tax' && item.isActive).length > 0 && (
                                                  <div>
                                                    <div className="text-xs text-slate-600 mb-1">Additional Taxes:</div>
                                                    <div className="flex flex-wrap gap-1">
                                                      {taxSettings
                                                        .filter((item: any) => item.type === 'tax' && item.isActive)
                                                        .map((tax: any) => {
                                                          const isInherited = (pkg.enabledTaxIds || []).includes(tax.id);
                                                          const isOverridden = (activeDate.serviceTaxOverrides?.[pkg.id]?.enabledTaxIds || []).includes(tax.id);
                                                          const isDisabled = (activeDate.serviceTaxOverrides?.[pkg.id]?.disabledInheritedTaxIds || []).includes(tax.id);
                                                          const isActive = (isInherited && !isDisabled) || isOverridden;
                                                          
                                                          return (
                                                            <label key={tax.id} className="flex items-center gap-1 text-xs cursor-pointer">
                                                              <Checkbox
                                                                checked={isActive}
                                                                onCheckedChange={(checked) => {
                                                                  const currentOverrides = activeDate.serviceTaxOverrides?.[pkg.id] || { enabledTaxIds: [], enabledFeeIds: [], disabledInheritedTaxIds: [], disabledInheritedFeeIds: [] };
                                                                  
                                                                  if (isInherited) {
                                                                    // Toggle inherited tax on/off
                                                                    const newDisabledTaxIds = checked
                                                                      ? currentOverrides.disabledInheritedTaxIds?.filter(id => id !== tax.id) || []
                                                                      : [...(currentOverrides.disabledInheritedTaxIds || []), tax.id];
                                                                    
                                                                    updateDateConfig('serviceTaxOverrides', {
                                                                      ...activeDate.serviceTaxOverrides,
                                                                      [pkg.id]: {
                                                                        ...currentOverrides,
                                                                        disabledInheritedTaxIds: newDisabledTaxIds
                                                                      }
                                                                    });
                                                                  } else {
                                                                    // Toggle additional tax on/off
                                                                    const newTaxIds = checked
                                                                      ? [...(currentOverrides.enabledTaxIds || []), tax.id]
                                                                      : currentOverrides.enabledTaxIds?.filter(id => id !== tax.id) || [];
                                                                    
                                                                    updateDateConfig('serviceTaxOverrides', {
                                                                      ...activeDate.serviceTaxOverrides,
                                                                      [pkg.id]: {
                                                                        ...currentOverrides,
                                                                        enabledTaxIds: newTaxIds
                                                                      }
                                                                    });
                                                                  }
                                                                }}
                                                                className="w-3 h-3"
                                                              />
                                                              <span className={isInherited ? "text-blue-600" : "text-slate-700"}>
                                                                {tax.name} ({tax.value}%)
                                                              </span>
                                                            </label>
                                                          );
                                                        })}
                                                    </div>
                                                  </div>
                                                )}

                                                {/* Additional fees for package */}
                                                {taxSettings.filter((item: any) => (item.type === 'fee' || item.type === 'service_charge') && item.isActive).length > 0 && (
                                                  <div>
                                                    <div className="text-xs text-slate-600 mb-1">Additional Fees:</div>
                                                    <div className="flex flex-wrap gap-1">
                                                      {taxSettings
                                                        .filter((item: any) => (item.type === 'fee' || item.type === 'service_charge') && item.isActive)
                                                        .map((fee: any) => {
                                                          const isInherited = (pkg.enabledFeeIds || []).includes(fee.id);
                                                          const isOverridden = (activeDate.serviceTaxOverrides?.[pkg.id]?.enabledFeeIds || []).includes(fee.id);
                                                          const isDisabled = (activeDate.serviceTaxOverrides?.[pkg.id]?.disabledInheritedFeeIds || []).includes(fee.id);
                                                          const isActive = (isInherited && !isDisabled) || isOverridden;
                                                          
                                                          return (
                                                            <label key={fee.id} className="flex items-center gap-1 text-xs cursor-pointer">
                                                              <Checkbox
                                                                checked={isActive}
                                                                onCheckedChange={(checked) => {
                                                                  const currentOverrides = activeDate.serviceTaxOverrides?.[pkg.id] || { enabledTaxIds: [], enabledFeeIds: [], disabledInheritedTaxIds: [], disabledInheritedFeeIds: [] };
                                                                  
                                                                  if (isInherited) {
                                                                    // Toggle inherited fee on/off
                                                                    const newDisabledFeeIds = checked
                                                                      ? currentOverrides.disabledInheritedFeeIds?.filter(id => id !== fee.id) || []
                                                                      : [...(currentOverrides.disabledInheritedFeeIds || []), fee.id];
                                                                    
                                                                    updateDateConfig('serviceTaxOverrides', {
                                                                      ...activeDate.serviceTaxOverrides,
                                                                      [pkg.id]: {
                                                                        ...currentOverrides,
                                                                        disabledInheritedFeeIds: newDisabledFeeIds
                                                                      }
                                                                    });
                                                                  } else {
                                                                    // Toggle additional fee on/off
                                                                    const newFeeIds = checked
                                                                      ? [...(currentOverrides.enabledFeeIds || []), fee.id]
                                                                      : currentOverrides.enabledFeeIds?.filter(id => id !== fee.id) || [];
                                                                    
                                                                    updateDateConfig('serviceTaxOverrides', {
                                                                      ...activeDate.serviceTaxOverrides,
                                                                      [pkg.id]: {
                                                                        ...currentOverrides,
                                                                        enabledFeeIds: newFeeIds
                                                                      }
                                                                    });
                                                                  }
                                                                }}
                                                                className="w-3 h-3"
                                                              />
                                                              <span className={isInherited ? "text-blue-600" : "text-slate-700"}>
                                                                {fee.name} ({fee.calculation === 'percentage' ? `${fee.value}%` : `$${fee.value}`})
                                                              </span>
                                                            </label>
                                                          );
                                                        })}
                                                    </div>
                                                  </div>
                                                )}
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
                                              <div className="flex items-center gap-2 mt-2">
                                                <span className="text-sm font-medium text-green-600">
                                                  ${displayPrice}
                                                </span>
                                                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                                  {service.pricingModel === 'per_person' ? 'Per Person' : 'Fixed Price'}
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                          
                                          {isSelected && (
                                            <div className="mt-3 pt-3 border-t border-slate-200 space-y-3">
                                              <div className="flex items-center gap-4">
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

                                              {/* Service Taxes & Fees */}
                                              <div className="space-y-2">
                                                {/* Additional taxes for service */}
                                                {taxSettings.filter((item: any) => item.type === 'tax' && item.isActive).length > 0 && (
                                                  <div>
                                                    <div className="text-xs text-slate-600 mb-1">Additional Taxes:</div>
                                                    <div className="flex flex-wrap gap-1">
                                                      {taxSettings
                                                        .filter((item: any) => item.type === 'tax' && item.isActive)
                                                        .map((tax: any) => {
                                                          const isInherited = (service.enabledTaxIds || []).includes(tax.id);
                                                          const isOverridden = (activeDate.serviceTaxOverrides?.[service.id]?.enabledTaxIds || []).includes(tax.id);
                                                          const isDisabled = (activeDate.serviceTaxOverrides?.[service.id]?.disabledInheritedTaxIds || []).includes(tax.id);
                                                          const isActive = (isInherited && !isDisabled) || isOverridden;
                                                          
                                                          return (
                                                            <label key={tax.id} className="flex items-center gap-1 text-xs cursor-pointer">
                                                              <Checkbox
                                                                checked={isActive}
                                                                onCheckedChange={(checked) => {
                                                                  const currentOverrides = activeDate.serviceTaxOverrides?.[service.id] || { enabledTaxIds: [], enabledFeeIds: [], disabledInheritedTaxIds: [], disabledInheritedFeeIds: [] };
                                                                  
                                                                  if (isInherited) {
                                                                    // Toggle inherited tax on/off
                                                                    const newDisabledTaxIds = checked
                                                                      ? currentOverrides.disabledInheritedTaxIds?.filter(id => id !== tax.id) || []
                                                                      : [...(currentOverrides.disabledInheritedTaxIds || []), tax.id];
                                                                    
                                                                    updateDateConfig('serviceTaxOverrides', {
                                                                      ...activeDate.serviceTaxOverrides,
                                                                      [service.id]: {
                                                                        ...currentOverrides,
                                                                        disabledInheritedTaxIds: newDisabledTaxIds
                                                                      }
                                                                    });
                                                                  } else {
                                                                    // Toggle additional tax on/off
                                                                    const newTaxIds = checked
                                                                      ? [...(currentOverrides.enabledTaxIds || []), tax.id]
                                                                      : currentOverrides.enabledTaxIds?.filter(id => id !== tax.id) || [];
                                                                    
                                                                    updateDateConfig('serviceTaxOverrides', {
                                                                      ...activeDate.serviceTaxOverrides,
                                                                      [service.id]: {
                                                                        ...currentOverrides,
                                                                        enabledTaxIds: newTaxIds
                                                                      }
                                                                    });
                                                                  }
                                                                }}
                                                                className="w-3 h-3"
                                                              />
                                                              <span className={isInherited ? "text-blue-600" : "text-slate-700"}>
                                                                {tax.name} ({tax.value}%)
                                                              </span>
                                                            </label>
                                                          );
                                                        })}
                                                    </div>
                                                  </div>
                                                )}

                                                {/* Additional fees for service */}
                                                {taxSettings.filter((item: any) => (item.type === 'fee' || item.type === 'service_charge') && item.isActive).length > 0 && (
                                                  <div>
                                                    <div className="text-xs text-slate-600 mb-1">Additional Fees:</div>
                                                    <div className="flex flex-wrap gap-1">
                                                      {taxSettings
                                                        .filter((item: any) => (item.type === 'fee' || item.type === 'service_charge') && item.isActive)
                                                        .map((fee: any) => {
                                                          const isInherited = (service.enabledFeeIds || []).includes(fee.id);
                                                          const isOverridden = (activeDate.serviceTaxOverrides?.[service.id]?.enabledFeeIds || []).includes(fee.id);
                                                          const isDisabled = (activeDate.serviceTaxOverrides?.[service.id]?.disabledInheritedFeeIds || []).includes(fee.id);
                                                          const isActive = (isInherited && !isDisabled) || isOverridden;
                                                          
                                                          return (
                                                            <label key={fee.id} className="flex items-center gap-1 text-xs cursor-pointer">
                                                              <Checkbox
                                                                checked={isActive}
                                                                onCheckedChange={(checked) => {
                                                                  const currentOverrides = activeDate.serviceTaxOverrides?.[service.id] || { enabledTaxIds: [], enabledFeeIds: [], disabledInheritedTaxIds: [], disabledInheritedFeeIds: [] };
                                                                  
                                                                  if (isInherited) {
                                                                    // Toggle inherited fee on/off
                                                                    const newDisabledFeeIds = checked
                                                                      ? currentOverrides.disabledInheritedFeeIds?.filter(id => id !== fee.id) || []
                                                                      : [...(currentOverrides.disabledInheritedFeeIds || []), fee.id];
                                                                    
                                                                    updateDateConfig('serviceTaxOverrides', {
                                                                      ...activeDate.serviceTaxOverrides,
                                                                      [service.id]: {
                                                                        ...currentOverrides,
                                                                        disabledInheritedFeeIds: newDisabledFeeIds
                                                                      }
                                                                    });
                                                                  } else {
                                                                    // Toggle additional fee on/off
                                                                    const newFeeIds = checked
                                                                      ? [...(currentOverrides.enabledFeeIds || []), fee.id]
                                                                      : currentOverrides.enabledFeeIds?.filter(id => id !== fee.id) || [];
                                                                    
                                                                    updateDateConfig('serviceTaxOverrides', {
                                                                      ...activeDate.serviceTaxOverrides,
                                                                      [service.id]: {
                                                                        ...currentOverrides,
                                                                        enabledFeeIds: newFeeIds
                                                                      }
                                                                    });
                                                                  }
                                                                }}
                                                                className="w-3 h-3"
                                                              />
                                                              <span className={isInherited ? "text-blue-600" : "text-slate-700"}>
                                                                {fee.name} ({fee.calculation === 'percentage' ? `${fee.value}%` : `$${fee.value}`})
                                                              </span>
                                                            </label>
                                                          );
                                                        })}
                                                    </div>
                                                  </div>
                                                )}
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

                            {/* Apply Settings for Multi-Date Events */}
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

                            {/* Price Summary */}
                            <Card className="p-4">
                              <div className="space-y-4">

                                {/* Comprehensive Price Breakdown */}
                                <div>
                                  <h5 className="font-medium mb-3">Price Breakdown</h5>
                                  {(() => {
                                    // Calculate comprehensive breakdown with taxes and fees using per-service logic
                                    let subtotal = 0;
                                    const feeBreakdown: Array<{name: string, amount: number, description: string}> = [];
                                    const taxBreakdown: Array<{name: string, amount: number, description: string}> = [];
                                    
                                    // Package calculation
                                    if (selectedPackageData && activeDate.packageId) {
                                      const packagePrice = activeDate.pricingOverrides?.packagePrice ?? parseFloat(selectedPackageData.price || 0);
                                      let packageSubtotal = 0;
                                      
                                      if (selectedPackageData.pricingModel === 'per_person') {
                                        packageSubtotal = packagePrice * (activeDate.guestCount || 1);
                                      } else {
                                        packageSubtotal = packagePrice;
                                      }
                                      
                                      subtotal += packageSubtotal;
                                      
                                      // Get effective fee and tax IDs for package (using serviceTaxOverrides logic)
                                      const currentOverrides = activeDate.serviceTaxOverrides?.[selectedPackageData.id] || { enabledTaxIds: [], enabledFeeIds: [], disabledInheritedTaxIds: [], disabledInheritedFeeIds: [] };
                                      
                                      // Calculate effective fee IDs (inherited + additional - disabled)
                                      const inheritedFeeIds = selectedPackageData.enabledFeeIds || [];
                                      const additionalFeeIds = currentOverrides.enabledFeeIds || [];
                                      const disabledFeeIds = currentOverrides.disabledInheritedFeeIds || [];
                                      const effectiveFeeIds = [...inheritedFeeIds.filter((id: string) => !disabledFeeIds.includes(id)), ...additionalFeeIds];
                                      
                                      // Calculate effective tax IDs (inherited + additional - disabled)
                                      const inheritedTaxIds = selectedPackageData.enabledTaxIds || [];
                                      const additionalTaxIds = currentOverrides.enabledTaxIds || [];
                                      const disabledTaxIds = currentOverrides.disabledInheritedTaxIds || [];
                                      const effectiveTaxIds = [...inheritedTaxIds.filter((id: string) => !disabledTaxIds.includes(id)), ...additionalTaxIds];
                                      
                                      // Apply package fees
                                      effectiveFeeIds.forEach((feeId: string) => {
                                        const fee = (taxSettings as any[])?.find(f => f.id === feeId);
                                        if (fee && fee.isActive) {
                                          let feeAmount = 0;
                                          if (fee.calculation === 'percentage') {
                                            feeAmount = packageSubtotal * (parseFloat(fee.value) / 100);
                                          } else {
                                            feeAmount = parseFloat(fee.value);
                                          }
                                          
                                          feeBreakdown.push({
                                            name: `${fee.name} (Package)`,
                                            amount: feeAmount,
                                            description: fee.calculation === 'percentage' 
                                              ? `${fee.value}% of package ($${packageSubtotal.toFixed(2)})`
                                              : 'Fixed amount'
                                          });
                                        }
                                      });
                                      
                                      // Store package tax IDs for later calculation
                                      effectiveTaxIds.forEach((taxId: string) => {
                                        const tax = (taxSettings as any[])?.find(t => t.id === taxId);
                                        if (tax && tax.isActive) {
                                          // Will be calculated after all fees are computed
                                        }
                                      });
                                    }
                                    
                                    // Services calculation
                                    activeDate.selectedServices?.forEach(serviceId => {
                                      const service = (services as any[]).find((s: any) => s.id === serviceId);
                                      if (service) {
                                        const servicePrice = activeDate.pricingOverrides?.servicePrices?.[serviceId] ?? parseFloat(service.price || 0);
                                        let serviceSubtotal = 0;
                                        
                                        if (service.pricingModel === 'per_person') {
                                          serviceSubtotal = servicePrice * (activeDate.guestCount || 1);
                                        } else {
                                          const quantity = activeDate.itemQuantities?.[serviceId] || 1;
                                          serviceSubtotal = servicePrice * quantity;
                                        }
                                        
                                        subtotal += serviceSubtotal;
                                        
                                        // Get effective fee and tax IDs for service (using serviceTaxOverrides logic)
                                        const currentOverrides = activeDate.serviceTaxOverrides?.[serviceId] || { enabledTaxIds: [], enabledFeeIds: [], disabledInheritedTaxIds: [], disabledInheritedFeeIds: [] };
                                        
                                        // Calculate effective fee IDs (inherited + additional - disabled)
                                        const inheritedFeeIds = service.enabledFeeIds || [];
                                        const additionalFeeIds = currentOverrides.enabledFeeIds || [];
                                        const disabledFeeIds = currentOverrides.disabledInheritedFeeIds || [];
                                        const effectiveFeeIds = [...inheritedFeeIds.filter((id: string) => !disabledFeeIds.includes(id)), ...additionalFeeIds];
                                        
                                        // Apply service fees
                                        effectiveFeeIds.forEach((feeId: string) => {
                                          const fee = (taxSettings as any[])?.find(f => f.id === feeId);
                                          if (fee && fee.isActive) {
                                            let feeAmount = 0;
                                            if (fee.calculation === 'percentage') {
                                              feeAmount = serviceSubtotal * (parseFloat(fee.value) / 100);
                                            } else {
                                              feeAmount = parseFloat(fee.value);
                                            }
                                            
                                            feeBreakdown.push({
                                              name: `${fee.name} (${service.name})`,
                                              amount: feeAmount,
                                              description: fee.calculation === 'percentage' 
                                                ? `${fee.value}% of service ($${serviceSubtotal.toFixed(2)})`
                                                : 'Fixed amount'
                                            });
                                          }
                                        });
                                      }
                                    });

                                    // Calculate total fees
                                    const feesTotal = feeBreakdown.reduce((sum, fee) => sum + fee.amount, 0);

                                    // Calculate taxes on subtotal + taxable fees
                                    const taxableFees = feeBreakdown
                                      .filter(fee => {
                                        // Extract fee name without service/package prefix
                                        const baseName = fee.name.replace(/ \(.+\)$/, '');
                                        const feeData = (taxSettings as any[])?.find(f => f.name === baseName);
                                        return feeData?.isTaxable;
                                      })
                                      .reduce((sum, fee) => sum + fee.amount, 0);

                                    const taxableBase = subtotal + taxableFees;
                                    
                                    // Apply taxes from package
                                    if (selectedPackageData && activeDate.packageId) {
                                      const currentOverrides = activeDate.serviceTaxOverrides?.[selectedPackageData.id] || { enabledTaxIds: [], enabledFeeIds: [], disabledInheritedTaxIds: [], disabledInheritedFeeIds: [] };
                                      const inheritedTaxIds = selectedPackageData.enabledTaxIds || [];
                                      const additionalTaxIds = currentOverrides.enabledTaxIds || [];
                                      const disabledTaxIds = currentOverrides.disabledInheritedTaxIds || [];
                                      const effectiveTaxIds = [...inheritedTaxIds.filter((id: string) => !disabledTaxIds.includes(id)), ...additionalTaxIds];
                                      
                                      effectiveTaxIds.forEach((taxId: string) => {
                                        const tax = (taxSettings as any[])?.find(t => t.id === taxId);
                                        if (tax && tax.isActive) {
                                          const taxAmount = taxableBase * (parseFloat(tax.value) / 100);
                                          taxBreakdown.push({
                                            name: `${tax.name} (Package)`,
                                            amount: taxAmount,
                                            description: `${tax.value}% of taxable amount ($${taxableBase.toFixed(2)})`
                                          });
                                        }
                                      });
                                    }
                                    
                                    // Apply taxes from services
                                    activeDate.selectedServices?.forEach(serviceId => {
                                      const service = (services as any[]).find((s: any) => s.id === serviceId);
                                      if (service) {
                                        const currentOverrides = activeDate.serviceTaxOverrides?.[serviceId] || { enabledTaxIds: [], enabledFeeIds: [], disabledInheritedTaxIds: [], disabledInheritedFeeIds: [] };
                                        const inheritedTaxIds = service.enabledTaxIds || [];
                                        const additionalTaxIds = currentOverrides.enabledTaxIds || [];
                                        const disabledTaxIds = currentOverrides.disabledInheritedTaxIds || [];
                                        const effectiveTaxIds = [...inheritedTaxIds.filter((id: string) => !disabledTaxIds.includes(id)), ...additionalTaxIds];
                                        
                                        effectiveTaxIds.forEach((taxId: string) => {
                                          const tax = (taxSettings as any[])?.find(t => t.id === taxId);
                                          if (tax && tax.isActive) {
                                            // Avoid duplicate taxes
                                            const existingTax = taxBreakdown.find(t => t.name.startsWith(tax.name));
                                            if (!existingTax) {
                                              const taxAmount = taxableBase * (parseFloat(tax.value) / 100);
                                              taxBreakdown.push({
                                                name: `${tax.name} (${service.name})`,
                                                amount: taxAmount,
                                                description: `${tax.value}% of taxable amount ($${taxableBase.toFixed(2)})`
                                              });
                                            }
                                          }
                                        });
                                      }
                                    });

                                    // Note: Global taxes/fees are no longer supported in the edit modal
                                    // since taxes and fees are now applied per-service/package inline

                                    const taxesTotal = taxBreakdown.reduce((sum, tax) => sum + tax.amount, 0);
                                    const grandTotal = subtotal + feesTotal + taxesTotal;

                                    return (
                                      <div className="space-y-3">
                                        {/* Items breakdown */}
                                        <div className="space-y-2 text-sm">
                                          {selectedPackageData && activeDate.packageId && (
                                            <div className="flex justify-between">
                                              <span>{selectedPackageData.name}</span>
                                              <span>
                                                ${selectedPackageData.pricingModel === 'per_person' 
                                                  ? ((activeDate.pricingOverrides?.packagePrice ?? parseFloat(selectedPackageData.price)) * (activeDate.guestCount || 1)).toFixed(2)
                                                  : (activeDate.pricingOverrides?.packagePrice ?? parseFloat(selectedPackageData.price)).toFixed(2)}
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
                                        </div>

                                        {/* Subtotal */}
                                        <div className="border-t border-slate-200 pt-2">
                                          <div className="flex justify-between text-sm font-medium">
                                            <span>Subtotal:</span>
                                            <span>${subtotal.toFixed(2)}</span>
                                          </div>
                                        </div>
                                        
                                        {/* Fees breakdown */}
                                        {feeBreakdown.map((fee, idx) => (
                                          <div key={`fee-${idx}`} className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                              <span className="text-blue-600">{fee.name}:</span>
                                              <span className="text-blue-600">${fee.amount.toFixed(2)}</span>
                                            </div>
                                            <div className="text-xs text-slate-500 ml-2">{fee.description}</div>
                                          </div>
                                        ))}
                                        
                                        {/* Tax breakdown */}
                                        {taxBreakdown.map((tax, idx) => (
                                          <div key={`tax-${idx}`} className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                              <span className="text-purple-600">{tax.name}:</span>
                                              <span className="text-purple-600">${tax.amount.toFixed(2)}</span>
                                            </div>
                                            <div className="text-xs text-slate-500 ml-2">{tax.description}</div>
                                          </div>
                                        ))}
                                        
                                        {/* Grand total */}
                                        <div className="border-t-2 border-slate-300 pt-2">
                                          <div className="flex justify-between font-semibold text-base">
                                            <span>Date Total:</span>
                                            <span className="text-green-600">${grandTotal.toFixed(2)}</span>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })()}
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

                      {/* Pricing Breakdown */}
                      <div className="border-t pt-3">
                        {(() => {
                          let subtotal = 0;
                          let totalFees = 0;
                          let totalTaxes = 0;
                          const appliedFees: any[] = [];
                          const appliedTaxes: any[] = [];

                          // Calculate total across all dates using the new per-service tax override logic
                          selectedDates.forEach(date => {
                            // Package price
                            if (date.packageId) {
                              const pkg = (packages as any[])?.find((p: any) => p.id === date.packageId);
                              if (pkg) {
                                const packagePrice = date.pricingOverrides?.packagePrice ?? parseFloat(pkg.price || 0);
                                let packageSubtotal = 0;
                                if (pkg.pricingModel === 'per_person') {
                                  packageSubtotal = packagePrice * (date.guestCount || 1);
                                } else {
                                  packageSubtotal = packagePrice;
                                }
                                subtotal += packageSubtotal;

                                // Calculate package fees and taxes using serviceTaxOverrides
                                const currentOverrides = date.serviceTaxOverrides?.[pkg.id] || { enabledTaxIds: [], enabledFeeIds: [], disabledInheritedTaxIds: [], disabledInheritedFeeIds: [] };
                                
                                // Calculate effective fee IDs (inherited + additional - disabled)
                                const inheritedFeeIds = pkg.enabledFeeIds || [];
                                const additionalFeeIds = currentOverrides.enabledFeeIds || [];
                                const disabledFeeIds = currentOverrides.disabledInheritedFeeIds || [];
                                const effectiveFeeIds = [...inheritedFeeIds.filter((id: string) => !disabledFeeIds.includes(id)), ...additionalFeeIds];
                                
                                // Apply package fees
                                effectiveFeeIds.forEach((feeId: string) => {
                                  const fee = (taxSettings as any[])?.find(f => f.id === feeId);
                                  if (fee && fee.isActive) {
                                    let feeAmount = 0;
                                    if (fee.calculation === 'percentage') {
                                      feeAmount = packageSubtotal * (parseFloat(fee.value) / 100);
                                    } else {
                                      feeAmount = parseFloat(fee.value);
                                    }
                                    totalFees += feeAmount;
                                    appliedFees.push({ name: fee.name, amount: feeAmount });
                                  }
                                });

                                // Calculate effective tax IDs (inherited + additional - disabled)
                                const inheritedTaxIds = pkg.enabledTaxIds || [];
                                const additionalTaxIds = currentOverrides.enabledTaxIds || [];
                                const disabledTaxIds = currentOverrides.disabledInheritedTaxIds || [];
                                const effectiveTaxIds = [...inheritedTaxIds.filter((id: string) => !disabledTaxIds.includes(id)), ...additionalTaxIds];
                                
                                // Apply package taxes
                                effectiveTaxIds.forEach((taxId: string) => {
                                  const tax = (taxSettings as any[])?.find(t => t.id === taxId);
                                  if (tax && tax.isActive) {
                                    const taxAmount = packageSubtotal * (parseFloat(tax.value) / 100);
                                    totalTaxes += taxAmount;
                                    appliedTaxes.push({ name: tax.name, amount: taxAmount });
                                  }
                                });
                              }
                            }
                            
                            // Services price
                            date.selectedServices?.forEach(serviceId => {
                              const service = (services as any[]).find((s: any) => s.id === serviceId);
                              if (service) {
                                const servicePrice = date.pricingOverrides?.servicePrices?.[serviceId] ?? parseFloat(service.price || 0);
                                let serviceSubtotal = 0;
                                if (service.pricingModel === 'per_person') {
                                  serviceSubtotal = servicePrice * (date.guestCount || 1);
                                } else {
                                  const quantity = date.itemQuantities?.[serviceId] || 1;
                                  serviceSubtotal = servicePrice * quantity;
                                }
                                subtotal += serviceSubtotal;

                                // Calculate service fees and taxes using serviceTaxOverrides
                                const currentOverrides = date.serviceTaxOverrides?.[serviceId] || { enabledTaxIds: [], enabledFeeIds: [], disabledInheritedTaxIds: [], disabledInheritedFeeIds: [] };
                                
                                // Calculate effective fee IDs (inherited + additional - disabled)
                                const inheritedFeeIds = service.enabledFeeIds || [];
                                const additionalFeeIds = currentOverrides.enabledFeeIds || [];
                                const disabledFeeIds = currentOverrides.disabledInheritedFeeIds || [];
                                const effectiveFeeIds = [...inheritedFeeIds.filter((id: string) => !disabledFeeIds.includes(id)), ...additionalFeeIds];
                                
                                // Apply service fees
                                effectiveFeeIds.forEach((feeId: string) => {
                                  const fee = (taxSettings as any[])?.find(f => f.id === feeId);
                                  if (fee && fee.isActive) {
                                    let feeAmount = 0;
                                    if (fee.calculation === 'percentage') {
                                      feeAmount = serviceSubtotal * (parseFloat(fee.value) / 100);
                                    } else {
                                      feeAmount = parseFloat(fee.value);
                                    }
                                    totalFees += feeAmount;
                                    appliedFees.push({ name: fee.name, amount: feeAmount });
                                  }
                                });

                                // Calculate effective tax IDs (inherited + additional - disabled)
                                const inheritedTaxIds = service.enabledTaxIds || [];
                                const additionalTaxIds = currentOverrides.enabledTaxIds || [];
                                const disabledTaxIds = currentOverrides.disabledInheritedTaxIds || [];
                                const effectiveTaxIds = [...inheritedTaxIds.filter((id: string) => !disabledTaxIds.includes(id)), ...additionalTaxIds];
                                
                                // Apply service taxes
                                effectiveTaxIds.forEach((taxId: string) => {
                                  const tax = (taxSettings as any[])?.find(t => t.id === taxId);
                                  if (tax && tax.isActive) {
                                    const taxAmount = serviceSubtotal * (parseFloat(tax.value) / 100);
                                    totalTaxes += taxAmount;
                                    appliedTaxes.push({ name: tax.name, amount: taxAmount });
                                  }
                                });
                              }
                            });
                          });

                          const grandTotal = subtotal + totalFees + totalTaxes;
                          const hasFeesOrTaxes = appliedFees.length > 0 || appliedTaxes.length > 0;

                          return (
                            <>
                              {hasFeesOrTaxes ? (
                                <>
                                  {/* Subtotal */}
                                  <div className="flex justify-between text-sm">
                                    <span>Subtotal:</span>
                                    <span>${subtotal.toFixed(2)}</span>
                                  </div>
                                  
                                  {/* Individual Fees */}
                                  {appliedFees.map((fee, index) => (
                                    <div key={`fee-${index}`} className="flex justify-between text-sm text-blue-600">
                                      <span className="pl-2">+ {fee.name}:</span>
                                      <span>+${fee.amount.toFixed(2)}</span>
                                    </div>
                                  ))}
                                  
                                  {/* Individual Taxes */}
                                  {appliedTaxes.map((tax, index) => (
                                    <div key={`tax-${index}`} className="flex justify-between text-sm text-purple-600">
                                      <span className="pl-2">+ {tax.name}:</span>
                                      <span>+${tax.amount.toFixed(2)}</span>
                                    </div>
                                  ))}
                                  
                                  <div className="border-t pt-2 mt-2">
                                    <div className="flex justify-between font-semibold text-lg">
                                      <span>Grand Total:</span>
                                      <span className="text-blue-700">${grandTotal.toFixed(2)}</span>
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <div className="flex justify-between font-semibold text-lg">
                                  <span>Total Price:</span>
                                  <span className="text-green-600">${grandTotal.toFixed(2)}</span>
                                </div>
                              )}
                            </>
                          );
                        })()}
                        
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
                {/* Enhanced pricing display with per-service tax/fee breakdown */}
                {(() => {
                  let subtotal = 0;
                  let totalFees = 0;
                  let totalTaxes = 0;

                  // Calculate total across all dates using the new per-service tax override logic
                  selectedDates.forEach(date => {
                    // Package price
                    if (date.packageId) {
                      const pkg = (packages as any[])?.find((p: any) => p.id === date.packageId);
                      if (pkg) {
                        const packagePrice = date.pricingOverrides?.packagePrice ?? parseFloat(pkg.price || 0);
                        let packageSubtotal = 0;
                        if (pkg.pricingModel === 'per_person') {
                          packageSubtotal = packagePrice * (date.guestCount || 1);
                        } else {
                          packageSubtotal = packagePrice;
                        }
                        subtotal += packageSubtotal;

                        // Calculate package fees and taxes using serviceTaxOverrides
                        const currentOverrides = date.serviceTaxOverrides?.[pkg.id] || { enabledTaxIds: [], enabledFeeIds: [], disabledInheritedTaxIds: [], disabledInheritedFeeIds: [] };
                        
                        // Calculate effective fee IDs (inherited + additional - disabled)
                        const inheritedFeeIds = pkg.enabledFeeIds || [];
                        const additionalFeeIds = currentOverrides.enabledFeeIds || [];
                        const disabledFeeIds = currentOverrides.disabledInheritedFeeIds || [];
                        const effectiveFeeIds = [...inheritedFeeIds.filter((id: string) => !disabledFeeIds.includes(id)), ...additionalFeeIds];
                        
                        // Apply package fees
                        effectiveFeeIds.forEach((feeId: string) => {
                          const fee = (taxSettings as any[])?.find(f => f.id === feeId);
                          if (fee && fee.isActive) {
                            let feeAmount = 0;
                            if (fee.calculation === 'percentage') {
                              feeAmount = packageSubtotal * (parseFloat(fee.value) / 100);
                            } else {
                              feeAmount = parseFloat(fee.value);
                            }
                            totalFees += feeAmount;
                            
                            // Apply taxes to fees if the fee is taxable
                            if (fee.isTaxable && fee.applicableTaxIds && fee.applicableTaxIds.length > 0) {
                              fee.applicableTaxIds.forEach((taxId: string) => {
                                const tax = (taxSettings as any[])?.find(t => t.id === taxId);
                                if (tax && tax.isActive) {
                                  const taxOnFeeAmount = feeAmount * (parseFloat(tax.value) / 100);
                                  totalTaxes += taxOnFeeAmount;
                                }
                              });
                            }
                          }
                        });

                        // Calculate effective tax IDs (inherited + additional - disabled)
                        const inheritedTaxIds = pkg.enabledTaxIds || [];
                        const additionalTaxIds = currentOverrides.enabledTaxIds || [];
                        const disabledTaxIds = currentOverrides.disabledInheritedTaxIds || [];
                        const effectiveTaxIds = [...inheritedTaxIds.filter((id: string) => !disabledTaxIds.includes(id)), ...additionalTaxIds];
                        
                        // Apply package taxes
                        effectiveTaxIds.forEach((taxId: string) => {
                          const tax = (taxSettings as any[])?.find(t => t.id === taxId);
                          if (tax && tax.isActive) {
                            const taxAmount = packageSubtotal * (parseFloat(tax.value) / 100);
                            totalTaxes += taxAmount;
                          }
                        });
                      }
                    }
                    
                    // Services price
                    date.selectedServices?.forEach(serviceId => {
                      const service = (services as any[]).find((s: any) => s.id === serviceId);
                      if (service) {
                        const servicePrice = date.pricingOverrides?.servicePrices?.[serviceId] ?? parseFloat(service.price || 0);
                        let serviceSubtotal = 0;
                        if (service.pricingModel === 'per_person') {
                          serviceSubtotal = servicePrice * (date.guestCount || 1);
                        } else {
                          const quantity = date.itemQuantities?.[serviceId] || 1;
                          serviceSubtotal = servicePrice * quantity;
                        }
                        subtotal += serviceSubtotal;

                        // Calculate service fees and taxes using serviceTaxOverrides
                        const currentOverrides = date.serviceTaxOverrides?.[serviceId] || { enabledTaxIds: [], enabledFeeIds: [], disabledInheritedTaxIds: [], disabledInheritedFeeIds: [] };
                        
                        // Calculate effective fee IDs (inherited + additional - disabled)
                        const inheritedFeeIds = service.enabledFeeIds || [];
                        const additionalFeeIds = currentOverrides.enabledFeeIds || [];
                        const disabledFeeIds = currentOverrides.disabledInheritedFeeIds || [];
                        const effectiveFeeIds = [...inheritedFeeIds.filter((id: string) => !disabledFeeIds.includes(id)), ...additionalFeeIds];
                        
                        // Apply service fees
                        effectiveFeeIds.forEach((feeId: string) => {
                          const fee = (taxSettings as any[])?.find(f => f.id === feeId);
                          if (fee && fee.isActive) {
                            let feeAmount = 0;
                            if (fee.calculation === 'percentage') {
                              feeAmount = serviceSubtotal * (parseFloat(fee.value) / 100);
                            } else {
                              feeAmount = parseFloat(fee.value);
                            }
                            totalFees += feeAmount;
                            
                            // Apply taxes to fees if the fee is taxable
                            if (fee.isTaxable && fee.applicableTaxIds && fee.applicableTaxIds.length > 0) {
                              fee.applicableTaxIds.forEach((taxId: string) => {
                                const tax = (taxSettings as any[])?.find(t => t.id === taxId);
                                if (tax && tax.isActive) {
                                  const taxOnFeeAmount = feeAmount * (parseFloat(tax.value) / 100);
                                  totalTaxes += taxOnFeeAmount;
                                }
                              });
                            }
                          }
                        });

                        // Calculate effective tax IDs (inherited + additional - disabled)
                        const inheritedTaxIds = service.enabledTaxIds || [];
                        const additionalTaxIds = currentOverrides.enabledTaxIds || [];
                        const disabledTaxIds = currentOverrides.disabledInheritedTaxIds || [];
                        const effectiveTaxIds = [...inheritedTaxIds.filter((id: string) => !disabledTaxIds.includes(id)), ...additionalTaxIds];
                        
                        // Apply service taxes
                        effectiveTaxIds.forEach((taxId: string) => {
                          const tax = (taxSettings as any[])?.find(t => t.id === taxId);
                          if (tax && tax.isActive) {
                            const taxAmount = serviceSubtotal * (parseFloat(tax.value) / 100);
                            totalTaxes += taxAmount;
                          }
                        });
                      }
                    });
                  });

                  const grandTotal = subtotal + totalFees + totalTaxes;
                  const hasFeesOrTaxes = totalFees > 0 || totalTaxes > 0;

                  return (
                    <div className="flex items-center gap-2">
                      {hasFeesOrTaxes ? (
                        <div className="text-right">
                          <div className="text-xs text-slate-500">
                            Subtotal: ${subtotal.toFixed(2)}
                            {totalFees > 0 && ` + Fees: $${totalFees.toFixed(2)}`}
                            {totalTaxes > 0 && ` + Taxes: $${totalTaxes.toFixed(2)}`}
                          </div>
                          <div>
                            <span className="text-sm text-slate-600">Grand Total</span>
                            <span className="text-lg font-semibold ml-2 text-blue-700">${grandTotal.toFixed(2)}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-600">Total</span>
                          <span className="text-lg font-semibold text-green-600">${grandTotal.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  );
                })()}
                
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
                    className={`${hasBlockingConflicts() && currentStep === 1 ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                    disabled={
                      (currentStep === 1 && selectedDates.length === 0) ||
                      (currentStep === 1 && hasBlockingConflicts())
                    }
                  >
                    {currentStep === 1 && hasBlockingConflicts() 
                      ? '❌ Conflicts Detected'
                      : currentStep === 1 
                        ? `Configure ${selectedDates.length} Event Slot(s)` 
                        : 'Next'
                    }
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
    </Dialog>
  );
}