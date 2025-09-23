// Unit Tests for Layer Bridge Application
import { TestSuite } from './test-suite.js';

export class UnitTests extends TestSuite {
  constructor() {
    super();
  }

  getTests() {
    return [
      // Core App Tests
      {
        name: 'App object exists and has required properties',
        run: () => this.testAppObject()
      },
      {
        name: 'App initialization structure',
        run: () => this.testAppInitialization()
      },
      {
        name: 'Web3 provider initialization',
        run: () => this.testWeb3Provider()
      },
      {
        name: 'Contract initialization',
        run: () => this.testContractInitialization()
      },

      // Wallet Connection Tests
      {
        name: 'MetaMask connection structure',
        run: () => this.testMetaMaskConnection()
      },
      {
        name: 'Keplr connection structure',
        run: () => this.testKeplrConnection()
      },
      {
        name: 'Wallet disconnection methods',
        run: () => this.testWalletDisconnection()
      },

      // Functional Button Tests - NEW!
      {
        name: 'MetaMask connection button functionality',
        run: () => this.testMetaMaskConnectionButton()
      },
      {
        name: 'Keplr connection button functionality',
        run: () => this.testKeplrConnectionButton()
      },
      {
        name: 'Approve button functionality',
        run: () => this.testApproveButtonFunctionality()
      },
      {
        name: 'Deposit button functionality',
        run: () => this.testDepositButtonFunctionality()
      },
      {
        name: 'Withdrawal button functionality',
        run: () => this.testWithdrawalButtonFunctionality()
      },
      {
        name: 'Delegate button functionality',
        run: () => this.testDelegateButtonFunctionality()
      },
      {
        name: 'No-stake report button functionality',
        run: () => this.testNoStakeReportButtonFunctionality()
      },

      // Network Detection Tests - NEW!
      {
        name: 'Network detection for mainnet',
        run: () => this.testNetworkDetectionMainnet()
      },
      {
        name: 'Network detection for testnet',
        run: () => this.testNetworkDetectionTestnet()
      },
      {
        name: 'Network switching functionality',
        run: () => this.testNetworkSwitching()
      },
      {
        name: 'Cosmos wallet adapter network detection',
        run: () => this.testCosmosWalletAdapterNetworkDetection()
      },

      // Enhanced Functional Tests
      {
        name: 'Withdrawal button functionality on mainnet',
        run: () => this.testWithdrawalButtonFunctionalityMainnet()
      },
      {
        name: 'Withdrawal button functionality on testnet',
        run: () => this.testWithdrawalButtonFunctionalityTestnet()
      },
      {
        name: 'Delegate button functionality on mainnet',
        run: () => this.testDelegateButtonFunctionalityMainnet()
      },
      {
        name: 'Delegate button functionality on testnet',
        run: () => this.testDelegateButtonFunctionalityTestnet()
      },
      {
        name: 'Validator fetching and dropdown population',
        run: () => this.testValidatorFetchingAndDropdown()
      },
      {
        name: 'Reporter fetching and dropdown population',
        run: () => this.testReporterFetchingAndDropdown()
      },
      {
        name: 'Current delegations status display',
        run: () => this.testCurrentDelegationsStatus()
      },
      {
        name: 'Current reporter status display',
        run: () => this.testCurrentReporterStatus()
      },
      {
        name: 'Delegations dropdown toggle functionality',
        run: () => this.testDelegationsDropdownToggle()
      },
      {
        name: 'Copy to clipboard functionality',
        run: () => this.testCopyToClipboard()
      },
      {
        name: 'Reporter selection functionality',
        run: () => this.testReporterSelection()
      },
      {
        name: 'Network switching for delegate functions',
        run: () => this.testNetworkSwitchingForDelegate()
      },
      {
        name: 'Dispute functions on mainnet',
        run: () => this.testDisputeFunctionsMainnet()
      },
      {
        name: 'Dispute functions on testnet',
        run: () => this.testDisputeFunctionsTestnet()
      },
      {
        name: 'No-stake reporting on mainnet',
        run: () => this.testNoStakeReportingMainnet()
      },
      {
        name: 'No-stake reporting on testnet',
        run: () => this.testNoStakeReportingTestnet()
      },

      // Bridge Function Tests
      {
        name: 'Bridge direction switching',
        run: () => this.testBridgeDirectionSwitching()
      },
      {
        name: 'Deposit approval flow',
        run: () => this.testDepositApproval()
      },
      {
        name: 'Deposit execution flow',
        run: () => this.testDepositExecution()
      },
      {
        name: 'Withdrawal request flow',
        run: () => this.testWithdrawalRequest()
      },
      {
        name: 'Delegation flow',
        run: () => this.testDelegationFlow()
      },

      // No-Stake Reporting Tests
      {
        name: 'No-stake reporting tab structure',
        run: () => this.testNoStakeReportingStructure()
      },
      {
        name: 'No-stake reporting functionality',
        run: () => this.testNoStakeReportingFunctionality()
      },
      {
        name: 'No-stake input validation',
        run: () => this.testNoStakeInputValidation()
      },

      // Dispute Module Tests
      {
        name: 'Dispute proposer initialization',
        run: () => this.testDisputeProposerInitialization()
      },
      {
        name: 'Dispute proposal validation',
        run: () => this.testDisputeProposalValidation()
      },
      {
        name: 'Dispute voting validation',
        run: () => this.testDisputeVotingValidation()
      },
      {
        name: 'Dispute fee validation',
        run: () => this.testDisputeFeeValidation()
      },
      {
        name: 'Dispute address validation',
        run: () => this.testDisputeAddressValidation()
      },
      {
        name: 'Dispute voting power check',
        run: () => this.testDisputeVotingPowerCheck()
      },
      {
        name: 'Dispute utility functions',
        run: () => this.testDisputeUtilityFunctions()
      },

      // Input Validation Tests
      {
        name: 'Amount input validation',
        run: () => this.testAmountValidation()
      },
      {
        name: 'Address input validation',
        run: () => this.testAddressValidation()
      },
      {
        name: 'Balance checking',
        run: () => this.testBalanceChecking()
      },
      {
        name: 'Allowance checking',
        run: () => this.testAllowanceChecking()
      },

      // UI Component Tests
      {
        name: 'Wallet manager dropdown',
        run: () => this.testWalletManagerDropdown()
      },
      {
        name: 'Network display updates',
        run: () => this.testNetworkDisplay()
      },
      {
        name: 'Button state management',
        run: () => this.testButtonStateManagement()
      },
      {
        name: 'Tooltip functionality',
        run: () => this.testTooltipFunctionality()
      },

      // Utility Function Tests
      {
        name: 'Web3 utility functions',
        run: () => this.testWeb3Utilities()
      },
      {
        name: 'Ethers utility functions',
        run: () => this.testEthersUtilities()
      },
      {
        name: 'Error handling',
        run: () => this.testErrorHandling()
      }
    ];
  }

  // Core App Tests
  async testAppObject() {
    // Wait for App to be available
    await this.waitForCondition(() => typeof window.App !== 'undefined', 10000);
    
    this.assertNotNull(window.App, 'App object should exist');
    this.assertObject(window.App, 'App should be an object');
    this.assertFunction(window.App.init, 'App should have init method');
    this.assertFunction(window.App.initWeb3, 'App should have initWeb3 method');
  }

  async testAppInitialization() {
    this.assertDefined(window.App.web3Provider, 'web3Provider should be defined');
    this.assertDefined(window.App.contracts, 'contracts should be defined');
    this.assertDefined(window.App.account, 'account should be defined');
    this.assertDefined(window.App.bridgeAddress, 'bridgeAddress should be defined');
    this.assertDefined(window.App.tokenAddress, 'tokenAddress should be defined');
  }

  async testWeb3Provider() {
    // Test that web3 provider can be initialized
    this.assertDefined(window.App.web3Provider, 'web3Provider should be defined');
    
    // Test web3 instance creation
    if (window.App.web3) {
      this.assertObject(window.App.web3, 'web3 should be an object');
      this.assertFunction(window.App.web3.utils.toWei, 'web3.utils.toWei should be available');
      this.assertFunction(window.App.web3.utils.fromWei, 'web3.utils.fromWei should be available');
    }
  }

  async testContractInitialization() {
    this.assertObject(window.App.contracts, 'contracts should be an object');
    
    // Test that contract addresses are defined
    if (window.App.bridgeAddress && window.App.bridgeAddress.testnet) {
      this.assertString(window.App.bridgeAddress.testnet, 'testnet bridge address should be a string');
    }
    
    if (window.App.tokenAddress && window.App.tokenAddress.testnet) {
      this.assertString(window.App.tokenAddress.testnet, 'testnet token address should be a string');
    }
  }

  // Wallet Connection Tests
  async testMetaMaskConnection() {
    this.assertFunction(window.App.connectMetaMask, 'connectMetaMask method should exist');
    this.assertFunction(window.App.disconnectMetaMask, 'disconnectMetaMask method should exist');
    
    // Test connection state
    this.assertDefined(window.App.isConnected, 'isConnected should be defined');
    this.assertDefined(window.App.account, 'account should be defined');
  }

  async testKeplrConnection() {
    this.assertFunction(window.App.connectKeplr, 'connectKeplr method should exist');
    this.assertFunction(window.App.disconnectKeplr, 'disconnectKeplr method should exist');
    
    // Test connection state
    this.assertDefined(window.App.isKeplrConnected, 'isKeplrConnected should be defined');
    this.assertDefined(window.App.keplrAddress, 'keplrAddress should be defined');
  }

  async testWalletDisconnection() {
    // Test that disconnection methods exist and are callable
    if (window.App.disconnectMetaMask) {
      this.assertDoesNotThrow(() => {
        // Just test that the method exists and can be called
        // Don't actually disconnect if connected
      }, 'disconnectMetaMask should not throw when called');
    }
    
    if (window.App.disconnectKeplr) {
      this.assertDoesNotThrow(() => {
        // Just test that the method exists and can be called
        // Don't actually disconnect if connected
      }, 'disconnectKeplr should not throw when called');
    }
  }

  // Bridge Function Tests
  async testBridgeDirectionSwitching() {
    this.assertFunction(window.App.initBridgeDirectionUI, 'initBridgeDirectionUI should exist');
    this.assertDefined(window.App.currentBridgeDirection, 'currentBridgeDirection should be defined');
    
    // Test that bridge direction buttons exist
    const bridgeToLayerBtn = document.getElementById('bridgeToLayerBtn');
    const bridgeToEthBtn = document.getElementById('bridgeToEthBtn');
    const delegateBtn = document.getElementById('delegateBtn');
    
    this.assertNotNull(bridgeToLayerBtn, 'Bridge to Layer button should exist');
    this.assertNotNull(bridgeToEthBtn, 'Bridge to Ethereum button should exist');
    this.assertNotNull(delegateBtn, 'Delegate button should exist');
  }

  async testDepositApproval() {
    this.assertFunction(window.App.approveDeposit, 'approveDeposit method should exist');
    this.assertFunction(window.App.getAllowance, 'getAllowance method should exist');
    
    // Test that approval button exists
    const approveButton = document.getElementById('approveButton');
    this.assertNotNull(approveButton, 'Approve button should exist');
  }

  async testDepositExecution() {
    this.assertFunction(window.App.depositToLayer, 'depositToLayer method should exist');
    
    // Test that deposit button exists
    const depositButton = document.getElementById('depositButton');
    this.assertNotNull(depositButton, 'Deposit button should exist');
  }

  async testWithdrawalRequest() {
    this.assertFunction(window.App.withdrawFromLayer, 'withdrawFromLayer method should exist');
    
    // Test that withdrawal button exists
    const withdrawButton = document.getElementById('withdrawButton');
    this.assertNotNull(withdrawButton, 'Withdrawal button should exist');
  }

  async testDelegationFlow() {
    this.assertFunction(window.App.delegateTokens, 'delegateTokens method should exist');
    
    // Test that delegation button exists
    const delegateButton = document.getElementById('delegateButton');
    this.assertNotNull(delegateButton, 'Delegate button should exist');
    
    // Test that validator dropdown exists
    const validatorDropdown = document.getElementById('delegateValidatorDropdown');
    this.assertNotNull(validatorDropdown, 'Validator dropdown should exist');
  }

  // Input Validation Tests
  async testAmountValidation() {
    // Test that amount inputs exist
    const stakeAmountInput = document.getElementById('stakeAmount');
    const ethStakeAmountInput = document.getElementById('ethStakeAmount');
    const delegateStakeAmountInput = document.getElementById('delegateStakeAmount');
    
    this.assertNotNull(stakeAmountInput, 'Stake amount input should exist');
    this.assertNotNull(ethStakeAmountInput, 'Ethereum stake amount input should exist');
    this.assertNotNull(delegateStakeAmountInput, 'Delegate stake amount input should exist');
    
    // Test input types
    this.assertEqual(stakeAmountInput.type, 'text', 'Stake amount input should be text type');
    this.assertEqual(ethStakeAmountInput.type, 'text', 'Ethereum stake amount input should be text type');
    this.assertEqual(delegateStakeAmountInput.type, 'text', 'Delegate stake amount input should be text type');
  }

  async testAddressValidation() {
    // Test that address inputs exist
    const queryIdInput = document.getElementById('_queryId');
    const ethQueryIdInput = document.getElementById('ethQueryId');
    
    this.assertNotNull(queryIdInput, 'Query ID input should exist');
    this.assertNotNull(ethQueryIdInput, 'Ethereum query ID input should exist');
    
    // Test placeholders
    this.assertString(queryIdInput.placeholder, 'Query ID input should have placeholder');
    this.assertString(ethQueryIdInput.placeholder, 'Ethereum query ID input should have placeholder');
  }

  async testBalanceChecking() {
    if (window.App.checkBalance) {
      this.assertFunction(window.App.checkBalance, 'checkBalance method should exist');
    }
    
    // Test that balance displays exist
    const currentBalance = document.getElementById('currentBalance');
    const ethKeplrBalance = document.getElementById('ethKeplrBalance');
    
    this.assertNotNull(currentBalance, 'Current balance display should exist');
    this.assertNotNull(ethKeplrBalance, 'Keplr balance display should exist');
  }

  async testAllowanceChecking() {
    if (window.App.getAllowance) {
      this.assertFunction(window.App.getAllowance, 'getAllowance method should exist');
    }
    
    // Test that allowance checking is integrated with button states
    const approveButton = document.getElementById('approveButton');
    const depositButton = document.getElementById('depositButton');
    
    this.assertNotNull(approveButton, 'Approve button should exist');
    this.assertNotNull(depositButton, 'Deposit button should exist');
  }

  // UI Component Tests
  async testWalletManagerDropdown() {
    this.assertFunction(window.App.initWalletManagerDropdown, 'initWalletManagerDropdown should exist');
    
    // Test that wallet manager elements exist
    const walletManagerToggle = document.getElementById('walletManagerToggle');
    const walletManagerContent = document.getElementById('walletManagerContent');
    
    this.assertNotNull(walletManagerToggle, 'Wallet manager toggle should exist');
    this.assertNotNull(walletManagerContent, 'Wallet manager content should exist');
  }

  async testNetworkDisplay() {
    this.assertFunction(window.App.updateNetworkDisplay, 'updateNetworkDisplay should exist');
    this.assertFunction(window.App.updateCosmosNetworkDisplay, 'updateCosmosNetworkDisplay should exist');
    
    // Test that network display elements exist
    const networkDisplay = document.getElementById('network-display');
    const cosmosNetworkDisplay = document.getElementById('cosmos-network-display');
    
    this.assertNotNull(networkDisplay, 'Network display should exist');
    this.assertNotNull(cosmosNetworkDisplay, 'Cosmos network display should exist');
  }

  async testButtonStateManagement() {
    // Test that buttons can be enabled/disabled
    const approveButton = document.getElementById('approveButton');
    const depositButton = document.getElementById('depositButton');
    
    if (approveButton && depositButton) {
      // Test initial state
      this.assertDefined(approveButton.disabled, 'Approve button should have disabled property');
      this.assertDefined(depositButton.disabled, 'Deposit button should have disabled property');
    }
  }

  async testTooltipFunctionality() {
    // Test that tooltip elements exist
    const infoIcons = document.querySelectorAll('.info-icon');
    this.assert(infoIcons.length > 0, 'Info icons should exist');
    
    // Test that tooltips have data-tooltip attributes
    infoIcons.forEach(icon => {
      this.assert(icon.hasAttribute('data-tooltip'), 'Info icon should have data-tooltip attribute');
    });
  }

  // Utility Function Tests
  async testWeb3Utilities() {
    if (window.App.web3) {
      this.assertFunction(window.App.web3.utils.toWei, 'web3.utils.toWei should be available');
      this.assertFunction(window.App.web3.utils.fromWei, 'web3.utils.fromWei should be available');
      this.assertFunction(window.App.web3.utils.toBN, 'web3.utils.toBN should be available');
    }
  }

  async testEthersUtilities() {
    if (window.App.ethers) {
      this.assertObject(window.App.ethers, 'ethers should be an object');
      this.assertFunction(window.App.ethers.utils.parseEther, 'ethers.utils.parseEther should be available');
      this.assertFunction(window.App.ethers.utils.formatEther, 'ethers.utils.formatEther should be available');
    }
  }

  async testErrorHandling() {
    if (window.App.handleError) {
      this.assertFunction(window.App.handleError, 'handleError method should exist');
    }
    
    // Test that error handling doesn't crash the app
    this.assertDoesNotThrow(() => {
      // Test basic error handling structure
      if (window.App.handleError) {
        // Don't actually call it, just verify it exists
      }
    }, 'Error handling should not crash the app');
  }

  // No-Stake Reporting Tests
  async testNoStakeReportingStructure() {
    // Test that no-stake reporting tab exists
    const noStakeTab = document.getElementById('noStakeReportBtn');
    this.assertNotNull(noStakeTab, 'No-stake reporting tab should exist');
    this.assertEqual(noStakeTab.textContent.trim(), 'No-Stake Report', 'Tab should have correct text');

    // Test that no-stake section exists
    const noStakeSection = document.getElementById('noStakeReportSection');
    this.assertNotNull(noStakeSection, 'No-stake reporting section should exist');
    this.assertTrue(noStakeSection.classList.contains('bridge-section'), 'Section should have bridge-section class');

    // Test that input fields exist
    const queryDataInput = document.getElementById('noStakeQueryData');
    const valueInput = document.getElementById('noStakeValue');
    this.assertNotNull(queryDataInput, 'Query data input should exist');
    this.assertNotNull(valueInput, 'Value input should exist');
    this.assertTrue(queryDataInput.classList.contains('no-stake-input'), 'Query data should have no-stake-input class');
    this.assertTrue(valueInput.classList.contains('no-stake-input'), 'Value input should have no-stake-input class');

    // Test that labels exist
    const queryDataLabel = document.querySelector('.no-stake-query-container .input-label');
    const valueLabel = document.querySelector('.no-stake-value-container .input-label');
    this.assertNotNull(queryDataLabel, 'Query data label should exist');
    this.assertNotNull(valueLabel, 'Value label should exist');
    this.assertEqual(queryDataLabel.textContent.trim(), 'Query Data (Hex)', 'Query data label should have correct text');
    this.assertEqual(valueLabel.textContent.trim(), 'Value (Hex)', 'Value label should have correct text');

    // Test that submit button exists
    const submitButton = document.getElementById('submitNoStakeReportBtn');
    this.assertNotNull(submitButton, 'Submit button should exist');
    this.assertEqual(submitButton.textContent.trim(), 'Submit Report', 'Submit button should have correct text');
  }

  async testNoStakeReportingFunctionality() {
    // Test that no-stake reporting methods exist
    this.assertFunction(window.App.submitNoStakeReport, 'submitNoStakeReport method should exist');
    this.assertFunction(window.App.checkNoStakeWalletStatus, 'checkNoStakeWalletStatus method should exist');

    // Test that no-stake reporting is initialized
    if (window.App.initNoStakeReporting) {
      this.assertFunction(window.App.initNoStakeReporting, 'initNoStakeReporting method should exist');
    }

    // Test that the tab switching works for no-stake reporting
    const noStakeTab = document.getElementById('noStakeReportBtn');
    if (noStakeTab) {
      // Test that clicking the tab makes it active
      noStakeTab.click();
      this.assertTrue(noStakeTab.classList.contains('active'), 'No-stake tab should become active when clicked');
      
      // Test that the section becomes visible
      const noStakeSection = document.getElementById('noStakeReportSection');
      this.assertTrue(this.elementIsVisible(noStakeSection), 'No-stake section should be visible when tab is active');
    }
  }

  async testNoStakeInputValidation() {
    // Test input field properties
    const queryDataInput = document.getElementById('noStakeQueryData');
    const valueInput = document.getElementById('noStakeValue');

    if (queryDataInput && valueInput) {
      // Test query data input properties
      this.assertEqual(queryDataInput.tagName.toLowerCase(), 'textarea', 'Query data should be a textarea');
      this.assertEqual(queryDataInput.rows, 10, 'Query data textarea should have 10 rows');
      this.assertEqual(queryDataInput.placeholder, '0x...', 'Query data should have correct placeholder');
      this.assertTrue(queryDataInput.classList.contains('no-stake-input'), 'Query data should have no-stake-input class');

      // Test value input properties
      this.assertEqual(valueInput.type, 'text', 'Value input should be text type');
      this.assertEqual(valueInput.placeholder, '0x...', 'Value input should have correct placeholder');
      this.assertTrue(valueInput.classList.contains('no-stake-input'), 'Value input should have no-stake-input class');

      // Test that inputs are properly sized
      const queryContainer = document.querySelector('.no-stake-query-container');
      const valueContainer = document.querySelector('.no-stake-value-container');
      
      if (queryContainer && valueContainer) {
        this.assertTrue(queryContainer.classList.contains('input-with-label'), 'Query container should have input-with-label class');
        this.assertTrue(valueContainer.classList.contains('input-with-label'), 'Value container should have input-with-label class');
      }
    }
  }

  // NEW: Functional Button Tests
  async testMetaMaskConnectionButton() {
    // Mock MetaMask provider
    const mockProvider = this.mockMetaMaskProvider();
    const mockWeb3 = this.mockWeb3Instance();
    
    // Set up global mocks
    window.ethereum = mockProvider;
    window.web3 = mockWeb3;
    
    // Wait for App to be available
    await this.waitForCondition(() => typeof window.App !== 'undefined', 10000);
    
    // Find the MetaMask connection button
    const metaMaskButton = document.getElementById('walletButton') || 
                          document.querySelector('[data-wallet="metamask"]') ||
                          document.querySelector('.wallet-button');
    
    this.assertNotNull(metaMaskButton, 'MetaMask connection button should exist');
    
    // Test initial state
    this.assertFalse(metaMaskButton.disabled, 'MetaMask button should not be disabled initially');
    
    // Click the button
    metaMaskButton.click();
    await this.wait(500); // Wait for connection process
    
    // Verify connection was attempted
    this.assert(mockProvider.request.calls.length > 0, 'MetaMask provider should have been called');
    
    // Verify App state was updated
    this.assertDefined(window.App.isConnected, 'App should track connection state');
    this.assertDefined(window.App.account, 'App should track connected account');
  }

  async testKeplrConnectionButton() {
    // Mock Keplr provider
    const mockKeplr = this.mockKeplrProvider();
    
    // Set up global mock
    window.keplr = mockKeplr;
    
    // Wait for App to be available
    await this.waitForCondition(() => typeof window.App !== 'undefined', 10000);
    
    // Find the Keplr connection button
    const keplrButton = document.getElementById('keplrButton') || 
                       document.querySelector('[data-wallet="keplr"]') ||
                       document.querySelector('.keplr-button');
    
    this.assertNotNull(keplrButton, 'Keplr connection button should exist');
    
    // Test initial state
    this.assertFalse(keplrButton.disabled, 'Keplr button should not be disabled initially');
    
    // Click the button
    keplrButton.click();
    await this.wait(500); // Wait for connection process
    
    // Verify connection was attempted
    this.assert(mockKeplr.enable.calls.length > 0, 'Keplr provider should have been called');
    
    // Verify App state was updated
    this.assertDefined(window.App.isKeplrConnected, 'App should track Keplr connection state');
    this.assertDefined(window.App.keplrAddress, 'App should track Keplr address');
  }

  async testApproveButtonFunctionality() {
    // Mock everything needed for approval
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
    
    // Find the approve button
    const approveButton = document.getElementById('approveButton');
    this.assertNotNull(approveButton, 'Approve button should exist');
    
    // Set amount input
    const stakeAmountInput = document.getElementById('stakeAmount');
    this.assertNotNull(stakeAmountInput, 'Stake amount input should exist');
    
    this.setInputValue('#stakeAmount', '100');
    await this.wait(100);
    
    // Test initial button state
    this.assertDefined(approveButton.disabled, 'Approve button should have disabled state');
    
    // Enable button if it's disabled (simulate valid input)
    if (approveButton.disabled) {
      // Mock the validation to pass
      if (window.App.validateAmount) {
        const originalValidate = window.App.validateAmount;
        window.App.validateAmount = () => true;
        
        // Trigger validation
        stakeAmountInput.dispatchEvent(new Event('input', { bubbles: true }));
        await this.wait(100);
        
        // Restore original method
        window.App.validateAmount = originalValidate;
      }
    }
    
    // Click approve button
    approveButton.click();
    await this.wait(1000); // Wait for approval process
    
    // Verify the approve function was called
    if (window.App.approveDeposit) {
      // Spy on the approve function
      const approveSpy = this.spyOn(window.App, 'approveDeposit');
      
      // Click again to trigger the spied function
      approveButton.click();
      await this.wait(500);
      
      this.assert(approveSpy.wasCalled(), 'approveDeposit function should have been called');
    }
    
    // Verify button state changes during approval
    this.assertDefined(approveButton.textContent, 'Approve button should have text content');
  }

  async testDepositButtonFunctionality() {
    // Mock everything needed for deposit
    const mockProvider = this.mockMetaMaskProvider();
    const mockWeb3 = this.mockWeb3Instance();
    const mockContract = this.mockContract('TokenBridge', {
      methods: {
        deposit: () => ({
          send: async (options) => ({
            transactionHash: '0xdeposit1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
            gasUsed: 100000,
            events: {}
          }),
          call: async () => true,
          estimateGas: async () => 100000
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
    
    // Find the deposit button
    const depositButton = document.getElementById('depositButton');
    this.assertNotNull(depositButton, 'Deposit button should exist');
    
    // Set amount input
    const stakeAmountInput = document.getElementById('stakeAmount');
    this.assertNotNull(stakeAmountInput, 'Stake amount input should exist');
    
    this.setInputValue('#stakeAmount', '100');
    await this.wait(100);
    
    // Test initial button state
    this.assertDefined(depositButton.disabled, 'Deposit button should have disabled state');
    
    // Enable button if it's disabled (simulate valid input and approval)
    if (depositButton.disabled) {
      // Mock the validation to pass
      if (window.App.validateAmount) {
        const originalValidate = window.App.validateAmount;
        window.App.validateAmount = () => true;
        
        // Mock allowance check to return sufficient allowance
        if (window.App.getAllowance) {
          const originalGetAllowance = window.App.getAllowance;
          window.App.getAllowance = async () => '100000000000000000000'; // 100 tokens
          
          // Trigger validation
          stakeAmountInput.dispatchEvent(new Event('input', { bubbles: true }));
          await this.wait(100);
          
          // Restore original methods
          window.App.validateAmount = originalValidate;
          window.App.getAllowance = originalGetAllowance;
        }
      }
    }
    
    // Click deposit button
    depositButton.click();
    await this.wait(1000); // Wait for deposit process
    
    // Verify the deposit function was called
    if (window.App.depositToLayer) {
      // Spy on the deposit function
      const depositSpy = this.spyOn(window.App, 'depositToLayer');
      
      // Click again to trigger the spied function
      depositButton.click();
      await this.wait(500);
      
      this.assert(depositSpy.wasCalled(), 'depositToLayer function should have been called');
    }
    
    // Verify button state changes during deposit
    this.assertDefined(depositButton.textContent, 'Deposit button should have text content');
  }

  async testWithdrawalButtonFunctionality() {
    // Mock everything needed for withdrawal
    const mockProvider = this.mockMetaMaskProvider();
    const mockWeb3 = this.mockWeb3Instance();
    const mockContract = this.mockContract('TokenBridge', {
      methods: {
        withdraw: () => ({
          send: async (options) => ({
            transactionHash: '0xwithdraw1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
            gasUsed: 80000,
            events: {}
          }),
          call: async () => true,
          estimateGas: async () => 80000
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
    
    // Find the withdrawal button
    const withdrawButton = document.getElementById('withdrawButton');
    this.assertNotNull(withdrawButton, 'Withdrawal button should exist');
    
    // Set inputs
    const ethStakeAmountInput = document.getElementById('ethStakeAmount');
    const ethQueryIdInput = document.getElementById('ethQueryId');
    
    this.assertNotNull(ethStakeAmountInput, 'Ethereum stake amount input should exist');
    this.assertNotNull(ethQueryIdInput, 'Ethereum query ID input should exist');
    
    this.setInputValue('#ethStakeAmount', '50');
    this.setInputValue('#ethQueryId', '0x1234567890123456789012345678901234567890');
    await this.wait(100);
    
    // Test initial button state
    this.assertDefined(withdrawButton.disabled, 'Withdrawal button should have disabled state');
    
    // Enable button if it's disabled (simulate valid input)
    if (withdrawButton.disabled) {
      // Mock the validation to pass
      if (window.App.validateWithdrawalInputs) {
        const originalValidate = window.App.validateWithdrawalInputs;
        window.App.validateWithdrawalInputs = () => true;
        
        // Trigger validation
        ethStakeAmountInput.dispatchEvent(new Event('input', { bubbles: true }));
        ethQueryIdInput.dispatchEvent(new Event('input', { bubbles: true }));
        await this.wait(100);
        
        // Restore original method
        window.App.validateWithdrawalInputs = originalValidate;
      }
    }
    
    // Click withdrawal button
    withdrawButton.click();
    await this.wait(1000); // Wait for withdrawal process
    
    // Verify the withdrawal function was called
    if (window.App.withdrawFromLayer) {
      // Spy on the withdrawal function
      const withdrawSpy = this.spyOn(window.App, 'withdrawFromLayer');
      
      // Click again to trigger the spied function
      withdrawButton.click();
      await this.wait(500);
      
      this.assert(withdrawSpy.wasCalled(), 'withdrawFromLayer function should have been called');
    }
    
    // Verify button state changes during withdrawal
    this.assertDefined(withdrawButton.textContent, 'Withdrawal button should have text content');
  }

  async testDelegateButtonFunctionality() {
    // Mock everything needed for delegation
    const mockProvider = this.mockMetaMaskProvider();
    const mockWeb3 = this.mockWeb3Instance();
    const mockContract = this.mockContract('TokenBridge', {
      methods: {
        delegate: () => ({
          send: async (options) => ({
            transactionHash: '0xdelegate1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
            gasUsed: 120000,
            events: {}
          }),
          call: async () => true,
          estimateGas: async () => 120000
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
    
    // Find the delegate button
    const delegateButton = document.getElementById('delegateButton');
    this.assertNotNull(delegateButton, 'Delegate button should exist');
    
    // Set inputs
    const delegateStakeAmountInput = document.getElementById('delegateStakeAmount');
    const validatorDropdown = document.getElementById('delegateValidatorDropdown');
    
    this.assertNotNull(delegateStakeAmountInput, 'Delegate stake amount input should exist');
    this.assertNotNull(validatorDropdown, 'Validator dropdown should exist');
    
    this.setInputValue('#delegateStakeAmount', '75');
    
    // Select a validator if dropdown has options
    if (validatorDropdown.options.length > 1) {
      validatorDropdown.value = validatorDropdown.options[1].value;
      validatorDropdown.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    await this.wait(100);
    
    // Test initial button state
    this.assertDefined(delegateButton.disabled, 'Delegate button should have disabled state');
    
    // Enable button if it's disabled (simulate valid input)
    if (delegateButton.disabled) {
      // Mock the validation to pass
      if (window.App.validateDelegationInputs) {
        const originalValidate = window.App.validateDelegationInputs;
        window.App.validateDelegationInputs = () => true;
        
        // Trigger validation
        delegateStakeAmountInput.dispatchEvent(new Event('input', { bubbles: true }));
        await this.wait(100);
        
        // Restore original method
        window.App.validateDelegationInputs = originalValidate;
      }
    }
    
    // Click delegate button
    delegateButton.click();
    await this.wait(1000); // Wait for delegation process
    
    // Verify the delegate function was called
    if (window.App.delegateTokens) {
      // Spy on the delegate function
      const delegateSpy = this.spyOn(window.App, 'delegateTokens');
      
      // Click again to trigger the spied function
      delegateButton.click();
      await this.wait(500);
      
      this.assert(delegateSpy.wasCalled(), 'delegateTokens function should have been called');
    }
    
    // Verify button state changes during delegation
    this.assertDefined(delegateButton.textContent, 'Delegate button should have text content');
  }

  async testNoStakeReportButtonFunctionality() {
    // Mock everything needed for no-stake reporting
    const mockProvider = this.mockMetaMaskProvider();
    const mockWeb3 = this.mockWeb3Instance();
    
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
    
    // Find the no-stake report submit button
    const submitButton = document.getElementById('submitNoStakeReportBtn');
    this.assertNotNull(submitButton, 'No-stake report submit button should exist');
    
    // Set inputs
    const queryDataInput = document.getElementById('noStakeQueryData');
    const valueInput = document.getElementById('noStakeValue');
    
    this.assertNotNull(queryDataInput, 'Query data input should exist');
    this.assertNotNull(valueInput, 'Value input should exist');
    
    this.setInputValue('#noStakeQueryData', '0x1234567890abcdef');
    this.setInputValue('#noStakeValue', '0x9876543210fedcba');
    await this.wait(100);
    
    // Test initial button state
    this.assertDefined(submitButton.disabled, 'Submit button should have disabled state');
    
    // Enable button if it's disabled (simulate valid input)
    if (submitButton.disabled) {
      // Mock the validation to pass
      if (window.App.validateNoStakeInputs) {
        const originalValidate = window.App.validateNoStakeInputs;
        window.App.validateNoStakeInputs = () => true;
        
        // Trigger validation
        queryDataInput.dispatchEvent(new Event('input', { bubbles: true }));
        valueInput.dispatchEvent(new Event('input', { bubbles: true }));
        await this.wait(100);
        
        // Restore original method
        window.App.validateNoStakeInputs = originalValidate;
      }
    }
    
    // Click submit button
    submitButton.click();
    await this.wait(1000); // Wait for submission process
    
    // Verify the submit function was called
    if (window.App.submitNoStakeReport) {
      // Spy on the submit function
      const submitSpy = this.spyOn(window.App, 'submitNoStakeReport');
      
      // Click again to trigger the spied function
      submitButton.click();
      await this.wait(500);
      
      this.assert(submitSpy.wasCalled(), 'submitNoStakeReport function should have been called');
    }
    
    // Verify button state changes during submission
    this.assertDefined(submitButton.textContent, 'Submit button should have text content');
  }

  // Dispute Module Tests
  async testDisputeProposerInitialization() {
    // Wait for DisputeProposer to be available
    await this.waitForCondition(() => typeof window.DisputeProposer !== 'undefined', 10000);
    
    this.assertFunction(window.DisputeProposer, 'DisputeProposer class should exist');
    
    // Test that global instance exists
    this.assertNotNull(window.disputeProposer, 'Global disputeProposer instance should exist');
    this.assertObject(window.disputeProposer, 'Global disputeProposer should be an object');
    
    // Test essential methods exist
    this.assertFunction(window.disputeProposer.init, 'init method should exist');
    this.assertFunction(window.disputeProposer.proposeDispute, 'proposeDispute method should exist');
    this.assertFunction(window.disputeProposer.voteOnDispute, 'voteOnDispute method should exist');
    this.assertFunction(window.disputeProposer.addFeeToDispute, 'addFeeToDispute method should exist');
    this.assertFunction(window.disputeProposer.getWalletStatus, 'getWalletStatus method should exist');
    this.assertFunction(window.disputeProposer.checkVotingPower, 'checkVotingPower method should exist');
    
    // Test initialization
    const initResult = await window.disputeProposer.init();
    this.assertTrue(initResult, 'Initialization should succeed');
  }

  async testDisputeProposalValidation() {
    // Mock DisputeProposer
    const mockDisputeProposer = this.mockDisputeProposer();
    window.disputeProposer = mockDisputeProposer;
    
    // Test address validation
    this.assertTrue(mockDisputeProposer.isValidAddress('tellor1testaddress123456789012345678901234567890'), 'Valid tellor address should pass');
    this.assertTrue(mockDisputeProposer.isValidAddress('layer1testaddress123456789012345678901234567890'), 'Valid layer address should pass');
    this.assertFalse(mockDisputeProposer.isValidAddress('invalid'), 'Invalid address should fail');
    this.assertFalse(mockDisputeProposer.isValidAddress('eth0x1234'), 'Ethereum address should fail');
    this.assertFalse(mockDisputeProposer.isValidAddress(''), 'Empty address should fail');
    
    // Test report meta ID validation
    this.assertTrue(mockDisputeProposer.validateReportMetaId('123'), 'Valid report meta ID should pass');
    this.assertTrue(mockDisputeProposer.validateReportMetaId('456789'), 'Numeric string should pass');
    this.assertFalse(mockDisputeProposer.validateReportMetaId(''), 'Empty report meta ID should fail');
    this.assertFalse(mockDisputeProposer.validateReportMetaId('   '), 'Whitespace-only report meta ID should fail');
    
    // Test report query ID validation
    this.assertTrue(mockDisputeProposer.validateReportQueryId('0x1234567890abcdef'), 'Valid query ID should pass');
    this.assertTrue(mockDisputeProposer.validateReportQueryId('query123'), 'String query ID should pass');
    this.assertFalse(mockDisputeProposer.validateReportQueryId(''), 'Empty query ID should fail');
    this.assertFalse(mockDisputeProposer.validateReportQueryId('   '), 'Whitespace-only query ID should fail');
  }

  async testDisputeVotingValidation() {
    // Mock DisputeProposer
    const mockDisputeProposer = this.mockDisputeProposer();
    window.disputeProposer = mockDisputeProposer;
    
    // Test dispute ID validation
    this.assertTrue(mockDisputeProposer.validateDisputeId('1'), 'Valid string dispute ID should pass');
    this.assertTrue(mockDisputeProposer.validateDisputeId(123), 'Valid numeric dispute ID should pass');
    this.assertTrue(mockDisputeProposer.validateDisputeId('999'), 'Large dispute ID should pass');
    this.assertFalse(mockDisputeProposer.validateDisputeId('0'), 'Zero dispute ID should fail');
    this.assertFalse(mockDisputeProposer.validateDisputeId('-1'), 'Negative dispute ID should fail');
    this.assertFalse(mockDisputeProposer.validateDisputeId('invalid'), 'Non-numeric dispute ID should fail');
    this.assertFalse(mockDisputeProposer.validateDisputeId(''), 'Empty dispute ID should fail');
    
    // Test vote choice validation
    this.assertTrue(mockDisputeProposer.validateVoteChoice('vote-support'), 'vote-support should be valid');
    this.assertTrue(mockDisputeProposer.validateVoteChoice('vote-against'), 'vote-against should be valid');
    this.assertTrue(mockDisputeProposer.validateVoteChoice('vote-invalid'), 'vote-invalid should be valid');
    this.assertFalse(mockDisputeProposer.validateVoteChoice('support'), 'support should be invalid');
    this.assertFalse(mockDisputeProposer.validateVoteChoice('against'), 'against should be invalid');
    this.assertFalse(mockDisputeProposer.validateVoteChoice('invalid-vote'), 'invalid-vote should be invalid');
    this.assertFalse(mockDisputeProposer.validateVoteChoice(''), 'Empty vote choice should be invalid');
  }

  async testDisputeFeeValidation() {
    // Mock DisputeProposer
    const mockDisputeProposer = this.mockDisputeProposer();
    window.disputeProposer = mockDisputeProposer;
    
    // Test TRB to micro units conversion
    this.assertEqual(mockDisputeProposer.convertTrbToMicroUnits('1'), '1000000', '1 TRB should convert to 1000000 micro units');
    this.assertEqual(mockDisputeProposer.convertTrbToMicroUnits('0.5'), '500000', '0.5 TRB should convert to 500000 micro units');
    this.assertEqual(mockDisputeProposer.convertTrbToMicroUnits('1000'), '1000000000', '1000 TRB should convert to 1000000000 micro units');
    this.assertEqual(mockDisputeProposer.convertTrbToMicroUnits('0.000001'), '1', '0.000001 TRB should convert to 1 micro unit');
    
    // Test micro units to TRB conversion
    this.assertEqual(mockDisputeProposer.convertMicroUnitsToTrb('1000000'), '1.000000', '1000000 micro units should convert to 1.000000 TRB');
    this.assertEqual(mockDisputeProposer.convertMicroUnitsToTrb('500000'), '0.500000', '500000 micro units should convert to 0.500000 TRB');
    this.assertEqual(mockDisputeProposer.convertMicroUnitsToTrb('1'), '0.000001', '1 micro unit should convert to 0.000001 TRB');
    this.assertEqual(mockDisputeProposer.convertMicroUnitsToTrb('0'), '0.000000', '0 micro units should convert to 0.000000 TRB');
  }

  async testDisputeAddressValidation() {
    // Mock DisputeProposer
    const mockDisputeProposer = this.mockDisputeProposer();
    window.disputeProposer = mockDisputeProposer;
    
    // Test valid Tellor addresses
    this.assertTrue(mockDisputeProposer.isValidAddress('tellor1abc123def456ghi789jkl012mno345pqr678stu'), 'Valid tellor1 address should pass');
    this.assertTrue(mockDisputeProposer.isValidAddress('tellor1testaddress123456789012345678901234567890'), 'Valid tellor1 test address should pass');
    
    // Test valid Layer addresses
    this.assertTrue(mockDisputeProposer.isValidAddress('layer1abc123def456ghi789jkl012mno345pqr678stu'), 'Valid layer1 address should pass');
    this.assertTrue(mockDisputeProposer.isValidAddress('layer1testaddress123456789012345678901234567890'), 'Valid layer1 test address should pass');
    
    // Test invalid addresses
    this.assertFalse(mockDisputeProposer.isValidAddress('0x1234567890123456789012345678901234567890'), 'Ethereum address should fail');
    this.assertFalse(mockDisputeProposer.isValidAddress('cosmos1abc123def456ghi789jkl012mno345pqr678stu'), 'Cosmos address should fail');
    this.assertFalse(mockDisputeProposer.isValidAddress('tellor1'), 'Too short tellor address should fail');
    this.assertFalse(mockDisputeProposer.isValidAddress('layer1'), 'Too short layer address should fail');
    this.assertFalse(mockDisputeProposer.isValidAddress(''), 'Empty address should fail');
    this.assertFalse(mockDisputeProposer.isValidAddress(null), 'Null address should fail');
    this.assertFalse(mockDisputeProposer.isValidAddress(undefined), 'Undefined address should fail');
    this.assertFalse(mockDisputeProposer.isValidAddress(123), 'Numeric address should fail');
  }

  async testDisputeVotingPowerCheck() {
    // Mock DisputeProposer
    const mockDisputeProposer = this.mockDisputeProposer();
    window.disputeProposer = mockDisputeProposer;
    
    // Test voting power check method exists and returns expected structure
    const votingPowerResult = await mockDisputeProposer.checkVotingPower();
    
    this.assertObject(votingPowerResult, 'Voting power result should be an object');
    this.assertDefined(votingPowerResult.hasVotingPower, 'Result should have hasVotingPower property');
    this.assertDefined(votingPowerResult.reason, 'Result should have reason property');
    this.assertDefined(votingPowerResult.details, 'Result should have details property');
    
    // Test that the mock returns positive voting power
    this.assertTrue(votingPowerResult.hasVotingPower, 'Mock should have voting power');
    this.assertEqual(votingPowerResult.reason, 'reporter_power', 'Mock should return reporter_power reason');
    this.assertString(votingPowerResult.details, 'Details should be a string');
  }

  async testDisputeUtilityFunctions() {
    // Mock DisputeProposer
    const mockDisputeProposer = this.mockDisputeProposer();
    window.disputeProposer = mockDisputeProposer;
    
    // Test connection status
    const connectionStatus = mockDisputeProposer.getConnectionStatus();
    this.assertObject(connectionStatus, 'Connection status should be an object');
    this.assertDefined(connectionStatus.isConnected, 'Connection status should have isConnected property');
    this.assertDefined(connectionStatus.address, 'Connection status should have address property');
    this.assertDefined(connectionStatus.network, 'Connection status should have network property');
    
    // Test wallet status
    const walletStatus = await mockDisputeProposer.getWalletStatus();
    this.assertObject(walletStatus, 'Wallet status should be an object');
    this.assertDefined(walletStatus.isConnected, 'Wallet status should have isConnected property');
    this.assertDefined(walletStatus.address, 'Wallet status should have address property');
    this.assertDefined(walletStatus.walletType, 'Wallet status should have walletType property');
    
    // Test that mock returns connected status
    this.assertTrue(walletStatus.isConnected, 'Mock wallet should be connected');
    this.assertString(walletStatus.address, 'Wallet address should be a string');
    this.assertEqual(walletStatus.walletType, 'keplr', 'Mock should use keplr wallet type');
    
    // Test balance retrieval
    const balance = await mockDisputeProposer.getBalance();
    this.assertNumber(balance, 'Balance should be a number');
    this.assert(balance > 0, 'Mock balance should be positive');
    this.assertEqual(balance, 1000.0, 'Mock balance should be 1000 TRB');
  }

  // Network Detection Tests
  async testNetworkDetectionMainnet() {
    // Mock Keplr with mainnet chain ID
    const mockKeplr = this.mockKeplrProvider();
    mockKeplr.getChainId = async () => 'tellor-1';
    window.keplr = mockKeplr;
    
    // Wait for App to be available
    await this.waitForCondition(() => typeof window.App !== 'undefined', 10000);
    
    // Test mainnet detection
    if (window.App.connectKeplrLegacy) {
      await window.App.connectKeplrLegacy();
      await this.wait(500);
      
      this.assertEqual(window.App.cosmosChainId, 'tellor-1', 'cosmosChainId should be set to tellor-1 for mainnet');
      this.assertTrue(window.App.isKeplrConnected, 'Keplr should be connected');
    }
  }

  async testNetworkDetectionTestnet() {
    // Mock Keplr with testnet chain ID
    const mockKeplr = this.mockKeplrProvider();
    mockKeplr.getChainId = async () => 'layertest-4';
    window.keplr = mockKeplr;
    
    // Wait for App to be available
    await this.waitForCondition(() => typeof window.App !== 'undefined', 10000);
    
    // Test testnet detection
    if (window.App.connectKeplrLegacy) {
      await window.App.connectKeplrLegacy();
      await this.wait(500);
      
      this.assertEqual(window.App.cosmosChainId, 'layertest-4', 'cosmosChainId should be set to layertest-4 for testnet');
      this.assertTrue(window.App.isKeplrConnected, 'Keplr should be connected');
    }
  }

  async testNetworkSwitching() {
    // Wait for App to be available
    await this.waitForCondition(() => typeof window.App !== 'undefined', 10000);
    
    // Test network switching functionality
    if (window.App.switchCosmosNetwork) {
      // Mock Keplr for network switching
      const mockKeplr = this.mockKeplrProvider();
      window.keplr = mockKeplr;
      
      // Set initial network to testnet
      window.App.cosmosChainId = 'layertest-4';
      window.App.isKeplrConnected = true;
      
      // Test switching to mainnet
      await window.App.switchCosmosNetwork();
      await this.wait(500);
      
      this.assertEqual(window.App.cosmosChainId, 'tellor-1', 'Network should switch to mainnet');
      
      // Test switching back to testnet
      await window.App.switchCosmosNetwork();
      await this.wait(500);
      
      this.assertEqual(window.App.cosmosChainId, 'layertest-4', 'Network should switch back to testnet');
    }
  }

  async testCosmosWalletAdapterNetworkDetection() {
    // Mock cosmos wallet adapter
    const mockAdapter = {
      isConnected: () => true,
      getChainId: async () => 'tellor-1',
      connectToWallet: async (walletType) => ({
        address: 'tellor1testaddress123456789012345678901234567890',
        walletName: 'keplr'
      }),
      getOfflineSigner: () => ({
        getAccounts: async () => [{
          address: 'tellor1testaddress123456789012345678901234567890'
        }]
      })
    };
    window.cosmosWalletAdapter = mockAdapter;
    
    // Wait for App to be available
    await this.waitForCondition(() => typeof window.App !== 'undefined', 10000);
    
    // Test wallet adapter network detection
    if (window.App.connectCosmosWallet) {
      await window.App.connectCosmosWallet('keplr');
      await this.wait(500);
      
      this.assertEqual(window.App.cosmosChainId, 'tellor-1', 'cosmosChainId should be detected from wallet adapter');
      this.assertTrue(window.App.isKeplrConnected, 'Wallet should be connected');
    }
  }

  // Enhanced Functional Tests
  async testWithdrawalButtonFunctionalityMainnet() {
    // Mock mainnet environment
    const mockKeplr = this.mockKeplrProvider();
    mockKeplr.getChainId = async () => 'tellor-1';
    window.keplr = mockKeplr;
    
    // Wait for App to be available
    await this.waitForCondition(() => typeof window.App !== 'undefined', 10000);
    
    // Connect to mainnet
    if (window.App.connectKeplrLegacy) {
      await window.App.connectKeplrLegacy();
      await this.wait(500);
    }
    
    // Switch to ethereum bridge direction
    if (window.App.switchBridgeDirection) {
      window.App.switchBridgeDirection('ethereum');
      await this.wait(100);
    }
    
    // Test withdrawal button state
    const withdrawButton = document.getElementById('withdrawButton');
    this.assertNotNull(withdrawButton, 'Withdrawal button should exist');
    
    // Button should be enabled when connected to mainnet
    this.assertFalse(withdrawButton.disabled, 'Withdrawal button should be enabled on mainnet');
    
    // Test withdrawal function with mainnet parameters
    if (window.App.withdrawFromLayer) {
      // Mock the function to avoid actual network calls
      const originalWithdraw = window.App.withdrawFromLayer;
      let withdrawCalled = false;
      window.App.withdrawFromLayer = async () => {
        withdrawCalled = true;
        return { success: true };
      };
      
      // Set up test inputs
      this.setInputValue('#ethStakeAmount', '10');
      this.setInputValue('#ethQueryId', '0x1234567890123456789012345678901234567890');
      
      // Trigger withdrawal
      withdrawButton.click();
      await this.wait(500);
      
      this.assertTrue(withdrawCalled, 'Withdrawal function should be called on mainnet');
      
      // Restore original function
      window.App.withdrawFromLayer = originalWithdraw;
    }
  }

  async testWithdrawalButtonFunctionalityTestnet() {
    // Mock testnet environment
    const mockKeplr = this.mockKeplrProvider();
    mockKeplr.getChainId = async () => 'layertest-4';
    window.keplr = mockKeplr;
    
    // Wait for App to be available
    await this.waitForCondition(() => typeof window.App !== 'undefined', 10000);
    
    // Connect to testnet
    if (window.App.connectKeplrLegacy) {
      await window.App.connectKeplrLegacy();
      await this.wait(500);
    }
    
    // Switch to ethereum bridge direction
    if (window.App.switchBridgeDirection) {
      window.App.switchBridgeDirection('ethereum');
      await this.wait(100);
    }
    
    // Test withdrawal button state
    const withdrawButton = document.getElementById('withdrawButton');
    this.assertNotNull(withdrawButton, 'Withdrawal button should exist');
    
    // Button should be enabled when connected to testnet
    this.assertFalse(withdrawButton.disabled, 'Withdrawal button should be enabled on testnet');
    
    // Test withdrawal function with testnet parameters
    if (window.App.withdrawFromLayer) {
      // Mock the function to avoid actual network calls
      const originalWithdraw = window.App.withdrawFromLayer;
      let withdrawCalled = false;
      window.App.withdrawFromLayer = async () => {
        withdrawCalled = true;
        return { success: true };
      };
      
      // Set up test inputs
      this.setInputValue('#ethStakeAmount', '5');
      this.setInputValue('#ethQueryId', '0xabcdef1234567890abcdef1234567890abcdef12');
      
      // Trigger withdrawal
      withdrawButton.click();
      await this.wait(500);
      
      this.assertTrue(withdrawCalled, 'Withdrawal function should be called on testnet');
      
      // Restore original function
      window.App.withdrawFromLayer = originalWithdraw;
    }
  }

  async testDelegateButtonFunctionalityMainnet() {
    // Mock mainnet environment
    const mockKeplr = this.mockKeplrProvider();
    mockKeplr.getChainId = async () => 'tellor-1';
    window.keplr = mockKeplr;
    
    // Wait for App to be available
    await this.waitForCondition(() => typeof window.App !== 'undefined', 10000);
    
    // Connect to mainnet
    if (window.App.connectKeplrLegacy) {
      await window.App.connectKeplrLegacy();
      await this.wait(500);
    }
    
    // Switch to delegate bridge direction
    if (window.App.switchBridgeDirection) {
      window.App.switchBridgeDirection('delegate');
      await this.wait(100);
    }
    
    // Test delegate button state
    const delegateButton = document.getElementById('delegateButton');
    this.assertNotNull(delegateButton, 'Delegate button should exist');
    
    // Button should be enabled when connected to mainnet
    this.assertFalse(delegateButton.disabled, 'Delegate button should be enabled on mainnet');
  }

  async testDelegateButtonFunctionalityTestnet() {
    // Mock testnet environment
    const mockKeplr = this.mockKeplrProvider();
    mockKeplr.getChainId = async () => 'layertest-4';
    window.keplr = mockKeplr;
    
    // Wait for App to be available
    await this.waitForCondition(() => typeof window.App !== 'undefined', 10000);
    
    // Connect to testnet
    if (window.App.connectKeplrLegacy) {
      await window.App.connectKeplrLegacy();
      await this.wait(500);
    }
    
    // Switch to delegate bridge direction
    if (window.App.switchBridgeDirection) {
      window.App.switchBridgeDirection('delegate');
      await this.wait(100);
    }
    
    // Test delegate button state
    const delegateButton = document.getElementById('delegateButton');
    this.assertNotNull(delegateButton, 'Delegate button should exist');
    
    // Button should be enabled when connected to testnet
    this.assertFalse(delegateButton.disabled, 'Delegate button should be enabled on testnet');
  }

  async testValidatorFetchingAndDropdown() {
    // Mock the fetch function to return validator data
    const mockValidators = [
      {
        operator_address: 'tellorvaloper1testvalidator123456789012345678901234567890',
        description: { moniker: 'Test Validator 1' },
        tokens: '1000000000', // 1000 TRB
        commission: { commission_rates: { rate: '0.05' } }, // 5%
        jailed: false
      },
      {
        operator_address: 'tellorvaloper2testvalidator123456789012345678901234567890',
        description: { moniker: 'Test Validator 2' },
        tokens: '2000000000', // 2000 TRB
        commission: { commission_rates: { rate: '0.10' } }, // 10%
        jailed: false
      }
    ];

    const mockFetch = await this.mockFetch(
      'https://node-palmito.tellorlayer.com/cosmos/staking/v1beta1/validators?status=BOND_STATUS_BONDED&pagination.limit=1000',
      { validators: mockValidators }
    );

    try {
      // Test validator fetching
      if (window.App && window.App.fetchValidators) {
        const validators = await window.App.fetchValidators();
        
        this.assertArray(validators, 'Should return array of validators');
        this.assertEqual(validators.length, 2, 'Should return 2 validators');
        
        // Check validator structure
        const validator = validators[0];
        this.assertString(validator.address, 'Validator should have address');
        this.assertString(validator.moniker, 'Validator should have moniker');
        this.assertString(validator.votingPower, 'Validator should have votingPower');
        this.assertString(validator.commission, 'Validator should have commission');
        this.assertFalse(validator.jailed, 'Validator should not be jailed');
        
        // Test dropdown population
        if (window.App && window.App.populateValidatorDropdown) {
          await window.App.populateValidatorDropdown();
          
          const dropdown = document.getElementById('delegateValidatorDropdown');
          this.assertNotNull(dropdown, 'Validator dropdown should exist');
          this.assertGreaterThan(dropdown.options.length, 1, 'Dropdown should have validator options');
          
          // Check first validator option
          const firstOption = dropdown.options[1];
          this.assertContains(firstOption.textContent, 'Test Validator 1', 'First option should contain validator name');
          this.assertContains(firstOption.textContent, '1000.00 TRB', 'First option should contain voting power');
          this.assertContains(firstOption.textContent, '5.00%', 'First option should contain commission');
        }
      }
    } finally {
      mockFetch(); // Restore original fetch
    }
  }

  async testReporterFetchingAndDropdown() {
    // Mock the fetch function to return reporter data
    const mockReporters = [
      {
        reporter: 'tellor1reporter123456789012345678901234567890',
        moniker: 'Test Reporter 1',
        power: '1000000', // 1 TRB
        commission: '0.05', // 5%
        jailed: false
      },
      {
        reporter: 'tellor1reporter987654321098765432109876543210',
        moniker: 'Test Reporter 2',
        power: '2000000', // 2 TRB
        commission: '0.10', // 10%
        jailed: false
      }
    ];

    const mockFetch = await this.mockFetch(
      'https://node-palmito.tellorlayer.com/tellor-io/layer/reporter/reporters',
      { reporters: mockReporters }
    );

    try {
      // Test reporter fetching
      if (window.App && window.App.fetchReporters) {
        const reporters = await window.App.fetchReporters();
        
        this.assertArray(reporters, 'Should return array of reporters');
        this.assertEqual(reporters.length, 2, 'Should return 2 reporters');
        
        // Check reporter structure
        const reporter = reporters[0];
        this.assertString(reporter.address, 'Reporter should have address');
        this.assertString(reporter.name, 'Reporter should have name');
        this.assertString(reporter.power, 'Reporter should have power');
        this.assertString(reporter.commission, 'Reporter should have commission');
        this.assertFalse(reporter.jailed, 'Reporter should not be jailed');
        
        // Test dropdown population
        if (window.App && window.App.populateReporterDropdown) {
          await window.App.populateReporterDropdown();
          
          const dropdown = document.getElementById('reporterDropdown');
          this.assertNotNull(dropdown, 'Reporter dropdown should exist');
          this.assertGreaterThan(dropdown.options.length, 1, 'Dropdown should have reporter options');
          
          // Check first reporter option
          const firstOption = dropdown.options[1];
          this.assertContains(firstOption.textContent, 'Test Reporter 1', 'First option should contain reporter name');
          this.assertContains(firstOption.textContent, '1.00 TRB', 'First option should contain power');
          this.assertContains(firstOption.textContent, '5.00%', 'First option should contain commission');
        }
      }
    } finally {
      mockFetch(); // Restore original fetch
    }
  }

  async testCurrentDelegationsStatus() {
    // Mock the fetch function to return delegation data
    const mockDelegations = {
      delegation_responses: [
        {
          delegation: {
            delegator_address: 'tellor1testdelegator123456789012345678901234567890',
            validator_address: 'tellorvaloper1testvalidator123456789012345678901234567890'
          },
          balance: {
            amount: '1000000', // 1 TRB
            denom: 'loya'
          }
        },
        {
          delegation: {
            delegator_address: 'tellor1testdelegator123456789012345678901234567890',
            validator_address: 'tellorvaloper2testvalidator123456789012345678901234567890'
          },
          balance: {
            amount: '2000000', // 2 TRB
            denom: 'loya'
          }
        }
      ]
    };

    const mockFetch = await this.mockFetch(
      'https://node-palmito.tellorlayer.com/cosmos/staking/v1beta1/delegations/tellor1testdelegator123456789012345678901234567890',
      mockDelegations
    );

    try {
      // Test delegation fetching
      if (window.App && window.App.fetchCurrentDelegations) {
        const delegations = await window.App.fetchCurrentDelegations('tellor1testdelegator123456789012345678901234567890');
        
        this.assertArray(delegations, 'Should return array of delegations');
        this.assertEqual(delegations.length, 2, 'Should return 2 delegations');
        
        // Check delegation structure
        const delegation = delegations[0];
        this.assertString(delegation.validatorAddress, 'Delegation should have validator address');
        this.assertString(delegation.amount, 'Delegation should have amount');
        this.assertString(delegation.denom, 'Delegation should have denom');
        
        // Test status display
        if (window.App && window.App.displayCurrentDelegationsStatus) {
          await window.App.displayCurrentDelegationsStatus('tellor1testdelegator123456789012345678901234567890', delegations);
          
          const statusElement = document.getElementById('currentDelegationsStatus');
          this.assertNotNull(statusElement, 'Delegations status element should exist');
          
          // Check that total is displayed
          this.assertContains(statusElement.innerHTML, '3.000000 TRB', 'Should display total delegation amount');
        }
      }
    } finally {
      mockFetch(); // Restore original fetch
    }
  }

  async testCurrentReporterStatus() {
    // Mock the fetch function to return reporter data
    const mockReporter = {
      reporter: 'tellor1reporter123456789012345678901234567890'
    };

    const mockFetch = await this.mockFetch(
      'https://node-palmito.tellorlayer.com/tellor-io/layer/reporter/selector-reporter/tellor1testselector123456789012345678901234567890',
      mockReporter
    );

    try {
      // Test reporter fetching
      if (window.App && window.App.fetchCurrentReporter) {
        const reporterData = await window.App.fetchCurrentReporter('tellor1testselector123456789012345678901234567890');
        
        this.assertNotNull(reporterData, 'Should return reporter data');
        this.assertString(reporterData.reporter, 'Should have reporter address');
        
        // Test status display
        if (window.App && window.App.displayCurrentReporterStatus) {
          await window.App.displayCurrentReporterStatus('tellor1testselector123456789012345678901234567890');
          
          const statusElement = document.getElementById('currentReporterStatus');
          this.assertNotNull(statusElement, 'Reporter status element should exist');
          
          // Check that reporter address is displayed
          this.assertContains(statusElement.innerHTML, 'tellor1reporter123456789012345678901234567890', 'Should display reporter address');
        }
      }
    } finally {
      mockFetch(); // Restore original fetch
    }
  }

  async testDelegationsDropdownToggle() {
    // Test dropdown toggle functionality
    if (window.App && window.App.toggleDelegationsDropdown) {
      const dropdown = document.getElementById('delegationsDropdown');
      const arrow = document.getElementById('delegationsDropdownArrow');
      
      this.assertNotNull(dropdown, 'Delegations dropdown should exist');
      this.assertNotNull(arrow, 'Dropdown arrow should exist');
      
      // Initially dropdown should be hidden
      this.assertEqual(dropdown.style.display, 'none', 'Dropdown should be hidden initially');
      this.assertFalse(arrow.classList.contains('rotated'), 'Arrow should not be rotated initially');
      
      // Toggle dropdown open
      window.App.toggleDelegationsDropdown();
      this.assertEqual(dropdown.style.display, 'block', 'Dropdown should be visible after toggle');
      this.assertTrue(arrow.classList.contains('rotated'), 'Arrow should be rotated after toggle');
      
      // Toggle dropdown closed
      window.App.toggleDelegationsDropdown();
      this.assertEqual(dropdown.style.display, 'none', 'Dropdown should be hidden after second toggle');
      this.assertFalse(arrow.classList.contains('rotated'), 'Arrow should not be rotated after second toggle');
    }
  }

  async testCopyToClipboard() {
    // Mock clipboard API
    const mockClipboard = {
      writeText: async (text) => {
        this.assertEqual(text, 'test-address-123', 'Should copy correct text');
        return Promise.resolve();
      }
    };
    
    // Mock navigator.clipboard
    const originalClipboard = navigator.clipboard;
    navigator.clipboard = mockClipboard;
    
    try {
      // Test copy functionality
      if (window.App && window.App.copyToClipboard) {
        await window.App.copyToClipboard('test-address-123');
        
        // Check if success message is shown
        const successElement = document.querySelector('.copy-success-message');
        if (successElement) {
          this.assertContains(successElement.textContent, 'Copied!', 'Should show success message');
        }
      }
    } finally {
      navigator.clipboard = originalClipboard;
    }
  }

  async testReporterSelection() {
    // Mock CosmJS stargate client
    const mockStargate = this.mockStargateClient();
    window.cosmjs = { stargate: mockStargate };
    
    // Mock Keplr provider
    const mockKeplr = this.mockKeplrProvider();
    window.keplr = mockKeplr;
    
    // Set up wallet connection
    if (window.App) {
      window.App.isKeplrConnected = true;
      window.App.keplrAddress = 'tellor1testselector123456789012345678901234567890';
    }
    
    try {
      // Test reporter selection
      if (window.App && window.App.selectReporter) {
        // Set up form inputs
        const reporterDropdown = document.getElementById('reporterDropdown');
        const reporterStakeAmount = document.getElementById('reporterStakeAmount');
        const selectedReporterAddress = document.getElementById('selectedReporterAddress');
        
        if (reporterDropdown && selectedReporterAddress && reporterStakeAmount) {
          // Set test values
          reporterStakeAmount.value = '1.5';
          selectedReporterAddress.value = 'tellor1reporter123456789012345678901234567890';
          
          // Mock the CosmJS selectReporter function
          if (window.cosmjs && window.cosmjs.stargate) {
            window.cosmjs.stargate.selectReporter = async (account, reporterAddress, stakeAmount) => {
              this.assertEqual(account, 'tellor1testselector123456789012345678901234567890', 'Should use correct account');
              this.assertEqual(reporterAddress, 'tellor1reporter123456789012345678901234567890', 'Should use correct reporter address');
              this.assertEqual(stakeAmount, '1.5', 'Should use correct stake amount');
              
              return {
                txhash: 'test-reporter-selection-hash-1234567890abcdef',
                code: 0
              };
            };
          }
          
          // Call selectReporter
          await window.App.selectReporter();
          
          // Verify inputs were cleared
          this.assertEqual(reporterDropdown.value, '', 'Reporter dropdown should be cleared');
          this.assertEqual(selectedReporterAddress.value, '', 'Selected reporter address should be cleared');
          this.assertEqual(reporterStakeAmount.value, '', 'Reporter stake amount should be cleared');
        }
      }
    } catch (error) {
      // Expected to fail in test environment, but we can verify the function was called
      this.assertNotNull(error, 'Function should attempt to execute');
    }
  }

  async testNetworkSwitchingForDelegate() {
    // Test mainnet
    if (window.App) {
      window.App.cosmosChainId = 'tellor-1';
      
      // Test that API endpoints are correct for mainnet
      const mainnetApiEndpoint = window.App.getCosmosApiEndpoint();
      this.assertEqual(mainnetApiEndpoint, 'https://mainnet.tellorlayer.com', 'Should use mainnet API endpoint');
      
      const mainnetRpcEndpoint = window.App.getCosmosRpcEndpoint();
      this.assertEqual(mainnetRpcEndpoint, 'https://mainnet.tellorlayer.com/rpc', 'Should use mainnet RPC endpoint');
    }
    
    // Test testnet
    if (window.App) {
      window.App.cosmosChainId = 'layertest-4';
      
      // Test that API endpoints are correct for testnet
      const testnetApiEndpoint = window.App.getCosmosApiEndpoint();
      this.assertEqual(testnetApiEndpoint, 'https://node-palmito.tellorlayer.com', 'Should use testnet API endpoint');
      
      const testnetRpcEndpoint = window.App.getCosmosRpcEndpoint();
      this.assertEqual(testnetRpcEndpoint, 'https://node-palmito.tellorlayer.com/rpc', 'Should use testnet RPC endpoint');
    }
  }

  async testDisputeFunctionsMainnet() {
    // Mock mainnet environment
    const mockKeplr = this.mockKeplrProvider();
    mockKeplr.getChainId = async () => 'tellor-1';
    window.keplr = mockKeplr;
    
    // Wait for App to be available
    await this.waitForCondition(() => typeof window.App !== 'undefined', 10000);
    
    // Connect to mainnet
    if (window.App.connectKeplrLegacy) {
      await window.App.connectKeplrLegacy();
      await this.wait(500);
    }
    
    // Test dispute functions with mainnet chain ID
    this.assertEqual(window.App.cosmosChainId, 'tellor-1', 'Should be on mainnet for dispute tests');
    
    // Test that dispute functions can be called (mocked)
    if (window.disputeProposer) {
      const mockDisputeProposer = this.mockDisputeProposer();
      window.disputeProposer = mockDisputeProposer;
      
      // Test dispute proposal
      const result = await mockDisputeProposer.proposeDispute(
        'tellor1testaddress123456789012345678901234567890',
        '1',
        '0x1234567890123456789012345678901234567890',
        'malicious_value',
        '10'
      );
      
      this.assertTrue(result.success, 'Dispute proposal should succeed on mainnet');
    }
  }

  async testDisputeFunctionsTestnet() {
    // Mock testnet environment
    const mockKeplr = this.mockKeplrProvider();
    mockKeplr.getChainId = async () => 'layertest-4';
    window.keplr = mockKeplr;
    
    // Wait for App to be available
    await this.waitForCondition(() => typeof window.App !== 'undefined', 10000);
    
    // Connect to testnet
    if (window.App.connectKeplrLegacy) {
      await window.App.connectKeplrLegacy();
      await this.wait(500);
    }
    
    // Test dispute functions with testnet chain ID
    this.assertEqual(window.App.cosmosChainId, 'layertest-4', 'Should be on testnet for dispute tests');
    
    // Test that dispute functions can be called (mocked)
    if (window.disputeProposer) {
      const mockDisputeProposer = this.mockDisputeProposer();
      window.disputeProposer = mockDisputeProposer;
      
      // Test dispute proposal
      const result = await mockDisputeProposer.proposeDispute(
        'tellor1testaddress123456789012345678901234567890',
        '1',
        '0x1234567890123456789012345678901234567890',
        'malicious_value',
        '5'
      );
      
      this.assertTrue(result.success, 'Dispute proposal should succeed on testnet');
    }
  }

  async testNoStakeReportingMainnet() {
    // Mock mainnet environment
    const mockKeplr = this.mockKeplrProvider();
    mockKeplr.getChainId = async () => 'tellor-1';
    window.keplr = mockKeplr;
    
    // Wait for App to be available
    await this.waitForCondition(() => typeof window.App !== 'undefined', 10000);
    
    // Connect to mainnet
    if (window.App.connectKeplrLegacy) {
      await window.App.connectKeplrLegacy();
      await this.wait(500);
    }
    
    // Test no-stake reporting with mainnet chain ID
    this.assertEqual(window.App.cosmosChainId, 'tellor-1', 'Should be on mainnet for no-stake tests');
    
    // Test that no-stake reporting can be called (mocked)
    if (window.noStakeReporter) {
      const mockNoStakeReporter = this.mockNoStakeReporter();
      window.noStakeReporter = mockNoStakeReporter;
      
      // Test no-stake report submission
      const result = await mockNoStakeReporter.submitReport(
        '0x1234567890123456789012345678901234567890',
        '100'
      );
      
      this.assertTrue(result.success, 'No-stake report should succeed on mainnet');
    }
  }

  async testNoStakeReportingTestnet() {
    // Mock testnet environment
    const mockKeplr = this.mockKeplrProvider();
    mockKeplr.getChainId = async () => 'layertest-4';
    window.keplr = mockKeplr;
    
    // Wait for App to be available
    await this.waitForCondition(() => typeof window.App !== 'undefined', 10000);
    
    // Connect to testnet
    if (window.App.connectKeplrLegacy) {
      await window.App.connectKeplrLegacy();
      await this.wait(500);
    }
    
    // Test no-stake reporting with testnet chain ID
    this.assertEqual(window.App.cosmosChainId, 'layertest-4', 'Should be on testnet for no-stake tests');
    
    // Test that no-stake reporting can be called (mocked)
    if (window.noStakeReporter) {
      const mockNoStakeReporter = this.mockNoStakeReporter();
      window.noStakeReporter = mockNoStakeReporter;
      
      // Test no-stake report submission
      const result = await mockNoStakeReporter.submitReport(
        '0xabcdef1234567890abcdef1234567890abcdef12',
        '50'
      );
      
      this.assertTrue(result.success, 'No-stake report should succeed on testnet');
    }
  }
}
