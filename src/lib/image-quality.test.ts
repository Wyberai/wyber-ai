import { describe, it, expect, afterEach } from 'vitest'
import { buildImageQuality } from './generate-image-persist'

describe('buildImageQuality', () => {
  const was = process.env.IMAGE_QUALITY_ALL
  afterEach(() => { if (was === undefined) delete process.env.IMAGE_QUALITY_ALL; else process.env.IMAGE_QUALITY_ALL = was })

  it('paying plans get high, the free plan stays medium, by default', () => {
    delete process.env.IMAGE_QUALITY_ALL
    expect(buildImageQuality('free')).toBe('medium')
    expect(buildImageQuality(undefined)).toBe('medium')
    expect(buildImageQuality('starter')).toBe('high')
  })
  it('IMAGE_QUALITY_ALL=high makes every build high quality, including the free plan', () => {
    process.env.IMAGE_QUALITY_ALL = 'high'
    expect(buildImageQuality('free')).toBe('high')
    expect(buildImageQuality(null)).toBe('high')
  })
  it('any other value changes nothing', () => {
    process.env.IMAGE_QUALITY_ALL = 'low'
    expect(buildImageQuality('free')).toBe('medium')
  })
})
