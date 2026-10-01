import type { MetadataRoute } from "next";

async function fetchSeoSettings(): Promise<{ robotsTxtCustomRules?: string } | null> {
  try {
    const apiBase = process.env.NEXT_PUBLIC_SERVER_URI || "https://yma-website-backend.vercel.app";
    const res = await fetch(`${apiBase}/api/v1/seo-settings`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data?.settings ?? null;
  } catch {
    return null;
  }
}

function parseCustomRules(raw: string) {
  const rules: Array<{
    userAgent: string | string[];
    allow?: string | string[];
    disallow?: string | string[];
    crawlDelay?: number;
  }> = [];
  const blocks = raw.split(/\n\s*\n/).filter((b) => b.trim());

  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    let userAgent: string | undefined;
    const allow: string[] = [];
    const disallow: string[] = [];
    let crawlDelay: number | undefined;

    for (const line of lines) {
      const lower = line.toLowerCase();
      if (lower.startsWith("user-agent:")) {
        userAgent = line.slice("user-agent:".length).trim();
      } else if (lower.startsWith("allow:")) {
        allow.push(line.slice("allow:".length).trim());
      } else if (lower.startsWith("disallow:")) {
        disallow.push(line.slice("disallow:".length).trim());
      } else if (lower.startsWith("crawl-delay:")) {
        const val = parseFloat(line.slice("crawl-delay:".length).trim());
        if (!isNaN(val)) crawlDelay = val;
      }
    }

    if (userAgent) {
      const rule: (typeof rules)[number] = { userAgent };
      if (allow.length) rule.allow = allow.length === 1 ? allow[0] : allow;
      if (disallow.length) rule.disallow = disallow.length === 1 ? disallow[0] : disallow;
      if (crawlDelay !== undefined) rule.crawlDelay = crawlDelay;
      rules.push(rule);
    }
  }

  return rules;
}

export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = "https://ymabouncycastles.uk";

  const defaultRules = [
    {
      userAgent: "*" as const,
      allow: "/",
      disallow: [
        "/admin",
        "/admin/*",
        "/profile",
        "/profile/*",
        "/cart",
        "/checkout",
        "/checkout/*",
        "/login",
        "/signup",
        "/signup/*",
        "/forgot-password",
        "/forgot-password/*",
        "/api/*",
        "/*.json",
        "*_utm*",
        "*?utm_*",
      ],
      crawlDelay: 0.5,
    },
    {
      userAgent: "AhrefsBot" as const,
      crawlDelay: 10,
    },
    {
      userAgent: "SemrushBot" as const,
      crawlDelay: 10,
    },
    {
      userAgent: "MJ12bot" as const,
      crawlDelay: 10,
    },
  ];

  let customRules: ReturnType<typeof parseCustomRules> = [];
  const settings = await fetchSeoSettings();
  if (settings?.robotsTxtCustomRules) {
    customRules = parseCustomRules(settings.robotsTxtCustomRules);
  }

  return {
    rules: [...defaultRules, ...customRules],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
