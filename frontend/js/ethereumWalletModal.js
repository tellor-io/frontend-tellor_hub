/**
 * Ethereum Wallet Selection Modal
 * Provides a user-friendly interface for selecting Ethereum wallets
 */

class EthereumWalletModal {
    constructor() {
        this.modal = null;
        this.callback = null;
        this.isOpen = false;
    }

    // Create modal HTML
    createModal() {
        const modalHTML = `
            <div id="ethereum-wallet-modal" class="wallet-modal-overlay" style="display: none;">
                <div class="wallet-modal">
                    <div class="wallet-modal-header">
                        <h3>Connect Ethereum Wallet</h3>
                        <button class="wallet-modal-close" onclick="window.ethereumWalletModal.close()">&times;</button>
                    </div>
                    <div class="wallet-modal-content">
                        <p class="wallet-modal-description">Choose your preferred Ethereum wallet to connect:</p>
                        <div id="ethereum-wallet-list" class="wallet-list">
                            <!-- Wallet options will be populated here -->
                        </div>
                        <div class="wallet-modal-footer">
                            <p class="wallet-modal-note">Don't have a wallet? <a href="https://metamask.io/download/" target="_blank">Get MetaMask</a></p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to page if it doesn't exist
        if (!document.getElementById('ethereum-wallet-modal')) {
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }

        this.modal = document.getElementById('ethereum-wallet-modal');
        this.setupEventListeners();
    }

    // Setup event listeners
    setupEventListeners() {
        // Close modal when clicking overlay
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }

    // Open modal
    open(callback) {
        if (!window.ethereumWalletAdapter) {
            console.error('Ethereum wallet adapter not available');
            return;
        }

        this.callback = callback;
        this.createModal();
        this.populateWalletList();
        this.show();
    }

    // Show modal
    show() {
        this.modal.style.display = 'flex';
        this.isOpen = true;
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    // Close modal
    close() {
        if (this.modal) {
            this.modal.style.display = 'none';
            this.isOpen = false;
            document.body.style.overflow = ''; // Restore scrolling
        }
        
        if (this.callback) {
            this.callback(null); // Call with null to indicate cancellation
            this.callback = null;
        }
    }

    // Close modal on success (without calling callback)
    closeOnSuccess() {
        if (this.modal) {
            this.modal.style.display = 'none';
            this.isOpen = false;
            document.body.style.overflow = ''; // Restore scrolling
        }
    }

    // Populate wallet list
    populateWalletList() {
        const walletList = document.getElementById('ethereum-wallet-list');
        const availableWallets = window.ethereumWalletAdapter.detectWallets();

        if (availableWallets.length === 0) {
            walletList.innerHTML = `
                <div class="wallet-item disabled">
                    <div class="wallet-icon">⚠️</div>
                    <div class="wallet-info">
                        <div class="wallet-name">No Wallets Available</div>
                        <div class="wallet-description">Please install an Ethereum wallet to continue</div>
                    </div>
                </div>
            `;
            return;
        }

        walletList.innerHTML = availableWallets.map(wallet => {
            const icon = this.getWalletIcon(wallet.type);
            const description = this.getWalletDescription(wallet.type);
            
            return `
                <div class="wallet-item" onclick="window.ethereumWalletModal.selectWallet('${wallet.type}')">
                    <div class="wallet-icon">${icon}</div>
                    <div class="wallet-info">
                        <div class="wallet-name">${wallet.name}</div>
                        <div class="wallet-description">${description}</div>
                    </div>
                    <div class="wallet-arrow">→</div>
                </div>
            `;
        }).join('');
    }

    // Get wallet icon
    getWalletIcon(walletType) {
        const icons = {
            'metamask': '🦊',
            'walletconnect': '🔗',
            'coinbase': '🪙',
            'trust': '🛡️',
            'rainbow': '🌈',
            'generic': '🔗'
        };
        return icons[walletType] || '🔗';
    }

    // Get wallet description
    getWalletDescription(walletType) {
        const descriptions = {
            'metamask': 'Popular browser extension wallet',
            'walletconnect': 'Connect any mobile wallet',
            'coinbase': 'Coinbase exchange wallet',
            'trust': 'Trust Wallet mobile app',
            'rainbow': 'Beautiful mobile wallet',
            'generic': 'Generic Ethereum provider'
        };
        return descriptions[walletType] || 'Ethereum wallet';
    }

    // Select wallet
    async selectWallet(walletType) {
        try {
            // Show loading state
            this.showLoading(walletType);
            
            // Connect to wallet directly using the adapter
            const result = await window.ethereumWalletAdapter.connectToWallet(walletType);
            
            console.log(`Successfully connected to ${result.walletName}`);
            
            // Close modal on success (without triggering cancellation callback)
            this.closeOnSuccess();
            
            // Call callback with the wallet type to let the main app handle the rest
            if (this.callback) {
                this.callback(walletType);
                this.callback = null; // Clear callback after successful call
            }
            
        } catch (error) {
            console.error('Wallet connection failed:', error);
            this.showError(error.message);
        }
    }

    // Show loading state
    showLoading(walletType) {
        const walletList = document.getElementById('ethereum-wallet-list');
        const walletItems = walletList.querySelectorAll('.wallet-item');
        
        walletItems.forEach(item => {
            const itemType = item.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
            if (itemType === walletType) {
                item.innerHTML = `
                    <div class="wallet-icon">⏳</div>
                    <div class="wallet-info">
                        <div class="wallet-name">Connecting...</div>
                        <div class="wallet-description">Please approve in your wallet</div>
                    </div>
                `;
                item.style.pointerEvents = 'none';
            }
        });
    }

    // Show error
    showError(message) {
        const walletList = document.getElementById('ethereum-wallet-list');
        walletList.innerHTML = `
            <div class="wallet-error">
                <div class="error-icon">❌</div>
                <div class="error-message">${message}</div>
                <button class="error-retry" onclick="window.ethereumWalletModal.populateWalletList()">Try Again</button>
            </div>
        `;
    }
}

// Create global instance
window.ethereumWalletModal = new EthereumWalletModal(); 