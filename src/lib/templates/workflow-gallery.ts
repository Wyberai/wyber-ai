export interface WorkflowNode {
  id: string
  type: 'trigger' | 'ai' | 'action' | 'condition' | 'end'
  label: string
  tool: string
  position: { x: number; y: number }
  config: {
    instructions?: string
    message?: string
    condition?: string
    schedule?: string
    type?: string
    cron_expression?: string
  }
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  label?: string
}

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: string
  icon: string
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
}

export const WORKFLOW_CATEGORIES = [
  'All', 'Sales', 'Marketing', 'Customer Support', 'HR & People', 'Finance', 'Operations', 'Engineering', 'Product', 'Legal', 'Content', 'Social Media', 'Analytics', 'Recruitment', 'Project Management', 'Customer Success', 'Security', 'Data', 'Ecommerce', 'Healthcare', 'Education'
]

export const WORKFLOW_GALLERY: WorkflowTemplate[] = [
  {
    "name": "Lead Score & Route",
    "description": "Score inbound leads and route high-value prospects to senior reps automatically.",
    "category": "Sales",
    "icon": "🎯",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "New Lead Form",
        "tool": "Form",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "form_submission"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Score Lead",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Score lead 1-100 based on company size, role, and budget."
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "High Value?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "Lead score >= 70"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Alert Senior Rep",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "Hot lead assigned to you: {{lead_name}} scored {{score}}"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Add to Nurture",
        "tool": "HubSpot",
        "position": {
          "x": 960,
          "y": 320
        },
        "config": {
          "message": "Add lead to nurture sequence in HubSpot CRM"
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "Yes"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5",
        "label": "No"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-sales-1"
  },
  {
    "name": "Deal Won Celebration",
    "description": "Celebrate closed deals in Slack and trigger onboarding workflows instantly.",
    "category": "Sales",
    "icon": "🏆",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Deal Closed Won",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "hubspot_deal_won"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Write Win Summary",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Write a fun team celebration message for the closed deal."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Post to Slack",
        "tool": "Slack",
        "position": {
          "x": 740,
          "y": 120
        },
        "config": {
          "message": "Post win announcement to #sales-wins channel"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Log to Sheets",
        "tool": "Google Sheets",
        "position": {
          "x": 740,
          "y": 320
        },
        "config": {
          "message": "Log deal value, rep name, and close date to revenue tracker"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n2",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-sales-2"
  },
  {
    "name": "Proposal Follow-Up Sequence",
    "description": "Auto-send personalized follow-ups when proposals go unopened after 48 hours.",
    "category": "Sales",
    "icon": "📄",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Proposal Sent",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 9 * * *"
        }
      },
      {
        "id": "n2",
        "type": "condition",
        "label": "Unopened 48h?",
        "tool": "Logic",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "condition": "Proposal sent > 48h ago and not opened"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Write Follow-Up",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 120
        },
        "config": {
          "instructions": "Write a short, friendly follow-up email for an unopened proposal."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Send Email",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "Send follow-up email to prospect from rep's inbox"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3",
        "label": "Yes"
      },
      {
        "id": "e3",
        "source": "n2",
        "target": "n5",
        "label": "No"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-sales-3"
  },
  {
    "name": "Competitor Mention Alert",
    "description": "Detect competitor mentions in emails and alert reps with battle card talking points.",
    "category": "Sales",
    "icon": "⚔️",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Incoming Email",
        "tool": "Email",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "inbound_email"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Detect Competitor",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Detect competitor mentions and extract key objections from email."
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "Competitor Found?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "Competitor name detected in email body"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Send Battle Card",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "Alert rep with competitor battle card and objection responses"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "Yes"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5",
        "label": "No"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-sales-4"
  },
  {
    "name": "Weekly Pipeline Digest",
    "description": "Send reps a Monday morning summary of their pipeline health and stalled deals.",
    "category": "Sales",
    "icon": "📊",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Monday 8AM",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 8 * * 1"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Pipeline Data",
        "tool": "HubSpot",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Pull all open deals, stages, and last activity dates from CRM"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Summarize Pipeline",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Summarize pipeline health, flag stalled deals, suggest next actions."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Email Each Rep",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Send personalized pipeline digest email to each sales rep"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-sales-5"
  },
  {
    "name": "Inbound Trial Qualifier",
    "description": "Qualify free trial signups and fast-track high-fit accounts to sales calls.",
    "category": "Sales",
    "icon": "🔍",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Trial Signup",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "trial_signup"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Qualify Account",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Qualify trial signup using ICP criteria: size, industry, role."
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "ICP Match?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "Account matches ideal customer profile criteria"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Book Demo Email",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "Send personalized email inviting prospect to book a demo call"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Add to Drip",
        "tool": "HubSpot",
        "position": {
          "x": 960,
          "y": 320
        },
        "config": {
          "message": "Enroll non-ICP trial user into self-serve nurture email sequence"
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "Yes"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5",
        "label": "No"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-sales-6"
  },
  {
    "name": "LinkedIn Prospect Outreach",
    "description": "Research LinkedIn prospects and draft personalized outreach messages automatically.",
    "category": "Sales",
    "icon": "💼",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "New Prospect Added",
        "tool": "Form",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "airtable_new_row"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch LinkedIn Data",
        "tool": "HTTP",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Fetch prospect LinkedIn profile data via enrichment API"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Draft Message",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Write a personalized LinkedIn message based on prospect's profile."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Save to Airtable",
        "tool": "Airtable",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Save drafted message to Airtable row for rep review before sending"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-sales-7"
  },
  {
    "name": "Churn Risk Rescue",
    "description": "Detect at-risk accounts from usage drops and trigger proactive sales outreach.",
    "category": "Sales",
    "icon": "🚨",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Daily Usage Check",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 7 * * *"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Pull Usage Data",
        "tool": "HTTP",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Fetch last 14 days product usage per account from analytics API"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Identify At-Risk",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Flag accounts with >40% usage drop and draft rescue email."
        }
      },
      {
        "id": "n4",
        "type": "condition",
        "label": "At-Risk Found?",
        "tool": "Logic",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "condition": "One or more at-risk accounts identified"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Alert Account Rep",
        "tool": "Slack",
        "position": {
          "x": 1180,
          "y": 120
        },
        "config": {
          "message": "Notify account rep with churn risk details and suggested outreach"
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1400,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5",
        "label": "Yes"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6",
        "label": "No"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-sales-8"
  },
  {
    "name": "Deal Stage Change Alert",
    "description": "Notify team on Slack when a HubSpot deal moves to a new pipeline stage.",
    "category": "Sales",
    "icon": "📊",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Deal Stage Updated",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Summarize Deal Update",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Summarize the deal stage change with deal name, value, and next steps."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Post to Sales Channel",
        "tool": "Slack",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Post deal stage update summary to #sales channel."
        }
      },
      {
        "id": "n4",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      }
    ],
    "id": "wf-sales-9"
  },
  {
    "name": "Churned Customer Win-Back",
    "description": "Auto-send personalized win-back emails to customers who haven't purchased in 90 days.",
    "category": "Sales",
    "icon": "🔄",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Daily Check",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 9 * * *"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Lapsed Customers",
        "tool": "HubSpot",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Query contacts with no purchase in last 90 days."
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Write Win-Back Email",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Write a personalized win-back email with a special offer for lapsed customers."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Send Win-Back Email",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Send personalized win-back email to each lapsed customer."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-sales-10"
  },
  {
    "name": "Sales Call Notes to CRM",
    "description": "Transcribe sales call notes and log structured data directly into HubSpot.",
    "category": "Sales",
    "icon": "📞",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Call Notes Submitted",
        "tool": "Form",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "form"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Extract Call Insights",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Extract pain points, next steps, and deal status from raw call notes."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Update CRM Contact",
        "tool": "HubSpot",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Log extracted call insights to HubSpot contact record."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Log to Notion",
        "tool": "Notion",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Add call summary to Notion sales call log database."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-sales-11"
  },
  {
    "name": "High-Value Lead Escalation",
    "description": "Instantly alert senior sales reps when a lead's estimated deal value exceeds $10K.",
    "category": "Sales",
    "icon": "🚨",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "New Lead Created",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "n2",
        "type": "condition",
        "label": "Deal Value Over $10K?",
        "tool": "Logic",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "condition": "estimated_deal_value > 10000"
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Alert Senior Rep",
        "tool": "Slack",
        "position": {
          "x": 740,
          "y": 120
        },
        "config": {
          "message": "Send urgent DM to senior sales rep with lead details."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Standard Queue",
        "tool": "HubSpot",
        "position": {
          "x": 740,
          "y": 320
        },
        "config": {
          "message": "Assign lead to standard sales queue in HubSpot."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3",
        "label": "Yes"
      },
      {
        "id": "e3",
        "source": "n2",
        "target": "n4",
        "label": "No"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-sales-12"
  },
  {
    "name": "Proposal Auto-Generator",
    "description": "Generate a tailored sales proposal PDF from a CRM contact and send it via email.",
    "category": "Sales",
    "icon": "📝",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Proposal Requested",
        "tool": "Form",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "form"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Contact Data",
        "tool": "HubSpot",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Retrieve company info, deal size, and industry from HubSpot."
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Draft Proposal",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Write a tailored sales proposal using company data and product catalog."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Email Proposal",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Send proposal email to prospect with personalized subject line."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-sales-13"
  },
  {
    "name": "Weekly Pipeline Report",
    "description": "Auto-generate and email a weekly sales pipeline summary to the leadership team.",
    "category": "Sales",
    "icon": "📈",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Every Monday 8AM",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 8 * * 1"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Pull Pipeline Data",
        "tool": "Google Sheets",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Fetch all open deals, stages, and values from pipeline sheet."
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Write Pipeline Summary",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Summarize pipeline health, top deals, and risks for leadership."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Email Leadership Team",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Send weekly pipeline report email to leadership distribution list."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-sales-14"
  },
  {
    "name": "Competitor Mention Response",
    "description": "Alert reps and draft a response when a prospect mentions a competitor in email.",
    "category": "Sales",
    "icon": "⚔️",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Inbound Email Received",
        "tool": "Email",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "email"
        }
      },
      {
        "id": "n2",
        "type": "condition",
        "label": "Competitor Mentioned?",
        "tool": "Logic",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "condition": "email body contains competitor brand names"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Draft Counter Response",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 120
        },
        "config": {
          "instructions": "Draft a confident reply addressing competitor claims with our advantages."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Notify Sales Rep",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "Send Slack alert with draft reply for rep to review and send."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3",
        "label": "Yes"
      },
      {
        "id": "e3",
        "source": "n2",
        "target": "n5",
        "label": "No"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-sales-15"
  },
  {
    "name": "Contract Signed Onboarding",
    "description": "Trigger onboarding tasks and welcome email the moment a contract is signed.",
    "category": "Sales",
    "icon": "🖊️",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Contract Signed",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Generate Welcome Email",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Write a warm welcome email with onboarding steps and key contacts."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Send Welcome Email",
        "tool": "Gmail",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Send personalized welcome email to new customer."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Create Onboarding Tasks",
        "tool": "Notion",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Create onboarding project in Notion with tasks and due dates."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Update CRM to Won",
        "tool": "HubSpot",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {
          "message": "Move HubSpot deal to Closed Won and log contract date."
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1400,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      },
      {
        "id": "e5",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-sales-16"
  },
  {
    "name": "Blog Post Social Amplifier",
    "description": "Auto-publish new blog posts to Twitter and LinkedIn with AI-crafted captions.",
    "category": "Marketing",
    "icon": "📢",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "New Blog Post",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Write Social Captions",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Write engaging Twitter and LinkedIn captions for this blog post."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Post to Twitter",
        "tool": "Twitter",
        "position": {
          "x": 740,
          "y": 120
        },
        "config": {
          "message": "{{twitter_caption}}"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Post to LinkedIn",
        "tool": "LinkedIn",
        "position": {
          "x": 740,
          "y": 280
        },
        "config": {
          "message": "{{linkedin_caption}}"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3",
        "label": "Twitter"
      },
      {
        "id": "e3",
        "source": "n2",
        "target": "n4",
        "label": "LinkedIn"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-marketing-17"
  },
  {
    "name": "Lead Magnet Follow-Up",
    "description": "Send personalized nurture emails when someone downloads a lead magnet.",
    "category": "Marketing",
    "icon": "🧲",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Form Submitted",
        "tool": "Form",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "form_submission"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Personalize Email",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Write a warm follow-up email based on the lead magnet downloaded."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Send Welcome Email",
        "tool": "Gmail",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "{{personalized_email}}"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Add to HubSpot",
        "tool": "HubSpot",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Create contact and tag with lead magnet source."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-marketing-18"
  },
  {
    "name": "Weekly Newsletter Builder",
    "description": "Curate top content weekly and draft a newsletter ready for review.",
    "category": "Marketing",
    "icon": "📰",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Every Monday 8AM",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 8 * * 1"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Content Sheet",
        "tool": "Google Sheets",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Read this week's curated articles from the content log sheet."
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Draft Newsletter",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Draft a friendly newsletter with intros for each article."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Save Draft to Notion",
        "tool": "Notion",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Save newsletter draft to the Marketing Drafts Notion page."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Notify Slack",
        "tool": "Slack",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {
          "message": "Newsletter draft is ready for review in Notion!"
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1400,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      },
      {
        "id": "e5",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-marketing-19"
  },
  {
    "name": "Competitor Mention Tracker",
    "description": "Monitor competitor mentions online and alert the marketing team instantly.",
    "category": "Marketing",
    "icon": "🔍",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Mention Webhook",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Analyze Sentiment",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Analyze sentiment and key themes of this competitor mention."
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "Negative Mention?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "sentiment == negative"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Alert Slack Channel",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "🚨 Negative competitor mention detected: {{summary}}"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Log to Airtable",
        "tool": "Airtable",
        "position": {
          "x": 960,
          "y": 320
        },
        "config": {
          "message": "Log mention with sentiment, source, and date to tracker."
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "Yes"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5",
        "label": "No"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-marketing-20"
  },
  {
    "name": "Ad Performance Reporter",
    "description": "Pull weekly ad metrics and send a summarized performance report to the team.",
    "category": "Marketing",
    "icon": "📊",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Every Friday 5PM",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 17 * * 5"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Ad Data",
        "tool": "Google Sheets",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Pull this week's ad spend, clicks, and conversions from sheet."
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Summarize Performance",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Summarize ad performance, highlight wins and areas to improve."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Email Report",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Send weekly ad performance summary to marketing team."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-marketing-21"
  },
  {
    "name": "Webinar Registrant Nurture",
    "description": "Automatically confirm registration and send reminders before a webinar.",
    "category": "Marketing",
    "icon": "🎙️",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Registration Form",
        "tool": "Form",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "form_submission"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Send Confirmation",
        "tool": "Gmail",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Send webinar confirmation with calendar invite and join link."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Add to HubSpot",
        "tool": "HubSpot",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Tag contact as webinar registrant in HubSpot CRM."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Log in Airtable",
        "tool": "Airtable",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Add registrant name, email, and source to webinar tracker."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-marketing-22"
  },
  {
    "name": "Product Launch Countdown",
    "description": "Schedule and send a series of teaser posts leading up to a product launch.",
    "category": "Marketing",
    "icon": "🚀",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Launch Date Trigger",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 9 * * *"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Get Launch Details",
        "tool": "Notion",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Fetch today's launch teaser content from Notion launch plan."
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Generate Teaser Copy",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Write a hype teaser post for today's countdown day."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Post to Twitter",
        "tool": "Twitter",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "{{teaser_tweet}}"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Post to LinkedIn",
        "tool": "LinkedIn",
        "position": {
          "x": 960,
          "y": 320
        },
        "config": {
          "message": "{{teaser_linkedin_post}}"
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "Twitter"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5",
        "label": "LinkedIn"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-marketing-23"
  },
  {
    "name": "Review Request Automator",
    "description": "Send review requests to customers 7 days after purchase automatically.",
    "category": "Marketing",
    "icon": "⭐",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Purchase Confirmed",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "n2",
        "type": "condition",
        "label": "7 Days Passed?",
        "tool": "Logic",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "condition": "days_since_purchase >= 7"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Write Review Request",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 120
        },
        "config": {
          "instructions": "Write a friendly review request email personalized by product."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Send Review Email",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "{{review_request_email}}"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Log in Sheets",
        "tool": "Google Sheets",
        "position": {
          "x": 960,
          "y": 320
        },
        "config": {
          "message": "Log customer and date review request was skipped or sent."
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3",
        "label": "Yes"
      },
      {
        "id": "e3",
        "source": "n2",
        "target": "n5",
        "label": "No"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-marketing-24"
  },
  {
    "name": "Blog to Social Blast",
    "description": "Auto-publish new blog posts as tailored content across Twitter and LinkedIn.",
    "category": "Marketing",
    "icon": "📝",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "New Blog Post",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Write Social Snippets",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Create a Twitter thread and LinkedIn post from this blog content."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Post to Twitter",
        "tool": "Twitter",
        "position": {
          "x": 740,
          "y": 120
        },
        "config": {
          "message": "{{twitter_thread}}"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Post to LinkedIn",
        "tool": "LinkedIn",
        "position": {
          "x": 740,
          "y": 280
        },
        "config": {
          "message": "{{linkedin_post}}"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3",
        "label": "Twitter"
      },
      {
        "id": "e3",
        "source": "n2",
        "target": "n4",
        "label": "LinkedIn"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-marketing-25"
  },
  {
    "name": "Competitor Price Alert",
    "description": "Monitor competitor websites for price changes and alert the marketing team.",
    "category": "Marketing",
    "icon": "🔍",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Daily Price Check",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 8 * * *"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Scrape Competitor Pages",
        "tool": "HTTP",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Fetch competitor pricing pages via HTTP GET."
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Detect Price Changes",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Compare scraped prices to baseline. Flag any changes."
        }
      },
      {
        "id": "n4",
        "type": "condition",
        "label": "Price Changed?",
        "tool": "Logic",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "condition": "price_changed == true"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Alert Team on Slack",
        "tool": "Slack",
        "position": {
          "x": 1180,
          "y": 120
        },
        "config": {
          "message": "Competitor price change detected: {{change_summary}}"
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 320
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5",
        "label": "Yes"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6",
        "label": "No"
      }
    ],
    "id": "wf-marketing-26"
  },
  {
    "name": "Webinar Follow-Up Sequence",
    "description": "Send personalized follow-up emails to webinar attendees and no-shows.",
    "category": "Marketing",
    "icon": "🎙️",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Webinar Ends",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "n2",
        "type": "condition",
        "label": "Attended or No-Show?",
        "tool": "Logic",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "condition": "attendee.status == attended"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Write Attendee Email",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 120
        },
        "config": {
          "instructions": "Write a thank-you email with key webinar takeaways and CTA."
        }
      },
      {
        "id": "n4",
        "type": "ai",
        "label": "Write No-Show Email",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 320
        },
        "config": {
          "instructions": "Write a sorry-we-missed-you email with recording link and CTA."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Send via Gmail",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "{{personalized_email}}"
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3",
        "label": "Attended"
      },
      {
        "id": "e3",
        "source": "n2",
        "target": "n4",
        "label": "No-Show"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n5"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-marketing-27"
  },
  {
    "name": "Monthly Newsletter Builder",
    "description": "Compile top content and auto-generate a monthly newsletter draft in Notion.",
    "category": "Marketing",
    "icon": "📰",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Monthly Schedule",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 9 1 * *"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Top Content",
        "tool": "Google Sheets",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Pull top-performing content from the content tracker sheet."
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Draft Newsletter",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Write a monthly newsletter using the top content provided."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Save Draft to Notion",
        "tool": "Notion",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Create a new Notion page with the newsletter draft."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Notify Editor on Slack",
        "tool": "Slack",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {
          "message": "Monthly newsletter draft is ready for review in Notion."
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1400,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      },
      {
        "id": "e5",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-marketing-28"
  },
  {
    "name": "Review Request Automation",
    "description": "Ask happy customers for Google reviews 3 days after purchase confirmation.",
    "category": "Marketing",
    "icon": "⭐",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Purchase Confirmed",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Wait 3 Days",
        "tool": "Zapier",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Delay workflow execution by 3 days."
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Write Review Request",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Write a friendly review request email personalized by product."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Send Review Email",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "{{review_request_email}}"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-marketing-29"
  },
  {
    "name": "Ad Campaign Performance Report",
    "description": "Pull ad metrics weekly and send a Slack summary with AI-generated insights.",
    "category": "Marketing",
    "icon": "📊",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Weekly Report Run",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 8 * * 1"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Ad Metrics",
        "tool": "HTTP",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "GET ad performance data from marketing API."
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Analyze Performance",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Summarize ad metrics. Highlight wins, losses, and recommendations."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Log to Sheets",
        "tool": "Google Sheets",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "Append weekly performance metrics to the ad tracker sheet."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Post Insights to Slack",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 300
        },
        "config": {
          "message": "Weekly Ad Report: {{performance_summary}}"
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-marketing-30"
  },
  {
    "name": "Referral Program Tracker",
    "description": "Track referral signups, reward referrers, and log data in Airtable automatically.",
    "category": "Marketing",
    "icon": "🤝",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Referral Signup",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Log Referral in Airtable",
        "tool": "Airtable",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Add new referral record with referrer ID and signup details."
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "Referral Converted?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "referral.status == converted"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Send Reward Email",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "Congrats! Your referral converted. Here is your reward: {{reward}}"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 960,
          "y": 320
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "Yes"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5",
        "label": "No"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-marketing-31"
  },
  {
    "name": "Product Launch Countdown",
    "description": "Auto-send teaser emails on days 7, 3, and 1 before a product launch date.",
    "category": "Marketing",
    "icon": "🚀",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Launch Date Set",
        "tool": "Form",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "instructions": "Collect product name, launch date, and subscriber list."
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Write Teaser Emails",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Write 3 teaser emails for day 7, 3, and 1 before launch."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Schedule Day 7 Email",
        "tool": "Gmail",
        "position": {
          "x": 740,
          "y": 120
        },
        "config": {
          "message": "{{teaser_email_day7}}"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Schedule Day 3 Email",
        "tool": "Gmail",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "{{teaser_email_day3}}"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Schedule Day 1 Email",
        "tool": "Gmail",
        "position": {
          "x": 740,
          "y": 320
        },
        "config": {
          "message": "{{teaser_email_day1}}"
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3",
        "label": "Day 7"
      },
      {
        "id": "e3",
        "source": "n2",
        "target": "n4",
        "label": "Day 3"
      },
      {
        "id": "e4",
        "source": "n2",
        "target": "n5",
        "label": "Day 1"
      },
      {
        "id": "e5",
        "source": "n3",
        "target": "n6"
      },
      {
        "id": "e6",
        "source": "n4",
        "target": "n6"
      },
      {
        "id": "e7",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-marketing-32"
  },
  {
    "name": "Auto-Triage Support Tickets",
    "description": "Classify incoming support emails by urgency and route to the right team.",
    "category": "Customer Support",
    "icon": "🎫",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "New Support Email",
        "tool": "Email",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "email_received"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Classify Ticket",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Classify ticket as urgent/normal/low. Extract issue type and summary."
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "Is Urgent?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "priority == urgent"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Alert Support Lead",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "🚨 Urgent ticket: {{summary}} from {{customer}}"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Log to Sheets",
        "tool": "Google Sheets",
        "position": {
          "x": 960,
          "y": 320
        },
        "config": {
          "message": "Append ticket data to support queue tracker"
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "Urgent"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5",
        "label": "Normal/Low"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-customersupport-33"
  },
  {
    "name": "AI First Response Bot",
    "description": "Draft instant personalized replies to customer emails using AI.",
    "category": "Customer Support",
    "icon": "🤖",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Customer Email Received",
        "tool": "Email",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "email_received"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Draft Reply",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Write a helpful, empathetic reply. Acknowledge issue and next steps."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Send Auto-Reply",
        "tool": "Gmail",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Send drafted reply to customer email thread"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Log Interaction",
        "tool": "HubSpot",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Create support activity on customer contact record"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-customersupport-34"
  },
  {
    "name": "Refund Request Handler",
    "description": "Detect refund requests, check eligibility, and process or escalate automatically.",
    "category": "Customer Support",
    "icon": "💸",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Refund Request Email",
        "tool": "Email",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "email_received"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Assess Eligibility",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Check if refund request meets policy: within 30 days, unused."
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "Eligible for Refund?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "refund_eligible == true"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Process Refund",
        "tool": "Stripe",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "Issue full refund to customer payment method"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Escalate to Agent",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 320
        },
        "config": {
          "message": "Refund request needs manual review: {{customer_name}}"
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "Eligible"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5",
        "label": "Not Eligible"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-customersupport-35"
  },
  {
    "name": "CSAT Survey Follow-Up",
    "description": "Send satisfaction surveys after ticket close and log scores automatically.",
    "category": "Customer Support",
    "icon": "⭐",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Ticket Closed",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Send CSAT Survey",
        "tool": "Gmail",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Send 1-5 star satisfaction survey email to customer"
        }
      },
      {
        "id": "n3",
        "type": "trigger",
        "label": "Survey Response",
        "tool": "Form",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "type": "form_submitted"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Log Score",
        "tool": "Google Sheets",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Append CSAT score, ticket ID, and agent name to tracker"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-customersupport-36"
  },
  {
    "name": "Negative Review Alert",
    "description": "Detect 1-2 star reviews and immediately notify the support team to respond.",
    "category": "Customer Support",
    "icon": "😠",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "New Review Webhook",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "n2",
        "type": "condition",
        "label": "Rating Below 3?",
        "tool": "Logic",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "condition": "review_rating <= 2"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Draft Recovery Reply",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 120
        },
        "config": {
          "instructions": "Write an empathetic public response to a negative customer review."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Alert Support Team",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "⚠️ Negative review from {{customer}}: {{review_text}}"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3",
        "label": "Negative"
      },
      {
        "id": "e3",
        "source": "n2",
        "target": "n5",
        "label": "Positive"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-customersupport-37"
  },
  {
    "name": "VIP Customer Fast Lane",
    "description": "Detect high-value customers and escalate their tickets to senior support agents.",
    "category": "Customer Support",
    "icon": "👑",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "New Support Ticket",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Check CRM Tier",
        "tool": "HubSpot",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Lookup contact and retrieve customer tier and LTV value"
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "Is VIP Customer?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "customer_tier == VIP or LTV > 5000"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Page Senior Agent",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "👑 VIP ticket needs immediate attention: {{ticket_id}}"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Standard Queue",
        "tool": "Google Sheets",
        "position": {
          "x": 960,
          "y": 320
        },
        "config": {
          "message": "Add ticket to standard support queue spreadsheet"
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "VIP"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5",
        "label": "Standard"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-customersupport-38"
  },
  {
    "name": "Support Ticket Daily Digest",
    "description": "Send a daily summary of open tickets, response times, and team performance.",
    "category": "Customer Support",
    "icon": "📊",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Daily 8AM Schedule",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 8 * * 1-5"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Ticket Data",
        "tool": "Google Sheets",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Read all open tickets and metrics from support tracker sheet"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Summarize Metrics",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Summarize open tickets, avg response time, top issues today."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Post to Slack",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Post daily support digest to #customer-support channel"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-customersupport-39"
  },
  {
    "name": "Churn Risk Detection",
    "description": "Identify frustrated customers from support patterns and trigger retention outreach.",
    "category": "Customer Support",
    "icon": "🚨",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Weekly Schedule",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 9 * * 1"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Pull Ticket History",
        "tool": "Google Sheets",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Fetch customers with 3+ tickets or low CSAT in last 30 days"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Score Churn Risk",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Score churn risk 1-10 based on ticket frequency and sentiment."
        }
      },
      {
        "id": "n4",
        "type": "condition",
        "label": "High Risk?",
        "tool": "Logic",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "condition": "churn_score >= 7"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Notify Account Manager",
        "tool": "Slack",
        "position": {
          "x": 1180,
          "y": 120
        },
        "config": {
          "message": "🚨 Churn risk: {{customer_name}} scored {{score}}/10"
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 320
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5",
        "label": "High Risk"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6",
        "label": "Low Risk"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-customersupport-40"
  },
  {
    "name": "VIP Customer Fast-Track",
    "description": "Detects VIP customers in support queue and escalates to senior agents instantly.",
    "category": "Customer Support",
    "icon": "⭐",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "New Support Ticket",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "n2",
        "type": "condition",
        "label": "Is VIP Customer?",
        "tool": "Logic",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "condition": "Customer tier equals VIP or Enterprise"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Summarize Issue",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 120
        },
        "config": {
          "instructions": "Summarize ticket issue and urgency in 2 sentences for senior agent."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Alert Senior Agent",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "🚨 VIP ticket escalated: {{summary}} — respond within 15 min."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Standard Queue",
        "tool": "HubSpot",
        "position": {
          "x": 740,
          "y": 320
        },
        "config": {
          "message": "Assign ticket to standard support queue with normal priority."
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3",
        "label": "VIP"
      },
      {
        "id": "e3",
        "source": "n2",
        "target": "n5",
        "label": "Standard"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-customersupport-41"
  },
  {
    "name": "Angry Customer Detector",
    "description": "Scans incoming emails for frustrated tone and prioritizes them for immediate response.",
    "category": "Customer Support",
    "icon": "😤",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Customer Email Received",
        "tool": "Email",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "email"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Analyze Sentiment",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Rate email sentiment: positive, neutral, or angry. Return one word."
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "Is Angry?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "Sentiment result equals angry"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Flag & Notify Team",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "⚠️ Angry customer email detected. Needs immediate response: {{email_subject}}"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Log to CRM",
        "tool": "HubSpot",
        "position": {
          "x": 960,
          "y": 320
        },
        "config": {
          "message": "Log email sentiment and add to normal support queue."
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "Angry"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5",
        "label": "Not Angry"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-customersupport-42"
  },
  {
    "name": "CSAT Survey Auto-Sender",
    "description": "Sends satisfaction surveys 2 hours after a support ticket is marked resolved.",
    "category": "Customer Support",
    "icon": "📋",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Ticket Resolved",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Personalize Survey Email",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Write a warm, brief CSAT survey email referencing the resolved issue."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Send Survey Email",
        "tool": "Gmail",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Send CSAT survey email to customer 2 hours after ticket close."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Log Survey Sent",
        "tool": "Google Sheets",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Record customer name, ticket ID, survey sent date in tracker sheet."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-customersupport-43"
  },
  {
    "name": "Refund Request Handler",
    "description": "Processes refund requests, checks eligibility, and auto-approves qualifying cases.",
    "category": "Customer Support",
    "icon": "💸",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Refund Request Form",
        "tool": "Form",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "form"
        }
      },
      {
        "id": "n2",
        "type": "condition",
        "label": "Within 30 Days?",
        "tool": "Logic",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "condition": "Purchase date is within 30 days of today"
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Process Refund",
        "tool": "Stripe",
        "position": {
          "x": 740,
          "y": 120
        },
        "config": {
          "message": "Issue full refund to original payment method for approved request."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Notify Customer",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "Email customer confirming refund processed within 3–5 business days."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Escalate to Agent",
        "tool": "Slack",
        "position": {
          "x": 740,
          "y": 320
        },
        "config": {
          "message": "Refund outside policy window — needs manual review: {{customer_name}}"
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3",
        "label": "Eligible"
      },
      {
        "id": "e3",
        "source": "n2",
        "target": "n5",
        "label": "Ineligible"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-customersupport-44"
  },
  {
    "name": "Churn Risk Alert System",
    "description": "Identifies customers at churn risk from support patterns and triggers retention outreach.",
    "category": "Customer Support",
    "icon": "🚨",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Daily Ticket Review",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 9 * * 1-5"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Identify Churn Signals",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Flag customers with 3+ unresolved tickets or cancellation mentions."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Update CRM Risk Score",
        "tool": "HubSpot",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Set churn risk = high for flagged contacts in HubSpot CRM."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Alert Success Team",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "🔴 Churn risk customers identified today: {{count}}. Review list in CRM."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-customersupport-45"
  },
  {
    "name": "Support Knowledge Base Builder",
    "description": "Turns resolved tickets into knowledge base articles automatically after agent approval.",
    "category": "Customer Support",
    "icon": "📚",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Ticket Closed",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "n2",
        "type": "condition",
        "label": "Common Issue?",
        "tool": "Logic",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "condition": "Same issue reported by 3+ customers this month"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Draft KB Article",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 120
        },
        "config": {
          "instructions": "Write a clear help article from this ticket: problem, cause, solution."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Save Draft to Notion",
        "tool": "Notion",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "Save KB article draft to Notion for agent review before publishing."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3",
        "label": "Common"
      },
      {
        "id": "e3",
        "source": "n2",
        "target": "n5",
        "label": "Unique"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-customersupport-46"
  },
  {
    "name": "SLA Breach Early Warning",
    "description": "Monitors open tickets and warns agents 1 hour before SLA deadline is breached.",
    "category": "Customer Support",
    "icon": "⏰",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Hourly SLA Check",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 * * * *"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Open Tickets",
        "tool": "HTTP",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "GET /api/tickets?status=open&sla_breach_within=60min"
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "Tickets At Risk?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "Any ticket has less than 60 minutes until SLA breach"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Warn Assigned Agent",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "⏰ SLA breach in <60 min: Ticket #{{id}} — please respond now!"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Log SLA Warning",
        "tool": "Google Sheets",
        "position": {
          "x": 960,
          "y": 320
        },
        "config": {
          "message": "Log SLA at-risk ticket ID, agent, and timestamp to SLA tracker."
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "At Risk"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n6",
        "label": "All Clear"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n5"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-customersupport-47"
  },
  {
    "name": "Multilingual Ticket Translator",
    "description": "Detects non-English support tickets and translates them for English-speaking agents.",
    "category": "Customer Support",
    "icon": "🌍",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "New Ticket Submitted",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "n2",
        "type": "condition",
        "label": "Non-English?",
        "tool": "Logic",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "condition": "Detected language is not English"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Translate & Summarize",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 120
        },
        "config": {
          "instructions": "Translate to English and summarize the customer's issue in 3 lines."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Update Ticket with Translation",
        "tool": "HubSpot",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "Append English translation and original language tag to ticket notes."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Assign to Queue",
        "tool": "HubSpot",
        "position": {
          "x": 740,
          "y": 320
        },
        "config": {
          "message": "Route English ticket directly to standard support queue."
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3",
        "label": "Foreign Language"
      },
      {
        "id": "e3",
        "source": "n2",
        "target": "n5",
        "label": "English"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-customersupport-48"
  },
  {
    "name": "New Employee Onboarding",
    "description": "Automatically set up accounts, send welcome emails, and notify the team.",
    "category": "HR & People",
    "icon": "🎉",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "New Hire Form Submitted",
        "tool": "Form",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "form_submission"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Generate Welcome Package",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Create personalized welcome email and first-week schedule."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Send Welcome Email",
        "tool": "Gmail",
        "position": {
          "x": 740,
          "y": 120
        },
        "config": {
          "message": "Send personalized welcome email to new hire."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Notify Team on Slack",
        "tool": "Slack",
        "position": {
          "x": 740,
          "y": 280
        },
        "config": {
          "message": "Post new hire announcement to #general channel."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Add to HR Records",
        "tool": "Airtable",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Create new employee record in HR database."
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Onboarding Complete",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3",
        "label": "Email"
      },
      {
        "id": "e3",
        "source": "n2",
        "target": "n4",
        "label": "Slack"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n5"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-hrpeople-49"
  },
  {
    "name": "PTO Request Approval",
    "description": "Route PTO requests to managers and update the shared calendar automatically.",
    "category": "HR & People",
    "icon": "🏖️",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "PTO Request Submitted",
        "tool": "Form",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "form_submission"
        }
      },
      {
        "id": "n2",
        "type": "condition",
        "label": "Check Days Requested",
        "tool": "Logic",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "condition": "If PTO days > 5, escalate to HR director."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Notify Manager",
        "tool": "Slack",
        "position": {
          "x": 740,
          "y": 120
        },
        "config": {
          "message": "Alert manager with approve/deny request details."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Notify HR Director",
        "tool": "Gmail",
        "position": {
          "x": 740,
          "y": 320
        },
        "config": {
          "message": "Send escalated PTO request to HR director for review."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Update HR Tracker",
        "tool": "Google Sheets",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Log PTO request status in employee leave tracker."
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Request Processed",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3",
        "label": "≤ 5 days"
      },
      {
        "id": "e3",
        "source": "n2",
        "target": "n4",
        "label": "> 5 days"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n5"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-hrpeople-50"
  },
  {
    "name": "Weekly Pulse Survey",
    "description": "Send weekly employee sentiment surveys and summarize results for leadership.",
    "category": "HR & People",
    "icon": "📊",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Every Friday 9AM",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 9 * * 5"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Send Survey via Email",
        "tool": "Gmail",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Distribute weekly 3-question pulse survey to all staff."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Collect Responses",
        "tool": "Google Sheets",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Append survey responses to weekly tracking spreadsheet."
        }
      },
      {
        "id": "n4",
        "type": "ai",
        "label": "Summarize Sentiment",
        "tool": "Claude AI",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "instructions": "Analyze survey responses and summarize team sentiment trends."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Send Summary to Leadership",
        "tool": "Slack",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {
          "message": "Post sentiment summary report to #leadership channel."
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Survey Cycle Done",
        "tool": "End",
        "position": {
          "x": 1400,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      },
      {
        "id": "e5",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-hrpeople-51"
  },
  {
    "name": "Job Application Screening",
    "description": "Screen inbound resumes with AI and route qualified candidates to recruiters.",
    "category": "HR & People",
    "icon": "📋",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Application Email Received",
        "tool": "Email",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "email_received"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Score Resume",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Score resume 1-10 against job requirements. Return score."
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "Qualified Candidate?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "If resume score >= 7, mark as qualified."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Notify Recruiter",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "Alert recruiter with candidate summary and score."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Send Rejection Email",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 320
        },
        "config": {
          "message": "Send polite rejection email to unqualified applicant."
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Application Processed",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "Qualified"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5",
        "label": "Not Qualified"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-hrpeople-52"
  },
  {
    "name": "Performance Review Reminder",
    "description": "Schedule and remind managers and employees about upcoming performance reviews.",
    "category": "HR & People",
    "icon": "⭐",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Review Cycle Start",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 8 1 */6 *"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Employee List",
        "tool": "Google Sheets",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Pull active employee list with manager assignments."
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Draft Review Prompts",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Generate role-specific self-review questions for each employee."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Email Employees",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "Send self-review form and instructions to each employee."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Remind Managers on Slack",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 320
        },
        "config": {
          "message": "Alert managers to complete peer reviews within 2 weeks."
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Reviews Initiated",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "Employees"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5",
        "label": "Managers"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-hrpeople-53"
  },
  {
    "name": "Employee Exit Checklist",
    "description": "Trigger offboarding tasks when an employee resignation is confirmed.",
    "category": "HR & People",
    "icon": "👋",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Resignation Confirmed",
        "tool": "Form",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "form_submission"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Create Offboarding Tasks",
        "tool": "Notion",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Generate offboarding checklist page assigned to HR and IT."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Alert IT Team",
        "tool": "Slack",
        "position": {
          "x": 740,
          "y": 120
        },
        "config": {
          "message": "Notify IT to revoke access and recover equipment on last day."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Schedule Exit Interview",
        "tool": "Gmail",
        "position": {
          "x": 740,
          "y": 320
        },
        "config": {
          "message": "Send exit interview scheduling link to departing employee."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Update HR Records",
        "tool": "Airtable",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Mark employee status as departing with last day noted."
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Offboarding Started",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3",
        "label": "IT"
      },
      {
        "id": "e3",
        "source": "n2",
        "target": "n4",
        "label": "HR"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n5"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-hrpeople-54"
  },
  {
    "name": "Birthday & Work Anniversary",
    "description": "Automatically celebrate employee milestones with personalized Slack messages.",
    "category": "HR & People",
    "icon": "🎂",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Daily Check at 8AM",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 8 * * *"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Check Milestone Dates",
        "tool": "Google Sheets",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Query employee birthdays and hire dates matching today."
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Write Celebration Message",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Write fun, warm celebration message for each milestone employee."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Post to Slack",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Share celebration message in #celebrations channel with emoji."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Celebration Sent",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-hrpeople-55"
  },
  {
    "name": "Training Completion Tracker",
    "description": "Track mandatory training completions and escalate overdue employees to managers.",
    "category": "HR & People",
    "icon": "🎓",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Weekly Monday Check",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 9 * * 1"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Completion Data",
        "tool": "Google Sheets",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Pull training completion status for all active employees."
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "Overdue Employees?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "If training deadline passed and not complete, flag overdue."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Remind Employee",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "Send urgent training reminder email to overdue employees."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Escalate to Manager",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 320
        },
        "config": {
          "message": "Alert manager of team member with overdue mandatory training."
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Audit Complete",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "Overdue"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n6",
        "label": "All Complete"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n5"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-hrpeople-56"
  },
  {
    "name": "Birthday & Anniversary Alerts",
    "description": "Auto-send personalized messages to employees on their special dates.",
    "category": "HR & People",
    "icon": "🎂",
    "nodes": [
      {
        "id": "t1",
        "type": "trigger",
        "label": "Daily Schedule",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 8 * * *"
        }
      },
      {
        "id": "a1",
        "type": "action",
        "label": "Fetch Employee Records",
        "tool": "Google Sheets",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Read birthdays and work anniversaries from HR sheet"
        }
      },
      {
        "id": "ai1",
        "type": "ai",
        "label": "Write Personal Message",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Write a warm, personalized birthday or anniversary message."
        }
      },
      {
        "id": "a2",
        "type": "action",
        "label": "Post to Slack",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Post celebration message in #general channel"
        }
      },
      {
        "id": "e1",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1-2",
        "source": "t1",
        "target": "a1"
      },
      {
        "id": "e2-3",
        "source": "a1",
        "target": "ai1"
      },
      {
        "id": "e3-4",
        "source": "ai1",
        "target": "a2"
      },
      {
        "id": "e4-5",
        "source": "a2",
        "target": "e1"
      }
    ],
    "id": "wf-hrpeople-57"
  },
  {
    "name": "Exit Interview Sentiment Analysis",
    "description": "Analyze exit interview responses and log insights to HR dashboard.",
    "category": "HR & People",
    "icon": "🚪",
    "nodes": [
      {
        "id": "t1",
        "type": "trigger",
        "label": "Exit Form Submitted",
        "tool": "Form",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "form_submission"
        }
      },
      {
        "id": "ai1",
        "type": "ai",
        "label": "Analyze Sentiment",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Analyze exit interview for themes, sentiment, and risk factors."
        }
      },
      {
        "id": "a1",
        "type": "action",
        "label": "Log to Airtable",
        "tool": "Airtable",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Save sentiment scores and themes to exit interview tracker"
        }
      },
      {
        "id": "a2",
        "type": "action",
        "label": "Alert HR Manager",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Notify HR manager with summary of exit feedback"
        }
      },
      {
        "id": "e1",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1-2",
        "source": "t1",
        "target": "ai1"
      },
      {
        "id": "e2-3",
        "source": "ai1",
        "target": "a1"
      },
      {
        "id": "e3-4",
        "source": "a1",
        "target": "a2"
      },
      {
        "id": "e4-5",
        "source": "a2",
        "target": "e1"
      }
    ],
    "id": "wf-hrpeople-58"
  },
  {
    "name": "PTO Request Auto-Approval",
    "description": "Route PTO requests based on team coverage rules and auto-approve or escalate.",
    "category": "HR & People",
    "icon": "🏖️",
    "nodes": [
      {
        "id": "t1",
        "type": "trigger",
        "label": "PTO Request Form",
        "tool": "Form",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "form_submission"
        }
      },
      {
        "id": "c1",
        "type": "condition",
        "label": "Check Team Coverage",
        "tool": "Logic",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "condition": "Less than 30% of team already on leave that week"
        }
      },
      {
        "id": "a1",
        "type": "action",
        "label": "Auto-Approve & Notify",
        "tool": "Gmail",
        "position": {
          "x": 740,
          "y": 120
        },
        "config": {
          "message": "Send approval email and update calendar"
        }
      },
      {
        "id": "a2",
        "type": "action",
        "label": "Escalate to Manager",
        "tool": "Slack",
        "position": {
          "x": 740,
          "y": 320
        },
        "config": {
          "message": "Notify manager to manually review the PTO conflict"
        }
      },
      {
        "id": "e1",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1-2",
        "source": "t1",
        "target": "c1"
      },
      {
        "id": "e2-3",
        "source": "c1",
        "target": "a1",
        "label": "Coverage OK"
      },
      {
        "id": "e2-4",
        "source": "c1",
        "target": "a2",
        "label": "Conflict"
      },
      {
        "id": "e3-5",
        "source": "a1",
        "target": "e1"
      },
      {
        "id": "e4-5",
        "source": "a2",
        "target": "e1"
      }
    ],
    "id": "wf-hrpeople-59"
  },
  {
    "name": "Weekly Pulse Survey Digest",
    "description": "Collect weekly employee pulse survey data and summarize trends for leadership.",
    "category": "HR & People",
    "icon": "📊",
    "nodes": [
      {
        "id": "t1",
        "type": "trigger",
        "label": "Every Friday 3PM",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 15 * * 5"
        }
      },
      {
        "id": "a1",
        "type": "action",
        "label": "Pull Survey Responses",
        "tool": "Google Sheets",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Fetch this week's pulse survey results from the sheet"
        }
      },
      {
        "id": "ai1",
        "type": "ai",
        "label": "Summarize Trends",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Summarize morale trends, top concerns, and positive highlights."
        }
      },
      {
        "id": "a2",
        "type": "action",
        "label": "Email Leadership Digest",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Send formatted weekly digest to leadership team"
        }
      },
      {
        "id": "e1",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1-2",
        "source": "t1",
        "target": "a1"
      },
      {
        "id": "e2-3",
        "source": "a1",
        "target": "ai1"
      },
      {
        "id": "e3-4",
        "source": "ai1",
        "target": "a2"
      },
      {
        "id": "e4-5",
        "source": "a2",
        "target": "e1"
      }
    ],
    "id": "wf-hrpeople-60"
  },
  {
    "name": "New Hire Equipment Request",
    "description": "Trigger IT equipment orders automatically when a new hire record is created.",
    "category": "HR & People",
    "icon": "💻",
    "nodes": [
      {
        "id": "t1",
        "type": "trigger",
        "label": "New Hire Added",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "a1",
        "type": "action",
        "label": "Create Notion Task",
        "tool": "Notion",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Create IT setup checklist in onboarding workspace"
        }
      },
      {
        "id": "a2",
        "type": "action",
        "label": "Submit Equipment Order",
        "tool": "HTTP",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "POST equipment request to IT procurement API"
        }
      },
      {
        "id": "a3",
        "type": "action",
        "label": "Notify IT via Slack",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Alert #it-ops with new hire name, role, and start date"
        }
      },
      {
        "id": "e1",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1-2",
        "source": "t1",
        "target": "a1"
      },
      {
        "id": "e2-3",
        "source": "a1",
        "target": "a2"
      },
      {
        "id": "e3-4",
        "source": "a2",
        "target": "a3"
      },
      {
        "id": "e4-5",
        "source": "a3",
        "target": "e1"
      }
    ],
    "id": "wf-hrpeople-61"
  },
  {
    "name": "Performance Review Reminder",
    "description": "Send timely reminders to managers and employees before review deadlines.",
    "category": "HR & People",
    "icon": "📝",
    "nodes": [
      {
        "id": "t1",
        "type": "trigger",
        "label": "14 Days Before Review",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 9 * * 1"
        }
      },
      {
        "id": "a1",
        "type": "action",
        "label": "Fetch Upcoming Reviews",
        "tool": "Airtable",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Query reviews due within next 14 days from HR base"
        }
      },
      {
        "id": "ai1",
        "type": "ai",
        "label": "Draft Reminder Email",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Write a friendly review reminder with key prep tips."
        }
      },
      {
        "id": "a2",
        "type": "action",
        "label": "Email Manager & Employee",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Send reminder emails to both manager and direct report"
        }
      },
      {
        "id": "e1",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1-2",
        "source": "t1",
        "target": "a1"
      },
      {
        "id": "e2-3",
        "source": "a1",
        "target": "ai1"
      },
      {
        "id": "e3-4",
        "source": "ai1",
        "target": "a2"
      },
      {
        "id": "e4-5",
        "source": "a2",
        "target": "e1"
      }
    ],
    "id": "wf-hrpeople-62"
  },
  {
    "name": "Candidate Rejection Notifier",
    "description": "Send compassionate rejection emails automatically when a candidate is declined.",
    "category": "HR & People",
    "icon": "📨",
    "nodes": [
      {
        "id": "t1",
        "type": "trigger",
        "label": "Stage Changed to Rejected",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "ai1",
        "type": "ai",
        "label": "Write Rejection Email",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Write a warm, respectful rejection email using candidate name and role."
        }
      },
      {
        "id": "a1",
        "type": "action",
        "label": "Send Rejection Email",
        "tool": "Gmail",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Send personalized rejection email to candidate"
        }
      },
      {
        "id": "a2",
        "type": "action",
        "label": "Update ATS Record",
        "tool": "HTTP",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "PATCH candidate status and log email sent timestamp"
        }
      },
      {
        "id": "e1",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1-2",
        "source": "t1",
        "target": "ai1"
      },
      {
        "id": "e2-3",
        "source": "ai1",
        "target": "a1"
      },
      {
        "id": "e3-4",
        "source": "a1",
        "target": "a2"
      },
      {
        "id": "e4-5",
        "source": "a2",
        "target": "e1"
      }
    ],
    "id": "wf-hrpeople-63"
  },
  {
    "name": "Headcount Report Generator",
    "description": "Auto-generate a weekly headcount and attrition report for HR leadership.",
    "category": "HR & People",
    "icon": "👥",
    "nodes": [
      {
        "id": "t1",
        "type": "trigger",
        "label": "Every Monday 8AM",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 8 * * 1"
        }
      },
      {
        "id": "a1",
        "type": "action",
        "label": "Pull HRIS Data",
        "tool": "Google Sheets",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Read active employees, new hires, and terminations this week"
        }
      },
      {
        "id": "ai1",
        "type": "ai",
        "label": "Generate Report Narrative",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Write a concise headcount summary with changes and attrition rate."
        }
      },
      {
        "id": "a2",
        "type": "action",
        "label": "Post to Notion",
        "tool": "Notion",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Append weekly report to HR Analytics Notion page"
        }
      },
      {
        "id": "a3",
        "type": "action",
        "label": "Email to CHRO",
        "tool": "Gmail",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {
          "message": "Send formatted headcount report to CHRO and HR business partners"
        }
      },
      {
        "id": "e1",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1400,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1-2",
        "source": "t1",
        "target": "a1"
      },
      {
        "id": "e2-3",
        "source": "a1",
        "target": "ai1"
      },
      {
        "id": "e3-4",
        "source": "ai1",
        "target": "a2"
      },
      {
        "id": "e4-5",
        "source": "a2",
        "target": "a3"
      },
      {
        "id": "e5-6",
        "source": "a3",
        "target": "e1"
      }
    ],
    "id": "wf-hrpeople-64"
  },
  {
    "name": "Invoice Payment Reminder",
    "description": "Automatically send payment reminders for overdue invoices via email.",
    "category": "Finance",
    "icon": "💸",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Daily Schedule",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 9 * * *"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Overdue Invoices",
        "tool": "HTTP",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "GET /api/invoices?status=overdue"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Draft Reminder Email",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Write a polite overdue invoice reminder with amount and due date."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Send Reminder Email",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Send drafted reminder to client email."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-finance-65"
  },
  {
    "name": "Expense Report Approval",
    "description": "Route submitted expense reports to managers for approval automatically.",
    "category": "Finance",
    "icon": "🧾",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Expense Form Submitted",
        "tool": "Form",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "form_submit"
        }
      },
      {
        "id": "n2",
        "type": "condition",
        "label": "Amount Over $500?",
        "tool": "Logic",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "condition": "expense_amount > 500"
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Notify Finance Manager",
        "tool": "Slack",
        "position": {
          "x": 740,
          "y": 120
        },
        "config": {
          "message": "High-value expense requires your approval."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Auto-Approve & Log",
        "tool": "Google Sheets",
        "position": {
          "x": 740,
          "y": 320
        },
        "config": {
          "message": "Log approved expense to finance sheet."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3",
        "label": "Yes"
      },
      {
        "id": "e3",
        "source": "n2",
        "target": "n4",
        "label": "No"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-finance-66"
  },
  {
    "name": "Monthly Budget Report",
    "description": "Generate and distribute a monthly budget vs actuals report to stakeholders.",
    "category": "Finance",
    "icon": "📊",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Monthly Schedule",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 8 1 * *"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Pull Budget Data",
        "tool": "Google Sheets",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Read budget vs actuals from finance spreadsheet."
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Generate Summary",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Summarize budget vs actuals with key variances and insights."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Email Report",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Send monthly budget report to finance team."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-finance-67"
  },
  {
    "name": "New Payment CRM Update",
    "description": "Log successful Stripe payments into HubSpot CRM and notify the sales team.",
    "category": "Finance",
    "icon": "💳",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Stripe Payment Received",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "stripe_payment_succeeded"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Update HubSpot Deal",
        "tool": "HubSpot",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Mark deal as closed-won with payment amount."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Notify Sales Team",
        "tool": "Slack",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "New payment received! Post to #sales-wins channel."
        }
      },
      {
        "id": "n4",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      }
    ],
    "id": "wf-finance-68"
  },
  {
    "name": "Fraud Alert Detection",
    "description": "Detect unusual transactions and alert the finance team immediately via Slack.",
    "category": "Finance",
    "icon": "🚨",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Transaction Webhook",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "transaction_created"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Analyze Transaction",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Flag transaction if amount, location, or pattern looks suspicious."
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "Fraud Detected?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "fraud_score > 0.8"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Alert Finance Team",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "Suspicious transaction detected — please review immediately."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "Yes"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5",
        "label": "No"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-finance-69"
  },
  {
    "name": "Subscription Churn Risk Alert",
    "description": "Identify at-risk subscribers before cancellation and trigger retention outreach.",
    "category": "Finance",
    "icon": "📉",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Weekly Schedule",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 9 * * MON"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Stripe Subscribers",
        "tool": "Stripe",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Get subscribers with failed payments or low usage."
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Score Churn Risk",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Rank customers by churn likelihood based on usage and payment data."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Send Retention Email",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Send personalized retention offer to high-risk customers."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-finance-70"
  },
  {
    "name": "Vendor Invoice Processing",
    "description": "Parse incoming vendor invoices from email and log them into Airtable automatically.",
    "category": "Finance",
    "icon": "🗂️",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Invoice Email Received",
        "tool": "Email",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "email_received"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Extract Invoice Data",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Extract vendor name, amount, due date, and invoice number from email."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Log to Airtable",
        "tool": "Airtable",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Add extracted invoice data as new record in Invoices table."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Notify Accounts Payable",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "New vendor invoice logged and awaiting payment approval."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-finance-71"
  },
  {
    "name": "Cash Flow Forecast Alert",
    "description": "Monitor cash flow projections and alert CFO when runway drops below threshold.",
    "category": "Finance",
    "icon": "🔮",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Weekly Schedule",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 7 * * MON"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Financial Data",
        "tool": "Google Sheets",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Read cash balances, receivables, and payables from sheet."
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Forecast Cash Flow",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Project 90-day cash runway and flag if below 60-day threshold."
        }
      },
      {
        "id": "n4",
        "type": "condition",
        "label": "Low Runway?",
        "tool": "Logic",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "condition": "runway_days < 60"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Alert CFO via Email",
        "tool": "Gmail",
        "position": {
          "x": 1180,
          "y": 120
        },
        "config": {
          "message": "Send urgent cash flow warning with forecast details to CFO."
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1400,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5",
        "label": "Yes"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6",
        "label": "No"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-finance-72"
  },
  {
    "name": "Invoice Overdue Reminder",
    "description": "Automatically chase overdue invoices with personalized email reminders.",
    "category": "Finance",
    "icon": "🧾",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Daily Schedule",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 9 * * *"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Overdue Invoices",
        "tool": "HTTP",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "GET /invoices?status=overdue&days_past_due=7"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Draft Reminder Email",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Write a polite overdue invoice reminder with amount and due date."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Send Reminder Email",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Send overdue invoice reminder to client."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-finance-73"
  },
  {
    "name": "Expense Report Processor",
    "description": "Extract expense data from receipts and log them to a spreadsheet automatically.",
    "category": "Finance",
    "icon": "🧮",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Email Receipt Received",
        "tool": "Email",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "email_received"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Extract Expense Data",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Extract vendor, amount, date, and category from receipt email."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Log to Sheets",
        "tool": "Google Sheets",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Append extracted expense row to Expense Tracker sheet."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Notify Finance Team",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Post new expense logged notification to #finance channel."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-finance-74"
  },
  {
    "name": "Monthly Budget Alert",
    "description": "Monitor spending categories and alert the team when budgets near limits.",
    "category": "Finance",
    "icon": "📊",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Weekly Schedule",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 8 * * 1"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Pull Budget Data",
        "tool": "Google Sheets",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Read current spend vs budget for all departments."
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "Over 80% Used?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "Any category spend > 80% of monthly budget"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Send Budget Alert",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "Alert #finance that a budget category is near its limit."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "Over Limit"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5",
        "label": "Within Budget"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-finance-75"
  },
  {
    "name": "New Payment Slack Notify",
    "description": "Ping the team instantly in Slack whenever a new Stripe payment is received.",
    "category": "Finance",
    "icon": "💳",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Stripe Payment Webhook",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Format Payment Summary",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Summarize payment: customer name, amount, plan, and timestamp."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Post to Slack",
        "tool": "Slack",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Post payment received summary to #revenue channel."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Log to Airtable",
        "tool": "Airtable",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Record payment details in Payments tracking base."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-finance-76"
  },
  {
    "name": "Vendor Bill Auto-Categorizer",
    "description": "Classify incoming vendor bills by category and route to the right approver.",
    "category": "Finance",
    "icon": "🗂️",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "New Bill Email",
        "tool": "Email",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "email_received"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Classify Bill",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Classify bill as SaaS, Utilities, Payroll, or Marketing spend."
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "Amount Over $5000?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "Bill total amount > $5000"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Escalate to CFO",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "Forward bill to CFO for approval with category and amount."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Log to Notion",
        "tool": "Notion",
        "position": {
          "x": 960,
          "y": 320
        },
        "config": {
          "message": "Save categorized bill details to Vendor Bills database."
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "High Value"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5",
        "label": "Standard"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-finance-77"
  },
  {
    "name": "Weekly P&L Summary",
    "description": "Auto-generate a weekly profit and loss summary and email it to leadership.",
    "category": "Finance",
    "icon": "📈",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Friday Schedule",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 16 * * 5"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Pull Revenue & Costs",
        "tool": "Google Sheets",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Fetch weekly revenue and expense totals from Finance sheet."
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Generate P&L Report",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Write a weekly P&L summary with key insights and trends."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Email to Leadership",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Send weekly P&L report email to CEO and CFO."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-finance-78"
  },
  {
    "name": "Refund Request Handler",
    "description": "Process customer refund requests, validate them, and trigger Stripe refunds automatically.",
    "category": "Finance",
    "icon": "↩️",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Refund Form Submitted",
        "tool": "Form",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "form_submission"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Validate Refund Request",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Check if refund is within 30 days and meets refund policy rules."
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "Eligible for Refund?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "Request meets refund policy criteria"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Issue Stripe Refund",
        "tool": "Stripe",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "Issue full or partial refund via Stripe API."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Send Denial Email",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 320
        },
        "config": {
          "message": "Email customer explaining why refund was denied."
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "Approved"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5",
        "label": "Denied"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-finance-79"
  },
  {
    "name": "Subscription Churn Risk Alert",
    "description": "Detect at-risk subscribers before they cancel and alert the success team.",
    "category": "Finance",
    "icon": "⚠️",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Daily Schedule",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 7 * * *"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Subscription Data",
        "tool": "Stripe",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "List subscriptions with failed payments or cancellation flags."
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Score Churn Risk",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Score each subscriber churn risk: low, medium, or high."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Alert Success Team",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Post high-risk churn subscribers list to #customer-success."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Update HubSpot",
        "tool": "HubSpot",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {
          "message": "Tag contacts with churn risk score in HubSpot CRM."
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1400,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      },
      {
        "id": "e5",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-finance-80"
  },
  {
    "name": "Invoice Approval Workflow",
    "description": "Route invoices for approval based on amount thresholds automatically.",
    "category": "Operations",
    "icon": "🧾",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Invoice Received",
        "tool": "Email",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "email",
          "instructions": "Trigger on invoices received in inbox"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Extract Invoice Data",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Extract vendor, amount, due date from invoice email."
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "Amount Over $5000?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "Invoice amount exceeds $5000"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Notify Finance Manager",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "High-value invoice requires your approval: {{vendor}} {{amount}}"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Auto-log to Sheets",
        "tool": "Google Sheets",
        "position": {
          "x": 960,
          "y": 320
        },
        "config": {
          "message": "Log invoice details to approved invoices sheet."
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "Yes"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5",
        "label": "No"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-operations-81"
  },
  {
    "name": "Employee Onboarding Kickoff",
    "description": "Automatically set up accounts and send welcome resources when a new hire joins.",
    "category": "Operations",
    "icon": "🧑‍💼",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "New Hire Form Submitted",
        "tool": "Form",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "form"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Generate Welcome Email",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Write a personalized welcome email for the new employee."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Send Welcome Email",
        "tool": "Gmail",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Send generated welcome email to new hire."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Create Notion Page",
        "tool": "Notion",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "Create onboarding checklist page for new hire in Notion."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Alert HR on Slack",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 320
        },
        "config": {
          "message": "Notify HR channel: new hire {{name}} starts {{start_date}}."
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Onboarding Started",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-operations-82"
  },
  {
    "name": "Daily Ops Standup Digest",
    "description": "Compile team updates each morning and post a digest to Slack automatically.",
    "category": "Operations",
    "icon": "📋",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Every Weekday 8AM",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 8 * * 1-5"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Tasks from Airtable",
        "tool": "Airtable",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Fetch all tasks due today from operations table."
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Summarize Daily Tasks",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Summarize today's tasks into a concise standup digest."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Post to Slack",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Post daily standup digest to #operations channel."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Digest Sent",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-operations-83"
  },
  {
    "name": "Vendor Contract Expiry Alert",
    "description": "Scan contracts weekly and alert team before vendor agreements expire.",
    "category": "Operations",
    "icon": "📝",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Every Monday 9AM",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 9 * * 1"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Contracts Sheet",
        "tool": "Google Sheets",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Read all vendor contracts and expiry dates from sheet."
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "Expiring in 30 Days?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "Contract expiry date is within 30 days of today"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Send Alert Email",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "Alert ops team: {{vendor}} contract expires on {{date}}."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "Yes"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5",
        "label": "No"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-operations-84"
  },
  {
    "name": "Support Ticket Auto-Triage",
    "description": "Classify and route incoming support tickets to the right team instantly.",
    "category": "Operations",
    "icon": "🎫",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Support Email Received",
        "tool": "Email",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "email"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Classify Ticket",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Classify ticket as billing, technical, or general inquiry."
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "Ticket Type?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "Ticket category is billing or technical"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Route to Billing Team",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "New billing ticket from {{customer}}: {{summary}}"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Route to Tech Support",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 320
        },
        "config": {
          "message": "New tech ticket from {{customer}}: {{summary}}"
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Ticket Routed",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "Billing"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5",
        "label": "Technical"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-operations-85"
  },
  {
    "name": "Weekly KPI Report Generator",
    "description": "Pull metrics, generate an AI summary, and email the weekly KPI report.",
    "category": "Operations",
    "icon": "📊",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Every Friday 5PM",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 17 * * 5"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Pull KPI Data",
        "tool": "Google Sheets",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Fetch this week's KPI data from the metrics spreadsheet."
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Generate KPI Summary",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Summarize KPIs, highlight wins and areas needing attention."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Email Report to Leadership",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Send weekly KPI summary report to leadership team."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Report Sent",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-operations-86"
  },
  {
    "name": "Inventory Low Stock Alert",
    "description": "Monitor inventory levels and alert purchasing team when stock runs low.",
    "category": "Operations",
    "icon": "📦",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Every Day 7AM",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 7 * * *"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Read Inventory Sheet",
        "tool": "Airtable",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Fetch current stock levels for all SKUs from inventory base."
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "Stock Below Threshold?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "Any SKU stock level is below reorder threshold"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Alert Purchasing Team",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "Low stock alert: {{sku}} has only {{qty}} units remaining."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "Yes"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5",
        "label": "No"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-operations-87"
  },
  {
    "name": "Meeting Notes to Action Items",
    "description": "Convert meeting notes into assigned action items and log them to Notion.",
    "category": "Operations",
    "icon": "🗒️",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Notes Submitted via Form",
        "tool": "Form",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "form"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Extract Action Items",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Extract action items with owners and deadlines from notes."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Log to Notion",
        "tool": "Notion",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Create action item entries in the team task tracker in Notion."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Notify Assignees on Slack",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "DM each assignee their action items from today's meeting."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Actions Assigned",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-operations-88"
  },
  {
    "name": "Employee Onboarding Checklist",
    "description": "Auto-create onboarding tasks and send welcome resources when new hire is added.",
    "category": "Operations",
    "icon": "🧑‍💼",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "New Hire Added",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Create Notion Onboarding Page",
        "tool": "Notion",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Create onboarding checklist page for new employee"
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Send Welcome Email",
        "tool": "Gmail",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Send welcome email with first-day instructions and resources"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Notify HR Slack Channel",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Post new hire announcement to #hr-onboarding channel"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Onboarding Initiated",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-operations-89"
  },
  {
    "name": "Vendor Invoice Processing",
    "description": "Extract invoice data from emails and log to sheets for approval tracking.",
    "category": "Operations",
    "icon": "🧾",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Invoice Email Received",
        "tool": "Email",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "email"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Extract Invoice Details",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Extract vendor, amount, due date, and line items from invoice"
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "Amount Over $5000?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "Invoice amount exceeds $5000"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Flag for Manager Approval",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "Alert finance manager for invoice approval over threshold"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Log to Invoice Tracker",
        "tool": "Google Sheets",
        "position": {
          "x": 960,
          "y": 320
        },
        "config": {
          "message": "Append invoice data to monthly tracker spreadsheet"
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Invoice Logged",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "Yes"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5",
        "label": "No"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-operations-90"
  },
  {
    "name": "Daily Standup Summary",
    "description": "Collect team updates via form and post a digest to Slack every morning.",
    "category": "Operations",
    "icon": "📋",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Standup Form Submitted",
        "tool": "Form",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "form"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Log Update to Sheet",
        "tool": "Google Sheets",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Append standup update with timestamp to daily log sheet"
        }
      },
      {
        "id": "n3",
        "type": "trigger",
        "label": "9 AM Daily Schedule",
        "tool": "Schedule",
        "position": {
          "x": 520,
          "y": 350
        },
        "config": {
          "cron_expression": "0 9 * * 1-5"
        }
      },
      {
        "id": "n4",
        "type": "ai",
        "label": "Summarize Team Updates",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Summarize all standup entries into a concise team digest"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Post Digest to Slack",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Post morning standup digest to #team-updates channel"
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Digest Sent",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n4"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      },
      {
        "id": "e5",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-operations-91"
  },
  {
    "name": "SLA Breach Alert System",
    "description": "Monitor support tickets and alert team when response SLA is at risk.",
    "category": "Operations",
    "icon": "⏰",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Hourly Ticket Check",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 * * * *"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Open Tickets",
        "tool": "HTTP",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "GET open tickets older than 2 hours from support API"
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "SLA Breach Risk?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "Ticket open time exceeds 80% of SLA window"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Alert Support Team",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "Send urgent SLA breach warning to #support-ops channel"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Check Complete",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "At Risk"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5",
        "label": "OK"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-operations-92"
  },
  {
    "name": "Asset Request Approval Flow",
    "description": "Route equipment requests through manager approval before IT fulfillment.",
    "category": "Operations",
    "icon": "💻",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Asset Request Submitted",
        "tool": "Form",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "form"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Log Request to Airtable",
        "tool": "Airtable",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Create new asset request record with status Pending"
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Email Manager for Approval",
        "tool": "Gmail",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Send approval request email to direct manager with item details"
        }
      },
      {
        "id": "n4",
        "type": "condition",
        "label": "Manager Approved?",
        "tool": "Logic",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "condition": "Manager clicked approve link in email"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Notify IT to Fulfill",
        "tool": "Slack",
        "position": {
          "x": 1180,
          "y": 120
        },
        "config": {
          "message": "Alert IT team in #it-requests to prepare and ship asset"
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Request Resolved",
        "tool": "End",
        "position": {
          "x": 1400,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5",
        "label": "Approved"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6",
        "label": "Denied"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-operations-93"
  },
  {
    "name": "Weekly KPI Report Generator",
    "description": "Pull metrics from sheets, generate AI summary, and email leadership weekly.",
    "category": "Operations",
    "icon": "📊",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Every Monday 8 AM",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 8 * * 1"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch KPI Data",
        "tool": "Google Sheets",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Read last 7 days of KPI metrics from Operations Dashboard sheet"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Generate Executive Summary",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Write a concise executive KPI summary with highlights and risks"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Email Leadership Team",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Send formatted weekly KPI report to leadership distribution list"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Report Sent",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-operations-94"
  },
  {
    "name": "Contract Expiry Reminder",
    "description": "Scan vendor contracts in Airtable and send reminders 30 days before expiry.",
    "category": "Operations",
    "icon": "📝",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Daily at 7 AM",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 7 * * *"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Query Expiring Contracts",
        "tool": "Airtable",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Filter contracts expiring within 30 days from Vendor table"
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "Contracts Found?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "At least one contract expiring within 30 days"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Alert Procurement Team",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "Post expiring contract list to #procurement with renewal links"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Email Contract Owner",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 320
        },
        "config": {
          "message": "Send contract expiry reminder to assigned owner for each contract"
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Reminders Sent",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "Yes"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n6",
        "label": "None"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n5"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-operations-95"
  },
  {
    "name": "Incident Response Escalation",
    "description": "Detect system incidents via webhook and auto-escalate to on-call engineer.",
    "category": "Operations",
    "icon": "🚨",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Incident Alert Received",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Classify Severity",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Classify incident as P1, P2, or P3 based on impact description"
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "Is P1 Critical?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "Incident severity equals P1"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Page On-Call Engineer",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "Send urgent @oncall page to #incidents with full incident details"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Log to Incident Tracker",
        "tool": "Notion",
        "position": {
          "x": 960,
          "y": 320
        },
        "config": {
          "message": "Create incident log page with severity, time, and initial details"
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Incident Logged",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "P1"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5",
        "label": "P2/P3"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n5"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-operations-96"
  },
  {
    "name": "GitHub PR Review Bot",
    "description": "Auto-review pull requests and post AI feedback as GitHub comments.",
    "category": "Engineering",
    "icon": "🤖",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "PR Opened",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook",
          "instructions": "Trigger on GitHub pull_request opened event"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Review Code Changes",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Review PR diff for bugs, style issues, and improvements."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Post GitHub Comment",
        "tool": "HTTP",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "POST review feedback to GitHub PR comments API"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Notify Team on Slack",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "New PR review posted for {{pr.title}} by AI bot."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-engineering-97"
  },
  {
    "name": "On-Call Incident Alerting",
    "description": "Detect critical errors from logs and page the on-call engineer instantly.",
    "category": "Engineering",
    "icon": "🚨",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Error Log Webhook",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook",
          "instructions": "Receive error payloads from logging service"
        }
      },
      {
        "id": "n2",
        "type": "condition",
        "label": "Is Severity Critical?",
        "tool": "Logic",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "condition": "error.severity === 'critical'"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Summarize Incident",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 120
        },
        "config": {
          "instructions": "Summarize error log into a concise incident report."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Page On-Call via Slack",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "🚨 INCIDENT: {{summary}} — @oncall please respond."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3",
        "label": "Critical"
      },
      {
        "id": "e3",
        "source": "n2",
        "target": "n5",
        "label": "Non-critical"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-engineering-98"
  },
  {
    "name": "Daily Standup Digest",
    "description": "Collect async standup updates and post a daily digest to Slack.",
    "category": "Engineering",
    "icon": "📋",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "9AM Daily Schedule",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 9 * * 1-5"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Updates from Notion",
        "tool": "Notion",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Query standup database for today's entries"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Summarize Updates",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Summarize team standup notes into a clear daily digest."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Post to Slack #engineering",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Good morning! Here's today's standup digest:\n{{summary}}"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-engineering-99"
  },
  {
    "name": "Deploy Failure Rollback Alert",
    "description": "Detect failed deployments and notify the team with rollback instructions.",
    "category": "Engineering",
    "icon": "🔴",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Deploy Webhook",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook",
          "instructions": "Receive CI/CD deployment status events"
        }
      },
      {
        "id": "n2",
        "type": "condition",
        "label": "Did Deploy Fail?",
        "tool": "Logic",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "condition": "deploy.status === 'failed'"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Generate Rollback Steps",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 120
        },
        "config": {
          "instructions": "Generate rollback instructions from deployment error logs."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Alert Team on Slack",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "🔴 Deploy failed on {{env}}. Rollback steps: {{steps}}"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3",
        "label": "Failed"
      },
      {
        "id": "e3",
        "source": "n2",
        "target": "n5",
        "label": "Success"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-engineering-100"
  },
  {
    "name": "Bug Report to Ticket",
    "description": "Convert incoming bug report emails into structured Notion tickets automatically.",
    "category": "Engineering",
    "icon": "🐛",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Bug Report Email",
        "tool": "Email",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "email",
          "instructions": "Listen for emails to bugs@company.com"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Extract Bug Details",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Extract title, severity, and steps to reproduce from email."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Create Notion Ticket",
        "tool": "Notion",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Create bug ticket with extracted fields in Engineering DB"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Notify on Slack",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "🐛 New bug ticket created: {{title}} ({{severity}})"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-engineering-101"
  },
  {
    "name": "Weekly Tech Debt Report",
    "description": "Scan code metrics weekly and email a tech debt summary to engineering leads.",
    "category": "Engineering",
    "icon": "📊",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Every Monday 8AM",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 8 * * 1"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Metrics from Sheets",
        "tool": "Google Sheets",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Read code quality and tech debt metrics from tracking sheet"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Generate Debt Report",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Analyze metrics and write a tech debt summary with priorities."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Email Engineering Leads",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Weekly Tech Debt Report: {{report}}"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-engineering-102"
  },
  {
    "name": "API Uptime Monitor",
    "description": "Ping API endpoints every 5 minutes and alert on failures via Slack.",
    "category": "Engineering",
    "icon": "📡",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Every 5 Minutes",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "*/5 * * * *"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Ping API Endpoints",
        "tool": "HTTP",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "GET request to all monitored API health-check endpoints"
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "Any Endpoint Down?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "response.status !== 200 || response.time > 3000"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Alert #ops on Slack",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "⚠️ API down: {{endpoint}} returned {{status}}. Check now!"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "Down"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5",
        "label": "All OK"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-engineering-103"
  },
  {
    "name": "New Engineer Onboarding",
    "description": "Auto-provision tools and send onboarding docs when a new engineer joins.",
    "category": "Engineering",
    "icon": "👋",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "New Engineer Form",
        "tool": "Form",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "form",
          "instructions": "Collect new hire name, email, team, start date"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Generate Welcome Message",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Write a personalized welcome email for the new engineer."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Send Welcome Email",
        "tool": "Gmail",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Send onboarding email with docs, tools, and first-week plan"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Create Notion Onboarding Page",
        "tool": "Notion",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Create personal onboarding checklist page for new engineer"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Announce in Slack",
        "tool": "Slack",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {
          "message": "👋 Please welcome {{name}} to the {{team}} team today!"
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1400,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      },
      {
        "id": "e5",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-engineering-104"
  },
  {
    "name": "On-Call Alert Escalation",
    "description": "Auto-escalate critical alerts to on-call engineers via Slack and SMS.",
    "category": "Engineering",
    "icon": "🚨",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "PagerDuty Webhook",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "n2",
        "type": "condition",
        "label": "Check Severity",
        "tool": "Logic",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "condition": "severity == 'critical'"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Summarize Alert",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 120
        },
        "config": {
          "instructions": "Summarize the alert with impact and suggested first steps."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Notify On-Call Slack",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "🚨 Critical alert: {{summary}} — please respond immediately."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Log to Sheet",
        "tool": "Google Sheets",
        "position": {
          "x": 740,
          "y": 320
        },
        "config": {
          "message": "Log low-severity alert with timestamp and details."
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3",
        "label": "Critical"
      },
      {
        "id": "e3",
        "source": "n2",
        "target": "n5",
        "label": "Low"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-engineering-105"
  },
  {
    "name": "PR Review Reminder Bot",
    "description": "Remind engineers on Slack about open PRs that haven't been reviewed in 24h.",
    "category": "Engineering",
    "icon": "🔍",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Daily Schedule",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 9 * * 1-5"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Open PRs",
        "tool": "HTTP",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "GET /repos/:owner/:repo/pulls?state=open from GitHub API"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Identify Stale PRs",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Find PRs with no review activity in over 24 hours."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Post Slack Reminder",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "👀 These PRs need review: {{stale_prs}}. Please take a look!"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-engineering-106"
  },
  {
    "name": "Deploy Failure Postmortem",
    "description": "Auto-generate a postmortem draft when a production deploy fails.",
    "category": "Engineering",
    "icon": "📝",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Deploy Failure Webhook",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Draft Postmortem",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Draft a postmortem with timeline, impact, root cause, and action items."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Create Notion Page",
        "tool": "Notion",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Create postmortem page in Engineering > Incidents database."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Notify Eng Channel",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "📋 Postmortem draft created for {{deploy_id}}: {{notion_link}}"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-engineering-107"
  },
  {
    "name": "API Error Rate Monitor",
    "description": "Alert on-call team when API error rate exceeds threshold in any environment.",
    "category": "Engineering",
    "icon": "📉",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Metrics Webhook",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "n2",
        "type": "condition",
        "label": "Error Rate > 5%?",
        "tool": "Logic",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "condition": "error_rate > 0.05"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Analyze Error Spike",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 120
        },
        "config": {
          "instructions": "Analyze error patterns and suggest probable root causes."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Page On-Call",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "🔴 API error rate at {{error_rate}}%! Analysis: {{analysis}}"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Log Metric",
        "tool": "Google Sheets",
        "position": {
          "x": 740,
          "y": 320
        },
        "config": {
          "message": "Log error rate reading with timestamp and environment."
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3",
        "label": "Above threshold"
      },
      {
        "id": "e3",
        "source": "n2",
        "target": "n5",
        "label": "Normal"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-engineering-108"
  },
  {
    "name": "Sprint Standup Digest",
    "description": "Collect async standups and post a team digest to Slack every morning.",
    "category": "Engineering",
    "icon": "☀️",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Morning Schedule",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 9 * * 1-5"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Standup Form Responses",
        "tool": "Google Sheets",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Read standup responses submitted since yesterday 5pm."
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Compile Digest",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Summarize standup updates into a concise team digest."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Post to #standup",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "☀️ Today's standup digest:\n{{digest}}"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-engineering-109"
  },
  {
    "name": "Security Vulnerability Triage",
    "description": "Triage Dependabot alerts by severity and assign tickets to the right team.",
    "category": "Engineering",
    "icon": "🔒",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Dependabot Webhook",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "n2",
        "type": "condition",
        "label": "Severity Critical?",
        "tool": "Logic",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "condition": "severity == 'critical' or severity == 'high'"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Generate Fix Guidance",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 120
        },
        "config": {
          "instructions": "Suggest remediation steps for this CVE based on package and version."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Create Urgent Ticket",
        "tool": "HTTP",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "POST to Jira: create high-priority security ticket with fix guidance."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Log to Backlog",
        "tool": "Notion",
        "position": {
          "x": 740,
          "y": 320
        },
        "config": {
          "message": "Add low-severity CVE to security backlog in Notion."
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3",
        "label": "High/Critical"
      },
      {
        "id": "e3",
        "source": "n2",
        "target": "n5",
        "label": "Low/Medium"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-engineering-110"
  },
  {
    "name": "New Engineer Onboarding",
    "description": "Auto-provision tools and send welcome resources when a new engineer joins.",
    "category": "Engineering",
    "icon": "🧑‍💻",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "HR Form Submission",
        "tool": "Form",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "instructions": "Trigger when new engineer added to HR system."
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Personalize Welcome",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Write a personalized welcome email based on role and team."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Send Welcome Email",
        "tool": "Gmail",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Send personalized onboarding email with links and first week plan."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Add to Notion Docs",
        "tool": "Notion",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Add engineer to team roster and share onboarding docs."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Invite to Slack Channels",
        "tool": "Slack",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {
          "message": "Invite new engineer to #engineering, #team, and #general."
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1400,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      },
      {
        "id": "e5",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-engineering-111"
  },
  {
    "name": "Weekly Engineering Report",
    "description": "Auto-generate weekly engineering metrics report and email it to leadership.",
    "category": "Engineering",
    "icon": "📊",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Weekly Schedule",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 8 * * 5"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Pull Metrics Data",
        "tool": "Google Sheets",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Read deploy count, uptime, bug count, and PR metrics for the week."
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Generate Report",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Write an executive summary of engineering metrics with trends."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Email Leadership",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Send weekly engineering report email to CTO and VPs."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-engineering-112"
  },
  {
    "name": "Feature Request Triage",
    "description": "Automatically categorize and route incoming feature requests to the right team.",
    "category": "Product",
    "icon": "🎯",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Feature Request Form",
        "tool": "Form",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "form_submission"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Classify Request",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Classify request: bug, UI, performance, or new feature. Output category."
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "Check Priority",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "If category is bug or high votes"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Create Jira Ticket",
        "tool": "HTTP",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "Create high-priority ticket in product backlog"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Log to Airtable",
        "tool": "Airtable",
        "position": {
          "x": 960,
          "y": 320
        },
        "config": {
          "message": "Add to feature request backlog for review"
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "High Priority"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5",
        "label": "Normal"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-product-113"
  },
  {
    "name": "User Feedback Digest",
    "description": "Collect user feedback daily and send a summarized digest to the product team.",
    "category": "Product",
    "icon": "📋",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Daily Schedule",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 9 * * 1-5"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Feedback",
        "tool": "Airtable",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Retrieve all new feedback submitted in last 24 hours"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Summarize Themes",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Identify top 3 themes and key pain points from user feedback."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Post to Slack",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Send digest to #product channel with themes and examples"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-product-114"
  },
  {
    "name": "Sprint Release Notes",
    "description": "Auto-generate polished release notes from completed sprint tickets.",
    "category": "Product",
    "icon": "📝",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Webhook: Sprint Close",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Tickets",
        "tool": "HTTP",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Pull all completed tickets from closed sprint via API"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Write Release Notes",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Write user-friendly release notes grouped by feature area."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Publish to Notion",
        "tool": "Notion",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Create new page in Release Notes section of Notion"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Notify Team",
        "tool": "Slack",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {
          "message": "Post release notes link to #releases Slack channel"
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1400,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      },
      {
        "id": "e5",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-product-115"
  },
  {
    "name": "Churn Risk Alerting",
    "description": "Detect at-risk users from usage data and alert the product team instantly.",
    "category": "Product",
    "icon": "🚨",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Daily Check",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 8 * * *"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Query Usage Data",
        "tool": "HTTP",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Fetch users with <2 logins in the past 14 days"
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "Any At-Risk Users?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "If at-risk user count is greater than 0"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Alert Slack",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "Post at-risk user list to #retention with account details"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Log to Sheets",
        "tool": "Google Sheets",
        "position": {
          "x": 960,
          "y": 320
        },
        "config": {
          "message": "Record run timestamp and zero churn risk result"
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "Yes"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5",
        "label": "No"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-product-116"
  },
  {
    "name": "NPS Response Handler",
    "description": "Route NPS survey responses and trigger follow-up actions by score.",
    "category": "Product",
    "icon": "⭐",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "NPS Survey Webhook",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "n2",
        "type": "condition",
        "label": "Score Segment",
        "tool": "Logic",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "condition": "If NPS score is 0-6 (detractor)"
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Alert CS Team",
        "tool": "Slack",
        "position": {
          "x": 740,
          "y": 120
        },
        "config": {
          "message": "Notify #cs-urgent with detractor details and comments"
        }
      },
      {
        "id": "n4",
        "type": "ai",
        "label": "Draft Follow-up Email",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 320
        },
        "config": {
          "instructions": "Write a warm follow-up email for promoter NPS scores."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Send Email",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 320
        },
        "config": {
          "message": "Send promoter follow-up email asking for referral or review"
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3",
        "label": "Detractor"
      },
      {
        "id": "e3",
        "source": "n2",
        "target": "n4",
        "label": "Promoter"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      },
      {
        "id": "e5",
        "source": "n3",
        "target": "n6"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-product-117"
  },
  {
    "name": "Bug Report Processor",
    "description": "Enrich incoming bug reports with context and auto-assign to engineering.",
    "category": "Product",
    "icon": "🐛",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Bug Report Form",
        "tool": "Form",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "form_submission"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Assess Severity",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Rate bug severity: critical, high, medium, low. Add reasoning."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Create GitHub Issue",
        "tool": "HTTP",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Open GitHub issue with severity label and AI summary"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Notify Engineering",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Post to #bugs with issue link and severity rating"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-product-118"
  },
  {
    "name": "Competitor Update Monitor",
    "description": "Track competitor product updates weekly and brief the product team.",
    "category": "Product",
    "icon": "🔍",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Weekly Schedule",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 8 * * MON"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Scrape Changelogs",
        "tool": "HTTP",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Fetch changelog pages from top 5 competitor websites"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Analyze Changes",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Summarize competitor updates and flag threats to our roadmap."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Update Notion Doc",
        "tool": "Notion",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Append weekly competitor summary to competitive intel page"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Email PM Team",
        "tool": "Gmail",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {
          "message": "Send competitive briefing email to product managers"
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1400,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      },
      {
        "id": "e5",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-product-119"
  },
  {
    "name": "Onboarding Milestone Tracker",
    "description": "Detect when users hit onboarding milestones and trigger celebratory nudges.",
    "category": "Product",
    "icon": "🎉",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "User Event Webhook",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "n2",
        "type": "condition",
        "label": "Milestone Reached?",
        "tool": "Logic",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "condition": "If event is first_export, invite_sent, or integration_added"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Personalize Message",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 120
        },
        "config": {
          "instructions": "Write a personalized in-app congrats message for the milestone."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Send In-App Message",
        "tool": "HTTP",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "Trigger in-app notification via messaging API for user"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Log to Sheets",
        "tool": "Google Sheets",
        "position": {
          "x": 740,
          "y": 320
        },
        "config": {
          "message": "Record skipped milestone event for funnel analysis"
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3",
        "label": "Yes"
      },
      {
        "id": "e3",
        "source": "n2",
        "target": "n5",
        "label": "No"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-product-120"
  },
  {
    "name": "Feature Request Triage",
    "description": "Automatically categorize and prioritize incoming feature requests from users.",
    "category": "Product",
    "icon": "🗂️",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Feature Request Form",
        "tool": "Form",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "form_submission"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Categorize & Score Request",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Categorize feature request by type and assign priority score 1-10."
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "High Priority?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "priority score >= 8"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Create Urgent Notion Task",
        "tool": "Notion",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "Add to urgent backlog with full context and score."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Log to Product Backlog",
        "tool": "Airtable",
        "position": {
          "x": 960,
          "y": 320
        },
        "config": {
          "message": "Log request to product backlog with category and score."
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Triaged",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "High Priority"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5",
        "label": "Normal Priority"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-product-121"
  },
  {
    "name": "Sprint Retrospective Summarizer",
    "description": "Compile team retro notes into structured summaries and action items automatically.",
    "category": "Product",
    "icon": "🔄",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Retro Notes Submitted",
        "tool": "Form",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "form_submission"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Summarize Retro",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Summarize retro notes into wins, blockers, and action items."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Save to Notion",
        "tool": "Notion",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Save structured retro summary to team wiki page."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Post to Slack",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Share retro summary and action items in #product channel."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Retro Archived",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-product-122"
  },
  {
    "name": "User Interview Insights Extractor",
    "description": "Turn raw user interview transcripts into product insights and tagged themes.",
    "category": "Product",
    "icon": "🎤",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Transcript Uploaded",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Extract Key Insights",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Extract pain points, quotes, and themes from interview transcript."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Log to Research Database",
        "tool": "Airtable",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Add tagged insights to user research database with metadata."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Notify Product Team",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Post top 3 insights to #user-research Slack channel."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Insights Saved",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-product-123"
  },
  {
    "name": "Weekly Product Metrics Digest",
    "description": "Compile key product metrics weekly and distribute a digest to stakeholders.",
    "category": "Product",
    "icon": "📊",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Every Monday 8AM",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 8 * * 1"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Metrics Sheet",
        "tool": "Google Sheets",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Pull last 7 days of product KPIs from metrics spreadsheet."
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Generate Digest",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Summarize metrics trends and highlight notable changes this week."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Email Digest to Team",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Send weekly product metrics digest email to stakeholder list."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Digest Sent",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-product-124"
  },
  {
    "name": "Bug Report Auto-Classifier",
    "description": "Classify incoming bug reports by severity and route to the right engineering team.",
    "category": "Product",
    "icon": "🐛",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Bug Report Webhook",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Classify Severity",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Classify bug severity as critical, high, medium, or low."
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "Critical Bug?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "severity == critical"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Page On-Call Engineer",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "Send urgent alert to on-call engineer with bug details."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Add to Bug Backlog",
        "tool": "Notion",
        "position": {
          "x": 960,
          "y": 320
        },
        "config": {
          "message": "Create bug task in backlog with severity label and context."
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Bug Routed",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "Critical"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5",
        "label": "Non-Critical"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-product-125"
  },
  {
    "name": "Changelog Draft Generator",
    "description": "Auto-generate user-facing changelog entries from completed tickets each release.",
    "category": "Product",
    "icon": "📝",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Release Tag Created",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Closed Tickets",
        "tool": "HTTP",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "GET closed sprint tickets from project management API."
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Write Changelog",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Write user-friendly changelog from technical ticket titles."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Save Draft to Notion",
        "tool": "Notion",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Save changelog draft to release notes page for PM review."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Draft Ready",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-product-126"
  },
  {
    "name": "NPS Score Alert & Analysis",
    "description": "Detect low NPS responses and trigger follow-up actions with AI sentiment analysis.",
    "category": "Product",
    "icon": "📉",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "NPS Survey Submitted",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "n2",
        "type": "condition",
        "label": "Detractor Score?",
        "tool": "Logic",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "condition": "nps_score <= 6"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Analyze Feedback",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 120
        },
        "config": {
          "instructions": "Identify root cause and suggest recovery action from NPS comment."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Alert Customer Success",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "Send detractor alert with analysis to #customer-success channel."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Log Promoter Score",
        "tool": "Google Sheets",
        "position": {
          "x": 740,
          "y": 320
        },
        "config": {
          "message": "Log promoter response to NPS tracking spreadsheet."
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "NPS Processed",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3",
        "label": "Detractor"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n2",
        "target": "n5",
        "label": "Promoter"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-product-127"
  },
  {
    "name": "Product Spec Review Reminder",
    "description": "Automatically remind reviewers about pending PRDs and escalate overdue approvals.",
    "category": "Product",
    "icon": "⏰",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Daily 9AM Check",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 9 * * 1-5"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Pending Specs",
        "tool": "Notion",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Query Notion for PRDs with review status pending over 2 days."
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "Overdue > 5 Days?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "days_pending > 5"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Escalate to Manager",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "Alert product manager about overdue spec review with doc link."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Send Gentle Reminder",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 320
        },
        "config": {
          "message": "Email reviewer a friendly reminder to complete PRD review."
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Reminders Sent",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "Overdue"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5",
        "label": "Pending"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-product-128"
  },
  {
    "name": "Contract Review Alert",
    "description": "AI reviews incoming contracts and flags risky clauses for legal team.",
    "category": "Legal",
    "icon": "📜",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Contract Email Received",
        "tool": "Email",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "email_received"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Analyze Contract Risks",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Review contract for risky clauses, liability issues, and missing terms."
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "High Risk Detected?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "Risk score is HIGH"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Alert Legal Team",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "High-risk contract flagged. Immediate review needed."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Log to Legal Tracker",
        "tool": "Notion",
        "position": {
          "x": 960,
          "y": 320
        },
        "config": {
          "message": "Save contract summary and risk score to legal database."
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "Yes"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5",
        "label": "No"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-legal-129"
  },
  {
    "name": "NDA Signing Reminder",
    "description": "Automatically follow up on unsigned NDAs after a set number of days.",
    "category": "Legal",
    "icon": "✍️",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Daily Schedule",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 9 * * *"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Check Unsigned NDAs",
        "tool": "Airtable",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Fetch NDAs with status=unsigned and sent_date older than 3 days."
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "Unsigned NDAs Found?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "Unsigned NDA count is greater than 0"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Send Reminder Email",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "Friendly reminder to sign the NDA. Link attached."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "Yes"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5",
        "label": "No"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-legal-130"
  },
  {
    "name": "Client Intake Automation",
    "description": "Collect new client details via form and create CRM record automatically.",
    "category": "Legal",
    "icon": "🧾",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Client Intake Form",
        "tool": "Form",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "form_submission"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Summarize Client Needs",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Summarize client case type, urgency, and key legal needs."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Create CRM Contact",
        "tool": "HubSpot",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Create new contact with case summary and intake date."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Notify Assigned Attorney",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "New client intake submitted. Review case summary in HubSpot."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-legal-131"
  },
  {
    "name": "Contract Expiry Monitor",
    "description": "Alert team 30 days before contracts expire to trigger renewal process.",
    "category": "Legal",
    "icon": "⏰",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Weekly Schedule",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 8 * * 1"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Expiring Contracts",
        "tool": "Google Sheets",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Get contracts with expiry date within next 30 days."
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Draft Renewal Summary",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Draft a renewal summary for each expiring contract."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Email Renewal Notice",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Send contract renewal notice with summary to client."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-legal-132"
  },
  {
    "name": "Legal Invoice Generator",
    "description": "Auto-generate and send invoices after billable hours are logged.",
    "category": "Legal",
    "icon": "💳",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Hours Logged in Sheet",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Calculate Invoice Amount",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Calculate total billable hours and apply correct billing rate."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Create Stripe Invoice",
        "tool": "Stripe",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Create invoice in Stripe with line items and due date."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Email Invoice to Client",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Send invoice email with payment link to client."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-legal-133"
  },
  {
    "name": "Compliance Deadline Tracker",
    "description": "Monitor regulatory deadlines and send proactive reminders to stakeholders.",
    "category": "Legal",
    "icon": "📅",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Daily Morning Check",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 7 * * *"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Compliance Dates",
        "tool": "Airtable",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Get compliance tasks due within 7 days and their owners."
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "Deadlines This Week?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "At least one deadline is within 7 days"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Send Slack Reminder",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "Compliance deadline reminder: task due within 7 days."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "Yes"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5",
        "label": "No"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-legal-134"
  },
  {
    "name": "Court Filing Confirmation",
    "description": "Log court filing confirmations and notify clients with case status updates.",
    "category": "Legal",
    "icon": "🏛️",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Filing Confirmation Email",
        "tool": "Email",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "email_received"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Extract Filing Details",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Extract case number, filing date, and document type from email."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Update Case Record",
        "tool": "Notion",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Update case record with filing details and confirmation number."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Notify Client",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Your court filing has been confirmed. Details inside."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-legal-135"
  },
  {
    "name": "Legal Research Digest",
    "description": "Weekly AI-generated digest of relevant case law and regulatory changes.",
    "category": "Legal",
    "icon": "🔍",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Weekly Research Run",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 6 * * 5"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Legal Updates",
        "tool": "HTTP",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Call legal news API for updates in practice areas."
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Summarize Key Updates",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Summarize top legal updates into a concise weekly digest."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Post to Legal Channel",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Post weekly legal research digest to #legal-updates channel."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-legal-136"
  },
  {
    "name": "Contract Expiry Alert System",
    "description": "Scan contracts daily and alert team before expiration deadlines.",
    "category": "Legal",
    "icon": "📅",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Daily Schedule",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 8 * * *"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Contracts",
        "tool": "Airtable",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Query contracts expiring within 30 days"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Summarize Expiry Risk",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Summarize expiring contracts and flag high-risk ones."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Notify Legal Team",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Post contract expiry summary to #legal-alerts channel"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-legal-137"
  },
  {
    "name": "Legal Invoice Dispute Handler",
    "description": "Automatically classify and route incoming invoice disputes to the right team.",
    "category": "Legal",
    "icon": "🧾",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Dispute Email Received",
        "tool": "Email",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "email"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Classify Dispute",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Classify dispute: billing error, fraud, contract breach, or other."
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "High Value Dispute?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "Dispute amount exceeds $10,000"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Escalate to Senior Counsel",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "Alert senior counsel with dispute summary and classification"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Log in HubSpot",
        "tool": "HubSpot",
        "position": {
          "x": 960,
          "y": 320
        },
        "config": {
          "message": "Create dispute case record with classification and email body"
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "Yes"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5",
        "label": "No"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-legal-138"
  },
  {
    "name": "Regulatory Change Monitor",
    "description": "Monitor regulatory feeds and brief legal team on relevant law changes.",
    "category": "Legal",
    "icon": "⚖️",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Weekly Schedule",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 9 * * 1"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Regulatory Feed",
        "tool": "HTTP",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "GET regulatory updates from gov RSS feeds and legal APIs"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Assess Relevance",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Flag updates relevant to our industry and summarize impact."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Save to Notion",
        "tool": "Notion",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Append regulatory briefing to Legal Knowledge Base page"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Email Legal Summary",
        "tool": "Gmail",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {
          "message": "Send weekly regulatory digest email to legal@company.com"
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1400,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      },
      {
        "id": "e5",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-legal-139"
  },
  {
    "name": "Client Intake Form Processor",
    "description": "Process new legal client intake forms and create CRM records automatically.",
    "category": "Legal",
    "icon": "📋",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Intake Form Submitted",
        "tool": "Form",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "form"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Extract Case Details",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Extract case type, urgency, and client details from intake form."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Create HubSpot Contact",
        "tool": "HubSpot",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Create new contact and deal with case type and priority tags"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Send Welcome Email",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Send personalized acknowledgment email with next steps to client"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-legal-140"
  },
  {
    "name": "Litigation Deadline Tracker",
    "description": "Track court filing deadlines and send automated reminders to attorneys.",
    "category": "Legal",
    "icon": "🏛️",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Daily Morning Check",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 7 * * 1-5"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Pull Deadline Records",
        "tool": "Google Sheets",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Fetch all deadlines due within 3, 7, and 14 days from sheet"
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "Urgent Deadline Today?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "Any deadline within 3 days exists"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Urgent Slack Alert",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "Send urgent deadline alert with case name and filing details"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Send Reminder Email",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 320
        },
        "config": {
          "message": "Email attorney list of upcoming deadlines for the week"
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "Yes"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5",
        "label": "No"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-legal-141"
  },
  {
    "name": "NDA Request Auto-Generator",
    "description": "Generate and send NDAs automatically when a request is submitted via form.",
    "category": "Legal",
    "icon": "🔏",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "NDA Request Form",
        "tool": "Form",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "form"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Draft NDA",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Draft mutual NDA using party names, purpose, and duration provided."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Save Draft to Notion",
        "tool": "Notion",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Store NDA draft in Legal Documents database with request metadata"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Email NDA for Review",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Send NDA draft to legal reviewer with approval instructions"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-legal-142"
  },
  {
    "name": "Legal Spend Analytics Reporter",
    "description": "Aggregate monthly legal spend data and generate executive cost reports.",
    "category": "Legal",
    "icon": "💰",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Monthly Schedule",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 8 1 * *"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Pull Billing Data",
        "tool": "Google Sheets",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Fetch all legal invoices and matter costs from billing spreadsheet"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Analyze Spend Trends",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Summarize legal spend by matter type, identify cost anomalies."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Update Airtable Report",
        "tool": "Airtable",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Log monthly spend summary and trend data to Legal Spend base"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Email CFO Report",
        "tool": "Gmail",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {
          "message": "Email monthly legal spend report to CFO and General Counsel"
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1400,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      },
      {
        "id": "e5",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-legal-143"
  },
  {
    "name": "Vendor Contract Risk Screener",
    "description": "Screen incoming vendor contracts for risky clauses before legal review.",
    "category": "Legal",
    "icon": "🔍",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Contract Email Received",
        "tool": "Email",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "email"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Screen for Risk Clauses",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Identify risky clauses: liability caps, IP ownership, auto-renewal terms."
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "High Risk Detected?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "Risk score exceeds threshold or critical clause found"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Flag for Attorney Review",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "Alert legal channel with risk summary and contract attachment"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Log to Airtable",
        "tool": "Airtable",
        "position": {
          "x": 960,
          "y": 320
        },
        "config": {
          "message": "Log contract with risk score and clause summary for tracking"
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "High Risk"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5",
        "label": "Low Risk"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-legal-144"
  },
  {
    "name": "Blog Post to Social",
    "description": "Auto-publish new blog posts as social media snippets across platforms.",
    "category": "Content",
    "icon": "✍️",
    "nodes": [
      {
        "id": "t1",
        "type": "trigger",
        "label": "New Blog Post",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "a1",
        "type": "ai",
        "label": "Generate Snippets",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Create Twitter, LinkedIn, and Facebook posts from blog content."
        }
      },
      {
        "id": "ac1",
        "type": "action",
        "label": "Post to Twitter",
        "tool": "Twitter",
        "position": {
          "x": 740,
          "y": 120
        },
        "config": {
          "message": "{{twitter_post}}"
        }
      },
      {
        "id": "ac2",
        "type": "action",
        "label": "Post to LinkedIn",
        "tool": "LinkedIn",
        "position": {
          "x": 740,
          "y": 280
        },
        "config": {
          "message": "{{linkedin_post}}"
        }
      },
      {
        "id": "e1",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1-2",
        "source": "t1",
        "target": "a1"
      },
      {
        "id": "e2-3",
        "source": "a1",
        "target": "ac1",
        "label": "Twitter"
      },
      {
        "id": "e2-4",
        "source": "a1",
        "target": "ac2",
        "label": "LinkedIn"
      },
      {
        "id": "e3-5",
        "source": "ac1",
        "target": "e1"
      },
      {
        "id": "e4-5",
        "source": "ac2",
        "target": "e1"
      }
    ],
    "id": "wf-content-145"
  },
  {
    "name": "YouTube Summary Newsletter",
    "description": "Turn new YouTube videos into email newsletter summaries automatically.",
    "category": "Content",
    "icon": "📧",
    "nodes": [
      {
        "id": "t1",
        "type": "trigger",
        "label": "New YouTube Video",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "a1",
        "type": "ai",
        "label": "Summarize Video",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Summarize video transcript into 3 key takeaways for email."
        }
      },
      {
        "id": "ac1",
        "type": "action",
        "label": "Send Newsletter",
        "tool": "Gmail",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "{{video_summary}}"
        }
      },
      {
        "id": "ac2",
        "type": "action",
        "label": "Log to Notion",
        "tool": "Notion",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Archive video summary in content library."
        }
      },
      {
        "id": "e1",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1-2",
        "source": "t1",
        "target": "a1"
      },
      {
        "id": "e2-3",
        "source": "a1",
        "target": "ac1"
      },
      {
        "id": "e3-4",
        "source": "ac1",
        "target": "ac2"
      },
      {
        "id": "e4-5",
        "source": "ac2",
        "target": "e1"
      }
    ],
    "id": "wf-content-146"
  },
  {
    "name": "Content Calendar Planner",
    "description": "Generate a weekly content calendar and save it to your project tool.",
    "category": "Content",
    "icon": "📅",
    "nodes": [
      {
        "id": "t1",
        "type": "trigger",
        "label": "Every Monday 8AM",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 8 * * 1"
        }
      },
      {
        "id": "a1",
        "type": "ai",
        "label": "Plan Weekly Content",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Generate 7-day content plan with topics, formats, and channels."
        }
      },
      {
        "id": "ac1",
        "type": "action",
        "label": "Save to Notion",
        "tool": "Notion",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Create new content calendar page for this week."
        }
      },
      {
        "id": "ac2",
        "type": "action",
        "label": "Notify Team on Slack",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Weekly content calendar is ready. Check Notion for details."
        }
      },
      {
        "id": "e1",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1-2",
        "source": "t1",
        "target": "a1"
      },
      {
        "id": "e2-3",
        "source": "a1",
        "target": "ac1"
      },
      {
        "id": "e3-4",
        "source": "ac1",
        "target": "ac2"
      },
      {
        "id": "e4-5",
        "source": "ac2",
        "target": "e1"
      }
    ],
    "id": "wf-content-147"
  },
  {
    "name": "Repurpose Podcast Episode",
    "description": "Convert podcast transcripts into blog posts, quotes, and social clips.",
    "category": "Content",
    "icon": "🎙️",
    "nodes": [
      {
        "id": "t1",
        "type": "trigger",
        "label": "New Transcript Upload",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "a1",
        "type": "ai",
        "label": "Repurpose Content",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Create blog post, 5 quote cards, and 3 social posts from transcript."
        }
      },
      {
        "id": "ac1",
        "type": "action",
        "label": "Publish Blog Draft",
        "tool": "Notion",
        "position": {
          "x": 740,
          "y": 120
        },
        "config": {
          "message": "Save blog post draft to content workspace."
        }
      },
      {
        "id": "ac2",
        "type": "action",
        "label": "Schedule Social Posts",
        "tool": "Twitter",
        "position": {
          "x": 740,
          "y": 280
        },
        "config": {
          "message": "{{social_posts}}"
        }
      },
      {
        "id": "e1",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1-2",
        "source": "t1",
        "target": "a1"
      },
      {
        "id": "e2-3",
        "source": "a1",
        "target": "ac1",
        "label": "Blog"
      },
      {
        "id": "e2-4",
        "source": "a1",
        "target": "ac2",
        "label": "Social"
      },
      {
        "id": "e3-5",
        "source": "ac1",
        "target": "e1"
      },
      {
        "id": "e4-5",
        "source": "ac2",
        "target": "e1"
      }
    ],
    "id": "wf-content-148"
  },
  {
    "name": "SEO Article Brief Generator",
    "description": "Generate detailed SEO article briefs from keyword input automatically.",
    "category": "Content",
    "icon": "🔍",
    "nodes": [
      {
        "id": "t1",
        "type": "trigger",
        "label": "Keyword Form Submit",
        "tool": "Form",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "form"
        }
      },
      {
        "id": "a1",
        "type": "ai",
        "label": "Build SEO Brief",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Write SEO brief: title, outline, meta, word count, internal links."
        }
      },
      {
        "id": "ac1",
        "type": "action",
        "label": "Save to Sheets",
        "tool": "Google Sheets",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Append SEO brief to content pipeline tracker sheet."
        }
      },
      {
        "id": "ac2",
        "type": "action",
        "label": "Assign in Notion",
        "tool": "Notion",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Create task with brief attached and assign to writer."
        }
      },
      {
        "id": "e1",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1-2",
        "source": "t1",
        "target": "a1"
      },
      {
        "id": "e2-3",
        "source": "a1",
        "target": "ac1"
      },
      {
        "id": "e3-4",
        "source": "ac1",
        "target": "ac2"
      },
      {
        "id": "e4-5",
        "source": "ac2",
        "target": "e1"
      }
    ],
    "id": "wf-content-149"
  },
  {
    "name": "Product Description Writer",
    "description": "Auto-generate compelling product descriptions from raw spec sheets.",
    "category": "Content",
    "icon": "🛍️",
    "nodes": [
      {
        "id": "t1",
        "type": "trigger",
        "label": "New Product Added",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "a1",
        "type": "ai",
        "label": "Write Description",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Write persuasive product description with benefits and CTA."
        }
      },
      {
        "id": "c1",
        "type": "condition",
        "label": "Description Approved?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "Word count > 100 and no placeholder text"
        }
      },
      {
        "id": "ac1",
        "type": "action",
        "label": "Update via HTTP",
        "tool": "HTTP",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "POST description to store product API endpoint."
        }
      },
      {
        "id": "ac2",
        "type": "action",
        "label": "Flag for Review",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 320
        },
        "config": {
          "message": "Product description needs manual review before publishing."
        }
      },
      {
        "id": "e1",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1-2",
        "source": "t1",
        "target": "a1"
      },
      {
        "id": "e2-3",
        "source": "a1",
        "target": "c1"
      },
      {
        "id": "e3-4",
        "source": "c1",
        "target": "ac1",
        "label": "Yes"
      },
      {
        "id": "e3-5",
        "source": "c1",
        "target": "ac2",
        "label": "No"
      },
      {
        "id": "e4-6",
        "source": "ac1",
        "target": "e1"
      },
      {
        "id": "e5-6",
        "source": "ac2",
        "target": "e1"
      }
    ],
    "id": "wf-content-150"
  },
  {
    "name": "Newsletter Digest Builder",
    "description": "Curate top content from RSS feeds into a weekly digest email.",
    "category": "Content",
    "icon": "📰",
    "nodes": [
      {
        "id": "t1",
        "type": "trigger",
        "label": "Every Friday 9AM",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 9 * * 5"
        }
      },
      {
        "id": "ac1",
        "type": "action",
        "label": "Fetch RSS Articles",
        "tool": "HTTP",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "GET latest 20 articles from configured RSS feed URLs."
        }
      },
      {
        "id": "a1",
        "type": "ai",
        "label": "Curate & Summarize",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Pick top 5 articles, write 2-sentence summaries for each."
        }
      },
      {
        "id": "ac2",
        "type": "action",
        "label": "Send Digest Email",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "{{weekly_digest}}"
        }
      },
      {
        "id": "e1",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1-2",
        "source": "t1",
        "target": "ac1"
      },
      {
        "id": "e2-3",
        "source": "ac1",
        "target": "a1"
      },
      {
        "id": "e3-4",
        "source": "a1",
        "target": "ac2"
      },
      {
        "id": "e4-5",
        "source": "ac2",
        "target": "e1"
      }
    ],
    "id": "wf-content-151"
  },
  {
    "name": "Content Performance Reporter",
    "description": "Pull weekly content metrics and send an AI-written performance summary.",
    "category": "Content",
    "icon": "📊",
    "nodes": [
      {
        "id": "t1",
        "type": "trigger",
        "label": "Every Monday 7AM",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 7 * * 1"
        }
      },
      {
        "id": "ac1",
        "type": "action",
        "label": "Pull Analytics Data",
        "tool": "Google Sheets",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Read last 7 days of content metrics from analytics sheet."
        }
      },
      {
        "id": "a1",
        "type": "ai",
        "label": "Write Report",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Summarize top/worst content, trends, and 3 recommendations."
        }
      },
      {
        "id": "ac2",
        "type": "action",
        "label": "Send Slack Report",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "{{performance_report}}"
        }
      },
      {
        "id": "e1",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1-2",
        "source": "t1",
        "target": "ac1"
      },
      {
        "id": "e2-3",
        "source": "ac1",
        "target": "a1"
      },
      {
        "id": "e3-4",
        "source": "a1",
        "target": "ac2"
      },
      {
        "id": "e4-5",
        "source": "ac2",
        "target": "e1"
      }
    ],
    "id": "wf-content-152"
  },
  {
    "name": "Blog Post SEO Optimizer",
    "description": "Analyzes draft blog posts and suggests SEO improvements automatically.",
    "category": "Content",
    "icon": "🔍",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "New Draft Submitted",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "SEO Analysis",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Analyze blog post for SEO: keywords, meta, readability, headings."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Save SEO Report",
        "tool": "Notion",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Store SEO recommendations in content database."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Notify Writer",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Send SEO feedback to writer via Slack."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-content-153"
  },
  {
    "name": "Podcast to Newsletter",
    "description": "Converts podcast transcripts into formatted email newsletters automatically.",
    "category": "Content",
    "icon": "🎙️",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Transcript Uploaded",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Summarize Episode",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Turn podcast transcript into an engaging newsletter with key takeaways."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Draft Newsletter",
        "tool": "Gmail",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Save newsletter draft for review before sending."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Log in Sheets",
        "tool": "Google Sheets",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Log episode title, date, and newsletter status."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-content-154"
  },
  {
    "name": "Content Calendar Planner",
    "description": "Generates a weekly content calendar based on trends and brand topics.",
    "category": "Content",
    "icon": "📅",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Weekly Schedule",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 8 * * 1"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Generate Content Ideas",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Create 7-day content calendar with topics, formats, and channels."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Populate Calendar",
        "tool": "Notion",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Add content plan to Notion editorial calendar database."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Team Notification",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Post this week's content plan to the #content-team channel."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-content-155"
  },
  {
    "name": "YouTube Description Writer",
    "description": "Auto-generates SEO-optimized YouTube descriptions from video titles.",
    "category": "Content",
    "icon": "▶️",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Video Title Submitted",
        "tool": "Form",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "instructions": "Form collects video title, tags, and target audience."
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Write Description",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Write YouTube description with hooks, timestamps, and CTAs."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Save to Sheets",
        "tool": "Google Sheets",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Log video title and generated description to content sheet."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Send to Editor",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Email description draft to video editor for review."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-content-156"
  },
  {
    "name": "Competitor Content Monitor",
    "description": "Tracks competitor blogs and summarizes new posts for your team weekly.",
    "category": "Content",
    "icon": "👀",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Weekly Check",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 9 * * 2"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Competitor Posts",
        "tool": "HTTP",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Pull RSS feeds from tracked competitor blog URLs."
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Summarize & Analyze",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Summarize competitor posts and identify content gaps and trends."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Post to Slack",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Share competitor content digest in #content-strategy channel."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-content-157"
  },
  {
    "name": "Product Review Repurposer",
    "description": "Turns customer reviews into social media posts and testimonial content.",
    "category": "Content",
    "icon": "⭐",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "New Review Received",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "n2",
        "type": "condition",
        "label": "4+ Star Rating?",
        "tool": "Logic",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "condition": "Review rating is 4 stars or above."
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Create Social Posts",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 120
        },
        "config": {
          "instructions": "Rewrite review as Twitter, LinkedIn, and Instagram testimonial posts."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Save to Airtable",
        "tool": "Airtable",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "Store repurposed testimonials in social content library."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3",
        "label": "Yes"
      },
      {
        "id": "e3",
        "source": "n2",
        "target": "n5",
        "label": "No"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-content-158"
  },
  {
    "name": "Content Performance Reporter",
    "description": "Generates weekly content performance reports from analytics data.",
    "category": "Content",
    "icon": "📊",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Friday Report Run",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 16 * * 5"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Pull Analytics Data",
        "tool": "Google Sheets",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Fetch weekly metrics: views, clicks, shares from analytics sheet."
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Analyze Performance",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Summarize top content, trends, and recommendations for next week."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Email Report",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Send weekly content performance report to marketing team."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-content-159"
  },
  {
    "name": "Article to Thread Writer",
    "description": "Converts long-form articles into engaging Twitter/X thread drafts.",
    "category": "Content",
    "icon": "🧵",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Article URL Submitted",
        "tool": "Form",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "instructions": "Form accepts article URL and target audience description."
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Article Content",
        "tool": "HTTP",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Scrape article text from submitted URL via HTTP request."
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Write Thread",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Convert article into 8-12 tweet thread with hook and strong CTA."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Save Draft Thread",
        "tool": "Airtable",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Save thread draft to social media content queue in Airtable."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Notify via Slack",
        "tool": "Slack",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {
          "message": "Alert social media manager that new thread draft is ready."
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1400,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      },
      {
        "id": "e5",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-content-160"
  },
  {
    "name": "Viral Post Repurposer",
    "description": "Detects top-performing posts and repurposes them across all social channels.",
    "category": "Social Media",
    "icon": "🔄",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Daily Performance Check",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 9 * * *"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Top Posts",
        "tool": "HTTP",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "GET top posts with engagement > 500 from analytics API"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Rewrite for Each Platform",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Rewrite post for Twitter, LinkedIn, and Instagram formats."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Post to LinkedIn",
        "tool": "LinkedIn",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "Publish repurposed professional version of post."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Post to Twitter",
        "tool": "Twitter",
        "position": {
          "x": 960,
          "y": 320
        },
        "config": {
          "message": "Publish concise tweet version of the viral post."
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "LinkedIn"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5",
        "label": "Twitter"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-socialmedia-161"
  },
  {
    "name": "Social Mention Responder",
    "description": "Monitors brand mentions and auto-drafts personalized replies for review.",
    "category": "Social Media",
    "icon": "💬",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Brand Mention Webhook",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "POST"
        }
      },
      {
        "id": "n2",
        "type": "condition",
        "label": "Sentiment Check",
        "tool": "Logic",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "condition": "Is mention sentiment negative or positive?"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Draft Positive Reply",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 120
        },
        "config": {
          "instructions": "Write a warm, engaging thank-you reply to this mention."
        }
      },
      {
        "id": "n4",
        "type": "ai",
        "label": "Draft Recovery Reply",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 320
        },
        "config": {
          "instructions": "Write an empathetic, solution-focused reply to complaint."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Send for Approval",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Post drafted reply to #social-approvals for team review."
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3",
        "label": "Positive"
      },
      {
        "id": "e3",
        "source": "n2",
        "target": "n4",
        "label": "Negative"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n5"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-socialmedia-162"
  },
  {
    "name": "Weekly Content Calendar",
    "description": "Generates a full week of social content ideas and logs them to a sheet.",
    "category": "Social Media",
    "icon": "📅",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Every Monday 8AM",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 8 * * 1"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Generate Weekly Ideas",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Create 7 unique social post ideas with hooks and CTAs."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Log to Content Sheet",
        "tool": "Google Sheets",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Append each post idea with date, platform, and status columns."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Notify Content Team",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Send weekly content plan summary to #content-team channel."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-socialmedia-163"
  },
  {
    "name": "New Blog to Social Posts",
    "description": "Converts new blog articles into platform-specific social media posts automatically.",
    "category": "Social Media",
    "icon": "✍️",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "New Blog Published",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "POST"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Extract Key Insights",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Summarize blog into 3 key takeaways for social posts."
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Write Social Captions",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Write LinkedIn post, tweet thread, and Instagram caption."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Save Drafts to Notion",
        "tool": "Notion",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Create draft page with all platform captions for review."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Alert Social Manager",
        "tool": "Slack",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {
          "message": "Ping social manager that new drafts are ready in Notion."
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1400,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      },
      {
        "id": "e5",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-socialmedia-164"
  },
  {
    "name": "Competitor Post Tracker",
    "description": "Tracks competitor social activity and sends a weekly digest to your team.",
    "category": "Social Media",
    "icon": "🕵️",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Every Friday 4PM",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 16 * * 5"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Scrape Competitor Posts",
        "tool": "HTTP",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Fetch top posts from 5 competitor profiles via social API."
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Analyze Trends & Gaps",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Identify content trends, top topics, and gaps in our strategy."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Log to Airtable",
        "tool": "Airtable",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Store competitor post data with engagement metrics and notes."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Email Weekly Digest",
        "tool": "Gmail",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {
          "message": "Send competitor insights digest to marketing team email list."
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1400,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      },
      {
        "id": "e5",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-socialmedia-165"
  },
  {
    "name": "Product Launch Blitz",
    "description": "Coordinates a multi-platform post sequence when a new product is launched.",
    "category": "Social Media",
    "icon": "🚀",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Launch Form Submitted",
        "tool": "Form",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "instructions": "Capture product name, description, link, and launch date."
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Write Launch Copy",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Write hype-driven launch posts for LinkedIn, Twitter, Instagram."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Post on LinkedIn",
        "tool": "LinkedIn",
        "position": {
          "x": 740,
          "y": 120
        },
        "config": {
          "message": "Publish professional product announcement post on LinkedIn."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Tweet the Launch",
        "tool": "Twitter",
        "position": {
          "x": 740,
          "y": 320
        },
        "config": {
          "message": "Post launch tweet with product link and relevant hashtags."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Notify Sales Team",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Alert #sales that launch posts are live for follow-up outreach."
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3",
        "label": "LinkedIn"
      },
      {
        "id": "e3",
        "source": "n2",
        "target": "n4",
        "label": "Twitter"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n5"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-socialmedia-166"
  },
  {
    "name": "Lead from Social DM",
    "description": "Captures leads from social DM inquiries and adds them to your CRM instantly.",
    "category": "Social Media",
    "icon": "📩",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "New DM Received",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "POST"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Qualify the Inquiry",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Determine if DM is a sales inquiry, support, or spam."
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "Is Sales Lead?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "AI classified as sales inquiry"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Add Lead to HubSpot",
        "tool": "HubSpot",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "Create new contact from DM data with source as Social DM."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Alert Sales Rep",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 320
        },
        "config": {
          "message": "Notify #sales-leads channel with DM context and sender info."
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "Yes"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5",
        "label": "No"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-socialmedia-167"
  },
  {
    "name": "Employee Advocacy Poster",
    "description": "Sends employees ready-to-share social posts to amplify company content.",
    "category": "Social Media",
    "icon": "📣",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "New Company Post Live",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "POST"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Create Personal Versions",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Rewrite post in first-person voice for employee sharing."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Log Versions to Sheet",
        "tool": "Google Sheets",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Store 3 personal caption variants with share links and tips."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Email Advocacy Pack",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Send staff an email with ready-to-post captions and share link."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-socialmedia-168"
  },
  {
    "name": "Viral Post Repurposer",
    "description": "Detects top-performing posts and repurposes them across all channels.",
    "category": "Social Media",
    "icon": "🔄",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Daily Analytics Check",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 9 * * *"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Top Posts",
        "tool": "HTTP",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "GET top posts with >500 engagements from last 7 days"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Rewrite for Each Platform",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Adapt post for Twitter, LinkedIn, and Instagram tones."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Post to LinkedIn",
        "tool": "LinkedIn",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "Publish repurposed LinkedIn version"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Post to Twitter",
        "tool": "Twitter",
        "position": {
          "x": 960,
          "y": 320
        },
        "config": {
          "message": "Publish repurposed Twitter thread version"
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "LinkedIn"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5",
        "label": "Twitter"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-socialmedia-169"
  },
  {
    "name": "Competitor Mention Monitor",
    "description": "Tracks competitor mentions online and alerts your team with AI insights.",
    "category": "Social Media",
    "icon": "🕵️",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Hourly Web Monitor",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 * * * *"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Scrape Mentions",
        "tool": "HTTP",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Fetch new brand/competitor mentions from social APIs"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Analyze Sentiment & Threat",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Identify sentiment, key themes, and competitive threats."
        }
      },
      {
        "id": "n4",
        "type": "condition",
        "label": "High Threat?",
        "tool": "Logic",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "condition": "Threat level is high or sentiment is negative"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Alert Team on Slack",
        "tool": "Slack",
        "position": {
          "x": 1180,
          "y": 120
        },
        "config": {
          "message": "Send urgent competitor alert with summary to #marketing"
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 320
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5",
        "label": "Yes"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6",
        "label": "No"
      }
    ],
    "id": "wf-socialmedia-170"
  },
  {
    "name": "UGC Comment Collector",
    "description": "Collects user-generated content from comments and saves the best to Notion.",
    "category": "Social Media",
    "icon": "📸",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "New Post Comment",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "POST"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Score UGC Quality",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Rate comment as UGC potential: high, medium, or low."
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "High Quality UGC?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "UGC score is high"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Save to Notion UGC Bank",
        "tool": "Notion",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "Add comment, author, post URL to UGC content database"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 960,
          "y": 320
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "Yes"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5",
        "label": "No"
      }
    ],
    "id": "wf-socialmedia-171"
  },
  {
    "name": "Influencer Outreach Automator",
    "description": "Finds relevant influencers and sends personalized collaboration pitches via email.",
    "category": "Social Media",
    "icon": "🤝",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Weekly Outreach Run",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 8 * * 1"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Pull Influencer List",
        "tool": "Airtable",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Fetch influencers with status: not yet contacted"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Write Personalized Pitch",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Write a short, friendly collab pitch using influencer's niche."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Send Pitch Email",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Send personalized outreach email to influencer"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Update Airtable Status",
        "tool": "Airtable",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {
          "message": "Mark influencer status as contacted with timestamp"
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1400,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      },
      {
        "id": "e5",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-socialmedia-172"
  },
  {
    "name": "Social Proof Aggregator",
    "description": "Collects 5-star reviews and reposts them as social proof on Twitter and LinkedIn.",
    "category": "Social Media",
    "icon": "⭐",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "New Review Submitted",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "POST"
        }
      },
      {
        "id": "n2",
        "type": "condition",
        "label": "5-Star Review?",
        "tool": "Logic",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "condition": "Review rating equals 5 stars"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Format as Social Post",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 120
        },
        "config": {
          "instructions": "Turn review into engaging social proof post with emojis."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Post to Twitter",
        "tool": "Twitter",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "Tweet formatted review as social proof"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 960,
          "y": 320
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3",
        "label": "Yes"
      },
      {
        "id": "e3",
        "source": "n2",
        "target": "n5",
        "label": "No"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-socialmedia-173"
  },
  {
    "name": "Content Calendar Filler",
    "description": "Auto-generates a week of social content ideas and populates your content calendar.",
    "category": "Social Media",
    "icon": "📅",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Every Friday Morning",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 7 * * 5"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Brand Guidelines",
        "tool": "Notion",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Load tone, topics, and content pillars from Notion"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Generate Week of Content",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Create 7 post ideas with captions, hashtags, and formats."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Add to Google Sheets",
        "tool": "Google Sheets",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Populate content calendar sheet with next week's posts"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Notify Team on Slack",
        "tool": "Slack",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {
          "message": "Post content calendar link to #social-media channel"
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1400,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      },
      {
        "id": "e5",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-socialmedia-174"
  },
  {
    "name": "DM Lead Qualifier",
    "description": "Reads incoming social DMs, qualifies leads with AI, and routes hot leads to CRM.",
    "category": "Social Media",
    "icon": "💬",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "New DM Received",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "POST"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Qualify Lead Intent",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Classify DM as hot lead, cold lead, or not a lead."
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "Hot Lead?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "Lead classification is hot"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Add to HubSpot CRM",
        "tool": "HubSpot",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "Create contact and deal in HubSpot with DM context"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Alert Sales on Slack",
        "tool": "Slack",
        "position": {
          "x": 1180,
          "y": 120
        },
        "config": {
          "message": "Notify #sales with lead name, DM summary, and profile link"
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 960,
          "y": 320
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "Yes"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n6",
        "label": "No"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n5"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-socialmedia-175"
  },
  {
    "name": "Trending Topic Post Generator",
    "description": "Monitors trending topics and drafts relevant brand posts for quick team approval.",
    "category": "Social Media",
    "icon": "🔥",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Every 3 Hours",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 */3 * * *"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Trending Topics",
        "tool": "HTTP",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "GET current Twitter/Google trends for target industry"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Draft Relevant Post",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Write brand-safe post tying trend to our product value."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Send Draft for Approval",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Post draft to #content-approvals with approve/reject buttons"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Log in Notion",
        "tool": "Notion",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {
          "message": "Save trend, draft, and timestamp to content log database"
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1400,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      },
      {
        "id": "e5",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-socialmedia-176"
  },
  {
    "name": "Weekly KPI Report Digest",
    "description": "Pulls weekly KPIs from Sheets and emails a summary to stakeholders.",
    "category": "Analytics",
    "icon": "📊",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Every Monday 8AM",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 8 * * 1"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch KPI Data",
        "tool": "Google Sheets",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Read weekly KPI rows from dashboard sheet"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Summarize KPIs",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Summarize KPIs into 5 bullet points with trends."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Email Stakeholders",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Send KPI digest email to leadership team"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-analytics-177"
  },
  {
    "name": "Traffic Spike Alert System",
    "description": "Monitors site traffic and Slacks the team when unusual spikes are detected.",
    "category": "Analytics",
    "icon": "📈",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Hourly Check",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 * * * *"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Pull Traffic Data",
        "tool": "HTTP",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "GET request to analytics API for hourly sessions"
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "Traffic > 200% Avg?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "current_sessions > 2x rolling_average"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Alert Slack Channel",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "Post traffic spike alert with session count"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "Yes"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5",
        "label": "No"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-analytics-178"
  },
  {
    "name": "Monthly Revenue Dashboard Update",
    "description": "Aggregates monthly revenue data and updates a Notion dashboard automatically.",
    "category": "Analytics",
    "icon": "💰",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "1st of Month",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 6 1 * *"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Stripe Revenue",
        "tool": "Stripe",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Retrieve last month total revenue and MRR"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Analyze Revenue Trends",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Identify MoM revenue trends and write brief insight."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Update Notion Page",
        "tool": "Notion",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Write revenue stats and AI insight to Notion dashboard"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-analytics-179"
  },
  {
    "name": "Churn Risk Score Tracker",
    "description": "Scores customers for churn risk weekly and flags high-risk accounts in HubSpot.",
    "category": "Analytics",
    "icon": "⚠️",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Every Friday 9AM",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 9 * * 5"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Get Customer Usage",
        "tool": "Google Sheets",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Fetch last 30-day login and feature usage per account"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Score Churn Risk",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Score each account 1-10 churn risk based on usage data."
        }
      },
      {
        "id": "n4",
        "type": "condition",
        "label": "Score >= 7?",
        "tool": "Logic",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "condition": "churn_score >= 7"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Flag in HubSpot",
        "tool": "HubSpot",
        "position": {
          "x": 1180,
          "y": 120
        },
        "config": {
          "message": "Tag contact as At-Risk and assign to CSM"
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1400,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5",
        "label": "High Risk"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6",
        "label": "Low Risk"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-analytics-180"
  },
  {
    "name": "Ad Campaign Performance Recap",
    "description": "Pulls ad spend and ROAS daily, then posts a Slack summary for the marketing team.",
    "category": "Analytics",
    "icon": "📣",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Daily 7AM",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 7 * * *"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Campaign Data",
        "tool": "HTTP",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "GET ad campaign metrics from marketing API"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Generate Daily Recap",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Write short ad performance recap with ROAS and top ad."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Post to Slack",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Post daily ad recap to #marketing-analytics channel"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-analytics-181"
  },
  {
    "name": "NPS Survey Response Analyzer",
    "description": "Analyzes incoming NPS responses and logs sentiment scores to Airtable.",
    "category": "Analytics",
    "icon": "🎯",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "NPS Form Submitted",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Analyze Sentiment",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Extract sentiment, key themes, and score from NPS text."
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "Score < 7 (Detractor)?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "nps_score < 7"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Alert CS Team",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "Notify CS team of detractor response for follow-up"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Log to Airtable",
        "tool": "Airtable",
        "position": {
          "x": 960,
          "y": 320
        },
        "config": {
          "message": "Add NPS score, sentiment, and themes to tracker table"
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "Detractor"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5",
        "label": "Promoter/Passive"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-analytics-182"
  },
  {
    "name": "Sales Funnel Conversion Report",
    "description": "Builds a weekly conversion funnel report from HubSpot data and logs to Sheets.",
    "category": "Analytics",
    "icon": "🔻",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Every Sunday 10PM",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 22 * * 0"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Funnel Stages",
        "tool": "HubSpot",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Pull deal counts per pipeline stage for the week"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Calculate Conversions",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Compute stage-to-stage conversion rates and bottlenecks."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Update Sheets Report",
        "tool": "Google Sheets",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Append weekly funnel conversion rates to tracking sheet"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-analytics-183"
  },
  {
    "name": "Product Usage Insight Newsletter",
    "description": "Generates a bi-weekly product usage insight email for the product team.",
    "category": "Analytics",
    "icon": "🔬",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Bi-Weekly Schedule",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 9 1,15 * *"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Pull Feature Usage",
        "tool": "HTTP",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Fetch feature click and engagement stats from product API"
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Get Support Tickets",
        "tool": "Airtable",
        "position": {
          "x": 520,
          "y": 340
        },
        "config": {
          "message": "Fetch top support ticket categories from past 2 weeks"
        }
      },
      {
        "id": "n4",
        "type": "ai",
        "label": "Generate Insight Email",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Combine usage and support data into product insight email."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Send to Product Team",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Email product insight newsletter to product@company.com"
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n1",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n2",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n5"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-analytics-184"
  },
  {
    "name": "Weekly KPI Digest",
    "description": "Compile weekly KPIs from Google Sheets and email a formatted digest to leadership.",
    "category": "Analytics",
    "icon": "📊",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Every Monday 8AM",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 8 * * 1"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch KPI Sheet",
        "tool": "Google Sheets",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Read last 7 days of KPI data from tracker sheet"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Format KPI Summary",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Summarize KPIs into bullet points, highlight anomalies."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Email Leadership",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Send weekly KPI digest to leadership team"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-analytics-185"
  },
  {
    "name": "Churn Risk Alert",
    "description": "Detect customers with declining usage and alert the success team via Slack.",
    "category": "Analytics",
    "icon": "⚠️",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Daily Schedule",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 9 * * *"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Pull Usage Data",
        "tool": "Google Sheets",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Fetch last 30 days of customer usage metrics"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Identify At-Risk Users",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Flag customers with >30% usage drop. Return names and stats."
        }
      },
      {
        "id": "n4",
        "type": "condition",
        "label": "At-Risk Found?",
        "tool": "Logic",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "condition": "At-risk customer list is not empty"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Slack Alert",
        "tool": "Slack",
        "position": {
          "x": 1180,
          "y": 120
        },
        "config": {
          "message": "Post churn risk list to #customer-success channel"
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1400,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5",
        "label": "Yes"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6",
        "label": "No"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-analytics-186"
  },
  {
    "name": "Ad Spend Performance Report",
    "description": "Pull ad metrics via HTTP, score performance with AI, and log to Notion weekly.",
    "category": "Analytics",
    "icon": "💰",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Every Friday 5PM",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 17 * * 5"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Ad Metrics",
        "tool": "HTTP",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "GET ad performance data from marketing API"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Score Campaigns",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Rate each campaign A-F. Note ROAS, CPC, and recommendations."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Log to Notion",
        "tool": "Notion",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Create ad performance report page in Notion database"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-analytics-187"
  },
  {
    "name": "NPS Score Tracker",
    "description": "Receive NPS survey webhooks, categorize responses, and update Airtable dashboard.",
    "category": "Analytics",
    "icon": "⭐",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "NPS Survey Webhook",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "POST"
        }
      },
      {
        "id": "n2",
        "type": "condition",
        "label": "Classify Score",
        "tool": "Logic",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "condition": "Score >= 9 = Promoter, 7-8 = Passive, <7 = Detractor"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Analyze Feedback",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Extract sentiment themes from open-ended NPS comment."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Update Airtable",
        "tool": "Airtable",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Log score, category, and themes to NPS tracker base"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-analytics-188"
  },
  {
    "name": "Revenue Anomaly Detector",
    "description": "Detect unusual revenue spikes or drops and notify the finance team immediately.",
    "category": "Analytics",
    "icon": "📉",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Every 6 Hours",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 */6 * * *"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Pull Stripe Revenue",
        "tool": "Stripe",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Fetch last 6 hours of transaction totals from Stripe"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Detect Anomalies",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Compare to 30-day average. Flag if deviation exceeds 25%."
        }
      },
      {
        "id": "n4",
        "type": "condition",
        "label": "Anomaly Detected?",
        "tool": "Logic",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "condition": "Revenue deviation flag is true"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Alert Finance Slack",
        "tool": "Slack",
        "position": {
          "x": 1180,
          "y": 120
        },
        "config": {
          "message": "Post anomaly details and comparison to #finance channel"
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1400,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5",
        "label": "Yes"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6",
        "label": "No"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-analytics-189"
  },
  {
    "name": "Competitor Mention Monitor",
    "description": "Track competitor mentions via API, summarize trends, and log insights to Notion.",
    "category": "Analytics",
    "icon": "🔍",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Daily 7AM",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 7 * * *"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Mentions",
        "tool": "HTTP",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "GET last 24h competitor mentions from monitoring API"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Summarize Trends",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Identify sentiment, key topics, and notable competitor moves."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Save to Notion",
        "tool": "Notion",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Append daily competitor intel to Notion research database"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-analytics-190"
  },
  {
    "name": "Sales Funnel Drop-Off Report",
    "description": "Analyze CRM funnel data weekly and surface top drop-off stages to sales leads.",
    "category": "Analytics",
    "icon": "🔻",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Every Monday 9AM",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 9 * * 1"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Pull HubSpot Funnel",
        "tool": "HubSpot",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Fetch weekly deal stage conversion rates from HubSpot"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Identify Drop-Off",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Find biggest funnel drop-offs and suggest root causes."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Post to Slack",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Share funnel drop-off report in #sales-analytics channel"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-analytics-191"
  },
  {
    "name": "Product Usage Heatmap Digest",
    "description": "Summarize feature usage stats daily and share top insights with the product team.",
    "category": "Analytics",
    "icon": "🗺️",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Daily 8AM",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 8 * * *"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Usage Data",
        "tool": "HTTP",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "GET feature click and session data from product analytics API"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Rank Features",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Rank top 5 and bottom 5 features by engagement. Note trends."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Update Sheets",
        "tool": "Google Sheets",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Append daily feature rankings to product analytics sheet"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Notify Product Team",
        "tool": "Slack",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {
          "message": "Post daily feature usage highlights to #product channel"
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1400,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      },
      {
        "id": "e5",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-analytics-192"
  },
  {
    "name": "Resume Screening Automation",
    "description": "Auto-screen resumes and score candidates based on job requirements.",
    "category": "Recruitment",
    "icon": "📄",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Resume Received",
        "tool": "Email",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "email",
          "instructions": "Trigger on new email with resume attachment"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Score Resume",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Score resume 1-10 against job requirements, list strengths/gaps."
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "Score >= 7?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "Resume score is 7 or higher"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Add to Shortlist",
        "tool": "Airtable",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "Add candidate to shortlist table with score and notes"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Send Rejection",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 320
        },
        "config": {
          "message": "Send polite rejection email to candidate"
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "Yes"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5",
        "label": "No"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-recruitment-193"
  },
  {
    "name": "Interview Scheduling Bot",
    "description": "Automatically schedule interviews and send calendar invites to candidates.",
    "category": "Recruitment",
    "icon": "📅",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Candidate Shortlisted",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Draft Invite Email",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Write a friendly interview invite email with scheduling link."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Send Interview Email",
        "tool": "Gmail",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Send interview invite with Calendly link to candidate"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Notify Recruiter",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Alert recruiter that interview invite was sent to candidate"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-recruitment-194"
  },
  {
    "name": "Job Post Generator",
    "description": "Generate compelling job descriptions from a simple role brief in seconds.",
    "category": "Recruitment",
    "icon": "✍️",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Role Brief Submitted",
        "tool": "Form",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "form"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Generate Job Post",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Write an engaging job post with requirements and benefits."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Save to Notion",
        "tool": "Notion",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Save generated job post to Notion jobs database for review"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Post to LinkedIn",
        "tool": "LinkedIn",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Publish approved job post to LinkedIn company page"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-recruitment-195"
  },
  {
    "name": "Candidate Pipeline Tracker",
    "description": "Track candidate stage changes and notify hiring managers automatically.",
    "category": "Recruitment",
    "icon": "🔄",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Stage Updated",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "n2",
        "type": "condition",
        "label": "Offer Stage?",
        "tool": "Logic",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "condition": "Pipeline stage equals Offer"
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Alert Hiring Manager",
        "tool": "Slack",
        "position": {
          "x": 740,
          "y": 120
        },
        "config": {
          "message": "Notify hiring manager candidate reached offer stage"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Update Sheet",
        "tool": "Google Sheets",
        "position": {
          "x": 740,
          "y": 320
        },
        "config": {
          "message": "Log candidate stage change with timestamp in tracker sheet"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3",
        "label": "Yes"
      },
      {
        "id": "e3",
        "source": "n2",
        "target": "n4",
        "label": "No"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-recruitment-196"
  },
  {
    "name": "Onboarding Welcome Flow",
    "description": "Send personalized onboarding emails and set up new hire resources on day one.",
    "category": "Recruitment",
    "icon": "🎉",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Offer Accepted",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Write Welcome Email",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Write a warm personalized welcome email for the new hire."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Send Welcome Email",
        "tool": "Gmail",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Send welcome email with start date and first-day instructions"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Create Notion Page",
        "tool": "Notion",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Create onboarding checklist page for new hire in Notion"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Add to HubSpot",
        "tool": "HubSpot",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {
          "message": "Add new employee contact record to HubSpot CRM"
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1400,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      },
      {
        "id": "e5",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-recruitment-197"
  },
  {
    "name": "Interview Feedback Collector",
    "description": "Collect and summarize structured interview feedback from hiring panels.",
    "category": "Recruitment",
    "icon": "🗒️",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Interview Completed",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 18 * * 1-5"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Send Feedback Form",
        "tool": "Gmail",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Email feedback form link to all interviewers for today"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Summarize Feedback",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Summarize panel feedback into hire/no-hire recommendation."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Post Summary to Slack",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Post feedback summary to hiring-decisions Slack channel"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-recruitment-198"
  },
  {
    "name": "Referral Bonus Trigger",
    "description": "Detect successful referral hires and trigger bonus payouts automatically.",
    "category": "Recruitment",
    "icon": "💰",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "New Hire Confirmed",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "n2",
        "type": "condition",
        "label": "Referred Candidate?",
        "tool": "Logic",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "condition": "Candidate source equals employee referral"
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Trigger Bonus Payment",
        "tool": "Stripe",
        "position": {
          "x": 740,
          "y": 120
        },
        "config": {
          "message": "Process referral bonus payment to referring employee"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Notify Referrer",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "DM referrer congratulating them and confirming bonus payout"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Log in Sheets",
        "tool": "Google Sheets",
        "position": {
          "x": 740,
          "y": 320
        },
        "config": {
          "message": "Log hire with no referral source in tracking spreadsheet"
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3",
        "label": "Yes"
      },
      {
        "id": "e3",
        "source": "n2",
        "target": "n5",
        "label": "No"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-recruitment-199"
  },
  {
    "name": "Weekly Hiring Report",
    "description": "Auto-generate and send weekly recruitment metrics to leadership every Monday.",
    "category": "Recruitment",
    "icon": "📊",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Every Monday 9am",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 9 * * 1"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Pipeline Data",
        "tool": "Airtable",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Retrieve all candidate records updated in the past 7 days"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Generate Report",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Summarize hiring metrics: applications, interviews, offers."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Email Report",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Email weekly hiring summary report to leadership team"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-recruitment-200"
  },
  {
    "name": "Resume Screening Automation",
    "description": "Auto-screen resumes and score candidates against job requirements.",
    "category": "Recruitment",
    "icon": "📄",
    "nodes": [
      {
        "id": "t1",
        "type": "trigger",
        "label": "Resume Received",
        "tool": "Email",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "email",
          "instructions": "Trigger on emails with resume attachments"
        }
      },
      {
        "id": "a1",
        "type": "ai",
        "label": "Score Resume",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Score resume 1-10 against job requirements. List strengths."
        }
      },
      {
        "id": "c1",
        "type": "condition",
        "label": "Score Above 7?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "Resume score >= 7"
        }
      },
      {
        "id": "ac1",
        "type": "action",
        "label": "Add to Shortlist",
        "tool": "Airtable",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "Add candidate to shortlist with score and notes"
        }
      },
      {
        "id": "ac2",
        "type": "action",
        "label": "Send Rejection",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 320
        },
        "config": {
          "message": "Send polite rejection email to candidate"
        }
      },
      {
        "id": "e1",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "t1",
        "target": "a1"
      },
      {
        "id": "e2",
        "source": "a1",
        "target": "c1"
      },
      {
        "id": "e3",
        "source": "c1",
        "target": "ac1",
        "label": "Yes"
      },
      {
        "id": "e4",
        "source": "c1",
        "target": "ac2",
        "label": "No"
      },
      {
        "id": "e5",
        "source": "ac1",
        "target": "e1"
      },
      {
        "id": "e6",
        "source": "ac2",
        "target": "e1"
      }
    ],
    "id": "wf-recruitment-201"
  },
  {
    "name": "Interview Scheduling Assistant",
    "description": "Automatically schedule interviews and send calendar invites to candidates.",
    "category": "Recruitment",
    "icon": "📅",
    "nodes": [
      {
        "id": "t1",
        "type": "trigger",
        "label": "Candidate Shortlisted",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "a1",
        "type": "ai",
        "label": "Draft Interview Email",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Write a friendly interview invite email with scheduling link."
        }
      },
      {
        "id": "ac1",
        "type": "action",
        "label": "Send Invite Email",
        "tool": "Gmail",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Send interview scheduling email to candidate"
        }
      },
      {
        "id": "ac2",
        "type": "action",
        "label": "Update ATS",
        "tool": "Airtable",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Update candidate status to Interview Scheduled"
        }
      },
      {
        "id": "e1",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "t1",
        "target": "a1"
      },
      {
        "id": "e2",
        "source": "a1",
        "target": "ac1"
      },
      {
        "id": "e3",
        "source": "ac1",
        "target": "ac2"
      },
      {
        "id": "e4",
        "source": "ac2",
        "target": "e1"
      }
    ],
    "id": "wf-recruitment-202"
  },
  {
    "name": "Candidate Reference Checker",
    "description": "Send reference check requests and compile feedback automatically.",
    "category": "Recruitment",
    "icon": "🔍",
    "nodes": [
      {
        "id": "t1",
        "type": "trigger",
        "label": "Offer Stage Reached",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "a1",
        "type": "ai",
        "label": "Generate Reference Form",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Create reference check questions tailored to the role."
        }
      },
      {
        "id": "ac1",
        "type": "action",
        "label": "Email References",
        "tool": "Gmail",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Send reference check form to provided contacts"
        }
      },
      {
        "id": "ac2",
        "type": "action",
        "label": "Log in Notion",
        "tool": "Notion",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Create reference tracking page for candidate"
        }
      },
      {
        "id": "e1",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "t1",
        "target": "a1"
      },
      {
        "id": "e2",
        "source": "a1",
        "target": "ac1"
      },
      {
        "id": "e3",
        "source": "ac1",
        "target": "ac2"
      },
      {
        "id": "e4",
        "source": "ac2",
        "target": "e1"
      }
    ],
    "id": "wf-recruitment-203"
  },
  {
    "name": "Job Post Distributor",
    "description": "Publish new job openings to LinkedIn and Twitter simultaneously.",
    "category": "Recruitment",
    "icon": "📢",
    "nodes": [
      {
        "id": "t1",
        "type": "trigger",
        "label": "New Job Opening",
        "tool": "Form",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "form"
        }
      },
      {
        "id": "a1",
        "type": "ai",
        "label": "Write Job Posts",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Write LinkedIn and Twitter posts for the job opening."
        }
      },
      {
        "id": "ac1",
        "type": "action",
        "label": "Post to LinkedIn",
        "tool": "LinkedIn",
        "position": {
          "x": 740,
          "y": 120
        },
        "config": {
          "message": "Publish detailed job post to LinkedIn company page"
        }
      },
      {
        "id": "ac2",
        "type": "action",
        "label": "Post to Twitter",
        "tool": "Twitter",
        "position": {
          "x": 740,
          "y": 320
        },
        "config": {
          "message": "Tweet job opening with relevant hashtags"
        }
      },
      {
        "id": "e1",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "t1",
        "target": "a1"
      },
      {
        "id": "e2",
        "source": "a1",
        "target": "ac1"
      },
      {
        "id": "e3",
        "source": "a1",
        "target": "ac2"
      },
      {
        "id": "e4",
        "source": "ac1",
        "target": "e1"
      },
      {
        "id": "e5",
        "source": "ac2",
        "target": "e1"
      }
    ],
    "id": "wf-recruitment-204"
  },
  {
    "name": "Offer Letter Generator",
    "description": "Auto-generate personalized offer letters and send for e-signature.",
    "category": "Recruitment",
    "icon": "✍️",
    "nodes": [
      {
        "id": "t1",
        "type": "trigger",
        "label": "Candidate Approved",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "a1",
        "type": "ai",
        "label": "Draft Offer Letter",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Generate a professional offer letter with role and salary."
        }
      },
      {
        "id": "ac1",
        "type": "action",
        "label": "Send via Email",
        "tool": "Gmail",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Email offer letter to candidate for review and signature"
        }
      },
      {
        "id": "ac2",
        "type": "action",
        "label": "Notify HR on Slack",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Alert HR that offer letter was sent to candidate"
        }
      },
      {
        "id": "e1",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "t1",
        "target": "a1"
      },
      {
        "id": "e2",
        "source": "a1",
        "target": "ac1"
      },
      {
        "id": "e3",
        "source": "ac1",
        "target": "ac2"
      },
      {
        "id": "e4",
        "source": "ac2",
        "target": "e1"
      }
    ],
    "id": "wf-recruitment-205"
  },
  {
    "name": "Candidate Pipeline Reporter",
    "description": "Send weekly recruitment pipeline summaries to hiring managers.",
    "category": "Recruitment",
    "icon": "📊",
    "nodes": [
      {
        "id": "t1",
        "type": "trigger",
        "label": "Weekly Schedule",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 8 * * MON"
        }
      },
      {
        "id": "ac1",
        "type": "action",
        "label": "Fetch Pipeline Data",
        "tool": "Airtable",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Retrieve all candidate records and current statuses"
        }
      },
      {
        "id": "a1",
        "type": "ai",
        "label": "Generate Report",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Summarize pipeline stats, bottlenecks, and top candidates."
        }
      },
      {
        "id": "ac2",
        "type": "action",
        "label": "Email Hiring Managers",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Send weekly pipeline report to all hiring managers"
        }
      },
      {
        "id": "e1",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "t1",
        "target": "ac1"
      },
      {
        "id": "e2",
        "source": "ac1",
        "target": "a1"
      },
      {
        "id": "e3",
        "source": "a1",
        "target": "ac2"
      },
      {
        "id": "e4",
        "source": "ac2",
        "target": "e1"
      }
    ],
    "id": "wf-recruitment-206"
  },
  {
    "name": "New Hire Onboarding Kickoff",
    "description": "Trigger onboarding tasks and send welcome messages when hire is confirmed.",
    "category": "Recruitment",
    "icon": "🎉",
    "nodes": [
      {
        "id": "t1",
        "type": "trigger",
        "label": "Offer Accepted",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "ac1",
        "type": "action",
        "label": "Create Notion Page",
        "tool": "Notion",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Create onboarding checklist page for new hire"
        }
      },
      {
        "id": "ac2",
        "type": "action",
        "label": "Welcome Slack Message",
        "tool": "Slack",
        "position": {
          "x": 740,
          "y": 120
        },
        "config": {
          "message": "Post welcome message in #general channel for new hire"
        }
      },
      {
        "id": "ac3",
        "type": "action",
        "label": "Add to HubSpot",
        "tool": "HubSpot",
        "position": {
          "x": 740,
          "y": 320
        },
        "config": {
          "message": "Add new hire as contact in HubSpot and assign onboarding"
        }
      },
      {
        "id": "e1",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "t1",
        "target": "ac1"
      },
      {
        "id": "e2",
        "source": "ac1",
        "target": "ac2"
      },
      {
        "id": "e3",
        "source": "ac1",
        "target": "ac3"
      },
      {
        "id": "e4",
        "source": "ac2",
        "target": "e1"
      },
      {
        "id": "e5",
        "source": "ac3",
        "target": "e1"
      }
    ],
    "id": "wf-recruitment-207"
  },
  {
    "name": "Interview Feedback Collector",
    "description": "Collect post-interview feedback from interviewers and consolidate scores.",
    "category": "Recruitment",
    "icon": "💬",
    "nodes": [
      {
        "id": "t1",
        "type": "trigger",
        "label": "Interview Completed",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 17 * * *"
        }
      },
      {
        "id": "ac1",
        "type": "action",
        "label": "Send Feedback Form",
        "tool": "Gmail",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Email structured feedback form to all interviewers"
        }
      },
      {
        "id": "ac2",
        "type": "action",
        "label": "Collect in Sheets",
        "tool": "Google Sheets",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Log feedback responses into candidate evaluation sheet"
        }
      },
      {
        "id": "a1",
        "type": "ai",
        "label": "Summarize Feedback",
        "tool": "Claude AI",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "instructions": "Summarize interviewer feedback and give hiring recommendation."
        }
      },
      {
        "id": "ac3",
        "type": "action",
        "label": "Notify Hiring Manager",
        "tool": "Slack",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {
          "message": "Send feedback summary to hiring manager on Slack"
        }
      },
      {
        "id": "e1",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1400,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "t1",
        "target": "ac1"
      },
      {
        "id": "e2",
        "source": "ac1",
        "target": "ac2"
      },
      {
        "id": "e3",
        "source": "ac2",
        "target": "a1"
      },
      {
        "id": "e4",
        "source": "a1",
        "target": "ac3"
      },
      {
        "id": "e5",
        "source": "ac3",
        "target": "e1"
      }
    ],
    "id": "wf-recruitment-208"
  },
  {
    "name": "Task Overdue Alert",
    "description": "Detects overdue tasks and notifies the responsible team member via Slack.",
    "category": "Project Management",
    "icon": "⏰",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Daily Schedule",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 9 * * *"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Overdue Tasks",
        "tool": "Airtable",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Query tasks where due_date < today and status != done"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Summarize Overdue Tasks",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Summarize overdue tasks into a concise Slack-ready message."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Notify Team on Slack",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Send overdue task summary to #project-alerts channel"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-projectmanagement-209"
  },
  {
    "name": "New Task Auto-Assign",
    "description": "Automatically assigns new tasks to team members based on workload balance.",
    "category": "Project Management",
    "icon": "🎯",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Task Created Webhook",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "POST"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Get Team Workloads",
        "tool": "Airtable",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Fetch current open task count per team member"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Pick Best Assignee",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Choose team member with lowest workload matching task skills."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Assign Task",
        "tool": "Airtable",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Update task record with selected assignee"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Notify Assignee",
        "tool": "Slack",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {
          "message": "DM assignee with task details and due date"
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1400,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      },
      {
        "id": "e5",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-projectmanagement-210"
  },
  {
    "name": "Weekly Status Report",
    "description": "Compiles project updates every Friday and emails a summary to stakeholders.",
    "category": "Project Management",
    "icon": "📊",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Friday Schedule",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 16 * * 5"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Pull Project Data",
        "tool": "Google Sheets",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Fetch task completions, blockers, and milestones this week"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Draft Status Report",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Write a professional weekly status report for stakeholders."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Email Stakeholders",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Send formatted status report to stakeholder email list"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-projectmanagement-211"
  },
  {
    "name": "Client Feedback to Tasks",
    "description": "Converts client feedback emails into actionable tasks in your project tracker.",
    "category": "Project Management",
    "icon": "📥",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Feedback Email Received",
        "tool": "Email",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "inbound"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Extract Action Items",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Extract clear action items and priorities from client feedback."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Create Tasks in Notion",
        "tool": "Notion",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Add each action item as a task in the project database"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Post to Slack",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Notify #project-team of new client tasks added"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-projectmanagement-212"
  },
  {
    "name": "Milestone Completion Trigger",
    "description": "When a milestone is marked complete, notifies client and logs it automatically.",
    "category": "Project Management",
    "icon": "🏁",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Milestone Completed",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "POST"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Write Client Update",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Write a professional client-facing milestone completion email."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Email Client",
        "tool": "Gmail",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Send milestone completion notice to client contact"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Log to Google Sheets",
        "tool": "Google Sheets",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Append milestone name, date, and project to tracker sheet"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-projectmanagement-213"
  },
  {
    "name": "Blocker Escalation Flow",
    "description": "Detects blocked tasks and escalates to the project manager with context.",
    "category": "Project Management",
    "icon": "🚧",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Task Marked Blocked",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "POST"
        }
      },
      {
        "id": "n2",
        "type": "condition",
        "label": "High Priority Task?",
        "tool": "Logic",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "condition": "task.priority == 'high' or task.priority == 'critical'"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Summarize Blocker",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 120
        },
        "config": {
          "instructions": "Summarize the blocker and suggest possible resolution steps."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Alert Project Manager",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "DM project manager with blocker summary and task link"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Log Blocker Only",
        "tool": "Notion",
        "position": {
          "x": 740,
          "y": 320
        },
        "config": {
          "message": "Add blocker note to task page without escalation"
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3",
        "label": "Yes"
      },
      {
        "id": "e3",
        "source": "n2",
        "target": "n5",
        "label": "No"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-projectmanagement-214"
  },
  {
    "name": "Sprint Planning Assistant",
    "description": "Analyzes backlog and drafts a sprint plan with priorities and estimates.",
    "category": "Project Management",
    "icon": "🏃",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Sprint Start Form",
        "tool": "Form",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "form_submission"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Backlog Items",
        "tool": "Notion",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Pull all backlog tasks with priority, estimate, and tags"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Generate Sprint Plan",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Create a balanced sprint plan based on velocity and priorities."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Save Plan to Notion",
        "tool": "Notion",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Create new sprint page with tasks, owners, and goals"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Share with Team",
        "tool": "Slack",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {
          "message": "Post sprint plan link to #dev-team with summary"
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1400,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      },
      {
        "id": "e5",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-projectmanagement-215"
  },
  {
    "name": "Project Kickoff Automation",
    "description": "Sets up tasks, channels, and docs automatically when a new project starts.",
    "category": "Project Management",
    "icon": "🚀",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "New Project Form",
        "tool": "Form",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "form_submission"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Generate Task List",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Create a standard task checklist based on project type and scope."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Create Notion Workspace",
        "tool": "Notion",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Create project page with tasks, timeline, and team roster"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Create Slack Channel",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Create project Slack channel and invite team members"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Email Project Brief",
        "tool": "Gmail",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {
          "message": "Send kickoff brief with Notion link and Slack channel to team"
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1400,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      },
      {
        "id": "e5",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-projectmanagement-216"
  },
  {
    "name": "Sprint Planning Assistant",
    "description": "Auto-generates sprint tasks from backlog items using AI prioritization.",
    "category": "Project Management",
    "icon": "🏃",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "New Sprint Started",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 9 * * 1",
          "type": "weekly"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Backlog Items",
        "tool": "Notion",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Query backlog database for unassigned items"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Prioritize & Assign Tasks",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Prioritize backlog items by impact and effort, assign to sprint."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Create Sprint Board",
        "tool": "Notion",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Create sprint board with prioritized tasks and assignments"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Notify Team in Slack",
        "tool": "Slack",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {
          "message": "Post sprint goals and task assignments to #sprint channel"
        }
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-projectmanagement-217"
  },
  {
    "name": "Overdue Task Escalation",
    "description": "Detects overdue tasks and escalates to managers with an AI summary.",
    "category": "Project Management",
    "icon": "⚠️",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Daily Task Check",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 8 * * *",
          "type": "daily"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Overdue Tasks",
        "tool": "Airtable",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Filter tasks where due date is past and status is incomplete"
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "Any Overdue?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "overdue task count > 0"
        }
      },
      {
        "id": "n4",
        "type": "ai",
        "label": "Generate Escalation Summary",
        "tool": "Claude AI",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "instructions": "Summarize overdue tasks by owner and urgency for manager."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Email Manager",
        "tool": "Gmail",
        "position": {
          "x": 1180,
          "y": 120
        },
        "config": {
          "message": "Send escalation email with overdue task summary to manager"
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "No Action Needed",
        "tool": "End",
        "position": {
          "x": 960,
          "y": 320
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "Yes"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n6",
        "label": "No"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-projectmanagement-218"
  },
  {
    "name": "Client Project Status Report",
    "description": "Compiles weekly project data and emails a polished status report to clients.",
    "category": "Project Management",
    "icon": "📊",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Weekly Report Trigger",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 9 * * 5",
          "type": "weekly"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Pull Project Metrics",
        "tool": "Google Sheets",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Fetch task completion, blockers, and milestones from sheet"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Write Status Report",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Write a professional client-ready project status report."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Email Client Report",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Send formatted status report email to client contacts"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Log to Notion",
        "tool": "Notion",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {
          "message": "Archive weekly report in client project page on Notion"
        }
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-projectmanagement-219"
  },
  {
    "name": "New Project Kickoff Setup",
    "description": "Auto-creates project workspace, tasks, and team channels when a project is added.",
    "category": "Project Management",
    "icon": "🚀",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "New Project Form",
        "tool": "Form",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "form_submission"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Generate Project Plan",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Create milestone list and task breakdown from project brief."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Create Notion Workspace",
        "tool": "Notion",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Create project page with milestones, tasks, and docs folder"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Create Slack Channel",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Create #project-name channel and invite team members"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Notify Stakeholders",
        "tool": "Gmail",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {
          "message": "Send kickoff email with workspace link and project timeline"
        }
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-projectmanagement-220"
  },
  {
    "name": "Bug Report Triage Bot",
    "description": "Triages incoming bug reports, assigns severity, and routes to the right dev.",
    "category": "Project Management",
    "icon": "🐛",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Bug Report Submitted",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Classify Bug Severity",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Classify bug as critical/high/low and suggest responsible team."
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "Is Critical?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "severity == critical"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Alert On-Call Dev",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "Page on-call developer with critical bug details immediately"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Add to Bug Tracker",
        "tool": "Airtable",
        "position": {
          "x": 960,
          "y": 320
        },
        "config": {
          "message": "Log bug with severity, description, and assigned team to tracker"
        }
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "Critical"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5",
        "label": "Non-Critical"
      }
    ],
    "id": "wf-projectmanagement-221"
  },
  {
    "name": "Meeting Notes to Action Items",
    "description": "Converts raw meeting notes into tracked action items assigned to team members.",
    "category": "Project Management",
    "icon": "📝",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Notes Submitted",
        "tool": "Form",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "form_submission"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Extract Action Items",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Extract action items with owner, deadline from meeting notes."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Create Tasks in Notion",
        "tool": "Notion",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Create individual task entries with owner and due date fields"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Notify Assignees",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "DM each assignee with their action item and deadline"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Log to Sheets Tracker",
        "tool": "Google Sheets",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {
          "message": "Append action items to master project tracker spreadsheet"
        }
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-projectmanagement-222"
  },
  {
    "name": "Resource Allocation Monitor",
    "description": "Flags over-allocated team members and suggests rebalancing across projects.",
    "category": "Project Management",
    "icon": "⚖️",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Monday Check-In",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 7 * * 1",
          "type": "weekly"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Team Workloads",
        "tool": "Airtable",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Query task assignments and estimated hours per team member"
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "Anyone Over 40hrs?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "any team member allocated > 40 hours this week"
        }
      },
      {
        "id": "n4",
        "type": "ai",
        "label": "Suggest Rebalancing",
        "tool": "Claude AI",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "instructions": "Recommend task reassignments to balance team workload fairly."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Alert Project Manager",
        "tool": "Slack",
        "position": {
          "x": 1180,
          "y": 120
        },
        "config": {
          "message": "Send workload alert with rebalancing suggestions to PM"
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Workload Balanced",
        "tool": "End",
        "position": {
          "x": 960,
          "y": 320
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "Over-allocated"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n6",
        "label": "All good"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-projectmanagement-223"
  },
  {
    "name": "Project Milestone Tracker",
    "description": "Sends automated reminders and updates stakeholders as project milestones approach.",
    "category": "Project Management",
    "icon": "🎯",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Daily Milestone Scan",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 8 * * *",
          "type": "daily"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Check Upcoming Milestones",
        "tool": "Google Sheets",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Find milestones due within 7 days from project tracker sheet"
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "Milestone Due Soon?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "milestone due date within 7 days"
        }
      },
      {
        "id": "n4",
        "type": "ai",
        "label": "Draft Milestone Update",
        "tool": "Claude AI",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "instructions": "Write milestone reminder with current status and next steps."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Notify Team & Client",
        "tool": "Gmail",
        "position": {
          "x": 1180,
          "y": 120
        },
        "config": {
          "message": "Email milestone reminder to project team and client contacts"
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "No Upcoming Milestones",
        "tool": "End",
        "position": {
          "x": 960,
          "y": 320
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "Due Soon"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n6",
        "label": "None"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-projectmanagement-224"
  },
  {
    "name": "Churn Risk Early Warning",
    "description": "Detect at-risk customers by usage drops and trigger save campaigns automatically.",
    "category": "Customer Success",
    "icon": "🚨",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Daily Usage Check",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 8 * * *"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Usage Metrics",
        "tool": "HTTP",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "GET /api/usage?days=7"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Score Churn Risk",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Rate churn risk 1-10 based on usage drop, login frequency, support tickets."
        }
      },
      {
        "id": "n4",
        "type": "condition",
        "label": "High Risk?",
        "tool": "Logic",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "condition": "churn_risk_score >= 7"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Alert CSM in Slack",
        "tool": "Slack",
        "position": {
          "x": 1180,
          "y": 120
        },
        "config": {
          "message": "🚨 High churn risk detected for {{customer}}. Score: {{score}}"
        }
      },
      {
        "id": "n6",
        "type": "action",
        "label": "Update HubSpot Risk",
        "tool": "HubSpot",
        "position": {
          "x": 1180,
          "y": 320
        },
        "config": {
          "message": "Set churn_risk_score and flag for nurture sequence."
        }
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5",
        "label": "High Risk"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6",
        "label": "Monitor"
      }
    ],
    "id": "wf-customersuccess-225"
  },
  {
    "name": "NPS Response Automation",
    "description": "Auto-route NPS responses to the right team and trigger follow-up actions instantly.",
    "category": "Customer Success",
    "icon": "⭐",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "NPS Survey Submitted",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "POST"
        }
      },
      {
        "id": "n2",
        "type": "condition",
        "label": "Score Category",
        "tool": "Logic",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "condition": "score <= 6 = detractor, 7-8 = passive, 9-10 = promoter"
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Escalate to CSM",
        "tool": "Slack",
        "position": {
          "x": 740,
          "y": 120
        },
        "config": {
          "message": "🔴 Detractor alert: {{customer}} scored {{score}}. Comment: {{comment}}"
        }
      },
      {
        "id": "n4",
        "type": "ai",
        "label": "Draft Thank You Email",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 320
        },
        "config": {
          "instructions": "Write a warm thank-you email for a promoter. Invite them to leave a review."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Send Promoter Email",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 320
        },
        "config": {
          "message": "Send drafted thank-you and review request to promoter."
        }
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3",
        "label": "Detractor"
      },
      {
        "id": "e3",
        "source": "n2",
        "target": "n4",
        "label": "Promoter"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-customersuccess-226"
  },
  {
    "name": "Onboarding Milestone Tracker",
    "description": "Track customer onboarding steps and send timely nudges when milestones are missed.",
    "category": "Customer Success",
    "icon": "🗺️",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Daily Onboarding Check",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 9 * * 1-5"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Pull Onboarding Status",
        "tool": "Airtable",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Fetch customers with incomplete onboarding steps past due date."
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Personalize Nudge",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Write a friendly nudge email referencing the specific missed milestone."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Send Nudge Email",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Send personalized onboarding nudge to customer."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Log in Google Sheets",
        "tool": "Google Sheets",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {
          "message": "Log nudge sent date and milestone status to tracker sheet."
        }
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-customersuccess-227"
  },
  {
    "name": "Support Ticket Sentiment Triage",
    "description": "Analyze incoming support tickets for urgency and sentiment, route to right agent.",
    "category": "Customer Success",
    "icon": "🎯",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "New Support Ticket",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "POST"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Analyze Sentiment & Urgency",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Classify ticket: sentiment (positive/negative), urgency (low/med/high), category."
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "Urgent or Angry?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "urgency = high OR sentiment = very_negative"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Page Senior Agent",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "🔴 Urgent ticket from {{customer}}: {{summary}}. Assign immediately."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Auto-Route Standard Queue",
        "tool": "HTTP",
        "position": {
          "x": 960,
          "y": 320
        },
        "config": {
          "message": "POST /tickets/assign with category and priority tags."
        }
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "Urgent"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5",
        "label": "Standard"
      }
    ],
    "id": "wf-customersuccess-228"
  },
  {
    "name": "Renewal Reminder Sequence",
    "description": "Send personalized renewal reminders at 90, 30, and 7 days before contract expiry.",
    "category": "Customer Success",
    "icon": "🔄",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Daily Renewal Scan",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 7 * * *"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Query Expiring Contracts",
        "tool": "HubSpot",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Fetch deals expiring in 90, 30, or 7 days."
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Draft Renewal Email",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Write renewal email citing usage stats and value delivered this year."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Send Renewal Email",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Send personalized renewal email to account owner."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Create Follow-up Task",
        "tool": "HubSpot",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {
          "message": "Create CSM task to follow up 3 days after email sent."
        }
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-customersuccess-229"
  },
  {
    "name": "QBR Prep Auto-Brief",
    "description": "Auto-generate quarterly business review briefs from CRM and usage data before meetings.",
    "category": "Customer Success",
    "icon": "📊",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "QBR Scheduled",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "POST"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Account Data",
        "tool": "HubSpot",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Pull deals, tickets, contacts, and activity for account."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Get Usage Analytics",
        "tool": "HTTP",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "GET /api/analytics/account/{{id}}?period=quarter"
        }
      },
      {
        "id": "n4",
        "type": "ai",
        "label": "Generate QBR Brief",
        "tool": "Claude AI",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "instructions": "Create QBR brief: wins, risks, usage trends, upsell opportunities, next goals."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Save to Notion",
        "tool": "Notion",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {
          "message": "Create QBR page in customer workspace with generated brief."
        }
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-customersuccess-230"
  },
  {
    "name": "Product Adoption Nudge Bot",
    "description": "Identify underused features per customer and send targeted adoption tips automatically.",
    "category": "Customer Success",
    "icon": "💡",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Weekly Feature Scan",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 10 * * 1"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Pull Feature Usage Data",
        "tool": "HTTP",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "GET /api/features/usage?segment=paid&unused_days=14"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Identify Adoption Gaps",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Find top 2 unused features relevant to customer's plan and use case."
        }
      },
      {
        "id": "n4",
        "type": "ai",
        "label": "Write Tip Email",
        "tool": "Claude AI",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "instructions": "Write a short, friendly tip email showing value of each unused feature."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Send Adoption Email",
        "tool": "Gmail",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {
          "message": "Send feature tip email to customer contact."
        }
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-customersuccess-231"
  },
  {
    "name": "New Customer Welcome Flow",
    "description": "Trigger a personalized welcome sequence the moment a new customer signs up.",
    "category": "Customer Success",
    "icon": "🎉",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "New Customer Created",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "POST"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Personalize Welcome",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Write warm welcome email using company name, plan, and use case."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Send Welcome Email",
        "tool": "Gmail",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Send personalized welcome email to new customer."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Add to HubSpot Sequence",
        "tool": "HubSpot",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Enroll contact in onboarding email sequence based on plan tier."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Notify CSM in Slack",
        "tool": "Slack",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {
          "message": "🎉 New customer: {{company}} ({{plan}}). Reach out within 24h."
        }
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-customersuccess-232"
  },
  {
    "name": "Churn Risk Early Warning",
    "description": "Detect at-risk customers by usage drops and alert success team immediately.",
    "category": "Customer Success",
    "icon": "🚨",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Daily Usage Check",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 8 * * *"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Usage Metrics",
        "tool": "HTTP",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "GET /api/usage?days=7&threshold=50"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Score Churn Risk",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Score churn risk 1-10 based on usage drop, login freq, support tickets."
        }
      },
      {
        "id": "n4",
        "type": "condition",
        "label": "Risk Score > 7?",
        "tool": "Logic",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "condition": "churn_risk_score > 7"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Alert CSM in Slack",
        "tool": "Slack",
        "position": {
          "x": 1180,
          "y": 120
        },
        "config": {
          "message": "🚨 High churn risk: {{customer_name}} — score {{risk_score}}. Act now."
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "End",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 320
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5",
        "label": "High Risk"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6",
        "label": "Low Risk"
      }
    ],
    "id": "wf-customersuccess-233"
  },
  {
    "name": "QBR Prep Auto-Generator",
    "description": "Automatically compile account data and generate QBR talking points before meetings.",
    "category": "Customer Success",
    "icon": "📊",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Meeting Scheduled",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "POST"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Pull Account Data",
        "tool": "HubSpot",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Fetch account metrics, deal history, and open tickets."
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Generate QBR Brief",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Create a QBR brief with wins, risks, and upsell opportunities."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Save to Notion",
        "tool": "Notion",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Create QBR page in Accounts database with generated brief."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Email CSM Brief",
        "tool": "Gmail",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {
          "message": "Send QBR prep doc to CSM 24 hours before the meeting."
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "End",
        "tool": "End",
        "position": {
          "x": 1400,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      },
      {
        "id": "e5",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-customersuccess-234"
  },
  {
    "name": "Support Ticket Escalation",
    "description": "Auto-escalate critical support tickets to senior CSM with full context summary.",
    "category": "Customer Success",
    "icon": "🎫",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "New Ticket Received",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "POST"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Analyze Severity",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Classify ticket severity: critical, high, medium, low. Extract key issue."
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "Critical or High?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "severity == 'critical' OR severity == 'high'"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Escalate via Slack",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "🔴 Escalation: {{customer}} — {{issue_summary}} — Ticket #{{id}}"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Update HubSpot",
        "tool": "HubSpot",
        "position": {
          "x": 960,
          "y": 320
        },
        "config": {
          "message": "Log ticket and set follow-up task for assigned CSM."
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "End",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "Critical/High"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5",
        "label": "Medium/Low"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-customersuccess-235"
  },
  {
    "name": "NPS Response Follow-Up",
    "description": "Route NPS responses to right team and auto-draft personalized follow-up emails.",
    "category": "Customer Success",
    "icon": "⭐",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "NPS Form Submitted",
        "tool": "Form",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "NPS survey submission"
        }
      },
      {
        "id": "n2",
        "type": "condition",
        "label": "Score < 7 (Detractor)?",
        "tool": "Logic",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "condition": "nps_score < 7"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Draft Recovery Email",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 120
        },
        "config": {
          "instructions": "Write empathetic recovery email acknowledging feedback and offering help."
        }
      },
      {
        "id": "n4",
        "type": "ai",
        "label": "Draft Referral Ask",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 320
        },
        "config": {
          "instructions": "Write thank-you email and ask promoter for a referral or review."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Send Email",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Send drafted response email to customer from CSM email address."
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "End",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3",
        "label": "Detractor"
      },
      {
        "id": "e3",
        "source": "n2",
        "target": "n4",
        "label": "Promoter"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n5"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-customersuccess-236"
  },
  {
    "name": "Renewal Reminder Sequence",
    "description": "Send timed renewal reminders at 90, 60, and 30 days before contract expiry.",
    "category": "Customer Success",
    "icon": "🔄",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Daily Renewal Scan",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 9 * * *"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Find Expiring Deals",
        "tool": "HubSpot",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Query contracts expiring in 90, 60, or 30 days."
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Personalize Outreach",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Write renewal email personalized by account tier and days remaining."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Send Renewal Email",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Send renewal outreach email to account owner and economic buyer."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Log in Sheets",
        "tool": "Google Sheets",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {
          "message": "Append renewal outreach log: customer, date, stage, email sent."
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "End",
        "tool": "End",
        "position": {
          "x": 1400,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      },
      {
        "id": "e5",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-customersuccess-237"
  },
  {
    "name": "New User Onboarding Kickoff",
    "description": "Trigger personalized onboarding email sequence when a new user activates their account.",
    "category": "Customer Success",
    "icon": "🚀",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Account Activated",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "POST"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Build Onboarding Plan",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Create 5-step onboarding plan based on industry and company size."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Send Welcome Email",
        "tool": "Gmail",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Send personalized welcome email with first 3 onboarding action items."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Create Notion Doc",
        "tool": "Notion",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Create customer onboarding tracker page with milestones and owner."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Notify CSM in Slack",
        "tool": "Slack",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {
          "message": "🚀 New customer activated: {{name}} — onboarding plan ready in Notion."
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "End",
        "tool": "End",
        "position": {
          "x": 1400,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      },
      {
        "id": "e5",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-customersuccess-238"
  },
  {
    "name": "Product Adoption Nudge",
    "description": "Identify underused features and send targeted tips to boost customer adoption.",
    "category": "Customer Success",
    "icon": "💡",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Weekly Adoption Report",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 10 * * 1"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Feature Usage",
        "tool": "HTTP",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "GET /api/feature-adoption?segment=active&threshold=30pct"
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "Low Adoption (<30%)?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "feature_adoption_rate < 0.30"
        }
      },
      {
        "id": "n4",
        "type": "ai",
        "label": "Write Feature Tip",
        "tool": "Claude AI",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "instructions": "Write a helpful in-app tip highlighting underused feature's top benefit."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Send Nudge Email",
        "tool": "Gmail",
        "position": {
          "x": 1180,
          "y": 120
        },
        "config": {
          "message": "Send feature tip email to customers with low adoption of the feature."
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "End",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 320
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "Low Adoption"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n6",
        "label": "Healthy"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n5"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-customersuccess-239"
  },
  {
    "name": "Customer Health Score Dashboard",
    "description": "Aggregate signals weekly and update a live health score dashboard for all accounts.",
    "category": "Customer Success",
    "icon": "❤️",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Weekly Score Update",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 7 * * 1"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Collect Signal Data",
        "tool": "HTTP",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "GET /api/signals?include=logins,tickets,nps,usage,payments"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Compute Health Score",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Compute 0-100 health score weighting usage 40%, NPS 30%, tickets 30%."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Update Airtable",
        "tool": "Airtable",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Update Health Score field for each account in Customer Success base."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Post Weekly Summary",
        "tool": "Slack",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {
          "message": "Post weekly health score summary with top 3 at-risk accounts to #cs-team."
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "End",
        "tool": "End",
        "position": {
          "x": 1400,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      },
      {
        "id": "e5",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-customersuccess-240"
  },
  {
    "name": "Failed Login Alert System",
    "description": "Detects repeated failed logins and alerts security team immediately.",
    "category": "Security",
    "icon": "🔐",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Webhook Login Event",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "n2",
        "type": "condition",
        "label": "Failed Attempts > 5?",
        "tool": "Logic",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "condition": "failed_login_count > 5 in last 10 minutes"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Assess Threat Level",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 120
        },
        "config": {
          "instructions": "Assess threat level from login attempt metadata and IP info."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Alert Security Team",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "🚨 Brute force alert: {{ip}} triggered {{count}} failed logins."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "End",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3",
        "label": "Yes"
      },
      {
        "id": "e3",
        "source": "n2",
        "target": "n5",
        "label": "No"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-security-241"
  },
  {
    "name": "New Employee Access Provisioning",
    "description": "Automatically provisions system access for new hires on their start date.",
    "category": "Security",
    "icon": "🧑‍💼",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "New Hire Form Submitted",
        "tool": "Form",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "form"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Determine Access Level",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Map new hire role to required system permissions and access groups."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Create User in Systems",
        "tool": "HTTP",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "POST to IAM API to provision user accounts and roles."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Notify IT and Manager",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "✅ Access provisioned for {{name}}. Role: {{role}}."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "End",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-security-242"
  },
  {
    "name": "Suspicious Email Phishing Triage",
    "description": "Scans reported phishing emails and auto-quarantines confirmed threats.",
    "category": "Security",
    "icon": "📧",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Phishing Report Email",
        "tool": "Email",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "email"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Analyze Email Content",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Identify phishing indicators: spoofed domains, urgency, malicious links."
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "Confirmed Phishing?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "phishing_confidence_score >= 0.85"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Quarantine & Block Sender",
        "tool": "HTTP",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "Call email gateway API to quarantine and block sender domain."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Flag for Manual Review",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 320
        },
        "config": {
          "message": "⚠️ Potential phishing needs review: {{email_subject}}"
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "End",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "Yes"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5",
        "label": "No"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-security-243"
  },
  {
    "name": "Employee Offboarding Access Revocation",
    "description": "Instantly revokes all system access when an employee is terminated.",
    "category": "Security",
    "icon": "🚪",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Termination Form Submitted",
        "tool": "Form",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "form"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Revoke All Access",
        "tool": "HTTP",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Call IAM API to disable all accounts and revoke tokens."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Log Offboarding Event",
        "tool": "Google Sheets",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Append termination record with timestamp to audit log sheet."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Notify IT and HR",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "🔒 Access revoked for {{name}} as of {{timestamp}}."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "End",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-security-244"
  },
  {
    "name": "SSL Certificate Expiry Monitor",
    "description": "Checks SSL certs daily and alerts teams before expiration causes outages.",
    "category": "Security",
    "icon": "🔒",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Daily SSL Check",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 8 * * *"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Cert Expiry Dates",
        "tool": "HTTP",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Query SSL monitoring API for all tracked domain certificates."
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "Expiring Within 30 Days?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "days_until_expiry <= 30"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Send Expiry Alert",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "⚠️ SSL cert for {{domain}} expires in {{days}} days."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "End",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "Yes"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5",
        "label": "No"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-security-245"
  },
  {
    "name": "Privileged Access Request Approval",
    "description": "Routes admin access requests through AI triage and manager approval flow.",
    "category": "Security",
    "icon": "🛡️",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Access Request Form",
        "tool": "Form",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "form"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Risk Score Request",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Score access request risk based on role, system, and justification."
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "High Risk Request?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "risk_score > 7"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Escalate to CISO",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "High-risk access request from {{name}} requires your approval."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Auto-Approve & Provision",
        "tool": "HTTP",
        "position": {
          "x": 960,
          "y": 320
        },
        "config": {
          "message": "Grant time-limited access via IAM API with 24hr expiry."
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "End",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "Yes"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5",
        "label": "No"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-security-246"
  },
  {
    "name": "Data Breach Incident Response",
    "description": "Triggers full incident response workflow when a data breach is detected.",
    "category": "Security",
    "icon": "🚨",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Breach Alert Webhook",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Classify Breach Severity",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Classify breach severity and affected data types from incident payload."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Create Incident Record",
        "tool": "Notion",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Create incident page with severity, timeline, and affected systems."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Alert Response Team",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "🚨 DATA BREACH: Severity {{level}}. Incident room created. Join now."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Notify Legal via Email",
        "tool": "Gmail",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {
          "message": "Data breach incident report: {{severity}}, {{affected_records}} records."
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "End",
        "tool": "End",
        "position": {
          "x": 1400,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      },
      {
        "id": "e5",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-security-247"
  },
  {
    "name": "Vulnerability Scan Weekly Digest",
    "description": "Compiles weekly vulnerability scan results into prioritized Slack digest.",
    "category": "Security",
    "icon": "🔍",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Weekly Scan Schedule",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 9 * * 1"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Scan Results",
        "tool": "HTTP",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "GET latest vulnerabilities from security scanning API."
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Prioritize & Summarize",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Rank vulnerabilities by CVSS score and write executive summary."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Post Digest to Slack",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "📊 Weekly Vuln Report: {{critical}} critical, {{high}} high issues found."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Log to Airtable",
        "tool": "Airtable",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {
          "message": "Append weekly scan summary with counts and top CVEs to tracker."
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "End",
        "tool": "End",
        "position": {
          "x": 1400,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      },
      {
        "id": "e5",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-security-248"
  },
  {
    "name": "Failed Login Alert System",
    "description": "Detects multiple failed logins and notifies security team instantly.",
    "category": "Security",
    "icon": "🔐",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Login Event Webhook",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "n2",
        "type": "condition",
        "label": "Failed Attempts > 5?",
        "tool": "Logic",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "condition": "failed_login_count > 5 in last 10 minutes"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Analyze Threat Level",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 120
        },
        "config": {
          "instructions": "Assess login failure pattern and assign threat level."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Alert Security Team",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "🚨 Brute force alert: {{ip}} - Threat: {{threat_level}}"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3",
        "label": "Yes"
      },
      {
        "id": "e3",
        "source": "n2",
        "target": "n5",
        "label": "No"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-security-249"
  },
  {
    "name": "Employee Offboarding Access Revoke",
    "description": "Automatically revokes system access and logs offboarding when HR submits a form.",
    "category": "Security",
    "icon": "🚪",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "HR Offboarding Form",
        "tool": "Form",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "form"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Revoke App Access",
        "tool": "HTTP",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "POST /api/revoke-access for employee {{employee_id}}"
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Log Offboarding Event",
        "tool": "Google Sheets",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Record offboarding date and systems revoked for audit trail."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Notify IT & Manager",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Access revoked for {{employee_name}}. Review complete."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-security-250"
  },
  {
    "name": "Phishing Email Detection",
    "description": "Scans incoming emails for phishing signals and quarantines suspicious messages.",
    "category": "Security",
    "icon": "🎣",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Incoming Email",
        "tool": "Email",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "email"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Detect Phishing Signals",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Analyze email for phishing indicators and return risk score."
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "Risk Score High?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "phishing_risk_score > 0.75"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Quarantine & Alert",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "Email quarantined. Notify security team with sender details."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "High Risk"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5",
        "label": "Safe"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-security-251"
  },
  {
    "name": "SSL Certificate Expiry Monitor",
    "description": "Checks SSL certs daily and alerts team before expiration causes outages.",
    "category": "Security",
    "icon": "🔒",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Daily Schedule",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 8 * * *"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Check SSL Expiry Dates",
        "tool": "HTTP",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "GET SSL expiry for all registered domains."
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "Expiring Within 14 Days?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "days_until_expiry <= 14"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Alert DevOps Team",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "⚠️ SSL expiring in {{days}} days for {{domain}}. Renew now!"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "Yes"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5",
        "label": "No"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-security-252"
  },
  {
    "name": "Suspicious API Activity Flag",
    "description": "Monitors API usage patterns and flags abnormal request spikes automatically.",
    "category": "Security",
    "icon": "📡",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "API Gateway Event",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Analyze API Pattern",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Detect anomalous API usage patterns and flag suspicious keys."
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "Anomaly Detected?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "anomaly_score > threshold"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Throttle & Notify",
        "tool": "HTTP",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "Throttle API key and POST alert to security dashboard."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Log to Airtable",
        "tool": "Airtable",
        "position": {
          "x": 960,
          "y": 320
        },
        "config": {
          "message": "Log normal API activity for baseline tracking."
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "Yes"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5",
        "label": "No"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-security-253"
  },
  {
    "name": "Data Breach Incident Response",
    "description": "Triggers a full incident response workflow when a data breach is reported.",
    "category": "Security",
    "icon": "🛡️",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Breach Report Form",
        "tool": "Form",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "form"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Assess Breach Severity",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Classify breach severity and identify impacted data types."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Create Incident Ticket",
        "tool": "Notion",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Create incident page with severity, timeline, and action items."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Notify Legal & CISO",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "Urgent breach report: {{severity}} - Incident #{{id}}. Review now."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Alert All-Hands Channel",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 320
        },
        "config": {
          "message": "🚨 Security incident declared. Check #incidents for updates."
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-security-254"
  },
  {
    "name": "Weekly Security Audit Report",
    "description": "Compiles weekly security events into an executive summary report automatically.",
    "category": "Security",
    "icon": "📋",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Weekly Schedule",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 7 * * 1"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Security Logs",
        "tool": "Google Sheets",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Pull all security events logged in the past 7 days."
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Generate Audit Summary",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Summarize security events, risks, and recommendations for execs."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Email Report to CISO",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Weekly security digest: {{summary}}. Full log attached."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-security-255"
  },
  {
    "name": "New Admin Privilege Alert",
    "description": "Detects when a user is granted admin rights and requires manager approval.",
    "category": "Security",
    "icon": "👑",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Permissions Change Event",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "n2",
        "type": "condition",
        "label": "Admin Role Granted?",
        "tool": "Logic",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "condition": "new_role == 'admin' OR new_role == 'superuser'"
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Request Manager Approval",
        "tool": "Gmail",
        "position": {
          "x": 740,
          "y": 120
        },
        "config": {
          "message": "Approve admin access for {{user}}? Reply YES to confirm."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Log Privilege Change",
        "tool": "Airtable",
        "position": {
          "x": 740,
          "y": 320
        },
        "config": {
          "message": "Log role change: {{user}}, role: {{role}}, date: {{timestamp}}"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Notify Security Channel",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "🔑 Admin access granted to {{user}}. Awaiting approval."
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3",
        "label": "Yes"
      },
      {
        "id": "e3",
        "source": "n2",
        "target": "n4",
        "label": "No"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-security-256"
  },
  {
    "name": "CSV to CRM Sync",
    "description": "Parse uploaded CSV files and sync new contacts directly into HubSpot CRM.",
    "category": "Data",
    "icon": "📊",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "CSV Upload Webhook",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Parse & Validate CSV",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Parse CSV rows, validate emails, flag duplicates, return clean JSON."
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "Valid Records?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "Check if parsed records count > 0 and no critical errors"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Push to HubSpot",
        "tool": "HubSpot",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "Create or update contacts from validated CSV data."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Notify of Errors",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 320
        },
        "config": {
          "message": "Send CSV validation error report to #data-ops channel."
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Sync Complete",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "Valid"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5",
        "label": "Invalid"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-data-257"
  },
  {
    "name": "Daily Sales Report Builder",
    "description": "Pull daily sales data from Sheets, summarize with AI, and email to stakeholders.",
    "category": "Data",
    "icon": "📈",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Daily at 7 AM",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 7 * * *"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Sales Data",
        "tool": "Google Sheets",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Read yesterday's rows from Sales Tracker sheet."
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Generate Summary",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Summarize sales data: totals, top products, trends, anomalies."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Email Report",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Send formatted daily sales summary to leadership team."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Report Sent",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-data-258"
  },
  {
    "name": "Database Anomaly Detector",
    "description": "Scan metrics hourly, detect anomalies with AI, and alert the team on Slack.",
    "category": "Data",
    "icon": "🔍",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Every Hour",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 * * * *"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Metrics API",
        "tool": "HTTP",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "GET latest metrics from internal analytics API endpoint."
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Detect Anomalies",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Identify outliers, spikes, or drops vs 7-day rolling average."
        }
      },
      {
        "id": "n4",
        "type": "condition",
        "label": "Anomaly Found?",
        "tool": "Logic",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "condition": "AI response contains anomaly severity high or medium"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Alert Data Team",
        "tool": "Slack",
        "position": {
          "x": 1180,
          "y": 120
        },
        "config": {
          "message": "Post anomaly details and recommended action to #alerts."
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1400,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5",
        "label": "Yes"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6",
        "label": "No"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-data-259"
  },
  {
    "name": "Form to Airtable Logger",
    "description": "Capture form submissions, enrich data with AI, and log records to Airtable.",
    "category": "Data",
    "icon": "📋",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Form Submitted",
        "tool": "Form",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "form"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Enrich & Categorize",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Tag submission by topic, sentiment, and priority level."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Log to Airtable",
        "tool": "Airtable",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Create new record with enriched fields in Submissions base."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Notify Assignee",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "DM the relevant team member with new submission summary."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Logged",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-data-260"
  },
  {
    "name": "Competitor Price Tracker",
    "description": "Scrape competitor prices weekly, compare with yours, and log deltas to Sheets.",
    "category": "Data",
    "icon": "💹",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Every Monday 8 AM",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 8 * * 1"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Scrape Competitor Sites",
        "tool": "HTTP",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Fetch pricing pages from competitor URLs list."
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Extract & Compare Prices",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Extract prices, compare to our catalog, compute % difference."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Update Price Sheet",
        "tool": "Google Sheets",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Append weekly comparison row to Competitor Pricing sheet."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Alert if Undercut",
        "tool": "Slack",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {
          "message": "Notify #pricing if competitor is >10% cheaper on any SKU."
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Tracked",
        "tool": "End",
        "position": {
          "x": 1400,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      },
      {
        "id": "e5",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-data-261"
  },
  {
    "name": "Duplicate Contact Cleaner",
    "description": "Identify and merge duplicate CRM contacts weekly to keep data clean.",
    "category": "Data",
    "icon": "🧹",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Every Sunday Midnight",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 0 * * 0"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Export All Contacts",
        "tool": "HubSpot",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Fetch full contact list with email, name, phone fields."
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Find Duplicates",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Group records by fuzzy name+email match, flag merge candidates."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Log Duplicates to Sheet",
        "tool": "Google Sheets",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Write duplicate pairs to Duplicates Review sheet for approval."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Notify Data Steward",
        "tool": "Gmail",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {
          "message": "Email data steward with count and link to review sheet."
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Review Ready",
        "tool": "End",
        "position": {
          "x": 1400,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      },
      {
        "id": "e5",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-data-262"
  },
  {
    "name": "NPS Response Analyzer",
    "description": "Collect NPS survey responses, segment by score, and store insights in Notion.",
    "category": "Data",
    "icon": "🎯",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "NPS Webhook",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "n2",
        "type": "condition",
        "label": "Score Segment",
        "tool": "Logic",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "condition": "NPS score: Detractor <7, Passive 7-8, Promoter 9-10"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Analyze Feedback Text",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Extract themes, pain points, and praise from open-text response."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Save to Notion",
        "tool": "Notion",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Add response, score, segment, and themes to NPS database."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Stored",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-data-263"
  },
  {
    "name": "Invoice Data Extractor",
    "description": "Extract line items from emailed invoices and log them to an Airtable tracker.",
    "category": "Data",
    "icon": "🧾",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Invoice Email Received",
        "tool": "Email",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "email"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Extract Invoice Data",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Pull vendor, date, total, line items, and due date from email."
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "Amount > $1000?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "Extracted invoice total is greater than 1000"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Log to Airtable",
        "tool": "Airtable",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Create invoice record in Accounts Payable base."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Flag for Approval",
        "tool": "Slack",
        "position": {
          "x": 1180,
          "y": 120
        },
        "config": {
          "message": "Notify finance manager of high-value invoice needing approval."
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Logged",
        "tool": "End",
        "position": {
          "x": 1400,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5",
        "label": "Yes"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-data-264"
  },
  {
    "name": "Database Anomaly Detector",
    "description": "Monitors key metrics hourly and alerts team when anomalies are detected.",
    "category": "Data",
    "icon": "🔍",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Hourly Check",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 * * * *"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Metrics",
        "tool": "HTTP",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "GET metrics from data warehouse API"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Detect Anomalies",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Analyze metrics for anomalies. Flag deviations >2 std dev."
        }
      },
      {
        "id": "n4",
        "type": "condition",
        "label": "Anomaly Found?",
        "tool": "Logic",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "condition": "anomaly_detected == true"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Alert Data Team",
        "tool": "Slack",
        "position": {
          "x": 1180,
          "y": 120
        },
        "config": {
          "message": "Post anomaly report to #data-alerts channel"
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "No Action",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 320
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5",
        "label": "Yes"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6",
        "label": "No"
      }
    ],
    "id": "wf-data-265"
  },
  {
    "name": "CSV to CRM Sync",
    "description": "Transforms uploaded CSV files and syncs clean records directly into HubSpot.",
    "category": "Data",
    "icon": "📥",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "File Upload",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "POST"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Parse & Clean CSV",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Parse CSV, normalize fields, remove duplicates and blanks."
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "Valid Records?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "valid_record_count > 0"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Sync to HubSpot",
        "tool": "HubSpot",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "Upsert contacts with mapped fields from cleaned data"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Notify Uploader",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 320
        },
        "config": {
          "message": "Email error report: no valid records found in file"
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Sync Complete",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "Yes"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5",
        "label": "No"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-data-266"
  },
  {
    "name": "Weekly KPI Digest",
    "description": "Compiles weekly KPIs from Sheets and emails an AI-written summary to leadership.",
    "category": "Data",
    "icon": "📊",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Every Monday 8AM",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 8 * * MON"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Pull KPI Sheet",
        "tool": "Google Sheets",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Read last 7 days of KPI data from dashboard sheet"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Write KPI Summary",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Summarize KPIs, highlight wins and risks in exec format."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Email Leadership",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Send weekly KPI digest to leadership distribution list"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-data-267"
  },
  {
    "name": "Airtable Record Enrichment",
    "description": "Enriches new Airtable company records with AI-researched firmographic data.",
    "category": "Data",
    "icon": "🏢",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "New Airtable Row",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "POST"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Research Company",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Find industry, size, revenue, and HQ for given company name."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Update Airtable",
        "tool": "Airtable",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Write enriched firmographic fields back to record"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Notify in Slack",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Post enriched company summary to #sales-intel channel"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Enriched",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-data-268"
  },
  {
    "name": "Duplicate Contact Merger",
    "description": "Detects duplicate CRM contacts daily and auto-merges them with a log entry.",
    "category": "Data",
    "icon": "🔗",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Daily at Midnight",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 0 * * *"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch All Contacts",
        "tool": "HubSpot",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Export full contact list with email, name, phone fields"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Find Duplicates",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Identify duplicate contacts by email, name similarity, phone."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Merge in HubSpot",
        "tool": "HubSpot",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Merge identified duplicate pairs, keep most recent activity"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Log to Sheets",
        "tool": "Google Sheets",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {
          "message": "Append merge log with count, pairs, and timestamp"
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Complete",
        "tool": "End",
        "position": {
          "x": 1400,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      },
      {
        "id": "e5",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-data-269"
  },
  {
    "name": "Survey Response Analyzer",
    "description": "Processes form survey responses and categorizes sentiment into Notion dashboard.",
    "category": "Data",
    "icon": "📝",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Form Submitted",
        "tool": "Form",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "form_submission"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Analyze Sentiment",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Score sentiment, extract themes, tag urgency from responses."
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "Negative Feedback?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "sentiment_score < 3"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Flag in Notion",
        "tool": "Notion",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "Create urgent feedback page with tags and verbatim response"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Log to Notion",
        "tool": "Notion",
        "position": {
          "x": 960,
          "y": 320
        },
        "config": {
          "message": "Append response row to survey tracker database"
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Logged",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "Negative"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5",
        "label": "Positive"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-data-270"
  },
  {
    "name": "API Data Pipeline Builder",
    "description": "Pulls third-party API data on schedule and writes transformed output to Sheets.",
    "category": "Data",
    "icon": "⚙️",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Every 6 Hours",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 */6 * * *"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Call External API",
        "tool": "HTTP",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "GET paginated data from third-party REST endpoint"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Transform Data",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Map API response to target schema, handle nulls and types."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Write to Sheets",
        "tool": "Google Sheets",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Append transformed rows to pipeline output spreadsheet"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Pipeline Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-data-271"
  },
  {
    "name": "Revenue Data Reconciler",
    "description": "Matches Stripe payments to CRM deals daily and flags mismatches for review.",
    "category": "Data",
    "icon": "💰",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Daily 7AM",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 7 * * *"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Stripe Charges",
        "tool": "Stripe",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "List all charges from prior day with metadata and amounts"
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Fetch CRM Deals",
        "tool": "HubSpot",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Get closed-won deals from yesterday with expected amounts"
        }
      },
      {
        "id": "n4",
        "type": "ai",
        "label": "Reconcile Records",
        "tool": "Claude AI",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "instructions": "Match payments to deals, flag unmatched or amount mismatches."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Log Mismatches",
        "tool": "Google Sheets",
        "position": {
          "x": 1180,
          "y": 120
        },
        "config": {
          "message": "Write mismatch rows to reconciliation audit sheet"
        }
      },
      {
        "id": "n6",
        "type": "action",
        "label": "Alert Finance",
        "tool": "Slack",
        "position": {
          "x": 1180,
          "y": 320
        },
        "config": {
          "message": "Post reconciliation summary with mismatch count to #finance"
        }
      },
      {
        "id": "n7",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1400,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n7"
      },
      {
        "id": "e7",
        "source": "n6",
        "target": "n7"
      }
    ],
    "id": "wf-data-272"
  },
  {
    "name": "Abandoned Cart Recovery",
    "description": "Automatically email customers who left items in their cart without purchasing.",
    "category": "Ecommerce",
    "icon": "🛒",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Cart Abandoned",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook",
          "instructions": "Trigger when cart is abandoned for 1 hour"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Write Recovery Email",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Write a friendly cart recovery email with product details."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Send Recovery Email",
        "tool": "Gmail",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Send personalized cart recovery email to customer"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Log in Sheets",
        "tool": "Google Sheets",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Log abandoned cart event and email sent"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-ecommerce-273"
  },
  {
    "name": "New Order Slack Alert",
    "description": "Notify your team on Slack instantly whenever a new order is placed.",
    "category": "Ecommerce",
    "icon": "📦",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "New Order Placed",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook",
          "instructions": "Fires on every new order event from store"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Summarize Order",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Summarize order details into a concise Slack message."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Post to Slack",
        "tool": "Slack",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Post order summary to #orders channel"
        }
      },
      {
        "id": "n4",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      }
    ],
    "id": "wf-ecommerce-274"
  },
  {
    "name": "Low Stock Reorder Alert",
    "description": "Detect low inventory and alert purchasing team to reorder stock automatically.",
    "category": "Ecommerce",
    "icon": "📉",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Daily Inventory Check",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 8 * * *",
          "instructions": "Run every morning at 8am"
        }
      },
      {
        "id": "n2",
        "type": "condition",
        "label": "Stock Below Threshold?",
        "tool": "Logic",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "condition": "inventory quantity < 20 units"
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Alert Purchasing Team",
        "tool": "Slack",
        "position": {
          "x": 740,
          "y": 120
        },
        "config": {
          "message": "Send low stock alert with SKU and quantity details"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Log Stock Status",
        "tool": "Google Sheets",
        "position": {
          "x": 740,
          "y": 320
        },
        "config": {
          "message": "Log current inventory levels to tracking sheet"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3",
        "label": "Low Stock"
      },
      {
        "id": "e3",
        "source": "n2",
        "target": "n4",
        "label": "OK"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-ecommerce-275"
  },
  {
    "name": "Post-Purchase Review Request",
    "description": "Send customers a review request email 7 days after their order is delivered.",
    "category": "Ecommerce",
    "icon": "⭐",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Order Delivered",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook",
          "instructions": "Trigger when order status changes to delivered"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Write Review Request",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Write a warm review request email referencing their product."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Schedule Email (Day 7)",
        "tool": "Gmail",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Send review request email 7 days after delivery"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Track in Airtable",
        "tool": "Airtable",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Log review request sent with order and customer info"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-ecommerce-276"
  },
  {
    "name": "Refund Request Handler",
    "description": "Process refund requests, classify them, and route to the right team automatically.",
    "category": "Ecommerce",
    "icon": "💸",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Refund Request Received",
        "tool": "Email",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "email",
          "instructions": "Watch inbox for refund or return request emails"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Classify Request",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Classify refund reason: damaged, wrong item, or other."
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "Auto-Approvable?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "order under $50 and first refund request"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Issue Refund via Stripe",
        "tool": "Stripe",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "Process automatic refund and notify customer"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Escalate to Team",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 320
        },
        "config": {
          "message": "Alert support team for manual review of refund"
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "Yes"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5",
        "label": "No"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-ecommerce-277"
  },
  {
    "name": "VIP Customer Identifier",
    "description": "Tag high-value customers in CRM when their lifetime spend exceeds your threshold.",
    "category": "Ecommerce",
    "icon": "👑",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Order Completed",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook",
          "instructions": "Fires after every successful order completion"
        }
      },
      {
        "id": "n2",
        "type": "condition",
        "label": "Lifetime Value > $500?",
        "tool": "Logic",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "condition": "customer total lifetime spend exceeds $500"
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Tag as VIP in HubSpot",
        "tool": "HubSpot",
        "position": {
          "x": 740,
          "y": 120
        },
        "config": {
          "message": "Add VIP tag and update customer segment in HubSpot"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Send VIP Welcome Email",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "Send personalized VIP welcome email with perks"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3",
        "label": "Yes"
      },
      {
        "id": "e3",
        "source": "n2",
        "target": "n5",
        "label": "No"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-ecommerce-278"
  },
  {
    "name": "Flash Sale Announcement",
    "description": "Schedule and blast a flash sale announcement to email list and social media.",
    "category": "Ecommerce",
    "icon": "⚡",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Sale Scheduled",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 9 * * 5",
          "instructions": "Every Friday at 9am for weekly flash sale"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Generate Sale Copy",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Write exciting flash sale copy for email and Twitter."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Send Email Blast",
        "tool": "Gmail",
        "position": {
          "x": 740,
          "y": 120
        },
        "config": {
          "message": "Send flash sale email to entire subscriber list"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Post on Twitter",
        "tool": "Twitter",
        "position": {
          "x": 740,
          "y": 320
        },
        "config": {
          "message": "Post flash sale announcement tweet with discount code"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n2",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-ecommerce-279"
  },
  {
    "name": "Product Return to Notion",
    "description": "Log all returned products into a Notion database for trend analysis and tracking.",
    "category": "Ecommerce",
    "icon": "🔄",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Return Initiated",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook",
          "instructions": "Fires when a return is initiated in the store"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Extract Return Reason",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Extract product name, reason, and order ID from return."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Add to Notion DB",
        "tool": "Notion",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Create new Notion entry with return details and reason"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Update Sheets Log",
        "tool": "Google Sheets",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Append return data row to monthly returns spreadsheet"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-ecommerce-280"
  },
  {
    "name": "Abandoned Cart Recovery",
    "description": "Automatically email customers who left items in their cart without purchasing.",
    "category": "Ecommerce",
    "icon": "🛒",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Cart Abandoned",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook",
          "instructions": "Trigger when cart is abandoned for 1 hour"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Write Recovery Email",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Write a friendly cart recovery email with item details."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Send Recovery Email",
        "tool": "Gmail",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Send personalized cart recovery email to customer"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Log in Sheets",
        "tool": "Google Sheets",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Log abandoned cart recovery attempt with timestamp"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-ecommerce-281"
  },
  {
    "name": "Low Stock Alert System",
    "description": "Monitor inventory levels and alert team when products run low.",
    "category": "Ecommerce",
    "icon": "📦",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Daily Stock Check",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 8 * * *"
        }
      },
      {
        "id": "n2",
        "type": "condition",
        "label": "Stock Below Threshold?",
        "tool": "Logic",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "condition": "inventory quantity < 10 units"
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Alert Slack Team",
        "tool": "Slack",
        "position": {
          "x": 740,
          "y": 120
        },
        "config": {
          "message": "Post low stock alert with product name and quantity"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Update Reorder Sheet",
        "tool": "Google Sheets",
        "position": {
          "x": 740,
          "y": 320
        },
        "config": {
          "message": "Add product to reorder list in Google Sheets"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3",
        "label": "Low Stock"
      },
      {
        "id": "e3",
        "source": "n2",
        "target": "n4",
        "label": "Critical Stock"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-ecommerce-282"
  },
  {
    "name": "New Order CRM Sync",
    "description": "Sync every new order into HubSpot and notify sales team on Slack.",
    "category": "Ecommerce",
    "icon": "🔄",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "New Order Placed",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook",
          "instructions": "Trigger on new order from ecommerce platform"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Create HubSpot Deal",
        "tool": "HubSpot",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Create new deal with order value and customer info"
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Notify Sales Slack",
        "tool": "Slack",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Post new order summary to #sales channel"
        }
      },
      {
        "id": "n4",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      }
    ],
    "id": "wf-ecommerce-283"
  },
  {
    "name": "Product Review Request",
    "description": "Send automated review requests 7 days after order delivery.",
    "category": "Ecommerce",
    "icon": "⭐",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Order Delivered",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook",
          "instructions": "Trigger when order status changes to delivered"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Generate Review Request",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Write a warm review request email mentioning the product."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Send After 7 Days",
        "tool": "Gmail",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Schedule and send review request email after 7 days"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Track in Airtable",
        "tool": "Airtable",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Log review request sent with order and customer data"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-ecommerce-284"
  },
  {
    "name": "Flash Sale Social Blast",
    "description": "Automatically post flash sale announcements to Twitter and LinkedIn.",
    "category": "Ecommerce",
    "icon": "⚡",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Sale Starts",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 10 * * 5"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Write Social Posts",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Write engaging flash sale posts for Twitter and LinkedIn."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Post to Twitter",
        "tool": "Twitter",
        "position": {
          "x": 740,
          "y": 120
        },
        "config": {
          "message": "Publish flash sale tweet with discount and link"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Post to LinkedIn",
        "tool": "LinkedIn",
        "position": {
          "x": 740,
          "y": 320
        },
        "config": {
          "message": "Publish flash sale post to LinkedIn company page"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n2",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-ecommerce-285"
  },
  {
    "name": "Refund Request Handler",
    "description": "Process refund requests, check eligibility, and notify customer automatically.",
    "category": "Ecommerce",
    "icon": "💸",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Refund Request Form",
        "tool": "Form",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "instructions": "Customer submits refund request with order number"
        }
      },
      {
        "id": "n2",
        "type": "condition",
        "label": "Within 30 Days?",
        "tool": "Logic",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "condition": "order date is within last 30 days"
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Process Stripe Refund",
        "tool": "Stripe",
        "position": {
          "x": 740,
          "y": 120
        },
        "config": {
          "message": "Initiate full refund via Stripe payment gateway"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Send Denial Email",
        "tool": "Gmail",
        "position": {
          "x": 740,
          "y": 320
        },
        "config": {
          "message": "Send polite refund denial email with policy explanation"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3",
        "label": "Eligible"
      },
      {
        "id": "e3",
        "source": "n2",
        "target": "n4",
        "label": "Not Eligible"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-ecommerce-286"
  },
  {
    "name": "VIP Customer Identifier",
    "description": "Tag and reward customers who reach $500 in lifetime purchases automatically.",
    "category": "Ecommerce",
    "icon": "👑",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Order Completed",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook",
          "instructions": "Trigger on every completed order event"
        }
      },
      {
        "id": "n2",
        "type": "condition",
        "label": "Lifetime Value $500+?",
        "tool": "Logic",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "condition": "customer lifetime value >= $500"
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Tag VIP in HubSpot",
        "tool": "HubSpot",
        "position": {
          "x": 740,
          "y": 120
        },
        "config": {
          "message": "Apply VIP tag and update customer segment in HubSpot"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Send VIP Welcome",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "Send VIP welcome email with exclusive discount code"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3",
        "label": "VIP Threshold Met"
      },
      {
        "id": "e3",
        "source": "n2",
        "target": "n5",
        "label": "Not Yet"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-ecommerce-287"
  },
  {
    "name": "Daily Sales Report",
    "description": "Generate and email a daily sales summary report to leadership every morning.",
    "category": "Ecommerce",
    "icon": "📊",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Morning Schedule",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 7 * * *"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Pull Sales Data",
        "tool": "Google Sheets",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Fetch yesterday's sales data from reporting spreadsheet"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Write Sales Summary",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Summarize sales data into a concise daily report."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Email Leadership",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Email daily sales report to leadership distribution list"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-ecommerce-288"
  },
  {
    "name": "Patient Appointment Reminder",
    "description": "Sends automated reminders to patients 24 hours before their appointments.",
    "category": "Healthcare",
    "icon": "🏥",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Schedule Trigger",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 9 * * *"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Appointments",
        "tool": "HTTP",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "GET appointments scheduled for tomorrow from EHR API"
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Personalize Reminder",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Write a friendly appointment reminder with date, time, and location."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Send Reminder Email",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Send reminder email to patient"
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-healthcare-289"
  },
  {
    "name": "Lab Results Notification",
    "description": "Notifies patients and doctors when lab results are ready and flags abnormal values.",
    "category": "Healthcare",
    "icon": "🧪",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Lab Result Webhook",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "POST"
        }
      },
      {
        "id": "n2",
        "type": "condition",
        "label": "Abnormal Values?",
        "tool": "Logic",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "condition": "result.status === 'abnormal'"
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Alert Doctor via Slack",
        "tool": "Slack",
        "position": {
          "x": 740,
          "y": 120
        },
        "config": {
          "message": "Urgent: Abnormal lab result received. Review immediately."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Email Patient Results",
        "tool": "Gmail",
        "position": {
          "x": 740,
          "y": 320
        },
        "config": {
          "message": "Your lab results are ready. Please log in to your portal."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3",
        "label": "Abnormal"
      },
      {
        "id": "e3",
        "source": "n2",
        "target": "n4",
        "label": "Normal"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-healthcare-290"
  },
  {
    "name": "New Patient Onboarding",
    "description": "Automates intake forms, insurance verification, and welcome communications.",
    "category": "Healthcare",
    "icon": "📋",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Intake Form Submitted",
        "tool": "Form",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "new_patient_intake"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Summarize Patient Info",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Summarize new patient intake data for the care team."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Create Patient Record",
        "tool": "Airtable",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Add new patient record to Airtable database"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Send Welcome Email",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Send personalized welcome email with portal login and next steps."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-healthcare-291"
  },
  {
    "name": "Prescription Refill Requests",
    "description": "Processes patient refill requests and routes them to the correct prescribing doctor.",
    "category": "Healthcare",
    "icon": "💊",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Refill Request Form",
        "tool": "Form",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "prescription_refill"
        }
      },
      {
        "id": "n2",
        "type": "condition",
        "label": "Controlled Substance?",
        "tool": "Logic",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "condition": "medication.schedule in ['II','III','IV']"
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Flag for Manual Review",
        "tool": "Slack",
        "position": {
          "x": 740,
          "y": 120
        },
        "config": {
          "message": "Controlled substance refill request needs doctor approval."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Route to Prescriber",
        "tool": "Gmail",
        "position": {
          "x": 740,
          "y": 320
        },
        "config": {
          "message": "Refill request forwarded to prescribing physician for review."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3",
        "label": "Controlled"
      },
      {
        "id": "e3",
        "source": "n2",
        "target": "n4",
        "label": "Standard"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-healthcare-292"
  },
  {
    "name": "Post-Visit Care Summary",
    "description": "Generates and sends personalized care summaries to patients after each visit.",
    "category": "Healthcare",
    "icon": "📝",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Visit Completed Webhook",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "POST"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Generate Care Summary",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Create a clear patient-friendly summary of visit notes and next steps."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Log to Patient Record",
        "tool": "Notion",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Save care summary to patient's Notion health record page."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Email Summary to Patient",
        "tool": "Gmail",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Send post-visit care summary email to the patient."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-healthcare-293"
  },
  {
    "name": "Staff Shift Coverage Alert",
    "description": "Detects open shifts due to call-outs and alerts available staff automatically.",
    "category": "Healthcare",
    "icon": "👩‍⚕️",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Absence Form Submitted",
        "tool": "Form",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "staff_absence"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Find Available Staff",
        "tool": "Google Sheets",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Look up qualified available staff for the open shift in schedule sheet."
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Draft Coverage Request",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Write an urgent shift coverage request message for available staff."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Notify Available Staff",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Send shift coverage alert to qualified available team members."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-healthcare-294"
  },
  {
    "name": "Insurance Claim Status Tracker",
    "description": "Monitors insurance claim statuses and alerts billing staff on denials or delays.",
    "category": "Healthcare",
    "icon": "🏦",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Daily Claim Check",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 8 * * 1-5"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Claim Statuses",
        "tool": "HTTP",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "GET pending insurance claims from billing API"
        }
      },
      {
        "id": "n3",
        "type": "condition",
        "label": "Denied or Delayed?",
        "tool": "Logic",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "condition": "claim.status in ['denied','delayed'] or days_pending > 30"
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Alert Billing Team",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 120
        },
        "config": {
          "message": "Insurance claim denied or delayed. Billing team action required."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Log Claim to Sheet",
        "tool": "Google Sheets",
        "position": {
          "x": 960,
          "y": 320
        },
        "config": {
          "message": "Update claim status log in billing tracker spreadsheet."
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4",
        "label": "Issue Found"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5",
        "label": "Clean"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-healthcare-295"
  },
  {
    "name": "Patient Satisfaction Survey",
    "description": "Automatically sends post-visit satisfaction surveys and logs responses for review.",
    "category": "Healthcare",
    "icon": "⭐",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Appointment Completed",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "POST"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Send Survey Email",
        "tool": "Gmail",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Send post-visit satisfaction survey link to patient."
        }
      },
      {
        "id": "n3",
        "type": "trigger",
        "label": "Survey Response Received",
        "tool": "Webhook",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "type": "POST"
        }
      },
      {
        "id": "n4",
        "type": "condition",
        "label": "Low Score?",
        "tool": "Logic",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "condition": "survey.score < 3"
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Alert Practice Manager",
        "tool": "Slack",
        "position": {
          "x": 1180,
          "y": 120
        },
        "config": {
          "message": "Low patient satisfaction score received. Follow-up needed."
        }
      },
      {
        "id": "n6",
        "type": "action",
        "label": "Log to Response Sheet",
        "tool": "Google Sheets",
        "position": {
          "x": 1180,
          "y": 320
        },
        "config": {
          "message": "Append survey score and feedback to patient satisfaction tracker."
        }
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5",
        "label": "Low Score"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n6",
        "label": "Good Score"
      }
    ],
    "id": "wf-healthcare-296"
  },
  {
    "name": "Lab Results Patient Notification",
    "description": "Automatically notify patients when lab results are ready via email.",
    "category": "Healthcare",
    "icon": "🧪",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Lab Result Ready",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Compose Patient Message",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Write a friendly, HIPAA-safe message that lab results are ready."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Email Patient",
        "tool": "Gmail",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Send lab result notification to patient."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Log in Health Records",
        "tool": "Airtable",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Record notification sent timestamp and result status."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-healthcare-297"
  },
  {
    "name": "No-Show Appointment Follow-Up",
    "description": "Detect missed appointments and automatically re-engage patients to reschedule.",
    "category": "Healthcare",
    "icon": "📅",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Missed Appointment Flag",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "n2",
        "type": "ai",
        "label": "Draft Re-engagement Email",
        "tool": "Claude AI",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "instructions": "Write an empathetic email encouraging patient to reschedule."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Send Follow-Up Email",
        "tool": "Gmail",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "message": "Send reschedule request to patient."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Flag in CRM",
        "tool": "HubSpot",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Mark patient as no-show, schedule follow-up task."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-healthcare-298"
  },
  {
    "name": "Insurance Pre-Auth Request Tracker",
    "description": "Track prior authorization requests and alert staff on approvals or denials.",
    "category": "Healthcare",
    "icon": "📋",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Auth Status Update",
        "tool": "Webhook",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "type": "webhook"
        }
      },
      {
        "id": "n2",
        "type": "condition",
        "label": "Approved or Denied?",
        "tool": "Logic",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "condition": "Check if authorization status is approved or denied."
        }
      },
      {
        "id": "n3",
        "type": "action",
        "label": "Notify Care Team",
        "tool": "Slack",
        "position": {
          "x": 740,
          "y": 120
        },
        "config": {
          "message": "Post approval notice to #care-coordination channel."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Alert for Appeal",
        "tool": "Slack",
        "position": {
          "x": 740,
          "y": 320
        },
        "config": {
          "message": "Alert billing team to begin denial appeal process."
        }
      },
      {
        "id": "n5",
        "type": "action",
        "label": "Update Auth Log",
        "tool": "Google Sheets",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Log auth result, date, and patient ID to tracker sheet."
        }
      },
      {
        "id": "n6",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3",
        "label": "Approved"
      },
      {
        "id": "e3",
        "source": "n2",
        "target": "n4",
        "label": "Denied"
      },
      {
        "id": "e4",
        "source": "n3",
        "target": "n5"
      },
      {
        "id": "e5",
        "source": "n4",
        "target": "n5"
      },
      {
        "id": "e6",
        "source": "n5",
        "target": "n6"
      }
    ],
    "id": "wf-healthcare-299"
  },
  {
    "name": "Daily Staff Shift Briefing",
    "description": "Generate and distribute a daily AI briefing for clinical staff each morning.",
    "category": "Healthcare",
    "icon": "🏥",
    "nodes": [
      {
        "id": "n1",
        "type": "trigger",
        "label": "Morning Schedule Trigger",
        "tool": "Schedule",
        "position": {
          "x": 300,
          "y": 200
        },
        "config": {
          "cron_expression": "0 6 * * 1-5"
        }
      },
      {
        "id": "n2",
        "type": "action",
        "label": "Fetch Today's Schedule",
        "tool": "Google Sheets",
        "position": {
          "x": 520,
          "y": 200
        },
        "config": {
          "message": "Pull today's patient schedule, bed occupancy, and alerts."
        }
      },
      {
        "id": "n3",
        "type": "ai",
        "label": "Generate Shift Briefing",
        "tool": "Claude AI",
        "position": {
          "x": 740,
          "y": 200
        },
        "config": {
          "instructions": "Summarize schedule data into a concise clinical shift briefing."
        }
      },
      {
        "id": "n4",
        "type": "action",
        "label": "Post to Staff Channel",
        "tool": "Slack",
        "position": {
          "x": 960,
          "y": 200
        },
        "config": {
          "message": "Post shift briefing to #daily-huddle Slack channel."
        }
      },
      {
        "id": "n5",
        "type": "end",
        "label": "Done",
        "tool": "End",
        "position": {
          "x": 1180,
          "y": 200
        },
        "config": {}
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "n1",
        "target": "n2"
      },
      {
        "id": "e2",
        "source": "n2",
        "target": "n3"
      },
      {
        "id": "e3",
        "source": "n3",
        "target": "n4"
      },
      {
        "id": "e4",
        "source": "n4",
        "target": "n5"
      }
    ],
    "id": "wf-healthcare-300"
  }
]
