import { useState, useEffect } from "react";
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
                Spaces
              </button>
            </div>
          </div>
        </div>

        {viewMode === 'events' ? (
          <>
            {/* Calendar Navigation */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4">
              <h4 className="text-lg sm:text-xl font-semibold">
                {format(currentDate, 'MMMM yyyy')}
              </h4>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={previousMonth}
                  className="px-3 py-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-slate-500 px-3">Navigate</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={nextMonth}
                  className="px-3 py-2"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-px sm:gap-1 bg-slate-200 sm:bg-transparent border sm:border-0 border-slate-200 rounded-lg sm:rounded-none overflow-hidden sm:overflow-visible">
              {/* Weekday Headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-1 sm:p-2 text-center text-xs sm:text-sm font-medium text-slate-600 bg-slate-100 sm:bg-transparent">
                  <span className="hidden xs:inline sm:inline">{day}</span>
                  <span className="xs:hidden sm:hidden">{day.substring(0, 1)}</span>
                </div>
              ))}
              
              {/* Calendar Days */}
              {calendarDays.map((day, index) => {
                const dayEvents = getEventsForDay(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                
                return (
                  <div 
                    key={index}
                    className={`min-h-36 sm:min-h-32 md:min-h-28 p-1 sm:p-2 border-0 sm:border border-slate-200 ${
                      isCurrentMonth ? 'bg-white hover:bg-slate-50' : 'bg-slate-50'
                    } transition-colors relative`}
                  >
                    <div className={`text-sm sm:text-base font-bold mb-1 sm:mb-2 ${
                      isCurrentMonth ? 'text-slate-900' : 'text-slate-400'
                    } ${isSameDay(day, new Date()) ? 'text-blue-600 bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center text-xs sm:text-sm' : ''}`}>
                      {format(day, 'd')}
                    </div>
                    
                    {/* Events for this day */}
                    <div className="space-y-0.5 sm:space-y-1">
                      {dayEvents.slice(0, 1).map((event) => (
                        <div
                          key={event.id}
                          className="text-xs p-2 sm:p-2 rounded-lg text-white cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-300 border border-white/30 shadow-md"
                          style={{ 
                            backgroundColor: event.color,
                            minHeight: '60px'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick?.(event);
                          }}
                        >
                          <div className="font-semibold truncate mb-1 text-sm leading-tight">{event.title}</div>
                          <div className="flex items-center justify-between opacity-95 text-xs">
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3 flex-shrink-0" />
                              <span className="font-medium">{event.guestCount}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 flex-shrink-0" />
                              <span className="font-medium text-xs">{event.startTime}</span>
                            </div>
                          </div>
                          <div className="mt-1 text-xs opacity-90 truncate">
                            {event.customerName}
                          </div>
                        </div>
                      ))}
                      {dayEvents.length > 1 && (
                        <div className="text-[10px] sm:text-xs text-slate-500 text-center py-0.5 sm:py-1 bg-slate-100 dark:bg-slate-600 rounded cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-500"
                             onClick={(e) => {
                               e.stopPropagation();
                               // Show all events for this day
                               console.log('Show more events for day:', format(day, 'MMM dd'));
                             }}>
                          +{dayEvents.length - 1} more - tap to view
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
          // Spaces Mode - Show spaces with events stacked by date
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
              <h4 className="text-lg sm:text-xl font-semibold">Spaces Schedule</h4>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={previousMonth}
                  className="px-3 py-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-base sm:text-lg font-semibold px-3">
                  {format(currentDate, 'MMMM yyyy')}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={nextMonth}
                  className="px-3 py-2"
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
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <div className="grid grid-cols-[250px_repeat(31,120px)] min-w-max">
                    {/* Header row - dates */}
                    <div className="bg-gray-50 p-3 border-b border-gray-200 font-semibold text-gray-700 sticky left-0 z-10">
                      Space
                    </div>
                    {calendarDays.slice(0, 31).map((day, index) => {
                      const isToday = isSameDay(day, new Date());
                      const isCurrentMonth = isSameMonth(day, currentDate);
                      
                      return (
                        <div 
                          key={index} 
                          className={`bg-gray-50 p-2 border-b border-r border-gray-200 text-center text-xs ${
                            isToday ? 'bg-blue-100' : ''
                          }`}
                        >
                          <div className={`font-medium ${
                            isCurrentMonth ? 'text-gray-600' : 'text-gray-400'
                          }`}>
                            {format(day, 'EEE')}
                          </div>
                          <div className={`text-sm font-semibold ${
                            isToday ? 'text-blue-600' : 
                            isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                          }`}>
                            {format(day, 'd')}
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Space rows and event cells */}
                    {venueData.map((venueItem) => 
                      venueItem.venue.spaces ? venueItem.venue.spaces.map((space: any) => {
                        // Create the row for each space
                        const rowItems = [];
                        
                        // Space name cell
                        rowItems.push(
                          <div key={`${space.id}-name`} className="p-3 border-b border-gray-200 font-medium text-gray-900 bg-white sticky left-0 z-10">
                            {venueItem.venue.name} - {space.name}
                          </div>
                        );
                        
                        // Date cells for this space
                        calendarDays.slice(0, 31).forEach((day, dayIndex) => {
                          const isToday = isSameDay(day, new Date());
                          const isCurrentMonth = isSameMonth(day, currentDate);
                          
                          const dayBookings = venueItem.bookings.filter((booking: any) => 
                            booking.spaceId === space.id && booking.eventDate && isSameDay(new Date(booking.eventDate), day)
                          );
                          
                          // Sort bookings by start time (earliest first)
                          const sortedBookings = dayBookings.sort((a, b) => {
                            const parseTime = (timeStr: string) => {
                              const [hours, minutes] = timeStr.split(':').map(Number);
                              return hours * 60 + minutes;
                            };
                            return parseTime(a.startTime) - parseTime(b.startTime);
                          });
                          
                          rowItems.push(
                            <div 
                              key={`${space.id}-${dayIndex}`}
                              className={`p-1 border-b border-r border-gray-200 min-h-[60px] ${
                                isToday ? 'bg-blue-50/30' : 
                                !isCurrentMonth ? 'bg-gray-50' : 'bg-white'
                              }`}
                            >
                              <div className="space-y-1">
                                {sortedBookings.map((booking: any) => (
                                  <div
                                    key={booking.id}
                                    className={`border-l-2 p-1 text-xs rounded cursor-pointer hover:opacity-80 transition-colors ${
                                      booking.contractId 
                                        ? 'bg-purple-100 border-purple-500 text-purple-800' 
                                        : 'bg-blue-100 border-blue-500 text-blue-800'
                                    }`}
                                    onClick={() => onEventClick?.(booking)}
                                  >
                                    <div className="text-gray-600 mb-1">
                                      {booking.eventDate ? format(new Date(booking.eventDate), 'MMM d, yyyy') : 'Date TBD'}
                                    </div>
                                    <div className="font-semibold text-blue-800">
                                      {space.name} @ {booking.startTime}
                                    </div>
                                    <div className="text-gray-700 truncate">
                                      {booking.eventName}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        });
                        
                        return rowItems;
                      }).flat() : []
                    )}
                  </div>
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
                          {booking.eventDate ? format(new Date(booking.eventDate), 'MMM d, yyyy') : 'Date TBD'} • {booking.startTime} - {booking.endTime}
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