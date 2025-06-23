export interface ConversationMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  
  // For voice messages
  audioData?: {
    duration: number; // in seconds
    transcript: string;
    confidence: number; // 0-1
    audioUrl?: string; // for playback
  };
  
  // For AI responses
  aiData?: {
    intent: string; // e.g., "search_flights", "update_preferences", "clarification"
    confidence: number; // 0-1
    entities: {
      [key: string]: any; // extracted entities like dates, locations, etc.
    };
    suggestions?: string[]; // follow-up suggestions
  };
  
  // Message metadata
  metadata?: {
    source: 'voice' | 'text' | 'suggestion';
    processed: boolean;
    error?: string;
  };
}

export interface ConversationContext {
  // Current search context
  currentSearch?: {
    origin?: string;
    destination?: string;
    departureDate?: Date;
    returnDate?: Date;
    passengers?: {
      adults: number;
      children: number;
      infants: number;
    };
    preferences?: {
      cabin?: string;
      maxStops?: number;
      budget?: { min: number; max: number };
    };
    isComplete: boolean;
  };
  
  // User preferences extracted from conversation
  extractedPreferences: {
    homeLocation?: string;
    frequentDestinations: string[];
    budgetRange?: { min: number; max: number };
    travelStyle?: string; // e.g., "business", "leisure", "budget"
    timePreferences?: {
      preferredDepartureTime?: string;
      flexibleDates?: boolean;
    };
    companionInfo?: {
      travelsWithFamily?: boolean;
      businessTravel?: boolean;
      usualGroupSize?: number;
    };
  };
  
  // Conversation flow state
  conversationFlow: {
    currentIntent: string; // e.g., "collecting_search_params", "showing_results", "booking"
    missingInformation: string[]; // e.g., ["destination", "departure_date"]
    clarificationNeeded?: string;
    lastUserRequest: string;
    suggestedFollowUps: string[];
  };
}

export interface ConversationSession {
  id: string;
  startTime: Date;
  lastActivity: Date;
  isActive: boolean;
  
  messages: ConversationMessage[];
  context: ConversationContext;
  
  // Session metadata
  sessionType: 'search' | 'booking' | 'preferences' | 'general';
  interactionMode: 'voice' | 'text' | 'mixed';
  
  // Analytics
  analytics: {
    totalMessages: number;
    voiceMessages: number;
    textMessages: number;
    averageResponseTime: number; // in ms
    userSatisfaction?: number; // 1-5 rating
    taskCompleted: boolean;
    conversionType?: 'search' | 'booking' | 'abandoned';
  };
}

export interface AIState {
  // Processing state
  isListening: boolean;
  isProcessing: boolean;
  isResponding: boolean;
  
  // Current capabilities
  voiceEnabled: boolean;
  speechToTextAvailable: boolean;
  textToSpeechAvailable: boolean;
  
  // AI behavior settings
  responseMode: 'voice' | 'text' | 'auto';
  verbosity: 'concise' | 'detailed';
  personalityMode: 'professional' | 'friendly' | 'casual';
  
  // Error handling
  lastError?: {
    type: 'speech_recognition' | 'processing' | 'network' | 'permission';
    message: string;
    timestamp: Date;
    resolved: boolean;
  };
}

export interface ConversationState {
  currentSession: ConversationSession | null;
  sessionHistory: ConversationSession[];
  aiState: AIState;
  
  // Global conversation settings
  settings: {
    autoSaveConversations: boolean;
    maxHistoryLength: number;
    voiceTimeout: number; // seconds
    textTimeout: number; // seconds
    enableContextCarryover: boolean;
  };
  
  // Current UI state
  uiState: {
    showingResults: boolean;
    showingHistory: boolean;
    inputMode: 'voice' | 'text';
    keyboardVisible: boolean;
  };
}