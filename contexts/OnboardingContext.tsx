import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { TravelPreferences, AIPersonalizationSettings, NotificationPreferences } from '@/types/UserPreferences';

interface OnboardingData {
  homeAirport?: string;
  travelStyle?: {
    flexibility: 'rigid' | 'somewhat_flexible' | 'very_flexible';
    preferredCabin: 'economy' | 'premium_economy' | 'business' | 'first';
    budgetRange: { min: number; max: number; currency: string };
  };
  preferences?: {
    preferredAirlines: string[];
    avoidedAirlines: string[];
    maxStops: number;
    preferredDepartureTime: { earliest: string; latest: string };
    seatPreferences: {
      window: boolean;
      aisle: boolean;
      middle: boolean;
      front: boolean;
      emergency_exit: boolean;
    };
  };
  aiSettings?: AIPersonalizationSettings;
  notificationSettings?: NotificationPreferences;
}

interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  data: OnboardingData;
  isComplete: boolean;
}

type OnboardingAction =
  | { type: 'SET_HOME_AIRPORT'; payload: string }
  | { type: 'SET_TRAVEL_STYLE'; payload: OnboardingData['travelStyle'] }
  | { type: 'SET_PREFERENCES'; payload: OnboardingData['preferences'] }
  | { type: 'SET_AI_SETTINGS'; payload: AIPersonalizationSettings }
  | { type: 'SET_NOTIFICATION_SETTINGS'; payload: NotificationPreferences }
  | { type: 'NEXT_STEP' }
  | { type: 'PREVIOUS_STEP' }
  | { type: 'RESET_ONBOARDING' }
  | { type: 'COMPLETE_ONBOARDING' };

const initialState: OnboardingState = {
  currentStep: 0,
  totalSteps: 5,
  data: {},
  isComplete: false,
};

function onboardingReducer(state: OnboardingState, action: OnboardingAction): OnboardingState {
  switch (action.type) {
    case 'SET_HOME_AIRPORT':
      return {
        ...state,
        data: { ...state.data, homeAirport: action.payload },
      };
    
    case 'SET_TRAVEL_STYLE':
      return {
        ...state,
        data: { ...state.data, travelStyle: action.payload },
      };
    
    case 'SET_PREFERENCES':
      return {
        ...state,
        data: { ...state.data, preferences: action.payload },
      };
    
    case 'SET_AI_SETTINGS':
      return {
        ...state,
        data: { ...state.data, aiSettings: action.payload },
      };
    
    case 'SET_NOTIFICATION_SETTINGS':
      return {
        ...state,
        data: { ...state.data, notificationSettings: action.payload },
      };
    
    case 'NEXT_STEP':
      return {
        ...state,
        currentStep: Math.min(state.currentStep + 1, state.totalSteps),
      };
    
    case 'PREVIOUS_STEP':
      return {
        ...state,
        currentStep: Math.max(state.currentStep - 1, 0),
      };
    
    case 'COMPLETE_ONBOARDING':
      return {
        ...state,
        isComplete: true,
      };
    
    case 'RESET_ONBOARDING':
      return initialState;
    
    default:
      return state;
  }
}

const OnboardingContext = createContext<{
  state: OnboardingState;
  dispatch: React.Dispatch<OnboardingAction>;
} | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(onboardingReducer, initialState);

  return (
    <OnboardingContext.Provider value={{ state, dispatch }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}

// Helper hooks for specific actions
export function useOnboardingActions() {
  const { dispatch } = useOnboarding();

  return {
    setHomeAirport: (airport: string) => 
      dispatch({ type: 'SET_HOME_AIRPORT', payload: airport }),
    
    setTravelStyle: (style: OnboardingData['travelStyle']) => 
      dispatch({ type: 'SET_TRAVEL_STYLE', payload: style }),
    
    setPreferences: (preferences: OnboardingData['preferences']) => 
      dispatch({ type: 'SET_PREFERENCES', payload: preferences }),
    
    setAISettings: (settings: AIPersonalizationSettings) => 
      dispatch({ type: 'SET_AI_SETTINGS', payload: settings }),
    
    setNotificationSettings: (settings: NotificationPreferences) => 
      dispatch({ type: 'SET_NOTIFICATION_SETTINGS', payload: settings }),
    
    nextStep: () => dispatch({ type: 'NEXT_STEP' }),
    previousStep: () => dispatch({ type: 'PREVIOUS_STEP' }),
    completeOnboarding: () => dispatch({ type: 'COMPLETE_ONBOARDING' }),
    resetOnboarding: () => dispatch({ type: 'RESET_ONBOARDING' }),
  };
}