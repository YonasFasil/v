import { useQuery } from "@tanstack/react-query";

// Currency configuration mapping
const CURRENCY_CONFIG = {
  USD: { symbol: '$', code: 'USD', locale: 'en-US' },
  EUR: { symbol: '€', code: 'EUR', locale: 'de-DE' },
  GBP: { symbol: '£', code: 'GBP', locale: 'en-GB' },
  CAD: { symbol: 'C$', code: 'CAD', locale: 'en-CA' },
  AUD: { symbol: 'A$', code: 'AUD', locale: 'en-AU' },
  JPY: { symbol: '¥', code: 'JPY', locale: 'ja-JP' }
};

// Hook to get current currency setting
export function useCurrency() {
  const { data: settings } = useQuery({
    queryKey: ['/api/settings'],
    retry: false,
  });

  const currencyCode = (settings as any)?.business?.currency || 'USD';
  const config = CURRENCY_CONFIG[currencyCode as keyof typeof CURRENCY_CONFIG] || CURRENCY_CONFIG.USD;

  return {
    currencyCode,
    symbol: config.symbol,
    locale: config.locale,
    config
  };
}

// Format amount with proper currency
export function formatCurrency(amount: number, currencyCode?: string, locale?: string) {
  const code = currencyCode || 'USD';
  const loc = locale || 'en-US';
  const config = CURRENCY_CONFIG[code as keyof typeof CURRENCY_CONFIG] || CURRENCY_CONFIG.USD;

  return new Intl.NumberFormat(loc, {
    style: 'currency',
    currency: config.code,
    minimumFractionDigits: config.code === 'JPY' ? 0 : 2
  }).format(amount);
}

// Get currency symbol only
export function getCurrencySymbol(currencyCode?: string) {
  const code = currencyCode || 'USD';
  const config = CURRENCY_CONFIG[code as keyof typeof CURRENCY_CONFIG] || CURRENCY_CONFIG.USD;
  return config.symbol;
}

// Hook for formatted currency display
export function useFormattedCurrency() {
  const { currencyCode, locale, config } = useCurrency();

  const formatAmount = (amount: number) => {
    return formatCurrency(amount, currencyCode, locale);
  };

  const getSymbol = () => config.symbol;

  return {
    formatAmount,
    getSymbol,
    currencyCode,
    locale
  };
}