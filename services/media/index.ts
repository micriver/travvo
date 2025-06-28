/**
 * Media Services Index
 * Exports all enhanced media management services for TikTok-style experience
 */

import { pexelsVideoService as _pexelsVideoService } from './PexelsVideoService';

export { mediaService, type DestinationMedia } from './mediaService';
export { assetManager, type MediaAsset, type AirlineAsset } from './AssetManager';
export { imageCache, type CacheEntry, type CacheConfig } from './ImageCache';
export { videoOptimizer, type VideoAsset, type VideoQuality, type StreamingConfig } from './VideoOptimizer';
export { destinationMediaMapper, type MediaSelectionCriteria, type LocationContext } from './DestinationMediaMapper';
export { pexelsVideoService, type EnhancedVideoAsset, type SearchOptions } from './PexelsVideoService';

// Convenience function to initialize all media services
export const initializeMediaServices = async () => {
  try {
    console.log('Initializing enhanced media services...');
    
    // Services initialize themselves, but we can perform any global setup here
    const stats = {
      cache: imageCache.getCacheStats(),
      video: videoOptimizer.getVideoStats(),
      performance: mediaService.getPerformanceStats()
    };
    
    console.log('Media services initialized successfully:', stats);
    return stats;
  } catch (error) {
    console.error('Failed to initialize media services:', error);
    throw error;
  }
};

// Performance monitoring utilities
export const getMediaPerformanceReport = () => {
  return {
    timestamp: new Date().toISOString(),
    cache: imageCache.getCacheStats(),
    video: videoOptimizer.getVideoStats(),
    general: mediaService.getPerformanceStats(),
    pexels: _pexelsVideoService.getServiceStats()
  };
};

// Cleanup utilities
export const cleanupMediaServices = async () => {
  try {
    await mediaService.clearCaches();
    console.log('Media services cleaned up successfully');
  } catch (error) {
    console.error('Failed to cleanup media services:', error);
  }
};