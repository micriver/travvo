import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { DesignSystem } from '@/constants/DesignSystem';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { MAJOR_AIRPORTS } from '@/services/mockData/airports';
import { useOnboarding, useOnboardingActions } from '@/contexts/OnboardingContext';

export default function HomeAirportScreen() {
  const { state } = useOnboarding();
  const { setHomeAirport } = useOnboardingActions();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAirport, setSelectedAirport] = useState<string | null>(state.data.homeAirport || null);

  const filteredAirports = MAJOR_AIRPORTS.filter(airport => 
    airport.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    airport.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    airport.city.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 8); // Limit results

  const handleNext = () => {
    if (selectedAirport) {
      setHomeAirport(selectedAirport);
      router.push('/onboarding/travel-style');
    }
  };

  const handleSelectAirport = (airportCode: string) => {
    setSelectedAirport(airportCode);
  };

  return (
    <View style={styles.container}>
      <OnboardingHeader
        currentStep={1}
        totalSteps={5}
        title="What's your home airport?"
        subtitle="We'll use this to find the best flights for you."
      />

      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <IconSymbol name="magnifyingglass" size={20} color={DesignSystem.colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search airports..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={DesignSystem.colors.textSecondary}
          />
        </View>

        <ScrollView style={styles.airportList} showsVerticalScrollIndicator={false}>
          {filteredAirports.map((airport) => (
            <TouchableOpacity
              key={airport.code}
              style={[
                styles.airportItem,
                selectedAirport === airport.code && styles.airportItemSelected
              ]}
              onPress={() => handleSelectAirport(airport.code)}
              activeOpacity={0.7}
            >
              <View style={styles.airportInfo}>
                <Text style={styles.airportCode}>{airport.code}</Text>
                <View style={styles.airportDetails}>
                  <Text style={styles.airportName}>{airport.name}</Text>
                  <Text style={styles.airportCity}>{airport.city}, {airport.country}</Text>
                </View>
              </View>
              
              {selectedAirport === airport.code && (
                <IconSymbol 
                  name="checkmark.circle.fill" 
                  size={24} 
                  color={DesignSystem.colors.primary} 
                />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            !selectedAirport && styles.nextButtonDisabled
          ]}
          onPress={handleNext}
          disabled={!selectedAirport}
          activeOpacity={0.8}
        >
          <Text style={[
            styles.nextButtonText,
            !selectedAirport && styles.nextButtonTextDisabled
          ]}>
            Continue
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: DesignSystem.spacing.xl,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DesignSystem.colors.card,
    borderRadius: DesignSystem.borderRadius.medium,
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingVertical: DesignSystem.spacing.md,
    borderWidth: 1,
    borderColor: DesignSystem.colors.inputBorder,
    gap: DesignSystem.spacing.sm,
    marginBottom: DesignSystem.spacing.lg,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: DesignSystem.colors.textPrimary,
  },
  airportList: {
    flex: 1,
  },
  airportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: DesignSystem.spacing.lg,
    paddingHorizontal: DesignSystem.spacing.lg,
    backgroundColor: DesignSystem.colors.card,
    borderRadius: DesignSystem.borderRadius.medium,
    marginBottom: DesignSystem.spacing.sm,
    borderWidth: 1,
    borderColor: DesignSystem.colors.inputBorder,
  },
  airportItemSelected: {
    borderColor: DesignSystem.colors.primary,
    backgroundColor: DesignSystem.colors.primaryBackground,
  },
  airportInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: DesignSystem.spacing.md,
  },
  airportCode: {
    fontSize: 18,
    fontWeight: '600',
    color: DesignSystem.colors.textPrimary,
    minWidth: 45,
  },
  airportDetails: {
    flex: 1,
  },
  airportName: {
    fontSize: 16,
    color: DesignSystem.colors.textPrimary,
    fontWeight: '500',
    marginBottom: 2,
  },
  airportCity: {
    fontSize: 14,
    color: DesignSystem.colors.textSecondary,
  },
  footer: {
    paddingHorizontal: DesignSystem.spacing.xl,
    paddingBottom: 60,
    paddingTop: DesignSystem.spacing.lg,
  },
  nextButton: {
    backgroundColor: DesignSystem.colors.primary,
    paddingVertical: DesignSystem.spacing.lg,
    borderRadius: DesignSystem.borderRadius.medium,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: DesignSystem.colors.inactive,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  nextButtonTextDisabled: {
    color: DesignSystem.colors.textSecondary,
  },
});