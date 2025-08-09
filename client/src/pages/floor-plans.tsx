import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { FloorPlanDesigner } from "@/components/venues/floor-plan-designer";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Upload, FileImage, Layout, Download, Sparkles, Eye, Maximize, Users } from "lucide-react";

interface FloorPlan {
  id: string;
  name: string;
  description: string;
  venueId: string;
  venueName: string;
  templateImageUrl?: string;
  elements: any[];
  dimensions: { width: number; height: number };
  scale: number;
  colorCoding: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

interface Venue {
  id: string;
  name: string;
  description: string;
}

export default function FloorPlans() {
  const [selectedFloorPlan, setSelectedFloorPlan] = useState<FloorPlan | null>(null);
  const [isDesignerOpen, setIsDesignerOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newFloorPlan, setNewFloorPlan] = useState({
    name: '',
    description: '',
    venueId: '',
    templateImageUrl: '',
    dimensions: { width: 800, height: 600 },
    scale: 1
  });
  const { toast } = useToast();

  const { data: floorPlans = [], isLoading: isLoadingFloorPlans } = useQuery({
    queryKey: ['/api/floor-plans'],
  });

  const { data: venues = [] } = useQuery({
    queryKey: ['/api/venues'],
  });

  const createFloorPlanMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/floor-plans', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/floor-plans'] });
      setIsCreateModalOpen(false);
      setNewFloorPlan({
        name: '',
        description: '',
        venueId: '',
        templateImageUrl: '',
        dimensions: { width: 800, height: 600 },
        scale: 1
      });
      toast({
        title: "Floor plan created",
        description: "Your floor plan has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create floor plan.",
        variant: "destructive",
      });
    },
  });

  const updateFloorPlanMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      apiRequest('PUT', `/api/floor-plans/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/floor-plans'] });
      toast({
        title: "Floor plan updated",
        description: "Your floor plan has been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update floor plan.",
        variant: "destructive",
      });
    },
  });

  const generateAILayoutMutation = useMutation({
    mutationFn: (data: { floorPlanId: string; guestCount: number; eventType: string; preferences: string }) =>
      apiRequest('POST', '/api/floor-plans/generate-ai-layout', data),
    onSuccess: async (response) => {
      const result = await response.json();
      if (selectedFloorPlan) {
        setSelectedFloorPlan({ ...selectedFloorPlan, elements: result.elements });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/floor-plans'] });
      toast({
        title: "AI Layout Generated",
        description: "AI has generated an optimized layout for your event.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate AI layout.",
        variant: "destructive",
      });
    },
  });

  const handleTemplateUpload = async () => {
    try {
      const response = await apiRequest('POST', '/api/objects/upload');
      const data = await response.json();
      return { method: 'PUT' as const, url: data.uploadURL };
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get upload URL.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleTemplateUploadComplete = (result: any) => {
    if (result.successful && result.successful[0]) {
      const uploadedUrl = result.successful[0].uploadURL;
      setNewFloorPlan(prev => ({ ...prev, templateImageUrl: uploadedUrl }));
      toast({
        title: "Template uploaded",
        description: "Floor plan template has been uploaded successfully.",
      });
    }
  };

  const handleSaveFloorPlan = (floorPlanData: any) => {
    if (selectedFloorPlan) {
      updateFloorPlanMutation.mutate({
        id: selectedFloorPlan.id,
        data: {
          ...selectedFloorPlan,
          ...floorPlanData,
          updatedAt: new Date().toISOString()
        }
      });
    }
    setIsDesignerOpen(false);
  };

  const exportToPDF = async (floorPlan: FloorPlan) => {
    try {
      const response = await apiRequest('POST', `/api/floor-plans/${floorPlan.id}/export-pdf`);
      const data = await response.json();
      
      // Create download link
      const link = document.createElement('a');
      link.href = data.downloadUrl;
      link.download = `${floorPlan.name}-floor-plan.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export successful",
        description: "Floor plan has been exported to PDF.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export floor plan.",
        variant: "destructive",
      });
    }
  };

  if (isLoadingFloorPlans) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Floor Plans</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Floor Plans</h1>
          <p className="text-muted-foreground">
            Manage venue floor plans with templates, drag-and-drop design, and AI suggestions
          </p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Layout className="w-4 h-4 mr-2" />
              Create Floor Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Floor Plan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={newFloorPlan.name}
                  onChange={(e) => setNewFloorPlan(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter floor plan name"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={newFloorPlan.description}
                  onChange={(e) => setNewFloorPlan(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter description"
                />
              </div>
              <div className="space-y-2">
                <Label>Venue</Label>
                <Select value={newFloorPlan.venueId} onValueChange={(value) => setNewFloorPlan(prev => ({ ...prev, venueId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select venue" />
                  </SelectTrigger>
                  <SelectContent>
                    {venues.map((venue: Venue) => (
                      <SelectItem key={venue.id} value={venue.id}>
                        {venue.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Template Image (Optional)</Label>
                <ObjectUploader
                  maxNumberOfFiles={1}
                  maxFileSize={10485760}
                  onGetUploadParameters={handleTemplateUpload}
                  onComplete={handleTemplateUploadComplete}
                  buttonClassName="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Template
                </ObjectUploader>
                {newFloorPlan.templateImageUrl && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <FileImage className="w-4 h-4" />
                    Template uploaded
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Width (px)</Label>
                  <Input
                    type="number"
                    value={newFloorPlan.dimensions.width}
                    onChange={(e) => setNewFloorPlan(prev => ({ 
                      ...prev, 
                      dimensions: { ...prev.dimensions, width: parseInt(e.target.value) || 800 }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Height (px)</Label>
                  <Input
                    type="number"
                    value={newFloorPlan.dimensions.height}
                    onChange={(e) => setNewFloorPlan(prev => ({ 
                      ...prev, 
                      dimensions: { ...prev.dimensions, height: parseInt(e.target.value) || 600 }
                    }))}
                  />
                </div>
              </div>
              <Button 
                onClick={() => {
                  const selectedVenue = venues.find((v: Venue) => v.id === newFloorPlan.venueId);
                  const floorPlanData = {
                    ...newFloorPlan,
                    venueName: selectedVenue?.name || '',
                    dimensions: JSON.stringify(newFloorPlan.dimensions),
                    elements: JSON.stringify([]),
                    colorCoding: JSON.stringify({}),
                  };
                  createFloorPlanMutation.mutate(floorPlanData);
                }}
                disabled={!newFloorPlan.name || !newFloorPlan.venueId || createFloorPlanMutation.isPending}
                className="w-full"
              >
                {createFloorPlanMutation.isPending ? "Creating..." : "Create Floor Plan"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Floor Plans</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {floorPlans.map((floorPlan: FloorPlan) => (
              <Card key={floorPlan.id} className="overflow-hidden">
                <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 relative">
                  {floorPlan.templateImageUrl ? (
                    <img 
                      src={floorPlan.templateImageUrl} 
                      alt={floorPlan.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400">
                      <Layout className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Badge variant="secondary" className="text-xs">
                      {floorPlan.elements?.length || 0} elements
                    </Badge>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold">{floorPlan.name}</h3>
                    <p className="text-sm text-muted-foreground">{floorPlan.venueName}</p>
                    {floorPlan.description && (
                      <p className="text-xs text-muted-foreground mt-1">{floorPlan.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedFloorPlan(floorPlan);
                        setIsDesignerOpen(true);
                      }}
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Design
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => exportToPDF(floorPlan)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="flex-1">
                          <Sparkles className="w-4 h-4 mr-1" />
                          AI Layout
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Generate AI Layout</DialogTitle>
                        </DialogHeader>
                        <AILayoutGenerator 
                          floorPlan={floorPlan} 
                          onGenerate={(data) => {
                            setSelectedFloorPlan(floorPlan);
                            generateAILayoutMutation.mutate(data);
                          }}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recent">
          <div className="text-center py-8 text-muted-foreground">
            Recent floor plans will appear here
          </div>
        </TabsContent>

        <TabsContent value="templates">
          <div className="text-center py-8 text-muted-foreground">
            Floor plan templates will appear here
          </div>
        </TabsContent>
      </Tabs>

      {/* Floor Plan Designer Modal */}
      <Dialog open={isDesignerOpen} onOpenChange={setIsDesignerOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layout className="w-5 h-5" />
              {selectedFloorPlan?.name} - Floor Plan Designer
            </DialogTitle>
          </DialogHeader>
          {selectedFloorPlan && (
            <FloorPlanDesigner
              floorPlan={selectedFloorPlan}
              onSave={handleSaveFloorPlan}
              onClose={() => setIsDesignerOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// AI Layout Generator Component
function AILayoutGenerator({ 
  floorPlan, 
  onGenerate 
}: { 
  floorPlan: FloorPlan; 
  onGenerate: (data: any) => void;
}) {
  const [guestCount, setGuestCount] = useState(50);
  const [eventType, setEventType] = useState('');
  const [preferences, setPreferences] = useState('');

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Guest Count</Label>
        <Input
          type="number"
          value={guestCount}
          onChange={(e) => setGuestCount(parseInt(e.target.value) || 50)}
          placeholder="Number of guests"
        />
      </div>
      <div className="space-y-2">
        <Label>Event Type</Label>
        <Select value={eventType} onValueChange={setEventType}>
          <SelectTrigger>
            <SelectValue placeholder="Select event type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="wedding">Wedding</SelectItem>
            <SelectItem value="corporate">Corporate Event</SelectItem>
            <SelectItem value="party">Party</SelectItem>
            <SelectItem value="conference">Conference</SelectItem>
            <SelectItem value="gala">Gala</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Layout Preferences</Label>
        <Select value={preferences} onValueChange={setPreferences}>
          <SelectTrigger>
            <SelectValue placeholder="Select preference" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="maximize_space">Maximize Space</SelectItem>
            <SelectItem value="maximize_visibility">Maximize Visibility</SelectItem>
            <SelectItem value="social_interaction">Encourage Social Interaction</SelectItem>
            <SelectItem value="formal_arrangement">Formal Arrangement</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button 
        onClick={() => onGenerate({
          floorPlanId: floorPlan.id,
          guestCount,
          eventType,
          preferences
        })}
        disabled={!eventType || !preferences}
        className="w-full"
      >
        <Sparkles className="w-4 h-4 mr-2" />
        Generate AI Layout
      </Button>
    </div>
  );
}