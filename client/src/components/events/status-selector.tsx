import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { 
  getStatusConfig, 
  getNextStatuses, 
  canEditStatus,
  getAllStatuses, 
  type EventStatus 
} from "@shared/status-utils";
import { CancellationModal } from "./cancellation-modal";
import { ChevronDown, Check } from "lucide-react";

interface StatusSelectorProps {
  currentStatus: EventStatus | string;
  onStatusChange?: (newStatus: EventStatus) => void;
  readonly?: boolean;
  showAllStatuses?: boolean;
  eventId?: string;
  eventTitle?: string;
  cancellationReason?: string | null;
}

export function StatusSelector({ 
  currentStatus, 
  onStatusChange, 
  readonly = false,
  showAllStatuses = false,
  eventId,
  eventTitle,
  cancellationReason
}: StatusSelectorProps) {
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const statusConfig = getStatusConfig(currentStatus);
  
  // If readonly, just show the current status badge
  if (readonly || !canEditStatus(currentStatus as EventStatus, cancellationReason)) {
    return (
      <Badge 
        className={`${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor} border text-sm px-3 py-1 font-medium`}
      >
        <div 
          className="w-2 h-2 rounded-full mr-2"
          style={{ backgroundColor: statusConfig.color }}
        />
        {statusConfig.label}
      </Badge>
    );
  }

  // Group statuses by category for better organization
  const allStatuses = getAllStatuses();
  const activeStatuses = allStatuses.filter(s => !['completed', 'cancelled'].includes(s.value));
  const finalStatuses = allStatuses.filter(s => ['completed', 'cancelled'].includes(s.value));

  const handleStatusChange = (value: string) => {
    if (value === "cancelled") {
      // Show cancellation modal instead of directly changing status
      setShowCancellationModal(true);
    } else {
      onStatusChange?.(value as EventStatus);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="h-9 px-3 py-1 border-2 transition-all duration-200 hover:shadow-md"
            style={{ 
              borderColor: statusConfig.color + '40',
              backgroundColor: statusConfig.bgColor 
            }}
          >
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full animate-pulse"
                style={{ backgroundColor: statusConfig.color }}
              />
              <span className={`font-medium text-sm ${statusConfig.textColor}`}>
                {statusConfig.label}
              </span>
              <ChevronDown className="w-4 h-4 ml-1 text-gray-400" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent className="w-64 p-2" align="start">
          <DropdownMenuLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1">
            Active Statuses
          </DropdownMenuLabel>
          
          {activeStatuses.map((status) => {
            const config = getStatusConfig(status.value);
            const isSelected = currentStatus === status.value;
            
            return (
              <DropdownMenuItem 
                key={status.value}
                onClick={() => handleStatusChange(status.value)}
                className="p-3 cursor-pointer rounded-md hover:bg-gray-50 transition-colors duration-150 mb-1"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: config.color }}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900 text-sm">
                        {config.label}
                      </span>
                      <span className="text-xs text-gray-500 leading-tight">
                        {config.description}
                      </span>
                    </div>
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-green-600" />
                  )}
                </div>
              </DropdownMenuItem>
            );
          })}

          <DropdownMenuSeparator className="my-2" />
          
          <DropdownMenuLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1">
            Final Statuses
          </DropdownMenuLabel>
          
          {finalStatuses.map((status) => {
            const config = getStatusConfig(status.value);
            const isSelected = currentStatus === status.value;
            
            return (
              <DropdownMenuItem 
                key={status.value}
                onClick={() => handleStatusChange(status.value)}
                className="p-3 cursor-pointer rounded-md hover:bg-gray-50 transition-colors duration-150 mb-1"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: config.color }}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900 text-sm">
                        {config.label}
                      </span>
                      <span className="text-xs text-gray-500 leading-tight">
                        {config.description}
                      </span>
                    </div>
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-green-600" />
                  )}
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {eventId && eventTitle && (
        <CancellationModal
          isOpen={showCancellationModal}
          onClose={() => setShowCancellationModal(false)}
          eventId={eventId}
          eventTitle={eventTitle}
        />
      )}
    </>
  );
}

interface StatusBadgeProps {
  status: EventStatus | string;
  size?: "sm" | "md" | "lg";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const config = getStatusConfig(status);
  
  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-2"
  };
  
  return (
    <Badge 
      className={`${config.bgColor} ${config.textColor} ${config.borderColor} border ${sizeClasses[size]}`}
    >
      {config.label}
    </Badge>
  );
}

interface StatusIndicatorProps {
  status: EventStatus | string;
  size?: number;
}

export function StatusIndicator({ status, size = 8 }: StatusIndicatorProps) {
  const config = getStatusConfig(status);
  
  return (
    <div 
      className="rounded-full"
      style={{ 
        backgroundColor: config.color,
        width: `${size}px`,
        height: `${size}px`
      }}
      title={config.label}
    />
  );
}