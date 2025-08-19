
import { ethers } from 'ethers';
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { createTransferInstruction, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { USDC_CONTRACTS, PLATFORM_WALLETS, USDC_ABI } from './contracts';

export interface PaymentResult {
  txHash: string;
  chain: string;
  amount: number;
  walletAddress: string;
}

// Ethereum/Base USDC Payment via MetaMask
export const processEthereumPayment = async (
  amount: number,
  chain: 'ethereum' | 'base'
): Promise<PaymentResult> => {
  if (!(window as any).ethereum) {
    throw new Error('MetaMask not installed');
  }

  try {
    // Request account access
    await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
    
    const provider = new ethers.providers.Web3Provider((window as any).ethereum);
    const signer = provider.getSigner();
    const walletAddress = await signer.getAddress();

    // Switch to correct network if needed
    const chainId = chain === 'ethereum' ? '0x1' : '0x2105'; // Ethereum mainnet or Base
    try {
      await (window as any).ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902 && chain === 'base') {
        // Add Base network if not added
        await (window as any).ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x2105',
            chainName: 'Base',
            rpcUrls: ['https://mainnet.base.org'],
            blockExplorerUrls: ['https://basescan.org'],
            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }
          }]
        });
      } else {
        throw switchError;
      }
    }

    // Create USDC contract instance
    const usdcContract = new ethers.Contract(
      USDC_CONTRACTS[chain],
      USDC_ABI,
      signer
    );

    // Convert amount to USDC format (6 decimals)
    const amountWei = ethers.utils.parseUnits(amount.toString(), 6);
    
    // Execute USDC transfer to platform wallet
    const tx = await usdcContract.transfer(PLATFORM_WALLETS[chain], amountWei);
    const receipt = await tx.wait();

    return {
      txHash: receipt.transactionHash,
      chain,
      amount,
      walletAddress
    };
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error('Transaction cancelled by user');
    }
    throw new Error(`Ethereum payment failed: ${error.message}`);
  }
};

// Solana USDC Payment via Phantom
export const processSolanaPayment = async (amount: number): Promise<PaymentResult> => {
  if (!(window as any).solana?.isPhantom) {
    throw new Error('Phantom wallet not installed');
  }

  try {
    // Connect to Phantom
    const resp = await (window as any).solana.connect();
    const fromPubkey = resp.publicKey;
    const walletAddress = fromPubkey.toString();

    // Create connection to Solana mainnet
    const connection = new Connection('https://api.mainnet-beta.solana.com');
    
    // USDC mint and platform wallet public keys
    const usdcMint = new PublicKey(USDC_CONTRACTS.solana);
    const toPubkey = new PublicKey(PLATFORM_WALLETS.solana);

    // Get associated token accounts
    const fromTokenAccount = await getAssociatedTokenAddress(usdcMint, fromPubkey);
    const toTokenAccount = await getAssociatedTokenAddress(usdcMint, toPubkey);

    // Convert amount to USDC format (6 decimals)
    const amountLamports = amount * 1_000_000;

    // Create transfer instruction
    const transferInstruction = createTransferInstruction(
      fromTokenAccount,
      toTokenAccount,
      fromPubkey,
      amountLamports,
      [],
      TOKEN_PROGRAM_ID
    );

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();

    // Create transaction
    const transaction = new Transaction({
      recentBlockhash: blockhash,
      feePayer: fromPubkey
    }).add(transferInstruction);

    // Sign and send transaction
    const { signature } = await (window as any).solana.signAndSendTransaction(transaction);

    // Wait for confirmation
    await connection.confirmTransaction(signature);

    return {
      txHash: signature,
      chain: 'solana',
      amount,
      walletAddress
    };
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error('Transaction cancelled by user');
    }
    throw new Error(`Solana payment failed: ${error.message}`);
  }
};
