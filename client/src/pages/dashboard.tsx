import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { MetricsGrid } from "@/components/dashboard/metrics-grid";
import { CalendarWidget } from "@/components/dashboard/calendar-widget";
import { RecentBookings } from "@/components/dashboard/recent-bookings";
import { AIRecommendations } from "@/components/dashboard/ai-recommendations";
import { ActiveLeads } from "@/components/dashboard/active-leads";
import { QuickActions } from "@/components/dashboard/quick-actions";

export default function Dashboard() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <div className="hidden lg:block">
        <Sidebar />
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
                  <h3 className="text-base sm:text-lg font-semibold">AI Insights</h3>
                </div>
                <p className="text-purple-100 mb-3 text-sm sm:text-base">Your venue utilization is 15% higher than last month. AI suggests focusing on weekend evening slots for maximum revenue.</p>
                <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm">
                  <span className="bg-white/20 px-2 sm:px-3 py-1 rounded-full">+23% Booking Rate</span>
                  <span className="bg-white/20 px-2 sm:px-3 py-1 rounded-full">3 High-Value Leads</span>
                  <span className="bg-white/20 px-2 sm:px-3 py-1 rounded-full">$12K Revenue Opportunity</span>
                </div>
              </div>
              <button 
                onClick={() => {
                  console.log('AI Insights View Details button clicked');
                  alert('AI Insights details feature coming soon!');
                }}
                className="bg-white/20 hover:bg-white/30 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors w-full sm:w-auto"
              >
                View Details
              </button>
            </div>
          </div>

          <MetricsGrid />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              <CalendarWidget />
              <RecentBookings />
            </div>
            
            <div className="space-y-4 sm:space-y-6">
              <AIRecommendations />
              <ActiveLeads />
              <QuickActions />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
