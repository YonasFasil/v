import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  ArrowLeft, MapPin, Users, Star, Wifi, Car, Coffee, Music, Utensils, Check, Send
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock data for gallery, as it's not in the API response
const mockGallery = [
  "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=2071&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2232&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?q=80&w=2070&auto=format&fit=crop",
];

interface Venue {
  id: string;
  name: string;
  description: string;
  amenities: string[];
  image_url: string;
  tenant_name: string;
  city: string;
  state: string;
  spaces: Space[];
}

interface Space {
  id: string;
  name: string;
  capacity: number;
}

const AmenityIcon = ({ amenity }: { amenity: string }) => {
  const lowerAmenity = amenity.toLowerCase();
  if (lowerAmenity.includes('wifi')) return <Wifi className="w-5 h-5" />;
  if (lowerAmenity.includes('parking')) return <Car className="w-5 h-5" />;
  if (lowerAmenity.includes('catering')) return <Utensils className="w-5 h-5" />;
  if (lowerAmenity.includes('coffee')) return <Coffee className="w-5 h-5" />;
  if (lowerAmenity.includes('sound') || lowerAmenity.includes('audio')) return <Music className="w-5 h-5" />;
  return <Check className="w-5 h-5" />;
};

export default function VenueDetail() {
  const params = useParams();
  const venueId = params.id;
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: venue, isLoading, error } = useQuery<Venue>({
    queryKey: [`/api/public/venues?venueId=${venueId}`],
    queryFn: () => apiRequest(`/api/public/venues?venueId=${venueId}`),
    enabled: !!venueId,
  });

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Basic form data from the event
    const formData = new FormData(e.target as HTMLFormElement);
    const inquiryData = Object.fromEntries(formData.entries());

    try {
      await apiRequest("/api/public/inquiries", {
        method: "POST",
        body: JSON.stringify({ venueId, ...inquiryData }),
      });
      toast({
        title: "Inquiry Sent!",
        description: "The venue will be in touch with you shortly.",
      });
    } catch (err) {
      toast({
        title: "Submission Failed",
        description: "There was an error sending your inquiry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white animate-pulse">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="h-12 bg-gray-200 rounded-full w-1/4 mb-12"></div>
          <div className="grid grid-cols-2 gap-4 h-[500px]">
            <div className="col-span-1 bg-gray-200 rounded-xl"></div>
            <div className="col-span-1 grid grid-cols-2 gap-4">
              <div className="bg-gray-200 rounded-xl"></div>
              <div className="bg-gray-200 rounded-xl"></div>
              <div className="bg-gray-200 rounded-xl"></div>
              <div className="bg-gray-200 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !venue) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Venue Not Found</h1>
          <p className="text-gray-600 mb-6">This venue may no longer be available.</p>
          <Link href="/explore/venues">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Venues
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/explore/venues">
              <a className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Venues
              </a>
            </Link>
            <div className="flex items-center space-x-4 text-sm font-medium text-gray-600">
              <Link href="/customer/login">
                <a className="hover:text-gray-900 transition-colors">Login</a>
              </Link>
              <Link href="/customer/signup">
                <a className="bg-gray-900 text-white px-4 py-2 rounded-full hover:bg-gray-700 transition-colors">
                  Sign Up
                </a>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">{venue.name}</h1>
          <div className="flex items-center space-x-4 mt-2 text-gray-600">
            <div className="flex items-center">
              <Star className="w-4 h-4 text-yellow-500 mr-1" />
              <span className="font-medium">4.9</span>
              <span className="text-gray-500 ml-1">(120 reviews)</span>
            </div>
            <span>•</span>
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              <span>{venue.city}, {venue.state}</span>
            </div>
          </div>
        </div>

        {/* Image Gallery */}
        <div className="grid grid-cols-2 grid-rows-2 gap-2 h-[500px] rounded-2xl overflow-hidden">
          <div className="col-span-1 row-span-2">
            <img src={venue.image_urls?.[0] || venue.image_url || mockGallery[0]} alt={venue.name} className="w-full h-full object-cover" />
          </div>
          <div className="col-span-1">
            <img src={venue.image_urls?.[1] || mockGallery[1]} alt="Venue detail" className="w-full h-full object-cover" />
          </div>
          <div className="col-span-1">
            <img src={venue.image_urls?.[2] || mockGallery[2]} alt="Venue detail" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-16 mt-16">
          <div className="lg:col-span-2">
            <div className="pb-8 border-b border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-900">Hosted by {venue.tenant_name}</h2>
              <div className="flex items-center space-x-4 mt-2 text-gray-600">
                {venue.spaces && venue.spaces.slice(0, 3).map(space => (
                  <span key={space.id}>{space.capacity} guests</span>
                ))}
              </div>
            </div>

            <div className="py-8 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">About this space</h3>
              <p className="text-gray-700 leading-relaxed">{venue.description}</p>
            </div>

            <div className="py-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">What this place offers</h3>
              <div className="grid grid-cols-2 gap-4">
                {venue.amenities && venue.amenities.map((amenity, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <AmenityIcon amenity={amenity} />
                    <span className="text-gray-700">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sticky Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <form onSubmit={handleInquirySubmit} className="border border-gray-200 rounded-xl shadow-lg p-6">
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">Request to book</h3>
                <div className="space-y-4">
                  <input type="text" name="contactName" placeholder="Full Name" required className="w-full p-3 border border-gray-300 rounded-lg" />
                  <input type="email" name="contactEmail" placeholder="Email Address" required className="w-full p-3 border border-gray-300 rounded-lg" />
                  <input type="tel" name="contactPhone" placeholder="Phone Number" className="w-full p-3 border border-gray-300 rounded-lg" />
                  <input type="date" name="eventDate" required className="w-full p-3 border border-gray-300 rounded-lg text-gray-500" />
                  <input type="number" name="guestCount" placeholder="Number of Guests" required className="w-full p-3 border border-gray-300 rounded-lg" />
                  <textarea name="message" placeholder="Tell us about your event..." rows={3} className="w-full p-3 border border-gray-300 rounded-lg"></textarea>
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full mt-6 bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors">
                  {isSubmitting ? "Sending..." : "Send Inquiry"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
