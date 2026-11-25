// A turn that changed no files used to show one canned error for every reason. When the model wrote a real explanation or question
// (for example "I won't invent patient reviews: here is why, and here is what I can do") the user must see THAT. The canned message stays for
// the cases that are failures. The guard against a false "I did it" narrative is kept: any reply that claims the work is done is not shown.

const COMPLETION_CLAIM = /\b(i(?:'ve| have)?\s+(?:just\s+)?(?:added|built|updated|changed|created|made|fixed|implemented|wired|replaced|removed|moved|renamed|set up)|(?:has|have) been (?:added|built|updated|changed|created|made|fixed)|now (?:shows|has|includes|reads|uses|appears|displays|looks)|is now live|are now live|done\b|✓|all set|finished)\b/i

/** Strip file/edit blocks and agent markers, leaving only the prose the model wrote. */
function prose(raw: string): string {
  return raw
    .replace(/<file[\s\S]*?<\/file>/g, ' ')
    .replace(/<edit[\s\S]*?<\/edit>/g, ' ')
    .replace(/\[agent:\{[\s\S]*?\}\]/g, ' ')
    .replace(/\[progress:[^\]]*\]/g, ' ')
    .replace(/<\/?[a-z][^>]*>/gi, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// A short, honest "this is already there" answer is a real answer, not a failure (the retry prompt asks for it in exactly this form).
const ALREADY_THERE = /^\s*already (?:on the page|there|in place|present)\b|\b(?:is|are) already (?:on the page|there|in place|present|included)\b/i

/** The model's own words when they are an honest explanation, else null (the caller then shows its generic message). */
export function explainableNoChange(raw: string): string | null {
  const t = prose(raw)
  if (t.length >= 12 && t.length <= 1800 && ALREADY_THERE.test(t)) return t
  if (t.length < 60 || t.length > 1800) return null
  if (COMPLETION_CLAIM.test(t)) return null
  return t
}
