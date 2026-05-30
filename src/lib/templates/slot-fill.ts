// Slot-fill system: maps every gallery template to a base skeleton + customization slots
// This powers instant load (skeleton) + fast domain customization (~10s AI call)

export type SkeletonKey =
  | 'saas-landing'
  | 'admin-dashboard'
  | 'crm'
  | 'kanban'
  | 'ecommerce'
  | 'portfolio'
  | 'invoice'
  | 'chat'
  | 'hr-dashboard'
  | 'real-estate'
  | 'restaurant'
  | 'banking'

export interface SlotFill {
  skeleton: SkeletonKey       // which prebuilt to load instantly
  accent: string              // hex color for the domain
  appName: string             // brand name in the UI
  navItems: string[]          // sidebar/nav labels
  stats: string[]             // stat card labels
  tableHeaders: string[]      // main table column headers
  entityName: string          // what is the main "thing" (patient, lead, property...)
  customPrompt: string        // focused AI prompt for domain customization
}

// The master map: template ID → slot-fill config
export const SLOT_FILLS: Record<string, SlotFill> = {

  // ─── HEALTHCARE ───────────────────────────────────────────────
  'patient-portal': {
    skeleton: 'admin-dashboard',
    accent: '#10b981',
    appName: 'PatientHub',
    navItems: ['Overview', 'Appointments', 'Records', 'Prescriptions', 'Messages'],
    stats: ['Upcoming Appointments', 'Active Prescriptions', 'Lab Results', 'Messages'],
    tableHeaders: ['Date', 'Doctor', 'Type', 'Status', 'Notes'],
    entityName: 'appointment',
    customPrompt: 'Customize for a patient health portal. Replace nav with: Overview, Appointments, Medical Records, Prescriptions, Lab Results, Messages. Replace stats with: Upcoming Appointments (3), Active Prescriptions (4), Recent Lab Results (2), Unread Messages (1). Replace table data with appointment history (doctor name, specialty, date, status). Change accent to #10b981 emerald. App name: PatientHub.',
  },
  'hospital-admin': {
    skeleton: 'admin-dashboard',
    accent: '#0EA5E9',
    appName: 'HospitalOS',
    navItems: ['Census', 'Beds', 'Staff', 'Pharmacy', 'Reports'],
    stats: ['Bed Occupancy', 'Patients Today', 'Staff On Duty', 'Avg LOS'],
    tableHeaders: ['Patient', 'Ward', 'Bed', 'Attending', 'Admission', 'Status'],
    entityName: 'patient',
    customPrompt: 'Customize for hospital administration. Replace nav with: Census, Bed Management, Staff, Pharmacy, Reports. Replace stats with: Bed Occupancy 87%, Patients Today 142, Staff On Duty 38, Avg LOS 4.2 days. Replace customer table with patient roster (name, ward, bed number, attending physician, admission date, status). App name: HospitalOS.',
  },
  'clinic-management': {
    skeleton: 'restaurant',
    accent: '#10b981',
    appName: 'ClinicFlow',
    navItems: ['Queue', 'Rooms', 'Schedule', 'Billing'],
    stats: ['Waiting', 'In Progress', 'Completed', 'Revenue Today'],
    tableHeaders: ['Patient', 'Doctor', 'Room', 'Wait Time', 'Status'],
    entityName: 'patient',
    customPrompt: 'Customize for clinic management. Replace Floor Plan with patient waiting room grid (chairs/rooms). Replace Order Board with today\'s appointment queue (patient name, doctor, room, wait time, status). Replace Menu with appointment types and pricing. App name: ClinicFlow. Accent #10b981.',
  },
  'telehealth-platform': {
    skeleton: 'saas-landing',
    accent: '#0EA5E9',
    appName: 'TeleDoc',
    navItems: ['Home', 'Doctors', 'How it Works', 'Pricing', 'For Providers'],
    stats: ['Doctors Available', 'Avg Wait Time', 'Consultations Done', 'Rating'],
    tableHeaders: ['Specialty', 'Doctor', 'Available', 'Rating', 'Price'],
    entityName: 'consultation',
    customPrompt: 'Customize for a telehealth platform. Change headline to "See a doctor in minutes, from anywhere". Change features to: Instant Video Calls, Board-Certified Doctors, Prescription Delivery, Medical Records, Insurance Accepted, 24/7 Availability. Change pricing to consultation plans. App name: TeleDoc.',
  },

  // ─── EDUCATION ────────────────────────────────────────────────
  'lms-dashboard': {
    skeleton: 'admin-dashboard',
    accent: '#f59e0b',
    appName: 'LearnHub',
    navItems: ['Dashboard', 'My Courses', 'Assignments', 'Grades', 'Calendar'],
    stats: ['Courses Enrolled', 'Assignments Due', 'Avg Grade', 'Study Streak'],
    tableHeaders: ['Course', 'Instructor', 'Progress', 'Next Due', 'Grade'],
    entityName: 'course',
    customPrompt: 'Customize for a student learning dashboard. Replace nav with: Dashboard, My Courses, Assignments, Grades, Calendar, Resources. Replace stats with: Courses Enrolled (6), Assignments Due (3), Average Grade (87%), Study Streak (12 days). Replace customer table with course progress table (course name, instructor, completion %, next assignment due, current grade). Accent #f59e0b amber. App name: LearnHub.',
  },
  'teacher-dashboard': {
    skeleton: 'admin-dashboard',
    accent: '#f59e0b',
    appName: 'ClassDesk',
    navItems: ['Overview', 'Students', 'Assignments', 'Grades', 'Attendance'],
    stats: ['Total Students', 'Assignments Graded', 'Class Average', 'At-Risk Students'],
    tableHeaders: ['Student', 'Attendance', 'Assignments', 'Avg Grade', 'Status'],
    entityName: 'student',
    customPrompt: 'Customize for a teacher dashboard. Replace nav with: Overview, Students, Assignments, Grade Book, Attendance, Reports. Replace stats with: Total Students (28), Assignments Graded (142), Class Average (84%), At-Risk Students (3). Replace table with student roster (name, attendance %, assignments submitted, average grade, status). Accent #f59e0b. App name: ClassDesk.',
  },
  'online-course-platform': {
    skeleton: 'ecommerce',
    accent: '#f59e0b',
    appName: 'CourseHub',
    navItems: ['Browse', 'My Learning', 'Instructors', 'Pricing'],
    stats: ['Courses', 'Instructors', 'Students', 'Rating'],
    tableHeaders: ['Course', 'Instructor', 'Duration', 'Students', 'Price'],
    entityName: 'course',
    customPrompt: 'Customize for an online course marketplace. Replace products with course cards (thumbnail, title, instructor, rating, students enrolled, price, bestseller badge). Replace cart with enrollment summary. Replace color selector with difficulty level selector (Beginner/Intermediate/Advanced). Accent #f59e0b. App name: CourseHub.',
  },
  'school-admin': {
    skeleton: 'hr-dashboard',
    accent: '#f59e0b',
    appName: 'SchoolAdmin',
    navItems: ['Overview', 'Students', 'Staff', 'Attendance', 'Fees'],
    stats: ['Total Students', 'Staff Count', 'Attendance Today', 'Fees Collected'],
    tableHeaders: ['Student', 'Class', 'Parent', 'Attendance', 'Fee Status'],
    entityName: 'student',
    customPrompt: 'Customize for school administration. Replace Overview with school stats (total students 847, staff 62, attendance today 94%, fees collected $48k). Replace Employees table with student directory (name, class, parent contact, attendance %, fee status). Replace Recruitment with fee management. App name: SchoolAdmin. Accent #f59e0b.',
  },

  // ─── REAL ESTATE ─────────────────────────────────────────────
  'property-management': {
    skeleton: 'admin-dashboard',
    accent: '#f59e0b',
    appName: 'PropManager',
    navItems: ['Portfolio', 'Tenants', 'Maintenance', 'Financials', 'Leases'],
    stats: ['Total Units', 'Occupancy Rate', 'Rent Collected', 'Open Requests'],
    tableHeaders: ['Property', 'Units', 'Occupancy', 'Rent Due', 'Status'],
    entityName: 'property',
    customPrompt: 'Customize for property management. Replace nav with: Portfolio, Tenants, Maintenance, Financials, Leases. Replace stats with: Total Units (124), Occupancy Rate (94%), Rent Collected ($87k), Open Maintenance (7). Replace table with property portfolio (property name, units, occupancy %, rent due, status). Accent #f59e0b. App name: PropManager.',
  },
  'real-estate-agent': {
    skeleton: 'crm',
    accent: '#f59e0b',
    appName: 'AgentCRM',
    navItems: ['Leads', 'Pipeline', 'Properties', 'Calendar'],
    stats: ['Active Leads', 'Showings This Week', 'Offers Pending', 'Closed MTD'],
    tableHeaders: ['Client', 'Budget', 'Requirements', 'Stage', 'Last Contact'],
    entityName: 'lead',
    customPrompt: 'Customize for a real estate agent CRM. Replace contacts with buyer/seller leads (name, budget, property requirements, stage). Replace pipeline stages with: New Lead, Contacted, Showing, Offer, Under Contract, Closed. Replace deal values with property prices. Replace contact detail with client property wish list and viewing history. Accent #f59e0b. App name: AgentCRM.',
  },

  // ─── LEGAL ───────────────────────────────────────────────────
  'law-firm-dashboard': {
    skeleton: 'admin-dashboard',
    accent: '#94a3b8',
    appName: 'LexDesk',
    navItems: ['Cases', 'Clients', 'Time & Billing', 'Documents', 'Calendar'],
    stats: ['Active Cases', 'Billable Hours MTD', 'Invoices Outstanding', 'New Matters'],
    tableHeaders: ['Case', 'Client', 'Type', 'Attorney', 'Next Deadline', 'Status'],
    entityName: 'case',
    customPrompt: 'Customize for a law firm dashboard. Replace nav with: Cases, Clients, Time & Billing, Documents, Deadlines. Replace stats with: Active Cases (47), Billable Hours MTD (312h), Invoices Outstanding ($84k), New Matters (8). Replace table with case list (case name, client, type, assigned attorney, next court date, status). Accent #94a3b8. App name: LexDesk.',
  },
  'contract-manager': {
    skeleton: 'admin-dashboard',
    accent: '#94a3b8',
    appName: 'ContractIQ',
    navItems: ['Contracts', 'Expiring Soon', 'Templates', 'Approvals'],
    stats: ['Active Contracts', 'Expiring in 30d', 'Pending Signatures', 'Total Value'],
    tableHeaders: ['Contract', 'Party', 'Value', 'Start Date', 'Expiry', 'Status'],
    entityName: 'contract',
    customPrompt: 'Customize for contract management. Replace nav with: All Contracts, Expiring Soon, Templates, Pending Approval. Replace stats with: Active Contracts (89), Expiring in 30 days (12), Pending Signatures (5), Total Value ($2.4M). Replace table with contract list (contract name, counterparty, value, start date, expiry date, status badge). Accent #94a3b8. App name: ContractIQ.',
  },

  // ─── LOGISTICS ────────────────────────────────────────────────
  'fleet-management': {
    skeleton: 'admin-dashboard',
    accent: '#f97316',
    appName: 'FleetOps',
    navItems: ['Fleet', 'Drivers', 'Trips', 'Maintenance', 'Fuel'],
    stats: ['Total Vehicles', 'Active On Road', 'Due for Service', 'Fuel Cost MTD'],
    tableHeaders: ['Vehicle', 'Driver', 'Status', 'Location', 'Fuel', 'Next Service'],
    entityName: 'vehicle',
    customPrompt: 'Customize for fleet management. Replace nav with: Fleet Overview, Drivers, Live Trips, Maintenance, Fuel Costs. Replace stats with: Total Vehicles (48), Active On Road (31), Due for Service (4), Fuel Cost MTD ($12,400). Replace table with vehicle list (vehicle ID, assigned driver, status badge, last location, fuel %, next service date). Accent #f97316 orange. App name: FleetOps.',
  },
  'shipment-tracker': {
    skeleton: 'admin-dashboard',
    accent: '#f97316',
    appName: 'ShipTrack',
    navItems: ['Shipments', 'In Transit', 'Exceptions', 'Analytics'],
    stats: ['Active Shipments', 'On Time Rate', 'Exceptions Today', 'Delivered MTD'],
    tableHeaders: ['Tracking #', 'Origin', 'Destination', 'Carrier', 'ETA', 'Status'],
    entityName: 'shipment',
    customPrompt: 'Customize for shipment tracking. Replace nav with: All Shipments, In Transit, Exceptions, Delivered, Analytics. Replace stats with: Active Shipments (284), On-Time Rate (94.2%), Exceptions Today (7), Delivered MTD (1,847). Replace table with shipment list (tracking number, origin city, destination city, carrier, estimated delivery, status badge). Accent #f97316. App name: ShipTrack.',
  },
  'warehouse-management': {
    skeleton: 'restaurant',
    accent: '#f97316',
    appName: 'WMS Pro',
    navItems: ['Bin Map', 'Inbound', 'Pick Orders', 'Inventory'],
    stats: ['Total SKUs', 'Orders Today', 'Utilization', 'Low Stock Alerts'],
    tableHeaders: ['SKU', 'Product', 'Bin', 'Qty', 'Reorder Point', 'Status'],
    entityName: 'item',
    customPrompt: 'Customize for warehouse management. Replace Floor Plan with bin/zone grid (zones A-F, color coded by utilization). Replace Orders with pick list queue (order ID, items, bin locations, picker assigned, status). Replace Menu with inventory catalog. App name: WMS Pro. Accent #f97316.',
  },

  // ─── HOSPITALITY ─────────────────────────────────────────────
  'hotel-pms': {
    skeleton: 'restaurant',
    accent: '#ec4899',
    appName: 'HotelOS',
    navItems: ['Rooms', 'Reservations', 'Housekeeping', 'Revenue'],
    stats: ['Occupied Rooms', 'Arrivals Today', 'Departures Today', 'ADR'],
    tableHeaders: ['Room', 'Guest', 'Check-in', 'Check-out', 'Rate', 'Status'],
    entityName: 'room',
    customPrompt: 'Customize for hotel property management. Replace Floor Plan with room grid (room numbers, color coded by status: available-green, occupied-blue, dirty-amber, maintenance-red). Replace Orders with today\'s arrivals and departures queue. Replace Menu with room types and rates. App name: HotelOS. Accent #ec4899.',
  },
  'travel-booking': {
    skeleton: 'saas-landing',
    accent: '#0EA5E9',
    appName: 'TravelAI',
    navItems: ['Flights', 'Hotels', 'Packages', 'My Trips', 'Support'],
    stats: ['Destinations', 'Airlines', 'Hotels', 'Happy Travelers'],
    tableHeaders: ['Destination', 'Dates', 'Travelers', 'Price', 'Status'],
    entityName: 'booking',
    customPrompt: 'Customize for a travel booking platform. Change headline to "Your next adventure, planned in seconds". Change features to: AI-Powered Itineraries, Best Price Guarantee, 500+ Airlines, 1M+ Hotels, 24/7 Support, Flexible Cancellation. Change pricing to subscription travel plans. App name: TravelAI.',
  },

  // ─── FINTECH ─────────────────────────────────────────────────
  'investment-portfolio-tracker': {
    skeleton: 'banking',
    accent: '#10b981',
    appName: 'InvestIQ',
    navItems: ['Portfolio', 'Watchlist', 'Markets', 'Analytics', 'Tax'],
    stats: ['Portfolio Value', 'Today\'s Gain', 'Total Return', 'Dividend Income'],
    tableHeaders: ['Ticker', 'Name', 'Shares', 'Avg Cost', 'Current', 'Gain/Loss'],
    entityName: 'holding',
    customPrompt: 'Customize for investment portfolio tracking. Replace Accounts with portfolio holdings table (ticker, company name, shares, average cost, current price, total gain/loss %). Replace Transactions with trade history (buy/sell). Replace Transfer with add funds / withdraw. Accent #10b981. App name: InvestIQ.',
  },
  'accounting-software': {
    skeleton: 'admin-dashboard',
    accent: '#10b981',
    appName: 'LedgerPro',
    navItems: ['Dashboard', 'Invoices', 'Expenses', 'Payroll', 'Reports'],
    stats: ['Revenue MTD', 'Expenses MTD', 'Net Profit', 'Outstanding Invoices'],
    tableHeaders: ['Invoice', 'Client', 'Amount', 'Issue Date', 'Due Date', 'Status'],
    entityName: 'invoice',
    customPrompt: 'Customize for accounting software. Replace nav with: P&L, Invoices, Expenses, Payroll, Tax, Reports. Replace stats with: Revenue MTD ($124k), Expenses ($67k), Net Profit ($57k), Outstanding Invoices ($34k). Replace table with invoice list (invoice number, client name, amount, issue date, due date, paid/overdue status). Accent #10b981. App name: LedgerPro.',
  },
  'payment-gateway-dashboard': {
    skeleton: 'admin-dashboard',
    accent: '#10b981',
    appName: 'PayFlow',
    navItems: ['Transactions', 'Disputes', 'Payouts', 'API Keys', 'Analytics'],
    stats: ['Volume Today', 'Success Rate', 'Failed Today', 'Avg Ticket'],
    tableHeaders: ['Transaction ID', 'Customer', 'Amount', 'Method', 'Country', 'Status'],
    entityName: 'transaction',
    customPrompt: 'Customize for a payment gateway dashboard. Replace nav with: Transactions, Disputes, Payouts, Webhooks, API Keys. Replace stats with: Volume Today ($284k), Success Rate (98.4%), Failed Transactions (12), Average Ticket ($127). Replace table with transaction log (ID, customer email, amount, payment method, country, status). Accent #10b981. App name: PayFlow.',
  },

  // ─── HR ───────────────────────────────────────────────────────
  'payroll-dashboard': {
    skeleton: 'hr-dashboard',
    accent: '#8b5cf6',
    appName: 'PayrollHQ',
    navItems: ['Payroll Run', 'Employees', 'Tax', 'Reports', 'Settings'],
    stats: ['Gross Payroll', 'Net Payroll', 'Tax Withheld', 'Employees Paid'],
    tableHeaders: ['Employee', 'Base Salary', 'Hours', 'Deductions', 'Net Pay', 'Status'],
    entityName: 'payslip',
    customPrompt: 'Customize for payroll management. Replace Overview stats with: Gross Payroll ($487k), Net Payroll ($334k), Tax Withheld ($98k), Employees Paid (247). Replace Employees table with payroll run table (employee name, base salary, hours worked, total deductions, net pay, payment status). Replace Recruitment with tax compliance calendar. Accent #8b5cf6. App name: PayrollHQ.',
  },
  'performance-management': {
    skeleton: 'hr-dashboard',
    accent: '#8b5cf6',
    appName: 'PerfPulse',
    navItems: ['Reviews', 'Goals', 'Feedback', 'Analytics', '1:1s'],
    stats: ['Reviews Complete', 'Goals On Track', 'Avg Rating', 'Feedback Given'],
    tableHeaders: ['Employee', 'Goals Complete', 'Rating', 'Manager', 'Review Due'],
    entityName: 'review',
    customPrompt: 'Customize for performance management. Replace Overview with review cycle stats. Replace Employees table with performance ratings table (employee, goals completed %, rating stars, manager, review due date). Replace Recruitment with OKR tracker (objectives and key results with progress bars). Accent #8b5cf6. App name: PerfPulse.',
  },

  // ─── MARKETING ────────────────────────────────────────────────
  'marketing-dashboard': {
    skeleton: 'admin-dashboard',
    accent: '#ef4444',
    appName: 'MarketPulse',
    navItems: ['Overview', 'Campaigns', 'Channels', 'Leads', 'Attribution'],
    stats: ['Total Spend', 'Leads Generated', 'CAC', 'Revenue Attributed'],
    tableHeaders: ['Channel', 'Spend', 'Clicks', 'Leads', 'CPL', 'ROI'],
    entityName: 'campaign',
    customPrompt: 'Customize for marketing analytics. Replace nav with: Overview, Campaigns, Channels, Leads, Attribution. Replace stats with: Total Spend ($48k), Leads Generated (2,847), CAC ($16.87), Revenue Attributed ($284k). Replace table with channel performance (Google, Facebook, LinkedIn, Email, Organic) with spend, clicks, leads, CPL, and ROI columns. Accent #ef4444. App name: MarketPulse.',
  },
  'social-media-dashboard': {
    skeleton: 'admin-dashboard',
    accent: '#ef4444',
    appName: 'SocialIQ',
    navItems: ['Overview', 'Posts', 'Analytics', 'Schedule', 'Audience'],
    stats: ['Total Followers', 'Avg Engagement', 'Posts This Month', 'Top Reach'],
    tableHeaders: ['Platform', 'Followers', 'Growth', 'Engagement', 'Best Post', 'Reach'],
    entityName: 'post',
    customPrompt: 'Customize for social media management. Replace nav with: Overview, Content Calendar, Analytics, Audience, Scheduling. Replace stats with: Total Followers (48.2k), Avg Engagement Rate (4.8%), Posts This Month (32), Top Post Reach (12.4k). Replace table with platform breakdown (Instagram, Twitter, LinkedIn, Facebook, TikTok) with followers, growth, engagement rate. Accent #ef4444. App name: SocialIQ.',
  },
  'seo-dashboard': {
    skeleton: 'admin-dashboard',
    accent: '#ef4444',
    appName: 'RankIQ',
    navItems: ['Overview', 'Keywords', 'Pages', 'Backlinks', 'Technical'],
    stats: ['Organic Sessions', 'Keywords Ranking', 'Avg Position', 'Backlinks'],
    tableHeaders: ['Keyword', 'Position', 'Change', 'Volume', 'Difficulty', 'URL'],
    entityName: 'keyword',
    customPrompt: 'Customize for SEO analytics. Replace nav with: Overview, Keyword Rankings, Top Pages, Backlinks, Technical Health. Replace stats with: Organic Sessions (48.2k), Keywords Ranking (1,247), Average Position (18.4), Total Backlinks (8,394). Replace table with keyword rankings (keyword, position, position change, search volume, difficulty score, landing page URL). Accent #ef4444. App name: RankIQ.',
  },
  'email-marketing': {
    skeleton: 'admin-dashboard',
    accent: '#ef4444',
    appName: 'MailFlow',
    navItems: ['Campaigns', 'Sequences', 'Subscribers', 'Templates', 'Analytics'],
    stats: ['Total Subscribers', 'Avg Open Rate', 'Avg Click Rate', 'Revenue Generated'],
    tableHeaders: ['Campaign', 'Sent', 'Open Rate', 'Click Rate', 'Conversions', 'Revenue'],
    entityName: 'campaign',
    customPrompt: 'Customize for email marketing platform. Replace nav with: Campaigns, Automation Sequences, Subscribers, Templates, Analytics. Replace stats with: Total Subscribers (24.8k), Avg Open Rate (32.4%), Avg Click Rate (4.8%), Revenue Generated ($48k). Replace table with campaign list (name, emails sent, open rate, click rate, conversions, revenue attributed). Accent #ef4444. App name: MailFlow.',
  },

  // ─── MANUFACTURING ────────────────────────────────────────────
  'production-dashboard': {
    skeleton: 'restaurant',
    accent: '#64748b',
    appName: 'FactoryOS',
    navItems: ['Shop Floor', 'Orders', 'Quality', 'Inventory'],
    stats: ['OEE Today', 'Units Produced', 'Defect Rate', 'Downtime'],
    tableHeaders: ['Machine', 'Status', 'Job', 'Target', 'Actual', 'OEE'],
    entityName: 'machine',
    customPrompt: 'Customize for manufacturing production. Replace Floor Plan with machine/station grid (color coded: running-green, idle-yellow, maintenance-red, offline-gray). Replace Orders with production order queue (order number, product, target qty, actual qty, defects, completion %). Replace Menu with production recipe/BOM. App name: FactoryOS. Accent #64748b.',
  },
  'quality-control': {
    skeleton: 'admin-dashboard',
    accent: '#64748b',
    appName: 'QualityIQ',
    navItems: ['Inspections', 'NCRs', 'Defect Log', 'CAPA', 'Audits'],
    stats: ['Pass Rate Today', 'Open NCRs', 'Defects This Week', 'CAPA Overdue'],
    tableHeaders: ['Batch', 'Product', 'Inspector', 'Pass/Fail', 'Defects', 'Disposition'],
    entityName: 'inspection',
    customPrompt: 'Customize for quality control management. Replace nav with: Inspections, Non-Conformance Reports, Defect Log, CAPA Tracker, Supplier Quality. Replace stats with: Pass Rate Today (97.2%), Open NCRs (8), Defects This Week (34), CAPA Overdue (2). Replace table with inspection log (batch ID, product, inspector, pass/fail badge, defect count, disposition). Accent #64748b. App name: QualityIQ.',
  },

  // ─── RETAIL ───────────────────────────────────────────────────
  'retail-analytics': {
    skeleton: 'admin-dashboard',
    accent: '#0EA5E9',
    appName: 'RetailIQ',
    navItems: ['Sales', 'Inventory', 'Customers', 'Products', 'Stores'],
    stats: ['Revenue Today', 'Transactions', 'Avg Basket', 'Conversion Rate'],
    tableHeaders: ['Product', 'SKU', 'Units Sold', 'Revenue', 'Margin', 'Stock'],
    entityName: 'product',
    customPrompt: 'Customize for retail analytics. Replace nav with: Sales Dashboard, Inventory, Customers, Products, Store Comparison. Replace stats with: Revenue Today ($48.2k), Transactions (847), Avg Basket Size ($56.90), Conversion Rate (3.2%). Replace table with bestseller products (name, SKU, units sold, revenue, margin %, stock level with alert badge). Accent #0EA5E9. App name: RetailIQ.',
  },

  // ─── GOVERNMENT / NONPROFIT ───────────────────────────────────
  'nonprofit-dashboard': {
    skeleton: 'admin-dashboard',
    accent: '#ec4899',
    appName: 'ImpactHQ',
    navItems: ['Dashboard', 'Donors', 'Campaigns', 'Programs', 'Volunteers'],
    stats: ['Funds Raised', 'Active Donors', 'Campaigns Running', 'Volunteers'],
    tableHeaders: ['Donor', 'Total Given', 'Last Gift', 'Frequency', 'Campaign', 'Status'],
    entityName: 'donor',
    customPrompt: 'Customize for nonprofit management. Replace nav with: Impact Dashboard, Donors, Fundraising Campaigns, Programs, Volunteers, Grants. Replace stats with: Funds Raised ($2.4M), Active Donors (8,472), Campaigns Running (4), Volunteers (284). Replace table with donor list (name, total donated, last gift date, frequency, assigned campaign, outreach status). Accent #ec4899. App name: ImpactHQ.',
  },
  'citizen-portal': {
    skeleton: 'saas-landing',
    accent: '#64748b',
    appName: 'CivicServe',
    navItems: ['Services', 'Applications', 'Payments', 'Documents', 'Contact'],
    stats: ['Services Available', 'Applications Processed', 'Avg Processing Time', 'Satisfaction'],
    tableHeaders: ['Service', 'Category', 'Processing Time', 'Fee', 'Availability'],
    entityName: 'application',
    customPrompt: 'Customize for a government citizen services portal. Change headline to "Government services, simplified". Change features to: Online Applications, Status Tracking, Secure Payments, Document Upload, Appointment Booking, 24/7 Access. Change CTA to "Access Your Services". App name: CivicServe. Use a professional, accessible design.',
  },

  // ─── SECURITY & DEVOPS ────────────────────────────────────────
  'security-operations': {
    skeleton: 'admin-dashboard',
    accent: '#ef4444',
    appName: 'SOC Central',
    navItems: ['Alerts', 'Incidents', 'Threats', 'Compliance', 'Assets'],
    stats: ['Active Alerts', 'Open Incidents', 'MTTR', 'Compliance Score'],
    tableHeaders: ['Alert', 'Severity', 'Source', 'Asset', 'Detected', 'Status'],
    entityName: 'alert',
    customPrompt: 'Customize for a security operations center. Replace nav with: Alert Queue, Incidents, Threat Intel, Vulnerability, Compliance, Assets. Replace stats with: Active Alerts (47), Open Incidents (8), MTTR 2.4 hours, Compliance Score 94%. Replace table with security alerts (alert name, severity badge critical/high/medium/low, source IP, affected asset, detection time, status). Accent #ef4444. App name: SOC Central.',
  },
  'compliance-tracker': {
    skeleton: 'admin-dashboard',
    accent: '#64748b',
    appName: 'ComplianceIQ',
    navItems: ['Controls', 'Risks', 'Audits', 'Policies', 'Evidence'],
    stats: ['Controls Passing', 'Open Risks', 'Audits Due', 'Policy Compliance'],
    tableHeaders: ['Control', 'Framework', 'Owner', 'Last Tested', 'Status', 'Evidence'],
    entityName: 'control',
    customPrompt: 'Customize for compliance management. Replace nav with: Control Library, Risk Register, Audit Schedule, Policy Management, Evidence Vault. Replace stats with: Controls Passing (847/892), Open Risks (23), Audits Due This Quarter (4), Policy Compliance 96%. Replace table with control list (control ID, framework tag, owner, last tested date, pass/fail/in-progress status). App name: ComplianceIQ.',
  },
  'ci-cd-dashboard': {
    skeleton: 'admin-dashboard',
    accent: '#0EA5E9',
    appName: 'PipelineHQ',
    navItems: ['Pipelines', 'Deployments', 'Tests', 'Environments', 'Releases'],
    stats: ['Builds Today', 'Pass Rate', 'Avg Duration', 'Deploys Today'],
    tableHeaders: ['Pipeline', 'Branch', 'Triggered By', 'Duration', 'Tests', 'Status'],
    entityName: 'build',
    customPrompt: 'Customize for CI/CD pipeline monitoring. Replace nav with: Pipelines, Deployments, Test Results, Environments, Release Management. Replace stats with: Builds Today (48), Pass Rate 94.2%, Avg Duration 4.2 min, Deploys Today (12). Replace table with pipeline runs (pipeline name, branch, triggered by, duration, test pass rate, status badge). Accent #0EA5E9. App name: PipelineHQ.',
  },
  'api-monitoring': {
    skeleton: 'admin-dashboard',
    accent: '#0EA5E9',
    appName: 'APIWatch',
    navItems: ['Endpoints', 'Alerts', 'Logs', 'Usage', 'Settings'],
    stats: ['Uptime', 'Avg Latency', 'Error Rate', 'Requests Today'],
    tableHeaders: ['Endpoint', 'Method', 'Avg Latency', 'P99', 'Error Rate', 'Status'],
    entityName: 'endpoint',
    customPrompt: 'Customize for API monitoring. Replace nav with: Endpoints, Alerts, Request Logs, Usage Analytics, Webhook Logs. Replace stats with: Uptime 99.97%, Avg Latency 124ms, Error Rate 0.3%, Requests Today 2.4M. Replace table with endpoint health (path, HTTP method badge, average latency, P99 latency, error rate %, up/down status). Accent #0EA5E9. App name: APIWatch.',
  },
  'infrastructure-dashboard': {
    skeleton: 'admin-dashboard',
    accent: '#0EA5E9',
    appName: 'InfraWatch',
    navItems: ['Servers', 'Kubernetes', 'Costs', 'Alerts', 'Logs'],
    stats: ['Servers Running', 'Avg CPU', 'Monthly Cost', 'Active Alerts'],
    tableHeaders: ['Server', 'CPU', 'Memory', 'Disk', 'Network', 'Status'],
    entityName: 'server',
    customPrompt: 'Customize for infrastructure monitoring. Replace nav with: Servers, Kubernetes, Cloud Costs, Alerts, Logs. Replace stats with: Servers Running (124), Avg CPU 42%, Monthly Cost $8.4k, Active Alerts 3. Replace table with server inventory (hostname, CPU %, memory %, disk %, network I/O, health status). Accent #0EA5E9. App name: InfraWatch.',
  },

  // ─── SPORTS & FITNESS ────────────────────────────────────────
  'sports-team-dashboard': {
    skeleton: 'hr-dashboard',
    accent: '#10b981',
    appName: 'TeamOS',
    navItems: ['Squad', 'Fixtures', 'Stats', 'Training', 'Scouting'],
    stats: ['Squad Size', 'Next Match', 'Win Rate', 'Goals Scored'],
    tableHeaders: ['Player', 'Position', 'Age', 'Availability', 'Rating', 'Contract'],
    entityName: 'player',
    customPrompt: 'Customize for sports team management. Replace Overview with squad stats. Replace Employees with player roster (name, position, age, availability status, performance rating, contract expiry). Replace Recruitment with scouting pipeline (prospects, assessment stage, recommendation). Accent #10b981. App name: TeamOS.',
  },
  'gym-management': {
    skeleton: 'hr-dashboard',
    accent: '#10b981',
    appName: 'GymOS',
    navItems: ['Members', 'Classes', 'Trainers', 'Revenue', 'Equipment'],
    stats: ['Active Members', 'Classes Today', 'Check-ins Today', 'Revenue MTD'],
    tableHeaders: ['Member', 'Plan', 'Joined', 'Last Visit', 'Classes Booked', 'Status'],
    entityName: 'member',
    customPrompt: 'Customize for gym management. Replace Overview with gym stats (active members 847, classes today 24, check-ins today 284, revenue MTD $48k). Replace Employees with member directory (name, membership plan, join date, last visit, classes booked, status). Replace Recruitment with class schedule (class name, trainer, time, capacity, bookings). Accent #10b981. App name: GymOS.',
  },

  // ─── STARTER / PERSONAL ──────────────────────────────────────
  'documentation-site': {
    skeleton: 'saas-landing',
    accent: '#0EA5E9',
    appName: 'DocsHub',
    navItems: ['Getting Started', 'API Reference', 'Guides', 'Examples', 'Changelog'],
    stats: ['Pages', 'API Endpoints', 'Code Examples', 'Last Updated'],
    tableHeaders: ['Endpoint', 'Method', 'Description', 'Auth', 'Rate Limit'],
    entityName: 'page',
    customPrompt: 'Customize for a product documentation site. Change headline to "Everything you need to build with [Product]". Change features to: Quick Start Guide, Full API Reference, Interactive Examples, SDKs for 8 Languages, Changelog, Community Forum. Change CTA to "Read the Docs". App name: DocsHub.',
  },
}

// Get the nearest skeleton for a template that has no direct slot-fill config
export function getNearestSkeleton(templateId: string, category: string): SkeletonKey {
  const categoryMap: Record<string, SkeletonKey> = {
    'Healthcare': 'admin-dashboard',
    'Education': 'admin-dashboard',
    'Fintech': 'banking',
    'Finance': 'banking',
    'HR': 'hr-dashboard',
    'Marketing': 'admin-dashboard',
    'Real Estate': 'real-estate',
    'Legal': 'admin-dashboard',
    'Logistics': 'admin-dashboard',
    'Hospitality': 'restaurant',
    'Manufacturing': 'restaurant',
    'Retail': 'ecommerce',
    'Government': 'saas-landing',
    'Security': 'admin-dashboard',
    'DevOps': 'admin-dashboard',
    'Sports': 'hr-dashboard',
    'SaaS': 'saas-landing',
    'Productivity': 'kanban',
    'E-commerce': 'ecommerce',
    'Business': 'admin-dashboard',
    'Communication': 'chat',
    'Personal': 'portfolio',
  }
  return categoryMap[category] ?? 'admin-dashboard'
}
