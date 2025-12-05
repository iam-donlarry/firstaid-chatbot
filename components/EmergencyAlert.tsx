'use client';

import styles from './EmergencyAlert.module.css';

export default function EmergencyAlert() {
    return (
        <div className={styles.emergencyBanner}>
            <div className={styles.content}>
                <span className={styles.icon}>🚨</span>
                <div className={styles.text}>
                    <strong>Life-Threatening Emergency?</strong>
                    <span> Call Emergency Services: 767 or 112</span>
                </div>
            </div>
        </div>
    );
}
