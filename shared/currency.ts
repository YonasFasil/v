// Global currency utility that applies business settings throughout the application

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  decimals: number;
}

// Common currency configurations
export const CURRENCY_CONFIGS: Record<string, CurrencyConfig> = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    decimals: 2
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    decimals: 2
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    decimals: 2
  },
  CAD: {
    code: 'CAD',
    symbol: 'C$',
    name: 'Canadian Dollar',
    decimals: 2
  },
  AUD: {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    decimals: 2
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen',
    decimals: 0
  },
  CHF: {
    code: 'CHF',
    symbol: 'CHF',
    name: 'Swiss Franc',
    decimals: 2
  },
  SEK: {
    code: 'SEK',
    symbol: 'kr',
    name: 'Swedish Krona',
    decimals: 2
  },
  NOK: {
    code: 'NOK',
    symbol: 'kr',
    name: 'Norwegian Krone',
    decimals: 2
  },
  DKK: {
    code: 'DKK',
    symbol: 'kr',
    name: 'Danish Krone',
    decimals: 2
  }
};

// Get currency configuration
export function getCurrencyConfig(currencyCode: string): CurrencyConfig {
  return CURRENCY_CONFIGS[currencyCode] || CURRENCY_CONFIGS.USD;
}

// Format currency amount
export function formatCurrency(
  amount: number | string, 
  currencyCode: string = 'USD',
  options: {
    showSymbol?: boolean;
    showCode?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {}
): string {
  const config = getCurrencyConfig(currencyCode);
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) return '';
  
  const {
    showSymbol = true,
    showCode = false,
    minimumFractionDigits = config.decimals,
    maximumFractionDigits = config.decimals
  } = options;
  
  // Format the number
  const formatted = numAmount.toLocaleString('en-US', {
    minimumFractionDigits,
    maximumFractionDigits
  });
  
  // Build the display string
  let result = '';
  
  if (showSymbol) {
    result = `${config.symbol}${formatted}`;
  } else {
    result = formatted;
  }
  
  if (showCode) {
    result = `${result} ${config.code}`;
  }
  
  return result;
}

// Parse currency string to number
export function parseCurrency(currencyString: string): number {
  // Remove all non-numeric characters except decimal point and minus
  const cleaned = currencyString.replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

// Get currency symbol only
export function getCurrencySymbol(currencyCode: string): string {
  return getCurrencyConfig(currencyCode).symbol;
}

// List of all available currencies for dropdowns
export function getCurrencyOptions(): Array<{value: string, label: string, symbol: string}> {
  return Object.values(CURRENCY_CONFIGS).map(config => ({
    value: config.code,
    label: `${config.name} (${config.symbol})`,
    symbol: config.symbol
  }));
}