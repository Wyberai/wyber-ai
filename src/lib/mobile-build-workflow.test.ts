import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

/**
 * 18 Nov 2026: an APK build for project 4c6f6493... ended "Could not start the Expo build". The EAS log said
 * 'The "android.package" is required to be set in app config when running in non-interactive mode.' The workflow
 * built the package as com.wyberai.app.<first 16 characters of the project id>, and an Android package segment must start
 * with a letter. Ids that start with a digit (about 10 in 16) gave an invalid package that Expo treated as unset.
 * Earlier successful runs all used a project id starting with a letter.
 */
const read = (f: string) => fs.readFileSync(path.join(process.cwd(), 'scripts/github-actions-template', f), 'utf8')

describe('mobile build workflows', () => {
  for (const [file, base] of [['build-artifact.yml', 'com.wyberai.app'], ['build-preview.yml', 'com.wyberai.preview']] as const) {
    it(`${file} never builds an Android package whose last segment can start with a digit`, () => {
      const yml = read(file)
      expect(yml).toContain('case "$BUNDLE_SUFFIX" in [0-9]*) PKG_SUFFIX="p$BUNDLE_SUFFIX"')
      expect(yml).toContain(`"package": "${base}.\${PKG_SUFFIX}"`)
      expect(yml).not.toContain(`"package": "${base}.\${BUNDLE_SUFFIX}"`)
    })
  }
})
