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
          selectedServices: eventDate.selectedServices || []
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
          selectedServices: eventData.selectedServices || []
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
      selectedServices: []
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

  // Calculate pricing for all events
  useEffect(() => {
    let total = 0;
    
    events.forEach(event => {
      // Add package price
      if (event.selectedPackage && event.selectedPackage !== "none") {
        const pkg = packages.find((p: any) => p.id === event.selectedPackage);
        if (pkg) {
          const packagePrice = pkg.pricingModel === "per_person" 
            ? parseFloat(pkg.price) * event.guestCount 
            : parseFloat(pkg.price);
          total += packagePrice;
        }
      }
      
      // Add service prices
      event.selectedServices.forEach(serviceId => {
        const service = services.find((s: any) => s.id === serviceId);
        if (service) {
          const servicePrice = service.pricingModel === "per_person"
            ? parseFloat(service.price) * event.guestCount
            : parseFloat(service.price);
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

  const handleSendProposal = () => {
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
      status: "sent"
    };
    
    sendProposalMutation.mutate(proposalData);
  };

  const customerData = customers.find((c: any) => c.id === selectedCustomer);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Create Event Proposal
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Proposal Configuration */}
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Proposal Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  <div className="flex items-center justify-between">
                    <Label htmlFor="customer">Customer</Label>
                    <Button 
                      type="button"
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowCreateCustomer(true)}
                    >
                      <Users className="h-4 w-4 mr-1" />
                      New Customer
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
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Events ({events.length})</CardTitle>
                  <Button 
                    type="button"
                    variant="outline" 
                    size="sm"
                    onClick={addNewEvent}
                  >
                    <Calendar className="h-4 w-4 mr-1" />
                    Add Event
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {events.map((event, index) => (
                  <Card key={event.id} className="p-4 bg-slate-50">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">Event {index + 1}</h4>
                      {events.length > 1 && (
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeEvent(event.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Event Name</Label>
                        <Input
                          value={event.eventName}
                          onChange={(e) => updateEvent(event.id, 'eventName', e.target.value)}
                          placeholder="Event name"
                        />
                      </div>
                      <div>
                        <Label>Event Type</Label>
                        <Select value={event.eventType} onValueChange={(value) => updateEvent(event.id, 'eventType', value)}>
                          <SelectTrigger>
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

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Event Date</Label>
                        <Input
                          type="date"
                          value={event.eventDate}
                          onChange={(e) => updateEvent(event.id, 'eventDate', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Start Time</Label>
                        <Input
                          type="time"
                          value={event.startTime}
                          onChange={(e) => updateEvent(event.id, 'startTime', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>End Time</Label>
                        <Input
                          type="time"
                          value={event.endTime}
                          onChange={(e) => updateEvent(event.id, 'endTime', e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Guest Count</Label>
                      <Input
                        type="number"
                        min="1"
                        value={event.guestCount}
                        onChange={(e) => updateEvent(event.id, 'guestCount', parseInt(e.target.value) || 0)}
                      />
                    </div>

                    <div>
                      <Label>Venue</Label>
                      <Select value={event.selectedVenue} onValueChange={(value) => {
                        updateEvent(event.id, 'selectedVenue', value);
                        updateEvent(event.id, 'selectedSpace', ''); // Reset space when venue changes
                      }}>
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

                    {venues.find((v: any) => v.id === event.selectedVenue)?.spaces && (
                      <div>
                        <Label>Space</Label>
                        <Select value={event.selectedSpace} onValueChange={(value) => updateEvent(event.id, 'selectedSpace', value)}>
                          <SelectTrigger>
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
                      <Label>Package</Label>
                      <Select value={event.selectedPackage} onValueChange={(value) => updateEvent(event.id, 'selectedPackage', value)}>
                        <SelectTrigger>
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
                    </div>

                    <div>
                      <Label>Add-on Services</Label>
                      <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                        {services.map((service: any) => (
                          <div key={service.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`${event.id}-service-${service.id}`}
                              checked={event.selectedServices.includes(service.id)}
                              onCheckedChange={(checked) => {
                                const newServices = checked 
                                  ? [...event.selectedServices, service.id]
                                  : event.selectedServices.filter(id => id !== service.id);
                                updateEvent(event.id, 'selectedServices', newServices);
                              }}
                            />
                            <Label htmlFor={`${event.id}-service-${service.id}`} className="text-sm">
                              {service.name} - ${service.price}{service.pricingModel === "per_person" ? "/person" : ""}
                            </Label>
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
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Customer</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
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
          <div className="space-y-6">
            {/* Pricing Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pricing Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {events.map((event, index) => (
                    <div key={event.id} className="flex justify-between text-sm">
                      <span>Event {index + 1} Total</span>
                      <span>${(() => {
                        let eventTotal = 0;
                        if (event.selectedPackage && event.selectedPackage !== "none") {
                          const pkg = packages.find((p: any) => p.id === event.selectedPackage);
                          if (pkg) {
                            eventTotal += pkg.pricingModel === "per_person" 
                              ? parseFloat(pkg.price) * event.guestCount 
                              : parseFloat(pkg.price);
                          }
                        }
                        event.selectedServices.forEach(serviceId => {
                          const service = services.find((s: any) => s.id === serviceId);
                          if (service) {
                            eventTotal += service.pricingModel === "per_person"
                              ? parseFloat(service.price) * event.guestCount
                              : parseFloat(service.price);
                          }
                        });
                        return eventTotal.toFixed(2);
                      })()}</span>
                    </div>
                  ))}
                </div>
                
                <Separator />
                
                <div className="flex justify-between font-semibold">
                  <span>Total Amount</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Deposit Type</Label>
                      <Select value={depositType} onValueChange={setDepositType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage</SelectItem>
                          <SelectItem value="fixed">Fixed Amount</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Deposit {depositType === "percentage" ? "%" : "$"}</Label>
                      <Input
                        type="number"
                        min="0"
                        value={depositValue}
                        onChange={(e) => setDepositValue(parseFloat(e.target.value) || 0)}
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
              <CardHeader>
                <CardTitle className="text-lg">Proposal Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-slate-50 rounded border">
                  <h4 className="font-semibold mb-2">{proposalTitle || "Event Proposal"}</h4>
                  <p className="text-sm text-slate-600 mb-3">
                    {customerData ? `To: ${customerData.name}` : "Select a customer"}
                  </p>
                  
                  {events.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="font-medium text-sm">Events:</h5>
                      {events.map((event, index) => (
                        <div key={event.id} className="text-sm">
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
                  
                  <div className="mt-3 pt-3 border-t text-sm">
                    <div>Total: ${totalAmount.toFixed(2)}</div>
                    <div>Deposit: ${depositAmount.toFixed(2)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            variant="outline"
            onClick={handleSaveDraft}
            disabled={createProposalMutation.isPending || !proposalTitle || !selectedCustomer}
          >
            <Save className="h-4 w-4 mr-2" />
            {createProposalMutation.isPending ? "Saving..." : "Save Draft"}
          </Button>
          <Button 
            onClick={handleSendProposal}
            disabled={sendProposalMutation.isPending || !proposalTitle || !selectedCustomer}
          >
            <Send className="h-4 w-4 mr-2" />
            {sendProposalMutation.isPending ? "Sending..." : "Send Proposal"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}