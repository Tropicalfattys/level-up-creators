
// Type declarations for wallet providers
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      isBraveWallet?: boolean;
      providers?: Array<{
        isMetaMask?: boolean;
        isBraveWallet?: boolean;
        request: (args: { method: string; params?: any[] }) => Promise<any>;
      }>;
      request: (args: { method: string; params?: any[] }) => Promise<any>;
    };
    solana?: {
      isPhantom?: boolean;
      connect: () => Promise<{ publicKey: { toString: () => string } }>;
      signAndSendTransaction: (transaction: any) => Promise<{ signature: string }>;
    };
  }
}

export {};
