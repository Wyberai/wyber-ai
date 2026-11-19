/** Claims a model likes to invent. The owner never gave them, so copy that contains them is rejected and rewritten. */
export const BANNED_CLAIMS =
  /(\bbest\b|#1|\bnumber one\b|\bleading\b|\bworld-class\b|\bpremier\b|award[- ]winning|\bcertified\b|\bguarantee[sd]?\b|\bmoney-back\b|\btrusted by\b|\b\d{2,}\+?\s*(years|clients|customers|patients|students|happy|projects)\b|\bover \d+\b|!)/i

/** Words and digits that must never reach an image prompt. An image model paints any lettering it is given. */
export const IMAGE_BRIEF_BANNED = /(\d|\bwhatsapp\b|\bphone\b|\bcall\b|\bbook(?:ing)?\b|\benquir\w*\b|\bsigns?\b|\bsignage\b|\bposters?\b|\blogos?\b|\bbanners?\b|\bbrand name\b|\bwatermark\b|\bcaption\b|\bwritten\b|\bwords?\b|\btext\b)/i
