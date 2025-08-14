import { useState, useEffect, useMemo } from "react";
import { X, Calendar, Clock, Users, Package, Plus, Copy, Check, Trash2, PlusCircle, Building, CheckCircle, RefreshCw } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface EventSlot {
  venue: any;
  space: any;
  startTime: Date;
  endTime: Date;
}

interface SlotConfiguration {
  packageId: string;
  addOns: string[]; // Service IDs
  guests: number;
  pricingModel: 'fixed' | 'per_person';
  itemQuantities: Record<string, number>; // For services that need quantities
}

interface EventDetails {
  eventName: string;
  customerId: string;
  eventStatus: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSlots?: EventSlot[];
  initialBookings?: any[];
}

const generateSlotId = (slot: EventSlot) => 
  slot?.space?.id && slot.startTime 
    ? `${slot.space.id}@${slot.startTime.toISOString()}` 
    : null;

const calculatePriceForSlot = (
  config: SlotConfiguration, 
  packages: any[], 
  services: any[]
) => {
  let total = 0;
  
  // Package price
  const pkg = packages.find(p => p.id === config.packageId);
  if (pkg) {
    const packagePrice = parseFloat(pkg.price || 0);
    total += config.pricingModel === 'per_person' 
      ? packagePrice * config.guests 
      : packagePrice;
  }
  
  // Add-on services price
  config.addOns.forEach(serviceId => {
    const service = services.find(s => s.id === serviceId);
    if (service && !pkg?.includedServiceIds?.includes(serviceId)) {
      const servicePrice = parseFloat(service.price || 0);
      const quantity = config.itemQuantities[serviceId] || 1;
      
      if (service.pricingModel === 'per_person') {
        total += servicePrice * config.guests;
      } else {
        total += servicePrice * quantity;
      }
    }
  });
  
  return total;
};

const EventSlotGenerator = ({ onSlotsGenerated }: { onSlotsGenerated: (slots: EventSlot[]) => void }) => {
  const { data: venues = [] } = useQuery({ queryKey: ["/api/venues"] });
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [slotConfigs, setSlotConfigs] = useState<any[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState('');
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  
  const selectedVenue = useMemo(() => venues.find((v: any) => v.id === selectedVenueId), [venues, selectedVenueId]);

  useEffect(() => {
    setSlotConfigs(selectedDates.map(date => ({
      date,
      spaceId: selectedVenue?.spaces?.[0]?.id || '',
      startTime: '09:00',
      endTime: '17:00'
    })));
  }, [selectedDates, selectedVenue]);

  const handleDateClick = (day: Date) => {
    const dayString = day.toISOString().split('T')[0];
    setSelectedDates(prev => 
      prev.includes(dayString) 
        ? prev.filter(d => d !== dayString) 
        : [...prev, dayString].sort()
    );
  };

  const handleConfigChange = (index: number, field: string, value: string) => {
    setSlotConfigs(prev => prev.map((config, i) => 
      i === index ? { ...config, [field]: value } : config
    ));
  };

  const handleGenerate = () => {
    const slots: EventSlot[] = slotConfigs.map(config => {
      const venue = selectedVenue;
      const space = venue?.spaces?.find((s: any) => s.id === config.spaceId);
      const date = new Date(config.date + 'T00:00:00Z');
      
      const [startHour, startMinute] = config.startTime.split(':').map(Number);
      const [endHour, endMinute] = config.endTime.split(':').map(Number);
      
      const startTime = new Date(date);
      startTime.setUTCHours(startHour, startMinute, 0, 0);
      
      const endTime = new Date(date);
      endTime.setUTCHours(endHour, endMinute, 0, 0);

      return { venue, space, startTime, endTime };
    }).filter(slot => slot.venue && slot.space);

    onSlotsGenerated(slots);
  };

  // Generate calendar days for current month
  const monthStart = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), 1);
  const monthEnd = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 0);
  const startDate = new Date(monthStart);
  startDate.setDate(startDate.getDate() - monthStart.getDay());
  
  const days = [];
  const current = new Date(startDate);
  while (current <= monthEnd || current.getDay() !== 0) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return (
    <div className="flex-grow flex overflow-hidden">
      <div className="w-1/2 p-4 border-r">
        <h3 className="font-semibold mb-4">Select Dates</h3>
        
        <div className="mb-4">
          <Label>Venue</Label>
          <Select value={selectedVenueId} onValueChange={setSelectedVenueId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a venue" />
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

        {/* Calendar */}
        <div className="bg-white border rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonthDate(new Date(currentMonthDate.setMonth(currentMonthDate.getMonth() - 1)))}
            >
              ‹
            </Button>
            <h4 className="font-medium">
              {currentMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonthDate(new Date(currentMonthDate.setMonth(currentMonthDate.getMonth() + 1)))}
            >
              ›
            </Button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="py-2">{day}</div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, i) => {
              const dayString = day.toISOString().split('T')[0];
              const isCurrentMonth = day.getMonth() === currentMonthDate.getMonth();
              const isSelected = selectedDates.includes(dayString);
              const isPast = day < new Date();
              
              return (
                <button
                  key={i}
                  onClick={() => !isPast && isCurrentMonth && handleDateClick(day)}
                  disabled={isPast || !isCurrentMonth}
                  className={`
                    h-8 text-sm rounded transition-colors
                    ${isCurrentMonth ? 'text-gray-900' : 'text-gray-300'}
                    ${isPast ? 'bg-gray-100 cursor-not-allowed' : 'hover:bg-gray-100'}
                    ${isSelected ? 'bg-indigo-600 text-white hover:bg-indigo-700' : ''}
                  `}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="w-1/2 p-4">
        <h3 className="font-semibold mb-4">Configure Selected Dates</h3>
        
        {slotConfigs.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Select dates from the calendar</p>
        ) : (
          <>
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {slotConfigs.map((config, index) => (
                <div key={config.date} className="p-3 border rounded-lg">
                  <div className="font-medium text-sm mb-2">
                    {new Date(config.date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <Label className="text-xs">Space</Label>
                      <Select
                        value={config.spaceId}
                        onValueChange={(value) => handleConfigChange(index, 'spaceId', value)}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedVenue?.spaces?.map((space: any) => (
                            <SelectItem key={space.id} value={space.id}>
                              {space.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Start</Label>
                        <Input
                          type="time"
                          value={config.startTime}
                          onChange={(e) => handleConfigChange(index, 'startTime', e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">End</Label>
                        <Input
                          type="time"
                          value={config.endTime}
                          onChange={(e) => handleConfigChange(index, 'endTime', e.target.value)}
                          className="h-8"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <Button 
              onClick={handleGenerate}
              className="w-full mt-4"
              disabled={!selectedVenueId || slotConfigs.some(c => !c.spaceId)}
            >
              Generate {slotConfigs.length} Slot{slotConfigs.length !== 1 ? 's' : ''}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default function SlotBasedEventModal({ 
  open, 
  onOpenChange, 
  initialSlots = [], 
  initialBookings 
}: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Data queries first
  const { data: venues = [] } = useQuery({ queryKey: ["/api/venues"] });
  const { data: customers = [] } = useQuery({ queryKey: ["/api/customers"] });
  const { data: packages = [] } = useQuery({ queryKey: ["/api/packages"] });
  const { data: services = [] } = useQuery({ queryKey: ["/api/services"] });

  // State management following the exact structure from your previous app
  const [generatedSlots, setGeneratedSlots] = useState<EventSlot[]>([]);
  const isEditMode = !!initialBookings;
  const [isAddingSlots, setIsAddingSlots] = useState(!isEditMode && (!initialSlots || initialSlots.length === 0));
  const [isAddingService, setIsAddingService] = useState(false);

  const wizardSlots = useMemo(() => {
    const slotsFromInitial = initialSlots || [];
    const slotsFromBookings = (initialBookings || []).map((b: any) => ({ 
      ...b, 
      venue: venues.find((v: any) => v.id === b.venueId), 
      space: venues.find((v: any) => v.id === b.venueId)?.spaces?.find((s: any) => s.id === b.spaceId) 
    }));
    const allSlots = isEditMode ? [...slotsFromBookings, ...generatedSlots] : [...slotsFromInitial, ...generatedSlots];
    return allSlots.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [initialSlots, initialBookings, generatedSlots, venues, isEditMode]);

  const [step, setStep] = useState(1);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [configurations, setConfigurations] = useState<Record<string, SlotConfiguration>>({});
  const [pricingOverrides, setPricingOverrides] = useState<Record<string, any>>({});
  const [eventDetails, setEventDetails] = useState<EventDetails>(() => 
    isEditMode && wizardSlots.length > 0 
      ? { 
          eventName: wizardSlots[0].eventName, 
          customerId: wizardSlots[0].customerId, 
          eventStatus: wizardSlots[0].eventStatus 
        } 
      : { 
          eventName: '', 
          customerId: '', 
          eventStatus: 'Inquiry' 
        }
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCloning, setIsCloning] = useState(false);

  // Initialize pricing overrides for edit mode
  useEffect(() => {
    if (isEditMode && initialBookings) {
      const initialOverrides: Record<string, any> = {};
      initialBookings.forEach((b: any) => {
        if (b.pricingOverrides) {
          const slotId = generateSlotId(b);
          if (slotId) {
            initialOverrides[slotId] = b.pricingOverrides;
          }
        }
      });
      setPricingOverrides(initialOverrides);
    }
  }, [isEditMode, initialBookings]);

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      const response = await apiRequest("POST", "/api/bookings", bookingData);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({ title: "Event created successfully!" });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create event",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Initialize configurations when slots change - exactly like your previous app
  useEffect(() => {
    if (wizardSlots.length > 0) {
      setActiveTabId(prev => {
        const prevSlotExists = wizardSlots.some(s => generateSlotId(s) === prev);
        return prevSlotExists ? prev : generateSlotId(wizardSlots[0]);
      });
      
      setConfigurations(prevConfigs => {
        const newConfigs = { ...prevConfigs };
        wizardSlots.forEach(slot => {
          const slotId = generateSlotId(slot);
          if (slotId && !newConfigs[slotId]) {
            const booking = isEditMode ? initialBookings?.find((b: any) => generateSlotId(b) === slotId) : null;
            const pkg = packages.find((p: any) => p.id === booking?.packageId);
            newConfigs[slotId] = { 
              packageId: booking?.packageId || '', 
              addOns: booking?.addOns || [], 
              itemQuantities: booking?.itemQuantities || {}, 
              guests: booking?.guests || 1,
              pricingModel: booking?.pricingModel || pkg?.pricingModel || 'fixed'
            };
          }
        });
        return newConfigs;
      });
    }
  }, [wizardSlots, isEditMode, initialBookings, packages]);

  const handleAddSlot = () => {
    if (!newSlot.venueId || !newSlot.date || !newSlot.startTime || !newSlot.endTime) {
      toast({
        title: "Missing information",
        description: "Please fill in all slot details",
        variant: "destructive",
      });
      return;
    }

    const venue = venues.find(v => v.id === newSlot.venueId);
    const slot: EventSlot = {
      id: `${newSlot.venueId}-${newSlot.date}-${newSlot.startTime}`,
      venueId: newSlot.venueId,
      venueName: venue?.name || "",
      date: new Date(newSlot.date),
      startTime: newSlot.startTime,
      endTime: newSlot.endTime,
    };

    setSlots(prev => [...prev, slot]);
    setNewSlot({ venueId: "", date: "", startTime: "", endTime: "" });
    setIsAddingSlot(false);
  };

  const handleRemoveSlot = (slotId: string) => {
    setSlots(prev => prev.filter(s => s.id !== slotId));
    setConfigurations(prev => {
      const newConfigs = { ...prev };
      delete newConfigs[slotId];
      return newConfigs;
    });
    if (activeSlotId === slotId) {
      setActiveSlotId(slots.filter(s => s.id !== slotId)[0]?.id || "");
    }
  };

  const updateSlotConfig = (slotId: string, updates: Partial<SlotConfiguration>) => {
    setConfigurations(prev => ({
      ...prev,
      [slotId]: { ...prev[slotId], ...updates }
    }));
  };

  const handleSelectPackage = (slotId: string, packageId: string) => {
    const pkg = packages.find(p => p.id === packageId);
    updateSlotConfig(slotId, {
      packageId,
      addOns: pkg ? [...(pkg.includedServiceIds || [])] : [],
      pricingModel: pkg?.pricingModel || 'fixed'
    });
  };

  const handleToggleAddOn = (slotId: string, serviceId: string) => {
    const currentConfig = configurations[slotId];
    const isAdded = currentConfig.addOns.includes(serviceId);
    updateSlotConfig(slotId, {
      addOns: isAdded 
        ? currentConfig.addOns.filter(id => id !== serviceId)
        : [...currentConfig.addOns, serviceId]
    });
  };

  const handleCopyConfiguration = (sourceSlotId: string, targetSlotIds: string[]) => {
    const sourceConfig = configurations[sourceSlotId];
    const newConfigs = { ...configurations };
    targetSlotIds.forEach(targetId => {
      newConfigs[targetId] = { ...sourceConfig };
    });
    setConfigurations(newConfigs);
  };

  const handleSubmit = async () => {
    const eventDetails = form.getValues();
    
    try {
      // Create a booking for each slot
      const bookingPromises = slots.map(slot => {
        const config = configurations[slot.id];
        const totalCost = calculatePriceForSlot(config, packages, services);
        
        return createBookingMutation.mutateAsync({
          eventName: eventDetails.eventName,
          eventType: eventDetails.eventType,
          description: eventDetails.description,
          customerId: eventDetails.customerId || null,
          venueId: slot.venueId,
          eventDate: slot.date.toISOString(),
          startTime: slot.startTime,
          endTime: slot.endTime,
          guestCount: config.guests,
          status: "confirmed",
          totalAmount: totalCost.toFixed(2),
          packageId: config.packageId || null,
          selectedServices: config.addOns,
          pricingModel: config.pricingModel,
        });
      });

      await Promise.all(bookingPromises);
    } catch (error) {
      console.error('Failed to create bookings:', error);
    }
  };

  const totalCost = useMemo(() => {
    return slots.reduce((total, slot) => {
      const config = configurations[slot.id];
      if (config) {
        return total + calculatePriceForSlot(config, packages, services);
      }
      return total;
    }, 0);
  }, [slots, configurations, packages, services]);

  const activeSlot = slots.find(s => s.id === activeSlotId);
  const activeConfig = activeSlotId ? configurations[activeSlotId] : null;

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold">Create Event</h2>
          <button onClick={() => onOpenChange(false)} className="p-1 rounded-full hover:bg-gray-200">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex border-b">
          {[
            { step: 1, title: "Event Details" },
            { step: 2, title: "Date & Time Slots" },
            { step: 3, title: "Configure Packages" }
          ].map(({ step, title }) => (
            <button
              key={step}
              onClick={() => setCurrentStep(step)}
              className={`px-6 py-3 font-semibold ${
                currentStep === step 
                  ? 'border-b-2 border-indigo-500 text-indigo-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {title}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-grow flex overflow-hidden">
          {currentStep === 1 && (
            <div className="w-full p-6 overflow-y-auto">
              <div className="max-w-2xl space-y-4">
                <div>
                  <Label htmlFor="eventName">Event Name *</Label>
                  <Input
                    id="eventName"
                    {...form.register("eventName")}
                    placeholder="Wedding Reception, Corporate Meeting, etc."
                  />
                  {form.formState.errors.eventName && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.eventName.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="eventType">Event Type *</Label>
                  <Select onValueChange={(value) => form.setValue("eventType", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wedding">Wedding</SelectItem>
                      <SelectItem value="corporate">Corporate Event</SelectItem>
                      <SelectItem value="birthday">Birthday Party</SelectItem>
                      <SelectItem value="anniversary">Anniversary</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="conference">Conference</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.eventType && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.eventType.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="customerId">Customer (Optional)</Label>
                  <Select onValueChange={(value) => form.setValue("customerId", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a customer" />
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

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...form.register("description")}
                    placeholder="Additional details about the event..."
                    rows={3}
                  />
                </div>

                <Button 
                  onClick={() => setCurrentStep(2)}
                  className="w-full"
                  disabled={!form.watch("eventName") || !form.watch("eventType")}
                >
                  Continue to Date & Time Slots
                </Button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="w-full flex">
              {/* Slots list */}
              <div className="w-1/3 border-r p-4 overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">Event Slots</h3>
                  <Button
                    size="sm"
                    onClick={() => setIsAddingSlot(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Slot
                  </Button>
                </div>

                <div className="space-y-2">
                  {slots.map((slot) => (
                    <div
                      key={slot.id}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                      onClick={() => setActiveSlotId(slot.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{slot.venueName}</p>
                          <p className="text-sm text-gray-600">
                            {slot.date.toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            {slot.startTime} - {slot.endTime}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveSlot(slot.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {slots.length > 0 && (
                  <Button 
                    onClick={() => setCurrentStep(3)}
                    className="w-full mt-4"
                  >
                    Configure Packages & Services
                  </Button>
                )}
              </div>

              {/* Add slot form */}
              <div className="w-2/3 p-6">
                {isAddingSlot ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Add New Slot</h3>
                    
                    <div>
                      <Label>Venue</Label>
                      <Select
                        value={newSlot.venueId}
                        onValueChange={(value) => setNewSlot(prev => ({ ...prev, venueId: value }))}
                      >
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
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={newSlot.date}
                        onChange={(e) => setNewSlot(prev => ({ ...prev, date: e.target.value }))}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Start Time</Label>
                        <Input
                          type="time"
                          value={newSlot.startTime}
                          onChange={(e) => setNewSlot(prev => ({ ...prev, startTime: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label>End Time</Label>
                        <Input
                          type="time"
                          value={newSlot.endTime}
                          onChange={(e) => setNewSlot(prev => ({ ...prev, endTime: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={handleAddSlot}>Add Slot</Button>
                      <Button variant="outline" onClick={() => setIsAddingSlot(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <Calendar className="w-12 h-12 mx-auto mb-4" />
                      <p>Click "Add Slot" to create your first event slot</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 3 && activeSlot && activeConfig && (
            <div className="w-full flex">
              {/* Slots sidebar */}
              <div className="w-1/4 border-r p-4 overflow-y-auto">
                <h3 className="font-semibold mb-4">Event Slots</h3>
                <div className="space-y-2">
                  {slots.map((slot) => (
                    <div
                      key={slot.id}
                      onClick={() => setActiveSlotId(slot.id)}
                      className={`p-3 border rounded-lg cursor-pointer ${
                        activeSlotId === slot.id ? 'bg-indigo-50 border-indigo-300' : 'hover:bg-gray-50'
                      }`}
                    >
                      <p className="font-medium text-sm">{slot.venueName}</p>
                      <p className="text-xs text-gray-600">
                        {slot.date.toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-600">
                        {slot.startTime} - {slot.endTime}
                      </p>
                    </div>
                  ))}
                </div>

                {slots.length > 1 && (
                  <Card className="mt-4">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Copy Configuration</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const otherSlotIds = slots.filter(s => s.id !== activeSlotId).map(s => s.id);
                          handleCopyConfiguration(activeSlotId, otherSlotIds);
                          toast({ title: "Configuration copied to all other slots" });
                        }}
                        className="w-full flex items-center gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        Copy to All
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Configuration panel */}
              <div className="w-3/4 p-6 overflow-y-auto">
                <div className="space-y-6">
                  {/* Guest count */}
                  <div>
                    <Label>Number of Guests</Label>
                    <Input
                      type="number"
                      min="1"
                      value={activeConfig.guests}
                      onChange={(e) => updateSlotConfig(activeSlotId, { 
                        guests: parseInt(e.target.value, 10) || 1 
                      })}
                      className="w-32"
                    />
                  </div>

                  {/* Package selection */}
                  <div>
                    <Label>Package</Label>
                    <Select
                      value={activeConfig.packageId}
                      onValueChange={(value) => handleSelectPackage(activeSlotId, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select package (or choose A La Carte)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">A La Carte</SelectItem>
                        {packages.map((pkg: any) => (
                          <SelectItem key={pkg.id} value={pkg.id}>
                            {pkg.name} - ${pkg.price}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {activeConfig.packageId && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-4 text-sm">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={`pricing-${activeSlotId}`}
                              checked={activeConfig.pricingModel === 'fixed'}
                              onChange={() => updateSlotConfig(activeSlotId, { pricingModel: 'fixed' })}
                              className="mr-2"
                            />
                            Flat Fee
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={`pricing-${activeSlotId}`}
                              checked={activeConfig.pricingModel === 'per_person'}
                              onChange={() => updateSlotConfig(activeSlotId, { pricingModel: 'per_person' })}
                              className="mr-2"
                            />
                            Per Person
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Services */}
                  <div>
                    <Label>Additional Services</Label>
                    <div className="grid grid-cols-1 gap-3 mt-2">
                      {services.map((service: any) => {
                        const selectedPackage = packages.find(p => p.id === activeConfig.packageId);
                        const isIncluded = selectedPackage?.includedServiceIds?.includes(service.id);
                        const isSelected = activeConfig.addOns.includes(service.id);

                        return (
                          <div
                            key={service.id}
                            className={`p-3 border rounded-lg ${
                              isIncluded ? 'bg-gray-100 text-gray-500' : 
                              isSelected ? 'bg-indigo-50 border-indigo-300' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  checked={isSelected}
                                  disabled={isIncluded}
                                  onCheckedChange={() => handleToggleAddOn(activeSlotId, service.id)}
                                />
                                <div>
                                  <p className="font-medium">
                                    {service.name} {isIncluded && "(Included)"}
                                  </p>
                                  <p className="text-sm text-gray-600">{service.description}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">
                                  ${service.price} {service.pricingModel === 'per_person' ? '/person' : ''}
                                </p>
                                {isSelected && !isIncluded && service.pricingModel === 'fixed' && (
                                  <Input
                                    type="number"
                                    min="1"
                                    value={activeConfig.itemQuantities[service.id] || 1}
                                    onChange={(e) => updateSlotConfig(activeSlotId, {
                                      itemQuantities: {
                                        ...activeConfig.itemQuantities,
                                        [service.id]: parseInt(e.target.value, 10) || 1
                                      }
                                    })}
                                    className="w-20 mt-1"
                                    placeholder="Qty"
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
          <div className="text-lg font-semibold">
            Total: ${totalCost.toFixed(2)}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {currentStep === 3 && slots.length > 0 && (
              <Button 
                onClick={handleSubmit}
                disabled={createBookingMutation.isPending}
              >
                {createBookingMutation.isPending ? "Creating..." : "Create Event"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}