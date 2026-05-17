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

        // Try Colab GPU backend first (instant response)
        if (this.colabUrl) {
            try {
                const result = await this.analyzeViaColab(imgElement, sensorData);
                if (result.success) {
                    this.isProcessing = false;
                    return result;
                }
            } catch (e) {
                console.warn("Colab backend failed, falling back to HF Space:", e.message);
            }
        }

        // Fallback to HF Space
        try {
            const result = await this.analyzeViaHFSpace(imgElement, sensorData);
            this.isProcessing = false;
            return result;
        } catch (e) {
            console.error("All backends failed:", e);
            this.isProcessing = false;
            return { success: false, error: e.message, source: 'error' };
        }
    },

    /**
     * Call the Colab GPU backend via Gradio API
     * Gradio 5.x REST API: POST /gradio_api/call/predict → GET /gradio_api/call/predict/{event_id}
     */
    async analyzeViaColab(imgElement, sensorData) {
        console.log("🚀 Sending request to Colab GPU (Gradio)...");
        const prompt = this.buildPrompt(sensorData);
        const imageDataUrl = this.imageToBase64(imgElement);

        // Step 1: Submit request to Gradio
        const submitResponse = await fetch(`${this.colabUrl}/gradio_api/call/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                data: [
                    { "path": imageDataUrl, "meta": { "_type": "gradio.FileData" } },
                    prompt
                ]
            })
        });

        if (!submitResponse.ok) {
            // Try alternative Gradio API format (older versions)
            return await this.analyzeViaColabLegacy(imgElement, sensorData);
        }

        const submitResult = await submitResponse.json();
        const eventId = submitResult.event_id;
        console.log("Colab request submitted, event_id:", eventId);

        // Step 2: Fetch the result
        const resultResponse = await fetch(`${this.colabUrl}/gradio_api/call/predict/${eventId}`);
        if (!resultResponse.ok) {
            throw new Error(`Colab result fetch failed: ${resultResponse.status}`);
        }

        const resultText = await resultResponse.text();
        console.log("Raw Colab response:", resultText);

        // Parse the SSE response
        const dataLines = resultText.split('\n').filter(line => line.startsWith('data:'));
        const lastDataLine = dataLines[dataLines.length - 1];
        const jsonData = JSON.parse(lastDataLine.replace('data: ', ''));
        const modelOutput = Array.isArray(jsonData) ? jsonData[0] : jsonData;

        console.log("✅ Colab GPU response:", modelOutput);
        return this.parseModelOutput(modelOutput, 'colab-gpu');
    },

    /**
     * Legacy Gradio API format fallback (for older Gradio versions)
     */
    async analyzeViaColabLegacy(imgElement, sensorData) {
        console.log("Trying legacy Gradio API format...");
        const prompt = this.buildPrompt(sensorData);
        const imageDataUrl = this.imageToBase64(imgElement);

        const response = await fetch(`${this.colabUrl}/api/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                data: [imageDataUrl, prompt]
            })
        });

        if (!response.ok) {
            throw new Error(`Legacy Gradio API failed: ${response.status}`);
        }

        const result = await response.json();
        const modelOutput = Array.isArray(result.data) ? result.data[0] : result.data;
        console.log("✅ Colab GPU (legacy) response:", modelOutput);
        return this.parseModelOutput(modelOutput, 'colab-gpu');
    },

    /**
     * Fallback: Call the Hugging Face Space Gradio API
     */
    async analyzeViaHFSpace(imgElement, sensorData) {
        console.log("Falling back to HF Space...");
        const prompt = this.buildPrompt(sensorData);

        const submitResponse = await fetch(`${this.spaceUrl}/gradio_api/call/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: [prompt] })
        });

        if (!submitResponse.ok) {
            throw new Error(`Space submit failed: ${submitResponse.status}`);
        }

        const submitResult = await submitResponse.json();
        const eventId = submitResult.event_id;

        const resultResponse = await fetch(`${this.spaceUrl}/gradio_api/call/predict/${eventId}`);
        if (!resultResponse.ok) {
            throw new Error(`Space result failed: ${resultResponse.status}`);
        }

        const resultText = await resultResponse.text();
        const dataLines = resultText.split('\n').filter(line => line.startsWith('data:'));
        const lastDataLine = dataLines[dataLines.length - 1];
        const jsonData = JSON.parse(lastDataLine.replace('data: ', ''));
        const modelOutput = Array.isArray(jsonData) ? jsonData[0] : jsonData;

        return this.parseModelOutput(modelOutput, 'huggingface-space');
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
