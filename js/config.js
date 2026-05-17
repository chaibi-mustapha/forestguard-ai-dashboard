/**
 * Global Configuration for ForestGuard AI
 * WARNING: If you host this site publicly (e.g., GitHub Pages),
 * be aware that your Hugging Face Token will be visible in the source code.
 */
window.ForestGuardConfig = {
    // Model address on Hugging Face
    hfModelId: 'chaibi-mustapha/gemma-4-e4b-fire-detection',
    
    // Your Hugging Face Token (API Read Token)
    hfToken: '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',

    // Colab GPU Backend URL (paste your ngrok URL here after starting Colab)
    // Example: 'https://xxxx-xx-xx-xxx-xx.ngrok-free.app'
    colabApiUrl: '',

    // Default parameters
    defaultStation: 'A3',
    demoMode: true
};
