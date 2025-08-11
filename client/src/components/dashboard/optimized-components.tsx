import { useDashboardData } from "@/contexts/dashboard-context";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, Users } from "lucide-react";

// All components use shared context data - no individual API calls
export function OptimizedRecentBookings() {
  const { upcomingBookings } = useDashboardData();

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Bookings</h2>
        <div className="space-y-4">
          {upcomingBookings.slice(0, 5).map((booking: any) => (
            <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 cursor-pointer">
              <div className="flex-1">
                <h3 className="font-medium">{booking.customerName}</h3>
                <p className="text-sm text-slate-500">
                  {booking.eventType} • {booking.venue}
                </p>
                <p className="text-xs text-slate-400">
                  {new Date(booking.eventDate).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">${(booking.totalAmount || 0).toLocaleString()}</p>
                <Badge variant={
                  booking.status === 'confirmed' ? 'default' :
                  booking.status === 'pending' ? 'secondary' : 'outline'
                }>
                  {booking.status}
                </Badge>
              </div>
            </div>
          ))}
          {upcomingBookings.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p>No upcoming bookings</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function OptimizedActiveLeads() {
  const { activeLeads } = useDashboardData();

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold mb-4">Active Leads</h2>
        <div className="space-y-3">
          {activeLeads.slice(0, 5).map((lead: any) => (
            <div key={lead.id} className="p-3 border rounded-lg">
              <h3 className="font-medium text-sm">
                {lead.firstName} {lead.lastName}
              </h3>
              <p className="text-xs text-slate-500">
                {lead.eventType} • {lead.guestCount} guests
              </p>
              <Badge variant="outline" className="mt-1 text-xs">
                {lead.status}
              </Badge>
            </div>
          ))}
          {activeLeads.length === 0 && (
            <div className="text-center py-4 text-slate-500">
              <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">No active leads</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function OptimizedRecentPayments() {
  const { recentPayments } = useDashboardData();

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Payments</h2>
        <div className="space-y-3">
          {recentPayments.slice(0, 3).map((payment: any) => (
            <div key={payment.id} className="flex justify-between items-center p-2 border rounded">
              <div>
                <p className="font-medium text-sm">${payment.amount}</p>
                <p className="text-xs text-slate-500">{payment.method}</p>
              </div>
              <Badge variant="outline" className="text-xs">
                {payment.status}
              </Badge>
            </div>
          ))}
          {recentPayments.length === 0 && (
            <div className="text-center py-4 text-slate-500">
              <DollarSign className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">No recent payments</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}