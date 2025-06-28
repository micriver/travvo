/**
 * Enhanced Pexels Video Service
 * Provides intelligent video search with semantic city matching and optimization integration
 */

import { videoOptimizer } from './VideoOptimizer';
import { imageCache } from './ImageCache';

interface PexelsVideo {
  id: number;
  width: number;
  height: number;
  duration: number;
  user: {
    id: number;
    name: string;
    url: string;
  };
  video_files: Array<{
    id: number;
    quality: string;
    file_type: string;
    width: number;
    height: number;
    link: string;
  }>;
  video_pictures: Array<{
    id: number;
    picture: string;
    nr: number;
  }>;
  tags?: string[];
  image: string;
}

interface PexelsSearchResponse {
  total_results: number;
  page: number;
  per_page: number;
  videos: PexelsVideo[];
  next_page?: string;
}

interface EnhancedVideoAsset {
  id: string;
  type: 'video';
  url: string;
  previewUrl: string;
  credit: string;
  description: string;
  quality: number;
  tags: string[];
  isOptimized: boolean;
  duration?: number;
  aspectRatio?: number;
  metadata?: {
    originalQuality: string;
    width: number;
    height: number;
    relevanceScore: number;
    searchContext: string;
  };
}

interface SearchOptions {
  orientation?: 'landscape' | 'portrait' | 'square';
  size?: 'large' | 'medium' | 'small';
  duration?: 'short' | 'medium' | 'long'; // short: <30s, medium: 30-120s, long: >120s
  quality?: 'high' | 'medium' | 'low';
  perPage?: number;
  page?: number;
}

class PexelsVideoService {
  private apiKey: string;
  private baseUrl = 'https://api.pexels.com/videos';
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;
  private rateLimitDelay = 1000; // 1 second between requests
  private lastRequestTime = 0;

  // Enhanced destination mapping with semantic search terms
  private readonly DESTINATION_VIDEO_MAPPING: Record<string, {
    primaryTerms: string[];
    secondaryTerms: string[];
    culturalTerms: string[];
    timeBasedTerms: Record<string, string[]>;
    seasonalTerms: Record<string, string[]>;
    moodTerms: Record<string, string[]>;
  }> = {
    'CDG': { // Paris
      primaryTerms: ['paris', 'eiffel tower', 'seine river', 'louvre', 'champs elysees'],
      secondaryTerms: ['france', 'parisian', 'montmartre', 'notre dame', 'sacre coeur'],
      culturalTerms: ['cafe culture', 'french architecture', 'art museums', 'fashion'],
      timeBasedTerms: {
        morning: ['paris sunrise', 'morning coffee paris', 'quiet streets paris'],
        afternoon: ['paris museums', 'seine walk', 'shopping paris'],
        evening: ['paris sunset', 'eiffel tower lights', 'romantic paris'],
        night: ['paris nightlife', 'illuminated landmarks', 'city lights paris']
      },
      seasonalTerms: {
        spring: ['paris spring', 'cherry blossoms paris', 'gardens paris'],
        summer: ['paris summer', 'outdoor cafes', 'seine cruise'],
        fall: ['paris autumn', 'golden leaves', 'cozy cafes'],
        winter: ['paris winter', 'christmas markets', 'snow paris']
      },
      moodTerms: {
        romantic: ['romantic paris', 'couple paris', 'intimate moments'],
        cultural: ['art paris', 'museums', 'architecture'],
        adventure: ['explore paris', 'walking tours', 'discovering'],
        relaxation: ['peaceful paris', 'calm moments', 'serene']
      }
    },
    'LAS': { // Las Vegas
      primaryTerms: ['las vegas', 'vegas strip', 'neon lights', 'casinos', 'entertainment'],
      secondaryTerms: ['nevada', 'gambling', 'shows', 'hotels', 'desert'],
      culturalTerms: ['entertainment', 'performers', 'magic shows', 'dining'],
      timeBasedTerms: {
        morning: ['vegas morning', 'empty strip', 'desert sunrise'],
        afternoon: ['vegas pools', 'day activities', 'shopping vegas'],
        evening: ['vegas shows', 'entertainment', 'dining vegas'],
        night: ['vegas nightlife', 'neon spectacle', 'party vegas']
      },
      seasonalTerms: {
        spring: ['vegas spring', 'pleasant weather', 'outdoor activities'],
        summer: ['vegas summer', 'pool parties', 'air conditioning'],
        fall: ['vegas fall', 'comfortable weather', 'outdoor dining'],
        winter: ['vegas winter', 'mild climate', 'indoor entertainment']
      },
      moodTerms: {
        nightlife: ['vegas party', 'clubbing', 'excitement'],
        luxury: ['high roller', 'VIP vegas', 'luxury hotels'],
        adventure: ['vegas thrills', 'shows', 'experiences'],
        relaxation: ['spa vegas', 'resort life', 'poolside']
      }
    },
    'JFK': { // New York
      primaryTerms: ['new york', 'manhattan', 'brooklyn bridge', 'times square', 'skyline'],
      secondaryTerms: ['nyc', 'statue liberty', 'central park', 'broadway', 'empire state'],
      culturalTerms: ['museums', 'theater', 'art galleries', 'music venues'],
      timeBasedTerms: {
        morning: ['nyc morning', 'rush hour', 'coffee culture'],
        afternoon: ['museums nyc', 'shopping', 'central park'],
        evening: ['broadway shows', 'sunset skyline', 'dining'],
        night: ['nyc nightlife', 'city lights', 'never sleeps']
      },
      seasonalTerms: {
        spring: ['nyc spring', 'central park bloom', 'mild weather'],
        summer: ['nyc summer', 'outdoor concerts', 'rooftops'],
        fall: ['nyc autumn', 'foliage', 'cozy atmosphere'],
        winter: ['nyc winter', 'snow scenes', 'holiday lights']
      },
      moodTerms: {
        urban: ['city life', 'metropolitan', 'bustling'],
        cultural: ['museums', 'art', 'theater'],
        adventure: ['explore nyc', 'city adventures', 'discovery'],
        romantic: ['romantic nyc', 'intimate restaurants', 'views']
      }
    },
    'LAX': { // Los Angeles
      primaryTerms: ['los angeles', 'hollywood', 'santa monica', 'beverly hills', 'sunset strip'],
      secondaryTerms: ['california', 'la beaches', 'palm trees', 'venice beach', 'griffith'],
      culturalTerms: ['entertainment industry', 'art scene', 'fitness culture', 'food trucks'],
      timeBasedTerms: {
        morning: ['la morning', 'beach sunrise', 'yoga'],
        afternoon: ['beach activities', 'shopping', 'outdoor dining'],
        evening: ['sunset boulevard', 'golden hour', 'rooftop bars'],
        night: ['hollywood nightlife', 'clubs', 'entertainment']
      },
      seasonalTerms: {
        spring: ['la spring', 'wildflowers', 'perfect weather'],
        summer: ['la summer', 'beach season', 'outdoor festivals'],
        fall: ['la fall', 'warm days', 'harvest season'],
        winter: ['la winter', 'mild climate', 'indoor activities']
      },
      moodTerms: {
        relaxation: ['beach vibes', 'laid back', 'wellness'],
        adventure: ['hiking', 'surfing', 'exploring'],
        entertainment: ['hollywood', 'shows', 'celebrities'],
        nature: ['beaches', 'mountains', 'outdoor']
      }
    },
    'NRT': { // Tokyo
      primaryTerms: ['tokyo', 'shibuya', 'shinjuku', 'harajuku', 'ginza'],
      secondaryTerms: ['japan', 'temples', 'cherry blossom', 'traditional', 'modern'],
      culturalTerms: ['traditional culture', 'technology', 'food culture', 'zen'],
      timeBasedTerms: {
        morning: ['tokyo morning', 'temple visits', 'fish market'],
        afternoon: ['tokyo shopping', 'cultural sites', 'museums'],
        evening: ['tokyo sunset', 'neon lights', 'street food'],
        night: ['tokyo nightlife', 'neon city', 'karaoke']
      },
      seasonalTerms: {
        spring: ['cherry blossom', 'sakura', 'hanami'],
        summer: ['tokyo summer', 'festivals', 'humid'],
        fall: ['tokyo autumn', 'colorful leaves', 'mild'],
        winter: ['tokyo winter', 'illuminations', 'cold']
      },
      moodTerms: {
        cultural: ['traditional japan', 'temples', 'ceremonies'],
        modern: ['technology', 'futuristic', 'innovation'],
        nature: ['gardens', 'parks', 'natural beauty'],
        adventure: ['explore tokyo', 'discovery', 'unique experiences']
      }
    },
    'LHR': { // London
      primaryTerms: ['london', 'big ben', 'tower bridge', 'thames', 'buckingham palace'],
      secondaryTerms: ['england', 'westminster', 'london eye', 'red buses', 'telephone boxes'],
      culturalTerms: ['royal heritage', 'museums', 'theater', 'pub culture'],
      timeBasedTerms: {
        morning: ['london morning', 'fog', 'commuters'],
        afternoon: ['museums london', 'shopping', 'parks'],
        evening: ['london sunset', 'theater district', 'pubs'],
        night: ['london nightlife', 'city lights', 'entertainment']
      },
      seasonalTerms: {
        spring: ['london spring', 'gardens bloom', 'mild weather'],
        summer: ['london summer', 'long days', 'outdoor events'],
        fall: ['london autumn', 'colorful parks', 'cozy pubs'],
        winter: ['london winter', 'christmas markets', 'festive']
      },
      moodTerms: {
        historic: ['royal london', 'historic sites', 'traditions'],
        cultural: ['museums', 'theater', 'art'],
        adventure: ['explore london', 'walking tours', 'discovery'],
        romantic: ['romantic london', 'river walks', 'cozy']
      }
    }
  };

  constructor() {
    this.apiKey = process.env.EXPO_PUBLIC_PEXELS_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Pexels API key not found. Video search will be disabled.');
    }
  }

  /**
   * Get intelligently matched videos for a destination
   */
  async getDestinationVideos(
    airportCode: string,
    cityName?: string,
    options: SearchOptions & {
      mood?: string;
      timeOfDay?: string;
      season?: string;
      fallbackToGeneric?: boolean;
    } = {}
  ): Promise<EnhancedVideoAsset[]> {
    if (!this.apiKey) {
      console.log('ℹ️ Add EXPO_PUBLIC_PEXELS_API_KEY to .env for enhanced travel videos');
      return [];
    }

    const destinationMapping = this.DESTINATION_VIDEO_MAPPING[airportCode];
    const searchQueries = this.buildSearchQueries(airportCode, cityName, destinationMapping, options);
    
    const allVideos: EnhancedVideoAsset[] = [];
    
    // Execute searches with intelligent fallback
    for (const query of searchQueries) {
      try {
        const videos = await this.searchVideos(query.searchTerm, {
          ...options,
          perPage: Math.min(options.perPage || 3, 5)
        });
        
        // Score videos based on relevance
        const scoredVideos = this.scoreVideoRelevance(videos, query, airportCode);
        allVideos.push(...scoredVideos);
        
        // Stop if we have enough high-quality results
        if (allVideos.length >= (options.perPage || 5) && query.priority === 'high') {
          break;
        }
      } catch (error) {
        console.warn(`Failed to search videos for "${query.searchTerm}":`, error);
      }
    }

    // Remove duplicates and sort by relevance
    const uniqueVideos = this.deduplicateAndRank(allVideos);
    
    // Apply final filtering and optimization
    return this.finalizeVideoSelection(uniqueVideos, options);
  }

  /**
   * Search videos with rate limiting and error handling
   */
  private async searchVideos(query: string, options: SearchOptions = {}): Promise<PexelsVideo[]> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          await this.enforceRateLimit();
          
          const params = new URLSearchParams({
            query: query,
            per_page: (options.perPage || 5).toString(),
            page: (options.page || 1).toString(),
          });

          if (options.orientation) params.append('orientation', options.orientation);
          if (options.size) params.append('size', options.size);

          const response = await fetch(`${this.baseUrl}/search?${params}`, {
            headers: {
              'Authorization': this.apiKey,
              'User-Agent': 'AI-Travel-App/1.0'
            },
          });

          if (!response.ok) {
            throw new Error(`Pexels API error: ${response.status} ${response.statusText}`);
          }

          const data: PexelsSearchResponse = await response.json();
          resolve(data.videos || []);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  /**
   * Build intelligent search queries based on destination and context
   */
  private buildSearchQueries(
    airportCode: string,
    cityName?: string,
    destinationMapping?: any,
    options: any = {}
  ): Array<{ searchTerm: string; priority: 'high' | 'medium' | 'low'; context: string }> {
    const queries: Array<{ searchTerm: string; priority: 'high' | 'medium' | 'low'; context: string }> = [];

    if (destinationMapping) {
      // High-priority contextual searches
      if (options.mood && destinationMapping.moodTerms[options.mood]) {
        destinationMapping.moodTerms[options.mood].forEach((term: string) => {
          queries.push({ searchTerm: term, priority: 'high', context: `mood-${options.mood}` });
        });
      }

      if (options.timeOfDay && destinationMapping.timeBasedTerms[options.timeOfDay]) {
        destinationMapping.timeBasedTerms[options.timeOfDay].forEach((term: string) => {
          queries.push({ searchTerm: term, priority: 'high', context: `time-${options.timeOfDay}` });
        });
      }

      if (options.season && destinationMapping.seasonalTerms[options.season]) {
        destinationMapping.seasonalTerms[options.season].forEach((term: string) => {
          queries.push({ searchTerm: term, priority: 'high', context: `season-${options.season}` });
        });
      }

      // Medium-priority primary terms
      destinationMapping.primaryTerms.forEach((term: string) => {
        queries.push({ searchTerm: `${term} travel`, priority: 'medium', context: 'primary' });
      });

      // Low-priority secondary and cultural terms
      destinationMapping.secondaryTerms.forEach((term: string) => {
        queries.push({ searchTerm: `${term} destination`, priority: 'low', context: 'secondary' });
      });

      destinationMapping.culturalTerms.forEach((term: string) => {
        queries.push({ searchTerm: `${term} travel`, priority: 'low', context: 'cultural' });
      });
    }

    // Fallback searches
    if (cityName) {
      queries.push({ searchTerm: `${cityName} travel`, priority: 'medium', context: 'fallback-city' });
      queries.push({ searchTerm: `${cityName} tourism`, priority: 'low', context: 'fallback-tourism' });
    }

    queries.push({ searchTerm: `${airportCode} destination`, priority: 'low', context: 'fallback-airport' });

    // Generic travel fallback
    if (options.fallbackToGeneric !== false) {
      queries.push({ searchTerm: 'travel destination', priority: 'low', context: 'generic' });
    }

    return queries;
  }

  /**
   * Score video relevance based on search context and video metadata
   */
  private scoreVideoRelevance(
    videos: PexelsVideo[],
    query: { searchTerm: string; priority: string; context: string },
    airportCode: string
  ): EnhancedVideoAsset[] {
    return videos.map(video => {
      let relevanceScore = 50; // Base score

      // Priority boost
      if (query.priority === 'high') relevanceScore += 30;
      else if (query.priority === 'medium') relevanceScore += 15;

      // Context boost
      if (query.context.startsWith('mood-')) relevanceScore += 20;
      else if (query.context.startsWith('time-')) relevanceScore += 15;
      else if (query.context.startsWith('season-')) relevanceScore += 15;
      else if (query.context === 'primary') relevanceScore += 10;

      // Duration scoring (prefer medium-length videos)
      const duration = video.duration;
      if (duration >= 10 && duration <= 60) relevanceScore += 10;
      else if (duration >= 5 && duration <= 120) relevanceScore += 5;

      // Aspect ratio scoring (prefer portrait for TikTok-style)
      const aspectRatio = video.height / video.width;
      if (aspectRatio >= 1.3 && aspectRatio <= 1.8) relevanceScore += 15;
      else if (aspectRatio >= 1.0) relevanceScore += 8;

      // Quality scoring
      const hasHdVideo = video.video_files.some(file => 
        file.quality === 'hd' || file.width >= 1280
      );
      if (hasHdVideo) relevanceScore += 10;

      return {
        id: `pexels-${video.id}`,
        type: 'video' as const,
        url: this.selectBestVideoFile(video.video_files),
        previewUrl: video.image,
        credit: `Video by ${video.user.name} on Pexels`,
        description: `${query.searchTerm} - Travel video`,
        quality: Math.min(100, relevanceScore),
        tags: [airportCode.toLowerCase(), query.context, 'travel', 'video'],
        isOptimized: false, // Will be optimized later
        duration: video.duration,
        aspectRatio,
        metadata: {
          originalQuality: video.video_files[0]?.quality || 'unknown',
          width: video.width,
          height: video.height,
          relevanceScore,
          searchContext: query.context
        }
      };
    });
  }

  /**
   * Select the best video file based on quality and compatibility
   */
  private selectBestVideoFile(videoFiles: PexelsVideo['video_files']): string {
    // Prefer HD quality, H.264 format, portrait orientation
    const sortedFiles = videoFiles.sort((a, b) => {
      let scoreA = 0, scoreB = 0;

      // Quality preference: hd > sd > small
      if (a.quality === 'hd') scoreA += 30;
      else if (a.quality === 'sd') scoreA += 20;
      
      if (b.quality === 'hd') scoreB += 30;
      else if (b.quality === 'sd') scoreB += 20;

      // Format preference: mp4 > others
      if (a.file_type === 'video/mp4') scoreA += 20;
      if (b.file_type === 'video/mp4') scoreB += 20;

      // Size preference: not too large, not too small
      const sizeScoreA = a.width >= 720 && a.width <= 1920 ? 10 : 0;
      const sizeScoreB = b.width >= 720 && b.width <= 1920 ? 10 : 0;
      
      scoreA += sizeScoreA;
      scoreB += sizeScoreB;

      return scoreB - scoreA;
    });

    return sortedFiles[0]?.link || videoFiles[0]?.link || '';
  }

  /**
   * Remove duplicates and rank by quality/relevance
   */
  private deduplicateAndRank(videos: EnhancedVideoAsset[]): EnhancedVideoAsset[] {
    const seen = new Set<string>();
    const unique = videos.filter(video => {
      const key = video.url;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return unique.sort((a, b) => (b.quality || 0) - (a.quality || 0));
  }

  /**
   * Finalize video selection with optimization integration
   */
  private async finalizeVideoSelection(
    videos: EnhancedVideoAsset[],
    options: SearchOptions = {}
  ): Promise<EnhancedVideoAsset[]> {
    const limit = options.perPage || 5;
    const selectedVideos = videos.slice(0, limit);

    // Integrate with VideoOptimizer and ImageCache
    for (const video of selectedVideos) {
      try {
        // Try video optimization, but gracefully fallback if it fails
        try {
          console.log('🎬 Optimizing video:', video.url);
          const optimizedVideo = await videoOptimizer.getOptimizedVideo(video.url);
          video.url = optimizedVideo.url;
          video.previewUrl = optimizedVideo.thumbnail || video.previewUrl;
          console.log('✅ Video optimization successful');
        } catch (optimizationError) {
          console.warn('Video optimization failed, using original:', optimizationError);
          // Continue with original video URL
        }

        // Cache thumbnail for faster preview loading
        if (video.previewUrl) {
          try {
            const cachedThumbnail = await imageCache.getOptimizedImage(video.previewUrl, 'medium');
            video.previewUrl = cachedThumbnail;
            console.log('✅ Thumbnail cached successfully');
          } catch (cacheError) {
            console.warn('Thumbnail caching failed, using original:', cacheError);
          }
        }
        
        video.isOptimized = true;
      } catch (error) {
        console.warn('Video processing failed:', error);
      }
    }

    return selectedVideos;
  }

  /**
   * Rate limiting enforcement
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.rateLimitDelay) {
      const delay = this.rateLimitDelay - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Process the request queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) return;
    
    this.isProcessingQueue = true;
    
    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (request) {
        try {
          await request();
        } catch (error) {
          console.warn('Request failed:', error);
        }
      }
    }
    
    this.isProcessingQueue = false;
  }

  /**
   * Get service statistics
   */
  getServiceStats() {
    return {
      queueLength: this.requestQueue.length,
      isProcessing: this.isProcessingQueue,
      hasApiKey: !!this.apiKey,
      rateLimitDelay: this.rateLimitDelay,
      destinationMappings: Object.keys(this.DESTINATION_VIDEO_MAPPING).length
    };
  }
}

export const pexelsVideoService = new PexelsVideoService();
export type { EnhancedVideoAsset, SearchOptions };