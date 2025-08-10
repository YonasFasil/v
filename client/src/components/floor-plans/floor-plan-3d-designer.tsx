import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Move, 
  Square, 
  Circle, 
  Trash2, 
  Save, 
  Undo, 
  Redo,
  Grid3X3,
  Users,
  Sofa,
  Home,
  Music,
  Utensils,
  Mic,
  Monitor,
  Camera,
  Settings,
  Download,
  Upload
} from "lucide-react";

interface FloorPlanObject {
  id: string;
  type: 'table' | 'chair' | 'stage' | 'bar' | 'dj-booth' | 'entrance' | 'restroom' | 'kitchen' | 'storage' | 'decoration';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  color: string;
  seats?: number;
  label?: string;
}

interface FloorPlan3DDesignerProps {
  isOpen: boolean;
  onClose: () => void;
  venueId?: string;
  setupStyle?: string;
  onSave?: (planData: any) => void;
}

export function FloorPlan3DDesigner({ isOpen, onClose, venueId, setupStyle, onSave }: FloorPlan3DDesignerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [objects, setObjects] = useState<FloorPlanObject[]>([]);
  const [selectedObject, setSelectedObject] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [tool, setTool] = useState<'select' | 'table' | 'chair' | 'stage' | 'bar'>('select');
  const [dragHandlePosition, setDragHandlePosition] = useState<{ x: number, y: number } | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [history, setHistory] = useState<FloorPlanObject[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showObjectPanel, setShowObjectPanel] = useState(false);

  // Object templates with realistic properties
  const objectTemplates: Record<string, Record<string, { width: number; height: number; seats?: number; color: string }>> = {
    table: {
      round: { width: 60, height: 60, seats: 8, color: '#8B4513' },
      rectangular: { width: 80, height: 40, seats: 6, color: '#8B4513' },
      square: { width: 50, height: 50, seats: 4, color: '#8B4513' }
    },
    chair: {
      dining: { width: 20, height: 20, seats: 1, color: '#654321' },
      lounge: { width: 30, height: 30, seats: 1, color: '#2F4F4F' }
    },
    stage: {
      small: { width: 120, height: 80, color: '#4169E1' },
      large: { width: 200, height: 120, color: '#4169E1' }
    },
    bar: {
      straight: { width: 100, height: 30, color: '#800000' },
      curved: { width: 120, height: 40, color: '#800000' }
    }
  };

  // Load setup style template when setupStyle changes
  useEffect(() => {
    if (setupStyle && objects.length === 0) {
      loadSetupStyleTemplate();
    }
  }, [setupStyle, objects.length]);

  const loadSetupStyleTemplate = async () => {
    if (!setupStyle) return;
    
    try {
      // First get all setup styles to find the one with matching name
      const stylesResponse = await fetch('/api/setup-styles');
      if (stylesResponse.ok) {
        const allStyles = await stylesResponse.json();
        const matchingStyle = allStyles.find((style: any) => 
          style.name.toLowerCase().replace(/\s+/g, '-') === setupStyle ||
          style.id === setupStyle
        );
        
        if (matchingStyle && matchingStyle.floorPlan && matchingStyle.floorPlan.objects) {
          setObjects(matchingStyle.floorPlan.objects);
          if (matchingStyle.floorPlan.canvasSize) {
            setCanvasSize(matchingStyle.floorPlan.canvasSize);
          }
          saveToHistory(matchingStyle.floorPlan.objects);
        }
      }
    } catch (error) {
      console.error('Failed to load setup style template:', error);
    }
  };

  // Save to history for undo/redo
  const saveToHistory = useCallback((newObjects: FloorPlanObject[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newObjects]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  // Undo/Redo functions
  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setObjects([...history[historyIndex - 1]]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setObjects([...history[historyIndex + 1]]);
    }
  };



  // Canvas drawing function
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply zoom and pan
    ctx.save();
    ctx.scale(zoom, zoom);
    ctx.translate(panOffset.x, panOffset.y);

    // Draw grid
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    for (let x = 0; x <= canvasSize.width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasSize.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvasSize.height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasSize.width, y);
      ctx.stroke();
    }

    // Draw objects
    objects.forEach(obj => {
      ctx.save();
      ctx.translate(obj.x + obj.width / 2, obj.y + obj.height / 2);
      ctx.rotate((obj.rotation * Math.PI) / 180);
      ctx.translate(-obj.width / 2, -obj.height / 2);

      // Object styling
      ctx.fillStyle = obj.color;
      ctx.strokeStyle = selectedObject === obj.id ? '#2563eb' : '#333';
      ctx.lineWidth = selectedObject === obj.id ? 3 : 1;

      // Draw realistic objects
      switch (obj.type) {
        case 'table':
          if (obj.width === obj.height) {
            // Round table
            ctx.beginPath();
            ctx.arc(obj.width / 2, obj.height / 2, obj.width / 2 - 2, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            
            // Table edge highlight
            ctx.strokeStyle = '#D2691E';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(obj.width / 2, obj.height / 2, obj.width / 2 - 4, 0, 2 * Math.PI);
            ctx.stroke();
          } else {
            // Rectangular table
            ctx.fillRect(0, 0, obj.width, obj.height);
            ctx.strokeRect(0, 0, obj.width, obj.height);
            
            // Table edge highlight
            ctx.strokeStyle = '#D2691E';
            ctx.lineWidth = 2;
            ctx.strokeRect(2, 2, obj.width - 4, obj.height - 4);
          }
          break;

        case 'chair':
          // Chair back
          ctx.fillStyle = '#654321';
          ctx.fillRect(0, 0, obj.width, 6);
          
          // Chair seat
          ctx.fillStyle = obj.color;
          ctx.fillRect(0, 6, obj.width, obj.height - 6);
          ctx.strokeRect(0, 0, obj.width, obj.height);
          break;

        case 'stage':
          // Stage platform
          ctx.fillRect(0, 0, obj.width, obj.height);
          ctx.strokeRect(0, 0, obj.width, obj.height);
          
          // Stage curtain effect
          ctx.fillStyle = '#800080';
          ctx.fillRect(0, 0, obj.width, 8);
          
          // Center star
          ctx.fillStyle = '#FFD700';
          ctx.font = `${Math.min(obj.width / 6, 20)}px Arial`;
          ctx.textAlign = 'center';
          ctx.fillText('★', obj.width / 2, obj.height / 2 + 5);
          break;

        case 'bar':
          // Bar counter
          ctx.fillRect(0, 0, obj.width, obj.height);
          ctx.strokeRect(0, 0, obj.width, obj.height);
          
          // Bar stools indicator
          const stoolCount = Math.floor(obj.width / 25);
          ctx.fillStyle = '#8B4513';
          for (let i = 0; i < stoolCount; i++) {
            const stoolX = 10 + i * 25;
            ctx.beginPath();
            ctx.arc(stoolX, obj.height + 15, 8, 0, 2 * Math.PI);
            ctx.fill();
          }
          break;

        default:
          ctx.fillRect(0, 0, obj.width, obj.height);
          ctx.strokeRect(0, 0, obj.width, obj.height);
      }

      // Draw label
      if (obj.label) {
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(obj.label, obj.width / 2, obj.height / 2 + 4);
      }

      // Draw seat count for tables
      if (obj.seats && obj.type === 'table') {
        ctx.fillStyle = '#666';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${obj.seats} seats`, obj.width / 2, obj.height + 15);
      }

      ctx.restore();
    });

    // Draw selection handles and drag indicators for selected object
    if (selectedObject) {
      const obj = objects.find(o => o.id === selectedObject);
      if (obj) {
        // Selection outline with glow effect
        ctx.save();
        ctx.shadowColor = '#2563eb';
        ctx.shadowBlur = 8;
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(obj.x - 4, obj.y - 4, obj.width + 8, obj.height + 8);
        ctx.setLineDash([]);
        
        // Corner drag handles (for resizing)
        const handleSize = 8;
        const handleColor = '#2563eb';
        const handles = [
          { x: obj.x - handleSize/2, y: obj.y - handleSize/2, type: 'nw-resize' },
          { x: obj.x + obj.width - handleSize/2, y: obj.y - handleSize/2, type: 'ne-resize' },
          { x: obj.x - handleSize/2, y: obj.y + obj.height - handleSize/2, type: 'sw-resize' },
          { x: obj.x + obj.width - handleSize/2, y: obj.y + obj.height - handleSize/2, type: 'se-resize' },
        ];
        
        // Draw corner handles
        ctx.fillStyle = handleColor;
        ctx.shadowBlur = 2;
        handles.forEach(handle => {
          ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
          // Add white border for better visibility
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.strokeRect(handle.x, handle.y, handleSize, handleSize);
        });
        
        // Center move handle (larger and more prominent for dragging)
        const moveHandleSize = 16;
        ctx.fillStyle = 'rgba(37, 99, 235, 0.9)';
        ctx.shadowBlur = 4;
        ctx.fillRect(obj.x + obj.width/2 - moveHandleSize/2, obj.y + obj.height/2 - moveHandleSize/2, moveHandleSize, moveHandleSize);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(obj.x + obj.width/2 - moveHandleSize/2, obj.y + obj.height/2 - moveHandleSize/2, moveHandleSize, moveHandleSize);
        
        // Add drag cursor icon
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⌖', obj.x + obj.width/2, obj.y + obj.height/2);
        
        // Edge handles for easier dragging
        const edgeHandleSize = 6;
        const edgeHandles = [
          { x: obj.x + obj.width/2 - edgeHandleSize/2, y: obj.y - edgeHandleSize/2 }, // top
          { x: obj.x + obj.width/2 - edgeHandleSize/2, y: obj.y + obj.height - edgeHandleSize/2 }, // bottom
          { x: obj.x - edgeHandleSize/2, y: obj.y + obj.height/2 - edgeHandleSize/2 }, // left
          { x: obj.x + obj.width - edgeHandleSize/2, y: obj.y + obj.height/2 - edgeHandleSize/2 } // right
        ];
        
        ctx.fillStyle = 'rgba(37, 99, 235, 0.7)';
        edgeHandles.forEach(handle => {
          ctx.fillRect(handle.x, handle.y, edgeHandleSize, edgeHandleSize);
        });
        
        ctx.restore();
      }
    }

    ctx.restore();
  }, [objects, selectedObject, zoom, panOffset, canvasSize]);

  // Redraw canvas when dependencies change
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Check if click is on a drag handle
  const isClickOnHandle = (x: number, y: number, obj: FloorPlanObject) => {
    const handleSize = 8;
    const moveHandleSize = 16;
    const edgeHandleSize = 6;
    
    // Check center move handle (priority)
    const centerX = obj.x + obj.width/2;
    const centerY = obj.y + obj.height/2;
    if (x >= centerX - moveHandleSize/2 && x <= centerX + moveHandleSize/2 &&
        y >= centerY - moveHandleSize/2 && y <= centerY + moveHandleSize/2) {
      return 'move';
    }
    
    // Check corner handles
    const corners = [
      { x: obj.x - handleSize/2, y: obj.y - handleSize/2, type: 'nw-resize' },
      { x: obj.x + obj.width - handleSize/2, y: obj.y - handleSize/2, type: 'ne-resize' },
      { x: obj.x - handleSize/2, y: obj.y + obj.height - handleSize/2, type: 'sw-resize' },
      { x: obj.x + obj.width - handleSize/2, y: obj.y + obj.height - handleSize/2, type: 'se-resize' },
    ];
    
    for (const corner of corners) {
      if (x >= corner.x && x <= corner.x + handleSize &&
          y >= corner.y && y <= corner.y + handleSize) {
        return corner.type;
      }
    }
    
    // Check edge handles
    const edges = [
      { x: obj.x + obj.width/2 - edgeHandleSize/2, y: obj.y - edgeHandleSize/2, type: 'move' },
      { x: obj.x + obj.width/2 - edgeHandleSize/2, y: obj.y + obj.height - edgeHandleSize/2, type: 'move' },
      { x: obj.x - edgeHandleSize/2, y: obj.y + obj.height/2 - edgeHandleSize/2, type: 'move' },
      { x: obj.x + obj.width - edgeHandleSize/2, y: obj.y + obj.height/2 - edgeHandleSize/2, type: 'move' }
    ];
    
    for (const edge of edges) {
      if (x >= edge.x && x <= edge.x + edgeHandleSize &&
          y >= edge.y && y <= edge.y + edgeHandleSize) {
        return edge.type;
      }
    }
    
    return null;
  };

  // Handle canvas mouse events
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom - panOffset.x;
    const y = (e.clientY - rect.top) / zoom - panOffset.y;

    if (tool === 'select') {
      // Check if clicking on a selected object's handle first
      if (selectedObject) {
        const selectedObj = objects.find(obj => obj.id === selectedObject);
        if (selectedObj) {
          const handleType = isClickOnHandle(x, y, selectedObj);
          if (handleType) {
            setIsDragging(true);
            setDragOffset({
              x: x - selectedObj.x,
              y: y - selectedObj.y
            });
            // Visual feedback for dragging
            canvas.style.cursor = handleType === 'move' ? 'grabbing' : 'grabbing';
            return;
          }
        }
      }
      
      // Find clicked object
      const clickedObject = objects.find(obj =>
        x >= obj.x && x <= obj.x + obj.width &&
        y >= obj.y && y <= obj.y + obj.height
      );

      if (clickedObject) {
        setSelectedObject(clickedObject.id);
        // Check if clicking on handle of newly selected object
        const handleType = isClickOnHandle(x, y, clickedObject);
        if (handleType) {
          setIsDragging(true);
          setDragOffset({
            x: x - clickedObject.x,
            y: y - clickedObject.y
          });
          canvas.style.cursor = 'grabbing';
        }
      } else {
        setSelectedObject(null);
      }
    } else {
      // Add new object
      const templateGroup = objectTemplates[tool as keyof typeof objectTemplates];
      const templateKey = Object.keys(templateGroup)[0];
      const template = templateGroup[templateKey as keyof typeof templateGroup];
      if (template) {
        const newObject: FloorPlanObject = {
          id: `${tool}-${Date.now()}`,
          type: tool,
          x: x - template.width / 2,
          y: y - template.height / 2,
          width: template.width,
          height: template.height,
          rotation: 0,
          color: template.color,
          seats: template.seats,
          label: `${tool.charAt(0).toUpperCase() + tool.slice(1)} ${objects.filter(o => o.type === tool).length + 1}`
        };

        const newObjects = [...objects, newObject];
        setObjects(newObjects);
        saveToHistory(newObjects);
        setSelectedObject(newObject.id);
        setTool('select');
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom - panOffset.x;
    const y = (e.clientY - rect.top) / zoom - panOffset.y;

    // Update cursor based on what we're hovering over
    if (!isDragging && selectedObject && tool === 'select') {
      const selectedObj = objects.find(obj => obj.id === selectedObject);
      if (selectedObj) {
        const handleType = isClickOnHandle(x, y, selectedObj);
        if (handleType) {
          canvas.style.cursor = handleType === 'move' ? 'grab' : 'pointer';
        } else if (x >= selectedObj.x && x <= selectedObj.x + selectedObj.width &&
                   y >= selectedObj.y && y <= selectedObj.y + selectedObj.height) {
          canvas.style.cursor = 'grab';
        } else {
          canvas.style.cursor = 'default';
        }
      } else {
        canvas.style.cursor = 'default';
      }
    }

    // Handle dragging with boundary constraints
    if (isDragging && selectedObject) {
      const newObjects = objects.map(obj => {
        if (obj.id === selectedObject) {
          const newX = Math.max(0, Math.min(canvasSize.width - obj.width, x - dragOffset.x));
          const newY = Math.max(0, Math.min(canvasSize.height - obj.height, y - dragOffset.y));
          
          return {
            ...obj,
            x: newX,
            y: newY
          };
        }
        return obj;
      });

      setObjects(newObjects);
    }
  };

  const handleMouseUp = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.cursor = 'default';
    }
    
    if (isDragging && selectedObject) {
      saveToHistory(objects);
    }
    setIsDragging(false);
  };

  // Delete selected object
  const deleteSelected = () => {
    if (selectedObject) {
      const newObjects = objects.filter(obj => obj.id !== selectedObject);
      setObjects(newObjects);
      saveToHistory(newObjects);
      setSelectedObject(null);
    }
  };

  // Zoom functions
  const zoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3));
  const zoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));

  // Save floor plan
  const handleSave = () => {
    const planData = {
      objects,
      canvasSize,
      setupStyle,
      venueId,
      totalSeats: objects.reduce((sum, obj) => sum + (obj.seats || 0), 0),
      createdAt: new Date().toISOString()
    };

    onSave?.(planData);
    onClose();
  };

  const selectedObj = objects.find(obj => obj.id === selectedObject);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center gap-3">
            <Grid3X3 className="h-6 w-6 text-blue-600" />
            3D Floor Plan Designer
            {setupStyle && (
              <Badge variant="secondary" className="ml-2">
                {setupStyle.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Tools */}
          <div className="w-64 border-r bg-slate-50 flex flex-col">
            <div className="p-4 space-y-4">
              {/* Tools */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Tools</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={tool === 'select' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTool('select')}
                  >
                    <Move className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={tool === 'table' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTool('table')}
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={tool === 'chair' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTool('chair')}
                  >
                    <Users className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={tool === 'stage' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTool('stage')}
                  >
                    <Music className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={tool === 'bar' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTool('bar')}
                  >
                    <Utensils className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Controls */}
              <div>
                <Label className="text-sm font-medium mb-2 block">View Controls</Label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={zoomOut}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={zoomIn}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={undo} disabled={historyIndex <= 0}>
                    <Undo className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1}>
                    <Redo className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-2">
                  <Label className="text-xs text-slate-600">Zoom: {Math.round(zoom * 100)}%</Label>
                </div>
              </div>

              {/* Object Properties */}
              {selectedObj && (
                <Card className="p-3">
                  <Label className="text-sm font-medium block mb-2">Selected Object</Label>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs">Label</Label>
                      <Input
                        value={selectedObj.label || ''}
                        onChange={(e) => {
                          const newObjects = objects.map(obj =>
                            obj.id === selectedObject ? { ...obj, label: e.target.value } : obj
                          );
                          setObjects(newObjects);
                        }}
                        className="mt-1 h-8"
                      />
                    </div>
                    
                    {selectedObj.seats && (
                      <div>
                        <Label className="text-xs">Seats</Label>
                        <Input
                          type="number"
                          value={selectedObj.seats}
                          onChange={(e) => {
                            const newObjects = objects.map(obj =>
                              obj.id === selectedObject ? { ...obj, seats: parseInt(e.target.value) || 0 } : obj
                            );
                            setObjects(newObjects);
                          }}
                          className="mt-1 h-8"
                        />
                      </div>
                    )}

                    <div>
                      <Label className="text-xs">Rotation</Label>
                      <Slider
                        value={[selectedObj.rotation]}
                        onValueChange={(value) => {
                          const newObjects = objects.map(obj =>
                            obj.id === selectedObject ? { ...obj, rotation: value[0] } : obj
                          );
                          setObjects(newObjects);
                        }}
                        max={360}
                        step={15}
                        className="mt-2"
                      />
                      <div className="text-xs text-slate-600 mt-1">{selectedObj.rotation}°</div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={deleteSelected}
                      className="w-full text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </Card>
              )}
            </div>

            {/* Statistics */}
            <div className="mt-auto p-4 border-t bg-white">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Objects:</span>
                  <span className="font-medium">{objects.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Seats:</span>
                  <span className="font-medium">{objects.reduce((sum, obj) => sum + (obj.seats || 0), 0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Canvas Area */}
          <div className="flex-1 flex flex-col">
            {/* Canvas Toolbar */}
            <div className="p-4 border-b bg-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Canvas Size:</Label>
                  <Select
                    value={`${canvasSize.width}x${canvasSize.height}`}
                    onValueChange={(value) => {
                      const [width, height] = value.split('x').map(Number);
                      setCanvasSize({ width, height });
                    }}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="800x600">800 × 600</SelectItem>
                      <SelectItem value="1024x768">1024 × 768</SelectItem>
                      <SelectItem value="1200x900">1200 × 900</SelectItem>
                      <SelectItem value="1600x1200">1600 × 1200</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-1" />
                  Import
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
                <Button onClick={handleSave} size="sm">
                  <Save className="h-4 w-4 mr-1" />
                  Save Plan
                </Button>
              </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 overflow-auto bg-slate-100 p-4">
              <div className="flex justify-center">
                <canvas
                  ref={canvasRef}
                  width={canvasSize.width}
                  height={canvasSize.height}
                  className="border-2 border-slate-300 bg-white shadow-lg cursor-crosshair"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}