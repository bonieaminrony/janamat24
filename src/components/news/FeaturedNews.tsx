import React from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { formatBanglaRelativeTime, toBanglaNumber } from "@/lib/bangla-utils";
import { sanitizeImageUrl } from "@/lib/url-utils";
import { Clock, TrendingUp, Newspaper, ChevronRight, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewsItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content?: string | null;
  image_url: string | null;
  published_at: string | null;
  categories: {
    name: string;
    slug: string;
  } | null;
  views?: number;
}

interface FeaturedNewsProps {
  news: NewsItem[];
}

import { UniversalAdBanner } from "@/components/ads/UniversalAdBanner";

export function FeaturedNews({ news }: FeaturedNewsProps) {
  if (news.length === 0) return null;

  // Destructure for the new layout
  const leadNews = news[0]; // Center massive
  const subLeadNews = news.slice(1, 3); // Center bottom
  const leftColNews = news.slice(3, 5); // Left column (2 items)
  const rightColNews = news.slice(5, 11); // Right column
  
  // Create a placeholder list if right side is empty to retain layout
  const sidebarItems = rightColNews.length > 0 ? rightColNews : news.slice(1, 7);

  const getCategory = (item: NewsItem) => {
    if (!item?.categories) return null;
    return item.categories;
  };

  return (
    <section className="mb-8 newspaper-border shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border">
        
        {/* LEFT COLUMN - Secondary Leads (Col 3) */}
        <div className="lg:col-span-3 flex flex-col p-4 md:p-6 divide-y divide-border/60 order-2 lg:order-1">
          {leftColNews.map((item, idx) => (
            <React.Fragment key={item.id}>
              <Link 
                to={`/news/${item.slug}`} 
                className={cn("group flex flex-col gap-3", idx > 0 ? "pt-5" : "pb-5 first:pt-0")}
              >
                <h3 className="text-lg font-bold text-headline leading-snug group-hover:text-primary transition-colors line-clamp-3">
                  {item.title}
                </h3>
                {sanitizeImageUrl(item.image_url) && (
                  <div className="aspect-[16/9] mt-2 rounded-sm overflow-hidden bg-muted">
                    <img
                      src={sanitizeImageUrl(item.image_url)!}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}
                <p className="text-xs text-muted-foreground font-medium mt-auto">
                  {formatBanglaRelativeTime(item.published_at)}
                </p>
              </Link>
              
              {idx === 0 && (
                <div className="py-5 flex items-center justify-center">
                  <UniversalAdBanner 
                    placement="featured_news_inline" 
                    slot="featured-left-ad" 
                    className="w-full h-auto min-h-[250px] bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center" 
                  />
                </div>
              )}
            </React.Fragment>
          ))}
          {leftColNews.length === 0 && (
             <div className="text-sm text-muted-foreground p-4 text-center">আরও খবর আসছে...</div>
          )}
        </div>

        {/* CENTER COLUMN - Main Lead & Sub-leads (Col 6) */}
        <div className="lg:col-span-6 p-4 md:p-6 flex flex-col order-1 lg:order-2">
           <Link to={`/news/${leadNews.slug}`} className="group block mb-6">
              <div className="relative aspect-[16/10] overflow-hidden mb-5 bg-muted">
                {sanitizeImageUrl(leadNews.image_url) ? (
                  <img
                    src={sanitizeImageUrl(leadNews.image_url)!}
                    alt={leadNews.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Newspaper className="w-16 h-16 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              
              <h2 className="text-3xl md:text-[2.5rem] font-black text-headline leading-[1.2] group-hover:text-primary transition-colors tracking-tight mb-4">
                {leadNews.title}
              </h2>
              
              {(() => {
                const displayExcerpt = leadNews.excerpt || (leadNews.content ? leadNews.content.replace(/<[^>]+>/g, '').substring(0, 300) : null);
                return displayExcerpt ? (
                  <p className="text-foreground text-[1.1rem] leading-[1.65] line-clamp-3 mb-4 font-normal">
                    {displayExcerpt}
                  </p>
                ) : null;
              })()}
              
              <div className="flex items-center gap-3 text-sm font-bold text-muted-foreground">
                <span className="text-accent uppercase tracking-wider">
                  {getCategory(leadNews)?.name || "শীর্ষ সংবাদ"}
                </span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span>{formatBanglaRelativeTime(leadNews.published_at)}</span>
              </div>
           </Link>

           {/* Sub-leads directly below the main lead */}
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-border mt-auto">
              {subLeadNews.map(item => (
                <Link key={item.id} to={`/news/${item.slug}`} className="group flex flex-col gap-3">
                  <div className="aspect-[16/9] overflow-hidden bg-muted">
                     {sanitizeImageUrl(item.image_url) ? (
                        <img src={sanitizeImageUrl(item.image_url)!} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                     ) : (
                         <div className="w-full h-full bg-muted" />
                     )}
                  </div>
                  <h3 className="font-bold text-[1.1rem] leading-snug group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                </Link>
              ))}
           </div>
        </div>

        {/* RIGHT COLUMN - Dense Latest Links (Col 3) */}
        <div className="lg:col-span-3 flex flex-col p-4 md:p-6 bg-slate-50 dark:bg-slate-900 border-t lg:border-t-0 border-border order-3">
          <div className="flex items-center gap-2 mb-4 border-b-2 border-primary pb-3 shrink-0">
            <Zap className="w-5 h-5 text-primary fill-primary" />
            <h3 className="text-xl font-black text-headline tracking-tighter uppercase">হাইল্যাইটস</h3>
          </div>
          
          <div className="flex flex-col flex-1 divide-y divide-border/80 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-muted">
            {sidebarItems.map((item, idx) => (
              <React.Fragment key={item.id}>
                <Link 
                  to={`/news/${item.slug}`} 
                  className="group py-4 first:pt-1 last:pb-2 border-transparent border-l-2 hover:border-primary hover:bg-white dark:hover:bg-slate-800 transition-all pl-2 -ml-2"
                >
                  <div className="flex gap-4 items-start">
                     {sanitizeImageUrl(item.image_url) ? (
                       <div className="w-[60px] h-[45px] sm:w-[84px] sm:h-[60px] flex-shrink-0 rounded overflow-hidden bg-muted">
                         <img
                           src={sanitizeImageUrl(item.image_url)!}
                           alt={item.title}
                           className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                         />
                       </div>
                     ) : (
                       <div className="w-[60px] h-[45px] sm:w-[84px] sm:h-[60px] flex-shrink-0 rounded bg-muted flex items-center justify-center">
                         <span className="text-xl text-primary/20 font-bold">জ</span>
                       </div>
                     )}
                     <div>
                       <h4 className="text-[15px] font-bold text-headline leading-[1.4] group-hover:text-primary transition-colors line-clamp-3 mb-2">
                          {item.title}
                       </h4>
                       <div className="flex items-center gap-4">
                         <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider flex items-center gap-1">
                           <Clock className="w-3 h-3" />
                           {formatBanglaRelativeTime(item.published_at)}
                         </p>
                         {item.views && item.views > 100 && (
                           <span className="text-[10px] font-bold text-primary flex items-center gap-0.5">
                             <TrendingUp className="w-2.5 h-2.5" />
                             জনপ্রিয়
                           </span>
                         )}
                       </div>
                     </div>
                  </div>
                </Link>
                {/* Add a compact ad in the sidebar items */}
                {idx === 2 && (
                  <div className="py-4 px-2">
                     <UniversalAdBanner 
                       placement="sidebar" 
                       slot="highlights-native" 
                       className="rounded-lg shadow-inner bg-slate-100/50 dark:bg-slate-800/30 max-h-[200px] flex items-center justify-center overflow-hidden" 
                       format="rectangle"
                     />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
        
      </div>
    </section>
  );
}
