import { Aircraft } from '@/types';

export const AIRCRAFT_MODELS: Aircraft[] = [
  {
    model: 'Boeing 737-800',
    manufacturer: 'Boeing',
    seatConfiguration: '3-3',
    photo: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&h=300&fit=crop&auto=format',
  },
  {
    model: 'Boeing 777-300ER',
    manufacturer: 'Boeing',
    seatConfiguration: '3-3-3',
    photo: 'https://images.unsplash.com/photo-1583500178000-22b0dd7bfe18?w=400&h=300&fit=crop&auto=format',
  },
  {
    model: 'Airbus A320',
    manufacturer: 'Airbus',
    seatConfiguration: '3-3',
    photo: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=300&fit=crop&auto=format',
  },
  {
    model: 'Airbus A350-900',
    manufacturer: 'Airbus',
    seatConfiguration: '3-3-3',
    photo: 'https://images.unsplash.com/photo-1517479149777-5f3b1511d5ad?w=400&h=300&fit=crop&auto=format',
  },
  {
    model: 'Boeing 787-9 Dreamliner',
    manufacturer: 'Boeing',
    seatConfiguration: '3-3-3',
    photo: 'https://images.unsplash.com/photo-1556388158-158dc651b13f?w=400&h=300&fit=crop&auto=format',
  },
  {
    model: 'Airbus A380',
    manufacturer: 'Airbus',
    seatConfiguration: '3-4-3',
    photo: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&auto=format',
  },
  {
    model: 'Boeing 747-8',
    manufacturer: 'Boeing',
    seatConfiguration: '3-4-3',
    photo: 'https://images.unsplash.com/photo-1520637836862-4d197d17c0a3?w=400&h=300&fit=crop&auto=format',
  },
  {
    model: 'Embraer E190',
    manufacturer: 'Embraer',
    seatConfiguration: '2-2',
    photo: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&h=300&fit=crop&auto=format',
  }
];

export function getRandomAircraft(): Aircraft {
  return AIRCRAFT_MODELS[Math.floor(Math.random() * AIRCRAFT_MODELS.length)];
}

export function getAircraftByModel(model: string): Aircraft | undefined {
  return AIRCRAFT_MODELS.find(aircraft => aircraft.model === model);
}