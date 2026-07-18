import { useEffect, useRef, useState } from 'react';
import { Platform, AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiJson } from './api';
import { useAuth } from './auth-context';

const PUSH_TOKEN_STORAGE_KEY = 'push_token_registered';
const PUSH_TOKEN_VALUE_KEY = 'push_token_value';
const RETRY_ATTEMPTS_KEY = 'push_token_retry_attempts';
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 5000; // 5 seconds

export function usePushTokenRegistration() {
  const { user } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user || isRegistering) return;

    async function register() {
      try {
        setIsRegistering(true);
        
        // Check if we already have a registered token for this user
        const storedToken = await AsyncStorage.getItem(PUSH_TOKEN_VALUE_KEY);
        const registeredForUser = await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
        
        if (user && registeredForUser === user.id && storedToken) {
          console.log('Push token already registered for this user, verifying...');
          // Verify the token is still valid by trying to get a new one
          try {
            const projectId = process.env.EXPO_PUBLIC_PROJECT_ID || '82fc60f5-f42e-4407-9e3b-4f2f67a45c96';
            const tokenData = await Notifications.getExpoPushTokenAsync({
              projectId: projectId,
            });
            
            const newToken = tokenData.data;
            
            // If token changed, re-register
            if (newToken !== storedToken) {
              console.log('Push token changed, re-registering...');
              await registerTokenWithBackend(newToken);
            } else {
              console.log('Push token verified and still valid');
            }
            setIsRegistering(false);
            return;
          } catch (verifyError) {
            console.log('Token verification failed, will re-register:', verifyError);
          }
        }

        // Configure how notifications are shown when app is in foreground
        await Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
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
            setIsRegistering(false);
            return;
          }
        }

        if (!hasPermission) {
          setIsRegistering(false);
          return;
        }

        // Get Expo push token
        const projectId = process.env.EXPO_PUBLIC_PROJECT_ID || '82fc60f5-f42e-4407-9e3b-4f2f67a45c96';
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: projectId,
        });

        const expoPushToken = tokenData.data;
        console.log('Got push token:', expoPushToken.substring(0, 20) + '...');

        await registerTokenWithBackend(expoPushToken);
        
      } catch (error: any) {
        console.error('Failed to register push token:', error);
        
        // Retry logic for production builds
        if (!error?.message?.includes('MISSING_INSTANCEID_SERVICE') && 
            !error?.message?.includes('Fetching the token failed')) {
          retryCountRef.current++;
          const retryAttempts = await AsyncStorage.getItem(RETRY_ATTEMPTS_KEY);
          const currentRetries = retryAttempts ? parseInt(retryAttempts, 10) : 0;
          
          if (currentRetries < MAX_RETRY_ATTEMPTS) {
            console.log(`Retrying push token registration (attempt ${currentRetries + 1}/${MAX_RETRY_ATTEMPTS})...`);
            await AsyncStorage.setItem(RETRY_ATTEMPTS_KEY, String(currentRetries + 1));
            
            retryTimeoutRef.current = setTimeout(() => {
              setIsRegistering(false);
              register();
            }, RETRY_DELAY_MS * (currentRetries + 1)) as unknown as NodeJS.Timeout; // Exponential backoff
            return;
          } else {
            console.log('Max retry attempts reached for push token registration');
            await AsyncStorage.removeItem(RETRY_ATTEMPTS_KEY);
          }
        }
        
        // Expo Go doesn't support push notifications (SDK 53+)
        if (error?.message?.includes('MISSING_INSTANCEID_SERVICE') || error?.message?.includes('Fetching the token failed')) {
          console.log('Push notifications require a development build. Skipping token registration.');
        } else if (error?.message?.includes('SQLiteException') || error?.message?.includes('database')) {
          console.warn('Push notification database error - notifications may be limited:', error.message);
        }
      } finally {
        setIsRegistering(false);
      }
    }

    async function registerTokenWithBackend(token: string) {
      // Register with backend
      await apiJson('/notifications/push-token', 'POST', {
        token: token,
        platform: Platform.OS,
      });

      // Store successful registration
      if (user) {
        await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, user.id);
        console.log('Push token registered successfully for user:', user.id);
      }
      await AsyncStorage.setItem(PUSH_TOKEN_VALUE_KEY, token);
      await AsyncStorage.removeItem(RETRY_ATTEMPTS_KEY);
      retryCountRef.current = 0;
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

    // Cleanup retry timeout on unmount
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [user]);

  // Re-register when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && user && !isRegistering) {
        console.log('App came to foreground, checking push token registration...');
        // Reset retry count when app comes to foreground to allow new attempts
        AsyncStorage.removeItem(RETRY_ATTEMPTS_KEY);
        retryCountRef.current = 0;
      }
    });

    return () => {
      subscription.remove();
    };
  }, [user, isRegistering]);
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
