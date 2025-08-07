import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Calendar, Clock, Users, Package, Plus, Copy, Check, Trash2 } from "lucide-react";
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

const eventDetailsSchema = z.object({
  eventName: z.string().min(1, "Event name is required"),
  eventType: z.string().min(1, "Event type is required"),
  description: z.string().optional(),
  customerId: z.string().optional(),
});

interface EventSlot {
  id: string;
  venueId: string;
  venueName: string;
  date: Date;
  startTime: string;
  endTime: string;
}

interface SlotConfiguration {
  packageId: string;
  addOns: string[]; // Service IDs
  guests: number;
  pricingModel: 'fixed' | 'per_person';
  itemQuantities: Record<string, number>; // For services that need quantities
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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

export default function SlotBasedEventModal({ open, onOpenChange }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Form for event details
  const form = useForm<z.infer<typeof eventDetailsSchema>>({
    resolver: zodResolver(eventDetailsSchema),
    defaultValues: {
      eventName: "",
      eventType: "",
      description: "",
      customerId: "",
    },
  });

  // State management
  const [currentStep, setCurrentStep] = useState(1); // 1: Details, 2: Slots, 3: Configure
  const [slots, setSlots] = useState<EventSlot[]>([]);
  const [activeSlotId, setActiveSlotId] = useState<string>("");
  const [configurations, setConfigurations] = useState<Record<string, SlotConfiguration>>({});
  const [isAddingSlot, setIsAddingSlot] = useState(false);

  // New slot form
  const [newSlot, setNewSlot] = useState({
    venueId: "",
    date: "",
    startTime: "",
    endTime: "",
  });

  // Data queries
  const { data: venues = [] } = useQuery({ queryKey: ["/api/venues"] });
  const { data: customers = [] } = useQuery({ queryKey: ["/api/customers"] });
  const { data: packages = [] } = useQuery({ queryKey: ["/api/packages"] });
  const { data: services = [] } = useQuery({ queryKey: ["/api/services"] });

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      const response = await apiRequest("POST", "/api/bookings", bookingData);
      return response.json();
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

  // Initialize configurations when slots change
  useEffect(() => {
    if (slots.length > 0 && !activeSlotId) {
      setActiveSlotId(slots[0].id);
    }
    
    setConfigurations(prev => {
      const newConfigs = { ...prev };
      slots.forEach(slot => {
        if (!newConfigs[slot.id]) {
          newConfigs[slot.id] = {
            packageId: "",
            addOns: [],
            guests: 1,
            pricingModel: 'fixed',
            itemQuantities: {},
          };
        }
      });
      return newConfigs;
    });
  }, [slots, activeSlotId]);

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
                        <SelectItem value="">A La Carte</SelectItem>
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