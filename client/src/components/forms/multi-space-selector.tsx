import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ChevronDown, X } from "lucide-react";

interface Space {
  id: string;
  name: string;
  capacity: number;
}

interface MultiSpaceSelectorProps {
  spaces: Space[];
  selectedSpaceIds: string[];
  onSelectionChange: (spaceIds: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function MultiSpaceSelector({
  spaces,
  selectedSpaceIds,
  onSelectionChange,
  placeholder = "Select spaces",
  className,
  disabled = false
}: MultiSpaceSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const selectedSpaces = spaces.filter(space => selectedSpaceIds.includes(space.id));

  const handleSpaceToggle = (spaceId: string) => {
    const newSelection = selectedSpaceIds.includes(spaceId)
      ? selectedSpaceIds.filter(id => id !== spaceId)
      : [...selectedSpaceIds, spaceId];

    onSelectionChange(newSelection);
  };

  const handleRemoveSpace = (spaceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectionChange(selectedSpaceIds.filter(id => id !== spaceId));
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectionChange([]);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          disabled={disabled}
          className={cn(
            "w-full h-auto min-h-10 justify-between text-left font-normal",
            selectedSpaceIds.length === 0 && "text-muted-foreground",
            className
          )}
        >
          <div className="flex flex-wrap gap-1 max-w-full">
            {selectedSpaceIds.length === 0 ? (
              <span>{placeholder}</span>
            ) : (
              <>
                {selectedSpaces.map((space) => (
                  <Badge
                    key={space.id}
                    variant="secondary"
                    className="text-xs px-2 py-1 gap-1"
                  >
                    <span className="truncate max-w-24">{space.name}</span>
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={(e) => handleRemoveSpace(space.id, e)}
                    />
                  </Badge>
                ))}
                {selectedSpaceIds.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{selectedSpaceIds.length - 3} more
                  </Badge>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-1 ml-2">
            {selectedSpaceIds.length > 0 && (
              <X
                className="h-4 w-4 opacity-50 hover:opacity-100 cursor-pointer"
                onClick={handleClearAll}
              />
            )}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <div className="p-3 border-b">
          <h4 className="font-medium text-sm">Select Spaces</h4>
          <p className="text-xs text-muted-foreground mt-1">
            Choose one or more spaces for this event
          </p>
        </div>
        <div className="p-2 max-h-64 overflow-auto">
          {spaces.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No spaces available
            </div>
          ) : (
            <div className="space-y-2">
              {spaces.map((space) => (
                <div
                  key={space.id}
                  className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent cursor-pointer"
                  onClick={() => handleSpaceToggle(space.id)}
                >
                  <Checkbox
                    id={`space-${space.id}`}
                    checked={selectedSpaceIds.includes(space.id)}
                    onChange={() => handleSpaceToggle(space.id)}
                  />
                  <Label
                    htmlFor={`space-${space.id}`}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{space.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {space.capacity} guests
                      </Badge>
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          )}
        </div>
        {selectedSpaceIds.length > 0 && (
          <div className="p-3 border-t bg-muted/30">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {selectedSpaceIds.length} space{selectedSpaceIds.length !== 1 ? 's' : ''} selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={handleClearAll}
              >
                Clear all
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}