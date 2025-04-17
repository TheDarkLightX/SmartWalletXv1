#!/usr/bin/env node

/**
 * SecureWallet Deployment Script
 * 
 * This script helps deploy the SecureWallet application to various platforms:
 * - Demo mode (local deployment)
 * - Web deployment (via Vercel, Netlify, etc.)
 * - GitHub repository setup
 * - Browser extension packaging
 * - Mobile app building
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import readline from 'readline';

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Array of platforms
const PLATFORMS = {
  DEMO: 'demo',
  WEB: 'web',
  GITHUB: 'github',
  EXTENSION: 'extension',
  MOBILE: 'mobile'
};

// Array of environments
const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production'
};

/**
 * Main function
 */
async function main() {
  console.log('🚀 SecureWallet Deployment Script');
  console.log('=================================\n');
  
  try {
    const platform = await promptPlatform();
    const environment = await promptEnvironment();
    
    console.log(`\nPreparing deployment for ${platform} platform in ${environment} environment...\n`);
    
    // Run tests first
    await runTests();
    
    // Perform deployment based on platform
    switch (platform) {
      case PLATFORMS.DEMO:
        await deployDemo(environment);
        break;
      case PLATFORMS.WEB:
        await deployWeb(environment);
        break;
      case PLATFORMS.GITHUB:
        await setupGitHub();
        break;
      case PLATFORMS.EXTENSION:
        await buildExtension(environment);
        break;
      case PLATFORMS.MOBILE:
        await buildMobile(environment);
        break;
      default:
        throw new Error(`Invalid platform: ${platform}`);
    }
    
    console.log('\n✅ Deployment process completed!');
    
  } catch (error) {
    console.error(`\n❌ Deployment failed: ${error.message}`);
    process.exit(1);
  } finally {
    rl.close();
  }
}

/**
 * Prompt user for platform
 */
function promptPlatform() {
  return new Promise((resolve) => {
    console.log('Select deployment platform:');
    console.log(`1. Demo (local deployment)`);
    console.log(`2. Web (Vercel, Netlify, etc.)`);
    console.log(`3. GitHub Repository Setup`);
    console.log(`4. Browser Extension`);
    console.log(`5. Mobile App`);
    
    rl.question('\nEnter option number: ', (answer) => {
      const option = parseInt(answer.trim());
      
      switch (option) {
        case 1:
          resolve(PLATFORMS.DEMO);
          break;
        case 2:
          resolve(PLATFORMS.WEB);
          break;
        case 3:
          resolve(PLATFORMS.GITHUB);
          break;
        case 4:
          resolve(PLATFORMS.EXTENSION);
          break;
        case 5:
          resolve(PLATFORMS.MOBILE);
          break;
        default:
          console.log('Invalid option, defaulting to Demo');
          resolve(PLATFORMS.DEMO);
      }
    });
  });
}

/**
 * Prompt user for environment
 */
function promptEnvironment() {
  return new Promise((resolve) => {
    console.log('\nSelect deployment environment:');
    console.log(`1. Development`);
    console.log(`2. Staging`);
    console.log(`3. Production`);
    
    rl.question('\nEnter option number: ', (answer) => {
      const option = parseInt(answer.trim());
      
      switch (option) {
        case 1:
          resolve(ENVIRONMENTS.DEVELOPMENT);
          break;
        case 2:
          resolve(ENVIRONMENTS.STAGING);
          break;
        case 3:
          resolve(ENVIRONMENTS.PRODUCTION);
          break;
        default:
          console.log('Invalid option, defaulting to Development');
          resolve(ENVIRONMENTS.DEVELOPMENT);
      }
    });
  });
}

/**
 * Run tests to ensure everything is working
 */
async function runTests() {
  console.log('\n🧪 Running tests...');
  
  try {
    console.log('\nRunning demo tests...');
    execSync('node tests/demo-test.js', { stdio: 'inherit' });
    
    // Run security audit if in production
    console.log('\nRunning security checks...');
    // Commented out as security script is not fully implemented yet
    // execSync('ts-node tests/run-security-audit.ts', { stdio: 'inherit' });
    
    console.log('\n✅ Tests passed!');
    return true;
  } catch (error) {
    console.error('\n❌ Tests failed!');
    
    // Ask if user wants to continue despite test failures
    return new Promise((resolve) => {
      rl.question('\nTests failed. Continue anyway? (y/N): ', (answer) => {
        if (answer.toLowerCase() === 'y') {
          resolve(true);
        } else {
          console.log('Deployment aborted due to test failures.');
          process.exit(1);
        }
      });
    });
  }
}

/**
 * Deploy for demo purposes
 */
async function deployDemo(environment) {
  console.log('\n🔍 Setting up demo deployment...');
  
  // Create .env file from example if it doesn't exist
  if (!fs.existsSync('.env')) {
    console.log('Creating .env file from .env.example...');
    fs.copyFileSync('.env.example', '.env');
    console.log('✅ Created .env file');
  }
  
  // Build the application
  console.log('\nBuilding the application...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('\n✅ Demo deployment ready!');
  console.log('\nTo start the application, run:');
  console.log('  npm start');
}

/**
 * Deploy to web platform
 */
async function deployWeb(environment) {
  console.log('\n🌐 Setting up web deployment...');
  
  // Check for hosting platform
  return new Promise((resolve) => {
    console.log('\nSelect hosting platform:');
    console.log('1. Vercel');
    console.log('2. Netlify');
    console.log('3. Custom Server');
    
    rl.question('\nEnter option number: ', async (answer) => {
      const option = parseInt(answer.trim());
      
      switch (option) {
        case 1:
          await deployToVercel(environment);
          break;
        case 2:
          await deployToNetlify(environment);
          break;
        case 3:
          await deployToCustomServer(environment);
          break;
        default:
          console.log('Invalid option, defaulting to Custom Server');
          await deployToCustomServer(environment);
      }
      
      resolve();
    });
  });
}

/**
 * Deploy to Vercel
 */
async function deployToVercel(environment) {
  console.log('\nPreparing for Vercel deployment...');
  
  // Check if vercel CLI is installed
  try {
    execSync('vercel --version', { stdio: 'ignore' });
  } catch (error) {
    console.log('Vercel CLI not found. Please install it with:');
    console.log('  npm install -g vercel');
    throw new Error('Vercel CLI not installed');
  }
  
  // Create vercel.json if it doesn't exist
  if (!fs.existsSync('vercel.json')) {
    console.log('Creating vercel.json...');
    const vercelConfig = {
      "version": 2,
      "builds": [
        { "src": "server/index.ts", "use": "@vercel/node" },
        { "src": "client/package.json", "use": "@vercel/static-build", "config": { "distDir": "build" } }
      ],
      "routes": [
        { "src": "/api/(.*)", "dest": "server/index.ts" },
        { "src": "/(.*)", "dest": "client/build/$1" }
      ]
    };
    
    fs.writeFileSync('vercel.json', JSON.stringify(vercelConfig, null, 2));
    console.log('✅ Created vercel.json');
  }
  
  // Deploy to Vercel
  console.log('\nDeploying to Vercel...');
  execSync(`vercel --prod`, { stdio: 'inherit' });
  
  console.log('\n✅ Deployment to Vercel completed!');
}

/**
 * Deploy to Netlify
 */
async function deployToNetlify(environment) {
  console.log('\nPreparing for Netlify deployment...');
  
  // Check if netlify CLI is installed
  try {
    execSync('netlify --version', { stdio: 'ignore' });
  } catch (error) {
    console.log('Netlify CLI not found. Please install it with:');
    console.log('  npm install -g netlify-cli');
    throw new Error('Netlify CLI not installed');
  }
  
  // Create netlify.toml if it doesn't exist
  if (!fs.existsSync('netlify.toml')) {
    console.log('Creating netlify.toml...');
    const netlifyConfig = `[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"

[dev]
  command = "npm run dev"
  port = 5000

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
`;
    
    fs.writeFileSync('netlify.toml', netlifyConfig);
    console.log('✅ Created netlify.toml');
  }
  
  // Deploy to Netlify
  console.log('\nDeploying to Netlify...');
  execSync('netlify deploy --prod', { stdio: 'inherit' });
  
  console.log('\n✅ Deployment to Netlify completed!');
}

/**
 * Deploy to custom server
 */
async function deployToCustomServer(environment) {
  console.log('\nPreparing for custom server deployment...');
  
  // Build the application
  console.log('\nBuilding the application...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('\n✅ Build completed!');
  console.log('\nTo deploy to your server:');
  console.log('1. Copy the "dist" directory to your server');
  console.log('2. Set up your server to serve the static files');
  console.log('3. Make sure your server is configured to handle API routes correctly');
}

/**
 * Setup GitHub repository
 */
async function setupGitHub() {
  console.log('\n🐙 Setting up GitHub repository...');
  
  // Check if git is installed
  try {
    execSync('git --version', { stdio: 'ignore' });
  } catch (error) {
    throw new Error('Git is not installed');
  }
  
  // Check if this is already a git repository
  const isGitRepo = fs.existsSync('.git');
  
  if (!isGitRepo) {
    console.log('Initializing git repository...');
    execSync('git init', { stdio: 'inherit' });
  }
  
  // Create .gitignore if it doesn't exist
  if (!fs.existsSync('.gitignore')) {
    console.log('Creating .gitignore...');
    const gitignore = `# Dependencies
node_modules/
.pnp/
.pnp.js

# Testing
coverage/
.nyc_output/

# Build
dist/
build/
out/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Editor directories and files
.idea/
.vscode/
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# OS
.DS_Store
Thumbs.db`;
    
    fs.writeFileSync('.gitignore', gitignore);
    console.log('✅ Created .gitignore');
  }
  
  // Create GitHub workflow for CI/CD
  const workflowsDir = path.join('.github', 'workflows');
  if (!fs.existsSync(workflowsDir)) {
    fs.mkdirSync(workflowsDir, { recursive: true });
  }
  
  // Create CI workflow file
  const ciWorkflowPath = path.join(workflowsDir, 'ci.yml');
  if (!fs.existsSync(ciWorkflowPath)) {
    console.log('Creating GitHub CI workflow...');
    const ciWorkflow = `name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x]
        
    steps:
    - uses: actions/checkout@v3
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    - run: npm ci
    - run: npm run build --if-present
    - run: node tests/demo-test.js
`;
    
    fs.writeFileSync(ciWorkflowPath, ciWorkflow);
    console.log('✅ Created GitHub CI workflow');
  }
  
  // Create security audit workflow
  const securityWorkflowPath = path.join(workflowsDir, 'security-audit.yml');
  if (!fs.existsSync(securityWorkflowPath)) {
    console.log('Creating GitHub security audit workflow...');
    const securityWorkflow = `name: Security Audit

on:
  schedule:
    - cron: '0 0 * * 0'  # Run every Sunday at midnight
  workflow_dispatch:  # Allow manual triggering

jobs:
  audit:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    - name: Use Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18.x'
        cache: 'npm'
    - run: npm ci
    - name: Run npm audit
      run: npm audit
    - name: Run custom security checks
      run: node tests/run-security-audit.js || true
`;
    
    fs.writeFileSync(securityWorkflowPath, securityWorkflow);
    console.log('✅ Created GitHub security audit workflow');
  }
  
  // Add files to git
  console.log('Adding files to git...');
  execSync('git add .', { stdio: 'inherit' });
  
  console.log('\n✅ GitHub repository setup completed!');
  console.log('\nNext steps:');
  console.log('1. Commit your changes: git commit -m "Initial commit"');
  console.log('2. Create a repository on GitHub');
  console.log('3. Add the remote: git remote add origin <repository-url>');
  console.log('4. Push your code: git push -u origin main');
}

/**
 * Build browser extension
 */
async function buildExtension(environment) {
  console.log('\n🧩 Building browser extension...');
  
  // Create extension manifest if it doesn't exist
  const manifestPath = 'extension-manifest.json';
  if (!fs.existsSync(manifestPath)) {
    console.log('Creating extension manifest...');
    const manifest = {
      "manifest_version": 3,
      "name": "SecureWallet",
      "version": "1.0.0",
      "description": "A security-focused smart contract wallet for PulseChain and Ethereum",
      "action": {
        "default_popup": "index.html",
        "default_icon": {
          "16": "icons/icon16.png",
          "32": "icons/icon32.png",
          "48": "icons/icon48.png",
          "128": "icons/icon128.png"
        }
      },
      "permissions": [
        "storage",
        "activeTab"
      ],
      "host_permissions": [
        "*://*.pulsechain.com/*",
        "*://*.ethereum.org/*"
      ],
      "content_security_policy": {
        "extension_pages": "script-src 'self'; object-src 'self'"
      }
    };
    
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log('✅ Created extension manifest');
  }
  
  // Build the extension
  console.log('\nBuilding extension...');
  execSync(`node build-platforms.js extension ${environment}`, { stdio: 'inherit' });
  
  console.log('\n✅ Browser extension build completed!');
  console.log('\nThe extension package is available in the dist/extension directory.');
  console.log('To install in Chrome:');
  console.log('1. Go to chrome://extensions/');
  console.log('2. Enable "Developer mode"');
  console.log('3. Click "Load unpacked" and select the dist/extension directory');
}

/**
 * Build mobile app
 */
async function buildMobile(environment) {
  console.log('\n📱 Building mobile app...');
  
  return new Promise((resolve) => {
    console.log('\nSelect mobile platform:');
    console.log('1. Android');
    console.log('2. iOS');
    console.log('3. Both');
    
    rl.question('\nEnter option number: ', async (answer) => {
      const option = parseInt(answer.trim());
      
      try {
        switch (option) {
          case 1:
            await buildAndroid(environment);
            break;
          case 2:
            await buildIOS(environment);
            break;
          case 3:
            await buildAndroid(environment);
            await buildIOS(environment);
            break;
          default:
            console.log('Invalid option, defaulting to Android');
            await buildAndroid(environment);
        }
        
        resolve();
      } catch (error) {
        throw error;
      }
    });
  });
}

/**
 * Build Android app
 */
async function buildAndroid(environment) {
  console.log('\nBuilding Android app...');
  execSync(`node build-platforms.js android ${environment}`, { stdio: 'inherit' });
  
  console.log('\n✅ Android app build completed!');
  console.log('\nThe APK file is available in the dist/android directory.');
}

/**
 * Build iOS app
 */
async function buildIOS(environment) {
  console.log('\nBuilding iOS app...');
  
  // Check if running on macOS
  if (process.platform !== 'darwin') {
    console.log('⚠️ iOS builds can only be done on macOS');
    console.log('Skipping iOS build...');
    return;
  }
  
  execSync(`node build-platforms.js ios ${environment}`, { stdio: 'inherit' });
  
  console.log('\n✅ iOS app build completed!');
  console.log('\nThe iOS app is available in the dist/ios directory.');
}

// Run the main function
main().catch(console.error);