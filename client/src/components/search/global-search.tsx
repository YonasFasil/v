import { useState, useEffect, useRef } from "react";
import { Search, Calendar, Package, Wrench, X, Clock, MapPin, DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface SearchResult {
  id: string;
  type: 'event' | 'service' | 'package' | 'venue' | 'customer';
  title: string;
  subtitle?: string;
  description?: string;
  metadata?: {
    date?: string;
    price?: number;
    status?: string;
    location?: string;
  };
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [, setLocation] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Search function with debouncing
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await apiRequest("GET", `/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        setResults(data.results || []);
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const handleResultClick = (result: SearchResult) => {
    // Navigate to the appropriate page based on result type
    switch (result.type) {
      case 'event':
        setLocation('/events');
        break;
      case 'service':
      case 'package':
        setLocation('/packages');
        break;
      case 'venue':
        setLocation('/venues');
        break;
      case 'customer':
        setLocation('/customers');
        break;
    }
    onClose();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'event':
        return <Calendar className="w-4 h-4" />;
      case 'service':
        return <Wrench className="w-4 h-4" />;
      case 'package':
        return <Package className="w-4 h-4" />;
      case 'venue':
        return <MapPin className="w-4 h-4" />;
      case 'customer':
        return <Calendar className="w-4 h-4" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'event':
        return 'bg-blue-100 text-blue-800';
      case 'service':
        return 'bg-green-100 text-green-800';
      case 'package':
        return 'bg-purple-100 text-purple-800';
      case 'venue':
        return 'bg-orange-100 text-orange-800';
      case 'customer':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search Everything
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              ref={inputRef}
              placeholder="Search events, services, packages, venues, customers..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-10"
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  onClose();
                }
              }}
            />
            {query && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => setQuery("")}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {isSearching && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
            </div>
          )}

          {!isSearching && query && results.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No results found for "{query}"</p>
              <p className="text-sm mt-1">Try searching for events, services, packages, or venues</p>
            </div>
          )}

          {!isSearching && results.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm text-gray-500 mb-3">
                Found {results.length} result{results.length !== 1 ? 's' : ''}
              </div>
              {results.map((result) => (
                <Card 
                  key={result.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleResultClick(result)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className={getTypeColor(result.type)}>
                            <span className="flex items-center gap-1">
                              {getTypeIcon(result.type)}
                              {result.type}
                            </span>
                          </Badge>
                        </div>
                        <h3 className="font-medium text-gray-900 mb-1">
                          {result.title}
                        </h3>
                        {result.subtitle && (
                          <p className="text-sm text-gray-600 mb-1">
                            {result.subtitle}
                          </p>
                        )}
                        {result.description && (
                          <p className="text-sm text-gray-500">
                            {result.description}
                          </p>
                        )}
                        {result.metadata && (
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            {result.metadata.date && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {result.metadata.date}
                              </div>
                            )}
                            {result.metadata.price && (
                              <div className="flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                ${result.metadata.price.toLocaleString()}
                              </div>
                            )}
                            {result.metadata.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {result.metadata.location}
                              </div>
                            )}
                            {result.metadata.status && (
                              <Badge variant="outline" className="text-xs">
                                {result.metadata.status}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!query && (
            <div className="space-y-4">
              <div className="text-sm text-gray-500 mb-3">
                Quick Search Tips
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="w-8 h-8 text-blue-600" />
                  <div>
                    <div className="font-medium text-sm">Events</div>
                    <div className="text-xs text-gray-500">Search by name, date, or type</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Package className="w-8 h-8 text-purple-600" />
                  <div>
                    <div className="font-medium text-sm">Packages</div>
                    <div className="text-xs text-gray-500">Find event packages and pricing</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Wrench className="w-8 h-8 text-green-600" />
                  <div>
                    <div className="font-medium text-sm">Services</div>
                    <div className="text-xs text-gray-500">Search available services</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <MapPin className="w-8 h-8 text-orange-600" />
                  <div>
                    <div className="font-medium text-sm">Venues</div>
                    <div className="text-xs text-gray-500">Find venue spaces and capacity</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}