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
  // iOS — iPhone 17 line (all Dynamic Island), plus 16e + iPad mini
  { id: 'iphone-17-pro-max', name: 'iPhone 17 Pro Max', os: 'ios', width: 440, height: 956, radius: 55, notch: 'island', insets: { top: 62, bottom: 34 }, statusBar: 'dark' },
  { id: 'iphone-17-pro',     name: 'iPhone 17 Pro',     os: 'ios', width: 402, height: 874, radius: 55, notch: 'island', insets: { top: 62, bottom: 34 }, statusBar: 'dark' },
  { id: 'iphone-17',         name: 'iPhone 17',         os: 'ios', width: 393, height: 852, radius: 50, notch: 'island', insets: { top: 59, bottom: 34 }, statusBar: 'dark' },
  { id: 'iphone-17-air',     name: 'iPhone 17 Air',     os: 'ios', width: 420, height: 912, radius: 58, notch: 'island', insets: { top: 59, bottom: 34 }, statusBar: 'dark' },
  { id: 'iphone-16e',        name: 'iPhone 16e',        os: 'ios', width: 390, height: 844, radius: 47, notch: 'notch',  insets: { top: 47, bottom: 34 }, statusBar: 'dark' },
  { id: 'ipad-mini',         name: 'iPad mini',         os: 'ios', width: 744, height: 1133, radius: 34, notch: 'none',  insets: { top: 24, bottom: 20 }, statusBar: 'dark' },

  // Android — Galaxy S26 + Pixel 10 line
  { id: 's26-ultra',   name: 'Galaxy S26 Ultra', os: 'android', width: 480, height: 1040, radius: 26, notch: 'punch-hole', insets: { top: 36, bottom: 24 }, statusBar: 'dark' },
  { id: 's26',         name: 'Galaxy S26',       os: 'android', width: 384, height: 832, radius: 32, notch: 'punch-hole', insets: { top: 30, bottom: 20 }, statusBar: 'dark' },
  { id: 'pixel-10-pro', name: 'Pixel 10 Pro',    os: 'android', width: 412, height: 920, radius: 40, notch: 'punch-hole', insets: { top: 30, bottom: 24 }, statusBar: 'dark' },
  { id: 'pixel-10',    name: 'Pixel 10',         os: 'android', width: 412, height: 915, radius: 36, notch: 'punch-hole', insets: { top: 28, bottom: 24 }, statusBar: 'dark' },
  { id: 'pixel-10a',   name: 'Pixel 10a',        os: 'android', width: 412, height: 892, radius: 30, notch: 'punch-hole', insets: { top: 28, bottom: 24 }, statusBar: 'dark' },
  { id: 'android-compact', name: 'Compact',      os: 'android', width: 360, height: 640, radius: 24, notch: 'none',      insets: { top: 24, bottom: 0 },  statusBar: 'dark' },
]

export const DEFAULT_DEVICE_ID = 'iphone-17-pro'

export function devicesForOS(os: DeviceOS): Device[] {
  return DEVICES.filter(d => d.os === os)
}

export function getDevice(id: string): Device {
  return DEVICES.find(d => d.id === id) ?? DEVICES.find(d => d.id === DEFAULT_DEVICE_ID)!
}
