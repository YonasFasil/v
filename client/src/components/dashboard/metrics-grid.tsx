import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, Users, BarChart3, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useFormattedCurrency } from "@/lib/currency";
import { type Booking, type Venue, type Customer } from "@shared/schema";

export function MetricsGrid() {
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const { formatAmount } = useFormattedCurrency();
  
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
  });

  const { data: bookings = [] } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: venues = [] } = useQuery<Venue[]>({
    queryKey: ["/api/venues"],
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["/api/payments"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const renderDetailModal = () => {
    if (!selectedMetric) return null;

    const modalContent = {
      bookings: {
        title: "Booking Details",
        data: bookings,
        render: (bookings: any[]) => (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-700">{bookings.filter(b => b.status === 'confirmed').length}</div>
                <div className="text-sm text-green-600">Confirmed</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-700">{bookings.filter(b => b.status === 'pending').length}</div>
                <div className="text-sm text-yellow-600">Pending</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">{bookings.length}</div>
                <div className="text-sm text-blue-600">Total</div>
              </div>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {bookings.slice(0, 10).map((booking: any) => (
                <div key={booking.id} className="p-3 border rounded-lg flex justify-between items-center">
                  <div>
                    <div className="font-medium">{booking.eventName}</div>
                    <div className="text-sm text-slate-600">{booking.eventDate} • {booking.customerName}</div>
                  </div>
                  <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                    {booking.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )
      },
      revenue: {
        title: "Revenue Breakdown",
        data: bookings,
        render: (bookings: any[]) => {
          const totalRevenue = bookings.reduce((sum, b) => sum + (parseFloat(b.totalAmount) || 0), 0);
          const confirmedRevenue = bookings.filter(b => b.status === 'confirmed').reduce((sum, b) => sum + (parseFloat(b.totalAmount) || 0), 0);
          const pendingRevenue = bookings.filter(b => b.status === 'pending').reduce((sum, b) => sum + (parseFloat(b.totalAmount) || 0), 0);
          
          return (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-700">{formatAmount(confirmedRevenue)}</div>
                  <div className="text-sm text-green-600">Confirmed</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-700">{formatAmount(pendingRevenue)}</div>
                  <div className="text-sm text-yellow-600">Pending</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-700">{formatAmount(totalRevenue)}</div>
                  <div className="text-sm text-blue-600">Total</div>
                </div>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {bookings.filter(b => b.totalAmount).slice(0, 10).map((booking: any) => (
                  <div key={booking.id} className="p-3 border rounded-lg flex justify-between items-center">
                    <div>
                      <div className="font-medium">{booking.eventName}</div>
                      <div className="text-sm text-slate-600">{booking.eventDate} • {booking.eventType}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatAmount(parseFloat(booking.totalAmount))}</div>
                      <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'} className="text-xs">
                        {booking.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }
      },
      leads: {
        title: "Lead Management",
        data: customers,
        render: (customers: any[]) => {
          const leads = customers.filter(c => c.status === 'lead' || !c.status);
          const highPriority = leads.filter(c => c.leadScore && c.leadScore >= 80);
          const mediumPriority = leads.filter(c => c.leadScore && c.leadScore >= 50 && c.leadScore < 80);
          const lowPriority = leads.filter(c => !c.leadScore || c.leadScore < 50);
          
          return (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-700">{highPriority.length}</div>
                  <div className="text-sm text-red-600">High Priority</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-700">{mediumPriority.length}</div>
                  <div className="text-sm text-yellow-600">Medium Priority</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-700">{lowPriority.length}</div>
                  <div className="text-sm text-blue-600">Low Priority</div>
                </div>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {leads.slice(0, 10).map((customer: any) => (
                  <div key={customer.id} className="p-3 border rounded-lg flex justify-between items-center">
                    <div>
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-sm text-slate-600">{customer.email} • {customer.phone}</div>
                    </div>
                    <div className="text-right">
                      <Badge variant={
                        customer.leadScore >= 80 ? 'destructive' : 
                        customer.leadScore >= 50 ? 'secondary' : 'outline'
                      }>
                        Score: {customer.leadScore || 'New'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }
      },
      utilization: {
        title: "Venue Utilization",
        data: venues,
        render: (venues: any[]) => {
          const venueBookings = venues.map(venue => {
            const venueBookingCount = (bookings as any[]).filter((b: any) => b.venueId === venue.id).length;
            return {
              ...venue,
              bookingCount: venueBookingCount,
              utilization: Math.min(100, venueBookingCount * 20) // Simplified calculation
            };
          });
          
          return (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-700">{venues.length}</div>
                  <div className="text-sm text-green-600">Total Venues</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-700">{bookings.length}</div>
                  <div className="text-sm text-blue-600">Total Bookings</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-700">{Math.round(venues.length > 0 ? bookings.length / venues.length : 0)}%</div>
                  <div className="text-sm text-purple-600">Avg Utilization</div>
                </div>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {venueBookings.map((venue) => (
                  <div key={venue.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-medium">{venue.name}</div>
                      <div className="text-sm font-medium">{venue.utilization}% utilized</div>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${venue.utilization}%` }}
                      ></div>
                    </div>
                    <div className="text-sm text-slate-600 mt-1">{venue.bookingCount} bookings</div>
                  </div>
                ))}
              </div>
            </div>
          );
        }
      }
    };

    const content = modalContent[selectedMetric as keyof typeof modalContent];
    if (!content) return null;

    return (
      <Dialog open={!!selectedMetric} onOpenChange={() => setSelectedMetric(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>{content.title}</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto">
            {content.render(content.data as any[])}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedMetric('bookings')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Bookings</p>
                <p className="text-3xl font-bold text-slate-900">{(metrics as any)?.totalBookings || 0}</p>
                <p className="text-sm text-green-600 font-medium">
                  <CheckCircle className="w-3 h-3 inline mr-1" />
                  {(metrics as any)?.confirmedBookings || 0} confirmed, 
                  <Clock className="w-3 h-3 inline mx-1" />
                  {(metrics as any)?.pendingBookings || 0} pending
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedMetric('revenue')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Revenue</p>
                <p className="text-3xl font-bold text-slate-900">
                  ${(metrics as any)?.revenue ? Math.round((metrics as any).revenue).toLocaleString() : "0"}
                </p>
                <p className="text-sm text-green-600 font-medium">
                  <TrendingUp className="w-3 h-3 inline mr-1" />
                  +{(metrics as any)?.revenueGrowth || 0}% growth
                </p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedMetric('leads')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Active Leads</p>
                <p className="text-3xl font-bold text-slate-900">{(metrics as any)?.activeLeads || 0}</p>
                <p className="text-sm text-orange-600 font-medium">
                  <TrendingUp className="w-3 h-3 inline mr-1" />
                  {(metrics as any)?.highPriorityLeads || 0} high priority
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedMetric('utilization')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Venue Utilization</p>
                <p className="text-3xl font-bold text-slate-900">{(metrics as any)?.utilization || 0}%</p>
                <p className="text-sm text-blue-600 font-medium">
                  <BarChart3 className="w-3 h-3 inline mr-1" />
                  {(metrics as any)?.totalVenues || 0} venues, {(metrics as any)?.totalCustomers || 0} customers
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {renderDetailModal()}
    </>
  );
}
