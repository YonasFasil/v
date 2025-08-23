// Re-export everything from the shared currency system for backwards compatibility
export * from "@shared/currency";

// Import and re-export the hook from the shared hooks directory
import { useCurrency as useCurrencyHook, useCurrencyFormat } from "@/hooks/use-currency";
export { useCurrencyHook as useCurrency, useCurrencyFormat };

// Re-export timezone utilities for convenience
export * from "@shared/timezone";
import { useTimezone as useTimezoneHook, useTimezoneFormat as useTimezoneFormatHook, useEventTime as useEventTimeHook } from "@/hooks/use-timezone";
export { useTimezoneHook as useTimezone, useTimezoneFormatHook as useTimezoneFormat, useEventTimeHook as useEventTime };

// Compatibility wrapper for existing code
export function useFormattedCurrency() {
  const { format, getSymbol, currencyCode } = useCurrencyHook();

  return {
    formatAmount: (amount: number) => format(amount, { showSymbol: true }),
    getSymbol,
    currencyCode,
    locale: 'en-US' // Default locale for compatibility
  };
}