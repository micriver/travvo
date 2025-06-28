import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ImageBackground,
  ActivityIndicator,
} from 'react-native';
import { VideoView, VideoSource } from 'expo-video';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';
import { DesignSystem } from '@/constants/DesignSystem';
import { DestinationMedia } from '@/services/media/mediaService';
import { videoOptimizer } from '@/services/media/VideoOptimizer';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FlightCardMediaProps {
  media: DestinationMedia[];
  isActive: boolean;
  scrollY: Animated.SharedValue<number>;
  index: number;
  onMediaChange?: (mediaIndex: number) => void;
  enableProgressiveLoading?: boolean;
  autoplay?: boolean;
}

export const FlightCardMedia = React.memo(function FlightCardMedia({ 
  media, 
  isActive, 
  scrollY, 
  index,
  onMediaChange,
  enableProgressiveLoading = true,
  autoplay = true
}: FlightCardMediaProps) {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [loadedMedia, setLoadedMedia] = useState(new Set<number>());
  const [showPreview, setShowPreview] = useState(enableProgressiveLoading);
  const [shouldRenderVideo, setShouldRenderVideo] = useState(false);
  const videoRef = useRef<VideoView>(null);
  const fadeAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(1);
  const previewOpacity = useSharedValue(1);
  const fullImageOpacity = useSharedValue(0);

  const currentMedia = media[currentMediaIndex] || media[0];
  // Re-enable video rendering with safety measures
  const isVideo = currentMedia?.type === 'video';
  const hasProgressiveUrls = currentMedia?.progressiveUrls && enableProgressiveLoading;

  // Debug logging
  console.log(`🐛 [FlightCardMedia] Index ${currentMediaIndex}:`, {
    mediaType: currentMedia?.type,
    isVideo,
    url: currentMedia?.url,
    hasError,
    shouldRenderVideo,
    isActive
  });

  // Media cycling removed - images now stay static

  // Notify parent of media changes
  useEffect(() => {
    onMediaChange?.(currentMediaIndex);
  }, [currentMediaIndex, onMediaChange]);

  // Enhanced video playback with optimization and memory management
  useEffect(() => {
    if (isVideo) {
      if (isActive) {
        console.log('✅ Activating video:', currentMedia.url);
        setShouldRenderVideo(true);
      } else {
        console.log('⏸️ Deactivating video:', currentMedia.url);
        // Immediately disable video rendering to prevent multiple instances
        setShouldRenderVideo(false);
      }
    } else {
      setShouldRenderVideo(false);
    }
  }, [isActive, currentMedia, isVideo]);

  // Enhanced progressive loading animation
  useEffect(() => {
    if (!isLoading) {
      fadeAnim.value = withTiming(1, { duration: 500 });
      
      if (hasProgressiveUrls && showPreview) {
        // Smooth transition from preview to full image
        previewOpacity.value = withSequence(
          withTiming(1, { duration: 200 }),
          withTiming(0, { duration: 400 })
        );
        fullImageOpacity.value = withTiming(1, { duration: 600 });
        
        // Hide preview after transition
        setTimeout(() => {
          runOnJS(setShowPreview)(false);
        }, 600);
      }
    }
  }, [isLoading, fadeAnim, hasProgressiveUrls, showPreview]);

  // Preload surrounding media items
  useEffect(() => {
    if (isActive) {
      // Preload current and next items
      preloadMediaItem(currentMediaIndex);
      
      const nextIndex = (currentMediaIndex + 1) % media.length;
      if (media[nextIndex]) {
        preloadMediaItem(nextIndex);
      }
      
      // Preload previous item for smooth swiping
      const prevIndex = currentMediaIndex === 0 ? media.length - 1 : currentMediaIndex - 1;
      if (media[prevIndex]) {
        preloadMediaItem(prevIndex);
      }
    }
  }, [isActive, currentMediaIndex, media.length]);

  // Cleanup effect to prevent memory leaks
  useEffect(() => {
    return () => {
      // Cleanup video when component unmounts
      if (videoRef.current && isVideo) {
        console.log('🧹 Cleaning up video component');
        setShouldRenderVideo(false);
      }
    };
  }, [isVideo]);

  // Enhanced parallax effect with performance optimization
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * SCREEN_HEIGHT,
      index * SCREEN_HEIGHT,
      (index + 1) * SCREEN_HEIGHT,
    ];

    const scale = interpolate(
      scrollY.value,
      inputRange,
      [1.1, 1, 1.1],
      Extrapolate.CLAMP
    );

    const translateY = interpolate(
      scrollY.value,
      inputRange,
      [-50, 0, 50],
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { scale },
        { translateY },
      ],
      opacity: fadeAnim.value,
    };
  });

  // Progressive loading animation styles
  const previewAnimatedStyle = useAnimatedStyle(() => ({
    opacity: previewOpacity.value,
  }));

  const fullImageAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fullImageOpacity.value,
  }));

  // Enhanced load handlers with progressive loading
  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
    setLoadedMedia(prev => new Set(prev).add(currentMediaIndex));
  }, [currentMediaIndex]);

  const handleImageError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    console.warn('Image failed to load:', currentMedia?.url);
  }, [currentMedia]);

  const handleVideoLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
    setLoadedMedia(prev => new Set(prev).add(currentMediaIndex));
  }, [currentMediaIndex]);

  const handleVideoError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    console.warn('❌ Video/Image failed to load:', currentMedia?.url);
    
    // Immediate fallback to photo if video fails
    const photoMedia = media.find(m => m.type === 'photo');
    if (photoMedia) {
      console.log('🔄 Falling back to photo:', photoMedia.url);
      setCurrentMediaIndex(media.indexOf(photoMedia));
      setHasError(false); // Reset error state for photo
    } else {
      console.warn('⚠️ No photo fallback available - will show placeholder');
    }
  }, [currentMedia, media]);

  // Preload media item function
  const preloadMediaItem = useCallback(async (mediaIndex: number) => {
    const mediaItem = media[mediaIndex];
    if (!mediaItem || loadedMedia.has(mediaIndex)) return;
    
    try {
      if (mediaItem.type === 'video') {
        // Skip video preloading for now to prevent crashes
        console.log('📹 Video ready for display:', mediaItem.url);
      } else {
        // Image preloading is handled by the Image component's caching
        console.log('🖼️ Image ready for display:', mediaItem.url);
      }
      
      setLoadedMedia(prev => new Set(prev).add(mediaIndex));
    } catch (error) {
      console.warn('Failed to preload media:', error);
    }
  }, [media, loadedMedia]);

  if (!currentMedia) {
    return (
      <View style={styles.container}>
        <View style={styles.placeholder}>
          <ActivityIndicator size="large" color={DesignSystem.colors.primary} />
        </View>
        <View style={styles.gradient} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={DesignSystem.colors.primary} />
        </View>
      )}

      {(() => {
        console.log(`🎬 [Video Render Check]:`, {
          isVideo,
          hasError,
          shouldRenderVideo,
          condition: isVideo && !hasError && shouldRenderVideo
        });
        
        if (isVideo && !hasError && shouldRenderVideo) {
          console.log(`✅ [Rendering VideoView] URL: ${currentMedia.url}`);
          try {
            return (
              <Animated.View style={[styles.mediaContainer, animatedStyle]}>
                <VideoView
                  source={{ uri: currentMedia.url }}
                  style={styles.video}
                  shouldPlay={isActive && autoplay}
                  isLooping={true}
                  isMuted={true}
                  allowsFullscreen={false}
                  contentFit="cover"
                  onLoad={() => {
                    console.log(`📹 Video loaded successfully: ${currentMedia.url}`);
                    handleVideoLoad();
                  }}
                  onError={(error) => {
                    console.error(`❌ Video error: ${currentMedia.url}`, error);
                    handleVideoError();
                  }}
                  onPlaybackStatusUpdate={(status) => {
                    if (status.error) {
                      console.error(`❌ Video playback error:`, status.error);
                      handleVideoError();
                    }
                  }}
                />
              </Animated.View>
            );
          } catch (error) {
            console.error(`💥 VideoView render error:`, error);
            handleVideoError();
            return null;
          }
        } else if (isVideo) {
          // Video exists but shouldn't render yet - show placeholder or thumbnail
          console.log(`⏸️ [Video Placeholder] URL: ${currentMedia.url}, Waiting for activation`);
          return (
            <Animated.View style={[styles.mediaContainer, animatedStyle]}>
              <View style={styles.videoPlaceholder}>
                <Text style={styles.videoPlaceholderText}>Video Loading...</Text>
              </View>
            </Animated.View>
          );
        } else {
          // Render actual image
          console.log(`🖼️ [Rendering Image] URL: ${currentMedia.url}, Type: ${currentMedia.type}`);
          return (
            <Animated.View style={[styles.mediaContainer, animatedStyle]}>
              {/* Progressive loading with blur-to-sharp transition */}
              {hasProgressiveUrls && showPreview && (
                <Animated.View style={[styles.previewContainer, previewAnimatedStyle]}>
                  <Image
                    source={typeof currentMedia.progressiveUrls?.preview === 'number' ? currentMedia.progressiveUrls.preview : { uri: currentMedia.progressiveUrls?.preview }}
                    style={styles.previewImage}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    blurRadius={8}
                  />
                </Animated.View>
              )}
              
              <Animated.View style={[styles.fullImageContainer, hasProgressiveUrls ? fullImageAnimatedStyle : undefined]}>
                <Image
                  source={typeof currentMedia.url === 'number' ? currentMedia.url : { uri: currentMedia.url }}
                  style={styles.image}
                  contentFit="cover"
                  transition={hasProgressiveUrls ? 0 : 500}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  cachePolicy="memory-disk"
                  priority="high"
                  allowDownscaling
                  recyclingKey={currentMedia.id}
                />
              </Animated.View>
            </Animated.View>
          );
        }
      })()}

      {/* Dark overlay for text readability */}
      <View style={styles.gradient} />

      {/* Enhanced media indicators with loading states */}
      {media.length > 1 && (
        <View style={styles.mediaIndicators}>
          {media.map((_, idx) => {
            const isActive = idx === currentMediaIndex;
            const isLoaded = loadedMedia.has(idx);
            
            return (
              <View
                key={idx}
                style={[
                  styles.indicator,
                  isActive && styles.activeIndicator,
                  isLoaded && styles.loadedIndicator,
                ]}
              >
                {!isLoaded && idx === currentMediaIndex && (
                  <ActivityIndicator 
                    size="small" 
                    color="white" 
                    style={styles.indicatorLoader}
                  />
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: DesignSystem.colors.background,
  },
  mediaContainer: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SCREEN_HEIGHT * 0.6,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  previewContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  fullImageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DesignSystem.colors.card,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 10,
  },
  mediaIndicators: {
    position: 'absolute',
    top: 80,
    right: 20,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  indicator: {
    width: 3,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
  },
  activeIndicator: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    height: 25,
  },
  loadedIndicator: {
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  indicatorLoader: {
    position: 'absolute',
    top: -10,
    left: -8,
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  videoPlaceholderText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});