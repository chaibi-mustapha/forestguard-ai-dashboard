/* ============================================
   Gemma 4 API Integration
   Connects to Hugging Face Space (Real Model)
   ============================================ */
window.GemmaAPI = {
    // Space URL for your fine-tuned model
    spaceUrl: 'https://chaibi-mustapha-forestguard-fire-detection.hf.space',
    isProcessing: false,

    init() {
        console.log("Gemma API Initialized - Connecting to HF Space:", this.spaceUrl);
    },

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
  "direction": "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW",
  "risk_factors": ["list of risk factors"],
  "recommended_action": "description of recommended action",
  "explanation": "detailed explanation of your analysis"
}

Analyze the image carefully. Distinguish smoke vs. clouds, real fire vs. reflections. Be precise and factual.`;
    },

    /**
     * Call the Hugging Face Space API (REAL MODEL - NO SIMULATION)
     */
    async analyze(imgElement, sensorData) {
        this.isProcessing = true;
        const prompt = this.buildPrompt(sensorData);

        try {
            console.log("Sending REAL request to fine-tuned model via HF Space...");
            
            // Call the Gradio API endpoint
            const response = await fetch(`${this.spaceUrl}/api/predict`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: [prompt] })
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Space returned ${response.status}: ${errText}`);
            }

            const result = await response.json();
            const text = result.data[0]; // Gradio returns { data: [output] }
            
            console.log("REAL MODEL RESPONSE:", text);

            // Parse JSON from model response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                this.isProcessing = false;
                return { success: true, data: parsed, raw: text, source: 'huggingface-space' };
            }
            
            throw new Error('Model response is not valid JSON');

        } catch (error) {
            console.error("REAL API CALL FAILED:", error);
            this.isProcessing = false;
            return { 
                success: false, 
                error: `API Error: ${error.message}`, 
                source: 'error' 
            };
        }
    }
};
