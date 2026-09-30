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
          {news.slice(0, 4).map((item) => {
            const imgUrl = sanitizeImageUrl(item.image_url);
            return (
              <Link 
                key={item.id} 
                to={`/news/${item.slug}`} 
                onMouseEnter={() => handlePrefetch(item.slug)}
                onTouchStart={() => handlePrefetch(item.slug)}
                className="group flex flex-col gap-3"
              >
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
        </div>
      )}

      {layout === "featured-left" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 divide-y lg:divide-y-0 lg:divide-x divide-border">
          
          {/* Main Huge Featured Item (Col 7) */}
          <div className="lg:col-span-7 flex flex-col pr-0 lg:pr-2">
            <Link 
              to={`/news/${news[0].slug}`} 
              onMouseEnter={() => handlePrefetch(news[0].slug)}
              onTouchStart={() => handlePrefetch(news[0].slug)}
              className="group block"
            >
              <div className="aspect-[16/10] w-full bg-muted border border-border mb-4 relative overflow-hidden rounded-md">
                {sanitizeImageUrl(news[0].image_url) ? (
                  <img 
                    src={sanitizeImageUrl(news[0].image_url)!} 
                    alt={news[0].title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex justify-center items-center">
                     <Newspaper className="w-16 h-16 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              
              <h3 className="text-xl sm:text-2xl md:text-[1.8rem] font-bold text-headline leading-snug group-hover:text-primary transition-colors mb-2.5">
                {news[0].title}
              </h3>
              
              {(() => {
                const displayExcerpt = news[0].excerpt || (news[0].content ? news[0].content.replace(/<[^>]+>/g, '').substring(0, 300) : null);
                return displayExcerpt ? (
                  <p className="text-foreground/90 text-sm sm:text-base leading-relaxed line-clamp-3 mb-3 font-medium">
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
          </div>
          
          {/* Sidebar Split Items (Col 5) */}
          <div className="lg:col-span-5 flex flex-col gap-0 divide-y divide-border pl-0 lg:pl-6 pt-4 lg:pt-0">
            {news.slice(1, 5).map((item, idx) => {
              const secUrl = sanitizeImageUrl(item.image_url);
              return (
                <Link 
                  key={item.id} 
                  to={`/news/${item.slug}`} 
                  onMouseEnter={() => handlePrefetch(item.slug)}
                  onTouchStart={() => handlePrefetch(item.slug)}
                  className={`group flex gap-3 sm:gap-4 ${idx > 0 ? "pt-4" : "pb-4 first:pt-0"} pb-4 last:pb-0 items-start`}
                >
                  <div className="w-[95px] sm:w-[120px] shrink-0">
                    <div className="aspect-[4/3] bg-muted border border-border relative overflow-hidden rounded-md">
                      {secUrl ? (
                        <img 
                          src={secUrl} 
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                         <div className="w-full h-full flex items-center justify-center">
                            <Newspaper className="w-5 h-5 text-muted-foreground/30" />
                         </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col flex-1 min-w-0">
                    <h4 className="font-bold text-sm sm:text-base text-headline leading-snug group-hover:text-primary transition-colors line-clamp-2 sm:line-clamp-3 mb-1.5">
                      {item.title}
                    </h4>
                    
                    {item.published_at && (
                      <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1 mt-auto">
                        <Clock className="w-3 h-3 text-primary/60 shrink-0" />
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
