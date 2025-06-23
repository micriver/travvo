import { StyleSheet, Switch } from 'react-native';
import { useState } from 'react';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function SettingsScreen() {
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [priceAlertsEnabled, setPriceAlertsEnabled] = useState(false);

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <IconSymbol name="gear" size={32} color="#007AFF" />
        <ThemedText type="title">Settings</ThemedText>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">AI Preferences</ThemedText>
        
        <ThemedView style={styles.settingRow}>
          <ThemedView style={styles.settingInfo}>
            <ThemedText type="defaultSemiBold">Voice Interactions</ThemedText>
            <ThemedText style={styles.settingDescription}>
              Enable voice input for AI conversations
            </ThemedText>
          </ThemedView>
          <Switch
            value={voiceEnabled}
            onValueChange={setVoiceEnabled}
            trackColor={{ false: '#767577', true: '#007AFF' }}
          />
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Notifications</ThemedText>
        
        <ThemedView style={styles.settingRow}>
          <ThemedView style={styles.settingInfo}>
            <ThemedText type="defaultSemiBold">Push Notifications</ThemedText>
            <ThemedText style={styles.settingDescription}>
              Receive notifications about deals and updates
            </ThemedText>
          </ThemedView>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#767577', true: '#007AFF' }}
          />
        </ThemedView>

        <ThemedView style={styles.settingRow}>
          <ThemedView style={styles.settingInfo}>
            <ThemedText type="defaultSemiBold">Price Alerts</ThemedText>
            <ThemedText style={styles.settingDescription}>
              Get notified when flight prices drop
            </ThemedText>
          </ThemedView>
          <Switch
            value={priceAlertsEnabled}
            onValueChange={setPriceAlertsEnabled}
            trackColor={{ false: '#767577', true: '#007AFF' }}
          />
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">About</ThemedText>
        <ThemedText style={styles.aboutText}>
          AI Travel App - Your intelligent flight booking companion
        </ThemedText>
        <ThemedText style={styles.versionText}>Version 1.0.0</ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 32,
    marginTop: 20,
  },
  section: {
    marginBottom: 32,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 2,
  },
  aboutText: {
    fontSize: 16,
    marginBottom: 8,
  },
  versionText: {
    fontSize: 14,
    opacity: 0.7,
  },
});