import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateAIInsights(): Promise<any[]> {
  try {
    const prompt = `Generate 3 practical venue management insights for an event venue business. 
    Focus on booking optimization, customer satisfaction, and revenue growth.
    Return as JSON array with objects containing: type, title, description, priority (high/medium/low), actionable boolean.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string" },
              title: { type: "string" },
              description: { type: "string" },
              priority: { type: "string" },
              actionable: { type: "boolean" }
            },
            required: ["type", "title", "description", "priority", "actionable"]
          }
        }
      },
      contents: prompt,
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Gemini API error:", error);
    return [];
  }
}

export async function generateSmartScheduling(eventType: string, duration: number): Promise<string[]> {
  try {
    const prompt = `Suggest 5 optimal time slots for a ${eventType} event lasting ${duration} hours.
    Consider typical venue utilization patterns and customer preferences.
    Return as JSON array of time slot strings in format "YYYY-MM-DD HH:MM".`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const suggestions = response.text?.match(/"[\d-: ]+"/g) || [];
    return suggestions.map(s => s.replace(/"/g, ''));
  } catch (error) {
    console.error("Gemini scheduling error:", error);
    return [];
  }
}

export async function generateEmailReply(customerMessage: string, context: string): Promise<string> {
  try {
    const prompt = `Generate a professional email reply for a venue inquiry.
    Customer message: "${customerMessage}"
    Context: ${context}
    
    Write a friendly, helpful response that addresses their needs and encourages booking.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "Thank you for your inquiry. We'll get back to you soon.";
  } catch (error) {
    console.error("Gemini email error:", error);
    return "Thank you for your inquiry. We'll get back to you soon.";
  }
}

export async function scoreLeadPriority(leadData: any): Promise<number> {
  try {
    const prompt = `Score this lead from 1-100 based on likelihood to book and revenue potential:
    ${JSON.stringify(leadData)}
    
    Return only the numeric score.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const score = parseInt(response.text || "50");
    return Math.max(1, Math.min(100, score));
  } catch (error) {
    console.error("Gemini scoring error:", error);
    return 50;
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
    console.error("Gemini proposal error:", error);
    return "Event proposal will be generated shortly.";
  }
}