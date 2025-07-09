// Wallet Selection Modal
// Provides a UI for users to select from available Cosmos wallets

class WalletModal {
    constructor() {
        this.modal = null;
        this.isOpen = false;
        this.onWalletSelect = null;
        this.createModal();
    }

    createModal() {
        // Create modal container
        this.modal = document.createElement('div');
        this.modal.id = 'walletModal';
        this.modal.className = 'wallet-modal';
        this.modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;

        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'wallet-modal-content';
        modalContent.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 24px;
            max-width: 400px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        `;

        // Create header
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 16px;
            border-bottom: 1px solid #e5e7eb;
        `;

        const title = document.createElement('h2');
        title.textContent = 'Connect Cosmos Wallet';
        title.style.cssText = `
            margin: 0;
            font-size: 20px;
            font-weight: 600;
            color: #111827;
        `;

        const closeButton = document.createElement('button');
        closeButton.innerHTML = '&times;';
        closeButton.style.cssText = `
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #6b7280;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: background-color 0.2s;
        `;
        closeButton.onmouseover = () => closeButton.style.backgroundColor = '#f3f4f6';
        closeButton.onmouseout = () => closeButton.style.backgroundColor = 'transparent';
        closeButton.onclick = () => this.close();

        header.appendChild(title);
        header.appendChild(closeButton);

        // Create wallet list container
        const walletList = document.createElement('div');
        walletList.id = 'walletList';
        walletList.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 8px;
        `;

        // Create footer
        const footer = document.createElement('div');
        footer.style.cssText = `
            margin-top: 20px;
            padding-top: 16px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
        `;
        footer.innerHTML = `
            <p>Don't have a wallet? <a href="https://keplr.app/" target="_blank" style="color: #3b82f6; text-decoration: none;">Get Keplr</a></p>
        `;

        modalContent.appendChild(header);
        modalContent.appendChild(walletList);
        modalContent.appendChild(footer);
        this.modal.appendChild(modalContent);

        // Add to document
        document.body.appendChild(this.modal);

        // Close modal when clicking outside
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

    createWalletButton(wallet) {
        const button = document.createElement('button');
        button.className = 'wallet-option';
        button.style.cssText = `
            display: flex;
            align-items: center;
            padding: 16px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            background: white;
            cursor: pointer;
            transition: all 0.2s;
            text-align: left;
            width: 100%;
            font-family: inherit;
        `;

        button.onmouseover = () => {
            button.style.borderColor = '#3b82f6';
            button.style.backgroundColor = '#f8fafc';
        };

        button.onmouseout = () => {
            button.style.borderColor = '#e5e7eb';
            button.style.backgroundColor = 'white';
        };

        // Create wallet icon
        const icon = document.createElement('div');
        icon.style.cssText = `
            width: 40px;
            height: 40px;
            border-radius: 8px;
            background: ${this.getWalletColor(wallet.type)};
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 12px;
            font-weight: bold;
            color: white;
            font-size: 16px;
        `;
        icon.textContent = wallet.name.charAt(0);

        // Create wallet info
        const info = document.createElement('div');
        info.style.cssText = `
            flex: 1;
        `;

        const name = document.createElement('div');
        name.textContent = wallet.name;
        name.style.cssText = `
            font-weight: 600;
            color: #111827;
            margin-bottom: 4px;
        `;

        const description = document.createElement('div');
        description.textContent = wallet.description;
        description.style.cssText = `
            font-size: 14px;
            color: #6b7280;
        `;

        info.appendChild(name);
        info.appendChild(description);

        // Create arrow icon
        const arrow = document.createElement('div');
        arrow.innerHTML = '→';
        arrow.style.cssText = `
            color: #9ca3af;
            font-size: 18px;
            font-weight: bold;
        `;

        button.appendChild(icon);
        button.appendChild(info);
        button.appendChild(arrow);

        // Add click handler
        button.onclick = () => {
            if (this.onWalletSelect) {
                this.onWalletSelect(wallet.type);
            }
            this.close();
        };

        return button;
    }

    getWalletColor(walletType) {
        const colors = {
            'keplr': '#8B5CF6',
            'cosmostation': '#3B82F6',
            'leap': '#10B981',
            'station': '#F59E0B',
            'walletconnect': '#6366F1'
        };
        return colors[walletType] || '#6B7280';
    }

    open(onWalletSelect) {
        this.onWalletSelect = onWalletSelect;
        this.isOpen = true;
        this.modal.style.display = 'flex';

        // Populate wallet list
        this.populateWalletList();
    }

    close() {
        this.isOpen = false;
        this.modal.style.display = 'none';
        this.onWalletSelect = null;
    }

    populateWalletList() {
        const walletList = document.getElementById('walletList');
        walletList.innerHTML = '';

        if (!window.cosmosWalletAdapter) {
            walletList.innerHTML = '<p style="color: #6b7280; text-align: center;">Wallet adapter not loaded</p>';
            return;
        }

        const availableWallets = window.cosmosWalletAdapter.getWalletOptions();

        if (availableWallets.length === 0) {
            walletList.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #6b7280;">
                    <p>No Cosmos wallets detected</p>
                    <p style="font-size: 14px; margin-top: 8px;">
                        Please install a compatible wallet like Keplr, Cosmostation, or Leap
                    </p>
                </div>
            `;
            return;
        }

        availableWallets.forEach(wallet => {
            const walletButton = this.createWalletButton(wallet);
            walletList.appendChild(walletButton);
        });
    }
}

// Create global instance
window.walletModal = new WalletModal();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WalletModal;
} 