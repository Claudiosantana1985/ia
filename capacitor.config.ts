import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.com.autoiapro.app',
  appName: 'AutoIA Pro',
  webDir: '.output/public',
  server: {
    url: 'https://ia-three-virid.vercel.app',
    cleartext: false
  }
};

export default config;