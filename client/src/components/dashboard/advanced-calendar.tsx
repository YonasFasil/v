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
  Eye,
  Plus
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

  // Use dashboard context data if available, otherwise fetch directly
  const { data: dashboardData } = useQuery({
    queryKey: ["/api/dashboard/overview"],
    staleTime: 5 * 60 * 1000,
  });

  // Only fetch calendar data if not available from dashboard
  const { data: calendarData, isLoading } = useQuery({
    queryKey: [`/api/calendar/events`, viewMode],
    enabled: !dashboardData?.calendar,
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

  // Add padding days to start with Sunday
  const paddedDays = [];
  const firstDayOfWeek = monthStart.getDay();
  
  // Add previous month's ending days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const paddingDate = new Date(monthStart);
    paddingDate.setDate(paddingDate.getDate() - (i + 1));
    paddedDays.push(paddingDate);
  }
  
  // Add current month days
  paddedDays.push(...calendarDays);
  
  // Add next month's beginning days to complete the grid
  const totalCells = Math.ceil(paddedDays.length / 7) * 7;
  for (let i = paddedDays.length; i < totalCells; i++) {
    const paddingDate = new Date(monthEnd);
    paddingDate.setDate(paddingDate.getDate() + (i - paddedDays.length + 1));
    paddedDays.push(paddingDate);
  }

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
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Minimal Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-light text-slate-900">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={previousMonth}
              className="h-8 w-8 hover:bg-slate-100 rounded-full"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={nextMonth}
              className="h-8 w-8 hover:bg-slate-100 rounded-full"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Clean Mode Toggle */}
        <div className="flex bg-slate-50 rounded-lg p-1">
          <button
            onClick={() => setViewMode('events')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              viewMode === 'events' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Events
          </button>
          <button
            onClick={() => setViewMode('venues')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              viewMode === 'venues' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Venues
          </button>
        </div>
      </div>

      {viewMode === 'events' ? (
        <div>
          {/* Mobile Calendar View */}
          <div className="md:hidden space-y-3">
            {paddedDays.filter(day => {
              const isCurrentMonth = isSameMonth(day, currentDate);
              const dayEvents = getEventsForDay(day);
              return isCurrentMonth && dayEvents.length > 0;
            }).map((day, index) => {
              const dayEvents = getEventsForDay(day);
              const isToday = isSameDay(day, new Date());
              
              return (
                <div key={index} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`text-lg font-semibold ${isToday ? 'text-blue-600' : 'text-slate-900'}`}>
                      {format(day, 'EEEE, MMM d')}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    {dayEvents.map((event, eventIndex) => {
                      const colors = [
                        'bg-blue-50 text-blue-700 border-blue-200',
                        'bg-green-50 text-green-700 border-green-200', 
                        'bg-purple-50 text-purple-700 border-purple-200',
                        'bg-orange-50 text-orange-700 border-orange-200'
                      ];
                      const colorClass = colors[eventIndex % colors.length];
                      
                      return (
                        <div
                          key={event.id}
                          onClick={() => onEventClick?.(event)}
                          className={`p-3 rounded-md cursor-pointer transition-all hover:shadow-sm border ${colorClass}`}
                        >
                          <div className="font-semibold text-sm mb-2">{event.title}</div>
                          <div className="text-xs space-y-1">
                            <div className="flex items-center gap-2">
                              <Clock className="w-3 h-3" />
                              <span>{event.startTime} - {event.endTime}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="w-3 h-3" />
                              <span>{event.guestCount} guests</span>
                              <MapPin className="w-3 h-3 ml-2" />
                              <span>{event.spaceName}</span>
                            </div>
                            <div className="font-medium">{event.customerName}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Calendar View */}
          <div className="hidden md:block space-y-4">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid - Enhanced with Better Event Cards */}
            <div className="grid grid-cols-7 gap-1">
              {paddedDays.map((day, index) => {
                const dayEvents = getEventsForDay(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isToday = isSameDay(day, new Date());
                
                return (
                  <div 
                    key={index} 
                    className={`min-h-[160px] border border-slate-200 rounded-lg p-3 ${
                      isCurrentMonth 
                        ? 'bg-white hover:bg-slate-50' 
                        : 'bg-slate-50/30'
                    } transition-colors`}
                  >
                    {/* Day Number */}
                    <div className={`text-sm font-semibold mb-3 ${
                      isToday 
                        ? 'w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs' 
                        : isCurrentMonth 
                          ? 'text-slate-900' 
                          : 'text-slate-400'
                    }`}>
                      {format(day, 'd')}
                    </div>
                    
                    {/* Enhanced Event Cards */}
                    <div className="space-y-2">
                      {dayEvents.slice(0, 3).map((event, eventIndex) => {
                        const colors = [
                          'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
                          'bg-green-50 text-green-700 border-green-200 hover:bg-green-100', 
                          'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
                          'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100'
                        ];
                        const colorClass = colors[eventIndex % colors.length];
                        
                        return (
                          <div
                            key={event.id}
                            onClick={() => onEventClick?.(event)}
                            className={`text-xs p-2.5 rounded-md cursor-pointer transition-all hover:shadow-md border ${colorClass}`}
                            title={`${event.title} - ${event.customerName} - ${event.startTime}`}
                          >
                            <div className="font-semibold leading-tight mb-1.5 line-clamp-2 text-xs">
                              {event.title}
                            </div>
                            <div className="text-[10px] opacity-80 flex items-center gap-1 mb-1">
                              <Clock className="w-2.5 h-2.5 flex-shrink-0" />
                              <span className="truncate">{event.startTime}</span>
                            </div>
                            <div className="text-[10px] opacity-80 flex items-center gap-1">
                              <Users className="w-2.5 h-2.5 flex-shrink-0" />
                              <span className="truncate">{event.guestCount} guests</span>
                            </div>
                          </div>
                        );
                      })}
                      
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-slate-500 px-2 py-1.5 text-center bg-slate-50 rounded-md border border-slate-200">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Venue Mode */}
          {venueData.map((venue, index) => (
            <Card key={index} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold">{venue.venue.name}</h4>
                <Badge variant="secondary">
                  {venue.bookings.length} booking{venue.bookings.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              
              {venue.spaces.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  {venue.spaces.map((space: any) => (
                    <div key={space.id} className="p-3 bg-slate-50 rounded-lg">
                      <div className="font-medium">{space.name}</div>
                      <div className="text-sm text-slate-600">
                        Capacity: {space.capacity} • ${space.hourlyRate}/hour
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
          
          {/* Recent Bookings */}
          {venueData.some(v => v.bookings.length > 0) && (
            <Card className="p-6">
              <h5 className="text-lg font-semibold mb-4">Recent Bookings</h5>
              <div className="space-y-3">
                {venueData.flatMap(v => v.bookings).slice(0, 5).map((booking: any) => (
                  <div key={booking.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
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
  );
}