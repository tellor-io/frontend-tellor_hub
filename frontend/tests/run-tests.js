#!/usr/bin/env node

/**
 * Command-line test runner for Layer Bridge Test Suite
 * 
 * Usage:
 *   node run-tests.js                    # Run all tests
 *   node run-tests.js --unit            # Run unit tests only
 *   node run-tests.js --integration     # Run integration tests only
 *   node run-tests.js --headless        # Run in headless mode
 *   node run-tests.js --help            # Show help
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

class HeadlessTestRunner {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = [];
  }

  async init() {
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    
    // Set viewport
    await this.page.setViewport({ width: 1280, height: 720 });
    
    // Enable console logging
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Browser Error:', msg.text());
      } else if (msg.type() === 'log') {
        console.log('Browser Log:', msg.text());
      }
    });
  }

  async runTests(testType = 'all') {
    try {
      // Navigate to test suite
      const testPath = path.join(__dirname, 'test-suite.html');
      await this.page.goto(`file://${testPath}`);
      
      // Wait for test suite to load
      await this.page.waitForSelector('#run-all-tests', { timeout: 10000 });
      
      // Enable mocks
      await this.page.evaluate(() => {
        document.getElementById('mock-wallets').checked = true;
        document.getElementById('mock-networks').checked = true;
        document.getElementById('verbose-logging').checked = false;
      });
      
      // Run tests based on type
      let buttonSelector;
      switch (testType) {
        case 'unit':
          buttonSelector = '#run-unit-tests';
          break;
        case 'integration':
          buttonSelector = '#run-integration-tests';
          break;
        default:
          buttonSelector = '#run-all-tests';
      }
      
      // Click the appropriate test button
      await this.page.click(buttonSelector);
      
      // Wait for tests to complete
      await this.waitForTestsToComplete();
      
      // Extract results
      const results = await this.extractResults();
      
      return results;
      
    } catch (error) {
      console.error('Error running tests:', error);
      throw error;
    }
  }

  async waitForTestsToComplete() {
    // Wait for progress to reach 100% or timeout
    await this.page.waitForFunction(() => {
      const progressText = document.getElementById('progress-text');
      if (!progressText) return false;
      
      const [completed, total] = progressText.textContent.split('/').map(Number);
      return completed > 0 && completed === total;
    }, { timeout: 60000 }); // 60 second timeout
  }

  async extractResults() {
    const results = await this.page.evaluate(() => {
      const passed = parseInt(document.querySelector('.text-green-600').textContent);
      const failed = parseInt(document.querySelector('.text-red-600').textContent);
      const skipped = parseInt(document.querySelector('.text-yellow-600').textContent);
      const total = parseInt(document.querySelector('.text-blue-600').textContent);
      
      // Get detailed results
      const testItems = Array.from(document.querySelectorAll('.test-item'));
      const details = testItems.map(item => {
        const name = item.querySelector('.font-medium').textContent;
        const status = item.querySelector('.test-pass, .test-fail, .test-skip').textContent;
        const error = item.querySelector('.text-red-600')?.textContent || null;
        const duration = item.querySelector('.text-gray-500')?.textContent || null;
        
        return { name, status, error, duration };
      });
      
      return { passed, failed, skipped, total, details };
    });
    
    return results;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// CLI argument parsing
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    unit: false,
    integration: false,
    headless: false,
    help: false
  };
  
  for (const arg of args) {
    if (arg === '--unit' || arg === '-u') {
      options.unit = true;
    } else if (arg === '--integration' || arg === '-i') {
      options.integration = true;
    } else if (arg === '--headless' || arg === '-h') {
      options.headless = true;
    } else if (arg === '--help') {
      options.help = true;
    }
  }
  
  return options;
}

function showHelp() {
  console.log(`
Layer Bridge Test Suite - Command Line Runner

Usage:
  node run-tests.js [options]

Options:
  --unit, -u          Run unit tests only
  --integration, -i   Run integration tests only
  --headless, -h      Run in headless mode (default)
  --help              Show this help message

Examples:
  node run-tests.js                    # Run all tests
  node run-tests.js --unit            # Run unit tests only
  node run-tests.js --integration     # Run integration tests only

Exit Codes:
  0 - All tests passed
  1 - Some tests failed
  2 - Error running tests
`);
}

async function main() {
  const options = parseArgs();
  
  if (options.help) {
    showHelp();
    process.exit(0);
  }
  
  // Determine test type
  let testType = 'all';
  if (options.unit) testType = 'unit';
  if (options.integration) testType = 'integration';
  
  console.log(`Running ${testType} tests...`);
  
  try {
    const runner = new HeadlessTestRunner();
    await runner.init();
    
    const results = await runner.runTests(testType);
    
    // Display results
    console.log('\nTest Results:');
    console.log(`Passed: ${results.passed}`);
    console.log(`Failed: ${results.failed}`);
    console.log(`Skipped: ${results.skipped}`);
    console.log(`Total: ${results.total}`);
    
    // Display failed tests
    if (results.failed > 0) {
      console.log('\nFailed Tests:');
      results.details
        .filter(test => test.status.includes('FAIL'))
        .forEach(test => {
          console.log(`  ✗ ${test.name}`);
          if (test.error) {
            console.log(`    Error: ${test.error}`);
          }
        });
    }
    
    await runner.close();
    
    // Exit with appropriate code
    if (results.failed > 0) {
      console.log('\n❌ Some tests failed');
      process.exit(1);
    } else {
      console.log('\n✅ All tests passed');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('Error running tests:', error);
    process.exit(2);
  }
}

// Check if puppeteer is available
try {
  require.resolve('puppeteer');
} catch (error) {
  console.error('Puppeteer not found. Install it with:');
  console.error('npm install puppeteer');
  console.error('');
  console.error('Or run tests manually by opening test-suite.html in a browser');
  process.exit(1);
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(2);
  });
}

module.exports = { HeadlessTestRunner };
