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
        await Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });

        // Request permissions immediately on app start
        const perms: any = await Notifications.getPermissionsAsync();
        let hasPermission = perms.granted;

        if (!hasPermission) {
          console.log('Requesting push notification permissions...');
          const requested: any = await Notifications.requestPermissionsAsync();
          hasPermission = requested.granted;
          
          if (hasPermission) {
            console.log('Push notification permissions granted');
          } else {
            console.log('Push notification permissions denied by user');
          }
        }

        if (!hasPermission) {
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
        } else if (error?.message?.includes('SQLiteException') || error?.message?.includes('database')) {
          console.warn('Push notification database error - notifications may be limited:', error.message);
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
      }).catch((err: any) => {
        if (err?.message?.includes('SQLiteException') || err?.message?.includes('database')) {
          console.warn('Notification channel setup failed due to database error:', err.message);
        } else {
          console.error('Failed to set notification channel:', err);
        }
      });
    }

    register();
  }, [user]);
}

// Hook to manually trigger push token registration (for settings toggle)
export function usePushTokenManager() {
  const { user } = useAuth();
  const registeredRef = useRef(false);

  const registerToken = async () => {
    if (!user) {
      console.log('No user logged in, cannot register push token');
      return false;
    }

    try {
      // Request permissions
      const perms: any = await Notifications.getPermissionsAsync();
      let hasPermission = perms.granted;

      if (!hasPermission) {
        console.log('Requesting push notification permissions from settings...');
        const requested: any = await Notifications.requestPermissionsAsync();
        hasPermission = requested.granted;
        
        if (hasPermission) {
          console.log('Push notification permissions granted from settings');
        } else {
          console.log('Push notification permissions denied from settings');
          return false;
        }
      }

      if (!hasPermission) {
        return false;
      }

      // Get Expo push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID ?? 'ace-mobile',
      });

      const expoPushToken = tokenData.data;

      console.log('Registering push token with backend:', expoPushToken.substring(0, 20) + '...');

      // Register with backend
      await apiJson('/notifications/push-token', 'POST', {
        token: expoPushToken,
        platform: Platform.OS,
      });

      registeredRef.current = true;
      console.log('Push token registered successfully from settings');
      return true;
    } catch (error: any) {
      console.error('Failed to register push token:', error);
      
      // Provide more detailed error information
      if (error?.message?.includes('MISSING_INSTANCEID_SERVICE') || error?.message?.includes('Fetching the token failed')) {
        console.log('Push notifications require a development build, not Expo Go.');
        throw new Error('Push notifications require a development build. Please use a development build instead of Expo Go.');
      } else if (error?.message?.includes('SQLiteException') || error?.message?.includes('database')) {
        console.warn('Push notification database error:', error.message);
        throw new Error('Database error. Please try again.');
      } else if (error?.response?.data?.message) {
        // Backend error
        throw new Error(error.response.data.message || 'Failed to register with server');
      } else if (error?.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Failed to register push notifications. Please try again.');
      }
    }
  };

  return { registerToken };
}
