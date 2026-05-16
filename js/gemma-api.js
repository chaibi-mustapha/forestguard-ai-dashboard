/* ============================================
   Gemma 4 API Integration
   Direct Connection to Hugging Face
   ============================================ */
window.GemmaAPI = {
    hfToken: null,
    hfModelId: 'chaibi-mustapha/gemma-2-2b-fire-detection',
    isProcessing: false,

    init() {
        const config = window.ForestGuardConfig || {};
        this.hfToken = localStorage.getItem('hf_token') || config.hfToken || null;
        this.hfModelId = localStorage.getItem('hf_model_id') || config.hfModelId || 'chaibi-mustapha/gemma-2-2b-fire-detection';
        console.log("Gemma API Initialized with Model:", this.hfModelId);
    },

    buildPrompt(sensorData) {
        return `Analyze this forest surveillance data and image. 
Context: Temp ${sensorData.temperature}°C, Humidity ${sensorData.humidity}%, Wind ${sensorData.windSpeed}km/h.
Is there a fire or smoke? Respond in JSON format:
{
  "fire_detected": boolean,
  "severity": "none"|"low"|"medium"|"high"|"critical",
  "confidence": number,
  "explanation": "short explanation",
  "recommended_action": "action"
}`;
    },

    async analyze(imgElement, sensorData) {
        if (!this.hfToken) {
            return { success: false, error: "Hugging Face Token is missing. Please check settings.", source: 'error' };
        }

        this.isProcessing = true;
        const prompt = this.buildPrompt(sensorData);

        try {
            console.log("Attempting REAL API call to:", this.hfModelId);
            
            const response = await fetch(
                `https://api-inference.huggingface.co/models/${this.hfModelId.trim()}`,
                {
                    method: 'POST',
                    headers: { 
                        'Authorization': `Bearer ${this.hfToken.trim()}`,
                        'Content-Type': 'application/json',
                        'x-wait-for-model': 'true'
                    },
                    body: JSON.stringify({
                        inputs: prompt,
                        parameters: { max_new_tokens: 250, temperature: 0.1 }
                    })
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Server returned ${response.status}`);
            }

            const data = await response.json();
            const text = Array.isArray(data) ? data[0].generated_text : (data.generated_text || JSON.stringify(data));
            
            // Extract JSON from response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            const result = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);
            
            this.isProcessing = false;
            return { success: true, data: result, source: 'huggingface' };

        } catch (error) {
            console.error("REAL API CALL FAILED:", error);
            this.isProcessing = false;
            // WE SHOW THE REAL ERROR TO THE USER - NO SIMULATION
            return { 
                success: false, 
                error: `REAL API ERROR: ${error.message}. Ensure your token is valid and model is public.`, 
                source: 'error' 
            };
        }
    }
};
