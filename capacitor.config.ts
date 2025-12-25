import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kerrykier.navonly',
  appName: 'NavOnly',
  webDir: 'dist',
  server: {
    // We remove the Google.com URL so it loads your actual App.tsx code
    cleartext: true
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    GoogleMaps: {
      apiKey: 'AIzaSyCCM0hA0-wQ6xGzAKl7tnvLzLQueqhQi0I',
    },
  },
};

export default config;