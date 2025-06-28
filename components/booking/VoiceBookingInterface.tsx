import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { DesignSystem } from '@/constants/DesignSystem';
import { Flight, VoiceBookingSession, VoiceBookingStep } from '@/types';
import { useConversation } from '@/contexts/ConversationContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface VoiceBookingInterfaceProps {
  visible: boolean;
  flight: Flight | null;
  onClose: () => void;
  onBookingComplete: (bookingData: any) => void;
  onSwitchToManual: () => void;
}

interface ConversationMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  step?: VoiceBookingStep;
}

export const VoiceBookingInterface: React.FC<VoiceBookingInterfaceProps> = ({
  visible,
  flight,
  onClose,
  onBookingComplete,
  onSwitchToManual,
}) => {
  const { state: conversationState, addMessage, updateAIState } = useConversation();
  const [session, setSession] = useState<VoiceBookingSession | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [currentStep, setCurrentStep] = useState<VoiceBookingStep>('flight_confirmation');
  const [extractedData, setExtractedData] = useState<any>({});
  const scrollViewRef = useRef<ScrollView>(null);

  // Animation values
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const opacity = useSharedValue(0);
  const micScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.3);

  // Booking steps flow
  const BOOKING_STEPS: VoiceBookingStep[] = [
    'flight_confirmation',
    'passenger_count',
    'passenger_details',
    'contact_info',
    'seat_preferences',
    'meal_preferences',
    'baggage_selection',
    'special_requests',
    'payment_method',
    'final_review',
    'confirmation'
  ];

  useEffect(() => {
    if (visible && flight) {
      initializeSession();
      // Animate in
      translateY.value = withSpring(0, { damping: 20 });
      opacity.value = withSpring(1);
    } else {
      // Animate out
      translateY.value = withSpring(SCREEN_HEIGHT);
      opacity.value = withSpring(0);
      resetSession();
    }
  }, [visible, flight]);

  const initializeSession = () => {
    if (!flight) return;

    const newSession: VoiceBookingSession = {
      id: `voice_booking_${Date.now()}`,
      flight,
      currentStep: 'flight_confirmation',
      completedSteps: [],
      extractedData: {},
      conversationHistory: [],
      isActive: true,
      startedAt: new Date(),
      lastActivity: new Date(),
    };

    setSession(newSession);
    setCurrentStep('flight_confirmation');
    setExtractedData({});
    
    // Initialize conversation
    const welcomeMessage: ConversationMessage = {
      id: `msg_${Date.now()}`,
      type: 'ai',
      content: `Hi! I'll help you book your flight from ${flight.segments[0].departure.airport.city} to ${flight.segments[flight.segments.length - 1].arrival.airport.city}. Let's start by confirming your flight details. Is this the flight you want to book for $${flight.price.total}?`,
      timestamp: new Date(),
      step: 'flight_confirmation',
    };

    setMessages([welcomeMessage]);
  };

  const resetSession = () => {
    setSession(null);
    setMessages([]);
    setCurrentStep('flight_confirmation');
    setExtractedData({});
    setIsListening(false);
    setIsProcessing(false);
  };

  const startListening = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsListening(true);
    
    // Start mic animation
    micScale.value = withRepeat(
      withSequence(
        withSpring(1.2),
        withSpring(1)
      ),
      -1,
      true
    );
    
    pulseOpacity.value = withRepeat(
      withSequence(
        withSpring(0.8),
        withSpring(0.3)
      ),
      -1,
      true
    );

    // Simulate speech recognition - in real app would use expo-speech
    setTimeout(() => {
      stopListening();
      handleUserResponse("Yes, that's correct. I want to book this flight.");
    }, 2000);
  };

  const stopListening = () => {
    setIsListening(false);
    micScale.value = withSpring(1);
    pulseOpacity.value = withSpring(0.3);
  };

  const handleUserResponse = async (userInput: string) => {
    if (!session) return;

    setIsProcessing(true);
    
    // Add user message
    const userMessage: ConversationMessage = {
      id: `msg_${Date.now()}_user`,
      type: 'user',
      content: userInput,
      timestamp: new Date(),
      step: currentStep,
    };

    setMessages(prev => [...prev, userMessage]);

    // Process response and move to next step
    await processUserResponse(userInput);
    
    setIsProcessing(false);
  };

  const processUserResponse = async (userInput: string) => {
    // Simulate AI processing and response generation
    await new Promise(resolve => setTimeout(resolve, 1000));

    let aiResponse = '';
    let nextStep: VoiceBookingStep | null = null;
    let dataUpdate = {};

    switch (currentStep) {
      case 'flight_confirmation':
        if (userInput.toLowerCase().includes('yes') || userInput.toLowerCase().includes('correct')) {
          aiResponse = "Great! How many passengers will be traveling?";
          nextStep = 'passenger_count';
        } else {
          aiResponse = "I understand you'd like to modify the flight selection. Would you like me to switch you to manual booking to choose a different flight?";
        }
        break;

      case 'passenger_count':
        const passengerCount = extractNumberFromText(userInput) || 1;
        dataUpdate = { passengerCount };
        aiResponse = `Perfect! I'll book for ${passengerCount} passenger${passengerCount > 1 ? 's' : ''}. Let's start with the first passenger's details. Can you tell me the full name for passenger 1?`;
        nextStep = 'passenger_details';
        break;

      case 'passenger_details':
        const nameMatch = extractNameFromText(userInput);
        if (nameMatch) {
          dataUpdate = { 
            passengers: [{ name: nameMatch, ...extractedData.passengers?.[0] }] 
          };
          aiResponse = `Thank you! I have ${nameMatch} as the passenger. What's the best email address for booking confirmation?`;
          nextStep = 'contact_info';
        } else {
          aiResponse = "I didn't catch the full name clearly. Could you please repeat the first and last name?";
        }
        break;

      case 'contact_info':
        const email = extractEmailFromText(userInput);
        if (email) {
          dataUpdate = { email };
          aiResponse = "Great! Do you have any seat preferences? You can say 'aisle', 'window', or 'no preference'.";
          nextStep = 'seat_preferences';
        } else {
          aiResponse = "I didn't catch a valid email address. Could you please repeat that?";
        }
        break;

      case 'seat_preferences':
        const seatPref = extractSeatPreference(userInput);
        dataUpdate = { seatPreference: seatPref };
        aiResponse = `Noted your ${seatPref} preference. Any special meal requirements? You can say 'vegetarian', 'kosher', 'halal', or 'no special requirements'.`;
        nextStep = 'meal_preferences';
        break;

      case 'meal_preferences':
        const mealPref = extractMealPreference(userInput);
        dataUpdate = { mealPreference: mealPref };
        aiResponse = "Do you need to add any checked bags? The first checked bag costs $35.";
        nextStep = 'baggage_selection';
        break;

      case 'baggage_selection':
        const baggage = extractBaggageInfo(userInput);
        dataUpdate = { baggage };
        aiResponse = "Any special requests or assistance needed for your flight?";
        nextStep = 'special_requests';
        break;

      case 'special_requests':
        dataUpdate = { specialRequests: userInput !== 'none' ? userInput : '' };
        aiResponse = "How would you like to pay? I can create a booking link for secure payment.";
        nextStep = 'payment_method';
        break;

      case 'payment_method':
        dataUpdate = { paymentMethod: userInput };
        aiResponse = generateBookingSummary();
        nextStep = 'final_review';
        break;

      case 'final_review':
        if (userInput.toLowerCase().includes('confirm') || userInput.toLowerCase().includes('book')) {
          aiResponse = "Perfect! I'm creating your booking now...";
          nextStep = 'confirmation';
          setTimeout(() => {
            completeBooking();
          }, 2000);
        } else {
          aiResponse = "Would you like to make any changes? I can help you modify any details.";
        }
        break;

      default:
        aiResponse = "I'm not sure how to help with that. Let me transfer you to manual booking.";
    }

    // Update extracted data
    setExtractedData(prev => ({ ...prev, ...dataUpdate }));

    // Add AI response
    const aiMessage: ConversationMessage = {
      id: `msg_${Date.now()}_ai`,
      type: 'ai',
      content: aiResponse,
      timestamp: new Date(),
      step: nextStep || currentStep,
    };

    setMessages(prev => [...prev, aiMessage]);

    // Move to next step
    if (nextStep) {
      setCurrentStep(nextStep);
      setSession(prev => prev ? {
        ...prev,
        currentStep: nextStep,
        completedSteps: [...prev.completedSteps, currentStep],
        extractedData: { ...prev.extractedData, ...dataUpdate },
        lastActivity: new Date(),
      } : null);
    }

    // Auto-scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const generateBookingSummary = () => {
    const data = extractedData;
    const destination = flight?.segments[flight.segments.length - 1].arrival.airport;
    
    return `Let me summarize your booking:
    
Flight: ${flight?.segments[0].departure.airport.code} to ${destination?.code}
Passenger: ${data.passengers?.[0]?.name || 'Not specified'}
Email: ${data.email || 'Not specified'}
Seat: ${data.seatPreference || 'No preference'}
Meal: ${data.mealPreference || 'Standard'}
Baggage: ${data.baggage || 'Carry-on only'}
Total: $${flight?.price.total}

Everything look correct? Say "confirm" to book or let me know what needs to be changed.`;
  };

  const completeBooking = () => {
    const bookingData = {
      flight,
      extractedData,
      sessionId: session?.id,
      completedAt: new Date(),
    };

    onBookingComplete(bookingData);
  };

  // Helper functions for text extraction
  const extractNumberFromText = (text: string): number | null => {
    const match = text.match(/\b(\d+)\b/);
    return match ? parseInt(match[1]) : null;
  };

  const extractNameFromText = (text: string): string => {
    // Simple name extraction - in real app would use NLP
    return text.replace(/[^a-zA-Z\s]/g, '').trim();
  };

  const extractEmailFromText = (text: string): string | null => {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const match = text.match(emailRegex);
    return match ? match[0] : null;
  };

  const extractSeatPreference = (text: string): string => {
    const lower = text.toLowerCase();
    if (lower.includes('aisle')) return 'aisle';
    if (lower.includes('window')) return 'window';
    return 'no preference';
  };

  const extractMealPreference = (text: string): string => {
    const lower = text.toLowerCase();
    if (lower.includes('vegetarian')) return 'vegetarian';
    if (lower.includes('kosher')) return 'kosher';
    if (lower.includes('halal')) return 'halal';
    return 'standard';
  };

  const extractBaggageInfo = (text: string): string => {
    const lower = text.toLowerCase();
    if (lower.includes('yes') || lower.includes('bag')) return '1 checked bag';
    return 'carry-on only';
  };

  // Animated styles
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const micAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: micScale.value }],
  }));

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  if (!flight) return null;

  const stepProgress = (BOOKING_STEPS.indexOf(currentStep) + 1) / BOOKING_STEPS.length;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Animated.View style={[styles.container, contentStyle]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <TouchableOpacity onPress={onClose} style={styles.backButton}>
                <IconSymbol name="chevron.left" size={20} color={DesignSystem.colors.textPrimary} />
              </TouchableOpacity>
              <View>
                <Text style={styles.title}>Voice Booking</Text>
                <Text style={styles.subtitle}>
                  Step {BOOKING_STEPS.indexOf(currentStep) + 1} of {BOOKING_STEPS.length}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onSwitchToManual} style={styles.switchButton}>
              <Text style={styles.switchButtonText}>Manual</Text>
            </TouchableOpacity>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${stepProgress * 100}%` }]} />
            </View>
          </View>

          {/* Conversation */}
          <ScrollView 
            ref={scrollViewRef}
            style={styles.conversation}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.conversationContent}
          >
            {messages.map((message) => (
              <View 
                key={message.id} 
                style={[
                  styles.message,
                  message.type === 'user' ? styles.userMessage : styles.aiMessage
                ]}
              >
                <Text style={[
                  styles.messageText,
                  message.type === 'user' ? styles.userMessageText : styles.aiMessageText
                ]}>
                  {message.content}
                </Text>
                <Text style={styles.messageTime}>
                  {message.timestamp.toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit' 
                  })}
                </Text>
              </View>
            ))}
            
            {isProcessing && (
              <View style={[styles.message, styles.aiMessage]}>
                <View style={styles.typingIndicator}>
                  <ActivityIndicator size="small" color={DesignSystem.colors.primary} />
                  <Text style={styles.typingText}>AI is thinking...</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Voice Controls */}
          <View style={styles.controls}>
            <TouchableOpacity
              style={[styles.micButton, isListening && styles.listeningButton]}
              onPress={isListening ? stopListening : startListening}
              disabled={isProcessing}
              activeOpacity={0.8}
            >
              {isListening && (
                <Animated.View style={[styles.pulse, pulseAnimatedStyle]} />
              )}
              <Animated.View style={micAnimatedStyle}>
                <IconSymbol 
                  name={isListening ? "mic.fill" : "mic"} 
                  size={32} 
                  color="white" 
                />
              </Animated.View>
            </TouchableOpacity>
            
            <Text style={styles.micLabel}>
              {isListening ? 'Listening...' : isProcessing ? 'Processing...' : 'Tap to speak'}
            </Text>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
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
    backgroundColor: DesignSystem.colors.background,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
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
  conversation: {
    flex: 1,
    paddingHorizontal: 24,
  },
  conversationContent: {
    paddingBottom: 20,
  },
  message: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: DesignSystem.colors.primary,
    borderRadius: 18,
    borderBottomRightRadius: 4,
    padding: 16,
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: DesignSystem.colors.background,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    padding: 16,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: 'white',
  },
  aiMessageText: {
    color: DesignSystem.colors.textPrimary,
  },
  messageTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typingText: {
    fontSize: 14,
    color: DesignSystem.colors.textSecondary,
    fontStyle: 'italic',
  },
  controls: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 20,
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: DesignSystem.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 12,
  },
  listeningButton: {
    backgroundColor: DesignSystem.colors.error,
  },
  pulse: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: DesignSystem.colors.primary,
  },
  micLabel: {
    fontSize: 16,
    color: DesignSystem.colors.textSecondary,
    textAlign: 'center',
  },
});