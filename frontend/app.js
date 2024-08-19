var App = {
  web3Provider: null,
  contracts: {},
  account: "0x0",
  accounts: [],
  contestAddress: {}, 
  tokenAddress: {},
  web3,
  tokenDecimals: 0,
  depositLimit: null,
  depositId: 0, // Initialize depositId here
  deposits: {}, // Assuming you also need a structure to store deposit details

  _depositLimit: function() {
    return App.depositLimit;
  },

  init: function () {
    return App.initWeb3();
  },

  initWeb3: function () {
    return new Promise((resolve, reject) => {
      if (typeof web3 !== 'undefined') {
        console.log("Using web3 detected from external source like Metamask");
        App.web3Provider = window.ethereum;
        web3 = new Web3(window.ethereum);
      } else {
        console.log("Using localhost");
        web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
      }
      resolve();
    });
  },

  initEth: function () {
    return ethereum.request({ method: "eth_requestAccounts" })
      .then(function (accounts) {
        App.account = accounts[0];
        return web3.eth.getChainId().then(function (result) {
          App.chainId = result;
          return App.initContestContract()
            .then(App.initTokenContract)
            .then(function() {
              console.log("Contracts initialized, fetching deposit limit...");
              return App.fetchDepositLimit();
            })
            .then(function(readableLimit) {
              console.log("Deposit limit fetched:", readableLimit);
              // You can update the UI here if needed
              App.setPageParams(); // Ensure this is called after initialization
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
        App.contracts.Contest = new web3.eth.Contract(abi);
        if (App.chainId === 421613) {
          App.contracts.Contest.options.address = "0xb2CB696fE5244fB9004877e58dcB680cB86Ba444";
        } else {
          App.contracts.Contest.options.address = "0x1AaF421491171930e71fb032B765DF252CE3F97e";
        }
        console.log("Contract initialized");
        console.log("Contract address: " + App.contracts.Contest.options.address);
        resolve(); // Resolve after all setup is done
      }).fail(reject); // Handle JSON fetch failure
    });
  },
initTokenContract: function () {
  var pathToAbi = "./abis/ERC20.json";
  return new Promise(function(resolve, reject) {
    $.getJSON(pathToAbi, function (abi) {
      App.contracts.Token = new web3.eth.Contract(abi);
      if (App.chainId === 11155111) {
        App.contracts.Token.options.address = "0xceBa0609797251395CFB420a1540E58b6be0828d" //eth sepolia 
      } 
      if (App.chainId === 1)  {
        App.contracts.Token.options.address = "0x88dF592F8eb5D7Bd38bFeF7dEb0fBc02cf3778a0" // eth main
      } 
      if (App.chainId === 137)  {
        App.contracts.Token.options.address = "0xE3322702BEdaaEd36CdDAb233360B939775ae5f1" // polygon main
      }
      if (App.chainId === 80001)  {
        App.contracts.Token.options.address = "0xce4e32fe9d894f8185271aa990d2db425df3e6be" // polygon mumbai
      } 
      if (App.chainId === 100)  {
        App.contracts.Token.options.address = "0xAAd66432d27737ecf6ED183160Adc5eF36aB99f2" // gnosis main
      } 
      if (App.chainId === 10200)  {
        App.contracts.Token.options.address = "0xe7147C5Ed14F545B4B17251992D1DB2bdfa26B6d" // gnosis chiado
      }
      if (App.chainId === 10)  {
        App.contracts.Token.options.address = "0xaf8cA653Fa2772d58f4368B0a71980e9E3cEB888" // optimism mainnet
      }
      if (App.chainId === 420)  {
        App.contracts.Token.options.address = "0x3251838bd813fdf6a97D32781e011cce8D225d59" //optimism goerli
      }
      if (App.chainId === 42161)  {
        App.contracts.Token.options.address = "0xd58D345Fd9c82262E087d2D0607624B410D88242" // arbitrum one
      }
      if (App.chainId === 421613)  {
        App.contracts.Token.options.address = "0x8d1bB5eDdFce08B92dD47c9871d1805211C3Eb3C" // arbitrum goerli
      }
      if (App.chainId === 3141)  {
        App.contracts.Token.options.address = "0xe7147C5Ed14F545B4B17251992D1DB2bdfa26B6d" // filecoin hyperspace
      }
      console.log("Token contract initialized");
      console.log(
        "Token contract address: ", App.contracts.Token.options.address
      );
      // Check if the faucet method exists
      if (!App.contracts.Token.methods.faucet) {
        console.error("Faucet method not found on Token contract");
      }
      resolve(); // Resolve the promise after all setup is done
    }).fail(reject); // Reject the promise on failure
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
      
      // Convert from wei to ether (or any other unit your token uses)
      const readableLimit = web3.utils.fromWei(App.depositLimit, 'ether');
      console.log("Readable deposit limit:", readableLimit);

      // Update the DOM
      const depositLimitElement = document.getElementById("depositLimit");
      if (depositLimitElement) {
        depositLimitElement.textContent = readableLimit + ' TRB';
        console.log("DOM updated with deposit limit");
      } else {
        console.error("depositLimit element not found in DOM");
      }

      return readableLimit; // Return the readable limit for further use
    })
    .catch(function(err) {
      console.error("Failed to fetch DepositLimit:", err);
      throw err; // Re-throw the error to propagate it
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
    let vars = web3.utils.toBN(n).toString('hex');
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
    const amount = document.getElementById('stakeAmount').value;
    const amountToSend = web3.utils.toWei(amount, 'ether');

    App.contracts.Token.methods.approve(App.contracts.Contest.options.address, amountToSend)
      .send({ from: App.account })
      .then(function(approvalResult) {
        console.log("Approval successful", approvalResult);
        alert("Approval successful. You can now proceed with the deposit.");
        // Enable the deposit button here
        document.getElementById('depositButton').disabled = false;
      })
      .catch(function(error) {
        console.error("Error in approval", error);
        alert("Error in approval. Please try again.");
      });
  },

  depositToLayer: function() {
    const recipient = document.getElementById('_queryId').value;
    const amount = document.getElementById('stakeAmount').value;
    const amountToSend = web3.utils.toWei(amount, 'ether');

    // Convert the current deposit limit and the amount to send into BN for comparison
    const amountToSendBN = web3.utils.toBN(amountToSend);
    const depositLimitBN = web3.utils.toBN(App.depositLimit);

    if (amountToSendBN.gt(depositLimitBN)) {
      return alert("Deposit amount exceeds the current deposit limit.");
    }

    // Proceed with the deposit
    App.contracts.Contest.methods.depositToLayer(amountToSend, recipient)
      .send({ from: App.account })
      .then(function(depositResult) {
        console.log("Deposit to layer successful", depositResult);
        alert("Deposit to layer successful!");
      })
      .catch(function(error) {
        console.error("Error in depositing to layer", error);
        alert("Error in depositing to layer. Please try again.");
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
            console.log('MetaMask is installed!');
            
            window.ethereum.request({ method: 'eth_requestAccounts' })
                .then(function (accounts) {
                    console.log('Accounts:', accounts);
                    App.account = accounts[0];
                    console.log('App.account set to:', App.account);
                    updateConnectedAddress();
                    return web3.eth.getChainId();
                })
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
                })
                .catch(function(error) {
                    console.error("Error during wallet connection:", error);
                    walletButton.disabled = false;
                });
        } else {
            console.log('MetaMask is not installed!');
            alert('Please install MetaMask to use this feature!');
        }
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