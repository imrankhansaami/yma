import Image from "next/image";
import Link from "next/link";

import EmptyIcon from "@/assets/icons/empty_icon.svg";
import { Button } from "@/components/ui/button";

type BlogsEmptyStateProps = {
  ctaHref?: string;
};

export function BlogsEmptyState({
  ctaHref = "/admin/blogs/add-blog",
}: BlogsEmptyStateProps) {
  return (
    <div className="w-full rounded-2xl border border-brand-gray-210 bg-white px-6 py-16 text-center shadow-[0px_1px_2px_var(--alpha-ink-900-5)] h-screen flex items-center justify-center">
      <div className="mx-auto flex max-w-[640px] flex-col items-center gap-5">
        <Image
          src={EmptyIcon}
          alt="Empty blogs"
          width={184}
          height={150}
          priority
        />

        <div className="space-y-2">
          <h2 className="text-[20px] font-semibold text-brand-black-950">
            Blog Management
          </h2>
          <p className="text-[14px] text-brand-gray-650">
            Create, manage, and publish blogs for YMA Bouncy Castle website.
          </p>
        </div>

        <Link href={ctaHref} className="mt-1 inline-block">
          <Button className="h-9 rounded-md bg-brand-orange-500 px-4 text-[13px] font-semibold text-white shadow-none hover:bg-brand-orange-500/90">
            +&nbsp; Create Blog
          </Button>
        </Link>
      </div>
    </div>
  );
}
