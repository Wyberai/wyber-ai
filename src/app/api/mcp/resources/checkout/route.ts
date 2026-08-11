import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { verifyParams } from '@/lib/internal-auth'

/**
 * Serves the interactive credit-limit checkout UI for MCP.
 * This resource is embedded in the MCP tool response when a user hits their credit limit.
 * Accessed as an iframe or modal with query params: ?user_id=...&cost=...&balance=...
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('user_id')
    const costNeeded = searchParams.get('cost')
    const balance = searchParams.get('balance')
    const sig = searchParams.get('sig')
    const returnTo = searchParams.get('return_to') || 'https://claude.ai'

    if (!userId || !costNeeded || balance === null) {
      return NextResponse.json(
        { error: 'Missing required params: user_id, cost, balance' },
        { status: 400 },
      )
    }

    // This resource previously trusted user_id/cost/balance straight off the
    // query string with no auth at all — anyone who could guess a WyberAi
    // user UUID could load this page and read that user's plan and credit
    // balance. get_message_status signs the URL it generates; refuse
    // anything else instead of serving real account data to an unsigned request.
    if (!sig || !verifyParams({ user_id: userId, cost: costNeeded, balance }, sig)) {
      return NextResponse.json({ error: 'Invalid or expired checkout link.' }, { status: 403 })
    }

    // Fetch user plan to show relevant upgrade options.
    // If we can't fetch it (e.g., user doesn't exist in this context), fall back to free plan.
    let currentPlan = 'free'
    let currentCredits = 0
    try {
      const admin = await createAdminClient()
      const { data: profile } = await admin
        .from('profiles')
        .select('plan, credits, email')
        .eq('id', userId)
        .single()

      if (profile) {
        currentPlan = profile.plan ?? 'free'
        currentCredits = profile.credits ?? 0
      }
    } catch (err) {
      console.warn('Could not fetch user profile for checkout UI, using defaults:', err)
      // Continue with defaults — plan is 'free', credits is 0
    }

    // Build upgrade options based on current plan
    const upgrades = getUpgradeOptions(currentPlan, parseInt(costNeeded, 10), currentCredits)

    // Serve HTML — this will be rendered in an iframe within Claude
    const html = buildCheckoutHtml(userId, parseInt(costNeeded, 10), currentCredits, upgrades, returnTo)

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Frame-Options': 'ALLOWALL', // Allow embedding in Claude's iframe
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err) {
    console.error('Checkout resource error:', err)
    return NextResponse.json(
      { error: 'Failed to load checkout UI' },
      { status: 500 },
    )
  }
}

interface UpgradeOption {
  planKey: string
  title: string
  creditsGranted: number
  subtitle?: string
}

/**
 * Suggest upgrade paths based on user's current plan and credit shortage.
 * Prioritize options that solve the immediate problem (cost) + add buffer.
 */
function getUpgradeOptions(currentPlan: string, costNeeded: number, currentCredits: number): UpgradeOption[] {
  // Plan credit grants (monthly/annual assumptions)
  const planCredits: Record<string, number> = {
    free: 0,
    spark: 100,
    starter: 500,
    builder: 2000,
    pro: 8000,
    growth: 30000,
    scale: 100000,
  }

  const topups: UpgradeOption[] = [
    { planKey: 'topup_200', title: 'Quick Top-up', creditsGranted: 200 },
    { planKey: 'topup_600', title: 'Standard Top-up', creditsGranted: 600 },
    { planKey: 'topup_2000', title: 'Mega Top-up', creditsGranted: 2000 },
  ]

  const plans: UpgradeOption[] = []

  if (currentPlan === 'free' || currentPlan === 'spark') {
    plans.push({
      planKey: 'starter_monthly',
      title: 'Starter Plan',
      creditsGranted: planCredits.starter,
      subtitle: '500 credits/month',
    })
  }

  if (currentPlan !== 'pro' && currentPlan !== 'growth' && currentPlan !== 'scale') {
    plans.push({
      planKey: 'pro_monthly',
      title: 'Pro Plan',
      creditsGranted: planCredits.pro,
      subtitle: '8,000 credits/month',
    })
  }

  plans.push({
    planKey: 'growth_monthly',
    title: 'Growth Plan',
    creditsGranted: planCredits.growth,
    subtitle: '30,000 credits/month',
  })

  // Return top-ups first (quick solve), then plans, sorted by value
  return [...topups, ...plans].sort((a, b) => a.creditsGranted - b.creditsGranted)
}

function buildCheckoutHtml(
  userId: string,
  costNeeded: number,
  currentCredits: number,
  upgrades: UpgradeOption[],
  returnTo: string,
): string {
  const deficit = costNeeded - currentCredits

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Credit Checkout — WyberAi</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #f1f5f9;
      padding: 24px;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .modal {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      max-width: 500px;
      width: 100%;
      padding: 32px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.6);
    }

    .header {
      text-align: center;
      margin-bottom: 28px;
    }

    .header h2 {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 8px;
      background: linear-gradient(90deg, #60a5fa, #a78bfa);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .header p {
      color: #94a3b8;
      font-size: 14px;
    }

    .credit-status {
      background: rgba(15, 23, 42, 0.5);
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
      text-align: center;
    }

    .credit-status-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      font-size: 14px;
    }

    .credit-status-row:last-child {
      margin-bottom: 0;
    }

    .credit-value {
      font-weight: 600;
      font-size: 16px;
    }

    .needed {
      color: #f87171;
    }

    .deficit-banner {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 6px;
      padding: 12px 16px;
      margin-bottom: 24px;
      font-size: 14px;
      color: #fca5a5;
      text-align: center;
    }

    .upgrades-label {
      font-size: 13px;
      font-weight: 600;
      color: #cbd5e1;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
    }

    .upgrades-grid {
      display: grid;
      gap: 10px;
      margin-bottom: 20px;
    }

    .upgrade-btn {
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 12px 16px;
      color: #f1f5f9;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s ease;
      text-align: left;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .upgrade-btn:hover {
      background: linear-gradient(135deg, #60a5fa, #3b82f6);
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
    }

    .upgrade-title {
      font-weight: 600;
    }

    .upgrade-credit {
      font-size: 12px;
      color: #bfdbfe;
      font-weight: 600;
    }

    .loading {
      opacity: 0.6;
      pointer-events: none;
    }

    .spinner {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top: 2px solid #60a5fa;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-right: 8px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .footer {
      border-top: 1px solid #334155;
      padding-top: 16px;
      font-size: 12px;
      color: #64748b;
      text-align: center;
    }

    .footer a {
      color: #60a5fa;
      text-decoration: none;
    }

    .footer a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="modal">
    <div class="header">
      <h2>Upgrade to Continue</h2>
      <p>You've reached your credit limit</p>
    </div>

    <div class="credit-status">
      <div class="credit-status-row">
        <span>Credits needed:</span>
        <span class="credit-value needed">${costNeeded}</span>
      </div>
      <div class="credit-status-row">
        <span>Your balance:</span>
        <span class="credit-value">${currentCredits}</span>
      </div>
    </div>

    <div class="deficit-banner">
      You need <strong>${deficit}</strong> more credit${deficit !== 1 ? 's' : ''} to continue
    </div>

    <div class="upgrades-label">Quick solutions</div>
    <div class="upgrades-grid">
      ${upgrades
        .map(
          u => `
        <button class="upgrade-btn" onclick="checkout('${u.planKey}')">
          <div>
            <div class="upgrade-title">${u.title}</div>
            ${u.subtitle ? `<div style="font-size: 12px; color: #cbd5e1; margin-top: 2px;">${u.subtitle}</div>` : ''}
          </div>
          <div class="upgrade-credit">+${u.creditsGranted}</div>
        </button>
      `,
        )
        .join('')}
    </div>

    <div class="footer">
      <a href="https://wyberai.com/pricing" target="_blank">View all plans</a>
      &nbsp;·&nbsp;
      <a href="https://wyberai.com/docs/credits" target="_blank">How credits work</a>
    </div>
  </div>

  <script>
    async function checkout(planKey) {
      const btn = event.target.closest('.upgrade-btn');
      btn.classList.add('loading');
      btn.innerHTML = '<span class="spinner"></span>Processing...';

      try {
        const res = await fetch('/api/dodo/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planKey }),
        });

        if (!res.ok) {
          throw new Error('Checkout failed');
        }

        const { url } = await res.json();
        if (url) {
          // Open checkout in new tab; on return, the page will redirect back
          window.open(url, '_blank');
          // Give user feedback
          setTimeout(() => {
            btn.classList.remove('loading');
            btn.textContent = '✓ Opening checkout...';
          }, 500);
        }
      } catch (err) {
        console.error('Checkout error:', err);
        btn.classList.remove('loading');
        btn.textContent = 'Error — try again';
        setTimeout(() => { btn.textContent = 'Retry'; }, 3000);
      }
    }
  </script>
</body>
</html>`
}
