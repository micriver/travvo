// Flight-related types
export type {
  Airport,
  Airline,
  Aircraft,
  FlightSegment,
  Flight,
  FlightSearchParams,
  FlightSearchResult,
} from './Flight';

// User preferences and profile types
export type {
  TravelPreferences,
  AIPersonalizationSettings,
  NotificationPreferences,
  UserProfile,
  UserPreferencesState,
} from './UserPreferences';

// Conversation and AI state types
export type {
  ConversationMessage,
  ConversationContext,
  ConversationSession,
  AIState,
  ConversationState,
} from './ConversationState';

// Booking and payment types
export type {
  PassengerInfo,
  ContactInfo,
  PaymentReference,
  BookingRequest,
  BaggageOption,
  BookingStatus,
  BookingConfirmation,
  VoiceBookingSession,
  VoiceBookingStep,
  AirlineDeepLink,
  DeepLinkRequest,
  DeepLinkResponse,
  PriceTracker,
  PriceAlert,
  PriceHistoryEntry,
  BookingAnalytics,
  BookingNotificationPreferences,
} from './Booking';