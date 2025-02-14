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
        App.web3Provider = window.ethereum;
        App.web3 = new Web3(window.ethereum);

        // Add listener for the 'disconnect' event
        window.ethereum.on('disconnect', (error) => {
          console.log('MetaMask disconnected');
          App.disconnectWallet();
        });

      } else {
        console.log("No web3 detected. Falling back to http://localhost:8545.");
        App.web3Provider = new Web3.providers.HttpProvider("http://localhost:8545");
        App.web3 = new Web3(App.web3Provider);
      }
      resolve();
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
    App.account = accounts[0];
    App.updateConnectedAddress();
    
    try {
      const chainId = await App.web3.eth.getChainId();
      App.chainId = chainId;
      if (App.chainId !== 11155111) {
        App.showNetworkAlert();
        App.disconnectWallet();
        throw new Error("Wrong network");
      }
      await App.initBridgeContract();
      await App.initTokenContract();
      await App.fetchDepositLimit();
      await App.updateBalance();
      App.isConnected = true;
      document.getElementById('walletButton').textContent = 'Disconnect Wallet';
      App.setPageParams();
    } catch (error) {
      console.error('Error in handleAccountsChanged:', error);
      App.handleError(error);
    }
  },

  disconnectWallet: function() {
    App.account = '0x0';
    App.isConnected = false;
    document.getElementById('walletButton').textContent = 'Connect Wallet';
    App.updateConnectedAddress();
    
    // Clear the balance display
    const balanceElement = document.getElementById("currentBalance");
    if (balanceElement) {
        balanceElement.innerHTML = `<span style="font-size: 12px; font-family: 'PPNeueMontreal-Book', Arial, sans-serif" class="connected-address-style">0 TRB</span>`;
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

  initBridgeContract: function () {
    var pathToAbi = "./abis/TokenBridge.json";
    return new Promise(function(resolve, reject) {
        $.getJSON(pathToAbi, function (data) {
            try {
                App.contracts.Bridge = new App.web3.eth.Contract(data.abi);
                if (App.chainId === 421613) {
                    App.contracts.Bridge.options.address = "0xb2CB696fE5244fB9004877e58dcB680cB86Ba444";
                } else {
                    App.contracts.Bridge.options.address = "0x6ac02F3887B358591b8B2D22CfB1F36Fa5843867";
                }
                resolve();
            } catch (error) {
                console.error("Contract initialization error:", error);
                reject(error);
            }
        }).fail(function(error) {
            console.error("Failed to load ABI:", error);
            reject(error);
        });
    });
  },

  initTokenContract: function () {
    var pathToAbi = "./abis/ERC20.json";
    return new Promise(function(resolve, reject) {
      $.getJSON(pathToAbi, function (abi) {
        App.contracts.Token = new App.web3.eth.Contract(abi);
        if (App.chainId === 11155111) {
          App.contracts.Token.options.address = "0x5bd3b87EEF3348B2b115A2bC92d8c01Aa7a0CEb1"
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
        if (!App.contracts.Token.methods.faucet) {
          console.error("Faucet method not found on Token contract");
        }
        resolve();
      }).fail(reject);
    });
  },

  fetchDepositLimit: function() {

  
    if (!App.contracts.Bridge.methods.depositLimit) {
      return Promise.reject("depositLimit method not found");
    }

    return App.contracts.Bridge.methods.depositLimit().call()
      .then(function(result) {
        App.depositLimit = result;
        
        const readableLimit = App.web3.utils.fromWei(App.depositLimit, 'ether');

        const depositLimitElement = document.getElementById("depositLimit");
        if (depositLimitElement) {
          depositLimitElement.textContent = readableLimit + ' TRB';
        } else {
          console.error("depositLimit element not found in DOM");
        }

        return readableLimit;
      })
      .catch(function(err) {
        console.error("Failed to fetch DepositLimit:", err);
        throw err;
      });
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

  faucet: function() {
    if (!App.contracts.Token) {
      console.error("Token contract not initialized");
      alert("Please connect your wallet first");
      return;
    }
    
    App.contracts.Token.methods.faucet(App.account)
      .send({ from: App.account })
      .then(async function(result) {
        App.hidePendingPopup();
        console.log("Faucet successful", result);
        await App.updateBalance();
        alert("Test TRB tokens have been sent to your account!");
      })
      .catch(function(error) {
        console.error("Error in faucet", error);
        alert("Error getting test TRB tokens. Please try again.");
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

  depositToLayer: async function() {
    try {
        const recipient = document.getElementById('_queryId').value;
        const amount = document.getElementById('stakeAmount').value;
        const tip = document.getElementById('tipAmount').value;
        
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
        alert("Deposit to layer successful!");
    } catch (error) {
        App.hidePendingPopup();
        console.error("Error in depositing to layer:", error);
        alert(error.message || "Error in depositing to layer. Please try again.");
    }
  },

  initInputValidation: function() {
    const depositButton = document.getElementById('depositButton');
    const stakeAmountInput = document.getElementById('stakeAmount');
  
    async function checkAllowanceAndValidate() {
        if (!App.web3) {
            console.log('Web3 not initialized yet');
            depositButton.disabled = true;
            return;
        }

        const stakeAmount = stakeAmountInput.value.trim();
        if (!stakeAmount) {
            depositButton.disabled = true;
            return;
        }

        try {
            const stakeAmountWei = App.web3.utils.toWei(stakeAmount, 'ether');
            const stakeAmountBN = App.web3.utils.toBN(stakeAmountWei);
            const depositLimitBN = App.web3.utils.toBN(App.depositLimit);

            if (stakeAmountBN.isZero() || stakeAmountBN.gt(depositLimitBN)) {
                console.log('Disabling button: Invalid stake amount or exceeds deposit limit');
                depositButton.disabled = true;
                return;
            }

            const allowance = await App.getAllowance();
            const allowanceBN = App.web3.utils.toBN(allowance);

            if (stakeAmountBN.gt(allowanceBN)) {
                depositButton.disabled = true;
            } else {
                depositButton.disabled = false;
            }
        } catch (error) {
            console.error('Error checking allowance:', error);
            depositButton.disabled = true;
        }
    }

    stakeAmountInput.addEventListener('input', checkAllowanceAndValidate);

    // Initial check
    checkAllowanceAndValidate();
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
    document.getElementById("walletButton").disabled = false;
    App.init();

    // Add event listener to wallet button
    document.getElementById('walletButton').addEventListener('click', function() {
      if (!App.isConnected) {
        App.connectWallet();
      } else {
        App.disconnectWallet();
      }
    });

    // Add direct event listener to approve button
    document.getElementById('approveButton').addEventListener('click', function() {
      console.log('Approve button clicked via event listener');
      App.approveDeposit();
    });
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