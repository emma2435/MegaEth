// =====================================
// FIREBASE + WALLET CONNECT INTEGRATION
// =====================================

// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase, ref, push, onValue, query, orderByChild, limitToLast } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBz2_WL2y3xCJpNmzrTr4eMy6tsX_0_L-U",
  authDomain: "mega-x-board.firebaseapp.com",
  databaseURL: "https://mega-x-board-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "mega-x-board",
  storageBucket: "mega-x-board.firebasestorage.app",
  messagingSenderId: "1093485657392",
  appId: "1:1093485657392:web:33ed5677eedc23d8ce5cf5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const predictionsRef = ref(database, 'predictions');

console.log('🔥 Firebase initialized successfully!');

// STATE
const state = {
    userName: '',
    selectedMultiplier: 10,
    predictions: [],
    leaderboardFilter: 'highest'
};

// =====================================
// FIREBASE FUNCTIONS
// =====================================

// Load predictions from Firebase
function loadPredictionsFromFirebase() {
    console.log('📥 Loading predictions from Firebase...');
    
    const predictionsQuery = query(predictionsRef, limitToLast(100));
    
    onValue(predictionsQuery, (snapshot) => {
        const data = snapshot.val();
        state.predictions = [];
        
        if (data) {
            Object.keys(data).forEach(key => {
                state.predictions.push({
                    id: key,
                    ...data[key]
                });
            });
            console.log(`✅ Loaded ${state.predictions.length} predictions from Firebase`);
        } else {
            console.log('📭 No predictions in Firebase yet');
        }
        
        // Update UI
        renderLeaderboard();
        updateStats();
        updateChart();
    }, (error) => {
        console.error('❌ Error loading predictions:', error);
    });
}

// Save prediction to Firebase
async function savePredictionToFirebase(prediction) {
    try {
        console.log('💾 Saving to Firebase...', prediction);
        
        const newPredictionRef = await push(predictionsRef, {
            name: prediction.name,
            multiplier: prediction.multiplier,
            timestamp: prediction.timestamp
        });
        
        console.log('✅ Saved to Firebase with ID:', newPredictionRef.key);
        return newPredictionRef.key;
    } catch (error) {
        console.error('❌ Error saving to Firebase:', error);
        throw error;
    }
}

// =====================================
// DOM ELEMENTS
// =====================================

const userNameInput = document.getElementById('userName');
const multiplierSlider = document.getElementById('multiplierSlider');
const multiplierValue = document.getElementById('multiplierValue');
const submitPredictionBtn = document.getElementById('submitPrediction');
const leaderboardList = document.getElementById('leaderboardList');
const totalPredictionsEl = document.getElementById('totalPredictions');
const avgMultiplierEl = document.getElementById('avgMultiplier');
const bullishPercentEl = document.getElementById('bullishPercent');
const highestPredictionEl = document.getElementById('highestPrediction');

// =====================================
// FORM LOGIC
// =====================================

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

window.setMultiplier = function(value) {
    state.selectedMultiplier = value;
    multiplierSlider.value = value;
    updateMultiplierDisplay();
    updateSubmitButton();
}

userNameInput.addEventListener('input', () => {
    state.userName = userNameInput.value.trim();
    updateSubmitButton();
});

function updateSubmitButton() {
    const isComplete = state.userName && state.selectedMultiplier;
    submitPredictionBtn.disabled = !isComplete;
}

// =====================================
// SUBMIT PREDICTION
// =====================================

async function submitPrediction() {
    try {
        console.log('🔘 Submit button clicked!');
        console.log('📝 Current state:', {
            userName: state.userName,
            multiplier: state.selectedMultiplier
        });

        if (!state.userName || !state.selectedMultiplier) {
            console.error('❌ Validation failed - missing fields');
            showNotification('Please fill in all fields', 'error');
            return;
        }

        console.log('✅ Validation passed, saving...');

        submitPredictionBtn.disabled = true;
        submitPredictionBtn.innerHTML = `<span class="btn-glow"></span><span class="btn-content"><span class="btn-text">SAVING...</span><span class="btn-icon">⏳</span></span>`;

        const newPrediction = {
            name: state.userName,
            multiplier: state.selectedMultiplier,
            timestamp: Date.now()
        };
        
        console.log('💾 Attempting to save:', newPrediction);

        // Save to Firebase
        await savePredictionToFirebase(newPrediction);

        console.log('✅ Save successful!');

        // Reset form
        userNameInput.value = '';
        state.userName = '';
        state.selectedMultiplier = 10;
        multiplierSlider.value = 10;
        updateMultiplierDisplay();

        showNotification(`🎉 Prediction saved! ${newPrediction.multiplier}× locked!`, 'success');
    } catch (error) {
        console.error('❌ Error in submitPrediction:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            stack: error.stack
        });
        showNotification('Failed to save prediction - Check console (F12)', 'error');
    } finally {
        submitPredictionBtn.innerHTML = `<span class="btn-glow"></span><span class="btn-content"><span class="btn-text">LOCK PREDICTION</span><span class="btn-icon">🔒</span></span>`;
        updateSubmitButton();
    }
}

submitPredictionBtn.addEventListener('click', submitPrediction);

// =====================================
// LEADERBOARD
// =====================================

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

window.filterLeaderboard = function(filter) {
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

// =====================================
// STATS
// =====================================

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

// =====================================
// CHART
// =====================================

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

// =====================================
// NOTIFICATIONS
// =====================================

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

// =====================================
// INIT
// =====================================

function init() {
    console.log('🚀 Initializing MegaETH TGE Multiplier Board...');
    
    // Load predictions from Firebase (real-time sync)
    loadPredictionsFromFirebase();
    
    updateMultiplierDisplay();
    
    console.log('✅ App Ready! Predictions syncing from Firebase in real-time 🔥');
}

// Start
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
