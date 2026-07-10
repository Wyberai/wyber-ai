import { resolveRegion, isOwnerPreview } from "@/lib/region";
import { OwnerRegionSwitcher } from "@/components/shared/OwnerRegionSwitcher";
import { JourneyClient } from "./JourneyClient";

// Same regional contract as /pricing: rendered per request from the visitor's
// IP country — never cached, so an India-rendered page can NEVER be served to
// a US visitor (or vice versa). India (IP=IN) → ₹/UPI storefront on first
// paint; everyone else → USD. The owner switcher only renders on a browser
// unlocked via /api/owner-preview.
export const dynamic = "force-dynamic";

export default async function SpaceJourneyPage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string }>;
}) {
  let currency = await resolveRegion();

  // Dev-only preview: ?region=IN|US on localhost, where the IP-country header
  // doesn't exist. Compiled out of production — the public storefront stays
  // strictly IP-decided there.
  if (process.env.NODE_ENV !== "production") {
    const { region } = await searchParams;
    if (region === "IN") currency = "INR";
    if (region === "US") currency = "USD";
  }

  const owner = await isOwnerPreview();
  return (
    <>
      <JourneyClient currency={currency} />
      {owner && <OwnerRegionSwitcher current={currency} />}
    </>
  );
}
