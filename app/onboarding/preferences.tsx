import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { DesignSystem } from '@/constants/DesignSystem';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { OptionCard } from '@/components/onboarding/OptionCard';
import { useOnboarding, useOnboardingActions } from '@/contexts/OnboardingContext';

const seatPreferenceOptions = [
  { id: 'window', title: 'Window seat', description: 'Great views and wall to lean on', icon: 'rectangle.portrait' },
  { id: 'aisle', title: 'Aisle seat', description: 'Easy bathroom access and legroom', icon: 'rectangle.portrait.lefthalf.filled' },
  { id: 'middle', title: 'Middle seat', description: 'Often cheapest option', icon: 'rectangle.portrait.center.filled' },
];

const timePreferenceOptions = [
  { id: 'anytime', title: 'No preference', description: 'Any time of day', icon: 'clock' },
  { id: 'early', title: 'Early morning', description: '6:00 AM - 10:00 AM', icon: 'sunrise' },
  { id: 'midday', title: 'Midday', description: '10:00 AM - 4:00 PM', icon: 'sun.max' },
  { id: 'evening', title: 'Evening', description: '4:00 PM - 10:00 PM', icon: 'sunset' },
  { id: 'late', title: 'Late night', description: 'After 10:00 PM', icon: 'moon' },
];

export default function PreferencesScreen() {
  const { state } = useOnboarding();
  const { setPreferences } = useOnboardingActions();
  
  const [maxStops, setMaxStops] = useState(state.data.preferences?.maxStops || 1);
  const [seatPreferences, setSeatPreferences] = useState({
    window: state.data.preferences?.seatPreferences?.window || false,
    aisle: state.data.preferences?.seatPreferences?.aisle || true,
    middle: state.data.preferences?.seatPreferences?.middle || false,
    front: state.data.preferences?.seatPreferences?.front || false,
    emergency_exit: state.data.preferences?.seatPreferences?.emergency_exit || false,
  });
  const [timePreference, setTimePreference] = useState('anytime');

  const handleNext = () => {
    const timeRanges = {
      anytime: { earliest: '00:00', latest: '23:59' },
      early: { earliest: '06:00', latest: '10:00' },
      midday: { earliest: '10:00', latest: '16:00' },
      evening: { earliest: '16:00', latest: '22:00' },
      late: { earliest: '22:00', latest: '06:00' },
    };

    setPreferences({
      preferredAirlines: [],
      avoidedAirlines: [],
      maxStops,
      preferredDepartureTime: timeRanges[timePreference as keyof typeof timeRanges],
      seatPreferences,
    });
    router.push('/onboarding/budget');
  };

  const toggleSeatPreference = (seat: keyof typeof seatPreferences) => {
    setSeatPreferences(prev => ({ ...prev, [seat]: !prev[seat] }));
  };

  return (
    <View style={styles.container}>
      <OnboardingHeader
        currentStep={3}
        totalSteps={5}
        title="Your flight preferences"
        subtitle="Help us find flights that match what you like."
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Maximum stops</Text>
          <View style={styles.stopsContainer}>
            {[0, 1, 2].map((stops) => (
              <TouchableOpacity
                key={stops}
                style={[
                  styles.stopOption,
                  maxStops === stops && styles.stopOptionSelected
                ]}
                onPress={() => setMaxStops(stops)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.stopOptionText,
                  maxStops === stops && styles.stopOptionTextSelected
                ]}>
                  {stops === 0 ? 'Nonstop' : `${stops} stop${stops > 1 ? 's' : ''}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferred departure time</Text>
          <View style={styles.optionsGrid}>
            {timePreferenceOptions.map((option) => (
              <OptionCard
                key={option.id}
                title={option.title}
                description={option.description}
                icon={option.icon}
                isSelected={timePreference === option.id}
                onPress={() => setTimePreference(option.id)}
                layout="card"
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Seat preferences</Text>
          <View style={styles.switchContainer}>
            <View style={styles.switchRow}>
              <View style={styles.switchContent}>
                <IconSymbol name="rectangle.portrait" size={20} color={DesignSystem.colors.textSecondary} />
                <View style={styles.switchText}>
                  <Text style={styles.switchTitle}>Window seat</Text>
                  <Text style={styles.switchDescription}>Great views and wall to lean on</Text>
                </View>
              </View>
              <Switch
                value={seatPreferences.window}
                onValueChange={() => toggleSeatPreference('window')}
                trackColor={{ false: DesignSystem.colors.inactive, true: DesignSystem.colors.primary }}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchContent}>
                <IconSymbol name="rectangle.portrait.lefthalf.filled" size={20} color={DesignSystem.colors.textSecondary} />
                <View style={styles.switchText}>
                  <Text style={styles.switchTitle}>Aisle seat</Text>
                  <Text style={styles.switchDescription}>Easy bathroom access and legroom</Text>
                </View>
              </View>
              <Switch
                value={seatPreferences.aisle}
                onValueChange={() => toggleSeatPreference('aisle')}
                trackColor={{ false: DesignSystem.colors.inactive, true: DesignSystem.colors.primary }}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchContent}>
                <IconSymbol name="figure.seated.side" size={20} color={DesignSystem.colors.textSecondary} />
                <View style={styles.switchText}>
                  <Text style={styles.switchTitle}>Front of plane</Text>
                  <Text style={styles.switchDescription}>Earlier boarding and deplaning</Text>
                </View>
              </View>
              <Switch
                value={seatPreferences.front}
                onValueChange={() => toggleSeatPreference('front')}
                trackColor={{ false: DesignSystem.colors.inactive, true: DesignSystem.colors.primary }}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchContent}>
                <IconSymbol name="figure.walk" size={20} color={DesignSystem.colors.textSecondary} />
                <View style={styles.switchText}>
                  <Text style={styles.switchTitle}>Emergency exit row</Text>
                  <Text style={styles.switchDescription}>Extra legroom (restrictions apply)</Text>
                </View>
              </View>
              <Switch
                value={seatPreferences.emergency_exit}
                onValueChange={() => toggleSeatPreference('emergency_exit')}
                trackColor={{ false: DesignSystem.colors.inactive, true: DesignSystem.colors.primary }}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>Continue</Text>
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
  section: {
    marginBottom: DesignSystem.spacing.xl * 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: DesignSystem.colors.textPrimary,
    marginBottom: DesignSystem.spacing.lg,
  },
  stopsContainer: {
    flexDirection: 'row',
    gap: DesignSystem.spacing.sm,
  },
  stopOption: {
    flex: 1,
    backgroundColor: DesignSystem.colors.card,
    borderRadius: DesignSystem.borderRadius.medium,
    paddingVertical: DesignSystem.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DesignSystem.colors.inputBorder,
  },
  stopOptionSelected: {
    borderColor: DesignSystem.colors.primary,
    backgroundColor: DesignSystem.colors.primaryBackground,
  },
  stopOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: DesignSystem.colors.textPrimary,
  },
  stopOptionTextSelected: {
    color: DesignSystem.colors.primary,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignSystem.spacing.md,
  },
  switchContainer: {
    gap: DesignSystem.spacing.sm,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: DesignSystem.colors.card,
    borderRadius: DesignSystem.borderRadius.medium,
    padding: DesignSystem.spacing.lg,
    borderWidth: 1,
    borderColor: DesignSystem.colors.inputBorder,
  },
  switchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: DesignSystem.spacing.md,
  },
  switchText: {
    flex: 1,
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: DesignSystem.colors.textPrimary,
    marginBottom: 2,
  },
  switchDescription: {
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
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});