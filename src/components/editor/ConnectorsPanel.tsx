'use client';
import { useState, useEffect } from 'react';
import { useEditorStore } from '@/store/editor';

// Real brand logos for everything with a Composio toolkit (Composio hosts a
// CDN of them, keyed by the same toolkit slug we already use for OAuth) —
// falls back to the emoji glyph if the image 404s or hasn't loaded yet.
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

// composioSlug is set ONLY for connectors verified against Composio's live
// toolkit catalog (1047 toolkits, checked via cursor pagination) — these get
// a real OAuth connect flow. Everything without a composioSlug has no real
// auth path available and is rendered as "Coming soon", not faked.
const CONNECTORS = [
  // Database & Auth
  { id: 'supabase', name: 'Supabase', desc: 'Database, Auth, Storage, Realtime', icon: '🗄', color: '#3FCF8E', category: 'Database & Auth', prompt: 'Add Supabase integration with auth and database to this app. Use @supabase/supabase-js.' },
  { id: 'firebase', name: 'Firebase', desc: 'Auth, Firestore, Cloud Functions', icon: '🔥', color: '#FFCA28', category: 'Database & Auth', prompt: 'Add Firebase authentication and Firestore database.' },
  { id: 'planetscale', name: 'PlanetScale', desc: 'Serverless MySQL', icon: '🌍', color: '#F4F4F5', category: 'Database & Auth', prompt: 'Add PlanetScale database connection with Drizzle ORM.' },
  { id: 'neon', name: 'Neon', desc: 'Serverless Postgres', icon: '🐘', color: '#00E5A0', category: 'Database & Auth', composioSlug: 'neon', prompt: 'Add Neon serverless Postgres database with connection pooling.' },
  { id: 'mongodb', name: 'MongoDB Atlas', desc: 'Document database', icon: '🍃', color: '#47A248', category: 'Database & Auth', prompt: 'Add MongoDB Atlas with Mongoose for document storage.' },
  { id: 'convex', name: 'Convex', desc: 'Reactive backend-as-a-service', icon: '🔺', color: '#EE5522', category: 'Database & Auth', composioSlug: 'convex', prompt: 'Add Convex backend with real-time queries and mutations.' },
  { id: 'clerk', name: 'Clerk', desc: 'Drop-in auth & user management', icon: '🔐', color: '#6C47FF', category: 'Database & Auth', prompt: 'Add Clerk authentication with sign-in, sign-up, and user profile components.' },
  { id: 'auth0', name: 'Auth0', desc: 'Identity & access management', icon: '🛡', color: '#EB5424', category: 'Database & Auth', prompt: 'Add Auth0 authentication with social login, MFA, and session management.' },
  { id: 'appwrite', name: 'Appwrite', desc: 'Open-source backend', icon: '🏗', color: '#FD366E', category: 'Database & Auth', prompt: 'Add Appwrite backend for auth, database, storage, and functions.' },
  { id: 'prisma', name: 'Prisma', desc: 'Type-safe ORM', icon: '💎', color: '#2D3748', category: 'Database & Auth', composioSlug: 'prisma', prompt: 'Add Prisma ORM with type-safe database queries and migrations.' },

  // Payments
  { id: 'stripe', name: 'Stripe', desc: 'Payments, subscriptions, invoices', icon: '💳', color: '#635BFF', category: 'Payments', composioSlug: 'stripe', prompt: 'Add Stripe payment integration with checkout, subscriptions, and webhook handling.' },
  { id: 'lemonsqueezy', name: 'Lemon Squeezy', desc: 'Payments for SaaS & digital products', icon: '🍋', color: '#FFC233', category: 'Payments', prompt: 'Add Lemon Squeezy for product sales with checkout overlay and license key validation.' },
  { id: 'paypal', name: 'PayPal', desc: 'Online payments', icon: '🅿', color: '#003087', category: 'Payments', composioSlug: 'paypal', prompt: 'Add PayPal payment buttons with checkout and order management.' },
  { id: 'razorpay', name: 'Razorpay', desc: 'Payments for India & global', icon: '💰', color: '#0C2451', category: 'Payments', composioSlug: 'razorpay', prompt: 'Add Razorpay payment gateway with checkout and subscription billing.' },

  // AI & ML
  { id: 'openai', name: 'OpenAI', desc: 'GPT, DALL-E, Whisper, Embeddings', icon: '🤖', color: '#74AA9C', category: 'AI & ML', composioSlug: 'openai', prompt: 'Add OpenAI API integration for chat completions, embeddings, and image generation.' },
  { id: 'anthropic', name: 'Anthropic', desc: 'Claude AI models', icon: '🧠', color: '#CC785C', category: 'AI & ML', prompt: 'Add Anthropic Claude API for AI chat, analysis, and content generation.' },
  { id: 'replicate', name: 'Replicate', desc: 'Run ML models via API', icon: '🎨', color: '#0A0A0A', category: 'AI & ML', composioSlug: 'replicate', prompt: 'Add Replicate API to run image generation, video, and audio ML models.' },
  { id: 'huggingface', name: 'Hugging Face', desc: 'Open-source ML models', icon: '🤗', color: '#FFD21E', category: 'AI & ML', prompt: 'Add Hugging Face Inference API for NLP, image, and audio models.' },
  { id: 'pinecone', name: 'Pinecone', desc: 'Vector database for AI', icon: '🌲', color: '#000000', category: 'AI & ML', composioSlug: 'pinecone', prompt: 'Add Pinecone vector database for semantic search and RAG.' },
  { id: 'langchain', name: 'LangChain', desc: 'AI agent framework', icon: '🦜', color: '#1C3C3C', category: 'AI & ML', prompt: 'Add LangChain for building AI agents with tools, memory, and chains.' },

  // Email & Communication
  { id: 'resend', name: 'Resend', desc: 'Modern email API', icon: '📧', color: '#0EA5E9', category: 'Email & Messaging', composioSlug: 'resend', prompt: 'Add Resend for transactional emails with React Email templates.' },
  { id: 'sendgrid', name: 'SendGrid', desc: 'Email delivery at scale', icon: '📨', color: '#1A82E2', category: 'Email & Messaging', composioSlug: 'sendgrid', prompt: 'Add SendGrid for sending transactional and marketing emails.' },
  { id: 'twilio', name: 'Twilio', desc: 'SMS, voice, WhatsApp', icon: '📱', color: '#F22F46', category: 'Email & Messaging', prompt: 'Add Twilio for SMS notifications, voice calls, and WhatsApp messaging.' },
  { id: 'pusher', name: 'Pusher', desc: 'Real-time websockets', icon: '⚡', color: '#300D4F', category: 'Email & Messaging', prompt: 'Add Pusher Channels for real-time updates, live notifications, and collaborative features.' },
  { id: 'stream', name: 'Stream', desc: 'Chat & activity feeds', icon: '💬', color: '#006CFF', category: 'Email & Messaging', prompt: 'Add Stream Chat for in-app messaging with channels, threads, and reactions.' },
  { id: 'knock', name: 'Knock', desc: 'Notification infrastructure', icon: '🔔', color: '#6366F1', category: 'Email & Messaging', prompt: 'Add Knock for multi-channel notifications (in-app, email, push, Slack).' },

  // Storage & Media
  { id: 'cloudinary', name: 'Cloudinary', desc: 'Image & video optimization', icon: '🖼', color: '#3448C5', category: 'Storage & Media', composioSlug: 'cloudinary', prompt: 'Add Cloudinary for image/video upload, transformation, and CDN delivery.' },
  { id: 'uploadthing', name: 'UploadThing', desc: 'File uploads for Next.js', icon: '📁', color: '#EF4444', category: 'Storage & Media', prompt: 'Add UploadThing for drag-and-drop file uploads with progress and previews.' },
  { id: 'aws-s3', name: 'AWS S3', desc: 'Object storage', icon: '☁', color: '#FF9900', category: 'Storage & Media', prompt: 'Add AWS S3 for file uploads with presigned URLs and bucket management.' },
  { id: 'mux', name: 'Mux', desc: 'Video streaming & analytics', icon: '🎬', color: '#FB3475', category: 'Storage & Media', prompt: 'Add Mux for video upload, adaptive streaming, and playback analytics.' },

  // Analytics & Monitoring
  { id: 'posthog', name: 'PostHog', desc: 'Product analytics & feature flags', icon: '🦔', color: '#1D4AFF', category: 'Analytics', composioSlug: 'posthog', prompt: 'Add PostHog for event tracking, session replay, feature flags, and A/B testing.' },
  { id: 'mixpanel', name: 'Mixpanel', desc: 'User analytics & funnels', icon: '📊', color: '#7856FF', category: 'Analytics', composioSlug: 'mixpanel', prompt: 'Add Mixpanel for user event tracking, funnels, and retention analysis.' },
  { id: 'sentry', name: 'Sentry', desc: 'Error tracking & performance', icon: '🐛', color: '#362D59', category: 'Analytics', composioSlug: 'sentry', prompt: 'Add Sentry for error tracking, performance monitoring, and session replay.' },
  { id: 'vercel-analytics', name: 'Vercel Analytics', desc: 'Web analytics & vitals', icon: '📈', color: '#000000', category: 'Analytics', prompt: 'Add Vercel Analytics for page views, web vitals, and audience insights.' },
  { id: 'plausible', name: 'Plausible', desc: 'Privacy-friendly analytics', icon: '📉', color: '#5850EC', category: 'Analytics', prompt: 'Add Plausible Analytics for lightweight, privacy-friendly web analytics.' },

  // CMS & Content
  { id: 'sanity', name: 'Sanity', desc: 'Headless CMS', icon: '📝', color: '#F36458', category: 'CMS & Content', composioSlug: 'sanity', prompt: 'Add Sanity CMS for structured content with GROQ queries and real-time previews.' },
  { id: 'contentful', name: 'Contentful', desc: 'Content platform', icon: '📄', color: '#2478CC', category: 'CMS & Content', composioSlug: 'contentful', prompt: 'Add Contentful CMS for managing and delivering content via API.' },
  { id: 'strapi', name: 'Strapi', desc: 'Open-source headless CMS', icon: '🚀', color: '#4945FF', category: 'CMS & Content', prompt: 'Add Strapi headless CMS for content management with REST or GraphQL API.' },
  { id: 'notion', name: 'Notion API', desc: 'Notion as a database', icon: '📓', color: '#000000', category: 'CMS & Content', composioSlug: 'notion', prompt: 'Add Notion API integration to use Notion databases as a content backend.' },

  // Maps & Location
  { id: 'mapbox', name: 'Mapbox', desc: 'Maps, geocoding, directions', icon: '🗺', color: '#4264FB', category: 'Maps & Location', composioSlug: 'mapbox', prompt: 'Add Mapbox GL for interactive maps with markers, popups, and directions.' },
  { id: 'google-maps', name: 'Google Maps', desc: 'Maps & Places API', icon: '📍', color: '#4285F4', category: 'Maps & Location', composioSlug: 'google_maps', prompt: 'Add Google Maps with markers, search, autocomplete, and directions.' },

  // Search
  { id: 'algolia', name: 'Algolia', desc: 'Instant search & discovery', icon: '🔍', color: '#003DFF', category: 'Search', composioSlug: 'algolia', prompt: 'Add Algolia for instant search with faceted filtering and typo tolerance.' },
  { id: 'typesense', name: 'Typesense', desc: 'Open-source search engine', icon: '🔎', color: '#D64444', category: 'Search', prompt: 'Add Typesense for fast, typo-tolerant search with geo-search support.' },

  // Scheduling & Calendar
  { id: 'cal', name: 'Cal.com', desc: 'Scheduling & booking', icon: '📅', color: '#292929', category: 'Scheduling', composioSlug: 'cal', prompt: 'Add Cal.com embed for appointment booking and scheduling.' },
  { id: 'google-calendar', name: 'Google Calendar', desc: 'Calendar events API', icon: '🗓', color: '#4285F4', category: 'Scheduling', composioSlug: 'googlecalendar', prompt: 'Add Google Calendar API for creating, reading, and managing calendar events.' },

  // E-commerce
  { id: 'shopify', name: 'Shopify Storefront', desc: 'Headless commerce', icon: '🛒', color: '#96BF48', category: 'E-commerce', composioSlug: 'shopify', prompt: 'Add Shopify Storefront API for products, cart, and checkout.' },
  { id: 'snipcart', name: 'Snipcart', desc: 'Drop-in shopping cart', icon: '🛍', color: '#F5D553', category: 'E-commerce', prompt: 'Add Snipcart for a drop-in shopping cart with product management and checkout.' },
];

export function ConnectorsPanel({ projectId }: { projectId: string }) {
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState<string | null>(null);
  const [connectedSlugs, setConnectedSlugs] = useState<Set<string>>(new Set());

  // Real persisted state — refetched on mount and after every connect, so a
  // page reload (or this panel reopening) reflects what's actually connected
  // via Composio, not just transient component state.
  const loadConnections = () => {
    fetch('/api/composio/connections')
      .then(r => r.json())
      .then(d => {
        const active = (d.connections ?? []).filter((c: { status: string }) => c.status === 'ACTIVE');
        setConnectedSlugs(new Set(active.map((c: { toolkit: string }) => c.toolkit)));
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadConnections();
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'composio_oauth_result' && e.data.success) loadConnections();
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const filtered = CONNECTORS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.desc.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase())
  );

  const categories = [...new Set(filtered.map(c => c.category))];

  const handleAdd = async (connector: typeof CONNECTORS[0]) => {
    if (connector.id === 'supabase') {
      setAdding(connector.id);
      // Auto-provision Supabase — no signup required
      try {
        const project = useEditorStore.getState().project;
        const res = await fetch('/api/provision-supabase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId: project?.id, projectName: project?.name }),
        });
        const data = await res.json();
        if (res.ok) {
          // Save connector so the store picks it up
          await fetch('/api/connectors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectId: project?.id, service: 'supabase', apiKey: data.anonKey, config: { url: data.supabaseUrl, ref: data.projectId } }),
          });
          useEditorStore.getState().setConnectors([...useEditorStore.getState().connectors, { service: 'supabase', config: { url: data.supabaseUrl }, connected_at: new Date().toISOString() }]);
          window.dispatchEvent(new CustomEvent('wyber:chat-prompt', { detail: connector.prompt }));
        } else {
          // Fallback: open the Supabase connector modal
          window.dispatchEvent(new CustomEvent('wyber-open-supabase'));
        }
      } catch {
        window.dispatchEvent(new CustomEvent('wyber-open-supabase'));
      }
      setAdding(null);
      return;
    }

    if (!connector.composioSlug) return; // coming-soon: button is disabled, this shouldn't fire

    setAdding(connector.id);
    try {
      const res = await fetch(`/api/composio/connect?toolkit=${connector.composioSlug}`);
      const data = await res.json();
      if (!data.redirectUrl) { setAdding(null); return; }
      const popup = window.open(data.redirectUrl, 'composio_oauth', 'width=600,height=700,scrollbars=yes,resizable=yes');
      const check = setInterval(() => {
        if (popup?.closed) {
          clearInterval(check);
          setAdding(null);
          setTimeout(loadConnections, 1500); // give Composio a moment to record the connection
        }
      }, 500);
    } catch {
      setAdding(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-base)' }}>
      <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid var(--ide-border)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Connectors</div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search connectors..."
          style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid var(--ide-border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: 12, fontFamily: 'inherit', outline: 'none' }}
        />
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 12px' }}>
        {categories.map(cat => (
          <div key={cat} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{cat}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {filtered.filter(c => c.category === cat).map(c => {
                const isComingSoon = c.id !== 'supabase' && !c.composioSlug;
                const isConnected = c.composioSlug ? connectedSlugs.has(c.composioSlug) : false;
                const logoUrl = c.id === 'supabase' ? 'https://logos.composio.dev/api/supabase' : c.composioSlug ? `https://logos.composio.dev/api/${c.composioSlug}` : undefined;
                return (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 8, border: '1px solid var(--ide-border)', background: 'var(--bg-surface)', opacity: isComingSoon ? 0.55 : 1, transition: 'all 0.15s' }}
                  onMouseEnter={e => !isComingSoon && ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(14,165,233,0.3)')}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--ide-border)'}
                >
                  <ConnectorIcon logoUrl={logoUrl} emoji={c.icon} color={c.color} name={c.name} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.desc}</div>
                  </div>
                  <button
                    onClick={() => handleAdd(c)}
                    disabled={isComingSoon || adding === c.id || isConnected}
                    style={{
                      padding: '4px 10px', borderRadius: 6, border: '1px solid var(--ide-border)',
                      background: isConnected ? 'rgba(34,197,94,0.1)' : adding === c.id ? 'rgba(14,165,233,0.1)' : 'transparent',
                      color: isComingSoon ? 'var(--text-muted)' : isConnected ? '#22c55e' : adding === c.id ? '#0EA5E9' : 'var(--text-secondary)',
                      fontSize: 11, fontWeight: 600, cursor: isComingSoon ? 'default' : 'pointer', flexShrink: 0, fontFamily: 'inherit', transition: 'all 0.15s',
                    }}
                  >
                    {isComingSoon ? 'Coming soon' : isConnected ? '✓ Connected' : adding === c.id ? 'Connecting…' : '+ Add'}
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
