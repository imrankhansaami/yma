import Script from "next/script";

export interface OrganizationJsonLdProps {
  name?: string;
  url?: string;
  logo?: string;
  contactPoint?: {
    telephone: string;
    contactType: string;
    areaServed?: string[];
    availableLanguage?: string[];
  };
  sameAs?: string[];
}

export function OrganizationJsonLd({
  name = "YMA Bouncy Castles",
  url = "https://ymabouncycastles.uk",
  logo = "https://ymabouncycastles.uk/logo.png",
  contactPoint = {
    telephone: "+44-7951-431111",
    contactType: "customer service",
    areaServed: ["GB"],
    availableLanguage: ["English"],
  },
  sameAs = [
    "https://www.facebook.com/ymabouncycastles",
    "https://www.instagram.com/ymabouncycastles",
    "https://www.twitter.com/YMABouncyCastles",
    "https://www.youtube.com/@ymabouncycastles",
  ],
}: OrganizationJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url,
    logo,
    contactPoint: {
      "@type": "ContactPoint",
      ...contactPoint,
    },
    sameAs,
  };

  return (
    <Script
      id="organization-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export interface LocalBusinessJsonLdProps {
  name?: string;
  description?: string;
  url?: string;
  telephone?: string;
  email?: string;
  address?: {
    streetAddress?: string;
    addressLocality: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry: string;
  };
  geo?: {
    latitude: number;
    longitude: number;
  };
  openingHours?: string[];
  priceRange?: string;
  areaServed?: string[];
}

export function LocalBusinessJsonLd({
  name = "YMA Bouncy Castles",
  description = "Premium bouncy castle hire for parties and events in London, Essex, Enfield, Birmingham & Coventry.",
  url = "https://ymabouncycastles.uk",
  telephone = "+44-7951-431111",
  email = "info@ymabouncycastles.uk",
  address = {
    addressLocality: "London",
    addressCountry: "GB",
  },
  openingHours = ["Mo-Su 08:00-19:00"],
  priceRange = "££",
  areaServed = ["London", "Essex", "Enfield", "Birmingham", "Coventry"],
}: LocalBusinessJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": url,
    name,
    description,
    url,
    telephone,
    email,
    address: {
      "@type": "PostalAddress",
      ...address,
    },
    openingHoursSpecification: openingHours.map((hours) => {
      const [days, time] = hours.split(" ");
      const [open, close] = time?.split("-") ?? ["08:00", "19:00"];
      return {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: days,
        opens: open,
        closes: close,
      };
    }),
    priceRange,
    areaServed: areaServed.map((area) => ({
      "@type": "City",
      name: area,
    })),
  };

  return (
    <Script
      id="local-business-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export interface ProductJsonLdProps {
  name: string;
  description: string;
  image: string | string[];
  sku?: string;
  brand?: string;
  price: number;
  priceCurrency?: string;
  availability?: "InStock" | "OutOfStock" | "PreOrder";
  url?: string;
  ratingValue?: number;
  ratingCount?: number;
}

export function ProductJsonLd({
  name,
  description,
  image,
  sku,
  brand = "YMA Bouncy Castles",
  price,
  priceCurrency = "GBP",
  availability = "InStock",
  url,
  ratingValue,
  ratingCount,
}: ProductJsonLdProps) {
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    image: Array.isArray(image) ? image : [image],
    brand: {
      "@type": "Brand",
      name: brand,
    },
    offers: {
      "@type": "Offer",
      price,
      priceCurrency,
      availability: `https://schema.org/${availability}`,
      url,
    },
  };

  if (sku) {
    jsonLd.sku = sku;
  }

  if (ratingValue && ratingCount && ratingCount > 0) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue,
      reviewCount: ratingCount,
    };
  }

  return (
    <Script
      id="product-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export interface BreadcrumbJsonLdProps {
  items: {
    name: string;
    url: string;
  }[];
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <Script
      id="breadcrumb-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export interface ItemListJsonLdProps {
  name: string;
  items: {
    name: string;
    url: string;
    image?: string;
  }[];
}

export function ItemListJsonLd({ name, items }: ItemListJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: item.url,
      item: {
        "@type": "Product",
        name: item.name,
        image: item.image,
      },
    })),
  };

  return (
    <Script
      id="itemlist-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export interface WebsiteJsonLdProps {
  name?: string;
  url?: string;
  description?: string;
}

export function WebsiteJsonLd({
  name = "YMA Bouncy Castles",
  url = "https://ymabouncycastles.uk",
  description = "Premium bouncy castle hire for parties and events in London, Essex, Enfield, Birmingham & Coventry.",
}: WebsiteJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url,
    description,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${url}/booking-catalog?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <Script
      id="website-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export interface FAQPageJsonLdProps {
  questions: {
    question: string;
    answer: string;
  }[];
}

export function FAQPageJsonLd({ questions }: FAQPageJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((qa) => ({
      "@type": "Question",
      name: qa.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: qa.answer,
      },
    })),
  };

  return (
    <Script
      id="faqpage-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export interface AggregateOfferJsonLdProps {
  productName: string;
  productDescription?: string;
  productImage?: string;
  lowestPrice: number;
  highestPrice: number;
  priceCurrency?: string;
  availability?: "InStock" | "OutOfStock" | "PreOrder";
  offerCount: number;
  locations?: string[];
}

export interface BlogPostingJsonLdProps {
  headline: string;
  description: string;
  image?: string;
  authorName?: string;
  datePublished?: string;
  dateModified?: string;
  url: string;
  publisherName?: string;
  publisherLogo?: string;
}

export function BlogPostingJsonLd({
  headline,
  description,
  image,
  authorName,
  datePublished,
  dateModified,
  url,
  publisherName = "YMA Bouncy Castles",
  publisherLogo = "https://ymabouncycastles.uk/logo.png",
}: BlogPostingJsonLdProps) {
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline,
    description,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    publisher: {
      "@type": "Organization",
      name: publisherName,
      logo: {
        "@type": "ImageObject",
        url: publisherLogo,
      },
    },
  };

  if (image) jsonLd.image = [image];
  if (authorName) {
    jsonLd.author = {
      "@type": "Person",
      name: authorName,
    };
  }
  if (datePublished) jsonLd.datePublished = datePublished;
  if (dateModified) jsonLd.dateModified = dateModified;

  return (
    <Script
      id="blogposting-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function AggregateOfferJsonLd({
  productName,
  productDescription,
  productImage,
  lowestPrice,
  highestPrice,
  priceCurrency = "GBP",
  availability = "InStock",
  offerCount,
  locations = ["London", "Essex", "Birmingham", "Coventry"],
}: AggregateOfferJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: productName,
    description: productDescription,
    image: productImage,
    aggregateOffer: {
      "@type": "AggregateOffer",
      priceCurrency,
      lowestPrice,
      highestPrice,
      offerCount,
      availability: `https://schema.org/${availability}`,
      areaServed: locations.map((location) => ({
        "@type": "City",
        name: location,
      })),
    },
  };

  return (
    <Script
      id="aggregateoffer-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
