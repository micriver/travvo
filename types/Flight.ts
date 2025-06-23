export interface Airport {
  code: string; // IATA code (e.g., "JFK")
  name: string;
  city: string;
  country: string;
  timezone: string;
}

export interface Airline {
  code: string; // IATA code (e.g., "AA")
  name: string;
  logo?: string; // URL to airline logo
}

export interface Aircraft {
  model: string; // e.g., "Boeing 737-800"
  manufacturer: string;
  seatConfiguration: string; // e.g., "3-3"
  photo?: string; // URL to aircraft photo
}

export interface FlightSegment {
  id: string;
  flightNumber: string;
  airline: Airline;
  aircraft: Aircraft;
  departure: {
    airport: Airport;
    time: Date;
    gate?: string;
    terminal?: string;
  };
  arrival: {
    airport: Airport;
    time: Date;
    gate?: string;
    terminal?: string;
  };
  duration: number; // in minutes
  distance: number; // in miles
}

export interface Flight {
  id: string;
  segments: FlightSegment[];
  price: {
    total: number;
    currency: string;
    breakdown: {
      base: number;
      taxes: number;
      fees: number;
    };
  };
  cabin: 'economy' | 'premium_economy' | 'business' | 'first';
  availability: {
    seatsLeft: number;
    lastUpdated: Date;
  };
  baggage: {
    carry_on: {
      included: boolean;
      weight?: number; // in kg
      dimensions?: string;
    };
    checked: {
      included: boolean;
      weight?: number; // in kg
      fee?: number;
    };
  };
  amenities: string[]; // e.g., ["WiFi", "Power", "Entertainment"]
  bookingClass: string; // e.g., "Y", "B", "M"
  refundable: boolean;
  changeable: boolean;
  stops: number; // 0 for direct, 1+ for connections
  totalDuration: number; // in minutes
  layovers?: {
    airport: Airport;
    duration: number; // in minutes
  }[];
  deals?: {
    type: 'sale' | 'last_minute' | 'advance_purchase';
    discount: number; // percentage
    originalPrice: number;
    validUntil: Date;
  };
}

export interface FlightSearchParams {
  origin: string; // Airport code
  destination: string; // Airport code
  departureDate: Date;
  returnDate?: Date; // For round trip
  passengers: {
    adults: number;
    children: number;
    infants: number;
  };
  cabin: Flight['cabin'];
  maxStops?: number;
  maxPrice?: number;
  preferredAirlines?: string[]; // Airline codes
  sortBy: 'price' | 'duration' | 'departure' | 'arrival';
  sortOrder: 'asc' | 'desc';
}

export interface FlightSearchResult {
  flights: Flight[];
  searchParams: FlightSearchParams;
  totalResults: number;
  searchId: string;
  timestamp: Date;
  filters: {
    airlines: { code: string; name: string; count: number }[];
    priceRange: { min: number; max: number };
    durationRange: { min: number; max: number };
    stops: { count: number; flights: number }[];
    airports: { origin: Airport[]; destination: Airport[] };
  };
}