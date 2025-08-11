import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { MetricsGrid } from "@/components/dashboard/metrics-grid";
import { AdvancedCalendar } from "@/components/dashboard/advanced-calendar";
import { RecentBookings } from "@/components/dashboard/recent-bookings";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { EventEditFullModal } from "@/components/forms/event-edit-full-modal";
import { EventSummaryModal } from "@/components/forms/event-summary-modal";
import { CreateEventModal } from "@/components/forms/create-event-modal";

// Optimized dashboard that loads all data in one API call
export default function OptimizedDashboard() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  
  // Single API call for all dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/dashboard/overview"],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Real-time quick stats (lighter, more frequent updates)
  const { data: quickStats } = useQuery({
    queryKey: ["/api/dashboard/quick-stats"],
    refetchInterval: 30000, // Update every 30 seconds
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
          
          <main className="flex-1 overflow-y-auto p-3 sm:p-6">
            {/* Loading skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                </div>
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
    venues = []
  } = dashboardData || {};

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
        
        <main className="flex-1 overflow-y-auto p-3 sm:p-6">
          {/* AI Insights Banner */}
          {insights.length > 0 && (
            <div className="mb-4 sm:mb-6 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-4 sm:p-6 text-white">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                    <h3 className="text-base sm:text-lg font-semibold">AI-Powered Insights</h3>
                  </div>
                  <p className="text-purple-100 mb-3 text-sm sm:text-base">
                    {insights[0]?.title || 'Your venue management is optimized with AI insights.'}
                  </p>
                  <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm">
                    <span className="bg-white/20 px-2 sm:px-3 py-1 rounded-full">
                      {metrics.thisMonthBookings || 0} Bookings This Month
                    </span>
                    <span className="bg-white/20 px-2 sm:px-3 py-1 rounded-full">
                      {activeLeads.length} Active Leads
                    </span>
                    <span className="bg-white/20 px-2 sm:px-3 py-1 rounded-full">
                      ${(metrics.revenue || 0).toLocaleString()} Revenue
                    </span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={() => setShowCreateEventModal(true)}
                    className="bg-white/20 hover:bg-white/30 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors w-full sm:w-auto"
                  >
                    New Booking
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-500">Total Bookings</h3>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalBookings || 0}</p>
              <p className="text-xs text-gray-500 mt-1">
                {metrics.thisMonthBookings || 0} this month
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-500">Revenue</h3>
              <p className="text-2xl font-bold text-gray-900">
                ${(metrics.revenue || 0).toLocaleString()}
              </p>
              <p className="text-xs text-green-600 mt-1">
                {metrics.revenueGrowth > 0 ? '+' : ''}{(metrics.revenueGrowth || 0).toFixed(1)}% from last month
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-500">Active Leads</h3>
              <p className="text-2xl font-bold text-gray-900">{metrics.activeLeads || 0}</p>
              <p className="text-xs text-gray-500 mt-1">
                Potential customers
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-500">Venues</h3>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalVenues || 0}</p>
              <p className="text-xs text-gray-500 mt-1">
                Active locations
              </p>
            </div>
          </div>
          
          {/* Calendar */}
          <div className="mb-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Upcoming Events</h2>
              <AdvancedCalendar 
                events={calendar.data} 
                onEventClick={handleEventClick} 
              />
            </div>
          </div>
          
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Bookings */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Recent Bookings</h2>
              <div className="space-y-4">
                {upcomingBookings.slice(0, 5).map((booking: any) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium">{booking.customerName}</h3>
                      <p className="text-sm text-gray-500">
                        {booking.eventType} • {booking.venue}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(booking.eventDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${(booking.totalAmount || 0).toLocaleString()}</p>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Active Leads */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Active Leads</h2>
              <div className="space-y-3">
                {activeLeads.slice(0, 5).map((lead: any) => (
                  <div key={lead.id} className="p-3 border rounded-lg">
                    <h3 className="font-medium text-sm">
                      {lead.firstName} {lead.lastName}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {lead.eventType} • {lead.guestCount} guests
                    </p>
                    <span className={`inline-block mt-1 px-2 py-1 text-xs rounded-full ${
                      lead.status === 'qualified' ? 'bg-green-100 text-green-800' :
                      lead.status === 'contacted' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {lead.status}
                    </span>
                  </div>
                ))}
              </div>
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