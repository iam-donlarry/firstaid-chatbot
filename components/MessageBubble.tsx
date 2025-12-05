'use client';

import { Message } from '@/lib/types';
import styles from './MessageBubble.module.css';

interface MessageBubbleProps {
    message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
    const isUser = message.role === 'user';
    const isEmergency = message.isEmergency;

    return (
        <div className={`${styles.messageWrapper} ${isUser ? styles.userWrapper : styles.assistantWrapper}`}>
            <div className={`${styles.messageBubble} ${isUser ? styles.userBubble : styles.assistantBubble} ${isEmergency ? styles.emergency : ''}`}>
                {!isUser && <div className={styles.avatar}>🏥</div>}
                <div className={styles.messageContent}>
                    {isEmergency && (
                        <div className={styles.emergencyBadge}>⚠️ EMERGENCY</div>
                    )}
                    <p className={styles.messageText}>{message.content}</p>
                    <span className={styles.timestamp}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </div>
        </div>
    );
}
