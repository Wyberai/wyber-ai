import type { Locale } from '../../locales'

export interface TranslatedBuildPage {
  h1: string
  metaTitle: string
  metaDesc: string
  tagline: string
  body: string[]
  features: { title: string; desc: string }[]
  promptExample: string
  faqs: { q: string; a: string }[]
}

// AI-drafted, not yet native-reviewed (see AutoTranslateNotice). Per-page
// content for the "business" category /build/[slug] pages (English source:
// src/app/build/data/business.ts). Proper nouns, brand names, and tech
// terms (WyberAi, React, Supabase, Postgres, GitHub, QR code, HubSpot,
// Amazon, Shopify, Etsy, CSV, SKU, PO) are left untranslated across every
// locale — only the surrounding prose is translated. slug/target/category/
// related live on BuildPage itself and aren't duplicated here.
export const BUSINESS_BUILD_CONTENT: Record<Locale, Record<string, TranslatedBuildPage>> = {
  en: {
    'salon-booking-app': {
      h1: 'Build a Salon Booking App with AI',
      metaTitle: 'Build a Salon Booking App with AI — No Code',
      metaDesc: 'Turn phone-tag appointments into online bookings: services, stylist calendars, and client history — built from a plain-English description, no code.',
      tagline: 'Clients pick a service, a stylist, and a slot. You see the day\'s schedule at a glance. No more DM-and-phone-tag booking.',
      body: [
        'For most salons the booking system is a phone, an Instagram DM inbox, and a paper diary — which works until a double-booking costs you a regular, or an hour of the day disappears into "are you free Thursday?" messages. The booking platforms that fix this take a cut per appointment or charge monthly for every chair.',
        'A salon booking app is mostly a data problem — services with durations, staff with working hours, and slots that don\'t collide — and that\'s exactly what WyberAi generates from your description: a client-facing booking page that only offers genuinely free slots, and an owner dashboard showing each stylist\'s day. Rename "stylist" to "barber", "therapist", or "artist" and the same shape fits your shop.',
      ],
      features: [
        { title: 'Service menu with durations', desc: 'Cut, colour, blow-dry — each service carries a duration and price, so slot lengths are calculated, not guessed.' },
        { title: 'Per-stylist calendars', desc: 'Each staff member has working hours and their own bookings; clients can pick a person or "first available".' },
        { title: 'Collision-proof slots', desc: 'The booking page only shows slots that are actually free for that stylist and that service length.' },
        { title: 'Client history', desc: 'Every client\'s past appointments in one place — who they saw, what they had, when they\'re due back.' },
      ],
      promptExample: 'Build a salon booking web app: a public Booking page where clients pick a service (each with duration and price), choose a stylist or "first available", and select from open time slots; an owner Dashboard showing today\'s appointments per stylist in a timeline; and a Clients page with each client\'s appointment history. Stylists have configurable working hours.',
      faqs: [
        { q: 'Will it stop double-bookings?', a: 'Yes — available slots are computed from the stylist\'s working hours minus existing bookings and the service\'s duration, so a taken slot simply never appears.' },
        { q: 'Can clients cancel or reschedule themselves?', a: 'Ask for a manage-booking page in your prompt or later in chat — clients get a link to view, cancel, or move their appointment within rules you set.' },
        { q: 'Does this work for barbershops, spas, or clinics?', a: 'The same structure — services, staff, working hours, slots — fits any appointment business. Describe your version and the labels and rules adapt.' },
        { q: 'What happens when I\'m ready to take it live?', a: 'Publish from the editor and share the link. Before publish, WyberAi runs a live security scan on the app\'s database so client data isn\'t exposed.' },
      ],
    },
    'restaurant-menu-app': {
      h1: 'Build a Restaurant Menu App with AI',
      metaTitle: 'Build a Restaurant Menu & QR Ordering App with AI',
      metaDesc: 'A digital menu your kitchen can edit in seconds — categories, photos, prices, and specials — generated from plain English. QR-ready, no code, free to start.',
      tagline: 'A menu you update from your phone when the fish changes — not a PDF you re-print every time a price moves.',
      body: [
        'Laminated menus and PDF links share a flaw: the moment a price changes or a dish sells out, they\'re wrong. And the QR-menu platforms that solve it charge monthly rent for what is, underneath, a list of dishes with photos — content you should own outright.',
        'Describe your menu\'s shape — sections, dish details, dietary tags, a specials board — and WyberAi builds both halves: the guest-facing menu that loads fast from a table QR code, and an admin page where staff flip "sold out" or update tonight\'s special in seconds. Because it\'s a real web app and not a widget, it grows with you: add a second location\'s menu, a takeaway order form, or a wine list with pairings whenever you\'re ready.',
      ],
      features: [
        { title: 'Sections and dish cards', desc: 'Starters, mains, desserts, drinks — each dish with photo, description, price, and dietary tags (V, VG, GF, spice level).' },
        { title: 'Sold-out and specials switches', desc: 'Staff toggle availability or pin today\'s special from a phone — guests see it change instantly.' },
        { title: 'QR-first guest view', desc: 'A fast, mobile-first menu built to be opened from a table QR code — no app download, no pinch-zooming a PDF.' },
        { title: 'Multi-language ready', desc: 'Add a second language for your menu content when you need it — the structure supports per-language dish text.' },
      ],
      promptExample: 'Build a restaurant menu web app: a public mobile-first Menu page with sections (Starters, Mains, Desserts, Drinks), each dish showing photo, description, price, and dietary tags, plus a highlighted Today\'s Specials section; and an Admin page (login required) where staff can add or edit dishes, mark items sold out, and set the daily specials.',
      faqs: [
        { q: 'How do guests get to the menu?', a: 'Publish the app and point a QR code at its URL — any free QR generator works. Guests scan and the menu opens in their browser, no download.' },
        { q: 'Can non-technical staff update it?', a: 'That\'s the point of the admin page: logging in and toggling a dish or editing a price is a form, not a code change.' },
        { q: 'Can I add online ordering later?', a: 'Yes — start with the menu and ask chat to add a takeaway order flow when you\'re ready; the dish data you\'ve entered carries over.' },
        { q: 'What does it cost to run?', a: 'Building uses free monthly credits (a build is 30, edits are 2), and published apps are hosted for you — no per-table or per-scan fees.' },
      ],
    },
    'client-crm': {
      h1: 'Build a Simple CRM for Your Business with AI',
      metaTitle: 'Build a Custom CRM with AI — Your Pipeline, No Code',
      metaDesc: 'A CRM shaped to your sales process: your pipeline stages, your fields, your follow-up rhythm — generated from a description, not configured for weeks.',
      tagline: 'Your pipeline stages, your fields, your follow-up cadence — a CRM that fits your business instead of a giant one you configure down.',
      body: [
        'CRMs fail small businesses from both ends: the big platforms bury you in setup and per-seat pricing, while the spreadsheet you retreat to can\'t remind you that a warm lead has gone quiet for two weeks. The result is the most expensive kind of leak — deals lost to silence, not to competitors.',
        'What a five-person business actually needs is a pipeline with its own stage names, a contact record with the fields that matter in your industry, and a today-view of who to follow up with. That\'s a description, and WyberAi turns it into a working CRM on a real database — with logins for your team and a security scan before you put client data in it. When your process changes, you change the app in chat, not in a settings maze.',
      ],
      features: [
        { title: 'Pipeline with your stages', desc: 'Lead → Quoted → Won, or your five-stage version — a kanban pipeline generated from how you actually sell.' },
        { title: 'Contact records, your fields', desc: 'Company, source, budget, renewal date, sizes, allergies — whatever your business tracks, in the schema from day one.' },
        { title: 'Follow-up today view', desc: 'A dashboard of contacts whose next-action date has arrived or whose deals have gone quiet — the anti-leak screen.' },
        { title: 'Notes and activity trail', desc: 'Calls, meetings, and emails logged against the contact, so anyone on the team can pick up the thread.' },
      ],
      promptExample: 'Build a CRM web app for a small design agency: a Pipeline page with kanban stages New Lead, Discovery, Proposal Sent, Won, and Lost, where deals have a value, contact, and next-action date; a Contacts page with company, role, source, and notes; and a Today page listing deals whose next-action date is today or overdue. Include team login.',
      faqs: [
        { q: 'How is this better than a HubSpot free tier?', a: 'It\'s smaller on purpose: only your fields, only your stages, no upgrade walls — and when you outgrow a feature you add it in chat instead of moving plans.' },
        { q: 'Can I import my existing contacts?', a: 'Ask for a CSV import in your prompt or afterwards — describe your spreadsheet\'s columns and they map into the contacts table.' },
        { q: 'Is client data safe in a generated app?', a: 'The app ships with authentication and row-level security, and WyberAi probes the live database like an attacker before you publish — critical leaks block the publish gate.' },
        { q: 'Can my team use it at the same time?', a: 'Yes — it\'s a real multi-user web app on Postgres. Everyone logs in, and edits show up for the whole team.' },
      ],
    },
    'inventory-management-app': {
      h1: 'Build an Inventory Management App with AI',
      metaTitle: 'Build an Inventory Management App with AI',
      metaDesc: 'Stock levels, low-stock alerts, and supplier reorder info for your shop — an inventory app generated from plain English, no per-SKU platform fee.',
      tagline: 'Know what\'s actually on the shelf, get warned before you run out, and reorder from the supplier who sells it — one screen, not a stack of notebooks.',
      body: [
        'Small retailers and makers run inventory the way it was run fifty years ago — a count on a clipboard, a reorder decided from memory, a stockout discovered when a customer asks for the one thing you didn\'t know you\'d sold the last of. The inventory platforms built to fix this price per SKU or per location, which punishes exactly the growth you\'re trying to have.',
        'Describe what you stock and how you sell it, and WyberAi builds the system around your shop: a product list with quantities that move as you log sales and deliveries, a low-stock view that flags what needs reordering before it\'s gone, and supplier details attached to each item so reordering is a lookup, not a memory test. One location or three, retail or raw materials — the shape follows your description.',
      ],
      features: [
        { title: 'Live stock levels', desc: 'Every product with a quantity on hand that updates as sales and deliveries are logged — no more end-of-week recount.' },
        { title: 'Low-stock alerts', desc: 'Set a reorder threshold per product; anything below it surfaces on a dashboard before it becomes a stockout.' },
        { title: 'Supplier info per item', desc: 'Supplier name, contact, and cost price attached to each product — reordering starts with a lookup, not a search through email.' },
        { title: 'Multi-location support', desc: 'Track stock per store or warehouse separately, or roll it up into one total — described the way your business actually operates.' },
      ],
      promptExample: 'Build an inventory management web app: a Products page listing items with SKU, quantity on hand, reorder threshold, cost price, and supplier name; a Dashboard highlighting products below their reorder threshold; a Stock Movement page to log sales and incoming deliveries which adjust quantities; and a Suppliers page with contact details linked to the products they supply.',
      faqs: [
        { q: 'Can it handle barcodes?', a: 'Add a barcode field to each product in your prompt; pairing it with a phone camera scanner is an edit in chat once you\'re live.' },
        { q: 'Can I track stock across more than one store?', a: 'Yes — describe your locations and quantities can be tracked per location, with a combined total view on the dashboard.' },
        { q: 'Does it generate purchase orders?', a: 'Ask for a purchase-order page and low-stock items can be turned into a PO addressed to their supplier in one click.' },
        { q: 'Is this cheaper than an inventory SaaS?', a: 'You build it once with free monthly credits and it\'s yours — no per-SKU or per-location monthly fee as your catalog grows.' },
      ],
    },
    'rental-property-manager': {
      h1: 'Build a Rental Property Manager with AI',
      metaTitle: 'Build a Rental Property Management App with AI',
      metaDesc: 'Units, tenants, rent tracking, and maintenance requests for your rentals — a property manager app generated from plain English, no per-unit fee.',
      tagline: 'Every unit, who\'s in it, whether rent landed this month, and what\'s broken — a landlord\'s whole operation in one dashboard.',
      body: [
        'Landlords with a handful of units end up running the business on a mix of bank statements, text messages about a leaking tap, and memory for who paid and who\'s a week late. Property management software exists, but it\'s priced and built for portfolios of hundreds of units, not the four duplexes you actually own.',
        'Describe your properties and how you manage them, and WyberAi builds the operation into an app: a roster of units and tenants, a rent ledger that shows who\'s paid this cycle and who hasn\'t, and a maintenance board so a reported issue doesn\'t just live in a text thread until you forget it. Lease renewal dates surface before they sneak up on you, not after.',
      ],
      features: [
        { title: 'Units and tenants', desc: 'Every property and unit with the current tenant, lease start and end dates, and monthly rent attached.' },
        { title: 'Rent payment log', desc: 'Mark rent received per unit per month; a dashboard shows who\'s current and who\'s overdue at a glance.' },
        { title: 'Maintenance request board', desc: 'Tenants (or you) log issues with a status — reported, in progress, fixed — so nothing gets lost in a text thread.' },
        { title: 'Lease expiry reminders', desc: 'Leases nearing their end date surface on the dashboard, giving you time to renew or list the unit again.' },
      ],
      promptExample: 'Build a rental property management web app: a Properties page listing units with tenant name, lease start/end date, and monthly rent; a Rent Ledger page to mark payments received per unit per month with an overdue indicator; a Maintenance page for logging issues per unit with status (reported, in progress, fixed); and a Dashboard highlighting leases expiring in the next 60 days.',
      faqs: [
        { q: 'Can tenants submit maintenance requests themselves?', a: 'Yes — add a tenant login and a request form, and issues they submit land directly on your maintenance board.' },
        { q: 'Can it calculate late fees?', a: 'Describe your late-fee rule in the prompt and the rent ledger can apply it automatically once a payment passes its due date.' },
        { q: 'Does it work for more than one property?', a: 'Yes — the structure scales from one duplex to a portfolio; each property has its own units, tenants, and ledger.' },
        { q: 'Is tenant data secure?', a: 'The app runs on its own database with row-level security, scanned live before you publish — tenant details aren\'t exposed publicly.' },
      ],
    },
    'ecommerce-seller-dashboard': {
      h1: 'Build an Ecommerce Seller Dashboard with AI',
      metaTitle: 'Build an Ecommerce Seller Dashboard with AI — No Code',
      metaDesc: 'Orders, margin, and stock across Amazon, Shopify, and Etsy in one dashboard — generated from plain English, no per-channel platform fee.',
      tagline: 'One dashboard for every channel you sell on — real margin per order, stock that doesn\'t lie, and no new subscription every time you add a marketplace.',
      body: [
        'Sell on more than one channel — Amazon, Shopify, Etsy, your own storefront — and you end up with a different login, a different report format, and a different definition of "profit" for each one. Stitching them into one picture at month-end usually means exporting spreadsheets from three places and hoping the categories line up.',
        'Describe how you actually sell — which channels, what each one takes in fees, how you think about margin per order — and WyberAi builds the dashboard around that: one place to log orders from any channel, a margin view that subtracts the fees and costs specific to where the sale happened, and a stock picture that doesn\'t assume you only sell in one place. Add a channel later and it\'s a prompt away, not a new subscription.',
      ],
      features: [
        { title: 'One feed, every channel', desc: 'Log orders from Amazon, Shopify, Etsy, or your own store in one place instead of switching tabs to piece together the full picture.' },
        { title: 'Real margin per order', desc: 'Attach each channel\'s fee percentage and your cost price, and margin is calculated per order — not guessed at from a blended average.' },
        { title: 'Stock across channels', desc: 'One product sold in three places still has one quantity on hand, so you don\'t oversell what another channel already sold.' },
        { title: 'Grows with your catalog, not against it', desc: 'No per-order or per-channel fee that climbs as you scale — you build it once with free credits and it\'s yours.' },
      ],
      promptExample: 'Build an ecommerce seller dashboard web app: an Orders page to log each sale with the channel it came from (Amazon, Shopify, Etsy, or custom), sale price, channel fee, and cost price; a Dashboard page showing total revenue, fees, and net margin broken down by channel and by month; a Products page tracking stock quantity shared across all channels with a low-stock indicator; and a Channels page to add or edit the fee percentage for each place you sell.',
      faqs: [
        { q: 'Does it connect directly to my Amazon or Shopify account?', a: 'Not out of the box — this is a describe-your-numbers dashboard, so you log or paste in orders yourself. That avoids depending on a marketplace API that can change or get revoked; ask for a bulk-paste or CSV-import screen in your prompt and it can be added.' },
        { q: 'Can it handle more than three channels?', a: 'Yes — the Channels page holds however many you describe, each with its own fee percentage, and the dashboard rolls them all into one margin view.' },
        { q: 'Do I need my own website or hosting?', a: 'No — publish and it\'s live instantly on a free wyberai.app subdomain; connect your own domain later only if you want one.' },
        { q: 'Is this cheaper than a multi-channel seller tool?', a: 'You build it once with free monthly credits and own it outright — no per-order or per-channel fee that grows as your sales do.' },
      ],
    },
  },
  hi: {
    'salon-booking-app': {
      h1: 'AI से सैलून बुकिंग ऐप बनाएं',
      metaTitle: 'AI से सैलून बुकिंग ऐप बनाएं — बिना कोड',
      metaDesc: 'फ़ोन-टैग अपॉइंटमेंट्स को ऑनलाइन बुकिंग में बदलें: सर्विसेज़, स्टाइलिस्ट कैलेंडर, और क्लाइंट हिस्ट्री — सादी अंग्रेज़ी में दिए गए विवरण से बना, बिना कोड लिखे।',
      tagline: 'क्लाइंट एक सर्विस, एक स्टाइलिस्ट, और एक स्लॉट चुनते हैं। आप एक नज़र में दिन का पूरा शेड्यूल देखते हैं। अब DM और फ़ोन-टैग वाली बुकिंग की ज़रूरत नहीं।',
      body: [
        'ज़्यादातर सैलून की बुकिंग व्यवस्था एक फ़ोन, एक Instagram DM इनबॉक्स, और एक पेपर डायरी होती है — जो तब तक चलती है जब तक कोई डबल-बुकिंग किसी नियमित क्लाइंट को खो न दे, या दिन का एक घंटा "क्या आप गुरुवार को फ्री हैं?" जैसे मैसेजों में न निकल जाए। इसे ठीक करने वाले बुकिंग प्लेटफ़ॉर्म हर अपॉइंटमेंट पर कमीशन लेते हैं या हर चेयर के लिए महीने की फ़ीस वसूलते हैं।',
        'सैलून बुकिंग ऐप असल में एक डेटा समस्या है — समयावधि वाली सर्विसेज़, वर्किंग आवर्स वाला स्टाफ़, और आपस में न टकराने वाले स्लॉट्स — और WyberAi आपके विवरण से बिल्कुल यही जनरेट करता है: क्लाइंट के लिए एक बुकिंग पेज जो सिर्फ़ सचमुच खाली स्लॉट्स दिखाता है, और मालिक के लिए एक डैशबोर्ड जो हर स्टाइलिस्ट का दिन दिखाता है। "स्टाइलिस्ट" को "बार्बर", "थेरेपिस्ट", या "आर्टिस्ट" में बदल दें, वही ढांचा आपकी दुकान पर फ़िट बैठता है।',
      ],
      features: [
        { title: 'समयावधि के साथ सर्विस मेन्यू', desc: 'कट, कलर, ब्लो-ड्राई — हर सर्विस की एक समयावधि और कीमत होती है, इसलिए स्लॉट की लंबाई अंदाज़ा नहीं, हिसाब से तय होती है।' },
        { title: 'स्टाइलिस्ट के हिसाब से कैलेंडर', desc: 'हर स्टाफ़ सदस्य के अपने वर्किंग आवर्स और अपनी बुकिंग्स होती हैं; क्लाइंट कोई ख़ास व्यक्ति चुन सकते हैं या "जो भी पहले फ्री हो"।' },
        { title: 'टकराव-मुक्त स्लॉट्स', desc: 'बुकिंग पेज सिर्फ़ वही स्लॉट्स दिखाता है जो उस स्टाइलिस्ट और उस सर्विस की समयावधि के लिए वाकई खाली हैं।' },
        { title: 'क्लाइंट हिस्ट्री', desc: 'हर क्लाइंट की पिछली अपॉइंटमेंट्स एक जगह — किससे मिले, क्या कराया, कब वापस आना है।' },
      ],
      promptExample: 'एक सैलून बुकिंग वेब ऐप बनाएं: एक पब्लिक Booking पेज जहां क्लाइंट एक सर्विस चुनते हैं (हर एक की समयावधि और कीमत के साथ), एक स्टाइलिस्ट चुनते हैं या "जो भी पहले फ्री हो", और खुले टाइम स्लॉट्स में से चुनते हैं; मालिक के लिए एक Dashboard जो आज की अपॉइंटमेंट्स हर स्टाइलिस्ट के हिसाब से टाइमलाइन में दिखाता है; और एक Clients पेज जिसमें हर क्लाइंट की अपॉइंटमेंट हिस्ट्री हो। स्टाइलिस्ट के वर्किंग आवर्स कॉन्फ़िगर करने लायक हों।',
      faqs: [
        { q: 'क्या यह डबल-बुकिंग रोकेगा?', a: 'हां — उपलब्ध स्लॉट्स स्टाइलिस्ट के वर्किंग आवर्स में से मौजूदा बुकिंग्स और सर्विस की समयावधि घटाकर निकाले जाते हैं, इसलिए कोई भरा हुआ स्लॉट कभी नहीं दिखता।' },
        { q: 'क्या क्लाइंट खुद कैंसिल या रीशेड्यूल कर सकते हैं?', a: 'अपने प्रॉम्प्ट में या बाद में चैट में मैनेज-बुकिंग पेज मांगें — क्लाइंट को एक लिंक मिलता है जिससे वे आपके तय किए नियमों के भीतर अपनी अपॉइंटमेंट देख, कैंसिल, या बदल सकते हैं।' },
        { q: 'क्या यह बार्बरशॉप, स्पा, या क्लिनिक के लिए काम करता है?', a: 'वही ढांचा — सर्विसेज़, स्टाफ़, वर्किंग आवर्स, स्लॉट्स — किसी भी अपॉइंटमेंट-आधारित बिज़नेस पर फ़िट बैठता है। अपना वर्ज़न बताएं और लेबल व नियम खुद-ब-खुद ढल जाते हैं।' },
        { q: 'जब मैं इसे लाइव करने के लिए तैयार हूं, तो क्या होता है?', a: 'एडिटर से प्रकाशित करें और लिंक शेयर करें। प्रकाशित करने से पहले, WyberAi ऐप के डेटाबेस पर एक लाइव सुरक्षा स्कैन चलाता है ताकि क्लाइंट का डेटा उजागर न हो।' },
      ],
    },
    'restaurant-menu-app': {
      h1: 'AI से रेस्टोरेंट मेन्यू ऐप बनाएं',
      metaTitle: 'AI से रेस्टोरेंट मेन्यू और QR ऑर्डरिंग ऐप बनाएं',
      metaDesc: 'एक डिजिटल मेन्यू जिसे आपकी किचन सेकंडों में एडिट कर सके — कैटेगरी, फ़ोटो, कीमतें, और स्पेशल्स — सादी अंग्रेज़ी से जनरेट किया गया। QR-रेडी, बिना कोड, शुरू करना मुफ़्त।',
      tagline: 'एक मेन्यू जिसे आप फ़िश बदलते ही अपने फ़ोन से अपडेट कर दें — न कि हर बार कीमत बदलने पर दोबारा छपवाया जाने वाला PDF।',
      body: [
        'लैमिनेटेड मेन्यू और PDF लिंक में एक जैसी खामी है: जैसे ही कोई कीमत बदलती है या कोई डिश खत्म हो जाती है, वे गलत हो जाते हैं। और इसे ठीक करने वाले QR-मेन्यू प्लेटफ़ॉर्म हर महीने किराया वसूलते हैं, जबकि असल में यह सिर्फ़ फ़ोटो के साथ डिशेज़ की एक लिस्ट है — ऐसा कंटेंट जिसका मालिकाना हक़ आपके पास ही होना चाहिए।',
        'अपने मेन्यू का ढांचा बताएं — सेक्शन, डिश डिटेल्स, डायटरी टैग, एक स्पेशल्स बोर्ड — और WyberAi दोनों हिस्से बनाता है: गेस्ट के लिए एक मेन्यू जो टेबल के QR कोड से तेज़ी से लोड होता है, और स्टाफ़ के लिए एक एडमिन पेज जहां वे सेकंडों में "सोल्ड आउट" फ़्लिप करें या आज की स्पेशल अपडेट करें। क्योंकि यह एक असली वेब ऐप है, कोई विजेट नहीं, यह आपके साथ बढ़ता है: जब भी तैयार हों, दूसरी लोकेशन का मेन्यू, टेकअवे ऑर्डर फ़ॉर्म, या पेयरिंग्स के साथ वाइन लिस्ट जोड़ दें।',
      ],
      features: [
        { title: 'सेक्शन और डिश कार्ड्स', desc: 'स्टार्टर्स, मेन्स, डेज़र्ट्स, ड्रिंक्स — हर डिश के साथ फ़ोटो, विवरण, कीमत, और डायटरी टैग (V, VG, GF, स्पाइस लेवल)।' },
        { title: 'सोल्ड-आउट और स्पेशल्स स्विच', desc: 'स्टाफ़ फ़ोन से उपलब्धता टॉगल करता है या आज की स्पेशल पिन करता है — गेस्ट्स को यह बदलाव तुरंत दिखता है।' },
        { title: 'QR-फ़र्स्ट गेस्ट व्यू', desc: 'टेबल के QR कोड से खोलने के लिए बना एक तेज़, मोबाइल-फ़र्स्ट मेन्यू — न कोई ऐप डाउनलोड, न PDF को पिंच-ज़ूम करना।' },
        { title: 'मल्टी-लैंग्वेज रेडी', desc: 'जब ज़रूरत हो अपने मेन्यू कंटेंट में दूसरी भाषा जोड़ें — ढांचा हर-भाषा डिश टेक्स्ट को सपोर्ट करता है।' },
      ],
      promptExample: 'एक रेस्टोरेंट मेन्यू वेब ऐप बनाएं: एक पब्लिक, मोबाइल-फ़र्स्ट Menu पेज जिसमें सेक्शन हों (Starters, Mains, Desserts, Drinks), हर डिश में फ़ोटो, विवरण, कीमत, और डायटरी टैग दिखें, साथ ही एक हाइलाइट किया हुआ Today\'s Specials सेक्शन हो; और एक Admin पेज (लॉगिन ज़रूरी) जहां स्टाफ़ डिश जोड़ या एडिट कर सके, आइटम्स को सोल्ड आउट मार्क कर सके, और डेली स्पेशल्स सेट कर सके।',
      faqs: [
        { q: 'गेस्ट्स मेन्यू तक कैसे पहुंचते हैं?', a: 'ऐप प्रकाशित करें और उसके URL पर एक QR कोड बना लें — कोई भी मुफ़्त QR जनरेटर काम करेगा। गेस्ट स्कैन करते हैं और मेन्यू उनके ब्राउज़र में खुल जाता है, कोई डाउनलोड नहीं।' },
        { q: 'क्या ग़ैर-तकनीकी स्टाफ़ इसे अपडेट कर सकता है?', a: 'एडमिन पेज का यही मक़सद है: लॉगिन करना और किसी डिश को टॉगल या कीमत एडिट करना एक फ़ॉर्म भरना है, कोड बदलना नहीं।' },
        { q: 'क्या मैं बाद में ऑनलाइन ऑर्डरिंग जोड़ सकता हूं?', a: 'हां — मेन्यू से शुरू करें और जब तैयार हों तो चैट से टेकअवे ऑर्डर फ़्लो जोड़ने को कहें; आपकी डाली हुई डिश डेटा आगे भी बनी रहती है।' },
        { q: 'इसे चलाने में क्या ख़र्च आता है?', a: 'बनाने में मुफ़्त मासिक क्रेडिट्स इस्तेमाल होते हैं (एक बिल्ड में 30, एडिट्स में 2), और प्रकाशित ऐप्स आपके लिए होस्ट किए जाते हैं — कोई प्रति-टेबल या प्रति-स्कैन फ़ीस नहीं।' },
      ],
    },
    'client-crm': {
      h1: 'AI से अपने बिज़नेस के लिए सिंपल CRM बनाएं',
      metaTitle: 'AI से कस्टम CRM बनाएं — आपकी पाइपलाइन, बिना कोड',
      metaDesc: 'आपकी सेल्स प्रक्रिया के हिसाब से बना CRM: आपके पाइपलाइन स्टेज, आपके फ़ील्ड्स, आपकी फ़ॉलो-अप लय — विवरण से जनरेट, हफ़्तों तक कॉन्फ़िगर करने की ज़रूरत नहीं।',
      tagline: 'आपके पाइपलाइन स्टेज, आपके फ़ील्ड्स, आपकी फ़ॉलो-अप कैडेंस — एक CRM जो आपके बिज़नेस पर फ़िट बैठता है, न कि एक विशाल टूल जिसे आपको सिकोड़कर सेट करना पड़े।',
      body: [
        'CRM छोटे बिज़नेस को दोनों तरफ़ से निराश करते हैं: बड़े प्लेटफ़ॉर्म आपको सेटअप और प्रति-सीट कीमत में उलझा देते हैं, जबकि जिस स्प्रेडशीट पर आप वापस लौटते हैं, वह आपको याद नहीं दिला सकती कि कोई गर्म लीड दो हफ़्ते से चुप है। नतीजा सबसे महंगा रिसाव होता है — डील्स प्रतिस्पर्धियों से नहीं, बल्कि ख़ामोशी से हाथ से निकल जाती हैं।',
        'पांच लोगों के बिज़नेस को असल में जिस चीज़ की ज़रूरत होती है, वह है अपने ही नामों वाला एक पाइपलाइन, आपकी इंडस्ट्री में मायने रखने वाले फ़ील्ड्स वाला कॉन्टैक्ट रिकॉर्ड, और यह दिखाने वाला आज-का-व्यू कि किससे फ़ॉलो-अप करना है। यह बस एक विवरण है, और WyberAi इसे एक असली डेटाबेस पर चलने वाले काम के CRM में बदल देता है — आपकी टीम के लिए लॉगिन और क्लाइंट डेटा डालने से पहले एक सुरक्षा स्कैन के साथ। जब आपकी प्रक्रिया बदलती है, तो आप ऐप को चैट में बदलते हैं, किसी सेटिंग्स भूलभुलैया में नहीं।',
      ],
      features: [
        { title: 'आपके स्टेज वाली पाइपलाइन', desc: 'लीड → कोटेड → जीता, या आपका पांच-स्टेज वाला वर्ज़न — एक कानबान पाइपलाइन जो इस बात से बनी है कि आप असल में कैसे बेचते हैं।' },
        { title: 'कॉन्टैक्ट रिकॉर्ड्स, आपके फ़ील्ड्स', desc: 'कंपनी, सोर्स, बजट, रिन्यूअल डेट, साइज़, एलर्जी — आपका बिज़नेस जो भी ट्रैक करता है, पहले दिन से स्कीमा में मौजूद।' },
        { title: 'फ़ॉलो-अप आज का व्यू', desc: 'उन कॉन्टैक्ट्स का डैशबोर्ड जिनकी नेक्स्ट-एक्शन डेट आ चुकी है या जिनकी डील्स चुप हो गई हैं — रिसाव-रोधी स्क्रीन।' },
        { title: 'नोट्स और एक्टिविटी ट्रेल', desc: 'कॉल्स, मीटिंग्स, और ईमेल कॉन्टैक्ट के ख़िलाफ़ लॉग होते हैं, ताकि टीम में कोई भी बातचीत का सिलसिला उठा सके।' },
      ],
      promptExample: 'एक छोटी डिज़ाइन एजेंसी के लिए CRM वेब ऐप बनाएं: एक Pipeline पेज जिसमें कानबान स्टेज हों New Lead, Discovery, Proposal Sent, Won, और Lost, जहां डील्स की एक वैल्यू, कॉन्टैक्ट, और नेक्स्ट-एक्शन डेट हो; एक Contacts पेज जिसमें कंपनी, रोल, सोर्स, और नोट्स हों; और एक Today पेज जो उन डील्स को लिस्ट करे जिनकी नेक्स्ट-एक्शन डेट आज है या पार हो चुकी है। टीम लॉगिन शामिल करें।',
      faqs: [
        { q: 'यह HubSpot के फ़्री टियर से बेहतर कैसे है?', a: 'यह जानबूझकर छोटा है: सिर्फ़ आपके फ़ील्ड्स, सिर्फ़ आपके स्टेज, कोई अपग्रेड-वॉल नहीं — और जब आप किसी फ़ीचर से आगे निकल जाएं तो आप प्लान बदलने की बजाय उसे चैट में जोड़ लेते हैं।' },
        { q: 'क्या मैं अपने मौजूदा कॉन्टैक्ट्स इम्पोर्ट कर सकता हूं?', a: 'अपने प्रॉम्प्ट में या बाद में CSV इम्पोर्ट मांगें — अपनी स्प्रेडशीट के कॉलम बताएं और वे कॉन्टैक्ट्स टेबल में मैप हो जाते हैं।' },
        { q: 'क्या जनरेट किए गए ऐप में क्लाइंट डेटा सुरक्षित है?', a: 'ऐप ऑथेंटिकेशन और रो-लेवल सिक्योरिटी के साथ शिप होता है, और प्रकाशित करने से पहले WyberAi हमलावर की तरह लाइव डेटाबेस की जांच करता है — गंभीर लीक पब्लिश गेट को रोक देते हैं।' },
        { q: 'क्या मेरी टीम इसे एक साथ इस्तेमाल कर सकती है?', a: 'हां — यह Postgres पर चलने वाला एक असली मल्टी-यूज़र वेब ऐप है। हर कोई लॉगिन करता है, और बदलाव पूरी टीम को दिखते हैं।' },
      ],
    },
    'inventory-management-app': {
      h1: 'AI से इन्वेंट्री मैनेजमेंट ऐप बनाएं',
      metaTitle: 'AI से इन्वेंट्री मैनेजमेंट ऐप बनाएं',
      metaDesc: 'आपकी दुकान के लिए स्टॉक लेवल, लो-स्टॉक अलर्ट, और सप्लायर रीऑर्डर जानकारी — सादी अंग्रेज़ी से जनरेट किया गया इन्वेंट्री ऐप, कोई प्रति-SKU प्लेटफ़ॉर्म फ़ीस नहीं।',
      tagline: 'शेल्फ़ पर असल में क्या है यह जानें, ख़त्म होने से पहले चेतावनी पाएं, और जो सप्लायर उसे बेचता है उससे रीऑर्डर करें — एक स्क्रीन में, नोटबुक्स के ढेर में नहीं।',
      body: [
        'छोटे रिटेलर और मेकर्स इन्वेंट्री को पचास साल पुराने तरीक़े से चलाते हैं — क्लिपबोर्ड पर गिनती, याददाश्त से तय किया गया रीऑर्डर, और स्टॉकआउट का पता तब चलना जब कोई ग्राहक वही एक चीज़ मांगे जिसकी आख़िरी यूनिट कब बिकी यह आपको पता ही नहीं था। इसे ठीक करने के लिए बने इन्वेंट्री प्लेटफ़ॉर्म प्रति-SKU या प्रति-लोकेशन कीमत वसूलते हैं, जो ठीक उसी ग्रोथ को सज़ा देता है जो आप पाना चाहते हैं।',
        'आप क्या स्टॉक करते हैं और कैसे बेचते हैं, यह बताएं, और WyberAi आपकी दुकान के इर्द-गिर्द सिस्टम बनाता है: एक प्रोडक्ट लिस्ट जिसकी मात्राएं सेल्स और डिलीवरी लॉग होते ही बदलती हैं, एक लो-स्टॉक व्यू जो ख़त्म होने से पहले रीऑर्डर की ज़रूरत वाली चीज़ों को फ़्लैग करता है, और हर आइटम से जुड़ी सप्लायर डिटेल्स ताकि रीऑर्डर एक लुकअप हो, याददाश्त की परीक्षा नहीं। एक लोकेशन हो या तीन, रिटेल हो या कच्चा माल — ढांचा आपके विवरण के हिसाब से बनता है।',
      ],
      features: [
        { title: 'लाइव स्टॉक लेवल', desc: 'हर प्रोडक्ट की हाथ में मौजूद मात्रा, जो सेल्स और डिलीवरी लॉग होते ही अपडेट होती है — अब हफ़्ते के आख़िर में दोबारा गिनती नहीं।' },
        { title: 'लो-स्टॉक अलर्ट', desc: 'हर प्रोडक्ट के लिए एक रीऑर्डर थ्रेशोल्ड सेट करें; उससे नीचे जाने वाली कोई भी चीज़ स्टॉकआउट बनने से पहले डैशबोर्ड पर दिख जाती है।' },
        { title: 'हर आइटम की सप्लायर जानकारी', desc: 'सप्लायर का नाम, कॉन्टैक्ट, और कॉस्ट प्राइस हर प्रोडक्ट से जुड़े होते हैं — रीऑर्डर एक लुकअप से शुरू होता है, ईमेल में खोजबीन से नहीं।' },
        { title: 'मल्टी-लोकेशन सपोर्ट', desc: 'हर स्टोर या वेयरहाउस का स्टॉक अलग से ट्रैक करें, या एक टोटल में जोड़ दें — बिल्कुल वैसे जैसे आपका बिज़नेस असल में चलता है।' },
      ],
      promptExample: 'एक इन्वेंट्री मैनेजमेंट वेब ऐप बनाएं: एक Products पेज जिसमें आइटम्स की SKU, हाथ में मात्रा, रीऑर्डर थ्रेशोल्ड, कॉस्ट प्राइस, और सप्लायर नाम लिस्ट हों; एक Dashboard जो रीऑर्डर थ्रेशोल्ड से नीचे वाले प्रोडक्ट्स हाइलाइट करे; एक Stock Movement पेज जहां सेल्स और आने वाली डिलीवरी लॉग हों जो मात्राएं एडजस्ट करें; और एक Suppliers पेज जिसमें कॉन्टैक्ट डिटेल्स उनके सप्लाई किए प्रोडक्ट्स से जुड़ी हों।',
      faqs: [
        { q: 'क्या यह बारकोड हैंडल कर सकता है?', a: 'अपने प्रॉम्प्ट में हर प्रोडक्ट में एक बारकोड फ़ील्ड जोड़ें; लाइव होने के बाद इसे फ़ोन कैमरा स्कैनर के साथ जोड़ना चैट में एक एडिट है।' },
        { q: 'क्या मैं एक से ज़्यादा स्टोर में स्टॉक ट्रैक कर सकता हूं?', a: 'हां — अपनी लोकेशंस बताएं और मात्राओं को हर लोकेशन के हिसाब से ट्रैक किया जा सकता है, डैशबोर्ड पर एक कंबाइंड टोटल व्यू के साथ।' },
        { q: 'क्या यह पर्चेज़ ऑर्डर जनरेट करता है?', a: 'एक पर्चेज़-ऑर्डर पेज मांगें और लो-स्टॉक आइटम्स को एक क्लिक में उनके सप्लायर को संबोधित PO में बदला जा सकता है।' },
        { q: 'क्या यह किसी इन्वेंट्री SaaS से सस्ता है?', a: 'आप इसे मुफ़्त मासिक क्रेडिट्स से एक बार बनाते हैं और यह आपका हो जाता है — आपका कैटलॉग बढ़ने पर कोई प्रति-SKU या प्रति-लोकेशन मासिक फ़ीस नहीं।' },
      ],
    },
    'rental-property-manager': {
      h1: 'AI से रेंटल प्रॉपर्टी मैनेजर बनाएं',
      metaTitle: 'AI से रेंटल प्रॉपर्टी मैनेजमेंट ऐप बनाएं',
      metaDesc: 'आपकी रेंटल प्रॉपर्टीज़ के लिए यूनिट्स, टेनेंट्स, रेंट ट्रैकिंग, और मेंटेनेंस रिक्वेस्ट — सादी अंग्रेज़ी से जनरेट किया गया, कोई प्रति-यूनिट फ़ीस नहीं।',
      tagline: 'हर यूनिट, उसमें कौन रहता है, इस महीने रेंट आया या नहीं, और क्या ख़राब है — एक ही डैशबोर्ड में मकान मालिक का पूरा कामकाज।',
      body: [
        'मुट्ठी भर यूनिट्स वाले मकान मालिक अपना बिज़नेस बैंक स्टेटमेंट्स, लीक हो रहे नल के बारे में टेक्स्ट मैसेज, और यह याद रखने के भरोसे चलाते हैं कि किसने पेमेंट कर दी और कौन एक हफ़्ता लेट है। प्रॉपर्टी मैनेजमेंट सॉफ़्टवेयर मौजूद है, लेकिन वह सैकड़ों यूनिट्स के पोर्टफ़ोलियो के लिए बना और क़ीमती है, न कि उन चार डुप्लेक्स के लिए जो असल में आपके पास हैं।',
        'अपनी प्रॉपर्टीज़ बताएं और आप उन्हें कैसे मैनेज करते हैं, और WyberAi इस कामकाज को एक ऐप में बदल देता है: यूनिट्स और टेनेंट्स की एक लिस्ट, एक रेंट लेजर जो दिखाता है कि इस साइकिल में किसने पेमेंट की और किसने नहीं, और एक मेंटेनेंस बोर्ड ताकि रिपोर्ट की गई समस्या सिर्फ़ किसी टेक्स्ट थ्रेड में पड़ी न रहे जब तक आप उसे भूल न जाएं। लीज़ रिन्यूअल डेट्स आपके सिर पर आने से पहले सामने आ जाती हैं, बाद में नहीं।',
      ],
      features: [
        { title: 'यूनिट्स और टेनेंट्स', desc: 'हर प्रॉपर्टी और यूनिट, मौजूदा टेनेंट, लीज़ की शुरुआत और अंत की तारीख़, और मासिक रेंट के साथ।' },
        { title: 'रेंट पेमेंट लॉग', desc: 'हर यूनिट के हर महीने की रेंट प्राप्ति मार्क करें; एक डैशबोर्ड एक नज़र में दिखाता है कि कौन करंट है और कौन ओवरड्यू।' },
        { title: 'मेंटेनेंस रिक्वेस्ट बोर्ड', desc: 'टेनेंट्स (या आप) एक स्टेटस के साथ समस्याएं लॉग करते हैं — रिपोर्टेड, इन प्रोग्रेस, फ़िक्स्ड — ताकि कुछ भी टेक्स्ट थ्रेड में खो न जाए।' },
        { title: 'लीज़ एक्सपायरी रिमाइंडर', desc: 'अपनी अंतिम तारीख़ के क़रीब पहुंच रही लीज़ें डैशबोर्ड पर सामने आती हैं, जिससे आपको रिन्यू करने या यूनिट फिर से लिस्ट करने का समय मिलता है।' },
      ],
      promptExample: 'एक रेंटल प्रॉपर्टी मैनेजमेंट वेब ऐप बनाएं: एक Properties पेज जिसमें यूनिट्स की टेनेंट नाम, लीज़ शुरू/अंत की तारीख़, और मासिक रेंट लिस्ट हो; एक Rent Ledger पेज जहां हर यूनिट के हर महीने की प्राप्त पेमेंट्स ओवरड्यू इंडिकेटर के साथ मार्क की जाएं; एक Maintenance पेज जहां हर यूनिट की समस्याएं स्टेटस (रिपोर्टेड, इन प्रोग्रेस, फ़िक्स्ड) के साथ लॉग हों; और एक Dashboard जो अगले 60 दिनों में एक्सपायर होने वाली लीज़ें हाइलाइट करे।',
      faqs: [
        { q: 'क्या टेनेंट खुद मेंटेनेंस रिक्वेस्ट सबमिट कर सकते हैं?', a: 'हां — एक टेनेंट लॉगिन और एक रिक्वेस्ट फ़ॉर्म जोड़ें, और वे जो समस्याएं सबमिट करते हैं वे सीधे आपके मेंटेनेंस बोर्ड पर आती हैं।' },
        { q: 'क्या यह लेट फ़ीस कैलकुलेट कर सकता है?', a: 'अपने प्रॉम्प्ट में अपना लेट-फ़ीस नियम बताएं और एक बार पेमेंट अपनी ड्यू डेट पार कर जाए तो रेंट लेजर इसे अपने-आप लागू कर सकता है।' },
        { q: 'क्या यह एक से ज़्यादा प्रॉपर्टी के लिए काम करता है?', a: 'हां — यह ढांचा एक डुप्लेक्स से लेकर एक पूरे पोर्टफ़ोलियो तक स्केल करता है; हर प्रॉपर्टी की अपनी यूनिट्स, टेनेंट्स, और लेजर होती है।' },
        { q: 'क्या टेनेंट का डेटा सुरक्षित है?', a: 'ऐप अपने ख़ुद के डेटाबेस पर रो-लेवल सिक्योरिटी के साथ चलता है, प्रकाशित करने से पहले लाइव स्कैन किया जाता है — टेनेंट डिटेल्स सार्वजनिक रूप से उजागर नहीं होतीं।' },
      ],
    },
    'ecommerce-seller-dashboard': {
      h1: 'AI से ईकॉमर्स सेलर डैशबोर्ड बनाएं',
      metaTitle: 'AI से ईकॉमर्स सेलर डैशबोर्ड बनाएं — बिना कोड',
      metaDesc: 'Amazon, Shopify, और Etsy पर ऑर्डर, मार्जिन, और स्टॉक एक ही डैशबोर्ड में — सादी अंग्रेज़ी से जनरेट किया गया, कोई प्रति-चैनल प्लेटफ़ॉर्म फ़ीस नहीं।',
      tagline: 'आप जिस भी चैनल पर बेचते हैं उन सबके लिए एक डैशबोर्ड — हर ऑर्डर का असली मार्जिन, स्टॉक जो झूठ नहीं बोलता, और जब भी मार्केटप्लेस जोड़ें कोई नई सब्सक्रिप्शन नहीं।',
      body: [
        'एक से ज़्यादा चैनल पर बेचें — Amazon, Shopify, Etsy, अपना स्टोरफ़्रंट — तो हर एक के लिए अलग लॉगिन, अलग रिपोर्ट फ़ॉर्मैट, और "प्रॉफ़िट" की अलग परिभाषा मिलती है। महीने के अंत में इन्हें एक तस्वीर में पिरोने का मतलब आमतौर पर तीन जगहों से स्प्रेडशीट एक्सपोर्ट करना और उम्मीद करना है कि कैटेगरीज़ मेल खा जाएं।',
        'आप असल में कैसे बेचते हैं यह बताएं — कौन-से चैनल, हर एक कितनी फ़ीस लेता है, आप हर ऑर्डर पर मार्जिन को कैसे देखते हैं — और WyberAi उसी के इर्द-गिर्द डैशबोर्ड बनाता है: किसी भी चैनल से ऑर्डर लॉग करने की एक जगह, एक मार्जिन व्यू जो बिक्री जहां हुई वहां की फ़ीस और लागत घटाता है, और एक स्टॉक तस्वीर जो यह नहीं मान लेती कि आप सिर्फ़ एक जगह बेचते हैं। बाद में एक चैनल जोड़ना बस एक प्रॉम्प्ट दूर है, कोई नई सब्सक्रिप्शन नहीं।',
      ],
      features: [
        { title: 'एक फ़ीड, हर चैनल', desc: 'Amazon, Shopify, Etsy, या अपने स्टोर से ऑर्डर एक जगह लॉग करें, पूरी तस्वीर जोड़ने के लिए टैब बदलने की बजाय।' },
        { title: 'हर ऑर्डर पर असली मार्जिन', desc: 'हर चैनल का फ़ीस प्रतिशत और अपनी कॉस्ट प्राइस जोड़ें, और मार्जिन हर ऑर्डर के हिसाब से कैलकुलेट होता है — किसी मिले-जुले औसत से अंदाज़ा नहीं।' },
        { title: 'चैनलों के आर-पार स्टॉक', desc: 'एक प्रोडक्ट तीन जगह बेचा जाए तब भी उसकी एक ही मात्रा हाथ में होती है, इसलिए आप वह ओवरसेल नहीं करते जो कोई दूसरा चैनल पहले ही बेच चुका है।' },
        { title: 'आपके कैटलॉग के साथ बढ़ता है, उसके ख़िलाफ़ नहीं', desc: 'कोई प्रति-ऑर्डर या प्रति-चैनल फ़ीस नहीं जो स्केल करने पर बढ़े — आप इसे मुफ़्त क्रेडिट्स से एक बार बनाते हैं और यह आपका है।' },
      ],
      promptExample: 'एक ईकॉमर्स सेलर डैशबोर्ड वेब ऐप बनाएं: एक Orders पेज जहां हर सेल को उसके चैनल (Amazon, Shopify, Etsy, या कस्टम), सेल प्राइस, चैनल फ़ीस, और कॉस्ट प्राइस के साथ लॉग किया जाए; एक Dashboard पेज जो कुल रेवेन्यू, फ़ीस, और नेट मार्जिन को चैनल और महीने के हिसाब से तोड़कर दिखाए; एक Products पेज जो सभी चैनलों में साझा स्टॉक मात्रा को लो-स्टॉक इंडिकेटर के साथ ट्रैक करे; और एक Channels पेज जहां आप जहां भी बेचते हैं उसके लिए फ़ीस प्रतिशत जोड़ या एडिट कर सकें।',
      faqs: [
        { q: 'क्या यह सीधे मेरे Amazon या Shopify अकाउंट से जुड़ता है?', a: 'शुरुआत में नहीं — यह एक describe-your-numbers डैशबोर्ड है, इसलिए आप ख़ुद ऑर्डर लॉग या पेस्ट करते हैं। इससे किसी मार्केटप्लेस API पर निर्भर होने से बचा जाता है जो बदल सकता है या रद्द हो सकता है; अपने प्रॉम्प्ट में एक बल्क-पेस्ट या CSV-इम्पोर्ट स्क्रीन मांगें और इसे जोड़ा जा सकता है।' },
        { q: 'क्या यह तीन से ज़्यादा चैनल हैंडल कर सकता है?', a: 'हां — Channels पेज आपके बताए जितने भी चैनल रखता है, हर एक की अपनी फ़ीस प्रतिशत के साथ, और डैशबोर्ड इन सबको एक मार्जिन व्यू में जोड़ देता है।' },
        { q: 'क्या मुझे अपनी वेबसाइट या होस्टिंग चाहिए?', a: 'नहीं — प्रकाशित करें और यह तुरंत एक मुफ़्त wyberai.app सबडोमेन पर लाइव हो जाता है; अगर चाहें तो बाद में अपना डोमेन जोड़ें।' },
        { q: 'क्या यह किसी मल्टी-चैनल सेलर टूल से सस्ता है?', a: 'आप इसे मुफ़्त मासिक क्रेडिट्स से एक बार बनाते हैं और पूरी तरह मालिक बनते हैं — कोई प्रति-ऑर्डर या प्रति-चैनल फ़ीस नहीं जो आपकी बिक्री के साथ बढ़े।' },
      ],
    },
  },
  kn: {
    'salon-booking-app': {
      h1: 'AI ಮೂಲಕ ಸಲೂನ್ ಬುಕಿಂಗ್ ಆ್ಯಪ್ ರಚಿಸಿ',
      metaTitle: 'AI ಮೂಲಕ ಸಲೂನ್ ಬುಕಿಂಗ್ ಆ್ಯಪ್ ರಚಿಸಿ — ಕೋಡ್ ಇಲ್ಲದೆ',
      metaDesc: 'ಫೋನ್-ಟ್ಯಾಗ್ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗಳನ್ನು ಆನ್‌ಲೈನ್ ಬುಕಿಂಗ್‌ಗಳಾಗಿ ಬದಲಿಸಿ: ಸೇವೆಗಳು, ಸ್ಟೈಲಿಸ್ಟ್ ಕ್ಯಾಲೆಂಡರ್‌ಗಳು, ಮತ್ತು ಕ್ಲೈಂಟ್ ಹಿಸ್ಟರಿ — ಸರಳ ಇಂಗ್ಲಿಷ್ ವಿವರಣೆಯಿಂದ ರಚಿಸಲಾಗಿದೆ, ಕೋಡ್ ಇಲ್ಲದೆ.',
      tagline: 'ಕ್ಲೈಂಟ್‌ಗಳು ಒಂದು ಸೇವೆ, ಒಬ್ಬ ಸ್ಟೈಲಿಸ್ಟ್, ಮತ್ತು ಒಂದು ಸ್ಲಾಟ್ ಆಯ್ಕೆ ಮಾಡುತ್ತಾರೆ. ನೀವು ಒಂದೇ ನೋಟದಲ್ಲಿ ದಿನದ ಶೆಡ್ಯೂಲ್ ನೋಡುತ್ತೀರಿ. ಇನ್ನು DM ಮತ್ತು ಫೋನ್-ಟ್ಯಾಗ್ ಬುಕಿಂಗ್ ಬೇಡ.',
      body: [
        'ಹೆಚ್ಚಿನ ಸಲೂನ್‌ಗಳಿಗೆ ಬುಕಿಂಗ್ ವ್ಯವಸ್ಥೆ ಎಂದರೆ ಒಂದು ಫೋನ್, ಒಂದು Instagram DM ಇನ್‌ಬಾಕ್ಸ್, ಮತ್ತು ಒಂದು ಪೇಪರ್ ಡೈರಿ — ಇದು ಡಬಲ್-ಬುಕಿಂಗ್ ಒಬ್ಬ ರೆಗ್ಯುಲರ್ ಕ್ಲೈಂಟ್‌ ಅನ್ನು ಕಳೆದುಕೊಳ್ಳುವವರೆಗೆ, ಅಥವಾ "ನೀವು ಗುರುವಾರ ಫ್ರೀ ಇದ್ದೀರಾ?" ಎಂಬ ಸಂದೇಶಗಳಲ್ಲಿ ಒಂದು ಗಂಟೆ ಕರಗುವವರೆಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ. ಇದನ್ನು ಸರಿಪಡಿಸುವ ಬುಕಿಂಗ್ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್‌ಗಳು ಪ್ರತಿ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗೆ ಕಮಿಷನ್ ತೆಗೆದುಕೊಳ್ಳುತ್ತವೆ ಅಥವಾ ಪ್ರತಿ ಚೇರ್‌ಗೆ ತಿಂಗಳ ಶುಲ್ಕ ವಿಧಿಸುತ್ತವೆ.',
        'ಸಲೂನ್ ಬುಕಿಂಗ್ ಆ್ಯಪ್ ವಾಸ್ತವವಾಗಿ ಒಂದು ಡೇಟಾ ಸಮಸ್ಯೆ — ಅವಧಿಗಳಿರುವ ಸೇವೆಗಳು, ಕೆಲಸದ ಸಮಯವಿರುವ ಸಿಬ್ಬಂದಿ, ಮತ್ತು ಒಂದಕ್ಕೊಂದು ಡಿಕ್ಕಿಯಾಗದ ಸ್ಲಾಟ್‌ಗಳು — ಮತ್ತು WyberAi ನಿಮ್ಮ ವಿವರಣೆಯಿಂದ ನಿಖರವಾಗಿ ಇದನ್ನೇ ಜನರೇಟ್ ಮಾಡುತ್ತದೆ: ನಿಜವಾಗಿ ಖಾಲಿ ಇರುವ ಸ್ಲಾಟ್‌ಗಳನ್ನು ಮಾತ್ರ ತೋರಿಸುವ ಕ್ಲೈಂಟ್-ಮುಖಿ ಬುಕಿಂಗ್ ಪೇಜ್, ಮತ್ತು ಪ್ರತಿ ಸ್ಟೈಲಿಸ್ಟ್‌ನ ದಿನವನ್ನು ತೋರಿಸುವ ಓನರ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್. "ಸ್ಟೈಲಿಸ್ಟ್" ಅನ್ನು "ಬಾರ್ಬರ್", "ಥೆರಪಿಸ್ಟ್", ಅಥವಾ "ಆರ್ಟಿಸ್ಟ್" ಎಂದು ಬದಲಾಯಿಸಿ, ಅದೇ ಆಕಾರ ನಿಮ್ಮ ಅಂಗಡಿಗೆ ಹೊಂದುತ್ತದೆ.',
      ],
      features: [
        { title: 'ಅವಧಿಗಳಿರುವ ಸೇವಾ ಮೆನು', desc: 'ಕಟ್, ಕಲರ್, ಬ್ಲೋ-ಡ್ರೈ — ಪ್ರತಿ ಸೇವೆಗೆ ಒಂದು ಅವಧಿ ಮತ್ತು ಬೆಲೆ ಇರುತ್ತದೆ, ಆದ್ದರಿಂದ ಸ್ಲಾಟ್ ಉದ್ದವನ್ನು ಊಹಿಸುವುದಿಲ್ಲ, ಲೆಕ್ಕ ಹಾಕಲಾಗುತ್ತದೆ.' },
        { title: 'ಪ್ರತಿ-ಸ್ಟೈಲಿಸ್ಟ್ ಕ್ಯಾಲೆಂಡರ್‌ಗಳು', desc: 'ಪ್ರತಿ ಸಿಬ್ಬಂದಿಗೆ ಸ್ವಂತ ಕೆಲಸದ ಸಮಯ ಮತ್ತು ಸ್ವಂತ ಬುಕಿಂಗ್‌ಗಳಿವೆ; ಕ್ಲೈಂಟ್‌ಗಳು ಒಬ್ಬ ವ್ಯಕ್ತಿಯನ್ನು ಅಥವಾ "ಮೊದಲು ಸಿಗುವವರನ್ನು" ಆಯ್ಕೆ ಮಾಡಬಹುದು.' },
        { title: 'ಡಿಕ್ಕಿ-ಮುಕ್ತ ಸ್ಲಾಟ್‌ಗಳು', desc: 'ಆ ಸ್ಟೈಲಿಸ್ಟ್ ಮತ್ತು ಆ ಸೇವೆಯ ಅವಧಿಗೆ ನಿಜವಾಗಿ ಖಾಲಿ ಇರುವ ಸ್ಲಾಟ್‌ಗಳನ್ನು ಮಾತ್ರ ಬುಕಿಂಗ್ ಪೇಜ್ ತೋರಿಸುತ್ತದೆ.' },
        { title: 'ಕ್ಲೈಂಟ್ ಹಿಸ್ಟರಿ', desc: 'ಪ್ರತಿ ಕ್ಲೈಂಟ್‌ನ ಹಿಂದಿನ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗಳು ಒಂದೇ ಕಡೆ — ಯಾರನ್ನು ಭೇಟಿಯಾದರು, ಏನು ಮಾಡಿಸಿಕೊಂಡರು, ಮತ್ತೆ ಯಾವಾಗ ಬರಬೇಕು.' },
      ],
      promptExample: 'ಸಲೂನ್ ಬುಕಿಂಗ್ ವೆಬ್ ಆ್ಯಪ್ ರಚಿಸಿ: ಕ್ಲೈಂಟ್‌ಗಳು ಒಂದು ಸೇವೆ (ಪ್ರತಿಯೊಂದಕ್ಕೂ ಅವಧಿ ಮತ್ತು ಬೆಲೆಯೊಂದಿಗೆ) ಆಯ್ಕೆ ಮಾಡುವ, ಒಬ್ಬ ಸ್ಟೈಲಿಸ್ಟ್ ಅಥವಾ "ಮೊದಲು ಸಿಗುವವರನ್ನು" ಆಯ್ಕೆ ಮಾಡುವ, ಮತ್ತು ಖಾಲಿ ಟೈಮ್ ಸ್ಲಾಟ್‌ಗಳಿಂದ ಆಯ್ಕೆ ಮಾಡುವ ಪಬ್ಲಿಕ್ Booking ಪೇಜ್; ಪ್ರತಿ ಸ್ಟೈಲಿಸ್ಟ್‌ನ ಇಂದಿನ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗಳನ್ನು ಟೈಮ್‌ಲೈನ್‌ನಲ್ಲಿ ತೋರಿಸುವ ಓನರ್ Dashboard; ಮತ್ತು ಪ್ರತಿ ಕ್ಲೈಂಟ್‌ನ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಹಿಸ್ಟರಿಯಿರುವ Clients ಪೇಜ್. ಸ್ಟೈಲಿಸ್ಟ್‌ಗಳ ಕೆಲಸದ ಸಮಯ ಕಾನ್ಫಿಗರ್ ಮಾಡಬಹುದಾಗಿರಲಿ.',
      faqs: [
        { q: 'ಇದು ಡಬಲ್-ಬುಕಿಂಗ್ ತಡೆಯುತ್ತದೆಯೇ?', a: 'ಹೌದು — ಲಭ್ಯವಿರುವ ಸ್ಲಾಟ್‌ಗಳನ್ನು ಸ್ಟೈಲಿಸ್ಟ್‌ನ ಕೆಲಸದ ಸಮಯದಿಂದ ಈಗಿನ ಬುಕಿಂಗ್‌ಗಳು ಮತ್ತು ಸೇವೆಯ ಅವಧಿಯನ್ನು ಕಳೆದು ಲೆಕ್ಕ ಹಾಕಲಾಗುತ್ತದೆ, ಆದ್ದರಿಂದ ತುಂಬಿದ ಸ್ಲಾಟ್ ಎಂದಿಗೂ ಕಾಣಿಸುವುದಿಲ್ಲ.' },
        { q: 'ಕ್ಲೈಂಟ್‌ಗಳು ಸ್ವತಃ ಕ್ಯಾನ್ಸಲ್ ಅಥವಾ ರೀಶೆಡ್ಯೂಲ್ ಮಾಡಬಹುದೇ?', a: 'ನಿಮ್ಮ ಪ್ರಾಂಪ್ಟ್‌ನಲ್ಲಿ ಅಥವಾ ನಂತರ ಚಾಟ್‌ನಲ್ಲಿ manage-booking ಪೇಜ್ ಕೇಳಿ — ಕ್ಲೈಂಟ್‌ಗಳಿಗೆ ನೀವು ಸೆಟ್ ಮಾಡಿದ ನಿಯಮಗಳ ಒಳಗೆ ತಮ್ಮ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ನೋಡಲು, ಕ್ಯಾನ್ಸಲ್ ಮಾಡಲು, ಅಥವಾ ಬದಲಿಸಲು ಒಂದು ಲಿಂಕ್ ಸಿಗುತ್ತದೆ.' },
        { q: 'ಇದು ಬಾರ್ಬರ್‌ಶಾಪ್, ಸ್ಪಾ, ಅಥವಾ ಕ್ಲಿನಿಕ್‌ಗಳಿಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆಯೇ?', a: 'ಅದೇ ರಚನೆ — ಸೇವೆಗಳು, ಸಿಬ್ಬಂದಿ, ಕೆಲಸದ ಸಮಯ, ಸ್ಲಾಟ್‌ಗಳು — ಯಾವುದೇ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಬಿಸಿನೆಸ್‌ಗೆ ಹೊಂದುತ್ತದೆ. ನಿಮ್ಮ ವರ್ಷನ್ ವಿವರಿಸಿ ಮತ್ತು ಲೇಬಲ್‌ಗಳು ಹಾಗೂ ನಿಯಮಗಳು ಹೊಂದಿಕೊಳ್ಳುತ್ತವೆ.' },
        { q: 'ಇದನ್ನು ಲೈವ್ ಮಾಡಲು ಸಿದ್ಧವಾದಾಗ ಏನಾಗುತ್ತದೆ?', a: 'ಎಡಿಟರ್‌ನಿಂದ ಪ್ರಕಟಿಸಿ ಮತ್ತು ಲಿಂಕ್ ಹಂಚಿಕೊಳ್ಳಿ. ಪ್ರಕಟಿಸುವ ಮೊದಲು, ಕ್ಲೈಂಟ್ ಡೇಟಾ ಬಹಿರಂಗವಾಗದಂತೆ WyberAi ಆ್ಯಪ್‌ನ ಡೇಟಾಬೇಸ್‌ನಲ್ಲಿ ಲೈವ್ ಸೆಕ್ಯುರಿಟಿ ಸ್ಕ್ಯಾನ್ ನಡೆಸುತ್ತದೆ.' },
      ],
    },
    'restaurant-menu-app': {
      h1: 'AI ಮೂಲಕ ರೆಸ್ಟೋರೆಂಟ್ ಮೆನು ಆ್ಯಪ್ ರಚಿಸಿ',
      metaTitle: 'AI ಮೂಲಕ ರೆಸ್ಟೋರೆಂಟ್ ಮೆನು ಮತ್ತು QR ಆರ್ಡರಿಂಗ್ ಆ್ಯಪ್ ರಚಿಸಿ',
      metaDesc: 'ನಿಮ್ಮ ಅಡುಗೆಮನೆ ಸೆಕೆಂಡುಗಳಲ್ಲಿ ಎಡಿಟ್ ಮಾಡಬಹುದಾದ ಡಿಜಿಟಲ್ ಮೆನು — ಕೆಟಗರಿಗಳು, ಫೋಟೋಗಳು, ಬೆಲೆಗಳು, ಮತ್ತು ಸ್ಪೆಷಲ್‌ಗಳು — ಸರಳ ಇಂಗ್ಲಿಷ್‌ನಿಂದ ಜನರೇಟ್ ಆಗಿದೆ. QR-ರೆಡಿ, ಕೋಡ್ ಇಲ್ಲದೆ, ಪ್ರಾರಂಭಿಸಲು ಉಚಿತ.',
      tagline: 'ಮೀನು ಬದಲಾದಾಗ ನಿಮ್ಮ ಫೋನ್‌ನಿಂದ ಅಪ್‌ಡೇಟ್ ಮಾಡುವ ಮೆನು — ಬೆಲೆ ಬದಲಾದಾಗಲೆಲ್ಲ ಮರುಮುದ್ರಿಸುವ PDF ಅಲ್ಲ.',
      body: [
        'ಲ್ಯಾಮಿನೇಟೆಡ್ ಮೆನುಗಳು ಮತ್ತು PDF ಲಿಂಕ್‌ಗಳಿಗೆ ಒಂದೇ ದೋಷವಿದೆ: ಬೆಲೆ ಬದಲಾದ ಅಥವಾ ಒಂದು ಡಿಶ್ ಮುಗಿದ ಕ್ಷಣ, ಅವು ತಪ್ಪಾಗುತ್ತವೆ. ಮತ್ತು ಇದನ್ನು ಪರಿಹರಿಸುವ QR-ಮೆನು ಪ್ಲಾಟ್‌ಫಾರ್ಮ್‌ಗಳು ತಿಂಗಳ ಬಾಡಿಗೆ ವಿಧಿಸುತ್ತವೆ, ಆದರೆ ಅದು ಒಳಗಿನಿಂದ ಕೇವಲ ಫೋಟೋಗಳಿರುವ ಡಿಶ್‌ಗಳ ಪಟ್ಟಿ — ನೀವೇ ಸಂಪೂರ್ಣ ಮಾಲೀಕತ್ವ ಹೊಂದಬೇಕಾದ ಕಂಟೆಂಟ್.',
        'ನಿಮ್ಮ ಮೆನುವಿನ ಆಕಾರ ವಿವರಿಸಿ — ವಿಭಾಗಗಳು, ಡಿಶ್ ವಿವರಗಳು, ಡಯಟರಿ ಟ್ಯಾಗ್‌ಗಳು, ಒಂದು ಸ್ಪೆಷಲ್ಸ್ ಬೋರ್ಡ್ — ಮತ್ತು WyberAi ಎರಡೂ ಭಾಗಗಳನ್ನು ನಿರ್ಮಿಸುತ್ತದೆ: ಟೇಬಲ್ QR ಕೋಡ್‌ನಿಂದ ವೇಗವಾಗಿ ಲೋಡ್ ಆಗುವ ಗೆಸ್ಟ್-ಮುಖಿ ಮೆನು, ಮತ್ತು ಸಿಬ್ಬಂದಿ ಸೆಕೆಂಡುಗಳಲ್ಲಿ "ಸೋಲ್ಡ್ ಔಟ್" ಫ್ಲಿಪ್ ಮಾಡುವ ಅಥವಾ ಇಂದಿನ ಸ್ಪೆಷಲ್ ಅಪ್‌ಡೇಟ್ ಮಾಡುವ ಅಡ್ಮಿನ್ ಪೇಜ್. ಇದು ನಿಜವಾದ ವೆಬ್ ಆ್ಯಪ್, ವಿಜೆಟ್ ಅಲ್ಲದ ಕಾರಣ, ಇದು ನಿಮ್ಮೊಂದಿಗೆ ಬೆಳೆಯುತ್ತದೆ: ಸಿದ್ಧವಾದಾಗ ಎರಡನೇ ಸ್ಥಳದ ಮೆನು, ಟೇಕ್‌ಅವೇ ಆರ್ಡರ್ ಫಾರ್ಮ್, ಅಥವಾ ಪೇರಿಂಗ್‌ಗಳಿರುವ ವೈನ್ ಲಿಸ್ಟ್ ಸೇರಿಸಿ.',
      ],
      features: [
        { title: 'ವಿಭಾಗಗಳು ಮತ್ತು ಡಿಶ್ ಕಾರ್ಡ್‌ಗಳು', desc: 'ಸ್ಟಾರ್ಟರ್ಸ್, ಮೇನ್ಸ್, ಡೆಸರ್ಟ್ಸ್, ಡ್ರಿಂಕ್ಸ್ — ಪ್ರತಿ ಡಿಶ್‌ಗೆ ಫೋಟೋ, ವಿವರಣೆ, ಬೆಲೆ, ಮತ್ತು ಡಯಟರಿ ಟ್ಯಾಗ್‌ಗಳು (V, VG, GF, ಸ್ಪೈಸ್ ಲೆವೆಲ್).' },
        { title: 'ಸೋಲ್ಡ್-ಔಟ್ ಮತ್ತು ಸ್ಪೆಷಲ್ಸ್ ಸ್ವಿಚ್‌ಗಳು', desc: 'ಸಿಬ್ಬಂದಿ ಫೋನ್‌ನಿಂದ ಲಭ್ಯತೆ ಟಾಗಲ್ ಮಾಡುತ್ತಾರೆ ಅಥವಾ ಇಂದಿನ ಸ್ಪೆಷಲ್ ಪಿನ್ ಮಾಡುತ್ತಾರೆ — ಗೆಸ್ಟ್‌ಗಳಿಗೆ ಈ ಬದಲಾವಣೆ ತಕ್ಷಣ ಕಾಣುತ್ತದೆ.' },
        { title: 'QR-ಮೊದಲ ಗೆಸ್ಟ್ ವ್ಯೂ', desc: 'ಟೇಬಲ್ QR ಕೋಡ್‌ನಿಂದ ತೆರೆಯಲು ರಚಿಸಲಾದ ವೇಗವಾದ, ಮೊಬೈಲ್-ಮೊದಲ ಮೆನು — ಆ್ಯಪ್ ಡೌನ್‌ಲೋಡ್ ಇಲ್ಲ, PDF ಪಿಂಚ್-ಜೂಮ್ ಮಾಡುವುದಿಲ್ಲ.' },
        { title: 'ಬಹು-ಭಾಷೆ ಸಿದ್ಧ', desc: 'ಅಗತ್ಯವಿದ್ದಾಗ ನಿಮ್ಮ ಮೆನು ಕಂಟೆಂಟ್‌ಗೆ ಎರಡನೇ ಭಾಷೆ ಸೇರಿಸಿ — ರಚನೆ ಪ್ರತಿ-ಭಾಷೆ ಡಿಶ್ ಪಠ್ಯವನ್ನು ಬೆಂಬಲಿಸುತ್ತದೆ.' },
      ],
      promptExample: 'ರೆಸ್ಟೋರೆಂಟ್ ಮೆನು ವೆಬ್ ಆ್ಯಪ್ ರಚಿಸಿ: ವಿಭಾಗಗಳಿರುವ (Starters, Mains, Desserts, Drinks) ಪಬ್ಲಿಕ್, ಮೊಬೈಲ್-ಮೊದಲ Menu ಪೇಜ್, ಪ್ರತಿ ಡಿಶ್ ಫೋಟೋ, ವಿವರಣೆ, ಬೆಲೆ, ಮತ್ತು ಡಯಟರಿ ಟ್ಯಾಗ್ ತೋರಿಸಲಿ, ಜೊತೆಗೆ ಹೈಲೈಟ್ ಮಾಡಿದ Today\'s Specials ವಿಭಾಗವಿರಲಿ; ಮತ್ತು ಸಿಬ್ಬಂದಿ ಡಿಶ್ ಸೇರಿಸಲು ಅಥವಾ ಎಡಿಟ್ ಮಾಡಲು, ಐಟಂಗಳನ್ನು ಸೋಲ್ಡ್ ಔಟ್ ಮಾರ್ಕ್ ಮಾಡಲು, ಮತ್ತು ಡೈಲಿ ಸ್ಪೆಷಲ್ಸ್ ಸೆಟ್ ಮಾಡಲು Admin ಪೇಜ್ (ಲಾಗಿನ್ ಅಗತ್ಯ).',
      faqs: [
        { q: 'ಗೆಸ್ಟ್‌ಗಳು ಮೆನುವನ್ನು ಹೇಗೆ ತಲುಪುತ್ತಾರೆ?', a: 'ಆ್ಯಪ್ ಪ್ರಕಟಿಸಿ ಮತ್ತು ಅದರ URL ಅನ್ನು ಸೂಚಿಸುವ QR ಕೋಡ್ ರಚಿಸಿ — ಯಾವುದೇ ಉಚಿತ QR ಜನರೇಟರ್ ಕೆಲಸ ಮಾಡುತ್ತದೆ. ಗೆಸ್ಟ್‌ಗಳು ಸ್ಕ್ಯಾನ್ ಮಾಡುತ್ತಾರೆ ಮತ್ತು ಮೆನು ಅವರ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ತೆರೆಯುತ್ತದೆ, ಡೌನ್‌ಲೋಡ್ ಇಲ್ಲ.' },
        { q: 'ತಾಂತ್ರಿಕವಲ್ಲದ ಸಿಬ್ಬಂದಿ ಇದನ್ನು ಅಪ್‌ಡೇಟ್ ಮಾಡಬಹುದೇ?', a: 'ಅಡ್ಮಿನ್ ಪೇಜ್‌ನ ಉದ್ದೇಶವೇ ಅದು: ಲಾಗಿನ್ ಮಾಡುವುದು ಮತ್ತು ಒಂದು ಡಿಶ್ ಟಾಗಲ್ ಮಾಡುವುದು ಅಥವಾ ಬೆಲೆ ಎಡಿಟ್ ಮಾಡುವುದು ಒಂದು ಫಾರ್ಮ್, ಕೋಡ್ ಬದಲಾವಣೆ ಅಲ್ಲ.' },
        { q: 'ನಾನು ನಂತರ ಆನ್‌ಲೈನ್ ಆರ್ಡರಿಂಗ್ ಸೇರಿಸಬಹುದೇ?', a: 'ಹೌದು — ಮೆನುವಿನಿಂದ ಪ್ರಾರಂಭಿಸಿ ಮತ್ತು ಸಿದ್ಧವಾದಾಗ ಟೇಕ್‌ಅವೇ ಆರ್ಡರ್ ಫ್ಲೋ ಸೇರಿಸಲು ಚಾಟ್‌ಗೆ ಕೇಳಿ; ನೀವು ನಮೂದಿಸಿದ ಡಿಶ್ ಡೇಟಾ ಮುಂದುವರಿಯುತ್ತದೆ.' },
        { q: 'ಇದನ್ನು ನಡೆಸಲು ಎಷ್ಟು ಖರ್ಚಾಗುತ್ತದೆ?', a: 'ರಚಿಸಲು ಉಚಿತ ಮಾಸಿಕ ಕ್ರೆಡಿಟ್‌ಗಳು ಬಳಕೆಯಾಗುತ್ತವೆ (ಒಂದು ಬಿಲ್ಡ್ 30, ಎಡಿಟ್‌ಗಳು 2), ಮತ್ತು ಪ್ರಕಟಿತ ಆ್ಯಪ್‌ಗಳನ್ನು ನಿಮಗಾಗಿ ಹೋಸ್ಟ್ ಮಾಡಲಾಗುತ್ತದೆ — ಪ್ರತಿ-ಟೇಬಲ್ ಅಥವಾ ಪ್ರತಿ-ಸ್ಕ್ಯಾನ್ ಶುಲ್ಕವಿಲ್ಲ.' },
      ],
    },
    'client-crm': {
      h1: 'AI ಮೂಲಕ ನಿಮ್ಮ ಬಿಸಿನೆಸ್‌ಗೆ ಸರಳ CRM ರಚಿಸಿ',
      metaTitle: 'AI ಮೂಲಕ ಕಸ್ಟಮ್ CRM ರಚಿಸಿ — ನಿಮ್ಮ ಪೈಪ್‌ಲೈನ್, ಕೋಡ್ ಇಲ್ಲದೆ',
      metaDesc: 'ನಿಮ್ಮ ಸೇಲ್ಸ್ ಪ್ರಕ್ರಿಯೆಗೆ ಹೊಂದುವ CRM: ನಿಮ್ಮ ಪೈಪ್‌ಲೈನ್ ಹಂತಗಳು, ನಿಮ್ಮ ಫೀಲ್ಡ್‌ಗಳು, ನಿಮ್ಮ ಫಾಲೋ-ಅಪ್ ಲಯ — ವಿವರಣೆಯಿಂದ ಜನರೇಟ್, ವಾರಗಟ್ಟಲೆ ಕಾನ್ಫಿಗರ್ ಮಾಡುವ ಅಗತ್ಯವಿಲ್ಲ.',
      tagline: 'ನಿಮ್ಮ ಪೈಪ್‌ಲೈನ್ ಹಂತಗಳು, ನಿಮ್ಮ ಫೀಲ್ಡ್‌ಗಳು, ನಿಮ್ಮ ಫಾಲೋ-ಅಪ್ ಲಯ — ನಿಮ್ಮ ಬಿಸಿನೆಸ್‌ಗೆ ಹೊಂದುವ CRM, ಸಂಕುಚಿಸಬೇಕಾದ ದೊಡ್ಡ ಟೂಲ್ ಅಲ್ಲ.',
      body: [
        'CRM ಗಳು ಸಣ್ಣ ಬಿಸಿನೆಸ್‌ಗಳನ್ನು ಎರಡೂ ಕಡೆಯಿಂದ ನಿರಾಶೆಗೊಳಿಸುತ್ತವೆ: ದೊಡ್ಡ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್‌ಗಳು ನಿಮ್ಮನ್ನು ಸೆಟಪ್ ಮತ್ತು ಪ್ರತಿ-ಸೀಟ್ ಬೆಲೆಯಲ್ಲಿ ಮುಳುಗಿಸುತ್ತವೆ, ಆದರೆ ನೀವು ಹಿಂತಿರುಗುವ ಸ್ಪ್ರೆಡ್‌ಶೀಟ್ ಒಂದು ಬಿಸಿ ಲೀಡ್ ಎರಡು ವಾರ ಮೌನವಾಗಿದೆ ಎಂದು ನೆನಪಿಸಲಾರದು. ಫಲಿತಾಂಶ ಅತ್ಯಂತ ದುಬಾರಿ ಸೋರಿಕೆ — ಡೀಲ್‌ಗಳು ಸ್ಪರ್ಧಿಗಳಿಗೆ ಅಲ್ಲ, ಮೌನಕ್ಕೆ ಕಳೆದುಹೋಗುತ್ತವೆ.',
        'ಐದು ಜನರ ಬಿಸಿನೆಸ್‌ಗೆ ನಿಜವಾಗಿ ಬೇಕಾಗಿರುವುದು ತನ್ನದೇ ಹಂತದ ಹೆಸರುಗಳಿರುವ ಪೈಪ್‌ಲೈನ್, ನಿಮ್ಮ ಇಂಡಸ್ಟ್ರಿಗೆ ಮುಖ್ಯವಾದ ಫೀಲ್ಡ್‌ಗಳಿರುವ ಕಾಂಟ್ಯಾಕ್ಟ್ ರೆಕಾರ್ಡ್, ಮತ್ತು ಯಾರಿಗೆ ಫಾಲೋ-ಅಪ್ ಮಾಡಬೇಕು ಎಂಬ ಇಂದಿನ-ವ್ಯೂ. ಇದು ಕೇವಲ ಒಂದು ವಿವರಣೆ, ಮತ್ತು WyberAi ಅದನ್ನು ನಿಜವಾದ ಡೇಟಾಬೇಸ್‌ನಲ್ಲಿ ಚಲಿಸುವ ಕೆಲಸ ಮಾಡುವ CRM ಆಗಿ ಬದಲಿಸುತ್ತದೆ — ನಿಮ್ಮ ತಂಡಕ್ಕೆ ಲಾಗಿನ್‌ಗಳು ಮತ್ತು ಕ್ಲೈಂಟ್ ಡೇಟಾ ಹಾಕುವ ಮೊದಲು ಸೆಕ್ಯುರಿಟಿ ಸ್ಕ್ಯಾನ್‌ನೊಂದಿಗೆ. ನಿಮ್ಮ ಪ್ರಕ್ರಿಯೆ ಬದಲಾದಾಗ, ನೀವು ಆ್ಯಪ್ ಅನ್ನು ಚಾಟ್‌ನಲ್ಲಿ ಬದಲಿಸುತ್ತೀರಿ, ಸೆಟ್ಟಿಂಗ್ಸ್ ಮೇಜ್‌ನಲ್ಲಿ ಅಲ್ಲ.',
      ],
      features: [
        { title: 'ನಿಮ್ಮ ಹಂತಗಳಿರುವ ಪೈಪ್‌ಲೈನ್', desc: 'Lead → Quoted → Won, ಅಥವಾ ನಿಮ್ಮ ಐದು-ಹಂತದ ವರ್ಷನ್ — ನೀವು ನಿಜವಾಗಿ ಹೇಗೆ ಮಾರಾಟ ಮಾಡುತ್ತೀರಿ ಎಂಬುದರಿಂದ ರಚಿಸಲಾದ ಕಾನ್ಬಾನ್ ಪೈಪ್‌ಲೈನ್.' },
        { title: 'ಕಾಂಟ್ಯಾಕ್ಟ್ ರೆಕಾರ್ಡ್‌ಗಳು, ನಿಮ್ಮ ಫೀಲ್ಡ್‌ಗಳು', desc: 'ಕಂಪನಿ, ಮೂಲ, ಬಜೆಟ್, ರಿನಿವಲ್ ದಿನಾಂಕ, ಗಾತ್ರಗಳು, ಅಲರ್ಜಿಗಳು — ನಿಮ್ಮ ಬಿಸಿನೆಸ್ ಟ್ರ್ಯಾಕ್ ಮಾಡುವ ಯಾವುದಾದರೂ, ಮೊದಲ ದಿನದಿಂದ ಸ್ಕೀಮಾದಲ್ಲಿ.' },
        { title: 'ಫಾಲೋ-ಅಪ್ ಇಂದಿನ ವ್ಯೂ', desc: 'ಯಾರ ಮುಂದಿನ-ಕ್ರಮ ದಿನಾಂಕ ಬಂದಿದೆಯೋ ಅಥವಾ ಯಾರ ಡೀಲ್‌ಗಳು ಮೌನವಾಗಿವೆಯೋ ಅಂತಹ ಕಾಂಟ್ಯಾಕ್ಟ್‌ಗಳ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ — ಸೋರಿಕೆ-ವಿರೋಧಿ ಸ್ಕ್ರೀನ್.' },
        { title: 'ನೋಟ್ಸ್ ಮತ್ತು ಆಕ್ಟಿವಿಟಿ ಟ್ರೈಲ್', desc: 'ಕರೆಗಳು, ಮೀಟಿಂಗ್‌ಗಳು, ಮತ್ತು ಇಮೇಲ್‌ಗಳು ಕಾಂಟ್ಯಾಕ್ಟ್ ವಿರುದ್ಧ ಲಾಗ್ ಆಗುತ್ತವೆ, ಆದ್ದರಿಂದ ತಂಡದಲ್ಲಿ ಯಾರಾದರೂ ಸಂಭಾಷಣೆಯ ಎಳೆಯನ್ನು ಮುಂದುವರಿಸಬಹುದು.' },
      ],
      promptExample: 'ಸಣ್ಣ ಡಿಸೈನ್ ಏಜೆನ್ಸಿಗೆ CRM ವೆಬ್ ಆ್ಯಪ್ ರಚಿಸಿ: New Lead, Discovery, Proposal Sent, Won, ಮತ್ತು Lost ಎಂಬ ಕಾನ್ಬಾನ್ ಹಂತಗಳಿರುವ Pipeline ಪೇಜ್, ಡೀಲ್‌ಗಳಿಗೆ ಒಂದು ಮೌಲ್ಯ, ಕಾಂಟ್ಯಾಕ್ಟ್, ಮತ್ತು ಮುಂದಿನ-ಕ್ರಮ ದಿನಾಂಕ; ಕಂಪನಿ, ಪಾತ್ರ, ಮೂಲ, ಮತ್ತು ನೋಟ್ಸ್‌ಗಳಿರುವ Contacts ಪೇಜ್; ಮತ್ತು ಮುಂದಿನ-ಕ್ರಮ ದಿನಾಂಕ ಇಂದು ಅಥವಾ ಮೀರಿದ ಡೀಲ್‌ಗಳನ್ನು ಪಟ್ಟಿ ಮಾಡುವ Today ಪೇಜ್. ತಂಡ ಲಾಗಿನ್ ಸೇರಿಸಿ.',
      faqs: [
        { q: 'ಇದು HubSpot ಉಚಿತ ಟಿಯರ್‌ಗಿಂತ ಹೇಗೆ ಉತ್ತಮ?', a: 'ಇದು ಉದ್ದೇಶಪೂರ್ವಕವಾಗಿ ಚಿಕ್ಕದು: ನಿಮ್ಮ ಫೀಲ್ಡ್‌ಗಳು ಮಾತ್ರ, ನಿಮ್ಮ ಹಂತಗಳು ಮಾತ್ರ, ಯಾವುದೇ ಅಪ್‌ಗ್ರೇಡ್-ಗೋಡೆ ಇಲ್ಲ — ಮತ್ತು ಒಂದು ಫೀಚರ್ ಮೀರಿದಾಗ ನೀವು ಪ್ಲಾನ್ ಬದಲಿಸುವ ಬದಲು ಚಾಟ್‌ನಲ್ಲಿ ಸೇರಿಸುತ್ತೀರಿ.' },
        { q: 'ನಾನು ನನ್ನ ಇರುವ ಕಾಂಟ್ಯಾಕ್ಟ್‌ಗಳನ್ನು ಇಂಪೋರ್ಟ್ ಮಾಡಬಹುದೇ?', a: 'ನಿಮ್ಮ ಪ್ರಾಂಪ್ಟ್‌ನಲ್ಲಿ ಅಥವಾ ನಂತರ CSV ಇಂಪೋರ್ಟ್ ಕೇಳಿ — ನಿಮ್ಮ ಸ್ಪ್ರೆಡ್‌ಶೀಟ್‌ನ ಕಾಲಮ್‌ಗಳನ್ನು ವಿವರಿಸಿ ಮತ್ತು ಅವು ಕಾಂಟ್ಯಾಕ್ಟ್ಸ್ ಟೇಬಲ್‌ಗೆ ಮ್ಯಾಪ್ ಆಗುತ್ತವೆ.' },
        { q: 'ಜನರೇಟ್ ಮಾಡಿದ ಆ್ಯಪ್‌ನಲ್ಲಿ ಕ್ಲೈಂಟ್ ಡೇಟಾ ಸುರಕ್ಷಿತವೇ?', a: 'ಆ್ಯಪ್ ಆಥೆಂಟಿಕೇಶನ್ ಮತ್ತು ರೋ-ಲೆವೆಲ್ ಸೆಕ್ಯುರಿಟಿಯೊಂದಿಗೆ ಬರುತ್ತದೆ, ಮತ್ತು ಪ್ರಕಟಿಸುವ ಮೊದಲು WyberAi ದಾಳಿಕೋರನಂತೆ ಲೈವ್ ಡೇಟಾಬೇಸ್ ಪರೀಕ್ಷಿಸುತ್ತದೆ — ಗಂಭೀರ ಸೋರಿಕೆಗಳು ಪಬ್ಲಿಷ್ ಗೇಟ್ ತಡೆಯುತ್ತವೆ.' },
        { q: 'ನನ್ನ ತಂಡ ಇದನ್ನು ಏಕಕಾಲದಲ್ಲಿ ಬಳಸಬಹುದೇ?', a: 'ಹೌದು — ಇದು Postgres ಮೇಲೆ ಚಲಿಸುವ ನಿಜವಾದ ಬಹು-ಬಳಕೆದಾರ ವೆಬ್ ಆ್ಯಪ್. ಎಲ್ಲರೂ ಲಾಗಿನ್ ಆಗುತ್ತಾರೆ, ಮತ್ತು ಬದಲಾವಣೆಗಳು ಇಡೀ ತಂಡಕ್ಕೆ ಕಾಣುತ್ತವೆ.' },
      ],
    },
    'inventory-management-app': {
      h1: 'AI ಮೂಲಕ ಇನ್ವೆಂಟರಿ ಮ್ಯಾನೇಜ್‌ಮೆಂಟ್ ಆ್ಯಪ್ ರಚಿಸಿ',
      metaTitle: 'AI ಮೂಲಕ ಇನ್ವೆಂಟರಿ ಮ್ಯಾನೇಜ್‌ಮೆಂಟ್ ಆ್ಯಪ್ ರಚಿಸಿ',
      metaDesc: 'ನಿಮ್ಮ ಅಂಗಡಿಗೆ ಸ್ಟಾಕ್ ಮಟ್ಟಗಳು, ಲೋ-ಸ್ಟಾಕ್ ಎಚ್ಚರಿಕೆಗಳು, ಮತ್ತು ಸಪ್ಲೈಯರ್ ರೀಆರ್ಡರ್ ಮಾಹಿತಿ — ಸರಳ ಇಂಗ್ಲಿಷ್‌ನಿಂದ ಜನರೇಟ್ ಆದ ಇನ್ವೆಂಟರಿ ಆ್ಯಪ್, ಪ್ರತಿ-SKU ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಶುಲ್ಕವಿಲ್ಲ.',
      tagline: 'ಶೆಲ್ಫ್‌ನಲ್ಲಿ ನಿಜವಾಗಿ ಏನಿದೆ ಎಂದು ತಿಳಿಯಿರಿ, ಮುಗಿಯುವ ಮೊದಲು ಎಚ್ಚರಿಕೆ ಪಡೆಯಿರಿ, ಮತ್ತು ಅದನ್ನು ಮಾರುವ ಸಪ್ಲೈಯರ್‌ನಿಂದ ರೀಆರ್ಡರ್ ಮಾಡಿ — ಒಂದೇ ಸ್ಕ್ರೀನ್, ನೋಟ್‌ಬುಕ್‌ಗಳ ರಾಶಿಯಲ್ಲ.',
      body: [
        'ಸಣ್ಣ ರಿಟೇಲರ್‌ಗಳು ಮತ್ತು ತಯಾರಕರು ಇನ್ವೆಂಟರಿಯನ್ನು ಐವತ್ತು ವರ್ಷಗಳ ಹಿಂದೆ ನಡೆಸಿದ ರೀತಿಯಲ್ಲೇ ನಡೆಸುತ್ತಾರೆ — ಕ್ಲಿಪ್‌ಬೋರ್ಡ್‌ನಲ್ಲಿ ಎಣಿಕೆ, ನೆನಪಿನಿಂದ ನಿರ್ಧರಿಸಿದ ರೀಆರ್ಡರ್, ಮತ್ತು ಕೊನೆಯ ಯೂನಿಟ್ ಯಾವಾಗ ಮಾರಾಟವಾಯಿತು ಎಂದು ತಿಳಿಯದೆ ಗ್ರಾಹಕ ಕೇಳಿದಾಗ ಪತ್ತೆಯಾಗುವ ಸ್ಟಾಕ್‌ಔಟ್. ಇದನ್ನು ಸರಿಪಡಿಸಲು ನಿರ್ಮಿಸಿದ ಇನ್ವೆಂಟರಿ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್‌ಗಳು ಪ್ರತಿ-SKU ಅಥವಾ ಪ್ರತಿ-ಸ್ಥಳಕ್ಕೆ ಬೆಲೆ ವಿಧಿಸುತ್ತವೆ, ಇದು ನೀವು ಸಾಧಿಸಲು ಬಯಸುವ ಬೆಳವಣಿಗೆಯನ್ನೇ ಶಿಕ್ಷಿಸುತ್ತದೆ.',
        'ನೀವು ಏನು ಸ್ಟಾಕ್ ಮಾಡುತ್ತೀರಿ ಮತ್ತು ಹೇಗೆ ಮಾರಾಟ ಮಾಡುತ್ತೀರಿ ಎಂದು ವಿವರಿಸಿ, ಮತ್ತು WyberAi ನಿಮ್ಮ ಅಂಗಡಿಯ ಸುತ್ತ ವ್ಯವಸ್ಥೆ ನಿರ್ಮಿಸುತ್ತದೆ: ಮಾರಾಟ ಮತ್ತು ಡೆಲಿವರಿ ಲಾಗ್ ಆಗುತ್ತಿದ್ದಂತೆ ಬದಲಾಗುವ ಪ್ರಮಾಣಗಳಿರುವ ಪ್ರಾಡಕ್ಟ್ ಪಟ್ಟಿ, ಮುಗಿಯುವ ಮೊದಲು ರೀಆರ್ಡರ್ ಅಗತ್ಯವಿರುವುದನ್ನು ಫ್ಲ್ಯಾಗ್ ಮಾಡುವ ಲೋ-ಸ್ಟಾಕ್ ವ್ಯೂ, ಮತ್ತು ಪ್ರತಿ ಐಟಂಗೆ ಜೋಡಿಸಿದ ಸಪ್ಲೈಯರ್ ವಿವರಗಳು ಇದರಿಂದ ರೀಆರ್ಡರ್ ಮಾಡುವುದು ಒಂದು ಲುಕ್‌ಅಪ್, ನೆನಪಿನ ಪರೀಕ್ಷೆ ಅಲ್ಲ. ಒಂದು ಸ್ಥಳವಿರಲಿ ಅಥವಾ ಮೂರು, ರಿಟೇಲ್ ಆಗಿರಲಿ ಅಥವಾ ಕಚ್ಚಾ ವಸ್ತುಗಳಾಗಿರಲಿ — ಆಕಾರ ನಿಮ್ಮ ವಿವರಣೆಯನ್ನು ಅನುಸರಿಸುತ್ತದೆ.',
      ],
      features: [
        { title: 'ಲೈವ್ ಸ್ಟಾಕ್ ಮಟ್ಟಗಳು', desc: 'ಮಾರಾಟ ಮತ್ತು ಡೆಲಿವರಿ ಲಾಗ್ ಆಗುತ್ತಿದ್ದಂತೆ ಅಪ್‌ಡೇಟ್ ಆಗುವ ಪ್ರಮಾಣವಿರುವ ಪ್ರತಿ ಪ್ರಾಡಕ್ಟ್ — ಇನ್ನು ವಾರಾಂತ್ಯದ ಮರು-ಎಣಿಕೆ ಇಲ್ಲ.' },
        { title: 'ಲೋ-ಸ್ಟಾಕ್ ಎಚ್ಚರಿಕೆಗಳು', desc: 'ಪ್ರತಿ ಪ್ರಾಡಕ್ಟ್‌ಗೆ ರೀಆರ್ಡರ್ ಮಿತಿ ಸೆಟ್ ಮಾಡಿ; ಅದಕ್ಕಿಂತ ಕಡಿಮೆಯಾದದ್ದು ಸ್ಟಾಕ್‌ಔಟ್ ಆಗುವ ಮೊದಲೇ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ನಲ್ಲಿ ಕಾಣಿಸುತ್ತದೆ.' },
        { title: 'ಪ್ರತಿ ಐಟಂಗೆ ಸಪ್ಲೈಯರ್ ಮಾಹಿತಿ', desc: 'ಸಪ್ಲೈಯರ್ ಹೆಸರು, ಕಾಂಟ್ಯಾಕ್ಟ್, ಮತ್ತು ಕಾಸ್ಟ್ ಬೆಲೆ ಪ್ರತಿ ಪ್ರಾಡಕ್ಟ್‌ಗೆ ಜೋಡಿಸಲಾಗಿದೆ — ರೀಆರ್ಡರ್ ಮಾಡುವುದು ಲುಕ್‌ಅಪ್‌ನಿಂದ ಪ್ರಾರಂಭವಾಗುತ್ತದೆ, ಇಮೇಲ್‌ನಲ್ಲಿ ಹುಡುಕಾಟದಿಂದಲ್ಲ.' },
        { title: 'ಬಹು-ಸ್ಥಳ ಬೆಂಬಲ', desc: 'ಪ್ರತಿ ಅಂಗಡಿ ಅಥವಾ ಗೋದಾಮಿನ ಸ್ಟಾಕ್ ಪ್ರತ್ಯೇಕವಾಗಿ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ, ಅಥವಾ ಒಂದೇ ಒಟ್ಟಾರೆಗೆ ಸೇರಿಸಿ — ನಿಮ್ಮ ಬಿಸಿನೆಸ್ ನಿಜವಾಗಿ ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ ಎಂಬಂತೆ ವಿವರಿಸಲಾಗಿದೆ.' },
      ],
      promptExample: 'ಇನ್ವೆಂಟರಿ ಮ್ಯಾನೇಜ್‌ಮೆಂಟ್ ವೆಬ್ ಆ್ಯಪ್ ರಚಿಸಿ: SKU, ಕೈಯಲ್ಲಿರುವ ಪ್ರಮಾಣ, ರೀಆರ್ಡರ್ ಮಿತಿ, ಕಾಸ್ಟ್ ಬೆಲೆ, ಮತ್ತು ಸಪ್ಲೈಯರ್ ಹೆಸರಿರುವ ಐಟಂಗಳ ಪಟ್ಟಿಯಿರುವ Products ಪೇಜ್; ರೀಆರ್ಡರ್ ಮಿತಿಗಿಂತ ಕೆಳಗಿರುವ ಪ್ರಾಡಕ್ಟ್‌ಗಳನ್ನು ಹೈಲೈಟ್ ಮಾಡುವ Dashboard; ಮಾರಾಟ ಮತ್ತು ಬರುವ ಡೆಲಿವರಿಗಳನ್ನು ಲಾಗ್ ಮಾಡುವ, ಪ್ರಮಾಣಗಳನ್ನು ಸರಿಹೊಂದಿಸುವ Stock Movement ಪೇಜ್; ಮತ್ತು ಅವರು ಸರಬರಾಜು ಮಾಡುವ ಪ್ರಾಡಕ್ಟ್‌ಗಳಿಗೆ ಲಿಂಕ್ ಆದ ಕಾಂಟ್ಯಾಕ್ಟ್ ವಿವರಗಳಿರುವ Suppliers ಪೇಜ್.',
      faqs: [
        { q: 'ಇದು ಬಾರ್‌ಕೋಡ್‌ಗಳನ್ನು ನಿಭಾಯಿಸಬಹುದೇ?', a: 'ನಿಮ್ಮ ಪ್ರಾಂಪ್ಟ್‌ನಲ್ಲಿ ಪ್ರತಿ ಪ್ರಾಡಕ್ಟ್‌ಗೆ ಬಾರ್‌ಕೋಡ್ ಫೀಲ್ಡ್ ಸೇರಿಸಿ; ಲೈವ್ ಆದ ನಂತರ ಫೋನ್ ಕ್ಯಾಮೆರಾ ಸ್ಕ್ಯಾನರ್‌ನೊಂದಿಗೆ ಜೋಡಿಸುವುದು ಚಾಟ್‌ನಲ್ಲಿ ಒಂದು ಎಡಿಟ್.' },
        { q: 'ನಾನು ಒಂದಕ್ಕಿಂತ ಹೆಚ್ಚು ಅಂಗಡಿಗಳಲ್ಲಿ ಸ್ಟಾಕ್ ಟ್ರ್ಯಾಕ್ ಮಾಡಬಹುದೇ?', a: 'ಹೌದು — ನಿಮ್ಮ ಸ್ಥಳಗಳನ್ನು ವಿವರಿಸಿ ಮತ್ತು ಪ್ರಮಾಣಗಳನ್ನು ಪ್ರತಿ ಸ್ಥಳಕ್ಕೆ ಟ್ರ್ಯಾಕ್ ಮಾಡಬಹುದು, ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ನಲ್ಲಿ ಒಟ್ಟು ವ್ಯೂ ಜೊತೆಗೆ.' },
        { q: 'ಇದು ಖರೀದಿ ಆದೇಶಗಳನ್ನು ರಚಿಸುತ್ತದೆಯೇ?', a: 'ಖರೀದಿ-ಆದೇಶ ಪೇಜ್ ಕೇಳಿ ಮತ್ತು ಲೋ-ಸ್ಟಾಕ್ ಐಟಂಗಳನ್ನು ಒಂದೇ ಕ್ಲಿಕ್‌ನಲ್ಲಿ ಅವರ ಸಪ್ಲೈಯರ್‌ಗೆ ವಿಳಾಸಿಸಿದ PO ಆಗಿ ಬದಲಿಸಬಹುದು.' },
        { q: 'ಇದು ಇನ್ವೆಂಟರಿ SaaS ಗಿಂತ ಅಗ್ಗವೇ?', a: 'ನೀವು ಇದನ್ನು ಉಚಿತ ಮಾಸಿಕ ಕ್ರೆಡಿಟ್‌ಗಳಿಂದ ಒಮ್ಮೆ ನಿರ್ಮಿಸುತ್ತೀರಿ ಮತ್ತು ಇದು ನಿಮ್ಮದಾಗುತ್ತದೆ — ನಿಮ್ಮ ಕ್ಯಾಟಲಾಗ್ ಬೆಳೆದಂತೆ ಪ್ರತಿ-SKU ಅಥವಾ ಪ್ರತಿ-ಸ್ಥಳ ಮಾಸಿಕ ಶುಲ್ಕವಿಲ್ಲ.' },
      ],
    },
    'rental-property-manager': {
      h1: 'AI ಮೂಲಕ ರೆಂಟಲ್ ಪ್ರಾಪರ್ಟಿ ಮ್ಯಾನೇಜರ್ ರಚಿಸಿ',
      metaTitle: 'AI ಮೂಲಕ ರೆಂಟಲ್ ಪ್ರಾಪರ್ಟಿ ಮ್ಯಾನೇಜ್‌ಮೆಂಟ್ ಆ್ಯಪ್ ರಚಿಸಿ',
      metaDesc: 'ನಿಮ್ಮ ರೆಂಟಲ್‌ಗಳಿಗೆ ಯೂನಿಟ್‌ಗಳು, ಬಾಡಿಗೆದಾರರು, ಬಾಡಿಗೆ ಟ್ರ್ಯಾಕಿಂಗ್, ಮತ್ತು ನಿರ್ವಹಣಾ ವಿನಂತಿಗಳು — ಸರಳ ಇಂಗ್ಲಿಷ್‌ನಿಂದ ಜನರೇಟ್ ಆದ ಪ್ರಾಪರ್ಟಿ ಮ್ಯಾನೇಜರ್ ಆ್ಯಪ್, ಪ್ರತಿ-ಯೂನಿಟ್ ಶುಲ್ಕವಿಲ್ಲ.',
      tagline: 'ಪ್ರತಿ ಯೂನಿಟ್, ಅದರಲ್ಲಿ ಯಾರಿದ್ದಾರೆ, ಈ ತಿಂಗಳ ಬಾಡಿಗೆ ಬಂತೇ, ಮತ್ತು ಏನು ಹಾಳಾಗಿದೆ — ಒಂದೇ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ನಲ್ಲಿ ಮಾಲೀಕರ ಇಡೀ ಕಾರ್ಯಾಚರಣೆ.',
      body: [
        'ಕೆಲವು ಯೂನಿಟ್‌ಗಳಿರುವ ಮಾಲೀಕರು ಬ್ಯಾಂಕ್ ಸ್ಟೇಟ್‌ಮೆಂಟ್‌ಗಳು, ಸೋರುತ್ತಿರುವ ನಲ್ಲಿ ಬಗ್ಗೆ ಟೆಕ್ಸ್ಟ್ ಮೆಸೇಜ್‌ಗಳು, ಮತ್ತು ಯಾರು ಪಾವತಿಸಿದ್ದಾರೆ ಯಾರು ವಾರ ತಡವಾಗಿದ್ದಾರೆ ಎಂಬ ನೆನಪಿನ ಮಿಶ್ರಣದಿಂದ ವ್ಯವಹಾರ ನಡೆಸುತ್ತಾರೆ. ಪ್ರಾಪರ್ಟಿ ಮ್ಯಾನೇಜ್‌ಮೆಂಟ್ ಸಾಫ್ಟ್‌ವೇರ್ ಇದೆ, ಆದರೆ ಅದು ನೂರಾರು ಯೂನಿಟ್‌ಗಳ ಪೋರ್ಟ್‌ಫೋಲಿಯೊಗಳಿಗಾಗಿ ಬೆಲೆ ಮತ್ತು ನಿರ್ಮಿಸಲಾಗಿದೆ, ನಿಮ್ಮಲ್ಲಿ ನಿಜವಾಗಿರುವ ನಾಲ್ಕು ಡುಪ್ಲೆಕ್ಸ್‌ಗಳಿಗಲ್ಲ.',
        'ನಿಮ್ಮ ಪ್ರಾಪರ್ಟಿಗಳನ್ನು ಮತ್ತು ನೀವು ಅವುಗಳನ್ನು ಹೇಗೆ ನಿರ್ವಹಿಸುತ್ತೀರಿ ಎಂದು ವಿವರಿಸಿ, ಮತ್ತು WyberAi ಈ ಕಾರ್ಯಾಚರಣೆಯನ್ನು ಒಂದು ಆ್ಯಪ್ ಆಗಿ ನಿರ್ಮಿಸುತ್ತದೆ: ಯೂನಿಟ್‌ಗಳು ಮತ್ತು ಬಾಡಿಗೆದಾರರ ಪಟ್ಟಿ, ಈ ಚಕ್ರದಲ್ಲಿ ಯಾರು ಪಾವತಿಸಿದ್ದಾರೆ ಯಾರು ಇಲ್ಲ ಎಂದು ತೋರಿಸುವ ಬಾಡಿಗೆ ಲೆಡ್ಜರ್, ಮತ್ತು ವರದಿ ಮಾಡಿದ ಸಮಸ್ಯೆ ನೀವು ಮರೆಯುವವರೆಗೆ ಟೆಕ್ಸ್ಟ್ ಥ್ರೆಡ್‌ನಲ್ಲಿ ಉಳಿಯದಂತೆ ನಿರ್ವಹಣಾ ಬೋರ್ಡ್. ಲೀಸ್ ರಿನಿವಲ್ ದಿನಾಂಕಗಳು ನಿಮ್ಮ ಮೇಲೆ ಎರಗುವ ಮೊದಲೇ ಕಾಣಿಸುತ್ತವೆ, ನಂತರ ಅಲ್ಲ.',
      ],
      features: [
        { title: 'ಯೂನಿಟ್‌ಗಳು ಮತ್ತು ಬಾಡಿಗೆದಾರರು', desc: 'ಪ್ರಸ್ತುತ ಬಾಡಿಗೆದಾರ, ಲೀಸ್ ಪ್ರಾರಂಭ ಮತ್ತು ಅಂತ್ಯ ದಿನಾಂಕಗಳು, ಮತ್ತು ಮಾಸಿಕ ಬಾಡಿಗೆಯೊಂದಿಗೆ ಪ್ರತಿ ಪ್ರಾಪರ್ಟಿ ಮತ್ತು ಯೂನಿಟ್.' },
        { title: 'ಬಾಡಿಗೆ ಪಾವತಿ ಲಾಗ್', desc: 'ಪ್ರತಿ ಯೂನಿಟ್‌ಗೆ ಪ್ರತಿ ತಿಂಗಳ ಬಾಡಿಗೆ ಸ್ವೀಕರಿಸಿದ್ದನ್ನು ಮಾರ್ಕ್ ಮಾಡಿ; ಒಂದೇ ನೋಟದಲ್ಲಿ ಯಾರು ಕರೆಂಟ್ ಮತ್ತು ಯಾರು ಬಾಕಿ ಎಂದು ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ತೋರಿಸುತ್ತದೆ.' },
        { title: 'ನಿರ್ವಹಣಾ ವಿನಂತಿ ಬೋರ್ಡ್', desc: 'ಬಾಡಿಗೆದಾರರು (ಅಥವಾ ನೀವು) ಸ್ಥಿತಿಯೊಂದಿಗೆ ಸಮಸ್ಯೆಗಳನ್ನು ಲಾಗ್ ಮಾಡುತ್ತಾರೆ — ವರದಿಯಾಗಿದೆ, ಪ್ರಗತಿಯಲ್ಲಿದೆ, ಸರಿಪಡಿಸಲಾಗಿದೆ — ಆದ್ದರಿಂದ ಏನೂ ಟೆಕ್ಸ್ಟ್ ಥ್ರೆಡ್‌ನಲ್ಲಿ ಕಳೆದುಹೋಗುವುದಿಲ್ಲ.' },
        { title: 'ಲೀಸ್ ಅವಧಿ ಮುಗಿಯುವ ಜ್ಞಾಪನೆಗಳು', desc: 'ಅಂತಿಮ ದಿನಾಂಕ ಸಮೀಪಿಸುತ್ತಿರುವ ಲೀಸ್‌ಗಳು ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ನಲ್ಲಿ ಕಾಣಿಸುತ್ತವೆ, ರಿನಿವ್ ಮಾಡಲು ಅಥವಾ ಯೂನಿಟ್ ಅನ್ನು ಮತ್ತೆ ಲಿಸ್ಟ್ ಮಾಡಲು ನಿಮಗೆ ಸಮಯ ನೀಡುತ್ತದೆ.' },
      ],
      promptExample: 'ರೆಂಟಲ್ ಪ್ರಾಪರ್ಟಿ ಮ್ಯಾನೇಜ್‌ಮೆಂಟ್ ವೆಬ್ ಆ್ಯಪ್ ರಚಿಸಿ: ಬಾಡಿಗೆದಾರರ ಹೆಸರು, ಲೀಸ್ ಪ್ರಾರಂಭ/ಅಂತ್ಯ ದಿನಾಂಕ, ಮತ್ತು ಮಾಸಿಕ ಬಾಡಿಗೆಯಿರುವ ಯೂನಿಟ್‌ಗಳ ಪಟ್ಟಿಯಿರುವ Properties ಪೇಜ್; ಪ್ರತಿ ಯೂನಿಟ್‌ಗೆ ಪ್ರತಿ ತಿಂಗಳ ಸ್ವೀಕರಿಸಿದ ಪಾವತಿಗಳನ್ನು ಬಾಕಿ ಸೂಚಕದೊಂದಿಗೆ ಮಾರ್ಕ್ ಮಾಡುವ Rent Ledger ಪೇಜ್; ಪ್ರತಿ ಯೂನಿಟ್‌ಗೆ ಸ್ಥಿತಿಯೊಂದಿಗೆ (ವರದಿಯಾಗಿದೆ, ಪ್ರಗತಿಯಲ್ಲಿದೆ, ಸರಿಪಡಿಸಲಾಗಿದೆ) ಸಮಸ್ಯೆಗಳನ್ನು ಲಾಗ್ ಮಾಡುವ Maintenance ಪೇಜ್; ಮತ್ತು ಮುಂದಿನ 60 ದಿನಗಳಲ್ಲಿ ಮುಗಿಯುವ ಲೀಸ್‌ಗಳನ್ನು ಹೈಲೈಟ್ ಮಾಡುವ Dashboard.',
      faqs: [
        { q: 'ಬಾಡಿಗೆದಾರರು ಸ್ವತಃ ನಿರ್ವಹಣಾ ವಿನಂತಿಗಳನ್ನು ಸಲ್ಲಿಸಬಹುದೇ?', a: 'ಹೌದು — ಬಾಡಿಗೆದಾರ ಲಾಗಿನ್ ಮತ್ತು ವಿನಂತಿ ಫಾರ್ಮ್ ಸೇರಿಸಿ, ಮತ್ತು ಅವರು ಸಲ್ಲಿಸುವ ಸಮಸ್ಯೆಗಳು ನೇರವಾಗಿ ನಿಮ್ಮ ನಿರ್ವಹಣಾ ಬೋರ್ಡ್‌ಗೆ ಬರುತ್ತವೆ.' },
        { q: 'ಇದು ತಡ ಶುಲ್ಕಗಳನ್ನು ಲೆಕ್ಕಹಾಕಬಹುದೇ?', a: 'ನಿಮ್ಮ ಪ್ರಾಂಪ್ಟ್‌ನಲ್ಲಿ ನಿಮ್ಮ ತಡ-ಶುಲ್ಕ ನಿಯಮ ವಿವರಿಸಿ ಮತ್ತು ಪಾವತಿ ಅದರ ಬಾಕಿ ದಿನಾಂಕ ದಾಟಿದ ನಂತರ ಬಾಡಿಗೆ ಲೆಡ್ಜರ್ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಅನ್ವಯಿಸಬಹುದು.' },
        { q: 'ಇದು ಒಂದಕ್ಕಿಂತ ಹೆಚ್ಚು ಪ್ರಾಪರ್ಟಿಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆಯೇ?', a: 'ಹೌದು — ರಚನೆ ಒಂದು ಡುಪ್ಲೆಕ್ಸ್‌ನಿಂದ ಪೋರ್ಟ್‌ಫೋಲಿಯೊವರೆಗೆ ಸ್ಕೇಲ್ ಆಗುತ್ತದೆ; ಪ್ರತಿ ಪ್ರಾಪರ್ಟಿಗೆ ತನ್ನದೇ ಯೂನಿಟ್‌ಗಳು, ಬಾಡಿಗೆದಾರರು, ಮತ್ತು ಲೆಡ್ಜರ್ ಇರುತ್ತದೆ.' },
        { q: 'ಬಾಡಿಗೆದಾರರ ಡೇಟಾ ಸುರಕ್ಷಿತವೇ?', a: 'ಆ್ಯಪ್ ತನ್ನದೇ ಡೇಟಾಬೇಸ್‌ನಲ್ಲಿ ರೋ-ಲೆವೆಲ್ ಸೆಕ್ಯುರಿಟಿಯೊಂದಿಗೆ ಚಲಿಸುತ್ತದೆ, ಪ್ರಕಟಿಸುವ ಮೊದಲು ಲೈವ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಲಾಗುತ್ತದೆ — ಬಾಡಿಗೆದಾರರ ವಿವರಗಳು ಸಾರ್ವಜನಿಕವಾಗಿ ಬಹಿರಂಗವಾಗುವುದಿಲ್ಲ.' },
      ],
    },
    'ecommerce-seller-dashboard': {
      h1: 'AI ಮೂಲಕ ಇಕಾಮರ್ಸ್ ಸೆಲ್ಲರ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ರಚಿಸಿ',
      metaTitle: 'AI ಮೂಲಕ ಇಕಾಮರ್ಸ್ ಸೆಲ್ಲರ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ರಚಿಸಿ — ಕೋಡ್ ಇಲ್ಲದೆ',
      metaDesc: 'Amazon, Shopify, ಮತ್ತು Etsy ಯಲ್ಲಿ ಆರ್ಡರ್‌ಗಳು, ಮಾರ್ಜಿನ್, ಮತ್ತು ಸ್ಟಾಕ್ ಒಂದೇ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ನಲ್ಲಿ — ಸರಳ ಇಂಗ್ಲಿಷ್‌ನಿಂದ ಜನರೇಟ್, ಪ್ರತಿ-ಚಾನೆಲ್ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಶುಲ್ಕವಿಲ್ಲ.',
      tagline: 'ನೀವು ಮಾರಾಟ ಮಾಡುವ ಪ್ರತಿ ಚಾನೆಲ್‌ಗೆ ಒಂದೇ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ — ಪ್ರತಿ ಆರ್ಡರ್‌ನ ನಿಜವಾದ ಮಾರ್ಜಿನ್, ಸುಳ್ಳು ಹೇಳದ ಸ್ಟಾಕ್, ಮತ್ತು ಮಾರ್ಕೆಟ್‌ಪ್ಲೇಸ್ ಸೇರಿಸಿದಾಗಲೆಲ್ಲ ಹೊಸ ಸಬ್‌ಸ್ಕ್ರಿಪ್ಷನ್ ಇಲ್ಲ.',
      body: [
        'ಒಂದಕ್ಕಿಂತ ಹೆಚ್ಚು ಚಾನೆಲ್‌ಗಳಲ್ಲಿ ಮಾರಾಟ ಮಾಡಿ — Amazon, Shopify, Etsy, ನಿಮ್ಮ ಸ್ವಂತ ಸ್ಟೋರ್‌ಫ್ರಂಟ್ — ಮತ್ತು ನಿಮಗೆ ಪ್ರತಿಯೊಂದಕ್ಕೂ ಬೇರೆ ಲಾಗಿನ್, ಬೇರೆ ರಿಪೋರ್ಟ್ ಫಾರ್ಮ್ಯಾಟ್, ಮತ್ತು "ಲಾಭ" ದ ಬೇರೆ ವ್ಯಾಖ್ಯಾನ ಸಿಗುತ್ತದೆ. ತಿಂಗಳ ಕೊನೆಯಲ್ಲಿ ಇವುಗಳನ್ನು ಒಂದೇ ಚಿತ್ರಕ್ಕೆ ಜೋಡಿಸುವುದೆಂದರೆ ಸಾಮಾನ್ಯವಾಗಿ ಮೂರು ಕಡೆಯಿಂದ ಸ್ಪ್ರೆಡ್‌ಶೀಟ್‌ಗಳನ್ನು ಎಕ್ಸ್‌ಪೋರ್ಟ್ ಮಾಡಿ ಕೆಟಗರಿಗಳು ಹೊಂದಿಕೊಳ್ಳುತ್ತವೆ ಎಂದು ಆಶಿಸುವುದು.',
        'ನೀವು ನಿಜವಾಗಿ ಹೇಗೆ ಮಾರಾಟ ಮಾಡುತ್ತೀರಿ ಎಂದು ವಿವರಿಸಿ — ಯಾವ ಚಾನೆಲ್‌ಗಳು, ಪ್ರತಿಯೊಂದೂ ಎಷ್ಟು ಶುಲ್ಕ ತೆಗೆದುಕೊಳ್ಳುತ್ತದೆ, ಪ್ರತಿ ಆರ್ಡರ್‌ಗೆ ಮಾರ್ಜಿನ್ ಬಗ್ಗೆ ನೀವು ಹೇಗೆ ಯೋಚಿಸುತ್ತೀರಿ — ಮತ್ತು WyberAi ಅದರ ಸುತ್ತ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ನಿರ್ಮಿಸುತ್ತದೆ: ಯಾವುದೇ ಚಾನೆಲ್‌ನಿಂದ ಆರ್ಡರ್‌ಗಳನ್ನು ಲಾಗ್ ಮಾಡಲು ಒಂದೇ ಸ್ಥಳ, ಮಾರಾಟ ನಡೆದ ಸ್ಥಳಕ್ಕೆ ನಿರ್ದಿಷ್ಟವಾದ ಶುಲ್ಕ ಮತ್ತು ವೆಚ್ಚಗಳನ್ನು ಕಳೆಯುವ ಮಾರ್ಜಿನ್ ವ್ಯೂ, ಮತ್ತು ನೀವು ಒಂದೇ ಕಡೆ ಮಾರಾಟ ಮಾಡುತ್ತೀರಿ ಎಂದು ಊಹಿಸದ ಸ್ಟಾಕ್ ಚಿತ್ರ. ನಂತರ ಚಾನೆಲ್ ಸೇರಿಸುವುದು ಒಂದು ಪ್ರಾಂಪ್ಟ್ ದೂರ, ಹೊಸ ಸಬ್‌ಸ್ಕ್ರಿಪ್ಷನ್ ಅಲ್ಲ.',
      ],
      features: [
        { title: 'ಒಂದು ಫೀಡ್, ಪ್ರತಿ ಚಾನೆಲ್', desc: 'ಪೂರ್ಣ ಚಿತ್ರಕ್ಕಾಗಿ ಟ್ಯಾಬ್‌ಗಳನ್ನು ಬದಲಿಸುವ ಬದಲು Amazon, Shopify, Etsy, ಅಥವಾ ನಿಮ್ಮ ಸ್ವಂತ ಸ್ಟೋರ್‌ನಿಂದ ಆರ್ಡರ್‌ಗಳನ್ನು ಒಂದೇ ಕಡೆ ಲಾಗ್ ಮಾಡಿ.' },
        { title: 'ಪ್ರತಿ ಆರ್ಡರ್‌ಗೆ ನಿಜವಾದ ಮಾರ್ಜಿನ್', desc: 'ಪ್ರತಿ ಚಾನೆಲ್‌ನ ಶುಲ್ಕ ಶೇಕಡಾ ಮತ್ತು ನಿಮ್ಮ ಕಾಸ್ಟ್ ಬೆಲೆ ಜೋಡಿಸಿ, ಮತ್ತು ಮಾರ್ಜಿನ್ ಪ್ರತಿ ಆರ್ಡರ್‌ಗೆ ಲೆಕ್ಕ ಹಾಕಲಾಗುತ್ತದೆ — ಮಿಶ್ರ ಸರಾಸರಿಯಿಂದ ಊಹಿಸುವುದಿಲ್ಲ.' },
        { title: 'ಚಾನೆಲ್‌ಗಳಾದ್ಯಂತ ಸ್ಟಾಕ್', desc: 'ಒಂದು ಪ್ರಾಡಕ್ಟ್ ಮೂರು ಕಡೆ ಮಾರಾಟವಾದರೂ ಅದಕ್ಕೆ ಕೈಯಲ್ಲಿ ಒಂದೇ ಪ್ರಮಾಣ ಇರುತ್ತದೆ, ಆದ್ದರಿಂದ ಇನ್ನೊಂದು ಚಾನೆಲ್ ಈಗಾಗಲೇ ಮಾರಿದ್ದನ್ನು ನೀವು ಹೆಚ್ಚು ಮಾರುವುದಿಲ್ಲ.' },
        { title: 'ನಿಮ್ಮ ಕ್ಯಾಟಲಾಗ್‌ನೊಂದಿಗೆ ಬೆಳೆಯುತ್ತದೆ, ಅದರ ವಿರುದ್ಧವಲ್ಲ', desc: 'ಸ್ಕೇಲ್ ಮಾಡಿದಂತೆ ಏರುವ ಪ್ರತಿ-ಆರ್ಡರ್ ಅಥವಾ ಪ್ರತಿ-ಚಾನೆಲ್ ಶುಲ್ಕವಿಲ್ಲ — ನೀವು ಇದನ್ನು ಉಚಿತ ಕ್ರೆಡಿಟ್‌ಗಳಿಂದ ಒಮ್ಮೆ ನಿರ್ಮಿಸುತ್ತೀರಿ ಮತ್ತು ಇದು ನಿಮ್ಮದಾಗುತ್ತದೆ.' },
      ],
      promptExample: 'ಇಕಾಮರ್ಸ್ ಸೆಲ್ಲರ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ವೆಬ್ ಆ್ಯಪ್ ರಚಿಸಿ: ಪ್ರತಿ ಮಾರಾಟವನ್ನು ಅದು ಬಂದ ಚಾನೆಲ್ (Amazon, Shopify, Etsy, ಅಥವಾ ಕಸ್ಟಮ್), ಮಾರಾಟ ಬೆಲೆ, ಚಾನೆಲ್ ಶುಲ್ಕ, ಮತ್ತು ಕಾಸ್ಟ್ ಬೆಲೆಯೊಂದಿಗೆ ಲಾಗ್ ಮಾಡುವ Orders ಪೇಜ್; ಒಟ್ಟು ಆದಾಯ, ಶುಲ್ಕಗಳು, ಮತ್ತು ನಿವ್ವಳ ಮಾರ್ಜಿನ್ ಅನ್ನು ಚಾನೆಲ್ ಮತ್ತು ತಿಂಗಳಿನ ಪ್ರಕಾರ ವಿಭಜಿಸಿ ತೋರಿಸುವ Dashboard ಪೇಜ್; ಎಲ್ಲಾ ಚಾನೆಲ್‌ಗಳಾದ್ಯಂತ ಹಂಚಿದ ಸ್ಟಾಕ್ ಪ್ರಮಾಣವನ್ನು ಲೋ-ಸ್ಟಾಕ್ ಸೂಚಕದೊಂದಿಗೆ ಟ್ರ್ಯಾಕ್ ಮಾಡುವ Products ಪೇಜ್; ಮತ್ತು ನೀವು ಮಾರಾಟ ಮಾಡುವ ಪ್ರತಿ ಸ್ಥಳಕ್ಕೆ ಶುಲ್ಕ ಶೇಕಡಾ ಸೇರಿಸಲು ಅಥವಾ ಎಡಿಟ್ ಮಾಡಲು Channels ಪೇಜ್.',
      faqs: [
        { q: 'ಇದು ನೇರವಾಗಿ ನನ್ನ Amazon ಅಥವಾ Shopify ಖಾತೆಗೆ ಸಂಪರ್ಕಗೊಳ್ಳುತ್ತದೆಯೇ?', a: 'ಮೊದಲಿಗೆ ಅಲ್ಲ — ಇದು describe-your-numbers ಡ್ಯಾಶ್‌ಬೋರ್ಡ್, ಆದ್ದರಿಂದ ನೀವೇ ಆರ್ಡರ್‌ಗಳನ್ನು ಲಾಗ್ ಅಥವಾ ಪೇಸ್ಟ್ ಮಾಡುತ್ತೀರಿ. ಇದು ಬದಲಾಗಬಹುದಾದ ಅಥವಾ ರದ್ದಾಗಬಹುದಾದ ಮಾರ್ಕೆಟ್‌ಪ್ಲೇಸ್ API ಅವಲಂಬನೆಯನ್ನು ತಪ್ಪಿಸುತ್ತದೆ; ನಿಮ್ಮ ಪ್ರಾಂಪ್ಟ್‌ನಲ್ಲಿ ಬಲ್ಕ್-ಪೇಸ್ಟ್ ಅಥವಾ CSV-ಇಂಪೋರ್ಟ್ ಸ್ಕ್ರೀನ್ ಕೇಳಿ ಮತ್ತು ಅದನ್ನು ಸೇರಿಸಬಹುದು.' },
        { q: 'ಇದು ಮೂರಕ್ಕಿಂತ ಹೆಚ್ಚು ಚಾನೆಲ್‌ಗಳನ್ನು ನಿಭಾಯಿಸಬಹುದೇ?', a: 'ಹೌದು — Channels ಪೇಜ್ ನೀವು ವಿವರಿಸಿದಷ್ಟು ಚಾನೆಲ್‌ಗಳನ್ನು ಹೊಂದಿರುತ್ತದೆ, ಪ್ರತಿಯೊಂದಕ್ಕೂ ತನ್ನದೇ ಶುಲ್ಕ ಶೇಕಡಾದೊಂದಿಗೆ, ಮತ್ತು ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಎಲ್ಲವನ್ನೂ ಒಂದೇ ಮಾರ್ಜಿನ್ ವ್ಯೂಗೆ ಸೇರಿಸುತ್ತದೆ.' },
        { q: 'ನನಗೆ ನನ್ನ ಸ್ವಂತ ವೆಬ್‌ಸೈಟ್ ಅಥವಾ ಹೋಸ್ಟಿಂಗ್ ಬೇಕೇ?', a: 'ಇಲ್ಲ — ಪ್ರಕಟಿಸಿ ಮತ್ತು ಇದು ತಕ್ಷಣ ಉಚಿತ wyberai.app ಸಬ್‌ಡೊಮೇನ್‌ನಲ್ಲಿ ಲೈವ್ ಆಗುತ್ತದೆ; ಬಯಸಿದರೆ ನಂತರ ನಿಮ್ಮ ಸ್ವಂತ ಡೊಮೇನ್ ಸಂಪರ್ಕಿಸಿ.' },
        { q: 'ಇದು ಬಹು-ಚಾನೆಲ್ ಸೆಲ್ಲರ್ ಟೂಲ್‌ಗಿಂತ ಅಗ್ಗವೇ?', a: 'ನೀವು ಇದನ್ನು ಉಚಿತ ಮಾಸಿಕ ಕ್ರೆಡಿಟ್‌ಗಳಿಂದ ಒಮ್ಮೆ ನಿರ್ಮಿಸಿ ಸಂಪೂರ್ಣ ಮಾಲೀಕರಾಗುತ್ತೀರಿ — ನಿಮ್ಮ ಮಾರಾಟ ಬೆಳೆದಂತೆ ಏರುವ ಪ್ರತಿ-ಆರ್ಡರ್ ಅಥವಾ ಪ್ರತಿ-ಚಾನೆಲ್ ಶುಲ್ಕವಿಲ್ಲ.' },
      ],
    },
  },
  te: {
    'salon-booking-app': {
      h1: 'AIతో సెలూన్ బుకింగ్ యాప్ నిర్మించండి',
      metaTitle: 'AIతో సెలూన్ బుకింగ్ యాప్ నిర్మించండి — కోడ్ లేకుండా',
      metaDesc: 'ఫోన్-ట్యాగ్ అపాయింట్‌మెంట్‌లను ఆన్‌లైన్ బుకింగ్‌లుగా మార్చండి: సర్వీసులు, స్టైలిస్ట్ క్యాలెండర్‌లు, మరియు క్లయింట్ హిస్టరీ — సాదా ఇంగ్లీష్ వివరణ నుండి నిర్మించబడింది, కోడ్ లేకుండా.',
      tagline: 'క్లయింట్లు ఒక సర్వీస్, ఒక స్టైలిస్ట్, మరియు ఒక స్లాట్ ఎంచుకుంటారు. మీరు ఒక్క చూపులో రోజు షెడ్యూల్ చూస్తారు. ఇక DM మరియు ఫోన్-ట్యాగ్ బుకింగ్ అవసరం లేదు.',
      body: [
        'చాలా సెలూన్‌లకు బుకింగ్ వ్యవస్థ ఒక ఫోన్, ఒక Instagram DM ఇన్‌బాక్స్, మరియు ఒక పేపర్ డైరీ — ఇది డబుల్-బుకింగ్ ఒక రెగ్యులర్ క్లయింట్‌ను కోల్పోయే వరకు, లేదా "మీరు గురువారం ఫ్రీ ఉన్నారా?" వంటి మెసేజీలలో ఒక గంట కరిగిపోయే వరకు పని చేస్తుంది. దీన్ని పరిష్కరించే బుకింగ్ ప్లాట్‌ఫారమ్‌లు ప్రతి అపాయింట్‌మెంట్‌కు కమీషన్ తీసుకుంటాయి లేదా ప్రతి చైర్‌కు నెలవారీ రుసుము వసూలు చేస్తాయి.',
        'సెలూన్ బుకింగ్ యాప్ నిజానికి ఒక డేటా సమస్య — వ్యవధులు గల సర్వీసులు, పని గంటలు గల సిబ్బంది, మరియు ఒకదానితో ఒకటి ఢీకొనని స్లాట్‌లు — మరియు WyberAi మీ వివరణ నుండి సరిగ్గా దీన్నే జనరేట్ చేస్తుంది: నిజంగా ఖాళీగా ఉన్న స్లాట్‌లను మాత్రమే చూపించే క్లయింట్-ఫేసింగ్ బుకింగ్ పేజీ, మరియు ప్రతి స్టైలిస్ట్ రోజును చూపించే యజమాని డాష్‌బోర్డ్. "స్టైలిస్ట్"ని "బార్బర్", "థెరపిస్ట్", లేదా "ఆర్టిస్ట్"గా మార్చండి, అదే నమూనా మీ దుకాణానికి సరిపోతుంది.',
      ],
      features: [
        { title: 'వ్యవధులతో సర్వీస్ మెనూ', desc: 'కట్, కలర్, బ్లో-డ్రై — ప్రతి సర్వీస్‌కు ఒక వ్యవధి మరియు ధర ఉంటుంది, కాబట్టి స్లాట్ పొడవు ఊహించబడదు, లెక్కించబడుతుంది.' },
        { title: 'ప్రతి-స్టైలిస్ట్ క్యాలెండర్‌లు', desc: 'ప్రతి సిబ్బందికి తమ సొంత పని గంటలు మరియు బుకింగ్‌లు ఉంటాయి; క్లయింట్లు ఒక వ్యక్తిని లేదా "మొదట అందుబాటులో ఉన్నవారిని" ఎంచుకోవచ్చు.' },
        { title: 'ఢీకొనని స్లాట్‌లు', desc: 'ఆ స్టైలిస్ట్ మరియు ఆ సర్వీస్ వ్యవధికి నిజంగా ఖాళీగా ఉన్న స్లాట్‌లను మాత్రమే బుకింగ్ పేజీ చూపిస్తుంది.' },
        { title: 'క్లయింట్ హిస్టరీ', desc: 'ప్రతి క్లయింట్ గత అపాయింట్‌మెంట్‌లు ఒకే చోట — ఎవరిని కలిశారు, ఏమి చేయించుకున్నారు, తిరిగి ఎప్పుడు రావాలి.' },
      ],
      promptExample: 'సెలూన్ బుకింగ్ వెబ్ యాప్ నిర్మించండి: క్లయింట్లు ఒక సర్వీస్ (ప్రతి దానికీ వ్యవధి మరియు ధరతో) ఎంచుకునే, ఒక స్టైలిస్ట్ లేదా "మొదట అందుబాటులో ఉన్నవారిని" ఎంచుకునే, మరియు ఖాళీ టైమ్ స్లాట్‌ల నుండి ఎంచుకునే పబ్లిక్ Booking పేజీ; ప్రతి స్టైలిస్ట్ నేటి అపాయింట్‌మెంట్‌లను టైమ్‌లైన్‌లో చూపించే యజమాని Dashboard; మరియు ప్రతి క్లయింట్ అపాయింట్‌మెంట్ హిస్టరీ గల Clients పేజీ. స్టైలిస్ట్‌ల పని గంటలు కాన్ఫిగర్ చేయదగినవిగా ఉండాలి.',
      faqs: [
        { q: 'ఇది డబుల్-బుకింగ్‌లను ఆపుతుందా?', a: 'అవును — అందుబాటులో ఉన్న స్లాట్‌లు స్టైలిస్ట్ పని గంటల నుండి ఇప్పటికే ఉన్న బుకింగ్‌లు మరియు సర్వీస్ వ్యవధిని తీసివేసి లెక్కించబడతాయి, కాబట్టి నిండిన స్లాట్ ఎప్పుడూ కనిపించదు.' },
        { q: 'క్లయింట్లు స్వయంగా రద్దు చేసుకోవచ్చా లేదా రీషెడ్యూల్ చేసుకోవచ్చా?', a: 'మీ ప్రాంప్ట్‌లో లేదా తర్వాత చాట్‌లో manage-booking పేజీ కోరండి — క్లయింట్లకు మీరు సెట్ చేసిన నియమాల లోపల వారి అపాయింట్‌మెంట్‌ను చూడటానికి, రద్దు చేయడానికి, లేదా మార్చడానికి ఒక లింక్ లభిస్తుంది.' },
        { q: 'ఇది బార్బర్‌షాప్‌లు, స్పాలు, లేదా క్లినిక్‌లకు పని చేస్తుందా?', a: 'అదే నిర్మాణం — సర్వీసులు, సిబ్బంది, పని గంటలు, స్లాట్‌లు — ఏ అపాయింట్‌మెంట్ వ్యాపారానికైనా సరిపోతుంది. మీ వెర్షన్‌ను వివరించండి మరియు లేబుళ్లు, నియమాలు సర్దుబాటు అవుతాయి.' },
        { q: 'నేను దీన్ని లైవ్ చేయడానికి సిద్ధమైనప్పుడు ఏమి జరుగుతుంది?', a: 'ఎడిటర్ నుండి ప్రచురించండి మరియు లింక్‌ను షేర్ చేయండి. ప్రచురించే ముందు, క్లయింట్ డేటా బహిర్గతం కాకుండా WyberAi యాప్ డేటాబేస్‌పై లైవ్ సెక్యూరిటీ స్కాన్ నడుపుతుంది.' },
      ],
    },
    'restaurant-menu-app': {
      h1: 'AIతో రెస్టారెంట్ మెనూ యాప్ నిర్మించండి',
      metaTitle: 'AIతో రెస్టారెంట్ మెనూ మరియు QR ఆర్డరింగ్ యాప్ నిర్మించండి',
      metaDesc: 'మీ కిచెన్ సెకన్లలో ఎడిట్ చేయగల డిజిటల్ మెనూ — కేటగిరీలు, ఫోటోలు, ధరలు, మరియు స్పెషల్స్ — సాదా ఇంగ్లీష్ నుండి జనరేట్ చేయబడింది. QR-రెడీ, కోడ్ లేకుండా, ప్రారంభించడం ఉచితం.',
      tagline: 'చేప మారినప్పుడు మీ ఫోన్ నుండి అప్‌డేట్ చేసే మెనూ — ధర మారిన ప్రతిసారీ మళ్ళీ ప్రింట్ చేసే PDF కాదు.',
      body: [
        'లామినేటెడ్ మెనూలు మరియు PDF లింకులకు ఒకే లోపం ఉంది: ధర మారిన లేదా ఒక వంటకం అయిపోయిన క్షణం, అవి తప్పు అవుతాయి. మరియు దీన్ని పరిష్కరించే QR-మెనూ ప్లాట్‌ఫారమ్‌లు నెలవారీ అద్దె వసూలు చేస్తాయి, కానీ లోపల అది కేవలం ఫోటోలతో కూడిన వంటకాల జాబితా మాత్రమే — మీరు పూర్తిగా సొంతం చేసుకోవాల్సిన కంటెంట్.',
        'మీ మెనూ ఆకారాన్ని వివరించండి — విభాగాలు, వంటక వివరాలు, డైటరీ ట్యాగ్‌లు, ఒక స్పెషల్స్ బోర్డ్ — మరియు WyberAi రెండు భాగాలను నిర్మిస్తుంది: టేబుల్ QR కోడ్ నుండి వేగంగా లోడ్ అయ్యే గెస్ట్-ఫేసింగ్ మెనూ, మరియు సిబ్బంది సెకన్లలో "సోల్డ్ అవుట్" మార్చగల లేదా నేటి స్పెషల్‌ను అప్‌డేట్ చేయగల అడ్మిన్ పేజీ. ఇది నిజమైన వెబ్ యాప్ కాబట్టి, విడ్జెట్ కాదు, ఇది మీతో పాటు పెరుగుతుంది: సిద్ధమైనప్పుడు రెండవ లొకేషన్ మెనూ, టేకావే ఆర్డర్ ఫారమ్, లేదా పెయిరింగ్‌లతో వైన్ లిస్ట్ జోడించండి.',
      ],
      features: [
        { title: 'విభాగాలు మరియు వంటక కార్డులు', desc: 'స్టార్టర్స్, మెయిన్స్, డెజర్ట్స్, డ్రింక్స్ — ప్రతి వంటకానికి ఫోటో, వివరణ, ధర, మరియు డైటరీ ట్యాగ్‌లు (V, VG, GF, స్పైస్ లెవెల్).' },
        { title: 'సోల్డ్-అవుట్ మరియు స్పెషల్స్ స్విచ్‌లు', desc: 'సిబ్బంది ఫోన్ నుండి లభ్యతను టోగుల్ చేస్తారు లేదా నేటి స్పెషల్‌ను పిన్ చేస్తారు — గెస్ట్‌లకు ఈ మార్పు తక్షణమే కనిపిస్తుంది.' },
        { title: 'QR-ఫస్ట్ గెస్ట్ వ్యూ', desc: 'టేబుల్ QR కోడ్ నుండి తెరవడానికి నిర్మించిన వేగవంతమైన, మొబైల్-ఫస్ట్ మెనూ — యాప్ డౌన్‌లోడ్ లేదు, PDF పించ్-జూమ్ చేయనవసరం లేదు.' },
        { title: 'బహుళ-భాషా సిద్ధం', desc: 'అవసరమైనప్పుడు మీ మెనూ కంటెంట్‌కు రెండవ భాషను జోడించండి — నిర్మాణం ప్రతి-భాషా వంటక టెక్స్ట్‌ను సపోర్ట్ చేస్తుంది.' },
      ],
      promptExample: 'రెస్టారెంట్ మెనూ వెబ్ యాప్ నిర్మించండి: విభాగాలు (Starters, Mains, Desserts, Drinks) గల పబ్లిక్, మొబైల్-ఫస్ట్ Menu పేజీ, ప్రతి వంటకం ఫోటో, వివరణ, ధర, మరియు డైటరీ ట్యాగ్‌లను చూపిస్తుంది, అలాగే హైలైట్ చేసిన Today\'s Specials విభాగం; మరియు సిబ్బంది వంటకాలను జోడించడానికి లేదా ఎడిట్ చేయడానికి, ఐటమ్‌లను సోల్డ్ అవుట్‌గా గుర్తించడానికి, మరియు రోజువారీ స్పెషల్స్‌ను సెట్ చేయడానికి Admin పేజీ (లాగిన్ అవసరం).',
      faqs: [
        { q: 'గెస్ట్‌లు మెనూను ఎలా చేరుకుంటారు?', a: 'యాప్‌ను ప్రచురించండి మరియు దాని URLకు ఒక QR కోడ్‌ను పాయింట్ చేయండి — ఏదైనా ఉచిత QR జనరేటర్ పని చేస్తుంది. గెస్ట్‌లు స్కాన్ చేస్తారు మరియు మెనూ వారి బ్రౌజర్‌లో తెరుచుకుంటుంది, డౌన్‌లోడ్ లేదు.' },
        { q: 'సాంకేతికత తెలియని సిబ్బంది దీన్ని అప్‌డేట్ చేయగలరా?', a: 'అడ్మిన్ పేజీ యొక్క ఉద్దేశ్యం అదే: లాగిన్ చేయడం మరియు ఒక వంటకాన్ని టోగుల్ చేయడం లేదా ధరను ఎడిట్ చేయడం ఒక ఫారమ్, కోడ్ మార్పు కాదు.' },
        { q: 'నేను తర్వాత ఆన్‌లైన్ ఆర్డరింగ్ జోడించవచ్చా?', a: 'అవును — మెనూతో ప్రారంభించండి మరియు సిద్ధమైనప్పుడు టేకావే ఆర్డర్ ఫ్లోను జోడించమని చాట్‌ను అడగండి; మీరు నమోదు చేసిన వంటక డేటా కొనసాగుతుంది.' },
        { q: 'దీన్ని నడపడానికి ఎంత ఖర్చు అవుతుంది?', a: 'నిర్మించడానికి ఉచిత నెలవారీ క్రెడిట్‌లు ఉపయోగించబడతాయి (ఒక బిల్డ్ 30, ఎడిట్‌లు 2), మరియు ప్రచురించిన యాప్‌లు మీ కోసం హోస్ట్ చేయబడతాయి — ప్రతి-టేబుల్ లేదా ప్రతి-స్కాన్ రుసుములు లేవు.' },
      ],
    },
    'client-crm': {
      h1: 'AIతో మీ వ్యాపారానికి సింపుల్ CRM నిర్మించండి',
      metaTitle: 'AIతో కస్టమ్ CRM నిర్మించండి — మీ పైప్‌లైన్, కోడ్ లేకుండా',
      metaDesc: 'మీ సేల్స్ ప్రక్రియకు సరిపోయే CRM: మీ పైప్‌లైన్ దశలు, మీ ఫీల్డ్‌లు, మీ ఫాలో-అప్ లయ — వివరణ నుండి జనరేట్ చేయబడింది, వారాల తరబడి కాన్ఫిగర్ చేయనవసరం లేదు.',
      tagline: 'మీ పైప్‌లైన్ దశలు, మీ ఫీల్డ్‌లు, మీ ఫాలో-అప్ లయ — మీ వ్యాపారానికి సరిపోయే CRM, మీరు కుదించాల్సిన పెద్ద సాధనం కాదు.',
      body: [
        'CRMలు చిన్న వ్యాపారాలను రెండు వైపుల నుండి నిరాశపరుస్తాయి: పెద్ద ప్లాట్‌ఫారమ్‌లు మిమ్మల్ని సెటప్ మరియు ప్రతి-సీట్ ధరలో ముంచేస్తాయి, మీరు వెనక్కి వెళ్ళే స్ప్రెడ్‌షీట్ ఒక వెచ్చని లీడ్ రెండు వారాలుగా మౌనంగా ఉందని గుర్తు చేయలేదు. ఫలితం అత్యంత ఖరీదైన లీక్ — డీల్స్ పోటీదారులకు కాదు, మౌనానికి కోల్పోతాయి.',
        'ఐదుగురు వ్యక్తుల వ్యాపారానికి నిజంగా అవసరమైనది తనదైన దశ పేర్లతో ఒక పైప్‌లైన్, మీ పరిశ్రమకు ముఖ్యమైన ఫీల్డ్‌లతో కాంటాక్ట్ రికార్డ్, మరియు ఎవరిని ఫాలో-అప్ చేయాలో చూపే నేటి-వ్యూ. ఇది కేవలం ఒక వివరణ, మరియు WyberAi దీన్ని నిజమైన డేటాబేస్‌పై పనిచేసే CRMగా మారుస్తుంది — మీ టీమ్ కోసం లాగిన్‌లతో మరియు క్లయింట్ డేటా పెట్టే ముందు సెక్యూరిటీ స్కాన్‌తో. మీ ప్రక్రియ మారినప్పుడు, మీరు యాప్‌ను చాట్‌లో మారుస్తారు, సెట్టింగ్స్ మేజ్‌లో కాదు.',
      ],
      features: [
        { title: 'మీ దశలతో పైప్‌లైన్', desc: 'Lead → Quoted → Won, లేదా మీ ఐదు-దశల వెర్షన్ — మీరు నిజంగా ఎలా అమ్ముతారో దాని నుండి రూపొందించిన కాన్‌బాన్ పైప్‌లైన్.' },
        { title: 'కాంటాక్ట్ రికార్డులు, మీ ఫీల్డ్‌లు', desc: 'కంపెనీ, మూలం, బడ్జెట్, రెన్యూవల్ తేదీ, సైజులు, అలర్జీలు — మీ వ్యాపారం ట్రాక్ చేసేది ఏదైనా, మొదటి రోజు నుండి స్కీమాలో.' },
        { title: 'ఫాలో-అప్ నేటి వ్యూ', desc: 'ఎవరి తదుపరి-చర్య తేదీ వచ్చిందో లేదా ఎవరి డీల్స్ మౌనంగా ఉన్నాయో అలాంటి కాంటాక్ట్‌ల డాష్‌బోర్డ్ — లీక్-వ్యతిరేక స్క్రీన్.' },
        { title: 'నోట్స్ మరియు యాక్టివిటీ ట్రయిల్', desc: 'కాల్స్, మీటింగ్‌లు, మరియు ఇమెయిల్‌లు కాంటాక్ట్‌కు వ్యతిరేకంగా లాగ్ చేయబడతాయి, కాబట్టి టీమ్‌లో ఎవరైనా సంభాషణ దారాన్ని అందుకోగలరు.' },
      ],
      promptExample: 'ఒక చిన్న డిజైన్ ఏజెన్సీ కోసం CRM వెబ్ యాప్ నిర్మించండి: New Lead, Discovery, Proposal Sent, Won, మరియు Lost అనే కాన్‌బాన్ దశలు గల Pipeline పేజీ, డీల్స్‌కు ఒక విలువ, కాంటాక్ట్, మరియు తదుపరి-చర్య తేదీ ఉంటుంది; కంపెనీ, పాత్ర, మూలం, మరియు నోట్స్ గల Contacts పేజీ; మరియు తదుపరి-చర్య తేదీ నేడు లేదా మించిన డీల్స్‌ను జాబితా చేసే Today పేజీ. టీమ్ లాగిన్‌ను చేర్చండి.',
      faqs: [
        { q: 'ఇది HubSpot ఉచిత టైర్ కంటే ఎలా మెరుగైనది?', a: 'ఇది ఉద్దేశపూర్వకంగా చిన్నది: మీ ఫీల్డ్‌లు మాత్రమే, మీ దశలు మాత్రమే, అప్‌గ్రేడ్-గోడలు లేవు — మరియు మీరు ఒక ఫీచర్‌ను మించిపోయినప్పుడు మీరు ప్లాన్ మార్చడానికి బదులుగా చాట్‌లో దాన్ని జోడిస్తారు.' },
        { q: 'నేను నా ఇప్పటికే ఉన్న కాంటాక్ట్‌లను దిగుమతి చేయవచ్చా?', a: 'మీ ప్రాంప్ట్‌లో లేదా తర్వాత CSV దిగుమతిని అడగండి — మీ స్ప్రెడ్‌షీట్ కాలమ్‌లను వివరించండి మరియు అవి కాంటాక్ట్‌ల టేబుల్‌లోకి మ్యాప్ అవుతాయి.' },
        { q: 'జనరేట్ చేసిన యాప్‌లో క్లయింట్ డేటా సురక్షితమేనా?', a: 'యాప్ ప్రామాణీకరణ మరియు రో-లెవెల్ సెక్యూరిటీతో వస్తుంది, మరియు ప్రచురించే ముందు WyberAi దాడి చేసేవారిలా లైవ్ డేటాబేస్‌ను పరిశీలిస్తుంది — తీవ్రమైన లీక్‌లు ప్రచురణ గేట్‌ను అడ్డుకుంటాయి.' },
        { q: 'నా టీమ్ దీన్ని ఒకేసారి ఉపయోగించవచ్చా?', a: 'అవును — ఇది Postgres పై నడిచే నిజమైన బహుళ-వినియోగదారు వెబ్ యాప్. అందరూ లాగిన్ అవుతారు, మార్పులు మొత్తం టీమ్‌కు కనిపిస్తాయి.' },
      ],
    },
    'inventory-management-app': {
      h1: 'AIతో ఇన్వెంటరీ మేనేజ్‌మెంట్ యాప్ నిర్మించండి',
      metaTitle: 'AIతో ఇన్వెంటరీ మేనేజ్‌మెంట్ యాప్ నిర్మించండి',
      metaDesc: 'మీ దుకాణం కోసం స్టాక్ స్థాయిలు, లో-స్టాక్ హెచ్చరికలు, మరియు సరఫరాదారు రీఆర్డర్ సమాచారం — సాదా ఇంగ్లీష్ నుండి జనరేట్ చేయబడిన ఇన్వెంటరీ యాప్, ప్రతి-SKU ప్లాట్‌ఫారమ్ రుసుము లేదు.',
      tagline: 'షెల్ఫ్‌పై నిజంగా ఏముందో తెలుసుకోండి, అయిపోకముందే హెచ్చరిక పొందండి, మరియు దాన్ని అమ్మే సరఫరాదారు నుండి రీఆర్డర్ చేయండి — ఒక స్క్రీన్, నోట్‌బుక్‌ల కుప్ప కాదు.',
      body: [
        'చిన్న రిటైలర్లు మరియు తయారీదారులు ఇన్వెంటరీని యాభై ఏళ్ల క్రితం నడిపిన విధంగానే నడుపుతారు — క్లిప్‌బోర్డ్‌పై లెక్క, జ్ఞాపకం నుండి నిర్ణయించిన రీఆర్డర్, మరియు చివరి యూనిట్ ఎప్పుడు అమ్ముడైందో తెలియకుండా ఒక కస్టమర్ అడిగినప్పుడు కనుగొనబడే స్టాక్‌అవుట్. దీన్ని పరిష్కరించడానికి నిర్మించిన ఇన్వెంటరీ ప్లాట్‌ఫారమ్‌లు ప్రతి-SKU లేదా ప్రతి-లొకేషన్‌కు ధర వసూలు చేస్తాయి, ఇది మీరు సాధించాలనుకుంటున్న వృద్ధినే శిక్షిస్తుంది.',
        'మీరు ఏమి స్టాక్ చేస్తారు మరియు ఎలా అమ్ముతారో వివరించండి, మరియు WyberAi మీ దుకాణం చుట్టూ వ్యవస్థను నిర్మిస్తుంది: అమ్మకాలు మరియు డెలివరీలు లాగ్ అవుతున్నప్పుడు మారే పరిమాణాలతో ఒక ఉత్పత్తి జాబితా, అయిపోకముందే రీఆర్డర్ అవసరమైన వాటిని ఫ్లాగ్ చేసే లో-స్టాక్ వ్యూ, మరియు ప్రతి ఐటమ్‌కు జోడించిన సరఫరాదారు వివరాలు తద్వారా రీఆర్డర్ చేయడం ఒక లుకప్, జ్ఞాపక పరీక్ష కాదు. ఒక లొకేషన్ అయినా మూడైనా, రిటైల్ అయినా ముడి సరుకులైనా — ఆకారం మీ వివరణను అనుసరిస్తుంది.',
      ],
      features: [
        { title: 'లైవ్ స్టాక్ స్థాయిలు', desc: 'అమ్మకాలు మరియు డెలివరీలు లాగ్ అవుతున్నప్పుడు అప్‌డేట్ అయ్యే పరిమాణంతో ప్రతి ఉత్పత్తి — ఇక వారాంతపు తిరిగి-లెక్కింపు లేదు.' },
        { title: 'లో-స్టాక్ హెచ్చరికలు', desc: 'ప్రతి ఉత్పత్తికి రీఆర్డర్ థ్రెషోల్డ్ సెట్ చేయండి; దాని కంటే తక్కువ ఉన్నది స్టాక్‌అవుట్ కావడానికి ముందే డాష్‌బోర్డ్‌లో కనిపిస్తుంది.' },
        { title: 'ప్రతి ఐటమ్‌కు సరఫరాదారు సమాచారం', desc: 'సరఫరాదారు పేరు, సంప్రదింపు, మరియు వ్యయ ధర ప్రతి ఉత్పత్తికి జోడించబడతాయి — రీఆర్డర్ చేయడం లుకప్‌తో ప్రారంభమవుతుంది, ఇమెయిల్‌లో వెతకడంతో కాదు.' },
        { title: 'బహుళ-లొకేషన్ మద్దతు', desc: 'ప్రతి స్టోర్ లేదా గోడౌన్ స్టాక్‌ను విడిగా ట్రాక్ చేయండి, లేదా ఒక మొత్తంలో కలపండి — మీ వ్యాపారం నిజంగా ఎలా పనిచేస్తుందో అలా వివరించబడింది.' },
      ],
      promptExample: 'ఇన్వెంటరీ మేనేజ్‌మెంట్ వెబ్ యాప్ నిర్మించండి: SKU, చేతిలో ఉన్న పరిమాణం, రీఆర్డర్ థ్రెషోల్డ్, వ్యయ ధర, మరియు సరఫరాదారు పేరుతో ఐటమ్‌లను జాబితా చేసే Products పేజీ; రీఆర్డర్ థ్రెషోల్డ్ కంటే తక్కువ ఉన్న ఉత్పత్తులను హైలైట్ చేసే Dashboard; అమ్మకాలు మరియు వచ్చే డెలివరీలను లాగ్ చేసే, పరిమాణాలను సర్దుబాటు చేసే Stock Movement పేజీ; మరియు వారు సరఫరా చేసే ఉత్పత్తులకు లింక్ చేయబడిన సంప్రదింపు వివరాలతో Suppliers పేజీ.',
      faqs: [
        { q: 'ఇది బార్‌కోడ్‌లను నిర్వహించగలదా?', a: 'మీ ప్రాంప్ట్‌లో ప్రతి ఉత్పత్తికి బార్‌కోడ్ ఫీల్డ్‌ను జోడించండి; లైవ్ అయిన తర్వాత దాన్ని ఫోన్ కెమెరా స్కానర్‌తో జత చేయడం చాట్‌లో ఒక ఎడిట్.' },
        { q: 'నేను ఒకటి కంటే ఎక్కువ దుకాణాలలో స్టాక్‌ను ట్రాక్ చేయవచ్చా?', a: 'అవును — మీ లొకేషన్‌లను వివరించండి మరియు పరిమాణాలను ప్రతి లొకేషన్‌కు ట్రాక్ చేయవచ్చు, డాష్‌బోర్డ్‌లో కలిపిన మొత్తం వ్యూతో పాటు.' },
        { q: 'ఇది కొనుగోలు ఆర్డర్‌లను జనరేట్ చేస్తుందా?', a: 'కొనుగోలు-ఆర్డర్ పేజీని అడగండి మరియు లో-స్టాక్ ఐటమ్‌లను ఒక క్లిక్‌లో వారి సరఫరాదారుకు అడ్రస్ చేసిన POగా మార్చవచ్చు.' },
        { q: 'ఇది ఇన్వెంటరీ SaaS కంటే చౌకైనదా?', a: 'మీరు దీన్ని ఉచిత నెలవారీ క్రెడిట్‌లతో ఒకసారి నిర్మిస్తారు మరియు ఇది మీదవుతుంది — మీ కేటలాగ్ పెరిగేకొద్దీ ప్రతి-SKU లేదా ప్రతి-లొకేషన్ నెలవారీ రుసుము లేదు.' },
      ],
    },
    'rental-property-manager': {
      h1: 'AIతో రెంటల్ ప్రాపర్టీ మేనేజర్ నిర్మించండి',
      metaTitle: 'AIతో రెంటల్ ప్రాపర్టీ మేనేజ్‌మెంట్ యాప్ నిర్మించండి',
      metaDesc: 'మీ రెంటల్స్ కోసం యూనిట్లు, అద్దెదారులు, అద్దె ట్రాకింగ్, మరియు నిర్వహణ అభ్యర్థనలు — సాదా ఇంగ్లీష్ నుండి జనరేట్ చేయబడిన ప్రాపర్టీ మేనేజర్ యాప్, ప్రతి-యూనిట్ రుసుము లేదు.',
      tagline: 'ప్రతి యూనిట్, అందులో ఎవరున్నారు, ఈ నెల అద్దె వచ్చిందా, మరియు ఏమి పాడైంది — ఒక్క డాష్‌బోర్డ్‌లో యజమాని మొత్తం కార్యకలాపం.',
      body: [
        'కొన్ని యూనిట్లు గల యజమానులు బ్యాంక్ స్టేట్‌మెంట్‌లు, లీక్ అవుతున్న కుళాయి గురించి టెక్స్ట్ మెసేజీలు, మరియు ఎవరు చెల్లించారో ఎవరు వారం లేటో గుర్తుంచుకోవడం అనే మిశ్రమంతో వ్యాపారాన్ని నడుపుతారు. ప్రాపర్టీ మేనేజ్‌మెంట్ సాఫ్ట్‌వేర్ ఉంది, కానీ అది వందల యూనిట్ల పోర్ట్‌ఫోలియోల కోసం ధర నిర్ణయించి నిర్మించబడింది, మీ వద్ద నిజంగా ఉన్న నాలుగు డూప్లెక్స్‌ల కోసం కాదు.',
        'మీ ప్రాపర్టీలను మరియు మీరు వాటిని ఎలా నిర్వహిస్తారో వివరించండి, మరియు WyberAi ఈ కార్యకలాపాన్ని ఒక యాప్‌గా నిర్మిస్తుంది: యూనిట్లు మరియు అద్దెదారుల జాబితా, ఈ చక్రంలో ఎవరు చెల్లించారో ఎవరు లేదో చూపే అద్దె లెడ్జర్, మరియు నివేదించిన సమస్య మీరు మర్చిపోయేవరకు టెక్స్ట్ థ్రెడ్‌లో ఉండిపోకుండా నిర్వహణ బోర్డ్. లీజు రెన్యూవల్ తేదీలు మీపై పడకముందే కనిపిస్తాయి, తర్వాత కాదు.',
      ],
      features: [
        { title: 'యూనిట్లు మరియు అద్దెదారులు', desc: 'ప్రస్తుత అద్దెదారు, లీజు ప్రారంభ మరియు ముగింపు తేదీలు, మరియు నెలవారీ అద్దెతో ప్రతి ప్రాపర్టీ మరియు యూనిట్.' },
        { title: 'అద్దె చెల్లింపు లాగ్', desc: 'ప్రతి యూనిట్‌కు ప్రతి నెల అద్దె అందిందని గుర్తు పెట్టండి; ఒక్క చూపులో ఎవరు కరెంట్‌గా ఉన్నారో ఎవరు బకాయిలో ఉన్నారో డాష్‌బోర్డ్ చూపిస్తుంది.' },
        { title: 'నిర్వహణ అభ్యర్థన బోర్డ్', desc: 'అద్దెదారులు (లేదా మీరు) స్థితితో సమస్యలను లాగ్ చేస్తారు — నివేదించబడింది, పురోగతిలో ఉంది, పరిష్కరించబడింది — కాబట్టి ఏదీ టెక్స్ట్ థ్రెడ్‌లో పోదు.' },
        { title: 'లీజు గడువు రిమైండర్‌లు', desc: 'ముగింపు తేదీకి దగ్గరవుతున్న లీజులు డాష్‌బోర్డ్‌లో కనిపిస్తాయి, రెన్యూ చేయడానికి లేదా యూనిట్‌ను మళ్ళీ జాబితా చేయడానికి మీకు సమయం ఇస్తుంది.' },
      ],
      promptExample: 'రెంటల్ ప్రాపర్టీ మేనేజ్‌మెంట్ వెబ్ యాప్ నిర్మించండి: అద్దెదారు పేరు, లీజు ప్రారంభ/ముగింపు తేదీ, మరియు నెలవారీ అద్దెతో యూనిట్లను జాబితా చేసే Properties పేజీ; ప్రతి యూనిట్‌కు ప్రతి నెల అందిన చెల్లింపులను బకాయి సూచికతో గుర్తు పెట్టే Rent Ledger పేజీ; ప్రతి యూనిట్‌కు స్థితితో (నివేదించబడింది, పురోగతిలో ఉంది, పరిష్కరించబడింది) సమస్యలను లాగ్ చేసే Maintenance పేజీ; మరియు రాబోయే 60 రోజుల్లో ముగిసే లీజులను హైలైట్ చేసే Dashboard.',
      faqs: [
        { q: 'అద్దెదారులు స్వయంగా నిర్వహణ అభ్యర్థనలను సమర్పించవచ్చా?', a: 'అవును — అద్దెదారు లాగిన్ మరియు అభ్యర్థన ఫారమ్‌ను జోడించండి, మరియు వారు సమర్పించే సమస్యలు నేరుగా మీ నిర్వహణ బోర్డ్‌కు వస్తాయి.' },
        { q: 'ఇది లేట్ ఫీజులను లెక్కించగలదా?', a: 'మీ ప్రాంప్ట్‌లో మీ లేట్-ఫీ నియమాన్ని వివరించండి మరియు చెల్లింపు దాని గడువు తేదీని దాటిన తర్వాత అద్దె లెడ్జర్ దీన్ని స్వయంచాలకంగా వర్తింపజేయగలదు.' },
        { q: 'ఇది ఒకటి కంటే ఎక్కువ ప్రాపర్టీలకు పని చేస్తుందా?', a: 'అవును — నిర్మాణం ఒక డూప్లెక్స్ నుండి పోర్ట్‌ఫోలియో వరకు స్కేల్ అవుతుంది; ప్రతి ప్రాపర్టీకి తనదైన యూనిట్లు, అద్దెదారులు, మరియు లెడ్జర్ ఉంటాయి.' },
        { q: 'అద్దెదారు డేటా సురక్షితమేనా?', a: 'యాప్ దాని స్వంత డేటాబేస్‌పై రో-లెవెల్ సెక్యూరిటీతో నడుస్తుంది, ప్రచురించే ముందు లైవ్‌గా స్కాన్ చేయబడుతుంది — అద్దెదారు వివరాలు బహిరంగంగా బహిర్గతం కావు.' },
      ],
    },
    'ecommerce-seller-dashboard': {
      h1: 'AIతో ఈకామర్స్ సెల్లర్ డాష్‌బోర్డ్ నిర్మించండి',
      metaTitle: 'AIతో ఈకామర్స్ సెల్లర్ డాష్‌బోర్డ్ నిర్మించండి — కోడ్ లేకుండా',
      metaDesc: 'Amazon, Shopify, మరియు Etsyలో ఆర్డర్‌లు, మార్జిన్, మరియు స్టాక్ ఒకే డాష్‌బోర్డ్‌లో — సాదా ఇంగ్లీష్ నుండి జనరేట్ చేయబడింది, ప్రతి-ఛానల్ ప్లాట్‌ఫారమ్ రుసుము లేదు.',
      tagline: 'మీరు అమ్మే ప్రతి ఛానల్‌కు ఒక డాష్‌బోర్డ్ — ప్రతి ఆర్డర్‌కు నిజమైన మార్జిన్, అబద్ధం చెప్పని స్టాక్, మరియు మీరు మార్కెట్‌ప్లేస్‌ను జోడించిన ప్రతిసారీ కొత్త సబ్‌స్క్రిప్షన్ లేదు.',
      body: [
        'ఒకటి కంటే ఎక్కువ ఛానెళ్లలో అమ్మండి — Amazon, Shopify, Etsy, మీ స్వంత స్టోర్‌ఫ్రంట్ — మరియు మీకు ప్రతిదానికీ వేరే లాగిన్, వేరే రిపోర్ట్ ఫార్మాట్, మరియు "లాభం" యొక్క వేరే నిర్వచనం లభిస్తుంది. నెలాఖరులో వీటిని ఒక చిత్రంలోకి కుట్టడం అంటే సాధారణంగా మూడు చోట్ల నుండి స్ప్రెడ్‌షీట్‌లను ఎగుమతి చేసి కేటగిరీలు సరిపోతాయని ఆశించడం.',
        'మీరు నిజంగా ఎలా అమ్ముతారో వివరించండి — ఏ ఛానెళ్లు, ప్రతి ఒక్కటి ఎంత రుసుము తీసుకుంటుంది, ప్రతి ఆర్డర్‌కు మార్జిన్ గురించి మీరు ఎలా ఆలోచిస్తారు — మరియు WyberAi దాని చుట్టూ డాష్‌బోర్డ్‌ను నిర్మిస్తుంది: ఏ ఛానల్ నుండైనా ఆర్డర్‌లను లాగ్ చేయడానికి ఒకే స్థలం, అమ్మకం జరిగిన ప్రదేశానికి ప్రత్యేకమైన రుసుములు మరియు ఖర్చులను తీసివేసే మార్జిన్ వ్యూ, మరియు మీరు ఒకే చోట అమ్ముతారని అనుకోని స్టాక్ చిత్రం. తర్వాత ఒక ఛానల్‌ను జోడించడం ఒక ప్రాంప్ట్ దూరంలో ఉంటుంది, కొత్త సబ్‌స్క్రిప్షన్ కాదు.',
      ],
      features: [
        { title: 'ఒక ఫీడ్, ప్రతి ఛానల్', desc: 'పూర్తి చిత్రాన్ని కలపడానికి ట్యాబ్‌లను మార్చడానికి బదులుగా Amazon, Shopify, Etsy, లేదా మీ స్వంత స్టోర్ నుండి ఆర్డర్‌లను ఒకే చోట లాగ్ చేయండి.' },
        { title: 'ప్రతి ఆర్డర్‌కు నిజమైన మార్జిన్', desc: 'ప్రతి ఛానల్ రుసుము శాతం మరియు మీ వ్యయ ధరను జోడించండి, మరియు మార్జిన్ ప్రతి ఆర్డర్‌కు లెక్కించబడుతుంది — మిశ్రమ సగటు నుండి ఊహించబడదు.' },
        { title: 'ఛానెళ్లలో స్టాక్', desc: 'ఒక ఉత్పత్తి మూడు చోట్ల అమ్ముడైనా దానికి చేతిలో ఒకే పరిమాణం ఉంటుంది, కాబట్టి మరో ఛానల్ ఇప్పటికే అమ్మినదాన్ని మీరు ఎక్కువగా అమ్మరు.' },
        { title: 'మీ కేటలాగ్‌తో పెరుగుతుంది, దానికి వ్యతిరేకంగా కాదు', desc: 'స్కేల్ చేసినప్పుడు పెరిగే ప్రతి-ఆర్డర్ లేదా ప్రతి-ఛానల్ రుసుము లేదు — మీరు దీన్ని ఉచిత క్రెడిట్‌లతో ఒకసారి నిర్మిస్తారు మరియు ఇది మీదవుతుంది.' },
      ],
      promptExample: 'ఈకామర్స్ సెల్లర్ డాష్‌బోర్డ్ వెబ్ యాప్ నిర్మించండి: ప్రతి అమ్మకాన్ని అది వచ్చిన ఛానల్ (Amazon, Shopify, Etsy, లేదా కస్టమ్), అమ్మకపు ధర, ఛానల్ రుసుము, మరియు వ్యయ ధరతో లాగ్ చేసే Orders పేజీ; మొత్తం ఆదాయం, రుసుములు, మరియు నికర మార్జిన్‌ను ఛానల్ మరియు నెల వారీగా విభజించి చూపే Dashboard పేజీ; అన్ని ఛానెళ్లలో పంచుకున్న స్టాక్ పరిమాణాన్ని లో-స్టాక్ సూచికతో ట్రాక్ చేసే Products పేజీ; మరియు మీరు అమ్మే ప్రతి ప్రదేశానికి రుసుము శాతాన్ని జోడించడానికి లేదా ఎడిట్ చేయడానికి Channels పేజీ.',
      faqs: [
        { q: 'ఇది నేరుగా నా Amazon లేదా Shopify ఖాతాకు కనెక్ట్ అవుతుందా?', a: 'మొదట్లో కాదు — ఇది describe-your-numbers డాష్‌బోర్డ్, కాబట్టి మీరే ఆర్డర్‌లను లాగ్ చేస్తారు లేదా పేస్ట్ చేస్తారు. ఇది మారగల లేదా రద్దు చేయబడగల మార్కెట్‌ప్లేస్ APIపై ఆధారపడటాన్ని నివారిస్తుంది; మీ ప్రాంప్ట్‌లో బల్క్-పేస్ట్ లేదా CSV-దిగుమతి స్క్రీన్‌ను అడగండి మరియు దాన్ని జోడించవచ్చు.' },
        { q: 'ఇది మూడు కంటే ఎక్కువ ఛానెళ్లను నిర్వహించగలదా?', a: 'అవును — Channels పేజీ మీరు వివరించినన్ని ఛానెళ్లను కలిగి ఉంటుంది, ప్రతి దానికీ తనదైన రుసుము శాతంతో, మరియు డాష్‌బోర్డ్ అన్నింటినీ ఒకే మార్జిన్ వ్యూలోకి కలుపుతుంది.' },
        { q: 'నాకు నా స్వంత వెబ్‌సైట్ లేదా హోస్టింగ్ అవసరమా?', a: 'లేదు — ప్రచురించండి మరియు ఇది తక్షణమే ఉచిత wyberai.app సబ్‌డొమైన్‌పై లైవ్ అవుతుంది; కావాలనుకుంటే తర్వాత మీ స్వంత డొమైన్‌ను కనెక్ట్ చేయండి.' },
        { q: 'ఇది బహుళ-ఛానల్ సెల్లర్ టూల్ కంటే చౌకైనదా?', a: 'మీరు దీన్ని ఉచిత నెలవారీ క్రెడిట్‌లతో ఒకసారి నిర్మించి పూర్తిగా సొంతం చేసుకుంటారు — మీ అమ్మకాలు పెరిగేకొద్దీ పెరిగే ప్రతి-ఆర్డర్ లేదా ప్రతి-ఛానల్ రుసుము లేదు.' },
      ],
    },
  },
  ta: {
    'salon-booking-app': {
      h1: 'AI மூலம் சலூன் புக்கிங் ஆப்-ஐ உருவாக்குங்கள்',
      metaTitle: 'AI மூலம் சலூன் புக்கிங் ஆப் — கோட் இல்லாமல்',
      metaDesc: 'ஃபோன்-டேக் அப்பாயிண்ட்மென்ட்களை ஆன்லைன் புக்கிங்களாக மாற்றுங்கள்: சேவைகள், ஸ்டைலிஸ்ட் கேலெண்டர்கள், மற்றும் கிளையண்ட் ஹிஸ்டரி — சாதாரண ஆங்கில விவரிப்பிலிருந்து உருவாக்கப்பட்டது, கோட் இல்லாமல்.',
      tagline: 'கிளையண்ட்கள் ஒரு சேவை, ஒரு ஸ்டைலிஸ்ட், ஒரு ஸ்லாட்டைத் தேர்ந்தெடுக்கிறார்கள். நீங்கள் ஒரே பார்வையில் நாளின் அட்டவணையைப் பார்க்கிறீர்கள். இனி DM மற்றும் ஃபோன்-டேக் புக்கிங் தேவையில்லை.',
      body: [
        'பெரும்பாலான சலூன்களுக்கு புக்கிங் அமைப்பு என்பது ஒரு ஃபோன், ஒரு Instagram DM இன்பாக்ஸ், மற்றும் ஒரு பேப்பர் டைரி — இது ஒரு டபுள்-புக்கிங் ஒரு regular கிளையண்டை இழக்கும் வரை, அல்லது "நீங்கள் வியாழக்கிழமை ஃப்ரீயா?" போன்ற மெசேஜ்களில் ஒரு மணி நேரம் கரையும் வரை வேலை செய்யும். இதை சரிசெய்யும் புக்கிங் தளங்கள் ஒவ்வொரு அப்பாயிண்ட்மென்ட்டுக்கும் கமிஷன் எடுக்கும் அல்லது ஒவ்வொரு நாற்காலிக்கும் மாதாந்திர கட்டணம் வசூலிக்கும்.',
        'சலூன் புக்கிங் ஆப் என்பது அடிப்படையில் ஒரு டேட்டா பிரச்சனை — கால அளவுகள் கொண்ட சேவைகள், வேலை நேரங்கள் கொண்ட ஊழியர்கள், மற்றும் ஒன்றோடொன்று மோதாத ஸ்லாட்கள் — WyberAi உங்கள் விவரிப்பிலிருந்து சரியாக இதையே உருவாக்குகிறது: உண்மையிலேயே காலியாக உள்ள ஸ்லாட்களை மட்டும் காட்டும் கிளையண்ட் புக்கிங் பக்கம், மற்றும் ஒவ்வொரு ஸ்டைலிஸ்டின் நாளையும் காட்டும் உரிமையாளர் டாஷ்போர்டு. "ஸ்டைலிஸ்ட்" என்பதை "பார்பர்", "தெரபிஸ்ட்", அல்லது "ஆர்ட்டிஸ்ட்" என மாற்றுங்கள், அதே அமைப்பு உங்கள் கடைக்குப் பொருந்தும்.',
      ],
      features: [
        { title: 'கால அளவுகளுடன் சேவை மெனு', desc: 'கட், கலர், ப்ளோ-ட்ரை — ஒவ்வொரு சேவைக்கும் ஒரு கால அளவும் விலையும் உள்ளது, எனவே ஸ்லாட் நீளம் யூகிக்கப்படாமல் கணக்கிடப்படுகிறது.' },
        { title: 'ஒவ்வொரு-ஸ்டைலிஸ்ட் கேலெண்டர்கள்', desc: 'ஒவ்வொரு ஊழியருக்கும் சொந்த வேலை நேரமும் புக்கிங்களும் உள்ளன; கிளையண்ட்கள் ஒரு நபரை அல்லது "முதலில் கிடைப்பவரை" தேர்வு செய்யலாம்.' },
        { title: 'மோதலற்ற ஸ்லாட்கள்', desc: 'அந்த ஸ்டைலிஸ்ட் மற்றும் அந்த சேவை கால அளவுக்கு உண்மையிலேயே காலியாக உள்ள ஸ்லாட்களை மட்டுமே புக்கிங் பக்கம் காட்டுகிறது.' },
        { title: 'கிளையண்ட் ஹிஸ்டரி', desc: 'ஒவ்வொரு கிளையண்டின் முந்தைய அப்பாயிண்ட்மென்ட்களும் ஒரே இடத்தில் — யாரை சந்தித்தார்கள், என்ன செய்தார்கள், எப்போது மீண்டும் வர வேண்டும்.' },
      ],
      promptExample: 'ஒரு சலூன் புக்கிங் வெப் ஆப்பை உருவாக்குங்கள்: கிளையண்ட்கள் ஒரு சேவையை (ஒவ்வொன்றும் கால அளவு மற்றும் விலையுடன்) தேர்ந்தெடுக்கும், ஒரு ஸ்டைலிஸ்ட் அல்லது "முதலில் கிடைப்பவரை" தேர்வு செய்யும், மற்றும் திறந்த நேர ஸ்லாட்களிலிருந்து தேர்ந்தெடுக்கும் பப்ளிக் Booking பக்கம்; ஒவ்வொரு ஸ்டைலிஸ்டின் இன்றைய அப்பாயிண்ட்மென்ட்களை டைம்லைனில் காட்டும் உரிமையாளர் Dashboard; மற்றும் ஒவ்வொரு கிளையண்டின் அப்பாயிண்ட்மென்ட் ஹிஸ்டரி கொண்ட Clients பக்கம். ஸ்டைலிஸ்ட்களின் வேலை நேரங்கள் கட்டமைக்கக்கூடியதாக இருக்கட்டும்.',
      faqs: [
        { q: 'இது டபுள்-புக்கிங்கை தடுக்குமா?', a: 'ஆம் — கிடைக்கும் ஸ்லாட்கள் ஸ்டைலிஸ்டின் வேலை நேரத்திலிருந்து தற்போதைய புக்கிங்களையும் சேவையின் கால அளவையும் கழித்துக் கணக்கிடப்படுகின்றன, எனவே நிரம்பிய ஸ்லாட் ஒருபோதும் தோன்றாது.' },
        { q: 'கிளையண்ட்கள் தாங்களாகவே ரத்து செய்யலாமா அல்லது மறுசீரமைக்கலாமா?', a: 'உங்கள் ப்ராம்ப்ட்டில் அல்லது பின்னர் சாட்டில் manage-booking பக்கத்தைக் கேளுங்கள் — கிளையண்ட்களுக்கு நீங்கள் அமைத்த விதிகளுக்குள் தங்கள் அப்பாயிண்ட்மென்ட்டைப் பார்க்க, ரத்து செய்ய, அல்லது மாற்ற ஒரு லிங்க் கிடைக்கும்.' },
        { q: 'இது பார்பர்ஷாப், ஸ்பா, அல்லது கிளினிக்குகளுக்கு வேலை செய்யுமா?', a: 'அதே அமைப்பு — சேவைகள், ஊழியர்கள், வேலை நேரங்கள், ஸ்லாட்கள் — எந்த அப்பாயிண்ட்மென்ட் வணிகத்திற்கும் பொருந்தும். உங்கள் பதிப்பை விவரியுங்கள், லேபிள்களும் விதிகளும் தகவமைந்துகொள்ளும்.' },
        { q: 'நான் இதை லைவ் செய்ய தயாரானதும் என்ன நடக்கும்?', a: 'எடிட்டரிலிருந்து வெளியிட்டு லிங்கைப் பகிருங்கள். வெளியிடுவதற்கு முன், கிளையண்ட் டேட்டா வெளிப்படாமல் இருக்க WyberAi ஆப்பின் டேட்டாபேஸில் ஒரு லைவ் செக்யூரிட்டி ஸ்கேனை இயக்குகிறது.' },
      ],
    },
    'restaurant-menu-app': {
      h1: 'AI மூலம் ரெஸ்டாரன்ட் மெனு ஆப்-ஐ உருவாக்குங்கள்',
      metaTitle: 'AI மூலம் ரெஸ்டாரன்ட் மெனு மற்றும் QR ஆர்டரிங் ஆப்-ஐ உருவாக்குங்கள்',
      metaDesc: 'உங்கள் சமையலறை நொடிகளில் எடிட் செய்யக்கூடிய டிஜிட்டல் மெனு — வகைகள், புகைப்படங்கள், விலைகள், மற்றும் ஸ்பெஷல்ஸ் — சாதாரண ஆங்கிலத்திலிருந்து உருவாக்கப்பட்டது. QR-ரெடி, கோட் இல்லாமல், தொடங்குவது இலவசம்.',
      tagline: 'மீன் மாறும்போது உங்கள் ஃபோனிலிருந்து அப்டேட் செய்யும் மெனு — விலை மாறும் ஒவ்வொரு முறையும் மறுபதிப்பு செய்யப்படும் PDF அல்ல.',
      body: [
        'லேமினேட் செய்யப்பட்ட மெனுக்களும் PDF லிங்க்குகளும் ஒரே குறையைக் கொண்டுள்ளன: விலை மாறும் அல்லது ஒரு டிஷ் தீர்ந்துவிடும் தருணத்தில், அவை தவறாகிவிடும். இதை சரிசெய்யும் QR-மெனு தளங்கள் மாதாந்திர வாடகை வசூலிக்கின்றன, ஆனால் அடிப்படையில் அது புகைப்படங்களுடன் கூடிய உணவுகளின் பட்டியல் மட்டுமே — நீங்கள் முழுமையாக சொந்தமாக்கிக்கொள்ள வேண்டிய உள்ளடக்கம்.',
        'உங்கள் மெனுவின் அமைப்பை விவரியுங்கள் — பிரிவுகள், டிஷ் விவரங்கள், டயட்டரி டேக்குகள், ஒரு ஸ்பெஷல்ஸ் போர்டு — WyberAi இரண்டு பாகங்களையும் உருவாக்குகிறது: டேபிள் QR கோடிலிருந்து வேகமாக லோட் ஆகும் விருந்தினர் மெனு, மற்றும் ஊழியர்கள் நொடிகளில் "சோல்ட் அவுட்" புரட்டவோ இன்றைய ஸ்பெஷலை அப்டேட் செய்யவோ முடியும் அட்மின் பக்கம். இது ஒரு உண்மையான வெப் ஆப் என்பதால், விட்ஜெட் அல்ல, இது உங்களுடன் வளர்கிறது: தயாரானதும் இரண்டாவது இடத்தின் மெனு, டேக்அவே ஆர்டர் படிவம், அல்லது பேரிங்குகளுடன் வைன் லிஸ்ட் சேர்க்கவும்.',
      ],
      features: [
        { title: 'பிரிவுகள் மற்றும் டிஷ் கார்டுகள்', desc: 'ஸ்டார்ட்டர்ஸ், மெயின்ஸ், டெசர்ட்ஸ், ட்ரிங்க்ஸ் — ஒவ்வொரு டிஷும் புகைப்படம், விவரணை, விலை, மற்றும் டயட்டரி டேக்குகளுடன் (V, VG, GF, ஸ்பைஸ் லெவல்).' },
        { title: 'சோல்ட்-அவுட் மற்றும் ஸ்பெஷல்ஸ் ஸ்விட்ச்கள்', desc: 'ஊழியர்கள் ஃபோனிலிருந்து கிடைப்பதை மாற்றுகிறார்கள் அல்லது இன்றைய ஸ்பெஷலை பின் செய்கிறார்கள் — விருந்தினர்களுக்கு இந்த மாற்றம் உடனடியாகத் தெரியும்.' },
        { title: 'QR-முதல் விருந்தினர் காட்சி', desc: 'டேபிள் QR கோடிலிருந்து திறக்க வடிவமைக்கப்பட்ட வேகமான, மொபைல்-முதல் மெனு — ஆப் டவுன்லோட் இல்லை, PDF பிஞ்ச்-ஜூம் தேவையில்லை.' },
        { title: 'பல-மொழி தயார்', desc: 'தேவைப்படும்போது உங்கள் மெனு உள்ளடக்கத்திற்கு இரண்டாவது மொழியைச் சேர்க்கவும் — அமைப்பு ஒவ்வொரு-மொழி டிஷ் உரையையும் ஆதரிக்கிறது.' },
      ],
      promptExample: 'ஒரு ரெஸ்டாரன்ட் மெனு வெப் ஆப்பை உருவாக்குங்கள்: பிரிவுகளுடன் (Starters, Mains, Desserts, Drinks) கூடிய பப்ளிக், மொபைல்-முதல் Menu பக்கம், ஒவ்வொரு டிஷும் புகைப்படம், விவரணை, விலை, மற்றும் டயட்டரி டேக்குகளைக் காட்டும், மற்றும் ஹைலைட் செய்யப்பட்ட Today\'s Specials பிரிவு; மற்றும் ஊழியர்கள் டிஷ்களைச் சேர்க்க அல்லது எடிட் செய்ய, ஐட்டங்களை சோல்ட் அவுட் என குறிக்க, மற்றும் தினசரி ஸ்பெஷல்களை அமைக்க Admin பக்கம் (லாகின் தேவை).',
      faqs: [
        { q: 'விருந்தினர்கள் மெனுவை எப்படி அணுகுவார்கள்?', a: 'ஆப்பை வெளியிட்டு அதன் URL-ஐச் சுட்டிக்காட்டும் QR கோடை உருவாக்குங்கள் — எந்த இலவச QR ஜெனரேட்டரும் வேலை செய்யும். விருந்தினர்கள் ஸ்கேன் செய்ய, மெனு அவர்கள் பிரவுசரில் திறக்கும், டவுன்லோட் இல்லை.' },
        { q: 'தொழில்நுட்பம் தெரியாத ஊழியர்கள் இதை அப்டேட் செய்யலாமா?', a: 'அட்மின் பக்கத்தின் நோக்கமே அதுதான்: லாகின் செய்வதும் ஒரு டிஷை மாற்றுவதும் அல்லது விலையை எடிட் செய்வதும் ஒரு படிவம், கோட் மாற்றம் அல்ல.' },
        { q: 'நான் பின்னர் ஆன்லைன் ஆர்டரிங்கைச் சேர்க்கலாமா?', a: 'ஆம் — மெனுவுடன் தொடங்கி, தயாரானதும் டேக்அவே ஆர்டர் ஃப்ளோவைச் சேர்க்க சாட்டைக் கேளுங்கள்; நீங்கள் உள்ளிட்ட டிஷ் டேட்டா தொடரும்.' },
        { q: 'இதை இயக்க என்ன செலவாகும்?', a: 'உருவாக்குவதற்கு இலவச மாதாந்திர கிரெடிட்கள் பயன்படுத்தப்படுகின்றன (ஒரு பில்ட் 30, எடிட்கள் 2), வெளியிடப்பட்ட ஆப்கள் உங்களுக்காக ஹோஸ்ட் செய்யப்படுகின்றன — ஒவ்வொரு-டேபிள் அல்லது ஒவ்வொரு-ஸ்கேன் கட்டணம் இல்லை.' },
      ],
    },
    'client-crm': {
      h1: 'AI மூலம் உங்கள் வணிகத்திற்கான எளிய CRM-ஐ உருவாக்குங்கள்',
      metaTitle: 'AI மூலம் கஸ்டம் CRM-ஐ உருவாக்குங்கள் — உங்கள் பைப்லைன், கோட் இல்லாமல்',
      metaDesc: 'உங்கள் விற்பனை செயல்முறைக்கு ஏற்ற CRM: உங்கள் பைப்லைன் நிலைகள், உங்கள் ஃபீல்டுகள், உங்கள் ஃபாலோ-அப் தாளம் — விவரிப்பிலிருந்து உருவாக்கப்பட்டது, வாரக்கணக்கில் கட்டமைக்க தேவையில்லை.',
      tagline: 'உங்கள் பைப்லைன் நிலைகள், உங்கள் ஃபீல்டுகள், உங்கள் ஃபாலோ-அப் தாளம் — உங்கள் வணிகத்திற்கு பொருந்தும் CRM, நீங்கள் சுருக்க வேண்டிய பெரிய கருவி அல்ல.',
      body: [
        'CRMகள் சிறு வணிகங்களை இரு பக்கங்களிலிருந்தும் ஏமாற்றுகின்றன: பெரிய தளங்கள் உங்களை செட்அப் மற்றும் ஒவ்வொரு-சீட் விலையில் மூழ்கடிக்கின்றன, நீங்கள் திரும்பும் ஸ்ப்ரெட்ஷீட் ஒரு சூடான லீட் இரண்டு வாரங்களாக மவுனமாக இருப்பதை நினைவூட்டாது. விளைவு மிகவும் விலையுயர்ந்த கசிவு — டீல்கள் போட்டியாளர்களால் அல்ல, மவுனத்தால் இழக்கப்படுகின்றன.',
        'ஐந்து பேர் கொண்ட வணிகத்திற்கு உண்மையில் தேவையானது சொந்த நிலைப் பெயர்களைக் கொண்ட ஒரு பைப்லைன், உங்கள் துறைக்கு முக்கியமான ஃபீல்டுகளைக் கொண்ட ஒரு தொடர்பு பதிவு, மற்றும் யாரைப் பின்தொடர வேண்டும் என்பதைக் காட்டும் இன்றைய-காட்சி. இது வெறும் ஒரு விவரிப்பு, WyberAi இதை உண்மையான டேட்டாபேஸில் இயங்கும் ஒரு வேலை செய்யும் CRM ஆக மாற்றுகிறது — உங்கள் அணிக்கான லாகின்களுடன், கிளையண்ட் டேட்டாவை போடுவதற்கு முன் ஒரு செக்யூரிட்டி ஸ்கேனுடன். உங்கள் செயல்முறை மாறும்போது, நீங்கள் ஆப்பை சாட்டில் மாற்றுகிறீர்கள், செட்டிங்ஸ் புதிரில் அல்ல.',
      ],
      features: [
        { title: 'உங்கள் நிலைகளுடன் பைப்லைன்', desc: 'Lead → Quoted → Won, அல்லது உங்கள் ஐந்து-நிலை பதிப்பு — நீங்கள் உண்மையில் எப்படி விற்கிறீர்கள் என்பதிலிருந்து உருவாக்கப்பட்ட கான்பான் பைப்லைன்.' },
        { title: 'தொடர்பு பதிவுகள், உங்கள் ஃபீல்டுகள்', desc: 'நிறுவனம், மூலம், பட்ஜெட், புதுப்பிப்பு தேதி, அளவுகள், ஒவ்வாமைகள் — உங்கள் வணிகம் கண்காணிப்பது எதுவாக இருந்தாலும், முதல் நாளிலிருந்தே ஸ்கீமாவில்.' },
        { title: 'ஃபாலோ-அப் இன்றைய காட்சி', desc: 'யாருடைய அடுத்த-நடவடிக்கை தேதி வந்துவிட்டதோ அல்லது யாருடைய டீல்கள் மவுனமாகிவிட்டதோ அந்த தொடர்புகளின் டாஷ்போர்டு — கசிவு-எதிர்ப்பு திரை.' },
        { title: 'குறிப்புகள் மற்றும் செயல்பாட்டு தடம்', desc: 'அழைப்புகள், சந்திப்புகள், மற்றும் மின்னஞ்சல்கள் தொடர்புக்கு எதிராக பதிவு செய்யப்படுகின்றன, எனவே அணியில் யாரும் உரையாடலைத் தொடரலாம்.' },
      ],
      promptExample: 'ஒரு சிறிய டிசைன் ஏஜென்சிக்கான CRM வெப் ஆப்பை உருவாக்குங்கள்: New Lead, Discovery, Proposal Sent, Won, மற்றும் Lost எனும் கான்பான் நிலைகளுடன் கூடிய Pipeline பக்கம், டீல்களுக்கு ஒரு மதிப்பு, தொடர்பு, மற்றும் அடுத்த-நடவடிக்கை தேதி இருக்கும்; நிறுவனம், பதவி, மூலம், மற்றும் குறிப்புகள் கொண்ட Contacts பக்கம்; மற்றும் அடுத்த-நடவடிக்கை தேதி இன்று அல்லது கடந்துவிட்ட டீல்களை பட்டியலிடும் Today பக்கம். அணி லாகினைச் சேர்க்கவும்.',
      faqs: [
        { q: 'இது HubSpot இலவச டையரை விட எப்படி சிறந்தது?', a: 'இது வேண்டுமென்றே சிறியது: உங்கள் ஃபீல்டுகள் மட்டும், உங்கள் நிலைகள் மட்டும், அப்கிரேட்-சுவர்கள் இல்லை — நீங்கள் ஒரு ஃபீச்சரை மீறும்போது, திட்டத்தை மாற்றுவதற்குப் பதிலாக அதை சாட்டில் சேர்க்கிறீர்கள்.' },
        { q: 'நான் எனது ஏற்கனவே உள்ள தொடர்புகளை இறக்குமதி செய்யலாமா?', a: 'உங்கள் ப்ராம்ப்ட்டில் அல்லது பின்னர் CSV இறக்குமதியைக் கேளுங்கள் — உங்கள் ஸ்ப்ரெட்ஷீட்டின் நெடுவரிசைகளை விவரியுங்கள், அவை தொடர்புகள் அட்டவணையில் மேப் ஆகும்.' },
        { q: 'உருவாக்கப்பட்ட ஆப்பில் கிளையண்ட் டேட்டா பாதுகாப்பானதா?', a: 'ஆப் அங்கீகாரம் மற்றும் row-level செக்யூரிட்டியுடன் வருகிறது, வெளியிடுவதற்கு முன் WyberAi ஒரு தாக்குபவரைப் போல லைவ் டேட்டாபேஸை ஆராய்கிறது — கடுமையான கசிவுகள் வெளியீட்டு நுழைவாயிலைத் தடுக்கும்.' },
        { q: 'எனது அணி இதை ஒரே நேரத்தில் பயன்படுத்தலாமா?', a: 'ஆம் — இது Postgres-இல் இயங்கும் உண்மையான பல-பயனர் வெப் ஆப். அனைவரும் லாகின் செய்கிறார்கள், மாற்றங்கள் முழு அணிக்கும் தெரியும்.' },
      ],
    },
    'inventory-management-app': {
      h1: 'AI மூலம் இன்வென்டரி மேனேஜ்மென்ட் ஆப்-ஐ உருவாக்குங்கள்',
      metaTitle: 'AI மூலம் இன்வென்டரி மேனேஜ்மென்ட் ஆப்-ஐ உருவாக்குங்கள்',
      metaDesc: 'உங்கள் கடைக்கான ஸ்டாக் நிலைகள், லோ-ஸ்டாக் எச்சரிக்கைகள், மற்றும் சப்ளையர் ரீஆர்டர் தகவல் — சாதாரண ஆங்கிலத்திலிருந்து உருவாக்கப்பட்ட இன்வென்டரி ஆப், ஒவ்வொரு-SKU தள கட்டணம் இல்லை.',
      tagline: 'அலமாரியில் உண்மையில் என்ன இருக்கிறது என்பதை அறியுங்கள், தீர்ந்துபோவதற்கு முன் எச்சரிக்கை பெறுங்கள், அதை விற்கும் சப்ளையரிடமிருந்து ரீஆர்டர் செய்யுங்கள் — ஒரே திரை, நோட்புக் குவியல் அல்ல.',
      body: [
        'சிறு சில்லறை விற்பனையாளர்களும் தயாரிப்பாளர்களும் ஐம்பது ஆண்டுகளுக்கு முன் இயங்கிய விதத்திலேயே இன்வென்டரியை இயக்குகிறார்கள் — கிளிப்போர்டில் எண்ணிக்கை, நினைவிலிருந்து முடிவு செய்யப்பட்ட ரீஆர்டர், கடைசி யூனிட் எப்போது விற்றது என்று தெரியாமல் ஒரு வாடிக்கையாளர் கேட்கும்போது கண்டறியப்படும் ஸ்டாக்அவுட். இதை சரிசெய்ய கட்டமைக்கப்பட்ட இன்வென்டரி தளங்கள் ஒவ்வொரு-SKU அல்லது ஒவ்வொரு-இடத்திற்கும் விலை நிர்ணயிக்கின்றன, இது நீங்கள் அடைய விரும்பும் வளர்ச்சியையே தண்டிக்கிறது.',
        'நீங்கள் என்ன ஸ்டாக் வைத்திருக்கிறீர்கள், எப்படி விற்கிறீர்கள் என்று விவரியுங்கள், WyberAi உங்கள் கடையைச் சுற்றி அமைப்பை உருவாக்குகிறது: விற்பனையும் விநியோகமும் பதிவாகும்போது மாறும் அளவுகளுடன் ஒரு தயாரிப்பு பட்டியல், தீர்வதற்கு முன் ரீஆர்டர் தேவைப்படுவதைக் குறிக்கும் லோ-ஸ்டாக் காட்சி, மற்றும் ஒவ்வொரு பொருளுடன் இணைக்கப்பட்ட சப்ளையர் விவரங்கள் இதனால் ரீஆர்டர் செய்வது ஒரு தேடல், நினைவாற்றல் சோதனை அல்ல. ஒரு இடமோ மூன்றோ, சில்லறையோ மூலப்பொருளோ — வடிவம் உங்கள் விவரிப்பைப் பின்பற்றுகிறது.',
      ],
      features: [
        { title: 'நேரலை ஸ்டாக் நிலைகள்', desc: 'விற்பனையும் விநியோகமும் பதிவாகும்போது அப்டேட் ஆகும் அளவுடன் ஒவ்வொரு தயாரிப்பும் — இனி வார இறுதி மறு-எண்ணிக்கை இல்லை.' },
        { title: 'லோ-ஸ்டாக் எச்சரிக்கைகள்', desc: 'ஒவ்வொரு தயாரிப்புக்கும் ஒரு ரீஆர்டர் வரம்பை அமைக்கவும்; அதற்குக் கீழே உள்ளது ஸ்டாக்அவுட் ஆவதற்கு முன் டாஷ்போர்டில் தெரியும்.' },
        { title: 'ஒவ்வொரு பொருளுக்கும் சப்ளையர் தகவல்', desc: 'சப்ளையர் பெயர், தொடர்பு, மற்றும் செலவு விலை ஒவ்வொரு தயாரிப்புடனும் இணைக்கப்பட்டுள்ளன — ரீஆர்டர் செய்வது ஒரு தேடலில் தொடங்குகிறது, மின்னஞ்சலில் தேடுவதில் அல்ல.' },
        { title: 'பல-இட ஆதரவு', desc: 'ஒவ்வொரு கடை அல்லது கிடங்கின் ஸ்டாக்கையும் தனித்தனியாக கண்காணிக்கவும், அல்லது ஒரு மொத்த எண்ணிக்கையாக இணைக்கவும் — உங்கள் வணிகம் உண்மையில் எப்படி இயங்குகிறதோ அப்படியே விவரிக்கப்பட்டுள்ளது.' },
      ],
      promptExample: 'இன்வென்டரி மேனேஜ்மென்ட் வெப் ஆப்பை உருவாக்குங்கள்: SKU, கையிருப்பு அளவு, ரீஆர்டர் வரம்பு, செலவு விலை, மற்றும் சப்ளையர் பெயருடன் பொருட்களை பட்டியலிடும் Products பக்கம்; ரீஆர்டர் வரம்புக்குக் கீழே உள்ள தயாரிப்புகளை ஹைலைட் செய்யும் Dashboard; விற்பனை மற்றும் வரும் விநியோகங்களைப் பதிவு செய்யும், அளவுகளை சரிசெய்யும் Stock Movement பக்கம்; மற்றும் அவர்கள் வழங்கும் தயாரிப்புகளுடன் இணைக்கப்பட்ட தொடர்பு விவரங்கள் கொண்ட Suppliers பக்கம்.',
      faqs: [
        { q: 'இது பார்கோடுகளை கையாள முடியுமா?', a: 'உங்கள் ப்ராம்ப்ட்டில் ஒவ்வொரு தயாரிப்புக்கும் ஒரு பார்கோடு ஃபீல்டைச் சேர்க்கவும்; லைவ் ஆனதும் அதை ஃபோன் கேமரா ஸ்கேனருடன் இணைப்பது சாட்டில் ஒரு எடிட்.' },
        { q: 'நான் ஒன்றுக்கு மேற்பட்ட கடைகளில் ஸ்டாக்கைக் கண்காணிக்கலாமா?', a: 'ஆம் — உங்கள் இடங்களை விவரியுங்கள், அளவுகளை ஒவ்வொரு இடத்திற்கும் கண்காணிக்க முடியும், டாஷ்போர்டில் ஒரு ஒருங்கிணைந்த மொத்த காட்சியுடன்.' },
        { q: 'இது கொள்முதல் ஆர்டர்களை உருவாக்குமா?', a: 'ஒரு கொள்முதல்-ஆர்டர் பக்கத்தைக் கேளுங்கள், லோ-ஸ்டாக் பொருட்களை ஒரே கிளிக்கில் அவற்றின் சப்ளையருக்கு முகவரியிடப்பட்ட POவாக மாற்றலாம்.' },
        { q: 'இது ஒரு இன்வென்டரி SaaS-ஐ விட மலிவானதா?', a: 'நீங்கள் இதை இலவச மாதாந்திர கிரெடிட்களுடன் ஒருமுறை உருவாக்குகிறீர்கள், இது உங்களுடையதாகிறது — உங்கள் கேட்டலாக் வளரும்போது ஒவ்வொரு-SKU அல்லது ஒவ்வொரு-இட மாதாந்திர கட்டணம் இல்லை.' },
      ],
    },
    'rental-property-manager': {
      h1: 'AI மூலம் ரென்டல் ப்ராப்பர்ட்டி மேனேஜரை உருவாக்குங்கள்',
      metaTitle: 'AI மூலம் ரென்டல் ப்ராப்பர்ட்டி மேனேஜ்மென்ட் ஆப்-ஐ உருவாக்குங்கள்',
      metaDesc: 'உங்கள் வாடகைகளுக்கான யூனிட்கள், வாடகைதாரர்கள், வாடகை கண்காணிப்பு, மற்றும் பராமரிப்பு கோரிக்கைகள் — சாதாரண ஆங்கிலத்திலிருந்து உருவாக்கப்பட்ட ப்ராப்பர்ட்டி மேனேஜர் ஆப், ஒவ்வொரு-யூனிட் கட்டணம் இல்லை.',
      tagline: 'ஒவ்வொரு யூனிட், அதில் யார் இருக்கிறார்கள், இந்த மாதம் வாடகை வந்ததா, என்ன பழுதடைந்துள்ளது — ஒரே டாஷ்போர்டில் நில உரிமையாளரின் முழு செயல்பாடு.',
      body: [
        'சில யூனிட்கள் கொண்ட நில உரிமையாளர்கள் வங்கி அறிக்கைகள், கசியும் குழாய் பற்றிய குறுஞ்செய்திகள், யார் செலுத்தினார்கள் யார் ஒரு வாரம் தாமதமாகிவிட்டார்கள் என்ற நினைவாற்றலின் கலவையில் வணிகத்தை நடத்துகிறார்கள். ப்ராப்பர்ட்டி மேனேஜ்மென்ட் மென்பொருள் உள்ளது, ஆனால் அது நூற்றுக்கணக்கான யூனிட்களின் போர்ட்ஃபோலியோக்களுக்காக விலை நிர்ணயிக்கப்பட்டு கட்டமைக்கப்பட்டுள்ளது, உண்மையில் உங்களிடம் உள்ள நான்கு டூப்ளக்ஸ்களுக்கு அல்ல.',
        'உங்கள் ப்ராப்பர்ட்டிகளையும் அவற்றை எப்படி நிர்வகிக்கிறீர்கள் என்பதையும் விவரியுங்கள், WyberAi இந்த செயல்பாட்டை ஒரு ஆப்பாக உருவாக்குகிறது: யூனிட்கள் மற்றும் வாடகைதாரர்களின் பட்டியல், இந்த சுழற்சியில் யார் செலுத்தினார்கள் யார் இல்லை என்பதைக் காட்டும் வாடகை லெட்ஜர், மற்றும் நீங்கள் மறக்கும் வரை புகாரளிக்கப்பட்ட பிரச்சனை குறுஞ்செய்தி தொடரில் தங்காமல் இருக்க ஒரு பராமரிப்பு போர்டு. குத்தகை புதுப்பிப்பு தேதிகள் உங்கள் மீது விழுவதற்கு முன் தெரியும், பின்னர் அல்ல.',
      ],
      features: [
        { title: 'யூனிட்கள் மற்றும் வாடகைதாரர்கள்', desc: 'தற்போதைய வாடகைதாரர், குத்தகை தொடக்க மற்றும் முடிவு தேதிகள், மற்றும் மாதாந்திர வாடகையுடன் ஒவ்வொரு ப்ராப்பர்ட்டியும் யூனிட்டும்.' },
        { title: 'வாடகை கட்டண பதிவு', desc: 'ஒவ்வொரு யூனிட்டுக்கும் ஒவ்வொரு மாத வாடகை கிடைத்ததை குறிக்கவும்; யார் தற்போதைய நிலையில் உள்ளார்கள் யார் தாமதமாக உள்ளார்கள் என்பதை ஒரே பார்வையில் டாஷ்போர்டு காட்டுகிறது.' },
        { title: 'பராமரிப்பு கோரிக்கை போர்டு', desc: 'வாடகைதாரர்கள் (அல்லது நீங்கள்) நிலையுடன் பிரச்சனைகளைப் பதிவு செய்கிறார்கள் — புகாரளிக்கப்பட்டது, முன்னேற்றத்தில், சரிசெய்யப்பட்டது — எதுவும் குறுஞ்செய்தி தொடரில் தொலைந்துவிடாது.' },
        { title: 'குத்தகை காலாவதி நினைவூட்டல்கள்', desc: 'முடிவு தேதியை நெருங்கும் குத்தகைகள் டாஷ்போர்டில் தெரிகின்றன, புதுப்பிக்க அல்லது யூனிட்டை மீண்டும் பட்டியலிட உங்களுக்கு நேரம் கொடுக்கிறது.' },
      ],
      promptExample: 'ஒரு ரென்டல் ப்ராப்பர்ட்டி மேனேஜ்மென்ட் வெப் ஆப்பை உருவாக்குங்கள்: வாடகைதாரர் பெயர், குத்தகை தொடக்க/முடிவு தேதி, மற்றும் மாதாந்திர வாடகையுடன் யூனிட்களை பட்டியலிடும் Properties பக்கம்; ஒவ்வொரு யூனிட்டுக்கும் ஒவ்வொரு மாதமும் பெறப்பட்ட கட்டணங்களை தாமத குறிகாட்டியுடன் குறிக்கும் Rent Ledger பக்கம்; ஒவ்வொரு யூனிட்டுக்கும் நிலையுடன் (புகாரளிக்கப்பட்டது, முன்னேற்றத்தில், சரிசெய்யப்பட்டது) பிரச்சனைகளைப் பதிவு செய்யும் Maintenance பக்கம்; மற்றும் அடுத்த 60 நாட்களில் காலாவதியாகும் குத்தகைகளை ஹைலைட் செய்யும் Dashboard.',
      faqs: [
        { q: 'வாடகைதாரர்கள் தாங்களாகவே பராமரிப்பு கோரிக்கைகளைச் சமர்ப்பிக்கலாமா?', a: 'ஆம் — ஒரு வாடகைதாரர் லாகின் மற்றும் கோரிக்கை படிவத்தைச் சேர்க்கவும், அவர்கள் சமர்ப்பிக்கும் பிரச்சனைகள் நேரடியாக உங்கள் பராமரிப்பு போர்டில் வரும்.' },
        { q: 'இது தாமத கட்டணங்களை கணக்கிட முடியுமா?', a: 'உங்கள் ப்ராம்ப்ட்டில் உங்கள் தாமத-கட்டண விதியை விவரியுங்கள், ஒரு கட்டணம் அதன் நிலுவைத் தேதியைக் கடந்ததும் வாடகை லெட்ஜர் இதை தானாகவே பயன்படுத்தும்.' },
        { q: 'இது ஒன்றுக்கு மேற்பட்ட ப்ராப்பர்ட்டிக்கு வேலை செய்யுமா?', a: 'ஆம் — அமைப்பு ஒரு டூப்ளக்ஸிலிருந்து ஒரு போர்ட்ஃபோலியோ வரை அளவிடப்படும்; ஒவ்வொரு ப்ராப்பர்ட்டிக்கும் சொந்த யூனிட்கள், வாடகைதாரர்கள், மற்றும் லெட்ஜர் உள்ளது.' },
        { q: 'வாடகைதாரர் தரவு பாதுகாப்பானதா?', a: 'ஆப் அதன் சொந்த டேட்டாபேஸில் row-level செக்யூரிட்டியுடன் இயங்குகிறது, வெளியிடுவதற்கு முன் நேரலையில் ஸ்கேன் செய்யப்படுகிறது — வாடகைதாரர் விவரங்கள் பொதுவில் வெளிப்படாது.' },
      ],
    },
    'ecommerce-seller-dashboard': {
      h1: 'AI மூலம் ஈகாமர்ஸ் விற்பனையாளர் டாஷ்போர்டை உருவாக்குங்கள்',
      metaTitle: 'AI மூலம் ஈகாமர்ஸ் விற்பனையாளர் டாஷ்போர்டை உருவாக்குங்கள் — கோட் இல்லாமல்',
      metaDesc: 'Amazon, Shopify, மற்றும் Etsy-இல் ஆர்டர்கள், மார்ஜின், மற்றும் ஸ்டாக் ஒரே டாஷ்போர்டில் — சாதாரண ஆங்கிலத்திலிருந்து உருவாக்கப்பட்டது, ஒவ்வொரு-சேனல் தள கட்டணம் இல்லை.',
      tagline: 'நீங்கள் விற்கும் ஒவ்வொரு சேனலுக்கும் ஒரு டாஷ்போர்டு — ஒவ்வொரு ஆர்டருக்கும் உண்மையான மார்ஜின், பொய் சொல்லாத ஸ்டாக், நீங்கள் ஒரு மார்க்கெட்பிளேஸைச் சேர்க்கும் ஒவ்வொரு முறையும் புதிய சப்ஸ்கிரிப்ஷன் இல்லை.',
      body: [
        'ஒன்றுக்கு மேற்பட்ட சேனல்களில் விற்கவும் — Amazon, Shopify, Etsy, உங்கள் சொந்த ஸ்டோர்ஃப்ரண்ட் — உங்களுக்கு ஒவ்வொன்றுக்கும் வெவ்வேறு லாகின், வெவ்வேறு அறிக்கை வடிவம், மற்றும் "லாபம்" என்பதற்கு வெவ்வேறு வரையறை கிடைக்கும். மாத இறுதியில் இவற்றை ஒரு படமாக இணைப்பது என்பது பொதுவாக மூன்று இடங்களிலிருந்து ஸ்ப்ரெட்ஷீட்களை ஏற்றுமதி செய்து வகைகள் பொருந்தும் என்று நம்புவதாகும்.',
        'நீங்கள் உண்மையில் எப்படி விற்கிறீர்கள் என்று விவரியுங்கள் — எந்த சேனல்கள், ஒவ்வொன்றும் எவ்வளவு கட்டணம் எடுக்கிறது, ஒவ்வொரு ஆர்டருக்கும் மார்ஜின் பற்றி நீங்கள் எப்படி நினைக்கிறீர்கள் — WyberAi அதைச் சுற்றி டாஷ்போர்டை உருவாக்குகிறது: எந்த சேனலிலிருந்தும் ஆர்டர்களைப் பதிவு செய்ய ஒரே இடம், விற்பனை நடந்த இடத்திற்கு குறிப்பிட்ட கட்டணங்களையும் செலவுகளையும் கழிக்கும் மார்ஜின் காட்சி, மற்றும் நீங்கள் ஒரே இடத்தில் மட்டும் விற்கிறீர்கள் என்று கருதாத ஸ்டாக் படம். பின்னர் ஒரு சேனலைச் சேர்ப்பது ஒரு ப்ராம்ப்ட் தூரத்தில் உள்ளது, புதிய சப்ஸ்கிரிப்ஷன் அல்ல.',
      ],
      features: [
        { title: 'ஒரு ஃபீட், ஒவ்வொரு சேனல்', desc: 'முழு படத்தையும் இணைக்க டேப்களை மாற்றுவதற்குப் பதிலாக Amazon, Shopify, Etsy, அல்லது உங்கள் சொந்த ஸ்டோரிலிருந்து ஆர்டர்களை ஒரே இடத்தில் பதிவு செய்யுங்கள்.' },
        { title: 'ஒவ்வொரு ஆர்டருக்கும் உண்மையான மார்ஜின்', desc: 'ஒவ்வொரு சேனலின் கட்டண சதவீதத்தையும் உங்கள் செலவு விலையையும் இணைக்கவும், மார்ஜின் ஒவ்வொரு ஆர்டருக்கும் கணக்கிடப்படுகிறது — கலவை சராசரியிலிருந்து யூகிக்கப்படாமல்.' },
        { title: 'சேனல்கள் முழுவதும் ஸ்டாக்', desc: 'ஒரு தயாரிப்பு மூன்று இடங்களில் விற்கப்பட்டாலும் அதற்கு கையிருப்பில் ஒரே அளவு உள்ளது, எனவே மற்றொரு சேனல் ஏற்கனவே விற்றதை நீங்கள் அதிகமாக விற்க மாட்டீர்கள்.' },
        { title: 'உங்கள் கேட்டலாக்குடன் வளர்கிறது, அதற்கு எதிராக அல்ல', desc: 'அளவிடும்போது அதிகரிக்கும் ஒவ்வொரு-ஆர்டர் அல்லது ஒவ்வொரு-சேனல் கட்டணம் இல்லை — நீங்கள் இதை இலவச கிரெடிட்களுடன் ஒருமுறை உருவாக்குகிறீர்கள், இது உங்களுடையதாகிறது.' },
      ],
      promptExample: 'ஈகாமர்ஸ் விற்பனையாளர் டாஷ்போர்டு வெப் ஆப்பை உருவாக்குங்கள்: ஒவ்வொரு விற்பனையையும் அது வந்த சேனல் (Amazon, Shopify, Etsy, அல்லது கஸ்டம்), விற்பனை விலை, சேனல் கட்டணம், மற்றும் செலவு விலையுடன் பதிவு செய்யும் Orders பக்கம்; மொத்த வருவாய், கட்டணங்கள், மற்றும் நிகர மார்ஜினை சேனல் மற்றும் மாதம் வாரியாக பிரித்துக் காட்டும் Dashboard பக்கம்; அனைத்து சேனல்களிலும் பகிரப்பட்ட ஸ்டாக் அளவை லோ-ஸ்டாக் குறிகாட்டியுடன் கண்காணிக்கும் Products பக்கம்; மற்றும் நீங்கள் விற்கும் ஒவ்வொரு இடத்திற்கும் கட்டண சதவீதத்தைச் சேர்க்க அல்லது எடிட் செய்ய Channels பக்கம்.',
      faqs: [
        { q: 'இது நேரடியாக எனது Amazon அல்லது Shopify கணக்குடன் இணைக்குமா?', a: 'முதலில் இல்லை — இது describe-your-numbers டாஷ்போர்டு, எனவே நீங்களே ஆர்டர்களைப் பதிவு செய்யலாம் அல்லது ஒட்டலாம். இது மாறக்கூடிய அல்லது ரத்து செய்யப்படக்கூடிய மார்க்கெட்பிளேஸ் APIயை சார்ந்திருப்பதைத் தவிர்க்கிறது; உங்கள் ப்ராம்ப்ட்டில் ஒரு பல்க்-பேஸ்ட் அல்லது CSV-இறக்குமதி திரையைக் கேளுங்கள், அதைச் சேர்க்கலாம்.' },
        { q: 'இது மூன்றுக்கு மேற்பட்ட சேனல்களை கையாள முடியுமா?', a: 'ஆம் — Channels பக்கம் நீங்கள் விவரிக்கும் எத்தனை சேனல்களையும் கொண்டிருக்கும், ஒவ்வொன்றும் சொந்த கட்டண சதவீதத்துடன், டாஷ்போர்டு அனைத்தையும் ஒரே மார்ஜின் காட்சியில் இணைக்கும்.' },
        { q: 'எனக்கு எனது சொந்த வலைத்தளம் அல்லது ஹோஸ்டிங் தேவையா?', a: 'இல்லை — வெளியிடுங்கள், இது உடனடியாக ஒரு இலவச wyberai.app சப்டொமைனில் நேரலையாகும்; விரும்பினால் பின்னர் உங்கள் சொந்த டொமைனை இணைக்கவும்.' },
        { q: 'இது ஒரு பல-சேனல் விற்பனையாளர் கருவியை விட மலிவானதா?', a: 'நீங்கள் இதை இலவச மாதாந்திர கிரெடிட்களுடன் ஒருமுறை உருவாக்கி முழுமையாக சொந்தமாக்கிக் கொள்கிறீர்கள் — உங்கள் விற்பனை வளரும்போது அதிகரிக்கும் ஒவ்வொரு-ஆர்டர் அல்லது ஒவ்வொரு-சேனல் கட்டணம் இல்லை.' },
      ],
    },
  },
}
