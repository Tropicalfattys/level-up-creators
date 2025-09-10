
import { supabase } from "@/integrations/supabase/client";

// USDC Contract Addresses and Platform Configuration
export const USDC_CONTRACTS = {
  ethereum: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', 
  solana: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  bsc: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', // USDC on BSC
  sui: '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN', // USDC on Sui
  cardano: 'USDM' // USDM on Cardano
} as const;

// Platform Escrow Wallet Addresses (kept as fallback)
export const PLATFORM_WALLETS = {
  ethereum: '0x4DEe7D9fa0E3e232AF7EfDF809E1fA5AdF4af61B',
  base: '0x4DEe7D9fa0E3e232AF7EfDF809E1fA5AdF4af61B',
  solana: 'FeByoSMhWJpo4f6M333RvHAe7ssvDGkioGVJTNyN3ihg',
  bsc: '0x30D1Bbf45BEB26fA704114b3B876FD715D3ef505',
  sui: '0x7895d5b72e5df22e707149f31051e993ab304334191b84acbb14503134e4c95e',
  cardano: 'addr1q98rwvzkmzjw20zh6uzw4yvkzhhsnl9rtdf9xzdy6xn58ddphkx64axgy5x8argzpv6hzyker4g7nlxdll4fq8q3ajvsn24vy3'
} as const;

// Dynamic platform wallet fetcher
let cachedWallets: { [key: string]: string } | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getPlatformWallets = async (): Promise<{ [key: string]: string }> => {
  const now = Date.now();
  
  // Return cached wallets if cache is still valid
  if (cachedWallets && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedWallets;
  }
  
  try {
    const { data: wallets, error } = await supabase
      .from('platform_wallets')
      .select('network, wallet_address')
      .eq('active', true);
    
    if (error) throw error;
    
    // Convert to object format
    const walletsObject: { [key: string]: string } = {};
    wallets?.forEach(wallet => {
      walletsObject[wallet.network] = wallet.wallet_address;
    });
    
    // Update cache
    cachedWallets = walletsObject;
    cacheTimestamp = now;
    
    return walletsObject;
  } catch (error) {
    console.error('Failed to fetch platform wallets, using fallback:', error);
    // Return hardcoded fallback on error
    return { ...PLATFORM_WALLETS };
  }
};

// Helper function to get a specific wallet address
export const getPlatformWallet = async (network: string): Promise<string> => {
  const wallets = await getPlatformWallets();
  return wallets[network] || PLATFORM_WALLETS[network as keyof typeof PLATFORM_WALLETS] || '';
};

// Dynamic subscription wallet fetcher (separate from escrow wallets)
let cachedSubscriptionWallets: { [key: string]: string } | null = null;
let subscriptionCacheTimestamp: number = 0;

export const getSubscriptionWallets = async (): Promise<{ [key: string]: string }> => {
  const now = Date.now();
  
  // Return cached wallets if cache is still valid
  if (cachedSubscriptionWallets && (now - subscriptionCacheTimestamp) < CACHE_DURATION) {
    return cachedSubscriptionWallets;
  }
  
  try {
    const { data: wallets, error } = await supabase
      .from('subscription_wallets')
      .select('network, wallet_address')
      .eq('active', true);
    
    if (error) throw error;
    
    // Convert to object format
    const walletsObject: { [key: string]: string } = {};
    wallets?.forEach(wallet => {
      walletsObject[wallet.network] = wallet.wallet_address;
    });
    
    // Update cache
    cachedSubscriptionWallets = walletsObject;
    subscriptionCacheTimestamp = now;
    
    return walletsObject;
  } catch (error) {
    console.error('Failed to fetch subscription wallets, using fallback:', error);
    // Return hardcoded fallback on error
    return { ...PLATFORM_WALLETS };
  }
};

// Helper function to get a specific subscription wallet address
export const getSubscriptionWallet = async (network: string): Promise<string> => {
  const wallets = await getSubscriptionWallets();
  return wallets[network] || PLATFORM_WALLETS[network as keyof typeof PLATFORM_WALLETS] || '';
};

// Payment Method Options
export const PAYMENT_METHODS = {
  ethereum_usdc: { 
    network: 'ethereum', 
    currency: 'USDC', 
    displayName: 'USDC on Ethereum',
    chainId: 1
  },
  solana_usdc: { 
    network: 'solana', 
    currency: 'USDC', 
    displayName: 'USDC on Solana',
    chainId: null
  },
  bsc_usdc: { 
    network: 'bsc', 
    currency: 'USDC', 
    displayName: 'USDC on BSC',
    chainId: 56
  },
  sui_usdc: { 
    network: 'sui', 
    currency: 'USDC', 
    displayName: 'USDC on Sui',
    chainId: null
  },
  cardano_usdm: { 
    network: 'cardano', 
    currency: 'USDM', 
    displayName: 'USDM on Cardano',
    chainId: null
  }
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

// Network configuration for UI display
export const NETWORK_CONFIG = {
  ethereum: {
    name: 'Ethereum',
    icon: 'https://cpxqkiajkkeizsewhoel.supabase.co/storage/v1/object/public/Blockchain/eth_logo.png',
    explorerUrl: 'https://etherscan.io/tx/',
    color: 'bg-blue-500'
  },
  solana: {
    name: 'Solana',
    icon: 'https://cpxqkiajkkeizsewhoel.supabase.co/storage/v1/object/public/Blockchain/solana_logo.png',
    explorerUrl: 'https://solscan.io/tx/',
    color: 'bg-purple-600'
  },
  bsc: {
    name: 'BSC',
    icon: 'https://cpxqkiajkkeizsewhoel.supabase.co/storage/v1/object/public/Blockchain/BSC_logo.png',
    explorerUrl: 'https://bscscan.com/tx/',
    color: 'bg-yellow-500'
  },
  sui: {
    name: 'Sui',
    icon: 'https://cpxqkiajkkeizsewhoel.supabase.co/storage/v1/object/public/Blockchain/SUI_LOGO.png',
    explorerUrl: 'https://suiexplorer.com/txblock/',
    color: 'bg-cyan-500'
  },
  cardano: {
    name: 'Cardano',
    icon: 'https://cpxqkiajkkeizsewhoel.supabase.co/storage/v1/object/public/Blockchain/cardano_logo.png',
    explorerUrl: 'https://cardanoscan.io/transaction/',
    color: 'bg-indigo-600'
  }
} as const;
