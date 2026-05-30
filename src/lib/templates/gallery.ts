export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  framework: string;
  emoji: string;
  prompt: string;
  tags: string[];
  complexity?: 'starter' | 'advanced' | 'complex';
}

export const TEMPLATE_GALLERY: Template[] = [

  // ─── SaaS & Business ───
  {
    id: 'saas-dashboard',
    name: 'SaaS Admin Dashboard',
    description: 'Full admin dashboard with charts, metrics, user table, and sidebar nav',
    category: 'SaaS', framework: 'react-vite', emoji: '📊', complexity: 'advanced',
    tags: ['dashboard', 'charts', 'admin'],
    prompt: 'Build a full SaaS admin dashboard with: a sidebar with navigation items (Dashboard, Users, Analytics, Settings, Billing), top stats cards showing MRR, active users, churn rate, NPS, a line chart for revenue over 12 months, a bar chart for user growth, a recent users table with avatar, email, plan, status, and a dark/light mode toggle. Make it look like a premium B2B product.',
  },
  {
    id: 'crm',
    name: 'CRM System',
    description: 'Contact management with deals pipeline, activity timeline, and email log',
    category: 'SaaS', framework: 'react-vite', emoji: '🤝', complexity: 'complex',
    tags: ['crm', 'sales', 'contacts'],
    prompt: 'Build a full CRM system with: contacts list with search, filter by stage, and sort; contact detail view with name/company/email/phone/LinkedIn; deals pipeline kanban with stages (Lead/Qualified/Proposal/Negotiation/Closed Won/Closed Lost); deal cards with value, probability, and close date; activity timeline showing calls, emails, meetings; a dashboard with total pipeline value, win rate, and deals by stage chart; quick-add contact modal.',
  },
  {
    id: 'analytics-dashboard',
    name: 'Analytics Dashboard',
    description: 'Real-time analytics with multiple chart types, date filtering, and geo data',
    category: 'SaaS', framework: 'react-vite', emoji: '📈', complexity: 'advanced',
    tags: ['analytics', 'charts', 'data'],
    prompt: 'Build an analytics dashboard with: date range picker (7d/30d/90d/custom), key metrics cards (pageviews, unique visitors, bounce rate, avg session duration with trend arrows), area chart for traffic over time, donut chart for traffic sources (organic/paid/social/direct/referral), horizontal bar chart for top pages, device breakdown (desktop/mobile/tablet) with percentages, a data table with sortable columns, and CSV export button.',
  },
  {
    id: 'invoice-generator',
    name: 'Invoice Generator',
    description: 'Professional invoice builder with line items, tax, and PDF export',
    category: 'Business', framework: 'react-vite', emoji: '🧾', complexity: 'advanced',
    tags: ['invoice', 'billing', 'finance'],
    prompt: 'Build an invoice generator with: company name, address, and logo fields; client details form; dynamic line items table (add/remove rows, description, qty, unit price, auto-calculated total); automatic subtotal, tax rate selector, discount field, and grand total; invoice number, issue date, due date; payment terms dropdown; notes section; preview mode that shows the final invoice; and a print/PDF button. Style it to look like a real professional invoice with clean typography.',
  },
  {
    id: 'project-management',
    name: 'Project Management',
    description: 'Full PM tool with kanban, list view, gantt timeline, and team assignment',
    category: 'Productivity', framework: 'react-vite', emoji: '📋', complexity: 'complex',
    tags: ['project', 'kanban', 'tasks', 'team'],
    prompt: 'Build a project management tool with: sidebar showing projects list; kanban board view with columns (Backlog, Todo, In Progress, In Review, Done) and drag-and-drop cards; list view toggle showing tasks in a table; task cards with title, assignee avatar, priority badge (urgent/high/medium/low), due date, tags, and subtask count; task detail modal with description, comments, attachments placeholder, activity log; team member filter; progress bar per column; and a project header with completion percentage.',
  },
  {
    id: 'hr-dashboard',
    name: 'HR Dashboard',
    description: 'HR management with employee directory, org chart, leave tracker, and payroll overview',
    category: 'Business', framework: 'react-vite', emoji: '👥', complexity: 'complex',
    tags: ['hr', 'employees', 'payroll'],
    prompt: 'Build an HR dashboard with: employee directory with search, department filter, and card/list view toggle; employee profile card showing photo, name, role, department, email, start date, and manager; org chart visualization; leave management section with leave requests (pending/approved/rejected), calendar view of team leave, and leave balance by type; payroll overview with monthly payroll total, breakdown by department, and recent payslips table; hiring pipeline with open positions and applicant counts.',
  },
  {
    id: 'customer-support',
    name: 'Support Ticket System',
    description: 'Help desk with ticket inbox, priority queues, response templates, and SLA tracking',
    category: 'SaaS', framework: 'react-vite', emoji: '🎧', complexity: 'complex',
    tags: ['support', 'tickets', 'helpdesk'],
    prompt: 'Build a customer support ticket system with: ticket inbox with list of tickets (subject, customer, priority, status, created date); ticket detail view with full conversation thread, reply box with rich text, internal notes tab, and ticket metadata (assignee, priority, tags, SLA timer); filter by status (open/pending/resolved/closed), priority, and assignee; bulk actions (assign, close, tag); response templates picker; SLA indicator showing time remaining; and summary stats (open tickets, avg response time, satisfaction score).',
  },
  {
    id: 'subscription-billing',
    name: 'Subscription & Billing',
    description: 'Billing dashboard with plans, usage meters, invoices, and payment methods',
    category: 'SaaS', framework: 'react-vite', emoji: '💳', complexity: 'advanced',
    tags: ['billing', 'subscription', 'payments'],
    prompt: 'Build a subscription billing dashboard with: current plan display with features list and upgrade CTA; usage meters showing API calls, storage, team seats with progress bars and overage warnings; invoices table with date, amount, status, and download button; payment methods section with card display (last 4 digits, expiry) and add card button; plan comparison modal with 3 tiers; billing history chart showing monthly spend; and a cancel subscription flow with reason picker.',
  },

  // ─── E-commerce ───
  {
    id: 'product-catalog',
    name: 'E-commerce Store',
    description: 'Full shop with product grid, cart, search, filters, and checkout flow',
    category: 'E-commerce', framework: 'react-vite', emoji: '🛍', complexity: 'complex',
    tags: ['ecommerce', 'shop', 'products', 'cart'],
    prompt: 'Build a complete e-commerce store with: product grid with image, name, price, rating stars, and add-to-cart button; search bar with instant results; filter sidebar (category, price range slider, rating, color, in stock toggle); sort options (price low/high, rating, newest, bestselling); product detail page with image gallery carousel, size/color selector, quantity picker, stock indicator, related products, and reviews section; sliding cart drawer with items, quantities, and order summary; and a checkout form with shipping and payment steps.',
  },
  {
    id: 'restaurant-ordering',
    name: 'Restaurant Ordering',
    description: 'Food ordering app with menu, cart, dietary filters, and order tracking',
    category: 'E-commerce', framework: 'react-vite', emoji: '🍕', complexity: 'advanced',
    tags: ['food', 'restaurant', 'ordering'],
    prompt: 'Build a restaurant ordering app with: menu categories sidebar (Starters, Mains, Desserts, Drinks); menu item cards with photo, name, description, price, and add button; dietary filter badges (vegan, gluten-free, spicy, popular); item customization modal (size, extras, special instructions); cart sidebar with items, quantities, subtotal, delivery fee, and total; order type toggle (delivery/pickup); promo code field; and an order confirmation screen with estimated delivery time and order tracking steps.',
  },
  {
    id: 'inventory-management',
    name: 'Inventory Management',
    description: 'Stock management with SKU tracking, low stock alerts, and supplier management',
    category: 'Business', framework: 'react-vite', emoji: '📦', complexity: 'complex',
    tags: ['inventory', 'stock', 'warehouse'],
    prompt: 'Build an inventory management system with: products table with SKU, name, category, stock level, reorder point, unit cost, and total value; low stock alert banner; stock level color coding (red=critical, amber=low, green=ok); add/edit product modal with all fields; stock adjustment form (receive stock, manual adjustment, write-off with reason); supplier list with contact details; purchase orders table; category management; search and filter by category/supplier/stock status; and summary cards (total SKUs, total value, low stock count, out of stock count).',
  },

  // ─── Productivity ───
  {
    id: 'kanban-board',
    name: 'Kanban Board',
    description: 'Drag-and-drop task board with swimlanes, labels, and filters',
    category: 'Productivity', framework: 'react-vite', emoji: '🗂', complexity: 'advanced',
    tags: ['kanban', 'tasks', 'project management'],
    prompt: 'Build a Kanban board with: 5 columns (Backlog, Todo, In Progress, In Review, Done) with task counts; draggable task cards with title, assignee avatar, priority label (urgent/high/medium/low), due date with overdue highlighting, and tag badges; add card button per column; card detail modal with description editor, checklist, comments, due date picker, assignee selector, and label picker; column WIP limits with visual warning; filter by assignee, label, due date; and a board header with member avatars and search.',
  },
  {
    id: 'note-taking',
    name: 'Note Taking App',
    description: 'Notion-like notes with rich text, folders, tags, and search',
    category: 'Productivity', framework: 'react-vite', emoji: '📝', complexity: 'advanced',
    tags: ['notes', 'writing', 'knowledge'],
    prompt: 'Build a Notion-like note taking app with: left sidebar with workspace name, folder tree (nested folders), starred notes, and recent notes; main editor area with rich text formatting toolbar (heading 1/2/3, bold, italic, code, bullet list, numbered list, quote, divider); note title as large heading; tags input at the top; note metadata showing created/modified date; search bar that searches across all notes; trash/archive; and a clean empty state with quick action cards.',
  },
  {
    id: 'habit-tracker',
    name: 'Habit Tracker',
    description: 'Daily habit tracking with streaks, progress rings, and weekly calendar view',
    category: 'Productivity', framework: 'react-vite', emoji: '🎯', complexity: 'starter',
    tags: ['habits', 'tracking', 'wellness'],
    prompt: 'Build a habit tracker app with: habit list with circular progress rings showing completion percentage; daily check-in for each habit (tap to complete); streak counter with fire emoji and current/best streak; weekly calendar grid showing completion history (colored dots); add habit modal with name, color, icon, frequency (daily/weekdays/custom days), and reminder time; habit categories (health, learning, mindfulness, fitness); overall completion rate for today; and a motivational message based on performance.',
  },
  {
    id: 'time-tracker',
    name: 'Time Tracker',
    description: 'Work time tracker with projects, timers, reports, and billing rates',
    category: 'Productivity', framework: 'react-vite', emoji: '⏱', complexity: 'advanced',
    tags: ['time', 'tracking', 'billing', 'freelance'],
    prompt: 'Build a time tracking app with: active timer with start/stop/pause and project selector; today\'s time entries list with project, description, duration, and billable toggle; project list with color coding, client name, hourly rate, and total hours logged; weekly timesheet grid view; reports section with charts for time by project (pie chart), daily hours (bar chart), and billable vs non-billable; date range filter; and a summary showing total hours, billable hours, and estimated earnings.',
  },
  {
    id: 'todo-app',
    name: 'Smart Todo App',
    description: 'Task manager with priorities, subtasks, tags, due dates, and smart filters',
    category: 'Productivity', framework: 'react-vite', emoji: '✅', complexity: 'starter',
    tags: ['todo', 'tasks', 'productivity'],
    prompt: 'Build a polished todo app with: task list with checkboxes and smooth completion animation; priority levels (urgent/high/medium/low) with color coding; subtasks that expand under parent tasks; tag system with color-coded badges; due date with overdue highlighting in red; smart lists (Today, Upcoming, No Date, Completed); filter and sort bar; quick add task with natural language parsing hint; task count per list; bulk actions; and a progress bar showing daily completion.',
  },

  // ─── Finance ───
  {
    id: 'expense-tracker',
    name: 'Personal Finance',
    description: 'Expense tracker with budgets, categories, trends, and net worth tracker',
    category: 'Finance', framework: 'react-vite', emoji: '💰', complexity: 'advanced',
    tags: ['finance', 'budget', 'expenses', 'money'],
    prompt: 'Build a personal finance app with: monthly overview cards (income, expenses, savings rate, net balance); add transaction form (amount, category, date, note, type income/expense); transaction list with category icons, color coding, and search; budget section with category budgets, progress bars, and overage alerts; spending by category donut chart; monthly spending trend line chart; accounts section (checking, savings, credit card) with balances; and a net worth tracker showing assets minus liabilities over time.',
  },
  {
    id: 'crypto-dashboard',
    name: 'Crypto Portfolio',
    description: 'Crypto portfolio tracker with price charts, P&L, and allocation view',
    category: 'Finance', framework: 'react-vite', emoji: '₿', complexity: 'advanced',
    tags: ['crypto', 'portfolio', 'finance', 'trading'],
    prompt: 'Build a crypto portfolio dashboard with: portfolio total value with 24h change (green/red); holdings table with coin name/symbol, amount, avg buy price, current price, P&L amount and percentage, and allocation percentage; allocation pie chart; price chart for selected coin (1D/1W/1M/1Y range buttons) using a line/area chart; add holding modal with coin selector, amount, and purchase price; watchlist sidebar with favorite coins and prices; and market summary cards (BTC dominance, total market cap, fear & greed index).',
  },

  // ─── Communication ───
  {
    id: 'chat-app',
    name: 'Team Chat',
    description: 'Slack-like chat with channels, DMs, threads, reactions, and file sharing',
    category: 'Communication', framework: 'react-vite', emoji: '💬', complexity: 'complex',
    tags: ['chat', 'messaging', 'realtime', 'team'],
    prompt: 'Build a Slack-like team chat interface with: left sidebar with workspace name, channels section (#general, #random, #dev) with unread badges, DMs section with online status indicators, and starred items; main chat area with message bubbles showing avatar, username, timestamp, and content; emoji reactions on hover; threaded replies count; message input with formatting toolbar (bold, italic, code block, emoji picker button, file attach icon, send button); channel header with topic and member count; user online/offline indicator; and a right panel for thread view.',
  },
  {
    id: 'email-client',
    name: 'Email Client',
    description: 'Gmail-like email client with inbox, compose, labels, and search',
    category: 'Communication', framework: 'react-vite', emoji: '📧', complexity: 'complex',
    tags: ['email', 'inbox', 'communication'],
    prompt: 'Build a Gmail-like email client with: left sidebar with compose button, folder list (Inbox with unread count, Sent, Drafts, Starred, Spam, Trash), and labels section; email list showing sender avatar, name, subject preview, date, and star/read status; email detail view with full message, reply/forward/delete actions, and CC/BCC display; compose modal with To/CC/BCC/Subject fields, rich text editor, and send button; search bar with filter chips; select all and bulk actions (delete, mark read, label); and an empty states for each folder.',
  },

  // ─── Health & Lifestyle ───
  {
    id: 'fitness-tracker',
    name: 'Fitness Tracker',
    description: 'Workout logger with exercise library, progress charts, and body metrics',
    category: 'Health', framework: 'react-vite', emoji: '💪', complexity: 'advanced',
    tags: ['fitness', 'workout', 'health', 'gym'],
    prompt: 'Build a fitness tracker app with: workout log showing recent workouts with date, name, duration, and exercises completed; start workout flow with exercise selector from a library (categorized by muscle group), sets/reps/weight input per exercise, and rest timer; progress charts for key lifts (bench press, squat, deadlift) showing weight over time; body metrics tracker (weight, body fat%) with trend chart; workout streak and weekly goal progress; personal records board; and a workout plan section with predefined programs.',
  },
  {
    id: 'recipe-app',
    name: 'Recipe App',
    description: 'Recipe browser with search, dietary filters, ingredient scaling, and meal planner',
    category: 'Health', framework: 'react-vite', emoji: '🍳', complexity: 'advanced',
    tags: ['recipes', 'food', 'cooking', 'meal planning'],
    prompt: 'Build a recipe app with: recipe card grid with photo placeholder, name, prep time, difficulty stars, and cuisine tag; search bar; filter by cuisine (Italian, Asian, Mexican, etc.) and diet (vegan/vegetarian/gluten-free/keto/paleo); recipe detail page with hero image, cook/prep/total time, servings adjuster that scales all ingredients proportionally, ingredient list with checkboxes, step-by-step instructions with photos, nutrition facts table, and save/share buttons; favorites collection; weekly meal planner grid; and a shopping list that aggregates ingredients from planned meals.',
  },

  // ─── Developer Tools ───
  {
    id: 'api-explorer',
    name: 'API Explorer',
    description: 'Postman-like REST client with collections, history, and response viewer',
    category: 'Dev Tools', framework: 'react-vite', emoji: '🔌', complexity: 'complex',
    tags: ['api', 'rest', 'developer', 'testing'],
    prompt: 'Build a Postman-like API explorer with: left sidebar with collections (grouped requests) and history; request panel with method selector (GET/POST/PUT/PATCH/DELETE with color coding), URL input, and send button; tabs for Params (key-value table), Headers (key-value table), Body (JSON editor with syntax highlighting), and Auth (Bearer token, Basic auth); response panel with status code badge (color coded), response time, body with pretty JSON viewer, headers tab; environment variables selector; and save request to collection button.',
  },
  {
    id: 'code-snippet-manager',
    name: 'Code Snippet Manager',
    description: 'Snippet library with syntax highlighting, tags, search, and copy button',
    category: 'Dev Tools', framework: 'react-vite', emoji: '🗂', complexity: 'starter',
    tags: ['code', 'snippets', 'developer'],
    prompt: 'Build a code snippet manager with: snippet list in left sidebar showing name, language badge, and tags; main view with snippet title, description, language selector, and code block with syntax highlighting (use highlight.js or Prism styling); copy to clipboard button with success animation; tag system with color-coded badges; search that searches title, description, and code; filter by language; add/edit snippet modal; favorites; and keyboard shortcut to copy (Cmd+C).',
  },
  {
    id: 'json-formatter',
    name: 'JSON Formatter',
    description: 'JSON tool with format, minify, validate, diff, and tree view',
    category: 'Dev Tools', framework: 'react-vite', emoji: '{}', complexity: 'starter',
    tags: ['json', 'formatter', 'developer', 'tool'],
    prompt: 'Build a JSON formatter tool with: large textarea for JSON input; action buttons (Format/Prettify, Minify, Validate, Copy); error message display with line number for invalid JSON; formatted output with syntax highlighting (strings in green, numbers in blue, booleans in orange, null in red); collapsible tree view of the JSON structure; JSON path display when clicking a value; character/line count; and a split view with input on left, formatted output on right. Make it fast and keyboard-friendly.',
  },

  // ─── Landing Pages ───
  {
    id: 'landing-page',
    name: 'SaaS Landing Page',
    description: 'Modern landing page with hero, features, pricing, testimonials, and FAQ',
    category: 'Marketing', framework: 'react-vite', emoji: '🚀', complexity: 'advanced',
    tags: ['landing', 'marketing', 'pricing'],
    prompt: 'Build a complete SaaS landing page with: sticky nav with logo, links, and CTA button; hero section with bold headline, subheadline, CTA buttons, email capture, and product mockup placeholder; social proof logos bar; feature section with alternating image/text rows (3 features); feature grid (6 icons with heading + description); pricing table with monthly/annual toggle (3 tiers: Free/Pro/Enterprise) with feature comparison; testimonials with avatar, name, role, company, and star rating; FAQ accordion; and a full-width CTA section with gradient background.',
  },
  {
    id: 'portfolio',
    name: 'Developer Portfolio',
    description: 'Personal portfolio with projects, skills, timeline, and contact',
    category: 'Personal', framework: 'react-vite', emoji: '👨‍💻', complexity: 'starter',
    tags: ['portfolio', 'personal', 'showcase'],
    prompt: 'Build a clean developer portfolio with: sticky nav with name/logo and anchor links; hero section with large name, animated title typewriter (Frontend Developer / React Expert / etc.), brief bio, download resume button, and social links (GitHub, LinkedIn, Twitter); skills section with categorized tags (Languages, Frameworks, Tools) with proficiency indicators; projects grid with mockup image placeholder, name, description, tech stack badges, and GitHub/live links; work experience timeline with company, role, dates, and bullet points; education section; and a contact form with name/email/message.',
  },
  {
    id: 'vue-landing',
    name: 'Vue Landing Page',
    description: 'Animated landing page built with Vue 3 and scroll animations',
    category: 'Marketing', framework: 'vue', emoji: '💚', complexity: 'advanced',
    tags: ['landing', 'vue', 'animated'],
    prompt: 'Build a modern landing page in Vue 3 with: animated hero section with typewriter effect on the headline, floating gradient orbs, and a CTA button with shimmer effect; scroll-triggered feature cards that slide in from left/right alternating; an interactive pricing toggle (monthly/annual) that animates price changes; a testimonial carousel/slider; statistics counter section that counts up when in view; a gradient CTA section at the bottom; and smooth page transitions. Use Vue 3 Composition API and CSS transitions throughout.',
  },

  // ─── Fun & Games ───
  {
    id: 'vanilla-game',
    name: 'Snake Game',
    description: 'Fully playable snake game with levels, high scores, and power-ups',
    category: 'Games', framework: 'vanilla', emoji: '🎮', complexity: 'starter',
    tags: ['game', 'canvas', 'javascript'],
    prompt: 'Build a polished snake game in vanilla JavaScript with HTML5 Canvas with: smooth snake movement with WASD and arrow key controls; food that appears randomly with bonus food items that disappear after 5 seconds; score counter and high score saved to localStorage; speed that increases every 5 points; level display; game over screen with final score, high score, and restart button; pause on spacebar; a power-up food (blue) that temporarily slows the snake; and a dark neon aesthetic with glowing snake and grid.',
  },
  {
    id: 'quiz-app',
    name: 'Quiz App',
    description: 'Interactive quiz with categories, timer, scoring, and leaderboard',
    category: 'Games', framework: 'react-vite', emoji: '🧠', complexity: 'starter',
    tags: ['quiz', 'trivia', 'game'],
    prompt: 'Build a quiz app with: home screen with category selector (Science, History, Sports, Technology, Movies) and difficulty picker (Easy/Medium/Hard); quiz screen with progress bar, question number, countdown timer (30 seconds per question), multiple choice options that highlight green/red on selection, and score counter; animated correct/incorrect feedback; results screen with score percentage, time taken, correct/incorrect breakdown, and share button; a leaderboard showing top 10 scores from localStorage; and smooth transitions between screens.',
  },

  // ─── Real Estate & Booking ───
  {
    id: 'property-listing',
    name: 'Property Listings',
    description: 'Real estate app with map view, filters, property detail, and mortgage calculator',
    category: 'Real Estate', framework: 'react-vite', emoji: '🏠', complexity: 'complex',
    tags: ['real estate', 'listings', 'property'],
    prompt: 'Build a real estate property listing app with: split view (list on left, map placeholder on right) with toggle button; property cards showing photo placeholder, price, beds/baths/sqft, address, and favorite heart icon; filter panel (price range slider, beds/baths, property type checkboxes, min sqft); sort options (price, newest, sqft); property detail page with image gallery carousel, full details, agent contact card, schedule tour button, neighborhood info, and a mortgage calculator (price, down payment, interest rate, term with monthly payment output); and a map view placeholder with property pins.',
  },
  {
    id: 'booking-system',
    name: 'Appointment Booking',
    description: 'Booking platform with calendar, service selection, provider picker, and confirmations',
    category: 'Business', framework: 'react-vite', emoji: '📅', complexity: 'advanced',
    tags: ['booking', 'appointments', 'calendar', 'scheduling'],
    prompt: 'Build an appointment booking system with: service catalog page with service cards (name, duration, price, description); provider selection step showing available staff with photo, name, rating, and bio; calendar view showing available dates (grayed out unavailable); time slot grid for selected date; booking form (name, email, phone, notes); confirmation screen with booking summary and add-to-calendar button; admin view showing appointments table with date, client, service, provider, status; and appointment status management (confirm, reschedule, cancel).',
  },
];

export const CATEGORIES = [...new Set(TEMPLATE_GALLERY.map(t => t.category))];

// ─── HEALTHCARE & MEDICAL ───
const HEALTHCARE: Template[] = [
  {
    id: 'patient-portal',
    name: 'Patient Portal',
    description: 'Patient health records, appointments, prescriptions, and lab results',
    category: 'Healthcare', framework: 'react-vite', emoji: '🏥', complexity: 'complex',
    tags: ['healthcare', 'medical', 'patients', 'ehr'],
    prompt: 'Build a patient portal with: dashboard showing upcoming appointments, recent lab results, active prescriptions, and health summary cards (BP, weight, BMI trend). Appointments section with calendar view, upcoming list, and book new appointment flow. Medical records with visit history, diagnoses, documents upload. Prescriptions list with refill request button, pharmacy info, dosage. Lab results with trend charts for key metrics. Secure messaging to care team. Insurance info display. Emergency contacts. Use emerald green #10b981 accent. Space Grotesk + Sora fonts.',
  },
  {
    id: 'hospital-admin',
    name: 'Hospital Admin Dashboard',
    description: 'Bed management, staff scheduling, department stats, and patient flow',
    category: 'Healthcare', framework: 'react-vite', emoji: '🏨', complexity: 'complex',
    tags: ['hospital', 'admin', 'beds', 'staff'],
    prompt: 'Build a hospital admin dashboard with: real-time bed occupancy grid showing each room status (available/occupied/cleaning/maintenance) color coded. Census stats cards (total beds, occupied %, average LOS, daily admissions/discharges). Department breakdown table (ED, ICU, Medical, Surgical, Maternity) with beds, occupancy, staff on duty. Staff schedule showing shifts, on-call rotations, coverage gaps. Patient queue/waitlist with priority sorting. Department performance metrics with trend charts. Alerts panel for critical bed availability. Use blue #0EA5E9 accent.',
  },
  {
    id: 'clinic-management',
    name: 'Clinic Management System',
    description: 'Appointment scheduling, patient queue, billing, and doctor assignments',
    category: 'Healthcare', framework: 'react-vite', emoji: '🩺', complexity: 'advanced',
    tags: ['clinic', 'appointments', 'billing', 'queue'],
    prompt: 'Build a clinic management system with: front desk dashboard showing today\'s appointment queue with check-in status, wait times, and room assignments. Patient search and quick registration form. Appointment scheduler with doctor availability calendar. Treatment rooms grid showing current patient and expected duration. Billing section with insurance verification, co-pay collection, and invoice generation. Daily revenue summary. Doctor performance stats. Waitlist management with SMS notification toggle.',
  },
  {
    id: 'telehealth-platform',
    name: 'Telehealth Platform',
    description: 'Virtual consultations, video call UI, prescriptions, and follow-ups',
    category: 'Healthcare', framework: 'react-vite', emoji: '📱', complexity: 'advanced',
    tags: ['telehealth', 'video', 'virtual', 'consultations'],
    prompt: 'Build a telehealth platform landing and patient dashboard with: hero promoting virtual care with "See a doctor in minutes" messaging. Doctor directory with specialty filter, ratings, availability badges, and book now button. Upcoming consultations with join video call button. Waiting room UI with video preview, device check, and queue position. Post-consultation summary with diagnosis, prescription, and follow-up scheduling. Medical history quick access during calls. Prescription delivery tracking. Use sky blue #0EA5E9 accent.',
  },
];

// ─── EDUCATION & E-LEARNING ───
const EDUCATION: Template[] = [
  {
    id: 'lms-dashboard',
    name: 'LMS Student Dashboard',
    description: 'Course progress, assignments, grades, and live classes',
    category: 'Education', framework: 'react-vite', emoji: '🎓', complexity: 'complex',
    tags: ['lms', 'courses', 'education', 'elearning'],
    prompt: 'Build a learning management system student dashboard with: progress overview showing enrolled courses with completion percentages and skill bars. Today\'s schedule with class times and join links. Course cards with instructor, progress bar, next lesson, and continue button. Assignments due sorted by deadline with submit button. Grades table by subject with trend sparklines. Achievement badges grid. Discussion forum preview with recent threads. Resource library with search. Streak and study time stats. Use amber #f59e0b accent for creative education feel.',
  },
  {
    id: 'teacher-dashboard',
    name: 'Teacher Dashboard',
    description: 'Class management, student performance, assignments, and grade book',
    category: 'Education', framework: 'react-vite', emoji: '👩‍🏫', complexity: 'complex',
    tags: ['teacher', 'classroom', 'grades', 'students'],
    prompt: 'Build a teacher dashboard with: class overview cards showing student count, average score, completion rate, and at-risk students. Student roster table with progress bars, last active, assignment status, and grade column. Grade book with subject columns, editable grade cells, automatic average calculation, and export to CSV. Assignment manager with create, publish, deadline, and submission tracking. At-risk student alerts panel. Class performance charts by assignment and student trend. Announcement creator. Parent communication log.',
  },
  {
    id: 'online-course-platform',
    name: 'Online Course Platform',
    description: 'Course marketplace, video lessons, quizzes, and certificates',
    category: 'Education', framework: 'react-vite', emoji: '📚', complexity: 'complex',
    tags: ['courses', 'marketplace', 'video', 'learning'],
    prompt: 'Build an online course marketplace with: hero with search bar and category filters. Featured courses grid with thumbnail, instructor, rating stars, student count, price, and bestseller badge. Course detail page with curriculum accordion (sections and video lessons with durations), instructor bio, reviews, what you\'ll learn bullet list, and requirements. Video player UI with progress bar, playback controls, transcript toggle, and notes panel. Quiz component with multiple choice and instant feedback. Progress certificate generator. My learning page with in-progress and completed courses.',
  },
  {
    id: 'school-admin',
    name: 'School Admin System',
    description: 'Student records, attendance, fee management, and reports',
    category: 'Education', framework: 'react-vite', emoji: '🏫', complexity: 'advanced',
    tags: ['school', 'admin', 'attendance', 'fees'],
    prompt: 'Build a school administration system with: enrollment statistics dashboard (total students, by grade, new this year, transfers). Student records table with search, photo, name, class, parent contact, attendance %, and grade average. Daily attendance marking by class with absent/present/late. Fee management with payment status, outstanding amounts, payment history, and receipt generation. Academic calendar with events, holidays, and exam dates. Report card generator. Parent portal link. Staff directory with roles and contact info.',
  },
];

// ─── REAL ESTATE ───
const REAL_ESTATE: Template[] = [
  {
    id: 'property-listings',
    name: 'Property Listings Platform',
    description: 'Property search, filters, map view, and agent contacts',
    category: 'Real Estate', framework: 'react-vite', emoji: '🏠', complexity: 'complex',
    tags: ['real estate', 'property', 'listings', 'search'],
    prompt: 'Build a real estate platform with: search hero with location input, buy/rent toggle, property type and price range filters. Property grid with photo gallery, price, beds/baths, sqft, location badge, and favorite heart button. List/map view toggle (show map placeholder on right). Property detail page with image gallery carousel, price, key stats, description, amenities checklist, neighborhood info, mortgage calculator, and agent contact card. Agent profile with listings and contact form. Saved properties page. Recently viewed. Use slate blue accent.',
  },
  {
    id: 'real-estate-agent',
    name: 'Real Estate Agent CRM',
    description: 'Lead pipeline, property matches, client communication, and deal tracking',
    category: 'Real Estate', framework: 'react-vite', emoji: '🔑', complexity: 'complex',
    tags: ['real estate', 'crm', 'leads', 'deals'],
    prompt: 'Build a real estate agent CRM with: pipeline kanban showing leads by stage (New/Contacted/Showing/Offer/Closing/Closed) with deal values. Lead cards with client name, budget, requirements, and last contact date. Client profile with wish list (beds, baths, area, budget), matched properties, showing history, and notes. Property matching engine showing compatible listings. Commission tracker with monthly earnings chart and deal history table. Task reminders for follow-ups and showings. Document vault for contracts. Performance metrics vs targets.',
  },
  {
    id: 'property-management',
    name: 'Property Management Dashboard',
    description: 'Tenant portal, rent collection, maintenance requests, and lease management',
    category: 'Real Estate', framework: 'react-vite', emoji: '🏢', complexity: 'complex',
    tags: ['property management', 'tenants', 'rent', 'maintenance'],
    prompt: 'Build a property management dashboard with: portfolio overview showing properties count, total units, occupancy rate, monthly rent collected vs expected, and vacant units alert. Properties list with occupancy bars, address, unit count, and manage button. Tenant roster with unit, lease end date, rent status (paid/pending/late), and contact. Rent collection tracker with payment history and late fee calculator. Maintenance requests board with status (open/in-progress/completed), priority, and assigned contractor. Lease expiry calendar. Financial summary with income, expenses, and NOI by property.',
  },
];

// ─── LEGAL ───
const LEGAL: Template[] = [
  {
    id: 'law-firm-dashboard',
    name: 'Law Firm Dashboard',
    description: 'Case management, billable hours, client portal, and deadlines',
    category: 'Legal', framework: 'react-vite', emoji: '⚖️', complexity: 'complex',
    tags: ['legal', 'law', 'cases', 'billing'],
    prompt: 'Build a law firm management dashboard with: active cases table showing case number, client, type (criminal/civil/family/corporate), status, assigned attorney, next deadline, and billable hours. Time tracking with running timer, recent entries, and weekly billable hours summary. Client directory with contact info, matters, and billing history. Deadline calendar with court dates, filing deadlines, and statute of limitations alerts. Invoice generator with hourly rate, hours worked, disbursements, and payment tracking. Document vault by case. Conflict check tool. Use dark navy with gold accent.',
  },
  {
    id: 'contract-manager',
    name: 'Contract Manager',
    description: 'Contract lifecycle, e-signatures, expiry alerts, and clause library',
    category: 'Legal', framework: 'react-vite', emoji: '📜', complexity: 'advanced',
    tags: ['contracts', 'legal', 'signatures', 'compliance'],
    prompt: 'Build a contract management system with: dashboard showing active contracts, expiring in 30/60/90 days, pending signatures, and total contract value. Contract list table with type, parties, value, start/end date, status badge, and actions. Contract detail view with metadata, key dates, obligation checklist, and attached document preview. Clause library with searchable standard clauses. E-signature workflow showing signing parties, status, and reminder send. Auto-renewal alerts panel. Version history. Filter by type, status, department, and value range.',
  },
];

// ─── LOGISTICS & SUPPLY CHAIN ───
const LOGISTICS: Template[] = [
  {
    id: 'fleet-management',
    name: 'Fleet Management Dashboard',
    description: 'Vehicle tracking, driver assignments, maintenance schedules, and fuel costs',
    category: 'Logistics', framework: 'react-vite', emoji: '🚛', complexity: 'complex',
    tags: ['fleet', 'vehicles', 'drivers', 'logistics'],
    prompt: 'Build a fleet management dashboard with: fleet overview stats (total vehicles, active/idle/maintenance, drivers on road). Vehicle list with ID, type, driver assigned, location, fuel level bar, last service date, and status badge. Driver roster with license, assigned vehicle, hours this week, trips completed, and performance score. Map placeholder showing vehicle locations. Trip history table with origin, destination, distance, duration, fuel used, and cost. Maintenance scheduler with due dates and service history. Fuel cost tracker by vehicle and month with charts. Alerts for overdue maintenance and license expiry.',
  },
  {
    id: 'shipment-tracker',
    name: 'Shipment Tracker',
    description: 'Order tracking, carrier integration, delivery status, and exception management',
    category: 'Logistics', framework: 'react-vite', emoji: '📦', complexity: 'advanced',
    tags: ['shipping', 'tracking', 'delivery', 'logistics'],
    prompt: 'Build a shipment tracking platform with: search bar for tracking number lookup. Active shipments table with tracking ID, origin, destination, carrier, status badge (In Transit/Delivered/Exception/Pending), and estimated delivery. Shipment detail view with visual timeline stepper showing status history with timestamps and locations. Map placeholder showing current location. Exception alerts panel for delays, customs holds, and failed deliveries. Carrier performance stats (on-time %, average transit days). Bulk shipment importer. Daily/weekly summary emails toggle. Export to CSV.',
  },
  {
    id: 'warehouse-management',
    name: 'Warehouse Management System',
    description: 'Bin locations, pick orders, receiving, and stock movements',
    category: 'Logistics', framework: 'react-vite', emoji: '🏭', complexity: 'complex',
    tags: ['warehouse', 'inventory', 'picking', 'receiving'],
    prompt: 'Build a warehouse management system with: dashboard showing today\'s orders to pick, receiving queue, stock alerts, and warehouse utilization. Bin location grid showing zones (A, B, C) with occupancy heat map colors. Inbound receiving form with PO number, supplier, items list, quantity check, and put-away location. Pick list generator with optimal route and bin locations. Stock movement history with in/out/transfer and reason codes. Low stock threshold alerts. Barcode scanner input field for quick lookups. Cycle count scheduler. Inventory accuracy metrics by zone.',
  },
];

// ─── HOSPITALITY & TRAVEL ───
const HOSPITALITY: Template[] = [
  {
    id: 'hotel-pms',
    name: 'Hotel Management System',
    description: 'Room availability, reservations, check-in/out, and revenue dashboard',
    category: 'Hospitality', framework: 'react-vite', emoji: '🏨', complexity: 'complex',
    tags: ['hotel', 'reservations', 'rooms', 'hospitality'],
    prompt: 'Build a hotel management system with: front desk dashboard showing room grid color-coded by status (available-green, occupied-blue, checkout today-amber, cleaning-gray, maintenance-red). Today\'s arrivals and departures list with guest name, room, times, and status. Quick check-in and check-out forms. Reservation calendar showing bookings by room. Guest profile with stay history, preferences, and loyalty points. Housekeeping board with room assignments and cleaning status. Revenue dashboard with ADR, occupancy %, RevPAR, and booking source breakdown. Restaurant POS integration summary.',
  },
  {
    id: 'travel-booking',
    name: 'Travel Booking Platform',
    description: 'Flight and hotel search, itinerary builder, and booking management',
    category: 'Hospitality', framework: 'react-vite', emoji: '✈️', complexity: 'complex',
    tags: ['travel', 'flights', 'hotels', 'booking'],
    prompt: 'Build a travel booking platform with: hero with tabbed search (Flights/Hotels/Packages) with origin, destination, dates, guests. Flight results showing airline, departure/arrival times, duration, stops, price, and select button. Filter panel with stops, airlines, price range, departure time. Hotel results with photo, name, stars rating, location, amenities icons, price per night. Itinerary builder with draggable day planner. Booking confirmation with e-ticket. My trips dashboard with upcoming, past, and cancelled trips. Travel document storage. Price alert setter.',
  },
  {
    id: 'restaurant-dashboard',
    name: 'Restaurant Management Dashboard',
    description: 'Table management, orders, kitchen display, and revenue analytics',
    category: 'Hospitality', framework: 'react-vite', emoji: '🍽️', complexity: 'complex',
    tags: ['restaurant', 'orders', 'kitchen', 'tables'],
    prompt: 'Build a restaurant management dashboard with: floor plan showing tables with status (available/seated/ordering/bill-requested/reserved) color coded. Live orders list with table number, items, time elapsed, and status (new/preparing/ready/served). Kitchen display showing ticket queue with timers and color urgency coding. Reservation book with timeline view. Menu management with categories, items, prices, availability toggle, and photo upload. Daily sales dashboard with revenue by hour chart, popular items, average ticket size. Staff clock-in/out tracker. Inventory alerts for low stock.',
  },
];

// ─── FINANCE & FINTECH ───
const FINTECH: Template[] = [
  {
    id: 'banking-dashboard',
    name: 'Digital Banking Dashboard',
    description: 'Account overview, transactions, transfers, and spending insights',
    category: 'Fintech', framework: 'react-vite', emoji: '🏦', complexity: 'complex',
    tags: ['banking', 'finance', 'transactions', 'accounts'],
    prompt: 'Build a digital banking dashboard with: account summary cards (checking, savings, credit card) with balances and quick action buttons. Recent transactions list with merchant icon, name, category, date, and amount color coded (green=credit, red=debit). Transfer money flow with from/to account selector, amount, and schedule options. Spending insights with category donut chart and vs-last-month comparisons. Budget tracker with category budgets and progress bars. Bills and subscriptions list with due dates. Goal savings tracker with progress to target. Security notifications panel. Use emerald #10b981 accent for finance trust feel.',
  },
  {
    id: 'investment-portfolio',
    name: 'Investment Portfolio Tracker',
    description: 'Portfolio performance, holdings, P&L, and market overview',
    category: 'Fintech', framework: 'react-vite', emoji: '📈', complexity: 'complex',
    tags: ['investment', 'portfolio', 'stocks', 'finance'],
    prompt: 'Build an investment portfolio tracker with: portfolio value card with today\'s gain/loss and percentage. Performance chart with 1D/1W/1M/3M/1Y/All timeframes. Holdings table with ticker, company, shares, avg cost, current price, market value, total gain/loss with color and percentage. Sector allocation donut chart. Dividend income tracker by month. Watchlist with price alerts. Market movers widget showing top gainers and losers. News feed filtered to held stocks. Transaction history with buy/sell entries. Tax lot selector for reporting.',
  },
  {
    id: 'accounting-software',
    name: 'Accounting & Bookkeeping',
    description: 'P&L, balance sheet, accounts payable/receivable, and tax reports',
    category: 'Fintech', framework: 'react-vite', emoji: '📒', complexity: 'complex',
    tags: ['accounting', 'bookkeeping', 'finance', 'reports'],
    prompt: 'Build an accounting dashboard with: P&L summary showing revenue, COGS, gross profit, operating expenses, and net income vs budget. Accounts receivable aging table (current, 30, 60, 90+ days) with client, invoice, amount, and send reminder button. Accounts payable list with vendor, due date, amount, and pay now button. Chart of accounts with debit/credit entries and running balance. Bank reconciliation tool showing statement vs books. Monthly close checklist. Tax prep summaries (VAT/GST collected, quarterly estimates). Journal entry form. Financial report exports (PDF).',
  },
  {
    id: 'payment-gateway-dashboard',
    name: 'Payment Gateway Dashboard',
    description: 'Transaction volumes, success rates, disputes, and payout management',
    category: 'Fintech', framework: 'react-vite', emoji: '💳', complexity: 'advanced',
    tags: ['payments', 'gateway', 'transactions', 'fintech'],
    prompt: 'Build a payment gateway dashboard with: volume stats (today, this week, this month) with success rate, failed, and refund counts. Transaction table with ID, customer, amount, currency, method (card/bank/wallet), status badge, and timestamp. Success rate trend chart by day. Failed transaction reasons breakdown pie chart. Dispute management list with reason, amount, status, and respond button. Payout schedule with next payout date and amount. Webhook log with endpoint, status, retry count. API key management section. Settlement history. Revenue by payment method.',
  },
];

// ─── HUMAN RESOURCES ───
const HR: Template[] = [
  {
    id: 'recruitment-ats',
    name: 'Applicant Tracking System',
    description: 'Job postings, candidate pipeline, interviews, and offer management',
    category: 'HR', framework: 'react-vite', emoji: '🎯', complexity: 'complex',
    tags: ['recruiting', 'ats', 'hiring', 'candidates'],
    prompt: 'Build an applicant tracking system with: recruitment dashboard showing open positions, total applicants, interviews scheduled, offers pending, and time-to-hire stats. Job postings list with title, department, location, applicants count, and status (open/paused/closed). Candidate pipeline kanban with stages (Applied/Screening/Phone/Technical/Final/Offer/Hired/Rejected). Candidate profile with resume viewer, interview notes, scorecard, and activity timeline. Interview scheduler with calendar and interviewer assignments. Offer letter generator with template and approval workflow. Analytics: source of hire, funnel conversion rates, diversity metrics.',
  },
  {
    id: 'employee-directory',
    name: 'Employee Directory & Org Chart',
    description: 'Staff profiles, department structure, org chart, and team contact cards',
    category: 'HR', framework: 'react-vite', emoji: '👥', complexity: 'advanced',
    tags: ['hr', 'directory', 'employees', 'org chart'],
    prompt: 'Build an employee directory with: search and filter by department, location, and role. Employee cards grid with avatar (dicebear), name, title, department, location, and email. Employee profile modal with full contact info, reporting manager, direct reports, skills, tenure, and bio. Department view showing all members with role hierarchy. Org chart tree visualization (use divs with lines) showing company structure from CEO down. Headcount stats by department. Birthday and work anniversary alerts this week. New joiners section.',
  },
  {
    id: 'payroll-dashboard',
    name: 'Payroll Management Dashboard',
    description: 'Salary processing, tax deductions, payslips, and compliance reports',
    category: 'HR', framework: 'react-vite', emoji: '💰', complexity: 'complex',
    tags: ['payroll', 'salary', 'hr', 'compliance'],
    prompt: 'Build a payroll management dashboard with: payroll run overview showing pay period, employee count, gross payroll, deductions, and net payroll. Employee payroll table with name, base salary, hours, overtime, deductions (tax, insurance, pension), and net pay. Payslip generator with detailed breakdown. Tax liability summary by category. Statutory compliance calendar (tax filing dates, provident fund). Direct deposit status with bank details and transfer confirmation. Year-to-date reports per employee. Payroll journal for accounting. Headcount cost by department chart.',
  },
  {
    id: 'performance-management',
    name: 'Performance Management System',
    description: 'Goal setting, OKRs, 360 reviews, and performance ratings',
    category: 'HR', framework: 'react-vite', emoji: '⭐', complexity: 'advanced',
    tags: ['performance', 'okr', 'goals', 'reviews'],
    prompt: 'Build a performance management system with: dashboard showing review cycle status (Q1 goals set, mid-year review, annual review). Individual goal tracker with OKR format (Objective → Key Results with progress bars and status). 360 feedback form with rating scales and open text fields for peers, manager, and direct reports. Performance rating distribution chart. Team dashboard showing all direct reports with their goal completion % and last review rating. Calibration view for managers comparing team members. Development plan tracker with skills, learning resources, and milestones.',
  },
];

// ─── MARKETING ───
const MARKETING: Template[] = [
  {
    id: 'marketing-dashboard',
    name: 'Marketing Analytics Dashboard',
    description: 'Campaign performance, channel ROI, lead funnel, and attribution',
    category: 'Marketing', framework: 'react-vite', emoji: '📣', complexity: 'complex',
    tags: ['marketing', 'analytics', 'campaigns', 'roi'],
    prompt: 'Build a marketing analytics dashboard with: top KPI cards (total spend, leads generated, CAC, MQL/SQL conversion, revenue attributed). Channel performance table (Google Ads, Facebook, LinkedIn, Email, Organic) with spend, clicks, leads, CPL, and ROI. Lead funnel visualization (Visitors → Leads → MQLs → SQLs → Opportunities → Won) with conversion rates. Campaign table with status badge, budget, spend, leads, and ROI. Email campaign performance (open rate, click rate, conversion). Content performance with top pages and traffic. A/B test results panel. Attribution model selector.',
  },
  {
    id: 'social-media-dashboard',
    name: 'Social Media Dashboard',
    description: 'Multi-platform analytics, post scheduler, engagement tracker, and content calendar',
    category: 'Marketing', framework: 'react-vite', emoji: '📱', complexity: 'advanced',
    tags: ['social media', 'instagram', 'marketing', 'content'],
    prompt: 'Build a social media management dashboard with: platform tabs (Instagram, Twitter/X, LinkedIn, Facebook, YouTube). Follower growth chart with platform breakdown. Engagement rate stats and benchmark comparison. Top performing posts grid with metrics. Content calendar with scheduled and published posts. Post composer with character count, hashtag suggestions, and multi-platform toggle. Story/reel performance analytics. Audience demographics charts (age, gender, location). Competitor follower count tracker. Best time to post heatmap. Monthly report generator.',
  },
  {
    id: 'seo-dashboard',
    name: 'SEO Dashboard',
    description: 'Keyword rankings, traffic, backlinks, and technical health score',
    category: 'Marketing', framework: 'react-vite', emoji: '🔍', complexity: 'advanced',
    tags: ['seo', 'keywords', 'rankings', 'marketing'],
    prompt: 'Build an SEO analytics dashboard with: traffic overview (organic sessions, clicks, impressions, average CTR, average position) vs previous period. Keyword rankings table with keyword, position, previous position, change arrow, search volume, and difficulty. Top pages by organic traffic with position and click data. Backlink profile summary (total links, referring domains, new/lost this month). Technical health score with issues list (broken links, slow pages, missing meta, duplicate content). Competitor keyword gap analysis. Content opportunities showing keywords competitors rank for but you don\'t.',
  },
  {
    id: 'email-marketing',
    name: 'Email Marketing Platform',
    description: 'Campaign builder, audience segments, automation flows, and analytics',
    category: 'Marketing', framework: 'react-vite', emoji: '📧', complexity: 'complex',
    tags: ['email', 'campaigns', 'automation', 'marketing'],
    prompt: 'Build an email marketing platform dashboard with: overview stats (total subscribers, list growth %, avg open rate, avg CTR, revenue generated). Campaigns list with name, status badge (draft/scheduled/sent/paused), open rate, CTR, revenue. Campaign builder with subject line, preview text, from name, audience selector, and visual block editor placeholder. Audience segment builder with conditions (tags, behavior, demographics). Automation flow list (welcome series, cart abandonment, re-engagement) with on/off toggle and performance stats. A/B test results. Deliverability score and spam checker.',
  },
];

// ─── MANUFACTURING ───
const MANUFACTURING: Template[] = [
  {
    id: 'production-dashboard',
    name: 'Manufacturing Production Dashboard',
    description: 'Machine status, OEE, quality metrics, and production orders',
    category: 'Manufacturing', framework: 'react-vite', emoji: '⚙️', complexity: 'complex',
    tags: ['manufacturing', 'production', 'oee', 'quality'],
    prompt: 'Build a manufacturing production dashboard with: live machine status grid showing each machine with status (running-green, idle-yellow, maintenance-red), OEE %, current job, and output count. Production order tracker with order number, product, target quantity, produced, defects, completion %, and ETA. OEE breakdown cards (Availability, Performance, Quality) with trend charts. Shift summary comparing current vs target vs previous shift. Quality control section with defect rate chart by product and defect type breakdown. Downtime log with reason codes and duration. Energy consumption by machine.',
  },
  {
    id: 'quality-control',
    name: 'Quality Control System',
    description: 'Inspection checklists, defect tracking, NCR management, and audit trails',
    category: 'Manufacturing', framework: 'react-vite', emoji: '✅', complexity: 'advanced',
    tags: ['quality', 'inspection', 'defects', 'manufacturing'],
    prompt: 'Build a quality control system with: inspection queue showing batches awaiting QC with product, quantity, and inspector assigned. Digital inspection checklist with pass/fail/NA criteria, photo attachment placeholder, and digital sign-off. Defect log table with defect code, description, severity, batch, quantity affected, root cause, and corrective action. Non-conformance report (NCR) form and tracking board. Statistical process control charts (X-bar, R chart) for key measurements. Supplier quality scorecard with incoming inspection pass rates. CAPA (corrective and preventive action) tracker.',
  },
];

// ─── RETAIL ───
const RETAIL: Template[] = [
  {
    id: 'retail-pos',
    name: 'Retail POS System',
    description: 'Point of sale, product search, cart, payment, and receipts',
    category: 'Retail', framework: 'react-vite', emoji: '🛒', complexity: 'complex',
    tags: ['pos', 'retail', 'sales', 'payments'],
    prompt: 'Build a retail point-of-sale system with: product grid with category tabs, search bar, and product buttons showing name, price, and photo placeholder. Cart panel on right with item list, quantities (+/-), subtotals, and remove button. Order summary with subtotal, tax, discount code field, and total. Payment method buttons (Cash, Card, Split, Store Credit). Cash calculator for change due. Customer lookup with loyalty points balance. Receipt preview with print and email options. Open orders/layaway list. Shift summary with sales count, total, and payment method breakdown. Refund flow.',
  },
  {
    id: 'retail-analytics',
    name: 'Retail Analytics Dashboard',
    description: 'Sales performance, best sellers, inventory health, and customer insights',
    category: 'Retail', framework: 'react-vite', emoji: '🏪', complexity: 'advanced',
    tags: ['retail', 'analytics', 'sales', 'inventory'],
    prompt: 'Build a retail analytics dashboard with: key metrics (today\'s sales, transactions, average basket size, conversion rate, revenue vs target gauge). Sales trend chart by hour showing busy periods. Best selling products table with units sold, revenue, margin, and stock level. Category performance breakdown chart. Inventory health showing overstocked, healthy, low stock, and out-of-stock by category. Customer cohort analysis showing repeat vs new buyers. Staff performance by sales associate. Store comparison if multi-location. Return rate and reasons breakdown.',
  },
];

// ─── GOVERNMENT & NON-PROFIT ───
const GOVERNMENT: Template[] = [
  {
    id: 'citizen-portal',
    name: 'Citizen Services Portal',
    description: 'Government service applications, document tracking, and public information',
    category: 'Government', framework: 'react-vite', emoji: '🏛️', complexity: 'complex',
    tags: ['government', 'citizen', 'services', 'portal'],
    prompt: 'Build a citizen services portal with: home showing available services categorized (Licenses & Permits, Benefits, Tax, Business, Health, Housing). Service application form with multi-step wizard (personal info, documents upload, declaration, submit). Application status tracker with reference number lookup and timeline showing submitted/under review/approved/rejected stages. Document download center for certificates and permits. Public information pages with FAQs and office locations. Complaint/feedback submission form. Appointment booking for in-person visits. SMS notification settings. Accessible design with high contrast and font size controls.',
  },
  {
    id: 'nonprofit-dashboard',
    name: 'Nonprofit Management Dashboard',
    description: 'Donor management, campaign fundraising, volunteer coordination, and impact reports',
    category: 'Government', framework: 'react-vite', emoji: '❤️', complexity: 'complex',
    tags: ['nonprofit', 'donations', 'volunteers', 'fundraising'],
    prompt: 'Build a nonprofit management dashboard with: fundraising progress showing campaign goal, amount raised, donors count, and days remaining with animated progress bar. Donor list with name, total donated, last donation, frequency (one-time/monthly/annual), and outreach status. Campaign performance comparing multiple fundraising drives. Volunteer management with skills, availability, hours logged, and assigned programs. Program impact metrics (families served, meals distributed, students helped). Grant tracker with application status, amounts, and reporting deadlines. Thank you letter automation. Donor retention rate chart.',
  },
];

// ─── SECURITY & COMPLIANCE ───
const SECURITY: Template[] = [
  {
    id: 'security-operations',
    name: 'Security Operations Center (SOC)',
    description: 'Threat monitoring, incident tickets, alert triage, and compliance status',
    category: 'Security', framework: 'react-vite', emoji: '🔒', complexity: 'complex',
    tags: ['security', 'soc', 'incidents', 'threats'],
    prompt: 'Build a security operations center dashboard with: live threat map (placeholder with regions highlighted). Alert queue with severity badges (critical/high/medium/low), source, type, timestamp, and assign button. Incident management kanban (New/Investigating/Contained/Resolved). SIEM event log with event type, source IP, destination, rule triggered, and status. Vulnerability scanner results with CVE ID, severity, affected systems, and remediation status. Compliance scorecard showing framework status (SOC2, ISO27001, GDPR) with control pass rates. Threat intelligence feed. On-call roster. Use red/amber/green status system with dark theme.',
  },
  {
    id: 'compliance-tracker',
    name: 'Compliance Management Dashboard',
    description: 'Policy tracking, audit schedules, control testing, and risk register',
    category: 'Security', framework: 'react-vite', emoji: '📋', complexity: 'advanced',
    tags: ['compliance', 'risk', 'audit', 'governance'],
    prompt: 'Build a compliance management dashboard with: compliance score gauge by framework (GDPR, SOC 2, ISO 27001, HIPAA). Control library table with control ID, domain, description, owner, test frequency, last tested, and status (passed/failed/in-progress/not-tested). Risk register with risk description, likelihood, impact, risk score heat map, owner, and mitigation status. Audit schedule calendar with upcoming assessments and completion tracking. Policy document library with version, owner, review date, and acknowledgment rate. Issue tracker for failed controls with remediation deadlines. Evidence collection checklist.',
  },
];

// ─── DEVELOPER & DEVOPS ───
const DEVOPS: Template[] = [
  {
    id: 'ci-cd-dashboard',
    name: 'CI/CD Pipeline Dashboard',
    description: 'Build status, deployment history, test coverage, and release management',
    category: 'DevOps', framework: 'react-vite', emoji: '🔧', complexity: 'complex',
    tags: ['devops', 'ci/cd', 'deployments', 'builds'],
    prompt: 'Build a CI/CD pipeline dashboard with: pipeline health overview (builds today, pass rate, average duration, failed builds). Active pipelines showing repository, branch, trigger, stage progress bar, duration, and live status badge. Build history table with commit hash, author, branch, test results, duration, and status. Deployment tracker showing environment (dev/staging/prod) with current version, last deployed time, and deploy button. Test coverage trend chart by repository. Failed build details with error log snippet. Release notes generator from commit messages. Environment health checks.',
  },
  {
    id: 'api-monitoring',
    name: 'API Monitoring Dashboard',
    description: 'Endpoint health, latency, error rates, and usage analytics',
    category: 'DevOps', framework: 'react-vite', emoji: '📡', complexity: 'advanced',
    tags: ['api', 'monitoring', 'latency', 'devops'],
    prompt: 'Build an API monitoring dashboard with: uptime score with SLA achievement gauge. Endpoint health table showing path, method, avg latency, p99 latency, error rate, and status indicator. Response time trend chart (last 24h, 7d, 30d). Error rate breakdown by endpoint with error codes. Geographic response time heat map placeholder. API usage by consumer with request count and quota usage bar. Rate limit alerts panel. Recent incidents timeline with duration and impact. Webhook delivery success rate. API changelog with version comparison.',
  },
  {
    id: 'infrastructure-dashboard',
    name: 'Infrastructure Dashboard',
    description: 'Server health, resource utilization, costs, and alert management',
    category: 'DevOps', framework: 'react-vite', emoji: '🖥️', complexity: 'complex',
    tags: ['infrastructure', 'servers', 'cloud', 'monitoring'],
    prompt: 'Build an infrastructure monitoring dashboard with: resource health grid showing servers with CPU %, memory %, disk %, network I/O, and status indicator. Cost overview with monthly cloud spend by service (compute, storage, network, database) with bar chart. Alert manager showing active alerts by severity with acknowledge and resolve actions. Kubernetes cluster view with nodes, pods status, and resource requests vs limits. Auto-scaling events log. Performance comparison across environments. Budget vs actual spend trend. Top cost drivers table. Rightsizing recommendations panel.',
  },
];

// ─── SPORTS & FITNESS ───
const SPORTS: Template[] = [
  {
    id: 'sports-team-dashboard',
    name: 'Sports Team Management',
    description: 'Player roster, match schedule, performance stats, and training plans',
    category: 'Sports', framework: 'react-vite', emoji: '⚽', complexity: 'advanced',
    tags: ['sports', 'team', 'players', 'performance'],
    prompt: 'Build a sports team management dashboard with: squad roster with player photo placeholder, name, position, age, nationality, contract expiry, availability status (fit/injured/suspended). Match schedule calendar with opponent, venue, date, and result. Player statistics table with key metrics by position (goals, assists, minutes, rating). Training attendance tracker with session calendar and player attendance %. Injury log with player, injury type, recovery timeline, and return date. Formation/lineup builder with drag positions. Scouting reports for prospective players. Season performance chart.',
  },
  {
    id: 'gym-management',
    name: 'Gym Management System',
    description: 'Member management, class bookings, trainer assignments, and revenue',
    category: 'Sports', framework: 'react-vite', emoji: '💪', complexity: 'advanced',
    tags: ['gym', 'fitness', 'members', 'classes'],
    prompt: 'Build a gym management system with: member dashboard showing active memberships, trial expiries, and check-ins today. Member directory with search, membership type badge, expiry, and visit frequency. Class schedule grid with time slots, class name, trainer, capacity (enrolled/max), and book button. Trainer profiles with specialties, classes taught, and client count. Revenue dashboard with membership fees, personal training, class bookings, and retail. Attendance trend chart. Membership expiry alerts. New member onboarding checklist. Equipment maintenance log.',
  },
];

// ─── ADDITIONAL STARTER TEMPLATES ───
const STARTERS: Template[] = [
  {
    id: 'portfolio-dark',
    name: 'Developer Portfolio',
    description: 'Dark minimal portfolio with projects, skills, and contact',
    category: 'Personal', framework: 'react-vite', emoji: '👨‍💻', complexity: 'starter',
    tags: ['portfolio', 'personal', 'developer'],
    prompt: 'Build a stunning developer portfolio with: fullscreen dark hero with animated terminal typing effect showing name and role. About section with photo placeholder and bio. Skills section with technology logos/badges grouped by category (Frontend, Backend, Tools). Projects grid with screenshot placeholder, name, description, tech stack tags, live demo and GitHub links. Work experience timeline with company, role, dates, and achievements. Testimonials carousel. Contact section with form and social links. Smooth scroll navigation. Space Grotesk font throughout.',
  },
  {
    id: 'startup-landing',
    name: 'Startup Landing Page',
    description: 'Modern SaaS landing with hero, features, social proof, and pricing',
    category: 'Marketing', framework: 'react-vite', emoji: '🚀', complexity: 'starter',
    tags: ['landing', 'startup', 'saas', 'marketing'],
    prompt: 'Build a world-class SaaS landing page with: sticky nav with logo, links, and CTA. Hero with dot-grid background, badge pill, gradient Sora headline, subtitle, two CTA buttons, and stats row (3 metrics). Social proof logos bar (trusted by company logos). Features section with 3-column cards featuring icon, headline, and description. How it works section with numbered steps. Pricing section with 3 tiers (Free/Pro/Enterprise), monthly/annual toggle with savings badge, feature lists, and CTAs. Testimonials with avatar, name, role, and quote. FAQ accordion. Footer with columns. Use sky blue #0EA5E9 accent.',
  },
  {
    id: 'documentation-site',
    name: 'Product Documentation Site',
    description: 'Docs layout with sidebar navigation, search, code blocks, and API reference',
    category: 'Dev Tools', framework: 'react-vite', emoji: '📖', complexity: 'advanced',
    tags: ['docs', 'documentation', 'developer', 'api'],
    prompt: 'Build a product documentation site with: sidebar navigation with collapsible sections (Getting Started, Core Concepts, API Reference, Guides, Examples). Search bar with instant results. Main content area with markdown-style rendering including h1/h2/h3 headings, paragraphs, code blocks with syntax highlighting placeholder and copy button, info/warning/danger callout boxes, and tables. Breadcrumb navigation. Previous/next page navigation at bottom. On this page anchor links sidebar on right. Dark/light mode toggle. Version selector dropdown. Feedback widget at bottom of each page.',
  },
  {
    id: 'waitlist-landing',
    name: 'Waitlist Landing Page',
    description: 'Pre-launch page with email capture, countdown timer, and social sharing',
    category: 'Marketing', framework: 'react-vite', emoji: '⏳', complexity: 'starter',
    tags: ['waitlist', 'launch', 'landing', 'prelaunch'],
    prompt: 'Build a pre-launch waitlist landing page with: centered minimal layout on dark background. Logo and company name at top. Bold Sora headline announcing the product. Brief description paragraph. Email capture form with submit button and validation. Countdown timer to launch date (days, hours, minutes, seconds) with live countdown animation. Waitlist position display after signup ("You\'re #247 on the waitlist!"). Social sharing buttons with "Move up the list" incentive. Feature preview with 3 locked feature cards with blur overlay. Early bird pricing card. Referral link generator after signup.',
  },
];

// ─── MERGE ALL NEW TEMPLATES ───
const ALL_NEW_TEMPLATES = [
  ...HEALTHCARE, ...EDUCATION, ...REAL_ESTATE, ...LEGAL,
  ...LOGISTICS, ...HOSPITALITY, ...FINTECH, ...HR,
  ...MARKETING, ...MANUFACTURING, ...RETAIL, ...GOVERNMENT,
  ...SECURITY, ...DEVOPS, ...SPORTS, ...STARTERS,
];

// Append to TEMPLATE_GALLERY (remove the closing bracket first via re-export)
export const EXTENDED_GALLERY = [...TEMPLATE_GALLERY, ...ALL_NEW_TEMPLATES];
export const ALL_CATEGORIES = [...new Set(EXTENDED_GALLERY.map(t => t.category))].sort();
