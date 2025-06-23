import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { DesignSystem } from '@/constants/DesignSystem';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function HowItWorksScreen() {
  const handleContinue = () => {
    router.push('/onboarding/welcome');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Say hello to{'\n'}
          intelligent travel{'\n'}
          planning
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.features}>
          <View style={styles.feature}>
            <View style={styles.iconContainer}>
              <IconSymbol name="bubble.left.and.bubble.right" size={24} color={DesignSystem.colors.primary} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Natural conversations</Text>
              <Text style={styles.featureDescription}>
                Speak naturally about your travel plans.{'\n'}
                "I need to get to NYC next Friday" works perfectly.
              </Text>
            </View>
          </View>

          <View style={styles.feature}>
            <View style={styles.iconContainer}>
              <IconSymbol name="keyboard.badge.ellipsis" size={24} color={DesignSystem.colors.primary} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Voice + text modes</Text>
              <Text style={styles.featureDescription}>
                Switch seamlessly between talking{'\n'}
                and typing whenever you prefer.
              </Text>
            </View>
          </View>

          <View style={styles.feature}>
            <View style={styles.iconContainer}>
              <IconSymbol name="brain.head.profile" size={24} color={DesignSystem.colors.primary} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Learns your preferences</Text>
              <Text style={styles.featureDescription}>
                Remembers your home airport, airlines,{'\n'}
                and travel style to save time.
              </Text>
            </View>
          </View>

          <View style={styles.feature}>
            <View style={styles.iconContainer}>
              <IconSymbol name="lock.shield" size={24} color={DesignSystem.colors.primary} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>You're in control</Text>
              <Text style={styles.featureDescription}>
                Conversations help improve recommendations.{'\n'}
                You can manage your data anytime.
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            AI suggestions may need verification — always{'\n'}
            check important details before booking.
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.continueButton} 
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
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
  header: {
    paddingHorizontal: DesignSystem.spacing.xl,
    paddingTop: 80,
    paddingBottom: DesignSystem.spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: DesignSystem.colors.textPrimary,
    textAlign: 'center',
    lineHeight: 30,
    letterSpacing: -0.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: DesignSystem.spacing.xl,
  },
  features: {
    gap: DesignSystem.spacing.lg,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSystem.spacing.lg,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: DesignSystem.colors.primaryBackground,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DesignSystem.colors.textPrimary,
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 15,
    color: DesignSystem.colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: DesignSystem.spacing.xl,
    paddingBottom: 60,
    paddingTop: DesignSystem.spacing.lg,
  },
  disclaimer: {
    backgroundColor: DesignSystem.colors.card,
    borderRadius: DesignSystem.borderRadius.medium,
    padding: DesignSystem.spacing.lg,
    borderWidth: 1,
    borderColor: DesignSystem.colors.inputBorder,
    marginBottom: DesignSystem.spacing.lg,
  },
  disclaimerText: {
    fontSize: 14,
    color: DesignSystem.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  continueButton: {
    backgroundColor: DesignSystem.colors.primary,
    paddingVertical: DesignSystem.spacing.lg,
    borderRadius: DesignSystem.borderRadius.medium,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});