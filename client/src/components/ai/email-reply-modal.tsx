import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Copy, Send, AlertTriangle, CheckCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerEmail?: string;
  customerName?: string;
  initialMessage?: string;
}

export function EmailReplyModal({ open, onOpenChange, customerEmail, customerName, initialMessage }: Props) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    customerMessage: initialMessage || "",
    context: "",
    customerData: {
      name: customerName || "",
      email: customerEmail || "",
      company: "",
      eventType: "",
      guestCount: "",
      budget: "",
      eventDate: ""
    }
  });

  const generateEmailReply = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/ai/email-reply", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Email Reply Generated",
        description: `AI generated reply with ${data.confidence}% confidence`
      });
    }
  });

  const handleGenerate = () => {
    if (!formData.customerMessage.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter the customer's message",
        variant: "destructive"
      });
      return;
    }
    generateEmailReply.mutate(formData);
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to Clipboard",
      description: "Email content copied successfully"
    });
  };

  const replyData = generateEmailReply.data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            Auto Email Replies
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">AI</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Customer Message</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Customer's Email/Message</Label>
                  <Textarea
                    value={formData.customerMessage}
                    onChange={(e) => setFormData(prev => ({...prev, customerMessage: e.target.value}))}
                    placeholder="Paste the customer's inquiry here..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label>Additional Context</Label>
                  <Textarea
                    value={formData.context}
                    onChange={(e) => setFormData(prev => ({...prev, context: e.target.value}))}
                    placeholder="Any additional context about the inquiry, venue availability, special offers, etc."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
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
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm">Event Type</Label>
                    <Input
                      value={formData.customerData.eventType}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        customerData: {...prev.customerData, eventType: e.target.value}
                      }))}
                      placeholder="Wedding, Corporate, etc."
                    />
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

                <Button 
                  onClick={handleGenerate}
                  disabled={generateEmailReply.isPending || !formData.customerMessage.trim()}
                  className="w-full"
                >
                  {generateEmailReply.isPending ? "Generating Reply..." : "Generate AI Reply"}
                </Button>
              </CardContent>
            </Card>

            {/* AI Disclaimer */}
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800">AI-Generated Content</p>
                    <p className="text-sm text-amber-700">
                      Please review and customize the AI-generated reply before sending. Verify all details and pricing information.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Generated Reply */}
          <div className="space-y-4">
            {replyData && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      Generated Reply
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {replyData.confidence}% confidence
                        </Badge>
                        <Badge variant="outline" className="text-xs capitalize">
                          {replyData.tone}
                        </Badge>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Subject Line</Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded border relative group">
                        <p className="font-medium">{replyData.subject}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100"
                          onClick={() => handleCopyToClipboard(replyData.subject)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Email Body</Label>
                      <div className="mt-1 p-4 bg-gray-50 rounded border relative group">
                        <div className="whitespace-pre-wrap">{replyData.body}</div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                          onClick={() => handleCopyToClipboard(replyData.body)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleCopyToClipboard(`Subject: ${replyData.subject}\n\n${replyData.body}`)}
                        variant="outline"
                        className="flex-1"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Full Email
                      </Button>
                      <Button className="flex-1">
                        <Send className="h-4 w-4 mr-2" />
                        Open in Email Client
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Next Steps */}
                {replyData.nextSteps?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Recommended Next Steps</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {replyData.nextSteps.map((step: string, index: number) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                            {step}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Follow-up Suggestion */}
                {replyData.suggestedFollowUp && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Follow-up Reminder</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700">{replyData.suggestedFollowUp}</p>
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