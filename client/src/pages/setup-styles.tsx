import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Grid3X3, Plus, Edit, Trash2, Users, Search, Filter, Layout } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { SetupStyleFloorPlanModal } from "@/components/forms/setup-style-floor-plan-modal";

const CATEGORIES = [
  { value: 'dining', label: 'Dining', color: 'bg-orange-100 text-orange-700' },
  { value: 'meeting', label: 'Meeting', color: 'bg-blue-100 text-blue-700' },
  { value: 'presentation', label: 'Presentation', color: 'bg-purple-100 text-purple-700' },
  { value: 'social', label: 'Social', color: 'bg-green-100 text-green-700' },
  { value: 'custom', label: 'Custom', color: 'bg-slate-100 text-slate-700' },
  { value: 'general', label: 'General', color: 'bg-gray-100 text-gray-700' }
];

const ICON_OPTIONS = [
  'Users', 'Grid3X3', 'Square', 'Circle', 'Triangle', 'Utensils', 
  'Presentation', 'Monitor', 'Coffee', 'Music', 'Mic', 'Camera'
];

interface SetupStyleFormData {
  name: string;
  description: string;
  category: string;
  iconName: string;
  minCapacity?: number;
  maxCapacity?: number;
}

export default function SetupStyles() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFloorPlanModal, setShowFloorPlanModal] = useState(false);
  const [editingStyle, setEditingStyle] = useState<any>(null);
  const [floorPlanStyle, setFloorPlanStyle] = useState<any>(null);
  const [formData, setFormData] = useState<SetupStyleFormData>({
    name: "",
    description: "",
    category: "general",
    iconName: "Grid3X3",
    minCapacity: undefined,
    maxCapacity: undefined
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch setup styles
  const { data: setupStyles = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/setup-styles"],
  });

  // Create setup style mutation
  const createMutation = useMutation({
    mutationFn: (data: SetupStyleFormData) => apiRequest("POST", "/api/setup-styles", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/setup-styles"] });
      setShowCreateModal(false);
      resetForm();
      toast({
        title: "Setup style created",
        description: "The new setup style has been added successfully."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create setup style. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Update setup style mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<SetupStyleFormData> }) => 
      apiRequest("PATCH", `/api/setup-styles/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/setup-styles"] });
      setEditingStyle(null);
      setShowCreateModal(false);
      resetForm();
      toast({
        title: "Setup style updated",
        description: "The setup style has been updated successfully."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update setup style. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Delete setup style mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/setup-styles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/setup-styles"] });
      toast({
        title: "Setup style deleted",
        description: "The setup style has been deleted successfully."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete setup style. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Update floor plan mutation
  const updateFloorPlanMutation = useMutation({
    mutationFn: ({ id, floorPlan }: { id: string, floorPlan: any }) => 
      apiRequest("PATCH", `/api/setup-styles/${id}`, { floorPlan }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/setup-styles"] });
      toast({
        title: "Floor plan saved",
        description: "The floor plan has been saved to the setup style."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save floor plan. Please try again.",
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "general",
      iconName: "Grid3X3",
      minCapacity: undefined,
      maxCapacity: undefined
    });
  };

  const handleEdit = (style: any) => {
    setEditingStyle(style);
    setFormData({
      name: style.name,
      description: style.description || "",
      category: style.category,
      iconName: style.iconName || "Grid3X3",
      minCapacity: style.minCapacity,
      maxCapacity: style.maxCapacity
    });
    setShowCreateModal(true);
  };

  const handleSubmit = () => {
    if (editingStyle) {
      updateMutation.mutate({ id: editingStyle.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this setup style?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleFloorPlanSave = (floorPlan: any) => {
    if (floorPlanStyle) {
      updateFloorPlanMutation.mutate({ id: floorPlanStyle.id, floorPlan });
    }
  };

  // Filter setup styles
  const filteredStyles = setupStyles.filter((style: any) => {
    const matchesSearch = style.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         style.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || style.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    return CATEGORIES.find(cat => cat.value === category)?.color || 'bg-gray-100 text-gray-700';
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Grid3X3 className="w-8 h-8 text-blue-600" />
              Setup Styles
            </h1>
            <p className="text-slate-600 mt-1">
              Manage event setup configurations that can be applied to any venue
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Setup Style
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search setup styles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Setup Styles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStyles.map((style: any) => (
            <Card key={style.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white">
                      <Grid3X3 className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{style.name}</CardTitle>
                      <Badge className={`mt-1 ${getCategoryColor(style.category)}`}>
                        {CATEGORIES.find(cat => cat.value === style.category)?.label || style.category}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(style)}
                      title="Edit setup style"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFloorPlanStyle(style);
                        setShowFloorPlanModal(true);
                      }}
                      title="Design floor plan"
                    >
                      <Layout className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(style.id)}
                      className="text-red-600 hover:text-red-700"
                      title="Delete setup style"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {style.description && (
                  <p className="text-sm text-slate-600">{style.description}</p>
                )}
                
                {(style.minCapacity || style.maxCapacity) && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Users className="w-4 h-4" />
                    {style.minCapacity && style.maxCapacity 
                      ? `${style.minCapacity} - ${style.maxCapacity} guests`
                      : style.minCapacity 
                        ? `${style.minCapacity}+ guests`
                        : `Up to ${style.maxCapacity} guests`
                    }
                  </div>
                )}
                
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-500">
                      Created {new Date(style.createdAt).toLocaleDateString()}
                    </div>
                    {style.floorPlan && (
                      <div className="flex items-center gap-1 text-xs text-blue-600">
                        <Layout className="w-3 h-3" />
                        Floor plan
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredStyles.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Grid3X3 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No setup styles found</h3>
            <p className="text-slate-600 mb-4">
              {searchTerm || selectedCategory !== "all" 
                ? "Try adjusting your filters"
                : "Create your first setup style to get started"
              }
            </p>
            {!searchTerm && selectedCategory === "all" && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Setup Style
              </Button>
            )}
          </div>
        )}

        {/* Create/Edit Modal */}
        <Dialog open={showCreateModal} onOpenChange={(open) => {
          setShowCreateModal(open);
          if (!open) {
            setEditingStyle(null);
            resetForm();
          }
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingStyle ? "Edit Setup Style" : "Create New Setup Style"}
              </DialogTitle>
              <DialogDescription>
                {editingStyle 
                  ? "Update the setup style configuration below."
                  : "Create a new setup style that can be applied to any venue during event booking."
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Round Tables, Theater Style"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe when this setup style should be used..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="icon">Icon</Label>
                  <Select
                    value={formData.iconName}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, iconName: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ICON_OPTIONS.map((icon) => (
                        <SelectItem key={icon} value={icon}>
                          {icon}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minCapacity">Min Capacity</Label>
                  <Input
                    id="minCapacity"
                    type="number"
                    min="1"
                    value={formData.minCapacity || ""}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      minCapacity: e.target.value ? parseInt(e.target.value) : undefined 
                    }))}
                    placeholder="Optional"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxCapacity">Max Capacity</Label>
                  <Input
                    id="maxCapacity"
                    type="number"
                    min="1"
                    value={formData.maxCapacity || ""}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      maxCapacity: e.target.value ? parseInt(e.target.value) : undefined 
                    }))}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingStyle(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={!formData.name || createMutation.isPending || updateMutation.isPending}
                >
                  {editingStyle ? "Update" : "Create"} Setup Style
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Floor Plan Designer Modal */}
        <SetupStyleFloorPlanModal
          open={showFloorPlanModal}
          onOpenChange={setShowFloorPlanModal}
          setupStyle={floorPlanStyle}
          onSave={handleFloorPlanSave}
        />
      </div>
    </AppLayout>
  );
}