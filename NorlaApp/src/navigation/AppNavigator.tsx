import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';
import { ResultsScreen } from '../screens/ResultsScreen';
import { PrivacyPolicyScreen } from '../screens/PrivacyPolicyScreen';
import { NutritionPlanScreen } from '../screens/NutritionPlanScreen';
import { getSession, getProfile } from '../lib/storage';
import { useTheme } from '../lib/ThemeContext';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Results: { scanData: any };
  PrivacyPolicy: undefined;
  NutritionPlan: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const { colors, isDark } = useTheme();

  useEffect(() => {
    (async () => {
      try {
        const s = await getSession();
        const p = await getProfile();
        setLoggedIn(!!(s && p?.name));
      } catch { setLoggedIn(false); }
      setReady(true);
    })();
  }, []);

  if (!ready) {
    return (
      <View style={[s.splash, { backgroundColor: colors.bg }]}>
        <Image source={require('../../assets/norla-icon-nobg.png')} style={s.logo} resizeMode="contain" />
        <ActivityIndicator size="small" color={colors.textQuaternary} style={{ marginTop: 24 }} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={{
      dark: isDark,
      colors: { primary: colors.brand, background: colors.bg, card: colors.bg, text: colors.text, border: colors.hairline, notification: colors.brand },
      fonts: { regular: { fontFamily: 'System', fontWeight: '400' }, medium: { fontFamily: 'System', fontWeight: '500' }, bold: { fontFamily: 'System', fontWeight: '700' }, heavy: { fontFamily: 'System', fontWeight: '900' } },
    }}>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {loggedIn ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="Results" component={ResultsScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="NutritionPlan" component={NutritionPlanScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="Auth" component={AuthStack} />
          </>
        ) : (
          <>
            <Stack.Screen name="Auth" component={AuthStack} />
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="Results" component={ResultsScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="NutritionPlan" component={NutritionPlanScreen} options={{ animation: 'slide_from_right' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const s = StyleSheet.create({
  splash: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logo: { width: 64, height: 64, marginBottom: 8 },
});
