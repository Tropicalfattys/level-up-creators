
// Safe wallet detection with conflict resolution
export interface WalletInfo {
  isInstalled: boolean;
  provider?: any;
  name: string;
}

export const detectMetaMask = (): WalletInfo => {
  try {
    // Check if window.ethereum exists and is MetaMask
    if (typeof window !== 'undefined' && window.ethereum) {
      // Handle multiple providers
      if (window.ethereum.providers) {
        const metaMaskProvider = window.ethereum.providers.find(
          (provider: any) => provider.isMetaMask && !provider.isBraveWallet
        );
        return {
          isInstalled: !!metaMaskProvider,
          provider: metaMaskProvider,
          name: 'MetaMask'
        };
      }
      
      // Single provider case
      if (window.ethereum.isMetaMask && !window.ethereum.isBraveWallet) {
        return {
          isInstalled: true,
          provider: window.ethereum,
          name: 'MetaMask'
        };
      }
    }
    
    return { isInstalled: false, name: 'MetaMask' };
  } catch (error) {
    console.warn('MetaMask detection error:', error);
    return { isInstalled: false, name: 'MetaMask' };
  }
};

export const detectPhantom = (): WalletInfo => {
  try {
    if (typeof window !== 'undefined' && window.solana && window.solana.isPhantom) {
      return {
        isInstalled: true,
        provider: window.solana,
        name: 'Phantom'
      };
    }
    
    return { isInstalled: false, name: 'Phantom' };
  } catch (error) {
    console.warn('Phantom detection error:', error);
    return { isInstalled: false, name: 'Phantom' };
  }
};

export const requestWalletConnection = async (walletInfo: WalletInfo) => {
  if (!walletInfo.isInstalled || !walletInfo.provider) {
    throw new Error(`${walletInfo.name} wallet not found`);
  }
  
  try {
    if (walletInfo.name === 'MetaMask') {
      const accounts = await walletInfo.provider.request({ 
        method: 'eth_requestAccounts' 
      });
      return accounts[0];
    } else if (walletInfo.name === 'Phantom') {
      const response = await walletInfo.provider.connect();
      return response.publicKey.toString();
    }
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error('User rejected wallet connection');
    }
    throw new Error(`Failed to connect to ${walletInfo.name}: ${error.message}`);
  }
};
