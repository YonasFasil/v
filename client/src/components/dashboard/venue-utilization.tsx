import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Calendar, TrendingUp } from "lucide-react";

export function VenueUtilization() {
  const { data: venues } = useQuery({ queryKey: ["/api/venues-with-spaces"] });
  const { data: bookings } = useQuery({ queryKey: ["/api/bookings"] });

  // Calculate utilization for each venue
  const getVenueUtilization = () => {
    if (!venues || !bookings || !Array.isArray(venues) || !Array.isArray(bookings)) return [];
    
    return (venues as any[]).map(venue => {
      const venueBookings = (bookings as any[]).filter(booking => 
        booking.venueId === venue.id && booking.status === 'confirmed'
      );
      
      // Calculate utilization percentage (simplified)
      const totalSpaces = venue.spaces?.length || 1;
      const utilization = Math.min((venueBookings.length / totalSpaces) * 100, 100);
      
      return {
        name: venue.name,
        utilization: Math.round(utilization),
        bookings: venueBookings.length,
        spaces: totalSpaces,
        revenue: venueBookings.reduce((sum: number, booking: any) => 
          sum + (parseFloat(booking.totalAmount) || 0), 0
        )
      };
    });
  };

  const venueData = getVenueUtilization();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          Venue Utilization
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {venueData.length === 0 ? (
          <div className="text-center py-6 text-slate-500">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No venue data available</p>
          </div>
        ) : (
          venueData.map((venue, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-700">{venue.name}</span>
                <span className="text-sm text-slate-500">{venue.utilization}%</span>
              </div>
              <Progress value={venue.utilization} className="h-2" />
              <div className="flex justify-between text-xs text-slate-500">
                <span>{venue.bookings} bookings</span>
                <span>${venue.revenue.toLocaleString()}</span>
              </div>
            </div>
          ))
        )}
        
        {venueData.length > 0 && (
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2 text-sm text-green-600">
              <TrendingUp className="w-4 h-4" />
              <span>Average utilization: {Math.round(venueData.reduce((sum, v) => sum + v.utilization, 0) / venueData.length)}%</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}