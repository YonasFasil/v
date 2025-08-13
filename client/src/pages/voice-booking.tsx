import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { 
  Mic, 
  Phone, 
  Sparkles, 
  CheckCircle, 
  Brain,
  Volume2,
  MessageSquare,
  Calendar,
  User,
  Clock
} from "lucide-react";
import { VoiceBookingPanel } from "../components/voice/voice-booking-panel";
import { CreateEventModal } from "../components/forms/create-event-modal";

export default function VoiceBookingPage() {
  const [showEventModal, setShowEventModal] = useState(false);
  const [voiceData, setVoiceData] = useState<any>(null);
  const [activeDemo, setActiveDemo] = useState<'booking' | 'call' | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleVoiceDataExtracted = (data: any) => {
    setVoiceData(data);
    setShowEventModal(true);
  };

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Processing",
      description: "Google Gemini AI processes speech and extracts booking details with high accuracy"
    },
    {
      icon: Volume2,
      title: "Real-Time Transcription",
      description: "Live speech-to-text conversion with intelligent error correction"
    },
    {
      icon: MessageSquare,
      title: "Context Understanding",
      description: "Understands natural language and booking context to extract relevant details"
    },
    {
      icon: CheckCircle,
      title: "Smart Form Population",
      description: "Automatically populates booking forms with extracted information"
    }
  ];

  const demoScenarios = [
    {
      type: 'booking',
      title: "Voice Booking Demo",
      description: "Staff member using voice to create a booking",
      example: "Corporate event for John Smith, john@company.com, March 15th at 6 PM, 50 guests, Grand Ballroom, need catering and sound system, budget around $5000"
    },
    {
      type: 'call',
      title: "Customer Call Demo", 
      description: "Capturing live customer conversation",
      example: "Hi, I'm interested in booking your venue for my daughter's wedding in June. We're expecting about 150 guests and would need the ceremony and reception spaces..."
    }
  ];

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
          title="AI Voice Booking System" 
          subtitle="Revolutionary voice-powered booking system using Google Gemini AI"
          onMobileMenuToggle={() => setMobileNavOpen(true)}
          onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          sidebarCollapsed={sidebarCollapsed}
        />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-6xl mx-auto space-y-6">
      {/* Feature Badges */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-4">
          <Badge variant="secondary" className="bg-purple-100 text-purple-700">
            <Sparkles className="w-4 h-4 mr-1" />
            AI-Powered
          </Badge>
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            <Brain className="w-4 h-4 mr-1" />
            Smart Processing
          </Badge>
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            <CheckCircle className="w-4 h-4 mr-1" />
            Auto-Population
          </Badge>
        </div>
      </div>

      {/* Key Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Key Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="text-center space-y-3">
                <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <feature.icon className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Demo Scenarios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-blue-600" />
            Try Voice Booking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="booking" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="booking" className="flex items-center gap-2">
                <Mic className="h-4 w-4" />
                Voice Booking
              </TabsTrigger>
              <TabsTrigger value="call" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Customer Call
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="booking" className="space-y-4">
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">Voice Booking Mode</h4>
                  <p className="text-blue-800 text-sm mb-3">
                    Perfect for staff members who want to create bookings hands-free while on calls or during busy periods.
                  </p>
                  <div className="text-xs text-blue-700 bg-blue-100 p-2 rounded">
                    <strong>Example:</strong> "{demoScenarios[0].example}"
                  </div>
                </div>
                <VoiceBookingPanel 
                  onBookingDataExtracted={handleVoiceDataExtracted}
                  isCallMode={false}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="call" className="space-y-4">
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-900 mb-2">Customer Call Capture</h4>
                  <p className="text-green-800 text-sm mb-3">
                    Automatically capture and process customer conversations to extract booking requirements and eliminate manual note-taking.
                  </p>
                  <div className="text-xs text-green-700 bg-green-100 p-2 rounded">
                    <strong>Example:</strong> "{demoScenarios[1].example}"
                  </div>
                </div>
                <VoiceBookingPanel 
                  onBookingDataExtracted={handleVoiceDataExtracted}
                  isCallMode={true}
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-green-600" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-red-600">1</span>
              </div>
              <h3 className="font-semibold">Record Voice/Call</h3>
              <p className="text-sm text-gray-600">Start recording voice input or customer call conversation</p>
            </div>
            
            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-orange-600">2</span>
              </div>
              <h3 className="font-semibold">AI Processing</h3>
              <p className="text-sm text-gray-600">Google Gemini AI analyzes speech and extracts booking details</p>
            </div>
            
            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-yellow-600">3</span>
              </div>
              <h3 className="font-semibold">Data Extraction</h3>
              <p className="text-sm text-gray-600">System identifies customer info, dates, requirements, and preferences</p>
            </div>
            
            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-green-600">4</span>
              </div>
              <h3 className="font-semibold">Form Population</h3>
              <p className="text-sm text-gray-600">Booking form automatically populated with extracted data</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Use Cases */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              For Venue Staff
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Create bookings hands-free while on phone calls</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Eliminate manual note-taking during busy periods</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Speed up booking creation process significantly</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Reduce errors from manual data entry</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-green-600" />
              For Customer Calls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Automatically capture call details in real-time</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Extract customer requirements without interruption</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Suggest follow-up actions based on conversation</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Never miss important details or customer preferences</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Voice Data Display */}
      {voiceData && (
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Sparkles className="h-5 w-5" />
              Latest Voice Data Extracted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              {voiceData.eventName && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  <span><strong>Event:</strong> {voiceData.eventName}</span>
                </div>
              )}
              {voiceData.customerName && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-purple-600" />
                  <span><strong>Customer:</strong> {voiceData.customerName}</span>
                </div>
              )}
              {voiceData.eventDate && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <span><strong>Date:</strong> {voiceData.eventDate}</span>
                </div>
              )}
            </div>
            <div className="mt-4">
              <Button 
                onClick={() => setShowEventModal(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Open Populated Booking Form
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Event Creation Modal with Pre-populated Data */}
      {showEventModal && (
        <CreateEventModal 
          open={showEventModal}
          onOpenChange={setShowEventModal}
        />
      )}
          </div>
        </main>
      </div>
    </div>
  );
}