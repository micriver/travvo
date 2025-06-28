import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, ConversationSession } from '@/types';

export class StorageService {
  private static readonly KEYS = {
    USER_PROFILE: '@travel_app/user_profile',
    CONVERSATION_SESSIONS: '@travel_app/conversation_sessions',
    ONBOARDING_STATUS: '@travel_app/onboarding_status',
    APP_PREFERENCES: '@travel_app/app_preferences',
    SEARCH_HISTORY: '@travel_app/search_history',
  } as const;

  // User Profile Methods
  async saveUserProfile(profile: UserProfile): Promise<void> {
    try {
      const serialized = JSON.stringify({
        ...profile,
        lastUpdated: new Date().toISOString(),
      });
      await AsyncStorage.setItem(StorageService.KEYS.USER_PROFILE, serialized);
    } catch (error) {
      console.error('Failed to save user profile:', error);
      throw new Error('Failed to save user profile');
    }
  }

  async getUserProfile(): Promise<UserProfile | null> {
    try {
      const serialized = await AsyncStorage.getItem(StorageService.KEYS.USER_PROFILE);
      if (!serialized) return null;

      const parsed = JSON.parse(serialized);
      
      // Convert date strings back to Date objects
      return {
        ...parsed,
        createdAt: new Date(parsed.createdAt),
        lastUpdated: new Date(parsed.lastUpdated),
        dateOfBirth: parsed.dateOfBirth ? new Date(parsed.dateOfBirth) : undefined,
        travelDocuments: {
          ...parsed.travelDocuments,
          passportExpiry: parsed.travelDocuments?.passportExpiry 
            ? new Date(parsed.travelDocuments.passportExpiry) 
            : undefined,
        },
        analytics: {
          ...parsed.analytics,
          lastActiveDate: new Date(parsed.analytics.lastActiveDate),
        },
      };
    } catch (error) {
      console.error('Failed to load user profile:', error);
      return null;
    }
  }

  async clearUserProfile(): Promise<void> {
    try {
      await AsyncStorage.removeItem(StorageService.KEYS.USER_PROFILE);
    } catch (error) {
      console.error('Failed to clear user profile:', error);
      throw new Error('Failed to clear user profile');
    }
  }

  // Conversation Sessions Methods
  async saveConversationSession(session: ConversationSession): Promise<void> {
    try {
      const existingSessions = await this.getConversationSessions();
      const updatedSessions = existingSessions.filter(s => s.id !== session.id);
      updatedSessions.unshift(session); // Add to beginning

      // Keep only last 50 sessions
      const limitedSessions = updatedSessions.slice(0, 50);

      const serialized = JSON.stringify(limitedSessions.map(s => ({
        ...s,
        startTime: s.startTime.toISOString(),
        lastActivity: s.lastActivity.toISOString(),
        messages: s.messages.map(m => ({
          ...m,
          timestamp: m.timestamp.toISOString(),
        })),
      })));

      await AsyncStorage.setItem(StorageService.KEYS.CONVERSATION_SESSIONS, serialized);
    } catch (error) {
      console.error('Failed to save conversation session:', error);
      throw new Error('Failed to save conversation session');
    }
  }

  async getConversationSessions(): Promise<ConversationSession[]> {
    try {
      const serialized = await AsyncStorage.getItem(StorageService.KEYS.CONVERSATION_SESSIONS);
      if (!serialized) return [];

      const parsed = JSON.parse(serialized);
      
      return parsed.map((session: any) => ({
        ...session,
        startTime: new Date(session.startTime),
        lastActivity: new Date(session.lastActivity),
        messages: session.messages.map((message: any) => ({
          ...message,
          timestamp: new Date(message.timestamp),
        })),
      }));
    } catch (error) {
      console.error('Failed to load conversation sessions:', error);
      return [];
    }
  }

  async clearConversationHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(StorageService.KEYS.CONVERSATION_SESSIONS);
    } catch (error) {
      console.error('Failed to clear conversation history:', error);
      throw new Error('Failed to clear conversation history');
    }
  }

  // Onboarding Status Methods
  async setOnboardingComplete(isComplete: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(
        StorageService.KEYS.ONBOARDING_STATUS,
        JSON.stringify({ isComplete, completedAt: new Date().toISOString() })
      );
    } catch (error) {
      console.error('Failed to save onboarding status:', error);
      throw new Error('Failed to save onboarding status');
    }
  }

  async getOnboardingStatus(): Promise<{ isComplete: boolean; completedAt?: Date }> {
    try {
      const serialized = await AsyncStorage.getItem(StorageService.KEYS.ONBOARDING_STATUS);
      if (!serialized) return { isComplete: false };

      const parsed = JSON.parse(serialized);
      return {
        isComplete: parsed.isComplete,
        completedAt: parsed.completedAt ? new Date(parsed.completedAt) : undefined,
      };
    } catch (error) {
      console.error('Failed to load onboarding status:', error);
      return { isComplete: false };
    }
  }

  // App Preferences Methods
  async saveAppPreferences(preferences: {
    preferredInteractionMode: 'voice' | 'text';
    theme: 'light' | 'dark' | 'auto';
    notifications: boolean;
    analytics: boolean;
  }): Promise<void> {
    try {
      await AsyncStorage.setItem(
        StorageService.KEYS.APP_PREFERENCES,
        JSON.stringify(preferences)
      );
    } catch (error) {
      console.error('Failed to save app preferences:', error);
      throw new Error('Failed to save app preferences');
    }
  }

  async getAppPreferences(): Promise<{
    preferredInteractionMode: 'voice' | 'text';
    theme: 'light' | 'dark' | 'auto';
    notifications: boolean;
    analytics: boolean;
  }> {
    try {
      const serialized = await AsyncStorage.getItem(StorageService.KEYS.APP_PREFERENCES);
      if (!serialized) {
        return {
          preferredInteractionMode: 'voice',
          theme: 'dark',
          notifications: true,
          analytics: true,
        };
      }

      return JSON.parse(serialized);
    } catch (error) {
      console.error('Failed to load app preferences:', error);
      return {
        preferredInteractionMode: 'voice',
        theme: 'dark',
        notifications: true,
        analytics: true,
      };
    }
  }

  // Search History Methods
  async saveSearchHistory(searches: {
    id: string;
    origin: string;
    destination: string;
    departureDate: Date;
    returnDate?: Date;
    timestamp: Date;
  }[]): Promise<void> {
    try {
      const serialized = JSON.stringify(searches.map(search => ({
        ...search,
        departureDate: search.departureDate.toISOString(),
        returnDate: search.returnDate?.toISOString(),
        timestamp: search.timestamp.toISOString(),
      })));

      await AsyncStorage.setItem(StorageService.KEYS.SEARCH_HISTORY, serialized);
    } catch (error) {
      console.error('Failed to save search history:', error);
      throw new Error('Failed to save search history');
    }
  }

  async getSearchHistory(): Promise<{
    id: string;
    origin: string;
    destination: string;
    departureDate: Date;
    returnDate?: Date;
    timestamp: Date;
  }[]> {
    try {
      const serialized = await AsyncStorage.getItem(StorageService.KEYS.SEARCH_HISTORY);
      if (!serialized) return [];

      const parsed = JSON.parse(serialized);
      return parsed.map((search: any) => ({
        ...search,
        departureDate: new Date(search.departureDate),
        returnDate: search.returnDate ? new Date(search.returnDate) : undefined,
        timestamp: new Date(search.timestamp),
      }));
    } catch (error) {
      console.error('Failed to load search history:', error);
      return [];
    }
  }

  // Utility Methods
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        StorageService.KEYS.USER_PROFILE,
        StorageService.KEYS.CONVERSATION_SESSIONS,
        StorageService.KEYS.ONBOARDING_STATUS,
        StorageService.KEYS.APP_PREFERENCES,
        StorageService.KEYS.SEARCH_HISTORY,
      ]);
    } catch (error) {
      console.error('Failed to clear all data:', error);
      throw new Error('Failed to clear all data');
    }
  }

  async getStorageSize(): Promise<{ [key: string]: number }> {
    try {
      const keys = Object.values(StorageService.KEYS);
      const items = await AsyncStorage.multiGet(keys);
      
      const sizes: { [key: string]: number } = {};
      for (const [key, value] of items) {
        sizes[key] = value ? new Blob([value]).size : 0;
      }
      
      return sizes;
    } catch (error) {
      console.error('Failed to get storage size:', error);
      return {};
    }
  }

  // Generic data methods for other services
  async getData(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error(`Failed to get data for key ${key}:`, error);
      return null;
    }
  }

  async saveData(key: string, data: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, data);
    } catch (error) {
      console.error(`Failed to save data for key ${key}:`, error);
      throw new Error(`Failed to save data for key ${key}`);
    }
  }
}

export const storageService = new StorageService();