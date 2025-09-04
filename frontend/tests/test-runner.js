// Test Runner for Layer Bridge Application
import { UnitTests } from './unit-tests.js';
import { IntegrationTests } from './integration-tests.js';

export class TestRunner {
  constructor() {
    this.unitTests = new UnitTests();
    this.integrationTests = new IntegrationTests();
    this.results = {
      unit: { passed: 0, failed: 0, total: 0, details: [] },
      integration: { passed: 0, failed: 0, total: 0, details: [] }
    };
  }

  async runAllTests() {
    console.log('🚀 Starting comprehensive test suite...\n');
    
    // Run unit tests
    console.log('📋 Running Unit Tests...');
    await this.runTestSuite(this.unitTests, 'unit');
    
    console.log('\n🔗 Running Integration Tests...');
    await this.runTestSuite(this.integrationTests, 'integration');
    
    // Generate comprehensive report
    this.generateReport();
  }

  async runTestSuite(testSuite, type) {
    const tests = testSuite.getTests();
    this.results[type].total = tests.length;
    
    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      console.log(`  ${i + 1}/${tests.length}: ${test.name}`);
      
      try {
        // Setup mocks before each test
        this.setupTestEnvironment();
        
        // Run the test
        await test.run();
        
        // Test passed
        this.results[type].passed++;
        this.results[type].details.push({
          name: test.name,
          status: 'PASSED',
          error: null
        });
        
        console.log(`    ✅ PASSED`);
        
      } catch (error) {
        // Test failed
        this.results[type].failed++;
        this.results[type].details.push({
          name: test.name,
          status: 'FAILED',
          error: error.message
        });
        
        console.log(`    ❌ FAILED: ${error.message}`);
        
        // Log detailed error for debugging
        if (error.stack) {
          console.log(`    Stack trace: ${error.stack}`);
        }
      } finally {
        // Cleanup after each test
        this.cleanupTestEnvironment();
      }
      
      // Small delay between tests
      await this.delay(100);
    }
  }

  setupTestEnvironment() {
    // Reset any global state
    if (window.App) {
      // Store original methods to restore later
      if (!window.App._originalMethods) {
        window.App._originalMethods = {};
      }
      
      // Store original methods before mocking
      ['connectMetaMask', 'connectKeplr', 'connectKeplrLegacy', 'connectCosmosWallet', 'disconnectMetaMask', 'disconnectKeplr', 'switchCosmosNetwork'].forEach(method => {
        if (window.App[method]) {
          window.App._originalMethods[method] = window.App[method];
        }
      });
    }
    
    // Clear any existing mocks
    if (window.ethereum) {
      delete window.ethereum;
    }
    if (window.web3) {
      delete window.web3;
    }
    if (window.keplr) {
      delete window.keplr;
    }
    if (window.cosmosWalletAdapter) {
      delete window.cosmosWalletAdapter;
    }
    if (window.cosmjs) {
      delete window.cosmjs;
    }
    
    // Reset App state
    if (window.App) {
      window.App.cosmosChainId = 'layertest-4'; // Default to testnet
      window.App.isKeplrConnected = false;
      window.App.isConnected = false;
      window.App.keplrAddress = null;
      window.App.account = '0x0';
    }
  }

  cleanupTestEnvironment() {
    // Restore original methods
    if (window.App && window.App._originalMethods) {
      Object.keys(window.App._originalMethods).forEach(method => {
        window.App[method] = window.App._originalMethods[method];
      });
      delete window.App._originalMethods;
    }
    
    // Clear mocks
    if (window.ethereum) {
      delete window.ethereum;
    }
    if (window.web3) {
      delete window.web3;
    }
    if (window.keplr) {
      delete window.keplr;
    }
    
    // Clear any timers
    const highestTimeoutId = setTimeout(";");
    for (let i = 0; i < highestTimeoutId; i++) {
      clearTimeout(i);
    }
    
    const highestIntervalId = setInterval(";");
    for (let i = 0; i < highestIntervalId; i++) {
      clearInterval(i);
    }
  }

  generateReport() {
    const totalTests = this.results.unit.total + this.results.integration.total;
    const totalPassed = this.results.unit.passed + this.results.integration.passed;
    const totalFailed = this.results.unit.failed + this.results.integration.failed;
    const successRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0;
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 COMPREHENSIVE TEST REPORT');
    console.log('='.repeat(80));
    
    console.log(`\n🎯 OVERALL RESULTS:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${totalPassed} ✅`);
    console.log(`   Failed: ${totalFailed} ❌`);
    console.log(`   Success Rate: ${successRate}%`);
    
    console.log(`\n📋 UNIT TESTS:`);
    console.log(`   Total: ${this.results.unit.total}`);
    console.log(`   Passed: ${this.results.unit.passed} ✅`);
    console.log(`   Failed: ${this.results.unit.failed} ❌`);
    console.log(`   Success Rate: ${this.results.unit.total > 0 ? ((this.results.unit.passed / this.results.unit.total) * 100).toFixed(1) : 0}%`);
    
    console.log(`\n🔗 INTEGRATION TESTS:`);
    console.log(`   Total: ${this.results.integration.total}`);
    console.log(`   Passed: ${this.results.integration.passed} ✅`);
    console.log(`   Failed: ${this.results.integration.failed} ❌`);
    console.log(`   Success Rate: ${this.results.integration.total > 0 ? ((this.results.integration.passed / this.results.integration.total) * 100).toFixed(1) : 0}%`);
    
    // Detailed failure report
    if (totalFailed > 0) {
      console.log(`\n❌ FAILED TESTS DETAILS:`);
      
      ['unit', 'integration'].forEach(type => {
        const failedTests = this.results[type].details.filter(test => test.status === 'FAILED');
        if (failedTests.length > 0) {
          console.log(`\n   ${type.toUpperCase()} TESTS:`);
          failedTests.forEach(test => {
            console.log(`     • ${test.name}: ${test.error}`);
          });
        }
      });
    }
    
    // Test coverage summary
    console.log(`\n📈 TEST COVERAGE SUMMARY:`);
    console.log(`   ✅ Structural Tests: Element existence, function presence, DOM structure`);
    console.log(`   ✅ Functional Tests: Button clicks, wallet connections, contract interactions`);
    console.log(`   ✅ Integration Tests: Complete user flows, error handling, edge cases`);
    console.log(`   ✅ Mock Testing: Wallet providers, contract methods, network responses`);
    console.log(`   ✅ Error Scenarios: Connection failures, transaction failures, validation errors`);
    
    // Recommendations
    console.log(`\n💡 RECOMMENDATIONS:`);
    if (successRate >= 90) {
      console.log(`   🎉 Excellent! Your test suite is comprehensive and reliable.`);
      console.log(`   🚀 Consider adding performance tests and real network testing.`);
    } else if (successRate >= 75) {
      console.log(`   👍 Good coverage! Focus on fixing failed tests first.`);
      console.log(`   🔧 Review error handling and edge cases.`);
    } else {
      console.log(`   ⚠️  Test coverage needs improvement. Focus on core functionality first.`);
      console.log(`   🎯 Prioritize critical user flows and error scenarios.`);
    }
    
    console.log('\n' + '='.repeat(80));
    
    // Return results for programmatic use
    return {
      totalTests,
      totalPassed,
      totalFailed,
      successRate,
      details: this.results
    };
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Utility method to run specific test categories
  async runUnitTestsOnly() {
    console.log('📋 Running Unit Tests Only...');
    await this.runTestSuite(this.unitTests, 'unit');
    this.generateReport();
  }

  async runIntegrationTestsOnly() {
    console.log('🔗 Running Integration Tests Only...');
    await this.runTestSuite(this.integrationTests, 'integration');
    this.generateReport();
  }

  // Utility method to run specific test types
  async runFunctionalTestsOnly() {
    console.log('🔧 Running Functional Tests Only...');
    
    // Filter tests to only functional ones
    const functionalTests = [
      ...this.unitTests.getTests().filter(test => 
        test.name.includes('functionality') || 
        test.name.includes('button') ||
        test.name.includes('connection')
      ),
      ...this.integrationTests.getTests().filter(test => 
        test.name.includes('flow') || 
        test.name.includes('integration')
      )
    ];
    
    console.log(`Found ${functionalTests.length} functional tests`);
    
    // Run filtered tests
    for (const test of functionalTests) {
      console.log(`  Running: ${test.name}`);
      try {
        this.setupTestEnvironment();
        await test.run();
        console.log(`    ✅ PASSED`);
      } catch (error) {
        console.log(`    ❌ FAILED: ${error.message}`);
      } finally {
        this.cleanupTestEnvironment();
      }
    }
  }
}

// Auto-run when imported
if (typeof window !== 'undefined') {
  window.TestRunner = TestRunner;
  
  // Auto-start if on test page
  if (window.location.pathname.includes('test-suite.html')) {
    document.addEventListener('DOMContentLoaded', async () => {
      const runner = new TestRunner();
      await runner.runAllTests();
    });
  }
}
