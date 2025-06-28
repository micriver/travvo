import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { 
  PriceTracker, 
  PriceAlert, 
  PriceHistoryEntry, 
  Flight,
  FlightSearchParams 
} from '@/types';
import { flightService } from '@/services/api/flightService';

/**
 * PriceTrackingService manages flight price monitoring and alerts
 */
class PriceTrackingService {
  private trackers: Map<string, PriceTracker> = new Map();
  private priceHistory: Map<string, PriceHistoryEntry[]> = new Map();
  private alerts: Map<string, PriceAlert[]> = new Map();
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  private readonly STORAGE_KEYS = {
    TRACKERS: '@price_trackers',
    HISTORY: '@price_history',
    ALERTS: '@price_alerts',
    SETTINGS: '@price_tracking_settings'
  };

  private readonly DEFAULT_SETTINGS = {
    checkInterval: 6 * 60 * 60 * 1000, // 6 hours
    maxTrackingDuration: 30 * 24 * 60 * 60 * 1000, // 30 days
    defaultAlertThreshold: 10, // 10% price drop
    maxTrackersPerUser: 20,
    notificationChannels: ['push', 'email'] as ('push' | 'email' | 'sms')[]
  };

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the price tracking service
   */
  private async initialize(): Promise<void> {
    await this.loadData();
    await this.setupNotifications();
    this.startMonitoring();
  }

  /**
   * Create a new price tracker for a flight route
   */
  async createTracker(
    userId: string,
    flightRoute: PriceTracker['flightRoute'],
    options: {
      targetPrice?: number;
      alertThreshold?: number;
      notifications?: {
        email: boolean;
        push: boolean;
        frequency: 'immediate' | 'daily' | 'weekly';
      };
    } = {}
  ): Promise<PriceTracker> {
    // Check if user has too many trackers
    const userTrackers = Array.from(this.trackers.values()).filter(t => t.userId === userId);
    if (userTrackers.length >= this.DEFAULT_SETTINGS.maxTrackersPerUser) {
      throw new Error(`Maximum ${this.DEFAULT_SETTINGS.maxTrackersPerUser} trackers allowed per user`);
    }

    // Get current price for the route
    const currentPrice = await this.getCurrentPrice(flightRoute);
    
    const tracker: PriceTracker = {
      id: `tracker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      flightRoute,
      currentPrice,
      targetPrice: options.targetPrice,
      alertThreshold: options.alertThreshold || this.DEFAULT_SETTINGS.defaultAlertThreshold,
      isActive: true,
      createdAt: new Date(),
      lastChecked: new Date(),
      notifications: {
        email: options.notifications?.email ?? true,
        push: options.notifications?.push ?? true,
        frequency: options.notifications?.frequency ?? 'immediate'
      }
    };

    this.trackers.set(tracker.id, tracker);
    
    // Initialize price history
    this.priceHistory.set(tracker.id, [{
      id: `history_${Date.now()}`,
      trackerId: tracker.id,
      price: currentPrice,
      currency: 'USD',
      availability: 100, // Placeholder
      checkedAt: new Date(),
      source: 'initial'
    }]);

    await this.saveData();
    
    console.log(`Created price tracker for ${flightRoute.origin} → ${flightRoute.destination}`);
    return tracker;
  }

  /**
   * Get all trackers for a user
   */
  getUserTrackers(userId: string): PriceTracker[] {
    return Array.from(this.trackers.values()).filter(t => t.userId === userId && t.isActive);
  }

  /**
   * Get tracker by ID
   */
  getTracker(trackerId: string): PriceTracker | undefined {
    return this.trackers.get(trackerId);
  }

  /**
   * Update tracker settings
   */
  async updateTracker(
    trackerId: string, 
    updates: Partial<Pick<PriceTracker, 'targetPrice' | 'alertThreshold' | 'notifications'>>
  ): Promise<PriceTracker | null> {
    const tracker = this.trackers.get(trackerId);
    if (!tracker) return null;

    const updatedTracker = { ...tracker, ...updates };
    this.trackers.set(trackerId, updatedTracker);
    
    await this.saveData();
    return updatedTracker;
  }

  /**
   * Delete a price tracker
   */
  async deleteTracker(trackerId: string): Promise<boolean> {
    const tracker = this.trackers.get(trackerId);
    if (!tracker) return false;

    tracker.isActive = false;
    this.trackers.set(trackerId, tracker);
    
    await this.saveData();
    console.log(`Deleted price tracker ${trackerId}`);
    return true;
  }

  /**
   * Get price history for a tracker
   */
  getPriceHistory(trackerId: string): PriceHistoryEntry[] {
    return this.priceHistory.get(trackerId) || [];
  }

  /**
   * Get alerts for a tracker
   */
  getTrackerAlerts(trackerId: string): PriceAlert[] {
    return this.alerts.get(trackerId) || [];
  }

  /**
   * Get all alerts for a user
   */
  getUserAlerts(userId: string): PriceAlert[] {
    const userTrackers = this.getUserTrackers(userId);
    const allAlerts: PriceAlert[] = [];
    
    for (const tracker of userTrackers) {
      const trackerAlerts = this.alerts.get(tracker.id) || [];
      allAlerts.push(...trackerAlerts);
    }
    
    return allAlerts.sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime());
  }

  /**
   * Start monitoring all active trackers
   */
  private startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.monitoringInterval = setInterval(
      () => this.checkAllTrackers(),
      this.DEFAULT_SETTINGS.checkInterval
    );
    
    console.log('Started price monitoring');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('Stopped price monitoring');
  }

  /**
   * Manually trigger price check for all trackers
   */
  async checkAllTrackers(): Promise<void> {
    const activeTrackers = Array.from(this.trackers.values()).filter(t => t.isActive);
    
    console.log(`Checking prices for ${activeTrackers.length} active trackers`);
    
    for (const tracker of activeTrackers) {
      try {
        await this.checkTrackerPrice(tracker);
      } catch (error) {
        console.error(`Error checking price for tracker ${tracker.id}:`, error);
      }
    }
    
    await this.saveData();
  }

  /**
   * Check price for a specific tracker
   */
  private async checkTrackerPrice(tracker: PriceTracker): Promise<void> {
    // Skip if checked recently (within last hour)
    const timeSinceLastCheck = Date.now() - tracker.lastChecked.getTime();
    if (timeSinceLastCheck < 60 * 60 * 1000) {
      return;
    }

    // Get current price
    const newPrice = await this.getCurrentPrice(tracker.flightRoute);
    const oldPrice = tracker.currentPrice;
    
    // Update tracker
    tracker.currentPrice = newPrice;
    tracker.lastChecked = new Date();
    this.trackers.set(tracker.id, tracker);
    
    // Add to price history
    const historyEntry: PriceHistoryEntry = {
      id: `history_${Date.now()}_${tracker.id}`,
      trackerId: tracker.id,
      price: newPrice,
      currency: 'USD',
      availability: 100, // Placeholder
      checkedAt: new Date(),
      source: 'monitoring'
    };
    
    const history = this.priceHistory.get(tracker.id) || [];
    history.push(historyEntry);
    
    // Keep only last 100 entries
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }
    
    this.priceHistory.set(tracker.id, history);
    
    // Check for price alerts
    await this.checkPriceAlerts(tracker, oldPrice, newPrice);
  }

  /**
   * Check if price change triggers an alert
   */
  private async checkPriceAlerts(tracker: PriceTracker, oldPrice: number, newPrice: number): Promise<void> {
    const priceChange = oldPrice - newPrice;
    const percentageChange = (priceChange / oldPrice) * 100;
    
    let alertType: PriceAlert['alertType'] | null = null;
    
    // Check for price drop
    if (percentageChange >= tracker.alertThreshold) {
      alertType = 'price_drop';
    }
    // Check for target price reached
    else if (tracker.targetPrice && newPrice <= tracker.targetPrice) {
      alertType = 'target_reached';
    }
    // Check for significant price increase (optional)
    else if (percentageChange <= -20) {
      alertType = 'price_increase';
    }
    
    if (alertType) {
      await this.createPriceAlert(tracker, oldPrice, newPrice, percentageChange, alertType);
    }
  }

  /**
   * Create and send a price alert
   */
  private async createPriceAlert(
    tracker: PriceTracker,
    oldPrice: number,
    newPrice: number,
    percentageChange: number,
    alertType: PriceAlert['alertType']
  ): Promise<void> {
    const alert: PriceAlert = {
      id: `alert_${Date.now()}_${tracker.id}`,
      trackerId: tracker.id,
      flight: await this.createFlightFromRoute(tracker.flightRoute), // Would need to implement
      oldPrice,
      newPrice,
      percentageChange,
      alertType,
      triggeredAt: new Date(),
      notificationSent: false,
      notificationChannels: []
    };
    
    const trackerAlerts = this.alerts.get(tracker.id) || [];
    trackerAlerts.push(alert);
    this.alerts.set(tracker.id, trackerAlerts);
    
    // Send notifications
    await this.sendPriceAlertNotifications(tracker, alert);
  }

  /**
   * Send notifications for price alert
   */
  private async sendPriceAlertNotifications(tracker: PriceTracker, alert: PriceAlert): Promise<void> {
    const channels: ('push' | 'email' | 'sms')[] = [];
    
    // Send push notification
    if (tracker.notifications.push) {
      try {
        await this.sendPushNotification(tracker, alert);
        channels.push('push');
      } catch (error) {
        console.error('Failed to send push notification:', error);
      }
    }
    
    // Send email notification (would implement with email service)
    if (tracker.notifications.email) {
      try {
        // await this.sendEmailNotification(tracker, alert);
        channels.push('email');
        console.log('Email notification would be sent');
      } catch (error) {
        console.error('Failed to send email notification:', error);
      }
    }
    
    // Update alert
    alert.notificationSent = channels.length > 0;
    alert.notificationChannels = channels;
  }

  /**
   * Send push notification for price alert
   */
  private async sendPushNotification(tracker: PriceTracker, alert: PriceAlert): Promise<void> {
    const route = tracker.flightRoute;
    let title = '';
    let body = '';
    
    switch (alert.alertType) {
      case 'price_drop':
        title = `Price Drop Alert! ✈️`;
        body = `${route.origin} → ${route.destination} dropped ${Math.abs(alert.percentageChange).toFixed(0)}% to $${alert.newPrice}`;
        break;
      case 'target_reached':
        title = `Target Price Reached! 🎯`;
        body = `${route.origin} → ${route.destination} is now $${alert.newPrice} (Your target: $${tracker.targetPrice})`;
        break;
      case 'price_increase':
        title = `Price Increase Warning ⚠️`;
        body = `${route.origin} → ${route.destination} increased ${Math.abs(alert.percentageChange).toFixed(0)}% to $${alert.newPrice}`;
        break;
    }
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          trackerId: tracker.id,
          alertId: alert.id,
          type: 'price_alert'
        }
      },
      trigger: null // Send immediately
    });
  }

  /**
   * Get current price for a flight route
   */
  private async getCurrentPrice(flightRoute: PriceTracker['flightRoute']): Promise<number> {
    try {
      // Convert to flight search params
      const searchParams: FlightSearchParams = {
        origin: flightRoute.origin,
        destination: flightRoute.destination,
        departureDate: flightRoute.departureDate,
        returnDate: flightRoute.returnDate,
        passengers: {
          adults: flightRoute.passengers,
          children: 0,
          infants: 0
        },
        cabin: flightRoute.cabin,
        sortBy: 'price',
        sortOrder: 'asc'
      };
      
      const searchResults = await flightService.searchFlights(searchParams);
      
      if (searchResults.flights.length > 0) {
        // Return the lowest price
        const lowestPrice = Math.min(...searchResults.flights.map(f => f.price.total));
        return lowestPrice;
      }
      
      // If no flights found, return a high price to avoid false alerts
      return 9999;
    } catch (error) {
      console.error('Error getting current price:', error);
      // Return previous price to avoid disruption
      return 0;
    }
  }

  /**
   * Create a basic flight object from route (for alerts)
   */
  private async createFlightFromRoute(route: PriceTracker['flightRoute']): Promise<Flight> {
    // This is a simplified implementation - in real app would get actual flight data
    return {
      id: `temp_flight_${Date.now()}`,
      segments: [], // Would populate with actual segment data
      price: {
        total: 0,
        currency: 'USD',
        breakdown: { base: 0, taxes: 0, fees: 0 }
      },
      cabin: route.cabin,
      availability: { seatsLeft: 1, lastUpdated: new Date() },
      baggage: {
        carry_on: { included: true },
        checked: { included: false }
      },
      amenities: [],
      bookingClass: 'Y',
      refundable: false,
      changeable: false,
      stops: 0,
      totalDuration: 0
    } as Flight;
  }

  /**
   * Setup notification permissions and channels
   */
  private async setupNotifications(): Promise<void> {
    try {
      await Notifications.requestPermissionsAsync();
      
      await Notifications.setNotificationChannelAsync('price-alerts', {
        name: 'Price Alerts',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B35',
        sound: 'default',
        enableVibrate: true,
        enableLights: true,
        showBadge: true
      });
    } catch (error) {
      console.error('Error setting up notifications:', error);
    }
  }

  /**
   * Load data from storage
   */
  private async loadData(): Promise<void> {
    try {
      const [trackersData, historyData, alertsData] = await Promise.all([
        AsyncStorage.getItem(this.STORAGE_KEYS.TRACKERS),
        AsyncStorage.getItem(this.STORAGE_KEYS.HISTORY),
        AsyncStorage.getItem(this.STORAGE_KEYS.ALERTS)
      ]);
      
      if (trackersData) {
        const trackers = JSON.parse(trackersData) as PriceTracker[];
        this.trackers = new Map(
          trackers.map(t => [t.id, { ...t, 
            createdAt: new Date(t.createdAt),
            lastChecked: new Date(t.lastChecked),
            flightRoute: {
              ...t.flightRoute,
              departureDate: new Date(t.flightRoute.departureDate),
              returnDate: t.flightRoute.returnDate ? new Date(t.flightRoute.returnDate) : undefined
            }
          }])
        );
      }
      
      if (historyData) {
        const history = JSON.parse(historyData) as { [trackerId: string]: PriceHistoryEntry[] };
        this.priceHistory = new Map(
          Object.entries(history).map(([id, entries]) => [
            id,
            entries.map(e => ({ ...e, checkedAt: new Date(e.checkedAt) }))
          ])
        );
      }
      
      if (alertsData) {
        const alerts = JSON.parse(alertsData) as { [trackerId: string]: PriceAlert[] };
        this.alerts = new Map(
          Object.entries(alerts).map(([id, alertList]) => [
            id,
            alertList.map(a => ({ ...a, triggeredAt: new Date(a.triggeredAt) }))
          ])
        );
      }
      
      console.log(`Loaded ${this.trackers.size} price trackers from storage`);
    } catch (error) {
      console.error('Error loading price tracking data:', error);
    }
  }

  /**
   * Save data to storage
   */
  private async saveData(): Promise<void> {
    try {
      const trackersArray = Array.from(this.trackers.values());
      const historyObject = Object.fromEntries(this.priceHistory.entries());
      const alertsObject = Object.fromEntries(this.alerts.entries());
      
      await Promise.all([
        AsyncStorage.setItem(this.STORAGE_KEYS.TRACKERS, JSON.stringify(trackersArray)),
        AsyncStorage.setItem(this.STORAGE_KEYS.HISTORY, JSON.stringify(historyObject)),
        AsyncStorage.setItem(this.STORAGE_KEYS.ALERTS, JSON.stringify(alertsObject))
      ]);
    } catch (error) {
      console.error('Error saving price tracking data:', error);
    }
  }

  /**
   * Clear all data (for testing/reset)
   */
  async clearAllData(): Promise<void> {
    this.trackers.clear();
    this.priceHistory.clear();
    this.alerts.clear();
    
    await Promise.all([
      AsyncStorage.removeItem(this.STORAGE_KEYS.TRACKERS),
      AsyncStorage.removeItem(this.STORAGE_KEYS.HISTORY),
      AsyncStorage.removeItem(this.STORAGE_KEYS.ALERTS)
    ]);
    
    console.log('Cleared all price tracking data');
  }

  /**
   * Get service statistics
   */
  getStats(): {
    totalTrackers: number;
    activeTrackers: number;
    totalAlerts: number;
    recentAlerts: number;
  } {
    const totalTrackers = this.trackers.size;
    const activeTrackers = Array.from(this.trackers.values()).filter(t => t.isActive).length;
    
    let totalAlerts = 0;
    let recentAlerts = 0;
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    
    for (const alertList of this.alerts.values()) {
      totalAlerts += alertList.length;
      recentAlerts += alertList.filter(a => a.triggeredAt.getTime() > oneDayAgo).length;
    }
    
    return {
      totalTrackers,
      activeTrackers,
      totalAlerts,
      recentAlerts
    };
  }
}

export const priceTrackingService = new PriceTrackingService();