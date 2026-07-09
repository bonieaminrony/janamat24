import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { NewsList } from "@/components/news/NewsList";
import { SEOHead } from "@/components/seo/SEOHead";
import { Skeleton } from "@/components/ui/skeleton";
import { Newspaper, Search as SearchIcon, SearchX } from "lucide-react";
import { toBanglaNumber } from "@/lib/bangla-utils";

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const dateQuery = searchParams.get("date") || "";

  const { data: news = [], isLoading } = useQuery({
    queryKey: ["search-results", query, dateQuery],
    queryFn: async () => {
      if (!query.trim() && !dateQuery) return [];
      
      let queryBuilder = supabase
        .from("news")
        .select("id, title, slug, excerpt, image_url, views, published_at, categories(name, slug)")
        .eq("status", "published");

      if (query.trim()) {
        const keywords = query.trim().split(/\s+/);
        keywords.forEach(kw => {
          queryBuilder = queryBuilder.or(`title.ilike.%${kw}%,excerpt.ilike.%${kw}%`);
        });
      }

      if (dateQuery) {
        queryBuilder = queryBuilder
          .gte("published_at", `${dateQuery}T00:00:00.000Z`)
          .lte("published_at", `${dateQuery}T23:59:59.999Z`);
      }
      
      const { data, error } = await queryBuilder
        .order("published_at", { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    },
    enabled: !!query.trim() || !!dateQuery,
  });

  return (
    <PublicLayout>
      <SEOHead 
        title={dateQuery ? `আর্কাইভ: ${toBanglaNumber(dateQuery)}` : `অনুসন্ধান: ${query}`}
        description={dateQuery ? `${toBanglaNumber(dateQuery)} তারিখের সব সংবাদ পড়ুন।` : `"${query}" সম্পর্কিত সব সংবাদ পড়ুন জনমত ২৪ এ।`}
        url={dateQuery ? `/search?date=${dateQuery}` : `/search?q=${query}`}
      />
      
      <div className="container py-8 md:py-12">
        {/* Search Header */}
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6 shadow-sm border border-primary/20">
            <SearchIcon className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-headline mb-3">
            {dateQuery ? "আর্কাইভ সংকলন" : "অনুসন্ধান ফলাফল"}
          </h1>
          <p className="text-muted-foreground">
            {query || dateQuery ? (
              <span className="flex items-center justify-center gap-2">
                "<strong>{dateQuery ? toBanglaNumber(dateQuery) : query}</strong>" এর জন্য {toBanglaNumber(news.length)} টি সংবাদ পাওয়া গেছে
              </span>
            ) : (
              "অনুগ্রহ করে কিছু লিখে অনুসন্ধান করুন"
            )}
          </p>
        </div>

        {isLoading ? (
          <div className="max-w-4xl mx-auto space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4 py-4 border-b border-divider">
                <Skeleton className="w-32 md:w-48 h-24 md:h-32 flex-shrink-0 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (query || dateQuery) && news.length === 0 ? (
          <div className="text-center py-20 bg-muted/20 rounded-[32px] max-w-2xl mx-auto border border-dashed border-border/60">
            <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-6 flex items-center justify-center">
              <SearchX className="w-10 h-10 text-muted-foreground/30" />
            </div>
            <h3 className="text-xl font-bold text-headline mb-2">কোন সংবাদ পাওয়া যায়নি</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              দুঃখিত, আপনার নির্দিষ্ট করা {dateQuery ? 'তারিখের' : 'কিওয়ার্ডের'} সাথে সামঞ্জস্যপূর্ণ কোনো খবর আমাদের কাছে নেই।
            </p>
          </div>
        ) : query || dateQuery ? (
          <div className="max-w-4xl mx-auto">
            <NewsList 
              news={news} 
              showTitle={false} 
              variant="horizontal" 
            />
          </div>
        ) : null}
      </div>
    </PublicLayout>
  );
}
