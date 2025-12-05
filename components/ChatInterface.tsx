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
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [mimeType, setMimeType] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, previewUrl]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                alert('Image size should be less than 5MB');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                // Extract base64 data (remove "data:image/jpeg;base64," prefix)
                const base64Data = base64String.split(',')[1];

                setSelectedImage(base64Data);
                setPreviewUrl(base64String);
                setMimeType(file.type);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setSelectedImage(null);
        setPreviewUrl(null);
        setMimeType(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        if ((!input.trim() && !selectedImage) || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input + (selectedImage ? ' [Image attached]' : ''),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);

        // Store current input and image before clearing
        const currentInput = input;
        const currentImage = selectedImage;
        const currentMimeType = mimeType;

        setInput('');
        removeImage(); // Clear image preview immediately
        setIsLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: currentInput,
                    sessionId: sessionId || undefined,
                    image: currentImage,
                    mimeType: currentMimeType
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

            <div className={styles.inputContainer}>
                {previewUrl && (
                    <div className={styles.imagePreview}>
                        <img src={previewUrl} alt="Selected" />
                        <button
                            type="button"
                            onClick={removeImage}
                            className={styles.removeImageButton}
                            aria-label="Remove image"
                        >
                            ×
                        </button>
                    </div>
                )}

                <form className={styles.inputForm} onSubmit={sendMessage}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="image/*"
                        style={{ display: 'none' }}
                        id="image-upload"
                    />

                    <button
                        type="button"
                        className={styles.attachButton}
                        onClick={() => fileInputRef.current?.click()}
                        title="Attach image"
                        disabled={isLoading}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                        </svg>
                    </button>

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
                        disabled={isLoading || (!input.trim() && !selectedImage)}
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
}
