/**
 * Centralized error handling utilities to improve consistency and reliability
 * across the application.
 */

/**
 * Different categories of errors for consistent handling
 */
export enum ErrorCategory {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  NOT_FOUND = 'not_found',
  SERVER = 'server',
  DATABASE = 'database',
  OFFLINE = 'offline',
  UNKNOWN = 'unknown'
}

/**
 * Structured error object with additional metadata
 */
export interface AppError {
  message: string;
  category: ErrorCategory;
  code?: string;
  originalError?: any;
  retry?: () => Promise<any>;
  suggestions?: string[];
}

/**
 * Maps Supabase error codes to appropriate error categories
 */
const supabaseErrorMap: Record<string, ErrorCategory> = {
  'PGRST301': ErrorCategory.NOT_FOUND,
  'PGRST204': ErrorCategory.VALIDATION,
  '23505': ErrorCategory.VALIDATION, // Unique constraint violation
  '23503': ErrorCategory.VALIDATION, // Foreign key constraint
  '22P02': ErrorCategory.VALIDATION, // Invalid input syntax
  '23502': ErrorCategory.VALIDATION, // Not null violation
  '42P01': ErrorCategory.NOT_FOUND, // Undefined table
  '42P02': ErrorCategory.NOT_FOUND, // Undefined parameter
  '42501': ErrorCategory.AUTHORIZATION, // Insufficient privilege
  '42883': ErrorCategory.SERVER, // Undefined function
  '57014': ErrorCategory.SERVER, // Query canceled
  '53300': ErrorCategory.SERVER, // Too many connections
  '53100': ErrorCategory.SERVER, // Disk full
};

/**
 * Maps HTTP error status codes to appropriate error categories
 */
const httpErrorMap: Record<number, ErrorCategory> = {
  400: ErrorCategory.VALIDATION,
  401: ErrorCategory.AUTHENTICATION,
  403: ErrorCategory.AUTHORIZATION,
  404: ErrorCategory.NOT_FOUND,
  409: ErrorCategory.VALIDATION,
  422: ErrorCategory.VALIDATION,
  429: ErrorCategory.SERVER,
  500: ErrorCategory.SERVER,
  502: ErrorCategory.SERVER,
  503: ErrorCategory.SERVER,
  504: ErrorCategory.SERVER,
};

/**
 * Categorizes an error based on its properties
 * @param error The original error
 * @returns The appropriate error category
 */
export function categorizeError(error: any): ErrorCategory {
  if (!navigator.onLine) {
    return ErrorCategory.OFFLINE;
  }
  
  // Handle Supabase errors
  if (error?.code && supabaseErrorMap[error.code]) {
    return supabaseErrorMap[error.code];
  }
  
  // Handle HTTP errors
  if (error?.status && httpErrorMap[error.status]) {
    return httpErrorMap[error.status];
  }
  
  // Handle auth errors
  if (
    error?.message?.includes('auth') ||
    error?.message?.includes('token') ||
    error?.message?.includes('credential') ||
    error?.message?.includes('login')
  ) {
    return ErrorCategory.AUTHENTICATION;
  }
  
  // Handle network errors
  if (
    error?.message?.includes('network') ||
    error?.message?.includes('fetch') ||
    error?.message?.includes('connection') ||
    error instanceof TypeError
  ) {
    return ErrorCategory.NETWORK;
  }
  
  return ErrorCategory.UNKNOWN;
}

/**
 * Provides user-friendly error messages based on error category
 * @param error The error to get a message for
 * @returns A user-friendly error message
 */
export function getUserFriendlyMessage(error: any): string {
  const category = categorizeError(error);
  
  switch (category) {
    case ErrorCategory.NETWORK:
      return 'Network connection issue. Please check your internet connection and try again.';
    case ErrorCategory.OFFLINE:
      return 'You are currently offline. Some features may be unavailable.';
    case ErrorCategory.AUTHENTICATION:
      return 'Authentication failed. Please log in again.';
    case ErrorCategory.AUTHORIZATION:
      return 'You do not have permission to perform this action.';
    case ErrorCategory.VALIDATION:
      return error?.message || 'The information provided is invalid. Please check and try again.';
    case ErrorCategory.NOT_FOUND:
      return 'The requested information could not be found.';
    case ErrorCategory.SERVER:
      return 'The server encountered an error. Please try again later.';
    case ErrorCategory.DATABASE:
      return 'There was a database error. Please try again later.';
    default:
      return error?.message || 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Provides suggestions for resolving different types of errors
 * @param category The error category
 * @returns Array of suggestions for resolving the error
 */
export function getErrorSuggestions(category: ErrorCategory): string[] {
  switch (category) {
    case ErrorCategory.NETWORK:
      return [
        'Check your internet connection',
        'Try refreshing the page',
        'If the problem persists, contact support'
      ];
    case ErrorCategory.OFFLINE:
      return [
        'Connect to the internet to sync data',
        'You can continue working with limited functionality',
        'Your changes will be saved locally and synced when you reconnect'
      ];
    case ErrorCategory.AUTHENTICATION:
      return [
        'Try logging in again',
        'Clear your browser cache and cookies',
        'Contact support if the problem persists'
      ];
    case ErrorCategory.AUTHORIZATION:
      return [
        'Check if you have the necessary permissions',
        'Contact your administrator',
        'Try logging out and back in'
      ];
    case ErrorCategory.VALIDATION:
      return [
        'Check the information you provided',
        'Ensure all required fields are filled correctly',
        'Fix any highlighted errors and try again'
      ];
    case ErrorCategory.NOT_FOUND:
      return [
        'Check if the item was deleted',
        'Try searching with different criteria',
        'Return to the previous page'
      ];
    case ErrorCategory.SERVER:
    case ErrorCategory.DATABASE:
      return [
        'Try again in a few minutes',
        'Refresh the page',
        'Contact support if the problem persists'
      ];
    default:
      return [
        'Try again',
        'Refresh the page',
        'Contact support if the problem persists'
      ];
  }
}

/**
 * Creates a standardized app error object from any error
 * @param error The original error
 * @param retry Optional retry function
 * @returns Standardized AppError object
 */
export function createAppError(error: any, retry?: () => Promise<any>): AppError {
  const category = categorizeError(error);
  
  return {
    message: getUserFriendlyMessage(error),
    category,
    code: error?.code,
    originalError: error,
    retry,
    suggestions: getErrorSuggestions(category)
  };
}

/**
 * Logs errors to console with useful context
 * Can be extended to log to external services
 * @param error The error to log
 * @param context Additional context information
 */
export function logError(error: any, context?: Record<string, any>): void {
  const appError = error.category ? error : createAppError(error);
  
  console.error(
    `[ERROR][${appError.category}]${appError.code ? `[${appError.code}]` : ''}: ${appError.message}`,
    {
      ...context,
      originalError: appError.originalError
    }
  );
  
  // Here you could add integration with external logging services
  // like Sentry, LogRocket, etc.
}

/**
 * Determines if an operation should be retried based on the error
 * @param error The error to check
 * @returns Boolean indicating if retry is appropriate
 */
export function shouldRetryOperation(error: any): boolean {
  const category = categorizeError(error);
  
  // Retry for network, server and certain database errors
  return [
    ErrorCategory.NETWORK,
    ErrorCategory.SERVER,
    ErrorCategory.DATABASE
  ].includes(category);
}

/**
 * Executes an operation with automatic retries for certain error types
 * @param operation The async operation to execute
 * @param maxRetries Maximum number of retry attempts
 * @param delayMs Base delay between retries in milliseconds
 * @returns Promise resolving to the operation result
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (!shouldRetryOperation(error) || attempt === maxRetries) {
        break;
      }
      
      // Exponential backoff with jitter
      const jitter = Math.random() * 0.3 + 0.85; // Between 0.85 and 1.15
      const delay = delayMs * Math.pow(1.5, attempt) * jitter;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw createAppError(lastError);
}