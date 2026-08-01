export type TemplateFramework = 'react-web' | 'react-native'

/** What one planned page/screen needs, before any retrieval happens. */
export interface PageSpec {
  /** Coarse category used for both retrieval filtering and the fallback
   * "what kind of page is this" signal when nothing matches. */
  archetype: string
  /** Short natural-language description of what this specific page should do
   * — the retrieval query text. */
  description: string
  framework: TemplateFramework
  paletteId?: string
}

/** A candidate template returned by retrieve(), ranked by score. */
export interface TemplateMatch {
  id: string
  archetype: string
  framework: TemplateFramework
  paletteId?: string
  description: string
  gcsBucket: string
  gcsPath: string
  wyberUiKitParts: string[]
  /** 0-1 relative rank from the retrieval backend — not a calibrated
   * probability, just enough to pick a "good enough" threshold. */
  score: number
}

export interface TemplateFiles {
  /** path (relative to project root) -> full file content */
  files: Record<string, string>
}

export interface PromoteInput {
  archetype: string
  framework: TemplateFramework
  paletteId?: string
  description: string
  wyberUiKitParts?: string[]
  files: Record<string, string>
  /** Automated signal from the caller (e.g. did this actually `vite build`) —
   * promote() itself doesn't run the build, the caller already knows. */
  qualityScore: number
}
