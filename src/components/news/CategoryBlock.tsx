import { Link } from "react-router-dom";
import { ChevronRight, Clock, Newspaper } from "lucide-react";
import { formatBanglaRelativeTime } from "@/lib/bangla-utils";
import { sanitizeImageUrl } from "@/lib/url-utils";
import { prefetchArticle } from "@/lib/query-client";

interface NewsItem {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string | null;
  image_url?: string | null;
  published_at?: string | null;
}

interface CategoryBlockProps {
  title: string;
  categorySlug: string;
  news: NewsItem[];
  layout?: "grid" | "featured-left";
}

export function CategoryBlock({ title, categorySlug, news, layout = "grid" }: CategoryBlockProps) {
  if (!news || news.length === 0) return null;

  const handlePrefetch = (slug?: string) => {
    if (slug) prefetchArticle(slug);
  };

  const mobileLeadNews = news[0];
  const mobileGridNews = news.slice(1, 7); // up to 6 subsequent news in 2-col grid

  return (
    <div className="mb-0">
      
      {/* Newspaper Style Category Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6 border-b border-border">
        <h2 className="text-xl md:text-2xl font-black text-headline border-t-4 border-primary pt-2 px-2 shrink-0 bg-background -mb-[1px]">
          {title}
        </h2>
        
        <Link 
          to={`/category/${categorySlug}`}
          className="text-xs font-bold text-muted-foreground hover:text-primary flex items-center gap-1 uppercase tracking-widest transition-colors pb-2"
        >
          আরও
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* ========================================================================= */}
      {/* 1. DESKTOP VIEW (hidden lg:block) - Preserved Original Layouts */}
      {/* ========================================================================= */}
      <div className="hidden lg:block">
        {layout === "grid" && (
          <div className="grid grid-cols-4 gap-4">
            {news.slice(0, 4).map((item) => {
              const imgUrl = sanitizeImageUrl(item.image_url);
              return (
                <Link 
                  key={`desktop-grid-${item.id}`} 
                  to={`/news/${item.slug}`} 
                  onMouseEnter={() => handlePrefetch(item.slug)}
                  onTouchStart={() => handlePrefetch(item.slug)}
                  className="group flex flex-col justify-between h-full bg-white dark:bg-slate-900 p-3 border border-border/80 hover:border-primary/40 transition-all rounded-xs shadow-xs"
                >
                  <div>
                    <div className="relative aspect-[16/10] bg-muted border border-border/60 rounded-xs overflow-hidden mb-2.5">
                      {imgUrl ? (
                        <img 
                          src={imgUrl} 
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Newspaper className="w-8 h-8 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    
                    <h3 className="font-bold text-[15px] text-headline leading-snug group-hover:text-primary transition-colors line-clamp-2 mb-1.5">
                      {item.title}
                    </h3>
                    
                    {(() => {
                      const displayExcerpt = item.excerpt || (item.content ? item.content.replace(/<[^>]+>/g, '').substring(0, 180) : null);
                      return displayExcerpt ? (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-normal mb-2">
                          {displayExcerpt}
                        </p>
                      ) : null;
                    })()}
                  </div>
                  
                  {item.published_at && (
                    <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1 mt-auto pt-2 border-t border-border/40">
                      <Clock className="w-3 h-3 text-primary/60" />
                      {formatBanglaRelativeTime(item.published_at)}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}

        {layout === "featured-left" && (
          <div className="grid grid-cols-12 gap-6 bg-white dark:bg-slate-900 p-4 border border-border/80 rounded-xs shadow-xs">
            
            {/* Main Huge Featured Item (Col 7) */}
            <div className="col-span-7 flex flex-col justify-between pr-3 border-r border-border/80">
              <Link 
                to={`/news/${news[0].slug}`} 
                onMouseEnter={() => handlePrefetch(news[0].slug)}
                onTouchStart={() => handlePrefetch(news[0].slug)}
                className="group flex flex-col justify-between h-full"
              >
                <div>
                  <div className="aspect-[16/10] w-full bg-muted border border-border mb-3 relative overflow-hidden rounded-xs">
                    {sanitizeImageUrl(news[0].image_url) ? (
                      <img 
                        src={sanitizeImageUrl(news[0].image_url)!} 
                        alt={news[0].title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex justify-center items-center">
                         <Newspaper className="w-16 h-16 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  
                  <h3 className="text-xl md:text-2xl font-bold text-headline leading-snug group-hover:text-primary transition-colors mb-2">
                    {news[0].title}
                  </h3>
                  
                  {(() => {
                    const displayExcerpt = news[0].excerpt || (news[0].content ? news[0].content.replace(/<[^>]+>/g, '').substring(0, 240) : null);
                    return displayExcerpt ? (
                      <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 mb-3 font-normal">
                        {displayExcerpt}
                      </p>
                    ) : null;
                  })()}
                </div>
                
                {news[0].published_at && (
                  <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 mt-auto pt-2 border-t border-border/40">
                    <Clock className="w-3.5 h-3.5 text-primary/70" />
                    {formatBanglaRelativeTime(news[0].published_at)}
                  </span>
                )}
              </Link>
            </div>
            
            {/* Sidebar Split Items (Col 5) */}
            <div className="col-span-5 flex flex-col justify-between divide-y divide-border/70 pl-3">
              {news.slice(1, 5).map((item, idx) => {
                const secUrl = sanitizeImageUrl(item.image_url);
                return (
                  <Link 
                    key={`desktop-split-${item.id}`} 
                    to={`/news/${item.slug}`} 
                    onMouseEnter={() => handlePrefetch(item.slug)}
                    onTouchStart={() => handlePrefetch(item.slug)}
                    className={`group flex gap-3 ${idx === 0 ? "pb-3" : idx === news.slice(1, 5).length - 1 ? "pt-3" : "py-3"} items-start flex-1`}
                  >
                    <div className="w-[100px] shrink-0">
                      <div className="aspect-[4/3] bg-muted border border-border/70 relative overflow-hidden rounded-xs">
                        {secUrl ? (
                          <img 
                            src={secUrl} 
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                           <div className="w-full h-full flex items-center justify-center">
                              <Newspaper className="w-5 h-5 text-muted-foreground/30" />
                           </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col flex-1 min-w-0 justify-between h-full">
                      <h4 className="font-bold text-[14px] text-headline leading-snug group-hover:text-primary transition-colors line-clamp-2 mb-1">
                        {item.title}
                      </h4>
                      
                      {item.published_at && (
                        <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1 mt-auto">
                          <Clock className="w-2.5 h-2.5 text-primary/60 shrink-0" />
                          {formatBanglaRelativeTime(item.published_at)}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
            
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. MOBILE VIEW (block lg:hidden) - 1 Big Latest + 2-Column Grid */}
      {/* ========================================================================= */}
      <div className="block lg:hidden">
        
        {/* Step 1: Category Latest 1 Big News */}
        {mobileLeadNews && (
          <div className="bg-white dark:bg-slate-900 border border-border/80 p-3 rounded-xs mb-3 shadow-xs">
            <Link
              to={`/news/${mobileLeadNews.slug}`}
              onMouseEnter={() => handlePrefetch(mobileLeadNews.slug)}
              onTouchStart={() => handlePrefetch(mobileLeadNews.slug)}
              className="group block"
            >
              <div className="aspect-[16/10] w-full bg-muted border border-border mb-2.5 relative overflow-hidden rounded-xs">
                {sanitizeImageUrl(mobileLeadNews.image_url) ? (
                  <img
                    src={sanitizeImageUrl(mobileLeadNews.image_url)!}
                    alt={mobileLeadNews.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex justify-center items-center">
                    <Newspaper className="w-12 h-12 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              
              <h3 className="text-base sm:text-lg font-bold text-headline leading-snug group-hover:text-primary transition-colors mb-1.5">
                {mobileLeadNews.title}
              </h3>
              
              {(() => {
                const displayExcerpt = mobileLeadNews.excerpt || (mobileLeadNews.content ? mobileLeadNews.content.replace(/<[^>]+>/g, '').substring(0, 180) : null);
                return displayExcerpt ? (
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-2 font-normal">
                    {displayExcerpt}
                  </p>
                ) : null;
              })()}

              {mobileLeadNews.published_at && (
                <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1 pt-1.5 border-t border-border/40">
                  <Clock className="w-3 h-3 text-primary/60" />
                  {formatBanglaRelativeTime(mobileLeadNews.published_at)}
                </span>
              )}
            </Link>
          </div>
        )}

        {/* Step 2: Remaining News in 2-Column Grid */}
        {mobileGridNews.length > 0 && (
          <div className="grid grid-cols-2 gap-2.5">
            {mobileGridNews.map((item) => {
              const imgUrl = sanitizeImageUrl(item.image_url);
              return (
                <Link
                  key={`mobile-cat-grid-${item.id}`}
                  to={`/news/${item.slug}`}
                  onMouseEnter={() => handlePrefetch(item.slug)}
                  onTouchStart={() => handlePrefetch(item.slug)}
                  className="group flex flex-col justify-between h-full bg-white dark:bg-slate-900 p-2 sm:p-2.5 border border-border/80 rounded-xs shadow-xs"
                >
                  <div>
                    <div className="relative aspect-[16/10] bg-muted border border-border/60 rounded-xs overflow-hidden mb-2">
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Newspaper className="w-6 h-6 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    
                    <h4 className="font-bold text-xs sm:text-[13px] text-headline leading-snug group-hover:text-primary transition-colors line-clamp-2 mb-1">
                      {item.title}
                    </h4>
                  </div>

                  {item.published_at && (
                    <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1 mt-auto pt-1 border-t border-border/40">
                      <Clock className="w-2.5 h-2.5 text-primary/60" />
                      {formatBanglaRelativeTime(item.published_at)}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
