import type { BuildPage } from './types'

export const FINANCE_PAGES: BuildPage[] = [
  {
    slug: 'expense-tracker-app',
    noun: 'expense tracker',
    h1: 'Build an Expense Tracker App with AI',
    metaTitle: 'Build an Expense Tracker App with AI — No Code',
    metaDesc: 'Track spending by category, split business from personal, and see where the month went — an expense tracker generated from a plain-English description.',
    target: 'web',
    category: 'finance',
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
    promptExample:
      'Build an expense tracker web app: an Add Expense form with amount, category (my custom list), date, an optional note, a business/personal toggle, and an optional receipt photo; a Dashboard showing this month\'s total and a category breakdown chart with comparison to last month; and a Reports page filtering business expenses by date range with CSV export.',
    faqs: [
      { q: 'Can it handle more than one currency?', a: 'Yes — add a currency per expense in your prompt, set a home currency, and totals convert at rates you control.' },
      { q: 'Can I attach receipts?', a: 'Add a photo field to expenses and each entry stores its receipt image — tax-season you will thank present-day you.' },
      { q: 'Does it connect to my bank?', a: 'Generated apps don\'t link to bank feeds out of the box — this is a deliberate-entry tracker, which is also why its categories are always right.' },
      { q: 'What does building it cost?', a: 'The 50 free monthly credits cover your first build (30 credits); after that, changes are 2-credit edits. No card needed to start.' },
    ],
    related: ['budget-planner-app', 'subscription-tracker', 'freelance-time-tracker'],
  },
  {
    slug: 'budget-planner-app',
    noun: 'budget planner',
    h1: 'Build a Budget Planner App with AI',
    metaTitle: 'Build a Budget Planning App with AI — No Code',
    metaDesc: 'Envelope budgets, savings goals, and a real answer to "can we afford this?" — a household budget app generated from your description in minutes.',
    target: 'web',
    category: 'finance',
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
    promptExample:
      'Build a household budget planner web app: a Budget page where we set monthly amounts per category (rent, groceries, transport, fun, savings) shown as envelopes with spent and remaining; a quick Add Expense form that draws from an envelope; a Goals page with savings targets, monthly contributions, and projected completion dates; and support for two user accounts sharing one budget.',
    faqs: [
      { q: 'Can both my partner and I use it?', a: 'Yes — it generates with authentication, and a shared-household structure means you both see and update the same budget live.' },
      { q: 'What happens to leftover money at month end?', a: 'Your choice of rule: roll unspent balances into next month\'s envelope, sweep them to a savings goal, or reset — set it in the prompt or change it in chat.' },
      { q: 'Can it do the 50/30/20 method instead of envelopes?', a: 'Yes — describe the method you follow and the budget structure, math, and dashboard are generated to match it.' },
      { q: 'Is our financial data private?', a: 'The app runs on its own Postgres database with row-level security, and WyberAi\'s live scan probes it as an attacker would before you publish.' },
    ],
    related: ['expense-tracker-app', 'subscription-tracker', 'meal-planner-app'],
  },
  {
    slug: 'subscription-tracker',
    noun: 'subscription tracker',
    h1: 'Build a Subscription Tracker App with AI',
    metaTitle: 'Build a Subscription Tracker App with AI — No Code',
    metaDesc: 'Every recurring charge in one place: renewal calendar, monthly total, and cancel-by dates. Built from a plain-English prompt — free to start.',
    target: 'web',
    category: 'finance',
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
    promptExample:
      'Build a subscription tracker web app: a Subscriptions page listing each service with name, price, billing cycle (monthly/quarterly/yearly), next renewal date, payment method, and category; a Dashboard showing the normalized monthly total, a category breakdown, and the next 30 days of upcoming renewals; and an Insights page ranking subscriptions by yearly cost with a "last used" field I update manually.',
    faqs: [
      { q: 'Can it remind me before a renewal?', a: 'The upcoming-renewals view highlights anything inside your warning window; ask chat to add email reminders when you publish if you want a push.' },
      { q: 'Does it detect subscriptions from my bank account?', a: 'No — entries are deliberate, which takes ten minutes to set up and means the list is complete and correct, including the ones hiding in app stores.' },
      { q: 'Can it track shared family subscriptions?', a: 'Yes — add a "shared with" or per-person split field in your prompt and the monthly total can show your share versus the household\'s.' },
      { q: 'Why not use a spreadsheet?', a: 'The tracker is what the spreadsheet becomes when it maintains its own renewal calendar, normalizes cycles into one total, and looks decent on your phone.' },
    ],
    related: ['budget-planner-app', 'expense-tracker-app', 'habit-tracker-app'],
  },
  {
    slug: 'debt-payoff-tracker',
    noun: 'debt payoff tracker',
    h1: 'Build a Debt Payoff Tracker with AI',
    metaTitle: 'Build a Debt Payoff Tracker App with AI',
    metaDesc: 'Snowball or avalanche method, a progress bar per debt, and a real payoff date — a debt tracker generated from plain English, not a generic calculator.',
    target: 'web',
    category: 'finance',
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
    promptExample:
      'Build a debt payoff tracker web app: a Debts page listing each debt with balance, interest rate, and minimum payment, orderable by snowball (smallest balance first) or avalanche (highest rate first); a Plan page where I enter an extra monthly payment amount and see a projected total payoff date and interest paid; and a Progress page with a bar per debt showing original balance versus current balance.',
    faqs: [
      { q: 'Which method should I use, snowball or avalanche?', a: 'Avalanche saves more interest mathematically; snowball tends to keep people motivated with early wins. The tracker supports either — switch anytime and the payoff order updates.' },
      { q: 'Does it recalculate when I make a payment?', a: 'Yes — log a payment against any debt and the remaining balance, progress bar, and projected payoff date update immediately.' },
      { q: 'Can it account for different interest rates changing over time?', a: 'Add a rate-change field if you have a promotional rate ending, and describe the schedule in your prompt — the projection follows it.' },
      { q: 'Is this different from a one-time payoff calculator?', a: 'Yes — this is a living tracker tied to your actual balances and payments, not a static result you have to manually recompute every month.' },
    ],
    related: ['budget-planner-app', 'expense-tracker-app'],
  },
  {
    slug: 'roommate-expense-splitter',
    noun: 'roommate expense splitter',
    h1: 'Build a Roommate Expense Splitter with AI',
    metaTitle: 'Build a Roommate Bill Splitter App with AI',
    metaDesc: 'Shared bills, auto-split calculations, and a running who-owes-who balance — a roommate expense app generated from plain English, no ads, no fees.',
    target: 'mobile',
    category: 'finance',
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
    promptExample:
      'Build a roommate expense splitter mobile app for a 3-person household: an Add Expense screen where anyone logs a charge with amount, description, who paid, and how it splits (even, custom percentages, or specific people); a Balances screen showing a running total of who owes whom across the household; and a Settle Up screen to mark a debt as paid, which clears the balance while keeping the expense history.',
    faqs: [
      { q: 'Can it handle uneven splits, like one person\'s guest?', a: 'Yes — set a custom split per expense, so a dinner where only two of three roommates ate splits between just those two.' },
      { q: 'Does it work for more than roommates — trips too?', a: 'The same structure fits any shared-expense group; describe your use case (a trip, a shared subscription) and the split logic follows.' },
      { q: 'Can someone leave the household and settle their final balance?', a: 'Yes — a final settle-up clears their balance to zero, and their historical expenses stay in the log for reference.' },
      { q: 'Is it free to use with my roommates?', a: 'Yes — no ads, no per-transaction fee. Building uses free monthly credits, and the app runs as yours from then on.' },
    ],
    related: ['expense-tracker-app', 'debt-payoff-tracker'],
  },
]
