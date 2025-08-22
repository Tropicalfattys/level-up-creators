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

// Solana USDC Payment via Phantom (using Phantom's built-in RPC)
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

    // Use Phantom's built-in connection instead of creating our own
    // This avoids CORS issues since Phantom handles RPC internally
    console.log('Using Phantom built-in RPC connection...');
    
    // USDC mint and platform wallet public keys
    const usdcMint = new PublicKey(USDC_CONTRACTS.solana);
    const toPubkey = new PublicKey(PLATFORM_WALLETS.solana);

    // Get associated token accounts
    const fromTokenAccount = await getAssociatedTokenAddress(usdcMint, fromPubkey);
    const toTokenAccount = await getAssociatedTokenAddress(usdcMint, toPubkey);

    // Create the connection using Phantom's provider connection
    // Phantom exposes a connection object that we can use
    const connection = new Connection(phantom.provider.connection._rpcEndpoint || 'https://api.mainnet-beta.solana.com', 'confirmed');
    
    // Check USDC balance using Phantom's connection
    console.log('Checking USDC balance...');
    try {
      // Try to get balance, but don't fail the transaction if this fails
      // Some wallets/networks might not support balance checking
      try {
        const tokenAccountInfo = await connection.getTokenAccountBalance(fromTokenAccount);
        const balance = tokenAccountInfo.value.uiAmount || 0;
        console.log('USDC Balance:', balance);
        
        if (balance < amount) {
          console.warn(`Low balance detected: ${balance} USDC available, ${amount} USDC requested`);
          // Don't throw here - let Phantom handle insufficient balance during signing
        }
      } catch (balanceCheckError) {
        console.warn('Could not check balance, proceeding with transaction:', balanceCheckError);
        // Continue - balance check is not critical for transaction
      }
    } catch (error) {
      console.warn('Balance check failed, continuing with payment:', error);
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

    // Get recent blockhash - use a more resilient approach
    let blockhash: string;
    try {
      const blockHash = await connection.getLatestBlockhash('confirmed');
      blockhash = blockHash.blockhash;
      console.log('Got blockhash:', blockhash.slice(0, 8) + '...');
    } catch (error) {
      console.warn('Failed to get blockhash from connection, using fallback');
      // Phantom will handle getting a valid blockhash during signing
      blockhash = '';
    }

    // Create transaction - let Phantom handle the blockhash if we couldn't get one
    const transaction = new Transaction();
    if (blockhash) {
      transaction.recentBlockhash = blockhash;
    }
    transaction.feePayer = fromPubkey;
    transaction.add(transferInstruction);

    // Sign and send transaction using Phantom
    console.log('Signing and sending transaction via Phantom...');
    const signedTransaction = await phantom.provider.signAndSendTransaction(transaction);
    
    // Handle different response formats from Phantom
    const signature = typeof signedTransaction === 'string' 
      ? signedTransaction 
      : signedTransaction.signature || signedTransaction.publicKey;
      
    console.log('Transaction sent:', signature);

    // Don't wait for confirmation - return immediately
    // Phantom handles the transaction broadcasting
    console.log('Transaction submitted successfully:', signature);

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
    if (error.message.includes('Insufficient')) {
      throw new Error('Insufficient USDC balance or SOL for transaction fees');
    }
    if (error.message.includes('User rejected')) {
      throw new Error('Transaction cancelled by user');
    }
    throw new Error(`Payment failed: ${error.message}`);
  }
};
