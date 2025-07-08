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

// Removed UnsplashPhoto interface - no longer needed

interface CoverrVideo {
  id: number;
  title: string;
  preview_url: string;
  video_url: string;
  thumbnail_url: string;
  duration: number;
}

class MediaService {
  // Removed Unsplash API - using local photos only
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
    require('@/assets/images/unsplash-images/lachlan-gowen-QzQM5Sp3fK4-unsplash.jpg'),
    require('@/assets/images/unsplash-images/leio-mclaren-FwdZYz0yc9g-unsplash.jpg'),
    require('@/assets/images/unsplash-images/liam-burnett-blue-cnRgYes6tNE-unsplash.jpg'),
    require('@/assets/images/unsplash-images/lisha-riabinina--LhLmNx9fTI-unsplash.jpg'),
    require('@/assets/images/unsplash-images/luise-and-nic-0YPKiXTo5oU-unsplash.jpg'),
    require('@/assets/images/unsplash-images/lysander-yuen-OXiTVXCm9NI-unsplash.jpg'),
    require('@/assets/images/unsplash-images/mauro-lima-AETgluJGwVI-unsplash.jpg'),
    require('@/assets/images/unsplash-images/mauro-lima-R1P7yzcuDJE-unsplash.jpg'),
    require('@/assets/images/unsplash-images/mauro-lima-gcoNY81O09g-unsplash.jpg'),
    require('@/assets/images/unsplash-images/moritz-mentges-jt6eW1k0rTY-unsplash.jpg'),
    require('@/assets/images/unsplash-images/nick-martin-6wD4qUp2Fj0-unsplash.jpg'),
    require('@/assets/images/unsplash-images/nick-martin-JYdvvB_Qy7Y-unsplash.jpg'),
    require('@/assets/images/unsplash-images/redd-francisco-Bxzrd0p6yOM-unsplash.jpg'),
    require('@/assets/images/unsplash-images/silas-baisch-P8oqPW32fm0-unsplash.jpg'),
    require('@/assets/images/unsplash-images/stijn-te-strake-m45uW4f9YQg-unsplash.jpg'),
    require('@/assets/images/unsplash-images/tom-barrett-M0AWNxnLaMw-unsplash.jpg'),
    require('@/assets/images/unsplash-images/tom-morbey-Jq9an0WVWfk-unsplash.jpg'),
    require('@/assets/images/unsplash-images/xiyuan-du-MIYUHApQy7s-unsplash.jpg'),
    require('@/assets/images/unsplash-images/yang-Q-jx_Bwdgk8-unsplash.jpg'),
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
    const cacheKey = `${airportCode}-${cityName || ''}-${JSON.stringify(options || {})}`;
    
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

    // Ensure we have at least some media - prioritize local photos when APIs fail
    if (media.length === 0) {
      console.log('📸 No media found, using local photos as primary content');
      const localPhotos = await this.getLocalPhotos(airportCode);
      media.push(...localPhotos.slice(0, limit));
    }
    
    // Ensure there's always at least one photo for video fallbacks
    const hasPhoto = media.some(m => m.type === 'photo');
    if (!hasPhoto) {
      console.log('📸 Adding photo fallback for video errors');
      const localPhotos = await this.getLocalPhotos(airportCode);
      media.push(...localPhotos.slice(0, 1));
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

  // Removed Unsplash API integration - using local photos only

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
    const numPhotos = 5; // Get 5 random photos for each destination
    
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
   * Get streaming videos using YouTube as primary, Pexels as fallback
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
    // Try YouTube first for instant streaming
    try {
      const { youTubeVideoService } = await import('./YouTubeVideoService');
      
      console.log(`🎬 Trying YouTube for ${query} (${airportCode})`);
      const youtubeVideos = await youTubeVideoService.getDestinationVideos(
        airportCode || query.toUpperCase(),
        query,
        {
          maxResults: limit,
          duration: 'short',
          quality: 'high'
        }
      );

      if (youtubeVideos.length > 0) {
        console.log(`✅ YouTube success: ${youtubeVideos.length} streaming video(s) for ${query}`);
        return youtubeVideos.map(video => ({
          id: video.id,
          type: 'video' as const,
          url: video.url, // YouTube embed URL for streaming
          previewUrl: video.previewUrl,
          credit: video.credit,
          description: video.description,
          quality: video.quality,
          tags: video.tags,
          isOptimized: video.isOptimized
        }));
      }
    } catch (error) {
      console.warn('YouTube video loading failed, trying Pexels fallback:', error);
    }

    // Fallback to Pexels if YouTube fails
    try {
      const { pexelsVideoService } = await import('./PexelsVideoService');
      
      console.log(`🎬 Fallback to Pexels for ${query}`);
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

      if (enhancedVideos.length > 0) {
        console.log(`✅ Pexels fallback success: ${enhancedVideos.length} video(s) for ${query}`);
      }

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
      console.warn('All video sources failed:', error);
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
      
      // First, try to get videos if requested - prioritize videos for TikTok experience
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
            1, // Only get 1 video to prevent multiple requests
            airportCode,
            videoContextOptions
          );
          media.push(...videos);
          console.log(`✅ Added ${videos.length} videos for ${airportCode}`, videos.map(v => v.url));
        } catch (error) {
          console.warn('Enhanced video loading failed:', error);
          // Don't add hardcoded videos - let it fallback to photos instead
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
        
        // Fill any remaining slots with more local photos if needed
        const stillRemaining = limit - media.length;
        if (stillRemaining > 0) {
          const additionalLocalPhotos = await this.getLocalPhotos(airportCode);
          const additionalNeeded = Math.min(stillRemaining, additionalLocalPhotos.length);
          media.push(...additionalLocalPhotos.slice(localPhotosNeeded, localPhotosNeeded + additionalNeeded));
          console.log(`✅ Added ${additionalNeeded} additional local photos for ${airportCode}`);
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

      // Safe video preloading with crash prevention
      if (videoUrls.length > 0) {
        try {
          await videoOptimizer.preloadVideos(videoUrls.slice(0, 2), 'low'); // Limit to 2 videos with low quality
        } catch (videoError) {
          console.warn('Video preloading failed, continuing without video cache:', videoError);
        }
      }
    } catch (error) {
      console.warn('Media preloading failed:', error);
    } finally {
      this.preloadQueue.delete(cacheKey);
    }
  }

  // Removed calculateUnsplashQualityScore - no longer needed
}

export const mediaService = new MediaService();
export type { DestinationMedia };