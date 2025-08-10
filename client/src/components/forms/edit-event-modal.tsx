import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Edit, Save, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: any;
}

export function EditEventModal({ open, onOpenChange, booking }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Form state
  const [eventName, setEventName] = useState("");
  const [guestCount, setGuestCount] = useState(1);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [status, setStatus] = useState("inquiry");
  const [notes, setNotes] = useState("");

  // Data queries
  const { data: customers = [] } = useQuery({ queryKey: ["/api/customers"] });
  const { data: venues = [] } = useQuery({ queryKey: ["/api/venues-with-spaces"] });

  // Initialize form with booking data
  useEffect(() => {
    if (booking && open) {
      setEventName(booking.eventName || "");
      setGuestCount(booking.guestCount || 1);
      setStartTime(booking.startTime || "");
      setEndTime(booking.endTime || "");
      setStatus(booking.status || "inquiry");
      setNotes(booking.notes || "");
    }
  }, [booking, open]);

  const selectedCustomer = customers.find((c: any) => c.id === booking?.customerId);
  const selectedVenue = venues.find((v: any) => v.id === booking?.venueId);

  // Update booking mutation
  const updateBooking = useMutation({
    mutationFn: async (bookingData: any) => {
      const response = await apiRequest("PATCH", `/api/bookings/${booking.id}`, bookingData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
      toast({ title: "Event updated successfully!" });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update event", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Delete booking mutation
  const deleteBooking = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/bookings/${booking.id}`, {});
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
      toast({ title: "Event deleted successfully!" });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to delete event", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const handleSave = () => {
    const updates = {
      eventName,
      guestCount,
      startTime,
      endTime,
      status,
      notes
    };

    updateBooking.mutate(updates);
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      deleteBooking.mutate();
    }
  };

  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden" aria-describedby="edit-event-description">
        <DialogTitle className="sr-only">Edit Event</DialogTitle>
        <div id="edit-event-description" className="sr-only">
          Edit event booking details, including name, schedule, guest count, and status.
        </div>
        
        {/* Header */}
        <div className="border-b border-slate-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Edit className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Edit Event</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Event Details Section */}
          <div>
            <h3 className="text-lg font-medium mb-4">Event Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label className="text-base font-medium">Event Name</Label>
                <Input
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label className="text-base font-medium">Guest Count</Label>
                <Input
                  type="number"
                  value={guestCount}
                  onChange={(e) => setGuestCount(parseInt(e.target.value) || 1)}
                  min="1"
                  className="mt-2"
                />
              </div>

              <div>
                <Label className="text-base font-medium">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inquiry">Lead</SelectItem>
                    <SelectItem value="confirmed">Booked</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Schedule Section */}
          <div>
            <h3 className="text-lg font-medium mb-4">Schedule</h3>
            <div className="bg-slate-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium">
                  {booking.eventDate ? format(new Date(booking.eventDate), 'EEEE, MMMM d, yyyy') : 'Date not set'}
                </span>
                <Badge variant="secondary">Fixed Date</Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Start Time</Label>
                  <Select value={startTime} onValueChange={setStartTime}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({length: 24}, (_, i) => {
                        const hour = i.toString().padStart(2, '0');
                        return (
                          <SelectItem key={`${hour}:00`} value={`${hour}:00`}>
                            {i === 0 ? '12:00 AM' : i <= 12 ? `${i}:00 ${i === 12 ? 'PM' : 'AM'}` : `${i-12}:00 PM`}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-sm">End Time</Label>
                  <Select value={endTime} onValueChange={setEndTime}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({length: 24}, (_, i) => {
                        const hour = i.toString().padStart(2, '0');
                        return (
                          <SelectItem key={`${hour}:00`} value={`${hour}:00`}>
                            {i === 0 ? '12:00 AM' : i <= 12 ? `${i}:00 ${i === 12 ? 'PM' : 'AM'}` : `${i-12}:00 PM`}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Venue & Customer Info */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-3">Venue Information</h3>
              <div className="bg-slate-50 p-4 rounded-lg">
                <div className="font-medium">{selectedVenue?.name || 'No venue selected'}</div>
                <div className="text-sm text-slate-600 mt-1">
                  Space: {selectedVenue?.spaces?.[0]?.name || 'Main Hall'}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Capacity: {selectedVenue?.capacity || 'N/A'}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3">Customer Information</h3>
              <div className="bg-slate-50 p-4 rounded-lg">
                <div className="font-medium">{selectedCustomer?.name || 'No customer selected'}</div>
                <div className="text-sm text-slate-600 mt-1">{selectedCustomer?.email || ''}</div>
                <div className="text-xs text-slate-500 mt-1">
                  Phone: {selectedCustomer?.phone || 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div>
            <Label className="text-base font-medium">Notes</Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-2 w-full p-3 border border-slate-200 rounded-lg resize-none h-20 text-sm"
              placeholder="Add any additional notes or requirements..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-6 flex justify-between">
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={deleteBooking.isPending}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {deleteBooking.isPending ? 'Deleting...' : 'Delete Event'}
          </Button>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={updateBooking.isPending || !eventName.trim()}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {updateBooking.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}