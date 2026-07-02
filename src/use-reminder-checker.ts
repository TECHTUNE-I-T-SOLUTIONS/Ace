import { useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { apiGet } from './api';
import { showError } from './toast';

export function useReminderChecker(checkInterval: number = 5 * 60 * 1000) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastCheckRef = useRef<number>(0);

  const checkReminders = useCallback(async () => {
    try {
      const now = Date.now();
      // Prevent checking more than once per minute
      if (now - lastCheckRef.current < 60 * 1000) {
        return;
      }
      lastCheckRef.current = now;

      const reminders = await apiGet<any[]>('/reminders/check');
      
      if (reminders && reminders.length > 0) {
        for (const reminder of reminders) {
          // Show local notification
          await Notifications.scheduleNotificationAsync({
            content: {
              title: reminder.title,
              body: reminder.body,
              sound: 'default',
              data: reminder.data,
            },
            trigger: null, // Show immediately
          });
        }
      }
    } catch (error: any) {
      // Silently fail - background checks are optional
      console.log('Background reminder check failed:', error.message);
    }
  }, []);

  useEffect(() => {
    // Only run on native platforms, not in Expo Go
    if (Platform.OS === 'web' || __DEV__) {
      return;
    }

    // Check immediately on mount
    checkReminders();

    // Set up interval
    intervalRef.current = setInterval(checkReminders, checkInterval);

    // Set up app state listener
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      subscription.remove();
    };
  }, [checkReminders, checkInterval]);

  return { checkReminders };
}