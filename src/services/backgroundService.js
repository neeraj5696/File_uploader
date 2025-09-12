import { AppState, Platform } from 'react-native';
import PushNotification from 'react-native-push-notification';

class BackgroundService {
  constructor() {
    this.isRunning = false;
    this.appState = AppState.currentState;
    this.notificationId = 'recorder-bg';
    this.channelCreated = false;
    this.init();
  }

  init() {
    console.log('Initializing background service...');
    
    PushNotification.configure({
      onNotification: function(notification) {
        console.log('Notification received:', notification);
      },
      requestPermissions: Platform.OS === 'ios',
    });

    this.createNotificationChannel();
    AppState.addEventListener('change', this.handleAppStateChange);
  }

  createNotificationChannel() {
    if (Platform.OS === 'android' && !this.channelCreated) {
      PushNotification.createChannel(
        {
          channelId: "recorder-bg",
          channelName: "Recorder Background",
          channelDescription: "Shows when recorder app is running in background",
          importance: 3,
          vibrate: false,
          playSound: false,
        },
        (created) => {
          console.log(`Notification channel created: ${created}`);
          this.channelCreated = true;
        }
      );
    }
  }

  handleAppStateChange = (nextAppState) => {
    if (this.appState.match(/inactive|background/) && nextAppState === 'active') {
      this.hideNotification();
    } else if (this.appState === 'active' && nextAppState.match(/inactive|background/)) {
      this.showNotification();
    }
    this.appState = nextAppState;
  };

  showNotification() {
    console.log('📱 Showing background notification');
    
    PushNotification.localNotification({
      id: this.notificationId,
      channelId: "recorder-bg",
      title: "🎙️ Recorder",
      message: "App is running in background",
      subText: "Tap to open",
      playSound: false,
      vibrate: false,
      ongoing: true,
      autoCancel: false,
      smallIcon: "ic_launcher",
      color: "#007AFF",
      priority: "low",
      visibility: "public",
      ignoreInForeground: false,
    });
  }

  hideNotification() {
    console.log('📱 Hiding background notification');
    PushNotification.cancelLocalNotification(this.notificationId);
  }

  testNotification() {
    console.log('🧪 Testing notification');
    PushNotification.localNotification({
      channelId: "recorder-bg",
      title: "Test Notification",
      message: "This is a test notification from Recorder app",
      playSound: true,
      vibrate: true,
      smallIcon: "ic_launcher",
      color: "#007AFF",
    });
  }

  start() {
    this.isRunning = true;
  }

  stop() {
    this.isRunning = false;
    this.hideNotification();
  }
}

export default new BackgroundService();