const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Simple mock of the Chatbot class structure to verify the API call part specifically
// We don't want to import the actual TS file because of compilation complexity in this simple script context.
// We are mimicking the exact logic we just changed.

class FirstAidChatbotMock {
    constructor(apiKey) {
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    async generateAIResponse(userMessage) {
        try {
            // THIS IS THE LINE WE CHANGED AND ARE TESTING
            const model = this.genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

            const result = await model.generateContent(userMessage);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('Error generating AI response:', error);
            throw error;
        }
    }
}

async function verify() {
    console.log('Verifying Chatbot fix...');
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('API Key missing');
        return;
    }

    const bot = new FirstAidChatbotMock(apiKey);
    try {
        console.log('Sending message to chatbot mock...');
        const response = await bot.generateAIResponse('Hello, this is a test.');
        console.log('SUCCESS! Chatbot generated response:');
        console.log(response);
    } catch (e) {
        console.error('FAILED:');
        console.error(e);
    }
}

verify();
