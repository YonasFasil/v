import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  venueId: string;
  venueName: string;
}

export function CreateSpaceModal({ open, onOpenChange, venueId, venueName }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [capacity, setCapacity] = useState("");
  const [spaceType, setSpaceType] = useState("hall");
  const [features, setFeatures] = useState("");

  const createSpace = useMutation({
    mutationFn: async (spaceData: any) => {
      const response = await apiRequest("POST", "/api/spaces", spaceData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/venues"] });
      queryClient.invalidateQueries({ queryKey: ["/api/venues-with-spaces"] });
      queryClient.invalidateQueries({ queryKey: [`/api/venues/${venueId}/spaces`] });
      toast({ title: "Space created successfully!" });
      resetForm();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to create space", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setCapacity("");
    setSpaceType("hall");
    setFeatures("");
  };

  const handleSubmit = () => {
    if (!name.trim() || !capacity) {
      toast({
        title: "Required fields missing",
        description: "Please provide space name and capacity",
        variant: "destructive"
      });
      return;
    }

    createSpace.mutate({
      venueId,
      name: name.trim(),
      description: description.trim(),
      capacity: parseInt(capacity),
      spaceType,
      features: features.trim()
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 max-h-[75vh] overflow-hidden" aria-describedby="create-space-description">
        <DialogTitle className="sr-only">Add Space to Venue</DialogTitle>
        <div id="create-space-description" className="sr-only">
          Create a new bookable space within the selected venue property.
        </div>
        
        <div className="border-b border-slate-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Plus className="h-5 w-5 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold">Add Space</h2>
              <p className="text-sm text-slate-600">to {venueName}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          <div>
            <Label>Space Name *</Label>
            <Input 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className="mt-1"
              placeholder="e.g., Main Hall, Garden Pavilion"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Capacity *</Label>
              <Input 
                type="number" 
                value={capacity} 
                onChange={(e) => setCapacity(e.target.value)} 
                className="mt-1"
                placeholder="50"
                min="1"
              />
            </div>
            
            <div>
              <Label>Space Type</Label>
              <Select value={spaceType} onValueChange={setSpaceType}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hall">Hall</SelectItem>
                  <SelectItem value="ballroom">Ballroom</SelectItem>
                  <SelectItem value="conference">Conference Room</SelectItem>
                  <SelectItem value="garden">Garden/Outdoor</SelectItem>
                  <SelectItem value="pavilion">Pavilion</SelectItem>
                  <SelectItem value="terrace">Terrace</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label className="text-sm">Description</Label>
            <Input 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 text-sm"
              placeholder="Describe this space..."
            />
          </div>
          
          <div>
            <Label className="text-sm">Features & Amenities</Label>
            <Input 
              value={features} 
              onChange={(e) => setFeatures(e.target.value)} 
              className="mt-1 text-sm"
              placeholder="Stage, Dance floor, Projector, etc."
            />
          </div>
        </div>

        <div className="border-t border-slate-200 p-4 flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={createSpace.isPending || !name.trim() || !capacity}
          >
            {createSpace.isPending ? 'Creating...' : 'Create Space'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}