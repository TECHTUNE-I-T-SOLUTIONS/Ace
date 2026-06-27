import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { apiJson } from './api';
import { useAuth } from './auth-context';

export function usePushTokenRegistration() {
  const { user } = useAuth();
  const registeredRef = useRef(false);

  useEffect(() => {
    if (!user || registeredRef.current) return;

    async function register() {
      try {
        // Configure how notifications are shown when app is in foreground
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });

        // Request permissions
        const perms: any = await Notifications.getPermissionsAsync();
        let hasPermission = perms.granted;

        if (!hasPermission) {
          const requested: any = await Notifications.requestPermissionsAsync();
          hasPermission = requested.granted;
        }

        if (!hasPermission) {
          console.log('Push notification permissions not granted');
          return;
        }

        // Get Expo push token
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: process.env.EXPO_PUBLIC_PROJECT_ID ?? 'ace-mobile',
        });

        const expoPushToken = tokenData.data;

        // Register with backend
        await apiJson('/notifications/push-token', 'POST', {
          token: expoPushToken,
          platform: Platform.OS,
        });

        registeredRef.current = true;
        console.log('Push token registered successfully');
      } catch (error: any) {
        // Expo Go doesn't support push notifications (SDK 53+)
        // This is expected - push tokens will work in a development build
        if (error?.message?.includes('MISSING_INSTANCEID_SERVICE') || error?.message?.includes('Fetching the token failed')) {
          console.log('Push notifications require a development build. Skipping token registration.');
        } else {
          console.error('Failed to register push token:', error);
        }
      }
    }

    // Create notification channel for Android
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('ace-notifications', {
        name: 'ACE Notifications',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#214FCE',
        sound: 'default',
      }).catch(console.error);
    }

    register();
  }, [user]);
}
