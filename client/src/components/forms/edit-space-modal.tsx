import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Save, X, Grid3X3, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";


interface EditSpaceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  space: any;
  venueId: string;
  venueName?: string;
}

const SETUP_STYLES = [
  { value: 'round-tables', label: 'Round Tables', description: 'Perfect for dining and networking events' },
  { value: 'u-shape', label: 'U-Shape', description: 'Great for presentations and discussions' },
  { value: 'classroom', label: 'Classroom', description: 'Ideal for training and educational events' },
  { value: 'theater', label: 'Theater', description: 'Best for presentations and performances' },
  { value: 'cocktail', label: 'Cocktail', description: 'Standing reception style setup' },
  { value: 'banquet', label: 'Banquet', description: 'Formal dining with long tables' },
  { value: 'conference', label: 'Conference', description: 'Professional meeting setup' },
  { value: 'custom', label: 'Custom', description: 'Design your own unique layout' },
];

export function EditSpaceModal({ open, onOpenChange, space, venueId, venueName }: EditSpaceModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("details");
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    capacity: '',
    spaceType: 'hall',
    features: '',
    amenities: [] as string[],
    availableSetupStyles: [] as string[],
  });

  const isCreating = !space?.id;

  useEffect(() => {
    if (open) {
      if (space && space.id) {
        // Editing existing space
        console.log('Loading space data:', space);
        setFormData({
          name: space.name || '',
          description: space.description || '',
          capacity: space.capacity?.toString() || '',
          spaceType: space.spaceType || 'hall',
          features: space.features || '',
          amenities: space.amenities || [],
          availableSetupStyles: space.availableSetupStyles || [],
        });
      } else {
        // Creating new space
        setFormData({
          name: '',
          description: '',
          capacity: '',
          spaceType: 'hall',
          features: '',
          amenities: [],
          availableSetupStyles: [],
        });
      }
      setActiveTab("details"); // Reset to details tab when modal opens
    }
  }, [space, open]);

  const handleSave = async () => {
    if (!formData.name || !formData.capacity) {
      toast({
        title: "Required fields missing",
        description: "Please provide space name and capacity",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const spaceData = {
        name: formData.name,
        description: formData.description,
        capacity: parseInt(formData.capacity),
        spaceType: formData.spaceType,
        features: formData.features,
        amenities: formData.amenities,
        availableSetupStyles: formData.availableSetupStyles,
        ...(isCreating && { venueId })
      };
      
      const response = isCreating 
        ? await apiRequest("POST", "/api/spaces", spaceData)
        : await apiRequest("PATCH", `/api/spaces/${space.id}`, spaceData);

      // Invalidate multiple relevant queries to ensure UI updates
      await queryClient.invalidateQueries({ queryKey: ["/api/venues"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/venues-with-spaces"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/spaces"] });
      if (venueId) {
        await queryClient.invalidateQueries({ queryKey: [`/api/venues/${venueId}/spaces`] });
      }
      
      toast({
        title: isCreating ? "Space created" : "Space updated",
        description: `${formData.name} has been ${isCreating ? 'created' : 'updated'} successfully`
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: isCreating ? "Creation failed" : "Update failed",
        description: `Could not ${isCreating ? 'create' : 'update'} space`,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetupStyleToggle = (styleValue: string) => {
    setFormData(prev => ({
      ...prev,
      availableSetupStyles: prev.availableSetupStyles.includes(styleValue)
        ? prev.availableSetupStyles.filter(s => s !== styleValue)
        : [...prev.availableSetupStyles, styleValue]
    }));
  };

  const handleAmenityToggle = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };



  const commonAmenities = [
    'WiFi', 'Projector', 'Sound System', 'Microphone', 'Whiteboard', 'Piano',
    'Bar', 'Kitchen Access', 'Parking', 'Wheelchair Accessible', 'Air Conditioning',
    'Natural Light', 'Stage', 'Dance Floor', 'Outdoor Space'
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            {isCreating ? `Add Space to ${venueName}` : `Edit Space: ${space?.name}`}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("details")}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "details"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Details & Amenities
              </button>
              <button
                onClick={() => setActiveTab("setup")}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "setup"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Setup Styles
              </button>

            </nav>
          </div>

          {activeTab === "details" && (
            <div className="space-y-6 max-h-[60vh] overflow-y-auto pt-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Space Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter space name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe this space..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="capacity">Capacity *</Label>
                      <Input
                        id="capacity"
                        type="number"
                        value={formData.capacity}
                        onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                        placeholder="Max guests"
                      />
                    </div>
                    <div>
                      <Label htmlFor="spaceType">Space Type</Label>
                      <select
                        id="spaceType"
                        value={formData.spaceType}
                        onChange={(e) => setFormData(prev => ({ ...prev, spaceType: e.target.value }))}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="hall">Hall</option>
                        <option value="ballroom">Ballroom</option>
                        <option value="conference">Conference Room</option>
                        <option value="garden">Garden/Outdoor</option>
                        <option value="pavilion">Pavilion</option>
                        <option value="terrace">Terrace</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="features">Features & Amenities</Label>
                    <Input
                      id="features"
                      value={formData.features}
                      onChange={(e) => setFormData(prev => ({ ...prev, features: e.target.value }))}
                      placeholder="Stage, Dance floor, Projector, etc."
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Amenities</Label>
                    <div className="mt-2 grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                      {commonAmenities.map(amenity => (
                        <label key={amenity} className="flex items-center space-x-2 cursor-pointer">
                          <Checkbox
                            checked={formData.amenities.includes(amenity)}
                            onCheckedChange={() => handleAmenityToggle(amenity)}
                          />
                          <span className="text-sm">{amenity}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Selected Amenities</Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {formData.amenities.map(amenity => (
                        <Badge key={amenity} variant="secondary" className="cursor-pointer" onClick={() => handleAmenityToggle(amenity)}>
                          {amenity}
                          <X className="w-3 h-3 ml-1" />
                        </Badge>
                      ))}
                      {formData.amenities.length === 0 && (
                        <span className="text-sm text-slate-500">No amenities selected</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "setup" && (
            <div className="space-y-6 max-h-[60vh] overflow-y-auto pt-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Available Setup Styles</h3>
                <p className="text-sm text-slate-600 mb-6">
                  Select which setup styles are available for this space. This will be shown when creating events.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {SETUP_STYLES.map(style => (
                    <label key={style.value} className="flex items-start space-x-3 cursor-pointer p-4 border rounded-lg hover:bg-slate-50">
                      <Checkbox
                        checked={formData.availableSetupStyles.includes(style.value)}
                        onCheckedChange={() => handleSetupStyleToggle(style.value)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{style.label}</div>
                        <div className="text-sm text-slate-600 mt-1">{style.description}</div>
                      </div>
                    </label>
                  ))}
                </div>

                <Separator className="my-6" />

                <div>
                  <h4 className="font-medium mb-3">Selected Setup Styles</h4>
                  <div className="flex flex-wrap gap-2">
                    {formData.availableSetupStyles.map(styleValue => {
                      const style = SETUP_STYLES.find(s => s.value === styleValue);
                      return style ? (
                        <Badge key={styleValue} variant="outline" className="cursor-pointer" onClick={() => handleSetupStyleToggle(styleValue)}>
                          <Grid3X3 className="w-3 h-3 mr-1" />
                          {style.label}
                          <X className="w-3 h-3 ml-1" />
                        </Badge>
                      ) : null;
                    })}
                    {formData.availableSetupStyles.length === 0 && (
                      <span className="text-sm text-slate-500">No setup styles selected</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}


        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving 
              ? (isCreating ? "Creating..." : "Saving...") 
              : (isCreating ? "Create Space" : "Save Changes")
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}