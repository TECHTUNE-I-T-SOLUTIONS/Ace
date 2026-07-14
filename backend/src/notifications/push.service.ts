import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  /** Send push via Expo Push API (for Expo Go / managed workflow) */
  async sendExpoPush(expoPushToken: string, title: string, body: string, data?: Record<string, string>) {
    try {
      const accessToken = process.env.EXPO_ACCESS_TOKEN;
      if (!accessToken) {
        this.logger.warn('EXPO_ACCESS_TOKEN not set - push notifications may not work');
      }

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
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

  /** Send via Expo Push API (mobile app uses Expo tokens) */
  async sendSmart(token: string, title: string, body: string, data?: Record<string, string>) {
    this.logger.log(`Sending push notification: title="${title}", body="${body}" to token ${token.substring(0, 15)}...`);
    const result = await this.sendExpoPush(token, title, body, data);
    if (result && result.data) {
      this.logger.log(`Push notification result: ${JSON.stringify(result.data)}`);
    }
    return result;
  }
}