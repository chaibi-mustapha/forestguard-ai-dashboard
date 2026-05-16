/* ============================================
   Simulation Engine — Sensor Data & Fire Events
   ============================================ */
window.Simulation = {
    intervalId: null,
    sensorUpdateId: null,
    fireTimerId: null,
    currentSensorData: {},
    isPaused: false,

    // Network station status
    networkStations: [
        { id: 'A1', status: 'online' }, { id: 'A2', status: 'online' },
        { id: 'A3', status: 'online' }, { id: 'A4', status: 'online' },
        { id: 'B1', status: 'online' }, { id: 'B2', status: 'online' },
        { id: 'B3', status: 'online' }, { id: 'B4', status: 'online' },
        { id: 'C1', status: 'online' }, { id: 'C2', status: 'online' },
        { id: 'C3', status: 'online' }, { id: 'C4', status: 'online' },
    ],

    /**
     * Generate realistic sensor data
     */
    generateSensorData(fireMode = false) {
        const windDirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        const baseWind = fireMode ? 18 + Math.random() * 15 : 5 + Math.random() * 15;
        const baseTemp = fireMode ? 32 + Math.random() * 8 : 18 + Math.random() * 12;
        const baseHum = fireMode ? 15 + Math.random() * 15 : 35 + Math.random() * 35;

        this.currentSensorData = {
            windSpeed: Math.round(baseWind),
            windDir: windDirs[Math.floor(Math.random() * windDirs.length)],
            temperature: Math.round(baseTemp),
            humidity: Math.round(baseHum),
            aqi: fireMode ? 120 + Math.floor(Math.random() * 80) : 20 + Math.floor(Math.random() * 40),
            airQuality: fireMode ? 'Poor' : 'Good',
            battery: 75 + Math.floor(Math.random() * 20),
            signalStrength: 'Excellent',
            tempTrend: fireMode ? '📈 +4°C/h' : '📈 +1°C/h',
            humTrend: fireMode ? '📉 -8%/h' : '📉 -2%/h'
        };

        return this.currentSensorData;
    },

    /**
     * Start sensor simulation loop
     */
    startSensorLoop() {
        // Initial data
        const data = this.generateSensorData(window.AppState?.fireDetected);
        UIManager.updateSensors(data);
        UIManager.updateRiskBars(data, 0);

        // Update sensors every 4 seconds
        this.sensorUpdateId = setInterval(() => {
            // BLOCK AUTO UPDATE IF PAUSED
            if (this.isPaused) return;

            const fireMode = window.AppState?.fireDetected || false;
            const data = this.generateSensorData(fireMode);
            UIManager.updateSensors(data);

            // Calculate danger score
            const result = ScoringEngine.calculate({
                visionScore: fireMode ? 85 + Math.random() * 15 : Math.random() * 10,
                windSpeed: data.windSpeed,
                temperature: data.temperature,
                humidity: data.humidity,
                aiConfidence: fireMode ? 80 + Math.random() * 15 : 0
            });

            UIManager.updateRiskDisplay(result);
            UIManager.updateRiskBars(data, fireMode ? Math.round(85 + Math.random() * 10) : 0);
        }, 4000);
    },

    /**
     * Schedule a fire event after delay
     */
    scheduleFireEvent(delayMs = 15000) {
        this.fireTimerId = setTimeout(() => {
            this.triggerFireEvent('A3');
        }, delayMs);
    },

    /**
     * Trigger a fire detection event
     */
    triggerFireEvent(stationId) {
        window.AppState = window.AppState || {};
        window.AppState.fireDetected = true;
        window.AppState.fireStation = stationId;

        const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        // Update network
        const stationNet = this.networkStations.find(s => s.id === stationId);
        if (stationNet) stationNet.status = 'alert';
        UIManager.buildNetworkGrid(this.networkStations);

        // Show fire on map
        MapManager.showFireAlert(stationId, 600);

        // Camera shows fire
        UIManager.setCamFireDetection(true);

        // Alert banner
        UIManager.showAlertBanner(`⚠️ FIRE DETECTED — Sector ${stationId} — Lat ${MapManager.stations.find(s => s.id === stationId)?.lat.toFixed(3)} — Immediate Action Required`);

        // Alert status panel
        UIManager.setAlertStatus(
            'danger',
            '🔥 FIRE ALERT!',
            `Fire detected in Sector ${stationId}. Smoke and flames visible.`,
            true
        );

        // Alert mode (red glow)
        UIManager.setAlertMode(true);

        // Event log entries
        UIManager.addLogEntry(now, '🔥 Fire Detected', `Sector ${stationId}`, 'Smoke and flames spotted', 'fire');

        setTimeout(() => {
            const t2 = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            UIManager.addLogEntry(t2, '🚨 Alert Triggered', `Sector ${stationId}`, 'Emergency alarm activated', 'fire');
        }, 2000);

        setTimeout(() => {
            const t3 = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            UIManager.addLogEntry(t3, '📊 Propagation Analyzed', `Sector ${stationId}`, 'Estimated spread: ~2.8 ha', 'warning');
        }, 5000);

        // Update sensor data to fire mode
        const data = this.generateSensorData(true);
        UIManager.updateSensors(data);

        // Calculate new danger score
        const result = ScoringEngine.calculate({
            visionScore: 90,
            windSpeed: data.windSpeed,
            temperature: data.temperature,
            humidity: data.humidity,
            aiConfidence: 88
        });
        UIManager.updateRiskDisplay(result);
        UIManager.updateRiskBars(data, 88);
    },

    /**
     * Clear fire event (return to normal)
     */
    clearFireEvent() {
        window.AppState = window.AppState || {};
        window.AppState.fireDetected = false;
        window.AppState.fireStation = null;

        // Reset network
        this.networkStations.forEach(s => s.status = 'online');
        UIManager.buildNetworkGrid(this.networkStations);

        // Clear map
        MapManager.clearFireAlert();

        // Camera normal
        UIManager.setCamFireDetection(false);

        // Hide alert
        UIManager.hideAlertBanner();
        UIManager.setAlertStatus('safe', 'NO ALERT', 'All stations operating normally.', false);
        UIManager.setAlertMode(false);

        // Log
        const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        UIManager.addLogEntry(now, '✅ Alert Lifted', 'Global', 'Return to normal', 'info');

        // Reset sensors
        const data = this.generateSensorData(false);
        UIManager.updateSensors(data);
        const result = ScoringEngine.calculate({
            visionScore: 5,
            windSpeed: data.windSpeed,
            temperature: data.temperature,
            humidity: data.humidity,
            aiConfidence: 0
        });
        UIManager.updateRiskDisplay(result);
        UIManager.updateRiskBars(data, 0);
    },

    /**
     * Start the full simulation loop
     */
    start() {
        // Build network grid
        UIManager.buildNetworkGrid(this.networkStations);

        // Start sensor updates
        this.startSensorLoop();

        // Initial safe scoring
        const initData = this.currentSensorData;
        const initResult = ScoringEngine.calculate({
            visionScore: 5,
            windSpeed: initData.windSpeed || 10,
            temperature: initData.temperature || 22,
            humidity: initData.humidity || 50,
            aiConfidence: 0
        });
        UIManager.updateRiskDisplay(initResult);

        // Schedule auto-clear after 40s
        setTimeout(() => {
            if (window.AppState?.fireDetected) {
                this.clearFireEvent();
                // Reschedule another fire in 30s
                this.scheduleFireEvent(30000);
            }
        }, 45000);
    },

    /**
     * Stop simulation
     */
    stop() {
        clearInterval(this.sensorUpdateId);
        clearTimeout(this.fireTimerId);
    }
};
