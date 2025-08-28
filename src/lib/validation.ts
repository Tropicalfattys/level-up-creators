
import { z } from 'zod';

// User validation schemas
export const handleSchema = z.string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be less than 30 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and dashes');

export const emailSchema = z.string()
  .email('Please enter a valid email address')
  .max(254, 'Email address is too long');

export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number');

export const referralCodeSchema = z.string()
  .regex(/^[A-Z0-9]{8}$/, 'Invalid referral code format')
  .optional();

// Service validation schemas
export const serviceSchema = z.object({
  title: z.string()
    .min(5, 'Service title must be at least 5 characters')
    .max(100, 'Service title must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_,.!?]+$/, 'Service title contains invalid characters'),
  description: z.string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description must be less than 2000 characters'),
  category: z.string()
    .min(1, 'Please select a category'),
  price_usdc: z.number()
    .min(10, 'Price must be at least $10 USDC')
    .max(10000, 'Price cannot exceed $10,000 USDC'),
  delivery_days: z.number()
    .int('Delivery days must be a whole number')
    .min(1, 'Delivery time must be at least 1 day')
    .max(365, 'Delivery time cannot exceed 365 days')
});

// Creator application validation
export const creatorApplicationSchema = z.object({
  headline: z.string()
    .min(10, 'Headline must be at least 10 characters')
    .max(150, 'Headline must be less than 150 characters'),
  category: z.string()
    .min(1, 'Please select a category'),
  bio: z.string()
    .min(50, 'Bio must be at least 50 characters')
    .max(1000, 'Bio must be less than 1000 characters'),
  intro_video_url: z.string()
    .url('Please enter a valid video URL')
    .optional()
    .or(z.literal('')),
  payout_address_eth: z.string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address')
    .optional()
    .or(z.literal('')),
  payout_address_sol: z.string()
    .regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, 'Invalid Solana address')
    .optional()
    .or(z.literal(''))
});

// Booking validation
export const bookingSchema = z.object({
  service_id: z.string().uuid('Invalid service ID'),
  usdc_amount: z.number()
    .min(10, 'Amount must be at least $10 USDC')
    .max(10000, 'Amount cannot exceed $10,000 USDC'),
  payment_address: z.string()
    .min(26, 'Invalid payment address')
    .max(62, 'Invalid payment address')
});

// Admin note validation
export const adminNoteSchema = z.object({
  note: z.string()
    .min(5, 'Note must be at least 5 characters')
    .max(500, 'Note must be less than 500 characters')
});

// Contact message validation
export const contactMessageSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s\-']+$/, 'Name contains invalid characters'),
  email: emailSchema,
  subject: z.string()
    .min(5, 'Subject must be at least 5 characters')
    .max(200, 'Subject must be less than 200 characters'),
  message: z.string()
    .min(20, 'Message must be at least 20 characters')
    .max(2000, 'Message must be less than 2000 characters')
});

// Review validation
export const reviewSchema = z.object({
  rating: z.number()
    .int('Rating must be a whole number')
    .min(1, 'Rating must be at least 1 star')
    .max(5, 'Rating cannot exceed 5 stars'),
  comment: z.string()
    .min(10, 'Review comment must be at least 10 characters')
    .max(500, 'Review comment must be less than 500 characters')
    .optional()
});

// Utility functions for validation
export const validateInput = <T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } => {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => err.message)
      };
    }
    return {
      success: false,
      errors: ['Validation failed']
    };
  }
};

// Rate limiting utility
export const createRateLimiter = (maxRequests: number, windowMs: number) => {
  const requests = new Map<string, number[]>();

  return (key: string): boolean => {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Get existing requests for this key
    const userRequests = requests.get(key) || [];
    
    // Filter out old requests outside the window
    const recentRequests = userRequests.filter(time => time > windowStart);
    
    // Check if user has exceeded the limit
    if (recentRequests.length >= maxRequests) {
      return false; // Rate limited
    }
    
    // Add this request
    recentRequests.push(now);
    requests.set(key, recentRequests);
    
    return true; // Allow request
  };
};

// Sanitization utilities
export const sanitizeString = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

export const sanitizeNumber = (input: any): number | null => {
  const num = Number(input);
  return isNaN(num) || !isFinite(num) ? null : num;
};
