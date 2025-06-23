export interface DestinationSuggestion {
  city: string;
  country: string;
  airportCode: string;
  airportName: string;
  reason: string;
  confidence: number;
}

export interface TravelIntent {
  destinations: DestinationSuggestion[];
  travelDates?: {
    departure?: string;
    return?: string;
    flexibility?: 'rigid' | 'flexible' | 'very_flexible';
  };
  tripPurpose?: 'leisure' | 'business' | 'family' | 'romantic' | 'adventure';
  preferences?: {
    climate?: 'warm' | 'cold' | 'temperate';
    budget?: 'budget' | 'mid_range' | 'luxury';
    duration?: 'weekend' | 'week' | 'extended';
  };
  clarificationNeeded: boolean;
  clarificationQuestion?: string;
}

class AISearchService {
  private static instance: AISearchService;
  private isInitialized = false;

  static getInstance(): AISearchService {
    if (!AISearchService.instance) {
      AISearchService.instance = new AISearchService();
    }
    return AISearchService.instance;
  }

  private constructor() {}

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    // TODO: Initialize AI service (OpenAI, Claude, etc.)
    // For now, we'll use a mock implementation
    this.isInitialized = true;
  }

  async parseSearchQuery(
    query: string,
    userContext?: {
      homeAirport?: string;
      previousSearches?: string[];
      preferences?: any;
    }
  ): Promise<TravelIntent> {
    await this.initialize();

    // Simple fallback implementation for edge cases
    console.log('📋 Using pattern-based fallback');
    return this.mockAIProcessing(query, userContext);
  }

  private async mockAIProcessing(
    query: string,
    userContext?: {
      homeAirport?: string;
      previousSearches?: string[];
      preferences?: any;
    }
  ): Promise<TravelIntent> {
    const normalizedQuery = query.toLowerCase().trim();
    
    // Enhanced destination mapping with context understanding
    const destinationPatterns = [
      // Specific cities
      { patterns: ['new york', 'nyc', 'manhattan'], destination: { city: 'New York', country: 'United States', airportCode: 'JFK', airportName: 'John F. Kennedy International' } },
      { patterns: ['los angeles', 'la', 'california', 'west coast'], destination: { city: 'Los Angeles', country: 'United States', airportCode: 'LAX', airportName: 'Los Angeles International' } },
      { patterns: ['london', 'uk', 'england', 'britain'], destination: { city: 'London', country: 'United Kingdom', airportCode: 'LHR', airportName: 'Heathrow' } },
      { patterns: ['paris', 'france', 'city of lights'], destination: { city: 'Paris', country: 'France', airportCode: 'CDG', airportName: 'Charles de Gaulle' } },
      { patterns: ['tokyo', 'japan'], destination: { city: 'Tokyo', country: 'Japan', airportCode: 'NRT', airportName: 'Narita International' } },
      { patterns: ['miami', 'south beach', 'florida'], destination: { city: 'Miami', country: 'United States', airportCode: 'MIA', airportName: 'Miami International' } },
      { patterns: ['chicago', 'windy city'], destination: { city: 'Chicago', country: 'United States', airportCode: 'ORD', airportName: "O'Hare International" } },
      { patterns: ['seattle', 'pacific northwest'], destination: { city: 'Seattle', country: 'United States', airportCode: 'SEA', airportName: 'Seattle-Tacoma International' } },
      { patterns: ['san francisco', 'sf', 'bay area'], destination: { city: 'San Francisco', country: 'United States', airportCode: 'SFO', airportName: 'San Francisco International' } },
      { patterns: ['las vegas', 'vegas', 'sin city'], destination: { city: 'Las Vegas', country: 'United States', airportCode: 'LAS', airportName: 'McCarran International' } },
      { patterns: ['boston', 'beantown'], destination: { city: 'Boston', country: 'United States', airportCode: 'BOS', airportName: 'Logan International' } },
      { patterns: ['atlanta', 'georgia'], destination: { city: 'Atlanta', country: 'United States', airportCode: 'ATL', airportName: 'Hartsfield-Jackson Atlanta International' } },
      { patterns: ['denver', 'colorado', 'mile high'], destination: { city: 'Denver', country: 'United States', airportCode: 'DEN', airportName: 'Denver International' } },
      { patterns: ['iceland', 'reykjavik'], destination: { city: 'Reykjavik', country: 'Iceland', airportCode: 'KEF', airportName: 'Keflavik International' } },
    ];

    // Theme-based destinations
    const themeDestinations = {
      warm: [
        { city: 'Miami', country: 'United States', airportCode: 'MIA', airportName: 'Miami International', reason: 'Warm beaches and tropical climate' },
        { city: 'San Diego', country: 'United States', airportCode: 'SAN', airportName: 'San Diego International', reason: 'Year-round perfect weather' },
        { city: 'Phoenix', country: 'United States', airportCode: 'PHX', airportName: 'Phoenix Sky Harbor', reason: 'Desert warmth and sunshine' },
      ],
      cold: [
        { city: 'Anchorage', country: 'United States', airportCode: 'ANC', airportName: 'Ted Stevens Anchorage International', reason: 'Arctic experience' },
        { city: 'Minneapolis', country: 'United States', airportCode: 'MSP', airportName: 'Minneapolis-St. Paul International', reason: 'Winter wonderland' },
      ],
      beach: [
        { city: 'Miami', country: 'United States', airportCode: 'MIA', airportName: 'Miami International', reason: 'Beautiful beaches and nightlife' },
        { city: 'San Diego', country: 'United States', airportCode: 'SAN', airportName: 'San Diego International', reason: 'Perfect beach weather' },
      ],
      europe: [
        { city: 'London', country: 'United Kingdom', airportCode: 'LHR', airportName: 'Heathrow', reason: 'Historic and cultural hub' },
        { city: 'Paris', country: 'France', airportCode: 'CDG', airportName: 'Charles de Gaulle', reason: 'City of lights and romance' },
        { city: 'Rome', country: 'Italy', airportCode: 'FCO', airportName: 'Leonardo da Vinci', reason: 'Ancient history and amazing food' },
      ],
      business: [
        { city: 'New York', country: 'United States', airportCode: 'JFK', airportName: 'John F. Kennedy International', reason: 'Business capital' },
        { city: 'Chicago', country: 'United States', airportCode: 'ORD', airportName: "O'Hare International", reason: 'Major business hub' },
        { city: 'San Francisco', country: 'United States', airportCode: 'SFO', airportName: 'San Francisco International', reason: 'Tech hub' },
      ],
    };

    let destinations: DestinationSuggestion[] = [];
    let clarificationNeeded = false;
    let clarificationQuestion = '';
    let tripPurpose: TravelIntent['tripPurpose'] = 'leisure';
    let preferences: TravelIntent['preferences'] = {};

    // Extract travel intent from query
    if (normalizedQuery.includes('business') || normalizedQuery.includes('work') || normalizedQuery.includes('conference')) {
      tripPurpose = 'business';
    } else if (normalizedQuery.includes('family') || normalizedQuery.includes('visit') || normalizedQuery.includes('parents') || normalizedQuery.includes('sister') || normalizedQuery.includes('brother')) {
      tripPurpose = 'family';
    } else if (normalizedQuery.includes('romantic') || normalizedQuery.includes('honeymoon') || normalizedQuery.includes('anniversary')) {
      tripPurpose = 'romantic';
    }

    // Extract preferences
    if (normalizedQuery.includes('warm') || normalizedQuery.includes('hot') || normalizedQuery.includes('sunny') || normalizedQuery.includes('beach')) {
      preferences.climate = 'warm';
    } else if (normalizedQuery.includes('cold') || normalizedQuery.includes('snow') || normalizedQuery.includes('winter')) {
      preferences.climate = 'cold';
    }

    if (normalizedQuery.includes('weekend')) {
      preferences.duration = 'weekend';
    } else if (normalizedQuery.includes('week')) {
      preferences.duration = 'week';
    }

    // Try to match specific destinations first
    for (const pattern of destinationPatterns) {
      for (const patternText of pattern.patterns) {
        if (normalizedQuery.includes(patternText)) {
          destinations.push({
            ...pattern.destination,
            reason: `Direct match for "${patternText}"`,
            confidence: 0.9,
          });
        }
      }
    }

    // If no specific destination found, try theme-based matching
    if (destinations.length === 0) {
      if (normalizedQuery.includes('warm') || normalizedQuery.includes('sun') || normalizedQuery.includes('hot')) {
        destinations = themeDestinations.warm.map(dest => ({ ...dest, confidence: 0.8 }));
        clarificationNeeded = true;
        clarificationQuestion = 'I found some warm destinations for you. Which one interests you most?';
      } else if (normalizedQuery.includes('europe') || normalizedQuery.includes('european')) {
        destinations = themeDestinations.europe.map(dest => ({ ...dest, confidence: 0.8 }));
        clarificationNeeded = true;
        clarificationQuestion = 'Here are some popular European destinations. Which would you prefer?';
      } else if (normalizedQuery.includes('beach') || normalizedQuery.includes('ocean') || normalizedQuery.includes('coast')) {
        destinations = themeDestinations.beach.map(dest => ({ ...dest, confidence: 0.8 }));
        clarificationNeeded = true;
        clarificationQuestion = 'I found some great beach destinations. Which appeals to you?';
      } else if (tripPurpose === 'business') {
        destinations = themeDestinations.business.map(dest => ({ ...dest, confidence: 0.7 }));
        clarificationNeeded = true;
        clarificationQuestion = 'Here are some major business hubs. Where is your business meeting?';
      } else {
        // Fallback: suggest popular destinations
        destinations = [
          { city: 'New York', country: 'United States', airportCode: 'JFK', airportName: 'John F. Kennedy International', reason: 'Popular destination', confidence: 0.5 },
          { city: 'Los Angeles', country: 'United States', airportCode: 'LAX', airportName: 'Los Angeles International', reason: 'Popular destination', confidence: 0.5 },
          { city: 'Miami', country: 'United States', airportCode: 'MIA', airportName: 'Miami International', reason: 'Popular destination', confidence: 0.5 },
        ];
        clarificationNeeded = true;
        clarificationQuestion = 'I\'m not sure exactly where you\'d like to go. Could you be more specific about your destination?';
      }
    }

    // Extract date information (simplified)
    let travelDates;
    if (normalizedQuery.includes('this weekend') || normalizedQuery.includes('weekend')) {
      const nextWeekend = new Date();
      nextWeekend.setDate(nextWeekend.getDate() + (6 - nextWeekend.getDay()));
      travelDates = {
        departure: nextWeekend.toISOString().split('T')[0],
        flexibility: 'rigid' as const,
      };
    } else if (normalizedQuery.includes('next week')) {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      travelDates = {
        departure: nextWeek.toISOString().split('T')[0],
        flexibility: 'flexible' as const,
      };
    }

    return {
      destinations,
      travelDates,
      tripPurpose,
      preferences,
      clarificationNeeded,
      clarificationQuestion,
    };
  }

  async clarifyDestination(
    originalQuery: string,
    selectedDestination: DestinationSuggestion,
    userContext?: any
  ): Promise<TravelIntent> {
    // Handle follow-up clarification
    return this.parseSearchQuery(`${originalQuery} to ${selectedDestination.city}`, userContext);
  }
}

export const aiSearchService = AISearchService.getInstance();