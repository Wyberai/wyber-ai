// Shared 0-credit theme-apply path — used by ThemePanel (manual re-theme) and
// SuggestionsPanel (ambient re-theme). Extracted so both surfaces write an
// app's theme through the exact same sequence instead of two closures that
// can quietly drift: instant preview → rewrite src/index.css → setFiles
// (auto rebuild) → PATCH /api/projects. No LLM anywhere, ever.
import { useEditorStore } from '@/store/editor';
import { writeAppTheme, themeToCss, type AppTheme } from '@/lib/app-theme';
import { persistProjectFiles } from '@/lib/persist-project';

/** Send the override into the preview iframe. PreviewPanel owns the iframe
 *  ref and forwards this window event (same pattern as wyber-request-edit-mode).
 *  Instant, rebuild-free, no store write. */
export function previewTheme(theme: AppTheme): void {
  window.dispatchEvent(new CustomEvent('wyber-apply-theme', { detail: { css: themeToCss(theme) } }));
}

/** The one committed write path. Resolves true only once persistProjectFiles
 *  actually confirms the save (it already posts its own chat warning on a
 *  conflict/exhausted retry) — callers must not flash a success state before
 *  this resolves, or a theme that didn't reach the server will silently
 *  revert after the next reload/publish. */
export async function applyThemeToProject(theme: AppTheme): Promise<boolean> {
  const { files, setFiles, project } = useEditorStore.getState();
  const indexCssFile = files['src/index.css'] as { content?: string } | undefined;
  if (!indexCssFile) return false;

  previewTheme(theme);
  const nextCss = writeAppTheme(indexCssFile.content ?? '', theme);
  const updated = {
    ...files,
    'src/index.css': { path: 'src/index.css', content: nextCss, language: 'css' },
  };
  setFiles(updated as typeof files);

  return project?.id
    ? persistProjectFiles(project.id, updated, project.userId)
    : true;
}
