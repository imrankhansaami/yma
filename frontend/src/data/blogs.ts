import placeholder from "@/assets/images/bg1.png";
import { StaticImageData } from "next/image";

export type BlogStatus = "Published" | "Draft";

export type BlogContentBlock = {
  type: "paragraph" | "heading" | "subheading" | "list";
  content: string | string[];
};

export type Blog = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  status: BlogStatus;
  createdAt: string;
  image?: StaticImageData | string;
  author?: {
    name: string;
    avatar?: string;
  };
  featuredImage?: StaticImageData | string;
  content?: BlogContentBlock[];
};

const sharedDescription =
  "This is a sample blog body for YMA Bouncy Castle. Update this content to match the published article and keep formatting consistent across the site.";

export const BLOGS: Blog[] = [
  {
    id: "2305",
    title: "Bouncing Bonanza: A Guide to Safe Castle Fun",
    subtitle: "Ensure every bounce is both fun and safe for kids.",
    description: sharedDescription,
    status: "Published",
    createdAt: "Dec 15, 2023",
    image: placeholder,
    author: {
      name: "Lando Norris",
    },
    featuredImage: placeholder,
    content: [
      {
        type: "paragraph",
        content:
          "Once upon a time, in a far-off land, there was a very lazy king who spent all day lounging on his throne. One day, his advisors came to him with a problem: the kingdom was running out of money.",
      },
      {
        type: "heading",
        content: "The King's Plan",
      },
      {
        type: "paragraph",
        content:
          "The king thought long and hard, and finally came up with a brilliant plan: he would tax the jokes in the kingdom.",
      },
      {
        type: "subheading",
        content: "The Joke Tax",
      },
      {
        type: "paragraph",
        content:
          "The king's subjects were not amused. They grumbled and complained, but the king was firm:",
      },
      {
        type: "list",
        content: [
          "1st level of puns: 5 gold coins",
          "2nd level of jokes: 10 gold coins",
          "3rd level of one-liners : 20 gold coins",
        ],
      },
      {
        type: "paragraph",
        content:
          "As a result, people stopped telling jokes, and the kingdom fell into a gloom. But there was one person who refused to let the king's foolishness get him down: a court jester named Jokester.",
      },
      {
        type: "subheading",
        content: "Jokester's Revolt",
      },
      {
        type: "paragraph",
        content:
          "Jokester began sneaking into the castle in the middle of the night and leaving jokes all over the place: under the king's pillow, in his soup, even in the royal toilet. The king was furious, but he couldn't seem to stop Jokester.",
      },
      {
        type: "paragraph",
        content:
          "And then, one day, the people of the kingdom discovered that the jokes left by Jokester were so funny that they couldn't help but laugh. And once they started laughing, they couldn't stop.",
      },
      {
        type: "subheading",
        content: "The People's Rebellion",
      },
      {
        type: "paragraph",
        content:
          "The people of the kingdom, feeling uplifted by the laughter, started to tell jokes and puns again, and soon the entire kingdom was in on the joke.",
      },
      {
        type: "paragraph",
        content:
          "The king, seeing how much happier his subjects were, realized the error of his ways and repealed the joke tax. Jokester was declared a hero, and the kingdom lived happily ever after.",
      },
      {
        type: "paragraph",
        content:
          "The moral of the story is: never underestimate the power of a good laugh and always be careful of bad ideas.",
      },
    ],
  },
  {
    id: "9782",
    title: "The Ultimate Guide to Bouncy Castle Rentals",
    subtitle: "Everything you need to know before booking.",
    description: sharedDescription,
    status: "Draft",
    createdAt: "June 1, 2024",
    image: placeholder,
    author: { name: "Lando Norris" },
    featuredImage: placeholder,
  },
  {
    id: "1145",
    title: "Top 5 Bouncy Castle Themes for Your Next Party",
    subtitle: "Themes that keep kids entertained for hours.",
    description: sharedDescription,
    status: "Published",
    createdAt: "Nov 1, 2023",
    image: placeholder,
    author: { name: "Lando Norris" },
    featuredImage: placeholder,
  },
  {
    id: "8643",
    title: "How to Choose the Right Bouncy Castle for Your Event",
    subtitle: "Match the inflatable to your space and crowd size.",
    description: sharedDescription,
    status: "Published",
    createdAt: "Oct 18, 2023",
    image: placeholder,
    author: { name: "Lando Norris" },
    featuredImage: placeholder,
  },
  {
    id: "3490",
    title: "Bouncy Castle Safety Tips: A Parent’s Guide",
    subtitle: "Simple rules to keep everyone safe.",
    description: sharedDescription,
    status: "Draft",
    createdAt: "Sept 7, 2023",
    image: placeholder,
    author: { name: "Lando Norris" },
    featuredImage: placeholder,
  },
  {
    id: "5278",
    title: "The History of Bouncy Castles: From Moonwalks to Modern Fun",
    subtitle: "A quick history lesson on inflatables.",
    description: sharedDescription,
    status: "Draft",
    createdAt: "Jan 28, 2024",
    image: placeholder,
    author: { name: "Lando Norris" },
    featuredImage: placeholder,
  },
  {
    id: "7890",
    title: "Bouncy Castle Maintenance: Keeping Your Inflatable in Top Shape",
    subtitle: "Care tips to extend product life.",
    description: sharedDescription,
    status: "Published",
    createdAt: "April 14, 2024",
    image: placeholder,
    author: { name: "Lando Norris" },
    featuredImage: placeholder,
  },
  {
    id: "2357",
    title: "Creative Bouncy Castle Games for Kids",
    subtitle: "Game ideas to make parties memorable.",
    description: sharedDescription,
    status: "Draft",
    createdAt: "Feb 12, 2024",
    image: placeholder,
    author: { name: "Lando Norris" },
    featuredImage: placeholder,
  },
  {
    id: "9876",
    title: "Bouncy Castles for Adults: Unleash Your Inner Child",
    subtitle: "Party-ready castles for grown-ups too.",
    description: sharedDescription,
    status: "Published",
    createdAt: "March 9, 2024",
    image: placeholder,
    author: { name: "Lando Norris" },
    featuredImage: placeholder,
  },
  {
    id: "4567",
    title: "The Benefits of Bouncy Castles for Child Development",
    subtitle: "How play supports learning and growth.",
    description: sharedDescription,
    status: "Published",
    createdAt: "May 22, 2024",
    image: placeholder,
    author: { name: "Lando Norris" },
    featuredImage: placeholder,
  },
  {
    id: "6789",
    title: "Planning an Epic Bouncy Castle Party: Step-by-Step Guide",
    subtitle: "From booking to setup: make your event unforgettable.",
    description: sharedDescription,
    status: "Published",
    createdAt: "July 10, 2024",
    image: placeholder,
    author: { name: "Lando Norris" },
    featuredImage: placeholder,
  },
  {
    id: "1234",
    title: "Bouncy Castle Trends: What's Hot in 2024",
    subtitle: "Discover the latest inflatable designs and themes.",
    description: sharedDescription,
    status: "Published",
    createdAt: "Aug 5, 2024",
    image: placeholder,
    author: { name: "Lando Norris" },
    featuredImage: placeholder,
  },
];

export function getBlogById(id: string) {
  return BLOGS.find((blog) => blog.id === id);
}
