'use client';
import { useState, useEffect } from 'react';
import { useEditorStore } from '@/store/editor';
import { useT } from '@/lib/i18n/useT';
import { EDITOR_CONNECTORS_STRINGS } from '@/lib/i18n/dict/editor-connectors';

// Real brand logos, pulled from Composio's public logo CDN purely for art —
// no OAuth or connection tie — falls back to the emoji glyph if it 404s.
function ConnectorIcon({ logoUrl, emoji, color, name }: { logoUrl?: string; emoji: string; color: string; name: string }) {
  const [failed, setFailed] = useState(false);
  const showImage = logoUrl && !failed;
  return (
    <div style={{ width: 30, height: 30, borderRadius: 7, background: showImage ? '#fff' : color + '18', border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, overflow: 'hidden' }}>
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={name} width={20} height={20} style={{ objectFit: 'contain' }} onError={() => setFailed(true)} />
      ) : emoji}
    </div>
  );
}

// Every connector (other than Supabase, which is auto-provisioned) works the
// same way: clicking "+ Add" asks for the exact secret(s) the generated code
// needs, saves them to the user's vault (/api/secrets), and the deploy step
// already injects vault secrets as env vars (see lib/deploy-env.ts) — so
// there's nothing to "connect" via OAuth here. secretKeys is omitted only
// for connectors that need no key at all (e.g. Vercel Analytics, built in).
// logoSlug is just for the Composio logo CDN — purely cosmetic, no OAuth tie.
type SecretKey = { name: string; placeholder: string };
const CONNECTORS: { id: string; name: string; desc: string; icon: string; color: string; category: string; prompt: string; logoSlug?: string; secretKeys?: SecretKey[] }[] = [
  // Database & Auth
  { id: 'supabase', name: 'Supabase', desc: 'Database, Auth, Storage, Realtime', icon: '🗄', color: '#3FCF8E', category: 'Database & Auth', prompt: 'Add Supabase integration with auth and database to this app. Use @supabase/supabase-js.' },
  { id: 'firebase', name: 'Firebase', desc: 'Auth, Firestore, Cloud Functions', icon: '🔥', color: '#FFCA28', category: 'Database & Auth', prompt: 'Add Firebase authentication and Firestore database.', secretKeys: [{ name: 'FIREBASE_API_KEY', placeholder: 'AIza...' }, { name: 'FIREBASE_PROJECT_ID', placeholder: 'my-project-id' }] },
  { id: 'planetscale', name: 'PlanetScale', desc: 'Serverless MySQL', icon: '🌍', color: '#F4F4F5', category: 'Database & Auth', prompt: 'Add PlanetScale database connection with Drizzle ORM.', secretKeys: [{ name: 'DATABASE_URL', placeholder: 'mysql://...' }] },
  { id: 'neon', name: 'Neon', desc: 'Serverless Postgres', icon: '🐘', color: '#00E5A0', category: 'Database & Auth', logoSlug: 'neon', prompt: 'Add Neon serverless Postgres database with connection pooling.', secretKeys: [{ name: 'DATABASE_URL', placeholder: 'postgres://...' }] },
  { id: 'mongodb', name: 'MongoDB Atlas', desc: 'Document database', icon: '🍃', color: '#47A248', category: 'Database & Auth', prompt: 'Add MongoDB Atlas with Mongoose for document storage.', secretKeys: [{ name: 'MONGODB_URI', placeholder: 'mongodb+srv://...' }] },
  { id: 'convex', name: 'Convex', desc: 'Reactive backend-as-a-service', icon: '🔺', color: '#EE5522', category: 'Database & Auth', logoSlug: 'convex', prompt: 'Add Convex backend with real-time queries and mutations.', secretKeys: [{ name: 'CONVEX_DEPLOY_KEY', placeholder: 'prod:...' }] },
  { id: 'clerk', name: 'Clerk', desc: 'Drop-in auth & user management', icon: '🔐', color: '#6C47FF', category: 'Database & Auth', prompt: 'Add Clerk authentication with sign-in, sign-up, and user profile components.', secretKeys: [{ name: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', placeholder: 'pk_...' }, { name: 'CLERK_SECRET_KEY', placeholder: 'sk_...' }] },
  { id: 'auth0', name: 'Auth0', desc: 'Identity & access management', icon: '🛡', color: '#EB5424', category: 'Database & Auth', prompt: 'Add Auth0 authentication with social login, MFA, and session management.', secretKeys: [{ name: 'AUTH0_CLIENT_ID', placeholder: 'client id' }, { name: 'AUTH0_CLIENT_SECRET', placeholder: 'client secret' }] },
  { id: 'appwrite', name: 'Appwrite', desc: 'Open-source backend', icon: '🏗', color: '#FD366E', category: 'Database & Auth', prompt: 'Add Appwrite backend for auth, database, storage, and functions.', secretKeys: [{ name: 'NEXT_PUBLIC_APPWRITE_ENDPOINT', placeholder: 'https://cloud.appwrite.io/v1' }, { name: 'NEXT_PUBLIC_APPWRITE_PROJECT_ID', placeholder: 'project id' }] },
  { id: 'prisma', name: 'Prisma', desc: 'Type-safe ORM', icon: '💎', color: '#2D3748', category: 'Database & Auth', logoSlug: 'prisma', prompt: 'Add Prisma ORM with type-safe database queries and migrations.', secretKeys: [{ name: 'DATABASE_URL', placeholder: 'postgres://...' }] },

  // Payments
  { id: 'stripe', name: 'Stripe', desc: 'Payments, subscriptions, invoices', icon: '💳', color: '#635BFF', category: 'Payments', logoSlug: 'stripe', prompt: 'Add Stripe payment integration with checkout, subscriptions, and webhook handling.', secretKeys: [{ name: 'STRIPE_SECRET_KEY', placeholder: 'sk_live_... or sk_test_...' }] },
  { id: 'lemonsqueezy', name: 'Lemon Squeezy', desc: 'Payments for SaaS & digital products', icon: '🍋', color: '#FFC233', category: 'Payments', prompt: 'Add Lemon Squeezy for product sales with checkout overlay and license key validation.', secretKeys: [{ name: 'LEMONSQUEEZY_API_KEY', placeholder: 'api key' }] },
  { id: 'paypal', name: 'PayPal', desc: 'Online payments', icon: '🅿', color: '#003087', category: 'Payments', logoSlug: 'paypal', prompt: 'Add PayPal payment buttons with checkout and order management.', secretKeys: [{ name: 'PAYPAL_CLIENT_ID', placeholder: 'client id' }, { name: 'PAYPAL_CLIENT_SECRET', placeholder: 'client secret' }] },
  { id: 'razorpay', name: 'Razorpay', desc: 'Payments for India & global', icon: '💰', color: '#0C2451', category: 'Payments', logoSlug: 'razorpay', prompt: 'Add Razorpay payment gateway with checkout and subscription billing.', secretKeys: [{ name: 'RAZORPAY_KEY_ID', placeholder: 'key id' }, { name: 'RAZORPAY_KEY_SECRET', placeholder: 'key secret' }] },

  // AI & ML
  { id: 'openai', name: 'OpenAI', desc: 'GPT, DALL-E, Whisper, Embeddings', icon: '🤖', color: '#74AA9C', category: 'AI & ML', logoSlug: 'openai', prompt: 'Add OpenAI API integration for chat completions, embeddings, and image generation.', secretKeys: [{ name: 'OPENAI_API_KEY', placeholder: 'sk-...' }] },
  { id: 'anthropic', name: 'Anthropic', desc: 'Claude AI models', icon: '🧠', color: '#CC785C', category: 'AI & ML', prompt: 'Add Anthropic Claude API for AI chat, analysis, and content generation.', secretKeys: [{ name: 'ANTHROPIC_API_KEY', placeholder: 'sk-ant-...' }] },
  { id: 'replicate', name: 'Replicate', desc: 'Run ML models via API', icon: '🎨', color: '#0A0A0A', category: 'AI & ML', logoSlug: 'replicate', prompt: 'Add Replicate API to run image generation, video, and audio ML models.', secretKeys: [{ name: 'REPLICATE_API_TOKEN', placeholder: 'r8_...' }] },
  { id: 'huggingface', name: 'Hugging Face', desc: 'Open-source ML models', icon: '🤗', color: '#FFD21E', category: 'AI & ML', prompt: 'Add Hugging Face Inference API for NLP, image, and audio models.', secretKeys: [{ name: 'HUGGINGFACE_API_KEY', placeholder: 'hf_...' }] },
  { id: 'pinecone', name: 'Pinecone', desc: 'Vector database for AI', icon: '🌲', color: '#000000', category: 'AI & ML', logoSlug: 'pinecone', prompt: 'Add Pinecone vector database for semantic search and RAG.', secretKeys: [{ name: 'PINECONE_API_KEY', placeholder: 'api key' }] },
  { id: 'langchain', name: 'LangChain', desc: 'AI agent framework', icon: '🦜', color: '#1C3C3C', category: 'AI & ML', prompt: 'Add LangChain for building AI agents with tools, memory, and chains.', secretKeys: [{ name: 'OPENAI_API_KEY', placeholder: 'sk-... (model provider key)' }] },

  // Email & Communication
  { id: 'resend', name: 'Resend', desc: 'Modern email API', icon: '📧', color: '#0EA5E9', category: 'Email & Messaging', logoSlug: 'resend', prompt: 'Add Resend for transactional emails with React Email templates.', secretKeys: [{ name: 'RESEND_API_KEY', placeholder: 're_...' }] },
  { id: 'sendgrid', name: 'SendGrid', desc: 'Email delivery at scale', icon: '📨', color: '#1A82E2', category: 'Email & Messaging', logoSlug: 'sendgrid', prompt: 'Add SendGrid for sending transactional and marketing emails.', secretKeys: [{ name: 'SENDGRID_API_KEY', placeholder: 'SG...' }] },
  { id: 'twilio', name: 'Twilio', desc: 'SMS, voice, WhatsApp', icon: '📱', color: '#F22F46', category: 'Email & Messaging', prompt: 'Add Twilio for SMS notifications, voice calls, and WhatsApp messaging.', secretKeys: [{ name: 'TWILIO_ACCOUNT_SID', placeholder: 'AC...' }, { name: 'TWILIO_AUTH_TOKEN', placeholder: 'auth token' }] },
  { id: 'pusher', name: 'Pusher', desc: 'Real-time websockets', icon: '⚡', color: '#300D4F', category: 'Email & Messaging', prompt: 'Add Pusher Channels for real-time updates, live notifications, and collaborative features.', secretKeys: [{ name: 'PUSHER_APP_ID', placeholder: 'app id' }, { name: 'PUSHER_SECRET', placeholder: 'secret' }] },
  { id: 'stream', name: 'Stream', desc: 'Chat & activity feeds', icon: '💬', color: '#006CFF', category: 'Email & Messaging', prompt: 'Add Stream Chat for in-app messaging with channels, threads, and reactions.', secretKeys: [{ name: 'STREAM_API_KEY', placeholder: 'api key' }, { name: 'STREAM_API_SECRET', placeholder: 'api secret' }] },
  { id: 'knock', name: 'Knock', desc: 'Notification infrastructure', icon: '🔔', color: '#6366F1', category: 'Email & Messaging', prompt: 'Add Knock for multi-channel notifications (in-app, email, push, Slack).', secretKeys: [{ name: 'KNOCK_API_KEY', placeholder: 'sk_...' }] },

  // Storage & Media
  { id: 'cloudinary', name: 'Cloudinary', desc: 'Image & video optimization', icon: '🖼', color: '#3448C5', category: 'Storage & Media', logoSlug: 'cloudinary', prompt: 'Add Cloudinary for image/video upload, transformation, and CDN delivery.', secretKeys: [{ name: 'CLOUDINARY_URL', placeholder: 'cloudinary://...' }] },
  { id: 'uploadthing', name: 'UploadThing', desc: 'File uploads for Next.js', icon: '📁', color: '#EF4444', category: 'Storage & Media', prompt: 'Add UploadThing for drag-and-drop file uploads with progress and previews.', secretKeys: [{ name: 'UPLOADTHING_TOKEN', placeholder: 'token' }] },
  { id: 'aws-s3', name: 'AWS S3', desc: 'Object storage', icon: '☁', color: '#FF9900', category: 'Storage & Media', prompt: 'Add AWS S3 for file uploads with presigned URLs and bucket management.', secretKeys: [{ name: 'AWS_ACCESS_KEY_ID', placeholder: 'AKIA...' }, { name: 'AWS_SECRET_ACCESS_KEY', placeholder: 'secret key' }] },
  { id: 'mux', name: 'Mux', desc: 'Video streaming & analytics', icon: '🎬', color: '#FB3475', category: 'Storage & Media', prompt: 'Add Mux for video upload, adaptive streaming, and playback analytics.', secretKeys: [{ name: 'MUX_TOKEN_ID', placeholder: 'token id' }, { name: 'MUX_TOKEN_SECRET', placeholder: 'token secret' }] },

  // Analytics & Monitoring
  { id: 'posthog', name: 'PostHog', desc: 'Product analytics & feature flags', icon: '🦔', color: '#1D4AFF', category: 'Analytics', logoSlug: 'posthog', prompt: 'Add PostHog for event tracking, session replay, feature flags, and A/B testing.', secretKeys: [{ name: 'NEXT_PUBLIC_POSTHOG_KEY', placeholder: 'phc_...' }] },
  { id: 'mixpanel', name: 'Mixpanel', desc: 'User analytics & funnels', icon: '📊', color: '#7856FF', category: 'Analytics', logoSlug: 'mixpanel', prompt: 'Add Mixpanel for user event tracking, funnels, and retention analysis.', secretKeys: [{ name: 'NEXT_PUBLIC_MIXPANEL_TOKEN', placeholder: 'project token' }] },
  { id: 'sentry', name: 'Sentry', desc: 'Error tracking & performance', icon: '🐛', color: '#362D59', category: 'Analytics', logoSlug: 'sentry', prompt: 'Add Sentry for error tracking, performance monitoring, and session replay.', secretKeys: [{ name: 'SENTRY_DSN', placeholder: 'https://...ingest.sentry.io/...' }] },
  { id: 'vercel-analytics', name: 'Vercel Analytics', desc: 'Web analytics & vitals', icon: '📈', color: '#000000', category: 'Analytics', prompt: 'Add Vercel Analytics for page views, web vitals, and audience insights.' },
  { id: 'plausible', name: 'Plausible', desc: 'Privacy-friendly analytics', icon: '📉', color: '#5850EC', category: 'Analytics', prompt: 'Add Plausible Analytics for lightweight, privacy-friendly web analytics.', secretKeys: [{ name: 'NEXT_PUBLIC_PLAUSIBLE_DOMAIN', placeholder: 'yourdomain.com' }] },

  // CMS & Content
  { id: 'sanity', name: 'Sanity', desc: 'Headless CMS', icon: '📝', color: '#F36458', category: 'CMS & Content', logoSlug: 'sanity', prompt: 'Add Sanity CMS for structured content with GROQ queries and real-time previews.', secretKeys: [{ name: 'NEXT_PUBLIC_SANITY_PROJECT_ID', placeholder: 'project id' }, { name: 'SANITY_API_TOKEN', placeholder: 'api token' }] },
  { id: 'contentful', name: 'Contentful', desc: 'Content platform', icon: '📄', color: '#2478CC', category: 'CMS & Content', logoSlug: 'contentful', prompt: 'Add Contentful CMS for managing and delivering content via API.', secretKeys: [{ name: 'CONTENTFUL_SPACE_ID', placeholder: 'space id' }, { name: 'CONTENTFUL_ACCESS_TOKEN', placeholder: 'access token' }] },
  { id: 'strapi', name: 'Strapi', desc: 'Open-source headless CMS', icon: '🚀', color: '#4945FF', category: 'CMS & Content', prompt: 'Add Strapi headless CMS for content management with REST or GraphQL API.', secretKeys: [{ name: 'STRAPI_API_URL', placeholder: 'https://your-strapi.app' }, { name: 'STRAPI_API_TOKEN', placeholder: 'api token' }] },
  { id: 'notion', name: 'Notion API', desc: 'Notion as a database', icon: '📓', color: '#000000', category: 'CMS & Content', logoSlug: 'notion', prompt: 'Add Notion API integration to use Notion databases as a content backend.', secretKeys: [{ name: 'NOTION_API_KEY', placeholder: 'secret_...' }] },

  // Maps & Location
  { id: 'mapbox', name: 'Mapbox', desc: 'Maps, geocoding, directions', icon: '🗺', color: '#4264FB', category: 'Maps & Location', logoSlug: 'mapbox', prompt: 'Add Mapbox GL for interactive maps with markers, popups, and directions.', secretKeys: [{ name: 'NEXT_PUBLIC_MAPBOX_TOKEN', placeholder: 'pk.eyJ1...' }] },
  { id: 'google-maps', name: 'Google Maps', desc: 'Maps & Places API', icon: '📍', color: '#4285F4', category: 'Maps & Location', logoSlug: 'google_maps', prompt: 'Add Google Maps with markers, search, autocomplete, and directions.', secretKeys: [{ name: 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY', placeholder: 'AIza...' }] },

  // Search
  { id: 'algolia', name: 'Algolia', desc: 'Instant search & discovery', icon: '🔍', color: '#003DFF', category: 'Search', logoSlug: 'algolia', prompt: 'Add Algolia for instant search with faceted filtering and typo tolerance.', secretKeys: [{ name: 'NEXT_PUBLIC_ALGOLIA_APP_ID', placeholder: 'app id' }, { name: 'ALGOLIA_ADMIN_KEY', placeholder: 'admin key' }] },
  { id: 'typesense', name: 'Typesense', desc: 'Open-source search engine', icon: '🔎', color: '#D64444', category: 'Search', prompt: 'Add Typesense for fast, typo-tolerant search with geo-search support.', secretKeys: [{ name: 'TYPESENSE_API_KEY', placeholder: 'api key' }] },

  // Scheduling & Calendar
  { id: 'cal', name: 'Cal.com', desc: 'Scheduling & booking', icon: '📅', color: '#292929', category: 'Scheduling', logoSlug: 'cal', prompt: 'Add Cal.com embed for appointment booking and scheduling.', secretKeys: [{ name: 'CAL_API_KEY', placeholder: 'cal_live_...' }] },
  { id: 'google-calendar', name: 'Google Calendar', desc: 'Calendar events API', icon: '🗓', color: '#4285F4', category: 'Scheduling', logoSlug: 'googlecalendar', prompt: 'Add Google Calendar API for creating, reading, and managing calendar events.', secretKeys: [{ name: 'GOOGLE_CALENDAR_API_KEY', placeholder: 'api key' }] },

  // E-commerce
  { id: 'shopify', name: 'Shopify Storefront', desc: 'Headless commerce', icon: '🛒', color: '#96BF48', category: 'E-commerce', logoSlug: 'shopify', prompt: 'Add Shopify Storefront API for products, cart, and checkout.', secretKeys: [{ name: 'SHOPIFY_STOREFRONT_TOKEN', placeholder: 'token' }] },
  { id: 'snipcart', name: 'Snipcart', desc: 'Drop-in shopping cart', icon: '🛍', color: '#F5D553', category: 'E-commerce', prompt: 'Add Snipcart for a drop-in shopping cart with product management and checkout.', secretKeys: [{ name: 'NEXT_PUBLIC_SNIPCART_API_KEY', placeholder: 'api key' }] },
];

export function ConnectorsPanel({ projectId, onSwitchToChat }: { projectId: string; onSwitchToChat?: () => void }) {
  const t = useT(EDITOR_CONNECTORS_STRINGS);
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState<string | null>(null);

  // ChatPanel (which listens for these events) is only mounted while the
  // Chat tab is active — RightPanel swaps tabs in and out, it doesn't stack
  // them. Dispatching straight from here while the user is on the
  // Connectors tab was a no-op: nothing was listening. Switch tabs first,
  // then dispatch once ChatPanel has had a tick to mount and register.
  const sendToChat = (eventName: string, detail: unknown) => {
    onSwitchToChat?.();
    setTimeout(() => window.dispatchEvent(new CustomEvent(eventName, { detail })), 60);
  };
  // Names already in the user's secrets vault — this is what actually makes a
  // connector "work" (deploy-env.ts injects these into every Vercel deploy),
  // so it's the only thing worth showing a checkmark for.
  const [vaultNames, setVaultNames] = useState<Set<string>>(new Set());

  const loadVault = () => {
    fetch('/api/secrets')
      .then(r => r.json())
      .then(d => setVaultNames(new Set((d.secrets ?? []).map((s: { name: string }) => s.name.toUpperCase()))))
      .catch(() => {});
  };

  useEffect(() => {
    loadVault();
    // Secrets are saved from the chat gate, not this panel — it fires this
    // event on save so "+ Add" here flips to "✓ Connected" without a reload.
    window.addEventListener('wyber:secrets-saved', loadVault);
    return () => window.removeEventListener('wyber:secrets-saved', loadVault);
  }, []);

  const filtered = CONNECTORS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.desc.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase())
  );

  const categories = [...new Set(filtered.map(c => c.category))];
  const projectConnectors = useEditorStore(s => s.connectors);
  const supabaseConnected = projectConnectors?.some(c => c.service === 'supabase');
  const isConnected = (c: typeof CONNECTORS[0]) =>
    c.id === 'supabase' ? !!supabaseConnected : (c.secretKeys ?? []).every(k => vaultNames.has(k.name.toUpperCase()));

  const handleAdd = async (connector: typeof CONNECTORS[0]) => {
    if (connector.id === 'supabase') {
      // Open the OAuth connect modal: the user links or creates a project in
      // THEIR OWN Supabase org (their free tier — costs them nothing for the
      // first two projects). The old path auto-provisioned into WyberAi's
      // platform org via /api/provision-supabase, which put every customer
      // database on OUR Supabase bill (~$10/mo each on a paid org) with
      // generic names nobody could tell apart. Never bring that back without
      // metering it as a paid, credit-charged managed offering.
      window.dispatchEvent(new CustomEvent('wyber-open-supabase'));
      return;
    }

    // No key needed (e.g. Vercel Analytics) — just tell the AI to add it.
    if (!connector.secretKeys?.length) {
      sendToChat('wyber:chat-prompt', connector.prompt);
      return;
    }

    // Already have every key this connector needs — build straight away.
    if (isConnected(connector)) {
      sendToChat('wyber:chat-prompt', connector.prompt);
      return;
    }

    // Ask for the exact key(s) inline (same gate ChatPanel already shows for
    // Supabase/Stripe when typed in chat) — matches how Lovable prompts for a
    // secret right when a feature needs one, no OAuth dance, no fake "connected".
    sendToChat('wyber:request-secrets', { prompt: connector.prompt, group: { label: connector.name, icon: connector.icon, color: connector.color, keys: connector.secretKeys } });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-base)' }}>
      <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid var(--ide-border)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{t('connectorsTitle')}</div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('searchConnectorsPlaceholder')}
          style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid var(--ide-border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: 12, fontFamily: 'inherit', outline: 'none' }}
        />
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 12px' }}>
        {categories.map(cat => (
          <div key={cat} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{cat}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {filtered.filter(c => c.category === cat).map(c => {
                const connected = isConnected(c);
                const logoUrl = c.id === 'supabase' ? 'https://logos.composio.dev/api/supabase' : c.logoSlug ? `https://logos.composio.dev/api/${c.logoSlug}` : undefined;
                return (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 8, border: '1px solid var(--ide-border)', background: 'var(--bg-surface)', transition: 'all 0.15s' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(14,165,233,0.3)')}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--ide-border)'}
                >
                  <ConnectorIcon logoUrl={logoUrl} emoji={c.icon} color={c.color} name={c.name} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.desc}</div>
                  </div>
                  <button
                    onClick={() => handleAdd(c)}
                    disabled={adding === c.id}
                    style={{
                      padding: '4px 10px', borderRadius: 6, border: '1px solid var(--ide-border)',
                      background: connected ? 'rgba(34,197,94,0.1)' : adding === c.id ? 'rgba(14,165,233,0.1)' : 'transparent',
                      color: connected ? '#22c55e' : adding === c.id ? '#0EA5E9' : 'var(--text-secondary)',
                      fontSize: 11, fontWeight: 600, cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit', transition: 'all 0.15s',
                    }}
                  >
                    {connected ? `✓ ${t('connectedBadge')}` : adding === c.id ? t('addingLabel') : `+ ${t('addBtn')}`}
                  </button>
                </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
