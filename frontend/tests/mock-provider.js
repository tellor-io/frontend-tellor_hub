// Mock Provider for Testing
export class MockProvider {
  constructor() {
    this.originalEthereum = window.ethereum;
    this.originalKeplr = window.keplr;
    this.originalCosmostation = window.cosmostation;
    this.originalLeap = window.leap;
    this.originalFetch = window.fetch;
  }

  async setupWalletMocks() {
    // Mock Ethereum provider
    window.ethereum = {
      isMetaMask: true,
      request: async (request) => {
        switch (request.method) {
          case 'eth_requestAccounts':
            return ['0x1234567890123456789012345678901234567890'];
          case 'eth_accounts':
            return ['0x1234567890123456789012345678901234567890'];
          case 'eth_chainId':
            return '0x1'; // Mainnet
          case 'eth_getBalance':
            return '0x1000000000000000000'; // 1 ETH
          default:
            return null;
        }
      },
      on: () => {},
      removeListener: () => {},
      isConnected: () => true
    };

    // Mock Keplr
    window.keplr = {
      enable: async (chainId) => true,
      getKey: async (chainId) => ({
        name: 'Test Account',
        address: 'tellor1py3fs8t0s0tde3slqfn65qlmgw64x60q5a7w82',
        pubKey: new Uint8Array([1, 2, 3, 4]),
        addressHex: '0x1234567890123456789012345678901234567890',
        algo: 'secp256k1'
      }),
      getOfflineSigner: (chainId) => ({
        getAccounts: async () => [{
          address: 'tellor1py3fs8t0s0tde3slqfn65qlmgw64x60q5a7w82',
          pubkey: new Uint8Array([1, 2, 3, 4])
        }],
        signDirect: async () => ({
          signature: {
            signature: new Uint8Array([1, 2, 3, 4]),
            pub_key: { type: 'tendermint/PubKeySecp256k1', value: 'test' }
          },
          signed: { chainId: 'layertest-4', accountNumber: '0', sequence: '0' }
        })
      }),
      experimentalSuggestChain: async () => true,
      getChainId: async () => 'layertest-4'
    };

    // Mock Cosmostation
    window.cosmostation = {
      ethereum: {
        request: async (request) => {
          switch (request.method) {
            case 'eth_requestAccounts':
              return ['0x1234567890123456789012345678901234567890'];
            case 'eth_accounts':
              return ['0x1234567890123456789012345678901234567890'];
            default:
              return null;
          }
        }
      },
      cosmos: {
        request: async (request) => {
          switch (request.method) {
            case 'cos_requestAccount':
              return { address: 'tellor1py3fs8t0s0tde3slqfn65qlmgw64x60q5a7w82' };
            default:
              return null;
          }
        }
      }
    };

    // Mock Leap
    window.leap = {
      enable: async (chainId) => true,
      getKey: async (chainId) => ({
        address: 'tellor1py3fs8t0s0tde3slqfn65qlmgw64x60q5a7w82'
      }),
      getOfflineSigner: (chainId) => ({
        getAccounts: async () => [{
          address: 'tellor1py3fs8t0s0tde3slqfn65qlmgw64x60q5a7w82'
        }]
      })
    };
  }

  async setupNetworkMocks() {
    // Mock fetch for network calls
    window.fetch = async (url, options) => {
      if (url.includes('node-palmito.tellorlayer.com')) {
        // Mock Layer node responses
        if (url.includes('/rpc')) {
          return new Response(JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            result: {
              block: { header: { height: '1000' } },
              validators: [
                { address: 'tellorvaloper1...', voting_power: '1000000' }
              ]
            }
          }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
      }
      
      if (url.includes('sepolia')) {
        // Mock Sepolia responses
        return new Response(JSON.stringify({
          status: '1',
          message: 'OK',
          result: '1000000000000000000' // 1 TRB
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      
      // Default mock response
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    };
  }

  restore() {
    // Restore original providers
    if (this.originalEthereum) {
      window.ethereum = this.originalEthereum;
    }
    if (this.originalKeplr) {
      window.keplr = this.originalKeplr;
    }
    if (this.originalCosmostation) {
      window.cosmostation = this.originalCosmostation;
    }
    if (this.originalLeap) {
      window.leap = this.originalLeap;
    }
    if (this.originalFetch) {
      window.fetch = this.originalFetch;
    }
  }
}
