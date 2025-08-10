import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useFormattedCurrency } from "@/lib/currency";
import { BarChart3, TrendingUp, DollarSign } from "lucide-react";
import { format, subDays, eachDayOfInterval } from "date-fns";

export function RevenueChart() {
  const { data: bookings } = useQuery({ queryKey: ["/api/bookings"] });
  const { formatAmount } = useFormattedCurrency();

  // Calculate revenue for the last 7 days
  const getRevenueData = () => {
    if (!bookings || !Array.isArray(bookings)) return [];
    
    const today = new Date();
    const lastWeek = subDays(today, 6);
    const days = eachDayOfInterval({ start: lastWeek, end: today });
    
    return days.map(day => {
      const dayRevenue = (bookings as any[])
        .filter(booking => {
          try {
            if (!booking.date) return false;
            const bookingDate = new Date(booking.date);
            return format(bookingDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd') && 
                   booking.status === 'confirmed';
          } catch {
            return false;
          }
        })
        .reduce((sum, booking) => sum + (parseFloat(booking.totalAmount) || 0), 0);
      
      return {
        date: format(day, 'MMM d'),
        revenue: dayRevenue,
        isToday: format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
      };
    });
  };

  const revenueData = getRevenueData();
  const maxRevenue = Math.max(...revenueData.map(d => d.revenue), 1);
  const totalWeekRevenue = revenueData.reduce((sum, d) => sum + d.revenue, 0);
  const avgDailyRevenue = totalWeekRevenue / 7;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-green-600" />
          Weekly Revenue
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Revenue Chart */}
          <div className="space-y-2">
            {revenueData.map((day, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="text-xs font-medium text-slate-600 w-12">{day.date}</span>
                <div className="flex-1 relative">
                  <div className="h-6 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 rounded-full ${
                        day.isToday ? 'bg-green-500' : 'bg-green-400'
                      }`}
                      style={{ width: `${(day.revenue / maxRevenue) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs font-medium text-slate-700 w-16 text-right">
                  {formatAmount(day.revenue)}
                </span>
              </div>
            ))}
          </div>

          {/* Summary Stats */}
          <div className="pt-4 border-t border-slate-200 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Total (7 days)</span>
              <span className="font-semibold text-slate-900">{formatAmount(totalWeekRevenue)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Daily Average</span>
              <span className="font-semibold text-slate-900">{formatAmount(Math.round(avgDailyRevenue))}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-green-600 mt-2">
              <TrendingUp className="w-4 h-4" />
              <span>Tracking weekly performance</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}