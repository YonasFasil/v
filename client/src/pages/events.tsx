import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import BookingWizard from "@/components/forms/booking-wizard";
import { useBookings } from "@/hooks/use-bookings";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import { format } from "date-fns";

export default function Events() {
  const { data: bookings, isLoading } = useBookings();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Events & Bookings" subtitle="Manage your venue bookings and events" />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-32 bg-gray-200 rounded-t-lg"></div>
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </main>
        </div>
      </div>
    );
  }

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
          title="Events & Bookings" 
          subtitle="Manage your venue bookings and events"
          onMobileMenuToggle={() => setMobileNavOpen(true)}
          action={
            <Button 
              onClick={() => {
                console.log('New Event button clicked');
                setShowCreateForm(true);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              + New Event
            </Button>
          }
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <BookingWizard 
            open={showCreateForm} 
            onOpenChange={setShowCreateForm} 
          />
          {!bookings || bookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
              <p className="text-gray-600 mb-6">Get started by creating your first event booking.</p>
              <Button onClick={() => {
                console.log('Create First Booking button clicked');
                setShowCreateForm(true);
              }} className="bg-blue-600 hover:bg-blue-700">
                Create First Booking
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookings.map((booking) => (
                <Card key={booking.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg font-semibold">{booking.eventName}</CardTitle>
                        <p className="text-sm text-gray-600">{booking.eventType}</p>
                      </div>
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      {booking.eventDate ? format(new Date(booking.eventDate), "PPP") : "Date TBD"}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      {booking.startTime} - {booking.endTime}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      {booking.guestCount} guests
                    </div>
                    {booking.totalAmount && (
                      <div className="text-lg font-semibold text-green-600">
                        ${parseFloat(booking.totalAmount).toLocaleString()}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
