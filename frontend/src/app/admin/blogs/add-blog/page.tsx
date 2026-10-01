import AddBlogPageClient from "@/components/admin/blogs/AddBlogPageClient";

export const metadata = {
  title: "Create Blog | Admin",
  description: "Draft and publish blog posts for the YMA website.",
  alternates: {
    canonical: "/admin/blogs/add-blog",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

export default function AddBlogPage() {
  return <AddBlogPageClient />;
}
