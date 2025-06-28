import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { DesignSystem } from '@/constants/DesignSystem';
import { Flight } from '@/types';
import { FlightCardMedia } from './FlightCardMedia';
import { mediaService, DestinationMedia } from '@/services/media/mediaService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FlightCardProps {
  flight: Flight;
  index: number;
  isActive: boolean;
  scrollY: Animated.SharedValue<number>;
  onBookPress: (flight: Flight) => void;
  onDetailsPress: (flight: Flight) => void;
}

export const FlightCard = React.memo(function FlightCard({
  flight,
  index,
  isActive,
  scrollY,
  onBookPress,
  onDetailsPress,
}: FlightCardProps) {
  const [destinationMedia, setDestinationMedia] = useState<DestinationMedia[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(true);
  
  const departureSegment = flight.segments[0];
  const lastSegment = flight.segments[flight.segments.length - 1];
  const destinationAirport = lastSegment.arrival.airport;
  
  // Animation values
  const contentOpacity = useSharedValue(0);
  const priceScale = useSharedValue(0.8);
  const airlineOpacity = useSharedValue(0);
  const routeOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(0.9);

  // Enhanced media loading with context and optimization
  useEffect(() => {
    const loadMedia = async () => {
      try {
        setIsLoadingMedia(true);
        
        // Determine time-based context for better media selection
        const currentHour = new Date().getHours();
        let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
        if (currentHour >= 5 && currentHour < 12) timeOfDay = 'morning';
        else if (currentHour >= 12 && currentHour < 17) timeOfDay = 'afternoon';
        else if (currentHour >= 17 && currentHour < 21) timeOfDay = 'evening';
        else timeOfDay = 'night';
        
        // Get contextual media with optimization
        const media = await mediaService.getDestinationMedia(
          destinationAirport.code,
          destinationAirport.city,
          {
            timeOfDay,
            includeVideos: true,
            limit: 5,
            preload: isActive // Preload only for active cards
          }
        );
        
        setDestinationMedia(media);
      } catch (error) {
        console.error('Failed to load destination media:', error);
        setDestinationMedia([]);
      } finally {
        setIsLoadingMedia(false);
      }
    };

    loadMedia();
  }, [destinationAirport.code, destinationAirport.city, isActive]);

  // Animate in content when card becomes active
  useEffect(() => {
    if (isActive) {
      contentOpacity.value = withDelay(200, withSpring(1));
      priceScale.value = withDelay(300, withSpring(1));
      airlineOpacity.value = withDelay(400, withSpring(1));
      routeOpacity.value = withDelay(500, withSpring(1));
      buttonScale.value = withDelay(600, withSpring(1));
    } else {
      contentOpacity.value = withSpring(0.8);
      priceScale.value = withSpring(0.9);
      airlineOpacity.value = withSpring(0.7);
      routeOpacity.value = withSpring(0.7);
      buttonScale.value = withSpring(0.95);
    }
  }, [isActive]);

  // Format time helper
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Format duration helper
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Animated styles
  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const priceAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: priceScale.value }],
  }));

  const airlineAnimatedStyle = useAnimatedStyle(() => ({
    opacity: airlineOpacity.value,
  }));

  const routeAnimatedStyle = useAnimatedStyle(() => ({
    opacity: routeOpacity.value,
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  // Parallax effect for the entire card
  const cardAnimatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * SCREEN_HEIGHT,
      index * SCREEN_HEIGHT,
      (index + 1) * SCREEN_HEIGHT,
    ];

    const translateY = interpolate(
      scrollY.value,
      inputRange,
      [SCREEN_HEIGHT * 0.1, 0, -SCREEN_HEIGHT * 0.1],
      Extrapolate.CLAMP
    );

    const scale = interpolate(
      scrollY.value,
      inputRange,
      [0.95, 1, 0.95],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ translateY }, { scale }],
    };
  });

  return (
    <Animated.View style={[styles.container, cardAnimatedStyle]}>
      {/* Background Media */}
      {!isLoadingMedia && destinationMedia.length > 0 && (
        <FlightCardMedia
          media={destinationMedia}
          isActive={isActive}
          scrollY={scrollY}
          index={index}
          enableProgressiveLoading={true}
          autoplay={isActive}
          onMediaChange={(mediaIndex) => {
            // Could track media engagement here
            console.log(`Media changed to index ${mediaIndex} for flight ${flight.id}`);
          }}
        />
      )}

      {/* Content Overlay */}
      <Animated.View style={[styles.content, contentAnimatedStyle]}>
        {/* Top Section - Airline Info & Price */}
        <View style={styles.topSection}>
          <Animated.View style={[styles.airlineSection, airlineAnimatedStyle]}>
            <View style={styles.airlineInfo}>
              <Image
                source={{ uri: mediaService.getAirlineLogo(departureSegment.airline.code) }}
                style={styles.airlineLogo}
                contentFit="contain"
                cachePolicy="memory-disk"
                transition={300}
                placeholder={require('@/assets/images/adaptive-icon.png')}
                onError={() => console.warn('Airline logo failed to load')}
              />
              <View style={styles.airlineDetails}>
                <Text style={styles.airlineName}>{departureSegment.airline.name}</Text>
                <Text style={styles.flightNumber}>
                  {departureSegment.flightNumber} • {departureSegment.aircraft.model}
                </Text>
              </View>
            </View>
          </Animated.View>

          <Animated.View style={[styles.priceSection, priceAnimatedStyle]}>
            {flight.deals && (
              <View style={styles.dealBadge}>
                <Text style={styles.dealText}>{flight.deals.discount}% OFF</Text>
              </View>
            )}
            <View style={styles.priceContainer}>
              {flight.deals && (
                <Text style={styles.originalPrice}>${flight.deals.originalPrice}</Text>
              )}
              <Text style={styles.price}>${flight.price.total}</Text>
              <Text style={styles.perPerson}>per person</Text>
            </View>
          </Animated.View>
        </View>

        {/* Middle Section - Destination */}
        <View style={styles.middleSection}>
          <Text style={styles.destinationCity}>{destinationAirport.city}</Text>
          <Text style={styles.destinationCountry}>{destinationAirport.country}</Text>
          <Text style={styles.destinationAirport}>
            {destinationAirport.name} ({destinationAirport.code})
          </Text>
        </View>

        {/* Bottom Section - Route & Actions */}
        <View style={styles.bottomSection}>
          <Animated.View style={[styles.routeSection, routeAnimatedStyle]}>
            <View style={styles.routeInfo}>
              <View style={styles.timeBlock}>
                <Text style={styles.time}>{formatTime(departureSegment.departure.time)}</Text>
                <Text style={styles.airport}>{departureSegment.departure.airport.code}</Text>
              </View>

              <View style={styles.flightPath}>
                <View style={styles.pathLine} />
                <View style={styles.flightDetails}>
                  <Text style={styles.duration}>{formatDuration(flight.totalDuration)}</Text>
                  {flight.stops > 0 && (
                    <Text style={styles.stops}>
                      {flight.stops} stop{flight.stops > 1 ? 's' : ''}
                    </Text>
                  )}
                </View>
                <IconSymbol name="airplane" size={16} color="white" style={styles.airplaneIcon} />
              </View>

              <View style={styles.timeBlock}>
                <Text style={styles.time}>{formatTime(lastSegment.arrival.time)}</Text>
                <Text style={styles.airport}>{lastSegment.arrival.airport.code}</Text>
              </View>
            </View>

            {/* Flight amenities */}
            {flight.amenities.length > 0 && (
              <View style={styles.amenities}>
                {flight.amenities.slice(0, 3).map((amenity, idx) => (
                  <View key={idx} style={styles.amenityTag}>
                    <Text style={styles.amenityText}>{amenity}</Text>
                  </View>
                ))}
              </View>
            )}
          </Animated.View>

          {/* Action Buttons */}
          <Animated.View style={[styles.actions, buttonAnimatedStyle]}>
            <TouchableOpacity
              style={styles.detailsButton}
              onPress={() => onDetailsPress(flight)}
              activeOpacity={0.8}
            >
              <IconSymbol name="info.circle" size={20} color={DesignSystem.colors.textSecondary} />
              <Text style={styles.detailsButtonText}>Details</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bookButton}
              onPress={() => onBookPress(flight)}
              activeOpacity={0.8}
            >
              <Text style={styles.bookButtonText}>Book Flight</Text>
              <IconSymbol name="arrow.right" size={20} color="white" />
            </TouchableOpacity>
          </Animated.View>

          {/* Availability indicator */}
          {flight.availability.seatsLeft <= 5 && (
            <View style={styles.availabilitySection}>
              <IconSymbol name="clock" size={14} color="#FF6B35" />
              <Text style={styles.availabilityText}>
                Only {flight.availability.seatsLeft} seats left
              </Text>
            </View>
          )}
        </View>
      </Animated.View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: DesignSystem.colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  airlineSection: {
    flex: 1,
  },
  airlineInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  airlineLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'white',
    marginRight: 12,
  },
  airlineDetails: {
    flex: 1,
  },
  airlineName: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  flightNumber: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  priceSection: {
    alignItems: 'flex-end',
  },
  dealBadge: {
    backgroundColor: DesignSystem.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginBottom: 8,
  },
  dealText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  originalPrice: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textDecorationLine: 'line-through',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  price: {
    fontSize: 32,
    fontWeight: '800',
    color: 'white',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  perPerson: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  middleSection: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  destinationCity: {
    fontSize: 48,
    fontWeight: '800',
    color: 'white',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: -1,
  },
  destinationCountry: {
    fontSize: 20,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginTop: 8,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  destinationAirport: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bottomSection: {
    gap: 20,
  },
  routeSection: {
    gap: 16,
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 16,
    padding: 20,
  },
  timeBlock: {
    alignItems: 'center',
    minWidth: 60,
  },
  time: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  airport: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  flightPath: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 20,
    position: 'relative',
  },
  pathLine: {
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    width: '100%',
  },
  airplaneIcon: {
    position: 'absolute',
    top: -7,
    left: '50%',
    marginLeft: -8,
    backgroundColor: DesignSystem.colors.primary,
    borderRadius: 8,
    padding: 2,
  },
  flightDetails: {
    position: 'absolute',
    top: -30,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  duration: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  stops: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  amenities: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  amenityTag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  amenityText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 30,
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  detailsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DesignSystem.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 30,
    gap: 8,
    flex: 2,
    justifyContent: 'center',
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  availabilitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
  },
  availabilityText: {
    fontSize: 13,
    color: '#FF6B35',
    fontWeight: '600',
  },
});