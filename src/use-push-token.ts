import { useEffect, useRef, useState } from 'react';
import { Platform, AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { apiJson } from './api';
import { useAuth } from './auth-context';

const PUSH_TOKEN_STORAGE_KEY = 'push_token_registered';
const PUSH_TOKEN_VALUE_KEY = 'push_token_value';
const RETRY_ATTEMPTS_KEY = 'push_token_retry_attempts';
const MAX_RETRY_ATTEMPTS = 5;
const RETRY_DELAY_MS = 3000;

// Configure foreground notification handler once at module level
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

function getProjectId(): string {
  try {
    // Try to get from app config extra
    const config = Constants.expoConfig;
    const projectId = config?.extra?.eas?.projectId;
    if (projectId) return projectId;
  } catch {}
  return process.env.EXPO_PUBLIC_PROJECT_ID || '82fc60f5-f42e-4407-9e3b-4f2f67a45c96';
}

export function usePushTokenRegistration() {
  const { user } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Create notification channel for Android ONCE
  useEffect(() => {
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('ace-notifications', {
        name: 'ACE Notifications',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#214FCE',
        sound: 'notifications.wav',
      }).catch((err: any) => {
        console.warn('Notification channel setup failed:', err?.message || err);
      });
    }
  }, []);

  useEffect(() => {
    if (!user || isRegistering) return;

    async function register() {
      try {
        setIsRegistering(true);

        // Check if we already have a registered token for this user
        const storedToken = await AsyncStorage.getItem(PUSH_TOKEN_VALUE_KEY);
        const registeredForUser = await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
        
        // If already registered and token hasn't changed, skip
        if (user && registeredForUser === user.id && storedToken) {
          try {
            const projectId = getProjectId();
            const tokenData = await Notifications.getExpoPushTokenAsync({
              projectId,
            });
            const newToken = tokenData.data;
            if (newToken !== storedToken) {
              await registerTokenWithBackend(newToken);
            }
            setIsRegistering(false);
            return;
          } catch {
            // Will re-register below
          }
        }

        // Request permissions
        const { granted } = await Notifications.requestPermissionsAsync();
        if (!granted) {
          console.log('Push notification permissions denied');
          setIsRegistering(false);
          return;
        }

        // Get Expo push token
        const projectId = getProjectId();
        let tokenData;
        try {
          tokenData = await Notifications.getExpoPushTokenAsync({
            projectId,
          });
        } catch (tokenError: any) {
          console.warn('Failed to get Expo push token:', tokenError?.message);
          setIsRegistering(false);
          return;
        }

        const expoPushToken = tokenData.data;
        console.log('Push token obtained:', expoPushToken?.substring(0, 20) + '...');
        await registerTokenWithBackend(expoPushToken);
      } catch (error: any) {
        console.error('Push token registration failed:', error?.message);
        
        // Retry with exponential backoff
        const retryAttempts = await AsyncStorage.getItem(RETRY_ATTEMPTS_KEY);
        const currentRetries = retryAttempts ? parseInt(retryAttempts, 10) : 0;

        if (currentRetries < MAX_RETRY_ATTEMPTS) {
          console.log(`Retrying push token registration (${currentRetries + 1}/${MAX_RETRY_ATTEMPTS})...`);
          await AsyncStorage.setItem(RETRY_ATTEMPTS_KEY, String(currentRetries + 1));
          
          const delay = RETRY_DELAY_MS * Math.pow(2, currentRetries);
          retryTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              setIsRegistering(false);
              register();
            }
          }, delay);
          return;
        } else {
          console.log('Max retry attempts reached for push token');
          await AsyncStorage.removeItem(RETRY_ATTEMPTS_KEY);
        }
      } finally {
        if (mountedRef.current) setIsRegistering(false);
      }
    }

    async function registerTokenWithBackend(token: string) {
      try {
        await apiJson('/notifications/push-token', 'POST', {
          token,
          platform: Platform.OS,
        });

        if (user) {
          await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, user.id);
        }
        await AsyncStorage.setItem(PUSH_TOKEN_VALUE_KEY, token);
        await AsyncStorage.removeItem(RETRY_ATTEMPTS_KEY);
        console.log('Push token registered with backend successfully');
      } catch (err: any) {
        console.error('Failed to register token with backend:', err?.message);
        throw err;
      }
    }

    register();

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [user]);

  // Re-attempt when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        AsyncStorage.removeItem(RETRY_ATTEMPTS_KEY);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);
}

// Hook to manually trigger push token registration (for settings toggle)
export function usePushTokenManager() {
  const { user } = useAuth();

  const registerToken = async () => {
    if (!user) {
      console.log('No user logged in, cannot register push token');
      return false;
    }

    try {
      // Clear stored registration to force re-registration
      await AsyncStorage.removeItem(PUSH_TOKEN_STORAGE_KEY);
      await AsyncStorage.removeItem(PUSH_TOKEN_VALUE_KEY);
      await AsyncStorage.removeItem(RETRY_ATTEMPTS_KEY);
      
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
      const projectId = process.env.EXPO_PUBLIC_PROJECT_ID || '82fc60f5-f42e-4407-9e3b-4f2f67a45c96';
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });

      const expoPushToken = tokenData.data;

      console.log('Registering push token with backend:', expoPushToken.substring(0, 20) + '...');

      // Register with backend
      await apiJson('/notifications/push-token', 'POST', {
        token: expoPushToken,
        platform: Platform.OS,
      });

      // Store successful registration
      await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, user.id);
      await AsyncStorage.setItem(PUSH_TOKEN_VALUE_KEY, expoPushToken);
      
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
