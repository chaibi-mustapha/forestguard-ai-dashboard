/* ============================================
   Gemma 4 API Integration
   Uses Google AI Studio / Generative Language API
   ============================================ */
window.GemmaAPI = {
    provider: 'huggingface',
    hfToken: null,
    hfModelId: 'chaibi-mustapha/gemma-2-2b-fire-detection',

    /**
     * Initialize with stored config or defaults
     */
    init() {
        // Fallback to window.ForestGuardConfig if defined
        const config = window.ForestGuardConfig || {};
        
        // Priority: LocalStorage > config.js > Default
        this.hfToken = localStorage.getItem('hf_token') || config.hfToken || null;
        this.hfModelId = localStorage.getItem('hf_model_id') || config.hfModelId || 'chaibi-mustapha/gemma-2-2b-fire-detection';
        
        console.log("Gemma API Initialized with Model:", this.hfModelId);
        this.updateStatus();
    },

    /**
     * Save API config
     */
    saveConfig(config) {
        this.hfToken = config.hfToken;
        this.hfModelId = config.hfModelId || 'Mustapha20/gemma-2-2b-fire-detection';
        localStorage.setItem('hf_token', this.hfToken);
        localStorage.setItem('hf_model_id', this.hfModelId);
        this.updateStatus();
    },

    /**
     * Update the UI status dot
     */
    updateStatus() {
        const dot = document.getElementById('gemma-status');
        if (dot) {
            const hasConfig = this.hfToken && this.hfModelId;
            dot.className = hasConfig ? 'badge-dot active' : 'badge-dot';
        }
    },

    /**
     * Build the wildfire analysis prompt
     */
    buildPrompt(sensorData) {
        return `You are an AI agent specialized in forest fire detection, deployed on a surveillance tower. Analyze the image from the forest surveillance camera.

Real-time sensor context:
- Wind: ${sensorData.windSpeed} km/h direction ${sensorData.windDir}
- Temperature: ${sensorData.temperature}°C
- Humidity: ${sensorData.humidity}%
- Air Quality (AQI): ${sensorData.aqi}

Provide your analysis in this EXACT JSON format:
{
  "fire_detected": true/false,
  "smoke_detected": true/false,
  "severity": "none" | "low" | "medium" | "high" | "critical",
  "confidence": 0.0-1.0,
  "threat_type": "none" | "smoke" | "flames" | "both",
  "estimated_distance_km": number,
  "direction": "N" | "NE" | "E" | "SE" | "S" | "SO" | "O" | "NO",
  "risk_factors": ["list of risk factors"],
  "recommended_action": "description of recommended action",
  "explanation": "detailed explanation of your analysis"
}

Analyze the image carefully. Distinguish smoke vs. clouds, real fire vs. reflections. Be precise and factual.`;
    },

    /**
     * Convert image element to base64
     */
    async imageToBase64(imgElement) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            canvas.width = imgElement.naturalWidth || imgElement.width;
            canvas.height = imgElement.naturalHeight || imgElement.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(imgElement, 0, 0);
            const dataURL = canvas.toDataURL('image/jpeg', 0.8);
            resolve(dataURL.split(',')[1]); // Remove the data:image/jpeg;base64, prefix
        });
    },

    /**
     * Call the Hugging Face API
     */
    async analyze(imgElement, sensorData) {
        if (!this.hfToken) {
            const errorMsg = 'Token Hugging Face manquant dans les paramètres.';
            if (window.UIManager) UIManager.addLogEntry(new Date().toLocaleTimeString(), '❌ Config Manquante', 'Système', errorMsg, 'warning');
            return { success: false, error: errorMsg, source: 'error' };
        }

        this.isProcessing = true;
        
        try {
            return await this.callHuggingFaceAPI(imgElement, sensorData);
        } catch (error) {
            console.error('Hugging Face API call failed:', error);
            this.isProcessing = false;
            
            // Real error notification
            const msg = `API Error: ${error.message}. Check your Token and connection.`;
            if (window.UIManager) {
                UIManager.addLogEntry(new Date().toLocaleTimeString(), '⚠️ HF Connection Failed', 'System', msg, 'warning');
            }
            
            // Show the error instead of simulating
            return { success: false, error: msg, source: 'error' };
        }
    },

    /**
     * Hugging Face Inference API call
     */
    async callHuggingFaceAPI(imgElement, sensorData) {
        const prompt = this.buildPrompt(sensorData);
        
        // 60 SECOND TIMEOUT (to handle model cold starts)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        console.log("Calling HF API:", `https://api-inference.huggingface.co/models/${this.hfModelId}`);
        console.log("Using Token:", this.hfToken ? (this.hfToken.substring(0, 5) + "...") : "MISSING");

        try {
            const response = await fetch(
                `https://api-inference.huggingface.co/models/${this.hfModelId}`,
                {
                    method: 'POST',
                    headers: { 
                        'Authorization': `Bearer ${this.hfToken.trim()}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        inputs: prompt,
                        parameters: { max_new_tokens: 300, temperature: 0.1 }
                    }),
                    signal: controller.signal
                }
            );
            clearTimeout(timeoutId);
            return await this.handleAPIResponse(response, 'huggingface');
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Hugging Face server is taking too long to respond (Timeout).');
            }
            throw error;
        }
    },

    /**
     * Unified response handler
     */
    async handleAPIResponse(response, source) {
        if (!response.ok) {
            const errText = await response.text();
            console.error(`${source} Error:`, errText);
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        let text = '';

        if (source === 'api') {
            text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        } else {
            // HF Inference API usually returns an array or a direct object depending on the model type
            text = Array.isArray(data) ? data[0].generated_text : (data.generated_text || JSON.stringify(data));
        }
        
        try {
            const result = JSON.parse(text);
            this.isProcessing = false;
            return { success: true, data: result, raw: text, source: source };
        } catch (parseErr) {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const result = JSON.parse(jsonMatch[0]);
                this.isProcessing = false;
                return { success: true, data: result, raw: text, source: source };
            }
            throw new Error('Could not parse API response as JSON');
        }
    },

    /**
     * Simulated response for demo purposes (when no API key)
     */
    getSimulatedResponse(sensorData, fireMode = null) {
        // Determine if we're in fire simulation mode
        const isFireScene = fireMode !== null ? fireMode : (window.AppState && window.AppState.fireDetected);
        
        if (isFireScene) {
            return {
                success: true,
                source: 'simulation',
                data: {
                    fire_detected: true,
                    smoke_detected: true,
                    severity: "high",
                    confidence: 0.89 + Math.random() * 0.08,
                    threat_type: "both",
                    estimated_distance_km: 1.5 + Math.random() * 3,
                    direction: "NW",
                    risk_factors: [
                        "Dry vegetation detected",
                        `Wind ${sensorData.windSpeed} km/h accelerating spread`,
                        `Low humidity (${sensorData.humidity}%)`,
                        `High temperature (${sensorData.temperature}°C)`
                    ],
                    recommended_action: "IMMEDIATE ALERT: Active fire with flames and dense smoke detected. Trigger emergency response. Estimated spread direction towards sector B3.",
                    explanation: "Dense smoke plume visible rising above the forest canopy with orange glow at the base indicating active combustion. Wind direction (NW) and dry conditions suggest rapid spread. Danger score: HIGH."
                }
            };
        } else {
            return {
                success: true,
                source: 'simulation',
                data: {
                    fire_detected: false,
                    smoke_detected: false,
                    severity: "none",
                    confidence: 0.92 + Math.random() * 0.06,
                    threat_type: "none",
                    estimated_distance_km: 0,
                    direction: "—",
                    risk_factors: [],
                    recommended_action: "No action required. Continuous monitoring recommended.",
                    explanation: "No visual anomalies detected. The forest canopy appears normal. Stable weather conditions. Observed cloud formations do not match smoke signatures."
                }
            };
        }
    }
};
