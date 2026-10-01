"use client";

import { useAdminToast } from "@/components/ui/admin-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  getSeoSettings,
  resetSeoSettings,
  updateSeoSettings,
  type SeoSettingsInput,
} from "@/services/seo-settings.service";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

const defaultSeoValues: SeoSettingsInput = {
  siteName: "",
  defaultMetaTitle: "",
  defaultMetaDescription: "",
  defaultMetaKeywords: "",
  defaultCanonicalBaseUrl: "",
  defaultOpenGraphTitle: "",
  defaultOpenGraphDescription: "",
  defaultRobots: "index, follow",
  robotsTxtCustomRules: "",
};

const SeoSettingsPage = () => {
  const { notify } = useAdminToast();
  const [formValues, setFormValues] =
    useState<SeoSettingsInput>(defaultSeoValues);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-seo-settings"],
    queryFn: getSeoSettings,
  });

  const resolvedValues = useMemo(
    () => data ?? defaultSeoValues,
    [data],
  );

  useEffect(() => {
    setFormValues(resolvedValues);
  }, [resolvedValues]);

  const updateMutation = useMutation({
    mutationFn: updateSeoSettings,
    onSuccess: (settings) => {
      setFormValues(settings);
      notify({
        title: "SEO settings updated",
        message: "Global SEO defaults were saved successfully.",
      });
    },
    onError: () => {
      notify({
        title: "Update failed",
        message: "We could not save your changes. Please try again.",
        variant: "error",
      });
    },
  });

  const resetMutation = useMutation({
    mutationFn: resetSeoSettings,
    onSuccess: (settings) => {
      setFormValues(settings);
      notify({
        title: "SEO settings reset",
        message: "Defaults have been restored.",
      });
    },
    onError: () => {
      notify({
        title: "Reset failed",
        message: "We could not reset SEO settings. Please try again.",
        variant: "error",
      });
    },
  });

  const handleChange =
    (field: keyof SeoSettingsInput) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { value } = event.target;
      setFormValues((prev) => ({ ...prev, [field]: value }));
    };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateMutation.mutate(formValues);
  };

  const handleReset = () => {
    resetMutation.mutate();
  };

  const isSaving = updateMutation.isPending || resetMutation.isPending;

  return (
    <div className="min-h-screen space-y-6 py-6">
      <div className="space-y-1">
        <h1 className="text-base font-semibold text-brand-black-950">
          SEO Settings
        </h1>
        <p className="text-sm text-brand-gray-500">
          Configure global SEO defaults for every page across the site.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-[0px_1px_3px_0px_var(--alpha-slate-900-10),0px_1px_2px_0px_var(--alpha-slate-900-6)]">
        <div className="border-b border-slate-200 px-6 py-4">
          <p className="text-sm font-semibold text-brand-black-950">
            Global SEO Defaults
          </p>
          <p className="text-xs text-brand-gray-500">
            These values are used as fallbacks when a page doesn&apos;t define
            its own metadata.
          </p>
        </div>

        <form className="space-y-6 px-6 py-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-brand-black-950">
                Site Name
              </label>
              <Input
                value={formValues.siteName}
                onChange={handleChange("siteName")}
                placeholder="YMA Bouncy Castles"
                className="border-brand-gray-125 text-brand-black-950 placeholder:text-brand-gray-500 focus-visible:border-brand-orange-500 focus-visible:ring-brand-orange-500/20"
                disabled={isLoading || isSaving}
              />
              <p className="text-xs text-brand-gray-500">
                Used in default titles and structured metadata.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-brand-black-950">
                Default Canonical Base URL
              </label>
              <Input
                value={formValues.defaultCanonicalBaseUrl}
                onChange={handleChange("defaultCanonicalBaseUrl")}
                placeholder="https://ymabouncycastles.uk"
                className="border-brand-gray-125 text-brand-black-950 placeholder:text-brand-gray-500 focus-visible:border-brand-orange-500 focus-visible:ring-brand-orange-500/20"
                disabled={isLoading || isSaving}
              />
              <p className="text-xs text-brand-gray-500">
                The base URL used to build canonical links.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-brand-black-950">
                Default Meta Title
              </label>
              <Input
                value={formValues.defaultMetaTitle}
                onChange={handleChange("defaultMetaTitle")}
                placeholder="Premium Bouncy Castles & Party Rentals"
                className="border-brand-gray-125 text-brand-black-950 placeholder:text-brand-gray-500 focus-visible:border-brand-orange-500 focus-visible:ring-brand-orange-500/20"
                disabled={isLoading || isSaving}
              />
              <p className="text-xs text-brand-gray-500">
                Keep it under 60 characters for best results.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-brand-black-950">
                Default Meta Keywords
              </label>
              <Input
                value={formValues.defaultMetaKeywords}
                onChange={handleChange("defaultMetaKeywords")}
                placeholder="bouncy castle hire, party rentals, YMA"
                className="border-brand-gray-125 text-brand-black-950 placeholder:text-brand-gray-500 focus-visible:border-brand-orange-500 focus-visible:ring-brand-orange-500/20"
                disabled={isLoading || isSaving}
              />
              <p className="text-xs text-brand-gray-500">
                Comma-separated keywords for legacy support.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-brand-black-950">
              Default Meta Description
            </label>
            <Textarea
              value={formValues.defaultMetaDescription}
              onChange={handleChange("defaultMetaDescription")}
              placeholder="Make parties unforgettable with safe, clean, and fully insured bouncy castles delivered across your area."
              className="min-h-[110px] border-brand-gray-125 text-brand-black-950 placeholder:text-brand-gray-500 focus-visible:border-brand-orange-500 focus-visible:ring-brand-orange-500/20"
              disabled={isLoading || isSaving}
            />
            <p className="text-xs text-brand-gray-500">
              Aim for 140–160 characters to avoid truncation.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-brand-black-950">
                Default Open Graph Title
              </label>
              <Input
                value={formValues.defaultOpenGraphTitle}
                onChange={handleChange("defaultOpenGraphTitle")}
                placeholder="YMA Bouncy Castles"
                className="border-brand-gray-125 text-brand-black-950 placeholder:text-brand-gray-500 focus-visible:border-brand-orange-500 focus-visible:ring-brand-orange-500/20"
                disabled={isLoading || isSaving}
              />
              <p className="text-xs text-brand-gray-500">
                Used when sharing links on social platforms.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-brand-black-950">
                Default Open Graph Description
              </label>
              <Input
                value={formValues.defaultOpenGraphDescription}
                onChange={handleChange("defaultOpenGraphDescription")}
                placeholder="Trusted party rentals with fast setup and friendly service."
                className="border-brand-gray-125 text-brand-black-950 placeholder:text-brand-gray-500 focus-visible:border-brand-orange-500 focus-visible:ring-brand-orange-500/20"
                disabled={isLoading || isSaving}
              />
              <p className="text-xs text-brand-gray-500">
                Keep this aligned with your meta description.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-brand-black-950">
                Default Robots
              </label>
              <Input
                value={formValues.defaultRobots}
                onChange={handleChange("defaultRobots")}
                placeholder="index, follow"
                className="border-brand-gray-125 text-brand-black-950 placeholder:text-brand-gray-500 focus-visible:border-brand-orange-500 focus-visible:ring-brand-orange-500/20"
                disabled={isLoading || isSaving}
              />
              <p className="text-xs text-brand-gray-500">
                Use &quot;noindex, nofollow&quot; to hide all pages from search
                engines.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-brand-black-950">
              Robots.txt Custom Rules
            </label>
            <Textarea
              value={formValues.robotsTxtCustomRules}
              onChange={handleChange("robotsTxtCustomRules")}
              placeholder={"User-agent: BadBot\nDisallow: /\n\nUser-agent: *\nDisallow: /private/"}
              className="min-h-[160px] border-brand-gray-125 font-mono text-sm text-brand-black-950 placeholder:text-brand-gray-500 focus-visible:border-brand-orange-500 focus-visible:ring-brand-orange-500/20"
              disabled={isLoading || isSaving}
            />
            <p className="text-xs text-brand-gray-500">
              Add custom rules (one per line). These will be merged with the
              default rules.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-5">
            <Button
              type="button"
              variant="outline"
              className="h-10 border-gray-200 text-sm font-medium text-brand-zinc-500 shadow-none hover:bg-gray-100"
              onClick={handleReset}
              disabled={isLoading || isSaving}
            >
              {resetMutation.isPending ? "Resetting..." : "Reset"}
            </Button>
            <Button className="h-10 rounded-lg bg-brand-orange-650 px-4 text-sm font-medium text-white shadow-none hover:bg-brand-orange-500">
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SeoSettingsPage;
