# 🌲 ForestGuard AI Dashboard
### Early Forest Fire Detection System Powered by Gemma 4 Edge AI

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Gemma 4 Good](https://img.shields.io/badge/Hackathon-Gemma%204%20Good-blueviolet)](https://www.kaggle.com/competitions/gemma-4-good)

**ForestGuard AI** is a state-of-the-art surveillance dashboard designed to combat forest fires through localized Edge AI analysis and a robust mesh network of intelligent antennas.

## 🚀 Key Features

- **🧠 Unified AI Architecture**: Leverages a fine-tuned **Gemma 2-2B** model for real-time visual analysis of forest scenes.
- **📡 Intelligent Mesh Network**: Simulates a network of 12 surveillance stations (Antennas) transmitting environmental data (Wind, Temp, Humidity) and imagery.
- **🔥 Real-time Risk Scoring**: A custom scoring engine that combines environmental sensor data with AI vision confidence to predict fire risks.
- **🗺️ Interactive GIS Mapping**: Real-time localization of alerts using Leaflet.js with dynamic fire propagation visualization.
- **🧪 Demonstration Mode**: Includes preset scenarios and manual image upload capabilities to test the AI performance across various conditions.

## 🛠️ Technical Stack

- **Frontend**: Vanilla HTML5, CSS3 (Modern Glassmorphism UI), and JavaScript (ES6+).
- **AI Engine**: Hugging Face Inference API (integrating a custom fine-tuned Gemma 2-2B model).
- **Mapping**: Leaflet.js for geospatial visualization.
- **Internationalization**: Fully documented and localized in English for global accessibility.

## 📦 Installation & Setup

Since this is a static web application, no complex installation is required.

1. **Clone the repository**:
   ```bash
   git clone https://github.com/chaibi-mustapha/forestguard-ai-dashboard.git
   ```
2. **Open the Dashboard**:
   Simply open `index.html` in any modern web browser.

3. **Configure the AI API**:
   - Click the **Settings (⚙️)** icon in the dashboard header.
   - Enter your **Hugging Face Read Token** and the **Model ID** (default is set to `chaibi-mustapha/gemma-2-2b-fire-detection`).
   - Click **Save**.

## 💡 How it Works

1. **Detection**: Surveillance stations capture images and environmental data at the edge.
2. **Analysis**: The image is sent to the **Gemma 4 AI** model. It analyzes the scene for smoke, flames, or high-risk atmospheric conditions.
3. **Scoring**: The system calculates a global risk score (0-100%). If the score exceeds a threshold, an automated alert is triggered across the mesh network.
4. **Alerting**: The dashboard highlights the specific sector, displays AI-generated reasoning, and suggests recommended actions for emergency responders.

## 🏆 Hackathon Context

This project was developed for the **Gemma 4 Good Hackathon** on Kaggle. It demonstrates the power of lightweight, open-source AI models in solving critical environmental challenges while maintaining low power consumption and high reliability in remote forest areas.

---
**Developed by Mustapha Chaibi**
*Empowering nature through Sovereign Edge AI.*
