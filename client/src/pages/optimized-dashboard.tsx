import { useState, Suspense } from "react";
import { DashboardProvider } from "@/contexts/dashboard-context";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, Users, BarChart3, TrendingUp } from "lucide-react";
import { EventSummaryModal } from "@/components/forms/event-summary-modal";
import { EventEditFullModal } from "@/components/forms/event-edit-full-modal";
import { CreateEventModal } from "@/components/forms/create-event-modal";
import { AdvancedCalendar } from "@/components/dashboard/advanced-calendar";
import { OptimizedRecentBookings, OptimizedActiveLeads, OptimizedRecentPayments } from "@/components/dashboard/optimized-components";
import { useDashboardData } from "@/contexts/dashboard-context";

// Inner Dashboard Component that uses context
function DashboardContent() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  
  // Get all data from context - no individual API calls
  const { metrics, business, insights, isLoading, error } = useDashboardData();

  const handleEventClick = (booking: any) => {
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

  const displayMetrics = metrics;

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
                  onEventClick={handleEventClick} 
                />
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Bookings - Using optimized component */}
            <div className="lg:col-span-2">
              <OptimizedRecentBookings />
            </div>

            {/* Side Panel - Using optimized components */}
            <div className="space-y-6">
              <OptimizedActiveLeads />
              <OptimizedRecentPayments />
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

// Main component with context provider
export default function OptimizedDashboard() {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  );
}