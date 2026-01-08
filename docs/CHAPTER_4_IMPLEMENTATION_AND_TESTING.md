# CHAPTER FOUR
# IMPLEMENTATION AND TESTING

## 4.1 Introduction
This chapter discusses the detailed implementation of the project based on the system design specifications outlined in Chapter Three. It provides a comprehensive walkthrough of the development environment setup, the implementation of the core AI logic, the integration of multimodal capabilities, and the rigorous testing procedures employed to ensure the chatbot's reliability and accuracy in providing first aid advice.

## 4.2 Implementation
The implementation phase focused on translating the architectural design into a functional, production-ready system. Unlike traditional machine learning approaches that require extensive dataset curation for model training, this project leveraged the pre-trained capabilities of Google's Gemini Large Language Model (LLM), focusing development efforts on **Prompt Engineering**, **Context Management**, and **Knowledge Retrieval**.

### 4.2.1 Development Environment Setup
The development environment was configured to support a modern TypeScript-based workflow.
*   **Core Framework**: Next.js 15 (App Router) was initialized to provide a robust serverless backend and a React-based frontend.
*   **Dependency Management**: `npm` was used to manage key packages, including `@google/generative-ai` for AI integration and `twilio` for messaging.
*   **Environment Configuration**: Secure management of API keys (Gemini, Twilio) was implemented using `.env.local` files, ensuring no sensitive credentials were hardcoded.

### 4.2.2 Knowledge Base Implementation
Instead of training a model from scratch, a structured Knowledge Base (KB) was constructed to ground the AI's responses in verified medical data.
*   **Data Structure**: Medical protocols for common injuries (e.g., burns, fractures, CPR) were codified into a JSON format (`first_aid_knowledge.json`).
*   **Retrieval Logic**: A semantic search algorithm was implemented in `KnowledgeBaseService` to match user queries with the most relevant medical entries based on keywords and symptom overlap.

![attach image here]
*Figure 4.1: Snippet of the JSON Knowledge Base structure.*

### 4.2.3 AI Model Integration (Prompt Engineering)
The core intelligence of the chatbot was implemented through sophisticated prompt engineering rather than fine-tuning.
*   **System Prompting**: A dynamic system prompt was designed to enforce the persona of a "Helpful and Cautious First Aid Assistant."
*   **Context Injection**: The system was programmed to dynamically inject the retrieved knowledge base data into the prompt at runtime. This "Retrieval-Augmented Generation" (RAG) approach ensures the AI relies on the provided verified steps rather than its general training data, significantly reducing hallucinations.

![attach image here]
*Figure 4.2: Code snippet showing the dynamic prompt generation logic.*

### 4.2.4 Multimodal Implementation
To enhance diagnostic capabilities, computer vision features were implemented using Gemini's multimodal API.
*   **Image Processing**: A pipeline was created to accept image buffers (from web uploads or WhatsApp media), convert them to Base64, and feed them into the model.
*   **Safety Guardrails**: Specific prompts were crafted to instruct the model to look for visual signs of trauma while strictly disclaiming that it does not provide a medical diagnosis.

## 4.3 Deployment
The chatbot was deployed using a modern "Serverless" architecture, ensuring high availability, scalability, and ease of maintenance. This contrasts with traditional VPS deployments, removing the need for manual server management.

### 4.3.1 Web Deployment (Vercel)
The Next.js application was deployed to **Vercel**, a cloud platform optimized for frontend frameworks.
*   **Continuous Deployment (CD)**: The Vercel project was connected to the GitHub repository. Any commit to the `main` branch automatically triggers a build and deployment pipeline.
*   **Edge Functions**: The API routes (`/api/chat`) were deployed as serverless edge functions, ensuring low latency for users globally.
*   **Domain Management**: The application is accessible via a secure HTTPS URL provided by Vercel.

![attach image here]
*Figure 4.3: Vercel Deployment Dashboard showing successful build status.*

### 4.3.2 Messaging Deployment (Twilio & WhatsApp)
To reach users without stable internet access or those preferring chat apps, the system was integrated with WhatsApp via **Twilio**.
*   **Webhook Configuration**: The Vercel-hosted API endpoint (`/api/whatsapp`) was registered as the webhook URL in the Twilio Console.
*   **Media Handling**: Twilio's media handling capabilities were configured to forward image attachments to the system's backend for analysis.

![attach image here]
*Figure 4.4: Twilio Console configuration showing the Webhook setup.*

## 4.4 Testing Process
A multi-layered testing strategy was adopted to validate the system's functionality, safety, and user experience.

### 4.4.1 Unit and Functional Testing
Scripts were written to test individual components in isolation.
*   **Image Analysis Testing**: A dedicated script (`test-image-analysis.js`) was used to verify the model's ability to correctly identify injuries from sample images.
*   **Integration Testing**: The `KnowledgeBaseService` was tested to ensure it correctly identifies emergency keywords and retrieves the appropriate injury records.

### 4.4.2 User Acceptance Testing (UAT)
Real-world scenarios were simulated to evaluate the bot's advice.
*   **Emergency Scenarios**: Test users simulated emergencies (e.g., "I am bleeding heavily") to verify that the bot immediately bypasses the AI generation and triggers the hard-coded emergency response.
*   **Ambiguous Queries**: Users tested vague descriptions to observe how the bot asks clarifying questions before providing advice.

![attach image here]
*Figure 4.5: Screenshot of a test conversation showing the bot's response to an emergency.*

## 4.5 Evaluation Metrics
The system's performance was evaluated based on the following qualitative and quantitative metrics suited for Generative AI applications.

### 4.5.1 Retrieval Accuracy
Accessing the "grounding" data is critical. We evaluated how often the `searchInjuries` function retrieved the correct JSON entry for a given user query.
*   **Result**: The keyword-weighted algorithm showed a high success rate for common injury names but required synonym expansion for colloquial terms.

### 4.5.2 Response Latency
Speed is vital in first aid.
*   **Text Queries**: Average response time was ~1.5 seconds.
*   **Image Analysis**: Average processing time was ~3-4 seconds depending on image size.
*   **Emergency Triggers**: Instantaneous (<200ms) due to the local keyword check bypassing the LLM.

### 4.5.3 Safety Compliance
The most critical metric was the system's adherence to safety protocols.
*   **False Negatives**: The rate at which the system failed to identify an emergency. (Zero tolerance target).
*   **Disclaimer Frequency**: Verification that every medical advice response included the necessary medical disclaimers.

![attach image here]
*Figure 4.6: Evaluation chart comparing response times for text vs. image queries.*

## 4.6 Conclusion
The implementation phase successfully delivered a robust, hybrid AI assistance system. By combining the deterministic safety of a structured knowledge base with the generative power of the Gemini model, the system achieves a balance of accuracy and conversational fluidity. The successful deployment on Vercel and integration with WhatsApp demonstrates the system's readiness for real-world usage across multiple platforms.
