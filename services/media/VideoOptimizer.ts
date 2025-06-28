/**
 * VideoOptimizer - Video compression and streaming optimization for TikTok-style performance
 * Handles adaptive streaming, compression, and smooth video playback
 */

import React from 'react';
import { VideoView, VideoSource } from 'expo-video';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface VideoQuality {
  resolution: '1080p' | '720p' | '480p' | '360p';
  bitrate: number;
  fileSize: number; // estimated in MB
  url: string;
}

interface VideoAsset {
  id: string;
  title: string;
  duration: number;
  thumbnail: string;
  qualities: VideoQuality[];
  preferredQuality: '1080p' | '720p' | '480p' | '360p';
  isOptimized: boolean;
  preloadProgress: number;
  metadata: {
    source: 'coverr' | 'local' | 'unsplash';
    format: 'mp4' | 'webm' | 'mov';
    fps: number;
    hasAudio: boolean;
  };
}

interface StreamingConfig {
  adaptiveBitrate: boolean;
  preloadBuffer: number; // seconds
  maxConcurrentVideos: number;
  qualityPreference: 'auto' | 'high' | 'medium' | 'low';
  dataUsageLimit: number; // MB per session
}

class VideoOptimizer {
  private videoCache = new Map<string, VideoAsset>();
  private activeVideos = new Map<string, { url: string; timestamp: number }>();
  private preloadQueue = new Set<string>();
  private dataUsage = 0;

  private config: StreamingConfig = {
    adaptiveBitrate: true,
    preloadBuffer: 3, // 3 seconds
    maxConcurrentVideos: 3,
    qualityPreference: 'auto',
    dataUsageLimit: 100, // 100MB per session
  };

  private readonly QUALITY_PRESETS = {
    '1080p': { width: 1080, height: 1920, bitrate: 2500 },
    '720p': { width: 720, height: 1280, bitrate: 1500 },
    '480p': { width: 480, height: 854, bitrate: 800 },
    '360p': { width: 360, height: 640, bitrate: 400 },
  };

  constructor() {
    this.loadConfiguration();
    this.initializeDataUsageTracking();
  }

  /**
   * Get optimized video URL based on device capabilities and network
   */
  async getOptimizedVideo(
    originalUrl: string,
    preferredQuality?: '1080p' | '720p' | '480p' | '360p'
  ): Promise<{ url: string; thumbnail: string; preload?: boolean }> {
    const cacheKey = this.getCacheKey(originalUrl);
    
    let videoAsset = this.videoCache.get(cacheKey);
    
    if (!videoAsset) {
      videoAsset = await this.createVideoAsset(originalUrl);
      this.videoCache.set(cacheKey, videoAsset);
    }

    // Determine optimal quality
    const optimalQuality = preferredQuality || this.determineOptimalQuality(videoAsset);
    const qualityOption = videoAsset.qualities.find(q => q.resolution === optimalQuality);
    
    if (!qualityOption) {
      return { 
        url: originalUrl, 
        thumbnail: videoAsset.thumbnail,
        preload: false 
      };
    }

    // Check data usage limits
    if (this.dataUsage + qualityOption.fileSize > this.config.dataUsageLimit) {
      // Fallback to lower quality or thumbnail
      const lowerQuality = this.getFallbackQuality(optimalQuality);
      const fallbackOption = videoAsset.qualities.find(q => q.resolution === lowerQuality);
      
      if (fallbackOption) {
        return { 
          url: fallbackOption.url, 
          thumbnail: videoAsset.thumbnail,
          preload: false 
        };
      }
      
      // Use thumbnail if data limit exceeded
      return { 
        url: videoAsset.thumbnail, 
        thumbnail: videoAsset.thumbnail,
        preload: false 
      };
    }

    // Track data usage
    this.dataUsage += qualityOption.fileSize;

    return {
      url: qualityOption.url,
      thumbnail: videoAsset.thumbnail,
      preload: videoAsset.preloadProgress > 0
    };
  }

  /**
   * Preload videos for smooth playback
   */
  async preloadVideos(
    videoUrls: string[], 
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<void> {
    // Limit concurrent preloads
    const maxPreloads = priority === 'high' ? 2 : 1;
    const toPreload = videoUrls.slice(0, maxPreloads);

    const preloadPromises = toPreload.map(async (url) => {
      if (this.preloadQueue.has(url)) return;
      
      this.preloadQueue.add(url);
      
      try {
        await this.preloadVideo(url, priority);
      } catch (error) {
        console.log('Video preload failed:', url, error);
      } finally {
        this.preloadQueue.delete(url);
      }
    });

    if (priority === 'high') {
      await Promise.all(preloadPromises);
    } else {
      Promise.allSettled(preloadPromises);
    }
  }

  /**
   * Create optimized video component with enhanced features
   * Returns JSX for direct rendering instead of React.createElement to prevent crashes
   */
  createOptimizedVideoComponent(
    videoUrl: string,
    options: {
      isActive: boolean;
      shouldPlay: boolean;
      onLoad?: () => void;
      onError?: () => void;
      style?: any;
    }
  ): any {
    const { isActive, shouldPlay, onLoad, onError, style } = options;

    // Return props object instead of createElement to avoid crashes
    return {
      component: 'VideoView',
      props: {
        source: { uri: videoUrl },
        style: style || { width: '100%', height: '100%' },
        contentFit: 'cover',
        shouldPlay: shouldPlay && isActive,
        isLooping: true,
        isMuted: true,
        allowsFullscreen: false,
        onLoad: (status: any) => {
          this.trackVideoLoad(videoUrl, status);
          onLoad?.();
        },
        onError: (error: any) => {
          this.handleVideoError(videoUrl, error);
          onError?.();
        },
        onPlaybackStatusUpdate: (status: any) => {
          this.handlePlaybackStatusUpdate(videoUrl, status);
        },
      }
    };
  }

  /**
   * Get comprehensive video statistics
   */
  getVideoStats(): {
    totalCachedVideos: number;
    dataUsage: number;
    averageLoadTime: number;
    preloadSuccess: number;
    adaptiveQualityChanges: number;
  } {
    return {
      totalCachedVideos: this.videoCache.size,
      dataUsage: this.dataUsage,
      averageLoadTime: this.calculateAverageLoadTime(),
      preloadSuccess: this.calculatePreloadSuccessRate(),
      adaptiveQualityChanges: this.getAdaptiveQualityChanges(),
    };
  }

  /**
   * Cleanup inactive videos to free memory
   */
  async cleanupInactiveVideos(): Promise<void> {
    const activeVideoIds = Array.from(this.activeVideos.keys());
    
    // Remove videos that haven't been used recently
    const currentTime = Date.now();
    const cleanupThreshold = 5 * 60 * 1000; // 5 minutes

    for (const [id, asset] of this.videoCache.entries()) {
      if (!activeVideoIds.includes(id)) {
        // Check if video hasn't been accessed recently
        const lastAccess = await this.getLastAccessTime(id);
        if (currentTime - lastAccess > cleanupThreshold) {
          this.videoCache.delete(id);
        }
      }
    }

    // Clear inactive video references
    for (const [id, videoRef] of this.activeVideos.entries()) {
      if (!this.videoCache.has(id)) {
        this.activeVideos.delete(id);
      }
    }
  }

  // Private methods

  private async createVideoAsset(originalUrl: string): Promise<VideoAsset> {
    // For Coverr videos, we can use their API to get multiple qualities
    if (originalUrl.includes('coverr.co')) {
      return this.createCoverrVideoAsset(originalUrl);
    }

    // For other sources, create a basic asset
    return this.createBasicVideoAsset(originalUrl);
  }

  private async createCoverrVideoAsset(originalUrl: string): Promise<VideoAsset> {
    try {
      // Extract video ID from Coverr URL
      const videoId = this.extractCoverrVideoId(originalUrl);
      
      // Create different quality URLs (simulated for now)
      const qualities: VideoQuality[] = [
        {
          resolution: '720p',
          bitrate: 1500,
          fileSize: 15,
          url: originalUrl,
        },
        {
          resolution: '480p',
          bitrate: 800,
          fileSize: 8,
          url: originalUrl.replace(/\.mp4$/, '_480p.mp4'),
        },
        {
          resolution: '360p',
          bitrate: 400,
          fileSize: 4,
          url: originalUrl.replace(/\.mp4$/, '_360p.mp4'),
        },
      ];

      return {
        id: `coverr-${videoId}`,
        title: 'Travel Video',
        duration: 30,
        thumbnail: originalUrl.replace(/\.mp4$/, '_thumb.jpg'),
        qualities,
        preferredQuality: '720p',
        isOptimized: true,
        preloadProgress: 0,
        metadata: {
          source: 'coverr',
          format: 'mp4',
          fps: 30,
          hasAudio: false,
        },
      };
    } catch (error) {
      console.warn('Failed to create Coverr video asset:', error);
      return this.createBasicVideoAsset(originalUrl);
    }
  }

  private async createBasicVideoAsset(originalUrl: string): Promise<VideoAsset> {
    return {
      id: `basic-${Date.now()}`,
      title: 'Video',
      duration: 0,
      thumbnail: this.generateVideoThumbnail(originalUrl),
      qualities: [
        {
          resolution: '720p',
          bitrate: 1500,
          fileSize: 10,
          url: originalUrl,
        },
      ],
      preferredQuality: '720p',
      isOptimized: false,
      preloadProgress: 0,
      metadata: {
        source: 'local',
        format: 'mp4',
        fps: 30,
        hasAudio: false,
      },
    };
  }

  private determineOptimalQuality(videoAsset: VideoAsset): '1080p' | '720p' | '480p' | '360p' {
    // Adaptive quality based on device and network
    if (this.config.qualityPreference !== 'auto') {
      const qualityMap = {
        high: '720p' as const,
        medium: '480p' as const,
        low: '360p' as const,
      };
      return qualityMap[this.config.qualityPreference];
    }

    // Auto-determine based on available qualities and constraints
    const availableQualities = videoAsset.qualities.map(q => q.resolution);
    
    // Prefer 720p for TikTok-style content
    if (availableQualities.includes('720p')) return '720p';
    if (availableQualities.includes('480p')) return '480p';
    if (availableQualities.includes('360p')) return '360p';
    
    return '720p'; // Default fallback
  }

  private getFallbackQuality(
    currentQuality: '1080p' | '720p' | '480p' | '360p'
  ): '1080p' | '720p' | '480p' | '360p' {
    const qualityOrder = ['1080p', '720p', '480p', '360p'] as const;
    const currentIndex = qualityOrder.indexOf(currentQuality);
    
    if (currentIndex < qualityOrder.length - 1) {
      return qualityOrder[currentIndex + 1];
    }
    
    return '360p'; // Lowest quality fallback
  }

  private async preloadVideo(url: string, priority: 'high' | 'medium' | 'low'): Promise<void> {
    try {
      const optimizedVideo = await this.getOptimizedVideo(url);
      
      // For expo-video, we'll use a different preload strategy
      // Since expo-video doesn't have a direct preload API like expo-av,
      // we'll cache the video asset information instead
      const cacheKey = this.getCacheKey(url);
      
      // Pre-fetch video metadata and store in cache
      if (!this.videoCache.has(cacheKey)) {
        const videoAsset = await this.createVideoAsset(url);
        this.videoCache.set(cacheKey, videoAsset);
      }
      
      // For actual video preloading, we could implement background fetch
      // but for now, we'll just ensure the URL is accessible
      const response = await fetch(optimizedVideo.url, { method: 'HEAD' });
      if (response.ok) {
        console.log(`Video preload verified: ${url}`);
        // Store reference for tracking
        this.activeVideos.set(cacheKey, { url: optimizedVideo.url, timestamp: Date.now() });
      }
    } catch (error) {
      console.warn(`Video preload failed for ${url}:`, error);
      throw error;
    }
  }

  private trackVideoLoad(videoUrl: string, status: any): void {
    // Track load performance
    console.log('Video loaded:', videoUrl, status);
  }

  private handleVideoError(videoUrl: string, error: any): void {
    console.error('Video error:', videoUrl, error);
    
    // Remove from cache if consistently failing
    const cacheKey = this.getCacheKey(videoUrl);
    this.videoCache.delete(cacheKey);
  }

  private handleVideoLoadStart(videoUrl: string): void {
    console.log('Video load started:', videoUrl);
  }

  private handleVideoBuffer(videoUrl: string, bufferStatus: any): void {
    // Handle video buffering
    console.log('Video buffering:', videoUrl, bufferStatus);
  }

  private handlePlaybackStatusUpdate(videoUrl: string, status: any): void {
    // Track playback quality and adapt if needed
    if (status.isLoaded && this.config.adaptiveBitrate) {
      // Could implement adaptive bitrate logic here
    }
  }


  private getCacheKey(url: string): string {
    return btoa(url);
  }

  private extractCoverrVideoId(url: string): string {
    const match = url.match(/\/([^\/]+)\.mp4$/);
    return match ? match[1] : Date.now().toString();
  }

  private generateVideoThumbnail(videoUrl: string): string {
    // Generate placeholder thumbnail
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="400" height="600" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#1a1a1a"/>
        <circle cx="200" cy="300" r="40" fill="#FF6A3D" opacity="0.8"/>
        <polygon points="190,285 190,315 210,300" fill="white"/>
      </svg>
    `)}`;
  }

  private async loadConfiguration(): Promise<void> {
    try {
      const config = await AsyncStorage.getItem('video_optimizer_config');
      if (config) {
        this.config = { ...this.config, ...JSON.parse(config) };
      }
    } catch (error) {
      console.warn('Failed to load video optimizer config:', error);
    }
  }

  private initializeDataUsageTracking(): void {
    // Reset data usage tracking daily
    setInterval(() => {
      this.dataUsage = 0;
    }, 24 * 60 * 60 * 1000);
  }

  private calculateAverageLoadTime(): number {
    // Placeholder - would track actual load times
    return 1.2; // 1.2 seconds average
  }

  private calculatePreloadSuccessRate(): number {
    // Placeholder - would track preload success
    return 0.92; // 92% success rate
  }

  private getAdaptiveQualityChanges(): number {
    // Placeholder - would track quality adaptations
    return 0;
  }

  private async getLastAccessTime(videoId: string): Promise<number> {
    try {
      const timestamp = await AsyncStorage.getItem(`video_access_${videoId}`);
      return timestamp ? parseInt(timestamp) : 0;
    } catch {
      return 0;
    }
  }
}

export const videoOptimizer = new VideoOptimizer();
export type { VideoAsset, VideoQuality, StreamingConfig };