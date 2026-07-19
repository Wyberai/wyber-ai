'use client';

import { useState } from 'react';

// Public account-deletion page. Required by Google Play (a web resource where
// users can request account + data deletion; its URL goes in the Data safety
// form) and a good companion to the in-app Delete Account option. Auth is via
// the session cookie, so a signed-in user's DELETE request just works; a
// signed-out user gets a 401 and clear next steps.

export default function DeleteAccountPage() {
  const [confirmed, setConfirmed] = useState(false);
  const [state, setState] = useState<'idle' | 'working' | 'done' | 'signin' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function onDelete() {
    setState('working');
    try {
      const res = await fetch('/api/account/delete', { method: 'DELETE' });
      if (res.status === 401) {
        setState('signin');
        return;
      }
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        setMessage(t.slice(0, 200) || 'Something went wrong.');
        setState('error');
        return;
      }
      setState('done');
    } catch {
      setMessage('Network error. Please try again.');
      setState('error');
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-bold">Delete your WyberAi account</h1>

      {state === 'done' ? (
        <p className="mt-4 text-green-600">
          Your account and all associated data have been permanently deleted.
        </p>
      ) : state === 'signin' ? (
        <div className="mt-4 space-y-3 text-sm text-neutral-600">
          <p>
            You need to be signed in to delete your account. Sign in at{' '}
            <a className="underline" href="/login">
              wyberai.com/login
            </a>{' '}
            and return to this page, or delete your account directly in the WyberAi mobile app
            (Account → Delete account).
          </p>
          <p>
            Prefer we handle it? Email{' '}
            <a className="underline" href="mailto:support@wyberai.com">
              support@wyberai.com
            </a>{' '}
            from your account email and we&apos;ll delete it for you.
          </p>
        </div>
      ) : (
        <>
          <p className="mt-4 text-sm text-neutral-600">
            This permanently deletes your account, every app you&apos;ve built, and all associated
            data (projects, credits, and profile). <strong>This cannot be undone.</strong>
          </p>

          <label className="mt-6 flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-1"
            />
            <span>I understand this is permanent and want to delete my account and all my data.</span>
          </label>

          {state === 'error' ? <p className="mt-4 text-sm text-red-600">{message}</p> : null}

          <button
            onClick={onDelete}
            disabled={!confirmed || state === 'working'}
            className="mt-6 rounded-md bg-red-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-40"
          >
            {state === 'working' ? 'Deleting…' : 'Delete my account'}
          </button>

          <p className="mt-6 text-xs text-neutral-500">
            You can also delete your account from the WyberAi mobile app: Account → Delete account.
            Questions? <a className="underline" href="mailto:support@wyberai.com">support@wyberai.com</a>
          </p>
        </>
      )}
    </main>
  );
}
