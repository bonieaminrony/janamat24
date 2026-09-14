import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AdSystemType = "manual" | "google" | "none";

export interface SiteSettings {
  ad_system: AdSystemType;
  google_client_id?: string;
  fb_page_id?: string;
  fb_access_token?: string;
  second_article_id?: string;
}

const CONFIG_NAME = "SYSTEM_CONFIG_DO_NOT_DELETE";

export function useSiteSettings() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["site-settings"],
    initialData: () => {
      try {
        const cached = localStorage.getItem("janamt_site_settings");
        if (cached) return JSON.parse(cached);
      } catch (e) {}
      return { ad_system: "manual", google_client_id: "ca-pub-1869371645821023", fb_page_id: "", fb_access_token: "" } as SiteSettings;
    },
    staleTime: 1000 * 60 * 30, // 30 minutes cache
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_partners")
        .select("id, website_url")
        .eq("name", CONFIG_NAME)
        .maybeSingle();

      if (error) {
        return { ad_system: "manual", google_client_id: "ca-pub-1869371645821023", fb_page_id: "", fb_access_token: "" } as SiteSettings; 
      }

      if (!data) {
        return { ad_system: "manual", google_client_id: "ca-pub-1869371645821023", fb_page_id: "", fb_access_token: "" } as SiteSettings;
      }
      
      try {
        if (data.website_url) {
          const parsed = JSON.parse(data.website_url);
          const result = { 
            ad_system: parsed.ad_system || "manual",
            google_client_id: parsed.google_client_id || "ca-pub-1869371645821023",
            fb_page_id: parsed.fb_page_id || "",
            fb_access_token: parsed.fb_access_token || "",
            second_article_id: parsed.second_article_id || ""
          } as SiteSettings;
          try {
            localStorage.setItem("janamt_site_settings", JSON.stringify(result));
          } catch (e) {}
          return result;
        }
      } catch (e) {}
      
      return { ad_system: "manual", google_client_id: "ca-pub-1869371645821023", fb_page_id: "", fb_access_token: "" } as SiteSettings;
    },
  });

  const mutation = useMutation({
    mutationFn: async (newSettings: Partial<SiteSettings>) => {
      const currentConfig = query.data || { ad_system: "manual", google_client_id: "ca-pub-1869371645821023" };
      const updatedConfigOptions = { ...currentConfig, ...newSettings };
      const newJsonString = JSON.stringify(updatedConfigOptions);

      const { data: existing } = await supabase
        .from("ad_partners")
        .select("id")
        .eq("name", CONFIG_NAME)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("ad_partners")
          .update({ website_url: newJsonString })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("ad_partners")
          .insert({
            name: CONFIG_NAME,
            website_url: newJsonString,
            is_active: false,
          });
        if (error) throw error;
      }
      try {
        localStorage.setItem("janamt_site_settings", newJsonString);
      } catch (e) {}
      return updatedConfigOptions as SiteSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
    },
  });

  return {
    settings: query.data,
    isLoading: false, // Instant synchronous initialData ensures no flicker
    updateSettings: mutation.mutateAsync,
    isUpdating: mutation.isPending
  };
}
