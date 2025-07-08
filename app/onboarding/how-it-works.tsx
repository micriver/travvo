import { IconSymbol } from "@/components/ui/IconSymbol";
import { DesignSystem } from "@/constants/DesignSystem";
import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const ICON_SIZE = 30;
const ICON_CONTAINER_SIZE = 54;

export default function HowItWorksScreen() {
  const handleContinue = () => {
    router.push("/onboarding/welcome");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Your own personal{"\n"}
          travel agent
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.features}>
          <View style={styles.feature}>
            <View style={styles.iconContainer}>
              <IconSymbol
                name='bubble.left.and.bubble.right'
                size={ICON_SIZE}
                color={DesignSystem.colors.primary}
              />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Find flights naturally</Text>
              <Text style={styles.featureDescription}>
                Say where and when -{"\n"}
                get the best flight options instantly
              </Text>
            </View>
          </View>

          <View style={styles.feature}>
            <View style={styles.iconContainer}>
              <IconSymbol
                name='keyboard.badge.ellipsis'
                size={ICON_SIZE}
                color={DesignSystem.colors.primary}
              />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Your instant travel agent</Text>
              <Text style={styles.featureDescription}>
                Like calling a travel agent,{"\n"}
                but available 24/7 instantly
              </Text>
            </View>
          </View>

          <View style={styles.feature}>
            <View style={styles.iconContainer}>
              <IconSymbol
                name='brain.head.profile'
                size={ICON_SIZE}
                color={DesignSystem.colors.primary}
              />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Knows your preferences</Text>
              <Text style={styles.featureDescription}>
                Remembers your favorite airlines{"\n"}
                and preferred seating choices
              </Text>
            </View>
          </View>

          <View style={styles.feature}>
            <View style={styles.iconContainer}>
              <IconSymbol
                name='magnifyingglass.circle'
                size={ICON_SIZE}
                color={DesignSystem.colors.primary}
              />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Always hunting deals</Text>
              <Text style={styles.featureDescription}>
                Watches prices 24/7 and alerts{"\n"}
                you to the best deals
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            AI may need verification — check details before booking
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
    paddingTop: 110,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: DesignSystem.colors.textPrimary,
    textAlign: "center",
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: DesignSystem.spacing.xl,
    justifyContent: "center",
    marginTop: -40,
  },
  features: {
    gap: DesignSystem.spacing.md + 4,
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.lg,
  },
  iconContainer: {
    width: ICON_CONTAINER_SIZE,
    height: ICON_CONTAINER_SIZE,
    borderRadius: ICON_CONTAINER_SIZE / 2,
    backgroundColor: DesignSystem.colors.primaryBackground,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: "600",
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
    paddingBottom: 40,
    paddingTop: 0,
  },
  disclaimer: {
    backgroundColor: DesignSystem.colors.card,
    borderRadius: DesignSystem.borderRadius.medium,
    padding: DesignSystem.spacing.sm,
    paddingHorizontal: DesignSystem.spacing.md,
    borderWidth: 1,
    borderColor: DesignSystem.colors.inputBorder,
    marginBottom: DesignSystem.spacing.md,
  },
  disclaimerText: {
    fontSize: 13,
    color: DesignSystem.colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
  continueButton: {
    backgroundColor: DesignSystem.colors.primary,
    paddingVertical: DesignSystem.spacing.lg,
    borderRadius: DesignSystem.borderRadius.medium,
    alignItems: "center",
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
});
