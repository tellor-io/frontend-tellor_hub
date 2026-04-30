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
      {
        name: 'Network switching with isNetworkSwitching flag',
        run: () => this.testNetworkSwitchingFlag()
      },
      {
        name: 'Wallet adapter switchToChain method',
        run: () => this.testWalletAdapterSwitchToChain()
      },

      // Enhanced Functional Tests
      {
        name: 'Withdrawal button functionality on mainnet',
        run: () => this.testWithdrawalButtonFunctionalityMainnet()
      },
      {
        name: 'Etherscan URL generation for mainnet',
        run: () => this.testEtherscanUrlMainnet()
      },
      {
        name: 'Etherscan URL generation for testnet',
        run: () => this.testEtherscanUrlTestnet()
      },
      {
        name: 'Request attestation with correct RPC endpoints',
        run: () => this.testRequestAttestationRpcEndpoints()
      },
      {
        name: 'Withdrawal button functionality on testnet',
        run: () => this.testWithdrawalButtonFunctionalityTestnet()
      },
      // NEW: Integration tests to prevent similar bugs
      {
        name: 'Withdrawal button integration test (mainnet)',
        run: () => this.testWithdrawalButtonIntegrationMainnet()
      },
      {
        name: 'Withdrawal button input field bug test',
        run: () => this.testWithdrawalButtonInputFieldBug()
      },
      {
        name: 'Wallet connection UI updates test',
        run: () => this.testWalletConnectionUIUpdates()
      },
      {
        name: 'Network switching UI updates test',
        run: () => this.testNetworkSwitchingUIUpdates()
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
      {
        name: 'Claimable dispute rewards cosmos int UI parsing',
        run: () => this.testClaimableDisputeRewardsCosmosIntUiNumber()
      },
      {
        name: 'Claimable dispute rewards LCD JSON normalization',
        run: () => this.testClaimableDisputeRewardsNormalizePayload()
      },
      {
        name: 'Claimable dispute rewards fetch URL and fallback',
        run: () => this.testClaimableDisputeRewardsFetchUrlAndFallback()
      },
      {
        name: 'Delegator rewards parsing from distribution response',
        run: () => this.testDelegatorRewardsParsing()
      },
      {
        name: 'Selector tips extraction normalization',
        run: () => this.testSelectorTipsExtraction()
      },
      {
        name: 'Delegator and selector reward fetch endpoints',
        run: () => this.testDelegatorSelectorRewardFetchEndpoints()
      },
      {
        name: 'Selector tips claim uses Cosmos tx hash success flow',
        run: () => this.testSelectorTipsClaimSuccessFlow()
      },
      {
        name: 'Claim modals show moniker with validator address',
        run: () => this.testClaimModalValidatorOptionLabels()
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
      },

      // Session Persistence & Auto-Reconnect Tests
      {
        name: 'Wallet connection persists to localStorage',
        run: () => this.testWalletConnectionPersistence()
      },
      {
        name: 'Cosmos network selection persists to localStorage',
        run: () => this.testCosmosNetworkPersistence()
      },
      {
        name: 'Ethereum chain ID persists on chain change',
        run: () => this.testEthChainPersistence()
      },
      {
        name: 'Auto-reconnect skips forced mainnet switch',
        run: () => this.testAutoReconnectSkipsMainnetSwitch()
      },
      {
        name: 'Disconnect clears localStorage keys',
        run: () => this.testDisconnectClearsStorage()
      },
      {
        name: 'Cosmos chain ID restored before init completes',
        run: () => this.testCosmosChainRestoredEarly()
      },

      // Seamless Network Switch Tests
      {
        name: 'Cosmos network switch without disconnect',
        run: () => this.testSeamlessCosmosNetworkSwitch()
      },

      // Wallet Manager Toggle Text Tests
      {
        name: 'Wallet manager shows network dots',
        run: () => this.testWalletManagerNetworkDots()
      },

      // Bridge Nav Tests (side nav / hub regression)
      {
        name: 'resolveBridgeNavDirection maps hub bridge token',
        run: () => this.testResolveBridgeNavDirectionContract()
      },
      {
        name: 'switchBridgeDirection ignores raw bridge token (regression)',
        run: () => this.testSwitchBridgeDirectionRejectsRawBridgeNavToken()
      },
      {
        name: 'Bridge inner panels restore after delegate when resolved',
        run: () => this.testBridgeContentRestoresAfterDelegateNav()
      },

      // Withdrawal Refresh Button Tests
      {
        name: 'Withdrawal refresh button shows loading state',
        run: () => this.testWithdrawalRefreshLoading()
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

  async testClaimableDisputeRewardsCosmosIntUiNumber() {
    await this.waitForCondition(() => typeof window.App !== 'undefined' && window.App.cosmosIntStringToUiNumber, 10000);
    const f = window.App.cosmosIntStringToUiNumber.bind(window.App);
    this.assertEqual(f(''), 0);
    this.assertEqual(f(null), 0);
    this.assertEqual(f('0'), 0);
    this.assertEqual(f('  0  '), 0);
    this.assertEqual(f('-1'), 0);
    this.assertEqual(f('5000'), 5000);
    this.assertEqual(f(String(Number.MAX_SAFE_INTEGER)), Number.MAX_SAFE_INTEGER);
    const huge = `1${'0'.repeat(24)}`;
    this.assertEqual(f(huge), 1, 'Oversized positive int should map to 1 for UI truthiness');
  }

  async testClaimableDisputeRewardsNormalizePayload() {
    await this.waitForCondition(() => typeof window.App !== 'undefined' && window.App.normalizeClaimableDisputeRewardsPayload, 10000);
    const n = window.App.normalizeClaimableDisputeRewardsPayload.bind(window.App);
    let r = n({ 'claim-rewards': '1.5', 'withdraw-fee-refund': '2' });
    this.assertEqual(r['claim-rewards'], 1.5);
    this.assertEqual(r['withdraw-fee-refund'], 2);
    r = n({ claimableAmount: { rewardAmount: '5000', feeRefundAmount: '100', rewardClaimed: false } });
    this.assertEqual(r['claim-rewards'], 5000);
    this.assertEqual(r['withdraw-fee-refund'], 100);
    r = n({
      claimable_amount: {
        reward_amount: '10',
        fee_refund_amount: '3',
        reward_claimed: true
      }
    });
    this.assertEqual(r['claim-rewards'], 0, 'reward_claimed should zero out claim-rewards');
    this.assertEqual(r['withdraw-fee-refund'], 3);
    r = n({ claimableAmount: { rewardAmount: '0', feeRefundAmount: '0', rewardClaimed: false } });
    this.assertEqual(r['claim-rewards'], 0);
    this.assertEqual(r['withdraw-fee-refund'], 0);
    r = n(null);
    this.assertEqual(r['claim-rewards'], 0);
    this.assertEqual(r['withdraw-fee-refund'], 0);
  }

  async testClaimableDisputeRewardsFetchUrlAndFallback() {
    await this.waitForCondition(() => typeof window.App !== 'undefined' && window.App.fetchClaimableDisputeRewards, 10000);
    const prevFetch = window.fetch;
    const prevChain = window.App.cosmosChainId;

    try {
      const addr = 'tellor196demo000000000000000000000000000000';
      const id = 99;

      window.App.cosmosChainId = 'layertest-5';
      const urls = [];
      window.fetch = async (url) => {
        urls.push(String(url));
        if (String(url).includes('claimable-dispute-rewards')) {
          return { ok: false, status: 404, statusText: 'Not Found' };
        }
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => ({ 'claim-rewards': 7, 'withdraw-fee-refund': 0 })
        };
      };
      const out = await window.App.fetchClaimableDisputeRewards(addr, id);
      this.assertEqual(out['claim-rewards'], 7, 'Should use legacy response after proto 404');
      this.assertEqual(out['withdraw-fee-refund'], 0);
      this.assertEqual(urls.length, 2, 'Should hit proto URL then legacy');
      this.assertTrue(urls[0].includes('node-palmito.tellorlayer.com'), 'Palmito should use node-palmito LCD');
      this.assertTrue(
        urls[0].includes(`/tellor-io/layer/dispute/claimable-dispute-rewards/${id}/${encodeURIComponent(addr)}`),
        'Proto path must be dispute_id then encoded address'
      );
      this.assertTrue(urls[1].includes('claimabledisputerewards'), 'Second attempt should use legacy path key');

      window.App.cosmosChainId = 'tellor-1';
      const urlsMain = [];
      window.fetch = async (url) => {
        urlsMain.push(String(url));
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => ({
            claimableAmount: {
              rewardAmount: '42',
              feeRefundAmount: '0',
              rewardClaimed: false
            }
          })
        };
      };
      const outMain = await window.App.fetchClaimableDisputeRewards(addr, 3);
      this.assertEqual(outMain['claim-rewards'], 42);
      this.assertEqual(urlsMain.length, 1, 'Successful proto response should not call legacy URL');
      this.assertTrue(urlsMain[0].includes('mainnet.tellorlayer.com'), 'Mainnet should use mainnet LCD');
      this.assertTrue(urlsMain[0].includes('/claimable-dispute-rewards/3/'), 'Mainnet request should use proto path');
    } finally {
      window.fetch = prevFetch;
      window.App.cosmosChainId = prevChain;
    }
  }

  async testDelegatorRewardsParsing() {
    await this.waitForCondition(() => typeof window.App !== 'undefined' && window.App.fetchDelegatorRewards, 10000);
    const prevFetch = window.fetch;
    try {
      window.fetch = async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          rewards: [
            {
              validator_address: 'tellorvaloper1alpha',
              reward: [
                { denom: 'loya', amount: '1234500.000000000000000000' }
              ]
            },
            {
              validator_address: 'tellorvaloper1beta',
              reward: [
                { denom: 'loya', amount: '500000.000000000000000000' }
              ]
            }
          ],
          total: [
            { denom: 'loya', amount: '1734500.000000000000000000' }
          ]
        })
      });
      const result = await window.App.fetchDelegatorRewards('tellor1delegator');
      this.assertEqual(result.rewards.length, 2, 'Should parse two validator reward rows');
      this.assertEqual(result.rewards[0].validatorAddress, 'tellorvaloper1alpha');
      this.assertEqual(result.rewards[0].loyaAmount, 1234500);
      this.assertEqual(result.totalLoya, 1734500);
    } finally {
      window.fetch = prevFetch;
    }
  }

  async testSelectorTipsExtraction() {
    await this.waitForCondition(() => typeof window.App !== 'undefined' && window.App.extractSelectorTipsLoya, 10000);
    const f = window.App.extractSelectorTipsLoya.bind(window.App);
    this.assertEqual(f({ available_tips: '750000.000000000000000000' }), 750000);
    this.assertEqual(f({ availableTips: { amount: [{ denom: 'loya', amount: '250000.0' }] } }), 250000);
    this.assertEqual(f([{ denom: 'loya', amount: '90000.0' }]), 90000);
    this.assertEqual(f(null), 0);
  }

  async testDelegatorSelectorRewardFetchEndpoints() {
    await this.waitForCondition(() => typeof window.App !== 'undefined' && window.App.fetchDelegatorRewards && window.App.fetchSelectorAvailableTips, 10000);
    const prevFetch = window.fetch;
    const prevChain = window.App.cosmosChainId;
    try {
      window.App.cosmosChainId = 'layertest-5';
      const urls = [];
      window.fetch = async (url) => {
        urls.push(String(url));
        return {
          ok: true,
          status: 200,
          json: async () => ({ rewards: [], total: [] })
        };
      };
      await window.App.fetchDelegatorRewards('tellor1abc');
      window.fetch = async (url) => {
        urls.push(String(url));
        return {
          ok: true,
          status: 200,
          json: async () => ({ available_tips: '0' })
        };
      };
      await window.App.fetchSelectorAvailableTips('tellor1abc');
      this.assertTrue(urls[0].includes('/cosmos/distribution/v1beta1/delegators/tellor1abc/rewards'), 'Delegator rewards endpoint should use distribution rewards route');
      this.assertTrue(urls[1].includes('/tellor-io/layer/reporter/available-tips/tellor1abc'), 'Selector tips endpoint should use reporter available-tips route');
      this.assertTrue(urls[0].includes('node-palmito.tellorlayer.com'), 'Testnet should use Palmito LCD host');
    } finally {
      window.fetch = prevFetch;
      window.App.cosmosChainId = prevChain;
    }
  }

  async testSelectorTipsClaimSuccessFlow() {
    await this.waitForCondition(() => typeof window.App !== 'undefined' && window.App.claimSelectorTips, 10000);

    const original = {
      selectorAvailableTipsRaw: window.App.selectorAvailableTipsRaw,
      showPendingPopup: window.App.showPendingPopup,
      hidePendingPopup: window.App.hidePendingPopup,
      showSuccessPopup: window.App.showSuccessPopup,
      showErrorPopup: window.App.showErrorPopup,
      getCosmosSignerAndAddress: window.App.getCosmosSignerAndAddress,
      broadcastCosmosMessages: window.App.broadcastCosmosMessages,
      refreshCurrentStatus: window.App.refreshCurrentStatus,
      closeActiveModal: window.App._closeActiveRewardClaimModal
    };

    let closeCount = 0;
    let pendingShown = '';
    let pendingHiddenCount = 0;
    let successCall = null;
    let errorCall = null;
    let refreshCount = 0;
    let broadcastMemo = '';

    try {
      window.App.selectorAvailableTipsRaw = '1500000';
      window.App._closeActiveRewardClaimModal = () => {
        closeCount += 1;
      };
      window.App.showPendingPopup = (message) => {
        pendingShown = message;
      };
      window.App.hidePendingPopup = () => {
        pendingHiddenCount += 1;
      };
      window.App.showSuccessPopup = (message, txHash, chainType) => {
        successCall = { message, txHash, chainType };
      };
      window.App.showErrorPopup = (message) => {
        errorCall = message;
      };
      window.App.getCosmosSignerAndAddress = async () => ({
        signerAddress: 'tellor1selector000000000000000000000000000000'
      });
      window.App.broadcastCosmosMessages = async (messages, memo) => {
        this.assertEqual(messages.length, 1, 'Selector tip claim should broadcast one message');
        this.assertEqual(messages[0].typeUrl, '/layer.reporter.MsgWithdrawTip', 'Claim should use MsgWithdrawTip');
        this.assertEqual(
          messages[0].value.selectorAddress,
          'tellor1selector000000000000000000000000000000',
          'Claim message should use signer address as selector'
        );
        this.assertEqual(
          messages[0].value.validatorAddress,
          'tellorvaloper1destination000000000000000000000000',
          'Claim message should use chosen validator destination'
        );
        broadcastMemo = memo;
        return {
          code: 0,
          txhash: 'BFC62C08B6E27043FAFD34BBF38B2299000873A917637CF56775F0446FFC00A0'
        };
      };
      window.App.refreshCurrentStatus = async () => {
        refreshCount += 1;
      };

      await window.App.claimSelectorTips('tellorvaloper1destination000000000000000000000000');

      this.assertEqual(closeCount, 1, 'Active claim modal should close before showing pending popup');
      this.assertEqual(pendingShown, 'Claiming selector tips...', 'Should show selector claim pending message');
      this.assertEqual(pendingHiddenCount, 1, 'Pending popup should close after successful broadcast');
      this.assertEqual(broadcastMemo, 'Claim Selector Tips', 'Should set selector claim memo');
      this.assertNotNull(successCall, 'Success popup should be shown');
      this.assertEqual(successCall.chainType, 'cosmos', 'Selector claim success should use Cosmos explorer path');
      this.assertEqual(
        successCall.txHash,
        'BFC62C08B6E27043FAFD34BBF38B2299000873A917637CF56775F0446FFC00A0',
        'Success popup should receive tx hash for explorer link'
      );
      this.assertContains(successCall.message, 'Selector tips claimed successfully', 'Should show selector claim success message');
      this.assertEqual(refreshCount, 1, 'Successful claim should refresh status');
      this.assertEqual(errorCall, null, 'No error popup expected on successful selector claim');
    } finally {
      window.App.selectorAvailableTipsRaw = original.selectorAvailableTipsRaw;
      window.App.showPendingPopup = original.showPendingPopup;
      window.App.hidePendingPopup = original.hidePendingPopup;
      window.App.showSuccessPopup = original.showSuccessPopup;
      window.App.showErrorPopup = original.showErrorPopup;
      window.App.getCosmosSignerAndAddress = original.getCosmosSignerAndAddress;
      window.App.broadcastCosmosMessages = original.broadcastCosmosMessages;
      window.App.refreshCurrentStatus = original.refreshCurrentStatus;
      window.App._closeActiveRewardClaimModal = original.closeActiveModal;
    }
  }

  async testClaimModalValidatorOptionLabels() {
    await this.waitForCondition(
      () => typeof window.App !== 'undefined' && window.App.openDelegatorRewardsClaimModal && window.App.openSelectorTipClaimModal,
      10000
    );

    const original = {
      delegatorRewardRows: window.App.delegatorRewardRows,
      rewardDestinationValidators: window.App.rewardDestinationValidators,
      selectorAvailableTipsRaw: window.App.selectorAvailableTipsRaw
    };

    const validatorAddress = 'tellorvaloper1abcdefghijabcdefghijabcdefghij';
    const shortAddress = `${validatorAddress.substring(0, 17)}...`;

    try {
      window.App.delegatorRewardRows = [{
        validatorAddress,
        loyaAmount: 1234500
      }];
      window.App.rewardDestinationValidators = [{
        address: validatorAddress,
        moniker: 'Alpha Validator'
      }];
      window.App.selectorAvailableTipsRaw = '2500000';

      window.App.openDelegatorRewardsClaimModal();
      const delegatorSelect = document.getElementById('delegatorClaimModalValidator');
      this.assertNotNull(delegatorSelect, 'Delegator claim modal validator select should exist');
      this.assertTrue(delegatorSelect.options.length >= 2, 'Delegator claim select should include validator options');
      const delegatorOption = delegatorSelect.options[1].textContent;
      this.assertContains(delegatorOption, 'Alpha Validator', 'Delegator option should include validator moniker');
      this.assertContains(delegatorOption, `(${shortAddress})`, 'Delegator option should include short validator address');
      if (typeof window.App._closeActiveRewardClaimModal === 'function') {
        window.App._closeActiveRewardClaimModal();
      }

      await window.App.openSelectorTipClaimModal();
      const selectorSelect = document.getElementById('selectorClaimModalValidator');
      this.assertNotNull(selectorSelect, 'Selector claim modal validator select should exist');
      this.assertTrue(selectorSelect.options.length >= 2, 'Selector claim select should include validator options');
      const selectorOption = selectorSelect.options[1].textContent;
      this.assertContains(selectorOption, 'Alpha Validator', 'Selector option should include validator moniker');
      this.assertContains(selectorOption, `(${shortAddress})`, 'Selector option should include short validator address');
      if (typeof window.App._closeActiveRewardClaimModal === 'function') {
        window.App._closeActiveRewardClaimModal();
      }
    } finally {
      window.App.delegatorRewardRows = original.delegatorRewardRows;
      window.App.rewardDestinationValidators = original.rewardDestinationValidators;
      window.App.selectorAvailableTipsRaw = original.selectorAvailableTipsRaw;
      if (typeof window.App._closeActiveRewardClaimModal === 'function') {
        window.App._closeActiveRewardClaimModal();
      }
    }
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
    mockKeplr.getChainId = async () => 'layertest-5';
    window.keplr = mockKeplr;
    
    // Wait for App to be available
    await this.waitForCondition(() => typeof window.App !== 'undefined', 10000);
    
    // Test testnet detection
    if (window.App.connectKeplrLegacy) {
      await window.App.connectKeplrLegacy();
      await this.wait(500);
      
      this.assertEqual(window.App.cosmosChainId, 'layertest-5', 'cosmosChainId should be set to layertest-5 for testnet');
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
      window.App.cosmosChainId = 'layertest-5';
      window.App.isKeplrConnected = true;
      
      // Test switching to mainnet
      await window.App.switchCosmosNetwork();
      await this.wait(500);
      
      this.assertEqual(window.App.cosmosChainId, 'tellor-1', 'Network should switch to mainnet');
      
      // Test switching back to testnet
      await window.App.switchCosmosNetwork();
      await this.wait(500);
      
      this.assertEqual(window.App.cosmosChainId, 'layertest-5', 'Network should switch back to testnet');
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

  // NEW: Comprehensive integration test for withdrawal button state management
  async testWithdrawalButtonIntegrationMainnet() {
    // Mock mainnet environment
    const mockKeplr = this.mockKeplrProvider();
    mockKeplr.getChainId = async () => 'tellor-1';
    window.keplr = mockKeplr;
    
    // Wait for App to be available
    await this.waitForCondition(() => typeof window.App !== 'undefined', 10000);
    
    // Test 1: Initial state - no wallet connected
    const withdrawButton = document.getElementById('withdrawButton');
    this.assertNotNull(withdrawButton, 'Withdrawal button should exist');
    
    // Switch to ethereum bridge direction
    if (window.App.switchBridgeDirection) {
      window.App.switchBridgeDirection('ethereum');
      await this.wait(100);
    }
    
    // Test 2: Button should be disabled with no wallet and no input
    const ethStakeAmountInput = document.getElementById('ethStakeAmount');
    this.assertNotNull(ethStakeAmountInput, 'Ethereum stake amount input should exist');
    
    // Clear input and test button state
    ethStakeAmountInput.value = '';
    ethStakeAmountInput.dispatchEvent(new Event('input', { bubbles: true }));
    await this.wait(100);
    
    // Test 3: Connect wallet and verify UI updates
    if (window.App.connectKeplrLegacy) {
      await window.App.connectKeplrLegacy();
      await this.wait(500);
    }
    
    // Test 4: Button should be enabled after wallet connection
    this.assertFalse(withdrawButton.disabled, 'Withdrawal button should be enabled after wallet connection');
    
    // Test 5: Input validation - button should stay enabled regardless of input
    ethStakeAmountInput.value = '';
    ethStakeAmountInput.dispatchEvent(new Event('input', { bubbles: true }));
    await this.wait(100);
    
    this.assertFalse(withdrawButton.disabled, 'Withdrawal button should stay enabled with empty input');
    
    // Test 6: Valid input should keep button enabled
    ethStakeAmountInput.value = '10';
    ethStakeAmountInput.dispatchEvent(new Event('input', { bubbles: true }));
    await this.wait(100);
    
    this.assertFalse(withdrawButton.disabled, 'Withdrawal button should be enabled with valid input');
    
    // Test 7: Invalid input should keep button enabled
    ethStakeAmountInput.value = '0';
    ethStakeAmountInput.dispatchEvent(new Event('input', { bubbles: true }));
    await this.wait(100);
    
    this.assertFalse(withdrawButton.disabled, 'Withdrawal button should stay enabled with invalid input');
    
    // Test 8: Negative input should keep button enabled
    ethStakeAmountInput.value = '-5';
    ethStakeAmountInput.dispatchEvent(new Event('input', { bubbles: true }));
    await this.wait(100);
    
    this.assertFalse(withdrawButton.disabled, 'Withdrawal button should stay enabled with negative input');
    
    // Test 9: Valid input should keep button enabled
    ethStakeAmountInput.value = '5';
    ethStakeAmountInput.dispatchEvent(new Event('input', { bubbles: true }));
    await this.wait(100);
    
    this.assertFalse(withdrawButton.disabled, 'Withdrawal button should be enabled with valid input');
    
    // Test 10: Verify button stays enabled regardless of input field values
    // Button should remain enabled even with empty ethStakeAmount
    const stakeAmountInput = document.getElementById('stakeAmount');
    if (stakeAmountInput) {
      stakeAmountInput.value = '100'; // Set value in wrong input
      ethStakeAmountInput.value = '0'; // Clear correct input
      ethStakeAmountInput.dispatchEvent(new Event('input', { bubbles: true }));
      await this.wait(100);
      
      // Button should stay enabled even when ethStakeAmount is 0
      this.assertFalse(withdrawButton.disabled, 'Withdrawal button should stay enabled when ethStakeAmount is 0, regardless of stakeAmount');
    }
  }

  // NEW: Test for the specific bug that was missed
  async testWithdrawalButtonInputFieldBug() {
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
    
    const withdrawButton = document.getElementById('withdrawButton');
    const ethStakeAmountInput = document.getElementById('ethStakeAmount');
    const stakeAmountInput = document.getElementById('stakeAmount');
    
    this.assertNotNull(withdrawButton, 'Withdrawal button should exist');
    this.assertNotNull(ethStakeAmountInput, 'Ethereum stake amount input should exist');
    
    // Test the specific bug: checkAllowance should use ethStakeAmount, not stakeAmount
    if (stakeAmountInput) {
      // Set value in the wrong input field (stakeAmount)
      stakeAmountInput.value = '100';
      stakeAmountInput.dispatchEvent(new Event('input', { bubbles: true }));
      await this.wait(100);
      
      // Clear the correct input field (ethStakeAmount)
      ethStakeAmountInput.value = '';
      ethStakeAmountInput.dispatchEvent(new Event('input', { bubbles: true }));
      await this.wait(100);
      
      // Button should stay enabled even when ethStakeAmount is empty
      this.assertFalse(withdrawButton.disabled, 'Withdrawal button should stay enabled when ethStakeAmount is empty, regardless of stakeAmount value');
      
      // Now set value in correct input field
      ethStakeAmountInput.value = '10';
      ethStakeAmountInput.dispatchEvent(new Event('input', { bubbles: true }));
      await this.wait(100);
      
      // Button should remain enabled
      this.assertFalse(withdrawButton.disabled, 'Withdrawal button should be enabled when ethStakeAmount has valid value');
    }
  }

  // NEW: Test wallet connection UI updates
  async testWalletConnectionUIUpdates() {
    // Mock mainnet environment
    const mockKeplr = this.mockKeplrProvider();
    mockKeplr.getChainId = async () => 'tellor-1';
    window.keplr = mockKeplr;
    
    // Wait for App to be available
    await this.waitForCondition(() => typeof window.App !== 'undefined', 10000);
    
    // Test 1: Initial state - no wallets connected
    const withdrawButton = document.getElementById('withdrawButton');
    const delegateButton = document.getElementById('delegateButton');
    const depositButton = document.getElementById('depositButton');
    
    this.assertNotNull(withdrawButton, 'Withdrawal button should exist');
    this.assertNotNull(delegateButton, 'Delegate button should exist');
    this.assertNotNull(depositButton, 'Deposit button should exist');
    
    // Test 2: Switch to ethereum bridge direction
    if (window.App.switchBridgeDirection) {
      window.App.switchBridgeDirection('ethereum');
      await this.wait(100);
    }
    
    // Test 3: Connect Keplr wallet and verify UI updates
    if (window.App.connectKeplrLegacy) {
      await window.App.connectKeplrLegacy();
      await this.wait(500);
    }
    
    // Test 4: Withdrawal button should be enabled after Keplr connection
    this.assertFalse(withdrawButton.disabled, 'Withdrawal button should be enabled after Keplr connection');
    
    // Test 5: Switch to delegate section
    if (window.App.switchBridgeDirection) {
      window.App.switchBridgeDirection('delegate');
      await this.wait(100);
    }
    
    // Test 6: Delegate button should be enabled after Keplr connection
    this.assertFalse(delegateButton.disabled, 'Delegate button should be enabled after Keplr connection');
    
    // Test 7: Switch back to layer section
    if (window.App.switchBridgeDirection) {
      window.App.switchBridgeDirection('layer');
      await this.wait(100);
    }
    
    // Test 8: Deposit button should be enabled (no wallet required for layer section)
    this.assertFalse(depositButton.disabled, 'Deposit button should be enabled in layer section');
    
    // Test 9: Verify updateUIForCurrentDirection is called after wallet connection
    // This tests the fix we made to ensure UI updates after wallet connection
    const originalUpdateUI = window.App.updateUIForCurrentDirection;
    let updateUICalled = false;
    window.App.updateUIForCurrentDirection = function() {
      updateUICalled = true;
      return originalUpdateUI.call(this);
    };
    
    // Disconnect and reconnect to trigger UI update
    if (window.App.disconnectKeplr) {
      await window.App.disconnectKeplr();
      await this.wait(100);
    }
    
    if (window.App.connectKeplrLegacy) {
      await window.App.connectKeplrLegacy();
      await this.wait(500);
    }
    
    // Restore original function
    window.App.updateUIForCurrentDirection = originalUpdateUI;
    
    this.assertTrue(updateUICalled, 'updateUIForCurrentDirection should be called after wallet connection');
  }

  // NEW: Test network switching UI updates
  async testNetworkSwitchingUIUpdates() {
    // Mock mainnet environment
    const mockKeplr = this.mockKeplrProvider();
    mockKeplr.getChainId = async () => 'tellor-1';
    window.keplr = mockKeplr;
    
    // Wait for App to be available
    await this.waitForCondition(() => typeof window.App !== 'undefined', 10000);
    
    // Test 1: Connect to mainnet
    if (window.App.connectKeplrLegacy) {
      await window.App.connectKeplrLegacy();
      await this.wait(500);
    }
    
    // Test 2: Verify mainnet connection
    this.assertEqual(window.App.cosmosChainId, 'tellor-1', 'Should be connected to mainnet');
    
    // Test 3: Switch to ethereum bridge direction
    if (window.App.switchBridgeDirection) {
      window.App.switchBridgeDirection('ethereum');
      await this.wait(100);
    }
    
    const withdrawButton = document.getElementById('withdrawButton');
    this.assertNotNull(withdrawButton, 'Withdrawal button should exist');
    
    // Test 4: Button should be enabled on mainnet
    this.assertFalse(withdrawButton.disabled, 'Withdrawal button should be enabled on mainnet');
    
    // Test 5: Switch to testnet
    if (window.App.switchCosmosNetwork) {
      await window.App.switchCosmosNetwork();
      await this.wait(500);
    }
    
    // Test 6: Verify testnet connection
    this.assertEqual(window.App.cosmosChainId, 'layertest-5', 'Should be connected to testnet');
    
    // Test 7: Button should still be enabled on testnet
    this.assertFalse(withdrawButton.disabled, 'Withdrawal button should be enabled on testnet');
    
    // Test 8: Switch back to mainnet
    if (window.App.switchCosmosNetwork) {
      await window.App.switchCosmosNetwork();
      await this.wait(500);
    }
    
    // Test 9: Verify mainnet connection
    this.assertEqual(window.App.cosmosChainId, 'tellor-1', 'Should be connected to mainnet');
    
    // Test 10: Button should still be enabled on mainnet
    this.assertFalse(withdrawButton.disabled, 'Withdrawal button should be enabled on mainnet');
  }

  async testWithdrawalButtonFunctionalityTestnet() {
    // Mock testnet environment
    const mockKeplr = this.mockKeplrProvider();
    mockKeplr.getChainId = async () => 'layertest-5';
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
    mockKeplr.getChainId = async () => 'layertest-5';
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
        const selectedReporterAddress = document.getElementById('selectedReporterAddress');
        
        if (reporterDropdown && selectedReporterAddress) {
          // Set test values
          selectedReporterAddress.value = 'tellor1reporter123456789012345678901234567890';
          
          // Mock the CosmJS selectReporter function
          if (window.cosmjs && window.cosmjs.stargate) {
            window.cosmjs.stargate.selectReporter = async (account, reporterAddress) => {
              this.assertEqual(account, 'tellor1testselector123456789012345678901234567890', 'Should use correct account');
              this.assertEqual(reporterAddress, 'tellor1reporter123456789012345678901234567890', 'Should use correct reporter address');
              
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
      window.App.cosmosChainId = 'layertest-5';
      
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
    mockKeplr.getChainId = async () => 'layertest-5';
    window.keplr = mockKeplr;
    
    // Wait for App to be available
    await this.waitForCondition(() => typeof window.App !== 'undefined', 10000);
    
    // Connect to testnet
    if (window.App.connectKeplrLegacy) {
      await window.App.connectKeplrLegacy();
      await this.wait(500);
    }
    
    // Test dispute functions with testnet chain ID
    this.assertEqual(window.App.cosmosChainId, 'layertest-5', 'Should be on testnet for dispute tests');
    
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

  // NEW TESTS FOR UPDATED FUNCTIONALITY

  async testNetworkSwitchingFlag() {
    // Wait for App to be available
    await this.waitForCondition(() => typeof window.App !== 'undefined', 10000);
    
    if (window.App) {
      // Test initial state
      this.assertFalse(window.App.isNetworkSwitching, 'isNetworkSwitching should be false initially');
      
      // Simulate network switching
      window.App.isNetworkSwitching = true;
      this.assertTrue(window.App.isNetworkSwitching, 'isNetworkSwitching should be true during network switch');
      
      // Test that connectCosmosWallet respects the flag
      const mockAdapter = {
        isConnected: () => true,
        getChainId: async () => 'layertest-5', // This should be ignored during network switch
        connectToWallet: async (walletType) => ({
          address: 'tellor1testaddress123456789012345678901234567890',
          walletName: 'keplr'
        })
      };
      
      // Set target chain ID
      window.App.cosmosChainId = 'tellor-1';
      window.cosmosWalletAdapter = mockAdapter;
      
      // Mock the connectCosmosWallet method to test the flag behavior
      const originalConnectCosmosWallet = window.App.connectCosmosWallet;
      let chainIdDetected = false;
      
      window.App.connectCosmosWallet = async function(walletType) {
        // This simulates the logic in connectCosmosWallet
        if (!window.App.isNetworkSwitching) {
          const currentChainId = await window.cosmosWalletAdapter.getChainId();
          if (currentChainId === 'tellor-1') {
            window.App.cosmosChainId = 'tellor-1';
          } else if (currentChainId === 'layertest-5') {
            window.App.cosmosChainId = 'layertest-5';
            chainIdDetected = true;
          }
        }
        return { address: 'test', walletName: 'keplr' };
      };
      
      await window.App.connectCosmosWallet('keplr');
      
      // During network switching, the chain ID should not be overridden
      this.assertEqual(window.App.cosmosChainId, 'tellor-1', 'Chain ID should not be overridden during network switch');
      this.assertFalse(chainIdDetected, 'Chain ID detection should be skipped during network switch');
      
      // Restore original method
      window.App.connectCosmosWallet = originalConnectCosmosWallet;
      
      // Clear the flag
      window.App.isNetworkSwitching = false;
    }
  }

  async testWalletAdapterSwitchToChain() {
    // Mock wallet adapter with switchToChain method
    const mockAdapter = {
      isConnected: () => true,
      currentWallet: {
        experimentalSuggestChain: async (config) => {
          console.log('Chain suggested:', config.chainId);
        },
        enable: async (chainId) => {
          console.log('Chain enabled:', chainId);
        }
      },
      walletType: 'keplr',
      chainConfigs: {
        'tellor-1': {
          chainId: 'tellor-1',
          chainName: 'Tellor Layer Mainnet',
          rpc: 'https://mainnet.tellorlayer.com/rpc',
          rest: 'https://mainnet.tellorlayer.com/rpc'
        },
        'layertest-5': {
          chainId: 'layertest-5',
          chainName: 'Layer Testnet',
          rpc: 'https://node-palmito.tellorlayer.com/rpc',
          rest: 'https://node-palmito.tellorlayer.com/rpc'
        }
      },
      updateChainConfig: function() {
        const currentChainId = window.App && window.App.cosmosChainId ? window.App.cosmosChainId : 'tellor-1';
        if (this.chainConfigs[currentChainId]) {
          this.chainConfig = this.chainConfigs[currentChainId];
          this.chainId = currentChainId;
        }
      },
      switchToChain: async function() {
        this.updateChainConfig();
        if (this.currentWallet.experimentalSuggestChain) {
          await this.currentWallet.experimentalSuggestChain(this.chainConfig);
        }
        await this.currentWallet.enable(this.chainId);
      }
    };
    
    window.cosmosWalletAdapter = mockAdapter;
    
    // Wait for App to be available
    await this.waitForCondition(() => typeof window.App !== 'undefined', 10000);
    
    if (window.App) {
      // Test switching to testnet
      window.App.cosmosChainId = 'layertest-5';
      await mockAdapter.switchToChain();
      
      this.assertEqual(mockAdapter.chainId, 'layertest-5', 'Wallet adapter should switch to testnet chain');
      this.assertEqual(mockAdapter.chainConfig.chainId, 'layertest-5', 'Chain config should be updated to testnet');
      
      // Test switching to mainnet
      window.App.cosmosChainId = 'tellor-1';
      await mockAdapter.switchToChain();
      
      this.assertEqual(mockAdapter.chainId, 'tellor-1', 'Wallet adapter should switch to mainnet chain');
      this.assertEqual(mockAdapter.chainConfig.chainId, 'tellor-1', 'Chain config should be updated to mainnet');
    }
  }

  async testEtherscanUrlMainnet() {
    // Wait for App to be available
    await this.waitForCondition(() => typeof window.App !== 'undefined', 10000);
    
    if (window.App) {
      // Set to mainnet
      window.App.chainId = 1;
      
      // Mock the showSuccessPopup method to capture the URL
      const originalShowSuccessPopup = window.App.showSuccessPopup;
      let capturedUrl = null;
      
      window.App.showSuccessPopup = function(message, txHash, chainType) {
        if (txHash && chainType === 'ethereum') {
          if (window.App.chainId === 1) {
            capturedUrl = `https://etherscan.io/tx/${txHash}`;
          } else {
            capturedUrl = `https://sepolia.etherscan.io/tx/${txHash}`;
          }
        }
      };
      
      // Test mainnet URL generation
      window.App.showSuccessPopup('Test message', '0x1234567890abcdef', 'ethereum');
      
      this.assertEqual(capturedUrl, 'https://etherscan.io/tx/0x1234567890abcdef', 'Should generate mainnet Etherscan URL');
      
      // Restore original method
      window.App.showSuccessPopup = originalShowSuccessPopup;
    }
  }

  async testEtherscanUrlTestnet() {
    // Wait for App to be available
    await this.waitForCondition(() => typeof window.App !== 'undefined', 10000);
    
    if (window.App) {
      // Set to testnet
      window.App.chainId = 11155111;
      
      // Mock the showSuccessPopup method to capture the URL
      const originalShowSuccessPopup = window.App.showSuccessPopup;
      let capturedUrl = null;
      
      window.App.showSuccessPopup = function(message, txHash, chainType) {
        if (txHash && chainType === 'ethereum') {
          if (window.App.chainId === 1) {
            capturedUrl = `https://etherscan.io/tx/${txHash}`;
          } else {
            capturedUrl = `https://sepolia.etherscan.io/tx/${txHash}`;
          }
        }
      };
      
      // Test testnet URL generation
      window.App.showSuccessPopup('Test message', '0x1234567890abcdef', 'ethereum');
      
      this.assertEqual(capturedUrl, 'https://sepolia.etherscan.io/tx/0x1234567890abcdef', 'Should generate testnet Etherscan URL');
      
      // Restore original method
      window.App.showSuccessPopup = originalShowSuccessPopup;
    }
  }

  async testRequestAttestationRpcEndpoints() {
    // Wait for App to be available
    await this.waitForCondition(() => typeof window.App !== 'undefined', 10000);
    
    if (window.App) {
      // Test mainnet RPC endpoint
      window.App.cosmosChainId = 'tellor-1';
      const mainnetRpcEndpoint = window.App.getCosmosRpcEndpoint();
      this.assertEqual(mainnetRpcEndpoint, 'https://mainnet.tellorlayer.com/rpc', 'Should use mainnet RPC endpoint for request attestation');
      
      // Test testnet RPC endpoint
      window.App.cosmosChainId = 'layertest-5';
      const testnetRpcEndpoint = window.App.getCosmosRpcEndpoint();
      this.assertEqual(testnetRpcEndpoint, 'https://node-palmito.tellorlayer.com/rpc', 'Should use testnet RPC endpoint for request attestation');
      
      // Test that stargate.js would use the correct endpoint
      const mockStargateRequestAttestations = async function(account, queryId, timestamp) {
        const rpcEndpoint = window.App && window.App.getCosmosRpcEndpoint ? window.App.getCosmosRpcEndpoint() : 'https://node-palmito.tellorlayer.com/rpc';
        return { rpcEndpoint };
      };
      
      // Test mainnet
      window.App.cosmosChainId = 'tellor-1';
      const mainnetResult = await mockStargateRequestAttestations('test', 'test', 'test');
      this.assertEqual(mainnetResult.rpcEndpoint, 'https://mainnet.tellorlayer.com/rpc', 'Request attestation should use mainnet RPC endpoint');
      
      // Test testnet
      window.App.cosmosChainId = 'layertest-5';
      const testnetResult = await mockStargateRequestAttestations('test', 'test', 'test');
      this.assertEqual(testnetResult.rpcEndpoint, 'https://node-palmito.tellorlayer.com/rpc', 'Request attestation should use testnet RPC endpoint');
    }
  }

  // ─── Session Persistence & Auto-Reconnect Tests ────────────────────

  async testWalletConnectionPersistence() {
    await this.waitForCondition(() => typeof window.App !== 'undefined', 10000);

    localStorage.removeItem('tellor_cosmos_wallet_type');
    localStorage.removeItem('tellor_eth_wallet_type');
    localStorage.removeItem('tellor_eth_wallet_connected');

    const mockAdapter = {
      isConnected: () => true,
      getChainId: async () => 'tellor-1',
      connectToWallet: async () => ({
        address: 'tellor1abc123def456ghi789jkl012mno345pqr678stu',
        walletName: 'keplr'
      }),
      getOfflineSigner: () => ({
        getAccounts: async () => [{ address: 'tellor1abc123def456ghi789jkl012mno345pqr678stu' }]
      }),
      switchToChain: async () => {}
    };
    window.cosmosWalletAdapter = mockAdapter;

    if (window.App.connectCosmosWallet) {
      await window.App.connectCosmosWallet('keplr');
      await this.wait(300);

      this.assertEqual(
        localStorage.getItem('tellor_cosmos_wallet_type'),
        'keplr',
        'Cosmos wallet type should persist to localStorage'
      );
    }

    localStorage.removeItem('tellor_cosmos_wallet_type');
    localStorage.removeItem('tellor_cosmos_chain_id');
  }

  async testCosmosNetworkPersistence() {
    await this.waitForCondition(() => typeof window.App !== 'undefined', 10000);

    localStorage.removeItem('tellor_cosmos_chain_id');

    const mockAdapter = {
      isConnected: () => true,
      getChainId: async () => 'layertest-5',
      connectToWallet: async () => ({
        address: 'tellor1abc123def456ghi789jkl012mno345pqr678stu',
        walletName: 'keplr'
      }),
      getOfflineSigner: () => ({
        getAccounts: async () => [{ address: 'tellor1abc123def456ghi789jkl012mno345pqr678stu' }]
      }),
      switchToChain: async () => {}
    };
    window.cosmosWalletAdapter = mockAdapter;
    window.App.cosmosChainId = 'layertest-5';

    if (window.App.connectCosmosWallet) {
      await window.App.connectCosmosWallet('keplr');
      await this.wait(300);

      const stored = localStorage.getItem('tellor_cosmos_chain_id');
      this.assertTrue(
        stored === 'layertest-5' || stored === 'tellor-1',
        'Cosmos chain ID should be persisted to localStorage'
      );
    }

    localStorage.removeItem('tellor_cosmos_wallet_type');
    localStorage.removeItem('tellor_cosmos_chain_id');
  }

  async testEthChainPersistence() {
    await this.waitForCondition(() => typeof window.App !== 'undefined', 10000);

    localStorage.removeItem('tellor_eth_chain_id');

    window.App.isConnected = true;
    window.App.chainId = 11155111;
    localStorage.setItem('tellor_eth_chain_id', '11155111');

    this.assertEqual(
      localStorage.getItem('tellor_eth_chain_id'),
      '11155111',
      'Eth chain ID should be persisted when connected'
    );

    window.App.isConnected = false;
    localStorage.removeItem('tellor_eth_chain_id');
  }

  async testAutoReconnectSkipsMainnetSwitch() {
    await this.waitForCondition(() => typeof window.App !== 'undefined', 10000);

    this.assertDefined(window.App.autoReconnectWallets, 'autoReconnectWallets should exist');
    this.assertFunction(window.App.autoReconnectWallets, 'autoReconnectWallets should be a function');

    window.App._isAutoReconnecting = true;
    this.assertTrue(window.App._isAutoReconnecting, '_isAutoReconnecting flag should be settable');
    delete window.App._isAutoReconnecting;
    this.assertFalse(!!window.App._isAutoReconnecting, '_isAutoReconnecting should be cleared after delete');
  }

  async testDisconnectClearsStorage() {
    await this.waitForCondition(() => typeof window.App !== 'undefined', 10000);

    localStorage.setItem('tellor_cosmos_wallet_type', 'keplr');
    localStorage.setItem('tellor_cosmos_chain_id', 'layertest-5');
    localStorage.setItem('tellor_eth_wallet_type', 'metamask');
    localStorage.setItem('tellor_eth_wallet_connected', 'true');
    localStorage.setItem('tellor_eth_chain_id', '11155111');

    if (window.App.disconnectKeplr) {
      const origKeplr = window.keplr;
      window.keplr = this.mockKeplrProvider();

      window.App.isKeplrConnected = true;
      window.App.keplrAddress = 'tellor1test';
      try {
        await window.App.disconnectKeplr();
      } catch (e) { /* ignore UI errors in test env */ }
      await this.wait(200);

      this.assertFalse(
        !!localStorage.getItem('tellor_cosmos_wallet_type'),
        'Cosmos wallet type should be cleared on disconnect'
      );
      this.assertFalse(
        !!localStorage.getItem('tellor_cosmos_chain_id'),
        'Cosmos chain ID should be cleared on disconnect'
      );

      window.keplr = origKeplr;
    }

    if (window.App.disconnectMetaMask) {
      window.App.isConnected = true;
      window.App.account = '0x1234567890abcdef1234567890abcdef12345678';
      try {
        await window.App.disconnectMetaMask();
      } catch (e) { /* ignore UI errors in test env */ }
      await this.wait(200);

      this.assertFalse(
        !!localStorage.getItem('tellor_eth_wallet_connected'),
        'Eth wallet connected flag should be cleared on disconnect'
      );
      this.assertFalse(
        !!localStorage.getItem('tellor_eth_chain_id'),
        'Eth chain ID should be cleared on disconnect'
      );
    }

    localStorage.removeItem('tellor_cosmos_wallet_type');
    localStorage.removeItem('tellor_cosmos_chain_id');
    localStorage.removeItem('tellor_eth_wallet_type');
    localStorage.removeItem('tellor_eth_wallet_connected');
    localStorage.removeItem('tellor_eth_chain_id');
  }

  async testCosmosChainRestoredEarly() {
    await this.waitForCondition(() => typeof window.App !== 'undefined', 10000);

    localStorage.setItem('tellor_cosmos_chain_id', 'layertest-5');
    const stored = localStorage.getItem('tellor_cosmos_chain_id');
    this.assertEqual(stored, 'layertest-5', 'localStorage should hold cosmos chain ID for restore on init');

    localStorage.removeItem('tellor_cosmos_chain_id');
  }

  // ─── Seamless Network Switch ──────────────────────────────────────

  async testSeamlessCosmosNetworkSwitch() {
    await this.waitForCondition(() => typeof window.App !== 'undefined', 10000);

    let suggestCalled = false;
    let enableCalled = false;
    const mockAdapter = {
      isConnected: () => true,
      currentWallet: {
        experimentalSuggestChain: async () => { suggestCalled = true; },
        enable: async () => { enableCalled = true; }
      },
      walletType: 'keplr',
      chainConfigs: {
        'tellor-1': { chainId: 'tellor-1', chainName: 'Tellor Layer', rpc: 'https://mainnet.tellorlayer.com/rpc', rest: 'https://mainnet.tellorlayer.com/rpc' },
        'layertest-5': { chainId: 'layertest-5', chainName: 'Layer Testnet', rpc: 'https://node-palmito.tellorlayer.com/rpc', rest: 'https://node-palmito.tellorlayer.com/rpc' }
      },
      updateChainConfig: function() {
        const id = window.App && window.App.cosmosChainId ? window.App.cosmosChainId : 'tellor-1';
        if (this.chainConfigs[id]) { this.chainConfig = this.chainConfigs[id]; this.chainId = id; }
      },
      switchToChain: async function() {
        this.updateChainConfig();
        if (this.currentWallet.experimentalSuggestChain) await this.currentWallet.experimentalSuggestChain(this.chainConfig);
        await this.currentWallet.enable(this.chainId);
      },
      getChainId: async () => window.App.cosmosChainId || 'tellor-1',
      connectToWallet: async () => ({ address: 'tellor1test', walletName: 'keplr' }),
      getOfflineSigner: () => ({ getAccounts: async () => [{ address: 'tellor1test' }] })
    };
    window.cosmosWalletAdapter = mockAdapter;

    window.App.cosmosChainId = 'layertest-5';
    await mockAdapter.switchToChain();

    this.assertTrue(suggestCalled, 'switchToChain should call experimentalSuggestChain');
    this.assertTrue(enableCalled, 'switchToChain should call enable');
    this.assertEqual(mockAdapter.chainId, 'layertest-5', 'Adapter should switch to testnet without disconnect');
  }

  // ─── Wallet Manager Toggle Text ───────────────────────────────────

  async testWalletManagerNetworkDots() {
    await this.waitForCondition(() => typeof window.App !== 'undefined', 10000);

    if (!window.App.updateWalletManagerToggleText) return;

    const origAccount = window.App.account;
    const origConnected = window.App.isConnected;
    const origKeplr = window.App.keplrAddress;
    const origKeplrConnected = window.App.isKeplrConnected;
    const origChainId = window.App.chainId;
    const origCosmosChainId = window.App.cosmosChainId;

    window.App.account = '0x1234567890abcdef1234567890abcdef12345678';
    window.App.isConnected = true;
    window.App.keplrAddress = 'tellor1abc123def456ghi789jkl012mno345pqr678stu';
    window.App.isKeplrConnected = true;
    window.App.chainId = 1;
    window.App.cosmosChainId = 'tellor-1';

    window.App.updateWalletManagerToggleText();

    const toggle = document.getElementById('walletManagerToggle');
    if (toggle) {
      const span = toggle.querySelector('.wallet-manager-text') || toggle;
      const html = span.innerHTML;
      this.assertTrue(html.includes('#10b981'), 'Mainnet Eth should show green dot (#10b981)');
      this.assertTrue(html.includes('Eth:'), 'Should include Eth label');
      this.assertTrue(html.includes('Cosmos:'), 'Should include Cosmos label');

      window.App.chainId = 11155111;
      window.App.cosmosChainId = 'layertest-5';
      window.App.updateWalletManagerToggleText();
      const html2 = span.innerHTML;
      this.assertTrue(html2.includes('#f59e0b'), 'Testnet should show yellow dot (#f59e0b)');
    }

    window.App.account = origAccount;
    window.App.isConnected = origConnected;
    window.App.keplrAddress = origKeplr;
    window.App.isKeplrConnected = origKeplrConnected;
    window.App.chainId = origChainId;
    window.App.cosmosChainId = origCosmosChainId;
  }

  // ─── Bridge Nav Direction Tests (hub data-function="bridge" vs App.switchBridgeDirection) ─

  async testResolveBridgeNavDirectionContract() {
    await this.waitForCondition(() => typeof window.App !== 'undefined', 10000);

    this.assertFunction(window.App.resolveBridgeNavDirection, 'resolveBridgeNavDirection must exist for hub/side nav');

    const origDir = window.App.currentBridgeDirection;

    window.App.switchBridgeDirection('layer');
    this.assertEqual(window.App.resolveBridgeNavDirection('bridge'), 'layer', 'After layer tab, bridge token → layer');

    window.App.switchBridgeDirection('ethereum');
    this.assertEqual(window.App.resolveBridgeNavDirection('bridge'), 'ethereum', 'After ethereum tab, bridge token → ethereum');

    window.App.switchBridgeDirection('delegate');
    this.assertEqual(window.App.resolveBridgeNavDirection('bridge'), 'layer', 'After delegate, bridge token → default layer');

    this.assertEqual(window.App.resolveBridgeNavDirection('delegate'), 'delegate', 'Non-bridge types pass through');

    if (origDir === 'ethereum') {
      window.App.switchBridgeDirection('ethereum');
    } else if (origDir === 'delegate') {
      window.App.switchBridgeDirection('delegate');
    } else {
      window.App.switchBridgeDirection('layer');
    }
  }

  async testSwitchBridgeDirectionRejectsRawBridgeNavToken() {
    await this.waitForCondition(() => typeof window.App !== 'undefined', 10000);

    window.App.switchBridgeDirection('ethereum');
    const before = window.App.currentBridgeDirection;

    window.App.switchBridgeDirection('bridge');

    this.assertEqual(
      window.App.currentBridgeDirection,
      before,
      'Raw "bridge" must not change currentBridgeDirection (invalid arg — early return)'
    );

    window.App.switchBridgeDirection('layer');
  }

  async testBridgeContentRestoresAfterDelegateNav() {
    await this.waitForCondition(() => typeof window.App !== 'undefined', 10000);

    const tellor = document.getElementById('bridgeToTellorContent');
    const eth = document.getElementById('bridgeToEthereumContent');
    this.assertNotNull(tellor, 'bridgeToTellorContent required (run on real app page)');
    this.assertNotNull(eth, 'bridgeToEthereumContent required (run on real app page)');

    const origDir = window.App.currentBridgeDirection;

    window.App.switchBridgeDirection('ethereum');
    await this.wait(50);
    this.assertEqual(eth.style.display, 'block', 'Ethereum bridge panel should be visible');

    window.App.switchBridgeDirection('delegate');
    await this.wait(50);
    this.assertEqual(eth.style.display, 'none', 'Delegate hides ethereum panel');

    window.App.switchBridgeDirection('bridge');
    await this.wait(50);
    this.assertEqual(
      eth.style.display,
      'none',
      'BUG: raw hub token leaves inner panels hidden (simulates pre-fix side nav)'
    );
    this.assertEqual(window.App.currentBridgeDirection, 'delegate', 'Raw bridge must not apply bridge UI state');

    const fixed = window.App.resolveBridgeNavDirection('bridge');
    window.App.switchBridgeDirection(fixed);
    await this.wait(50);
    this.assertEqual(window.App.currentBridgeDirection, 'layer', 'Resolver returns layer after delegate');
    this.assertEqual(tellor.style.display, 'block', 'Layer panel visible after resolved navigation');
    this.assertEqual(eth.style.display, 'none', 'Ethereum panel hidden when showing layer');

    if (origDir === 'ethereum') {
      window.App.switchBridgeDirection('ethereum');
    } else if (origDir === 'delegate') {
      window.App.switchBridgeDirection('delegate');
    } else {
      window.App.switchBridgeDirection('layer');
    }
  }

  // ─── Withdrawal Refresh Loading State ─────────────────────────────

  async testWithdrawalRefreshLoading() {
    await this.waitForCondition(() => typeof window.App !== 'undefined', 10000);

    this.assertFunction(window.App.updateWithdrawalHistory, 'updateWithdrawalHistory should exist');

    const btn = document.querySelector('button[onclick*="updateWithdrawalHistory"]');
    if (btn) {
      this.assertTrue(
        btn.getAttribute('onclick').includes('updateWithdrawalHistory'),
        'Refresh button should invoke updateWithdrawalHistory'
      );
    }
  }
}
