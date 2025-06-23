import { StyleSheet, TouchableOpacity, View, Text, Animated, TextInput, Alert } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { router } from 'expo-router';
import LottieView from 'lottie-react-native';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { DesignSystem } from '@/constants/DesignSystem';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { FlightSearchParams } from '@/types';
import { aiSearchService, DestinationSuggestion } from '@/services/ai/aiSearchService';

// Animated AI Dot Component
function AnimatedAIDot({ isListening }: { isListening: boolean }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isListening) {
      // Continuous pulsing animation when listening
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      
      // Scale up when listening
      const scaleAnimation = Animated.timing(scaleAnim, {
        toValue: 1.3,
        duration: 300,
        useNativeDriver: true,
      });

      Animated.parallel([pulseAnimation, scaleAnimation]).start();
    } else {
      // Return to normal state
      pulseAnim.stopAnimation();
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      Animated.timing(pulseAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isListening, scaleAnim, pulseAnim]);

  return (
    <View style={styles.aiDotContainer}>
      <Animated.View
        style={[
          styles.aiDot,
          {
            transform: [{ scale: scaleAnim }],
          },
          isListening && styles.aiDotActive,
        ]}
      />
      {isListening && (
        <Animated.View
          style={[
            styles.aiDotPulse,
            {
              opacity: pulseAnim,
              transform: [
                {
                  scale: pulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 2.5],
                  }),
                },
              ],
            },
          ]}
        />
      )}
    </View>
  );
}

export default function TravelScreen() {
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<DestinationSuggestion[]>([]);
  const [clarificationQuestion, setClarificationQuestion] = useState<string>('');
  const { state } = useUserPreferences();

  const handleVoicePress = () => {
    setIsListening(!isListening);
  };

  const handleSearchWithDefaultAirport = async (selectedDestination?: DestinationSuggestion) => {
    // Use PHX (Phoenix) as default for testing
    const defaultHomeAirport = 'PHX';
    
    setIsSearching(true);
    
    try {
      let destination: DestinationSuggestion;
      
      if (selectedDestination) {
        destination = selectedDestination;
      } else {
        // Use AI to parse the search query with default airport
        const travelIntent = await aiSearchService.parseSearchQuery(searchQuery, {
          homeAirport: defaultHomeAirport,
          preferences: {
            preferredCabin: 'economy',
            maxStops: 2,
            preferredAirlines: [],
            avoidedAirlines: [],
            flexibility: 'somewhat_flexible',
            budgetRange: { min: 200, max: 1000, currency: 'USD' },
            advanceBookingPreference: 14,
            preferredDepartureTime: { earliest: '06:00', latest: '22:00' },
            seatPreferences: { window: true, aisle: false, middle: false, front: false, emergency_exit: false },
            importantAmenities: [],
            mealPreferences: [],
            usualTravelGroup: { adults: 1, children: 0, infants: 0 },
            baggagePreferences: { alwaysCarryOn: false, usuallyCheckBags: false, packLight: true },
          },
        });

        if (travelIntent.clarificationNeeded && travelIntent.destinations.length > 1) {
          setSuggestions(travelIntent.destinations);
          setClarificationQuestion(travelIntent.clarificationQuestion || 'Which destination would you prefer?');
          setShowSuggestions(true);
          setIsSearching(false);
          return;
        }

        if (travelIntent.destinations.length === 0) {
          Alert.alert('Destination Not Found', 'I could not understand your destination. Please try being more specific.');
          setIsSearching(false);
          return;
        }

        destination = travelIntent.destinations[0];
      }

      const searchParams: FlightSearchParams = {
        origin: defaultHomeAirport,
        destination: destination.airportCode,
        departureDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        passengers: { adults: 1, children: 0, infants: 0 },
        cabin: 'economy',
        maxStops: 2,
        sortBy: 'price',
        sortOrder: 'asc',
      };

      setShowSuggestions(false);
      setSuggestions([]);
      setClarificationQuestion('');

      router.push({
        pathname: '/search-results',
        params: {
          searchParams: JSON.stringify(searchParams),
          searchQuery: selectedDestination ? `${destination.city}, ${destination.country}` : searchQuery,
        },
      });
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Search Error', 'Something went wrong. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async (selectedDestination?: DestinationSuggestion) => {
    console.log('🚀 handleSearch called with:', { searchQuery, selectedDestination: !!selectedDestination });
    
    if (!searchQuery.trim() && !selectedDestination) {
      Alert.alert('Search Required', 'Please enter a destination to search for flights.');
      return;
    }

    // More thorough checking for home airport
    console.log('State profile:', state.profile);
    console.log('Travel preferences:', state.profile?.travelPreferences);
    console.log('Home airport:', state.profile?.travelPreferences?.homeAirport);

    if (!state.profile || !state.profile.travelPreferences || !state.profile.travelPreferences.homeAirport) {
      Alert.alert('Home Airport Required', 'Please complete your onboarding to set your home airport first.', [
        { text: 'Go to Onboarding', onPress: () => router.push('/onboarding/splash') },
        { text: 'Use Default (Phoenix)', onPress: () => handleSearchWithDefaultAirport(selectedDestination) },
        { text: 'Cancel', style: 'cancel' }
      ]);
      return;
    }

    setIsSearching(true);
    
    try {
      let destination: DestinationSuggestion;
      
      if (selectedDestination && typeof selectedDestination === 'object' && selectedDestination.airportCode) {
        console.log('📍 Using selected destination:', selectedDestination);
        destination = selectedDestination;
      } else {
        // Use simple OpenAI search
        console.log('🔍 Starting OpenAI search for:', searchQuery);
        
        try {
          const { searchWithOpenAI } = await import('@/services/ai/simpleOpenAI');
          const aiResult = await searchWithOpenAI(searchQuery);
          destination = {
            city: aiResult.city,
            country: aiResult.country,
            airportCode: aiResult.airportCode,
            airportName: `${aiResult.city} Airport`,
            reason: 'AI suggestion',
            confidence: 0.9,
          };
          console.log('✅ OpenAI result:', destination);
        } catch (error) {
          console.log('❌ OpenAI failed, using default:', error);
          // Default to Paris for any query when OpenAI fails
          destination = {
            city: 'Paris',
            country: 'France',
            airportCode: 'CDG',
            airportName: 'Charles de Gaulle',
            reason: 'Default destination',
            confidence: 0.5,
          };
        }
      }

      const originAirport = state.profile.travelPreferences.homeAirport;
      const destinationAirport = destination.airportCode;
      
      console.log('Creating search params:', { origin: originAirport, destination: destinationAirport });
      
      if (!originAirport || !destinationAirport) {
        throw new Error(`Missing airport data: origin=${originAirport}, destination=${destinationAirport}`);
      }

      const searchParams: FlightSearchParams = {
        origin: originAirport,
        destination: destinationAirport,
        departureDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        passengers: {
          adults: 1,
          children: 0,
          infants: 0,
        },
        cabin: state.profile.travelPreferences.preferredCabin || 'economy',
        maxStops: state.profile.travelPreferences.maxStops || 2,
        sortBy: 'price',
        sortOrder: 'asc',
      };

      // Clear suggestions
      setShowSuggestions(false);
      setSuggestions([]);
      setClarificationQuestion('');

      // Navigate to search results with the search params
      router.push({
        pathname: '/search-results',
        params: {
          searchParams: JSON.stringify(searchParams),
          searchQuery: selectedDestination ? `${destination.city}, ${destination.country}` : searchQuery,
        },
      });
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Search Error', 'Something went wrong. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSuggestionSelect = (suggestion: DestinationSuggestion) => {
    handleSearch(suggestion);
  };

  const renderSuggestions = () => {
    if (!showSuggestions) return null;

    return (
      <View style={styles.suggestionsContainer}>
        {clarificationQuestion && (
          <Text style={styles.clarificationText}>{clarificationQuestion}</Text>
        )}
        {suggestions.map((suggestion, index) => (
          <TouchableOpacity
            key={index}
            style={styles.suggestionItem}
            onPress={() => handleSuggestionSelect(suggestion)}
            activeOpacity={0.8}
          >
            <View style={styles.suggestionHeader}>
              <Text style={styles.suggestionCity}>
                {suggestion.city}, {suggestion.country}
              </Text>
              <Text style={styles.suggestionAirport}>{suggestion.airportCode}</Text>
            </View>
            <Text style={styles.suggestionReason}>{suggestion.reason}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={styles.cancelSuggestionsButton}
          onPress={() => {
            setShowSuggestions(false);
            setSuggestions([]);
            setClarificationQuestion('');
          }}
        >
          <Text style={styles.cancelSuggestionsText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Main Interaction Area */}
      <View style={styles.interactionArea}>
        {isVoiceMode ? (
          <View style={styles.voiceInterface}>
            <TouchableOpacity 
              style={styles.voiceButton} 
              onPress={handleVoicePress}
              activeOpacity={0.8}
            >
              <AnimatedAIDot isListening={isListening} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.typeInterface}>
            <View style={styles.searchBox}>
              <IconSymbol name="magnifyingglass" size={20} color={DesignSystem.colors.inactive} />
              <TextInput
                style={styles.searchInput}
                placeholder="Where would you like to go?"
                placeholderTextColor={DesignSystem.colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
                autoCapitalize="words"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={handleSearch} disabled={isSearching}>
                  <IconSymbol 
                    name={isSearching ? "hourglass" : "arrow.right"} 
                    size={20} 
                    color={DesignSystem.colors.primary} 
                  />
                </TouchableOpacity>
              )}
            </View>
            {state.profile?.travelPreferences.homeAirport && (
              <Text style={styles.homeAirportText}>
                From {state.profile.travelPreferences.homeAirport}
              </Text>
            )}
          </View>
        )}
      </View>
      
      {/* AI Suggestions */}
      {renderSuggestions()}

      {/* Mode Switch Button - Fixed Position */}
      <TouchableOpacity 
        style={styles.modeSwitchButton} 
        onPress={() => setIsVoiceMode(!isVoiceMode)}
        activeOpacity={0.7}
      >
        {isVoiceMode ? (
          <IconSymbol name="keyboard" size={24} color={DesignSystem.colors.textSecondary} />
        ) : (
          <LottieView
            source={require('@/assets/animations/audio-wave.json')}
            style={styles.lottieAnimation}
            autoPlay={true}
            loop={true}
            speed={1}
          />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background,
    justifyContent: 'space-between',
    paddingHorizontal: DesignSystem.spacing.xl,
    paddingTop: 60,
    paddingBottom: 60,
  },
  interactionArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceInterface: {
    alignItems: 'center',
    gap: DesignSystem.spacing.xl,
    width: '100%',
  },
  typeInterface: {
    width: '100%',
    alignItems: 'center',
    gap: DesignSystem.spacing.xl,
  },
  mainQuestion: {
    fontSize: 28,
    fontWeight: '300',
    textAlign: 'center',
    color: DesignSystem.colors.textPrimary,
    lineHeight: 36,
    letterSpacing: -0.5,
    paddingHorizontal: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.lg,
  },
  voiceButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: DesignSystem.spacing.xl,
  },
  aiDotContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 120,
  },
  aiDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DesignSystem.colors.inactive,
    opacity: 0.8,
  },
  aiDotActive: {
    backgroundColor: DesignSystem.colors.primary,
    opacity: 1,
    shadowColor: DesignSystem.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  aiDotPulse: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DesignSystem.colors.primary,
    opacity: 0.3,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DesignSystem.colors.card,
    borderRadius: DesignSystem.borderRadius.medium + 4,
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingVertical: DesignSystem.spacing.md,
    width: '100%',
    gap: DesignSystem.spacing.sm,
    borderWidth: 1,
    borderColor: DesignSystem.colors.inputBorder,
    marginTop: DesignSystem.spacing.lg,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    color: DesignSystem.colors.textPrimary,
    paddingVertical: 0,
  },
  homeAirportText: {
    fontSize: 14,
    color: DesignSystem.colors.textSecondary,
    textAlign: 'center',
    marginTop: DesignSystem.spacing.sm,
  },
  modeSwitchButton: {
    position: 'absolute',
    bottom: DesignSystem.spacing.xl + 20,
    right: DesignSystem.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    padding: DesignSystem.spacing.md,
    backgroundColor: DesignSystem.colors.card,
    borderRadius: DesignSystem.borderRadius.medium,
    shadowColor: DesignSystem.shadow.color,
    shadowOffset: DesignSystem.shadow.offset,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  audioIcon: {
    width: 24,
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1.5,
  },
  waveformBar: {
    width: 2,
    backgroundColor: DesignSystem.colors.textSecondary,
    borderRadius: 1,
  },
  waveformBar1: {
    height: 6,
  },
  waveformBar2: {
    height: 10,
  },
  waveformBar3: {
    height: 14,
  },
  waveformBar4: {
    height: 18,
  },
  waveformBar5: {
    height: 20,
  },
  waveformBar6: {
    height: 18,
  },
  waveformBar7: {
    height: 14,
  },
  waveformBar8: {
    height: 10,
  },
  waveformBar9: {
    height: 6,
  },
  lottieAnimation: {
    width: 24,
    height: 24,
  },
  suggestionsContainer: {
    backgroundColor: DesignSystem.colors.card,
    borderRadius: DesignSystem.borderRadius.large,
    marginTop: DesignSystem.spacing.md,
    padding: DesignSystem.spacing.lg,
    shadowColor: DesignSystem.shadow.color,
    shadowOffset: DesignSystem.shadow.offset,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  clarificationText: {
    fontSize: 16,
    color: DesignSystem.colors.textPrimary,
    marginBottom: DesignSystem.spacing.md,
    textAlign: 'center',
  },
  suggestionItem: {
    paddingVertical: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borderRadius.medium,
    marginBottom: DesignSystem.spacing.sm,
    backgroundColor: DesignSystem.colors.background,
    borderWidth: 1,
    borderColor: DesignSystem.colors.inputBorder,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.xs,
  },
  suggestionCity: {
    fontSize: 16,
    fontWeight: '600',
    color: DesignSystem.colors.textPrimary,
  },
  suggestionAirport: {
    fontSize: 14,
    color: DesignSystem.colors.textSecondary,
    fontWeight: '500',
  },
  suggestionReason: {
    fontSize: 14,
    color: DesignSystem.colors.textSecondary,
    lineHeight: 18,
  },
  cancelSuggestionsButton: {
    alignSelf: 'center',
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingVertical: DesignSystem.spacing.sm,
    marginTop: DesignSystem.spacing.sm,
  },
  cancelSuggestionsText: {
    fontSize: 16,
    color: DesignSystem.colors.textSecondary,
    textAlign: 'center',
  },
});