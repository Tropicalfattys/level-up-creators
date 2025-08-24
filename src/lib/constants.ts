
export const pricingTiers = [
  {
    tier: 'basic' as const,
    name: 'Basic',
    description: 'Free tier with basic features',
    features: ['Basic listing', 'Admin approval required', 'Up to 2 services']
  },
  {
    tier: 'mid' as const,
    name: 'Premium',
    description: 'Enhanced features for growing creators',
    features: ['Priority placement', 'Enhanced profile', 'Up to 10 services', 'Analytics']
  },
  {
    tier: 'pro' as const,
    name: 'Pro',
    description: 'Full-featured tier for professional creators',
    features: ['Featured listing', 'Video intro', 'Priority support', 'Unlimited services', 'Advanced analytics']
  }
];
