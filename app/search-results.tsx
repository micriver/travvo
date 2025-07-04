import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
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
import { Flight, FlightSearchParams, FlightSearchResult, BookingRequest } from '@/types';
import { FlightResultsList } from '@/components/search';
import { FlightDetailsModal } from '@/components/booking/FlightDetailsModal';
import { BookingOptionsCard } from '@/components/booking/BookingOptionsCard';
import { VoiceBookingInterface } from '@/components/booking/VoiceBookingInterface';
import { ManualBookingForm } from '@/components/booking/ManualBookingForm';
import { priceTrackingService } from '@/services/booking/PriceTrackingService';
import { bookingHandoffService } from '@/services/booking/BookingHandoffService';


export default function SearchResultsScreen() {
  const params = useLocalSearchParams();
  const [searchResults, setSearchResults] = useState<FlightSearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [showFlightDetails, setShowFlightDetails] = useState(false);
  const [showBookingOptions, setShowBookingOptions] = useState(false);
  const [showVoiceBooking, setShowVoiceBooking] = useState(false);
  const [showManualBooking, setShowManualBooking] = useState(false);

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

  // Handle flight booking
  const handleFlightBook = useCallback((flight: Flight) => {
    setSelectedFlight(flight);
    setShowBookingOptions(true);
  }, []);

  // Handle flight details
  const handleFlightDetails = useCallback((flight: Flight) => {
    setSelectedFlight(flight);
    setShowFlightDetails(true);
  }, []);

  // Handle price tracking
  const handleTrackPrice = useCallback(async (flight: Flight) => {
    try {
      const tracker = await priceTrackingService.createTracker(
        'current_user', // In real app, get from user context
        {
          origin: flight.segments[0].departure.airport.code,
          destination: flight.segments[flight.segments.length - 1].arrival.airport.code,
          departureDate: flight.segments[0].departure.time,
          passengers: 1, // Default, could be from search params
          cabin: flight.cabin
        },
        {
          alertThreshold: 10, // 10% price drop
          notifications: {
            email: true,
            push: true,
            frequency: 'immediate'
          }
        }
      );
      
      Alert.alert(
        'Price Tracking Enabled',
        `We'll monitor prices for this route and notify you of any drops!`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to set up price tracking. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }, []);

  // Handle flight sharing
  const handleShareFlight = useCallback(async (flight: Flight) => {
    console.log('Sharing flight:', flight.id);
    Alert.alert('Success', 'Flight details copied to share!');
  }, []);

  // Handle voice booking
  const handleVoiceBooking = useCallback((flight: Flight) => {
    setSelectedFlight(flight);
    setShowBookingOptions(false);
    setShowVoiceBooking(true);
  }, []);

  // Handle manual booking
  const handleManualBooking = useCallback((flight: Flight) => {
    setSelectedFlight(flight);
    setShowBookingOptions(false);
    setShowManualBooking(true);
  }, []);

  // Handle booking completion
  const handleBookingComplete = useCallback(async (bookingData: BookingRequest | any) => {
    try {
      // Initiate booking handoff to airline
      const result = await bookingHandoffService.initiateBookingHandoff(bookingData);
      
      if (result.success) {
        Alert.alert(
          'Booking Initiated',
          'You\'re being redirected to complete your booking with the airline.',
          [{ text: 'OK' }]
        );
        
        // Close all modals
        setShowVoiceBooking(false);
        setShowManualBooking(false);
        setSelectedFlight(null);
      } else {
        Alert.alert(
          'Booking Error',
          result.errorMessage || 'Failed to initiate booking. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }, []);

  // Handle switching between booking modes
  const handleSwitchToVoice = useCallback(() => {
    setShowManualBooking(false);
    setShowVoiceBooking(true);
  }, []);

  const handleSwitchToManual = useCallback(() => {
    setShowVoiceBooking(false);
    setShowManualBooking(true);
  }, []);

  // Handle modal closures
  const closeAllModals = useCallback(() => {
    setShowFlightDetails(false);
    setShowBookingOptions(false);
    setShowVoiceBooking(false);
    setShowManualBooking(false);
    setSelectedFlight(null);
  }, []);

  // Handle current flight index change
  const handleIndexChange = useCallback((index: number) => {
    // Could be used for analytics or other tracking
    console.log('Current flight index:', index);
  }, []);

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={styles.loadingScreen}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButtonLoading}>
            <IconSymbol name="chevron.left" size={24} color={DesignSystem.colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color={DesignSystem.colors.primary} />
            <Text style={styles.loadingText}>Finding the best flights for you</Text>
            <Text style={styles.loadingSubtext}>
              {searchParams.origin} → {searchParams.destination}
            </Text>
          </View>
        </View>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={styles.errorScreen}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButtonError}>
            <IconSymbol name="chevron.left" size={24} color={DesignSystem.colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.errorContent}>
            <IconSymbol name="exclamationmark.triangle" size={64} color={DesignSystem.colors.error} />
            <Text style={styles.errorTitle}>Search Failed</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={performSearch}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  }

  // Check if we have flights to display
  if (!searchResults?.flights || searchResults.flights.length === 0) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={styles.noResultsScreen}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButtonError}>
            <IconSymbol name="chevron.left" size={24} color={DesignSystem.colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.noResultsContent}>
            <IconSymbol name="airplane" size={64} color={DesignSystem.colors.inactive} />
            <Text style={styles.noResultsTitle}>No Flights Found</Text>
            <Text style={styles.noResultsText}>
              We couldn't find any flights for {searchParams.origin} → {searchParams.destination}
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
              <Text style={styles.retryButtonText}>Search Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={DesignSystem.colors.textPrimary} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {searchParams.origin} → {searchParams.destination}
          </Text>
          <Text style={styles.headerSubtitle}>
            {searchResults.totalResults} flights • &quot;{searchQuery}&quot;
          </Text>
        </View>
      </View>

      {/* Flight Results List */}
      <FlightResultsList
        flights={searchResults.flights}
        onFlightBook={handleFlightBook}
        onFlightDetails={handleFlightDetails}
        onRefresh={performSearch}
        refreshing={loading}
      />

      {/* Booking Modals */}
      <FlightDetailsModal
        visible={showFlightDetails}
        flight={selectedFlight}
        onClose={closeAllModals}
        onBook={handleFlightBook}
        onTrackPrice={handleTrackPrice}
        onShare={handleShareFlight}
      />

      <BookingOptionsCard
        visible={showBookingOptions}
        flight={selectedFlight}
        onClose={closeAllModals}
        onVoiceBooking={handleVoiceBooking}
        onManualBooking={handleManualBooking}
      />

      <VoiceBookingInterface
        visible={showVoiceBooking}
        flight={selectedFlight}
        onClose={closeAllModals}
        onBookingComplete={handleBookingComplete}
        onSwitchToManual={handleSwitchToManual}
      />

      <ManualBookingForm
        visible={showManualBooking}
        flight={selectedFlight}
        onClose={closeAllModals}
        onBookingComplete={handleBookingComplete}
        onSwitchToVoice={handleSwitchToVoice}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingBottom: DesignSystem.spacing.md,
    backgroundColor: DesignSystem.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.inputBorder,
  },
  backButton: {
    padding: DesignSystem.spacing.sm,
    marginRight: DesignSystem.spacing.md,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DesignSystem.colors.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: DesignSystem.colors.textSecondary,
  },

  // Loading Screen
  loadingScreen: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  backButtonLoading: {
    position: 'absolute',
    top: 60,
    left: 20,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    zIndex: 10,
  },
  loadingContent: {
    alignItems: 'center',
    gap: 20,
  },
  loadingText: {
    fontSize: 20,
    color: DesignSystem.colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 16,
    color: DesignSystem.colors.textSecondary,
    textAlign: 'center',
  },

  // Error Screen
  errorScreen: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  backButtonError: {
    position: 'absolute',
    top: 60,
    left: 20,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    zIndex: 10,
  },
  errorContent: {
    alignItems: 'center',
    gap: 20,
    maxWidth: 300,
  },
  errorTitle: {
    fontSize: 24,
    color: DesignSystem.colors.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: DesignSystem.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: DesignSystem.colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    marginTop: 10,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },

  // No Results Screen
  noResultsScreen: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  noResultsContent: {
    alignItems: 'center',
    gap: 20,
    maxWidth: 300,
  },
  noResultsTitle: {
    fontSize: 24,
    color: DesignSystem.colors.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
  },
  noResultsText: {
    fontSize: 16,
    color: DesignSystem.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },

});