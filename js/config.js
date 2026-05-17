/**
 * Global Configuration for ForestGuard AI
 * No hardcoded secrets to prevent GitHub Pages security blocks.
 */
window.ForestGuardConfig = {
    // Model address on Hugging Face
    hfModelId: 'chaibi-mustapha/gemma-4-e4b-fire-detection',
    
    // Left empty for security — enter yours in the dashboard Settings (⚙️)
    hfToken: '',

    // Colab GPU Backend URL (paste your ngrok or gradio URL here)
    colabApiUrl: '',

    // Default parameters
    defaultStation: 'A3',
    demoMode: true
};
