import { NextRequest, NextResponse } from 'next/server';
import { FirstAidChatbot } from '@/lib/chatbot';
import twilio from 'twilio';
import fs from 'fs';
import path from 'path';

const LOG_FILE = path.join(process.cwd(), 'debug_whatsapp.log');

function logDebug(message: string) {
    const timestamp = new Date().toISOString();
    const logLine = `${timestamp}: ${message}\n`;
    try {
        fs.appendFileSync(LOG_FILE, logLine);
    } catch (e) {
        console.error('Failed to write to debug log:', e);
    }
}

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const API_KEY = process.env.GEMINI_API_KEY || '';

let chatbot: FirstAidChatbot | null = null;

function getChatbot(): FirstAidChatbot {
    if (!chatbot) {
        logDebug('Initializing new chatbot instance');
        logDebug(`API Key present: ${!!API_KEY}`);
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

        logDebug(`Received message from ${from}: ${message}`);
        console.log('--- WhatsApp Webhook Debug ---');
        console.log('From:', from);

        console.log('Message Body:', message);
        console.log('NumMedia:', numMedia);
        console.log('MediaUrl0:', formData.get('MediaUrl0'));
        console.log('------------------------------');

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
                    console.log('Attempting to download image from:', mediaUrl);

                    // Download image from Twilio
                    // Twilio requires Basic Auth for media URLs
                    const authHeader = 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');

                    const imageResponse = await fetch(mediaUrl, {
                        headers: {
                            'Authorization': authHeader,
                            'User-Agent': 'Node.js/FirstAidChatbot'
                        }
                    });

                    console.log('Image download status:', imageResponse.status, imageResponse.statusText);

                    if (!imageResponse.ok) {
                        const errorText = await imageResponse.text();
                        console.error('Twilio download error body:', errorText);
                        throw new Error(`Failed to download image: ${imageResponse.status} ${imageResponse.statusText}`);
                    }

                    const arrayBuffer = await imageResponse.arrayBuffer();
                    const imageBuffer = Buffer.from(arrayBuffer);

                    console.log('Image downloaded successfully. Size:', imageBuffer.length);

                    // Process with image
                    response = await bot.chatWithImage(
                        message || 'Please analyze this image',
                        imageBuffer,
                        mediaContentType,
                        sessionId
                    );
                } catch (imageError) {
                    console.error('Error downloading/processing image:', imageError);

                    // Fallback logic:
                    if (message) {
                        // If there is text, process the text
                        response = await bot.chat(
                            'I received an image but had trouble processing it. ' + message,
                            sessionId
                        );
                    } else {
                        // If no text, send specific error instead of empty chat which triggers greeting
                        response = {
                            message: "I received your image but couldn't process it. Please try sending it again, or describe the injury in text.",
                            isEmergency: false,
                            sessionId: sessionId
                        };
                    }
                }
            } else {
                // NumMedia > 0 but no MediaUrl found
                console.warn('NumMedia is > 0 but MediaUrl0 is missing');
                if (message) {
                    response = await bot.chat(message, sessionId);
                } else {
                    response = {
                        message: "I see you sent an attachment, but I couldn't access it. Please try sending it again.",
                        isEmergency: false,
                        sessionId: sessionId
                    };
                }
            }
        } else {
            // No media, process as text
            logDebug('Processing text message');
            response = await bot.chat(message, sessionId);
            logDebug('Chat response generated');
        }

        // Create Twilio MessagingResponse
        const MessagingResponse = twilio.twiml.MessagingResponse;
        const twiml = new MessagingResponse();

        logDebug(`Sending response: ${response.message.substring(0, 50)}...`);
        twiml.message(response.message);

        return new NextResponse(twiml.toString(), {

            headers: {
                'Content-Type': 'text/xml',
            },
        });
    } catch (error) {
        logDebug(`Error in webhook: ${error instanceof Error ? error.message : String(error)}`);
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