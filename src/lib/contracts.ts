// USDC Contract Addresses and Platform Configuration
export const USDC_CONTRACTS = {
  ethereum: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', 
  solana: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
} as const;

// Platform Escrow Wallet Addresses (hardcoded)
export const PLATFORM_WALLETS = {
  ethereum: '0x4DEe7D9fa0E3e232AF7EfDF809E1fA5AdF4af61B',
  base: '0x4DEe7D9fa0E3e232AF7EfDF809E1fA5AdF4af61B',
  solana: 'FeByoSMhWJpo4f6M333RvHAe7ssvDGkioGVJTNyN3ihg'
} as const;

// Creator Tier Pricing
export const STATIC_CREATOR_TIERS = {
  basic: { price: 0, displayName: 'Basic (Free)', features: ['Basic listing', 'Admin approval required'] },
  premium: { price: 25, displayName: 'Premium', features: ['Priority placement', 'Enhanced profile'] },
  enterprise: { price: 50, displayName: 'Enterprise', features: ['Featured listing', 'Video intro', 'Priority support'] }
};

// Export static tiers as CREATOR_TIERS for backward compatibility
export const CREATOR_TIERS = STATIC_CREATOR_TIERS;

// Standard ERC-20 ABI for USDC transfers
export const USDC_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)'
];
