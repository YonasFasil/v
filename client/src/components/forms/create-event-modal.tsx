import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Speech Recognition API types
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, ChevronRight, Plus, Minus, Check, Mic, MicOff, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";

interface CreateEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface EventPackage {
  id: string;
  name: string;
  basePrice: number;
  description: string;
}

interface AddOnService {
  id: string;
  name: string;
  price: number;
  quantity?: number;
}

const eventFormSchema = z.object({
  eventName: z.string().min(1, "Event name is required"),
  customerId: z.string().optional(),
  customerName: z.string().optional(),
  customerEmail: z.string().email().optional(),
  eventStatus: z.string().default("inquiry"),
});

type EventFormData = z.infer<typeof eventFormSchema>;

export function CreateEventModal({ open, onOpenChange }: CreateEventModalProps) {
  console.log('CreateEventModal render - open:', open);
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [selectedTimes, setSelectedTimes] = useState<{ [date: string]: { start: string; end: string; space: string } }>({});
  const [selectedPackage, setSelectedPackage] = useState<EventPackage | null>(null);
  const [addOnServices, setAddOnServices] = useState<AddOnService[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    company: ""
  });

  const { data: venues } = useQuery({
    queryKey: ["/api/venues"],
  });

  const { data: customers } = useQuery({
    queryKey: ["/api/customers"],
  });

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      eventName: "",
      eventStatus: "inquiry",
    },
  });

  // Mock packages and services - in real app these would come from API
  const packages: EventPackage[] = [
    { id: "1", name: "A La Carte", basePrice: 0, description: "Build your own package" },
    { id: "2", name: "Silver Package", basePrice: 2500, description: "Standard package with essentials" },
    { id: "3", name: "Gold Package", basePrice: 3500, description: "Premium package with extras" },
    { id: "4", name: "Platinum Package", basePrice: 5000, description: "All-inclusive luxury package" },
  ];

  const availableServices: AddOnService[] = [
    { id: "1", name: "Breakfast", price: 100 },
    { id: "2", name: "Lunch", price: 150 },
    { id: "3", name: "Dinner", price: 200 },
    { id: "4", name: "Cocktail Hour", price: 120 },
    { id: "5", name: "DJ Service", price: 300 },
    { id: "6", name: "Photography", price: 500 },
    { id: "7", name: "Floral Arrangements", price: 250 },
  ];

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    const dateKey = date.toISOString().split('T')[0];
    setSelectedDates(prev => {
      const exists = prev.some(d => d.toISOString().split('T')[0] === dateKey);
      if (exists) {
        // Remove date and its time settings
        setSelectedTimes(prev => {
          const newTimes = { ...prev };
          delete newTimes[dateKey];
          return newTimes;
        });
        return prev.filter(d => d.toISOString().split('T')[0] !== dateKey);
      } else {
        return [...prev, date];
      }
    });
  };

  const updateTimeForDate = async (date: Date, field: 'start' | 'end' | 'space', value: string) => {
    const dateKey = date.toISOString().split('T')[0];
    setSelectedTimes(prev => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        [field]: value,
      }
    }));
    
    // Check for conflicts when both start time, end time, and space are set
    const currentSettings = selectedTimes[dateKey] || {};
    const newSettings = { ...currentSettings, [field]: value };
    
    if (newSettings.start && newSettings.end && newSettings.space) {
      // Fetch existing bookings to check for conflicts
      try {
        const bookingsResponse = await fetch('/api/bookings');
        const existingBookings = await bookingsResponse.json();
        
        const conflict = existingBookings.find((booking: any) => {
          if (booking.status === 'cancelled') return false;
          if (booking.venueId !== newSettings.space) return false;
          if (new Date(booking.eventDate).toDateString() !== date.toDateString()) return false;
          
          const parseTime = (timeStr: string) => {
            const [hours, minutes] = timeStr.split(':').map(Number);
            return hours * 60 + minutes;
          };
          
          const newStart = parseTime(newSettings.start);
          const newEnd = parseTime(newSettings.end);
          const existingStart = parseTime(booking.startTime);
          const existingEnd = parseTime(booking.endTime);
          
          return (newStart < existingEnd && newEnd > existingStart);
        });
        
        if (conflict) {
          toast({
            title: "Time Conflict Warning",
            description: `This time slot conflicts with "${conflict.eventName}" (${conflict.startTime} - ${conflict.endTime})`,
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error checking conflicts:', error);
      }
    }
  };

  const updateServiceQuantity = (serviceId: string, change: number) => {
    setAddOnServices(prev => {
      const existing = prev.find(s => s.id === serviceId);
      if (existing) {
        const newQuantity = Math.max(0, existing.quantity! + change);
        if (newQuantity === 0) {
          return prev.filter(s => s.id !== serviceId);
        }
        return prev.map(s => s.id === serviceId ? { ...s, quantity: newQuantity } : s);
      } else if (change > 0) {
        const service = availableServices.find(s => s.id === serviceId);
        if (service) {
          return [...prev, { ...service, quantity: 1 }];
        }
      }
      return prev;
    });
  };

  const getServiceQuantity = (serviceId: string) => {
    return addOnServices.find(s => s.id === serviceId)?.quantity || 0;
  };

  const calculateTotal = () => {
    const packagePrice = selectedPackage?.basePrice || 0;
    const servicesTotal = addOnServices.reduce((sum, service) => sum + (service.price * (service.quantity || 0)), 0);
    return packagePrice + servicesTotal;
  };

  const handleGenerateEventSlots = () => {
    if (selectedDates.length === 0) {
      toast({
        title: "Select Dates",
        description: "Please select at least one date for your event",
        variant: "destructive",
      });
      return;
    }
    setCurrentStep(2);
  };

  const handleNext = () => {
    setCurrentStep(3);
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (data: EventFormData) => {
    try {
      setIsSubmitting(true);

      // Create customer if new
      let customerId = data.customerId;
      if (!customerId && data.customerName && data.customerEmail) {
        const customerResponse = await apiRequest("POST", "/api/customers", {
          name: data.customerName,
          email: data.customerEmail,
          status: "customer"
        });
        const customerData = await customerResponse.json();
        customerId = customerData.id;
      }

      // Create bookings for each selected date
      for (const date of selectedDates) {
        const dateKey = date.toISOString().split('T')[0];
        const timeSettings = selectedTimes[dateKey];
        
        if (timeSettings) {
          const bookingData = {
            eventName: data.eventName,
            eventType: selectedPackage?.name || "Custom Event",
            customerId,
            venueId: timeSettings.space,
            eventDate: date,
            startTime: timeSettings.start,
            endTime: timeSettings.end,
            guestCount: 1, // Default, will be updated later
            status: data.eventStatus,
            totalAmount: calculateTotal(),
            notes: `Package: ${selectedPackage?.name || 'Custom'}\nServices: ${addOnServices.map(s => `${s.name} (${s.quantity})`).join(', ')}`,
          };

          try {
            await apiRequest("POST", "/api/bookings", bookingData);
          } catch (error: any) {
            if (error.status === 409) {
              const errorData = await error.json();
              if (errorData?.message === "Time slot conflict") {
                toast({
                  title: "Time Conflict",
                  description: `Time slot conflicts with existing booking: ${errorData.conflictingBooking?.eventName} (${errorData.conflictingBooking?.startTime} - ${errorData.conflictingBooking?.endTime})`,
                  variant: "destructive",
                });
                setIsSubmitting(false);
                return;
              }
            }
            throw error;
          }
        }
      }

      await queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      
      toast({
        title: "Success",
        description: "Event created successfully",
      });
      
      // Reset form
      form.reset();
      setCurrentStep(1);
      setSelectedDates([]);
      setSelectedTimes({});
      setSelectedPackage(null);
      setAddOnServices([]);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create event",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Voice recognition functionality
  const startVoiceRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Voice not supported",
        description: "Your browser doesn't support voice recognition",
        variant: "destructive"
      });
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    setIsListening(true);

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setVoiceTranscript(transcript);
    };

    recognition.onerror = () => {
      setIsListening(false);
      toast({
        title: "Voice error",
        description: "Error occurred during voice recognition",
        variant: "destructive"
      });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const stopVoiceRecording = () => {
    setIsListening(false);
  };

  // Parse voice transcript and populate fields using Gemini AI
  const parseVoiceInput = async () => {
    if (!voiceTranscript.trim()) return;

    try {
      const response = await apiRequest("POST", "/api/ai/parse-voice", {
        transcript: voiceTranscript
      });

      if (response.eventName) {
        form.setValue("eventName", response.eventName);
      }
      if (response.customerName) {
        form.setValue("customerName", response.customerName);
      }
      if (response.customerEmail) {
        form.setValue("customerEmail", response.customerEmail);
      }
      if (response.dates && response.dates.length > 0) {
        const parsedDates = response.dates.map((dateStr: string) => new Date(dateStr));
        setSelectedDates(parsedDates);
      }
      if (response.times) {
        setSelectedTimes(response.times);
      }

      toast({
        title: "Voice input processed",
        description: "Event details populated from your voice input"
      });
    } catch (error) {
      toast({
        title: "Processing failed",
        description: "Could not process voice input",
        variant: "destructive"
      });
    }
  };

  // Create new customer
  const createCustomer = async () => {
    if (!newCustomer.name || !newCustomer.email) {
      toast({
        title: "Required fields missing",
        description: "Please provide at least name and email",
        variant: "destructive"
      });
      return;
    }

    try {
      const customer = await apiRequest("POST", "/api/customers", newCustomer);
      await queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      
      // Set the new customer as selected
      form.setValue("customerId", customer.id);
      form.setValue("customerName", customer.name);
      form.setValue("customerEmail", customer.email);
      
      setShowCustomerForm(false);
      setNewCustomer({ name: "", email: "", phone: "", company: "" });
      
      toast({
        title: "Customer created",
        description: `${customer.name} has been added successfully`
      });
    } catch (error) {
      toast({
        title: "Creation failed",
        description: "Could not create customer",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setSelectedDates([]);
    setSelectedTimes({});
    setSelectedPackage(null);
    setAddOnServices([]);
    setVoiceTranscript("");
    setShowCustomerForm(false);
    setNewCustomer({ name: "", email: "", phone: "", company: "" });
    form.reset();
  };

  const renderStep1 = () => (
    <div className="space-y-4 sm:space-y-6">
      {/* Voice Booking Section */}
      <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
        <h3 className="text-base sm:text-lg font-semibold mb-3 flex items-center text-blue-800">
          <Mic className="w-5 h-5 mr-2" />
          Voice Booking Assistant
        </h3>
        <p className="text-sm text-blue-600 mb-3">
          Speak your event details and we'll populate the form automatically. Try saying something like: "Book a wedding for Sarah Johnson on December 15th from 2 PM to 8 PM"
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            type="button"
            variant={isListening ? "destructive" : "default"}
            onClick={isListening ? stopVoiceRecording : startVoiceRecording}
            className="flex items-center gap-2"
          >
            {isListening ? (
              <>
                <MicOff className="w-4 h-4" />
                Stop Recording
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                Start Voice Booking
              </>
            )}
          </Button>
          
          {voiceTranscript && (
            <Button
              type="button"
              variant="outline"
              onClick={parseVoiceInput}
              className="flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Process Voice Input
            </Button>
          )}
        </div>

        {voiceTranscript && (
          <div className="mt-3 p-3 bg-white rounded border">
            <p className="text-sm font-medium text-gray-700 mb-1">Voice transcript:</p>
            <p className="text-sm text-gray-600 italic">"{voiceTranscript}"</p>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">Venue</h3>
        <Select defaultValue="yonas-salelew">
          <SelectTrigger>
            <SelectValue placeholder="Select venue" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="yonas-salelew">Yonas Salelew</SelectItem>
            {Array.isArray(venues) && venues.map((venue: any) => (
              <SelectItem key={venue.id} value={venue.id}>
                {venue.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">Configure Dates ({selectedDates.length})</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <Calendar
              mode="multiple"
              selected={selectedDates}
              onSelect={(dates) => setSelectedDates(dates || [])}
              className="rounded-md border mx-auto"
              disabled={(date) => date < new Date()}
            />
          </div>
          
          <div className="space-y-3 sm:space-y-4">
            {selectedDates.map((date) => {
              const dateKey = date.toISOString().split('T')[0];
              const timeSettings = selectedTimes[dateKey] || {};
              
              return (
                <Card key={dateKey} className="p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-medium text-sm sm:text-base">
                      {date.toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Available
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Select Space</Label>
                      <Select 
                        value={timeSettings.space || ""} 
                        onValueChange={(value) => updateTimeForDate(date, 'space', value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Choose space" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.isArray(venues) && venues.map((venue: any) => (
                            <SelectItem key={venue.id} value={venue.id}>
                              {venue.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex gap-2 sm:gap-3">
                      <div className="flex-1">
                        <Label className="text-xs sm:text-sm font-medium">Start</Label>
                        <Input 
                          type="time" 
                          value={timeSettings.start || "9:00"} 
                          onChange={(e) => updateTimeForDate(date, 'start', e.target.value)}
                          className="mt-1 text-sm"
                        />
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs sm:text-sm font-medium">End</Label>
                        <Input 
                          type="time" 
                          value={timeSettings.end || "17:00"} 
                          onChange={(e) => updateTimeForDate(date, 'end', e.target.value)}
                          className="mt-1 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={handleGenerateEventSlots}
          className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
          disabled={selectedDates.length === 0}
        >
          Generate 1 Event Slot(s)
        </Button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-medium">Event Dates</h3>
          <Button variant="ghost" size="sm" className="text-blue-600 p-0 h-auto text-xs sm:text-sm">
            + Add
          </Button>
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-medium">Configure Event</h3>
          <p className="text-xs sm:text-sm text-gray-600">For {selectedDates[0]?.toLocaleDateString()} in 10</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {selectedDates.map((date) => {
            const dateKey = date.toISOString().split('T')[0];
            const timeSettings = selectedTimes[dateKey];
            
            return (
              <Card key={dateKey} className="p-4 bg-blue-50">
                <div className="font-medium">
                  {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {date.getFullYear()}
                </div>
                <div className="text-sm text-gray-600">
                  {timeSettings?.start} @ {timeSettings?.end}
                </div>
              </Card>
            );
          })}
        </div>

        <div className="space-y-6">
          <div>
            <Label className="text-sm font-medium">Number of Guests</Label>
            <Input type="number" placeholder="1" className="mt-1" />
          </div>

          <div>
            <Label className="text-sm font-medium">Package</Label>
            <Select 
              value={selectedPackage?.id || ""} 
              onValueChange={(value) => setSelectedPackage(packages.find(p => p.id === value) || null)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select package" />
              </SelectTrigger>
              <SelectContent>
                {packages.map((pkg) => (
                  <SelectItem key={pkg.id} value={pkg.id}>
                    {pkg.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium">Add-on Services</Label>
              <Button variant="ghost" size="sm" className="text-blue-600">
                Apply guest count
              </Button>
            </div>
            
            <div className="space-y-3">
              {availableServices.map((service) => {
                const quantity = getServiceQuantity(service.id);
                return (
                  <div key={service.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-sm sm:text-base">{service.name}</div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="text-right">
                        <div className="font-medium text-sm sm:text-base">${service.price}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Label className="text-xs sm:text-sm">Qty:</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => updateServiceQuantity(service.id, -1)}
                          disabled={quantity === 0}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm">{quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => updateServiceQuantity(service.id, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      {quantity > 0 && (
                        <Check className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <Separator />
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="text-base sm:text-lg font-semibold">
          Grand Total: ${calculateTotal().toFixed(2)}
        </div>
        <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
          Next
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Event Dates</h3>
          <Button variant="ghost" size="sm" className="text-blue-600 p-0 h-auto">
            + Add
          </Button>
        </div>
        <div>
          <h3 className="text-lg font-medium">Confirm Details</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {selectedDates.map((date) => {
            const dateKey = date.toISOString().split('T')[0];
            const timeSettings = selectedTimes[dateKey];
            
            return (
              <Card key={dateKey} className="p-4 bg-blue-50">
                <div className="font-medium">
                  {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {date.getFullYear()}
                </div>
                <div className="text-sm text-gray-600">
                  {timeSettings?.start} @ {timeSettings?.end}
                </div>
              </Card>
            );
          })}
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Event Name</Label>
            <Input 
              placeholder='e.g., "Annual Conference 2025"' 
              {...form.register("eventName")}
              className="mt-1"
            />
            {form.formState.errors.eventName && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.eventName.message}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">Customer</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCustomerForm(!showCustomerForm)}
                className="flex items-center gap-1 text-xs"
              >
                <Plus className="w-3 h-3" />
                Create New
              </Button>
            </div>
            
            {!showCustomerForm ? (
              <Select onValueChange={(value) => form.setValue("customerId", value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="-- Select a Customer --" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(customers) && customers.map((customer: any) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} - {customer.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Card className="p-4 bg-gray-50 border-2 border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-sm text-blue-800 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Create New Customer
                  </h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCustomerForm(false)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium">Name *</Label>
                    <Input
                      placeholder="Customer name"
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Email *</Label>
                    <Input
                      type="email"
                      placeholder="customer@email.com"
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Phone</Label>
                    <Input
                      placeholder="Phone number"
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Company</Label>
                    <Input
                      placeholder="Company name"
                      value={newCustomer.company}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, company: e.target.value }))}
                      className="text-sm"
                    />
                  </div>
                </div>
                
                <Button
                  type="button"
                  onClick={createCustomer}
                  className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-sm"
                  disabled={!newCustomer.name || !newCustomer.email}
                >
                  Create Customer & Select
                </Button>
              </Card>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium">Event Status</Label>
            <Select 
              value={form.watch("eventStatus")} 
              onValueChange={(value) => form.setValue("eventStatus", value)}
            >
              <SelectTrigger className="mt-1">
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
            <Label className="text-sm font-medium">Applicable Policies</Label>
            <div className="mt-2 p-3 bg-gray-50 rounded border text-sm text-gray-600">
              Standard venue policies apply. Cancellation and payment terms as per venue agreement.
            </div>
          </div>
        </div>
      </div>

      <Separator />
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="text-base sm:text-lg font-semibold">
          Grand Total: ${calculateTotal().toFixed(2)}
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button type="button" variant="outline" onClick={handleBack} className="flex-1 sm:flex-none">
            Back
          </Button>
          <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none">
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </form>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full p-3 sm:p-6">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              {currentStep > 1 && (
                <Button variant="ghost" size="sm" onClick={handleBack} className="p-1">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              Create Event
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              ✕
            </Button>
          </div>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex justify-center mb-4 sm:mb-6">
          <div className="flex items-center space-x-1 sm:space-x-2">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div 
                  className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
                    step <= currentStep ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
                {step < 3 && <div className="w-8 sm:w-12 h-px bg-gray-300 mx-1 sm:mx-2" />}
              </div>
            ))}
          </div>
        </div>

        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </DialogContent>
    </Dialog>
  );
}