import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertTriangle, X } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CancellationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: any;
  onCancelled: () => void;
}

const CANCELLATION_REASONS = [
  { value: "client_request", label: "Client requested cancellation" },
  { value: "venue_conflict", label: "Venue scheduling conflict" },
  { value: "weather", label: "Weather-related cancellation" },
  { value: "insufficient_payment", label: "Payment issues" },
  { value: "force_majeure", label: "Force majeure (unforeseen circumstances)" },
  { value: "vendor_unavailable", label: "Required vendor unavailable" },
  { value: "permit_issues", label: "Permit or licensing issues" },
  { value: "client_emergency", label: "Client emergency" },
  { value: "other", label: "Other reason" }
];

export function CancellationModal({ open, onOpenChange, booking, onCancelled }: CancellationModalProps) {
  const [selectedReason, setSelectedReason] = useState("");
  const [cancellationNote, setCancellationNote] = useState("");
  const { toast } = useToast();

  const cancelBookingMutation = useMutation({
    mutationFn: async () => {
      if (!selectedReason) {
        throw new Error("Please select a cancellation reason");
      }

      const response = await apiRequest(`/api/bookings/${booking.id}/cancel`, {
        method: "POST",
        body: JSON.stringify({
          cancellationReason: selectedReason,
          cancellationNote: cancellationNote.trim() || null
        }),
        headers: { "Content-Type": "application/json" }
      });

      return response;
    },
    onSuccess: () => {
      toast({
        title: "Booking Cancelled",
        description: "The booking has been successfully cancelled and logged for reporting."
      });
      onCancelled();
      onOpenChange(false);
      // Reset form
      setSelectedReason("");
      setCancellationNote("");
    },
    onError: (error: any) => {
      toast({
        title: "Cancellation Failed",
        description: error.message || "Failed to cancel booking. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleCancel = () => {
    cancelBookingMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Cancel Booking
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
            <h4 className="font-medium text-sm mb-1">{booking?.eventName}</h4>
            <p className="text-sm text-gray-600">
              {booking?.eventDate && new Date(booking.eventDate).toLocaleDateString()} • {booking?.startTime} - {booking?.endTime}
            </p>
            <p className="text-sm text-red-700 mt-2">
              <strong>Warning:</strong> This action cannot be undone. The booking will be permanently cancelled.
            </p>
          </div>

          <div>
            <Label className="text-sm font-medium">Reason for Cancellation *</Label>
            <RadioGroup value={selectedReason} onValueChange={setSelectedReason} className="mt-2">
              {CANCELLATION_REASONS.map((reason) => (
                <div key={reason.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={reason.value} id={reason.value} />
                  <Label htmlFor={reason.value} className="text-sm cursor-pointer">
                    {reason.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="cancellation-note" className="text-sm font-medium">
              Additional Details {selectedReason === "other" && "*"}
            </Label>
            <Textarea
              id="cancellation-note"
              placeholder={
                selectedReason === "other" 
                  ? "Please provide details about the cancellation reason..."
                  : "Optional: Add any additional details about this cancellation..."
              }
              value={cancellationNote}
              onChange={(e) => setCancellationNote(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={cancelBookingMutation.isPending}
          >
            Keep Booking
          </Button>
          <Button 
            variant="destructive"
            onClick={handleCancel}
            disabled={!selectedReason || (selectedReason === "other" && !cancellationNote.trim()) || cancelBookingMutation.isPending}
          >
            {cancelBookingMutation.isPending ? "Cancelling..." : "Cancel Booking"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}