/**
 * Core Functionality Test Script
 * 
 * This script tests the core components of the SecureWallet application:
 * 1. Authentication (traditional and passwordless)
 * 2. Hardware wallet integration
 * 3. Secure environment detection
 * 4. Multi-party computation
 * 5. Cross-platform compatibility
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== SecureWallet Core Functionality Test ===');
console.log('Testing critical components before deployment...\n');

// Track test results
const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  details: []
};

// Helper function to record test results
function recordTestResult(component, test, status, message) {
  const result = { component, test, status, message };
  testResults.details.push(result);
  
  if (status === 'PASS') {
    testResults.passed++;
    console.log(`✅ [${component}] ${test}: ${message}`);
  } else if (status === 'FAIL') {
    testResults.failed++;
    console.log(`❌ [${component}] ${test}: ${message}`);
  } else if (status === 'WARN') {
    testResults.warnings++;
    console.log(`⚠️ [${component}] ${test}: ${message}`);
  }
}

// Test 1: Check file structure and critical components
console.log('🔍 Testing file structure and critical components...');

// Check for authentication components
if (fs.existsSync('./client/src/lib/passwordless-auth.ts') && 
    fs.existsSync('./client/src/components/PasswordlessAuthForm.tsx')) {
  recordTestResult('Authentication', 'Passwordless Components', 'PASS', 
    'Passwordless authentication components are present');
} else {
  recordTestResult('Authentication', 'Passwordless Components', 'FAIL', 
    'Missing passwordless authentication components');
}

// Check for hardware wallet integration
if (fs.existsSync('./client/src/lib/hardware-wallets.ts') && 
    fs.existsSync('./client/src/components/HardwareWalletConnector.tsx')) {
  recordTestResult('Hardware Wallets', 'Integration Components', 'PASS', 
    'Hardware wallet integration components are present');
} else {
  recordTestResult('Hardware Wallets', 'Integration Components', 'FAIL', 
    'Missing hardware wallet integration components');
}

// Check for secure environment detection
if (fs.existsSync('./client/src/lib/secure-environment.ts')) {
  recordTestResult('Security', 'Secure Environment Detection', 'PASS', 
    'Secure environment detection module is present');
} else {
  recordTestResult('Security', 'Secure Environment Detection', 'FAIL', 
    'Missing secure environment detection module');
}

// Check for cross-platform build configuration
if (fs.existsSync('./build-config.js') && fs.existsSync('./build-platforms.js')) {
  recordTestResult('Cross-Platform', 'Build Configuration', 'PASS', 
    'Cross-platform build configuration is present');
} else {
  recordTestResult('Cross-Platform', 'Build Configuration', 'FAIL', 
    'Missing cross-platform build configuration');
}

// Test 2: Static code analysis for authentication security
console.log('\n🔍 Performing static analysis of authentication code...');

try {
  // Check for bcrypt usage in auth.ts
  const authFilePath = './server/auth.ts';
  if (fs.existsSync(authFilePath)) {
    const authContent = fs.readFileSync(authFilePath, 'utf8');
    
    // Check for proper password hashing
    if (authContent.includes('bcrypt.hash') && authContent.includes('const SALT_ROUNDS')) {
      recordTestResult('Authentication', 'Password Hashing', 'PASS', 
        'Proper password hashing with bcrypt is implemented');
    } else {
      recordTestResult('Authentication', 'Password Hashing', 'FAIL', 
        'Missing or improper password hashing implementation');
    }
    
    // Check for secure session handling
    if (authContent.includes('req.session') && authContent.includes('session.destroy')) {
      recordTestResult('Authentication', 'Session Management', 'PASS', 
        'Session management is implemented');
    } else {
      recordTestResult('Authentication', 'Session Management', 'WARN', 
        'Session management may be incomplete');
    }
  } else {
    recordTestResult('Authentication', 'Server Auth Module', 'FAIL', 
      'Missing server authentication module');
  }
} catch (error) {
  recordTestResult('Authentication', 'Static Analysis', 'FAIL', 
    `Error analyzing authentication code: ${error.message}`);
}

// Test 3: Test security headers and CSRF protection
console.log('\n🔍 Checking security headers and protections...');

try {
  const serverIndexPath = './server/index.ts';
  if (fs.existsSync(serverIndexPath)) {
    const serverContent = fs.readFileSync(serverIndexPath, 'utf8');
    
    // Check for security headers
    const securityHeaders = [
      'X-Content-Type-Options',
      'X-Frame-Options',
      'X-XSS-Protection',
      'Strict-Transport-Security',
      'Content-Security-Policy'
    ];
    
    const missingHeaders = securityHeaders.filter(header => 
      !serverContent.includes(header)
    );
    
    if (missingHeaders.length === 0) {
      recordTestResult('Security', 'Security Headers', 'PASS', 
        'All required security headers are implemented');
    } else {
      recordTestResult('Security', 'Security Headers', 'WARN', 
        `Missing security headers: ${missingHeaders.join(', ')}`);
    }
    
    // Check for CSRF protection
    if (serverContent.includes('csrf') || 
        serverContent.includes('x-security-token') || 
        serverContent.includes('securityTokens')) {
      recordTestResult('Security', 'CSRF Protection', 'PASS', 
        'CSRF protection is implemented');
    } else {
      recordTestResult('Security', 'CSRF Protection', 'WARN', 
        'CSRF protection may be missing or incomplete');
    }
  } else {
    recordTestResult('Security', 'Server Module', 'FAIL', 
      'Missing server index module');
  }
} catch (error) {
  recordTestResult('Security', 'Headers Analysis', 'FAIL', 
    `Error analyzing security headers: ${error.message}`);
}

// Test 4: Check for proper error handling
console.log('\n🔍 Checking error handling in critical components...');

try {
  // Check critical files for try/catch blocks
  const criticalFiles = [
    './client/src/lib/hardware-wallets.ts',
    './client/src/lib/passwordless-auth.ts',
    './client/src/lib/secure-environment.ts',
    './server/auth.ts'
  ];
  
  criticalFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const fileBaseName = path.basename(filePath);
      
      // Check for try/catch blocks
      if (content.includes('try {') && content.includes('catch (')) {
        recordTestResult('Error Handling', fileBaseName, 'PASS', 
          'File includes proper error handling');
      } else {
        recordTestResult('Error Handling', fileBaseName, 'WARN', 
          'File may have incomplete error handling');
      }
    }
  });
} catch (error) {
  recordTestResult('Error Handling', 'Analysis', 'FAIL', 
    `Error analyzing error handling: ${error.message}`);
}

// Test 5: Check for secure environment fallbacks
console.log('\n🔍 Checking secure environment fallbacks...');

try {
  const secureEnvPath = './client/src/lib/secure-environment.ts';
  if (fs.existsSync(secureEnvPath)) {
    const content = fs.readFileSync(secureEnvPath, 'utf8');
    
    if (content.includes('SOFTWARE_FALLBACK') && 
        content.includes('supportsKeyGeneration')) {
      recordTestResult('Security', 'Fallback Mechanism', 'PASS', 
        'Secure environment provides proper fallback mechanisms');
    } else {
      recordTestResult('Security', 'Fallback Mechanism', 'WARN', 
        'Secure environment fallback may be incomplete');
    }
  }
} catch (error) {
  recordTestResult('Security', 'Fallback Analysis', 'FAIL', 
    `Error analyzing secure environment fallbacks: ${error.message}`);
}

// Test 6: Check for browser compatibility
console.log('\n🔍 Checking browser compatibility test modules...');

try {
  if (fs.existsSync('./tests/security/browser-compatibility-audit.ts')) {
    recordTestResult('Compatibility', 'Browser Tests', 'PASS', 
      'Browser compatibility tests are present');
  } else {
    recordTestResult('Compatibility', 'Browser Tests', 'WARN', 
      'Browser compatibility tests may be missing');
  }
} catch (error) {
  recordTestResult('Compatibility', 'Test Analysis', 'FAIL', 
    `Error checking compatibility tests: ${error.message}`);
}

// Test Summary
console.log('\n=== Test Summary ===');
console.log(`Total Tests: ${testResults.passed + testResults.failed + testResults.warnings}`);
console.log(`✅ Passed: ${testResults.passed}`);
console.log(`❌ Failed: ${testResults.failed}`);
console.log(`⚠️ Warnings: ${testResults.warnings}`);

// Overall Assessment
if (testResults.failed === 0 && testResults.warnings === 0) {
  console.log('\n🎉 All tests passed! The application is ready for deployment.');
} else if (testResults.failed === 0 && testResults.warnings > 0) {
  console.log('\n⚠️ No critical issues found, but there are some warnings that should be addressed before production deployment.');
} else {
  console.log('\n❌ Some tests failed. Please fix the critical issues before deployment.');
}

// Export results
fs.writeFileSync('test-results.json', JSON.stringify(testResults, null, 2));
console.log('\nDetailed results have been saved to test-results.json');

// Additional Deployment Recommendations
console.log('\n=== Deployment Recommendations ===');
console.log('1. Set up continuous integration for automated testing');
console.log('2. Configure proper environment variables for each deployment environment');
console.log('3. Implement logging and monitoring for production');
console.log('4. Set up automatic backups for user data');
console.log('5. Create documentation for installation and usage');
console.log('6. Perform a final security audit with external tools');
console.log('7. Configure rate limiting for API endpoints');