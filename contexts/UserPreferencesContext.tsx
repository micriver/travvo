import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { UserProfile, UserPreferencesState, TravelPreferences } from '@/types';
import { storageService } from '@/services/storage/storageService';

type UserPreferencesAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PROFILE'; payload: UserProfile | null }
  | { type: 'UPDATE_PROFILE'; payload: Partial<UserProfile> }
  | { type: 'UPDATE_TRAVEL_PREFERENCES'; payload: Partial<TravelPreferences> }
  | { type: 'SET_ONBOARDING_COMPLETE'; payload: boolean }
  | { type: 'SET_ONBOARDING_STEP'; payload: number }
  | { type: 'CLEAR_PROFILE' };

const initialState: UserPreferencesState = {
  profile: null,
  isLoading: false,
  error: null,
  hasCompletedOnboarding: false,
  currentOnboardingStep: 0,
};

function userPreferencesReducer(
  state: UserPreferencesState,
  action: UserPreferencesAction
): UserPreferencesState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'SET_PROFILE':
      return {
        ...state,
        profile: action.payload,
        isLoading: false,
        error: null,
        hasCompletedOnboarding: !!action.payload,
      };
    
    case 'UPDATE_PROFILE':
      if (!state.profile) return state;
      return {
        ...state,
        profile: {
          ...state.profile,
          ...action.payload,
          lastUpdated: new Date(),
        },
      };
    
    case 'UPDATE_TRAVEL_PREFERENCES':
      if (!state.profile) return state;
      return {
        ...state,
        profile: {
          ...state.profile,
          travelPreferences: {
            ...state.profile.travelPreferences,
            ...action.payload,
          },
          lastUpdated: new Date(),
        },
      };
    
    case 'SET_ONBOARDING_COMPLETE':
      return {
        ...state,
        hasCompletedOnboarding: action.payload,
        currentOnboardingStep: action.payload ? -1 : 0,
      };
    
    case 'SET_ONBOARDING_STEP':
      return {
        ...state,
        currentOnboardingStep: action.payload,
      };
    
    case 'CLEAR_PROFILE':
      return {
        ...initialState,
      };
    
    default:
      return state;
  }
}

interface UserPreferencesContextType {
  state: UserPreferencesState;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updateTravelPreferences: (preferences: Partial<TravelPreferences>) => Promise<void>;
  createProfile: (profileData: Omit<UserProfile, 'id' | 'createdAt' | 'lastUpdated'>) => Promise<void>;
  clearProfile: () => Promise<void>;
  setOnboardingStep: (step: number) => void;
  completeOnboarding: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(userPreferencesReducer, initialState);

  // Load user profile on mount
  useEffect(() => {
    loadUserProfile();
  }, []);

  // Save profile to storage whenever it changes
  useEffect(() => {
    if (state.profile) {
      saveProfileToStorage(state.profile);
    }
  }, [state.profile]);

  const loadUserProfile = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const [profile, onboardingStatus] = await Promise.all([
        storageService.getUserProfile(),
        storageService.getOnboardingStatus(),
      ]);

      dispatch({ type: 'SET_PROFILE', payload: profile });
      dispatch({ type: 'SET_ONBOARDING_COMPLETE', payload: onboardingStatus.isComplete });
      
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load user profile' });
      console.error('Failed to load user profile:', error);
    }
  };

  const saveProfileToStorage = async (profile: UserProfile) => {
    try {
      await storageService.saveUserProfile(profile);
    } catch (error) {
      console.error('Failed to save profile to storage:', error);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      dispatch({ type: 'UPDATE_PROFILE', payload: updates });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update profile' });
      console.error('Failed to update profile:', error);
      throw error;
    }
  };

  const updateTravelPreferences = async (preferences: Partial<TravelPreferences>) => {
    try {
      dispatch({ type: 'UPDATE_TRAVEL_PREFERENCES', payload: preferences });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update travel preferences' });
      console.error('Failed to update travel preferences:', error);
      throw error;
    }
  };

  const createProfile = async (profileData: Omit<UserProfile, 'id' | 'createdAt' | 'lastUpdated'>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const newProfile: UserProfile = {
        ...profileData,
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        lastUpdated: new Date(),
      };

      dispatch({ type: 'SET_PROFILE', payload: newProfile });
      await storageService.saveUserProfile(newProfile);
      
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create profile' });
      console.error('Failed to create profile:', error);
      throw error;
    }
  };

  const clearProfile = async () => {
    try {
      await storageService.clearUserProfile();
      await storageService.setOnboardingComplete(false);
      dispatch({ type: 'CLEAR_PROFILE' });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to clear profile' });
      console.error('Failed to clear profile:', error);
      throw error;
    }
  };

  const setOnboardingStep = (step: number) => {
    dispatch({ type: 'SET_ONBOARDING_STEP', payload: step });
  };

  const completeOnboarding = async () => {
    try {
      await storageService.setOnboardingComplete(true);
      dispatch({ type: 'SET_ONBOARDING_COMPLETE', payload: true });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to complete onboarding' });
      console.error('Failed to complete onboarding:', error);
      throw error;
    }
  };

  const refreshProfile = async () => {
    await loadUserProfile();
  };

  const contextValue: UserPreferencesContextType = {
    state,
    updateProfile,
    updateTravelPreferences,
    createProfile,
    clearProfile,
    setOnboardingStep,
    completeOnboarding,
    refreshProfile,
  };

  return (
    <UserPreferencesContext.Provider value={contextValue}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (context === undefined) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  }
  return context;
}