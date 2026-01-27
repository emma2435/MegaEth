// ===================================
// STATE MANAGEMENT
// ===================================

// Application state
const state = {
    walletConnected: false,
    userAddress: null,
    userName: '',
    selectedMultiplier: null,
    predictions: []
};

// ===================================
// MOCK DATA FOR DEMO
// ===================================

// Mock predictions data - Replace with real contract data later
const mockPredictions = [
    { name: '@cryptowhale', multiplier: 100, timestamp: Date.now() - 3600000 },
    { name: 'Chad.eth', multiplier: 50, timestamp: Date.now() - 7200000 },
    { name: '@moonboy', multiplier: 10, timestamp: Date.now() - 10800000 },
    { name: 'DegenKing', multiplier: 5, timestamp: Date.now() - 14400000 },
    { name: '@hodler4life', multiplier: 2, timestamp: Date.now() - 18000000 },
    { name: 'ETH_Maxi', multiplier: 10, timestamp: Date.now() - 21600000 },
    { name: '@believer', multiplier: 50, timestamp: Date.now() - 25200000 },
    { name: 'Web3_Dev', multiplier: 5, timestamp: Date.now() - 28800000 },
];

// Initialize predictions with mock data
state.predictions = [...mockPredictions];

// ===================================
// DOM ELEMENTS
// ===================================

const connectWalletBtn = document.getElementById('connectWallet');
const userNameInput = document.getElementById('userName');
const multiplierButtons = document.querySelectorAll('.multiplier-btn');
const submitPredictionBtn = document.getElementById('submitPrediction');
const predictionsList = document.getElementById('predictionsList');
const totalPredictionsEl = document.getElementById('totalPredictions');
const avgMultiplierEl = document.getElementById('avgMultiplier');
const bullishPercentEl = document.getElementById('bullishPercent');

// ===================================
// WALLET CONNECTION
// ===================================

/**
 * Connect to MetaMask wallet
 * This function will be called when user clicks "Connect Wallet"
 */
async function connectWallet() {
    try {
        // Check if MetaMask is installed
        if (typeof window.ethereum === 'undefined') {
            alert('Please install MetaMask to use this dApp!');
            window.open('https://metamask.io/download/', '_blank');
            return;
        }

        // Request account access
        const accounts = await window.ethereum.request({ 
            method: 'eth_requestAccounts' 
        });

        // Get the connected account
        const account = accounts[0];
        
        // Update state
        state.walletConnected = true;
        state.userAddress = account;

        // Update UI
        updateWalletUI(account);
        
        console.log('Wallet connected:', account);

        // Listen for account changes
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        
        // Listen for chain changes
        window.ethereum.on('chainChanged', () => {
            window.location.reload();
        });

    } catch (error) {
        console.error('Error connecting wallet:', error);
        alert('Failed to connect wallet. Please try again.');
    }
}

/**
 * Update UI when wallet is connected
 */
function updateWalletUI(address) {
    const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
    connectWalletBtn.innerHTML = `
        <span class="wallet-icon">✓</span>
        <span class="wallet-text">${shortAddress}</span>
    `;
    connectWalletBtn.classList.add('connected');
    connectWalletBtn.disabled = true;
}

/**
 * Handle account changes
 */
function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        // User disconnected wallet
        state.walletConnected = false;
        state.userAddress = null;
        location.reload();
    } else {
        // User switched accounts
        state.userAddress = accounts[0];
        updateWalletUI(accounts[0]);
    }
}

// ===================================
// PREDICTION FORM LOGIC
// ===================================

/**
 * Handle multiplier button selection
 */
multiplierButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all buttons
        multiplierButtons.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to clicked button
        button.classList.add('active');
        
        // Update state
        state.selectedMultiplier = parseInt(button.dataset.value);
        
        // Enable submit button if all fields are filled
        updateSubmitButton();
    });
});

/**
 * Handle name input
 */
userNameInput.addEventListener('input', () => {
    state.userName = userNameInput.value.trim();
    updateSubmitButton();
});

/**
 * Enable/disable submit button based on form completion
 */
function updateSubmitButton() {
    const isFormComplete = state.userName && state.selectedMultiplier && state.walletConnected;
    submitPredictionBtn.disabled = !isFormComplete;
}

/**
 * Submit prediction
 * NOTE: This is where you'll add smart contract interaction
 */
async function submitPrediction() {
    try {
        // Validate form
        if (!state.userName || !state.selectedMultiplier) {
            alert('Please fill in all fields');
            return;
        }

        if (!state.walletConnected) {
            alert('Please connect your wallet first');
            return;
        }

        // Show loading state
        submitPredictionBtn.disabled = true;
        submitPredictionBtn.innerHTML = '<span class="btn-text">Locking...</span> ⏳';

        // ===================================
        // TODO: SMART CONTRACT INTERACTION
        // ===================================
        // const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        // const tx = await contract.submitPrediction(state.selectedMultiplier, { value: ethers.utils.parseEther("0.01") });
        // await tx.wait();
        
        // Simulate transaction delay (remove this in production)
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Add new prediction to state (this will come from contract events in production)
        const newPrediction = {
            name: state.userName,
            multiplier: state.selectedMultiplier,
            timestamp: Date.now()
        };
        
        state.predictions.unshift(newPrediction);

        // Update UI
        renderPredictions();
        updateStats();
        updateChart();

        // Reset form
        userNameInput.value = '';
        state.userName = '';
        state.selectedMultiplier = null;
        multiplierButtons.forEach(btn => btn.classList.remove('active'));

        // Success message
        alert(`🎉 Prediction locked! ${state.selectedMultiplier}× locked onchain!`);

    } catch (error) {
        console.error('Error submitting prediction:', error);
        alert('Failed to submit prediction. Please try again.');
    } finally {
        // Reset button
        submitPredictionBtn.innerHTML = `
            <span class="btn-text">Lock Prediction</span>
            <span class="btn-icon">🚀</span>
        `;
        updateSubmitButton();
    }
}

// ===================================
// DISPLAY FUNCTIONS
// ===================================

/**
 * Render predictions list
 */
function renderPredictions() {
    predictionsList.innerHTML = '';
    
    state.predictions.forEach((prediction, index) => {
        const predictionEl = document.createElement('div');
        predictionEl.className = 'prediction-item';
        predictionEl.style.animationDelay = `${index * 0.05}s`;
        
        // Get first letter for avatar
        const firstLetter = prediction.name.charAt(0).toUpperCase();
        
        predictionEl.innerHTML = `
            <div class="prediction-info">
                <div class="prediction-avatar">${firstLetter}</div>
                <div class="prediction-name">${prediction.name}</div>
            </div>
            <div class="prediction-multiplier">${prediction.multiplier}×</div>
        `;
        
        predictionsList.appendChild(predictionEl);
    });
}

/**
 * Update statistics
 */
function updateStats() {
    // Total predictions
    totalPredictionsEl.textContent = state.predictions.length;
    
    // Average multiplier
    const total = state.predictions.reduce((sum, p) => sum + p.multiplier, 0);
    const average = state.predictions.length > 0 ? (total / state.predictions.length).toFixed(1) : 0;
    avgMultiplierEl.textContent = `${average}×`;
    
    // Bullish percentage (10× or more)
    const bullishCount = state.predictions.filter(p => p.multiplier >= 10).length;
    const bullishPercent = state.predictions.length > 0 
        ? ((bullishCount / state.predictions.length) * 100).toFixed(0) 
        : 0;
    bullishPercentEl.textContent = `${bullishPercent}%`;
}

/**
 * Get prediction distribution for chart
 */
function getPredictionDistribution() {
    const distribution = {
        '1×': 0,
        '2×': 0,
        '5×': 0,
        '10×': 0,
        '50×': 0,
        '100×': 0
    };
    
    state.predictions.forEach(prediction => {
        const key = `${prediction.multiplier}×`;
        if (key in distribution) {
            distribution[key]++;
        }
    });
    
    return distribution;
}

// ===================================
// CHART SETUP
// ===================================

let chartInstance = null;

/**
 * Initialize or update chart
 */
function updateChart() {
    const distribution = getPredictionDistribution();
    const labels = Object.keys(distribution);
    const data = Object.values(distribution);
    
    const ctx = document.getElementById('predictionChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (chartInstance) {
        chartInstance.destroy();
    }
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(139, 92, 246, 0.8)');
    gradient.addColorStop(1, 'rgba(236, 72, 153, 0.8)');
    
    // Create new chart
    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Number of Predictions',
                data: data,
                backgroundColor: gradient,
                borderColor: 'rgba(139, 92, 246, 1)',
                borderWidth: 2,
                borderRadius: 8,
                hoverBackgroundColor: 'rgba(192, 132, 252, 1)',
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
                    backgroundColor: 'rgba(26, 26, 46, 0.95)',
                    titleColor: '#A78BFA',
                    bodyColor: '#FFFFFF',
                    borderColor: '#8B5CF6',
                    borderWidth: 1,
                    padding: 12,
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
                        color: '#B4B4C8',
                        font: {
                            family: 'Rajdhani',
                            size: 12
                        },
                        stepSize: 1
                    },
                    grid: {
                        color: 'rgba(139, 92, 246, 0.1)',
                        drawBorder: false
                    }
                },
                x: {
                    ticks: {
                        color: '#B4B4C8',
                        font: {
                            family: 'Orbitron',
                            size: 14,
                            weight: 'bold'
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

// ===================================
// EVENT LISTENERS
// ===================================

connectWalletBtn.addEventListener('click', connectWallet);
submitPredictionBtn.addEventListener('click', submitPrediction);

// ===================================
// INITIALIZATION
// ===================================

/**
 * Initialize the app
 */
function init() {
    // Render initial predictions
    renderPredictions();
    
    // Update stats
    updateStats();
    
    // Initialize chart
    updateChart();
    
    console.log('MegaETH TGE Multiplier Board initialized! 🚀');
}

// Run initialization when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// ===================================
// SMART CONTRACT INTEGRATION NOTES
// ===================================

/*
TO ADD SMART CONTRACT FUNCTIONALITY:

1. Add your contract address and ABI at the top:
   const CONTRACT_ADDRESS = '0x...';
   const CONTRACT_ABI = [...];

2. In the submitPrediction function, replace the mock code with:
   
   // Create provider and signer
   const provider = new ethers.providers.Web3Provider(window.ethereum);
   const signer = provider.getSigner();
   
   // Create contract instance
   const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
   
   // Submit prediction (assuming payable function)
   const tx = await contract.submitPrediction(
       state.selectedMultiplier,
       { value: ethers.utils.parseEther("0.01") } // Adjust fee amount
   );
   
   // Wait for transaction
   await tx.wait();

3. To fetch existing predictions from the contract:
   
   async function loadPredictionsFromContract() {
       const provider = new ethers.providers.Web3Provider(window.ethereum);
       const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
       
       // Assuming you have a getter function
       const predictions = await contract.getAllPredictions();
       
       // Update state
       state.predictions = predictions.map(p => ({
           name: p.name,
           multiplier: p.multiplier.toNumber(),
           timestamp: p.timestamp.toNumber() * 1000
       }));
       
       // Update UI
       renderPredictions();
       updateStats();
       updateChart();
   }

4. Listen to contract events for real-time updates:
   
   const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
   
   contract.on("PredictionSubmitted", (user, multiplier, timestamp) => {
       // Handle new prediction event
       console.log('New prediction:', user, multiplier);
       // Refresh predictions
       loadPredictionsFromContract();
   });

5. Example contract ABI structure:
   
   const CONTRACT_ABI = [
       "function submitPrediction(uint8 multiplier) external payable",
       "function getAllPredictions() external view returns (tuple(address user, string name, uint8 multiplier, uint256 timestamp)[])",
       "event PredictionSubmitted(address indexed user, uint8 multiplier, uint256 timestamp)"
   ];

For more info on ethers.js, visit: https://docs.ethers.org/v5/
*/
