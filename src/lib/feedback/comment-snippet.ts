// Client-review feedback widget injected into a published app's index.html
// at publish time (publish/route.ts, alongside injectAnalytics) — but ONLY
// when the project owner has explicitly turned on Feedback Mode
// (projects.feedback_mode_enabled), never on every publish by default. A
// production app shouldn't grow a stray "leave feedback" button nobody asked
// for; this exists for the moment you're sharing a link with a client for
// review (see FeedbackPanel.tsx for the toggle).
//
// Same isolation philosophy as the analytics beacon: dependency-free, wrapped
// in try/catch, inert on the preview-builder host, and never touches the
// host app's own DOM/state beyond the floating widget it renders itself.
// Deliberately WRITE-ONLY from here — the widget never reads back existing
// comments, so an arbitrary visitor can leave feedback but can't see what
// anyone else (including a prior reviewer) already said. Only the owner sees
// the list, in FeedbackPanel.tsx.

export const COMMENTS_MARKER = '<!--wyber-feedback-->'

const PREVIEW_BUILDER_HOST = (() => {
  try { return new URL(process.env.NEXT_PUBLIC_PREVIEW_BUILDER_URL || 'https://preview-builder.wyberai.com').hostname }
  catch { return 'preview-builder.wyberai.com' }
})()

function buildSnippet(projectId: string, publicPath: string): string {
  return String.raw`
${COMMENTS_MARKER}
<script>
(function () {
  try {
    if (location.hostname === ${JSON.stringify(PREVIEW_BUILDER_HOST)}) return;
    var PROJECT_ID = ${JSON.stringify(projectId)};
    var PAGE_PATH = ${JSON.stringify(publicPath)};
    var ENDPOINT = 'https://wyberai.com/api/preview-comments';
    var active = false;
    var pinCount = 0;

    var toggle = document.createElement('button');
    toggle.textContent = '💬 Feedback';
    toggle.setAttribute('aria-label', 'Leave feedback');
    Object.assign(toggle.style, {
      position: 'fixed', bottom: '16px', right: '16px', zIndex: 2147483000,
      background: '#111827', color: '#fff', border: 'none', borderRadius: '999px',
      padding: '10px 16px', fontSize: '13px', fontFamily: 'system-ui,-apple-system,sans-serif',
      fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
    });
    toggle.onclick = function () {
      active = !active;
      toggle.style.background = active ? '#0EA5E9' : '#111827';
      toggle.textContent = active ? 'Click anywhere to pin ✕' : '💬 Feedback';
      document.body.style.cursor = active ? 'crosshair' : '';
    };
    document.addEventListener('DOMContentLoaded', function () { document.body.appendChild(toggle); });
    if (document.readyState !== 'loading') document.body.appendChild(toggle);

    function closeForm(form) { if (form && form.parentNode) form.parentNode.removeChild(form); }

    function openForm(clientX, clientY, xPct, yPct) {
      var existing = document.getElementById('wyber-fb-form');
      if (existing) closeForm(existing);

      var form = document.createElement('div');
      form.id = 'wyber-fb-form';
      var left = Math.min(clientX, window.innerWidth - 280);
      var top = Math.min(clientY, window.innerHeight - 160);
      Object.assign(form.style, {
        position: 'fixed', left: left + 'px', top: top + 'px', width: '260px', zIndex: 2147483001,
        background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '10px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.18)', fontFamily: 'system-ui,-apple-system,sans-serif',
      });

      var textarea = document.createElement('textarea');
      textarea.placeholder = 'What should change here?';
      textarea.maxLength = 500;
      Object.assign(textarea.style, {
        width: '100%', height: '60px', fontSize: '13px', padding: '6px', boxSizing: 'border-box',
        border: '1px solid #d1d5db', borderRadius: '6px', resize: 'none', fontFamily: 'inherit',
      });

      var nameInput = document.createElement('input');
      nameInput.placeholder = 'Your name (optional)';
      Object.assign(nameInput.style, {
        width: '100%', fontSize: '12px', padding: '6px', boxSizing: 'border-box', marginTop: '6px',
        border: '1px solid #d1d5db', borderRadius: '6px', fontFamily: 'inherit',
      });

      var row = document.createElement('div');
      Object.assign(row.style, { display: 'flex', gap: '6px', marginTop: '8px' });

      var sendBtn = document.createElement('button');
      sendBtn.textContent = 'Send';
      Object.assign(sendBtn.style, {
        flex: '1', background: '#0EA5E9', color: '#fff', border: 'none', borderRadius: '6px',
        padding: '7px', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
      });

      var cancelBtn = document.createElement('button');
      cancelBtn.textContent = 'Cancel';
      Object.assign(cancelBtn.style, {
        background: 'transparent', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: '6px',
        padding: '7px 10px', fontSize: '12px', cursor: 'pointer',
      });
      cancelBtn.onclick = function () { closeForm(form); };

      sendBtn.onclick = function () {
        var text = textarea.value.trim();
        if (!text) return;
        sendBtn.disabled = true;
        sendBtn.textContent = 'Sending…';
        var payload = JSON.stringify({
          projectId: PROJECT_ID, pagePath: PAGE_PATH, xPct: xPct, yPct: yPct,
          body: text, authorName: nameInput.value.trim() || null,
        });
        fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload })
          .then(function (r) { return r.json().catch(function () { return {}; }); })
          .then(function (data) {
            closeForm(form);
            if (data && data.success === false) return;
            pinCount++;
            var pin = document.createElement('div');
            pin.textContent = String(pinCount);
            Object.assign(pin.style, {
              position: 'fixed', left: (clientX - 10) + 'px', top: (clientY - 10) + 'px',
              width: '20px', height: '20px', borderRadius: '50%', background: '#0EA5E9', color: '#fff',
              fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 2147483000, boxShadow: '0 2px 6px rgba(0,0,0,0.3)', pointerEvents: 'none',
            });
            pin.title = text;
            document.body.appendChild(pin);
          })
          .catch(function () { closeForm(form); });
      };

      row.appendChild(sendBtn);
      row.appendChild(cancelBtn);
      form.appendChild(textarea);
      form.appendChild(nameInput);
      form.appendChild(row);
      document.body.appendChild(form);
      textarea.focus();
    }

    document.addEventListener('click', function (e) {
      if (!active) return;
      if (e.target === toggle) return;
      if (e.target && e.target.closest && e.target.closest('#wyber-fb-form')) return;
      e.preventDefault();
      e.stopPropagation();
      var xPct = (e.clientX / window.innerWidth) * 100;
      var docHeight = document.documentElement.scrollHeight || window.innerHeight;
      var yPct = ((e.clientY + window.scrollY) / docHeight) * 100;
      openForm(e.clientX, e.clientY, xPct, yPct);
    }, true);
  } catch (e) {}
})();
</script>`
}

export function injectComments(html: string, opts: { projectId: string; publicPath?: string }): string {
  if (html.includes(COMMENTS_MARKER)) return html
  const snippet = buildSnippet(opts.projectId, opts.publicPath || '/')
  return html.includes('</body>')
    ? html.replace('</body>', `${snippet}\n</body>`)
    : html + snippet
}
