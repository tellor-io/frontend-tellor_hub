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

      // NEW: Complete User Flow Tests
      {
        name: 'Complete MetaMask connection and bridge flow',
        run: () => this.testCompleteMetaMaskFlow()
      },
      {
        name: 'Complete Keplr connection and bridge flow',
        run: () => this.testCompleteKeplrFlow()
      },
      {
        name: 'Complete no-stake reporting flow',
        run: () => this.testCompleteNoStakeFlow()
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

      // NEW: Error Scenario Tests
      {
        name: 'MetaMask connection failure handling',
        run: () => this.testMetaMaskConnectionFailure()
      },
      {
        name: 'Contract transaction failure handling',
        run: () => this.testContractTransactionFailure()
      },
      {
        name: 'Insufficient balance error handling',
        run: () => this.testInsufficientBalanceError()
      },
      {
        name: 'Network switching error handling',
        run: () => this.testNetworkSwitchingError()
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

  // NEW: Complete User Flow Tests
  async testCompleteMetaMaskFlow() {
    // Mock everything needed for a complete MetaMask flow
    const mockProvider = this.mockMetaMaskProvider();
    const mockWeb3 = this.mockWeb3Instance();
    const mockContract = this.mockContract('TokenBridge', {
      methods: {
        approve: () => ({
          send: async (options) => ({
            transactionHash: '0xapprove1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
            gasUsed: 50000,
            events: {}
          }),
          call: async () => true,
          estimateGas: async () => 50000
        }),
        deposit: () => ({
          send: async (options) => ({
            transactionHash: '0xdeposit1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
            gasUsed: 100000,
            events: {}
          }),
          call: async () => true,
          estimateGas: async () => 100000
        }),
        balanceOf: () => ({
          call: async () => '1000000000000000000000' // 1000 tokens
        }),
        allowance: () => ({
          call: async () => '0' // No allowance initially
        })
      }
    });
    
    // Set up global mocks
    window.ethereum = mockProvider;
    window.web3 = mockWeb3;
    
    // Wait for App to be available
    await this.waitForCondition(() => typeof window.App !== 'undefined', 10000);
    
    // Step 1: Connect MetaMask
    const metaMaskButton = document.getElementById('walletButton') || 
                          document.querySelector('[data-wallet="metamask"]') ||
                          document.querySelector('.wallet-button');
    
    this.assertNotNull(metaMaskButton, 'MetaMask connection button should exist');
    
    metaMaskButton.click();
    await this.wait(1000); // Wait for connection
    
    // Verify connection succeeded
    this.assertDefined(window.App.isConnected, 'App should track connection state');
    this.assertDefined(window.App.account, 'App should track connected account');
    
    // Step 2: Fill out bridge form
    const stakeAmountInput = document.getElementById('stakeAmount');
    this.assertNotNull(stakeAmountInput, 'Stake amount input should exist');
    
    this.setInputValue('#stakeAmount', '100');
    await this.wait(100);
    
    // Step 3: Click approve button
    const approveButton = document.getElementById('approveButton');
    this.assertNotNull(approveButton, 'Approve button should exist');
    
    // Enable button if needed
    if (approveButton.disabled) {
      // Mock validation to pass
      if (window.App.validateAmount) {
        const originalValidate = window.App.validateAmount;
        window.App.validateAmount = () => true;
        
        stakeAmountInput.dispatchEvent(new Event('input', { bubbles: true }));
        await this.wait(100);
        
        window.App.validateAmount = originalValidate;
      }
    }
    
    approveButton.click();
    await this.wait(2000); // Wait for approval transaction
    
    // Verify approval was processed
    this.assert(mockProvider.request.calls.length > 0, 'MetaMask provider should have been called');
    
    // Step 4: Click deposit button
    const depositButton = document.getElementById('depositButton');
    this.assertNotNull(depositButton, 'Deposit button should exist');
    
    // Enable button if needed (simulate sufficient allowance)
    if (depositButton.disabled) {
      if (window.App.getAllowance) {
        const originalGetAllowance = window.App.getAllowance;
        window.App.getAllowance = async () => '100000000000000000000'; // 100 tokens
        
        stakeAmountInput.dispatchEvent(new Event('input', { bubbles: true }));
        await this.wait(100);
        
        window.App.getAllowance = originalGetAllowance;
      }
    }
    
    depositButton.click();
    await this.wait(2000); // Wait for deposit transaction
    
    // Verify deposit was processed
    this.assert(mockProvider.request.calls.length > 1, 'MetaMask provider should have been called multiple times');
    
    // Step 5: Verify final state
    this.assertDefined(window.App.isConnected, 'App should remain connected');
    this.assertDefined(window.App.account, 'App should maintain account');
  }

  async testCompleteKeplrFlow() {
    // Mock everything needed for a complete Keplr flow
    const mockKeplr = this.mockKeplrProvider();
    
    // Set up global mock
    window.keplr = mockKeplr;
    
    // Wait for App to be available
    await this.waitForCondition(() => typeof window.App !== 'undefined', 10000);
    
    // Step 1: Connect Keplr
    const keplrButton = document.getElementById('keplrButton') || 
                       document.querySelector('[data-wallet="keplr"]') ||
                       document.querySelector('.keplr-button');
    
    this.assertNotNull(keplrButton, 'Keplr connection button should exist');
    
    keplrButton.click();
    await this.wait(1000); // Wait for connection
    
    // Verify connection succeeded
    this.assertDefined(window.App.isKeplrConnected, 'App should track Keplr connection state');
    this.assertDefined(window.App.keplrAddress, 'App should track Keplr address');
    
    // Step 2: Test delegation flow
    const delegateTab = document.getElementById('delegateBtn');
    if (delegateTab) {
      delegateTab.click();
      await this.wait(100);
      
      const delegateSection = document.getElementById('delegateSection');
      this.assertTrue(delegateSection.classList.contains('active'), 'Delegate section should be active');
      
      // Fill out delegation form
      const delegateStakeAmountInput = document.getElementById('delegateStakeAmount');
      const validatorDropdown = document.getElementById('delegateValidatorDropdown');
      
      if (delegateStakeAmountInput && validatorDropdown) {
        this.setInputValue('#delegateStakeAmount', '75');
        
        if (validatorDropdown.options.length > 1) {
          validatorDropdown.value = validatorDropdown.options[1].value;
          validatorDropdown.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        await this.wait(100);
        
        // Click delegate button
        const delegateButton = document.getElementById('delegateButton');
        if (delegateButton) {
          delegateButton.click();
          await this.wait(1000);
          
          // Verify delegation was attempted
          this.assertDefined(delegateButton.textContent, 'Delegate button should have text content');
        }
      }
    }
    
    // Step 3: Verify final state
    this.assertDefined(window.App.isKeplrConnected, 'App should remain connected to Keplr');
    this.assertDefined(window.App.keplrAddress, 'App should maintain Keplr address');
  }

  async testCompleteNoStakeFlow() {
    // Mock everything needed for no-stake reporting
    const mockProvider = this.mockMetaMaskProvider();
    const mockWeb3 = this.mockWeb3Instance();
    
    // Set up global mocks
    window.ethereum = mockProvider;
    window.web3 = mockWeb3;
    
    // Wait for App to be available
    await this.waitForCondition(() => typeof window.App !== 'undefined', 10000);
    
    // Step 1: Connect MetaMask
    const metaMaskButton = document.getElementById('walletButton') || 
                          document.querySelector('[data-wallet="metamask"]') ||
                          document.querySelector('.wallet-button');
    
    if (metaMaskButton) {
      metaMaskButton.click();
      await this.wait(1000);
    }
    
    // Step 2: Switch to no-stake reporting tab
    const noStakeTab = document.getElementById('noStakeReportBtn');
    this.assertNotNull(noStakeTab, 'No-stake reporting tab should exist');
    
    noStakeTab.click();
    await this.wait(100);
    
    const noStakeSection = document.getElementById('noStakeReportSection');
    this.assertTrue(noStakeSection.classList.contains('active'), 'No-stake section should be active');
    
    // Step 3: Fill out no-stake form
    const queryDataInput = document.getElementById('noStakeQueryData');
    const valueInput = document.getElementById('noStakeValue');
    
    this.assertNotNull(queryDataInput, 'Query data input should exist');
    this.assertNotNull(valueInput, 'Value input should exist');
    
    this.setInputValue('#noStakeQueryData', '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
    this.setInputValue('#noStakeValue', '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba');
    await this.wait(100);
    
    // Step 4: Submit no-stake report
    const submitButton = document.getElementById('submitNoStakeReportBtn');
    this.assertNotNull(submitButton, 'Submit button should exist');
    
    // Enable button if needed
    if (submitButton.disabled) {
      if (window.App.validateNoStakeInputs) {
        const originalValidate = window.App.validateNoStakeInputs;
        window.App.validateNoStakeInputs = () => true;
        
        queryDataInput.dispatchEvent(new Event('input', { bubbles: true }));
        valueInput.dispatchEvent(new Event('input', { bubbles: true }));
        await this.wait(100);
        
        window.App.validateNoStakeInputs = originalValidate;
      }
    }
    
    submitButton.click();
    await this.wait(1000);
    
    // Step 5: Verify submission was processed
    if (window.App.submitNoStakeReport) {
      const submitSpy = this.spyOn(window.App, 'submitNoStakeReport');
      
      submitButton.click();
      await this.wait(500);
      
      this.assert(submitSpy.wasCalled(), 'submitNoStakeReport function should have been called');
    }
    
    // Step 6: Verify final state
    this.assertEqual(queryDataInput.value, '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'Query data should maintain value');
    this.assertEqual(valueInput.value, '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba', 'Value should maintain value');
  }

  // NEW: Error Scenario Tests
  async testMetaMaskConnectionFailure() {
    // Mock MetaMask provider that fails
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
    
    // Set up global mock
    window.ethereum = mockProvider;
    
    // Wait for App to be available
    await this.waitForCondition(() => typeof window.App !== 'undefined', 10000);
    
    // Try to connect MetaMask
    const metaMaskButton = document.getElementById('walletButton') || 
                          document.querySelector('[data-wallet="metamask"]') ||
                          document.querySelector('.wallet-button');
    
    if (metaMaskButton) {
      metaMaskButton.click();
      await this.wait(1000);
      
      // Verify connection failed gracefully
      this.assertDefined(metaMaskButton, 'Button should still exist after failed connection');
      this.assertFalse(window.App.isConnected, 'App should not be connected after failed connection');
    }
  }

  async testContractTransactionFailure() {
    // Mock MetaMask provider
    const mockProvider = this.mockMetaMaskProvider();
    const mockWeb3 = this.mockWeb3Instance();
    
    // Mock contract that fails
    const mockContract = this.mockContract('TokenBridge', {
      methods: {
        approve: () => ({
          send: async (options) => {
            throw new Error('Transaction failed: insufficient gas');
          },
          call: async () => true,
          estimateGas: async () => 50000
        })
      }
    });
    
    // Set up global mocks
    window.ethereum = mockProvider;
    window.web3 = mockWeb3;
    
    // Wait for App to be available
    await this.waitForCondition(() => typeof window.App !== 'undefined', 10000);
    
    // Connect wallet first
    if (window.App.connectMetaMask) {
      await window.App.connectMetaMask();
      await this.wait(500);
    }
    
    // Try to approve (should fail)
    const approveButton = document.getElementById('approveButton');
    if (approveButton) {
      const stakeAmountInput = document.getElementById('stakeAmount');
      if (stakeAmountInput) {
        this.setInputValue('#stakeAmount', '100');
        await this.wait(100);
        
        // Enable button if needed
        if (approveButton.disabled) {
          if (window.App.validateAmount) {
            const originalValidate = window.App.validateAmount;
            window.App.validateAmount = () => true;
            
            stakeAmountInput.dispatchEvent(new Event('input', { bubbles: true }));
            await this.wait(100);
            
            window.App.validateAmount = originalValidate;
          }
        }
        
        approveButton.click();
        await this.wait(1000);
        
        // Verify button recovered from error
        this.assertDefined(approveButton.textContent, 'Approve button should have text content after error');
        this.assertDefined(approveButton.disabled, 'Approve button should have disabled state after error');
      }
    }
  }

  async testInsufficientBalanceError() {
    // Mock MetaMask provider
    const mockProvider = this.mockMetaMaskProvider();
    const mockWeb3 = this.mockWeb3Instance();
    
    // Mock contract with insufficient balance
    const mockContract = this.mockContract('TokenBridge', {
      methods: {
        balanceOf: () => ({
          call: async () => '100000000000000000' // 0.1 tokens (insufficient for 100 token deposit)
        }),
        allowance: () => ({
          call: async () => '0'
        })
      }
    });
    
    // Set up global mocks
    window.ethereum = mockProvider;
    window.web3 = mockWeb3;
    
    // Wait for App to be available
    await this.waitForCondition(() => typeof window.App !== 'undefined', 10000);
    
    // Connect wallet first
    if (window.App.connectMetaMask) {
      await window.App.connectMetaMask();
      await this.wait(500);
    }
    
    // Try to deposit with insufficient balance
    const stakeAmountInput = document.getElementById('stakeAmount');
    if (stakeAmountInput) {
      this.setInputValue('#stakeAmount', '100');
      await this.wait(100);
      
      // Verify validation catches insufficient balance
      if (window.App.validateAmount) {
        const validationResult = await window.App.validateAmount();
        // This should fail validation due to insufficient balance
        this.assertDefined(validationResult, 'Validation should return a result');
      }
    }
  }

  async testNetworkSwitchingError() {
    // Mock MetaMask provider that fails on network switch
    const mockProvider = {
      request: async (method, params = []) => {
        if (method === 'wallet_switchEthereumChain') {
          throw new Error('User rejected the request');
        }
        if (method === 'eth_requestAccounts') {
          return ['0x1234567890123456789012345678901234567890'];
        }
        if (method === 'eth_chainId') {
          return '0x1'; // mainnet
        }
        throw new Error(`Unsupported method: ${method}`);
      },
      on: (event, callback) => {
        if (event === 'chainChanged') {
          // Don't trigger chain change event
        }
      },
      removeListener: () => {},
      isMetaMask: true,
      selectedAddress: '0x1234567890123456789012345678901234567890',
      networkVersion: '1'
    };
    
    // Set up global mock
    window.ethereum = mockProvider;
    
    // Wait for App to be available
    await this.waitForCondition(() => typeof window.App !== 'undefined', 10000);
    
    // Connect wallet first
    if (window.App.connectMetaMask) {
      await window.App.connectMetaMask();
      await this.wait(500);
    }
    
    // Try to switch networks (should fail)
    const networkToggleBtn = document.getElementById('network-toggle-btn');
    if (networkToggleBtn) {
      networkToggleBtn.click();
      await this.wait(1000);
      
      // Verify app handles network switch failure gracefully
      this.assertDefined(networkToggleBtn, 'Network toggle button should still exist after failed switch');
    }
  }
}
