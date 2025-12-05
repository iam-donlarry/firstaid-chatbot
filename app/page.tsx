import ChatInterface from '@/components/ChatInterface';
import EmergencyAlert from '@/components/EmergencyAlert';
import styles from './page.module.css';

export default function Home() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Safety Buddy First Aid Assistant</h1>
        <p className={styles.subtitle}>
          Your First Aid Assistant. Immediate guidance for common domestic accidents
        </p>
      </header>

      <EmergencyAlert />

      <main className={styles.main}>
        <div className={styles.disclaimer}>
          <p>
            <strong>Important:</strong> This chatbot provides first-aid guidance only.
            For life-threatening emergencies, call emergency services immediately.
          </p>
        </div>

        <ChatInterface />
      </main>

      <footer className={styles.footer}>
        <p>© 2025 Safety Buddy Chatbot | Not a substitute for professional medical care</p>
      </footer>
    </div>
  );
}

