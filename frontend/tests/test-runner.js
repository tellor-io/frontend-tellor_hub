// Test Runner for Layer Bridge Application
import { TestSuite } from './test-suite.js';
import { UnitTests } from './unit-tests.js';
import { IntegrationTests } from './integration-tests.js';
import { MockProvider } from './mock-provider.js';

class TestRunner {
  constructor() {
    this.testSuite = new TestSuite();
    this.unitTests = new UnitTests();
    this.integrationTests = new IntegrationTests();
    this.mockProvider = new MockProvider();
    this.results = [];
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
    this.skippedTests = 0;
    
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    document.getElementById('run-all-tests').addEventListener('click', () => this.runAllTests());
    document.getElementById('run-unit-tests').addEventListener('click', () => this.runUnitTests());
    document.getElementById('run-integration-tests').addEventListener('click', () => this.runIntegrationTests());
    document.getElementById('clear-results').addEventListener('click', () => this.clearResults());
  }

  async runAllTests() {
    await this.runTests([
      ...this.unitTests.getTests(),
      ...this.integrationTests.getTests()
    ]);
  }

  async runUnitTests() {
    await this.runTests(this.unitTests.getTests());
  }

  async runIntegrationTests() {
    await this.runTests(this.integrationTests.getTests());
  }

  async runTests(tests) {
    this.clearResults();
    this.totalTests = tests.length;
    this.passedTests = 0;
    this.failedTests = 0;
    this.skippedTests = 0;
    
    this.updateProgress();
    this.displayResults();

    // Setup mocks if enabled
    if (document.getElementById('mock-wallets').checked) {
      await this.mockProvider.setupWalletMocks();
    }
    if (document.getElementById('mock-networks').checked) {
      await this.mockProvider.setupNetworkMocks();
    }

    // Run tests sequentially
    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      try {
        this.log(`Running test: ${test.name}`, 'info');
        
        const result = await this.runSingleTest(test);
        this.results.push(result);
        
        if (result.status === 'pass') {
          this.passedTests++;
        } else if (result.status === 'fail') {
          this.failedTests++;
        } else {
          this.skippedTests++;
        }
        
        this.updateProgress();
        this.displayResults();
        
        // Small delay to prevent overwhelming the UI
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        this.log(`Error running test ${test.name}: ${error.message}`, 'error');
        this.results.push({
          name: test.name,
          status: 'fail',
          error: error.message,
          duration: 0
        });
        this.failedTests++;
        this.updateProgress();
        this.displayResults();
      }
    }

    this.log(`Test run completed. Passed: ${this.passedTests}, Failed: ${this.failedTests}, Skipped: ${this.skippedTests}`, 'info');
  }

  async runSingleTest(test) {
    const startTime = performance.now();
    
    try {
      if (test.skip && test.skip()) {
        return {
          name: test.name,
          status: 'skip',
          reason: 'Test skipped',
          duration: 0
        };
      }

      await test.run();
      
      const duration = performance.now() - startTime;
      return {
        name: test.name,
        status: 'pass',
        duration: Math.round(duration)
      };
      
    } catch (error) {
      const duration = performance.now() - startTime;
      return {
        name: test.name,
        status: 'fail',
        error: error.message,
        duration: Math.round(duration)
      };
    }
  }

  updateProgress() {
    const progress = this.totalTests > 0 ? (this.passedTests + this.failedTests) / this.totalTests * 100 : 0;
    document.getElementById('progress-fill').style.width = `${progress}%`;
    document.getElementById('progress-text').textContent = `${this.passedTests + this.failedTests + this.skippedTests}/${this.totalTests}`;
  }

  displayResults() {
    const resultsContainer = document.getElementById('test-results');
    const detailsContainer = document.getElementById('test-details');
    
    // Summary
    resultsContainer.innerHTML = `
      <div class="grid grid-cols-4 gap-4 mb-4">
        <div class="text-center">
          <div class="text-2xl font-bold text-green-600">${this.passedTests}</div>
          <div class="text-sm text-gray-600">Passed</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-red-600">${this.failedTests}</div>
          <div class="text-sm text-gray-600">Failed</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-yellow-600">${this.skippedTests}</div>
          <div class="text-sm text-gray-600">Skipped</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-blue-600">${this.totalTests}</div>
          <div class="text-sm text-gray-600">Total</div>
        </div>
      </div>
    `;

    // Test results by category
    const unitResults = this.results.filter(r => this.unitTests.getTests().some(t => t.name === r.name));
    const integrationResults = this.results.filter(r => this.integrationTests.getTests().some(t => t.name === r.name));

    resultsContainer.innerHTML += `
      <div class="test-section">
        <h3 class="font-semibold mb-2">Unit Tests</h3>
        ${this.renderTestResults(unitResults)}
      </div>
      <div class="test-section">
        <h3 class="font-semibold mb-2">Integration Tests</h3>
        ${this.renderTestResults(integrationResults)}
      </div>
    `;

    // Detailed results
    detailsContainer.innerHTML = this.renderDetailedResults();
  }

  renderTestResults(results) {
    if (results.length === 0) return '<p class="text-gray-500">No tests run yet</p>';
    
    return results.map(result => `
      <div class="test-item">
        <div class="flex justify-between items-center">
          <span class="font-medium">${result.name}</span>
          <span class="test-${result.status}">
            ${result.status === 'pass' ? '✓ PASS' : 
              result.status === 'fail' ? '✗ FAIL' : '○ SKIP'}
          </span>
        </div>
        ${result.error ? `<div class="text-sm text-red-600 mt-1">${result.error}</div>` : ''}
        ${result.duration > 0 ? `<div class="text-sm text-gray-500 mt-1">${result.duration}ms</div>` : ''}
      </div>
    `).join('');
  }

  renderDetailedResults() {
    if (this.results.length === 0) return '<p class="text-gray-500">No tests run yet</p>';
    
    return this.results.map(result => `
      <div class="border-b border-gray-200 pb-4 mb-4">
        <h4 class="font-semibold text-lg">${result.name}</h4>
        <div class="grid grid-cols-2 gap-4 mt-2">
          <div>
            <span class="font-medium">Status:</span> 
            <span class="test-${result.status}">${result.status.toUpperCase()}</span>
          </div>
          <div>
            <span class="font-medium">Duration:</span> ${result.duration}ms
          </div>
        </div>
        ${result.error ? `
          <div class="mt-2">
            <span class="font-medium">Error:</span>
            <div class="bg-red-50 p-2 rounded text-red-800 text-sm font-mono">${result.error}</div>
          </div>
        ` : ''}
        ${result.reason ? `
          <div class="mt-2">
            <span class="font-medium">Reason:</span> ${result.reason}
          </div>
        ` : ''}
      </div>
    `).join('');
  }

  clearResults() {
    this.results = [];
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
    this.skippedTests = 0;
    this.updateProgress();
    this.displayResults();
  }

  log(message, level = 'info') {
    if (document.getElementById('verbose-logging').checked) {
      const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
      const logLevel = level.toUpperCase();
      console.log(`[${timestamp}] [${logLevel}] ${message}`);
    }
  }
}

// Initialize test runner when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new TestRunner();
});
