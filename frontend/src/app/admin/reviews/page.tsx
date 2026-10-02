import ReviewsPageClient from "@/components/admin/reviews/ReviewsPageClient";

export const metadata = {
  title: "Reviews | Admin",
  description: "Moderate customer reviews and product ratings.",
  alternates: {
    canonical: "/admin/reviews",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

const ReviewsPage = () => {
  return <ReviewsPageClient />;
};

export default ReviewsPage;