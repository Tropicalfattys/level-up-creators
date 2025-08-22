
import { ethers } from 'ethers';
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { createTransferInstruction, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { USDC_CONTRACTS, PLATFORM_WALLETS, USDC_ABI } from './contracts';
import { detectMetaMask, detectPhantom, requestWalletConnection } from './walletDetection';

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
  console.log(`Starting ${chain} payment for ${amount} USDC`);
  
  const metaMask = detectMetaMask();
  if (!metaMask.isInstalled) {
    throw new Error('MetaMask wallet not found. Please install MetaMask to continue.');
  }

  try {
    // Connect to wallet
    console.log('Connecting to MetaMask...');
    const walletAddress = await requestWalletConnection(metaMask);
    console.log('Connected to wallet:', walletAddress);
    
    const provider = new ethers.providers.Web3Provider(metaMask.provider);
    const signer = provider.getSigner();

    // Switch to correct network if needed
    const chainId = chain === 'ethereum' ? '0x1' : '0x2105'; // Ethereum mainnet or Base
    console.log(`Switching to ${chain} network (${chainId})...`);
    
    try {
      await metaMask.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902 && chain === 'base') {
        // Add Base network if not added
        console.log('Adding Base network...');
        await metaMask.provider.request({
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
    console.log('Creating USDC contract instance...');
    const usdcContract = new ethers.Contract(
      USDC_CONTRACTS[chain],
      USDC_ABI,
      signer
    );

    // Check USDC balance
    const balance = await usdcContract.balanceOf(walletAddress);
    const balanceFormatted = ethers.utils.formatUnits(balance, 6);
    console.log('USDC Balance:', balanceFormatted);
    
    if (parseFloat(balanceFormatted) < amount) {
      throw new Error(`Insufficient USDC balance. You have ${balanceFormatted} USDC but need ${amount} USDC.`);
    }

    // Convert amount to USDC format (6 decimals)
    const amountWei = ethers.utils.parseUnits(amount.toString(), 6);
    console.log('Transferring', amount, 'USDC to', PLATFORM_WALLETS[chain]);
    
    // Execute USDC transfer to platform wallet
    const tx = await usdcContract.transfer(PLATFORM_WALLETS[chain], amountWei);
    console.log('Transaction sent:', tx.hash);
    
    const receipt = await tx.wait();
    console.log('Transaction confirmed:', receipt.transactionHash);

    return {
      txHash: receipt.transactionHash,
      chain,
      amount,
      walletAddress
    };
  } catch (error: any) {
    console.error('Ethereum payment error:', error);
    if (error.code === 4001) {
      throw new Error('Transaction cancelled by user');
    }
    if (error.message.includes('insufficient funds')) {
      throw new Error('Insufficient ETH for transaction fees');
    }
    if (error.message.includes('Insufficient USDC balance')) {
      throw error;
    }
    throw new Error(`Payment failed: ${error.message}`);
  }
};

// Get reliable Solana RPC endpoint with fallbacks
const getSolanaConnection = (): Connection => {
  // Use multiple reliable RPC endpoints with fallbacks
  const rpcEndpoints = [
    'https://solana-mainnet.g.alchemy.com/v2/demo',  // Alchemy demo endpoint
    'https://api.devnet.solana.com',  // Devnet for testing (more reliable than mainnet public)
    'https://rpc.ankr.com/solana',  // Ankr public endpoint
  ];

  // Try endpoints in order
  for (const endpoint of rpcEndpoints) {
    try {
      console.log('Attempting connection to:', endpoint);
      return new Connection(endpoint, 'confirmed');
    } catch (error) {
      console.warn('Failed to connect to RPC:', endpoint, error);
      continue;
    }
  }

  // Fallback to the most reliable free endpoint
  console.log('Using Ankr RPC as final fallback');
  return new Connection('https://rpc.ankr.com/solana', 'confirmed');
};

// Solana USDC Payment via Phantom
export const processSolanaPayment = async (amount: number): Promise<PaymentResult> => {
  console.log(`Starting Solana payment for ${amount} USDC`);
  
  const phantom = detectPhantom();
  if (!phantom.isInstalled) {
    throw new Error('Phantom wallet not found. Please install Phantom to continue.');
  }

  try {
    // Connect to Phantom
    console.log('Connecting to Phantom...');
    const walletAddress = await requestWalletConnection(phantom);
    console.log('Connected to wallet:', walletAddress);
    
    const fromPubkey = new PublicKey(walletAddress);

    // Create connection to Solana using reliable RPC
    const connection = getSolanaConnection();
    
    // Test connection health
    try {
      const { blockhash } = await connection.getLatestBlockhash('confirmed');
      console.log('RPC connection healthy, latest blockhash:', blockhash.slice(0, 8) + '...');
    } catch (rpcError) {
      console.error('RPC health check failed:', rpcError);
      throw new Error('Unable to connect to Solana network. Please try again.');
    }
    
    // USDC mint and platform wallet public keys
    const usdcMint = new PublicKey(USDC_CONTRACTS.solana);
    const toPubkey = new PublicKey(PLATFORM_WALLETS.solana);

    // Get associated token accounts
    const fromTokenAccount = await getAssociatedTokenAddress(usdcMint, fromPubkey);
    const toTokenAccount = await getAssociatedTokenAddress(usdcMint, toPubkey);

    // Check USDC balance
    console.log('Checking USDC balance...');
    try {
      const tokenAccountInfo = await connection.getTokenAccountBalance(fromTokenAccount);
      const balance = tokenAccountInfo.value.uiAmount || 0;
      console.log('USDC Balance:', balance);
      
      if (balance < amount) {
        throw new Error(`Insufficient USDC balance. You have ${balance} USDC but need ${amount} USDC.`);
      }
    } catch (balanceError: any) {
      if (balanceError.message.includes('could not find account')) {
        throw new Error('No USDC token account found. Please ensure you have USDC in your wallet.');
      }
      throw new Error(`Failed to check USDC balance: ${balanceError.message}`);
    }

    // Convert amount to USDC format (6 decimals)
    const amountLamports = amount * 1_000_000;
    console.log('Transferring', amount, 'USDC to', PLATFORM_WALLETS.solana);

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
    const { blockhash } = await connection.getLatestBlockhash('confirmed');

    // Create transaction
    const transaction = new Transaction({
      recentBlockhash: blockhash,
      feePayer: fromPubkey
    }).add(transferInstruction);

    // Sign and send transaction
    console.log('Signing and sending transaction...');
    const { signature } = await phantom.provider.signAndSendTransaction(transaction);
    console.log('Transaction sent:', signature);

    // Wait for confirmation with timeout
    try {
      await connection.confirmTransaction(signature, 'confirmed');
      console.log('Transaction confirmed:', signature);
    } catch (confirmError) {
      console.warn('Confirmation timeout, but transaction may still be processing:', signature);
      // Don't throw error - transaction might still succeed
    }

    return {
      txHash: signature,
      chain: 'solana',
      amount,
      walletAddress
    };
  } catch (error: any) {
    console.error('Solana payment error:', error);
    if (error.code === 4001) {
      throw new Error('Transaction cancelled by user');
    }
    if (error.message.includes('Insufficient USDC balance')) {
      throw error;
    }
    if (error.message.includes('403') || error.message.includes('Access forbidden')) {
      throw new Error('Network connection issue. Please try again in a moment.');
    }
    throw new Error(`Payment failed: ${error.message}`);
  }
};
