import React from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { formatBanglaRelativeTime, toBanglaNumber } from "@/lib/bangla-utils";
import { sanitizeImageUrl } from "@/lib/url-utils";
import { prefetchArticle } from "@/lib/query-client";
import { Clock, TrendingUp, Newspaper, ChevronRight, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { UniversalAdBanner } from "@/components/ads/UniversalAdBanner";

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
  const leadNews = news[0]; // #1 latest published news
  const subLeadNews = news.slice(1, 3); // #2 and #3 latest news
  const leftColNews = news.slice(3, 6); // #4, #5, #6 latest news (3 balanced cards on desktop)
  const rightColNews = news.slice(6, 13); // #7 to #13 latest news (7 cards on desktop)
  
  // Mobile layout: 1 lead (news[0]) + 6 news (news.slice(1, 7)) in 2-column + highlights (news.slice(7, 14) or rightColNews)
  const mobileNext6News = news.slice(1, Math.min(7, news.length));
  const mobileHighlights = news.length > 7 ? news.slice(7, 14) : (rightColNews.length > 0 ? rightColNews : (news.length > 3 ? news.slice(3) : []));

  // Placeholder list if right side is empty to retain layout
  const desktopSidebarItems = rightColNews.length > 0 ? rightColNews : (news.length > 3 ? news.slice(3) : (news.length > 1 ? news.slice(1) : []));
  const mobileSidebarItems = mobileHighlights.length > 0 ? mobileHighlights : desktopSidebarItems;

  const getCategory = (item: NewsItem) => {
    if (!item?.categories) return null;
    return item.categories;
  };

  const handlePrefetch = (slug?: string) => {
    if (slug) prefetchArticle(slug);
  };

  return (
    <section className="mb-6 sm:mb-8 newspaper-border shadow-xs bg-white dark:bg-slate-900 overflow-hidden rounded-sm">
      
      {/* ========================================================================= */}
      {/* 1. DESKTOP VIEW (hidden lg:grid) - 100% Preserved 3-Column Balanced Layout */}
      {/* ========================================================================= */}
      <div className="hidden lg:grid lg:grid-cols-12 divide-x divide-border">
        
        {/* LEFT COLUMN - Secondary Leads (Col 3 on desktop) */}
        <div className="lg:col-span-3 flex flex-col justify-between p-4 md:p-5 divide-y divide-border/70 h-full">
          {leftColNews.map((item, idx) => (
            <React.Fragment key={`desktop-left-${item.id}`}>
              <Link 
                to={`/news/${item.slug}`} 
                onMouseEnter={() => handlePrefetch(item.slug)}
                onTouchStart={() => handlePrefetch(item.slug)}
                className={cn(
                  "group flex flex-col justify-between flex-1",
                  idx === 0 ? "pb-3.5" : idx === leftColNews.length - 1 ? "pt-3.5" : "py-3.5"
                )}
              >
                <div>
                  <h3 className="text-[15px] sm:text-base font-bold text-headline leading-snug group-hover:text-primary transition-colors line-clamp-2 mb-2">
                    {item.title}
                  </h3>
                  {sanitizeImageUrl(item.image_url) && (
                    <div className="aspect-[16/9] rounded-xs overflow-hidden bg-muted mb-2">
                      <img
                        src={sanitizeImageUrl(item.image_url)!}
                        alt={item.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  {item.excerpt && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-2 font-normal">
                      {item.excerpt}
                    </p>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1 mt-auto">
                  <Clock className="w-3 h-3 text-primary/60" />
                  {formatBanglaRelativeTime(item.published_at)}
                </p>
              </Link>
            </React.Fragment>
          ))}
        </div>

        {/* CENTER COLUMN - Main Lead & Sub-leads (Col 6 on desktop) */}
        <div className="lg:col-span-6 p-4 md:p-6 flex flex-col justify-between">
           <Link 
             to={`/news/${leadNews.slug}`} 
             onMouseEnter={() => handlePrefetch(leadNews.slug)}
             onTouchStart={() => handlePrefetch(leadNews.slug)}
             className="group block mb-5"
           >
              <div className="relative aspect-[16/10] overflow-hidden mb-3.5 bg-muted rounded-xs">
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
              
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-[2.1rem] xl:text-[2.3rem] font-black text-headline leading-tight group-hover:text-primary transition-colors tracking-tight mb-2 sm:mb-2.5">
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
                  <p className="text-foreground text-[15px] sm:text-base leading-relaxed line-clamp-3 font-normal">
                    {displayExcerpt}
                  </p>
                ) : null;
              })()}
           </Link>

           {/* Sub-leads directly below the main lead */}
           <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border mt-auto">
              {subLeadNews.map(item => (
                <Link 
                  key={`desktop-sub-${item.id}`} 
                  to={`/news/${item.slug}`} 
                  onMouseEnter={() => handlePrefetch(item.slug)}
                  onTouchStart={() => handlePrefetch(item.slug)}
                  className="group flex flex-col gap-2"
                >
                  <div className="aspect-[16/9] overflow-hidden bg-muted rounded-xs">
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
        <div className="lg:col-span-3 flex flex-col p-4 md:p-5 bg-slate-50 dark:bg-slate-900 h-full">
          <div className="flex items-center gap-2 mb-3.5 border-b-2 border-primary pb-2.5 shrink-0">
            <Zap className="w-4 h-4 text-primary fill-primary" />
            <h3 className="text-lg sm:text-xl font-black text-headline tracking-tighter uppercase">হাইলাইটস</h3>
          </div>
          
          <div className="flex flex-col flex-1 divide-y divide-border/80">
            {desktopSidebarItems.map((item, idx) => (
              <React.Fragment key={`desktop-high-${item.id}`}>
                <Link 
                  to={`/news/${item.slug}`} 
                  onMouseEnter={() => handlePrefetch(item.slug)}
                  onTouchStart={() => handlePrefetch(item.slug)}
                  className="group py-3 first:pt-1 last:pb-1 border-transparent border-l-2 hover:border-primary hover:bg-white dark:hover:bg-slate-800 transition-all pl-2 -ml-2"
                >
                  <div className="flex gap-2.5 items-start">
                     {sanitizeImageUrl(item.image_url) ? (
                       <div className="w-[75px] h-[54px] flex-shrink-0 rounded-xs overflow-hidden bg-muted">
                         <img
                           src={sanitizeImageUrl(item.image_url)!}
                           alt={item.title}
                           loading="lazy"
                           className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                         />
                       </div>
                     ) : (
                       <div className="w-[75px] h-[54px] flex-shrink-0 rounded-xs bg-muted flex items-center justify-center">
                         <span className="text-lg text-primary/20 font-bold">জ</span>
                       </div>
                     )}
                     <div className="flex-1 min-w-0">
                       <h4 className="text-[13px] font-bold text-headline leading-snug group-hover:text-primary transition-colors line-clamp-2 mb-1">
                          {item.title}
                       </h4>
                       <div className="flex items-center gap-2.5">
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

                {/* Highlights Advertisement Card - between 3rd and 4th news */}
                {idx === 2 && (
                  <div className="py-2.5 border-transparent border-l-2 pl-2 -ml-2">
                    <div className="relative w-full rounded-xs overflow-hidden bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 h-[125px] xl:h-[140px] flex items-center justify-center group shadow-xs">
                      <UniversalAdBanner 
                        placement="featured_news_inline" 
                        slot="3344556677"
                        className="w-full h-full object-contain rounded-xs !my-0 !min-h-0"
                      />
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MOBILE VIEW (block lg:hidden) - 1 Big Latest -> 6 News 2-Col -> Highlights */}
      {/* ========================================================================= */}
      <div className="block lg:hidden divide-y divide-border">
        
        {/* Step 1: Latest 1 News (১টি বড় Latest News ১ কলামে) */}
        <div className="p-3 sm:p-4 bg-white dark:bg-slate-900">
          <Link 
            to={`/news/${leadNews.slug}`} 
            onMouseEnter={() => handlePrefetch(leadNews.slug)}
            onTouchStart={() => handlePrefetch(leadNews.slug)}
            className="group block"
          >
            <div className="relative aspect-[16/10] overflow-hidden mb-3 bg-muted rounded-xs">
              {sanitizeImageUrl(leadNews.image_url) ? (
                <img
                  src={sanitizeImageUrl(leadNews.image_url)!}
                  alt={leadNews.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="eager"
                  fetchPriority="high"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Newspaper className="w-12 h-12 text-muted-foreground/30" />
                </div>
              )}
            </div>
            
            <h2 className="text-lg sm:text-xl font-black text-headline leading-snug group-hover:text-primary transition-colors tracking-tight mb-2">
              {leadNews.title}
            </h2>
            
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground mb-2">
              <span className="text-[#e6222b] uppercase tracking-wider font-black">
                {getCategory(leadNews)?.name || "শীর্ষ সংবাদ"}
              </span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                {formatBanglaRelativeTime(leadNews.published_at)}
              </span>
            </div>

            {(() => {
              const displayExcerpt = leadNews.excerpt || (leadNews.content ? leadNews.content.replace(/<[^>]+>/g, '').substring(0, 220) : null);
              return displayExcerpt ? (
                <p className="text-foreground text-xs sm:text-sm leading-relaxed line-clamp-2 font-normal">
                  {displayExcerpt}
                </p>
              ) : null;
            })()}
          </Link>
        </div>

        {/* Step 2: Next 6 News (পরের ৬টি News ২টি করে পাশাপাশি 2-column grid-এ) */}
        {mobileNext6News.length > 0 && (
          <div className="p-3 bg-slate-50/70 dark:bg-slate-900/60">
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              {mobileNext6News.map((item) => (
                <Link 
                  key={`mobile-grid-${item.id}`} 
                  to={`/news/${item.slug}`} 
                  onMouseEnter={() => handlePrefetch(item.slug)}
                  onTouchStart={() => handlePrefetch(item.slug)}
                  className="group flex flex-col justify-between h-full bg-white dark:bg-slate-900 p-2 sm:p-2.5 border border-border/80 rounded-xs shadow-xs"
                >
                  <div>
                    <div className="aspect-[16/10] overflow-hidden bg-muted rounded-xs mb-2">
                      {sanitizeImageUrl(item.image_url) ? (
                        <img 
                          src={sanitizeImageUrl(item.image_url)!} 
                          alt="" 
                          loading="lazy" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Newspaper className="w-6 h-6 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-bold text-xs sm:text-[13px] text-headline leading-snug group-hover:text-primary transition-colors line-clamp-2 mb-1">
                      {item.title}
                    </h3>
                  </div>
                  
                  {item.published_at && (
                    <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1 mt-auto pt-1 border-t border-border/40">
                      <Clock className="w-2.5 h-2.5 text-primary/60" />
                      {formatBanglaRelativeTime(item.published_at)}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Highlights Section (Highlights) */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-2 mb-3 border-b-2 border-primary pb-2 shrink-0">
            <Zap className="w-4 h-4 text-primary fill-primary" />
            <h3 className="text-base sm:text-lg font-black text-headline tracking-tighter uppercase">হাইলাইটস</h3>
          </div>
          
          <div className="flex flex-col divide-y divide-border/80">
            {mobileSidebarItems.map((item, idx) => (
              <React.Fragment key={`mobile-high-${item.id}`}>
                <Link 
                  to={`/news/${item.slug}`} 
                  onMouseEnter={() => handlePrefetch(item.slug)}
                  onTouchStart={() => handlePrefetch(item.slug)}
                  className="group py-2.5 first:pt-0.5 last:pb-0.5 border-transparent border-l-2 hover:border-primary transition-all pl-1.5 -ml-1.5"
                >
                  <div className="flex gap-2.5 items-start">
                    {sanitizeImageUrl(item.image_url) ? (
                      <div className="w-[68px] h-[50px] flex-shrink-0 rounded-xs overflow-hidden bg-muted">
                        <img
                          src={sanitizeImageUrl(item.image_url)!}
                          alt={item.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="w-[68px] h-[50px] flex-shrink-0 rounded-xs bg-muted flex items-center justify-center">
                        <span className="text-base text-primary/20 font-bold">জ</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[13px] font-bold text-headline leading-snug group-hover:text-primary transition-colors line-clamp-2 mb-1">
                        {item.title}
                      </h4>
                      <div className="flex items-center gap-2.5">
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

                {/* Highlights Advertisement Card - between 3rd and 4th news */}
                {idx === 2 && (
                  <div className="py-3 border-transparent border-l-2 pl-1.5 -ml-1.5 flex justify-center w-full">
                    <div className="w-[70%] max-w-[280px] mx-auto flex items-center justify-center rounded-xs overflow-hidden bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 p-1 shadow-xs">
                      <UniversalAdBanner 
                        placement="featured_news_inline" 
                        slot="3344556677"
                        className="w-full h-auto max-h-[160px] object-contain rounded-xs !my-0 !min-h-0 flex items-center justify-center"
                      />
                    </div>
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
