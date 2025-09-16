import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Edit, Save, Trash2, UploadCloud } from "lucide-react";
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
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (venue && open) {
      setName(venue.name || "");
      setDescription(venue.description || "");
      setAddress(venue.address || "");
      setImageUrls(Array.isArray(venue.imageUrls) ? venue.imageUrls : (venue.imageUrl ? [venue.imageUrl] : []));
    }
  }, [venue, open]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadedUrls: string[] = [];
    const validFiles = Array.from(files).filter(file => {
      if (!['image/png', 'image/jpeg'].includes(file.type)) {
        toast({ title: "Invalid File Type", description: `${file.name} is not a PNG or JPG.`, variant: "destructive" });
        return false;
      }
      if (file.size > 2 * 1024 * 1024) { // 2MB
        toast({ title: "File Too Large", description: `${file.name} is larger than 2MB.`, variant: "destructive" });
        return false;
      }
      return true;
    });

    for (const file of validFiles) {
      try {
        const response = await fetch(`/api/upload?filename=${file.name}`, {
          method: 'POST',
          body: file,
        });

        if (!response.ok) throw new Error(`Upload failed for ${file.name}`);
        const newBlob = await response.json();
        uploadedUrls.push(newBlob.url);
      } catch (error) {
        toast({ title: "Upload failed", description: `Could not upload ${file.name}.`, variant: "destructive" });
      }
    }

    setImageUrls(prev => [...prev, ...uploadedUrls]);
    setUploading(false);
    if (uploadedUrls.length > 0) {
      toast({ title: "Images uploaded successfully!" });
    }
  };
  
  const handleRemoveImage = (urlToRemove: string) => {
    setImageUrls(prev => prev.filter(url => url !== urlToRemove));
  };

  const updateVenue = useMutation({
    mutationFn: async (data: any) => {
      const payload = { ...data, imageUrls: imageUrls, imageUrl: imageUrls[0] || "" };
      if (venue?.id) {
        return await apiRequest("PATCH", `/api/venues/${venue.id}`, payload);
      } else {
        return await apiRequest("POST", "/api/venues", payload);
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
      imageUrls,
      imageUrl: imageUrls[0] || "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="border-b p-6 flex items-center gap-3">
          <Edit className="h-5 w-5 text-purple-600" />
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
          
          <div>
            <Label>Venue Images</Label>
            <div className="mt-1 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {imageUrls.map(url => (
                <div key={url} className="relative group">
                  <img src={url} alt="Venue" className="w-full h-24 object-cover rounded-md" />
                  <button
                    onClick={() => handleRemoveImage(url)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <div
                className="w-full h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-center cursor-pointer hover:border-purple-500 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/png, image/jpeg"
                  multiple
                />
                {uploading ? (
                  <p className="text-xs">Uploading...</p>
                ) : (
                  <div className="text-gray-500">
                    <UploadCloud className="mx-auto h-6 w-6" />
                    <p className="text-xs mt-1">Add Images</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t p-6 flex justify-end bg-gray-50">
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={updateVenue.isPending || !name.trim()} className="bg-purple-600 hover:bg-purple-700">
              <Save className="h-4 w-4 mr-2" />
              {updateVenue.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
