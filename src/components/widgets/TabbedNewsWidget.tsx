import { useState, Fragment } from "react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, TrendingUp, ChevronRight, Image as ImageIcon, Star } from "lucide-react";
import { toBanglaNumber, formatBanglaRelativeTime } from "@/lib/bangla-utils";
import { sanitizeImageUrl } from "@/lib/url-utils";
import { UniversalAdBanner } from "@/components/ads/UniversalAdBanner";

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

  const renderNewsItem = (news: NewsItem, index: number, isPopular: boolean) => (
    <Link
      key={news.id}
      to={`/news/${news.slug}`}
      className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
    >
      <div className="relative w-20 h-14 shrink-0 overflow-hidden bg-muted rounded border border-border/50">
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
        <div className="absolute -top-1 -left-1 w-5 h-5 bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-black rounded shadow-sm z-10">
          {toBanglaNumber(index + 1)}
        </div>
      </div>
      <div className="flex-1">
        <h4 className="text-base font-semibold text-headline leading-snug group-hover:text-primary transition-colors line-clamp-2">
          {news.title}
        </h4>
        {isPopular && news.views ? (
          <div className="flex items-center gap-1 mt-1.5 text-primary/70">
            <TrendingUp className="w-[11px] h-[11px]" />
            <span className="text-[10px] font-bold uppercase tracking-wide">
              {toBanglaNumber(news.views)} পঠিত
            </span>
          </div>
        ) : news.published_at ? (
          <div className="flex items-center gap-1 mt-1.5 opacity-70">
            <Clock className="w-[11px] h-[11px]" />
            <span className="text-[10px] font-medium font-sans">
              {formatBanglaRelativeTime(news.published_at)}
            </span>
          </div>
        ) : null}
      </div>
    </Link>
  );

  return (
    <div className="relative group overflow-hidden bg-white dark:bg-slate-900 border border-border mt-6 mb-6">
      
      <Tabs defaultValue="latest" value={activeTab} onValueChange={setActiveTab} className="w-full relative z-10">
        <TabsList className="w-full grid grid-cols-2 bg-slate-100 dark:bg-slate-950 p-0 h-auto border-b border-border rounded-none">
          <TabsTrigger 
            value="latest" 
            className="rounded-none py-3.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold text-xs uppercase tracking-widest transition-colors font-semibold"
          >
            সর্বশেষ
          </TabsTrigger>
          <TabsTrigger 
            value="popular" 
            className="rounded-none py-3.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold text-xs uppercase tracking-widest transition-colors font-semibold"
          >
            সর্বাধিক পঠিত
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="latest" className="m-0 p-0">
          <div className="flex flex-col max-h-[600px] overflow-y-auto divide-y divide-border/60 custom-scrollbar">
            {latestNews.slice(0, 16).map((news, index) => (
              <Fragment key={`latest-${news.id}`}>
                {renderNewsItem(news, index, false)}
                {(index + 1) % 4 === 0 && index !== 15 && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50/50 dark:bg-slate-800/30 group relative">
                    <div className="absolute top-1 right-1 bg-primary text-white text-[8px] font-black px-1 rounded-sm z-10 uppercase">Ad</div>
                    <div className="relative w-20 h-14 shrink-0 overflow-hidden bg-muted rounded border border-border/50 flex items-center justify-center">
                      <UniversalAdBanner placement="sidebar" slot={`tabbed-latest-ad-${index}`} className="w-full h-full" />
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest flex items-center gap-1 mb-0.5"><Star className="w-2.5 h-2.5"/> স্পনসর্ড</span>
                      <h4 className="text-[13px] font-semibold text-muted-foreground leading-snug line-clamp-2">
                        বিশেষ অফার: সবার আগে খবর পেতে সাবস্ক্রাইব করুন
                      </h4>
                    </div>
                  </div>
                )}
              </Fragment>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="popular" className="m-0 p-0">
          <div className="flex flex-col max-h-[600px] overflow-y-auto divide-y divide-border/60 custom-scrollbar">
            {popularNews.slice(0, 16).map((news, index) => (
              <Fragment key={`popular-${news.id}`}>
                {renderNewsItem(news, index, true)}
                {(index + 1) % 4 === 0 && index !== 15 && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50/50 dark:bg-slate-800/30 group relative">
                    <div className="absolute top-1 right-1 bg-primary text-white text-[8px] font-black px-1 rounded-sm z-10 uppercase">Ad</div>
                    <div className="relative w-20 h-14 shrink-0 overflow-hidden bg-muted rounded border border-border/50 flex items-center justify-center">
                      <UniversalAdBanner placement="sidebar" slot={`tabbed-popular-ad-${index}`} className="w-full h-full" />
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest flex items-center gap-1 mb-0.5"><Star className="w-2.5 h-2.5"/> স্পনসর্ড</span>
                      <h4 className="text-[13px] font-semibold text-muted-foreground leading-snug line-clamp-2">
                        বিশেষ অফার: সবার আগে খবর পেতে সাবস্ক্রাইব করুন
                      </h4>
                    </div>
                  </div>
                )}
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

