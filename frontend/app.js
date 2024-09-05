var App = {
  web3Provider: null,
  contracts: {},
  account: "0x0",
  accounts: [],
  contestAddress: {}, 
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
        console.log("Using web3 detected from external source like Metamask");
        App.web3Provider = window.ethereum;
        App.web3 = new Web3(window.ethereum);
      } else {
        console.log("Using localhost");
        App.web3Provider = new Web3.providers.HttpProvider("http://localhost:8545");
        App.web3 = new Web3(App.web3Provider);
      }
      resolve();
    });
  },

  initEth: function () {
    return ethereum.request({ method: "eth_requestAccounts" })
      .then(function (accounts) {
        App.account = accounts[0];
        return App.web3.eth.getChainId().then(function (result) {
          App.chainId = result;
          return App.initContestContract()
            .then(App.initTokenContract)
            .then(function() {
              console.log("Contracts initialized, fetching deposit limit...");
              return App.fetchDepositLimit();
            })
            .then(function(readableLimit) {
              console.log("Deposit limit fetched:", readableLimit);
              App.setPageParams();
            });
        });
      }).catch(function(error) {
        console.error("Error during Ethereum account request:", error);
      });
  },

  initContestContract: function () {
    var pathToAbi = "./abis/TheContest.json";
    return new Promise(function(resolve, reject) {
      $.getJSON(pathToAbi, function (abi) {
        App.contracts.Contest = new App.web3.eth.Contract(abi);
        if (App.chainId === 421613) {
          App.contracts.Contest.options.address = "0xb2CB696fE5244fB9004877e58dcB680cB86Ba444";
        } else {
          App.contracts.Contest.options.address = "0x717F9269032C25D91CcD92bADbdfcb32c30E9492";
        }
        console.log("Contract initialized");
        console.log("Contract address: " + App.contracts.Contest.options.address);
        resolve();
      }).fail(reject);
    });
  },

  initTokenContract: function () {
    var pathToAbi = "./abis/ERC20.json";
    return new Promise(function(resolve, reject) {
      $.getJSON(pathToAbi, function (abi) {
        App.contracts.Token = new App.web3.eth.Contract(abi);
        if (App.chainId === 11155111) {
          App.contracts.Token.options.address = "0xceBa0609797251395CFB420a1540E58b6be0828d"
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
        console.log("Token contract initialized");
        console.log(
          "Token contract address: ", App.contracts.Token.options.address
        );
        if (!App.contracts.Token.methods.faucet) {
          console.error("Faucet method not found on Token contract");
        }
        resolve();
      }).fail(reject);
    });
  },

  fetchDepositLimit: function() {
    console.log("Fetching deposit limit...");
    console.log("Contest contract address:", App.contracts.Contest.options.address);
  
    if (!App.contracts.Contest.methods.depositLimit) {
      console.error("depositLimit method not found on contract");
      return Promise.reject("depositLimit method not found");
    }

    return App.contracts.Contest.methods.depositLimit().call()
      .then(function(result) {
        console.log("Raw deposit limit result:", result);
        App.depositLimit = result;
        console.log("Updated DepositLimit:", App.depositLimit);
        
        const readableLimit = App.web3.utils.fromWei(App.depositLimit, 'ether');
        console.log("Readable deposit limit:", readableLimit);

        const depositLimitElement = document.getElementById("depositLimit");
        if (depositLimitElement) {
          depositLimitElement.textContent = readableLimit + ' TRB';
          console.log("DOM updated with deposit limit");
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
    console.log('Setting page parameters');
    console.log('App.account in setPageParams:', App.account);
    const connectedAddressElement = document.getElementById("connectedAddress");
    if (connectedAddressElement) {
      connectedAddressElement.textContent = App.account;
      console.log("Updated connected address in setPageParams to:", App.account);
    } else {
      console.error('connectedAddress element not found in setPageParams');
    }
    if (App.contracts.Contest && App.contracts.Contest.options) {
      console.log("Contest Address:", App.contracts.Contest.options.address);
    } else {
      console.error('Contest contract not properly initialized in setPageParams');
    }
    console.log("Current Deposit Limit:", App.depositLimit);
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
    console.log("Attempting to interact with contract at address:", App.contracts.Contest.options.address);
    App.contracts.Contest.methods
      .submitValue(queryId, value, nonce, queryData)
      .send({ from: App.account })
      .then(function (result) {
        console.log(result);
      });
  },

  faucet: function() {
    console.log("Faucet button clicked");
    if (!App.contracts.Token) {
      console.error("Token contract not initialized");
      alert("Please connect your wallet first");
      return;
    }
    
    App.contracts.Token.methods.faucet(App.account)
      .send({ from: App.account })
      .then(function(result) {
        console.log("Faucet successful", result);
        alert("Test TRB tokens have been sent to your account!");
      })
      .catch(function(error) {
        console.error("Error in faucet", error);
        alert("Error getting test TRB tokens. Please try again.");
      });
  },

  approveDeposit: function() {
    if (!checkWalletConnection()) return;
    const amount = document.getElementById('stakeAmount').value;
    const amountToSend = App.web3.utils.toWei(amount, 'ether');

    App.showPendingPopup("Approval transaction pending...");
    App.contracts.Token.methods.approve(App.contracts.Contest.options.address, amountToSend)
      .send({ from: App.account })
      .then(function(approvalResult) {
        App.hidePendingPopup();
        console.log("Approval successful", approvalResult);
        alert("Approval successful. You can now proceed with the deposit.");
        document.getElementById('depositButton').disabled = false;
      })
      .catch(function(error) {
        App.hidePendingPopup();
        console.error("Error in approval", error);
        alert("Error in approval. Please try again.");
      });
  },

  depositToLayer: function() {
    if (!checkWalletConnection()) return;
    const recipient = document.getElementById('_queryId').value;
    const amount = document.getElementById('stakeAmount').value;
    const tip = document.getElementById('tipAmount').value;
    const amountToSend = App.web3.utils.toWei(amount, 'ether');
    const tipToSend = App.web3.utils.toWei(tip, 'ether');

    App.showPendingPopup("Deposit transaction pending...");
    App.contracts.Contest.methods.depositToLayer(amountToSend, tipToSend, recipient)
      .send({ from: App.account })
      .then(function(depositResult) {
        App.hidePendingPopup();
        console.log("Deposit to layer successful", depositResult);
        alert("Deposit to layer successful!");
      })
      .catch(function(error) {
        App.hidePendingPopup();
        console.error("Error in depositing to layer", error);
        alert("Error in depositing to layer. Please try again.");
      });
  },

  initInputValidation: function() {
    document.getElementById('depositButton').disabled = true;
    const stakeAmountInput = document.getElementById('stakeAmount');
    const tipAmountInput = document.getElementById('tipAmount');
    
    const popupElement = document.createElement('div');
    popupElement.style.display = 'none';
    popupElement.style.position = 'absolute';
    popupElement.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
    popupElement.style.color = 'white';
    popupElement.style.padding = '10px';
    popupElement.style.borderRadius = '5px';
    popupElement.style.zIndex = '1000';
    popupElement.style.fontSize = '14px';
    popupElement.style.whiteSpace = 'nowrap';
    document.body.appendChild(popupElement);

    function showWarning(message, inputElement) {
        popupElement.textContent = message;
        popupElement.style.display = 'block';
        
        const inputRect = inputElement.getBoundingClientRect();
        const popupRect = popupElement.getBoundingClientRect();
        
        const left = inputRect.left + window.pageXOffset + (inputRect.width - popupRect.width) / 2;
        const top = inputRect.top + window.pageYOffset - popupRect.height - 5;

        popupElement.style.left = `${left}px`;
        popupElement.style.top = `${top}px`;

        setTimeout(() => {
            popupElement.style.display = 'none';
        }, 3000);
    }

    function validateInputs() {
        const amount = stakeAmountInput.value;
        const tip = tipAmountInput.value;
        const amountBN = App.web3.utils.toBN(App.web3.utils.toWei(amount || '0', 'ether'));
        const tipBN = App.web3.utils.toBN(App.web3.utils.toWei(tip || '0', 'ether'));
        const minTipBN = App.web3.utils.toBN(App.web3.utils.toWei('0.0000000000001', 'ether'));
        const depositLimitBN = App.web3.utils.toBN(App.depositLimit);

        let warning = '';
        let warningInput = null;

        if (tipBN.gt(App.web3.utils.toBN(0))) {
            if (tipBN.lt(minTipBN)) {
                warning = "Tip must be at least 0.0000000000001 TRB";
                warningInput = tipAmountInput;
            } else if (amountBN.eq(App.web3.utils.toBN(0))) {
                warning = "TRB amount must be greater than 0 when providing a tip";
                warningInput = stakeAmountInput;
            } else if (tipBN.gt(amountBN)) {
                warning = "Tip amount cannot exceed the TRB amount";
                warningInput = tipAmountInput;
            }
        }

        if (amountBN.gt(depositLimitBN)) {
            warning = "TRB amount exceeds the current deposit limit";
            warningInput = stakeAmountInput;
        }

        if (warning) {
            showWarning(warning, warningInput);
            document.getElementById('depositButton').disabled = true;
        } else {
            popupElement.style.display = 'none';
            document.getElementById('depositButton').disabled = false;
        }
    }

    stakeAmountInput.addEventListener('input', validateInputs);
    tipAmountInput.addEventListener('input', validateInputs);
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
    popup.textContent = message;
    document.body.appendChild(popup);
    popup.style.border = '3px solid black';
    popup.style.fontFamily = "'PPNeueMontreal-Medium', Arial, sans-serif";
    popup.style.fontSize = "30px";
  },

  hidePendingPopup: function() {
    const popup = document.getElementById('pendingPopup');
    if (popup) {
      popup.remove();
    }
  },

  faucet: function() {
    if (!checkWalletConnection()) return;
    console.log("Faucet button clicked");
    if (!App.contracts.Token) {
      console.error("Token contract not initialized");
      alert("Please connect your wallet first");
      return;
    }
    
    App.showPendingPopup("Faucet transaction pending...");
    App.contracts.Token.methods.faucet(App.account)
      .send({ from: App.account })
      .then(function(result) {
        App.hidePendingPopup();
        console.log("Faucet successful", result);
        alert("Test TRB tokens have been sent to your account!");
      })
      .catch(function(error) {
        App.hidePendingPopup();
        console.error("Error in faucet", error);
        alert("Error getting test TRB tokens. Please try again.");
      });
  },

  approveDeposit: function() {
    if (!checkWalletConnection()) return;
    const amount = document.getElementById('stakeAmount').value;
    const amountToSend = App.web3.utils.toWei(amount, 'ether');

    App.showPendingPopup("Approval transaction pending...");
    App.contracts.Token.methods.approve(App.contracts.Contest.options.address, amountToSend)
      .send({ from: App.account })
      .then(function(approvalResult) {
        App.hidePendingPopup();
        console.log("Approval successful", approvalResult);
        alert("Approval successful. You can now proceed with the deposit.");
        document.getElementById('depositButton').disabled = false;
      })
      .catch(function(error) {
        App.hidePendingPopup();
        console.error("Error in approval", error);
        alert("Error in approval. Please try again.");
      });
  },

  depositToLayer: function() {
    if (!checkWalletConnection()) return;
    const recipient = document.getElementById('_queryId').value;
    const amount = document.getElementById('stakeAmount').value;
    const tip = document.getElementById('tipAmount').value;
    const amountToSend = App.web3.utils.toWei(amount, 'ether');
    const tipToSend = App.web3.utils.toWei(tip, 'ether');

    App.showPendingPopup("Deposit transaction pending...");
    App.contracts.Contest.methods.depositToLayer(amountToSend, tipToSend, recipient)
      .send({ from: App.account })
      .then(function(depositResult) {
        App.hidePendingPopup();
        console.log("Deposit to layer successful", depositResult);
        alert("Deposit to layer successful!");
      })
      .catch(function(error) {
        App.hidePendingPopup();
        console.error("Error in depositing to layer", error);
        alert("Error in depositing to layer. Please try again.");
      });
  },

  reportValue: function () {
    if (!checkWalletConnection()) return;
    queryId = document.getElementById("_queryId").value;
    value = document.getElementById("_value").value;
    nonce = document.getElementById("_nonce").value;
    queryData = document.getElementById("_queryData").value;
    console.log("_queryId: " + queryId);
    console.log("_value: "  + value.padStart(64, '0'));
    console.log("_nonce: " + nonce);
    console.log("_queryData: " + queryData);
    console.log("Attempting to interact with contract at address:", App.contracts.Contest.options.address);
    
    App.showPendingPopup("Submitting value...");
    App.contracts.Contest.methods
      .submitValue(queryId, value, nonce, queryData)
      .send({ from: App.account })
      .then(function (result) {
        App.hidePendingPopup();
        console.log(result);
        alert("Value submitted successfully!");
      })
      .catch(function(error) {
        App.hidePendingPopup();
        console.error("Error in submitting value", error);
        alert("Error in submitting value. Please try again.");
      });
  }
};

$(function () {
  $(window).load(function () {
    console.log(document.getElementById('walletButton'));
    document.getElementById("walletButton").disabled = false;
    App.init();
  });
});

$(document).ready(function() {
    const walletButton = document.getElementById('walletButton');
    console.log(walletButton);
    let isConnected = false;

    function checkWalletConnection() {
        if (!isConnected) {
            alert("Please connect your wallet first.");
            return false;
        }
        return true;
    }

    App.faucet = function() {
        if (!checkWalletConnection()) return;
        console.log("Faucet button clicked");
        if (!App.contracts.Token) {
            console.error("Token contract not initialized");
            alert("Please connect your wallet first");
            return;
        }
        
        App.showPendingPopup("Faucet transaction pending...");
        App.contracts.Token.methods.faucet(App.account)
            .send({ from: App.account })
            .then(function(result) {
                App.hidePendingPopup();
                console.log("Faucet successful", result);
                alert("Test TRB tokens have been sent to your account!");
            })
            .catch(function(error) {
                App.hidePendingPopup();
                console.error("Error in faucet", error);
                alert("Error getting test TRB tokens. Please try again.");
            });
    }

    App.approveDeposit = function() {
        if (!checkWalletConnection()) return;
        const amount = document.getElementById('stakeAmount').value;
        const amountToSend = App.web3.utils.toWei(amount, 'ether');

        App.showPendingPopup("Approval transaction pending...");
        App.contracts.Token.methods.approve(App.contracts.Contest.options.address, amountToSend)
            .send({ from: App.account })
            .then(function(approvalResult) {
                App.hidePendingPopup();
                console.log("Approval successful", approvalResult);
                alert("Approval successful. You can now proceed with the deposit.");
                document.getElementById('depositButton').disabled = false;
            })
            .catch(function(error) {
                App.hidePendingPopup();
                console.error("Error in approval", error);
                alert("Error in approval. Please try again.");
            });
    }

    App.depositToLayer = function() {
        if (!checkWalletConnection()) return;
        const recipient = document.getElementById('_queryId').value;
        const amount = document.getElementById('stakeAmount').value;
        const tip = document.getElementById('tipAmount').value;
        const amountToSend = App.web3.utils.toWei(amount, 'ether');
        const tipToSend = App.web3.utils.toWei(tip, 'ether');

        App.showPendingPopup("Deposit transaction pending...");
        App.contracts.Contest.methods.depositToLayer(amountToSend, tipToSend, recipient)
            .send({ from: App.account })
            .then(function(depositResult) {
                App.hidePendingPopup();
                console.log("Deposit to layer successful", depositResult);
                alert("Deposit to layer successful!");
            })
            .catch(function(error) {
                App.hidePendingPopup();
                console.error("Error in depositing to layer", error);
                alert("Error in depositing to layer. Please try again.");
            });
    }

    App.reportValue = function () {
        if (!checkWalletConnection()) return;
        queryId = document.getElementById("_queryId").value;
        value = document.getElementById("_value").value;
        nonce = document.getElementById("_nonce").value;
        queryData = document.getElementById("_queryData").value;
        console.log("_queryId: " + queryId);
        console.log("_value: "  + value.padStart(64, '0'));
        console.log("_nonce: " + nonce);
        console.log("_queryData: " + queryData);
        console.log("Attempting to interact with contract at address:", App.contracts.Contest.options.address);
        
        App.showPendingPopup("Submitting value...");
        App.contracts.Contest.methods
            .submitValue(queryId, value, nonce, queryData)
            .send({ from: App.account })
            .then(function (result) {
                App.hidePendingPopup();
                console.log(result);
                alert("Value submitted successfully!");
            })
            .catch(function(error) {
                App.hidePendingPopup();
                console.error("Error in submitting value", error);
                alert("Error in submitting value. Please try again.");
            });
    }

    function showNetworkAlert() {
        alert("Please connect to the Sepolia network. Mainnet coming soon.");
    }

    walletButton.addEventListener('click', function() {
        if (!isConnected) {
            connectWallet();
        } else {
            disconnectWallet();
        }
    });

    function connectWallet() {
        console.log('Connecting wallet...');
        
        if (typeof window.ethereum !== 'undefined') {
            // MetaMask is installed
            connectWithMetaMask();
        } else {
            // MetaMask is not installed, try WalletConnect
            connectWithWalletConnect();
        }
    }

    function connectWithMetaMask() {
        console.log('Connecting with MetaMask...');
        window.ethereum.request({ method: 'eth_requestAccounts' })
            .then(handleAccountsChanged)
            .catch(handleError);
    }

    function connectWithWalletConnect() {
        console.log('Connecting with WalletConnect...');
        // Initialize WalletConnect client
        const provider = new WalletConnectProvider({
            rpc: {
                11155111: "https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161" // Sepolia testnet
            }
        });

        // Enable session (triggers QR Code modal)
        provider.enable()
            .then(function(accounts) {
                App.web3 = new Web3(provider);
                handleAccountsChanged(accounts);
            })
            .catch(handleError);
    }

    function handleAccountsChanged(accounts) {
        console.log('Accounts:', accounts);
        App.account = accounts[0];
        console.log('App.account set to:', App.account);
        updateConnectedAddress();
        return App.web3.eth.getChainId()
            .then(function (result) {
                console.log('Chain ID:', result);
                App.chainId = result;
                if (App.chainId !== 11155111) {
                    showNetworkAlert();
                    disconnectWallet();
                    return Promise.reject("Wrong network");
                }
                return App.initContestContract();
            })
            .then(function() {
                console.log('Contest contract initialized');
                return App.initTokenContract();
            })
            .then(function() {
                console.log('Token contract initialized');
                return App.fetchDepositLimit();
            })
            .then(function() {
                console.log('Deposit limit fetched');
                isConnected = true;
                walletButton.textContent = 'Disconnect Wallet';
                App.setPageParams();
            });
    }

    function handleError(error) {
        console.error("Error during wallet connection:", error);
        walletButton.disabled = false;
    }

    function updateConnectedAddress() {
        const connectedAddressElement = document.getElementById("connectedAddress");
        if (connectedAddressElement) {
            connectedAddressElement.textContent = App.account;
            console.log("Updated connected address to:", App.account);
        } else {
            console.error('connectedAddress element not found');
        }
    }

    function disconnectWallet() {
        console.log('Disconnecting wallet...');
        if (App.web3 && App.web3.currentProvider && App.web3.currentProvider.disconnect) {
            App.web3.currentProvider.disconnect();
        }
        App.account = '0x0';
        isConnected = false;
        walletButton.textContent = 'Connect Wallet';
        updateConnectedAddress();
        console.log('Wallet disconnected');
    }
});

$(document).ready(function() {
    document.getElementById('depositButton').disabled = true;
});