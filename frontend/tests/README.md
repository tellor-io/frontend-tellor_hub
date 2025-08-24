# Layer Bridge Test Suite

A comprehensive test suite for the Layer Bridge frontend application that ensures all functionality works correctly before and after changes.

## Overview

This test suite covers:
- **Unit Tests**: Individual component and function testing
- **Integration Tests**: Component interaction and user flow testing
- **Mock Providers**: Simulated wallet connections and network calls
- **Performance Tests**: App initialization and UI responsiveness

## Quick Start

1. **Open the test suite**:
   ```bash
   # Navigate to the tests directory
   cd frontend/tests
   
   # Open test-suite.html in your browser
   open test-suite.html  # macOS
   # or
   xdg-open test-suite.html  # Linux
   # or just double-click the file
   ```

2. **Run tests**:
   - Click "Run All Tests" to test everything
   - Click "Run Unit Tests Only" for component testing
   - Click "Run Integration Tests Only" for flow testing

3. **View results**:
   - Real-time progress bar
   - Pass/Fail/Skip counts
   - Detailed test results with error messages
   - Performance metrics

## Test Categories

### Unit Tests (40+ tests)
- **Core App**: App object, initialization, web3 provider
- **Wallet Connections**: MetaMask, Keplr, Cosmostation, Leap
- **Bridge Functions**: Deposit, withdrawal, delegation flows
- **Input Validation**: Amount, address, balance, allowance checking
- **UI Components**: Wallet manager, network display, buttons
- **Utilities**: Web3, ethers, error handling

### Integration Tests (20+ tests)
- **User Flows**: Complete bridge and delegation workflows
- **Wallet Integration**: Dropdown interaction, network switching
- **UI Integration**: Tab switching, input validation, button sync
- **Error Handling**: Cross-component error management
- **Performance**: Initialization time, UI responsiveness

## Configuration Options

- **Mock Wallets**: Simulate wallet connections without real wallets
- **Mock Networks**: Simulate network calls for consistent testing
- **Verbose Logging**: Detailed console output during test runs

## Test Structure

```
tests/
├── test-suite.html          # Main test interface
├── test-runner.js           # Test orchestration
├── test-suite.js            # Base testing utilities
├── unit-tests.js            # Individual component tests
├── integration-tests.js     # Component interaction tests
├── mock-provider.js         # Wallet and network mocks
├── package.json             # Test suite metadata
└── README.md               # This file
```

## Writing New Tests

### Adding Unit Tests

```javascript
// In unit-tests.js
{
  name: 'New feature test',
  run: () => this.testNewFeature()
},

async testNewFeature() {
  // Use assertion methods
  this.assertNotNull(element, 'Element should exist');
  this.assertEqual(actual, expected, 'Values should match');
  this.assertFunction(fn, 'Function should exist');
}
```

### Adding Integration Tests

```javascript
// In integration-tests.js
{
  name: 'New user flow test',
  run: () => this.testNewUserFlow()
},

async testNewUserFlow() {
  // Test user interactions
  this.clickElement('#button');
  this.setInputValue('#input', 'value');
  await this.wait(100);
  
  // Verify results
  this.assertEqual(this.getElementText('#result'), 'expected');
}
```

## Assertion Methods

The test suite provides comprehensive assertion methods:

```javascript
// Basic assertions
this.assert(condition, 'message');
this.assertTrue(condition, 'message');
this.assertFalse(condition, 'message');

// Equality
this.assertEqual(actual, expected, 'message');
this.assertNotEqual(actual, expected, 'message');

// Type checking
this.assertString(value, 'message');
this.assertNumber(value, 'message');
this.assertArray(value, 'message');
this.assertObject(value, 'message');
this.assertFunction(value, 'message');

// Null/undefined
this.assertNull(value, 'message');
this.assertNotNull(value, 'message');
this.assertUndefined(value, 'message');
this.assertDefined(value, 'message');

// Collections
this.assertLength(array, expectedLength, 'message');
this.assertContains(array, item, 'message');
this.assertNotContains(array, item, 'message');

// Error handling
this.assertThrows(fn, expectedError, 'message');
this.assertDoesNotThrow(fn, 'message');
```

## Utility Methods

```javascript
// Timing
await this.wait(1000); // Wait 1 second

// DOM utilities
await this.waitForElement('#selector', 5000);
await this.waitForCondition(() => condition, 5000);
this.clickElement('#selector');
this.setInputValue('#selector', 'value');
this.getElementText('#selector');
this.getElementValue('#selector');

// State checking
this.elementExists('#selector');
this.elementIsVisible('#selector');
this.elementHasClass('#selector', 'className');
```

## Mock Providers

The test suite includes mock implementations for:

- **Ethereum**: MetaMask, Web3 provider
- **Cosmos**: Keplr, Cosmostation, Leap
- **Networks**: Layer node, Sepolia testnet

Mocks can be enabled/disabled via the test interface.

## Continuous Integration

To integrate with CI/CD:

1. **Automated testing**:
   ```bash
   # Run tests in headless mode (requires browser automation)
   npm install -g puppeteer
   node run-tests-headless.js
   ```

2. **Test reporting**:
   - Tests output structured results
   - Can be parsed for CI systems
   - Includes performance metrics

## Troubleshooting

### Common Issues

1. **Tests fail on wallet connection**:
   - Enable "Mock wallet connections" in test configuration
   - Ensure no real wallets are connected

2. **Network errors**:
   - Enable "Mock network calls" in test configuration
   - Check internet connection if using real networks

3. **Slow test execution**:
   - Disable "Verbose logging" for faster runs
   - Check browser performance

### Debug Mode

Enable verbose logging to see detailed test execution:

```javascript
// In browser console
localStorage.setItem('test-debug', 'true');
// Refresh page
```

## Best Practices

1. **Test isolation**: Each test should be independent
2. **Mock external dependencies**: Don't rely on real wallets/networks
3. **Clear assertions**: Use descriptive error messages
4. **Performance awareness**: Keep tests fast (< 100ms each)
5. **Regular updates**: Update tests when adding new features

## Contributing

When adding new functionality:

1. **Write tests first** (TDD approach)
2. **Cover both unit and integration** aspects
3. **Update this README** with new test categories
4. **Ensure all tests pass** before merging

## Support

For test suite issues:
- Check browser console for errors
- Verify all test files are loaded
- Ensure the main app is accessible
- Check for JavaScript errors in the main application
