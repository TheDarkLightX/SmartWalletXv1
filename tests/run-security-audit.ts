/**
 * Security Audit Runner
 * 
 * This script runs a comprehensive security audit on the SecureWallet codebase.
 * It checks for common security issues, best practices, and potential vulnerabilities.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { runAllTests as runTEEMPCTests } from './security/tee-mpc-audit.js';
import { generateCompatibilityReport } from './security/browser-compatibility-audit.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define security checks
const securityChecks = [
  {
    name: "Insecure Cryptographic Algorithms",
    patterns: [
      /MD5/g,
      /SHA1\(/g,
      /createHash\(['"]md5['"]\)/g,
      /createHash\(['"]sha1['"]\)/g,
      /DES/g,
      /3DES/g,
      /RC4/g,
      /PKCS#1v1\.5/g
    ],
    exclude: [
      /\/\/.*(MD5|SHA1|DES|3DES|RC4)/g, // Comments
      /\/\*.*(MD5|SHA1|DES|3DES|RC4)/g  // Multi-line comments
    ]
  },
  {
    name: "Insecure Random Number Generation",
    patterns: [
      /Math\.random\(\)/g,
      /new Date\.getTime\(\)/g,
      /new Date\.valueOf\(\)/g
    ],
    exclude: []
  },
  {
    name: "Potential Secret Exposure",
    patterns: [
      /const\s+\w*(secret|key|token|password|auth)\w*\s*=\s*['"][^'"]+['"]/gi,
      /let\s+\w*(secret|key|token|password|auth)\w*\s*=\s*['"][^'"]+['"]/gi,
      /var\s+\w*(secret|key|token|password|auth)\w*\s*=\s*['"][^'"]+['"]/gi
    ],
    exclude: [
      /process\.env\.\w+/g, // Environment variables
      /config\.\w+/g, // Configuration variables
      /getSecret\(\w+\)/g, // Secret management function
      /placeholder|example|dummy|test|sample/gi // Test data
    ]
  },
  {
    name: "Potential XSS Vulnerabilities",
    patterns: [
      /innerHTML\s*=/g,
      /outerHTML\s*=/g,
      /document\.write\(/g,
      /eval\(/g,
      /setTimeout\(\s*['"`]/g,
      /setInterval\(\s*['"`]/g,
      /dangerouslySetInnerHTML/g
    ],
    exclude: []
  },
  {
    name: "Potential Injection Vulnerabilities",
    patterns: [
      /new\s+Function\(/g,
      /exec\(/g,
      /execSync\(/g,
      /\$\{/g
    ],
    exclude: [
      /styled-components/g, // Template literals in styled-components
      /\/\/.+\$\{/g, // Comments
      /`.+?`.+?\$\{/g, // Template literals in string templates (might be safe)
      /\/\*[\s\S]+?\*\//g // Multi-line comments
    ]
  }
];

// Track audit results
const auditResults = {
  criticalIssues: [],
  highIssues: [],
  mediumIssues: [],
  lowIssues: [],
  infoIssues: []
};

// Function to scan a file for security issues
function scanFile(filePath: string) {
  console.log(`Scanning ${filePath}...`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    for (const check of securityChecks) {
      // Skip excluded files by pattern
      let shouldSkip = false;
      if (filePath.includes('node_modules') || 
          filePath.includes('dist/') || 
          filePath.includes('test-') || 
          filePath.endsWith('.test.ts') || 
          filePath.endsWith('.spec.ts')) {
        shouldSkip = true;
      }
      
      if (shouldSkip) continue;
      
      // Apply exclusion patterns first
      let filteredContent = content;
      for (const exclude of check.exclude) {
        filteredContent = filteredContent.replace(exclude, '');
      }
      
      // Check for patterns
      for (const pattern of check.patterns) {
        const matches = filteredContent.match(pattern);
        if (matches && matches.length > 0) {
          auditResults.highIssues.push({
            file: filePath,
            severity: 'HIGH',
            issue: `${check.name}: ${matches.length} instances of '${pattern}'`
          });
          
          console.log(`⚠️ Found ${matches.length} instances of '${pattern}' in ${filePath}`);
        }
      }
    }
    
    // Custom checks
    if (content.includes('TODO') || content.includes('FIXME')) {
      auditResults.lowIssues.push({
        file: filePath,
        severity: 'LOW',
        issue: 'Contains TODO or FIXME comments'
      });
    }
    
    // Check for large files (potential code complexity issues)
    const lines = content.split('\n').length;
    if (lines > 500) {
      auditResults.infoIssues.push({
        file: filePath,
        severity: 'INFO',
        issue: `Large file (${lines} lines)`
      });
    }
    
  } catch (error: any) {
    console.error(`Error scanning ${filePath}: ${error.message}`);
  }
}

// Function to recursively scan directory for TypeScript/JavaScript files
function scanDirectory(dirPath: string) {
  try {
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        // Skip node_modules, dist, etc.
        if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
          scanDirectory(filePath);
        }
      } else if (stats.isFile()) {
        // Only scan TypeScript and JavaScript files
        if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
          scanFile(filePath);
        }
      }
    }
  } catch (error: any) {
    console.error(`Error scanning directory ${dirPath}: ${error.message}`);
  }
}

// Check for security headers in server code
function checkSecurityHeaders() {
  const serverFiles = [
    path.resolve(__dirname, '../server/index.ts'),
    path.resolve(__dirname, '../server/routes.ts')
  ];
  
  const requiredHeaders = [
    { name: 'X-Content-Type-Options', value: 'nosniff' },
    { name: 'X-Frame-Options', value: 'DENY' },
    { name: 'X-XSS-Protection', value: '1; mode=block' },
    { name: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
    { name: 'Content-Security-Policy', value: 'any' }
  ];
  
  for (const filePath of serverFiles) {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      for (const header of requiredHeaders) {
        if (!content.includes(header.name)) {
          auditResults.mediumIssues.push({
            file: filePath,
            severity: 'MEDIUM',
            issue: `Missing security header: ${header.name}`
          });
        }
      }
    }
  }
}

// Check for secure authentication implementation
function checkAuthImplementation() {
  const authFile = path.resolve(__dirname, '../server/auth.ts');
  
  if (fs.existsSync(authFile)) {
    const content = fs.readFileSync(authFile, 'utf8');
    
    // Check for password hashing with bcrypt
    if (!content.includes('bcrypt.hash') && !content.includes('bcrypt.compare')) {
      auditResults.highIssues.push({
        file: authFile,
        severity: 'HIGH',
        issue: 'No secure password hashing detected'
      });
    }
    
    // Check for session management
    if (!content.includes('session') || !content.includes('req.session')) {
      auditResults.mediumIssues.push({
        file: authFile,
        severity: 'MEDIUM',
        issue: 'Potential issues with session management'
      });
    }
    
    // Check for CSRF protection
    if (!content.includes('csrf') && !content.includes('CSRF') && !content.includes('xsrf')) {
      auditResults.mediumIssues.push({
        file: authFile,
        severity: 'MEDIUM',
        issue: 'No CSRF protection detected'
      });
    }
  }
}

// Main execution
async function runSecurityAudit() {
  console.log('=== SecureWallet Security Audit ===');
  console.log('Running comprehensive security checks...\n');
  
  // Run static code analysis
  console.log('\n=== Static Code Analysis ===');
  const rootDir = path.resolve(__dirname, '..');
  scanDirectory(rootDir);
  
  // Check for security headers
  console.log('\n=== Security Headers Check ===');
  checkSecurityHeaders();
  
  // Check authentication implementation
  console.log('\n=== Authentication Security Check ===');
  checkAuthImplementation();
  
  // Run TEE/MPC tests
  console.log('\n=== TEE/MPC Security Tests ===');
  try {
    await runTEEMPCTests();
  } catch (error: any) {
    console.error('Error running TEE/MPC tests:', error.message);
  }
  
  // Generate browser compatibility report
  console.log('\n=== Browser Compatibility Report ===');
  try {
    const compatReport = generateCompatibilityReport();
    console.log(compatReport);
  } catch (error: any) {
    console.error('Error generating browser compatibility report:', error.message);
  }
  
  // Print audit summary
  console.log('\n=== Security Audit Summary ===');
  console.log(`Critical Issues: ${auditResults.criticalIssues.length}`);
  console.log(`High Issues: ${auditResults.highIssues.length}`);
  console.log(`Medium Issues: ${auditResults.mediumIssues.length}`);
  console.log(`Low Issues: ${auditResults.lowIssues.length}`);
  console.log(`Info: ${auditResults.infoIssues.length}`);
  
  // Print details for issues
  if (auditResults.criticalIssues.length > 0) {
    console.log('\n⛔ CRITICAL ISSUES:');
    auditResults.criticalIssues.forEach(issue => {
      console.log(`- [${issue.file}] ${issue.issue}`);
    });
  }
  
  if (auditResults.highIssues.length > 0) {
    console.log('\n🚨 HIGH ISSUES:');
    auditResults.highIssues.forEach(issue => {
      console.log(`- [${issue.file}] ${issue.issue}`);
    });
  }
  
  if (auditResults.mediumIssues.length > 0) {
    console.log('\n⚠️ MEDIUM ISSUES:');
    auditResults.mediumIssues.forEach(issue => {
      console.log(`- [${issue.file}] ${issue.issue}`);
    });
  }
  
  // Generate secure development guidelines
  console.log('\n=== Secure Development Guidelines ===');
  console.log('1. Use secure cryptographic algorithms (AES-GCM, ECDSA, SHA-256/SHA-384)');
  console.log('2. Always use secure random number generation (webcrypto.getRandomValues())');
  console.log('3. Implement proper authentication with bcrypt for password hashing');
  console.log('4. Use secure WebAuthn for passwordless authentication');
  console.log('5. Implement proper session management and CSRF protection');
  console.log('6. Set appropriate security headers on all responses');
  console.log('7. Use Content Security Policy to prevent XSS attacks');
  console.log('8. Validate all user inputs on the server side');
  console.log('9. Implement proper error handling without exposing sensitive information');
  console.log('10. Regularly update dependencies to patch security vulnerabilities');
  
  // Save audit results to file
  const auditReport = {
    timestamp: new Date().toISOString(),
    summary: {
      criticalIssues: auditResults.criticalIssues.length,
      highIssues: auditResults.highIssues.length,
      mediumIssues: auditResults.mediumIssues.length,
      lowIssues: auditResults.lowIssues.length,
      infoIssues: auditResults.infoIssues.length
    },
    details: {
      criticalIssues: auditResults.criticalIssues,
      highIssues: auditResults.highIssues,
      mediumIssues: auditResults.mediumIssues,
      lowIssues: auditResults.lowIssues,
      infoIssues: auditResults.infoIssues
    }
  };
  
  fs.writeFileSync(path.resolve(__dirname, 'security-audit-report.json'), JSON.stringify(auditReport, null, 2));
  console.log('\nSecurity audit report saved to security-audit-report.json');
}

// Run the audit when executed directly
if (typeof process !== 'undefined' && process.argv[1] === fileURLToPath(import.meta.url)) {
  runSecurityAudit().catch(console.error);
}

export { runSecurityAudit };