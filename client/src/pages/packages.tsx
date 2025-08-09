import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { Package, Plus, Edit, Trash2, DollarSign, Check, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { EditPackageModal } from "@/components/forms/edit-package-modal";
import { EditServiceModal } from "@/components/forms/edit-service-modal";

export default function Packages() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showCreatePackageForm, setShowCreatePackageForm] = useState(false);
  const [showCreateServiceForm, setShowCreateServiceForm] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);
  const [editingService, setEditingService] = useState<any>(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [duplicatingService, setDuplicatingService] = useState<any>(null);
  const [categories, setCategories] = useState([
    { id: "catering", name: "Catering", color: "bg-orange-100 text-orange-800" },
    { id: "entertainment", name: "Entertainment", color: "bg-purple-100 text-purple-800" },
    { id: "decor", name: "Decor", color: "bg-pink-100 text-pink-800" },
    { id: "photography", name: "Photography", color: "bg-blue-100 text-blue-800" },
    { id: "equipment", name: "Equipment", color: "bg-gray-100 text-gray-800" },
    { id: "additional", name: "Additional Services", color: "bg-green-100 text-green-800" }
  ]);
  const [newCategory, setNewCategory] = useState({ name: "", color: "bg-blue-100 text-blue-800" });
  const { toast } = useToast();

  const getCategoryColor = (category: string) => {
    const categoryConfig = categories.find(c => c.id === category);
    return categoryConfig?.color || "bg-gray-100 text-gray-800";
  };

  const { data: packages, isLoading: packagesLoading } = useQuery({
    queryKey: ["/api/packages"],
  });

  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ["/api/services"],
  });

  const [newPackage, setNewPackage] = useState({
    name: "",
    description: "",
    basePrice: "",
    category: "wedding",
    includedServices: [] as string[]
  });

  const [newService, setNewService] = useState({
    name: "",
    description: "",
    price: "",
    category: "additional",
    pricingModel: "fixed"
  });

  const createPackage = async () => {
    if (!newPackage.name || !newPackage.basePrice) {
      toast({
        title: "Required fields missing",
        description: "Please provide package name and base price",
        variant: "destructive"
      });
      return;
    }

    try {
      await apiRequest("POST", "/api/packages", {
        name: newPackage.name,
        description: newPackage.description,
        category: newPackage.category,
        price: parseFloat(newPackage.basePrice),
        pricingModel: "fixed",
        includedServiceIds: newPackage.includedServices
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/packages"] });
      
      setShowCreatePackageForm(false);
      setNewPackage({
        name: "",
        description: "",
        basePrice: "",
        category: "wedding",
        includedServices: [] as string[]
      });
      
      toast({
        title: "Package created",
        description: `${newPackage.name} has been added successfully`
      });
    } catch (error) {
      toast({
        title: "Creation failed",
        description: "Could not create package",
        variant: "destructive"
      });
    }
  };

  const createService = async () => {
    if (!newService.name || !newService.price) {
      toast({
        title: "Required fields missing",
        description: "Please provide service name and price",
        variant: "destructive"
      });
      return;
    }

    try {
      await apiRequest("POST", "/api/services", {
        ...newService,
        price: parseFloat(newService.price)
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      
      setShowCreateServiceForm(false);
      setNewService({
        name: "",
        description: "",
        price: "",
        category: "additional",
        pricingModel: "fixed"
      });
      
      toast({
        title: "Service created",
        description: `${newService.name} has been added successfully`
      });
    } catch (error) {
      toast({
        title: "Creation failed",
        description: "Could not create service",
        variant: "destructive"
      });
    }
  };

  const duplicateService = async (service: any) => {
    try {
      const duplicatedService = {
        name: `${service.name} (Copy)`,
        description: service.description,
        price: service.price,
        category: service.category,
        pricingModel: service.pricingModel
      };
      
      await apiRequest("POST", "/api/services", duplicatedService);
      await queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      
      toast({
        title: "Service duplicated",
        description: `${duplicatedService.name} has been created successfully`
      });
    } catch (error) {
      toast({
        title: "Duplication failed",
        description: "Could not duplicate service",
        variant: "destructive"
      });
    }
  };

  const duplicatePackage = async (packageData: any) => {
    try {
      const duplicatedPackage = {
        name: `${packageData.name} (Copy)`,
        description: packageData.description,
        price: packageData.price,
        services: packageData.services || [],
        category: packageData.category
      };
      
      await apiRequest("POST", "/api/packages", duplicatedPackage);
      await queryClient.invalidateQueries({ queryKey: ["/api/packages"] });
      
      toast({
        title: "Package duplicated",
        description: `${duplicatedPackage.name} has been created successfully`
      });
    } catch (error) {
      toast({
        title: "Duplication failed",
        description: "Could not duplicate package",
        variant: "destructive"
      });
    }
  };

  if (packagesLoading || servicesLoading) {
    return (
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Packages & Services" subtitle="Manage event packages and add-on services" />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      
      <MobileNav 
        isOpen={mobileNavOpen} 
        onClose={() => setMobileNavOpen(false)} 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Packages & Services" 
          subtitle="Manage event packages and additional services"
          onMobileMenuToggle={() => setMobileNavOpen(true)}
          action={
            <div className="flex gap-2">
              <Dialog open={showCreateServiceForm} onOpenChange={setShowCreateServiceForm}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Service
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New Service</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Service Name *</Label>
                      <Input
                        placeholder="e.g., Professional Photography"
                        value={newService.name}
                        onChange={(e) => setNewService(prev => ({ ...prev, name: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Description</Label>
                      <Textarea
                        placeholder="Describe the service..."
                        value={newService.description}
                        onChange={(e) => setNewService(prev => ({ ...prev, description: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm font-medium">Price *</Label>
                        <Input
                          type="number"
                          placeholder="500"
                          value={newService.price}
                          onChange={(e) => setNewService(prev => ({ ...prev, price: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Pricing Model</Label>
                        <select
                          value={newService.pricingModel || 'fixed'}
                          onChange={(e) => setNewService(prev => ({ ...prev, pricingModel: e.target.value }))}
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                        >
                          <option value="fixed">Fixed Price</option>
                          <option value="per_person">Per Person</option>
                          <option value="per_hour">Per Hour</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Category</Label>
                      <select
                        value={newService.category}
                        onChange={(e) => setNewService(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <Button
                      onClick={createService}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      disabled={!newService.name || !newService.price}
                    >
                      Create Service
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Dialog open={showCreatePackageForm} onOpenChange={setShowCreatePackageForm}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Package
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Package</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6">
                    {/* Basic Package Info */}
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Package Name *</Label>
                        <Input
                          placeholder="e.g., Premium Wedding Package"
                          value={newPackage.name}
                          onChange={(e) => setNewPackage(prev => ({ ...prev, name: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Description</Label>
                        <Textarea
                          placeholder="Describe what's included in this package..."
                          value={newPackage.description}
                          onChange={(e) => setNewPackage(prev => ({ ...prev, description: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-sm font-medium">Base Price *</Label>
                          <Input
                            type="number"
                            placeholder="2500"
                            value={newPackage.basePrice}
                            onChange={(e) => setNewPackage(prev => ({ ...prev, basePrice: e.target.value }))}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Category</Label>
                          <select
                            value={newPackage.category}
                            onChange={(e) => setNewPackage(prev => ({ ...prev, category: e.target.value }))}
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="wedding">Wedding</option>
                            <option value="corporate">Corporate</option>
                            <option value="social">Social</option>
                            <option value="conference">Conference</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Included Services Selection */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <Label className="text-base font-medium">Included Services</Label>
                        <Badge variant="outline" className="text-xs">
                          {newPackage.includedServices.length} selected
                        </Badge>
                      </div>
                      
                      {Array.isArray(services) && services.length > 0 ? (
                        <div className="space-y-3 max-h-60 overflow-y-auto border rounded-lg p-3">
                          {services.map((service: any) => {
                            const isSelected = newPackage.includedServices.includes(service.id);
                            return (
                              <div
                                key={service.id}
                                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                  isSelected 
                                    ? 'border-blue-500 bg-blue-50' 
                                    : 'border-slate-200 hover:border-slate-300'
                                }`}
                                onClick={() => {
                                  setNewPackage(prev => ({
                                    ...prev,
                                    includedServices: isSelected
                                      ? prev.includedServices.filter((id: string) => id !== service.id)
                                      : [...prev.includedServices, service.id]
                                  }));
                                }}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="font-medium text-sm">{service.name}</div>
                                    <div className="text-xs text-slate-600 mt-1">
                                      {service.description}
                                    </div>
                                    <div className="text-sm font-semibold text-green-600 mt-2">
                                      ${parseFloat(service.price).toFixed(2)}
                                      <span className="text-xs text-slate-500">
                                        {service.pricingModel === 'per_person' && ' per person'}
                                        {service.pricingModel === 'per_hour' && ' per hour'}
                                        {service.pricingModel === 'fixed' && ' fixed'}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="ml-3">
                                    {isSelected ? (
                                      <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
                                        <Check className="w-3 h-3 text-white" />
                                      </div>
                                    ) : (
                                      <div className="w-5 h-5 border-2 border-slate-300 rounded"></div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center p-6 bg-slate-50 rounded-lg">
                          <p className="text-sm text-slate-600">No services available</p>
                          <p className="text-xs text-slate-500 mt-1">Create services first to include them in packages</p>
                        </div>
                      )}
                    </div>

                    {/* Package Summary */}
                    {newPackage.includedServices.length > 0 && (
                      <div className="bg-slate-50 p-4 rounded-lg">
                        <h4 className="font-medium text-sm mb-3">Package Summary</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Base Price:</span>
                            <span className="font-medium">
                              ${newPackage.basePrice ? parseFloat(newPackage.basePrice).toFixed(2) : '0.00'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Included Services:</span>
                            <span className="font-medium">{newPackage.includedServices.length} services</span>
                          </div>
                          <div className="text-xs text-slate-600 mt-2">
                            Services are included in the base price. Additional services can be added during event creation.
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <Button
                      onClick={createPackage}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      disabled={!newPackage.name || !newPackage.basePrice}
                    >
                      Create Package
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          }
        />
        
        <main className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Event Packages Section */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Package className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold">Event Packages</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.isArray(packages) && packages.map((pkg: any) => (
                <Card key={pkg.id} className="hover:shadow-lg transition-shadow group">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{pkg.name}</CardTitle>
                      <Badge className={getCategoryColor(pkg.category)}>
                        {pkg.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {pkg.description || "No description available"}
                    </p>
                    
                    <div className="text-2xl font-bold text-blue-600">
                      ${pkg.price?.toLocaleString() || 0}
                    </div>
                    
                    {pkg.includedServiceIds && pkg.includedServiceIds.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-700">Included Services:</p>
                        <div className="flex flex-wrap gap-1">
                          {pkg.includedServiceIds.slice(0, 3).map((serviceId: string, index: number) => {
                            const service = Array.isArray(services) ? services.find((s: any) => s.id === serviceId) : null;
                            return (
                              <Badge key={index} variant="outline" className="text-xs">
                                {service?.name || 'Unknown Service'}
                              </Badge>
                            );
                          })}
                          {pkg.includedServiceIds.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{pkg.includedServiceIds.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingPackage(pkg);
                        }}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs border-blue-200 text-blue-600 hover:bg-blue-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicatePackage(pkg);
                        }}
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Duplicate
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Separator />

          {/* Service Categories Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <h2 className="text-xl font-semibold">Service Categories</h2>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowCategoryManager(true)}
                className="border-green-600 text-green-600 hover:bg-green-50"
              >
                <Edit className="w-4 h-4 mr-2" />
                Manage Categories
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
              {categories.map((category) => (
                <div key={category.id} className="text-center">
                  <Badge className={`${category.color} px-3 py-2 w-full justify-center`}>
                    {category.name}
                  </Badge>
                  <div className="text-xs text-gray-500 mt-1">
                    {Array.isArray(services) ? services.filter((s: any) => s.category === category.id).length : 0} services
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Services Section */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <DollarSign className="w-5 h-5 text-green-600" />
              <h2 className="text-xl font-semibold">Services</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.isArray(services) && services.map((service: any) => (
                <Card key={service.id} className="hover:shadow-md transition-shadow group">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-sm">{service.name}</h3>
                      <Badge variant="outline" className={`text-xs ${getCategoryColor(service.category)}`}>
                        {service.category}
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                      {service.description || "No description"}
                    </p>
                    
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-lg font-semibold text-green-600">
                        ${service.price}
                      </div>
                      <div className="text-xs text-gray-500">
                        {service.pricingModel === 'per_person' && 'per person'}
                        {service.pricingModel === 'per_hour' && 'per hour'}
                        {service.pricingModel === 'fixed' && 'fixed price'}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingService(service);
                        }}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs border-blue-200 text-blue-600 hover:bg-blue-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateService(service);
                        }}
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Duplicate
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          
          <EditPackageModal 
            open={!!editingPackage} 
            onOpenChange={(open) => !open && setEditingPackage(null)} 
            package={editingPackage}
          />
          
          <EditServiceModal 
            open={!!editingService} 
            onOpenChange={(open) => !open && setEditingService(null)} 
            service={editingService}
          />
          
          {/* Category Management Modal */}
          <Dialog open={showCategoryManager} onOpenChange={setShowCategoryManager}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Manage Service Categories</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Add New Category */}
                <div className="p-4 border rounded-lg bg-gray-50">
                  <h3 className="font-medium mb-3">Add New Category</h3>
                  <div className="flex gap-3">
                    <Input
                      placeholder="Category name"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                      className="flex-1"
                    />
                    <select
                      value={newCategory.color}
                      onChange={(e) => setNewCategory(prev => ({ ...prev, color: e.target.value }))}
                      className="px-3 py-2 border rounded-md text-sm"
                    >
                      <option value="bg-blue-100 text-blue-800">Blue</option>
                      <option value="bg-green-100 text-green-800">Green</option>
                      <option value="bg-purple-100 text-purple-800">Purple</option>
                      <option value="bg-orange-100 text-orange-800">Orange</option>
                      <option value="bg-pink-100 text-pink-800">Pink</option>
                      <option value="bg-gray-100 text-gray-800">Gray</option>
                      <option value="bg-red-100 text-red-800">Red</option>
                      <option value="bg-yellow-100 text-yellow-800">Yellow</option>
                    </select>
                    <Button
                      onClick={() => {
                        if (newCategory.name.trim()) {
                          const id = newCategory.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                          setCategories(prev => [...prev, { 
                            id, 
                            name: newCategory.name.trim(), 
                            color: newCategory.color 
                          }]);
                          setNewCategory({ name: "", color: "bg-blue-100 text-blue-800" });
                          toast({ title: "Category added successfully!" });
                        }
                      }}
                      disabled={!newCategory.name.trim()}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  </div>
                </div>
                
                {/* Existing Categories */}
                <div>
                  <h3 className="font-medium mb-3">Existing Categories</h3>
                  <div className="space-y-2">
                    {categories.map((category, index) => (
                      <div key={category.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <Badge className={`${category.color} px-3 py-1`}>
                          {category.name}
                        </Badge>
                        <span className="text-sm text-gray-500 flex-1">
                          ID: {category.id} • {Array.isArray(services) ? services.filter((s: any) => s.category === category.id).length : 0} services
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Delete category "${category.name}"? Services using this category will need to be updated.`)) {
                              setCategories(prev => prev.filter((_, i) => i !== index));
                              toast({ title: "Category deleted successfully!" });
                            }
                          }}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setShowCategoryManager(false)}>
                  Close
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}