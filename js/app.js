/* ============================================
   App Controller — Main Application Logic
   ============================================ */

// Global app state
window.AppState = {
    fireDetected: false,
    fireStation: null,
    selectedStation: 'A3'
};

window.DemoState = {
    selectedPreset: null,
    manualImageURL: null
};

/**
 * Initialize the entire application
 */
function initApp() {
    console.log('🌲🔥 ForestGuard AI — Initializing...');

    // 1. Initialize Gemma API
    GemmaAPI.init();

    // 2. Initialize Network Bridge
    NetworkBridge.init();

    // 3. Initialize Map
    MapManager.init();

    // 3. Start datetime clock
    UIManager.updateDateTime();
    setInterval(() => UIManager.updateDateTime(), 1000);

    // 4. Start camera timestamp
    UIManager.updateCamTimestamp();
    setInterval(() => UIManager.updateCamTimestamp(), 1000);

    // 5. Draw initial gauge
    UIManager.drawGauge(15, '#10B981');

    // 6. Start simulation
    Simulation.start();

    // 7. Setup event listeners
    setupEventListeners();
    setupDemoEventListeners();

    // 8. Add initial log
    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    UIManager.addLogEntry(now, '🟢 System Started', 'Global', '12 stations connected');
    UIManager.addLogEntry(now, '📡 Mesh Network', 'Global', '100% Connectivity');

    console.log('✅ ForestGuard AI — Ready!');
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // === Analyze Button ===
    const btnAnalyze = document.getElementById('btn-analyze');
    if (btnAnalyze) {
        btnAnalyze.addEventListener('click', handleAnalyze);
    }

    // === Settings Button ===
    const btnSettings = document.getElementById('btn-settings');
    const settingsModal = document.getElementById('settings-modal');
    const modalClose = document.getElementById('modal-close');
    const btnSaveSettings = document.getElementById('btn-save-settings');

    // === Demo Button ===
    const btnDemo = document.getElementById('btn-demo');
    const demoModal = document.getElementById('demo-modal');

    if (btnDemo && demoModal) {
        btnDemo.addEventListener('click', () => {
            demoModal.style.display = 'flex';
            // PAUSE SIMULATION when choosing
            if (window.Simulation) window.Simulation.isPaused = true;
        });
    }

    if (btnSettings) {
        btnSettings.addEventListener('click', () => {
            settingsModal.style.display = 'flex';
            
            const hfTokenInput = document.getElementById('hf-token-input');
            const hfModelInput = document.getElementById('hf-model-input');
            const colabUrlInput = document.getElementById('colab-url-input');

            // Set current values
            if (hfTokenInput && GemmaAPI.hfToken) hfTokenInput.value = GemmaAPI.hfToken;
            if (hfModelInput && GemmaAPI.hfModelId) hfModelInput.value = GemmaAPI.hfModelId;
            if (colabUrlInput && GemmaAPI.colabUrl) colabUrlInput.value = GemmaAPI.colabUrl;
        });
    }

    if (modalClose) {
        modalClose.addEventListener('click', () => settingsModal.style.display = 'none');
    }

    const btnCloseSettings = document.getElementById('btn-close-settings');
    if (btnCloseSettings) {
        btnCloseSettings.addEventListener('click', () => settingsModal.style.display = 'none');
    }

    if (btnSaveSettings) {
        btnSaveSettings.addEventListener('click', async () => {
            const colabUrl = document.getElementById('colab-url-input')?.value.trim();
            const hfToken = document.getElementById('hf-token-input')?.value.trim();
            const hfModelId = document.getElementById('hf-model-input')?.value.trim();

            // Save Colab URL
            if (colabUrl) {
                GemmaAPI.setColabUrl(colabUrl);
                
                // Test Colab connection
                const statusIcon = document.getElementById('colab-status-icon');
                const statusText = document.getElementById('colab-status-text');
                if (statusIcon) statusIcon.textContent = '🟡';
                if (statusText) statusText.textContent = 'Testing connection...';

                try {
                    // Test Gradio API availability
                    const res = await fetch(colabUrl.replace(/\/+$/, '') + '/gradio_api/info', { method: 'GET' });
                    if (res.ok) {
                        if (statusIcon) statusIcon.textContent = '🟢';
                        if (statusText) statusText.textContent = 'Connected! Gradio API ready';
                    } else {
                        if (statusIcon) statusIcon.textContent = '🟡';
                        if (statusText) statusText.textContent = 'URL saved (verify manually)';
                    }
                } catch (e) {
                    // CORS may block the test but the API still works
                    if (statusIcon) statusIcon.textContent = '🟡';
                    if (statusText) statusText.textContent = 'URL saved — will test on first analysis';
                }
            } else {
                GemmaAPI.setColabUrl('');
            }

            // Save HF settings
            if (hfToken) localStorage.setItem('hf_token', hfToken);
            if (hfModelId) localStorage.setItem('hf_model_id', hfModelId);

            const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            const source = colabUrl ? 'Colab GPU' : 'HF Space';
            UIManager.addLogEntry(now, `🧠 AI Backend Configured`, 'System', `Mode: ${source} — OK`);

            if (!colabUrl) settingsModal.style.display = 'none';
        });
    }



    // === Map Controls ===
    const btnCenter = document.getElementById('btn-center-map');
    if (btnCenter) {
        btnCenter.addEventListener('click', () => MapManager.centerMap());
    }

    const btnGrid = document.getElementById('btn-grid');
    if (btnGrid) {
        btnGrid.addEventListener('click', () => {
            btnGrid.classList.toggle('active');
            MapManager.toggleGrid();
        });
    }

    // === Alert Dismiss ===
    const alertDismiss = document.getElementById('alert-dismiss');
    if (alertDismiss) {
        alertDismiss.addEventListener('click', () => UIManager.hideAlertBanner());
    }

    // === Clear Log ===
    const btnClearLog = document.getElementById('btn-clear-log');
    if (btnClearLog) {
        btnClearLog.addEventListener('click', () => {
            const tbody = document.getElementById('event-log-body');
            if (tbody) tbody.innerHTML = '';
        });
    }

    // === Camera Station Selector ===
    const camSelect = document.getElementById('cam-station-select');
    if (camSelect) {
        camSelect.addEventListener('change', (e) => {
            const stationId = e.target.value;
            window.AppState.selectedStation = stationId;
            
            const label = document.getElementById('cam-station-label');
            if (label) label.textContent = `Station ${stationId} — Sector ${getSectorName(stationId)}`;
            
            const sensorLabel = document.getElementById('sensor-station');
            if (sensorLabel) sensorLabel.textContent = `Station ${stationId}`;
            
            const riskSector = document.getElementById('risk-sector');
            if (riskSector) riskSector.textContent = `SECTOR ${stationId}`;
        });
    }

    // === Keyboard shortcuts ===
    document.addEventListener('keydown', (e) => {
        // F for Fire toggle
        if (e.key === 'f' || e.key === 'F') {
            if (window.AppState.fireDetected) {
                Simulation.clearFireEvent();
            } else {
                Simulation.triggerFireEvent('A3');
            }
        }
        // A for Analyze
        if (e.key === 'a' || e.key === 'A') {
            handleAnalyze();
        }
        // Escape for close modal
        if (e.key === 'Escape') {
            const modal = document.getElementById('settings-modal');
            if (modal) modal.style.display = 'none';
        }
    });

    // === Camera Controls Interaction (Simulation) ===
    const zoomIn = document.getElementById('zoom-in');
    const zoomOut = document.getElementById('zoom-out');
    const zoomVal = document.getElementById('zoom-level');
    let currentZoom = 2.5;

    if (zoomIn && zoomOut && zoomVal) {
        zoomIn.addEventListener('click', () => {
            currentZoom = Math.min(10, currentZoom + 0.5);
            zoomVal.textContent = currentZoom.toFixed(1) + 'x';
        });
        zoomOut.addEventListener('click', () => {
            currentZoom = Math.max(1, currentZoom - 0.5);
            zoomVal.textContent = currentZoom.toFixed(1) + 'x';
        });
    }

    const btnIR = document.getElementById('btn-ir');
    if (btnIR) {
        btnIR.addEventListener('click', () => {
            btnIR.classList.toggle('active');
            const img = document.getElementById('cam-image');
            if (btnIR.classList.contains('active')) {
                img.style.filter = 'sepia(1) hue-rotate(80deg) brightness(1.2) contrast(1.2)';
                btnIR.style.background = 'var(--accent-safe-glow)';
            } else {
                img.style.filter = '';
                btnIR.style.background = '';
            }
        });
    }

    const btnSnap = document.getElementById('btn-snap');
    if (btnSnap) {
        btnSnap.addEventListener('click', () => {
            const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            UIManager.addLogEntry(now, '📸 Screen Capture', `Station ${window.AppState.selectedStation}`, 'Image saved locally');
            btnSnap.style.transform = 'scale(0.95)';
            setTimeout(() => btnSnap.style.transform = '', 100);
        });
    }

    const ptzBtns = document.querySelectorAll('.btn-ptz');
    ptzBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.style.background = 'rgba(255,255,255,0.2)';
            setTimeout(() => btn.style.background = '', 200);
        });
    });
}

/**
 * Handle Gemma AI analysis
 */
async function handleAnalyze() {
    const btn = document.getElementById('btn-analyze');
    
    try {
        if (btn) btn.classList.add('loading');
        UIManager.showGemmaLoading();

        const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        UIManager.addLogEntry(now, '🧠 AI Analysis Started', `Station ${window.AppState.selectedStation}`, 'Sending to Hugging Face...', 'info');

        // Small delay for UX
        await new Promise(r => setTimeout(r, 1000));

        const imgElement = document.getElementById('cam-image');
        const sensorData = window.Simulation ? window.Simulation.currentSensorData : {};

        const response = await GemmaAPI.analyze(imgElement, sensorData);
        UIManager.displayGemmaResult(response);

        // Update scoring with AI confidence
        if (response && response.success && response.data) {
            const data = response.data;
            const confidence = (data.confidence || 0) * 100;
            const fireDetected = !!data.fire_detected;
            const severity = data.severity || 'none';

            const visionScore = fireDetected ? 85 + Math.random() * 15 : 5;

            const result = ScoringEngine.calculate({
                visionScore,
                windSpeed: sensorData.windSpeed || 0,
                temperature: sensorData.temperature || 20,
                humidity: sensorData.humidity || 50,
                aiConfidence: confidence
            });

            UIManager.updateRiskDisplay(result);
            UIManager.updateRiskBars(sensorData, Math.round(confidence));

            // If fire detected by AI, trigger alert
            if (fireDetected && !window.AppState.fireDetected) {
                Simulation.triggerFireEvent(window.AppState.selectedStation);
            }

            // Log result
            const t = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            const logType = fireDetected ? 'fire' : 'info';
            UIManager.addLogEntry(t, `🧠 AI Result: ${severity.toUpperCase()}`, `Station ${window.AppState.selectedStation}`, `Confidence: ${confidence.toFixed(0)}% — ${response.source}`, logType);
        }
    } catch (err) {
        console.error('Analysis Error:', err);
        UIManager.addLogEntry(new Date().toLocaleTimeString(), '❌ Analysis Error', 'System', err.message, 'warning');
    } finally {
        if (btn) btn.classList.remove('loading');
    }
}

/**
 * Get sector name from station ID
 */
function getSectorName(stationId) {
    const names = {
        'A1': 'North-West', 'A2': 'North', 'A3': 'North', 'A4': 'North-East',
        'B1': 'West', 'B2': 'Center', 'B3': 'Center', 'B4': 'East',
        'C1': 'South-West', 'C2': 'South', 'C3': 'South', 'C4': 'South-East'
    };
    return names[stationId] || 'Unknown';
}

/**
 * Setup Demo Mode Event Listeners
 */
function setupDemoEventListeners() {
    const btnRefresh = document.getElementById('btn-demo-refresh');
    const uploadZone = document.getElementById('demo-upload-zone');
    const fileInput = document.getElementById('demo-file-input');
    const uploadPreview = document.getElementById('demo-upload-preview');
    const btnSend = document.getElementById('btn-demo-send');

    if (btnRefresh) {
        btnRefresh.addEventListener('click', () => {
            window.refreshDemoGrid();
        });
    }

    if (uploadZone && fileInput) {
        uploadZone.addEventListener('click', () => fileInput.click());
        
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.style.borderColor = 'var(--accent-ai)';
            uploadZone.style.background = 'rgba(255, 255, 255, 0.05)';
        });
        
        uploadZone.addEventListener('dragleave', () => {
            uploadZone.style.borderColor = '';
            uploadZone.style.background = '';
        });
        
        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.style.borderColor = '';
            uploadZone.style.background = '';
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileUpload(e.dataTransfer.files[0]);
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
            }
        });
    }

    function handleFileUpload(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            uploadPreview.src = e.target.result;
            uploadPreview.style.display = 'block';
            window.DemoState.manualImageURL = e.target.result;
        }
        reader.readAsDataURL(file);
    }

    if (btnSend) {
        btnSend.addEventListener('click', handleDemoSend);
    }
}

/**
 * Generate presets for the grid
 */
window.refreshDemoGrid = function() {
    const grid = document.getElementById('demo-grid-container');
    if (!grid) return;
    
    grid.innerHTML = '';
    window.DemoState.selectedPreset = null;

    const firePresets = [
        { image: 'assets/demo-scenarios/fire/Fire_at_distance_in_forest_202605161710.jpeg', fire: true, temp: 35, wind: 18, hum: 15 },
        { image: 'assets/demo-scenarios/fire/Fire_beginning_in_forest_202605161658.jpeg', fire: true, temp: 42, wind: 22, hum: 12 },
        { image: 'assets/demo-scenarios/fire/Fire_in_dense_forest_202605161649.jpeg', fire: true, temp: 45, wind: 40, hum: 8 },
        { image: 'assets/demo-scenarios/fire/Small_fire_in_forest_202605161615.jpeg', fire: true, temp: 32, wind: 15, hum: 25 },
        { image: 'assets/demo-scenarios/fire/Small_fire_in_forest_202605161619.jpeg', fire: true, temp: 34, wind: 12, hum: 28 },
        { image: 'assets/demo-scenarios/fire/Fire_beginning_in_forest_202605161703.jpeg', fire: true, temp: 37, wind: 20, hum: 18 },
        { image: 'assets/demo-scenarios/fire/Fire_beginning_in_forest_202605161705.jpeg', fire: true, temp: 39, wind: 25, hum: 14 }
    ];

    const normalPresets = [
        { image: 'assets/demo-scenarios/normal/Fog_in_dense_forest_202605161620.jpeg', fire: false, temp: 18, wind: 8, hum: 90 },
        { image: 'assets/demo-scenarios/normal/Fog_in_dense_forest_city_202605161648.jpeg', fire: false, temp: 19, wind: 5, hum: 85 },
        { image: 'assets/demo-scenarios/normal/image_vu_distance_foret_montagne_202605161658.jpeg', fire: false, temp: 24, wind: 12, hum: 45 },
        { image: 'assets/demo-scenarios/normal/Image_vu_distance_milieu_foret_202605161703.jpeg', fire: false, temp: 21, wind: 15, hum: 50 },
        { image: 'assets/demo-scenarios/normal/Small_town_in_forest_night_202605161618.jpeg', fire: false, temp: 15, wind: 7, hum: 60 },
        { image: 'assets/demo-scenarios/normal/Fog_in_dense_forest_202605161619.jpeg', fire: false, temp: 17, wind: 6, hum: 88 }
    ];

    // Shuffle helper
    const shuffle = (arr) => arr.sort(() => 0.5 - Math.random());
    
    const selectedFires = shuffle([...firePresets]).slice(0, 3);
    const selectedNormals = shuffle([...normalPresets]).slice(0, 3);
    
    // Combine and shuffle the 6 total options
    const combined = shuffle([...selectedFires, ...selectedNormals]);

    combined.forEach((preset, idx) => {
        const cell = document.createElement('div');
        cell.className = 'demo-cell';
        cell.dataset.id = idx;
        
        // Match the user object format exactly
        const finalPresetObj = { id: idx, image: preset.image, fire: preset.fire, temp: preset.temp, wind: preset.wind, hum: preset.hum };

        cell.innerHTML = `
            <img src="${finalPresetObj.image}" alt="Scenario ${idx}">
            <div class="demo-cell-info">
                <span>🌬️ ${finalPresetObj.wind}</span>
                <span>🌡️ ${finalPresetObj.temp}°</span>
                <span>💧 ${finalPresetObj.hum}%</span>
            </div>
            ${finalPresetObj.fire ? '<div class="demo-fire-tag">🔥</div>' : ''}
        `;

        cell.addEventListener('click', () => {
            document.querySelectorAll('.demo-cell').forEach(c => c.classList.remove('selected'));
            cell.classList.add('selected');
            window.DemoState.selectedPreset = finalPresetObj;
        });

        grid.appendChild(cell);
    });
};

/**
 * Handle Demo Data Sending
 */
function handleDemoSend() {
    const activeTab = document.querySelector('.demo-tab-content.active')?.id || 'tab-demo-presets';
    let finalImageSrc = null;
    let finalSensors = null;
    let isFire = false;

    if (activeTab === 'tab-demo-presets') {
        if (!window.DemoState.selectedPreset) {
            alert('Please select a scenario from the grid.');
            return;
        }
        finalImageSrc = window.DemoState.selectedPreset.image;
        isFire = window.DemoState.selectedPreset.fire;
        finalSensors = {
            windSpeed: window.DemoState.selectedPreset.wind,
            temperature: window.DemoState.selectedPreset.temp,
            humidity: window.DemoState.selectedPreset.hum,
            windDir: 'NW', tempTrend: 'stable', humTrend: 'stable',
            airQuality: isFire ? 'Poor' : 'Excellent',
            aqi: isFire ? 145 : 32,
            battery: 98, signalStrength: 'Excellent'
        };
    } else {
        if (!window.DemoState.manualImageURL) {
            alert('Please upload an image first.');
            return;
        }
        finalImageSrc = window.DemoState.manualImageURL;
        finalSensors = {
            windSpeed: parseInt(document.getElementById('demo-slider-wind').value),
            temperature: parseInt(document.getElementById('demo-slider-temp').value),
            humidity: parseInt(document.getElementById('demo-slider-hum').value),
            windDir: 'NE', tempTrend: 'stable', humTrend: 'stable',
            airQuality: 'Unknown', aqi: 50,
            battery: 100, signalStrength: 'Good'
        };
        isFire = (finalSensors.temperature > 35 && finalSensors.humidity < 25);
    }

    const camImage = document.getElementById('cam-image');
    const camPlaceholder = document.getElementById('cam-placeholder');
    const camInfoBar = document.getElementById('cam-info-bar');
    const camOverlay = document.getElementById('cam-detection-badge');

    if (camImage && finalImageSrc) {
        camImage.src = finalImageSrc;
        camImage.style.display = 'block';
        if (camPlaceholder) camPlaceholder.style.display = 'none';
        if (camInfoBar) camInfoBar.style.display = 'flex';
        if (camOverlay) camOverlay.style.display = isFire ? 'block' : 'none';

        if (window.Simulation) {
            window.Simulation.isPaused = true;
            window.Simulation.currentSensorData = finalSensors;
            UIManager.updateSensors(finalSensors);
            
            const score = ScoringEngine.calculate({
                visionScore: isFire ? 90 : 5,
                windSpeed: finalSensors.windSpeed,
                temperature: finalSensors.temperature,
                humidity: finalSensors.humidity
            });
            UIManager.updateRiskDisplay(score);
        }
    }

    const modal = document.getElementById('demo-modal');
    if (modal) modal.style.display = 'none';

    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    UIManager.addLogEntry(now, '🧪 Demo Mode Activated', 'Manual', `Scenario ${isFire ? 'FIRE' : 'NORMAL'} applied`);

    // Automatically trigger Gemma AI analysis instantly!
    setTimeout(() => {
        handleAnalyze();
    }, 150);
}

/**
 * Mapping for specific station data
 */
window.StationDataMap = {
    'A1': { image: 'assets/Reseau Antenne/antenne_1.jpeg', wind: 12, temp: 24, hum: 45, windDir: 'N' },
    'A2': { image: 'assets/Reseau Antenne/antenne_2.jpeg', wind: 15, temp: 26, hum: 40, windDir: 'NE' },
    'A3': { image: 'assets/Reseau Antenne/antenne_3.jpeg', wind: 18, temp: 28, hum: 35, windDir: 'NW' },
    'A4': { image: 'assets/Reseau Antenne/antenne_4.jpeg', wind: 10, temp: 25, hum: 42, windDir: 'N' },
    'B1': { image: 'assets/Reseau Antenne/antenne_5.jpeg', wind: 14, temp: 27, hum: 38, windDir: 'W' },
    'B2': { image: 'assets/Reseau Antenne/antenne_6.jpeg', wind: 12, temp: 24, hum: 45, windDir: 'S' },
    'B3': { image: 'assets/Reseau Antenne/antenne_7.jpeg', wind: 15, temp: 26, hum: 40, windDir: 'SE' },
    'B4': { image: 'assets/Reseau Antenne/antenne_8.jpeg', wind: 18, temp: 28, hum: 35, windDir: 'E' },
    'C1': { image: 'assets/Reseau Antenne/antenne_9.jpeg', wind: 10, temp: 25, hum: 42, windDir: 'SW' },
    'C2': { image: 'assets/Reseau Antenne/antenne_10.jpeg', wind: 14, temp: 27, hum: 38, windDir: 'S' },
    'C3': { image: 'assets/Reseau Antenne/antenne_11.jpeg', wind: 12, temp: 24, hum: 45, windDir: 'S' },
    'C4': { image: 'assets/Reseau Antenne/antenne_12.jpeg', wind: 15, temp: 26, hum: 40, windDir: 'SE' }
};

/**
 * Handle clicking on a station
 */
window.handleStationClick = function(stationId) {
    console.log(`📡 Station Selected: ${stationId}`);
    window.AppState.selectedStation = stationId;
    
    const camSelect = document.getElementById('cam-station-select');
    if (camSelect) camSelect.value = stationId;
    
    const label = document.getElementById('cam-station-label');
    if (label) label.textContent = `Station ${stationId} — Sector ${getSectorName(stationId)}`;
    
    const sensorLabel = document.getElementById('sensor-station');
    if (sensorLabel) sensorLabel.textContent = `Station ${stationId}`;
    
    const riskSector = document.getElementById('risk-sector');
    if (riskSector) riskSector.textContent = `SECTOR ${stationId}`;

    const camImage = document.getElementById('cam-image');
    const camPlaceholder = document.getElementById('cam-placeholder');
    const camInfoBar = document.getElementById('cam-info-bar');
    
    const data = window.StationDataMap[stationId];
    if (camImage && data) {
        camImage.src = data.image;
        camImage.style.display = 'block';
        if (camPlaceholder) camPlaceholder.style.display = 'none';
        if (camInfoBar) camInfoBar.style.display = 'flex';
        UIManager.setCamFireDetection(window.AppState.fireDetected && window.AppState.fireStation === stationId);
    }

    if (data && window.Simulation) {
        window.Simulation.isPaused = true;
        const sensorData = {
            windSpeed: data.wind, windDir: data.windDir, temperature: data.temp, humidity: data.hum,
            aqi: 42, airQuality: 'Good', battery: 95, signalStrength: 'Excellent', tempTrend: 'stable', humTrend: 'stable'
        };
        window.Simulation.currentSensorData = sensorData;
        UIManager.updateSensors(sensorData);
        
        const riskResult = ScoringEngine.calculate({
            visionScore: 5, windSpeed: sensorData.windSpeed, temperature: sensorData.temperature, humidity: sensorData.humidity, aiConfidence: 0
        });
        UIManager.updateRiskDisplay(riskResult);
        UIManager.updateRiskBars(sensorData, 0);

        UIManager.addLogEntry(
            new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            '📡 Station Data Received', `Station ${stationId}`, `Image and weather parameters updated`, 'info'
        );
    }
    
    if (typeof MapManager !== 'undefined') MapManager.focusStation(stationId);

    // Automatically trigger Gemma AI analysis instantly!
    setTimeout(() => {
        handleAnalyze();
    }, 150);
};

// === LAUNCH ===
document.addEventListener('DOMContentLoaded', initApp);
