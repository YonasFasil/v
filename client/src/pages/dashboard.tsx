import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { MetricsGrid } from "@/components/dashboard/metrics-grid";
import { AdvancedCalendar } from "@/components/dashboard/advanced-calendar";
import { RecentBookings } from "@/components/dashboard/recent-bookings";
import { AIRecommendations } from "@/components/dashboard/ai-recommendations";
import { RevenueInsights } from "@/components/dashboard/revenue-insights";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { VenueUtilization } from "@/components/dashboard/venue-utilization";
import { UpcomingEvents } from "@/components/dashboard/upcoming-events";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { QuickStats } from "@/components/dashboard/quick-stats";
import { TaskOverview } from "@/components/dashboard/task-overview";
import { VenuePerformance } from "@/components/dashboard/venue-performance";
import { EventEditFullModal } from "@/components/forms/event-edit-full-modal";
import { EventSummaryModal } from "@/components/forms/event-summary-modal";
import { CreateEventModal } from "@/components/forms/create-event-modal";
import { VoiceBookingModal } from "@/components/ai/voice-booking-modal";

export default function Dashboard() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [showVoiceBookingModal, setShowVoiceBookingModal] = useState(false);
  
  // Load full contract data if event is part of a contract
  const { data: allBookings = [] } = useQuery({ queryKey: ["/api/bookings"] });
  
  const handleEventClick = async (booking: any) => {
    if (booking.contractId) {
      // Find the full contract representation from the bookings list
      const contractBooking = (allBookings as any[]).find((b: any) => 
        b.isContract && b.contractInfo?.id === booking.contractId
      );
      if (contractBooking) {
        setSelectedEvent(contractBooking);
      } else {
        setSelectedEvent(booking);
      }
    } else {
      setSelectedEvent(booking);
    }
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
          subtitle="Welcome back! Here's what's happening at your venues today."
          onMobileMenuToggle={() => setMobileNavOpen(true)}
          onNewBooking={() => setShowCreateEventModal(true)}
          onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          sidebarCollapsed={sidebarCollapsed}
        />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <MetricsGrid />
          
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
            {/* Calendar - Full Width */}
            <div className="lg:col-span-12">
              <AdvancedCalendar onEventClick={handleEventClick} />
            </div>
            
            {/* Left Column - Main Content */}
            <div className="lg:col-span-8">
              <RecentBookings />
            </div>
            
            {/* Right Column - Side Widgets */}
            <div className="lg:col-span-4 space-y-4">
              <VenuePerformance />
              <RevenueInsights />
            </div>
            
            {/* AI Recommendations - Full Width */}
            <div className="lg:col-span-12">
              <AIRecommendations />
            </div>
          </div>
        </main>

        {/* Event Summary Modal - Shows when clicking calendar event */}
        <EventSummaryModal 
          open={!!selectedEvent && !showEditModal} 
          onOpenChange={(open) => !open && setSelectedEvent(null)}
          booking={selectedEvent}
          onEditClick={() => setShowEditModal(true)}
        />

        {/* Event Edit Modal - Shows when clicking Edit in summary modal */}
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

        {/* AI Voice Booking Modal */}
        <VoiceBookingModal
          open={showVoiceBookingModal}
          onOpenChange={setShowVoiceBookingModal}
          onEventCreated={() => {
            setShowVoiceBookingModal(false);
            // Refresh data
            window.location.reload();
          }}
        />
      </div>
    </div>
  );
}
