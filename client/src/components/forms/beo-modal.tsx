import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Mail
} from "lucide-react";

interface BeoModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
}

export function BeoModal({ isOpen, onClose, booking }: BeoModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState("standard");
  const [enabledBeoTypes, setEnabledBeoTypes] = useState([
    "floor_plan", "timeline", "catering", "av_requirements"
  ]);

  // Fetch BEO settings
  const { data: settings } = useQuery({
    queryKey: ["/api/settings"],
    enabled: isOpen
  });

  useEffect(() => {
    if (settings && typeof settings === 'object' && 'beo' in settings) {
      const beoSettings = settings.beo as any;
      setSelectedTemplate(beoSettings?.defaultTemplate || "standard");
      setEnabledBeoTypes(beoSettings?.enabledBeoTypes || []);
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
      default: return "BANQUET EVENT ORDER";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (!booking) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileOutput className="h-5 w-5" />
            Banquet Event Order (BEO)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" className="gap-2">
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </div>

          {/* BEO Document */}
          <Card className={`${getTemplateStyles()} shadow-lg`}>
            <CardHeader className="text-center pb-4">
              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-wide">
                  {getTemplateTitle()}
                </h1>
                <div className="text-sm text-muted-foreground">
                  Generated on {format(new Date(), "MMMM d, yyyy 'at' h:mm a")}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Event Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Event Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Event:</span>
                        <span>{booking.eventName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Date:</span>
                        <span>{format(new Date(booking.eventDate), "EEEE, MMMM d, yyyy")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Time:</span>
                        <span>{booking.startTime} - {booking.endTime}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Guest Count:</span>
                        <span>{booking.guestCount}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Venue:</span>
                        <span>{booking.venueName}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Client Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Name:</span>
                        <span>{booking.customerName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Email:</span>
                        <span>{booking.customerEmail}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Phone:</span>
                        <span>{booking.customerPhone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {booking.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Services & Packages */}
              <div>
                <h3 className="font-semibold text-lg mb-4">Services & Packages</h3>
                <div className="space-y-3">
                  {booking.selectedPackages?.map((pkg: any, index: number) => (
                    <div key={index} className="bg-white/50 rounded-lg p-4 border">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{pkg.name}</h4>
                        <span className="font-semibold">{formatCurrency(pkg.finalPrice || pkg.price)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{pkg.description}</p>
                      {pkg.includedServices?.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Included Services:</p>
                          <div className="flex flex-wrap gap-1">
                            {pkg.includedServices.map((service: any, idx: number) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {service.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {booking.selectedServices?.map((service: any, index: number) => (
                    <div key={index} className="bg-white/50 rounded-lg p-4 border">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{service.name}</h4>
                          <p className="text-sm text-muted-foreground">{service.description}</p>
                        </div>
                        <span className="font-semibold">{formatCurrency(service.finalPrice || service.price)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Conditional BEO Sections */}
              {enabledBeoTypes.includes("timeline") && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold text-lg mb-4">Event Timeline</h3>
                    <div className="bg-white/50 rounded-lg p-4 border">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium">Setup Begins:</span>
                          <span>{booking.startTime ? format(new Date(`2000-01-01 ${booking.startTime}`), "h:mm a") : "TBD"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Guest Arrival:</span>
                          <span>{booking.startTime ? format(new Date(`2000-01-01 ${booking.startTime}`), "h:mm a") : "TBD"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Event End:</span>
                          <span>{booking.endTime ? format(new Date(`2000-01-01 ${booking.endTime}`), "h:mm a") : "TBD"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Breakdown Complete:</span>
                          <span>TBD</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {enabledBeoTypes.includes("floor_plan") && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold text-lg mb-4">Floor Plan & Layout</h3>
                    <div className="bg-white/50 rounded-lg p-4 border">
                      <p className="text-sm text-muted-foreground">
                        Detailed floor plan and seating arrangement will be provided separately.
                        Guest count: {booking.guestCount} | Venue: {booking.venueName}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {enabledBeoTypes.includes("catering") && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold text-lg mb-4">Catering & Menu</h3>
                    <div className="bg-white/50 rounded-lg p-4 border">
                      <p className="text-sm text-muted-foreground">
                        Detailed catering menu and service information based on selected packages and services.
                      </p>
                    </div>
                  </div>
                </>
              )}

              {enabledBeoTypes.includes("av_requirements") && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold text-lg mb-4">AV & Technical Requirements</h3>
                    <div className="bg-white/50 rounded-lg p-4 border">
                      <p className="text-sm text-muted-foreground">
                        Audio/visual and technical requirements will be coordinated based on event specifications.
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* Pricing Summary */}
              {settings && typeof settings === 'object' && 'beo' in settings && (settings.beo as any)?.showPricing && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Pricing Summary
                    </h3>
                    <div className="bg-white/50 rounded-lg p-4 border">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span>{formatCurrency(booking.totalAmount || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tax:</span>
                          <span>TBD</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-semibold">
                          <span>Total:</span>
                          <span>{formatCurrency(booking.totalAmount || 0)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Footer */}
              <div className="text-center pt-6 border-t">
                <p className="text-xs text-muted-foreground">
                  This Banquet Event Order is subject to our terms and conditions. 
                  Please review all details carefully and contact us with any questions.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}