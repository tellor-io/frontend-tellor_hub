var App = {
  web3Provider: null,
  contracts: {},
  account: "0x0",
  accounts: [],
  contestAddress: {}, 
  tokenAddress: {},
  web3,
  tokenDecimals: 0,
  currentDepositLimit: null,
  depositId: 0, // Initialize depositId here
  deposits: {}, // Assuming you also need a structure to store deposit details
  //currentDepositLimit: 0, // Initialize currentDepositLimit in the App object
  //depositLimitUpdateTime: 0, // Initialize depositLimitUpdateTime in the App object

  _depositLimit: function() {
    return App.currentDepositLimit;
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
        resolve(App.initEth()); // Ensure this resolves with initEth
      } else {
        console.log("Using localhost");
        web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
        resolve(App.initEth()); // Ensure this resolves with initEth
      }
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
            .then(App.fetchCurrentDepositLimit);
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
          App.contracts.Contest.options.address = "0x17d9282cf0EB5705F6c0F4426a5E780bB9a1Ffe8";
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
        App.contracts.Token.options.address = "0x99CAAb1d5a46098FAD0dF0505a0C42965e020F7E" //eth sepolia 
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
      resolve(); // Resolve the promise after all setup is done
    }).fail(reject); // Reject the promise on failure
  });
},

fetchCurrentDepositLimit: function() {
  App.contracts.Contest.methods.currentDepositLimit().call()
    .then(function(result) {
      App.currentDepositLimit = result;
      console.log("Updated currentDepositLimit:", App.currentDepositLimit);
      // Convert from wei to ether (or any other unit your token uses)
    const readableLimit = web3.utils.fromWei(App.currentDepositLimit, 'ether');

    // Update the DOM
    document.getElementById("depositLimit").className = "contest-address-style";

    document.getElementById("depositLimit").innerText = readableLimit + ' Tokens';
  })
  .catch(function(err) {
    console.error("Failed to fetch currentDepositLimit:", err);
  });
},

  setPageParams: function () {
    document.getElementById("connectedAddress").className = "contest-address-style";
    if (document.getElementById("connectedAddress")) {
        document.getElementById("connectedAddress").innerHTML = App.account;
    }
    console.log("Account:", App.account);
    console.log("Contest Address:", App.contracts.Contest.options.address); // Keep this line to log the address to the console
    console.log("Current Deposit Limit:", App.currentDepositLimit);
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

  depositToLayer: function() {
    const recipient = document.getElementById('_queryId').value;
    const amount = document.getElementById('stakeAmount').value;
    const amountToSend = web3.utils.toWei(amount, 'ether');
  
    // Convert the current deposit limit and the amount to send into BN for comparison
    const amountToSendBN = web3.utils.toBN(amountToSend);
    const currentDepositLimitBN = web3.utils.toBN(App.currentDepositLimit);
  
    if (amountToSendBN.gt(currentDepositLimitBN)) {
      return alert("Deposit amount exceeds the current deposit limit.");
    }
  
    // Proceed with the deposit if the amount is within the limit
    App.contracts.Token.methods.approve(App.contracts.Contest.options.address, amountToSend)
      .send({ from: App.account })
      .then(function(approvalResult) {
        console.log("Approval successful", approvalResult);
        return App.contracts.Contest.methods.depositToLayer(amountToSend, recipient)
          .send({ from: App.account });
      })
      .then(function(depositResult) {
        console.log("Deposit to layer successful", depositResult);
      })
      .catch(function(error) {
        console.error("Error in depositing to layer", error);
      });
  }

};

$(function () {
  $(window).load(function () {
    document.getElementById("connectButton").disabled = false;
    App.init().then(function() {
      App.setPageParams(); // Ensure this is called after initialization
    }).catch(function(error) {
      console.error("Initialization failed:", error);
    });
  });
});
