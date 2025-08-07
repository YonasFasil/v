import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Minus, 
  Check, 
  User, 
  X, 
  Calendar as CalendarIcon, 
  MapPin, 
  Users as UsersIcon, 
  Clock,
  Package,
  DollarSign,
  ArrowRight
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";

interface MultiDateEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const eventFormSchema = z.object({
  eventName: z.string().min(1, "Event name is required"),
  customerId: z.string().optional(),
  eventType: z.string().min(1, "Event type is required"),
  guestCount: z.number().min(1, "Guest count must be at least 1"),
  venueId: z.string().min(1, "Venue is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  specialRequests: z.string().optional(),
  selectedDates: z.array(z.date()).min(1, "At least one date must be selected"),
  packageId: z.string().optional(),
  additionalServices: z.array(z.string()).optional()
});

type EventFormData = z.infer<typeof eventFormSchema>;

export function MultiDateEventModal({ open, onOpenChange }: MultiDateEventModalProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [selectedPackage, setSelectedPackage] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalCost, setTotalCost] = useState(0);

  const { data: venues } = useQuery({
    queryKey: ["/api/venues"],
  });

  const { data: customers } = useQuery({
    queryKey: ["/api/customers"],
  });

  const { data: packages = [] } = useQuery({
    queryKey: ["/api/packages"],
  });

  const { data: services = [] } = useQuery({
    queryKey: ["/api/services"],
  });

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      eventName: "",
      eventType: "",
      guestCount: 50,
      venueId: "",
      startTime: "14:00",
      endTime: "18:00",
      specialRequests: "",
      selectedDates: [],
      packageId: "",
      additionalServices: []
    },
  });

  const eventTypes = [
    "Wedding", "Corporate Event", "Birthday Party", "Conference", 
    "Workshop", "Gala", "Fundraiser", "Product Launch", "Other"
  ];

  const timeSlots = [
    "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", 
    "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"
  ];

  // Multi-date selection handler
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    const dateExists = selectedDates.find(d => 
      d.toDateString() === date.toDateString()
    );
    
    if (dateExists) {
      const newDates = selectedDates.filter(d => 
        d.toDateString() !== date.toDateString()
      );
      setSelectedDates(newDates);
      form.setValue('selectedDates', newDates);
    } else {
      const newDates = [...selectedDates, date].sort((a, b) => a.getTime() - b.getTime());
      setSelectedDates(newDates);
      form.setValue('selectedDates', newDates);
    }
  };

  const handlePackageSelect = (packageId: string) => {
    setSelectedPackage(packageId);
    form.setValue('packageId', packageId);
  };

  const handleServiceToggle = (serviceId: string) => {
    const newServices = selectedServices.includes(serviceId)
      ? selectedServices.filter(id => id !== serviceId)
      : [...selectedServices, serviceId];
    
    setSelectedServices(newServices);
    form.setValue('additionalServices', newServices);
  };

  const calculateTotalCost = () => {
    let total = 0;
    const guestCount = form.getValues('guestCount');
    
    // Add package cost
    if (selectedPackage && packages.length > 0) {
      const pkg = packages.find((p: any) => p.id === selectedPackage);
      if (pkg) {
        total += parseFloat(pkg.basePrice || 0);
      }
    }
    
    // Add additional services cost
    if (selectedServices.length > 0 && services.length > 0) {
      selectedServices.forEach(serviceId => {
        const service = services.find((s: any) => s.id === serviceId);
        if (service) {
          const price = parseFloat(service.price || 0);
          total += service.unit === "per person" ? price * guestCount : price;
        }
      });
    }
    
    return total;
  };

  useEffect(() => {
    setTotalCost(calculateTotalCost());
  }, [selectedPackage, selectedServices, form.watch('guestCount'), packages, services]);

  const onSubmit = async (data: EventFormData) => {
    try {
      setIsSubmitting(true);

      // Create bookings for each selected date
      for (const date of selectedDates) {
        const bookingData = {
          eventName: data.eventName,
          eventType: data.eventType,
          customerId: data.customerId,
          venueId: data.venueId,
          eventDate: date.toISOString(),
          endDate: null,
          startTime: data.startTime,
          endTime: data.endTime,
          guestCount: data.guestCount,
          status: "pending",
          totalAmount: totalCost.toString(),
          isMultiDay: selectedDates.length > 1,
          notes: data.specialRequests || ""
        };

        await apiRequest("POST", "/api/bookings", bookingData);
      }

      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });

      toast({
        title: "🎉 Events Created Successfully!",
        description: `Created ${selectedDates.length} booking${selectedDates.length > 1 ? 's' : ''} for ${data.eventName}`,
      });

      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Error Creating Events",
        description: "Please try again or contact support",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    form.reset();
    setCurrentStep(1);
    setSelectedDates([]);
    setSelectedPackage("");
    setSelectedServices([]);
    setTotalCost(0);
  };

  const nextStep = () => {
    if (currentStep === 1 && selectedDates.length === 0) {
      toast({
        title: "Select Dates",
        description: "Please select at least one date for your event",
        variant: "destructive"
      });
      return;
    }
    setCurrentStep(Math.min(currentStep + 1, 3));
  };

  const previousStep = () => {
    setCurrentStep(Math.max(currentStep - 1, 1));
  };

  const renderStepIndicator = () => (
    <div className="flex justify-center mb-6">
      <div className="flex items-center space-x-4">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= step
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
              }`}
            >
              {currentStep > step ? <Check className="w-4 h-4" /> : step}
            </div>
            {step < 3 && (
              <div
                className={`w-12 h-0.5 mx-2 ${
                  currentStep > step ? "bg-purple-600" : "bg-gray-200 dark:bg-gray-700"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderDateSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Select Your Event Dates</h3>
        <p className="text-sm text-muted-foreground">
          Choose one or multiple dates for your event
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <Calendar
            mode="single"
            selected={undefined}
            onSelect={handleDateSelect}
            disabled={(date) => date < new Date()}
            className="rounded-md border"
          />
        </div>
        
        <div className="lg:w-80">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Selected Dates</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDates.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No dates selected
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedDates.map((date, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-purple-50 dark:bg-purple-900/20 rounded-md"
                    >
                      <span className="text-sm font-medium">
                        {format(date, "MMM dd, yyyy")}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDateSelect(date)}
                        className="h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900/20"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  const renderEventDetails = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Event Details</h3>
        <p className="text-sm text-muted-foreground">
          Fill in your event information
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="eventName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter event name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="eventType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Type *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {eventTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="guestCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Guest Count *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    placeholder="Number of guests"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="venueId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Venue *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select venue" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {venues && venues.map((venue: any) => (
                      <SelectItem key={venue.id} value={venue.id}>
                        {venue.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Time *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Start time" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {timeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Time *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="End time" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {timeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="specialRequests"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Special Requests</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Any special requirements or notes..."
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );

  const renderPackagesServices = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Packages & Services</h3>
        <p className="text-sm text-muted-foreground">
          Choose a package and add additional services
        </p>
      </div>

      {/* Packages Section */}
      <div className="space-y-4">
        <h4 className="font-medium flex items-center gap-2">
          <Package className="w-4 h-4" />
          Event Packages
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {packages.map((pkg: any) => (
            <Card
              key={pkg.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedPackage === pkg.id
                  ? "ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-900/20"
                  : "hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
              onClick={() => handlePackageSelect(pkg.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base">{pkg.name}</CardTitle>
                  <Badge variant="outline">${pkg.basePrice}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{pkg.description}</p>
              </CardHeader>
              {pkg.features && (
                <CardContent className="pt-0">
                  <div className="space-y-1">
                    {pkg.features.slice(0, 3).map((feature: string, index: number) => (
                      <div key={index} className="flex items-center gap-2 text-xs">
                        <Check className="w-3 h-3 text-green-500" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* Additional Services Section */}
      <div className="space-y-4">
        <h4 className="font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Additional Services
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {services.map((service: any) => (
            <div
              key={service.id}
              className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <Checkbox
                id={service.id}
                checked={selectedServices.includes(service.id)}
                onCheckedChange={() => handleServiceToggle(service.id)}
              />
              <div className="flex-1">
                <label
                  htmlFor={service.id}
                  className="text-sm font-medium cursor-pointer"
                >
                  {service.name}
                </label>
                <p className="text-xs text-muted-foreground">
                  ${service.price} {service.unit}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cost Summary */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Cost Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {selectedPackage && packages.length > 0 && (
              <div className="flex justify-between text-sm">
                <span>
                  {packages.find((p: any) => p.id === selectedPackage)?.name} Package
                </span>
                <span>${packages.find((p: any) => p.id === selectedPackage)?.basePrice}</span>
              </div>
            )}
            {selectedServices.length > 0 && services.length > 0 && (
              <>
                {selectedServices.map(serviceId => {
                  const service = services.find((s: any) => s.id === serviceId);
                  if (!service) return null;
                  const cost = service.unit === "per person" 
                    ? parseFloat(service.price) * form.getValues('guestCount')
                    : parseFloat(service.price);
                  return (
                    <div key={serviceId} className="flex justify-between text-sm">
                      <span>{service.name}</span>
                      <span>${cost.toFixed(2)}</span>
                    </div>
                  );
                })}
              </>
            )}
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total Estimated Cost</span>
              <span>${totalCost.toFixed(2)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              * Final cost will be calculated based on your specific requirements
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "Select Dates";
      case 2: return "Event Details";
      case 3: return "Packages & Services";
      default: return "Create Event";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-4xl h-[90vh] max-h-[900px] p-0">
        <div className="flex flex-col h-full">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {getStepTitle()}
            </DialogTitle>
            {renderStepIndicator()}
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                {currentStep === 1 && renderDateSelection()}
                {currentStep === 2 && renderEventDetails()}
                {currentStep === 3 && renderPackagesServices()}
              </form>
            </Form>
          </div>

          <div className="border-t px-6 py-4">
            <div className="flex flex-col sm:flex-row justify-between gap-3">
              <div className="flex gap-3">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={previousStep}
                    className="flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="min-w-[100px]"
                >
                  Cancel
                </Button>

                {currentStep < 3 ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 min-w-[100px] flex items-center gap-2"
                  >
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    onClick={form.handleSubmit(onSubmit)}
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 min-w-[120px]"
                  >
                    {isSubmitting ? "Creating..." : "Create Events"}
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