import * as WebBrowser from 'expo-web-browser';
import { 
  BookingRequest, 
  BookingConfirmation, 
  BookingStatus, 
  Flight,
  DeepLinkRequest 
} from '@/types';
import { deepLinkService } from './DeepLinkService';
import { storageService } from '@/services/storage/storageService';

interface BookingSession {
  id: string;
  bookingRequest: BookingRequest;
  handoffMethod: 'app' | 'web' | 'partner_api';
  airlineCode: string;
  startTime: Date;
  status: 'initiated' | 'redirected' | 'completed' | 'failed' | 'abandoned';
  externalReference?: string;
  returnData?: any;
  completedAt?: Date;
  errorMessage?: string;
}

interface PartnerBookingResponse {
  success: boolean;
  bookingReference?: string;
  confirmationNumber?: string;
  ticketNumbers?: string[];
  paymentRequired: boolean;
  paymentUrl?: string;
  errorMessage?: string;
  estimatedCompletionTime?: number;
}

/**
 * BookingHandoffService manages the coordination between our app and external
 * booking systems (airline apps, websites, and partner APIs)
 */
class BookingHandoffService {
  private activeSessions: Map<string, BookingSession> = new Map();
  private completedBookings: Map<string, BookingConfirmation> = new Map();
  
  private readonly STORAGE_KEYS = {
    SESSIONS: '@booking_sessions',
    COMPLETED: '@completed_bookings',
    ANALYTICS: '@booking_analytics'
  };

  constructor() {
    this.loadStoredData();
  }

  /**
   * Initiate booking handoff to airline system
   */
  async initiateBookingHandoff(
    bookingRequest: BookingRequest,
    preferredMethod: 'app' | 'web' | 'auto' = 'auto'
  ): Promise<{ success: boolean; sessionId: string; redirectUrl?: string; errorMessage?: string }> {
    try {
      const airlineCode = bookingRequest.flight.segments[0].airline.code;
      
      // Create booking session
      const session: BookingSession = {
        id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        bookingRequest,
        handoffMethod: 'web', // Will be updated based on actual method used
        airlineCode,
        startTime: new Date(),
        status: 'initiated'
      };

      this.activeSessions.set(session.id, session);
      
      // Determine best handoff method
      const method = await this.determineBestHandoffMethod(bookingRequest.flight, preferredMethod);
      session.handoffMethod = method;
      
      let redirectUrl: string | undefined;
      
      switch (method) {
        case 'app':
          redirectUrl = await this.handleAppHandoff(session);
          break;
        case 'web':
          redirectUrl = await this.handleWebHandoff(session);
          break;
        case 'partner_api':
          return await this.handlePartnerAPIHandoff(session);
        default:
          throw new Error('No suitable handoff method available');
      }
      
      session.status = 'redirected';
      await this.saveSessionData();
      
      // Track analytics
      this.trackHandoffInitiated(session);
      
      return {
        success: true,
        sessionId: session.id,
        redirectUrl
      };
    } catch (error) {
      console.error('Error initiating booking handoff:', error);
      return {
        success: false,
        sessionId: '',
        errorMessage: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Handle deep link return from external booking system
   */
  async handleBookingReturn(
    sessionId: string, 
    returnData: { [key: string]: any }
  ): Promise<BookingConfirmation | null> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      console.error('Invalid session ID for booking return:', sessionId);
      return null;
    }

    try {
      session.returnData = returnData;
      session.completedAt = new Date();
      
      // Parse return data to determine booking status
      const confirmation = await this.parseBookingReturn(session, returnData);
      
      if (confirmation) {
        session.status = 'completed';
        this.completedBookings.set(confirmation.id, confirmation);
        
        // Track successful booking
        this.trackBookingCompleted(session, confirmation);
      } else {
        session.status = 'failed';
        session.errorMessage = 'Failed to parse booking confirmation';
      }
      
      await this.saveSessionData();
      return confirmation;
    } catch (error) {
      console.error('Error handling booking return:', error);
      session.status = 'failed';
      session.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.saveSessionData();
      return null;
    }
  }

  /**
   * Get booking session by ID
   */
  getBookingSession(sessionId: string): BookingSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  /**
   * Get completed booking by ID
   */
  getCompletedBooking(bookingId: string): BookingConfirmation | undefined {
    return this.completedBookings.get(bookingId);
  }

  /**
   * Get all user bookings
   */
  getUserBookings(userId: string): BookingConfirmation[] {
    return Array.from(this.completedBookings.values())
      .filter(booking => booking.bookingRequest.passengers.some(p => p.email?.includes(userId))) // Simple user matching
      .sort((a, b) => b.confirmedAt.getTime() - a.confirmedAt.getTime());
  }

  /**
   * Cancel a booking session (user abandoned)
   */
  async cancelBookingSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.status = 'abandoned';
      session.completedAt = new Date();
      this.trackBookingAbandoned(session);
      await this.saveSessionData();
    }
  }

  /**
   * Check booking status via airline API (if available)
   */
  async checkBookingStatus(
    airlineCode: string, 
    confirmationNumber: string
  ): Promise<{ status: string; details?: any } | null> {
    // This would integrate with airline APIs to check booking status
    // For now, return a mock response
    return {
      status: 'confirmed',
      details: {
        confirmationNumber,
        checked: new Date(),
        flight: 'Active'
      }
    };
  }

  // Private helper methods

  private async determineBestHandoffMethod(
    flight: Flight, 
    preferredMethod: 'app' | 'web' | 'auto'
  ): Promise<'app' | 'web' | 'partner_api'> {
    const airlineCode = flight.segments[0].airline.code;
    
    if (preferredMethod === 'web') {
      return 'web';
    }
    
    if (preferredMethod === 'app') {
      const isSupported = deepLinkService.isAirlineSupported(airlineCode);
      return isSupported ? 'app' : 'web';
    }
    
    // Auto mode - try to find best option
    const isDeepLinkSupported = deepLinkService.isAirlineSupported(airlineCode);
    
    if (isDeepLinkSupported) {
      // Check if app is installed
      const deepLinkRequest: DeepLinkRequest = {
        flight,
        passengers: 1, // Will be updated with actual count
        departureDate: flight.segments[0].departure.time,
        cabin: flight.cabin,
        origin: flight.segments[0].departure.airport.code,
        destination: flight.segments[flight.segments.length - 1].arrival.airport.code
      };
      
      const deepLinkResponse = await deepLinkService.generateDeepLink(deepLinkRequest);
      if (deepLinkResponse.appInstalled) {
        return 'app';
      }
    }
    
    return 'web';
  }

  private async handleAppHandoff(session: BookingSession): Promise<string> {
    const { flight } = session.bookingRequest;
    
    const deepLinkRequest: DeepLinkRequest = {
      flight,
      passengers: session.bookingRequest.passengers.length,
      departureDate: flight.segments[0].departure.time,
      returnDate: flight.segments.length > 1 ? 
        flight.segments[flight.segments.length - 1].arrival.time : undefined,
      cabin: flight.cabin,
      origin: flight.segments[0].departure.airport.code,
      destination: flight.segments[flight.segments.length - 1].arrival.airport.code
    };
    
    const success = await deepLinkService.openAirlineBooking(deepLinkRequest);
    
    if (!success) {
      throw new Error('Failed to open airline app');
    }
    
    // Return the deep link URL for tracking
    const response = await deepLinkService.generateDeepLink(deepLinkRequest);
    return response.deepLinkUrl || response.webFallbackUrl;
  }

  private async handleWebHandoff(session: BookingSession): Promise<string> {
    const { flight } = session.bookingRequest;
    
    const deepLinkRequest: DeepLinkRequest = {
      flight,
      passengers: session.bookingRequest.passengers.length,
      departureDate: flight.segments[0].departure.time,
      returnDate: flight.segments.length > 1 ? 
        flight.segments[flight.segments.length - 1].arrival.time : undefined,
      cabin: flight.cabin,
      origin: flight.segments[0].departure.airport.code,
      destination: flight.segments[flight.segments.length - 1].arrival.airport.code
    };
    
    const response = await deepLinkService.generateDeepLink(deepLinkRequest);
    
    // Open in web browser
    await WebBrowser.openBrowserAsync(response.webFallbackUrl, {
      controlsColor: '#FF6B35',
      toolbarColor: '#1A1A1A',
      showTitle: true,
      showInRecents: true
    });
    
    return response.webFallbackUrl;
  }

  private async handlePartnerAPIHandoff(
    session: BookingSession
  ): Promise<{ success: boolean; sessionId: string; redirectUrl?: string; errorMessage?: string }> {
    // This would handle direct API integration with airline partners
    // For now, simulate the process
    
    try {
      const response = await this.simulatePartnerBooking(session.bookingRequest);
      
      if (response.success) {
        session.externalReference = response.bookingReference;
        session.status = 'completed';
        
        if (response.paymentRequired && response.paymentUrl) {
          // Open payment URL
          await WebBrowser.openBrowserAsync(response.paymentUrl);
          return {
            success: true,
            sessionId: session.id,
            redirectUrl: response.paymentUrl
          };
        } else {
          // Booking completed without additional payment
          const confirmation = await this.createBookingConfirmation(
            session.bookingRequest,
            response.confirmationNumber!,
            response.ticketNumbers || []
          );
          
          this.completedBookings.set(confirmation.id, confirmation);
          return {
            success: true,
            sessionId: session.id
          };
        }
      } else {
        throw new Error(response.errorMessage || 'Partner booking failed');
      }
    } catch (error) {
      session.status = 'failed';
      session.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    }
  }

  private async simulatePartnerBooking(bookingRequest: BookingRequest): Promise<PartnerBookingResponse> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate different outcomes
    const outcomes = [
      {
        success: true,
        bookingReference: `PNR${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        confirmationNumber: `CONF${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
        ticketNumbers: [`TKT${Math.random().toString().substr(2, 10)}`],
        paymentRequired: false
      },
      {
        success: true,
        bookingReference: `PNR${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        paymentRequired: true,
        paymentUrl: `https://secure-payment.airline.com/pay/${Math.random().toString(36).substr(2, 8)}`
      },
      {
        success: false,
        errorMessage: 'Flight no longer available at this price'
      }
    ];
    
    // Return random outcome (weighted towards success)
    const random = Math.random();
    if (random < 0.7) return outcomes[0]; // 70% success without payment
    if (random < 0.9) return outcomes[1]; // 20% success with payment
    return outcomes[2]; // 10% failure
  }

  private async parseBookingReturn(
    session: BookingSession, 
    returnData: { [key: string]: any }
  ): Promise<BookingConfirmation | null> {
    // Parse return data from airline booking system
    // This would vary by airline and integration method
    
    if (returnData.status === 'success' && returnData.confirmationNumber) {
      return await this.createBookingConfirmation(
        session.bookingRequest,
        returnData.confirmationNumber,
        returnData.ticketNumbers || []
      );
    }
    
    return null;
  }

  private async createBookingConfirmation(
    bookingRequest: BookingRequest,
    confirmationNumber: string,
    ticketNumbers: string[]
  ): Promise<BookingConfirmation> {
    const confirmation: BookingConfirmation = {
      id: `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      bookingRequest,
      confirmationNumber,
      ticketNumbers,
      status: 'confirmed',
      airline: {
        code: bookingRequest.flight.segments[0].airline.code,
        name: bookingRequest.flight.segments[0].airline.name,
        bookingReference: confirmationNumber
      },
      checkinUrl: `https://checkin.${bookingRequest.flight.segments[0].airline.code.toLowerCase()}.com`,
      eTicketUrl: `https://tickets.${bookingRequest.flight.segments[0].airline.code.toLowerCase()}.com`,
      travelDocuments: [{
        type: 'eticket',
        url: `https://tickets.example.com/${confirmationNumber}`,
        filename: `eticket_${confirmationNumber}.pdf`
      }],
      modificationPolicy: {
        changeable: bookingRequest.flight.changeable,
        refundable: bookingRequest.flight.refundable,
        changeFee: bookingRequest.flight.changeable ? 150 : undefined,
        refundFee: bookingRequest.flight.refundable ? 200 : undefined,
        cancellationDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      },
      notifications: {
        checkInReminder: true,
        flightUpdates: true,
        gateChanges: true
      },
      confirmedAt: new Date()
    };

    return confirmation;
  }

  // Analytics and tracking methods

  private trackHandoffInitiated(session: BookingSession): void {
    console.log('Booking handoff initiated:', {
      sessionId: session.id,
      airlineCode: session.airlineCode,
      method: session.handoffMethod,
      timestamp: session.startTime.toISOString()
    });
  }

  private trackBookingCompleted(session: BookingSession, confirmation: BookingConfirmation): void {
    const completionTime = session.completedAt!.getTime() - session.startTime.getTime();
    
    console.log('Booking completed:', {
      sessionId: session.id,
      bookingId: confirmation.id,
      confirmationNumber: confirmation.confirmationNumber,
      completionTimeMs: completionTime,
      method: session.handoffMethod,
      airlineCode: session.airlineCode
    });
  }

  private trackBookingAbandoned(session: BookingSession): void {
    const abandonTime = session.completedAt!.getTime() - session.startTime.getTime();
    
    console.log('Booking abandoned:', {
      sessionId: session.id,
      airlineCode: session.airlineCode,
      method: session.handoffMethod,
      abandonTimeMs: abandonTime,
      timestamp: session.completedAt!.toISOString()
    });
  }

  // Data persistence methods

  private async loadStoredData(): Promise<void> {
    try {
      const [sessionsData, completedData] = await Promise.all([
        storageService.getData(this.STORAGE_KEYS.SESSIONS),
        storageService.getData(this.STORAGE_KEYS.COMPLETED)
      ]);
      
      if (sessionsData) {
        const sessions = JSON.parse(sessionsData) as BookingSession[];
        this.activeSessions = new Map(
          sessions.map(s => [s.id, {
            ...s,
            startTime: new Date(s.startTime),
            completedAt: s.completedAt ? new Date(s.completedAt) : undefined
          }])
        );
      }
      
      if (completedData) {
        const bookings = JSON.parse(completedData) as BookingConfirmation[];
        this.completedBookings = new Map(
          bookings.map(b => [b.id, {
            ...b,
            confirmedAt: new Date(b.confirmedAt),
            bookingRequest: {
              ...b.bookingRequest,
              createdAt: new Date(b.bookingRequest.createdAt),
              updatedAt: new Date(b.bookingRequest.updatedAt)
            }
          }])
        );
      }
    } catch (error) {
      console.error('Error loading booking handoff data:', error);
    }
  }

  private async saveSessionData(): Promise<void> {
    try {
      const sessionsArray = Array.from(this.activeSessions.values());
      const completedArray = Array.from(this.completedBookings.values());
      
      await Promise.all([
        storageService.saveData(this.STORAGE_KEYS.SESSIONS, JSON.stringify(sessionsArray)),
        storageService.saveData(this.STORAGE_KEYS.COMPLETED, JSON.stringify(completedArray))
      ]);
    } catch (error) {
      console.error('Error saving booking handoff data:', error);
    }
  }

  /**
   * Get service analytics
   */
  getAnalytics(): {
    totalSessions: number;
    completedBookings: number;
    abandonedSessions: number;
    conversionRate: number;
    averageCompletionTime: number;
    methodBreakdown: { [method: string]: number };
  } {
    const sessions = Array.from(this.activeSessions.values());
    const totalSessions = sessions.length;
    const completedBookings = sessions.filter(s => s.status === 'completed').length;
    const abandonedSessions = sessions.filter(s => s.status === 'abandoned').length;
    
    const conversionRate = totalSessions > 0 ? (completedBookings / totalSessions) * 100 : 0;
    
    const completedSessionsWithTime = sessions.filter(s => 
      s.status === 'completed' && s.completedAt
    );
    
    const averageCompletionTime = completedSessionsWithTime.length > 0 
      ? completedSessionsWithTime.reduce((sum, s) => 
          sum + (s.completedAt!.getTime() - s.startTime.getTime()), 0
        ) / completedSessionsWithTime.length
      : 0;
    
    const methodBreakdown: { [method: string]: number } = {};
    for (const session of sessions) {
      methodBreakdown[session.handoffMethod] = (methodBreakdown[session.handoffMethod] || 0) + 1;
    }
    
    return {
      totalSessions,
      completedBookings,
      abandonedSessions,
      conversionRate,
      averageCompletionTime,
      methodBreakdown
    };
  }
}

export const bookingHandoffService = new BookingHandoffService();