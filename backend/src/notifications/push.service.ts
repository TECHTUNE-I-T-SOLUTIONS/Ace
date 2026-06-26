import { Injectable, Logger } from '@nestjs/common';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getMessaging, Message, MulticastMessage } from 'firebase-admin/messaging';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private initialized = false;
  private firebaseApp: App | null = null;

  constructor() {
    this.initFirebase();
  }

  private initFirebase() {
    try {
      const serviceAccountPath =
        process.env.FIREBASE_ADMIN_SDK_PATH ??
        'D:\\Codes\\Ace\\keys\\studyace-648ce-firebase-adminsdk-fbsvc-b524190377.json';

      if (getApps().length === 0) {
        const serviceAccount = require(serviceAccountPath);
        this.firebaseApp = initializeApp({
          credential: cert(serviceAccount),
        });
        this.logger.log('Firebase Admin initialized for push notifications');
      } else {
        this.firebaseApp = getApps()[0];
      }
      this.initialized = true;
    } catch (error) {
      this.logger.error(
        `Failed to initialize Firebase Admin: ${(error as Error).message}. Push notifications disabled.`,
      );
    }
  }

  async sendPush(token: string, title: string, body: string, data?: Record<string, string>) {
    if (!this.initialized) {
      this.logger.warn('Push not sent: Firebase not initialized');
      return;
    }

    try {
      const message: Message = {
        token,
        notification: { title, body },
        android: {
          priority: 'high',
          notification: {
            channelId: 'ace-notifications',
            priority: 'high',
            sound: 'default',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          },
        },
        data: data ?? {},
      };

      const response = await getMessaging(this.firebaseApp!).send(message);
      this.logger.log(`Push sent to ${token.substring(0, 10)}...: ${response}`);
      return response;
    } catch (error) {
      const err = error as Error & { code?: string };
      if (err.code === 'messaging/registration-token-not-registered') {
        this.logger.warn(`Invalid push token: ${token.substring(0, 10)}...`);
      } else {
        this.logger.error(`Push send failed: ${err.message}`);
      }
    }
  }

  async sendMulticast(tokens: string[], title: string, body: string, data?: Record<string, string>) {
    if (!this.initialized || tokens.length === 0) return;

    try {
      const message: MulticastMessage = {
        tokens,
        notification: { title, body },
        android: {
          priority: 'high',
          notification: {
            channelId: 'ace-notifications',
            priority: 'high',
            sound: 'default',
          },
        },
        data: data ?? {},
      };

      const response = await getMessaging(this.firebaseApp!).sendEachForMulticast(message);
      this.logger.log(
        `Multicast push: ${response.successCount} success, ${response.failureCount} failures out of ${tokens.length}`,
      );

      response.responses.forEach((resp: any, idx: number) => {
        if (!resp.success) {
          this.logger.warn(
            `Push failed for token ${tokens[idx].substring(0, 10)}...: ${resp.error?.message}`,
          );
        }
      });

      return response;
    } catch (error) {
      this.logger.error(`Multicast push failed: ${(error as Error).message}`);
    }
  }

  /** Send push via Expo Push API (for Expo Go / managed workflow) */
  async sendExpoPush(expoPushToken: string, title: string, body: string, data?: Record<string, string>) {
    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN ?? ''}`,
        },
        body: JSON.stringify({
          to: expoPushToken,
          title,
          body,
          data: data ?? {},
          sound: 'default',
          priority: 'high',
          channelId: 'ace-notifications',
        }),
      });

      const result = await response.json();
      if (response.ok) {
        this.logger.log(`Expo push sent to ${expoPushToken.substring(0, 15)}...`);
      } else {
        this.logger.error(`Expo push failed: ${JSON.stringify(result)}`);
      }
      return result;
    } catch (error) {
      this.logger.error(`Expo push error: ${(error as Error).message}`);
    }
  }

  /** Smart send: tries Firebase first, falls back to Expo if token starts with Expo prefix */
  async sendSmart(token: string, title: string, body: string, data?: Record<string, string>) {
    if (token.startsWith('ExponentPushToken') || token.startsWith('ExpoPushToken')) {
      return this.sendExpoPush(token, title, body, data);
    }
    return this.sendPush(token, title, body, data);
  }
}