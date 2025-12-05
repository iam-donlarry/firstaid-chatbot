import { NextRequest, NextResponse } from 'next/server';
import { FirstAidChatbot } from '@/lib/chatbot';
import { ChatRequest } from '@/lib/types';

// Initialize chatbot (in production, use environment variable)
const API_KEY = process.env.GEMINI_API_KEY || '';

let chatbot: FirstAidChatbot | null = null;

function getChatbot(): FirstAidChatbot {
    if (!chatbot) {
        if (!API_KEY) {
            throw new Error('GEMINI_API_KEY environment variable is not set');
        }
        chatbot = new FirstAidChatbot(API_KEY);
    }
    return chatbot;
}

export async function POST(request: NextRequest) {
    try {
        const body: ChatRequest = await request.json();
        const { message, sessionId, image, mimeType } = body;

        if (!message && !image) {
            return NextResponse.json(
                { error: 'Message or image is required' },
                { status: 400 }
            );
        }

        const bot = getChatbot();
        let response;

        if (image && mimeType) {
            // Handle image chat
            const imageBuffer = Buffer.from(image, 'base64');
            response = await bot.chatWithImage(
                message || 'Please analyze this image',
                imageBuffer,
                mimeType,
                sessionId
            );
        } else {
            // Handle text-only chat
            response = await bot.chat(message, sessionId);
        }

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error in chat API:', error);

        if (error instanceof Error && error.message.includes('GEMINI_API_KEY')) {
            return NextResponse.json(
                {
                    error: 'Chatbot is not properly configured. Please set GEMINI_API_KEY environment variable.',
                    message: 'I apologize, but the chatbot is not properly configured. Please contact the administrator.'
                },
                { status: 500 }
            );
        }

        return NextResponse.json(
            {
                error: 'Internal server error',
                message: 'I apologize, but I encountered an error. If this is an emergency, please call emergency services immediately.'
            },
            { status: 500 }
        );
    }
}
