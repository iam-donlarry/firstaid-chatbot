const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function listModels() {
    console.log('Listing available models...');
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error('Error: GEMINI_API_KEY not found in environment variables.');
        return;
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        // We use the model manager to list models, but the SDK structure 
        // usually allows listing via the getGenerativeModel factory? No, usually it's separate.
        // Actually, looking at docs or common usage, it might be separate. 
        // But let's try to just instantiate any model and look for a list if possible? 
        // No, the error message said "Call ListModels". 
        // In the node JS SDK, it is not always exposed directly on the top level client nicely in older versions
        // but let's try the newer style.

        // Wait, the SDK doesn't always expose a clean listModels method on the main class in all versions.
        // Let's try to access the underlying API or just test 'gemini-pro'.

        // For SDK v0.24.1:
        // There is no direct `listModels` on `GoogleGenerativeAI`.
        // However, we can try to guess common models or just try 'gemini-pro'.

        // Actually, let's just test 'gemini-pro' specifically as a fallback in this script.
        // And 'gemini-1.0-pro'.

        const modelsToTest = ['gemini-pro', 'gemini-1.0-pro', 'gemini-1.5-pro', 'gemini-1.5-flash-latest'];

        for (const modelName of modelsToTest) {
            console.log(`Testing model: ${modelName}`);
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent('Hi');
                const response = await result.response;
                console.log(`SUCCESS: ${modelName} works!`);
                console.log('Response:', response.text());
                return; // Found one!
            } catch (e) {
                console.log(`FAILED: ${modelName} - ${e.message.split('\n')[0]}`);
            }
        }

    } catch (error) {
        console.error('Fatal error:', error);
    }
}

listModels();
