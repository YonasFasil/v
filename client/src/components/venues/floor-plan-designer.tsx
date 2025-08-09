import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RotateCcw, Square, Circle, Save, Plus, Trash2, Move, RotateCw, Layout, Box, Eye, ZoomIn, ZoomOut, Download, Upload, Palette, Grid3X3, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { ObjectUploader } from "@/components/ObjectUploader";
import { useToast } from "@/hooks/use-toast";

interface FloorPlanElement {
  id: string;
  type: 'table' | 'stage' | 'bar' | 'door' | 'wall' | 'chair' | 'booth' | 'dance_floor' | 'buffet';
  shape: 'rectangle' | 'circle' | 'square';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  seats?: number;
  label?: string;
  color: string;
  colorCode?: 'standard' | 'vip' | 'staff' | 'reserved' | 'disabled';
}

interface FloorPlanDesignerProps {
  floorPlan: any;
  onSave: (floorPlan: any) => void;
  onClose: () => void;
}

const ELEMENT_TYPES = [
  { type: 'table', label: 'Round Table', shape: 'circle', defaultSize: { width: 60, height: 60 }, color: '#8B4513', icon: Circle, category: 'seating' },
  { type: 'table', label: 'Rectangle Table', shape: 'rectangle', defaultSize: { width: 80, height: 40 }, color: '#8B4513', icon: Square, category: 'seating' },
  { type: 'chair', label: 'Chair', shape: 'rectangle', defaultSize: { width: 20, height: 20 }, color: '#654321', icon: Square, category: 'seating' },
  { type: 'booth', label: 'Booth', shape: 'rectangle', defaultSize: { width: 80, height: 60 }, color: '#7C2D12', icon: Square, category: 'seating' },
  { type: 'stage', label: 'Stage', shape: 'rectangle', defaultSize: { width: 120, height: 80 }, color: '#4A5568', icon: Square, category: 'entertainment' },
  { type: 'dance_floor', label: 'Dance Floor', shape: 'rectangle', defaultSize: { width: 100, height: 100 }, color: '#7C3AED', icon: Square, category: 'entertainment' },
  { type: 'bar', label: 'Bar', shape: 'rectangle', defaultSize: { width: 100, height: 30 }, color: '#2D3748', icon: Square, category: 'service' },
  { type: 'buffet', label: 'Buffet Area', shape: 'rectangle', defaultSize: { width: 120, height: 40 }, color: '#059669', icon: Square, category: 'service' },
  { type: 'door', label: 'Door', shape: 'rectangle', defaultSize: { width: 40, height: 10 }, color: '#F7FAFC', icon: Square, category: 'structure' },
  { type: 'wall', label: 'Wall', shape: 'rectangle', defaultSize: { width: 10, height: 100 }, color: '#1A202C', icon: Square, category: 'structure' },
];

const COLOR_CODES = {
  'standard': '#8B4513',
  'vip': '#DC2626',
  'staff': '#059669',
  'reserved': '#7C3AED',
  'disabled': '#6B7280'
};

export function FloorPlanDesigner({ floorPlan, onSave, onClose }: FloorPlanDesignerProps) {
  const [elements, setElements] = useState<FloorPlanElement[]>(floorPlan.elements || []);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [mode, setMode] = useState<'select' | 'add'>('select');
  const [selectedType, setSelectedType] = useState(ELEMENT_TYPES[0]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [canvasSize] = useState(floorPlan.dimensions || { width: 800, height: 600 });
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [zoom, setZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(true);
  const [backgroundImage, setBackgroundImage] = useState(floorPlan.templateImageUrl || '');
  const [activeCategory, setActiveCategory] = useState('all');
  const canvasRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const selectedElementData = elements.find(el => el.id === selectedElementId);

  const addElement = useCallback((x: number, y: number) => {
    if (mode !== 'add') return;

    const newElement: FloorPlanElement = {
      id: crypto.randomUUID(),
      type: selectedType.type as any,
      shape: selectedType.shape as any,
      x: Math.max(0, Math.min(x - selectedType.defaultSize.width / 2, canvasSize.width - selectedType.defaultSize.width)),
      y: Math.max(0, Math.min(y - selectedType.defaultSize.height / 2, canvasSize.height - selectedType.defaultSize.height)),
      width: selectedType.defaultSize.width,
      height: selectedType.defaultSize.height,
      rotation: 0,
      label: selectedType.label,
      color: selectedType.color,
      colorCode: 'standard',
      seats: selectedType.type === 'table' ? 4 : undefined,
    };

    setElements(prev => [...prev, newElement]);
    setSelectedElementId(newElement.id);
    setMode('select');
  }, [mode, selectedType, canvasSize]);

  const updateSelectedElement = useCallback((updates: Partial<FloorPlanElement>) => {
    if (!selectedElementId) return;

    setElements(prev => prev.map(el => 
      el.id === selectedElementId ? { ...el, ...updates } : el
    ));
  }, [selectedElementId]);

  const deleteSelectedElement = useCallback(() => {
    if (!selectedElementId) return;

    setElements(prev => prev.filter(el => el.id !== selectedElementId));
    setSelectedElementId(null);
  }, [selectedElementId]);

  const rotateSelectedElement = useCallback(() => {
    if (!selectedElementId) return;

    updateSelectedElement({ rotation: (selectedElementData?.rotation || 0) + 90 });
  }, [selectedElementId, selectedElementData?.rotation, updateSelectedElement]);

  const clearAll = useCallback(() => {
    setElements([]);
    setSelectedElementId(null);
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (mode === 'add') {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const scaleValue = zoom / 100;
      const x = (e.clientX - rect.left) / scaleValue;
      const y = (e.clientY - rect.top) / scaleValue;
      
      addElement(x, y);
    } else {
      setSelectedElementId(null);
    }
  }, [mode, addElement, zoom]);

  const handleElementClick = useCallback((e: React.MouseEvent, elementId: string) => {
    e.stopPropagation();
    setSelectedElementId(elementId);
  }, []);

  const handleElementMouseDown = useCallback((e: React.MouseEvent, elementId: string) => {
    if (mode !== 'select') return;
    
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    setSelectedElementId(elementId);
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const scaleValue = zoom / 100;
    const x = (e.clientX - rect.left) / scaleValue;
    const y = (e.clientY - rect.top) / scaleValue;
    
    const element = elements.find(el => el.id === elementId);
    if (!element) return;

    setDragStart({ x, y });
    setDragOffset({ x: x - element.x, y: y - element.y });
  }, [mode, elements, zoom]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !selectedElementId) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const scaleValue = zoom / 100;
    const x = (e.clientX - rect.left) / scaleValue;
    const y = (e.clientY - rect.top) / scaleValue;

    const newX = Math.max(0, Math.min(x - dragOffset.x, canvasSize.width - (selectedElementData?.width || 0)));
    const newY = Math.max(0, Math.min(y - dragOffset.y, canvasSize.height - (selectedElementData?.height || 0)));

    updateSelectedElement({ x: newX, y: newY });
  }, [isDragging, selectedElementId, dragOffset, canvasSize, selectedElementData, updateSelectedElement, zoom]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const get3DTransform = (element: FloorPlanElement, index: number) => {
    const depth = index * 2;
    const scale = viewMode === '3d' ? 1 - depth * 0.01 : 1;
    const skewX = viewMode === '3d' ? -15 + depth * 0.5 : 0;
    const translateY = viewMode === '3d' ? depth * -2 : 0;
    
    return `perspective(800px) rotateX(${viewMode === '3d' ? 45 : 0}deg) scale(${scale}) skewX(${skewX}deg) translateY(${translateY}px)`;
  };

  const get3DCanvasTransform = () => {
    const scaleValue = zoom / 100;
    const baseTransform = `scale(${scaleValue})`;
    if (viewMode === '2d') return baseTransform;
    return `${baseTransform} perspective(800px) rotateX(45deg)`;
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  const renderObjectShape = (element: FloorPlanElement) => {
    const baseStyle = {
      width: '100%',
      height: '100%',
      position: 'absolute' as const,
      top: 0,
      left: 0,
    };

    // Apply color coding
    const elementColor = element.colorCode ? COLOR_CODES[element.colorCode] : element.color;

    switch (element.type) {
      case 'chair':
        return (
          <div style={baseStyle}>
            <div 
              className="absolute border border-amber-900"
              style={{
                width: '100%',
                height: '30%',
                top: 0,
                left: 0,
                borderRadius: '2px 2px 0 0',
                backgroundColor: elementColor
              }}
            />
            <div 
              className="absolute border border-amber-900"
              style={{
                width: '100%',
                height: '70%',
                bottom: 0,
                left: 0,
                borderRadius: '0 0 2px 2px',
                backgroundColor: elementColor
              }}
            />
          </div>
        );

      case 'table':
        if (element.shape === 'circle') {
          return (
            <div style={baseStyle}>
              <div 
                className="absolute border-2 rounded-full"
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: elementColor,
                  borderColor: element.colorCode === 'vip' ? '#DC2626' : '#92400e'
                }}
              />
              {/* Table legs indication */}
              <div className="absolute w-2 h-2 bg-amber-900 rounded-full" style={{ top: '20%', left: '20%' }} />
              <div className="absolute w-2 h-2 bg-amber-900 rounded-full" style={{ top: '20%', right: '20%' }} />
              <div className="absolute w-2 h-2 bg-amber-900 rounded-full" style={{ bottom: '20%', left: '20%' }} />
              <div className="absolute w-2 h-2 bg-amber-900 rounded-full" style={{ bottom: '20%', right: '20%' }} />
            </div>
          );
        } else {
          return (
            <div style={baseStyle}>
              <div 
                className="absolute border-2 rounded"
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: elementColor,
                  borderColor: element.colorCode === 'vip' ? '#DC2626' : '#92400e'
                }}
              />
              <div className="absolute w-1 h-full bg-amber-900" style={{ left: '10%' }} />
              <div className="absolute w-1 h-full bg-amber-900" style={{ right: '10%' }} />
            </div>
          );
        }

      case 'booth':
        return (
          <div style={baseStyle}>
            <div 
              className="absolute border border-amber-800 rounded-t"
              style={{
                width: '100%',
                height: '30%',
                top: 0,
                left: 0,
                backgroundColor: elementColor
              }}
            />
            <div 
              className="absolute border border-amber-800"
              style={{
                width: '100%',
                height: '70%',
                bottom: 0,
                left: 0,
                backgroundColor: elementColor
              }}
            />
          </div>
        );

      case 'stage':
        return (
          <div style={baseStyle}>
            <div 
              className="absolute border-2 rounded"
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: elementColor,
                borderColor: '#334155',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)'
              }}
            />
            <div 
              className="absolute bg-slate-800 h-1"
              style={{ width: '100%', bottom: 0, left: 0 }}
            />
          </div>
        );

      case 'dance_floor':
        return (
          <div style={baseStyle}>
            <div 
              className="absolute border-2 rounded"
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: elementColor,
                borderColor: '#7c3aed',
                background: 'linear-gradient(45deg, #7c3aed 25%, #8b5cf6 25%, #8b5cf6 50%, #7c3aed 50%, #7c3aed 75%, #8b5cf6 75%)',
                backgroundSize: '20px 20px'
              }}
            />
          </div>
        );

      case 'bar':
        return (
          <div style={baseStyle}>
            <div 
              className="absolute border-2 rounded"
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: elementColor,
                borderColor: '#0f172a'
              }}
            />
            <div className="absolute w-3 h-3 bg-amber-700 rounded-full border border-amber-800" style={{ top: '-6px', left: '20%' }} />
            <div className="absolute w-3 h-3 bg-amber-700 rounded-full border border-amber-800" style={{ top: '-6px', right: '20%' }} />
          </div>
        );

      case 'buffet':
        return (
          <div style={baseStyle}>
            <div 
              className="absolute border-2 rounded"
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: elementColor,
                borderColor: '#047857'
              }}
            />
            <div className="absolute w-2 h-2 bg-yellow-500 rounded-full" style={{ top: '25%', left: '20%' }} />
            <div className="absolute w-2 h-2 bg-red-500 rounded-full" style={{ top: '25%', right: '20%' }} />
            <div className="absolute w-2 h-2 bg-green-500 rounded-full" style={{ bottom: '25%', left: '50%', transform: 'translateX(-50%)' }} />
          </div>
        );

      default:
        return (
          <div 
            style={{
              ...baseStyle,
              backgroundColor: elementColor,
              borderRadius: element.shape === 'circle' ? '50%' : '4px',
            }}
          />
        );
    }
  };

  const filteredElementTypes = activeCategory === 'all' 
    ? ELEMENT_TYPES 
    : ELEMENT_TYPES.filter(type => type.category === activeCategory);

  const handleSave = () => {
    onSave({
      ...floorPlan,
      elements,
      templateImageUrl: backgroundImage,
      dimensions: canvasSize,
      updatedAt: new Date().toISOString()
    });
  };

  const handleBackgroundUpload = async () => {
    try {
      const response = await fetch('/api/objects/upload', { method: 'POST' });
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

  const handleBackgroundUploadComplete = (result: any) => {
    if (result.successful && result.successful[0]) {
      const uploadedUrl = result.successful[0].uploadURL;
      setBackgroundImage(uploadedUrl);
      toast({
        title: "Background uploaded",
        description: "Floor plan background has been updated.",
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-[70vh]">
      {/* Tools Panel */}
      <div className="space-y-4 max-h-full overflow-y-auto">
        <Card className="p-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Mode</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={mode === 'select' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode('select')}
              >
                <Move className="w-4 h-4 mr-1" />
                Select
              </Button>
              <Button
                variant={mode === 'add' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode('add')}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">View & Controls</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={viewMode === '2d' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('2d')}
              >
                <Square className="w-4 h-4 mr-1" />
                2D
              </Button>
              <Button
                variant={viewMode === '3d' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('3d')}
              >
                <Box className="w-4 h-4 mr-1" />
                3D
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleZoomOut} disabled={zoom <= 50}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-xs flex-1 text-center">{zoom}%</span>
              <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={zoom >= 200}>
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={showGrid ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowGrid(!showGrid)}
              >
                <Grid3X3 className="w-4 h-4 mr-1" />
                Grid
              </Button>
            </div>
          </div>
        </Card>

        {mode === 'add' && (
          <Card className="p-4">
            <Label className="text-sm font-medium mb-3 block">Add Elements</Label>
            <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
              <TabsList className="grid w-full grid-cols-2 text-xs">
                <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                <TabsTrigger value="seating" className="text-xs">Seating</TabsTrigger>
              </TabsList>
              <TabsList className="grid w-full grid-cols-3 text-xs mt-2">
                <TabsTrigger value="entertainment" className="text-xs">Fun</TabsTrigger>
                <TabsTrigger value="service" className="text-xs">Service</TabsTrigger>
                <TabsTrigger value="structure" className="text-xs">Structure</TabsTrigger>
              </TabsList>
              <div className="space-y-2 mt-3">
                {filteredElementTypes.map((type) => (
                  <Button
                    key={`${type.type}-${type.shape}`}
                    variant={selectedType === type ? 'default' : 'outline'}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setSelectedType(type)}
                  >
                    <type.icon className="w-4 h-4 mr-2" />
                    {type.label}
                  </Button>
                ))}
              </div>
            </Tabs>
          </Card>
        )}

        {selectedElementData && (
          <Card className="p-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Selected Element</Label>
              
              <div className="space-y-2">
                <Label className="text-xs">Label</Label>
                <Input
                  value={selectedElementData.label || ''}
                  onChange={(e) => updateSelectedElement({ label: e.target.value })}
                  placeholder="Element label"
                />
              </div>

              {(selectedElementData.type === 'table' || selectedElementData.type === 'booth') && (
                <div className="space-y-2">
                  <Label className="text-xs">Seats</Label>
                  <Input
                    type="number"
                    value={selectedElementData.seats || 0}
                    onChange={(e) => updateSelectedElement({ seats: parseInt(e.target.value) || 0 })}
                    min={1}
                    max={20}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-xs">Color Code</Label>
                <Select 
                  value={selectedElementData.colorCode || 'standard'} 
                  onValueChange={(value) => updateSelectedElement({ 
                    colorCode: value as any,
                    color: COLOR_CODES[value as keyof typeof COLOR_CODES] || selectedElementData.color
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: COLOR_CODES.standard }} />
                        Standard
                      </div>
                    </SelectItem>
                    <SelectItem value="vip">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: COLOR_CODES.vip }} />
                        VIP
                      </div>
                    </SelectItem>
                    <SelectItem value="staff">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: COLOR_CODES.staff }} />
                        Staff
                      </div>
                    </SelectItem>
                    <SelectItem value="reserved">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: COLOR_CODES.reserved }} />
                        Reserved
                      </div>
                    </SelectItem>
                    <SelectItem value="disabled">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: COLOR_CODES.disabled }} />
                        Disabled Access
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button size="sm" onClick={rotateSelectedElement}>
                  <RotateCw className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="destructive" onClick={deleteSelectedElement}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Background Template</Label>
            <ObjectUploader
              maxNumberOfFiles={1}
              maxFileSize={10485760}
              onGetUploadParameters={handleBackgroundUpload}
              onComplete={handleBackgroundUploadComplete}
              buttonClassName="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Background
            </ObjectUploader>
            {backgroundImage && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setBackgroundImage('')}
                className="w-full"
              >
                Remove Background
              </Button>
            )}
          </div>
        </Card>

        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={clearAll}>
            <RotateCcw className="w-4 h-4 mr-1" />
            Clear
          </Button>
          <Button size="sm" onClick={handleSave} className="flex-1">
            <Save className="w-4 h-4 mr-1" />
            Save
          </Button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="lg:col-span-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Badge variant="outline">
              {elements.length} elements
            </Badge>
            <Badge variant="outline">
              {elements.reduce((sum, el) => sum + (el.seats || 0), 0)} total seats
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        <div className="flex-1 border-2 border-dashed border-slate-300 bg-slate-100 overflow-hidden relative">
          <div
            ref={canvasRef}
            className={cn(
              "relative transition-transform duration-300",
              mode === 'add' ? "cursor-crosshair" : "cursor-default",
              viewMode === '3d' ? "bg-gradient-to-b from-slate-100 to-slate-300" : "bg-slate-50"
            )}
            style={{
              width: canvasSize.width,
              height: canvasSize.height,
              transform: get3DCanvasTransform(),
              transformOrigin: 'center center',
              backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
            onClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Grid pattern */}
            {showGrid && (
              <div 
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: 'linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)',
                  backgroundSize: '20px 20px'
                }}
              />
            )}

            {/* Elements */}
            {elements.map((element, index) => {
              const isSelected = element.id === selectedElementId;
              const depth = viewMode === '3d' ? index * 0.1 : 0;
              const shadowSize = viewMode === '3d' ? 10 + depth * 5 : 0;

              return (
                <div
                  key={element.id}
                  className={cn(
                    "absolute cursor-move transition-all duration-200",
                    isSelected && "ring-2 ring-blue-500 ring-offset-2",
                    isDragging && isSelected && "z-50"
                  )}
                  style={{
                    left: element.x,
                    top: element.y,
                    width: element.width,
                    height: element.height,
                    transform: `${get3DTransform(element, index)} rotate(${element.rotation}deg)`,
                    transformOrigin: 'center center',
                    zIndex: isSelected ? 1000 : 100 - index,
                    boxShadow: viewMode === '3d' 
                      ? `0 ${shadowSize}px ${shadowSize * 2}px rgba(0,0,0,0.3)`
                      : 'none',
                    filter: viewMode === '3d' ? `brightness(${1 - depth * 0.2})` : 'none',
                  }}
                  onClick={(e) => handleElementClick(e, element.id)}
                  onMouseDown={(e) => handleElementMouseDown(e, element.id)}
                >
                  {renderObjectShape(element)}
                  
                  <span className="absolute inset-0 flex items-center justify-center text-center text-xs leading-tight pointer-events-none text-white font-semibold z-10" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                    {element.label}
                    {element.seats && <br />}
                    {element.seats && `${element.seats} seats`}
                  </span>
                  
                  {viewMode === '3d' && (element.type === 'table' || element.type === 'bar') && (
                    <div 
                      className="absolute inset-0 border-2 border-gray-600 opacity-30"
                      style={{
                        borderRadius: element.shape === 'circle' ? '50%' : '4px',
                        transform: 'translateZ(20px) translateY(-2px)',
                        backgroundColor: 'transparent',
                        borderTop: '2px solid rgba(0,0,0,0.3)',
                      }}
                    />
                  )}
                </div>
              );
            })}

            {viewMode === '3d' && (
              <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded text-xs z-20 flex items-center gap-1">
                <Eye className="w-3 h-3" />
                3D Preview
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 text-xs text-slate-600">
          <div className="flex justify-between items-center">
            <span>
              {mode === 'add' ? 'Click on canvas to add elements' : 'Click elements to select, drag to move'}
            </span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: COLOR_CODES.vip }} />
                <span>VIP</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: COLOR_CODES.staff }} />
                <span>Staff</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: COLOR_CODES.reserved }} />
                <span>Reserved</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}