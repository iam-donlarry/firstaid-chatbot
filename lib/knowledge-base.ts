import fs from 'fs';
import path from 'path';
import { KnowledgeBase, Injury, EmergencyKeywords } from './types';

export class KnowledgeBaseService {
    private knowledgeBase: KnowledgeBase;
    private emergencyKeywords: EmergencyKeywords;

    constructor() {
        // Load knowledge base from JSON file
        const kbPath = path.join(process.cwd(), 'data', 'first_aid_knowledge.json');
        const emergencyPath = path.join(process.cwd(), 'data', 'emergency_keywords.json');

        this.knowledgeBase = JSON.parse(fs.readFileSync(kbPath, 'utf-8'));
        this.emergencyKeywords = JSON.parse(fs.readFileSync(emergencyPath, 'utf-8'));
    }

    /**
     * Search for relevant injuries based on user query
     */
    searchInjuries(query: string): Injury[] {
        const lowerQuery = query.toLowerCase();
        const matches: Array<{ injury: Injury; score: number }> = [];

        for (const injury of this.knowledgeBase.injuries) {
            let score = 0;

            // Check keywords
            for (const keyword of injury.keywords) {
                if (lowerQuery.includes(keyword.toLowerCase())) {
                    score += 10;
                }
            }

            // Check injury name
            if (lowerQuery.includes(injury.name.toLowerCase())) {
                score += 15;
            }

            // Check symptoms
            for (const symptom of injury.symptoms) {
                if (lowerQuery.includes(symptom.toLowerCase())) {
                    score += 5;
                }
            }

            if (score > 0) {
                matches.push({ injury, score });
            }
        }

        // Sort by score and return top matches
        matches.sort((a, b) => b.score - a.score);
        return matches.slice(0, 3).map(m => m.injury);
    }

    /**
     * Check if query contains emergency keywords
     */
    checkForEmergency(query: string): boolean {
        const lowerQuery = query.toLowerCase();
        return this.emergencyKeywords.critical_keywords.some(keyword =>
            lowerQuery.includes(keyword.toLowerCase())
        );
    }

    /**
     * Get emergency response message
     */
    getEmergencyResponse(): string {
        return this.emergencyKeywords.emergency_response.message;
    }

    /**
     * Get specific injury by ID
     */
    getInjuryById(id: string): Injury | undefined {
        return this.knowledgeBase.injuries.find(injury => injury.id === id);
    }

    /**
     * Get all injuries
     */
    getAllInjuries(): Injury[] {
        return this.knowledgeBase.injuries;
    }

    /**
       * Get general disclaimer
       */
    getDisclaimer(): string {
        return this.knowledgeBase.general_disclaimer;
    }

    /**
     * Format injury information for display
     */
    formatInjuryInfo(injury: Injury): string {
        let info = `**${injury.name}** (Severity: ${injury.severity})\n\n`;

        info += '**Symptoms:**\n';
        injury.symptoms.forEach((symptom, index) => {
            info += `${index + 1}. ${symptom}\n`;
        });

        info += '\n**First Aid Steps:**\n';
        injury.first_aid_steps.forEach(step => {
            info += `${step.step}. ${step.instruction}\n`;
        });

        if (injury.emergency_triggers.length > 0) {
            info += '\n⚠️ **Seek Emergency Help If:**\n';
            injury.emergency_triggers.forEach(trigger => {
                info += `• ${trigger}\n`;
            });
        }

        return info;
    }
}
