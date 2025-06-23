import { View, StyleSheet, Image, TouchableOpacity, Text } from 'react-native';
import { useEffect } from 'react';
import { router } from 'expo-router';
import { DesignSystem } from '@/constants/DesignSystem';

export default function SplashScreen() {
  useEffect(() => {
    // Auto-advance after 2 seconds
    const timer = setTimeout(() => {
      handleContinue();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleContinue = () => {
    router.push('/onboarding/how-it-works');
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={handleContinue}
      activeOpacity={0.9}
    >
      <View style={styles.logoContainer}>
        <Image 
          source={require('@/assets/logo/travvo-logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  logo: {
    width: 400,
    height: 400,
  },
});