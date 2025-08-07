import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Users, 
  MapPin,
  Grid3x3,
  List,
  Eye
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  status: string;
  customerName: string;
  venueName: string;
  spaceName: string;
  guestCount: number;
  totalAmount: string;
  startTime: string;
  endTime: string;
  color: string;
}

interface VenueCalendarData {
  venue: any;
  spaces: any[];
  bookings: any[];
}

interface AdvancedCalendarProps {
  onEventClick?: (event: any) => void;
}

export function AdvancedCalendar({ onEventClick }: AdvancedCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'events' | 'venues'>('events');
  const [calendarView, setCalendarView] = useState<'monthly' | 'weekly'>('monthly');

  // Fetch calendar data based on mode
  const { data: calendarData, isLoading } = useQuery({
    queryKey: [`/api/calendar/events`, viewMode],
    queryFn: async () => {
      const response = await fetch(`/api/calendar/events?mode=${viewMode}`);
      if (!response.ok) throw new Error('Failed to fetch calendar data');
      return response.json();
    }
  });

  const events = calendarData?.mode === 'events' ? calendarData.data as CalendarEvent[] : [];
  const venueData = calendarData?.mode === 'venues' ? calendarData.data as VenueCalendarData[] : [];

  // Calculate calendar days
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get events for a specific day
  const getEventsForDay = (date: Date) => {
    return events.filter(event => 
      isSameDay(new Date(event.start), date)
    );
  };

  // Navigate calendar
  const previousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-6">
      <div className="space-y-4">
        {/* Calendar Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CalendarIcon className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold">Calendar View</h3>
          </div>
          
          {/* Mode Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('events')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'events' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Grid3x3 className="h-4 w-4 mr-1 inline" />
                Events
              </button>
              <button
                onClick={() => setViewMode('venues')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'venues' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <List className="h-4 w-4 mr-1 inline" />
                Venues
              </button>
            </div>
          </div>
        </div>

        {viewMode === 'events' ? (
          <>
            {/* Calendar Navigation */}
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-semibold">
                {format(currentDate, 'MMMM yyyy')}
              </h4>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={previousMonth}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={nextMonth}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Weekday Headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-slate-600">
                  {day}
                </div>
              ))}
              
              {/* Calendar Days */}
              {calendarDays.map((day, index) => {
                const dayEvents = getEventsForDay(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                
                return (
                  <div 
                    key={index}
                    className={`min-h-28 p-2 border border-slate-200 ${
                      isCurrentMonth ? 'bg-white hover:bg-slate-50' : 'bg-slate-50'
                    } transition-colors`}
                  >
                    <div className={`text-sm font-medium mb-1 ${
                      isCurrentMonth ? 'text-slate-900' : 'text-slate-400'
                    }`}>
                      {format(day, 'd')}
                    </div>
                    
                    {/* Events for this day */}
                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map((event) => (
                        <div
                          key={event.id}
                          className="text-xs p-2 rounded-md text-white cursor-pointer hover:shadow-md transition-all duration-200 border border-white/20"
                          style={{ backgroundColor: event.color }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick?.(event);
                          }}
                        >
                          <div className="font-medium truncate mb-1">{event.title}</div>
                          <div className="flex items-center justify-between opacity-90">
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              <span>{event.guestCount}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{event.startTime}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-slate-500 text-center py-1 bg-slate-100 rounded">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Today's Events Detail */}
            {events.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold mb-3">Upcoming Events</h4>
                <div className="space-y-3">
                  {events.slice(0, 5).map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: event.color }}
                          />
                          <span className="font-medium">{event.title}</span>
                          <Badge variant="secondary" className="text-xs">
                            {event.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-slate-600 space-y-1">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {event.startTime} - {event.endTime}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {event.guestCount} guests
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.venueName}
                            </span>
                          </div>
                          <div>Customer: {event.customerName}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">
                          ${parseFloat(event.totalAmount).toLocaleString()}
                        </div>
                        <Button variant="ghost" size="sm" className="mt-1">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          // Venue Mode - Table-style calendar with venues vertically and dates horizontally
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Venues Schedule</h4>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={previousMonth}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium">
                  {format(currentDate, 'MMMM yyyy')}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={nextMonth}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {venueData.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p>No venues found.</p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    {/* Header with dates */}
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="sticky left-0 bg-slate-50 border-r border-slate-200 p-3 text-left font-semibold text-slate-700 min-w-[180px] z-10">
                          Venues
                        </th>
                        {calendarDays.slice(0, 31).map((day, index) => (
                          <th key={index} className="border-r border-slate-200 p-2 text-center min-w-[100px]">
                            <div className="text-sm font-medium text-slate-600">
                              {format(day, 'EEE')}
                            </div>
                            <div className="text-lg font-bold text-slate-900">
                              {format(day, 'd')}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    
                    {/* Venue rows */}
                    <tbody>
                      {venueData.map((venueItem) => (
                        <tr key={venueItem.venue.id} className="border-b border-slate-200 hover:bg-slate-25">
                          <td className="sticky left-0 bg-white border-r border-slate-200 p-3">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-slate-400" />
                              <div>
                                <div className="font-medium text-slate-900">{venueItem.venue.name}</div>
                                <div className="text-xs text-slate-500">
                                  Cap {venueItem.venue.capacity}
                                </div>
                              </div>
                            </div>
                          </td>
                          
                          {/* Date cells for this venue */}
                          {calendarDays.slice(0, 31).map((day, dayIndex) => {
                            const dayBookings = venueItem.bookings.filter((booking: any) => 
                              isSameDay(new Date(booking.eventDate), day)
                            );
                            
                            return (
                              <td key={dayIndex} className="border-r border-slate-200 p-1 align-top min-h-[80px] relative">
                                <div className="h-20 relative">
                                  {dayBookings.map((booking: any, bookingIndex: number) => {
                                    // Calculate position based on start time (assuming 12 PM - 10 PM range)
                                    const parseTime = (timeStr: string) => {
                                      const [hours, minutes] = timeStr.split(':').map(Number);
                                      return hours * 60 + minutes;
                                    };
                                    
                                    const startMinutes = parseTime(booking.startTime);
                                    const endMinutes = parseTime(booking.endTime);
                                    const dayStart = 12 * 60; // 12 PM
                                    const dayEnd = 22 * 60; // 10 PM
                                    
                                    // Convert to percentage position within the day
                                    const startPos = Math.max(0, Math.min(100, ((startMinutes - dayStart) / (dayEnd - dayStart)) * 100));
                                    const endPos = Math.max(0, Math.min(100, ((endMinutes - dayStart) / (dayEnd - dayStart)) * 100));
                                    const width = Math.max(5, endPos - startPos); // Minimum 5% width
                                    
                                    return (
                                      <div
                                        key={booking.id}
                                        className="absolute rounded text-xs p-1 text-white cursor-pointer hover:opacity-80 shadow-sm"
                                        style={{
                                          left: `${startPos}%`,
                                          width: `${width}%`,
                                          top: `${bookingIndex * 22}px`,
                                          height: '18px',
                                          backgroundColor: booking.status === 'confirmed' ? '#f59e0b' : 
                                                         booking.status === 'pending' ? '#6b7280' : '#ef4444',
                                          zIndex: 10
                                        }}
                                        title={`${booking.eventName} - ${booking.customerName}`}
                                      >
                                        <div className="font-medium truncate">{booking.eventName}</div>
                                        <div className="text-xs opacity-90">#{booking.id.slice(-4)}</div>
                                      </div>
                                    );
                                  })}
                                  
                                  {/* Time grid lines */}
                                  {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((pos, i) => (
                                    <div
                                      key={i}
                                      className="absolute top-0 bottom-0 border-l border-slate-100"
                                      style={{ left: `${pos}%` }}
                                    />
                                  ))}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Booking Details Below */}
            {venueData.some(v => v.bookings.length > 0) && (
              <Card className="p-4">
                <h5 className="font-semibold mb-3">Recent Bookings</h5>
                <div className="space-y-2">
                  {venueData.flatMap(v => v.bookings).slice(0, 5).map((booking: any) => (
                    <div key={booking.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                      <div className="flex-1">
                        <div className="font-medium">{booking.eventName}</div>
                        <div className="text-sm text-slate-600">
                          {booking.venueName} • {booking.customerName} • {booking.guestCount} guests
                        </div>
                        <div className="text-xs text-slate-500">
                          {format(new Date(booking.eventDate), 'MMM d, yyyy')} • {booking.startTime} - {booking.endTime}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={booking.status === 'confirmed' ? 'default' : 'secondary'}
                          className="mb-1"
                        >
                          {booking.status}
                        </Badge>
                        <div className="text-sm font-medium">
                          ${parseFloat(booking.totalAmount || '0').toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}