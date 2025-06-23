import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { DesignSystem } from '@/constants/DesignSystem';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface OnboardingHeaderProps {
  currentStep: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showSkip?: boolean;
}

export function OnboardingHeader({ 
  currentStep, 
  totalSteps, 
  title, 
  subtitle,
  onBack,
  showSkip = true 
}: OnboardingHeaderProps) {
  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <IconSymbol name="chevron.left" size={24} color={DesignSystem.colors.textSecondary} />
        </TouchableOpacity>

        {showSkip && (
          <TouchableOpacity 
            style={styles.skipButton} 
            onPress={handleSkip}
            activeOpacity={0.7}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${(currentStep / totalSteps) * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>{currentStep} of {totalSteps}</Text>
      </View>

      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 60,
    paddingHorizontal: DesignSystem.spacing.xl,
    paddingBottom: DesignSystem.spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.lg,
  },
  backButton: {
    padding: DesignSystem.spacing.sm,
  },
  skipButton: {
    padding: DesignSystem.spacing.sm,
  },
  skipText: {
    fontSize: 16,
    color: DesignSystem.colors.textSecondary,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.xl,
  },
  progressBar: {
    flex: 1,
    height: 3,
    backgroundColor: DesignSystem.colors.inputBorder,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: DesignSystem.colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: DesignSystem.colors.textSecondary,
    minWidth: 60,
  },
  title: {
    fontSize: DesignSystem.fontSizes.title,
    fontWeight: 'bold',
    color: DesignSystem.colors.textPrimary,
    lineHeight: 36,
    letterSpacing: -0.5,
    marginBottom: DesignSystem.spacing.sm,
  },
  subtitle: {
    fontSize: DesignSystem.fontSizes.body,
    color: DesignSystem.colors.textSecondary,
    lineHeight: 24,
  },
});