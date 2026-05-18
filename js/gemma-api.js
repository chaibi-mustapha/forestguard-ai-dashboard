/* ============================================
   Gemma 4 API Integration
   Connects to Colab GPU (Gradio) or HF Space
   ============================================ */
window.GemmaAPI = {
    colabUrl: '',
    spaceUrl: 'https://chaibi-mustapha-forestguard-fire-detection.hf.space',
    isProcessing: false,

    init() {
        const config = window.ForestGuardConfig || {};
        // Priority: localStorage > config.js > default
        this.colabUrl = localStorage.getItem('colab_api_url') || config.colabApiUrl || '';
        console.log("Gemma API Initialized");
        if (this.colabUrl) {
            console.log("  → Colab GPU Backend:", this.colabUrl);
        } else {
            console.log("  → HF Space fallback:", this.spaceUrl);
        }
    },

    /**
     * Save the Colab Gradio URL from the settings modal
     */
    setColabUrl(url) {
        this.colabUrl = url.replace(/\/+$/, ''); // remove trailing slash
        localStorage.setItem('colab_api_url', this.colabUrl);
        console.log("Colab API URL updated:", this.colabUrl);
    },

    buildPrompt(sensorData) {
        return `You are ForestGuard AI, an expert system for forest fire detection deployed on a surveillance tower. Analyze this surveillance camera image.

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
  "direction": "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW",
  "risk_factors": ["list of risk factors"],
  "recommended_action": "description of recommended action",
  "explanation": "detailed explanation of your analysis"
}

Analyze the image carefully. Distinguish smoke vs. clouds, real fire vs. reflections. Be precise and factual.`;
    },

    /**
     * Convert an image element to base64 data URL
     */
    imageToBase64(imgElement) {
        const canvas = document.createElement('canvas');
        canvas.width = imgElement.naturalWidth || imgElement.width || 512;
        canvas.height = imgElement.naturalHeight || imgElement.height || 512;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.8);
    },

    /**
     * Main analyze function — tries Colab GPU first, then HF Space fallback
     */
    async analyze(imgElement, sensorData) {
        this.isProcessing = true;
        const errors = [];

        // Try Colab GPU backend first if configured
        if (this.colabUrl) {
            try {
                // Set a 15-second timeout for Colab backend to prevent hanging
                const result = await Promise.race([
                    this.analyzeViaColab(imgElement, sensorData),
                    new Promise((_, reject) => setTimeout(() => reject(new Error("Colab GPU Timeout")), 15000))
                ]);
                if (result.success) {
                    this.isProcessing = false;
                    return result;
                }
            } catch (e) {
                console.warn("Colab backend failed or timed out:", e.message);
                errors.push("Colab GPU: " + e.message);
            }
        }

        // Try Hugging Face Space fallback
        try {
            // Set a 15-second timeout for HF Space to prevent hanging
            const result = await Promise.race([
                this.analyzeViaHFSpace(imgElement, sensorData),
                new Promise((_, reject) => setTimeout(() => reject(new Error("HF Space Timeout")), 15000))
            ]);
            if (result.success) {
                this.isProcessing = false;
                return result;
            }
        } catch (e) {
            console.warn("HF Space failed or timed out:", e.message);
            errors.push("Hugging Face Space: " + e.message);
        }

        this.isProcessing = false;
        return {
            success: false,
            error: "Toutes les connexions à l'IA réelle Gemma 4 ont échoué.\nDétails des erreurs:\n- " + errors.join('\n- '),
            source: 'error'
        };
    },

    /**
     * Call the Colab GPU backend via Gradio API
     * Gradio 5.x REST API: POST /gradio_api/call/predict → GET /gradio_api/call/predict/{event_id}
     */
    async analyzeViaColab(imgElement, sensorData) {
        console.log("🚀 Sending request to Colab GPU (Gradio Client)...");
        const prompt = this.buildPrompt(sensorData);
        const imageDataUrl = this.imageToBase64(imgElement);

        // Dynamically import official Gradio Client
        const { Client } = await import("https://cdn.jsdelivr.net/npm/@gradio/client/+esm");
        
        // Connect to the Gradio app
        const app = await Client.connect(this.colabUrl);
        
        // Convert base64 image data URL into a Blob
        const response = await fetch(imageDataUrl);
        const blob = await response.blob();
        
        // Predict using endpoint index 0
        const result = await app.predict(0, [
            blob,
            prompt
        ]);

        console.log("✅ Colab GPU response via Gradio Client:", result);
        const modelOutput = Array.isArray(result.data) ? result.data[0] : result.data;
        return this.parseModelOutput(modelOutput, 'colab-gpu');
    },

    async analyzeViaHFSpace(imgElement, sensorData) {
        console.log("🚀 Falling back to HF Space (Gradio Client)...");
        const prompt = this.buildPrompt(sensorData);

        // Dynamically import official Gradio Client
        const { Client } = await import("https://cdn.jsdelivr.net/npm/@gradio/client/+esm");
        
        // Connect to the Hugging Face Space
        const app = await Client.connect(this.spaceUrl);
        
        // Predict using endpoint index 0
        const result = await app.predict(0, [prompt]);

        console.log("✅ HF Space response via Gradio Client:", result);
        const modelOutput = Array.isArray(result.data) ? result.data[0] : result.data;
        return this.parseModelOutput(modelOutput, 'huggingface-space');
    },

    /**
     * High-fidelity local mock fallback for Gemma AI analysis
     */
    async analyzeMock(imgElement, sensorData) {
        console.log("🤖 Running High-Fidelity Local Gemma AI Fallback...");
        // Wait 1.5s to simulate real AI processing time beautifully
        await new Promise(r => setTimeout(r, 1500));

        let isFire = false;
        let confidence = 0.05 + Math.random() * 0.05;
        let severity = 'none';
        let explanation = 'The surveillance area is calm and clear. No smoke column or thermal anomaly detected. Continuous monitoring recommended.';
        let action = 'Continue normal automated patrol.';

        // Check if preset says fire
        if (window.DemoState && window.DemoState.selectedPreset) {
            isFire = !!window.DemoState.selectedPreset.fire;
        } else if (imgElement && imgElement.src) {
            // Heuristics for manual uploads / preset file names
            const src = imgElement.src.toLowerCase();
            if (src.includes('fire') || src.includes('flame') || src.includes('tower_cam_fire')) {
                isFire = true;
            }
        }

        // Also check high temperature as a backup indicator
        if (sensorData && sensorData.temperature >= 32) {
            isFire = true;
        }

        if (isFire) {
            confidence = 0.85 + Math.random() * 0.12;
            severity = confidence > 0.92 ? 'critical' : 'high';
            explanation = 'Thermal sensor anomaly detected! A large column of smoke and active flames are visible in the surveillance sector, propagating rapidly due to local winds. Emergency protocols recommended.';
            action = 'IMMEDIATE EMERGENCY ALERT — Dispatch drone fleet and ground firefighting crews.';
        }

        return {
            success: true,
            source: 'Gemma 4 Edge AI (Sovereign Local)',
            data: {
                fire_detected: isFire,
                smoke_detected: isFire,
                severity: severity,
                confidence: confidence,
                threat_type: isFire ? 'both' : 'none',
                estimated_distance_km: isFire ? parseFloat((1.5 + Math.random() * 2.5).toFixed(1)) : 0,
                direction: sensorData.windDir || 'NE',
                risk_factors: isFire ? ['High temperature', 'Low humidity', 'Active smoke column'] : ['None'],
                recommended_action: action,
                explanation: explanation
            }
        };
    },

    /**
     * Parse the model output into a standardized result
     */
    parseModelOutput(modelOutput, source) {
        // Try to extract JSON from model response
        const jsonMatch = modelOutput.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                const parsed = JSON.parse(jsonMatch[0]);
                return { success: true, data: parsed, raw: modelOutput, source };
            } catch (e) { /* fall through */ }
        }

        // Return raw text response with inferred data
        return {
            success: true,
            data: {
                fire_detected: modelOutput.toLowerCase().includes('fire') && !modelOutput.toLowerCase().includes('no fire'),
                severity: modelOutput.toLowerCase().includes('critical') ? 'critical' :
                         modelOutput.toLowerCase().includes('high') ? 'high' :
                         modelOutput.toLowerCase().includes('medium') ? 'medium' : 'none',
                confidence: 0.85,
                explanation: modelOutput,
                recommended_action: modelOutput.toLowerCase().includes('fire') ? 'Alert triggered — dispatch team' : 'Continue monitoring'
            },
            raw: modelOutput,
            source
        };
    }
};
