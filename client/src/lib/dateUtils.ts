import { format, isValid, parseISO } from "date-fns";

// Safe date formatting utility
export const formatEventDate = (dateValue: any, formatString: string, fallback: string = 'Invalid date'): string => {
  if (!dateValue) return fallback;
  
  let date: Date;
  
  // Handle different date formats
  if (typeof dateValue === 'string') {
    // Try parsing as ISO string first
    date = parseISO(dateValue);
    if (!isValid(date)) {
      // Try parsing as regular Date constructor
      date = new Date(dateValue);
    }
  } else if (dateValue instanceof Date) {
    date = dateValue;
  } else {
    console.warn('Invalid date value:', dateValue);
    return fallback;
  }
  
  // Validate the final date
  if (!isValid(date)) {
    console.warn('Invalid date after parsing:', dateValue);
    return fallback;
  }
  
  try {
    return format(date, formatString);
  } catch (error) {
    console.error('Date formatting error:', error, dateValue);
    return fallback;
  }
};

// Common date format presets
export const formatEventDateTime = (dateValue: any) => formatEventDate(dateValue, 'EEEE, MMMM d, yyyy', 'No date set');
export const formatEventDateShort = (dateValue: any) => formatEventDate(dateValue, 'MMM d, yyyy', 'TBD');
export const formatEventDateMedium = (dateValue: any) => formatEventDate(dateValue, 'MMM d', 'TBD');
export const formatEventTimestamp = (dateValue: any) => formatEventDate(dateValue, 'MMM d, h:mm a', 'No date');