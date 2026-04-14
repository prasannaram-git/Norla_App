import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  StatusBar,
  ActivityIndicator,
  Text,
  Image,
  BackHandler,
  Platform,
  SafeAreaView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Constants from 'expo-constants';

// Server URL — Change this to your production URL when deploying
const SERVER_URL = Constants.expoConfig?.extra?.serverUrl || 'http://10.129.115.191:3000';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [error, setError] = useState(false);
  const webViewRef = useRef<WebView>(null);

  // Handle Android back button
  useEffect(() => {
    if (Platform.OS === 'android') {
      const handler = BackHandler.addEventListener('hardwareBackPress', () => {
        if (webViewRef.current) {
          webViewRef.current.goBack();
          return true;
        }
        return false;
      });
      return () => handler.remove();
    }
  }, []);

  // Show splash for 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return (
      <View style={styles.splashContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0D9488" />
        <Image
          source={require('./assets/icon.png')}
          style={styles.splashLogo}
          resizeMode="contain"
        />
        <Text style={styles.splashTitle}>Norla</Text>
        <Text style={styles.splashSubtitle}>Smarter Nutrition Insight</Text>
        <ActivityIndicator size="small" color="#ffffff" style={styles.splashSpinner} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <Image
          source={require('./assets/icon.png')}
          style={styles.errorLogo}
          resizeMode="contain"
        />
        <Text style={styles.errorTitle}>Cannot Connect</Text>
        <Text style={styles.errorText}>
          Make sure the Norla server is running at:{'\n'}
          {SERVER_URL}
        </Text>
        <Text
          style={styles.retryButton}
          onPress={() => {
            setError(false);
            setLoading(true);
          }}
        >
          Retry
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" translucent={false} />
      <WebView
        ref={webViewRef}
        source={{ uri: SERVER_URL }}
        style={styles.webview}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={() => setError(true)}
        onHttpError={(e) => {
          if (e.nativeEvent.statusCode >= 500) setError(true);
        }}
        // Enable native features
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsBackForwardNavigationGestures={true}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback={true}
        // Camera access
        mediaCapturePermissionGrantType="grant"
        allowFileAccess={true}
        // Performance
        cacheEnabled={true}
        startInLoadingState={false}
        // Viewport
        scalesPageToFit={true}
        // User agent
        applicationNameForUserAgent="NorlaApp/1.0"
      />
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#0D9488" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  // Splash Screen
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0D9488',
  },
  splashLogo: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  splashTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -1,
  },
  splashSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    fontWeight: '500',
  },
  splashSpinner: {
    marginTop: 40,
  },
  // Error Screen
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 32,
  },
  errorLogo: {
    width: 64,
    height: 64,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  retryButton: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    backgroundColor: '#0D9488',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    overflow: 'hidden',
  },
});
