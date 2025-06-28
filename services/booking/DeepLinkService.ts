import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { 
  AirlineDeepLink, 
  DeepLinkRequest, 
  DeepLinkResponse, 
  Flight 
} from '@/types';

/**
 * DeepLinkService handles generating and managing deep links to airline apps
 * and websites for seamless booking handoffs with pre-filled data
 */
class DeepLinkService {
  private airlineConfigs: { [airlineCode: string]: AirlineDeepLink } = {
    'AA': {
      airlineCode: 'AA',
      airlineName: 'American Airlines',
      appScheme: 'americanairlines://',
      webUrl: 'https://www.aa.com',
      appStoreUrl: 'https://apps.apple.com/us/app/american-airlines/id382698565',
      playStoreUrl: 'https://play.google.com/store/apps/details?id=com.aa.android',
      supportsBooking: true,
      bookingUrlTemplate: 'https://www.aa.com/booking/search?origin={origin}&destination={destination}&departureDate={departureDate}&passengers={passengers}&cabin={cabin}',
      requiredParams: ['origin', 'destination', 'departureDate', 'passengers'],
      optionalParams: ['returnDate', 'cabin', 'flightNumber']
    },
    'DL': {
      airlineCode: 'DL',
      airlineName: 'Delta Air Lines',
      appScheme: 'delta://',
      webUrl: 'https://www.delta.com',
      appStoreUrl: 'https://apps.apple.com/us/app/delta-air-lines/id388491656',
      playStoreUrl: 'https://play.google.com/store/apps/details?id=com.delta.mobile.android',
      supportsBooking: true,
      bookingUrlTemplate: 'https://www.delta.com/flight-search/book-a-flight?origin={origin}&destination={destination}&departureDate={departureDate}&passengers={passengers}&cabin={cabin}',
      requiredParams: ['origin', 'destination', 'departureDate', 'passengers'],
      optionalParams: ['returnDate', 'cabin', 'flightNumber']
    },
    'UA': {
      airlineCode: 'UA',
      airlineName: 'United Airlines',
      appScheme: 'united://',
      webUrl: 'https://www.united.com',
      appStoreUrl: 'https://apps.apple.com/us/app/united-airlines/id449945214',
      playStoreUrl: 'https://play.google.com/store/apps/details?id=com.united.mobile.android',
      supportsBooking: true,
      bookingUrlTemplate: 'https://www.united.com/ual/en/us/flight-search/book-a-flight?f={origin}&t={destination}&d={departureDate}&px={passengers}&sc={cabin}',
      requiredParams: ['origin', 'destination', 'departureDate', 'passengers'],
      optionalParams: ['returnDate', 'cabin', 'flightNumber']
    },
    'WN': {
      airlineCode: 'WN',
      airlineName: 'Southwest Airlines',
      appScheme: 'southwest://',
      webUrl: 'https://www.southwest.com',
      appStoreUrl: 'https://apps.apple.com/us/app/southwest-airlines/id344542975',
      playStoreUrl: 'https://play.google.com/store/apps/details?id=com.southwest.mobile',
      supportsBooking: true,
      bookingUrlTemplate: 'https://www.southwest.com/air/booking/select.html?originationAirportCode={origin}&destinationAirportCode={destination}&returnAirportCode={destination}&departureDate={departureDate}&departureTimeOfDay=ALL_DAY&returnDate={returnDate}&returnTimeOfDay=ALL_DAY&adultPassengersCount={passengers}&seniorPassengersCount=0',
      requiredParams: ['origin', 'destination', 'departureDate', 'passengers'],
      optionalParams: ['returnDate']
    },
    'B6': {
      airlineCode: 'B6',
      airlineName: 'JetBlue Airways',
      appScheme: 'jetblue://',
      webUrl: 'https://www.jetblue.com',
      appStoreUrl: 'https://apps.apple.com/us/app/jetblue/id438507939',
      playStoreUrl: 'https://play.google.com/store/apps/details?id=com.jetblue.JetBlueAndroid',
      supportsBooking: true,
      bookingUrlTemplate: 'https://www.jetblue.com/booking/search?from={origin}&to={destination}&depart={departureDate}&return={returnDate}&passengers={passengers}&cabin={cabin}',
      requiredParams: ['origin', 'destination', 'departureDate', 'passengers'],
      optionalParams: ['returnDate', 'cabin']
    },
    'AS': {
      airlineCode: 'AS',
      airlineName: 'Alaska Airlines',
      appScheme: 'alaskaair://',
      webUrl: 'https://www.alaskaair.com',
      appStoreUrl: 'https://apps.apple.com/us/app/alaska-airlines/id354967316',
      playStoreUrl: 'https://play.google.com/store/apps/details?id=com.alaskaair.android',
      supportsBooking: true,
      bookingUrlTemplate: 'https://www.alaskaair.com/booking/search?from={origin}&to={destination}&departure={departureDate}&return={returnDate}&adults={passengers}&cabin={cabin}',
      requiredParams: ['origin', 'destination', 'departureDate', 'passengers'],
      optionalParams: ['returnDate', 'cabin']
    }
  };

  /**
   * Generate deep link for airline booking with pre-filled flight data
   */
  async generateDeepLink(request: DeepLinkRequest): Promise<DeepLinkResponse> {
    try {
      const airlineConfig = this.airlineConfigs[request.flight.segments[0].airline.code];
      
      if (!airlineConfig) {
        return {
          success: false,
          webFallbackUrl: this.generateGenericSearchUrl(request),
          appInstalled: false,
          airlineApp: this.getGenericAirlineConfig(),
          prefilledData: {},
          errorMessage: 'Airline not supported for deep linking'
        };
      }

      // Check if airline app is installed
      const appInstalled = await this.isAppInstalled(airlineConfig.appScheme);
      
      // Generate pre-filled data
      const prefilledData = this.buildPrefilledData(request, airlineConfig);
      
      // Generate deep link URL
      const deepLinkUrl = appInstalled 
        ? this.buildAppDeepLink(airlineConfig, prefilledData)
        : null;
      
      // Generate web fallback URL
      const webFallbackUrl = this.buildWebUrl(airlineConfig, prefilledData);

      return {
        success: true,
        deepLinkUrl,
        webFallbackUrl,
        appInstalled,
        airlineApp: airlineConfig,
        prefilledData,
      };
    } catch (error) {
      console.error('Error generating deep link:', error);
      return {
        success: false,
        webFallbackUrl: this.generateGenericSearchUrl(request),
        appInstalled: false,
        airlineApp: this.getGenericAirlineConfig(),
        prefilledData: {},
        errorMessage: 'Failed to generate deep link'
      };
    }
  }

  /**
   * Open airline booking with deep link or web fallback
   */
  async openAirlineBooking(request: DeepLinkRequest): Promise<boolean> {
    try {
      const deepLinkResponse = await this.generateDeepLink(request);
      
      if (!deepLinkResponse.success) {
        // Open generic search as last resort
        await WebBrowser.openBrowserAsync(deepLinkResponse.webFallbackUrl);
        return false;
      }

      // Try app deep link first if available
      if (deepLinkResponse.deepLinkUrl && deepLinkResponse.appInstalled) {
        try {
          const canOpen = await Linking.canOpenURL(deepLinkResponse.deepLinkUrl);
          if (canOpen) {
            await Linking.openURL(deepLinkResponse.deepLinkUrl);
            return true;
          }
        } catch (appError) {
          console.log('App deep link failed, falling back to web:', appError);
        }
      }

      // Fall back to web browser
      await WebBrowser.openBrowserAsync(deepLinkResponse.webFallbackUrl);
      return true;
    } catch (error) {
      console.error('Error opening airline booking:', error);
      return false;
    }
  }

  /**
   * Get all supported airlines for deep linking
   */
  getSupportedAirlines(): AirlineDeepLink[] {
    return Object.values(this.airlineConfigs);
  }

  /**
   * Check if airline supports deep linking
   */
  isAirlineSupported(airlineCode: string): boolean {
    return airlineCode in this.airlineConfigs && this.airlineConfigs[airlineCode].supportsBooking;
  }

  /**
   * Get airline configuration
   */
  getAirlineConfig(airlineCode: string): AirlineDeepLink | null {
    return this.airlineConfigs[airlineCode] || null;
  }

  /**
   * Track deep link usage analytics
   */
  trackDeepLinkUsage(airlineCode: string, success: boolean, method: 'app' | 'web'): void {
    // Implementation would depend on analytics service
    console.log('Deep link analytics:', {
      airlineCode,
      success,
      method,
      timestamp: new Date().toISOString()
    });
  }

  // Private helper methods

  private async isAppInstalled(appScheme?: string): Promise<boolean> {
    if (!appScheme) return false;
    
    try {
      return await Linking.canOpenURL(appScheme);
    } catch (error) {
      console.error('Error checking app installation:', error);
      return false;
    }
  }

  private buildPrefilledData(request: DeepLinkRequest, config: AirlineDeepLink): { [key: string]: string } {
    const data: { [key: string]: string } = {};
    
    // Required parameters
    data.origin = request.origin;
    data.destination = request.destination;
    data.departureDate = this.formatDate(request.departureDate);
    data.passengers = request.passengers.toString();
    
    // Optional parameters
    if (request.returnDate && config.optionalParams.includes('returnDate')) {
      data.returnDate = this.formatDate(request.returnDate);
    }
    
    if (config.optionalParams.includes('cabin')) {
      data.cabin = this.mapCabinClass(request.cabin);
    }
    
    if (config.optionalParams.includes('flightNumber')) {
      data.flightNumber = request.flight.segments[0].flightNumber;
    }

    return data;
  }

  private buildAppDeepLink(config: AirlineDeepLink, data: { [key: string]: string }): string {
    if (!config.appScheme) return '';
    
    // Build app-specific deep link format
    const params = new URLSearchParams(data);
    return `${config.appScheme}book?${params.toString()}`;
  }

  private buildWebUrl(config: AirlineDeepLink, data: { [key: string]: string }): string {
    let url = config.bookingUrlTemplate;
    
    // Replace placeholders with actual values
    for (const [key, value] of Object.entries(data)) {
      url = url.replace(`{${key}}`, encodeURIComponent(value));
    }
    
    // Remove any remaining placeholders
    url = url.replace(/\{[^}]+\}/g, '');
    
    return url;
  }

  private formatDate(date: Date): string {
    // Format as YYYY-MM-DD (most common airline format)
    return date.toISOString().split('T')[0];
  }

  private mapCabinClass(cabin: Flight['cabin']): string {
    const mapping: { [key in Flight['cabin']]: string } = {
      'economy': 'COACH',
      'premium_economy': 'PREMIUM_COACH',
      'business': 'BUSINESS',
      'first': 'FIRST'
    };
    
    return mapping[cabin] || 'COACH';
  }

  private generateGenericSearchUrl(request: DeepLinkRequest): string {
    // Generic flight search URL (could use Google Flights, Kayak, etc.)
    const params = new URLSearchParams({
      origin: request.origin,
      destination: request.destination,
      departure: this.formatDate(request.departureDate),
      passengers: request.passengers.toString(),
      cabin: request.cabin
    });
    
    if (request.returnDate) {
      params.set('return', this.formatDate(request.returnDate));
    }
    
    return `https://www.google.com/flights?${params.toString()}`;
  }

  private getGenericAirlineConfig(): AirlineDeepLink {
    return {
      airlineCode: 'GENERIC',
      airlineName: 'Generic Search',
      webUrl: 'https://www.google.com/flights',
      appStoreUrl: '',
      playStoreUrl: '',
      supportsBooking: false,
      bookingUrlTemplate: '',
      requiredParams: [],
      optionalParams: []
    };
  }

  /**
   * Add or update airline configuration
   */
  addAirlineConfig(config: AirlineDeepLink): void {
    this.airlineConfigs[config.airlineCode] = config;
  }

  /**
   * Remove airline configuration
   */
  removeAirlineConfig(airlineCode: string): void {
    delete this.airlineConfigs[airlineCode];
  }

  /**
   * Generate shareable deep link for flight
   */
  generateShareableLink(flight: Flight): string {
    const params = new URLSearchParams({
      flightId: flight.id,
      airline: flight.segments[0].airline.code,
      origin: flight.segments[0].departure.airport.code,
      destination: flight.segments[flight.segments.length - 1].arrival.airport.code,
      price: flight.price.total.toString(),
      date: this.formatDate(flight.segments[0].departure.time)
    });
    
    return `travvo://flight?${params.toString()}`;
  }

  /**
   * Parse shareable deep link back to flight data
   */
  parseShareableLink(url: string): { [key: string]: string } | null {
    try {
      const parsedUrl = Linking.parse(url);
      if (parsedUrl.scheme !== 'travvo' || parsedUrl.hostname !== 'flight') {
        return null;
      }
      
      return parsedUrl.queryParams as { [key: string]: string };
    } catch (error) {
      console.error('Error parsing shareable link:', error);
      return null;
    }
  }
}

export const deepLinkService = new DeepLinkService();