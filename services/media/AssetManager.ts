/**
 * AssetManager - Centralized media management for TikTok-style experience
 * Handles asset discovery, quality scoring, and intelligent content selection
 */

import { imageCache } from './ImageCache';

export interface MediaAsset {
  id: string;
  type: 'photo' | 'video';
  url: string;
  previewUrl?: string;
  thumbnailUrl?: string;
  credit: string;
  description: string;
  tags: string[];
  quality: number; // 0-100 score
  dimensions?: {
    width: number;
    height: number;
  };
  metadata?: {
    source: 'unsplash' | 'coverr' | 'local' | 'airline';
    location?: string;
    season?: 'spring' | 'summer' | 'fall' | 'winter';
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
    mood?: 'vibrant' | 'serene' | 'urban' | 'nature';
  };
}

export interface AirlineAsset {
  code: string;
  name: string;
  logoUrl: string;
  brandColors: {
    primary: string;
    secondary: string;
  };
  logoVariants: {
    dark: string;
    light: string;
    symbol: string;
  };
}

interface DestinationAssetCollection {
  city: string;
  country: string;
  airportCode: string;
  heroAssets: MediaAsset[];
  atmosphericAssets: MediaAsset[];
  landmarks: MediaAsset[];
  culturalAssets: MediaAsset[];
  seasonalAssets: Record<string, MediaAsset[]>;
}

class AssetManager {
  private destinationAssets = new Map<string, DestinationAssetCollection>();
  private airlineAssets = new Map<string, AirlineAsset>();
  private globalAssets: MediaAsset[] = [];
  private assetQualityCache = new Map<string, number>();

  // High-quality curated airline assets
  private readonly AIRLINE_ASSETS: Record<string, AirlineAsset> = {
    'AA': {
      code: 'AA',
      name: 'American Airlines',
      logoUrl: 'https://logos-world.net/wp-content/uploads/2020/03/American-Airlines-Logo.png',
      brandColors: { primary: '#CC0000', secondary: '#B8860B' },
      logoVariants: {
        dark: 'https://images.kiwi.com/airlines/64/AA.png',
        light: 'https://upload.wikimedia.org/wikipedia/en/thumb/2/23/American_Airlines_logo_2013.svg/512px-American_Airlines_logo_2013.svg.png',
        symbol: 'https://images.kiwi.com/airlines/32/AA.png'
      }
    },
    'DL': {
      code: 'DL',
      name: 'Delta Air Lines',
      logoUrl: 'https://logos-world.net/wp-content/uploads/2020/03/Delta-Air-Lines-Logo.png',
      brandColors: { primary: '#003366', secondary: '#ED1C24' },
      logoVariants: {
        dark: 'https://images.kiwi.com/airlines/64/DL.png',
        light: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Delta_logo.svg/512px-Delta_logo.svg.png',
        symbol: 'https://images.kiwi.com/airlines/32/DL.png'
      }
    },
    'UA': {
      code: 'UA',
      name: 'United Airlines',
      logoUrl: 'https://logos-world.net/wp-content/uploads/2020/03/United-Airlines-Logo.png',
      brandColors: { primary: '#002244', secondary: '#FFB81C' },
      logoVariants: {
        dark: 'https://images.kiwi.com/airlines/64/UA.png',
        light: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/United_Airlines_Logo.svg/512px-United_Airlines_Logo.svg.png',
        symbol: 'https://images.kiwi.com/airlines/32/UA.png'
      }
    },
    'LH': {
      code: 'LH',
      name: 'Lufthansa',
      logoUrl: 'https://logos-world.net/wp-content/uploads/2020/03/Lufthansa-Logo.png',
      brandColors: { primary: '#05164D', secondary: '#F9BA00' },
      logoVariants: {
        dark: 'https://images.kiwi.com/airlines/64/LH.png',
        light: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Lufthansa_Logo_2018.svg/512px-Lufthansa_Logo_2018.svg.png',
        symbol: 'https://images.kiwi.com/airlines/32/LH.png'
      }
    },
    'BA': {
      code: 'BA',
      name: 'British Airways',
      logoUrl: 'https://logos-world.net/wp-content/uploads/2020/03/British-Airways-Logo.png',
      brandColors: { primary: '#075AAA', secondary: '#E21836' },
      logoVariants: {
        dark: 'https://images.kiwi.com/airlines/64/BA.png',
        light: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/42/British_Airways_Logo.svg/512px-British_Airways_Logo.svg.png',
        symbol: 'https://images.kiwi.com/airlines/32/BA.png'
      }
    },
    'AF': {
      code: 'AF',
      name: 'Air France',
      logoUrl: 'https://logos-world.net/wp-content/uploads/2020/03/Air-France-Logo.png',
      brandColors: { primary: '#002157', secondary: '#E21836' },
      logoVariants: {
        dark: 'https://images.kiwi.com/airlines/64/AF.png',
        light: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Air_France_Logo.svg/512px-Air_France_Logo.svg.png',
        symbol: 'https://images.kiwi.com/airlines/32/AF.png'
      }
    }
  };

  // Enhanced destination mapping with mood and quality scoring
  private readonly DESTINATION_MAPPING: Record<string, {
    keywords: string[];
    mood: string[];
    preferredSources: string[];
    seasonality: boolean;
  }> = {
    'CDG': { // Paris
      keywords: ['paris', 'eiffel tower', 'france', 'louvre', 'seine', 'champs elysees'],
      mood: ['romantic', 'historic', 'urban', 'cultural'],
      preferredSources: ['unsplash'],
      seasonality: true
    },
    'LAS': { // Las Vegas
      keywords: ['las vegas', 'neon', 'casino', 'strip', 'desert', 'entertainment'],
      mood: ['vibrant', 'nightlife', 'entertainment', 'neon'],
      preferredSources: ['unsplash', 'coverr'],
      seasonality: false
    },
    'JFK': { // New York
      keywords: ['new york', 'manhattan', 'skyline', 'times square', 'brooklyn bridge'],
      mood: ['urban', 'dynamic', 'iconic', 'energetic'],
      preferredSources: ['unsplash', 'coverr'],
      seasonality: true
    },
    'LAX': { // Los Angeles
      keywords: ['los angeles', 'hollywood', 'beach', 'sunset', 'palm trees', 'california'],
      mood: ['sunny', 'beach', 'entertainment', 'relaxed'],
      preferredSources: ['unsplash', 'coverr'],
      seasonality: false
    },
    'NRT': { // Tokyo
      keywords: ['tokyo', 'japan', 'shibuya', 'cherry blossom', 'temple', 'neon', 'modern'],
      mood: ['modern', 'traditional', 'neon', 'cultural'],
      preferredSources: ['unsplash'],
      seasonality: true
    },
    'LHR': { // London
      keywords: ['london', 'big ben', 'thames', 'tower bridge', 'red bus', 'england'],
      mood: ['historic', 'iconic', 'urban', 'cultural'],
      preferredSources: ['unsplash'],
      seasonality: true
    }
  };

  constructor() {
    this.initializeAssets();
  }

  /**
   * Get curated assets for a destination with intelligent selection
   */
  async getDestinationAssets(
    airportCode: string,
    cityName?: string,
    options?: {
      limit?: number;
      includeVideos?: boolean;
      mood?: string[];
      season?: string;
      timeOfDay?: string;
    }
  ): Promise<MediaAsset[]> {
    const assets: MediaAsset[] = [];
    const limit = options?.limit || 5;

    // Get local curated assets first (highest quality)
    const localAssets = await this.getLocalAssets(airportCode);
    assets.push(...localAssets);

    // Get external assets if needed
    if (assets.length < limit) {
      const externalAssets = await this.getExternalAssets(airportCode, cityName, options);
      assets.push(...externalAssets);
    }

    // Apply intelligent filtering and scoring
    const filteredAssets = this.applyIntelligentFiltering(assets, airportCode, options);
    
    // Sort by quality score and diversify
    const sortedAssets = this.sortAndDiversifyAssets(filteredAssets);

    // Preload high-priority assets
    this.preloadAssets(sortedAssets.slice(0, 3));

    return sortedAssets.slice(0, limit);
  }

  /**
   * Get airline branding assets
   */
  getAirlineAssets(airlineCode: string): AirlineAsset | null {
    return this.airlineAssets.get(airlineCode) || this.AIRLINE_ASSETS[airlineCode] || null;
  }

  /**
   * Get optimized airline logo with fallback
   */
  async getAirlineLogo(
    airlineCode: string, 
    variant: 'dark' | 'light' | 'symbol' = 'light'
  ): Promise<string> {
    const airline = this.getAirlineAssets(airlineCode);
    
    if (airline) {
      const logoUrl = airline.logoVariants[variant] || airline.logoUrl;
      return await imageCache.getOptimizedImage(logoUrl, 'high');
    }

    // Fallback to Kiwi.com airline logos
    const fallbackUrl = `https://images.kiwi.com/airlines/64/${airlineCode}.png`;
    return await imageCache.getOptimizedImage(fallbackUrl, 'high');
  }

  /**
   * Preload assets for upcoming content
   */
  async preloadUpcomingAssets(flightData: any[]): Promise<void> {
    const preloadPromises = flightData.slice(0, 5).map(async (flight, index) => {
      const priority = index < 3 ? 'high' : 'low';
      
      // Preload destination assets
      const destinationAssets = await this.getDestinationAssets(
        flight.destination.code,
        flight.destination.city,
        { limit: 3 }
      );

      const assetUrls = destinationAssets.map(asset => asset.url);
      await imageCache.preloadImages(assetUrls, priority as 'high' | 'low');

      // Preload airline logo
      await this.getAirlineLogo(flight.airline.code);
    });

    await Promise.allSettled(preloadPromises);
  }

  /**
   * Get asset quality score
   */
  getAssetQuality(asset: MediaAsset): number {
    const cacheKey = asset.id;
    
    if (this.assetQualityCache.has(cacheKey)) {
      return this.assetQualityCache.get(cacheKey)!;
    }

    let score = 0;

    // Base quality from source
    if (asset.metadata?.source === 'local') score += 30;
    else if (asset.metadata?.source === 'unsplash') score += 25;
    else if (asset.metadata?.source === 'coverr') score += 20;
    else score += 10;

    // Dimension scoring (prefer portrait for TikTok style)
    if (asset.dimensions) {
      const aspectRatio = asset.dimensions.height / asset.dimensions.width;
      if (aspectRatio >= 1.3 && aspectRatio <= 1.8) score += 20; // Good portrait ratio
      else if (aspectRatio >= 1.0 && aspectRatio <= 1.3) score += 15; // Square-ish
      else score += 5; // Landscape
    }

    // Tag relevance scoring
    score += Math.min(asset.tags.length * 3, 15);

    // Description quality
    if (asset.description && asset.description.length > 20) score += 10;

    // Credit quality (indicates source reliability)
    if (asset.credit.includes('Unsplash')) score += 5;

    // Clamp score to 0-100
    score = Math.max(0, Math.min(100, score));
    
    this.assetQualityCache.set(cacheKey, score);
    return score;
  }

  // Private methods

  private async initializeAssets(): Promise<void> {
    // Initialize airline assets
    for (const [code, asset] of Object.entries(this.AIRLINE_ASSETS)) {
      this.airlineAssets.set(code, asset);
    }

    // Initialize local destination assets
    await this.loadLocalDestinationAssets();
  }

  private async loadLocalDestinationAssets(): Promise<void> {
    // This would load and categorize the existing local assets
    // For now, we'll set up the structure
    const localAssetMap = {
      'CDG': [
        'alex-azabache-624WUhcCm4w-unsplash.jpg',
        'anthony-melone-d1Ndd3zn5go-unsplash.jpg'
      ],
      'LAS': [
        'bady-abbas-5ov2G7JzphM-unsplash.jpg',
        'baptx-kw7_Y-4uP3c-unsplash.jpg'
      ],
      'JFK': [
        'benjamin-ashton-OsUsQip-__0-unsplash.jpg',
        'benjamin-davies-o9GcL3uyK-U-unsplash.jpg'
      ],
      'LAX': [
        'cosmic-timetraveler-jQvOExlroYA-unsplash.jpg',
        'david-gavi-AdIJ9S-kbrc-unsplash.jpg'
      ],
      'NRT': [
        'david-gavi-ikU9mkrCAdQ-unsplash.jpg',
        'eric-marty-IZunjrb3soo-unsplash.jpg'
      ],
      'LHR': [
        'erik-eastman-4HG5hlhmZg8-unsplash.jpg',
        'guilherme-stecanella-_dH-oQF9w-Y-unsplash.jpg'
      ]
    };

    // Convert to MediaAsset objects with quality scoring
    for (const [airportCode, assets] of Object.entries(localAssetMap)) {
      const mediaAssets: MediaAsset[] = assets.map((filename, index) => ({
        id: `local-${airportCode}-${index}`,
        type: 'photo',
        url: `@/assets/images/unsplash-images/${filename}`,
        credit: 'Curated collection by Unsplash',
        description: `Beautiful ${airportCode} destination photo`,
        tags: this.DESTINATION_MAPPING[airportCode]?.keywords || [],
        quality: 85, // High quality for curated local assets
        metadata: {
          source: 'local',
          location: airportCode,
          mood: this.DESTINATION_MAPPING[airportCode]?.mood[0] as any || 'scenic'
        }
      }));

      // Store in destination assets map
      const mapping = this.DESTINATION_MAPPING[airportCode];
      this.destinationAssets.set(airportCode, {
        city: this.getCityName(airportCode),
        country: this.getCountryName(airportCode),
        airportCode,
        heroAssets: mediaAssets,
        atmosphericAssets: [],
        landmarks: [],
        culturalAssets: [],
        seasonalAssets: {}
      });
    }
  }

  private async getLocalAssets(airportCode: string): Promise<MediaAsset[]> {
    const destination = this.destinationAssets.get(airportCode);
    return destination?.heroAssets || [];
  }

  private async getExternalAssets(
    airportCode: string,
    cityName?: string,
    options?: any
  ): Promise<MediaAsset[]> {
    // This would integrate with external APIs
    // For now, return empty array as the external integration
    // would be handled by the enhanced MediaService
    return [];
  }

  private applyIntelligentFiltering(
    assets: MediaAsset[],
    airportCode: string,
    options?: any
  ): MediaAsset[] {
    let filtered = [...assets];

    // Filter by type if specified
    if (options?.includeVideos === false) {
      filtered = filtered.filter(asset => asset.type === 'photo');
    }

    // Filter by mood if specified
    if (options?.mood && options.mood.length > 0) {
      filtered = filtered.filter(asset => 
        options.mood.some((mood: string) => 
          asset.metadata?.mood === mood || asset.tags.includes(mood)
        )
      );
    }

    // Filter by season if specified
    if (options?.season) {
      filtered = filtered.filter(asset => 
        !asset.metadata?.season || asset.metadata.season === options.season
      );
    }

    return filtered;
  }

  private sortAndDiversifyAssets(assets: MediaAsset[]): MediaAsset[] {
    // Sort by quality score
    assets.sort((a, b) => this.getAssetQuality(b) - this.getAssetQuality(a));

    // Diversify to avoid repetitive content
    const diversified: MediaAsset[] = [];
    const usedSources = new Set<string>();
    const usedMoods = new Set<string>();

    for (const asset of assets) {
      const source = asset.metadata?.source || 'unknown';
      const mood = asset.metadata?.mood || 'unknown';

      // Prefer diversity in sources and moods
      const sourceCount = Array.from(usedSources).filter(s => s === source).length;
      const moodCount = Array.from(usedMoods).filter(m => m === mood).length;

      // Add penalty for overused sources/moods
      if (sourceCount >= 2 || moodCount >= 2) {
        continue;
      }

      diversified.push(asset);
      usedSources.add(source);
      usedMoods.add(mood);

      // Stop when we have enough diverse assets
      if (diversified.length >= 5) break;
    }

    // Fill remaining slots with highest quality assets
    const remaining = assets.filter(asset => !diversified.includes(asset));
    diversified.push(...remaining.slice(0, Math.max(0, 5 - diversified.length)));

    return diversified;
  }

  private async preloadAssets(assets: MediaAsset[]): Promise<void> {
    const urls = assets.map(asset => asset.url);
    await imageCache.preloadImages(urls, 'high');
  }

  private getCityName(airportCode: string): string {
    const cityMap: Record<string, string> = {
      'CDG': 'Paris',
      'LAS': 'Las Vegas',
      'JFK': 'New York',
      'LAX': 'Los Angeles',
      'NRT': 'Tokyo',
      'LHR': 'London'
    };
    return cityMap[airportCode] || 'Unknown';
  }

  private getCountryName(airportCode: string): string {
    const countryMap: Record<string, string> = {
      'CDG': 'France',
      'LAS': 'United States',
      'JFK': 'United States',
      'LAX': 'United States',
      'NRT': 'Japan',
      'LHR': 'United Kingdom'
    };
    return countryMap[airportCode] || 'Unknown';
  }
}

export const assetManager = new AssetManager();