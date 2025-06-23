// Design System based on design-system.reactnative.json
export const DesignSystem = {
  colors: {
    primary: "#FF6A3D", // Coral
    primaryBackground: "rgba(255, 106, 61, 0.1)",
    accent: "#00B9AE", // Teal
    background: "#0D0D0D", // Dark
    card: "#1A1A1A",
    textPrimary: "#FFFFFF",
    textSecondary: "#CCCCCC",
    inputBorder: "#333333",
    success: "#2ECC71",
    error: "#E74C3C",
    inactive: "#666666"
  },
  fontSizes: {
    title: 32, // Updated to 32pt as per brief
    subtitle: 20,
    body: 16, // Updated to 16pt as per brief
    caption: 12
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32
  },
  borderRadius: {
    small: 8,
    medium: 16,
    pill: 999
  },
  shadow: {
    elevation: 4,
    color: "#000000",
    opacity: 0.3,
    radius: 10,
    offset: {
      width: 0,
      height: 4
    }
  },
  components: {
    Button: {
      variant: "filled",
      shape: "pill",
      backgroundColor: "#FF6A3D",
      textColor: "#FFFFFF",
      fontWeight: "bold",
      paddingVertical: 12,
      paddingHorizontal: 20,
      shadow: true,
      tapEffect: "scale"
    },
    TextInput: {
      backgroundColor: "#0D0D0D",
      borderColor: "#333333",
      borderWidth: 1,
      borderRadius: 12,
      padding: 12,
      textColor: "#FFFFFF",
      placeholderColor: "#888888"
    },
    TabBar: {
      backgroundColor: "#0D0D0D",
      activeTintColor: "#FF6A3D",
      inactiveTintColor: "#666666",
      indicatorStyle: "rounded"
    }
  },
  animations: {
    defaultDuration: 300,
    buttonPress: {
      type: "scale",
      scaleTo: 0.95
    }
  }
} as const;

export const createShadow = () => ({
  shadowColor: DesignSystem.shadow.color,
  shadowOffset: DesignSystem.shadow.offset,
  shadowOpacity: DesignSystem.shadow.opacity,
  shadowRadius: DesignSystem.shadow.radius,
  elevation: DesignSystem.shadow.elevation,
});