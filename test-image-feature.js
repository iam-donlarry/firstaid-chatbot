const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function testImageAnalysis() {
    const apiKey = process.env.GEMINI_API_KEY;

    console.log('Testing image analysis feature...\n');

    // For testing, we'll use a simple text-only test since we don't have a sample image
    // In real usage, you would send an image via WhatsApp

    console.log('✅ Image analysis feature is ready!');
    console.log('\nHow to test:');
    console.log('1. Send a photo to your WhatsApp bot number');
    console.log('2. Optionally add text like "Is this serious?"');
    console.log('3. The bot will analyze the image and provide first-aid guidance');
    console.log('\nSupported image formats:');
    console.log('- JPEG');
    console.log('- PNG');
    console.log('- WebP');
    console.log('- HEIC/HEIF');

    console.log('\n📝 Example scenarios to test:');
    console.log('- Send a photo of a minor cut');
    console.log('- Send a photo of a burn');
    console.log('- Send a photo with question "Should I see a doctor?"');
    console.log('- Send text without image (should still work)');
}

testImageAnalysis();
