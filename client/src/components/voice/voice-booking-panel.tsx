import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff, 
  MessageSquare, 
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Calendar,
  MapPin,
  Users,
  DollarSign
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface VoiceBookingPanelProps {
  onBookingDataExtracted: (data: any) => void;
  isCallMode?: boolean;
}

export function VoiceBookingPanel({ onBookingDataExtracted, isCallMode = false }: VoiceBookingPanelProps) {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [callDuration, setCallDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

  const parseVoiceData = useMutation({
    mutationFn: async (voiceText: string) => {
      const response = await apiRequest("POST", "/api/ai/parse-voice", {
        transcript: voiceText,
        context: isCallMode ? "customer_call" : "voice_booking"
      });
      return response.json();
    },
    onSuccess: (data) => {
      setExtractedData(data);
      onBookingDataExtracted(data);
      toast({
        title: "Voice Data Processed",
        description: `Extracted booking details for ${data.eventName || 'new event'}`
      });
    },
    onError: () => {
      toast({
        title: "Processing Failed",
        description: "Could not process voice input. Please try again.",
        variant: "destructive"
      });
    }
  });

  useEffect(() => {
    if (isCallMode && isRecording) {
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    }

    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [isCallMode, isRecording]);

  const startRecording = async () => {
    try {
      // Start audio recording for call transcription
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      // Start voice recognition
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = '';
          let interimTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          setTranscript(prev => prev + finalTranscript);
        };

        recognitionRef.current.start();
      }

      setIsRecording(true);
      setCallDuration(0);
      
      toast({
        title: isCallMode ? "Call Recording Started" : "Voice Booking Started",
        description: isCallMode ? "Recording customer call..." : "Listening for booking details..."
      });

    } catch (error) {
      toast({
        title: "Recording Failed",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }

    setIsRecording(false);
    
    if (transcript.trim()) {
      setIsProcessing(true);
      parseVoiceData.mutate(transcript);
    }

    toast({
      title: isCallMode ? "Call Ended" : "Recording Stopped",
      description: "Processing voice data..."
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const clearSession = () => {
    setTranscript("");
    setExtractedData(null);
    setCallDuration(0);
    setIsProcessing(false);
  };

  return (
    <div className="space-y-4">
      {/* Voice Instructions */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            {isCallMode ? "Call Capture Instructions" : "Voice Booking Instructions"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-blue-800 space-y-2">
            <p className="font-medium">
              {isCallMode 
                ? "When a customer calls, start recording to capture their requirements:"
                : "Speak clearly and include these details for AI to create your booking:"
              }
            </p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li><strong>Event Type:</strong> "Corporate event", "Wedding", "Birthday party", etc.</li>
              <li><strong>Customer Info:</strong> "Customer name is John Smith, email john@company.com"</li>
              <li><strong>Date & Time:</strong> "Event on March 15th at 6 PM" or "Saturday evening"</li>
              <li><strong>Guest Count:</strong> "Expecting 50 guests" or "About 100 people"</li>
              <li><strong>Venue Preference:</strong> "Grand Ballroom" or "Main hall"</li>
              <li><strong>Services:</strong> "Need catering and sound system"</li>
              <li><strong>Budget:</strong> "Budget around $5000" (optional)</li>
            </ul>
            <p className="text-xs mt-3 font-medium">
              {isCallMode 
                ? "The AI will capture everything the customer says and suggest creating an event."
                : "Example: 'Corporate event for John Smith, john@company.com, March 15th at 6 PM, 50 guests, Grand Ballroom, need catering'"
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recording Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isCallMode ? <Phone className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              {isCallMode ? "Customer Call" : "Voice Booking"}
            </div>
            {isRecording && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <Badge variant="destructive">
                  {isCallMode ? "RECORDING CALL" : "LISTENING"}
                  {isCallMode && ` - ${formatTime(callDuration)}`}
                </Badge>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Recording Button */}
          <div className="flex justify-center">
            {!isRecording ? (
              <Button
                onClick={startRecording}
                size="lg"
                className={`${isCallMode 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
                } px-8`}
              >
                {isCallMode ? (
                  <>
                    <Phone className="w-5 h-5 mr-2" />
                    Start Call Recording
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5 mr-2" />
                    Start Voice Booking
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={stopRecording}
                size="lg"
                variant="destructive"
                className="px-8"
              >
                {isCallMode ? (
                  <>
                    <PhoneOff className="w-5 h-5 mr-2" />
                    End Call
                  </>
                ) : (
                  <>
                    <MicOff className="w-5 h-5 mr-2" />
                    Stop Recording
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Live Transcript */}
          {(isRecording || transcript) && (
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                {isCallMode ? "Customer Conversation" : "Voice Transcript"}
              </h4>
              <Textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder={isCallMode 
                  ? "Customer conversation will appear here as they speak..."
                  : "Your voice input will appear here..."
                }
                rows={6}
                className="font-mono text-sm"
              />
            </div>
          )}

          {/* Processing Status */}
          {isProcessing && (
            <div className="flex items-center gap-2 text-blue-600">
              <Clock className="w-4 h-4 animate-spin" />
              <span className="text-sm">Processing voice input with AI...</span>
            </div>
          )}

          {/* Extracted Data Preview */}
          {extractedData && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Extracted Booking Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {extractedData.eventName && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span><strong>Event:</strong> {extractedData.eventName}</span>
                    </div>
                  )}
                  {extractedData.customerName && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span><strong>Customer:</strong> {extractedData.customerName}</span>
                    </div>
                  )}
                  {extractedData.eventDate && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span><strong>Date:</strong> {extractedData.eventDate}</span>
                    </div>
                  )}
                  {extractedData.guestCount && (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span><strong>Guests:</strong> {extractedData.guestCount}</span>
                    </div>
                  )}
                  {extractedData.venue && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span><strong>Venue:</strong> {extractedData.venue}</span>
                    </div>
                  )}
                  {extractedData.budget && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      <span><strong>Budget:</strong> {extractedData.budget}</span>
                    </div>
                  )}
                </div>
                
                {extractedData.services && extractedData.services.length > 0 && (
                  <div className="mt-3">
                    <strong className="text-sm">Services Mentioned:</strong>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {extractedData.services.map((service: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-green-200">
                  <Button
                    onClick={() => onBookingDataExtracted(extractedData)}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {isCallMode ? "Create Event from Call" : "Open Booking Form"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          {(transcript || extractedData) && (
            <div className="flex gap-2">
              <Button
                onClick={clearSession}
                variant="outline"
                className="flex-1"
              >
                Clear Session
              </Button>
              {transcript && !isProcessing && !extractedData && (
                <Button
                  onClick={() => {
                    setIsProcessing(true);
                    parseVoiceData.mutate(transcript);
                  }}
                  className="flex-1"
                >
                  Process Voice Input
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Disclaimer */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Voice Recognition Notice</p>
              <p className="text-sm text-amber-700">
                Voice recognition accuracy may vary. Always review and verify extracted details before creating bookings.
                {isCallMode && " Call recordings are processed locally and not stored permanently."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}