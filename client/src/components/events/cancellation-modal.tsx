import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { X } from "lucide-react";

interface CancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
}

const CANCELLATION_REASONS = [
  "Client requested cancellation",
  "Venue unavailable",
  "Weather conditions", 
  "Budget constraints",
  "Schedule conflict",
  "Health/safety concerns",
  "Vendor issues",
  "Other"
];

export function CancellationModal({ isOpen, onClose, eventId, eventTitle }: CancellationModalProps) {
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const cancelEventMutation = useMutation({
    mutationFn: async ({ reason }: { reason: string }) => {
      return await apiRequest(`/api/bookings/${eventId}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "cancelled",
          cancellationReason: reason,
          cancelledAt: new Date().toISOString()
        }),
        headers: { "Content-Type": "application/json" }
      });
    },
    onSuccess: () => {
      toast({
        title: "Event Cancelled",
        description: `"${eventTitle}" has been cancelled successfully.`,
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      
      onClose();
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to cancel event. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to cancel event:", error);
    },
  });

  const resetForm = () => {
    setSelectedReason("");
    setCustomReason("");
  };

  const handleSubmit = () => {
    const finalReason = selectedReason === "Other" ? customReason : selectedReason;
    
    if (!finalReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please select or enter a cancellation reason.",
        variant: "destructive",
      });
      return;
    }

    cancelEventMutation.mutate({ reason: finalReason.trim() });
  };

  const handleClose = () => {
    if (cancelEventMutation.isPending) return;
    onClose();
    resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Cancel Event</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            disabled={cancelEventMutation.isPending}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="text-sm text-gray-600">
            Are you sure you want to cancel "{eventTitle}"? Please provide a reason for cancellation.
          </div>

          <div className="space-y-4">
            <Label className="text-base font-medium">Reason for Cancellation</Label>
            
            <RadioGroup 
              value={selectedReason} 
              onValueChange={setSelectedReason}
              className="space-y-2"
            >
              {CANCELLATION_REASONS.map((reason) => (
                <div key={reason} className="flex items-center space-x-2">
                  <RadioGroupItem value={reason} id={reason} />
                  <Label 
                    htmlFor={reason}
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    {reason}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            {selectedReason === "Other" && (
              <div className="space-y-2">
                <Label htmlFor="custom-reason" className="text-sm">
                  Please specify:
                </Label>
                <Textarea
                  id="custom-reason"
                  placeholder="Enter the specific reason for cancellation..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={cancelEventMutation.isPending}
            >
              Keep Event
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={cancelEventMutation.isPending || !selectedReason}
              variant="destructive"
            >
              {cancelEventMutation.isPending ? "Cancelling..." : "Cancel Event"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}