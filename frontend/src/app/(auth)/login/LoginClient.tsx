"use client";

import api from "@/api/api";
import GoogleLogo from "@/assets/google-logo.png";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { loginSchema, type LoginSchema } from "@/lib/validation/login-schema";
import { setAuthFromLoginResponse } from "@/store/useAuthStore";
import { useAuthStore } from "@/store/useAuthStore";
import type { LoginResponse } from "@/types/auth";
import { yupResolver } from "@hookform/resolvers/yup";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export default function LoginClient() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginSchema>({
    resolver: yupResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: false },
    mode: "onTouched",
  });

  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const setOAuthAccessToken = useAuthStore((state) => state.setOAuthAccessToken);

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

  const onSubmit = async (values: LoginSchema) => {
    try {
      const res = await api.post("/auth/login", values, {
        withCredentials: true,
      });

      if (res.status >= 200 && res.status < 300) {
        const raw = res.data as LoginResponse & { data?: LoginResponse["data"]; user?: LoginResponse["data"]["user"] };
        const loginResponse: LoginResponse = {
          status: raw?.status ?? res.status,
          message: raw?.message ?? "Logged in successfully",
          data: raw?.data ?? {
            user: (raw as any)?.user,
            tokens: (raw as any)?.tokens,
          },
        };
        if (!loginResponse.data?.user) {
          throw new Error("Login succeeded but the server did not return a user profile.");
        }
        setAuthFromLoginResponse(loginResponse);

        toast.success("Welcome back!");
        const role = loginResponse?.data?.user?.role;
        if (role === "admin" || role === "superadmin") {
          router.push("/admin");
          return;
        }
        router.push("/");
        return;
      }

      setError("root.serverError", { message: "Login failed" });
      toast.error("Login failed");
    } catch (e: any) {
      const message =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Invalid credentials";
      setError("root.serverError", { message });
      toast.error(message);
    }
  };

  const googleUrl = "/api/v1/auth/google";

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

      {/* Password */}
      <div className="space-y-1.5">
        <Label
          htmlFor="password"
          className="text-sm text-ink-900 dark:text-foreground"
        >
          Password
        </Label>

        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            autoComplete="current-password"
            className="pr-10"
            {...register("password")}
          />
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((s) => !s)}
            className="absolute inset-y-0 right-3 inline-flex items-center justify-center"
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5 text-gray-500" />
            ) : (
              <Eye className="h-5 w-5 text-gray-500" />
            )}
          </button>
        </div>

        {errors.root?.serverError && (
          <p className="text-sm text-red-600">
            {errors.root.serverError.message}
          </p>
        )}
        {errors.password && (
          <p className="text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between">
        <label className="inline-flex items-center gap-2 text-sm text-ink-900 dark:text-foreground">
          <Checkbox id="remember" {...register("remember")} />
          <span>Remember for 30 days</span>
        </label>

        <Link
          href="/forgot-password"
          className="text-sm font-medium text-orange-500-brand hover:underline"
        >
          Forgot password?
        </Link>
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
        {isSubmitting ? "Logging in..." : "Log in"}
      </Button>

      {/* Google */}
      <Button
        type="button"
        variant="outline"
        className="h-11 w-full rounded-full text-base cursor-pointer"
        onClick={() => (window.location.href = googleUrl)}
      >
        <span className="inline-flex">
          <Image src={GoogleLogo} alt="google logo" width={30} height={30} />
        </span>
        Sign in with Google
      </Button>
    </form>
  );
}
