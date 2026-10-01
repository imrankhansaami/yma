import Whatsapp from "@/assets/icons/whatsapp.svg";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

const WhatsappBtn = ({
  onClick,
  className,
  textClassName,
}: {
  onClick?: () => void;
  className?: string;
  textClassName?: string;
}) => {
  return (
    <Link
      href="https://wa.me/message/VPVI6VXZP6KSJ1"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp Chat"
      onClick={onClick}
      className={cn(
        "w-full sm:w-auto h-10 sm:h-12 bg-brand-green-500 hover:bg-brand-green-600 text-white px-3 sm:px-4 rounded-full flex items-center justify-center gap-1.5 sm:gap-2 transition-colors border-[2px] border-white cursor-pointer font-londrina shadow-sm min-w-[140px] sm:min-w-[170px] text-sm sm:text-base",
        className,
      )}
    >
      <Image src={Whatsapp} alt="whatsapp icon" className="h-5 w-5" />
      <span className={cn("font-semibold text-nowrap", textClassName)}>
        WhatsApp Chat
      </span>
    </Link>
  );
};

export default WhatsappBtn;
