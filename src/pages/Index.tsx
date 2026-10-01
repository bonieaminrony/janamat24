import React, { useState, useEffect, useRef, useCallback, useMemo, Fragment } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { FeaturedNews } from "@/components/news/FeaturedNews";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/seo/SEOHead";
import { UniversalAdBanner } from "@/components/ads/UniversalAdBanner";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, ChevronRight, ChevronLeft, Newspaper, Clock, BookOpen, Star, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toBanglaNumber, formatBanglaRelativeTime } from "@/lib/bangla-utils";
import { sanitizeImageUrl } from "@/lib/url-utils";
import { TabbedNewsWidget } from "@/components/widgets/TabbedNewsWidget";
import { CategoryBlock } from "@/components/news/CategoryBlock";
import { PrayerTimesWidget } from "@/components/widgets/PrayerTimesWidget";
import { WeatherWidget } from "@/components/widgets/WeatherWidget";
import { NewsletterWidget } from "@/components/widgets/NewsletterWidget";
import { BreakingNewsTicker } from "@/components/news/BreakingNewsTicker";
import { PollWidget } from "@/components/widgets/PollWidget";
import { LiveTVWidget } from "@/components/news/LiveTVWidget";

const PAGE_SIZE = 12;
const MAX_AUTO_LOADS = 10;

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface News {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content?: string | null;
  image_url: string | null;
  views: number;
  published_at: string | null;
  status?: string;
  categories?: {
    name: string;
    slug: string;
  };
}

function FeaturedNewsSkeleton() {
  return (
    <section className="mb-6 sm:mb-8 newspaper-border shadow-xs bg-white dark:bg-slate-900 overflow-hidden rounded-sm">
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border">
        {/* Left Column Skeleton (3 items) */}
        <div className="lg:col-span-3 flex flex-col justify-between p-4 md:p-5 divide-y divide-border/60 order-2 lg:order-1 h-full">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col justify-between flex-1 py-3 first:pt-0 last:pb-0 gap-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="aspect-[16/9] w-full rounded-xs" />
              <Skeleton className="h-3 w-20 mt-auto" />
            </div>
          ))}
        </div>

        {/* Center Column Skeleton */}
        <div className="lg:col-span-6 p-4 md:p-6 flex flex-col order-1 lg:order-2">
          <Skeleton className="aspect-[16/10] w-full mb-4 rounded-xs" />
          <Skeleton className="h-7 w-full mb-2" />
          <Skeleton className="h-7 w-3/4 mb-3" />
          <div className="flex gap-3 mb-3">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-3.5 w-24" />
          </div>
          <Skeleton className="h-3.5 w-full mb-1.5" />
          <Skeleton className="h-3.5 w-5/6 mb-4" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border mt-auto">
            {[1, 2].map((i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="aspect-[16/9] w-full rounded-xs" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Right Column Skeleton (7 items + ad) */}
        <div className="lg:col-span-3 flex flex-col p-4 md:p-6 bg-slate-50 dark:bg-slate-900/50 border-t lg:border-t-0 border-border order-3">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-primary">
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="flex gap-2.5 items-start py-1.5">
                <Skeleton className="w-[70px] h-[50px] rounded-xs shrink-0" />
                <div className="flex-1 flex flex-col gap-1.5">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-2 w-14 mt-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CategoryBlockSkeleton() {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6 border-b border-border pb-2">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-12" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col gap-3">
            <Skeleton className="aspect-[4/3] w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-20 mt-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

const HOME_FEATURED_CACHE = "janamat_featured_v2";
const HOME_BLOCK_CACHE = "janamat_block_v2";
const HOME_POPULAR_CACHE = "janamat_popular_v2";
const CATEGORIES_CACHE = "janamat_categories_v2";

const Index = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const pageParam = parseInt(searchParams.get("page") || "1", 10);
  const currentPage = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
  const latestNewsSectionRef = useRef<HTMLDivElement>(null);

  // Real-time listener: When new news is published/updated, refresh homepage queries immediately
  useEffect(() => {
    const channel = supabase
      .channel("public-news-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "news" }, () => {
        queryClient.invalidateQueries({ queryKey: ["featured-news"] });
        queryClient.invalidateQueries({ queryKey: ["block-news"] });
        queryClient.invalidateQueries({ queryKey: ["latest-news-page"] });
        queryClient.invalidateQueries({ queryKey: ["total-published-news-count"] });
        queryClient.invalidateQueries({ queryKey: ["popular-news"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Fetch featured news: ALWAYS strictly sorted by published_at DESC so the newest published news is #1
  const { data: featuredNews = [], isLoading: featuredLoading } = useQuery<News[]>({
    queryKey: ["featured-news"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("id, title, slug, excerpt, content, image_url, views, published_at, categories(name, slug)")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(16);
      if (error) throw error;
      const result = (data || []) as unknown as News[];
      try { localStorage.setItem(HOME_FEATURED_CACHE, JSON.stringify(result)); } catch(e) {}
      return result;
    },
    initialData: () => {
      try {
        const cached = localStorage.getItem(HOME_FEATURED_CACHE);
        if (cached) return JSON.parse(cached);
      } catch(e) {}
      return undefined;
    },
    staleTime: 1000 * 30, // 30s freshness
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug")
        .order("name");
      if (error) throw error;
      const result = (data || []) as Category[];
      try { localStorage.setItem(CATEGORIES_CACHE, JSON.stringify(result)); } catch(e) {}
      return result;
    },
    initialData: () => {
      try {
        const cached = localStorage.getItem(CATEGORIES_CACHE);
        if (cached) return JSON.parse(cached);
      } catch(e) {}
      return undefined;
    },
    staleTime: 1000 * 60 * 10,
  });

  // Fetch recent news for block sorting (lightweight)
  const { data: blockNews = [], isLoading: blockLoading } = useQuery<News[]>({
    queryKey: ["block-news"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("id, title, slug, excerpt, image_url, published_at, views, categories(name, slug)")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(48);
      if (error) throw error;
      const result = (data || []) as unknown as News[];
      try { localStorage.setItem(HOME_BLOCK_CACHE, JSON.stringify(result)); } catch(e) {}
      return result;
    },
    initialData: () => {
      try {
        const cached = localStorage.getItem(HOME_BLOCK_CACHE);
        if (cached) return JSON.parse(cached);
      } catch(e) {}
      return undefined;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Popular News (Last 3 days with fallback to top viewed)
  const { data: popularNews = [] } = useQuery<News[]>({
    queryKey: ["popular-news"],
    queryFn: async () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const { data, error } = await supabase
        .from("news")
        .select("id, title, slug, image_url, views, published_at, categories(name)")
        .eq("status", "published")
        .gte("published_at", threeDaysAgo.toISOString())
        .gt("views", 0)
        .order("views", { ascending: false })
        .limit(10);
        
      let result: News[] = [];
      if (!error && data && data.length > 0) {
        result = data as unknown as News[];
      } else {
        const { data: fallback, error: fallbackError } = await supabase
          .from("news")
          .select("id, title, slug, image_url, views, published_at, categories(name)")
          .eq("status", "published")
          .order("views", { ascending: false })
          .limit(10);

        if (fallbackError) throw fallbackError;
        result = (fallback || []) as unknown as News[];
      }
      try { localStorage.setItem(HOME_POPULAR_CACHE, JSON.stringify(result)); } catch(e) {}
      return result;
    },
    initialData: () => {
      try {
        const cached = localStorage.getItem(HOME_POPULAR_CACHE);
        if (cached) return JSON.parse(cached);
      } catch(e) {}
      return undefined;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Total published news count for accurate pagination
  const { data: totalNewsCount = 0 } = useQuery({
    queryKey: ["total-published-news-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("news")
        .select("*", { count: "exact", head: true })
        .eq("status", "published");
      if (error) throw error;
      return count || 0;
    },
    staleTime: 1000 * 60 * 5,
  });

  const totalPages = Math.max(1, Math.ceil(totalNewsCount / PAGE_SIZE));

  // Current page's latest news query
  const { data: latestPageNews = [], isLoading: isPageNewsLoading, isFetching: isPageNewsFetching } = useQuery<News[]>({
    queryKey: ["latest-news-page", currentPage],
    queryFn: async () => {
      const from = (currentPage - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error } = await supabase
        .from("news")
        .select("id, title, slug, excerpt, content, image_url, published_at, views, categories(name, slug)")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .range(from, to);
        
      if (error) throw error;
      return (data || []) as unknown as News[];
    },
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 60 * 5,
  });

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (newPage === 1) {
        next.delete("page");
      } else {
        next.set("page", newPage.toString());
      }
      return next;
    }, { replace: false });

    if (latestNewsSectionRef.current) {
      const yOffset = -90;
      const element = latestNewsSectionRef.current;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const getPaginationItems = (current: number, total: number) => {
    if (total <= 10) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    
    // When near the start (e.g. current <= 6)
    if (current <= 6) {
      const items: (number | string)[] = [];
      for (let i = 1; i <= 8; i++) {
        items.push(i);
      }
      items.push("...");
      items.push(total);
      return items;
    }
    
    // When near the end (e.g. current >= total - 5)
    if (current >= total - 5) {
      const items: (number | string)[] = [1, "..."];
      for (let i = total - 7; i <= total; i++) {
        items.push(i);
      }
      return items;
    }
    
    // When in the middle
    return [
      1,
      "...",
      current - 2,
      current - 1,
      current,
      current + 1,
      current + 2,
      "...",
      total,
    ];
  };

  const organizedBlocks = useMemo(() => {
    if (blockNews.length === 0 || categories.length === 0) return [];
    
    const grouped = new Map<string, News[]>();
    blockNews.forEach(news => {
      if (news.categories?.slug) {
        const slug = news.categories.slug;
        const current = grouped.get(slug) || [];
        grouped.set(slug, [...current, news]);
      }
    });

    const blocks = [];
    for (const cat of categories) {
      const catNews = grouped.get(cat.slug) || [];
      if (catNews.length >= 3) {
        blocks.push({ category: cat, news: catNews });
      }
    }
    
    return blocks.slice(0, 6);
  }, [blockNews, categories]);

  return (
    <PublicLayout>
      <SEOHead 
        title="জনমত ২৪ - বিশ্বস্ত সংবাদ মাধ্যম"
        description="জনমত ২৪ একটি বিশ্বস্ত এবং নির্ভরযোগ্য বাংলা সংবাদ মাধ্যম। সর্বশেষ জাতীয়, আন্তর্জাতিক, রাজনীতি, ও বিনোদন সংবাদ পড়ুন।"
        url="/"
      />
      
      {/* Dynamic Breaking News Ticker directly below navigation */}
      {blockNews.length > 0 && (
         <BreakingNewsTicker news={blockNews.slice(0, 10)} />
      )}
      
      <div className="bg-background">
        <div className="container py-6">
          
          {/* Top Featured Section */}
          <div className="mb-8">
            {featuredLoading ? (
              <FeaturedNewsSkeleton />
            ) : featuredNews.length > 0 ? (
              <FeaturedNews news={featuredNews} />
            ) : null}
          </div>

          {/* Trending Bar */}
          {popularNews.length > 0 && (
            <div className="mb-8 bg-[#26225a]/[0.03] dark:bg-slate-900 border border-[#26225a]/10 dark:border-slate-800 flex items-stretch overflow-hidden relative">
              <div className="flex-shrink-0 flex items-center gap-2 bg-[#26225a] text-white px-5 md:px-7 font-bold uppercase tracking-widest text-[13px] z-10 shadow-lg relative">
                <TrendingUp className="w-4 h-4" />
                <span className="hidden sm:inline">ট্রেন্ডিং</span>
                <div className="absolute right-[-10px] top-0 bottom-0 w-[20px] bg-[#26225a] transform skew-x-[-15deg] origin-bottom z-[-1]" />
              </div>
              <div className="flex-1 overflow-hidden relative flex items-center pl-4 py-3">
                <div className="flex whitespace-nowrap animate-marquee items-center gap-8">
                  {[...popularNews.slice(0, 10), ...popularNews.slice(0, 10)].map((news, idx) => (
                    <Link 
                      key={`${news.id}-${idx}`} 
                      to={`/news/${news.slug}`}
                      className="text-[14px] font-bold text-headline hover:text-accent transition-colors flex items-center gap-4"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                      {news.title}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Responsive Mid-Page Banner */}
          <div className="mb-8">
            <UniversalAdBanner 
              placement="home_page_middle" 
              slot="home-middle-slot" 
              className="w-full rounded-xl overflow-hidden shadow-sm" 
            />
          </div>

          <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
            {/* MAIN CONTENT PORTAL BLOCKS */}
            <div className="flex-1 min-w-0 flex flex-col gap-6 sm:gap-8">
              
              {/* Category Blocks */}
              {blockLoading ? (
                <>
                  <CategoryBlockSkeleton />
                  <CategoryBlockSkeleton />
                </>
              ) : (
                <>
                  {organizedBlocks.map((block, index) => (
                    <CategoryBlock 
                      key={block.category.id}
                      title={block.category.name}
                      categorySlug={block.category.slug}
                      news={block.news}
                      layout={index === 0 ? "featured-left" : "grid"}
                    />
                  ))}
                  
                  {/* "Latest News" (সর্বশেষ সংবাদ) Paginated block */}
                  <div ref={latestNewsSectionRef} className="pt-2">
                    <div className="flex items-center justify-between mb-6 pb-2 border-b border-border">
                      <div className="flex items-center gap-2.5">
                        <h2 className="text-xl md:text-2xl font-black text-headline border-t-4 border-primary pt-2 px-2 shrink-0 bg-background -mb-[10px]">
                          সর্বশেষ সংবাদ
                        </h2>
                        {totalNewsCount > 0 && (
                          <span className="hidden sm:inline-flex items-center text-xs font-bold text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full mt-2">
                            পৃষ্ঠা {toBanglaNumber(currentPage)} / {toBanglaNumber(totalPages)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* News Grid */}
                    {isPageNewsLoading && latestPageNews.length === 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                        {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                          <div key={i} className="flex gap-3 bg-white dark:bg-slate-900 border border-border/80 p-3 rounded-xs">
                            <Skeleton className="w-[105px] sm:w-[120px] aspect-[4/3] rounded-xs shrink-0" />
                            <div className="flex-1 flex flex-col justify-between">
                              <Skeleton className="h-4 w-full mb-2" />
                              <Skeleton className="h-3 w-4/5 mb-2" />
                              <Skeleton className="h-2.5 w-16 mt-auto" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : latestPageNews.length > 0 ? (
                      <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 transition-opacity duration-200", isPageNewsFetching ? "opacity-75" : "opacity-100")}>
                        {latestPageNews.map((item) => {
                          const summary = item.excerpt || (item.content ? item.content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim().substring(0, 180) : null);
                          return (
                            <Link 
                              key={item.id}
                              to={`/news/${item.slug}`} 
                              className="group flex gap-3 bg-white dark:bg-slate-900 border border-border/80 p-2.5 sm:p-3 rounded-xs transition-all hover:border-primary/40 shadow-xs"
                            >
                              <div className="w-[105px] sm:w-[120px] aspect-[4/3] overflow-hidden flex-shrink-0 bg-muted rounded-xs">
                                {sanitizeImageUrl(item.image_url) && (
                                  <img src={sanitizeImageUrl(item.image_url)!} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                                )}
                              </div>
                              <div className="flex flex-col justify-between flex-1 min-w-0">
                                <div>
                                  <h4 className="font-bold text-[14px] sm:text-[15px] line-clamp-2 leading-snug group-hover:text-primary transition-colors text-headline mb-1">
                                    {item.title}
                                  </h4>
                                  {summary && (
                                    <p className="text-xs text-muted-foreground line-clamp-2 font-normal leading-relaxed">
                                      {summary}
                                    </p>
                                  )}
                                </div>
                                <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1 mt-auto pt-1 border-t border-border/40">
                                  <Clock className="w-2.5 h-2.5 text-primary/60" />
                                  {formatBanglaRelativeTime(item.published_at)}
                                </span>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground bg-white dark:bg-slate-900 border border-border rounded-xs">
                        কোনো সংবাদ পাওয়া যায়নি।
                      </div>
                    )}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="mt-8 pt-6 border-t border-border flex flex-col items-center gap-3">
                        <nav aria-label="সংবাদ পেজিনেশন" className="flex items-center justify-center gap-1 sm:gap-1.5 flex-wrap">
                          {/* Previous Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage <= 1}
                            className="h-8 sm:h-9 px-2.5 sm:px-3 text-xs sm:text-sm font-bold bg-white dark:bg-slate-900 border-border hover:bg-primary hover:text-white hover:border-primary disabled:opacity-40"
                          >
                            <ChevronLeft className="w-4 h-4" />
                            <span className="hidden sm:inline">পূর্ববর্তী</span>
                          </Button>

                          {/* Page Numbers */}
                          {getPaginationItems(currentPage, totalPages).map((item, index) => {
                            if (item === "...") {
                              return (
                                <span key={`ellipsis-${index}`} className="px-1.5 py-1 text-muted-foreground font-bold select-none text-xs sm:text-sm">
                                  ...
                                </span>
                              );
                            }
                            const pageNum = item as number;
                            const isActive = pageNum === currentPage;
                            return (
                              <button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                aria-current={isActive ? "page" : undefined}
                                className={cn(
                                  "min-w-[32px] sm:min-w-[38px] h-8 sm:h-9 px-2 rounded-xs text-xs sm:text-sm font-bold transition-all border",
                                  isActive
                                    ? "bg-primary text-white border-primary shadow-xs"
                                    : "bg-white dark:bg-slate-900 border-border text-headline hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary"
                                )}
                              >
                                {toBanglaNumber(pageNum)}
                              </button>
                            );
                          })}

                          {/* Next Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage >= totalPages}
                            className="h-8 sm:h-9 px-2.5 sm:px-3 text-xs sm:text-sm font-bold bg-white dark:bg-slate-900 border-border hover:bg-primary hover:text-white hover:border-primary disabled:opacity-40"
                          >
                            <span className="hidden sm:inline">পরবর্তী</span>
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </nav>

                        {/* Page status info */}
                        <p className="text-[12px] text-muted-foreground font-medium">
                          পৃষ্ঠা <span className="font-bold text-headline">{toBanglaNumber(currentPage)}</span> এর <span className="font-bold text-headline">{toBanglaNumber(totalPages)}</span> (মোট <span className="font-bold text-headline">{toBanglaNumber(totalNewsCount)}</span>টি সংবাদ)
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* MEGA SIDEBAR */}
            <aside className="w-full lg:w-[340px] xl:w-[360px] lg:max-w-[360px] flex-shrink-0 flex flex-col gap-6">
              
              {/* Live TV Widget */}
              <LiveTVWidget />

              {/* Weather Widget */}
              <WeatherWidget />
              
              {/* Prayer Times Widget */}
              <PrayerTimesWidget />
              
              {/* Latest / Popular Tabbed Widget */}
              <TabbedNewsWidget 
                latestNews={blockNews.slice(0, 10)} 
                popularNews={popularNews} 
              />

              {/* Advertisement - Reduced by ~30% (70% width), Centered, Uncropped */}
              <div className="w-full flex justify-center py-1">
                <div className="w-[70%] max-w-[260px] mx-auto flex items-center justify-center">
                  <UniversalAdBanner 
                    placement="sidebar" 
                    slot="3344556677" 
                    className="w-full h-auto rounded-lg overflow-hidden shadow-xs !min-h-0 flex items-center justify-center object-contain" 
                  />
                </div>
              </div>
              
              {/* Poll Widget */}
              <PollWidget />
              
              {/* Newsletter Widget */}
              <NewsletterWidget />

            </aside>
            
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Index;
