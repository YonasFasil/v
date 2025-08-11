import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, Users, MapPin, ArrowRight } from "lucide-react";
import { format, parseISO, isToday, isTomorrow, addDays } from "date-fns";
import { getStatusConfig } from "@shared/status-utils";

export function UpcomingEvents() {
  const { data: bookings } = useQuery({ queryKey: ["/api/bookings"] });

  // Get upcoming events for the next 7 days
  const getUpcomingEvents = () => {
    if (!bookings || !Array.isArray(bookings)) return [];
    
    const now = new Date();
    const nextWeek = addDays(now, 7);
    
    return (bookings as any[])
      .filter(booking => {
        try {
          if (booking.status === 'cancelled' || !booking.date) return false;
          const eventDate = parseISO(booking.date);
          return eventDate >= now && eventDate <= nextWeek;
        } catch {
          return false;
        }
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5); // Show only next 5 events
  };

  const upcomingEvents = getUpcomingEvents();

  const getDateLabel = (dateString: string) => {
    try {
      if (!dateString) return "TBD";
      const date = parseISO(dateString);
      if (isToday(date)) return "Today";
      if (isTomorrow(date)) return "Tomorrow";
      return format(date, "MMM d");
    } catch {
      return "Invalid Date";
    }
  };

  const getStatusColor = (status: string) => {
    // Use the centralized status utils for consistent coloring
    return getStatusConfig(status).bgColor + " " + getStatusConfig(status).textColor;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            Upcoming Events
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => window.location.href = '/events'}>
            View All
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {upcomingEvents.length === 0 ? (
          <div className="text-center py-6 text-slate-500">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No upcoming events</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => window.location.href = '/events'}
            >
              Create Event
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingEvents.map((event, index) => (
              <div key={index} className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-slate-900 text-sm">{event.eventName}</h4>
                  <Badge className={`text-xs ${getStatusConfig(event.status).bgColor} ${getStatusConfig(event.status).textColor} ${getStatusConfig(event.status).borderColor} border`}>
                    {getStatusConfig(event.status).label}
                  </Badge>
                </div>
                
                <div className="space-y-1 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    <span>{getDateLabel(event.date)}</span>
                    <Clock className="w-3 h-3 ml-2" />
                    <span>{event.startTime} - {event.endTime}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Users className="w-3 h-3" />
                    <span>{event.guestCount} guests</span>
                    <MapPin className="w-3 h-3 ml-2" />
                    <span>{event.spaceName || 'TBD'}</span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-medium text-slate-700">{event.customerName}</span>
                    <span className="font-medium text-green-600">${parseFloat(event.totalAmount || '0').toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}