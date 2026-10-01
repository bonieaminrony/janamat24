import { useState, Fragment } from "react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, TrendingUp, ChevronRight, Image as ImageIcon } from "lucide-react";
import { toBanglaNumber, formatBanglaRelativeTime } from "@/lib/bangla-utils";
import { sanitizeImageUrl } from "@/lib/url-utils";
import { prefetchArticle } from "@/lib/query-client";

interface NewsItem {
  id: string;
  title: string;
  slug: string;
  image_url?: string | null;
  published_at?: string;
  views?: number;
}

interface TabbedNewsWidgetProps {
  latestNews: NewsItem[];
  popularNews: NewsItem[];
}

export function TabbedNewsWidget({ latestNews, popularNews }: TabbedNewsWidgetProps) {
  const [activeTab, setActiveTab] = useState("latest");

  const handlePrefetch = (slug?: string) => {
    if (slug) prefetchArticle(slug);
  };

  const renderNewsItem = (news: NewsItem, index: number, isPopular: boolean) => (
    <Link
      key={news.id}
      to={`/news/${news.slug}`}
      onMouseEnter={() => handlePrefetch(news.slug)}
      onTouchStart={() => handlePrefetch(news.slug)}
      className="flex items-center gap-3 p-2.5 sm:p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group"
    >
      <div className="relative w-[75px] sm:w-20 h-14 shrink-0 overflow-hidden bg-muted rounded border border-border/50">
        {news.image_url ? (
          <img 
            src={sanitizeImageUrl(news.image_url)!} 
            alt={news.title} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-5 h-5 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute top-0 left-0 w-5 h-5 bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-black rounded-br shadow-sm z-10">
          {toBanglaNumber(index + 1)}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm sm:text-base font-semibold text-headline leading-snug group-hover:text-primary transition-colors line-clamp-2">
          {news.title}
        </h4>
        {isPopular && news.views ? (
          <div className="flex items-center gap-1 mt-1 text-primary/80">
            <TrendingUp className="w-3 h-3 shrink-0" />
            <span className="text-[10px] font-bold">
              {toBanglaNumber(news.views)} পঠিত
            </span>
          </div>
        ) : news.published_at ? (
          <div className="flex items-center gap-1 mt-1 text-muted-foreground">
            <Clock className="w-3 h-3 shrink-0" />
            <span className="text-[10px] font-medium font-sans">
              {formatBanglaRelativeTime(news.published_at)}
            </span>
          </div>
        ) : null}
      </div>
    </Link>
  );

  return (
    <div className="relative group overflow-hidden bg-white dark:bg-slate-900 border border-border rounded-xs shadow-xs">
      
      <Tabs defaultValue="latest" value={activeTab} onValueChange={setActiveTab} className="w-full relative z-10">
        <TabsList className="w-full grid grid-cols-2 bg-slate-100 dark:bg-slate-950 p-0 h-auto border-b border-border rounded-none">
          <TabsTrigger 
            value="latest" 
            className="rounded-none py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold text-xs uppercase tracking-widest transition-colors font-semibold"
          >
            সর্বশেষ
          </TabsTrigger>
          <TabsTrigger 
            value="popular" 
            className="rounded-none py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold text-xs uppercase tracking-widest transition-colors font-semibold"
          >
            সর্বাধিক পঠিত
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="latest" className="m-0 p-0">
          <div className="flex flex-col max-h-[600px] overflow-y-auto divide-y divide-border/60 custom-scrollbar">
            {latestNews.slice(0, 16).map((news, index) => (
              <Fragment key={`latest-${news.id}`}>
                {renderNewsItem(news, index, false)}
              </Fragment>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="popular" className="m-0 p-0">
          <div className="flex flex-col max-h-[600px] overflow-y-auto divide-y divide-border/60 custom-scrollbar">
            {popularNews.slice(0, 16).map((news, index) => (
              <Fragment key={`popular-${news.id}`}>
                {renderNewsItem(news, index, true)}
              </Fragment>
            ))}
          </div>
        </TabsContent>
        
        {/* View all button */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-border">
          <Link to="/category/all" className="flex items-center justify-center gap-1.5 py-2 w-full text-xs font-bold text-primary hover:text-white hover:bg-primary transition-colors group">
            সকল সংবাদ দেখুন
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </Tabs>
    </div>
  );
}
