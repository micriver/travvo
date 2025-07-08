import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { Stack } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { DesignSystem } from '@/constants/DesignSystem';
import { dealDetectionService } from '@/services/deals/dealDetectionService';
import { Flight, BookingRequest } from '@/types';
import { FlightCardCarousel } from '@/components/tiktok-flights';
import { FlightDetailsModal } from '@/components/booking/FlightDetailsModal';
import { BookingOptionsCard } from '@/components/booking/BookingOptionsCard';
import { VoiceBookingInterface } from '@/components/booking/VoiceBookingInterface';
import { ManualBookingForm } from '@/components/booking/ManualBookingForm';
import { priceTrackingService } from '@/services/booking/PriceTrackingService';
import { bookingHandoffService } from '@/services/booking/BookingHandoffService';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';

export default function DiscoveryScreen() {
  // TEMPORARILY DISABLED - Return to main screen
  React.useEffect(() => {
    router.replace('/(tabs)');
  }, []);

  const [discoveryFlights, setDiscoveryFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [showFlightDetails, setShowFlightDetails] = useState(false);
  const [showBookingOptions, setShowBookingOptions] = useState(false);
  const [showVoiceBooking, setShowVoiceBooking] = useState(false);
  const [showManualBooking, setShowManualBooking] = useState(false);

  const { state } = useUserPreferences();

  const loadDiscoveryFlights = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load curated deals based on user profile
      let deals = [];
      
      if (state.profile) {
        deals = await dealDetectionService.findPersonalizedDeals(state.profile);
      } else {
        // Generic popular destinations for users without profiles
        deals = [
          {
            id: 'discovery1',
            destination: 'Tokyo',
            airportCode: 'NRT',
            price: 650,
            originalPrice: 850,
            discount: 24,
            departureDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
            returnDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
            description: 'Direct flights to Japan',
            dealType: 'international'
          },
          {
            id: 'discovery2',
            destination: 'London',
            airportCode: 'LHR',
            price: 420,
            originalPrice: 580,
            discount: 28,
            departureDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            returnDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
            description: 'European getaway',
            dealType: 'international'
          },
          {
            id: 'discovery3',
            destination: 'Bali',
            airportCode: 'DPS',
            price: 780,
            originalPrice: 1200,
            discount: 35,
            departureDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            returnDate: new Date(Date.now() + 37 * 24 * 60 * 60 * 1000).toISOString(),
            description: 'Tropical paradise',
            dealType: 'international'
          }
        ];
      }

      // Convert deals to Flight objects for the TikTok interface
      const flights: Flight[] = deals.map((deal, index) => ({
        id: deal.id,
        airline: 'Premium Airlines',
        flightNumber: `PA${1000 + index}`,
        aircraft: 'Boeing 787',
        price: {
          total: deal.price,
          currency: 'USD',
          breakdown: {
            base: Math.round(deal.price * 0.75),
            taxes: Math.round(deal.price * 0.15),
            fees: Math.round(deal.price * 0.10)
          }
        },
        cabin: 'economy',
        availability: {
          seatsLeft: Math.floor(Math.random() * 50) + 10,
          lastUpdated: new Date()
        },
        baggage: {
          carry_on: {
            included: true,
            weight: 10,
            dimensions: '56x45x25'
          },
          checked: {
            included: false,
            weight: 23,
            fee: 50
          }
        },
        amenities: ['WiFi', 'Entertainment', 'Meals'],
        bookingClass: 'M',
        refundable: false,
        changeable: true,
        stops: 0,
        totalDuration: 480 + Math.random() * 240,
        segments: [
          {
            id: `${deal.id}-segment`,
            flightNumber: `PA${1000 + index}`,
            airline: {
              code: 'PA',
              name: 'Premium Airlines',
              logo: undefined
            },
            aircraft: {
              model: 'Boeing 787-9',
              manufacturer: 'Boeing',
              seatConfiguration: '3-3-3',
              photo: undefined
            },
            departure: {
              airport: {
                code: state.profile?.travelPreferences?.homeAirport || 'PHX',
                city: 'Phoenix',
                name: 'Phoenix Sky Harbor'
              },
              time: new Date(deal.departureDate),
              terminal: 'A'
            },
            arrival: {
              airport: {
                code: deal.airportCode,
                city: deal.destination,
                name: `${deal.destination} Airport`
              },
              time: new Date(deal.returnDate || new Date(new Date(deal.departureDate).getTime() + 8 * 60 * 60 * 1000).toISOString()),
              terminal: 'B'
            },
            duration: 480 + Math.random() * 240,
            distance: 2000 + Math.random() * 8000
          }
        ]
      }));

      setDiscoveryFlights(flights);
    } catch (err) {
      console.error('Discovery error:', err);
      setError('Failed to load discovery flights. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [state.profile]);

  useEffect(() => {
    loadDiscoveryFlights();
  }, [loadDiscoveryFlights]);

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
        'current_user',
        {
          origin: flight.segments[0].departure.airport.code,
          destination: flight.segments[flight.segments.length - 1].arrival.airport.code,
          departureDate: flight.segments[0].departure.time,
          passengers: 1,
          cabin: flight.cabin
        },
        {
          alertThreshold: 10,
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
      const result = await bookingHandoffService.initiateBookingHandoff(bookingData);
      
      if (result.success) {
        Alert.alert(
          'Booking Initiated',
          'You\'re being redirected to complete your booking with the airline.',
          [{ text: 'OK' }]
        );
        
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
    console.log('Current discovery flight index:', index);
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
            <Text style={styles.loadingText}>Discovering amazing deals for you</Text>
            <Text style={styles.loadingSubtext}>Curated travel experiences</Text>
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
            <Text style={styles.errorTitle}>Discovery Failed</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadDiscoveryFlights}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  }

  if (!discoveryFlights || discoveryFlights.length === 0) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={styles.noResultsScreen}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButtonError}>
            <IconSymbol name="chevron.left" size={24} color={DesignSystem.colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.noResultsContent}>
            <IconSymbol name="safari" size={64} color={DesignSystem.colors.inactive} />
            <Text style={styles.noResultsTitle}>No Deals Found</Text>
            <Text style={styles.noResultsText}>
              We couldn't find any discovery deals right now. Check back later!
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
              <Text style={styles.retryButtonText}>Back to Search</Text>
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* TikTok-style Discovery Flight Cards */}
      <FlightCardCarousel
        flights={discoveryFlights}
        onFlightBook={handleFlightBook}
        onFlightDetails={handleFlightDetails}
        onIndexChange={handleIndexChange}
        initialIndex={0}
      />

      {/* Back button overlay */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backButtonOverlay}>
        <IconSymbol name="chevron.left" size={24} color="white" />
      </TouchableOpacity>

      {/* Discovery info overlay */}
      <View style={styles.discoveryInfoOverlay}>
        <Text style={styles.discoveryInfoText}>
          ✨ Discovery Feed
        </Text>
        <Text style={styles.discoveryInfoSubtext}>
          {discoveryFlights.length} curated deals
        </Text>
      </View>

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
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
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

  // Main Screen Overlays
  backButtonOverlay: {
    position: 'absolute',
    top: 60,
    left: 20,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    zIndex: 100,
  },
  discoveryInfoOverlay: {
    position: 'absolute',
    top: 60,
    right: 20,
    alignItems: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    zIndex: 100,
  },
  discoveryInfoText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  discoveryInfoSubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});