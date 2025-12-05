# First Aid Chatbot

A Next.js-based intelligent chatbot providing real-time first-aid guidance for common domestic accidents. Built with TypeScript, Google Gemini AI, and designed for both web and WhatsApp deployment.

## 🎯 Project Objectives

1. ✅ Acquire data for different injury types and their first-aid treatments
2. ✅ Develop an NLP-based chatbot as a virtual assistant for first-aid treatment
3. 🔄 Test and evaluate chatbot performance
4. 📱 Deploy on WhatsApp messaging platform

## 🚀 Features

- **Intelligent First-Aid Guidance**: Powered by Google Gemini AI with comprehensive knowledge base
- **Emergency Detection**: Automatically identifies critical situations and recommends calling emergency services
- **10+ Injury Types Covered**: Burns, cuts, fractures, choking, poisoning, sprains, and more
- **Real-time Chat Interface**: Modern, responsive web UI for testing and demonstration
- **WhatsApp Integration Ready**: Twilio-based deployment for real-world usage
- **Safety-First Approach**: Clear disclaimers and emergency service recommendations

## 📋 Prerequisites

- Node.js 18+ and npm
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))
- Twilio account (for WhatsApp deployment)

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
GEMINI_API_KEY=your_gemini_api_key_here

# For WhatsApp deployment (optional)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📚 Project Structure

```
chatbot/
├── app/                      # Next.js app directory
│   ├── api/
│   │   └── chat/            # Chat API endpoint
│   ├── globals.css          # Global styles
│   ├── page.tsx             # Main page
│   └── page.module.css      # Page styles
├── components/              # React components
│   ├── ChatInterface.tsx    # Main chat UI
│   ├── MessageBubble.tsx    # Message display
│   ├── LoadingIndicator.tsx # Typing indicator
│   └── EmergencyAlert.tsx   # Emergency banner
├── lib/                     # Core logic
│   ├── chatbot.ts          # Main chatbot service
│   ├── knowledge-base.ts   # Data management
│   ├── prompts.ts          # AI prompts
│   └── types.ts            # TypeScript types
├── data/                    # Knowledge base
│   ├── first_aid_knowledge.json  # Injury data
│   └── emergency_keywords.json   # Emergency detection
└── package.json
```

## 🏥 Supported Injuries

The chatbot provides guidance for:

1. **Minor Cuts and Scrapes**
2. **Minor Burns (First-Degree)**
3. **Sprains and Strains**
4. **Nosebleeds**
5. **Choking** (Emergency)
6. **Suspected Bone Fractures** (Serious)  
7. **Poisoning** (Emergency)
8. **Head Injuries**
9. **Insect Stings and Bites**
10. **Eye Injuries**

## 💬 Usage Examples

Try asking:
- "How do I treat a minor cut?"
- "Someone burned their hand on the stove"
- "My child has a nosebleed"
- "How to treat a bee sting?"
- "I twisted my ankle"

## ⚠️ Important Disclaimers

- This chatbot provides **first-aid guidance only**, not medical diagnosis
- For life-threatening emergencies, **always call emergency services immediately**:
  - US: 911
  - UK: 999
  - EU: 112
- This is **not a substitute** for professional medical care
- When in doubt, seek professional help

## 🧪 Testing

Run tests:
```bash
npm test
```

Build for production:
```bash
npm run build
```

## 📱 WhatsApp Deployment

To deploy on WhatsApp:

1. Set up a Twilio account and WhatsApp Business API
2. Configure webhook URL to point to `/api/whatsapp`
3. Add Twilio credentials to `.env.local`
4. Deploy to Vercel or your preferred hosting platform

Detailed deployment instructions are in `docs/DEPLOYMENT.md`.

## 🤝 Contributing

This is an academic project. For improvements:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## 📄 License

This project is for educational purposes.

## 👨‍💻 Author

Created as part of a first-aid chatbot development project.

## 🙏 Acknowledgments

- First-aid data compiled from reputable medical sources
- Google Gemini AI for natural language processing
- Next.js team for the amazing framework

---

**Remember**: This is a first-aid guidance tool. Always prioritize professional medical care for serious injuries.
