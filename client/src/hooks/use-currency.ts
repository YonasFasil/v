import { useQuery } from "@tanstack/react-query";
import { formatCurrency, getCurrencySymbol, getCurrencyOptions, type CurrencyConfig } from "@shared/currency";
import { apiRequest } from "@/lib/api";

// Settings type
interface Settings {
  business?: {
    currency?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

// Hook to get current currency from business settings
export function useCurrency() {
  const { data: settings, isLoading } = useQuery<Settings>({
    queryKey: ["/api/settings"],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const currencyCode = settings?.business?.currency || 'USD';

  return {
    currencyCode,
    symbol: getCurrencySymbol(currencyCode),
    isLoading,
    
    // Format currency with tenant's configured currency
    format: (amount: number | string, options?: {
      showSymbol?: boolean;
      showCode?: boolean;
      minimumFractionDigits?: number;
      maximumFractionDigits?: number;
    }) => formatCurrency(amount, currencyCode, options),
    
    // Get just the symbol
    getSymbol: () => getCurrencySymbol(currencyCode),
    
    // Get currency options for settings
    getOptions: getCurrencyOptions
  };
}

// Hook for currency formatting only (doesn't trigger settings fetch if not needed)
export function useCurrencyFormat(amount: number | string, overrideCurrency?: string) {
  const { format, currencyCode } = useCurrency();
  
  if (overrideCurrency) {
    return formatCurrency(amount, overrideCurrency);
  }
  
  return format(amount);
}