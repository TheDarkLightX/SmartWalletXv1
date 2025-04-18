/**
 * Cross-Platform Build Script
 * 
 * This script can be used to build the wallet for different platforms:
 * - Web (standalone)
 * - Browser extension
 * - Mobile (Android/iOS) through React Native
 * 
 * Usage:
 *   node build-platforms.js <platform> <environment>
 * 
 * Examples:
 *   node build-platforms.js web production
 *   node build-platforms.js extension development
 *   node build-platforms.js android production
 *   node build-platforms.js ios development
 *   node build-platforms.js all production
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const config = require('./build-config');

const { PLATFORM, ENV } = config;

// Parse command line arguments
const args = process.argv.slice(2);
const platform = args[0] || 'web';
const env = args[1] || 'development';

// Validate platform
if (platform !== 'all' && !Object.values(PLATFORM).includes(platform)) {
  console.error(`Invalid platform: ${platform}. Valid options: ${Object.values(PLATFORM).join(', ')}, all`);
  process.exit(1);
}

// Validate environment
if (!Object.values(ENV).includes(env)) {
  console.error(`Invalid environment: ${env}. Valid options: ${Object.values(ENV).join(', ')}`);
  process.exit(1);
}

// Build for all platforms or a specific one
if (platform === 'all') {
  console.log(`Building for all platforms in ${env} environment...`);
  
  // Build for each platform
  Object.values(PLATFORM).forEach(p => {
    try {
      config.buildForPlatform(p, env);
      console.log(`Successfully built for ${p}`);
    } catch (error) {
      console.error(`Failed to build for ${p}: ${error.message}`);
    }
  });
  
  console.log('All builds completed!');
} else {
  // Build for specific platform
  try {
    config.buildForPlatform(platform, env);
    console.log(`Successfully built for ${platform} in ${env} environment`);
  } catch (error) {
    console.error(`Build failed: ${error.message}`);
    process.exit(1);
  }
}

// Instructions for using the build
console.log('\nBuild Instructions:');
switch (platform) {
  case PLATFORM.WEB:
    console.log(`
Web Application (${env}):
- The build is located in: dist/web
- Deploy these files to your web server
- For local testing: npx serve -s dist/web
`);
    break;
    
  case PLATFORM.EXTENSION:
    console.log(`
Browser Extension (${env}):
- The build is located in: dist/extension
- Chrome: Open chrome://extensions, enable Developer mode, click "Load unpacked", select the dist/extension folder
- Firefox: Open about:debugging, click "This Firefox", click "Load Temporary Add-on", select any file in the dist/extension folder
`);
    break;
    
  case PLATFORM.ANDROID:
    console.log(`
Android App (${env}):
- The build is located in: dist/mobile/android
- APK file: dist/mobile/android/app/build/outputs/apk/release/app-release.apk
- Install on device: adb install dist/mobile/android/app/build/outputs/apk/release/app-release.apk
`);
    break;
    
  case PLATFORM.IOS:
    console.log(`
iOS App (${env}):
- The build is located in: dist/mobile/ios
- Open Xcode project: dist/mobile/ios/SecureWallet.xcworkspace
- Select a device or simulator and run the app
`);
    break;
    
  case 'all':
    console.log(`
All platforms were built for ${env} environment:
- Web: dist/web (deploy to web server)
- Extension: dist/extension (load as unpacked extension)
- Android: dist/mobile/android (APK in app/build/outputs/apk/release/)
- iOS: dist/mobile/ios (open in Xcode)
`);
    break;
}

console.log(`For more details, see the README.md or deployment documentation.`);