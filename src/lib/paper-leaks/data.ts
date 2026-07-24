// Curated, source-checked dataset of documented exam paper-leak / exam-integrity
// incidents in India. Compiled via web research against published news coverage
// — every entry links at least one real, resolvable source. This is NOT a
// scrape and is NOT exhaustive: it covers well-documented, significant cases
// where multiple reputable outlets reported consistent facts. Summaries and
// outcomes are paraphrased, never copied from source articles.
//
// Deliberately excluded: any breakdown by political party, and any naming of
// individuals based on unproven or single-source allegations. Named
// individuals appear only when a court outcome (conviction/sentencing) is
// itself the reported fact.

export type IncidentStatus =
  | 'alleged'
  | 'fir_filed'
  | 'chargesheeted'
  | 'court_case_ongoing'
  | 'convicted'
  | 'acquitted'
  | 'case_closed_no_action'

export interface Source {
  title: string
  url: string
  outlet: string
}

export interface PaperLeakIncident {
  id: string
  examName: string
  year: number
  state: string // or 'National'
  category: string
  conductingBody: string
  summary: string
  outcome: string
  status: IncidentStatus
  sources: Source[]
  /** Reported human/social impact (injuries, deaths, suicides) beyond the legal outcome.
   * Included ONLY where multiple reputable outlets documented a specific, attributable
   * toll for THIS incident — never estimated or extrapolated. Most incidents have none
   * on record and omit this field entirely. */
  impact?: string
}

export const STATUS_LABELS: Record<IncidentStatus, string> = {
  alleged: 'Alleged',
  fir_filed: 'FIR Filed',
  chargesheeted: 'Chargesheeted',
  court_case_ongoing: 'Court Case Ongoing',
  convicted: 'Convicted',
  acquitted: 'Acquitted',
  case_closed_no_action: 'Case Closed — No Leak Confirmed',
}

export const PAPER_LEAK_INCIDENTS: PaperLeakIncident[] = [
  {
    id: 'rrb-asm-2002',
    examName: 'Probationary Assistant Station Master Recruitment Exam',
    year: 2002,
    state: 'Gujarat',
    category: 'Recruitment — Railways',
    conductingBody: 'Railway Recruitment Board',
    summary: 'The question paper for a Railway Recruitment Board exam scheduled for August 18, 2002 was leaked in advance, with officials allegedly accepting money from candidates in exchange for it. CBI registered a case the day before the exam.',
    outcome: 'After a 23-year investigation and trial, a special court convicted eight former railway officials in 2025, sentencing each to five years imprisonment plus a fine. A ninth accused died during the trial.',
    status: 'convicted',
    sources: [
      { title: 'Exam paper leak: 23 years on, eight former Railway officials get five-year imprisonment', url: 'https://news.careers360.com/exam-paper-leak-23-years-on-eight-former-railway-officials-get-five-year-imprisonment', outlet: 'Careers360' },
    ],
  },
  {
    id: 'aipmt-2015',
    examName: 'All India Pre-Medical Test (AIPMT)',
    year: 2015,
    state: 'National',
    category: 'Medical Entrance',
    conductingBody: 'CBSE',
    summary: 'Question papers and answer keys for the AIPMT were leaked and circulated before the exam, affecting an exam that over 630,000 candidates take annually for around 3,800 medical seats nationwide.',
    outcome: "India's Supreme Court cancelled the entire exam over integrity concerns and ordered a fresh nationwide test to be held within four weeks, prioritizing exam integrity over the disruption a re-test would cause.",
    status: 'fir_filed',
    sources: [
      { title: 'India Scraps National Pre-Medical Exam Over Cheating Concerns', url: 'https://time.com/3922392/aipmt-india-medical-entrance-test-canceled/', outlet: 'TIME' },
    ],
  },
  {
    id: 'vyapam-mp',
    examName: 'Vyapam (Pre-Medical Test and multiple recruitment exams)',
    year: 2013,
    state: 'Madhya Pradesh',
    category: 'Medical Entrance / Recruitment',
    conductingBody: 'Madhya Pradesh Professional Examination Board (Vyapam)',
    summary: 'A long-running scheme involving impersonation, rigging, and manipulation across multiple entrance and recruitment exams conducted by the state examination board came to light in 2013, eventually implicated officials, middlemen, and candidates across numerous exam cycles going back years.',
    outcome: "The Supreme Court transferred the investigation to the CBI in 2015. Over the following decade, multiple special CBI courts delivered separate convictions — including sentences of three, five, and seven years' rigorous imprisonment in different cases — with the most recent batch of ten convictions handed down in December 2025.",
    status: 'convicted',
    sources: [
      { title: 'Vyapam scam: Indore CBI court sentences 10 people to five years of rigorous imprisonment', url: 'https://www.indiatvnews.com/madhya-pradesh/vyapam-scam-indore-cbi-court-sentences-10-people-to-five-years-of-rigorous-imprisonment-2025-12-16-1022018', outlet: 'India TV' },
      { title: 'Vyapam case: five get seven years in jail for rigging 2009 pre-medical test', url: 'https://www.deccanherald.com/india/vyapam-case-five-get-seven-years-in-jail-for-rigging-2009-pre-medical-test-1131562.html', outlet: 'Deccan Herald' },
    ],
  },
  {
    id: 'ssc-cgl-2017',
    examName: 'SSC Combined Graduate Level (CGL)',
    year: 2017,
    state: 'National',
    category: 'Recruitment — Central Government',
    conductingBody: 'Staff Selection Commission',
    summary: 'Answer keys and question content for the SSC CGL Tier-2 exam circulated online before and during the exam window, triggering large protests from job aspirants and a Supreme Court-monitored CBI probe.',
    outcome: 'The Supreme Court permitted SSC to declare results of a re-examination conducted in March 2018. The CBI case has continued in Delhi courts for years since; as of 2024 the court was still hearing procedural matters in the case.',
    status: 'court_case_ongoing',
    sources: [
      { title: 'SSC paper leak: SC directs CBI to file case diary, status report', url: 'https://www.business-standard.com/article/pti-stories/ssc-paper-leak-sc-directs-cbi-to-file-case-diary-status-report-119040900527_1.html', outlet: 'Business Standard' },
      { title: 'SSC CGL paper leak case: Delhi court junks plea to summon 2 witnesses as accused', url: 'https://news.careers360.com/ssc-cgl-paper-leak-case-delhi-court-junks-cbi-plea-for-summoning-2-witnesses-accused', outlet: 'Careers360' },
    ],
  },
  {
    id: 'cbse-2018',
    examName: 'CBSE Class 10 Mathematics & Class 12 Economics Board Exams',
    year: 2018,
    state: 'National',
    category: 'School Board',
    conductingBody: 'CBSE',
    summary: 'The Class 10 Mathematics and Class 12 Economics question papers were leaked and circulated over WhatsApp shortly before the respective exams.',
    outcome: 'Delhi Police registered cases and formed a Special Investigation Team; a teacher and two school employees were arrested. CBSE re-conducted the Class 12 Economics exam, but decided against a Class 10 Maths re-test after evaluation showed no clear sign of widespread benefit from the leak.',
    status: 'fir_filed',
    sources: [
      { title: "CBSE Paper Leak 2018: 'Class 10 Maths, Class 12 Economics Paper Were Leaked by Delhi-based Tutor'", url: 'https://www.india.com/education/cbse-paper-leak-2018-class-10-maths-class-12-economics-papers-were-leaked-by-delhi-based-tutor-2969635/', outlet: 'India.com' },
      { title: 'CBSE Paper Leak: NO Re-Test of Class 10 Maths', url: 'https://news.careers360.com/cbse-paper-leak-no-re-test-class-10-maths/amp', outlet: 'Careers360' },
    ],
  },
  {
    id: 'uptet-2021',
    examName: 'Uttar Pradesh Teacher Eligibility Test (UPTET)',
    year: 2021,
    state: 'Uttar Pradesh',
    category: 'Recruitment — Teacher Eligibility',
    conductingBody: 'UP Examination Regulatory Authority',
    summary: 'The exam, taken by roughly 21 lakh candidates, was called off just hours before it was due to start after the question paper was found circulating.',
    outcome: 'The state government cancelled the exam and ordered it to be conducted afresh.',
    status: 'alleged',
    sources: [
      { title: 'List of major paper leaks in India in the last 10 years', url: 'https://www.deccanherald.com/india/list-of-major-paper-leaks-in-india-in-the-last-10-years-2-3078693', outlet: 'Deccan Herald' },
    ],
  },
  {
    id: 'reet-2021',
    examName: 'Rajasthan Eligibility Examination for Teachers (REET)',
    year: 2021,
    state: 'Rajasthan',
    category: 'Recruitment — Teacher Eligibility',
    conductingBody: 'Board of Secondary Education, Rajasthan',
    summary: "The question paper leaked two days before the exam, reportedly originating from within the state Education Department's own building in Jaipur. The state's Special Operations Group arrested around 40 people, including police constables and an alleged mastermind.",
    outcome: "The state government cancelled the Level-2 exam and ordered it re-conducted for an expanded 62,000 posts. The Board chairman was dismissed. The Enforcement Directorate continued making arrests in the case as recently as 2024.",
    status: 'court_case_ongoing',
    sources: [
      { title: "REET 2021: Key accused in REET paper leak case arrested, say Rajasthan Police", url: 'https://news.careers360.com/reet-2021-paper-leak-key-accused-in-reet-paper-leak-case-arrested-cbi-rajasthan-police/amp', outlet: 'Careers360' },
      { title: 'ED makes 3rd arrest in Rajasthan teachers exam 2021 paper leak case', url: 'https://www.deccanherald.com/india/rajasthan/ed-makes-3rd-arrest-in-rajasthan-teachers-exam-2021-paper-leak-case-3113869', outlet: 'Deccan Herald' },
    ],
  },
  {
    id: 'hssc-2021',
    examName: 'Haryana Police Constable Recruitment Exam',
    year: 2021,
    state: 'Haryana',
    category: 'Recruitment — Police',
    conductingBody: 'Haryana Staff Selection Commission (HSSC)',
    summary: 'A printing-press employee copied the exam onto a pen drive days before the test, and it circulated among candidates for a price.',
    outcome: 'HSSC cancelled the exam. A Kaithal police special investigation team has continued making arrests in the case for years afterward — six initially, 68 within five months, 100 within ten months, and 167 total by 2025.',
    status: 'court_case_ongoing',
    sources: [
      { title: 'HSSC paper leak: Assistant clerk of 5th Battalion in Haryana Police Academy arrested', url: 'https://www.tribuneindia.com/news/haryana/asst-clerk-of-5th-battalion-arrested-361085', outlet: 'The Tribune' },
      { title: 'Haryana Police Recruitment Exam Paper Leak: Kaithal CIA Continues Crackdown', url: 'https://studyriserr.com/news/haryana-police-recruitment-exam-paper-leak', outlet: 'StudyRiser' },
    ],
  },
  {
    id: 'uksssc-2022',
    examName: 'Graduate-Level Recruitment Exam',
    year: 2022,
    state: 'Uttarakhand',
    category: 'Recruitment — State Government',
    conductingBody: 'Uttarakhand Subordinate Services Selection Commission (UKSSSC)',
    summary: 'A recruitment exam paper was leaked, leading to statewide protests from job aspirants demanding a CBI probe and cancellation.',
    outcome: 'Multiple arrests followed, and the state subsequently passed the Uttarakhand Competitive Examination Act, 2023, an anti-cheating law with strict penalties for future exam fraud.',
    status: 'fir_filed',
    sources: [
      { title: 'List of major paper leaks in India in the last 10 years', url: 'https://www.deccanherald.com/india/list-of-major-paper-leaks-in-india-in-the-last-10-years-2-3078693', outlet: 'Deccan Herald' },
    ],
  },
  {
    id: 'gpssb-2023',
    examName: 'Junior Clerk Recruitment Exam',
    year: 2023,
    state: 'Gujarat',
    category: 'Recruitment — State Government',
    conductingBody: 'Gujarat Panchayat Service Selection Board (GPSSB)',
    summary: 'The exam, for which 9.5 lakh candidates had registered across nearly 3,000 centres, was cancelled hours before it was due to start after the paper leaked.',
    outcome: "The state's Anti-Terrorism Squad investigated and arrested 19 people, two of them traced to Kolkata. The state government subsequently passed a law setting up to 10 years' imprisonment and a minimum ₹1 crore fine for organized exam-paper leaks.",
    status: 'chargesheeted',
    sources: [
      { title: 'Gujarat Junior Clerk Exam 2023: GPSSB Postpones Examination After Paper Leak', url: 'https://www.latestly.com/india/news/gujarat-junior-clerk-exam-2023-gpssb-postpones-exam-after-paper-leak-15-suspects-detained-4769324.html', outlet: 'LatestLY' },
      { title: 'Gujarat Exam Paper Leak: Two held from Kolkata, number of arrests rises to 19', url: 'https://news.careers360.com/gujarat-exam-paper-leak-news-two-held-from-kolkata-number-of-arrests-rises-19/amp', outlet: 'Careers360' },
    ],
  },
  {
    id: 'tspsc-2023',
    examName: 'Group 1 Prelims, Assistant Engineer & related exams',
    year: 2023,
    state: 'Telangana',
    category: 'Recruitment — State Government',
    conductingBody: 'Telangana State Public Service Commission (TSPSC)',
    summary: 'A Commission staff member colluded with a network administrator to access and copy confidential exam papers, which were then sold to candidates for money. Multiple exams — Group 1 Prelims, Assistant Engineer, Assistant Executive Engineer, and Divisional Accounts Officer — were affected across late 2022 and early 2023.',
    outcome: "A special investigation team traced the breach to weak cybersecurity around the Commission's confidential systems. Twelve people were arrested. All four affected exams were cancelled and re-scheduled.",
    status: 'chargesheeted',
    sources: [
      { title: 'TSPSC Paper Leak: Group 1 Prelims, AEE, DAO exams cancelled', url: 'https://www.thehansindia.com/amp/telangana/tspsc-paper-leak-group-1-prelims-aee-dao-exams-cancelled-788388', outlet: 'The Hans India' },
      { title: 'Explained: How did the Telangana recruitment paper leak?', url: 'https://www.thenewsminute.com/telangana/explained-how-did-telangana-recruitment-paper-leak-174589', outlet: 'The News Minute' },
    ],
  },
  {
    id: 'jssc-cgl-2024',
    examName: 'Combined Graduate Level (CGL) Exam',
    year: 2024,
    state: 'Jharkhand',
    category: 'Recruitment — State Government',
    conductingBody: 'Jharkhand Staff Selection Commission (JSSC)',
    summary: "A general-knowledge paper for one exam shift was cancelled in January 2024 after answers were found circulating on WhatsApp. The exam was postponed and re-conducted in September, but fresh leak complaints followed even after the retest.",
    outcome: 'The Jharkhand High Court stayed publication of the exam results in December 2024 and ordered an FIR to be registered under the state Examination Conducting Act.',
    status: 'court_case_ongoing',
    sources: [
      { title: 'JSSC Paper Leak 2024: Exam Cancelled', url: 'https://dataconomy.com/2024/01/29/the-jssc-exam-has-been-canceled-due-to-a-leak/', outlet: 'Dataconomy' },
      { title: "JSSC CGL Exam 'Paper Leak': Jharkhand High Court Stays Publication of Results", url: 'https://www.latestly.com/india/news/jssc-cgl-exam-paper-leak-jharkhand-high-court-stays-publication-of-combined-graduate-level-2023-exam-results-until-further-notice-orders-fir-on-complaint-6497979.html', outlet: 'LatestLY' },
    ],
  },
  {
    id: 'up-police-2024',
    examName: 'Police Constable Recruitment Exam',
    year: 2024,
    state: 'Uttar Pradesh',
    category: 'Recruitment — Police',
    conductingBody: 'UP Police Recruitment and Promotion Board',
    summary: 'The exam, taken by more than 48 lakh candidates across two days in February, was cancelled following paper-leak allegations.',
    outcome: 'The state government ordered a Special Task Force investigation, replaced the recruitment board\'s chairperson, and conducted a re-exam over five days in August. Results and the final selection list followed months later.',
    status: 'court_case_ongoing',
    sources: [
      { title: 'UP Constable paper leak case: UP Govt removes state police recruitment board chairperson', url: 'https://news.careers360.com/up-constable-paper-leak-case-police-govt-removes-state-police-recruitment-board-chairperson/amp', outlet: 'Careers360' },
    ],
  },
  {
    id: 'ugc-net-2024',
    examName: 'UGC National Eligibility Test (NET)',
    year: 2024,
    state: 'National',
    category: 'Academic — Eligibility Test',
    conductingBody: 'National Testing Agency (NTA)',
    summary: "A day after over 9 lakh candidates sat the exam, the government cancelled it, citing inputs that the paper had leaked onto the darknet and was circulating on Telegram.",
    outcome: 'A CBI investigation later found the circulating "leaked paper" was a doctored screenshot, and the agency filed a closure report stating there was no evidence an actual leak occurred. The exam was re-conducted on fresh dates.',
    status: 'case_closed_no_action',
    sources: [
      { title: 'UGC-NET 2024 Row: Evidence Suggesting \'Paper Leak\' Was Doctored, Reveals CBI Probe', url: 'https://www.republicworld.com/india/ugc-net-2024-row-evidence-suggesting-paper-leak-was-doctored-reveals-cbi-probe', outlet: 'Republic World' },
    ],
  },
  {
    id: 'neet-ug-2024',
    examName: 'NEET-UG (National Eligibility cum Entrance Test)',
    year: 2024,
    state: 'National',
    category: 'Medical Entrance',
    conductingBody: 'National Testing Agency (NTA)',
    summary: 'Bihar Police uncovered a leak of the exam paper in May 2024, tracing it to a school in Hazaribagh, Jharkhand. The CBI took over the investigation the following month.',
    outcome: 'The CBI arrested 14 people, including a school principal and vice-principal. The Supreme Court declined to order a full nationwide re-examination, finding evidence indicated only around 155 students had directly benefited from the leak. One individual investigated as an alleged key figure in the case received a CBI clean chit for lack of evidence.',
    status: 'chargesheeted',
    impact: 'Multiple outlets reported a wave of suicides among NEET aspirants in the weeks after the leak and cancellation controversy, including several within a 48-hour span in May 2024, across states including Gujarat, Tamil Nadu, Rajasthan, Delhi, UP, Uttarakhand, Maharashtra, and Karnataka. Advocacy groups have since called for compensation for affected families. The broader student anger this case helped trigger continued into a nationwide protest movement over exam integrity that was still active in July 2026: reporting from that period documents more than 20 suicides nationally linked to exam-fraud grievances and more than 100 people injured when police used tear gas and batons against demonstrators marching in Delhi. If you or someone you know is struggling, India’s KIRAN mental health helpline is available 24/7 at 1800-599-0019.',
    sources: [
      { title: 'Chronology of events in NEET-UG 2024 case', url: 'https://news.careers360.com/chronology-of-events-in-neet-ug-2024-case/amp', outlet: 'Careers360' },
      { title: '2026 NEET controversy', url: 'https://en.wikipedia.org/wiki/2026_NEET_controversy', outlet: 'Wikipedia' },
      { title: 'NEET Paper Leak, NTA Failures and Student Suicides', url: 'https://www.thequint.com/news/education/neet-paper-leak-student-suicides-examination-crisis-india', outlet: 'The Quint' },
      { title: 'India: Crackdown on peaceful protesters in New Delhi raises serious human rights concerns', url: 'https://www.amnesty.org/en/latest/news/2026/07/india-crackdown-on-peaceful-protesters-in-new-delhi-raises-serious-human-rights-concerns/', outlet: 'Amnesty International' },
      { title: "India's Modi promises fast-track courts for exam fraud fuelling protests", url: 'https://www.aljazeera.com/news/2026/7/23/indias-modi-promises-fast-track-courts-for-exam-fraud-fuelling-protests', outlet: 'Al Jazeera' },
    ],
  },
  {
    id: 'bpsc-70th-2024',
    examName: '70th Combined Competitive Examination (CCE) Prelims',
    year: 2024,
    state: 'Bihar',
    category: 'Recruitment — Civil Services',
    conductingBody: 'Bihar Public Service Commission (BPSC)',
    summary: "Candidates alleged a paper leak at one exam centre in Patna on December 13, 2024, and staged large protests demanding the entire state exam be voided — a demonstration that continued for hours and led to a police lathi-charge.",
    outcome: "BPSC investigated and stated it found no evidence of a leak, declining to cancel the exam statewide. It ordered a re-exam only for the roughly 12,000 candidates assigned to the one affected centre. Final results were later declared with no leak confirmed.",
    status: 'case_closed_no_action',
    sources: [
      { title: 'BPSC 70th CCE Prelims 2024 leaked at Patna centre, allege candidates; stage protest', url: 'https://news.careers360.com/bpsc-paper-leak-news-70th-cce-prelims-2024-leaked-patna-centre-candidates-protest-patna-dm-slaps-aspirant-viral-video-twitter/amp', outlet: 'Careers360' },
      { title: 'BPSC 70th CCE result 2025 likely today; paper leak, court case, action against candidates, story so far', url: 'https://news.careers360.com/bpsc-70th-cce-prelims-result-2025-likely-today-paper-leak-protests-court-case-action-against-candidates-politicians-story-so-far/amp', outlet: 'Careers360' },
    ],
  },
  {
    id: 'uksssc-2025',
    examName: 'Graduate-Level Recruitment Exam',
    year: 2025,
    state: 'Uttarakhand',
    category: 'Recruitment — State Government',
    conductingBody: 'Uttarakhand Subordinate Services Selection Commission (UKSSSC)',
    summary: 'Pages from a graduate-level recruitment exam held on September 21, 2025 were allegedly leaked, sparking fresh statewide protests from job aspirants demanding a CBI probe.',
    outcome: 'Police arrested an alleged mastermind in Haridwar days later, along with associates accused of demanding ₹12–15 lakh from candidates for guaranteed selection. The state government formed a Special Investigation Team and said it would act under its 2023 anti-cheating law.',
    status: 'fir_filed',
    sources: [
      { title: 'UKSSSC Paper Leak: Main accused Khalid Malik arrested in Haridwar', url: 'https://news.careers360.com/uksssc-paper-leak-main-accused-khalid-malik-arrested-in-haridwar/amp', outlet: 'Careers360' },
    ],
  },
  {
    id: 'uppcs-prelims-2015',
    examName: 'UP Provincial Civil Services (PCS) Preliminary Exam',
    year: 2015,
    state: 'Uttar Pradesh',
    category: 'Recruitment — Civil Services',
    conductingBody: 'Uttar Pradesh Public Service Commission (UPPSC)',
    summary: 'The question paper leaked on WhatsApp around 9:15am on March 29, 2015, shortly before the exam began, matching the official paper. Roughly 4.5 lakh candidates had registered across 917 centres statewide.',
    outcome: 'The state government cancelled the exam and the UP Special Task Force arrested three people. Student protests over the leak turned violent in Allahabad, with vehicles vandalized and a bus set alight near Allahabad University.',
    status: 'fir_filed',
    sources: [
      { title: 'UPPCS exam cancelled after paper leak, three arrested', url: 'https://www.tribuneindia.com/news/archive/nation/uppcs-exam-cancelled-after-paper-leak-60480', outlet: 'The Tribune' },
      { title: 'UPPCS leak: Students demand quashing of both papers', url: 'https://www.business-standard.com/article/pti-stories/uppcs-leak-students-demand-quashing-of-both-papers-cbi-115040100874_1.html', outlet: 'Business Standard' },
    ],
  },
  {
    id: 'kpsc-fda-2021',
    examName: 'First Division Assistant (FDA) Recruitment Exam',
    year: 2021,
    state: 'Karnataka',
    category: 'Recruitment — State Government',
    conductingBody: 'Karnataka Public Service Commission (KPSC)',
    summary: 'A question paper for an exam meant to fill 1,114 vacancies, with roughly 2.8 lakh registered candidates, was leaked the day before it was scheduled, reportedly by a KPSC confidential-wing staffer selling copies for up to ₹10 lakh each.',
    outcome: 'KPSC cancelled both the Kannada and English papers. Bengaluru Central Crime Branch arrested 14 people, including the alleged KPSC staffer behind the leak, and seized roughly ₹35 lakh in cash along with electronic devices and vehicles.',
    status: 'fir_filed',
    sources: [
      { title: 'Karnataka cancels KPSC exam after question paper leak', url: 'https://www.etvbharat.com/english/state/karnataka/kpsc-cancels-fda-exam-after-question-paper-leak-now-14-arrested/na20210124134125445', outlet: 'ETV Bharat' },
      { title: 'Constable posted at KPSC office arrested over FDA paper leak', url: 'https://www.deccanherald.com/india/karnataka/bengaluru/constable-posted-at-kpsc-office-arrested-over-fda-paper-leak-944150.html', outlet: 'Deccan Herald' },
    ],
  },
  {
    id: 'hpssc-joa-it-2022',
    examName: 'Junior Office Assistant (IT) Recruitment Exam',
    year: 2022,
    state: 'Himachal Pradesh',
    category: 'Recruitment — State Government',
    conductingBody: 'Himachal Pradesh Staff Selection Commission (HPSSC)',
    summary: "A senior assistant in the Commission's own secrecy branch allegedly leaked the JOA (IT) question paper with help from her sons and a middleman, selling it to candidates for roughly ₹2.5 lakh.",
    outcome: 'The state government suspended the entire Commission and put all pending recruitments on hold. The Vigilance Bureau arrested eight people by the end of 2022, and separately arrested two more HPSSC peons in 2023 over related OMR-sheet tampering.',
    status: 'chargesheeted',
    sources: [
      { title: 'Himachal Pradesh Government suspends functioning of staff selection commission over paper leak', url: 'https://www.tribuneindia.com/news/himachal/paper-leak-himachal-govt-suspends-functioning-of-state-staff-selection-commission-464723', outlet: 'The Tribune' },
      { title: 'HPSSC: Two more arrested in JOA (IT) paper leak case in Himachal Pradesh', url: 'https://www.deccanherald.com/india/hpssc-two-more-arrested-in-joa-it-paper-leak-case-in-himachal-pradesh-1176756.html', outlet: 'Deccan Herald' },
    ],
  },
  {
    id: 'bpsc-67th-2022',
    examName: '67th Combined Competitive Examination (CCE) Prelims',
    year: 2022,
    state: 'Bihar',
    category: 'Recruitment — Civil Services',
    conductingBody: 'Bihar Public Service Commission (BPSC)',
    summary: 'Within minutes of the exam starting on May 8, 2022, screenshots of a question paper matching "Set C" appeared on WhatsApp and Telegram, affecting an exam that drew over 600,000 candidates competing for 802 posts.',
    outcome: 'BPSC cancelled the exam. Bihar Police arrested four people, including a Block Development Officer who had been deputed as the exam-centre magistrate, under the IT Act and the Bihar Conduct of Examinations Act.',
    status: 'fir_filed',
    sources: [
      { title: 'BPSC paper leak: Bihar Public Service Commission cancels 67th preliminary exam 2022', url: 'https://www.dnaindia.com/education/report-government-job-alert-bpsc-paper-leak-bihar-public-service-commission-cancels-67th-preliminary-exam-2022-2951492', outlet: 'DNA India' },
      { title: 'BPSC question paper leak: BDO, invigilator among four arrested', url: 'https://news.careers360.com/bpsc-67th-question-paper-leak-bdo-college-invigilator-four-arrested-in-exam-paper-leak-case/amp', outlet: 'Careers360' },
    ],
  },
  {
    id: 'bihar-police-constable-2023',
    examName: 'Constable Recruitment Exam',
    year: 2023,
    state: 'Bihar',
    category: 'Recruitment — Police',
    conductingBody: 'Central Selection Board of Constables (CSBC), Bihar',
    summary: 'The October 1, 2023 exam for 21,391 constable posts, held at 529 centres across 37 districts, was cancelled after the board found what it called an organized, orchestrated sabotage of the exam process.',
    outcome: 'Bihar Police arrested several people shortly after, but the alleged mastermind, Rajkishor Kumar — who carried a ₹1 lakh bounty and was linked to other leak cases including NEET-UG and BPSC teacher recruitment — was not arrested until August 2025.',
    status: 'chargesheeted',
    sources: [
      { title: 'Bihar Police constable recruitment exam cancelled due to paper leak', url: 'https://www.theweek.in/wire-updates/national/2023/10/04/cal1-bh-police-paper-leak.html', outlet: 'The Week' },
      { title: 'Bihar Police arrests 2023 constable recruitment exam paper leak mastermind', url: 'https://www.theweek.in/wire-updates/national/2025/08/15/cal55-bh-paper-leak-arrest.html', outlet: 'The Week' },
    ],
  },
  {
    id: 'rajasthan-si-2021',
    examName: 'Sub-Inspector (SI) Recruitment Exam',
    year: 2021,
    state: 'Rajasthan',
    category: 'Recruitment — Police',
    conductingBody: 'Rajasthan Public Service Commission (RPSC)',
    summary: 'The exam for 859 sub-inspector posts was compromised by a leak that investigators say reached organized gangs and Bluetooth-device cheating networks statewide, allegedly with direct involvement from within the Commission.',
    outcome: "In August 2025, the Rajasthan High Court cancelled the entire 2021 recruitment, finding two RPSC members directly involved in leaking the paper and that over 500 selected candidates — more than half the batch — had cleared the exam fraudulently. A former RPSC member and his two children were among those arrested. A division bench stayed that cancellation order in September 2025 pending further hearing.",
    status: 'court_case_ongoing',
    sources: [
      { title: 'Rajasthan High Court Cancels 2021 Sub-Inspector Recruitment Over Paper Leak Scam', url: 'https://www.etvbharat.com/en/!state/rajasthan-high-court-cancels-2021-si-recruitment-exam-over-paper-leak-enn25082802897', outlet: 'ETV Bharat' },
      { title: 'Rajasthan HC stays order quashing sub-inspector recruitment exam', url: 'https://news.careers360.com/rajasthan-high-court-rpsc-stays-order-quashing-sub-inspector-recruitment-exam/amp', outlet: 'Careers360' },
    ],
  },
  {
    id: 'maharashtra-hsc-2023',
    examName: 'HSC (Class 12) Mathematics Board Exam',
    year: 2023,
    state: 'Maharashtra',
    category: 'School Board',
    conductingBody: 'Maharashtra State Board of Secondary and Higher Secondary Education',
    summary: "The Class 12 Mathematics paper was photographed and circulated on social media roughly 30 minutes before the scheduled start at an exam centre in Sindkhed Raja, Buldhana district, and was raised as a legislative assembly issue.",
    outcome: 'Local education department officials filed a police case at Sindkhedraja police station.',
    status: 'fir_filed',
    sources: [
      { title: 'Maharashtra HSC Exam 2023: Class 12 Board Mathematics Paper Leaked, Photos Go Viral On Social Media', url: 'https://zeenews.india.com/maharashtra/maharashtra-hsc-exam-2023-class-12-board-mathematics-paper-leaked-photos-go-viral-on-social-media-2579555.html', outlet: 'Zee News' },
      { title: 'Maharashtra HSC Exams 2023: Mathematics paper leaks in Buldhana, police case filed', url: 'https://news.careers360.com/news_domain/130871', outlet: 'Careers360' },
    ],
  },
  {
    id: 'ossc-je-civil-2023',
    examName: 'Junior Engineer (Civil) Main Exam — Combined Technical Services Recruitment',
    year: 2023,
    state: 'Odisha',
    category: 'Recruitment — State Government',
    conductingBody: 'Odisha Staff Selection Commission (OSSC)',
    summary: 'Police confirmed the question paper for the JE (Civil) main written exam had leaked, with the alleged ringleader — himself a two-time SSC CGL qualifier — charging candidates ₹12–15 lakh each after obtaining papers between printing and distribution to centres.',
    outcome: 'OSSC cancelled the exam and re-conducted it on September 3, 2023. Balasore Police arrested the alleged mastermind along with roughly 25 others in total across the investigation.',
    status: 'chargesheeted',
    sources: [
      { title: 'OSSC Cancels Main Written Exam Of JE (Civil) As Police Confirm Leak Of Question Paper', url: 'https://www.outlookindia.com/education/ossc-cancels-main-written-exam-of-je-civil-as-police-confirm-leak-of-question-paper-news-305233', outlet: 'Outlook' },
      { title: 'OSSC JE Civil Main exam 2023 cancelled after paper leak; fresh exam on September 3', url: 'https://news.careers360.com/ossc-je-civil-main-2023-cancelled-police-confirm-leak-of-question-paper-exam-date-september-3/amp', outlet: 'Careers360' },
    ],
  },
  {
    id: 'jharkhand-matric-2025',
    examName: 'Class 10 (Matric) Board Exam — Hindi & Science',
    year: 2025,
    state: 'Jharkhand',
    category: 'School Board',
    conductingBody: 'Jharkhand Academic Council (JAC)',
    summary: 'Sealed question-paper packets for the Hindi and Science papers were allegedly cut open in Giridih, photocopied, and circulated via coaching-centre networks in Koderma, Giridih, Hazaribagh, and Garhwa before the exams.',
    outcome: 'JAC cancelled and rescheduled the affected papers. Police arrested ten people, including the alleged main conspirator, following raids on multiple coaching centres.',
    status: 'chargesheeted',
    sources: [
      { title: "10 persons including mastermind arrested in J'khand board exam paper leak case: Police", url: 'https://theprint.in/india/10-persons-including-mastermind-arrested-in-jkhand-board-exam-paper-leak-case-police/2511020/', outlet: 'ThePrint' },
      { title: 'Jharkhand Matric Exam Paper Leak: Key conspirator arrested, police crack case', url: 'https://thejharkhandstory.co.in/jharkhand-matric-exam-paper-leak-key-conspirator-arrested-police-crack-case/', outlet: 'The Jharkhand Story' },
    ],
  },
  {
    id: 'wb-ssc-2016',
    examName: 'School Service Commission (SSC) Teacher & Staff Recruitment',
    year: 2016,
    state: 'West Bengal',
    category: 'Recruitment — Selection Manipulation',
    conductingBody: 'West Bengal School Service Commission (WBSSC)',
    summary: "This case involved manipulation of the selection process itself rather than a leaked question paper: investigators found the OMR answer sheets for a 2016 teacher recruitment drive had been tampered with. Of over 23,000 recommended appointments, thousands showed signs of altered scores or out-of-order rank jumps.",
    outcome: "The Calcutta High Court annulled all 25,753 appointments in April 2024 and ordered a CBI probe. The Supreme Court upheld the cancellation in April 2025, calling the process 'vitiated and tainted,' and ordered fresh recruitment within three months.",
    status: 'court_case_ongoing',
    sources: [
      { title: 'West Bengal recruitment row: SC upholds HC verdict invalidating 25,753 teachers, other staff', url: 'https://www.tribuneindia.com/news/india/west-bengal-recruitment-row-sc-upholds-hc-verdict-invalidating-25753-teachers-other-staff-in-west-bengal-schools', outlet: 'The Tribune' },
    ],
  },
  {
    id: 'rpsc-2nd-grade-2022',
    examName: 'Second Grade Teacher Recruitment Exam (General Knowledge Paper)',
    year: 2022,
    state: 'Rajasthan',
    category: 'Recruitment — Teacher Eligibility',
    conductingBody: 'Rajasthan Public Service Commission (RPSC)',
    summary: 'Hours before the exam was due to start on December 24, 2022, police intercepted a bus near Udaipur carrying candidates who had bought the leaked General Knowledge paper for up to ₹10 lakh each from a gang allegedly led by a Jodhpur-based mastermind.',
    outcome: 'Police arrested 44 people at the scene, including 37 candidates and seven alleged organizers, and the state government cancelled the General Knowledge paper for the entire exam.',
    status: 'fir_filed',
    sources: [
      { title: 'RPSC Paper Leak: Rajasthan 2nd Grade Teacher Recruitment Exam Paper Leaked, 44 Arrested in Udaipur', url: 'https://www.latestly.com/india/news/rpsc-paper-leak-rajasthan-2nd-grade-teacher-recruitment-exam-paper-leaked-44-arrested-in-udaipur-cm-ashok-gehlot-cancelled-examination-4629278.html', outlet: 'LatestLY' },
      { title: 'Rajasthan 2nd grade teacher recruitment exam paper leaked; 44 held', url: 'https://www.tribuneindia.com/news/nation/rajasthan-2nd-grade-teacher-recruitment-exam-paper-leaked-44-held-464144/', outlet: 'The Tribune' },
    ],
  },
  {
    id: 'up-board-english-2022',
    examName: 'UP Board Class 12 English Exam',
    year: 2022,
    state: 'Uttar Pradesh',
    category: 'School Board',
    conductingBody: 'Uttar Pradesh Madhyamik Shiksha Parishad (UPMSP)',
    summary: 'The Class 12 English paper leaked and circulated before the March 30, 2022 exam, forcing UPMSP to cancel it across 24 districts. The state government ordered the stringent National Security Act invoked against those responsible.',
    outcome: 'Police arrested more than 50 people over the following weeks, including a district schools inspector and several journalists, school managers, and principals. UPMSP re-conducted the exam in the affected districts on April 13.',
    status: 'chargesheeted',
    sources: [
      { title: 'UP Board Class 12 English Exam Paper Leak: Private school manager arrested', url: 'https://news.careers360.com/up-class-12-english-exam-paper-leak-private-school-manager-arrested/amp', outlet: 'Careers360' },
      { title: 'UP Board Paper Leak: 9 more arrested in Class 12 English exam paper leak case; 26 held so far', url: 'https://news.careers360.com/up-board-english-paper-leak-2022-nine-more-arrested-class-12-26-held-so-far/amp', outlet: 'Careers360' },
    ],
  },
  {
    id: 'appsc-arunachal-2022',
    examName: 'Assistant Engineer (Civil) Recruitment Exam',
    year: 2022,
    state: 'Arunachal Pradesh',
    category: 'Recruitment — State Government',
    conductingBody: 'Arunachal Pradesh Public Service Commission (APPSC)',
    summary: 'The written exam held August 26–27, 2022 was compromised by a leak traced to a former APPSC deputy controller of examinations, sparking sustained protests and a CBI probe.',
    outcome: 'The CBI arrested several people, including the former deputy controller, and filed a chargesheet against eight accused before a special CBI court. Education department officials who had been suspended over the case were reinstated to service in January 2025.',
    status: 'chargesheeted',
    sources: [
      { title: 'APPSC paper leak scam: Edn dept officials reinstated', url: 'https://arunachaltimes.in/index.php/2025/01/15/appsc-paper-leak-scam-edn-dept-officials-reinstated/', outlet: 'The Arunachal Times' },
      { title: 'Arunachal officer dismissed over APPSC exam paper leak scandal', url: 'https://nenews.in/arunachal-pradesh/arunachal-officer-dismissed-over-appsc-exam-paper-leak-scandal/17200/', outlet: 'Northeast News' },
    ],
  },
  {
    id: 'bihar-tre3-2024',
    examName: 'Teacher Recruitment Exam (TRE-3)',
    year: 2024,
    state: 'Bihar',
    category: 'Recruitment — Teacher Eligibility',
    conductingBody: 'Bihar Public Service Commission (BPSC)',
    summary: 'Both shifts of the exam, held March 15, 2024 for roughly 3.75 lakh candidates across 415 centres, were cancelled after a paper leak was traced to a Hazaribagh, Jharkhand printing-press network.',
    outcome: "Bihar's Economic Offences Unit arrested 266 people in a single Hazaribagh raid alone, with more held later including in Madhya Pradesh. Investigators linked the leak to the same gang later implicated in the NEET-UG 2024 leak and a Haryana veterinary-doctor recruitment leak. The exam was re-conducted in July 2024.",
    status: 'chargesheeted',
    sources: [
      { title: 'Bihar cancels teachers recruitment exam following question paper leak', url: 'https://www.deccanherald.com/india/bihar/bihar-cancels-teachers-recruitment-exam-following-question-paper-leak-2945031', outlet: 'Deccan Herald' },
      { title: 'Bihar: Five more held in teacher recruitment exam \'paper leak\' case', url: 'https://news.careers360.com/bihar-five-more-held-in-teacher-recruitment-exam-paper-leak-case/amp', outlet: 'Careers360' },
    ],
  },
  {
    id: 'assam-class11-2025',
    examName: 'Higher Secondary First Year (Class 11) Board Exams',
    year: 2025,
    state: 'Assam',
    category: 'School Board',
    conductingBody: 'Assam State School Education Board (ASSEB)',
    summary: 'The Mathematics paper, due March 21, 2025, leaked after 18 schools — including three government institutions — broke its security seal a day early. The board went on to cancel all Class 11 exams across 36 subjects scheduled March 24–29.',
    outcome: 'ASSEB suspended the affiliation of 15 private schools and filed an FIR at CID headquarters plus 18 more at local police stations. The CID made 31 arrests, with adults remanded for interrogation and minors sent to juvenile homes under the Juvenile Justice Act.',
    status: 'chargesheeted',
    sources: [
      { title: 'Assam: All Class 11 state board exams cancelled after paper leak', url: 'https://news.careers360.com/assam-all-class-11-state-board-exams-cancelled-after-paper-leak/amp', outlet: 'Careers360' },
      { title: '12 minor students, 13 others arrested in Assam board exam question paper leak case', url: 'https://www.deccanherald.com/india/12-minor-students-13-others-arrested-in-assam-board-exam-question-paper-leak-case-1200439.html', outlet: 'Deccan Herald' },
    ],
  },
  {
    id: 'odisha-otet-2025',
    examName: 'Odisha Teacher Eligibility Test (OTET) — Special Exam',
    year: 2025,
    state: 'Odisha',
    category: 'Recruitment — Teacher Eligibility',
    conductingBody: 'Board of Secondary Education, Odisha',
    summary: 'A Special OTET exam for roughly 75,000 candidates was cancelled hours before its July 20, 2025 start after images of both question papers began circulating on WhatsApp, Facebook, and Instagram.',
    outcome: "Odisha's Crime Branch arrested seven people, including a former state board vice president and a serving government-school teacher who headed a district teachers' association. Bail hearings for the accused were still ongoing months later.",
    status: 'court_case_ongoing',
    sources: [
      { title: 'OTET question paper leak: Odisha Crime Branch detains teacher from Rayagada', url: 'https://odishatv.in/news/odisha/otet-question-paper-leak-odisha-crime-branch-detains-teacher-from-rayagada-268805', outlet: 'OdishaTV' },
      { title: 'OTET question paper leak: Bail hearing deferred, next Court date set for August 22', url: 'https://www.prameyanews.com/otet-question-paper-leak-bail-hearing-deferred-next-court-date-set-for-august-22', outlet: 'Prameya News' },
    ],
  },
  {
    id: 'cuet-ug-2024',
    examName: 'CUET-UG (Common University Entrance Test)',
    year: 2024,
    state: 'National',
    category: 'University Entrance',
    conductingBody: 'National Testing Agency (NTA)',
    summary: 'After the May 15, 2024 exam, students at a Kanpur centre alleged their paper had leaked and protested at the college gate, drawing national attention days after the NEET-UG leak controversy broke.',
    outcome: 'NTA and the UGC chairman said there had been no leak: English-medium students had mistakenly been given Hindi-medium papers and vice versa. Affected students were offered a re-exam on May 29.',
    status: 'case_closed_no_action',
    sources: [
      { title: 'CUET 2024 paper allegedly leaked at Kanpur centre; students protest, re-exam date soon', url: 'https://news.careers360.com/cuet-2024-paper-allegedly-leaked-at-kanpur-centre-students-protest-re-exam-date-soon/amp', outlet: 'Careers360' },
      { title: 'CUET 2024 Exam: Paper \'Leak\' In Kanpur, Exam Postponed In Delhi; What Went Wrong At NTA?', url: 'https://zeenews.india.com/india/cuet-2024-exam-paper-leak-in-kanpur-exam-postponed-in-delhi-what-went-wrong-at-nta-2750080.html', outlet: 'Zee News' },
    ],
  },
  {
    id: 'clat-2026',
    examName: 'CLAT (Common Law Admission Test)',
    year: 2026,
    state: 'National',
    category: 'Law Entrance',
    conductingBody: 'Consortium of National Law Universities',
    summary: 'Allegations that the December 7, 2025 exam paper had leaked spread on social media before and after candidates sat it, prompting a Supreme Court petition seeking a court-monitored investigation.',
    outcome: 'The Supreme Court declined to order a probe, reasoning the exam process was already complete by the time the plea was filed. No leak has been independently confirmed and no arrests have been reported.',
    status: 'alleged',
    sources: [
      { title: 'CLAT 2026 Question Paper Leak, Supreme Court Dismisses Plea, Full Update', url: 'https://www.pw.live/law/exams/clat-2026-question-paper-leak-case', outlet: 'PW.Live' },
      { title: 'CLAT 2026 paper leak allegations: Supreme Court moved seeking court-monitored probe', url: 'https://test.uniindia.com/clat-2026-paper-leak-allegations-supreme-court-moved-seeking-court-monitored-probe/india/news/3697688.html', outlet: 'UNI India' },
    ],
  },
  {
    id: 'cgbse-hindi-2026',
    examName: 'CGBSE Class 12 Hindi Board Exam',
    year: 2026,
    state: 'Chhattisgarh',
    category: 'School Board',
    conductingBody: 'Chhattisgarh Board of Secondary Education (CGBSE)',
    summary: 'Questions matching the Class 12 Hindi paper began circulating on WhatsApp on the evening of March 13, 2026, hours before the exam — reaching thousands of students by the next morning.',
    outcome: 'CGBSE filed an FIR with local police and the cyber cell, and one person was arrested and accused of selling copies of the paper for ₹250–3,000 each. The board re-conducted the Hindi exam on April 10; the state assembly separately passed a law setting penalties of up to 10 years’ imprisonment and a ₹1 crore fine for organized exam leaks.',
    status: 'fir_filed',
    sources: [
      { title: 'CG Board 12th Hindi Paper Leak 2026: Questions Viral on WhatsApp Night Before Exam — FIR Filed, NSUI Protests at Board Office', url: 'https://english.dainikjagranmpcg.com/states/chhattisgarh/cg-board-12th-hindi-paper-leak-2026-questions-viral-on/article-15451', outlet: 'Dainik Jagran' },
      { title: 'CGBSE Hindi Paper Leak: Chhattisgarh board Class 12 re-exam on April 10', url: 'https://news.careers360.com/chhattisgarh-board-12th-hindi-re-exam-2026-on-april-10-timings-cgbse-paper-leak-social-media-claims/amp', outlet: 'Careers360' },
    ],
  },
  {
    id: 'jee-main-2021-hacking',
    examName: 'JEE (Main) — remote exam-software manipulation',
    year: 2021,
    state: 'National',
    category: 'Engineering Entrance',
    conductingBody: 'National Testing Agency (NTA)',
    summary: "Rather than a leaked paper, this case involved remote tampering with the NTA's iLeon exam software at a Sonepat, Haryana test centre — allegedly letting outside operators answer questions on candidates' behalf in real time during the computer-based exam.",
    outcome: 'The CBI raided 20 locations across Delhi-NCR, Pune, and Jamshedpur, arrested seven people including the directors of a private coaching company accused of charging ₹12–15 lakh per successful admission, and in October 2022 arrested a Russian national, identified as the hacker who tampered with the exam software. He was later granted bail.',
    status: 'chargesheeted',
    sources: [
      { title: 'JEE Main 2021: CBI carries out raids at 20 places over alleged manipulation in exam', url: 'https://news.careers360.com/jee-main-2021-cbi-carries-out-raids-at-20-places-over-alleged-manipulation-in-exam/amp', outlet: 'Careers360' },
      { title: 'JEE Main: CBI arrests Russian national in last year\'s exam manipulation case', url: 'https://news.careers360.com/jee-main-cbi-arrests-russian-national-in-last-years-exam-manipulation-case/amp', outlet: 'Careers360' },
    ],
  },
  {
    id: 'uppsc-ro-aro-2024',
    examName: 'Review Officer / Assistant Review Officer (RO/ARO) Preliminary Exam',
    year: 2024,
    state: 'Uttar Pradesh',
    category: 'Recruitment — Civil Services',
    conductingBody: 'Uttar Pradesh Public Service Commission (UPPSC)',
    summary: 'The exam, held February 11, 2024, was cancelled after reports the paper had leaked on a large scale. The UP Special Task Force traced it to a network allegedly charging ₹15 lakh per candidate, with a ₹2 lakh advance.',
    outcome: 'Police registered a case at Manjhanpur police station in Kaushambi and arrested four people, including the alleged main organizer. UPPSC committed to holding a re-examination within six months.',
    status: 'chargesheeted',
    sources: [
      { title: 'UPPSC RO, ARO 2024: UPPSC Prelims Exam Paper Leak Case, 1 Person Arrested in Kaushambi', url: 'https://studycafe.in/uppsc-ro-aro-2024-uppsc-prelims-exam-paper-leak-case-1-person-arrested-in-kaushambi-303011.html', outlet: 'Studycafe' },
      { title: 'UPPSC RO ARO exam cancelled over paper leak allegations; re-exam in six months', url: 'https://news.careers360.com/uppsc-ro-aro-exam-cancelled-over-paper-leak-allegations-re-exam-in-six-months/amp', outlet: 'Careers360' },
    ],
  },
  {
    id: 'rajasthan-forest-guard-2022',
    examName: 'Forest Guard Recruitment Exam',
    year: 2022,
    state: 'Rajasthan',
    category: 'Recruitment — State Government',
    conductingBody: 'Rajasthan Staff Selection Board',
    summary: 'A Village Development Officer allegedly conspired with a junior engineer and others to leak the exam paper for ₹8 lakh per candidate, with both shifts solved for buyers at a hotel and a private house in Banswara before the test.',
    outcome: "Rajasthan's Special Operations Group arrested 11 people, including the alleged VDO organizer, tracing the network through a chain of intermediaries across Banswara district.",
    status: 'chargesheeted',
    sources: [
      { title: 'Rajasthan: 11 arrested in 2022 Forest Guard Recruitment Exam paper leak case', url: 'https://theprint.in/india/rajasthan-11-arrested-in-2022-forest-guard-recruitment-exam-paper-leak-case/2163766/', outlet: 'ThePrint' },
      { title: 'Rajasthan 11 arrested 2022 Forest Guard Recruitment Exam paper leak case latest updates', url: 'https://www.indiatvnews.com/rajasthan/rajasthan-11-arrested-2022-forest-guard-recruitment-exam-paper-leak-case-latest-updates-police-investigation-2024-07-07-940623', outlet: 'India TV' },
    ],
  },
  {
    id: 'telangana-ssc-telugu-2025',
    examName: 'SSC (Class 10) Telugu Board Exam',
    year: 2025,
    state: 'Telangana',
    category: 'School Board',
    conductingBody: 'Telangana Board of Secondary Education',
    summary: 'A student photographed the Telugu question paper through a window at a Nalgonda district exam centre on March 21, 2025, and circulated it on social media with help from a private-school teacher and a photocopy-shop owner.',
    outcome: 'Police arrested five adults and apprehended one minor, sending the adults to judicial custody; six more people were named as accused with efforts underway to locate them.',
    status: 'chargesheeted',
    sources: [
      { title: 'Five held in SSC Telugu exam paper leak case', url: 'https://www.deccanchronicle.com/southern-states/telangana/five-held-in-ssc-telugu-exam-paper-leak-case-1868724', outlet: 'Deccan Chronicle' },
      { title: 'Five held for alleged SSC question paper leak in Telangana', url: 'https://news.careers360.com/five-held-for-alleged-ssc-question-paper-leak-in-telangana/amp', outlet: 'Careers360' },
    ],
  },
]
