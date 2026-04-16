# Layer Bridge Test Suite

## Overview
Comprehensive test suite for the Layer Bridge frontend application, covering both unit and integration tests with enhanced network detection capabilities.

## Running tests manually (recommended)

1. From the repo root, start the static server: `npm run dev` (serves the `frontend/` folder, default **http://localhost:8000**).
2. In your browser, open **http://localhost:8000/tests/test-suite.html** (same origin as the app so paths resolve correctly).
3. Use **Run All Tests**, or **Run Unit Tests Only** / **Run Integration Tests Only**. Leave **Mock wallet connections** and **Mock network calls** checked unless you intentionally want real wallets or network.

The in-page suite in `test-suite.html` is self-contained. The larger ES-module suites (`unit-tests.js`, `integration-tests.js`, `test-runner.js`) are meant to be driven from a full app context if you wire them up later; they are not loaded by `test-suite.html` today.

Optional: `frontend/tests/run-tests.js` can automate the same HTML via Puppeteer from the command line if you install `puppeteer`; that path is optional, not required.

## Test Categories

### 1. Core App Tests
- App object existence and properties
- App initialization structure
- Web3 provider initialization
- Contract initialization

### 2. Wallet Connection Tests
- MetaMask connection structure
- Keplr connection structure
- Wallet disconnection methods

### 3. Network Detection Tests (UPDATED!)
- **Network detection for mainnet** - Tests automatic detection of Tellor Mainnet (`tellor-1`)
- **Network detection for testnet** - Tests automatic detection of Palmito Testnet (`layertest-5`)
- **Network switching functionality** - Tests switching between mainnet and testnet
- **Cosmos wallet adapter network detection** - Tests network detection with wallet adapters
- **Network switching with isNetworkSwitching flag** - Tests the new network switching flag functionality
- **Wallet adapter switchToChain method** - Tests the new chain switching method in wallet adapter

### 4. Enhanced Functional Tests (UPDATED!)
- **Withdrawal button functionality on mainnet** - Tests withdrawal UI and logic on Tellor Mainnet
- **Withdrawal button functionality on testnet** - Tests withdrawal UI and logic on Palmito Testnet
- **Etherscan URL generation for mainnet** - Tests correct Etherscan URL generation for mainnet transactions
- **Etherscan URL generation for testnet** - Tests correct Etherscan URL generation for testnet transactions
- **Request attestation with correct RPC endpoints** - Tests that request attestation uses the correct RPC endpoints
- **Withdrawal button integration test (mainnet)** - Comprehensive integration test for withdrawal button state management
- **Withdrawal button always enabled test** - Tests that withdrawal button stays enabled regardless of input validation
- **Wallet connection UI updates test** - Tests UI updates after wallet connection/disconnection
- **Network switching UI updates test** - Tests UI updates when switching between mainnet and testnet
- **Delegate button functionality on mainnet** - Tests delegation UI and logic on Tellor Mainnet
- **Delegate button functionality on testnet** - Tests delegation UI and logic on Palmito Testnet
- **Validator fetching and dropdown population** - Tests validator data fetching and dropdown population
- **Reporter fetching and dropdown population** - Tests reporter data fetching and dropdown population
- **Current delegations status display** - Tests current delegation status display and formatting
- **Current reporter status display** - Tests current reporter status display and formatting
- **Delegations dropdown toggle functionality** - Tests delegations dropdown expand/collapse behavior
- **Copy to clipboard functionality** - Tests address copying functionality with tooltips
- **Reporter selection functionality** - Tests reporter selection transaction flow
- **Network switching for delegate functions** - Tests network-specific endpoint usage for delegate functions
- **Dispute functions on mainnet** - Tests dispute functionality on Tellor Mainnet
- **Dispute functions on testnet** - Tests dispute functionality on Palmito Testnet

### 5. Bridge Function Tests
- Bridge direction switching
- Deposit approval flow
- Deposit execution flow
- Withdrawal request flow
- Delegation flow

### 6. Dispute System Tests
- Dispute proposer structure
- Dispute proposal functionality
- Dispute voting functionality
- Dispute fee management
- Dispute validation

## Network Detection Features Tested

### Automatic Network Detection
- **Keplr Chain ID Detection**: Tests `window.keplr.getChainId()` for automatic network detection
- **Wallet Adapter Detection**: Tests `window.cosmosWalletAdapter.getChainId()` for wallet adapter networks
- **Fallback Handling**: Tests graceful fallback to testnet when detection fails

### Network-Specific Functionality
- **RPC Endpoint Selection**: Tests correct endpoint selection based on detected network
  - Mainnet: `https://mainnet.tellorlayer.com`
  - Testnet: `https://node-palmito.tellorlayer.com`
- **Chain ID Validation**: Tests proper `cosmosChainId` setting (`tellor-1` vs `layertest-5`)
- **Button State Management**: Tests UI button states based on network and connection status

### Network Switching
- **Mainnet to Testnet**: Tests switching from `tellor-1` to `layertest-5`
- **Testnet to Mainnet**: Tests switching from `layertest-5` to `tellor-1`
- **State Persistence**: Tests that network state persists across operations

## Mock Objects

### Enhanced Keplr Mock
```javascript
{
  enable: async (chainId) => { /* chain configuration */ },
  getChainId: async () => 'layertest-5', // Default, can be overridden
  getOfflineSigner: (chainId) => { /* signer with accounts */ },
  experimentalSuggestChain: async (chainConfig) => true
}
```

### CosmJS Stargate Mock
```javascript
{
  connectWithSigner: async (rpcEndpoint, offlineSigner, options) => {
    return {
      signAndBroadcastDirect: async (address, messages, fee, memo) => {
        return { code: 0, txhash: 'test-tx-hash', height: 12345 };
      }
    };
  }
}
```

### Wallet Adapter Mock
```javascript
{
  isConnected: () => true,
  getChainId: async () => 'tellor-1',
  connectToWallet: async (walletType) => ({ address, walletName }),
  getOfflineSigner: () => { /* signer implementation */ }
}
```

## Running Tests

### All Tests
```bash
npm test
```

### Unit Tests Only
```bash
npm run test:unit
```

### Integration Tests Only
```bash
npm run test:integration
```

### Specific Test Categories
```bash
# Network detection tests only
npm run test:network

# Functional tests only
npm run test:functional
```

## Test Environment Setup

### Prerequisites
- Node.js 16+
- Modern browser with ES6 support
- No actual wallet connections required (all mocked)

### Environment Variables
```bash
TEST_NETWORK=testnet  # or mainnet
TEST_TIMEOUT=10000    # milliseconds
DEBUG_TESTS=true      # enable detailed logging
```

## Test Results

### Success Criteria
- All network detection tests pass
- Button states correctly reflect network and connection status
- Functions use correct RPC endpoints based on detected network
- Network switching works seamlessly
- Fallback mechanisms work when detection fails

### Coverage
- **Network Detection**: 100% coverage of mainnet/testnet detection
- **UI State Management**: 100% coverage of button states
- **Function Calls**: 100% coverage of network-specific function calls
- **Error Handling**: 100% coverage of network detection failures

## Recent Updates

### Bug Prevention Tests (NEW!)
- ✅ Added comprehensive integration tests for withdrawal button state management
- ✅ Added specific test for input field validation bug (ethStakeAmount vs stakeAmount)
- ✅ Added wallet connection UI update tests
- ✅ Added network switching UI update tests
- ✅ Enhanced test coverage to prevent similar bugs in the future

### Network Detection Improvements
- ✅ Added automatic network detection from Keplr
- ✅ Added automatic network detection from wallet adapters
- ✅ Fixed hardcoded chain ID fallbacks in dispute-related functions
- ✅ Enhanced button state management for both networks
- ✅ Added comprehensive network switching tests

### Test Coverage Enhancements
- ✅ Added 16 new network-specific and integration tests
- ✅ Enhanced mocking for network detection scenarios
- ✅ Improved test environment setup and cleanup
- ✅ Added network state validation in all functional tests
- ✅ Added cross-file integration testing (app.js + index.html)

## Troubleshooting

### Common Issues
1. **Network Detection Fails**: Ensure Keplr mock has `getChainId` method
2. **Button States Incorrect**: Check `App.cosmosChainId` and `App.isKeplrConnected`
3. **Function Calls Wrong Network**: Verify RPC endpoint selection logic

### Debug Mode
Enable debug logging:
```javascript
window.TEST_DEBUG = true;
```

This will log detailed information about:
- Network detection attempts
- Chain ID assignments
- Button state changes
- Function call parameters
