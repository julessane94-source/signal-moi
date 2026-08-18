export default {
  owner: 'julessane94',
  expo: {
    name: 'Signal Moi',
    slug: 'signal-moi-mobile',
    scheme: 'signalmoi',
    version: '0.1.16',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    jsEngine: 'hermes',
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'sn.signalmoi.mobile',
      buildNumber: '15',
      config: {
        usesNonExemptEncryption: false
      },
      infoPlist: {
        NSCameraUsageDescription: 'Signal Moi utilise la camera pour envoyer une preuve ou lancer un live.',
        NSMicrophoneUsageDescription: 'Signal Moi utilise le micro pendant les lives citoyens.',
        NSLocationWhenInUseUsageDescription: 'Signal Moi utilise votre position reelle pour orienter les secours.',
        NSPhotoLibraryUsageDescription: 'Signal Moi utilise vos photos et vidéos comme preuves de signalement.',
        NSPhotoLibraryAddUsageDescription: 'Signal Moi peut enregistrer une preuve avec votre autorisation.'
      }
    },
    android: {
      package: 'sn.signalmoi.mobile',
      versionCode: 17,
      permissions: [
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'CAMERA',
        'RECORD_AUDIO',
        'POST_NOTIFICATIONS'
      ]
    },
    plugins: [
        [
         "expo-location",
       {
         "locationWhenInUsePermission": "Signal Moi utilise votre position pour localiser les signalements."
     }
    ],
    [
     "expo-camera",
       {
         "cameraPermission": "Signal Moi utilise la camera pour prendre des photos des incidents."
     }
    ],
    [
     "expo-notifications",
       {
      "color": "#ffffff",
      "enableBackgroundRemoteNotifications": true
     }
    ],
    "expo-asset",
    "expo-sharing",
    "expo-web-browser"
  ],
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://signal-moi-api.onrender.com/api',
      socketUrl: process.env.EXPO_PUBLIC_SOCKET_URL || 'https://signal-moi-api.onrender.com',
      eas: { projectId: "cbf843a4-2b7e-4586-a992-13953f64c1c2" }
    }
  }
}
