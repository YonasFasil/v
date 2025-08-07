import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Users, Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { EditVenueModal } from "@/components/forms/edit-venue-modal";

export default function Venues() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingVenue, setEditingVenue] = useState<any>(null);
  const { toast } = useToast();

  const { data: venues, isLoading } = useQuery({
    queryKey: ["/api/venues"],
  });

  const [newVenue, setNewVenue] = useState({
    name: "",
    description: "",
    capacity: "",
    location: "",
    amenities: "",
    hourlyRate: "",
    type: "indoor"
  });

  const createVenue = async () => {
    if (!newVenue.name || !newVenue.capacity) {
      toast({
        title: "Required fields missing",
        description: "Please provide venue name and capacity",
        variant: "destructive"
      });
      return;
    }

    try {
      await apiRequest("POST", "/api/venues", {
        ...newVenue,
        capacity: parseInt(newVenue.capacity),
        hourlyRate: parseFloat(newVenue.hourlyRate) || 0
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/venues"] });
      
      setShowCreateForm(false);
      setNewVenue({
        name: "",
        description: "",
        capacity: "",
        location: "",
        amenities: "",
        hourlyRate: "",
        type: "indoor"
      });
      
      toast({
        title: "Venue created",
        description: `${newVenue.name} has been added successfully`
      });
    } catch (error) {
      toast({
        title: "Creation failed",
        description: "Could not create venue",
        variant: "destructive"
      });
    }
  };

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
            <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Venue
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Venue</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Venue Name *</Label>
                    <Input
                      placeholder="e.g., Grand Ballroom"
                      value={newVenue.name}
                      onChange={(e) => setNewVenue(prev => ({ ...prev, name: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Description</Label>
                    <Textarea
                      placeholder="Describe the venue space..."
                      value={newVenue.description}
                      onChange={(e) => setNewVenue(prev => ({ ...prev, description: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm font-medium">Capacity *</Label>
                      <Input
                        type="number"
                        placeholder="100"
                        value={newVenue.capacity}
                        onChange={(e) => setNewVenue(prev => ({ ...prev, capacity: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Hourly Rate</Label>
                      <Input
                        type="number"
                        placeholder="150"
                        value={newVenue.hourlyRate}
                        onChange={(e) => setNewVenue(prev => ({ ...prev, hourlyRate: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Location</Label>
                    <Input
                      placeholder="Building A, Floor 2"
                      value={newVenue.location}
                      onChange={(e) => setNewVenue(prev => ({ ...prev, location: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Amenities</Label>
                    <Input
                      placeholder="Projector, Sound System, WiFi"
                      value={newVenue.amenities}
                      onChange={(e) => setNewVenue(prev => ({ ...prev, amenities: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  
                  <Button
                    onClick={createVenue}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={!newVenue.name || !newVenue.capacity}
                  >
                    Create Venue
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          }
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.isArray(venues) && venues.map((venue: any) => (
              <Card key={venue.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setEditingVenue(venue)}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{venue.name}</CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {venue.type || "Indoor"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {venue.description || "No description available"}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{venue.capacity || 0} guests</span>
                    </div>
                    {venue.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{venue.location}</span>
                      </div>
                    )}
                  </div>
                  
                  {venue.hourlyRate && (
                    <div className="text-lg font-semibold text-blue-600">
                      ${venue.hourlyRate}/hour
                    </div>
                  )}
                  
                  {venue.amenities && (
                    <div className="text-xs text-gray-500">
                      <strong>Amenities:</strong> {venue.amenities}
                    </div>
                  )}
                  
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                    <div className="flex justify-end pt-2">
                      <span className="text-xs text-blue-600 hover:text-blue-800">Click to edit →</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <EditVenueModal 
            open={!!editingVenue} 
            onOpenChange={(open) => !open && setEditingVenue(null)} 
            venue={editingVenue}
          />
        </main>
      </div>
    </div>
  );
}