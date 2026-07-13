import React, { useState, useEffect, useRef, useCallback, useMemo, Fragment } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { FeaturedNews } from "@/components/news/FeaturedNews";
import { NewsList } from "@/components/news/NewsList";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/seo/SEOHead";
import { UniversalAdBanner } from "@/components/ads/UniversalAdBanner";
import { Button } from "@/components/ui/button";
import { 
  Loader2, TrendingUp, ChevronRight, Users, Facebook, Youtube, 
  Hash, ArrowUpRight, Newspaper, Clock, BookOpen,
  Globe, Video, Star
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
const PAGE_SIZE = 31;
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


const Index = () => {
  const [page, setPage] = useState(1);
  const [allLatestNews, setAllLatestNews] = useState<News[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [autoLoadCount, setAutoLoadCount] = useState(0);

  // Fetch featured news
  const { data: featuredNews = [], isLoading: featuredLoading } = useQuery<News[]>({
    queryKey: ["featured-news"],
    queryFn: async () => {
      const { data: featured, error } = await supabase
        .from("news")
        .select("id, title, slug, excerpt, content, image_url, views, published_at, categories(name, slug)")
        .eq("status", "published")
        .eq("is_featured", true)
        .order("published_at", { ascending: false })
        .limit(11);
      if (error) throw error;
      if (featured.length === 0) {
        const { data: latest } = await supabase
          .from("news")
          .select("id, title, slug, excerpt, content, image_url, views, published_at, categories(name, slug)")
          .eq("status", "published")
          .order("published_at", { ascending: false })
          .limit(11);
        return latest || [];
      }
      return featured as unknown as News[];
    },
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
      return data as Category[];
    },
  });

  // Fetch all recent news for block sorting (fetch top 40)
  const { data: blockNews = [], isLoading: blockLoading } = useQuery<News[]>({
    queryKey: ["block-news"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("id, title, slug, excerpt, content, image_url, published_at, views, categories(name, slug)")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as unknown as News[];
    },
  });

  // Popular News (Last 3 days)
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
      if (error) throw error;
      return data as unknown as News[];
    },
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
      
      if (page === 1) {
        setAllLatestNews((data as unknown as News[]) || []);
      } else {
        setAllLatestNews(prev => [...prev, ...((data as unknown as News[]) || [])]);
      }
      
      setHasMore(data?.length === PAGE_SIZE);
      return data as unknown as News[];
    },
  });

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef(isFetching);
  const hasMoreRef = useRef(hasMore);

  // Keep refs in sync to avoid effect dependency re-triggers
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
      // Allow up to 10 auto loads before requiring manual click to save bandwidth
      if (entries[0].isIntersecting && autoLoadCount < 10) {
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
    
    // Group all news by category
    const grouped = new Map<string, News[]>();
    blockNews.forEach(news => {
      if (news.categories?.slug) {
        const slug = news.categories.slug;
        const current = grouped.get(slug) || [];
        grouped.set(slug, [...current, news]);
      }
    });

    // Find the primary categories that have at least 4 news items to avoid empty UI gaps
    const blocks = [];
    for (const cat of categories) {
      const catNews = grouped.get(cat.slug) || [];
      if (catNews.length >= 4) {
        blocks.push({ category: cat, news: catNews });
      }
    }
    
    // Return top 6 categorised blocks
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
              <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-border/50">
                <Loader2 className="h-10 w-10 animate-spin mb-3 text-primary" />
                <p className="font-medium animate-pulse">সংবাদ লোড হচ্ছে...</p>
              </div>
            ) : featuredNews.length > 0 ? (
              <FeaturedNews news={featuredNews} />
            ) : null}
          </div>
          {/* Trending Bar - Smart Strip */}
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
                <div className="flex flex-col items-center justify-center min-h-[300px] text-muted-foreground">
                  <Loader2 className="h-10 w-10 animate-spin mb-3 text-primary" />
                  <p className="font-medium animate-pulse">আরও সংবাদ লোড হচ্ছে...</p>
                </div>
              ) : (
                <>
                  {organizedBlocks.map((block, index) => (
                    <CategoryBlock 
                      key={block.category.id}
                      title={block.category.name}
                      categorySlug={block.category.slug}
                      news={block.news}
                      layout={index === 0 ? "featured-left" : "grid"}
                      showAds={index % 2 !== 0} // Optional prop we'll add
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
                                <img src={sanitizeImageUrl(item.image_url)!} alt="" className="w-full h-full object-cover group-hover:opacity-90 transition-opacity" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-bold text-[1.1rem] line-clamp-3 leading-snug group-hover:text-primary transition-colors text-headline">
                                {item.title}
                              </h4>
                              {(() => {
                                const displayExcerpt = item.excerpt || (item.content ? item.content.replace(/<[^>]+>/g, '').substring(0, 150) : null);
                                return displayExcerpt ? (
                                  <p className="text-[13px] text-muted-foreground line-clamp-2 mt-2 font-medium">
                                    {displayExcerpt}
                                  </p>
                                ) : null;
                              })()}
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
                        <div className="flex justify-center items-center gap-3">
                          <Loader2 className="w-5 h-5 text-primary animate-spin" />
                          <span className="text-sm text-muted-foreground font-medium">লোড হচ্ছে...</span>
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

            {/* MEGA SIDEBAR - Fixed width, never overflows */}
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
