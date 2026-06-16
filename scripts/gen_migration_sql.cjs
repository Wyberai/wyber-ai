// Generates SQL migration for dayhoozhjcbppyxdhyua
// Usage: node scripts/gen_migration_sql.cjs > supabase/migrations/011_seed_dayhoozhjcbppyxdhyua.sql

function slugify(name) {
  return name.toLowerCase().replace(/[()&]/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
}
function esc(s) { return s.replace(/'/g, "''") }

const ROWS = [
  ['Growth Marketing Director','📈','Marketing','Maximise blended ROAS and LTV:CAC across every acquisition channel.','Blended ROAS frameworks, LTV:CAC targets, acquisition spend logs.','BUDGET_OVERRUN_ERR','adjust_quarterly_channel_allocation',true],
  ['Performance Marketing Manager','🎯','Marketing','Own paid media bidding, CPA targets, and ad-network API health.','Paid media bidding models, target CPA ranges, ad network APIs.','CPA_SPIKE_ERR','modify_meta_ad_set_budget',true],
  ['SEO & Content Strategist','🔍','Marketing','Build topical authority and defend organic rankings at scale.','Topical authority networks, search intent graphs, keyword maps.','CONTENT_DECAY_ERR','generate_seo_content_brief',false],
  ['Lead Copywriter & Brand Voice Specialist','✍️','Marketing','Produce on-brand, conversion-driven copy across every touchpoint.','Direct-response structures, AIDA conversion matrices, brand books.','STYLE_NON_COMPLIANCE','generate_multivariant_copy',false],
  ['Email Marketing & Lifecycle Specialist','📧','Marketing','Drive retention through deliverability-first email lifecycle programs.','ESP server logs, deliverability metrics, SPF/DKIM/DMARC protocols.','BOUNCE_RATE_EXCEEDED','trigger_behavioral_segmentation',true],
  ['Marketing Data Analyst & Attribution Specialist','📊','Marketing','Resolve attribution gaps and surface actionable revenue signals.','Warehouse data dictionary, multi-touch math models, SQL views.','DATA_DESYNC_GAP','execute_attribution_calculation',false],
  ['Product Marketing Manager (PMM)','🚀','Marketing','Align GTM messaging to product value and competitive positioning.','GTM product specs, competitive feature sets, market personas.','LAUNCH_ALIGNMENT_FAIL','compile_launch_messaging_kit',false],
  ['Conversion Rate Optimization (CRO) Expert','⚡','Marketing','Run statistically valid experiments to compound conversion gains.','Core Web Vitals logs, A/B testing alpha math, user tracking files.','STAT_SIGNIFICANCE_FAIL','deploy_interface_split_test',false],
  ['Social Media & Influencer Relations Manager','📱','Marketing','Amplify brand reach through creator partnerships and platform velocity.','Creator demographic metrics, FTC guideline sheets, trend velocity.','BRAND_SENTIMENT_DROP','route_influencer_attribution_link',false],
  ['Marketing Operations (MarTech) Architect','⚙️','Marketing','Orchestrate the MarTech stack so data flows without gaps or drift.','CDP identity graphs, webhook routing pathways, transformation scripts.','API_THROTTLING_WARN','execute_webhook_translation_loop',false],
  ['Technical Product Manager (TPM)','🗂️','Operations','Prioritise backlogs and own velocity across cross-functional squads.','Product backlog specs, microservice dependency trees, velocity maps.','SPRINT_VELOCITY_DECAY','prioritize_backlog_dependencies',true],
  ['Customer Success Director','🤝','Support','Protect NRR by catching account risk before it becomes churn.','NRR matrices, customer health flags, historical escalation keys.','ACCOUNT_RISK_ALERT','initiate_recovery_intervention',true],
  ['Head of Talent Acquisition & HR Strategy','👥','HR','Scale recruiting pipelines while keeping labour compliance airtight.','Recruitment funnel steps, labor law structures, sourcing patterns.','REQUISITION_STAGNATION','distribute_candidate_brief',false],
  ['Enterprise Sales Operations Lead','💼','Sales','Keep the revenue forecast accurate and the pipeline free of drift.','Forecast formulas, opportunity deal stages, historical pipeline data.','FORECAST_DRIFT_WARN','run_revenue_forecasting_simulation',true],
  ['DevOps & Cloud Infrastructure Architect','☁️','Engineering','Maintain CI/CD health and cloud resource provisioning at scale.','Infrastructure state files, Kubernetes manifest arrays, CI/CD code.','CONTAINER_DEPLOY_FAIL','modify_server_cluster_footprint',false],
  ['Financial Planning & Analytics (FP&A) Manager','💰','Finance','Close the ledger on time and surface variance before it compounds.','General corporate ledger logs, cash flow metrics, tax tables.','EXPENSE_VARIANCE_WARN','validate_monthly_ledger_close',false],
  ['Customer Support Operations Engineer','🎧','Support','Eliminate ticket backlog and route issues to the right tier instantly.','MTTR historical logs, ticket categorization tiers, routing arrays.','BACKLOG_STAGNATION','execute_support_ticket_routing',false],
  ['Supply Chain & Logistics Director','🚚','Logistics','Prevent stockouts and optimise carrier performance across the network.','Warehouse inventory sheets, reorder point formulas, carrier paths.','STOCKOUT_RISK_HIGH','trigger_material_replenishment',false],
  ['Corporate Legal Counsel & Compliance Architect','⚖️','Legal','Keep contracts, GDPR obligations, and governance frameworks in sync.','Contract clauses, compliance regulations (GDPR, SOC2), governance books.','COMPLIANCE_DRIFT','validate_vendor_agreement_clauses',false],
  ['Business Intelligence & Strategy Director','🔮','Operations','Package enterprise KPIs into unified intelligence executives can act on.','Data warehouse dimensional layers, company master KPI logic.','KPI_MISALIGNMENT_ERR','package_unified_operational_metrics',false],
  ['Enterprise IT Security & IAM Specialist','🔐','Engineering','Enforce zero-trust access and revoke stale tokens before they escalate.','Zero-trust access policies, token duration limits, IAM group maps.','PRIVILEGE_ELEVATION','revoke_identity_access_tokens',true],
  ['Creative Production & Brand Design Manager','🎨','Marketing','Ship brand-compliant creative assets at production scale.','Brand asset specifications, design tokens, image format parameters.','ASSET_GEOMETRY_ERR','export_banner_variants',false],
  ['Procurement & Legal Operations Specialist','📋','Operations','Vet vendors fast and flag SLA drift before it costs money.','Vendor SLAs, multi-tier procurement approvals, vendor history.','VENDOR_SLA_BREACH','profile_onboarding_vendor_risk',false],
  ['Enterprise Risk Management & Compliance Auditor','🛡️','Legal','Continuously scan for control exceptions across SOC2 and ISO frameworks.','SOC2 frameworks, ISO27001 tracking files, policy lifecycles.','CONTROL_EXCEPTION','run_compliance_infrastructure_scan',false],
  ['Advanced Data Scientist & Predictive Modeler','🧠','Engineering','Detect model drift and retrain predictive pipelines before accuracy falls.','MLOps drift properties, model schema parameters, prediction weight tables.','MODEL_DRIFT_DETECTED','compute_behavioral_probabilities',false],
  ['Public Relations & Corporate Communications Manager','📰','Marketing','Monitor media velocity and draft crisis responses before narratives spiral.','Media narrative indices, crisis response templates, outlet contacts.','MEDIA_VELOCITY_SPIKE','generate_crisis_coordination_draft',false],
  ['Corporate Governance & Executive Support Specialist','📅','Operations','Protect executive bandwidth through intelligent calendar and priority routing.','Executive prioritization frameworks, calendar buffers, boundary definitions.','CALENDAR_FRAG_WARN','optimize_executive_calendar_buffers',false],
  ['Virtual Event & Digital Experience Operations Director','🎬','Marketing','Deliver flawless livestreams by monitoring encoding metrics in real time.','Video streaming parameters, encoding metrics, webhook response shapes.','STREAM_DEGRADATION','ingest_viewer_intent_metrics',false],
  ['Corporate Travel & Global Mobility Coordinator','✈️','Operations','Flag policy breaches and compliance gaps in travel programmes instantly.','Expense travel rules, regional safety metrics, visa framework guides.','POLICY_BREACH_ALERT','validate_itinerary_compliance',false],
  ['Strategic Facilities & Real Estate Operations Lead','🏢','Operations','Prevent asset decay through proactive maintenance and space optimisation.','Spatial footprint maps, badging histories, preventative utility lists.','ASSET_REPAIR_OVERDUE','generate_preventative_maintenance_task',false],
  ['Site Reliability Engineer (SRE)','🖥️','Engineering','Maintain SLO health and orchestrate automated failover on incident.','SLO/SLA performance thresholds, incident response runbook data.','CLUSTER_QUOTA_FULL','orchestrate_automated_failover',true],
  ['Database Performance Administrator','🗄️','Engineering','Hunt slow queries and enforce indexing discipline across all schemas.','Query optimization maps, indexing rules, sharding configurations.','SLOW_QUERY_DETECTED','optimize_database_indexing',false],
  ['API Ecosystem Product Manager','🔌','Engineering','Guard rate limits and maintain clean endpoint versioning contracts.','REST/GraphQL endpoint guidelines, rate-limiting rules.','RATE_LIMIT_BREACH','generate_endpoint_usage_report',false],
  ['Frontend Performance Engineer','⚡','Engineering','Optimise Core Web Vitals and keep bundle size below thresholds.','Core Web Vitals lifecycles, script asset chunking guidelines.','WEB_VITAL_DEGRADATION','trigger_frontend_bundle_optimization',false],
  ['Mobile Release Operations Lead','📱','Engineering','Ship signed, compliant mobile builds to both stores without delays.','App store submission APIs, signing key rules, build parameters.','BINARY_COMPILE_FAIL','execute_mobile_release_workflow',false],
  ['Data Pipeline Performance Engineer','🔄','Engineering','Prevent Kafka backpressure and keep streaming throughput above SLAs.','Kafka backpressure metrics, data stream routing configurations.','BACKPRESSURE_WARN','optimize_data_stream_throughput',false],
  ['Quality Assurance Automation Lead','✅','Engineering','Block regressions before merge with deterministic E2E automation.','Regression selector trees, E2E test scripts, validation schemas.','REGRESSION_BLOCKER','verify_pull_request_execution',false],
  ['Enterprise Search Systems Architect','🔎','Engineering','Keep vector indexes fresh and semantic search accuracy above baseline.','Vector similarity definitions, token limits, index properties.','INDEX_STALENESS_ERR','update_search_index_catalog',false],
  ['Firmware Deployment Supervisor','📡','Engineering','Roll firmware to IoT fleets securely, with cryptographic validation.','Over-the-air validation keys, IoT fleet cryptographic configurations.','FLEET_AUTH_FAIL','rollout_firmware_fleet_code',false],
  ['Legacy Software Migration Consultant','🔧','Engineering','Decouple monoliths and track debt containment across the codebase.','Decoupling frameworks, dependency code graph references.','TECH_DEBT_MAX_REACHED','track_system_debt_containment',false],
  ['Key Account Growth Director','📊','Sales','Find white-space expansion revenue inside existing enterprise accounts.','White-space account data, multi-contract cross-sell target arrays.','EXPANSION_STAGNATION','generate_expansion_target_map',true],
  ['Inside Sales Velocity Manager','📞','Sales','Accelerate lead-to-close cycles and eliminate cadence stall.','Activity cadences, lead aging protocols, routing tables.','CADENCE_STALL_WARN','reassign_stale_opportunities',false],
  ['Channel & Alliance Partnership Lead','🤝','Sales','Validate partner attribution and keep indirect pipeline data clean.','Partner ecosystem models, attribution validation parameters.','ATTRIBUTION_DISPUTE','verify_partner_pipeline_data',false],
  ['Technical Sales Engineer (Pre-Sales)','🛠️','Sales','Drive POC milestones and track technical evaluations to close.','System POC success benchmarks, sandbox orchestration maps.','POC_MILESTONE_DELAY','track_technical_evaluation_metrics',false],
  ['RFP Response Operations Coordinator','📝','Sales','Populate RFP responses accurately and never miss a submission SLA.','Technical proposal taxonomy, compliance statement parameters.','PROPOSAL_SLA_WARN','populate_technical_response_fields',false],
  ['Sales Commission & Incentive Auditor','💵','Sales','Audit payout calculations and catch commission errors before close.','Sales quota matrices, splitting rules, contract payout logs.','COMMISSION_CALC_ERR','audit_sales_incentive_payouts',false],
  ['Customer Onboarding Specialist','🎯','Support','Accelerate time-to-value and escalate implementation blockers early.','Time-to-value paths, system provisioning steps, adoption targets.','ONBOARDING_STALL','escalate_implementation_blockers',false],
  ['Inbound Lead Routing Administrator','🔀','Sales','Assign leads instantly with zero routing latency or queue buildup.','Round-robin routing limits, corporate domain score definitions.','QUEUE_LATENCY_ALERT','execute_lead_router_assignment',false],
  ['Sales Enablement Content Specialist','📚','Sales','Measure collateral performance and retire low-engagement assets.','Playbook asset metrics, competitor battlecard property frameworks.','ENGAGEMENT_DROP_WARN','evaluate_collateral_performance',false],
  ['Renewal Operations Analyst','🔁','Sales','Catch renewal desync and extend contract baselines before lapse.','Automated renewal rules, churn predictive indicators.','RENEWAL_DESYNC_ERR','extend_contract_baseline',false],
  ['E-Commerce Merchandising Director','🛍️','Commerce','Optimise storefront sort algorithms to maximise margin per listing.','Storefront layout schemas, margin sorting parameters, category trees.','SORT_ALGO_DEGRADATION','update_storefront_category_sorting',true],
  ['Inventory Allocation Analyst','📦','Commerce','Rebalance fulfilment locations to prevent misallocation and dead stock.','Multi-warehouse footprints, geometric capacity maps, safety buffers.','STOCK_MISALLOCATION','rebalance_fulfillment_locations',false],
  ['Shopping Cart Abandonment Optimizer','🛒','Commerce','Recover abandoned carts with precision-timed exit-intent triggers.','Cart abandonment logs, exit intent signatures, promotional triggers.','ABANDON_SPIKE_ALERT','update_checkout_recovery_pipeline',false],
  ['Subscription Box Operations Lead','📮','Commerce','Generate accurate subscription batches and keep inventory curated.','Batch processing patterns, inventory curation properties.','BATCH_PROCESSING_ERR','generate_subscription_order_batch',false],
  ['Digital Marketplace Accounts Manager','🏪','Commerce','Defend buy-box positioning and detect listing suppression early.','Buy-box positioning metrics, API status mappings for channels.','LISTING_SUPPRESSION','check_channel_listing_status',false],
  ['Retail Point-of-Sale (POS) Integrator','🖥️','Commerce','Sync omnichannel inventory and prevent POS ledger desync in real time.','Real-time omnichannel synchronization structures, inventory ledgers.','POS_LEDGER_DESYNC','sync_omnichannel_stock_levels',false],
  ['Customer Review & Social Proof Moderator','⭐','Commerce','Detect fraudulent reviews and escalate sentiment risk before it spreads.','Fraud footprint profiles, sentiment token rules, text spam models.','FRAUD_REVIEW_DETECTED','escalate_negative_review_ticket',false],
  ['Reverse Logistics & Returns Specialist','↩️','Commerce','Classify returns fast, restock clean, and flag backlog anomalies.','Return workflows, product restocking safety bounds, refund criteria.','RETURNS_BACKLOG_WARN','log_return_classification_status',false],
  ['Wholesale B2B Platform Coordinator','🏭','Commerce','Approve purchase orders and enforce credit limits across B2B accounts.','Tiered pricing rules, corporate credit allocations, purchase history.','CREDIT_LIMIT_EXCEPT','approve_wholesale_purchase_order',false],
  ['Flash Sale & Promo Load Planner','⚡','Commerce','Pre-size infrastructure for high-traffic events and prevent inventory lock.','High-traffic thresholds, database lock queues, server capacity limits.','INVENTORY_LOCK_FAIL','modify_storefront_promotional_rules',false],
  ['Voice of Customer (VoC) Lead Analyst','🗣️','Support','Distil CSAT and NPS signals into structural product improvement drivers.','CSAT/NPS text corpuses, core structural driver configurations.','VOC_DATA_DEGRADATION','update_feedback_loop_summaries',false],
  ['Customer Support Knowledge Architect','📖','Support','Keep the knowledge base current and kill article staleness before it costs tickets.','Document classification rules, structural knowledge schemas.','ARTICLE_STALENESS','remind_internal_content_update',false],
  ['VIP & Enterprise Support Escalation Engineer','🚨','Support','Handle critical account incidents with SLA breach awareness and speed.','SLA violation thresholds, disaster parameters, premium account flags.','SLA_BREACH_IMMINENT','handle_critical_account_incident',true],
  ['Self-Service Portal Product Manager','💻','Support','Improve deflection rates by optimising self-service path design.','Help widget click trajectories, customer path deflection models.','DEFLECTION_RATE_DROP','adjust_self_service_paths',false],
  ['Community Forum Engagement Manager','💬','Support','Moderate forum threads and escalate unanswered spikes before churn risk rises.','Thread moderation scripts, text flag profiles, target response times.','UNMODERATED_SPIKE','escalate_unanswered_user_thread',false],
  ['Customer Loyalty & Rewards Program Administrator','🏆','Support','Monitor points liability and audit rewards configuration for exposure risk.','Points database definitions, company reward asset books.','LIABILITY_SPIKE_ERR','audit_rewards_configuration',false],
  ['Multilingual Support Translation Coordinator','🌍','Support','Deliver low-latency translated support across every language tier.','Translation maps, linguistic grammar engines, glossary metrics.','TRANSLATION_LATENCY','log_live_support_translations',false],
  ['Customer Churn Re-engagement Specialist','🔄','Support','Win back lapsed accounts before the re-engagement window closes.','Re-engagement templates, win-back targeting triggers, user behavior.','WINBACK_ROI_DROP','execute_lapsed_customer_outreach',false],
  ['Support Team Capacity Planner','📐','Support','Model staffing needs against inbound volume and prevent queue overflow.','Staff allocation matrix parameters, arrival rate calculations.','QUEUE_OVERFLOW_WARN','update_support_staffing_model',false],
  ['Customer Offboarding & Exit Interview Auditor','🚪','Support','Capture cancellation rationale data and fill pipeline offboarding gaps.','Cancellation rationale tags, pipeline offboarding documentation.','EXIT_DATA_MISSING','evaluate_account_closure_metrics',false],
  ['People Analytics & Workforce Data Scientist','📊','HR','Detect flight-risk signals and inform retention strategy with data.','Retention probability formulas, internal operational movement paths.','FLIGHT_RISK_SPIKE','review_workforce_retention_risks',false],
  ['Employee Onboarding Experience Supervisor','🎓','HR','Hit onboarding SLAs and keep credential provisioning on track.','Technical credential parameters, standard onboarding checkpoints.','ONBOARDING_SLA_BREACH','iterate_employee_onboarding_check',false],
  ['Compensation & Benefits Market Analyst','💰','HR','Surface pay parity gaps and keep bands anchored to market rates.','Industry market rates, equity balance bands, geographic cost sets.','COMP_PARITY_WARN','adjust_compensation_strategy',false],
  ['Corporate Learning & Development Manager','📚','HR','Assign training paths and monitor certification completion rates.','Course requirements, educational materials, test passing scores.','CERTIFICATION_DROP','assign_employee_training_path',false],
  ['Employee Performance Evaluation Administrator','📋','HR','Track evaluation cycle milestones and prevent deadline misses.','Corporate goal tracking metrics, review calendar rules.','EVALUATION_DEADLINE','check_evaluation_cycle_milestones',false],
  ['Internal Communications & Employee Engagement Lead','📢','HR','Distribute internal summaries and monitor engagement score drift.','Cultural sentiment indices, corporate info-distribution templates.','ENGAGEMENT_DROP','update_internal_company_summaries',false],
  ['HR Compliance & Policy Enforcer','⚖️','HR','Track EEOC and labour policy exceptions before they become violations.','EEOC rules, labor requirement charts, data protection logs.','POLICY_NON_COMPLIANCE','track_hr_regulatory_exceptions',false],
  ['Contractor & Vendor Management Specialist','🤝','HR','Classify contractors correctly and verify payment status on time.','Freelance classification frameworks, master vendor agreements.','CLASSIFICATION_WARN','verify_contractor_payment_status',false],
  ['Employee Offboarding & Asset Retrieval Specialist','📦','HR','Execute access teardowns and asset retrieval without delay or gap.','Physical asset registries, access teardown timelines, shipping steps.','RETRIEVAL_DELAY_ERR','verify_access_teardown_status',false],
  ['Diversity, Equity & Inclusion (DEI) Metrics Analyst','🌈','HR','Surface parity mismatches across the sourcing pipeline with data.','Recruitment pipeline charts, demographic safety indices.','PARITY_MISMATCH_WARN','check_organizational_parity_standards',false],
  ['Global Freight Forwarding Coordinator','🚢','Logistics','Track international shipments and alert on customs or transit delay.','Customs law parameters, cargo space schemas, international paths.','FREIGHT_DELAY_ALERT','scan_international_shipment_location',false],
  ['Warehouse Layout & Spatial Efficiency Engineer','🏗️','Logistics','Reduce pick-path distance and optimise bin slotting for throughput.','Bin coordinate geometries, pick-path equations, slotting models.','PICK_PATH_INEFFICIENCY','run_spatial_configuration_models',false],
  ['Predictive Procurement Forecasting Analyst','📈','Logistics','Anticipate supply gaps and execute replenishment before lead-time drift.','Capital constraints, lead-time matrices, dynamic supply properties.','LEAD_TIME_DESYNC','execute_replenishment_purchases',false],
  ['Hazardous Materials Compliance Supervisor','⚠️','Logistics','Validate HazMat tracking compliance against OSHA storage codes.','OSHA hazardous guidelines, packaging criteria, storage codes.','HAZMAT_TRACK_FAIL','validate_safety_compliance_tracks',false],
  ['Cold Chain Lifecycle Logistics Specialist','❄️','Logistics','Monitor thermal excursions and mitigate cold chain exceptions in real time.','Temperature thresholds, cold chain alert limits, sensor configurations.','THERMAL_EXCURSION','handle_thermal_exception_mitigation',false],
  ['Carrier Performance & Rate Auditor','🚛','Logistics','Calculate carrier billing variance and catch invoice discrepancies early.','Shipping transit records, billing verification rules, invoice math.','BILLING_DISCREPANCY','calculate_carrier_billing_variance',false],
  ['Customs Brokerage & Tariffs Specialist','🛃','Logistics','Classify goods to the correct HTS code and prevent duty mismatches.','Harmonized Tariff codebooks, tax structure metrics, trade maps.','TARIFF_CODE_MISMATCH','validate_cross_border_duty_metrics',false],
  ['Manufacturing Plant Capacity Scheduler','🏭','Logistics','Prevent machine over-allocation and keep production schedules aligned.','Equipment capacity limits, production run rules, bill of materials.','MACHINE_OVERALLOC','modify_production_machine_schedules',false],
  ['Supplier Risk & Sustainability Auditor','🌿','Logistics','Audit supplier records against ESG indices and flag risk breach.','Carbon impact guidelines, ethical procurement indices, risk trees.','SUPPLIER_RISK_BREACH','audit_supplier_validation_records',false],
  ['Last-Mile Delivery Network Optimizer','📍','Logistics','Plan efficient local routes and close delivery window misses.','Local delivery map constraints, route calculation paths.','DELIVERY_WINDOW_MISS','plan_local_route_efficiency',false],
  ['Corporate Data Privacy & GDPR Officer','🔒','Legal','Route privacy remediation actions and enforce GDPR/CCPA compliance.','GDPR/CCPA guidelines, data maps, user deletion profiles.','PRIVACY_BREACH_ERR','route_privacy_remediation_actions',false],
  ['Intellectual Property & Patent Portfolio Manager','💡','Legal','Track IP renewal milestones and prevent expiration window closures.','Trademark regulations, patent expiration steps, filing guidelines.','RENEWAL_WINDOW_CLOSE','track_ip_renewal_milestones',false],
  ['Business Continuity & Disaster Recovery Architect','🛡️','Legal','Test failover pipelines and validate RTO/RPO targets under load.','RTO/RPO target models, emergency pipeline mapping definitions.','FAILOVER_TELEMETRY_FAIL','test_disaster_recovery_failover',false],
  ['ESG Reporting Lead','🌱','Legal','Compile sustainability milestone reports against carbon accounting frameworks.','Carbon accounting frameworks, environmental impact databases.','ESG_DATA_DISCREPANCY','compile_sustainability_milestone_reports',false],
  ['Government Relations & Regulatory Compliance Manager','🏛️','Legal','Monitor policy timelines and trigger alerts on regulatory risk changes.','Public policy timelines, dynamic compliance amendment tables.','REGULATORY_RISK','trigger_policy_change_risk_alerts',false],
  ['Grant Application & Funding Operations Coordinator','💳','Legal','Track grant pipeline progression and surface deadline warnings early.','Funding source parameters, pipeline tracking files, milestone rules.','GRANT_DEADLINE_WARN','check_grant_pipeline_progression',false],
  ['Whistleblower & Internal Investigation Lead Counsel','🔍','Legal','Track investigation records with confidentiality and audit integrity.','Case privacy codes, encrypted storage security properties.','CONFIDENTIALITY_FAIL','track_investigation_documentation_records',false],
  ['Subsidiary Ledger Reconciler (Global Entities)','🌐','Finance','Balance multi-currency financial loops and reconcile FX conversion gaps.','FX conversion tracking models, localization asset rules.','FX_RECONCILIATION_FAIL','balance_multi_currency_financial_loops',false],
  ['Enterprise Cyber-Insurance Risk Underwriter','🔑','Legal','Adjust cyber risk profiles against exposure limits and vulnerability metrics.','Corporate vulnerability metrics, liability cap constraints.','EXPOSURE_LIMIT_BREACH','adjust_cyber_risk_profiles',false],
  ['Strategic Board Meeting Communications Facilitator','🏛️','Legal','Update board resolution directives and validate voting quorum parameters.','Governance notification rules, voting quorum parameters, bylaws.','VOTE_QUORUM_FAIL','update_board_resolution_directives',false],
]

const lines = ROWS.map(([name, emoji, dept, tagline, vdb, code, tool, popular]) => {
  const s = slugify(name)
  const di = `You are ${name}, an AI-powered enterprise specialist. Your vector DB scope covers: ${vdb} Your primary guardrail code is ${code}. Your primary executable function is ${tool}(). Operate with precision, surface insights proactively, and escalate when guardrail thresholds are breached.`
  return `  ('${esc(s)}', '${esc(name)}', '${esc(name)}', '${emoji}', '${esc(dept)}', '${esc(tagline)}', '${esc(vdb)}', '${esc(code)}', '${esc(tool)}', ${popular}, '${esc(di)}')`
})

const sql = `-- ============================================================
-- WyberAI employee_templates seed for project dayhoozhjcbppyxdhyua
-- Paste into: https://supabase.com/dashboard/project/dayhoozhjcbppyxdhyua/sql/new
-- ============================================================

-- 1. Ensure table exists
CREATE TABLE IF NOT EXISTS public.employee_templates (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                 text UNIQUE NOT NULL,
  name                 text NOT NULL,
  emoji                text NOT NULL DEFAULT '🤖',
  department           text NOT NULL,
  tagline              text NOT NULL DEFAULT '',
  vector_db_scope      text NOT NULL DEFAULT '',
  guardrail_code       text NOT NULL DEFAULT '',
  primary_tool         text NOT NULL DEFAULT '',
  popular              boolean NOT NULL DEFAULT false,
  default_instructions text NOT NULL DEFAULT '',
  created_at           timestamptz NOT NULL DEFAULT now()
);

-- 2. Grants
GRANT ALL ON public.employee_templates TO service_role;
GRANT SELECT ON public.employee_templates TO anon, authenticated;

-- 3. RLS
ALTER TABLE public.employee_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anyone can read employee_templates" ON public.employee_templates;
CREATE POLICY "anyone can read employee_templates"
  ON public.employee_templates FOR SELECT USING (true);

-- 4. Upsert 100 canonical roles
INSERT INTO public.employee_templates
  (slug, name, role, emoji, department, tagline, vector_db_scope, guardrail_code, primary_tool, popular, default_instructions)
VALUES
${lines.join(',\n')}
ON CONFLICT (slug) DO UPDATE SET
  name                 = EXCLUDED.name,
  role                 = EXCLUDED.role,
  emoji                = EXCLUDED.emoji,
  department           = EXCLUDED.department,
  tagline              = EXCLUDED.tagline,
  vector_db_scope      = EXCLUDED.vector_db_scope,
  guardrail_code       = EXCLUDED.guardrail_code,
  primary_tool         = EXCLUDED.primary_tool,
  popular              = EXCLUDED.popular,
  default_instructions = EXCLUDED.default_instructions;

-- 5. Verify
SELECT department, count(*) as roles FROM public.employee_templates GROUP BY department ORDER BY department;
`

require('fs').writeFileSync('supabase/migrations/011_seed_dayhoozhjcbppyxdhyua.sql', sql, 'utf8')
console.log('Written to supabase/migrations/011_seed_dayhoozhjcbppyxdhyua.sql')
console.log('Rows:', ROWS.length)
