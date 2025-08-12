import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { 
  RotateCcw, Square, Circle, Save, Plus, Trash2, Move, RotateCw, Layout, Box, Eye, 
  ZoomIn, ZoomOut, Copy, Clipboard, Grid3X3, Layers, Maximize2, MousePointer2,
  Target, Palette, FlipHorizontal, FlipVertical, AlignCenter, MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FloorPlanElement {
  id: string;
  type: 'table' | 'stage' | 'bar' | 'door' | 'wall' | 'chair' | 'plant' | 'entrance' | 'restroom' | 'kitchen';
  shape: 'rectangle' | 'circle' | 'square' | 'round-rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  seats?: number;
  label?: string;
  color: string;
  opacity?: number;
  zIndex?: number;
  locked?: boolean;
  visible?: boolean;
  borderWidth?: number;
  borderColor?: string;
  gradient?: boolean;
}

interface SetupStyleFloorPlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setupStyle: any;
  onSave: (floorPlan: any) => void;
}

const ELEMENT_TYPES = [
  { type: 'table', label: 'Round Table', shape: 'circle', defaultSize: { width: 80, height: 80 }, color: '#8B4513', icon: Circle, category: 'Seating' },
  { type: 'table', label: 'Rectangle Table', shape: 'rectangle', defaultSize: { width: 120, height: 60 }, color: '#8B4513', icon: Square, category: 'Seating' },
  { type: 'table', label: 'Square Table', shape: 'square', defaultSize: { width: 80, height: 80 }, color: '#8B4513', icon: Square, category: 'Seating' },
  { type: 'chair', label: 'Chair', shape: 'round-rectangle', defaultSize: { width: 24, height: 24 }, color: '#654321', icon: Square, category: 'Seating' },
  { type: 'stage', label: 'Stage', shape: 'rectangle', defaultSize: { width: 160, height: 100 }, color: '#4A5568', icon: Square, category: 'Features' },
  { type: 'bar', label: 'Bar Counter', shape: 'rectangle', defaultSize: { width: 140, height: 40 }, color: '#2D3748', icon: Square, category: 'Features' },
  { type: 'entrance', label: 'Entrance', shape: 'rectangle', defaultSize: { width: 60, height: 15 }, color: '#10B981', icon: Square, category: 'Structure' },
  { type: 'door', label: 'Door', shape: 'rectangle', defaultSize: { width: 40, height: 12 }, color: '#F7FAFC', icon: Square, category: 'Structure' },
  { type: 'wall', label: 'Wall', shape: 'rectangle', defaultSize: { width: 12, height: 120 }, color: '#1A202C', icon: Square, category: 'Structure' },
  { type: 'restroom', label: 'Restroom', shape: 'square', defaultSize: { width: 60, height: 60 }, color: '#6366F1', icon: Square, category: 'Facilities' },
  { type: 'kitchen', label: 'Kitchen', shape: 'rectangle', defaultSize: { width: 100, height: 80 }, color: '#EF4444', icon: Square, category: 'Facilities' },
  { type: 'plant', label: 'Plant/Decor', shape: 'circle', defaultSize: { width: 30, height: 30 }, color: '#22C55E', icon: Circle, category: 'Decor' },
];

const TEMPLATES = [
  {
    name: 'Wedding Reception',
    elements: [
      { id: 'head-table', type: 'table', shape: 'rectangle', x: 250, y: 50, width: 120, height: 60, rotation: 0, seats: 8, label: 'Head Table', color: '#8B4513' },
      { id: 'round-1', type: 'table', shape: 'circle', x: 100, y: 150, width: 80, height: 80, rotation: 0, seats: 8, label: 'Table 1', color: '#8B4513' },
      { id: 'round-2', type: 'table', shape: 'circle', x: 250, y: 150, width: 80, height: 80, rotation: 0, seats: 8, label: 'Table 2', color: '#8B4513' },
      { id: 'round-3', type: 'table', shape: 'circle', x: 400, y: 150, width: 80, height: 80, rotation: 0, seats: 8, label: 'Table 3', color: '#8B4513' },
      { id: 'stage', type: 'stage', shape: 'rectangle', x: 200, y: 300, width: 160, height: 80, rotation: 0, label: 'Stage', color: '#4A5568' },
    ]
  },
  {
    name: 'Corporate Meeting',
    elements: [
      { id: 'main-table', type: 'table', shape: 'rectangle', x: 150, y: 100, width: 300, height: 80, rotation: 0, seats: 12, label: 'Conference Table', color: '#8B4513' },
      { id: 'presentation', type: 'stage', shape: 'rectangle', x: 200, y: 50, width: 200, height: 40, rotation: 0, label: 'Presentation Area', color: '#4A5568' },
    ]
  },
  {
    name: 'Cocktail Party',
    elements: [
      { id: 'bar-1', type: 'bar', shape: 'rectangle', x: 50, y: 100, width: 140, height: 40, rotation: 0, label: 'Main Bar', color: '#2D3748' },
      { id: 'high-1', type: 'table', shape: 'circle', x: 250, y: 100, width: 60, height: 60, rotation: 0, seats: 4, label: 'High Table 1', color: '#8B4513' },
      { id: 'high-2', type: 'table', shape: 'circle', x: 350, y: 150, width: 60, height: 60, rotation: 0, seats: 4, label: 'High Table 2', color: '#8B4513' },
      { id: 'high-3', type: 'table', shape: 'circle', x: 150, y: 200, width: 60, height: 60, rotation: 0, seats: 4, label: 'High Table 3', color: '#8B4513' },
    ]
  },
];

export function SetupStyleFloorPlanModal({ open, onOpenChange, setupStyle, onSave }: SetupStyleFloorPlanModalProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [elements, setElements] = useState<FloorPlanElement[]>(
    setupStyle?.floorPlan?.elements || setupStyle?.floorPlan?.objects || []
  );
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [mode, setMode] = useState<'select' | 'add' | 'pan'>('select');
  const [selectedType, setSelectedType] = useState(ELEMENT_TYPES[0]);
  const [isDragging, setIsDragging] = useState(false);
  const [isMultiSelecting, setIsMultiSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{x: number, y: number, width: number, height: number} | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [canvasSize] = useState({ width: 800, height: 600 });
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [zoom, setZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(20);
  const [copiedElements, setCopiedElements] = useState<FloorPlanElement[]>([]);
  const [showRulers, setShowRulers] = useState(true);
  const [layerFilter, setLayerFilter] = useState<string>('all');
  const [history, setHistory] = useState<FloorPlanElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // History management - defined first to avoid initialization issues
  const saveToHistory = useCallback((newElements: FloorPlanElement[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newElements]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setElements([...history[historyIndex - 1]]);
    }
  }, [historyIndex, history]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setElements([...history[historyIndex + 1]]);
    }
  }, [historyIndex, history]);

  // Copy/paste functionality
  const copyElements = useCallback(() => {
    const elementsToCopy = elements.filter(el => selectedElements.includes(el.id));
    setCopiedElements(elementsToCopy);
  }, [elements, selectedElements]);

  const pasteElements = useCallback(() => {
    if (copiedElements.length === 0) return;
    
    const newElements = copiedElements.map(el => ({
      ...el,
      id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      x: el.x + 20,
      y: el.y + 20,
      label: `${el.label} (Copy)`,
    }));

    const updatedElements = [...elements, ...newElements];
    setElements(updatedElements);
    saveToHistory(updatedElements);
    setSelectedElements(newElements.map(el => el.id));
  }, [copiedElements, elements, saveToHistory]);

  const deleteSelectedElements = useCallback(() => {
    if (selectedElements.length === 0) return;
    
    const newElements = elements.filter(el => !selectedElements.includes(el.id));
    setElements(newElements);
    saveToHistory(newElements);
    setSelectedElements([]);
  }, [selectedElements, elements, saveToHistory]);

  const duplicateSelectedElements = useCallback(() => {
    if (selectedElements.length === 0) return;
    
    const elementsToDuplicate = elements.filter(el => selectedElements.includes(el.id));
    const newElements = elementsToDuplicate.map(el => ({
      ...el,
      id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      x: el.x + 30,
      y: el.y + 30,
      label: `${el.label} (Copy)`,
    }));

    const updatedElements = [...elements, ...newElements];
    setElements(updatedElements);
    saveToHistory(updatedElements);
    setSelectedElements(newElements.map(el => el.id));
  }, [selectedElements, elements, saveToHistory]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!open) return;
      
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'c':
            e.preventDefault();
            copyElements();
            break;
          case 'v':
            e.preventDefault();
            pasteElements();
            break;
          case 'd':
            e.preventDefault();
            duplicateSelectedElements();
            break;
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
            break;
          case 'a':
            e.preventDefault();
            setSelectedElements(elements.map(el => el.id));
            break;
        }
      }
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelectedElements();
      }
      
      if (e.key === 'Escape') {
        setSelectedElements([]);
        setMode('select');
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [open, copyElements, pasteElements, duplicateSelectedElements, undo, redo, deleteSelectedElements, elements]);

  // Alignment functions
  const alignElements = useCallback((alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (selectedElements.length < 2) return;
    
    const selectedElementData = elements.filter(el => selectedElements.includes(el.id));
    let referenceValue: number;
    
    switch (alignment) {
      case 'left':
        referenceValue = Math.min(...selectedElementData.map(el => el.x));
        setElements(prev => prev.map(el => 
          selectedElements.includes(el.id) ? { ...el, x: referenceValue } : el
        ));
        break;
      case 'right':
        referenceValue = Math.max(...selectedElementData.map(el => el.x + el.width));
        setElements(prev => prev.map(el => 
          selectedElements.includes(el.id) ? { ...el, x: referenceValue - el.width } : el
        ));
        break;
      case 'center':
        const avgX = selectedElementData.reduce((sum, el) => sum + el.x + el.width / 2, 0) / selectedElementData.length;
        setElements(prev => prev.map(el => 
          selectedElements.includes(el.id) ? { ...el, x: avgX - el.width / 2 } : el
        ));
        break;
      case 'top':
        referenceValue = Math.min(...selectedElementData.map(el => el.y));
        setElements(prev => prev.map(el => 
          selectedElements.includes(el.id) ? { ...el, y: referenceValue } : el
        ));
        break;
      case 'bottom':
        referenceValue = Math.max(...selectedElementData.map(el => el.y + el.height));
        setElements(prev => prev.map(el => 
          selectedElements.includes(el.id) ? { ...el, y: referenceValue - el.height } : el
        ));
        break;
      case 'middle':
        const avgY = selectedElementData.reduce((sum, el) => sum + el.y + el.height / 2, 0) / selectedElementData.length;
        setElements(prev => prev.map(el => 
          selectedElements.includes(el.id) ? { ...el, y: avgY - el.height / 2 } : el
        ));
        break;
    }
    saveToHistory(elements);
  }, [selectedElements, elements, saveToHistory]);

  // Grid snapping
  const snapToGridPosition = useCallback((x: number, y: number) => {
    if (!snapToGrid) return { x, y };
    return {
      x: Math.round(x / gridSize) * gridSize,
      y: Math.round(y / gridSize) * gridSize
    };
  }, [snapToGrid, gridSize]);

  const addElement = useCallback((x: number, y: number) => {
    if (mode !== 'add') return;

    const snappedPos = snapToGridPosition(x - selectedType.defaultSize.width / 2, y - selectedType.defaultSize.height / 2);
    
    const newElement: FloorPlanElement = {
      id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: selectedType.type as any,
      shape: selectedType.shape as any,
      x: snappedPos.x,
      y: snappedPos.y,
      width: selectedType.defaultSize.width,
      height: selectedType.defaultSize.height,
      rotation: 0,
      seats: selectedType.type === 'table' ? (selectedType.shape === 'circle' ? 6 : 8) : undefined,
      label: `${selectedType.label} ${elements.filter(e => e.type === selectedType.type).length + 1}`,
      color: selectedType.color,
      opacity: 1,
      zIndex: elements.length + 1,
      locked: false,
      visible: true,
      borderWidth: 2,
      borderColor: '#000000',
      gradient: false,
    };

    const newElements = [...elements, newElement];
    setElements(newElements);
    saveToHistory(newElements);
    setSelectedElements([newElement.id]);
    // Keep add mode active for continuous adding
  }, [mode, selectedType, elements, snapToGridPosition, saveToHistory]);

  // Multi-selection and improved interaction
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / (zoom / 100);
    const y = (e.clientY - rect.top) / (zoom / 100);

    if (mode === 'add') {
      addElement(x, y);
    } else if (!e.ctrlKey && !e.metaKey) {
      setSelectedElements([]);
    }
  }, [mode, addElement, zoom]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (mode === 'select' && !isDragging) {
      setIsMultiSelecting(true);
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (e.clientX - rect.left) / (zoom / 100);
        const y = (e.clientY - rect.top) / (zoom / 100);
        setSelectionBox({ x, y, width: 0, height: 0 });
      }
    }
  }, [mode, isDragging, zoom]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (isMultiSelecting && selectionBox && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const currentX = (e.clientX - rect.left) / (zoom / 100);
      const currentY = (e.clientY - rect.top) / (zoom / 100);
      
      setSelectionBox({
        x: Math.min(selectionBox.x, currentX),
        y: Math.min(selectionBox.y, currentY),
        width: Math.abs(currentX - selectionBox.x),
        height: Math.abs(currentY - selectionBox.y),
      });

      // Update selection based on box
      const selected = elements.filter(element => {
        const box = selectionBox;
        return element.x < box.x + box.width &&
               element.x + element.width > box.x &&
               element.y < box.y + box.height &&
               element.y + element.height > box.y;
      }).map(el => el.id);
      
      setSelectedElements(selected);
    }
  }, [isMultiSelecting, selectionBox, elements, zoom]);

  const handleCanvasMouseUp = useCallback(() => {
    if (isMultiSelecting) {
      setIsMultiSelecting(false);
      setSelectionBox(null);
    }
  }, [isMultiSelecting]);

  const handleElementClick = useCallback((e: React.MouseEvent, elementId: string) => {
    e.stopPropagation();
    
    if (e.ctrlKey || e.metaKey) {
      // Multi-select
      setSelectedElements(prev => 
        prev.includes(elementId) 
          ? prev.filter(id => id !== elementId)
          : [...prev, elementId]
      );
    } else {
      setSelectedElements([elementId]);
    }
  }, []);

  const handleElementMouseDown = useCallback((e: React.MouseEvent, elementId: string) => {
    e.stopPropagation();
    e.preventDefault();
    
    const element = elements.find(el => el.id === elementId);
    if (!element || element.locked) return;

    if (!selectedElements.includes(elementId)) {
      setSelectedElements([elementId]);
    }
    setIsDragging(true);
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setDragStart({ x: e.clientX, y: e.clientY });
      setDragOffset({ 
        x: (e.clientX - rect.left) / (zoom / 100) - element.x, 
        y: (e.clientY - rect.top) / (zoom / 100) - element.y 
      });
    }
  }, [elements, selectedElements, zoom]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || selectedElements.length === 0 || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / (zoom / 100) - dragOffset.x;
    const y = (e.clientY - rect.top) / (zoom / 100) - dragOffset.y;

    const deltaX = x - (elements.find(el => el.id === selectedElements[0])?.x || 0);
    const deltaY = y - (elements.find(el => el.id === selectedElements[0])?.y || 0);

    setElements(prev => prev.map(el => {
      if (selectedElements.includes(el.id) && !el.locked) {
        const newX = el.x + deltaX;
        const newY = el.y + deltaY;
        
        const snappedPos = snapToGridPosition(newX, newY);
        const constrainedX = Math.max(0, Math.min(snappedPos.x, canvasSize.width - el.width));
        const constrainedY = Math.max(0, Math.min(snappedPos.y, canvasSize.height - el.height));
        
        return { ...el, x: constrainedX, y: constrainedY };
      }
      return el;
    }));
  }, [isDragging, selectedElements, dragOffset, elements, canvasSize, zoom, snapToGridPosition]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragStart({ x: 0, y: 0 });
    setDragOffset({ x: 0, y: 0 });
  }, []);

  const rotateSelectedElements = useCallback(() => {
    if (selectedElements.length === 0) return;
    
    const newElements = elements.map(el => 
      selectedElements.includes(el.id) 
        ? { ...el, rotation: (el.rotation + 90) % 360 }
        : el
    );
    setElements(newElements);
    saveToHistory(newElements);
  }, [selectedElements, elements, saveToHistory]);

  const flipSelectedElements = useCallback((direction: 'horizontal' | 'vertical') => {
    if (selectedElements.length === 0) return;
    
    const newElements = elements.map(el => {
      if (selectedElements.includes(el.id)) {
        if (direction === 'horizontal') {
          return { ...el, rotation: (180 - el.rotation) % 360 };
        } else {
          return { ...el, rotation: (360 - el.rotation) % 360 };
        }
      }
      return el;
    });
    setElements(newElements);
    saveToHistory(newElements);
  }, [selectedElements, elements, saveToHistory]);

  const updateSelectedElements = useCallback((updates: Partial<FloorPlanElement>) => {
    if (selectedElements.length === 0) return;
    
    const newElements = elements.map(el => 
      selectedElements.includes(el.id) ? { ...el, ...updates } : el
    );
    setElements(newElements);
    saveToHistory(newElements);
  }, [selectedElements, elements, saveToHistory]);

  // Template loading
  const loadTemplate = useCallback((template: typeof TEMPLATES[0]) => {
    const newElements = template.elements.map(el => ({
      ...el,
      id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      opacity: 1,
      zIndex: 1,
      locked: false,
      visible: true,
      borderWidth: 2,
      borderColor: '#000000',
      gradient: false,
    })) as FloorPlanElement[];
    
    setElements(newElements);
    saveToHistory(newElements);
    setSelectedElements([]);
  }, [saveToHistory]);



  const handleSave = () => {
    const floorPlan = {
      elements,
      objects: elements, // Keep both formats for compatibility
      dimensions: canvasSize,
      canvasSize
    };
    onSave(floorPlan);
    onOpenChange(false);
  };

  const selectedElementData = selectedElements.length === 1 ? elements.find(el => el.id === selectedElements[0]) : null;

  // Enhanced 3D perspective transform for elements
  const get3DTransform = (element: FloorPlanElement) => {
    if (viewMode === '2d') return '';
    
    // Improved perspective for better 3D effect while staying in bounds
    const depth = Math.min(element.y / canvasSize.height, 0.8); // Limit depth to prevent overflow
    const scale = Math.max(0.7, 1 - (depth * 0.2)); // Less aggressive scaling
    const skewX = depth * -5; // Reduced skew for subtlety
    const translateY = -(depth * 10); // Reduced translation to stay in bounds
    const rotateX = 30; // Fixed rotation angle for consistency
    
    return `perspective(1000px) rotateX(${rotateX}deg) scale(${scale}) skewX(${skewX}deg) translateY(${translateY}px)`;
  };

  const get3DCanvasTransform = () => {
    const scaleValue = zoom / 100;
    const baseTransform = `scale(${scaleValue})`;
    if (viewMode === '2d') return baseTransform;
    // Constrain 3D transform to prevent canvas overflow
    return `${baseTransform} perspective(1000px) rotateX(20deg) translateZ(0)`;
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  // Enhanced realistic object shapes for 3D view
  const renderObjectShape = (element: FloorPlanElement) => {
    const baseStyle = {
      width: '100%',
      height: '100%',
      position: 'absolute' as const,
      top: 0,
      left: 0,
    };

    const is3D = viewMode === '3d';

    switch (element.type) {
      case 'stage':
        return (
          <div style={baseStyle} className="relative">
            {is3D ? (
              <>
                {/* 3D Stage - Platform with elevated appearance */}
                <div 
                  className="absolute bg-gray-700 border-2 border-gray-800"
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '4px',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3), 0 4px 8px rgba(0,0,0,0.4)',
                    background: 'linear-gradient(145deg, #4a5568, #2d3748)',
                  }}
                />
                {/* Stage edge highlight */}
                <div 
                  className="absolute border-t-2 border-gray-500"
                  style={{
                    width: '100%',
                    height: '4px',
                    top: '2px',
                    left: 0,
                    borderRadius: '2px 2px 0 0'
                  }}
                />
                {/* Stage front panel */}
                <div 
                  className="absolute bg-gray-800"
                  style={{
                    width: '100%',
                    height: '8px',
                    bottom: '-6px',
                    left: 0,
                    borderRadius: '0 0 4px 4px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.6)'
                  }}
                />
              </>
            ) : (
              <div 
                className="w-full h-full bg-gray-600 border-2 border-gray-700"
                style={{ borderRadius: '4px' }}
              />
            )}
          </div>
        );

      case 'chair':
        return (
          <div style={baseStyle} className="relative">
            {is3D ? (
              <>
                {/* Ultra-realistic 3D Chair */}
                {/* Chair back with detailed structure */}
                <div 
                  className="absolute"
                  style={{
                    width: '90%',
                    height: '40%',
                    top: '5%',
                    left: '5%',
                    background: 'linear-gradient(145deg, #8B4513, #654321)',
                    borderRadius: '4px 4px 0 0',
                    boxShadow: 'inset 2px 2px 4px rgba(139,69,19,0.3), inset -1px -1px 3px rgba(0,0,0,0.4), 0 3px 6px rgba(0,0,0,0.4)',
                    border: '1px solid #654321',
                  }}
                />
                {/* Chair back cushion */}
                <div 
                  className="absolute"
                  style={{
                    width: '75%',
                    height: '30%',
                    top: '10%',
                    left: '12.5%',
                    background: 'linear-gradient(145deg, #CD853F, #A0522D)',
                    borderRadius: '3px',
                    boxShadow: 'inset 1px 1px 2px rgba(205,133,63,0.3), 0 1px 3px rgba(0,0,0,0.3)',
                  }}
                />
                
                {/* Chair seat with realistic padding */}
                <div 
                  className="absolute"
                  style={{
                    width: '90%',
                    height: '35%',
                    top: '40%',
                    left: '5%',
                    background: 'linear-gradient(145deg, #D2691E, #A0522D)',
                    borderRadius: '4px',
                    boxShadow: 'inset 2px 2px 4px rgba(210,105,30,0.3), inset -2px -2px 4px rgba(0,0,0,0.3), 0 4px 8px rgba(0,0,0,0.4)',
                    border: '1px solid #8B4513',
                  }}
                />
                {/* Seat cushion detail */}
                <div 
                  className="absolute"
                  style={{
                    width: '80%',
                    height: '25%',
                    top: '45%',
                    left: '10%',
                    background: 'linear-gradient(135deg, #DEB887, #CD853F)',
                    borderRadius: '2px',
                    boxShadow: 'inset 1px 1px 2px rgba(222,184,135,0.4)',
                  }}
                />
                
                {/* Four realistic chair legs */}
                <div 
                  className="absolute bg-gradient-to-b from-amber-800 to-amber-900"
                  style={{
                    width: '6%',
                    height: '30%',
                    bottom: 0,
                    left: '15%',
                    borderRadius: '0 0 2px 2px',
                    boxShadow: '1px 1px 2px rgba(0,0,0,0.4)'
                  }}
                />
                <div 
                  className="absolute bg-gradient-to-b from-amber-800 to-amber-900"
                  style={{
                    width: '6%',
                    height: '30%',
                    bottom: 0,
                    right: '15%',
                    borderRadius: '0 0 2px 2px',
                    boxShadow: '1px 1px 2px rgba(0,0,0,0.4)'
                  }}
                />
                <div 
                  className="absolute bg-gradient-to-b from-amber-800 to-amber-900"
                  style={{
                    width: '6%',
                    height: '30%',
                    bottom: 0,
                    left: '79%',
                    borderRadius: '0 0 2px 2px',
                    boxShadow: '1px 1px 2px rgba(0,0,0,0.4)'
                  }}
                />
                <div 
                  className="absolute bg-gradient-to-b from-amber-800 to-amber-900"
                  style={{
                    width: '6%',
                    height: '30%',
                    bottom: 0,
                    right: '79%',
                    borderRadius: '0 0 2px 2px',
                    boxShadow: '1px 1px 2px rgba(0,0,0,0.4)'
                  }}
                />
                
                {/* Chair armrests */}
                <div 
                  className="absolute"
                  style={{
                    width: '8%',
                    height: '25%',
                    top: '45%',
                    left: '0%',
                    background: 'linear-gradient(145deg, #8B4513, #654321)',
                    borderRadius: '2px',
                    boxShadow: '1px 1px 3px rgba(0,0,0,0.4)'
                  }}
                />
                <div 
                  className="absolute"
                  style={{
                    width: '8%',
                    height: '25%',
                    top: '45%',
                    right: '0%',
                    background: 'linear-gradient(145deg, #8B4513, #654321)',
                    borderRadius: '2px',
                    boxShadow: '1px 1px 3px rgba(0,0,0,0.4)'
                  }}
                />
              </>
            ) : (
              <>
                {/* 2D Chair - Simplified but recognizable */}
                <div 
                  className="absolute bg-amber-800 border border-amber-900"
                  style={{
                    width: '100%',
                    height: '30%',
                    top: 0,
                    left: 0,
                    borderRadius: '2px 2px 0 0'
                  }}
                />
                <div 
                  className="absolute bg-amber-700 border border-amber-900"
                  style={{
                    width: '100%',
                    height: '70%',
                    bottom: 0,
                    left: 0,
                    borderRadius: '0 0 2px 2px'
                  }}
                />
              </>
            )}
          </div>
        );

      case 'table':
        if (element.shape === 'circle') {
          return (
            <div style={baseStyle}>
              {is3D ? (
                <>
                  {/* Ultra-realistic round table */}
                  {/* Table top with wood grain effect */}
                  <div 
                    className="absolute rounded-full"
                    style={{
                      width: '100%',
                      height: '100%',
                      background: 'radial-gradient(ellipse at 30% 30%, #D2691E, #8B4513, #654321)',
                      boxShadow: 'inset 3px 3px 8px rgba(139,69,19,0.3), inset -3px -3px 8px rgba(0,0,0,0.4), 0 6px 12px rgba(0,0,0,0.4)',
                      border: '2px solid #654321',
                    }}
                  />
                  {/* Wood grain lines */}
                  <div 
                    className="absolute rounded-full"
                    style={{
                      width: '90%',
                      height: '90%',
                      top: '5%',
                      left: '5%',
                      background: 'conic-gradient(from 45deg, rgba(139,69,19,0.2) 0deg, transparent 60deg, rgba(139,69,19,0.2) 120deg, transparent 180deg, rgba(139,69,19,0.2) 240deg, transparent 300deg)',
                      borderRadius: '50%',
                    }}
                  />
                  {/* Table edge highlight */}
                  <div 
                    className="absolute rounded-full"
                    style={{
                      width: '96%',
                      height: '96%',
                      top: '2%',
                      left: '2%',
                      border: '1px solid rgba(210,105,30,0.6)',
                      boxShadow: 'inset 0 2px 4px rgba(210,105,30,0.3)',
                    }}
                  />
                  
                  {/* Center pedestal base */}
                  <div 
                    className="absolute rounded-full"
                    style={{
                      width: '25%',
                      height: '25%',
                      top: '37.5%',
                      left: '37.5%',
                      background: 'linear-gradient(145deg, #8B4513, #654321)',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.5), inset 1px 1px 3px rgba(139,69,19,0.3)',
                      border: '1px solid #654321',
                    }}
                  />
                </>
              ) : (
                <div 
                  className="absolute bg-amber-800 border-2 border-amber-900 rounded-full"
                  style={{
                    width: '100%',
                    height: '100%',
                    background: 'radial-gradient(circle at 30% 30%, #a16207, #92400e)'
                  }}
                />
              )}
            </div>
          );
        } else {
          return (
            <div style={baseStyle}>
              {is3D ? (
                <>
                  {/* Ultra-realistic rectangular table */}
                  {/* Table top with detailed wood surface */}
                  <div 
                    className="absolute"
                    style={{
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(135deg, #D2691E 0%, #8B4513 40%, #654321 100%)',
                      borderRadius: '6px',
                      boxShadow: 'inset 3px 3px 8px rgba(139,69,19,0.3), inset -3px -3px 8px rgba(0,0,0,0.4), 0 6px 12px rgba(0,0,0,0.4)',
                      border: '2px solid #654321',
                    }}
                  />
                  {/* Wood grain pattern */}
                  <div 
                    className="absolute"
                    style={{
                      width: '95%',
                      height: '95%',
                      top: '2.5%',
                      left: '2.5%',
                      background: 'repeating-linear-gradient(90deg, rgba(139,69,19,0.1) 0px, transparent 2px, rgba(139,69,19,0.1) 4px, transparent 8px)',
                      borderRadius: '4px',
                    }}
                  />
                  {/* Table edge bevel */}
                  <div 
                    className="absolute"
                    style={{
                      width: '98%',
                      height: '98%',
                      top: '1%',
                      left: '1%',
                      border: '1px solid rgba(210,105,30,0.6)',
                      borderRadius: '5px',
                      boxShadow: 'inset 0 2px 4px rgba(210,105,30,0.3)',
                    }}
                  />
                  
                  {/* Four detailed table legs */}
                  <div 
                    className="absolute"
                    style={{
                      width: '8%',
                      height: '100%',
                      left: '8%',
                      background: 'linear-gradient(180deg, #8B4513, #654321)',
                      boxShadow: '2px 2px 4px rgba(0,0,0,0.4), inset 1px 1px 2px rgba(139,69,19,0.3)',
                      borderRadius: '0 0 3px 3px',
                    }}
                  />
                  <div 
                    className="absolute"
                    style={{
                      width: '8%',
                      height: '100%',
                      right: '8%',
                      background: 'linear-gradient(180deg, #8B4513, #654321)',
                      boxShadow: '2px 2px 4px rgba(0,0,0,0.4), inset 1px 1px 2px rgba(139,69,19,0.3)',
                      borderRadius: '0 0 3px 3px',
                    }}
                  />
                  <div 
                    className="absolute"
                    style={{
                      width: '8%',
                      height: '100%',
                      left: '84%',
                      background: 'linear-gradient(180deg, #8B4513, #654321)',
                      boxShadow: '2px 2px 4px rgba(0,0,0,0.4), inset 1px 1px 2px rgba(139,69,19,0.3)',
                      borderRadius: '0 0 3px 3px',
                    }}
                  />
                  <div 
                    className="absolute"
                    style={{
                      width: '8%',
                      height: '100%',
                      right: '84%',
                      background: 'linear-gradient(180deg, #8B4513, #654321)',
                      boxShadow: '2px 2px 4px rgba(0,0,0,0.4), inset 1px 1px 2px rgba(139,69,19,0.3)',
                      borderRadius: '0 0 3px 3px',
                    }}
                  />
                </>
              ) : (
                <div 
                  className="absolute bg-amber-800 border-2 border-amber-900 rounded"
                  style={{
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(135deg, #a16207, #92400e)'
                  }}
                />
              )}
            </div>
          );
        }

      case 'bar':
        return (
          <div style={baseStyle}>
            {is3D ? (
              <>
                {/* Ultra-realistic bar counter */}
                {/* Main bar surface with marble-like finish */}
                <div 
                  className="absolute"
                  style={{
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(135deg, #2C3E50 0%, #34495E 30%, #1A252F 100%)',
                    borderRadius: '8px 8px 4px 4px',
                    boxShadow: 'inset 3px 3px 8px rgba(44,62,80,0.3), inset -3px -3px 8px rgba(0,0,0,0.4), 0 8px 16px rgba(0,0,0,0.5)',
                    border: '2px solid #1A252F',
                  }}
                />
                {/* Marble pattern */}
                <div 
                  className="absolute"
                  style={{
                    width: '95%',
                    height: '95%',
                    top: '2.5%',
                    left: '2.5%',
                    background: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0px, transparent 3px, rgba(255,255,255,0.05) 6px, transparent 12px)',
                    borderRadius: '6px',
                  }}
                />
                {/* Bar edge with brass trim */}
                <div 
                  className="absolute"
                  style={{
                    width: '100%',
                    height: '8%',
                    top: '0%',
                    left: '0%',
                    background: 'linear-gradient(135deg, #B8860B, #DAA520, #B8860B)',
                    borderRadius: '8px 8px 0 0',
                    boxShadow: 'inset 1px 1px 3px rgba(218,165,32,0.3), 0 2px 4px rgba(0,0,0,0.3)',
                  }}
                />
                
                {/* Bar base/cabinet */}
                <div 
                  className="absolute"
                  style={{
                    width: '100%',
                    height: '25%',
                    bottom: '0%',
                    left: '0%',
                    background: 'linear-gradient(180deg, #1A252F, #0F1419)',
                    borderRadius: '0 0 4px 4px',
                    boxShadow: 'inset 2px 2px 4px rgba(15,20,25,0.3), 0 4px 8px rgba(0,0,0,0.5)',
                  }}
                />
                
                {/* Realistic bar stools */}
                <div 
                  className="absolute rounded-full"
                  style={{ 
                    top: '-12px', 
                    left: '15%',
                    width: '12px',
                    height: '12px',
                    background: 'linear-gradient(145deg, #8B4513, #654321)',
                    boxShadow: '1px 1px 3px rgba(0,0,0,0.4)',
                    border: '1px solid #654321',
                  }}
                />
                {/* Stool back */}
                <div 
                  className="absolute"
                  style={{ 
                    top: '-18px', 
                    left: '16%',
                    width: '10px',
                    height: '8px',
                    background: 'linear-gradient(145deg, #8B4513, #654321)',
                    borderRadius: '2px 2px 0 0',
                    boxShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                  }}
                />
                
                <div 
                  className="absolute rounded-full"
                  style={{ 
                    top: '-12px', 
                    right: '15%',
                    width: '12px',
                    height: '12px',
                    background: 'linear-gradient(145deg, #8B4513, #654321)',
                    boxShadow: '1px 1px 3px rgba(0,0,0,0.4)',
                    border: '1px solid #654321',
                  }}
                />
                {/* Stool back */}
                <div 
                  className="absolute"
                  style={{ 
                    top: '-18px', 
                    right: '16%',
                    width: '10px',
                    height: '8px',
                    background: 'linear-gradient(145deg, #8B4513, #654321)',
                    borderRadius: '2px 2px 0 0',
                    boxShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                  }}
                />
                
                {/* Center stool */}
                <div 
                  className="absolute rounded-full"
                  style={{ 
                    top: '-12px', 
                    left: '44%',
                    width: '12px',
                    height: '12px',
                    background: 'linear-gradient(145deg, #8B4513, #654321)',
                    boxShadow: '1px 1px 3px rgba(0,0,0,0.4)',
                    border: '1px solid #654321',
                  }}
                />
                <div 
                  className="absolute"
                  style={{ 
                    top: '-18px', 
                    left: '45%',
                    width: '10px',
                    height: '8px',
                    background: 'linear-gradient(145deg, #8B4513, #654321)',
                    borderRadius: '2px 2px 0 0',
                    boxShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                  }}
                />
              </>
            ) : (
              <div 
                className="absolute bg-slate-800 border-2 border-slate-900 rounded"
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(135deg, #1e293b, #0f172a)'
                }}
              />
            )}
          </div>
        );

      default:
        return null;
    }
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
            {/* Templates */}
            <Card className="p-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Quick Templates</Label>
                <div className="space-y-2">
                  {TEMPLATES.map((template) => (
                    <Button
                      key={template.name}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => loadTemplate(template)}
                    >
                      <Layout className="w-4 h-4 mr-2" />
                      {template.name}
                    </Button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Multi-Selection Tools */}
            {selectedElements.length > 1 && (
              <Card className="p-4">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Multi-Selection ({selectedElements.length})</Label>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={duplicateSelectedElements}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Duplicate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={deleteSelectedElements}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>

                  <Separator />
                  
                  <div className="space-y-2">
                    <Label className="text-xs">Alignment</Label>
                    <div className="grid grid-cols-3 gap-1">
                      <Button variant="outline" size="sm" onClick={() => alignElements('left')}>L</Button>
                      <Button variant="outline" size="sm" onClick={() => alignElements('center')}>C</Button>
                      <Button variant="outline" size="sm" onClick={() => alignElements('right')}>R</Button>
                      <Button variant="outline" size="sm" onClick={() => alignElements('top')}>T</Button>
                      <Button variant="outline" size="sm" onClick={() => alignElements('middle')}>M</Button>
                      <Button variant="outline" size="sm" onClick={() => alignElements('bottom')}>B</Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Grid & Snap Settings */}
            <Card className="p-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Grid & Snap</Label>
                
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Show Grid</Label>
                  <Switch checked={showGrid} onCheckedChange={setShowGrid} />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Snap to Grid</Label>
                  <Switch checked={snapToGrid} onCheckedChange={setSnapToGrid} />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs">Grid Size: {gridSize}px</Label>
                  <Slider
                    value={[gridSize]}
                    onValueChange={(value) => setGridSize(value[0])}
                    min={10}
                    max={50}
                    step={5}
                    className="w-full"
                  />
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Mode</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={mode === 'select' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMode('select')}
                  >
                    <MousePointer2 className="w-4 h-4 mr-1" />
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
                  <Button
                    variant={mode === 'pan' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMode('pan')}
                  >
                    <Move className="w-4 h-4 mr-1" />
                    Pan
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

            <Card className="p-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Zoom ({zoom}%)</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleZoomOut}
                    disabled={zoom <= 50}
                  >
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <div className="flex-1 text-center text-xs">{zoom}%</div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleZoomIn}
                    disabled={zoom >= 200}
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>

            {mode === 'add' && (
              <Card className="p-4 border-blue-200 bg-blue-50">
                <div className="mb-3 p-2 bg-blue-100 rounded border border-blue-200">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-blue-800">ADD MODE ACTIVE</span>
                  </div>
                  <p className="text-xs text-blue-700">
                    1. Select object type below → 2. Click anywhere on floor plan to place
                  </p>
                </div>
                <Label className="text-sm font-medium mb-3 block">Add Element</Label>
                <div className="space-y-3">
                  {Object.entries(
                    ELEMENT_TYPES.reduce((acc, type) => {
                      if (!acc[type.category]) acc[type.category] = [];
                      acc[type.category].push(type);
                      return acc;
                    }, {} as Record<string, typeof ELEMENT_TYPES>)
                  ).map(([category, types]) => (
                    <div key={category}>
                      <Label className="text-xs text-muted-foreground mb-2 block">{category}</Label>
                      <div className="space-y-1">
                        {types.map((type) => (
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
                    </div>
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
                      value={selectedElementData?.label || ''}
                      onChange={(e) => updateSelectedElements({ label: e.target.value })}
                      placeholder="Element label"
                      className="h-8"
                    />
                  </div>

                  {selectedElementData?.type === 'table' && (
                    <div className="space-y-2">
                      <Label className="text-xs">Seats</Label>
                      <Input
                        type="number"
                        value={selectedElementData?.seats || 0}
                        onChange={(e) => updateSelectedElements({ seats: parseInt(e.target.value) || 0 })}
                        min="1"
                        max="20"
                        className="h-8"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={rotateSelectedElements}
                    >
                      <RotateCw className="w-4 h-4 mr-1" />
                      Rotate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => flipSelectedElements('horizontal')}
                    >
                      <FlipHorizontal className="w-4 h-4 mr-1" />
                      Flip H
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => flipSelectedElements('vertical')}
                    >
                      <FlipVertical className="w-4 h-4 mr-1" />
                      Flip V
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={deleteSelectedElements}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
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
                    onClick={undo}
                    disabled={historyIndex <= 0}
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Undo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={redo}
                    disabled={historyIndex >= history.length - 1}
                  >
                    <RotateCw className="w-4 h-4 mr-1" />
                    Redo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setElements([]);
                      setSelectedElements([]);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Clear All
                  </Button>
                </div>
              </div>
              
              {/* Canvas Container with proper zoom containment */}
              <div className="relative w-full h-[600px] border-2 border-dashed border-slate-300 overflow-auto bg-slate-100">
                <div className="flex items-center justify-center min-h-full p-8">
                  <div
                    ref={canvasRef}
                    className={cn(
                      "relative transition-transform duration-300 border border-slate-400",
                      mode === 'add' ? "cursor-crosshair" : "cursor-default",
                      viewMode === '3d' ? "bg-gradient-to-b from-slate-100 to-slate-300" : "bg-slate-50"
                    )}
                    style={{
                      width: canvasSize.width,
                      height: canvasSize.height,
                      transform: get3DCanvasTransform(),
                      transformOrigin: 'center center',
                      // Create space for zoom expansion
                      minWidth: canvasSize.width,
                      minHeight: canvasSize.height,
                    }}
                onClick={handleCanvasClick}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={(e) => {
                  handleMouseMove(e);
                  handleCanvasMouseMove(e);
                }}
                onMouseUp={() => {
                  handleMouseUp();
                  handleCanvasMouseUp();
                }}
                onMouseLeave={() => {
                  handleMouseUp();
                  handleCanvasMouseUp();
                }}
              >
                {/* Grid pattern */}
                {showGrid && (
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
                      backgroundSize: `${gridSize}px ${gridSize}px`
                    }}
                  />
                )}

                {/* Selection box */}
                {isMultiSelecting && selectionBox && (
                  <div
                    className="absolute border-2 border-blue-500 bg-blue-100 bg-opacity-20 pointer-events-none z-30"
                    style={{
                      left: selectionBox.x,
                      top: selectionBox.y,
                      width: selectionBox.width,
                      height: selectionBox.height,
                    }}
                  />
                )}

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
                        selectedElements.includes(element.id) ? "border-blue-500 ring-2 ring-blue-200 cursor-move" : "border-gray-400 cursor-pointer",
                        isDragging && selectedElements.includes(element.id) ? "cursor-grabbing" : "",
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
                        zIndex: selectedElements.includes(element.id) ? 10 : Math.floor((1 - depth) * 5) + 1,
                        boxShadow: viewMode === '3d' 
                          ? `0 ${shadowSize}px ${shadowSize * 2}px rgba(0,0,0,0.3)`
                          : 'none',
                        filter: viewMode === '3d' ? `brightness(${1 - depth * 0.2})` : 'none',
                      }}
                      onClick={(e) => handleElementClick(e, element.id)}
                      onMouseDown={(e) => handleElementMouseDown(e, element.id)}
                    >
                      {/* Render realistic object shapes */}
                      {renderObjectShape(element)}
                      
                      {/* Label overlay */}
                      <span className="absolute inset-0 flex items-center justify-center text-center text-xs leading-tight pointer-events-none text-white font-semibold z-10" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                        {element.label}
                        {element.seats && <br />}
                        {element.seats && `${element.seats} seats`}
                      </span>
                      
                      {/* 3D Height indicator */}
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
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-600">
                <div>
                  <p>• <strong>Add Individual Objects:</strong> Select object type → Click "Add" mode → Click anywhere to place</p>
                  <p>• <strong>Continuous Adding:</strong> Add mode stays active - keep clicking to add multiple objects</p>
                  <p>• <strong>Multi-select:</strong> Ctrl+Click elements or drag selection box</p>
                  <p>• <strong>Move Objects:</strong> Select mode → Click and drag objects around</p>
                </div>
                <div>
                  <p>• <strong>Shortcuts:</strong> Ctrl+C/V (copy/paste), Del (delete)</p>
                  <p>• <strong>3D View:</strong> Ultra-realistic furniture with detailed materials</p>
                  <p>• <strong>Grid Snap:</strong> Auto-align to grid points for precise placement</p>
                  <p>• <strong>Templates:</strong> Quick layout presets or start from scratch</p>
                </div>
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