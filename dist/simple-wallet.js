// Simple wallet connection without external dependencies
console.log('🔧 Loading simple wallet connection...');

// Override connectWallet function with a simpler version
window.connectWalletSimple = async function() {
    if (!window.ethereum) {
        showMessage('Please install MetaMask wallet', 'error');
        return;
    }
    
    try {
        showLoading('Connecting wallet...');
        console.log('🔌 Starting simple wallet connection');
        
        // Request account access
        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });
        
        if (accounts.length > 0) {
            const account = accounts[0];
            console.log('✅ Connected account:', account);
            
            // Get chain ID
            const chainId = await window.ethereum.request({
                method: 'eth_chainId'
            });
            console.log('🔗 Chain ID:', chainId);
            
            // Try to switch to Sepolia if not already connected
            const sepoliaChainId = '0xaa36a7';
            if (chainId !== sepoliaChainId) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: sepoliaChainId }],
                    });
                    console.log('🔄 Switched to Sepolia');
                } catch (switchError) {
                    if (switchError.code === 4902) {
                        // Add Sepolia network
                        try {
                            await window.ethereum.request({
                                method: 'wallet_addEthereumChain',
                                params: [{
                                    chainId: sepoliaChainId,
                                    chainName: 'Sepolia Test Network',
                                    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                                    rpcUrls: ['https://sepolia.infura.io/v3/'],
                                    blockExplorerUrls: ['https://sepolia.etherscan.io/']
                                }],
                            });
                            console.log('➕ Added Sepolia network');
                        } catch (addError) {
                            console.error('Failed to add Sepolia:', addError);
                        }
                    }
                }
            }
            
            // Get balance
            let balance = '0.0';
            try {
                const balanceWei = await window.ethereum.request({
                    method: 'eth_getBalance',
                    params: [account, 'latest']
                });
                
                // Convert wei to ETH (simple conversion)
                const balanceNum = parseInt(balanceWei, 16) / Math.pow(10, 18);
                balance = balanceNum.toFixed(4);
            } catch (balanceError) {
                console.error('Failed to get balance:', balanceError);
            }
            
            // Update global state
            if (typeof WalletState !== 'undefined') {
                WalletState.connected = true;
                WalletState.account = account;
                WalletState.balance = balance;
                WalletState.chainId = chainId;
            }
            
            // Set up ethers.js provider and signer for contract interactions
            if (typeof ethers !== 'undefined') {
                try {
                    console.log('🔧 Setting up provider and signer in simple wallet...');
                    window.provider = new ethers.providers.Web3Provider(window.ethereum);
                    window.signer = window.provider.getSigner();
                    
                    // Also set global variables (without window prefix) for script.js compatibility
                    if (typeof provider !== 'undefined') window.provider = window.provider;
                    if (typeof signer !== 'undefined') window.signer = window.signer;
                    
                    // Test signer and set global variables
                    window.signer.getAddress().then(addr => {
                        console.log('✅ Simple wallet signer ready:', addr);
                        
                        // Set global variables after signer is confirmed working
                        provider = window.provider;
                        signer = window.signer;
                        
                        console.log('📋 Global signer set:', !!signer);
                        console.log('📋 Global provider set:', !!provider);
                        
                        // Initialize contract if available
                        if (typeof initializeContractAsync === 'function') {
                            initializeContractAsync();
                        }
                    }).catch(signerError => {
                        console.error('❌ Signer address test failed:', signerError);
                    });
                } catch (error) {
                    console.error('❌ Simple wallet signer setup failed:', error);
                }
            }
            
            // Update UI
            const connectBtn = document.getElementById('connectWallet');
            const walletInfo = document.getElementById('walletInfo');
            
            if (connectBtn && walletInfo) {
                connectBtn.style.display = 'none';
                walletInfo.style.display = 'block';
                
                const addressEl = walletInfo.querySelector('.wallet-address');
                const balanceEl = walletInfo.querySelector('.wallet-balance');
                
                if (addressEl) {
                    addressEl.textContent = account.substring(0, 6) + '...' + account.substring(38);
                }
                if (balanceEl) {
                    balanceEl.textContent = balance + ' ETH';
                }
            }
            
            showMessage('Connected to Sepolia! ✅', 'success');
        }
    } catch (error) {
        console.error('Simple wallet connection failed:', error);
        showMessage('Wallet connection failed: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
};

// Override the original connectWallet function
window.connectWallet = window.connectWalletSimple;

console.log('✅ Simple wallet connection ready');