import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface SmartSchedulingSuggestion {
  suggestedDate: string;
  suggestedTime: string;
  reason: string;
  confidence: number;
}

export interface EmailReply {
  subject: string;
  content: string;
  tone: "professional" | "friendly" | "formal";
}

export interface LeadScoring {
  score: number;
  factors: string[];
  priority: "low" | "medium" | "high" | "urgent";
  recommendation: string;
}

export interface PredictiveAnalytics {
  revenueForcast: number;
  bookingTrends: string[];
  recommendations: string[];
  confidence: number;
}

export async function generateSmartSchedulingSuggestion(
  eventType: string,
  guestCount: number,
  venueCapacity: number,
  existingBookings: any[]
): Promise<SmartSchedulingSuggestion> {
  try {
    const prompt = `Analyze the following event details and suggest optimal scheduling:
Event Type: ${eventType}
Guest Count: ${guestCount}
Venue Capacity: ${venueCapacity}
Existing Bookings: ${JSON.stringify(existingBookings)}

Please suggest the best date and time for this event, considering venue utilization, typical event patterns, and conflict avoidance. Respond in JSON format with suggestedDate, suggestedTime, reason, and confidence (0-1).`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert venue scheduling AI assistant. Provide optimal scheduling recommendations based on venue data and industry best practices."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return {
      suggestedDate: result.suggestedDate || new Date().toISOString().split('T')[0],
      suggestedTime: result.suggestedTime || "18:00",
      reason: result.reason || "Optimal time based on venue availability",
      confidence: Math.max(0, Math.min(1, result.confidence || 0.8))
    };
  } catch (error) {
    throw new Error("Failed to generate scheduling suggestion: " + (error as Error).message);
  }
}

export async function generateAutoEmailReply(
  emailContent: string,
  context: string,
  customerName: string
): Promise<EmailReply> {
  try {
    const prompt = `Generate a professional email reply for a venue management business:

Original Email: ${emailContent}
Context: ${context}
Customer Name: ${customerName}

Create a helpful, professional response that addresses their inquiry. Include subject line and email content. Respond in JSON format with subject, content, and tone fields.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional venue coordinator AI assistant. Generate helpful, accurate, and engaging email responses for venue inquiries."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return {
      subject: result.subject || "Re: Your Venue Inquiry",
      content: result.content || "Thank you for your inquiry. We'll get back to you shortly.",
      tone: result.tone || "professional"
    };
  } catch (error) {
    throw new Error("Failed to generate email reply: " + (error as Error).message);
  }
}

export async function calculateLeadScore(
  customerData: any,
  interactionHistory: any[]
): Promise<LeadScoring> {
  try {
    const prompt = `Analyze this lead and provide a scoring assessment:

Customer Data: ${JSON.stringify(customerData)}
Interaction History: ${JSON.stringify(interactionHistory)}

Score the lead from 0-100 based on engagement, budget potential, event size, and likelihood to book. Provide scoring factors and recommendations. Respond in JSON format with score, factors array, priority, and recommendation.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert sales AI that analyzes venue leads and provides accurate scoring based on conversion probability."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    const score = Math.max(0, Math.min(100, result.score || 50));
    
    let priority: "low" | "medium" | "high" | "urgent" = "medium";
    if (score >= 80) priority = "urgent";
    else if (score >= 60) priority = "high";
    else if (score >= 40) priority = "medium";
    else priority = "low";

    return {
      score,
      factors: result.factors || ["Initial inquiry received"],
      priority,
      recommendation: result.recommendation || "Follow up within 24 hours"
    };
  } catch (error) {
    throw new Error("Failed to calculate lead score: " + (error as Error).message);
  }
}

export async function generatePredictiveAnalytics(
  historicalData: any[],
  currentMetrics: any
): Promise<PredictiveAnalytics> {
  try {
    const prompt = `Analyze venue performance data and generate predictive insights:

Historical Data: ${JSON.stringify(historicalData)}
Current Metrics: ${JSON.stringify(currentMetrics)}

Forecast revenue trends, identify booking patterns, and provide actionable recommendations for the next quarter. Respond in JSON format with revenueForcast, bookingTrends array, recommendations array, and confidence.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a business intelligence AI specializing in venue management analytics and revenue forecasting."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return {
      revenueForcast: result.revenueForcast || 0,
      bookingTrends: result.bookingTrends || ["Steady growth expected"],
      recommendations: result.recommendations || ["Continue current strategy"],
      confidence: Math.max(0, Math.min(1, result.confidence || 0.7))
    };
  } catch (error) {
    throw new Error("Failed to generate predictive analytics: " + (error as Error).message);
  }
}

export async function generateProposal(
  eventDetails: any,
  venueDetails: any,
  customerPreferences: any
): Promise<string> {
  try {
    const prompt = `Generate a professional venue proposal:

Event Details: ${JSON.stringify(eventDetails)}
Venue Details: ${JSON.stringify(venueDetails)}
Customer Preferences: ${JSON.stringify(customerPreferences)}

Create a compelling, detailed proposal that includes venue features, pricing, packages, and next steps. Format as professional business proposal.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert proposal writer specializing in venue and event management. Create professional, persuasive proposals."
        },
        {
          role: "user",
          content: prompt
        }
      ],
    });

    return response.choices[0].message.content || "Proposal content could not be generated.";
  } catch (error) {
    throw new Error("Failed to generate proposal: " + (error as Error).message);
  }
}
