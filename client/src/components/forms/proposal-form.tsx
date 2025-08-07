import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProposalSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface ProposalFormProps {
  onSuccess?: () => void;
}

export function ProposalForm({ onSuccess }: ProposalFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: customers } = useQuery({
    queryKey: ["/api/customers"],
  });

  const { data: bookings } = useQuery({
    queryKey: ["/api/bookings"],
  });

  const form = useForm({
    resolver: zodResolver(insertProposalSchema.omit({ createdAt: true, sentAt: true, viewedAt: true })),
    defaultValues: {
      title: "",
      content: "",
      customerId: "",
      bookingId: "",
      totalAmount: "",
      status: "draft",
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    }
  });

  const generateAIProposal = async () => {
    try {
      setIsGenerating(true);
      
      const customerId = form.getValues("customerId");
      const bookingId = form.getValues("bookingId");
      
      if (!customerId) {
        toast({
          title: "Error",
          description: "Please select a customer first",
          variant: "destructive",
        });
        return;
      }

      const customer = customers?.find((c: any) => c.id === customerId);
      const booking = bookings?.find((b: any) => b.id === bookingId);

      const eventDetails = booking ? {
        eventName: booking.eventName,
        eventType: booking.eventType,
        eventDate: booking.eventDate,
        guestCount: booking.guestCount,
        startTime: booking.startTime,
        endTime: booking.endTime,
      } : {};

      const venueDetails = {
        name: "Premium Event Venue",
        capacity: booking?.guestCount || 100,
        amenities: ["Audio/Visual Equipment", "Catering Kitchen", "Dance Floor"]
      };

      const customerPreferences = {
        name: customer?.name,
        company: customer?.company,
        eventHistory: []
      };

      const response = await apiRequest("POST", "/api/proposals/generate", {
        eventDetails,
        venueDetails,
        customerPreferences
      });

      const result = await response.json();
      
      form.setValue("content", result.content);
      form.setValue("title", `Proposal for ${customer?.name} - ${booking?.eventName || "Event"}`);
      
      toast({
        title: "Success",
        description: "AI proposal generated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate proposal",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      
      const proposalData = {
        ...data,
        validUntil: data.validUntil instanceof Date ? data.validUntil : new Date(data.validUntil),
        totalAmount: data.totalAmount ? data.totalAmount.toString() : null,
      };

      await apiRequest("POST", "/api/proposals", proposalData);
      await queryClient.invalidateQueries({ queryKey: ["/api/proposals"] });
      
      toast({
        title: "Success",
        description: "Proposal created successfully",
      });
      
      form.reset();
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create proposal",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="customerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {customers?.map((customer: any) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} - {customer.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bookingId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Related Booking (Optional)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select booking" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {bookings?.map((booking: any) => (
                      <SelectItem key={booking.id} value={booking.id}>
                        {booking.eventName} - {booking.eventType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Proposal Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Wedding Reception Proposal for Johnson Family" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-between">
          <FormLabel>Proposal Content</FormLabel>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={generateAIProposal}
            disabled={isGenerating}
          >
            {isGenerating ? "Generating..." : "🤖 Generate with AI"}
          </Button>
        </div>

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea 
                  placeholder="Enter your proposal content here, or use AI to generate it..."
                  rows={10}
                  className="min-h-[200px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="totalAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Amount (Optional)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    step="0.01"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="viewed">Viewed</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="validUntil"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valid Until</FormLabel>
                <FormControl>
                  <Input 
                    type="date" 
                    {...field}
                    value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value}
                    onChange={(e) => field.onChange(new Date(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={() => onSuccess?.()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
            {isSubmitting ? "Creating..." : "Create Proposal"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
