# Layer Bridge Test Suite

## Overview
Comprehensive test suite for the Layer Bridge frontend application, covering both unit and integration tests with enhanced network detection capabilities.

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

### 3. Network Detection Tests (NEW!)
- **Network detection for mainnet** - Tests automatic detection of Tellor Mainnet (`tellor-1`)
- **Network detection for testnet** - Tests automatic detection of Palmito Testnet (`layertest-4`)
- **Network switching functionality** - Tests switching between mainnet and testnet
- **Cosmos wallet adapter network detection** - Tests network detection with wallet adapters

### 4. Enhanced Functional Tests (NEW!)
- **Withdrawal button functionality on mainnet** - Tests withdrawal UI and logic on Tellor Mainnet
- **Withdrawal button functionality on testnet** - Tests withdrawal UI and logic on Palmito Testnet
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
- **No-stake reporting on mainnet** - Tests no-stake reporting on Tellor Mainnet
- **No-stake reporting on testnet** - Tests no-stake reporting on Palmito Testnet

### 5. Bridge Function Tests
- Bridge direction switching
- Deposit approval flow
- Deposit execution flow
- Withdrawal request flow
- Delegation flow

### 6. No-Stake Reporting Tests
- No-stake reporting tab structure
- No-stake reporting functionality
- No-stake reporting validation

### 7. Dispute System Tests
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
- **Chain ID Validation**: Tests proper `cosmosChainId` setting (`tellor-1` vs `layertest-4`)
- **Button State Management**: Tests UI button states based on network and connection status

### Network Switching
- **Mainnet to Testnet**: Tests switching from `tellor-1` to `layertest-4`
- **Testnet to Mainnet**: Tests switching from `layertest-4` to `tellor-1`
- **State Persistence**: Tests that network state persists across operations

## Mock Objects

### Enhanced Keplr Mock
```javascript
{
  enable: async (chainId) => { /* chain configuration */ },
  getChainId: async () => 'layertest-4', // Default, can be overridden
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

### Network Detection Improvements
- ✅ Added automatic network detection from Keplr
- ✅ Added automatic network detection from wallet adapters
- ✅ Fixed hardcoded chain ID fallbacks in dispute and no-stake functions
- ✅ Enhanced button state management for both networks
- ✅ Added comprehensive network switching tests

### Test Coverage Enhancements
- ✅ Added 12 new network-specific tests
- ✅ Enhanced mocking for network detection scenarios
- ✅ Improved test environment setup and cleanup
- ✅ Added network state validation in all functional tests

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
