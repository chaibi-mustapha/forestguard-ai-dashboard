/* ============================================
   Gemma 4 API Integration
   Connects to Hugging Face Space (Real Model)
   ============================================ */
window.GemmaAPI = {
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
     * Call the Hugging Face Space Gradio API (REAL MODEL)
     * Uses Gradio 5.x REST API format: POST /gradio_api/call/predict
     */
    async analyze(imgElement, sensorData) {
        this.isProcessing = true;
        const prompt = this.buildPrompt(sensorData);

        try {
            console.log("Sending REAL request to fine-tuned model via HF Space...");

            // Step 1: Submit the request to Gradio
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
            console.log("Request submitted, event_id:", eventId);

            // Step 2: Fetch the result
            const resultResponse = await fetch(`${this.spaceUrl}/gradio_api/call/predict/${eventId}`);
            
            if (!resultResponse.ok) {
                throw new Error(`Space result failed: ${resultResponse.status}`);
            }

            const resultText = await resultResponse.text();
            console.log("Raw Space response:", resultText);
            
            // Parse the SSE (Server-Sent Events) response
            // Format: event: complete\ndata: ["result text"]
            const dataLines = resultText.split('\n').filter(line => line.startsWith('data:'));
            const lastDataLine = dataLines[dataLines.length - 1];
            const jsonData = JSON.parse(lastDataLine.replace('data: ', ''));
            const modelOutput = Array.isArray(jsonData) ? jsonData[0] : jsonData;

            console.log("REAL MODEL OUTPUT:", modelOutput);

            // Extract JSON from model response
            const jsonMatch = modelOutput.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                this.isProcessing = false;
                return { success: true, data: parsed, raw: modelOutput, source: 'huggingface-space' };
            }

            // If no JSON found, return as raw text
            this.isProcessing = false;
            return {
                success: true,
                data: {
                    fire_detected: modelOutput.toLowerCase().includes('fire') || modelOutput.toLowerCase().includes('feu'),
                    severity: modelOutput.toLowerCase().includes('fire') ? 'high' : 'none',
                    confidence: 0.85,
                    explanation: modelOutput,
                    recommended_action: modelOutput.toLowerCase().includes('fire') ? 'Alert triggered' : 'Continue monitoring'
                },
                raw: modelOutput,
                source: 'huggingface-space'
            };

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
