/* ============================================
   Network Bridge — Handling External Station Data
   Mimics a real-time receiver (WebSocket/Firebase)
   ============================================ */

const NetworkBridge = {
    isExternalMode: false,
    
    /**
     * Initialize the bridge
     */
    init() {
        console.log('📡 Network Bridge — Initialized (Ready for external data)');
        
        // Expose a global receiver function for the "stations" to call
        // In a real app, this would be a WebSocket message handler or a Firebase listener
        window.receiveStationData = (payload) => {
            this.handleIncomingData(payload);
        };
    },

    /**
     * Enable/Disable external mode
     */
    setMode(external) {
        this.isExternalMode = external;
        if (external) {
            Simulation.stop(); // Stop the local random generator
            UIManager.addLogEntry(
                new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                '📡 External Data Mode',
                'Global',
                'Waiting for station reports...',
                'info'
            );
        } else {
            Simulation.start();
        }
    },

    /**
     * Handle data coming from a "station"
     * PROCESSING CHAIN:
     * 1. Station Pre-detection (Light AI)
     * 2. Automatic call to Gemma 4 (Advanced AI)
     * 3. Result displayed on Dashboard
     */
    async handleIncomingData(payload) {
        if (!payload || !payload.stationId) return;

        const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        
        // --- STEP 1: PRE-DETECTION LOG ---
        const isPreDetected = payload.preDetection || (payload.sensors && payload.sensors.temperature > 40);
        
        UIManager.addLogEntry(
            now, 
            isPreDetected ? '🔍 Pre-detection (Light AI)' : '📡 Routine Report', 
            `Station ${payload.stationId}`, 
            isPreDetected ? 'Anomaly detected, sending to Gemma 4...' : 'Everything is normal',
            isPreDetected ? 'warning' : 'info'
        );

        // Update basic sensor UI first
        if (payload.sensors) {
            UIManager.updateSensors(payload.sensors);
        }

        // --- STEP 2: IF PRE-DETECTION -> CALL GEMMA 4 ---
        if (isPreDetected) {
            UIManager.showGemmaLoading();
            
            // We use the image from the station (simulated here by the current cam image or a payload URL)
            const imgElement = document.getElementById('cam-image');
            
            try {
                const response = await GemmaAPI.analyze(imgElement, payload.sensors);
                
                // --- STEP 3: DISPLAY FINAL RESULT ---
                UIManager.displayGemmaResult(response);
                
                if (response.success && response.data) {
                    const confidence = (response.data.confidence || 0) * 100;
                    
                    const riskResult = ScoringEngine.calculate({
                        visionScore: response.data.fire_detected ? 85 : 5,
                        windSpeed: payload.sensors.windSpeed,
                        temperature: payload.sensors.temperature,
                        humidity: payload.sensors.humidity,
                        aiConfidence: confidence
                    });

                    UIManager.updateRiskDisplay(riskResult);
                    UIManager.updateRiskBars(payload.sensors, Math.round(confidence));

                    if (response.data.fire_detected) {
                        Simulation.triggerFireEvent(payload.stationId);
                    }
                }
            } catch (err) {
                console.error('Error in processing chain:', err);
            }
        } else {
            // Normal update without AI analysis
            const risk = ScoringEngine.calculate({
                visionScore: 5,
                windSpeed: payload.sensors.windSpeed,
                temperature: payload.sensors.temperature,
                humidity: payload.sensors.humidity,
                aiConfidence: 0
            });
            UIManager.updateRiskDisplay(risk);
            UIManager.updateRiskBars(payload.sensors, 0);
        }
    },

    /**
     * Triggered when a station sends a fire signal
     */
    triggerEmergencyProtocol(payload) {
        console.warn('🔥 EMERGENCY SIGNAL RECEIVED FROM STATION', payload.stationId);
        
        // Force simulation to enter fire mode for this station
        Simulation.triggerFireEvent(payload.stationId);
        
        UIManager.addLogEntry(
            new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            '🚨 EXTERNAL ALERT',
            `Sector ${payload.stationId}`,
            'Critical detection signal received via radio',
            'fire'
        );
    },

    /**
     * Simulation helper: Send a fake external report from console
     * Example: NetworkBridge.mockIncomingReport('A3', 42, true)
     */
    mockIncomingReport(stationId, temp = 25, preDetection = false) {
        const mockPayload = {
            stationId: stationId,
            preDetection: preDetection,
            sensors: {
                windSpeed: 12,
                windDir: 'NE',
                temperature: temp,
                humidity: 30,
                aqi: 45,
                airQuality: 'Good',
                battery: 92,
                signalStrength: 'Excellent',
                tempTrend: '📈 +1°C/h',
                humTrend: '📉 -2%/h'
            }
        };
        
        window.receiveStationData(mockPayload);
    }
};
