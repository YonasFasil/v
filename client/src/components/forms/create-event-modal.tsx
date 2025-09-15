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
import { useEventTime } from "@/hooks/use-timezone";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useFormattedCurrency } from "@/lib/currency";
import { VoiceBookingPanel } from "../voice/voice-booking-panel";
import { ProposalCreationModal } from "../proposals/proposal-creation-modal";
import { ProposalEmailModal } from "../proposals/proposal-email-modal";
import { StatusSelector } from "../events/status-selector";
import { type EventStatus, getStatusConfig } from "@shared/status-utils";
import { type TaxSetting } from "@shared/schema";

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
  serviceTaxOverrides?: Record<string, {
    enabledTaxIds: string[];
    enabledFeeIds: string[];
    disabledInheritedTaxIds?: string[];
    disabledInheritedFeeIds?: string[];
  }>;
}

export function CreateEventModal({ open, onOpenChange, duplicateFromBooking }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { formatAmount } = useFormattedCurrency();
  const { formatEventDate, formatEventTime, createEventDateTime, timezoneId } = useEventTime();
  
  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Step 1: Date & Venue Selection
  const [selectedVenue, setSelectedVenue] = useState("");
  const [selectedDates, setSelectedDates] = useState<SelectedDate[]>([]);
  
  // Monitor selectedDates changes for debugging
  useEffect(() => {
    console.log('📊 selectedDates changed:', selectedDates.length, selectedDates.map(d => d.date));
  }, [selectedDates]);
  
  // Step 2: Event Configuration - now managed per date
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  
  // Copy config functionality
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [selectedCopyIndices, setSelectedCopyIndices] = useState<number[]>([]);
  
  // New service creation
  const [showNewServiceForm, setShowNewServiceForm] = useState(false);
  const [showPackageSelection, setShowPackageSelection] = useState(false);
  const [showServiceSelection, setShowServiceSelection] = useState(false);
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
  const [eventStatus, setEventStatus] = useState<"inquiry" | "pending" | "tentative" | "confirmed_deposit_paid" | "confirmed_fully_paid" | "completed" | "cancelled">("inquiry");

  // Voice booking integration
  const [showVoicePanel, setShowVoicePanel] = useState(false);
  const [voiceExtractedData, setVoiceExtractedData] = useState<any>(null);
  
  // Customer creation
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    customerType: "individual" as "individual" | "business",
    companyId: "",
    jobTitle: "",
    department: ""
  });

  // Company search and employee management
  const [companySearch, setCompanySearch] = useState("");
  const [showCompanyEmployees, setShowCompanyEmployees] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [showManageEmployees, setShowManageEmployees] = useState(false);

  // Proposal creation
  const [showCreateProposal, setShowCreateProposal] = useState(false);
  const [showProposalEmail, setShowProposalEmail] = useState(false);
  
  // Summary details modal
  const [showSummaryDetails, setShowSummaryDetails] = useState(false);

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
  const { data: companies = [] } = useQuery({ queryKey: ["/api/companies"] });
  const { data: existingBookings = [], isLoading: bookingsLoading, refetch: refetchBookings } = useQuery({ 
    queryKey: ["/api/bookings"],
    staleTime: 0, // Always fetch fresh data
    refetchOnWindowFocus: true,
    refetchOnMount: true
  });
  const { data: taxSettings = [] } = useQuery<TaxSetting[]>({ queryKey: ["/api/tax-settings"] });

  // Refetch bookings when modal opens to ensure fresh conflict data
  useEffect(() => {
    if (open) {
      console.log('🔄 Modal opened, refetching bookings for fresh conflict detection');
      refetchBookings();
    }
  }, [open, refetchBookings]);

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
    let subtotal = 0;
    const eventDuration = calculateEventDuration(dateConfig.startTime, dateConfig.endTime);
    
    // Get selected package info
    const selectedPackage = dateConfig.packageId 
      ? (packages as any[]).find((p: any) => p.id === dateConfig.packageId)
      : null;
    
    // Package price
    if (selectedPackage) {
      const packagePrice = dateConfig.pricingOverrides?.packagePrice ?? parseFloat(selectedPackage.price || 0);
      if (selectedPackage.pricingModel === 'per_person') {
        subtotal += packagePrice * (dateConfig.guestCount || 1);
      } else if (selectedPackage.pricingModel === 'per_hour') {
        subtotal += packagePrice * eventDuration;
      } else {
        subtotal += packagePrice;
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
          subtotal += servicePrice * (dateConfig.guestCount || 1);
        } else if (service.pricingModel === 'per_hour') {
          subtotal += servicePrice * eventDuration;
        } else {
          const quantity = dateConfig.itemQuantities?.[serviceId] || 1;
          subtotal += servicePrice * quantity;
        }
      }
    });
    
    // Apply taxes and fees per service/package (not accumulated)
    let feesTotal = 0;
    let taxesTotal = 0;
    
    // Calculate package taxes and fees if package is selected
    if (selectedPackage) {
      const packagePrice = dateConfig.pricingOverrides?.packagePrice ?? parseFloat(selectedPackage.price || 0);
      let packageSubtotal = 0;
      
      if (selectedPackage.pricingModel === 'per_person') {
        packageSubtotal = packagePrice * (dateConfig.guestCount || 1);
      } else if (selectedPackage.pricingModel === 'per_hour') {
        packageSubtotal = packagePrice * eventDuration;
      } else {
        packageSubtotal = packagePrice;
      }
      
      // Get package tax/fee overrides
      const packageOverrides = dateConfig.serviceTaxOverrides?.[selectedPackage.id] || { 
        enabledTaxIds: [], enabledFeeIds: [], disabledInheritedTaxIds: [], disabledInheritedFeeIds: [] 
      };
      
      // Calculate effective fee IDs for package (inherited + additional - disabled)
      const inheritedFeeIds = selectedPackage.enabledFeeIds || [];
      const additionalFeeIds = packageOverrides.enabledFeeIds || [];
      const disabledFeeIds = packageOverrides.disabledInheritedFeeIds || [];
      const effectivePackageFeeIds = [...inheritedFeeIds.filter((id: string) => !disabledFeeIds.includes(id)), ...additionalFeeIds];
      
      // Calculate effective tax IDs for package (inherited + additional - disabled)  
      const inheritedTaxIds = selectedPackage.enabledTaxIds || [];
      const additionalTaxIds = packageOverrides.enabledTaxIds || [];
      const disabledTaxIds = packageOverrides.disabledInheritedTaxIds || [];
      const effectivePackageTaxIds = [...inheritedTaxIds.filter((id: string) => !disabledTaxIds.includes(id)), ...additionalTaxIds];
      
      // Apply package fees
      let packageFeeAmount = 0;
      effectivePackageFeeIds.forEach(feeId => {
        const feeSetting = (taxSettings as any[])?.find((s: any) => s.id === feeId && s.isActive);
        if (feeSetting && (feeSetting.type === 'fee' || feeSetting.type === 'service_charge')) {
          let feeAmount = 0;
          if (feeSetting.calculation === 'percentage') {
            feeAmount = (packageSubtotal * parseFloat(feeSetting.value)) / 100;
          } else {
            feeAmount = parseFloat(feeSetting.value);
          }
          feesTotal += feeAmount;
          packageFeeAmount += feeAmount;
        }
      });
      
      // Apply package taxes (to base package amount + fees if fee is taxable)
      effectivePackageTaxIds.forEach(taxId => {
        const taxSetting = (taxSettings as any[])?.find((s: any) => s.id === taxId && s.isActive);
        if (taxSetting) {
          let taxableAmount = packageSubtotal;
          
          // Add fees to taxable amount if any applied fees are taxable
          effectivePackageFeeIds.forEach((feeId: string) => {
            const feeSetting = (taxSettings as any[])?.find((s: any) => s.id === feeId && s.isActive);
            if (feeSetting && feeSetting.isTaxable && (feeSetting.applicableTaxIds || []).includes(taxId)) {
              let feeAmount = 0;
              if (feeSetting.calculation === 'percentage') {
                feeAmount = (packageSubtotal * parseFloat(feeSetting.value)) / 100;
              } else {
                feeAmount = parseFloat(feeSetting.value);
              }
              taxableAmount += feeAmount;
            }
          });
          
          const taxAmount = (taxableAmount * parseFloat(taxSetting.value)) / 100;
          taxesTotal += taxAmount;
        }
      });
    }
    
    // Calculate service taxes and fees for each service individually
    dateConfig.selectedServices?.forEach(serviceId => {
      // Skip if this service is included in the selected package
      if (includedServiceIds.includes(serviceId)) {
        return;
      }
      
      const service = (services as any[]).find((s: any) => s.id === serviceId);
      if (service) {
        let serviceSubtotal = 0;
        const servicePrice = dateConfig.pricingOverrides?.servicePrices?.[serviceId] ?? parseFloat(service.price || 0);
        
        if (service.pricingModel === 'per_person') {
          serviceSubtotal = servicePrice * (dateConfig.guestCount || 1);
        } else if (service.pricingModel === 'per_hour') {
          serviceSubtotal = servicePrice * eventDuration;
        } else {
          const quantity = dateConfig.itemQuantities?.[serviceId] || 1;
          serviceSubtotal = servicePrice * quantity;
        }
        
        // Determine which fees and taxes apply to this service (including overrides)
        const currentOverrides = dateConfig.serviceTaxOverrides?.[serviceId] || { enabledTaxIds: [], enabledFeeIds: [], disabledInheritedTaxIds: [], disabledInheritedFeeIds: [] };
        
        // Calculate effective fee IDs (inherited + additional - disabled)
        const inheritedFeeIds = service.enabledFeeIds || [];
        const additionalFeeIds = currentOverrides.enabledFeeIds || [];
        const disabledFeeIds = currentOverrides.disabledInheritedFeeIds || [];
        const effectiveFeeIds = [...inheritedFeeIds.filter((id: string) => !disabledFeeIds.includes(id)), ...additionalFeeIds];
        
        // Calculate effective tax IDs (inherited + additional - disabled)
        const inheritedTaxIds = service.enabledTaxIds || [];
        const additionalTaxIds = currentOverrides.enabledTaxIds || [];
        const disabledTaxIds = currentOverrides.disabledInheritedTaxIds || [];
        const effectiveTaxIds = [...inheritedTaxIds.filter((id: string) => !disabledTaxIds.includes(id)), ...additionalTaxIds];
        
        // Apply service fees and track them for potential tax application
        let serviceFeeAmount = 0;
        effectiveFeeIds.forEach((feeId: string) => {
          const feeSetting = (taxSettings as any[])?.find((s: any) => s.id === feeId && s.isActive);
          if (feeSetting && (feeSetting.type === 'fee' || feeSetting.type === 'service_charge')) {
            let feeAmount = 0;
            if (feeSetting.calculation === 'percentage') {
              feeAmount = (serviceSubtotal * parseFloat(feeSetting.value)) / 100;
            } else {
              feeAmount = parseFloat(feeSetting.value);
            }
            feesTotal += feeAmount;
            serviceFeeAmount += feeAmount;
          }
        });
        
        // Apply service taxes (to base service amount + fees if fee is taxable)
        effectiveTaxIds.forEach((taxId: string) => {
          const taxSetting = (taxSettings as any[])?.find((s: any) => s.id === taxId && s.isActive);
          if (taxSetting) {
            // Tax on base service amount
            let taxableAmount = serviceSubtotal;
            
            // Add fees to taxable amount if any applied fees are taxable
            effectiveFeeIds.forEach((feeId: string) => {
              const feeSetting = (taxSettings as any[])?.find((s: any) => s.id === feeId && s.isActive);
              if (feeSetting && feeSetting.isTaxable && (feeSetting.applicableTaxIds || []).includes(taxId)) {
                let feeAmount = 0;
                if (feeSetting.calculation === 'percentage') {
                  feeAmount = (serviceSubtotal * parseFloat(feeSetting.value)) / 100;
                } else {
                  feeAmount = parseFloat(feeSetting.value);
                }
                taxableAmount += feeAmount;
              }
            });
            
            const taxAmount = (taxableAmount * parseFloat(taxSetting.value)) / 100;
            console.log('Applying tax:', taxSetting.name, 'to service:', service.name, 'taxable amount:', taxableAmount, 'tax amount:', taxAmount);
            taxesTotal += taxAmount;
          }
        });
      }
    });
    
    return subtotal + feesTotal + taxesTotal;
  };

  const totalPrice = useMemo(() => {
    return selectedDates.reduce((total, dateConfig) => {
      return total + calculateDateTotal(dateConfig);
    }, 0);
  }, [selectedDates, packages, services]);

  // Handle date selection
  const handleDateClick = (date: Date) => {
    console.log('📅 Date clicked:', date, 'Current selectedDates:', selectedDates.length);
    
    if (!isSameMonth(date, currentDate)) {
      console.log('❌ Date not in current month, ignoring');
      return;
    }
    
    // Prevent selecting past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for comparison
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      console.log('❌ Date is in past, blocking selection');
      toast({
        title: "Invalid Date",
        description: "Cannot select past dates for event booking. Please choose a future date.",
        variant: "destructive",
        duration: 5000
      });
      return;
    }
    
    const existingIndex = selectedDates.findIndex(d => isSameDay(d.date, date));
    if (existingIndex >= 0) {
      console.log('🗑️ Removing existing date at index:', existingIndex);
      setSelectedDates(prev => {
        const newDates = prev.filter((_, i) => i !== existingIndex);
        console.log('📅 After removal, selectedDates will be:', newDates.length);
        return newDates;
      });
      if (activeTabIndex >= selectedDates.length - 1) {
        setActiveTabIndex(Math.max(0, selectedDates.length - 2));
      }
    } else {
      console.log('➕ Adding new date');
      const defaultSpace = selectedVenueData?.spaces?.[0];
      setSelectedDates(prev => {
        const newDates = [...prev, {
          date,
          startTime: "09:00 AM",
          endTime: "05:00 PM",
          spaceId: defaultSpace?.id || "",
          guestCount: 1,
          packageId: "",
          selectedServices: [],
          itemQuantities: {},
          pricingOverrides: {}
        }];
        console.log('📅 After addition, selectedDates will be:', newDates.length, newDates.map(d => d.date));
        return newDates;
      });
    }
  };


  const selectedVenueData = (venues as any[]).find((v: any) => v.id === selectedVenue);
  const selectedPackageData = (packages as any[]).find((p: any) => p.id === activeDate?.packageId);

  // Function to check space availability for a specific date and time
  const getSpaceAvailability = (spaceId: string, date: Date, startTime: string, endTime: string) => {
    try {
      if (!spaceId || !(existingBookings as any[])?.length) return { available: true, conflictingBooking: null };

    console.log('🔍 getSpaceAvailability called with:', {
      spaceId,
      date: date.toDateString(),
      startTime,
      endTime,
      totalExistingBookings: (existingBookings as any[])?.length,
      existingBookingsForSpace: (existingBookings as any[])?.filter(b => b.spaceId === spaceId).map(b => ({
        id: b.id,
        eventName: b.eventName,
        status: b.status,
        eventDate: new Date(b.eventDate).toDateString(),
        startTime: b.startTime,
        endTime: b.endTime
      }))
    });

    const conflicts = (existingBookings as any[]).filter(booking => {
      if (booking.status === 'cancelled') return false;
      if (booking.spaceId !== spaceId) return false;
      
      const bookingDate = new Date(booking.eventDate);
      const dateMatch = bookingDate.toDateString() === date.toDateString();
      
      console.log('🔍 Date comparison:', {
        bookingId: booking.id,
        bookingEventName: booking.eventName,
        bookingDate: bookingDate.toDateString(),
        targetDate: date.toDateString(),
        dateMatch,
        bookingStatus: booking.status
      });
      
      if (!dateMatch) return false;

      // Parse times - handle both 24hr format and 12hr format
      const parseTime = (timeStr: string) => {
        if (!timeStr) return 0;
        
        try {
          if (timeStr.includes('AM') || timeStr.includes('PM')) {
            // Convert 12hr format to 24hr
            const cleanTime = timeStr.replace(/\s(AM|PM)/g, '');
            const [hours, minutes] = cleanTime.split(':').map(Number);
            const isAM = timeStr.includes('AM');
            const hour24 = isAM ? (hours === 12 ? 0 : hours) : (hours === 12 ? 12 : hours + 12);
            return hour24 * 60 + (minutes || 0);
          } else {
            // Already 24hr format
            const [hours, minutes] = timeStr.split(':').map(Number);
            return (hours || 0) * 60 + (minutes || 0);
          }
        } catch (e) {
          console.error('Time parsing error:', e, timeStr);
          return 0;
        }
      };

      const newStart = parseTime(startTime);
      const newEnd = parseTime(endTime);
      const existingStart = parseTime(booking.startTime);
      const existingEnd = parseTime(booking.endTime);

      return (newStart < existingEnd && newEnd > existingStart);
    });

    const result = {
      available: conflicts.length === 0,
      conflictingBooking: conflicts[0] || null
    };
    
    // Debug logging to help track availability checks
    if (conflicts.length > 0) {
      console.log('🔍 getSpaceAvailability found conflict:', {
        spaceId,
        date: date.toDateString(),
        startTime,
        endTime,
        conflictingBooking: {
          eventName: conflicts[0]?.eventName,
          status: conflicts[0]?.status,
          startTime: conflicts[0]?.startTime,
          endTime: conflicts[0]?.endTime
        }
      });
    }
    
    return result;
    } catch (error) {
      console.error('Error in getSpaceAvailability:', error);
      return { available: true, conflictingBooking: null };
    }
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
      return await apiRequest("POST", "/api/customers", customerData);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setSelectedCustomer(data.id);
      setShowNewCustomerForm(false);
      setShowManageEmployees(false);
      setNewCustomer({ 
        name: "", 
        email: "", 
        phone: "", 
        company: "",
        customerType: "individual",
        companyId: "",
        jobTitle: "",
        department: ""
      });
      toast({ title: "Customer created successfully!" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to create customer", description: error.message, variant: "destructive" });
    }
  });

  // Create service mutation
  const createService = useMutation({
    mutationFn: async (serviceData: any) => {
      return await apiRequest("POST", "/api/services", serviceData);
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
      return await apiRequest("POST", "/api/bookings", bookingData);
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
      console.log('🌐 Making API request to /api/bookings/contract with:', contractData);
      try {
        const result = await apiRequest("POST", "/api/bookings/contract", contractData);
        console.log('✅ API request successful:', result);
        return result;
      } catch (error) {
        console.error('🔥 API request failed:', error);
        console.error('🔥 Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          name: error instanceof Error ? error.name : 'Unknown',
          stack: error instanceof Error ? error.stack : undefined,
          response: (error as any)?.response
        });
        throw error;
      }
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
    setNewCustomer({ 
      name: "", 
      email: "", 
      phone: "", 
      company: "",
      customerType: "individual",
      companyId: "",
      jobTitle: "",
      department: ""
    });
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
    
    if (newCustomer.customerType === "business" && !newCustomer.companyId) {
      toast({
        title: "Company required",
        description: "Please select a company for business customers",
        variant: "destructive"
      });
      return;
    }
    
    const customerData = {
      name: newCustomer.name,
      email: newCustomer.email,
      phone: newCustomer.phone,
      customerType: newCustomer.customerType,
      ...(newCustomer.customerType === "business" && {
        companyId: newCustomer.companyId,
        jobTitle: newCustomer.jobTitle,
        department: newCustomer.department
      })
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
    console.log('🚀 handleSubmit called with:', { submitType, eventName, selectedCustomer, selectedDatesCount: selectedDates.length });
    
    if (!eventName || !selectedCustomer || selectedDates.length === 0) {
      console.error('❌ Missing required fields:', { eventName: !!eventName, selectedCustomer: !!selectedCustomer, selectedDatesLength: selectedDates.length });
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

    // If this is a proposal submission, show the email modal instead
    if ((submitType as string) === 'proposal') {
      setShowProposalEmail(true);
      return;
    }

    console.log('🔀 Routing decision: selectedDates.length =', selectedDates.length);
    
    if (selectedDates.length === 1) {
      console.log('📝 Taking SINGLE event path');
      // Single event - use regular booking endpoint
      const firstDate = selectedDates[0];
      const bookingData = {
        eventName,
        eventType: selectedPackageData?.name || "Custom Event",
        eventDate: firstDate.date,
        startTime: convertTimeToHours(firstDate.startTime),
        endTime: convertTimeToHours(firstDate.endTime),
        guestCount: firstDate.guestCount || 1,
        status: (submitType === 'proposal' ? 'pending' : eventStatus) as string,
        customerId: selectedCustomer,
        venueId: selectedVenue,
        spaceId: firstDate.spaceId,
        setupStyle: firstDate.setupStyle || null,
        packageId: firstDate.packageId || null,
        selectedServices: firstDate.selectedServices || [],
        itemQuantities: firstDate.itemQuantities || {},
        pricingOverrides: firstDate.pricingOverrides || {},
        serviceTaxOverrides: firstDate.serviceTaxOverrides || {},
        totalAmount: totalPrice.toString(),
        notes: `Package: ${selectedPackageData?.name || 'None'}, Services: ${firstDate.selectedServices?.length || 0} selected`,
        proposalStatus: (submitType === 'proposal' ? 'sent' : 'none') as string,
        proposalSentAt: (submitType === 'proposal' ? new Date().toISOString() : null) as string | null
      };

      createBooking.mutate(bookingData, {
        onError: (error: any) => {
          if (error.response?.status === 409) {
            // Handle booking conflict
            const conflictData = error.response.data.conflictingBooking;
            const conflictType = error.response.data.conflictType;
            
            if (conflictType === "blocking") {
              // Paid bookings - block creation
              toast({
                title: "❌ Cannot Create Booking",
                description: `This time slot is already booked with confirmed payment by "${conflictData.customerName}" for "${conflictData.eventName}" (${conflictData.startTime} - ${conflictData.endTime}). Paid bookings cannot be overbooked.`,
                variant: "destructive",
                duration: 8000
              });
            } else {
              // Warning for tentative bookings - allow creation but warn
              const statusLabel = getStatusConfig(conflictData.status).label;
              toast({
                title: "⚠️ Time Slot Overlap",
                description: `This time overlaps with "${conflictData.eventName}" by ${conflictData.customerName} (${conflictData.startTime} - ${conflictData.endTime}, Status: ${statusLabel}). Since it's not confirmed, both bookings can coexist.`,
                variant: "default",
                duration: 6000
              });
            }
          } else {
            const errorMessage = error.response?.data?.message || error.message || "An unexpected error occurred";
            
            toast({
              title: "Error creating booking",
              description: errorMessage,
              variant: "destructive"
            });
            
            console.error('📋 Single booking error details:', {
              status: error.response?.status,
              message: errorMessage,
              fullResponse: error.response?.data,
              fullError: error
            });
          }
        }
      });
    } else {
      console.log('📝 Taking MULTIPLE events path');
      // Multiple events - create contract with multiple bookings
      const contractData = {
        customerId: selectedCustomer,
        contractName: eventName,
        status: ((submitType as string) === 'proposal' ? 'pending' : eventStatus) as string
      };

      console.log('🔧 Creating contract with data:', contractData);
      console.log('🔧 Selected dates for contract:', selectedDates);

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
          status: ((submitType as string) === 'proposal' ? 'pending' : eventStatus) as string,
          customerId: selectedCustomer,
          venueId: selectedVenue,
          spaceId: date.spaceId,
          setupStyle: date.setupStyle || null,
          packageId: date.packageId || null,
          selectedServices: date.selectedServices?.length ? date.selectedServices : null,
          pricingModel: selectedPackageData?.pricingModel || "fixed",
          itemQuantities: date.itemQuantities || {},
          pricingOverrides: date.pricingOverrides || null,
          serviceTaxOverrides: date.serviceTaxOverrides || null,
          totalAmount: datePrice.toString(),
          notes: `Package: ${selectedPackageData?.name || 'None'}, Services: ${date.selectedServices?.length || 0} selected`,
          proposalStatus: ((submitType as string) === 'proposal' ? 'sent' : 'none') as string,
          proposalSentAt: ((submitType as string) === 'proposal' ? new Date().toISOString() : null) as string | null
        };
      });

      console.log('🔧 Final bookingsData for contract:', bookingsData);
      console.log('🔧 About to call createContract.mutate with payload:', { contractData, bookingsData });

      createContract.mutate({ contractData, bookingsData }, {
        onSuccess: (data) => {
          console.log('✅ Contract creation SUCCESS:', data);
        },
        onError: (error: any) => {
          console.error('📋 Contract creation error details:', {
            status: error.response?.status,
            message: error.response?.data?.message || error.message,
            fullResponse: error.response?.data,
            fullError: error
          });
          
          if (error.response?.status === 409) {
            const conflictData = error.response.data.conflictingBooking;
            const conflictType = error.response.data.conflictType;
            
            if (conflictType === "blocking") {
              // Paid bookings - block creation
              toast({
                title: "❌ Cannot Create Contract",
                description: `One or more dates conflict with confirmed paid bookings. First conflict: "${conflictData.eventName}" by ${conflictData.customerName} (${conflictData.startTime} - ${conflictData.endTime}). Paid bookings cannot be overbooked.`,
                variant: "destructive",
                duration: 8000
              });
            } else {
              // Warning for tentative bookings - allow creation but warn  
              const statusLabel = getStatusConfig(conflictData.status).label;
              toast({
                title: "⚠️ Date Overlap Detected",
                description: `One or more dates overlap with tentative bookings. First overlap: "${conflictData.eventName}" by ${conflictData.customerName} (${conflictData.startTime} - ${conflictData.endTime}, Status: ${statusLabel}). Since these aren't confirmed, both bookings can coexist.`,
                variant: "default",
                duration: 6000
              });
            }
          } else {
            const errorMessage = error.response?.data?.message || error.message || "An unexpected error occurred";
            
            toast({
              title: "Error creating contract",
              description: errorMessage,
              variant: "destructive"
            });
            
            console.error('📋 Contract creation error details:', {
              status: error.response?.status,
              message: errorMessage,
              fullResponse: error.response?.data,
              fullError: error
            });
          }
        }
      });
    }
  };

  // Helper functions for company/customer management
  const getCompanyById = (id: string) => {
    return (companies as any[]).find(c => c.id === id);
  };

  const getCustomersByCompany = (companyId: string) => {
    return (customers as any[]).filter(c => c.companyId === companyId);
  };

  const getFilteredCompanies = () => {
    if (!companySearch) return [];
    return (companies as any[]).filter(company => 
      company.name.toLowerCase().includes(companySearch.toLowerCase())
    );
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

      // Reset active tab index to first date when moving to step 2
      setActiveTabIndex(0);
    }
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  // Helper function to check for blocking conflicts
  const hasBlockingConflicts = () => {
    try {
      const blockingStatuses = ['confirmed_deposit_paid', 'confirmed_fully_paid'];
      return selectedDates.some(dateInfo => {
        if (!dateInfo.spaceId) return false;
      
      const availability = getSpaceAvailability(
        dateInfo.spaceId,
        dateInfo.date,
        dateInfo.startTime,
        dateInfo.endTime
      );
      
      if (!availability.available && availability.conflictingBooking) {
        const conflictStatus = availability.conflictingBooking.status;
        const isBlocking = blockingStatuses.includes(conflictStatus);
        
        // Debug logging to help identify the issue
        console.log('🔍 Conflict detected:', {
          conflictStatus,
          isBlocking,
          blockingStatuses,
          eventName: availability.conflictingBooking.eventName,
          dateInfo: {
            date: dateInfo.date,
            startTime: dateInfo.startTime,
            endTime: dateInfo.endTime
          }
        });
        
        return isBlocking;
      }
      return false;
    });
    } catch (error) {
      console.error('Error in hasBlockingConflicts:', error);
      return false;
    }
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
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-600">Status:</span>
                  <StatusSelector
                    currentStatus={eventStatus as EventStatus}
                    onStatusChange={(newStatus) => setEventStatus(newStatus)}
                  />
                </div>
                {/* Extra space before close button */}
                <div className="w-8" />
              </div>
            </div>

            {/* Step Content */}
            <div className="flex-1 overflow-hidden">
              <div className="h-full p-3 sm:p-6 overflow-y-auto">
              {/* Step 1: Date & Venue Selection */}
              {currentStep === 1 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
                  {/* Left: Calendar */}
                  <div className="sticky top-0 self-start">
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
                        
                        // Check if date is in the past
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const dayForComparison = new Date(day);
                        dayForComparison.setHours(0, 0, 0, 0);
                        const isPastDate = dayForComparison < today;
                        
                        return (
                          <button
                            key={index}
                            onClick={() => handleDateClick(day)}
                            disabled={isPastDate}
                            className={cn(
                              "h-12 w-12 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                              isCurrentMonth 
                                ? isPastDate 
                                  ? "text-slate-300 cursor-not-allowed bg-slate-50" 
                                  : "text-slate-900 hover:bg-slate-100"
                                : "text-slate-400",
                              isSelected && !isPastDate && "bg-blue-600 text-white hover:bg-blue-700",
                              isPastDate && "opacity-50"
                            )}
                            title={isPastDate ? "Past dates cannot be selected" : undefined}
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
                                            <span className="font-medium">Status: {statusConfig.label}</span>
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
                                              Exceeds ({capacity})
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
                                      <div className="text-sm font-semibold text-green-600 mt-2">{formatAmount(0)}</div>
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

                                            {/* Package Taxes & Fees Configuration */}
                                            {isSelected && (
                                              <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                                                <div className="text-xs font-medium text-slate-700">Taxes & Fees for this Package</div>
                                                
                                                {/* Show inherited taxes/fees from package */}
                                                {((pkg.appliedTaxes || []).length > 0 || (pkg.appliedFees || []).length > 0) && (
                                                  <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                                                    <span className="font-medium">Inherited from package:</span>
                                                    {(pkg.appliedTaxes || []).map((taxId: string) => {
                                                      const tax = (taxSettings as any[])?.find((t: any) => t.id === taxId);
                                                      return tax ? ` ${tax.name} (${tax.value}%)` : '';
                                                    }).join(', ')}
                                                    {(pkg.appliedFees || []).map((feeId: string) => {
                                                      const fee = (taxSettings as any[])?.find((f: any) => f.id === feeId);
                                                      return fee ? ` ${fee.name} ($${fee.value})` : '';
                                                    }).join(', ')}
                                                  </div>
                                                )}

                                                {/* Additional taxes/fees for package */}
                                                {taxSettings.filter((item) => item.type === 'tax' && item.isActive).length > 0 && (
                                                  <div>
                                                    <div className="text-xs text-slate-600 mb-1">Additional Taxes:</div>
                                                    <div className="flex flex-wrap gap-1">
                                                      {taxSettings
                                                        .filter((item) => item.type === 'tax' && item.isActive)
                                                        .map((tax) => {
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
                                                                      ? [...currentOverrides.enabledTaxIds, tax.id]
                                                                      : currentOverrides.enabledTaxIds.filter(id => id !== tax.id);
                                                                    
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
                                                                {isInherited && " ✓"}
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
                                                                      ? [...currentOverrides.enabledFeeIds, fee.id]
                                                                      : currentOverrides.enabledFeeIds.filter(id => id !== fee.id);
                                                                    
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
                                                                {fee.name} (${fee.value})
                                                                {isInherited && " ✓"}
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
                                  <div className="flex items-center gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setShowServiceSelection(!showServiceSelection)}
                                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                    >
                                      {showServiceSelection ? "Hide Services" : "Show Services"}
                                    </Button>
                                    {showServiceSelection && (
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

                                {/* New Service Form */}
                                {showServiceSelection && showNewServiceForm && (
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

                                {showServiceSelection && (
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
                                            <div className="mt-3 pt-3 border-t border-slate-200 space-y-3">
                                              {/* Pricing Controls */}
                                              <div className="flex items-center gap-4">
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

                                              {/* Taxes & Fees Configuration */}
                                              <div className="space-y-2">
                                                <div className="text-xs font-medium text-slate-700">Taxes & Fees for this Service</div>
                                                
                                                {/* Show inherited taxes/fees from service */}
                                                {((service.appliedTaxes || []).length > 0 || (service.appliedFees || []).length > 0) && (
                                                  <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                                                    <span className="font-medium">Inherited from service:</span>
                                                    {(service.appliedTaxes || []).map((taxId: string) => {
                                                      const tax = (taxSettings as any[])?.find((t: any) => t.id === taxId);
                                                      return tax ? ` ${tax.name} (${tax.value}%)` : '';
                                                    }).join(', ')}
                                                    {(service.appliedFees || []).map((feeId: string) => {
                                                      const fee = (taxSettings as any[])?.find((f: any) => f.id === feeId);
                                                      return fee ? ` ${fee.name} ($${fee.value})` : '';
                                                    }).join(', ')}
                                                  </div>
                                                )}

                                                {/* Available taxes to override/add */}
                                                {taxSettings.filter((item) => item.type === 'tax' && item.isActive).length > 0 && (
                                                  <div>
                                                    <div className="text-xs text-slate-600 mb-1">Additional Taxes:</div>
                                                    <div className="flex flex-wrap gap-1">
                                                      {taxSettings
                                                        .filter((item) => item.type === 'tax' && item.isActive)
                                                        .map((tax) => {
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
                                                                      ? [...currentOverrides.enabledTaxIds, tax.id]
                                                                      : currentOverrides.enabledTaxIds.filter(id => id !== tax.id);
                                                                    
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
                                                                {isInherited && " ✓"}
                                                              </span>
                                                            </label>
                                                          );
                                                        })}
                                                    </div>
                                                  </div>
                                                )}

                                                {/* Available fees to override/add */}
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
                                                                      ? [...currentOverrides.enabledFeeIds, fee.id]
                                                                      : currentOverrides.enabledFeeIds.filter(id => id !== fee.id);
                                                                    
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
                                                                {fee.name} (${fee.value})
                                                                {isInherited && " ✓"}
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
                                )}
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
                            data-testid="button-new-customer"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            {showNewCustomerForm ? "Cancel" : "New Customer"}
                          </Button>
                        </div>
                        
                        {!showNewCustomerForm ? (
                          <div className="space-y-3">
                            {/* Company Search */}
                            <div>
                              <Label className="text-sm font-medium mb-2 block">Search by Company</Label>
                              <Input
                                value={companySearch}
                                onChange={(e) => setCompanySearch(e.target.value)}
                                placeholder="Type company name to search..."
                                className="mb-2"
                                data-testid="input-company-search"
                              />
                              
                              {companySearch && getFilteredCompanies().length > 0 && (
                                <div className="border rounded-md max-h-48 overflow-y-auto bg-white">
                                  {getFilteredCompanies().map((company: any) => {
                                    const companyEmployees = getCustomersByCompany(company.id);
                                    return (
                                      <div key={company.id} className="border-b last:border-b-0">
                                        <div className="p-3 bg-gray-50">
                                          <div className="flex items-center justify-between">
                                            <div>
                                              <h4 className="font-medium text-sm">{company.name}</h4>
                                              <p className="text-xs text-muted-foreground">{companyEmployees.length} employees</p>
                                            </div>
                                            <Button
                                              type="button"
                                              variant="outline"
                                              size="sm"
                                              onClick={() => {
                                                setSelectedCompanyId(company.id);
                                                setShowManageEmployees(true);
                                              }}
                                              data-testid={`button-manage-employees-${company.id}`}
                                            >
                                              Manage
                                            </Button>
                                          </div>
                                        </div>
                                        {companyEmployees.length > 0 && (
                                          <div className="p-2 space-y-1">
                                            {companyEmployees.map((employee: any) => (
                                              <button
                                                key={employee.id}
                                                type="button"
                                                onClick={() => {
                                                  setSelectedCustomer(employee.id);
                                                  setCompanySearch("");
                                                }}
                                                className="w-full text-left p-2 rounded hover:bg-blue-50 border border-transparent hover:border-blue-200"
                                                data-testid={`button-select-employee-${employee.id}`}
                                              >
                                                <div className="flex items-center justify-between">
                                                  <div>
                                                    <p className="font-medium text-sm">{employee.name}</p>
                                                    <p className="text-xs text-muted-foreground">{employee.email}</p>
                                                    {employee.jobTitle && (
                                                      <p className="text-xs text-blue-600">{employee.jobTitle}</p>
                                                    )}
                                                  </div>
                                                  {selectedCustomer === employee.id && (
                                                    <Badge variant="default" className="bg-green-100 text-green-800">Selected</Badge>
                                                  )}
                                                </div>
                                              </button>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            {/* Regular Customer Selection */}
                            <div>
                              <Label className="text-sm font-medium mb-2 block">Or Select Existing Customer</Label>
                              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                                <SelectTrigger className={cn(!selectedCustomer && "border-red-200 bg-red-50/30")} data-testid="select-customer">
                                  <SelectValue placeholder="-- Select a Customer --" />
                                </SelectTrigger>
                                <SelectContent>
                                  {(customers as any[]).map((customer: any) => (
                                    <SelectItem key={customer.id} value={customer.id}>
                                      <div className="flex flex-col">
                                        <span>{customer.name} - {customer.email}</span>
                                        {customer.companyId && (
                                          <span className="text-xs text-muted-foreground">
                                            {getCompanyById(customer.companyId)?.name} • {customer.jobTitle}
                                          </span>
                                        )}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        ) : (
                          <Card className="p-4 border-blue-200 bg-blue-50">
                            <div className="space-y-4">
                              <h4 className="font-medium text-sm">Create New Customer</h4>
                              
                              {/* Customer Type Selection */}
                              <div>
                                <Label className="text-sm font-medium">Customer Type</Label>
                                <Select 
                                  value={newCustomer.customerType} 
                                  onValueChange={(value) => setNewCustomer(prev => ({...prev, customerType: value as "individual" | "business"}))}
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="individual">Individual Customer</SelectItem>
                                    <SelectItem value="business">Business Customer</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

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
                                    data-testid="input-new-customer-name"
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
                                    data-testid="input-new-customer-email"
                                  />
                                </div>
                                <div>
                                  <Label className="text-sm">Phone</Label>
                                  <Input
                                    value={newCustomer.phone}
                                    onChange={(e) => setNewCustomer(prev => ({...prev, phone: e.target.value}))}
                                    placeholder="(555) 123-4567"
                                    className="mt-1"
                                    data-testid="input-new-customer-phone"
                                  />
                                </div>
                                
                                {newCustomer.customerType === "business" ? (
                                  <div>
                                    <Label className="text-sm flex items-center gap-1">
                                      Company
                                      <span className="text-red-500 text-xs">*</span>
                                    </Label>
                                    <Select 
                                      value={newCustomer.companyId} 
                                      onValueChange={(value) => setNewCustomer(prev => ({...prev, companyId: value}))}
                                    >
                                      <SelectTrigger className={cn("mt-1", !newCustomer.companyId && "border-red-200 bg-red-50/30")}>
                                        <SelectValue placeholder="Select company" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {(companies as any[]).map((company: any) => (
                                          <SelectItem key={company.id} value={company.id}>
                                            {company.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                ) : (
                                  <div>
                                    <Label className="text-sm">Company</Label>
                                    <Input
                                      value={newCustomer.company}
                                      onChange={(e) => setNewCustomer(prev => ({...prev, company: e.target.value}))}
                                      placeholder="Company name"
                                      className="mt-1"
                                      data-testid="input-new-customer-company"
                                    />
                                  </div>
                                )}
                                
                                {/* Additional business customer fields */}
                                {newCustomer.customerType === "business" && (
                                  <>
                                    <div>
                                      <Label className="text-sm">Job Title</Label>
                                      <Input
                                        value={newCustomer.jobTitle}
                                        onChange={(e) => setNewCustomer(prev => ({...prev, jobTitle: e.target.value}))}
                                        placeholder="e.g., Event Manager"
                                        className="mt-1"
                                        data-testid="input-new-customer-job-title"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-sm">Department</Label>
                                      <Input
                                        value={newCustomer.department}
                                        onChange={(e) => setNewCustomer(prev => ({...prev, department: e.target.value}))}
                                        placeholder="e.g., Marketing"
                                        className="mt-1"
                                        data-testid="input-new-customer-department"
                                      />
                                    </div>
                                  </>
                                )}
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
                          {/* Pricing Breakdown */}
                          <div className="space-y-2 mb-3">
                            {(() => {
                              // Calculate subtotal (packages + services without taxes/fees)
                              let subtotal = 0;
                              let feesTotal = 0;
                              let taxesTotal = 0;
                              
                              selectedDates.forEach(date => {
                                // Package price
                                if (date.packageId) {
                                  const pkg = (packages as any[])?.find((p: any) => p.id === date.packageId);
                                  if (pkg) {
                                    const packagePrice = date.pricingOverrides?.packagePrice ?? parseFloat(pkg.price);
                                    subtotal += pkg.pricingModel === 'per_person' 
                                      ? packagePrice * (date.guestCount || 1)
                                      : packagePrice;
                                  }
                                }
                                
                                // Service prices
                                (date.selectedServices || []).forEach(serviceId => {
                                  const service = (services as any[])?.find((s: any) => s.id === serviceId);
                                  if (service) {
                                    const quantity = date.itemQuantities?.[serviceId] || 1;
                                    const overridePrice = date.pricingOverrides?.servicePrices?.[serviceId];
                                    const price = overridePrice ?? parseFloat(service.price || 0);
                                    const eventDuration = calculateEventDuration(date.startTime, date.endTime);
                                    
                                    if (service.pricingModel === 'per_person') {
                                      subtotal += price * (date.guestCount || 1);
                                    } else if (service.pricingModel === 'per_hour') {
                                      subtotal += price * eventDuration;
                                    } else {
                                      subtotal += price * quantity;
                                    }
                                  }
                                });
                              });
                              
                              // Calculate taxes and fees per service/package (not accumulated)
                              const appliedFees: Array<{name: string, amount: number}> = [];
                              const appliedTaxes: Array<{name: string, amount: number}> = [];
                              
                              // Track individual taxes/fees to show in breakdown
                              const feeMap = new Map<string, {name: string, amount: number}>();
                              const taxMap = new Map<string, {name: string, amount: number}>();
                              
                              selectedDates.forEach(date => {
                                const eventDuration = calculateEventDuration(date.startTime, date.endTime);
                                
                                // Calculate package taxes and fees if package is selected
                                if (date.packageId) {
                                  const pkg = (packages as any[])?.find((p: any) => p.id === date.packageId);
                                  if (pkg) {
                                    let packageSubtotal = 0;
                                    const packagePrice = date.pricingOverrides?.packagePrice ?? parseFloat(pkg.price || 0);
                                    
                                    if (pkg.pricingModel === 'per_person') {
                                      packageSubtotal = packagePrice * (date.guestCount || 1);
                                    } else if (pkg.pricingModel === 'per_hour') {
                                      packageSubtotal = packagePrice * eventDuration;
                                    } else {
                                      packageSubtotal = packagePrice;
                                    }
                                    
                                    // Apply package fees
                                    (pkg.enabledFeeIds || []).forEach((feeId: string) => {
                                      const feeSetting = taxSettings?.find((s) => s.id === feeId && s.isActive);
                                      if (feeSetting && (feeSetting.type === 'fee' || feeSetting.type === 'service_charge')) {
                                        let feeAmount = 0;
                                        if (feeSetting.calculation === 'percentage') {
                                          feeAmount = (packageSubtotal * parseFloat(feeSetting.value)) / 100;
                                        } else {
                                          feeAmount = parseFloat(feeSetting.value);
                                        }
                                        
                                        const existing = feeMap.get(feeId) || {name: feeSetting.name, amount: 0};
                                        feeMap.set(feeId, {name: feeSetting.name, amount: existing.amount + feeAmount});
                                        feesTotal += feeAmount;
                                      }
                                    });
                                    
                                    // Apply package taxes
                                    (pkg.enabledTaxIds || []).forEach((taxId: string) => {
                                      const taxSetting = taxSettings?.find((s) => s.id === taxId && s.isActive);
                                      if (taxSetting) {
                                        const taxAmount = (packageSubtotal * parseFloat(taxSetting.value)) / 100;
                                        
                                        const existing = taxMap.get(taxId) || {name: taxSetting.name, amount: 0};
                                        taxMap.set(taxId, {name: taxSetting.name, amount: existing.amount + taxAmount});
                                        taxesTotal += taxAmount;
                                      }
                                    });
                                  }
                                }
                                
                                // Calculate service taxes and fees for each service individually
                                const includedServiceIds = (() => {
                                  if (!date.packageId) return [];
                                  const pkg = (packages as any[])?.find((p: any) => p.id === date.packageId);
                                  return pkg?.includedServices || [];
                                })();
                                
                                (date.selectedServices || []).forEach(serviceId => {
                                  if (includedServiceIds.includes(serviceId)) {
                                    return; // Skip included services
                                  }
                                  
                                  const service = (services as any[])?.find((s: any) => s.id === serviceId);
                                  if (service) {
                                    let serviceSubtotal = 0;
                                    const servicePrice = date.pricingOverrides?.servicePrices?.[serviceId] ?? parseFloat(service.price || 0);
                                    
                                    if (service.pricingModel === 'per_person') {
                                      serviceSubtotal = servicePrice * (date.guestCount || 1);
                                    } else if (service.pricingModel === 'per_hour') {
                                      serviceSubtotal = servicePrice * eventDuration;
                                    } else {
                                      const quantity = date.itemQuantities?.[serviceId] || 1;
                                      serviceSubtotal = servicePrice * quantity;
                                    }
                                    
                                    // Determine which fees and taxes apply to this service (including overrides)
                                    const currentOverrides = date.serviceTaxOverrides?.[serviceId] || { enabledTaxIds: [], enabledFeeIds: [], disabledInheritedTaxIds: [], disabledInheritedFeeIds: [] };
                                    
                                    // Calculate effective fee IDs (inherited + additional - disabled)
                                    const inheritedFeeIds = service.enabledFeeIds || [];
                                    const additionalFeeIds = currentOverrides.enabledFeeIds || [];
                                    const disabledFeeIds = currentOverrides.disabledInheritedFeeIds || [];
                                    const effectiveFeeIds = [...inheritedFeeIds.filter((id: string) => !disabledFeeIds.includes(id)), ...additionalFeeIds];
                                    
                                    // Calculate effective tax IDs (inherited + additional - disabled)
                                    const inheritedTaxIds = service.enabledTaxIds || [];
                                    const additionalTaxIds = currentOverrides.enabledTaxIds || [];
                                    const disabledTaxIds = currentOverrides.disabledInheritedTaxIds || [];
                                    const effectiveTaxIds = [...inheritedTaxIds.filter((id: string) => !disabledTaxIds.includes(id)), ...additionalTaxIds];
                                    
                                    // Apply service fees
                                    effectiveFeeIds.forEach((feeId: string) => {
                                      const feeSetting = taxSettings?.find((s) => s.id === feeId && s.isActive);
                                      if (feeSetting && (feeSetting.type === 'fee' || feeSetting.type === 'service_charge')) {
                                        let feeAmount = 0;
                                        if (feeSetting.calculation === 'percentage') {
                                          feeAmount = (serviceSubtotal * parseFloat(feeSetting.value)) / 100;
                                        } else {
                                          feeAmount = parseFloat(feeSetting.value);
                                        }
                                        
                                        const existing = feeMap.get(feeId) || {name: feeSetting.name, amount: 0};
                                        feeMap.set(feeId, {name: feeSetting.name, amount: existing.amount + feeAmount});
                                        feesTotal += feeAmount;
                                      }
                                    });
                                    
                                    // Apply service taxes (to base service amount + fees if fee is taxable)
                                    effectiveTaxIds.forEach((taxId: string) => {
                                      const taxSetting = taxSettings?.find((s) => s.id === taxId && s.isActive);
                                      if (taxSetting) {
                                        // Tax on base service amount
                                        let taxableAmount = serviceSubtotal;
                                        
                                        // Add fees to taxable amount if any applied fees are taxable
                                        effectiveFeeIds.forEach((feeId: string) => {
                                          const feeSetting = taxSettings?.find((s) => s.id === feeId && s.isActive);
                                          if (feeSetting && feeSetting.isTaxable && (feeSetting.applicableTaxIds || []).includes(taxId)) {
                                            let feeAmount = 0;
                                            if (feeSetting.calculation === 'percentage') {
                                              feeAmount = (serviceSubtotal * parseFloat(feeSetting.value)) / 100;
                                            } else {
                                              feeAmount = parseFloat(feeSetting.value);
                                            }
                                            taxableAmount += feeAmount;
                                          }
                                        });
                                        
                                        const taxAmount = (taxableAmount * parseFloat(taxSetting.value)) / 100;
                                        
                                        const existing = taxMap.get(taxId) || {name: taxSetting.name, amount: 0};
                                        taxMap.set(taxId, {name: taxSetting.name, amount: existing.amount + taxAmount});
                                        taxesTotal += taxAmount;
                                      }
                                    });
                                  }
                                });
                              });
                              
                              // Convert maps to arrays for display
                              appliedFees.push(...Array.from(feeMap.values()));
                              appliedTaxes.push(...Array.from(taxMap.values()));
                              
                              const displayBreakdown = subtotal > 0;
                              
                              return displayBreakdown ? (
                                <>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Subtotal (Packages + Services):</span>
                                    <span className="text-green-600 font-medium">${subtotal.toFixed(2)}</span>
                                  </div>
                                  
                                  {/* Individual Fees */}
                                  {appliedFees.map((fee, index) => (
                                    <div key={`fee-${index}`} className="flex justify-between text-sm text-blue-600">
                                      <span className="pl-2">+ {fee.name}:</span>
                                      <span>+{formatAmount(fee.amount)}</span>
                                    </div>
                                  ))}
                                  
                                  {/* Individual Taxes */}
                                  {appliedTaxes.map((tax, index) => (
                                    <div key={`tax-${index}`} className="flex justify-between text-sm text-purple-600">
                                      <span className="pl-2">+ {tax.name}:</span>
                                      <span>+{formatAmount(tax.amount)}</span>
                                    </div>
                                  ))}
                                  
                                  {(appliedFees.length > 0 || appliedTaxes.length > 0) && (
                                    <div className="border-t pt-2 mt-2">
                                      <div className="flex justify-between font-semibold text-lg">
                                        <span>Grand Total:</span>
                                        <span className="text-blue-700">${totalPrice.toFixed(2)}</span>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {appliedFees.length === 0 && appliedTaxes.length === 0 && (
                                    <div className="border-t pt-2 mt-2">
                                      <div className="flex justify-between font-semibold text-lg">
                                        <span>Total Price:</span>
                                        <span className="text-green-600">${totalPrice.toFixed(2)}</span>
                                      </div>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="flex justify-between font-semibold text-lg">
                                  <span>Total Price:</span>
                                  <span>${totalPrice.toFixed(2)}</span>
                                </div>
                              );
                            })()}
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
                    className={hasBlockingConflicts() && currentStep === 1 ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}
                    disabled={
                      currentStep === 1 && (
                        selectedDates.length === 0 || 
                        (Array.isArray(venues) && venues.length > 1 && !selectedVenue) ||
                        hasBlockingConflicts()
                      )
                    }
                  >
                    {currentStep === 1 
                      ? hasBlockingConflicts()
                        ? `❌ Blocking Conflicts Detected`
                        : `Configure ${selectedDates.length} Event Date${selectedDates.length !== 1 ? 's' : ''}` 
                      : 'Next'
                    }
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => handleSubmit('proposal')}
                      disabled={!eventName || !selectedCustomer || selectedDates.length === 0 || (selectedDates.length === 1 ? createBooking.isPending : createContract.isPending)}
                      className="border-blue-500 text-blue-600 hover:bg-blue-50"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {(selectedDates.length === 1 ? createBooking.isPending : createContract.isPending) ? 'Sending...' : 'Send as Proposal'}
                    </Button>
                    <Button 
                      onClick={() => handleSubmit('inquiry')}
                      className="bg-blue-600 hover:bg-blue-700"
                      disabled={selectedDates.length === 1 ? createBooking.isPending : createContract.isPending}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {(selectedDates.length === 1 ? createBooking.isPending : createContract.isPending) ? 'Creating...' : 'Save Event'}
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
                                {formatAmount(date.pricingOverrides?.packagePrice ?? parseFloat(selectedPackage.price))}
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
                                    ? `${formatAmount(price)} x ${date.guestCount || 1} guests`
                                    : service.pricingModel === 'per_hour'
                                    ? `${formatAmount(price)} x ${eventDuration.toFixed(1)} hours`
                                    : quantity > 1 
                                      ? `${formatAmount(price)} x ${quantity}`
                                      : formatAmount(price)
                                  }
                                </span>
                                <span className="text-sm font-medium">{formatAmount(totalPrice)}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Tax and Fee Breakdown */}
                  {(() => {
                    // Calculate breakdown for this specific date
                    let subtotal = 0;
                    const feeBreakdown: Array<{name: string, amount: number, description: string}> = [];
                    const taxBreakdown: Array<{name: string, amount: number, description: string}> = [];
                    
                    const eventDuration = calculateEventDuration(date.startTime, date.endTime);
                    
                    // Package subtotal
                    if (date.packageId) {
                      const pkg = (packages as any[])?.find((p: any) => p.id === date.packageId);
                      if (pkg) {
                        const packagePrice = date.pricingOverrides?.packagePrice ?? parseFloat(pkg.price || 0);
                        if (pkg.pricingModel === 'per_person') {
                          subtotal += packagePrice * (date.guestCount || 1);
                        } else if (pkg.pricingModel === 'per_hour') {
                          subtotal += packagePrice * eventDuration;
                        } else {
                          subtotal += packagePrice;
                        }
                      }
                    }
                    
                    // Service subtotals
                    const includedServiceIds = (() => {
                      if (!date.packageId) return [];
                      const pkg = (packages as any[])?.find((p: any) => p.id === date.packageId);
                      return pkg?.includedServices || [];
                    })();
                    
                    (date.selectedServices || []).forEach(serviceId => {
                      if (includedServiceIds.includes(serviceId)) return;
                      
                      const service = (services as any[])?.find((s: any) => s.id === serviceId);
                      if (service) {
                        const servicePrice = date.pricingOverrides?.servicePrices?.[serviceId] ?? parseFloat(service.price || 0);
                        let serviceSubtotal = 0;
                        
                        if (service.pricingModel === 'per_person') {
                          serviceSubtotal = servicePrice * (date.guestCount || 1);
                        } else if (service.pricingModel === 'per_hour') {
                          serviceSubtotal = servicePrice * eventDuration;
                        } else {
                          const quantity = date.itemQuantities?.[serviceId] || 1;
                          serviceSubtotal = servicePrice * quantity;
                        }
                        
                        subtotal += serviceSubtotal;
                        
                        // Get effective tax/fee IDs for this service
                        const currentOverrides = date.serviceTaxOverrides?.[serviceId] || { enabledTaxIds: [], enabledFeeIds: [], disabledInheritedTaxIds: [], disabledInheritedFeeIds: [] };
                        
                        const inheritedFeeIds = service.enabledFeeIds || [];
                        const additionalFeeIds = currentOverrides.enabledFeeIds || [];
                        const disabledFeeIds = currentOverrides.disabledInheritedFeeIds || [];
                        const effectiveFeeIds = [...inheritedFeeIds.filter((id: string) => !disabledFeeIds.includes(id)), ...additionalFeeIds];
                        
                        const inheritedTaxIds = service.enabledTaxIds || [];
                        const additionalTaxIds = currentOverrides.enabledTaxIds || [];
                        const disabledTaxIds = currentOverrides.disabledInheritedTaxIds || [];
                        const effectiveTaxIds = [...inheritedTaxIds.filter((id: string) => !disabledTaxIds.includes(id)), ...additionalTaxIds];
                        
                        // Calculate fees for this service
                        effectiveFeeIds.forEach((feeId: string) => {
                          const feeSetting = taxSettings?.find((s) => s.id === feeId && s.isActive);
                          if (feeSetting && (feeSetting.type === 'fee' || feeSetting.type === 'service_charge')) {
                            let feeAmount = 0;
                            if (feeSetting.calculation === 'percentage') {
                              feeAmount = (serviceSubtotal * parseFloat(feeSetting.value)) / 100;
                            } else {
                              feeAmount = parseFloat(feeSetting.value);
                            }
                            
                            const existing = feeBreakdown.find(f => f.name === feeSetting.name);
                            if (existing) {
                              existing.amount += feeAmount;
                              existing.description += `, ${service.name}`;
                            } else {
                              feeBreakdown.push({
                                name: feeSetting.name,
                                amount: feeAmount,
                                description: `Applied to ${service.name}`
                              });
                            }
                          }
                        });
                        
                        // Calculate taxes for this service
                        effectiveTaxIds.forEach((taxId: string) => {
                          const taxSetting = taxSettings?.find((s) => s.id === taxId && s.isActive);
                          if (taxSetting) {
                            let taxableAmount = serviceSubtotal;
                            
                            // Add fees to taxable amount if any applied fees are taxable
                            effectiveFeeIds.forEach((feeId: string) => {
                              const feeSetting = taxSettings?.find((s) => s.id === feeId && s.isActive);
                              if (feeSetting && feeSetting.isTaxable && (feeSetting.applicableTaxIds || []).includes(taxId)) {
                                let feeAmount = 0;
                                if (feeSetting.calculation === 'percentage') {
                                  feeAmount = (serviceSubtotal * parseFloat(feeSetting.value)) / 100;
                                } else {
                                  feeAmount = parseFloat(feeSetting.value);
                                }
                                taxableAmount += feeAmount;
                              }
                            });
                            
                            const taxAmount = (taxableAmount * parseFloat(taxSetting.value)) / 100;
                            
                            const existing = taxBreakdown.find(t => t.name === taxSetting.name);
                            if (existing) {
                              existing.amount += taxAmount;
                              existing.description += `, ${service.name}`;
                            } else {
                              taxBreakdown.push({
                                name: taxSetting.name,
                                amount: taxAmount,
                                description: `Applied to ${service.name}${taxableAmount > serviceSubtotal ? ' (incl. fees)' : ''}`
                              });
                            }
                          }
                        });
                      }
                    });
                    
                    // Only show if there are fees or taxes
                    if (feeBreakdown.length > 0 || taxBreakdown.length > 0) {
                      return (
                        <div className="mt-4 pt-4 border-t">
                          <h6 className="font-medium mb-3">Tax & Fee Breakdown</h6>
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600">Subtotal:</span>
                              <span className="font-medium">${subtotal.toFixed(2)}</span>
                            </div>
                            
                            {feeBreakdown.map((fee, idx) => (
                              <div key={`fee-${idx}`} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span className="text-slate-600">{fee.name}:</span>
                                  <span>{formatAmount(fee.amount)}</span>
                                </div>
                                <div className="text-xs text-slate-500 ml-2">{fee.description}</div>
                              </div>
                            ))}
                            
                            {taxBreakdown.map((tax, idx) => (
                              <div key={`tax-${idx}`} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span className="text-slate-600">{tax.name}:</span>
                                  <span>{formatAmount(tax.amount)}</span>
                                </div>
                                <div className="text-xs text-slate-500 ml-2">{tax.description}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
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

      {/* Proposal Email Modal */}
      {showProposalEmail && selectedCustomer && (
        <ProposalEmailModal
          open={showProposalEmail}
          onOpenChange={setShowProposalEmail}
          eventData={{
            eventName,
            customerId: selectedCustomer,
            customerEmail: (customers as any[])?.find((c: any) => c.id === selectedCustomer)?.email || "",
            customerName: (customers as any[])?.find((c: any) => c.id === selectedCustomer)?.name || "",
            totalAmount: totalPrice,
            eventDates: selectedDates.map(d => ({
              date: d.date,
              startTime: d.startTime,
              endTime: d.endTime,
              venue: selectedVenueData?.name || "",
              space: d.spaceId ? (venues as any[])?.find((v: any) => v.id === selectedVenue)?.spaces?.find((s: any) => s.id === d.spaceId)?.name || "" : "",
              guestCount: d.guestCount || 1
            }))
          }}
          onProposalSent={async (proposalId: string) => {
            console.log('Proposal sent with ID:', proposalId);
            
            // Create the event with proposal_shared status (pending)
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
                status: 'pending', // This displays as "Proposal Shared"
                customerId: selectedCustomer,
                venueId: selectedVenue,
                spaceId: firstDate.spaceId,
                setupStyle: firstDate.setupStyle || null,
                packageId: firstDate.packageId || null,
                selectedServices: firstDate.selectedServices?.length ? firstDate.selectedServices : null,
                pricingModel: selectedPackageData?.pricingModel || "fixed",
                itemQuantities: firstDate.itemQuantities || {},
                pricingOverrides: firstDate.pricingOverrides || null,
                serviceTaxOverrides: firstDate.serviceTaxOverrides || null,
                totalAmount: totalPrice.toString(),
                notes: `Package: ${selectedPackageData?.name || 'None'}, Services: ${firstDate.selectedServices?.length || 0} selected`,
                proposalStatus: 'sent',
                proposalSentAt: new Date().toISOString(),
                proposalId: proposalId // Link the proposal to the booking
              };

              createBooking.mutate(bookingData);
            } else {
              // Multiple events - create contract with multiple bookings  
              const contractData = {
                customerId: selectedCustomer,
                contractName: eventName,
                status: 'pending',
                proposalId: proposalId // CRITICAL: Pass proposalId to link with contract
              };

              const bookingsData = selectedDates.map((date, index) => {
                const datePrice = calculateDateTotal(date);

                return {
                  eventName: `${eventName} - Day ${index + 1}`,
                  eventType: "corporate",
                  eventDate: date.date,
                  startTime: convertTimeToHours(date.startTime),
                  endTime: convertTimeToHours(date.endTime),
                  guestCount: date.guestCount || 1,
                  status: 'pending', // This displays as "Proposal Shared"
                  customerId: selectedCustomer,
                  venueId: selectedVenue,
                  spaceId: date.spaceId,
                  setupStyle: date.setupStyle || null,
                  packageId: date.packageId || null,
                  selectedServices: date.selectedServices?.length ? date.selectedServices : null,
                  pricingModel: selectedPackageData?.pricingModel || "fixed",
                  itemQuantities: date.itemQuantities || {},
                  pricingOverrides: date.pricingOverrides || null,
                  serviceTaxOverrides: date.serviceTaxOverrides || null,
                  totalAmount: datePrice.toString(),
                  notes: `Package: ${selectedPackageData?.name || 'None'}, Services: ${date.selectedServices?.length || 0} selected`,
                  proposalStatus: 'sent',
                  proposalSentAt: new Date().toISOString()
                };
              });

              console.log('Creating contract with proposalId:', proposalId);
              createContract.mutate({ contractData, bookingsData });
            }
            
            // Close both modals and refresh data
            setShowProposalEmail(false);
            onOpenChange(false);
            // Reset form state
            setEventName("");
            setSelectedCustomer("");
            setSelectedDates([]);
            setSelectedVenue("");
            setCurrentStep(1);
            setActiveTabIndex(0);
          }}
        />
      )}

      {/* Manage Employees Modal */}
      <Dialog open={showManageEmployees} onOpenChange={setShowManageEmployees}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Employees</DialogTitle>
            <DialogDescription>
              Add a new employee for {getCompanyById(selectedCompanyId)?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label className="text-sm flex items-center gap-1">
                  Employee Name
                  <span className="text-red-500 text-xs">*</span>
                </Label>
                <Input
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer(prev => ({...prev, name: e.target.value}))}
                  placeholder="Employee full name"
                  className={cn("mt-1", !newCustomer.name.trim() && "border-red-200 bg-red-50/30")}
                  data-testid="input-manage-employee-name"
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
                  placeholder="employee@company.com"
                  className={cn("mt-1", !newCustomer.email.trim() && "border-red-200 bg-red-50/30")}
                  data-testid="input-manage-employee-email"
                />
              </div>
              <div>
                <Label className="text-sm">Phone</Label>
                <Input
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer(prev => ({...prev, phone: e.target.value}))}
                  placeholder="(555) 123-4567"
                  className="mt-1"
                  data-testid="input-manage-employee-phone"
                />
              </div>
              <div>
                <Label className="text-sm">Job Title</Label>
                <Input
                  value={newCustomer.jobTitle}
                  onChange={(e) => setNewCustomer(prev => ({...prev, jobTitle: e.target.value}))}
                  placeholder="e.g., Event Manager"
                  className="mt-1"
                  data-testid="input-manage-employee-job-title"
                />
              </div>
              <div>
                <Label className="text-sm">Department</Label>
                <Input
                  value={newCustomer.department}
                  onChange={(e) => setNewCustomer(prev => ({...prev, department: e.target.value}))}
                  placeholder="e.g., Marketing"
                  className="mt-1"
                  data-testid="input-manage-employee-department"
                />
              </div>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => {
                  if (!newCustomer.name || !newCustomer.email) {
                    toast({
                      title: "Required fields missing",
                      description: "Please provide employee name and email",
                      variant: "destructive"
                    });
                    return;
                  }
                  
                  const customerData = {
                    name: newCustomer.name,
                    email: newCustomer.email,
                    phone: newCustomer.phone,
                    customerType: "business",
                    companyId: selectedCompanyId,
                    jobTitle: newCustomer.jobTitle,
                    department: newCustomer.department
                  };
                  
                  createCustomer.mutate(customerData);
                }}
                disabled={createCustomer.isPending || !newCustomer.name || !newCustomer.email}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                data-testid="button-add-employee"
              >
                {createCustomer.isPending ? "Adding..." : "Add Employee"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowManageEmployees(false);
                  setNewCustomer({ 
                    name: "", 
                    email: "", 
                    phone: "", 
                    company: "",
                    customerType: "individual",
                    companyId: "",
                    jobTitle: "",
                    department: ""
                  });
                }}
                data-testid="button-cancel-manage-employee"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}