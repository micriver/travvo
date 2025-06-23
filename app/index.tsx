import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { DesignSystem } from '@/constants/DesignSystem';

export default function IndexScreen() {
  const { state } = useUserPreferences();

  useEffect(() => {
    // Always show splash screen first (for testing)
    router.replace('/onboarding/splash');
    
    // Check if user has completed onboarding
    // if (state.hasCompletedOnboarding) {
    //   router.replace('/(tabs)');
    // } else {
    //   router.replace('/onboarding/splash');
    // }
  }, [state.hasCompletedOnboarding]);

  // Show loading screen while determining which flow to show
  return (
    <View style={styles.container}>
      {/* This is just a placeholder loading screen */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});