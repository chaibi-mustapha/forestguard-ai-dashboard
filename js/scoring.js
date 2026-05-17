/* ============================================
   Scoring Engine — Danger Score Calculator
   ============================================ */
const ScoringEngine = {
    /**
     * Weights for the danger score formula
     * Total = 1.0
     */
    weights: {
        vision: 0.40,      // Fire/smoke detection confidence
        wind: 0.20,         // Wind speed contribution
        temperature: 0.20,  // Temperature contribution
        humidity: 0.10,     // Humidity contribution (inverse)
        aiConfidence: 0.10  // Gemma 4 AI confidence
    },

    /**
     * Calculate normalized wind risk (0-100)
     * Wind > 40 km/h = extreme risk
     */
    calcWindRisk(speedKmh) {
        return Math.min(100, (speedKmh / 50) * 100);
    },

    /**
     * Calculate normalized temperature risk (0-100)
     * Temp > 40°C = extreme risk
     */
    calcTempRisk(tempC) {
        if (tempC < 15) return 5;
        if (tempC < 25) return 20;
        return Math.min(100, ((tempC - 15) / 30) * 100);
    },

    /**
     * Calculate normalized humidity risk (0-100)
     * Low humidity = HIGH risk (inverse)
     */
    calcHumidityRisk(humidityPct) {
        return Math.max(0, 100 - humidityPct);
    },

    /**
     * Calculate the global danger score (0-100)
     * @param {Object} data - Sensor and AI data
     * @returns {Object} - { score, level, color, label }
     */
    calculate(data) {
        const {
            visionScore = 0,
            windSpeed = 0,
            temperature = 20,
            humidity = 50,
            aiConfidence = 0
        } = data;

        const windRisk = this.calcWindRisk(windSpeed);
        const tempRisk = this.calcTempRisk(temperature);
        const humRisk = this.calcHumidityRisk(humidity);

        const score = Math.round(
            visionScore * this.weights.vision +
            windRisk * this.weights.wind +
            tempRisk * this.weights.temperature +
            humRisk * this.weights.humidity +
            aiConfidence * this.weights.aiConfidence
        );

        const clampedScore = Math.min(100, Math.max(0, score));

        let level, color, label;
        if (clampedScore < 30) {
            level = 'safe';
            color = '#10B981'; // Green
            label = 'SAFE';
        } else if (clampedScore < 70) {
            level = 'warning';
            color = '#F59E0B'; // Amber
            label = 'WARNING';
        } else {
            level = 'danger';
            color = '#EF4444'; // Red
            label = 'ALERT';
        }

        return {
            score: clampedScore,
            level,
            color,
            label,
            breakdown: {
                vision: Math.round(visionScore * this.weights.vision),
                wind: Math.round(windRisk * this.weights.wind),
                temperature: Math.round(tempRisk * this.weights.temperature),
                humidity: Math.round(humRisk * this.weights.humidity),
                ai: Math.round(aiConfidence * this.weights.aiConfidence)
            }
        };
    }
};
