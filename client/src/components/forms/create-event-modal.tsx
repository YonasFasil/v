import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  
  // Step 2: Event Configuration  
  const [guestCount, setGuestCount] = useState(1);
  const [selectedPackage, setSelectedPackage] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  
  // Step 3: Final Details
  const [eventName, setEventName] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [eventStatus, setEventStatus] = useState("inquiry");

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

  const selectedVenueData = venues.find((v: any) => v.id === selectedVenue);
  const selectedPackageData = packages.find((p: any) => p.id === selectedPackage);
  
  // Calculate total price
  const totalPrice = useMemo(() => {
    let total = 0;
    if (selectedPackageData) {
      total += parseFloat(selectedPackageData.price) * selectedDates.length;
    }
    selectedServices.forEach(serviceId => {
      const service = services.find((s: any) => s.id === serviceId);
      if (service) {
        total += parseFloat(service.price) * guestCount; // Apply guest count to services
      }
    });
    return total;
  }, [selectedPackageData, selectedServices, services, selectedDates.length]);

  // Handle date selection
  const handleDateClick = (date: Date) => {
    if (!isSameMonth(date, currentDate)) return;
    
    const existingIndex = selectedDates.findIndex(d => isSameDay(d.date, date));
    if (existingIndex >= 0) {
      setSelectedDates(prev => prev.filter((_, i) => i !== existingIndex));
    } else {
      setSelectedDates(prev => [...prev, {
        date,
        startTime: "09:00 AM",
        endTime: "05:00 PM"
      }]);
    }
  };

  // Update time for a selected date
  const updateDateTime = (index: number, field: 'startTime' | 'endTime', value: string) => {
    setSelectedDates(prev => prev.map((date, i) => 
      i === index ? { ...date, [field]: value } : date
    ));
  };

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
    setGuestCount(1);
    setSelectedPackage("");
    setSelectedServices([]);
    setEventName("");
    setSelectedCustomer("");
    setEventStatus("inquiry");
  };

  const handleSubmit = () => {
    if (!eventName || !selectedCustomer || selectedDates.length === 0) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    // Create booking for first selected date (extend for multiple dates if needed)
    const firstDate = selectedDates[0];
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
      guestCount,
      status: eventStatus,
      customerId: selectedCustomer,
      venueId: selectedVenue,
      spaceId: selectedVenueData?.spaces?.[0]?.id,
      totalAmount: totalPrice.toString(),
      notes: `Package: ${selectedPackageData?.name || 'None'}, Services: ${selectedServices.length} selected`
    };

    createBooking.mutate(bookingData);
  };

  const nextStep = () => {
    if (currentStep === 1 && (!selectedVenue || selectedDates.length === 0)) {
      toast({ title: "Please select a venue and at least one date", variant: "destructive" });
      return;
    }
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[85vh] p-0 overflow-hidden" aria-describedby="create-event-description">
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
                          {venues.map((venue: any) => (
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
                              <div className="text-sm text-green-600 mb-2">
                                Space: {selectedVenueData?.spaces?.[0]?.name || 'Main Hall'} (Default space will be booked)
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

              {/* Step 2: Event Configuration */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Configure Event</h3>
                    <p className="text-slate-600">
                      For {selectedDates.map(d => format(d.date, 'EEEE, MMMM d, yyyy')).join(', ')} in {selectedVenueData?.spaces?.[0]?.name || selectedVenueData?.name}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div>
                        <Label className="text-base font-medium">Number of Guests</Label>
                        <Input
                          type="number"
                          value={guestCount}
                          onChange={(e) => setGuestCount(parseInt(e.target.value) || 1)}
                          min="1"
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label className="text-base font-medium">Package</Label>
                        <Select value={selectedPackage} onValueChange={setSelectedPackage}>
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Select a package" />
                          </SelectTrigger>
                          <SelectContent>
                            {packages.map((pkg: any) => (
                              <SelectItem key={pkg.id} value={pkg.id}>
                                {pkg.name} - ${pkg.price}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedPackageData && (
                          <div className="mt-2 p-3 bg-blue-50 rounded border border-blue-200">
                            <p className="text-sm font-medium text-blue-900">Package includes:</p>
                            <div className="text-xs text-blue-700 mt-1">
                              Services bundled in this package will appear automatically
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-base font-medium">Add-on Services</Label>
                          <div className="flex gap-2">
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              Auto-apply guest count: ON
                            </Badge>
                            <Button variant="outline" size="sm">+ New Service</Button>
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 mb-3">
                          Additional services beyond the selected package. Quantities will be automatically set to guest count ({guestCount}).
                        </p>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {services.map((service: any) => (
                            <label key={service.id} className="flex items-center gap-2 p-3 border rounded hover:bg-slate-50 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedServices.includes(service.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedServices(prev => [...prev, service.id]);
                                  } else {
                                    setSelectedServices(prev => prev.filter(id => id !== service.id));
                                  }
                                }}
                                className="rounded"
                              />
                              <div className="flex-1">
                                <div className="font-medium">{service.name}</div>
                                <div className="text-sm text-slate-600">${service.price} each</div>
                              </div>
                              {selectedServices.includes(service.id) && (
                                <div className="text-sm font-medium text-blue-600">
                                  Qty: {guestCount}
                                </div>
                              )}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-lg">
                      <h4 className="font-semibold mb-4">Summary</h4>
                      <div className="space-y-2">
                        {selectedPackageData && (
                          <div className="flex justify-between">
                            <span>{selectedPackageData.name}</span>
                            <span>${selectedPackageData.price}</span>
                          </div>
                        )}
                        {selectedServices.map(serviceId => {
                          const service = services.find((s: any) => s.id === serviceId);
                          return service ? (
                            <div key={serviceId} className="flex justify-between">
                              <span>{service.name} (×{guestCount})</span>
                              <span>${(parseFloat(service.price) * guestCount).toFixed(2)}</span>
                            </div>
                          ) : null;
                        })}
                        <div className="border-t pt-2 mt-4">
                          <div className="flex justify-between font-semibold">
                            <span>Grand Total</span>
                            <span>${totalPrice.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
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
                        <Label className="text-base font-medium">Customer</Label>
                        <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="-- Select a Customer --" />
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
                          <span className="text-sm text-slate-600">Guests</span>
                          <div className="font-medium">{guestCount}</div>
                        </div>
                        {selectedPackageData && (
                          <div>
                            <span className="text-sm text-slate-600">Package</span>
                            <div className="font-medium">{selectedPackageData.name}</div>
                          </div>
                        )}
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

            {/* Footer */}
            <div className="border-t border-slate-200 p-6 flex justify-between items-center">
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
                    {currentStep === 1 ? `Generate ${selectedDates.length} Event Slot(s)` : 'Next'}
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
    </Dialog>
  );
}