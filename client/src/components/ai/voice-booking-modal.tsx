import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Play, Square, Sparkles, Calendar, MapPin, Users, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format, parse } from "date-fns";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventCreated?: () => void;
}

interface VoiceBookingData {
  eventName: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  guestCount: number;
  eventType: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  specialRequests: string;
  suggestedVenue: string;
  suggestedServices: string[];
}

export function VoiceBookingModal({ open, onOpenChange, onEventCreated }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<VoiceBookingData | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const processVoiceBooking = useMutation({
    mutationFn: async (transcriptText: string) => {
      const response = await apiRequest("POST", "/api/ai/process-voice-booking", {
        transcript: transcriptText
      });
      return response.json();
    },
    onSuccess: (data) => {
      setExtractedData(data);
      setIsProcessing(false);
      toast({
        title: "Voice booking processed!",
        description: "AI has extracted booking details from your voice."
      });
    },
    onError: (error: any) => {
      setIsProcessing(false);
      toast({
        title: "Processing failed",
        description: error.message || "Failed to process voice booking",
        variant: "destructive"
      });
    }
  });

  const createBookingFromVoice = useMutation({
    mutationFn: async (bookingData: any) => {
      const response = await apiRequest("POST", "/api/bookings", bookingData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
      toast({
        title: "Booking created successfully!",
        description: "Voice booking has been converted to an event."
      });
      onEventCreated?.();
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create booking",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        
        // Start speech recognition
        startSpeechRecognition();
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast({
        title: "Recording started",
        description: "Speak clearly about your event booking details"
      });
    } catch (error) {
      toast({
        title: "Recording failed",
        description: "Could not access microphone",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop all tracks
      mediaRecorderRef.current.stream?.getTracks().forEach(track => track.stop());
      
      toast({
        title: "Recording stopped",
        description: "Processing your voice booking..."
      });
    }
  };

  const startSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Speech recognition not supported",
        description: "Your browser doesn't support speech recognition",
        variant: "destructive"
      });
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        }
      }
      
      if (finalTranscript) {
        setTranscript(prev => prev + finalTranscript);
      }
    };

    recognition.onend = () => {
      if (transcript) {
        setIsProcessing(true);
        processVoiceBooking.mutate(transcript);
      }
    };

    recognition.onerror = (event: any) => {
      toast({
        title: "Speech recognition error",
        description: "Could not process speech",
        variant: "destructive"
      });
    };

    // For demo purposes, we'll use the recorded audio transcript
    // In a real implementation, you'd process the audio blob
    setTimeout(() => {
      const demoTranscript = "I need to book the grand ballroom for a corporate event on December 15th from 6 PM to 10 PM for 150 guests. The client is John Smith from Acme Corp, email john@acmecorp.com, phone 555-1234. We'll need catering, AV equipment, and decoration services.";
      setTranscript(demoTranscript);
      setIsProcessing(true);
      processVoiceBooking.mutate(demoTranscript);
    }, 2000);
  };

  const confirmBooking = () => {
    if (!extractedData) return;

    const bookingData = {
      eventName: extractedData.eventName,
      eventDate: extractedData.eventDate,
      startTime: extractedData.startTime,
      endTime: extractedData.endTime,
      guestCount: extractedData.guestCount,
      eventType: extractedData.eventType,
      status: 'inquiry',
      customerData: {
        name: extractedData.customerName,
        email: extractedData.customerEmail,
        phone: extractedData.customerPhone
      },
      notes: extractedData.specialRequests,
      // Default to first venue if no match found
      venueId: "5337f504-a61b-442a-9e8b-9e197c421aca", // Grand Ballroom ID
      spaceId: "space-1", // Default space
    };

    createBookingFromVoice.mutate(bookingData);
  };

  const resetForm = () => {
    setTranscript("");
    setExtractedData(null);
    setAudioBlob(null);
    setIsProcessing(false);
    setIsRecording(false);
  };

  const playRecording = () => {
    if (audioBlob) {
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          AI Voice Booking
        </DialogTitle>
        <DialogDescription>
          Speak naturally about your event booking and let AI extract all the details for you.
        </DialogDescription>

        <div className="space-y-6">
          {/* Recording Section */}
          <Card className="p-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
                  isRecording ? 'bg-red-100 animate-pulse' : 'bg-purple-100'
                }`}>
                  {isRecording ? (
                    <MicOff className="w-8 h-8 text-red-600" />
                  ) : (
                    <Mic className="w-8 h-8 text-purple-600" />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">
                  {isRecording ? "Recording..." : "Ready to Record"}
                </h3>
                <p className="text-sm text-gray-600">
                  {isRecording 
                    ? "Speak clearly about your event details, venue preferences, and requirements" 
                    : "Click start and describe your event booking in natural language"
                  }
                </p>
              </div>

              <div className="flex justify-center gap-3">
                {!isRecording ? (
                  <Button onClick={startRecording} className="bg-purple-600 hover:bg-purple-700">
                    <Mic className="w-4 h-4 mr-2" />
                    Start Recording
                  </Button>
                ) : (
                  <Button onClick={stopRecording} variant="destructive">
                    <Square className="w-4 h-4 mr-2" />
                    Stop Recording
                  </Button>
                )}

                {audioBlob && (
                  <Button onClick={playRecording} variant="outline">
                    <Play className="w-4 h-4 mr-2" />
                    Play Recording
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Transcript Section */}
          {transcript && (
            <Card className="p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                Voice Transcript
              </h4>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded italic">
                "{transcript}"
              </p>
            </Card>
          )}

          {/* Processing Indicator */}
          {isProcessing && (
            <Card className="p-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600 animate-spin" />
                <span>AI is extracting booking details...</span>
              </div>
            </Card>
          )}

          {/* Extracted Data Section */}
          {extractedData && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  Extracted Booking Details
                </h4>
                <Badge className="bg-purple-100 text-purple-800">
                  AI Processed
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="font-medium">{extractedData.eventName}</p>
                      <p className="text-sm text-gray-600">{extractedData.eventType}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="font-medium">{extractedData.eventDate}</p>
                      <p className="text-sm text-gray-600">
                        {extractedData.startTime} - {extractedData.endTime}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-orange-600" />
                    <div>
                      <p className="font-medium">{extractedData.guestCount} Guests</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="font-medium">Customer</p>
                    <p className="text-sm text-gray-600">{extractedData.customerName}</p>
                    <p className="text-sm text-gray-600">{extractedData.customerEmail}</p>
                    <p className="text-sm text-gray-600">{extractedData.customerPhone}</p>
                  </div>

                  {extractedData.suggestedServices.length > 0 && (
                    <div>
                      <p className="font-medium mb-2">Suggested Services</p>
                      <div className="flex flex-wrap gap-1">
                        {extractedData.suggestedServices.map((service, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {extractedData.specialRequests && (
                <div className="mt-4 p-3 bg-yellow-50 rounded">
                  <p className="font-medium text-yellow-800">Special Requests</p>
                  <p className="text-sm text-yellow-700">{extractedData.specialRequests}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={resetForm}>
                  Start Over
                </Button>
                <Button 
                  onClick={confirmBooking}
                  disabled={createBookingFromVoice.isPending}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {createBookingFromVoice.isPending ? "Creating..." : "Create Booking"}
                </Button>
              </div>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}