const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function testImageAnalysis() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error('❌ GEMINI_API_KEY not found in .env file');
        return;
    }

    console.log('🧪 Testing Image Analysis Feature\n');

    // Look for test image in project root
    const possibleImages = ['test-image.jpg', 'test-image.png', 'test.jpg', 'test.png', 'sample.jpg', 'sample.png'];
    let imagePath = null;

    for (const img of possibleImages) {
        const fullPath = path.join(__dirname, img);
        if (fs.existsSync(fullPath)) {
            imagePath = fullPath;
            break;
        }
    }

    if (!imagePath) {
        console.log('📝 No test image found. Please add an image with one of these names:');
        possibleImages.forEach(name => console.log(`   - ${name}`));
        console.log('\n💡 Tip: Use a photo of a minor injury (cut, bandage, etc.)');
        return;
    }

    console.log(`✅ Found test image: ${path.basename(imagePath)}\n`);

    try {
        // Read image file
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = imageBuffer.toString('base64');

        // Determine MIME type
        const ext = path.extname(imagePath).toLowerCase();
        const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';

        console.log(`📊 Image details:`);
        console.log(`   Size: ${(imageBuffer.length / 1024).toFixed(2)} KB`);
        console.log(`   Type: ${mimeType}\n`);

        // Initialize Gemini
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        console.log('🤖 Sending to Gemini for analysis...\n');

        // Medical image analysis prompt (same as in chatbot.ts)
        const imagePrompt = `You are a first-aid assistant analyzing an image. 

CRITICAL DISCLAIMERS:
- This is NOT a medical diagnosis
- If this appears to be a serious injury, the user should seek immediate professional medical help
- Emergency services should be called for: severe bleeding, burns covering large areas, deep wounds, signs of shock, difficulty breathing, or suspected fractures

Based on the image provided, please:
1. Describe what you observe
2. Assess the severity (minor, moderate, or potentially serious)
3. Provide appropriate first-aid steps if it's minor
4. STRONGLY recommend professional medical care if it appears moderate to serious

User's message: Please analyze this image

Remember: Be helpful but cautious. Better to over-recommend professional care than under-recommend it.`;

        const result = await model.generateContent([
            imagePrompt,
            {
                inlineData: {
                    data: base64Image,
                    mimeType: mimeType
                }
            }
        ]);

        const response = await result.response;
        const text = response.text();

        console.log('━'.repeat(60));
        console.log('🩺 AI ANALYSIS RESULT:');
        console.log('━'.repeat(60));
        console.log(text);
        console.log('━'.repeat(60));
        console.log('\n✅ Image analysis successful!');
        console.log('📱 The WhatsApp integration is ready to receive images.');

    } catch (error) {
        console.error('\n❌ Error during image analysis:');
        console.error(error.message);

        if (error.message.includes('API key')) {
            console.error('\n💡 Check that your GEMINI_API_KEY is correct in .env');
        }
    }
}

testImageAnalysis();
