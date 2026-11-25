/**
 * Renders EVERY Wyber UI Kit component on one page, in a real browser, with real
 * design tokens, so a human can judge them (the kit is a string injected into user
 * builds — nothing else ever renders it standalone).
 *
 *   npx tsx scripts/ui-kit-gallery.ts [outDir]        (default: docs/ui-kit-gallery)
 *
 * Output is a single index.html: Tailwind CDN + the same token config the previews use,
 * deps from esm.sh (like the preview engine), the kit and the demos bundled with esbuild.
 * Every demo is error-isolated; window.__gallery lists totals and any that threw.
 * Demos come from the one-line examples in WYBER_UI_KIT_PROMPT (what the model sees),
 * with hand-written overrides below for components whose example needs real state.
 */
import { build, transform } from 'esbuild'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { WYBER_UI_KIT_FILES, WYBER_UI_KIT_PROMPT, WYBER_UI_KIT_SOURCE } from '../src/lib/wyber-ui-kit'
import { PALETTES } from '../src/lib/design-palettes'
import { GOOGLE_FONTS_LINKS, PREVIEW_TAILWIND_CONFIG, TOKEN_VARS_CSS, BASE_LAYER_CSS } from '../src/lib/design-system'

const outDir = resolve(process.argv[2] ?? 'docs/ui-kit-gallery')

// ── 1. Component list + example JSX from the prompt the model actually sees ──────────
const names = [...new Set([...WYBER_UI_KIT_SOURCE.matchAll(/^export (?:function|const) ([A-Z][A-Za-z0-9]+)/gm)].map(m => m[1]))]
  .filter(n => n !== 'WYBER')

const examples: Record<string, { jsx: string; desc: string; cat: string }> = {}
let cat = 'Core'
for (const raw of WYBER_UI_KIT_PROMPT.split('\n')) {
  const line = raw.trim()
  const heading = line.match(/^([A-Z][A-Z &/,'()0-9-]{5,}):?$/)
  if (heading && !line.includes('<')) { cat = heading[1].replace(/:$/, ''); continue }
  const m = line.match(/^(?:-\s*)?(<([A-Z][A-Za-z0-9]*)\b[\s\S]*?>[\s\S]*?)\s+(?:—|-)\s+(.+)$/)
  if (m && !examples[m[2]]) examples[m[2]] = { jsx: m[1].trim(), desc: m[3].trim(), cat }
}

// ── 2. Overrides: examples that need real state, real props, or a visible overlay ────
const OV: Record<string, string> = {
  Button: `<div className="flex flex-wrap items-center gap-3"><Button>Primary</Button><Button variant="secondary">Secondary</Button><Button variant="outline">Outline</Button><Button variant="ghost">Ghost</Button><Button variant="destructive">Delete</Button><Button size="sm">Small</Button><Button size="lg">Large</Button></div>`,
  Badge: `<div className="flex flex-wrap gap-2"><Badge>Default</Badge><Badge variant="outline">Outline</Badge><Badge variant="solid">Solid</Badge><Badge variant="destructive">At risk</Badge></div>`,
  Input: `<div className="max-w-sm space-y-3"><Input placeholder="you@company.com" /><Input placeholder="Search clients" /></div>`,
  Textarea: `<div className="max-w-sm"><Textarea placeholder="Tell us about the project" rows={3} /></div>`,
  Card: `<div className="grid max-w-xl grid-cols-2 gap-4"><Card><p className="text-sm font-semibold">Overdue</p><p className="mt-1 text-2xl font-display">$12,480</p></Card><Card hover><p className="text-sm font-semibold">Hover card</p><p className="mt-1 text-sm text-muted-foreground">Lifts on hover</p></Card></div>`,
  GlassPanel: `<div className="relative flex h-48 items-center justify-center overflow-hidden rounded-lg bg-primary/20"><div className="absolute -left-6 top-4 h-32 w-32 rounded-full bg-primary" /><GlassPanel className="relative p-6"><p className="text-sm">Frosted panel over a shape</p></GlassPanel></div>`,
  Skeleton: `<div className="max-w-sm space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-4 w-full" /><Skeleton className="h-24 w-full" /></div>`,
  SpotlightCard: `<div className="max-w-xs"><SpotlightCard><div className="p-6"><p className="font-semibold">Auto-chase</p><p className="mt-1 text-sm text-muted-foreground">Move your cursor over this card.</p></div></SpotlightCard></div>`,
  GradientBorder: `<div className="max-w-xs"><GradientBorder contentClassName="p-6"><p className="font-semibold">Featured plan</p><p className="mt-1 text-sm text-muted-foreground">Animated border.</p></GradientBorder></div>`,
  TiltCard: `<div className="max-w-xs"><TiltCard maxTilt={8}><Card><p className="font-semibold">Tilt me</p><p className="mt-1 text-sm text-muted-foreground">Pointer-tracking 3D tilt.</p></Card></TiltCard></div>`,
  FlipCard: `<div className="max-w-xs"><FlipCard flipOnClick height={180} front={<div className="flex h-full items-center justify-center rounded-xl border border-border bg-card">Front</div>} back={<div className="flex h-full items-center justify-center rounded-xl border border-border bg-primary text-primary-foreground">Back</div>} /></div>`,
  ImageRevealCard: `<div className="max-w-xs"><ImageRevealCard image={<img src={IMG(51)} alt="" className="h-full w-full object-cover" />} title="Harbour Café" subtitle="Brand identity" /></div>`,
  StaggerItem: `<Stagger>{[1, 2, 3].map(i => <StaggerItem key={i}><Box h={50}>Item {i}</Box></StaggerItem>)}</Stagger>`,
  BentoCard: `<BentoGrid><BentoCard title="One" description="First card" /><BentoCard title="Two" description="Second card" /></BentoGrid>`,

  Dialog: `<Btn label="Open dialog">{(close) => <Dialog open onClose={close} title="Invite a teammate"><p className="text-sm text-muted-foreground">They get an email with a link to join your workspace.</p></Dialog>}</Btn>`,
  ConfirmModal: `<Btn label="Open confirm">{(close) => <ConfirmModal open onClose={close} onConfirm={close} title="Delete workspace?" description="This removes 14 projects and cannot be undone." variant="destructive" />}</Btn>`,
  Drawer: `<Btn label="Open drawer">{(close) => <Drawer open onClose={close} title="Filters" side="right"><p className="text-sm text-muted-foreground">Status, owner and date range.</p></Drawer>}</Btn>`,
  Lightbox: `<Btn label="Open lightbox">{(close) => <Lightbox open onClose={close} index={0} onIndexChange={() => {}} images={[IMG(1), IMG(2), IMG(3)]} />}</Btn>`,
  CommandPalette: `<Btn label="Open palette">{(close) => <CommandPalette open onClose={close} items={[{ id: 'a', label: 'New project', group: 'Actions' }, { id: 'b', label: 'Invite teammate', group: 'Actions' }, { id: 'c', label: 'Billing', group: 'Go to' }]} onSelect={close} />}</Btn>`,
  ToastStack: `<ToastStack toasts={[{ id: '1', title: 'Deal moved to Negotiation', description: 'Horizon Labs · $47,832', variant: 'success', duration: 99999 }, { id: '2', title: 'Sync failed', description: 'Retry in 30s', variant: 'error', duration: 99999 }]} onDismiss={() => {}} position="bottom-right" />`,
  PopoverMenu: `<PopoverMenu trigger={<Button variant="outline">Actions</Button>} items={[{ label: 'Rename', onClick: () => {} }, { label: 'Duplicate', onClick: () => {} }, { label: 'Delete', onClick: () => {}, destructive: true }]} align="start" />`,
  ContextMenu: `<ContextMenu items={[{ label: 'Copy link', onClick: () => {} }, { label: 'Archive', onClick: () => {} }]}><div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">Right-click here</div></ContextMenu>`,
  Tooltip: `<Tooltip content="Export as CSV" side="top" delay={0}><Button variant="outline">Hover me</Button></Tooltip>`,
  NotificationBell: `<div className="flex justify-end"><NotificationBell count={2} notifications={[{ id: '1', title: 'Priya Sharma replied', description: 'On Vertex Systems proposal', time: '2m ago', read: false }, { id: '2', title: 'Invoice paid', description: '$2,400.00', time: '1h ago', read: false }]} onItemClick={() => {}} /></div>`,
  CookieConsentBar: `<CookieConsentBar message="We use cookies to measure what pages help you." acceptLabel="Accept" declineLabel="Decline" onAccept={() => {}} onDecline={() => {}} />`,
  Tabs: `<Tabs tabs={[{ id: 'a', label: 'Overview' }, { id: 'b', label: 'Activity' }, { id: 'c', label: 'Settings' }]} active="a" onChange={() => {}} />`,
  Switch: `<Switch checked onChange={() => {}} />`,
  Accordion: `<Accordion items={[{ title: 'Can I cancel any time?', content: 'Yes — one click in Billing, no call needed.' }, { title: 'Do you offer refunds?', content: 'Within 14 days, no questions.' }]} />`,
  EmptyState: `<EmptyState icon={<Icon size={20} />} title="No deals yet" description="Add your first client and your pipeline tracks itself." action={<Button>Add client</Button>} />`,
  Navbar: `<Navbar brand={<span className="font-display font-semibold">Acme</span>} links={[{ label: 'Features', href: '#' }, { label: 'Pricing', href: '#' }]} cta={<Button size="sm">Sign in</Button>} />`,
  Footer: `<Footer brand={<span className="font-display font-semibold">Acme</span>} description="Invoices that chase themselves." columns={[{ title: 'Product', links: [{ label: 'Features', href: '#' }, { label: 'Pricing', href: '#' }] }, { title: 'Company', links: [{ label: 'About', href: '#' }] }]} note="© 2026 Acme" />`,
  BentoGrid: `<BentoGrid><BentoCard title="Auto-chase" description="Reminders go out on day 3, 7 and 14." icon={<Icon size={18} />} colSpan={2} rowSpan={1} /><BentoCard title="Match payments" description="Bank feed reconciles itself." icon={<Icon size={18} />} /><BentoCard title="Cash forecast" description="See next month today." icon={<Icon size={18} />} /></BentoGrid>`,
  StickyShowcase: `<StickyShowcase items={[{ title: 'Draft', description: 'Write it once.', visual: <Box h={200}>Draft</Box> }, { title: 'Send', description: 'We deliver it.', visual: <Box h={200}>Send</Box> }]} />`,
  ScrollStack: `<ScrollStack items={[<div key="1" className="p-8">Step one — connect your bank</div>, <div key="2" className="p-8">Step two — import invoices</div>]} />`,
  PinnedStory: `<PinnedStory steps={[{ title: 'Connect', description: 'Link your bank in a minute.' }, { title: 'Import', description: 'Bring your open invoices.' }]} visual={<Box h={220}>Visual</Box>} />`,
  MediaFrame: `<MediaFrame src={IMG(4)} alt="Dashboard" caption="Fig. 01 — Dashboard" index="01" ratio="16/9" />`,
  TestimonialCard: `<TestimonialCard quote="We cut reporting time by 80% with the automated exports." name="Sarah Chen" role="COO, Meridian Labs" rating={5} />`,
  TestimonialWall: `<TestimonialWall columns={3} testimonials={[{ quote: 'Reports used to take a day.', name: 'Jane Doe', role: 'CTO' }, { quote: 'Support answered in minutes.', name: 'Marcus Rivera', role: 'Ops' }, { quote: 'Switched in an afternoon.', name: 'Aisha Patel', role: 'Founder' }]} />`,
  LogoCloud: `<LogoCloud columns={4} logos={[{ name: 'Horizon' }, { name: 'Vertex' }, { name: 'Meridian' }, { name: 'Atlas' }]} />`,
  InfiniteLogoMarquee: `<InfiniteLogoMarquee speed={28} logos={[1, 2, 3, 4, 5, 6].map(i => ({ id: 'l' + i, content: <span className="font-display text-lg">Brand {i}</span> }))} />`,
  IntegrationGrid: `<IntegrationGrid columns={4} integrations={[{ name: 'Slack' }, { name: 'Stripe' }, { name: 'Notion' }, { name: 'Zapier' }]} />`,
  HoverImageGrid: `<HoverImageGrid columns={3} images={[1, 2, 3].map(i => ({ id: 'i' + i, src: IMG(i + 10), alt: 'Work ' + i }))} />`,
  Lightbox_: ``,
  BeforeAfterSlider: `<BeforeAfterSlider beforeImage={IMG(21)} afterImage={IMG(22)} beforeLabel="Before" afterLabel="After" />`,
  DeviceFrameSet: `<DeviceFrameSet laptopSrc={IMG(31)} phoneSrc={IMG(32)} />`,
  ScreenshotTilt: `<ScreenshotTilt src={IMG(33)} tilt={10} />`,
  VideoFrame: `<VideoFrame src="" poster={IMG(34)} />`,
  QRFrame: `<QRFrame src={IMG(35)} caption="Scan to open on mobile" size={160} />`,
  SocialProofRow: `<SocialProofRow avatarUrls={[IMG(41), IMG(42), IMG(43)]} rating={5} teamCount={1200} />`,
  AvatarStack: `<AvatarStack avatars={[{ name: 'Ada Lovelace' }, { name: 'Grace Hopper' }, { name: 'Alan Turing' }, { name: 'Katherine Johnson' }, { name: 'Linus T' }]} max={4} />`,
  ChangelogTimeline: `<ChangelogTimeline entries={[{ version: 'v2.4.0', date: 'Sep 2026', tag: 'New', description: 'Dark mode.' }, { version: 'v2.3.0', date: 'Aug 2026', tag: 'Fix', description: 'Faster exports.' }]} />`,
  FAQAccordionIcon: `<FAQAccordionIcon items={[{ question: 'Is there a free trial?', answer: 'Yes, 14 days.' }, { question: 'Can I switch plans?', answer: 'Any time.' }]} />`,
  ComparisonTable: `<ComparisonTable plans={['Free', 'Pro', 'Team']} features={[{ name: 'Custom domain', values: [false, true, true] }, { name: 'Seats', values: ['1', '5', 'Unlimited'] }]} highlightIndex={1} />`,
  PlanComparisonMatrix: `<PlanComparisonMatrix plans={[{ name: 'Free', price: '$0' }, { name: 'Pro', price: '$29', featured: true }]} rows={[{ label: 'Seats', values: ['1', 'Unlimited'] }, { label: 'Exports', values: [false, true] }]} />`,
  StickyTable: `<StickyTable maxHeight={220} columns={[{ key: 'name', label: 'Name' }, { key: 'status', label: 'Status' }, { key: 'amount', label: 'Amount' }]} rows={Array.from({ length: 10 }, (_, i) => ({ name: 'Client ' + (i + 1), status: i % 3 ? 'Active' : 'At risk', amount: '$' + (i + 1) * 1240 }))} />`,
  KanbanCard: `<div className="max-w-xs"><KanbanCard title="Ship v2 onboarding" tags={['Design', 'P1']} assignee={{ name: 'Ada Lovelace' }} /></div>`,
  FilterChipBar: `<FilterChipBar filters={[{ id: '1', label: 'Status: Active' }, { id: '2', label: 'Owner: Priya' }]} onRemove={() => {}} onClearAll={() => {}} />`,
  StatCounterGrid: `<StatCounterGrid columns={3} stats={[{ value: 128400, label: 'Revenue', delta: 12, prefix: '$' }, { value: 3210, label: 'Customers', delta: 4 }, { value: 94.3, label: 'Retention', delta: -1.2, suffix: '%', decimals: 1 }]} />`,
  StatsBanner: `<StatsBanner stats={[{ value: '12K+', label: 'Active teams' }, { value: '99.99%', label: 'Uptime' }, { value: '4.8', label: 'Avg rating' }]} />`,
  PricingToggle: `<PricingToggle value="monthly" onChange={() => {}} savePercent={20} />`,
  FloatingLabelInput: `<div className="max-w-sm"><FloatingLabelInput label="Email" value="" onChange={() => {}} /></div>`,
  OtpInput: `<OtpInput length={6} value="" onChange={() => {}} />`,
  RangeSlider: `<div className="max-w-sm"><RangeSlider min={0} max={1000} value={400} onChange={() => {}} formatValue={(v) => '$' + v} /></div>`,
  ChipToggleGroup: `<ChipToggleGroup options={['Design', 'Eng', 'Ops', 'Sales']} value={['Eng']} onChange={() => {}} />`,
  SearchWithSuggestions: `<div className="max-w-sm"><SearchWithSuggestions value="ho" onChange={() => {}} suggestions={['Horizon Labs', 'Home renovation', 'Hosting']} onSelect={() => {}} /></div>`,
  FileDropzone: `<FileDropzone onFiles={() => {}} accept="image/*" multiple />`,
  StepperWizard: `<StepperWizard steps={['Workspace', 'Role', 'Import', 'Invite']} currentIndex={2} />`,
  ColorSwatchPicker: `<ColorSwatchPicker colors={['primary', 'accent', 'secondary', 'destructive']} value="primary" onChange={() => {}} />`,
  CustomCheckbox: `<CustomCheckbox checked onChange={() => {}} label="I agree to the terms" />`,
  CustomRadio: `<CustomRadio name="plan" value="pro" checkedValue="pro" onChange={() => {}} label="Pro" />`,
  NewsletterInline: `<NewsletterInline value="" onChange={() => {}} onSubmit={() => {}} />`,
  PasswordStrengthMeter: `<div className="max-w-sm"><PasswordStrengthMeter score={3} /></div>`,
  BottomTabBar: `<BottomTabBar active="home" onChange={() => {}} items={[{ id: 'home', label: 'Home', icon: <Icon size={18} /> }, { id: 'search', label: 'Search', icon: <Icon size={18} /> }, { id: 'me', label: 'Profile', icon: <Icon size={18} /> }]} />`,
  FloatingDockNav: `<FloatingDockNav items={[{ id: 'a', label: 'Home', icon: <Icon size={18} /> }, { id: 'b', label: 'Work', icon: <Icon size={18} /> }, { id: 'c', label: 'Contact', icon: <Icon size={18} /> }]} />`,
  SidebarNav: `<div className="h-72"><SidebarNav items={[{ id: 'a', label: 'Dashboard', icon: <Icon size={16} /> }, { id: 'b', label: 'Clients', icon: <Icon size={16} /> }, { id: 'c', label: 'Invoices', icon: <Icon size={16} /> }]} active="a" onChange={() => {}} /></div>`,
  PillTabNav: `<PillTabNav tabs={[{ id: 'a', label: 'All' }, { id: 'b', label: 'Open' }, { id: 'c', label: 'Paid' }]} active="a" onChange={() => {}} />`,
  ProgressTabNav: `<ProgressTabNav tabs={[{ id: 'a', label: 'Plan' }, { id: 'b', label: 'Build' }, { id: 'c', label: 'Ship' }]} active="b" onChange={() => {}} />`,
  Breadcrumbs: `<Breadcrumbs items={[{ label: 'Home', href: '#' }, { label: 'Clients', href: '#' }, { label: 'Horizon Labs' }]} />`,
  MegaMenu: `<MegaMenu label="Products" columns={[{ title: 'Platform', links: [{ label: 'Invoicing', href: '#', description: 'Send and chase' }, { label: 'Payments', href: '#', description: 'Get paid' }] }, { title: 'Resources', links: [{ label: 'Docs', href: '#' }] }]} />`,
  CondensingNavbar: `<CondensingNavbar brand="Acme" links={[{ label: 'Features', href: '#' }]} cta={<Button size="sm">Sign in</Button>} condensedAt={80} />`,
  AnnouncementBar: `<AnnouncementBar message="New: v2 is live" ctaLabel="Read more" ctaHref="#" />`,
  StickyCTABar: `<StickyCTABar message="Ready to ship faster?" ctaLabel="Start free" threshold={0} />`,
  BackToTop: `<BackToTop />`,
  ScrollProgress: `<ScrollProgress />`,
  ScrollHorizontalGallery: `<ScrollHorizontalGallery distance={600}>{[1, 2, 3, 4].map(i => <Box key={i} h={160} w={220}>Case {i}</Box>)}</ScrollHorizontalGallery>`,
  DraggableCarousel: `<DraggableCarousel gap={16}>{[1, 2, 3, 4, 5].map(i => <Box key={i} h={140} w={200}>Card {i}</Box>)}</DraggableCarousel>`,
  ConfettiBurst: `<ConfettiBurst count={24} triggerOnClick><div className="rounded-lg border border-border p-10 text-center text-sm">Click to celebrate</div></ConfettiBurst>`,
  MagneticButton: `<MagneticButton strength={0.5} radius={120}>Get started</MagneticButton>`,
  HeroOrbit: `<HeroOrbit center={<span className="font-display text-xl">A</span>} items={[1, 2, 3, 4].map(i => ({ icon: <Icon size={18} /> }))} radius={110} />`,
  RotatingBadgeText: `<RotatingBadgeText text="ESTABLISHED 2026 • TRUSTED BY TEAMS •" size={110} duration={12} icon={<Icon size={16} />} />`,
  SplitHero: `<SplitHero left={<div><h2 className="font-display text-3xl font-bold">Invoices that chase themselves</h2><p className="mt-3 text-muted-foreground">Get paid 9 days sooner.</p></div>} right={<Box h={220}>Product visual</Box>} />`,
  PhoneFrame: `<div className="flex justify-center"><PhoneFrame statusBar><div className="p-4 text-sm">Today · 3 invoices due</div></PhoneFrame></div>`,
  BrowserFrame: `<BrowserFrame url="app.acme.com"><div className="p-8 text-sm text-muted-foreground">Dashboard content</div></BrowserFrame>`,
  TerminalFrame: `<TerminalFrame lines={['npm install acme', { text: 'done in 1.2s', output: true }]} />`,
  CodeBlock: `<CodeBlock code={"const total = items.reduce((s, i) => s + i.amount, 0)\\nconsole.log(total)"} filename="app.ts" highlightLines={[1]} />`,
  ChatBubble: `<div className="space-y-3"><ChatBubble message="Can you send the invoice again?" variant="received" name="Priya" timestamp="2:41 PM" /><ChatBubble message="On its way." variant="sent" name="You" timestamp="2:42 PM" /></div>`,
  AIActionBar: `<AIActionBar onRetry={() => {}} onCopy={() => {}} onLike={() => {}} onDislike={() => {}} onShare={() => {}} />`,
  AIDiffBlock: `<AIDiffBlock filename="src/App.tsx" lines={[{ text: '  const x = 1', type: 'context' }, { text: '- old line', type: 'remove' }, { text: '+ new line', type: 'add' }]} />`,
  AIPlanCard: `<AIPlanCard title="Migrating the billing module" progress="4/7" steps={[{ label: 'Read schema', status: 'done' }, { label: 'Write migration', status: 'active' }, { label: 'Deploy', status: 'pending' }]} />`,
  AIAssistantPanel: `<div className="max-w-md"><AIAssistantPanel greeting="Hi, how can I help?" suggestions={['Summarize this page', 'Find bugs']} onSuggestion={() => {}} onSubmit={() => {}} /></div>`,
  PromptInputBar: `<div className="max-w-xl"><PromptInputBar value="" onChange={() => {}} onSubmit={() => {}} modes={['Agent', 'Auto']} mode="Agent" onModeChange={() => {}} placeholder="Build anything…" /></div>`,
  ReasoningTrace: `<ReasoningTrace tabs={['Steps', 'Reasoning', 'Search']} items={[{ label: 'Read the current schema', done: true }, { label: 'Plan the column moves', done: true }, { label: 'Write the migration', done: false }]} />`,
  FloatingAssistantWidget: `<FloatingAssistantWidget open onOpenChange={() => {}} title="Assistant"><p className="p-4 text-sm">How can I help?</p></FloatingAssistantWidget>`,
  ShimmerSkeletonCard: `<div className="max-w-xs"><ShimmerSkeletonCard lines={3} showAvatar /></div>`,
  ProgressBar: `<div className="max-w-sm space-y-3"><ProgressBar value={62} max={100} /><ProgressBar indeterminate /></div>`,
  ProgressRing: `<ProgressRing value={72} label="Complete" />`,
  Sparkline: `<div className="w-40"><Sparkline data={[4, 9, 6, 12, 10, 18, 14]} /></div>`,
  MiniBarChart: `<div className="w-64"><MiniBarChart data={[12, 30, 18, 44, 26]} labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri']} /></div>`,
  ScrollTimeline: `<ScrollTimeline items={[{ title: 'Order placed', date: 'Jan 3' }, { title: 'Shipped', date: 'Jan 5' }, { title: 'Delivered', date: 'Jan 8' }]} />`,
  RatingStars: `<RatingStars value={4} onChange={() => {}} />`,
  Marquee: `<Marquee speed={30}>{['Alpha', 'Beta', 'Gamma', 'Delta'].map(n => <span key={n} className="mx-8 font-display text-xl text-muted-foreground">{n}</span>)}</Marquee>`,
  CTASection: `<CTASection title="Start building today" description="No credit card required." primaryCta="Start free" secondaryCta="Talk to sales" />`,
  CTAGradientBanner: `<CTAGradientBanner title="Start building today" description="No credit card required." ctaLabel="Get started free" />`,
  PricingCard: `<div className="max-w-xs"><PricingCard name="Pro" price="$29" period="/month" description="For small teams" features={['5 seats', 'Unlimited invoices', 'Priority support']} featured onSelect={() => {}} /></div>`,
  FeatureCard: `<div className="max-w-xs"><FeatureCard icon={<Icon size={18} />} title="Auto-chase" description="Reminders go out on day 3, 7 and 14." /></div>`,
  StatBlock: `<div className="max-w-xs"><StatBlock value={98.3} suffix="%" decimals={1} label="Uptime" delta={12.4} /></div>`,
  SectionHeading: `<SectionHeading eyebrow="Features" title="Everything your books need" description="Four tools, one subscription." align="center" />`,
  DataRow: `<div className="max-w-sm"><DataRow label="Latency" value="42ms" sub="p99" /><DataRow label="Uptime" value="99.99%" /></div>`,
  KineticHeadline: `<KineticHeadline text="Ship products that feel alive" by="word" as="h2" />`,
  TextScramble: `<TextScramble text="Ship faster" as="h2" />`,
  Typewriter: `<Typewriter text={['ship fast', 'ship safe', 'ship once']} loop />`,
  WordCycler: `<p className="text-2xl font-display">Built for <WordCycler words={['speed', 'scale', 'teams']} interval={2200} /></p>`,
  SplitFlapCounter: `<SplitFlapCounter value={128000} />`,
  NumberTicker: `<NumberTicker value={4821} prefix="$" decimals={0} fontSize={48} />`,
  QuoteMark: `<div className="relative p-10"><QuoteMark position="top-left" size={120} className="text-primary/10" /><p className="relative font-display text-xl">Reports used to take a day. Now they take a minute.</p></div>`,
  HighlightMarker: `<p className="text-xl">We make invoicing <HighlightMarker color="primary" delay={0.1}>painless</HighlightMarker> for small teams.</p>`,
  DropCap: `<DropCap>Invoicing was never meant to be a second job. This is the story of how a three-person studio stopped chasing late payments and started getting paid on time, every time.</DropCap>`,
  TextMaskReveal: `<TextMaskReveal text="We believe invoicing should feel like sending a message, not filing a tax return." />`,
  BlurReveal: `<BlurReveal blur={14} delay={0.05}><p className="text-lg">Focus in.</p></BlurReveal>`,
  GradientText: `<h2 className="font-display text-4xl font-bold">Built for <GradientText as="span" speed={6}>the future</GradientText></h2>`,
  GradientUnderline: `<p>Read the <GradientUnderline href="#">pricing details</GradientUnderline> before you decide.</p>`,
  LiquidUnderline: `<p>Read the <LiquidUnderline href="#">changelog</LiquidUnderline>.</p>`,
  HeroHeadline: `<HeroHeadline>Ship <em>beautiful</em> apps</HeroHeadline>`,
  EditorialHeadline: `<EditorialHeadline eyebrow="Manifesto" as="h2">Design is <em>the</em> product</EditorialHeadline>`,
  SplitTextReveal: `<SplitTextReveal text="Crafted for modern teams" />`,
  SectionNumber: `<SectionNumber n={1} label="The problem" />`,
  MonoLabel: `<MonoLabel accent>Est. 2026</MonoLabel>`,
  HairlineFrame: `<HairlineFrame ticks><div className="p-8 text-sm">Spec panel</div></HairlineFrame>`,
}
delete (OV as Record<string, string>).Lightbox_

// Backdrop-type components need a sized, relative stage.
const BACKDROPS = new Set(['AuroraBackground', 'BackgroundGrid', 'NoiseOverlay', 'MeshGradient', 'StarField', 'SpotlightSection', 'AnimatedGridLines', 'LiquidBlob', 'DiagonalStripes', 'WavesBackground', 'VignetteOverlay', 'DottedSpotlight', 'GlowOrbsField', 'CursorGlow', 'CursorFollowBlob'])

function demoJsx(name: string): string {
  if (OV[name]) return OV[name]
  const ex = examples[name]
  if (BACKDROPS.has(name)) {
    const inner = ex ? ex.jsx.replace(/^(<[A-Z]\w*[^>]*?)\s*\/?>$/, '$1 />') : `<${name} />`
    return `<div className="relative h-56 w-full overflow-hidden rounded-lg border border-border bg-background">${inner}<div className="relative z-10 flex h-full items-center justify-center font-display text-2xl">Headline over the backdrop</div></div>`
  }
  if (ex) return ex.jsx.replace(/>\s*(?:…|\.\.\.)\s*</g, '><div className="p-6"><p className="font-semibold">Auto-chase</p><p className="mt-1 text-sm text-muted-foreground">Reminders go out on day 3, 7 and 14.</p></div><')
  return `<${name}>Sample content</${name}>`
}

// ── 3. Compose + validate each demo; replace unparsable examples with a plain fallback ──
type Demo = { name: string; cat: string; desc: string; jsx: string; fallback: boolean }
async function validate(jsx: string): Promise<boolean> {
  try { await transform(`const x = <>${jsx}</>`, { loader: 'tsx' }); return true } catch { return false }
}
async function main() {
const demos: Demo[] = []
for (const name of names) {
  let jsx = demoJsx(name)
  let fallback = false
  if (!(await validate(jsx))) { jsx = `<${name}>Sample content</${name}>`; fallback = true }
  demos.push({ name, cat: OV[name] ? 'Hand-written demo' : examples[name]?.cat ?? 'Core', desc: examples[name]?.desc ?? '', jsx, fallback })
}

const demoSrc = demos.map((d, i) =>
  `  <Demo key="${d.name}" idx={${i}} name="${d.name}" cat={${JSON.stringify(d.cat)}} desc={${JSON.stringify(d.desc.slice(0, 220))}} fallback={${d.fallback}}>${d.jsx}</Demo>`).join('\n')

const kitImports = names.join(', ')
const appTsx = `import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Star } from 'lucide-react'
import { ${kitImports} } from './wyber-ui'

const Icon = Star
const IMG = (n: number) => 'https://picsum.photos/seed/wyber' + n + '/800/500'
const Logo = () => <span className="font-display font-semibold">Acme</span>
const fn = () => {}
const Box = ({ children, h = 120, w }: { children?: React.ReactNode; h?: number; w?: number }) => (
  <div style={{ height: h, width: w }} className="flex shrink-0 items-center justify-center rounded-lg border border-border bg-secondary text-sm text-muted-foreground">{children}</div>
)
const Btn = ({ label, children }: { label: string; children: (close: () => void) => React.ReactNode }) => {
  const [open, setOpen] = useState(false)
  return <>{<Button variant="outline" onClick={() => setOpen(true)}>{label}</Button>}{open && children(() => setOpen(false))}</>
}

class Safe extends React.Component<{ children?: React.ReactNode }, { err: any }> {
  state = { err: null as any }
  static getDerivedStateFromError(err: any) { return { err } }
  render() {
    if (this.state.err) return <div data-demo-error="1" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 font-mono text-xs text-destructive">Demo error: {String(this.state.err && this.state.err.message || this.state.err)}</div>
    return this.props.children
  }
}

const RANGE = (new URLSearchParams(location.search).get('range') || '').split('-').map(Number)
function Demo({ idx, name, cat, desc, fallback, children }: { idx: number; name: string; cat: string; desc: string; fallback: boolean; children?: React.ReactNode }) {
  if (RANGE.length === 2 && !(idx >= RANGE[0] && idx < RANGE[1])) return null
  return (
    <section id={name} data-cat={cat} className="overflow-hidden rounded-xl border border-border bg-card/40">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-border px-4 py-2">
        <span className="font-mono text-xs font-semibold text-foreground">{name}</span>
        {fallback && <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">auto fallback</span>}
        <span className="text-xs text-muted-foreground">{desc}</span>
      </header>
      <div style={{ transform: 'translateZ(0)', minHeight: 150 }} className="relative overflow-hidden p-6"><Safe>{children}</Safe></div>
    </section>
  )
}

function Gallery() {
  useEffect(() => {
    const t = setTimeout(() => {
      const errored = Array.from(document.querySelectorAll('[data-demo-error]')).map(e => e.closest('section')?.id)
      ;(window as any).__gallery = { total: document.querySelectorAll('section[id]').length, errored }
      const el = document.getElementById('summary'); if (el) el.textContent = (window as any).__gallery.total + ' components · ' + errored.length + ' errored'
    }, 2500)
    return () => clearTimeout(t)
  }, [])
  return (
    <div className="gal mx-auto max-w-6xl space-y-5 px-5 py-8">
${demoSrc}
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<Gallery />)
`

// ── 4. Bundle: kit + demos with esbuild; deps external via an importmap (as the preview does) ──
const EXTERNAL: Record<string, string> = {
  'react': 'https://esm.sh/react@18.3.1',
  'react-dom': 'https://esm.sh/react-dom@18.3.1',
  'react-dom/client': 'https://esm.sh/react-dom@18.3.1/client',
  'react/jsx-runtime': 'https://esm.sh/react@18.3.1/jsx-runtime',
  'lucide-react': 'https://esm.sh/lucide-react@0.383.0?deps=react@18.3.1',
  'clsx': 'https://esm.sh/clsx@2.1.1',
  'framer-motion': 'https://esm.sh/framer-motion@11.0.0?deps=react@18.3.1,react-dom@18.3.1',
}

const virtual: Record<string, string> = { 'src/App.tsx': appTsx, 'src/wyber-ui.tsx': WYBER_UI_KIT_FILES['src/wyber-ui.tsx'] ?? WYBER_UI_KIT_SOURCE }
for (const [p, c] of Object.entries(WYBER_UI_KIT_FILES)) virtual[p] = c

const result = await build({
  stdin: { contents: appTsx, resolveDir: process.cwd(), loader: 'tsx', sourcefile: 'App.tsx' },
  bundle: true, write: false, format: 'esm', jsx: 'automatic', target: 'es2020',
  external: Object.keys(EXTERNAL),
  plugins: [{
    name: 'virtual-kit',
    setup(b) {
      b.onResolve({ filter: /^\.\/wyber-ui$/ }, () => ({ path: 'wyber-ui.tsx', namespace: 'kit' }))
      b.onResolve({ filter: /^\.\/.+/ }, a => a.namespace === 'kit' ? ({ path: a.path.replace(/^\.\//, '') + (a.path.includes('.') ? '' : '.tsx'), namespace: 'kit' }) : undefined)
      b.onLoad({ filter: /.*/, namespace: 'kit' }, a => {
        const key = Object.keys(virtual).find(k => k.endsWith(a.path) || k.endsWith(a.path.replace(/\.tsx$/, '.ts')))
        return key ? { contents: virtual[key], loader: 'tsx' } : { contents: 'export {}', loader: 'ts' }
      })
    },
  }],
})
const js = result.outputFiles[0].text

// ── 5. Palettes (real ones from design-palettes.ts) ──
const picks = ['fintech-emerald-dark', 'wellness-sage-light', 'fintech-blue-light'].map(id => PALETTES.find(p => p.id === id)).filter(Boolean) as typeof PALETTES
const palettes = picks.map(p => ({ id: p.id, label: `${p.label} (${p.mode})`, vars: { ...Object.fromEntries(Object.entries(p.tokens).map(([k, v]) => ['--' + k, v])), '--radius': p.radius, '--font-sans': `'${p.fontSans}', Inter, ui-sans-serif, system-ui, sans-serif`, '--font-display': `'${p.fontDisplay}', Inter, ui-sans-serif, system-ui, sans-serif` } }))

const html = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Wyber UI Kit gallery</title>
${GOOGLE_FONTS_LINKS}
<script src="https://cdn.tailwindcss.com"></script>
<script>tailwind.config = ${PREVIEW_TAILWIND_CONFIG};</script>
<script type="importmap">${JSON.stringify({ imports: EXTERNAL })}</script>
<style>${TOKEN_VARS_CSS}\n${BASE_LAYER_CSS}\n* { box-sizing: border-box; }\nbody.grid3 .gal{max-width:none;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;padding:12px}\nbody.grid3 .gal>section{margin:0!important}</style>
</head><body>
<div style="position:sticky;top:0;z-index:50;display:flex;gap:12px;align-items:center;padding:10px 20px;border-bottom:1px solid hsl(var(--border));background:hsl(var(--background)/.9);backdrop-filter:blur(8px)">
  <strong style="font-family:var(--font-display)">Wyber UI Kit</strong>
  <span id="summary" style="font-size:12px;opacity:.7">rendering…</span>
  <label style="margin-left:auto;font-size:12px">Palette <select id="pal" style="background:hsl(var(--card));color:hsl(var(--foreground));border:1px solid hsl(var(--border));border-radius:6px;padding:2px 6px">${palettes.map(p => `<option value="${p.id}">${p.label}</option>`).join('')}</select></label>
</div>
<div id="root"></div>
<script>
var PALS = ${JSON.stringify(palettes)};
function apply(id){var p=PALS.find(function(x){return x.id===id})||PALS[0];Object.keys(p.vars).forEach(function(k){document.documentElement.style.setProperty(k,p.vars[k])});document.documentElement.classList.remove('light')}
document.getElementById('pal').addEventListener('change',function(e){apply(e.target.value)});apply(PALS[0].id);
window.__rejects=[];window.addEventListener('unhandledrejection',function(e){window.__rejects.push(String(e.reason&&e.reason.message||e.reason))});
window.addEventListener('error',function(e){console.error('[gallery] '+e.message)});
if(/[?&]grid/.test(location.search)){document.body.classList.add('grid3');var z=parseFloat((location.search.match(/zoom=([0-9.]+)/)||[])[1])||0.6;document.body.style.zoom=z}
</script>
<script type="module">
${js}
</script>
</body></html>`

mkdirSync(outDir, { recursive: true })
writeFileSync(join(outDir, 'index.html'), html)
console.log(`wrote ${join(outDir, 'index.html')} — ${demos.length} components (${demos.filter(d => d.fallback).length} auto-fallback, ${Object.keys(OV).length} hand-written)`)
console.log('fallbacks:', demos.filter(d => d.fallback).map(d => d.name).join(', ') || 'none')

}
main().catch(e => { console.error(e); process.exit(1) })
