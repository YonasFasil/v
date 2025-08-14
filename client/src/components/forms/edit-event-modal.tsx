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
import { getStatusConfig, type EventStatus } from "@shared/status-utils";
import { StatusSelector } from "../events/status-selector";

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
  const { data: existingBookings = [] } = useQuery({ queryKey: ["/api/bookings"] });

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

  // Function to check space availability for a specific date and time (excluding current booking)
  const getSpaceAvailability = (spaceId: string, date: Date, startTime: string, endTime: string) => {
    console.log('🔍 EDIT MODAL CONFLICT CHECK:', {
      spaceId,
      date: date.toDateString(),
      startTime,
      endTime,
      totalBookings: existingBookings.length,
      currentBookingId: booking?.id
    });
    
    if (!spaceId || !(existingBookings as any[])?.length) {
      console.log('❌ No space ID or no existing bookings');
      return { available: true, conflictingBooking: null };
    }
    
    const conflicts = (existingBookings as any[]).filter(existingBooking => {
      console.log('📋 Checking booking:', {
        id: existingBooking.id,
        status: existingBooking.status,
        spaceId: existingBooking.spaceId,
        eventDate: existingBooking.eventDate,
        startTime: existingBooking.startTime,
        endTime: existingBooking.endTime
      });
      
      // Exclude the current booking being edited
      if (existingBooking.id === booking.id) {
        console.log('⏭️ Skipping current booking');
        return false;
      }
      if (existingBooking.status === 'cancelled') {
        console.log('⏭️ Skipping cancelled booking');
        return false;
      }
      if (existingBooking.spaceId !== spaceId) {
        console.log('⏭️ Different space, skipping');
        return false;
      }
      
      const bookingDate = new Date(existingBooking.eventDate);
      if (bookingDate.toDateString() !== date.toDateString()) {
        console.log('⏭️ Different date, skipping');
        return false;
      }

      // Parse times - handle both 24hr format and 12hr format
      const parseTime = (timeStr: string) => {
        if (!timeStr) return 0;
        
        if (timeStr.includes('AM') || timeStr.includes('PM')) {
          // 12-hour format (like "09:00 AM", "05:00 PM")
          const [time, period] = timeStr.split(' ');
          const [hours, minutes] = time.split(':').map(Number);
          let hour24 = hours;
          if (period === 'PM' && hours !== 12) hour24 += 12;
          if (period === 'AM' && hours === 12) hour24 = 0;
          return hour24 + (minutes || 0) / 60;
        } else {
          // 24-hour format (like "09:00", "17:00")
          const [hours, minutes] = timeStr.split(':').map(Number);
          return hours + (minutes || 0) / 60;
        }
      };

      const newStart = parseTime(startTime);
      const newEnd = parseTime(endTime);
      const existingStart = parseTime(existingBooking.startTime);
      const existingEnd = parseTime(existingBooking.endTime);

      const overlaps = (newStart < existingEnd && newEnd > existingStart);
      
      console.log('⏰ Time overlap check:', {
        newTime: `${startTime}(${newStart}) - ${endTime}(${newEnd})`,
        existingTime: `${existingBooking.startTime}(${existingStart}) - ${existingBooking.endTime}(${existingEnd})`,
        overlaps
      });

      // Check for time overlap
      return overlaps;
    });
    
    console.log('🎯 FINAL RESULT:', {
      conflictsFound: conflicts.length,
      available: conflicts.length === 0,
      conflictingBooking: conflicts[0]
    });
    
    return {
      available: conflicts.length === 0,
      conflictingBooking: conflicts[0] || null
    };
  };

  // Update booking mutation
  const updateBooking = useMutation({
    mutationFn: async (bookingData: any) => {
      const response = await apiRequest("PATCH", `/api/bookings/${booking.id}`, bookingData);
      return response;
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
    // Check for conflicts before saving
    if (booking.spaceId && booking.eventDate) {
      const availability = getSpaceAvailability(
        booking.spaceId,
        new Date(booking.eventDate),
        startTime,
        endTime
      );

      if (!availability.available && availability.conflictingBooking) {
        const conflict = availability.conflictingBooking;
        const blockingStatuses = ['confirmed_deposit_paid', 'confirmed_fully_paid'];
        
        if (blockingStatuses.includes(conflict.status)) {
          const statusLabel = getStatusConfig(conflict.status).label;
          toast({
            title: "❌ Cannot Save - Booking Conflict",
            description: `Cannot save changes due to confirmed paid booking conflict. "${conflict.eventName}" (${conflict.startTime} - ${conflict.endTime}, Status: ${statusLabel}) has confirmed payment and cannot be overbooked.`,
            variant: "destructive",
            duration: 10000
          });
          return; // Block the save
        } else {
          // Warning for tentative bookings - allow save but warn
          const statusLabel = getStatusConfig(conflict.status).label;
          toast({
            title: "⚠️ Time Overlap Warning",
            description: `This time overlaps with "${conflict.eventName}" (${conflict.startTime} - ${conflict.endTime}, Status: ${statusLabel}). Since it's not confirmed, both bookings can coexist.`,
            variant: "default",
            duration: 6000
          });
          // Continue with save for tentative bookings
        }
      }
    }

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

  // Helper function to check for blocking conflicts
  const hasBlockingConflicts = () => {
    if (!booking.spaceId || !booking.eventDate || !startTime || !endTime) return false;
    
    const availability = getSpaceAvailability(
      booking.spaceId,
      new Date(booking.eventDate),
      startTime,
      endTime
    );

    if (!availability.available && availability.conflictingBooking) {
      const blockingStatuses = ['confirmed_deposit_paid', 'confirmed_fully_paid'];
      return blockingStatuses.includes(availability.conflictingBooking.status);
    }
    return false;
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
                <div className="mt-2">
                  <StatusSelector
                    currentStatus={status as EventStatus}
                    onStatusChange={(newStatus) => setStatus(newStatus)}
                    eventId={booking?.id}
                    eventTitle={eventName}
                    cancellationReason={booking?.cancellationReason}
                  />
                </div>
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

              {/* Real-time availability and conflict detection */}
              {booking.spaceId && booking.eventDate && startTime && endTime && (() => {
                const availability = getSpaceAvailability(
                  booking.spaceId,
                  new Date(booking.eventDate),
                  startTime,
                  endTime
                );

                if (availability.available) {
                  return (
                    <div className="mt-3 p-3 rounded-lg border bg-green-50 border-green-200">
                      <div className="flex items-center gap-2 text-sm font-medium text-green-800">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        ✅ Time Slot Available
                      </div>
                      <div className="mt-1 text-sm text-green-700">
                        No conflicts detected for the selected time
                      </div>
                    </div>
                  );
                } else if (availability.conflictingBooking) {
                  const conflict = availability.conflictingBooking;
                  const statusConfig = getStatusConfig(conflict.status);
                  const blockingStatuses = ['confirmed_deposit_paid', 'confirmed_fully_paid'];
                  const isBlocking = blockingStatuses.includes(conflict.status);

                  return (
                    <div className={`mt-3 p-4 rounded-lg border-2 ${isBlocking ? 'bg-red-50 border-red-300' : 'bg-yellow-50 border-yellow-300'}`}>
                      <div className={`flex items-center gap-2 text-base font-semibold ${isBlocking ? 'text-red-800' : 'text-yellow-800'}`}>
                        <div className={`w-3 h-3 rounded-full ${isBlocking ? 'bg-red-500' : 'bg-yellow-500'}`} />
                        {isBlocking ? '❌ BLOCKING CONFLICT' : '⚠️ TIME OVERLAP WARNING'}
                      </div>
                      <div className={`mt-2 text-sm ${isBlocking ? 'text-red-700' : 'text-yellow-700'}`}>
                        <div className="font-medium">Conflicting Event:</div>
                        <div className="mt-1">
                          <strong>"{conflict.eventName}"</strong>
                          <br />
                          📅 {conflict.startTime} - {conflict.endTime}
                          <br />
                          <span className="inline-flex items-center gap-1 mt-1">
                            <div 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: statusConfig.color }}
                            />
                            <strong>Status: {statusConfig.label}</strong>
                          </span>
                        </div>
                      </div>
                      {isBlocking ? (
                        <div className="mt-3 p-2 bg-red-100 border border-red-300 rounded text-sm text-red-800 font-medium">
                          🚫 Cannot save changes - This booking has confirmed payment and cannot be overbooked
                        </div>
                      ) : (
                        <div className="mt-3 p-2 bg-yellow-100 border border-yellow-300 rounded text-sm text-yellow-800">
                          ℹ️ Both bookings can coexist since the conflicting booking isn't confirmed with payment
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              })()}
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
              disabled={updateBooking.isPending || !eventName.trim() || hasBlockingConflicts()}
              className={`flex items-center gap-2 ${hasBlockingConflicts() ? 'bg-red-600 hover:bg-red-700' : ''}`}
            >
              <Save className="h-4 w-4" />
              {updateBooking.isPending 
                ? 'Saving...' 
                : hasBlockingConflicts() 
                  ? '❌ Conflicts Detected' 
                  : 'Save Changes'
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}