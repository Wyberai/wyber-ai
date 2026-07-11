// Device catalog for the in-house mobile preview. Each preset drives the
// DeviceFrame bezel (dimensions, corner radius, cutout) AND the runtime
// (safe-area insets fed to the RN-web preview via window.__WYBER_INSETS__).
// Dimensions are logical (CSS) points, not physical pixels.

export type DeviceOS = 'ios' | 'android'
export type NotchKind = 'notch' | 'island' | 'punch-hole' | 'none'

export interface Device {
  id: string
  name: string
  os: DeviceOS
  width: number
  height: number
  radius: number          // bezel corner radius (px)
  notch: NotchKind
  insets: { top: number; bottom: number }  // safe-area, logical points
  statusBar: 'light' | 'dark'
}

export const DEVICES: Device[] = [
  // iOS
  { id: 'iphone-15-pro-max', name: 'iPhone 15 Pro Max', os: 'ios', width: 430, height: 932, radius: 55, notch: 'island', insets: { top: 59, bottom: 34 }, statusBar: 'dark' },
  { id: 'iphone-15-pro',     name: 'iPhone 15 Pro',     os: 'ios', width: 393, height: 852, radius: 55, notch: 'island', insets: { top: 59, bottom: 34 }, statusBar: 'dark' },
  { id: 'iphone-15',         name: 'iPhone 15',         os: 'ios', width: 393, height: 852, radius: 50, notch: 'island', insets: { top: 59, bottom: 34 }, statusBar: 'dark' },
  { id: 'iphone-14',         name: 'iPhone 14',         os: 'ios', width: 390, height: 844, radius: 47, notch: 'notch',  insets: { top: 47, bottom: 34 }, statusBar: 'dark' },
  { id: 'iphone-se',         name: 'iPhone SE',         os: 'ios', width: 375, height: 667, radius: 18, notch: 'none',   insets: { top: 20, bottom: 0 },  statusBar: 'dark' },
  { id: 'ipad-mini',         name: 'iPad mini',         os: 'ios', width: 744, height: 1133, radius: 34, notch: 'none',  insets: { top: 24, bottom: 20 }, statusBar: 'dark' },

  // Android
  { id: 'pixel-8-pro', name: 'Pixel 8 Pro',      os: 'android', width: 448, height: 998, radius: 42, notch: 'punch-hole', insets: { top: 32, bottom: 24 }, statusBar: 'dark' },
  { id: 'pixel-8',     name: 'Pixel 8',          os: 'android', width: 412, height: 915, radius: 36, notch: 'punch-hole', insets: { top: 28, bottom: 24 }, statusBar: 'dark' },
  { id: 'pixel-7a',    name: 'Pixel 7a',         os: 'android', width: 412, height: 892, radius: 30, notch: 'punch-hole', insets: { top: 28, bottom: 24 }, statusBar: 'dark' },
  { id: 's23-ultra',   name: 'Galaxy S23 Ultra', os: 'android', width: 480, height: 1012, radius: 26, notch: 'punch-hole', insets: { top: 30, bottom: 20 }, statusBar: 'dark' },
  { id: 's23',         name: 'Galaxy S23',       os: 'android', width: 360, height: 780, radius: 34, notch: 'punch-hole', insets: { top: 28, bottom: 20 }, statusBar: 'dark' },
  { id: 'android-compact', name: 'Compact',      os: 'android', width: 360, height: 640, radius: 24, notch: 'none',      insets: { top: 24, bottom: 0 },  statusBar: 'dark' },
]

export const DEFAULT_DEVICE_ID = 'iphone-15-pro'

export function devicesForOS(os: DeviceOS): Device[] {
  return DEVICES.filter(d => d.os === os)
}

export function getDevice(id: string): Device {
  return DEVICES.find(d => d.id === id) ?? DEVICES.find(d => d.id === DEFAULT_DEVICE_ID)!
}
