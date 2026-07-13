import { Link } from "react-router-dom";
import { ChevronRight, Clock, Newspaper, Star } from "lucide-react";
import { formatBanglaRelativeTime } from "@/lib/bangla-utils";
import { sanitizeImageUrl } from "@/lib/url-utils";
import { UniversalAdBanner } from "@/components/ads/UniversalAdBanner";

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
  showAds?: boolean;
}

export function CategoryBlock({ title, categorySlug, news, layout = "grid", showAds = false }: CategoryBlockProps) {
  if (!news || news.length === 0) return null;

  return (
    <div className="mb-0">
      
      {/* Newspaper Style Category Header */}
      <div className="flex items-center justify-between mb-6 border-b border-border">
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

      {layout === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-6">
          {news.slice(0, showAds ? 3 : 4).map((item) => {
            const imgUrl = sanitizeImageUrl(item.image_url);
            return (
              <Link key={item.id} to={`/news/${item.slug}`} className="group flex flex-col gap-3">
                <div className="relative aspect-[4/3] bg-muted border border-border">
                  {imgUrl ? (
                    <img 
                      src={imgUrl} 
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Newspaper className="w-8 h-8 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                
                <h3 className="font-bold text-[1.1rem] text-headline leading-snug group-hover:text-primary transition-colors line-clamp-3">
                  {item.title}
                </h3>
                
                {(() => {
                  const displayExcerpt = item.excerpt || (item.content ? item.content.replace(/<[^>]+>/g, '').substring(0, 200) : null);
                  return displayExcerpt ? (
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed font-medium">
                      {displayExcerpt}
                    </p>
                  ) : null;
                })()}
                
                {item.published_at && (
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 opacity-80 mt-auto">
                    <Clock className="w-3.5 h-3.5" />
                    {formatBanglaRelativeTime(item.published_at)}
                  </span>
                )}
              </Link>
            )
          })}

          {/* Native Grid Ad */}
          {showAds && (
             <div className="group flex flex-col gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 border border-dashed border-border h-full">
                <div className="relative aspect-[4/3] bg-muted border border-border flex items-center justify-center overflow-hidden">
                    <span className="absolute top-0 right-0 bg-primary text-white text-[9px] font-black px-1 z-10 pointer-events-none uppercase">Ad</span>
                    <UniversalAdBanner placement="in_article" slot={`native-grid-${categorySlug}`} className="w-full h-full" format="fluid" />
                </div>
                <div className="flex flex-col mt-auto">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1 mb-1 flex items-center gap-1"><Star className="w-3 h-3"/> স্পনসর্ড</span>
                  <h3 className="font-bold text-[1.1rem] text-muted-foreground leading-snug line-clamp-3">
                    তীব্র গরমে আপনার সন্তানের সুরক্ষায় এখনই অর্ডার করুন
                  </h3>
                </div>
             </div>
          )}
        </div>
      )}

      {layout === "featured-left" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 divide-y lg:divide-y-0 lg:divide-x divide-border">
          
          {/* Main Huge Featured Item (Col 7) */}
          <div className="lg:col-span-7 flex flex-col pr-0 lg:pr-2">
            <Link to={`/news/${news[0].slug}`} className="group block">
              <div className="aspect-[16/10] w-full bg-muted border border-border mb-4 relative">
                {sanitizeImageUrl(news[0].image_url) ? (
                  <img 
                    src={sanitizeImageUrl(news[0].image_url)!} 
                    alt={news[0].title}
                    className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                  />
                ) : (
                  <div className="w-full h-full flex justify-center items-center">
                     <Newspaper className="w-16 h-16 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              
              <h3 className="text-2xl sm:text-[1.8rem] font-bold text-headline leading-[1.3] group-hover:text-primary transition-colors mb-3">
                {news[0].title}
              </h3>
              
              {(() => {
                const displayExcerpt = news[0].excerpt || (news[0].content ? news[0].content.replace(/<[^>]+>/g, '').substring(0, 300) : null);
                return displayExcerpt ? (
                  <p className="text-foreground text-[1.05rem] leading-[1.65] line-clamp-3 mb-4">
                    {displayExcerpt}
                  </p>
                ) : null;
              })()}
              
              {news[0].published_at && (
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-accent" />
                  {formatBanglaRelativeTime(news[0].published_at)}
                </span>
              )}
            </Link>
            {showAds && (
              <div className="group flex flex-col sm:flex-row gap-5 p-4 bg-slate-50 dark:bg-slate-900/50 border border-dashed border-border mt-6 rounded-2xl items-center justify-between">
                <div className="flex flex-col flex-1 order-2 sm:order-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1.5 flex items-center gap-1"><Star className="w-3 h-3 text-primary animate-pulse"/> স্পনসর্ড কন্টেন্ট</span>
                  <h4 className="font-bold text-base text-muted-foreground leading-snug">
                    তীব্র গরমে আপনার সন্তানের সুরক্ষায় এখনই অর্ডার করুন
                  </h4>
                </div>
                <div className="w-full sm:w-[130px] shrink-0 aspect-[16/9] sm:aspect-[4/3] bg-muted border border-border relative flex items-center justify-center overflow-hidden rounded-xl order-1 sm:order-2">
                   <span className="absolute top-0 right-0 bg-primary text-white text-[9px] font-black px-1 z-10 pointer-events-none uppercase">Ad</span>
                   <UniversalAdBanner placement="in_article" slot={`native-sidebar-${categorySlug}`} className="w-full h-full" />
                </div>
              </div>
            )}
          </div>
          
          {/* Sidebar Split Items (Col 5) */}
          <div className="lg:col-span-5 flex flex-col gap-0 divide-y divide-border pl-0 lg:pl-6">
            {news.slice(1, 5).map((item, idx) => {
              const secUrl = sanitizeImageUrl(item.image_url);
              return (
                <Link key={item.id} to={`/news/${item.slug}`} className={`group flex gap-4 ${idx > 0 ? "pt-5" : "pb-5 first:pt-0"} pb-5 last:pb-0`}>
                  <div className="w-[120px] shrink-0">
                    <div className="aspect-[4/3] bg-muted border border-border relative">
                      {secUrl ? (
                        <img 
                          src={secUrl} 
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                        />
                      ) : (
                         <div className="w-full h-full flex items-center justify-center">
                            <Newspaper className="w-5 h-5 text-muted-foreground/30" />
                         </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col flex-1">
                    <h4 className="font-bold text-[1.1rem] text-headline leading-snug group-hover:text-primary transition-colors line-clamp-3 mb-2">
                      {item.title}
                    </h4>
                    
                    {item.published_at && (
                      <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1 mt-auto">
                        <Clock className="w-3 h-3 text-primary/60" />
                        {formatBanglaRelativeTime(item.published_at)}
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
          
        </div>
      )}
    </div>
  );
}
