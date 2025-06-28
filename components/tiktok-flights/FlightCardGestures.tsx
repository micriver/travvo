import React from 'react';
import { Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FlightCardGesturesProps {
  children: React.ReactNode;
  index: number;
  totalCount: number;
  scrollY: Animated.SharedValue<number>;
  onIndexChange: (newIndex: number) => void;
  isActive: boolean;
}

export function FlightCardGestures({
  children,
  index,
  totalCount,
  scrollY,
  onIndexChange,
  isActive,
}: FlightCardGesturesProps) {
  const scale = useSharedValue(1);

  // Haptic feedback helper
  const triggerHaptic = () => {
    if (isActive) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Handle index change with haptic feedback
  const handleIndexChange = (newIndex: number) => {
    if (newIndex !== index) {
      triggerHaptic();
      onIndexChange(newIndex);
    }
  };

  // Remove pan gesture to let ScrollView handle all scrolling
  // Only keep tap and long press gestures

  // Long press gesture for additional interactions
  const longPressGesture = Gesture.LongPress()
    .minDuration(500)
    .onStart(() => {
      if (isActive) {
        runOnJS(triggerHaptic)();
        
        // Scale up slightly to indicate long press
        scale.value = withSpring(1.02, {
          damping: 15,
          stiffness: 400,
        });
      }
    })
    .onEnd(() => {
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 400,
      });
    });

  // Tap gesture for quick interactions
  const tapGesture = Gesture.Tap()
    .numberOfTaps(1)
    .onStart(() => {
      if (isActive) {
        scale.value = withSpring(0.98, {
          damping: 30,
          stiffness: 500,
        });
      }
    })
    .onEnd(() => {
      scale.value = withSpring(1, {
        damping: 30,
        stiffness: 500,
      });
    });

  // Double tap gesture for quick actions
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onStart(() => {
      if (isActive) {
        runOnJS(triggerHaptic)();
        
        // Quick scale animation for double tap
        scale.value = withSpring(0.95, {
          damping: 30,
          stiffness: 500,
        });
      }
    })
    .onEnd(() => {
      scale.value = withSpring(1, {
        damping: 30,
        stiffness: 500,
      });
    });

  // Composed gesture with proper priority (removed pan gesture)
  const composedGesture = Gesture.Exclusive(
    doubleTapGesture,
    Gesture.Simultaneous(
      longPressGesture,
      tapGesture
    )
  );

  // Animated style for the container (only scale, no translation)
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
      ],
    };
  });

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[{ flex: 1 }, animatedStyle]}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}