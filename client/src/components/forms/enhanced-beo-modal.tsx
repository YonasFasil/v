import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  FileOutput, 
  Download, 
  Printer, 
  MapPin, 
  Clock, 
  Users, 
  Calendar,
  DollarSign,
  Phone,
  Mail,
  Building2,
  CheckCircle
} from "lucide-react";

interface EnhancedBeoModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
}

export function EnhancedBeoModal({ isOpen, onClose, booking }: EnhancedBeoModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState("standard");
  const [enabledBeoTypes, setEnabledBeoTypes] = useState([
    "floor_plan", "timeline", "catering", "av_requirements"
  ]);

  // Fetch BEO settings and business info
  const { data: settings } = useQuery({
    queryKey: ["/api/settings"],
    enabled: isOpen
  });

  useEffect(() => {
    if (settings && typeof settings === 'object' && 'beo' in settings) {
      const beoSettings = settings.beo as any;
      setSelectedTemplate(beoSettings?.defaultTemplate || "standard");
      setEnabledBeoTypes(beoSettings?.enabledBeoTypes || ["timeline", "floor_plan", "catering", "av_requirements"]);
    }
  }, [settings]);

  const getTemplateStyles = () => {
    switch (selectedTemplate) {
      case "luxury":
        return "bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200";
      case "corporate":
        return "bg-gradient-to-br from-blue-50 to-slate-50 border-blue-200";
      case "wedding":
        return "bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200";
      case "minimal":
        return "bg-white border-gray-200";
      case "executive":
        return "bg-white border-slate-400";
      default:
        return "bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200";
    }
  };

  const getTemplateTitle = () => {
    switch (selectedTemplate) {
      case "luxury": return "LUXURY EVENT ORDER";
      case "corporate": return "CORPORATE EVENT ORDER";
      case "wedding": return "WEDDING EVENT ORDER";
      case "minimal": return "EVENT ORDER";
      case "executive": return "EXECUTIVE EVENT ORDER";
      default: return "BANQUET EVENT ORDER";
    }
  };

  const formatCurrency = (amount: number) => {
    const currency = settings?.business?.currency || 'USD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const calculateEventDuration = () => {
    try {
      const start = new Date(`2000-01-01 ${booking.startTime}`);
      const end = new Date(`2000-01-01 ${booking.endTime}`);
      const diffHours = Math.abs((end.getTime() - start.getTime()) / (1000 * 60 * 60));
      return `${diffHours} hours`;
    } catch {
      return 'TBD';
    }
  };

  const generateTimeline = () => {
    try {
      const eventStart = new Date(`2000-01-01 ${booking.startTime}`);
      const eventEnd = new Date(`2000-01-01 ${booking.endTime}`);
      
      const setupTime = new Date(eventStart.getTime() - 2 * 60 * 60 * 1000); // 2 hours before
      const cocktailTime = new Date(eventStart.getTime() + 30 * 60 * 1000);   // 30 min after start
      const dinnerTime = new Date(eventStart.getTime() + 90 * 60 * 1000);     // 1.5 hours after start
      const breakdownStart = new Date(eventEnd.getTime() - 30 * 60 * 1000);   // 30 min before end
      const breakdownEnd = new Date(eventEnd.getTime() + 60 * 60 * 1000);     // 1 hour after end

      return [
        { time: setupTime, activity: "Setup & Vendor Load-in", notes: "All vendors on-site, setup begins" },
        { time: eventStart, activity: "Guest Arrival & Event Start", notes: "Welcome reception begins" },
        { time: cocktailTime, activity: "Cocktail Hour", notes: "Bar service in full swing" },
        { time: dinnerTime, activity: "Dinner Service", notes: "Meal service commences" },
        { time: breakdownStart, activity: "Event Wind-down", notes: "Prepare for conclusion" },
        { time: eventEnd, activity: "Event End", notes: "Guest departure begins" },
        { time: breakdownEnd, activity: "Breakdown Complete", notes: "All vendors departed" }
      ];
    } catch {
      return [];
    }
  };

  const timelineEvents = generateTimeline();

  if (!booking) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileOutput className="h-5 w-5" />
            Enhanced Banquet Event Order (BEO)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" className="gap-2">
              <Printer className="h-4 w-4" />
              Print BEO
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </div>

          {/* BEO Document */}
          <Card className={`${getTemplateStyles()} shadow-xl border-2`}>
            {/* Header with Business Info */}
            <CardHeader className="text-center border-b-2 pb-6 bg-white/80">
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Building2 className="h-6 w-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-800">
                    {settings?.business?.companyName || 'Venuine Events'}
                  </h2>
                </div>
                
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="font-medium">{settings?.business?.companyAddress || '123 Event Plaza, Venue City, State 12345'}</div>
                  <div className="flex justify-center gap-4">
                    <span>{settings?.business?.companyPhone || '+1 (555) 123-4567'}</span>
                    <span>•</span>
                    <span>{settings?.business?.companyEmail || 'events@venuine.com'}</span>
                  </div>
                  {settings?.business?.website && (
                    <div className="text-blue-600">{settings.business.website}</div>
                  )}
                </div>
                
                <div className="border-t pt-4">
                  <h1 className="text-3xl font-bold tracking-wide text-gray-800">
                    {getTemplateTitle()}
                  </h1>
                  <div className="text-sm text-gray-600 flex justify-center gap-6 mt-2">
                    <span className="font-mono">BEO #: BEO-{booking.id?.slice(-6)?.toUpperCase() || "000001"}</span>
                    <span>•</span>
                    <span>Generated: {format(new Date(), "MMM d, yyyy 'at' h:mm a")}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-8 p-8">
              {/* Event & Client Information Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Event Information */}
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                  <h3 className="font-bold text-xl mb-4 text-blue-800 flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Event Information
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-3 gap-2">
                      <span className="font-semibold text-gray-700">Event Name:</span>
                      <span className="col-span-2 font-bold text-gray-900">{booking.eventName}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="font-semibold text-gray-700">Event Type:</span>
                      <span className="col-span-2 capitalize">{booking.eventType?.replace('_', ' ') || 'General Event'}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="font-semibold text-gray-700">Date:</span>
                      <span className="col-span-2 font-bold text-blue-900">
                        {format(new Date(booking.eventDate), "EEEE, MMMM d, yyyy")}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="font-semibold text-gray-700">Time:</span>
                      <span className="col-span-2">{booking.startTime} - {booking.endTime}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="font-semibold text-gray-700">Duration:</span>
                      <span className="col-span-2">{calculateEventDuration()}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="font-semibold text-gray-700">Guest Count:</span>
                      <span className="col-span-2 font-bold text-blue-900">{booking.guestCount} guests</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="font-semibold text-gray-700">Status:</span>
                      <Badge variant="outline" className="w-fit capitalize">
                        {booking.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Client Information */}
                <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                  <h3 className="font-bold text-xl mb-4 text-green-800 flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Client Information
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-3 gap-2">
                      <span className="font-semibold text-gray-700">Contact Name:</span>
                      <span className="col-span-2 font-bold text-gray-900">{booking.customerName || 'TBD'}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="font-semibold text-gray-700">Email:</span>
                      <span className="col-span-2 text-blue-600">{booking.customerEmail || 'TBD'}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="font-semibold text-gray-700">Phone:</span>
                      <span className="col-span-2">{booking.customerPhone || 'TBD'}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="font-semibold text-gray-700">BEO Date:</span>
                      <span className="col-span-2">{format(new Date(), "MMM d, yyyy")}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="font-semibold text-gray-700">Event Manager:</span>
                      <span className="col-span-2 font-semibold">Venuine Events Team</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="font-semibold text-gray-700">Contract ID:</span>
                      <span className="col-span-2 font-mono text-xs">
                        {booking.contractId || booking.id?.slice(-8)?.toUpperCase() || "PENDING"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Venue & Space Details */}
              <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
                <h3 className="font-bold text-xl mb-4 text-orange-800 flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Venue & Space Configuration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
                  <div className="space-y-3">
                    <h4 className="font-bold text-gray-800 border-b border-orange-300 pb-1">Location</h4>
                    <div className="space-y-2">
                      <div><span className="font-semibold">Venue:</span> {booking.venueName || 'Main Venue'}</div>
                      <div><span className="font-semibold">Space:</span> {booking.spaceName || 'Grand Ballroom'}</div>
                      <div><span className="font-semibold">Capacity:</span> {Math.ceil(booking.guestCount * 1.5)} max</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-bold text-gray-800 border-b border-orange-300 pb-1">Setup</h4>
                    <div className="space-y-2">
                      <div><span className="font-semibold">Style:</span> Rounds of 10</div>
                      <div><span className="font-semibold">Tables:</span> {Math.ceil(booking.guestCount / 10)} round</div>
                      <div><span className="font-semibold">Setup:</span> 2 hrs prior</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-bold text-gray-800 border-b border-orange-300 pb-1">Furnishings</h4>
                    <div className="space-y-2">
                      <div><span className="font-semibold">Linens:</span> White floor-length</div>
                      <div><span className="font-semibold">Chairs:</span> Chiavari Gold</div>
                      <div><span className="font-semibold">Centerpieces:</span> Seasonal florals</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-bold text-gray-800 border-b border-orange-300 pb-1">Logistics</h4>
                    <div className="space-y-2">
                      <div><span className="font-semibold">Breakdown:</span> 30 min post</div>
                      <div><span className="font-semibold">Load Out:</span> 1 hr post</div>
                      <div><span className="font-semibold">Security:</span> Standard</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline Section */}
              {enabledBeoTypes.includes("timeline") && timelineEvents.length > 0 && (
                <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                  <h3 className="font-bold text-xl mb-4 text-purple-800 flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Event Timeline
                  </h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-4 font-bold text-sm bg-purple-100 p-3 rounded border">
                      <span>Time</span>
                      <span>Activity</span>
                      <span>Notes</span>
                    </div>
                    {timelineEvents.map((event, index) => (
                      <div key={index} className="grid grid-cols-3 gap-4 text-sm p-3 border-b border-purple-200 hover:bg-purple-50">
                        <span className="font-mono font-semibold">
                          {event.time.toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit', hour12: true})}
                        </span>
                        <span className="font-medium">{event.activity}</span>
                        <span className="text-gray-600">{event.notes}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Services & Packages */}
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="font-bold text-xl mb-4 text-gray-800 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Services & Packages
                </h3>
                <div className="space-y-4">
                  {booking.selectedPackages?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-lg mb-3 text-blue-800">Selected Package</h4>
                      {booking.selectedPackages.map((pkg: any, index: number) => (
                        <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h5 className="font-bold text-blue-900">{pkg.name}</h5>
                              <p className="text-sm text-blue-700">{pkg.description}</p>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-lg text-blue-900">
                                {formatCurrency(pkg.finalPrice || pkg.price)}
                              </span>
                              <div className="text-xs text-blue-600">
                                {pkg.pricingModel === 'per_person' ? `${formatCurrency(pkg.price)} per person` : 'Total'}
                              </div>
                            </div>
                          </div>
                          {pkg.includedServices?.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-blue-200">
                              <p className="text-xs font-semibold text-blue-800 mb-2">Included Services:</p>
                              <div className="grid grid-cols-2 gap-2">
                                {pkg.includedServices.map((service: any, idx: number) => (
                                  <div key={idx} className="text-xs bg-blue-100 px-2 py-1 rounded">
                                    {service.name}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {booking.selectedServices?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-lg mb-3 text-green-800">Additional Services</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {booking.selectedServices.map((service: any, index: number) => (
                          <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h6 className="font-semibold text-green-900">{service.name}</h6>
                                <p className="text-xs text-green-700">{service.description}</p>
                              </div>
                              <div className="text-right ml-2">
                                <span className="font-semibold text-green-900">
                                  {formatCurrency(service.finalPrice || service.price)}
                                </span>
                                <div className="text-xs text-green-600">
                                  {service.pricingModel === 'per_person' ? 'per person' : 'total'}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Summary */}
              <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-200">
                <h3 className="font-bold text-xl mb-4 text-indigo-800 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Financial Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-1">
                      <span className="font-semibold">Subtotal:</span>
                      <span>{formatCurrency((booking.totalPrice || 0) * 0.85)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="font-semibold">Service Charge (18%):</span>
                      <span>{formatCurrency((booking.totalPrice || 0) * 0.85 * 0.18)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="font-semibold">Sales Tax (8.5%):</span>
                      <span>{formatCurrency((booking.totalPrice || 0) * 0.085)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between py-2 text-lg font-bold text-indigo-900">
                      <span>Total Amount:</span>
                      <span>{formatCurrency(booking.totalPrice || 0)}</span>
                    </div>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-1">
                      <span className="font-semibold">Deposit Required (50%):</span>
                      <span className="font-bold text-orange-600">{formatCurrency((booking.totalPrice || 0) * 0.5)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="font-semibold">Balance Due:</span>
                      <span>{formatCurrency((booking.totalPrice || 0) * 0.5)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="font-semibold">Payment Status:</span>
                      <Badge variant="outline">{booking.paymentStatus || 'Pending'}</Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Terms & Conditions */}
              <div className="bg-red-50 p-6 rounded-lg border border-red-200">
                <h3 className="font-bold text-xl mb-4 text-red-800">Terms & Conditions</h3>
                <div className="text-sm space-y-2 text-gray-700 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <ul className="space-y-1">
                      <li>• 50% deposit required to secure booking</li>
                      <li>• Balance due 7 days prior to event date</li>
                      <li>• Guest count confirmed 72 hours prior</li>
                      <li>• Additional charges for guest count increases</li>
                    </ul>
                  </div>
                  <div>
                    <ul className="space-y-1">
                      <li>• Setup/breakdown included in space time</li>
                      <li>• Client responsible for property damages</li>
                      <li>• 30-day cancellation forfeits deposit</li>
                      <li>• Force majeure allows date changes</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Contact & Signatures */}
              <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                <h3 className="font-bold text-xl mb-4 text-slate-800">Contact Information & Acknowledgment</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 text-sm">
                  <div>
                    <h4 className="font-semibold mb-2">Event Coordinator:</h4>
                    <div className="space-y-1">
                      <div className="font-semibold">{settings?.business?.companyName || 'Venuine Events'}</div>
                      <div>{settings?.business?.companyEmail || 'events@venuine.com'}</div>
                      <div>{settings?.business?.companyPhone || '+1 (555) 123-4567'}</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Venue Address:</h4>
                    <div className="whitespace-pre-line">
                      {settings?.business?.companyAddress || '123 Event Plaza\nVenue City, State 12345'}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-300">
                  <div className="space-y-3">
                    <h4 className="font-semibold">Client Signature & Date:</h4>
                    <div className="border-b border-slate-400 h-10"></div>
                    <p className="text-xs text-slate-600">
                      By signing, client acknowledges review and acceptance of all terms and details contained in this BEO.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold">Venue Representative & Date:</h4>
                    <div className="border-b border-slate-400 h-10"></div>
                    <p className="text-xs text-slate-600">
                      Venue confirms ability to execute event as detailed above.
                    </p>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}