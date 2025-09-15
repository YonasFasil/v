import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, MapPin, Users, Star, Wifi, Car, Coffee, Music, Utensils, Check, Send
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Venue {
  id: string;
  name: string;
  description: string;
  amenities: string[];
  image_urls: string[];
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
  if (lowerAmenity.includes('wifi')) return <Wifi className="w-5 h-5 text-gray-600" />;
  if (lowerAmenity.includes('parking')) return <Car className="w-5 h-5 text-gray-600" />;
  if (lowerAmenity.includes('catering')) return <Utensils className="w-5 h-5 text-gray-600" />;
  if (lowerAmenity.includes('coffee')) return <Coffee className="w-5 h-5 text-gray-600" />;
  if (lowerAmenity.includes('sound') || lowerAmenity.includes('audio')) return <Music className="w-5 h-5 text-gray-600" />;
  return <Check className="w-5 h-5 text-gray-600" />;
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
    return <div className="min-h-screen bg-white"></div>; // Simple loading state
  }

  if (error || !venue) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-center p-6">
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

  const galleryImages = Array.isArray(venue.image_urls) && venue.image_urls.length > 0 ? venue.image_urls : [];

  return (
    <div className="min-h-screen bg-white font-sans antialiased">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-200/80">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="flex justify-between items-center py-4">
            <Link href="/explore/venues">
              <a className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Venues
              </a>
            </Link>
            <div className="flex items-center space-x-6 text-sm font-medium text-gray-700">
              <Link href="/customer/login">
                <a className="hover:text-gray-900 transition-colors">Sign In</a>
              </Link>
              <Link href="/customer/signup">
                <a className="bg-gray-900 text-white px-5 py-2 rounded-full hover:bg-gray-800 transition-colors">
                  Get Started
                </a>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-16">
        {/* Title */}
        <div className="max-w-4xl">
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 tracking-tighter">{venue.name}</h1>
          <div className="flex items-center space-x-6 mt-4 text-gray-600">
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              <span>{venue.city}, {venue.state}</span>
            </div>
          </div>
        </div>

        {/* Image Gallery */}
        {galleryImages.length > 0 && (
          <div className="mt-12 grid grid-cols-4 grid-rows-2 gap-2 h-[60vh] rounded-2xl overflow-hidden">
            <div className="col-span-2 row-span-2">
              <img src={galleryImages[0]} alt={venue.name} className="w-full h-full object-cover" />
            </div>
            <div className="col-span-1 row-span-1">
              <img src={galleryImages[1] || galleryImages[0]} alt="Venue detail" className="w-full h-full object-cover" />
            </div>
            <div className="col-span-1 row-span-1">
              <img src={galleryImages[2] || galleryImages[0]} alt="Venue detail" className="w-full h-full object-cover" />
            </div>
            <div className="col-span-1 row-span-1">
              <img src={galleryImages[3] || galleryImages[0]} alt="Venue detail" className="w-full h-full object-cover" />
            </div>
            <div className="col-span-1 row-span-1">
              <img src={galleryImages[4] || galleryImages[0]} alt="Venue detail" className="w-full h-full object-cover" />
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-24 mt-16">
          <div className="lg:col-span-2">
            <div className="pb-8 border-b border-gray-200/80">
              <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">Hosted by {venue.tenant_name}</h2>
              {venue.spaces && venue.spaces.length > 0 && (
                <div className="flex items-center space-x-6 mt-2 text-gray-600">
                  {venue.spaces.map(space => (
                    <span key={space.id}>{space.capacity} guests</span>
                  ))}
                </div>
              )}
            </div>

            <div className="py-8 border-b border-gray-200/80">
              <p className="text-gray-700 leading-relaxed">{venue.description}</p>
            </div>

            {venue.amenities && venue.amenities.length > 0 && (
              <div className="py-8">
                <h3 className="text-2xl font-semibold text-gray-900 tracking-tight mb-6">What this place offers</h3>
                <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                  {venue.amenities.map((amenity, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <AmenityIcon amenity={amenity} />
                      <span className="text-gray-700">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sticky Inquiry Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-28">
              <form onSubmit={handleInquirySubmit} className="border border-gray-200/80 rounded-2xl shadow-xl shadow-gray-200/30 p-6">
                <h3 className="text-2xl font-semibold text-gray-900 tracking-tight mb-6">Request to book</h3>
                <div className="space-y-4">
                  <input type="text" name="contactName" placeholder="Full Name" required className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900" />
                  <input type="email" name="contactEmail" placeholder="Email Address" required className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900" />
                  <input type="date" name="eventDate" required className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-500 focus:ring-2 focus:ring-gray-900 focus:border-gray-900" />
                  <input type="number" name="guestCount" placeholder="Number of Guests" required className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900" />
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full mt-6 bg-gray-900 text-white py-3 rounded-xl hover:bg-gray-800 transition-colors text-base font-medium">
                  {isSubmitting ? "Sending..." : "Inquire Now"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}