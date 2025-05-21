import { ethers } from '../node_modules/ethers/dist/ethers.esm.min.js';
import { 
    generateWithdrawalQueryId, 
    generateDepositQueryId,
    isWithdrawClaimed,
    Deposit
} from './js/bridgeContract.js';

// Create the App object
const App = {
  web3Provider: null,
  contracts: {},
  account: "0x0",
  accounts: [],
  bridgeAddress: {},
  tokenAddress: {},
  web3: null,
  ethers: null,  // Add ethers instance
  tokenDecimals: 0,
  depositLimit: null,
  depositId: 0,
  deposits: {},
  isProcessingAccountChange: false,
  keplrProvider: null,
  isKeplrConnected: false,
  connectedWallet: null,
  keplrAddress: null,

  _depositLimit: function() {
    return App.depositLimit;
  },

  init: function () {
    return new Promise((resolve, reject) => {
      try {
        // Initialize ethers
        App.ethers = ethers;
        
        // Wait for CosmJS to be loaded
        if (!window.cosmjsLoaded) {
          throw new Error('CosmJS not loaded yet');
        }

        // Verify CosmJS is available
        if (typeof window.cosmjs === 'undefined' || typeof window.cosmjs.stargate === 'undefined') {
          throw new Error('CosmJS not properly loaded');
        }

        App.initWeb3()
          .then(() => {
        App.initInputValidation();
            console.log("App initialized successfully");
            resolve();
          })
          .catch(error => {
            console.error("Error initializing app:", error);
            reject(error);
          });
      } catch (error) {
        console.error("Initialization error:", error);
        reject(error);
      }
    });
  },

  initWeb3: function () {
    return new Promise((resolve, reject) => {
      try {
        // Check for Keplr first
        if (typeof window.keplr !== 'undefined') {
          console.log("Keplr detected");
          App.keplrProvider = window.keplr;
          // Enable the button for Keplr
          document.getElementById("walletButton").disabled = false;
          resolve();
        } else if (typeof window.ethereum !== 'undefined') {
          // Existing Ethereum provider code
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

            if(App.web3Provider) {
                window.ethereum.removeListener('disconnect', handleDisconnect);
                window.ethereum.removeListener('chainChanged', handleChainChanged);
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
            }
            
            App.web3Provider = window.ethereum;
            App.web3 = new Web3(window.ethereum);
            
            window.ethereum.on('disconnect', handleDisconnect);
            window.ethereum.on('chainChanged', handleChainChanged);
            window.ethereum.on('accountsChanged', handleAccountsChanged);

            resolve();
        } else {
          console.log("No Web3 provider detected");
          // Don't reject, just resolve without a provider
          resolve();
        }
      } catch (error) {
        console.error("Error in initWeb3:", error);
        // Don't reject, just resolve without a provider
        resolve();
        }
    });
  },

  connectWallet: async function() {
    // Create wallet selection modal
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '1000';

    const modalContent = document.createElement('div');
    modalContent.style.backgroundColor = '#EFFEFC';
    modalContent.style.padding = '20px';
    modalContent.style.borderRadius = '10px';
    modalContent.style.textAlign = 'center';
    modalContent.style.fontFamily = "'PPNeueMontreal-Book', Arial, sans-serif";

    const title = document.createElement('h2');
    title.textContent = 'Select Wallet';
    title.style.color = '#003734';
    title.style.marginBottom = '20px';
    modalContent.appendChild(title);

    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.flexDirection = 'column';
    buttonContainer.style.gap = '10px';

    if (window.keplr) {
      const keplrButton = document.createElement('button');
      keplrButton.textContent = 'Connect Keplr';
      keplrButton.style.padding = '10px 20px';
      keplrButton.style.backgroundColor = '#003734';
      keplrButton.style.color = '#eefffb';
      keplrButton.style.border = 'none';
      keplrButton.style.borderRadius = '24px';
      keplrButton.style.cursor = 'pointer';
      keplrButton.style.fontFamily = "'PPNeueMontreal-Book', Arial, sans-serif";
      keplrButton.style.fontSize = '16px';
      keplrButton.onclick = async () => {
        try {
          // Configure Tellor chain
          await window.keplr.experimentalSuggestChain({
            "chainId": "layertest-4",
            "chainName": "Layer",
            "rpc": "https://node-palmito.tellorlayer.com/rpc",
            "rest": "https://node-palmito.tellorlayer.com/rpc",
            "bip44": {
              "coinType": 118
            },
            bech32Config: {
              bech32PrefixAccAddr: "tellor",
              bech32PrefixAccPub: "tellorpub",
              bech32PrefixValAddr: "tellorvaloper",
              bech32PrefixValPub: "tellorvaloperpub",
              bech32PrefixConsAddr: "tellorvalcons",
              bech32PrefixConsPub: "tellorvalconspub",
            },
            currencies: [
              {
                coinDenom: "TRB",
                coinMinimalDenom: "loya",
                coinDecimals: 6,
              },
            ],
            feeCurrencies: [
              {
                coinDenom: "TRB",
                coinMinimalDenom: "loya",
                coinDecimals: 6,
                gasPriceStep: {
                  low: 0.01,
                  average: 0.025,
                  high: 0.04,
                }
              },
            ],
            stakeCurrency: {
              coinDenom: "TRB",
              coinMinimalDenom: "loya",
              coinDecimals: 6,
            },
          });

          // Now enable the chain
          await window.keplr.enable('layertest-4');
          const offlineSigner = window.keplr.getOfflineSigner('layertest-4');
          const accounts = await offlineSigner.getAccounts();
          App.account = accounts[0].address;
          App.keplrAddress = accounts[0].address;
          App.isKeplrConnected = true;
          App.isConnected = true;
          document.getElementById('walletButton').innerHTML = `Disconnect Wallet <span class="truncated-address">(${App.account.substring(0, 6)}...${App.account.substring(App.account.length - 4)})</span>`;
          App.setPageParams();
          modal.remove();
        } catch (error) {
          console.error("Error connecting Keplr:", error);
          alert('Error connecting to Keplr wallet. Please make sure you have the latest version of Keplr installed.');
        }
      };
      buttonContainer.appendChild(keplrButton);
    }

    if (typeof window.ethereum !== 'undefined') {
      const metamaskButton = document.createElement('button');
      metamaskButton.textContent = 'Connect MetaMask';
      metamaskButton.style.padding = '10px 20px';
      metamaskButton.style.backgroundColor = '#003734';
      metamaskButton.style.color = '#eefffb';
      metamaskButton.style.border = 'none';
      metamaskButton.style.borderRadius = '24px';
      metamaskButton.style.cursor = 'pointer';
      metamaskButton.style.fontFamily = "'PPNeueMontreal-Book', Arial, sans-serif";
      metamaskButton.style.fontSize = '16px';
      metamaskButton.onclick = async () => {
      try {
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          
          // Initialize Web3
          App.web3Provider = window.ethereum;
          App.web3 = new Web3(window.ethereum);
          
          // Get chain ID and check if it's supported
          const chainId = await App.web3.eth.getChainId();
          App.chainId = chainId;
          
          if (!SUPPORTED_CHAIN_IDS[chainId]) {
            App.showNetworkAlert();
            throw new Error(`Unsupported network: ${chainId}`);
          }
          
          // Initialize contracts
          try {
            await App.initBridgeContract();
            await App.initTokenContract();
      } catch (error) {
            console.error("Contract initialization error:", error);
            throw new Error("Failed to initialize contracts. Please try again.");
          }
          
          // Update UI and state
          App.account = accounts[0];
          App.isConnected = true;
          const truncatedAddress = `${accounts[0].substring(0, 6)}...${accounts[0].substring(accounts[0].length - 4)}`;
          document.getElementById('walletButton').innerHTML = `Disconnect Wallet <span class="truncated-address">(${truncatedAddress})</span>`;
          
          // Fetch initial data
          try {
            await Promise.all([
              App.fetchDepositLimit(),
              App.updateBalance()
            ]);
          } catch (error) {
            console.error("Error fetching initial data:", error);
            // Continue even if this fails, as the wallet is still connected
          }
          
          App.setPageParams();
          modal.remove();
        } catch (error) {
          console.error("Error connecting MetaMask:", error);
          if (error.code === 4001) {
            alert('Please connect to MetaMask to continue.');
          } else if (error.message.includes("Unsupported network")) {
            alert('Please connect to a supported network (Sepolia, Arbitrum Goerli, etc.).');
          } else if (error.message.includes("Failed to initialize contracts")) {
            alert('Error initializing contracts. Please try again or contact support.');
    } else {
            alert('Error connecting to MetaMask. Please make sure you are on the correct network.');
          }
        }
      };
      buttonContainer.appendChild(metamaskButton);
    }

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.padding = '10px 20px';
    closeButton.style.backgroundColor = '#cccccc';
    closeButton.style.color = '#333';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '24px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.fontFamily = "'PPNeueMontreal-Book', Arial, sans-serif";
    closeButton.style.fontSize = '16px';
    closeButton.style.marginTop = '10px';
    closeButton.onclick = () => modal.remove();

    modalContent.appendChild(buttonContainer);
    modalContent.appendChild(closeButton);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
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
            keplrAddress: null,
            isConnected: false,
            isKeplrConnected: false,
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
        // Skip contract initialization for Keplr
        if (App.isKeplrConnected) {
            return true;
        }

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
            11155111: "0x5acb5977f35b1A91C4fE0F4386eB669E046776F2", // Sepolia
            421613: "0xb2CB696fE5244fB9004877e58dcB680cB86Ba444",   // Arbitrum Goerli
            1: "0x5acb5977f35b1A91C4fE0F4386eB669E046776F2",        // Mainnet
            137: "0x5acb5977f35b1A91C4fE0F4386eB669E046776F2",      // Polygon
            80001: "0x5acb5977f35b1A91C4fE0F4386eB669E046776F2",    // Mumbai
            100: "0x5acb5977f35b1A91C4fE0F4386eB669E046776F2",      // Gnosis
            10200: "0x5acb5977f35b1A91C4fE0F4386eB669E046776F2",    // Chiado
            10: "0x5acb5977f35b1A91C4fE0F4386eB669E046776F2",       // Optimism
            420: "0x5acb5977f35b1A91C4fE0F4386eB669E046776F2",      // Optimism Goerli
            42161: "0x5acb5977f35b1A91C4fE0F4386eB669E046776F2",    // Arbitrum
            421613: "0xb2CB696fE5244fB9004877e58dcB680cB86Ba444",   // Arbitrum Goerli
            3141: "0x5acb5977f35b1A91C4fE0F4386eB669E046776F2"      // Filecoin
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
          
          const tokenAddresses = {
            11155111: "0x80fc34a2f9FfE86F41580F47368289C402DEc660", // Sepolia
            421613: "0x8d1bB5eDdFce08B92dD47c9871d1805211C3Eb3C",   // Arbitrum Goerli
            1: "0x88dF592F8eb5D7Bd38bFeF7dEb0fBc02cf3778a0",        // Mainnet
            137: "0xE3322702BEdaaEd36CdDAb233360B939775ae5f1",      // Polygon
            80001: "0xce4e32fe9d894f8185271aa990d2db425df3e6be",    // Mumbai
            100: "0xAAd66432d27737ecf6ED183160Adc5eF36aB99f2",      // Gnosis
            10200: "0xe7147C5Ed14F545B4B17251992D1DB2bdfa26B6d",    // Chiado
            10: "0xaf8cA653Fa2772d58f4368B0a71980e9E3cEB888",       // Optimism
            420: "0x3251838bd813fdf6a97D32781e011cce8D225d59",      // Optimism Goerli
            42161: "0xd58D345Fd9c82262E087d2D0607624B410D88242",    // Arbitrum
            421613: "0x8d1bB5eDdFce08B92dD47c9871d1805211C3Eb3C",   // Arbitrum Goerli
            3141: "0xe7147C5Ed14F545B4B17251992D1DB2bdfa26B6d"      // Filecoin
          };

          const address = tokenAddresses[App.chainId];
          if (!address) {
            throw new Error(`No token address for chainId: ${App.chainId}`);
          }

          App.contracts.Token.options.address = address;
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

  setPageParams: function() {
    console.log("Setting page parameters...");
    // Update connected address in UI
    const connectedAddressElement = document.getElementById("connectedAddress");
        if (connectedAddressElement) {
      connectedAddressElement.textContent = App.account;
    }

    // If not using Keplr, check for Ethereum contracts
    if (!App.isKeplrConnected) {
      if (App.contracts.Bridge && App.contracts.Token) {
        document.getElementById('approveButton').disabled = false;
        document.getElementById('depositButton').disabled = false;
      }
    }

    // If connected to Keplr, fetch and display balance
    if (App.isKeplrConnected) {
      App.updateKeplrBalance();
      document.getElementById('withdrawButton').disabled = false;
    }

    // Add withdrawal history if wallet is connected
    if (App.isConnected || App.isKeplrConnected) {
      console.log("Wallet connected, adding withdrawal history...");
      App.addWithdrawalHistory();
    }
  },

  updateKeplrBalance: async function() {
    try {
        if (!App.isKeplrConnected) return;
        if (!window.cosmjsLoaded || !window.cosmjs || !window.cosmjs.stargate) {
            throw new Error("CosmJS not properly loaded");
        }

        const offlineSigner = window.keplr.getOfflineSigner('layertest-4');
        const signingClient = await window.cosmjs.stargate.SigningStargateClient.connectWithSigner(
            'https://node-palmito.tellorlayer.com/rpc',
            offlineSigner
        );

        const balance = await signingClient.getBalance(App.account, "loya");
        console.log('Raw balance:', balance);

        const balanceAmount = parseInt(balance.amount);
        const readableBalance = (balanceAmount / 1000000).toFixed(6);

        const balanceElement = document.getElementById("currentBalance");
        if (balanceElement) {
            balanceElement.textContent = `${readableBalance} TRB`;
        }
    } catch (error) {
        console.error("Error fetching Keplr balance:", error);
        const balanceElement = document.getElementById("currentBalance");
        if (balanceElement) {
            balanceElement.textContent = "0 TRB";
        }
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
        const response = await fetch('https://node-palmito.tellorlayer.com/tellor-io/layer/oracle/get_current_aggregate_report/5c13cd9c97dbb98f2429c101a2a8150e6c7a0ddaff6124ee176a3a411067ded0', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('TRB price data:', data);

        // The aggregate_value is in hex format, convert it to decimal
        const hexValue = data.aggregate.aggregate_value;
        const decimalValue = BigInt('0x' + hexValue);
        
        // Convert to USD (divide by 1e18 since the value is in wei)
        trbPrice = Number(decimalValue) / 1e18;
        
        console.log('TRB price in USD:', trbPrice);
      } catch (error) {
        console.warn('Error fetching TRB price from Tellor Layer:', error);
        trbPrice = 0.5; // Default value in USD
      }
    }

    // Update tooltip with USD value
    async function updateTooltip() {
      const amount = parseFloat(stakeAmountInput.value) || 0;
      if (amount > 0) {
        if (trbPrice === 0) {
          await updateTrbPrice();
        }
        if (trbPrice > 0) {
        const usdValue = (amount * trbPrice).toFixed(2);
        tooltip.textContent = `≈ $${usdValue} USD`;
        } else {
          tooltip.textContent = 'Price data unavailable';
        }
        tooltip.style.display = 'block';
        requestAnimationFrame(positionTooltip);
      } else {
        tooltip.style.display = 'none';
      }
    }

    // Update price every 60 seconds, but only if the page is visible
    let priceUpdateInterval;
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        clearInterval(priceUpdateInterval);
      } else {
    updateTrbPrice();
        priceUpdateInterval = setInterval(updateTrbPrice, 60000);
      }
    });

    // Initial price fetch
    updateTrbPrice().catch(error => {
      console.warn('Initial TRB price fetch failed:', error);
    });
    priceUpdateInterval = setInterval(updateTrbPrice, 60000);

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
    // Skip allowance check for Keplr
    if (App.isKeplrConnected) {
      return '0';
    }

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
  },

  withdrawFromLayer: async function() {
    try {
        if (!App.isKeplrConnected) {
            alert('Please connect your Keplr wallet first');
            return;
        }

        const amount = document.getElementById('stakeAmount').value;
        const ethereumAddress = document.getElementById('_queryId').value;

        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        if (!ethereumAddress || !ethereumAddress.startsWith('0x')) {
            alert('Please enter a valid Ethereum address');
            return;
        }

        // Convert amount to micro units (1 TRB = 1,000,000 micro units)
        const amountInMicroUnits = Math.floor(parseFloat(amount) * 1000000).toString();

        console.log('Starting withdrawal process...');
        console.log('Withdrawing with params:', {
            amount,
            amountInMicroUnits,
            ethereumAddress,
            account: App.account
        });

        const offlineSigner = window.keplr.getOfflineSigner('layertest-4');
        console.log('Got offline signer');

        const signingClient = await window.cosmjs.stargate.SigningStargateClient.connectWithSigner(
            'https://node-palmito.tellorlayer.com/rpc',
            offlineSigner
        );
        console.log('Connected to signing client');

        // Create the withdrawal message using proto helper
        const msg = window.layerProto.createMsgWithdrawTokens(
            App.account,
            ethereumAddress,
            {
                denom: "loya",
                amount: amountInMicroUnits
            }
        );

        console.log('Created message:', msg);

        // Set transaction fee
        const fee = {
            amount: [{ denom: "loya", amount: "5000" }],
            gas: "200000"
        };

        App.showPendingPopup("Withdrawal transaction pending...");
        console.log('Showing pending popup');

        try {
            console.log('Attempting to sign and broadcast transaction...');
            // Send the transaction
            const result = await signingClient.signAndBroadcast(
                App.account,
                [msg],
                fee,
                "Withdraw TRB to Ethereum"
            );

            console.log('Transaction result:', result);

            if (result.code === 0) {
                App.hidePendingPopup();
                App.showSuccessPopup("Withdrawal successful! You will need to wait 12 hours before you can claim your tokens on Ethereum.");
                await App.updateKeplrBalance();
            } else {
                const errorMsg = result.rawLog || 'Transaction failed';
                console.error('Transaction failed:', errorMsg);
                App.hidePendingPopup();
                throw new Error(errorMsg);
            }
        } catch (error) {
            console.error('Transaction error:', error);
            App.hidePendingPopup();
            throw error;
        }
    } catch (error) {
        App.hidePendingPopup();
        console.error("Error in withdrawal:", error);
        console.error("Error details:", {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        alert(error.message || "Error in withdrawal. Please try again.");
    }
  },

  // Add withdrawal history functions
  addWithdrawalHistory: async function() {
    console.log("Starting addWithdrawalHistory...");
    const boxWrapper = document.querySelector('.box-wrapper');
    console.log("Box wrapper found:", !!boxWrapper);

    // Check if withdrawal history already exists
    const existingHistory = document.querySelector('.withdrawal-history-container');
    if (existingHistory) {
        console.log("Withdrawal history already exists, updating...");
        await this.updateWithdrawalHistory();
        return;
    }

    // Create withdrawal history UI with improved styling
    const historyContainer = document.createElement('div');
    historyContainer.className = 'withdrawal-history-container';
    historyContainer.innerHTML = `
        <div class="history-header">
            <h3>Bridge Transactions</h3>
            <div class="history-subtitle">View your deposits and withdrawals</div>
        </div>
        <div class="withdrawal-table-container">
            <table id="withdrawal-history" class="withdrawal-table">
                <thead>
                    <tr>
                        <th>Type</th>
                        <th>ID</th>
                        <th>Sender</th>
                        <th>Recipient</th>
                        <th class="amount-column">Amount (TRB)</th>
                        <th>Time</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td colspan="7" class="loading-message">Loading transaction history...</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;

    // Add styles for the withdrawal history
    const style = document.createElement('style');
    style.textContent = `
        .withdrawal-history-container {
            background: #ffffff;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            margin-top: 20px;
            padding: 20px;
        }
        .history-header {
            margin-bottom: 20px;
        }
        .history-header h3 {
            color: #2d3748;
            font-size: 1.5rem;
            margin: 0;
        }
        .history-subtitle {
            color: #718096;
            font-size: 0.875rem;
            margin-top: 4px;
        }
        .withdrawal-table-container {
            overflow-x: auto;
            width: 100%;
        }
        .withdrawal-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.875rem;
        }
        .withdrawal-table th {
            background: #f7fafc;
            color: #4a5568;
            font-weight: 600;
            padding: 12px;
            text-align: left;
            border-bottom: 2px solid #e2e8f0;
        }
        .withdrawal-table td {
            padding: 12px;
            border-bottom: 1px solid #e2e8f0;
            color: #2d3748;
        }
        .withdrawal-table tr:hover {
            background-color: #f7fafc;
        }
        .amount-column {
            text-align: right;
        }
        .type-deposit {
            color: #3182ce;
            font-weight: 500;
        }
        .type-withdrawal {
            color: #38a169;
            font-weight: 500;
        }
        .status-true {
            color: #38a169;
            font-weight: 500;
        }
        .status-false {
            color: #e53e3e;
            font-weight: 500;
        }
        .address-cell {
            display: flex;
            align-items: center;
            gap: 4px;
            cursor: pointer;
            position: relative;
        }
        .address-cell:hover {
            color: #3182ce;
        }
        .address-cell .tooltip {
            visibility: hidden;
            position: absolute;
            background-color: #2d3748;
            color: #fff;
            text-align: center;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.75rem;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            white-space: nowrap;
            z-index: 1;
        }
        .address-cell:hover .tooltip {
            visibility: visible;
        }
        .loading-message, .no-withdrawals, .error-message {
            text-align: center;
            padding: 20px;
            color: #718096;
        }
        .error-message {
            color: #e53e3e;
        }
        .error-message small {
            display: block;
            margin-top: 8px;
            font-size: 0.75rem;
        }
    `;
    document.head.appendChild(style);

    // Find the last element in box-wrapper that isn't the withdrawal history
    const lastElement = Array.from(boxWrapper.children)
        .filter(child => !child.classList.contains('withdrawal-history-container'))
        .pop();

    if (lastElement) {
        console.log("Inserting withdrawal history after last element");
        lastElement.after(historyContainer);
    } else {
        console.log("No elements found, appending to box-wrapper");
        boxWrapper.appendChild(historyContainer);
    }

    // Fetch and display withdrawal history
    console.log("Calling updateWithdrawalHistory...");
    await this.updateWithdrawalHistory();
  },

  // Function to fetch withdrawal history
  getWithdrawalHistory: async function() {
    try {
        const address = App.keplrAddress;
        if (!address) {
            console.log('No Keplr address available, skipping withdrawal history');
            return [];
        }

        console.log('Getting withdrawal history for address:', address);
        
        // Use the correct API endpoint
        const baseEndpoint = 'https://node-palmito.tellorlayer.com';
        
        // Get last withdrawal ID with proper error handling
        const response = await fetch(`${baseEndpoint}/layer/bridge/get_last_withdrawal_id`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error('Failed to fetch last withdrawal ID:', response.status);
            return [];
        }

        const data = await response.json();
        const lastWithdrawalId = Number(data.withdrawal_id);
        console.log('Last withdrawal ID:', lastWithdrawalId);

        if (!lastWithdrawalId || lastWithdrawalId <= 0) {
            console.log('No withdrawals found in the system');
            return [];
        }

        // Create arrays for withdrawal data and claim status promises
        const withdrawalPromises = [];
        const claimStatusPromises = [];

        // Create promises for all withdrawals
        for (let id = 1; id <= lastWithdrawalId; id++) {
            const queryId = generateWithdrawalQueryId(id);
            withdrawalPromises.push(this.fetchWithdrawalData(queryId));
            // Use the correct endpoint for checking claim status
            claimStatusPromises.push(
                fetch(`${baseEndpoint}/layer/bridge/is_withdrawal_claimed/${id}`)
                    .then(res => res.ok ? res.json() : { claimed: false })
                    .catch(() => ({ claimed: false }))
            );
        }

        console.log(`Fetching data for ${lastWithdrawalId} withdrawals...`);

        // Process all withdrawals in parallel
        const [withdrawalResults, claimStatuses] = await Promise.all([
            Promise.all(withdrawalPromises),
            Promise.all(claimStatusPromises)
        ]);

        // Filter and process valid withdrawals
        const withdrawals = withdrawalResults
            .map((withdrawalData, index) => {
                if (!withdrawalData) {
                    console.log(`No data found for withdrawal ${index + 1}`);
                    return null;
                }

                const id = index + 1;
                // Clean up recipient address by removing null bytes and any prefix
                const cleanRecipient = withdrawalData.recipient
                    .replace(/\0/g, '')  // Remove null bytes
                    .replace(/^tellor-?/, '')  // Remove tellor prefix if present
                    .trim();
                
                // Clean up current address
                const cleanAddress = address
                    .replace(/^tellor-?/, '')  // Remove tellor prefix if present
                    .trim();

                console.log('Processing withdrawal', id, {
                    recipient: cleanRecipient.toLowerCase(),
                    address: cleanAddress.toLowerCase(),
                    matches: cleanRecipient.toLowerCase() === cleanAddress.toLowerCase()
                });

                // Use exact match for addresses
                if (cleanRecipient.toLowerCase() === cleanAddress.toLowerCase()) {
                    return {
                        id,
                        sender: withdrawalData.sender,
                        recipient: cleanRecipient,
                        amount: withdrawalData.amount,
                        timestamp: withdrawalData.timestamp,
                        claimed: claimStatuses[index]?.claimed || false
                    };
                }
                return null;
            })
            .filter(withdrawal => withdrawal !== null)
            .sort((a, b) => b.id - a.id); // Sort by ID in descending order

        console.log('Found withdrawals for current address:', withdrawals.length);
        return withdrawals;
    } catch (error) {
        console.error('Error in getWithdrawalHistory:', error);
        return [];
    }
  },

  fetchWithdrawalData: async function(queryId, retryCount = 0) {
    try {
        console.log('Fetching withdrawal data for query ID:', queryId);
        const endpoint = `https://node-palmito.tellorlayer.com/tellor-io/layer/oracle/get_current_aggregate_report/${queryId}`;
        console.log('Calling endpoint:', endpoint);
        
        const response = await fetch(endpoint);
        console.log('Response status:', response.status);
        
        // Check if response is HTML instead of JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
            throw new Error('Server returned HTML instead of JSON. The API endpoint may be down.');
        }
        
        if (!response.ok) {
            if (response.status === 400) {
                console.log('No data found for query ID:', queryId);
                return null;
            }
            // Retry on server errors (5xx) or network errors
            if ((response.status >= 500 || response.status === 0) && retryCount < 3) {
                console.log(`Retrying fetch for query ID ${queryId} (attempt ${retryCount + 1})...`);
                await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
                return this.fetchWithdrawalData(queryId, retryCount + 1);
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Oracle response data:', data);

        if (!data || !data.aggregate || !data.aggregate.aggregate_value) {
            console.log('No value in oracle response');
            return null;
        }

        // Parse the withdrawal data from the aggregate value
        const withdrawalData = this.parseWithdrawalData(data.aggregate.aggregate_value);
        console.log('Parsed withdrawal data:', withdrawalData);
        
        if (!withdrawalData) {
            console.log('Failed to parse withdrawal data');
            return null;
        }

        // Add the timestamp from the oracle data
        withdrawalData.timestamp = data.timestamp;
        console.log('Added timestamp from oracle data:', withdrawalData.timestamp);

        return withdrawalData;
    } catch (error) {
        console.error('Error in fetchWithdrawalData:', error);
        // Retry on network errors or if we haven't exceeded retry limit
        if (retryCount < 3 && (error.message.includes('NetworkError') || error.message.includes('Failed to fetch'))) {
            console.log(`Retrying fetch for query ID ${queryId} (attempt ${retryCount + 1})...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
            return this.fetchWithdrawalData(queryId, retryCount + 1);
        }
        return null;
    }
  },

  parseWithdrawalData: function(data) {
    try {
        console.log('Parsing withdrawal data:', data);
        
        // Add 0x prefix if not present
        const hexData = data.startsWith('0x') ? data : '0x' + data;
        
        // Convert to bytes
        const bytes = ethers.utils.arrayify(hexData);
        
        // Define the ABI types for decoding
        const abiCoder = new ethers.utils.AbiCoder();
        const types = ['address', 'string', 'uint256', 'uint256'];
        
        // Decode the bytes
        const [sender, recipient, amount, tip] = abiCoder.decode(types, bytes);
        
        console.log('Decoded withdrawal data:', {
            sender,
            recipient,
            amount: amount.toString(),
            tip: tip.toString()
        });

        return {
            sender,
            recipient,
            amount,
            tip
        };
    } catch (error) {
        console.error('Error parsing withdrawal data:', error);
        return null;
    }
  },

  // Function to update withdrawal history UI
  updateWithdrawalHistory: async function() {
    try {
        const withdrawals = await this.getWithdrawalHistory();
        console.log('Fetched withdrawals:', withdrawals);

        const tableBody = document.querySelector('#withdrawal-history tbody');
        if (!tableBody) {
            console.error('Withdrawal history table body not found');
            return;
        }

        // Clear existing content
        tableBody.innerHTML = '';

        if (!withdrawals || withdrawals.length === 0) {
            console.log('No withdrawals found to display');
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="no-withdrawals">
                        No bridge transactions found. If you've made transactions, they may still be processing. Check back later.
                    </td>
                </tr>
            `;
            return;
        }

        // Create and append withdrawal rows
        for (const withdrawal of withdrawals) {
            if (!withdrawal || !withdrawal.amount) {
                console.log('Skipping invalid withdrawal data:', withdrawal);
                continue;
            }

            try {
                // Convert amount from wei to TRB (divide by 1e18)
                const amount = Number(withdrawal.amount) / 1e18;
                const date = new Date(withdrawal.timestamp).toLocaleString();
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="type-withdrawal">Withdrawal</td>
                    <td>${withdrawal.id}</td>
                    <td class="address-cell" title="${withdrawal.sender}">${this.formatAddress(withdrawal.sender)}</td>
                    <td class="address-cell" title="${withdrawal.recipient}">${this.formatAddress(withdrawal.recipient)}</td>
                    <td class="amount-column">${amount.toFixed(6)} TRB</td>
                    <td>${date}</td>
                    <td class="status-${withdrawal.claimed}">${withdrawal.claimed ? 'Claimed' : 'Pending'}</td>
                    <td>
                        ${!withdrawal.claimed ? 
                            `<button class="attest-button" onclick="App.requestAttestation(${withdrawal.id})" 
                                style="background-color: #003734; color: #eefffb; border: none; padding: 5px 10px; 
                                border-radius: 4px; cursor: pointer; font-family: 'PPNeueMontreal-Book', Arial, sans-serif;">
                                Request Attestation
                            </button>` 
                            : ''}
                    </td>
                `;
                tableBody.appendChild(row);
            } catch (error) {
                console.error('Error formatting withdrawal:', withdrawal, error);
            }
        }

        // Add styles for the attestation button
        const style = document.createElement('style');
        style.textContent = `
            .attest-button:hover {
                background-color: #002220 !important;
            }
            .attest-button:disabled {
                background-color: #cccccc !important;
                cursor: not-allowed;
            }
        `;
        document.head.appendChild(style);
    } catch (error) {
        console.error('Error updating withdrawal history:', error);
        const tableBody = document.querySelector('#withdrawal-history tbody');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="error-message">
                        Error loading withdrawal history. Please try again later.
                        <small>${error.message}</small>
                    </td>
                </tr>
            `;
        }
    }
  },

  formatAddress: function(address) {
    if (!address) return 'N/A';
    if (address.startsWith('tellor')) {
        return `${address.slice(0, 8)}...${address.slice(-4)}`;
    }
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  },

  formatAmount: function(amount) {
    const amountInTRB = Number(amount) / 1000000;
    return amountInTRB.toLocaleString('en-US', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    });
  },

  showBalanceErrorPopup: function(message) {
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
  },

  hideBalanceErrorPopup: function() {
    const popup = document.getElementById('balanceErrorPopup');
    if (popup) {
      popup.remove();
    }
  },

  // Add new function to handle attestation requests
  requestAttestation: async function(withdrawalId) {
    try {
        if (!App.isConnected) {
            alert('Please connect your wallet first');
            return;
        }

        const button = document.querySelector(`button[onclick="App.requestAttestation(${withdrawalId})"]`);
        if (button) {
            button.disabled = true;
            button.textContent = 'Requesting...';
        }

        App.showPendingPopup("Requesting attestation...");

        // Generate the query ID for the withdrawal
        const queryId = generateWithdrawalQueryId(withdrawalId);

        // Fetch the withdrawal data to get the correct timestamp
        const withdrawalData = await this.fetchWithdrawalData(queryId);
        if (!withdrawalData || !withdrawalData.timestamp) {
            throw new Error('Could not find withdrawal data in oracle. The withdrawal may not be ready for attestation yet.');
        }

        // Use the timestamp from the oracle data
        const timestamp = withdrawalData.timestamp;

        // Get the Layer account from Keplr
        const offlineSigner = window.getOfflineSigner('layertest-4');
        const accounts = await offlineSigner.getAccounts();
        const layerAccount = accounts[0].address;

        // Create and send the attestation request
        const result = await window.cosmjs.stargate.requestAttestations(
            layerAccount,
            queryId,
            timestamp
        );

        App.hidePendingPopup();
        
        if (result && result.code === 0) {
            App.showSuccessPopup("Attestation requested successfully!");
            // Refresh the withdrawal history
            await this.updateWithdrawalHistory();
        } else {
            throw new Error(result?.rawLog || "Transaction failed");
        }
    } catch (error) {
        console.error('Error requesting attestation:', error);
        App.hidePendingPopup();
        App.showErrorPopup(error.message || "Error requesting attestation. Please try again.");
        
        // Re-enable the button if there was an error
        const button = document.querySelector(`button[onclick="App.requestAttestation(${withdrawalId})"]`);
        if (button) {
            button.disabled = false;
            button.textContent = 'Request Attestation';
        }
    }
  },

  showErrorPopup: function(message) {
    const popup = document.createElement('div');
    popup.id = 'errorPopup';
    popup.style.position = 'fixed';
    popup.style.top = '50%';
    popup.style.left = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    popup.style.padding = '50px';
    popup.style.backgroundColor = '#FFE5E5';
    popup.style.color = '#D32F2F';
    popup.style.borderRadius = '10px';
    popup.style.zIndex = '1000';
    popup.style.border = '3px solid #D32F2F';
    popup.style.fontFamily = "'PPNeueMontreal-Book', Arial, sans-serif";
    popup.style.fontSize = "15px";
    popup.style.width = '250px';
    popup.style.textAlign = 'center';
  
    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;
    popup.appendChild(messageSpan);
  
    document.body.appendChild(popup);
  
    // Remove the popup after 5 seconds
    setTimeout(() => {
      const popup = document.getElementById('errorPopup');
      if (popup) {
        popup.remove();
      }
    }, 5000);
  },
};

// Export App to window object for global access
window.App = App;

// Export App as default for module usage
export default App;

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
            // Initialize app regardless of provider availability
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
            // Show user-friendly error message but keep button enabled
            document.getElementById("walletButton").textContent = 'Connect Wallet';
            document.getElementById("walletButton").disabled = false;
        }
    });
});

$(document).ready(function() {
    document.getElementById('depositButton').disabled = true;
});

async function checkBalance(amount) {
  if (!App.contracts.Token || !App.account) return true;
  
  try {
    const balance = await App.contracts.Token.methods.balanceOf(App.account).call();
    const amountWei = App.web3.utils.toWei(amount.toString(), 'ether');
    
    if (App.web3.utils.toBN(amountWei).gt(App.web3.utils.toBN(balance))) {
      const readableBalance = App.web3.utils.fromWei(balance, 'ether');
      App.showBalanceErrorPopup(`Insufficient balance. You have ${readableBalance} TRB but trying to deposit ${amount} TRB`);
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