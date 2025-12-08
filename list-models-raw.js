const https = require('https');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error('Error: GEMINI_API_KEY not found in environment variables.');
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

console.log('Fetching models from:', 'https://generativelanguage.googleapis.com/v1beta/models?key=***');

https.get(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const parsedData = JSON.parse(data);
            if (parsedData.error) {
                console.error('API Error:', parsedData.error);
            } else if (parsedData.models) {
                console.log('Available Models:');
                parsedData.models.forEach(model => {
                    // Filter for generateContent supported models
                    if (model.supportedGenerationMethods && model.supportedGenerationMethods.includes('generateContent')) {
                        console.log(`- ${model.name} (${model.displayName})`);
                    }
                });
            } else {
                console.log('Unexpected response structure:', parsedData);
            }
        } catch (e) {
            console.error('Error parsing response:', e);
            console.log('Raw response:', data);
        }
    });

}).on('error', (err) => {
    console.error('Request error:', err);
});
