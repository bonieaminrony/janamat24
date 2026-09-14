import React, { useState, useEffect, useRef, useCallback, useMemo, Fragment } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { FeaturedNews } from "@/components/news/FeaturedNews";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/seo/SEOHead";
import { UniversalAdBanner } from "@/components/ads/UniversalAdBanner";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, ChevronRight, Newspaper, Clock, BookOpen, Star, Zap
} from "lucide-react";
import { toBanglaNumber, formatBanglaRelativeTime } from "@/lib/bangla-utils";
import { sanitizeImageUrl } from "@/lib/url-utils";
import { TabbedNewsWidget } from "@/components/widgets/TabbedNewsWidget";
import { CategoryBlock } from "@/components/news/CategoryBlock";
import { PrayerTimesWidget } from "@/components/widgets/PrayerTimesWidget";
import { WeatherWidget } from "@/components/widgets/WeatherWidget";
import { NewsletterWidget } from "@/components/widgets/NewsletterWidget";
import { BreakingNewsTicker } from "@/components/news/BreakingNewsTicker";
import { PollWidget } from "@/components/widgets/PollWidget";
import { ArchiveCalendarWidget } from "@/components/widgets/ArchiveCalendarWidget";
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
    <section className="mb-8 newspaper-border shadow-sm bg-white dark:bg-slate-900">
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border">
        {/* Left Column Skeleton */}
        <div className="lg:col-span-3 flex flex-col p-4 md:p-6 gap-6 order-2 lg:order-1">
          {[1, 2].map((i) => (
            <div key={i} className="flex flex-col gap-3">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="aspect-[16/9] w-full rounded-sm" />
              <Skeleton className="h-3 w-20 mt-auto" />
            </div>
          ))}
        </div>

        {/* Center Column Skeleton */}
        <div className="lg:col-span-6 p-4 md:p-6 flex flex-col order-1 lg:order-2">
          <Skeleton className="aspect-[16/10] w-full mb-5 rounded-sm" />
          <Skeleton className="h-8 w-full mb-2" />
          <Skeleton className="h-8 w-4/5 mb-4" />
          <div className="flex gap-3 mb-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-11/12 mb-6" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-border mt-auto">
            {[1, 2].map((i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="aspect-[16/9] w-full rounded-sm" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </div>

        {/* Right Column Skeleton */}
        <div className="lg:col-span-3 flex flex-col p-4 md:p-6 bg-slate-50 dark:bg-slate-900/50 border-t lg:border-t-0 border-border order-3">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-primary">
            <Skeleton className="h-6 w-28" />
          </div>
          <div className="flex flex-col gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-3 items-start py-2">
                <Skeleton className="w-[60px] h-[45px] sm:w-[84px] sm:h-[60px] rounded shrink-0" />
                <div className="flex-1 flex flex-col gap-2">
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-3.5 w-2/3" />
                  <Skeleton className="h-2.5 w-16 mt-1" />
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
  const [page, setPage] = useState(1);
  const [allLatestNews, setAllLatestNews] = useState<News[]>(() => {
    try {
      const cached = localStorage.getItem(HOME_BLOCK_CACHE);
      if (cached) return JSON.parse(cached).slice(0, PAGE_SIZE);
    } catch(e) {}
    return [];
  });
  const [hasMore, setHasMore] = useState(true);
  const [autoLoadCount, setAutoLoadCount] = useState(0);

  // Fetch featured news (Instant 0ms initial load from cache, background refresh)
  const { data: featuredNews = [], isLoading: featuredLoading } = useQuery<News[]>({
    queryKey: ["featured-news"],
    queryFn: async () => {
      const { data: featured, error } = await supabase
        .from("news")
        .select("id, title, slug, excerpt, image_url, views, published_at, categories(name, slug)")
        .eq("status", "published")
        .eq("is_featured", true)
        .order("published_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      let result = (featured || []) as unknown as News[];
      if (result.length === 0) {
        const { data: latest, error: latestError } = await supabase
          .from("news")
          .select("id, title, slug, excerpt, image_url, views, published_at, categories(name, slug)")
          .eq("status", "published")
          .order("published_at", { ascending: false })
          .limit(8);
        if (latestError) throw latestError;
        result = (latest || []) as unknown as News[];
      }
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
    staleTime: 1000 * 60 * 5,
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
        .limit(36);
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

  // Pagination for "More News"
  const { data: paginatedNews = [], isFetching } = useQuery<News[]>({
    queryKey: ["latest-news-paginated", page],
    queryFn: async () => {
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error } = await supabase
        .from("news")
        .select("id, title, slug, excerpt, image_url, published_at, views, categories(name, slug)")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .range(from, to);
        
      if (error) throw error;
      const items = (data as unknown as News[]) || [];
      
      if (page === 1) {
        setAllLatestNews(items);
      } else {
        setAllLatestNews(prev => {
          const seen = new Set(prev.map(p => p.id));
          return [...prev, ...items.filter(item => !seen.has(item.id))];
        });
      }
      
      setHasMore(items.length === PAGE_SIZE);
      return items;
    },
    staleTime: 1000 * 60 * 5,
  });

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef(isFetching);
  const hasMoreRef = useRef(hasMore);

  useEffect(() => {
    isFetchingRef.current = isFetching;
    hasMoreRef.current = hasMore;
  }, [isFetching, hasMore]);

  const loadMore = useCallback((isAuto = false) => {
    if (!isFetchingRef.current && hasMoreRef.current) {
      if (isAuto) setAutoLoadCount(prev => prev + 1);
      setPage(prev => prev + 1);
    }
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && autoLoadCount < MAX_AUTO_LOADS) {
        loadMore(true);
      }
    }, { threshold: 0.1, rootMargin: '200px' });
    
    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }
    
    return () => observer.disconnect();
  }, [autoLoadCount, loadMore]);

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

          <div className="flex flex-col lg:flex-row gap-8">
            {/* MAIN CONTENT PORTAL BLOCKS */}
            <div className="flex-1 min-w-0 flex flex-col gap-8">
              
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
                      showAds={index % 2 !== 0}
                    />
                  ))}
                  
                  {/* "More Latest News" infinite scroll block */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-6 pb-2 border-b border-border">
                      <h2 className="text-xl md:text-2xl font-black text-headline border-t-4 border-primary pt-2 px-2 shrink-0 bg-background -mb-[10px]">
                        আরো সর্বশেষ সংবাদ
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {allLatestNews.map((item, idx) => (
                        <Fragment key={item.id}>
                          <Link to={`/news/${item.slug}`} className="group flex gap-4 bg-white dark:bg-slate-900 border border-border p-3 transition-colors hover:border-primary/30">
                            <div className="w-[110px] aspect-[4/3] overflow-hidden flex-shrink-0 bg-muted">
                              {sanitizeImageUrl(item.image_url) && (
                                <img src={sanitizeImageUrl(item.image_url)!} alt="" className="w-full h-full object-cover group-hover:opacity-90 transition-opacity" loading="lazy" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-bold text-[1.1rem] line-clamp-3 leading-snug group-hover:text-primary transition-colors text-headline">
                                {item.title}
                              </h4>
                              {item.excerpt && (
                                <p className="text-[13px] text-muted-foreground line-clamp-2 mt-2 font-medium">
                                  {item.excerpt}
                                </p>
                              )}
                              <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1 mt-2">
                                <Clock className="w-3 h-3 text-primary/50" />
                                {formatBanglaRelativeTime(item.published_at)}
                              </span>
                            </div>
                          </Link>
                          
                          {/* Native In-Feed Ad every 4 items */}
                          {(idx + 1) % 4 === 0 && (
                            <div className="group flex gap-4 bg-slate-50 dark:bg-slate-900/50 border border-dashed border-border p-3 transition-colors items-center">
                              <div className="w-[110px] aspect-[4/3] overflow-hidden flex-shrink-0 bg-muted flex items-center justify-center relative">
                                <span className="absolute top-0 right-0 bg-primary text-white text-[9px] font-black px-1 z-10 pointer-events-none uppercase">Ad</span>
                                <UniversalAdBanner placement="in_article" slot="9876543210" className="w-full h-full" />
                              </div>
                              <div className="flex flex-col justify-center">
                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1 flex items-center gap-1"><Star className="w-3 h-3"/> স্পনসর্ড কন্টেন্ট</span>
                                <h4 className="font-bold text-[1.1rem] leading-snug text-muted-foreground line-clamp-2">
                                  ন্যায্য মূল্যে সেরা পণ্য কিনতে এখনই ভিজিট করুন
                                </h4>
                              </div>
                            </div>
                          )}
                        </Fragment>
                      ))}
                    </div>

                    <div ref={loadMoreRef} className="py-10">
                      {isFetching && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <Skeleton className="h-28 w-full" />
                          <Skeleton className="h-28 w-full" />
                        </div>
                      )}
                      {!isFetching && hasMore && autoLoadCount >= MAX_AUTO_LOADS && (
                        <div className="flex justify-center">
                          <Button onClick={() => loadMore(false)} size="lg" className="rounded-full shadow-md hover:shadow-lg">
                            আরো সংবাদ দেখুন
                          </Button>
                        </div>
                      )}
                      {!hasMore && allLatestNews.length > 0 && (
                        <div className="text-center py-6">
                          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-full">
                            <Star className="w-4 h-4" /> সব সংবাদ দেখানো হয়েছে
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* MEGA SIDEBAR */}
            <aside className="w-full lg:w-[360px] lg:max-w-[360px] flex-shrink-0 flex flex-col gap-8">
              
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

              <div className="py-2">
                <UniversalAdBanner placement="sidebar" slot="3344556677" className="rounded-2xl overflow-hidden shadow-sm" />
              </div>
              
              {/* Poll Widget */}
              <PollWidget />
              
              <div className="flex flex-col gap-8">
                <UniversalAdBanner placement="sidebar" slot="2475391229" className="rounded-2xl overflow-hidden shadow-sm" />
                <ArchiveCalendarWidget />
                <NewsletterWidget />
              </div>

            </aside>
            
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Index;
