import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Users, Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { EditVenueModal } from "@/components/forms/edit-venue-modal";
import { EditSpaceModal } from "@/components/forms/edit-space-modal";

export default function Venues() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<any>(null);
  const [editingSpace, setEditingSpace] = useState<any>(null);
  const [selectedVenueForSpaces, setSelectedVenueForSpaces] = useState<any>(null);
  const { toast } = useToast();

  const { data: venues, isLoading } = useQuery({
    queryKey: ["/api/venues-with-spaces"],
  });



  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Venues" subtitle="Manage venue spaces and amenities" />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      
      <MobileNav 
        isOpen={mobileNavOpen} 
        onClose={() => setMobileNavOpen(false)} 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Venues" 
          subtitle="Manage venue spaces and amenities"
          onMobileMenuToggle={() => setMobileNavOpen(true)}
          action={
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setEditingVenue({})}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Venue
            </Button>
          }
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-6">
            {Array.isArray(venues) && venues.map((venue: any) => (
              <Card key={venue.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{venue.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {venue.spaces?.length || 0} spaces
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedVenueForSpaces(venue);
                          setEditingSpace({});
                        }}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Space
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingVenue(venue);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {venue.description || "No description available"}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {venue.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{venue.location}</span>
                      </div>
                    )}
                  </div>
                  

                  
                  {/* Spaces List */}
                  {venue.spaces && venue.spaces.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-slate-700">Spaces:</div>
                      <div className="space-y-1">
                        {venue.spaces.slice(0, 3).map((space: any) => (
                          <div key={space.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-slate-900">{space.name}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {space.spaceType || 'hall'}
                                </Badge>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingSpace(space);
                                  setSelectedVenueForSpaces(venue);
                                }}
                                className="h-6 w-6 p-0"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-slate-600 mb-2">
                              <div className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                <span>{space.capacity} guests</span>
                              </div>
                              {space.amenities && space.amenities.length > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {space.amenities.length} amenities
                                </Badge>
                              )}
                              {space.availableSetupStyles && space.availableSetupStyles.length > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {space.availableSetupStyles.length} setups
                                </Badge>
                              )}
                            </div>
                            
                            {space.description && (
                              <p className="text-xs text-slate-500 line-clamp-1 mb-2">{space.description}</p>
                            )}
                            
                            {space.features && (
                              <div className="text-xs text-slate-600">
                                <span className="font-medium">Features: </span>
                                <span className="line-clamp-1">{space.features}</span>
                              </div>
                            )}
                          </div>
                        ))}
                        {venue.spaces.length > 3 && (
                          <div className="text-xs text-slate-500 text-center py-1">
                            +{venue.spaces.length - 3} more spaces
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  

                </CardContent>
              </Card>
            ))}
          </div>
          
          <EditVenueModal 
            open={!!editingVenue} 
            onOpenChange={(open) => !open && setEditingVenue(null)} 
            venue={editingVenue}
          />

          <EditSpaceModal 
            open={!!editingSpace} 
            onOpenChange={(open) => !open && setEditingSpace(null)} 
            space={editingSpace}
            venueId={selectedVenueForSpaces?.id}
            venueName={selectedVenueForSpaces?.name}
          />
        </main>
      </div>
    </div>
  );
}