import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { DesignSystem } from '@/constants/DesignSystem';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function WelcomeScreen() {
  const handleGetStarted = () => {
    router.push('/onboarding/home-airport');
  };

  const handleSkip = () => {
    // Skip onboarding, mark as completed and go to main app
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <IconSymbol 
          name="airplane" 
          size={64} 
          color={DesignSystem.colors.primary} 
          style={styles.icon}
        />
        
        <Text style={styles.title}>Welcome to Travvo</Text>
        
        <Text style={styles.subtitle}>
          Let's personalize your travel experience{'\n'}
          in just a few quick questions.
        </Text>
        
        <View style={styles.features}>
          <View style={styles.feature}>
            <IconSymbol name="checkmark.circle.fill" size={20} color={DesignSystem.colors.success} />
            <Text style={styles.featureText}>Find flights that match your style</Text>
          </View>
          <View style={styles.feature}>
            <IconSymbol name="checkmark.circle.fill" size={20} color={DesignSystem.colors.success} />
            <Text style={styles.featureText}>Get personalized recommendations</Text>
          </View>
          <View style={styles.feature}>
            <IconSymbol name="checkmark.circle.fill" size={20} color={DesignSystem.colors.success} />
            <Text style={styles.featureText}>Save time on every search</Text>
          </View>
        </View>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity 
          style={styles.primaryButton} 
          onPress={handleGetStarted}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.secondaryButton} 
          onPress={handleSkip}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryButtonText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background,
    justifyContent: 'space-between',
    paddingHorizontal: DesignSystem.spacing.xl,
    paddingTop: 80,
    paddingBottom: 60,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    marginBottom: DesignSystem.spacing.xl,
  },
  title: {
    fontSize: DesignSystem.fontSizes.title,
    fontWeight: 'bold',
    color: DesignSystem.colors.textPrimary,
    textAlign: 'center',
    marginBottom: DesignSystem.spacing.md,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: DesignSystem.fontSizes.subtitle,
    color: DesignSystem.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: DesignSystem.spacing.xl * 2,
  },
  features: {
    gap: DesignSystem.spacing.md,
    alignItems: 'flex-start',
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSystem.spacing.sm,
  },
  featureText: {
    fontSize: DesignSystem.fontSizes.body,
    color: DesignSystem.colors.textSecondary,
  },
  buttons: {
    gap: DesignSystem.spacing.md,
  },
  primaryButton: {
    backgroundColor: DesignSystem.colors.primary,
    paddingVertical: DesignSystem.spacing.lg,
    paddingHorizontal: DesignSystem.spacing.xl,
    borderRadius: DesignSystem.borderRadius.medium,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: DesignSystem.spacing.md,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: DesignSystem.colors.textSecondary,
    fontSize: 16,
  },
});