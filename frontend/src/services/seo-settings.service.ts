import api from "@/api/api";

export type SeoSettings = {
  siteName: string;
  defaultMetaTitle: string;
  defaultMetaDescription: string;
  defaultMetaKeywords: string;
  defaultCanonicalBaseUrl: string;
  defaultOpenGraphTitle: string;
  defaultOpenGraphDescription: string;
  defaultRobots: string;
  robotsTxtCustomRules: string;
};

export type SeoSettingsInput = SeoSettings;

type SeoSettingsResponse = {
  data?: {
    settings?: SeoSettings;
  };
};

export async function getSeoSettings(): Promise<SeoSettings> {
  const { data } = await api.get<SeoSettingsResponse>("/seo-settings");
  return data?.data?.settings ?? {
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
}

export async function updateSeoSettings(
  payload: SeoSettingsInput,
): Promise<SeoSettings> {
  const { data } = await api.patch<SeoSettingsResponse>(
    "/seo-settings",
    payload,
  );
  return data?.data?.settings ?? payload;
}

export async function resetSeoSettings(): Promise<SeoSettings> {
  const { data } = await api.post<SeoSettingsResponse>("/seo-settings/reset");
  return (
    data?.data?.settings ?? {
      siteName: "",
      defaultMetaTitle: "",
      defaultMetaDescription: "",
      defaultMetaKeywords: "",
      defaultCanonicalBaseUrl: "",
      defaultOpenGraphTitle: "",
      defaultOpenGraphDescription: "",
      defaultRobots: "index, follow",
      robotsTxtCustomRules: "",
    }
  );
}
