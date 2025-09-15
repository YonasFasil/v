import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Users, Calendar, Star, ArrowRight } from "lucide-react";
import { Link } from "wouter";

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
}

export default function PublicVenues() {
  const [searchQuery, setSearchQuery] = useState("");
  const [capacityFilter, setCapacityFilter] = useState("");

  // Fetch public venues
  const { data: venuesData, isLoading } = useQuery({
    queryKey: ["/api/public/venues", searchQuery, capacityFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (capacityFilter) params.append("capacity", capacityFilter);

      return apiRequest(`/api/public/venues?${params.toString()}`);
    }
  });

  // Fetch featured venues
  const { data: featuredVenues = [] } = useQuery({
    queryKey: ["/api/public/venues?action=featured"],
    queryFn: () => apiRequest("/api/public/venues?action=featured")
  });

  const venues = venuesData?.venues || [];
  const pagination = venuesData?.pagination;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Query will automatically refetch due to dependency on searchQuery
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <a className="text-2xl font-bold text-blue-600">VenuinePro</a>
              </Link>
              <span className="text-gray-300">|</span>
              <span className="text-gray-600">Find Your Perfect Venue</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/customer/login">
                <a className="text-gray-600 hover:text-gray-900">Login</a>
              </Link>
              <Link href="/customer/signup">
                <a className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                  Sign Up
                </a>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Discover Amazing Venues
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100">
            Find the perfect space for your next event
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search venues, locations, or amenities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 py-3 text-gray-900"
                />
              </div>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="number"
                  placeholder="Guests"
                  value={capacityFilter}
                  onChange={(e) => setCapacityFilter(e.target.value)}
                  className="pl-10 py-3 text-gray-900 w-full md:w-32"
                />
              </div>
              <Button type="submit" size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                Search
              </Button>
            </div>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Featured Venues */}
        {featuredVenues.length > 0 && (
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
              <Star className="w-8 h-8 text-yellow-500 mr-3" />
              Featured Venues
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredVenues.slice(0, 3).map((venue: Venue) => (
                <Card key={venue.id} className="group hover:shadow-lg transition-shadow duration-300">
                  <div className="relative">
                    {venue.image_url ? (
                      <img
                        src={venue.image_url}
                        alt={venue.name}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-purple-100 rounded-t-lg flex items-center justify-center">
                        <MapPin className="w-12 h-12 text-blue-500" />
                      </div>
                    )}
                    <Badge className="absolute top-2 right-2 bg-yellow-500 text-white">
                      Featured
                    </Badge>
                  </div>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-start">
                      <span>{venue.name}</span>
                      <div className="text-sm text-gray-500 flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {venue.view_count} views
                      </div>
                    </CardTitle>
                    <p className="text-sm text-gray-600">{venue.tenant_name}</p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-4 line-clamp-2">
                      {venue.description || "Beautiful venue perfect for your next event"}
                    </p>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-1" />
                        {venue.space_count} spaces
                      </div>
                      <Link href={`/explore/venues/${venue.id}`}>
                        <a>
                          <Button size="sm" className="group-hover:bg-blue-700">
                            View Details
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </a>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* All Venues */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900">
              {searchQuery || capacityFilter ? "Search Results" : "All Venues"}
            </h2>
            {pagination && (
              <div className="text-sm text-gray-600">
                Showing {venues.length} of {pagination.total} venues
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse">
                  <div className="w-full h-48 bg-gray-300 rounded-t-lg"></div>
                  <CardHeader>
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : venues.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {venues.map((venue: Venue) => (
                <Card key={venue.id} className="group hover:shadow-lg transition-shadow duration-300">
                  <div className="relative">
                    {venue.image_url ? (
                      <img
                        src={venue.image_url}
                        alt={venue.name}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-purple-100 rounded-t-lg flex items-center justify-center">
                        <MapPin className="w-12 h-12 text-blue-500" />
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-start">
                      <span>{venue.name}</span>
                      <div className="text-sm text-gray-500 flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {venue.view_count} views
                      </div>
                    </CardTitle>
                    <p className="text-sm text-gray-600">{venue.tenant_name}</p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-4 line-clamp-2">
                      {venue.description || "Beautiful venue perfect for your next event"}
                    </p>

                    {venue.amenities && venue.amenities.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1">
                          {venue.amenities.slice(0, 3).map((amenity, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {amenity}
                            </Badge>
                          ))}
                          {venue.amenities.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{venue.amenities.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-1" />
                        {venue.space_count} spaces
                      </div>
                      <Link href={`/explore/venues/${venue.id}`}>
                        <a>
                          <Button size="sm" className="group-hover:bg-blue-700">
                            View Details
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </a>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No venues found</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || capacityFilter
                  ? "Try adjusting your search criteria or browse all venues"
                  : "No venues are currently available"
                }
              </p>
              {(searchQuery || capacityFilter) && (
                <Button
                  onClick={() => {
                    setSearchQuery("");
                    setCapacityFilter("");
                  }}
                  variant="outline"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}