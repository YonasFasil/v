import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Minus, 
  Check, 
  Mic, 
  MicOff, 
  User, 
  X, 
  Sparkles, 
  Bot, 
  Calendar as CalendarIcon, 
  MapPin, 
  Users as UsersIcon, 
  Clock,
  Wand2,
  MessageSquare,
  ArrowRight
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";

interface EnhancedEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const eventFormSchema = z.object({
  eventName: z.string().min(1, "Event name is required"),
  customerId: z.string().optional(),
  customerName: z.string().optional(),
  customerEmail: z.string().email().optional(),
  eventType: z.string().min(1, "Event type is required"),
  guestCount: z.number().min(1, "Guest count must be at least 1"),
  budget: z.number().optional(),
  specialRequests: z.string().optional(),
  isMultiDay: z.boolean().default(false),
  startDate: z.date(),
  endDate: z.date().optional()
});

type EventFormData = z.infer<typeof eventFormSchema>;

export function EnhancedEventModal({ open, onOpenChange }: EnhancedEventModalProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedEndDate, setSelectedEndDate] = useState<Date>();
  const [selectedTimes, setSelectedTimes] = useState({ start: "", end: "" });
  const [selectedVenue, setSelectedVenue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMultiDay, setIsMultiDay] = useState(false);
  
  // AI Assistant state
  const [aiAssistantMode, setAiAssistantMode] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [aiChatMessages, setAiChatMessages] = useState<Array<{type: 'user' | 'ai', content: string}>>([]);
  const [aiInput, setAiInput] = useState("");
  
  // Voice recording state
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");

  const { data: venues } = useQuery({
    queryKey: ["/api/venues"],
  });

  const { data: customers } = useQuery({
    queryKey: ["/api/customers"],
  });

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      eventName: "",
      eventType: "",
      guestCount: 50,
      budget: 0,
      specialRequests: "",
      isMultiDay: false,
      startDate: new Date(),
      endDate: undefined
    },
  });

  const eventTypes = [
    "Wedding", "Corporate Event", "Birthday Party", "Conference", 
    "Workshop", "Gala", "Fundraiser", "Product Launch", "Other"
  ];

  const timeSlots = [
    "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", 
    "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"
  ];

  // AI Assistant functions
  const generateAISuggestions = async () => {
    setIsProcessingAI(true);
    try {
      const eventType = form.getValues("eventType");
      const guestCount = form.getValues("guestCount");
      
      // Simulate AI API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const suggestions = [
        `For a ${eventType} with ${guestCount} guests, consider our Premium Ballroom`,
        `Based on similar events, afternoon slots (2-6 PM) are popular for ${eventType}s`,
        `Add premium catering and photography package for enhanced experience`,
        `Consider cocktail hour for networking - perfect for ${eventType} events`
      ];
      
      setAiSuggestions(suggestions);
    } catch (error) {
      toast({
        title: "AI Error",
        description: "Unable to generate suggestions",
        variant: "destructive"
      });
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleAiChat = async () => {
    if (!aiInput.trim()) return;
    
    const userMessage = aiInput.trim();
    setAiChatMessages(prev => [...prev, { type: 'user', content: userMessage }]);
    setAiInput("");
    setIsProcessingAI(true);

    try {
      // Simulate AI response
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const aiResponse = `Based on your request "${userMessage}", I suggest considering our Gold Package which includes premium amenities and can accommodate your requirements perfectly.`;
      
      setAiChatMessages(prev => [...prev, { type: 'ai', content: aiResponse }]);
    } catch (error) {
      toast({
        title: "AI Chat Error",
        description: "Unable to process your message",
        variant: "destructive"
      });
    } finally {
      setIsProcessingAI(false);
    }
  };

  const startVoiceRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Not supported",
        description: "Speech recognition is not supported in your browser",
        variant: "destructive"
      });
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    setIsListening(true);

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setVoiceTranscript(transcript);
    };

    recognition.onerror = () => {
      setIsListening(false);
      toast({
        title: "Voice Error",
        description: "Error occurred during voice recognition",
        variant: "destructive"
      });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const processVoiceInput = async () => {
    if (!voiceTranscript.trim()) return;

    try {
      // Parse the voice transcript and extract event details
      const lowerTranscript = voiceTranscript.toLowerCase();
      
      // Simple keyword extraction (in real app, use Gemini AI)
      if (lowerTranscript.includes('wedding')) {
        form.setValue("eventType", "Wedding");
      } else if (lowerTranscript.includes('corporate') || lowerTranscript.includes('business')) {
        form.setValue("eventType", "Corporate Event");
      } else if (lowerTranscript.includes('birthday')) {
        form.setValue("eventType", "Birthday Party");
      }

      // Extract guest count
      const guestMatch = lowerTranscript.match(/(\d+)\s*(guest|people|person)/);
      if (guestMatch) {
        form.setValue("guestCount", parseInt(guestMatch[1]));
      }

      toast({
        title: "Voice Input Processed",
        description: "Event details populated from voice input"
      });
    } catch (error) {
      toast({
        title: "Processing Failed",
        description: "Could not process voice input",
        variant: "destructive"
      });
    }
  };

  const onSubmit = async (data: EventFormData) => {
    if (!selectedDate || !selectedTimes.start || !selectedTimes.end || !selectedVenue) {
      toast({
        title: "Missing Information",
        description: "Please complete all required fields",
        variant: "destructive"
      });
      return;
    }

    // Multi-day validation
    if (isMultiDay && (!selectedEndDate || selectedEndDate <= selectedDate)) {
      toast({
        title: "Invalid Date Range",
        description: "End date must be after start date for multi-day events",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const eventData = {
        eventName: data.eventName,
        eventType: data.eventType,
        eventDate: selectedDate.toISOString(),
        endDate: isMultiDay && selectedEndDate ? selectedEndDate.toISOString() : null,
        startTime: selectedTimes.start,
        endTime: selectedTimes.end,
        guestCount: data.guestCount,
        venueId: selectedVenue,
        customerId: data.customerId,
        isMultiDay: isMultiDay,
        notes: data.specialRequests,
        totalAmount: data.budget?.toString() || "0"
      };

      console.log('Submitting event data:', eventData);
      await apiRequest("POST", "/api/bookings", eventData);
      await queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });

      toast({
        title: "Event Created",
        description: `Your ${isMultiDay ? 'multi-day ' : ''}event has been created successfully`
      });

      onOpenChange(false);
      form.reset();
      setCurrentStep(1);
      setSelectedDate(undefined);
      setSelectedEndDate(undefined);
      setSelectedTimes({ start: "", end: "" });
      setSelectedVenue("");
      setIsMultiDay(false);
    } catch (error: any) {
      console.error('Event creation error:', error);
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to create event",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="eventName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Event Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter event name..." 
                  className="border-gray-200 focus:border-blue-500 transition-colors"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="eventType"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Event Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="border-gray-200 focus:border-blue-500">
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {eventTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="guestCount"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Guest Count</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="Number of guests"
                  className="border-gray-200 focus:border-blue-500 transition-colors"
                  {...field}
                  onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="budget"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Budget (Optional)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="Event budget"
                  className="border-gray-200 focus:border-blue-500 transition-colors"
                  {...field}
                  onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="specialRequests"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium">Special Requests</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Any special requirements or notes..."
                className="border-gray-200 focus:border-blue-500 transition-colors min-h-[100px]"
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Voice Input Section */}
      <Card className="border-purple-200 bg-purple-50/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Mic className="w-5 h-5 text-purple-600" />
            Voice-to-Text Booking
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={isListening ? "destructive" : "outline"}
              size="sm"
              onClick={isListening ? () => setIsListening(false) : startVoiceRecording}
              disabled={isProcessingAI}
            >
              {isListening ? <MicOff className="w-4 h-4 mr-1" /> : <Mic className="w-4 h-4 mr-1" />}
              {isListening ? "Stop Recording" : "Start Speaking"}
            </Button>
            {voiceTranscript && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={processVoiceInput}
                disabled={isProcessingAI}
              >
                <Wand2 className="w-4 h-4 mr-1" />
                Process Voice
              </Button>
            )}
          </div>
          {voiceTranscript && (
            <div className="p-3 bg-white rounded border text-sm">
              <strong>Transcript:</strong> {voiceTranscript}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      {/* Multi-day toggle */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="multiDay"
          checked={isMultiDay}
          onChange={(e) => setIsMultiDay(e.target.checked)}
          className="rounded border-gray-300 focus:ring-blue-500"
        />
        <Label htmlFor="multiDay" className="text-sm font-medium cursor-pointer">
          Multi-day event
        </Label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <Label className="text-sm font-medium mb-3 block">
            {isMultiDay ? "Start Date" : "Event Date"}
          </Label>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={(date) => date < new Date()}
            className="rounded-md border border-gray-200"
          />
          
          {isMultiDay && (
            <div className="mt-4">
              <Label className="text-sm font-medium mb-3 block">End Date</Label>
              <Calendar
                mode="single"
                selected={selectedEndDate}
                onSelect={setSelectedEndDate}
                disabled={(date) => date < new Date() || (selectedDate && date <= selectedDate)}
                className="rounded-md border border-gray-200"
              />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Venue Space</Label>
            <Select value={selectedVenue} onValueChange={setSelectedVenue}>
              <SelectTrigger className="border-gray-200 focus:border-blue-500 mt-2">
                <SelectValue placeholder="Select venue space" />
              </SelectTrigger>
              <SelectContent>
                {venues?.map((venue: any) => (
                  <SelectItem key={venue.id} value={venue.id}>
                    {venue.name} (Capacity: {venue.capacity})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium">Start Time</Label>
              <Select 
                value={selectedTimes.start} 
                onValueChange={(value) => setSelectedTimes(prev => ({ ...prev, start: value }))}
              >
                <SelectTrigger className="border-gray-200 focus:border-blue-500 mt-2">
                  <SelectValue placeholder="Start" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">End Time</Label>
              <Select 
                value={selectedTimes.end} 
                onValueChange={(value) => setSelectedTimes(prev => ({ ...prev, end: value }))}
              >
                <SelectTrigger className="border-gray-200 focus:border-blue-500 mt-2">
                  <SelectValue placeholder="End" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedDate && selectedTimes.start && selectedTimes.end && selectedVenue && (
            <Card className="border-green-200 bg-green-50/30">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-green-700">
                  <Check className="w-4 h-4" />
                  <span className="text-sm font-medium">Booking Summary</span>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="w-3 h-3" />
                    {selectedDate.toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {selectedTimes.start} - {selectedTimes.end}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {venues?.find((v: any) => v.id === selectedVenue)?.name}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );

  const renderAIAssistant = () => (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Bot className="w-5 h-5 text-purple-600" />
          AI Event Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* AI Chat Messages */}
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {aiChatMessages.map((message, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg text-sm ${
                message.type === 'user'
                  ? 'bg-blue-100 text-blue-900 ml-8'
                  : 'bg-white text-gray-700 mr-8 border'
              }`}
            >
              {message.content}
            </div>
          ))}
          {isProcessingAI && (
            <div className="p-3 rounded-lg text-sm bg-gray-100 text-gray-600 mr-8 border">
              <div className="flex items-center gap-2">
                <div className="animate-spin w-3 h-3 border border-gray-400 border-t-transparent rounded-full" />
                AI is thinking...
              </div>
            </div>
          )}
        </div>

        {/* AI Input */}
        <div className="flex gap-2">
          <Input
            placeholder="Ask AI for suggestions..."
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAiChat()}
            className="flex-1"
            disabled={isProcessingAI}
          />
          <Button 
            onClick={handleAiChat} 
            size="sm"
            disabled={!aiInput.trim() || isProcessingAI}
          >
            <MessageSquare className="w-4 h-4" />
          </Button>
        </div>

        {/* AI Suggestions */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={generateAISuggestions}
          disabled={isProcessingAI}
          className="w-full"
        >
          <Sparkles className="w-4 h-4 mr-1" />
          {isProcessingAI ? "Generating..." : "Get AI Suggestions"}
        </Button>

        {aiSuggestions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-purple-700">AI Suggestions:</h4>
            {aiSuggestions.map((suggestion, index) => (
              <div key={index} className="p-2 bg-white rounded border text-xs text-gray-600">
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[900px] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-50 to-blue-50/20 p-4 sm:p-6">
        <DialogHeader className="space-y-4 pb-6">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Create New Event
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={aiAssistantMode ? "default" : "outline"}
                size="sm"
                onClick={() => setAiAssistantMode(!aiAssistantMode)}
                className={aiAssistantMode ? "bg-purple-600 hover:bg-purple-700" : ""}
              >
                <Sparkles className="w-4 h-4 mr-1" />
                AI Assistant
              </Button>
            </div>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 overflow-x-auto">
            <div className="flex items-center gap-1 whitespace-nowrap">
              <div className={`w-2 h-2 rounded-full ${currentStep >= 1 ? 'bg-blue-600' : 'bg-gray-300'}`} />
              <span className={currentStep >= 1 ? 'text-blue-600 font-medium' : ''}>Details</span>
            </div>
            <ArrowRight className="w-3 h-3 text-gray-400" />
            <div className="flex items-center gap-1 whitespace-nowrap">
              <div className={`w-2 h-2 rounded-full ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`} />
              <span className={currentStep >= 2 ? 'text-blue-600 font-medium' : ''}>Schedule</span>
            </div>
            <ArrowRight className="w-3 h-3 text-gray-400" />
            <div className="flex items-center gap-1 whitespace-nowrap">
              <div className={`w-2 h-2 rounded-full ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`} />
              <span className={currentStep >= 3 ? 'text-blue-600 font-medium' : ''}>Review</span>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div className={aiAssistantMode ? "lg:grid lg:grid-cols-3 lg:gap-6" : ""}>
                <div className={aiAssistantMode ? "lg:col-span-2" : ""}>
                  {currentStep === 1 && renderStep1()}
                  {currentStep === 2 && renderStep2()}
                </div>
                
                {aiAssistantMode && (
                  <div className="lg:col-span-1">
                    {renderAIAssistant()}
                  </div>
                )}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
                className="order-2 sm:order-1"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>

              {currentStep < 2 ? (
                <Button
                  type="button"
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="bg-blue-600 hover:bg-blue-700 order-1 sm:order-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700 order-1 sm:order-2 min-h-[44px]"
                >
                  {isSubmitting ? "Creating..." : "Create Event"}
                  <Check className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Speech Recognition API types
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}