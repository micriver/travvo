import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false, // Prevent swipe back to maintain onboarding flow
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="splash" />
      <Stack.Screen name="how-it-works" />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="home-airport" />
      <Stack.Screen name="travel-style" />
      <Stack.Screen name="preferences" />
      <Stack.Screen name="budget" />
      <Stack.Screen name="completion" />
    </Stack>
  );
}