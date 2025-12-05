'use client';

import { useState, useRef, useEffect } from 'react';
import { Message } from '@/lib/types';
import MessageBubble from './MessageBubble';
import LoadingIndicator from './LoadingIndicator';
import styles from './ChatInterface.module.css';

export default function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string>('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: input,
                    sessionId: sessionId || undefined
                })
            });

            const data = await response.json();

            if (response.ok) {
                if (!sessionId) {
                    setSessionId(data.sessionId);
                }

                const assistantMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: data.message,
                    timestamp: new Date(),
                    isEmergency: data.isEmergency
                };

                setMessages(prev => [...prev, assistantMessage]);
            } else {
                const errorMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: data.message || 'Sorry, I encountered an error. Please try again.',
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, errorMessage]);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Sorry, I could not connect to the server. If this is an emergency, please call emergency services immediately.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.chatContainer}>
            <div className={styles.messagesContainer}>
                {messages.length === 0 && (
                    <div className={styles.emptyState}>
                        <h2>👋 Hello! I'm here to help with first-aid guidance.</h2>
                        <p>Describe your situation or injury, and I'll provide step-by-step assistance.</p>
                        <div className={styles.exampleQuestions}>
                            <p><strong>Try asking:</strong></p>
                            <ul>
                                <li>"How do I treat a minor cut?"</li>
                                <li>"Someone burned their hand"</li>
                                <li>"My child has a nosebleed"</li>
                                <li>"How to treat a bee sting?"</li>
                            </ul>
                        </div>
                    </div>
                )}

                {messages.map(message => (
                    <MessageBubble key={message.id} message={message} />
                ))}

                {isLoading && <LoadingIndicator />}

                <div ref={messagesEndRef} />
            </div>

            <form className={styles.inputForm} onSubmit={sendMessage}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Describe the injury or situation..."
                    className={styles.input}
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    className={styles.sendButton}
                    disabled={isLoading || !input.trim()}
                >
                    Send
                </button>
            </form>
        </div>
    );
}
