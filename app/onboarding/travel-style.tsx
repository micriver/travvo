import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { DesignSystem } from '@/constants/DesignSystem';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { useOnboarding, useOnboardingActions } from '@/contexts/OnboardingContext';

type CabinClass = 'economy' | 'premium_economy' | 'business' | 'first';
type Flexibility = 'rigid' | 'somewhat_flexible' | 'very_flexible';

interface TravelStyleOption {
  id: string;
  title: string;
  description: string;
  icon: string;
}

const cabinOptions: Array<TravelStyleOption & { value: CabinClass }> = [
  {
    id: 'economy',
    value: 'economy',
    title: 'Economy',
    description: 'Best value for money',
    icon: 'seat.fill',
  },
  {
    id: 'premium',
    value: 'premium_economy',
    title: 'Premium Economy',
    description: 'Extra comfort and space',
    icon: 'plus.square.fill',
  },
  {
    id: 'business',
    value: 'business',
    title: 'Business',
    description: 'Luxury and productivity',
    icon: 'briefcase.fill',
  },
  {
    id: 'first',
    value: 'first',
    title: 'First Class',
    description: 'Ultimate luxury experience',
    icon: 'crown.fill',
  },
];

const flexibilityOptions: Array<TravelStyleOption & { value: Flexibility }> = [
  {
    id: 'rigid',
    value: 'rigid',
    title: 'Fixed dates',
    description: 'I need specific dates',
    icon: 'calendar',
  },
  {
    id: 'somewhat',
    value: 'somewhat_flexible',
    title: 'Somewhat flexible',
    description: 'Can adjust by a few days',
    icon: 'calendar.badge.plus',
  },
  {
    id: 'very',
    value: 'very_flexible',
    title: 'Very flexible',
    description: 'Open to different dates',
    icon: 'calendar.badge.clock',
  },
];

export default function TravelStyleScreen() {
  const { state } = useOnboarding();
  const { setTravelStyle } = useOnboardingActions();
  
  const [selectedCabin, setSelectedCabin] = useState<CabinClass>(
    state.data.travelStyle?.preferredCabin || 'economy'
  );
  const [selectedFlexibility, setSelectedFlexibility] = useState<Flexibility>(
    state.data.travelStyle?.flexibility || 'somewhat_flexible'
  );
  const [budgetRange, setBudgetRange] = useState({
    min: state.data.travelStyle?.budgetRange?.min || 200,
    max: state.data.travelStyle?.budgetRange?.max || 800,
    currency: 'USD',
  });

  const handleNext = () => {
    setTravelStyle({
      preferredCabin: selectedCabin,
      flexibility: selectedFlexibility,
      budgetRange,
    });
    router.push('/onboarding/preferences');
  };

  return (
    <View style={styles.container}>
      <OnboardingHeader
        currentStep={2}
        totalSteps={5}
        title="What's your travel style?"
        subtitle="This helps us find flights that match your preferences."
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferred cabin class</Text>
          <View style={styles.optionsGrid}>
            {cabinOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  selectedCabin === option.value && styles.optionCardSelected
                ]}
                onPress={() => setSelectedCabin(option.value)}
                activeOpacity={0.7}
              >
                <IconSymbol 
                  name={option.icon as any} 
                  size={24} 
                  color={selectedCabin === option.value ? DesignSystem.colors.primary : DesignSystem.colors.textSecondary} 
                />
                <Text style={[
                  styles.optionTitle,
                  selectedCabin === option.value && styles.optionTitleSelected
                ]}>
                  {option.title}
                </Text>
                <Text style={styles.optionDescription}>
                  {option.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date flexibility</Text>
          <View style={styles.optionsList}>
            {flexibilityOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.listOption,
                  selectedFlexibility === option.value && styles.listOptionSelected
                ]}
                onPress={() => setSelectedFlexibility(option.value)}
                activeOpacity={0.7}
              >
                <View style={styles.listOptionContent}>
                  <IconSymbol 
                    name={option.icon as any} 
                    size={20} 
                    color={selectedFlexibility === option.value ? DesignSystem.colors.primary : DesignSystem.colors.textSecondary} 
                  />
                  <View style={styles.listOptionText}>
                    <Text style={[
                      styles.listOptionTitle,
                      selectedFlexibility === option.value && styles.listOptionTitleSelected
                    ]}>
                      {option.title}
                    </Text>
                    <Text style={styles.listOptionDescription}>
                      {option.description}
                    </Text>
                  </View>
                </View>
                
                {selectedFlexibility === option.value && (
                  <IconSymbol 
                    name="checkmark.circle.fill" 
                    size={20} 
                    color={DesignSystem.colors.primary} 
                  />
                )}
              </TouchableOpacity>
            ))}
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
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignSystem.spacing.md,
  },
  optionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: DesignSystem.colors.card,
    borderRadius: DesignSystem.borderRadius.medium,
    padding: DesignSystem.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DesignSystem.colors.inputBorder,
  },
  optionCardSelected: {
    borderColor: DesignSystem.colors.primary,
    backgroundColor: DesignSystem.colors.primaryBackground,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: DesignSystem.colors.textPrimary,
    marginTop: DesignSystem.spacing.sm,
    textAlign: 'center',
  },
  optionTitleSelected: {
    color: DesignSystem.colors.primary,
  },
  optionDescription: {
    fontSize: 14,
    color: DesignSystem.colors.textSecondary,
    textAlign: 'center',
    marginTop: DesignSystem.spacing.xs,
  },
  optionsList: {
    gap: DesignSystem.spacing.sm,
  },
  listOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: DesignSystem.colors.card,
    borderRadius: DesignSystem.borderRadius.medium,
    padding: DesignSystem.spacing.lg,
    borderWidth: 1,
    borderColor: DesignSystem.colors.inputBorder,
  },
  listOptionSelected: {
    borderColor: DesignSystem.colors.primary,
    backgroundColor: DesignSystem.colors.primaryBackground,
  },
  listOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: DesignSystem.spacing.md,
  },
  listOptionText: {
    flex: 1,
  },
  listOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: DesignSystem.colors.textPrimary,
    marginBottom: 2,
  },
  listOptionTitleSelected: {
    color: DesignSystem.colors.primary,
  },
  listOptionDescription: {
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