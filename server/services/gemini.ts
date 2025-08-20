import { GoogleGenAI } from "@google/genai";
import { logger } from "./logger";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateAIInsights(analyticsData?: any): Promise<any[]> {
  try {
    const prompt = `Generate comprehensive AI-powered insights for venue management based on current data and industry trends.
    
    Analytics Data: ${JSON.stringify(analyticsData || {})}
    
    Focus on:
    - Revenue optimization opportunities
    - Booking pattern analysis
    - Customer satisfaction improvements
    - Market trend adaptations
    - Operational efficiency gains
    - Pricing strategy recommendations
    
    Return JSON array with detailed insights:
    [
      {
        "id": "unique_id",
        "type": "revenue/booking/customer/market/operation",
        "title": "Clear insight title",
        "description": "Detailed explanation",
        "priority": "high/medium/low",
        "actionable": true,
        "impact": "high/medium/low",
        "effort": "low/medium/high",
        "metrics": ["metric1", "metric2"],
        "recommendations": ["action1", "action2"],
        "expectedOutcome": "specific expected result",
        "timeframe": "immediate/short-term/long-term",
        "confidence": 85
      }
    ]`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              type: { type: "string" },
              title: { type: "string" },
              description: { type: "string" },
              priority: { type: "string" },
              actionable: { type: "boolean" },
              impact: { type: "string" },
              effort: { type: "string" },
              metrics: { type: "array", items: { type: "string" } },
              recommendations: { type: "array", items: { type: "string" } },
              expectedOutcome: { type: "string" },
              timeframe: { type: "string" },
              confidence: { type: "number" }
            },
            required: ["id", "type", "title", "description", "priority", "actionable"]
          }
        }
      },
      contents: prompt,
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    logger.error("Failed to generate AI insights", "gemini", { analyticsData }, error as Error);
    return [];
  }
}

export async function generateSmartScheduling(eventType: string, duration: number, guestCount?: number, venuePreferences?: string[]): Promise<any> {
  try {
    const prompt = `Generate smart scheduling recommendations for a ${eventType} event lasting ${duration} hours with ${guestCount || 'unspecified'} guests.
    
    Consider:
    - Optimal time slots based on event type
    - Venue utilization patterns
    - Guest attendance preferences
    - Seasonal factors
    - Day-of-week effectiveness
    
    Return JSON with:
    {
      "recommendedSlots": [
        {
          "date": "YYYY-MM-DD",
          "startTime": "HH:MM",
          "endTime": "HH:MM",
          "reason": "explanation",
          "confidence": 85
        }
      ],
      "insights": ["insight1", "insight2"],
      "alternativeOptions": ["option1", "option2"]
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            recommendedSlots: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  date: { type: "string" },
                  startTime: { type: "string" },
                  endTime: { type: "string" },
                  reason: { type: "string" },
                  confidence: { type: "number" }
                }
              }
            },
            insights: { type: "array", items: { type: "string" } },
            alternativeOptions: { type: "array", items: { type: "string" } }
          }
        }
      },
      contents: prompt,
    });

    return JSON.parse(response.text || '{"recommendedSlots":[],"insights":[],"alternativeOptions":[]}');
  } catch (error) {
    logger.error("Failed to generate smart scheduling", "gemini", { eventType, duration, guestCount }, error as Error);
    return {
      recommendedSlots: [],
      insights: ["Smart scheduling temporarily unavailable"],
      alternativeOptions: []
    };
  }
}

export async function generateEmailReply(customerMessage: string, context: string, customerData?: any): Promise<any> {
  try {
    const prompt = `Generate a professional, personalized email reply for a venue inquiry.
    
    Customer message: "${customerMessage}"
    Context: ${context}
    Customer data: ${JSON.stringify(customerData || {})}
    
    Create a response that:
    - Addresses their specific needs
    - Shows understanding of their event requirements
    - Provides relevant venue/service suggestions
    - Includes next steps and call-to-action
    - Maintains professional yet warm tone
    
    Return JSON with:
    {
      "subject": "Reply subject line",
      "body": "Full email body",
      "tone": "professional/friendly/formal",
      "nextSteps": ["action1", "action2"],
      "suggestedFollowUp": "when to follow up",
      "confidence": 90
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            subject: { type: "string" },
            body: { type: "string" },
            tone: { type: "string" },
            nextSteps: { type: "array", items: { type: "string" } },
            suggestedFollowUp: { type: "string" },
            confidence: { type: "number" }
          }
        }
      },
      contents: prompt,
    });

    return JSON.parse(response.text || '{"subject":"Re: Your Venue Inquiry","body":"Thank you for your inquiry. We\'ll get back to you soon.","tone":"professional","nextSteps":[],"suggestedFollowUp":"","confidence":50}');
  } catch (error) {
    logger.error("Failed to generate email reply", "gemini", { customerEmail, proposalData }, error as Error);
    return {
      subject: "Re: Your Venue Inquiry",
      body: "Thank you for your inquiry. We'll get back to you soon.",
      tone: "professional",
      nextSteps: [],
      suggestedFollowUp: "",
      confidence: 50
    };
  }
}

export async function scoreLeadPriority(leadData: any, interactionHistory?: any[]): Promise<any> {
  try {
    const prompt = `Analyze this lead and provide detailed scoring and insights:
    
    Lead Data: ${JSON.stringify(leadData)}
    Interaction History: ${JSON.stringify(interactionHistory || [])}
    
    Consider:
    - Budget indicators and spending capacity
    - Event size and complexity
    - Timeline urgency
    - Engagement level and responsiveness
    - Repeat customer potential
    - Revenue opportunity
    
    Return JSON with:
    {
      "score": 85,
      "category": "high/medium/low",
      "reasoning": "detailed explanation",
      "keyIndicators": ["indicator1", "indicator2"],
      "recommendedActions": ["action1", "action2"],
      "estimatedValue": 5000,
      "closeProbability": 75,
      "priorityFactors": {
        "budget": 90,
        "timeline": 70,
        "engagement": 85,
        "fitScore": 80
      }
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            score: { type: "number" },
            category: { type: "string" },
            reasoning: { type: "string" },
            keyIndicators: { type: "array", items: { type: "string" } },
            recommendedActions: { type: "array", items: { type: "string" } },
            estimatedValue: { type: "number" },
            closeProbability: { type: "number" },
            priorityFactors: {
              type: "object",
              properties: {
                budget: { type: "number" },
                timeline: { type: "number" },
                engagement: { type: "number" },
                fitScore: { type: "number" }
              }
            }
          }
        }
      },
      contents: prompt,
    });

    return JSON.parse(response.text || '{"score":50,"category":"medium","reasoning":"","keyIndicators":[],"recommendedActions":[],"estimatedValue":0,"closeProbability":50,"priorityFactors":{"budget":50,"timeline":50,"engagement":50,"fitScore":50}}');
  } catch (error) {
    logger.error("Failed to score lead priority", "gemini", { leadData }, error as Error);
    return {
      score: 50,
      category: "medium",
      reasoning: "Unable to analyze lead at this time",
      keyIndicators: [],
      recommendedActions: [],
      estimatedValue: 0,
      closeProbability: 50,
      priorityFactors: {
        budget: 50,
        timeline: 50,
        engagement: 50,
        fitScore: 50
      }
    };
  }
}

export async function generateProposal(eventDetails: any, venueInfo: any): Promise<string> {
  try {
    const prompt = `Generate a professional event proposal for:
    Event: ${JSON.stringify(eventDetails)}
    Venue: ${JSON.stringify(venueInfo)}
    
    Include executive summary, event details, pricing breakdown, terms, and next steps.
    Make it compelling and professional.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt,
    });

    return response.text || "Event proposal will be generated shortly.";
  } catch (error) {
    logger.error("Failed to generate proposal", "gemini", { eventType, requirements }, error as Error);
    return "Event proposal will be generated shortly.";
  }
}

export async function parseVoiceToBooking(transcript: string, context: string = "voice_booking"): Promise<any> {
  try {
    const prompt = `Parse this voice transcript and extract booking/event details. 
    Context: ${context}
    
    Transcript: "${transcript}"
    
    Extract and structure the following information from the voice input:
    - Event name/type (wedding, corporate, birthday, etc.)
    - Customer name and contact info
    - Event date and time (convert relative dates like "next Friday" to specific dates)
    - Number of guests
    - Venue preference
    - Services mentioned (catering, DJ, decorations, etc.)
    - Budget information if mentioned
    - Special requirements or notes
    
    For customer calls, also identify:
    - Urgency level
    - Questions asked by customer
    - Follow-up actions needed
    
    Return JSON format:
    {
      "eventName": "extracted event name",
      "eventType": "wedding/corporate/birthday/etc",
      "customerName": "customer name",
      "customerEmail": "email if mentioned",
      "customerPhone": "phone if mentioned",
      "eventDate": "YYYY-MM-DD or relative date",
      "eventTime": "HH:MM",
      "guestCount": number,
      "venue": "venue preference",
      "services": ["service1", "service2"],
      "budget": "budget amount or range",
      "specialRequirements": "any special notes",
      "urgency": "high/medium/low",
      "customerQuestions": ["question1", "question2"],
      "suggestedActions": ["action1", "action2"],
      "confidence": 85,
      "isCallCapture": ${context === "customer_call"}
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            eventName: { type: "string" },
            eventType: { type: "string" },
            customerName: { type: "string" },
            customerEmail: { type: "string" },
            customerPhone: { type: "string" },
            eventDate: { type: "string" },
            eventTime: { type: "string" },
            guestCount: { type: "number" },
            venue: { type: "string" },
            services: { type: "array", items: { type: "string" } },
            budget: { type: "string" },
            specialRequirements: { type: "string" },
            urgency: { type: "string" },
            customerQuestions: { type: "array", items: { type: "string" } },
            suggestedActions: { type: "array", items: { type: "string" } },
            confidence: { type: "number" },
            isCallCapture: { type: "boolean" }
          }
        }
      },
      contents: prompt,
    });

    const parsedData = JSON.parse(response.text || '{}');
    
    // Enhance with current date context for relative dates
    if (parsedData.eventDate && parsedData.eventDate.includes('next') || parsedData.eventDate.includes('this')) {
      parsedData.eventDate = `${parsedData.eventDate} (please verify specific date)`;
    }

    return parsedData;
  } catch (error) {
    logger.error("Failed to parse voice booking", "gemini", { transcript }, error as Error);
    return {
      eventName: "",
      eventType: "",
      customerName: "",
      confidence: 0,
      error: "Could not parse voice input"
    };
  }
}