import { useQuery } from "@tanstack/react-query";
import { 
  formatInTimezone, 
  formatTimeInTimezone, 
  formatDateTimeInTimezone,
  formatEventTimeRange,
  convertToUtc,
  convertFromUtc,
  getCurrentTimeInTimezone,
  getTimezoneDisplay,
  getTimezoneOptions,
  isValidTimezone,
  type TimezoneId 
} from "@shared/timezone";

// Settings type
interface Settings {
  business?: {
    timezone?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

// Hook to get current timezone from business settings
export function useTimezone() {
  const { data: settings, isLoading } = useQuery<Settings>({
    queryKey: ["/api/settings"],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const timezoneId = settings?.business?.timezone || 'America/New_York';
  const validTimezone = isValidTimezone(timezoneId) ? timezoneId : 'America/New_York';

  return {
    timezoneId: validTimezone,
    isLoading,
    display: getTimezoneDisplay(validTimezone),
    
    // Format date in tenant's timezone
    formatDate: (date: Date | string, formatStr?: string) => 
      formatInTimezone(date, validTimezone, formatStr),
    
    // Format time in tenant's timezone
    formatTime: (date: Date | string, includeTimezone?: boolean) => 
      formatTimeInTimezone(date, validTimezone, includeTimezone),
    
    // Format date and time in tenant's timezone
    formatDateTime: (date: Date | string, includeTimezone?: boolean) => 
      formatDateTimeInTimezone(date, validTimezone, includeTimezone),
    
    // Format event time range in tenant's timezone
    formatTimeRange: (startDate: Date | string, endDate: Date | string, includeTimezone?: boolean) =>
      formatEventTimeRange(startDate, endDate, validTimezone, includeTimezone),
    
    // Convert local time to UTC for storage
    toUtc: (localDate: Date | string) => convertToUtc(localDate, validTimezone),
    
    // Convert UTC time to local timezone
    fromUtc: (utcDate: Date | string) => convertFromUtc(utcDate, validTimezone),
    
    // Get current time in tenant's timezone
    now: () => getCurrentTimeInTimezone(validTimezone),
    
    // Get timezone options for settings
    getOptions: getTimezoneOptions
  };
}

// Hook for timezone formatting only (doesn't trigger settings fetch if not needed)
export function useTimezoneFormat(date: Date | string, overrideTimezone?: string) {
  const { formatDateTime, timezoneId } = useTimezone();
  
  if (overrideTimezone && isValidTimezone(overrideTimezone)) {
    return formatDateTimeInTimezone(date, overrideTimezone);
  }
  
  return formatDateTime(date);
}

// Hook specifically for event times
export function useEventTime() {
  const { formatDate, formatTime, formatTimeRange, toUtc, fromUtc, timezoneId } = useTimezone();
  
  return {
    timezoneId,
    
    // Format event date
    formatEventDate: (date: Date | string) => formatDate(date, 'EEEE, MMMM d, yyyy'),
    
    // Format event time
    formatEventTime: (date: Date | string) => formatTime(date, false),
    
    // Format full event datetime
    formatEventDateTime: (date: Date | string) => 
      formatDate(date, 'EEEE, MMMM d, yyyy') + ' at ' + formatTime(date, false),
    
    // Format event time range
    formatEventTimeRange: (startDate: Date | string, endDate: Date | string) =>
      formatTimeRange(startDate, endDate, true),
    
    // Create UTC date from local event time (for saving to database)
    createEventDateTime: (date: string, time: string) => {
      try {
        // Combine date and time strings
        const dateTimeString = `${date}T${time}:00`;
        const localDateTime = new Date(dateTimeString);
        return toUtc(localDateTime);
      } catch (error) {
        console.warn('Error creating event datetime:', error);
        return new Date();
      }
    },
    
    // Convert stored UTC event time to local for display
    displayEventDateTime: (utcDateTime: Date | string) => fromUtc(utcDateTime)
  };
}