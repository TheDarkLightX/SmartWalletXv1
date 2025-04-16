/**
 * Cross-Platform Build Configuration
 * 
 * This file contains configuration for building the wallet app for different platforms:
 * - Web (standalone)
 * - Mobile (Android/iOS)
 * - Browser extension
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Platform types
const PLATFORM = {
  WEB: 'web',
  ANDROID: 'android',
  IOS: 'ios',
  EXTENSION: 'extension'
};

// Environment configurations
const ENV = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  STAGING: 'staging'
};

/**
 * Base configuration shared across all platforms
 */
const baseConfig = {
  appName: 'SecureWallet',
  version: '1.0.0',
  description: 'Secure smart contract wallet with multi-party computation and AI-driven security',
  author: 'SecureWallet Team',
  license: 'MIT',
  repository: 'https://github.com/securewalletapp/securewallet',
  primaryChain: 'pulsechain',
  supportedChains: ['pulsechain', 'ethereum'],
  apiEndpoints: {
    development: 'http://localhost:5000/api',
    production: 'https://api.securewallet.com', 
    staging: 'https://staging-api.securewallet.com'
  }
};

/**
 * Web platform specific configuration
 */
const webConfig = {
  ...baseConfig,
  outputDir: 'dist/web',
  publicUrl: '/',
  serviceWorker: true,
  pwa: {
    enabled: true,
    manifest: {
      name: baseConfig.appName,
      short_name: 'SecureWallet',
      theme_color: '#6366f1',
      background_color: '#ffffff',
      display: 'standalone',
      scope: '/',
      start_url: '/',
      icons: [
        {
          src: '/icons/icon-72x72.png',
          sizes: '72x72',
          type: 'image/png'
        },
        {
          src: '/icons/icon-96x96.png',
          sizes: '96x96',
          type: 'image/png'
        },
        {
          src: '/icons/icon-128x128.png',
          sizes: '128x128',
          type: 'image/png'
        },
        {
          src: '/icons/icon-144x144.png',
          sizes: '144x144',
          type: 'image/png'
        },
        {
          src: '/icons/icon-152x152.png',
          sizes: '152x152',
          type: 'image/png'
        },
        {
          src: '/icons/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: '/icons/icon-384x384.png',
          sizes: '384x384',
          type: 'image/png'
        },
        {
          src: '/icons/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    }
  },
  buildCommand: 'npm run build'
};

/**
 * Mobile platform (React Native) specific configuration
 */
const mobileConfig = {
  ...baseConfig,
  outputDir: 'dist/mobile',
  // React Native specific configuration
  reactNative: {
    appId: {
      android: 'com.securewallet.app',
      ios: 'com.securewallet.app'
    },
    permissions: {
      android: [
        'android.permission.INTERNET',
        'android.permission.CAMERA',
        'android.permission.USE_BIOMETRIC',
        'android.permission.USE_FINGERPRINT'
      ],
      ios: [
        'NSCameraUsageDescription',
        'NSFaceIDUsageDescription'
      ]
    },
    splashScreen: {
      backgroundColor: '#ffffff',
      image: 'assets/splash.png',
      resizeMode: 'contain'
    },
    icon: 'assets/icon.png',
    deepLinking: {
      enabled: true,
      prefixes: ['securewallet://', 'https://app.securewallet.com']
    }
  },
  // Platform specific build commands
  buildCommands: {
    android: 'cd mobile && npm run android:build',
    ios: 'cd mobile && npm run ios:build'
  }
};

/**
 * Browser extension specific configuration
 */
const extensionConfig = {
  ...baseConfig,
  outputDir: 'dist/extension',
  manifestVersion: 3,
  extension: {
    manifest: {
      name: baseConfig.appName,
      version: baseConfig.version,
      description: baseConfig.description,
      manifest_version: 3,
      action: {
        default_popup: 'index.html',
        default_icon: {
          '16': 'icons/icon-16x16.png',
          '32': 'icons/icon-32x32.png',
          '48': 'icons/icon-48x48.png',
          '128': 'icons/icon-128x128.png'
        }
      },
      permissions: [
        'storage',
        'activeTab',
        'scripting'
      ],
      host_permissions: [
        '*://*.pulsechain.com/*',
        '*://*.ethereum.org/*'
      ],
      content_security_policy: {
        extension_pages: "script-src 'self'; object-src 'self'"
      },
      background: {
        service_worker: 'background.js'
      },
      content_scripts: [
        {
          matches: ['*://*.pulsechain.com/*', '*://*.ethereum.org/*'],
          js: ['content.js']
        }
      ]
    }
  },
  buildCommand: 'npm run build:extension'
};

/**
 * Get configuration for specified platform and environment
 */
function getConfig(platform = PLATFORM.WEB, env = ENV.DEVELOPMENT) {
  let config;
  
  switch (platform) {
    case PLATFORM.ANDROID:
    case PLATFORM.IOS:
      config = { ...mobileConfig };
      break;
    case PLATFORM.EXTENSION:
      config = { ...extensionConfig };
      break;
    case PLATFORM.WEB:
    default:
      config = { ...webConfig };
      break;
  }
  
  // Set environment-specific settings
  config.environment = env;
  config.apiEndpoint = baseConfig.apiEndpoints[env];
  config.isDevelopment = env === ENV.DEVELOPMENT;
  config.isProduction = env === ENV.PRODUCTION;
  
  return config;
}

/**
 * Execute build for specified platform and environment
 */
function buildForPlatform(platform = PLATFORM.WEB, env = ENV.DEVELOPMENT) {
  const config = getConfig(platform, env);
  console.log(`Building for platform: ${platform}, environment: ${env}`);
  
  // Ensure output directory exists
  if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true });
  }
  
  // Create platform-specific environment file
  const envContent = `VITE_APP_ENV=${env}
VITE_APP_API_URL=${config.apiEndpoint}
VITE_APP_PLATFORM=${platform}
VITE_APP_VERSION=${config.version}
VITE_PRIMARY_CHAIN=${config.primaryChain}
`;
  
  fs.writeFileSync('.env.local', envContent);
  
  // Execute build command based on platform
  switch (platform) {
    case PLATFORM.ANDROID:
      execSync(config.buildCommands.android, { stdio: 'inherit' });
      break;
    case PLATFORM.IOS:
      execSync(config.buildCommands.ios, { stdio: 'inherit' });
      break;
    case PLATFORM.EXTENSION:
      execSync(config.buildCommand, { stdio: 'inherit' });
      // Create manifest.json for extension
      fs.writeFileSync(
        path.join(config.outputDir, 'manifest.json'), 
        JSON.stringify(config.extension.manifest, null, 2)
      );
      break;
    case PLATFORM.WEB:
    default:
      execSync(config.buildCommand, { stdio: 'inherit' });
      // Generate web manifest for PWA
      if (config.pwa.enabled) {
        fs.writeFileSync(
          path.join(config.outputDir, 'manifest.json'), 
          JSON.stringify(config.pwa.manifest, null, 2)
        );
      }
      break;
  }
  
  console.log(`Build completed for ${platform} (${env})!`);
  console.log(`Output directory: ${path.resolve(config.outputDir)}`);
}

module.exports = {
  PLATFORM,
  ENV,
  getConfig,
  buildForPlatform
};

// When run directly via node
if (require.main === module) {
  const args = process.argv.slice(2);
  const platform = args[0] || PLATFORM.WEB;
  const env = args[1] || ENV.DEVELOPMENT;
  
  if (!Object.values(PLATFORM).includes(platform)) {
    console.error(`Invalid platform: ${platform}. Valid options: ${Object.values(PLATFORM).join(', ')}`);
    process.exit(1);
  }
  
  if (!Object.values(ENV).includes(env)) {
    console.error(`Invalid environment: ${env}. Valid options: ${Object.values(ENV).join(', ')}`);
    process.exit(1);
  }
  
  buildForPlatform(platform, env);
}