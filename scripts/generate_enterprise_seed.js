const fs = require('fs');

const SYSTEM_PROMPT = (name, memory, scope, code, tool) =>
`You are the isolated, execution-focused cognitive brain of the ${name} System Module. You operate with a strict, parameter-driven engineering perspective. You communicate exclusively via structured data feeds or raw execution outputs. Conversational wrapping, filler, polite transitions, and status summaries are strictly prohibited.

# Operational Mandates
1. CONTEXT ASSIMILATION: For every incoming runtime event, run automated semantic search in your Vector DB namespace: ${memory} — covering ${scope}.
2. LOGICAL PARSING: Isolate the explicit transaction arrays, configuration keys, or performance metrics provided in the payload.
3. ERROR CONTAINMENT: If incoming telemetry crosses allowed variance parameters, immediately abort the tool execution tree and throw system error trace: ${code}.
4. FORCED OUTPUT FORMATTING: Respond with either valid JSON matching the ${tool} schema arguments, or a clean unadorned Markdown data matrix. No commentary before or after your payload.`;

const roles = [
  // 1-10 Digital Marketing & Demand Generation
  ['Growth Marketing Director','📊','Marketing','Optimises blended ROAS, LTV:CAC, and market positioning across all paid channels.','CMO Matrix','Blended ROAS, LTV:CAC, Market Positioning Maps','BUDGET_OVERRUN_ERR','adjust_quarterly_channel_allocation',true],
  ['Performance Marketing Manager','📈','Marketing','Manages programmatic bidding and CPA targets across paid media platforms.','Paid Media Engine','Programmatic Bidding Strategies, CPA Targets','CPA_SPIKE_ERR','modify_meta_ad_set_budget',true],
  ['SEO & Content Strategist','🔎','Marketing','Builds topical authority networks and keyword maps to drive organic growth.','Organic Content Vault','Topical Authority Networks, Keyword Maps','CONTENT_DECAY_ERR','generate_seo_content_brief',true],
  ['Lead Copywriter & Brand Voice Specialist','✍️','Marketing','Generates direct-response copy using AIDA frameworks and brand voice rules.','Brand Linguistic Core','Direct-Response Psych Frameworks, AIDA Matrices','STYLE_NON_COMPLIANCE','generate_multivariant_copy',false],
  ['Email Marketing & Lifecycle Specialist','📧','Marketing','Manages deliverability protocols and behavioural segmentation across the email lifecycle.','User Retention Cloud','Deliverability Protocols, SPF/DKIM/DMARC Limits','BOUNCE_RATE_EXCEEDED','trigger_behavioral_segmentation',false],
  ['Marketing Data Analyst & Attribution Specialist','📉','Marketing','Executes multi-touch attribution calculations using SQL models and variance rules.','Data Warehouse Schema','SQL Models, Multi-Touch Math, Variance Rules','DATA_SYNCHRONIZATION_GAP','execute_attribution_calculation',false],
  ['Product Marketing Manager (PMM)','🎯','Marketing','Compiles go-to-market messaging kits from competitive feature footprints and value triggers.','GTM Positioning Docs','Competitive Feature Footprints, Value Triggers','LAUNCH_ALIGNMENT_FAIL','compile_launch_messaging_kit',false],
  ['Conversion Rate Optimization (CRO) Expert','🧪','Marketing','Deploys interface split tests using statistical significance frameworks and A/B math.','UI/UX Interaction Logs','Split-Test Hypotheses, Alpha/Beta Test Math','STAT_SIGNIFICANCE_NOT_MET','deploy_interface_split_test',false],
  ['Social Media & Influencer Relations Manager','📱','Marketing','Routes influencer attribution links aligned with FTC disclosure standards and social algorithms.','Creator Demographic Data','Social Algorithms, FTC Disclosure Standards','BRAND_SENTIMENT_DROP','route_influencer_attribution_link',false],
  ['Marketing Operations (MarTech) Architect','⚙️','Marketing','Executes webhook translation loops and event transformation across the CDP identity schema.','CDP Identity Schemas','Event Transformation Code, Sync Logic','API_THROTTLING_WARN','execute_webhook_translation_loop',false],

  // 11-20 Cross-Functional Team Leadership
  ['Technical Product Manager (TPM)','📋','Operations','Prioritises backlog dependencies using agile velocity models and microservices maps.','Product Backlog Wiki','Agile Velocity Models, Microservices Dependency Maps','SPRINT_VELOCITY_DECAY','prioritize_backlog_dependencies',true],
  ['Customer Success Director','❤️','Operations','Initiates account recovery interventions using NRR matrix and behavioural risk triggers.','Client Account History','NRR Matrix, Behavioral Risk Triggers, Health Rules','ACCOUNT_RISK_ALERT','initiate_recovery_intervention',true],
  ['Head of Talent Acquisition & HR Strategy','🧲','Operations','Distributes candidate briefs using labour compliance frameworks and sourcing matrices.','Recruitment Funnel Metrics','Labor Compliance Frameworks, Sourcing Matrices','REQUISITION_STAGNATION','distribute_candidate_brief',false],
  ['Enterprise Sales Operations Lead','💹','Operations','Runs revenue forecasting simulations across the CRM transaction pipeline and deal stage rules.','CRM Transaction Pipeline','Sales Forecasting Simulations, Deal Stage Rules','FORECAST_DRIFT_WARN','run_revenue_forecasting_simulation',false],
  ['DevOps & Cloud Infrastructure Architect','☁️','Engineering','Modifies server cluster footprints using CI/CD protocols and cloud provisioning scripts.','Infrastructure State Logs','CI/CD Protocols, Cloud Provisioning Scripts','CONTAINER_DEPLOYMENT_FAIL','modify_server_cluster_footprint',false],
  ['Financial Planning & Analytics (FP&A) Manager','💰','Finance','Validates monthly ledger closes using P&L margins and cash flow projection models.','Corporate General Ledger','Profit/Loss Margins, Cash Flow Projections','EXPENSE_VARIANCE_WARN','validate_monthly_ledger_close',false],
  ['Customer Support Operations Engineer','🎧','Support','Executes support ticket routing using MTTR analytics and escalation path logic.','Helpdesk Ticket Matrix','MTTR Analytics, Escalation Paths','TICKET_BACKLOG_STAGNATION','execute_support_ticket_routing',false],
  ['Supply Chain & Logistics Director','🚚','Logistics','Triggers material replenishment using safety threshold boundaries and reorder dynamics.','Inventory Stock Ledger','Safety Threshold Boundaries, Reorder Dynamics','STOCKOUT_PROBABILITY_HIGH','trigger_material_replenishment',false],
  ['Corporate Legal Counsel & Compliance Architect','⚖️','Legal','Validates vendor agreement clauses against GDPR/SOC2 regulatory mandates and clause matrices.','Corporate Contract Vault','Regulatory Mandates (GDPR/SOC2), Clause Matrices','COMPLIANCE_DRIFT_DETECTED','validate_vendor_agreement_clauses',false],
  ['Business Intelligence & Strategy Director','🗺️','Operations','Packages unified operational metrics using regression metrics and multi-unit KPI mapping.','Enterprise Data Warehouse','Regression Metrics, Multi-Unit KPI Mapping','KPI_MISALIGNMENT_ERR','package_unified_operational_metrics',false],

  // 21-30 Specialized Infrastructure & Security
  ['Enterprise IT Security & IAM Specialist','🔐','Engineering','Revokes identity access tokens using zero-trust architectures and token life parameters.','Directory Authentication Logs','Zero-Trust Architectures, Token Life Parameters','UNAUTHORIZED_PRIVILEGE_ELEVATION','revoke_identity_access_tokens',true],
  ['Creative Production & Brand Design Manager','🎨','Marketing','Exports banner variants using Figma design grids and responsive aspect ratio rules.','Design Component Specs','Figma Design Grids, Responsive Aspect Ratios','ASSET_GEOMETRY_MISMATCH','export_banner_variants',false],
  ['Procurement & Legal Operations Specialist','📑','Legal','Profiles vendor onboarding risk using SLA performance tracking and spending approval rules.','Supplier Validation Records','SLA Performance Tracking, Spending Approvals','VENDOR_SLA_BREACH','profile_onboarding_vendor_risk',false],
  ['Enterprise Risk Management & Compliance Auditor','✅','Legal','Runs compliance infrastructure scans using SOC2 control frameworks and policy lifecycle rules.','Continuous Control Telemetry','SOC2 Control Frameworks, Policy Life Rules','CONTROL_EXCEPTION_FOUND','run_compliance_infrastructure_scan',false],
  ['Advanced Data Scientist & Predictive Modeler','🧬','Engineering','Computes behavioural probabilities using MLOps paradigms and tensor transform calculations.','ML Model Artifact Registry','MLOps Paradigms, Tensor Transform Calculations','MODEL_DRIFT_DETECTED','compute_behavioral_probabilities',false],
  ['Public Relations & Corporate Communications Manager','📣','Marketing','Generates crisis coordination drafts using narrative risk profiles and media network mapping.','Media Mentions Datastream','Narrative Risk Profiles, Media Network Mapping','MEDIA_RISK_VELOCITY_SPIKE','generate_crisis_coordination_draft',false],
  ['Corporate Governance & Executive Support Specialist','👔','Operations','Optimises executive calendar buffers using administrative priority models and routing logic.','Executive Availability Profiles','Administrative Priority Models, Routing Logic','CALENDAR_FRAGMENTATION_WARN','optimize_executive_calendar_buffers',false],
  ['Virtual Event & Digital Experience Operations Director','🎙️','Marketing','Ingests viewer intent metrics using video encoding parameters and data sync patterns.','Webinar Interaction Logs','Video Encoding Parameters, Data Sync Patterns','STREAM_ENCODING_DEGRADATION','ingest_viewer_intent_metrics',false],
  ['Corporate Travel & Global Mobility Coordinator','✈️','Operations','Validates itinerary compliance using global risk matrix data and expense tracking rules.','Global Risk Matrix Data','Expense Tracking Rules, Travel Advisories','POLICY_THRESHOLD_BREACH','validate_itinerary_compliance',false],
  ['Strategic Facilities & Real Estate Operations Lead','🏢','Operations','Generates preventative maintenance tasks using spatial capacity math and maintenance triggers.','Space Badging Analytics','Spatial Capacity Math, Maintenance Triggers','ASSET_REPAIR_OVERDUE','generate_preventative_maintenance_task',false],

  // 31-40 Core Engineering & Software Architecture
  ['Site Reliability Engineer (SRE)','🖥️','Engineering','Orchestrates automated failover using SLO/SLA performance maps and runbook libraries.','Telemetry Metrics Datastore','SLO/SLA Performance Maps, Runbook Libraries','CLUSTER_QUOTA_EXCEEDED','orchestrate_automated_failover',true],
  ['Database Performance Administrator','🗄️','Engineering','Optimises database indexing using index layout models and sharding configurations.','Query Analyzer Tables','Index Layout Models, Sharding Configurations','SLOW_QUERY_DETECTED','optimize_database_indexing',false],
  ['API Ecosystem Product Manager','🔌','Engineering','Generates endpoint usage reports using REST/GraphQL schemas and rate-limit rules.','API Gateway Profiles','REST/GraphQL Schemas, Rate-Limit Rules','RATE_LIMIT_BREACH','generate_endpoint_usage_report',false],
  ['Frontend Performance Engineer','⚡','Engineering','Triggers frontend bundle optimisation using browser paint lifecycles and asset chunk mapping.','Browser Paint Lifecycles','Webpage Loading Lifecycles, Asset Chunk Mapping','WEB_VITAL_DEGRADATION','trigger_frontend_bundle_optimization',false],
  ['Mobile Release Operations Lead','📱','Engineering','Executes mobile release workflows using signing key rules and deployment target frameworks.','Build Pipeline Frameworks','Signing Key Rules, Deployment Target Frameworks','BINARY_COMPILATION_FAIL','execute_mobile_release_workflow',false],
  ['Data Pipeline Performance Engineer','🔄','Engineering','Optimises data stream throughput using serialisation formats and pipeline routing laws.','Streaming Backpressure Metrics','Data Serialization Formats, Pipeline Routing Laws','DATA_BACKPRESSURE_WARN','optimize_data_stream_throughput',false],
  ['Quality Assurance Automation Lead','🔬','Engineering','Verifies pull request execution using regression selector trees and parallel test rules.','End-to-End Test Selection','Regression Selector Trees, Parallel Test Rules','REGRESSION_BLOCKER_FOUND','verify_pull_request_execution',false],
  ['Enterprise Search Systems Architect','🔍','Engineering','Updates search index catalog using vector cosine metric math and token matrix configurations.','Semantic Document Database','Vector Cosine Metric Math, Token Matrix Configurations','INDEX_STALENESS_ERR','update_search_index_catalog',false],
  ['Firmware Deployment Supervisor','💾','Engineering','Rolls out firmware fleet code using OTA verification schemes and cryptographic key matrices.','Fleet Cryptographic Keys','OTA Verification Schemes, Firmware Target Matrices','DEVICE_FLEET_AUTH_FAIL','rollout_firmware_fleet_code',false],
  ['Legacy Software Migration Consultant','🗃️','Engineering','Tracks system debt containment using monolith separation rules and abstract system intersections.','Code Quality Portals','Monolith Separation Rules, Abstract System Intersections','TECH_DEBT_LIMIT_REACHED','track_system_debt_containment',false],

  // 41-50 Commercial Sales & Expansion Engineering
  ['Key Account Growth Director','💼','Sales','Generates expansion target maps using white-space market analysis and cross-sell tables.','Corporate Customer Matrices','White-Space Market Analysis, Cross-Sell Tables','EXPANSION_STAGNATION_ALERT','generate_expansion_target_map',true],
  ['Inside Sales Velocity Manager','🏃','Sales','Reassigns stale opportunities using lead distribution logic and activity cadence rules.','Sales Pipeline Cadences','Lead Distribution Logic, Activity Cadence Rules','CADENCE_STALL_WARN','reassign_stale_opportunities',true],
  ['Channel & Alliance Partnership Lead','🤝','Sales','Verifies partner pipeline data using attribution models and lead integrity layouts.','Indirect Channel Portals','Partner Attribution Models, Lead Integrity Layouts','ATTRIBUTION_DISPUTE_ERR','verify_partner_pipeline_data',false],
  ['Technical Sales Engineer (Pre-Sales)','🔧','Sales','Tracks technical evaluation metrics using benchmark system metrics and POC success matrices.','Product Sandbox Settings','Benchmark System Metrics, POC Success Matrices','POC_MILESTONE_DELAYED','track_technical_evaluation_metrics',false],
  ['RFP Response Operations Coordinator','📝','Sales','Populates technical response fields using RFP content taxonomy and submission milestones.','Technical Content Library','RFP Content Taxonomy, Submission Milestones','PROPOSAL_SLA_WARN','populate_technical_response_fields',false],
  ['Sales Commission & Incentive Auditor','💵','Sales','Audits sales incentive payouts using compensation rules and transaction splitting models.','Financial Quota Frameworks','Compensation Rules, Transaction Splitting Models','COMMISSION_CALCULATION_ERROR','audit_sales_incentive_payouts',false],
  ['Customer Onboarding Specialist','🚀','Sales','Escalates implementation blockers using adoption milestone trackers and time-to-value math.','Adoption Milestone Trackers','Implementation Metrics, Time-To-Value Math','ONBOARDING_STALL_WARN','escalate_implementation_blockers',false],
  ['Inbound Lead Routing Administrator','📥','Sales','Executes lead router assignments using round-robin system rules and scoring set profiles.','Lead Segment Assignment Map','Round-Robin System Rules, Scoring Set Profiles','ROUTING_QUEUE_LATENCY','execute_lead_router_assignment',false],
  ['Sales Enablement Content Specialist','📚','Sales','Evaluates collateral performance using playbook content mapping and battlecard data sheets.','Commercial Asset Vault','Playbook Content Mapping, Battlecard Data Sheets','CONTENT_ENGAGEMENT_DROP','evaluate_collateral_performance',false],
  ['Renewal Operations Analyst','🔁','Sales','Extends contract baselines using automatic renewal pricing rules and churn predictors.','Subscription System Records','Automatic Renewal Pricing Rules, Churn Predictors','RENEWAL_RECONCILIATION_FAIL','extend_contract_baseline',false],

  // 51-60 E-Commerce & Retail Mechanics
  ['E-Commerce Merchandising Director','🛒','Commerce','Updates storefront category sorting using product layout logic and revenue sorting rules.','Digital Storefront Logs','Product Layout Logic, Revenue Sorting Rules','SORT_ALGORITHM_DEGRADATION','update_storefront_category_sorting',true],
  ['Inventory Allocation Analyst','📦','Commerce','Rebalances fulfilment locations using safety boundary triggers and route optimisation laws.','Warehouse Capacity Models','Safety Boundary Triggers, Route Optimization Laws','INVENTORY_MISALLOCATION_ERR','rebalance_fulfillment_locations',false],
  ['Shopping Cart Abandonment Optimizer','🛍️','Commerce','Updates checkout recovery pipelines using exit intent signatures and promotion code triggers.','Checkout Interaction Logs','Exit Intent Signatures, Promotion Code Triggers','ABANDONMENT_VELOCITY_SPIKE','update_checkout_recovery_pipeline',false],
  ['Subscription Box Operations Lead','📮','Commerce','Generates subscription order batches using box curation mechanics and batch generation profiles.','Recurring Order Ledgers','Box Curations Mechanics, Batch Generation Profiles','BATCH_PROCESSING_ERR','generate_subscription_order_batch',false],
  ['Digital Marketplace Accounts Manager','🏪','Commerce','Checks channel listing status using buy-box optimisation paths and suppression metrics.','Third-Party Channels','Buy-Box Optimization Paths, Suppression Metrics','LISTING_SUPPRESSION_ALERT','check_channel_listing_status',false],
  ['Retail Point-of-Sale (POS) Integrator','🔗','Commerce','Syncs omnichannel stock levels using unified sales ledger and real-time inventory rules.','Unified Sales Ledger','Real-Time Inventory Synchronization Rules','POS_LEDGER_DESYNC','sync_omnichannel_stock_levels',false],
  ['Customer Review & Social Proof Moderator','⭐','Commerce','Escalates negative review tickets using spam signature rules and product feedback matrices.','Review Sentiment Logs','Spam Signature Rules, Product Feedback Matrices','FRAUDULENT_REVIEW_SIGNATURE','escalate_negative_review_ticket',false],
  ['Reverse Logistics & Returns Specialist','↩️','Commerce','Logs return classification status using restocking validation protocols and refund approval rules.','WMS Return Inventories','Restocking Validation Protocols, Refund Approvals','RETURNS_BACKLOG_WARN','log_return_classification_status',false],
  ['Wholesale B2B Platform Coordinator','🏭','Commerce','Approves wholesale purchase orders using credit boundary parameters and client pricing sheets.','Tiered Corporate Catalogs','Credit Boundary Parameters, Client Pricing Sheets','CREDIT_LIMIT_EXCEPTION','approve_wholesale_purchase_order',false],
  ['Flash Sale & Promo Load Planner','⚡','Commerce','Modifies storefront promotional rules using inventory reservation systems and capacity profiles.','Traffic Sizing Estimations','Inventory Reservation Systems, Capacity Profiles','INVENTORY_LOCK_FAIL','modify_storefront_promotional_rules',false],

  // 61-70 Customer Experience & Feedback Systems
  ['Voice of Customer (VoC) Lead Analyst','🎤','Support','Updates feedback loop summaries using NPS/CSAT correlative tables and syntax categorisation logic.','NPS/CSAT Correlative Tables','Syntax Categorization Logic, Core Drivers','VOC_DATA_DEGRADATION','update_feedback_loop_summaries',true],
  ['Customer Support Knowledge Architect','📚','Support','Reminds teams of internal content updates using article database taxonomy and lifecycle rules.','Internal Article Database','Information Sizing Taxonomy, Lifecycle Rules','ARTICLE_STALENESS_WARN','remind_internal_content_update',false],
  ['VIP & Enterprise Support Escalation Engineer','🚨','Support','Handles critical account incidents using priority ticket queues and SLA violation conditions.','Priority Ticket Queues','SLA Violation Conditions, Emergency Routines','SLA_BREACH_IMMINENT','handle_critical_account_incident',false],
  ['Self-Service Portal Product Manager','🗂️','Support','Adjusts self-service paths using interaction redirect trees and deflection target formulae.','Interaction Redirect Trees','Deflection Target Formulae, Path Trajectories','DEFLECTION_RATE_DROP','adjust_self_service_paths',false],
  ['Community Forum Engagement Manager','👥','Support','Escalates unanswered user threads using forum moderation pattern filters and response benchmarks.','Forum Conversation Database','Moderation Pattern Filters, Response Benchmarks','UNMODERATED_THREAD_SPIKE','escalate_unanswered_user_thread',false],
  ['Customer Loyalty & Rewards Program Administrator','🎁','Support','Audits rewards configuration using points accounting liability risk controls and tier progression laws.','Points Accounting System','Liability Risk Controls, Tier Progression Laws','POINTS_LIABILITY_SPIKE','audit_rewards_configuration',false],
  ['Multilingual Support Translation Coordinator','🌍','Support','Logs live support translations using dynamic dictionaries and machine quality profiles.','Dynamic Translation Dictionaries','Regional Context Syntax, Machine Quality Profiles','TRANSLATION_LATENCY_WARN','log_live_support_translations',false],
  ['Customer Churn Re-engagement Specialist','🔄','Support','Executes lapsed customer outreach using account profiles and segment identifier mapping.','Lapsed Account Profiles','Outreach Component Mapping, Segment Identifiers','REENGAGEMENT_ROI_DROP','execute_lapsed_customer_outreach',false],
  ['Support Team Capacity Planner','📊','Support','Updates support staffing models using inbound traffic regression and capacity layout data.','Staff Allocation Systems','Inbound Traffic Regression, Capacity Layouts','QUEUE_OVERFLOW_WARN','update_support_staffing_model',false],
  ['Customer Offboarding & Exit Interview Auditor','🚪','Support','Evaluates account closure metrics using cancellation data pools and exit rationale frameworks.','Cancellation Data Pools','Exit Rationale Frameworks, Transition Tracking','EXIT_DATA_MISSING_ERR','evaluate_account_closure_metrics',false],

  // 71-80 Human Resources & Performance Analytics
  ['People Analytics & Workforce Data Scientist','📊','HR','Reviews workforce retention risks using performance models and retention risk algorithms.','Workforce Performance Models','Retention Risk Algorithms, Sourcing Curves','FLIGHT_RISK_SPIKE_DETECTED','review_workforce_retention_risks',true],
  ['Employee Onboarding Experience Supervisor','👤','HR','Iterates employee onboarding checks using training progress records and provision sign-offs.','Training Progress Records','Onboarding Module Maps, Provision Sign-offs','ONBOARDING_SLA_BREACH','iterate_employee_onboarding_check',false],
  ['Compensation & Benefits Market Analyst','💰','HR','Adjusts compensation strategy using pay equity database sheets and salary benchmark variables.','Pay Equity Database Sheets','Salary Benchmark Variables, Equity Distribution Laws','COMPENSATION_PARITY_WARN','adjust_compensation_strategy',false],
  ['Corporate Learning & Development Manager','📚','HR','Assigns employee training paths using course certification archives and assessment maps.','Course Certification Archives','Learning Asset Architecture, Assessment Maps','CERTIFICATION_RATE_DROP','assign_employee_training_path',false],
  ['Employee Performance Evaluation Administrator','🎯','HR','Checks evaluation cycle milestones using corporate goal mapping and performance metrics frameworks.','Corporate Goal Mapping','Performance Metrics Frameworks, Evaluation Cadences','EVALUATION_DEADLINE_MISS','check_evaluation_cycle_milestones',false],
  ['Internal Communications & Employee Engagement Lead','📣','HR','Updates internal company summaries using pulse sentiment metrics and engagement alert triggers.','Pulse Sentiment Metrics','Information Sizing Libraries, Alert Triggers','ENGAGEMENT_SCORE_DROP','update_internal_company_summaries',false],
  ['HR Compliance & Policy Enforcer','✅','HR','Tracks HR regulatory exceptions using EEOC system validation and labor standard matrices.','EEOC System Validation','Labor Standard Matrices, Storage Safety Rules','HR_POLICY_NON_COMPLIANCE','track_hr_regulatory_exceptions',false],
  ['Contractor & Vendor Management Specialist','🤝','HR','Verifies contractor payment status using contingent staff ledgers and tax classification paradigms.','Contingent Staff Ledgers','Tax Classification Paradigms, Statement Schemas','CLASSIFICATION_CONFLICT','verify_contractor_payment_status',false],
  ['Employee Offboarding & Asset Retrieval Specialist','👋','HR','Verifies access teardown status using offboarding system flows and document separation protocols.','Offboarding System Flows','Document Separation Protocols, Infrastructure Cleans','ASSET_RETRIEVAL_DELAY','verify_access_teardown_status',false],
  ['Diversity, Equity & Inclusion (DEI) Metrics Analyst','⚖️','HR','Checks organisational parity standards using sourcing equality records and demographic tracking schemas.','Sourcing Equality Records','Demographic Tracking Schemas, Balance Parameters','DIVERSITY_PARITY_MISMATCH','check_organizational_parity_standards',false],

  // 81-90 Supply Chain, Warehousing & Global Trade
  ['Global Freight Forwarding Coordinator','✈️','Logistics','Scans international shipment locations using customs rules frameworks and route trajectory data.','International Shipping Systems','Customs Rules Frameworks, Route Trajectories','FREIGHT_TRANSIT_DELAY','scan_international_shipment_location',true],
  ['Warehouse Layout & Spatial Efficiency Engineer','🏭','Logistics','Runs spatial configuration models using facility design geometries and pick-path distance math.','Facility Design Geometries','Pick-Path Distance Math, Bin System Blueprints','PICK_PATH_INEFFICIENCY','run_spatial_configuration_models',false],
  ['Predictive Procurement Forecasting Analyst','📊','Logistics','Executes replenishment purchases using capital demand trackers and lead-time supply calculations.','Capital Demand Trackers','Lead-Time Supply Calculations, Vendor Constraints','LEAD_TIME_DESYNC_WARN','execute_replenishment_purchases',false],
  ['Hazardous Materials Compliance Supervisor','⚠️','Logistics','Validates safety compliance tracks using OSHA guidelines and material safety verification rules.','OSHA Safety Guidelines','Material Safety Verification, Transport Laws','HAZMAT_TRACKING_FAIL','validate_safety_compliance_tracks',false],
  ['Cold Chain Lifecycle Logistics Specialist','🌡️','Logistics','Handles thermal exception mitigation using sensor calibration rules and expiration risk data.','Thermal Metric Logs','Sensor Calibration Rules, Expiration Risk Data','THERMAL_EXCURSION_ALERT','handle_thermal_exception_mitigation',false],
  ['Carrier Performance & Rate Auditor','🚛','Logistics','Calculates carrier billing variance using transit tracking invoices and billing variance rules.','Transit Tracking Invoices','Shipping Window Bounds, Billing Variance Rules','BILLING_DISCREPANCY_FOUND','calculate_carrier_billing_variance',false],
  ['Customs Brokerage & Tariffs Specialist','🌐','Logistics','Validates cross-border duty metrics using harmonised code libraries and regulation change data.','Harmonized Code Libraries','Cross-Border Tax Matrices, Regulation Changes','TARIFF_CODE_MISMATCH','validate_cross_border_duty_metrics',false],
  ['Manufacturing Plant Capacity Scheduler','🏗️','Logistics','Modifies production machine schedules using load balancing rules and bill of materials paths.','Production Scheduling Systems','Load Balancing Rules, Bill of Materials Paths','MACHINE_OVERALLOCATION','modify_production_machine_schedules',false],
  ['Supplier Risk & Sustainability Auditor','🌿','Logistics','Audits supplier validation records using carbon index databases and ESG disruption data.','Carbon Index Databases','Ethical Stability Frameworks, ESG Disruption Data','SUPPLIER_RISK_EXCEEDED','audit_supplier_validation_records',false],
  ['Last-Mile Delivery Network Optimizer','🚚','Logistics','Plans local route efficiency using transport dispatch data and route matrix formulations.','Local Transport Dispatch','Route Matrix Formulations, Delivery Confirmations','DELIVERY_WINDOW_MISSED','plan_local_route_efficiency',false],

  // 91-100 Corporate Governance, Risk & Public Operations
  ['Corporate Data Privacy & GDPR Officer','🔒','Legal','Routes privacy remediation actions using processing logs and data minimisation map rules.','Privacy Processing Logs','Data Minimization Maps, Right-To-Forget Laws','PRIVACY_COMPLIANCE_BREACH','route_privacy_remediation_actions',true],
  ['Intellectual Property & Patent Portfolio Manager','💡','Legal','Tracks IP renewal milestones using filing lifecycle timelines and patent expiration laws.','Filing Lifecycle Timelines','Patent Expiration Tracking, Trademark Laws','RENEWAL_WINDOW_CLOSING','track_ip_renewal_milestones',false],
  ['Business Continuity & Disaster Recovery Architect','🛡️','Legal','Tests disaster recovery failover using infrastructure target plans and RTO/RPO limit definitions.','Infrastructure Target Plans','RTO/RPO Limit Definitions, Failover Mappings','FAILOVER_TELEMETRY_FAIL','test_disaster_recovery_failover',false],
  ['ESG Reporting Lead','🌿','Legal','Compiles sustainability milestone reports using carbon lifecycle databases and green footprint metrics.','Carbon Lifecycle Databases','Corporate Sustainability Metrics, Green Footprints','ESG_DATA_DISCREPANCY','compile_sustainability_milestone_reports',false],
  ['Government Relations & Regulatory Compliance Manager','🏛️','Legal','Triggers policy change risk alerts using legislative sizing logs and public policy impact tables.','Legislative Sizing Logs','Public Policy Amendment Rules, Impact Tables','REGULATORY_RISK_DETECTED','trigger_policy_change_risk_alerts',false],
  ['Grant Application & Funding Operations Coordinator','💰','Legal','Checks grant pipeline progression using grant criteria directories and capital allocation mappings.','Grant Criteria Directories','Capital Allocation Mappings, Account Pipelines','GRANT_DEADLINE_IMMINENT','check_grant_pipeline_progression',false],
  ['Whistleblower & Internal Investigation Lead Counsel','🔎','Legal','Tracks investigation documentation records using case severity protocols and audit protection systems.','Case Severity Protocols','Access Layer Defenses, Audit Protection Systems','CONFIDENTIALITY_COMPROMISE','track_investigation_documentation_records',false],
  ['Subsidiary Ledger Reconciler (Global Entities)','📒','Legal','Balances multi-currency financial loops using multi-entity books and FX translation math.','Multi-Entity Financial Books','FX Translation Math, Local Ledger Governance','FX_RECONCILIATION_DESYNC','balance_multi_currency_financial_loops',false],
  ['Enterprise Cyber-Insurance Risk Underwriter','🛡️','Legal','Adjusts cyber risk profiles using exposure analytics sheets and vulnerability score rules.','Exposure Analytics Sheets','Vulnerability Score Rules, Liability Limits','EXPOSURE_THRESHOLD_EXCEEDED','adjust_cyber_risk_profiles',false],
  ['Strategic Board Meeting Communications Facilitator','📋','Legal','Updates board resolution directives using shareholder registry ledgers and voting parameters.','Shareholder Registry Ledgers','Notification Framework Schedules, Voting Parameters','VOTE_QUORUM_NOT_MET','update_board_resolution_directives',false],
];

function toSlug(name) {
  return name.toLowerCase()
    .replace(/[()&]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function escape(s) {
  return s.replace(/'/g, "''");
}

function buildKPIs(code, tool) {
  return JSON.stringify([
    { name: 'Guardrail Code', description: `System exception: ${code}`, unit: 'code', target: 0 },
    { name: 'Primary Function', description: `Executable: ${tool}`, unit: 'fn', target: 1 },
  ]);
}

let sql = `-- 009 Enterprise AI Employee Templates (100 roles from cognitive blueprint)
-- Replaces consumer-friendly roles with enterprise cognitive architecture roles

-- Add enterprise columns if they don't exist
alter table public.employee_templates
  add column if not exists vector_db_scope text,
  add column if not exists guardrail_code text,
  add column if not exists primary_tool text;

-- Clear previous seed data
truncate public.employee_templates restart identity cascade;

insert into public.employee_templates
  (slug, name, emoji, role, department, tagline, description, default_instructions, default_tools, kpis, popular, vector_db_scope, guardrail_code, primary_tool)
values\n`;

const rows = roles.map(([name, emoji, dept, tagline, memory, scope, code, tool, popular]) => {
  const slug = toSlug(name);
  const instructions = SYSTEM_PROMPT(name, memory, scope, code, tool);
  const kpis = buildKPIs(code, tool);
  const tools = `ARRAY['${tool.toUpperCase()}']`;
  return `('${escape(slug)}', '${escape(name)}', '${emoji}', '${escape(name)}', '${dept}', '${escape(tagline)}', '${escape(`Enterprise ${name} cognitive module. Processes ${memory} with semantic scope: ${scope}. Primary executable: ${tool}. Guardrail: ${code}.`)}', '${escape(instructions)}', ${tools}, '${escape(kpis)}'::jsonb, ${popular}, '${escape(`${memory}: ${scope}`)}', '${escape(code)}', '${escape(tool)}')`;
});

sql += rows.join(',\n') + '\non conflict (slug) do update set\n  name = excluded.name, emoji = excluded.emoji, role = excluded.role, department = excluded.department, tagline = excluded.tagline, description = excluded.description, default_instructions = excluded.default_instructions, default_tools = excluded.default_tools, kpis = excluded.kpis, popular = excluded.popular, vector_db_scope = excluded.vector_db_scope, guardrail_code = excluded.guardrail_code, primary_tool = excluded.primary_tool;\n';

fs.writeFileSync('supabase/migrations/009_enterprise_employee_templates.sql', sql);
console.log(`Generated SQL with ${roles.length} roles`);
