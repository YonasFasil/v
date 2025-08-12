// Event status management utilities

export type EventStatus = 
  | "inquiry" 
  | "pending" 
  | "tentative" 
  | "confirmed_deposit_paid" 
  | "confirmed_fully_paid" 
  | "completed" 
  | "cancelled";

export interface StatusConfig {
  label: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  nextStatuses: EventStatus[];
  canEdit: boolean;
  isCompleted: boolean;
  isActive: boolean;
}

export const STATUS_CONFIGS: Record<EventStatus, StatusConfig> = {
  inquiry: {
    label: "Inquiry",
    description: "Initial inquiry received, needs follow-up",
    color: "#6b7280", // gray-500
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200", 
    textColor: "text-gray-700",
    nextStatuses: ["pending", "cancelled"],
    canEdit: true,
    isCompleted: false,
    isActive: true
  },
  pending: {
    label: "Proposal Shared", 
    description: "Proposal sent to client, awaiting response",
    color: "#f59e0b", // amber-500
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    textColor: "text-amber-700",
    nextStatuses: ["tentative", "cancelled"],
    canEdit: true,
    isCompleted: false,
    isActive: true
  },
  tentative: {
    label: "Tentative",
    description: "Tentative booking, awaiting confirmation",
    color: "#3b82f6", // blue-500
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-700",
    nextStatuses: ["confirmed_deposit_paid", "cancelled"],
    canEdit: true,
    isCompleted: false,
    isActive: true
  },
  confirmed_deposit_paid: {
    label: "Confirmed (Deposit Paid)",
    description: "Deposit received, balance payment pending",
    color: "#8b5cf6", // violet-500  
    bgColor: "bg-violet-50",
    borderColor: "border-violet-200",
    textColor: "text-violet-700",
    nextStatuses: ["confirmed_fully_paid", "cancelled"],
    canEdit: true,
    isCompleted: false,
    isActive: true
  },
  confirmed_fully_paid: {
    label: "Confirmed (Fully Paid)",
    description: "All payments received, event ready",
    color: "#10b981", // emerald-500
    bgColor: "bg-emerald-50", 
    borderColor: "border-emerald-200",
    textColor: "text-emerald-700",
    nextStatuses: ["completed", "cancelled"],
    canEdit: true,
    isCompleted: false,
    isActive: true
  },
  completed: {
    label: "Completed",
    description: "Event successfully completed",
    color: "#059669", // emerald-600
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    textColor: "text-green-700",
    nextStatuses: [],
    canEdit: false,
    isCompleted: true,
    isActive: false
  },
  cancelled: {
    label: "Cancelled",
    description: "Event cancelled and refunds processed",
    color: "#dc2626", // red-600
    bgColor: "bg-red-50",
    borderColor: "border-red-200", 
    textColor: "text-red-700",
    nextStatuses: [],
    canEdit: false,
    isCompleted: true,
    isActive: false
  }
};

// Get status configuration with legacy mapping
export function getStatusConfig(status: EventStatus | string): StatusConfig {
  // Handle legacy statuses by mapping them to new ones
  const statusMap: Record<string, EventStatus> = {
    'confirmed': 'tentative',
    'pending': 'pending',
    'proposal_shared': 'pending',
    'completed': 'completed',
    'cancelled': 'cancelled',
    'inquiry': 'inquiry'
  };
  
  const mappedStatus = statusMap[status] || status as EventStatus;
  return STATUS_CONFIGS[mappedStatus] || STATUS_CONFIGS['inquiry'];
}

// Get status color for calendar display
export function getStatusColor(status: EventStatus | string): string {
  // Handle legacy statuses by mapping them to new ones
  const statusMap: Record<string, EventStatus> = {
    'confirmed': 'tentative',
    'pending': 'pending',
    'proposal_shared': 'pending',
    'completed': 'completed',
    'cancelled': 'cancelled',
    'inquiry': 'inquiry'
  };
  
  const mappedStatus = statusMap[status] || status as EventStatus;
  return STATUS_CONFIGS[mappedStatus]?.color || STATUS_CONFIGS['inquiry'].color;
}

// Get status label
export function getStatusLabel(status: EventStatus | string): string {
  // Handle legacy statuses by mapping them to new ones
  const statusMap: Record<string, EventStatus> = {
    'confirmed': 'tentative',
    'pending': 'pending',
    'proposal_shared': 'pending',
    'completed': 'completed',
    'cancelled': 'cancelled'
  };
  
  const mappedStatus = statusMap[status] || status as EventStatus;
  return STATUS_CONFIGS[mappedStatus]?.label || status.toString();
}

// Get next possible statuses
export function getNextStatuses(currentStatus: EventStatus | string): EventStatus[] {
  // Handle legacy statuses by mapping them to new ones
  const statusMap: Record<string, EventStatus> = {
    'confirmed': 'tentative',
    'pending': 'pending',
    'proposal_shared': 'pending',
    'completed': 'completed',
    'cancelled': 'cancelled'
  };
  
  const mappedStatus = statusMap[currentStatus] || currentStatus as EventStatus;
  return STATUS_CONFIGS[mappedStatus]?.nextStatuses || [];
}

// Check if status can be edited
export function canEditStatus(status: EventStatus | string): boolean {
  // Handle legacy statuses by mapping them to new ones
  const statusMap: Record<string, EventStatus> = {
    'confirmed': 'tentative',
    'pending': 'pending',
    'proposal_shared': 'pending',
    'completed': 'completed',
    'cancelled': 'cancelled'
  };
  
  const mappedStatus = statusMap[status] || status as EventStatus;
  return STATUS_CONFIGS[mappedStatus]?.canEdit ?? true; // Default to true if status not found
}

// Check if event is completed
export function isEventCompleted(status: EventStatus): boolean {
  return STATUS_CONFIGS[status].isCompleted;
}

// Check if event is active (can have future actions)
export function isEventActive(status: EventStatus): boolean {
  return STATUS_CONFIGS[status].isActive;
}

// Auto-update status based on payment state
export function getAutoStatus(
  proposalStatus: string | null,
  depositPaid: boolean, 
  totalPaid: number,
  totalAmount: number,
  eventDate: Date,
  currentStatus: EventStatus
): EventStatus {
  const now = new Date();
  const eventPassed = eventDate < now;
  
  // If event is completed, don't change
  if (currentStatus === "completed" || currentStatus === "cancelled") {
    return currentStatus;
  }
  
  // Auto-complete if event passed and fully paid
  if (eventPassed && totalPaid >= totalAmount) {
    return "completed";
  }
  
  // If fully paid
  if (totalPaid >= totalAmount) {
    return "confirmed_fully_paid";
  }
  
  // If deposit paid
  if (depositPaid) {
    return "confirmed_deposit_paid";
  }
  
  // If proposal accepted but no payment
  if (proposalStatus === "accepted") {
    return "tentative";
  }
  
  // If proposal sent
  if (proposalStatus === "sent" || proposalStatus === "viewed") {
    return "pending";
  }
  
  // Default to inquiry
  return "inquiry";
}

// Get status badge classes for UI components
export function getStatusBadgeClasses(status: EventStatus): string {
  const config = STATUS_CONFIGS[status];
  return `${config.bgColor} ${config.textColor} ${config.borderColor} border`;
}

// Get all statuses for dropdowns/selects
export function getAllStatuses(): { value: EventStatus; label: string; description: string }[] {
  return Object.entries(STATUS_CONFIGS).map(([value, config]) => ({
    value: value as EventStatus,
    label: config.label,
    description: config.description
  }));
}