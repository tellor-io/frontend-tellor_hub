// Demo: Functional Testing Capabilities
// This file demonstrates how to use the new comprehensive testing features

import { TestRunner } from './test-runner.js';

// Example 1: Run all tests
async function runAllTests() {
  console.log('🚀 Running Complete Test Suite...');
  const runner = new TestRunner();
  const results = await runner.runAllTests();
  
  console.log('Final Results:', results);
  return results;
}

// Example 2: Run only functional tests
async function runFunctionalTestsOnly() {
  console.log('🔧 Running Functional Tests Only...');
  const runner = new TestRunner();
  await runner.runFunctionalTestsOnly();
}

// Example 3: Run specific test categories
async function runSpecificTests() {
  console.log('📋 Running Specific Test Categories...');
  const runner = new TestRunner();
  
  // Run only unit tests
  await runner.runUnitTestsOnly();
  
  // Run only integration tests
  await runner.runIntegrationTestsOnly();
}

// Example 4: Custom test with mocking
async function customTestExample() {
  console.log('🧪 Running Custom Test Example...');
  
  // Create a test suite instance
  const { TestSuite } = await import('./test-suite.js');
  const testSuite = new TestSuite();
  
  try {
    // Mock MetaMask provider
    const mockProvider = testSuite.mockMetaMaskProvider();
    const mockWeb3 = testSuite.mockWeb3Instance();
    
    // Set up global mocks
    window.ethereum = mockProvider;
    window.web3 = mockWeb3;
    
    // Wait for App to be available
    await testSuite.waitForCondition(() => typeof window.App !== 'undefined', 10000);
    
    // Test wallet connection
    const walletButton = document.getElementById('walletButton');
    testSuite.assertNotNull(walletButton, 'Wallet button should exist');
    
    // Click the button
    walletButton.click();
    await testSuite.wait(500);
    
    // Verify connection was attempted
    testSuite.assert(mockProvider.request.calls.length > 0, 'Provider should have been called');
    
    console.log('✅ Custom test passed!');
    
  } catch (error) {
    console.error('❌ Custom test failed:', error.message);
  } finally {
    // Cleanup
    testSuite.cleanup();
  }
}

// Example 5: Test specific button functionality
async function testSpecificButton(buttonId, expectedFunction) {
  console.log(`🔘 Testing button: ${buttonId}`);
  
  const { TestSuite } = await import('./test-suite.js');
  const testSuite = new TestSuite();
  
  try {
    // Mock everything needed
    const mockProvider = testSuite.mockMetaMaskProvider();
    const mockWeb3 = testSuite.mockWeb3Instance();
    
    window.ethereum = mockProvider;
    window.web3 = mockWeb3;
    
    // Wait for App
    await testSuite.waitForCondition(() => typeof window.App !== 'undefined', 10000);
    
    // Find button
    const button = document.getElementById(buttonId);
    testSuite.assertNotNull(button, `Button ${buttonId} should exist`);
    
    // Test initial state
    testSuite.assertDefined(button.disabled, 'Button should have disabled state');
    testSuite.assertDefined(button.textContent, 'Button should have text content');
    
    // Click button
    button.click();
    await testSuite.wait(1000);
    
    // Verify function was called (if it exists)
    if (window.App[expectedFunction]) {
      const spy = testSuite.spyOn(window.App, expectedFunction);
      
      // Click again to trigger spied function
      button.click();
      await testSuite.wait(500);
      
      testSuite.assert(spy.wasCalled(), `${expectedFunction} should have been called`);
    }
    
    console.log(`✅ Button ${buttonId} test passed!`);
    
  } catch (error) {
    console.error(`❌ Button ${buttonId} test failed:`, error.message);
  } finally {
    testSuite.cleanup();
  }
}

// Example 6: Test complete user flow
async function testCompleteUserFlow() {
  console.log('🔄 Testing Complete User Flow...');
  
  const { TestSuite } = await import('./test-suite.js');
  const testSuite = new TestSuite();
  
  try {
    // Mock everything
    const mockProvider = testSuite.mockMetaMaskProvider();
    const mockWeb3 = testSuite.mockWeb3Instance();
    const mockContract = testSuite.mockContract('TokenBridge', {
      methods: {
        approve: () => ({
          send: async () => ({
            transactionHash: '0xapprove1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
            gasUsed: 50000,
            events: {}
          }),
          call: async () => true,
          estimateGas: async () => 50000
        }),
        deposit: () => ({
          send: async () => ({
            transactionHash: '0xdeposit1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
            gasUsed: 100000,
            events: {}
          }),
          call: async () => true,
          estimateGas: async () => 100000
        })
      }
    });
    
    window.ethereum = mockProvider;
    window.web3 = mockWeb3;
    
    // Wait for App
    await testSuite.waitForCondition(() => typeof window.App !== 'undefined', 10000);
    
    // Step 1: Connect wallet
    const walletButton = document.getElementById('walletButton');
    testSuite.assertNotNull(walletButton, 'Wallet button should exist');
    
    walletButton.click();
    await testSuite.wait(1000);
    
    testSuite.assertDefined(window.App.isConnected, 'App should track connection state');
    
    // Step 2: Fill form
    const amountInput = document.getElementById('stakeAmount');
    if (amountInput) {
      testSuite.setInputValue('#stakeAmount', '100');
      await testSuite.wait(100);
      
      testSuite.assertEqual(amountInput.value, '100', 'Amount input should accept value');
    }
    
    // Step 3: Test approval flow
    const approveButton = document.getElementById('approveButton');
    if (approveButton) {
      testSuite.assertNotNull(approveButton, 'Approve button should exist');
      
      // Enable button if needed
      if (approveButton.disabled) {
        if (window.App.validateAmount) {
          const originalValidate = window.App.validateAmount;
          window.App.validateAmount = () => true;
          
          amountInput.dispatchEvent(new Event('input', { bubbles: true }));
          await testSuite.wait(100);
          
          window.App.validateAmount = originalValidate;
        }
      }
      
      approveButton.click();
      await testSuite.wait(1000);
      
      testSuite.assert(mockProvider.request.calls.length > 0, 'Provider should have been called');
    }
    
    console.log('✅ Complete user flow test passed!');
    
  } catch (error) {
    console.error('❌ Complete user flow test failed:', error.message);
  } finally {
    testSuite.cleanup();
  }
}

// Example 7: Test error scenarios
async function testErrorScenarios() {
  console.log('⚠️ Testing Error Scenarios...');
  
  const { TestSuite } = await import('./test-suite.js');
  const testSuite = new TestSuite();
  
  try {
    // Test 1: MetaMask connection failure
    const mockProvider = {
      request: async (method) => {
        if (method === 'eth_requestAccounts') {
          throw new Error('User rejected the request');
        }
        throw new Error(`Unsupported method: ${method}`);
      },
      on: () => {},
      removeListener: () => {},
      isMetaMask: true
    };
    
    window.ethereum = mockProvider;
    
    await testSuite.waitForCondition(() => typeof window.App !== 'undefined', 10000);
    
    const walletButton = document.getElementById('walletButton');
    if (walletButton) {
      walletButton.click();
      await testSuite.wait(1000);
      
      testSuite.assertDefined(walletButton, 'Button should still exist after failed connection');
      testSuite.assertFalse(window.App.isConnected, 'App should not be connected after failed connection');
    }
    
    console.log('✅ Error scenario tests passed!');
    
  } catch (error) {
    console.error('❌ Error scenario tests failed:', error.message);
  } finally {
    testSuite.cleanup();
  }
}

// Export functions for use in other files
export {
  runAllTests,
  runFunctionalTestsOnly,
  runSpecificTests,
  customTestExample,
  testSpecificButton,
  testCompleteUserFlow,
  testErrorScenarios
};

// Auto-run demo if this file is loaded directly
if (typeof window !== 'undefined') {
  window.FunctionalTestingDemo = {
    runAllTests,
    runFunctionalTestsOnly,
    runSpecificTests,
    customTestExample,
    testSpecificButton,
    testCompleteUserFlow,
    testErrorScenarios
  };
  
  console.log('🚀 Functional Testing Demo loaded!');
  console.log('Available functions:');
  console.log('- window.FunctionalTestingDemo.runAllTests()');
  console.log('- window.FunctionalTestingDemo.runFunctionalTestsOnly()');
  console.log('- window.FunctionalTestingDemo.testSpecificButton("buttonId", "functionName")');
  console.log('- window.FunctionalTestingDemo.testCompleteUserFlow()');
  console.log('- window.FunctionalTestingDemo.testErrorScenarios()');
}
