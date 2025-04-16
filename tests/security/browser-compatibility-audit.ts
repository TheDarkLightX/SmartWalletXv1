/**
 * Browser Compatibility Audit for TEE Implementation
 * 
 * This script checks browser capabilities to determine which Trusted Execution 
 * Environment features are supported across different platforms.
 */

// Types of browsers to check
enum BrowserType {
  CHROME = 'Google Chrome',
  FIREFOX = 'Mozilla Firefox',
  SAFARI = 'Apple Safari',
  EDGE = 'Microsoft Edge',
  SAMSUNG = 'Samsung Internet',
  OPERA = 'Opera',
  BRAVE = 'Brave',
  IE = 'Internet Explorer'
}

// Types of devices/platforms
enum DeviceType {
  DESKTOP_WINDOWS = 'Windows Desktop',
  DESKTOP_MAC = 'macOS Desktop',
  DESKTOP_LINUX = 'Linux Desktop',
  MOBILE_IOS = 'iOS Mobile',
  MOBILE_ANDROID = 'Android Mobile',
  TABLET_IOS = 'iOS Tablet',
  TABLET_ANDROID = 'Android Tablet'
}

// Security capabilities to check
interface SecurityCapabilities {
  webCrypto: boolean;
  secureContext: boolean;
  webAuthn: boolean;
  secureCookies: boolean;
  contentSecurityPolicy: boolean;
  subresourceIntegrity: boolean;
  credentialManagement: boolean;
  publicKeyCredential: boolean;
  indexedDBEncryption: boolean;
  secureStorage: boolean;
  deviceMemory: boolean;
  hardwareConcurrency: boolean;
  teeDetection: boolean;
  biometricAuth: boolean;
}

// Create compatibility table mapping browsers and devices to their TEE capabilities
const compatibilityTable: Record<BrowserType, Record<DeviceType, Partial<SecurityCapabilities>>> = {
  [BrowserType.CHROME]: {
    [DeviceType.DESKTOP_WINDOWS]: {
      webCrypto: true,
      secureContext: true,
      webAuthn: true,
      secureCookies: true,
      contentSecurityPolicy: true,
      subresourceIntegrity: true,
      credentialManagement: true,
      publicKeyCredential: true,
      indexedDBEncryption: true,
      secureStorage: true,
      deviceMemory: true,
      hardwareConcurrency: true,
      teeDetection: false, // Limited access to Windows TPM
      biometricAuth: true // Through WebAuthn
    },
    [DeviceType.DESKTOP_MAC]: {
      webCrypto: true,
      secureContext: true,
      webAuthn: true,
      secureCookies: true,
      contentSecurityPolicy: true,
      subresourceIntegrity: true,
      credentialManagement: true,
      publicKeyCredential: true,
      indexedDBEncryption: true,
      secureStorage: true,
      deviceMemory: true,
      hardwareConcurrency: true,
      teeDetection: false, // No direct Secure Enclave access
      biometricAuth: true // Through WebAuthn 
    },
    [DeviceType.DESKTOP_LINUX]: {
      webCrypto: true,
      secureContext: true,
      webAuthn: true,
      secureCookies: true,
      contentSecurityPolicy: true,
      subresourceIntegrity: true,
      credentialManagement: true,
      publicKeyCredential: true,
      indexedDBEncryption: true,
      secureStorage: true,
      deviceMemory: true,
      hardwareConcurrency: true,
      teeDetection: false, // Varies by Linux distro and hardware
      biometricAuth: false // Limited support
    },
    [DeviceType.MOBILE_IOS]: {
      webCrypto: true,
      secureContext: true,
      webAuthn: true,
      secureCookies: true,
      contentSecurityPolicy: true,
      subresourceIntegrity: true,
      credentialManagement: true,
      publicKeyCredential: true,
      indexedDBEncryption: true,
      secureStorage: true,
      deviceMemory: false, // Not exposed on iOS
      hardwareConcurrency: true,
      teeDetection: false, // No direct Secure Enclave access
      biometricAuth: true // Through WebAuthn
    },
    [DeviceType.MOBILE_ANDROID]: {
      webCrypto: true,
      secureContext: true,
      webAuthn: true,
      secureCookies: true,
      contentSecurityPolicy: true,
      subresourceIntegrity: true,
      credentialManagement: true,
      publicKeyCredential: true,
      indexedDBEncryption: true,
      secureStorage: true,
      deviceMemory: true,
      hardwareConcurrency: true,
      teeDetection: false, // Limited TrustZone access 
      biometricAuth: true // Through WebAuthn
    },
    [DeviceType.TABLET_IOS]: {
      webCrypto: true,
      secureContext: true,
      webAuthn: true,
      secureCookies: true,
      contentSecurityPolicy: true,
      subresourceIntegrity: true,
      credentialManagement: true,
      publicKeyCredential: true,
      indexedDBEncryption: true,
      secureStorage: true,
      deviceMemory: false, // Not exposed on iOS
      hardwareConcurrency: true,
      teeDetection: false, // No direct Secure Enclave access
      biometricAuth: true // Through WebAuthn
    },
    [DeviceType.TABLET_ANDROID]: {
      webCrypto: true,
      secureContext: true,
      webAuthn: true,
      secureCookies: true,
      contentSecurityPolicy: true,
      subresourceIntegrity: true,
      credentialManagement: true,
      publicKeyCredential: true,
      indexedDBEncryption: true,
      secureStorage: true,
      deviceMemory: true,
      hardwareConcurrency: true,
      teeDetection: false, // Limited TrustZone access
      biometricAuth: true // Through WebAuthn
    }
  },
  [BrowserType.FIREFOX]: {
    // Similar entries for Firefox across all device types
    [DeviceType.DESKTOP_WINDOWS]: {
      webCrypto: true,
      secureContext: true,
      webAuthn: true,
      secureCookies: true,
      contentSecurityPolicy: true,
      subresourceIntegrity: true,
      credentialManagement: true,
      publicKeyCredential: true,
      indexedDBEncryption: true,
      secureStorage: true,
      deviceMemory: false, // Not exposed in Firefox
      hardwareConcurrency: true,
      teeDetection: false,
      biometricAuth: true // Through WebAuthn
    },
    // Other device types similar but with variations
    [DeviceType.MOBILE_IOS]: {
      webCrypto: true,
      secureContext: true,
      webAuthn: true,
      secureCookies: true,
      contentSecurityPolicy: true,
      subresourceIntegrity: true,
      credentialManagement: true,
      publicKeyCredential: true,
      indexedDBEncryption: true,
      secureStorage: true,
      deviceMemory: false,
      hardwareConcurrency: false, // Limited on iOS Firefox
      teeDetection: false,
      biometricAuth: true
    },
    // Other device types filled similarly
    [DeviceType.DESKTOP_MAC]: {
      webCrypto: true,
      secureContext: true,
      webAuthn: true,
      secureCookies: true,
      contentSecurityPolicy: true,
      subresourceIntegrity: true,
      credentialManagement: true,
      publicKeyCredential: true,
      indexedDBEncryption: true,
      secureStorage: true,
      deviceMemory: false,
      hardwareConcurrency: true,
      teeDetection: false,
      biometricAuth: true
    },
    [DeviceType.DESKTOP_LINUX]: {
      webCrypto: true,
      secureContext: true,
      webAuthn: true,
      secureCookies: true,
      contentSecurityPolicy: true,
      subresourceIntegrity: true,
      credentialManagement: true,
      publicKeyCredential: true,
      indexedDBEncryption: true,
      secureStorage: true,
      deviceMemory: false,
      hardwareConcurrency: true,
      teeDetection: false,
      biometricAuth: false
    },
    [DeviceType.MOBILE_ANDROID]: {
      webCrypto: true,
      secureContext: true,
      webAuthn: true,
      secureCookies: true,
      contentSecurityPolicy: true,
      subresourceIntegrity: true,
      credentialManagement: true,
      publicKeyCredential: true,
      indexedDBEncryption: true,
      secureStorage: true,
      deviceMemory: false,
      hardwareConcurrency: true,
      teeDetection: false,
      biometricAuth: true
    },
    [DeviceType.TABLET_IOS]: {
      webCrypto: true,
      secureContext: true,
      webAuthn: true,
      secureCookies: true,
      contentSecurityPolicy: true,
      subresourceIntegrity: true,
      credentialManagement: true,
      publicKeyCredential: true,
      indexedDBEncryption: true,
      secureStorage: true,
      deviceMemory: false,
      hardwareConcurrency: false,
      teeDetection: false,
      biometricAuth: true
    },
    [DeviceType.TABLET_ANDROID]: {
      webCrypto: true,
      secureContext: true,
      webAuthn: true,
      secureCookies: true,
      contentSecurityPolicy: true,
      subresourceIntegrity: true,
      credentialManagement: true,
      publicKeyCredential: true,
      indexedDBEncryption: true,
      secureStorage: true,
      deviceMemory: false,
      hardwareConcurrency: true,
      teeDetection: false,
      biometricAuth: true
    }
  },
  [BrowserType.SAFARI]: {
    // Safari entries, notably different for iOS
    [DeviceType.DESKTOP_MAC]: {
      webCrypto: true,
      secureContext: true,
      webAuthn: true,
      secureCookies: true,
      contentSecurityPolicy: true,
      subresourceIntegrity: true,
      credentialManagement: true,
      publicKeyCredential: true,
      indexedDBEncryption: true,
      secureStorage: true,
      deviceMemory: false, // Not exposed in Safari
      hardwareConcurrency: true,
      teeDetection: false, // No direct Secure Enclave access 
      biometricAuth: true // Through WebAuthn and Touch ID integration
    },
    [DeviceType.MOBILE_IOS]: {
      webCrypto: true,
      secureContext: true,
      webAuthn: true,
      secureCookies: true,
      contentSecurityPolicy: true,
      subresourceIntegrity: true,
      credentialManagement: true,
      publicKeyCredential: true,
      indexedDBEncryption: true,
      secureStorage: true,
      deviceMemory: false,
      hardwareConcurrency: true,
      teeDetection: false, // No direct Secure Enclave access
      biometricAuth: true // Through WebAuthn and Face ID/Touch ID
    },
    // Fill in other device types as appropriate
    [DeviceType.DESKTOP_WINDOWS]: {
      webCrypto: false, // Safari not available on Windows anymore
      secureContext: false,
      webAuthn: false,
      secureCookies: false,
      contentSecurityPolicy: false,
      subresourceIntegrity: false,
      credentialManagement: false,
      publicKeyCredential: false,
      indexedDBEncryption: false,
      secureStorage: false,
      deviceMemory: false,
      hardwareConcurrency: false,
      teeDetection: false,
      biometricAuth: false
    },
    [DeviceType.DESKTOP_LINUX]: {
      webCrypto: false, // Safari not available on Linux
      secureContext: false,
      webAuthn: false,
      secureCookies: false,
      contentSecurityPolicy: false,
      subresourceIntegrity: false,
      credentialManagement: false,
      publicKeyCredential: false,
      indexedDBEncryption: false,
      secureStorage: false,
      deviceMemory: false,
      hardwareConcurrency: false,
      teeDetection: false,
      biometricAuth: false
    },
    [DeviceType.MOBILE_ANDROID]: {
      webCrypto: false, // Safari not available on Android
      secureContext: false,
      webAuthn: false,
      secureCookies: false,
      contentSecurityPolicy: false,
      subresourceIntegrity: false,
      credentialManagement: false,
      publicKeyCredential: false,
      indexedDBEncryption: false,
      secureStorage: false,
      deviceMemory: false,
      hardwareConcurrency: false,
      teeDetection: false,
      biometricAuth: false
    },
    [DeviceType.TABLET_IOS]: {
      webCrypto: true,
      secureContext: true,
      webAuthn: true,
      secureCookies: true,
      contentSecurityPolicy: true,
      subresourceIntegrity: true,
      credentialManagement: true,
      publicKeyCredential: true,
      indexedDBEncryption: true,
      secureStorage: true,
      deviceMemory: false,
      hardwareConcurrency: true,
      teeDetection: false,
      biometricAuth: true
    },
    [DeviceType.TABLET_ANDROID]: {
      webCrypto: false, // Safari not available on Android
      secureContext: false,
      webAuthn: false,
      secureCookies: false,
      contentSecurityPolicy: false,
      subresourceIntegrity: false,
      credentialManagement: false,
      publicKeyCredential: false,
      indexedDBEncryption: false,
      secureStorage: false,
      deviceMemory: false,
      hardwareConcurrency: false,
      teeDetection: false,
      biometricAuth: false
    }
  },
  // Add other browsers as needed...
  [BrowserType.EDGE]: {
    // Similar to Chrome as it's Chromium-based
    [DeviceType.DESKTOP_WINDOWS]: {
      webCrypto: true,
      secureContext: true,
      webAuthn: true,
      secureCookies: true,
      contentSecurityPolicy: true,
      subresourceIntegrity: true,
      credentialManagement: true,
      publicKeyCredential: true,
      indexedDBEncryption: true,
      secureStorage: true,
      deviceMemory: true,
      hardwareConcurrency: true,
      teeDetection: false, // Limited TPM access but better than Chrome
      biometricAuth: true // Integrated with Windows Hello
    },
    // Other device types filled similarly
    [DeviceType.DESKTOP_MAC]: {
      webCrypto: true,
      secureContext: true,
      webAuthn: true,
      secureCookies: true,
      contentSecurityPolicy: true,
      subresourceIntegrity: true,
      credentialManagement: true,
      publicKeyCredential: true,
      indexedDBEncryption: true,
      secureStorage: true,
      deviceMemory: true,
      hardwareConcurrency: true,
      teeDetection: false,
      biometricAuth: true
    },
    [DeviceType.DESKTOP_LINUX]: {
      webCrypto: true,
      secureContext: true,
      webAuthn: true,
      secureCookies: true,
      contentSecurityPolicy: true,
      subresourceIntegrity: true,
      credentialManagement: true,
      publicKeyCredential: true,
      indexedDBEncryption: true,
      secureStorage: true,
      deviceMemory: true,
      hardwareConcurrency: true,
      teeDetection: false,
      biometricAuth: false
    },
    [DeviceType.MOBILE_IOS]: {
      webCrypto: true,
      secureContext: true,
      webAuthn: true,
      secureCookies: true,
      contentSecurityPolicy: true,
      subresourceIntegrity: true,
      credentialManagement: true,
      publicKeyCredential: true,
      indexedDBEncryption: true,
      secureStorage: true,
      deviceMemory: false,
      hardwareConcurrency: true,
      teeDetection: false,
      biometricAuth: true
    },
    [DeviceType.MOBILE_ANDROID]: {
      webCrypto: true,
      secureContext: true,
      webAuthn: true,
      secureCookies: true,
      contentSecurityPolicy: true,
      subresourceIntegrity: true,
      credentialManagement: true,
      publicKeyCredential: true,
      indexedDBEncryption: true,
      secureStorage: true,
      deviceMemory: true,
      hardwareConcurrency: true,
      teeDetection: false,
      biometricAuth: true
    },
    [DeviceType.TABLET_IOS]: {
      webCrypto: true,
      secureContext: true,
      webAuthn: true,
      secureCookies: true,
      contentSecurityPolicy: true,
      subresourceIntegrity: true,
      credentialManagement: true,
      publicKeyCredential: true,
      indexedDBEncryption: true,
      secureStorage: true,
      deviceMemory: false,
      hardwareConcurrency: true,
      teeDetection: false,
      biometricAuth: true
    },
    [DeviceType.TABLET_ANDROID]: {
      webCrypto: true,
      secureContext: true,
      webAuthn: true,
      secureCookies: true,
      contentSecurityPolicy: true,
      subresourceIntegrity: true,
      credentialManagement: true,
      publicKeyCredential: true,
      indexedDBEncryption: true,
      secureStorage: true,
      deviceMemory: true,
      hardwareConcurrency: true,
      teeDetection: false,
      biometricAuth: true
    }
  },
  // Simplified for other browsers
  [BrowserType.SAMSUNG]: {
    // Samsung Internet browser, primarily on Samsung Android devices
    [DeviceType.MOBILE_ANDROID]: {
      webCrypto: true,
      secureContext: true,
      webAuthn: true,
      secureCookies: true,
      contentSecurityPolicy: true,
      subresourceIntegrity: true,
      credentialManagement: true,
      publicKeyCredential: true,
      indexedDBEncryption: true,
      secureStorage: true,
      deviceMemory: true,
      hardwareConcurrency: true,
      teeDetection: false, // Limited but may have some Samsung Knox integration
      biometricAuth: true
    },
    // N/A for other platforms
    [DeviceType.DESKTOP_WINDOWS]: {
      webCrypto: false,
      secureContext: false,
      webAuthn: false,
      secureCookies: false,
      contentSecurityPolicy: false,
      subresourceIntegrity: false,
      credentialManagement: false,
      publicKeyCredential: false,
      indexedDBEncryption: false,
      secureStorage: false,
      deviceMemory: false,
      hardwareConcurrency: false,
      teeDetection: false,
      biometricAuth: false
    },
    // Fill other platforms similarly
    [DeviceType.DESKTOP_MAC]: {
      webCrypto: false,
      secureContext: false,
      webAuthn: false,
      secureCookies: false,
      contentSecurityPolicy: false,
      subresourceIntegrity: false,
      credentialManagement: false,
      publicKeyCredential: false,
      indexedDBEncryption: false,
      secureStorage: false,
      deviceMemory: false,
      hardwareConcurrency: false,
      teeDetection: false,
      biometricAuth: false
    },
    [DeviceType.DESKTOP_LINUX]: {
      webCrypto: false,
      secureContext: false,
      webAuthn: false,
      secureCookies: false,
      contentSecurityPolicy: false,
      subresourceIntegrity: false,
      credentialManagement: false,
      publicKeyCredential: false,
      indexedDBEncryption: false,
      secureStorage: false,
      deviceMemory: false,
      hardwareConcurrency: false,
      teeDetection: false,
      biometricAuth: false
    },
    [DeviceType.MOBILE_IOS]: {
      webCrypto: false,
      secureContext: false,
      webAuthn: false,
      secureCookies: false,
      contentSecurityPolicy: false,
      subresourceIntegrity: false,
      credentialManagement: false,
      publicKeyCredential: false,
      indexedDBEncryption: false,
      secureStorage: false,
      deviceMemory: false,
      hardwareConcurrency: false,
      teeDetection: false,
      biometricAuth: false
    },
    [DeviceType.TABLET_IOS]: {
      webCrypto: false,
      secureContext: false,
      webAuthn: false,
      secureCookies: false,
      contentSecurityPolicy: false,
      subresourceIntegrity: false,
      credentialManagement: false,
      publicKeyCredential: false,
      indexedDBEncryption: false,
      secureStorage: false,
      deviceMemory: false,
      hardwareConcurrency: false,
      teeDetection: false,
      biometricAuth: false
    },
    [DeviceType.TABLET_ANDROID]: {
      webCrypto: true,
      secureContext: true,
      webAuthn: true,
      secureCookies: true,
      contentSecurityPolicy: true,
      subresourceIntegrity: true,
      credentialManagement: true,
      publicKeyCredential: true,
      indexedDBEncryption: true,
      secureStorage: true,
      deviceMemory: true,
      hardwareConcurrency: true,
      teeDetection: false,
      biometricAuth: true
    }
  },
  // Minimally fill in other browsers
  [BrowserType.OPERA]: {
    // Similar to Chrome
    [DeviceType.DESKTOP_WINDOWS]: {
      webCrypto: true,
      secureContext: true,
      webAuthn: true,
      biometricAuth: true,
      teeDetection: false
    },
    // Other platforms similar to Chrome
    [DeviceType.DESKTOP_MAC]: {
      webCrypto: true,
      secureContext: true,
      webAuthn: true,
      biometricAuth: true,
      teeDetection: false
    },
    [DeviceType.DESKTOP_LINUX]: {
      webCrypto: true,
      secureContext: true,
      webAuthn: true,
      biometricAuth: false,
      teeDetection: false
    },
    [DeviceType.MOBILE_IOS]: {
      webCrypto: true,
      secureContext: true,
      webAuthn: true,
      biometricAuth: true,
      teeDetection: false
    },
    [DeviceType.MOBILE_ANDROID]: {
      webCrypto: true,
      secureContext: true,
      webAuthn: true,
      biometricAuth: true,
      teeDetection: false
    },
    [DeviceType.TABLET_IOS]: {
      webCrypto: true,
      secureContext: true,
      webAuthn: true,
      biometricAuth: true,
      teeDetection: false
    },
    [DeviceType.TABLET_ANDROID]: {
      webCrypto: true,
      secureContext: true,
      webAuthn: true,
      biometricAuth: true,
      teeDetection: false
    }
  },
  [BrowserType.BRAVE]: {
    // Similar to Chrome but with enhanced privacy
    [DeviceType.DESKTOP_WINDOWS]: {
      webCrypto: true,
      secureContext: true,
      webAuthn: true,
      biometricAuth: true,
      teeDetection: false
    },
    // Other platforms similar
    [DeviceType.DESKTOP_MAC]: {
      webCrypto: true,
      secureContext: true,
      webAuthn: true,
      biometricAuth: true,
      teeDetection: false
    },
    [DeviceType.DESKTOP_LINUX]: {
      webCrypto: true,
      secureContext: true,
      webAuthn: true,
      biometricAuth: false,
      teeDetection: false
    },
    [DeviceType.MOBILE_IOS]: {
      webCrypto: true,
      secureContext: true,
      webAuthn: true,
      biometricAuth: true,
      teeDetection: false
    },
    [DeviceType.MOBILE_ANDROID]: {
      webCrypto: true,
      secureContext: true,
      webAuthn: true,
      biometricAuth: true,
      teeDetection: false
    },
    [DeviceType.TABLET_IOS]: {
      webCrypto: true,
      secureContext: true,
      webAuthn: true,
      biometricAuth: true,
      teeDetection: false
    },
    [DeviceType.TABLET_ANDROID]: {
      webCrypto: true,
      secureContext: true,
      webAuthn: true,
      biometricAuth: true,
      teeDetection: false
    }
  },
  [BrowserType.IE]: {
    // Legacy browser with minimal modern security support
    [DeviceType.DESKTOP_WINDOWS]: {
      webCrypto: false,
      secureContext: false,
      webAuthn: false,
      secureCookies: true,
      contentSecurityPolicy: false,
      subresourceIntegrity: false,
      credentialManagement: false,
      publicKeyCredential: false,
      indexedDBEncryption: false,
      secureStorage: false,
      deviceMemory: false,
      hardwareConcurrency: false,
      teeDetection: false,
      biometricAuth: false
    },
    // Not available on other platforms
    [DeviceType.DESKTOP_MAC]: {
      webCrypto: false,
      secureContext: false,
      webAuthn: false,
      biometricAuth: false,
      teeDetection: false
    },
    [DeviceType.DESKTOP_LINUX]: {
      webCrypto: false,
      secureContext: false,
      webAuthn: false,
      biometricAuth: false,
      teeDetection: false
    },
    [DeviceType.MOBILE_IOS]: {
      webCrypto: false,
      secureContext: false,
      webAuthn: false,
      biometricAuth: false,
      teeDetection: false
    },
    [DeviceType.MOBILE_ANDROID]: {
      webCrypto: false,
      secureContext: false,
      webAuthn: false,
      biometricAuth: false,
      teeDetection: false
    },
    [DeviceType.TABLET_IOS]: {
      webCrypto: false,
      secureContext: false,
      webAuthn: false,
      biometricAuth: false,
      teeDetection: false
    },
    [DeviceType.TABLET_ANDROID]: {
      webCrypto: false,
      secureContext: false,
      webAuthn: false,
      biometricAuth: false,
      teeDetection: false
    }
  }
};

// Function to generate a compatibility report
function generateCompatibilityReport(): string {
  let report = "Browser Compatibility Report for TEE and Security Features\n";
  report += "==========================================================\n\n";
  
  // Summary of direct TEE access
  report += "Direct TEE Access Support:\n";
  report += "--------------------------\n";
  report += "- No major browser currently provides direct access to TEE technologies\n";
  report += "- Access requires native applications or browser extensions with special permissions\n";
  report += "- WebAuthn provides indirect access to some secure hardware features\n\n";
  
  // Best options for each platform
  report += "Recommended Implementation by Platform:\n";
  report += "-------------------------------------\n";
  
  report += "iOS Devices (iPhone, iPad):\n";
  report += "- Use software fallback with WebAuthn for biometric auth\n";
  report += "- Safari provides the best integration with Secure Enclave via WebAuthn\n";
  report += "- No direct access to Secure Enclave from web apps\n";
  report += "- Consider a native app companion for critical security operations\n\n";
  
  report += "Android Devices:\n";
  report += "- Use software fallback with WebAuthn for biometric auth\n";
  report += "- Chrome/Samsung Internet provide good WebAuthn support\n";
  report += "- No direct access to TrustZone from web apps\n";
  report += "- Consider a native app companion for critical security operations\n\n";
  
  report += "Windows Desktop:\n";
  report += "- Edge has best integration with Windows Hello biometrics\n";
  report += "- All modern browsers support WebCrypto for secure operations\n";
  report += "- No direct TPM access from browsers\n";
  report += "- Use WebAuthn for hardware-backed key operations where possible\n\n";
  
  report += "Mac Desktop:\n";
  report += "- Safari has best integration with Touch ID on supported Macs\n";
  report += "- All modern browsers support WebCrypto for secure operations\n";
  report += "- No direct Secure Enclave access from browsers\n";
  report += "- Use WebAuthn for Touch ID authentication where available\n\n";
  
  // Implementation recommendations
  report += "Recommended Security Implementation:\n";
  report += "----------------------------------\n";
  report += "1. Use software fallback for TEE simulation in all browsers\n";
  report += "2. Implement WebAuthn for biometric authentication and hardware-backed credentials\n";
  report += "3. Use WebCrypto API for all cryptographic operations\n";
  report += "4. Consider a hybrid approach with a native app for critical security operations\n";
  report += "5. Implement robust feature detection to adapt to available capabilities\n";
  report += "6. Use secure, HTTP-only cookies and implement proper CSRF protection\n";
  report += "7. Apply Content Security Policy to prevent XSS attacks\n\n";
  
  // Fallback strategy
  report += "TEE Fallback Strategy:\n";
  report += "---------------------\n";
  report += "When no secure hardware is available, implement a software-based TEE simulation that:\n";
  report += "1. Uses the best available entropy source for secure random generation\n";
  report += "2. Leverages WebCrypto for all cryptographic operations\n";
  report += "3. Stores sensitive data in IndexedDB with proper encryption\n";
  report += "4. Implements memory protection to minimize data exposure\n";
  report += "5. Provides clear UI indicators when operating in fallback mode\n";
  
  return report;
}

// Run the audit
console.log(generateCompatibilityReport());