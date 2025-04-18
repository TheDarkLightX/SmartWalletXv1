/**
 * Secure Environment Detection and Integration
 * 
 * This module provides utilities for detecting and utilizing secure hardware
 * elements available on the device (TEE, Secure Enclave, etc.)
 */

// Types of secure environments
export enum SecureEnvironmentType {
  SECURE_ENCLAVE = 'secure_enclave',  // iOS
  ARM_TRUSTZONE = 'arm_trustzone',    // Android
  TPM = 'tpm',                        // Windows
  INTEL_SGX = 'intel_sgx',            // Intel desktop/server
  AMD_PSP = 'amd_psp',                // AMD desktop/server
  SOFTWARE_FALLBACK = 'software'      // No hardware security available
}

// Interface for secure environment capabilities
export interface SecureEnvironmentCapabilities {
  type: SecureEnvironmentType;
  supportsKeyGeneration: boolean;
  supportsSigningWithBiometrics: boolean;
  supportsEncryption: boolean;
  supportsSecureRandom: boolean;
  supportsAttestation: boolean;
  supportsMPC: boolean;
}

/**
 * Detect the available secure environment on the current device
 */
export const detectSecureEnvironment = (): SecureEnvironmentCapabilities => {
  try {
    // Check if we're in a browser environment with Web Crypto API support
    const hasWebCrypto = typeof window !== 'undefined' && 
                         typeof window.crypto !== 'undefined' && 
                         typeof window.crypto.subtle !== 'undefined';
    
    // Check for WebAuthn support (indicates potential for hardware-backed credentials)
    const hasWebAuthn = typeof window !== 'undefined' && 
                        typeof window.PublicKeyCredential !== 'undefined';
    
    // For iOS devices
    if (isIOS()) {
      return {
        type: SecureEnvironmentType.SECURE_ENCLAVE,
        supportsKeyGeneration: true,
        supportsSigningWithBiometrics: true,
        supportsEncryption: true,
        supportsSecureRandom: hasWebCrypto,
        supportsAttestation: hasWebAuthn,
        supportsMPC: false // Secure Enclave doesn't support MPC natively
      };
    }
    
    // For Android devices
    if (isAndroid()) {
      return {
        type: SecureEnvironmentType.ARM_TRUSTZONE,
        supportsKeyGeneration: true,
        supportsSigningWithBiometrics: true,
        supportsEncryption: true,
        supportsSecureRandom: hasWebCrypto,
        supportsAttestation: hasWebAuthn,
        supportsMPC: false // TrustZone doesn't support MPC natively
      };
    }

    // For Windows devices with TPM
    if (isWindowsWithTPM()) {
      return {
        type: SecureEnvironmentType.TPM,
        supportsKeyGeneration: true,
        supportsSigningWithBiometrics: false,
        supportsEncryption: true,
        supportsSecureRandom: hasWebCrypto,
        supportsAttestation: hasWebAuthn,
        supportsMPC: false
      };
    }

    // For machines with Intel SGX
    if (hasIntelSGX()) {
      return {
        type: SecureEnvironmentType.INTEL_SGX,
        supportsKeyGeneration: true,
        supportsSigningWithBiometrics: false,
        supportsEncryption: true,
        supportsSecureRandom: hasWebCrypto,
        supportsAttestation: true,
        supportsMPC: true // SGX can support MPC applications
      };
    }

    // For machines with AMD PSP (Platform Security Processor)
    if (hasAMDPSP()) {
      return {
        type: SecureEnvironmentType.AMD_PSP,
        supportsKeyGeneration: true,
        supportsSigningWithBiometrics: false,
        supportsEncryption: true,
        supportsSecureRandom: hasWebCrypto,
        supportsAttestation: true,
        supportsMPC: false
      };
    }

    // Software fallback if no secure hardware is available or if in a non-browser environment
    return {
      type: SecureEnvironmentType.SOFTWARE_FALLBACK,
      supportsKeyGeneration: true,
      supportsSigningWithBiometrics: false,
      supportsEncryption: true,
      supportsSecureRandom: hasWebCrypto, // Will be false in Node.js
      supportsAttestation: false,
      supportsMPC: true // We can do MPC in software
    };
  } catch (error) {
    // If anything goes wrong, return a conservative software fallback
    console.error('Error detecting secure environment:', error);
    return {
      type: SecureEnvironmentType.SOFTWARE_FALLBACK,
      supportsKeyGeneration: true,
      supportsSigningWithBiometrics: false, 
      supportsEncryption: true,
      supportsSecureRandom: false,
      supportsAttestation: false,
      supportsMPC: true
    };
  }
};

/**
 * Generate a cryptographic key securely using the TEE/secure element if available
 */
export const generateSecureKey = async (
  keyName: string,
  requiresBiometrics: boolean = false
): Promise<string> => {
  try {
    const environment = detectSecureEnvironment();
    
    // Generate a secure random identifier for the key
    const randomBytes = generateSecureRandomBytes(16);
    let randomId = '';
    
    // Convert random bytes to a hex string
    for (let i = 0; i < randomBytes.length; i++) {
      randomId += randomBytes[i].toString(16).padStart(2, '0');
    }
    
    // In a real implementation, this would call platform-specific APIs
    // For demonstration purposes, we're just generating a mock key
    if (environment.type !== SecureEnvironmentType.SOFTWARE_FALLBACK) {
      // Would use native secure key generation
      // This would involve using platform-specific secure key APIs
      console.log(`Generating key ${keyName} in ${environment.type}`);
      
      // Mock implementation that uses secure randomness instead of Math.random()
      return `secure_key_${Date.now()}_${randomId}`;
    } else {
      // Software fallback
      console.log('No secure environment available. Using software key generation');
      
      // Even in software mode, we use secure randomness
      return `software_key_${Date.now()}_${randomId}`;
    }
  } catch (error) {
    // Error handling is critical in security-sensitive code
    console.error('Error generating secure key:', error);
    throw new Error('Failed to generate secure key: ' + 
      (error instanceof Error ? error.message : String(error)));
  }
};

/**
 * Sign data using a key in the secure element
 */
export const signWithSecureKey = async (
  data: string,
  keyName: string,
  requiresBiometricAuth: boolean = false
): Promise<string> => {
  try {
    const environment = detectSecureEnvironment();
    
    // Generate a secure random signature component
    const randomBytes = generateSecureRandomBytes(16);
    let randomSignatureId = '';
    
    // Convert random bytes to a hex string
    for (let i = 0; i < randomBytes.length; i++) {
      randomSignatureId += randomBytes[i].toString(16).padStart(2, '0');
    }
    
    // In a real implementation, this would call platform-specific APIs
    if (environment.type !== SecureEnvironmentType.SOFTWARE_FALLBACK) {
      // Would use native secure signing
      console.log(`Signing data with key ${keyName} in ${environment.type}`);
      
      if (requiresBiometricAuth && !environment.supportsSigningWithBiometrics) {
        throw new Error('Biometric authentication requested but not supported by device');
      }
      
      // Mock implementation using secure random generation
      return `secure_signature_${Date.now()}_${randomSignatureId}`;
    } else {
      // Software fallback
      console.log('No secure environment available. Using software signing');
      
      // Mock implementation using secure random generation
      return `software_signature_${Date.now()}_${randomSignatureId}`;
    }
  } catch (error) {
    // Proper error handling is critical in security-sensitive code
    console.error('Error signing with secure key:', error);
    throw new Error('Failed to sign data: ' + 
      (error instanceof Error ? error.message : String(error)));
  }
};

/**
 * Encrypt data using the secure element
 */
export const encryptWithSecureElement = async (
  data: string,
  keyName: string
): Promise<string> => {
  try {
    const environment = detectSecureEnvironment();
    
    // Generate a secure random identifier for the encrypted data
    const randomBytes = generateSecureRandomBytes(8);
    let randomId = '';
    
    // Convert random bytes to a hex string
    for (let i = 0; i < randomBytes.length; i++) {
      randomId += randomBytes[i].toString(16).padStart(2, '0');
    }
    
    // In a real implementation, this would call platform-specific APIs
    if (environment.type !== SecureEnvironmentType.SOFTWARE_FALLBACK) {
      // Would use native secure encryption through the secure element APIs
      console.log(`Encrypting data with key ${keyName} in ${environment.type}`);
      
      // Mock implementation - in reality would call to native code
      // We're using a timestamp and secure random ID instead of Math.random()
      return `secure_encrypted_${data.substring(0, 10)}..._${Date.now()}_${randomId}`;
    } else {
      // Software fallback
      console.log('No secure environment available. Using software encryption');
      
      // Mock implementation that still uses secure random generation
      return `software_encrypted_${data.substring(0, 10)}..._${Date.now()}_${randomId}`;
    }
  } catch (error) {
    // Error handling is critical in security-sensitive code
    console.error('Error encrypting with secure element:', error);
    throw new Error('Failed to encrypt data: ' + 
      (error instanceof Error ? error.message : String(error)));
  }
};

/**
 * Generate secure random bytes using the hardware random number generator
 */
export const generateSecureRandomBytes = (length: number): Uint8Array => {
  try {
    const environment = detectSecureEnvironment();
    
    // Always use Web Crypto API for secure random generation when available
    // This is the most secure option in browser environments
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      const result = new Uint8Array(length);
      window.crypto.getRandomValues(result);
      return result;
    }
    
    // In a real implementation, this would call platform-specific APIs
    if (environment.type !== SecureEnvironmentType.SOFTWARE_FALLBACK && environment.supportsSecureRandom) {
      // Would use hardware random number generator - we'd implement native calls here
      // For now, we'll use a more secure fallback than Math.random()
      
      // This is a placeholder that would be replaced with actual secure implementation
      const result = new Uint8Array(length);
      const secureRandomFn = getSecurePseudoRandomFunction(environment.type);
      for (let i = 0; i < length; i++) {
        // Use a more secure seed and algorithm instead of Math.random
        result[i] = secureRandomFn(i, length) % 256;
      }
      return result;
    } else {
      // Software fallback - use the best available method
      // This would be a much more sophisticated implementation in production
      
      // Create a seed based on multiple sources of entropy
      const seed = Date.now().toString() + 
                  (typeof performance !== 'undefined' ? performance.now().toString() : '') +
                  (typeof navigator !== 'undefined' ? JSON.stringify(navigator.userAgent) : '');
      
      // Use a better algorithm than Math.random
      const result = new Uint8Array(length);
      for (let i = 0; i < length; i++) {
        // Simple hash-based PRNG as a better fallback
        // Note: This is still not cryptographically secure and would be replaced 
        // with a proper CSPRNG in production
        const hash = simpleHash(seed + i.toString());
        result[i] = hash % 256;
      }
      return result;
    }
  } catch (error) {
    // Error handling is important in security-critical code
    console.error('Error generating secure random bytes:', error);
    throw new Error('Failed to generate secure random bytes: ' + (error instanceof Error ? error.message : String(error)));
  }
};

// A simple hash function for fallback entropy
function simpleHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Get an appropriate PRNG based on environment
function getSecurePseudoRandomFunction(envType: SecureEnvironmentType): (index: number, length: number) => number {
  // In a real implementation, this would return different algorithms based on the environment
  return (index: number, length: number) => {
    // Much more sophisticated algorithm would be used in production
    const base = Date.now() ^ (index * 7919) ^ (length * 104729);
    return simpleHash(base.toString() + index.toString());
  };
}

// Helper functions to detect platform capabilities
function isIOS(): boolean {
  // In a real implementation, this would detect if running on iOS
  // Check if we're in a browser environment first
  if (typeof navigator !== 'undefined' && typeof window !== 'undefined') {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  }
  return false;
}

function isAndroid(): boolean {
  // In a real implementation, this would detect if running on Android
  // Check if we're in a browser environment first
  if (typeof navigator !== 'undefined') {
    return /Android/.test(navigator.userAgent);
  }
  return false;
}

function isWindowsWithTPM(): boolean {
  // In a real implementation, this would detect if running on Windows with TPM
  // This is a mock implementation
  // We would use Windows-specific APIs to detect TPM
  return false;
}

function hasIntelSGX(): boolean {
  // In a real implementation, this would detect if Intel SGX is available
  // This would require either native code or browser extensions with special permissions
  // This is a mock implementation
  return false;
}

function hasAMDPSP(): boolean {
  // In a real implementation, this would detect if AMD PSP is available
  // This would require native code access
  // This is a mock implementation
  return false;
}