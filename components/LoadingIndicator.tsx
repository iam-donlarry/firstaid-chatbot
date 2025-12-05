'use client';

import styles from './LoadingIndicator.module.css';

export default function LoadingIndicator() {
    return (
        <div className={styles.loadingWrapper}>
            <div className={styles.loadingBubble}>
                <div className={styles.avatar}>🏥</div>
                <div className={styles.typingIndicator}>
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        </div>
    );
}
