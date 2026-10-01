"use client";

import api from "@/api/api";
import GoogleLogo from "@/assets/google-logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { yupResolver } from "@hookform/resolvers/yup";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as yup from "yup";

const signupSchema = yup
  .object({
    name: yup
      .string()
      .min(2, "Name must be at least 2 characters")
      .required("Name is required"),
    email: yup
      .string()
      .email("Enter a valid email")
      .required("Email is required"),
  })
  .required();

type SignupSchema = yup.InferType<typeof signupSchema>;

export default function SignupClient() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<SignupSchema>({
    resolver: yupResolver(signupSchema),
    defaultValues: { name: "", email: "" },
    mode: "onTouched",
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const setOAuthAccessToken = useAuthStore((state) => state.setOAuthAccessToken);
  const googleUrl = "/api/v1/auth/google";

  useEffect(() => {
    const oauthStatus = searchParams.get("oauth");
    if (!oauthStatus) return;

    if (oauthStatus === "error") {
      const code = searchParams.get("code");
      const message =
        code === "oauth_password_user"
          ? "This email is already registered with a password. Please sign in using email and password."
          : "Google sign-in failed. Please try again.";
      toast.error(message);
      return;
    }

    if (oauthStatus === "success") {
      (async () => {
        const oauthAccessToken = searchParams.get("accessToken");
        if (oauthAccessToken) {
          setOAuthAccessToken(oauthAccessToken);
        }
        const ok = await checkAuth();
        if (!ok) {
          toast.error("Google sign-in failed. Please try again.");
          return;
        }
        const user = useAuthStore.getState().user;
        toast.success("Signed in with Google!");
        if (user?.role === "admin" || user?.role === "superadmin") {
          router.push("/admin");
          return;
        }
        router.push("/");
      })();
    }
  }, [checkAuth, router, searchParams, setOAuthAccessToken]);

  const onSubmit = async (values: SignupSchema) => {
    try {
      const res = await api.post("/auth/register-with-verification", values, {
        withCredentials: true,
      });

      if (res.status >= 200 && res.status < 300) {
        toast.success("Check your inbox to set a password.");
        router.push("/signup/success");
      } else {
        setError("email", { message: "Registration failed" });
        toast.error("Registration failed");
      }
    } catch (e: any) {
      const message =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Unable to register";
      setError("email", { message });
      toast.error(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Name */}
      <div className="space-y-1.5">
        <Label
          htmlFor="name"
          className="text-sm text-ink-900 dark:text-foreground"
        >
          Name
        </Label>
        <Input
          id="name"
          type="text"
          placeholder="Enter your name"
          autoComplete="name"
          {...register("name")}
        />
        {errors.name && (
          <p className="text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

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
        <p className="text-sm text-gray-500">
          A link will be sent to your email to set password.
        </p>
      </div>

      {/* Register */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className={cn(
          "mt-2 h-11 w-full rounded-full text-base font-medium",
          "bg-brand-orange-500 hover:bg-brand-orange-400 cursor-pointer text-white",
        )}
      >
        {isSubmitting ? "Submitting..." : "Register"}
      </Button>

      {/* Divider with OR */}
      <div className="mt-2 flex items-center gap-3">
        <span className="h-px w-full bg-gray-200" />
        <span className="text-xs text-gray-500">OR</span>
        <span className="h-px w-full bg-gray-200" />
      </div>

      {/* Google */}
      <Button
        type="button"
        variant="outline"
        className="h-11 w-full rounded-full text-base mt-2 cursor-pointer"
        onClick={() => (window.location.href = googleUrl)}
      >
        <span className="mr-2 inline-flex">
          <Image src={GoogleLogo} alt="google logo" width={24} height={24} />
        </span>
        Sign in with Google
      </Button>
    </form>
  );
}
