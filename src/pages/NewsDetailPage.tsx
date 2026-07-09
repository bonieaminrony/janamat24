import { useParams, useLocation, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatBanglaDateFull, formatBanglaRelativeTime, formatBanglaReadingTime, decodeBanglaText, toBanglaNumber } from "@/lib/bangla-utils";
import { sanitizeImageUrl } from "@/lib/url-utils";
import { Calendar, Clock, BookOpen, ArrowLeft, Share2, Bookmark, ChevronRight, Eye, User, Printer, Minus, Plus, Type, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";
import { SocialShare } from "@/components/social/SocialShare";
import { SocialFloatingBar } from "@/components/social/SocialFloatingBar";
import { toast } from "sonner";
import { SEOHead } from "@/components/seo/SEOHead";
import { ArticleJsonLd } from "@/components/seo/ArticleJsonLd";
import { AuthorBox } from "@/components/news/AuthorBox";
import { UniversalAdBanner } from "@/components/ads/UniversalAdBanner";
import { CommentsSection } from "@/components/news/CommentsSection";
import { RichContentWithAds } from "@/components/news/RichContentRenderer";
import { ReadingProgress } from "@/components/ui/reading-progress";
import { WeatherWidget } from "@/components/widgets/WeatherWidget";
import { PrayerTimesWidget } from "@/components/widgets/PrayerTimesWidget";
import { TabbedNewsWidget } from "@/components/widgets/TabbedNewsWidget";
import { NewsletterWidget } from "@/components/widgets/NewsletterWidget";

interface Article {
  id: string;
  title: string;
  slug: string;
  kicker: string | null;
  content: string | null;
  excerpt: string | null;
  image_url: string | null;
  category_id: string | null;
  author_id: string | null;
  published_at: string | null;
  updated_at?: string;
  categories?: {
    name: string;
    slug: string;
  };
}

interface Author {
  full_name: string | null;
  role: string | null;
  bio: string | null;
  avatar_url: string | null;
  facebook_url: string | null;
  twitter_url: string | null;
}

interface BookmarkItem {
  id: string;
  title: string;
  slug: string;
  image_url: string | null;
  published_at: string | null;
}

const NewsDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const fullUrl = `${window.location.origin}${location.pathname}`;
  
  const [fontSize, setFontSize] = useState(18);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const { data: article, isLoading } = useQuery<Article | null>({
    queryKey: ["news-detail", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("*, categories(name, slug)")
        .eq("slug", decodeBanglaText(slug))
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
      }
      return data as unknown as Article;
    },
  });

  const { data: author } = useQuery<Author | null>({
    queryKey: ["author", article?.author_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, role, bio, avatar_url, facebook_url, twitter_url")
        .eq("user_id", article?.author_id)
        .maybeSingle();
      if (error) throw error;
      return data as Author;
    },
    enabled: !!article?.author_id,
  });

  const { data: relatedNews = [] } = useQuery({
    queryKey: ["related-news", article?.category_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("id, title, slug, image_url, published_at")
        .eq("status", "published")
        .eq("category_id", article?.category_id)
        .neq("id", article?.id)
        .order("published_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data;
    },
    enabled: !!article?.category_id,
  });

  // Fetch block news for Tabbed Widget
  const { data: blockNews = [] } = useQuery({
    queryKey: ["block-news-detail"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("id, title, slug, image_url, published_at, views")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(16);
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (article) {
      try {
        const bookmarks: BookmarkItem[] = JSON.parse(localStorage.getItem("janamt_bookmarks") || "[]");
        setIsBookmarked(Array.isArray(bookmarks) && bookmarks.some((b) => b.id === article.id));
      } catch (e) {
        setIsBookmarked(false);
      }
    }
  }, [article]);

  useEffect(() => {
    if (article?.id) {
      const sessionId = crypto.randomUUID();
      supabase.functions.invoke('track-news-view', {
        body: { news_id: article.id, session_id: sessionId }
      });
    }
  }, [article?.id]);

  const handlePrint = () => window.print();

  const handleBookmark = () => {
    if (!article) return;
    try {
      const bookmarks: BookmarkItem[] = JSON.parse(localStorage.getItem("janamt_bookmarks") || "[]");
      const currentBookmarks = Array.isArray(bookmarks) ? bookmarks : [];
      
      if (isBookmarked) {
        const newBookmarks = currentBookmarks.filter((b) => b.id !== article.id);
        localStorage.setItem("janamt_bookmarks", JSON.stringify(newBookmarks));
        setIsBookmarked(false);
        window.dispatchEvent(new CustomEvent('bookmarks-updated'));
        toast.success("বুকমার্ক থেকে সরানো হয়েছে");
      } else {
        const newBookmark = {
          id: article.id,
          title: article.title,
          slug: article.slug,
          image_url: article.image_url,
          published_at: article.published_at
        };
        localStorage.setItem("janamt_bookmarks", JSON.stringify([...currentBookmarks, newBookmark]));
        setIsBookmarked(true);
        window.dispatchEvent(new CustomEvent('bookmarks-updated'));
        toast.success("সংবাদটি সংরক্ষিত হয়েছে");
      }
    } catch (e) {
      toast.error("বুকমার্ক সংরক্ষণে সমস্যা হয়েছে");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: article?.title, url: fullUrl });
    } else {
      navigator.clipboard.writeText(fullUrl);
      toast.success("লিংক কপি করা হয়েছে!");
    }
  };

  if (isLoading) {
    return (
      <PublicLayout>
        <article className="container py-8 max-w-6xl mx-auto min-h-[50vh]">
        </article>
      </PublicLayout>
    );
  }

  if (!article) {
    return (
      <PublicLayout>
        <div className="container py-24 text-center">
          <h1 className="text-3xl font-bold mb-4">সংবাদ পাওয়া যায়নি</h1>
          <Button asChild className="rounded-none font-bold tracking-widest">
            <Link to="/">প্রচ্ছদে ফিরে যান</Link>
          </Button>
        </div>
      </PublicLayout>
    );
  }

  const isUpdated = article?.updated_at && article?.published_at &&
    new Date(article.updated_at).getTime() - new Date(article.published_at).getTime() > 60000;

  const getImageUrlAndCaption = (url: string | null) => {
    if (!url) return { src: '', caption: '', kicker: '' };
    const parts = url.split('#');
    let caption = '';
    let kicker = '';
    if (parts[1]) {
      const params = new URLSearchParams(parts[1]);
      caption = params.get('caption') || '';
      kicker = params.get('kicker') || '';
    }
    return { 
      src: parts[0], 
      caption,
      kicker
    };
  };

  const { src: imageSrc, caption: imageCaption, kicker: imageKicker } = getImageUrlAndCaption(article.image_url);
  const displayKicker = imageKicker || article.kicker;

  return (
    <PublicLayout>
      <ReadingProgress />
      <SocialFloatingBar url={fullUrl} title={article.title} />
      <SEOHead
        title={article.title}
        description={article.excerpt || article.content?.substring(0, 160) || ""}
        image={imageSrc || undefined}
        url={`/news/${article.slug}`}
        type="article"
      />
      
      <article className="container py-6 md:py-10">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link to="/" className="hover:text-primary transition-colors">প্রচ্ছদ</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            {article.categories && (
              <Link to={`/category/${article.categories.slug}`} className="hover:text-primary transition-colors">
                {article.categories.name}
              </Link>
            )}
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground/60 line-clamp-1">{article.title}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Main Content */}
            <div className="lg:col-span-8">
              {/* Title */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-headline leading-tight mb-8">
                {displayKicker && <span className="block text-xl md:text-2xl text-muted-foreground font-semibold mb-2">{displayKicker}</span>}
                {article.title}
              </h1>

              {/* Meta bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 pb-6 border-b border-border">
                <div className="flex items-center gap-4">
                  {author?.avatar_url ? (
                    <img src={sanitizeImageUrl(author.avatar_url)!} alt={author.full_name || "Author"} className="w-12 h-12 rounded-full object-cover bg-muted border border-border" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-muted-foreground border border-border">
                      <User className="w-6 h-6" />
                    </div>
                  )}
                  <div className="flex flex-col">
                    <div className="text-[13px] text-muted-foreground flex items-center gap-1.5 flex-wrap">
                      লিখেছেন – <span className="font-bold text-headline text-lg">{author?.full_name || "জনমত ২৪ ডেস্ক"}</span>
                      {author?.role && (
                        <Badge variant="default" className="bg-primary hover:bg-primary/90 text-white text-[10px] px-2 py-0 h-5 font-medium ml-1">
                          {author.role === 'admin' ? 'সম্পাদক' : author.role === 'editor' ? 'সহ-সম্পাদক' : author.role === 'reporter' ? 'রিপোর্টার' : author.role}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3.5 h-3.5" />
                      {formatBanglaDateFull(article.published_at)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-muted/10 rounded-sm p-1 hidden sm:flex border border-border">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm" onClick={() => setFontSize(prev => Math.max(14, prev - 2))}>
                      <Minus className="w-3.5 h-3.5" />
                    </Button>
                    <div className="flex items-center px-2 text-xs font-black border-x border-border/50 mx-1">
                      <Type className="w-3 h-3 mr-1" />
                      {toBanglaNumber(fontSize)}
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm" onClick={() => setFontSize(prev => Math.min(32, prev + 2))}>
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  
                  <Button variant={isBookmarked ? "default" : "outline"} size="sm" className="rounded-sm gap-2 border-border/50" onClick={handleBookmark}>
                    {isBookmarked ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    <span className="hidden sm:inline font-bold">{isBookmarked ? "সংরক্ষিত" : "সংরক্ষণ"}</span>
                  </Button>

                  <Button variant="outline" size="sm" className="rounded-sm gap-2 border-border/50" onClick={handleShare}>
                    <Share2 className="w-4 h-4" />
                    <span className="hidden sm:inline font-bold">শেয়ার</span>
                  </Button>
                </div>
              </div>

              {/* Image */}
              {article.image_url && (
                <div className="mb-12">
                  <div className="relative aspect-video w-full overflow-hidden border border-border bg-muted group rounded-lg">
                    <img
                      src={sanitizeImageUrl(imageSrc)!}
                      alt={article.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                    />
                  </div>
                  {imageCaption && (
                    <div className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                      {imageCaption}
                    </div>
                  )}
                </div>
              )}

              {/* Content */}
              {article.excerpt && (
                <div className="text-xl font-medium text-slate-700 dark:text-slate-300 leading-relaxed mb-8 border-l-4 border-primary pl-4">
                  {article.excerpt}
                </div>
              )}
              <div className="prose-article leading-relaxed" style={{ fontSize: `${fontSize}px` }}>
                <RichContentWithAds
                  content={article.content || ""}
                  renderAd={(index: number) => (
                    <UniversalAdBanner 
                      placement={index === 0 ? "article_inline" : "article_related"} 
                      slot={index === 0 ? "9876543210" : "multi-level"} 
                      index={index} 
                      className={cn(
                        "my-8 mx-auto",
                        index === 0 
                          ? "flex flex-col gap-4 py-6 border-y border-dashed border-border/50 bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl items-center justify-center relative w-5/6 md:w-2/3"
                          : "w-full flex items-center justify-center block"
                      )} 
                    />
                  )}
                  adPositions={[2, 8]}
                />
              </div>

              {/* Bottom Card Ad (Matches Header Ad) */}
              <div className="mt-12 mb-6 border border-border rounded-xl shadow-sm overflow-hidden bg-slate-50 dark:bg-slate-900/20 p-2">
                <UniversalAdBanner 
                   placement="header" 
                   slot="8219463510"
                   className="w-full flex items-center justify-center object-contain min-h-[90px] rounded-lg" 
                   format="horizontal"
                />
              </div>

              {/* Social Share Bottom */}
              <div className="mb-12 py-6 border-y border-border">
                <SocialShare url={fullUrl} title={article.title} />
              </div>





              <CommentsSection newsId={article.id} authorId={article.author_id} />
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-4 space-y-10">
              <UniversalAdBanner placement="sidebar" className="rounded-3xl shadow-sm" />
              <TabbedNewsWidget 
                latestNews={blockNews} 
                popularNews={blockNews} // You can also fetch popular specifically if needed
              />
              <div className="sticky top-28 space-y-8">
                <UniversalAdBanner placement="article_side" slot="3344556677" index={0} className="rounded-3xl shadow-sm" />
                <NewsletterWidget />
                <UniversalAdBanner placement="article_side" slot="2475391229" index={1} className="rounded-3xl shadow-sm" />
              </div>
            </aside>
          </div>

          {/* Related News - Bottom Grid */}
          {relatedNews.length > 0 && (
            <div className="mt-20 pt-12 border-t border-divider">
              <div className="flex items-center gap-3 mb-10">
                <div className="w-1.5 h-8 bg-primary rounded-full" />
                <h2 className="text-2xl font-black text-headline">সম্পর্কিত সংবাদ</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedNews.slice(0, 5).map((news, index) => (
                  <React.Fragment key={news.id}>
                    <Link
                      to={`/news/${news.slug}`}
                      className="group flex flex-col gap-3 pb-4 hover:bg-muted/10 transition-all duration-300 border-b lg:border-b-0 lg:border-r border-border last:border-0 last:pr-0 pr-4"
                    >
                      <div className="aspect-[16/10] w-full overflow-hidden bg-muted border border-border/20">
                        {news.image_url ? (
                          <img 
                            src={sanitizeImageUrl(news.image_url)!} 
                            alt={news.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="w-8 h-8 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-headline leading-snug group-hover:text-primary transition-colors line-clamp-2 text-lg">
                          {news.title}
                        </h3>
                        <p className="text-[10px] text-muted-foreground mt-3 flex items-center gap-1.5 font-bold uppercase tracking-wider">
                          <Clock className="w-3 h-3" />
                          {formatBanglaRelativeTime(news.published_at)}
                        </p>
                      </div>
                    </Link>
                    {index === 0 && (
                      <div className="group flex flex-col gap-3 pb-4 border-b lg:border-b-0 lg:border-r border-border pr-4 items-center justify-center w-full min-h-[250px]">
                        <UniversalAdBanner placement="related_news_inline" className="w-full h-full object-cover rounded-xl" />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>
    </PublicLayout>
  );
};

export default NewsDetailPage;
