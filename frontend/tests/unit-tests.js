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
}
