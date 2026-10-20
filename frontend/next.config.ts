import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "react-icons",
      "recharts",
      "@radix-ui/react-icons",
    ],
  },
  async rewrites() {
    // API traffic is handled by src/app/api/v1/[...path]/route.ts, which
    // forwards server-side to NEXT_PUBLIC_SERVER_URI.
    return [];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "example.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "example.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.figma.com",
        port: "",
        pathname: "/api/mcp/asset/**",
      },
    ],
    formats: ["image/webp", "image/avif"],
  },
  headers: async () => [
    {
      source: "/:path*",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=3600, must-revalidate",
        },
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains",
        },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=()",
        },
        {
          key: "X-Content-Type-Options",
          value: "nosniff",
        },
        {
          key: "X-Frame-Options",
          value: "SAMEORIGIN",
        },
        {
          key: "X-XSS-Protection",
          value: "0",
        },
        {
          key: "Referrer-Policy",
          value: "strict-origin-when-cross-origin",
        },
      ],
    },
    {
      // Authenticated pages must never be stored by a shared cache.
      source: "/admin/:path*",
      headers: [
        {
          key: "Cache-Control",
          value: "private, no-store, max-age=0",
        },
      ],
    },
    {
      source: "/admin",
      headers: [
        {
          key: "Cache-Control",
          value: "private, no-store, max-age=0",
        },
      ],
    },
    {
      source: "/profile/:path*",
      headers: [
        {
          key: "Cache-Control",
          value: "private, no-store, max-age=0",
        },
      ],
    },
    {
      source: "/profile",
      headers: [
        {
          key: "Cache-Control",
          value: "private, no-store, max-age=0",
        },
      ],
    },
    {
      source: "/cart",
      headers: [
        {
          key: "Cache-Control",
          value: "private, no-store, max-age=0",
        },
      ],
    },
    {
      source: "/checkout/:path*",
      headers: [
        {
          key: "Cache-Control",
          value: "private, no-store, max-age=0",
        },
      ],
    },
    {
      source: "/checkout",
      headers: [
        {
          key: "Cache-Control",
          value: "private, no-store, max-age=0",
        },
      ],
    },
    {
      source: "/api/:path*",
      headers: [
        {
          key: "Cache-Control",
          value: "no-cache, no-store, must-revalidate",
        },
      ],
    },
    {
      source: "/images/:path*",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=31536000, immutable",
        },
      ],
    },
    {
      source: "/_next/static/:path*",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=31536000, immutable",
        },
      ],
    },
  ],
};

export default nextConfig;
