// The one-line message shown after the launch-ready source check, for every project type. Plain words, no counts, no file names.
// "Missing" is the list of what the check did not find. The caveat on the clean case is deliberate and stays: the check reads the
// code, it does not run the product, and the message must never say or imply that it does.

export function readyMessage(missing: string[], notRunClause: string): string {
  if (missing.length === 0) return `Nothing missing from our launch list. Checked in the code only; we have not ${notRunClause}.`
  return `Still missing: ${missing.join('; ')}. Adding it now.`
}
