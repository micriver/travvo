import { UserProfile } from '@/types';

export interface Deal {
  id: string;
  destination: string;
  airportCode: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  airline: string;
  departureDate: string;
  returnDate?: string;
  dealType: 'error_fare' | 'price_drop' | 'last_minute' | 'flexible_date' | 'package' | 'cross_airline';
  expiresAt: Date;
  confidence: number; // How confident we are this is a real deal (0-1)
  description: string;
  bookingUrl?: string;
  restrictions?: string[];
}

export interface PricePrediction {
  currentPrice: number;
  predictedPrice: number;
  confidence: number;
  recommendation: 'book_now' | 'wait' | 'monitor';
  reasoning: string;
  optimalBookingDate?: Date;
}

export interface FlexibleDateSuggestion {
  originalDate: string;
  suggestedDate: string;
  savings: number;
  description: string;
}

class DealDetectionService {
  private static instance: DealDetectionService;

  static getInstance(): DealDetectionService {
    if (!DealDetectionService.instance) {
      DealDetectionService.instance = new DealDetectionService();
    }
    return DealDetectionService.instance;
  }

  /**
   * Find personalized deals based on user profile
   */
  async findPersonalizedDeals(userProfile: UserProfile): Promise<Deal[]> {
    const homeAirport = userProfile.travelPreferences?.homeAirport;
    const budget = userProfile.travelPreferences?.budgetRange;
    const cabin = userProfile.travelPreferences?.preferredCabin;
    
    if (!homeAirport) return [];

    // Mock deal detection - in real app this would call multiple APIs
    const deals: Deal[] = [];

    // Error fare detection
    deals.push(...this.detectErrorFares(homeAirport, budget?.max));
    
    // Price drop alerts
    deals.push(...this.detectPriceDrops(homeAirport, userProfile));
    
    // Last minute deals
    deals.push(...this.detectLastMinuteDeals(homeAirport, budget?.max));
    
    // Cross-airline comparison deals
    deals.push(...this.detectCrossAirlineDeals(homeAirport, cabin));

    return deals.filter(deal => this.isRelevantDeal(deal, userProfile));
  }

  /**
   * Detect potential error fares (pricing mistakes)
   */
  private detectErrorFares(homeAirport: string, maxBudget?: number): Deal[] {
    // Mock error fares - these would be detected by monitoring airline pricing APIs
    const errorFares: Deal[] = [
      {
        id: 'error_1',
        destination: 'Tokyo',
        airportCode: 'NRT',
        price: 299,
        originalPrice: 1200,
        discount: 75,
        airline: 'United Airlines',
        departureDate: '2024-02-15',
        returnDate: '2024-02-25',
        dealType: 'error_fare',
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
        confidence: 0.85,
        description: 'Possible error fare to Tokyo - book quickly!',
        restrictions: ['Limited seats', 'No changes allowed', 'Must book within 2 hours']
      }
    ];

    return errorFares.filter(fare => 
      !maxBudget || fare.price <= maxBudget
    );
  }

  /**
   * Detect recent price drops on popular routes
   */
  private detectPriceDrops(homeAirport: string, userProfile: UserProfile): Deal[] {
    // Mock price drop detection
    return [
      {
        id: 'drop_1',
        destination: 'Los Angeles',
        airportCode: 'LAX',
        price: 189,
        originalPrice: 280,
        discount: 32,
        airline: 'Southwest Airlines',
        departureDate: '2024-01-20',
        returnDate: '2024-01-27',
        dealType: 'price_drop',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        confidence: 0.92,
        description: 'Price dropped 32% in the last week',
      }
    ];
  }

  /**
   * Find last-minute deals (departing within 2 weeks)
   */
  private detectLastMinuteDeals(homeAirport: string, maxBudget?: number): Deal[] {
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);

    return [
      {
        id: 'lastmin_1',
        destination: 'Miami',
        airportCode: 'MIA',
        price: 156,
        originalPrice: 220,
        discount: 29,
        airline: 'American Airlines',
        departureDate: twoWeeksFromNow.toISOString().split('T')[0],
        dealType: 'last_minute',
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
        confidence: 0.88,
        description: 'Last-minute weekend getaway deal',
      }
    ];
  }

  /**
   * Find better deals by comparing across airlines
   */
  private detectCrossAirlineDeals(homeAirport: string, preferredCabin?: string): Deal[] {
    return [
      {
        id: 'cross_1',
        destination: 'Seattle',
        airportCode: 'SEA',
        price: 145,
        originalPrice: 210,
        discount: 31,
        airline: 'Alaska Airlines',
        departureDate: '2024-02-08',
        returnDate: '2024-02-12',
        dealType: 'cross_airline',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        confidence: 0.90,
        description: 'Better price than major carriers on this route',
      }
    ];
  }

  /**
   * Predict if flight prices will go up or down
   */
  async predictPrices(
    origin: string, 
    destination: string, 
    departureDate: Date
  ): Promise<PricePrediction> {
    // Mock price prediction - in real app this would use ML models
    const daysToDeparture = Math.ceil((departureDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    let recommendation: 'book_now' | 'wait' | 'monitor' = 'monitor';
    let reasoning = '';
    
    if (daysToDeparture < 14) {
      recommendation = 'book_now';
      reasoning = 'Prices typically increase within 2 weeks of departure';
    } else if (daysToDeparture > 60) {
      recommendation = 'wait';
      reasoning = 'Prices often drop closer to departure for this route';
    } else {
      recommendation = 'monitor';
      reasoning = 'Price movement is unpredictable in this timeframe';
    }

    return {
      currentPrice: 280,
      predictedPrice: daysToDeparture < 14 ? 320 : 250,
      confidence: 0.75,
      recommendation,
      reasoning,
      optimalBookingDate: daysToDeparture > 30 ? new Date(departureDate.getTime() - 21 * 24 * 60 * 60 * 1000) : undefined
    };
  }

  /**
   * Suggest cheaper dates near the user's preferred date
   */
  async suggestFlexibleDates(
    origin: string,
    destination: string,
    preferredDate: Date,
    flexibilityDays: number = 3
  ): Promise<FlexibleDateSuggestion[]> {
    // Mock flexible date suggestions
    const suggestions: FlexibleDateSuggestion[] = [];
    
    for (let i = 1; i <= flexibilityDays; i++) {
      const earlierDate = new Date(preferredDate);
      earlierDate.setDate(preferredDate.getDate() - i);
      
      const laterDate = new Date(preferredDate);
      laterDate.setDate(preferredDate.getDate() + i);
      
      suggestions.push({
        originalDate: preferredDate.toISOString().split('T')[0],
        suggestedDate: earlierDate.toISOString().split('T')[0],
        savings: Math.floor(Math.random() * 100) + 20, // Random savings $20-120
        description: `Leave ${i} day${i > 1 ? 's' : ''} earlier`
      });
      
      suggestions.push({
        originalDate: preferredDate.toISOString().split('T')[0],
        suggestedDate: laterDate.toISOString().split('T')[0],
        savings: Math.floor(Math.random() * 80) + 15, // Random savings $15-95
        description: `Leave ${i} day${i > 1 ? 's' : ''} later`
      });
    }
    
    return suggestions
      .filter(s => s.savings > 30) // Only show significant savings
      .sort((a, b) => b.savings - a.savings) // Sort by highest savings
      .slice(0, 3); // Top 3 suggestions
  }

  /**
   * Check if a deal is relevant to the user's profile
   */
  private isRelevantDeal(deal: Deal, userProfile: UserProfile): boolean {
    const budget = userProfile.travelPreferences?.budgetRange;
    const flexibility = userProfile.travelPreferences?.flexibility;
    
    // Filter by budget
    if (budget && deal.price > budget.max) {
      return false;
    }
    
    // Filter by flexibility for last-minute deals
    if (deal.dealType === 'last_minute' && flexibility === 'rigid') {
      return false;
    }
    
    return true;
  }

  /**
   * Monitor deals for a specific route
   */
  async monitorRoute(
    origin: string,
    destination: string,
    userProfile: UserProfile
  ): Promise<void> {
    // In real app, this would set up monitoring for price changes
    console.log(`Monitoring ${origin} → ${destination} for deals`);
  }
}

export const dealDetectionService = DealDetectionService.getInstance();