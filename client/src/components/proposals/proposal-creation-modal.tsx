import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { 
  FileText, 
  DollarSign, 
  Calendar, 
  Users, 
  MapPin, 
  Mail, 
  Eye, 
  CreditCard,
  Send,
  Save,
  Clock
} from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventData?: any; // Data from event creation flow
  customer?: any; // Selected customer
}

export function ProposalCreationModal({ open, onOpenChange, eventData, customer }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Proposal data
  const [proposalTitle, setProposalTitle] = useState("");
  const [proposalContent, setProposalContent] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(customer?.id || "");
  const [validUntil, setValidUntil] = useState("");
  
  // Event configuration
  const [eventName, setEventName] = useState("");
  const [eventType, setEventType] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("18:00");
  const [guestCount, setGuestCount] = useState(50);
  const [selectedVenue, setSelectedVenue] = useState("");
  const [selectedSpace, setSelectedSpace] = useState("");
  const [selectedPackage, setSelectedPackage] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  
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

  // Initialize with event data if provided
  useEffect(() => {
    if (eventData && open) {
      setEventName(eventData.eventName || "");
      setEventType(eventData.eventType || "");
      setEventDate(eventData.eventDate || "");
      setStartTime(eventData.startTime || "10:00");
      setEndTime(eventData.endTime || "18:00");
      setGuestCount(eventData.guestCount || 50);
      setSelectedVenue(eventData.venueId || "");
      setSelectedSpace(eventData.spaceId || "");
      setSelectedPackage(eventData.packageId || "");
      setSelectedServices(eventData.selectedServices || []);
      setProposalTitle(`${eventData.eventName || "Event"} Proposal`);
    }
  }, [eventData, open]);

  // Calculate pricing
  useEffect(() => {
    let total = 0;
    
    // Add package price
    if (selectedPackage && selectedPackage !== "none") {
      const pkg = packages.find((p: any) => p.id === selectedPackage);
      if (pkg) {
        const packagePrice = pkg.pricingModel === "per_person" 
          ? parseFloat(pkg.price) * guestCount 
          : parseFloat(pkg.price);
        total += packagePrice;
      }
    }
    
    // Add service prices
    selectedServices.forEach(serviceId => {
      const service = services.find((s: any) => s.id === serviceId);
      if (service) {
        const servicePrice = service.pricingModel === "per_person"
          ? parseFloat(service.price) * guestCount
          : parseFloat(service.price);
        total += servicePrice;
      }
    });
    
    setTotalAmount(total);
    
    // Calculate deposit
    if (depositType === "percentage") {
      setDepositAmount(total * (depositValue / 100));
    } else {
      setDepositAmount(depositValue);
    }
  }, [selectedPackage, selectedServices, guestCount, packages, services, depositType, depositValue]);

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
    setEventName("");
    setEventType("");
    setEventDate("");
    setStartTime("10:00");
    setEndTime("18:00");
    setGuestCount(50);
    setSelectedVenue("");
    setSelectedSpace("");
    setSelectedPackage("");
    setSelectedServices([]);
    setTotalAmount(0);
    setDepositAmount(0);
  };

  const handleSaveDraft = () => {
    const proposalData = {
      title: proposalTitle,
      content: proposalContent,
      customerId: selectedCustomer,
      eventName,
      eventType,
      eventDate: eventDate ? new Date(eventDate) : null,
      startTime,
      endTime,
      guestCount,
      venueId: selectedVenue,
      spaceId: selectedSpace,
      packageId: selectedPackage,
      selectedServices,
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
    const proposalData = {
      title: proposalTitle,
      content: proposalContent,
      customerId: selectedCustomer,
      eventName,
      eventType,
      eventDate: eventDate ? new Date(eventDate) : null,
      startTime,
      endTime,
      guestCount,
      venueId: selectedVenue,
      spaceId: selectedSpace,
      packageId: selectedPackage,
      selectedServices,
      totalAmount: totalAmount.toString(),
      depositAmount: depositAmount.toString(),
      depositType,
      depositValue: depositValue.toString(),
      validUntil: validUntil ? new Date(validUntil) : null,
      status: "sent"
    };
    
    sendProposalMutation.mutate(proposalData);
  };

  const selectedVenueData = venues.find((v: any) => v.id === selectedVenue);
  const selectedSpaceData = selectedVenueData?.spaces?.find((s: any) => s.id === selectedSpace);
  const selectedPackageData = packages.find((p: any) => p.id === selectedPackage);
  const selectedServicesData = services.filter((s: any) => selectedServices.includes(s.id));
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
                  <Label htmlFor="customer">Customer</Label>
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

            {/* Event Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Event Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="eventName">Event Name</Label>
                    <Input
                      id="eventName"
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                      placeholder="Event name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="eventType">Event Type</Label>
                    <Select value={eventType} onValueChange={setEventType}>
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
                    <Label htmlFor="eventDate">Event Date</Label>
                    <Input
                      id="eventDate"
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="guestCount">Guest Count</Label>
                  <Input
                    id="guestCount"
                    type="number"
                    min="1"
                    value={guestCount}
                    onChange={(e) => setGuestCount(parseInt(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <Label htmlFor="venue">Venue</Label>
                  <Select value={selectedVenue} onValueChange={(value) => {
                    setSelectedVenue(value);
                    setSelectedSpace(""); // Reset space when venue changes
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

                {selectedVenueData?.spaces && (
                  <div>
                    <Label htmlFor="space">Space</Label>
                    <Select value={selectedSpace} onValueChange={setSelectedSpace}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select space" />
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
              </CardContent>
            </Card>

            {/* Package and Services */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Packages & Services</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="package">Package</Label>
                  <Select value={selectedPackage} onValueChange={setSelectedPackage}>
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
                  <Label>Additional Services</Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                    {services.map((service: any) => (
                      <div key={service.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={service.id}
                          checked={selectedServices.includes(service.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedServices(prev => [...prev, service.id]);
                            } else {
                              setSelectedServices(prev => prev.filter(id => id !== service.id));
                            }
                          }}
                        />
                        <Label htmlFor={service.id} className="flex-1 cursor-pointer">
                          {service.name} - ${service.price}{service.pricingModel === "per_person" ? "/person" : ""}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Deposit Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Deposit Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="depositType">Deposit Type</Label>
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
                    <Label htmlFor="depositValue">
                      Deposit Value ({depositType === "percentage" ? "%" : "$"})
                    </Label>
                    <Input
                      id="depositValue"
                      type="number"
                      min="0"
                      value={depositValue}
                      onChange={(e) => setDepositValue(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-600 mb-2">Calculated Deposit Amount:</div>
                  <div className="text-xl font-semibold text-green-600">
                    ${depositAmount.toFixed(2)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Preview */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Proposal Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Customer Info */}
                {customerData && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Customer</span>
                    </div>
                    <div className="text-sm">
                      <div className="font-medium">{customerData.name}</div>
                      <div className="text-gray-600">{customerData.email}</div>
                      {customerData.company && <div className="text-gray-600">{customerData.company}</div>}
                    </div>
                  </div>
                )}

                {/* Event Summary */}
                <div>
                  <h4 className="font-medium mb-3">Event Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>{eventDate ? format(new Date(eventDate), "MMMM d, yyyy") : "Date TBD"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>{startTime} - {endTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span>{guestCount} guests</span>
                    </div>
                    {selectedVenueData && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{selectedVenueData.name}{selectedSpaceData && ` - ${selectedSpaceData.name}`}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pricing Breakdown */}
                <div>
                  <h4 className="font-medium mb-3">Pricing Breakdown</h4>
                  <div className="space-y-2 text-sm">
                    {selectedPackageData && (
                      <div className="flex justify-between">
                        <span>{selectedPackageData.name}</span>
                        <span>${(selectedPackageData.pricingModel === "per_person" 
                          ? parseFloat(selectedPackageData.price) * guestCount 
                          : parseFloat(selectedPackageData.price)).toFixed(2)}</span>
                      </div>
                    )}
                    {selectedServicesData.map((service: any) => (
                      <div key={service.id} className="flex justify-between">
                        <span>{service.name}</span>
                        <span>${(service.pricingModel === "per_person"
                          ? parseFloat(service.price) * guestCount
                          : parseFloat(service.price)).toFixed(2)}</span>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span>Total Amount</span>
                      <span>${totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-green-600 font-medium">
                      <span>Required Deposit</span>
                      <span>${depositAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Status Indicators */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Eye className="h-4 w-4 text-gray-400" />
                    <span>Customer will receive email notification</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CreditCard className="h-4 w-4 text-gray-400" />
                    <span>Online deposit payment enabled</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>Email open tracking enabled</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-6 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={createProposalMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            <Button
              onClick={handleSendProposal}
              disabled={sendProposalMutation.isPending || !selectedCustomer || !proposalTitle}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="h-4 w-4 mr-2" />
              Send Proposal
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}