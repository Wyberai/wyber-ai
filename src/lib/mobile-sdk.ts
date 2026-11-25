// Expo SDK versions for generated mobile apps and their Snack preview. Default stays SDK 54 (what runs today); setting
// MOBILE_SDK_VERSION=58 on the server moves the preview and the prompt to SDK 58. SDK 58 values are the versions Expo bundles for it
// (https://unpkg.com/expo@58/bundledNativeModules.json, read 14 Nov 2026). Spike results: docs/mobile-spike-2026-11-14.md.
//
// SDK 58 facts that change what the model must write (https://expo.dev/changelog/sdk-58 and sdk-55):
//   - React Native 0.88, React 19.3, New Architecture only (the opt-out was removed in SDK 55)
//   - Reanimated 4 with react-native-worklets; gesture-handler 3 (use ReanimatedSwipeable)
//   - expo-av is gone: use expo-audio and expo-video
//   - Node 22.13+ for local builds, R8 on for Android release builds

export type MobileSdk = '54' | '58'

export function activeMobileSdk(): MobileSdk {
  return process.env.MOBILE_SDK_VERSION === '58' ? '58' : '54'
}

const NAV: Record<string, string> = {
  '@react-navigation/native': '^7.0.0',
  '@react-navigation/native-stack': '^7.0.0',
  '@react-navigation/stack': '^7.0.0',
  '@react-navigation/bottom-tabs': '^7.0.0',
  '@react-navigation/drawer': '^7.0.0',
  '@react-navigation/material-top-tabs': '^7.0.0',
}

export const SDK_54_VERSIONS: Record<string, string> = {
  ...NAV,
  '@expo/vector-icons': '~14.0.4',
  'react-native-safe-area-context': '~4.14.0',
  'react-native-screens': '~4.9.2',
  'react-native-gesture-handler': '~2.24.0',
  'react-native-reanimated': '~3.17.4',
  'react-native-svg': '~15.11.2',
  'react-native-maps': '~1.20.1',
  'react-native-webview': '~13.13.4',
  '@react-native-async-storage/async-storage': '~2.1.2',
  '@react-native-community/slider': '~4.5.6',
  'expo-status-bar': '~2.2.3',
  'expo-constants': '~17.1.6',
  'expo-font': '~13.3.1',
  'expo-splash-screen': '~0.30.8',
  'expo-linear-gradient': '~14.1.4',
  'expo-blur': '~14.1.4',
  'expo-image': '~2.2.5',
  'expo-av': '~15.1.4',
  'expo-video': '~2.2.6',
  'expo-camera': '~16.1.6',
  'expo-location': '~18.1.5',
  'expo-haptics': '~14.1.4',
  'expo-clipboard': '~7.1.4',
  'expo-sharing': '~13.1.4',
  'expo-file-system': '~18.1.8',
}

export const SDK_58_VERSIONS: Record<string, string> = {
  ...NAV,
  '@expo/vector-icons': '^15.0.2',
  'react-native-safe-area-context': '~5.11.1',
  'react-native-screens': '~4.30.1',
  'react-native-gesture-handler': '~3.3.0',
  'react-native-reanimated': '4.7.1',
  'react-native-worklets': '0.13.0',
  'react-native-svg': '15.16.0',
  'react-native-maps': '1.29.11',
  'react-native-webview': '14.0.1',
  '@react-native-async-storage/async-storage': '2.2.0',
  '@react-native-community/slider': '5.2.1',
  '@react-native-community/datetimepicker': '9.2.1',
  '@react-native-picker/picker': '2.11.4',
  'react-native-pager-view': '9.0.7',
  'react-native-view-shot': '6.1.1',
  'lottie-react-native': '~7.5.0',
  '@shopify/react-native-skia': '2.14.0',
  'expo-status-bar': '~58.0.5',
  'expo-constants': '~58.0.16',
  'expo-font': '~58.0.12',
  'expo-splash-screen': '~58.0.14',
  'expo-linear-gradient': '~58.0.4',
  'expo-blur': '~58.0.6',
  'expo-image': '~58.0.18',
  'expo-video': '~58.0.14',
  'expo-audio': '~58.0.12',
  'expo-camera': '~58.0.14',
  'expo-location': '~58.0.22',
  'expo-haptics': '~58.0.8',
  'expo-clipboard': '~58.0.4',
  'expo-sharing': '~58.0.23',
  'expo-file-system': '~58.0.13',
  'expo-image-picker': '~58.0.10',
  'expo-notifications': '~58.1.9',
  'expo-secure-store': '~58.0.3',
  'expo-sqlite': '~58.0.17',
  'expo-router': '~58.0.31',
  'expo-store-review': '~58.0.3',
  'expo-linking': '~58.0.17',
  'expo-contacts': '~58.0.11',
  'expo-document-picker': '~58.0.5',
  'expo-web-browser': '~58.0.8',
  'expo-keep-awake': '~58.0.4',
  'expo-localization': '~58.0.5',
  'expo-crypto': '~58.0.8',
  'expo-battery': '~58.0.4',
  'expo-sensors': '~58.0.5',
  'expo-symbols': '~58.0.5',
  'expo-glass-effect': '~58.0.5',
}

export function sdkVersions(sdk: MobileSdk = activeMobileSdk()): Record<string, string> {
  return sdk === '58' ? SDK_58_VERSIONS : SDK_54_VERSIONS
}

/** The value Snack's manifest expects. */
export function snackSdkVersion(sdk: MobileSdk = activeMobileSdk()): string {
  return `${sdk}.0.0`
}

/** Version-specific rules for the mobile prompt. Empty for SDK 54 so today's prompt does not change. */
export function sdkPromptNotes(sdk: MobileSdk = activeMobileSdk()): string {
  if (sdk !== '58') return ''
  return `
EXPO SDK 58 RULES (these override earlier library advice):
- React Native 0.88 and React 19.3 on the New Architecture only. Do not set newArchEnabled.
- Reanimated 4: import from 'react-native-reanimated' as usual; it needs react-native-worklets (babel plugin 'react-native-worklets/plugin' LAST in babel.config.js).
- Gesture Handler 3: for swipe-to-reveal use ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable', never the old Swipeable. Wrap the app root in GestureHandlerRootView.
- Audio and video: expo-audio and expo-video. expo-av does not exist in this SDK.
- Notifications: foreground notifications show by default; set a handler only when you want to change that.
- File system: File.write() is async in this SDK; use File.writeSync() only for synchronous writes.
- Strict TypeScript API: never deep-import from 'react-native/Libraries/*'.
- Removed React Native APIs: InteractionManager, the Touchable root export, the Modal animated prop. Use Pressable and Modal animationType.
`
}
