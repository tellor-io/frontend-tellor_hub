// Bridge contract interface for Layer Bridge
// Mirrors the functionality from the bridge explorer implementation



// Helper function to convert BigInt to string for JSON serialization
const bigIntToString = (obj) => {
    if (typeof obj === 'bigint') {
        return obj.toString();
    }
    if (Array.isArray(obj)) {
        return obj.map(bigIntToString);
    }
    if (typeof obj === 'object' && obj !== null) {
        return Object.fromEntries(
            Object.entries(obj).map(([k, v]) => [k, bigIntToString(v)])
        );
    }
    return obj;
};

// Helper function to convert string back to BigInt for deserialization
const stringToBigInt = (obj) => {
    if (typeof obj === 'string' && /^\d+n$/.test(obj)) {
        return BigInt(obj.slice(0, -1));
    }
    if (Array.isArray(obj)) {
        return obj.map(stringToBigInt);
    }
    if (typeof obj === 'object' && obj !== null) {
        return Object.fromEntries(
            Object.entries(obj).map(([k, v]) => [k, stringToBigInt(v)])
        );
    }
    return obj;
};

// Deposit interface
export class Deposit {
    constructor(id, sender, recipient, amount, tip, blockHeight, blockTimestamp) {
        this.id = id;
        this.sender = sender;
        this.recipient = recipient;
        this.amount = BigInt(amount);
        this.tip = BigInt(tip);
        this.blockHeight = BigInt(blockHeight);
        this.blockTimestamp = blockTimestamp ? new Date(blockTimestamp) : undefined;
    }

    toJSON() {
        return bigIntToString(this);
    }

    static fromJSON(json) {
        const data = stringToBigInt(json);
        return new Deposit(
            data.id,
            data.sender,
            data.recipient,
            data.amount,
            data.tip,
            data.blockHeight,
            data.blockTimestamp
        );
    }
}

// Helper function to get API endpoint based on current network
const getApiEndpoint = () => {
    // Check if App is available and has chainId
    if (typeof window !== 'undefined' && window.App && window.App.chainId) {
        if (window.App.chainId === 1) {
            return 'https://mainnet.tellorlayer.com';
        }
    }
    return 'https://node-palmito.tellorlayer.com';
};

// API functions
export const getDeposits = async () => {
    const response = await fetch(`${getApiEndpoint()}/layer/bridge/get_deposits`);
    const data = await response.json();
    return data.map(deposit => Deposit.fromJSON(deposit));
};

export const getDepositId = async () => {
    const response = await fetch(`${getApiEndpoint()}/layer/bridge/get_last_deposit_id`);
    const data = await response.json();
    return Number(data.deposit_id);
};

export const isWithdrawClaimed = async (id) => {
    const response = await fetch(`${getApiEndpoint()}/layer/bridge/is_withdrawal_claimed/${id}`);
    const data = await response.json();
    return data.claimed;
};

// Query ID generation functions
export const generateDepositQueryId = (depositId) => {
    // Create a new Web3 instance for ABI encoding
    const web3 = new Web3();
    
    // Encode inner data (bool, uint256)
    const innerData = web3.eth.abi.encodeParameters(
        ['bool', 'uint256'],
        [true, depositId]
    );

    // Encode outer data (string, bytes)
    const queryData = web3.eth.abi.encodeParameters(
        ['string', 'bytes'],
        ['TRBBridge', innerData]
    );

    // Hash the query data and remove '0x' prefix
    const queryId = web3.utils.keccak256(queryData);
    return queryId.slice(2);
};

export const generateWithdrawalQueryId = (withdrawalId) => {
    // Create a new Web3 instance for ABI encoding
    const web3 = new Web3();
    
    // Encode inner data (bool, uint256)
    const innerData = web3.eth.abi.encodeParameters(
        ['bool', 'uint256'],
        [false, withdrawalId]
    );

    // Encode outer data (string, bytes)
    const queryData = web3.eth.abi.encodeParameters(
        ['string', 'bytes'],
        ['TRBBridge', innerData]
    );

    // Hash the query data and remove '0x' prefix
    const queryId = web3.utils.keccak256(queryData);
    return queryId.slice(2);
};

// Export all functions and classes
export default {
    Deposit,
    getDeposits,
    getDepositId,
    isWithdrawClaimed,
    generateDepositQueryId,
    generateWithdrawalQueryId
}; 