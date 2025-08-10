import { useState } from "react";
import { format } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { Send, Mail, Eye } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProposalEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventData: {
    eventName: string;
    customerId: string;
    customerEmail: string;
    customerName: string;
    totalAmount: number;
    eventDates: Array<{
      date: Date;
      startTime: string;
      endTime: string;
      venue: string;
      space: string;
      guestCount: number;
    }>;
  };
  onProposalSent: () => void;
}

export function ProposalEmailModal({
  open,
  onOpenChange,
  eventData,
  onProposalSent
}: ProposalEmailModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [emailTo, setEmailTo] = useState(eventData.customerEmail);
  const [emailSubject, setEmailSubject] = useState(
    `Event Proposal: ${eventData.eventName}`
  );
  
  const [emailMessage, setEmailMessage] = useState(`Dear ${eventData.customerName},

Thank you for considering us for your upcoming event. We're excited to present you with a customized proposal for ${eventData.eventName}.

Event Details:
${eventData.eventDates.map(date => 
  `• ${format(date.date, 'MMMM d, yyyy')} from ${date.startTime} to ${date.endTime}
  Location: ${date.venue} - ${date.space}
  Guest Count: ${date.guestCount} guests`
).join('\n')}

Total Investment: $${eventData.totalAmount.toFixed(2)}

We've included all the details and pricing in your personalized proposal. You can view the complete proposal by clicking the link below:

[View Your Proposal]

We're committed to making your event exceptional and would be happy to discuss any questions you might have.

Best regards,
Venuine Events Team

---
This proposal is valid for 30 days from the date of this email.`);

  // Generate the HTML version of the email
  const generateHtmlContent = () => {
    const proposalUrl = `${window.location.origin}/proposals/view?token=PROPOSAL_TOKEN`;
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">Venuine Events</h1>
          <p style="margin: 5px 0 0 0; font-size: 16px;">Your Event Proposal</p>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
          <h2 style="color: #1f2937; margin-top: 0;">Dear ${eventData.customerName},</h2>
          
          <p style="color: #374151; line-height: 1.6;">Thank you for considering Venuine Events for your upcoming event. We're excited to present you with a customized proposal for <strong>${eventData.eventName}</strong>.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
            <h3 style="color: #1f2937; margin-top: 0;">Event Details</h3>
            ${eventData.eventDates.map(date => `
              <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #e5e7eb;">
                <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${format(date.date, 'MMMM d, yyyy')}</p>
                <p style="margin: 5px 0;"><strong>🕐 Time:</strong> ${date.startTime} - ${date.endTime}</p>
                <p style="margin: 5px 0;"><strong>📍 Location:</strong> ${date.venue} - ${date.space}</p>
                <p style="margin: 5px 0;"><strong>👥 Guest Count:</strong> ${date.guestCount} guests</p>
              </div>
            `).join('')}
            
            <div style="margin-top: 20px; padding: 15px; background: #ecfdf5; border-radius: 6px; border: 1px solid #10b981;">
              <p style="margin: 0; font-size: 18px; font-weight: bold; color: #065f46;">
                💰 Total Investment: $${eventData.totalAmount.toFixed(2)}
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${proposalUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              View Your Complete Proposal
            </a>
          </div>
          
          <p style="color: #374151; line-height: 1.6;">We're committed to making your event exceptional and would be happy to discuss any questions you might have.</p>
          
          <p style="color: #374151; line-height: 1.6;">
            Best regards,<br>
            <strong>Venuine Events Team</strong>
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
            <p>This proposal is valid for 30 days from the date of this email.</p>
            <p>Venuine Events | Professional Event Management</p>
          </div>
        </div>
      </div>
    `;
  };

  const sendProposal = useMutation({
    mutationFn: async () => {
      // First create the booking with proposal status
      const bookingData = {
        eventName: eventData.eventName,
        customerId: eventData.customerId,
        eventDates: eventData.eventDates,
        proposalStatus: 'sent',
        proposalSentAt: new Date(),
        totalAmount: eventData.totalAmount
      };
      
      const booking = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData)
      }).then(res => res.json());
      
      // Then send the email via Gmail
      await fetch("/api/gmail/send-proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: emailTo,
          customerName: eventData.customerName,
          proposalContent: generateHtmlContent(),
          totalAmount: eventData.totalAmount.toString(),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          companyName: 'Venuine Events'
        })
      }).then(res => res.json());
      
      return booking;
    },
    onSuccess: () => {
      toast({
        title: "Proposal Sent!",
        description: `Proposal email sent successfully to ${emailTo}`,
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/proposals"] });
      onProposalSent();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send Proposal",
        description: error.message || "Failed to send proposal. Please check your Gmail configuration.",
        variant: "destructive"
      });
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Proposal Email
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="compose" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="compose" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Compose
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="compose" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="email-to">To:</Label>
                <Input
                  id="email-to"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  placeholder="customer@example.com"
                />
              </div>
              
              <div>
                <Label htmlFor="email-subject">Subject:</Label>
                <Input
                  id="email-subject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Event Proposal: Your Event Name"
                />
              </div>
              
              <div>
                <Label htmlFor="email-message">Message:</Label>
                <Textarea
                  id="email-message"
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  rows={12}
                  className="font-mono text-sm"
                  placeholder="Your email message..."
                />
                <div className="text-xs text-slate-500 mt-1">
                  Tip: Use [View Your Proposal] as a placeholder for the proposal link button
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="preview" className="space-y-4">
            <div className="border rounded-lg p-4 bg-white">
              <div className="mb-4 pb-4 border-b">
                <div className="text-sm text-slate-600 mb-1">To: {emailTo}</div>
                <div className="text-sm text-slate-600 mb-1">Subject: {emailSubject}</div>
                <div className="text-sm text-slate-600">From: Venuine Events</div>
              </div>
              
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: generateHtmlContent() }}
              />
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={sendProposal.isPending}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => sendProposal.mutate()}
            disabled={sendProposal.isPending || !emailTo.trim() || !emailSubject.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="h-4 w-4 mr-2" />
            {sendProposal.isPending ? 'Sending...' : 'Send Proposal'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}