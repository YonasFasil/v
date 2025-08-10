import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FloorPlan3DDesigner } from "@/components/floor-plans/floor-plan-3d-designer";
import { 
  Grid3X3, 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Download, 
  Upload,
  Eye,
  Users,
  Sofa,
  Home,
  Music,
  Settings,
  Search,
  Filter,
  Calendar,
  Star,
  ChevronRight
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface FloorPlan {
  id: string;
  name: string;
  description?: string;
  setupStyle: string;
  venueId: string;
  planData: any;
  totalSeats: number;
  isTemplate: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SetupStyle {
  id: string;
  name: string;
  description?: string;
  iconName?: string;
  category: string;
  minCapacity?: number;
  maxCapacity?: number;
  floorPlan?: any;
  isActive: boolean;
  createdAt: string;
}

export default function FloorPlansPage() {
  const [selectedTab, setSelectedTab] = useState('plans');
  const [showDesigner, setShowDesigner] = useState(false);
  const [editingPlan, setEditingPlan] = useState<FloorPlan | null>(null);
  const [selectedSetupStyle, setSelectedSetupStyle] = useState('');
  const [selectedVenue, setSelectedVenue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlanData, setNewPlanData] = useState({
    name: '',
    description: '',
    setupStyle: '',
    venueId: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch floor plans
  const { data: floorPlans = [], isLoading } = useQuery({
    queryKey: ['/api/floor-plans'],
  });

  // Fetch venues
  const { data: venues = [] } = useQuery({
    queryKey: ['/api/venues-with-spaces'],
  });

  // Fetch setup styles
  const { data: setupStyles = [] } = useQuery<SetupStyle[]>({
    queryKey: ['/api/setup-styles'],
  });

  // Create floor plan mutation
  const createPlanMutation = useMutation({
    mutationFn: async (planData: any) => {
      return apiRequest('/api/floor-plans', 'POST', planData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/floor-plans'] });
      setShowCreateForm(false);
      setNewPlanData({ name: '', description: '', setupStyle: '', venueId: '' });
      toast({ title: "Success", description: "Floor plan created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create floor plan", variant: "destructive" });
    }
  });

  // Update floor plan mutation
  const updatePlanMutation = useMutation({
    mutationFn: async ({ id, ...planData }: any) => {
      return apiRequest(`/api/floor-plans/${id}`, 'PUT', planData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/floor-plans'] });
      setEditingPlan(null);
      toast({ title: "Success", description: "Floor plan updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update floor plan", variant: "destructive" });
    }
  });

  // Delete floor plan mutation
  const deletePlanMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/floor-plans/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/floor-plans'] });
      toast({ title: "Success", description: "Floor plan deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete floor plan", variant: "destructive" });
    }
  });

  // Map categories to colors for display
  const getCategoryColor = (category: string) => {
    const colorMap: Record<string, string> = {
      dining: 'bg-blue-50 border-blue-200 text-blue-800',
      presentation: 'bg-purple-50 border-purple-200 text-purple-800',
      meeting: 'bg-green-50 border-green-200 text-green-800',
      social: 'bg-pink-50 border-pink-200 text-pink-800',
      general: 'bg-slate-50 border-slate-200 text-slate-800'
    };
    return colorMap[category] || 'bg-gray-50 border-gray-200 text-gray-800';
  };

  // Filter floor plans
  const filteredPlans = (floorPlans as FloorPlan[]).filter((plan: FloorPlan) => {
    const matchesSearch = plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         plan.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStyle = !selectedSetupStyle || selectedSetupStyle === 'all' || plan.setupStyle === selectedSetupStyle;
    const matchesVenue = !selectedVenue || selectedVenue === 'all' || plan.venueId === selectedVenue;
    return matchesSearch && matchesStyle && matchesVenue;
  });

  // Handle save from designer
  const handleSaveFromDesigner = (planData: any) => {
    if (editingPlan) {
      updatePlanMutation.mutate({
        id: editingPlan.id,
        planData,
        totalSeats: planData.totalSeats
      });
    } else {
      createPlanMutation.mutate({
        ...newPlanData,
        planData,
        totalSeats: planData.totalSeats,
        isTemplate: false
      });
    }
    setShowDesigner(false);
  };

  // Handle create new plan
  const handleCreatePlan = () => {
    if (!newPlanData.name || !newPlanData.setupStyle || !newPlanData.venueId) {
      toast({ title: "Validation Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    
    setShowCreateForm(false);
    setShowDesigner(true);
  };

  const getVenueName = (venueId: string) => {
    const venue = (venues as any[]).find((v: any) => v.id === venueId);
    return venue?.name || 'Unknown Venue';
  };

  const getStyleConfig = (styleId: string) => {
    return setupStyles.find(s => s.id === styleId) || setupStyles[0];
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Floor Plans & Setup</h1>
          <p className="text-sm sm:text-base text-gray-600">Design and manage venue layouts for different event styles</p>
        </div>
        
        <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Create Floor Plan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Floor Plan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Plan Name *</Label>
                <Input
                  value={newPlanData.name}
                  onChange={(e) => setNewPlanData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter plan name"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={newPlanData.description}
                  onChange={(e) => setNewPlanData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description"
                />
              </div>
              <div>
                <Label>Venue *</Label>
                <Select
                  value={newPlanData.venueId}
                  onValueChange={(value) => setNewPlanData(prev => ({ ...prev, venueId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select venue" />
                  </SelectTrigger>
                  <SelectContent>
                    {(venues as any[]).map((venue: any) => (
                      <SelectItem key={venue.id} value={venue.id}>
                        {venue.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Setup Style *</Label>
                <Select
                  value={newPlanData.setupStyle}
                  onValueChange={(value) => setNewPlanData(prev => ({ ...prev, setupStyle: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select setup style" />
                  </SelectTrigger>
                  <SelectContent>
                    {setupStyles.map((style: SetupStyle) => (
                      <SelectItem key={style.id} value={style.id}>
                        {style.iconName && `${style.iconName} `}{style.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleCreatePlan} className="flex-1">
                  Continue to Designer
                </Button>
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="plans">Floor Plans</TabsTrigger>
          <TabsTrigger value="styles">Setup Styles</TabsTrigger>
        </TabsList>

        {/* Floor Plans Tab */}
        <TabsContent value="plans" className="space-y-6">
          {/* Filters */}
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm font-medium">Search</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search floor plans..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Setup Style</Label>
                <Select value={selectedSetupStyle} onValueChange={setSelectedSetupStyle}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All styles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Styles</SelectItem>
                    {setupStyles.map((style: SetupStyle) => (
                      <SelectItem key={style.id} value={style.id}>
                        {style.iconName && `${style.iconName} `}{style.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Venue</Label>
                <Select value={selectedVenue} onValueChange={setSelectedVenue}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All venues" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Venues</SelectItem>
                    {(venues as any[]).map((venue: any) => (
                      <SelectItem key={venue.id} value={venue.id}>
                        {venue.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Floor Plans Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-32 bg-gray-100 rounded mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredPlans.length === 0 ? (
            <Card className="p-12 text-center">
              <Grid3X3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Floor Plans Found</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || selectedSetupStyle || selectedVenue 
                  ? "No floor plans match your current filters."
                  : "Get started by creating your first floor plan."
                }
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Floor Plan
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlans.map((plan: FloorPlan) => {
                const styleConfig = getStyleConfig(plan.setupStyle);
                
                return (
                  <Card key={plan.id} className="group relative overflow-hidden border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all duration-200">
                    {/* Plan Header */}
                    <div className={cn("p-4 border-b", styleConfig.color.replace('text-', 'text-').replace('border-', 'border-'))}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{styleConfig.icon}</div>
                          <div>
                            <h3 className="font-semibold text-sm">{plan.name}</h3>
                            <p className="text-xs opacity-80 mt-0.5">{getVenueName(plan.venueId)}</p>
                          </div>
                        </div>
                        {plan.isTemplate && (
                          <Badge variant="secondary" className="text-xs">
                            Template
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Plan Preview - Placeholder for actual canvas rendering */}
                    <div className="h-32 bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                      <div className="text-center text-slate-500">
                        <Grid3X3 className="w-8 h-8 mx-auto mb-2" />
                        <div className="text-xs">Floor Plan Preview</div>
                      </div>
                    </div>

                    {/* Plan Details */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{styleConfig.name}</span>
                        <div className="flex items-center gap-1 text-sm text-slate-600">
                          <Users className="w-3 h-3" />
                          {plan.totalSeats} seats
                        </div>
                      </div>
                      
                      {plan.description && (
                        <p className="text-xs text-slate-600 line-clamp-2">{plan.description}</p>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="text-xs text-slate-500">
                          Updated {new Date(plan.updatedAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingPlan(plan);
                              setShowDesigner(true);
                            }}
                            className="h-7 w-7 p-0"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // Create a copy
                              setNewPlanData({
                                name: `${plan.name} (Copy)`,
                                description: plan.description || '',
                                setupStyle: plan.setupStyle,
                                venueId: plan.venueId
                              });
                              setShowDesigner(true);
                            }}
                            className="h-7 w-7 p-0"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deletePlanMutation.mutate(plan.id)}
                            className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Setup Styles Tab */}
        <TabsContent value="styles" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {setupStyles.map((style: SetupStyle) => (
              <Card key={style.id} className={cn("p-6 cursor-pointer transition-all hover:shadow-md", getCategoryColor(style.category))}>
                <div className="text-center space-y-4">
                  <div className="text-4xl">{style.iconName || '🏢'}</div>
                  <div>
                    <h3 className="font-semibold">{style.name}</h3>
                    <p className="text-sm mt-1 opacity-80">{style.description}</p>
                  </div>
                  <div className="space-y-2">
                    <Badge variant="outline" className="text-xs">
                      {style.minCapacity && style.maxCapacity ? `${style.minCapacity}-${style.maxCapacity}` : 'Flexible'}
                    </Badge>
                    <div className="pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setNewPlanData(prev => ({ ...prev, setupStyle: style.id }));
                          setShowCreateForm(true);
                        }}
                        className="w-full"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Create Plan
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* 3D Designer Modal */}
      <FloorPlan3DDesigner
        isOpen={showDesigner}
        onClose={() => {
          setShowDesigner(false);
          setEditingPlan(null);
          setNewPlanData({ name: '', description: '', setupStyle: '', venueId: '' });
        }}
        venueId={editingPlan?.venueId || newPlanData.venueId}
        setupStyle={editingPlan?.setupStyle || newPlanData.setupStyle}
        onSave={handleSaveFromDesigner}
      />
    </div>
  );
}