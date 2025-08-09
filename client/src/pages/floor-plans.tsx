import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Grid3X3, Search, MapPin, Users, Plus, Edit, Eye } from "lucide-react";
import { FloorPlanDesigner } from "@/components/venues/floor-plan-designer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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

export default function FloorPlans() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVenue, setSelectedVenue] = useState("");
  const [selectedSetupStyle, setSelectedSetupStyle] = useState("");
  const [showDesigner, setShowDesigner] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<any>(null);

  // Fetch venues with spaces
  const { data: venues = [] } = useQuery({
    queryKey: ["/api/venues"],
  });

  // Get all spaces from all venues
  const allSpaces = (venues as any[]).flatMap((venue: any) => 
    (venue.spaces || []).map((space: any) => ({
      ...space,
      venueName: venue.name,
      venueId: venue.id
    }))
  );

  // Filter spaces
  const filteredSpaces = allSpaces.filter((space: any) => {
    const matchesSearch = space.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         space.venueName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVenue = !selectedVenue || space.venueId === selectedVenue;
    const matchesSetup = !selectedSetupStyle || 
                        (space.availableSetupStyles && space.availableSetupStyles.includes(selectedSetupStyle));
    
    return matchesSearch && matchesVenue && matchesSetup;
  });

  const handleEditFloorPlan = (space: any) => {
    setSelectedSpace(space);
    setShowDesigner(true);
  };

  const handleFloorPlanSave = (floorPlan: any) => {
    // This would typically save to the API
    console.log("Floor plan saved:", floorPlan);
    setShowDesigner(false);
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Grid3X3 className="w-8 h-8 text-blue-600" />
              Floor Plans & Setup
            </h1>
            <p className="text-slate-600 mt-1">
              Design and manage floor plans for all your venue spaces
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search spaces or venues..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={selectedVenue} onValueChange={setSelectedVenue}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All venues" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All venues</SelectItem>
                  {(venues as any[]).map((venue: any) => (
                    <SelectItem key={venue.id} value={venue.id}>
                      {venue.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedSetupStyle} onValueChange={setSelectedSetupStyle}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All setup styles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All setup styles</SelectItem>
                  {SETUP_STYLES.map((style) => (
                    <SelectItem key={style.value} value={style.value}>
                      {style.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Spaces Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSpaces.map((space: any) => (
            <Card key={space.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{space.name}</CardTitle>
                    <div className="flex items-center gap-1 text-sm text-slate-600 mt-1">
                      <MapPin className="w-4 h-4" />
                      {space.venueName}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-slate-600">
                    <Users className="w-4 h-4" />
                    {space.capacity}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Floor Plan Status */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <div className="font-medium text-sm">Floor Plan</div>
                    <div className="text-xs text-slate-600">
                      {space.floorPlan ? 
                        `${space.floorPlan.elements?.length || 0} elements configured` : 
                        "No floor plan configured"
                      }
                    </div>
                  </div>
                  <Badge variant={space.floorPlan ? "default" : "secondary"}>
                    {space.floorPlan ? "Configured" : "Not Set"}
                  </Badge>
                </div>

                {/* Available Setup Styles */}
                <div>
                  <div className="font-medium text-sm mb-2">Available Setup Styles</div>
                  <div className="flex flex-wrap gap-1">
                    {space.availableSetupStyles && space.availableSetupStyles.length > 0 ? (
                      space.availableSetupStyles.map((style: string) => {
                        const styleData = SETUP_STYLES.find(s => s.value === style);
                        return (
                          <Badge key={style} variant="outline" className="text-xs">
                            {styleData?.label || style}
                          </Badge>
                        );
                      })
                    ) : (
                      <span className="text-xs text-slate-500">No setup styles configured</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => handleEditFloorPlan(space)}
                    className="flex-1"
                    size="sm"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Floor Plan
                  </Button>
                  {space.floorPlan && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditFloorPlan(space)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredSpaces.length === 0 && (
          <div className="text-center py-12">
            <Grid3X3 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No spaces found</h3>
            <p className="text-slate-600">
              {searchTerm || selectedVenue || selectedSetupStyle 
                ? "Try adjusting your filters"
                : "No spaces are available with floor plan configurations"
              }
            </p>
          </div>
        )}

        {/* Floor Plan Designer Modal */}
        <Dialog open={showDesigner} onOpenChange={setShowDesigner}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Grid3X3 className="w-5 h-5" />
                Floor Plan Designer: {selectedSpace?.name}
              </DialogTitle>
            </DialogHeader>
            
            {selectedSpace && (
              <div className="flex-1 min-h-[70vh]">
                <FloorPlanDesigner
                  spaceId={selectedSpace.id}
                  initialFloorPlan={selectedSpace.floorPlan}
                  onSave={handleFloorPlanSave}
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}