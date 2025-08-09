import { apiRequest } from "./queryClient";

// Re-export apiRequest for external use
export { apiRequest };

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

// AI Features API
export const aiApi = {
  async generateSmartScheduling(
    eventType: string,
    guestCount: number,
    venueCapacity: number,
    existingBookings: any[]
  ): Promise<SmartSchedulingSuggestion> {
    const response = await apiRequest("POST", "/api/ai/smart-scheduling", {
      eventType,
      guestCount,
      venueCapacity,
      existingBookings
    });
    return response.json();
  },

  async generateEmailReply(
    emailContent: string,
    context: string,
    customerName: string
  ): Promise<EmailReply> {
    const response = await apiRequest("POST", "/api/ai/email-reply", {
      emailContent,
      context,
      customerName
    });
    return response.json();
  },

  async calculateLeadScore(
    customerData: any,
    interactionHistory: any[]
  ): Promise<LeadScoring> {
    const response = await apiRequest("POST", "/api/ai/lead-score", {
      customerData,
      interactionHistory
    });
    return response.json();
  },

  async getPredictiveAnalytics(
    historicalData: any[],
    currentMetrics: any
  ): Promise<PredictiveAnalytics> {
    const response = await apiRequest("POST", "/api/ai/predictive-analytics", {
      historicalData,
      currentMetrics
    });
    return response.json();
  }
};

// Venues API
export const venuesApi = {
  async getAll() {
    const response = await apiRequest("GET", "/api/venues");
    return response.json();
  },

  async getById(id: string) {
    const response = await apiRequest("GET", `/api/venues/${id}`);
    return response.json();
  }
};

// Customers API
export const customersApi = {
  async getAll() {
    const response = await apiRequest("GET", "/api/customers");
    return response.json();
  },

  async create(data: any) {
    const response = await apiRequest("POST", "/api/customers", data);
    return response.json();
  },

  async update(id: string, data: any) {
    const response = await apiRequest("PATCH", `/api/customers/${id}`, data);
    return response.json();
  }
};

// Bookings API
export const bookingsApi = {
  async getAll() {
    const response = await apiRequest("GET", "/api/bookings");
    return response.json();
  },

  async create(data: any) {
    const response = await apiRequest("POST", "/api/bookings", data);
    return response.json();
  },

  async update(id: string, data: any) {
    const response = await apiRequest("PATCH", `/api/bookings/${id}`, data);
    return response.json();
  }
};

// Proposals API
export const proposalsApi = {
  async getAll() {
    const response = await apiRequest("GET", "/api/proposals");
    return response.json();
  },

  async create(data: any) {
    const response = await apiRequest("POST", "/api/proposals", data);
    return response.json();
  },

  async generateWithAI(eventDetails: any, venueDetails: any, customerPreferences: any) {
    const response = await apiRequest("POST", "/api/proposals/generate", {
      eventDetails,
      venueDetails,
      customerPreferences
    });
    return response.json();
  }
};

// Payments API
export const paymentsApi = {
  async getAll() {
    const response = await apiRequest("GET", "/api/payments");
    return response.json();
  },

  async create(data: any) {
    const response = await apiRequest("POST", "/api/payments", data);
    return response.json();
  }
};

// Tasks API
export const tasksApi = {
  async getAll() {
    const response = await apiRequest("GET", "/api/tasks");
    return response.json();
  },

  async create(data: any) {
    const response = await apiRequest("POST", "/api/tasks", data);
    return response.json();
  },

  async update(id: string, data: any) {
    const response = await apiRequest("PATCH", `/api/tasks/${id}`, data);
    return response.json();
  }
};

// Dashboard API
export const dashboardApi = {
  async getMetrics() {
    const response = await apiRequest("GET", "/api/dashboard/metrics");
    return response.json();
  }
};
