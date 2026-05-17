/* ============================================
   Gemma 4 API Integration
   Connects to Colab GPU Backend or HF Space
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
     * Save the Colab URL from the settings modal
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
     * Convert an image element to base64
     */
    imageToBase64(imgElement) {
        const canvas = document.createElement('canvas');
        canvas.width = imgElement.naturalWidth || imgElement.width || 512;
        canvas.height = imgElement.naturalHeight || imgElement.height || 512;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
        // Return only the base64 data (no prefix)
        return canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
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
     * Call the Colab GPU backend (Flask + ngrok)
     * Sends base64 image + prompt → gets instant AI response
     */
    async analyzeViaColab(imgElement, sensorData) {
        console.log("🚀 Sending request to Colab GPU backend...");
        const prompt = this.buildPrompt(sensorData);
        const imageBase64 = this.imageToBase64(imgElement);

        const response = await fetch(`${this.colabUrl}/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                image: imageBase64,
                prompt: prompt,
                sensorData: {
                    temperature: sensorData.temperature,
                    humidity: sensorData.humidity,
                    windSpeed: sensorData.windSpeed,
                    windDirection: sensorData.windDir
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Colab API error: ${response.status}`);
        }

        const result = await response.json();
        console.log("✅ Colab GPU response:", result);

        if (!result.success) {
            throw new Error(result.error || 'Unknown Colab error');
        }

        // Try to parse JSON from model output
        const modelOutput = result.response;
        const jsonMatch = modelOutput.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                const parsed = JSON.parse(jsonMatch[0]);
                return { success: true, data: parsed, raw: modelOutput, source: 'colab-gpu' };
            } catch (e) { /* fall through to raw response */ }
        }

        // Return raw text response
        return {
            success: true,
            data: {
                fire_detected: modelOutput.toLowerCase().includes('fire'),
                severity: modelOutput.toLowerCase().includes('fire') ? 'high' : 'none',
                confidence: 0.90,
                explanation: modelOutput,
                recommended_action: modelOutput.toLowerCase().includes('fire') ? 'Alert triggered' : 'Continue monitoring'
            },
            raw: modelOutput,
            source: 'colab-gpu'
        };
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

        const jsonMatch = modelOutput.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return { success: true, data: parsed, raw: modelOutput, source: 'huggingface-space' };
        }

        return {
            success: true,
            data: {
                fire_detected: modelOutput.toLowerCase().includes('fire'),
                severity: modelOutput.toLowerCase().includes('fire') ? 'high' : 'none',
                confidence: 0.85,
                explanation: modelOutput,
                recommended_action: modelOutput.toLowerCase().includes('fire') ? 'Alert triggered' : 'Continue monitoring'
            },
            raw: modelOutput,
            source: 'huggingface-space'
        };
    }
};
