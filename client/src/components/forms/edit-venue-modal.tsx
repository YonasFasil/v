import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Edit, Edit3, Save, Trash2, Plus } from "lucide-react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { CreateSpaceModal } from "@/components/forms/create-space-modal";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  venue: any;
}

export function EditVenueModal({ open, onOpenChange, venue }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [capacity, setCapacity] = useState("");
  const [address, setAddress] = useState("");
  const [amenities, setAmenities] = useState("");
  const [showCreateSpaceModal, setShowCreateSpaceModal] = useState(false);
  const [editingSpace, setEditingSpace] = useState<any>(null);
  const [editSpaceName, setEditSpaceName] = useState("");
  const [editSpaceCapacity, setEditSpaceCapacity] = useState("");
  const [editSpaceDescription, setEditSpaceDescription] = useState("");

  // Get spaces for this venue
  const { data: spaces = [] } = useQuery({
    queryKey: [`/api/venues/${venue?.id}/spaces`],
    enabled: !!venue?.id && open
  });

  useEffect(() => {
    if (venue && open) {
      setName(venue.name || "");
      setDescription(venue.description || "");
      setCapacity(venue.capacity?.toString() || "");
      setAddress(venue.address || "");
      setAmenities(venue.amenities || "");
    }
  }, [venue, open]);

  const updateVenue = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PATCH", `/api/venues/${venue.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/venues"] });
      queryClient.invalidateQueries({ queryKey: ["/api/venues-with-spaces"] });
      toast({ title: "Venue updated successfully!" });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ title: "Failed to update venue", description: error.message, variant: "destructive" });
    }
  });

  const deleteVenue = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/venues/${venue.id}`, {});
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/venues"] });
      queryClient.invalidateQueries({ queryKey: ["/api/venues-with-spaces"] });
      toast({ title: "Venue deleted successfully!" });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete venue", description: error.message, variant: "destructive" });
    }
  });

  const handleSave = () => {
    updateVenue.mutate({
      name,
      description,
      capacity: capacity ? parseInt(capacity) : null,
      address,
      amenities
    });
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this venue? This will also delete all associated spaces and may affect existing bookings.")) {
      deleteVenue.mutate();
    }
  };

  const deleteSpace = useMutation({
    mutationFn: async (spaceId: string) => {
      const response = await apiRequest("DELETE", `/api/venues/${venue.id}/spaces/${spaceId}`, {});
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/venues/${venue.id}/spaces`] });
      queryClient.invalidateQueries({ queryKey: ["/api/venues-with-spaces"] });
      toast({ title: "Space deleted successfully!" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete space", description: error.message, variant: "destructive" });
    }
  });

  const updateSpace = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PATCH", `/api/venues/${venue.id}/spaces/${editingSpace.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/venues/${venue.id}/spaces`] });
      queryClient.invalidateQueries({ queryKey: ["/api/venues-with-spaces"] });
      toast({ title: "Space updated successfully!" });
      setEditingSpace(null);
    },
    onError: (error: any) => {
      toast({ title: "Failed to update space", description: error.message, variant: "destructive" });
    }
  });

  const handleEditSpace = (space: any) => {
    setEditingSpace(space);
    setEditSpaceName(space.name || "");
    setEditSpaceCapacity(space.capacity?.toString() || "");
    setEditSpaceDescription(space.description || "");
  };

  const handleSaveSpace = () => {
    if (!editSpaceName.trim() || !editSpaceCapacity.trim()) {
      toast({
        title: "Required fields missing",
        description: "Please provide space name and capacity",
        variant: "destructive"
      });
      return;
    }

    updateSpace.mutate({
      name: editSpaceName,
      capacity: parseInt(editSpaceCapacity),
      description: editSpaceDescription,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 max-h-[90vh] overflow-hidden flex flex-col" aria-describedby="edit-venue-description">
        <DialogTitle className="sr-only">Edit Venue</DialogTitle>
        <div id="edit-venue-description" className="sr-only">
          Edit venue property information including name, capacity, spaces, and amenities.
        </div>
        
        <div className="border-b border-slate-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Edit className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Edit Venue Property</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Venue Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
            </div>
            
            <div>
              <Label>Total Capacity</Label>
              <Input 
                type="number" 
                value={capacity} 
                onChange={(e) => setCapacity(e.target.value)} 
                className="mt-1"
                placeholder="Maximum guests"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            <div>
              <Label className="text-sm">Description</Label>
              <Input 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 text-sm"
                placeholder="Describe this venue property..."
              />
            </div>
            
            <div>
              <Label className="text-sm">Address</Label>
              <Input 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-1 text-sm"
                placeholder="Full venue address..."
              />
            </div>
            
            <div>
              <Label className="text-sm">Amenities & Features</Label>
              <Input 
                value={amenities}
                onChange={(e) => setAmenities(e.target.value)}
                className="mt-1 text-sm"
                placeholder="Parking, WiFi, AV equipment, etc."
              />
            </div>
          </div>

          {/* Spaces Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base font-medium">Spaces in this Venue</Label>
              <Button variant="outline" size="sm" onClick={() => setShowCreateSpaceModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Space
              </Button>
            </div>
            
            {spaces.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {spaces.map((space: any) => (
                  <Card key={space.id} className="p-3 border border-slate-200">
                    {editingSpace?.id === space.id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            value={editSpaceName}
                            onChange={(e) => setEditSpaceName(e.target.value)}
                            placeholder="Space name"
                            className="text-sm"
                          />
                          <Input
                            type="number"
                            value={editSpaceCapacity}
                            onChange={(e) => setEditSpaceCapacity(e.target.value)}
                            placeholder="Capacity"
                            className="text-sm"
                          />
                        </div>
                        <Input
                          value={editSpaceDescription}
                          onChange={(e) => setEditSpaceDescription(e.target.value)}
                          placeholder="Description (optional)"
                          className="text-sm"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSaveSpace} disabled={updateSpace.isPending}>
                            <Save className="h-3 w-3 mr-1" />
                            Save
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setEditingSpace(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{space.name}</div>
                          <div className="text-xs text-slate-600">
                            {space.capacity} guests • {space.description || 'No description'}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditSpace(space)}
                            className="text-xs px-2 py-1 h-6"
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              if (confirm(`Delete space "${space.name}"? This cannot be undone.`)) {
                                deleteSpace.mutate(space.id);
                              }
                            }}
                            className="text-xs px-2 py-1 h-6 text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600">No spaces configured</p>
                <p className="text-xs text-slate-500 mt-1">Add bookable spaces within this property</p>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-slate-200 p-6 flex justify-between bg-white flex-shrink-0">
          <Button variant="destructive" onClick={handleDelete} disabled={deleteVenue.isPending}>
            <Trash2 className="h-4 w-4 mr-2" />
            {deleteVenue.isPending ? 'Deleting...' : 'Delete Venue'}
          </Button>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={updateVenue.isPending || !name.trim()}>
              <Save className="h-4 w-4 mr-2" />
              {updateVenue.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
        
        <CreateSpaceModal
          open={showCreateSpaceModal}
          onOpenChange={setShowCreateSpaceModal}
          venueId={venue?.id || ""}
          venueName={venue?.name || ""}
        />
      </DialogContent>
    </Dialog>
  );
}