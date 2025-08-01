const { ethers } = require('ethers');

// Mainnet configuration
const MAINNET_RPC = 'https://mainnet.infura.io/v3/52474cef7b964b4fbf8e954a5dfa481b';
const BRIDGE_ADDRESS = '0x5589e306b1920F009979a50B88caE32aecD471E4';
const TOKEN_ADDRESS = '0x88dF592F8eb5D7Bd38bFeF7dEb0fBc02cf3778a0';

// You'll need to replace this with your actual wallet address
const WALLET_ADDRESS = '0x...'; // Replace with your address

// ABIs
const TOKEN_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "owner", "type": "address"},
      {"internalType": "address", "name": "spender", "type": "address"}
    ],
    "name": "allowance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

const BRIDGE_ABI = [
  {
    "inputs": [
      {"internalType": "uint256", "name": "_amount", "type": "uint256"},
      {"internalType": "uint256", "name": "_tip", "type": "uint256"},
      {"internalType": "string", "name": "_layerRecipient", "type": "string"}
    ],
    "name": "depositToLayer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

async function debugMainnetIssue() {
  try {
    const provider = new ethers.providers.JsonRpcProvider(MAINNET_RPC);
    
    console.log('🔍 Debugging Mainnet Bridge Transaction Issue...\n');
    
    if (WALLET_ADDRESS === '0x...') {
      console.log('⚠️  Please replace WALLET_ADDRESS with your actual address in the script');
      console.log('   Then run this script again to check your specific balances and approvals');
      return;
    }
    
    // Create contract instances
    const tokenContract = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, provider);
    const bridgeContract = new ethers.Contract(BRIDGE_ADDRESS, BRIDGE_ABI, provider);
    
    // Check TRB balance
    const balance = await tokenContract.balanceOf(WALLET_ADDRESS);
    console.log(`💰 Your TRB Balance: ${ethers.utils.formatEther(balance)} TRB`);
    
    // Check allowance
    const allowance = await tokenContract.allowance(WALLET_ADDRESS, BRIDGE_ADDRESS);
    console.log(`✅ Bridge Allowance: ${ethers.utils.formatEther(allowance)} TRB`);
    
    // Check if allowance is sufficient for 0.5 TRB
    const requiredAmount = ethers.utils.parseEther('0.5');
    if (allowance.gte(requiredAmount)) {
      console.log('✅ Allowance is sufficient for 0.5 TRB deposit');
    } else {
      console.log('❌ Allowance is insufficient for 0.5 TRB deposit');
      console.log(`   Required: 0.5 TRB, Allowed: ${ethers.utils.formatEther(allowance)} TRB`);
    }
    
    // Check if balance is sufficient
    if (balance.gte(requiredAmount)) {
      console.log('✅ Balance is sufficient for 0.5 TRB deposit');
    } else {
      console.log('❌ Balance is insufficient for 0.5 TRB deposit');
      console.log(`   Required: 0.5 TRB, Available: ${ethers.utils.formatEther(balance)} TRB`);
    }
    
    // Estimate gas for the transaction
    const recipient = 'tellor1072q49v0sacgmlq4hkwzhryz5zefgl73jg5493';
    const amount = ethers.utils.parseEther('0.5');
    const tip = ethers.utils.parseEther('0');
    
    try {
      const gasEstimate = await bridgeContract.estimateGas.depositToLayer(amount, tip, recipient, {
        from: WALLET_ADDRESS
      });
      console.log(`⛽ Estimated Gas: ${gasEstimate.toString()}`);
      console.log('✅ Gas estimation successful');
    } catch (gasError) {
      console.log('❌ Gas estimation failed:', gasError.message);
      console.log('   This could be the source of the "intrinsic gas too low" error');
    }
    
  } catch (error) {
    console.error('❌ Error debugging issue:', error.message);
  }
}

debugMainnetIssue(); 