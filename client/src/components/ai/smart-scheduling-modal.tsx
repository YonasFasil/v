import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, Users, Zap, AlertTriangle } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, addDays } from "date-fns";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventData?: {
    eventType: string;
    guestCount: number;
    duration: number;
  };
}

export function SmartSchedulingModal({ open, onOpenChange, eventData }: Props) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    eventType: eventData?.eventType || "",
    guestCount: eventData?.guestCount || 50,
    duration: eventData?.duration || 4,
    venuePreferences: []
  });

  const generateScheduling = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/ai/smart-scheduling", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Smart Scheduling Generated",
        description: `Found ${data.recommendedSlots?.length || 0} optimal time slots`
      });
    }
  });

  const handleGenerate = () => {
    generateScheduling.mutate(formData);
  };

  const schedulingData = generateScheduling.data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Smart Scheduling
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">AI</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Event Type</Label>
                  <Select value={formData.eventType} onValueChange={(value) => setFormData(prev => ({...prev, eventType: value}))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="corporate">Corporate Event</SelectItem>
                      <SelectItem value="wedding">Wedding</SelectItem>
                      <SelectItem value="birthday">Birthday Party</SelectItem>
                      <SelectItem value="conference">Conference</SelectItem>
                      <SelectItem value="gala">Gala</SelectItem>
                      <SelectItem value="networking">Networking Event</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Guest Count</Label>
                  <Input
                    type="number"
                    value={formData.guestCount}
                    onChange={(e) => setFormData(prev => ({...prev, guestCount: parseInt(e.target.value) || 0}))}
                    min="1"
                  />
                </div>

                <div>
                  <Label>Duration (hours)</Label>
                  <Input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({...prev, duration: parseInt(e.target.value) || 0}))}
                    min="1"
                    max="12"
                  />
                </div>

                <Button 
                  onClick={handleGenerate}
                  disabled={generateScheduling.isPending || !formData.eventType}
                  className="w-full"
                >
                  {generateScheduling.isPending ? "Generating..." : "Generate Smart Schedule"}
                </Button>
              </CardContent>
            </Card>

            {/* AI Disclaimer */}
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800">AI-Generated Suggestions</p>
                    <p className="text-sm text-amber-700">
                      These scheduling recommendations are AI-generated and should be verified against your actual venue availability and policies.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="space-y-4">
            {schedulingData && (
              <>
                {/* Recommended Time Slots */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Recommended Time Slots
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {schedulingData.recommendedSlots?.map((slot: any, index: number) => (
                        <div key={index} className="p-3 border rounded-lg hover:bg-gray-50">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium">{format(new Date(`${slot.date}T${slot.startTime}`), 'EEEE, MMM d')}</p>
                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {slot.startTime} - {slot.endTime}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {slot.confidence}% confidence
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700">{slot.reason}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* AI Insights */}
                {schedulingData.insights?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">AI Insights</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {schedulingData.insights.map((insight: string, index: number) => (
                          <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-blue-500">•</span>
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Alternative Options */}
                {schedulingData.alternativeOptions?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Alternative Considerations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {schedulingData.alternativeOptions.map((option: string, index: number) => (
                          <li key={index} className="text-sm text-gray-600">
                            • {option}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}