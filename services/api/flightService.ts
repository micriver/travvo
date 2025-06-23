import { faker } from '@faker-js/faker';
import { Flight, FlightSearchParams, FlightSearchResult, FlightSegment } from '@/types';
import { MAJOR_AIRPORTS, getAirportByCode } from '@/services/mockData/airports';
import { MAJOR_AIRLINES, getRandomAirline } from '@/services/mockData/airlines';
import { getRandomAircraft } from '@/services/mockData/aircraft';

class FlightService {
  private generateFlightNumber(airline: any): string {
    return `${airline.code}${faker.number.int({ min: 100, max: 9999 })}`;
  }

  private calculateDistance(origin: string, destination: string): number {
    // Simplified distance calculation - in real app would use actual coordinates
    const distances: { [key: string]: number } = {
      'JFK-LAX': 2475,
      'LAX-JFK': 2475,
      'JFK-LHR': 3459,
      'LHR-JFK': 3459,
      'LAX-NRT': 5478,
      'NRT-LAX': 5478,
      'TPA-LAX': 2151,
      'LAX-TPA': 2151,
      'TPA-JFK': 1010,
      'JFK-TPA': 1010,
    };
    
    const key = `${origin}-${destination}`;
    return distances[key] || faker.number.int({ min: 500, max: 6000 });
  }

  private calculateFlightDuration(distance: number): number {
    // Average commercial aircraft speed ~500 mph
    const baseFlightTime = (distance / 500) * 60; // in minutes
    // Add some variation for taxi, weather, etc.
    return Math.round(baseFlightTime + faker.number.int({ min: -30, max: 60 }));
  }

  private generateFlightSegment(
    origin: string,
    destination: string,
    departureTime: Date,
    isReturn = false
  ): FlightSegment {
    const originAirport = getAirportByCode(origin)!;
    const destinationAirport = getAirportByCode(destination)!;
    const airline = getRandomAirline();
    const aircraft = getRandomAircraft();
    const distance = this.calculateDistance(origin, destination);
    const duration = this.calculateFlightDuration(distance);
    
    const arrivalTime = new Date(departureTime);
    arrivalTime.setMinutes(arrivalTime.getMinutes() + duration);

    return {
      id: faker.string.uuid(),
      flightNumber: this.generateFlightNumber(airline),
      airline,
      aircraft,
      departure: {
        airport: originAirport,
        time: departureTime,
        gate: faker.helpers.arrayElement(['A1', 'A2', 'B3', 'C4', 'D5', 'E6']),
        terminal: faker.helpers.arrayElement(['1', '2', '3', 'North', 'South']),
      },
      arrival: {
        airport: destinationAirport,
        time: arrivalTime,
        gate: faker.helpers.arrayElement(['A1', 'A2', 'B3', 'C4', 'D5', 'E6']),
        terminal: faker.helpers.arrayElement(['1', '2', '3', 'North', 'South']),
      },
      duration,
      distance,
    };
  }

  private generateFlight(
    searchParams: FlightSearchParams,
    basePrice: number
  ): Flight {
    const isRoundTrip = !!searchParams.returnDate;
    const stops = faker.number.int({ min: 0, max: searchParams.maxStops || 2 });
    
    // Generate outbound segment(s)
    const segments: FlightSegment[] = [];
    let currentTime = new Date(searchParams.departureDate);
    
    if (stops === 0) {
      // Direct flight
      segments.push(
        this.generateFlightSegment(
          searchParams.origin,
          searchParams.destination,
          currentTime
        )
      );
    } else {
      // Flight with stops - simplified to 1 stop for now
      const stopoverAirport = faker.helpers.arrayElement(
        MAJOR_AIRPORTS.filter(
          a => a.code !== searchParams.origin && a.code !== searchParams.destination
        )
      );
      
      // First segment
      segments.push(
        this.generateFlightSegment(
          searchParams.origin,
          stopoverAirport.code,
          currentTime
        )
      );
      
      // Layover time
      const layoverTime = faker.number.int({ min: 45, max: 180 });
      currentTime = new Date(segments[segments.length - 1].arrival.time);
      currentTime.setMinutes(currentTime.getMinutes() + layoverTime);
      
      // Second segment
      segments.push(
        this.generateFlightSegment(
          stopoverAirport.code,
          searchParams.destination,
          currentTime
        )
      );
    }

    // Add return segments if round trip
    if (isRoundTrip && searchParams.returnDate) {
      // Add return segments (simplified - same number of stops)
      const returnTime = new Date(searchParams.returnDate);
      if (stops === 0) {
        segments.push(
          this.generateFlightSegment(
            searchParams.destination,
            searchParams.origin,
            returnTime,
            true
          )
        );
      }
    }

    const totalDuration = segments.reduce((total, segment) => total + segment.duration, 0);
    const layovers = segments.length > 1 ? segments.slice(0, -1).map((segment, index) => {
      const nextSegment = segments[index + 1];
      const layoverDuration = 
        (nextSegment.departure.time.getTime() - segment.arrival.time.getTime()) / (1000 * 60);
      
      return {
        airport: segment.arrival.airport,
        duration: layoverDuration,
      };
    }) : undefined;

    // Price variations
    const priceMultiplier = faker.number.float({ min: 0.7, max: 1.8 });
    const finalPrice = Math.round(basePrice * priceMultiplier);
    
    const hasDeal = faker.datatype.boolean({ probability: 0.3 });
    const originalPrice = hasDeal ? Math.round(finalPrice * 1.3) : finalPrice;

    return {
      id: faker.string.uuid(),
      segments,
      price: {
        total: finalPrice,
        currency: 'USD',
        breakdown: {
          base: Math.round(finalPrice * 0.8),
          taxes: Math.round(finalPrice * 0.15),
          fees: Math.round(finalPrice * 0.05),
        },
      },
      cabin: searchParams.cabin,
      availability: {
        seatsLeft: faker.number.int({ min: 1, max: 9 }),
        lastUpdated: new Date(),
      },
      baggage: {
        carry_on: {
          included: true,
          weight: 10,
          dimensions: '22x14x9 inches',
        },
        checked: {
          included: searchParams.cabin !== 'economy',
          weight: 23,
          fee: searchParams.cabin === 'economy' ? 35 : 0,
        },
      },
      amenities: faker.helpers.arrayElements([
        'WiFi',
        'Power',
        'Entertainment',
        'Meals',
        'Extra Legroom',
        'Priority Boarding',
      ], { min: 2, max: 4 }),
      bookingClass: faker.helpers.arrayElement(['Y', 'B', 'M', 'H', 'Q', 'V']),
      refundable: faker.datatype.boolean({ probability: 0.3 }),
      changeable: faker.datatype.boolean({ probability: 0.7 }),
      stops,
      totalDuration,
      layovers,
      deals: hasDeal ? {
        type: faker.helpers.arrayElement(['sale', 'last_minute', 'advance_purchase']),
        discount: faker.number.int({ min: 10, max: 40 }),
        originalPrice,
        validUntil: faker.date.future({ days: 7 }),
      } : undefined,
    };
  }

  async searchFlights(searchParams: FlightSearchParams): Promise<FlightSearchResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, faker.number.int({ min: 500, max: 2000 })));

    const numResults = faker.number.int({ min: 15, max: 50 });
    const flights: Flight[] = [];

    // Base price calculation (simplified)
    const basePrice = faker.number.int({ min: 150, max: 1200 });

    for (let i = 0; i < numResults; i++) {
      flights.push(this.generateFlight(searchParams, basePrice));
    }

    // Sort flights based on search params
    flights.sort((a, b) => {
      switch (searchParams.sortBy) {
        case 'price':
          return searchParams.sortOrder === 'asc' 
            ? a.price.total - b.price.total
            : b.price.total - a.price.total;
        case 'duration':
          return searchParams.sortOrder === 'asc'
            ? a.totalDuration - b.totalDuration
            : b.totalDuration - a.totalDuration;
        case 'departure':
          return searchParams.sortOrder === 'asc'
            ? a.segments[0].departure.time.getTime() - b.segments[0].departure.time.getTime()
            : b.segments[0].departure.time.getTime() - a.segments[0].departure.time.getTime();
        default:
          return 0;
      }
    });

    // Generate filters based on results
    const airlines = [...new Set(flights.map(f => f.segments[0].airline))];
    const priceRange = {
      min: Math.min(...flights.map(f => f.price.total)),
      max: Math.max(...flights.map(f => f.price.total)),
    };
    const durationRange = {
      min: Math.min(...flights.map(f => f.totalDuration)),
      max: Math.max(...flights.map(f => f.totalDuration)),
    };

    return {
      flights,
      searchParams,
      totalResults: numResults,
      searchId: faker.string.uuid(),
      timestamp: new Date(),
      filters: {
        airlines: airlines.map(airline => ({
          code: airline.code,
          name: airline.name,
          count: flights.filter(f => f.segments[0].airline.code === airline.code).length,
        })),
        priceRange,
        durationRange,
        stops: [
          { count: 0, flights: flights.filter(f => f.stops === 0).length },
          { count: 1, flights: flights.filter(f => f.stops === 1).length },
          { count: 2, flights: flights.filter(f => f.stops >= 2).length },
        ],
        airports: {
          origin: [getAirportByCode(searchParams.origin)!],
          destination: [getAirportByCode(searchParams.destination)!],
        },
      },
    };
  }

  async getFlightById(id: string): Promise<Flight | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // In a real app, this would fetch from a database
    // For now, return null (flight not found)
    return null;
  }

  async getPopularRoutes(): Promise<{ origin: string; destination: string; price: number }[]> {
    const popularRoutes = [
      { origin: 'JFK', destination: 'LAX', price: 350 },
      { origin: 'JFK', destination: 'LHR', price: 650 },
      { origin: 'LAX', destination: 'NRT', price: 800 },
      { origin: 'TPA', destination: 'JFK', price: 250 },
      { origin: 'TPA', destination: 'LAX', price: 400 },
      { origin: 'MIA', destination: 'LHR', price: 700 },
    ];

    return popularRoutes.map(route => ({
      ...route,
      price: route.price + faker.number.int({ min: -50, max: 100 }),
    }));
  }
}

export const flightService = new FlightService();