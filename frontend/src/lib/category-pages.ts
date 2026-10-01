export type CategoryPageConfig = {
  key: "bouncy-castle" | "soft-play" | "garden-games" | "fun-food" | "obstacle-course-slides";
  name: string;
  slug: string;
  title: string;
  shortDescription: string;
  seoDescription: string;
  keywords: string[];
};

export const CATEGORY_PAGES: CategoryPageConfig[] = [
  {
    key: "bouncy-castle",
    name: "Bouncy Castle",
    slug: "bouncy-castle-hire",
    title: "Bouncy Castle Hire",
    shortDescription:
      "Classic inflatables for birthdays, school events, and community parties.",
    seoDescription:
      "Book safe, premium bouncy castle hire for birthdays and events. Explore top inflatables, transparent pricing, and fast delivery.",
    keywords: [
      "bouncy castle hire",
      "inflatable castle rental",
      "party inflatables",
    ],
  },
  {
    key: "soft-play",
    name: "Soft Play",
    slug: "soft-play-hire",
    title: "Soft Play Hire",
    shortDescription:
      "Soft play packages designed for toddlers and younger children.",
    seoDescription:
      "Discover soft play hire packages for toddlers and young children. Build a safe and fun indoor play area for your event.",
    keywords: ["soft play hire", "toddler party hire", "indoor play hire"],
  },
  {
    key: "garden-games",
    name: "Garden Games",
    slug: "garden-games-hire",
    title: "Garden Games Hire",
    shortDescription:
      "Interactive outdoor games that keep guests engaged for hours.",
    seoDescription:
      "Browse garden games hire for weddings, birthdays, and family events. Add interactive fun with giant outdoor games.",
    keywords: ["garden games hire", "outdoor party games", "event games hire"],
  },
  {
    key: "fun-food",
    name: "Fun Food",
    slug: "fun-food-hire",
    title: "Fun Food Hire",
    shortDescription:
      "Popular fun-food machines and snack stations for unforgettable events.",
    seoDescription:
      "Book fun food hire including popular snack machines and event treats. Ideal for birthdays, school fairs, and celebrations.",
    keywords: ["fun food hire", "party food machine hire", "event snacks"],
  },
  {
    key: "obstacle-course-slides",
    name: "Obstacle Course/Slides",
    slug: "obstacle-course-slides-hire",
    title: "Obstacle Course/Slides Hire",
    shortDescription:
      "High-energy obstacle courses and inflatable slides for larger events.",
    seoDescription:
      "Explore obstacle course and inflatable slide hire for high-energy parties and events. Great for kids, teens, and group activities.",
    keywords: [
      "obstacle course hire",
      "inflatable slide hire",
      "assault course inflatables",
    ],
  },
];

export const CATEGORY_PAGE_BY_SLUG = new Map(
  CATEGORY_PAGES.map((item) => [item.slug, item]),
);

const normalizeToken = (value: string) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/-hire$/i, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\bcastles\b/g, "castle")
    .replace(/\bgames\b/g, "game");

export const findCategoryPageByLabel = (label: string) => {
  const normalized = normalizeToken(label);
  return CATEGORY_PAGES.find(
    (item) =>
      normalizeToken(item.name) === normalized ||
      normalizeToken(item.slug) === normalized,
  );
};
