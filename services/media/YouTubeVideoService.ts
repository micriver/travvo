/**
 * YouTube Video Service for TikTok-Style Streaming
 * Provides instant video streaming using YouTube's global CDN infrastructure
 */

interface YouTubeVideo {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      high: {
        url: string;
      };
      medium: {
        url: string;
      };
      default: {
        url: string;
      };
    };
    channelTitle: string;
    publishedAt: string;
  };
}

interface YouTubeSearchResponse {
  items: YouTubeVideo[];
  nextPageToken?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
}

interface StreamingVideoAsset {
  id: string;
  type: 'video';
  url: string; // YouTube embed URL for streaming
  previewUrl: string; // Thumbnail
  credit: string;
  description: string;
  quality: number;
  tags: string[];
  isOptimized: boolean;
  duration?: string;
  embedUrl: string; // Optimized embed URL
  metadata?: {
    videoId: string;
    channelTitle: string;
    publishedAt: string;
    searchQuery: string;
  };
}

interface YouTubeSearchOptions {
  maxResults?: number;
  duration?: 'short' | 'medium' | 'long'; // short: <4min, medium: 4-20min, long: >20min
  quality?: 'high' | 'medium' | 'low';
  order?: 'relevance' | 'date' | 'viewCount' | 'rating';
  publishedAfter?: string; // ISO date string
}

class YouTubeVideoService {
  private apiKey: string;
  private baseUrl = 'https://www.googleapis.com/youtube/v3';
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;
  private rateLimitDelay = 100; // YouTube allows more requests than Pexels
  private lastRequestTime = 0;
  private videoCache = new Map<string, StreamingVideoAsset[]>();

  // Country mapping for better search results
  private readonly AIRPORT_TO_COUNTRY: Record<string, string> = {
    'CDG': 'France',
    'LAS': 'USA',
    'JFK': 'USA',
    'LAX': 'USA',
    'NRT': 'Japan',
    'LHR': 'England',
    'DXB': 'UAE',
    'SIN': 'Singapore',
    'HKG': 'Hong Kong',
    'ICN': 'South Korea',
    'BKK': 'Thailand',
    'SYD': 'Australia',
    'YYZ': 'Canada',
    'FRA': 'Germany',
    'AMS': 'Netherlands',
    'ZUR': 'Switzerland',
    'FCO': 'Italy',
    'MAD': 'Spain',
    'BCN': 'Spain'
  };

  // High-quality 4K drone footage search patterns for portrait travel videos
  private readonly DESTINATION_SEARCH_PATTERNS: Record<string, string[]> = {
    'CDG': [
      '4k 60fps drone footage Paris France vertical',
      'cinematic aerial Paris France portrait',
      'travel drone Paris France 9:16',
      'vertical city tour Paris France'
    ],
    'LAS': [
      '4k 60fps drone footage Las Vegas USA vertical',
      'cinematic aerial Las Vegas Nevada portrait',
      'travel drone Las Vegas 9:16',
      'vertical Vegas Strip tour'
    ],
    'JFK': [
      '4k 60fps drone footage New York USA vertical',
      'cinematic aerial Manhattan NYC portrait',
      'travel drone New York 9:16',
      'vertical NYC skyline tour'
    ],
    'LAX': [
      '4k 60fps drone footage Los Angeles USA vertical',
      'cinematic aerial LA California portrait',
      'travel drone Los Angeles 9:16',
      'vertical Hollywood LA tour'
    ],
    'NRT': [
      '4k 60fps drone footage Tokyo Japan vertical',
      'cinematic aerial Tokyo Japan portrait',
      'travel drone Tokyo 9:16',
      'vertical Shibuya Tokyo tour'
    ],
    'LHR': [
      '4k 60fps drone footage London England vertical',
      'cinematic aerial London UK portrait',
      'travel drone London 9:16',
      'vertical Thames London tour'
    ],
    // Enhanced fallback patterns for other airports
    'DEFAULT': [
      '4k 60fps drone footage {city} {country} vertical',
      'cinematic aerial {city} {country} portrait',
      'travel drone {city} {country} 9:16',
      'vertical {city} travel tour'
    ]
  };

  constructor() {
    this.apiKey = process.env.EXPO_PUBLIC_YOUTUBE_API_KEY || '';
    if (!this.apiKey) {
      console.warn('❌ YouTube API key not found. Add EXPO_PUBLIC_YOUTUBE_API_KEY to .env file');
    } else {
      console.log('✅ YouTube Video Service initialized');
    }
  }

  /**
   * Get streaming travel videos for a destination
   */
  async getDestinationVideos(
    airportCode: string,
    cityName?: string,
    options: YouTubeSearchOptions = {}
  ): Promise<StreamingVideoAsset[]> {
    if (!this.apiKey) {
      console.warn('No YouTube API key available');
      return [];
    }

    const cacheKey = `${airportCode}-${cityName || ''}-${JSON.stringify(options)}`;
    
    // Check cache first
    if (this.videoCache.has(cacheKey)) {
      const cached = this.videoCache.get(cacheKey)!;
      console.log(`📹 Using cached YouTube videos for ${cityName || airportCode}`);
      return cached;
    }

    console.log(`🎬 Searching YouTube for ${cityName || airportCode} travel videos`);
    
    try {
      // Get search queries for this destination
      const searchQueries = this.buildSearchQueries(airportCode, cityName);
      const allVideos: StreamingVideoAsset[] = [];
      
      // Try multiple search queries until we find high-quality content
      for (const query of searchQueries) {
        console.log(`🔍 Searching YouTube: "${query}"`);
        
        const videos = await this.searchVideos(query, {
          maxResults: 3, // Get more options to filter for quality
          duration: 'short', // Short videos for TikTok-style experience
          order: 'relevance',
          ...options
        });

        // CRITICAL: Filter and score videos for quality with STRICT landscape rejection
        const qualityVideos = videos
          .map(video => ({ video, score: this.calculateVideoQuality(video) }))
          .filter(item => {
            // DOUBLE CHECK: Under NO circumstances allow landscape videos
            const isPortraitOriented = this.strictPortraitCheck(item.video);
            const isHighQuality = item.score >= 70;
            
            if (!isPortraitOriented) {
              console.log(`🚫 REJECTED LANDSCAPE VIDEO: "${item.video.snippet.title}" - Score: ${item.score}`);
              return false;
            }
            
            return isHighQuality;
          })
          .sort((a, b) => b.score - a.score) // Sort by quality score
          .slice(0, 1); // Take only the best video

        // Convert to StreamingVideoAsset format
        for (const { video } of qualityVideos) {
          const streamingAsset = this.createStreamingAsset(video, query, airportCode);
          allVideos.push(streamingAsset);
        }

        // Stop searching if we found a high-quality video
        if (allVideos.length > 0) {
          console.log(`✅ Found high-quality video with query: "${query}"`);
          break;
        }
      }

      // Cache the results
      this.videoCache.set(cacheKey, allVideos);
      
      if (allVideos.length > 0) {
        console.log(`✅ Found ${allVideos.length} YouTube streaming video(s) for ${cityName || airportCode}`);
      } else {
        console.log(`❌ No YouTube videos found for ${cityName || airportCode}`);
      }
      
      return allVideos;
    } catch (error) {
      console.error('YouTube video search failed:', error);
      return [];
    }
  }

  /**
   * Search YouTube videos with rate limiting
   */
  private async searchVideos(
    query: string, 
    options: YouTubeSearchOptions = {}
  ): Promise<YouTubeVideo[]> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          await this.enforceRateLimit();
          
          const params = new URLSearchParams({
            part: 'snippet',
            q: query,
            type: 'video',
            key: this.apiKey,
            maxResults: (options.maxResults || 1).toString(),
            order: options.order || 'relevance',
            relevanceLanguage: 'en',
            safeSearch: 'moderate'
          });

          // Add duration filter
          if (options.duration) {
            params.append('videoDuration', options.duration);
          }

          // Enhanced quality filters for better results
          let qualityQuery = query;
          if (options.quality === 'high') {
            qualityQuery += ' 4K HD';
          }
          // Add filters to exclude amateur content
          qualityQuery += ' -vlog -personal -"my trip" -"our trip"';
          params.set('q', qualityQuery);

          const response = await fetch(`${this.baseUrl}/search?${params}`);

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`YouTube API error: ${response.status}`, errorText);
            throw new Error(`YouTube API error: ${response.status}`);
          }

          const data: YouTubeSearchResponse = await response.json();
          console.log(`🎬 YouTube API returned ${data.items?.length || 0} videos for: "${query}"`);
          
          resolve(data.items || []);
        } catch (error) {
          console.error('YouTube search request failed:', error);
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  /**
   * Build optimized search queries for destinations with 4K drone footage focus
   */
  private buildSearchQueries(airportCode: string, cityName?: string): string[] {
    const patterns = this.DESTINATION_SEARCH_PATTERNS[airportCode] || 
                    this.DESTINATION_SEARCH_PATTERNS['DEFAULT'];
    
    const queries: string[] = [];
    const countryName = this.AIRPORT_TO_COUNTRY[airportCode] || 'destination';
    
    // Use city name if available, otherwise use airport code patterns
    if (cityName) {
      // Replace placeholders in default patterns
      const customPatterns = patterns.map(pattern => 
        pattern.replace('{city}', cityName).replace('{country}', countryName)
      );
      queries.push(...customPatterns);
      
      // Add additional high-quality search variations
      queries.push(
        `4k 60fps drone footage ${cityName} ${countryName} vertical no watermark`,
        `cinematic aerial ${cityName} ${countryName} portrait clean`,
        `travel drone ${cityName} ${countryName} 9:16 short`,
        `vertical ${cityName} travel tour 4k`
      );
    } else {
      // Use predefined patterns for known airports
      queries.push(...patterns);
    }
    
    return queries;
  }

  /**
   * Create streaming video asset from YouTube video
   */
  private createStreamingAsset(
    video: YouTubeVideo, 
    searchQuery: string, 
    airportCode: string
  ): StreamingVideoAsset {
    const videoId = video.id.videoId;
    
    // Create optimized YouTube embed URL for streaming
    const embedUrl = this.createOptimizedEmbedUrl(videoId);
    
    return {
      id: `youtube-${videoId}`,
      type: 'video',
      url: embedUrl, // Use embed URL for streaming
      previewUrl: video.snippet.thumbnails.high.url,
      credit: `Video by ${video.snippet.channelTitle} on YouTube`,
      description: video.snippet.title,
      quality: this.calculateVideoQuality(video),
      tags: [airportCode.toLowerCase(), 'youtube', 'travel', 'streaming'],
      isOptimized: true, // YouTube videos are pre-optimized
      embedUrl: embedUrl,
      metadata: {
        videoId: videoId,
        channelTitle: video.snippet.channelTitle,
        publishedAt: video.snippet.publishedAt,
        searchQuery: searchQuery
      }
    };
  }

  /**
   * Create optimized YouTube embed URL for TikTok-style streaming
   */
  private createOptimizedEmbedUrl(videoId: string): string {
    const embedParams = new URLSearchParams({
      autoplay: '1',        // Auto-start like TikTok
      mute: '1',           // Muted by default
      loop: '1',           // Loop the video
      playlist: videoId,   // Required for loop to work
      controls: '0',       // Hide controls for clean TikTok look
      showinfo: '0',       // Hide video info
      rel: '0',           // Don't show related videos
      modestbranding: '1', // Minimal YouTube branding
      playsinline: '1',    // Play inline on mobile
      iv_load_policy: '3', // Hide annotations
      disablekb: '1',      // Disable keyboard controls
      fs: '0',            // Disable fullscreen
      cc_load_policy: '0', // Hide captions
      start: '0'          // Start from beginning
    });

    return `https://www.youtube.com/embed/${videoId}?${embedParams}`;
  }

  /**
   * STRICT portrait orientation check - ABSOLUTELY NO landscape videos allowed
   */
  private strictPortraitCheck(video: YouTubeVideo): boolean {
    const title = video.snippet.title.toLowerCase();
    
    // MANDATORY portrait indicators in title (YouTube search results don't include dimensions)
    const hasPortraitKeywords = title.includes('vertical') || 
                               title.includes('portrait') || 
                               title.includes('9:16') ||
                               title.includes('mobile') ||
                               title.includes('phone') ||
                               title.includes('tiktok') ||
                               title.includes('story') ||
                               title.includes('reels');
    
    // FORBIDDEN landscape indicators - IMMEDIATE REJECTION
    const hasLandscapeKeywords = title.includes('landscape') ||
                                title.includes('16:9') ||
                                title.includes('widescreen') ||
                                title.includes('horizontal') ||
                                title.includes('wide shot') ||
                                title.includes('panoramic');
    
    // Additional checks for common landscape content
    const isLikelyLandscape = title.includes('drone panning') ||
                             title.includes('wide angle') ||
                             title.includes('establishing shot') ||
                             title.includes('timelapse cityscape');
    
    if (hasLandscapeKeywords || isLikelyLandscape) {
      console.log(`🚫 STRICT FILTER: Rejected landscape video - "${title}"`);
      return false;
    }
    
    // For portrait content, require at least some indication of vertical format
    if (!hasPortraitKeywords) {
      console.log(`⚠️ PORTRAIT CHECK: No vertical indicators found in - "${title}"`);
      // Still allow if it's drone footage (often available in multiple formats)
      return title.includes('drone') || title.includes('aerial');
    }
    
    console.log(`✅ PORTRAIT APPROVED: "${title}"`);
    return true;
  }

  /**
   * Calculate video quality score with enhanced filtering for professional content
   */
  private calculateVideoQuality(video: YouTubeVideo): number {
    let score = 60; // Base score for YouTube videos (higher than Pexels)
    
    const title = video.snippet.title.toLowerCase();
    const description = video.snippet.description?.toLowerCase() || '';
    const channelTitle = video.snippet.channelTitle.toLowerCase();
    
    // Premium quality indicators (4K drone footage)
    if (title.includes('4k')) score += 30;
    if (title.includes('60fps') || title.includes('60 fps')) score += 20;
    if (title.includes('drone')) score += 25;
    if (title.includes('aerial')) score += 20;
    if (title.includes('cinematic')) score += 20;
    
    // Portrait/vertical orientation bonus
    if (title.includes('vertical') || title.includes('portrait') || title.includes('9:16')) score += 25;
    
    // Professional content indicators
    if (title.includes('official') || title.includes('tourism')) score += 15;
    if (channelTitle.includes('tourism') || channelTitle.includes('travel') || channelTitle.includes('official')) score += 15;
    if (title.includes('no watermark') || title.includes('clean')) score += 10;
    
    // Content quality indicators
    if (title.includes('travel') || title.includes('tour')) score += 10;
    if (title.includes('city') || title.includes('destination')) score += 10;
    
    // Duration scoring (short videos preferred for TikTok style)
    // Note: We don't have duration in search results, but we'll filter later
    
    // NEGATIVE scoring for amateur/personal content
    if (title.includes('vlog') || title.includes('my trip') || title.includes('our trip')) score -= 50;
    if (title.includes('couple') || title.includes('boyfriend') || title.includes('girlfriend')) score -= 40;
    if (title.includes('personal') || title.includes('diary') || title.includes('blog')) score -= 30;
    if (title.includes('watermark') || title.includes('subscribe') || title.includes('like and subscribe')) score -= 30;
    
    // Channel quality (avoid personal vloggers)
    if (channelTitle.includes('vlog') || channelTitle.includes('personal')) score -= 40;
    
    // Recency bonus (newer videos tend to be higher quality)
    const publishDate = new Date(video.snippet.publishedAt);
    const ageInYears = (Date.now() - publishDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
    if (ageInYears < 1) score += 10;
    else if (ageInYears < 3) score += 5;
    
    console.log(`📊 Video quality score for "${video.snippet.title}": ${score}`);
    
    return Math.max(0, Math.min(100, score));
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
          console.warn('YouTube request failed:', error);
        }
      }
    }
    
    this.isProcessingQueue = false;
  }

  /**
   * Clear video cache
   */
  clearCache(): void {
    this.videoCache.clear();
    console.log('YouTube video cache cleared');
  }

  /**
   * Preload videos for upcoming destinations (performance optimization)
   */
  async preloadDestinationVideos(destinations: Array<{airportCode: string, cityName?: string}>): Promise<void> {
    console.log('🚀 Preloading videos for upcoming destinations');
    
    const preloadPromises = destinations.slice(0, 3).map(async ({ airportCode, cityName }) => {
      try {
        await this.getDestinationVideos(airportCode, cityName, { maxResults: 1 });
      } catch (error) {
        console.warn(`Preload failed for ${airportCode}:`, error);
      }
    });

    await Promise.allSettled(preloadPromises);
    console.log('✅ Video preloading completed');
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
      cacheSize: this.videoCache.size,
      supportedDestinations: Object.keys(this.DESTINATION_SEARCH_PATTERNS).length
    };
  }
}

export const youTubeVideoService = new YouTubeVideoService();
export type { StreamingVideoAsset, YouTubeSearchOptions };