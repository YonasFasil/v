import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  getStatusConfig, 
  getNextStatuses, 
  canEditStatus,
  getAllStatuses, 
  type EventStatus 
} from "@shared/status-utils";
import { CancellationModal } from "./cancellation-modal";

interface StatusSelectorProps {
  currentStatus: EventStatus | string;
  onStatusChange?: (newStatus: EventStatus) => void;
  readonly?: boolean;
  showAllStatuses?: boolean;
  eventId?: string;
  eventTitle?: string;
}

export function StatusSelector({ 
  currentStatus, 
  onStatusChange, 
  readonly = false,
  showAllStatuses = false,
  eventId,
  eventTitle 
}: StatusSelectorProps) {
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const statusConfig = getStatusConfig(currentStatus);
  
  // If readonly, just show the current status badge
  if (readonly || !canEditStatus(currentStatus as EventStatus)) {
    return (
      <Badge 
        className={`${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor} border text-sm px-3 py-1`}
      >
        {statusConfig.label}
      </Badge>
    );
  }

  // Determine available statuses - show all statuses for easy selection in modal
  const availableStatuses = getAllStatuses();

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
      <Select
        value={currentStatus}
        onValueChange={handleStatusChange}
      >
        <SelectTrigger className="w-fit min-w-32 h-9">
          <SelectValue>
            <Badge 
              className={`${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor} border text-sm px-3 py-1`}
            >
              {statusConfig.label}
            </Badge>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {availableStatuses.map((status) => {
            const config = getStatusConfig(status.value);
            return (
              <SelectItem key={status.value} value={status.value}>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: config.color }}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{config.label}</span>
                    <span className="text-xs text-slate-500">{config.description}</span>
                  </div>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

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