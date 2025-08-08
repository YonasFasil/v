import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Star, TrendingUp, DollarSign, Clock, AlertTriangle, Target } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerData?: any;
}

export function LeadScoringModal({ open, onOpenChange, customerData }: Props) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    customerData: {
      name: customerData?.name || "",
      email: customerData?.email || "",
      company: customerData?.company || "",
      phone: customerData?.phone || "",
      eventType: "",
      guestCount: "",
      budget: "",
      eventDate: "",
      venue: "",
      timeline: "",
      previousEvents: "",
      referralSource: "",
      urgency: "medium"
    },
    interactionHistory: []
  });

  const [interactionText, setInteractionText] = useState("");

  const scoreLeadMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/ai/lead-score", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Lead Score Calculated",
        description: `Lead scored ${data.score}/100 (${data.category} priority)`
      });
    }
  });

  const handleScoreLead = () => {
    const interactions = interactionText.trim() 
      ? interactionText.split('\n').map(interaction => ({ 
          type: "note", 
          content: interaction.trim(),
          date: new Date().toISOString()
        }))
      : [];

    scoreLeadMutation.mutate({
      ...formData,
      interactionHistory: interactions
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBackground = (score: number) => {
    if (score >= 80) return "bg-green-100 border-green-200";
    if (score >= 60) return "bg-yellow-100 border-yellow-200";
    return "bg-red-100 border-red-200";
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "high": return <TrendingUp className="h-5 w-5 text-green-600" />;
      case "medium": return <Target className="h-5 w-5 text-yellow-600" />;
      case "low": return <Clock className="h-5 w-5 text-red-600" />;
      default: return <Star className="h-5 w-5" />;
    }
  };

  const scoringData = scoreLeadMutation.data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-blue-600" />
            Lead Scoring
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">AI</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm">Name</Label>
                    <Input
                      value={formData.customerData.name}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        customerData: {...prev.customerData, name: e.target.value}
                      }))}
                      placeholder="Customer name"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Company</Label>
                    <Input
                      value={formData.customerData.company}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        customerData: {...prev.customerData, company: e.target.value}
                      }))}
                      placeholder="Company name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm">Email</Label>
                    <Input
                      value={formData.customerData.email}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        customerData: {...prev.customerData, email: e.target.value}
                      }))}
                      placeholder="customer@email.com"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Phone</Label>
                    <Input
                      value={formData.customerData.phone}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        customerData: {...prev.customerData, phone: e.target.value}
                      }))}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm">Event Type</Label>
                    <Select value={formData.customerData.eventType} onValueChange={(value) => 
                      setFormData(prev => ({...prev, customerData: {...prev.customerData, eventType: value}}))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="wedding">Wedding</SelectItem>
                        <SelectItem value="corporate">Corporate Event</SelectItem>
                        <SelectItem value="birthday">Birthday Party</SelectItem>
                        <SelectItem value="conference">Conference</SelectItem>
                        <SelectItem value="gala">Gala</SelectItem>
                        <SelectItem value="networking">Networking</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm">Guest Count</Label>
                    <Input
                      value={formData.customerData.guestCount}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        customerData: {...prev.customerData, guestCount: e.target.value}
                      }))}
                      placeholder="50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm">Budget Range</Label>
                    <Select value={formData.customerData.budget} onValueChange={(value) => 
                      setFormData(prev => ({...prev, customerData: {...prev.customerData, budget: value}}))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select budget" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="under-5k">Under $5,000</SelectItem>
                        <SelectItem value="5k-10k">$5,000 - $10,000</SelectItem>
                        <SelectItem value="10k-25k">$10,000 - $25,000</SelectItem>
                        <SelectItem value="25k-50k">$25,000 - $50,000</SelectItem>
                        <SelectItem value="over-50k">Over $50,000</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm">Urgency</Label>
                    <Select value={formData.customerData.urgency} onValueChange={(value) => 
                      setFormData(prev => ({...prev, customerData: {...prev.customerData, urgency: value}}))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low - Exploring Options</SelectItem>
                        <SelectItem value="medium">Medium - Actively Planning</SelectItem>
                        <SelectItem value="high">High - Need to Book Soon</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-sm">Event Date</Label>
                  <Input
                    type="date"
                    value={formData.customerData.eventDate}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      customerData: {...prev.customerData, eventDate: e.target.value}
                    }))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Interaction History</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label className="text-sm">Notes & Interactions (one per line)</Label>
                  <Textarea
                    value={interactionText}
                    onChange={(e) => setInteractionText(e.target.value)}
                    placeholder="Responded quickly to initial inquiry&#10;Asked detailed questions about catering&#10;Mentioned budget flexibility&#10;Referred by previous client"
                    rows={4}
                  />
                </div>

                <Button 
                  onClick={handleScoreLead}
                  disabled={scoreLeadMutation.isPending || !formData.customerData.name}
                  className="w-full mt-4"
                >
                  {scoreLeadMutation.isPending ? "Analyzing Lead..." : "Calculate Lead Score"}
                </Button>
              </CardContent>
            </Card>

            {/* AI Disclaimer */}
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800">AI-Powered Analysis</p>
                    <p className="text-sm text-amber-700">
                      Lead scores are AI-generated estimates. Consider multiple factors and use your professional judgment for final decisions.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Scoring Results */}
          <div className="space-y-4">
            {scoringData && (
              <>
                {/* Lead Score Overview */}
                <Card className={`${getScoreBackground(scoringData.score)}`}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(scoringData.category)}
                        Lead Score
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {scoringData.category} Priority
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className={`text-4xl font-bold ${getScoreColor(scoringData.score)}`}>
                        {scoringData.score}/100
                      </div>
                      <Progress value={scoringData.score} className="mt-4" />
                      <p className="text-sm text-gray-600 mt-2">
                        Close Probability: {scoringData.closeProbability}%
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Priority Factors Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Score Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(scoringData.priorityFactors || {}).map(([factor, score]: [string, any]) => (
                        <div key={factor} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="capitalize">{factor.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                            <span className="font-medium">{score}/100</span>
                          </div>
                          <Progress value={score} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Estimated Value */}
                {scoringData.estimatedValue > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Revenue Potential
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        ${scoringData.estimatedValue?.toLocaleString()}
                      </div>
                      <p className="text-sm text-gray-600">Estimated event value</p>
                    </CardContent>
                  </Card>
                )}

                {/* Key Indicators */}
                {scoringData.keyIndicators?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Key Indicators</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {scoringData.keyIndicators.map((indicator: string, index: number) => (
                          <li key={index} className="text-sm flex items-start gap-2">
                            <span className="text-blue-500">•</span>
                            {indicator}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Recommended Actions */}
                {scoringData.recommendedActions?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Recommended Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {scoringData.recommendedActions.map((action: string, index: number) => (
                          <li key={index} className="text-sm flex items-start gap-2">
                            <span className="text-green-500">✓</span>
                            {action}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Reasoning */}
                {scoringData.reasoning && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">AI Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700">{scoringData.reasoning}</p>
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