const { ethers } = require('ethers');

// Sepolia configuration
const SEPOLIA_RPC = 'https://sepolia.infura.io/v3/52474cef7b964b4fbf8e954a5dfa481b';
const BRIDGE_ADDRESS = '0x55355157703A44f7516FBB831333317E98944e32';
const TOKEN_ADDRESS = '0x80fc34a2f9FfE86F41580F47368289C402DEc660';

// Bridge ABI (minimal for checking state)
const BRIDGE_ABI = [
  {
    "inputs": [],
    "name": "bridgeState",
    "outputs": [{"internalType": "enum TokenBridge.BridgeState", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "depositLimit",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

async function checkSepoliaBridge() {
  try {
    const provider = new ethers.providers.JsonRpcProvider(SEPOLIA_RPC);
    
    console.log('🔍 Checking Sepolia Bridge Contract Status...\n');
    
    // Check if contract exists
    const code = await provider.getCode(BRIDGE_ADDRESS);
    if (code === '0x') {
      console.log('❌ Bridge contract not deployed on Sepolia');
      return;
    }
    console.log('✅ Bridge contract is deployed on Sepolia');
    
    // Create contract instance
    const bridgeContract = new ethers.Contract(BRIDGE_ADDRESS, BRIDGE_ABI, provider);
    
    // Check bridge state
    try {
      const bridgeState = await bridgeContract.bridgeState();
      console.log(`📊 Bridge State: ${bridgeState.toString()}`);
      if (bridgeState.toString() === '0') {
        console.log('✅ Bridge is active (state 0)');
      } else {
        console.log('❌ Bridge is not active');
      }
    } catch (error) {
      console.log('❌ Could not read bridge state:', error.message);
    }
    
    // Check deposit limit
    try {
      const depositLimit = await bridgeContract.depositLimit();
      console.log(`💰 Deposit Limit: ${ethers.utils.formatEther(depositLimit)} TRB`);
    } catch (error) {
      console.log('❌ Could not read deposit limit:', error.message);
    }
    
    // Check token contract
    const tokenCode = await provider.getCode(TOKEN_ADDRESS);
    if (tokenCode === '0x') {
      console.log('❌ Token contract not deployed on Sepolia');
    } else {
      console.log('✅ Token contract is deployed on Sepolia');
    }
    
  } catch (error) {
    console.error('❌ Error checking Sepolia bridge:', error.message);
  }
}

checkSepoliaBridge(); 