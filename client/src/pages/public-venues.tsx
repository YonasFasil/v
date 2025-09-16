import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Search, MapPin } from "lucide-react";
import { Link } from "wouter";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface Venue {
  id: string;
  name: string;
  city: string;
  state: string;
  imageUrl: string; // Note: API might send imageUrl (singular) for the primary image
  description: string;
}

const PlaceholderImage = () => (
  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
    <svg className="w-12 h-12 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  </div>
);

const VenueCard = ({ venue }: { venue: Venue }) => (
  <Link href={`/explore/venues/${venue.id}`}>
    <a className="block group">
      <div className="w-full bg-white rounded-2xl overflow-hidden border border-gray-200/80 hover:shadow-2xl hover:shadow-gray-200/40 transition-all duration-500 ease-in-out">
        <AspectRatio ratio={16 / 10}>
          {venue.imageUrl ? (
            <img
              src={venue.imageUrl}
              alt={venue.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out"
            />
          ) : (
            <PlaceholderImage />
          )}
        </AspectRatio>
        <div className="p-6">
          <h3 className="font-semibold text-lg text-gray-900">{venue.name}</h3>
          <p className="text-sm text-gray-500 mt-1">{venue.city}, {venue.state}</p>
          <p className="text-sm text-gray-600 mt-3 line-clamp-2">
            {venue.description || "A stunning space perfect for any occasion, from corporate events to private celebrations."}
          </p>
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
    <div className="min-h-screen bg-white font-sans antialiased">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-200/80">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="flex justify-between items-center py-4">
            <Link href="/">
              <a className="text-xl font-bold text-gray-900 tracking-tight">Venuine</a>
            </Link>
            <div className="flex items-center space-x-6 text-sm font-medium text-gray-700">
              <Link href="/customer/login">
                <a className="hover:text-gray-900 transition-colors">Sign In</a>
              </Link>
              <Link href="/customer/signup">
                <a className="bg-purple-600 text-white px-5 py-2 rounded-full hover:bg-purple-700 transition-colors">
                  Get Started
                </a>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-screen-xl mx-auto px-6 py-16 md:py-24">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto bg-gradient-to-r from-purple-50 via-white to-purple-50 bg-[length:200%_200%] animate-background-pan py-20 rounded-3xl">
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 tracking-tighter">
            Spaces that inspire.
          </h1>
          <p className="mt-6 text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Discover and book thousands of unique venues for your next event, meeting, or photoshoot.
          </p>
        </div>

        {/* Venues Grid */}
        <section className="mt-20">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-8">Featured Venues</h2>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="w-full bg-gray-200 rounded-2xl" style={{ aspectRatio: '16/10' }}></div>
                  <div className="h-6 bg-gray-200 rounded-full mt-4 w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded-full mt-2 w-1/2"></div>
                </div>
              ))}
            </div>
          ) : venues.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {venues.map((venue) => (
                <VenueCard key={venue.id} venue={venue} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border border-dashed border-gray-300 rounded-2xl">
              <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No venues available</h3>
              <p className="text-gray-600">
                Please check back later for new and exciting spaces.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}