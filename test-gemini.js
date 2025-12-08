const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testGemini() {
    console.log('Testing Gemini API with detected models...');
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error('Error: GEMINI_API_KEY not found in environment variables.');
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Test with gemini-flash-latest
    const modelName = 'gemini-flash-latest';
    console.log(`Attempting to generate content with model: ${modelName}`);

    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Hello, are you working?');
        const response = await result.response;
        console.log('Success! Response:', response.text());
    } catch (error) {
        console.error(`Error with ${modelName}:`);
        console.error(error.message);
    }
}

testGemini();
