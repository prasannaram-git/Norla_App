import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';
import { ResultsScreen } from '../screens/ResultsScreen';
import { PrivacyPolicyScreen } from '../screens/PrivacyPolicyScreen';
import { getSession, getProfile } from '../lib/storage';
import { COLORS } from '../lib/theme';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Results: { scanData: any };
  PrivacyPolicy: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

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
      <View style={s.splash}>
        <Image source={require('../../assets/norla-icon-nobg.png')} style={s.logo} resizeMode="contain" />
        <ActivityIndicator size="small" color={COLORS.textQuaternary} style={{ marginTop: 24 }} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {loggedIn ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="Results" component={ResultsScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="Auth" component={AuthStack} />
          </>
        ) : (
          <>
            <Stack.Screen name="Auth" component={AuthStack} />
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="Results" component={ResultsScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ animation: 'slide_from_right' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const s = StyleSheet.create({
  splash: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white },
  logo: { width: 64, height: 64, marginBottom: 8 },
});
