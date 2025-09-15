import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Users, ArrowRight, Star } from "lucide-react";
import { Link } from "wouter";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface Venue {
  id: string;
  name: string;
  description: string;
  amenities: string[];
  image_url: string;
  tenant_name: string;
  tenant_slug: string;
  space_count: number;
  view_count: number;
  city: string;
  state: string;
}

// Placeholder image component
const PlaceholderImage = () => (
  <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-200 flex items-center justify-center">
    <MapPin className="w-12 h-12 text-gray-400" />
  </div>
);

// New Venue Card Component
const VenueCard = ({ venue }: { venue: Venue }) => (
  <Link href={`/explore/venues/${venue.id}`}>
    <a className="block group rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1">
      <div className="relative">
        <AspectRatio ratio={4 / 3}>
          {venue.image_url ? (
            <img
              src={venue.image_url}
              alt={venue.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <PlaceholderImage />
          )}
        </AspectRatio>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute bottom-4 left-4 text-white">
          <h3 className="font-bold text-lg">{venue.name}</h3>
          <p className="text-sm opacity-90">{venue.city}, {venue.state}</p>
        </div>
      </div>
    </a>
  </Link>
);

export default function PublicVenues() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: venues = [], isLoading } = useQuery<Venue[]>({
    queryKey: ["/api/public/venues", searchQuery],
    queryFn: () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      return apiRequest(`/api/public/venues?${params.toString()}`).then(data => data.venues || []);
    }
  });

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/">
              <a className="text-2xl font-bold text-gray-900">VenuinePro</a>
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

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 tracking-tight">
            Find your next venue
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Discover and book unique spaces for any event.
          </p>
          <div className="mt-8 max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search by city, state, or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-full text-base border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
              />
            </div>
          </div>
        </div>

        {/* Venues Grid */}
        <section className="mt-16">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="w-full bg-gray-200 rounded-xl" style={{ aspectRatio: '4/3' }}></div>
                  <div className="h-5 bg-gray-200 rounded-full mt-4 w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded-full mt-2 w-1/2"></div>
                </div>
              ))}
            </div>
          ) : venues.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
              {venues.map((venue) => (
                <VenueCard key={venue.id} venue={venue} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No venues found</h3>
              <p className="text-gray-600">
                Try adjusting your search or check back later.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
