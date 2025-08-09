import { useState, useRef, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RotateCcw, Square, Circle, Save, Plus, Trash2, Move, RotateCw } from "lucide-react";
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
  seats?: number; // For tables
  label?: string;
  color: string;
}

interface FloorPlanDesignerProps {
  spaceId: string;
  initialFloorPlan?: {
    elements: FloorPlanElement[];
    dimensions: { width: number; height: number };
  };
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

export function FloorPlanDesigner({ spaceId, initialFloorPlan, onSave }: FloorPlanDesignerProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [elements, setElements] = useState<FloorPlanElement[]>(initialFloorPlan?.elements || []);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [mode, setMode] = useState<'select' | 'add'>('select');
  const [selectedType, setSelectedType] = useState(ELEMENT_TYPES[0]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [canvasSize] = useState({ width: 800, height: 600 });
  const [zoom, setZoom] = useState(100);

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

  const updateElement = useCallback((id: string, updates: Partial<FloorPlanElement>) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
  }, []);

  const deleteElement = useCallback((id: string) => {
    setElements(prev => prev.filter(el => el.id !== id));
    setSelectedElement(null);
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvasSize.width / rect.width);
    const y = (e.clientY - rect.top) * (canvasSize.height / rect.height);

    if (mode === 'add') {
      addElement(x, y);
    } else {
      setSelectedElement(null);
    }
  }, [mode, addElement, canvasSize]);

  const handleElementClick = useCallback((e: React.MouseEvent, elementId: string) => {
    e.stopPropagation();
    setSelectedElement(elementId);
  }, []);

  const handleElementMouseDown = useCallback((e: React.MouseEvent, elementId: string) => {
    if (mode !== 'select') return;
    
    e.stopPropagation();
    setIsDragging(true);
    setSelectedElement(elementId);
    setDragStart({ x: e.clientX, y: e.clientY });
  }, [mode]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !selectedElement || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scale = canvasSize.width / rect.width;
    const deltaX = (e.clientX - dragStart.x) * scale;
    const deltaY = (e.clientY - dragStart.y) * scale;

    updateElement(selectedElement, {
      x: Math.max(0, Math.min(canvasSize.width - 100, elements.find(el => el.id === selectedElement)!.x + deltaX)),
      y: Math.max(0, Math.min(canvasSize.height - 100, elements.find(el => el.id === selectedElement)!.y + deltaY))
    });

    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, selectedElement, dragStart, updateElement, elements, canvasSize]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const selectedElementData = elements.find(el => el.id === selectedElement);

  const handleSave = () => {
    const floorPlan = {
      elements,
      dimensions: canvasSize,
      lastUpdated: new Date().toISOString()
    };
    onSave(floorPlan);
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
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

            {mode === 'add' && (
              <div className="flex items-center gap-2">
                <Label className="text-sm">Element:</Label>
                <Select
                  value={selectedType.label}
                  onValueChange={(value) => {
                    const type = ELEMENT_TYPES.find(t => t.label === value)!;
                    setSelectedType(type);
                  }}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ELEMENT_TYPES.map(type => (
                      <SelectItem key={type.label} value={type.label}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Separator orientation="vertical" className="h-6" />
            
            <div className="flex items-center gap-2">
              <Label className="text-sm">Zoom:</Label>
              <input
                type="range"
                value={zoom}
                onChange={(e) => setZoom(parseInt(e.target.value))}
                min={50}
                max={200}
                step={10}
                className="w-20"
              />
              <span className="text-sm text-slate-600 w-12">{zoom}%</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setElements([])}>
              <RotateCcw className="w-4 h-4 mr-1" />
              Clear
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Save className="w-4 h-4 mr-1" />
              Save Layout
            </Button>
          </div>
        </div>
      </Card>

      <div className="flex gap-6">
        {/* Canvas */}
        <Card className="flex-1 p-4">
          <div className="relative overflow-hidden rounded-lg border bg-slate-50" style={{ height: '500px' }}>
            <div
              ref={canvasRef}
              className="relative bg-white border-2 border-dashed border-slate-300 cursor-crosshair mx-auto mt-8"
              style={{
                width: `${canvasSize.width * (zoom / 100)}px`,
                height: `${canvasSize.height * (zoom / 100)}px`,
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top left'
              }}
              onClick={handleCanvasClick}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
              {/* Grid */}
              <svg className="absolute inset-0 pointer-events-none opacity-20">
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#E2E8F0" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>

              {/* Elements */}
              {elements.map(element => (
                <div
                  key={element.id}
                  className={cn(
                    "absolute border-2 cursor-move flex items-center justify-center text-xs font-medium text-white select-none",
                    selectedElement === element.id ? "border-blue-500 shadow-lg" : "border-slate-400"
                  )}
                  style={{
                    left: element.x,
                    top: element.y,
                    width: element.width,
                    height: element.height,
                    backgroundColor: element.color,
                    borderRadius: element.shape === 'circle' ? '50%' : '4px',
                    transform: `rotate(${element.rotation}deg)`,
                  }}
                  onClick={(e) => handleElementClick(e, element.id)}
                  onMouseDown={(e) => handleElementMouseDown(e, element.id)}
                >
                  <span className="text-center leading-tight">
                    {element.type === 'table' && element.seats && (
                      <div>{element.seats} seats</div>
                    )}
                    {element.label && element.type !== 'table' && (
                      <div>{element.label}</div>
                    )}
                  </span>
                </div>
              ))}

              {/* Selection Handles */}
              {selectedElementData && (
                <>
                  <div
                    className="absolute w-2 h-2 bg-blue-500 border border-white rounded-full cursor-nw-resize"
                    style={{
                      left: selectedElementData.x - 4,
                      top: selectedElementData.y - 4,
                    }}
                  />
                  <div
                    className="absolute w-2 h-2 bg-blue-500 border border-white rounded-full cursor-ne-resize"
                    style={{
                      left: selectedElementData.x + selectedElementData.width - 4,
                      top: selectedElementData.y - 4,
                    }}
                  />
                  <div
                    className="absolute w-2 h-2 bg-blue-500 border border-white rounded-full cursor-sw-resize"
                    style={{
                      left: selectedElementData.x - 4,
                      top: selectedElementData.y + selectedElementData.height - 4,
                    }}
                  />
                  <div
                    className="absolute w-2 h-2 bg-blue-500 border border-white rounded-full cursor-se-resize"
                    style={{
                      left: selectedElementData.x + selectedElementData.width - 4,
                      top: selectedElementData.y + selectedElementData.height - 4,
                    }}
                  />
                </>
              )}
            </div>

            {/* Instructions */}
            {elements.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center text-slate-500">
                  <p className="text-lg font-medium">Design Your Floor Plan</p>
                  <p className="text-sm mt-2">Click "Add" and select elements to place them on the canvas</p>
                  <p className="text-sm">Drag elements to move them around</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Properties Panel */}
        {selectedElementData && (
          <Card className="w-72 p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Element Properties</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteElement(selectedElementData.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-sm">Label</Label>
                  <Input
                    value={selectedElementData.label || ''}
                    onChange={(e) => updateElement(selectedElementData.id, { label: e.target.value })}
                    className="mt-1"
                    placeholder="Element label"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-sm">Width</Label>
                    <Input
                      type="number"
                      value={selectedElementData.width}
                      onChange={(e) => updateElement(selectedElementData.id, { width: parseInt(e.target.value) || 50 })}
                      className="mt-1"
                      min="10"
                      max="200"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Height</Label>
                    <Input
                      type="number"
                      value={selectedElementData.height}
                      onChange={(e) => updateElement(selectedElementData.id, { height: parseInt(e.target.value) || 50 })}
                      className="mt-1"
                      min="10"
                      max="200"
                    />
                  </div>
                </div>

                {selectedElementData.type === 'table' && (
                  <div>
                    <Label className="text-sm">Number of Seats</Label>
                    <Input
                      type="number"
                      value={selectedElementData.seats || 6}
                      onChange={(e) => updateElement(selectedElementData.id, { seats: parseInt(e.target.value) || 6 })}
                      className="mt-1"
                      min="2"
                      max="12"
                    />
                  </div>
                )}

                <div>
                  <Label className="text-sm">Rotation</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="range"
                      value={selectedElementData.rotation}
                      onChange={(e) => updateElement(selectedElementData.id, { rotation: parseInt(e.target.value) })}
                      min={0}
                      max={360}
                      step={15}
                      className="flex-1"
                    />
                    <span className="text-sm text-slate-600 w-8">{selectedElementData.rotation}°</span>
                  </div>
                </div>

                <div>
                  <Label className="text-sm">Color</Label>
                  <div className="flex gap-2 mt-1">
                    {['#8B4513', '#4A5568', '#2D3748', '#1A202C', '#E53E3E', '#3182CE', '#38A169', '#D69E2E'].map(color => (
                      <button
                        key={color}
                        className={cn(
                          "w-6 h-6 rounded border-2",
                          selectedElementData.color === color ? "border-slate-900" : "border-slate-300"
                        )}
                        style={{ backgroundColor: color }}
                        onClick={() => updateElement(selectedElementData.id, { color })}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Stats */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="text-sm">
              <span className="font-medium">Elements:</span> {elements.length}
            </div>
            <div className="text-sm">
              <span className="font-medium">Tables:</span> {elements.filter(el => el.type === 'table').length}
            </div>
            <div className="text-sm">
              <span className="font-medium">Total Seats:</span> {elements.filter(el => el.type === 'table').reduce((sum, el) => sum + (el.seats || 0), 0)}
            </div>
          </div>
          <Badge variant="outline">
            Canvas: {canvasSize.width} × {canvasSize.height}
          </Badge>
        </div>
      </Card>
    </div>
  );
}