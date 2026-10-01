"use client";

import api from "@/api/api";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const inputClass =
  "h-11 w-full border-0 bg-transparent px-2 text-[14px] text-brand-ink-900 placeholder:text-brand-gray-400 outline-none shadow-none focus:ring-0 focus-visible:ring-0 focus-visible:border-transparent";

const fieldWrap =
  "rounded-2xl border-2 border-white/70 bg-brand-orange-50/50 p-3 backdrop-blur-sm";

export default function ContactFormClient() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("uk");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getPhoneNumber = () => {
    if (!phoneNumber) return "";
    if (phoneNumber.trim().startsWith("+")) return phoneNumber.trim();

    const prefix =
      countryCode === "us" ? "+1" : countryCode === "eu" ? "+33" : "+44";
    return `${prefix}${phoneNumber.trim()}`;
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      await api.post("/contact", {
        firstName,
        lastName,
        email,
        phoneNumber: getPhoneNumber(),
        message,
      });
      toast.success("Thanks! Your message has been sent.");
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhoneNumber("");
      setMessage("");
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Unable to send your message right now";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="flex w-full flex-col gap-4" onSubmit={onSubmit} noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-[13px] font-semibold text-brand-ink-900">
            First Name <span className="text-brand-orange-500">*</span>
          </label>
          <div className={fieldWrap}>
            <Input
              placeholder="Enter your name"
              className={inputClass}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-[13px] font-semibold text-brand-ink-900">
            Last Name <span className="text-brand-orange-500">*</span>
          </label>
          <div className={fieldWrap}>
            <Input
              placeholder="Enter your name"
              className={inputClass}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-[13px] font-semibold text-brand-ink-900">
          Your Email <span className="text-brand-orange-500">*</span>
        </label>
        <div className={fieldWrap}>
          <Input
            placeholder="Enter your email"
            type="email"
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-[13px] font-semibold text-brand-ink-900">
          Phone Number <span className="text-brand-orange-500">*</span>
        </label>
        <div className={fieldWrap}>
          <div className="flex h-10 w-full items-center">
            <Select value={countryCode} onValueChange={setCountryCode}>
              <SelectTrigger className="h-full w-[92px] shrink-0 rounded-l-2xl border-0 bg-white/60 pl-2 pr-2 text-left text-[14px] font-semibold text-brand-ink-900 shadow-none focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:border-transparent">
                <SelectValue placeholder="UK" />
              </SelectTrigger>
              <SelectContent align="start" className="w-[140px]">
                <SelectItem value="uk">UK</SelectItem>
                <SelectItem value="us">US</SelectItem>
                <SelectItem value="eu">EU</SelectItem>
              </SelectContent>
            </Select>

            <input
              type="tel"
              placeholder="Enter your phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="h-full flex-1 border-0 bg-transparent px-3 text-[14px] text-brand-ink-900 placeholder:text-brand-gray-400 outline-none shadow-none focus:ring-0 focus-visible:ring-0 focus-visible:border-transparent"
              required
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-[13px] font-semibold text-brand-ink-900">
          Your Message <span className="text-brand-orange-500">*</span>
        </label>
        <div className={cn(fieldWrap, "py-2")}>
          <Textarea
            placeholder="Enter your message"
            className={cn(inputClass, "h-[130px] resize-none py-2")}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="mt-5">
        <button
          type="submit"
          disabled={isSubmitting}
          className="
    w-full sm:w-auto h-10 md:h-12
    rounded-full
    bg-brand-orange-400 hover:bg-brand-orange-500
    border-[2px] border-white
    text-white font-semibold
    inline-flex items-center justify-center gap-2
    transition-colors
    cursor-pointer
    font-londrina
    shadow-sm
    min-w-[170px]
    px-4
  "
        >
          {isSubmitting ? "Sending..." : "Send Message"}
          <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
        </button>
      </div>
    </form>
  );
}
