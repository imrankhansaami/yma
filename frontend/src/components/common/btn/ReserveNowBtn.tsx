import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

const ReserveNowBtn = ({
  onClick,
  className,
  textClassName,
  href,
}: {
  onClick?: () => void;
  className?: string;
  textClassName?: string;
  href?: string;
}) => {
  return (
    <Link
      href={href ?? "/booking-catalog"}
      onClick={onClick}
      aria-label="Reserve Now"
      className={cn(
        "h-10 sm:h-12 bg-brand-orange-400 hover:bg-brand-orange-500 border-[2px] border-white text-white px-3 sm:px-4 rounded-full inline-flex items-center justify-center gap-1.5 sm:gap-2 transition-colors cursor-pointer font-londrina shadow-sm min-w-[140px] sm:min-w-[170px] text-sm sm:text-base",
        className,
      )}
    >
      <span className={cn("font-semibold", textClassName)}>Reserve Now</span>
      <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
    </Link>
  );
};

export default ReserveNowBtn;
