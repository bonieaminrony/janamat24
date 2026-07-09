import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AdSystemType = "manual" | "google" | "none";

export interface SiteSettings {
  ad_system: AdSystemType;
  google_client_id?: string;
}

const CONFIG_NAME = "SYSTEM_CONFIG_DO_NOT_DELETE";

export function useSiteSettings() {
  const queryClient = useQueryClient();

  // Fetch settings from the ad_partners table using the website_url field as JSON storage
  const query = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_partners")
        .select("id, website_url")
        .eq("name", CONFIG_NAME)
        .maybeSingle();

      if (error) {
        console.error("Failed to fetch settings config:", error);
        return { ad_system: "manual", google_client_id: "ca-pub-1869371645821023" } as SiteSettings; 
      }

      // If configuration doesn't exist yet, return default
      if (!data) {
        return { ad_system: "manual", google_client_id: "ca-pub-1869371645821023" } as SiteSettings;
      }
      
      try {
        if (data.website_url) {
          const parsed = JSON.parse(data.website_url);
          return { 
            ad_system: parsed.ad_system || "manual",
            google_client_id: parsed.google_client_id || "ca-pub-1869371645821023"
          } as SiteSettings;
        }
      } catch (e) {
        console.error("Failed to parse settings JSON:", e);
      }
      
      return { ad_system: "manual", google_client_id: "ca-pub-1869371645821023" } as SiteSettings;
    },
    staleTime: 5 * 60 * 1000, 
  });

  const mutation = useMutation({
    mutationFn: async (newSettings: Partial<SiteSettings>) => {
      // Current settings fetch
      const currentConfig = query.data || { ad_system: "manual", google_client_id: "ca-pub-1869371645821023" };
      const updatedConfigOptions = { ...currentConfig, ...newSettings };
      const newJsonString = JSON.stringify(updatedConfigOptions);

      // Check if config record exists
      const { data: existing } = await supabase
        .from("ad_partners")
        .select("id")
        .eq("name", CONFIG_NAME)
        .maybeSingle();

      if (existing) {
        // Update existing fake partner config
        const { error } = await supabase
          .from("ad_partners")
          .update({ website_url: newJsonString })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        // Insert new fake partner config
        const { error } = await supabase
          .from("ad_partners")
          .insert({
            name: CONFIG_NAME,
            website_url: newJsonString,
            is_active: false, // Make sure it never shows up as a real ad partner anywhere
          });
        if (error) throw error;
      }
        
      return updatedConfigOptions as SiteSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
    },
  });

  return {
    settings: query.data,
    isLoading: query.isLoading,
    updateSettings: mutation.mutateAsync,
    isUpdating: mutation.isPending
  };
}
