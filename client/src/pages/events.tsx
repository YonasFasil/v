import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateEventModal } from "@/components/forms/create-event-modal";
import { EventDetailsModal } from "@/components/forms/event-details-modal";
import { useBookings } from "@/hooks/use-bookings";
import { Calendar, Clock, MapPin, Users, Table as TableIcon, Grid3X3, DollarSign } from "lucide-react";
import { format } from "date-fns";

export default function Events() {
  const { data: bookings, isLoading } = useBookings();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
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
          {!bookings || bookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No events scheduled</h3>
              <p className="text-gray-600 mb-6">Create your first event to get started with venue management.</p>
              <Button onClick={() => setShowCreateForm(true)} className="bg-blue-600 hover:bg-blue-700">
                Create First Event
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* View Mode Tabs */}
              <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "cards" | "table")}>
                <TabsList className="grid w-48 grid-cols-2">
                  <TabsTrigger value="cards" className="flex items-center gap-2">
                    <Grid3X3 className="h-4 w-4" />
                    Cards
                  </TabsTrigger>
                  <TabsTrigger value="table" className="flex items-center gap-2">
                    <TableIcon className="h-4 w-4" />
                    Table
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="cards" className="space-y-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bookings.map((booking) => (
                      <Card 
                        key={booking.id} 
                        className="hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => setSelectedBooking(booking)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-lg font-semibold line-clamp-2">{booking.eventName}</CardTitle>
                            <Badge className={getStatusColor(booking.status)}>
                              {booking.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-2" />
                              {booking.eventDate ? format(new Date(booking.eventDate), "PPP") : "Date TBD"}
                            </div>
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-2" />
                              {booking.startTime} - {booking.endTime}
                            </div>
                            <div className="flex items-center">
                              <Users className="w-4 h-4 mr-2" />
                              {booking.guestCount} guests
                            </div>
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-2" />
                              Venue Location
                            </div>
                            {booking.totalAmount && (
                              <div className="flex items-center font-medium text-green-600">
                                <DollarSign className="w-4 h-4 mr-2" />
                                ${parseFloat(booking.totalAmount).toLocaleString()}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="table" className="space-y-0">
                  <div className="border rounded-lg bg-white">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Event Name</TableHead>
                          <TableHead>Date & Time</TableHead>
                          <TableHead>Guests</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Venue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bookings.map((booking) => (
                          <TableRow 
                            key={booking.id}
                            className="cursor-pointer hover:bg-slate-50"
                            onClick={() => setSelectedBooking(booking)}
                          >
                            <TableCell className="font-medium">
                              <div>
                                <div className="font-semibold">{booking.eventName}</div>
                                <div className="text-sm text-slate-500">{booking.eventType}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>{booking.eventDate ? format(new Date(booking.eventDate), "MMM d, yyyy") : "TBD"}</div>
                                <div className="text-slate-500">{booking.startTime} - {booking.endTime}</div>
                              </div>
                            </TableCell>
                            <TableCell>{booking.guestCount}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(booking.status)}>
                                {booking.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium text-green-600">
                              {booking.totalAmount ? `$${parseFloat(booking.totalAmount).toLocaleString()}` : '-'}
                            </TableCell>
                            <TableCell className="text-sm text-slate-600">
                              Venue Location
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </main>

        {/* Event Creation Modal */}
        <CreateEventModal 
          open={showCreateForm} 
          onOpenChange={setShowCreateForm}
        />

        {/* Event Details Modal */}
        <EventDetailsModal 
          open={!!selectedBooking} 
          onOpenChange={(open) => !open && setSelectedBooking(null)}
          booking={selectedBooking}
        />
      </div>
    </div>
  );
}
