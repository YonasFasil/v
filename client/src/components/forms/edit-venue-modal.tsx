import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Edit, Save, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (venue && open) {
      setName(venue.name || "");
      setDescription(venue.description || "");
      setAddress(venue.address || "");
    }
  }, [venue, open]);

  const updateVenue = useMutation({
    mutationFn: async (data: any) => {
      if (venue?.id) {
        return await apiRequest("PATCH", `/api/venues/${venue.id}`, data);
      } else {
        return await apiRequest("POST", "/api/venues", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/venues-with-spaces"] });
      toast({ title: venue?.id ? "Venue updated!" : "Venue created!" });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    }
  });

  const handleSave = () => {
    updateVenue.mutate({
      name,
      description,
      address,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="border-b p-6 flex items-center gap-3">
          <Edit className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-semibold">
            {venue?.id ? 'Edit Venue' : 'Create New Venue'}
          </h2>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <Label>Venue Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Description</Label>
              <Input 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1"
                placeholder="Describe this venue..."
              />
            </div>
            <div>
              <Label>Address</Label>
              <Input 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-1"
                placeholder="Full venue address..."
              />
            </div>
          </div>
        </div>

        <div className="border-t p-6 flex justify-end bg-gray-50">
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={updateVenue.isPending || !name.trim()}>
              <Save className="h-4 w-4 mr-2" />
              {updateVenue.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
