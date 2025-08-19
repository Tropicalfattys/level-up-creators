
import { z } from 'zod';
import { validateInput, sanitizeString } from './validation';

// Enhanced wallet address schemas with stricter validation
export const walletAddressSchemas = {
  ethereum: z.string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format')
    .refine(
      (addr) => addr !== '0x0000000000000000000000000000000000000000',
      'Cannot use null address'
    ),
  solana: z.string()
    .regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, 'Invalid Solana address format')
    .refine(
      (addr) => !addr.startsWith('11111111111111111111111111111111'),
      'Cannot use system program address'
    )
};

export interface WalletValidationResult {
  isValid: boolean;
  address?: string;
  error?: string;
}

export const validateWalletAddress = (
  address: string,
  chain: 'ethereum' | 'base' | 'solana'
): WalletValidationResult => {
  try {
    const sanitizedAddress = sanitizeString(address);
    
    if (!sanitizedAddress || sanitizedAddress.length < 26) {
      return {
        isValid: false,
        error: 'Invalid address length'
      };
    }

    const schema = chain === 'solana' 
      ? walletAddressSchemas.solana 
      : walletAddressSchemas.ethereum;
    
    const validation = validateInput(schema, sanitizedAddress);
    
    if (validation.success === false) {
      return {
        isValid: false,
        error: validation.errors[0] || 'Invalid address format'
      };
    }

    return {
      isValid: true,
      address: sanitizedAddress
    };
  } catch (error) {
    return {
      isValid: false,
      error: 'Address validation failed'
    };
  }
};

export const getEscrowAddress = (chain: string): string => {
  const escrowAddresses = {
    ethereum: '0x4DEe7D9fa0E3e232AF7EfDF809E1fA5AdF4af61B',
    base: '0x4DEe7D9fa0E3e232AF7EfDF809E1fA5AdF4af61B',
    solana: 'FeByoSMhWJpo4f6M333RvHAe7ssvDGkioGVJTNyN3ihg'
  };
  
  return escrowAddresses[chain as keyof typeof escrowAddresses] || '';
};

// Security utility for transaction hash validation
export const validateTransactionHash = (txHash: string, chain: string): boolean => {
  if (!txHash || typeof txHash !== 'string') return false;
  
  if (chain === 'solana') {
    return /^[1-9A-HJ-NP-Za-km-z]{88}$/.test(txHash);
  } else {
    return /^0x[a-fA-F0-9]{64}$/.test(txHash);
  }
};
