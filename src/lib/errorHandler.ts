
import { toast } from 'sonner';
import { PostgrestError } from '@supabase/supabase-js';

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

export class ValidationError extends Error {
  constructor(public errors: string[]) {
    super(`Validation failed: ${errors.join(', ')}`);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class RateLimitError extends Error {
  constructor(message: string = 'Too many requests. Please try again later.') {
    super(message);
    this.name = 'RateLimitError';
  }
}

export const handleSupabaseError = (error: PostgrestError | Error): AppError => {
  console.error('Supabase error:', error);

  const appError: AppError = {
    code: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred. Please try again.',
    timestamp: new Date(),
    details: error
  };

  if ('code' in error && error.code) {
    switch (error.code) {
      case '23505': // Unique constraint violation
        appError.code = 'DUPLICATE_ENTRY';
        if (error.message.includes('email')) {
          appError.message = 'An account with this email already exists.';
        } else if (error.message.includes('handle')) {
          appError.message = 'This username is already taken. Please choose another.';
        } else {
          appError.message = 'This entry already exists.';
        }
        break;
      case '23503': // Foreign key constraint violation
        appError.code = 'INVALID_REFERENCE';
        appError.message = 'Referenced item does not exist.';
        break;
      case '42501': // Insufficient privilege
        appError.code = 'PERMISSION_DENIED';
        appError.message = 'You do not have permission to perform this action.';
        break;
      case 'PGRST116': // Row Level Security violation
        appError.code = 'ACCESS_DENIED';
        appError.message = 'Access denied. Please check your permissions.';
        break;
      case 'PGRST301': // Singular response expected
        appError.code = 'NOT_FOUND';
        appError.message = 'The requested item was not found.';
        break;
      default:
        appError.message = error.message || 'Database error occurred.';
    }
  } else if (error.message) {
    // Handle auth errors
    if (error.message.includes('Invalid login credentials')) {
      appError.code = 'INVALID_CREDENTIALS';
      appError.message = 'Invalid email or password. Please check your credentials.';
    } else if (error.message.includes('Email not confirmed')) {
      appError.code = 'EMAIL_NOT_CONFIRMED';
      appError.message = 'Please confirm your email address before signing in.';
    } else if (error.message.includes('signup_disabled')) {
      appError.code = 'SIGNUP_DISABLED';
      appError.message = 'Account creation is currently disabled.';
    } else if (error.message.includes('rate_limit')) {
      appError.code = 'RATE_LIMITED';
      appError.message = 'Too many attempts. Please wait before trying again.';
    } else {
      appError.message = error.message;
    }
  }

  return appError;
};

export const showErrorToast = (error: AppError | Error | string) => {
  let message: string;
  let title: string = 'Error';

  if (typeof error === 'string') {
    message = error;
  } else if (error instanceof ValidationError) {
    title = 'Validation Error';
    message = error.errors.join('\n');
  } else if (error instanceof AuthenticationError) {
    title = 'Authentication Required';
    message = error.message;
  } else if (error instanceof AuthorizationError) {
    title = 'Access Denied';
    message = error.message;
  } else if (error instanceof RateLimitError) {
    title = 'Rate Limited';
    message = error.message;
  } else if ('code' in error) {
    const appError = error as AppError;
    message = appError.message;
    
    switch (appError.code) {
      case 'DUPLICATE_ENTRY':
        title = 'Already Exists';
        break;
      case 'INVALID_CREDENTIALS':
        title = 'Sign In Failed';
        break;
      case 'EMAIL_NOT_CONFIRMED':
        title = 'Email Confirmation Required';
        break;
      case 'PERMISSION_DENIED':
      case 'ACCESS_DENIED':
        title = 'Access Denied';
        break;
      case 'NOT_FOUND':
        title = 'Not Found';
        break;
      case 'RATE_LIMITED':
        title = 'Rate Limited';
        break;
    }
  } else {
    message = error.message || 'An unexpected error occurred.';
  }

  toast.error(title, {
    description: message
  });
};

export const logError = (error: Error | AppError, context?: string) => {
  const errorData = {
    message: error.message,
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString(),
    context,
    ...(('code' in error) && { code: error.code }),
    ...(('details' in error) && { details: error.details })
  };

  console.error('Application Error:', errorData);
  
  // In production, you would send this to your error tracking service
  // Example: Sentry, LogRocket, etc.
};

export const withErrorHandling = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: string
) => {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      logError(error as Error, context);
      
      if (error instanceof ValidationError || 
          error instanceof AuthenticationError || 
          error instanceof AuthorizationError ||
          error instanceof RateLimitError) {
        throw error; // Re-throw custom errors
      }
      
      const appError = handleSupabaseError(error as Error);
      throw new Error(appError.message);
    }
  };
};
