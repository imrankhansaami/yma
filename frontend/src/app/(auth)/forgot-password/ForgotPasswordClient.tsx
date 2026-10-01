"use client";

import api from "@/api/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { yupResolver } from "@hookform/resolvers/yup";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as yup from "yup";

const forgotSchema = yup
  .object({
    email: yup
      .string()
      .email("Enter a valid email")
      .required("Email is required"),
  })
  .required();

type ForgotSchema = yup.InferType<typeof forgotSchema>;

export default function ForgotPasswordClient() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<ForgotSchema>({
    resolver: yupResolver(forgotSchema),
    defaultValues: { email: "" },
    mode: "onTouched",
  });

  const router = useRouter();

  const onSubmit = async (values: ForgotSchema) => {
    try {
      const res = await api.post("/auth/forgot-password", values, {
        withCredentials: true,
      });

      if (res.status >= 200 && res.status < 300) {
        toast.success("Check your inbox for the reset link.");
        router.push("/forgot-password/success");
      } else {
        setError("email", { message: "Request failed" });
        toast.error("Request failed");
      }
    } catch (e: any) {
      const message =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Unable to process request";
      setError("email", { message });
      toast.error(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Email */}
      <div className="space-y-1.5">
        <Label
          htmlFor="email"
          className="text-sm text-ink-900 dark:text-foreground"
        >
          Email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          autoComplete="email"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className={cn(
          "mt-2 h-11 w-full rounded-full text-base font-medium",
          "bg-brand-orange-500 hover:bg-brand-orange-400 cursor-pointer text-white",
        )}
      >
        {isSubmitting ? "Sending..." : "Reset Password"}
      </Button>
    </form>
  );
}
