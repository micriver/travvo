import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { Image } from 'expo-image';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { DesignSystem } from '@/constants/DesignSystem';
import { Flight } from '@/types';
import { mediaService, DestinationMedia } from '@/services/media/mediaService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FlightResultsListProps {
  flights: Flight[];
  onFlightBook: (flight: Flight) => void;
  onFlightDetails: (flight: Flight) => void;
  loading?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
}

interface FlightCardProps {
  flight: Flight;
  onBook: (flight: Flight) => void;
  onDetails: (flight: Flight) => void;
}

function FlightCard({ flight, onBook, onDetails }: FlightCardProps) {
  const [destinationMedia, setDestinationMedia] = useState<DestinationMedia | null>(null);
  const [imageLoading, setImageLoading] = useState(true);

  React.useEffect(() => {
    loadDestinationMedia();
  }, [flight]);

  const loadDestinationMedia = async () => {
    try {
      const lastSegment = flight.segments[flight.segments.length - 1];
      const destinationCode = lastSegment.arrival.airport.code;
      const destinationName = lastSegment.arrival.airport.city;
      
      const media = await mediaService.getDestinationMedia(destinationCode, destinationName);
      if (media.length > 0) {
        setDestinationMedia(media[0]); // Use first media item only (static)
      }
    } catch (error) {
      console.warn('Failed to load destination media:', error);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getDealBadge = (flight: Flight) => {
    // Simple deal detection based on price range
    if (flight.price.total <= 200) return { text: 'Great Deal', color: DesignSystem.colors.success };
    if (flight.price.total <= 400) return { text: 'Good Value', color: DesignSystem.colors.primary };
    return null;
  };

  const dealBadge = getDealBadge(flight);
  const firstSegment = flight.segments[0];
  const lastSegment = flight.segments[flight.segments.length - 1];
  const stops = flight.segments.length - 1;

  return (
    <TouchableOpacity 
      style={styles.flightCard} 
      onPress={() => onDetails(flight)}
      activeOpacity={0.95}
    >
      {/* Background Image */}
      {destinationMedia && (
        <View style={styles.imageContainer}>
          <Image
            source={typeof destinationMedia.url === 'number' ? destinationMedia.url : { uri: destinationMedia.url }}
            style={styles.backgroundImage}
            contentFit="cover"
            onLoad={() => setImageLoading(false)}
            cachePolicy="memory-disk"
          />
          <View style={styles.imageOverlay} />
          {imageLoading && (
            <View style={styles.imageLoading}>
              <ActivityIndicator size="small" color="white" />
            </View>
          )}
        </View>
      )}

      {/* Flight Content */}
      <View style={styles.flightContent}>
        {/* Header with Deal Badge */}
        <View style={styles.flightHeader}>
          <View style={styles.routeInfo}>
            <Text style={styles.routeText}>
              {firstSegment.departure.airport.code} → {lastSegment.arrival.airport.code}
            </Text>
            <Text style={styles.cityText}>
              {firstSegment.departure.airport.city} to {lastSegment.arrival.airport.city}
            </Text>
          </View>
          {dealBadge && (
            <View style={[styles.dealBadge, { backgroundColor: dealBadge.color }]}>
              <Text style={styles.dealBadgeText}>{dealBadge.text}</Text>
            </View>
          )}
        </View>

        {/* Flight Details */}
        <View style={styles.flightDetails}>
          <View style={styles.timeInfo}>
            <View style={styles.timeBlock}>
              <Text style={styles.timeText}>{formatTime(firstSegment.departure.time)}</Text>
              <Text style={styles.airportText}>{firstSegment.departure.airport.code}</Text>
            </View>
            
            <View style={styles.flightPath}>
              <View style={styles.flightLine} />
              <IconSymbol 
                name="airplane" 
                size={16} 
                color={DesignSystem.colors.textSecondary}
                style={styles.airplaneIcon}
              />
              <View style={styles.flightLine} />
            </View>
            
            <View style={styles.timeBlock}>
              <Text style={styles.timeText}>{formatTime(lastSegment.arrival.time)}</Text>
              <Text style={styles.airportText}>{lastSegment.arrival.airport.code}</Text>
            </View>
          </View>

          <View style={styles.flightMeta}>
            <Text style={styles.durationText}>
              {formatDuration(flight.duration)}
            </Text>
            <Text style={styles.stopsText}>
              {stops === 0 ? 'Nonstop' : `${stops} stop${stops > 1 ? 's' : ''}`}
            </Text>
            <Text style={styles.airlineText}>
              {flight.airline}
            </Text>
          </View>
        </View>

        {/* Price and Actions */}
        <View style={styles.flightFooter}>
          <View style={styles.priceInfo}>
            <Text style={styles.priceText}>${flight.price.total}</Text>
            <Text style={styles.priceSubtext}>per person</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.bookButton}
            onPress={(e) => {
              e.stopPropagation();
              onBook(flight);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.bookButtonText}>Book</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function FlightResultsList({
  flights,
  onFlightBook,
  onFlightDetails,
  loading = false,
  onRefresh,
  refreshing = false,
}: FlightResultsListProps) {
  const renderFlightCard = useCallback(({ item }: { item: Flight }) => (
    <FlightCard 
      flight={item} 
      onBook={onFlightBook} 
      onDetails={onFlightDetails} 
    />
  ), [onFlightBook, onFlightDetails]);

  const keyExtractor = useCallback((item: Flight) => item.id, []);

  if (loading && flights.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={DesignSystem.colors.primary} />
        <Text style={styles.loadingText}>Loading flights...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={flights}
      renderItem={renderFlightCard}
      keyExtractor={keyExtractor}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshing={refreshing}
      onRefresh={onRefresh}
      removeClippedSubviews={true}
      maxToRenderPerBatch={5}
      windowSize={10}
      initialNumToRender={3}
      getItemLayout={(data, index) => ({
        length: 200,
        offset: 200 * index,
        index,
      })}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background,
  },
  contentContainer: {
    padding: DesignSystem.spacing.md,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DesignSystem.colors.background,
  },
  loadingText: {
    marginTop: DesignSystem.spacing.md,
    fontSize: 16,
    color: DesignSystem.colors.textSecondary,
  },
  flightCard: {
    backgroundColor: DesignSystem.colors.card,
    borderRadius: DesignSystem.borderRadius.large,
    marginBottom: DesignSystem.spacing.md,
    overflow: 'hidden',
    shadowColor: DesignSystem.shadow.color,
    shadowOffset: DesignSystem.shadow.offset,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  imageContainer: {
    height: 120,
    position: 'relative',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  imageLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  flightContent: {
    padding: DesignSystem.spacing.lg,
  },
  flightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: DesignSystem.spacing.md,
  },
  routeInfo: {
    flex: 1,
  },
  routeText: {
    fontSize: 18,
    fontWeight: '700',
    color: DesignSystem.colors.textPrimary,
    marginBottom: 4,
  },
  cityText: {
    fontSize: 14,
    color: DesignSystem.colors.textSecondary,
  },
  dealBadge: {
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: 4,
    borderRadius: DesignSystem.borderRadius.small,
    marginLeft: DesignSystem.spacing.sm,
  },
  dealBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  flightDetails: {
    marginBottom: DesignSystem.spacing.lg,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.md,
  },
  timeBlock: {
    alignItems: 'center',
    flex: 1,
  },
  timeText: {
    fontSize: 20,
    fontWeight: '600',
    color: DesignSystem.colors.textPrimary,
    marginBottom: 4,
  },
  airportText: {
    fontSize: 14,
    color: DesignSystem.colors.textSecondary,
    fontWeight: '500',
  },
  flightPath: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
    paddingHorizontal: DesignSystem.spacing.md,
  },
  flightLine: {
    flex: 1,
    height: 1,
    backgroundColor: DesignSystem.colors.inputBorder,
  },
  airplaneIcon: {
    marginHorizontal: DesignSystem.spacing.xs,
  },
  flightMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  durationText: {
    fontSize: 14,
    color: DesignSystem.colors.textSecondary,
    fontWeight: '500',
  },
  stopsText: {
    fontSize: 14,
    color: DesignSystem.colors.textSecondary,
  },
  airlineText: {
    fontSize: 14,
    color: DesignSystem.colors.textSecondary,
    fontWeight: '500',
  },
  flightFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceInfo: {
    alignItems: 'flex-start',
  },
  priceText: {
    fontSize: 24,
    fontWeight: '700',
    color: DesignSystem.colors.primary,
  },
  priceSubtext: {
    fontSize: 12,
    color: DesignSystem.colors.textSecondary,
    marginTop: 2,
  },
  bookButton: {
    backgroundColor: DesignSystem.colors.primary,
    paddingHorizontal: DesignSystem.spacing.xl,
    paddingVertical: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borderRadius.medium,
  },
  bookButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});