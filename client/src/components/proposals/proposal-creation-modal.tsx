import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileText, Save, Send, Calendar, Users, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { EmailPreviewModal } from "./email-preview-modal";

interface ProposalCreationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventData?: any;
  customer?: any;
}

export function ProposalCreationModal({ 
  open, 
  onOpenChange, 
  eventData, 
  customer 
}: ProposalCreationModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Basic proposal info
  const [proposalTitle, setProposalTitle] = useState("");
  const [proposalContent, setProposalContent] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(customer?.id || "");
  const [validUntil, setValidUntil] = useState("");
  
  // Event configuration - supporting multiple events
  const [events, setEvents] = useState<Array<{
    id: string;
    eventName: string;
    eventType: string;
    eventDate: string;
    startTime: string;
    endTime: string;
    guestCount: number;
    selectedVenue: string;
    selectedSpace: string;
    selectedPackage: string;
    selectedServices: string[];
    customPackagePrice?: number;
    customServicePrices?: { [serviceId: string]: number };
  }>>([]);
  
  // New customer creation
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  
  // Pricing and deposit
  const [totalAmount, setTotalAmount] = useState(0);
  const [depositType, setDepositType] = useState("percentage");
  const [depositValue, setDepositValue] = useState(25);
  const [depositAmount, setDepositAmount] = useState(0);
  const [customPricing, setCustomPricing] = useState(false);
  
  // Email preview modal
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [proposalId, setProposalId] = useState<string | null>(null);

  // Data queries
  const { data: customers = [] } = useQuery({ queryKey: ["/api/customers"] });
  const { data: venues = [] } = useQuery({ queryKey: ["/api/venues-with-spaces"] });
  const { data: packages = [] } = useQuery({ queryKey: ["/api/packages"] });
  const { data: services = [] } = useQuery({ queryKey: ["/api/services"] });
  
  // New customer creation mutation
  const createCustomerMutation = useMutation({
    mutationFn: async (customerData: any) => {
      const response = await apiRequest("POST", "/api/customers", customerData);
      return response.json();
    },
    onSuccess: (newCustomer) => {
      toast({
        title: "Customer Created",
        description: "New customer has been added successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setSelectedCustomer(newCustomer.id);
      setShowCreateCustomer(false);
      setNewCustomerName("");
      setNewCustomerEmail("");
      setNewCustomerPhone("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create customer",
        variant: "destructive"
      });
    }
  });

  // Save proposal mutation
  const saveProposalMutation = useMutation({
    mutationFn: async (proposalData: any) => {
      const response = await apiRequest("POST", "/api/proposals", proposalData);
      return response.json();
    },
    onSuccess: (proposal) => {
      setProposalId(proposal.id);
      toast({
        title: "Proposal Saved",
        description: "Proposal has been saved successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/proposals"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save proposal",
        variant: "destructive"
      });
    }
  });

  // Send email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async (emailData: {
      to: string;
      subject: string;
      message: string;
      proposalViewLink: string;
    }) => {
      const response = await apiRequest("POST", "/api/proposals/send-email", {
        proposalId,
        customerId: selectedCustomer,
        emailData
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Proposal Sent",
        description: "Email sent successfully and communication logged"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/communications", selectedCustomer] });
      onOpenChange(false);
      // Reset form
      setProposalTitle("");
      setProposalContent("");
      setEvents([]);
      setProposalId(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send email",
        variant: "destructive"
      });
    }
  });

  // Initialize with event data if provided
  useEffect(() => {
    if (eventData && open) {
      setSelectedCustomer(eventData.customerId || "");
      setTotalAmount(eventData.totalAmount || 0);
      
      // Convert eventData to events array
      if (eventData.eventDates && eventData.eventDates.length > 0) {
        const newEvents = eventData.eventDates.map((eventDate: any, index: number) => ({
          id: `event-${index}`,
          eventName: eventData.eventName || "",
          eventType: "corporate", // Default type
          eventDate: format(eventDate.date, 'yyyy-MM-dd'),
          startTime: eventDate.startTime || "10:00",
          endTime: eventDate.endTime || "18:00",
          guestCount: eventDate.guestCount || 50,
          selectedVenue: eventDate.venue || "",
          selectedSpace: eventDate.space || "",
          selectedPackage: eventDate.selectedPackage?.id || "none",
          selectedServices: eventDate.selectedServices || [],
          customServicePrices: {}
        }));
        
        setEvents(newEvents);
      } else {
        // Single event fallback
        setEvents([{
          id: "event-0",
          eventName: eventData.eventName || "",
          eventType: "corporate",
          eventDate: eventData.eventDate || "",
          startTime: eventData.startTime || "10:00",
          endTime: eventData.endTime || "18:00",
          guestCount: eventData.guestCount || 50,
          selectedVenue: eventData.venueId || "",
          selectedSpace: eventData.spaceId || "",
          selectedPackage: eventData.packageId || "none",
          selectedServices: eventData.selectedServices || [],
          customServicePrices: {}
        }]);
      }
      
      setProposalTitle(`${eventData.eventName || "Event"} Proposal`);
    } else if (open && events.length === 0) {
      // Initialize with empty event if no data provided
      addNewEvent();
    }
  }, [eventData, open]);

  // Add/remove events
  const addNewEvent = () => {
    const newEvent = {
      id: `event-${Date.now()}`,
      eventName: "",
      eventType: "corporate",
      eventDate: "",
      startTime: "10:00",
      endTime: "18:00",
      guestCount: 50,
      selectedVenue: "",
      selectedSpace: "",
      selectedPackage: "none",
      selectedServices: [],
      customServicePrices: {}
    };
    setEvents([...events, newEvent]);
  };

  const removeEvent = (eventId: string) => {
    setEvents(events.filter(e => e.id !== eventId));
  };

  const updateEvent = (eventId: string, field: string, value: any) => {
    setEvents(events.map(event => 
      event.id === eventId ? { ...event, [field]: value } : event
    ));
  };

  // Calculate pricing for all events with custom pricing support
  useEffect(() => {
    let total = 0;
    
    events.forEach(event => {
      // Add package price (custom or default)
      if (event.selectedPackage && event.selectedPackage !== "none") {
        const pkg = packages.find((p: any) => p.id === event.selectedPackage);
        if (pkg) {
          const basePrice = event.customPackagePrice !== undefined ? event.customPackagePrice : parseFloat(pkg.price);
          const packagePrice = pkg.pricingModel === "per_person" 
            ? basePrice * event.guestCount 
            : basePrice;
          total += packagePrice;
        }
      }
      
      // Add service prices (custom or default)
      event.selectedServices.forEach(serviceId => {
        const service = services.find((s: any) => s.id === serviceId);
        if (service) {
          const basePrice = event.customServicePrices?.[serviceId] !== undefined 
            ? event.customServicePrices[serviceId] 
            : parseFloat(service.price);
          const servicePrice = service.pricingModel === "per_person"
            ? basePrice * event.guestCount
            : basePrice;
          total += servicePrice;
        }
      });
    });
    
    if (!eventData || eventData.totalAmount === undefined) {
      setTotalAmount(total);
    }
    
    // Calculate deposit
    if (depositType === "percentage") {
      setDepositAmount(totalAmount * (depositValue / 100));
    } else {
      setDepositAmount(depositValue);
    }
  }, [events, packages, services, depositType, depositValue, totalAmount, eventData]);

  const createProposalMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/proposals", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Proposal Created",
        description: "The proposal has been created successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/proposals"] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to create proposal",
        variant: "destructive"
      });
    }
  });

  const sendProposalMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/proposals/send", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Proposal Sent",
        description: "The proposal has been sent to the customer via email"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/proposals"] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to send proposal",
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setProposalTitle("");
    setProposalContent("");
    setSelectedCustomer("");
    setValidUntil("");
    setEvents([]);
    setTotalAmount(0);
    setDepositAmount(0);
    setNewCustomerName("");
    setNewCustomerEmail("");
    setNewCustomerPhone("");
  };

  const handleSaveDraft = () => {
    if (!proposalTitle || !selectedCustomer || events.length === 0) {
      toast({
        title: "Error",
        description: "Please fill in proposal title, select customer, and add at least one event",
        variant: "destructive"
      });
      return;
    }

    const proposalData = {
      title: proposalTitle,
      content: proposalContent,
      customerId: selectedCustomer,
      events: events,
      totalAmount: totalAmount.toString(),
      depositAmount: depositAmount.toString(),
      depositType,
      depositValue: depositValue.toString(),
      validUntil: validUntil ? new Date(validUntil) : null,
      status: "draft"
    };
    
    createProposalMutation.mutate(proposalData);
  };

  const handleSendProposal = async () => {
    if (!proposalTitle || !selectedCustomer || events.length === 0) {
      toast({
        title: "Error", 
        description: "Please fill in proposal title, select customer, and add at least one event",
        variant: "destructive"
      });
      return;
    }

    // First save as draft if not already saved
    if (!proposalId) {
      const proposalData = {
        title: proposalTitle,
        content: proposalContent,
        customerId: selectedCustomer,
        events: events,
        totalAmount: totalAmount.toString(),
        depositAmount: depositAmount.toString(),
        depositType,
        depositValue: depositValue.toString(),
        validUntil: validUntil ? new Date(validUntil) : null,
        status: "draft"
      };

      try {
        const response = await apiRequest("POST", "/api/proposals", proposalData);
        const proposal = await response.json();
        setProposalId(proposal.id);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to save proposal before sending",
          variant: "destructive"
        });
        return;
      }
    }

    // Open email preview modal
    setShowEmailPreview(true);
  };

  const handleSendEmail = async (emailData: {
    to: string;
    subject: string;
    message: string;
    proposalViewLink: string;
  }) => {
    await sendEmailMutation.mutateAsync(emailData);
  };

  const customerData = customers.find((c: any) => c.id === selectedCustomer);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-4xl lg:max-w-6xl max-h-[95vh] overflow-hidden flex flex-col p-3 sm:p-6">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
            Create Event Proposal
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
            {/* Left Column - Proposal Configuration */}
            <div className="space-y-4 sm:space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg">Proposal Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                <div>
                  <Label htmlFor="proposalTitle">Proposal Title</Label>
                  <Input
                    id="proposalTitle"
                    value={proposalTitle}
                    onChange={(e) => setProposalTitle(e.target.value)}
                    placeholder="e.g., Corporate Annual Gala Proposal"
                  />
                </div>
                
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <Label htmlFor="customer">Customer</Label>
                    <Button 
                      type="button"
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowCreateCustomer(true)}
                      className="w-full sm:w-auto"
                    >
                      <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      <span className="text-xs sm:text-sm">New Customer</span>
                    </Button>
                  </div>
                  <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
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
                  <Label htmlFor="validUntil">Valid Until</Label>
                  <Input
                    id="validUntil"
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="proposalContent">Proposal Message</Label>
                  <Textarea
                    id="proposalContent"
                    value={proposalContent}
                    onChange={(e) => setProposalContent(e.target.value)}
                    placeholder="Personalized message for the customer..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Multiple Events Configuration */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <CardTitle className="text-base sm:text-lg">Events ({events.length})</CardTitle>
                  <Button 
                    type="button"
                    variant="outline" 
                    size="sm"
                    onClick={addNewEvent}
                    className="w-full sm:w-auto"
                  >
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="text-xs sm:text-sm">Add Event</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                {events.map((event, index) => (
                  <Card key={event.id} className="p-3 sm:p-4 bg-slate-50">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <h4 className="font-medium text-sm sm:text-base">Event {index + 1}</h4>
                      {events.length > 1 && (
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeEvent(event.id)}
                          className="text-red-600 hover:text-red-700 h-8 w-8"
                        >
                          <X className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <Label className="text-sm">Event Name</Label>
                        <Input
                          value={event.eventName}
                          onChange={(e) => updateEvent(event.id, 'eventName', e.target.value)}
                          placeholder="Event name"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Event Type</Label>
                        <Select value={event.eventType} onValueChange={(value) => updateEvent(event.id, 'eventType', value)}>
                          <SelectTrigger className="text-sm">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="wedding">Wedding</SelectItem>
                            <SelectItem value="corporate">Corporate</SelectItem>
                            <SelectItem value="social">Social</SelectItem>
                            <SelectItem value="conference">Conference</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                      <div>
                        <Label className="text-sm">Event Date</Label>
                        <Input
                          type="date"
                          value={event.eventDate}
                          onChange={(e) => updateEvent(event.id, 'eventDate', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Start Time</Label>
                        <Input
                          type="time"
                          value={event.startTime}
                          onChange={(e) => updateEvent(event.id, 'startTime', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">End Time</Label>
                        <Input
                          type="time"
                          value={event.endTime}
                          onChange={(e) => updateEvent(event.id, 'endTime', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm">Guest Count</Label>
                      <Input
                        type="number"
                        min="1"
                        value={event.guestCount}
                        onChange={(e) => updateEvent(event.id, 'guestCount', parseInt(e.target.value) || 0)}
                        className="text-sm"
                      />
                    </div>

                    <div>
                      <Label className="text-sm">Venue</Label>
                      <Select value={event.selectedVenue} onValueChange={(value) => {
                        updateEvent(event.id, 'selectedVenue', value);
                        updateEvent(event.id, 'selectedSpace', ''); // Reset space when venue changes
                      }}>
                        <SelectTrigger className="text-sm">
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

                    {venues.find((v: any) => v.id === event.selectedVenue)?.spaces && (
                      <div>
                        <Label className="text-sm">Space</Label>
                        <Select value={event.selectedSpace} onValueChange={(value) => updateEvent(event.id, 'selectedSpace', value)}>
                          <SelectTrigger className="text-sm">
                            <SelectValue placeholder="Select space" />
                          </SelectTrigger>
                          <SelectContent>
                            {venues.find((v: any) => v.id === event.selectedVenue)?.spaces?.map((space: any) => (
                              <SelectItem key={space.id} value={space.id}>
                                {space.name} - Capacity: {space.capacity}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div>
                      <Label className="text-sm">Package</Label>
                      <Select value={event.selectedPackage} onValueChange={(value) => updateEvent(event.id, 'selectedPackage', value)}>
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Select package" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Package</SelectItem>
                          {packages.map((pkg: any) => (
                            <SelectItem key={pkg.id} value={pkg.id}>
                              {pkg.name} - ${pkg.price}{pkg.pricingModel === "per_person" ? "/person" : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {event.selectedPackage && event.selectedPackage !== "none" && (
                        <div className="mt-2">
                          <Label className="text-xs sm:text-sm text-slate-600">Custom Package Price (Optional)</Label>
                          <div className="space-y-2">
                            <div className="flex flex-col sm:flex-row gap-2">
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder={(() => {
                                  const pkg = packages.find((p: any) => p.id === event.selectedPackage);
                                  return pkg ? `Default: $${pkg.price}` : "Enter custom price";
                                })()}
                                value={event.customPackagePrice || ""}
                                onChange={(e) => updateEvent(event.id, 'customPackagePrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                                className="text-sm flex-1"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => updateEvent(event.id, 'customPackagePrice', undefined)}
                                className="text-xs"
                              >
                                Reset
                              </Button>
                            </div>
                            
                            {/* Quick discount/markup buttons */}
                            <div className="grid grid-cols-4 gap-1">
                              {[10, 15, 20, 25].map(discount => (
                                <Button
                                  key={discount}
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="text-xs py-1 px-2"
                                  onClick={() => {
                                    const pkg = packages.find((p: any) => p.id === event.selectedPackage);
                                    if (pkg) {
                                      const discountedPrice = parseFloat(pkg.price) * (1 - discount / 100);
                                      updateEvent(event.id, 'customPackagePrice', discountedPrice);
                                    }
                                  }}
                                >
                                  -{discount}%
                                </Button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label className="text-sm">Add-on Services</Label>
                      <div className="space-y-3 max-h-48 overflow-y-auto">
                        {services.map((service: any) => (
                          <div key={service.id} className="space-y-2">
                            <div className="flex items-start space-x-2">
                              <Checkbox
                                id={`${event.id}-service-${service.id}`}
                                checked={event.selectedServices.includes(service.id)}
                                onCheckedChange={(checked) => {
                                  const newServices = checked 
                                    ? [...event.selectedServices, service.id]
                                    : event.selectedServices.filter(id => id !== service.id);
                                  updateEvent(event.id, 'selectedServices', newServices);
                                }}
                                className="mt-1"
                              />
                              <Label htmlFor={`${event.id}-service-${service.id}`} className="text-xs sm:text-sm flex-1 leading-tight">
                                {service.name} - ${service.price}{service.pricingModel === "per_person" ? "/person" : ""}
                              </Label>
                            </div>
                            
                            {event.selectedServices.includes(service.id) && (
                              <div className="ml-4 sm:ml-6">
                                <Label className="text-xs text-slate-600">Custom Price (Optional)</Label>
                                <div className="space-y-2">
                                  <div className="flex flex-col sm:flex-row gap-2">
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      placeholder={`Default: $${service.price}`}
                                      value={event.customServicePrices?.[service.id] || ""}
                                      onChange={(e) => {
                                        const customPrices = { ...event.customServicePrices };
                                        if (e.target.value) {
                                          customPrices[service.id] = parseFloat(e.target.value);
                                        } else {
                                          delete customPrices[service.id];
                                        }
                                        updateEvent(event.id, 'customServicePrices', customPrices);
                                      }}
                                      className="text-xs flex-1"
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const customPrices = { ...event.customServicePrices };
                                        delete customPrices[service.id];
                                        updateEvent(event.id, 'customServicePrices', customPrices);
                                      }}
                                      className="text-xs"
                                    >
                                      Reset
                                    </Button>
                                  </div>
                                  
                                  {/* Quick discount buttons for services */}
                                  <div className="grid grid-cols-3 gap-1">
                                    {[10, 15, 20].map(discount => (
                                      <Button
                                        key={discount}
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="text-xs px-2 py-1"
                                        onClick={() => {
                                          const discountedPrice = parseFloat(service.price) * (1 - discount / 100);
                                          const customPrices = { ...event.customServicePrices };
                                          customPrices[service.id] = discountedPrice;
                                          updateEvent(event.id, 'customServicePrices', customPrices);
                                        }}
                                      >
                                        -{discount}%
                                      </Button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}
              </CardContent>
            </Card>

            {/* New Customer Creation Modal */}
            <Dialog open={showCreateCustomer} onOpenChange={setShowCreateCustomer}>
              <DialogContent className="w-[95vw] max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-base sm:text-lg">Create New Customer</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <Label htmlFor="newCustomerName">Customer Name</Label>
                    <Input
                      id="newCustomerName"
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      placeholder="Enter customer name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newCustomerEmail">Email</Label>
                    <Input
                      id="newCustomerEmail"
                      type="email"
                      value={newCustomerEmail}
                      onChange={(e) => setNewCustomerEmail(e.target.value)}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newCustomerPhone">Phone</Label>
                    <Input
                      id="newCustomerPhone"
                      value={newCustomerPhone}
                      onChange={(e) => setNewCustomerPhone(e.target.value)}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setShowCreateCustomer(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => {
                      if (!newCustomerName || !newCustomerEmail) {
                        toast({
                          title: "Error",
                          description: "Name and email are required",
                          variant: "destructive"
                        });
                        return;
                      }
                      createCustomerMutation.mutate({
                        name: newCustomerName,
                        email: newCustomerEmail,
                        phone: newCustomerPhone
                      });
                    }}
                    disabled={createCustomerMutation.isPending}
                  >
                    {createCustomerMutation.isPending ? "Creating..." : "Create Customer"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            </div>

            {/* Right Column - Proposal Preview */}
            <div className="space-y-4 sm:space-y-6">
              {/* Pricing Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg">Pricing Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                <div className="space-y-2">
                  {events.map((event, index) => (
                    <div key={event.id} className="space-y-1">
                      <div className="flex justify-between text-sm font-medium">
                        <span>Event {index + 1} Total</span>
                        <span>${(() => {
                          let eventTotal = 0;
                          if (event.selectedPackage && event.selectedPackage !== "none") {
                            const pkg = packages.find((p: any) => p.id === event.selectedPackage);
                            if (pkg) {
                              const basePrice = event.customPackagePrice !== undefined ? event.customPackagePrice : parseFloat(pkg.price);
                              eventTotal += pkg.pricingModel === "per_person" 
                                ? basePrice * event.guestCount 
                                : basePrice;
                            }
                          }
                          event.selectedServices.forEach(serviceId => {
                            const service = services.find((s: any) => s.id === serviceId);
                            if (service) {
                              const basePrice = event.customServicePrices?.[serviceId] !== undefined 
                                ? event.customServicePrices[serviceId] 
                                : parseFloat(service.price);
                              eventTotal += service.pricingModel === "per_person"
                                ? basePrice * event.guestCount
                                : basePrice;
                            }
                          });
                          return eventTotal.toFixed(2);
                        })()}</span>
                      </div>
                      
                      {/* Show detailed breakdown if custom pricing is used */}
                      {(event.customPackagePrice !== undefined || Object.keys(event.customServicePrices || {}).length > 0) && (
                        <div className="ml-4 text-xs space-y-1">
                          {event.customPackagePrice !== undefined && event.selectedPackage !== "none" && (
                            <div className="flex justify-between text-green-600">
                              <span>• Package (custom):</span>
                              <span>${(() => {
                                const pkg = packages.find((p: any) => p.id === event.selectedPackage);
                                if (!pkg) return "0.00";
                                const price = pkg.pricingModel === "per_person" 
                                  ? event.customPackagePrice * event.guestCount 
                                  : event.customPackagePrice;
                                return price.toFixed(2);
                              })()}</span>
                            </div>
                          )}
                          {Object.keys(event.customServicePrices || {}).map(serviceId => {
                            const service = services.find((s: any) => s.id === serviceId);
                            if (!service || !event.customServicePrices) return null;
                            const price = service.pricingModel === "per_person"
                              ? event.customServicePrices[serviceId] * event.guestCount
                              : event.customServicePrices[serviceId];
                            return (
                              <div key={serviceId} className="flex justify-between text-green-600">
                                <span>• {service.name} (custom):</span>
                                <span>${price.toFixed(2)}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                <Separator />
                
                <div className="flex justify-between font-semibold">
                  <span>Total Amount</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>

                <div className="space-y-3 pt-3 sm:pt-4 border-t">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label className="text-sm">Deposit Type</Label>
                      <Select value={depositType} onValueChange={setDepositType}>
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage</SelectItem>
                          <SelectItem value="fixed">Fixed Amount</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm">Deposit {depositType === "percentage" ? "%" : "$"}</Label>
                      <Input
                        type="number"
                        min="0"
                        value={depositValue}
                        onChange={(e) => setDepositValue(parseFloat(e.target.value) || 0)}
                        className="text-sm"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-between font-medium">
                    <span>Deposit Amount</span>
                    <span>${depositAmount.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preview */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">Proposal Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="p-3 sm:p-4 bg-slate-50 rounded border">
                  <h4 className="font-semibold mb-2 text-sm sm:text-base">{proposalTitle || "Event Proposal"}</h4>
                  <p className="text-xs sm:text-sm text-slate-600 mb-3">
                    {customerData ? `To: ${customerData.name}` : "Select a customer"}
                  </p>
                  
                  {events.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="font-medium text-xs sm:text-sm">Events:</h5>
                      {events.map((event, index) => (
                        <div key={event.id} className="text-xs sm:text-sm">
                          <div className="font-medium">{event.eventName || `Event ${index + 1}`}</div>
                          <div className="text-slate-600">
                            {event.eventDate && format(new Date(event.eventDate), 'MMM d, yyyy')} • {event.startTime} - {event.endTime}
                          </div>
                          <div className="text-slate-600">
                            {venues.find((v: any) => v.id === event.selectedVenue)?.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="mt-3 pt-3 border-t text-xs sm:text-sm">
                    <div className="flex justify-between">
                      <span>Total:</span>
                      <span className="font-medium">${totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Deposit:</span>
                      <span className="font-medium">${depositAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        </div>

        {/* Action Buttons */}
        <div className="flex-shrink-0 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 sm:pt-6 border-t">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto order-3 sm:order-1"
          >
            Cancel
          </Button>
          <Button 
            variant="outline"
            onClick={handleSaveDraft}
            disabled={createProposalMutation.isPending || !proposalTitle || !selectedCustomer}
            className="w-full sm:w-auto order-2"
          >
            <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
            <span className="text-sm">{createProposalMutation.isPending ? "Saving..." : "Save Draft"}</span>
          </Button>
          <Button 
            onClick={handleSendProposal}
            disabled={sendProposalMutation.isPending || !proposalTitle || !selectedCustomer}
            className="w-full sm:w-auto order-1 sm:order-3"
          >
            <Send className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
            <span className="text-sm">{sendProposalMutation.isPending ? "Sending..." : "Send Proposal"}</span>
          </Button>
        </div>
      </DialogContent>
      
      {/* Email Preview Modal */}
      <EmailPreviewModal
        open={showEmailPreview}
        onOpenChange={setShowEmailPreview}
        eventData={{
          eventName: proposalTitle,
          customerId: selectedCustomer,
          eventDates: events.map(event => ({
            date: new Date(event.eventDate),
            startTime: event.startTime,
            endTime: event.endTime,
            venue: venues.find((v: any) => v.id === event.selectedVenue)?.name || event.selectedVenue,
            space: venues.find((v: any) => v.id === event.selectedVenue)?.spaces?.find((s: any) => s.id === event.selectedSpace)?.name || event.selectedSpace,
            guestCount: event.guestCount,
            totalAmount: (() => {
              let eventTotal = 0;
              if (event.selectedPackage && event.selectedPackage !== "none") {
                const pkg = packages.find((p: any) => p.id === event.selectedPackage);
                if (pkg) {
                  const basePrice = event.customPackagePrice !== undefined ? event.customPackagePrice : parseFloat(pkg.price);
                  eventTotal += pkg.pricingModel === "per_person" 
                    ? basePrice * event.guestCount 
                    : basePrice;
                }
              }
              event.selectedServices.forEach(serviceId => {
                const service = services.find((s: any) => s.id === serviceId);
                if (service) {
                  const basePrice = event.customServicePrices?.[serviceId] !== undefined 
                    ? event.customServicePrices[serviceId] 
                    : parseFloat(service.price);
                  eventTotal += service.pricingModel === "per_person"
                    ? basePrice * event.guestCount
                    : basePrice;
                }
              });
              return eventTotal;
            })()
          })),
          totalAmount,
          customerData
        }}
        onSend={handleSendEmail}
      />
    </Dialog>
  );
}