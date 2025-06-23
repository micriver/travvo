import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { DesignSystem } from '@/constants/DesignSystem';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useOnboarding, useOnboardingActions } from '@/contexts/OnboardingContext';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { MAJOR_AIRPORTS } from '@/services/mockData/airports';

export default function CompletionScreen() {
  const { state } = useOnboarding();
  const { completeOnboarding } = useOnboardingActions();
  const { createProfile, completeOnboarding: completeUserOnboarding } = useUserPreferences();

  const homeAirport = MAJOR_AIRPORTS.find(airport => airport.code === state.data.homeAirport);
  
  const handleFinish = async () => {
    try {
      // Save all onboarding data to user preferences
      if (state.data.homeAirport && state.data.travelStyle && state.data.preferences && state.data.aiSettings) {
        const profileData = {
          travelPreferences: {
            homeAirport: state.data.homeAirport,
            preferredAirlines: state.data.preferences.preferredAirlines,
            avoidedAirlines: state.data.preferences.avoidedAirlines,
            preferredCabin: state.data.travelStyle.preferredCabin,
            maxStops: state.data.preferences.maxStops,
            preferredDepartureTime: state.data.preferences.preferredDepartureTime,
            seatPreferences: state.data.preferences.seatPreferences,
            flexibility: state.data.travelStyle.flexibility,
            budgetRange: state.data.travelStyle.budgetRange,
            advanceBookingPreference: 14, // Default 2 weeks
            importantAmenities: [],
            mealPreferences: [],
            usualTravelGroup: { adults: 1, children: 0, infants: 0 },
            baggagePreferences: {
              alwaysCarryOn: false,
              usuallyCheckBags: false,
              packLight: true,
            },
          },
          aiSettings: state.data.aiSettings,
          notificationPreferences: state.data.notificationSettings || {
            push: { enabled: true, flightUpdates: true, priceAlerts: true, dealNotifications: true, bookingReminders: true },
            email: { enabled: false, weeklyDeals: false, priceDropAlerts: false, travelTips: false, bookingConfirmations: true },
            sms: { enabled: false, flightUpdates: false, emergencyAlerts: false },
            frequency: 'immediate' as const,
          },
          frequentFlyerNumbers: [],
          travelDocuments: {},
          analytics: {
            totalSearches: 0,
            totalBookings: 0,
            averageBookingValue: 0,
            lastActiveDate: new Date(),
            preferredInteractionMode: 'text' as const,
            mostSearchedRoutes: [],
          },
        };

        await createProfile(profileData);
        await completeUserOnboarding();
      }

      completeOnboarding();
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      // Still proceed to main app even if saving fails
      completeOnboarding();
      router.replace('/(tabs)');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.celebration}>
          <IconSymbol 
            name="checkmark.circle.fill" 
            size={80} 
            color={DesignSystem.colors.success} 
          />
          <Text style={styles.title}>You're all set!</Text>
          <Text style={styles.subtitle}>
            Your travel profile has been created.{'\n'}
            Here's what we learned about you:
          </Text>
        </View>

        <ScrollView style={styles.summary} showsVerticalScrollIndicator={false}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Travel Profile</Text>
            
            <View style={styles.summarySection}>
              <View style={styles.summaryItem}>
                <IconSymbol name="airplane.departure" size={18} color={DesignSystem.colors.primary} />
                <Text style={styles.summaryLabel}>Home Airport</Text>
                <Text style={styles.summaryValue}>
                  {homeAirport ? `${homeAirport.code} - ${homeAirport.city}` : 'Not set'}
                </Text>
              </View>

              <View style={styles.summaryItem}>
                <IconSymbol name="seat.fill" size={18} color={DesignSystem.colors.primary} />
                <Text style={styles.summaryLabel}>Preferred Cabin</Text>
                <Text style={styles.summaryValue}>
                  {state.data.travelStyle?.preferredCabin?.replace('_', ' ') || 'Economy'}
                </Text>
              </View>

              <View style={styles.summaryItem}>
                <IconSymbol name="calendar.badge.clock" size={18} color={DesignSystem.colors.primary} />
                <Text style={styles.summaryLabel}>Flexibility</Text>
                <Text style={styles.summaryValue}>
                  {state.data.travelStyle?.flexibility?.replace('_', ' ') || 'Somewhat flexible'}
                </Text>
              </View>

              <View style={styles.summaryItem}>
                <IconSymbol name="dollarsign.circle" size={18} color={DesignSystem.colors.primary} />
                <Text style={styles.summaryLabel}>Budget Range</Text>
                <Text style={styles.summaryValue}>
                  ${state.data.travelStyle?.budgetRange?.min} - ${state.data.travelStyle?.budgetRange?.max}
                </Text>
              </View>

              <View style={styles.summaryItem}>
                <IconSymbol name="arrow.triangle.swap" size={18} color={DesignSystem.colors.primary} />
                <Text style={styles.summaryLabel}>Max Stops</Text>
                <Text style={styles.summaryValue}>
                  {state.data.preferences?.maxStops === 0 ? 'Nonstop only' : 
                   `Up to ${state.data.preferences?.maxStops} stop${state.data.preferences?.maxStops === 1 ? '' : 's'}`}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>AI Preferences</Text>
            
            <View style={styles.summarySection}>
              <View style={styles.featureList}>
                {state.data.aiSettings?.learningEnabled && (
                  <View style={styles.featureItem}>
                    <IconSymbol name="checkmark.circle.fill" size={16} color={DesignSystem.colors.success} />
                    <Text style={styles.featureText}>Learning from conversations</Text>
                  </View>
                )}
                {state.data.aiSettings?.voiceInteractionEnabled && (
                  <View style={styles.featureItem}>
                    <IconSymbol name="checkmark.circle.fill" size={16} color={DesignSystem.colors.success} />
                    <Text style={styles.featureText}>Voice interactions enabled</Text>
                  </View>
                )}
                {state.data.aiSettings?.proactiveNotifications && (
                  <View style={styles.featureItem}>
                    <IconSymbol name="checkmark.circle.fill" size={16} color={DesignSystem.colors.success} />
                    <Text style={styles.featureText}>Proactive suggestions</Text>
                  </View>
                )}
                {state.data.aiSettings?.personalizedDeals && (
                  <View style={styles.featureItem}>
                    <IconSymbol name="checkmark.circle.fill" size={16} color={DesignSystem.colors.success} />
                    <Text style={styles.featureText}>Personalized deals</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            You can always change these settings later in your profile.
          </Text>
          
          <TouchableOpacity
            style={styles.finishButton}
            onPress={handleFinish}
            activeOpacity={0.8}
          >
            <Text style={styles.finishButtonText}>Start exploring flights</Text>
          </TouchableOpacity>
        </View>
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
    paddingTop: 80,
  },
  celebration: {
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.xl * 2,
  },
  title: {
    fontSize: 32,
    fontWeight: '300',
    color: DesignSystem.colors.textPrimary,
    textAlign: 'center',
    marginTop: DesignSystem.spacing.lg,
    marginBottom: DesignSystem.spacing.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: DesignSystem.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  summary: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: DesignSystem.colors.card,
    borderRadius: DesignSystem.borderRadius.medium,
    padding: DesignSystem.spacing.lg,
    marginBottom: DesignSystem.spacing.lg,
    borderWidth: 1,
    borderColor: DesignSystem.colors.inputBorder,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DesignSystem.colors.textPrimary,
    marginBottom: DesignSystem.spacing.md,
  },
  summarySection: {
    gap: DesignSystem.spacing.sm,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSystem.spacing.sm,
    paddingVertical: DesignSystem.spacing.xs,
  },
  summaryLabel: {
    fontSize: 15,
    color: DesignSystem.colors.textSecondary,
    minWidth: 100,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: DesignSystem.colors.textPrimary,
    flex: 1,
  },
  featureList: {
    gap: DesignSystem.spacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSystem.spacing.sm,
  },
  featureText: {
    fontSize: 15,
    color: DesignSystem.colors.textPrimary,
  },
  footer: {
    paddingBottom: 60,
    paddingTop: DesignSystem.spacing.lg,
  },
  footerText: {
    fontSize: 14,
    color: DesignSystem.colors.textSecondary,
    textAlign: 'center',
    marginBottom: DesignSystem.spacing.lg,
  },
  finishButton: {
    backgroundColor: DesignSystem.colors.primary,
    paddingVertical: DesignSystem.spacing.lg,
    borderRadius: DesignSystem.borderRadius.medium,
    alignItems: 'center',
  },
  finishButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});