import { permanentRedirect } from "next/navigation";

type SearchParams = Record<string, string | string[] | undefined>;

const slug = "bouncy-castle-hire";

export default async function LegacyCategoryRedirectPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      for (const v of value) {
        if (typeof v === "string" && v.trim()) query.append(key, v);
      }
    } else if (typeof value === "string" && value.trim()) {
      query.set(key, value);
    }
  }

  const destination = `/booking-catalog/${slug}${query.toString() ? `?${query.toString()}` : ""}`;
  permanentRedirect(destination);
}
