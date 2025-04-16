var App = {
  web3Provider: null,
  contracts: {},
  account: "0x0",
  accounts: [],
  bridgeAddress: {},
  tokenAddress: {},
  web3: null,
  tokenDecimals: 0,
  depositLimit: null,
  depositId: 0,
  deposits: {},
  isProcessingAccountChange: false,

  _depositLimit: function() {
    return App.depositLimit;
  },

  init: function () {
    return App.initWeb3().then(function() {
        App.initInputValidation();
    });
  },

  initWeb3: function () {
    return new Promise((resolve, reject) => {
        if (typeof window.ethereum !== 'undefined') {
            // Define event handlers before adding listeners
            const handleDisconnect = () => {
                console.log('MetaMask disconnected');
                App.disconnectWallet();
            };

            const handleChainChanged = () => {
                window.location.reload();
            };

            const handleAccountsChanged = (accounts) => {
                App.handleAccountsChanged(accounts);
            };

            // Remove existing listeners if any
            if(App.web3Provider) {
                window.ethereum.removeListener('disconnect', handleDisconnect);
                window.ethereum.removeListener('chainChanged', handleChainChanged);
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
            }
            
            App.web3Provider = window.ethereum;
            App.web3 = new Web3(window.ethereum);
            
            // Add listeners with defined handlers
            window.ethereum.on('disconnect', handleDisconnect);
            window.ethereum.on('chainChanged', handleChainChanged);
            window.ethereum.on('accountsChanged', handleAccountsChanged);

            resolve();
        } else {
            reject(new Error("No Web3 provider detected"));
        }
    });
  },

  connectWallet: async function() {
    if (typeof window.ethereum !== 'undefined') {
      try {
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        App.handleAccountsChanged(accounts);
      } catch (error) {
        console.error("User denied account access")
      }
    } else {
      console.log('No Ethereum browser detected');
      alert('Please install MetaMask or use a Web3-enabled browser');
    }
  },

  handleAccountsChanged: async function(accounts) {
    if(App.isProcessingAccountChange) return;
    App.isProcessingAccountChange = true;
    
    try {
        if (!accounts || !accounts.length) {
            throw new Error("No accounts found");
        }

        App.account = accounts[0];
        const truncatedAddress = `${accounts[0].substring(0, 6)}...${accounts[0].substring(accounts[0].length - 4)}`;
        
        const chainId = await App.web3.eth.getChainId();
        App.chainId = chainId;
        
        if (!SUPPORTED_CHAIN_IDS[chainId]) {
            App.showNetworkAlert();
            await App.disconnectWallet();
            throw new Error(`Unsupported network: ${chainId}`);
        }
        
        // Initialize contracts sequentially to ensure proper setup
        await App.initBridgeContract();
        await App.initTokenContract();
        
        // Only proceed with these calls if contracts are properly initialized
        if (App.contracts.Bridge && App.contracts.Token) {
            await Promise.all([
                App.fetchDepositLimit(),
                App.updateBalance()
            ]);
        }
        
        App.isConnected = true;
        document.getElementById('walletButton').innerHTML = `Disconnect Wallet <span class="truncated-address">(${truncatedAddress})</span>`;
        App.setPageParams();
    } catch (error) {
        console.error('Error in handleAccountsChanged:', error);
        App.handleError(error);
        await App.disconnectWallet();
    } finally {
        App.isProcessingAccountChange = false;
    }
  },

  disconnectWallet: async function() {
    if(!App.isConnected) return; // Prevent unnecessary state updates
    
    try {
        // Atomic state update
        const updates = {
            account: '0x0',
            isConnected: false,
            balance: '0',
            chainId: null
        };
        
        // Update all states at once
        Object.assign(App, updates);
        
        // Update UI elements
        document.getElementById('walletButton').textContent = 'Connect Wallet';
        document.getElementById("currentBalance").innerHTML = 
            `<span class="connected-address-style">0 TRB</span>`;
        App.updateConnectedAddress();
        
        // Clear any pending transactions or subscriptions
        if(App.web3 && App.web3.eth) {
            await App.web3.eth.clearSubscriptions();
        }
    } catch (error) {
        console.error('Error during wallet disconnection:', error);
        App.handleError(error);
    }
  },

  updateConnectedAddress: function() {
    const connectedAddressElement = document.getElementById("connectedAddress");
    if (connectedAddressElement) {
      connectedAddressElement.textContent = App.account;
    }
  },

  showNetworkAlert: function() {
    alert("Please connect to the Sepolia network. Mainnet coming soon.");
  },

  handleError: function(error) {
    console.error("An error occurred:", error);
    alert("An error occurred. Please check the console for more details.");
  },

  initBridgeContract: async function () {
    try {
        const response = await fetch("./abis/TokenBridge.json");
        if (!response.ok) {
            throw new Error(`Failed to load ABI: ${response.statusText}`);
        }
        
        const data = await response.json();
        const abi = data.abi || data;
        
        if (!Array.isArray(abi)) {
            throw new Error("Invalid ABI format");
        }

        App.contracts.Bridge = new App.web3.eth.Contract(abi);
        
        const contractAddresses = {
            11155111: "0x5acb5977f35b1A91C4fE0F4386eB669E046776F2",
            421613: "0xb2CB696fE5244fB9004877e58dcB680cB86Ba444"
        };

        const address = contractAddresses[App.chainId];
        if (!address) {
            throw new Error(`No contract address for chainId: ${App.chainId}`);
        }

        App.contracts.Bridge.options.address = address;
        return true;
    } catch (error) {
        console.error("Bridge contract initialization error:", error);
        throw error;
    }
  },

  initTokenContract: function () {
    var pathToAbi = "./abis/ERC20.json";
    return new Promise(function(resolve, reject) {
      $.getJSON(pathToAbi, function (data) {
        try {
          // Make sure we're using the ABI array
          const abi = Array.isArray(data) ? data : data.abi;
          App.contracts.Token = new App.web3.eth.Contract(abi);
          if (App.chainId === 11155111) {
            App.contracts.Token.options.address = "0x80fc34a2f9FfE86F41580F47368289C402DEc660"
          } 
          if (App.chainId === 1)  {
            App.contracts.Token.options.address = "0x88dF592F8eb5D7Bd38bFeF7dEb0fBc02cf3778a0"
          } 
          if (App.chainId === 137)  {
            App.contracts.Token.options.address = "0xE3322702BEdaaEd36CdDAb233360B939775ae5f1"
          }
          if (App.chainId === 80001)  {
            App.contracts.Token.options.address = "0xce4e32fe9d894f8185271aa990d2db425df3e6be"
          } 
          if (App.chainId === 100)  {
            App.contracts.Token.options.address = "0xAAd66432d27737ecf6ED183160Adc5eF36aB99f2"
          } 
          if (App.chainId === 10200)  {
            App.contracts.Token.options.address = "0xe7147C5Ed14F545B4B17251992D1DB2bdfa26B6d"
          }
          if (App.chainId === 10)  {
            App.contracts.Token.options.address = "0xaf8cA653Fa2772d58f4368B0a71980e9E3cEB888"
          }
          if (App.chainId === 420)  {
            App.contracts.Token.options.address = "0x3251838bd813fdf6a97D32781e011cce8D225d59"
          }
          if (App.chainId === 42161)  {
            App.contracts.Token.options.address = "0xd58D345Fd9c82262E087d2D0607624B410D88242"
          }
          if (App.chainId === 421613)  {
            App.contracts.Token.options.address = "0x8d1bB5eDdFce08B92dD47c9871d1805211C3Eb3C"
          }
          if (App.chainId === 3141)  {
            App.contracts.Token.options.address = "0xe7147C5Ed14F545B4B17251992D1DB2bdfa26B6d"
          }
          resolve();
        } catch (error) {
          console.error("Token contract initialization error:", error);
          reject(error);
        }
      }).fail(function(error) {
        console.error("Failed to load Token ABI:", error);
        reject(error);
      });
    });
  },

  fetchDepositLimit: async function() {
    try {
        if (!App.contracts.Bridge || !App.contracts.Bridge.methods) {
            throw new Error("Bridge contract not properly initialized");
        }

        if (!App.contracts.Bridge.methods.depositLimit) {
            throw new Error("depositLimit method not found");
        }

        const result = await App.contracts.Bridge.methods.depositLimit().call();
        App.depositLimit = result;
        
        const readableLimit = App.web3.utils.fromWei(App.depositLimit, 'ether');
        const depositLimitElement = document.getElementById("depositLimit");
        
        if (depositLimitElement) {
            depositLimitElement.textContent = readableLimit + ' TRB';
        } else {
            console.warn("depositLimit element not found in DOM");
        }

        return readableLimit;
    } catch (error) {
        console.error("Failed to fetch DepositLimit:", error);
        throw error;
    }
  },

  setPageParams: function () {
    try {
        // Check if element exists before trying to access it
        const connectedAddressElement = document.getElementById('connectedAddress');
        if (connectedAddressElement) {
            connectedAddressElement.innerHTML = App.account || 'Not Connected';
        } else {
            console.log('Note: connectedAddress element not found');
        }

        if (App.contracts.Bridge && App.contracts.Bridge.options) {
        } else {
            console.error('Contest contract not properly initialized in setPageParams');
        }
    } catch (error) {
        console.error('Error in setPageParams:', error);
    }
  },

  uintTob32: function (n) {
    let vars = App.web3.utils.toBN(n).toString('hex');
    vars = vars.padStart(64, '0');
    return  vars;
  },
  
  reportValue: function () {
    queryId = document.getElementById("_queryId").value;
    value = document.getElementById("_value").value;
    nonce = document.getElementById("_nonce").value;
    queryData = document.getElementById("_queryData").value;
    console.log("_queryId: " + queryId);
    console.log("_value: "  + value.padStart(64, '0'));
    console.log("_nonce: " + nonce);
    console.log("_queryData: " + queryData);
    console.log("Attempting to interact with contract at address:", App.contracts.Bridge.options.address);
    App.contracts.Bridge.methods
      .submitValue(queryId, value, nonce, queryData)
      .send({ from: App.account })
      .then(function (result) {
        console.log(result);
      });
  },

  approveDeposit: function() {
    if (!checkWalletConnection()) {
        return;
    }
    const amount = document.getElementById('stakeAmount').value;
    const amountToSend = App.web3.utils.toWei(amount, 'ether');

    App.showPendingPopup("Approval transaction pending...");
    App.contracts.Token.methods.approve(App.contracts.Bridge.options.address, amountToSend)
      .send({ from: App.account })
      .then(function(approvalResult) {
        App.hidePendingPopup();
        document.getElementById('depositButton').disabled = false;
      })
      .catch(function(error) {
        App.hidePendingPopup();
        console.error("Error in approval", error);
        alert("Error in approval. Please try again.");
      });
  },

  showSuccessPopup: function(message) {
    const popup = document.createElement('div');
    popup.id = 'successPopup';
    popup.style.position = 'fixed';
    popup.style.top = '50%';
    popup.style.left = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    popup.style.padding = '50px';
    popup.style.backgroundColor = '#C4EDEB';
    popup.style.color = '#083b44';
    popup.style.borderRadius = '10px';
    popup.style.zIndex = '1000';
    popup.style.border = '3px solid black';
    popup.style.fontFamily = "'PPNeueMontreal-Book', Arial, sans-serif";
    popup.style.fontSize = "15px";
    popup.style.width = '250px'; // Set a fixed width
    popup.style.textAlign = 'center'; // Center the text
  
    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;
    popup.appendChild(messageSpan);
  
    document.body.appendChild(popup);
  
    // Remove the popup after 5 seconds
    setTimeout(() => {
      const popup = document.getElementById('successPopup');
      if (popup) {
        popup.remove();
      }
    }, 5000);
  },

  depositToLayer: async function() {
    try {
        const recipient = document.getElementById('_queryId').value;
        const amount = document.getElementById('stakeAmount').value;
        const tip = "0"; // Set tip to 0 by default
        
        // Validate recipient address is not empty and starts with 'tellor1...'
        if (!recipient || recipient.trim() === '') {
            alert('Recipient address cannot be empty');
            return;
        }
        
        if (!recipient.startsWith('tellor1')) {
            alert('Recipient address must start with "tellor1..."');
            return;
        }

        if (recipient.length !== 45) {
            alert('Recipient address must be exactly 45 characters long');
            return;
        }

        const amountToSend = App.web3.utils.toWei(amount, 'ether');
        
        // Add debug logging for balance check
        const balance = await App.contracts.Token.methods.balanceOf(App.account).call();

        const balanceBN = new App.web3.utils.BN(balance);
        const amountBN = new App.web3.utils.BN(amountToSend);


        if (balanceBN.lt(amountBN)) {
            const errorMsg = `Insufficient token balance. You have ${App.web3.utils.fromWei(balance, 'ether')} TRB but trying to deposit ${amount} TRB`;
            console.log('Showing error:', errorMsg);
            alert(errorMsg);
            return; // Make sure to return here to prevent the transaction
        }

        // Only reach here if balance is sufficient
        App.showPendingPopup("Deposit transaction pending...");
        const tipToSend = App.web3.utils.toWei(tip, 'ether');
        await App.contracts.Bridge.methods.depositToLayer(amountToSend, tipToSend, recipient)
            .send({ from: App.account });
        
        App.hidePendingPopup();
        await App.updateBalance();
        App.showSuccessPopup("Deposit to layer successful! You will need to wait 12 hours before you can claim your tokens on Tellor Layer.");
    } catch (error) {
        App.hidePendingPopup();
        console.error("Error in depositing to layer:", error);
        alert(error.message || "Error in depositing to layer. Please try again.");
    }
  },

  initInputValidation: function() {
    const depositButton = document.getElementById('depositButton');
    const stakeAmountInput = document.getElementById('stakeAmount');
    
    // Preserve the original input width
    const originalWidth = stakeAmountInput.offsetWidth;
    stakeAmountInput.style.width = originalWidth + 'px'; // Lock the width to prevent stretching
    
    // Create tooltip element with relative positioning container
    const tooltipContainer = document.createElement('div');
    tooltipContainer.style.position = 'relative'; // Create a positioning context
    tooltipContainer.style.display = 'inline-block'; // Keep it inline with input
    tooltipContainer.style.verticalAlign = 'middle'; // Align with other elements
    
    // Move the input into our new container
    stakeAmountInput.parentNode.insertBefore(tooltipContainer, stakeAmountInput);
    tooltipContainer.appendChild(stakeAmountInput);
    
    const tooltip = document.createElement('div');
    tooltip.style.display = 'none';
    tooltip.style.position = 'absolute';
    tooltip.style.backgroundColor = '#C4EDEB';
    tooltip.style.padding = '5px 10px';
    tooltip.style.borderRadius = '5px';
    tooltip.style.border = '1px solid black';
    tooltip.style.fontSize = '14px';
    tooltip.style.color = '#083b44';
    tooltip.style.fontFamily = "'PPNeueMontreal-Book', Arial, sans-serif";
    tooltip.style.zIndex = '1000';
    tooltip.style.whiteSpace = 'nowrap'; // Prevent wrapping
    tooltipContainer.appendChild(tooltip);

    // Position tooltip to the right of the input with more space
    function positionTooltip() {
      tooltip.style.right = ''; // Clear the right property
      tooltip.style.left = '100%'; // Position to the right of the input
      tooltip.style.top = '60%'; // Align with middle of input
      tooltip.style.transform = 'translateY(-50%)'; // Center vertically
      tooltip.style.marginLeft = '10px'; // Gap between tooltip and input
    }

    let trbPrice = 0;
    // Fetch TRB price from CoinGecko API
    async function updateTrbPrice() {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tellor&vs_currencies=usd');
        const data = await response.json();
        trbPrice = data.tellor.usd;
      } catch (error) {
        console.error('Error fetching TRB price:', error);
      }
    }

    // Update tooltip with USD value
    async function updateTooltip() {
      const amount = parseFloat(stakeAmountInput.value) || 0;
      if (amount > 0) {
        if (trbPrice === 0) {
          await updateTrbPrice();
        }
        const usdValue = (amount * trbPrice).toFixed(2);
        tooltip.textContent = `≈ $${usdValue} USD`;
        tooltip.style.display = 'block';
        // Call positionTooltip after making the tooltip visible
        requestAnimationFrame(positionTooltip);
      } else {
        tooltip.style.display = 'none';
      }
    }

    // Update price every 60 seconds
    setInterval(updateTrbPrice, 60000);
    // Initial price fetch
    updateTrbPrice();

    stakeAmountInput.addEventListener('input', updateTooltip);
    window.addEventListener('resize', positionTooltip);
    stakeAmountInput.addEventListener('focus', updateTooltip);
  },

  showPendingPopup: function(message) {
    const popup = document.createElement('div');
    popup.id = 'pendingPopup';
    popup.style.position = 'fixed';
    popup.style.top = '50%';
    popup.style.left = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    popup.style.padding = '50px';
    popup.style.backgroundColor = '#C4EDEB';
    popup.style.color = '#083b44';
    popup.style.borderRadius = '10px';
    popup.style.zIndex = '1000';
    popup.style.border = '3px solid black';
    popup.style.fontFamily = "'PPNeueMontreal-Book', Arial, sans-serif";
    popup.style.fontSize = "15px";
    popup.style.width = '250px'; // Set a fixed width
    popup.style.textAlign = 'center'; // Center the text
  
    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;
    popup.appendChild(messageSpan);
  
    const ellipsis = document.createElement('span');
    ellipsis.id = 'ellipsis';
    ellipsis.textContent = '';
    ellipsis.style.display = 'inline-block';
    ellipsis.style.width = '10px'; // Set a fixed width for the ellipsis
    ellipsis.style.textAlign = 'left'; // Align dots to the left within their fixed width
    popup.appendChild(ellipsis);
  
    document.body.appendChild(popup);
  
    let dots = 0;
    const animateEllipsis = setInterval(() => {
      dots = (dots + 1) % 4;
      ellipsis.textContent = '.'.repeat(dots);
    }, 500);
  
    // Store the interval ID on the popup element
    popup.animationInterval = animateEllipsis;
  },
  
  hidePendingPopup: function() {
    const popup = document.getElementById('pendingPopup');
    if (popup) {
      // Clear the animation interval
      clearInterval(popup.animationInterval);
      popup.remove();
    }
  },

  getAllowance: async function() {
    if (!App.account || !App.contracts.Token || !App.contracts.Bridge) {
      console.error('Wallet not connected or contracts not initialized');
      return '0';
    }

    try {
      const allowance = await App.contracts.Token.methods.allowance(
        App.account,
        App.contracts.Bridge.options.address
      ).call();
      return allowance;
    } catch (error) {
      console.error('Error fetching allowance:', error);
      return '0';
    }
  },

  updateBalance: async function() {
    if (!App.contracts.Token || !App.account) return;
    
    try {
        const balance = await App.contracts.Token.methods.balanceOf(App.account).call();
        const readableBalance = App.web3.utils.fromWei(balance, 'ether');
        
        const balanceElement = document.getElementById("currentBalance");
        if (balanceElement) {
            balanceElement.textContent = `${readableBalance} TRB`;
        }
    } catch (error) {
        console.error("Error fetching balance:", error);
    }
  }
};

function checkWalletConnection() {
    console.log("Checking wallet connection. Is connected:", App.isConnected);
    console.log("Current account:", App.account);
    if (!App.isConnected) {
        alert("Please connect your wallet first");
        return false;
    }
    return true;
}

$(function () {
    $(window).load(function () {
        try {
            if(!window.ethereum) {
                throw new Error('No Web3 provider detected');
            }
            
            document.getElementById("walletButton").disabled = false;
            App.init().catch(error => {
                console.error('Failed to initialize app:', error);
                App.handleError(error);
            });

            // Add event listener with proper error boundaries
            document.getElementById('walletButton').addEventListener('click', async function() {
                try {
                    if (!App.isConnected) {
                        await App.connectWallet();
                    } else {
                        await App.disconnectWallet();
                    }
                } catch (error) {
                    console.error('Wallet operation failed:', error);
                    App.handleError(error);
                }
            });
        } catch (error) {
            console.error('App initialization failed:', error);
            // Show user-friendly error message
            document.getElementById("walletButton").textContent = 'Web3 Not Available';
            document.getElementById("walletButton").disabled = true;
        }
    });
});

$(document).ready(function() {
    document.getElementById('depositButton').disabled = true;
});

function showBalanceErrorPopup(message) {
  const popup = document.createElement('div');
  popup.id = 'balanceErrorPopup';
  popup.className = 'balance-error-popup';
  popup.textContent = message;
  
  document.body.appendChild(popup);
  
  // Remove the popup after 3 seconds
  setTimeout(() => {
    const popup = document.getElementById('balanceErrorPopup');
    if (popup) {
      popup.remove();
    }
  }, 3000);
}

function hideBalanceErrorPopup() {
  const popup = document.getElementById('balanceErrorPopup');
  if (popup) {
    popup.remove();
  }
}

async function checkBalance(amount) {
  if (!App.contracts.Token || !App.account) return true;
  
  try {
    const balance = await App.contracts.Token.methods.balanceOf(App.account).call();
    const amountWei = App.web3.utils.toWei(amount.toString(), 'ether');
    
    if (App.web3.utils.toBN(amountWei).gt(App.web3.utils.toBN(balance))) {
      const readableBalance = App.web3.utils.fromWei(balance, 'ether');
      showBalanceErrorPopup(`Insufficient balance. You have ${readableBalance} TRB but trying to deposit ${amount} TRB`);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error checking balance:", error);
    return false;
  }
}

const SUPPORTED_CHAIN_IDS = {
    11155111: 'Sepolia'
};

function validateChainId(chainId) {
    if (!chainId || !SUPPORTED_CHAIN_IDS[chainId]) {
        throw new Error(`Unsupported network. Please connect to ${Object.values(SUPPORTED_CHAIN_IDS).join(' or ')}`);
    }
    return true;
}