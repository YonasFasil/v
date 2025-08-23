// Shared timezone utilities for the venue management system
import { format, formatInTimeZone, fromZonedTime, toZonedTime } from 'date-fns-tz';
import { format as formatDate, parseISO, isValid } from 'date-fns';

// Common timezone configurations with display names
export const TIMEZONE_CONFIG = {
  // North America
  'America/New_York': {
    name: 'Eastern Time',
    abbr: 'ET',
    flag: '🇺🇸',
    utcOffset: -5, // Standard time offset (EST)
  },
  'America/Chicago': {
    name: 'Central Time',
    abbr: 'CT', 
    flag: '🇺🇸',
    utcOffset: -6, // Standard time offset (CST)
  },
  'America/Denver': {
    name: 'Mountain Time',
    abbr: 'MT',
    flag: '🇺🇸', 
    utcOffset: -7, // Standard time offset (MST)
  },
  'America/Los_Angeles': {
    name: 'Pacific Time',
    abbr: 'PT',
    flag: '🇺🇸',
    utcOffset: -8, // Standard time offset (PST)
  },
  'America/Anchorage': {
    name: 'Alaska Time',
    abbr: 'AKT',
    flag: '🇺🇸',
    utcOffset: -9, // Standard time offset (AKST)
  },
  'Pacific/Honolulu': {
    name: 'Hawaii Time',
    abbr: 'HST',
    flag: '🇺🇸',
    utcOffset: -10, // No DST in Hawaii
  },
  'America/Toronto': {
    name: 'Eastern Canada',
    abbr: 'ET',
    flag: '🇨🇦',
    utcOffset: -5,
  },
  'America/Vancouver': {
    name: 'Pacific Canada',
    abbr: 'PT',
    flag: '🇨🇦',
    utcOffset: -8,
  },
  'America/Mexico_City': {
    name: 'Mexico City',
    abbr: 'CST',
    flag: '🇲🇽',
    utcOffset: -6,
  },
  
  // Europe
  'Europe/London': {
    name: 'London',
    abbr: 'GMT/BST',
    flag: '🇬🇧',
    utcOffset: 0, // GMT, +1 during BST
  },
  'Europe/Paris': {
    name: 'Paris',
    abbr: 'CET/CEST',
    flag: '🇫🇷',
    utcOffset: 1, // CET, +1 during CEST
  },
  'Europe/Berlin': {
    name: 'Berlin',
    abbr: 'CET/CEST',
    flag: '🇩🇪',
    utcOffset: 1,
  },
  'Europe/Rome': {
    name: 'Rome',
    abbr: 'CET/CEST',
    flag: '🇮🇹',
    utcOffset: 1,
  },
  'Europe/Amsterdam': {
    name: 'Amsterdam',
    abbr: 'CET/CEST',
    flag: '🇳🇱',
    utcOffset: 1,
  },
  'Europe/Madrid': {
    name: 'Madrid',
    abbr: 'CET/CEST',
    flag: '🇪🇸',
    utcOffset: 1,
  },
  'Europe/Stockholm': {
    name: 'Stockholm',
    abbr: 'CET/CEST',
    flag: '🇸🇪',
    utcOffset: 1,
  },
  'Europe/Zurich': {
    name: 'Zurich',
    abbr: 'CET/CEST',
    flag: '🇨🇭',
    utcOffset: 1,
  },
  
  // Asia Pacific
  'Asia/Tokyo': {
    name: 'Tokyo',
    abbr: 'JST',
    flag: '🇯🇵',
    utcOffset: 9,
  },
  'Asia/Shanghai': {
    name: 'Shanghai',
    abbr: 'CST',
    flag: '🇨🇳',
    utcOffset: 8,
  },
  'Asia/Singapore': {
    name: 'Singapore',
    abbr: 'SGT',
    flag: '🇸🇬',
    utcOffset: 8,
  },
  'Asia/Dubai': {
    name: 'Dubai',
    abbr: 'GST',
    flag: '🇦🇪',
    utcOffset: 4,
  },
  'Australia/Sydney': {
    name: 'Sydney',
    abbr: 'AEST/AEDT',
    flag: '🇦🇺',
    utcOffset: 10, // Standard time, +1 during daylight saving
  },
  'Australia/Melbourne': {
    name: 'Melbourne',
    abbr: 'AEST/AEDT',
    flag: '🇦🇺',
    utcOffset: 10,
  },
  'Pacific/Auckland': {
    name: 'Auckland',
    abbr: 'NZST/NZDT',
    flag: '🇳🇿',
    utcOffset: 12, // Standard time, +1 during daylight saving
  },
} as const;

export type TimezoneId = keyof typeof TIMEZONE_CONFIG;

// Get timezone configuration
export function getTimezoneConfig(timezoneId: string) {
  return TIMEZONE_CONFIG[timezoneId as TimezoneId] || TIMEZONE_CONFIG['America/New_York'];
}

// Format date in a specific timezone
export function formatInTimezone(
  date: Date | string, 
  timezoneId: string, 
  formatStr: string = 'PPP'
): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) {
      return 'Invalid Date';
    }
    return formatInTimeZone(dateObj, timezoneId, formatStr);
  } catch (error) {
    console.warn('Error formatting date in timezone:', error);
    return 'Invalid Date';
  }
}

// Format time in a specific timezone
export function formatTimeInTimezone(
  date: Date | string,
  timezoneId: string,
  includeTimezone: boolean = false
): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) {
      return 'Invalid Time';
    }
    
    const timeFormat = includeTimezone ? 'h:mm a zzz' : 'h:mm a';
    return formatInTimeZone(dateObj, timezoneId, timeFormat);
  } catch (error) {
    console.warn('Error formatting time in timezone:', error);
    return 'Invalid Time';
  }
}

// Format date and time in a specific timezone
export function formatDateTimeInTimezone(
  date: Date | string,
  timezoneId: string,
  includeTimezone: boolean = false
): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) {
      return 'Invalid DateTime';
    }
    
    const formatStr = includeTimezone ? 'PPP h:mm a zzz' : 'PPP h:mm a';
    return formatInTimeZone(dateObj, timezoneId, formatStr);
  } catch (error) {
    console.warn('Error formatting datetime in timezone:', error);
    return 'Invalid DateTime';
  }
}

// Convert local time to UTC for storage
export function convertToUtc(
  localDate: Date | string,
  timezoneId: string
): Date {
  try {
    const dateObj = typeof localDate === 'string' ? parseISO(localDate) : localDate;
    if (!isValid(dateObj)) {
      throw new Error('Invalid date provided');
    }
    return fromZonedTime(dateObj, timezoneId);
  } catch (error) {
    console.warn('Error converting to UTC:', error);
    return new Date(); // Return current date as fallback
  }
}

// Convert UTC time to local timezone
export function convertFromUtc(
  utcDate: Date | string,
  timezoneId: string
): Date {
  try {
    const dateObj = typeof utcDate === 'string' ? parseISO(utcDate) : utcDate;
    if (!isValid(dateObj)) {
      throw new Error('Invalid date provided');
    }
    return toZonedTime(dateObj, timezoneId);
  } catch (error) {
    console.warn('Error converting from UTC:', error);
    return new Date(); // Return current date as fallback
  }
}

// Get current time in a specific timezone
export function getCurrentTimeInTimezone(timezoneId: string): Date {
  return toZonedTime(new Date(), timezoneId);
}

// Get timezone display string
export function getTimezoneDisplay(timezoneId: string): string {
  const config = getTimezoneConfig(timezoneId);
  return `${config.flag} ${config.name} (${config.abbr})`;
}

// Get list of all timezones for dropdowns
export function getTimezoneOptions(): Array<{
  value: string;
  label: string;
  region: string;
}> {
  const options: Array<{value: string; label: string; region: string}> = [];
  
  Object.entries(TIMEZONE_CONFIG).forEach(([id, config]) => {
    const region = id.split('/')[0];
    options.push({
      value: id,
      label: `${config.flag} ${config.name} (${config.abbr})`,
      region: region === 'America' ? 'North America' : 
              region === 'Europe' ? 'Europe' : 
              region === 'Asia' || region === 'Australia' || region === 'Pacific' ? 'Asia Pacific' : 
              'Other'
    });
  });
  
  return options.sort((a, b) => {
    // Sort by region first, then by label
    if (a.region !== b.region) {
      const regionOrder = ['North America', 'Europe', 'Asia Pacific', 'Other'];
      return regionOrder.indexOf(a.region) - regionOrder.indexOf(b.region);
    }
    return a.label.localeCompare(b.label);
  });
}

// Validate timezone ID
export function isValidTimezone(timezoneId: string): boolean {
  return timezoneId in TIMEZONE_CONFIG;
}

// Get business hours in local timezone (useful for venue availability)
export function getBusinessHours(
  timezoneId: string,
  startHour: number = 9,
  endHour: number = 17
): { start: Date; end: Date } {
  const now = getCurrentTimeInTimezone(timezoneId);
  const start = new Date(now);
  start.setHours(startHour, 0, 0, 0);
  
  const end = new Date(now);
  end.setHours(endHour, 0, 0, 0);
  
  return { start, end };
}

// Format event time range in timezone
export function formatEventTimeRange(
  startDate: Date | string,
  endDate: Date | string,
  timezoneId: string,
  includeTimezone: boolean = true
): string {
  try {
    const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
    const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
    
    if (!isValid(start) || !isValid(end)) {
      return 'Invalid time range';
    }
    
    const startTime = formatTimeInTimezone(start, timezoneId, false);
    const endTime = formatTimeInTimezone(end, timezoneId, includeTimezone);
    
    return `${startTime} - ${endTime}`;
  } catch (error) {
    console.warn('Error formatting event time range:', error);
    return 'Invalid time range';
  }
}