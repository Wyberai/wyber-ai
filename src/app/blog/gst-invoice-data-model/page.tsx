import { PostShell } from '@/components/signal/PostShell'
import { getPost, postMetadata } from '@/lib/blog/meta'

const post = getPost('gst-invoice-data-model')
export const metadata = postMetadata(post)

export default function Page() {
  return (
    <PostShell
      post={post}
      dek="Billing looks the same in Ahmedabad and Austin until the tax lines. A data model that holds up in both, with the India and US specifics laid out separately."
      cta={{
        title: 'Build the invoice tool you actually use',
        body: 'Describe your invoices and who sees them. Bring your accountant’s rules, and read the estimate before you build.',
        href: '/create',
        label: 'Describe your app',
        second: { href: '/blog/prompting-a-data-app-tables-roles-states', label: 'How to write the prompt' },
      }}
    >
      <p>Whoever builds a billing tool eventually finds out that the invoice table is where regret starts. Edit a customer’s address and an old invoice changes. Store money as decimals and a total is off by a paisa or a cent. Hard-code a tax rate and it is wrong in a month. Most of that can be designed out on day one, in India and in the US.</p>

      <div className="sg-callout">
        <strong>This is about structure, not tax advice</strong>
        Rates, thresholds and mandatory fields change and depend on your business. Have a chartered accountant (India) or a CPA (US) read your invoice layout before you rely on it.
      </div>

      <h2>What both countries agree on</h2>
      <p>Copy the supplier and recipient details onto the invoice at the time you issue it, and never read them back from the customer record later. An invoice is a snapshot. Store every amount as a whole number of the smallest unit, paise or cents, in a <code>bigint</code>. Floating-point numbers cannot hold 0.1 exactly, so sums drift by a unit and columns stop matching totals. Pick one rounding rule, apply it per line, and show any round-off as its own line so the total can be explained.</p>
      <p>Keep tax on its own rows instead of in fixed columns. India has CGST, SGST and IGST; a US invoice may carry state, county and city tax. A table of tax lines handles both:</p>
      <pre><code>{`CREATE TABLE invoices (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  series        text NOT NULL,            -- financial year in India, e.g. '2026-27'
  invoice_no    text NOT NULL,
  issued_on     date NOT NULL,
  supplier_tax_id text NOT NULL,          -- GSTIN in India, EIN or state tax id in the US
  supplier      jsonb NOT NULL,           -- name and address, copied at issue
  recipient     jsonb NOT NULL,
  place_of_supply text,                   -- India: state code. US: ship-to state
  taxable_minor bigint NOT NULL,
  tax_minor     bigint NOT NULL,
  total_minor   bigint NOT NULL,
  status        text NOT NULL DEFAULT 'issued',   -- issued | void
  UNIQUE (supplier_tax_id, series, invoice_no)
);

CREATE TABLE invoice_tax_lines (
  invoice_id  uuid REFERENCES invoices ON DELETE CASCADE,
  jurisdiction text NOT NULL,            -- 'CGST', 'SGST', 'IGST', 'CA-STATE', 'LA-COUNTY'
  rate        numeric(7,4) NOT NULL,     -- the rate used, stored, never looked up later
  amount_minor bigint NOT NULL
);`}</code></pre>
      <p>Store the rate you used on each tax row. A rate you look up later is not the rate you charged. Once issued, do not edit an invoice. Void it and issue a credit note, and keep the number.</p>

      <h2>India: GST</h2>
      <p>A GSTIN has 15 characters in a fixed shape: a 2-digit state code, the business’s 10-character PAN, an entity number, the letter Z, and a check character. A format test catches most typing mistakes at the form instead of at filing time.</p>
      <pre><code>{`const GSTIN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/
const isGstin = (v) => GSTIN.test(String(v).trim().toUpperCase())

// Same state: CGST + SGST. Different state: IGST.
const taxType = (supplierGstin, placeOfSupplyCode) =>
  supplierGstin.slice(0, 2) === placeOfSupplyCode ? 'CGST+SGST' : 'IGST'`}</code></pre>
      <p>That confirms the shape, not that the number is real or active, which only the government portal can tell you. Store the place-of-supply state code on the invoice and do not recalculate it from the customer’s address later.</p>
      <p>Invoice numbers have rules of their own: at most 16 characters, letters, digits, hyphen and slash only, in a consecutive series that is unique within the financial year. Enforce uniqueness in the database and generate the number on the server, so two people billing at the same moment cannot take the same one. Which HSN or SAC detail you must show depends on your turnover, so ask your accountant instead of hard-coding it.</p>
      <p>When you reconcile your purchase register against GSTR-2B, join on supplier GSTIN and invoice number, and normalise the numbers first. Most false mismatches are typing differences.</p>
      <pre><code>{`const norm = (s) => String(s).toUpperCase().replace(/[^A-Z0-9]/g, '')
// 'INV/0012', 'inv-0012' and 'INV 0012' all become 'INV0012'.
// Zeros are the open question: 'INV12' vs 'INV0012'. Pick one rule for both sides.`}</code></pre>
      <p>Then list three groups: matched, in your books but not in 2B (the suppliers to chase), and in 2B but not in your books.</p>

      <h2>United States: sales tax</h2>
      <p>There is no national sales tax, so there is nothing like a GSTIN to validate. For most sales the tax depends on where the goods are delivered, so the ship-to address is what drives it, not the billing address. Rates stack across state, county, city and special districts, and they change, so a rate you typed into your code last year is a bug waiting to be found. Most businesses use a tax service, such as Stripe Tax or Avalara, to look up the combined rate for an address, and store the result per jurisdiction on the invoice lines, as in the table above.</p>
      <p>Two things catch small sellers out. First, you may owe sales tax in states where you have no office, once your sales there pass that state’s threshold, so record the ship-to state on every invoice and you can answer the question later. Second, some customers are exempt, such as resellers, and you need to keep their exemption certificate on file. A nullable certificate reference on the recipient is enough to start.</p>
      <p>There is no single federal invoice layout, which sounds easier than India’s rules and mostly means your customers and your state set the requirements. A sequential number, the date, itemised lines, the tax broken out and your contact details cover what most buyers expect.</p>

      <h2>Checks that pay for themselves</h2>
      <p>Validate the tax id format on every party, in the country it belongs to. Confirm that the tax lines match the supplier and place of supply. Make sure line totals add up to the invoice total in whole paise or cents. Confirm the number is unique within its series. And watch for gaps in the sequence, with a visible note for any void.</p>
    </PostShell>
  )
}
