// =====================================
// MEGAETH TGE MULTIPLIER BOARD
// With WalletConnect Support
// =====================================

// STATE
const state = {
    walletConnected: false,
    userAddress: null,
    userName: '',
    selectedMultiplier: 10,
    predictions: [],
    leaderboardFilter: 'highest'
};

// WEB3MODAL & WALLETCONNECT
let web3Modal = null;
let provider = null;
let web3Provider = null;

// Initialize Web3Modal
function initWeb3Modal() {
    try {
        // Check if libraries loaded
        if (typeof window.Web3Modal === 'undefined') {
            console.error('❌ Web3Modal not loaded');
            return false;
        }
        
        if (typeof window.WalletConnectProvider === 'undefined') {
            console.error('❌ WalletConnect not loaded');
            return false;
        }

        const providerOptions = {
            walletconnect: {
                package: window.WalletConnectProvider.default,
                options: {
                    projectId: "a7a4da3c4d7e3b5f9c8e6a2b1d0f3e5c", // Example ID - GET YOUR OWN from cloud.walletconnect.com
                    rpc: {
                        1: "https://eth.llamarpc.com",
                        137: "https://polygon-rpc.com"
                    }
                }
            }
        };

        web3Modal = new window.Web3Modal.default({
            cacheProvider: true,
            providerOptions,
            disableInjectedProvider: false,
            theme: {
                background: "rgb(26, 11, 46)",
                main: "rgb(199, 125, 255)",
                secondary: "rgb(136, 136, 136)",
                border: "rgba(195, 195, 195, 0.14)",
                hover: "rgb(42, 24, 66)"
            }
        });

        console.log('✅ Web3Modal initialized');
        return true;
    } catch (error) {
        console.error('❌ Init error:', error);
        return false;
    }
}

// Connect Wallet
async function connectWallet() {
    try {
        console.log('🔌 Connecting wallet...');

        if (!web3Modal) {
            if (!initWeb3Modal()) {
                alert('Error: Web3Modal not initialized. Please refresh.');
                return;
            }
        }

        provider = await web3Modal.connect();
        web3Provider = new ethers.providers.Web3Provider(provider);
        
        const signer = web3Provider.getSigner();
        const address = await signer.getAddress();
        
        state.walletConnected = true;
        state.userAddress = address;
        
        updateWalletUI(address);
        showNotification('Wallet Connected! 🎉', 'success');
        
        // Subscribe to events
        provider.on("accountsChanged", (accounts) => {
            if (accounts.length === 0) {
                disconnectWallet();
            } else {
                state.userAddress = accounts[0];
                updateWalletUI(accounts[0]);
            }
        });
        
        provider.on("chainChanged", () => {
            window.location.reload();
        });
        
        console.log('✅ Connected:', address);
    } catch (error) {
        console.error('❌ Connection error:', error);
        if (!error.message.includes('User closed modal')) {
            showNotification('Connection failed', 'error');
        }
    }
}

// Disconnect Wallet
async function disconnectWallet() {
    if (web3Modal) {
        await web3Modal.clearCachedProvider();
    }
    provider = null;
    web3Provider = null;
    state.walletConnected = false;
    state.userAddress = null;
    window.location.reload();
}

// Update UI when wallet connected
function updateWalletUI(address) {
    const btn = document.getElementById('connectWallet');
    const short = `${address.slice(0, 6)}...${address.slice(-4)}`;
    btn.innerHTML = `<span class="wallet-status"></span><span class="wallet-text">${short}</span>`;
    btn.classList.add('connected');
}

// Get Provider/Signer
function getProvider() {
    if (!web3Provider) throw new Error('Wallet not connected');
    return web3Provider;
}

function getSigner() {
    if (!web3Provider) throw new Error('Wallet not connected');
    return web3Provider.getSigner();
}

// MOCK DATA
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

// DOM ELEMENTS
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

// SLIDER
multiplierSlider.addEventListener('input', (e) => {
    state.selectedMultiplier = parseInt(e.target.value);
    updateMultiplierDisplay();
    updateSubmitButton();
});

function updateMultiplierDisplay() {
    multiplierValue.textContent = state.selectedMultiplier;
    const value = state.selectedMultiplier;
    if (value <= 5) {
        multiplierValue.style.color = '#FF006E';
    } else if (value <= 20) {
        multiplierValue.style.color = '#FFB800';
    } else {
        multiplierValue.style.color = '#06FFA5';
    }
}

function setMultiplier(value) {
    state.selectedMultiplier = value;
    multiplierSlider.value = value;
    updateMultiplierDisplay();
    updateSubmitButton();
}

// FORM
userNameInput.addEventListener('input', () => {
    state.userName = userNameInput.value.trim();
    updateSubmitButton();
});

function updateSubmitButton() {
    const isComplete = state.userName && state.selectedMultiplier && state.walletConnected;
    submitPredictionBtn.disabled = !isComplete;
}

// SUBMIT PREDICTION
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

        submitPredictionBtn.disabled = true;
        submitPredictionBtn.innerHTML = `<span class="btn-glow"></span><span class="btn-content"><span class="btn-text">LOCKING...</span><span class="btn-icon">⏳</span></span>`;

        // TODO: Add your smart contract call here
        // const provider = getProvider();
        // const signer = getSigner();
        // const contract = new ethers.Contract(ADDRESS, ABI, signer);
        // const tx = await contract.submitPrediction(state.selectedMultiplier);
        // await tx.wait();

        // Simulate transaction
        await new Promise(resolve => setTimeout(resolve, 2000));

        const newPrediction = {
            name: state.userName,
            multiplier: state.selectedMultiplier,
            timestamp: Date.now()
        };
        
        state.predictions.unshift(newPrediction);
        
        renderLeaderboard();
        updateStats();
        updateChart();

        userNameInput.value = '';
        state.userName = '';
        state.selectedMultiplier = 10;
        multiplierSlider.value = 10;
        updateMultiplierDisplay();

        showNotification(`🎉 Prediction locked! ${newPrediction.multiplier}× is onchain!`, 'success');
    } catch (error) {
        console.error('Error:', error);
        if (error.code === 4001) {
            showNotification('Transaction cancelled', 'error');
        } else {
            showNotification('Failed to submit', 'error');
        }
    } finally {
        submitPredictionBtn.innerHTML = `<span class="btn-glow"></span><span class="btn-content"><span class="btn-text">LOCK PREDICTION</span><span class="btn-icon">🔒</span></span>`;
        updateSubmitButton();
    }
}

submitPredictionBtn.addEventListener('click', submitPrediction);

// LEADERBOARD
function renderLeaderboard() {
    let sorted = [...state.predictions];
    if (state.leaderboardFilter === 'highest') {
        sorted.sort((a, b) => b.multiplier - a.multiplier);
    } else {
        sorted.sort((a, b) => b.timestamp - a.timestamp);
    }
    
    leaderboardList.innerHTML = '';
    sorted.slice(0, 20).forEach((p, i) => {
        const item = document.createElement('div');
        item.className = 'leaderboard-item';
        const rank = i + 1;
        let rankClass = 'regular';
        if (rank === 1) rankClass = 'gold';
        else if (rank === 2) rankClass = 'silver';
        else if (rank === 3) rankClass = 'bronze';
        
        item.innerHTML = `
            <div class="leaderboard-rank ${rankClass}">#${rank}</div>
            <div class="leaderboard-avatar">${p.name.charAt(0).toUpperCase()}</div>
            <div class="leaderboard-info">
                <div class="leaderboard-name">${p.name}</div>
                <div class="leaderboard-time">${getTimeAgo(p.timestamp)}</div>
            </div>
            <div class="leaderboard-multiplier">${p.multiplier}×</div>
        `;
        leaderboardList.appendChild(item);
    });
}

function filterLeaderboard(filter) {
    state.leaderboardFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
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

// STATS
function updateStats() {
    totalPredictionsEl.textContent = state.predictions.length;
    
    const total = state.predictions.reduce((sum, p) => sum + p.multiplier, 0);
    const avg = state.predictions.length > 0 ? (total / state.predictions.length).toFixed(1) : 0;
    avgMultiplierEl.textContent = `${avg}×`;
    
    const superBullish = state.predictions.filter(p => p.multiplier >= 50).length;
    const percent = state.predictions.length > 0 ? ((superBullish / state.predictions.length) * 100).toFixed(0) : 0;
    bullishPercentEl.textContent = `${percent}%`;
    
    const highest = state.predictions.length > 0 ? Math.max(...state.predictions.map(p => p.multiplier)) : 0;
    highestPredictionEl.textContent = `${highest}×`;
    
    const sidebarTotal = document.getElementById('totalLockedCount');
    if (sidebarTotal) sidebarTotal.textContent = state.predictions.length;
}

// CHART
let chartInstance = null;

function updateChart() {
    const ctx = document.getElementById('predictionChart').getContext('2d');
    const buckets = createBuckets();
    
    if (chartInstance) chartInstance.destroy();
    
    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: buckets.map(b => b.label),
            datasets: [{
                label: 'Predictions',
                data: buckets.map(b => b.count),
                backgroundColor: buckets.map(b => {
                    if (b.max <= 5) return 'rgba(255, 0, 110, 0.8)';
                    if (b.max <= 20) return 'rgba(255, 184, 0, 0.8)';
                    return 'rgba(6, 255, 165, 0.8)';
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
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(26, 11, 46, 0.95)',
                    titleColor: '#C77DFF',
                    bodyColor: '#FFFFFF',
                    borderColor: '#9D4EDD',
                    borderWidth: 2,
                    padding: 16,
                    callbacks: {
                        label: (context) => `${context.parsed.y} predictions`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#C8B6E2',
                        stepSize: 1
                    },
                    grid: {
                        color: 'rgba(157, 78, 221, 0.1)'
                    }
                },
                x: {
                    ticks: { color: '#C8B6E2' },
                    grid: { display: false }
                }
            }
        }
    });
}

function createBuckets() {
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
    
    state.predictions.forEach(p => {
        const bucket = buckets.find(b => p.multiplier >= b.min && p.multiplier <= b.max);
        if (bucket) bucket.count++;
    });
    
    return buckets;
}

// NOTIFICATIONS
function showNotification(message, type = 'info') {
    const notif = document.createElement('div');
    notif.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? 'rgba(6, 255, 165, 0.2)' : 'rgba(255, 0, 110, 0.2)'};
        border: 2px solid ${type === 'success' ? '#06FFA5' : '#FF006E'};
        border-radius: 12px;
        color: white;
        font-weight: 600;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    notif.textContent = message;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 3000);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);

// INIT
function init() {
    console.log('🚀 Initializing...');
    
    initWeb3Modal();
    
    // Attach wallet button click
    if (connectWalletBtn) {
        connectWalletBtn.addEventListener('click', connectWallet);
        console.log('✅ Wallet button ready');
    }
    
    renderLeaderboard();
    updateStats();
    updateChart();
    updateMultiplierDisplay();
    
    console.log('✅ MegaETH TGE Multiplier Board Ready!');
}

// Auto-reconnect
async function autoConnect() {
    if (web3Modal && web3Modal.cachedProvider) {
        console.log('🔄 Auto-reconnecting...');
        await connectWallet();
    }
}

// Start
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        init();
        autoConnect();
    });
} else {
    init();
    autoConnect();
}
