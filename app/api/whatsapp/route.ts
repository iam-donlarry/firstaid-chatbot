import { NextRequest, NextResponse } from 'next/server';
import { FirstAidChatbot } from '@/lib/chatbot';
import twilio from 'twilio';

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
    
    // Use phone number as session ID
    const sessionId = from.replace('whatsapp:', '');

    const bot = getChatbot();
    const response = await bot.chat(message, sessionId);

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