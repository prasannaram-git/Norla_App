import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform } from 'react-native';
import { DashboardScreen } from '../screens/DashboardScreen';
import { StatsScreen } from '../screens/StatsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { GuidedCameraScreen } from '../screens/scan/GuidedCameraScreen';
import { PhotoReviewScreen } from '../screens/scan/PhotoUploadScreen';
import { QuestionnaireScreen } from '../screens/scan/QuestionnaireScreen';
import { ProcessingScreen } from '../screens/scan/ProcessingScreen';
import { useTheme } from '../lib/ThemeContext';

export type ScanStackParamList = {
  GuidedCamera: { step?: number; images?: Record<string, string> } | undefined;
  PhotoReview: { images: Record<string, string> };
  Questionnaire: { images: Record<string, string> };
  Processing: { images: Record<string, string>; questionnaire: Record<string, any> };
};

const ScanStack = createNativeStackNavigator<ScanStackParamList>();
function ScanNavigator() {
  return (
    <ScanStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <ScanStack.Screen name="GuidedCamera" component={GuidedCameraScreen} />
      <ScanStack.Screen name="PhotoReview" component={PhotoReviewScreen} />
      <ScanStack.Screen name="Questionnaire" component={QuestionnaireScreen} />
      <ScanStack.Screen name="Processing" component={ProcessingScreen} />
    </ScanStack.Navigator>
  );
}

const Tab = createBottomTabNavigator();

export function MainTabs() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarIcon: () => null,
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 80 : 56,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 10,
          backgroundColor: colors.bg,
          borderTopWidth: 1,
          borderTopColor: colors.hairline,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textQuaternary,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600', letterSpacing: 0.3 },
        tabBarIconStyle: { display: 'none' },
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Scan" component={ScanNavigator} options={{ tabBarLabel: 'Scan' }} />
      <Tab.Screen name="Stats" component={StatsScreen} options={{ tabBarLabel: 'Stats' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}
