// Base Test Suite Class
export class TestSuite {
  constructor() {
    this.assertions = 0;
    this.failures = 0;
  }

  // Assertion methods
  assert(condition, message = 'Assertion failed') {
    this.assertions++;
    if (!condition) {
      this.failures++;
      throw new Error(message);
    }
  }

  assertEqual(actual, expected, message = 'Values are not equal') {
    this.assertions++;
    if (actual !== expected) {
      this.failures++;
      throw new Error(`${message}: expected ${expected}, got ${actual}`);
    }
  }

  assertNotEqual(actual, expected, message = 'Values should not be equal') {
    this.assertions++;
    if (actual === expected) {
      this.failures++;
      throw new Error(`${message}: values should not be equal, got ${actual}`);
    }
  }

  assertTrue(condition, message = 'Condition should be true') {
    this.assert(condition === true, message);
  }

  assertFalse(condition, message = 'Condition should be false') {
    this.assert(condition === false, message);
  }

  assertNull(value, message = 'Value should be null') {
    this.assert(value === null, message);
  }

  assertNotNull(value, message = 'Value should not be null') {
    this.assert(value !== null, message);
  }

  assertUndefined(value, message = 'Value should be undefined') {
    this.assert(value === undefined, message);
  }

  assertDefined(value, message = 'Value should be defined') {
    this.assert(value !== undefined, message);
  }

  assertArray(value, message = 'Value should be an array') {
    this.assert(Array.isArray(value), message);
  }

  assertObject(value, message = 'Value should be an object') {
    this.assert(typeof value === 'object' && value !== null && !Array.isArray(value), message);
  }

  assertString(value, message = 'Value should be a string') {
    this.assert(typeof value === 'string', message);
  }

  assertNumber(value, message = 'Value should be a number') {
    this.assert(typeof value === 'number' && !isNaN(value), message);
  }

  assertFunction(value, message = 'Value should be a function') {
    this.assert(typeof value === 'function', message);
  }

  assertLength(array, expectedLength, message = 'Array length mismatch') {
    this.assertArray(array, 'First argument must be an array');
    this.assertEqual(array.length, expectedLength, message);
  }

  assertContains(array, item, message = 'Array should contain item') {
    this.assertArray(array, 'First argument must be an array');
    this.assert(array.includes(item), message);
  }

  assertNotContains(array, item, message = 'Array should not contain item') {
    this.assertArray(array, 'First argument must be an array');
    this.assert(!array.includes(item), message);
  }

  assertThrows(fn, expectedError = null, message = 'Function should throw an error') {
    this.assertFunction(fn, 'First argument must be a function');
    
    try {
      fn();
      this.failures++;
      throw new Error('Function did not throw an error');
    } catch (error) {
      if (expectedError) {
        if (typeof expectedError === 'string') {
          this.assert(error.message.includes(expectedError), 
            `${message}: expected error to contain "${expectedError}", got "${error.message}"`);
        } else if (expectedError instanceof Error) {
          this.assertEqual(error.constructor.name, expectedError.constructor.name,
            `${message}: expected error type ${expectedError.constructor.name}, got ${error.constructor.name}`);
        }
      }
    }
  }

  assertDoesNotThrow(fn, message = 'Function should not throw an error') {
    this.assertFunction(fn, 'First argument must be a function');
    
    try {
      fn();
    } catch (error) {
      this.failures++;
      throw new Error(`${message}: function threw ${error.message}`);
    }
  }

  // Utility methods
  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async waitForElement(selector, timeout = 5000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const element = document.querySelector(selector);
      if (element) {
        return element;
      }
      await this.wait(100);
    }
    
    throw new Error(`Element ${selector} not found within ${timeout}ms`);
  }

  async waitForCondition(condition, timeout = 5000, interval = 100) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (condition()) {
        return true;
      }
      await this.wait(interval);
    }
    
    throw new Error(`Condition not met within ${timeout}ms`);
  }

  // DOM testing utilities
  clickElement(selector) {
    const element = document.querySelector(selector);
    if (!element) {
      throw new Error(`Element ${selector} not found`);
    }
    element.click();
  }

  setInputValue(selector, value) {
    const input = document.querySelector(selector);
    if (!input) {
      throw new Error(`Input ${selector} not found`);
    }
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  getElementText(selector) {
    const element = document.querySelector(selector);
    if (!element) {
      throw new Error(`Element ${selector} not found`);
    }
    return element.textContent.trim();
  }

  getElementValue(selector) {
    const element = document.querySelector(selector);
    if (!element) {
      throw new Error(`Element ${selector} not found`);
    }
    return element.value;
  }

  elementExists(selector) {
    return document.querySelector(selector) !== null;
  }

  elementIsVisible(selector) {
    const element = document.querySelector(selector);
    if (!element) {
      return false;
    }
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
  }

  elementHasClass(selector, className) {
    const element = document.querySelector(selector);
    if (!element) {
      return false;
    }
    return element.classList.contains(className);
  }

  // Network testing utilities
  async mockFetch(url, response) {
    if (!window.fetch) {
      throw new Error('Fetch API not available');
    }
    
    const originalFetch = window.fetch;
    window.fetch = async (requestUrl, options) => {
      if (requestUrl === url || requestUrl.toString() === url) {
        return new Response(JSON.stringify(response), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return originalFetch(requestUrl, options);
    };
    
    return () => {
      window.fetch = originalFetch;
    };
  }

  // Cleanup utilities
  cleanup() {
    // Reset any global state
    if (window.App) {
      window.App.disconnectMetaMask && window.App.disconnectMetaMask();
      window.App.disconnectKeplr && window.App.disconnectKeplr();
    }
    
    // Clear any timers
    const highestTimeoutId = setTimeout(";");
    for (let i = 0; i < highestTimeoutId; i++) {
      clearTimeout(i);
    }
    
    // Clear any intervals
    const highestIntervalId = setInterval(";");
    for (let i = 0; i < highestIntervalId; i++) {
      clearInterval(i);
    }
  }

  // Test statistics
  getStats() {
    return {
      assertions: this.assertions,
      failures: this.failures,
      successRate: this.assertions > 0 ? ((this.assertions - this.failures) / this.assertions * 100).toFixed(2) : 0
    };
  }
}
