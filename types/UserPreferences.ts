export interface TravelPreferences {
  // Location preferences
  homeAirport?: string; // IATA code
  preferredAirlines: string[]; // IATA codes
  avoidedAirlines: string[]; // IATA codes
  
  // Flight preferences
  preferredCabin: 'economy' | 'premium_economy' | 'business' | 'first';
  maxStops: number;
  preferredDepartureTime: {
    earliest: string; // "06:00"
    latest: string; // "22:00"
  };
  seatPreferences: {
    window: boolean;
    aisle: boolean;
    middle: boolean;
    front: boolean; // front of plane
    emergency_exit: boolean;
  };
  
  // Travel style
  flexibility: 'rigid' | 'somewhat_flexible' | 'very_flexible';
  budgetRange: {
    min: number;
    max: number;
    currency: string;
  };
  advanceBookingPreference: number; // days in advance
  
  // Amenities
  importantAmenities: string[]; // e.g., ["WiFi", "Power", "Entertainment"]
  mealPreferences: string[]; // e.g., ["vegetarian", "kosher", "halal"]
  
  // Travel companions
  usualTravelGroup: {
    adults: number;
    children: number;
    infants: number;
  };
  
  // Baggage
  baggagePreferences: {
    alwaysCarryOn: boolean;
    usuallyCheckBags: boolean;
    packLight: boolean;
  };
}

export interface AIPersonalizationSettings {
  learningEnabled: boolean;
  voiceInteractionEnabled: boolean;
  proactiveNotifications: boolean;
  locationTracking: boolean;
  conversationHistory: boolean;
  
  // Privacy controls
  dataRetention: '30_days' | '90_days' | '1_year' | 'indefinite';
  shareWithPartners: boolean;
  personalizedDeals: boolean;
  
  // AI behavior
  responseStyle: 'concise' | 'detailed' | 'conversational';
  suggestionFrequency: 'minimal' | 'moderate' | 'frequent';
  dealAlerts: {
    enabled: boolean;
    priceDropThreshold: number; // percentage
    destinationDeals: boolean;
    lastMinuteDeals: boolean;
  };
}

export interface NotificationPreferences {
  push: {
    enabled: boolean;
    flightUpdates: boolean;
    priceAlerts: boolean;
    dealNotifications: boolean;
    bookingReminders: boolean;
  };
  email: {
    enabled: boolean;
    weeklyDeals: boolean;
    priceDropAlerts: boolean;
    travelTips: boolean;
    bookingConfirmations: boolean;
  };
  sms: {
    enabled: boolean;
    flightUpdates: boolean;
    emergencyAlerts: boolean;
  };
  frequency: 'immediate' | 'daily_digest' | 'weekly_digest';
}

export interface UserProfile {
  id: string;
  createdAt: Date;
  lastUpdated: Date;
  
  // Basic info
  name?: string;
  email?: string;
  phoneNumber?: string;
  dateOfBirth?: Date;
  
  // Travel info
  frequentFlyerNumbers: {
    airline: string; // IATA code
    number: string;
    tier?: string;
  }[];
  travelDocuments: {
    passportNumber?: string;
    passportExpiry?: Date;
    tsa_precheck?: string;
    global_entry?: string;
    known_traveler_number?: string;
  };
  
  // Preferences
  travelPreferences: TravelPreferences;
  aiSettings: AIPersonalizationSettings;
  notificationPreferences: NotificationPreferences;
  
  // Usage analytics
  analytics: {
    totalSearches: number;
    totalBookings: number;
    averageBookingValue: number;
    lastActiveDate: Date;
    preferredInteractionMode: 'voice' | 'text';
    mostSearchedRoutes: string[]; // e.g., ["JFK-LAX", "LAX-LHR"]
  };
}

export interface UserPreferencesState {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  hasCompletedOnboarding: boolean;
  currentOnboardingStep: number;
}