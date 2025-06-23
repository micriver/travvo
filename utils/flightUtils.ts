import { Flight, FlightSegment } from '@/types';
import { formatDuration } from './dateUtils';

export function calculateTotalPrice(flights: Flight[]): number {
  return flights.reduce((total, flight) => total + flight.price.total, 0);
}

export function getFlightDepartureTime(flight: Flight): Date {
  return flight.segments[0].departure.time;
}

export function getFlightArrivalTime(flight: Flight): Date {
  return flight.segments[flight.segments.length - 1].arrival.time;
}

export function getFlightOrigin(flight: Flight): string {
  return flight.segments[0].departure.airport.code;
}

export function getFlightDestination(flight: Flight): string {
  return flight.segments[flight.segments.length - 1].arrival.airport.code;
}

export function getStopDescription(flight: Flight): string {
  if (flight.stops === 0) {
    return 'Nonstop';
  } else if (flight.stops === 1) {
    return '1 stop';
  } else {
    return `${flight.stops} stops`;
  }
}

export function getAirlineNames(flight: Flight): string[] {
  const airlines = new Set(flight.segments.map(segment => segment.airline.name));
  return Array.from(airlines);
}

export function getMainAirline(flight: Flight): string {
  // Return the airline of the first segment
  return flight.segments[0].airline.name;
}

export function formatPriceRange(min: number, max: number, currency = 'USD'): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  if (min === max) {
    return formatter.format(min);
  }
  
  return `${formatter.format(min)} - ${formatter.format(max)}`;
}

export function formatPrice(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function calculateSavings(originalPrice: number, currentPrice: number): {
  amount: number;
  percentage: number;
} {
  const amount = originalPrice - currentPrice;
  const percentage = Math.round((amount / originalPrice) * 100);
  
  return { amount, percentage };
}

export function isFlightDeal(flight: Flight): boolean {
  return !!flight.deals;
}

export function getDealDescription(flight: Flight): string | null {
  if (!flight.deals) return null;
  
  const { type, discount } = flight.deals;
  
  switch (type) {
    case 'sale':
      return `${discount}% off sale`;
    case 'last_minute':
      return `Last minute deal - ${discount}% off`;
    case 'advance_purchase':
      return `Book early and save ${discount}%`;
    default:
      return `${discount}% off`;
  }
}

export function sortFlightsByPrice(flights: Flight[], ascending = true): Flight[] {
  return [...flights].sort((a, b) => {
    const diff = a.price.total - b.price.total;
    return ascending ? diff : -diff;
  });
}

export function sortFlightsByDuration(flights: Flight[], ascending = true): Flight[] {
  return [...flights].sort((a, b) => {
    const diff = a.totalDuration - b.totalDuration;
    return ascending ? diff : -diff;
  });
}

export function sortFlightsByDeparture(flights: Flight[], ascending = true): Flight[] {
  return [...flights].sort((a, b) => {
    const diff = getFlightDepartureTime(a).getTime() - getFlightDepartureTime(b).getTime();
    return ascending ? diff : -diff;
  });
}

export function filterFlightsByPrice(flights: Flight[], minPrice: number, maxPrice: number): Flight[] {
  return flights.filter(flight => 
    flight.price.total >= minPrice && flight.price.total <= maxPrice
  );
}

export function filterFlightsByStops(flights: Flight[], maxStops: number): Flight[] {
  return flights.filter(flight => flight.stops <= maxStops);
}

export function filterFlightsByAirline(flights: Flight[], airlineCodes: string[]): Flight[] {
  return flights.filter(flight => 
    flight.segments.some(segment => airlineCodes.includes(segment.airline.code))
  );
}

export function filterFlightsByDepartureTime(
  flights: Flight[], 
  earliestTime: string, 
  latestTime: string
): Flight[] {
  return flights.filter(flight => {
    const departureTime = getFlightDepartureTime(flight);
    const timeString = departureTime.toTimeString().substring(0, 5); // HH:MM format
    
    return timeString >= earliestTime && timeString <= latestTime;
  });
}

export function getFlightScore(flight: Flight): number {
  // Simple scoring algorithm - can be enhanced
  let score = 100;
  
  // Price factor (lower price = higher score)
  const priceScore = Math.max(0, 50 - (flight.price.total / 20));
  score += priceScore;
  
  // Duration factor (shorter duration = higher score)
  const durationScore = Math.max(0, 30 - (flight.totalDuration / 60));
  score += durationScore;
  
  // Stops penalty
  score -= flight.stops * 10;
  
  // Deal bonus
  if (flight.deals) {
    score += flight.deals.discount;
  }
  
  // Amenities bonus
  score += flight.amenities.length * 2;
  
  return Math.max(0, Math.round(score));
}

export function groupFlightsByAirline(flights: Flight[]): { [airline: string]: Flight[] } {
  return flights.reduce((groups, flight) => {
    const airline = getMainAirline(flight);
    if (!groups[airline]) {
      groups[airline] = [];
    }
    groups[airline].push(flight);
    return groups;
  }, {} as { [airline: string]: Flight[] });
}

export function getQuickFlightSummary(flight: Flight): string {
  const origin = getFlightOrigin(flight);
  const destination = getFlightDestination(flight);
  const price = formatPrice(flight.price.total);
  const stops = getStopDescription(flight);
  const duration = formatDuration(flight.totalDuration);
  
  return `${origin} → ${destination} • ${price} • ${stops} • ${duration}`;
}