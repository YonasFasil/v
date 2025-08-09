import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, Users, Star, TrendingUp, AlertCircle } from "lucide-react";
import { format, isToday, parseISO } from "date-fns";

export function QuickStats() {
  const { data: bookings } = useQuery({ queryKey: ["/api/bookings"] });
  const { data: customers } = useQuery({ queryKey: ["/api/customers"] });

  const getQuickStats = () => {
    if (!bookings || !customers || !Array.isArray(bookings) || !Array.isArray(customers)) {
      return {
        todayEvents: 0,
        thisWeekBookings: 0,
        averageEventSize: 0,
        topCustomers: 0,
        pendingTasks: 0,
        utilizationRate: 0
      };
    }

    const today = new Date();
    const todayEvents = (bookings as any[]).filter(booking => {
      try {
        return booking.date && isToday(parseISO(booking.date)) && booking.status === 'confirmed';
      } catch {
        return false;
      }
    }).length;

    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    const thisWeekBookings = (bookings as any[]).filter(booking => {
      try {
        if (!booking.date) return false;
        const bookingDate = parseISO(booking.date);
        return bookingDate >= thisWeekStart && booking.status !== 'cancelled';
      } catch {
        return false;
      }
    }).length;

    const confirmedBookings = (bookings as any[]).filter(b => b.status === 'confirmed');
    const averageEventSize = confirmedBookings.length > 0 
      ? Math.round(confirmedBookings.reduce((sum, b) => sum + (b.guestCount || 0), 0) / confirmedBookings.length)
      : 0;

    const topCustomers = (customers as any[]).filter(c => c.status === 'customer').length;

    const pendingTasks = (bookings as any[]).filter(b => b.status === 'pending').length;

    const utilizationRate = bookings.length > 0 
      ? Math.round((confirmedBookings.length / (bookings as any[]).length) * 100)
      : 0;

    return {
      todayEvents,
      thisWeekBookings,
      averageEventSize,
      topCustomers,
      pendingTasks,
      utilizationRate
    };
  };

  const stats = getQuickStats();

  const quickStatsItems = [
    {
      label: "Today's Events",
      value: stats.todayEvents,
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      label: "This Week",
      value: stats.thisWeekBookings,
      icon: Clock,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      label: "Avg Event Size",
      value: `${stats.averageEventSize} guests`,
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      label: "Active Customers",
      value: stats.topCustomers,
      icon: Star,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
    {
      label: "Utilization",
      value: `${stats.utilizationRate}%`,
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50"
    },
    {
      label: "Pending Tasks",
      value: stats.pendingTasks,
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-50"
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
      {quickStatsItems.map((stat, index) => {
        const Icon = stat.icon;
        
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.bgColor}`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xs text-slate-600 font-medium">{stat.label}</p>
                  <p className="text-lg font-bold text-slate-900">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}