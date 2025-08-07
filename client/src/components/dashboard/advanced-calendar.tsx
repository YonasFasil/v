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

export function AdvancedCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'events' | 'venues'>('events');
  const [calendarView, setCalendarView] = useState<'monthly' | 'weekly'>('monthly');

  // Fetch calendar data based on mode
  const { data: calendarData, isLoading } = useQuery({
    queryKey: [`/api/calendar/events?mode=${viewMode}`],
    select: (data: any) => data
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
                    className={`min-h-24 p-1 border border-slate-200 ${
                      isCurrentMonth ? 'bg-white' : 'bg-slate-50'
                    }`}
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
                          className="text-xs p-1 rounded text-white truncate cursor-pointer hover:opacity-80"
                          style={{ backgroundColor: event.color }}
                          title={`${event.title} - ${event.customerName}`}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-slate-500 pl-1">
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
          // Venue Mode
          <div className="space-y-6">
            <h4 className="font-semibold">Bookings by Venue</h4>
            
            {venueData.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p>No venue bookings found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {venueData.map((venueItem) => (
                  <Card key={venueItem.venue.id} className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h5 className="font-semibold">{venueItem.venue.name}</h5>
                        <p className="text-sm text-slate-600">
                          {venueItem.spaces.length} spaces • {venueItem.bookings.length} bookings
                        </p>
                      </div>
                      <div className="text-sm text-slate-500">
                        Capacity: {venueItem.venue.capacity}
                      </div>
                    </div>
                    
                    {/* Venue Bookings */}
                    {venueItem.bookings.length > 0 ? (
                      <div className="space-y-2">
                        {venueItem.bookings.map((booking: any) => (
                          <div key={booking.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                            <div className="flex-1">
                              <div className="font-medium">{booking.eventName}</div>
                              <div className="text-sm text-slate-600">
                                {booking.spaceName} • {booking.customerName} • {booking.guestCount} guests
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
                    ) : (
                      <div className="text-center py-4 text-slate-400">
                        No bookings for this venue
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}