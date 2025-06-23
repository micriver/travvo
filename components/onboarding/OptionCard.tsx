import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DesignSystem } from '@/constants/DesignSystem';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface OptionCardProps {
  title: string;
  description: string;
  icon: string;
  isSelected: boolean;
  onPress: () => void;
  layout?: 'card' | 'list';
}

export function OptionCard({
  title,
  description,
  icon,
  isSelected,
  onPress,
  layout = 'card'
}: OptionCardProps) {
  if (layout === 'list') {
    return (
      <TouchableOpacity
        style={[styles.listOption, isSelected && styles.listOptionSelected]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.listOptionContent}>
          <IconSymbol
            name={icon as any}
            size={20}
            color={isSelected ? DesignSystem.colors.primary : DesignSystem.colors.textSecondary}
          />
          <View style={styles.listOptionText}>
            <Text style={[styles.listOptionTitle, isSelected && styles.listOptionTitleSelected]}>
              {title}
            </Text>
            <Text style={styles.listOptionDescription}>{description}</Text>
          </View>
        </View>

        {isSelected && (
          <IconSymbol
            name="checkmark.circle.fill"
            size={20}
            color={DesignSystem.colors.primary}
          />
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.cardOption, isSelected && styles.cardOptionSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <IconSymbol
        name={icon as any}
        size={24}
        color={isSelected ? DesignSystem.colors.primary : DesignSystem.colors.textSecondary}
      />
      <Text style={[styles.cardOptionTitle, isSelected && styles.cardOptionTitleSelected]}>
        {title}
      </Text>
      <Text style={styles.cardOptionDescription}>{description}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Card layout styles
  cardOption: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: DesignSystem.colors.card,
    borderRadius: DesignSystem.borderRadius.medium,
    padding: DesignSystem.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DesignSystem.colors.inputBorder,
  },
  cardOptionSelected: {
    borderColor: DesignSystem.colors.primary,
    backgroundColor: DesignSystem.colors.primaryBackground,
  },
  cardOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: DesignSystem.colors.textPrimary,
    marginTop: DesignSystem.spacing.sm,
    textAlign: 'center',
  },
  cardOptionTitleSelected: {
    color: DesignSystem.colors.primary,
  },
  cardOptionDescription: {
    fontSize: 14,
    color: DesignSystem.colors.textSecondary,
    textAlign: 'center',
    marginTop: DesignSystem.spacing.xs,
  },

  // List layout styles
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
});