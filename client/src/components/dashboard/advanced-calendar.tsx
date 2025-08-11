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
import { getStatusConfig, getAllStatuses, type EventStatus } from "@shared/status-utils";

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

  // Generate calendar grid - completely rewritten to avoid duplicates
  const monthStart = startOfMonth(currentDate);
  const firstDayOfWeek = monthStart.getDay(); // 0 = Sunday
  
  // Start from the first day of the calendar week (could be previous month)
  const calendarStart = new Date(monthStart);
  calendarStart.setDate(monthStart.getDate() - firstDayOfWeek);
  
  // Generate exactly 42 consecutive days starting from calendar start
  const paddedDays = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + i);
    paddedDays.push(date);
  }

  // Get events for a specific day
  const getEventsForDay = (date: Date) => {
    const filteredEvents = events.filter(event => 
      isSameDay(new Date(event.start), date)
    );
    // Debug logging to help identify duplicate event issues
    if (filteredEvents.length > 0) {
      console.log(`Events for ${format(date, 'yyyy-MM-dd')}:`, filteredEvents.map(e => ({
        id: e.id,
        title: e.title,
        guestCount: e.guestCount,
        status: e.status
      })));
    }
    return filteredEvents;
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
                      const statusConfig = getStatusConfig(event.status as EventStatus);
                      const statusClasses = `${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor} hover:opacity-90`;
                      
                      return (
                        <div
                          key={event.id}
                          onClick={() => onEventClick?.(event)}
                          className={`p-3 rounded-md cursor-pointer transition-all hover:shadow-sm border ${statusClasses}`}
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
                        const statusConfig = getStatusConfig(event.status as EventStatus);
                        const statusClasses = `${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor} hover:opacity-90`;
                        
                        return (
                          <div
                            key={event.id}
                            onClick={() => onEventClick?.(event)}
                            className={`text-xs p-2.5 rounded-md cursor-pointer transition-all hover:shadow-md border ${statusClasses}`}
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
          {/* Status Legend */}
          <div className="mt-6 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-slate-700">Status Legend</h4>
              <div className="text-xs text-slate-500">Hover for details</div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {getAllStatuses().map((status) => {
                const config = getStatusConfig(status.value);
                return (
                  <div 
                    key={status.value} 
                    className="group relative"
                    title={`${config.label}: ${config.description}`}
                  >
                    <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all duration-200 cursor-help">
                      <div 
                        className={`w-3 h-3 rounded-full border border-white shadow-sm`}
                        style={{ backgroundColor: config.color }}
                      />
                      <span className="text-xs font-medium text-slate-700 whitespace-nowrap">
                        {config.label}
                      </span>
                    </div>
                    
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap">
                      {config.description}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
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