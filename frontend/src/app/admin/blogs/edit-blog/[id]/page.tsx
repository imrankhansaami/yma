import EditBlogPageClient from "@/components/admin/blogs/EditBlogPageClient";
import type { Metadata } from "next";
import { joinCanonicalPath } from "@/lib/canonical";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "Edit Blog | Admin",
    description: "Edit and update blog posts for the YMA website.",
    alternates: {
      canonical: joinCanonicalPath(["admin", "blogs", "edit-blog", id]),
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export const dynamic = "force-dynamic";

export default function EditBlogPage() {
  return <EditBlogPageClient />;
}
