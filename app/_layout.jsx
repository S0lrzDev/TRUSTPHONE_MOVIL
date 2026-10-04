import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Image, StyleSheet, Animated } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

// Evitar que la splash screen nativa se oculte automáticamente
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [splashAnimationComplete, setSplashAnimationComplete] = useState(false);
  const fadeAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    async function prepare() {
      try {
        // Simular carga de recursos (puedes agregar carga real aquí)
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // Ocultar la splash screen nativa
      await SplashScreen.hideAsync();
      // Animar la desaparición de nuestra splash personalizada
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setSplashAnimationComplete(true);
      });
    }
  }, [appIsReady, fadeAnim]);

  useEffect(() => {
    if (appIsReady) {
      onLayoutRootView();
    }
  }, [appIsReady, onLayoutRootView]);

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      {/* Contenido principal de la app */}
      {appIsReady && (
        <>
          <Stack screenOptions={{ headerShown: false }} />
          <StatusBar style="auto" />
        </>
      )}

      {/* Splash Screen personalizada con el logo */}
      {!splashAnimationComplete && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            splashStyles.container,
            { opacity: fadeAnim },
          ]}
        >
          <Image
            source={require('../assets/images/trustphone-logo.png')}
            style={splashStyles.logo}
            resizeMode="contain"
          />
          <Text style={splashStyles.title}>TrustPhone</Text>
          <Text style={splashStyles.subtitle}>Celulares verificados y confiables</Text>
        </Animated.View>
      )}
    </View>
  );
}

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 180,
    height: 180,
  },
  title: {
    marginTop: 24,
    fontSize: 30,
    fontWeight: '800',
    color: '#1E3A75',
    letterSpacing: 0.5,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#64748B',
  },
});
