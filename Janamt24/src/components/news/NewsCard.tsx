import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Eye, Share2, BookOpen, ArrowRight, Bookmark } from "lucide-react";
import { formatBanglaRelativeTime, toBanglaNumber } from "@/lib/bangla-utils";
import { sanitizeImageUrl } from "@/lib/url-utils";
import { cn } from "@/lib/utils";

interface NewsCardProps {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content?: string | null;
  image_url: string | null;
  published_at: string | null;
  views: number;
  category?: {
    name: string;
    slug: string;
  } | null;
  variant?: "default" | "compact" | "horizontal";
}

export function NewsCard({
  title,
  slug,
  excerpt,
  content,
  image_url,
  published_at,
  views,
  category,
  variant = "default",
}: NewsCardProps) {
  const safeImageUrl = sanitizeImageUrl(image_url);
  const readingTime = Math.max(1, Math.ceil(title.length / 15));
  
  // Create a display excerpt by falling back to stripped content if excerpt is missing
  const displayExcerpt = excerpt || (content ? content.replace(/<[^>]+>/g, '').substring(0, 300) : null);
  
  // Safely extract category data if it comes as an array from Supabase
  const categoryData = Array.isArray(category) ? category[0] : category;
  
  if (variant === "compact") {
    return (
      <Link
        to={`/news/${slug}`}
        className="group flex flex-col gap-2 py-4 border-b border-border last:border-0 hover:bg-muted/10 px-2 -mx-2 transition-colors duration-200"
      >
        <div className="flex-1 min-w-0">
          {categoryData && (
            <Badge variant="secondary" className="mb-2 text-[10px] font-medium px-2 py-0.5 rounded-full">
              {categoryData.name}
            </Badge>
          )}
          <h3 className="font-semibold text-foreground leading-snug group-hover:text-primary transition-colors duration-300 line-clamp-2">
            {title}
          </h3>
          {published_at && (
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-medium mt-2">
              <span className="flex items-center gap-1.5 opacity-80">
                <Calendar className="w-3 h-3" />
                {formatBanglaRelativeTime(published_at)}
              </span>
              <span className="flex items-center gap-1.5 opacity-80">
                <Eye className="w-3.5 h-3.5 opacity-60" />
                {toBanglaNumber(views)}
              </span>
            </div>
          )}
        </div>
      </Link>
    );
  }

  if (variant === "horizontal") {
    return (
      <Link
        to={`/news/${slug}`}
        className="group flex flex-col sm:flex-row gap-4 sm:gap-6 py-6 border-b border-border/60 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors duration-200 px-2 sm:px-4 -mx-2 sm:-mx-4 last:border-0"
      >
        {safeImageUrl ? (
          <div className="w-full sm:w-[180px] md:w-[260px] aspect-video flex-shrink-0 bg-muted overflow-hidden relative">
            <img
              src={safeImageUrl}
              alt={title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        ) : (
          <div className="w-full sm:w-[180px] md:w-[260px] aspect-video flex-shrink-0 bg-muted flex items-center justify-center">
            <span className="text-4xl text-primary/20 font-bold">জ</span>
          </div>
        )}
        <div className="flex-1 min-w-0 flex flex-col">
          <h3 className="font-bold text-headline leading-tight group-hover:text-primary transition-colors line-clamp-2 text-[1.1rem] md:text-[1.3rem] mb-2.5">
            {title}
          </h3>
          {displayExcerpt && (
            <p className="text-[14px] md:text-[15px] text-muted-foreground line-clamp-3 md:line-clamp-4 leading-relaxed mb-3 font-medium">
              {displayExcerpt}
            </p>
          )}
          <div className="mt-auto pt-1">
            <span className="text-[14px] text-[#e6222b] font-bold">
              বিস্তারিত
            </span>
          </div>
        </div>
      </Link>
    );
  }

  // Default card variant - grid style with enhanced smart design
  return (
    <Link
      to={`/news/${slug}`}
      className="group block bg-white dark:bg-slate-900 border border-border hover:border-primary/30 transition-colors duration-300 overflow-hidden flex flex-col h-full"
    >
      <div className="aspect-[16/10] overflow-hidden relative">
        {safeImageUrl ? (
          <img
            src={safeImageUrl}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-600"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-4xl text-muted-foreground/20 font-bold">জ</span>
          </div>
        )}
        
        {/* Category badge on image removed for cleaner look, handled below image */}
      </div>
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        {categoryData && (
          <Badge className="w-fit text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 mb-2 uppercase tracking-widest border-0">
            {categoryData.name}
          </Badge>
        )}
        <h3 className="font-bold text-headline leading-snug group-hover:text-primary transition-colors line-clamp-2 mb-3 text-lg tracking-tight">
          {title}
        </h3>
        {displayExcerpt && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-5 leading-relaxed">
            {displayExcerpt}
          </p>
        )}
        <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground mt-auto pt-4 border-t border-border">
          <div className="flex items-center gap-3">
            {published_at && (
              <span className="flex items-center gap-1.5 opacity-80">
                <Clock className="w-3.5 h-3.5 text-primary/60" />
                {formatBanglaRelativeTime(published_at)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
