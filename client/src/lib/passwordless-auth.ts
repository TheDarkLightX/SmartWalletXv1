/**
 * Passwordless Authentication Module
 *
 * This module provides WebAuthn-based passwordless authentication support.
 * It includes registration and authentication flows using biometrics or
 * hardware security keys.
 */

// Check browser support for WebAuthn
export function isWebAuthnSupported(): boolean {
  return typeof window !== 'undefined' && 
    window.PublicKeyCredential !== undefined &&
    typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function';
}

// Check if a built-in platform authenticator (biometric) is available
export async function hasPlatformAuthenticator(): Promise<boolean> {
  if (!isWebAuthnSupported()) return false;

  try {
    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch (error) {
    console.error('Error checking platform authenticator:', error);
    return false;
  }
}

// Available authenticator types
export enum AuthenticatorType {
  PLATFORM = 'platform', // Built-in like Touch ID, Windows Hello
  CROSS_PLATFORM = 'cross-platform', // External like YubiKey
  ANY = 'any' // Any type
}

// Authentication method
export enum AuthMethod {
  PASSWORD = 'password',
  WEBAUTHN = 'webauthn',
  SOCIAL = 'social'
}

// Result of authentication operation
export interface AuthResult {
  success: boolean;
  error?: string;
  credentialId?: string;
  userId?: string;
  username?: string;
}

/**
 * Base64 encoding/decoding utilities
 */
const base64URLEncode = (buffer: ArrayBuffer): string => {
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
};

const base64URLDecode = (base64url: string): ArrayBuffer => {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return bytes.buffer;
};

/**
 * Register a new passwordless credential (enrollment)
 */
export async function registerPasswordlessCredential(
  username: string,
  userId: string,
  authenticatorType: AuthenticatorType = AuthenticatorType.ANY
): Promise<AuthResult> {
  if (!isWebAuthnSupported()) {
    return { 
      success: false, 
      error: 'WebAuthn is not supported in this browser' 
    };
  }

  try {
    // This would normally come from the server
    // For brevity, we're creating it client-side
    const challengeBuffer = new Uint8Array(32);
    window.crypto.getRandomValues(challengeBuffer);
    
    const publicKeyOptions: PublicKeyCredentialCreationOptions = {
      challenge: challengeBuffer,
      rp: {
        // These would normally match your domain
        name: 'Secure Wallet',
        id: window.location.hostname
      },
      user: {
        id: Uint8Array.from(userId, c => c.charCodeAt(0)),
        name: username,
        displayName: username
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 }, // ES256
        { type: 'public-key', alg: -257 } // RS256
      ],
      timeout: 60000,
      attestation: 'direct',
      authenticatorSelection: {
        authenticatorAttachment: 
          authenticatorType === AuthenticatorType.PLATFORM 
            ? 'platform' 
            : (authenticatorType === AuthenticatorType.CROSS_PLATFORM 
                ? 'cross-platform' 
                : undefined),
        userVerification: 'preferred',
        requireResidentKey: true
      }
    };

    const credential = await navigator.credentials.create({
      publicKey: publicKeyOptions
    }) as PublicKeyCredential;

    if (!credential) {
      throw new Error('No credential returned');
    }

    // The attestation response contains the public key and other metadata
    const response = credential.response as AuthenticatorAttestationResponse;
    
    // In a real application, you would send these to your server
    const credentialId = base64URLEncode(credential.rawId);
    const clientDataJSON = base64URLEncode(response.clientDataJSON);
    const attestationObject = base64URLEncode(response.attestationObject);
    
    // This is where you'd send the data to the server
    // const serverResponse = await fetch('/api/credentials/register', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     credentialId,
    //     clientDataJSON,
    //     attestationObject,
    //     username
    //   })
    // });
    
    // For this example, we'll just return success
    return {
      success: true,
      credentialId,
      userId,
      username
    };
  } catch (error) {
    console.error('Error registering credential:', error);
    return {
      success: false,
      error: error.message || 'Failed to register passwordless credential'
    };
  }
}

/**
 * Authenticate with an existing passwordless credential
 */
export async function authenticateWithPasswordless(username: string): Promise<AuthResult> {
  if (!isWebAuthnSupported()) {
    return { 
      success: false, 
      error: 'WebAuthn is not supported in this browser' 
    };
  }

  try {
    // This would normally come from the server based on the username
    // For brevity, we're creating it client-side
    const challengeBuffer = new Uint8Array(32);
    window.crypto.getRandomValues(challengeBuffer);
    
    // In a real app, allowCredentials would be provided by the server
    // based on the credentials registered for this user
    const publicKeyOptions: PublicKeyCredentialRequestOptions = {
      challenge: challengeBuffer,
      timeout: 60000,
      userVerification: 'preferred',
      rpId: window.location.hostname
    };

    const assertion = await navigator.credentials.get({
      publicKey: publicKeyOptions
    }) as PublicKeyCredential;

    if (!assertion) {
      throw new Error('No assertion returned');
    }

    // The assertion response contains the signature
    const response = assertion.response as AuthenticatorAssertionResponse;
    
    // In a real application, you would send these to your server for verification
    const credentialId = base64URLEncode(assertion.rawId);
    const clientDataJSON = base64URLEncode(response.clientDataJSON);
    const authenticatorData = base64URLEncode(response.authenticatorData);
    const signature = base64URLEncode(response.signature);
    
    // This is where you'd send the data to the server
    // const serverResponse = await fetch('/api/credentials/authenticate', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     credentialId,
    //     clientDataJSON,
    //     authenticatorData,
    //     signature,
    //     username
    //   })
    // });
    
    // For this example, we'll just return success
    return {
      success: true,
      credentialId,
      username
    };
  } catch (error) {
    console.error('Error authenticating:', error);
    return {
      success: false,
      error: error.message || 'Failed to authenticate with passwordless credential'
    };
  }
}

/**
 * Check if a user has registered passwordless credentials
 * In a real application, this would query the server
 */
export async function hasRegisteredCredentials(username: string): Promise<boolean> {
  // Mock implementation - in a real app, this would check with the server
  // const response = await fetch(`/api/credentials/check?username=${encodeURIComponent(username)}`);
  // return response.ok;
  
  // For this example, we'll return based on localStorage to simulate persistence
  try {
    const storedValue = localStorage.getItem(`passwordless_registered_${username}`);
    return storedValue === 'true';
  } catch (e) {
    return false;
  }
}

/**
 * Mark a user as having registered passwordless credentials
 * In a real application, this wouldn't be needed as the server would store this
 */
export function markUserAsRegistered(username: string): void {
  try {
    localStorage.setItem(`passwordless_registered_${username}`, 'true');
  } catch (e) {
    console.error('Could not store registration status', e);
  }
}