import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { MetricsGrid } from "@/components/dashboard/metrics-grid";
import { AdvancedCalendar } from "@/components/dashboard/advanced-calendar";
import { RecentBookings } from "@/components/dashboard/recent-bookings";
import { AIRecommendations } from "@/components/dashboard/ai-recommendations";
import { ActiveLeads } from "@/components/dashboard/active-leads";
import { QuickActions } from "@/components/dashboard/quick-actions";
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
        
        <main className="flex-1 overflow-y-auto p-3 sm:p-6">
          {/* AI Insights Banner */}
          <div className="mb-4 sm:mb-6 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-4 sm:p-6 text-white">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                  <h3 className="text-base sm:text-lg font-semibold">AI-Powered Venue Management</h3>
                </div>
                <p className="text-purple-100 mb-3 text-sm sm:text-base">Your venue utilization is 15% higher than last month. AI suggests focusing on weekend evening slots for maximum revenue.</p>
                <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm">
                  <span className="bg-white/20 px-2 sm:px-3 py-1 rounded-full">+23% Booking Rate</span>
                  <span className="bg-white/20 px-2 sm:px-3 py-1 rounded-full">3 High-Value Leads</span>
                  <span className="bg-white/20 px-2 sm:px-3 py-1 rounded-full">$12K Revenue Opportunity</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={() => setShowVoiceBookingModal(true)}
                  className="bg-white/20 hover:bg-white/30 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors w-full sm:w-auto flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
                  </svg>
                  Voice Booking
                </button>
                <button 
                  onClick={() => window.location.href = '/ai-analytics'}
                  className="bg-white/20 hover:bg-white/30 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors w-full sm:w-auto"
                >
                  AI Reports
                </button>
              </div>
            </div>
          </div>

          <MetricsGrid />
          
          {/* Full-width Calendar */}
          <div className="mb-4 sm:mb-6">
            <AdvancedCalendar onEventClick={handleEventClick} />
          </div>
          
          {/* Two-column layout for other components */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              <RecentBookings />
            </div>
            
            <div className="space-y-4 sm:space-y-6">
              <ActiveLeads />
            </div>
          </div>
          
          {/* AI Recommendations moved below */}
          <div className="mt-4 sm:mt-6">
            <AIRecommendations />
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
