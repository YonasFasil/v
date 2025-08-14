import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBookings } from "@/hooks/use-bookings";
import { Calendar, Clock, MapPin, Users, DollarSign, Eye } from "lucide-react";
import { format } from "date-fns";
import { getStatusConfig } from "@shared/status-utils";

export function RecentBookings() {
  const { data: bookings, isLoading } = useBookings();

  const getStatusColor = (status: string) => {
    // Use the centralized status utils for consistent coloring
    return getStatusConfig(status).bgColor + " " + getStatusConfig(status).textColor;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Bookings</CardTitle>
            <Button variant="ghost" className="text-blue-600 hover:text-blue-700">
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-9 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const recentBookings = bookings?.slice(0, 5) || [];

  return (
    <Card className="border border-slate-200 bg-white">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-slate-900">
              Recent Bookings
            </CardTitle>
            <p className="text-sm text-slate-600 mt-1">Latest booking activity</p>
          </div>
          <Button variant="ghost" className="text-slate-700 hover:text-slate-900 hover:bg-slate-50 text-sm font-medium">
            <Eye className="w-4 h-4 mr-2" />
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {recentBookings.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-6 h-6 text-slate-500" />
            </div>
            <p className="text-base font-medium text-slate-700 mb-2">No recent bookings</p>
            <p className="text-sm text-slate-500">New bookings will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentBookings.map((booking, index) => {
              const statusConfig = getStatusConfig(booking.status);
              return (
                <div 
                  key={booking.id} 
                  className="bg-white border border-slate-200 hover:bg-slate-50 transition-colors duration-200 p-4 rounded-lg"
                >
                  {/* Status indicator */}
                  <div 
                    className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full"
                    style={{ backgroundColor: statusConfig.color }}
                  />
                  
                  <div className="pl-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-900 mb-1">
                          {booking.eventName}
                        </h4>
                        <p className="text-sm text-slate-600 capitalize">{booking.eventType}</p>
                      </div>
                      <Badge 
                        className="ml-4 text-xs border"
                        style={{ 
                          backgroundColor: statusConfig.color + '15',
                          color: statusConfig.color,
                          borderColor: statusConfig.color + '30'
                        }}
                      >
                        {statusConfig.label}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="flex items-center text-sm">
                        <Calendar className="w-4 h-4 text-slate-600 mr-2 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-slate-800">
                            {booking.eventDate ? format(new Date(booking.eventDate), "MMM dd") : "TBD"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {booking.eventDate ? format(new Date(booking.eventDate), "yyyy") : ""}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center text-sm">
                        <Clock className="w-4 h-4 text-slate-600 mr-2 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-slate-800">{booking.startTime}</p>
                          <p className="text-xs text-slate-500">to {booking.endTime}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center text-sm">
                        <Users className="w-4 h-4 text-slate-600 mr-2 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-slate-800">{booking.guestCount}</p>
                          <p className="text-xs text-slate-500">guests</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center text-sm">
                        <DollarSign className="w-4 h-4 text-slate-600 mr-2 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-slate-800">
                            {booking.totalAmount ? `$${parseFloat(booking.totalAmount).toLocaleString()}` : "TBD"}
                          </p>
                          <p className="text-xs text-slate-500">total</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
