import { QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { decodeBanglaText } from "@/lib/bangla-utils";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // Cache data for 5 minutes
      gcTime: 1000 * 60 * 30, // Keep cached in memory for 30 mins
      retry: 1,
      retryDelay: 1000,
    },
  },
});

const prefetchedSlugs = new Set<string>();

export function prefetchArticle(slug?: string | null) {
  if (!slug) return;
  const decodedSlug = decodeBanglaText(slug);
  if (prefetchedSlugs.has(decodedSlug)) return;
  prefetchedSlugs.add(decodedSlug);

  queryClient.prefetchQuery({
    queryKey: ["news-detail", slug],
    staleTime: 1000 * 60 * 10,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("id, title, slug, content, excerpt, image_url, category_id, author_id, published_at, updated_at, categories(name, slug)")
        .eq("slug", decodedSlug)
        .eq("status", "published")
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        data.title = decodeBanglaText(data.title);
        data.excerpt = decodeBanglaText(data.excerpt);
        data.content = decodeBanglaText(data.content);
        if (data.categories) {
          data.categories.name = decodeBanglaText(data.categories.name);
        }
        try {
          sessionStorage.setItem("janamt_art_" + decodedSlug, JSON.stringify(data));
        } catch (e) {}
      }
      return data;
    },
  });
}
