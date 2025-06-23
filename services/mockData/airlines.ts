import { Airline } from '@/types';

export const MAJOR_AIRLINES: Airline[] = [
  {
    code: 'AA',
    name: 'American Airlines',
    logo: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=100&h=100&fit=crop&auto=format',
  },
  {
    code: 'DL',
    name: 'Delta Air Lines',
    logo: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=100&h=100&fit=crop&auto=format',
  },
  {
    code: 'UA',
    name: 'United Airlines',
    logo: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=100&h=100&fit=crop&auto=format',
  },
  {
    code: 'WN',
    name: 'Southwest Airlines',
    logo: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=100&h=100&fit=crop&auto=format',
  },
  {
    code: 'B6',
    name: 'JetBlue Airways',
    logo: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=100&h=100&fit=crop&auto=format',
  },
  {
    code: 'AS',
    name: 'Alaska Airlines',
    logo: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=100&h=100&fit=crop&auto=format',
  },
  {
    code: 'BA',
    name: 'British Airways',
    logo: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=100&h=100&fit=crop&auto=format',
  },
  {
    code: 'LH',
    name: 'Lufthansa',
    logo: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=100&h=100&fit=crop&auto=format',
  },
  {
    code: 'AF',
    name: 'Air France',
    logo: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=100&h=100&fit=crop&auto=format',
  },
  {
    code: 'EK',
    name: 'Emirates',
    logo: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=100&h=100&fit=crop&auto=format',
  },
  {
    code: 'SQ',
    name: 'Singapore Airlines',
    logo: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=100&h=100&fit=crop&auto=format',
  },
  {
    code: 'QF',
    name: 'Qantas',
    logo: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=100&h=100&fit=crop&auto=format',
  },
  {
    code: 'CX',
    name: 'Cathay Pacific',
    logo: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=100&h=100&fit=crop&auto=format',
  },
  {
    code: 'QR',
    name: 'Qatar Airways',
    logo: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=100&h=100&fit=crop&auto=format',
  },
  {
    code: 'TK',
    name: 'Turkish Airlines',
    logo: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=100&h=100&fit=crop&auto=format',
  }
];

export function getAirlineByCode(code: string): Airline | undefined {
  return MAJOR_AIRLINES.find(airline => airline.code === code);
}

export function getRandomAirline(): Airline {
  return MAJOR_AIRLINES[Math.floor(Math.random() * MAJOR_AIRLINES.length)];
}