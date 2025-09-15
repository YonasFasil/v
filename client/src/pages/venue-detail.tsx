import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, MapPin, Star, Wifi, Car, Coffee, Music, Utensils, Check, Users
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// --- DUMMY DATA ---
const dummyReviews = [
  { name: "Alice Johnson", rating: 5, comment: "Absolutely stunning venue! The staff was incredibly helpful and our event was a massive success. Highly recommend!" },
  { name: "Robert Smith", rating: 4, comment: "Great location and beautiful space. We had a minor issue with the sound system, but it was resolved quickly. Would book again." },
  { name: "Emily Davis", rating: 5, comment: "Perfect for our corporate off-site. The amenities were top-notch and the space was very inspiring." },
];

const dummyAmenities = ["High-Speed WiFi", "Free On-site Parking", "Gourmet Catering Options", "Sonos Sound System", "4K Projector", "Coffee and Tea Station"];

const getPlaceholderImage = (id: string, index: number) => {
  const imageKeywords = ["event-space", "modern-office", "wedding-hall", "conference-center", "art-gallery", "rooftop-lounge"];
  const keyword = imageKeywords[index % imageKeywords.length];
  return `https://source.unsplash.com/random/1600x900/?${keyword}&sig=${id}-${index}`;
};
// --- END DUMMY DATA ---

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
    return <div className="min-h-screen bg-white"></div>;
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

  const galleryImages = Array.isArray(venue.image_urls) && venue.image_urls.length > 0 
    ? venue.image_urls 
    : [getPlaceholderImage(venue.id, 0), getPlaceholderImage(venue.id, 1), getPlaceholderImage(venue.id, 2), getPlaceholderImage(venue.id, 3), getPlaceholderImage(venue.id, 4)];

  const amenities = Array.isArray(venue.amenities) && venue.amenities.length > 0 ? venue.amenities : dummyAmenities;

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
        <div className="mt-12 grid grid-cols-4 grid-rows-2 gap-2 h-[60vh] rounded-2xl overflow-hidden">
          <div className="col-span-2 row-span-2">
            <img src={galleryImages[0]} alt={venue.name} className="w-full h-full object-cover" />
          </div>
          <div className="col-span-1 row-span-1">
            <img src={galleryImages[1]} alt="Venue detail" className="w-full h-full object-cover" />
          </div>
          <div className="col-span-1 row-span-1">
            <img src={galleryImages[2]} alt="Venue detail" className="w-full h-full object-cover" />
          </div>
          <div className="col-span-1 row-span-1">
            <img src={galleryImages[3]} alt="Venue detail" className="w-full h-full object-cover" />
          </div>
          <div className="col-span-1 row-span-1">
            <img src={galleryImages[4]} alt="Venue detail" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-24 mt-16">
          <div className="lg:col-span-2">
            <div className="pb-8 border-b border-gray-200/80">
              <h2 className="text-3xl font-semibold text-gray-900 tracking-tight">Hosted by {venue.tenant_name}</h2>
              {venue.spaces && venue.spaces.length > 0 && (
                <div className="flex items-center space-x-6 mt-3 text-gray-600">
                  {venue.spaces.map(space => (
                    <div key={space.id} className="flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      <span>{space.capacity} guests</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="py-8 border-b border-gray-200/80">
              <p className="text-gray-700 leading-relaxed text-lg">
                {venue.description || "This modern and versatile space is perfect for a wide range of events, from corporate meetings to elegant weddings. With state-of-the-art facilities and a dedicated team, we are committed to making your event a memorable one."}
              </p>
            </div>

            <div className="py-8 border-b border-gray-200/80">
              <h3 className="text-2xl font-semibold text-gray-900 tracking-tight mb-6">What this place offers</h3>
              <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                {amenities.map((amenity, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <AmenityIcon amenity={amenity} />
                    <span className="text-gray-700">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="py-8">
              <h3 className="text-2xl font-semibold text-gray-900 tracking-tight mb-6">Reviews</h3>
              <div className="space-y-6">
                {dummyReviews.map((review, i) => (
                  <div key={i}>
                    <div className="flex items-center mb-2">
                      <div className="flex items-center">
                        {[...Array(review.rating)].map((_, j) => <Star key={j} className="w-5 h-5 text-yellow-500 fill-current" />)}
                        {[...Array(5 - review.rating)].map((_, j) => <Star key={j} className="w-5 h-5 text-gray-300 fill-current" />)}
                      </div>
                    </div>
                    <p className="text-gray-700">"{review.comment}"</p>
                    <p className="text-sm text-gray-500 mt-2">- {review.name}</p>
                  </div>
                ))}
              </div>
            </div>
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
