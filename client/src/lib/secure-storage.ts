/**
 * Secure Storage Utility
 * 
 * This module handles secure encryption and storage of sensitive wallet data.
 * It uses AES-GCM encryption with a password-derived key to protect private keys
 * and seed phrases before storing them on the device.
 */

// Import necessary crypto functions
const SALT_SIZE = 16;
const IV_SIZE = 12;
const AUTH_TAG_SIZE = 16;

/**
 * Encrypts wallet data with a password using AES-GCM
 * @param data The sensitive data to encrypt (private key or mnemonic)
 * @param password User-provided password for encryption
 * @returns Promise resolving to encrypted data as a base64 string
 */
export async function encryptWalletData(data: string, password: string): Promise<string> {
  try {
    // Convert data and password to proper formats
    const dataBuffer = new TextEncoder().encode(data);
    
    // Generate a random salt for key derivation
    const salt = window.crypto.getRandomValues(new Uint8Array(SALT_SIZE));
    
    // Derive encryption key from password using PBKDF2
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );
    
    const key = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );
    
    // Generate a random initialization vector
    const iv = window.crypto.getRandomValues(new Uint8Array(IV_SIZE));
    
    // Encrypt the data
    const encryptedData = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      dataBuffer
    );
    
    // Combine salt + iv + encrypted data
    const resultBuffer = new Uint8Array(SALT_SIZE + IV_SIZE + encryptedData.byteLength);
    resultBuffer.set(salt, 0);
    resultBuffer.set(iv, SALT_SIZE);
    resultBuffer.set(new Uint8Array(encryptedData), SALT_SIZE + IV_SIZE);
    
    // Convert to base64 for storage
    return btoa(String.fromCharCode(...resultBuffer));
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt wallet data');
  }
}

/**
 * Decrypts wallet data using the provided password
 * @param encryptedData The encrypted data as a base64 string
 * @param password User-provided password for decryption
 * @returns Promise resolving to the decrypted data as a string
 */
export async function decryptWalletData(encryptedData: string, password: string): Promise<string> {
  try {
    // Convert base64 to array buffer
    const dataBuffer = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    
    // Extract salt, iv, and encrypted data
    const salt = dataBuffer.slice(0, SALT_SIZE);
    const iv = dataBuffer.slice(SALT_SIZE, SALT_SIZE + IV_SIZE);
    const encryptedContent = dataBuffer.slice(SALT_SIZE + IV_SIZE);
    
    // Derive decryption key from password
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );
    
    const key = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );
    
    // Decrypt the data
    const decryptedData = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      encryptedContent
    );
    
    // Convert the decrypted array buffer back to string
    return new TextDecoder().decode(decryptedData);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt wallet data. Incorrect password or corrupted data.');
  }
}

/**
 * Securely stores wallet data in device storage
 * @param walletAddress The wallet address (public identifier)
 * @param privateKey The private key to store securely
 * @param mnemonic The seed phrase to store securely
 * @param password Optional password for encryption (if not provided, data is not stored)
 */
export async function secureStoreWallet(
  walletAddress: string,
  privateKey: string,
  mnemonic: string,
  password: string = ''
): Promise<void> {
  try {
    // Always store the wallet address for identification (not sensitive)
    localStorage.setItem('walletAddress', walletAddress);
    
    // Only store encrypted sensitive data if a password is provided
    if (password && password.length > 0) {
      // Encrypt private key and mnemonic with password
      const encryptedPrivateKey = await encryptWalletData(privateKey, password);
      const encryptedMnemonic = await encryptWalletData(mnemonic, password);
      
      // Store encrypted data in localStorage
      localStorage.setItem('encryptedPrivateKey', encryptedPrivateKey);
      localStorage.setItem('encryptedMnemonic', encryptedMnemonic);
      localStorage.setItem('hasEncryptedWallet', 'true');
    } else {
      // If no password is provided, we don't store private key or mnemonic
      // User will need to rely on their backed up information
      localStorage.removeItem('encryptedPrivateKey');
      localStorage.removeItem('encryptedMnemonic');
      localStorage.setItem('hasEncryptedWallet', 'false');
    }
  } catch (error) {
    console.error('Error storing wallet securely:', error);
    throw new Error('Failed to securely store wallet data');
  }
}

/**
 * Retrieves securely stored wallet data
 * @param password Password for decryption
 * @returns Object containing wallet address, private key, and mnemonic
 */
export async function retrieveWalletData(password: string): Promise<{
  address: string;
  privateKey?: string;
  mnemonic?: string;
}> {
  const walletAddress = localStorage.getItem('walletAddress');
  const hasEncryptedWallet = localStorage.getItem('hasEncryptedWallet') === 'true';
  
  if (!walletAddress) {
    throw new Error('No wallet found in secure storage');
  }
  
  // If we don't have encrypted data or no password is provided, just return the address
  if (!hasEncryptedWallet || !password) {
    return { address: walletAddress };
  }
  
  try {
    // Retrieve and decrypt the encrypted data
    const encryptedPrivateKey = localStorage.getItem('encryptedPrivateKey');
    const encryptedMnemonic = localStorage.getItem('encryptedMnemonic');
    
    if (!encryptedPrivateKey || !encryptedMnemonic) {
      throw new Error('Wallet data is incomplete');
    }
    
    const privateKey = await decryptWalletData(encryptedPrivateKey, password);
    const mnemonic = await decryptWalletData(encryptedMnemonic, password);
    
    return {
      address: walletAddress,
      privateKey,
      mnemonic
    };
  } catch (error) {
    console.error('Error retrieving wallet data:', error);
    throw new Error('Failed to decrypt wallet data. Please check your password.');
  }
}

/**
 * Clears all wallet data from secure storage
 */
export function clearWalletData(): void {
  localStorage.removeItem('walletAddress');
  localStorage.removeItem('encryptedPrivateKey');
  localStorage.removeItem('encryptedMnemonic');
  localStorage.removeItem('hasEncryptedWallet');
}

/**
 * Checks if a wallet exists in secure storage
 * @returns True if a wallet exists, false otherwise
 */
export function hasStoredWallet(): boolean {
  return localStorage.getItem('walletAddress') !== null;
}

/**
 * Checks if the stored wallet is encrypted with a password
 * @returns True if the wallet is encrypted, false otherwise
 */
export function isWalletEncrypted(): boolean {
  return localStorage.getItem('hasEncryptedWallet') === 'true';
}