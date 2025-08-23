import React from 'react';
import { format } from 'date-fns';
import { formatCurrency } from '@shared/currency';
import { formatInTimezone, formatTimeInTimezone } from '@shared/timezone';

interface BEOData {
  eventName: string;
  eventDate: string;
  eventTime: string;
  clientName: string;
  contactInfo: {
    email: string;
    phone: string;
  };
  venue: {
    name: string;
    address: string;
  };
  guestCount: number;
  setupStyle: string;
  services: Array<{
    name: string;
    description: string;
    quantity?: number;
    price?: number;
  }>;
  timeline: Array<{
    time: string;
    activity: string;
  }>;
  specialRequests?: string;
  totalAmount?: number;
}

interface ExecutiveBEOTemplateProps {
  data: BEOData;
  showPricing?: boolean;
  timezone?: string;
}

export function ExecutiveBEOTemplate({ data, showPricing = false, timezone = 'America/New_York' }: ExecutiveBEOTemplateProps) {
  return (
    <div className="bg-white p-8 max-w-4xl mx-auto font-serif text-slate-800">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-6 rounded-t-lg mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold mb-2">BANQUET EVENT ORDER</h1>
            <p className="text-slate-200">{data.venue.name}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-200">BEO No.</p>
            <p className="text-lg font-semibold">#{Math.random().toString().substr(2, 6)}</p>
            <p className="text-sm text-slate-200 mt-2">{formatInTimezone(new Date(), timezone, 'MMM dd, yyyy')}</p>
          </div>
        </div>
      </div>

      {/* Event Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-300 pb-2 mb-3">
              EVENT DETAILS
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">Event:</span>
                <span>{data.eventName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Date:</span>
                <span>{formatInTimezone(data.eventDate, timezone, 'EEEE, MMMM dd, yyyy')}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Time:</span>
                <span>{data.eventTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Guests:</span>
                <span>{data.guestCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Setup:</span>
                <span>{data.setupStyle}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-300 pb-2 mb-3">
              CLIENT INFORMATION
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">Name:</span>
                <span>{data.clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Email:</span>
                <span>{data.contactInfo.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Phone:</span>
                <span>{data.contactInfo.phone}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Section */}
      {data.timeline && data.timeline.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-300 pb-2 mb-4">
            EVENT TIMELINE
          </h2>
          <div className="bg-slate-50 p-4 rounded">
            <div className="space-y-2">
              {data.timeline.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-1 border-b border-slate-200 last:border-b-0">
                  <span className="font-medium text-sm">{item.time}</span>
                  <span className="text-sm text-slate-600">{item.activity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Services Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-300 pb-2 mb-4">
          SERVICES & REQUIREMENTS
        </h2>
        <div className="space-y-3">
          {data.services.map((service, index) => (
            <div key={index} className="border border-slate-200 p-4 rounded">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-medium text-sm">{service.name}</h3>
                  {service.description && (
                    <p className="text-sm text-slate-600 mt-1">{service.description}</p>
                  )}
                  {service.quantity && (
                    <p className="text-xs text-slate-500 mt-1">Quantity: {service.quantity}</p>
                  )}
                </div>
                {showPricing && service.price && (
                  <div className="text-right">
                    <span className="font-semibold text-sm">{formatCurrency(service.price)}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Special Requests */}
      {data.specialRequests && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-300 pb-2 mb-4">
            SPECIAL REQUESTS
          </h2>
          <div className="bg-amber-50 border border-amber-200 p-4 rounded">
            <p className="text-sm text-slate-700">{data.specialRequests}</p>
          </div>
        </div>
      )}

      {/* Total Section */}
      {showPricing && data.totalAmount && (
        <div className="border-t-2 border-slate-300 pt-4">
          <div className="flex justify-end">
            <div className="bg-slate-100 p-4 rounded w-64">
              <div className="flex justify-between items-center">
                <span className="font-semibold">TOTAL AMOUNT:</span>
                <span className="text-lg font-bold">${data.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-slate-200 text-center">
        <p className="text-xs text-slate-500">
          This Banquet Event Order serves as a contract between {data.venue.name} and {data.clientName}.
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Please review all details carefully and contact us immediately with any questions or changes.
        </p>
        <div className="mt-4 text-xs text-slate-400">
          Generated on {format(new Date(), 'PPP')} • {data.venue.address}
        </div>
      </div>
    </div>
  );
}

// Example usage component for development
export function ExecutiveBEOPreview() {
  const sampleData: BEOData = {
    eventName: "Corporate Annual Gala",
    eventDate: "2025-03-15",
    eventTime: "6:00 PM - 11:00 PM",
    clientName: "Tech Innovations Inc.",
    contactInfo: {
      email: "events@techinnovations.com",
      phone: "(555) 123-4567"
    },
    venue: {
      name: "Grand Ballroom",
      address: "123 Event Plaza, New York, NY 10001"
    },
    guestCount: 150,
    setupStyle: "Theatre with Reception Area",
    services: [
      {
        name: "Audio/Visual Setup",
        description: "Professional sound system, microphones, projector and screen",
        quantity: 1,
        price: 750
      },
      {
        name: "Catering Service",
        description: "Three-course dinner with wine service",
        quantity: 150,
        price: 4500
      },
      {
        name: "Floral Arrangements",
        description: "Centerpieces and entrance decorations",
        quantity: 15,
        price: 800
      }
    ],
    timeline: [
      { time: "4:00 PM", activity: "Setup begins" },
      { time: "5:30 PM", activity: "Final preparations" },
      { time: "6:00 PM", activity: "Guest arrival and cocktail reception" },
      { time: "7:30 PM", activity: "Dinner service begins" },
      { time: "9:00 PM", activity: "Awards ceremony" },
      { time: "10:30 PM", activity: "Dancing and entertainment" },
      { time: "11:00 PM", activity: "Event concludes" }
    ],
    specialRequests: "Please ensure all dietary restrictions are accommodated. VIP area needed for board members.",
    totalAmount: 6050
  };

  return <ExecutiveBEOTemplate data={sampleData} showPricing={true} />;
}