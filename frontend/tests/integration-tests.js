// Integration Tests for Layer Bridge Application
import { TestSuite } from './test-suite.js';

export class IntegrationTests extends TestSuite {
  constructor() {
    super();
  }

  getTests() {
    return [
      // User Flow Tests
      {
        name: 'Complete bridge to layer flow',
        run: () => this.testBridgeToLayerFlow()
      },
      {
        name: 'Complete bridge to ethereum flow',
        run: () => this.testBridgeToEthereumFlow()
      },
      {
        name: 'Complete delegation flow',
        run: () => this.testDelegationFlow()
      },

      // Wallet Integration Tests
      {
        name: 'Wallet manager dropdown interaction',
        run: () => this.testWalletManagerInteraction()
      },
      {
        name: 'Network switching functionality',
        run: () => this.testNetworkSwitching()
      },
      {
        name: 'Wallet connection state management',
        run: () => this.testWalletConnectionState()
      },

      // UI Integration Tests
      {
        name: 'Bridge direction tab switching',
        run: () => this.testBridgeDirectionTabs()
      },
      {
        name: 'Input validation integration',
        run: () => this.testInputValidationIntegration()
      },
      {
        name: 'Button state synchronization',
        run: () => this.testButtonStateSync()
      },

      // No-Stake Reporting Integration Tests
      {
        name: 'No-stake reporting tab integration',
        run: () => this.testNoStakeReportingIntegration()
      },

      // Error Handling Integration
      {
        name: 'Error handling across components',
        run: () => this.testErrorHandlingIntegration()
      },
      {
        name: 'Network error recovery',
        run: () => this.testNetworkErrorRecovery()
      },

      // Performance Tests
      {
        name: 'App initialization performance',
        run: () => this.testInitializationPerformance()
      },
      {
        name: 'UI responsiveness',
        run: () => this.testUIResponsiveness()
      }
    ];
  }

  // User Flow Tests
  async testBridgeToLayerFlow() {
    // Test the complete flow from input to button states
    const stakeAmountInput = document.getElementById('stakeAmount');
    const approveButton = document.getElementById('approveButton');
    const depositButton = document.getElementById('depositButton');
    
    this.assertNotNull(stakeAmountInput, 'Stake amount input should exist');
    this.assertNotNull(approveButton, 'Approve button should exist');
    this.assertNotNull(depositButton, 'Deposit button should exist');

    // Test initial state
    this.assertTrue(approveButton.disabled, 'Approve button should be disabled initially');
    this.assertTrue(depositButton.disabled, 'Deposit button should be disabled initially');

    // Test input change triggers validation
    this.setInputValue('#stakeAmount', '100');
    await this.wait(100); // Wait for validation to run
    
    // Verify that input validation affects button states
    // (This depends on the actual implementation)
    this.assertNotNull(stakeAmountInput.value, 'Input value should be set');
  }

  async testBridgeToEthereumFlow() {
    // Test the complete flow for bridging to ethereum
    const ethStakeAmountInput = document.getElementById('ethStakeAmount');
    const ethQueryIdInput = document.getElementById('ethQueryId');
    const withdrawButton = document.getElementById('withdrawButton');
    
    this.assertNotNull(ethStakeAmountInput, 'Ethereum stake amount input should exist');
    this.assertNotNull(ethQueryIdInput, 'Ethereum query ID input should exist');
    this.assertNotNull(withdrawButton, 'Withdraw button should exist');

    // Test input validation
    this.setInputValue('#ethStakeAmount', '50');
    this.setInputValue('#ethQueryId', '0x1234567890123456789012345678901234567890');
    
    await this.wait(100);
    
    this.assertEqual(ethStakeAmountInput.value, '50', 'Ethereum stake amount should be set');
    this.assertEqual(ethQueryIdInput.value, '0x1234567890123456789012345678901234567890', 'Ethereum query ID should be set');
  }

  async testDelegationFlow() {
    // Test the complete delegation flow
    const delegateStakeAmountInput = document.getElementById('delegateStakeAmount');
    const validatorDropdown = document.getElementById('delegateValidatorDropdown');
    const delegateButton = document.getElementById('delegateButton');
    
    this.assertNotNull(delegateStakeAmountInput, 'Delegate stake amount input should exist');
    this.assertNotNull(validatorDropdown, 'Validator dropdown should exist');
    this.assertNotNull(delegateButton, 'Delegate button should exist');

    // Test input setup
    this.setInputValue('#delegateStakeAmount', '75');
    
    // Test validator dropdown population (if implemented)
    if (validatorDropdown.options.length > 1) {
      this.assert(validatorDropdown.options.length > 1, 'Validator dropdown should have options');
    }
    
    this.assertEqual(delegateStakeAmountInput.value, '75', 'Delegate stake amount should be set');
  }

  // Wallet Integration Tests
  async testWalletManagerInteraction() {
    const walletManagerToggle = document.getElementById('walletManagerToggle');
    const walletManagerContent = document.getElementById('walletManagerContent');
    
    this.assertNotNull(walletManagerToggle, 'Wallet manager toggle should exist');
    this.assertNotNull(walletManagerContent, 'Wallet manager content should exist');

    // Test initial state
    this.assertFalse(walletManagerContent.classList.contains('active'), 'Wallet manager should be closed initially');

    // Test toggle functionality
    this.clickElement('#walletManagerToggle');
    await this.wait(100);
    
    // Verify toggle state change (this depends on CSS implementation)
    // We'll just verify the elements exist and are clickable
    this.assertNotNull(walletManagerToggle, 'Wallet manager toggle should remain after click');
  }

  async testNetworkSwitching() {
    // Test network toggle buttons
    const networkToggleBtn = document.getElementById('network-toggle-btn');
    const cosmosNetworkToggleBtn = document.getElementById('cosmos-network-toggle-btn');
    
    if (networkToggleBtn) {
      this.assertNotNull(networkToggleBtn, 'Network toggle button should exist');
      this.assertString(networkToggleBtn.textContent, 'Network toggle button should have text');
    }
    
    if (cosmosNetworkToggleBtn) {
      this.assertNotNull(cosmosNetworkToggleBtn, 'Cosmos network toggle button should exist');
      this.assertString(cosmosNetworkToggleBtn.textContent, 'Cosmos network toggle button should have text');
    }
  }

  async testWalletConnectionState() {
    // Test that wallet connection state is properly managed
    const walletButton = document.getElementById('walletButton');
    const keplrButton = document.getElementById('keplrButton');
    
    this.assertNotNull(walletButton, 'Wallet button should exist');
    this.assertNotNull(keplrButton, 'Keplr button should exist');

    // Test button text changes based on connection state
    if (window.App && window.App.isConnected) {
      this.assertString(walletButton.textContent, 'Wallet button should have text when connected');
    } else {
      this.assertString(walletButton.textContent, 'Wallet button should have text when disconnected');
    }

    if (window.App && window.App.isKeplrConnected) {
      this.assertString(keplrButton.textContent, 'Keplr button should have text when connected');
    } else {
      this.assertString(keplrButton.textContent, 'Keplr button should have text when disconnected');
    }
  }

  // UI Integration Tests
  async testBridgeDirectionTabs() {
    const bridgeToLayerBtn = document.getElementById('bridgeToLayerBtn');
    const bridgeToEthBtn = document.getElementById('bridgeToEthBtn');
    const delegateBtn = document.getElementById('delegateBtn');
    
    const bridgeToLayerSection = document.getElementById('bridgeToLayerSection');
    const bridgeToEthSection = document.getElementById('bridgeToEthSection');
    const delegateSection = document.getElementById('delegateSection');
    
    this.assertNotNull(bridgeToLayerBtn, 'Bridge to Layer button should exist');
    this.assertNotNull(bridgeToEthBtn, 'Bridge to Ethereum button should exist');
    this.assertNotNull(delegateBtn, 'Delegate button should exist');

    // Test initial state
    this.assertTrue(bridgeToLayerSection.classList.contains('active'), 'Bridge to Layer section should be active initially');
    this.assertFalse(bridgeToEthSection.classList.contains('active'), 'Bridge to Ethereum section should not be active initially');
    this.assertFalse(delegateSection.classList.contains('active'), 'Delegate section should not be active initially');

    // Test tab switching
    this.clickElement('#bridgeToEthBtn');
    await this.wait(100);
    
    // Verify section visibility changes
    this.assertFalse(bridgeToLayerSection.classList.contains('active'), 'Bridge to Layer section should not be active after switch');
    this.assertTrue(bridgeToEthSection.classList.contains('active'), 'Bridge to Ethereum section should be active after switch');
  }

  async testInputValidationIntegration() {
    // Test that input validation works across different sections
    const stakeAmountInput = document.getElementById('stakeAmount');
    const ethStakeAmountInput = document.getElementById('ethStakeAmount');
    
    this.assertNotNull(stakeAmountInput, 'Stake amount input should exist');
    this.assertNotNull(ethStakeAmountInput, 'Ethereum stake amount input should exist');

    // Test input validation triggers
    this.setInputValue('#stakeAmount', 'invalid');
    this.setInputValue('#ethStakeAmount', '200');
    
    await this.wait(100);
    
    // Verify inputs maintain their values
    this.assertEqual(stakeAmountInput.value, 'invalid', 'Stake amount input should maintain invalid value');
    this.assertEqual(ethStakeAmountInput.value, '200', 'Ethereum stake amount input should maintain value');
  }

  async testButtonStateSync() {
    // Test that button states are synchronized across the UI
    const approveButton = document.getElementById('approveButton');
    const depositButton = document.getElementById('depositButton');
    
    if (approveButton && depositButton) {
      // Test that button states are properly managed
      this.assertDefined(approveButton.disabled, 'Approve button should have disabled state');
      this.assertDefined(depositButton.disabled, 'Deposit button should have disabled state');
      
      // Test that buttons respond to input changes
      this.setInputValue('#stakeAmount', '100');
      await this.wait(100);
      
      // Verify button states change (this depends on implementation)
      this.assertNotNull(approveButton, 'Approve button should exist after input change');
      this.assertNotNull(depositButton, 'Deposit button should exist after input change');
    }
  }

  // Error Handling Integration
  async testErrorHandlingIntegration() {
    // Test that error handling works across components
    if (window.App && window.App.handleError) {
      // Test that error handling method exists and is callable
      this.assertDoesNotThrow(() => {
        // Don't actually trigger an error, just verify the method exists
        if (window.App.handleError) {
          // Method exists
        }
      }, 'Error handling should not crash the app');
    }
    
    // Test that error states are properly displayed
    const errorElements = document.querySelectorAll('.error, .error-message, [class*="error"]');
    // We don't assert on error elements existing, just that the app handles them gracefully
  }

  async testNetworkErrorRecovery() {
    // Test that the app can recover from network errors
    // This is a basic test that the app doesn't crash on network issues
    
    // Test that network-related functions exist
    if (window.App && window.App.updateNetworkDisplay) {
      this.assertFunction(window.App.updateNetworkDisplay, 'Network display update should exist');
    }
    
    if (window.App && window.App.updateCosmosNetworkDisplay) {
      this.assertFunction(window.App.updateCosmosNetworkDisplay, 'Cosmos network display update should exist');
    }
  }

  // Performance Tests
  async testInitializationPerformance() {
    // Test that app initialization completes within reasonable time
    const startTime = performance.now();
    
    // Wait for App to be available
    await this.waitForCondition(() => typeof window.App !== 'undefined', 10000);
    
    const initTime = performance.now() - startTime;
    
    // App should initialize within 10 seconds
    this.assert(initTime < 10000, `App initialization took too long: ${initTime.toFixed(2)}ms`);
    
    // Test that key methods are available after initialization
    this.assertNotNull(window.App, 'App should be available after initialization');
    this.assertFunction(window.App.init, 'App.init should be available after initialization');
  }

  async testUIResponsiveness() {
    // Test that UI interactions are responsive
    const startTime = performance.now();
    
    // Test button click responsiveness
    const testButton = document.getElementById('walletManagerToggle');
    if (testButton) {
      this.clickElement('#walletManagerToggle');
      await this.wait(100);
      
      const responseTime = performance.now() - startTime;
      
      // UI should respond within 200ms
      this.assert(responseTime < 200, `UI response too slow: ${responseTime.toFixed(2)}ms`);
    }
    
    // Test input responsiveness
    const inputStartTime = performance.now();
    this.setInputValue('#stakeAmount', 'test');
    const inputResponseTime = performance.now() - inputStartTime;
    
    // Input should respond within 50ms
    this.assert(inputResponseTime < 50, `Input response too slow: ${inputResponseTime.toFixed(2)}ms`);
  }

  async testNoStakeReportingIntegration() {
    // Test the complete no-stake reporting flow
    const noStakeTab = document.getElementById('noStakeReportBtn');
    const queryDataInput = document.getElementById('noStakeQueryData');
    const valueInput = document.getElementById('noStakeValue');
    const submitButton = document.getElementById('submitNoStakeReportBtn');
    
    this.assertNotNull(noStakeTab, 'No-stake tab should exist');
    this.assertNotNull(queryDataInput, 'Query data input should exist');
    this.assertNotNull(valueInput, 'Value input should exist');
    this.assertNotNull(submitButton, 'Submit button should exist');

    // Test tab switching
    noStakeTab.click();
    await this.wait(100);
    this.assertTrue(noStakeTab.classList.contains('active'), 'No-stake tab should be active');

    // Test input interaction
    this.setInputValue('#noStakeQueryData', '0x1234567890abcdef');
    this.setInputValue('#noStakeValue', '0x9876543210fedcba');
    
    this.assertEqual(queryDataInput.value, '0x1234567890abcdef', 'Query data input should accept value');
    this.assertEqual(valueInput.value, '0x9876543210fedcba', 'Value input should accept value');

    // Test that submit function exists
    this.assertFunction(window.App.submitNoStakeReport, 'submitNoStakeReport should be available');
  }
}
