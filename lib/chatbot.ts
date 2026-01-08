import { GoogleGenerativeAI } from '@google/generative-ai';
import { KnowledgeBaseService } from './knowledge-base';
import { ConversationContext, Message, ChatResponse, Injury } from './types';
import { generateContextPrompt, RESPONSE_TEMPLATES } from './prompts';
import { v4 as uuidv4 } from 'uuid';

export class FirstAidChatbot {
    private genAI: GoogleGenerativeAI;
    private knowledgeBase: KnowledgeBaseService;
    private conversations: Map<string, ConversationContext>;

    constructor(apiKey: string) {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.knowledgeBase = new KnowledgeBaseService();
        this.conversations = new Map();
    }

    /**
     * Process a user message and generate a response
     */
    async chat(userMessage: string, sessionId?: string): Promise<ChatResponse> {
        // Create or retrieve session
        const sid = sessionId || uuidv4();
        let context = this.conversations.get(sid);

        if (!context) {
            context = {
                sessionId: sid,
                messages: [],
                emergencyDetected: false
            };
            this.conversations.set(sid, context);
        }

        // Check for emergency keywords
        const isEmergency = this.knowledgeBase.checkForEmergency(userMessage);

        if (isEmergency) {
            context.emergencyDetected = true;
            const emergencyResponse = this.knowledgeBase.getEmergencyResponse();

            const assistantMessage: Message = {
                id: uuidv4(),
                role: 'assistant',
                content: emergencyResponse,
                timestamp: new Date(),
                isEmergency: true
            };

            context.messages.push(assistantMessage);

            return {
                message: emergencyResponse,
                isEmergency: true,
                sessionId: sid
            };
        }

        // Search for relevant injuries
        const relevantInjuries = this.knowledgeBase.searchInjuries(userMessage);
        let injuryInfo = '';
        let suggestedInjury: Injury | undefined;

        if (relevantInjuries.length > 0) {
            suggestedInjury = relevantInjuries[0];
            context.currentInjury = suggestedInjury;
            injuryInfo = this.knowledgeBase.formatInjuryInfo(suggestedInjury);
        }

        // Generate AI response
        let aiResponse: string;

        if (relevantInjuries.length === 0 && context.messages.length === 0) {
            // First message and no injury detected - provide greeting
            aiResponse = RESPONSE_TEMPLATES.greeting;
        } else if (relevantInjuries.length === 0) {
            // No relevant injury found
            aiResponse = await this.generateAIResponse(userMessage, '', false, context);
        } else {
            // Found relevant injury information
            aiResponse = await this.generateAIResponse(userMessage, injuryInfo, false, context);
        }

        // Store messages in context
        const userMsg: Message = {
            id: uuidv4(),
            role: 'user',
            content: userMessage,
            timestamp: new Date()
        };

        const assistantMsg: Message = {
            id: uuidv4(),
            role: 'assistant',
            content: aiResponse,
            timestamp: new Date()
        };

        context.messages.push(userMsg, assistantMsg);

        return {
            message: aiResponse,
            isEmergency: false,
            sessionId: sid,
            suggestedInjury
        };
    }

    /**
     * Process a user message with an image and generate a response
     */
    async chatWithImage(
        userMessage: string,
        imageData: Buffer,
        mimeType: string,
        sessionId?: string
    ): Promise<ChatResponse> {
        // Create or retrieve session
        const sid = sessionId || uuidv4();
        let context = this.conversations.get(sid);

        if (!context) {
            context = {
                sessionId: sid,
                messages: [],
                emergencyDetected: false
            };
            this.conversations.set(sid, context);
        }

        try {
            // Convert image to base64
            const base64Image = imageData.toString('base64');

            // Generate AI response with image
            const aiResponse = await this.generateAIResponseWithImage(
                userMessage,
                base64Image,
                mimeType,
                context
            );

            // Store messages in context
            const userMsg: Message = {
                id: uuidv4(),
                role: 'user',
                content: userMessage + ' [Image attached]',
                timestamp: new Date()
            };

            const assistantMsg: Message = {
                id: uuidv4(),
                role: 'assistant',
                content: aiResponse,
                timestamp: new Date()
            };

            context.messages.push(userMsg, assistantMsg);

            return {
                message: aiResponse,
                isEmergency: false,
                sessionId: sid
            };
        } catch (error) {
            console.error('Error processing image chat:', error);
            return {
                message: 'I apologize, but I had trouble analyzing the image. Please try again or describe the situation in text. If this is an emergency, please call emergency services immediately.',
                isEmergency: false,
                sessionId: sid
            };
        }
    }

    /**
     * Generate AI response using Gemini
     */
    private async generateAIResponse(
        userMessage: string,
        injuryInfo: string,
        isEmergency: boolean,
        context: ConversationContext
    ): Promise<string> {
        try {
            const model = this.genAI.getGenerativeModel({
                model: 'gemini-1.5-flash', // Using explicit model version for stability
                generationConfig: {
                    maxOutputTokens: 300, // Limit response length for speed
                    temperature: 0.7,
                }
            });


            // Build conversation history
            const conversationHistory = context.messages.slice(-6); // Last  6 messages for context
            const historyText = conversationHistory.length > 0
                ? '\n\nRecent conversation:\n' + conversationHistory.map(msg =>
                    `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
                ).join('\n')
                : '';

            const prompt = generateContextPrompt(userMessage, injuryInfo, isEmergency) + historyText;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('Error generating AI response:', error);
            console.error('Error details:', error instanceof Error ? error.message : String(error));
            console.error('Full error object:', JSON.stringify(error, null, 2));
            return `I apologize, but I'm having trouble generating a response right now. 

If this is an emergency, please call emergency services immediately (121 or 767).

For non-emergency first-aid guidance, please try rephrasing your question.`;
        }
    }

    /**
     * Generate AI response using Gemini with image input
     */
    private async generateAIResponseWithImage(
        userMessage: string,
        base64Image: string,
        mimeType: string,
        context: ConversationContext
    ): Promise<string> {
        try {
            const model = this.genAI.getGenerativeModel({
                model: 'gemini-1.5-flash',
                generationConfig: {
                    maxOutputTokens: 300,
                    temperature: 0.7,
                }
            });


            // Medical image analysis prompt
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

User's message: ${userMessage || 'Please analyze this image'}

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
            return response.text();
        } catch (error) {
            console.error('Error generating AI response with image:', error);
            return `I apologize, but I couldn't analyze the image. Please try describing the injury in text, or seek professional medical help if needed.`;
        }
    }

    /**
     * Clear conversation history for a session
     */
    clearSession(sessionId: string): void {
        this.conversations.delete(sessionId);
    }

    /**
     * Get conversation context
     */
    getContext(sessionId: string): ConversationContext | undefined {
        return this.conversations.get(sessionId);
    }
}
