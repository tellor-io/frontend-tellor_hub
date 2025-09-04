// Base Test Suite Class
export class TestSuite {
  constructor() {
    this.assertions = 0;
    this.failures = 0;
    this.spies = new Map();
    this.mocks = new Map();
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

  // Mocking and Spying Utilities
  spyOn(object, methodName) {
    const originalMethod = object[methodName];
    const calls = [];
    
    object[methodName] = (...args) => {
      calls.push({
        args,
        timestamp: Date.now(),
        returnValue: originalMethod ? originalMethod.apply(object, args) : undefined
      });
    };
    
    const spy = {
      calls,
      callCount: () => calls.length,
      wasCalled: () => calls.length > 0,
      wasCalledWith: (...expectedArgs) => {
        return calls.some(call => 
          call.args.length === expectedArgs.length &&
          call.args.every((arg, i) => arg === expectedArgs[i])
        );
      },
      getCall: (index) => calls[index] || null,
      restore: () => {
        object[methodName] = originalMethod;
      }
    };
    
    this.spies.set(`${object.constructor.name}.${methodName}`, spy);
    return spy;
  }

  mockProvider(providerName, methods) {
    const mock = {
      methods: {},
      calls: [],
      ...methods
    };
    
    // Add call tracking to all methods
    Object.keys(mock.methods).forEach(methodName => {
      const originalMethod = mock.methods[methodName];
      mock.methods[methodName] = (...args) => {
        mock.calls.push({
          method: methodName,
          args,
          timestamp: Date.now()
        });
        return originalMethod(...args);
      };
    });
    
    this.mocks.set(providerName, mock);
    return mock;
  }

  mockContract(contractName, methods) {
    const mock = {
      methods: {},
      calls: [],
      events: {},
      ...methods
    };
    
    // Add call tracking to all methods
    Object.keys(mock.methods).forEach(methodName => {
      const originalMethod = mock.methods[methodName];
      mock.methods[methodName] = (...args) => {
        mock.calls.push({
          method: methodName,
          args,
          timestamp: Date.now()
        });
        return originalMethod(...args);
      };
    });
    
    this.mocks.set(contractName, mock);
    return mock;
  }

  // Mock MetaMask Provider
  mockMetaMaskProvider() {
    const provider = {
      request: async (method, params = []) => {
        switch (method) {
          case 'eth_requestAccounts':
            return ['0x1234567890123456789012345678901234567890'];
          case 'eth_accounts':
            return ['0x1234567890123456789012345678901234567890'];
          case 'eth_chainId':
            return '0x1'; // mainnet
          case 'eth_getBalance':
            return '0x1000000000000000000'; // 1 ETH
          case 'eth_call':
            return '0x0000000000000000000000000000000000000000000000000000000000000000';
          case 'eth_estimateGas':
            return '0x5208'; // 21000 gas
          case 'eth_sendTransaction':
            return '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
          default:
            throw new Error(`Unsupported method: ${method}`);
        }
      },
      on: (event, callback) => {
        // Mock event handling
        if (event === 'accountsChanged') {
          setTimeout(() => callback(['0x1234567890123456789012345678901234567890']), 100);
        }
        if (event === 'chainChanged') {
          setTimeout(() => callback('0x1'), 100);
        }
      },
      removeListener: () => {},
      isMetaMask: true,
      selectedAddress: '0x1234567890123456789012345678901234567890',
      networkVersion: '1'
    };
    
    this.mocks.set('metaMask', provider);
    return provider;
  }

  // Mock Keplr Provider
  mockKeplrProvider() {
    const provider = {
      enable: async (chainId) => {
        return {
          name: 'Test Chain',
          chainId: chainId || 'test-chain-1',
          rpc: 'https://test-rpc.com',
          rest: 'https://test-rest.com'
        };
      },
      getChainId: async () => {
        // Default to testnet, but can be overridden
        return 'layertest-4';
      },
      getKey: async (chainId) => {
        return {
          name: 'Test Wallet',
          address: 'tellor1testaddress123456789012345678901234567890',
          pubKey: new Uint8Array([1, 2, 3, 4, 5]),
          addressBytes: new Uint8Array([1, 2, 3, 4, 5])
        };
      },
      getOfflineSigner: (chainId) => {
        return {
          getAccounts: async () => [{
            address: 'tellor1testaddress123456789012345678901234567890',
            pubkey: new Uint8Array([1, 2, 3, 4, 5])
          }],
          signAmino: async (signer, signDoc) => ({
            signed: signDoc,
            signature: {
              pub_key: { type: 'tendermint/PubKeySecp256k1', value: 'test' },
              signature: 'test-signature'
            }
          }),
          signDirect: async (signer, signDoc) => ({
            signature: {
              pub_key: { type: 'tendermint/PubKeySecp256k1', value: 'test' },
              signature: 'test-signature'
            },
            signed: signDoc
          })
        };
      },
      signAmino: async (chainId, signer, signDoc) => {
        return {
          signed: signDoc,
          signature: {
            pub_key: { type: 'tendermint/PubKeySecp256k1', value: 'test' },
            signature: 'test-signature'
          }
        };
      },
      signDirect: async (chainId, signer, signDoc) => {
        return {
          signature: {
            pub_key: { type: 'tendermint/PubKeySecp256k1', value: 'test' },
            signature: 'test-signature'
          },
          signed: signDoc
        };
      },
      experimentalSuggestChain: async (chainConfig) => {
        return true;
      }
    };
    
    this.mocks.set('keplr', provider);
    return provider;
  }

  // Mock CosmJS Stargate Client
  mockCosmjsStargate() {
    const client = {
      connectWithSigner: async (rpcEndpoint, offlineSigner, options = {}) => {
        return {
          signAndBroadcastDirect: async (address, messages, fee, memo) => {
            return {
              code: 0,
              txhash: 'test-tx-hash-1234567890abcdef',
              height: 12345,
              gasUsed: 50000,
              gasWanted: 100000
            };
          },
          getBalance: async (address) => {
            return {
              amount: '1000000000', // 1000 TRB in micro units
              denom: 'loya'
            };
          }
        };
      }
    };
    
    this.mocks.set('cosmjsStargate', client);
    return client;
  }

  // Mock Web3 Instance
  mockWeb3Instance() {
    const web3 = {
      eth: {
        accounts: ['0x1234567890123456789012345678901234567890'],
        getBalance: async (address) => '1000000000000000000',
        getGasPrice: async () => '20000000000',
        estimateGas: async (tx) => 21000,
        sendTransaction: async (tx) => ({
          transactionHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
        }),
        Contract: class MockContract {
          constructor(abi, address) {
            this.address = address;
            this.methods = {};
            
            // Auto-generate methods from ABI
            abi.forEach(item => {
              if (item.type === 'function') {
                this.methods[item.name] = (...args) => ({
                  call: async (options) => {
                    // Mock return values based on method name
                    if (item.name === 'balanceOf') return '1000000000000000000';
                    if (item.name === 'allowance') return '0';
                    if (item.name === 'totalSupply') return '1000000000000000000000';
                    return '0';
                  },
                  send: async (options) => ({
                    transactionHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
                    gasUsed: 21000,
                    events: {}
                  }),
                  estimateGas: async (options) => 21000
                });
              }
            });
          }
        }
      },
      utils: {
        toWei: (value, unit = 'ether') => {
          const multipliers = { wei: 1, kwei: 1000, mwei: 1000000, gwei: 1000000000, ether: 1000000000000000000 };
          return (parseFloat(value) * multipliers[unit]).toString();
        },
        fromWei: (value, unit = 'ether') => {
          const multipliers = { wei: 1, kwei: 1000, mwei: 1000000, gwei: 1000000000, ether: 1000000000000000000 };
          return (parseFloat(value) / multipliers[unit]).toString();
        },
        toBN: (value) => ({
          toString: () => value.toString(),
          toNumber: () => parseFloat(value),
          add: (other) => ({ toString: () => (parseFloat(value) + parseFloat(other)).toString() }),
          sub: (other) => ({ toString: () => (parseFloat(value) - parseFloat(other)).toString() }),
          mul: (other) => ({ toString: () => (parseFloat(value) * parseFloat(other)).toString() }),
          div: (other) => ({ toString: () => (parseFloat(value) / parseFloat(other)).toString() })
        })
      }
    };
    
    this.mocks.set('web3', web3);
    return web3;
  }

  // Mock Ethers Instance
  mockEthersInstance() {
    const ethers = {
      providers: {
        Web3Provider: class MockWeb3Provider {
          constructor(provider) {
            this.provider = provider;
            this.listenerCount = 0;
          }
          
          async getSigner() {
            return {
              getAddress: async () => '0x1234567890123456789012345678901234567890',
              signMessage: async (message) => '0xsignature',
              signTransaction: async (tx) => '0xsignedtx',
              connect: (provider) => this
            };
          }
          
          async getNetwork() {
            return { chainId: 1, name: 'mainnet' };
          }
          
          async getBalance(address) {
            return { _hex: '0x1000000000000000000', _isBigNumber: true };
          }
          
          on(event, callback) {
            this.listenerCount++;
            if (event === 'network') {
              setTimeout(() => callback({ chainId: 1 }), 100);
            }
          }
          
          removeAllListeners() {
            this.listenerCount = 0;
          }
        }
      },
      utils: {
        parseEther: (value) => ({ _hex: (parseFloat(value) * 1e18).toString(16), _isBigNumber: true }),
        formatEther: (value) => (parseFloat(value) / 1e18).toString(),
        parseUnits: (value, unit) => ({ _hex: value.toString(16), _isBigNumber: true }),
        formatUnits: (value, unit) => value.toString(),
        hexlify: (value) => `0x${value.toString(16)}`,
        getAddress: (address) => address.toLowerCase()
      },
      Contract: class MockEthersContract {
        constructor(address, abi, signer) {
          this.address = address;
          this.signer = signer;
          this.filters = {};
          
          // Auto-generate methods from ABI
          abi.forEach(item => {
            if (item.type === 'function') {
              this[item.name] = async (...args) => {
                if (item.stateMutability === 'view' || item.stateMutability === 'pure') {
                  // Mock return values for view functions
                  if (item.name === 'balanceOf') return { _hex: '0x1000000000000000000', _isBigNumber: true };
                  if (item.name === 'allowance') return { _hex: '0x0', _isBigNumber: true };
                  if (item.name === 'totalSupply') return { _hex: '0x1000000000000000000000', _isBigNumber: true };
                  return { _hex: '0x0', _isBigNumber: true };
                } else {
                  // Mock return values for state-changing functions
                  return {
                    hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
                    wait: async () => ({
                      hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
                      blockNumber: 12345,
                      gasUsed: { _hex: '0x5208', _isBigNumber: true },
                      events: []
                    })
                  };
                }
              };
            }
          });
        }
        
        on(event, callback) {
          this.filters[event] = callback;
        }
        
        off(event) {
          delete this.filters[event];
        }
      }
    };
    
    this.mocks.set('ethers', ethers);
    return ethers;
  }

  // Mock DisputeProposer Instance
  mockDisputeProposer() {
    const disputeProposer = {
      init: async () => true,
      isConnected: false,
      currentAddress: null,
      currentNetwork: null,
      
      getWalletStatus: async () => ({
        isConnected: true,
        address: 'tellor1testaddress123456789012345678901234567890',
        walletType: 'keplr'
      }),
      
      disconnectWallet: () => {
        disputeProposer.isConnected = false;
        disputeProposer.currentAddress = null;
      },
      
      proposeDispute: async (disputedReporter, reportMetaId, reportQueryId, disputeCategory, fee, payFromBond = false) => {
        return {
          success: true,
          transactionHash: '0xdispute1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          height: 12345,
          gasUsed: 150000,
          gasWanted: 200000
        };
      },
      
      voteOnDispute: async (disputeId, voteChoice) => {
        return {
          success: true,
          transactionHash: '0xvote1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          height: 12346,
          gasUsed: 100000,
          gasWanted: 150000
        };
      },
      
      addFeeToDispute: async (disputeId, amount, payFromBond = false) => {
        return {
          success: true,
          transactionHash: '0xaddfee1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          height: 12347,
          gasUsed: 80000,
          gasWanted: 120000
        };
      },
      
      getBalance: async () => 1000.0, // 1000 TRB
      
      getDisputeInfo: async (disputeId) => ({
        disputeId: disputeId.toString(),
        disputeStatus: 'DISPUTE_STATUS_VOTING',
        metadata: {
          dispute_status: 'DISPUTE_STATUS_VOTING',
          dispute_fee: '1000000000', // 1000 TRB in micro units
          fee_total: '500000000',    // 500 TRB paid
          slash_amount: '1000000000',
          dispute_start_time: '2024-01-01T00:00:00Z',
          dispute_end_time: '2024-01-08T00:00:00Z',
          initial_evidence: {
            reporter: 'tellor1reporter123456789012345678901234567890',
            query_id: '0x1234567890abcdef'
          }
        }
      }),
      
      getVotingInfo: async (disputeId) => ({
        disputeId: disputeId,
        status: 'DISPUTE_STATUS_VOTING',
        endTime: '2024-01-08T00:00:00Z',
        message: 'Mock voting info'
      }),
      
      hasVoted: async (disputeId) => ({
        hasVoted: false,
        vote: null
      }),
      
      checkVotingPower: async () => ({
        hasVotingPower: true,
        reason: 'reporter_power',
        details: 'Unjailed reporter with power: 100'
      }),
      
      getAllDisputes: async () => [
        {
          disputeId: '1',
          metadata: {
            dispute_status: 'DISPUTE_STATUS_VOTING',
            dispute_fee: '1000000000',
            fee_total: '500000000',
            slash_amount: '1000000000',
            initial_evidence: {
              reporter: 'tellor1reporter123456789012345678901234567890',
              query_id: '0x1234567890abcdef'
            }
          }
        },
        {
          disputeId: '2',
          metadata: {
            dispute_status: 'DISPUTE_STATUS_RESOLVED',
            dispute_fee: '2000000000',
            fee_total: '2000000000',
            slash_amount: '2000000000',
            initial_evidence: {
              reporter: 'tellor1reporter987654321098765432109876543210',
              query_id: '0xfedcba0987654321'
            }
          }
        }
      ],
      
      getAllDisputesForQuery: async () => ({
        disputes: [
          {
            disputeId: '1',
            displayData: {
              disputeId: '1',
              disputeCategory: 'MINOR',
              disputeStatus: 'DISPUTE_STATUS_VOTING',
              disputeFee: '1000.000000',
              feeTotal: '500.000000',
              feeRemaining: '500.000000',
              reporter: 'tellor1reporter123456789012345678901234567890',
              queryId: '0x1234567890abcdef'
            }
          }
        ],
        pagination: { total: "1" }
      }),
      
      getOpenDisputes: async () => [
        {
          id: '1',
          status: 'DISPUTE_STATUS_VOTING',
          feeRequired: '1000000000',
          feePaid: '500000000',
          feeRemaining: 500000000,
          canVote: true
        }
      ],
      
      validateDisputeId: (disputeId) => {
        const id = parseInt(disputeId);
        return !isNaN(id) && id > 0;
      },
      
      validateVoteChoice: (voteChoice) => {
        const validChoices = ['vote-support', 'vote-against', 'vote-invalid'];
        return validChoices.includes(voteChoice);
      },
      
      isValidAddress: (address) => {
        return typeof address === 'string' && 
               (address.startsWith('tellor1') || address.startsWith('layer1')) &&
               address.length >= 20 && address.length <= 50;
      },
      
      validateReportMetaId: (reportMetaId) => {
        return typeof reportMetaId === 'string' && reportMetaId.trim() !== '';
      },
      
      validateReportQueryId: (reportQueryId) => {
        return typeof reportQueryId === 'string' && reportQueryId.trim() !== '';
      },
      
      convertTrbToMicroUnits: (trbAmount) => {
        return Math.floor(parseFloat(trbAmount) * 1000000).toString();
      },
      
      convertMicroUnitsToTrb: (microUnits) => {
        return (parseInt(microUnits) / 1000000).toFixed(6);
      },
      
      getConnectionStatus: () => ({
        isConnected: disputeProposer.isConnected,
        address: disputeProposer.currentAddress,
        network: disputeProposer.currentNetwork
      })
    };
    
    this.mocks.set('disputeProposer', disputeProposer);
    return disputeProposer;
  }

  // Mock CosmJS Stargate Client
  mockStargateClient() {
    const client = {
      connectWithSigner: async (rpcEndpoint, offlineSigner) => ({
        signAndBroadcastDirect: async (address, messages, fee, memo) => ({
          code: 0,
          transactionHash: '0xstargate1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          height: 12345,
          gasUsed: 150000,
          gasWanted: 200000,
          tx_response: {
            txhash: '0xstargate1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
            height: 12345,
            gas_used: '150000',
            gas_wanted: '200000'
          }
        }),
        
        getBalance: async (address, denom) => ({
          amount: '1000000000', // 1000 TRB in micro units
          denom: denom || 'loya'
        }),
        
        getAllBalances: async (address) => [
          {
            amount: '1000000000',
            denom: 'loya'
          }
        ],
        
        disconnect: () => {}
      })
    };
    
    this.mocks.set('stargateClient', client);
    return client;
  }

  // Mock Layer Proto Definitions
  mockLayerProto() {
    const layerProto = {
      createMsgProposeDispute: (creator, disputedReporter, reportMetaId, reportQueryId, disputeCategory, fee, payFromBond) => ({
        typeUrl: '/layer.dispute.MsgProposeDispute',
        value: {
          creator,
          disputedReporter,
          reportMetaId,
          reportQueryId,
          disputeCategory,
          fee,
          payFromBond
        }
      }),
      
      createMsgVote: (voter, disputeId, voteChoice) => ({
        typeUrl: '/layer.dispute.MsgVote',
        value: {
          voter,
          id: disputeId,
          vote: layerProto.convertVoteChoiceToEnum(voteChoice)
        }
      }),
      
      createMsgAddFeeToDispute: (creator, disputeId, amount, payFromBond) => ({
        typeUrl: '/layer.dispute.MsgAddFeeToDispute',
        value: {
          creator,
          disputeId,
          amount,
          payFromBond
        }
      }),
      
      convertVoteChoiceToEnum: (voteChoice) => {
        const voteMap = {
          'vote-support': 1,
          'vote-against': 2,
          'vote-invalid': 3
        };
        return voteMap[voteChoice] || 0;
      }
    };
    
    this.mocks.set('layerProto', layerProto);
    return layerProto;
  }

  // Mock Contract Methods
  mockContractMethods(contractName, methods) {
    const mock = this.mocks.get(contractName) || { methods: {}, calls: [] };
    
    Object.keys(methods).forEach(methodName => {
      mock.methods[methodName] = methods[methodName];
    });
    
    this.mocks.set(contractName, mock);
    return mock;
  }

  // Assertion helpers for mocks
  assertMethodCalled(contractName, methodName, expectedCallCount = 1) {
    const mock = this.mocks.get(contractName);
    if (!mock) {
      throw new Error(`Contract ${contractName} not mocked`);
    }
    
    const calls = mock.calls.filter(call => call.method === methodName);
    this.assertEqual(calls.length, expectedCallCount, 
      `Expected ${methodName} to be called ${expectedCallCount} times, but was called ${calls.length} times`);
  }

  assertMethodCalledWith(contractName, methodName, expectedArgs) {
    const mock = this.mocks.get(contractName);
    if (!mock) {
      throw new Error(`Contract ${contractName} not mocked`);
    }
    
    const calls = mock.calls.filter(call => call.method === methodName);
    this.assert(calls.length > 0, `Method ${methodName} was not called`);
    
    const call = calls[calls.length - 1]; // Get the last call
    this.assertEqual(call.args.length, expectedArgs.length,
      `Expected ${expectedArgs.length} arguments, got ${call.args.length}`);
    
    expectedArgs.forEach((expectedArg, index) => {
      this.assertEqual(call.args[index], expectedArg,
        `Argument ${index} mismatch: expected ${expectedArg}, got ${call.args[index]}`);
    });
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
    // Restore all spied methods
    this.spies.forEach(spy => spy.restore());
    this.spies.clear();
    
    // Clear all mocks
    this.mocks.clear();
    
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
