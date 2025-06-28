/**
 * Enhanced Media Service for TikTok-style Flight Cards
 * Integrates with AssetManager, ImageCache, VideoOptimizer, and DestinationMediaMapper
 * for intelligent, high-performance media management
 */

import { assetManager, MediaAsset } from './AssetManager';
import { imageCache } from './ImageCache';
import { videoOptimizer } from './VideoOptimizer';
import { destinationMediaMapper, MediaSelectionCriteria } from './DestinationMediaMapper';

interface DestinationMedia {
  id: string;
  type: 'photo' | 'video';
  url: string;
  previewUrl?: string;
  credit: string;
  description: string;
  quality?: number;
  tags?: string[];
  isOptimized?: boolean;
  progressiveUrls?: {
    preview: string;
    full: string;
  };
}

interface UnsplashPhoto {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  user: {
    name: string;
    username: string;
  };
  description: string | null;
  alt_description: string | null;
  width: number;
  height: number;
  color: string;
  tags?: {
    title: string;
  }[];
}

interface CoverrVideo {
  id: number;
  title: string;
  preview_url: string;
  video_url: string;
  thumbnail_url: string;
  duration: number;
}

class MediaService {
  private unsplashAccessKey = process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY || 'demo';
  private baseUnsplashUrl = 'https://api.unsplash.com';
  private hasLoggedUnsplashInfo = false;
  private baseCoverrUrl = 'https://api.coverr.co/v1';
  private isInitialized = false;
  private mediaCache = new Map<string, DestinationMedia[]>();
  private preloadQueue = new Set<string>();

  // All available travel photos - randomly assigned to any destination
  private allTravelPhotos: any[] = [
    require('@/assets/images/unsplash-images/alex-azabache-624WUhcCm4w-unsplash.jpg'),
    require('@/assets/images/unsplash-images/anthony-melone-d1Ndd3zn5go-unsplash.jpg'),
    require('@/assets/images/unsplash-images/bady-abbas-5ov2G7JzphM-unsplash.jpg'),
    require('@/assets/images/unsplash-images/baptx-kw7_Y-4uP3c-unsplash.jpg'),
    require('@/assets/images/unsplash-images/benjamin-ashton-OsUsQip-__0-unsplash.jpg'),
    require('@/assets/images/unsplash-images/benjamin-davies-o9GcL3uyK-U-unsplash.jpg'),
    require('@/assets/images/unsplash-images/cosmic-timetraveler-jQvOExlroYA-unsplash.jpg'),
    require('@/assets/images/unsplash-images/david-gavi-AdIJ9S-kbrc-unsplash.jpg'),
    require('@/assets/images/unsplash-images/david-gavi-ikU9mkrCAdQ-unsplash.jpg'),
    require('@/assets/images/unsplash-images/eric-marty-IZunjrb3soo-unsplash.jpg'),
    require('@/assets/images/unsplash-images/erik-eastman-4HG5hlhmZg8-unsplash.jpg'),
    require('@/assets/images/unsplash-images/guilherme-stecanella-_dH-oQF9w-Y-unsplash.jpg'),
    require('@/assets/images/unsplash-images/guillaume-issaly-OzOQtHn_YqU-unsplash.jpg'),
    require('@/assets/images/unsplash-images/ian-dooley-hpTH5b6mo2s-unsplash.jpg'),
    require('@/assets/images/unsplash-images/ilyuza-mingazova-Q3Chc3uzlWk-unsplash.jpg'),
    require('@/assets/images/unsplash-images/jack-ward-rknrvCrfS1k-unsplash.jpg'),
    require('@/assets/images/unsplash-images/jairph-1XLyzi17Z2M-unsplash.jpg'),
    require('@/assets/images/unsplash-images/james-donaldson-toPRrcyAIUY-unsplash.jpg'),
    require('@/assets/images/unsplash-images/joen-patrick-caagbay-dcxK-qTfQeQ-unsplash.jpg'),
    require('@/assets/images/unsplash-images/joshua-fuller-BUdgiO5dqFA-unsplash.jpg'),
    require('@/assets/images/unsplash-images/killian-pham-j0DrLBZH0nE-unsplash.jpg'),
    require('@/assets/images/unsplash-images/lachlan-gowen-KYjQBkYiRuw-unsplash.jpg'),
  ];

  /**
   * Get enhanced destination media with intelligent selection and optimization
   */
  async getDestinationMedia(
    airportCode: string, 
    cityName?: string,
    options?: {
      mood?: MediaSelectionCriteria['mood'];
      season?: MediaSelectionCriteria['season'];
      timeOfDay?: MediaSelectionCriteria['timeOfDay'];
      includeVideos?: boolean;
      limit?: number;
      preload?: boolean;
    }
  ): Promise<DestinationMedia[]> {
    const cacheKey = `${airportCode}-${JSON.stringify(options || {})}`;
    
    // Check cache first
    if (this.mediaCache.has(cacheKey)) {
      const cached = this.mediaCache.get(cacheKey)!;
      if (options?.preload) {
        this.preloadMedia(cached);
      }
      return cached;
    }

    await this.ensureInitialized();
    
    const media: DestinationMedia[] = [];
    const limit = options?.limit || 5;
    const includeVideos = options?.includeVideos ?? true;

    try {
      // Get intelligently selected assets from AssetManager
      const criteria: MediaSelectionCriteria = {
        mood: options?.mood,
        season: options?.season,
        timeOfDay: options?.timeOfDay
      };

      const intelligentAssets = await destinationMediaMapper.getContextualMedia(
        airportCode,
        criteria,
        limit
      );

      // Convert to DestinationMedia format with optimization
      for (const asset of intelligentAssets) {
        if (!includeVideos && asset.type === 'video') continue;
        
        const optimizedMedia = await this.optimizeAsset(asset);
        media.push(optimizedMedia);
      }
    } catch (error) {
      console.log('Intelligent media selection failed, falling back to traditional methods:', error);
    }

    // Fallback to traditional methods if needed
    if (media.length < limit) {
      await this.addFallbackMedia(media, airportCode, cityName, limit, includeVideos, options);
    }

    // Ensure we have at least some media
    if (media.length === 0) {
      media.push(await this.getDefaultMedia(airportCode));
    }

    // Cache the result
    const finalMedia = media.slice(0, limit);
    this.mediaCache.set(cacheKey, finalMedia);

    // Preload if requested
    if (options?.preload) {
      this.preloadMedia(finalMedia);
    }

    return finalMedia;
  }

  /**
   * Enhanced Unsplash integration with optimization and quality scoring
   */
  private async getUnsplashPhotos(query: string, options?: {
    orientation?: 'portrait' | 'landscape' | 'squarish';
    perPage?: number;
    quality?: 'high' | 'medium' | 'low';
  }): Promise<DestinationMedia[]> {
    const orientation = options?.orientation || 'portrait';
    const perPage = options?.perPage || 3;
    const quality = options?.quality || 'high';

    const response = await fetch(
      `${this.baseUnsplashUrl}/search/photos?query=${encodeURIComponent(query + ' travel destination')}&per_page=${perPage}&orientation=${orientation}&order_by=relevance`,
      {
        headers: {
          'Authorization': `Client-ID ${this.unsplashAccessKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Unsplash API request failed: ${response.status}`);
    }

    const data = await response.json();
    const photos: UnsplashPhoto[] = data.results || [];

    const destinationMedia: DestinationMedia[] = [];

    for (const photo of photos) {
      // Get optimized URL from cache
      const optimizedUrl = await imageCache.getOptimizedImage(photo.urls.regular, quality);
      const progressiveUrls = imageCache.getProgressiveUrls(photo.urls.regular);

      // Calculate quality score based on Unsplash metrics
      const qualityScore = this.calculateUnsplashQualityScore(photo);

      destinationMedia.push({
        id: `unsplash-${photo.id}`,
        type: 'photo',
        url: optimizedUrl,
        previewUrl: photo.urls.small,
        credit: `Photo by ${photo.user.name} on Unsplash`,
        description: photo.description || photo.alt_description || 'Beautiful destination',
        quality: qualityScore,
        tags: photo.tags?.map(tag => tag.title) || [],
        isOptimized: true,
        progressiveUrls
      });
    }

    return destinationMedia;
  }

  /**
   * Enhanced Coverr integration with video optimization
   */
  private async getCoverrVideos(query: string, options?: {
    perPage?: number;
    duration?: 'short' | 'medium' | 'long';
  }): Promise<DestinationMedia[]> {
    const perPage = options?.perPage || 2;
    
    const response = await fetch(
      `${this.baseCoverrUrl}/videos?query=${encodeURIComponent(query)}&per_page=${perPage}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Coverr API request failed: ${response.status}`);
    }

    const data = await response.json();
    const videos: CoverrVideo[] = data.results || [];

    const destinationMedia: DestinationMedia[] = [];

    for (const video of videos) {
      // Get optimized video URL
      const optimizedVideo = await videoOptimizer.getOptimizedVideo(video.video_url);
      
      destinationMedia.push({
        id: `coverr-${video.id}`,
        type: 'video',
        url: optimizedVideo.url,
        previewUrl: optimizedVideo.thumbnail,
        credit: 'Video by Coverr',
        description: video.title,
        quality: 75, // Good quality for Coverr videos
        tags: [query, 'travel', 'video'],
        isOptimized: true
      });
    }

    return destinationMedia;
  }

  /**
   * Get random travel photos from local collection
   */
  private async getLocalPhotos(airportCode: string): Promise<DestinationMedia[]> {
    const destinationMedia: DestinationMedia[] = [];
    const numPhotos = 3; // Get 3 random photos for each destination
    
    // Shuffle photos array and take the first numPhotos
    const shuffledPhotos = [...this.allTravelPhotos].sort(() => Math.random() - 0.5);
    const selectedPhotos = shuffledPhotos.slice(0, numPhotos);
    
    for (let index = 0; index < selectedPhotos.length; index++) {
      const photo = selectedPhotos[index];
      
      // For local assets (require'd images), use them directly without caching
      // since they're already bundled with the app
      destinationMedia.push({
        id: `local-${airportCode}-${index}`,
        type: 'photo',
        url: photo, // Use the require'd asset directly
        credit: 'Curated collection by Unsplash',
        description: `Beautiful travel destination photo`,
        quality: 85, // High quality for curated local assets
        tags: ['destination', 'travel'],
        isOptimized: true, // Local assets are pre-optimized
      });
    }
    
    return destinationMedia;
  }

  /**
   * Get enhanced Pexels videos with intelligent city matching
   */
  private async getLocalVideoAssets(
    query: string, 
    limit: number, 
    airportCode?: string,
    options?: {
      mood?: string;
      timeOfDay?: string;
      season?: string;
    }
  ): Promise<DestinationMedia[]> {
    const { pexelsVideoService } = await import('./PexelsVideoService');
    
    try {
      const enhancedVideos = await pexelsVideoService.getDestinationVideos(
        airportCode || query.toUpperCase(),
        query,
        {
          perPage: Math.min(limit, 5),
          orientation: 'portrait', // TikTok-style
          quality: 'high',
          mood: options?.mood,
          timeOfDay: options?.timeOfDay,
          season: options?.season,
          fallbackToGeneric: true
        }
      );

      return enhancedVideos.map(video => ({
        id: video.id,
        type: 'video' as const,
        url: video.url,
        previewUrl: video.previewUrl,
        credit: video.credit,
        description: video.description,
        quality: video.quality,
        tags: video.tags,
        isOptimized: video.isOptimized
      }));
    } catch (error) {
      console.warn('Enhanced Pexels video loading failed:', error);
      return [];
    }
  }

  /**
   * Get random default media item
   */
  private async getDefaultMedia(airportCode: string): Promise<DestinationMedia> {
    // Pick a random photo from the collection
    const randomPhoto = this.allTravelPhotos[Math.floor(Math.random() * this.allTravelPhotos.length)];
    
    // Use local asset directly without caching for bundled images
    return {
      id: `default-${airportCode}`,
      type: 'photo',
      url: randomPhoto, // Use require'd asset directly
      credit: 'Curated travel photo',
      description: 'Beautiful travel destination',
      quality: 85,
      tags: ['default', 'travel', 'destination'],
      isOptimized: true, // Local assets are pre-optimized
    };
  }

  /**
   * Get optimized airline logo with fallback and caching
   */
  async getAirlineLogo(airlineCode: string, variant: 'dark' | 'light' | 'symbol' = 'light'): Promise<string> {
    try {
      return await assetManager.getAirlineLogo(airlineCode, variant);
    } catch (error) {
      console.warn('Failed to get airline logo from AssetManager:', error);
      
      // Fallback to Kiwi.com with caching
      const fallbackUrl = `https://images.kiwi.com/airlines/64/${airlineCode}.png`;
      return await imageCache.getOptimizedImage(fallbackUrl, 'high');
    }
  }

  /**
   * Get optimized aircraft image with enhanced selection
   */
  async getAircraftImage(aircraftModel: string): Promise<string> {
    // Enhanced aircraft model detection
    const modelLower = aircraftModel.toLowerCase();
    
    let imageUrl: string;
    
    if (modelLower.includes('boeing 737')) {
      imageUrl = 'https://images.unsplash.com/photo-1569629743817-70d8db6df138?w=800&h=600&fit=crop&crop=center';
    } else if (modelLower.includes('boeing 777')) {
      imageUrl = 'https://images.unsplash.com/photo-1583445095369-9c651e7e5d34?w=800&h=600&fit=crop&crop=center';
    } else if (modelLower.includes('boeing 787')) {
      imageUrl = 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=800&h=600&fit=crop&crop=center';
    } else if (modelLower.includes('airbus a320')) {
      imageUrl = 'https://images.unsplash.com/photo-1583445095369-9c651e7e5d34?w=800&h=600&fit=crop&crop=center';
    } else if (modelLower.includes('airbus a350')) {
      imageUrl = 'https://images.unsplash.com/photo-1556388158-158ea5ccacbd?w=800&h=600&fit=crop&crop=center';
    } else if (modelLower.includes('boeing')) {
      imageUrl = 'https://images.unsplash.com/photo-1569629743817-70d8db6df138?w=800&h=600&fit=crop&crop=center';
    } else {
      imageUrl = 'https://images.unsplash.com/photo-1583445095369-9c651e7e5d34?w=800&h=600&fit=crop&crop=center';
    }
    
    return await imageCache.getOptimizedImage(imageUrl, 'high');
  }

  /**
   * Preload media for upcoming flight cards
   */
  async preloadUpcomingMedia(flights: any[]): Promise<void> {
    await assetManager.preloadUpcomingAssets(flights);
  }

  /**
   * Get media performance statistics
   */
  getPerformanceStats() {
    return {
      cache: imageCache.getCacheStats(),
      video: videoOptimizer.getVideoStats(),
      mediaCache: {
        size: this.mediaCache.size,
        preloadQueue: this.preloadQueue.size
      }
    };
  }

  /**
   * Clear all media caches
   */
  async clearCaches(): Promise<void> {
    await imageCache.clearCache(true);
    await videoOptimizer.cleanupInactiveVideos();
    this.mediaCache.clear();
    this.preloadQueue.clear();
  }

  // Private helper methods

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      // Perform any necessary initialization
      this.isInitialized = true;
    }
  }

  private async optimizeAsset(asset: MediaAsset): Promise<DestinationMedia> {
    // Check if this is a local asset (require'd image returns a number)
    const isLocalAsset = typeof asset.url === 'number';
    
    if (asset.type === 'photo') {
      let optimizedUrl: any;
      let progressiveUrls: any;
      
      if (isLocalAsset) {
        // For local assets, use them directly without caching
        optimizedUrl = asset.url;
        progressiveUrls = undefined;
      } else {
        // For remote assets, use caching
        optimizedUrl = await imageCache.getOptimizedImage(asset.url, 'high');
        progressiveUrls = imageCache.getProgressiveUrls(asset.url);
      }
      
      return {
        id: asset.id,
        type: 'photo',
        url: optimizedUrl,
        previewUrl: asset.previewUrl,
        credit: asset.credit,
        description: asset.description,
        quality: asset.quality,
        tags: asset.tags,
        isOptimized: true,
        progressiveUrls
      };
    } else {
      const optimizedVideo = await videoOptimizer.getOptimizedVideo(asset.url);
      
      return {
        id: asset.id,
        type: 'video',
        url: optimizedVideo.url,
        previewUrl: optimizedVideo.thumbnail,
        credit: asset.credit,
        description: asset.description,
        quality: asset.quality,
        tags: asset.tags,
        isOptimized: true
      };
    }
  }

  private async addFallbackMedia(
    media: DestinationMedia[],
    airportCode: string,
    cityName?: string,
    limit: number = 5,
    includeVideos: boolean = true,
    contextOptions?: {
      mood?: MediaSelectionCriteria['mood'];
      season?: MediaSelectionCriteria['season'];
      timeOfDay?: MediaSelectionCriteria['timeOfDay'];
    }
  ): Promise<void> {
    const needed = limit - media.length;
    if (needed <= 0) return;

    try {
      // For explore feed: Prioritize videos first, then photos as fallback
      
      // First, try to get videos if requested
      if (includeVideos && needed > 0) {
        try {
          const videoQuery = cityName || airportCode;
          const videoContextOptions = {
            mood: contextOptions?.mood,
            timeOfDay: contextOptions?.timeOfDay,
            season: contextOptions?.season
          };
          const videos = await this.getLocalVideoAssets(
            videoQuery, 
            Math.min(needed, 3), // Limit videos to 3 max
            airportCode,
            videoContextOptions
          );
          media.push(...videos);
          console.log(`✅ Added ${videos.length} videos for ${airportCode}`);
        } catch (error) {
          console.warn('Enhanced video loading failed:', error);
        }
      }

      // Then fill remaining slots with photos
      const remaining = limit - media.length;
      if (remaining > 0) {
        // Get local photos first for instant loading
        const localPhotos = await this.getLocalPhotos(airportCode);
        const localPhotosNeeded = Math.min(remaining, localPhotos.length);
        media.push(...localPhotos.slice(0, localPhotosNeeded));
        console.log(`✅ Added ${localPhotosNeeded} local photos for ${airportCode}`);
        
        // Then try Unsplash if we still need more and have API key
        const stillRemaining = limit - media.length;
        if (stillRemaining > 0 && this.unsplashAccessKey && this.unsplashAccessKey !== 'demo') {
          try {
            const photos = await this.getUnsplashPhotos(cityName || airportCode, {
              perPage: Math.min(stillRemaining, 2)
            });
            media.push(...photos);
            console.log(`✅ Added ${photos.length} Unsplash photos for ${airportCode}`);
          } catch (unsplashError) {
            console.warn('Unsplash photos failed, using local photos only:', unsplashError);
          }
        } else if (!this.hasLoggedUnsplashInfo && this.unsplashAccessKey === 'demo') {
          console.log('ℹ️ Using local photos. Add EXPO_PUBLIC_UNSPLASH_ACCESS_KEY to .env for additional destination photos');
          this.hasLoggedUnsplashInfo = true;
        }
      }
    } catch (error) {
      console.warn('Fallback media loading failed:', error);
    }
  }

  private async preloadMedia(media: DestinationMedia[]): Promise<void> {
    const cacheKey = media.map(m => m.id).join('-');
    if (this.preloadQueue.has(cacheKey)) return;
    
    this.preloadQueue.add(cacheKey);
    
    try {
      const photoUrls = media
        .filter(m => m.type === 'photo')
        .map(m => m.url);
      
      const videoUrls = media
        .filter(m => m.type === 'video')
        .map(m => m.url);

      // Preload photos
      if (photoUrls.length > 0) {
        await imageCache.preloadImages(photoUrls, 'high');
      }

      // Skip video preloading for now to prevent crashes
      // TODO: Re-enable when video optimization is stable
      // if (videoUrls.length > 0) {
      //   await videoOptimizer.preloadVideos(videoUrls, 'medium');
      // }
    } catch (error) {
      console.warn('Media preloading failed:', error);
    } finally {
      this.preloadQueue.delete(cacheKey);
    }
  }

  private calculateUnsplashQualityScore(photo: UnsplashPhoto): number {
    let score = 50; // Base score
    
    // Dimension scoring (prefer portrait for TikTok)
    const aspectRatio = photo.height / photo.width;
    if (aspectRatio >= 1.3 && aspectRatio <= 1.8) score += 20;
    else if (aspectRatio >= 1.0) score += 10;
    
    // Tag relevance
    if (photo.tags && photo.tags.length > 0) {
      score += Math.min(photo.tags.length * 2, 10);
    }
    
    // Description quality
    if (photo.description && photo.description.length > 30) score += 10;
    if (photo.alt_description && photo.alt_description.length > 20) score += 5;
    
    return Math.min(100, score);
  }
}

export const mediaService = new MediaService();
export type { DestinationMedia };