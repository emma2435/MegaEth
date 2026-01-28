// ===================================
// STATE MANAGEMENT
// ===================================

const state = {
    walletConnected: false,
    userAddress: null,
    userName: '',
    selectedMultiplier: 10,
    predictions: [],
    leaderboardFilter: 'highest' // 'highest' or 'recent'
};

// ===================================
// WEB3MODAL & WALLETCONNECT SETUP
// ===================================

// Web3Modal instance (global)
let web3Modal = null;
let provider = null;
let web3Provider = null;

/**
 * Initialize Web3Modal with WalletConnect support
 * This enables connection to ALL wallets (MetaMask, Trust, Coinbase, mobile wallets, etc.)
 */
function initWeb3Modal() {
    // Check if Web3Modal library is loaded
    if (typeof window.Web3Modal === 'undefined') {
        console.error('❌ Web3Modal library not loaded! Make sure script tags are added to HTML.');
        return false;
    }
    
    if (typeof window.WalletConnectProvider === 'undefined') {
        console.error('❌ WalletConnect library not loaded! Make sure script tags are added to HTML.');
        return false;
    }
    
    const providerOptions = {
        walletconnect: {
            package: window.WalletConnectProvider.default,
            options: {
                // IMPORTANT: Get your free project ID from https://cloud.walletconnect.com
                projectId: "YOUR_WALLETCONNECT_PROJECT_ID", // REPLACE THIS WITH YOUR PROJECT ID!
                rpc: {
                    1: "https://eth.llamarpc.com", // Ethereum mainnet
                    137: "https://polygon-rpc.com", // Polygon
                    56: "https://bsc-dataseed.binance.org", // BSC
                    42161: "https://arb1.arbitrum.io/rpc", // Arbitrum
                    10: "https://mainnet.optimism.io", // Optimism
                    // Add more networks as needed
                },
                chainId: 1, // Default to Ethereum mainnet
            }
        }
    };

    web3Modal = new window.Web3Modal.default({
        cacheProvider: true, // Remember the wallet user connected with
        providerOptions,
        disableInjectedProvider: false, // Keep MetaMask support
        theme: {
            background: "rgb(26, 11, 46)",
            main: "rgb(199, 125, 255)",
            secondary: "rgb(136, 136, 136)",
            border: "rgba(195, 195, 195, 0.14)",
            hover: "rgb(42, 24, 66)"
        }
    });
    
    console.log('✅ Web3Modal initialized successfully');
    return true;
}

// ===================================
// UNIVERSAL WALLET CONNECT
// ===================================

/**
 * Connect to any wallet (MetaMask, Trust Wallet, Coinbase, WalletConnect, etc.)
 * Works on desktop, mobile, and in-app browsers (Twitter/X, Discord, etc.)
 */
async function connectWalletUniversal() {
    try {
        console.log('🔌 Initiating wallet connection...');

        // Initialize Web3Modal if not already done
        if (!web3Modal) {
            console.log('⚙️ Initializing Web3Modal...');
            const initialized = initWeb3Modal();
            if (!initialized) {
                alert('Error: Web3Modal libraries not loaded. Please refresh the page.');
                return null;
            }
        }

        // Open wallet selection modal (user can choose any wallet)
        console.log('🪟 Opening wallet selection modal...');
        provider = await web3Modal.connect();
        console.log('✅ Provider connected:', provider);

        // Create ethers.js provider from the connected wallet
        web3Provider = new ethers.providers.Web3Provider(provider);
        
        // Get the user's account address
        const signer = web3Provider.getSigner();
        const account = await signer.getAddress();
        
        console.log('✅ Wallet address:', account);

        // Update application state
        state.walletConnected = true;
        state.userAddress = account;

        // Update the UI to show connected wallet
        updateWalletUI(account);
        
        console.log('✅ Wallet fully connected!');
        showNotification('Wallet Connected! 🎉', 'success');

        // Subscribe to wallet events
        subscribeToWalletEvents();

        return account;

    } catch (error) {
        console.error('❌ Error connecting wallet:', error);
        
        // Handle user rejection
        if (error.message && error.message.includes('User closed modal')) {
            showNotification('Connection cancelled', 'error');
        } else if (error.message && error.message.includes('User Rejected')) {
            showNotification('Connection rejected', 'error');
        } else {
            showNotification('Failed to connect wallet. Check console for details.', 'error');
            console.error('Full error:', error);
        }
        
        return null;
    }
}

/**
 * Subscribe to important wallet events
 * Handles account changes, network changes, and disconnection
 */
function subscribeToWalletEvents() {
    if (!provider) return;

    // When user switches accounts
    provider.on("accountsChanged", (accounts) => {
        console.log('👤 Accounts changed:', accounts);
        if (!accounts || accounts.length === 0) {
            handleDisconnect();
        } else {
            state.userAddress = accounts[0];
            updateWalletUI(accounts[0]);
            showNotification('Account changed', 'success');
        }
    });

    // When user switches networks
    provider.on("chainChanged", (chainId) => {
        console.log('🔗 Chain changed to:', chainId);
        showNotification('Network changed, reloading...', 'success');
        setTimeout(() => window.location.reload(), 1000);
    });

    // When wallet disconnects
    provider.on("disconnect", (error) => {
        console.log('🔌 Wallet disconnected:', error);
        handleDisconnect();
    });
}

/**
 * Handle wallet disconnection
 */
async function handleDisconnect() {
    console.log('👋 Disconnecting wallet...');
    
    // Reset state
    state.walletConnected = false;
    state.userAddress = null;
    
    // Clear Web3Modal cache
    if (web3Modal) {
        await web3Modal.clearCachedProvider();
    }
    
    // Clear provider references
    provider = null;
    web3Provider = null;
    
    // Reload page to reset UI
    window.location.reload();
}

/**
 * Manually disconnect wallet (for disconnect button)
 */
async function disconnectWallet() {
    if (provider && provider.disconnect) {
        await provider.disconnect();
    }
    await handleDisconnect();
}

/**
 * Get the current provider (for making transactions)
 */
function getProvider() {
    if (!web3Provider) {
        throw new Error('⚠️ Wallet not connected');
    }
    return web3Provider;
}

/**
 * Get the signer (for signing transactions)
 */
function getSigner() {
    if (!web3Provider) {
        throw new Error('⚠️ Wallet not connected');
    }
    return web3Provider.getSigner();
}

// ===================================
// MOCK DATA
// ===================================

const mockPredictions = [
    { name: '@cryptowhale', multiplier: 100, timestamp: Date.now() - 3600000 },
    { name: 'Vitalik.eth', multiplier: 95, timestamp: Date.now() - 5400000 },
    { name: 'Chad.eth', multiplier: 88, timestamp: Date.now() - 7200000 },
    { name: '@moonboy2024', multiplier: 75, timestamp: Date.now() - 9000000 },
    { name: 'DegenKing', multiplier: 69, timestamp: Date.now() - 10800000 },
    { name: '@hodler4life', multiplier: 50, timestamp: Date.now() - 12600000 },
    { name: 'ETH_Maxi', multiplier: 42, timestamp: Date.now() - 14400000 },
    { name: '@believer', multiplier: 33, timestamp: Date.now() - 16200000 },
    { name: 'Web3_Dev', multiplier: 25, timestamp: Date.now() - 18000000 },
    { name: '@bullishAF', multiplier: 20, timestamp: Date.now() - 19800000 },
    { name: 'Satoshi_Fan', multiplier: 15, timestamp: Date.now() - 21600000 },
    { name: '@cryptoTrader', multiplier: 12, timestamp: Date.now() - 23400000 },
    { name: 'BlockchainBro', multiplier: 10, timestamp: Date.now() - 25200000 },
    { name: '@normalGuy', multiplier: 8, timestamp: Date.now() - 27000000 },
    { name: 'SmartInvestor', multiplier: 5, timestamp: Date.now() - 28800000 },
    { name: '@realist', multiplier: 3, timestamp: Date.now() - 30600000 },
    { name: 'Cautious.eth', multiplier: 2, timestamp: Date.now() - 32400000 },
    { name: '@bear_market', multiplier: 1, timestamp: Date.now() - 34200000 },
];

state.predictions = [...mockPredictions];

// ===================================
// DOM ELEMENTS
// ===================================

const walletModal = document.getElementById('walletModal');
const connectWalletBtn = document.getElementById('connectWallet');
const userNameInput = document.getElementById('userName');
const multiplierSlider = document.getElementById('multiplierSlider');
const multiplierValue = document.getElementById('multiplierValue');
const submitPredictionBtn = document.getElementById('submitPrediction');
const leaderboardList = document.getElementById('leaderboardList');
const totalPredictionsEl = document.getElementById('totalPredictions');
const avgMultiplierEl = document.getElementById('avgMultiplier');
const bullishPercentEl = document.getElementById('bullishPercent');
const highestPredictionEl = document.getElementById('highestPrediction');

// ===================================
// WALLET MODAL FUNCTIONS
// ===================================

/**
 * Open wallet modal OR directly open Web3Modal
 * You can choose to keep your custom modal or use Web3Modal directly
 */
function openWalletModal() {
    console.log('🔘 Connect Wallet button clicked');
    
    if (!state.walletConnected) {
        // Use Web3Modal directly (skips custom modal)
        connectWalletUniversal();
    } else {
        console.log('ℹ️ Wallet already connected');
    }
}

function closeWalletModal() {
    if (walletModal) {
        walletModal.classList.remove('active');
    }
}

// Close modal when clicking outside
if (walletModal) {
    walletModal.addEventListener('click', (e) => {
        if (e.target === walletModal) {
            closeWalletModal();
        }
    });
}

// ===================================
// WALLET CONNECTION (UPDATED)
// ===================================

/**
 * Connect via MetaMask button (now uses universal connector)
 */
async function connectMetaMask() {
    // Close custom modal if it exists
    closeWalletModal();
    
    // Use the universal wallet connector
    await connectWalletUniversal();
}

/**
 * Update UI when wallet is connected
 */
function updateWalletUI(address) {
    const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
    connectWalletBtn.innerHTML = `
        <span class="wallet-status"></span>
        <span class="wallet-text">${shortAddress}</span>
    `;
    connectWalletBtn.classList.add('connected');
    connectWalletBtn.onclick = null; // Disable button when connected
}

// ===================================
// SLIDER FUNCTIONALITY
// ===================================

multiplierSlider.addEventListener('input', (e) => {
    state.selectedMultiplier = parseInt(e.target.value);
    updateMultiplierDisplay();
    updateSubmitButton();
});

function updateMultiplierDisplay() {
    multiplierValue.textContent = state.selectedMultiplier;
    
    // Color based on value
    const value = state.selectedMultiplier;
    if (value <= 5) {
        multiplierValue.style.color = '#FF006E'; // Bearish
    } else if (value <= 20) {
        multiplierValue.style.color = '#FFB800'; // Neutral
    } else {
        multiplierValue.style.color = '#06FFA5'; // Bullish
    }
}

function setMultiplier(value) {
    state.selectedMultiplier = value;
    multiplierSlider.value = value;
    updateMultiplierDisplay();
    updateSubmitButton();
}

// ===================================
// FORM LOGIC
// ===================================

userNameInput.addEventListener('input', () => {
    state.userName = userNameInput.value.trim();
    updateSubmitButton();
});

function updateSubmitButton() {
    const isFormComplete = state.userName && state.selectedMultiplier && state.walletConnected;
    submitPredictionBtn.disabled = !isFormComplete;
}

// ===================================
// SUBMIT PREDICTION
// ===================================

async function submitPrediction() {
    try {
        if (!state.userName || !state.selectedMultiplier) {
            showNotification('Please fill in all fields', 'error');
            return;
        }

        if (!state.walletConnected) {
            showNotification('Please connect your wallet first', 'error');
            return;
        }

        // Show loading
        submitPredictionBtn.disabled = true;
        submitPredictionBtn.innerHTML = `
            <span class="btn-glow"></span>
            <span class="btn-content">
                <span class="btn-text">LOCKING...</span>
                <span class="btn-icon">⏳</span>
            </span>
        `;

        // ===================================
        // SMART CONTRACT INTERACTION
        // ===================================
        
        // Get provider and signer from Web3Modal connection
        const provider = getProvider();
        const signer = getSigner();
        
        // TODO: Add your contract address and ABI here
        // const CONTRACT_ADDRESS = '0x...';
        // const CONTRACT_ABI = [...];
        // const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        // const tx = await contract.submitPrediction(state.selectedMultiplier);
        // const receipt = await tx.wait();
        // console.log('Transaction hash:', receipt.transactionHash);
        
        // Simulate transaction (remove this in production)
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Add prediction
        const newPrediction = {
            name: state.userName,
            multiplier: state.selectedMultiplier,
            timestamp: Date.now()
        };
        
        state.predictions.unshift(newPrediction);

        // Update UI
        renderLeaderboard();
        updateStats();
        updateChart();

        // Reset form
        userNameInput.value = '';
        state.userName = '';
        state.selectedMultiplier = 10;
        multiplierSlider.value = 10;
        updateMultiplierDisplay();

        // Success
        showNotification(`🎉 Prediction locked! ${newPrediction.multiplier}× is onchain!`, 'success');

    } catch (error) {
        console.error('Error submitting prediction:', error);
        
        // Check for user rejection
        if (error.code === 4001 || error.message.includes('User denied')) {
            showNotification('Transaction cancelled', 'error');
        } else {
            showNotification('Failed to submit prediction', 'error');
        }
    } finally {
        // Reset button
        submitPredictionBtn.innerHTML = `
            <span class="btn-glow"></span>
            <span class="btn-content">
                <span class="btn-text">LOCK PREDICTION</span>
                <span class="btn-icon">🔒</span>
            </span>
        `;
        updateSubmitButton();
    }
}

submitPredictionBtn.addEventListener('click', submitPrediction);

// ===================================
// LEADERBOARD
// ===================================

function renderLeaderboard() {
    let sortedPredictions = [...state.predictions];
    
    if (state.leaderboardFilter === 'highest') {
        sortedPredictions.sort((a, b) => b.multiplier - a.multiplier);
    } else {
        sortedPredictions.sort((a, b) => b.timestamp - a.timestamp);
    }
    
    leaderboardList.innerHTML = '';
    
    sortedPredictions.slice(0, 20).forEach((prediction, index) => {
        const item = document.createElement('div');
        item.className = 'leaderboard-item';
        item.style.animationDelay = `${index * 0.05}s`;
        
        const rank = index + 1;
        let rankClass = 'regular';
        if (rank === 1) rankClass = 'gold';
        else if (rank === 2) rankClass = 'silver';
        else if (rank === 3) rankClass = 'bronze';
        
        const firstLetter = prediction.name.charAt(0).toUpperCase();
        const timeAgo = getTimeAgo(prediction.timestamp);
        
        item.innerHTML = `
            <div class="leaderboard-rank ${rankClass}">#${rank}</div>
            <div class="leaderboard-avatar">${firstLetter}</div>
            <div class="leaderboard-info">
                <div class="leaderboard-name">${prediction.name}</div>
                <div class="leaderboard-time">${timeAgo}</div>
            </div>
            <div class="leaderboard-multiplier">${prediction.multiplier}×</div>
        `;
        
        leaderboardList.appendChild(item);
    });
}

function filterLeaderboard(filter) {
    state.leaderboardFilter = filter;
    
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    renderLeaderboard();
}

function getTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

// ===================================
// STATS
// ===================================

function updateStats() {
    // Total predictions
    totalPredictionsEl.textContent = state.predictions.length;
    
    // Average multiplier
    const total = state.predictions.reduce((sum, p) => sum + p.multiplier, 0);
    const average = state.predictions.length > 0 ? (total / state.predictions.length).toFixed(1) : 0;
    avgMultiplierEl.textContent = `${average}×`;
    
    // Super bullish (50x+)
    const superBullishCount = state.predictions.filter(p => p.multiplier >= 50).length;
    const superBullishPercent = state.predictions.length > 0 
        ? ((superBullishCount / state.predictions.length) * 100).toFixed(0) 
        : 0;
    bullishPercentEl.textContent = `${superBullishPercent}%`;
    
    // Highest prediction
    const highest = state.predictions.length > 0 
        ? Math.max(...state.predictions.map(p => p.multiplier))
        : 0;
    highestPredictionEl.textContent = `${highest}×`;
    
    // Update sidebar total count
    const sidebarTotal = document.getElementById('totalLockedCount');
    if (sidebarTotal) {
        sidebarTotal.textContent = state.predictions.length;
    }
}

// ===================================
// CHART (Full 1-100x range)
// ===================================

let chartInstance = null;

function updateChart() {
    const ctx = document.getElementById('predictionChart').getContext('2d');
    
    // Create buckets for grouping
    const buckets = createBuckets();
    
    if (chartInstance) {
        chartInstance.destroy();
    }
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 500);
    gradient.addColorStop(0, 'rgba(6, 255, 165, 0.8)');
    gradient.addColorStop(0.5, 'rgba(255, 184, 0, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 0, 110, 0.8)');
    
    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: buckets.map(b => b.label),
            datasets: [{
                label: 'Predictions',
                data: buckets.map(b => b.count),
                backgroundColor: buckets.map(b => {
                    if (b.max <= 5) return 'rgba(255, 0, 110, 0.8)'; // Bearish
                    if (b.max <= 20) return 'rgba(255, 184, 0, 0.8)'; // Neutral
                    return 'rgba(6, 255, 165, 0.8)'; // Bullish
                }),
                borderColor: buckets.map(b => {
                    if (b.max <= 5) return '#FF006E';
                    if (b.max <= 20) return '#FFB800';
                    return '#06FFA5';
                }),
                borderWidth: 2,
                borderRadius: 8,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(26, 11, 46, 0.95)',
                    titleColor: '#C77DFF',
                    bodyColor: '#FFFFFF',
                    borderColor: '#9D4EDD',
                    borderWidth: 2,
                    padding: 16,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return `${context.parsed.y} predictions`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#C8B6E2',
                        font: {
                            family: 'Exo 2',
                            size: 12
                        },
                        stepSize: 1
                    },
                    grid: {
                        color: 'rgba(157, 78, 221, 0.1)',
                        drawBorder: false
                    }
                },
                x: {
                    ticks: {
                        color: '#C8B6E2',
                        font: {
                            family: 'Exo 2',
                            size: 11
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function createBuckets() {
    // Create smart buckets for 1-100x range
    const buckets = [
        { min: 1, max: 1, label: '1×', count: 0 },
        { min: 2, max: 2, label: '2×', count: 0 },
        { min: 3, max: 5, label: '3-5×', count: 0 },
        { min: 6, max: 10, label: '6-10×', count: 0 },
        { min: 11, max: 20, label: '11-20×', count: 0 },
        { min: 21, max: 30, label: '21-30×', count: 0 },
        { min: 31, max: 40, label: '31-40×', count: 0 },
        { min: 41, max: 50, label: '41-50×', count: 0 },
        { min: 51, max: 75, label: '51-75×', count: 0 },
        { min: 76, max: 100, label: '76-100×', count: 0 },
    ];
    
    state.predictions.forEach(prediction => {
        const bucket = buckets.find(b => 
            prediction.multiplier >= b.min && prediction.multiplier <= b.max
        );
        if (bucket) {
            bucket.count++;
        }
    });
    
    return buckets;
}

// ===================================
// NOTIFICATIONS
// ===================================

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? 'rgba(6, 255, 165, 0.2)' : 'rgba(255, 0, 110, 0.2)'};
        border: 2px solid ${type === 'success' ? '#06FFA5' : '#FF006E'};
        border-radius: 12px;
        color: white;
        font-family: 'Exo 2', sans-serif;
        font-weight: 600;
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);

// ===================================
// INITIALIZATION
// ===================================

function init() {
    console.log('🚀 Initializing MegaETH TGE Multiplier Board...');
    
    // Initialize Web3Modal first
    const web3ModalReady = initWeb3Modal();
    if (!web3ModalReady) {
        console.warn('⚠️ Web3Modal initialization failed. Please check script tags in HTML.');
    }
    
    // Make sure connect button works
    if (connectWalletBtn) {
        console.log('✅ Connect wallet button found');
        // Remove any existing onclick and add event listener
        connectWalletBtn.onclick = null;
        connectWalletBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🔘 Button clicked via event listener');
            openWalletModal();
        });
    } else {
        console.error('❌ Connect wallet button not found in DOM');
    }
    
    // Render UI
    renderLeaderboard();
    updateStats();
    updateChart();
    updateMultiplierDisplay();
    
    console.log('✅ MegaETH TGE Multiplier Board v2.0 with WalletConnect initialized!');
    console.log('📊 Total predictions:', state.predictions.length);
    console.log('💡 Supports ALL wallets: MetaMask, Trust, Coinbase, Rainbow, etc.');
    console.log('🌐 Click "Connect Wallet" to get started!');
}

// Auto-reconnect if user was previously connected
async function autoConnect() {
    if (web3Modal && web3Modal.cachedProvider) {
        console.log('🔄 Auto-reconnecting to cached wallet...');
        await connectWalletUniversal();
    }
}

// Initialize when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        init();
        autoConnect();
    });
} else {
    init();
    autoConnect();
}

// ===================================
// SMART CONTRACT INTEGRATION GUIDE
// ===================================

/*
READY TO ADD YOUR SMART CONTRACT?

1. Add your contract details at the top:
   const CONTRACT_ADDRESS = '0x...';
   const CONTRACT_ABI = [...];

2. In submitPrediction(), find the TODO section and add:

   const provider = getProvider(); // Uses WalletConnect provider
   const signer = getSigner();
   const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
   
   // For free predictions:
   const tx = await contract.submitPrediction(state.selectedMultiplier);
   
   // OR if payable:
   // const tx = await contract.submitPrediction(
   //     state.selectedMultiplier,
   //     { value: ethers.utils.parseEther("0.01") }
   // );
   
   const receipt = await tx.wait();
   console.log('✅ Transaction confirmed:', receipt.transactionHash);

3. To fetch predictions from contract:

   async function loadPredictions() {
       const provider = getProvider();
       const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
       
       const predictions = await contract.getAllPredictions();
       state.predictions = predictions.map(p => ({
           name: p.name,
           multiplier: p.multiplier.toNumber(),
           timestamp: p.timestamp.toNumber() * 1000
       }));
       
       renderLeaderboard();
       updateStats();
       updateChart();
   }

4. Listen to events:

   const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, getProvider());
   contract.on("PredictionSubmitted", (user, multiplier, timestamp) => {
       console.log('🆕 New prediction:', user, multiplier);
       loadPredictions();
   });

IMPORTANT: Get your WalletConnect Project ID
1. Go to https://cloud.walletconnect.com
2. Sign up (free)
3. Create a project
4. Replace "YOUR_WALLETCONNECT_PROJECT_ID" on line 25

That's it! Your dApp will work with ALL wallets on ALL platforms!
*/
