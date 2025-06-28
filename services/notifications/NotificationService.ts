import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

interface NotificationData {
  type: 'price_alert' | 'flight_update' | 'booking_reminder' | 'general';
  trackerId?: string;
  flightId?: string;
  alertId?: string;
  [key: string]: any;
}

interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  data: NotificationData;
  scheduledTime: Date;
  recurring?: boolean;
  interval?: number; // in milliseconds
}

/**
 * NotificationService handles all push notifications for the travel app
 * including price alerts, flight updates, and booking reminders
 */
class NotificationService {
  private isInitialized = false;
  private notificationToken: string | null = null;
  private scheduledNotifications: Map<string, ScheduledNotification> = new Map();

  private readonly STORAGE_KEY = '@scheduled_notifications';

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the notification service
   */
  private async initialize(): Promise<void> {
    try {
      // Check if running in Expo Go (limited notification support)
      const isExpoGo = Constants.appOwnership === 'expo';
      
      if (isExpoGo) {
        console.warn('⚠️ Running in Expo Go - Push notifications have limited functionality');
        this.isInitialized = true;
        return;
      }

      // Configure notification behavior
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      // Request permissions
      await this.requestPermissions();

      // Set up notification channels (Android)
      if (Platform.OS === 'android') {
        await this.setupNotificationChannels();
      }

      // Get notification token
      await this.getNotificationToken();

      // Load scheduled notifications
      await this.loadScheduledNotifications();

      // Set up notification response handlers
      this.setupNotificationHandlers();

      this.isInitialized = true;
      console.log('NotificationService initialized successfully');
    } catch (error) {
      console.error('Error initializing NotificationService:', error);
    }
  }

  /**
   * Request notification permissions
   */
  private async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Notification permissions not granted');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Set up notification channels for Android
   */
  private async setupNotificationChannels(): Promise<void> {
    try {
      // Price Alerts Channel
      await Notifications.setNotificationChannelAsync('price-alerts', {
        name: 'Price Alerts',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B35',
        sound: 'default',
        enableVibrate: true,
        enableLights: true,
        showBadge: true,
        description: 'Notifications for flight price drops and alerts',
      });

      // Flight Updates Channel
      await Notifications.setNotificationChannelAsync('flight-updates', {
        name: 'Flight Updates',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 500],
        lightColor: '#007AFF',
        sound: 'default',
        enableVibrate: true,
        enableLights: true,
        showBadge: true,
        description: 'Important flight status updates and changes',
      });

      // Booking Reminders Channel
      await Notifications.setNotificationChannelAsync('booking-reminders', {
        name: 'Booking Reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: 'default',
        showBadge: true,
        description: 'Reminders for check-in and travel preparation',
      });

      // General Channel
      await Notifications.setNotificationChannelAsync('general', {
        name: 'General',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: 'default',
        showBadge: true,
        description: 'General app notifications and updates',
      });
    } catch (error) {
      console.error('Error setting up notification channels:', error);
    }
  }

  /**
   * Get push notification token
   */
  private async getNotificationToken(): Promise<string | null> {
    try {
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      this.notificationToken = token;
      console.log('Notification token:', token);
      return token;
    } catch (error) {
      console.error('Error getting notification token:', error);
      return null;
    }
  }

  /**
   * Set up notification response handlers
   */
  private setupNotificationHandlers(): void {
    // Handle notification received while app is in foreground
    Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
      this.handleNotificationReceived(notification);
    });

    // Handle notification tapped/clicked
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification response:', response);
      this.handleNotificationResponse(response);
    });
  }

  /**
   * Send immediate push notification
   */
  async sendNotification(
    title: string,
    body: string,
    data: NotificationData = { type: 'general' },
    options: {
      channelId?: string;
      priority?: 'default' | 'high' | 'max';
      sound?: boolean;
      vibrate?: boolean;
      badge?: number;
    } = {}
  ): Promise<string | null> {
    try {
      if (!this.isInitialized) {
        console.warn('NotificationService not initialized');
        return null;
      }

      // Expo Go fallback: just log the notification
      const isExpoGo = Constants.appOwnership === 'expo';
      if (isExpoGo) {
        console.log('📱 [Mock Notification]', { title, body, data });
        return 'mock-notification-id';
      }

      const channelId = options.channelId || this.getChannelIdForType(data.type);
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: options.sound !== false,
          priority: options.priority === 'high' ? 
            Notifications.AndroidNotificationPriority.HIGH : 
            Notifications.AndroidNotificationPriority.DEFAULT,
          vibrate: options.vibrate !== false ? [0, 250, 250, 250] : undefined,
          badge: options.badge,
          categoryIdentifier: channelId,
        },
        trigger: null, // Send immediately
      });

      console.log(`Notification sent with ID: ${notificationId}`);
      return notificationId;
    } catch (error) {
      console.error('Error sending notification:', error);
      return null;
    }
  }

  /**
   * Schedule a notification for later
   */
  async scheduleNotification(
    title: string,
    body: string,
    scheduledTime: Date,
    data: NotificationData = { type: 'general' },
    options: {
      recurring?: boolean;
      interval?: number; // in milliseconds
      channelId?: string;
    } = {}
  ): Promise<string | null> {
    try {
      if (!this.isInitialized) {
        console.warn('NotificationService not initialized');
        return null;
      }

      const scheduledNotification: ScheduledNotification = {
        id: `scheduled_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title,
        body,
        data,
        scheduledTime,
        recurring: options.recurring,
        interval: options.interval,
      };

      const channelId = options.channelId || this.getChannelIdForType(data.type);
      
      let trigger: Notifications.NotificationTriggerInput;
      
      if (options.recurring && options.interval) {
        // Recurring notification
        trigger = {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          repeats: true,
          seconds: Math.max(options.interval / 1000, 60), // Minimum 1 minute
        };
      } else {
        // One-time notification
        trigger = {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: scheduledTime,
        };
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
          categoryIdentifier: channelId,
        },
        trigger,
      });

      // Store scheduled notification info
      this.scheduledNotifications.set(notificationId, scheduledNotification);
      await this.saveScheduledNotifications();

      console.log(`Notification scheduled with ID: ${notificationId} for ${scheduledTime}`);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(notificationId: string): Promise<boolean> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      this.scheduledNotifications.delete(notificationId);
      await this.saveScheduledNotifications();
      console.log(`Cancelled notification: ${notificationId}`);
      return true;
    } catch (error) {
      console.error('Error cancelling notification:', error);
      return false;
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      this.scheduledNotifications.clear();
      await this.saveScheduledNotifications();
      console.log('Cancelled all scheduled notifications');
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
    }
  }

  /**
   * Get all scheduled notifications
   */
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Send price alert notification
   */
  async sendPriceAlert(
    route: string,
    oldPrice: number,
    newPrice: number,
    percentageChange: number,
    trackerId: string
  ): Promise<string | null> {
    const title = percentageChange > 0 ? 
      `Price Drop Alert! ✈️` : 
      `Price Increase Warning ⚠️`;
    
    const body = `${route} ${percentageChange > 0 ? 'dropped' : 'increased'} ${Math.abs(percentageChange).toFixed(0)}% to $${newPrice}`;

    return await this.sendNotification(
      title,
      body,
      {
        type: 'price_alert',
        trackerId,
        oldPrice,
        newPrice,
        percentageChange,
        route,
      },
      {
        channelId: 'price-alerts',
        priority: 'high',
      }
    );
  }

  /**
   * Send flight update notification
   */
  async sendFlightUpdate(
    flightNumber: string,
    updateType: 'delay' | 'gate_change' | 'cancellation' | 'boarding',
    message: string,
    flightId: string
  ): Promise<string | null> {
    const icons = {
      delay: '⏰',
      gate_change: '🚪',
      cancellation: '❌',
      boarding: '✈️',
    };

    const title = `Flight Update ${icons[updateType]}`;
    const body = `${flightNumber}: ${message}`;

    return await this.sendNotification(
      title,
      body,
      {
        type: 'flight_update',
        flightId,
        updateType,
        flightNumber,
      },
      {
        channelId: 'flight-updates',
        priority: 'high',
      }
    );
  }

  /**
   * Send booking reminder notification
   */
  async sendBookingReminder(
    type: 'checkin' | 'departure' | 'documents',
    flightNumber: string,
    message: string,
    flightId: string
  ): Promise<string | null> {
    const icons = {
      checkin: '📱',
      departure: '🛫',
      documents: '📋',
    };

    const title = `Travel Reminder ${icons[type]}`;
    const body = `${flightNumber}: ${message}`;

    return await this.sendNotification(
      title,
      body,
      {
        type: 'booking_reminder',
        flightId,
        reminderType: type,
        flightNumber,
      },
      {
        channelId: 'booking-reminders',
      }
    );
  }

  /**
   * Handle notification received while app is active
   */
  private handleNotificationReceived(notification: Notifications.Notification): void {
    const { data } = notification.request.content;
    
    // Handle different notification types
    switch (data?.type) {
      case 'price_alert':
        console.log('Price alert received:', data);
        // Could trigger in-app banner or update UI
        break;
      case 'flight_update':
        console.log('Flight update received:', data);
        // Could refresh flight data
        break;
      case 'booking_reminder':
        console.log('Booking reminder received:', data);
        // Could navigate to relevant screen
        break;
    }
  }

  /**
   * Handle notification tapped/clicked
   */
  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const { data } = response.notification.request.content;
    
    // Navigate to relevant screen based on notification type
    switch (data?.type) {
      case 'price_alert':
        // Navigate to price tracking or flight details
        console.log('Navigate to price tracker:', data.trackerId);
        break;
      case 'flight_update':
        // Navigate to flight details
        console.log('Navigate to flight:', data.flightId);
        break;
      case 'booking_reminder':
        // Navigate to booking or checkin
        console.log('Navigate to booking:', data.flightId);
        break;
    }
  }

  /**
   * Get channel ID for notification type
   */
  private getChannelIdForType(type: NotificationData['type']): string {
    switch (type) {
      case 'price_alert':
        return 'price-alerts';
      case 'flight_update':
        return 'flight-updates';
      case 'booking_reminder':
        return 'booking-reminders';
      default:
        return 'general';
    }
  }

  // Data persistence methods

  private async loadScheduledNotifications(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const notifications = JSON.parse(data) as ScheduledNotification[];
        this.scheduledNotifications = new Map(
          notifications.map(n => [n.id, {
            ...n,
            scheduledTime: new Date(n.scheduledTime)
          }])
        );
      }
    } catch (error) {
      console.error('Error loading scheduled notifications:', error);
    }
  }

  private async saveScheduledNotifications(): Promise<void> {
    try {
      const notifications = Array.from(this.scheduledNotifications.values());
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(notifications));
    } catch (error) {
      console.error('Error saving scheduled notifications:', error);
    }
  }

  /**
   * Get notification token for push services
   */
  getNotificationToken(): string | null {
    return this.notificationToken;
  }

  /**
   * Check if notifications are enabled
   */
  async areNotificationsEnabled(): Promise<boolean> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      return false;
    }
  }

  /**
   * Clear all notification badge count
   */
  async clearBadgeCount(): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(0);
    } catch (error) {
      console.error('Error clearing badge count:', error);
    }
  }
}

export const notificationService = new NotificationService();