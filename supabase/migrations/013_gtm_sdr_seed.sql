-- GTM AI Employee templates — corrected schema (007_employee_platform.sql)
-- Columns: slug, name, emoji, role, department, tagline, description,
--          default_instructions, default_tools, kpis, popular

INSERT INTO public.employee_templates (slug, name, emoji, role, department, tagline, description, default_instructions, default_tools, kpis, popular)
VALUES (
  'gtm-sdr',
  'GTM SDR',
  '👤',
  'Sales Development Representative',
  'Sales',
  'Wakes up at 7 AM to surface hot leads and draft follow-ups from your GTM inbox.',
  'Monitors your GTM inbox every morning, scores leads by signal strength (replied = HOT, opened 3x = WARM, no activity 7d = COLD), drafts personalised follow-ups for each hot lead, and delivers a clean morning briefing — so you wake up to a prioritised hit list, not a cluttered inbox.',
  'Every morning: 1) Check gtm_analytics_events for replies, 3x opens, link clicks, and completed calls from the last 24 hours. 2) Score leads: Replied = HOT, Opened 3x without reply = WARM, Clicked link = WARM, No activity 7 days = COLD. 3) For each HOT/WARM lead, draft a personalised 3-sentence follow-up referencing their specific signal. Never pitch — surface signal only. 4) Report: 🔥 HOT leads (N), 🌡️ WARM leads (N), 📭 sequences needing attention, ✉️ drafts ready in GTM inbox.',
  ARRAY['GMAIL','HUBSPOT','SLACK'],
  '[{"name":"Hot Leads Surfaced","description":"Leads flagged as HOT (replied or strong signal)","unit":"leads","target":5},{"name":"Follow-ups Drafted","description":"Personalised follow-up emails drafted","unit":"emails","target":10},{"name":"Response Rate","description":"% of follow-ups that receive a reply","unit":"%","target":20}]',
  true
),
(
  'gtm-analyst',
  'GTM Analyst',
  '📊',
  'Growth Analyst',
  'Sales',
  'Sends a weekly GTM performance digest every Monday at 9 AM.',
  'Runs weekly GTM performance reports covering open rates, reply rates, calls booked, and meetings set. Identifies what is working and what to cut, then sends a clean Monday morning digest.',
  'Every Monday at 9 AM produce a GTM weekly report: 1) CAMPAIGN PERFORMANCE for each active campaign — emails sent, open rate %, reply rate %, calls made, meetings booked, compare to prior week, flag <5% open rate (deliverability?) or >20% reply rate (scale this!). 2) LEAD PIPELINE — new leads added, status breakdown (new→contacted→replied→meeting→closed), avg time from first touch to reply, top converting lead source. 3) RECOMMENDATIONS (max 3) — what to double down on, what to pause, one experiment for this week. Format: clean markdown, emoji bullets (🔥 ✅ ⚠️), executive summary first.',
  ARRAY['GMAIL','SLACK','HUBSPOT'],
  '[{"name":"Campaigns Reviewed","description":"Active campaigns analysed in the report","unit":"campaigns","target":5},{"name":"Insights Generated","description":"Actionable recommendations produced","unit":"insights","target":3},{"name":"Report Delivered","description":"Weekly report sent on time","unit":"reports","target":1}]',
  false
)
ON CONFLICT (slug) DO UPDATE SET
  description        = EXCLUDED.description,
  default_instructions = EXCLUDED.default_instructions,
  tagline            = EXCLUDED.tagline;
