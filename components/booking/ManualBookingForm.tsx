import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
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
import { Flight, PassengerInfo, ContactInfo, BookingRequest } from '@/types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ManualBookingFormProps {
  visible: boolean;
  flight: Flight | null;
  onClose: () => void;
  onBookingComplete: (bookingData: BookingRequest) => void;
  onSwitchToVoice: () => void;
}

type FormStep = 'passengers' | 'contact' | 'preferences' | 'payment' | 'review';

export const ManualBookingForm: React.FC<ManualBookingFormProps> = ({
  visible,
  flight,
  onClose,
  onBookingComplete,
  onSwitchToVoice,
}) => {
  const [currentStep, setCurrentStep] = useState<FormStep>('passengers');
  const [passengerCount, setPassengerCount] = useState(1);
  const [passengers, setPassengers] = useState<Partial<PassengerInfo>[]>([{}]);
  const [contactInfo, setContactInfo] = useState<Partial<ContactInfo>>({});
  const [preferences, setPreferences] = useState<any>({});
  const [currentPassengerIndex, setCurrentPassengerIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // Animation values
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const opacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  const FORM_STEPS: FormStep[] = ['passengers', 'contact', 'preferences', 'payment', 'review'];

  React.useEffect(() => {
    if (visible && flight) {
      // Animate in
      translateY.value = withSpring(0, { damping: 20 });
      opacity.value = withSpring(1);
      contentOpacity.value = withDelay(300, withSpring(1));
      resetForm();
    } else {
      // Animate out
      translateY.value = withSpring(SCREEN_HEIGHT);
      opacity.value = withSpring(0);
      contentOpacity.value = withSpring(0);
    }
  }, [visible, flight]);

  const resetForm = () => {
    setCurrentStep('passengers');
    setPassengerCount(1);
    setPassengers([{}]);
    setContactInfo({});
    setPreferences({});
    setCurrentPassengerIndex(0);
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (!validateCurrentStep()) {
      return;
    }

    const currentIndex = FORM_STEPS.indexOf(currentStep);
    if (currentIndex < FORM_STEPS.length - 1) {
      setCurrentStep(FORM_STEPS[currentIndex + 1]);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const currentIndex = FORM_STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(FORM_STEPS[currentIndex - 1]);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 'passengers':
        return passengers.every(p => p.firstName && p.lastName && p.dateOfBirth && p.email);
      case 'contact':
        return !!(contactInfo.email && contactInfo.phone && contactInfo.emergencyContact?.name);
      case 'preferences':
        return true; // Preferences are optional
      case 'payment':
        return true; // Payment will be handled externally
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const updatePassenger = (index: number, field: keyof PassengerInfo, value: any) => {
    const updatedPassengers = [...passengers];
    updatedPassengers[index] = {
      ...updatedPassengers[index],
      [field]: value,
    };
    setPassengers(updatedPassengers);
  };

  const addPassenger = () => {
    if (passengers.length < 9) {
      setPassengers([...passengers, {}]);
      setPassengerCount(passengers.length + 1);
    }
  };

  const removePassenger = (index: number) => {
    if (passengers.length > 1) {
      const updatedPassengers = passengers.filter((_, i) => i !== index);
      setPassengers(updatedPassengers);
      setPassengerCount(updatedPassengers.length);
      if (currentPassengerIndex >= updatedPassengers.length) {
        setCurrentPassengerIndex(updatedPassengers.length - 1);
      }
    }
  };

  const handleComplete = () => {
    if (!flight) return;

    const bookingData: BookingRequest = {
      id: `booking_${Date.now()}`,
      flight,
      passengers: passengers as PassengerInfo[],
      contactInfo: contactInfo as ContactInfo,
      specialRequests: preferences.specialRequests ? [preferences.specialRequests] : [],
      seatSelections: preferences.seatSelections || {},
      mealSelections: preferences.mealSelections || {},
      baggageSelections: preferences.baggageSelections || {},
      totalPrice: flight.price.total,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onBookingComplete(bookingData);
  };

  // Animated styles
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const formContentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  if (!flight) return null;

  const stepProgress = (FORM_STEPS.indexOf(currentStep) + 1) / FORM_STEPS.length;
  const canGoNext = validateCurrentStep();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <KeyboardAvoidingView 
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Animated.View style={[styles.container, contentStyle]}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <TouchableOpacity onPress={handleClose} style={styles.backButton}>
                  <IconSymbol name="xmark" size={20} color={DesignSystem.colors.textPrimary} />
                </TouchableOpacity>
                <View>
                  <Text style={styles.title}>Manual Booking</Text>
                  <Text style={styles.subtitle}>
                    Step {FORM_STEPS.indexOf(currentStep) + 1} of {FORM_STEPS.length}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={onSwitchToVoice} style={styles.switchButton}>
                <IconSymbol name="mic" size={16} color={DesignSystem.colors.primary} />
                <Text style={styles.switchButtonText}>Voice</Text>
              </TouchableOpacity>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${stepProgress * 100}%` }]} />
              </View>
            </View>

            {/* Content */}
            <Animated.View style={[styles.content, formContentStyle]}>
              <ScrollView 
                ref={scrollViewRef}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                {currentStep === 'passengers' && (
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Passenger Information</Text>
                    <Text style={styles.stepDescription}>
                      Enter details for all passengers exactly as they appear on government-issued ID
                    </Text>

                    {/* Passenger Count Selector */}
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Number of Passengers</Text>
                      <View style={styles.passengerCountContainer}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((count) => (
                          <TouchableOpacity
                            key={count}
                            style={[
                              styles.countButton,
                              passengerCount === count && styles.activeCountButton
                            ]}
                            onPress={() => {
                              setPassengerCount(count);
                              const newPassengers = Array(count).fill(null).map((_, i) => 
                                passengers[i] || {}
                              );
                              setPassengers(newPassengers);
                              setCurrentPassengerIndex(Math.min(currentPassengerIndex, count - 1));
                            }}
                          >
                            <Text style={[
                              styles.countButtonText,
                              passengerCount === count && styles.activeCountButtonText
                            ]}>
                              {count}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* Passenger Tabs */}
                    {passengers.length > 1 && (
                      <View style={styles.passengerTabs}>
                        {passengers.map((_, index) => (
                          <TouchableOpacity
                            key={index}
                            style={[
                              styles.passengerTab,
                              currentPassengerIndex === index && styles.activePassengerTab
                            ]}
                            onPress={() => setCurrentPassengerIndex(index)}
                          >
                            <Text style={[
                              styles.passengerTabText,
                              currentPassengerIndex === index && styles.activePassengerTabText
                            ]}>
                              Passenger {index + 1}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    {/* Current Passenger Form */}
                    <View style={styles.passengerForm}>
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Title</Text>
                        <View style={styles.titleSelector}>
                          {(['Mr', 'Ms', 'Mrs', 'Dr'] as const).map((title) => (
                            <TouchableOpacity
                              key={title}
                              style={[
                                styles.titleButton,
                                passengers[currentPassengerIndex]?.title === title && styles.activeTitleButton
                              ]}
                              onPress={() => updatePassenger(currentPassengerIndex, 'title', title)}
                            >
                              <Text style={[
                                styles.titleButtonText,
                                passengers[currentPassengerIndex]?.title === title && styles.activeTitleButtonText
                              ]}>
                                {title}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>

                      <View style={styles.nameRow}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                          <Text style={styles.inputLabel}>First Name *</Text>
                          <TextInput
                            style={styles.textInput}
                            value={passengers[currentPassengerIndex]?.firstName || ''}
                            onChangeText={(text) => updatePassenger(currentPassengerIndex, 'firstName', text)}
                            placeholder="Enter first name"
                            placeholderTextColor={DesignSystem.colors.textSecondary}
                          />
                        </View>
                        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                          <Text style={styles.inputLabel}>Last Name *</Text>
                          <TextInput
                            style={styles.textInput}
                            value={passengers[currentPassengerIndex]?.lastName || ''}
                            onChangeText={(text) => updatePassenger(currentPassengerIndex, 'lastName', text)}
                            placeholder="Enter last name"
                            placeholderTextColor={DesignSystem.colors.textSecondary}
                          />
                        </View>
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Date of Birth *</Text>
                        <TextInput
                          style={styles.textInput}
                          value={passengers[currentPassengerIndex]?.dateOfBirth?.toLocaleDateString() || ''}
                          placeholder="MM/DD/YYYY"
                          placeholderTextColor={DesignSystem.colors.textSecondary}
                        />
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Email *</Text>
                        <TextInput
                          style={styles.textInput}
                          value={passengers[currentPassengerIndex]?.email || ''}
                          onChangeText={(text) => updatePassenger(currentPassengerIndex, 'email', text)}
                          placeholder="passenger@example.com"
                          placeholderTextColor={DesignSystem.colors.textSecondary}
                          keyboardType="email-address"
                          autoCapitalize="none"
                        />
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Phone</Text>
                        <TextInput
                          style={styles.textInput}
                          value={passengers[currentPassengerIndex]?.phone || ''}
                          onChangeText={(text) => updatePassenger(currentPassengerIndex, 'phone', text)}
                          placeholder="+1 (555) 123-4567"
                          placeholderTextColor={DesignSystem.colors.textSecondary}
                          keyboardType="phone-pad"
                        />
                      </View>
                    </View>
                  </View>
                )}

                {currentStep === 'contact' && (
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Contact Information</Text>
                    <Text style={styles.stepDescription}>
                      Primary contact for booking confirmations and flight updates
                    </Text>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Email Address *</Text>
                      <TextInput
                        style={styles.textInput}
                        value={contactInfo.email || ''}
                        onChangeText={(text) => setContactInfo(prev => ({ ...prev, email: text }))}
                        placeholder="booking@example.com"
                        placeholderTextColor={DesignSystem.colors.textSecondary}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Phone Number *</Text>
                      <TextInput
                        style={styles.textInput}
                        value={contactInfo.phone || ''}
                        onChangeText={(text) => setContactInfo(prev => ({ ...prev, phone: text }))}
                        placeholder="+1 (555) 123-4567"
                        placeholderTextColor={DesignSystem.colors.textSecondary}
                        keyboardType="phone-pad"
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Emergency Contact Name *</Text>
                      <TextInput
                        style={styles.textInput}
                        value={contactInfo.emergencyContact?.name || ''}
                        onChangeText={(text) => setContactInfo(prev => ({ 
                          ...prev, 
                          emergencyContact: { ...prev.emergencyContact, name: text } as any
                        }))}
                        placeholder="Full name"
                        placeholderTextColor={DesignSystem.colors.textSecondary}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Emergency Contact Phone *</Text>
                      <TextInput
                        style={styles.textInput}
                        value={contactInfo.emergencyContact?.phone || ''}
                        onChangeText={(text) => setContactInfo(prev => ({ 
                          ...prev, 
                          emergencyContact: { ...prev.emergencyContact, phone: text } as any
                        }))}
                        placeholder="+1 (555) 123-4567"
                        placeholderTextColor={DesignSystem.colors.textSecondary}
                        keyboardType="phone-pad"
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Relationship</Text>
                      <TextInput
                        style={styles.textInput}
                        value={contactInfo.emergencyContact?.relationship || ''}
                        onChangeText={(text) => setContactInfo(prev => ({ 
                          ...prev, 
                          emergencyContact: { ...prev.emergencyContact, relationship: text } as any
                        }))}
                        placeholder="e.g., Spouse, Parent, Friend"
                        placeholderTextColor={DesignSystem.colors.textSecondary}
                      />
                    </View>
                  </View>
                )}

                {currentStep === 'preferences' && (
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Preferences</Text>
                    <Text style={styles.stepDescription}>
                      Customize your flight experience (optional)
                    </Text>

                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Seat Preferences</Text>
                      <View style={styles.preferenceButtons}>
                        {['Aisle', 'Window', 'No Preference'].map((pref) => (
                          <TouchableOpacity
                            key={pref}
                            style={[
                              styles.preferenceButton,
                              preferences.seatPreference === pref && styles.activePreferenceButton
                            ]}
                            onPress={() => setPreferences(prev => ({ ...prev, seatPreference: pref }))}
                          >
                            <Text style={[
                              styles.preferenceButtonText,
                              preferences.seatPreference === pref && styles.activePreferenceButtonText
                            ]}>
                              {pref}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Meal Preferences</Text>
                      <View style={styles.preferenceButtons}>
                        {['Standard', 'Vegetarian', 'Kosher', 'Halal', 'Gluten-Free'].map((meal) => (
                          <TouchableOpacity
                            key={meal}
                            style={[
                              styles.preferenceButton,
                              preferences.mealPreference === meal && styles.activePreferenceButton
                            ]}
                            onPress={() => setPreferences(prev => ({ ...prev, mealPreference: meal }))}
                          >
                            <Text style={[
                              styles.preferenceButtonText,
                              preferences.mealPreference === meal && styles.activePreferenceButtonText
                            ]}>
                              {meal}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Special Requests</Text>
                      <TextInput
                        style={[styles.textInput, styles.textArea]}
                        value={preferences.specialRequests || ''}
                        onChangeText={(text) => setPreferences(prev => ({ ...prev, specialRequests: text }))}
                        placeholder="Any special assistance or requests..."
                        placeholderTextColor={DesignSystem.colors.textSecondary}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                      />
                    </View>
                  </View>
                )}

                {currentStep === 'payment' && (
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Payment</Text>
                    <Text style={styles.stepDescription}>
                      You'll be redirected to a secure payment page to complete your booking
                    </Text>

                    <View style={styles.paymentInfo}>
                      <IconSymbol name="creditcard" size={48} color={DesignSystem.colors.primary} />
                      <Text style={styles.paymentTitle}>Secure Payment</Text>
                      <Text style={styles.paymentDescription}>
                        Your payment will be processed securely through our certified payment partner. 
                        We accept all major credit cards, debit cards, and digital payment methods.
                      </Text>
                    </View>
                  </View>
                )}

                {currentStep === 'review' && (
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Review & Confirm</Text>
                    <Text style={styles.stepDescription}>
                      Please review all details before completing your booking
                    </Text>

                    {/* Flight Summary */}
                    <View style={styles.reviewSection}>
                      <Text style={styles.reviewSectionTitle}>Flight Details</Text>
                      <View style={styles.reviewItem}>
                        <Text style={styles.reviewLabel}>Route</Text>
                        <Text style={styles.reviewValue}>
                          {flight.segments[0].departure.airport.code} → {flight.segments[flight.segments.length - 1].arrival.airport.code}
                        </Text>
                      </View>
                      <View style={styles.reviewItem}>
                        <Text style={styles.reviewLabel}>Date</Text>
                        <Text style={styles.reviewValue}>
                          {flight.segments[0].departure.time.toLocaleDateString()}
                        </Text>
                      </View>
                      <View style={styles.reviewItem}>
                        <Text style={styles.reviewLabel}>Passengers</Text>
                        <Text style={styles.reviewValue}>{passengers.length}</Text>
                      </View>
                    </View>

                    {/* Price Summary */}
                    <View style={styles.reviewSection}>
                      <Text style={styles.reviewSectionTitle}>Price Summary</Text>
                      <View style={styles.reviewItem}>
                        <Text style={styles.reviewLabel}>Base Fare</Text>
                        <Text style={styles.reviewValue}>${flight.price.breakdown.base}</Text>
                      </View>
                      <View style={styles.reviewItem}>
                        <Text style={styles.reviewLabel}>Taxes & Fees</Text>
                        <Text style={styles.reviewValue}>
                          ${flight.price.breakdown.taxes + flight.price.breakdown.fees}
                        </Text>
                      </View>
                      <View style={[styles.reviewItem, styles.totalItem]}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>${flight.price.total}</Text>
                      </View>
                    </View>
                  </View>
                )}
              </ScrollView>
            </Animated.View>

            {/* Navigation */}
            <View style={styles.navigation}>
              {currentStep !== 'passengers' && (
                <TouchableOpacity style={styles.backNavButton} onPress={handleBack}>
                  <IconSymbol name="chevron.left" size={20} color={DesignSystem.colors.primary} />
                  <Text style={styles.backNavButtonText}>Back</Text>
                </TouchableOpacity>
              )}
              
              <View style={styles.navSpacer} />
              
              {currentStep !== 'review' ? (
                <TouchableOpacity 
                  style={[styles.nextButton, !canGoNext && styles.disabledButton]}
                  onPress={handleNext}
                  disabled={!canGoNext}
                >
                  <Text style={[styles.nextButtonText, !canGoNext && styles.disabledButtonText]}>
                    Next
                  </Text>
                  <IconSymbol 
                    name="chevron.right" 
                    size={20} 
                    color={canGoNext ? 'white' : DesignSystem.colors.textSecondary} 
                  />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
                  <Text style={styles.completeButtonText}>Complete Booking</Text>
                  <IconSymbol name="checkmark" size={20} color="white" />
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.surface,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: DesignSystem.colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: DesignSystem.colors.textSecondary,
    marginTop: 2,
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DesignSystem.colors.background,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  switchButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: DesignSystem.colors.primary,
  },
  progressContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: DesignSystem.colors.background,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: DesignSystem.colors.primary,
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  stepContent: {
    minHeight: SCREEN_HEIGHT * 0.5,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: DesignSystem.colors.textPrimary,
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: DesignSystem.colors.textSecondary,
    lineHeight: 22,
    marginBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DesignSystem.colors.textPrimary,
    marginBottom: 16,
  },
  passengerCountContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  countButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DesignSystem.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DesignSystem.colors.border,
  },
  activeCountButton: {
    backgroundColor: DesignSystem.colors.primary,
    borderColor: DesignSystem.colors.primary,
  },
  countButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: DesignSystem.colors.textPrimary,
  },
  activeCountButtonText: {
    color: 'white',
  },
  passengerTabs: {
    flexDirection: 'row',
    marginBottom: 24,
    backgroundColor: DesignSystem.colors.background,
    borderRadius: 12,
    padding: 4,
  },
  passengerTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activePassengerTab: {
    backgroundColor: DesignSystem.colors.surface,
  },
  passengerTabText: {
    fontSize: 14,
    color: DesignSystem.colors.textSecondary,
    fontWeight: '500',
  },
  activePassengerTabText: {
    color: DesignSystem.colors.primary,
    fontWeight: '600',
  },
  passengerForm: {
    gap: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: DesignSystem.colors.textPrimary,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: DesignSystem.colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: DesignSystem.colors.textPrimary,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  titleSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  titleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: DesignSystem.colors.background,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border,
  },
  activeTitleButton: {
    backgroundColor: DesignSystem.colors.primary,
    borderColor: DesignSystem.colors.primary,
  },
  titleButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: DesignSystem.colors.textPrimary,
  },
  activeTitleButtonText: {
    color: 'white',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  preferenceButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  preferenceButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: DesignSystem.colors.background,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border,
  },
  activePreferenceButton: {
    backgroundColor: DesignSystem.colors.primary,
    borderColor: DesignSystem.colors.primary,
  },
  preferenceButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: DesignSystem.colors.textPrimary,
  },
  activePreferenceButtonText: {
    color: 'white',
  },
  paymentInfo: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  paymentTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: DesignSystem.colors.textPrimary,
    marginTop: 16,
    marginBottom: 12,
  },
  paymentDescription: {
    fontSize: 16,
    color: DesignSystem.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  reviewSection: {
    backgroundColor: DesignSystem.colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  reviewSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DesignSystem.colors.textPrimary,
    marginBottom: 12,
  },
  reviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  totalItem: {
    borderTopWidth: 1,
    borderTopColor: DesignSystem.colors.border,
    marginTop: 8,
    paddingTop: 16,
  },
  reviewLabel: {
    fontSize: 16,
    color: DesignSystem.colors.textSecondary,
  },
  reviewValue: {
    fontSize: 16,
    fontWeight: '500',
    color: DesignSystem.colors.textPrimary,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: DesignSystem.colors.textPrimary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: DesignSystem.colors.textPrimary,
  },
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: DesignSystem.colors.border,
  },
  backNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backNavButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: DesignSystem.colors.primary,
  },
  navSpacer: {
    flex: 1,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DesignSystem.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 4,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DesignSystem.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  disabledButton: {
    backgroundColor: DesignSystem.colors.background,
  },
  disabledButtonText: {
    color: DesignSystem.colors.textSecondary,
  },
});