import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { ConversationState, ConversationSession, ConversationMessage, AIState } from '@/types';
import { storageService } from '@/services/storage/storageService';

type ConversationAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SESSION'; payload: ConversationSession | null }
  | { type: 'ADD_MESSAGE'; payload: ConversationMessage }
  | { type: 'UPDATE_AI_STATE'; payload: Partial<AIState> }
  | { type: 'SET_INPUT_MODE'; payload: 'voice' | 'text' }
  | { type: 'SET_KEYBOARD_VISIBLE'; payload: boolean }
  | { type: 'SET_SHOWING_RESULTS'; payload: boolean }
  | { type: 'SET_SHOWING_HISTORY'; payload: boolean }
  | { type: 'UPDATE_CONTEXT'; payload: Partial<ConversationSession['context']> }
  | { type: 'CLEAR_SESSION' }
  | { type: 'LOAD_SESSION_HISTORY'; payload: ConversationSession[] };

const initialAIState: AIState = {
  isListening: false,
  isProcessing: false,
  isResponding: false,
  voiceEnabled: true,
  speechToTextAvailable: true,
  textToSpeechAvailable: true,
  responseMode: 'auto',
  verbosity: 'concise',
  personalityMode: 'friendly',
};

const initialState: ConversationState = {
  currentSession: null,
  sessionHistory: [],
  aiState: initialAIState,
  settings: {
    autoSaveConversations: true,
    maxHistoryLength: 50,
    voiceTimeout: 30,
    textTimeout: 300,
    enableContextCarryover: true,
  },
  uiState: {
    showingResults: false,
    showingHistory: false,
    inputMode: 'voice',
    keyboardVisible: false,
  },
};

function conversationReducer(
  state: ConversationState,
  action: ConversationAction
): ConversationState {
  switch (action.type) {
    case 'SET_SESSION':
      return {
        ...state,
        currentSession: action.payload,
      };

    case 'ADD_MESSAGE':
      if (!state.currentSession) return state;
      
      const updatedSession = {
        ...state.currentSession,
        messages: [...state.currentSession.messages, action.payload],
        lastActivity: new Date(),
        analytics: {
          ...state.currentSession.analytics,
          totalMessages: state.currentSession.analytics.totalMessages + 1,
          voiceMessages: action.payload.metadata?.source === 'voice' 
            ? state.currentSession.analytics.voiceMessages + 1
            : state.currentSession.analytics.voiceMessages,
          textMessages: action.payload.metadata?.source === 'text'
            ? state.currentSession.analytics.textMessages + 1
            : state.currentSession.analytics.textMessages,
        },
      };

      return {
        ...state,
        currentSession: updatedSession,
      };

    case 'UPDATE_AI_STATE':
      return {
        ...state,
        aiState: {
          ...state.aiState,
          ...action.payload,
        },
      };

    case 'SET_INPUT_MODE':
      return {
        ...state,
        uiState: {
          ...state.uiState,
          inputMode: action.payload,
        },
      };

    case 'SET_KEYBOARD_VISIBLE':
      return {
        ...state,
        uiState: {
          ...state.uiState,
          keyboardVisible: action.payload,
        },
      };

    case 'SET_SHOWING_RESULTS':
      return {
        ...state,
        uiState: {
          ...state.uiState,
          showingResults: action.payload,
        },
      };

    case 'SET_SHOWING_HISTORY':
      return {
        ...state,
        uiState: {
          ...state.uiState,
          showingHistory: action.payload,
        },
      };

    case 'UPDATE_CONTEXT':
      if (!state.currentSession) return state;
      
      return {
        ...state,
        currentSession: {
          ...state.currentSession,
          context: {
            ...state.currentSession.context,
            ...action.payload,
          },
        },
      };

    case 'CLEAR_SESSION':
      return {
        ...state,
        currentSession: null,
        uiState: {
          ...state.uiState,
          showingResults: false,
          showingHistory: false,
        },
      };

    case 'LOAD_SESSION_HISTORY':
      return {
        ...state,
        sessionHistory: action.payload,
      };

    default:
      return state;
  }
}

interface ConversationContextType {
  state: ConversationState;
  startNewSession: (type?: ConversationSession['sessionType']) => Promise<void>;
  addMessage: (content: string, type: 'user' | 'ai', metadata?: any) => Promise<void>;
  updateAIState: (updates: Partial<AIState>) => void;
  setInputMode: (mode: 'voice' | 'text') => void;
  setKeyboardVisible: (visible: boolean) => void;
  setShowingResults: (showing: boolean) => void;
  setShowingHistory: (showing: boolean) => void;
  updateConversationContext: (updates: Partial<ConversationSession['context']>) => void;
  endCurrentSession: () => Promise<void>;
  loadSessionHistory: () => Promise<void>;
  clearAllSessions: () => Promise<void>;
  getSessionById: (id: string) => ConversationSession | undefined;
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

export function ConversationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(conversationReducer, initialState);

  // Load session history on mount
  useEffect(() => {
    loadSessionHistory();
  }, []);

  // Auto-save current session when it changes
  useEffect(() => {
    if (state.currentSession && state.settings.autoSaveConversations) {
      saveCurrentSession();
    }
  }, [state.currentSession]);

  const loadSessionHistory = async () => {
    try {
      const sessions = await storageService.getConversationSessions();
      dispatch({ type: 'LOAD_SESSION_HISTORY', payload: sessions });
    } catch (error) {
      console.error('Failed to load session history:', error);
    }
  };

  const saveCurrentSession = async () => {
    if (!state.currentSession) return;
    
    try {
      await storageService.saveConversationSession(state.currentSession);
    } catch (error) {
      console.error('Failed to save current session:', error);
    }
  };

  const startNewSession = async (type: ConversationSession['sessionType'] = 'search') => {
    try {
      // End current session if exists
      if (state.currentSession) {
        await endCurrentSession();
      }

      const newSession: ConversationSession = {
        id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        startTime: new Date(),
        lastActivity: new Date(),
        isActive: true,
        messages: [],
        context: {
          extractedPreferences: {
            frequentDestinations: [],
          },
          conversationFlow: {
            currentIntent: 'greeting',
            missingInformation: [],
            lastUserRequest: '',
            suggestedFollowUps: [],
          },
        },
        sessionType: type,
        interactionMode: state.uiState.inputMode,
        analytics: {
          totalMessages: 0,
          voiceMessages: 0,
          textMessages: 0,
          averageResponseTime: 0,
          taskCompleted: false,
        },
      };

      dispatch({ type: 'SET_SESSION', payload: newSession });
      
    } catch (error) {
      console.error('Failed to start new session:', error);
      throw error;
    }
  };

  const addMessage = async (
    content: string, 
    type: 'user' | 'ai', 
    metadata?: any
  ) => {
    try {
      if (!state.currentSession) {
        await startNewSession();
      }

      const message: ConversationMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        content,
        timestamp: new Date(),
        metadata: {
          source: state.uiState.inputMode,
          processed: false,
          ...metadata,
        },
      };

      dispatch({ type: 'ADD_MESSAGE', payload: message });
      
    } catch (error) {
      console.error('Failed to add message:', error);
      throw error;
    }
  };

  const updateAIState = (updates: Partial<AIState>) => {
    dispatch({ type: 'UPDATE_AI_STATE', payload: updates });
  };

  const setInputMode = (mode: 'voice' | 'text') => {
    dispatch({ type: 'SET_INPUT_MODE', payload: mode });
  };

  const setKeyboardVisible = (visible: boolean) => {
    dispatch({ type: 'SET_KEYBOARD_VISIBLE', payload: visible });
  };

  const setShowingResults = (showing: boolean) => {
    dispatch({ type: 'SET_SHOWING_RESULTS', payload: showing });
  };

  const setShowingHistory = (showing: boolean) => {
    dispatch({ type: 'SET_SHOWING_HISTORY', payload: showing });
  };

  const updateConversationContext = (updates: Partial<ConversationSession['context']>) => {
    dispatch({ type: 'UPDATE_CONTEXT', payload: updates });
  };

  const endCurrentSession = async () => {
    try {
      if (state.currentSession) {
        const finalSession = {
          ...state.currentSession,
          isActive: false,
          lastActivity: new Date(),
        };

        await storageService.saveConversationSession(finalSession);
        
        // Add to history
        const updatedHistory = [finalSession, ...state.sessionHistory].slice(0, state.settings.maxHistoryLength);
        dispatch({ type: 'LOAD_SESSION_HISTORY', payload: updatedHistory });
      }

      dispatch({ type: 'CLEAR_SESSION' });
      
    } catch (error) {
      console.error('Failed to end session:', error);
      throw error;
    }
  };

  const clearAllSessions = async () => {
    try {
      await storageService.clearConversationHistory();
      dispatch({ type: 'CLEAR_SESSION' });
      dispatch({ type: 'LOAD_SESSION_HISTORY', payload: [] });
    } catch (error) {
      console.error('Failed to clear all sessions:', error);
      throw error;
    }
  };

  const getSessionById = (id: string): ConversationSession | undefined => {
    if (state.currentSession?.id === id) {
      return state.currentSession;
    }
    return state.sessionHistory.find(session => session.id === id);
  };

  const contextValue: ConversationContextType = {
    state,
    startNewSession,
    addMessage,
    updateAIState,
    setInputMode,
    setKeyboardVisible,
    setShowingResults,
    setShowingHistory,
    updateConversationContext,
    endCurrentSession,
    loadSessionHistory,
    clearAllSessions,
    getSessionById,
  };

  return (
    <ConversationContext.Provider value={contextValue}>
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversation() {
  const context = useContext(ConversationContext);
  if (context === undefined) {
    throw new Error('useConversation must be used within a ConversationProvider');
  }
  return context;
}