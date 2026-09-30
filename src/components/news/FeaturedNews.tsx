import React from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { formatBanglaRelativeTime, toBanglaNumber } from "@/lib/bangla-utils";
import { sanitizeImageUrl } from "@/lib/url-utils";
import { prefetchArticle } from "@/lib/query-client";
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

export function FeaturedNews({ news }: FeaturedNewsProps) {
  if (news.length === 0) return null;

  // Destructure for the layout: strictly newest news is leadNews
  const leadNews = news[0]; // Center massive: #1 latest published news
  const subLeadNews = news.slice(1, 3); // Center bottom sub-leads: #2 and #3 latest news
  const leftColNews = news.slice(3, 5); // Left column: #4 and #5 latest news
  const rightColNews = news.slice(5, 12); // Right column highlights: #6 to #12 latest news
  
  // Create a placeholder list if right side is empty to retain layout
  const sidebarItems = rightColNews.length > 0 ? rightColNews : (news.length > 1 ? news.slice(1, 7) : []);

  const getCategory = (item: NewsItem) => {
    if (!item?.categories) return null;
    return item.categories;
  };

  const handlePrefetch = (slug?: string) => {
    if (slug) prefetchArticle(slug);
  };

  return (
    <section className="mb-6 sm:mb-8 newspaper-border shadow-sm overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border">
        
        {/* LEFT COLUMN - Secondary Leads (Col 3 on desktop) */}
        <div className="lg:col-span-3 flex flex-col p-3 sm:p-4 md:p-6 divide-y divide-border/60 order-2 lg:order-1">
          {leftColNews.map((item, idx) => (
            <React.Fragment key={item.id}>
              <Link 
                to={`/news/${item.slug}`} 
                onMouseEnter={() => handlePrefetch(item.slug)}
                onTouchStart={() => handlePrefetch(item.slug)}
                className={cn("group flex flex-col gap-2.5", idx > 0 ? "pt-4 sm:pt-5" : "pb-4 sm:pb-5 first:pt-0")}
              >
                <h3 className="text-base sm:text-lg font-bold text-headline leading-snug group-hover:text-primary transition-colors line-clamp-3">
                  {item.title}
                </h3>
                {sanitizeImageUrl(item.image_url) && (
                  <div className="aspect-[16/9] mt-1 rounded-sm overflow-hidden bg-muted">
                    <img
                      src={sanitizeImageUrl(item.image_url)!}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}
                <p className="text-xs text-muted-foreground font-medium mt-auto flex items-center gap-1">
                  <Clock className="w-3 h-3 text-primary/60" />
                  {formatBanglaRelativeTime(item.published_at)}
                </p>
              </Link>
            </React.Fragment>
          ))}
          {leftColNews.length === 0 && (
             <div className="text-sm text-muted-foreground p-4 text-center">আরও খবর আসছে...</div>
          )}
        </div>

        {/* CENTER COLUMN - Main Lead & Sub-leads (Col 6 on desktop, Order 1 on mobile) */}
        <div className="lg:col-span-6 p-3 sm:p-4 md:p-6 flex flex-col order-1 lg:order-2">
           <Link 
             to={`/news/${leadNews.slug}`} 
             onMouseEnter={() => handlePrefetch(leadNews.slug)}
             onTouchStart={() => handlePrefetch(leadNews.slug)}
             className="group block mb-5"
           >
              <div className="relative aspect-[16/10] overflow-hidden mb-3 sm:mb-4 bg-muted rounded-sm">
                {sanitizeImageUrl(leadNews.image_url) ? (
                  <img
                    src={sanitizeImageUrl(leadNews.image_url)!}
                    alt={leadNews.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Newspaper className="w-16 h-16 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-[2.2rem] xl:text-[2.4rem] font-black text-headline leading-tight group-hover:text-primary transition-colors tracking-tight mb-2 sm:mb-3">
                {leadNews.title}
              </h2>
              
              <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-muted-foreground mb-3">
                <span className="text-[#e6222b] uppercase tracking-wider font-black">
                  {getCategory(leadNews)?.name || "শীর্ষ সংবাদ"}
                </span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {formatBanglaRelativeTime(leadNews.published_at)}
                </span>
              </div>

              {(() => {
                const displayExcerpt = leadNews.excerpt || (leadNews.content ? leadNews.content.replace(/<[^>]+>/g, '').substring(0, 300) : null);
                return displayExcerpt ? (
                  <p className="text-foreground text-[15px] sm:text-base md:text-[1.05rem] leading-relaxed line-clamp-3 font-normal">
                    {displayExcerpt}
                  </p>
                ) : null;
              })()}
           </Link>

           {/* Sub-leads directly below the main lead */}
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-4 sm:pt-6 border-t border-border mt-auto">
              {subLeadNews.map(item => (
                <Link 
                  key={item.id} 
                  to={`/news/${item.slug}`} 
                  onMouseEnter={() => handlePrefetch(item.slug)}
                  onTouchStart={() => handlePrefetch(item.slug)}
                  className="group flex flex-col gap-2"
                >
                  <div className="aspect-[16/9] overflow-hidden bg-muted rounded-sm">
                     {sanitizeImageUrl(item.image_url) ? (
                        <img src={sanitizeImageUrl(item.image_url)!} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                     ) : (
                         <div className="w-full h-full bg-muted" />
                     )}
                  </div>
                  <h3 className="font-bold text-sm sm:text-base leading-snug group-hover:text-primary transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                </Link>
              ))}
           </div>
        </div>

        {/* RIGHT COLUMN - Highlights (Col 3 on desktop) */}
        <div className="lg:col-span-3 flex flex-col p-3 sm:p-4 md:p-6 bg-slate-50 dark:bg-slate-900 border-t lg:border-t-0 border-border order-3">
          <div className="flex items-center gap-2 mb-3 sm:mb-4 border-b-2 border-primary pb-2.5 shrink-0">
            <Zap className="w-4 h-4 text-primary fill-primary" />
            <h3 className="text-lg sm:text-xl font-black text-headline tracking-tighter uppercase">হাইলাইটস</h3>
          </div>
          
          <div className="flex flex-col flex-1 divide-y divide-border/80 overflow-y-auto">
            {sidebarItems.map((item, idx) => (
              <React.Fragment key={item.id}>
                <Link 
                  to={`/news/${item.slug}`} 
                  onMouseEnter={() => handlePrefetch(item.slug)}
                  onTouchStart={() => handlePrefetch(item.slug)}
                  className="group py-3 sm:py-3.5 first:pt-1 last:pb-1 border-transparent border-l-2 hover:border-primary hover:bg-white dark:hover:bg-slate-800 transition-all pl-2 -ml-2"
                >
                  <div className="flex gap-3 items-start">
                     {sanitizeImageUrl(item.image_url) ? (
                       <div className="w-[70px] h-[52px] sm:w-[80px] sm:h-[58px] flex-shrink-0 rounded overflow-hidden bg-muted">
                         <img
                           src={sanitizeImageUrl(item.image_url)!}
                           alt={item.title}
                           loading="lazy"
                           className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                         />
                       </div>
                     ) : (
                       <div className="w-[70px] h-[52px] sm:w-[80px] sm:h-[58px] flex-shrink-0 rounded bg-muted flex items-center justify-center">
                         <span className="text-lg text-primary/20 font-bold">জ</span>
                       </div>
                     )}
                     <div className="flex-1 min-w-0">
                       <h4 className="text-[13px] sm:text-[14px] font-bold text-headline leading-snug group-hover:text-primary transition-colors line-clamp-2 mb-1.5">
                          {item.title}
                       </h4>
                       <div className="flex items-center gap-3">
                         <p className="text-[10px] text-muted-foreground font-bold flex items-center gap-1">
                           <Clock className="w-2.5 h-2.5" />
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
              </React.Fragment>
            ))}
          </div>
        </div>
        
      </div>
    </section>
  );
}
