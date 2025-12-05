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
     * Generate AI response using Gemini
     */
    private async generateAIResponse(
        userMessage: string,
        injuryInfo: string,
        isEmergency: boolean,
        context: ConversationContext
    ): Promise<string> {
        try {
            const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

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
            return `I apologize, but I'm having trouble generating a response right now. 

If this is an emergency, please call emergency services immediately (911 in US, 999 in UK, 112 in EU).

For non-emergency first-aid guidance, please try rephrasing your question.`;
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
