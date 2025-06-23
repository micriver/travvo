import React, { ReactNode } from 'react';
import { UserPreferencesProvider } from './UserPreferencesContext';
import { ConversationProvider } from './ConversationContext';
import { OnboardingProvider } from './OnboardingContext';

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  return (
    <UserPreferencesProvider>
      <ConversationProvider>
        <OnboardingProvider>
          {children}
        </OnboardingProvider>
      </ConversationProvider>
    </UserPreferencesProvider>
  );
}