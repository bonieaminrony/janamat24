import React, { useState, useEffect, useRef, useCallback, Fragment } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { withTimeout } from "@/lib/query-utils";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { NewsCard } from "@/components/news/NewsCard";
import { Skeleton } from "@/components/ui/skeleton";
import { UniversalAdBanner } from "@/components/ads/UniversalAdBanner";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LayoutGrid, LayoutList, Newspaper, BookOpen, Loader2, Star } from "lucide-react";
import { toBanglaNumber } from "@/lib/bangla-utils";

// Widgets for Sidebar
import { TabbedNewsWidget } from "@/components/widgets/TabbedNewsWidget";
import { PrayerTimesWidget } from "@/components/widgets/PrayerTimesWidget";
import { WeatherWidget } from "@/components/widgets/WeatherWidget";
import { NewsletterWidget } from "@/components/widgets/NewsletterWidget";

type SortOption = "newest" | "oldest" | "popular";
type ViewMode = "grid" | "list";
type TimeFilter = "all" | "today" | "week" | "month";

const PAGE_SIZE = 31;
const MAX_AUTO_LOADS = 10;

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

interface NewsItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content?: string | null;
  image_url: string | null;
  views: number;
  published_at: string | null;
  categories?: {
    name: string;
    slug: string;
  };
}

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");

  const [page, setPage] = useState(1);
  const [allNews, setAllNews] = useState<NewsItem[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [autoLoadCount, setAutoLoadCount] = useState(0);

  // Reset pagination when filters or slug change
  useEffect(() => {
    setPage(1);
    setAutoLoadCount(0);
    setAllNews([]);
    setHasMore(true);
  }, [slug, sortBy, timeFilter]);

  // Fetch category info
  const { data: category, isLoading: categoryLoading, isError: isCategoryError, refetch: refetchCategory } = useQuery<Category | null>({
    queryKey: ["category", slug],
    queryFn: async () => {
      if (slug === "all") {
        return { 
          id: "all", 
          name: "সকল সংবাদ", 
          slug: "all", 
          description: "আমাদের ওয়েবসাইটের সর্বশেষ সকল সংবাদ একসাথে এখানে পাবেন।" 
        };
      }

      const fetchPromise = (async () => {
        const { data, error } = await supabase
          .from("categories")
          .select("*")
          .eq("slug", slug)
          .limit(1)
          .maybeSingle();
        if (error) throw error;
        return data;
      })();
      return withTimeout(fetchPromise, 10000);
    },
  });

  // Calculate cutoff date inside useQuery directly
  const { data: paginatedNews = [], isFetching: newsLoading, isError: isNewsError, refetch: refetchNews } = useQuery<NewsItem[]>({
    queryKey: ["category-news-paginated", category?.id, page, sortBy, timeFilter],
    queryFn: async () => {
      if (!category?.id) return [];
      
      const fetchPromise = (async () => {
        const from = (page - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        
        let query = supabase
          .from("news")
          .select("id, title, slug, excerpt, content, image_url, published_at, views, categories(name, slug)")
          .eq("status", "published");
          
        if (category.id !== "all") {
          query = query.eq("category_id", category.id);
        }

        if (timeFilter !== "all") {
          const now = new Date();
          let cutoffDate: Date;
          switch (timeFilter) {
            case "today": cutoffDate = new Date(now.setHours(0, 0, 0, 0)); break;
            case "week": cutoffDate = new Date(now.setDate(now.getDate() - 7)); break;
            case "month": cutoffDate = new Date(now.setMonth(now.getMonth() - 1)); break;
            default: cutoffDate = new Date(0);
          }
          query = query.gte("published_at", cutoffDate.toISOString());
        }

        switch (sortBy) {
          case "newest": query = query.order("published_at", { ascending: false }); break;
          case "oldest": query = query.order("published_at", { ascending: true }); break;
          case "popular": query = query.order("views", { ascending: false }); break;
        }
        
        const { data, error } = await query.range(from, to);
          
        if (error) throw error;
        return (data as unknown as NewsItem[]) || [];
      })();
      return withTimeout(fetchPromise, 10000);
    },
    enabled: !!category?.id,
  });

  // Sync query results to allNews state to support infinite scrolling and handle cache hits correctly
  useEffect(() => {
    if (paginatedNews && paginatedNews.length > 0) {
      if (page === 1) {
        setAllNews(paginatedNews);
      } else {
        setAllNews(prev => {
          const newItems = paginatedNews.filter(item => !prev.some(p => p.id === item.id));
          return [...prev, ...newItems];
        });
      }
      setHasMore(paginatedNews.length === PAGE_SIZE);
    } else if (paginatedNews && paginatedNews.length === 0 && page === 1) {
      setAllNews([]);
      setHasMore(false);
    }
  }, [paginatedNews, page]);

  // Popular News for sidebar
  const { data: popularNews = [] } = useQuery({
    queryKey: ["popular-news-category"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("id, title, slug, image_url, published_at, views")
        .eq("status", "published")
        .order("views", { ascending: false })
        .limit(16);
      if (error) throw error;
      return data;
    },
  });

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef(newsLoading);
  const hasMoreRef = useRef(hasMore);

  useEffect(() => {
    isFetchingRef.current = newsLoading;
    hasMoreRef.current = hasMore;
  }, [newsLoading, hasMore]);

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


  if (isCategoryError) {
    return (
      <PublicLayout>
        <div className="container py-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[50vh] text-muted-foreground text-center">
          <p className="font-semibold text-red-500 mb-2">বিভাগ লোড করতে সমস্যা হয়েছে</p>
          <p className="text-xs text-muted-foreground mb-4">অনুগ্রহ করে আপনার ইন্টারনেট সংযোগ পরীক্ষা করে পুনরায় চেষ্টা করুন</p>
          <Button onClick={() => refetchCategory()} variant="outline" className="gap-2">
            পুনরায় চেষ্টা করুন
          </Button>
        </div>
      </PublicLayout>
    );
  }

  if (categoryLoading) {
    return (
      <PublicLayout>
        <div className="container py-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[50vh] text-muted-foreground">
          <Loader2 className="h-12 w-12 animate-spin mb-4 text-primary" />
          <p className="font-medium animate-pulse">ক্যাটাগরি লোড হচ্ছে...</p>
        </div>
      </PublicLayout>
    );
  }

  if (!category) {
    return (
      <PublicLayout>
        <div className="container py-24 text-center">
          <Newspaper className="w-16 h-16 text-muted-foreground/30 mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-4">বিভাগ পাওয়া যায়নি</h1>
          <Button asChild className="rounded-full">
            <Link to="/">প্রচ্ছদে ফিরে যান</Link>
          </Button>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <SEOHead 
        title={`${category.name} সংবাদ`}
        description={category.description || `${category.name} বিভাগের সর্বশেষ সংবাদ পড়ুন জনমত ২৪ এ।`}
        url={`/category/${category.slug}`}
      />
      
      <div className="container py-6 md:py-10">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1.5 h-10 rounded-full bg-gradient-to-b from-primary to-primary/40" />
                <h1 className="text-3xl md:text-4xl font-black text-headline">
                  {category.id === "all" ? "সর্বশেষ সংবাদ" : category.name}
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                {category.id !== "all" && (
                  <Badge variant="secondary" className="px-4 py-1.5 rounded-full font-bold">
                    সর্বশেষ সংবাদ
                  </Badge>
                )}
                {category.description && (
                  <p className="text-muted-foreground text-sm font-medium">{category.description}</p>
                )}
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-card rounded-xl p-1 border border-border/50 shadow-sm shrink-0">
              <Button variant={viewMode === "list" ? "default" : "ghost"} size="sm" className="h-10 w-10 p-0 rounded-lg" onClick={() => setViewMode("list")}>
                <LayoutList className="w-5 h-5" />
              </Button>
              <Button variant={viewMode === "grid" ? "default" : "ghost"} size="sm" className="h-10 w-10 p-0 rounded-lg" onClick={() => setViewMode("grid")}>
                <LayoutGrid className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Main Content (News List) */}
            <div className="lg:col-span-8 flex flex-col gap-8">

              {isNewsError ? (
                <div className="flex flex-col items-center justify-center min-h-[300px] text-muted-foreground bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-red-200 p-6 text-center">
                  <p className="font-semibold text-red-500 mb-2">সংবাদ লোড করতে সমস্যা হয়েছে</p>
                  <p className="text-xs text-muted-foreground mb-4">অনুগ্রহ করে পুনরায় চেষ্টা করুন</p>
                  <Button onClick={() => refetchNews()} variant="outline" size="sm" className="gap-2">
                    পুনরায় চেষ্টা করুন
                  </Button>
                </div>
              ) : page === 1 && newsLoading ? (
                <div className="flex flex-col items-center justify-center min-h-[300px] text-muted-foreground pt-4">
                  <Loader2 className="h-10 w-10 animate-spin mb-3 text-primary" />
                  <p className="font-medium animate-pulse">সংবাদ লোড হচ্ছে...</p>
                </div>
              ) : allNews.length === 0 ? (
                <div className="text-center py-20 bg-muted/10 rounded-3xl border border-dashed border-border/50">
                  <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-headline">কোন সংবাদ পাওয়া যায়নি</h3>
                  <Button variant="link" onClick={() => setTimeFilter("all")}>সব সংবাদ দেখুন</Button>
                </div>
              ) : (
                <>
                  <div className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
                    {allNews.map((item, idx) => (
                      <Fragment key={item.id}>
                        <NewsCard
                          id={item.id}
                          title={item.title}
                          slug={item.slug}
                          excerpt={item.excerpt}
                          content={item.content}
                          image_url={item.image_url}
                          published_at={item.published_at}
                          views={item.views}
                          category={item.categories}
                          variant={viewMode === "grid" ? "default" : "horizontal"}
                        />
                        
                        {/* Native In-Feed Ad Every 4 Items */}
                        {(idx + 1) % 4 === 0 && (
                          <div className={`group flex ${viewMode === "grid" ? "flex-col" : "flex-row"} gap-4 bg-slate-50 dark:bg-slate-900/50 border border-dashed border-border p-4 transition-colors items-center rounded-xl`}>
                            <div className={`${viewMode === "grid" ? "w-full aspect-[16/9]" : "w-[120px] sm:w-[150px] aspect-[4/3]"} overflow-hidden flex-shrink-0 bg-muted flex items-center justify-center relative rounded-md`}>
                              <span className="absolute top-0 right-0 bg-primary text-white text-[9px] font-black px-1 z-10 pointer-events-none uppercase">Ad</span>
                              <UniversalAdBanner placement="in_article" slot="9876543210" className="w-full h-full" format={viewMode === "grid" ? "rectangle" : "horizontal"} />
                            </div>
                            <div className="flex flex-col justify-center flex-1 w-full mt-2 lg:mt-0">
                              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1 flex items-center gap-1"><Star className="w-3 h-3"/> স্পনসর্ড কন্টেন্ট</span>
                              <h4 className="font-bold text-[1.1rem] leading-snug text-headline line-clamp-2">
                                তীব্র গরমে আপনার সন্তানের সুরক্ষায় এখনই অর্ডার করুন
                              </h4>
                            </div>
                          </div>
                        )}
                      </Fragment>
                    ))}
                  </div>
                  
                  {/* Infinite Scroll Loader */}
                  <div ref={loadMoreRef} className="py-10">
                    {newsLoading && (
                      <div className="flex justify-center items-center gap-3">
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                        <span className="text-sm text-muted-foreground font-medium">লোড হচ্ছে...</span>
                      </div>
                    )}
                    {!newsLoading && hasMore && autoLoadCount >= MAX_AUTO_LOADS && (
                      <div className="flex justify-center">
                        <Button onClick={() => loadMore(false)} size="lg" className="rounded-full shadow-md hover:shadow-lg">
                          আরো সংবাদ দেখুন
                        </Button>
                      </div>
                    )}
                    {!hasMore && allNews.length > 0 && (
                      <div className="text-center py-6">
                        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-full">
                          <Star className="w-4 h-4" /> সব সংবাদ দেখানো হয়েছে
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-4 space-y-10">
              {/* Ad at the top */}
              <UniversalAdBanner placement="sidebar" slot="3344556677" className="rounded-3xl shadow-sm" />

              <TabbedNewsWidget 
                latestNews={allNews.slice(0, 10)} 
                popularNews={popularNews} 
              />
              <UniversalAdBanner placement="sidebar" slot="2475391229" className="rounded-3xl shadow-sm" />
              <WeatherWidget />
              <PrayerTimesWidget />
              <div className="sticky top-28 space-y-8">
                <NewsletterWidget />
              </div>
            </aside>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default CategoryPage;
