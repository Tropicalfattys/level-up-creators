import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getExplorerUrl(network: string, txHash: string): string {
  const normalizedNetwork = network.toLowerCase();
  
  switch (normalizedNetwork) {
    case 'ethereum':
    case 'eth':
      return `https://etherscan.io/tx/${txHash}`;
    case 'base':
      return `https://basescan.org/tx/${txHash}`;
    case 'bsc':
    case 'binance':
      return `https://bscscan.com/tx/${txHash}`;
    case 'solana':
    case 'sol':
      return `https://solscan.io/tx/${txHash}`;
    case 'sui':
      return `https://suiscan.xyz/mainnet/tx/${txHash}`;
    case 'cardano':
    case 'ada':
      return `https://cardanoscan.io/transaction/${txHash}`;
    default:
      return `https://etherscan.io/tx/${txHash}`;
  }
}
