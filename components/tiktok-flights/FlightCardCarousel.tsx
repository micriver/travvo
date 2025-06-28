import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  StatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useDerivedValue,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Flight } from '@/types';
import { FlightCard } from './FlightCard';
import { FlightCardGestures } from './FlightCardGestures';
import { DesignSystem } from '@/constants/DesignSystem';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FlightCardCarouselProps {
  flights: Flight[];
  onFlightBook: (flight: Flight) => void;
  onFlightDetails: (flight: Flight) => void;
  onIndexChange?: (index: number) => void;
  initialIndex?: number;
}

export const FlightCardCarousel = React.memo(function FlightCardCarousel({
  flights,
  onFlightBook,
  onFlightDetails,
  onIndexChange,
  initialIndex = 0,
}: FlightCardCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [isReady, setIsReady] = useState(false);
  const scrollViewRef = useRef<Animated.ScrollView>(null);
  
  // Shared values for animations
  const scrollY = useSharedValue(initialIndex * SCREEN_HEIGHT);
  const isScrolling = useSharedValue(false);
  const lastScrollTime = useSharedValue(0);

  // Initialize scroll position
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
      if (initialIndex > 0) {
        scrollY.value = initialIndex * SCREEN_HEIGHT;
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [initialIndex]);

  // Handle index changes with crash prevention
  const handleIndexChange = useCallback((newIndex: number) => {
    try {
      if (newIndex !== activeIndex && newIndex >= 0 && newIndex < flights.length) {
        console.log(`🎯 [Carousel] Setting active index: ${newIndex}`);
        setActiveIndex(newIndex);
        onIndexChange?.(newIndex);
        
        // Safe haptic feedback
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(console.warn);
      }
    } catch (error) {
      console.error('💥 [Carousel] Index change failed:', error);
    }
  }, [activeIndex, flights.length, onIndexChange]);

  // Derive current index from scroll position
  const currentIndex = useDerivedValue(() => {
    const index = Math.round(scrollY.value / SCREEN_HEIGHT);
    return Math.max(0, Math.min(index, flights.length - 1));
  });

  // Monitor index changes with throttling to prevent infinite loops
  const lastProcessedIndex = useSharedValue(-1);
  useDerivedValue(() => {
    const newIndex = currentIndex.value;
    if (newIndex !== lastProcessedIndex.value && newIndex >= 0 && newIndex < flights.length) {
      lastProcessedIndex.value = newIndex;
      console.log(`🔄 [Carousel] Index change detected: ${activeIndex} → ${newIndex}`);
      runOnJS(handleIndexChange)(newIndex);
    }
  });

  // Simplified scroll handler without dangerous worklet code
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      isScrolling.value = true;
      lastScrollTime.value = Date.now();
    },
    onBeginDrag: () => {
      isScrolling.value = true;
      console.log('📱 [Carousel] Scroll started');
    },
    onEndDrag: () => {
      // Simple end drag - no complex timing logic
      isScrolling.value = false;
      console.log('📱 [Carousel] Scroll ended');
    },
    onMomentumEnd: () => {
      isScrolling.value = false;
      console.log('📱 [Carousel] Momentum ended');
    },
  });

  // Handle flight booking
  const handleFlightBook = useCallback((flight: Flight) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onFlightBook(flight);
  }, [onFlightBook]);

  // Handle flight details
  const handleFlightDetails = useCallback((flight: Flight) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onFlightDetails(flight);
  }, [onFlightDetails]);

  // Render individual flight card with gestures
  const renderFlightCard = useCallback(({ item: flight, index }: { item: Flight; index: number }) => {
    const isActive = index === activeIndex;
    
    return (
      <FlightCardGestures
        key={flight.id}
        index={index}
        totalCount={flights.length}
        scrollY={scrollY}
        onIndexChange={handleIndexChange}
        isActive={isActive}
      >
        <FlightCard
          flight={flight}
          index={index}
          isActive={isActive}
          scrollY={scrollY}
          onBookPress={handleFlightBook}
          onDetailsPress={handleFlightDetails}
        />
      </FlightCardGestures>
    );
  }, [activeIndex, flights.length, scrollY, handleIndexChange, handleFlightBook, handleFlightDetails]);

  // Loading state
  if (!isReady || flights.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={DesignSystem.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Status bar configuration */}
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      
      {/* Safe area for iOS */}
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Main scroll view with flight cards */}
        <Animated.ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          onScroll={scrollHandler}
          scrollEventThrottle={32}
          showsVerticalScrollIndicator={false}
          snapToInterval={SCREEN_HEIGHT}
          snapToAlignment="start"
          decelerationRate="fast"
          disableIntervalMomentum={false}
          pagingEnabled={true}
          removeClippedSubviews={false}
        >
          {flights.map((flight, index) =>
            renderFlightCard({ item: flight, index })
          )}
        </Animated.ScrollView>

        {/* Flight counter indicator */}
        <View style={styles.counterContainer}>
          <View style={styles.counter}>
            <Animated.Text style={styles.counterText}>
              {activeIndex + 1} / {flights.length}
            </Animated.Text>
          </View>
        </View>

        {/* Card indicators */}
        <View style={styles.indicatorContainer}>
          {flights.map((_, index) => {
            const indicatorStyle = {
              backgroundColor: index === activeIndex 
                ? 'rgba(255,255,255,0.9)' 
                : 'rgba(255,255,255,0.3)',
              height: index === activeIndex ? 12 : 8,
            };
            
            return (
              <Animated.View
                key={index}
                style={[styles.indicator, indicatorStyle]}
              />
            );
          })}
        </View>
      </SafeAreaView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DesignSystem.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  counterContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    zIndex: 10,
  },
  counter: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  counterText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  indicatorContainer: {
    position: 'absolute',
    right: 20,
    top: '50%',
    transform: [{ translateY: -50 }],
    alignItems: 'center',
    gap: 8,
    zIndex: 10,
  },
  indicator: {
    width: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
});