import { StyleSheet, TouchableOpacity, View, Text, Animated } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import LottieView from 'lottie-react-native';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { DesignSystem } from '@/constants/DesignSystem';

// Animated AI Dot Component
function AnimatedAIDot({ isListening }: { isListening: boolean }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isListening) {
      // Continuous pulsing animation when listening
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      
      // Scale up when listening
      const scaleAnimation = Animated.timing(scaleAnim, {
        toValue: 1.3,
        duration: 300,
        useNativeDriver: true,
      });

      Animated.parallel([pulseAnimation, scaleAnimation]).start();
    } else {
      // Return to normal state
      pulseAnim.stopAnimation();
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      Animated.timing(pulseAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isListening, scaleAnim, pulseAnim]);

  return (
    <View style={styles.aiDotContainer}>
      <Animated.View
        style={[
          styles.aiDot,
          {
            transform: [{ scale: scaleAnim }],
          },
          isListening && styles.aiDotActive,
        ]}
      />
      {isListening && (
        <Animated.View
          style={[
            styles.aiDotPulse,
            {
              opacity: pulseAnim,
              transform: [
                {
                  scale: pulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 2.5],
                  }),
                },
              ],
            },
          ]}
        />
      )}
    </View>
  );
}

export default function TravelScreen() {
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const handleVoicePress = () => {
    setIsListening(!isListening);
  };

  return (
    <View style={styles.container}>
      {/* Main Interaction Area */}
      <View style={styles.interactionArea}>
        {isVoiceMode ? (
          <View style={styles.voiceInterface}>
            <TouchableOpacity 
              style={styles.voiceButton} 
              onPress={handleVoicePress}
              activeOpacity={0.8}
            >
              <AnimatedAIDot isListening={isListening} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.typeInterface}>
            <View style={styles.searchBox}>
              <IconSymbol name="magnifyingglass" size={20} color={DesignSystem.colors.inactive} />
              <Text style={styles.searchPlaceholder}>
                Where would you like to go?
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Mode Switch Button - Fixed Position */}
      <TouchableOpacity 
        style={styles.modeSwitchButton} 
        onPress={() => setIsVoiceMode(!isVoiceMode)}
        activeOpacity={0.7}
      >
        {isVoiceMode ? (
          <IconSymbol name="keyboard" size={24} color={DesignSystem.colors.textSecondary} />
        ) : (
          <LottieView
            source={require('@/assets/animations/audio-wave.json')}
            style={styles.lottieAnimation}
            autoPlay={true}
            loop={true}
            speed={1}
          />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background,
    justifyContent: 'space-between',
    paddingHorizontal: DesignSystem.spacing.xl,
    paddingTop: 60,
    paddingBottom: 60,
  },
  interactionArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceInterface: {
    alignItems: 'center',
    gap: DesignSystem.spacing.xl,
    width: '100%',
  },
  typeInterface: {
    width: '100%',
    alignItems: 'center',
    gap: DesignSystem.spacing.xl,
  },
  mainQuestion: {
    fontSize: 28,
    fontWeight: '300',
    textAlign: 'center',
    color: DesignSystem.colors.textPrimary,
    lineHeight: 36,
    letterSpacing: -0.5,
    paddingHorizontal: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.lg,
  },
  voiceButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: DesignSystem.spacing.xl,
  },
  aiDotContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 120,
  },
  aiDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DesignSystem.colors.inactive,
    opacity: 0.8,
  },
  aiDotActive: {
    backgroundColor: DesignSystem.colors.primary,
    opacity: 1,
    shadowColor: DesignSystem.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  aiDotPulse: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DesignSystem.colors.primary,
    opacity: 0.3,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DesignSystem.colors.card,
    borderRadius: DesignSystem.borderRadius.medium + 4,
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingVertical: DesignSystem.spacing.md,
    width: '100%',
    gap: DesignSystem.spacing.sm,
    borderWidth: 1,
    borderColor: DesignSystem.colors.inputBorder,
    marginTop: DesignSystem.spacing.lg,
  },
  searchPlaceholder: {
    fontSize: 17,
    color: DesignSystem.colors.textSecondary,
  },
  modeSwitchButton: {
    position: 'absolute',
    bottom: DesignSystem.spacing.xl + 20,
    right: DesignSystem.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    padding: DesignSystem.spacing.md,
    backgroundColor: DesignSystem.colors.card,
    borderRadius: DesignSystem.borderRadius.medium,
    shadowColor: DesignSystem.shadow.color,
    shadowOffset: DesignSystem.shadow.offset,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  audioIcon: {
    width: 24,
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1.5,
  },
  waveformBar: {
    width: 2,
    backgroundColor: DesignSystem.colors.textSecondary,
    borderRadius: 1,
  },
  waveformBar1: {
    height: 6,
  },
  waveformBar2: {
    height: 10,
  },
  waveformBar3: {
    height: 14,
  },
  waveformBar4: {
    height: 18,
  },
  waveformBar5: {
    height: 20,
  },
  waveformBar6: {
    height: 18,
  },
  waveformBar7: {
    height: 14,
  },
  waveformBar8: {
    height: 10,
  },
  waveformBar9: {
    height: 6,
  },
  lottieAnimation: {
    width: 24,
    height: 24,
  },
});