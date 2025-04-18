/**
 * Stealth Address Implementation
 * 
 * This module provides functionality for creating and using stealth addresses,
 * which are one-time addresses that enhance privacy by breaking the link
 * between a recipient's public identity and their blockchain transactions.
 */

import { ethers } from 'ethers';
import { getProvider } from './ethers';

// Interface for stealth metadata
export interface StealthMetadata {
  ephemeralPubKey: string;  // Used by the recipient to derive the stealth private key
  viewTag: string;          // Helps recipients quickly identify their stealth payments
  memo?: string;            // Optional memo to include with the payment
}

// Interface for a stealth address
export interface StealthAddress {
  address: string;           // The stealth address
  metadata: StealthMetadata; // Metadata required for the recipient to claim
  originatingAddress: string; // The original address that generated this stealth address
}

// Interface for a stealth key pair
export interface StealthKeyPair {
  spendingPrivateKey: string;  // Private key for spending
  spendingPublicKey: string;   // Public key derived from spending private key
  viewingPrivateKey: string;   // Private key for viewing
  viewingPublicKey: string;    // Public key derived from viewing private key
}

/**
 * Generate a stealth key pair from a master private key
 * In practice, users would have a dedicated spending key and viewing key
 */
export const generateStealthKeyPair = async (
  masterPrivateKey: string
): Promise<StealthKeyPair> => {
  try {
    // Validate private key
    if (!masterPrivateKey || !masterPrivateKey.startsWith('0x')) {
      throw new Error('Invalid private key format');
    }
    
    // Create deterministic spending key from master key
    const spendingPrivateKeyBytes = ethers.getBytes(
      ethers.keccak256(
        ethers.concat([
          ethers.getBytes(masterPrivateKey),
          ethers.toUtf8Bytes('SPENDING_KEY')
        ])
      )
    );
    
    // Create deterministic viewing key from master key
    const viewingPrivateKeyBytes = ethers.getBytes(
      ethers.keccak256(
        ethers.concat([
          ethers.getBytes(masterPrivateKey),
          ethers.toUtf8Bytes('VIEWING_KEY')
        ])
      )
    );
    
    // Convert to hex strings
    const spendingPrivateKey = ethers.hexlify(spendingPrivateKeyBytes);
    const viewingPrivateKey = ethers.hexlify(viewingPrivateKeyBytes);
    
    // Generate the corresponding public keys
    // In a real implementation, this would use elliptic curve cryptography
    // For this demo, we're just using the private key to create a wallet
    const spendingWallet = new ethers.Wallet(spendingPrivateKey);
    const viewingWallet = new ethers.Wallet(viewingPrivateKey);
    
    // Extract public keys (compressed format in production)
    const spendingPublicKey = await spendingWallet.getAddress();
    const viewingPublicKey = await viewingWallet.getAddress();
    
    return {
      spendingPrivateKey,
      spendingPublicKey,
      viewingPrivateKey,
      viewingPublicKey
    };
  } catch (error) {
    throw new Error('Failed to generate stealth key pair: ' + 
      (error instanceof Error ? error.message : String(error)));
  }
};

/**
 * Generate a stealth address for a recipient
 * 
 * This creates a unique one-time address that only the recipient can detect and spend from
 */
export const generateStealthAddress = async (
  recipientStealthKeys: {
    spendingPublicKey: string;
    viewingPublicKey: string;
  },
  senderPrivateKey: string,
  memo?: string
): Promise<StealthAddress> => {
  try {
    // Generate a random ephemeral private key
    const ephemeralPrivateKeyBytes = ethers.randomBytes(32);
    const ephemeralPrivateKey = ethers.hexlify(ephemeralPrivateKeyBytes);
    
    // Create a wallet from the ephemeral private key
    const ephemeralWallet = new ethers.Wallet(ephemeralPrivateKey);
    const ephemeralPubKey = await ephemeralWallet.getAddress();
    
    // In a real implementation, we would:
    // 1. Compute a shared secret using ECDH (Elliptic Curve Diffie-Hellman)
    // 2. Use the shared secret to derive the stealth address
    
    // For this demo, we'll simulate this by creating a deterministic hash
    const sharedSecretMaterial = ethers.concat([
      ethers.getBytes(recipientStealthKeys.spendingPublicKey),
      ethers.getBytes(ephemeralPubKey)
    ]);
    
    const sharedSecret = ethers.keccak256(sharedSecretMaterial);
    
    // Create a view tag from the first byte of the shared secret
    const viewTag = ethers.hexlify(ethers.getBytes(sharedSecret).slice(0, 1));
    
    // Create the stealth address
    const stealthAddressBytes = ethers.getBytes(
      ethers.keccak256(
        ethers.concat([
          ethers.getBytes(sharedSecret),
          ethers.getBytes(recipientStealthKeys.viewingPublicKey)
        ])
      )
    );
    
    // Convert to a valid Ethereum address
    const stealthAddress = ethers.getAddress(
      '0x' + Buffer.from(stealthAddressBytes.slice(12, 32)).toString('hex')
    );
    
    // Determine the sender's address
    const senderWallet = new ethers.Wallet(senderPrivateKey);
    const originatingAddress = await senderWallet.getAddress();
    
    return {
      address: stealthAddress,
      metadata: {
        ephemeralPubKey,
        viewTag,
        memo
      },
      originatingAddress
    };
  } catch (error) {
    throw new Error('Failed to generate stealth address: ' + 
      (error instanceof Error ? error.message : String(error)));
  }
};

/**
 * Scan for stealth transactions sent to you
 * 
 * In a real implementation, this would scan blockchain events for stealth payments
 * For this demo, we just check a provided list of transactions
 */
export const scanForStealthTransactions = async (
  stealthKeyPair: StealthKeyPair,
  stealthPayments: {
    stealthAddress: string;
    metadata: StealthMetadata;
    amount: string;
    txHash: string;
  }[]
): Promise<{
  stealthAddress: string;
  amount: string;
  txHash: string;
  metadata: StealthMetadata;
  canSpend: boolean;
}[]> => {
  const result = [];
  
  for (const payment of stealthPayments) {
    try {
      // Check if we can compute the same stealth address using our keys
      const { ephemeralPubKey, viewTag } = payment.metadata;
      
      // Simulate shared secret computation (as recipient)
      const sharedSecretMaterial = ethers.concat([
        ethers.getBytes(stealthKeyPair.spendingPublicKey),
        ethers.getBytes(ephemeralPubKey)
      ]);
      
      const sharedSecret = ethers.keccak256(sharedSecretMaterial);
      
      // Check if the view tag matches
      const computedViewTag = ethers.hexlify(ethers.getBytes(sharedSecret).slice(0, 1));
      
      if (computedViewTag !== payment.metadata.viewTag) {
        // Not for us, skip
        continue;
      }
      
      // Compute the stealth address
      const computedStealthAddressBytes = ethers.getBytes(
        ethers.keccak256(
          ethers.concat([
            ethers.getBytes(sharedSecret),
            ethers.getBytes(stealthKeyPair.viewingPublicKey)
          ])
        )
      );
      
      // Convert to a valid Ethereum address
      const computedStealthAddress = ethers.getAddress(
        '0x' + Buffer.from(computedStealthAddressBytes.slice(12, 32)).toString('hex')
      );
      
      // Check if the addresses match
      const isForUs = computedStealthAddress.toLowerCase() === payment.stealthAddress.toLowerCase();
      
      if (isForUs) {
        result.push({
          ...payment,
          canSpend: true
        });
      }
    } catch (error) {
      console.error('Error processing stealth payment:', error);
    }
  }
  
  return result;
};

/**
 * Compute the private key for a stealth address
 * 
 * This allows the recipient to spend funds sent to their stealth address
 */
export const computeStealthPrivateKey = async (
  stealthKeyPair: StealthKeyPair,
  metadata: StealthMetadata
): Promise<string> => {
  try {
    // Compute the shared secret as the recipient would
    const { ephemeralPubKey } = metadata;
    
    // Simulate shared secret computation
    const sharedSecretMaterial = ethers.concat([
      ethers.getBytes(stealthKeyPair.spendingPublicKey),
      ethers.getBytes(ephemeralPubKey)
    ]);
    
    const sharedSecret = ethers.keccak256(sharedSecretMaterial);
    
    // Derive the stealth private key
    const stealthPrivateKeyBytes = ethers.getBytes(
      ethers.keccak256(
        ethers.concat([
          ethers.getBytes(sharedSecret),
          ethers.getBytes(stealthKeyPair.spendingPrivateKey)
        ])
      )
    );
    
    // Convert to hex string
    const stealthPrivateKey = ethers.hexlify(stealthPrivateKeyBytes);
    
    return stealthPrivateKey;
  } catch (error) {
    throw new Error('Failed to compute stealth private key: ' + 
      (error instanceof Error ? error.message : String(error)));
  }
};

/**
 * Send funds to a stealth address
 */
export const sendToStealthAddress = async (
  stealthAddress: StealthAddress,
  amount: string,
  senderPrivateKey: string,
  network: 'pulsechain' | 'ethereum' = 'pulsechain'
): Promise<{
  success: boolean;
  txHash?: string;
  error?: string;
}> => {
  try {
    // Get provider for the selected network
    const provider = getProvider(network);
    
    // Create a wallet from the sender's private key
    const senderWallet = new ethers.Wallet(senderPrivateKey, provider);
    
    // Check if the sender has enough balance
    const balance = await senderWallet.provider.getBalance(senderWallet.address);
    const amountWei = ethers.parseEther(amount);
    
    if (balance < amountWei) {
      throw new Error('Insufficient balance');
    }
    
    // In a production app, we would:
    // 1. Create and sign a transaction to the stealth address
    // 2. Broadcast the transaction and handle the stealth metadata
    
    // For this demo, we'll simulate the transaction
    const txHash = ethers.keccak256(
      ethers.toUtf8Bytes(
        JSON.stringify({
          from: senderWallet.address,
          to: stealthAddress.address,
          amount,
          metadata: stealthAddress.metadata,
          timestamp: Date.now()
        })
      )
    );
    
    console.log(`Simulated transfer of ${amount} ${network === 'pulsechain' ? 'PLS' : 'ETH'} to stealth address ${stealthAddress.address}`);
    
    return {
      success: true,
      txHash
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

/**
 * Spend funds from a stealth address
 */
export const spendFromStealthAddress = async (
  stealthKeyPair: StealthKeyPair,
  stealthMetadata: StealthMetadata,
  amount: string,
  recipientAddress: string,
  network: 'pulsechain' | 'ethereum' = 'pulsechain'
): Promise<{
  success: boolean;
  txHash?: string;
  error?: string;
}> => {
  try {
    // Compute the stealth private key
    const stealthPrivateKey = await computeStealthPrivateKey(
      stealthKeyPair,
      stealthMetadata
    );
    
    // Get provider for the selected network
    const provider = getProvider(network);
    
    // Create a wallet from the stealth private key
    const stealthWallet = new ethers.Wallet(stealthPrivateKey, provider);
    
    // In a production app, we would:
    // 1. Create and sign a transaction from the stealth address to the recipient
    // 2. Broadcast the transaction
    
    // For this demo, we'll simulate the transaction
    const txHash = ethers.keccak256(
      ethers.toUtf8Bytes(
        JSON.stringify({
          from: stealthWallet.address,
          to: recipientAddress,
          amount,
          timestamp: Date.now()
        })
      )
    );
    
    console.log(`Simulated transfer of ${amount} ${network === 'pulsechain' ? 'PLS' : 'ETH'} from stealth address ${stealthWallet.address} to ${recipientAddress}`);
    
    return {
      success: true,
      txHash
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

/**
 * Get a payment link for a stealth address
 * 
 * This creates a link that can be shared with others to pay to your stealth address
 */
export const getStealthPaymentLink = (
  stealthKeys: {
    spendingPublicKey: string;
    viewingPublicKey: string;
  }
): string => {
  // Create a URI with the stealth keys
  const uriData = {
    spendingKey: stealthKeys.spendingPublicKey,
    viewingKey: stealthKeys.viewingPublicKey,
    protocol: 'securewallet-v1'
  };
  
  // Create a URI-safe base64 encoded string
  const uriEncoded = Buffer.from(
    JSON.stringify(uriData)
  ).toString('base64');
  
  // Create a link with the encoded data
  return `https://securewallet.io/pay#${uriEncoded}`;
};

/**
 * Parse a stealth payment link
 */
export const parseStealthPaymentLink = (link: string): {
  spendingPublicKey: string;
  viewingPublicKey: string;
} | null => {
  try {
    // Extract the encoded data from the link
    const encodedData = link.split('#')[1];
    
    if (!encodedData) {
      return null;
    }
    
    // Decode the base64 data
    const decodedData = Buffer.from(encodedData, 'base64').toString();
    
    // Parse the JSON
    const parsedData = JSON.parse(decodedData);
    
    // Validate the data
    if (!parsedData.spendingKey || !parsedData.viewingKey || parsedData.protocol !== 'securewallet-v1') {
      return null;
    }
    
    return {
      spendingPublicKey: parsedData.spendingKey,
      viewingPublicKey: parsedData.viewingKey
    };
  } catch (error) {
    console.error('Failed to parse stealth payment link:', error);
    return null;
  }
};