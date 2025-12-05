import { NextRequest, NextResponse } from 'next/server';
import { FirstAidChatbot } from '@/lib/chatbot';
import twilio from 'twilio';

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const API_KEY = process.env.GEMINI_API_KEY || '';

let chatbot: FirstAidChatbot | null = null;

function getChatbot(): FirstAidChatbot {
    if (!chatbot) {
        chatbot = new FirstAidChatbot(API_KEY);
    }
    return chatbot;
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const message = formData.get('Body')?.toString() || '';
        const from = formData.get('From')?.toString() || '';
        const numMedia = parseInt(formData.get('NumMedia')?.toString() || '0');

        // Use phone number as session ID
        const sessionId = from.replace('whatsapp:', '');

        const bot = getChatbot();
        let response;

        // Check if there's an image attached
        if (numMedia > 0) {
            const mediaUrl = formData.get('MediaUrl0')?.toString();
            const mediaContentType = formData.get('MediaContentType0')?.toString() || 'image/jpeg';

            if (mediaUrl) {
                try {
                    // Download image from Twilio
                    const authHeader = 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');

                    const imageResponse = await fetch(mediaUrl, {
                        headers: {
                            'Authorization': authHeader
                        }
                    });

                    if (!imageResponse.ok) {
                        throw new Error('Failed to download image');
                    }

                    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

                    // Process with image
                    response = await bot.chatWithImage(
                        message || 'Please analyze this image',
                        imageBuffer,
                        mediaContentType,
                        sessionId
                    );
                } catch (imageError) {
                    console.error('Error downloading/processing image:', imageError);
                    // Fallback to text-only response
                    response = await bot.chat(
                        'I received an image but had trouble processing it. ' + message,
                        sessionId
                    );
                }
            } else {
                // No media URL, process as text
                response = await bot.chat(message, sessionId);
            }
        } else {
            // No media, process as text
            response = await bot.chat(message, sessionId);
        }

        // Create Twilio MessagingResponse
        const MessagingResponse = twilio.twiml.MessagingResponse;
        const twiml = new MessagingResponse();

        twiml.message(response.message);

        return new NextResponse(twiml.toString(), {
            headers: {
                'Content-Type': 'text/xml',
            },
        });
    } catch (error) {
        console.error('WhatsApp webhook error:', error);

        const MessagingResponse = twilio.twiml.MessagingResponse;
        const twiml = new MessagingResponse();
        twiml.message('Sorry, I encountered an error. If this is an emergency, please call emergency services immediately.');

        return new NextResponse(twiml.toString(), {
            headers: {
                'Content-Type': 'text/xml',
            },
        });
    }
}