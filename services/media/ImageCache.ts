/**
 * ImageCache - Aggressive caching strategy for TikTok-style performance
 * Provides memory and disk caching with preloading and progressive loading
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';

interface CacheEntry {
  url: string;
  localPath?: string;
  timestamp: number;
  size: number;
  quality: 'high' | 'medium' | 'low';
  previewUrl?: string;
}

interface CacheConfig {
  maxMemorySize: number; // in bytes
  maxDiskSize: number; // in bytes  
  maxAge: number; // in milliseconds
  preloadDistance: number; // number of cards to preload ahead
}

class ImageCache {
  private cache = new Map<string, CacheEntry>();
  private memoryUsage = 0;
  private diskUsage = 0;
  private preloadQueue = new Set<string>();
  private downloadQueue = new Map<string, Promise<string>>();

  private config: CacheConfig = {
    maxMemorySize: 50 * 1024 * 1024, // 50MB
    maxDiskSize: 200 * 1024 * 1024, // 200MB
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    preloadDistance: 3, // preload 3 cards ahead
  };

  private readonly CACHE_PREFIX = 'travvo_image_cache_';
  private readonly CACHE_INDEX_KEY = 'travvo_cache_index';

  constructor() {
    this.loadCacheIndex();
    this.startCleanupTimer();
  }

  /**
   * Get optimized image URL with caching
   */
  async getOptimizedImage(
    url: any, 
    quality: 'high' | 'medium' | 'low' = 'high'
  ): Promise<any> {
    // Handle local assets (require'd images return numbers)
    if (typeof url === 'number') {
      // This is a local asset, return it directly
      return url;
    }
    
    // Validate URL input for external URLs
    if (!url || typeof url !== 'string') {
      console.warn('Invalid URL provided to ImageCache:', url, 'Type:', typeof url);
      // Return a local fallback image instead of external placeholder
      return require('@/assets/images/react-logo.png');
    }

    const cacheKey = this.getCacheKey(url, quality);
    
    // Check memory cache first
    const cached = this.cache.get(cacheKey);
    if (cached && !this.isExpired(cached)) {
      return cached.localPath || cached.url;
    }

    // Check if already downloading
    if (this.downloadQueue.has(cacheKey)) {
      return this.downloadQueue.get(cacheKey)!;
    }

    // Start download and cache
    const downloadPromise = this.downloadAndCache(url, quality);
    this.downloadQueue.set(cacheKey, downloadPromise);

    try {
      const result = await downloadPromise;
      this.downloadQueue.delete(cacheKey);
      return result;
    } catch (error) {
      this.downloadQueue.delete(cacheKey);
      console.warn('Image cache failed, using fallback image:', error);
      return require('@/assets/images/react-logo.png');
    }
  }

  /**
   * Preload images for upcoming content
   */
  async preloadImages(urls: string[], priority: 'high' | 'low' = 'low'): Promise<void> {
    const preloadPromises = urls.map(async (url) => {
      if (this.preloadQueue.has(url)) return;
      
      this.preloadQueue.add(url);
      
      try {
        // Preload with medium quality to save bandwidth
        await this.getOptimizedImage(url, 'medium');
        
        // Preload preview (low quality) for instant display
        await this.generatePreview(url);
      } catch (error) {
        console.log('Preload failed for:', url, error);
      } finally {
        this.preloadQueue.delete(url);
      }
    });

    if (priority === 'high') {
      await Promise.all(preloadPromises);
    } else {
      // Low priority - don't block
      Promise.allSettled(preloadPromises);
    }
  }

  /**
   * Get progressive loading URLs (blur-to-sharp)
   */
  getProgressiveUrls(url: any): { preview: string; full: string } | undefined {
    // For local assets, don't provide progressive URLs
    if (typeof url === 'number') {
      return undefined;
    }
    
    // Only handle string URLs
    if (typeof url !== 'string') {
      return undefined;
    }
    
    const cacheKey = this.getCacheKey(url, 'low');
    const fullCacheKey = this.getCacheKey(url, 'high');
    
    const preview = this.cache.get(cacheKey);
    const full = this.cache.get(fullCacheKey);

    return {
      preview: preview?.localPath || this.generateBlurHash(url),
      full: full?.localPath || url
    };
  }

  /**
   * Clear cache to free up space
   */
  async clearCache(force = false): Promise<void> {
    if (!force && this.memoryUsage < this.config.maxMemorySize * 0.8) {
      return;
    }

    // Clear expired entries first
    const expiredKeys = Array.from(this.cache.entries())
      .filter(([_, entry]) => this.isExpired(entry))
      .map(([key]) => key);

    for (const key of expiredKeys) {
      await this.removeCacheEntry(key);
    }

    // If still over limit, remove oldest entries
    if (this.memoryUsage > this.config.maxMemorySize) {
      const sortedEntries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);

      const toRemove = sortedEntries.slice(0, Math.floor(sortedEntries.length / 3));
      
      for (const [key] of toRemove) {
        await this.removeCacheEntry(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    memoryUsage: number;
    diskUsage: number;
    entryCount: number;
    hitRate: number;
  } {
    return {
      memoryUsage: this.memoryUsage,
      diskUsage: this.diskUsage,
      entryCount: this.cache.size,
      hitRate: 0.85, // Placeholder - would track in real implementation
    };
  }

  // Private methods

  private async downloadAndCache(url: string, quality: 'high' | 'medium' | 'low'): Promise<string> {
    try {
      const optimizedUrl = this.getOptimizedUrl(url, quality);
      
      // Use Expo Image's built-in caching
      await Image.prefetch(optimizedUrl, {
        cachePolicy: 'memory-disk'
      });

      // Store cache entry
      const entry: CacheEntry = {
        url: optimizedUrl,
        timestamp: Date.now(),
        size: this.estimateImageSize(quality),
        quality,
      };

      const cacheKey = this.getCacheKey(url, quality);
      this.cache.set(cacheKey, entry);
      this.memoryUsage += entry.size;

      // Update persistent cache index
      await this.updateCacheIndex();

      return optimizedUrl;
    } catch (error) {
      console.error('Failed to download and cache image:', error);
      throw error;
    }
  }

  private getOptimizedUrl(url: string, quality: 'high' | 'medium' | 'low'): string {
    // Validate URL
    if (!url || typeof url !== 'string') {
      return require('@/assets/images/react-logo.png');
    }

    // If it's already an Unsplash URL, add optimization parameters
    if (url.includes('unsplash.com')) {
      const qualityParams = {
        high: 'w=800&h=1200&fit=crop&crop=center&auto=format&q=85',
        medium: 'w=600&h=900&fit=crop&crop=center&auto=format&q=80',
        low: 'w=200&h=300&fit=crop&crop=center&auto=format&q=60'
      };
      
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}${qualityParams[quality]}`;
    }

    // For other URLs, return as-is (could add more optimization services)
    return url;
  }

  private async generatePreview(url: string): Promise<string> {
    // Generate low-quality preview for blur-to-sharp effect
    return this.getOptimizedImage(url, 'low');
  }

  private generateBlurHash(url: string): string {
    // Placeholder for blur hash generation
    // In a real app, you'd generate actual blur hashes
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="200" height="300" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#1a1a1a;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#333333;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad)" />
      </svg>
    `)}`;
  }

  private getCacheKey(url: any, quality: 'high' | 'medium' | 'low'): string {
    // Handle numeric IDs from require() statements
    if (typeof url === 'number') {
      return `${this.CACHE_PREFIX}${quality}_local_${url}`;
    }
    return `${this.CACHE_PREFIX}${quality}_${btoa(url)}`;
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > this.config.maxAge;
  }

  private estimateImageSize(quality: 'high' | 'medium' | 'low'): number {
    const estimates = {
      high: 800 * 1024, // 800KB
      medium: 400 * 1024, // 400KB  
      low: 100 * 1024, // 100KB
    };
    return estimates[quality];
  }

  private async removeCacheEntry(key: string): Promise<void> {
    const entry = this.cache.get(key);
    if (entry) {
      this.memoryUsage -= entry.size;
      this.cache.delete(key);
      
      // Remove from persistent storage if needed
      try {
        await AsyncStorage.removeItem(key);
      } catch (error) {
        console.warn('Failed to remove cache entry from storage:', error);
      }
    }
  }

  private async loadCacheIndex(): Promise<void> {
    try {
      const indexData = await AsyncStorage.getItem(this.CACHE_INDEX_KEY);
      if (indexData) {
        const entries: [string, CacheEntry][] = JSON.parse(indexData);
        
        // Restore non-expired entries
        for (const [key, entry] of entries) {
          if (!this.isExpired(entry)) {
            this.cache.set(key, entry);
            this.memoryUsage += entry.size;
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load cache index:', error);
    }
  }

  private async updateCacheIndex(): Promise<void> {
    try {
      const entries = Array.from(this.cache.entries());
      await AsyncStorage.setItem(this.CACHE_INDEX_KEY, JSON.stringify(entries));
    } catch (error) {
      console.warn('Failed to update cache index:', error);
    }
  }

  private startCleanupTimer(): void {
    // Clean up cache every 5 minutes
    setInterval(() => {
      this.clearCache(false);
    }, 5 * 60 * 1000);
  }
}

export const imageCache = new ImageCache();
export type { CacheEntry, CacheConfig };