/**
 * DestinationMediaMapper - Intelligent content selection and mapping
 * Provides contextual, seasonal, and mood-based media selection for destinations
 */

import { MediaAsset } from './AssetManager';
import { imageCache } from './ImageCache';

interface LocationContext {
  airportCode: string;
  cityName: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  timezone: string;
  seasonality: boolean;
}

interface MediaSelectionCriteria {
  mood?: 'romantic' | 'adventure' | 'relaxation' | 'cultural' | 'nightlife' | 'nature';
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  season?: 'spring' | 'summer' | 'fall' | 'winter';
  weatherContext?: 'sunny' | 'cloudy' | 'rainy' | 'snowy';
  travelStyle?: 'luxury' | 'budget' | 'business' | 'family' | 'solo';
  duration?: 'short' | 'medium' | 'long'; // trip duration
  interests?: string[]; // user interests like 'food', 'museums', 'nightlife'
}

interface SeasonalMediaCollection {
  spring: MediaAsset[];
  summer: MediaAsset[];
  fall: MediaAsset[];
  winter: MediaAsset[];
}

interface TimeBasedMediaCollection {
  morning: MediaAsset[];
  afternoon: MediaAsset[];
  evening: MediaAsset[];
  night: MediaAsset[];
}

class DestinationMediaMapper {
  // Enhanced destination database with rich metadata
  private readonly DESTINATION_DATABASE: Record<string, LocationContext & {
    keywords: string[];
    seasonalContent: boolean;
    timeVariations: boolean;
    defaultMood: string[];
    culturalHighlights: string[];
    naturalFeatures: string[];
    architecturalStyles: string[];
  }> = {
    'CDG': {
      airportCode: 'CDG',
      cityName: 'Paris',
      country: 'France',
      coordinates: { latitude: 48.8566, longitude: 2.3522 },
      timezone: 'Europe/Paris',
      seasonality: true,
      keywords: ['paris', 'eiffel tower', 'louvre', 'seine', 'champs elysees', 'montmartre'],
      seasonalContent: true,
      timeVariations: true,
      defaultMood: ['romantic', 'cultural', 'historic'],
      culturalHighlights: ['museums', 'cafes', 'fashion', 'art'],
      naturalFeatures: ['river', 'parks', 'gardens'],
      architecturalStyles: ['classical', 'baroque', 'modern']
    },
    'LAS': {
      airportCode: 'LAS',
      cityName: 'Las Vegas',
      country: 'United States',
      coordinates: { latitude: 36.1699, longitude: -115.1398 },
      timezone: 'America/Los_Angeles',
      seasonality: false,
      keywords: ['las vegas', 'neon', 'casino', 'strip', 'entertainment', 'shows'],
      seasonalContent: false,
      timeVariations: true,
      defaultMood: ['nightlife', 'entertainment', 'luxury'],
      culturalHighlights: ['casinos', 'shows', 'dining', 'nightlife'],
      naturalFeatures: ['desert', 'mountains'],
      architecturalStyles: ['modern', 'themed', 'spectacular']
    },
    'JFK': {
      airportCode: 'JFK',
      cityName: 'New York',
      country: 'United States',
      coordinates: { latitude: 40.7128, longitude: -74.0060 },
      timezone: 'America/New_York',
      seasonality: true,
      keywords: ['new york', 'manhattan', 'skyline', 'times square', 'brooklyn bridge', 'central park'],
      seasonalContent: true,
      timeVariations: true,
      defaultMood: ['urban', 'energetic', 'cultural'],
      culturalHighlights: ['museums', 'broadway', 'dining', 'fashion'],
      naturalFeatures: ['harbor', 'parks', 'rivers'],
      architecturalStyles: ['skyscrapers', 'art deco', 'modern']
    },
    'LAX': {
      airportCode: 'LAX',
      cityName: 'Los Angeles',
      country: 'United States',
      coordinates: { latitude: 34.0522, longitude: -118.2437 },
      timezone: 'America/Los_Angeles',
      seasonality: false,
      keywords: ['los angeles', 'hollywood', 'beach', 'sunset', 'palm trees', 'beverly hills'],
      seasonalContent: false,
      timeVariations: true,
      defaultMood: ['relaxation', 'entertainment', 'beach'],
      culturalHighlights: ['entertainment', 'dining', 'shopping', 'art'],
      naturalFeatures: ['beaches', 'mountains', 'deserts'],
      architecturalStyles: ['modern', 'spanish colonial', 'contemporary']
    },
    'NRT': {
      airportCode: 'NRT',
      cityName: 'Tokyo',
      country: 'Japan',
      coordinates: { latitude: 35.6762, longitude: 139.6503 },
      timezone: 'Asia/Tokyo',
      seasonality: true,
      keywords: ['tokyo', 'shibuya', 'cherry blossom', 'temple', 'neon', 'traditional'],
      seasonalContent: true,
      timeVariations: true,
      defaultMood: ['cultural', 'modern', 'traditional'],
      culturalHighlights: ['temples', 'technology', 'food', 'traditions'],
      naturalFeatures: ['gardens', 'parks', 'mountains'],
      architecturalStyles: ['traditional', 'ultra-modern', 'minimalist']
    },
    'LHR': {
      airportCode: 'LHR',
      cityName: 'London',
      country: 'United Kingdom',
      coordinates: { latitude: 51.5074, longitude: -0.1278 },
      timezone: 'Europe/London',
      seasonality: true,
      keywords: ['london', 'big ben', 'thames', 'tower bridge', 'buckingham palace', 'red bus'],
      seasonalContent: true,
      timeVariations: true,
      defaultMood: ['historic', 'cultural', 'royal'],
      culturalHighlights: ['history', 'royalty', 'museums', 'theater'],
      naturalFeatures: ['river', 'parks', 'countryside'],
      architecturalStyles: ['victorian', 'georgian', 'modern']
    }
  };

  // Mood-based content mapping
  private readonly MOOD_MAPPING = {
    romantic: {
      keywords: ['sunset', 'couple', 'intimate', 'cozy', 'romantic', 'elegant'],
      timePreference: ['evening', 'night'],
      colorPalette: ['warm', 'golden', 'soft'],
    },
    adventure: {
      keywords: ['action', 'outdoor', 'active', 'exciting', 'dynamic', 'sports'],
      timePreference: ['morning', 'afternoon'],
      colorPalette: ['vibrant', 'bold', 'natural'],
    },
    relaxation: {
      keywords: ['peaceful', 'calm', 'spa', 'beach', 'serene', 'quiet'],
      timePreference: ['morning', 'afternoon'],
      colorPalette: ['soft', 'pastel', 'natural'],
    },
    cultural: {
      keywords: ['museum', 'historic', 'art', 'architecture', 'traditional', 'heritage'],
      timePreference: ['afternoon', 'morning'],
      colorPalette: ['rich', 'classic', 'sophisticated'],
    },
    nightlife: {
      keywords: ['night', 'neon', 'party', 'entertainment', 'vibrant', 'energy'],
      timePreference: ['evening', 'night'],
      colorPalette: ['neon', 'dramatic', 'bold'],
    },
    nature: {
      keywords: ['natural', 'landscape', 'outdoor', 'green', 'scenic', 'wildlife'],
      timePreference: ['morning', 'afternoon'],
      colorPalette: ['natural', 'earth', 'green'],
    }
  };

  /**
   * Get intelligently selected media for a destination based on context
   */
  async getContextualMedia(
    airportCode: string,
    criteria: MediaSelectionCriteria = {},
    limit: number = 5
  ): Promise<MediaAsset[]> {
    const destination = this.DESTINATION_DATABASE[airportCode];
    if (!destination) {
      return this.getFallbackMedia(airportCode, limit);
    }

    // Determine current context
    const currentContext = this.getCurrentContext(destination, criteria);
    
    // Get base media collection
    let mediaCollection = await this.getBaseMediaCollection(destination);
    
    // Apply contextual filtering
    mediaCollection = this.applyContextualFiltering(mediaCollection, currentContext, criteria);
    
    // Apply mood-based selection
    if (criteria.mood) {
      mediaCollection = this.applyMoodFiltering(mediaCollection, criteria.mood);
    }
    
    // Apply time-based selection
    if (criteria.timeOfDay) {
      mediaCollection = this.applyTimeBasedFiltering(mediaCollection, criteria.timeOfDay);
    }
    
    // Apply seasonal selection
    if (criteria.season && destination.seasonalContent) {
      mediaCollection = this.applySeasonalFiltering(mediaCollection, criteria.season);
    }
    
    // Score and rank media
    const rankedMedia = this.scoreAndRankMedia(mediaCollection, criteria, destination);
    
    // Diversify selection to avoid repetitive content
    const diversifiedMedia = this.diversifySelection(rankedMedia, limit);
    
    // Ensure progressive loading setup
    await this.setupProgressiveLoading(diversifiedMedia);
    
    return diversifiedMedia.slice(0, limit);
  }

  /**
   * Get seasonal media recommendations
   */
  getSeasonalMedia(airportCode: string, season: 'spring' | 'summer' | 'fall' | 'winter'): MediaAsset[] {
    const destination = this.DESTINATION_DATABASE[airportCode];
    if (!destination?.seasonalContent) {
      return [];
    }

    const seasonalKeywords = {
      spring: ['bloom', 'fresh', 'green', 'flowers', 'renewal'],
      summer: ['sunny', 'bright', 'warm', 'outdoor', 'vibrant'],
      fall: ['autumn', 'colorful', 'golden', 'harvest', 'cozy'],
      winter: ['snow', 'winter', 'cold', 'festive', 'lights']
    };

    // This would be integrated with the asset manager to filter by seasonal tags
    return [];
  }

  /**
   * Get time-appropriate media based on local time
   */
  getTimeBasedMedia(airportCode: string, localTime?: Date): MediaAsset[] {
    const destination = this.DESTINATION_DATABASE[airportCode];
    if (!destination) return [];

    const time = localTime || new Date();
    const hour = time.getHours();
    
    let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    if (hour >= 5 && hour < 12) timeOfDay = 'morning';
    else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
    else if (hour >= 17 && hour < 21) timeOfDay = 'evening';
    else timeOfDay = 'night';

    // Return media appropriate for time of day
    return this.getContextualMedia(airportCode, { timeOfDay }).then(media => media);
  }

  /**
   * Get personalized recommendations based on user preferences
   */
  async getPersonalizedMedia(
    airportCode: string,
    userPreferences: {
      interests: string[];
      travelStyle: string;
      previousDestinations: string[];
      favoriteTypes: ('urban' | 'nature' | 'cultural' | 'adventure')[];
    },
    limit: number = 5
  ): Promise<MediaAsset[]> {
    // Determine mood based on user preferences
    let mood: MediaSelectionCriteria['mood'] = 'cultural';
    
    if (userPreferences.favoriteTypes.includes('adventure')) mood = 'adventure';
    else if (userPreferences.favoriteTypes.includes('nature')) mood = 'nature';
    else if (userPreferences.interests.includes('nightlife')) mood = 'nightlife';
    else if (userPreferences.travelStyle === 'luxury') mood = 'romantic';

    const criteria: MediaSelectionCriteria = {
      mood,
      travelStyle: userPreferences.travelStyle as any,
      interests: userPreferences.interests
    };

    return this.getContextualMedia(airportCode, criteria, limit);
  }

  // Private methods

  private getCurrentContext(destination: LocationContext, criteria: MediaSelectionCriteria): any {
    const now = new Date();
    
    // Determine season if not provided
    let season = criteria.season;
    if (!season && destination.seasonality) {
      season = this.getCurrentSeason(destination.coordinates);
    }
    
    // Determine time of day if not provided
    let timeOfDay = criteria.timeOfDay;
    if (!timeOfDay) {
      timeOfDay = this.getTimeOfDay(now);
    }

    return {
      season,
      timeOfDay,
      isWeekend: now.getDay() === 0 || now.getDay() === 6,
      localTime: now,
    };
  }

  private async getBaseMediaCollection(destination: any): Promise<MediaAsset[]> {
    // This would integrate with AssetManager to get the base collection
    // For now, return empty array as placeholder
    return [];
  }

  private applyContextualFiltering(
    media: MediaAsset[],
    context: any,
    criteria: MediaSelectionCriteria
  ): MediaAsset[] {
    return media.filter(asset => {
      // Filter based on weather context
      if (criteria.weatherContext === 'sunny' && asset.tags.includes('indoor')) {
        return false;
      }
      
      // Filter based on travel style
      if (criteria.travelStyle === 'luxury' && !asset.tags.includes('luxury') && !asset.tags.includes('elegant')) {
        return false;
      }
      
      // Filter based on interests
      if (criteria.interests?.length) {
        const hasRelevantInterest = criteria.interests.some(interest => 
          asset.tags.includes(interest) || asset.description.toLowerCase().includes(interest)
        );
        if (!hasRelevantInterest) return false;
      }
      
      return true;
    });
  }

  private applyMoodFiltering(media: MediaAsset[], mood: string): MediaAsset[] {
    const moodData = this.MOOD_MAPPING[mood as keyof typeof this.MOOD_MAPPING];
    if (!moodData) return media;

    return media.filter(asset => {
      // Check if asset matches mood keywords
      const matchesMoodKeywords = moodData.keywords.some(keyword =>
        asset.tags.includes(keyword) || 
        asset.description.toLowerCase().includes(keyword)
      );
      
      return matchesMoodKeywords;
    });
  }

  private applyTimeBasedFiltering(media: MediaAsset[], timeOfDay: string): MediaAsset[] {
    return media.filter(asset => {
      // Check if asset has time-specific tags
      if (asset.metadata?.timeOfDay) {
        return asset.metadata.timeOfDay === timeOfDay;
      }
      
      // Infer from tags
      const timeKeywords = {
        morning: ['sunrise', 'morning', 'dawn', 'early'],
        afternoon: ['afternoon', 'day', 'daylight', 'midday'],
        evening: ['sunset', 'evening', 'dusk', 'golden hour'],
        night: ['night', 'neon', 'lights', 'nighttime']
      };
      
      const keywords = timeKeywords[timeOfDay as keyof typeof timeKeywords] || [];
      return keywords.some(keyword => 
        asset.tags.includes(keyword) || 
        asset.description.toLowerCase().includes(keyword)
      );
    });
  }

  private applySeasonalFiltering(media: MediaAsset[], season: string): MediaAsset[] {
    return media.filter(asset => {
      if (asset.metadata?.season) {
        return asset.metadata.season === season;
      }
      
      const seasonalKeywords = {
        spring: ['spring', 'bloom', 'flowers', 'fresh', 'green'],
        summer: ['summer', 'sunny', 'beach', 'warm', 'bright'],
        fall: ['fall', 'autumn', 'golden', 'colorful', 'harvest'],
        winter: ['winter', 'snow', 'cold', 'festive', 'cozy']
      };
      
      const keywords = seasonalKeywords[season as keyof typeof seasonalKeywords] || [];
      return keywords.some(keyword => 
        asset.tags.includes(keyword) || 
        asset.description.toLowerCase().includes(keyword)
      );
    });
  }

  private scoreAndRankMedia(
    media: MediaAsset[],
    criteria: MediaSelectionCriteria,
    destination: any
  ): MediaAsset[] {
    return media.map(asset => {
      let score = asset.quality || 50; // Base quality score
      
      // Boost score for destination-specific content
      const destinationKeywords = destination.keywords || [];
      const matchingKeywords = destinationKeywords.filter(keyword =>
        asset.tags.includes(keyword) || 
        asset.description.toLowerCase().includes(keyword)
      );
      score += matchingKeywords.length * 5;
      
      // Boost for mood alignment
      if (criteria.mood && asset.metadata?.mood === criteria.mood) {
        score += 15;
      }
      
      // Boost for cultural highlights
      const culturalHighlights = destination.culturalHighlights || [];
      const matchingCultural = culturalHighlights.filter(highlight =>
        asset.tags.includes(highlight) || 
        asset.description.toLowerCase().includes(highlight)
      );
      score += matchingCultural.length * 3;
      
      return { ...asset, score };
    }).sort((a, b) => (b.score || 0) - (a.score || 0));
  }

  private diversifySelection(media: MediaAsset[], limit: number): MediaAsset[] {
    const diversified: MediaAsset[] = [];
    const usedSources = new Set<string>();
    const usedMoods = new Set<string>();
    
    for (const asset of media) {
      if (diversified.length >= limit) break;
      
      const source = asset.metadata?.source || 'unknown';
      const mood = asset.metadata?.mood || 'unknown';
      
      // Ensure source diversity
      const sourceCount = Array.from(usedSources).filter(s => s === source).length;
      const moodCount = Array.from(usedMoods).filter(m => m === mood).length;
      
      if (sourceCount < 2 && moodCount < 2) {
        diversified.push(asset);
        usedSources.add(source);
        usedMoods.add(mood);
      }
    }
    
    // Fill remaining slots if needed
    const remaining = media.filter(asset => !diversified.includes(asset));
    diversified.push(...remaining.slice(0, limit - diversified.length));
    
    return diversified;
  }

  private async setupProgressiveLoading(media: MediaAsset[]): Promise<void> {
    const urls = media.map(asset => asset.url);
    await imageCache.preloadImages(urls, 'high');
  }

  private getCurrentSeason(coordinates?: { latitude: number; longitude: number }): 'spring' | 'summer' | 'fall' | 'winter' {
    const now = new Date();
    const month = now.getMonth();
    
    // Northern hemisphere seasons (default)
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }

  private getTimeOfDay(date: Date): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = date.getHours();
    
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  private async getFallbackMedia(airportCode: string, limit: number): Promise<MediaAsset[]> {
    // Return basic media from existing service
    return [];
  }
}

export const destinationMediaMapper = new DestinationMediaMapper();
export type { MediaSelectionCriteria, LocationContext };