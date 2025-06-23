import { Airport } from '@/types';

export const MAJOR_AIRPORTS: Airport[] = [
  {
    code: 'JFK',
    name: 'John F. Kennedy International Airport',
    city: 'New York',
    country: 'United States',
    timezone: 'America/New_York',
  },
  {
    code: 'LAX',
    name: 'Los Angeles International Airport',
    city: 'Los Angeles',
    country: 'United States',
    timezone: 'America/Los_Angeles',
  },
  {
    code: 'LHR',
    name: 'Heathrow Airport',
    city: 'London',
    country: 'United Kingdom',
    timezone: 'Europe/London',
  },
  {
    code: 'NRT',
    name: 'Narita International Airport',
    city: 'Tokyo',
    country: 'Japan',
    timezone: 'Asia/Tokyo',
  },
  {
    code: 'CDG',
    name: 'Charles de Gaulle Airport',
    city: 'Paris',
    country: 'France',
    timezone: 'Europe/Paris',
  },
  {
    code: 'DXB',
    name: 'Dubai International Airport',
    city: 'Dubai',
    country: 'United Arab Emirates',
    timezone: 'Asia/Dubai',
  },
  {
    code: 'SIN',
    name: 'Singapore Changi Airport',
    city: 'Singapore',
    country: 'Singapore',
    timezone: 'Asia/Singapore',
  },
  {
    code: 'FRA',
    name: 'Frankfurt Airport',
    city: 'Frankfurt',
    country: 'Germany',
    timezone: 'Europe/Berlin',
  },
  {
    code: 'SYD',
    name: 'Sydney Kingsford Smith Airport',
    city: 'Sydney',
    country: 'Australia',
    timezone: 'Australia/Sydney',
  },
  {
    code: 'HKG',
    name: 'Hong Kong International Airport',
    city: 'Hong Kong',
    country: 'Hong Kong',
    timezone: 'Asia/Hong_Kong',
  },
  {
    code: 'MIA',
    name: 'Miami International Airport',
    city: 'Miami',
    country: 'United States',
    timezone: 'America/New_York',
  },
  {
    code: 'ORD',
    name: 'O\'Hare International Airport',
    city: 'Chicago',
    country: 'United States',
    timezone: 'America/Chicago',
  },
  {
    code: 'ATL',
    name: 'Hartsfield-Jackson Atlanta International Airport',
    city: 'Atlanta',
    country: 'United States',
    timezone: 'America/New_York',
  },
  {
    code: 'DEN',
    name: 'Denver International Airport',
    city: 'Denver',
    country: 'United States',
    timezone: 'America/Denver',
  },
  {
    code: 'SEA',
    name: 'Seattle-Tacoma International Airport',
    city: 'Seattle',
    country: 'United States',
    timezone: 'America/Los_Angeles',
  },
  {
    code: 'SFO',
    name: 'San Francisco International Airport',
    city: 'San Francisco',
    country: 'United States',
    timezone: 'America/Los_Angeles',
  },
  {
    code: 'TPA',
    name: 'Tampa International Airport',
    city: 'Tampa',
    country: 'United States',
    timezone: 'America/New_York',
  },
  {
    code: 'MCO',
    name: 'Orlando International Airport',
    city: 'Orlando',
    country: 'United States',
    timezone: 'America/New_York',
  },
  {
    code: 'LAS',
    name: 'Harry Reid International Airport',
    city: 'Las Vegas',
    country: 'United States',
    timezone: 'America/Los_Angeles',
  },
  {
    code: 'BOS',
    name: 'Logan International Airport',
    city: 'Boston',
    country: 'United States',
    timezone: 'America/New_York',
  }
];

export function getAirportByCode(code: string): Airport | undefined {
  return MAJOR_AIRPORTS.find(airport => airport.code === code);
}

export function searchAirports(query: string): Airport[] {
  const lowercaseQuery = query.toLowerCase();
  return MAJOR_AIRPORTS.filter(airport =>
    airport.code.toLowerCase().includes(lowercaseQuery) ||
    airport.name.toLowerCase().includes(lowercaseQuery) ||
    airport.city.toLowerCase().includes(lowercaseQuery)
  );
}