const fs = require('fs');

// slug generator (must match original)
function toSlug(name) {
  return name.toLowerCase()
    .replace(/[()&]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function e(s) { return s.replace(/'/g, "''"); }

// Canonical data: [name, vdb, code, tool]
const canonical = [
  // 1-10 Digital Marketing
  ['Growth Marketing Director',                           'Blended ROAS frameworks, LTV:CAC targets, acquisition spend logs.',                    'BUDGET_OVERRUN_ERR',           'adjust_quarterly_channel_allocation'],
  ['Performance Marketing Manager',                       'Paid media bidding models, target CPA ranges, ad network APIs.',                       'CPA_SPIKE_ERR',                'modify_meta_ad_set_budget'],
  ['SEO & Content Strategist',                            'Topical authority networks, search intent graphs, keyword maps.',                       'CONTENT_DECAY_ERR',            'generate_seo_content_brief'],
  ['Lead Copywriter & Brand Voice Specialist',            'Direct-response structures, AIDA conversion matrices, brand books.',                   'STYLE_NON_COMPLIANCE',         'generate_multivariant_copy'],
  ['Email Marketing & Lifecycle Specialist',              'ESP server logs, deliverability metrics, SPF/DKIM/DMARC protocols.',                   'BOUNCE_RATE_EXCEEDED',         'trigger_behavioral_segmentation'],
  ['Marketing Data Analyst & Attribution Specialist',     'Warehouse data dictionary, multi-touch math models, SQL views.',                       'DATA_DESYNC_GAP',              'execute_attribution_calculation'],
  ['Product Marketing Manager (PMM)',                     'GTM product specs, competitive feature sets, market personas.',                         'LAUNCH_ALIGNMENT_FAIL',        'compile_launch_messaging_kit'],
  ['Conversion Rate Optimization (CRO) Expert',          'Core Web Vitals logs, A/B testing alpha math, user tracking files.',                   'STAT_SIGNIFICANCE_FAIL',       'deploy_interface_split_test'],
  ['Social Media & Influencer Relations Manager',         'Creator demographic metrics, FTC guideline sheets, trend velocity.',                   'BRAND_SENTIMENT_DROP',         'route_influencer_attribution_link'],
  ['Marketing Operations (MarTech) Architect',            'CDP identity graphs, webhook routing pathways, transformation scripts.',               'API_THROTTLING_WARN',          'execute_webhook_translation_loop'],

  // 11-20 Cross-Functional Leadership
  ['Technical Product Manager (TPM)',                     'Product backlog specs, microservice dependency trees, velocity maps.',                 'SPRINT_VELOCITY_DECAY',        'prioritize_backlog_dependencies'],
  ['Customer Success Director',                           'NRR matrices, customer health flags, historical escalation keys.',                     'ACCOUNT_RISK_ALERT',           'initiate_recovery_intervention'],
  ['Head of Talent Acquisition & HR Strategy',            'Recruitment funnel steps, labor law structures, sourcing patterns.',                   'REQUISITION_STAGNATION',       'distribute_candidate_brief'],
  ['Enterprise Sales Operations Lead',                    'Forecast formulas, opportunity deal stages, historical pipeline data.',               'FORECAST_DRIFT_WARN',          'run_revenue_forecasting_simulation'],
  ['DevOps & Cloud Infrastructure Architect',             'Infrastructure state files, Kubernetes manifest arrays, CI/CD code.',                 'CONTAINER_DEPLOY_FAIL',        'modify_server_cluster_footprint'],
  ['Financial Planning & Analytics (FP&A) Manager',      'General corporate ledger logs, cash flow metrics, tax tables.',                       'EXPENSE_VARIANCE_WARN',        'validate_monthly_ledger_close'],
  ['Customer Support Operations Engineer',                'MTTR historical logs, ticket categorization tiers, routing arrays.',                  'BACKLOG_STAGNATION',           'execute_support_ticket_routing'],
  ['Supply Chain & Logistics Director',                   'Warehouse inventory sheets, reorder point formulas, carrier paths.',                  'STOCKOUT_RISK_HIGH',           'trigger_material_replenishment'],
  ['Corporate Legal Counsel & Compliance Architect',      'Contract clauses, compliance regulations (GDPR, SOC2), governance books.',            'COMPLIANCE_DRIFT',             'validate_vendor_agreement_clauses'],
  ['Business Intelligence & Strategy Director',           'Data warehouse dimensional layers, company master KPI logic.',                        'KPI_MISALIGNMENT_ERR',         'package_unified_operational_metrics'],

  // 21-30 Infrastructure & Security
  ['Enterprise IT Security & IAM Specialist',             'Zero-trust access policies, token duration limits, IAM group maps.',                  'PRIVILEGE_ELEVATION',          'revoke_identity_access_tokens'],
  ['Creative Production & Brand Design Manager',          'Brand asset specifications, design tokens, image format parameters.',                 'ASSET_GEOMETRY_ERR',           'export_banner_variants'],
  ['Procurement & Legal Operations Specialist',           'Vendor SLAs, multi-tier procurement approvals, vendor history.',                      'VENDOR_SLA_BREACH',            'profile_onboarding_vendor_risk'],
  ['Enterprise Risk Management & Compliance Auditor',     'SOC2 frameworks, ISO27001 tracking files, policy lifecycles.',                        'CONTROL_EXCEPTION',            'run_compliance_infrastructure_scan'],
  ['Advanced Data Scientist & Predictive Modeler',        'MLOps drift properties, model schema parameters, prediction weight tables.',          'MODEL_DRIFT_DETECTED',         'compute_behavioral_probabilities'],
  ['Public Relations & Corporate Communications Manager', 'Media narrative indices, crisis response templates, outlet contacts.',               'MEDIA_VELOCITY_SPIKE',         'generate_crisis_coordination_draft'],
  ['Corporate Governance & Executive Support Specialist', 'Executive prioritization frameworks, calendar buffers, boundary definitions.',        'CALENDAR_FRAG_WARN',           'optimize_executive_calendar_buffers'],
  ['Virtual Event & Digital Experience Operations Director','Video streaming parameters, encoding metrics, webhook response shapes.',            'STREAM_DEGRADATION',           'ingest_viewer_intent_metrics'],
  ['Corporate Travel & Global Mobility Coordinator',      'Expense travel rules, regional safety metrics, visa framework guides.',              'POLICY_BREACH_ALERT',          'validate_itinerary_compliance'],
  ['Strategic Facilities & Real Estate Operations Lead',  'Spatial footprint maps, badging histories, preventative utility lists.',             'ASSET_REPAIR_OVERDUE',         'generate_preventative_maintenance_task'],

  // 31-40 Core Engineering
  ['Site Reliability Engineer (SRE)',                     'SLO/SLA performance thresholds, incident response runbook data.',                    'CLUSTER_QUOTA_FULL',           'orchestrate_automated_failover'],
  ['Database Performance Administrator',                  'Query optimization maps, indexing rules, sharding configurations.',                  'SLOW_QUERY_DETECTED',          'optimize_database_indexing'],
  ['API Ecosystem Product Manager',                       'REST/GraphQL endpoint guidelines, rate-limiting rules.',                             'RATE_LIMIT_BREACH',            'generate_endpoint_usage_report'],
  ['Frontend Performance Engineer',                       'Core Web Vitals lifecycles, script asset chunking guidelines.',                      'WEB_VITAL_DEGRADATION',        'trigger_frontend_bundle_optimization'],
  ['Mobile Release Operations Lead',                      'App store submission APIs, signing key rules, build parameters.',                    'BINARY_COMPILE_FAIL',          'execute_mobile_release_workflow'],
  ['Data Pipeline Performance Engineer',                  'Kafka backpressure metrics, data stream routing configurations.',                    'BACKPRESSURE_WARN',            'optimize_data_stream_throughput'],
  ['Quality Assurance Automation Lead',                   'Regression selector trees, E2E test scripts, validation schemas.',                   'REGRESSION_BLOCKER',           'verify_pull_request_execution'],
  ['Enterprise Search Systems Architect',                 'Vector similarity definitions, token limits, index properties.',                     'INDEX_STALENESS_ERR',          'update_search_index_catalog'],
  ['Firmware Deployment Supervisor',                      'Over-the-air validation keys, IoT fleet cryptographic configurations.',             'FLEET_AUTH_FAIL',              'rollout_firmware_fleet_code'],
  ['Legacy Software Migration Consultant',                'Decoupling frameworks, dependency code graph references.',                           'TECH_DEBT_MAX_REACHED',        'track_system_debt_containment'],

  // 41-50 Commercial Sales
  ['Key Account Growth Director',                         'White-space account data, multi-contract cross-sell target arrays.',                 'EXPANSION_STAGNATION',         'generate_expansion_target_map'],
  ['Inside Sales Velocity Manager',                       'Activity cadences, lead aging protocols, routing tables.',                           'CADENCE_STALL_WARN',           'reassign_stale_opportunities'],
  ['Channel & Alliance Partnership Lead',                 'Partner ecosystem models, attribution validation parameters.',                       'ATTRIBUTION_DISPUTE',          'verify_partner_pipeline_data'],
  ['Technical Sales Engineer (Pre-Sales)',                'System POC success benchmarks, sandbox orchestration maps.',                         'POC_MILESTONE_DELAY',          'track_technical_evaluation_metrics'],
  ['RFP Response Operations Coordinator',                 'Technical proposal taxonomy, compliance statement parameters.',                      'PROPOSAL_SLA_WARN',            'populate_technical_response_fields'],
  ['Sales Commission & Incentive Auditor',                'Sales quota matrices, splitting rules, contract payout logs.',                       'COMMISSION_CALC_ERR',          'audit_sales_incentive_payouts'],
  ['Customer Onboarding Specialist',                      'Time-to-value paths, system provisioning steps, adoption targets.',                  'ONBOARDING_STALL',             'escalate_implementation_blockers'],
  ['Inbound Lead Routing Administrator',                  'Round-robin routing limits, corporate domain score definitions.',                    'QUEUE_LATENCY_ALERT',          'execute_lead_router_assignment'],
  ['Sales Enablement Content Specialist',                 'Playbook asset metrics, competitor battlecard property frameworks.',                 'ENGAGEMENT_DROP_WARN',         'evaluate_collateral_performance'],
  ['Renewal Operations Analyst',                          'Automated renewal rules, churn predictive indicators.',                             'RENEWAL_DESYNC_ERR',           'extend_contract_baseline'],

  // 51-60 E-Commerce
  ['E-Commerce Merchandising Director',                   'Storefront layout schemas, margin sorting parameters, category trees.',              'SORT_ALGO_DEGRADATION',        'update_storefront_category_sorting'],
  ['Inventory Allocation Analyst',                        'Multi-warehouse footprints, geometric capacity maps, safety buffers.',              'STOCK_MISALLOCATION',          'rebalance_fulfillment_locations'],
  ['Shopping Cart Abandonment Optimizer',                 'Cart abandonment logs, exit intent signatures, promotional triggers.',              'ABANDON_SPIKE_ALERT',          'update_checkout_recovery_pipeline'],
  ['Subscription Box Operations Lead',                    'Batch processing patterns, inventory curation properties.',                         'BATCH_PROCESSING_ERR',         'generate_subscription_order_batch'],
  ['Digital Marketplace Accounts Manager',                'Buy-box positioning metrics, API status mappings for channels.',                    'LISTING_SUPPRESSION',          'check_channel_listing_status'],
  ['Retail Point-of-Sale (POS) Integrator',               'Real-time omnichannel synchronization structures, inventory ledgers.',             'POS_LEDGER_DESYNC',            'sync_omnichannel_stock_levels'],
  ['Customer Review & Social Proof Moderator',            'Fraud footprint profiles, sentiment token rules, text spam models.',               'FRAUD_REVIEW_DETECTED',        'escalate_negative_review_ticket'],
  ['Reverse Logistics & Returns Specialist',              'Return workflows, product restocking safety bounds, refund criteria.',              'RETURNS_BACKLOG_WARN',         'log_return_classification_status'],
  ['Wholesale B2B Platform Coordinator',                  'Tiered pricing rules, corporate credit allocations, purchase history.',             'CREDIT_LIMIT_EXCEPT',          'approve_wholesale_purchase_order'],
  ['Flash Sale & Promo Load Planner',                     'High-traffic thresholds, database lock queues, server capacity limits.',           'INVENTORY_LOCK_FAIL',          'modify_storefront_promotional_rules'],

  // 61-70 Customer Experience
  ['Voice of Customer (VoC) Lead Analyst',               'CSAT/NPS text corpuses, core structural driver configurations.',                    'VOC_DATA_DEGRADATION',         'update_feedback_loop_summaries'],
  ['Customer Support Knowledge Architect',                'Document classification rules, structural knowledge schemas.',                      'ARTICLE_STALENESS',            'remind_internal_content_update'],
  ['VIP & Enterprise Support Escalation Engineer',        'SLA violation thresholds, disaster parameters, premium account flags.',             'SLA_BREACH_IMMINENT',          'handle_critical_account_incident'],
  ['Self-Service Portal Product Manager',                 'Help widget click trajectories, customer path deflection models.',                  'DEFLECTION_RATE_DROP',         'adjust_self_service_paths'],
  ['Community Forum Engagement Manager',                  'Thread moderation scripts, text flag profiles, target response times.',             'UNMODERATED_SPIKE',            'escalate_unanswered_user_thread'],
  ['Customer Loyalty & Rewards Program Administrator',    'Points database definitions, company reward asset books.',                         'LIABILITY_SPIKE_ERR',          'audit_rewards_configuration'],
  ['Multilingual Support Translation Coordinator',        'Translation maps, linguistic grammar engines, glossary metrics.',                   'TRANSLATION_LATENCY',          'log_live_support_translations'],
  ['Customer Churn Re-engagement Specialist',             'Re-engagement templates, win-back targeting triggers, user behavior.',              'WINBACK_ROI_DROP',             'execute_lapsed_customer_outreach'],
  ['Support Team Capacity Planner',                       'Staff allocation matrix parameters, arrival rate calculations.',                    'QUEUE_OVERFLOW_WARN',          'update_support_staffing_model'],
  ['Customer Offboarding & Exit Interview Auditor',       'Cancellation rationale tags, pipeline offboarding documentation.',                 'EXIT_DATA_MISSING',            'evaluate_account_closure_metrics'],

  // 71-80 HR
  ['People Analytics & Workforce Data Scientist',         'Retention probability formulas, internal operational movement paths.',              'FLIGHT_RISK_SPIKE',            'review_workforce_retention_risks'],
  ['Employee Onboarding Experience Supervisor',           'Technical credential parameters, standard onboarding checkpoints.',                'ONBOARDING_SLA_BREACH',        'iterate_employee_onboarding_check'],
  ['Compensation & Benefits Market Analyst',              'Industry market rates, equity balance bands, geographic cost sets.',               'COMP_PARITY_WARN',             'adjust_compensation_strategy'],
  ['Corporate Learning & Development Manager',            'Course requirements, educational materials, test passing scores.',                  'CERTIFICATION_DROP',           'assign_employee_training_path'],
  ['Employee Performance Evaluation Administrator',       'Corporate goal tracking metrics, review calendar rules.',                          'EVALUATION_DEADLINE',          'check_evaluation_cycle_milestones'],
  ['Internal Communications & Employee Engagement Lead',  'Cultural sentiment indices, corporate info-distribution templates.',               'ENGAGEMENT_DROP',              'update_internal_company_summaries'],
  ['HR Compliance & Policy Enforcer',                     'EEOC rules, labor requirement charts, data protection logs.',                      'POLICY_NON_COMPLIANCE',        'track_hr_regulatory_exceptions'],
  ['Contractor & Vendor Management Specialist',           'Freelance classification frameworks, master vendor agreements.',                   'CLASSIFICATION_WARN',          'verify_contractor_payment_status'],
  ['Employee Offboarding & Asset Retrieval Specialist',   'Physical asset registries, access teardown timelines, shipping steps.',            'RETRIEVAL_DELAY_ERR',          'verify_access_teardown_status'],
  ['Diversity, Equity & Inclusion (DEI) Metrics Analyst', 'Recruitment pipeline charts, demographic safety indices.',                        'PARITY_MISMATCH_WARN',         'check_organizational_parity_standards'],

  // 81-90 Supply Chain
  ['Global Freight Forwarding Coordinator',               'Customs law parameters, cargo space schemas, international paths.',                'FREIGHT_DELAY_ALERT',          'scan_international_shipment_location'],
  ['Warehouse Layout & Spatial Efficiency Engineer',      'Bin coordinate geometries, pick-path equations, slotting models.',                'PICK_PATH_INEFFICIENCY',       'run_spatial_configuration_models'],
  ['Predictive Procurement Forecasting Analyst',          'Capital constraints, lead-time matrices, dynamic supply properties.',              'LEAD_TIME_DESYNC',             'execute_replenishment_purchases'],
  ['Hazardous Materials Compliance Supervisor',           'OSHA hazardous guidelines, packaging criteria, storage codes.',                   'HAZMAT_TRACK_FAIL',            'validate_safety_compliance_tracks'],
  ['Cold Chain Lifecycle Logistics Specialist',           'Temperature thresholds, cold chain alert limits, sensor configurations.',         'THERMAL_EXCURSION',            'handle_thermal_exception_mitigation'],
  ['Carrier Performance & Rate Auditor',                  'Shipping transit records, billing verification rules, invoice math.',             'BILLING_DISCREPANCY',          'calculate_carrier_billing_variance'],
  ['Customs Brokerage & Tariffs Specialist',              'Harmonized Tariff codebooks, tax structure metrics, trade maps.',                 'TARIFF_CODE_MISMATCH',         'validate_cross_border_duty_metrics'],
  ['Manufacturing Plant Capacity Scheduler',              'Equipment capacity limits, production run rules, bill of materials.',             'MACHINE_OVERALLOC',            'modify_production_machine_schedules'],
  ['Supplier Risk & Sustainability Auditor',              'Carbon impact guidelines, ethical procurement indices, risk trees.',              'SUPPLIER_RISK_BREACH',         'audit_supplier_validation_records'],
  ['Last-Mile Delivery Network Optimizer',                'Local delivery map constraints, route calculation paths.',                        'DELIVERY_WINDOW_MISS',         'plan_local_route_efficiency'],

  // 91-100 Legal/Governance
  ['Corporate Data Privacy & GDPR Officer',               'GDPR/CCPA guidelines, data maps, user deletion profiles.',                        'PRIVACY_BREACH_ERR',           'route_privacy_remediation_actions'],
  ['Intellectual Property & Patent Portfolio Manager',    'Trademark regulations, patent expiration steps, filing guidelines.',              'RENEWAL_WINDOW_CLOSE',         'track_ip_renewal_milestones'],
  ['Business Continuity & Disaster Recovery Architect',   'RTO/RPO target models, emergency pipeline mapping definitions.',                  'FAILOVER_TELEMETRY_FAIL',      'test_disaster_recovery_failover'],
  ['ESG Reporting Lead',                                  'Carbon accounting frameworks, environmental impact databases.',                   'ESG_DATA_DISCREPANCY',         'compile_sustainability_milestone_reports'],
  ['Government Relations & Regulatory Compliance Manager','Public policy timelines, dynamic compliance amendment tables.',                   'REGULATORY_RISK',              'trigger_policy_change_risk_alerts'],
  ['Grant Application & Funding Operations Coordinator',  'Funding source parameters, pipeline tracking files, milestone rules.',           'GRANT_DEADLINE_WARN',          'check_grant_pipeline_progression'],
  ['Whistleblower & Internal Investigation Lead Counsel', 'Case privacy codes, encrypted storage security properties.',                     'CONFIDENTIALITY_FAIL',         'track_investigation_documentation_records'],
  ['Subsidiary Ledger Reconciler (Global Entities)',      'FX conversion tracking models, localization asset rules.',                       'FX_RECONCILIATION_FAIL',       'balance_multi_currency_financial_loops'],
  ['Enterprise Cyber-Insurance Risk Underwriter',         'Corporate vulnerability metrics, liability cap constraints.',                    'EXPOSURE_LIMIT_BREACH',        'adjust_cyber_risk_profiles'],
  ['Strategic Board Meeting Communications Facilitator',  'Governance notification rules, voting quorum parameters, bylaws.',               'VOTE_QUORUM_FAIL',             'update_board_resolution_directives'],
];

const SYSTEM_PROMPT = (name, vdb, code, tool) =>
`You are the isolated, execution-focused cognitive brain of the ${name} System Module. You operate with a strict, parameter-driven engineering perspective. You communicate exclusively via structured data feeds or raw execution outputs. Conversational wrapping, filler, polite transitions, and status summaries are strictly prohibited.

# Operational Mandates
1. CONTEXT ASSIMILATION: For every incoming runtime event, run automated semantic search in your Vector DB namespace covering: ${vdb}
2. LOGICAL PARSING: Isolate the explicit transaction arrays, configuration keys, or performance metrics provided in the payload.
3. ERROR CONTAINMENT: If incoming telemetry crosses allowed variance parameters, immediately abort the tool execution tree and throw system error trace: ${code}.
4. FORCED OUTPUT FORMATTING: Respond with either valid JSON matching the ${tool} schema arguments, or a clean unadorned Markdown data matrix. No commentary before or after your payload.`;

let sql = `-- 010 Canonical data patch — all 100 roles correct VDB scope, error codes, instructions
-- Applies the definitive 100 Role Brain Configuration Matrix

UPDATE public.employee_templates AS t
SET
  vector_db_scope   = c.vdb,
  guardrail_code    = c.code,
  primary_tool      = c.tool,
  default_instructions = c.instructions
FROM (VALUES\n`;

const vals = canonical.map(([name, vdb, code, tool]) => {
  const slug = toSlug(name);
  const instr = SYSTEM_PROMPT(name, vdb, code, tool);
  return `  ('${e(slug)}', '${e(vdb)}', '${e(code)}', '${e(tool)}', '${e(instr)}')`;
});

sql += vals.join(',\n');
sql += `\n) AS c(slug, vdb, code, tool, instructions)\nWHERE t.slug = c.slug;\n`;

// verify we map all 100
sql += `\n-- Sanity check\nSELECT count(*) AS patched FROM public.employee_templates WHERE guardrail_code IS NOT NULL;\n`;

fs.writeFileSync('supabase/migrations/010_canonical_patch.sql', sql);
console.log(`Generated patch for ${canonical.length} roles`);

// also print any slug mapping for debug
canonical.forEach(([name]) => console.log(`  ${toSlug(name)}`));
