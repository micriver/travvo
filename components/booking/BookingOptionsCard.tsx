import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { DesignSystem } from '@/constants/DesignSystem';
import { Flight } from '@/types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BookingOptionsCardProps {
  visible: boolean;
  flight: Flight | null;
  onClose: () => void;
  onVoiceBooking: (flight: Flight) => void;
  onManualBooking: (flight: Flight) => void;
}

export const BookingOptionsCard: React.FC<BookingOptionsCardProps> = ({
  visible,
  flight,
  onClose,
  onVoiceBooking,
  onManualBooking,
}) => {
  const [selectedOption, setSelectedOption] = useState<'voice' | 'manual' | null>(null);
  
  // Animation values
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const opacity = useSharedValue(0);
  const voiceScale = useSharedValue(0.95);
  const manualScale = useSharedValue(0.95);
  const buttonOpacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible && flight) {
      // Animate in
      translateY.value = withSpring(0, { damping: 20 });
      opacity.value = withSpring(1);
      voiceScale.value = withDelay(200, withSpring(1));
      manualScale.value = withDelay(300, withSpring(1));
      buttonOpacity.value = withDelay(400, withSpring(1));
    } else {
      // Animate out
      translateY.value = withSpring(SCREEN_HEIGHT);
      opacity.value = withSpring(0);
      voiceScale.value = withSpring(0.95);
      manualScale.value = withSpring(0.95);
      buttonOpacity.value = withSpring(0);
      setSelectedOption(null);
    }
  }, [visible, flight]);

  const handleOptionSelect = (option: 'voice' | 'manual') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedOption(option);
  };

  const handleContinue = () => {
    if (!flight || !selectedOption) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (selectedOption === 'voice') {
      onVoiceBooking(flight);
    } else {
      onManualBooking(flight);
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  // Animated styles
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const voiceOptionStyle = useAnimatedStyle(() => ({
    transform: [{ scale: voiceScale.value }],
  }));

  const manualOptionStyle = useAnimatedStyle(() => ({
    transform: [{ scale: manualScale.value }],
  }));

  const continueButtonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  if (!flight) return null;

  const destination = flight.segments[flight.segments.length - 1].arrival.airport;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <TouchableOpacity 
          style={styles.backdropTouchable} 
          activeOpacity={1}
          onPress={handleClose}
        />
        
        <Animated.View style={[styles.card, cardStyle]}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.title}>Book Your Flight</Text>
              <Text style={styles.subtitle}>
                {flight.segments[0].departure.airport.code} → {destination.code}
              </Text>
              <Text style={styles.price}>${flight.price.total}</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <IconSymbol name="xmark" size={20} color={DesignSystem.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Options */}
          <View style={styles.options}>
            <Text style={styles.optionsTitle}>How would you like to book?</Text>
            
            {/* Voice Booking Option */}
            <Animated.View style={voiceOptionStyle}>
              <TouchableOpacity
                style={[
                  styles.option,
                  selectedOption === 'voice' && styles.selectedOption
                ]}
                onPress={() => handleOptionSelect('voice')}
                activeOpacity={0.7}
              >
                <View style={styles.optionContent}>
                  <View style={[styles.optionIcon, styles.voiceIcon]}>
                    <IconSymbol name="mic.fill" size={24} color="white" />
                  </View>
                  <View style={styles.optionText}>
                    <Text style={styles.optionTitle}>Voice Booking</Text>
                    <Text style={styles.optionDescription}>
                      Let our AI assistant guide you through booking with natural conversation
                    </Text>
                    <View style={styles.optionFeatures}>
                      <View style={styles.feature}>
                        <IconSymbol name="checkmark" size={12} color={DesignSystem.colors.success} />
                        <Text style={styles.featureText}>Hands-free booking</Text>
                      </View>
                      <View style={styles.feature}>
                        <IconSymbol name="checkmark" size={12} color={DesignSystem.colors.success} />
                        <Text style={styles.featureText}>Smart data extraction</Text>
                      </View>
                      <View style={styles.feature}>
                        <IconSymbol name="checkmark" size={12} color={DesignSystem.colors.success} />
                        <Text style={styles.featureText}>Faster completion</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.optionBadge}>
                    <Text style={styles.badgeText}>AI Powered</Text>
                  </View>
                </View>
                {selectedOption === 'voice' && (
                  <View style={styles.selectedIndicator}>
                    <IconSymbol name="checkmark.circle.fill" size={20} color={DesignSystem.colors.primary} />
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Manual Booking Option */}
            <Animated.View style={manualOptionStyle}>
              <TouchableOpacity
                style={[
                  styles.option,
                  selectedOption === 'manual' && styles.selectedOption
                ]}
                onPress={() => handleOptionSelect('manual')}
                activeOpacity={0.7}
              >
                <View style={styles.optionContent}>
                  <View style={[styles.optionIcon, styles.manualIcon]}>
                    <IconSymbol name="hand.tap.fill" size={24} color="white" />
                  </View>
                  <View style={styles.optionText}>
                    <Text style={styles.optionTitle}>Manual Booking</Text>
                    <Text style={styles.optionDescription}>
                      Fill out forms step-by-step with traditional booking interface
                    </Text>
                    <View style={styles.optionFeatures}>
                      <View style={styles.feature}>
                        <IconSymbol name="checkmark" size={12} color={DesignSystem.colors.success} />
                        <Text style={styles.featureText}>Complete control</Text>
                      </View>
                      <View style={styles.feature}>
                        <IconSymbol name="checkmark" size={12} color={DesignSystem.colors.success} />
                        <Text style={styles.featureText}>Visual confirmation</Text>
                      </View>
                      <View style={styles.feature}>
                        <IconSymbol name="checkmark" size={12} color={DesignSystem.colors.success} />
                        <Text style={styles.featureText}>Familiar interface</Text>
                      </View>
                    </View>
                  </View>
                  <View style={[styles.optionBadge, styles.traditionalBadge]}>
                    <Text style={[styles.badgeText, styles.traditionalBadgeText]}>Traditional</Text>
                  </View>
                </View>
                {selectedOption === 'manual' && (
                  <View style={styles.selectedIndicator}>
                    <IconSymbol name="checkmark.circle.fill" size={20} color={DesignSystem.colors.primary} />
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Continue Button */}
          <Animated.View style={[styles.buttonContainer, continueButtonStyle]}>
            <TouchableOpacity
              style={[
                styles.continueButton,
                !selectedOption && styles.disabledButton
              ]}
              onPress={handleContinue}
              disabled={!selectedOption}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.continueButtonText,
                !selectedOption && styles.disabledButtonText
              ]}>
                Continue with {selectedOption === 'voice' ? 'Voice' : selectedOption === 'manual' ? 'Manual' : ''} Booking
              </Text>
              <IconSymbol 
                name="arrow.right" 
                size={18} 
                color={selectedOption ? 'white' : DesignSystem.colors.textSecondary} 
              />
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    flex: 1,
  },
  card: {
    backgroundColor: DesignSystem.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    maxHeight: SCREEN_HEIGHT * 0.8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: DesignSystem.colors.inactive,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: DesignSystem.colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: DesignSystem.colors.textSecondary,
    marginBottom: 8,
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: DesignSystem.colors.primary,
  },
  closeButton: {
    padding: 8,
  },
  options: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DesignSystem.colors.textPrimary,
    marginBottom: 20,
  },
  option: {
    backgroundColor: DesignSystem.colors.background,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  selectedOption: {
    borderColor: DesignSystem.colors.primary,
    backgroundColor: DesignSystem.colors.surface,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  voiceIcon: {
    backgroundColor: DesignSystem.colors.primary,
  },
  manualIcon: {
    backgroundColor: DesignSystem.colors.textSecondary,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DesignSystem.colors.textPrimary,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: DesignSystem.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  optionFeatures: {
    gap: 6,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 12,
    color: DesignSystem.colors.textSecondary,
  },
  optionBadge: {
    backgroundColor: DesignSystem.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  traditionalBadge: {
    backgroundColor: DesignSystem.colors.background,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
    textTransform: 'uppercase',
  },
  traditionalBadgeText: {
    color: DesignSystem.colors.textSecondary,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignSystem.colors.primary,
    paddingVertical: 16,
    borderRadius: 30,
    gap: 8,
  },
  disabledButton: {
    backgroundColor: DesignSystem.colors.background,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  disabledButtonText: {
    color: DesignSystem.colors.textSecondary,
  },
});