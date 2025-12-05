// Type definitions for the chatbot application

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isEmergency?: boolean;
}

export interface FirstAidStep {
  step: number;
  instruction: string;
}

export interface Injury {
  id: string;
  name: string;
  keywords: string[];
  severity: 'minor' | 'moderate' | 'serious' | 'emergency';
  symptoms: string[];
  first_aid_steps: FirstAidStep[];
  emergency_triggers: string[];
  prevention_tips: string[];
}

export interface KnowledgeBase {
  injuries: Injury[];
  emergency_numbers: {
    general: string;
    poison_control_us?: string;
    disclaimer: string;
  };
  general_disclaimer: string;
}

export interface EmergencyKeywords {
  critical_keywords: string[];
  emergency_response: {
    message: string;
  };
}

export interface ConversationContext {
  sessionId: string;
  messages: Message[];
  currentInjury?: Injury;
  emergencyDetected: boolean;
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
}

export interface ChatResponse {
  message: string;
  isEmergency: boolean;
  sessionId: string;
  suggestedInjury?: Injury;
}
