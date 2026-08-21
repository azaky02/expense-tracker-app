import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Box } from '@/components/Box';
import { bootstrapDb } from '@/db';
import { ensureDefaultCashAccount } from '@/features/accounts/api';
import { OnboardingScreen } from '@/features/onboarding/components/OnboardingScreen';
import { runRecurringCatchUp } from '@/features/recurring/engine';
import { UnlockScreen } from '@/features/security/components/UnlockScreen';
import { useAutoLock } from '@/features/security/useAutoLock';
import '@/i18n';
import { queryClient } from '@/lib/queryClient';
import { syncRtlOnBoot } from '@/lib/locale';
import { useNotificationReconciliation } from '@/lib/notifications/useNotificationReconciliation';
import { useLockStore } from '@/state/useLockStore';
import { useSettingsStore } from '@/state/useSettingsStore';
import { ThemeProvider } from '@/theme/ThemeProvider';

SplashScreen.preventAutoHideAsync();

function AppGate() {
  const hasOnboarded = useSettingsStore((s) => s.hasOnboarded);
  const appLockEnabled = useSettingsStore((s) => s.appLockEnabled);
  const isUnlocked = useLockStore((s) => s.isUnlocked);
  useAutoLock();
  useNotificationReconciliation();

  if (!hasOnboarded) {
    return <OnboardingScreen />;
  }

  if (appLockEnabled && !isUnlocked) {
    return <UnlockScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="transactions/add" options={{ presentation: 'modal' }} />
      <Stack.Screen name="transactions/[id]/edit" options={{ presentation: 'modal' }} />
      <Stack.Screen name="accounts/add" options={{ presentation: 'modal' }} />
      <Stack.Screen name="accounts/[id]/edit" options={{ presentation: 'modal' }} />
      <Stack.Screen name="transfers/add" options={{ presentation: 'modal' }} />
      <Stack.Screen name="custody/index" />
      <Stack.Screen name="custody/[id]/index" />
      <Stack.Screen name="recurring/index" />
      <Stack.Screen name="recurring/add" options={{ presentation: 'modal' }} />
      <Stack.Screen name="recurring/[id]/edit" options={{ presentation: 'modal' }} />
      <Stack.Screen name="goals/index" />
      <Stack.Screen name="goals/add" options={{ presentation: 'modal' }} />
      <Stack.Screen name="goals/[id]/index" />
      <Stack.Screen name="bills/index" />
      <Stack.Screen name="forecast/index" />
      <Stack.Screen name="search/index" />
    </Stack>
  );
}

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const language = useSettingsStore((s) => s.language);

  useEffect(() => {
    let cancelled = false;
    async function prepare() {
      syncRtlOnBoot(language);
      await bootstrapDb();
      await ensureDefaultCashAccount();
      await runRecurringCatchUp();
      if (!cancelled) {
        setIsReady(true);
        await SplashScreen.hideAsync();
      }
    }
    void prepare();
    return () => {
      cancelled = true;
    };
    // Only run once at boot — subsequent language changes go through applyLanguageAndRestart().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ThemeProvider must wrap this too — Box/Text call useTheme() internally, which throws
  // without a ThemeProvider ancestor (this is exactly what happened when the loading state
  // was rendered before the provider tree below existed).
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>{isReady ? <AppGate /> : <Box flex={1} backgroundColor="mainBackground" />}</ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
