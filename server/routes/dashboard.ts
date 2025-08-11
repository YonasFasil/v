import type { Express } from "express";
import { storage } from "../storage";
import { aiService } from "../services/ai";

export function registerDashboardRoutes(app: Express) {
  // Optimized dashboard data endpoint - replaces multiple API calls with one
  app.get('/api/dashboard/overview', async (req: any, res) => {
    try {
      // Fetch all essential dashboard data in parallel
      const [
        venues,
        bookings,
        customers,
        leads,
        payments,
        insights,
        settings
      ] = await Promise.all([
        storage.getVenues(),
        storage.getBookings(),
        storage.getCustomers(),
        storage.getLeads(),
        storage.getPayments(),
        storage.getAiInsights(),
        storage.getSettings()
      ]);

      // Calculate key metrics
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const thisMonthBookings = bookings.filter(b => 
        b.createdAt && new Date(b.createdAt) >= thisMonth
      );
      const lastMonthBookings = bookings.filter(b => 
        b.createdAt && new Date(b.createdAt) >= lastMonth && 
        new Date(b.createdAt) < thisMonth
      );

      const totalRevenue = thisMonthBookings.reduce((sum, b) => 
        sum + Number(b.totalAmount || 0), 0
      );
      const lastMonthRevenue = lastMonthBookings.reduce((sum, b) => 
        sum + Number(b.totalAmount || 0), 0
      );

      const upcomingBookings = bookings.filter(b => 
        b.eventDate && new Date(b.eventDate) > now
      ).slice(0, 5);

      const activeLeads = leads.filter(l => 
        l.status === 'new' || l.status === 'contacted' || l.status === 'qualified'
      ).slice(0, 5);

      const recentPayments = payments
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, 5);

      // Calendar events for the next 30 days
      const calendarEvents = bookings
        .filter(b => b.eventDate && new Date(b.eventDate) >= now)
        .slice(0, 20)
        .map(booking => ({
          id: booking.id,
          title: `${booking.customerName} - ${booking.eventType || 'Event'}`,
          start: booking.eventDate,
          end: booking.endDate || booking.eventDate,
          venue: venues.find(v => v.id === booking.venueId)?.name || 'Unknown Venue',
          status: booking.status,
          guestCount: booking.guestCount
        }));

      // Business settings for company info
      const businessSettings = settings.find(s => s.key === 'business')?.value || {
        companyName: 'Venuine Events',
        address: '',
        phone: '',
        email: ''
      };

      const response = {
        // Core metrics
        metrics: {
          totalBookings: bookings.length,
          thisMonthBookings: thisMonthBookings.length,
          revenue: totalRevenue,
          revenueGrowth: lastMonthRevenue > 0 ? 
            ((totalRevenue - lastMonthRevenue) / lastMonthRevenue * 100) : 0,
          activeLeads: activeLeads.length,
          totalVenues: venues.length,
          totalCustomers: customers.length
        },

        // Dashboard widgets data
        upcomingBookings: upcomingBookings.map(b => ({
          id: b.id,
          customerName: b.customerName,
          eventType: b.eventType,
          eventDate: b.eventDate,
          venue: venues.find(v => v.id === b.venueId)?.name || 'Unknown',
          status: b.status,
          totalAmount: b.totalAmount
        })),

        activeLeads: activeLeads.map(l => ({
          id: l.id,
          firstName: l.firstName,
          lastName: l.lastName,
          eventType: l.eventType,
          guestCount: l.guestCount,
          status: l.status,
          source: l.sourceId,
          createdAt: l.createdAt
        })),

        recentPayments: recentPayments.map(p => ({
          id: p.id,
          amount: p.amount,
          method: p.method,
          status: p.status,
          createdAt: p.createdAt,
          bookingId: p.bookingId
        })),

        // Calendar data
        calendar: {
          mode: 'events',
          data: calendarEvents
        },

        // AI insights
        insights: insights.filter(i => i.isActive).slice(0, 3),

        // Business info
        business: businessSettings,

        // Venue utilization
        venues: venues.map(v => ({
          id: v.id,
          name: v.name,
          bookingsThisMonth: thisMonthBookings.filter(b => b.venueId === v.id).length,
          capacity: v.capacity,
          revenueThisMonth: thisMonthBookings
            .filter(b => b.venueId === v.id)
            .reduce((sum, b) => sum + Number(b.totalAmount || 0), 0)
        }))
      };

      res.json(response);
    } catch (error) {
      console.error('Dashboard overview error:', error);
      res.status(500).json({ message: 'Failed to load dashboard data' });
    }
  });

  // Quick stats endpoint for real-time updates
  app.get('/api/dashboard/quick-stats', async (req: any, res) => {
    try {
      const [bookings, leads, payments] = await Promise.all([
        storage.getBookings(),
        storage.getLeads(),
        storage.getPayments()
      ]);

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const todayBookings = bookings.filter(b => 
        b.createdAt && new Date(b.createdAt) >= today
      );

      const weeklyRevenue = payments
        .filter(p => p.createdAt && new Date(p.createdAt) >= thisWeek)
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);

      const hotLeads = leads.filter(l => l.status === 'hot' || l.status === 'qualified');

      res.json({
        todayBookings: todayBookings.length,
        weeklyRevenue,
        hotLeads: hotLeads.length,
        pendingTasks: 0 // Add task counting when implemented
      });
    } catch (error) {
      console.error('Quick stats error:', error);
      res.status(500).json({ message: 'Failed to load quick stats' });
    }
  });
}