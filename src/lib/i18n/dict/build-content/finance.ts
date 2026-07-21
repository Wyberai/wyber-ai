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
// content for the "finance" category /build/[slug] pages (English source:
// src/app/build/data/finance.ts). Proper nouns, brand names, and tech terms
// (WyberAi, CSV, Postgres) are left untranslated across every locale — only
// the surrounding prose is translated. slug/target/category/related live on
// BuildPage itself and aren't duplicated here.
export const FINANCE_BUILD_CONTENT: Record<Locale, Record<string, TranslatedBuildPage>> = {
  en: {
    'expense-tracker-app': {
      h1: 'Build an Expense Tracker App with AI',
      metaTitle: 'Build an Expense Tracker App with AI — No Code',
      metaDesc: 'Track spending by category, split business from personal, and see where the month went — an expense tracker generated from a plain-English description.',
      tagline: 'Your categories, your currencies, your tax season — an expense tracker that fits how your money actually moves.',
      body: [
        'Expense apps come in two flavors that both miss: bank-linked apps that auto-categorize "Amazon" into mystery, and minimalist trackers that can\'t answer the one question that matters in April — which of these were business expenses, and where are the receipts?',
        'Describe how you actually track money — the categories you think in, whether freelance expenses need separating, what report your accountant asks for — and WyberAi generates that tracker: quick entry with your categories, a monthly dashboard that shows the shape of your spending, and an export view built for tax time. Recurring bills, multiple currencies for travel, a receipts photo field — say the word and the schema has it.',
      ],
      features: [
        { title: 'Fast entry, your categories', desc: 'Amount, category, note, done — with the category list you defined, not a bank\'s guess.' },
        { title: 'Business / personal split', desc: 'Flag any expense as business; tax-season reports filter to exactly what your accountant needs.' },
        { title: 'Monthly dashboard', desc: 'Spending by category for any month, with trend lines that show which category is creeping.' },
        { title: 'Recurring expenses', desc: 'Rent, subscriptions, insurance — logged automatically each cycle so the picture stays complete.' },
      ],
      promptExample: 'Build an expense tracker web app: an Add Expense form with amount, category (my custom list), date, an optional note, a business/personal toggle, and an optional receipt photo; a Dashboard showing this month\'s total and a category breakdown chart with comparison to last month; and a Reports page filtering business expenses by date range with CSV export.',
      faqs: [
        { q: 'Can it handle more than one currency?', a: 'Yes — add a currency per expense in your prompt, set a home currency, and totals convert at rates you control.' },
        { q: 'Can I attach receipts?', a: 'Add a photo field to expenses and each entry stores its receipt image — tax-season you will thank present-day you.' },
        { q: 'Does it connect to my bank?', a: 'Generated apps don\'t link to bank feeds out of the box — this is a deliberate-entry tracker, which is also why its categories are always right.' },
        { q: 'What does building it cost?', a: 'The 50 free monthly credits cover your first build (30 credits); after that, changes are 2-credit edits. No card needed to start.' },
      ],
    },
    'budget-planner-app': {
      h1: 'Build a Budget Planner App with AI',
      metaTitle: 'Build a Budget Planning App with AI — No Code',
      metaDesc: 'Envelope budgets, savings goals, and a real answer to "can we afford this?" — a household budget app generated from your description in minutes.',
      tagline: 'Give every rupee or dollar a job at the start of the month, and know mid-month exactly what\'s left in each envelope.',
      body: [
        'Budgeting methods work; budgeting tools are where households fall off. The spreadsheet needs a maintainer, the popular apps charge monthly to enforce someone else\'s methodology, and couples end up with the oldest sync problem there is — two people, one pool of money, no shared picture.',
        'Whether you run envelopes, 50/30/20, or a simple "bills, fun, save" split, WyberAi builds the planner around your method: monthly category budgets, spending logged against them, and a shared view both partners can update. The mid-month glance — three green envelopes, one amber, one red — replaces both the spreadsheet and the argument.',
      ],
      features: [
        { title: 'Envelope-style budgets', desc: 'Set an amount per category each month; every expense draws down its envelope with a visible remaining balance.' },
        { title: 'Shared household view', desc: 'Two logins, one budget — both partners log spending and see the same real-time picture.' },
        { title: 'Savings goals', desc: 'Emergency fund, holiday, new laptop — goals with targets and monthly contributions tracked to a date.' },
        { title: 'Month rollover', desc: 'Close the month, carry over (or reset) unspent balances by rule, and start the next one in one click.' },
      ],
      promptExample: 'Build a household budget planner web app: a Budget page where we set monthly amounts per category (rent, groceries, transport, fun, savings) shown as envelopes with spent and remaining; a quick Add Expense form that draws from an envelope; a Goals page with savings targets, monthly contributions, and projected completion dates; and support for two user accounts sharing one budget.',
      faqs: [
        { q: 'Can both my partner and I use it?', a: 'Yes — it generates with authentication, and a shared-household structure means you both see and update the same budget live.' },
        { q: 'What happens to leftover money at month end?', a: 'Your choice of rule: roll unspent balances into next month\'s envelope, sweep them to a savings goal, or reset — set it in the prompt or change it in chat.' },
        { q: 'Can it do the 50/30/20 method instead of envelopes?', a: 'Yes — describe the method you follow and the budget structure, math, and dashboard are generated to match it.' },
        { q: 'Is our financial data private?', a: 'The app runs on its own Postgres database with row-level security, and WyberAi\'s live scan probes it as an attacker would before you publish.' },
      ],
    },
    'subscription-tracker': {
      h1: 'Build a Subscription Tracker App with AI',
      metaTitle: 'Build a Subscription Tracker App with AI — No Code',
      metaDesc: 'Every recurring charge in one place: renewal calendar, monthly total, and cancel-by dates. Built from a plain-English prompt — free to start.',
      tagline: 'The app that answers "wait, we pay for THAT?" — every recurring charge, its renewal date, and the monthly damage in one view.',
      body: [
        'Nobody decides to spend three hundred a month on subscriptions; it accumulates one free trial at a time, across two app stores, a few websites, and someone else\'s Netflix password becoming your Netflix bill. The forgetting is the business model — annual renewals are priced on the bet that you won\'t remember the date.',
        'A subscription tracker is a small, sharp tool: every recurring charge with its amount, cycle, and renewal date; a calendar of what\'s about to hit; and a running monthly total that makes the accumulation visible. WyberAi generates it from a one-paragraph description — and because the renewal dates live in your own database, adding a "cancel by" warning window or a price-hike history is an edit in chat, not a feature request to a company monetizing your forgetfulness.',
      ],
      features: [
        { title: 'All charges, one ledger', desc: 'Streaming, SaaS, gym, domains, insurance — each with amount, billing cycle, payment method, and category.' },
        { title: 'Renewal calendar', desc: 'What charges when, this month and next — annual renewals stop being ambushes.' },
        { title: 'True monthly total', desc: 'Annual and quarterly plans normalized to a monthly figure, so the real run-rate is one number.' },
        { title: 'Cancel-by warnings', desc: 'A flagged window before each renewal — the days when cancelling actually saves the charge.' },
      ],
      promptExample: 'Build a subscription tracker web app: a Subscriptions page listing each service with name, price, billing cycle (monthly/quarterly/yearly), next renewal date, payment method, and category; a Dashboard showing the normalized monthly total, a category breakdown, and the next 30 days of upcoming renewals; and an Insights page ranking subscriptions by yearly cost with a "last used" field I update manually.',
      faqs: [
        { q: 'Can it remind me before a renewal?', a: 'The upcoming-renewals view highlights anything inside your warning window; ask chat to add email reminders when you publish if you want a push.' },
        { q: 'Does it detect subscriptions from my bank account?', a: 'No — entries are deliberate, which takes ten minutes to set up and means the list is complete and correct, including the ones hiding in app stores.' },
        { q: 'Can it track shared family subscriptions?', a: 'Yes — add a "shared with" or per-person split field in your prompt and the monthly total can show your share versus the household\'s.' },
        { q: 'Why not use a spreadsheet?', a: 'The tracker is what the spreadsheet becomes when it maintains its own renewal calendar, normalizes cycles into one total, and looks decent on your phone.' },
      ],
    },
    'debt-payoff-tracker': {
      h1: 'Build a Debt Payoff Tracker with AI',
      metaTitle: 'Build a Debt Payoff Tracker App with AI',
      metaDesc: 'Snowball or avalanche method, a progress bar per debt, and a real payoff date — a debt tracker generated from plain English, not a generic calculator.',
      tagline: 'Every debt, its balance, and a real projected payoff date — the snowball or avalanche method as software, not a static calculator you re-run by hand.',
      body: [
        'Paying off multiple debts is a math problem with a psychology problem riding on top: the avalanche method saves the most interest, the snowball method keeps you motivated by clearing small balances first, and most people fall off because a spreadsheet doesn\'t update itself or make progress feel real. One-off online calculators answer the question once and then forget you.',
        'Describe your debts and which method you want to follow, and WyberAi builds a live tracker: every debt with its balance, rate, and minimum payment, an extra-payment field that lets you see the payoff date move when you throw more at it, and a progress bar per debt that fills as the balance drops. It recalculates every time you log a payment — the plan stays honest instead of going stale in a downloaded spreadsheet.',
      ],
      features: [
        { title: 'All debts in one place', desc: 'Credit cards, loans, and balances with their interest rate and minimum payment — the full picture in one list.' },
        { title: 'Snowball or avalanche', desc: 'Pick smallest-balance-first or highest-interest-first, and the app orders your payoff priority accordingly.' },
        { title: 'Extra-payment projections', desc: 'Add extra to any month and see the payoff date and total interest recalculate immediately.' },
        { title: 'Progress bar per debt', desc: 'Each debt shows original balance versus remaining — the visual that keeps momentum through a long payoff.' },
      ],
      promptExample: 'Build a debt payoff tracker web app: a Debts page listing each debt with balance, interest rate, and minimum payment, orderable by snowball (smallest balance first) or avalanche (highest rate first); a Plan page where I enter an extra monthly payment amount and see a projected total payoff date and interest paid; and a Progress page with a bar per debt showing original balance versus current balance.',
      faqs: [
        { q: 'Which method should I use, snowball or avalanche?', a: 'Avalanche saves more interest mathematically; snowball tends to keep people motivated with early wins. The tracker supports either — switch anytime and the payoff order updates.' },
        { q: 'Does it recalculate when I make a payment?', a: 'Yes — log a payment against any debt and the remaining balance, progress bar, and projected payoff date update immediately.' },
        { q: 'Can it account for different interest rates changing over time?', a: 'Add a rate-change field if you have a promotional rate ending, and describe the schedule in your prompt — the projection follows it.' },
        { q: 'Is this different from a one-time payoff calculator?', a: 'Yes — this is a living tracker tied to your actual balances and payments, not a static result you have to manually recompute every month.' },
      ],
    },
    'roommate-expense-splitter': {
      h1: 'Build a Roommate Expense Splitter with AI',
      metaTitle: 'Build a Roommate Bill Splitter App with AI',
      metaDesc: 'Shared bills, auto-split calculations, and a running who-owes-who balance — a roommate expense app generated from plain English, no ads, no fees.',
      tagline: 'Log the shared grocery run once, and the app remembers who owes what — instead of a group chat doing long division at midnight.',
      body: [
        'Every shared household re-invents the same broken system: someone pays for groceries, someone else covers the electric bill, and reconciling who actually owes whom turns into a group-chat argument nobody enjoys. The popular splitting apps work, but they\'re built for one-off trip expenses and bury the recurring-household use case behind ads and premium tiers.',
        'Describe your household — how many people, how bills usually get split — and WyberAi builds the ledger around it: a shared expense log where anyone can add a charge and how it splits, a running balance per roommate so "who owes who" is a glance, not a calculation, and a settle-up flow for when someone finally pays their share back.',
      ],
      features: [
        { title: 'Shared expense log', desc: 'Anyone in the household logs a charge — groceries, utilities, rent — with who paid and how it splits.' },
        { title: 'Flexible split rules', desc: 'Even split, custom percentages, or "just these two people" — the split is set per expense, not forced to one rule.' },
        { title: 'Running balance per person', desc: 'A live view of who owes whom and how much, updated the instant a new expense lands.' },
        { title: 'Settle-up tracking', desc: 'Mark a debt as settled when it\'s paid back in cash or transfer, clearing the balance without deleting the history.' },
      ],
      promptExample: 'Build a roommate expense splitter mobile app for a 3-person household: an Add Expense screen where anyone logs a charge with amount, description, who paid, and how it splits (even, custom percentages, or specific people); a Balances screen showing a running total of who owes whom across the household; and a Settle Up screen to mark a debt as paid, which clears the balance while keeping the expense history.',
      faqs: [
        { q: 'Can it handle uneven splits, like one person\'s guest?', a: 'Yes — set a custom split per expense, so a dinner where only two of three roommates ate splits between just those two.' },
        { q: 'Does it work for more than roommates — trips too?', a: 'The same structure fits any shared-expense group; describe your use case (a trip, a shared subscription) and the split logic follows.' },
        { q: 'Can someone leave the household and settle their final balance?', a: 'Yes — a final settle-up clears their balance to zero, and their historical expenses stay in the log for reference.' },
        { q: 'Is it free to use with my roommates?', a: 'Yes — no ads, no per-transaction fee. Building uses free monthly credits, and the app runs as yours from then on.' },
      ],
    },
  },
  hi: {
    'expense-tracker-app': {
      h1: 'AI से एक्सपेंस ट्रैकर ऐप बनाएं',
      metaTitle: 'AI से एक्सपेंस ट्रैकर ऐप बनाएं — बिना कोड',
      metaDesc: 'कैटेगरी के हिसाब से ख़र्च ट्रैक करें, बिज़नेस को पर्सनल से अलग करें, और देखें महीना कहां गया — सादी अंग्रेज़ी विवरण से जनरेट किया गया एक्सपेंस ट्रैकर।',
      tagline: 'आपकी कैटेगरीज़, आपकी करेंसीज़, आपका टैक्स सीज़न — एक एक्सपेंस ट्रैकर जो आपका पैसा असल में जैसे चलता है उसके हिसाब से बना है।',
      body: [
        'एक्सपेंस ऐप्स दो तरह के आते हैं जो दोनों चूक जाते हैं: बैंक-लिंक्ड ऐप्स जो "Amazon" को रहस्य में ऑटो-कैटेगराइज़ करते हैं, और मिनिमलिस्ट ट्रैकर्स जो अप्रैल में मायने रखने वाले एक सवाल का जवाब नहीं दे सकते — इनमें से कौन से बिज़नेस एक्सपेंस थे, और रसीदें कहां हैं?',
        'आप असल में पैसे को कैसे ट्रैक करते हैं यह बताएं — जिन कैटेगरीज़ में आप सोचते हैं, फ़्रीलांस एक्सपेंस अलग करने चाहिए या नहीं, आपका अकाउंटेंट कौन सी रिपोर्ट मांगता है — और WyberAi वह ट्रैकर जनरेट करता है: आपकी कैटेगरीज़ के साथ तेज़ एंट्री, एक मासिक डैशबोर्ड जो आपके ख़र्च का आकार दिखाए, और टैक्स टाइम के लिए बना एक एक्सपोर्ट व्यू। बार-बार होने वाले बिल्स, ट्रैवल के लिए कई करेंसीज़, एक रसीद फ़ोटो फ़ील्ड — बोल दें और स्कीमा में यह होगा।',
      ],
      features: [
        { title: 'तेज़ एंट्री, आपकी कैटेगरीज़', desc: 'अमाउंट, कैटेगरी, नोट, हो गया — आपकी तय की गई कैटेगरी लिस्ट के साथ, किसी बैंक के अंदाज़े से नहीं।' },
        { title: 'बिज़नेस / पर्सनल स्प्लिट', desc: 'किसी भी एक्सपेंस को बिज़नेस के तौर पर फ़्लैग करें; टैक्स-सीज़न रिपोर्ट्स ठीक वही फ़िल्टर करती हैं जो आपके अकाउंटेंट को चाहिए।' },
        { title: 'मासिक डैशबोर्ड', desc: 'किसी भी महीने के लिए कैटेगरी के हिसाब से ख़र्च, ट्रेंड लाइन्स के साथ जो दिखाएं कौन सी कैटेगरी बढ़ रही है।' },
        { title: 'बार-बार होने वाले एक्सपेंस', desc: 'किराया, सब्सक्रिप्शन्स, इंश्योरेंस — हर साइकिल में ऑटोमैटिक लॉग होते हैं ताकि तस्वीर पूरी रहे।' },
      ],
      promptExample: 'एक एक्सपेंस ट्रैकर वेब ऐप बनाएं: अमाउंट, कैटेगरी (मेरी कस्टम लिस्ट), तारीख़, एक ऑप्शनल नोट, एक बिज़नेस/पर्सनल टॉगल, और एक ऑप्शनल रसीद फ़ोटो वाला एक Add Expense फ़ॉर्म; इस महीने का टोटल और पिछले महीने से तुलना वाला एक कैटेगरी ब्रेकडाउन चार्ट दिखाने वाला एक Dashboard; और CSV एक्सपोर्ट के साथ तारीख़ रेंज से बिज़नेस एक्सपेंस फ़िल्टर करने वाला एक Reports पेज।',
      faqs: [
        { q: 'क्या यह एक से ज़्यादा करेंसी हैंडल कर सकता है?', a: 'हां — अपने प्रॉम्प्ट में प्रति-एक्सपेंस एक करेंसी जोड़ें, एक होम करेंसी सेट करें, और टोटल्स आपके तय किए रेट्स पर कन्वर्ट होते हैं।' },
        { q: 'क्या मैं रसीदें जोड़ सकता हूं?', a: 'एक्सपेंस में एक फ़ोटो फ़ील्ड जोड़ें और हर एंट्री अपनी रसीद इमेज सेव करती है — टैक्स-सीज़न में आप ख़ुद को शुक्रिया कहेंगे।' },
        { q: 'क्या यह मेरे बैंक से जुड़ता है?', a: 'जनरेट किए गए ऐप्स बैंक फ़ीड्स से सीधे नहीं जुड़ते — यह एक जानबूझकर-एंट्री वाला ट्रैकर है, यही वजह है कि इसकी कैटेगरीज़ हमेशा सही रहती हैं।' },
        { q: 'इसे बनाने में क्या ख़र्च आता है?', a: '50 मुफ़्त मासिक क्रेडिट्स आपके पहले बिल्ड को कवर करते हैं (30 क्रेडिट्स); उसके बाद, बदलाव 2-क्रेडिट एडिट्स हैं। शुरू करने के लिए कोई कार्ड नहीं चाहिए।' },
      ],
    },
    'budget-planner-app': {
      h1: 'AI से बजट प्लानर ऐप बनाएं',
      metaTitle: 'AI से बजट प्लानिंग ऐप बनाएं — बिना कोड',
      metaDesc: 'एनवलप बजट्स, सेविंग्स गोल्स, और "क्या हम यह अफ़ोर्ड कर सकते हैं?" का असली जवाब — मिनटों में आपके विवरण से जनरेट किया गया हाउसहोल्ड बजट ऐप।',
      tagline: 'महीने की शुरुआत में हर रुपये या डॉलर को एक काम दें, और महीने के बीच में बिल्कुल जानें हर एनवलप में क्या बचा है।',
      body: [
        'बजटिंग तरीक़े काम करते हैं; बजटिंग टूल्स वहीं हैं जहां हाउसहोल्ड्स गिरते हैं। स्प्रेडशीट को एक मेंटेनर चाहिए, लोकप्रिय ऐप्स किसी और की मेथडोलॉजी लागू करने के लिए मासिक चार्ज करते हैं, और कपल्स के पास सबसे पुरानी सिंक समस्या रह जाती है — दो लोग, पैसों का एक पूल, कोई साझा तस्वीर नहीं।',
        'चाहे आप एनवलप्स चलाएं, 50/30/20, या एक सिंपल "बिल्स, फ़न, सेव" स्प्लिट — WyberAi आपके तरीक़े के इर्द-गिर्द प्लानर बनाता है: मासिक कैटेगरी बजट्स, उनके ख़िलाफ़ लॉग किया गया ख़र्च, और एक शेयर्ड व्यू जिसे दोनों पार्टनर अपडेट कर सकें। महीने के बीच की झलक — तीन हरे एनवलप्स, एक एम्बर, एक लाल — स्प्रेडशीट और बहस दोनों की जगह लेती है।',
      ],
      features: [
        { title: 'एनवलप-स्टाइल बजट्स', desc: 'हर महीने प्रति-कैटेगरी एक अमाउंट सेट करें; हर एक्सपेंस अपने एनवलप से घटता है, बचा हुआ बैलेंस दिखता रहता है।' },
        { title: 'शेयर्ड हाउसहोल्ड व्यू', desc: 'दो लॉगिन, एक बजट — दोनों पार्टनर ख़र्च लॉग करते हैं और एक ही रीयल-टाइम तस्वीर देखते हैं।' },
        { title: 'सेविंग्स गोल्स', desc: 'इमरजेंसी फ़ंड, हॉलिडे, नया लैपटॉप — टारगेट्स और तारीख़ तक ट्रैक किए गए मासिक कंट्रीब्यूशन्स वाले गोल्स।' },
        { title: 'मंथ रोलओवर', desc: 'महीना बंद करें, नियम के हिसाब से न-ख़र्च हुए बैलेंस कैरी ओवर करें (या रीसेट करें), और एक क्लिक में अगला महीना शुरू करें।' },
      ],
      promptExample: 'एक हाउसहोल्ड बजट प्लानर वेब ऐप बनाएं: एक Budget पेज जहां हम प्रति-कैटेगरी (किराया, ग्रॉसरी, ट्रांसपोर्ट, फ़न, सेविंग्स) मासिक अमाउंट सेट करें, एनवलप्स के रूप में दिखे ख़र्च और बाक़ी के साथ; एक एनवलप से निकालने वाला तेज़ Add Expense फ़ॉर्म; सेविंग्स टारगेट्स, मासिक कंट्रीब्यूशन्स, और अनुमानित कम्प्लीशन तारीख़ों वाला एक Goals पेज; और एक बजट शेयर करने वाले दो यूज़र अकाउंट्स का सपोर्ट।',
      faqs: [
        { q: 'क्या मेरे पार्टनर और मैं दोनों इसे इस्तेमाल कर सकते हैं?', a: 'हां — यह ऑथेंटिकेशन के साथ जनरेट होता है, और एक शेयर्ड-हाउसहोल्ड स्ट्रक्चर का मतलब है आप दोनों एक ही बजट को लाइव देखते और अपडेट करते हैं।' },
        { q: 'महीने के अंत में बचे पैसों का क्या होता है?', a: 'आपका नियम की पसंद: न-ख़र्च हुए बैलेंस को अगले महीने के एनवलप में रोल करें, उन्हें एक सेविंग्स गोल में डालें, या रीसेट करें — इसे प्रॉम्प्ट में सेट करें या चैट में बदलें।' },
        { q: 'क्या यह एनवलप्स की बजाय 50/30/20 मेथड कर सकता है?', a: 'हां — जो मेथड आप फ़ॉलो करते हैं वह बताएं और बजट स्ट्रक्चर, गणित, और डैशबोर्ड उसी हिसाब से जनरेट होते हैं।' },
        { q: 'क्या हमारा फ़ाइनेंशियल डेटा प्राइवेट है?', a: 'ऐप अपने Postgres डेटाबेस पर रो-लेवल सिक्योरिटी के साथ चलता है, और प्रकाशित करने से पहले WyberAi का लाइव स्कैन इसे एक हमलावर की तरह जांचता है।' },
      ],
    },
    'subscription-tracker': {
      h1: 'AI से सब्सक्रिप्शन ट्रैकर ऐप बनाएं',
      metaTitle: 'AI से सब्सक्रिप्शन ट्रैकर ऐप बनाएं — बिना कोड',
      metaDesc: 'हर बार-बार होने वाला चार्ज एक जगह: रिन्यूअल कैलेंडर, मासिक टोटल, और कैंसल-बाय तारीख़ें। सादी अंग्रेज़ी प्रॉम्प्ट से बना — शुरू करना मुफ़्त।',
      tagline: 'वह ऐप जो "रुको, हम उसके लिए भी पैसे देते हैं?" का जवाब देता है — हर बार-बार होने वाला चार्ज, उसकी रिन्यूअल तारीख़, और मासिक नुक़सान एक व्यू में।',
      body: [
        'कोई भी सब्सक्रिप्शन्स पर महीने में तीन सौ ख़र्च करने का फ़ैसला नहीं करता; यह एक बार में एक फ़्री ट्रायल से जमा होता है, दो ऐप स्टोर्स में, कुछ वेबसाइट्स पर, और किसी और का Netflix पासवर्ड आपका Netflix बिल बन जाता है। भूल जाना ही बिज़नेस मॉडल है — एनुअल रिन्यूअल्स इस दांव पर प्राइस की जाती हैं कि आपको तारीख़ याद नहीं रहेगी।',
        'एक सब्सक्रिप्शन ट्रैकर एक छोटा, तेज़ टूल है: हर बार-बार होने वाला चार्ज उसकी अमाउंट, साइकिल, और रिन्यूअल तारीख़ के साथ; क्या आने वाला है इसका एक कैलेंडर; और एक चलता हुआ मासिक टोटल जो जमा होने को साफ़ दिखाए। WyberAi इसे एक-पैराग्राफ़ विवरण से जनरेट करता है — और क्योंकि रिन्यूअल तारीख़ें आपके अपने डेटाबेस में रहती हैं, एक "कैंसल-बाय" वार्निंग विंडो या प्राइस-बढ़ोतरी हिस्ट्री जोड़ना चैट में एक एडिट है, किसी ऐसी कंपनी को फ़ीचर रिक्वेस्ट नहीं जो आपकी भूलने की आदत को भुना रही है।',
      ],
      features: [
        { title: 'सभी चार्जेस, एक लेजर', desc: 'स्ट्रीमिंग, SaaS, जिम, डोमेन्स, इंश्योरेंस — हर एक अमाउंट, बिलिंग साइकिल, पेमेंट मेथड, और कैटेगरी के साथ।' },
        { title: 'रिन्यूअल कैलेंडर', desc: 'कब क्या चार्ज होगा, इस महीने और अगले — एनुअल रिन्यूअल्स अब घात नहीं रहते।' },
        { title: 'सही मासिक टोटल', desc: 'एनुअल और क्वार्टरली प्लान्स एक मासिक आंकड़े में नॉर्मलाइज़्ड, तो असली रन-रेट एक नंबर है।' },
        { title: 'कैंसल-बाय वार्निंग्स', desc: 'हर रिन्यूअल से पहले एक फ़्लैग्ड विंडो — वे दिन जब कैंसिल करने से असल में चार्ज बचता है।' },
      ],
      promptExample: 'एक सब्सक्रिप्शन ट्रैकर वेब ऐप बनाएं: हर सर्विस को नाम, कीमत, बिलिंग साइकिल (मासिक/तिमाही/वार्षिक), अगली रिन्यूअल तारीख़, पेमेंट मेथड, और कैटेगरी के साथ लिस्ट करने वाला एक Subscriptions पेज; नॉर्मलाइज़्ड मासिक टोटल, एक कैटेगरी ब्रेकडाउन, और अगले 30 दिनों की आने वाली रिन्यूअल्स दिखाने वाला एक Dashboard; और मैन्युअली अपडेट किए गए "आख़िरी बार इस्तेमाल" फ़ील्ड के साथ वार्षिक लागत के हिसाब से सब्सक्रिप्शन्स रैंक करने वाला एक Insights पेज।',
      faqs: [
        { q: 'क्या यह रिन्यूअल से पहले मुझे याद दिला सकता है?', a: 'आने वाली-रिन्यूअल्स व्यू आपकी वार्निंग विंडो के अंदर जो कुछ भी है उसे हाइलाइट करता है; प्रकाशित करते समय अगर आपको पुश चाहिए तो चैट से ईमेल रिमाइंडर जोड़ने को कहें।' },
        { q: 'क्या यह मेरे बैंक अकाउंट से सब्सक्रिप्शन्स डिटेक्ट करता है?', a: 'नहीं — एंट्रीज़ जानबूझकर होती हैं, जिसे सेट करने में दस मिनट लगते हैं और इसका मतलब है लिस्ट पूरी और सही है, ऐप स्टोर्स में छिपी हुई एंट्रीज़ सहित।' },
        { q: 'क्या यह शेयर्ड फ़ैमिली सब्सक्रिप्शन्स ट्रैक कर सकता है?', a: 'हां — अपने प्रॉम्प्ट में "किसके साथ शेयर्ड है" या प्रति-व्यक्ति स्प्लिट फ़ील्ड जोड़ें और मासिक टोटल आपका हिस्सा बनाम पूरे हाउसहोल्ड का दिखा सकता है।' },
        { q: 'स्प्रेडशीट का इस्तेमाल क्यों न करें?', a: 'ट्रैकर वही है जो स्प्रेडशीट तब बन जाती है जब वह अपना ख़ुद का रिन्यूअल कैलेंडर मेंटेन करे, साइकिल्स को एक टोटल में नॉर्मलाइज़ करे, और आपके फ़ोन पर ठीक-ठाक दिखे।' },
      ],
    },
    'debt-payoff-tracker': {
      h1: 'AI से डेट पेऑफ़ ट्रैकर बनाएं',
      metaTitle: 'AI से डेट पेऑफ़ ट्रैकर ऐप बनाएं',
      metaDesc: 'स्नोबॉल या एवलांच मेथड, प्रति-डेट एक प्रोग्रेस बार, और एक असली पेऑफ़ तारीख़ — सादी अंग्रेज़ी से जनरेट किया गया डेट ट्रैकर, कोई जेनेरिक कैलकुलेटर नहीं।',
      tagline: 'हर क़र्ज़, उसका बैलेंस, और एक असली अनुमानित पेऑफ़ तारीख़ — सॉफ़्टवेयर के रूप में स्नोबॉल या एवलांच मेथड, कोई स्टैटिक कैलकुलेटर नहीं जिसे आप हाथ से दोबारा चलाएं।',
      body: [
        'कई क़र्ज़ चुकाना एक गणित समस्या है जिस पर एक मनोविज्ञान समस्या सवार है: एवलांच मेथड सबसे ज़्यादा ब्याज़ बचाता है, स्नोबॉल मेथड छोटे बैलेंस पहले साफ़ करके प्रेरित रखता है, और ज़्यादातर लोग इसलिए गिरते हैं क्योंकि एक स्प्रेडशीट ख़ुद अपडेट नहीं होती या प्रोग्रेस असली नहीं लगता। एक-बार के ऑनलाइन कैलकुलेटर सवाल का जवाब एक बार देते हैं और फिर आपको भूल जाते हैं।',
        'अपने क़र्ज़ बताएं और आप कौन सा मेथड फ़ॉलो करना चाहते हैं, और WyberAi एक लाइव ट्रैकर बनाता है: हर क़र्ज़ उसके बैलेंस, रेट, और मिनिमम पेमेंट के साथ, एक एक्स्ट्रा-पेमेंट फ़ील्ड जो आपको दिखाए कि ज़्यादा डालने पर पेऑफ़ तारीख़ कैसे बदलती है, और प्रति-क़र्ज़ एक प्रोग्रेस बार जो बैलेंस गिरने पर भरता है। यह हर बार जब आप पेमेंट लॉग करते हैं दोबारा कैलकुलेट होता है — प्लान ईमानदार रहता है, किसी डाउनलोड की गई स्प्रेडशीट में बासी होने की बजाय।',
      ],
      features: [
        { title: 'सभी क़र्ज़ एक जगह', desc: 'क्रेडिट कार्ड्स, लोन्स, और बैलेंस उनकी ब्याज़ दर और मिनिमम पेमेंट के साथ — पूरी तस्वीर एक लिस्ट में।' },
        { title: 'स्नोबॉल या एवलांच', desc: 'सबसे-छोटा-बैलेंस-पहले या सबसे-ज़्यादा-ब्याज़-पहले चुनें, और ऐप उसी हिसाब से आपकी पेऑफ़ प्रायोरिटी क्रमबद्ध करता है।' },
        { title: 'एक्स्ट्रा-पेमेंट प्रोजेक्शन्स', desc: 'किसी भी महीने में एक्स्ट्रा जोड़ें और देखें पेऑफ़ तारीख़ और कुल ब्याज़ तुरंत दोबारा कैलकुलेट होते हैं।' },
        { title: 'प्रति-क़र्ज़ प्रोग्रेस बार', desc: 'हर क़र्ज़ ओरिजिनल बैलेंस बनाम बाक़ी दिखाता है — वह विज़ुअल जो एक लंबे पेऑफ़ में मोमेंटम बनाए रखता है।' },
      ],
      promptExample: 'एक डेट पेऑफ़ ट्रैकर वेब ऐप बनाएं: हर क़र्ज़ को बैलेंस, ब्याज़ दर, और मिनिमम पेमेंट के साथ लिस्ट करने वाला, स्नोबॉल (सबसे छोटा बैलेंस पहले) या एवलांच (सबसे ज़्यादा रेट पहले) से ऑर्डर करने योग्य एक Debts पेज; एक Plan पेज जहां मैं एक एक्स्ट्रा मासिक पेमेंट अमाउंट डालूं और एक अनुमानित कुल पेऑफ़ तारीख़ व चुकाया गया ब्याज़ देखूं; और एक Progress पेज जिसमें प्रति-क़र्ज़ एक बार ओरिजिनल बैलेंस बनाम मौजूदा बैलेंस दिखाए।',
      faqs: [
        { q: 'मुझे कौन सा मेथड इस्तेमाल करना चाहिए, स्नोबॉल या एवलांच?', a: 'एवलांच गणितीय रूप से ज़्यादा ब्याज़ बचाता है; स्नोबॉल शुरुआती जीत से लोगों को प्रेरित रखता है। ट्रैकर दोनों को सपोर्ट करता है — कभी भी स्विच करें और पेऑफ़ ऑर्डर अपडेट होता है।' },
        { q: 'क्या पेमेंट करने पर यह दोबारा कैलकुलेट होता है?', a: 'हां — किसी भी क़र्ज़ के ख़िलाफ़ एक पेमेंट लॉग करें और बाक़ी बैलेंस, प्रोग्रेस बार, और अनुमानित पेऑफ़ तारीख़ तुरंत अपडेट होते हैं।' },
        { q: 'क्या यह समय के साथ बदलती अलग-अलग ब्याज़ दरों को ध्यान में रख सकता है?', a: 'अगर आपकी कोई प्रमोशनल रेट ख़त्म हो रही है तो एक रेट-चेंज फ़ील्ड जोड़ें, और अपने प्रॉम्प्ट में शेड्यूल बताएं — प्रोजेक्शन उसे फ़ॉलो करता है।' },
        { q: 'क्या यह एक-बार के पेऑफ़ कैलकुलेटर से अलग है?', a: 'हां — यह आपके असली बैलेंस और पेमेंट्स से जुड़ा एक ज़िंदा ट्रैकर है, कोई स्टैटिक नतीजा नहीं जिसे आपको हर महीने मैन्युअली दोबारा कैलकुलेट करना पड़े।' },
      ],
    },
    'roommate-expense-splitter': {
      h1: 'AI से रूममेट एक्सपेंस स्प्लिटर बनाएं',
      metaTitle: 'AI से रूममेट बिल स्प्लिटर ऐप बनाएं',
      metaDesc: 'शेयर्ड बिल्स, ऑटो-स्प्लिट कैलकुलेशन्स, और एक चलता हुआ कौन-किसका-देनदार बैलेंस — सादी अंग्रेज़ी से जनरेट, कोई विज्ञापन नहीं, कोई फ़ीस नहीं।',
      tagline: 'शेयर्ड ग्रॉसरी रन एक बार लॉग करें, और ऐप याद रखता है कौन क्या देनदार है — आधी रात को लंबी डिवीज़न करते ग्रुप चैट की बजाय।',
      body: [
        'हर शेयर्ड हाउसहोल्ड वही टूटा हुआ सिस्टम दोबारा बनाता है: कोई ग्रॉसरी के लिए पे करता है, कोई और इलेक्ट्रिक बिल कवर करता है, और असल में कौन किसका देनदार है यह मिलाना एक ग्रुप-चैट बहस बन जाती है जो किसी को पसंद नहीं। लोकप्रिय स्प्लिटिंग ऐप्स काम करते हैं, लेकिन वे एक-बार की ट्रिप एक्सपेंसेज़ के लिए बने हैं और बार-बार होने वाले-हाउसहोल्ड यूज़ केस को विज्ञापनों और प्रीमियम टियर्स के पीछे दबा देते हैं।',
        'अपना हाउसहोल्ड बताएं — कितने लोग, बिल्स आमतौर पर कैसे स्प्लिट होते हैं — और WyberAi उसके इर्द-गिर्द लेजर बनाता है: एक शेयर्ड एक्सपेंस लॉग जहां कोई भी एक चार्ज और वह कैसे स्प्लिट होता है जोड़ सके, प्रति-रूममेट एक चलता हुआ बैलेंस ताकि "कौन किसका देनदार है" एक झलक हो, कैलकुलेशन नहीं, और एक सेटल-अप फ़्लो जब आख़िरकार कोई अपना हिस्सा वापस पे करे।',
      ],
      features: [
        { title: 'शेयर्ड एक्सपेंस लॉग', desc: 'हाउसहोल्ड में कोई भी एक चार्ज लॉग करता है — ग्रॉसरी, यूटिलिटीज़, किराया — किसने पे किया और वह कैसे स्प्लिट होता है इसके साथ।' },
        { title: 'फ़्लेक्सिबल स्प्लिट नियम', desc: 'बराबर स्प्लिट, कस्टम पर्सेंटेज, या "बस ये दो लोग" — स्प्लिट प्रति-एक्सपेंस तय होता है, एक नियम पर मजबूर नहीं।' },
        { title: 'प्रति-व्यक्ति चलता हुआ बैलेंस', desc: 'कौन किसका कितना देनदार है इसका एक लाइव व्यू, नया एक्सपेंस आते ही तुरंत अपडेट होता है।' },
        { title: 'सेटल-अप ट्रैकिंग', desc: 'जब कैश या ट्रांसफ़र में वापस पे किया जाए तो एक क़र्ज़ को सेटल्ड मार्क करें, हिस्ट्री डिलीट किए बिना बैलेंस साफ़ करता है।' },
      ],
      promptExample: '3-व्यक्ति हाउसहोल्ड के लिए एक रूममेट एक्सपेंस स्प्लिटर मोबाइल ऐप बनाएं: एक Add Expense स्क्रीन जहां कोई भी अमाउंट, विवरण, किसने पे किया, और यह कैसे स्प्लिट होता है (बराबर, कस्टम पर्सेंटेज, या ख़ास लोग) के साथ एक चार्ज लॉग करे; हाउसहोल्ड में कौन किसका देनदार है इसका एक चलता हुआ टोटल दिखाने वाली एक Balances स्क्रीन; और एक क़र्ज़ को पेड मार्क करने के लिए एक Settle Up स्क्रीन, जो एक्सपेंस हिस्ट्री रखते हुए बैलेंस साफ़ करती है।',
      faqs: [
        { q: 'क्या यह असमान स्प्लिट्स हैंडल कर सकता है, जैसे किसी एक का गेस्ट?', a: 'हां — प्रति-एक्सपेंस एक कस्टम स्प्लिट सेट करें, तो एक डिनर जहां तीन में से सिर्फ़ दो रूममेट्स ने खाया वह सिर्फ़ उन दोनों के बीच स्प्लिट होता है।' },
        { q: 'क्या यह रूममेट्स से आगे भी काम करता है — ट्रिप्स भी?', a: 'वही ढांचा किसी भी शेयर्ड-एक्सपेंस ग्रुप पर फ़िट बैठता है; अपना यूज़ केस बताएं (एक ट्रिप, एक शेयर्ड सब्सक्रिप्शन) और स्प्लिट लॉजिक उसे फ़ॉलो करता है।' },
        { q: 'क्या कोई हाउसहोल्ड छोड़ सकता है और अपना फ़ाइनल बैलेंस सेटल कर सकता है?', a: 'हां — एक फ़ाइनल सेटल-अप उनके बैलेंस को शून्य कर देता है, और उनके पुराने एक्सपेंसेज़ रेफ़रेंस के लिए लॉग में रहते हैं।' },
        { q: 'क्या मेरे रूममेट्स के साथ इसका इस्तेमाल मुफ़्त है?', a: 'हां — कोई विज्ञापन नहीं, कोई प्रति-ट्रांज़ैक्शन फ़ीस नहीं। बनाने में मुफ़्त मासिक क्रेडिट्स लगते हैं, और उसके बाद ऐप आपका बना रहता है।' },
      ],
    },
  },
  kn: {
    'expense-tracker-app': {
      h1: 'AI ಮೂಲಕ ಎಕ್ಸ್‌ಪೆನ್ಸ್ ಟ್ರ್ಯಾಕರ್ ಆ್ಯಪ್ ರಚಿಸಿ',
      metaTitle: 'AI ಮೂಲಕ ಎಕ್ಸ್‌ಪೆನ್ಸ್ ಟ್ರ್ಯಾಕರ್ ಆ್ಯಪ್ ರಚಿಸಿ — ಕೋಡ್ ಇಲ್ಲದೆ',
      metaDesc: 'ಕೆಟಗರಿ ಪ್ರಕಾರ ಖರ್ಚು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ, ಬಿಸಿನೆಸ್ ಅನ್ನು ವೈಯಕ್ತಿಕದಿಂದ ಬೇರ್ಪಡಿಸಿ, ತಿಂಗಳು ಎಲ್ಲಿ ಹೋಯಿತು ಎಂದು ನೋಡಿ — ಸರಳ ಇಂಗ್ಲಿಷ್ ವಿವರಣೆಯಿಂದ ಜನರೇಟ್ ಆದ ಎಕ್ಸ್‌ಪೆನ್ಸ್ ಟ್ರ್ಯಾಕರ್.',
      tagline: 'ನಿಮ್ಮ ಕೆಟಗರಿಗಳು, ನಿಮ್ಮ ಕರೆನ್ಸಿಗಳು, ನಿಮ್ಮ ತೆರಿಗೆ ಸೀಸನ್ — ನಿಮ್ಮ ಹಣ ನಿಜವಾಗಿ ಹೇಗೆ ಚಲಿಸುತ್ತದೆಯೋ ಅದಕ್ಕೆ ಹೊಂದುವ ಎಕ್ಸ್‌ಪೆನ್ಸ್ ಟ್ರ್ಯಾಕರ್.',
      body: [
        'ಎಕ್ಸ್‌ಪೆನ್ಸ್ ಆ್ಯಪ್‌ಗಳು ಎರಡು ರೀತಿಯಲ್ಲಿ ಬರುತ್ತವೆ, ಎರಡೂ ತಪ್ಪುತ್ತವೆ: ಬ್ಯಾಂಕ್-ಲಿಂಕ್ಡ್ ಆ್ಯಪ್‌ಗಳು "Amazon" ಅನ್ನು ರಹಸ್ಯಕ್ಕೆ ಆಟೋ-ಕೆಟಗರೈಸ್ ಮಾಡುತ್ತವೆ, ಮತ್ತು ಮಿನಿಮಲಿಸ್ಟ್ ಟ್ರ್ಯಾಕರ್‌ಗಳು ಏಪ್ರಿಲ್‌ನಲ್ಲಿ ಮುಖ್ಯವಾದ ಒಂದೇ ಪ್ರಶ್ನೆಗೆ ಉತ್ತರಿಸಲಾರವು — ಇವುಗಳಲ್ಲಿ ಯಾವುದು ಬಿಸಿನೆಸ್ ಖರ್ಚು, ಮತ್ತು ರಸೀದಿಗಳು ಎಲ್ಲಿವೆ?',
        'ನೀವು ನಿಜವಾಗಿ ಹಣವನ್ನು ಹೇಗೆ ಟ್ರ್ಯಾಕ್ ಮಾಡುತ್ತೀರಿ ಎಂದು ವಿವರಿಸಿ — ನೀವು ಯೋಚಿಸುವ ಕೆಟಗರಿಗಳು, ಫ್ರೀಲ್ಯಾನ್ಸ್ ಖರ್ಚುಗಳನ್ನು ಬೇರ್ಪಡಿಸಬೇಕೇ, ನಿಮ್ಮ ಅಕೌಂಟೆಂಟ್ ಯಾವ ವರದಿ ಕೇಳುತ್ತಾರೆ — ಮತ್ತು WyberAi ಆ ಟ್ರ್ಯಾಕರ್ ಅನ್ನು ಜನರೇಟ್ ಮಾಡುತ್ತದೆ: ನಿಮ್ಮ ಕೆಟಗರಿಗಳೊಂದಿಗೆ ವೇಗದ ಎಂಟ್ರಿ, ನಿಮ್ಮ ಖರ್ಚಿನ ಆಕಾರ ತೋರಿಸುವ ಮಾಸಿಕ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್, ಮತ್ತು ತೆರಿಗೆ ಸಮಯಕ್ಕಾಗಿ ನಿರ್ಮಿಸಿದ ಎಕ್ಸ್‌ಪೋರ್ಟ್ ವ್ಯೂ. ಮರುಕಳಿಸುವ ಬಿಲ್‌ಗಳು, ಪ್ರಯಾಣಕ್ಕೆ ಬಹು ಕರೆನ್ಸಿಗಳು, ರಸೀದಿ ಫೋಟೋ ಫೀಲ್ಡ್ — ಹೇಳಿ ಮತ್ತು ಸ್ಕೀಮಾದಲ್ಲಿ ಅದು ಇರುತ್ತದೆ.',
      ],
      features: [
        { title: 'ವೇಗದ ಎಂಟ್ರಿ, ನಿಮ್ಮ ಕೆಟಗರಿಗಳು', desc: 'ಮೊತ್ತ, ಕೆಟಗರಿ, ಟಿಪ್ಪಣಿ, ಮುಗಿಯಿತು — ನೀವು ವ್ಯಾಖ್ಯಾನಿಸಿದ ಕೆಟಗರಿ ಪಟ್ಟಿಯೊಂದಿಗೆ, ಬ್ಯಾಂಕ್‌ನ ಊಹೆಯಲ್ಲ.' },
        { title: 'ಬಿಸಿನೆಸ್ / ವೈಯಕ್ತಿಕ ವಿಭಜನೆ', desc: 'ಯಾವುದೇ ಖರ್ಚನ್ನು ಬಿಸಿನೆಸ್ ಎಂದು ಫ್ಲ್ಯಾಗ್ ಮಾಡಿ; ತೆರಿಗೆ-ಸೀಸನ್ ವರದಿಗಳು ನಿಮ್ಮ ಅಕೌಂಟೆಂಟ್‌ಗೆ ಬೇಕಾದದ್ದನ್ನೇ ಫಿಲ್ಟರ್ ಮಾಡುತ್ತವೆ.' },
        { title: 'ಮಾಸಿಕ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', desc: 'ಯಾವುದೇ ತಿಂಗಳಿಗೆ ಕೆಟಗರಿ ಪ್ರಕಾರ ಖರ್ಚು, ಯಾವ ಕೆಟಗರಿ ಹೆಚ್ಚುತ್ತಿದೆ ಎಂದು ತೋರಿಸುವ ಟ್ರೆಂಡ್ ಲೈನ್‌ಗಳೊಂದಿಗೆ.' },
        { title: 'ಮರುಕಳಿಸುವ ಖರ್ಚುಗಳು', desc: 'ಬಾಡಿಗೆ, ಚಂದಾದಾರಿಕೆಗಳು, ವಿಮೆ — ಪ್ರತಿ ಚಕ್ರದಲ್ಲಿ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಲಾಗ್ ಆಗುತ್ತವೆ ಇದರಿಂದ ಚಿತ್ರ ಪೂರ್ಣವಾಗಿ ಉಳಿಯುತ್ತದೆ.' },
      ],
      promptExample: 'ಎಕ್ಸ್‌ಪೆನ್ಸ್ ಟ್ರ್ಯಾಕರ್ ವೆಬ್ ಆ್ಯಪ್ ರಚಿಸಿ: ಮೊತ್ತ, ಕೆಟಗರಿ (ನನ್ನ ಕಸ್ಟಮ್ ಪಟ್ಟಿ), ದಿನಾಂಕ, ಐಚ್ಛಿಕ ಟಿಪ್ಪಣಿ, ಬಿಸಿನೆಸ್/ವೈಯಕ್ತಿಕ ಟಾಗಲ್, ಮತ್ತು ಐಚ್ಛಿಕ ರಸೀದಿ ಫೋಟೋ ಇರುವ Add Expense ಫಾರ್ಮ್; ಈ ತಿಂಗಳ ಒಟ್ಟು ಮತ್ತು ಕಳೆದ ತಿಂಗಳಿಗೆ ಹೋಲಿಕೆಯೊಂದಿಗೆ ಕೆಟಗರಿ ವಿಭಜನೆ ಚಾರ್ಟ್ ತೋರಿಸುವ Dashboard; ಮತ್ತು CSV ಎಕ್ಸ್‌ಪೋರ್ಟ್‌ನೊಂದಿಗೆ ದಿನಾಂಕ ವ್ಯಾಪ್ತಿಯ ಪ್ರಕಾರ ಬಿಸಿನೆಸ್ ಖರ್ಚುಗಳನ್ನು ಫಿಲ್ಟರ್ ಮಾಡುವ Reports ಪೇಜ್.',
      faqs: [
        { q: 'ಇದು ಒಂದಕ್ಕಿಂತ ಹೆಚ್ಚು ಕರೆನ್ಸಿಯನ್ನು ನಿಭಾಯಿಸಬಹುದೇ?', a: 'ಹೌದು — ನಿಮ್ಮ ಪ್ರಾಂಪ್ಟ್‌ನಲ್ಲಿ ಪ್ರತಿ-ಖರ್ಚಿಗೆ ಒಂದು ಕರೆನ್ಸಿ ಸೇರಿಸಿ, ಒಂದು ಹೋಮ್ ಕರೆನ್ಸಿ ಸೆಟ್ ಮಾಡಿ, ಮತ್ತು ಒಟ್ಟುಗಳು ನೀವು ನಿಯಂತ್ರಿಸುವ ದರಗಳಲ್ಲಿ ಪರಿವರ್ತನೆಯಾಗುತ್ತವೆ.' },
        { q: 'ನಾನು ರಸೀದಿಗಳನ್ನು ಲಗತ್ತಿಸಬಹುದೇ?', a: 'ಖರ್ಚುಗಳಿಗೆ ಫೋಟೋ ಫೀಲ್ಡ್ ಸೇರಿಸಿ ಮತ್ತು ಪ್ರತಿ ಎಂಟ್ರಿ ತನ್ನ ರಸೀದಿ ಚಿತ್ರವನ್ನು ಸಂಗ್ರಹಿಸುತ್ತದೆ — ತೆರಿಗೆ-ಸೀಸನ್‌ನಲ್ಲಿ ನೀವು ಇಂದಿನ ನಿಮಗೆ ಧನ್ಯವಾದ ಹೇಳುತ್ತೀರಿ.' },
        { q: 'ಇದು ನನ್ನ ಬ್ಯಾಂಕ್‌ಗೆ ಸಂಪರ್ಕಗೊಳ್ಳುತ್ತದೆಯೇ?', a: 'ಜನರೇಟ್ ಆದ ಆ್ಯಪ್‌ಗಳು ಮೊದಲಿಗೆ ಬ್ಯಾಂಕ್ ಫೀಡ್‌ಗಳಿಗೆ ಲಿಂಕ್ ಆಗುವುದಿಲ್ಲ — ಇದು ಉದ್ದೇಶಪೂರ್ವಕ-ಎಂಟ್ರಿ ಟ್ರ್ಯಾಕರ್, ಅದಕ್ಕಾಗಿಯೇ ಇದರ ಕೆಟಗರಿಗಳು ಯಾವಾಗಲೂ ಸರಿಯಾಗಿರುತ್ತವೆ.' },
        { q: 'ಇದನ್ನು ರಚಿಸಲು ಎಷ್ಟು ಖರ್ಚಾಗುತ್ತದೆ?', a: '50 ಉಚಿತ ಮಾಸಿಕ ಕ್ರೆಡಿಟ್‌ಗಳು ನಿಮ್ಮ ಮೊದಲ ಬಿಲ್ಡ್ ಅನ್ನು ಕವರ್ ಮಾಡುತ್ತವೆ (30 ಕ್ರೆಡಿಟ್‌ಗಳು); ಅದರ ನಂತರ, ಬದಲಾವಣೆಗಳು 2-ಕ್ರೆಡಿಟ್ ಎಡಿಟ್‌ಗಳು. ಪ್ರಾರಂಭಿಸಲು ಯಾವುದೇ ಕಾರ್ಡ್ ಅಗತ್ಯವಿಲ್ಲ.' },
      ],
    },
    'budget-planner-app': {
      h1: 'AI ಮೂಲಕ ಬಜೆಟ್ ಪ್ಲಾನರ್ ಆ್ಯಪ್ ರಚಿಸಿ',
      metaTitle: 'AI ಮೂಲಕ ಬಜೆಟ್ ಪ್ಲಾನಿಂಗ್ ಆ್ಯಪ್ ರಚಿಸಿ — ಕೋಡ್ ಇಲ್ಲದೆ',
      metaDesc: 'ಎನ್ವಲಪ್ ಬಜೆಟ್‌ಗಳು, ಉಳಿತಾಯ ಗುರಿಗಳು, ಮತ್ತು "ನಾವು ಇದನ್ನು ಭರಿಸಬಹುದೇ?" ಗೆ ನಿಜವಾದ ಉತ್ತರ — ನಿಮಿಷಗಳಲ್ಲಿ ನಿಮ್ಮ ವಿವರಣೆಯಿಂದ ಜನರೇಟ್ ಆದ ಹೌಸ್‌ಹೋಲ್ಡ್ ಬಜೆಟ್ ಆ್ಯಪ್.',
      tagline: 'ತಿಂಗಳ ಆರಂಭದಲ್ಲಿ ಪ್ರತಿ ರೂಪಾಯಿ ಅಥವಾ ಡಾಲರ್‌ಗೆ ಒಂದು ಕೆಲಸ ಕೊಡಿ, ಮತ್ತು ತಿಂಗಳ ಮಧ್ಯದಲ್ಲಿ ಪ್ರತಿ ಎನ್ವಲಪ್‌ನಲ್ಲಿ ಏನು ಉಳಿದಿದೆ ಎಂದು ನಿಖರವಾಗಿ ತಿಳಿಯಿರಿ.',
      body: [
        'ಬಜೆಟಿಂಗ್ ವಿಧಾನಗಳು ಕೆಲಸ ಮಾಡುತ್ತವೆ; ಬಜೆಟಿಂಗ್ ಟೂಲ್‌ಗಳಲ್ಲಿ ಹೌಸ್‌ಹೋಲ್ಡ್‌ಗಳು ಬೀಳುತ್ತವೆ. ಸ್ಪ್ರೆಡ್‌ಶೀಟ್‌ಗೆ ಒಬ್ಬ ನಿರ್ವಾಹಕ ಬೇಕು, ಜನಪ್ರಿಯ ಆ್ಯಪ್‌ಗಳು ಬೇರೊಬ್ಬರ ವಿಧಾನವನ್ನು ಜಾರಿಗೊಳಿಸಲು ಮಾಸಿಕ ಶುಲ್ಕ ವಿಧಿಸುತ್ತವೆ, ಮತ್ತು ಜೋಡಿಗಳಿಗೆ ಅತ್ಯಂತ ಹಳೆಯ ಸಿಂಕ್ ಸಮಸ್ಯೆ ಉಳಿಯುತ್ತದೆ — ಇಬ್ಬರು ಜನರು, ಹಣದ ಒಂದು ಪೂಲ್, ಯಾವುದೇ ಹಂಚಿಕೊಂಡ ಚಿತ್ರ ಇಲ್ಲ.',
        'ನೀವು ಎನ್ವಲಪ್‌ಗಳನ್ನು ಚಲಾಯಿಸಿದರೂ, 50/30/20, ಅಥವಾ ಸರಳ "ಬಿಲ್‌ಗಳು, ಮೋಜು, ಉಳಿತಾಯ" ವಿಭಜನೆಯಾಗಿರಲಿ, WyberAi ನಿಮ್ಮ ವಿಧಾನದ ಸುತ್ತ ಪ್ಲಾನರ್ ನಿರ್ಮಿಸುತ್ತದೆ: ಮಾಸಿಕ ಕೆಟಗರಿ ಬಜೆಟ್‌ಗಳು, ಅವುಗಳ ವಿರುದ್ಧ ಲಾಗ್ ಆದ ಖರ್ಚು, ಮತ್ತು ಇಬ್ಬರೂ ಪಾಲುದಾರರು ಅಪ್‌ಡೇಟ್ ಮಾಡಬಹುದಾದ ಹಂಚಿಕೊಂಡ ವ್ಯೂ. ತಿಂಗಳ ಮಧ್ಯದ ನೋಟ — ಮೂರು ಹಸಿರು ಎನ್ವಲಪ್‌ಗಳು, ಒಂದು ಅಂಬರ್, ಒಂದು ಕೆಂಪು — ಸ್ಪ್ರೆಡ್‌ಶೀಟ್ ಮತ್ತು ವಾದ ಎರಡನ್ನೂ ಬದಲಾಯಿಸುತ್ತದೆ.',
      ],
      features: [
        { title: 'ಎನ್ವಲಪ್-ಶೈಲಿಯ ಬಜೆಟ್‌ಗಳು', desc: 'ಪ್ರತಿ ತಿಂಗಳು ಪ್ರತಿ-ಕೆಟಗರಿಗೆ ಮೊತ್ತ ಸೆಟ್ ಮಾಡಿ; ಪ್ರತಿ ಖರ್ಚು ಗೋಚರ ಉಳಿದ ಬ್ಯಾಲೆನ್ಸ್‌ನೊಂದಿಗೆ ತನ್ನ ಎನ್ವಲಪ್‌ನಿಂದ ಕಡಿಮೆಯಾಗುತ್ತದೆ.' },
        { title: 'ಹಂಚಿಕೊಂಡ ಹೌಸ್‌ಹೋಲ್ಡ್ ವ್ಯೂ', desc: 'ಎರಡು ಲಾಗಿನ್‌ಗಳು, ಒಂದು ಬಜೆಟ್ — ಇಬ್ಬರೂ ಪಾಲುದಾರರು ಖರ್ಚು ಲಾಗ್ ಮಾಡುತ್ತಾರೆ ಮತ್ತು ಒಂದೇ ರಿಯಲ್-ಟೈಮ್ ಚಿತ್ರವನ್ನು ನೋಡುತ್ತಾರೆ.' },
        { title: 'ಉಳಿತಾಯ ಗುರಿಗಳು', desc: 'ತುರ್ತು ನಿಧಿ, ರಜೆ, ಹೊಸ ಲ್ಯಾಪ್‌ಟಾಪ್ — ಗುರಿಗಳು ಮತ್ತು ಒಂದು ದಿನಾಂಕದವರೆಗೆ ಟ್ರ್ಯಾಕ್ ಮಾಡಿದ ಮಾಸಿಕ ಕೊಡುಗೆಗಳು.' },
        { title: 'ತಿಂಗಳ ರೋಲ್‌ಓವರ್', desc: 'ತಿಂಗಳನ್ನು ಮುಚ್ಚಿ, ನಿಯಮದ ಪ್ರಕಾರ ಖರ್ಚಾಗದ ಬ್ಯಾಲೆನ್ಸ್‌ಗಳನ್ನು ಮುಂದಕ್ಕೆ ಒಯ್ಯಿರಿ (ಅಥವಾ ಮರುಹೊಂದಿಸಿ), ಮತ್ತು ಒಂದೇ ಕ್ಲಿಕ್‌ನಲ್ಲಿ ಮುಂದಿನದನ್ನು ಪ್ರಾರಂಭಿಸಿ.' },
      ],
      promptExample: 'ಹೌಸ್‌ಹೋಲ್ಡ್ ಬಜೆಟ್ ಪ್ಲಾನರ್ ವೆಬ್ ಆ್ಯಪ್ ರಚಿಸಿ: ಖರ್ಚು ಮತ್ತು ಉಳಿದದ್ದನ್ನು ತೋರಿಸುವ ಎನ್ವಲಪ್‌ಗಳಾಗಿ ಪ್ರತಿ-ಕೆಟಗರಿಗೆ (ಬಾಡಿಗೆ, ದಿನಸಿ, ಸಾರಿಗೆ, ಮೋಜು, ಉಳಿತಾಯ) ಮಾಸಿಕ ಮೊತ್ತಗಳನ್ನು ನಾವು ಸೆಟ್ ಮಾಡುವ Budget ಪೇಜ್; ಒಂದು ಎನ್ವಲಪ್‌ನಿಂದ ಸೆಳೆಯುವ ವೇಗದ Add Expense ಫಾರ್ಮ್; ಉಳಿತಾಯ ಗುರಿಗಳು, ಮಾಸಿಕ ಕೊಡುಗೆಗಳು, ಮತ್ತು ಅಂದಾಜು ಪೂರ್ಣಗೊಳಿಸುವಿಕೆ ದಿನಾಂಕಗಳಿರುವ Goals ಪೇಜ್; ಮತ್ತು ಒಂದು ಬಜೆಟ್ ಹಂಚಿಕೊಳ್ಳುವ ಎರಡು ಬಳಕೆದಾರ ಖಾತೆಗಳ ಬೆಂಬಲ.',
      faqs: [
        { q: 'ನನ್ನ ಪಾಲುದಾರ ಮತ್ತು ನಾನು ಇಬ್ಬರೂ ಇದನ್ನು ಬಳಸಬಹುದೇ?', a: 'ಹೌದು — ಇದು ಪ್ರಮಾಣೀಕರಣದೊಂದಿಗೆ ಜನರೇಟ್ ಆಗುತ್ತದೆ, ಮತ್ತು ಹಂಚಿಕೊಂಡ-ಹೌಸ್‌ಹೋಲ್ಡ್ ರಚನೆ ಎಂದರೆ ನೀವಿಬ್ಬರೂ ಒಂದೇ ಬಜೆಟ್ ಅನ್ನು ಲೈವ್ ನೋಡುತ್ತೀರಿ ಮತ್ತು ಅಪ್‌ಡೇಟ್ ಮಾಡುತ್ತೀರಿ.' },
        { q: 'ತಿಂಗಳ ಕೊನೆಯಲ್ಲಿ ಉಳಿದ ಹಣಕ್ಕೆ ಏನಾಗುತ್ತದೆ?', a: 'ನಿಮ್ಮ ನಿಯಮದ ಆಯ್ಕೆ: ಖರ್ಚಾಗದ ಬ್ಯಾಲೆನ್ಸ್‌ಗಳನ್ನು ಮುಂದಿನ ತಿಂಗಳ ಎನ್ವಲಪ್‌ಗೆ ರೋಲ್ ಮಾಡಿ, ಅವುಗಳನ್ನು ಉಳಿತಾಯ ಗುರಿಗೆ ಸ್ವೀಪ್ ಮಾಡಿ, ಅಥವಾ ಮರುಹೊಂದಿಸಿ — ಇದನ್ನು ಪ್ರಾಂಪ್ಟ್‌ನಲ್ಲಿ ಸೆಟ್ ಮಾಡಿ ಅಥವಾ ಚಾಟ್‌ನಲ್ಲಿ ಬದಲಾಯಿಸಿ.' },
        { q: 'ಇದು ಎನ್ವಲಪ್‌ಗಳ ಬದಲಿಗೆ 50/30/20 ವಿಧಾನ ಮಾಡಬಹುದೇ?', a: 'ಹೌದು — ನೀವು ಅನುಸರಿಸುವ ವಿಧಾನವನ್ನು ವಿವರಿಸಿ ಮತ್ತು ಬಜೆಟ್ ರಚನೆ, ಗಣಿತ, ಮತ್ತು ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಅದಕ್ಕೆ ಹೊಂದುವಂತೆ ಜನರೇಟ್ ಆಗುತ್ತವೆ.' },
        { q: 'ನಮ್ಮ ಆರ್ಥಿಕ ಡೇಟಾ ಖಾಸಗಿಯೇ?', a: 'ಆ್ಯಪ್ ರೋ-ಲೆವೆಲ್ ಸೆಕ್ಯುರಿಟಿಯೊಂದಿಗೆ ತನ್ನದೇ Postgres ಡೇಟಾಬೇಸ್‌ನಲ್ಲಿ ಚಲಿಸುತ್ತದೆ, ಮತ್ತು ಪ್ರಕಟಿಸುವ ಮೊದಲು WyberAi ಲೈವ್ ಸ್ಕ್ಯಾನ್ ಇದನ್ನು ದಾಳಿಕೋರನಂತೆ ಪರೀಕ್ಷಿಸುತ್ತದೆ.' },
      ],
    },
    'subscription-tracker': {
      h1: 'AI ಮೂಲಕ ಚಂದಾದಾರಿಕೆ ಟ್ರ್ಯಾಕರ್ ಆ್ಯಪ್ ರಚಿಸಿ',
      metaTitle: 'AI ಮೂಲಕ ಚಂದಾದಾರಿಕೆ ಟ್ರ್ಯಾಕರ್ ಆ್ಯಪ್ ರಚಿಸಿ — ಕೋಡ್ ಇಲ್ಲದೆ',
      metaDesc: 'ಪ್ರತಿ ಮರುಕಳಿಸುವ ಶುಲ್ಕ ಒಂದೇ ಜಾಗದಲ್ಲಿ: ನವೀಕರಣ ಕ್ಯಾಲೆಂಡರ್, ಮಾಸಿಕ ಒಟ್ಟು, ಮತ್ತು ರದ್ದು-ಮಾಡಬೇಕಾದ ದಿನಾಂಕಗಳು. ಸರಳ ಇಂಗ್ಲಿಷ್ ಪ್ರಾಂಪ್ಟ್‌ನಿಂದ ನಿರ್ಮಿಸಲಾಗಿದೆ — ಪ್ರಾರಂಭಿಸಲು ಉಚಿತ.',
      tagline: '"ಅರೆ, ನಾವು ಅದಕ್ಕೂ ಪಾವತಿಸುತ್ತೇವಾ?" ಎಂಬುದಕ್ಕೆ ಉತ್ತರಿಸುವ ಆ್ಯಪ್ — ಪ್ರತಿ ಮರುಕಳಿಸುವ ಶುಲ್ಕ, ಅದರ ನವೀಕರಣ ದಿನಾಂಕ, ಮತ್ತು ಮಾಸಿಕ ಹಾನಿ ಒಂದೇ ವ್ಯೂನಲ್ಲಿ.',
      body: [
        'ಚಂದಾದಾರಿಕೆಗಳ ಮೇಲೆ ತಿಂಗಳಿಗೆ ಮುನ್ನೂರು ಖರ್ಚು ಮಾಡಲು ಯಾರೂ ನಿರ್ಧರಿಸುವುದಿಲ್ಲ; ಇದು ಒಂದು ಸಮಯದಲ್ಲಿ ಒಂದು ಉಚಿತ ಟ್ರಯಲ್‌ನಿಂದ, ಎರಡು ಆ್ಯಪ್ ಸ್ಟೋರ್‌ಗಳಲ್ಲಿ, ಕೆಲವು ವೆಬ್‌ಸೈಟ್‌ಗಳಲ್ಲಿ, ಮತ್ತು ಇನ್ನೊಬ್ಬರ Netflix ಪಾಸ್‌ವರ್ಡ್ ನಿಮ್ಮ Netflix ಬಿಲ್ ಆಗುವುದರ ಮೂಲಕ ಸಂಗ್ರಹವಾಗುತ್ತದೆ. ಮರೆಯುವಿಕೆಯೇ ವ್ಯಾಪಾರ ಮಾದರಿ — ವಾರ್ಷಿಕ ನವೀಕರಣಗಳು ನಿಮಗೆ ದಿನಾಂಕ ನೆನಪಿರುವುದಿಲ್ಲ ಎಂಬ ಬೆಟ್‌ನಲ್ಲಿ ಬೆಲೆ ಕಟ್ಟಲಾಗಿದೆ.',
        'ಚಂದಾದಾರಿಕೆ ಟ್ರ್ಯಾಕರ್ ಒಂದು ಸಣ್ಣ, ತೀಕ್ಷ್ಣ ಟೂಲ್: ಪ್ರತಿ ಮರುಕಳಿಸುವ ಶುಲ್ಕ ಅದರ ಮೊತ್ತ, ಚಕ್ರ, ಮತ್ತು ನವೀಕರಣ ದಿನಾಂಕದೊಂದಿಗೆ; ಏನು ಬರಲಿದೆ ಎಂಬ ಕ್ಯಾಲೆಂಡರ್; ಮತ್ತು ಸಂಗ್ರಹವನ್ನು ಗೋಚರಿಸುವಂತೆ ಮಾಡುವ ಚಾಲನೆಯಲ್ಲಿರುವ ಮಾಸಿಕ ಒಟ್ಟು. WyberAi ಇದನ್ನು ಒಂದು-ಪ್ಯಾರಾಗ್ರಾಫ್ ವಿವರಣೆಯಿಂದ ಜನರೇಟ್ ಮಾಡುತ್ತದೆ — ಮತ್ತು ನವೀಕರಣ ದಿನಾಂಕಗಳು ನಿಮ್ಮ ಸ್ವಂತ ಡೇಟಾಬೇಸ್‌ನಲ್ಲಿ ಇರುವುದರಿಂದ, "ಈ ದಿನದೊಳಗೆ ರದ್ದುಮಾಡಿ" ಎಚ್ಚರಿಕೆ ವಿಂಡೋ ಅಥವಾ ಬೆಲೆ-ಏರಿಕೆ ಇತಿಹಾಸ ಸೇರಿಸುವುದು ಚಾಟ್‌ನಲ್ಲಿ ಒಂದು ಎಡಿಟ್, ನಿಮ್ಮ ಮರೆವನ್ನು ಹಣಗಳಿಸುತ್ತಿರುವ ಕಂಪನಿಗೆ ಫೀಚರ್ ವಿನಂತಿಯಲ್ಲ.',
      ],
      features: [
        { title: 'ಎಲ್ಲಾ ಶುಲ್ಕಗಳು, ಒಂದು ಲೆಡ್ಜರ್', desc: 'ಸ್ಟ್ರೀಮಿಂಗ್, SaaS, ಜಿಮ್, ಡೊಮೇನ್‌ಗಳು, ವಿಮೆ — ಪ್ರತಿಯೊಂದೂ ಮೊತ್ತ, ಬಿಲ್ಲಿಂಗ್ ಚಕ್ರ, ಪಾವತಿ ವಿಧಾನ, ಮತ್ತು ಕೆಟಗರಿಯೊಂದಿಗೆ.' },
        { title: 'ನವೀಕರಣ ಕ್ಯಾಲೆಂಡರ್', desc: 'ಯಾವಾಗ ಏನು ಶುಲ್ಕವಾಗುತ್ತದೆ, ಈ ತಿಂಗಳು ಮತ್ತು ಮುಂದಿನದು — ವಾರ್ಷಿಕ ನವೀಕರಣಗಳು ಇನ್ನು ಆಶ್ಚರ್ಯಗಳಾಗಿ ಉಳಿಯುವುದಿಲ್ಲ.' },
        { title: 'ನಿಜವಾದ ಮಾಸಿಕ ಒಟ್ಟು', desc: 'ವಾರ್ಷಿಕ ಮತ್ತು ತ್ರೈಮಾಸಿಕ ಯೋಜನೆಗಳು ಮಾಸಿಕ ಅಂಕಿಗೆ ಸಾಮಾನ್ಯೀಕರಿಸಲ್ಪಟ್ಟಿವೆ, ಆದ್ದರಿಂದ ನಿಜವಾದ ರನ್-ರೇಟ್ ಒಂದೇ ಸಂಖ್ಯೆ.' },
        { title: 'ರದ್ದು-ಮಾಡಬೇಕಾದ ಎಚ್ಚರಿಕೆಗಳು', desc: 'ಪ್ರತಿ ನವೀಕರಣಕ್ಕೆ ಮೊದಲು ಫ್ಲ್ಯಾಗ್ ಮಾಡಿದ ವಿಂಡೋ — ರದ್ದುಮಾಡುವುದು ನಿಜವಾಗಿ ಶುಲ್ಕವನ್ನು ಉಳಿಸುವ ದಿನಗಳು.' },
      ],
      promptExample: 'ಚಂದಾದಾರಿಕೆ ಟ್ರ್ಯಾಕರ್ ವೆಬ್ ಆ್ಯಪ್ ರಚಿಸಿ: ಹೆಸರು, ಬೆಲೆ, ಬಿಲ್ಲಿಂಗ್ ಚಕ್ರ (ಮಾಸಿಕ/ತ್ರೈಮಾಸಿಕ/ವಾರ್ಷಿಕ), ಮುಂದಿನ ನವೀಕರಣ ದಿನಾಂಕ, ಪಾವತಿ ವಿಧಾನ, ಮತ್ತು ಕೆಟಗರಿಯೊಂದಿಗೆ ಪ್ರತಿ ಸೇವೆಯನ್ನು ಪಟ್ಟಿ ಮಾಡುವ Subscriptions ಪೇಜ್; ಸಾಮಾನ್ಯೀಕರಿಸಿದ ಮಾಸಿಕ ಒಟ್ಟು, ಕೆಟಗರಿ ವಿಭಜನೆ, ಮತ್ತು ಮುಂದಿನ 30 ದಿನಗಳ ಬರಲಿರುವ ನವೀಕರಣಗಳನ್ನು ತೋರಿಸುವ Dashboard; ಮತ್ತು ನಾನು ಹಸ್ತಚಾಲಿತವಾಗಿ ಅಪ್‌ಡೇಟ್ ಮಾಡುವ "ಕೊನೆಯ ಬಳಕೆ" ಫೀಲ್ಡ್‌ನೊಂದಿಗೆ ವಾರ್ಷಿಕ ವೆಚ್ಚದ ಪ್ರಕಾರ ಚಂದಾದಾರಿಕೆಗಳನ್ನು ಶ್ರೇಣೀಕರಿಸುವ Insights ಪೇಜ್.',
      faqs: [
        { q: 'ಇದು ನವೀಕರಣಕ್ಕೆ ಮೊದಲು ನನಗೆ ನೆನಪಿಸಬಹುದೇ?', a: 'ಬರಲಿರುವ-ನವೀಕರಣಗಳ ವ್ಯೂ ನಿಮ್ಮ ಎಚ್ಚರಿಕೆ ವಿಂಡೋದೊಳಗೆ ಇರುವ ಯಾವುದನ್ನಾದರೂ ಹೈಲೈಟ್ ಮಾಡುತ್ತದೆ; ನಿಮಗೆ ಪುಶ್ ಬೇಕಾದರೆ ಪ್ರಕಟಿಸುವಾಗ ಇಮೇಲ್ ಜ್ಞಾಪನೆಗಳನ್ನು ಸೇರಿಸಲು ಚಾಟ್‌ಗೆ ಕೇಳಿ.' },
        { q: 'ಇದು ನನ್ನ ಬ್ಯಾಂಕ್ ಖಾತೆಯಿಂದ ಚಂದಾದಾರಿಕೆಗಳನ್ನು ಪತ್ತೆ ಮಾಡುತ್ತದೆಯೇ?', a: 'ಇಲ್ಲ — ಎಂಟ್ರಿಗಳು ಉದ್ದೇಶಪೂರ್ವಕವಾಗಿವೆ, ಇದನ್ನು ಸೆಟ್ ಮಾಡಲು ಹತ್ತು ನಿಮಿಷ ತೆಗೆದುಕೊಳ್ಳುತ್ತದೆ ಮತ್ತು ಆ್ಯಪ್ ಸ್ಟೋರ್‌ಗಳಲ್ಲಿ ಅಡಗಿರುವವುಗಳನ್ನೂ ಸೇರಿಸಿ ಪಟ್ಟಿ ಪೂರ್ಣ ಮತ್ತು ಸರಿಯಾಗಿದೆ ಎಂದರ್ಥ.' },
        { q: 'ಇದು ಹಂಚಿಕೊಂಡ ಕುಟುಂಬ ಚಂದಾದಾರಿಕೆಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಬಹುದೇ?', a: 'ಹೌದು — ನಿಮ್ಮ ಪ್ರಾಂಪ್ಟ್‌ನಲ್ಲಿ "ಯಾರೊಂದಿಗೆ ಹಂಚಿಕೊಂಡಿದೆ" ಅಥವಾ ಪ್ರತಿ-ವ್ಯಕ್ತಿ ವಿಭಜನೆ ಫೀಲ್ಡ್ ಸೇರಿಸಿ ಮತ್ತು ಮಾಸಿಕ ಒಟ್ಟು ನಿಮ್ಮ ಪಾಲನ್ನು ಹೌಸ್‌ಹೋಲ್ಡ್‌ನ ವಿರುದ್ಧ ತೋರಿಸಬಹುದು.' },
        { q: 'ಸ್ಪ್ರೆಡ್‌ಶೀಟ್ ಬಳಸಬಾರದೇಕೆ?', a: 'ಟ್ರ್ಯಾಕರ್ ಎಂದರೆ ಸ್ಪ್ರೆಡ್‌ಶೀಟ್ ತನ್ನದೇ ನವೀಕರಣ ಕ್ಯಾಲೆಂಡರ್ ಅನ್ನು ನಿರ್ವಹಿಸಿದಾಗ, ಚಕ್ರಗಳನ್ನು ಒಂದು ಒಟ್ಟಿಗೆ ಸಾಮಾನ್ಯೀಕರಿಸಿದಾಗ, ಮತ್ತು ನಿಮ್ಮ ಫೋನ್‌ನಲ್ಲಿ ಚೆನ್ನಾಗಿ ಕಾಣಿಸಿದಾಗ ಆಗುವುದು.' },
      ],
    },
    'debt-payoff-tracker': {
      h1: 'AI ಮೂಲಕ ಡೆಟ್ ಪೇಆಫ್ ಟ್ರ್ಯಾಕರ್ ರಚಿಸಿ',
      metaTitle: 'AI ಮೂಲಕ ಡೆಟ್ ಪೇಆಫ್ ಟ್ರ್ಯಾಕರ್ ಆ್ಯಪ್ ರಚಿಸಿ',
      metaDesc: 'ಸ್ನೋಬಾಲ್ ಅಥವಾ ಅವಲಾಂಚ್ ವಿಧಾನ, ಪ್ರತಿ-ಸಾಲಕ್ಕೆ ಪ್ರೋಗ್ರೆಸ್ ಬಾರ್, ಮತ್ತು ನಿಜವಾದ ಪೇಆಫ್ ದಿನಾಂಕ — ಸರಳ ಇಂಗ್ಲಿಷ್‌ನಿಂದ ಜನರೇಟ್ ಆದ ಸಾಲ ಟ್ರ್ಯಾಕರ್, ಸಾಮಾನ್ಯ ಕ್ಯಾಲ್ಕುಲೇಟರ್ ಅಲ್ಲ.',
      tagline: 'ಪ್ರತಿ ಸಾಲ, ಅದರ ಬಾಕಿ, ಮತ್ತು ನಿಜವಾದ ಅಂದಾಜು ಪೇಆಫ್ ದಿನಾಂಕ — ಸಾಫ್ಟ್‌ವೇರ್ ಆಗಿ ಸ್ನೋಬಾಲ್ ಅಥವಾ ಅವಲಾಂಚ್ ವಿಧಾನ, ನೀವು ಕೈಯಿಂದ ಮತ್ತೆ ಚಲಾಯಿಸುವ ಸ್ಥಿರ ಕ್ಯಾಲ್ಕುಲೇಟರ್ ಅಲ್ಲ.',
      body: [
        'ಬಹು ಸಾಲಗಳನ್ನು ತೀರಿಸುವುದು ಮನೋವಿಜ್ಞಾನ ಸಮಸ್ಯೆ ಸವಾರಿ ಮಾಡುವ ಗಣಿತ ಸಮಸ್ಯೆ: ಅವಲಾಂಚ್ ವಿಧಾನ ಹೆಚ್ಚು ಬಡ್ಡಿ ಉಳಿಸುತ್ತದೆ, ಸ್ನೋಬಾಲ್ ವಿಧಾನ ಸಣ್ಣ ಬಾಕಿಗಳನ್ನು ಮೊದಲು ತೆರವುಗೊಳಿಸುವ ಮೂಲಕ ಪ್ರೇರೇಪಿತವಾಗಿ ಇರಿಸುತ್ತದೆ, ಮತ್ತು ಹೆಚ್ಚಿನ ಜನರು ಬೀಳುತ್ತಾರೆ ಏಕೆಂದರೆ ಸ್ಪ್ರೆಡ್‌ಶೀಟ್ ತಾನಾಗಿಯೇ ಅಪ್‌ಡೇಟ್ ಆಗುವುದಿಲ್ಲ ಅಥವಾ ಪ್ರಗತಿಯನ್ನು ನಿಜವೆಂದು ಅನಿಸುವಂತೆ ಮಾಡುವುದಿಲ್ಲ. ಒಂದು-ಬಾರಿಯ ಆನ್‌ಲೈನ್ ಕ್ಯಾಲ್ಕುಲೇಟರ್‌ಗಳು ಪ್ರಶ್ನೆಗೆ ಒಮ್ಮೆ ಉತ್ತರಿಸಿ ನಂತರ ನಿಮ್ಮನ್ನು ಮರೆಯುತ್ತವೆ.',
        'ನಿಮ್ಮ ಸಾಲಗಳನ್ನು ಮತ್ತು ನೀವು ಯಾವ ವಿಧಾನವನ್ನು ಅನುಸರಿಸಲು ಬಯಸುತ್ತೀರಿ ಎಂದು ವಿವರಿಸಿ, ಮತ್ತು WyberAi ಒಂದು ಲೈವ್ ಟ್ರ್ಯಾಕರ್ ನಿರ್ಮಿಸುತ್ತದೆ: ಪ್ರತಿ ಸಾಲ ಅದರ ಬಾಕಿ, ದರ, ಮತ್ತು ಕನಿಷ್ಠ ಪಾವತಿಯೊಂದಿಗೆ, ನೀವು ಹೆಚ್ಚು ಹಾಕಿದಾಗ ಪೇಆಫ್ ದಿನಾಂಕ ಹೇಗೆ ಬದಲಾಗುತ್ತದೆ ಎಂದು ನೋಡಲು ಬಿಡುವ ಹೆಚ್ಚುವರಿ-ಪಾವತಿ ಫೀಲ್ಡ್, ಮತ್ತು ಬಾಕಿ ಕಡಿಮೆಯಾದಂತೆ ತುಂಬುವ ಪ್ರತಿ-ಸಾಲಕ್ಕೆ ಪ್ರೋಗ್ರೆಸ್ ಬಾರ್. ನೀವು ಪಾವತಿ ಲಾಗ್ ಮಾಡಿದಾಗಲೆಲ್ಲ ಇದು ಮರುಲೆಕ್ಕಾಚಾರ ಮಾಡುತ್ತದೆ — ಡೌನ್‌ಲೋಡ್ ಮಾಡಿದ ಸ್ಪ್ರೆಡ್‌ಶೀಟ್‌ನಲ್ಲಿ ಹಳೆಯದಾಗುವ ಬದಲು ಪ್ಲಾನ್ ಪ್ರಾಮಾಣಿಕವಾಗಿ ಉಳಿಯುತ್ತದೆ.',
      ],
      features: [
        { title: 'ಎಲ್ಲಾ ಸಾಲಗಳು ಒಂದೇ ಜಾಗದಲ್ಲಿ', desc: 'ಕ್ರೆಡಿಟ್ ಕಾರ್ಡ್‌ಗಳು, ಸಾಲಗಳು, ಮತ್ತು ಅವುಗಳ ಬಡ್ಡಿ ದರ ಮತ್ತು ಕನಿಷ್ಠ ಪಾವತಿಯೊಂದಿಗೆ ಬಾಕಿಗಳು — ಒಂದೇ ಪಟ್ಟಿಯಲ್ಲಿ ಪೂರ್ಣ ಚಿತ್ರ.' },
        { title: 'ಸ್ನೋಬಾಲ್ ಅಥವಾ ಅವಲಾಂಚ್', desc: 'ಚಿಕ್ಕ-ಬಾಕಿ-ಮೊದಲು ಅಥವಾ ಅತ್ಯಧಿಕ-ಬಡ್ಡಿ-ಮೊದಲು ಆಯ್ಕೆಮಾಡಿ, ಆ್ಯಪ್ ಅದಕ್ಕೆ ಅನುಗುಣವಾಗಿ ನಿಮ್ಮ ಪೇಆಫ್ ಆದ್ಯತೆಯನ್ನು ಕ್ರಮಗೊಳಿಸುತ್ತದೆ.' },
        { title: 'ಹೆಚ್ಚುವರಿ-ಪಾವತಿ ಪ್ರೊಜೆಕ್ಷನ್‌ಗಳು', desc: 'ಯಾವುದೇ ತಿಂಗಳಿಗೆ ಹೆಚ್ಚುವರಿ ಸೇರಿಸಿ ಮತ್ತು ಪೇಆಫ್ ದಿನಾಂಕ ಮತ್ತು ಒಟ್ಟು ಬಡ್ಡಿ ತಕ್ಷಣ ಮರುಲೆಕ್ಕಾಚಾರ ಆಗುವುದನ್ನು ನೋಡಿ.' },
        { title: 'ಪ್ರತಿ-ಸಾಲಕ್ಕೆ ಪ್ರೋಗ್ರೆಸ್ ಬಾರ್', desc: 'ಪ್ರತಿ ಸಾಲ ಮೂಲ ಬಾಕಿ ವರ್ಸಸ್ ಉಳಿದ ಬಾಕಿ ತೋರಿಸುತ್ತದೆ — ಒಂದು ದೀರ್ಘ ಪೇಆಫ್‌ನಲ್ಲಿ ಆವೇಗ ಉಳಿಸುವ ದೃಶ್ಯ.' },
      ],
      promptExample: 'ಡೆಟ್ ಪೇಆಫ್ ಟ್ರ್ಯಾಕರ್ ವೆಬ್ ಆ್ಯಪ್ ರಚಿಸಿ: ಪ್ರತಿ ಸಾಲವನ್ನು ಬಾಕಿ, ಬಡ್ಡಿ ದರ, ಮತ್ತು ಕನಿಷ್ಠ ಪಾವತಿಯೊಂದಿಗೆ ಪಟ್ಟಿ ಮಾಡುವ, ಸ್ನೋಬಾಲ್ (ಚಿಕ್ಕ ಬಾಕಿ ಮೊದಲು) ಅಥವಾ ಅವಲಾಂಚ್ (ಅತ್ಯಧಿಕ ದರ ಮೊದಲು) ಪ್ರಕಾರ ಕ್ರಮಗೊಳಿಸಬಹುದಾದ Debts ಪೇಜ್; ನಾನು ಹೆಚ್ಚುವರಿ ಮಾಸಿಕ ಪಾವತಿ ಮೊತ್ತವನ್ನು ನಮೂದಿಸುವ ಮತ್ತು ಅಂದಾಜು ಒಟ್ಟು ಪೇಆಫ್ ದಿನಾಂಕ ಮತ್ತು ಪಾವತಿಸಿದ ಬಡ್ಡಿಯನ್ನು ನೋಡುವ Plan ಪೇಜ್; ಮತ್ತು ಪ್ರತಿ-ಸಾಲಕ್ಕೆ ಮೂಲ ಬಾಕಿ ವರ್ಸಸ್ ಪ್ರಸ್ತುತ ಬಾಕಿ ತೋರಿಸುವ ಬಾರ್ ಇರುವ Progress ಪೇಜ್.',
      faqs: [
        { q: 'ನಾನು ಯಾವ ವಿಧಾನವನ್ನು ಬಳಸಬೇಕು, ಸ್ನೋಬಾಲ್ ಅಥವಾ ಅವಲಾಂಚ್?', a: 'ಅವಲಾಂಚ್ ಗಣಿತೀಯವಾಗಿ ಹೆಚ್ಚು ಬಡ್ಡಿ ಉಳಿಸುತ್ತದೆ; ಸ್ನೋಬಾಲ್ ಆರಂಭಿಕ ಗೆಲುವುಗಳಿಂದ ಜನರನ್ನು ಪ್ರೇರೇಪಿತವಾಗಿ ಇರಿಸುತ್ತದೆ. ಟ್ರ್ಯಾಕರ್ ಎರಡನ್ನೂ ಬೆಂಬಲಿಸುತ್ತದೆ — ಯಾವಾಗ ಬೇಕಾದರೂ ಬದಲಾಯಿಸಿ ಮತ್ತು ಪೇಆಫ್ ಕ್ರಮ ಅಪ್‌ಡೇಟ್ ಆಗುತ್ತದೆ.' },
        { q: 'ನಾನು ಪಾವತಿ ಮಾಡಿದಾಗ ಇದು ಮರುಲೆಕ್ಕಾಚಾರ ಮಾಡುತ್ತದೆಯೇ?', a: 'ಹೌದು — ಯಾವುದೇ ಸಾಲದ ವಿರುದ್ಧ ಒಂದು ಪಾವತಿ ಲಾಗ್ ಮಾಡಿ ಮತ್ತು ಉಳಿದ ಬಾಕಿ, ಪ್ರೋಗ್ರೆಸ್ ಬಾರ್, ಮತ್ತು ಅಂದಾಜು ಪೇಆಫ್ ದಿನಾಂಕ ತಕ್ಷಣ ಅಪ್‌ಡೇಟ್ ಆಗುತ್ತವೆ.' },
        { q: 'ಇದು ಕಾಲಾನಂತರ ಬದಲಾಗುವ ವಿಭಿನ್ನ ಬಡ್ಡಿ ದರಗಳನ್ನು ಗಣನೆಗೆ ತೆಗೆದುಕೊಳ್ಳಬಹುದೇ?', a: 'ನಿಮ್ಮ ಪ್ರಚಾರದ ದರ ಮುಗಿಯುತ್ತಿದ್ದರೆ ದರ-ಬದಲಾವಣೆ ಫೀಲ್ಡ್ ಸೇರಿಸಿ, ಮತ್ತು ನಿಮ್ಮ ಪ್ರಾಂಪ್ಟ್‌ನಲ್ಲಿ ವೇಳಾಪಟ್ಟಿಯನ್ನು ವಿವರಿಸಿ — ಪ್ರೊಜೆಕ್ಷನ್ ಅದನ್ನು ಅನುಸರಿಸುತ್ತದೆ.' },
        { q: 'ಇದು ಒಂದು-ಬಾರಿಯ ಪೇಆಫ್ ಕ್ಯಾಲ್ಕುಲೇಟರ್‌ಗಿಂತ ಭಿನ್ನವೇ?', a: 'ಹೌದು — ಇದು ನಿಮ್ಮ ನಿಜವಾದ ಬಾಕಿಗಳು ಮತ್ತು ಪಾವತಿಗಳಿಗೆ ಸಂಬಂಧಿಸಿದ ಜೀವಂತ ಟ್ರ್ಯಾಕರ್, ನೀವು ಪ್ರತಿ ತಿಂಗಳು ಹಸ್ತಚಾಲಿತವಾಗಿ ಮರುಲೆಕ್ಕಾಚಾರ ಮಾಡಬೇಕಾದ ಸ್ಥಿರ ಫಲಿತಾಂಶವಲ್ಲ.' },
      ],
    },
    'roommate-expense-splitter': {
      h1: 'AI ಮೂಲಕ ರೂಮ್‌ಮೇಟ್ ಎಕ್ಸ್‌ಪೆನ್ಸ್ ಸ್ಪ್ಲಿಟರ್ ರಚಿಸಿ',
      metaTitle: 'AI ಮೂಲಕ ರೂಮ್‌ಮೇಟ್ ಬಿಲ್ ಸ್ಪ್ಲಿಟರ್ ಆ್ಯಪ್ ರಚಿಸಿ',
      metaDesc: 'ಹಂಚಿಕೊಂಡ ಬಿಲ್‌ಗಳು, ಆಟೋ-ಸ್ಪ್ಲಿಟ್ ಲೆಕ್ಕಾಚಾರಗಳು, ಮತ್ತು ಚಾಲನೆಯಲ್ಲಿರುವ ಯಾರು-ಯಾರಿಗೆ-ಬಾಕಿ ಬ್ಯಾಲೆನ್ಸ್ — ಸರಳ ಇಂಗ್ಲಿಷ್‌ನಿಂದ ಜನರೇಟ್ ಆದ ರೂಮ್‌ಮೇಟ್ ಎಕ್ಸ್‌ಪೆನ್ಸ್ ಆ್ಯಪ್, ಜಾಹೀರಾತುಗಳಿಲ್ಲ, ಶುಲ್ಕಗಳಿಲ್ಲ.',
      tagline: 'ಹಂಚಿಕೊಂಡ ದಿನಸಿ ಖರೀದಿಯನ್ನು ಒಮ್ಮೆ ಲಾಗ್ ಮಾಡಿ, ಆ್ಯಪ್ ಯಾರು ಏನು ಬಾಕಿ ಇದ್ದಾರೆ ಎಂದು ನೆನಪಿಟ್ಟುಕೊಳ್ಳುತ್ತದೆ — ಮಧ್ಯರಾತ್ರಿ ಉದ್ದ ಭಾಗಾಕಾರ ಮಾಡುವ ಗುಂಪು ಚಾಟ್ ಬದಲಿಗೆ.',
      body: [
        'ಪ್ರತಿ ಹಂಚಿಕೊಂಡ ಹೌಸ್‌ಹೋಲ್ಡ್ ಅದೇ ಮುರಿದ ವ್ಯವಸ್ಥೆಯನ್ನು ಮರುಶೋಧಿಸುತ್ತದೆ: ಯಾರೋ ದಿನಸಿಗೆ ಪಾವತಿಸುತ್ತಾರೆ, ಇನ್ನೊಬ್ಬರು ವಿದ್ಯುತ್ ಬಿಲ್ ಕವರ್ ಮಾಡುತ್ತಾರೆ, ಮತ್ತು ನಿಜವಾಗಿ ಯಾರು ಯಾರಿಗೆ ಬಾಕಿ ಇದ್ದಾರೆ ಎಂದು ಸಮನ್ವಯಗೊಳಿಸುವುದು ಯಾರಿಗೂ ಇಷ್ಟವಿಲ್ಲದ ಗುಂಪು-ಚಾಟ್ ವಾದವಾಗಿ ಬದಲಾಗುತ್ತದೆ. ಜನಪ್ರಿಯ ಸ್ಪ್ಲಿಟಿಂಗ್ ಆ್ಯಪ್‌ಗಳು ಕೆಲಸ ಮಾಡುತ್ತವೆ, ಆದರೆ ಅವು ಒಂದು-ಬಾರಿಯ ಟ್ರಿಪ್ ಖರ್ಚುಗಳಿಗಾಗಿ ನಿರ್ಮಿಸಲಾಗಿದೆ ಮತ್ತು ಮರುಕಳಿಸುವ-ಹೌಸ್‌ಹೋಲ್ಡ್ ಬಳಕೆ ಪ್ರಕರಣವನ್ನು ಜಾಹೀರಾತುಗಳು ಮತ್ತು ಪ್ರೀಮಿಯಂ ಟಿಯರ್‌ಗಳ ಹಿಂದೆ ಹೂತುಬಿಡುತ್ತವೆ.',
        'ನಿಮ್ಮ ಹೌಸ್‌ಹೋಲ್ಡ್ ಅನ್ನು ವಿವರಿಸಿ — ಎಷ್ಟು ಜನರು, ಬಿಲ್‌ಗಳು ಸಾಮಾನ್ಯವಾಗಿ ಹೇಗೆ ವಿಭಜನೆಯಾಗುತ್ತವೆ — ಮತ್ತು WyberAi ಅದರ ಸುತ್ತ ಲೆಡ್ಜರ್ ನಿರ್ಮಿಸುತ್ತದೆ: ಯಾರಾದರೂ ಶುಲ್ಕ ಮತ್ತು ಅದು ಹೇಗೆ ವಿಭಜನೆಯಾಗುತ್ತದೆ ಎಂದು ಸೇರಿಸಬಹುದಾದ ಹಂಚಿಕೊಂಡ ಖರ್ಚು ಲಾಗ್, "ಯಾರು ಯಾರಿಗೆ ಬಾಕಿ" ಎಂಬುದು ಲೆಕ್ಕಾಚಾರವಲ್ಲ ಒಂದು ನೋಟವಾಗುವಂತೆ ಪ್ರತಿ-ರೂಮ್‌ಮೇಟ್‌ಗೆ ಚಾಲನೆಯಲ್ಲಿರುವ ಬ್ಯಾಲೆನ್ಸ್, ಮತ್ತು ಯಾರಾದರೂ ಅಂತಿಮವಾಗಿ ತಮ್ಮ ಪಾಲನ್ನು ಮರಳಿ ಪಾವತಿಸಿದಾಗ ಒಂದು ಸೆಟಲ್-ಅಪ್ ಫ್ಲೋ.',
      ],
      features: [
        { title: 'ಹಂಚಿಕೊಂಡ ಖರ್ಚು ಲಾಗ್', desc: 'ಹೌಸ್‌ಹೋಲ್ಡ್‌ನಲ್ಲಿ ಯಾರಾದರೂ ಒಂದು ಶುಲ್ಕವನ್ನು ಲಾಗ್ ಮಾಡುತ್ತಾರೆ — ದಿನಸಿ, ಯುಟಿಲಿಟಿಗಳು, ಬಾಡಿಗೆ — ಯಾರು ಪಾವತಿಸಿದರು ಮತ್ತು ಅದು ಹೇಗೆ ವಿಭಜನೆಯಾಗುತ್ತದೆ ಎಂಬುದರೊಂದಿಗೆ.' },
        { title: 'ಹೊಂದಿಕೊಳ್ಳುವ ವಿಭಜನೆ ನಿಯಮಗಳು', desc: 'ಸಮಾನ ವಿಭಜನೆ, ಕಸ್ಟಮ್ ಶೇಕಡಾವಾರುಗಳು, ಅಥವಾ "ಬರೀ ಈ ಇಬ್ಬರು ಜನರು" — ವಿಭಜನೆ ಪ್ರತಿ-ಖರ್ಚಿಗೆ ಸೆಟ್ ಆಗಿದೆ, ಒಂದು ನಿಯಮಕ್ಕೆ ಬಲವಂತವಿಲ್ಲ.' },
        { title: 'ಪ್ರತಿ-ವ್ಯಕ್ತಿ ಚಾಲನೆಯಲ್ಲಿರುವ ಬ್ಯಾಲೆನ್ಸ್', desc: 'ಯಾರು ಯಾರಿಗೆ ಎಷ್ಟು ಬಾಕಿ ಇದ್ದಾರೆ ಎಂಬುದರ ಲೈವ್ ವ್ಯೂ, ಹೊಸ ಖರ್ಚು ಬಂದ ಕ್ಷಣ ಅಪ್‌ಡೇಟ್ ಆಗುತ್ತದೆ.' },
        { title: 'ಸೆಟಲ್-ಅಪ್ ಟ್ರ್ಯಾಕಿಂಗ್', desc: 'ನಗದು ಅಥವಾ ವರ್ಗಾವಣೆಯಲ್ಲಿ ಮರಳಿ ಪಾವತಿಸಿದಾಗ ಸಾಲವನ್ನು ಸೆಟಲ್ಡ್ ಎಂದು ಗುರುತಿಸಿ, ಇತಿಹಾಸವನ್ನು ಅಳಿಸದೆ ಬ್ಯಾಲೆನ್ಸ್ ಅನ್ನು ಸಾಫ್ ಮಾಡುತ್ತದೆ.' },
      ],
      promptExample: '3-ವ್ಯಕ್ತಿ ಹೌಸ್‌ಹೋಲ್ಡ್‌ಗಾಗಿ ರೂಮ್‌ಮೇಟ್ ಎಕ್ಸ್‌ಪೆನ್ಸ್ ಸ್ಪ್ಲಿಟರ್ ಮೊಬೈಲ್ ಆ್ಯಪ್ ರಚಿಸಿ: ಯಾರಾದರೂ ಮೊತ್ತ, ವಿವರಣೆ, ಯಾರು ಪಾವತಿಸಿದರು, ಮತ್ತು ಅದು ಹೇಗೆ ವಿಭಜನೆಯಾಗುತ್ತದೆ (ಸಮಾನ, ಕಸ್ಟಮ್ ಶೇಕಡಾವಾರು, ಅಥವಾ ನಿರ್ದಿಷ್ಟ ಜನರು) ಎಂಬುದರೊಂದಿಗೆ ಶುಲ್ಕವನ್ನು ಲಾಗ್ ಮಾಡುವ Add Expense ಸ್ಕ್ರೀನ್; ಹೌಸ್‌ಹೋಲ್ಡ್‌ನಾದ್ಯಂತ ಯಾರು ಯಾರಿಗೆ ಬಾಕಿ ಇದ್ದಾರೆ ಎಂಬುದರ ಚಾಲನೆಯಲ್ಲಿರುವ ಒಟ್ಟು ತೋರಿಸುವ Balances ಸ್ಕ್ರೀನ್; ಮತ್ತು ಒಂದು ಸಾಲವನ್ನು ಪಾವತಿಸಲಾಗಿದೆ ಎಂದು ಗುರುತಿಸಲು, ಖರ್ಚು ಇತಿಹಾಸವನ್ನು ಇಟ್ಟುಕೊಂಡು ಬ್ಯಾಲೆನ್ಸ್ ಅನ್ನು ಸಾಫ್ ಮಾಡುವ Settle Up ಸ್ಕ್ರೀನ್.',
      faqs: [
        { q: 'ಇದು ಅಸಮಾನ ವಿಭಜನೆಗಳನ್ನು ನಿಭಾಯಿಸಬಹುದೇ, ಒಬ್ಬರ ಅತಿಥಿಯಂತೆ?', a: 'ಹೌದು — ಪ್ರತಿ-ಖರ್ಚಿಗೆ ಕಸ್ಟಮ್ ವಿಭಜನೆ ಸೆಟ್ ಮಾಡಿ, ಆದ್ದರಿಂದ ಮೂರರಲ್ಲಿ ಇಬ್ಬರು ರೂಮ್‌ಮೇಟ್‌ಗಳು ಮಾತ್ರ ಊಟ ಮಾಡಿದ ಡಿನ್ನರ್ ಆ ಇಬ್ಬರ ನಡುವೆ ಮಾತ್ರ ವಿಭಜನೆಯಾಗುತ್ತದೆ.' },
        { q: 'ಇದು ರೂಮ್‌ಮೇಟ್‌ಗಳಿಗಿಂತ ಹೆಚ್ಚಿಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆಯೇ — ಟ್ರಿಪ್‌ಗಳಿಗೂ?', a: 'ಅದೇ ರಚನೆ ಯಾವುದೇ ಹಂಚಿಕೊಂಡ-ಖರ್ಚು ಗುಂಪಿಗೆ ಹೊಂದುತ್ತದೆ; ನಿಮ್ಮ ಬಳಕೆ ಪ್ರಕರಣವನ್ನು ವಿವರಿಸಿ (ಒಂದು ಟ್ರಿಪ್, ಹಂಚಿಕೊಂಡ ಚಂದಾದಾರಿಕೆ) ಮತ್ತು ವಿಭಜನೆ ತರ್ಕ ಅದನ್ನು ಅನುಸರಿಸುತ್ತದೆ.' },
        { q: 'ಯಾರಾದರೂ ಹೌಸ್‌ಹೋಲ್ಡ್ ಬಿಟ್ಟು ಅವರ ಅಂತಿಮ ಬ್ಯಾಲೆನ್ಸ್ ಅನ್ನು ಸೆಟಲ್ ಮಾಡಬಹುದೇ?', a: 'ಹೌದು — ಅಂತಿಮ ಸೆಟಲ್-ಅಪ್ ಅವರ ಬ್ಯಾಲೆನ್ಸ್ ಅನ್ನು ಶೂನ್ಯಕ್ಕೆ ಸಾಫ್ ಮಾಡುತ್ತದೆ, ಮತ್ತು ಅವರ ಐತಿಹಾಸಿಕ ಖರ್ಚುಗಳು ಉಲ್ಲೇಖಕ್ಕಾಗಿ ಲಾಗ್‌ನಲ್ಲಿ ಉಳಿಯುತ್ತವೆ.' },
        { q: 'ನನ್ನ ರೂಮ್‌ಮೇಟ್‌ಗಳೊಂದಿಗೆ ಬಳಸಲು ಇದು ಉಚಿತವೇ?', a: 'ಹೌದು — ಜಾಹೀರಾತುಗಳಿಲ್ಲ, ಪ್ರತಿ-ವಹಿವಾಟು ಶುಲ್ಕವಿಲ್ಲ. ರಚಿಸಲು ಉಚಿತ ಮಾಸಿಕ ಕ್ರೆಡಿಟ್‌ಗಳು ಬಳಕೆಯಾಗುತ್ತವೆ, ಮತ್ತು ಅಲ್ಲಿಂದ ಆ್ಯಪ್ ನಿಮ್ಮದಾಗಿ ಚಲಿಸುತ್ತದೆ.' },
      ],
    },
  },
  te: {
    'expense-tracker-app': {
      h1: 'AIతో ఖర్చుల ట్రాకర్ యాప్‌ను నిర్మించండి',
      metaTitle: 'AIతో ఖర్చుల ట్రాకర్ యాప్‌ను నిర్మించండి — కోడ్ లేకుండా',
      metaDesc: 'కేటగిరీ వారీగా ఖర్చును ట్రాక్ చేయండి, వ్యాపారాన్ని వ్యక్తిగతం నుండి వేరు చేయండి, మరియు నెల ఎక్కడికి వెళ్లిందో చూడండి — సాదా ఇంగ్లీష్ వివరణ నుండి జనరేట్ చేయబడిన ఖర్చుల ట్రాకర్.',
      tagline: 'మీ కేటగిరీలు, మీ కరెన్సీలు, మీ పన్ను సీజన్ — మీ డబ్బు నిజంగా ఎలా కదులుతుందో దానికి సరిపోయే ఖర్చుల ట్రాకర్.',
      body: [
        'ఖర్చు యాప్‌లు రెండు రకాలుగా వస్తాయి, రెండూ తప్పుతాయి: బ్యాంక్-లింక్డ్ యాప్‌లు "Amazon"ని రహస్యంగా ఆటో-కేటగరైజ్ చేస్తాయి, మరియు మినిమలిస్ట్ ట్రాకర్‌లు ఏప్రిల్‌లో ముఖ్యమైన ఒక్క ప్రశ్నకు సమాధానం ఇవ్వలేవు — వీటిలో ఏవి వ్యాపార ఖర్చులు, రసీదులు ఎక్కడ ఉన్నాయి?',
        'మీరు నిజంగా డబ్బును ఎలా ట్రాక్ చేస్తారో వివరించండి — మీరు ఆలోచించే కేటగిరీలు, ఫ్రీలాన్స్ ఖర్చులను వేరు చేయాలా, మీ అకౌంటెంట్ ఏ నివేదిక అడుగుతారు — మరియు WyberAi ఆ ట్రాకర్‌ను జనరేట్ చేస్తుంది: మీ కేటగిరీలతో వేగవంతమైన నమోదు, మీ ఖర్చు ఆకారాన్ని చూపే నెలవారీ డాష్‌బోర్డ్, మరియు పన్ను సమయం కోసం నిర్మించిన ఎగుమతి వ్యూ. మరుకుతున్న బిల్లులు, ప్రయాణానికి బహుళ కరెన్సీలు, రసీదు ఫోటో ఫీల్డ్ — చెప్పండి మరియు స్కీమాలో అది ఉంటుంది.',
      ],
      features: [
        { title: 'వేగవంతమైన నమోదు, మీ కేటగిరీలు', desc: 'మొత్తం, కేటగిరీ, గమనిక, పూర్తయింది — మీరు నిర్వచించిన కేటగిరీ జాబితాతో, బ్యాంక్ ఊహతో కాదు.' },
        { title: 'వ్యాపారం / వ్యక్తిగత విభజన', desc: 'ఏ ఖర్చునైనా వ్యాపారంగా ఫ్లాగ్ చేయండి; పన్ను-సీజన్ నివేదికలు మీ అకౌంటెంట్‌కు కావలసినదానికే ఫిల్టర్ చేస్తాయి.' },
        { title: 'నెలవారీ డాష్‌బోర్డ్', desc: 'ఏ నెలకైనా కేటగిరీ వారీగా ఖర్చు, ఏ కేటగిరీ పెరుగుతుందో చూపే ట్రెండ్ లైన్‌లతో.' },
        { title: 'పునరావృత ఖర్చులు', desc: 'అద్దె, సబ్‌స్క్రిప్షన్‌లు, బీమా — ప్రతి చక్రంలో స్వయంచాలకంగా లాగ్ చేయబడతాయి కాబట్టి చిత్రం పూర్తిగా ఉంటుంది.' },
      ],
      promptExample: 'ఖర్చుల ట్రాకర్ వెబ్ యాప్‌ను నిర్మించండి: మొత్తం, కేటగిరీ (నా కస్టమ్ జాబితా), తేదీ, ఐచ్ఛిక గమనిక, వ్యాపారం/వ్యక్తిగత టోగుల్, మరియు ఐచ్ఛిక రసీదు ఫోటోతో Add Expense ఫారమ్; ఈ నెల మొత్తం మరియు గత నెలతో పోలికతో కేటగిరీ విభజన చార్ట్‌ను చూపే Dashboard; మరియు CSV ఎగుమతితో తేదీ పరిధి ద్వారా వ్యాపార ఖర్చులను ఫిల్టర్ చేసే Reports పేజీ.',
      faqs: [
        { q: 'ఇది ఒకటి కంటే ఎక్కువ కరెన్సీని నిర్వహించగలదా?', a: 'అవును — మీ ప్రాంప్ట్‌లో ప్రతి-ఖర్చుకు కరెన్సీని జోడించండి, హోమ్ కరెన్సీని సెట్ చేయండి, మరియు మొత్తాలు మీరు నియంత్రించే రేట్లలో మార్చబడతాయి.' },
        { q: 'నేను రసీదులను జోడించవచ్చా?', a: 'ఖర్చులకు ఫోటో ఫీల్డ్‌ను జోడించండి మరియు ప్రతి ఎంట్రీ దాని రసీదు చిత్రాన్ని నిల్వ చేస్తుంది — పన్ను-సీజన్‌లో మీరు ఈరోజు మీకు ధన్యవాదాలు చెబుతారు.' },
        { q: 'ఇది నా బ్యాంక్‌కు కనెక్ట్ అవుతుందా?', a: 'జనరేట్ చేయబడిన యాప్‌లు మొదట్లో బ్యాంక్ ఫీడ్‌లకు లింక్ కావు — ఇది ఉద్దేశపూర్వక-నమోదు ట్రాకర్, అందుకే దాని కేటగిరీలు ఎల్లప్పుడూ సరిగ్గా ఉంటాయి.' },
        { q: 'దీన్ని నిర్మించడానికి ఎంత ఖర్చు అవుతుంది?', a: '50 ఉచిత నెలవారీ క్రెడిట్‌లు మీ మొదటి బిల్డ్‌ను కవర్ చేస్తాయి (30 క్రెడిట్‌లు); ఆ తర్వాత, మార్పులు 2-క్రెడిట్ ఎడిట్‌లు. ప్రారంభించడానికి కార్డు అవసరం లేదు.' },
      ],
    },
    'budget-planner-app': {
      h1: 'AIతో బడ్జెట్ ప్లానర్ యాప్‌ను నిర్మించండి',
      metaTitle: 'AIతో బడ్జెట్ ప్లానింగ్ యాప్‌ను నిర్మించండి — కోడ్ లేకుండా',
      metaDesc: 'ఎన్వలప్ బడ్జెట్‌లు, పొదుపు లక్ష్యాలు, మరియు "మనం దీన్ని భరించగలమా?" అనే దానికి నిజమైన సమాధానం — నిమిషాల్లో మీ వివరణ నుండి జనరేట్ చేయబడిన కుటుంబ బడ్జెట్ యాప్.',
      tagline: 'నెల ప్రారంభంలో ప్రతి రూపాయి లేదా డాలర్‌కు ఒక పనిని ఇవ్వండి, మరియు నెల మధ్యలో ప్రతి ఎన్వలప్‌లో ఏమి మిగిలి ఉందో ఖచ్చితంగా తెలుసుకోండి.',
      body: [
        'బడ్జెటింగ్ పద్ధతులు పని చేస్తాయి; బడ్జెటింగ్ సాధనాల వద్దే కుటుంబాలు విఫలమవుతాయి. స్ప్రెడ్‌షీట్‌కు నిర్వాహకుడు అవసరం, ప్రసిద్ధ యాప్‌లు ఇతరుల పద్ధతిని అమలు చేయడానికి నెలవారీ ఛార్జ్ చేస్తాయి, మరియు జంటలకు అత్యంత పాత సింక్ సమస్య మిగిలిపోతుంది — ఇద్దరు వ్యక్తులు, ఒక డబ్బు పూల్, భాగస్వామ్య చిత్రం లేదు.',
        'మీరు ఎన్వలప్‌లను నడిపినా, 50/30/20, లేదా సాధారణ "బిల్లులు, సరదా, పొదుపు" విభజననైనా అనుసరించినా, WyberAi మీ పద్ధతి చుట్టూ ప్లానర్‌ను నిర్మిస్తుంది: నెలవారీ కేటగిరీ బడ్జెట్‌లు, వాటికి వ్యతిరేకంగా లాగ్ చేయబడిన ఖర్చు, మరియు ఇద్దరు భాగస్వాములు అప్‌డేట్ చేయగల భాగస్వామ్య వ్యూ. నెల మధ్య చూపు — మూడు ఆకుపచ్చ ఎన్వలప్‌లు, ఒకటి అంబర్, ఒకటి ఎరుపు — స్ప్రెడ్‌షీట్ మరియు వాదన రెండింటినీ భర్తీ చేస్తుంది.',
      ],
      features: [
        { title: 'ఎన్వలప్-శైలి బడ్జెట్‌లు', desc: 'ప్రతి నెల ప్రతి-కేటగిరీకి ఒక మొత్తాన్ని సెట్ చేయండి; ప్రతి ఖర్చు కనిపించే మిగిలిన బ్యాలెన్స్‌తో దాని ఎన్వలప్ నుండి తగ్గుతుంది.' },
        { title: 'భాగస్వామ్య కుటుంబ వ్యూ', desc: 'రెండు లాగిన్‌లు, ఒక బడ్జెట్ — ఇద్దరు భాగస్వాములు ఖర్చును లాగ్ చేసి అదే రియల్-టైమ్ చిత్రాన్ని చూస్తారు.' },
        { title: 'పొదుపు లక్ష్యాలు', desc: 'అత్యవసర నిధి, సెలవు, కొత్త ల్యాప్‌టాప్ — లక్ష్యాలు మరియు తేదీ వరకు ట్రాక్ చేయబడిన నెలవారీ విరాళాలు.' },
        { title: 'నెల రోల్‌ఓవర్', desc: 'నెలను మూసివేయండి, నియమం ప్రకారం ఖర్చు చేయని బ్యాలెన్స్‌లను ముందుకు తీసుకెళ్లండి (లేదా రీసెట్ చేయండి), మరియు ఒకే క్లిక్‌లో తదుపరిదాన్ని ప్రారంభించండి.' },
      ],
      promptExample: 'కుటుంబ బడ్జెట్ ప్లానర్ వెబ్ యాప్‌ను నిర్మించండి: ఖర్చు చేసినది మరియు మిగిలినదాన్ని చూపే ఎన్వలప్‌లుగా ప్రతి-కేటగిరీకి (అద్దె, కిరాణా, రవాణా, సరదా, పొదుపు) నెలవారీ మొత్తాలను మనం సెట్ చేసే Budget పేజీ; ఒక ఎన్వలప్ నుండి తీసుకునే వేగవంతమైన Add Expense ఫారమ్; పొదుపు లక్ష్యాలు, నెలవారీ విరాళాలు, మరియు అంచనా పూర్తి తేదీలతో Goals పేజీ; మరియు ఒక బడ్జెట్‌ను పంచుకునే రెండు వినియోగదారు ఖాతాలకు మద్దతు.',
      faqs: [
        { q: 'నా భాగస్వామి మరియు నేను ఇద్దరూ దీన్ని ఉపయోగించవచ్చా?', a: 'అవును — ఇది ప్రామాణీకరణతో జనరేట్ అవుతుంది, మరియు భాగస్వామ్య-కుటుంబ నిర్మాణం అంటే మీరిద్దరూ అదే బడ్జెట్‌ను లైవ్‌గా చూసి అప్‌డేట్ చేస్తారు.' },
        { q: 'నెల చివరిలో మిగిలిన డబ్బుకు ఏమి జరుగుతుంది?', a: 'మీ నియమం ఎంపిక: ఖర్చు చేయని బ్యాలెన్స్‌లను తదుపరి నెల ఎన్వలప్‌లోకి రోల్ చేయండి, వాటిని పొదుపు లక్ష్యానికి తరలించండి, లేదా రీసెట్ చేయండి — దీన్ని ప్రాంప్ట్‌లో సెట్ చేయండి లేదా చాట్‌లో మార్చండి.' },
        { q: 'ఇది ఎన్వలప్‌లకు బదులుగా 50/30/20 పద్ధతిని చేయగలదా?', a: 'అవును — మీరు అనుసరించే పద్ధతిని వివరించండి మరియు బడ్జెట్ నిర్మాణం, గణితం, మరియు డాష్‌బోర్డ్ దానికి సరిపోయేలా జనరేట్ చేయబడతాయి.' },
        { q: 'మా ఆర్థిక డేటా ప్రైవేట్‌గా ఉందా?', a: 'యాప్ రో-లెవెల్ సెక్యూరిటీతో దాని స్వంత Postgres డేటాబేస్‌లో నడుస్తుంది, మరియు ప్రచురించే ముందు WyberAi యొక్క లైవ్ స్కాన్ దీన్ని దాడి చేసేవారిలా పరిశీలిస్తుంది.' },
      ],
    },
    'subscription-tracker': {
      h1: 'AIతో సబ్‌స్క్రిప్షన్ ట్రాకర్ యాప్‌ను నిర్మించండి',
      metaTitle: 'AIతో సబ్‌స్క్రిప్షన్ ట్రాకర్ యాప్‌ను నిర్మించండి — కోడ్ లేకుండా',
      metaDesc: 'ప్రతి పునరావృత ఛార్జ్ ఒకే చోట: పునరుద్ధరణ క్యాలెండర్, నెలవారీ మొత్తం, మరియు రద్దు-చేయవలసిన తేదీలు. సాదా ఇంగ్లీష్ ప్రాంప్ట్ నుండి నిర్మించబడింది — ప్రారంభించడం ఉచితం.',
      tagline: '"ఆగండి, మనం దానికి కూడా చెల్లిస్తామా?" అని సమాధానం ఇచ్చే యాప్ — ప్రతి పునరావృత ఛార్జ్, దాని పునరుద్ధరణ తేదీ, మరియు నెలవారీ నష్టం ఒకే వ్యూలో.',
      body: [
        'సబ్‌స్క్రిప్షన్‌లపై నెలకు మూడు వందలు ఖర్చు చేయాలని ఎవరూ నిర్ణయించుకోరు; ఇది ఒక సమయంలో ఒక ఉచిత ట్రయల్ నుండి, రెండు యాప్ స్టోర్‌లలో, కొన్ని వెబ్‌సైట్‌లలో, మరియు ఇంకొకరి Netflix పాస్‌వర్డ్ మీ Netflix బిల్‌గా మారడం ద్వారా పేరుకుపోతుంది. మరచిపోవడమే వ్యాపార నమూనా — వార్షిక పునరుద్ధరణలు మీకు తేదీ గుర్తుండదనే బెట్‌పై ధర నిర్ణయించబడతాయి.',
        'సబ్‌స్క్రిప్షన్ ట్రాకర్ ఒక చిన్న, పదునైన సాధనం: ప్రతి పునరావృత ఛార్జ్ దాని మొత్తం, చక్రం, మరియు పునరుద్ధరణ తేదీతో; ఏమి రాబోతుందో అనే క్యాలెండర్; మరియు సంచయనాన్ని కనిపించేలా చేసే నడుస్తున్న నెలవారీ మొత్తం. WyberAi దీన్ని ఒక-పేరా వివరణ నుండి జనరేట్ చేస్తుంది — మరియు పునరుద్ధరణ తేదీలు మీ స్వంత డేటాబేస్‌లో ఉంటాయి కాబట్టి, "ఈ తేదీలోగా రద్దు చేయండి" హెచ్చరిక విండోను లేదా ధర-పెరుగుదల చరిత్రను జోడించడం చాట్‌లో ఒక ఎడిట్, మీ మతిమరుపును సొమ్ము చేసుకుంటున్న కంపెనీకి ఫీచర్ అభ్యర్థన కాదు.',
      ],
      features: [
        { title: 'అన్ని ఛార్జీలు, ఒక లెడ్జర్', desc: 'స్ట్రీమింగ్, SaaS, జిమ్, డొమైన్‌లు, బీమా — ప్రతి ఒక్కటి మొత్తం, బిల్లింగ్ చక్రం, చెల్లింపు విధానం, మరియు కేటగిరీతో.' },
        { title: 'పునరుద్ధరణ క్యాలెండర్', desc: 'ఎప్పుడు ఏమి ఛార్జ్ అవుతుంది, ఈ నెల మరియు తర్వాతిది — వార్షిక పునరుద్ధరణలు ఇక ఆకస్మిక దాడులుగా ఉండవు.' },
        { title: 'నిజమైన నెలవారీ మొత్తం', desc: 'వార్షిక మరియు త్రైమాసిక ప్రణాళికలు నెలవారీ సంఖ్యకు సాధారణీకరించబడ్డాయి, కాబట్టి నిజమైన రన్-రేట్ ఒక సంఖ్య.' },
        { title: 'రద్దు-చేయవలసిన హెచ్చరికలు', desc: 'ప్రతి పునరుద్ధరణకు ముందు ఫ్లాగ్ చేయబడిన విండో — రద్దు చేయడం నిజంగా ఛార్జీని ఆదా చేసే రోజులు.' },
      ],
      promptExample: 'సబ్‌స్క్రిప్షన్ ట్రాకర్ వెబ్ యాప్‌ను నిర్మించండి: పేరు, ధర, బిల్లింగ్ చక్రం (నెలవారీ/త్రైమాసిక/వార్షిక), తదుపరి పునరుద్ధరణ తేదీ, చెల్లింపు విధానం, మరియు కేటగిరీతో ప్రతి సేవను జాబితా చేసే Subscriptions పేజీ; సాధారణీకరించిన నెలవారీ మొత్తం, కేటగిరీ విభజన, మరియు రాబోయే 30 రోజుల రాబోయే పునరుద్ధరణలను చూపే Dashboard; మరియు నేను మాన్యువల్‌గా అప్‌డేట్ చేసే "చివరిసారి ఉపయోగించినది" ఫీల్డ్‌తో వార్షిక ఖర్చు ప్రకారం సబ్‌స్క్రిప్షన్‌లను ర్యాంక్ చేసే Insights పేజీ.',
      faqs: [
        { q: 'ఇది పునరుద్ధరణకు ముందు నాకు గుర్తు చేయగలదా?', a: 'రాబోయే-పునరుద్ధరణల వ్యూ మీ హెచ్చరిక విండో లోపల ఉన్న దేనినైనా హైలైట్ చేస్తుంది; మీకు పుష్ కావాలంటే ప్రచురించేటప్పుడు ఇమెయిల్ రిమైండర్‌లను జోడించమని చాట్‌ను అడగండి.' },
        { q: 'ఇది నా బ్యాంక్ ఖాతా నుండి సబ్‌స్క్రిప్షన్‌లను గుర్తిస్తుందా?', a: 'లేదు — ఎంట్రీలు ఉద్దేశపూర్వకమైనవి, దీన్ని సెటప్ చేయడానికి పది నిమిషాలు పడుతుంది మరియు యాప్ స్టోర్‌లలో దాగి ఉన్నవాటితో సహా జాబితా పూర్తి మరియు సరైనదని అర్థం.' },
        { q: 'ఇది భాగస్వామ్య కుటుంబ సబ్‌స్క్రిప్షన్‌లను ట్రాక్ చేయగలదా?', a: 'అవును — మీ ప్రాంప్ట్‌లో "ఎవరితో పంచుకున్నారు" లేదా ప్రతి-వ్యక్తి విభజన ఫీల్డ్‌ను జోడించండి మరియు నెలవారీ మొత్తం మీ వాటాను కుటుంబం మొత్తానికి వ్యతిరేకంగా చూపగలదు.' },
        { q: 'స్ప్రెడ్‌షీట్ ఎందుకు ఉపయోగించకూడదు?', a: 'ట్రాకర్ అంటే స్ప్రెడ్‌షీట్ దాని స్వంత పునరుద్ధరణ క్యాలెండర్‌ను నిర్వహించినప్పుడు, చక్రాలను ఒక మొత్తానికి సాధారణీకరించినప్పుడు, మరియు మీ ఫోన్‌లో బాగా కనిపించినప్పుడు అవుతుంది.' },
      ],
    },
    'debt-payoff-tracker': {
      h1: 'AIతో అప్పు తీర్చే ట్రాకర్‌ను నిర్మించండి',
      metaTitle: 'AIతో అప్పు తీర్చే ట్రాకర్ యాప్‌ను నిర్మించండి',
      metaDesc: 'స్నోబాల్ లేదా అవలాంచ్ పద్ధతి, ప్రతి-అప్పుకు ప్రోగ్రెస్ బార్, మరియు నిజమైన చెల్లింపు తేదీ — సాదా ఇంగ్లీష్ నుండి జనరేట్ చేయబడిన అప్పు ట్రాకర్, సాధారణ కాలిక్యులేటర్ కాదు.',
      tagline: 'ప్రతి అప్పు, దాని బ్యాలెన్స్, మరియు నిజమైన అంచనా చెల్లింపు తేదీ — సాఫ్ట్‌వేర్‌గా స్నోబాల్ లేదా అవలాంచ్ పద్ధతి, మీరు చేతితో మళ్ళీ నడిపే స్థిర కాలిక్యులేటర్ కాదు.',
      body: [
        'బహుళ అప్పులను తీర్చడం మనస్తత్వశాస్త్ర సమస్యపై స్వారీ చేసే గణిత సమస్య: అవలాంచ్ పద్ధతి అత్యధిక వడ్డీని ఆదా చేస్తుంది, స్నోబాల్ పద్ధతి చిన్న బ్యాలెన్స్‌లను ముందుగా క్లియర్ చేయడం ద్వారా ప్రేరణ నిలుపుకుంటుంది, మరియు చాలా మంది స్ప్రెడ్‌షీట్ స్వయంగా అప్‌డేట్ కాకపోవడం లేదా పురోగతిని నిజమైనదిగా అనిపించకపోవడం వల్ల విఫలమవుతారు. ఒక-సారి ఆన్‌లైన్ కాలిక్యులేటర్‌లు ప్రశ్నకు ఒకసారి సమాధానం ఇచ్చి తర్వాత మిమ్మల్ని మర్చిపోతాయి.',
        'మీ అప్పులను మరియు మీరు ఏ పద్ధతిని అనుసరించాలనుకుంటున్నారో వివరించండి, మరియు WyberAi ఒక లైవ్ ట్రాకర్‌ను నిర్మిస్తుంది: ప్రతి అప్పు దాని బ్యాలెన్స్, రేటు, మరియు కనీస చెల్లింపుతో, మీరు ఎక్కువ వేసినప్పుడు చెల్లింపు తేదీ ఎలా మారుతుందో చూడనిచ్చే అదనపు-చెల్లింపు ఫీల్డ్, మరియు బ్యాలెన్స్ తగ్గినప్పుడు నిండే ప్రతి-అప్పుకు ప్రోగ్రెస్ బార్. మీరు చెల్లింపును లాగ్ చేసిన ప్రతిసారీ ఇది మళ్ళీ లెక్కిస్తుంది — డౌన్‌లోడ్ చేసిన స్ప్రెడ్‌షీట్‌లో పాతబడిపోకుండా ప్రణాళిక నిజాయితీగా ఉంటుంది.',
      ],
      features: [
        { title: 'అన్ని అప్పులు ఒకే చోట', desc: 'క్రెడిట్ కార్డులు, రుణాలు, మరియు వాటి వడ్డీ రేటు మరియు కనీస చెల్లింపుతో బ్యాలెన్స్‌లు — ఒకే జాబితాలో పూర్తి చిత్రం.' },
        { title: 'స్నోబాల్ లేదా అవలాంచ్', desc: 'చిన్న-బ్యాలెన్స్-మొదట లేదా అత్యధిక-వడ్డీ-మొదట ఎంచుకోండి, యాప్ దాని ప్రకారం మీ చెల్లింపు ప్రాధాన్యతను క్రమం చేస్తుంది.' },
        { title: 'అదనపు-చెల్లింపు అంచనాలు', desc: 'ఏదైనా నెలకు అదనంగా జోడించి చెల్లింపు తేదీ మరియు మొత్తం వడ్డీ వెంటనే మళ్ళీ లెక్కించడం చూడండి.' },
        { title: 'ప్రతి-అప్పుకు ప్రోగ్రెస్ బార్', desc: 'ప్రతి అప్పు అసలు బ్యాలెన్స్ వర్సెస్ మిగిలినదాన్ని చూపుతుంది — దీర్ఘ చెల్లింపు అంతటా వేగాన్ని కొనసాగించే దృశ్యం.' },
      ],
      promptExample: 'అప్పు తీర్చే ట్రాకర్ వెబ్ యాప్‌ను నిర్మించండి: ప్రతి అప్పును బ్యాలెన్స్, వడ్డీ రేటు, మరియు కనీస చెల్లింపుతో జాబితా చేసే, స్నోబాల్ (చిన్న బ్యాలెన్స్ మొదట) లేదా అవలాంచ్ (అత్యధిక రేటు మొదట) ద్వారా క్రమం చేయదగిన Debts పేజీ; నేను అదనపు నెలవారీ చెల్లింపు మొత్తాన్ని నమోదు చేసి అంచనా మొత్తం చెల్లింపు తేదీ మరియు చెల్లించిన వడ్డీని చూసే Plan పేజీ; మరియు ప్రతి-అప్పుకు అసలు బ్యాలెన్స్ వర్సెస్ ప్రస్తుత బ్యాలెన్స్‌ను చూపే బార్ ఉన్న Progress పేజీ.',
      faqs: [
        { q: 'నేను ఏ పద్ధతిని ఉపయోగించాలి, స్నోబాల్ లేదా అవలాంచ్?', a: 'అవలాంచ్ గణితశాస్త్రపరంగా ఎక్కువ వడ్డీని ఆదా చేస్తుంది; స్నోబాల్ ప్రారంభ విజయాలతో వ్యక్తులను ప్రేరేపితంగా ఉంచుతుంది. ట్రాకర్ రెండింటికీ మద్దతు ఇస్తుంది — ఎప్పుడైనా మారండి మరియు చెల్లింపు క్రమం అప్‌డేట్ అవుతుంది.' },
        { q: 'నేను చెల్లింపు చేసినప్పుడు ఇది మళ్ళీ లెక్కిస్తుందా?', a: 'అవును — ఏదైనా అప్పుకు వ్యతిరేకంగా చెల్లింపును లాగ్ చేయండి మరియు మిగిలిన బ్యాలెన్స్, ప్రోగ్రెస్ బార్, మరియు అంచనా చెల్లింపు తేదీ వెంటనే అప్‌డేట్ అవుతాయి.' },
        { q: 'ఇది కాలక్రమేణా మారే వివిధ వడ్డీ రేట్లను పరిగణించగలదా?', a: 'మీ ప్రమోషనల్ రేటు ముగుస్తుంటే రేటు-మార్పు ఫీల్డ్‌ను జోడించండి, మరియు మీ ప్రాంప్ట్‌లో షెడ్యూల్‌ను వివరించండి — అంచనా దానిని అనుసరిస్తుంది.' },
        { q: 'ఇది ఒక-సారి చెల్లింపు కాలిక్యులేటర్ నుండి భిన్నమా?', a: 'అవును — ఇది మీ నిజమైన బ్యాలెన్స్‌లు మరియు చెల్లింపులకు అనుసంధానించబడిన సజీవ ట్రాకర్, మీరు ప్రతి నెలా మాన్యువల్‌గా మళ్ళీ లెక్కించాల్సిన స్థిర ఫలితం కాదు.' },
      ],
    },
    'roommate-expense-splitter': {
      h1: 'AIతో రూమ్మేట్ ఖర్చు విభజన యాప్‌ను నిర్మించండి',
      metaTitle: 'AIతో రూమ్మేట్ బిల్ స్ప్లిటర్ యాప్‌ను నిర్మించండి',
      metaDesc: 'భాగస్వామ్య బిల్లులు, ఆటో-స్ప్లిట్ లెక్కలు, మరియు నడుస్తున్న ఎవరు-ఎవరికి-బాకీ బ్యాలెన్స్ — సాదా ఇంగ్లీష్ నుండి జనరేట్ చేయబడిన రూమ్మేట్ ఖర్చు యాప్, ప్రకటనలు లేవు, రుసుములు లేవు.',
      tagline: 'భాగస్వామ్య కిరాణా ట్రిప్‌ను ఒకసారి లాగ్ చేయండి, యాప్ ఎవరు ఏమి బాకీ ఉన్నారో గుర్తుంచుకుంటుంది — అర్ధరాత్రి పొడవైన భాగహారం చేసే గ్రూప్ చాట్‌కు బదులుగా.',
      body: [
        'ప్రతి భాగస్వామ్య కుటుంబం అదే విరిగిన వ్యవస్థను మళ్ళీ కనుగొంటుంది: ఎవరో కిరాణాకు చెల్లిస్తారు, ఇంకెవరో విద్యుత్ బిల్‌ను కవర్ చేస్తారు, మరియు నిజంగా ఎవరు ఎవరికి బాకీ ఉన్నారో సరిచూసుకోవడం ఎవరికీ నచ్చని గ్రూప్-చాట్ వాదనగా మారుతుంది. ప్రసిద్ధ స్ప్లిటింగ్ యాప్‌లు పని చేస్తాయి, కానీ అవి ఒక-సారి ట్రిప్ ఖర్చుల కోసం నిర్మించబడ్డాయి మరియు పునరావృత-కుటుంబ వినియోగ కేసును ప్రకటనలు మరియు ప్రీమియం టైర్ల వెనుక పాతిపెడతాయి.',
        'మీ కుటుంబాన్ని వివరించండి — ఎంత మంది వ్యక్తులు, బిల్లులు సాధారణంగా ఎలా విభజించబడతాయి — మరియు WyberAi దాని చుట్టూ లెడ్జర్‌ను నిర్మిస్తుంది: ఎవరైనా ఒక ఛార్జ్ మరియు అది ఎలా విభజించబడుతుందో జోడించగల భాగస్వామ్య ఖర్చు లాగ్, "ఎవరు ఎవరికి బాకీ" అనేది లెక్కింపు కాకుండా ఒక చూపు అయ్యేలా ప్రతి-రూమ్మేట్‌కు నడుస్తున్న బ్యాలెన్స్, మరియు ఎవరైనా చివరకు తమ వాటాను తిరిగి చెల్లించినప్పుడు సెటిల్-అప్ ఫ్లో.',
      ],
      features: [
        { title: 'భాగస్వామ్య ఖర్చు లాగ్', desc: 'కుటుంబంలో ఎవరైనా ఒక ఛార్జ్‌ను లాగ్ చేస్తారు — కిరాణా, యుటిలిటీలు, అద్దె — ఎవరు చెల్లించారు మరియు అది ఎలా విభజించబడుతుంది అనే దానితో.' },
        { title: 'అనువైన విభజన నియమాలు', desc: 'సమాన విభజన, కస్టమ్ శాతాలు, లేదా "కేవలం ఈ ఇద్దరు వ్యక్తులు" — విభజన ప్రతి-ఖర్చుకు సెట్ చేయబడుతుంది, ఒక నియమానికి బలవంతం కాదు.' },
        { title: 'ప్రతి-వ్యక్తికి నడుస్తున్న బ్యాలెన్స్', desc: 'ఎవరు ఎవరికి ఎంత బాకీ ఉన్నారు అనే దాని లైవ్ వ్యూ, కొత్త ఖర్చు వచ్చిన వెంటనే అప్‌డేట్ అవుతుంది.' },
        { title: 'సెటిల్-అప్ ట్రాకింగ్', desc: 'నగదు లేదా బదిలీలో తిరిగి చెల్లించినప్పుడు అప్పును సెటిల్డ్‌గా గుర్తించండి, చరిత్రను తొలగించకుండా బ్యాలెన్స్‌ను క్లియర్ చేస్తుంది.' },
      ],
      promptExample: '3-వ్యక్తుల కుటుంబం కోసం రూమ్మేట్ ఖర్చు విభజన మొబైల్ యాప్‌ను నిర్మించండి: ఎవరైనా మొత్తం, వివరణ, ఎవరు చెల్లించారు, మరియు అది ఎలా విభజించబడుతుంది (సమానంగా, కస్టమ్ శాతాలు, లేదా నిర్దిష్ట వ్యక్తులు) అనే దానితో ఛార్జ్‌ను లాగ్ చేసే Add Expense స్క్రీన్; కుటుంబం అంతటా ఎవరు ఎవరికి బాకీ ఉన్నారో నడుస్తున్న మొత్తాన్ని చూపే Balances స్క్రీన్; మరియు అప్పును చెల్లించినట్లు గుర్తించడానికి, ఖర్చు చరిత్రను ఉంచుతూ బ్యాలెన్స్‌ను క్లియర్ చేసే Settle Up స్క్రీన్.',
      faqs: [
        { q: 'ఇది ఒక వ్యక్తి అతిథి వంటి అసమాన విభజనలను నిర్వహించగలదా?', a: 'అవును — ప్రతి-ఖర్చుకు కస్టమ్ విభజనను సెట్ చేయండి, కాబట్టి ముగ్గురిలో ఇద్దరు రూమ్మేట్‌లు మాత్రమే తిన్న డిన్నర్ ఆ ఇద్దరి మధ్యే విభజించబడుతుంది.' },
        { q: 'ఇది రూమ్మేట్‌ల కంటే ఎక్కువగా పని చేస్తుందా — ట్రిప్‌లకు కూడా?', a: 'అదే నిర్మాణం ఏదైనా భాగస్వామ్య-ఖర్చు గుంపుకు సరిపోతుంది; మీ వినియోగ కేసును వివరించండి (ఒక ట్రిప్, భాగస్వామ్య సబ్‌స్క్రిప్షన్) మరియు విభజన లాజిక్ దానిని అనుసరిస్తుంది.' },
        { q: 'ఎవరైనా కుటుంబాన్ని విడిచిపెట్టి వారి చివరి బ్యాలెన్స్‌ను సెటిల్ చేయవచ్చా?', a: 'అవును — చివరి సెటిల్-అప్ వారి బ్యాలెన్స్‌ను సున్నాకి క్లియర్ చేస్తుంది, మరియు వారి చారిత్రక ఖర్చులు సూచన కోసం లాగ్‌లో ఉంటాయి.' },
        { q: 'నా రూమ్మేట్‌లతో ఉపయోగించడం ఉచితమా?', a: 'అవును — ప్రకటనలు లేవు, ప్రతి-లావాదేవీ రుసుము లేదు. నిర్మించడానికి ఉచిత నెలవారీ క్రెడిట్‌లు ఉపయోగించబడతాయి, మరియు అప్పటి నుండి యాప్ మీదిగా నడుస్తుంది.' },
      ],
    },
  },
  ta: {
    'expense-tracker-app': {
      h1: 'AI மூலம் செலவு டிராக்கர் ஆப்-ஐ உருவாக்குங்கள்',
      metaTitle: 'AI மூலம் செலவு டிராக்கர் ஆப்-ஐ உருவாக்குங்கள் — கோட் இல்லாமல்',
      metaDesc: 'வகை வாரியாக செலவைக் கண்காணிக்கவும், வணிகத்தை தனிப்பட்டதிலிருந்து பிரிக்கவும், மாதம் எங்கு சென்றது என்று பாருங்கள் — சாதாரண ஆங்கில விவரிப்பிலிருந்து உருவாக்கப்பட்ட செலவு டிராக்கர்.',
      tagline: 'உங்கள் வகைகள், உங்கள் நாணயங்கள், உங்கள் வரி பருவம் — உங்கள் பணம் உண்மையில் எப்படி நகர்கிறதோ அதற்குப் பொருந்தும் செலவு டிராக்கர்.',
      body: [
        'செலவு ஆப்கள் இரண்டு வகைகளில் வருகின்றன, இரண்டும் தவறவிடுகின்றன: வங்கி-இணைக்கப்பட்ட ஆப்கள் "Amazon" ஐ மர்மத்திற்குள் தானாக வகைப்படுத்துகின்றன, மற்றும் மினிமலிஸ்ட் டிராக்கர்கள் ஏப்ரலில் முக்கியமான ஒரே கேள்விக்கு பதிலளிக்க முடியாது — இவற்றில் எது வணிக செலவுகள், ரசீதுகள் எங்கே உள்ளன?',
        'நீங்கள் உண்மையில் பணத்தை எப்படி கண்காணிக்கிறீர்கள் என்பதை விவரியுங்கள் — நீங்கள் நினைக்கும் வகைகள், ஃப்ரீலான்ஸ் செலவுகளை பிரிக்க வேண்டுமா, உங்கள் கணக்காளர் என்ன அறிக்கை கேட்கிறார் — WyberAi அந்த டிராக்கரை உருவாக்குகிறது: உங்கள் வகைகளுடன் விரைவான உள்ளீடு, உங்கள் செலவின் வடிவத்தைக் காட்டும் மாதாந்திர டாஷ்போர்டு, மற்றும் வரி நேரத்திற்காக கட்டமைக்கப்பட்ட ஏற்றுமதி காட்சி. மீண்டும் மீண்டும் வரும் பில்கள், பயணத்திற்கு பல நாணயங்கள், ரசீது புகைப்பட புலம் — சொல்லுங்கள், ஸ்கீமாவில் அது இருக்கும்.',
      ],
      features: [
        { title: 'வேகமான உள்ளீடு, உங்கள் வகைகள்', desc: 'தொகை, வகை, குறிப்பு, முடிந்தது — வங்கியின் யூகம் அல்ல, நீங்கள் வரையறுத்த வகை பட்டியலுடன்.' },
        { title: 'வணிகம் / தனிப்பட்ட பிரிவு', desc: 'எந்த செலவையும் வணிகமாகக் குறியிடுங்கள்; வரி-பருவ அறிக்கைகள் உங்கள் கணக்காளருக்கு தேவையானதற்கு மட்டுமே வடிகட்டுகின்றன.' },
        { title: 'மாதாந்திர டாஷ்போர்டு', desc: 'எந்த மாதத்திற்கும் வகை வாரியாக செலவு, எந்த வகை அதிகரிக்கிறது என்பதைக் காட்டும் ட்ரெண்ட் கோடுகளுடன்.' },
        { title: 'மீண்டும் மீண்டும் வரும் செலவுகள்', desc: 'வாடகை, சந்தாக்கள், காப்பீடு — ஒவ்வொரு சுழற்சியிலும் தானாகவே பதிவு செய்யப்படுகிறது, படம் முழுமையாக இருக்கும்.' },
      ],
      promptExample: 'செலவு டிராக்கர் வெப் ஆப்பை உருவாக்குங்கள்: தொகை, வகை (எனது கஸ்டம் பட்டியல்), தேதி, விருப்ப குறிப்பு, வணிகம்/தனிப்பட்ட டாகுள், மற்றும் விருப்ப ரசீது புகைப்படத்துடன் Add Expense படிவம்; இந்த மாத மொத்தத்தையும் கடந்த மாதத்துடன் ஒப்பிடும் வகை பிரிவு விளக்கப்படத்தையும் காட்டும் Dashboard; மற்றும் CSV ஏற்றுமதியுடன் தேதி வரம்பின் மூலம் வணிக செலவுகளை வடிகட்டும் Reports பக்கம்.',
      faqs: [
        { q: 'இது ஒன்றுக்கு மேற்பட்ட நாணயத்தை கையாள முடியுமா?', a: 'ஆம் — உங்கள் ப்ராம்ப்ட்டில் ஒவ்வொரு-செலவுக்கும் நாணயத்தைச் சேர்க்கவும், ஒரு முகப்பு நாணயத்தை அமைக்கவும், மொத்தங்கள் நீங்கள் கட்டுப்படுத்தும் விகிதங்களில் மாற்றப்படும்.' },
        { q: 'நான் ரசீதுகளை இணைக்கலாமா?', a: 'செலவுகளுக்கு ஒரு புகைப்பட புலத்தைச் சேர்க்கவும், ஒவ்வொரு உள்ளீடும் அதன் ரசீது படத்தை சேமிக்கிறது — வரி-பருவத்தில் நீங்கள் இன்றைய உங்களுக்கு நன்றி சொல்வீர்கள்.' },
        { q: 'இது எனது வங்கியுடன் இணைக்கிறதா?', a: 'உருவாக்கப்பட்ட ஆப்கள் ஆரம்பத்தில் வங்கி ஃபீட்களுடன் இணைக்கப்படுவதில்லை — இது ஒரு வேண்டுமென்றே-உள்ளீடு டிராக்கர், அதனால்தான் அதன் வகைகள் எப்போதும் சரியாக இருக்கும்.' },
        { q: 'இதை உருவாக்க என்ன செலவாகும்?', a: '50 இலவச மாதாந்திர கிரெடிட்கள் உங்கள் முதல் பில்டை உள்ளடக்கியது (30 கிரெடிட்கள்); அதன் பிறகு, மாற்றங்கள் 2-கிரெடிட் எடிட்கள். தொடங்க கார்டு தேவையில்லை.' },
      ],
    },
    'budget-planner-app': {
      h1: 'AI மூலம் பட்ஜெட் திட்டமிடுபவர் ஆப்-ஐ உருவாக்குங்கள்',
      metaTitle: 'AI மூலம் பட்ஜெட் திட்டமிடல் ஆப்-ஐ உருவாக்குங்கள் — கோட் இல்லாமல்',
      metaDesc: 'உறை பட்ஜெட்டுகள், சேமிப்பு இலக்குகள், மற்றும் "நம்மால் இதை வாங்க முடியுமா?" என்பதற்கு உண்மையான பதில் — நிமிடங்களில் உங்கள் விவரிப்பிலிருந்து உருவாக்கப்பட்ட குடும்ப பட்ஜெட் ஆப்.',
      tagline: 'மாத தொடக்கத்தில் ஒவ்வொரு ரூபாய் அல்லது டாலருக்கும் ஒரு வேலையைக் கொடுங்கள், மாத நடுவில் ஒவ்வொரு உறையிலும் என்ன மிச்சம் உள்ளது என்று சரியாக அறியுங்கள்.',
      body: [
        'பட்ஜெட் முறைகள் வேலை செய்கின்றன; பட்ஜெட் கருவிகளில்தான் குடும்பங்கள் தோற்கின்றன. ஸ்ப்ரெட்ஷீட்டுக்கு ஒரு பராமரிப்பாளர் தேவை, பிரபலமான ஆப்கள் வேறொருவரின் முறையை அமல்படுத்த மாதாந்திரம் கட்டணம் வசூலிக்கின்றன, ஜோடிகளுக்கு பழமையான ஒத்திசைவு பிரச்சனை மிச்சமிருக்கிறது — இரண்டு பேர், ஒரு பண குளம், பகிரப்பட்ட படம் இல்லை.',
        'நீங்கள் உறைகளை நடத்தினாலும், 50/30/20, அல்லது எளிய "பில்கள், வேடிக்கை, சேமிப்பு" பிரிவை நடத்தினாலும், WyberAi உங்கள் முறையைச் சுற்றி திட்டமிடுபவரை உருவாக்குகிறது: மாதாந்திர வகை பட்ஜெட்டுகள், அவற்றுக்கு எதிராக பதிவு செய்யப்பட்ட செலவு, இருவரும் புதுப்பிக்கக்கூடிய பகிரப்பட்ட காட்சி. மாத நடுவின் பார்வை — மூன்று பச்சை உறைகள், ஒன்று அம்பர், ஒன்று சிவப்பு — ஸ்ப்ரெட்ஷீட் மற்றும் வாதம் இரண்டையும் மாற்றுகிறது.',
      ],
      features: [
        { title: 'உறை-பாணி பட்ஜெட்டுகள்', desc: 'ஒவ்வொரு மாதமும் ஒவ்வொரு-வகைக்கும் ஒரு தொகையை அமைக்கவும்; ஒவ்வொரு செலவும் தெரியும் மீதமுள்ள இருப்புடன் அதன் உறையிலிருந்து குறைகிறது.' },
        { title: 'பகிரப்பட்ட குடும்ப காட்சி', desc: 'இரண்டு லாகின்கள், ஒரு பட்ஜெட் — இருவரும் செலவைப் பதிவு செய்து அதே நிகழ்நேர படத்தைப் பார்க்கிறார்கள்.' },
        { title: 'சேமிப்பு இலக்குகள்', desc: 'அவசர நிதி, விடுமுறை, புதிய லேப்டாப் — இலக்குகளும் ஒரு தேதி வரை கண்காணிக்கப்பட்ட மாதாந்திர பங்களிப்புகளும்.' },
        { title: 'மாத உருட்டல்', desc: 'மாதத்தை மூடுங்கள், விதியின்படி செலவிடாத இருப்புகளை முன்னெடுத்துச் செல்லுங்கள் (அல்லது மீட்டமைக்கவும்), ஒரே கிளிக்கில் அடுத்ததைத் தொடங்குங்கள்.' },
      ],
      promptExample: 'குடும்ப பட்ஜெட் திட்டமிடுபவர் வெப் ஆப்பை உருவாக்குங்கள்: செலவிட்டதையும் மீதமுள்ளதையும் காட்டும் உறைகளாக ஒவ்வொரு-வகைக்கும் (வாடகை, மளிகை, போக்குவரத்து, வேடிக்கை, சேமிப்பு) மாதாந்திர தொகைகளை நாங்கள் அமைக்கும் Budget பக்கம்; ஒரு உறையிலிருந்து எடுக்கும் விரைவான Add Expense படிவம்; சேமிப்பு இலக்குகள், மாதாந்திர பங்களிப்புகள், மற்றும் கணிக்கப்பட்ட நிறைவு தேதிகளுடன் Goals பக்கம்; மற்றும் ஒரு பட்ஜெட்டைப் பகிரும் இரண்டு பயனர் கணக்குகளுக்கான ஆதரவு.',
      faqs: [
        { q: 'எனது துணையும் நானும் இருவரும் இதைப் பயன்படுத்தலாமா?', a: 'ஆம் — இது அங்கீகாரத்துடன் உருவாக்கப்படுகிறது, பகிரப்பட்ட-குடும்ப அமைப்பு என்பது நீங்கள் இருவரும் அதே பட்ஜெட்டை நேரலையில் பார்த்து புதுப்பிக்கிறீர்கள் என்பதாகும்.' },
        { q: 'மாத இறுதியில் மீதமுள்ள பணத்திற்கு என்ன ஆகும்?', a: 'உங்கள் விதி தேர்வு: செலவிடாத இருப்புகளை அடுத்த மாத உறைக்கு உருட்டவும், அவற்றை சேமிப்பு இலக்குக்கு அனுப்பவும், அல்லது மீட்டமைக்கவும் — இதை ப்ராம்ப்ட்டில் அமைக்கவும் அல்லது சாட்டில் மாற்றவும்.' },
        { q: 'இது உறைகளுக்குப் பதிலாக 50/30/20 முறையை செய்யுமா?', a: 'ஆம் — நீங்கள் பின்பற்றும் முறையை விவரியுங்கள், பட்ஜெட் அமைப்பு, கணிதம், மற்றும் டாஷ்போர்டு அதற்கு பொருந்துமாறு உருவாக்கப்படுகின்றன.' },
        { q: 'எங்கள் நிதி தரவு தனிப்பட்டதா?', a: 'ஆப் row-level செக்யூரிட்டியுடன் அதன் சொந்த Postgres டேட்டாபேஸில் இயங்குகிறது, வெளியிடுவதற்கு முன் WyberAi இன் நேரலை ஸ்கேன் இதை ஒரு தாக்குபவரைப் போல ஆராய்கிறது.' },
      ],
    },
    'subscription-tracker': {
      h1: 'AI மூலம் சந்தா டிராக்கர் ஆப்-ஐ உருவாக்குங்கள்',
      metaTitle: 'AI மூலம் சந்தா டிராக்கர் ஆப்-ஐ உருவாக்குங்கள் — கோட் இல்லாமல்',
      metaDesc: 'ஒவ்வொரு மீண்டும் வரும் கட்டணமும் ஒரே இடத்தில்: புதுப்பிப்பு நாட்காட்டி, மாதாந்திர மொத்தம், மற்றும் ரத்து-செய்ய-வேண்டிய தேதிகள். சாதாரண ஆங்கில ப்ராம்ப்ட்டிலிருந்து கட்டமைக்கப்பட்டது — தொடங்குவது இலவசம்.',
      tagline: '"காத்திருங்கள், நாம் அதற்கும் பணம் கொடுக்கிறோமா?" என்று பதிலளிக்கும் ஆப் — ஒவ்வொரு மீண்டும் வரும் கட்டணம், அதன் புதுப்பிப்பு தேதி, மற்றும் மாதாந்திர சேதம் ஒரே காட்சியில்.',
      body: [
        'சந்தாக்களில் மாதத்திற்கு முந்நூறு செலவழிக்க யாரும் முடிவு செய்வதில்லை; இது ஒரு நேரத்தில் ஒரு இலவச டிரையலிலிருந்து, இரண்டு ஆப் ஸ்டோர்களில், சில வலைத்தளங்களில், மற்றும் இன்னொருவரின் Netflix கடவுச்சொல் உங்கள் Netflix பில்லாக மாறுவதன் மூலம் குவிகிறது. மறதியே வணிக மாதிரி — வருடாந்திர புதுப்பிப்புகள் நீங்கள் தேதியை நினைவில் வைக்க மாட்டீர்கள் என்ற பந்தயத்தில் விலை நிர்ணயிக்கப்படுகின்றன.',
        'சந்தா டிராக்கர் ஒரு சிறிய, கூர்மையான கருவி: ஒவ்வொரு மீண்டும் வரும் கட்டணமும் அதன் தொகை, சுழற்சி, மற்றும் புதுப்பிப்பு தேதியுடன்; என்ன வரப்போகிறது என்பதன் நாட்காட்டி; மற்றும் குவிப்பைப் புலப்படும்படி செய்யும் ஓடும் மாதாந்திர மொத்தம். WyberAi இதை ஒரு-பத்தி விவரிப்பிலிருந்து உருவாக்குகிறது — புதுப்பிப்பு தேதிகள் உங்கள் சொந்த டேட்டாபேஸில் வாழ்வதால், ஒரு "இந்த தேதிக்குள் ரத்து செய்" எச்சரிக்கை சாளரத்தை அல்லது விலை-உயர்வு வரலாற்றைச் சேர்ப்பது சாட்டில் ஒரு எடிட், உங்கள் மறதியை பணமாக்கும் நிறுவனத்திற்கு ஃபீச்சர் கோரிக்கை அல்ல.',
      ],
      features: [
        { title: 'அனைத்து கட்டணங்களும், ஒரு லெட்ஜர்', desc: 'ஸ்ட்ரீமிங், SaaS, ஜிம், டொமைன்கள், காப்பீடு — ஒவ்வொன்றும் தொகை, பில்லிங் சுழற்சி, கட்டண முறை, மற்றும் வகையுடன்.' },
        { title: 'புதுப்பிப்பு நாட்காட்டி', desc: 'எப்போது என்ன கட்டணமாகும், இந்த மாதம் மற்றும் அடுத்தது — வருடாந்திர புதுப்பிப்புகள் இனி பதுங்குதாக்குதல்களாக இருக்காது.' },
        { title: 'உண்மையான மாதாந்திர மொத்தம்', desc: 'வருடாந்திர மற்றும் காலாண்டு திட்டங்கள் ஒரு மாதாந்திர எண்ணுக்கு இயல்பாக்கப்பட்டுள்ளன, எனவே உண்மையான ரன்-ரேட் ஒரு எண்.' },
        { title: 'ரத்து-செய்-எச்சரிக்கைகள்', desc: 'ஒவ்வொரு புதுப்பிப்பிற்கும் முன் கொடியிடப்பட்ட சாளரம் — ரத்து செய்வது உண்மையில் கட்டணத்தை மிச்சப்படுத்தும் நாட்கள்.' },
      ],
      promptExample: 'சந்தா டிராக்கர் வெப் ஆப்பை உருவாக்குங்கள்: பெயர், விலை, பில்லிங் சுழற்சி (மாதாந்திர/காலாண்டு/வருடாந்திர), அடுத்த புதுப்பிப்பு தேதி, கட்டண முறை, மற்றும் வகையுடன் ஒவ்வொரு சேவையையும் பட்டியலிடும் Subscriptions பக்கம்; இயல்பாக்கப்பட்ட மாதாந்திர மொத்தம், வகை பிரிவு, மற்றும் அடுத்த 30 நாட்களின் வரவிருக்கும் புதுப்பிப்புகளைக் காட்டும் Dashboard; மற்றும் நான் கைமுறையாக புதுப்பிக்கும் "கடைசியாக பயன்படுத்தியது" புலத்துடன் வருடாந்திர செலவின் அடிப்படையில் சந்தாக்களை தரவரிசைப்படுத்தும் Insights பக்கம்.',
      faqs: [
        { q: 'இது புதுப்பிப்பதற்கு முன் எனக்கு நினைவூட்ட முடியுமா?', a: 'வரவிருக்கும்-புதுப்பிப்புகள் காட்சி உங்கள் எச்சரிக்கை சாளரத்திற்குள் உள்ள எதையும் சிறப்பிக்கிறது; உங்களுக்கு புஷ் தேவைப்பட்டால் வெளியிடும்போது மின்னஞ்சல் நினைவூட்டல்களைச் சேர்க்க சாட்டிடம் கேளுங்கள்.' },
        { q: 'இது எனது வங்கி கணக்கிலிருந்து சந்தாக்களைக் கண்டறியுமா?', a: 'இல்லை — உள்ளீடுகள் வேண்டுமென்றே செய்யப்படுகின்றன, இதை அமைக்க பத்து நிமிடங்கள் ஆகும், ஆப் ஸ்டோர்களில் மறைந்திருப்பவை உட்பட பட்டியல் முழுமையானது மற்றும் சரியானது என்பதாகும்.' },
        { q: 'இது பகிரப்பட்ட குடும்ப சந்தாக்களைக் கண்காணிக்குமா?', a: 'ஆம் — உங்கள் ப்ராம்ப்ட்டில் "யாருடன் பகிரப்பட்டது" அல்லது ஒவ்வொரு-நபர் பிரிவு புலத்தைச் சேர்க்கவும், மாதாந்திர மொத்தம் உங்கள் பங்கை குடும்பத்திற்கு எதிராகக் காட்டலாம்.' },
        { q: 'ஸ்ப்ரெட்ஷீட்டை ஏன் பயன்படுத்தக்கூடாது?', a: 'டிராக்கர் என்பது ஸ்ப்ரெட்ஷீட் தனது சொந்த புதுப்பிப்பு நாட்காட்டியை பராமரிக்கும்போது, சுழற்சிகளை ஒரு மொத்தமாக இயல்பாக்கும்போது, உங்கள் ஃபோனில் நேர்த்தியாகத் தெரியும்போது ஆகும்.' },
      ],
    },
    'debt-payoff-tracker': {
      h1: 'AI மூலம் கடன் தீர்ப்பு டிராக்கரை உருவாக்குங்கள்',
      metaTitle: 'AI மூலம் கடன் தீர்ப்பு டிராக்கர் ஆப்-ஐ உருவாக்குங்கள்',
      metaDesc: 'ஸ்னோபால் அல்லது அவலான்ச் முறை, ஒவ்வொரு-கடனுக்கும் முன்னேற்ற பட்டி, மற்றும் உண்மையான தீர்ப்பு தேதி — சாதாரண ஆங்கிலத்திலிருந்து உருவாக்கப்பட்ட கடன் டிராக்கர், பொதுவான கால்குலேட்டர் அல்ல.',
      tagline: 'ஒவ்வொரு கடன், அதன் இருப்பு, மற்றும் உண்மையான கணிக்கப்பட்ட தீர்ப்பு தேதி — மென்பொருளாக ஸ்னோபால் அல்லது அவலான்ச் முறை, நீங்கள் கையால் மீண்டும் இயக்கும் நிலையான கால்குலேட்டர் அல்ல.',
      body: [
        'பல கடன்களை தீர்ப்பது ஒரு உளவியல் பிரச்சனையை மேலே சுமந்து செல்லும் கணித பிரச்சனை: அவலான்ச் முறை அதிக வட்டியை மிச்சப்படுத்துகிறது, ஸ்னோபால் முறை சிறிய இருப்புகளை முதலில் அழிப்பதன் மூலம் ஊக்கத்தை தக்க வைக்கிறது, பெரும்பாலான மக்கள் தோற்கிறார்கள் ஏனெனில் ஒரு ஸ்ப்ரெட்ஷீட் தானாக புதுப்பிக்கப்படாது அல்லது முன்னேற்றத்தை உண்மையாக உணரவைக்காது. ஒரு-முறை ஆன்லைன் கால்குலேட்டர்கள் கேள்விக்கு ஒருமுறை பதிலளித்துவிட்டு பின்னர் உங்களை மறந்துவிடுகின்றன.',
        'உங்கள் கடன்களையும் நீங்கள் பின்பற்ற விரும்பும் முறையையும் விவரியுங்கள், WyberAi ஒரு நேரலை டிராக்கரை உருவாக்குகிறது: ஒவ்வொரு கடனும் அதன் இருப்பு, விகிதம், மற்றும் குறைந்தபட்ச கட்டணத்துடன், நீங்கள் அதிகமாக போடும்போது தீர்ப்பு தேதி எப்படி நகர்கிறது என்பதைப் பார்க்க அனுமதிக்கும் கூடுதல்-கட்டண புலம், மற்றும் இருப்பு குறையும்போது நிரம்பும் ஒவ்வொரு-கடனுக்கும் முன்னேற்ற பட்டி. நீங்கள் ஒரு கட்டணத்தைப் பதிவு செய்யும் ஒவ்வொரு முறையும் இது மீண்டும் கணக்கிடுகிறது — பதிவிறக்கம் செய்யப்பட்ட ஸ்ப்ரெட்ஷீட்டில் காலாவதியாவதற்குப் பதிலாக திட்டம் நேர்மையாக இருக்கும்.',
      ],
      features: [
        { title: 'அனைத்து கடன்களும் ஒரே இடத்தில்', desc: 'கிரெடிட் கார்டுகள், கடன்கள், மற்றும் அவற்றின் வட்டி விகிதம் மற்றும் குறைந்தபட்ச கட்டணத்துடன் இருப்புகள் — ஒரே பட்டியலில் முழு படம்.' },
        { title: 'ஸ்னோபால் அல்லது அவலான்ச்', desc: 'சிறிய-இருப்பு-முதலில் அல்லது அதிக-வட்டி-முதலில் தேர்வு செய்யவும், ஆப் அதற்கேற்ப உங்கள் தீர்ப்பு முன்னுரிமையை வரிசைப்படுத்துகிறது.' },
        { title: 'கூடுதல்-கட்டண கணிப்புகள்', desc: 'எந்த மாதத்திற்கும் கூடுதலாகச் சேர்த்து தீர்ப்பு தேதியும் மொத்த வட்டியும் உடனடியாக மீண்டும் கணக்கிடப்படுவதைப் பாருங்கள்.' },
        { title: 'ஒவ்வொரு-கடனுக்கும் முன்னேற்ற பட்டி', desc: 'ஒவ்வொரு கடனும் அசல் இருப்பு வெர்சஸ் மீதமுள்ளதைக் காட்டுகிறது — நீண்ட தீர்ப்பு முழுவதும் வேகத்தைத் தக்க வைக்கும் காட்சி.' },
      ],
      promptExample: 'கடன் தீர்ப்பு டிராக்கர் வெப் ஆப்பை உருவாக்குங்கள்: ஒவ்வொரு கடனையும் இருப்பு, வட்டி விகிதம், மற்றும் குறைந்தபட்ச கட்டணத்துடன் பட்டியலிடும், ஸ்னோபால் (சிறிய இருப்பு முதலில்) அல்லது அவலான்ச் (அதிக விகிதம் முதலில்) மூலம் வரிசைப்படுத்தக்கூடிய Debts பக்கம்; நான் கூடுதல் மாதாந்திர கட்டணத் தொகையை உள்ளிட்டு கணிக்கப்பட்ட மொத்த தீர்ப்பு தேதியையும் செலுத்திய வட்டியையும் பார்க்கும் Plan பக்கம்; மற்றும் ஒவ்வொரு-கடனுக்கும் அசல் இருப்பு வெர்சஸ் தற்போதைய இருப்பைக் காட்டும் பட்டியுடன் Progress பக்கம்.',
      faqs: [
        { q: 'நான் எந்த முறையைப் பயன்படுத்த வேண்டும், ஸ்னோபால் அல்லது அவலான்ச்?', a: 'அவலான்ச் கணிதவியல் ரீதியாக அதிக வட்டியை மிச்சப்படுத்துகிறது; ஸ்னோபால் ஆரம்ப வெற்றிகளுடன் மக்களை ஊக்கமாக வைத்திருக்கும். டிராக்கர் இரண்டையும் ஆதரிக்கிறது — எப்போது வேண்டுமானாலும் மாறவும் தீர்ப்பு வரிசை புதுப்பிக்கப்படும்.' },
        { q: 'நான் கட்டணம் செலுத்தும்போது இது மீண்டும் கணக்கிடுமா?', a: 'ஆம் — எந்த கடனுக்கும் எதிராக ஒரு கட்டணத்தைப் பதிவு செய்யுங்கள், மீதமுள்ள இருப்பு, முன்னேற்ற பட்டி, மற்றும் கணிக்கப்பட்ட தீர்ப்பு தேதி உடனடியாக புதுப்பிக்கப்படும்.' },
        { q: 'இது காலப்போக்கில் மாறும் வெவ்வேறு வட்டி விகிதங்களைக் கணக்கில் எடுத்துக்கொள்ள முடியுமா?', a: 'உங்கள் விளம்பர விகிதம் முடிவடைந்தால் ஒரு விகிதம்-மாற்ற புலத்தைச் சேர்க்கவும், உங்கள் ப்ராம்ப்ட்டில் அட்டவணையை விவரியுங்கள் — கணிப்பு அதைப் பின்பற்றும்.' },
        { q: 'இது ஒரு-முறை தீர்ப்பு கால்குலேட்டரிலிருந்து வேறுபட்டதா?', a: 'ஆம் — இது உங்கள் உண்மையான இருப்புகள் மற்றும் கட்டணங்களுடன் இணைக்கப்பட்ட வாழும் டிராக்கர், நீங்கள் ஒவ்வொரு மாதமும் கைமுறையாக மீண்டும் கணக்கிட வேண்டிய நிலையான முடிவு அல்ல.' },
      ],
    },
    'roommate-expense-splitter': {
      h1: 'AI மூலம் ரூம்மேட் செலவு பிரிப்பானை உருவாக்குங்கள்',
      metaTitle: 'AI மூலம் ரூம்மேட் பில் பிரிப்பான் ஆப்-ஐ உருவாக்குங்கள்',
      metaDesc: 'பகிரப்பட்ட பில்கள், ஆட்டோ-ஸ்ப்லிட் கணக்கீடுகள், மற்றும் ஓடும் யார்-யாருக்கு-கடன் இருப்பு — சாதாரண ஆங்கிலத்திலிருந்து உருவாக்கப்பட்ட ரூம்மேட் செலவு ஆப், விளம்பரங்கள் இல்லை, கட்டணங்கள் இல்லை.',
      tagline: 'பகிரப்பட்ட மளிகை ஓட்டத்தை ஒருமுறை பதிவு செய்யுங்கள், ஆப் யார் என்ன கடன் என்று நினைவில் வைக்கிறது — நள்ளிரவில் நீண்ட வகுத்தல் செய்யும் குழு அரட்டைக்குப் பதிலாக.',
      body: [
        'ஒவ்வொரு பகிரப்பட்ட குடும்பமும் அதே உடைந்த அமைப்பை மீண்டும் கண்டுபிடிக்கிறது: யாரோ மளிகைக்கு பணம் கொடுக்கிறார்கள், இன்னொருவர் மின்சார பில்லை கவர் செய்கிறார், உண்மையில் யார் யாருக்கு கடன் என்பதை சரிசெய்வது யாரும் ரசிக்காத குழு-அரட்டை வாதமாக மாறுகிறது. பிரபலமான பிரிப்பு ஆப்கள் வேலை செய்கின்றன, ஆனால் அவை ஒரு-முறை பயண செலவுகளுக்காக கட்டமைக்கப்பட்டவை, மீண்டும் மீண்டும் வரும்-குடும்ப பயன்பாட்டு வழக்கை விளம்பரங்கள் மற்றும் பிரீமியம் அடுக்குகளுக்குப் பின்னால் புதைத்துவிடுகின்றன.',
        'உங்கள் குடும்பத்தை விவரியுங்கள் — எத்தனை பேர், பில்கள் பொதுவாக எப்படி பிரிக்கப்படுகின்றன — WyberAi அதைச் சுற்றி லெட்ஜரை உருவாக்குகிறது: யாரும் ஒரு கட்டணத்தையும் அது எப்படி பிரிக்கப்படுகிறது என்பதையும் சேர்க்கக்கூடிய பகிரப்பட்ட செலவு பதிவு, "யார் யாருக்கு கடன்" என்பது ஒரு கணக்கீடு அல்ல ஒரு பார்வையாக இருக்க ஒவ்வொரு-ரூம்மேட்டுக்கும் ஓடும் இருப்பு, மற்றும் யாராவது இறுதியாக தங்கள் பங்கை திரும்ப செலுத்தும்போது ஒரு தீர்வு ஓட்டம்.',
      ],
      features: [
        { title: 'பகிரப்பட்ட செலவு பதிவு', desc: 'குடும்பத்தில் யாரும் ஒரு கட்டணத்தைப் பதிவு செய்கிறார்கள் — மளிகை, பயன்பாடுகள், வாடகை — யார் செலுத்தினார்கள் மற்றும் அது எப்படி பிரிக்கப்படுகிறது என்பதுடன்.' },
        { title: 'நெகிழ்வான பிரிவு விதிகள்', desc: 'சம பிரிவு, கஸ்டம் சதவீதங்கள், அல்லது "இந்த இரண்டு பேர் மட்டும்" — பிரிவு ஒவ்வொரு-செலவுக்கும் அமைக்கப்படுகிறது, ஒரு விதிக்கு கட்டாயப்படுத்தப்படவில்லை.' },
        { title: 'ஒவ்வொரு-நபருக்கும் ஓடும் இருப்பு', desc: 'யார் யாருக்கு எவ்வளவு கடன் என்பதன் நேரலை காட்சி, புதிய செலவு வந்தவுடன் புதுப்பிக்கப்படுகிறது.' },
        { title: 'தீர்வு கண்காணிப்பு', desc: 'பணமாகவோ பரிமாற்றத்திலோ திரும்ப செலுத்தப்படும்போது ஒரு கடனை தீர்க்கப்பட்டதாகக் குறியிடுங்கள், வரலாற்றை நீக்காமல் இருப்பை அழிக்கிறது.' },
      ],
      promptExample: '3-நபர் குடும்பத்திற்கான ரூம்மேட் செலவு பிரிப்பான் மொபைல் ஆப்பை உருவாக்குங்கள்: யாரும் தொகை, விளக்கம், யார் செலுத்தினார்கள், மற்றும் அது எப்படி பிரிக்கப்படுகிறது (சமமாக, கஸ்டம் சதவீதங்கள், அல்லது குறிப்பிட்ட நபர்கள்) என்பதுடன் ஒரு கட்டணத்தைப் பதிவு செய்யும் Add Expense திரை; குடும்பம் முழுவதும் யார் யாருக்கு கடன் என்பதன் ஓடும் மொத்தத்தைக் காட்டும் Balances திரை; மற்றும் ஒரு கடனை செலுத்தப்பட்டதாகக் குறிக்க, செலவு வரலாற்றை வைத்திருந்தபடி இருப்பை அழிக்கும் Settle Up திரை.',
      faqs: [
        { q: 'ஒரு நபரின் விருந்தினர் போன்ற சமமற்ற பிரிவுகளை இது கையாள முடியுமா?', a: 'ஆம் — ஒவ்வொரு-செலவுக்கும் ஒரு கஸ்டம் பிரிவை அமைக்கவும், எனவே மூவரில் இருவர் ரூம்மேட்கள் மட்டுமே சாப்பிட்ட இரவு உணவு அந்த இருவருக்கு மட்டும் பிரிக்கப்படும்.' },
        { q: 'இது ரூம்மேட்களை விட அதிகமாக வேலை செய்யுமா — பயணங்களுக்கும்?', a: 'அதே அமைப்பு எந்த பகிரப்பட்ட-செலவு குழுவிற்கும் பொருந்தும்; உங்கள் பயன்பாட்டு வழக்கை விவரியுங்கள் (ஒரு பயணம், பகிரப்பட்ட சந்தா) பிரிவு தர்க்கம் அதைப் பின்பற்றும்.' },
        { q: 'யாராவது குடும்பத்தை விட்டு வெளியேறி தங்கள் இறுதி இருப்பை தீர்க்கலாமா?', a: 'ஆம் — இறுதி தீர்வு அவர்களின் இருப்பை பூஜ்ஜியமாக அழிக்கிறது, அவர்களின் வரலாற்று செலவுகள் குறிப்புக்காக பதிவில் இருக்கும்.' },
        { q: 'எனது ரூம்மேட்களுடன் பயன்படுத்த இது இலவசமா?', a: 'ஆம் — விளம்பரங்கள் இல்லை, ஒவ்வொரு-பரிவர்த்தனை கட்டணம் இல்லை. உருவாக்குவதற்கு இலவச மாதாந்திர கிரெடிட்கள் பயன்படுத்தப்படுகின்றன, அதன் பிறகு ஆப் உங்களுடையதாக இயங்குகிறது.' },
      ],
    },
  },
}
