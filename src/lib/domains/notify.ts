import type { Order } from './orders'

// The email the customer gets when their order finishes, or when it needs a person. Plain text, no promises we cannot
// keep: DNS can take from a few minutes to a few hours to spread, and for Workspace the sign-in email comes from Google.

export interface OrderMail { to: string; subject: string; text: string }

type MailOrder = Pick<Order, 'id' | 'kind' | 'domain' | 'seats' | 'months' | 'total_cents' | 'contact'>

const usd = (c: number) => `$${(c / 100).toFixed(2)}`

export function orderMail(order: MailOrder, outcome: 'done' | 'attention', appUrl: string): OrderMail {
  const to = order.contact.email
  const link = `${appUrl}/dashboard/domains`
  const ref = order.id.slice(0, 8)
  if (outcome === 'attention') {
    return {
      to,
      subject: `Your order for ${order.domain} needs one more step`,
      text: [
        `Your payment of ${usd(order.total_cents)} for ${order.kind === 'workspace' ? `Google Workspace on ${order.domain}` : order.domain} is safe.`,
        '',
        'One step of the setup did not finish on its own, so a person on our team is finishing it. We will complete the order or refund you in full.',
        '',
        `Reference: ${ref}. Reply to this email if you want an update.`,
      ].join('\n'),
    }
  }
  if (order.kind === 'workspace') {
    const seats = order.seats ?? 1
    return {
      to,
      subject: `Google Workspace for ${order.domain} is set up`,
      text: [
        `Google Workspace is set up for ${order.domain} with ${seats} seat${seats === 1 ? '' : 's'}, for ${order.months ?? 12} months. You paid ${usd(order.total_cents)}.`,
        '',
        `The admin account is admin@${order.domain}. Google sends the sign-in setup for it to ${to}. If you do not see it within a day, reply to this email and we will help.`,
        '',
        `If ${order.domain} was bought here, the mail records are added for you. If not, the records to add where your domain is managed are on this page: ${link}`,
        '',
        'Workspace does not renew by itself. We email you 30, 14, 7 and 1 days before it ends.',
      ].join('\n'),
    }
  }
  return {
    to,
    subject: `${order.domain} is yours`,
    text: [
      `${order.domain} is registered in your name. You paid ${usd(order.total_cents)}.`,
      '',
      'We are pointing it at your site now. It can take anywhere from a few minutes to a few hours for the internet to pick it up, and the security certificate follows. You can watch the status here, and press Try again if a step is stuck:',
      link,
      '',
      'The domain does not renew by itself. We email you 30, 14, 7 and 1 days before it expires.',
    ].join('\n'),
  }
}
