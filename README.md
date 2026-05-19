# 🌲🔥 ForestGuard AI — Early Wildfire Detection System Powered by Gemma 4

> **An AI-powered distributed surveillance network for ultra-early forest fire detection using Gemma 4 multimodal Edge AI.**

---

## 🎯 Problem Statement

**Wildfires are a global crisis.** Every year, over **10 million hectares** of forest are destroyed worldwide, causing:
- 🌍 **$50+ billion** in damages annually
- 💨 Massive CO₂ emissions accelerating climate change
- 🦎 Irreversible biodiversity loss
- 👥 Thousands of lives endangered

**The core problem:** Current detection systems rely on satellites (hours of delay) or human spotters (limited coverage). By the time a fire is detected, it's often too late.

**My question:** *What if we could detect a wildfire in its first minutes, not hours?*

---

## 💡 My Solution: ForestGuard AI

ForestGuard AI is a **distributed Edge AI surveillance network** that deploys intelligent forest monitoring stations capable of detecting wildfires at the earliest stage — when they're still just a wisp of smoke.

### How It Works

```
📷 High-altitude Camera → 🧠 Gemma 4 (Edge AI) → 📊 Risk Scoring → 🚨 Real-time Alert
         ↑                         ↑                       ↑
    🌡️ Sensors            🔥 Fine-tuned with         ⚡ Multi-sensor
   (wind, temp,             Unsloth LoRA              fusion engine
    humidity)               on fire dataset
```

Each station is a **smart sentinel** installed above the forest canopy on high-altitude poles, equipped with:
- 📷 Long-range panoramic camera
- 🧠 NVIDIA Jetson Orin Nano running Gemma 4 (GGUF quantized)
- 🌡️ Environmental sensors (wind, temperature, humidity)
- 🔋 Solar-powered battery system
- 📡 Hybrid communication (LoRa / GSM / Satellite mesh network)

---

## 🧠 Gemma 4: The Brain of ForestGuard

### Why Gemma 4?
Gemma 4 E4B is the perfect model for this application because:
1. **Natively multimodal** — analyzes camera images + sensor text data simultaneously
2. **Edge-optimized** — E4B variant designed for IoT/edge deployment on Jetson hardware
3. **128K context window** — processes complex multi-sensor scenarios
4. **Apache 2.0 license** — fully deployable in production

### Fine-tuning with Unsloth
I fine-tuned Gemma 4 E4B using **Unsloth** with LoRA adapters on my custom **forest fire dataset** (4,700+ labeled examples):

```python
from unsloth import FastVisionModel

model, tokenizer = FastVisionModel.from_pretrained(
    "google/gemma-4-e4b-it",
    load_in_4bit=True,
)

model = FastVisionModel.get_peft_model(
    model,
    finetune_vision_layers=True,   # Fine-tune visual understanding
    finetune_language_layers=True,  # Fine-tune reasoning
    r=16, target_modules="all-linear",
)
```

**Training details:**
- 📊 Dataset: 4,726 examples (fire/smoke/normal images with structured responses)
- 🏋️ Method: LoRA (r=16) on vision + language layers
- ⚙️ Optimizer: AdamW 8-bit, lr=2e-5, cosine scheduler
- 🔄 Epochs: 1 full epoch with gradient accumulation
- 💻 Hardware: Kaggle GPU T4 x2

### My "Dual-Prompt" Energy Innovation

My key architectural innovation is the **Dual-Prompt Strategy** that optimizes battery life on solar-powered stations:

| Mode | Prompt | Tokens | Energy | Frequency |
|------|--------|--------|--------|-----------|
| **Fast Scan** | "YES or NO: fire/smoke visible?" | 1 token | ⚡ Minimal | Every 30s |
| **Deep Analysis** | Full multimodal analysis with sensor fusion | 200+ tokens | 🔋 Full power | Only on alert |

This allows stations to run **24/7 on solar power** while maintaining instant detection capability.

---

## 🖥️ Live Dashboard Demo

**→ [Live Demo: chaibi-mustapha.github.io/forestguard-ai-dashboard](https://chaibi-mustapha.github.io/forestguard-ai-dashboard/)**

My real-time control center dashboard provides:

### Features:
- 🗺️ **Interactive satellite map** with 12 monitoring stations in cellular grid
- 📹 **Live camera feed** with AI overlay (fire zone marking)
- 📊 **Real-time risk gauge** (0-100 danger score)
- 🌡️ **Sensor panel** (wind, temperature, humidity, air quality)
- 🧠 **Gemma 4 AI analysis panel** with structured JSON response
- 🔔 **Smart alert system** with severity classification
- 📡 **Mesh network status** showing station connectivity
- 🎮 **Demo Mode** for interactive testing with fire/non-fire scenarios

### Risk Scoring Algorithm:
```
Danger Score = Fire Detection (40%) + Wind Speed (20%) 
             + Temperature (20%) + Humidity (10%) 
             + Gemma 4 Confidence (10%)

🟢 0-30: SAFE    🟡 30-70: VIGILANCE    🔴 70-100: ALERT
```

---

## 🎓 Judges' Evaluation Guide (How to Test)

I have made it incredibly easy for the judges to interactively test and evaluate the entire end-to-end ForestGuard AI system.

### 1. 🎬 Watch the Demo Video (Quick 2-Min Review)
If you are short on time, watch this 2-minute screen recording showing the live dashboard performing real-time vision-based fire detection powered by my fine-tuned Gemma 4 model:
👉 **[Watch the Live Demo Video on YouTube](https://www.youtube.com/watch?v=8_dnq1yRBR8)** 🎬

### 2. ⚡ Live Interactive Testing (Run it Yourself in 1 Minute!)
For a full hands-on evaluation of my fine-tuned multimodal Gemma 4 model, follow these three simple steps:

1. **Launch the GPU Backend:** Open my **[Google Colab Live GPU Server (One-Click Launch)](https://colab.research.google.com/drive/1Q3WmHOqtDLUMuQM9rrrtA5-dd9_TTbjo)**. Make sure you are using a **T4 GPU** runtime, copy all the code from `colab_demo_judges.py` (which is already configured with pre-authenticated access to my Hugging Face repository so you do NOT need any token!), and run the cell. After loading, copy the Gradio public URL displayed at the bottom:
   `Running on public URL: https://xxxx.gradio.live`
2. **Access the Live Dashboard:** Open the **[ForestGuard AI Dashboard](https://chaibi-mustapha.github.io/forestguard-ai-dashboard/)**.
3. **Connect & Test:** 
   * Click the settings icon (**⚙️**) in the top-right corner of the dashboard.
   * Paste the Gradio URL (`https://xxxx.gradio.live`) into the **Colab GPU API URL** field and click **Connect**.
   * Click **DEMO MODE** (top-right), select any preset scenario (like *Station A4 - Fire Start*) or **upload your own custom forest image**, and click **SEND DATA TO DASHBOARD**!
   * Click **Analyze** under the camera view. The dashboard will query your live Colab T4 GPU, run multimodal inference with my fine-tuned Gemma 4 E4B model, parse the structured JSON response, and trigger emergency alerts in real-time!

   > [!NOTE]
   > **💡 Technical Note on GPU Warm-up & Inference Latency:**
   > - **First Inference (Cold Start):** The very first image analysis after launching the Colab notebook takes **18 to 25 seconds**. This is a standard GPU warm-up phase where PyTorch/Unsloth initializes the CUDA kernels, allocates active GPU cache, and prepares the fine-tuned Gemma 4 E4B weights.
   > - **Subsequent Inferences (Hot Start):** Once warmed up, all subsequent image analyses run at full GPU speed and complete in just **3 to 5 seconds**!
   > - **Robustness Mitigation:** To ensure a seamless hands-on evaluation, I have configured a robust **45-second network timeout** on the frontend (increased from 15s). The dashboard will wait patiently for the GPU warm-up on the first run, guaranteeing a 100% successful evaluation!

---

## 🏗️ Technical Architecture

```
┌─────────────────────────────────────────────────────┐
│                 FOREST STATION (Edge)                │
│                                                     │
│  📷 Camera ──→ Gemma 4 E4B (Jetson Orin Nano)      │
│  🌡️ Sensors ──→ Sensor Fusion Engine                │
│  🔋 Solar + Battery                                 │
│  📡 LoRa/GSM/Satellite Mesh                         │
└──────────────────┬──────────────────────────────────┘
                   │ JSON Alert (lightweight)
                   ▼
┌─────────────────────────────────────────────────────┐
│              CONTROL CENTER (Cloud)                  │
│                                                     │
│  🗺️ Real-time Map    📊 Risk Dashboard              │
│  🔔 Alert System     📈 Historical Analytics        │
│  👨‍🚒 Emergency Dispatch                              │
└─────────────────────────────────────────────────────┘
```

### Technology Stack:
| Component | Technology |
|-----------|-----------|
| AI Model | Gemma 4 E4B (fine-tuned with Unsloth) |
| Edge Hardware | NVIDIA Jetson Orin Nano |
| Model Format | GGUF Q4_K_XL (quantized for edge) |
| Dashboard | HTML5 + JavaScript + Leaflet.js |
| Hosting | GitHub Pages + HuggingFace Spaces |
| Communication | LoRa mesh + GSM + Satellite |
| Power | Solar panels + LiFePO4 batteries |

---

## 📦 Code & Resources

| Resource | Link |
|----------|------|
| 🖥️ **Live Dashboard** | [chaibi-mustapha.github.io/forestguard-ai-dashboard](https://chaibi-mustapha.github.io/forestguard-ai-dashboard/) |
| 💻 **GitHub Repository** | [github.com/chaibi-mustapha/forestguard-ai-dashboard](https://github.com/chaibi-mustapha/forestguard-ai-dashboard) |
| ⚡ **Live GPU Server** | [Google Colab Live GPU Server](https://colab.research.google.com/drive/1Q3WmHOqtDLUMuQM9rrrtA5-dd9_TTbjo) |
| 🧠 **Fine-tuned Model** | [huggingface.co/chaibi-mustapha/gemma-4-e4b-fire-detection](https://huggingface.co/chaibi-mustapha/gemma-4-e4b-fire-detection) |
| 📊 **Training Dataset** | [kaggle.com/datasets/mustaphachaibi/forest-fire-dataset-full](https://kaggle.com/datasets/mustaphachaibi/forest-fire-dataset-full) |
| 📓 **Training Notebook** | [Kaggle Notebook — Gemma 4 Fine-tuning with Unsloth](https://www.kaggle.com/code/mustaphachaibi/notebook3474e5a412) |

---

## 🌍 Global Impact & Scalability

### Why This Matters (UN SDGs Alignment):
- 🌲 **SDG 15 - Life on Land**: Protect forest ecosystems
- 🌡️ **SDG 13 - Climate Action**: Reduce wildfire CO₂ emissions  
- 🏙️ **SDG 11 - Sustainable Cities**: Protect communities near forests
- 🤝 **SDG 17 - Partnerships**: Open-source, deployable worldwide

### Scalability:
| Metric | Value |
|--------|-------|
| Cost per station | ~$500 (vs $50,000+ traditional) |
| Power | 100% solar (zero grid dependency) |
| Coverage per station | 5-10 km radius |
| Network resilience | Mesh topology (no single point of failure) |
| Deployment regions | Mediterranean, Amazon, Australia, Siberia, California |

### Real-World Deployment Path:
1. **Phase 1** (2026): Pilot — 12 stations in Mediterranean forest
2. **Phase 2** (2027): Scale — 100 stations across Southern Europe
3. **Phase 3** (2028): Global — Open-source hardware plans for worldwide deployment

---

## 🏆 What Makes ForestGuard Unique

| Feature | Traditional Systems | ForestGuard AI |
|---------|-------------------|----------------|
| Detection time | Hours (satellite) | **Minutes** (edge AI) |
| Infrastructure needed | Power grid, internet | **None** (solar + mesh) |
| AI capability | Basic thresholding | **Gemma 4 multimodal reasoning** |
| False positive rate | High | **Low** (multi-sensor fusion) |
| Cost | $50,000+/station | **~$500/station** |
| Operates offline | ❌ | ✅ **Full edge AI** |

---

## 👤 About the Author

**Mustapha Chaibi** — AI Engineer & Full-Stack Developer
- Passionate about using AI for environmental protection
- Experienced in Edge AI deployment and multimodal models
- Vision: Making wildfire detection accessible and affordable for every forest in the world

---

## 🎬 Video Pitch

[📹 Watch my 2-minute video pitch on YouTube](https://www.youtube.com/watch?v=8_dnq1yRBR8)
<!-- TODO: Add YouTube link after recording -->

---

> *"Every minute counts when a forest is burning. ForestGuard AI gives those precious minutes back."*

**ForestGuard AI** — Protecting forests with intelligence. 🌲🛡️🔥
