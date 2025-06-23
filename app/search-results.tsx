import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Stack } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { DesignSystem } from '@/constants/DesignSystem';
import { flightService } from '@/services/api/flightService';
import { Flight, FlightSearchParams, FlightSearchResult } from '@/types';

// Flight Card Component
function FlightCard({ flight, onPress }: { flight: Flight; onPress: () => void }) {
  const departureSegment = flight.segments[0];
  const lastSegment = flight.segments[flight.segments.length - 1];
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <TouchableOpacity style={styles.flightCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.flightHeader}>
        <View style={styles.airlineInfo}>
          <Text style={styles.airlineName}>{departureSegment.airline.name}</Text>
          <Text style={styles.flightNumber}>{departureSegment.flightNumber}</Text>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>${flight.price.total}</Text>
          {flight.deals && (
            <Text style={styles.originalPrice}>${flight.deals.originalPrice}</Text>
          )}
        </View>
      </View>

      <View style={styles.flightRoute}>
        <View style={styles.timeInfo}>
          <Text style={styles.time}>{formatTime(departureSegment.departure.time)}</Text>
          <Text style={styles.airport}>{departureSegment.departure.airport.code}</Text>
        </View>
        
        <View style={styles.routeInfo}>
          <View style={styles.routeLine} />
          <View style={styles.durationContainer}>
            <Text style={styles.duration}>{formatDuration(flight.totalDuration)}</Text>
            {flight.stops > 0 && (
              <Text style={styles.stops}>
                {flight.stops} stop{flight.stops > 1 ? 's' : ''}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.timeInfo}>
          <Text style={styles.time}>{formatTime(lastSegment.arrival.time)}</Text>
          <Text style={styles.airport}>{lastSegment.arrival.airport.code}</Text>
        </View>
      </View>

      {flight.deals && (
        <View style={styles.dealBadge}>
          <Text style={styles.dealText}>{flight.deals.discount}% OFF</Text>
        </View>
      )}

      {flight.availability.seatsLeft <= 3 && (
        <Text style={styles.availability}>
          Only {flight.availability.seatsLeft} seats left
        </Text>
      )}
    </TouchableOpacity>
  );
}

export default function SearchResultsScreen() {
  const params = useLocalSearchParams();
  const [searchResults, setSearchResults] = useState<FlightSearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const searchParams: FlightSearchParams = JSON.parse(params.searchParams as string);
  const searchQuery = params.searchQuery as string;

  useEffect(() => {
    performSearch();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const performSearch = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const results = await flightService.searchFlights(searchParams);
      setSearchResults(results);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search flights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFlightPress = (flight: Flight) => {
    // TODO: Navigate to flight details screen
    Alert.alert(
      'Flight Selected',
      `${flight.segments[0].airline.name} flight for $${flight.price.total}`,
      [
        { text: 'Book Flight', onPress: () => console.log('Booking flow') },
        { text: 'View Details', onPress: () => console.log('Flight details') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const renderFlightCard = ({ item }: { item: Flight }) => (
    <FlightCard flight={item} onPress={() => handleFlightPress(item)} />
  );

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="light-content" backgroundColor={DesignSystem.colors.background} />
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <IconSymbol name="chevron.left" size={24} color={DesignSystem.colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Searching flights...</Text>
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={DesignSystem.colors.primary} />
            <Text style={styles.loadingText}>Finding the best flights for you</Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="light-content" backgroundColor={DesignSystem.colors.background} />
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <IconSymbol name="chevron.left" size={24} color={DesignSystem.colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Search Error</Text>
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={performSearch}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" backgroundColor={DesignSystem.colors.background} />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={DesignSystem.colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {searchParams.origin} → {searchParams.destination}
          </Text>
          <Text style={styles.headerSubtitle}>
            {searchResults?.totalResults} flights found for &quot;{searchQuery}&quot;
          </Text>
        </View>
      </View>

      <FlatList
        data={searchResults?.flights || []}
        renderItem={renderFlightCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.flightsList}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingVertical: DesignSystem.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.inputBorder,
    backgroundColor: DesignSystem.colors.background,
  },
  backButton: {
    padding: DesignSystem.spacing.xs,
    marginRight: DesignSystem.spacing.sm,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DesignSystem.colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: DesignSystem.colors.textSecondary,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: DesignSystem.spacing.xl,
  },
  loadingText: {
    fontSize: 16,
    color: DesignSystem.colors.textSecondary,
    marginTop: DesignSystem.spacing.md,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: DesignSystem.spacing.xl,
  },
  errorText: {
    fontSize: 16,
    color: DesignSystem.colors.textSecondary,
    textAlign: 'center',
    marginBottom: DesignSystem.spacing.lg,
  },
  retryButton: {
    backgroundColor: DesignSystem.colors.primary,
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingVertical: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borderRadius.medium,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  flightsList: {
    padding: DesignSystem.spacing.lg,
  },
  flightCard: {
    backgroundColor: DesignSystem.colors.card,
    borderRadius: DesignSystem.borderRadius.medium,
    padding: DesignSystem.spacing.lg,
    shadowColor: DesignSystem.shadow.color,
    shadowOffset: DesignSystem.shadow.offset,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  flightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: DesignSystem.spacing.md,
  },
  airlineInfo: {
    flex: 1,
  },
  airlineName: {
    fontSize: 16,
    fontWeight: '600',
    color: DesignSystem.colors.textPrimary,
  },
  flightNumber: {
    fontSize: 14,
    color: DesignSystem.colors.textSecondary,
    marginTop: 2,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: DesignSystem.colors.primary,
  },
  originalPrice: {
    fontSize: 14,
    color: DesignSystem.colors.textSecondary,
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  flightRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.sm,
  },
  timeInfo: {
    alignItems: 'center',
    minWidth: 60,
  },
  time: {
    fontSize: 18,
    fontWeight: '600',
    color: DesignSystem.colors.textPrimary,
  },
  airport: {
    fontSize: 12,
    color: DesignSystem.colors.textSecondary,
    marginTop: 2,
  },
  routeInfo: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: DesignSystem.spacing.md,
  },
  routeLine: {
    height: 1,
    backgroundColor: DesignSystem.colors.inputBorder,
    width: '100%',
  },
  durationContainer: {
    backgroundColor: DesignSystem.colors.background,
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: 2,
    marginTop: -8,
    alignItems: 'center',
  },
  duration: {
    fontSize: 12,
    color: DesignSystem.colors.textSecondary,
    fontWeight: '500',
  },
  stops: {
    fontSize: 11,
    color: DesignSystem.colors.textSecondary,
    marginTop: 1,
  },
  dealBadge: {
    position: 'absolute',
    top: DesignSystem.spacing.sm,
    right: DesignSystem.spacing.sm,
    backgroundColor: DesignSystem.colors.primary,
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: 4,
    borderRadius: DesignSystem.borderRadius.small,
  },
  dealText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  availability: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: '500',
    textAlign: 'right',
  },
  separator: {
    height: DesignSystem.spacing.md,
  },
});