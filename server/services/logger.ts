/**
 * Centralized logging service
 * Provides structured logging with different levels
 */

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn', 
  INFO = 'info',
  DEBUG = 'debug'
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  service?: string;
  data?: any;
  error?: Error;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV !== 'production';

  private formatLog(entry: LogEntry): string {
    const { timestamp, level, service, message, data, error } = entry;
    let formatted = `[${timestamp}] ${level.toUpperCase()}`;
    
    if (service) {
      formatted += ` [${service}]`;
    }
    
    formatted += `: ${message}`;
    
    if (data) {
      formatted += ` | Data: ${JSON.stringify(data)}`;
    }
    
    if (error) {
      formatted += ` | Error: ${error.message}`;
      if (this.isDevelopment && error.stack) {
        formatted += `\n${error.stack}`;
      }
    }
    
    return formatted;
  }

  private createLogEntry(level: LogLevel, message: string, service?: string, data?: any, error?: Error): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      service,
      data,
      error
    };
  }

  error(message: string, service?: string, data?: any, error?: Error): void {
    const entry = this.createLogEntry(LogLevel.ERROR, message, service, data, error);
    console.error(this.formatLog(entry));
  }

  warn(message: string, service?: string, data?: any): void {
    const entry = this.createLogEntry(LogLevel.WARN, message, service, data);
    console.warn(this.formatLog(entry));
  }

  info(message: string, service?: string, data?: any): void {
    const entry = this.createLogEntry(LogLevel.INFO, message, service, data);
    console.log(this.formatLog(entry));
  }

  debug(message: string, service?: string, data?: any): void {
    if (this.isDevelopment) {
      const entry = this.createLogEntry(LogLevel.DEBUG, message, service, data);
      console.log(this.formatLog(entry));
    }
  }
}

export const logger = new Logger();