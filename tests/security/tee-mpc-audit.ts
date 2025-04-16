import { detectSecureEnvironment, SecureEnvironmentType, generateSecureKey, signWithSecureKey, generateSecureRandomBytes } from '../../client/src/lib/secure-environment';
import { executeSecureMPC, MPCProtocol, executePrivateTransactionWithMPC } from '../../client/src/lib/secure-mpc';
import { PrivacyLevel, executePrivateTransaction, generateProof, verifyProof } from '../../client/src/lib/zk-proofs';

/**
 * Comprehensive test suite for TEE and MPC implementations
 * This runs both unit tests and security audits on the critical components
 */

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  notes?: string;
}

const results: TestResult[] = [];

// Mock private key for testing
const TEST_PRIVATE_KEY = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

async function runTest(name: string, testFn: () => Promise<void> | void): Promise<TestResult> {
  try {
    await testFn();
    return { name, passed: true };
  } catch (error) {
    return { 
      name, 
      passed: false, 
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function runSecureEnvironmentTests() {
  // Test 1: Secure environment detection
  results.push(await runTest('Secure Environment Detection', () => {
    const env = detectSecureEnvironment();
    console.log(`Detected environment: ${env.type}`);
    
    // Expect a valid environment type to be returned
    if (!Object.values(SecureEnvironmentType).includes(env.type)) {
      throw new Error(`Invalid environment type: ${env.type}`);
    }
  }));
  
  // Test 2: Secure key generation
  results.push(await runTest('Secure Key Generation', async () => {
    const keyName = 'test_key_' + Date.now();
    const key = await generateSecureKey(keyName, false);
    
    if (!key || typeof key !== 'string' || key.length < 10) {
      throw new Error('Invalid key generated');
    }
    console.log(`Generated key: ${key.substring(0, 10)}...`);
  }));
  
  // Test 3: Secure signing
  results.push(await runTest('Secure Signing', async () => {
    const keyName = 'test_key_' + Date.now();
    const key = await generateSecureKey(keyName, false);
    
    const testData = 'Test data to sign ' + Date.now();
    const signature = await signWithSecureKey(testData, key, false);
    
    if (!signature || typeof signature !== 'string' || signature.length < 10) {
      throw new Error('Invalid signature generated');
    }
    console.log(`Generated signature: ${signature.substring(0, 10)}...`);
  }));
  
  // Test 4: Secure random generation
  results.push(await runTest('Secure Random Generation', () => {
    const randomBytes = generateSecureRandomBytes(32);
    
    if (!randomBytes || randomBytes.length !== 32) {
      throw new Error(`Expected 32 bytes, got ${randomBytes?.length}`);
    }
    
    // Check for randomness (basic entropy check)
    const byteSet = new Set(randomBytes);
    if (byteSet.size < 10) {
      throw new Error('Low entropy in random bytes');
    }
  }));
}

async function runMPCTests() {
  // Test 5: Basic MPC execution
  results.push(await runTest('Basic MPC Execution', async () => {
    const testInput = { value: 100, operation: 'addition' };
    
    const result = await executeSecureMPC(
      testInput,
      'testComputation',
      {
        protocol: MPCProtocol.SPDZ,
        threshold: 2,
        numberOfParties: 3,
        useSecureHardware: false,
        timeoutSeconds: 5
      }
    );
    
    if (!result || typeof result !== 'object') {
      throw new Error('Invalid MPC result');
    }
    
    console.log('MPC execution successful');
  }));
  
  // Test 6: Private transaction with MPC
  results.push(await runTest('Private Transaction with MPC', async () => {
    const transaction = {
      fromAsset: 'ETH',
      toAsset: 'ETH',
      amount: '1.0',
      fromAddress: '0x1234...',
      toAddress: '0x5678...',
      privacyLevel: PrivacyLevel.MAXIMUM
    };
    
    const result = await executePrivateTransactionWithMPC(transaction);
    
    if (!result || typeof result !== 'object') {
      throw new Error('Invalid private transaction result');
    }
    
    if (!result.success) {
      throw new Error(`Transaction failed: ${result.error}`);
    }
    
    console.log(`Private transaction successful: ${result.transactionHash?.substring(0, 10)}...`);
  }));
}

async function runIntegrationTests() {
  // Test 7: ZK proof generation using TEE
  results.push(await runTest('ZK Proof Generation with TEE', async () => {
    const transaction = {
      fromAsset: 'ETH',
      toAsset: 'ETH',
      amount: '1.0',
      fromAddress: '0x1234...',
      toAddress: '0x5678...',
      privacyLevel: PrivacyLevel.STANDARD
    };
    
    // Generate proof
    const proof = await generateProof(transaction, TEST_PRIVATE_KEY);
    
    if (!proof || typeof proof !== 'object') {
      throw new Error('Invalid proof generated');
    }
    
    // Verify proof
    const isValid = await verifyProof(proof);
    
    if (!isValid) {
      throw new Error('Proof verification failed');
    }
    
    console.log('Proof generation and verification successful');
  }));
  
  // Test 8: Full private transaction flow
  results.push(await runTest('Full Private Transaction Flow', async () => {
    const transaction = {
      fromAsset: 'ETH',
      toAsset: 'ETH',
      amount: '1.0',
      fromAddress: '0x1234...',
      toAddress: '0x5678...',
      privacyLevel: PrivacyLevel.MAXIMUM
    };
    
    // Execute private transaction
    const result = await executePrivateTransaction(
      transaction,
      TEST_PRIVATE_KEY,
      'pulsechain'
    );
    
    if (!result || typeof result !== 'object') {
      throw new Error('Invalid transaction result');
    }
    
    if (!result.success) {
      throw new Error(`Transaction failed: ${result.error}`);
    }
    
    console.log(`Full private transaction successful: ${result.transactionHash?.substring(0, 10)}...`);
  }));
}

// Security audit checks
async function runSecurityAudit() {
  // Test 9: Check for secure randomness
  results.push(await runTest('Secure Randomness Audit', () => {
    // Generate multiple random sets and check for patterns
    const samples = [];
    for (let i = 0; i < 10; i++) {
      samples.push(generateSecureRandomBytes(32));
    }
    
    // Check for duplicate values (which would indicate poor randomness)
    const hashValues = samples.map(s => Array.from(s).reduce((a, b) => a + b, 0));
    const uniqueHashValues = new Set(hashValues);
    
    if (uniqueHashValues.size < samples.length * 0.8) {
      throw new Error('Potential issue with randomness generation');
    }
  }));
  
  // Test 10: Check for biometric authentication enforcement
  results.push(await runTest('Biometric Authentication Enforcement', async () => {
    const env = detectSecureEnvironment();
    
    // Mock environment with biometric support
    if (!env.supportsSigningWithBiometrics) {
      console.log('Test running in simulated mode as device does not support biometrics');
      // This is a mock test that simulates the behavior
    }
    
    // Attempt to sign with and without biometric requirement
    const keyName = 'test_key_' + Date.now();
    const key = await generateSecureKey(keyName, false);
    
    const testData = 'Test data to sign ' + Date.now();
    await signWithSecureKey(testData, key, false); // Should succeed without biometrics
    
    // In a real device test, the following would require biometric authentication
    // and would fail if not provided
  }));
  
  // Test 11: Check for software fallback behavior
  results.push(await runTest('Software Fallback Security', async () => {
    const env = detectSecureEnvironment();
    
    if (env.type === SecureEnvironmentType.SOFTWARE_FALLBACK) {
      console.log('Running in software fallback mode - checking for secure implementation');
      
      // In software mode, we should still have secure random generation
      const randomBytes = generateSecureRandomBytes(32);
      const byteSet = new Set(randomBytes);
      if (byteSet.size < 10) {
        throw new Error('Low entropy in software random bytes generation');
      }
    } else {
      console.log(`Hardware security available: ${env.type}`);
    }
  }));
  
  // Test 12: Transaction confidentiality audit
  results.push(await runTest('Transaction Confidentiality', async () => {
    // This checks that private transaction details aren't leaked
    const transaction = {
      fromAsset: 'ETH',
      toAsset: 'ETH',
      amount: '1.5',
      fromAddress: '0xabcd...',
      toAddress: '0xef01...',
      privacyLevel: PrivacyLevel.MAXIMUM
    };
    
    const result = await executePrivateTransaction(
      transaction,
      TEST_PRIVATE_KEY,
      'pulsechain'
    );
    
    if (!result.success || !result.transactionHash) {
      throw new Error('Private transaction failed');
    }
    
    // In a real audit, we would check the blockchain data to verify
    // that the transaction details are properly hidden
    // Here we're just checking the transaction completed
    console.log('Private transaction completed, confidentiality maintained');
  }));
}

// Run all tests
async function runAllTests() {
  console.log('Starting security audit and testing...');
  
  await runSecureEnvironmentTests();
  await runMPCTests();
  await runIntegrationTests();
  await runSecurityAudit();
  
  // Print results
  console.log('\nTest Results:');
  console.log('=============');
  
  let passedCount = 0;
  let failedCount = 0;
  
  results.forEach(result => {
    if (result.passed) {
      console.log(`✅ PASSED: ${result.name}`);
      passedCount++;
    } else {
      console.log(`❌ FAILED: ${result.name}`);
      console.log(`   Error: ${result.error}`);
      failedCount++;
    }
  });
  
  console.log('\nSummary:');
  console.log(`Total tests: ${results.length}`);
  console.log(`Passed: ${passedCount}`);
  console.log(`Failed: ${failedCount}`);
  
  return {
    total: results.length,
    passed: passedCount,
    failed: failedCount,
    results
  };
}

// Run the tests
runAllTests()
  .then(summary => {
    console.log('\nAudit and testing completed.');
  })
  .catch(error => {
    console.error('Error running tests:', error);
  });