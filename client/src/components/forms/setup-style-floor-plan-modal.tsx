import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RotateCcw, Square, Circle, Save, Plus, Trash2, Move, RotateCw, Layout, Box, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloorPlanElement {
  id: string;
  type: 'table' | 'stage' | 'bar' | 'door' | 'wall' | 'chair';
  shape: 'rectangle' | 'circle' | 'square';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  seats?: number;
  label?: string;
  color: string;
}

interface SetupStyleFloorPlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setupStyle: any;
  onSave: (floorPlan: any) => void;
}

const ELEMENT_TYPES = [
  { type: 'table', label: 'Round Table', shape: 'circle', defaultSize: { width: 60, height: 60 }, color: '#8B4513', icon: Circle },
  { type: 'table', label: 'Rectangle Table', shape: 'rectangle', defaultSize: { width: 80, height: 40 }, color: '#8B4513', icon: Square },
  { type: 'stage', label: 'Stage', shape: 'rectangle', defaultSize: { width: 120, height: 80 }, color: '#4A5568', icon: Square },
  { type: 'bar', label: 'Bar', shape: 'rectangle', defaultSize: { width: 100, height: 30 }, color: '#2D3748', icon: Square },
  { type: 'door', label: 'Door', shape: 'rectangle', defaultSize: { width: 40, height: 10 }, color: '#F7FAFC', icon: Square },
  { type: 'wall', label: 'Wall', shape: 'rectangle', defaultSize: { width: 10, height: 100 }, color: '#1A202C', icon: Square },
];

export function SetupStyleFloorPlanModal({ open, onOpenChange, setupStyle, onSave }: SetupStyleFloorPlanModalProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [elements, setElements] = useState<FloorPlanElement[]>(setupStyle?.floorPlan?.elements || []);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [mode, setMode] = useState<'select' | 'add'>('select');
  const [selectedType, setSelectedType] = useState(ELEMENT_TYPES[0]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [canvasSize] = useState({ width: 600, height: 400 });
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');

  const addElement = useCallback((x: number, y: number) => {
    if (mode !== 'add') return;

    const newElement: FloorPlanElement = {
      id: `element-${Date.now()}`,
      type: selectedType.type as any,
      shape: selectedType.shape as any,
      x: x - selectedType.defaultSize.width / 2,
      y: y - selectedType.defaultSize.height / 2,
      width: selectedType.defaultSize.width,
      height: selectedType.defaultSize.height,
      rotation: 0,
      seats: selectedType.type === 'table' ? (selectedType.shape === 'circle' ? 6 : 8) : undefined,
      label: `${selectedType.label} ${elements.length + 1}`,
      color: selectedType.color,
    };

    setElements(prev => [...prev, newElement]);
    setSelectedElement(newElement.id);
    setMode('select');
  }, [mode, selectedType, elements.length]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (mode === 'add') {
      addElement(x, y);
    } else {
      setSelectedElement(null);
    }
  }, [mode, addElement]);

  const handleElementClick = useCallback((e: React.MouseEvent, elementId: string) => {
    e.stopPropagation();
    setSelectedElement(elementId);
  }, []);

  const handleElementMouseDown = useCallback((e: React.MouseEvent, elementId: string) => {
    e.stopPropagation();
    e.preventDefault();
    
    const element = elements.find(el => el.id === elementId);
    if (!element) return;

    setSelectedElement(elementId);
    setIsDragging(true);
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setDragStart({ x: e.clientX, y: e.clientY });
      setDragOffset({ 
        x: e.clientX - rect.left - element.x, 
        y: e.clientY - rect.top - element.y 
      });
    }
  }, [elements]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !selectedElement || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;

    // Constrain to canvas bounds
    const element = elements.find(el => el.id === selectedElement);
    if (!element) return;

    const constrainedX = Math.max(0, Math.min(x, canvasSize.width - element.width));
    const constrainedY = Math.max(0, Math.min(y, canvasSize.height - element.height));

    setElements(prev => prev.map(el => 
      el.id === selectedElement 
        ? { ...el, x: constrainedX, y: constrainedY }
        : el
    ));
  }, [isDragging, selectedElement, dragOffset, elements, canvasSize]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragStart({ x: 0, y: 0 });
    setDragOffset({ x: 0, y: 0 });
  }, []);

  const deleteSelectedElement = useCallback(() => {
    if (selectedElement) {
      setElements(prev => prev.filter(el => el.id !== selectedElement));
      setSelectedElement(null);
    }
  }, [selectedElement]);

  const rotateSelectedElement = useCallback(() => {
    if (selectedElement) {
      setElements(prev => prev.map(el => 
        el.id === selectedElement 
          ? { ...el, rotation: (el.rotation + 90) % 360 }
          : el
      ));
    }
  }, [selectedElement]);

  const updateSelectedElement = useCallback((updates: Partial<FloorPlanElement>) => {
    if (selectedElement) {
      setElements(prev => prev.map(el => 
        el.id === selectedElement ? { ...el, ...updates } : el
      ));
    }
  }, [selectedElement]);

  const handleSave = () => {
    const floorPlan = {
      elements,
      dimensions: canvasSize
    };
    onSave(floorPlan);
    onOpenChange(false);
  };

  const selectedElementData = elements.find(el => el.id === selectedElement);

  // 3D perspective transform for elements
  const get3DTransform = (element: FloorPlanElement) => {
    if (viewMode === '2d') return '';
    
    // Perspective effect - elements further back appear smaller and higher
    const perspective = 0.8; // Perspective strength
    const depth = element.y / canvasSize.height; // 0 = front, 1 = back
    const scale = 1 - (depth * 0.3); // Scale down elements at the back
    const skewX = depth * -10; // Slight skew for depth
    const translateY = -(depth * 20); // Move back elements up slightly
    
    return `perspective(800px) rotateX(45deg) scale(${scale}) skewX(${skewX}deg) translateY(${translateY}px)`;
  };

  const get3DCanvasTransform = () => {
    if (viewMode === '2d') return '';
    return 'perspective(800px) rotateX(45deg)';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layout className="w-5 h-5" />
            Floor Plan Designer - {setupStyle?.name}
          </DialogTitle>
          <DialogDescription>
            Design the floor plan layout for this setup style. This will serve as a template when applying this setup to venues.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Tools Panel */}
          <div className="space-y-4">
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
                <Label className="text-sm font-medium">View Mode</Label>
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
              </div>
            </Card>

            {mode === 'add' && (
              <Card className="p-4">
                <Label className="text-sm font-medium mb-3 block">Add Element</Label>
                <div className="space-y-2">
                  {ELEMENT_TYPES.map((type) => (
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
                      size="sm"
                    />
                  </div>

                  {selectedElementData.type === 'table' && (
                    <div className="space-y-2">
                      <Label className="text-xs">Seats</Label>
                      <Input
                        type="number"
                        value={selectedElementData.seats || 0}
                        onChange={(e) => updateSelectedElement({ seats: parseInt(e.target.value) || 0 })}
                        min="1"
                        max="20"
                        size="sm"
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={rotateSelectedElement}
                    >
                      <RotateCw className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={deleteSelectedElement}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Canvas */}
          <div className="lg:col-span-3">
            <Card className="p-4">
              <div className="mb-4 flex items-center justify-between">
                <Label className="text-sm font-medium">Canvas</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setElements([])}
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Clear All
                  </Button>
                </div>
              </div>
              
              <div
                ref={canvasRef}
                className={cn(
                  "relative border-2 border-dashed border-slate-300 overflow-hidden transition-transform duration-300",
                  mode === 'add' ? "cursor-crosshair" : "cursor-default",
                  viewMode === '3d' ? "bg-gradient-to-b from-slate-100 to-slate-300" : "bg-slate-50"
                )}
                style={{
                  width: canvasSize.width,
                  height: canvasSize.height,
                  transform: get3DCanvasTransform(),
                  transformOrigin: 'center bottom',
                }}
                onClick={handleCanvasClick}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {/* Grid pattern */}
                <div 
                  className={cn(
                    "absolute inset-0",
                    viewMode === '3d' ? "opacity-10" : "opacity-20"
                  )}
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, #cbd5e1 1px, transparent 1px),
                      linear-gradient(to bottom, #cbd5e1 1px, transparent 1px)
                    `,
                    backgroundSize: '20px 20px'
                  }}
                />

                {/* 3D Floor effect */}
                {viewMode === '3d' && (
                  <div 
                    className="absolute inset-0 opacity-30"
                    style={{
                      background: 'linear-gradient(to bottom, rgba(148, 163, 184, 0.1) 0%, rgba(148, 163, 184, 0.4) 100%)'
                    }}
                  />
                )}

                {/* Elements */}
                {elements.map((element) => {
                  const depth = element.y / canvasSize.height;
                  const shadowSize = viewMode === '3d' ? Math.max(2, 8 * (1 - depth)) : 0;
                  
                  return (
                    <div
                      key={element.id}
                      className={cn(
                        "absolute border-2 flex items-center justify-center text-xs font-medium text-white select-none transition-all duration-200",
                        selectedElement === element.id ? "border-blue-500 ring-2 ring-blue-200 cursor-move" : "border-gray-400 cursor-pointer",
                        isDragging && selectedElement === element.id ? "cursor-grabbing" : "",
                        viewMode === '3d' && "shadow-lg"
                      )}
                      style={{
                        left: element.x,
                        top: element.y,
                        width: element.width,
                        height: element.height,
                        backgroundColor: element.color,
                        borderRadius: element.shape === 'circle' ? '50%' : '4px',
                        transform: viewMode === '3d' 
                          ? `rotate(${element.rotation}deg) ${get3DTransform(element)}`
                          : `rotate(${element.rotation}deg)`,
                        zIndex: selectedElement === element.id ? 10 : Math.floor((1 - depth) * 5) + 1,
                        boxShadow: viewMode === '3d' 
                          ? `0 ${shadowSize}px ${shadowSize * 2}px rgba(0,0,0,0.3)`
                          : 'none',
                        filter: viewMode === '3d' ? `brightness(${1 - depth * 0.2})` : 'none',
                      }}
                      onClick={(e) => handleElementClick(e, element.id)}
                      onMouseDown={(e) => handleElementMouseDown(e, element.id)}
                    >
                      <span className="text-center text-xs leading-tight pointer-events-none">
                        {element.label}
                        {element.seats && <br />}
                        {element.seats && `${element.seats} seats`}
                      </span>
                      
                      {/* 3D Height indicator */}
                      {viewMode === '3d' && (element.type === 'table' || element.type === 'bar') && (
                        <div 
                          className="absolute inset-0 border-2 border-gray-600 opacity-50"
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

                {mode === 'add' && (
                  <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs z-20">
                    Click to place {selectedType.label}
                  </div>
                )}

                {viewMode === '3d' && (
                  <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded text-xs z-20 flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    3D Preview
                  </div>
                )}
              </div>

              <div className="mt-4 text-xs text-slate-600">
                <p>• <strong>Add mode:</strong> Click to place new elements</p>
                <p>• <strong>Select mode:</strong> Click elements to select them</p>
                <p>• <strong>Move:</strong> Drag selected elements to reposition them</p>
                <p>• <strong>3D View:</strong> Get a spatial preview of your layout</p>
                <p>• Use the tools panel to modify selected elements</p>
              </div>
            </Card>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Floor Plan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}