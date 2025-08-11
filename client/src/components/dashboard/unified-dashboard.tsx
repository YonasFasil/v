import { useState, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, Users, BarChart3, TrendingUp } from "lucide-react";
import { AdvancedCalendar } from "@/components/dashboard/advanced-calendar";
import { EventEditFullModal } from "@/components/forms/event-edit-full-modal";
import { EventSummaryModal } from "@/components/forms/event-summary-modal";
import { CreateEventModal } from "@/components/forms/create-event-modal";

// Single unified dashboard that eliminates redundant API calls
export default function UnifiedDashboard() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  
  // Single API call for ALL dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/dashboard/overview"],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchInterval: 2 * 60 * 1000, // Refresh every 2 minutes
  });

  // Real-time quick stats (lighter updates)
  const { data: quickStats } = useQuery({
    queryKey: ["/api/dashboard/quick-stats"],
    refetchInterval: 30000, // Update every 30 seconds
    staleTime: 30000,
  });

  const handleEventClick = async (booking: any) => {
    setSelectedEvent(booking);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <div className="hidden lg:block">
          <Sidebar collapsed={sidebarCollapsed} />
        </div>
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header 
            title="Dashboard" 
            subtitle="Loading your venue data..."
            onMobileMenuToggle={() => setMobileNavOpen(true)}
            onNewBooking={() => setShowCreateEventModal(true)}
            onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            sidebarCollapsed={sidebarCollapsed}
          />
          
          <main className="flex-1 overflow-y-auto p-6">
            {/* Loading skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-lg shadow-sm h-96 animate-pulse"></div>
              <div className="bg-white rounded-lg shadow-sm h-96 animate-pulse"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const {
    metrics = {},
    upcomingBookings = [],
    activeLeads = [],
    calendar = { data: [] },
    insights = [],
    business = {},
    venues = [],
    recentPayments = []
  } = dashboardData || {};

  // Combine quick stats with dashboard metrics
  const displayMetrics = {
    ...metrics,
    todayBookings: quickStats?.todayBookings || 0,
    weeklyRevenue: quickStats?.weeklyRevenue || 0,
    hotLeads: quickStats?.hotLeads || 0
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <div className="hidden lg:block">
        <Sidebar collapsed={sidebarCollapsed} />
      </div>
      
      <MobileNav 
        isOpen={mobileNavOpen} 
        onClose={() => setMobileNavOpen(false)} 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Dashboard" 
          subtitle={`Welcome back! Here's what's happening at ${business.companyName || 'your venues'} today.`}
          onMobileMenuToggle={() => setMobileNavOpen(true)}
          onNewBooking={() => setShowCreateEventModal(true)}
          onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          sidebarCollapsed={sidebarCollapsed}
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          {/* AI Insights Banner */}
          {insights.length > 0 && (
            <div className="mb-6 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <TrendingUp className="w-6 h-6 mr-2" />
                    <h3 className="text-lg font-semibold">AI-Powered Insights</h3>
                  </div>
                  <p className="text-purple-100 mb-3">
                    {insights[0]?.message || 'Your venue management is optimized with AI insights.'}
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <span className="bg-white/20 px-3 py-1 rounded-full">
                      {displayMetrics.thisMonthBookings || 0} Bookings This Month
                    </span>
                    <span className="bg-white/20 px-3 py-1 rounded-full">
                      {displayMetrics.hotLeads || 0} Hot Leads
                    </span>
                    <span className="bg-white/20 px-3 py-1 rounded-full">
                      ${(displayMetrics.weeklyRevenue || 0).toLocaleString()} This Week
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setShowCreateEventModal(true)}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  New Booking
                </button>
              </div>
            </div>
          )}

          {/* Unified Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Total Bookings</p>
                    <p className="text-2xl font-bold">{displayMetrics.totalBookings || 0}</p>
                    <p className="text-xs text-slate-500 flex items-center mt-1">
                      <span className="text-green-600">+{displayMetrics.todayBookings || 0}</span>
                      <span className="ml-1">today</span>
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Revenue</p>
                    <p className="text-2xl font-bold">${(displayMetrics.revenue || 0).toLocaleString()}</p>
                    <p className="text-xs text-slate-500 flex items-center mt-1">
                      <span className="text-green-600">
                        {displayMetrics.revenueGrowth > 0 ? '+' : ''}{(displayMetrics.revenueGrowth || 0).toFixed(1)}%
                      </span>
                      <span className="ml-1">from last month</span>
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Active Leads</p>
                    <p className="text-2xl font-bold">{displayMetrics.activeLeads || 0}</p>
                    <p className="text-xs text-slate-500 flex items-center mt-1">
                      <span className="text-orange-600">{displayMetrics.hotLeads || 0}</span>
                      <span className="ml-1">hot leads</span>
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Venues</p>
                    <p className="text-2xl font-bold">{displayMetrics.totalVenues || 0}</p>
                    <p className="text-xs text-slate-500 flex items-center mt-1">
                      <span className="text-blue-600">Active</span>
                      <span className="ml-1">locations</span>
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Calendar - Full Width */}
          <div className="mb-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4">Event Calendar</h2>
                <AdvancedCalendar 
                  events={calendar.data} 
                  onEventClick={handleEventClick} 
                />
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Bookings */}
            <div className="lg:col-span-2">
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
                        <button 
                          onClick={() => setShowCreateEventModal(true)}
                          className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Create your first booking
                        </button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Side Panel */}
            <div className="space-y-6">
              {/* Active Leads */}
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

              {/* Recent Payments */}
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
            </div>
          </div>
        </main>

        {/* Modals */}
        <EventSummaryModal 
          open={!!selectedEvent && !showEditModal} 
          onOpenChange={(open) => !open && setSelectedEvent(null)}
          booking={selectedEvent}
          onEditClick={() => setShowEditModal(true)}
        />

        <EventEditFullModal 
          open={showEditModal} 
          onOpenChange={(open) => {
            setShowEditModal(false);
            if (!open) {
              setSelectedEvent(null);
            }
          }}
          booking={selectedEvent}
        />

        <CreateEventModal
          open={showCreateEventModal}
          onOpenChange={setShowCreateEventModal}
        />
      </div>
    </div>
  );
}