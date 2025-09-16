// Anonymous Bonus Distribution - Team Incentive Privacy System JavaScript

// Global variables
let provider;
let signer;
let contract;
let charts = {};

// Wallet connection state
const WalletState = {
    connected: false,
    account: null,
    balance: '0',
    networkId: null,
    chainId: null
};

// Sepolia testnet configuration
const SEPOLIA_CONFIG = {
    chainId: '0xaa36a7', // 11155111 in decimal
    chainName: 'Sepolia Test Network',
    nativeCurrency: {
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18,
    },
    rpcUrls: ['https://sepolia.infura.io/v3/YOUR_INFURA_KEY'],
    blockExplorerUrls: ['https://sepolia.etherscan.io/'],
};

// Mock data
const mockData = {
    totalPool: '156.8 ETH',
    activeMembers: 24,
    distributed: '89.2 ETH',
    distributions: [
        {
            id: '1',
            name: 'Q3 Performance Bonus',
            amount: '12.5 ETH',
            recipients: 8,
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            status: 'completed',
            privacy: 'high'
        },
        {
            id: '2',
            name: 'Project Milestone Reward',
            amount: '8.2 ETH',
            recipients: 5,
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
            status: 'completed',
            privacy: 'maximum'
        },
        {
            id: '3',
            name: 'Team Collaboration Bonus',
            amount: '15.0 ETH',
            recipients: 12,
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
            status: 'completed',
            privacy: 'high'
        },
        {
            id: '4',
            name: 'Innovation Contribution',
            amount: '6.8 ETH',
            recipients: 3,
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            status: 'pending',
            privacy: 'standard'
        }
    ]
};

// Page initialization - moved to bottom of file to avoid duplicate listeners

// Initialize application
function initializeApp() {
    console.log('🚀 Anonymous Bonus Distribution System Starting');
    
    // Check if ethers is available
    if (typeof ethers === 'undefined') {
        console.log('⚠️  Ethers.js not loaded, using basic Web3 functionality');
        showMessage('Loading wallet libraries...', 'info');
        // Use basic web3 functionality without external library
        return;
    }
    
    // Check Ethereum provider support
    if (typeof window.ethereum !== 'undefined') {
        console.log('✅ Ethereum wallet detected');
        try {
            provider = new ethers.providers.Web3Provider(window.ethereum);
        } catch (error) {
            console.error('Failed to create ethers provider:', error);
            showMessage('Failed to initialize wallet provider', 'error');
            return;
        }
    } else {
        console.log('⚠️  No Ethereum wallet detected');
        showMessage('Please install MetaMask or other Web3 wallet', 'warning');
    }
    
    // Initialize charts
    initializeCharts();
    
    // Listen for account changes
    setupWalletListeners();
}

// Setup event listeners
function setupEventListeners() {
    // Navigation menu - handled by inline onclick events now
    
    // Distribution form
    const distributionForm = document.getElementById('distributionForm');
    if (distributionForm) {
        distributionForm.addEventListener('submit', handleDistributionSubmit);
    }
    
    // Settings form
    setupSettingsEventListeners();
}

// Navigation function for menu items
function navigateToPage(pageName) {
    event.preventDefault();
    
    // Update navigation state
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    event.target.closest('.nav-link').classList.add('active');
    
    // Switch pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageName + '-page').classList.add('active');
    
    // Load specific data based on page
    switch(pageName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'distribute':
            loadDistributeData();
            break;
        case 'analytics':
            loadAnalyticsData();
            break;
        case 'settings':
            loadSettingsData();
            break;
    }
}

// Connect wallet
async function connectWallet() {
    if (!window.ethereum) {
        showMessage('Please install MetaMask wallet', 'error');
        return;
    }
    
    try {
        showLoading('Connecting wallet...');
        
        // 1. Detect: Check window.ethereum (MetaMask provider)
        console.log('✅ MetaMask provider detected');
        
        // 2. Request Access: Use eth_requestAccounts to get user permission
        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });
        
        if (accounts.length > 0) {
            WalletState.account = accounts[0];
            console.log('Connected account:', WalletState.account);
            
            // 3. Network Verification: Verify connection to Sepolia testnet (0xaa36a7)
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            console.log('Current chain ID:', chainId);
            
            // 4. Network Switching: Auto-switch/add Sepolia if needed
            if (chainId !== SEPOLIA_CONFIG.chainId) {
                await switchToSepolia();
            }
            
            // 5. Provider Setup: Create ethers.js BrowserProvider and signer (if available)
            if (typeof ethers !== 'undefined') {
                try {
                    console.log('🔧 Setting up ethers.js provider and signer...');
                    provider = new ethers.providers.Web3Provider(window.ethereum);
                    signer = provider.getSigner();
                    
                    // Ensure signer is properly initialized
                    const signerAddress = await signer.getAddress();
                    console.log('✅ Signer initialized:', signerAddress);
                    
                    // Get balance using ethers
                    const balance = await provider.getBalance(accounts[0]);
                    WalletState.balance = ethers.utils.formatEther(balance);
                    
                    // Get network info
                    const network = await provider.getNetwork();
                    WalletState.networkId = network.chainId;
                    
                    console.log('✅ Ethers.js setup complete');
                } catch (ethersError) {
                    console.error('Ethers setup failed, using basic Web3:', ethersError);
                    signer = null; // Reset signer on failure
                    await setupBasicWeb3();
                }
            } else {
                console.log('⚠️ ethers.js not available, using basic Web3');
                // Fallback to basic Web3 functionality
                await setupBasicWeb3();
            }
            
            WalletState.chainId = chainId;
            WalletState.connected = true;
            
            // 6. Contract Initialization: Create contract instance (if contract address available)
            await initializeContractAsync();
            
            // 7. State Update: Update UI with account and contract
            updateWalletUI();
            
            // Success Handling: Display success message "Connected to Sepolia! ✅"
            showMessage('Connected to Sepolia! ✅', 'success');
        }
    } catch (error) {
        console.error('Wallet connection failed:', error);
        showMessage('Wallet connection failed: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Basic Web3 setup without external libraries
async function setupBasicWeb3() {
    try {
        // Get balance using basic Web3 RPC calls
        const balanceWei = await window.ethereum.request({
            method: 'eth_getBalance',
            params: [WalletState.account, 'latest']
        });
        
        // Convert Wei to ETH manually (1 ETH = 10^18 Wei)
        const balanceETH = parseInt(balanceWei, 16) / Math.pow(10, 18);
        WalletState.balance = balanceETH.toString();
        
        // Get network ID
        const networkId = await window.ethereum.request({
            method: 'net_version'
        });
        WalletState.networkId = parseInt(networkId);
        
        console.log('Basic Web3 setup completed');
    } catch (error) {
        console.error('Basic Web3 setup failed:', error);
        WalletState.balance = '0.0';
        WalletState.networkId = 1;
    }
}

// Switch to Sepolia network
async function switchToSepolia() {
    try {
        // Try to switch to Sepolia
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: SEPOLIA_CONFIG.chainId }],
        });
        console.log('Switched to Sepolia network');
    } catch (switchError) {
        // If Sepolia is not added to wallet, add it
        if (switchError.code === 4902) {
            try {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [SEPOLIA_CONFIG],
                });
                console.log('Added Sepolia network');
            } catch (addError) {
                console.error('Failed to add Sepolia network:', addError);
                throw addError;
            }
        } else {
            console.error('Failed to switch to Sepolia network:', switchError);
            throw switchError;
        }
    }
}

// Setup wallet event listeners
function setupWalletListeners() {
    if (!window.ethereum) return;
    
    // Listen for account changes
    window.ethereum.on('accountsChanged', function(accounts) {
        if (accounts.length === 0) {
            WalletState.connected = false;
            WalletState.account = null;
            updateWalletUI();
            showMessage('Wallet disconnected', 'warning');
        } else {
            WalletState.account = accounts[0];
            updateWalletUI();
            showMessage('Wallet address changed', 'info');
        }
    });
    
    // Listen for chain changes
    window.ethereum.on('chainChanged', function(chainId) {
        WalletState.chainId = chainId;
        WalletState.networkId = parseInt(chainId, 16);
        
        if (chainId === SEPOLIA_CONFIG.chainId) {
            showMessage('Connected to Sepolia network', 'success');
        } else {
            showMessage('Please switch to Sepolia network', 'warning');
        }
    });
}

// Update wallet UI
function updateWalletUI() {
    const connectBtn = document.getElementById('connectWallet');
    const walletInfo = document.getElementById('walletInfo');
    
    if (WalletState.connected) {
        connectBtn.style.display = 'none';
        walletInfo.style.display = 'block';
        
        walletInfo.querySelector('.wallet-address').textContent = 
            WalletState.account.substring(0, 6) + '...' + WalletState.account.substring(38);
        walletInfo.querySelector('.wallet-balance').textContent = 
            parseFloat(WalletState.balance).toFixed(4) + ' ETH';
    } else {
        connectBtn.style.display = 'flex';
        walletInfo.style.display = 'none';
    }
}

// Load initial data
function loadInitialData() {
    loadDashboardData();
}

// Load dashboard data
function loadDashboardData() {
    // Update stats cards
    document.getElementById('totalPool').textContent = mockData.totalPool;
    document.getElementById('activeMembers').textContent = mockData.activeMembers;
    document.getElementById('distributed').textContent = mockData.distributed;
    
    // Update distribution records
    updateDistributionList();
}

// Update distribution list
function updateDistributionList() {
    const distributionList = document.getElementById('distributionList');
    if (!distributionList) return;
    
    distributionList.innerHTML = mockData.distributions.map(dist => `
        <div class="distribution-item" data-id="${dist.id}">
            <div class="distribution-info">
                <h4>${dist.name}</h4>
                <div class="distribution-meta">
                    ${formatDate(dist.timestamp)} • ${dist.recipients} recipients • ${getPrivacyBadge(dist.privacy)}
                </div>
            </div>
            <div class="distribution-amount">${dist.amount}</div>
        </div>
    `).join('');
}

// Format date
function formatDate(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) {
        return 'Just now';
    } else if (diffHours < 24) {
        return diffHours + ' hours ago';
    } else {
        const diffDays = Math.floor(diffHours / 24);
        return diffDays + ' days ago';
    }
}

// Get privacy level badge
function getPrivacyBadge(level) {
    const badges = {
        'basic': '<span style="color: #f59e0b;">Basic Protection</span>',
        'standard': '<span style="color: #06b6d4;">Standard Protection</span>',
        'high': '<span style="color: #10b981;">High Protection</span>',
        'maximum': '<span style="color: #8b5cf6;">Maximum Protection</span>'
    };
    return badges[level] || badges.standard;
}

// Refresh distributions
function refreshDistributions() {
    showLoading('Refreshing data...');
    
    // Simulate API call
    setTimeout(() => {
        updateDistributionList();
        hideLoading();
        showMessage('Data updated', 'success');
    }, 1000);
}

// Update recipient inputs
function updateRecipientInputs() {
    const count = parseInt(document.getElementById('recipientCount').value) || 0;
    const container = document.getElementById('recipientInputs');
    
    container.innerHTML = '';
    
    for (let i = 0; i < count; i++) {
        const div = document.createElement('div');
        div.className = 'recipient-input';
        div.innerHTML = `
            <input type="text" placeholder="Recipient Address ${i + 1}" required>
            <input type="number" step="0.01" placeholder="Weight" value="1">
            <button type="button" class="remove-recipient" onclick="removeRecipient(this)">
                <i class="fas fa-times"></i>
            </button>
        `;
        container.appendChild(div);
    }
    
    // Add "Add recipient" button
    if (count > 0) {
        const addBtn = document.createElement('button');
        addBtn.type = 'button';
        addBtn.className = 'add-recipient';
        addBtn.innerHTML = '<i class="fas fa-plus"></i> Add Recipient';
        addBtn.onclick = addRecipient;
        container.appendChild(addBtn);
    }
}

// Add recipient
function addRecipient() {
    const countInput = document.getElementById('recipientCount');
    countInput.value = (parseInt(countInput.value) || 0) + 1;
    updateRecipientInputs();
}

// Remove recipient
function removeRecipient(button) {
    const countInput = document.getElementById('recipientCount');
    const currentCount = parseInt(countInput.value) || 0;
    if (currentCount > 1) {
        countInput.value = currentCount - 1;
        updateRecipientInputs();
    }
}

// Update distribution method
function updateDistributionMethod() {
    const method = document.getElementById('distributionMethod').value;
    const recipientInputs = document.querySelectorAll('.recipient-input input[type="number"]');
    
    recipientInputs.forEach((input, index) => {
        switch(method) {
            case 'equal':
                input.value = '1';
                input.disabled = true;
                break;
            case 'weighted':
            case 'performance':
            case 'custom':
                input.disabled = false;
                break;
            default:
                input.disabled = false;
        }
    });
}

// Preview distribution
function previewDistribution() {
    const form = document.getElementById('distributionForm');
    const formData = new FormData(form);
    
    const name = formData.get('distributionName');
    const totalAmount = parseFloat(formData.get('totalAmount')) || 0;
    const recipientCount = parseInt(formData.get('recipientCount')) || 0;
    const method = formData.get('distributionMethod');
    
    if (!name || !totalAmount || !recipientCount || !method) {
        showMessage('Please fill in complete distribution information', 'warning');
        return;
    }
    
    // Get recipient information
    const recipients = [];
    const recipientInputs = document.querySelectorAll('.recipient-input');
    let totalWeight = 0;
    
    recipientInputs.forEach((input, index) => {
        const address = input.querySelector('input[type="text"]')?.value;
        const weight = parseFloat(input.querySelector('input[type="number"]')?.value) || 1;
        
        if (address) {
            recipients.push({ address, weight });
            totalWeight += weight;
        }
    });
    
    // Calculate allocation per person
    const previewContent = document.getElementById('previewContent');
    let previewHtml = `
        <div class="preview-summary">
            <h4>Distribution Summary</h4>
            <p><strong>Plan Name:</strong> ${name}</p>
            <p><strong>Total Amount:</strong> ${totalAmount} ETH</p>
            <p><strong>Recipients:</strong> ${recipients.length}</p>
            <p><strong>Method:</strong> ${getMethodName(method)}</p>
        </div>
        <div class="preview-recipients">
            <h4>Distribution Details</h4>
    `;
    
    recipients.forEach((recipient, index) => {
        const allocation = method === 'equal' ? 
            (totalAmount / recipients.length) : 
            (totalAmount * recipient.weight / totalWeight);
            
        previewHtml += `
            <div class="preview-recipient">
                <span>Recipient ${index + 1}: ${recipient.address.substring(0, 10)}...</span>
                <span><strong>${allocation.toFixed(4)} ETH</strong></span>
            </div>
        `;
    });
    
    previewHtml += '</div>';
    previewContent.innerHTML = previewHtml;
}

// Get distribution method name
function getMethodName(method) {
    const names = {
        'equal': 'Equal Distribution',
        'weighted': 'Weighted Distribution',
        'performance': 'Performance-based',
        'custom': 'Custom Distribution'
    };
    return names[method] || method;
}

// Handle distribution submit - Real MetaMask Transaction Implementation
async function handleDistributionSubmit(e) {
    e.preventDefault();
    
    console.log('🚀 Form submission started...');
    
    if (!WalletState.connected) {
        showMessage('Please connect wallet first', 'warning');
        return;
    }
    
    if (!contract) {
        showMessage('Contract not initialized. Attempting to reinitialize...', 'warning');
        await initializeContractAsync();
        
        if (!contract) {
            showMessage('Contract initialization failed. Please refresh and reconnect wallet.', 'error');
            return;
        }
        
        showMessage('Contract reinitialized successfully!', 'success');
    }
    
    try {
        // 1. Extract and validate form data
        const formData = extractFormData();
        if (!formData) return;
        
        // 2. Show loading state
        showTransactionStatus('preparing', 'Preparing transaction...');
        
        // 3. Execute real contract transaction (triggers MetaMask popup)
        console.log('🚀 Starting real blockchain transaction...');
        const txResult = await executeDistributionTransaction(formData);
        
        // 4. Show transaction sent status
        showTransactionStatus('pending', `Transaction sent! Hash: ${txResult.hash.substring(0, 10)}...`);
        showMessage(`Transaction submitted: ${txResult.hash}`, 'info');
        
        // 5. Add blockchain explorer link for user tracking
        console.log(`🔍 Track on Sepolia Explorer: https://sepolia.etherscan.io/tx/${txResult.hash}`);
        
        // 6. Wait for blockchain confirmation (tx.wait() mining confirmation)
        showTransactionStatus('pending', 'Waiting for blockchain confirmation...');
        const receipt = await waitForTransactionConfirmation(txResult.transaction);
        
        // 6. Success handling
        showTransactionStatus('confirmed', 'Transaction confirmed on blockchain!');
        showMessage('✅ Bonus distribution executed successfully on Sepolia!', 'success');
        
        // 7. Update UI state
        updateUIAfterSuccess(receipt);
        
    } catch (error) {
        // 8. Comprehensive error handling with specific messages and recovery suggestions
        console.error('❌ Distribution transaction failed:', error);
        
        let errorMessage = 'Transaction failed: ' + error.message;
        let statusMessage = 'Transaction failed';
        
        if (error.message.includes('rejected by user') || error.message.includes('cancelled')) {
            errorMessage = 'Transaction was cancelled by user';
            statusMessage = 'Transaction cancelled by user';
            showTransactionStatus('cancelled', statusMessage);
        } else if (error.message.includes('insufficient funds')) {
            errorMessage = 'Insufficient funds for transaction + gas fees. Please add ETH to your wallet.';
            statusMessage = 'Insufficient funds';
            showTransactionStatus('failed', statusMessage);
        } else if (error.message.includes('timeout')) {
            errorMessage = 'Transaction confirmation timed out. It may still be processing on Sepolia.';
            statusMessage = 'Confirmation timeout';
            showTransactionStatus('failed', statusMessage);
        } else if (error.message.includes('reverted')) {
            errorMessage = 'Transaction failed on blockchain. Check contract conditions and try again.';
            statusMessage = 'Contract execution failed';
            showTransactionStatus('failed', statusMessage);
        } else if (error.message.includes('network') || error.message.includes('RPC')) {
            errorMessage = 'Network connection error. Check Sepolia RPC and try again.';
            statusMessage = 'Network connection failed';
            showTransactionStatus('failed', statusMessage);
        } else if (error.message.includes('gas')) {
            errorMessage = 'Gas estimation failed. Transaction may be complex or network congested.';
            statusMessage = 'Gas estimation failed';
            showTransactionStatus('failed', statusMessage);
        } else {
            showTransactionStatus('failed', 'Transaction failed');
        }
        
        showMessage(errorMessage, 'error');
        
        // Log detailed error for debugging
        console.error('📋 Error details:', {
            message: error.message,
            code: error.code,
            reason: error.reason,
            transaction: error.transaction
        });
    }
}

// Extract form data for contract transaction
function extractFormData() {
    // Get form data directly from input elements since they use id instead of name
    const nameInput = document.getElementById('distributionName');
    const totalAmountInput = document.getElementById('totalAmount');
    const recipientCountInput = document.getElementById('recipientCount');
    
    const name = nameInput?.value?.trim();
    const totalAmount = parseFloat(totalAmountInput?.value) || 0;
    const recipientCount = parseInt(recipientCountInput?.value) || 0;
    
    console.log('📋 Form data extracted:', {
        name,
        totalAmount,
        recipientCount,
        nameValue: nameInput?.value,
        totalAmountValue: totalAmountInput?.value,
        recipientCountValue: recipientCountInput?.value
    });
    
    if (!name || !totalAmount || !recipientCount) {
        console.log('❌ Missing required fields:', {
            hasName: !!name,
            hasTotalAmount: !!totalAmount,
            hasRecipientCount: !!recipientCount
        });
        showMessage('Please fill in all required fields', 'warning');
        return null;
    }
    
    // Get recipient addresses and amounts
    const recipients = [];
    const amounts = [];
    const recipientInputs = document.querySelectorAll('.recipient-input');
    
    console.log('📋 Found recipient inputs:', recipientInputs.length);
    
    recipientInputs.forEach((input, index) => {
        const addressInput = input.querySelector('input[type="text"]');
        const weightInput = input.querySelector('input[type="number"]');
        const address = addressInput?.value?.trim();
        const weight = parseFloat(weightInput?.value) || 1;
        
        console.log(`📋 Recipient ${index + 1}:`, {
            address,
            weight,
            isValidAddress: address ? ethers.utils.isAddress(address) : false
        });
        
        if (address && ethers.utils.isAddress(address)) {
            recipients.push(address);
            amounts.push(totalAmount * (weight / recipientInputs.length)); // Simple equal distribution for now
        }
    });
    
    console.log('📋 Valid recipients found:', recipients.length);
    console.log('📋 Expected recipients:', recipientCount);
    
    if (recipients.length === 0) {
        showMessage('Please provide valid recipient addresses', 'warning');
        return null;
    }
    
    // Check if we have enough recipients (allow partial filling)
    if (recipients.length < recipientCount) {
        showMessage(`Found ${recipients.length} valid recipients, but ${recipientCount} expected. Please check addresses.`, 'warning');
        return null;
    }
    
    return {
        name,
        recipients,
        amounts,
        totalAmountETH: totalAmount
    };
}

// Show transaction status with visual feedback
function showTransactionStatus(status, message) {
    const statusElement = document.getElementById('transactionStatus') || createTransactionStatusElement();
    
    statusElement.className = `transaction-status ${status}`;
    statusElement.innerHTML = `
        <div class="status-icon">
            ${getStatusIcon(status)}
        </div>
        <div class="status-message">${message}</div>
    `;
    
    // Auto-hide after success/error
    if (status === 'confirmed' || status === 'failed' || status === 'cancelled') {
        setTimeout(() => {
            statusElement.style.display = 'none';
        }, 5000);
    }
}

// Create transaction status element if not exists
function createTransactionStatusElement() {
    let statusElement = document.getElementById('transactionStatus');
    if (!statusElement) {
        statusElement = document.createElement('div');
        statusElement.id = 'transactionStatus';
        statusElement.className = 'transaction-status';
        document.querySelector('.main-content').appendChild(statusElement);
        
        // Add CSS for transaction status
        const style = document.createElement('style');
        style.textContent = `
            .transaction-status {
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: white;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                z-index: 1001;
                display: flex;
                align-items: center;
                gap: 15px;
                min-width: 300px;
                border-left: 4px solid;
            }
            .transaction-status.preparing { border-left-color: #06b6d4; }
            .transaction-status.pending { border-left-color: #f59e0b; }
            .transaction-status.confirmed { border-left-color: #10b981; }
            .transaction-status.failed { border-left-color: #ef4444; }
            .transaction-status.cancelled { border-left-color: #6b7280; }
            .status-icon { font-size: 24px; }
            .status-message { font-weight: 600; }
        `;
        document.head.appendChild(style);
    }
    return statusElement;
}

// Get status icon for transaction states
function getStatusIcon(status) {
    const icons = {
        'preparing': '🔄',
        'pending': '⏳',
        'confirmed': '✅',
        'failed': '❌',
        'cancelled': '🚫'
    };
    return icons[status] || '📝';
}

// Update UI after successful transaction
function updateUIAfterSuccess(receipt) {
    // Reset form
    document.getElementById('distributionForm').reset();
    document.getElementById('previewContent').innerHTML = `
        <div class="preview-empty">
            <i class="fas fa-chart-pie"></i>
            <p>Fill out the form on the left to preview distribution plan</p>
        </div>
    `;
    
    // Add transaction to history (mock)
    const newDistribution = {
        id: Date.now().toString(),
        name: 'Recent Distribution',
        amount: '0.0 ETH',
        recipients: receipt.events?.length || 1,
        timestamp: new Date(),
        status: 'completed',
        privacy: 'high',
        txHash: receipt.transactionHash
    };
    
    mockData.distributions.unshift(newDistribution);
    updateDistributionList();
    
    // Clear transaction status
    setTimeout(() => {
        const statusElement = document.getElementById('transactionStatus');
        if (statusElement) statusElement.style.display = 'none';
    }, 3000);
}

// Real contract interaction - triggers MetaMask popup
async function executeDistributionTransaction(distributionData) {
    if (!contract || !signer) {
        throw new Error('Contract not initialized. Please connect wallet first.');
    }

    try {
        console.log('🚀 Preparing real blockchain transaction...');
        
        // Extract form data
        const { name, recipients, amounts, totalAmountETH } = distributionData;
        
        // Convert ETH amounts to Wei (required for contract)
        const amountsInWei = amounts.map(amount => ethers.utils.parseEther(amount.toString()));
        const totalAmountWei = ethers.utils.parseEther(totalAmountETH.toString());
        
        console.log('Transaction details:', {
            name,
            recipients,
            amountsInWei: amountsInWei.map(a => a.toString()),
            totalValue: totalAmountWei.toString()
        });

        // 1. Call contract method → ethers.js sends transaction → MetaMask popup confirmation
        console.log('📝 Calling createDistribution contract method...');
        const tx = await contract.createDistribution(
            name,
            recipients,
            amountsInWei,
            {
                value: totalAmountWei, // Send ETH with transaction
                gasLimit: 500000, // Set gas limit
            }
        );

        console.log('✅ Transaction sent to blockchain:', tx.hash);
        
        // 2. Return transaction hash for status tracking
        return {
            hash: tx.hash,
            transaction: tx
        };

    } catch (error) {
        console.error('❌ Contract transaction failed:', error);
        
        // Handle specific MetaMask errors
        if (error.code === 4001) {
            throw new Error('Transaction rejected by user');
        } else if (error.code === -32603) {
            throw new Error('Internal JSON-RPC error');
        } else if (error.message?.includes('insufficient funds')) {
            throw new Error('Insufficient funds for transaction');
        } else {
            throw new Error(error.message || 'Transaction failed');
        }
    }
}

// Wait for transaction confirmation on blockchain with enhanced error handling
async function waitForTransactionConfirmation(tx) {
    try {
        console.log('⏳ Waiting for blockchain confirmation...');
        console.log(`📋 Transaction hash: ${tx.hash}`);
        
        // Add timeout protection for slow networks
        const confirmationPromise = tx.wait();
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Transaction confirmation timeout (5 minutes)')), 300000)
        );
        
        // 3. tx.wait() waits for transaction to be mined with timeout protection
        const receipt = await Promise.race([confirmationPromise, timeoutPromise]);
        
        console.log('✅ Transaction confirmed on blockchain:', {
            hash: receipt.transactionHash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed?.toString(),
            status: receipt.status === 1 ? 'Success' : 'Failed'
        });
        
        // Verify transaction success
        if (receipt.status !== 1) {
            throw new Error('Transaction reverted on blockchain');
        }
        
        return receipt;
        
    } catch (error) {
        console.error('❌ Transaction confirmation failed:', error);
        
        // Enhanced error handling for different network issues
        if (error.message?.includes('timeout')) {
            throw new Error('Transaction confirmation timed out. Check Sepolia network status.');
        } else if (error.message?.includes('reverted')) {
            throw new Error('Transaction failed on blockchain. Check contract conditions.');
        } else if (error.code === 'NETWORK_ERROR') {
            throw new Error('Network connection error. Please check Sepolia RPC connection.');
        } else if (error.code === 'REPLACEMENT_UNDERPRICED') {
            throw new Error('Gas price too low. Transaction may be stuck.');
        }
        
        throw error;
    }
}

// Load distribute data
function loadDistributeData() {
    // Reset form
    const form = document.getElementById('distributionForm');
    if (form) {
        form.reset();
    }
    
    // Reset preview
    const previewContent = document.getElementById('previewContent');
    if (previewContent) {
        previewContent.innerHTML = `
            <div class="preview-empty">
                <i class="fas fa-chart-pie"></i>
                <p>Fill out the form on the left to preview distribution plan</p>
            </div>
        `;
    }
}

// Load analytics data
function loadAnalyticsData() {
    updateAnalytics();
}

// Update analytics
function updateAnalytics() {
    const timeRange = document.getElementById('timeRange')?.value || '30d';
    const dimension = document.getElementById('analyticsDimension')?.value || 'distribution';
    
    showLoading('Updating data...');
    
    setTimeout(() => {
        // Update trend chart
        updateTrendChart(timeRange);
        
        // Update method statistics chart
        updateMethodChart();
        
        hideLoading();
        showMessage('Data updated', 'success');
    }, 1500);
}

// Initialize charts
function initializeCharts() {
    // Performance chart
    const performanceCtx = document.getElementById('performanceChart');
    if (performanceCtx) {
        charts.performance = new Chart(performanceCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Distribution Amount (ETH)',
                    data: [12.5, 19.2, 15.8, 22.1, 18.3, 25.4],
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#e2e8f0'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
}

// Update trend chart
function updateTrendChart(timeRange) {
    const trendCtx = document.getElementById('trendChart');
    if (trendCtx && !charts.trend) {
        charts.trend = new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Distribution Amount',
                    data: [3.2, 5.1, 2.8, 4.3, 6.2, 1.9, 3.7],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }
}

// Update method chart
function updateMethodChart() {
    const methodCtx = document.getElementById('methodChart');
    if (methodCtx && !charts.method) {
        charts.method = new Chart(methodCtx, {
            type: 'doughnut',
            data: {
                labels: ['Equal Distribution', 'Weighted Distribution', 'Performance-based', 'Custom'],
                datasets: [{
                    data: [35, 25, 30, 10],
                    backgroundColor: [
                        '#6366f1',
                        '#8b5cf6',
                        '#10b981',
                        '#f59e0b'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
}

// Load settings data
function loadSettingsData() {
    // Load settings from local storage
    loadSettingsFromStorage();
}

// Setup settings event listeners
function setupSettingsEventListeners() {
    // Settings event listeners handled by inline onclick events
}

// Save settings
function saveSettings() {
    const settings = {
        defaultPrivacyLevel: document.getElementById('defaultPrivacyLevel')?.value,
        autoMixer: document.getElementById('autoMixer')?.checked,
        delayRange: document.getElementById('delayRange')?.value,
        gasPriceStrategy: document.getElementById('gasPriceStrategy')?.value,
        notifications: document.getElementById('notifications')?.checked,
        dataRetention: document.getElementById('dataRetention')?.value
    };
    
    localStorage.setItem('privacyIncentiveSettings', JSON.stringify(settings));
    showMessage('Settings saved', 'success');
}

// Load settings from storage
function loadSettingsFromStorage() {
    const settings = JSON.parse(localStorage.getItem('privacyIncentiveSettings') || '{}');
    
    Object.keys(settings).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = settings[key];
            } else {
                element.value = settings[key];
            }
        }
    });
}

// Reset settings
function resetSettings() {
    if (confirm('Are you sure you want to reset all settings to default?')) {
        localStorage.removeItem('privacyIncentiveSettings');
        loadSettingsData();
        showMessage('Settings reset to default values', 'info');
    }
}

// Show message
function showMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.innerHTML = `
        <i class="fas fa-${getMessageIcon(type)}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(messageDiv);
    
    // Add styling
    messageDiv.style.position = 'fixed';
    messageDiv.style.top = '20px';
    messageDiv.style.right = '20px';
    messageDiv.style.zIndex = '1000';
    messageDiv.style.maxWidth = '400px';
    messageDiv.style.animation = 'slideInRight 0.3s ease-out';
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        messageDiv.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 300);
    }, 3000);
}

// Get message icon
function getMessageIcon(type) {
    const icons = {
        'success': 'check-circle',
        'error': 'exclamation-circle',
        'warning': 'exclamation-triangle',
        'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// Show loading animation
function showLoading(message = 'Processing...') {
    const overlay = document.getElementById('loadingOverlay');
    const text = overlay.querySelector('p');
    text.textContent = message;
    overlay.style.display = 'flex';
}

// Hide loading animation
function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    overlay.style.display = 'none';
}

// Show modal
function showModal(title, content) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    modalTitle.textContent = title;
    modalBody.innerHTML = content;
    modal.style.display = 'block';
}

// Close modal
function closeModal() {
    const modal = document.getElementById('modal');
    modal.style.display = 'none';
}

// Window click to close modal
window.onclick = function(event) {
    const modal = document.getElementById('modal');
    if (event.target === modal) {
        closeModal();
    }
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Error handling
window.onerror = function(message, source, lineno, colno, error) {
    console.error('JavaScript error:', { message, source, lineno, colno, error });
    showMessage('System error occurred, please refresh page and try again', 'error');
};

// Sample Anonymous Bonus Distribution Contract ABI
const BONUS_CONTRACT_ABI = [
    "function createDistribution(string memory name, address[] memory recipients, uint256[] memory amounts) external payable",
    "function executeDistribution(uint256 distributionId) external",
    "function getDistribution(uint256 distributionId) external view returns (string memory, address[], uint256[], bool)",
    "function getDistributionCount() external view returns (uint256)",
    "function owner() external view returns (address)",
    "event DistributionCreated(uint256 indexed distributionId, string name, uint256 totalAmount)",
    "event DistributionExecuted(uint256 indexed distributionId)",
];

// Sample contract address (replace with actual deployed contract)
const BONUS_CONTRACT_ADDRESS = "0xeC6881Fd6E8818Ec543579B95445eBC7050aF677"; // AnonymousBonusDistribution.sol deployed address

// Initialize contract with real MetaMask transaction capability (async version)
async function initializeContractAsync() {
    try {
        console.log('🔧 Initializing contract asynchronously...');
        console.log('📋 Contract address:', BONUS_CONTRACT_ADDRESS);
        console.log('📋 ethers available:', typeof ethers !== 'undefined');
        console.log('📋 signer available:', !!signer);
        
        if (typeof ethers !== 'undefined' && signer) {
            // Ensure signer is ready
            await signer.getAddress();
            
            // Create contract instance with signer for transaction capability
            contract = new ethers.Contract(BONUS_CONTRACT_ADDRESS, BONUS_CONTRACT_ABI, signer);
            console.log('✅ Contract initialized with transaction capability');
            console.log('📋 Contract instance:', !!contract);
            console.log('📋 Contract address:', contract.address);
            
            // Test contract connection
            try {
                const signerAddress = await contract.signer.getAddress();
                console.log('📋 Contract signer address:', signerAddress);
            } catch (signerTest) {
                console.warn('⚠️ Contract signer test failed:', signerTest);
            }
        } else {
            console.log('⚠️ Contract initialization skipped - ethers.js or signer not available');
            if (typeof ethers === 'undefined') {
                console.log('❌ ethers.js library not loaded');
            }
            if (!signer) {
                console.log('❌ Signer not available - wallet not connected?');
            }
        }
    } catch (error) {
        console.error('❌ Contract initialization failed:', error);
        contract = null;
    }
}

// Legacy synchronous version for compatibility
function initializeContract() {
    console.log('🔄 Using legacy contract initialization, prefer async version');
    initializeContractAsync();
}

// Debug function to check contract status
function checkContractStatus() {
    console.log('🔍 Contract Status Debug:');
    console.log('- Contract Address:', BONUS_CONTRACT_ADDRESS);
    console.log('- Contract Instance:', !!contract);
    console.log('- Ethers Library:', typeof ethers !== 'undefined');
    console.log('- Provider (global):', !!provider);
    console.log('- Signer (global):', !!signer);
    console.log('- Provider (window):', !!window.provider);
    console.log('- Signer (window):', !!window.signer);
    console.log('- Wallet Connected:', WalletState.connected);
    console.log('- WalletState:', WalletState);
    
    if (contract) {
        console.log('- Contract Address from instance:', contract.address);
        console.log('- Contract has signer:', !!contract.signer);
    }
    
    // Try to manually initialize contract if signer exists
    if (!contract && (signer || window.signer)) {
        console.log('🔄 Attempting manual contract initialization...');
        const activeSigner = signer || window.signer;
        try {
            contract = new ethers.Contract(BONUS_CONTRACT_ADDRESS, BONUS_CONTRACT_ABI, activeSigner);
            console.log('✅ Manual contract initialization successful');
        } catch (error) {
            console.error('❌ Manual contract initialization failed:', error);
        }
    }
}

// Debug form status
function checkFormStatus() {
    console.log('📋 Form Status Debug:');
    
    // Check main form fields by ID
    const nameInput = document.getElementById('distributionName');
    const totalAmountInput = document.getElementById('totalAmount');
    const recipientCountInput = document.getElementById('recipientCount');
    
    console.log('- Main Form Fields:');
    console.log(`  distributionName: "${nameInput?.value}"`);
    console.log(`  totalAmount: "${totalAmountInput?.value}"`);
    console.log(`  recipientCount: "${recipientCountInput?.value}"`);
    
    const recipientInputs = document.querySelectorAll('.recipient-input');
    console.log('- Recipient Inputs:', recipientInputs.length);
    
    recipientInputs.forEach((input, index) => {
        const address = input.querySelector('input[type="text"]')?.value;
        const weight = input.querySelector('input[type="number"]')?.value;
        console.log(`  Recipient ${index + 1}: address="${address}", weight="${weight}"`);
    });
    
    // Test extraction function
    console.log('- Testing extractFormData():');
    const extracted = extractFormData();
    console.log('  Result:', extracted);
}

// Make debug functions available globally
window.checkContractStatus = checkContractStatus;
window.checkFormStatus = checkFormStatus;

// Check if wallet was previously connected
async function checkPreviousConnection() {
    if (window.ethereum && window.ethereum.selectedAddress) {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                // Auto-connect if previously connected
                await connectWallet();
            }
        } catch (error) {
            console.log('No previous connection found');
        }
    }
}

// Add this to initialization
document.addEventListener('DOMContentLoaded', function() {
    // Give time for external libraries to load
    setTimeout(() => {
        initializeApp();
        setupEventListeners();
        loadInitialData();
        
        // Check for previous wallet connection
        setTimeout(checkPreviousConnection, 1000);
    }, 500);
});

console.log('✅ Anonymous Bonus Distribution System initialized');