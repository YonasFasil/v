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
import { ChevronLeft, ChevronRight, X, Plus, Minus, RotateCcw, Calendar as CalendarIcon, Mic, FileText, Save, Users, Grid3X3, MapPin, Trash2 } from "lucide-react";
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
  const [currentStep, setCurrentStep] = useState(2); // Start at step 2 (configuration) for editing
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
  const [showServiceSelection, setShowServiceSelection] = useState(false);
  const [newService, setNewService] = useState({
    name: "",
    description: "",
    category: "addon",
    price: "",
    pricingModel: "fixed"
  });

  // Customer info and other details
  const [eventName, setEventName] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    company: ""
  });
  const [eventType, setEventType] = useState("corporate");
  const [eventNotes, setEventNotes] = useState("");

  // Data queries
  const { data: venues = [] } = useQuery({ queryKey: ["/api/venues-with-spaces"] });
  const { data: packages = [] } = useQuery({ queryKey: ["/api/packages"] });
  const { data: services = [] } = useQuery({ queryKey: ["/api/services"] });
  const { data: customers = [] } = useQuery({ queryKey: ["/api/customers"] });
  const { data: taxSettings = [] } = useQuery({ queryKey: ["/api/tax-settings"] });

  // Initialize form data when booking changes
  useEffect(() => {
    if (booking && open) {
      // Parse the booking.dateConfigs if it's a string
      let dateConfigs = [];
      try {
        dateConfigs = typeof booking.dateConfigs === 'string' ? JSON.parse(booking.dateConfigs) : booking.dateConfigs || [];
      } catch (error) {
        console.error('Error parsing booking.dateConfigs:', error);
        dateConfigs = [];
      }

      // Set basic info
      setEventName(booking.eventName || "");
      setSelectedCustomer(booking.customerId || "");
      setEventType(booking.eventType || "corporate");
      setEventNotes(booking.notes || "");
      setSelectedVenue(booking.venueId || "");

      // Convert booking dates to SelectedDate format
      const convertedDates: SelectedDate[] = dateConfigs.map((config: any) => ({
        date: new Date(config.date),
        startTime: config.startTime || "09:00 AM",
        endTime: config.endTime || "05:00 PM",
        spaceId: config.spaceId,
        packageId: config.packageId,
        selectedServices: config.selectedServices || [],
        guestCount: config.guestCount || 1,
        setupStyle: config.setupStyle || "banquet",
        itemQuantities: config.itemQuantities || {},
        pricingOverrides: config.pricingOverrides || {},
        serviceTaxOverrides: config.serviceTaxOverrides || {}
      }));

      setSelectedDates(convertedDates);
      
      // Set current date to first booking date if available
      if (convertedDates.length > 0) {
        setCurrentDate(convertedDates[0].date);
      }
    }
  }, [booking, open]);

  // Memoized price calculation
  const calculateDateTotal = (dateConfig: SelectedDate) => {
    if (!dateConfig) return 0;
    
    let subtotal = 0;
    let feesTotal = 0;
    let taxesTotal = 0;
    
    // Package calculation
    if (dateConfig.packageId) {
      const packageData = (packages as any[]).find((p: any) => p.id === dateConfig.packageId);
      if (packageData) {
        const packagePrice = dateConfig.pricingOverrides?.packagePrice ?? parseFloat(packageData.price || 0);
        let packageSubtotal = 0;
        
        if (packageData.pricingModel === 'per_person') {
          packageSubtotal = packagePrice * (dateConfig.guestCount || 1);
        } else {
          packageSubtotal = packagePrice;
        }
        
        subtotal += packageSubtotal;
        
        // Get effective fee and tax IDs for package
        const currentOverrides = dateConfig.serviceTaxOverrides?.[packageData.id] || { enabledTaxIds: [], enabledFeeIds: [], disabledInheritedTaxIds: [], disabledInheritedFeeIds: [] };
        
        // Calculate effective fee IDs (inherited + additional - disabled)
        const inheritedFeeIds = packageData.enabledFeeIds || [];
        const additionalFeeIds = currentOverrides.enabledFeeIds || [];
        const disabledFeeIds = currentOverrides.disabledInheritedFeeIds || [];
        const effectiveFeeIds = [...inheritedFeeIds.filter(id => !disabledFeeIds.includes(id)), ...additionalFeeIds];
        
        // Calculate effective tax IDs (inherited + additional - disabled)
        const inheritedTaxIds = packageData.enabledTaxIds || [];
        const additionalTaxIds = currentOverrides.enabledTaxIds || [];
        const disabledTaxIds = currentOverrides.disabledInheritedTaxIds || [];
        const effectiveTaxIds = [...inheritedTaxIds.filter(id => !disabledTaxIds.includes(id)), ...additionalTaxIds];
        
        // Apply package fees and track them for potential tax application
        let packageFeeAmount = 0;
        effectiveFeeIds.forEach((feeId: string) => {
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
        effectiveTaxIds.forEach((taxId: string) => {
          const taxSetting = (taxSettings as any[])?.find((s: any) => s.id === taxId && s.isActive);
          if (taxSetting) {
            // Tax on base package amount
            let taxableAmount = packageSubtotal;
            
            // Add fees to taxable amount if any applied fees are taxable
            effectiveFeeIds.forEach((feeId: string) => {
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
    }
    
    // Services calculation
    dateConfig.selectedServices?.forEach(serviceId => {
      const service = (services as any[]).find((s: any) => s.id === serviceId);
      if (service) {
        const servicePrice = dateConfig.pricingOverrides?.servicePrices?.[serviceId] ?? parseFloat(service.price || 0);
        let serviceSubtotal = 0;
        
        if (service.pricingModel === 'per_person') {
          serviceSubtotal = servicePrice * (dateConfig.guestCount || 1);
        } else {
          const quantity = dateConfig.itemQuantities?.[serviceId] || 1;
          serviceSubtotal = servicePrice * quantity;
        }
        
        subtotal += serviceSubtotal;
        
        // Get effective fee and tax IDs for service
        const currentOverrides = dateConfig.serviceTaxOverrides?.[serviceId] || { enabledTaxIds: [], enabledFeeIds: [], disabledInheritedTaxIds: [], disabledInheritedFeeIds: [] };
        
        // Calculate effective fee IDs (inherited + additional - disabled)
        const inheritedFeeIds = service.enabledFeeIds || [];
        const additionalFeeIds = currentOverrides.enabledFeeIds || [];
        const disabledFeeIds = currentOverrides.disabledInheritedFeeIds || [];
        const effectiveFeeIds = [...inheritedFeeIds.filter(id => !disabledFeeIds.includes(id)), ...additionalFeeIds];
        
        // Calculate effective tax IDs (inherited + additional - disabled)
        const inheritedTaxIds = service.enabledTaxIds || [];
        const additionalTaxIds = currentOverrides.enabledTaxIds || [];
        const disabledTaxIds = currentOverrides.disabledInheritedTaxIds || [];
        const effectiveTaxIds = [...inheritedTaxIds.filter(id => !disabledTaxIds.includes(id)), ...additionalTaxIds];
        
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
  }, [selectedDates, packages, services, taxSettings]);

  // Get the active date for current tab
  const activeDate = selectedDates[activeTabIndex] || {
    date: new Date(),
    startTime: "09:00 AM", 
    endTime: "05:00 PM",
    guestCount: 1,
    packageId: "",
    selectedServices: [],
    itemQuantities: {},
    pricingOverrides: {},
    serviceTaxOverrides: {}
  };

  const selectedVenueData = (venues as any[]).find((v: any) => v.id === selectedVenue);
  const selectedPackageData = (packages as any[]).find((p: any) => p.id === activeDate?.packageId);

  // Update date configuration helper
  const updateDateConfig = (field: string, value: any) => {
    setSelectedDates(prev => prev.map((date, index) => 
      index === activeTabIndex ? { ...date, [field]: value } : date
    ));
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
      } : {},
      serviceTaxOverrides: activeDate.serviceTaxOverrides ? { ...activeDate.serviceTaxOverrides } : {}
    };

    setSelectedDates(prev => 
      prev.map((date, index) => 
        selectedIndices.includes(index) ? { ...date, ...currentConfig } : date
      )
    );
    
    setShowCopyModal(false);
    setSelectedCopyIndices([]);
    
    toast({
      title: "Configuration Applied",
      description: `Settings copied to ${selectedIndices.length} date(s)`,
    });
  };

  // Mutations
  const updateBookingMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/bookings/${booking.id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({
        title: "Success",
        description: "Event updated successfully",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update event",
        variant: "destructive",
      });
    },
  });

  const deleteBookingMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/bookings/${booking.id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete event",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (selectedDates.length === 0) {
      toast({
        title: "Error",
        description: "Please configure at least one date for the event",
        variant: "destructive",
      });
      return;
    }

    if (!eventName.trim()) {
      toast({
        title: "Error", 
        description: "Please enter an event name",
        variant: "destructive",
      });
      return;
    }

    if (!selectedCustomer && !showNewCustomerForm) {
      toast({
        title: "Error",
        description: "Please select a customer",
        variant: "destructive",
      });
      return;
    }

    const dateConfigs = selectedDates.map(date => ({
      date: date.date.toISOString(),
      startTime: date.startTime,
      endTime: date.endTime,
      spaceId: date.spaceId,
      packageId: date.packageId,
      selectedServices: date.selectedServices || [],
      guestCount: date.guestCount || 1,
      setupStyle: date.setupStyle || "banquet",
      itemQuantities: date.itemQuantities || {},
      pricingOverrides: date.pricingOverrides || {},
      serviceTaxOverrides: date.serviceTaxOverrides || {}
    }));

    updateBookingMutation.mutate({
      eventName,
      customerId: selectedCustomer,
      venueId: selectedVenue,
      eventType,
      notes: eventNotes,
      dateConfigs: JSON.stringify(dateConfigs),
      status: "confirmed"
    });
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      deleteBookingMutation.mutate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header with navigation */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b">
            <div>
              <DialogTitle className="text-xl sm:text-2xl font-bold text-slate-900">
                Edit Event
              </DialogTitle>
              <DialogDescription className="text-slate-600 mt-1">
                {eventName || "Update event details and configuration"}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-200">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-blue-700">
                  Total: ${totalPrice.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Step Content */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full p-3 sm:p-6 overflow-y-auto">
              {/* Event Configuration */}
              <div className="space-y-6">
                {/* Basic Event Details */}
                <Card className="p-4">
                  <h3 className="text-lg font-semibold mb-4">Event Details</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                      <Label className="text-base font-medium">Event Type</Label>
                      <Select value={eventType} onValueChange={setEventType}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="corporate">Corporate</SelectItem>
                          <SelectItem value="wedding">Wedding</SelectItem>
                          <SelectItem value="social">Social</SelectItem>
                          <SelectItem value="nonprofit">Nonprofit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-base font-medium">Venue</Label>
                      <Select value={selectedVenue} onValueChange={setSelectedVenue}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Choose a venue" />
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
                      <Label className="text-base font-medium">Customer</Label>
                      <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Choose a customer" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map((customer: any) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name} - {customer.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </Card>

                {/* Date Configuration */}
                {selectedDates.length > 0 && (
                  <div className="space-y-6">
                    {/* Date Tabs */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Date Configuration ({selectedDates.length})</h3>
                    </div>
                    
                    <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
                      {selectedDates.map((date, index) => (
                        <button
                          key={index}
                          onClick={() => setActiveTabIndex(index)}
                          className={cn(
                            "px-3 py-2 rounded text-sm font-medium transition-colors",
                            activeTabIndex === index
                              ? "bg-white shadow-sm text-slate-900"
                              : "text-slate-600 hover:text-slate-900"
                          )}
                        >
                          {format(date.date, "MMM d")}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Left Column: Configuration */}
                      <div className="space-y-6">
                        {/* Date Configuration */}
                        <Card className="p-4">
                          <h4 className="font-medium mb-4 flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4" />
                            {format(activeDate.date, "EEEE, MMMM d, yyyy")}
                          </h4>
                          
                          <div className="space-y-4">
                            {/* Time and Space */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium">Start Time</Label>
                                <Input
                                  value={activeDate.startTime}
                                  onChange={(e) => updateDateConfig('startTime', e.target.value)}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-sm font-medium">End Time</Label>
                                <Input
                                  value={activeDate.endTime}
                                  onChange={(e) => updateDateConfig('endTime', e.target.value)}
                                  className="mt-1"
                                />
                              </div>
                            </div>

                            <div>
                              <Label className="text-sm font-medium">Guest Count</Label>
                              <Input
                                type="number"
                                min="1"
                                value={activeDate.guestCount || ""}
                                onChange={(e) => updateDateConfig('guestCount', parseInt(e.target.value) || 1)}
                                className="mt-1"
                              />
                            </div>

                            {/* Space Selection */}
                            {selectedVenueData?.spaces && (
                              <div>
                                <Label className="text-sm font-medium">Space</Label>
                                <Select value={activeDate.spaceId || ""} onValueChange={(value) => updateDateConfig('spaceId', value)}>
                                  <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Choose a space" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {selectedVenueData.spaces.map((space: any) => (
                                      <SelectItem key={space.id} value={space.id}>
                                        {space.name} (Capacity: {space.capacity})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>
                        </Card>

                        {/* Package Selection */}
                        <Card className="p-4">
                          <h4 className="font-medium mb-4">Package Selection</h4>
                          
                          <div className="space-y-3">
                            {packages.map((pkg: any) => {
                              const isSelected = activeDate.packageId === pkg.id;
                              const overridePrice = activeDate.pricingOverrides?.packagePrice;
                              const displayPrice = overridePrice ?? parseFloat(pkg.price || 0);
                              const totalPrice = pkg.pricingModel === 'per_person' 
                                ? displayPrice * (activeDate.guestCount || 1)
                                : displayPrice;

                              return (
                                <label
                                  key={pkg.id}
                                  className={cn(
                                    "flex flex-col p-4 border rounded-lg cursor-pointer transition-all hover:border-blue-300",
                                    isSelected ? "border-blue-500 bg-blue-50" : "border-slate-200"
                                  )}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3 flex-1">
                                      <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={(checked) => {
                                          updateDateConfig('packageId', checked ? pkg.id : "");
                                        }}
                                        className="mt-1"
                                      />
                                      <div className="flex-1">
                                        <div className="font-medium">{pkg.name}</div>
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
                                            
                                            {/* Additional taxes/fees for package */}
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
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </Card>

                        {/* Additional Services */}
                        <Card className="p-4">
                          <h4 className="font-medium mb-4">Additional Services</h4>
                          
                          <div className="space-y-3">
                            {services.map((service: any) => {
                              const isSelected = activeDate.selectedServices?.includes(service.id);
                              const overridePrice = activeDate.pricingOverrides?.servicePrices?.[service.id];
                              const displayPrice = overridePrice ?? parseFloat(service.price || 0);
                              const totalPrice = service.pricingModel === 'per_person' 
                                ? displayPrice * (activeDate.guestCount || 1)
                                : displayPrice * (activeDate.itemQuantities?.[service.id] || 1);

                              return (
                                <label
                                  key={service.id}
                                  className={cn(
                                    "flex flex-col p-4 border rounded-lg cursor-pointer transition-all hover:border-blue-300",
                                    isSelected ? "border-blue-500 bg-blue-50" : "border-slate-200"
                                  )}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3 flex-1">
                                      <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            updateDateConfig('selectedServices', [...(activeDate.selectedServices || []), service.id]);
                                          } else {
                                            updateDateConfig('selectedServices', (activeDate.selectedServices || []).filter(id => id !== service.id));
                                          }
                                        }}
                                        className="mt-1"
                                      />
                                      <div className="flex-1">
                                        <div className="font-medium">{service.name}</div>
                                        <div className="text-xs text-slate-600 mt-1">{service.description}</div>
                                        
                                        <div className="flex items-center justify-between mt-2">
                                          <div className="text-sm font-semibold text-green-600">
                                            ${service.pricingModel === 'per_person' 
                                              ? `${displayPrice.toFixed(2)} per person` 
                                              : displayPrice.toFixed(2)}
                                          </div>
                                          
                                          <div className="flex items-center gap-2">
                                            {isSelected && service.pricingModel !== 'per_person' && (
                                              <div className="flex items-center gap-1">
                                                <span className="text-xs">Qty:</span>
                                                <Input
                                                  type="number"
                                                  min="1"
                                                  value={activeDate.itemQuantities?.[service.id] || 1}
                                                  onChange={(e) => {
                                                    e.stopPropagation();
                                                    const newQuantities = {
                                                      ...activeDate.itemQuantities,
                                                      [service.id]: Math.max(1, parseInt(e.target.value, 10) || 1)
                                                    };
                                                    updateDateConfig('itemQuantities', newQuantities);
                                                  }}
                                                  onClick={(e) => e.stopPropagation()}
                                                  className="w-12 h-5 text-xs"
                                                />
                                              </div>
                                            )}
                                            
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
                                                      servicePrices: {
                                                        ...activeDate.pricingOverrides?.servicePrices,
                                                        [service.id]: value
                                                      }
                                                    });
                                                  }}
                                                  onClick={(e) => e.stopPropagation()}
                                                  className="w-20 h-6 text-xs"
                                                  placeholder={service.price}
                                                />
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        
                                        {service.pricingModel === 'per_person' && (
                                          <div className="text-xs text-slate-500 mt-1">
                                            Total: ${totalPrice.toFixed(2)} for {activeDate.guestCount || 1} guests
                                          </div>
                                        )}

                                        {/* Service Taxes & Fees Configuration */}
                                        {isSelected && (
                                          <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                                            <div className="text-xs font-medium text-slate-700">Taxes & Fees for this Service</div>
                                            
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
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </Card>
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

                        {/* Price Summary */}
                        <Card className="p-4">
                          <h5 className="font-medium mb-3">Date Total</h5>
                          <div className="text-2xl font-bold text-green-600">
                            ${calculateDateTotal(activeDate).toFixed(2)}
                          </div>
                          <div className="text-sm text-slate-600 mt-1">
                            For {format(activeDate.date, "MMM d")}
                          </div>
                        </Card>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-t bg-slate-50">
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteBookingMutation.isPending}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Event
            </Button>

            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateBookingMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {updateBookingMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>

        {/* Copy Config Modal */}
        {showCopyModal && (
          <Dialog open={showCopyModal} onOpenChange={setShowCopyModal}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Apply Settings</DialogTitle>
                <DialogDescription>
                  Select which dates to apply the current configuration to
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-3">
                {selectedDates.map((date, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Checkbox
                      checked={selectedCopyIndices.includes(index)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedCopyIndices([...selectedCopyIndices, index]);
                        } else {
                          setSelectedCopyIndices(selectedCopyIndices.filter(i => i !== index));
                        }
                      }}
                      disabled={index === activeTabIndex}
                    />
                    <span className={index === activeTabIndex ? "text-slate-400" : ""}>
                      {format(date.date, "EEEE, MMMM d")}
                      {index === activeTabIndex && " (current)"}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowCopyModal(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => handleCopyConfig(selectedCopyIndices)}
                  disabled={selectedCopyIndices.length === 0}
                >
                  Apply Settings
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}