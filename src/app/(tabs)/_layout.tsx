import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';

import { Box } from '@/components/Box';
import { useAppTheme } from '@/theme/ThemeProvider';

function FabTabButton() {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push('/transactions/add')}
      style={{ top: -14, alignItems: 'center', justifyContent: 'center', flex: 1 }}
    >
      <Box
        width={56}
        height={56}
        borderRadius="round"
        backgroundColor="accent"
        alignItems="center"
        justifyContent="center"
        style={{ shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 }}
      >
        <Ionicons name="add" size={28} color="white" />
      </Box>
    </Pressable>
  );
}

export default function TabsLayout() {
  const { t } = useTranslation();
  const theme = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.tabIconSelected,
        tabBarInactiveTintColor: theme.colors.tabIconDefault,
        tabBarStyle: { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('nav.home'),
          tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="transactions/index"
        options={{
          title: t('nav.transactions'),
          tabBarIcon: ({ color, size }) => <Ionicons name="list" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: '',
          tabBarButton: () => <FabTabButton />,
        }}
        listeners={{
          tabPress: (e) => e.preventDefault(),
        }}
      />
      <Tabs.Screen
        name="cards/index"
        options={{
          title: t('nav.cards'),
          tabBarIcon: ({ color, size }) => <Ionicons name="card" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings/index"
        options={{
          title: t('nav.settings'),
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
