/**
 * Browser Compatibility Audit Module
 * 
 * This module checks browser compatibility for critical security features used in the wallet.
 * It helps identify which browsers support the security features we rely on.
 */

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

enum DeviceType {
  DESKTOP_WINDOWS = 'Windows Desktop',
  DESKTOP_MAC = 'macOS Desktop',
  DESKTOP_LINUX = 'Linux Desktop',
  MOBILE_IOS = 'iOS Mobile',
  MOBILE_ANDROID = 'Android Mobile',
  TABLET_IOS = 'iOS Tablet',
  TABLET_ANDROID = 'Android Tablet'
}

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

interface BrowserCapability {
  browser: BrowserType;
  minVersion: string;
  device: DeviceType[];
  capabilities: SecurityCapabilities;
}

// Define browser capabilities matrix
const browserCapabilities: BrowserCapability[] = [
  {
    browser: BrowserType.CHROME,
    minVersion: '89',
    device: [
      DeviceType.DESKTOP_WINDOWS,
      DeviceType.DESKTOP_MAC,
      DeviceType.DESKTOP_LINUX,
      DeviceType.MOBILE_ANDROID,
      DeviceType.TABLET_ANDROID
    ],
    capabilities: {
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
  {
    browser: BrowserType.FIREFOX,
    minVersion: '91',
    device: [
      DeviceType.DESKTOP_WINDOWS,
      DeviceType.DESKTOP_MAC,
      DeviceType.DESKTOP_LINUX,
      DeviceType.MOBILE_ANDROID,
      DeviceType.TABLET_ANDROID
    ],
    capabilities: {
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
  {
    browser: BrowserType.SAFARI,
    minVersion: '15.4',
    device: [
      DeviceType.DESKTOP_MAC,
      DeviceType.MOBILE_IOS,
      DeviceType.TABLET_IOS
    ],
    capabilities: {
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
    }
  },
  {
    browser: BrowserType.EDGE,
    minVersion: '91',
    device: [
      DeviceType.DESKTOP_WINDOWS,
      DeviceType.DESKTOP_MAC,
      DeviceType.MOBILE_ANDROID,
      DeviceType.TABLET_ANDROID
    ],
    capabilities: {
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
  {
    browser: BrowserType.BRAVE,
    minVersion: '1.30',
    device: [
      DeviceType.DESKTOP_WINDOWS,
      DeviceType.DESKTOP_MAC,
      DeviceType.DESKTOP_LINUX,
      DeviceType.MOBILE_ANDROID,
      DeviceType.TABLET_ANDROID
    ],
    capabilities: {
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
  {
    browser: BrowserType.OPERA,
    minVersion: '76',
    device: [
      DeviceType.DESKTOP_WINDOWS,
      DeviceType.DESKTOP_MAC,
      DeviceType.DESKTOP_LINUX,
      DeviceType.MOBILE_ANDROID,
      DeviceType.TABLET_ANDROID
    ],
    capabilities: {
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
  {
    browser: BrowserType.SAMSUNG,
    minVersion: '14.0',
    device: [
      DeviceType.MOBILE_ANDROID,
      DeviceType.TABLET_ANDROID
    ],
    capabilities: {
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
  {
    browser: BrowserType.IE,
    minVersion: 'Not Supported',
    device: [
      DeviceType.DESKTOP_WINDOWS
    ],
    capabilities: {
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
    }
  }
];

/**
 * Generate a compatibility report for all browsers and security features
 */
function generateCompatibilityReport(): string {
  let report = "SecureWallet Browser Compatibility Report\n";
  report += "=============================================\n\n";
  report += "This report shows which browsers support the security features used in SecureWallet.\n\n";
  
  // Calculate aggregate compatibility score for each browser
  const browserScores = browserCapabilities.map(browser => {
    const capabilityKeys = Object.keys(browser.capabilities) as (keyof SecurityCapabilities)[];
    const totalCapabilities = capabilityKeys.length;
    const supportedCapabilities = capabilityKeys.filter(key => browser.capabilities[key]).length;
    const compatibilityScore = (supportedCapabilities / totalCapabilities) * 100;
    
    return {
      browser: browser.browser,
      minVersion: browser.minVersion,
      compatibilityScore: Math.round(compatibilityScore),
      supportedCapabilities,
      totalCapabilities
    };
  });
  
  // Sort by compatibility score (highest first)
  browserScores.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
  
  // Add browser compatibility scores to the report
  report += "Browser Compatibility Scores:\n";
  report += "---------------------------\n";
  browserScores.forEach(score => {
    const status = score.compatibilityScore >= 80 ? "✅ Fully Compatible" : 
                  score.compatibilityScore >= 50 ? "⚠️ Partially Compatible" : 
                  "❌ Not Compatible";
    
    report += `${score.browser} (v${score.minVersion}): ${score.compatibilityScore}% (${score.supportedCapabilities}/${score.totalCapabilities}) - ${status}\n`;
  });
  
  // Add detailed feature support matrix
  report += "\nDetailed Security Feature Support:\n";
  report += "-------------------------------\n";
  
  // Get all capability keys
  const capabilityKeys = Object.keys(browserCapabilities[0].capabilities) as (keyof SecurityCapabilities)[];
  
  // For each feature, show which browsers support it
  capabilityKeys.forEach(feature => {
    report += `\n${feature}:\n`;
    
    browserCapabilities.forEach(browser => {
      const supported = browser.capabilities[feature];
      const icon = supported ? "✅" : "❌";
      report += `  ${icon} ${browser.browser} (v${browser.minVersion})\n`;
    });
  });
  
  report += "\nRecommended Browsers:\n";
  report += "--------------------\n";
  const recommendedBrowsers = browserScores
    .filter(score => score.compatibilityScore >= 90)
    .map(score => `${score.browser} (v${score.minVersion} or later)`);
  
  report += recommendedBrowsers.join("\n");
  
  return report;
}

// When running the script directly
if (typeof require !== 'undefined' && require.main === module) {
  console.log(generateCompatibilityReport());
}

export {
  BrowserType,
  DeviceType,
  browserCapabilities,
  generateCompatibilityReport
};