import BlogsPageClient from "@/components/admin/blogs/BlogsPageClient";

export const metadata = {
  title: "Blogs | Admin",
  description: "Manage and publish blog content for the YMA website.",
  alternates: {
    canonical: "/admin/blogs",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

const BlogsPage = () => {
  return <BlogsPageClient />;
};

export default BlogsPage;
