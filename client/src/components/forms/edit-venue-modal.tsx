import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Edit, Save, Trash2, Plus, UploadCloud, Image as ImageIcon } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
  const [address, setAddress] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (venue && open) {
      setName(venue.name || "");
      setDescription(venue.description || "");
      setAddress(venue.address || "");
      setImageUrl(venue.image_url || "");
    }
  }, [venue, open]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const blob = await response.json();
      setImageUrl(blob.url);
      toast({ title: "Image uploaded successfully!" });
    } catch (error) {
      toast({ title: "Upload failed", description: "Could not upload image.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

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
      image_url: imageUrl,
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            
            <div>
              <Label>Venue Image</Label>
              <div
                className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                />
                {uploading ? (
                  <p>Uploading...</p>
                ) : imageUrl ? (
                  <img src={imageUrl} alt="Venue" className="max-h-40 mx-auto rounded-md" />
                ) : (
                  <div className="text-gray-500">
                    <UploadCloud className="mx-auto h-12 w-12" />
                    <p>Click to upload an image</p>
                    <p className="text-xs">PNG, JPG, GIF up to 10MB</p>
                  </div>
                )}
              </div>
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
