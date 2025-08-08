import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateEventModal } from "@/components/forms/create-event-modal";
import { EventSummaryModal } from "@/components/forms/event-summary-modal";
import { EventEditFullModal } from "@/components/forms/event-edit-full-modal";
import { AdvancedCalendar } from "@/components/dashboard/advanced-calendar";
import { useBookings } from "@/hooks/use-bookings";
import { Calendar, Clock, MapPin, Users, Table as TableIcon, Grid3X3, DollarSign } from "lucide-react";
import { format } from "date-fns";

export default function Events() {
  const { data: bookings, isLoading } = useBookings();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [viewMode, setViewMode] = useState<"calendar" | "cards" | "table">("calendar");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <div className="hidden md:block">
        <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      </div>
      
      <MobileNav isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 lg:p-6 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMobileNavOpen(true)}
              className="md:hidden"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900">Events & Bookings</h1>
              <p className="text-sm md:text-base text-slate-600 hidden sm:block">Manage your venue bookings and events</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <Button
              variant="outline"
              onClick={toggleSidebar}
              className="hidden md:flex items-center gap-2"
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              <span className="hidden lg:inline">{sidebarCollapsed ? "Expand" : "Collapse"} Sidebar</span>
            </Button>
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-sm md:text-base px-3 md:px-4"
            >
              <span className="hidden sm:inline">+ New Event</span>
              <span className="sm:hidden">+ New</span>
            </Button>
          </div>
        </div>
        
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 xl:p-8">
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
              <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "calendar" | "cards" | "table")}>
                <TabsList className="grid w-72 grid-cols-3">
                  <TabsTrigger value="calendar" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Calendar
                  </TabsTrigger>
                  <TabsTrigger value="cards" className="flex items-center gap-2">
                    <Grid3X3 className="h-4 w-4" />
                    Cards
                  </TabsTrigger>
                  <TabsTrigger value="table" className="flex items-center gap-2">
                    <TableIcon className="h-4 w-4" />
                    Table
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="calendar" className="space-y-6">
                  <div className="h-[calc(100vh-280px)] md:h-[calc(100vh-280px)]">
                    <AdvancedCalendar onEventClick={setSelectedBooking} />
                  </div>
                </TabsContent>

                <TabsContent value="cards" className="space-y-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bookings.map((booking) => (
                      <Card 
                        key={booking.id} 
                        className={`hover:shadow-lg transition-shadow cursor-pointer ${
                          (booking as any).isContract ? 'border-purple-200 bg-purple-50/30' : ''
                        }`}
                        onClick={() => setSelectedBooking(booking)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div>
                              {(booking as any).isContract && (
                                <Badge variant="secondary" className="mb-2 bg-purple-100 text-purple-800">
                                  Contract • {(booking as any).eventCount} Events
                                </Badge>
                              )}
                              <CardTitle className="text-lg font-semibold line-clamp-2">
                                {(booking as any).isContract 
                                  ? (booking as any).contractInfo?.contractName || "Multi-Date Contract"
                                  : booking.eventName
                                }
                              </CardTitle>
                            </div>
                            <Badge className={getStatusColor(booking.status)}>
                              {booking.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 text-sm text-gray-600">
                            {(booking as any).isContract ? (
                              <>
                                <div className="flex items-center">
                                  <Calendar className="w-4 h-4 mr-2" />
                                  {(booking as any).contractEvents?.length || 0} dates selected
                                </div>
                                <div className="flex items-center">
                                  <Users className="w-4 h-4 mr-2" />
                                  Total {(booking as any).contractEvents?.reduce((sum: number, event: any) => sum + (event.guestCount || 0), 0) || 0} guests
                                </div>
                                <div className="text-xs text-gray-500">
                                  Events: {(booking as any).contractEvents?.map((event: any) => 
                                    format(new Date(event.eventDate), "MMM d")
                                  ).join(", ") || 'None'}
                                </div>
                              </>
                            ) : (
                              <>
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
                              </>
                            )}
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
                            className={`cursor-pointer hover:bg-slate-50 ${
                              booking.isContract ? 'bg-purple-50/30' : ''
                            }`}
                            onClick={() => setSelectedBooking(booking)}
                          >
                            <TableCell className="font-medium">
                              <div>
                                <div className="flex items-center gap-2">
                                  {(booking as any).isContract && (
                                    <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs">
                                      Contract
                                    </Badge>
                                  )}
                                  <div className="font-semibold">
                                    {(booking as any).isContract 
                                      ? (booking as any).contractInfo?.contractName || "Multi-Date Contract"
                                      : booking.eventName
                                    }
                                  </div>
                                </div>
                                <div className="text-sm text-slate-500">
                                  {(booking as any).isContract 
                                    ? `${(booking as any).eventCount || 0} events grouped`
                                    : booking.eventType
                                  }
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {(booking as any).isContract ? (
                                <div className="text-sm">
                                  <div>{(booking as any).eventCount || 0} dates</div>
                                  <div className="text-slate-500">
                                    {(booking as any).contractEvents?.slice(0, 3).map((event: any) => 
                                      format(new Date(event.eventDate), "MMM d")
                                    ).join(", ") || 'None'}
                                    {((booking as any).contractEvents?.length || 0) > 3 && "..."}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-sm">
                                  <div>{booking.eventDate ? format(new Date(booking.eventDate), "MMM d, yyyy") : "TBD"}</div>
                                  <div className="text-slate-500">{booking.startTime} - {booking.endTime}</div>
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {(booking as any).isContract 
                                ? (booking as any).contractEvents?.reduce((sum: number, event: any) => sum + (event.guestCount || 0), 0) || 0
                                : booking.guestCount
                              }
                            </TableCell>
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

        {/* Event Summary Modal */}
        <EventSummaryModal 
          open={!!selectedBooking && !showEditModal} 
          onOpenChange={(open) => !open && setSelectedBooking(null)}
          booking={selectedBooking}
          onEditClick={() => setShowEditModal(true)}
        />

        {/* Event Edit Full Modal */}
        <EventEditFullModal 
          open={showEditModal && !!selectedBooking} 
          onOpenChange={(open) => {
            setShowEditModal(false);
            if (!open) setSelectedBooking(null);
          }}
          booking={selectedBooking}
        />
      </div>
    </div>
  );
}
