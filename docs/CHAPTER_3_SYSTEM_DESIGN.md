# CHAPTER THREE
# SYSTEM DESIGN

## 3.1 Introduction
This chapter provides a comprehensive and detailed description of the "First Aid Chatbot" system architecture and design. It elaborates on the software development methodologies, architectural patterns, and modern frameworks utilized to build a robust, scalable, and multi-platform conversational agent.

The system is designed to provide immediate, potentially life-saving first aid information through two primary channels: a responsive web application and a widely accessible messaging platform, WhatsApp. By leveraging advanced Artificial Intelligence (AI) and Natural Language Processing (NLP) capabilities provided by Google's Gemini models, the system transcends traditional rule-based chatbots, offering context-aware, empathetic, and visually intelligent assistance.

This chapter further details the data flow, security measures, external integrations, and the complete deployment pipeline required to maintain the system's reliability and availability.

## 3.2 Proposed Methodology
The development methodology adopted for this project is an **Agile-driven, Iterative approach**, focusing on continuous integration and delivery (CI/CD). The system is built as a **Hybrid AI Application**, combining the reliability of structured medical data with the generative flexibility of Large Language Models (LLMs).

### 3.2.1 Core Architectural Principles
The system follows a **Service-Oriented Architecture (SOA)**, where distinct functionalities are encapsulated into modular services:
1.  **Presentation Layer**: Handles user interaction via two distinct interfaces:
    *   **Web Interface**: A React-based Single Page Application (SPA) offering a rich, visual chat experience.
    *   **Messaging Interface**: A WhatsApp integration via Twilio, providing low-bandwidth, high-accessibility access.
2.  **Application Logic Layer**: A serverless backend built on Next.js API routes that orchestrates the flow of data between the user, the knowledge base, and the AI model.
3.  **Intelligence Layer**: Powered by Google Gemini, this layer acts as the reasoning engine, processing text and images to generate human-like responses.
4.  **Data Layer**: A dual-store approach using:
    *   **Static Knowledge Base (JSON)**: For immutable, verified medical protocols.
    *   **In-Memory Session Store**: For managing active conversation states and context windows.

### 3.2.2 The Hybrid Intelligence Model
To ensure medical accuracy while maintaining conversational fluidity, the system employs a "Retrieval-Augmented Generation" (RAG-lite) pattern:
*   **Step 1: Intent Classification**: The system first analyzes user input for high-priority signals (e.g., "bleeding", "unconscious").
*   **Step 2: Emergency Override**: If critical keywords are detected, the AI generation is bypassed in favor of hard-coded, instant emergency protocols to minimize latency.
*   **Step 3: Knowledge Retrieval**: For non-emergencies, the system queries its local knowledge base to find relevant first aid entries (e.g., "burns", "cuts").
*   **Step 4: AI Synthesis**: The retrieved structured data is fed into the Gemini LLM as a "system prompt," instructing the AI to formulate its response based *only* on the verified data provided, effectively reducing hallucinations.

## 3.3 Software Design and Architecture

### 3.3.1 System Components Diagram
The following breakdown illustrates the interaction between the system's core modules:
*   **User Devices**: Smartphones (WhatsApp) and Desktops/Laptops (Web Browser).
*   **Load Balancer / CDN**: Managed by Vercel, ensuring low latency distribution of the frontend assets.
*   **Next.js Serverless Functions**:
    *   `POST /api/chat`: Dedicated endpoint for the Web Client.
    *   `POST /api/whatsapp`: Webhook endpoint for Twilio/WhatsApp events.
*   **External APIs**:
    *   **Google Gemini API**: For text generation and image analysis.
    *   **Twilio API**: For sending and receiving WhatsApp messages.

### 3.3.2 Component Details

#### 3.3.2.1 Frontend Web Application (Next.js & React)
The web interface is constructed using **Next.js 15+ (App Router)** and **React 19**, offering a modern, server-rendered foundation.
*   **Component Structure**:
    *   `ChatInterface.tsx`: The primary state container. It manages the `messages` array, `isLoading` states, and handles the `scrollToBottom` logic for a smooth chat experience.
    *   `MessageBubble.tsx`: A reusable component that renders messages. It supports Markdown rendering, allowing the bot to send formatted lists, bold text, and warnings.
    *   `EmergencyAlert.tsx`: A visual component that triggers a flashing red alert UI when an emergency state is detected, visually prompting the user to take urgent action.
*   **Styling**: CSS Modules (`*.module.css`) are used to scope styles locally to components, preventing global namespace pollution and ensuring maintainability.

#### 3.3.2.2 WhatsApp Integration (Twilio Webhooks)
The WhatsApp functionality extends the system's reach to regions with limited internet connectivity or users who prefer a familiar messaging interface.
*   **Webhook Implementation**: The system exposes a public endpoint (`/api/whatsapp`). When a user sends a message to the bot's standard WhatsApp number, Twilio's servers make a `POST` request to this endpoint.
*   **Request Parsing**: The system parses the `FormData` sent by Twilio, extracting:
    *   `From`: The user's phone number (used as a unique Session ID).
    *   `Body`: The text message content.
    *   `MediaUrl0`: The URL of any attached image (for injury analysis).
*   **Media Handling**: If an image is detected, the system performs a server-side fetch to download the image from Twilio's secure servers using Basic Authentication, converts it to a buffer, and passes it to the AI vision model.
*   **Response Formatting**: The AI's response is wrapped in Twilio's XML-based markup language (TwiML) to be sent back to the user as a WhatsApp message.

#### 3.3.2.3 Backend Services (Node.js)
The backend logic is centralized in the `lib` directory to promote code reuse between the Web and WhatsApp interfaces.
*   **Chatbot Controller (`FirstAidChatbot`)**: This class acts as the central brain. It maintains `Map<string, ConversationContext>` to store conversation histories for different session IDs (or phone numbers) in memory. This ensures that the bot remembers the context of the conversation (e.g., if a user says "it's getting worse", the bot knows what "it" refers to).
*   **Knowledge Base Service (`KnowledgeBaseService`)**: A specialized utility that parses the `first_aid_knowledge.json` file. It implements a weighted search algorithm to find the most relevant injury entry based on keyword matching (e.g., matching "scald" to the "Burns" entry).

### 3.3.3 Data Design and Schema

#### 3.3.3.1 Knowledge Base Schema (`first_aid_knowledge.json`)
The medical knowledge is stored in a structured JSON format to ensure consistency.
```json
{
  "injuries": [
    {
      "id": "chem_burn",
      "name": "Chemical Burn",
      "severity": "High",
      "keywords": ["acid", "chemical", "corrosive"],
      "symptoms": ["burning sensation", "redness", "blistering"],
      "first_aid_steps": [
        { "step": 1, "instruction": "Remove contaminated clothing immediately." },
        { "step": 2, "instruction": "Rinse the area with water for at least 20 minutes." }
      ],
      "emergency_triggers": ["Eye involvement", "Large surface area"]
    }
  ]
}
```

#### 3.3.3.2 Conversation Context Schema
To maintain state, the system uses the following TypeScript interface:
```typescript
interface ConversationContext {
    sessionId: string;           // UUID or Phone Number
    messages: Message[];         // Array of past messages
    emergencyDetected: boolean;  // Flag for emergency state
    currentInjury?: Injury;      // Context of the current medical issue
}
```

## 3.4 Algorithm Design

### 3.4.1 Emergency Detection Algorithm
Safety is the priority. Every user message passes through this O(1) complexity check before any AI processing:
1.  **Input Normalization**: Convert user text to lowercase and strip punctuation.
2.  **Keyword Matching**: Check against the loaded `emergency_keywords.json` triggers (e.g., "dying", "choking", "heart attack").
3.  **Short-Circuit**: If a match is found -> `return EmergencyResponse`.
4.  **Proceed**: If no match -> Proceed to Knowledge Retrieval.

### 3.4.2 Image Analysis Pipeline
The system utilizes multimodal AI for visual assessment, following this sequence:
1.  **Ingestion**: Receive image buffer (from Web Upload or WhatsApp Media URL).
2.  **Preprocessing**: Convert buffer to Base64 string.
3.  **Prompt Construction**: Wrap the image with a strict "Medical Analysis System Prompt".
    *   *Prompt Directive*: "You are a first aid assistant. Identify the injury. Assess severity. If severe, recommend a doctor. Do NOT provide a definitive medical diagnosis."
4.  **Generation**: Send (Prompt + Image) to `gemini-flash-latest`.
5.  **Output Parsing**: Return the text advice to the user.

## 3.5 Security and Privacy
Given the medical nature of the application, privacy considerations are paramount.
*   **Data Ephemerality**: The application uses in-memory storage for session context. This means conversation history is cleared when the server instance restarts or after a timeout, ensuring that personal medical queries are not permanently stored in a database log.
*   **Data Transmission**: All traffic is encrypted via TLS 1.3 (HTTPS).
*   **Environment Security**: API Keys (Google Gemini, Twilio Auth Tokens) are strictly managed via environment variables and are never exposed to the client-side code.
*   **Twilio Security**: The WhatsApp webhook validates requests to ensure they genuinely originate from Twilio, preventing spoofing attacks.

## 3.6 Deployment and Infrastructure
The system leverages a modern Serverless infrastructure for high availability and low maintenance costs.

### 3.6.1 Vercel Deployment
The application is deployed on Vercel, utilizing their Global Edge Network.
*   **CI/CD Pipeline**:
    *   **Push**: Developer pushes code to the GitHub repository.
    *   **Build**: Vercel triggers a build, compiling TypeScript to JavaScript and optimizing static assets.
    *   **Deploy**: The build is promoted to a preview URL for testing, then to production.
    *   **Scale**: Serverless functions automatically scale up to handle traffic spikes and scale down to zero during inactivity.

### 3.6.2 Twilio Webhook Configuration
For WhatsApp integration:
1.  **Endpoint**: The Vercel production URL (`https://.../api/whatsapp`) is registered in the Twilio Console under "Messaging Settings".
2.  **Sandbox**: During development, the Twilio WhatsApp Sandbox is used to test features without requiring business verification.

## 3.7 Conclusion
The system design presented in this chapter describes a sophisticated, modern solution to providing first aid advice. By decoupling the presentation layers (Web vs. WhatsApp) from the core intelligence logic, the system achieves "Write Once, Run Everywhere" efficiency. The integration of Google's Gemini API provides a level of interactive understanding that far surpasses static decision trees, while the fallback mechanisms and strict prompt engineering ensure that the advice remains safe, relevant, and grounded in verified medical data.
