// /us-consulting now replicates /consult exactly, per direction — the
// dashboard/automation-specific pitch this page used to carry (see git
// history for the prior version) is retired. Re-exporting rather than
// duplicating the JSX so the two routes can never drift out of sync again;
// this is a second URL for the same page (kept separate so the Meta
// campaign has its own path to track), not a second page to maintain.
export { metadata } from '../consult/page'
export { default } from '../consult/page'
