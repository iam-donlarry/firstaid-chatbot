# WhatsApp Deployment Guide

This guide explains how to deploy the First Aid Chatbot to WhatsApp using Twilio's WhatsApp Business API.

## Prerequisites

1. **Twilio Account**: Sign up at [https://www.twilio.com/](https://www.twilio.com/)
2. **WhatsApp Business Profile**: Required for production deployment
3. **Domain with HTTPS**: For webhook endpoints (use Vercel, Heroku, or similar)

## Development/Testing Setup

### Step 1: Twilio Sandbox Setup

For testing, use Twilio's WhatsApp Sandbox (no business verification needed):

1. Log into your Twilio Console
2. Navigate to **Messaging** → **Try it out** → **Send a WhatsApp message**
3. Follow the instructions to join the sandbox by sending a code to the Twilio number
4. Note your sandbox WhatsApp number (e.g., `whatsapp:+14155238886`)

### Step 2: Create WhatsApp Handler

Create the WhatsApp webhook handler:

**File: `app/api/whatsapp/route.ts`**

```typescript
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
```

### Step 3: Deploy to Vercel

1. **Install Vercel CLI** (if not already installed):
```bash
npm install -g vercel
```

2. **Deploy**:
```bash
vercel
```

3. **Set Environment Variables** in Vercel Dashboard:
   - `GEMINI_API_KEY`
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`

4. **Note your deployment URL** (e.g., `https://your-app.vercel.app`)

### Step 4: Configure Twilio Webhook

1. In Twilio Console, go to **Messaging** → **Settings** → **WhatsApp Sandbox Settings**
2. Under **"When a message comes in"**, enter your webhook URL:
   ```
   https://your-app.vercel.app/api/whatsapp
   ```
3. Set HTTP method to **POST**
4. Save the configuration

### Step 5: Test on WhatsApp

1. Open WhatsApp on your phone
2. Send the join code to the Twilio sandbox number (if not  already joined)
3. Start chatting with the bot!

Example messages:
- "How do I treat a cut?"
- "Someone burned their hand"
- "My child has a nosebleed"

## Production Deployment

For production deployment (real WhatsApp Business number):

### 1. WhatsApp Business Profile

- Submit business profile for Facebook review
- Get approved for WhatsApp Business API access
- This process can take several days

### 2. Twilio Phone Number

- Purchase a Twilio phone number
- Enable WhatsApp on that number
- Link to your approved WhatsApp Business profile

### 3. Production Environment

1. Deploy to production environment (Vercel recommended)
2. Set up custom domain with HTTPS
3. Configure production webhook URL in Twilio
4. Test thoroughly before going live

### 4. Monitoring

- Set up error logging (e.g., Sentry)
- Monitor Twilio usage and costs
- Track conversation metrics

## Local Development with ngrok

To test WhatsApp integration locally:

1. **Install ngrok**:
```bash
npm install -g ngrok
```

2. **Start your dev server**:
```bash
npm run dev
```

3. **Create tunnel**:
```bash
ngrok http 3000
```

4. **Use ngrok URL** as webhook:
   ```
   https://your-unique-id.ngrok.io/api/whatsapp
   ```

## Limitations & Considerations

### Twilio Sandbox Limitations
- Users must opt-in by sending a join code
- Limited to development/testing
- Session expires after 24 hours of inactivity

### WhatsApp Formatting
- Limited markdown support
- No rich media in this basic setup
- Character limits apply

### Rate Limits
- Twilio has rate limits on messages
- Consider implementing message queuing for high volume

### Costs
- Twilio charges per message sent/received
- Check current pricing: [https://www.twilio.com/whatsapp/pricing](https://www.twilio.com/whatsapp/pricing)

## Troubleshooting

### Messages not reaching bot
- Verify webhook URL is correct and accessible
- Check Twilio debugger logs
- Ensure environment variables are set

### Bot not responding
- Check application logs
- Verify Gemini API key is valid
- Check for errors in webhook endpoint

### Session issues
- Sessions are stored in memory (will reset on redeploy)
- Consider using Redis or database for persistent sessions

## Security Best Practices

1. **Validate incoming requests** from Twilio using request signatures
2. **Rate limiting** to prevent abuse
3. **Environment variables** for all sensitive data
4. **HTTPS only** for webhook endpoints
5. **Regular security audits**

## Next Steps

1. Implement request validation
2. Add conversation analytics
3. Support for images/voice messages
4. Multi-language support
5. Integration with medical databases

---

For support or questions, refer to:
- [Twilio WhatsApp Documentation](https://www.twilio.com/docs/whatsapp)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)
