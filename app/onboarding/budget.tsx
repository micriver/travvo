import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { DesignSystem } from '@/constants/DesignSystem';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { useOnboarding, useOnboardingActions } from '@/contexts/OnboardingContext';

const budgetRanges = [
  { id: 'budget', min: 100, max: 300, label: 'Budget', description: 'Under $300', icon: 'dollarsign.circle' },
  { id: 'moderate', min: 300, max: 600, label: 'Moderate', description: '$300 - $600', icon: 'dollarsign.circle.fill' },
  { id: 'comfortable', min: 600, max: 1000, label: 'Comfortable', description: '$600 - $1,000', icon: 'banknote' },
  { id: 'premium', min: 1000, max: 2500, label: 'Premium', description: '$1,000 - $2,500', icon: 'banknote.fill' },
  { id: 'luxury', min: 2500, max: 10000, label: 'Luxury', description: '$2,500+', icon: 'crown.fill' },
];

const aiSettingsOptions = [
  {
    id: 'learningEnabled',
    title: 'Learn from conversations',
    description: 'AI improves recommendations based on your chats',
    icon: 'brain.head.profile',
    defaultValue: true,
  },
  {
    id: 'voiceInteractionEnabled',
    title: 'Voice interactions',
    description: 'Talk to AI instead of typing',
    icon: 'mic.circle',
    defaultValue: true,
  },
  {
    id: 'proactiveNotifications',
    title: 'Proactive suggestions',
    description: 'Get flight deals based on your profile',
    icon: 'bell.badge',
    defaultValue: true,
  },
  {
    id: 'personalizedDeals',
    title: 'Personalized deals',
    description: 'See deals tailored to your preferences',
    icon: 'tag.circle',
    defaultValue: true,
  },
];

export default function BudgetScreen() {
  const { state } = useOnboarding();
  const { setTravelStyle, setAISettings } = useOnboardingActions();
  
  const [selectedBudget, setSelectedBudget] = useState(
    budgetRanges.find(range => 
      range.min === state.data.travelStyle?.budgetRange?.min && 
      range.max === state.data.travelStyle?.budgetRange?.max
    )?.id || 'moderate'
  );

  const [aiSettings, setAISettingsLocal] = useState({
    learningEnabled: true,
    voiceInteractionEnabled: true,
    proactiveNotifications: true,
    locationTracking: false,
    conversationHistory: true,
    dataRetention: '1_year' as const,
    shareWithPartners: false,
    personalizedDeals: true,
    responseStyle: 'conversational' as const,
    suggestionFrequency: 'moderate' as const,
    dealAlerts: {
      enabled: true,
      priceDropThreshold: 20,
      destinationDeals: true,
      lastMinuteDeals: true,
    },
  });

  const handleNext = () => {
    const selectedBudgetRange = budgetRanges.find(range => range.id === selectedBudget);
    
    if (selectedBudgetRange) {
      // Update travel style with budget
      const currentTravelStyle = state.data.travelStyle || {
        preferredCabin: 'economy' as const,
        flexibility: 'somewhat_flexible' as const,
        budgetRange: { min: 300, max: 600, currency: 'USD' }
      };
      
      setTravelStyle({
        ...currentTravelStyle,
        budgetRange: {
          min: selectedBudgetRange.min,
          max: selectedBudgetRange.max,
          currency: 'USD'
        }
      });
    }

    // Save AI settings
    setAISettings(aiSettings);
    
    router.push('/onboarding/completion');
  };

  const toggleAISetting = (settingKey: keyof typeof aiSettings) => {
    setAISettingsLocal(prev => ({
      ...prev,
      [settingKey]: !prev[settingKey]
    }));
  };

  return (
    <View style={styles.container}>
      <OnboardingHeader
        currentStep={4}
        totalSteps={5}
        title="Budget & AI preferences"
        subtitle="Set your typical flight budget and AI settings."
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Typical flight budget</Text>
          <Text style={styles.sectionSubtitle}>
            This helps us show relevant options first. You can always see all flights.
          </Text>
          <View style={styles.budgetOptions}>
            {budgetRanges.map((budget) => (
              <TouchableOpacity
                key={budget.id}
                style={[
                  styles.budgetOption,
                  selectedBudget === budget.id && styles.budgetOptionSelected
                ]}
                onPress={() => setSelectedBudget(budget.id)}
                activeOpacity={0.7}
              >
                <View style={styles.budgetContent}>
                  <IconSymbol 
                    name={budget.icon as any} 
                    size={24} 
                    color={selectedBudget === budget.id ? DesignSystem.colors.primary : DesignSystem.colors.textSecondary} 
                  />
                  <View style={styles.budgetText}>
                    <Text style={[
                      styles.budgetLabel,
                      selectedBudget === budget.id && styles.budgetLabelSelected
                    ]}>
                      {budget.label}
                    </Text>
                    <Text style={styles.budgetDescription}>
                      {budget.description}
                    </Text>
                  </View>
                </View>
                
                {selectedBudget === budget.id && (
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI assistant preferences</Text>
          <Text style={styles.sectionSubtitle}>
            Control how the AI learns and interacts with you.
          </Text>
          <View style={styles.aiOptions}>
            {aiSettingsOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.aiOption,
                  aiSettings[option.id as keyof typeof aiSettings] && styles.aiOptionSelected
                ]}
                onPress={() => toggleAISetting(option.id as keyof typeof aiSettings)}
                activeOpacity={0.7}
              >
                <View style={styles.aiOptionContent}>
                  <IconSymbol 
                    name={option.icon as any} 
                    size={20} 
                    color={aiSettings[option.id as keyof typeof aiSettings] ? DesignSystem.colors.primary : DesignSystem.colors.textSecondary} 
                  />
                  <View style={styles.aiOptionText}>
                    <Text style={[
                      styles.aiOptionTitle,
                      aiSettings[option.id as keyof typeof aiSettings] && styles.aiOptionTitleSelected
                    ]}>
                      {option.title}
                    </Text>
                    <Text style={styles.aiOptionDescription}>
                      {option.description}
                    </Text>
                  </View>
                </View>
                
                <View style={[
                  styles.checkbox,
                  aiSettings[option.id as keyof typeof aiSettings] && styles.checkboxSelected
                ]}>
                  {aiSettings[option.id as keyof typeof aiSettings] && (
                    <IconSymbol 
                      name="checkmark" 
                      size={14} 
                      color="#FFFFFF" 
                    />
                  )}
                </View>
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
    marginBottom: DesignSystem.spacing.xs,
  },
  sectionSubtitle: {
    fontSize: 15,
    color: DesignSystem.colors.textSecondary,
    marginBottom: DesignSystem.spacing.lg,
    lineHeight: 22,
  },
  budgetOptions: {
    gap: DesignSystem.spacing.sm,
  },
  budgetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: DesignSystem.colors.card,
    borderRadius: DesignSystem.borderRadius.medium,
    padding: DesignSystem.spacing.lg,
    borderWidth: 1,
    borderColor: DesignSystem.colors.inputBorder,
  },
  budgetOptionSelected: {
    borderColor: DesignSystem.colors.primary,
    backgroundColor: DesignSystem.colors.primaryBackground,
  },
  budgetContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: DesignSystem.spacing.md,
  },
  budgetText: {
    flex: 1,
  },
  budgetLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: DesignSystem.colors.textPrimary,
    marginBottom: 2,
  },
  budgetLabelSelected: {
    color: DesignSystem.colors.primary,
  },
  budgetDescription: {
    fontSize: 14,
    color: DesignSystem.colors.textSecondary,
  },
  aiOptions: {
    gap: DesignSystem.spacing.sm,
  },
  aiOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: DesignSystem.colors.card,
    borderRadius: DesignSystem.borderRadius.medium,
    padding: DesignSystem.spacing.lg,
    borderWidth: 1,
    borderColor: DesignSystem.colors.inputBorder,
  },
  aiOptionSelected: {
    borderColor: DesignSystem.colors.primary,
    backgroundColor: DesignSystem.colors.primaryBackground,
  },
  aiOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: DesignSystem.spacing.md,
  },
  aiOptionText: {
    flex: 1,
  },
  aiOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: DesignSystem.colors.textPrimary,
    marginBottom: 2,
  },
  aiOptionTitleSelected: {
    color: DesignSystem.colors.primary,
  },
  aiOptionDescription: {
    fontSize: 14,
    color: DesignSystem.colors.textSecondary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: DesignSystem.colors.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: DesignSystem.colors.primary,
    borderColor: DesignSystem.colors.primary,
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