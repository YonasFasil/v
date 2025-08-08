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
  addOns: string[];
  guests: number;
  pricingModel: 'fixed' | 'per_person';
  itemQuantities: Record<string, number>;
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

const formatDate = (date: Date, options?: Intl.DateTimeFormatOptions) => {
  return date.toLocaleDateString('en-US', options);
};

const formatTime = (date: Date, options?: Intl.DateTimeFormatOptions) => {
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    ...options 
  });
};

const EventSlotGenerator = ({ onSlotsGenerated }: { onSlotsGenerated: (slots: EventSlot[]) => void }) => {
  const { data: venues = [] } = useQuery<any[]>({ queryKey: ["/api/venues-with-spaces"] });
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

export default function BookingWizard({ 
  open, 
  onOpenChange, 
  initialSlots = [], 
  initialBookings 
}: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Data queries first - using venues-with-spaces for proper space-based architecture
  const { data: venues = [] } = useQuery<any[]>({ queryKey: ["/api/venues-with-spaces"] });
  const { data: customers = [] } = useQuery<any[]>({ queryKey: ["/api/customers"] });
  const { data: packages = [] } = useQuery<any[]>({ queryKey: ["/api/packages"] });
  const { data: services = [] } = useQuery<any[]>({ queryKey: ["/api/services"] });

  // State management following the exact structure from your previous app
  const [generatedSlots, setGeneratedSlots] = useState<EventSlot[]>([]);
  const isEditMode = !!initialBookings;
  const [isAddingSlots, setIsAddingSlots] = useState(!isEditMode && (!initialSlots || initialSlots.length === 0));

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
          eventName: wizardSlots[0].eventName || '', 
          customerId: wizardSlots[0].customerId || '', 
          eventStatus: wizardSlots[0].eventStatus || 'Inquiry' 
        } 
      : { 
          eventName: '', 
          customerId: '', 
          eventStatus: 'Inquiry' 
        }
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCloning, setIsCloning] = useState(false);

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

  // Helper functions
  const updateConfig = (slotId: string, newConfig: Partial<SlotConfiguration>) => {
    setConfigurations(prev => ({
      ...prev, 
      [slotId]: { ...prev[slotId], ...newConfig }
    }));
  };

  const handleSelectPackage = (slotId: string, pkgId: string) => {
    const pkg = packages.find((p: any) => p.id === pkgId);
    updateConfig(slotId, { 
      packageId: pkgId, 
      addOns: pkg ? [...(pkg.includedServiceIds || [])] : [], 
      pricingModel: pkg?.pricingModel || 'fixed' 
    });
  };

  const handleToggleAddOn = (slotId: string, serviceId: string) => {
    const currentConfig = configurations[slotId];
    if (!currentConfig) return;
    
    const isAdded = currentConfig.addOns.includes(serviceId);
    updateConfig(slotId, { 
      addOns: isAdded 
        ? currentConfig.addOns.filter(id => id !== serviceId) 
        : [...currentConfig.addOns, serviceId] 
    });
  };

  // Price override handlers matching your previous app
  const handlePriceOverride = (slotId: string, type: 'package' | 'service', id: string, value: string) => {
    const numericValue = value === '' ? null : parseFloat(value);
    if (value !== '' && isNaN(numericValue)) return;

    setPricingOverrides(prev => {
      const newOverrides = JSON.parse(JSON.stringify(prev)); // Deep copy
      if (!newOverrides[slotId]) {
        newOverrides[slotId] = { packagePrice: null, servicePrices: {} };
      }
      if (type === 'package') {
        newOverrides[slotId].packagePrice = numericValue;
      } else if (type === 'service') {
        if (!newOverrides[slotId].servicePrices) {
          newOverrides[slotId].servicePrices = {};
        }
        newOverrides[slotId].servicePrices[id] = numericValue;
      }
      return newOverrides;
    });
  };

  const handleItemQuantityChange = (slotId: string, serviceId: string, quantity: string) => {
    const q = Math.max(1, parseInt(quantity, 10) || 1);
    updateConfig(slotId, { 
      itemQuantities: { 
        ...configurations[slotId]?.itemQuantities, 
        [serviceId]: q 
      } 
    });
  };

  const handleApplyGuestCount = (slotId: string) => {
    const currentConfig = configurations[slotId];
    if (!currentConfig) return;
    
    const newItemQuantities = { ...currentConfig.itemQuantities };
    services.forEach((service: any) => {
      if (service.pricingModel === 'per_person') {
        newItemQuantities[service.id] = currentConfig.guests;
      }
    });
    updateConfig(slotId, { itemQuantities: newItemQuantities });
  };

  const handleApplyClone = (targetSlotIds: string[]) => {
    if (!activeTabId) return;
    
    const sourceConfig = configurations[activeTabId];
    const sourceOverrides = pricingOverrides[activeTabId];
    
    setConfigurations(prev => {
      const newConfigs = { ...prev };
      targetSlotIds.forEach(id => {
        if (newConfigs[id]) {
          newConfigs[id] = { ...sourceConfig };
        }
      });
      return newConfigs;
    });
    
    setPricingOverrides(prev => {
      const newOverrides = { ...prev };
      targetSlotIds.forEach(id => {
        if (newOverrides[id]) {
          newOverrides[id] = { ...sourceOverrides };
        }
      });
      return newOverrides;
    });
    
    setIsCloning(false);
  };

  // Price calculation matching your previous app
  const calculateSlotPrice = (slotId: string) => {
    const config = configurations[slotId];
    const overrides = pricingOverrides[slotId];
    if (!config) return 0;

    let total = 0;

    // Package price
    if (config.packageId) {
      const pkg = packages.find((p: any) => p.id === config.packageId);
      if (pkg) {
        const packagePrice = overrides?.packagePrice ?? pkg.price;
        if (config.pricingModel === 'per_person') {
          total += packagePrice * config.guests;
        } else {
          total += packagePrice;
        }
      }
    }

    // Service prices
    config.addOns.forEach((serviceId: string) => {
      const service = services.find((s: any) => s.id === serviceId);
      if (service) {
        const servicePrice = overrides?.servicePrices?.[serviceId] ?? service.price;
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

  const totalEventPrice = useMemo(() => {
    return wizardSlots.reduce((total, slot) => {
      const slotId = generateSlotId(slot);
      return slotId ? total + calculateSlotPrice(slotId) : total;
    }, 0);
  }, [wizardSlots, configurations, pricingOverrides, packages, services]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Create bookings for all slots
      const bookingsToCreate = wizardSlots.map(slot => {
        const slotId = generateSlotId(slot);
        const config = configurations[slotId!] || { packageId: '', addOns: [], guests: 1, pricingModel: 'fixed', itemQuantities: {} };
        const slotTotal = calculateSlotPrice(slotId!);
        
        return {
          eventName: eventDetails.eventName,
          customerId: eventDetails.customerId || null,
          venueId: slot.venue.id,
          spaceId: slot.space.id,
          eventDate: slot.startTime.toISOString().split('T')[0],
          startTime: slot.startTime.toTimeString().split(' ')[0].slice(0, 5),
          endTime: slot.endTime.toTimeString().split(' ')[0].slice(0, 5),
          guestCount: config.guests,
          packageId: config.packageId || null,
          selectedServices: config.addOns,
          pricingModel: config.pricingModel,
          itemQuantities: config.itemQuantities,
          pricingOverrides: pricingOverrides[slotId!] || null,
          totalAmount: slotTotal.toFixed(2),
          status: eventDetails.eventStatus,
        };
      });

      for (const booking of bookingsToCreate) {
        await apiRequest('POST', '/api/bookings', booking);
      }

      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      toast({
        title: "Success",
        description: `Created ${bookingsToCreate.length} booking${bookingsToCreate.length !== 1 ? 's' : ''} - Total: $${totalEventPrice.toFixed(2)}`,
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create bookings",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeSlot = wizardSlots.find(s => generateSlotId(s) === activeTabId);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            {isEditMode ? 'Edit Event' : 'Create New Event'}
          </h2>
          <button onClick={() => onOpenChange(false)} className="p-1 rounded-full hover:bg-gray-200">
            <X className="w-6 h-6"/>
          </button>
        </div>

        <div className="flex-grow flex overflow-hidden">
          {/* Step 1: Event Details */}
          {step === 1 && (
            <div className="w-full p-6">
              <h3 className="text-lg font-semibold mb-4">Event Details</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="eventName">Event Name</Label>
                  <Input
                    id="eventName"
                    value={eventDetails.eventName}
                    onChange={(e) => setEventDetails(prev => ({ ...prev, eventName: e.target.value }))}
                    placeholder="Enter event name"
                  />
                </div>
                <div>
                  <Label htmlFor="customerId">Customer</Label>
                  <Select 
                    value={eventDetails.customerId} 
                    onValueChange={(value) => setEventDetails(prev => ({ ...prev, customerId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer: any) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button 
                  onClick={() => setStep(2)}
                  disabled={!eventDetails.eventName}
                >
                  Next: Create Slots
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Slot Generation */}
          {step === 2 && isAddingSlots && (
            <EventSlotGenerator 
              onSlotsGenerated={(slots) => {
                setGeneratedSlots(slots);
                setIsAddingSlots(false);
                setStep(3);
              }} 
            />
          )}

          {/* Step 3: Configure Slots */}
          {step === 3 && wizardSlots.length > 0 && (
            <div className="flex-grow flex overflow-hidden">
              {/* Slot List */}
              <div className="w-1/3 border-r overflow-y-auto">
                <div className="p-4 border-b">
                  <h3 className="font-semibold">Event Slots</h3>
                </div>
                {wizardSlots.map(slot => {
                  const slotId = generateSlotId(slot);
                  return (
                    <div 
                      key={slotId} 
                      onClick={() => setActiveTabId(slotId)} 
                      className={`p-4 cursor-pointer border-b ${activeTabId === slotId ? 'bg-indigo-100 border-l-4 border-indigo-500' : 'hover:bg-gray-100'}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{formatDate(slot.startTime, {weekday: 'long'})}</p>
                          <p className="text-sm text-gray-600">{formatDate(slot.startTime)}</p>
                          <p className="text-sm text-gray-600">{slot.space?.name} @ {formatTime(slot.startTime)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Configuration Panel */}
              <div className="flex-grow p-6 overflow-y-auto">
                {activeSlot && configurations[activeTabId!] && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold">
                        Configure {formatDate(activeSlot.startTime, {weekday: 'long', month: 'short', day: 'numeric'})}
                      </h3>
                      {wizardSlots.length > 1 && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setIsCloning(true)}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Config
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                      For {formatDate(activeSlot.startTime, { weekday: 'long' })} in {activeSlot.space?.name}
                    </p>
                    
                    <div className="space-y-6">
                      {/* Guest Count */}
                      <div>
                        <Label htmlFor="guests">Number of Guests</Label>
                        <Input
                          id="guests"
                          type="number"
                          min="1"
                          max={activeSlot.space?.capacity || 1000}
                          value={configurations[activeTabId!]?.guests || 1}
                          onChange={(e) => updateConfig(activeTabId!, { guests: parseInt(e.target.value) || 1 })}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Max capacity: {activeSlot.space?.capacity || 'Unlimited'}
                        </p>
                      </div>

                      {/* Package Selection */}
                      <div>
                        <Label>Package</Label>
                        <Select 
                          value={configurations[activeTabId!]?.packageId || ''} 
                          onValueChange={(value) => handleSelectPackage(activeTabId!, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="A La Carte (No Package)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">A La Carte</SelectItem>
                            {packages.filter((pkg: any) => 
                              !pkg.applicableSpaceIds || pkg.applicableSpaceIds.includes(activeSlot.space?.id)
                            ).map((pkg: any) => (
                              <SelectItem key={pkg.id} value={pkg.id}>
                                {pkg.name} - ${pkg.price}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Package Price Override */}
                        {configurations[activeTabId!]?.packageId && (
                          <div className="mt-2 space-y-2">
                            <div className="flex items-center space-x-2">
                              <Label className="text-xs">Price Override:</Label>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="Leave blank for default"
                                value={pricingOverrides[activeTabId!]?.packagePrice || ''}
                                onChange={(e) => handlePriceOverride(activeTabId!, 'package', configurations[activeTabId!]?.packageId, e.target.value)}
                                className="w-24 h-7 text-xs"
                              />
                            </div>
                            <div className="flex items-center space-x-4 text-xs">
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name={`pricingModel-${activeTabId}`}
                                  value="fixed"
                                  checked={configurations[activeTabId!]?.pricingModel === 'fixed'}
                                  onChange={() => updateConfig(activeTabId!, { pricingModel: 'fixed' })}
                                  className="mr-1"
                                />
                                Flat Fee
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name={`pricingModel-${activeTabId}`}
                                  value="per_person"
                                  checked={configurations[activeTabId!]?.pricingModel === 'per_person'}
                                  onChange={() => updateConfig(activeTabId!, { pricingModel: 'per_person' })}
                                  className="mr-1"
                                />
                                Per Person
                              </label>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Add-on Services */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <Label>Add-on Services</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApplyGuestCount(activeTabId!)}
                          >
                            Apply Guest Count
                          </Button>
                        </div>
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                          {services.map((service: any) => {
                            const isChecked = configurations[activeTabId!]?.addOns?.includes(service.id) || false;
                            const quantity = configurations[activeTabId!]?.itemQuantities?.[service.id] || 1;
                            const overridePrice = pricingOverrides[activeTabId!]?.servicePrices?.[service.id];
                            
                            return (
                              <div key={service.id} className="border rounded p-3">
                                <div className="flex items-start space-x-3">
                                  <Checkbox
                                    id={service.id}
                                    checked={isChecked}
                                    onCheckedChange={() => handleToggleAddOn(activeTabId!, service.id)}
                                  />
                                  <div className="flex-grow">
                                    <Label htmlFor={service.id} className="font-medium">
                                      {service.name}
                                    </Label>
                                    <p className="text-xs text-gray-600 mb-2">
                                      ${service.price} {service.pricingModel === 'per_person' ? '(per person)' : ''}
                                    </p>
                                    
                                    {isChecked && (
                                      <div className="flex items-center space-x-2 text-xs">
                                        {service.pricingModel !== 'per_person' && (
                                          <>
                                            <Label>Qty:</Label>
                                            <Input
                                              type="number"
                                              min="1"
                                              value={quantity}
                                              onChange={(e) => handleItemQuantityChange(activeTabId!, service.id, e.target.value)}
                                              className="w-16 h-6"
                                            />
                                          </>
                                        )}
                                        <Label>Override:</Label>
                                        <Input
                                          type="number"
                                          step="0.01"
                                          placeholder={service.price}
                                          value={overridePrice || ''}
                                          onChange={(e) => handlePriceOverride(activeTabId!, 'service', service.id, e.target.value)}
                                          className="w-20 h-6"
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Price Summary */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <Label className="font-semibold">Slot Total</Label>
                        <p className="text-2xl font-bold text-green-600">
                          ${calculateSlotPrice(activeTabId!).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {configurations[activeTabId!]?.pricingModel === 'per_person' && 
                            `(Based on ${configurations[activeTabId!]?.guests} guests)`
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t flex justify-between items-center">
          <div className="flex items-center space-x-4">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            {step === 2 && !isAddingSlots && wizardSlots.length > 0 && (
              <Button 
                variant="outline"
                onClick={() => setIsAddingSlots(true)}
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Add More Slots
              </Button>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {step === 3 && wizardSlots.length > 0 && (
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Event Cost</p>
                <p className="text-2xl font-bold text-green-600">
                  ${totalEventPrice.toFixed(2)}
                </p>
              </div>
            )}
            {step === 2 && !isAddingSlots && wizardSlots.length > 0 && (
              <Button onClick={() => setStep(3)}>
                Configure Slots
              </Button>
            )}
            {step === 3 && (
              <Button 
                onClick={handleSubmit}
                disabled={isSubmitting || !eventDetails.eventName || wizardSlots.length === 0}
              >
                {isSubmitting ? 'Creating...' : `Create ${wizardSlots.length} Booking${wizardSlots.length !== 1 ? 's' : ''}`}
              </Button>
            )}
          </div>
        </div>

        {/* Clone Configuration Modal */}
        {isCloning && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="font-semibold mb-4">Copy Configuration</h3>
              <p className="text-sm text-gray-600 mb-4">
                Copy settings from {formatDate(activeSlot?.startTime || new Date(), {weekday: 'long', month: 'short', day: 'numeric'})} to:
              </p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {wizardSlots.filter(s => generateSlotId(s) !== activeTabId).map(slot => {
                  const slotId = generateSlotId(slot);
                  return (
                    <label key={slotId} className="flex items-center space-x-2">
                      <Checkbox
                        id={slotId!}
                        onChange={(checked) => {
                          // Handle multiple selection
                        }}
                      />
                      <span className="text-sm">
                        {formatDate(slot.startTime, {weekday: 'long', month: 'short', day: 'numeric'})} - {slot.space?.name}
                      </span>
                    </label>
                  );
                })}
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="outline" onClick={() => setIsCloning(false)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  // Get selected slots and apply clone
                  const selectedSlots = wizardSlots.filter(s => generateSlotId(s) !== activeTabId).map(s => generateSlotId(s)).filter(Boolean) as string[];
                  handleApplyClone(selectedSlots);
                }}>
                  Copy to All
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}