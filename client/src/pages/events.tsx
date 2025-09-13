import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateEventModal } from "@/components/forms/create-event-modal";
import { EventSummaryModal } from "@/components/forms/event-summary-modal";
import { EventEditFullModal } from "@/components/forms/event-edit-full-modal";
import { StatusChangeModal } from "@/components/modals/status-change-modal";
import { ProposalTrackingModal } from "@/components/proposals/proposal-tracking-modal";
import { AdvancedCalendar } from "@/components/dashboard/advanced-calendar";
import { useBookings } from "@/hooks/use-bookings";
import { usePermissions } from "@/hooks/usePermissions";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, MapPin, Users, Table as TableIcon, DollarSign, FileText, Plus, Search, Filter, MoreHorizontal, Eye, Menu } from "lucide-react";
import { format } from "date-fns";
import { useEventTime } from "@/hooks/use-timezone";
import { getStatusConfig } from "@shared/status-utils";

export default function Events() {
  const { data: bookings, isLoading } = useBookings();
  const { formatEventDate, formatEventTime, formatEventTimeRange } = useEventTime();
  const { hasFeature } = usePermissions();
  
  // Check if user has calendar view feature
  const hasCalendarView = hasFeature('calendar_view');
  
  // Fetch proposals to check which events have proposals
  const { data: proposals = [] } = useQuery({
    queryKey: ["/api/proposals"],
    staleTime: 5000, // 5 seconds - shorter for more responsive updates
    gcTime: 300000, // 5 minutes
    refetchOnWindowFocus: true, // Refetch when user comes back to tab
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [viewMode, setViewMode] = useState<"calendar" | "table">("table"); // Default to table, calendar only if feature available
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [selectedProposalId, setSelectedProposalId] = useState("");

  // Event click handler - for individual event editing from calendar
  const handleEventClick = async (booking: any, source: 'calendar' | 'table' = 'calendar') => {

    // For calendar events: treat as individual events for editing
    if (source === 'calendar') {
      // Prepare individual event data - strip contract context
      const individualEvent = {
        ...booking,
        eventName: booking.eventName || booking.title,
        eventDate: booking.eventDate || booking.start,
        // Mark as individual to force single event editing
        isContract: false,
        isPartOfContract: false,
        contractId: undefined,
        contractInfo: null,
        contractEvents: undefined,
        eventCount: 1,
        _editAsIndividual: true // Flag for the edit modal
      };

      setSelectedBooking(individualEvent);
      // Skip EventSummaryModal and go directly to edit mode for calendar clicks
      setShowEditModal(true);
      return;
    }

    // For table row clicks: show full contract data for contract events
    if (booking.contractId || booking.isPartOfContract) {
      const contractId = booking.contractId || booking.contractInfo?.id;
      if (contractId) {
        const contractBooking = (bookings as any[])?.find((b: any) =>
          b.isContract && b.contractInfo?.id === contractId
        );
        if (contractBooking) {
          // Found the full contract data - use it to show complete modal with all events
          setSelectedBooking(contractBooking);
          return;
        }
      }
    }

    // For single events or if contract lookup failed, use the booking as-is
    setSelectedBooking(booking);
  };

  const getDisplayStatus = (status: string, proposalStatus?: string) => {
    // Show proposal status when active for leads
    if (status === "inquiry" && proposalStatus === "sent") return "Proposal Sent";
    if (status === "inquiry" && proposalStatus === "viewed") return "Proposal Viewed";
    if (status === "inquiry" && proposalStatus === "accepted") return "Proposal Accepted";
    if (status === "inquiry" && proposalStatus === "declined") return "Proposal Declined";
    
    // Main business workflow
    switch (status) {
      case "inquiry": return "Lead";
      case "confirmed": return "Booked";
      case "completed": return "Completed";
      case "cancelled": return "Cancelled";
      // Legacy statuses for backwards compatibility
      case "pending": return "Pending";
      case "tentative": return "Tentative";
      case "quoted": return "Proposal Sent"; // Legacy: redirect to new workflow
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getStatusColor = (status: string, proposalStatus?: string) => {
    // Use the centralized status utils for consistent coloring
    return getStatusConfig(status).bgColor + " " + getStatusConfig(status).textColor;
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
      <div className="hidden lg:block">
        <Sidebar collapsed={sidebarCollapsed} />
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
              <Menu className="w-4 h-4" />
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
              <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "calendar" | "table")}>
                <TabsList className={`grid w-64 ${hasCalendarView ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  <TabsTrigger value="table" className="flex items-center gap-2">
                    <TableIcon className="h-4 w-4" />
                    Table
                  </TabsTrigger>
                  {hasCalendarView && (
                    <TabsTrigger value="calendar" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Calendar
                    </TabsTrigger>
                  )}
                </TabsList>

                {hasCalendarView && (
                  <TabsContent value="calendar" className="space-y-6">
                    <div className="h-[calc(100vh-280px)] md:h-[calc(100vh-280px)]">
                      <AdvancedCalendar onEventClick={(booking) => handleEventClick(booking, 'calendar')} />
                    </div>
                  </TabsContent>
                )}


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
                            onClick={() => handleEventClick(booking, 'table')}
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
                                      formatEventDate(event.eventDate).split(",")[0]
                                    ).join(", ") || 'None'}
                                    {((booking as any).contractEvents?.length || 0) > 3 && "..."}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-sm">
                                  <div>{booking.eventDate ? formatEventDate(booking.eventDate) : "TBD"}</div>
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
                              <div className="flex flex-col gap-1">
                                <Badge 
                                  className={`${getStatusConfig(booking.status).bgColor} ${getStatusConfig(booking.status).textColor} ${getStatusConfig(booking.status).borderColor} border text-xs px-2 py-1 whitespace-nowrap text-center min-w-fit`}
                                  title={getStatusConfig(booking.status).description}
                                >
                                  {getStatusConfig(booking.status).label}
                                </Badge>
                              </div>
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

        {/* Status Change Modal */}
        <StatusChangeModal
          open={showStatusModal && !!selectedBooking}
          onOpenChange={(open) => {
            setShowStatusModal(false);
            if (!open) setSelectedBooking(null);
          }}
          booking={selectedBooking}
          onStatusChanged={() => {
            // Close the modal and clear selection - React Query will handle cache updates
            setShowStatusModal(false);
            setSelectedBooking(null);
          }}
        />

        {/* Proposal Tracking Modal */}
        <ProposalTrackingModal
          open={showProposalModal}
          onOpenChange={setShowProposalModal}
          proposalId={selectedProposalId}
        />
      </div>
    </div>
  );
}
