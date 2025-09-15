import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  MapPin,
  Users,
  Calendar,
  Star,
  DollarSign,
  Wifi,
  Car,
  Coffee,
  Music,
  Camera,
  Utensils,
  Send,
  Heart,
  Share,
  Clock,
  Building,
  Phone,
  Mail
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Venue {
  id: string;
  name: string;
  description: string;
  amenities: string[];
  image_url: string;
  tenant_id: string;
  tenant_name: string;
  tenant_slug: string;
  primary_color: string;
  spaces: Space[];
  packages: Package[];
  services: Service[];
}

interface Space {
  id: string;
  name: string;
  description: string;
  capacity: number;
  amenities: string[];
  image_url: string;
  base_price: number;
  hourly_rate: number;
}

interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
}

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
}

export default function VenueDetail() {
  const params = useParams();
  const venueId = params.id;
  const { toast } = useToast();

  const [inquiryData, setInquiryData] = useState({
    eventName: "",
    eventType: "corporate",
    eventDate: "",
    startTime: "",
    endTime: "",
    guestCount: "",
    isMultiDay: false,
    endDate: "",
    spaceId: "",
    setupStyle: "",
    message: "",
    specialRequests: "",
    budgetRange: "",
    cateringNeeded: false,
    avEquipmentNeeded: false,
    decorationsNeeded: false,
    // Guest contact info
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    contactCompany: ""
  });

  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch venue details
  const { data: venue, isLoading, error } = useQuery<Venue>({
    queryKey: [`/api/public/venues?venueId=${venueId}`],
    queryFn: () => apiRequest(`/api/public/venues?venueId=${venueId}`),
    enabled: !!venueId
  });

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inquiryData.eventName || !inquiryData.eventDate || !inquiryData.guestCount || !inquiryData.contactName || !inquiryData.contactEmail) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await apiRequest("/api/public/inquiries", {
        method: "POST",
        body: JSON.stringify({
          venueId,
          ...inquiryData,
          guestCount: parseInt(inquiryData.guestCount)
        })
      });

      toast({
        title: "Inquiry Sent!",
        description: "Your inquiry has been submitted successfully. The venue team will contact you soon."
      });

      // Reset form
      setInquiryData({
        eventName: "",
        eventType: "corporate",
        eventDate: "",
        startTime: "",
        endTime: "",
        guestCount: "",
        isMultiDay: false,
        endDate: "",
        spaceId: "",
        setupStyle: "",
        message: "",
        specialRequests: "",
        budgetRange: "",
        cateringNeeded: false,
        avEquipmentNeeded: false,
        decorationsNeeded: false,
        contactName: "",
        contactEmail: "",
        contactPhone: "",
        contactCompany: ""
      });
      setShowInquiryForm(false);

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit inquiry",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAmenityIcon = (amenity: string) => {
    const amenityLower = amenity.toLowerCase();
    if (amenityLower.includes('wifi') || amenityLower.includes('internet')) return <Wifi className="w-4 h-4" />;
    if (amenityLower.includes('parking')) return <Car className="w-4 h-4" />;
    if (amenityLower.includes('coffee') || amenityLower.includes('catering')) return <Coffee className="w-4 h-4" />;
    if (amenityLower.includes('sound') || amenityLower.includes('audio') || amenityLower.includes('music')) return <Music className="w-4 h-4" />;
    if (amenityLower.includes('photo') || amenityLower.includes('camera')) return <Camera className="w-4 h-4" />;
    if (amenityLower.includes('kitchen') || amenityLower.includes('food')) return <Utensils className="w-4 h-4" />;
    return <Star className="w-4 h-4" />;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-64 bg-gray-300 rounded-lg mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-8 bg-gray-300 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 rounded"></div>
                <div className="h-4 bg-gray-300 rounded w-2/3"></div>
              </div>
              <div className="space-y-4">
                <div className="h-64 bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !venue) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Venue Not Found</h1>
          <p className="text-gray-600 mb-6">The venue you're looking for doesn't exist or is no longer available.</p>
          <Link href="/explore/venues">
            <a>
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Venues
              </Button>
            </a>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/explore/venues">
                <a className="flex items-center text-gray-600 hover:text-gray-900">
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back to Venues
                </a>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Heart className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button variant="ghost" size="sm">
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Link href="/customer/login">
                <a>
                  <Button size="sm">Login</Button>
                </a>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Image */}
      <div className="relative h-64 md:h-96">
        {venue.image_url ? (
          <img
            src={venue.image_url}
            alt={venue.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex items-center justify-center">
            <Building className="w-24 h-24 text-blue-500" />
          </div>
        )}
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{venue.name}</h1>
            <p className="text-xl text-white opacity-90">{venue.tenant_name}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>About This Venue</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  {venue.description || "Welcome to our beautiful venue, perfect for hosting memorable events. Our team is dedicated to making your special occasion unforgettable."}
                </p>
              </CardContent>
            </Card>

            {/* Amenities */}
            {venue.amenities && venue.amenities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Amenities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {venue.amenities.map((amenity, idx) => (
                      <div key={idx} className="flex items-center space-x-3">
                        {getAmenityIcon(amenity)}
                        <span className="text-gray-700">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Spaces */}
            {venue.spaces && venue.spaces.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Available Spaces</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {venue.spaces.map((space) => (
                      <Card key={space.id} className="border">
                        <CardHeader>
                          <CardTitle className="text-lg">{space.name}</CardTitle>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Users className="w-4 h-4 mr-1" />
                              Up to {space.capacity} guests
                            </div>
                            {space.base_price > 0 && (
                              <div className="flex items-center">
                                <DollarSign className="w-4 h-4 mr-1" />
                                From ${space.base_price}
                              </div>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-700 mb-4">{space.description}</p>
                          {space.amenities && space.amenities.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {space.amenities.slice(0, 3).map((amenity, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {amenity}
                                </Badge>
                              ))}
                              {space.amenities.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{space.amenities.length - 3} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Packages */}
            {venue.packages && venue.packages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Event Packages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {venue.packages.map((pkg) => (
                      <Card key={pkg.id} className="border">
                        <CardHeader>
                          <CardTitle className="text-lg flex justify-between items-center">
                            {pkg.name}
                            <span className="text-2xl font-bold text-blue-600">
                              ${pkg.price}
                            </span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-700 mb-4">{pkg.description}</p>
                          {pkg.features && pkg.features.length > 0 && (
                            <ul className="space-y-2">
                              {pkg.features.map((feature, idx) => (
                                <li key={idx} className="flex items-center text-sm text-gray-600">
                                  <Star className="w-3 h-3 mr-2 text-green-500" />
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Inquiry Form */}
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Request Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!showInquiryForm ? (
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      Interested in hosting your event here? Send an inquiry to get pricing and availability.
                    </p>
                    <Button
                      onClick={() => setShowInquiryForm(true)}
                      className="w-full"
                      size="lg"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send Inquiry
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleInquirySubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <Label htmlFor="eventName">Event Name *</Label>
                        <Input
                          id="eventName"
                          value={inquiryData.eventName}
                          onChange={(e) => setInquiryData(prev => ({ ...prev, eventName: e.target.value }))}
                          placeholder="Wedding Reception"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="eventType">Event Type</Label>
                        <Select
                          value={inquiryData.eventType}
                          onValueChange={(value) => setInquiryData(prev => ({ ...prev, eventType: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="wedding">Wedding</SelectItem>
                            <SelectItem value="corporate">Corporate Event</SelectItem>
                            <SelectItem value="birthday">Birthday Party</SelectItem>
                            <SelectItem value="anniversary">Anniversary</SelectItem>
                            <SelectItem value="conference">Conference</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="guestCount">Guest Count *</Label>
                        <Input
                          id="guestCount"
                          type="number"
                          value={inquiryData.guestCount}
                          onChange={(e) => setInquiryData(prev => ({ ...prev, guestCount: e.target.value }))}
                          placeholder="50"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="eventDate">Event Date *</Label>
                        <Input
                          id="eventDate"
                          type="date"
                          value={inquiryData.eventDate}
                          onChange={(e) => setInquiryData(prev => ({ ...prev, eventDate: e.target.value }))}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="startTime">Start Time</Label>
                        <Input
                          id="startTime"
                          type="time"
                          value={inquiryData.startTime}
                          onChange={(e) => setInquiryData(prev => ({ ...prev, startTime: e.target.value }))}
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="font-medium">Contact Information</h4>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <Label htmlFor="contactName">Your Name *</Label>
                          <Input
                            id="contactName"
                            value={inquiryData.contactName}
                            onChange={(e) => setInquiryData(prev => ({ ...prev, contactName: e.target.value }))}
                            placeholder="John Smith"
                            required
                          />
                        </div>

                        <div className="col-span-2">
                          <Label htmlFor="contactEmail">Email *</Label>
                          <Input
                            id="contactEmail"
                            type="email"
                            value={inquiryData.contactEmail}
                            onChange={(e) => setInquiryData(prev => ({ ...prev, contactEmail: e.target.value }))}
                            placeholder="john@example.com"
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="contactPhone">Phone</Label>
                          <Input
                            id="contactPhone"
                            type="tel"
                            value={inquiryData.contactPhone}
                            onChange={(e) => setInquiryData(prev => ({ ...prev, contactPhone: e.target.value }))}
                            placeholder="(555) 123-4567"
                          />
                        </div>

                        <div>
                          <Label htmlFor="contactCompany">Company</Label>
                          <Input
                            id="contactCompany"
                            value={inquiryData.contactCompany}
                            onChange={(e) => setInquiryData(prev => ({ ...prev, contactCompany: e.target.value }))}
                            placeholder="Acme Corp"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        value={inquiryData.message}
                        onChange={(e) => setInquiryData(prev => ({ ...prev, message: e.target.value }))}
                        placeholder="Tell us about your event..."
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="catering"
                          checked={inquiryData.cateringNeeded}
                          onCheckedChange={(checked) => setInquiryData(prev => ({ ...prev, cateringNeeded: checked as boolean }))}
                        />
                        <Label htmlFor="catering" className="text-sm">Catering needed</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="av"
                          checked={inquiryData.avEquipmentNeeded}
                          onCheckedChange={(checked) => setInquiryData(prev => ({ ...prev, avEquipmentNeeded: checked as boolean }))}
                        />
                        <Label htmlFor="av" className="text-sm">A/V equipment needed</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="decorations"
                          checked={inquiryData.decorationsNeeded}
                          onCheckedChange={(checked) => setInquiryData(prev => ({ ...prev, decorationsNeeded: checked as boolean }))}
                        />
                        <Label htmlFor="decorations" className="text-sm">Decorations needed</Label>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowInquiryForm(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1"
                      >
                        {isSubmitting ? "Sending..." : "Send Inquiry"}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Building className="w-5 h-5 text-gray-400" />
                  <span>{venue.tenant_name}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <span>View on map</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <span>Contact for phone number</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span>Send inquiry for email</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}