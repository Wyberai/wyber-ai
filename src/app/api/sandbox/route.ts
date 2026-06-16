import { NextRequest, NextResponse } from 'next/server';

// Simple preview generator - no E2B, no VM, no npm install
// Renders generated HTML/React directly in an iframe using srcdoc
export async function POST(req: NextRequest) {
  try {
    const { files, framework } = await req.json();

    // Build a preview HTML from the generated files
    let previewHtml = '';

    if (framework === 'vanilla') {
      // Pure HTML - use directly
      const htmlFile = files['index.html'];
      if (htmlFile?.content) {
        previewHtml = htmlFile.content;
      }
    } else {
      // For React/Vue/Next - extract CSS and render a styled placeholder
      // that shows the app structure
      const cssFiles = Object.entries(files as Record<string, { content: string }>)
        .filter(([path]) => path.endsWith('.css'))
        .map(([, f]) => f.content)
        .join('\n');

      const appFile = files['app.tsx'] || files['App.tsx'] || files['src/App.tsx'] ||
        files['app/page.tsx'] || files['src/app/page.tsx'] ||
        Object.entries(files as Record<string, { content: string }>).find(([p]) => p.endsWith('.tsx') || p.endsWith('.jsx'))?.[1];

      const appContent = typeof appFile === 'object' ? appFile?.content : '';

      // Extract component structure for preview hint
      const hasNav = appContent?.includes('nav') || appContent?.includes('navbar') || appContent?.includes('header');
      const hasSidebar = appContent?.includes('sidebar') || appContent?.includes('Sidebar');
      const hasChart = appContent?.includes('chart') || appContent?.includes('Chart') || appContent?.includes('recharts');
      const hasTable = appContent?.includes('table') || appContent?.includes('Table');
      const hasForm = appContent?.includes('form') || appContent?.includes('Form') || appContent?.includes('input');

      const fileList = Object.keys(files as object).join(', ');

      previewHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>WyberAi Preview</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', -apple-system, sans-serif; background: #0A0A0A; color: #F5F5F5; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 24px; }
  .icon { width: 56px; height: 56px; background: rgba(14,165,233,0.1); border: 1px solid rgba(14,165,233,0.3); border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
  h2 { font-size: 20px; font-weight: 600; letter-spacing: -0.03em; }
  p { font-size: 13px; color: rgba(255,255,255,0.4); text-align: center; max-width: 320px; line-height: 1.6; }
  .files { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; max-width: 400px; }
  .file { font-size: 10px; padding: 2px 8px; border-radius: 4px; background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.5); font-family: monospace; }
  .features { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
  .feat { font-size: 11px; padding: 3px 10px; border-radius: 20px; background: rgba(14,165,233,0.08); border: 1px solid rgba(14,165,233,0.2); color: #38BDF8; }
  .btn { margin-top: 8px; padding: 10px 24px; border-radius: 9px; background: #0EA5E9; color: #fff; font-size: 13px; font-weight: 700; border: none; cursor: pointer; }
  .btn:hover { background: #0284C7; }
</style>
</head>
<body>
  <div class="icon">⚡</div>
  <h2>App generated successfully</h2>
  <div class="features">
    ${hasNav ? '<span class="feat">Navigation</span>' : ''}
    ${hasSidebar ? '<span class="feat">Sidebar</span>' : ''}
    ${hasChart ? '<span class="feat">Charts</span>' : ''}
    ${hasTable ? '<span class="feat">Data table</span>' : ''}
    ${hasForm ? '<span class="feat">Forms</span>' : ''}
    <span class="feat">${framework === 'next' ? 'Next.js SSR' : framework === 'react-vite' ? 'React' : framework}</span>
  </div>
  <p>Your app has been generated. Export as ZIP to run locally, or deploy to Vercel with one click.</p>
  <div class="files">
    ${Object.keys(files as object).slice(0, 12).map((f: string) => `<span class="file">${f}</span>`).join('')}
    ${Object.keys(files as object).length > 12 ? `<span class="file">+${Object.keys(files as object).length - 12} more</span>` : ''}
  </div>
  <button class="btn" onclick="window.parent.postMessage('export', '*')">Export ZIP</button>
</body>
</html>`;
    }

    // Return a data URL that can be used directly in iframe srcdoc
    return NextResponse.json({
      previewUrl: null,
      srcdoc: previewHtml,
      sandboxId: 'static',
    });

  } catch (err) {
    console.error('Preview error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
