import { Flight } from './Flight';

// Passenger Information
export interface PassengerInfo {
  id: string;
  title: 'Mr' | 'Ms' | 'Mrs' | 'Dr';
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  nationality: string;
  passportNumber?: string;
  passportExpiry?: Date;
  frequentFlyerNumber?: string;
  knownTravelerNumber?: string;
  email: string;
  phone: string;
  specialRequests?: string[];
  seatPreference?: 'aisle' | 'window' | 'middle' | 'none';
  mealPreference?: string;
}

// Contact Information
export interface ContactInfo {
  email: string;
  phone: string;
  alternatePhone?: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
}

// Payment Information (for reference only - never store sensitive data)
export interface PaymentReference {
  id: string;
  type: 'credit_card' | 'debit_card' | 'paypal' | 'apple_pay' | 'google_pay';
  lastFourDigits?: string;
  expiryMonth?: number;
  expiryYear?: number;
  cardholderName?: string;
}

// Booking Request
export interface BookingRequest {
  id: string;
  flight: Flight;
  passengers: PassengerInfo[];
  contactInfo: ContactInfo;
  paymentReference?: PaymentReference;
  specialRequests?: string[];
  seatSelections?: { [passengerId: string]: string };
  mealSelections?: { [passengerId: string]: string };
  baggageSelections?: { [passengerId: string]: BaggageOption[] };
  totalPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

// Baggage Options
export interface BaggageOption {
  type: 'carry_on' | 'checked' | 'oversized' | 'sports_equipment';
  weight: number;
  dimensions?: string;
  fee: number;
  description: string;
}

// Booking Status
export type BookingStatus = 
  | 'draft'
  | 'pending_payment'
  | 'confirmed'
  | 'ticketed'
  | 'cancelled'
  | 'refunded'
  | 'completed';

// Booking Confirmation
export interface BookingConfirmation {
  id: string;
  bookingRequest: BookingRequest;
  confirmationNumber: string;
  ticketNumbers: string[];
  status: BookingStatus;
  airline: {
    code: string;
    name: string;
    bookingReference: string;
  };
  checkinUrl?: string;
  eTicketUrl?: string;
  travelDocuments: {
    type: 'eticket' | 'boarding_pass' | 'receipt';
    url: string;
    filename: string;
  }[];
  modificationPolicy: {
    changeable: boolean;
    changeFee?: number;
    refundable: boolean;
    refundFee?: number;
    cancellationDeadline?: Date;
  };
  notifications: {
    checkInReminder: boolean;
    flightUpdates: boolean;
    gateChanges: boolean;
  };
  confirmedAt: Date;
}

// Voice Booking Session
export interface VoiceBookingSession {
  id: string;
  flight: Flight;
  currentStep: VoiceBookingStep;
  completedSteps: VoiceBookingStep[];
  extractedData: Partial<BookingRequest>;
  conversationHistory: {
    timestamp: Date;
    userInput: string;
    aiResponse: string;
    dataExtracted?: any;
  }[];
  isActive: boolean;
  startedAt: Date;
  lastActivity: Date;
}

export type VoiceBookingStep = 
  | 'flight_confirmation'
  | 'passenger_count'
  | 'passenger_details'
  | 'contact_info'
  | 'seat_preferences'
  | 'meal_preferences'
  | 'baggage_selection'
  | 'special_requests'
  | 'payment_method'
  | 'final_review'
  | 'confirmation';

// Deep Link Configuration
export interface AirlineDeepLink {
  airlineCode: string;
  airlineName: string;
  appScheme?: string;
  webUrl: string;
  appStoreUrl: string;
  playStoreUrl: string;
  supportsBooking: boolean;
  bookingUrlTemplate: string;
  requiredParams: string[];
  optionalParams: string[];
}

// Deep Link Generation Request
export interface DeepLinkRequest {
  flight: Flight;
  passengers: number;
  departureDate: Date;
  returnDate?: Date;
  cabin: Flight['cabin'];
  origin: string;
  destination: string;
}

// Deep Link Response
export interface DeepLinkResponse {
  success: boolean;
  deepLinkUrl?: string;
  webFallbackUrl: string;
  appInstalled: boolean;
  airlineApp: AirlineDeepLink;
  prefilledData: {
    [key: string]: string;
  };
  errorMessage?: string;
}

// Price Tracking
export interface PriceTracker {
  id: string;
  userId: string;
  flightRoute: {
    origin: string;
    destination: string;
    departureDate: Date;
    returnDate?: Date;
    passengers: number;
    cabin: Flight['cabin'];
  };
  currentPrice: number;
  targetPrice?: number;
  alertThreshold: number; // percentage drop
  isActive: boolean;
  createdAt: Date;
  lastChecked: Date;
  notifications: {
    email: boolean;
    push: boolean;
    frequency: 'immediate' | 'daily' | 'weekly';
  };
}

// Price Alert
export interface PriceAlert {
  id: string;
  trackerId: string;
  flight: Flight;
  oldPrice: number;
  newPrice: number;
  percentageChange: number;
  alertType: 'price_drop' | 'price_increase' | 'target_reached';
  triggeredAt: Date;
  notificationSent: boolean;
  notificationChannels: ('email' | 'push' | 'sms')[];
}

// Price History Entry
export interface PriceHistoryEntry {
  id: string;
  trackerId: string;
  price: number;
  currency: string;
  availability: number;
  checkedAt: Date;
  source: string;
}

// Booking Analytics
export interface BookingAnalytics {
  conversionRate: number;
  averageBookingTime: number;
  voiceBookingUsage: number;
  manualBookingUsage: number;
  dropOffSteps: { [step: string]: number };
  popularAirlines: { code: string; bookings: number }[];
  averageBookingValue: number;
  cancelationRate: number;
}

// Notification Preferences for Booking
export interface BookingNotificationPreferences {
  priceAlerts: boolean;
  bookingConfirmations: boolean;
  flightUpdates: boolean;
  checkInReminders: boolean;
  gateChanges: boolean;
  cancellations: boolean;
  refundUpdates: boolean;
  channels: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  frequency: {
    priceAlerts: 'immediate' | 'daily' | 'weekly';
    flightUpdates: 'immediate' | 'summary';
  };
}