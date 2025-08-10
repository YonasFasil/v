import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CancellationModal } from "./cancellation-modal";

interface StatusChangeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: any;
  onStatusChanged: () => void;
}

const STATUS_OPTIONS = [
  { value: "inquiry", label: "Lead", description: "Active lead - gathering requirements, sending proposals" },
  { value: "confirmed", label: "Booked", description: "Customer confirmed, contract signed, deposit received" },
  { value: "completed", label: "Completed", description: "Event finished successfully" },
  { value: "cancelled", label: "Cancelled", description: "Booking cancelled by customer or venue" }
];

export function StatusChangeModal({ open, onOpenChange, booking, onStatusChanged }: StatusChangeModalProps) {
  const [selectedStatus, setSelectedStatus] = useState(booking?.status || "");
  const [notes, setNotes] = useState("");
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const { toast } = useToast();

  const updateStatusMutation = useMutation({
    mutationFn: async () => {
      const updateData: any = {
        status: selectedStatus,
      };

      // Add completion timestamp if marking as completed
      if (selectedStatus === "completed") {
        updateData.completedAt = new Date().toISOString();
      }

      // Add notes if provided
      if (notes.trim()) {
        updateData.notes = booking.notes ? `${booking.notes}\n\nStatus Update: ${notes}` : `Status Update: ${notes}`;
      }

      const response = await apiRequest(`/api/bookings/${booking.id}`, {
        method: "PATCH",
        body: JSON.stringify(updateData),
        headers: { "Content-Type": "application/json" }
      });

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: `Booking status changed to ${STATUS_OPTIONS.find(s => s.value === selectedStatus)?.label}`
      });
      onStatusChanged();
      onOpenChange(false);
      setNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update booking status. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleStatusChange = () => {
    if (selectedStatus === "cancelled") {
      setShowCancellationModal(true);
      return;
    }
    updateStatusMutation.mutate();
  };

  const getCurrentStatusBadge = (status: string) => {
    const statusConfig = {
      inquiry: { class: "bg-purple-100 text-purple-800", label: "Lead" },
      confirmed: { class: "bg-green-100 text-green-800", label: "Booked" },
      completed: { class: "bg-gray-100 text-gray-800", label: "Completed" },
      cancelled: { class: "bg-red-100 text-red-800", label: "Cancelled" }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { class: "bg-gray-100 text-gray-800", label: status };
    
    return (
      <Badge className={config.class}>
        {config.label}
      </Badge>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Booking Status</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg">
              <h4 className="font-medium text-sm mb-1">{booking?.eventName}</h4>
              <p className="text-sm text-gray-600 mb-2">
                {booking?.eventDate && new Date(booking.eventDate).toLocaleDateString()} • {booking?.startTime} - {booking?.endTime}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Current Status:</span>
                {getCurrentStatusBadge(booking?.status)}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">New Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      <div>
                        <div className="font-medium">{status.label}</div>
                        <div className="text-xs text-gray-500">{status.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedStatus && selectedStatus !== booking?.status && (
              <div>
                <Label htmlFor="status-notes" className="text-sm font-medium">
                  Notes (Optional)
                </Label>
                <Textarea
                  id="status-notes"
                  placeholder="Add any notes about this status change..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={updateStatusMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleStatusChange}
              disabled={!selectedStatus || selectedStatus === booking?.status || updateStatusMutation.isPending}
              variant={selectedStatus === "cancelled" ? "destructive" : "default"}
            >
              {updateStatusMutation.isPending ? "Updating..." : 
               selectedStatus === "cancelled" ? "Cancel Booking" : "Update Status"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <CancellationModal
        open={showCancellationModal}
        onOpenChange={setShowCancellationModal}
        booking={booking}
        onCancelled={() => {
          onStatusChanged();
          onOpenChange(false);
        }}
      />
    </>
  );
}