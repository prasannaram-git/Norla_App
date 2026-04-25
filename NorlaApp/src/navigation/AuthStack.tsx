import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { IntroSliderScreen } from '../screens/auth/IntroScreen';
import { PhoneScreen } from '../screens/auth/PhoneScreen';
import { OTPScreen } from '../screens/auth/OTPScreen';
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';

export type AuthStackParamList = {
  Intro: undefined;
  Phone: undefined;
  OTP: { phone: string; devCode?: string };
  Onboarding: { phone: string };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="Intro" component={IntroSliderScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="Phone" component={PhoneScreen} />
      <Stack.Screen name="OTP" component={OTPScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
    </Stack.Navigator>
  );
}
