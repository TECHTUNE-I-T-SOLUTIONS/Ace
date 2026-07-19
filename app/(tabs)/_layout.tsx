import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/theme';

export default function TabsLayout() {
  const colors = useColors();
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          height: 78,
          borderTopWidth: 0,
          backgroundColor: colors.surface,
          paddingTop: 10,
          paddingBottom: 12,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarIcon: ({ color, size, focused }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            dashboard: focused ? 'home' : 'home-outline',
            calendar: focused ? 'calendar' : 'calendar-outline',
            tasks: focused ? 'checkmark-circle' : 'checkmark-circle-outline',
            diary: focused ? 'book' : 'book-outline',
            profile: focused ? 'person' : 'person-outline',
          };
          return <Ionicons name={icons[route.name]} size={size ?? 22} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="calendar" options={{ title: 'Calendar' }} />
      <Tabs.Screen name="tasks" options={{ title: 'Tasks' }} />
      <Tabs.Screen name="diary" options={{ title: 'Diary' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}