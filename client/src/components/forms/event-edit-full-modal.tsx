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
import { ChevronLeft, ChevronRight, X, Plus, RotateCcw, Trash2, Save, Edit, Minus, FileText, Send, MessageSquare, Mail, Phone, Users, Grid3X3, MapPin, Calendar as CalendarIcon } from "lucide-react";
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

  // Customer information
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    eventName: "",
    eventType: "corporate",
    notes: ""
  });

  // Proposal generation settings
  const [showProposalSettings, setShowProposalSettings] = useState(false);
  const [proposalTitle, setProposalTitle] = useState("");
  const [proposalDescription, setProposalDescription] = useState("");

  // Tax/Fee override settings
  const [taxFeeOverrides, setTaxFeeOverrides] = useState({
    enabledTaxIds: [],
    enabledFeeIds: []
  });

  // Data queries
  const { data: venues = [] } = useQuery({ queryKey: ["/api/venues-with-spaces"] });
  const { data: packages = [] } = useQuery({ queryKey: ["/api/packages"] });
  const { data: services = [] } = useQuery({ queryKey: ["/api/services"] });
  const { data: customers = [] } = useQuery({ queryKey: ["/api/customers"] });
  const { data: taxSettings = [] } = useQuery({ queryKey: ["/api/tax-settings"] });

  // Memoized price calculation that updates when tax/fee overrides change
  const calculateDatePrice = useMemo(() => {
    return (dateConfig: SelectedDate) => {
      let subtotal = 0;
      const feeBreakdown: Array<{name: string, amount: number, description: string}> = [];
      const taxBreakdown: Array<{name: string, amount: number, description: string}> = [];
      
      // Package calculation
      const selectedPackageData = dateConfig.packageId ? (packages as any[]).find((p: any) => p.id === dateConfig.packageId) : null;
      if (selectedPackageData) {
        const packagePrice = dateConfig.pricingOverrides?.packagePrice ?? parseFloat(selectedPackageData.price || 0);
        let packageSubtotal = 0;
        
        if (selectedPackageData.pricingModel === 'per_person') {
          packageSubtotal = packagePrice * (dateConfig.guestCount || 1);
        } else {
          packageSubtotal = packagePrice;
        }
        
        subtotal += packageSubtotal;
        
        // Get effective fee and tax IDs for package
        const currentOverrides = dateConfig.serviceTaxOverrides?.[selectedPackageData.id] || { enabledTaxIds: [], enabledFeeIds: [], disabledInheritedTaxIds: [], disabledInheritedFeeIds: [] };
        
        // Calculate effective fee IDs (inherited + additional - disabled)
        const inheritedFeeIds = selectedPackageData.enabledFeeIds || [];
        const additionalFeeIds = currentOverrides.enabledFeeIds || [];
        const disabledFeeIds = currentOverrides.disabledInheritedFeeIds || [];
        const effectiveFeeIds = [...inheritedFeeIds.filter((id: string) => !disabledFeeIds.includes(id)), ...additionalFeeIds];
        
        // Apply package fees
        effectiveFeeIds.forEach((feeId: string) => {
          const fee = ((taxSettings as any[]) || [])?.find(f => f.id === feeId);
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
          const effectiveFeeIds = [...inheritedFeeIds.filter((id: string) => !disabledFeeIds.includes(id)), ...additionalFeeIds];
          
          // Apply service fees
          effectiveFeeIds.forEach((feeId: string) => {
            const fee = ((taxSettings as any[]) || [])?.find(f => f.id === feeId);
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
          const feeData = ((taxSettings as any[]) || [])?.find(f => f.name === baseName);
          return feeData?.isTaxable;
        })
        .reduce((sum, fee) => sum + fee.amount, 0);

      const taxableBase = subtotal + taxableFees;

      // Apply taxes from all packages and services
      const allTaxIds = new Set<string>();
      
      // Collect tax IDs from package
      if (selectedPackageData) {
        const currentOverrides = dateConfig.serviceTaxOverrides?.[selectedPackageData.id] || { enabledTaxIds: [], enabledFeeIds: [], disabledInheritedTaxIds: [], disabledInheritedFeeIds: [] };
        const inheritedTaxIds = selectedPackageData.enabledTaxIds || [];
        const additionalTaxIds = currentOverrides.enabledTaxIds || [];
        const disabledTaxIds = currentOverrides.disabledInheritedTaxIds || [];
        const effectiveTaxIds = [...inheritedTaxIds.filter((id: string) => !disabledTaxIds.includes(id)), ...additionalTaxIds];
        effectiveTaxIds.forEach(id => allTaxIds.add(id));
      }
      
      // Collect tax IDs from services
      dateConfig.selectedServices?.forEach(serviceId => {
        const service = (services as any[]).find((s: any) => s.id === serviceId);
        if (service) {
          const currentOverrides = dateConfig.serviceTaxOverrides?.[serviceId] || { enabledTaxIds: [], enabledFeeIds: [], disabledInheritedTaxIds: [], disabledInheritedFeeIds: [] };
          const inheritedTaxIds = service.enabledTaxIds || [];
          const additionalTaxIds = currentOverrides.enabledTaxIds || [];
          const disabledTaxIds = currentOverrides.disabledInheritedTaxIds || [];
          const effectiveTaxIds = [...inheritedTaxIds.filter((id: string) => !disabledTaxIds.includes(id)), ...additionalTaxIds];
          effectiveTaxIds.forEach(id => allTaxIds.add(id));
        }
      });

      // Calculate taxes
      Array.from(allTaxIds).forEach(taxId => {
        const tax = ((taxSettings as any[]) || [])?.find(t => t.id === taxId);
        if (tax && tax.isActive) {
          const taxAmount = (taxableBase * parseFloat(tax.value)) / 100;
          taxBreakdown.push({
            name: tax.name,
            amount: taxAmount,
            description: `${tax.value}% of taxable base ($${taxableBase.toFixed(2)})`
          });
        }
      });

      const taxesTotal = taxBreakdown.reduce((sum, tax) => sum + tax.amount, 0);
      const grandTotal = subtotal + feesTotal + taxesTotal;
      
      return {
        subtotal,
        feesTotal,
        taxesTotal,
        grandTotal,
        feeBreakdown,
        taxBreakdown
      };
    };
  }, [packages, services, taxSettings]);

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

      // Set customer information
      setCustomerInfo({
        name: booking.customerName || "",
        email: booking.customerEmail || "",
        phone: booking.customerPhone || "",
        company: booking.customerCompany || "",
        eventName: booking.eventName || "",
        eventType: booking.eventType || "corporate",
        notes: booking.notes || ""
      });

      // Set venue
      setSelectedVenue(booking.venueId || "");

      // Convert booking dates to SelectedDate format
      const convertedDates: SelectedDate[] = dateConfigs.map((config: any) => ({
        date: new Date(config.date),
        startTime: config.startTime || "09:00",
        endTime: config.endTime || "17:00",
        spaceId: config.spaceId,
        packageId: config.packageId,
        selectedServices: config.selectedServices || [],
        guestCount: config.guestCount || 50,
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

  // Get active date configuration
  const activeDate = selectedDates[activeTabIndex] || {
    date: new Date(),
    startTime: "09:00",
    endTime: "17:00",
    guestCount: 50,
    setupStyle: "banquet",
    selectedServices: [],
    itemQuantities: {},
    pricingOverrides: {},
    serviceTaxOverrides: {}
  };

  // Get selected venue data
  const selectedVenueData = venues.find((v: any) => v.id === selectedVenue);
  const selectedSpaceData = selectedVenueData?.spaces?.find((s: any) => s.id === activeDate.spaceId);
  const selectedPackageData = activeDate.packageId ? packages.find((p: any) => p.id === activeDate.packageId) : null;

  // Handler functions
  const updateActiveDate = (updates: Partial<SelectedDate>) => {
    setSelectedDates(prev => prev.map((date, index) => 
      index === activeTabIndex ? { ...date, ...updates } : date
    ));
  };

  const handleServiceTaxOverride = (serviceId: string, field: string, value: any) => {
    const currentOverrides = activeDate.serviceTaxOverrides?.[serviceId] || {
      enabledTaxIds: [],
      enabledFeeIds: [],
      disabledInheritedTaxIds: [],
      disabledInheritedFeeIds: []
    };

    const updatedOverrides = {
      ...activeDate.serviceTaxOverrides,
      [serviceId]: {
        ...currentOverrides,
        [field]: value
      }
    };

    updateActiveDate({ serviceTaxOverrides: updatedOverrides });
  };

  const handleUpdate = () => {
    if (selectedDates.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one date for the event",
        variant: "destructive",
      });
      return;
    }

    if (!customerInfo.name || !customerInfo.email) {
      toast({
        title: "Error", 
        description: "Please fill in customer name and email",
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
      guestCount: date.guestCount || 50,
      setupStyle: date.setupStyle || "banquet",
      itemQuantities: date.itemQuantities || {},
      pricingOverrides: date.pricingOverrides || {},
      serviceTaxOverrides: date.serviceTaxOverrides || {}
    }));

    updateBookingMutation.mutate({
      ...customerInfo,
      venueId: selectedVenue,
      dateConfigs: JSON.stringify(dateConfigs),
      status: "confirmed"
    });
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      deleteBookingMutation.mutate();
    }
  };

  const getTotalForAllDates = () => {
    return selectedDates.reduce((total, date) => {
      const priceData = calculateDatePrice(date);
      return total + priceData.grandTotal;
    }, 0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Event - {booking?.eventName}</DialogTitle>
          <DialogDescription>
            Modify event details, dates, and configurations
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Information */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input
                  id="customerName"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter customer name"
                />
              </div>
              <div>
                <Label htmlFor="customerEmail">Email *</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <Label htmlFor="customerPhone">Phone</Label>
                <Input
                  id="customerPhone"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <Label htmlFor="customerCompany">Company</Label>
                <Input
                  id="customerCompany"
                  value={customerInfo.company}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="Enter company name"
                />
              </div>
              <div>
                <Label htmlFor="eventName">Event Name</Label>
                <Input
                  id="eventName"
                  value={customerInfo.eventName}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, eventName: e.target.value }))}
                  placeholder="Enter event name"
                />
              </div>
              <div>
                <Label htmlFor="eventType">Event Type</Label>
                <Select value={customerInfo.eventType} onValueChange={(value) => setCustomerInfo(prev => ({ ...prev, eventType: value }))}>
                  <SelectTrigger>
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
            </div>
          </Card>

          {/* Venue Selection */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Venue Selection</h3>
            <div>
              <Label htmlFor="venue">Select Venue</Label>
              <Select value={selectedVenue} onValueChange={setSelectedVenue}>
                <SelectTrigger>
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
          </Card>

          {/* Date Configuration */}
          {selectedDates.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Event Configuration</h3>
              
              {/* Date tabs */}
              <div className="mb-4">
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
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Configuration */}
                <div className="space-y-6">
                  {/* Basic Event Details */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Event Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Start Time</Label>
                        <Input
                          type="time"
                          value={activeDate.startTime}
                          onChange={(e) => updateActiveDate({ startTime: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>End Time</Label>
                        <Input
                          type="time"
                          value={activeDate.endTime}
                          onChange={(e) => updateActiveDate({ endTime: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Guest Count</Label>
                      <Input
                        type="number"
                        value={activeDate.guestCount || ""}
                        onChange={(e) => updateActiveDate({ guestCount: parseInt(e.target.value) || 0 })}
                        min="1"
                      />
                    </div>
                  </div>

                  {/* Space Selection */}
                  {selectedVenueData?.spaces && (
                    <div>
                      <Label>Select Space</Label>
                      <Select value={activeDate.spaceId || ""} onValueChange={(value) => updateActiveDate({ spaceId: value })}>
                        <SelectTrigger>
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

                  {/* Package Selection */}
                  <div>
                    <Label>Package</Label>
                    <Select value={activeDate.packageId || ""} onValueChange={(value) => updateActiveDate({ packageId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a package" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No Package</SelectItem>
                        {packages.map((pkg: any) => (
                          <SelectItem key={pkg.id} value={pkg.id}>
                            {pkg.name} - ${pkg.price}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Services Selection */}
                  <div>
                    <Label>Additional Services</Label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {services.map((service: any) => {
                        const isSelected = activeDate.selectedServices?.includes(service.id);
                        const currentOverrides = activeDate.serviceTaxOverrides?.[service.id] || {
                          enabledTaxIds: [],
                          enabledFeeIds: [],
                          disabledInheritedTaxIds: [],
                          disabledInheritedFeeIds: []
                        };

                        return (
                          <div key={service.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      updateActiveDate({
                                        selectedServices: [...(activeDate.selectedServices || []), service.id]
                                      });
                                    } else {
                                      updateActiveDate({
                                        selectedServices: (activeDate.selectedServices || []).filter(id => id !== service.id)
                                      });
                                    }
                                  }}
                                />
                                <div>
                                  <span className="font-medium">{service.name}</span>
                                  <p className="text-sm text-slate-600">{service.description}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="font-medium">${service.price}</span>
                                <Badge variant="outline" className="ml-2">
                                  {service.pricingModel === 'per_person' ? 'Per Person' : 'Fixed'}
                                </Badge>
                              </div>
                            </div>

                            {isSelected && (
                              <div className="mt-4 space-y-3 border-t pt-3">
                                {/* Tax/Fee Overrides for this service */}
                                {((taxSettings as any[]) || []).some((t: any) => t.type === 'fee' && t.isActive) && (
                                  <div>
                                    <h6 className="text-sm font-medium mb-2">Fees for {service.name}</h6>
                                    <div className="space-y-1">
                                      {((taxSettings as any[]) || [])
                                        .filter((fee: any) => fee.type === 'fee' && fee.isActive)
                                        .map((fee: any) => {
                                          const isInherited = (service.enabledFeeIds || []).includes(fee.id);
                                          const isAdditionallyEnabled = currentOverrides.enabledFeeIds.includes(fee.id);
                                          const isDisabled = currentOverrides.disabledInheritedFeeIds?.includes(fee.id);
                                          const isEffectivelyEnabled = (isInherited && !isDisabled) || isAdditionallyEnabled;

                                          return (
                                            <div key={fee.id} className="flex items-center justify-between text-sm">
                                              <div className="flex items-center space-x-2">
                                                <Checkbox
                                                  checked={isEffectivelyEnabled}
                                                  onCheckedChange={(checked) => {
                                                    if (isInherited) {
                                                      // If it's inherited, toggle the disabled list
                                                      if (checked) {
                                                        // Remove from disabled list
                                                        const newDisabled = (currentOverrides.disabledInheritedFeeIds || []).filter(id => id !== fee.id);
                                                        handleServiceTaxOverride(service.id, 'disabledInheritedFeeIds', newDisabled);
                                                      } else {
                                                        // Add to disabled list
                                                        const newDisabled = [...(currentOverrides.disabledInheritedFeeIds || []), fee.id];
                                                        handleServiceTaxOverride(service.id, 'disabledInheritedFeeIds', newDisabled);
                                                      }
                                                    } else {
                                                      // If it's not inherited, toggle the enabled list
                                                      if (checked) {
                                                        const newEnabled = [...currentOverrides.enabledFeeIds, fee.id];
                                                        handleServiceTaxOverride(service.id, 'enabledFeeIds', newEnabled);
                                                      } else {
                                                        const newEnabled = currentOverrides.enabledFeeIds.filter(id => id !== fee.id);
                                                        handleServiceTaxOverride(service.id, 'enabledFeeIds', newEnabled);
                                                      }
                                                    }
                                                  }}
                                                />
                                                <span>{fee.name}</span>
                                                {isInherited && (
                                                  <Badge variant="secondary" className="text-xs">Inherited</Badge>
                                                )}
                                              </div>
                                              <span className="text-slate-600">
                                                {fee.calculation === 'percentage' ? `${fee.value}%` : `$${fee.value}`}
                                              </span>
                                            </div>
                                          );
                                        })}
                                    </div>
                                  </div>
                                )}

                                {((taxSettings as any[]) || []).some((t: any) => t.type === 'tax' && t.isActive) && (
                                  <div>
                                    <h6 className="text-sm font-medium mb-2">Taxes for {service.name}</h6>
                                    <div className="space-y-1">
                                      {((taxSettings as any[]) || [])
                                        .filter((tax: any) => tax.type === 'tax' && tax.isActive)
                                        .map((tax: any) => {
                                          const isInherited = (service.enabledTaxIds || []).includes(tax.id);
                                          const isAdditionallyEnabled = currentOverrides.enabledTaxIds.includes(tax.id);
                                          const isDisabled = currentOverrides.disabledInheritedTaxIds?.includes(tax.id);
                                          const isEffectivelyEnabled = (isInherited && !isDisabled) || isAdditionallyEnabled;

                                          return (
                                            <div key={tax.id} className="flex items-center justify-between text-sm">
                                              <div className="flex items-center space-x-2">
                                                <Checkbox
                                                  checked={isEffectivelyEnabled}
                                                  onCheckedChange={(checked) => {
                                                    if (isInherited) {
                                                      // If it's inherited, toggle the disabled list
                                                      if (checked) {
                                                        // Remove from disabled list
                                                        const newDisabled = (currentOverrides.disabledInheritedTaxIds || []).filter(id => id !== tax.id);
                                                        handleServiceTaxOverride(service.id, 'disabledInheritedTaxIds', newDisabled);
                                                      } else {
                                                        // Add to disabled list
                                                        const newDisabled = [...(currentOverrides.disabledInheritedTaxIds || []), tax.id];
                                                        handleServiceTaxOverride(service.id, 'disabledInheritedTaxIds', newDisabled);
                                                      }
                                                    } else {
                                                      // If it's not inherited, toggle the enabled list
                                                      if (checked) {
                                                        const newEnabled = [...currentOverrides.enabledTaxIds, tax.id];
                                                        handleServiceTaxOverride(service.id, 'enabledTaxIds', newEnabled);
                                                      } else {
                                                        const newEnabled = currentOverrides.enabledTaxIds.filter(id => id !== tax.id);
                                                        handleServiceTaxOverride(service.id, 'enabledTaxIds', newEnabled);
                                                      }
                                                    }
                                                  }}
                                                />
                                                <span>{tax.name}</span>
                                                {isInherited && (
                                                  <Badge variant="secondary" className="text-xs">Inherited</Badge>
                                                )}
                                              </div>
                                              <span className="text-slate-600">{tax.value}%</span>
                                            </div>
                                          );
                                        })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right Column - Price Summary */}
                <div className="space-y-6">
                  <Card className="p-4">
                    <h4 className="font-medium mb-3">Price Breakdown</h4>
                    {(() => {
                      const priceData = calculateDatePrice(activeDate);
                      const { subtotal, feesTotal, taxesTotal, grandTotal, feeBreakdown, taxBreakdown } = priceData;

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

                          {/* Fees */}
                          {feeBreakdown.length > 0 && (
                            <div className="space-y-1">
                              {feeBreakdown.map((fee, index) => (
                                <div key={index} className="flex justify-between text-sm text-slate-600">
                                  <span>{fee.name}</span>
                                  <span>${fee.amount.toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Taxes */}
                          {taxBreakdown.length > 0 && (
                            <div className="space-y-1">
                              {taxBreakdown.map((tax, index) => (
                                <div key={index} className="flex justify-between text-sm text-slate-600">
                                  <span>{tax.name}</span>
                                  <span>${tax.amount.toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Grand Total */}
                          <div className="border-t border-slate-200 pt-2">
                            <div className="flex justify-between text-lg font-bold">
                              <span>Total:</span>
                              <span>${grandTotal.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </Card>

                  {/* Multi-date total */}
                  {selectedDates.length > 1 && (
                    <Card className="p-4 bg-blue-50 border-blue-200">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total for All Dates:</span>
                        <span>${getTotalForAllDates().toFixed(2)}</span>
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteBookingMutation.isPending}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Event
            </Button>

            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={updateBookingMutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {updateBookingMutation.isPending ? "Updating..." : "Update Event"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}