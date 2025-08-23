import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
// import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageCircle, 
  X, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Calendar,
  Search,
  Plus,
  Sparkles,
  ChevronDown,
  ChevronUp,
  MapPin,
  Users,
  DollarSign,
  Package,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFormattedCurrency } from "@/lib/currency";
import { apiRequest } from "@/lib/queryClient";

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  actions?: ChatAction[];
  isLoading?: boolean;
  structuredData?: StructuredData;
}

interface ChatAction {
  type: 'create_booking' | 'search' | 'view_item';
  label: string;
  data: any;
}

interface StructuredData {
  type: 'venues' | 'packages' | 'services' | 'bookings';
  items: any[];
}

interface VenueCard {
  id?: string;
  name?: string;
  capacity?: number;
  pricePerHour?: number;
  location?: string;
  description?: string;
  amenities?: string[];
}

interface PackageCard {
  id?: string;
  name?: string;
  maxGuests?: number;
  basePrice?: number;
  description?: string;
  features?: string[];
  duration?: string;
  category?: string;
}

interface ServiceCard {
  id?: string;
  name?: string;
  basePrice?: number;
  unit?: string;
  description?: string;
  category?: string;
}

function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const superAdminToken = localStorage.getItem('super_admin_token');
      const regularToken = localStorage.getItem('auth_token');
      const token = superAdminToken || regularToken;
      
      if (!token) {
        setIsAuthenticated(false);
        return;
      }

      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const exp = payload.exp;
        
        if (exp && Date.now() >= exp * 1000) {
          setIsAuthenticated(false);
          return;
        }
        
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  return isAuthenticated;
}

export function FloatingChatbot() {
  const isAuthenticated = useAuth();
  const { formatAmount } = useFormattedCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: `initial-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'bot',
      content: "Hi! I'm your AI assistant. I can help you create bookings, search for events, packages, and services. What can I help you with today?",
      timestamp: new Date(),
      actions: [
        { type: 'create_booking', label: '📅 Create Booking', data: {} },
        { type: 'search', label: '🔍 Search Items', data: {} }
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const updateLastMessage = (updates: Partial<ChatMessage>) => {
    setMessages(prev => prev.map((msg, index) => 
      index === prev.length - 1 ? { ...msg, ...updates } : msg
    ));
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue("");

    // Add user message
    addMessage({
      type: 'user',
      content: userMessage
    });

    // Add loading bot message
    addMessage({
      type: 'bot',
      content: "",
      isLoading: true
    });

    setIsLoading(true);

    try {
      const response = await apiRequest('POST', '/api/ai/chat', {
        message: userMessage,
        context: {
          previousMessages: messages.slice(-5), // Send last 5 messages for context
          timestamp: new Date().toISOString()
        }
      });

      // Parse response for structured data
      let structuredData = null;
      let responseContent = response.message;
      
      // Check if the response contains structured data that should be displayed as cards
      if (response.data && Array.isArray(response.data)) {
        if (response.data.length > 0) {
          const firstItem = response.data[0];
          if (firstItem.capacity !== undefined && firstItem.pricePerHour !== undefined) {
            structuredData = { type: 'venues', items: response.data.slice(0, 6) };
          } else if (firstItem.maxGuests !== undefined && firstItem.basePrice !== undefined) {
            structuredData = { type: 'packages', items: response.data.slice(0, 6) };
          } else if (firstItem.unit !== undefined && firstItem.basePrice !== undefined) {
            structuredData = { type: 'services', items: response.data.slice(0, 6) };
          }
        }
      }

      // Update the loading message with the response
      updateLastMessage({
        content: responseContent,
        structuredData,
        actions: response.actions || [],
        isLoading: false
      });

    } catch (error) {
      console.error('Chat error:', error);
      updateLastMessage({
        content: "I'm sorry, I encountered an error. Please try again.",
        isLoading: false
      });
      
      toast({
        title: "Chat Error",
        description: "Failed to process your message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleActionClick = async (action: ChatAction) => {
    if (action.type === 'create_booking') {
      // Navigate to create event page or open booking modal
      window.location.href = '/events?create=true';
      
      addMessage({
        type: 'bot',
        content: `I've opened the booking creation page for you. You can create your event there with all the details we discussed.`,
      });
      
    } else if (action.type === 'search') {
      // Perform actual search
      setIsLoading(true);
      
      addMessage({
        type: 'user',
        content: `Search for: ${action.data.query || 'items'}`
      });

      // Add loading message
      addMessage({
        type: 'bot',
        content: "",
        isLoading: true
      });
      
      try {
        const searchResponse = await apiRequest('POST', '/api/ai/chat/search', {
          query: action.data.query || 'all',
          type: action.data.type
        });

        let searchResultsText = searchResponse.message;
        let structuredData = null;
        
        // Create structured data for visual display
        if (searchResponse.totalResults > 0) {
          const { results } = searchResponse;
          
          // Determine which type of data to display as cards
          if (results.venues.length > 0) {
            structuredData = {
              type: 'venues',
              items: results.venues.slice(0, 6) // Show up to 6 cards
            };
          } else if (results.packages.length > 0) {
            structuredData = {
              type: 'packages',
              items: results.packages.slice(0, 6)
            };
          } else if (results.services.length > 0) {
            structuredData = {
              type: 'services',
              items: results.services.slice(0, 6)
            };
          }
        }

        // Update the loading message with results
        updateLastMessage({
          content: searchResultsText,
          structuredData,
          isLoading: false,
          actions: searchResponse.totalResults > 0 ? [
            { type: 'create_booking', label: '📅 Book One of These', data: {} }
          ] : []
        });

      } catch (error) {
        console.error('Search error:', error);
        updateLastMessage({
          content: "I encountered an error while searching. Please try again.",
          isLoading: false
        });
      } finally {
        setIsLoading(false);
      }
      
    } else if (action.type === 'view_item') {
      // Handle viewing item details
      addMessage({
        type: 'bot',
        content: `Here are the details:\n\n${JSON.stringify(action.data, null, 2)}`,
        actions: action.data.confirmed ? [] : [
          { type: 'create_booking', label: '📅 Create Booking', data: action.data }
        ]
      });
    }
  };

  const getQuickActions = () => [
    { 
      label: "Book an event", 
      action: () => setInputValue("I want to book an event for next month")
    },
    { 
      label: "Search packages", 
      action: () => setInputValue("Show me available packages")
    },
    { 
      label: "Find venues", 
      action: () => setInputValue("What venues do you have available?")
    },
    { 
      label: "Check availability", 
      action: () => setInputValue("Check availability for this weekend")
    }
  ];

  // Render structured data as cards
  const renderStructuredData = (data: StructuredData) => {
    if (!data || !data.items || data.items.length === 0) return null;

    switch (data.type) {
      case 'venues':
        return (
          <div className="mt-3 space-y-2">
            <p className="text-xs font-semibold text-gray-600 mb-2">Available Venues</p>
            <div className="grid grid-cols-1 gap-2">
              {data.items.map((venue: VenueCard, index: number) => (
                <div key={venue.id || index} className="border rounded-lg p-3 bg-white hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm">{venue.name || 'Unnamed Venue'}</h4>
                      {venue.description && (
                        <p className="text-xs text-gray-600 mt-1" style={{display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>{venue.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-gray-500" />
                          <span className="text-xs text-gray-600">{venue.capacity || 0} guests</span>
                        </div>
                        {venue.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-gray-500" />
                            <span className="text-xs text-gray-600">{venue.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right ml-2">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-green-600" />
                        <span className="font-semibold text-sm text-green-600">{formatAmount(venue.pricePerHour || 0)}/hr</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
        
      case 'packages':
        return (
          <div className="mt-3 space-y-2">
            <p className="text-xs font-semibold text-gray-600 mb-2">Available Packages</p>
            <div className="grid grid-cols-1 gap-2">
              {data.items.map((pkg: PackageCard, index: number) => (
                <div key={pkg.id || index} className="border rounded-lg p-3 bg-white hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm">{pkg.name || 'Unnamed Package'}</h4>
                      {pkg.description && (
                        <p className="text-xs text-gray-600 mt-1" style={{display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>{pkg.description}</p>
                      )}
                      <div className="flex items-center gap-1 mt-2">
                        <Users className="w-3 h-3 text-gray-500" />
                        <span className="text-xs text-gray-600">Up to {pkg.maxGuests || 0} guests</span>
                      </div>
                      {pkg.features && pkg.features.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {pkg.features.slice(0, 3).map((feature, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs px-1 py-0">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right ml-2">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-green-600" />
                        <span className="font-semibold text-sm text-green-600">${pkg.basePrice || 0}+</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
        
      case 'services':
        return (
          <div className="mt-3 space-y-2">
            <p className="text-xs font-semibold text-gray-600 mb-2">Available Services</p>
            <div className="grid grid-cols-1 gap-2">
              {data.items.map((service: ServiceCard, index: number) => (
                <div key={service.id || index} className="border rounded-lg p-3 bg-white hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm">{service.name || 'Unnamed Service'}</h4>
                      {service.description && (
                        <p className="text-xs text-gray-600 mt-1" style={{display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>{service.description}</p>
                      )}
                      {service.category && (
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {service.category}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <div className="text-right ml-2">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-green-600" />
                        <span className="font-semibold text-sm text-green-600">
                          ${service.basePrice || 0} {service.unit || 'each'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-24 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 shadow-lg relative backdrop-blur-sm border border-white/20 transition-all duration-300 hover:scale-110"
          size="icon"
        >
          <MessageCircle className="w-6 h-6" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-sm" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-24 z-50">
      <Card className={`w-96 shadow-2xl transition-all duration-300 backdrop-blur-sm border border-white/20 ${
        isMinimized ? 'h-16' : 'h-[600px]'
      }`}>
        <CardHeader className="flex flex-row items-center justify-between p-4 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-t-lg backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">AI Assistant</CardTitle>
              <p className="text-xs opacity-90">Online & Ready to Help</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="p-0 flex flex-col h-[536px]">
            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-2 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.type === 'bot' && (
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-blue-600" />
                      </div>
                    )}
                    
                    <div className={`max-w-[80%] ${message.type === 'user' ? 'order-first' : ''}`}>
                      <div
                        className={`rounded-lg p-3 ${
                          message.type === 'user'
                            ? 'bg-blue-600 text-white ml-auto'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {message.isLoading ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm">Thinking...</span>
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            {message.structuredData && renderStructuredData(message.structuredData)}
                          </div>
                        )}
                      </div>
                      
                      {message.actions && message.actions.length > 0 && !message.isLoading && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {message.actions.map((action, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={() => handleActionClick(action)}
                            >
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      )}
                      
                      <p className="text-xs text-gray-500 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>

                    {message.type === 'user' && (
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            {messages.length === 1 && (
              <div className="p-4 border-t">
                <p className="text-sm text-gray-600 mb-2">Quick Actions:</p>
                <div className="grid grid-cols-2 gap-2">
                  {getQuickActions().map((action, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="text-xs justify-start"
                      onClick={action.action}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                  size="icon"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}