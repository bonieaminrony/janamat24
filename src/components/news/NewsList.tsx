import { NewsCard } from "./NewsCard";
import { Newspaper, Sparkles, Clock, Zap } from "lucide-react";

interface NewsItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content?: string | null;
  image_url: string | null;
  published_at: string | null;
  views: number;
  categories: {
    name: string;
    slug: string;
  } | null;
}

interface NewsListProps {
  news: NewsItem[];
  title?: string;
  variant?: "default" | "compact" | "horizontal";
  showTitle?: boolean;
}

export function NewsList({ news, title = "সর্বশেষ সংবাদ", variant = "horizontal", showTitle = true }: NewsListProps) {
  if (news.length === 0) {
    return (
      <div className="text-center py-16 bg-gradient-to-b from-muted/30 to-muted/10 rounded-2xl border border-border">
        <div className="w-16 h-16 rounded-2xl bg-muted mx-auto mb-4 flex items-center justify-center">
          <Newspaper className="w-8 h-8 text-muted-foreground/50" />
        </div>
        <p className="text-muted-foreground text-lg font-medium">কোনো সংবাদ পাওয়া যায়নি</p>
        <p className="text-sm text-muted-foreground/70 mt-1">নতুন সংবাদের জন্য অপেক্ষা করুন</p>
      </div>
    );
  }

  return (
    <section>
      {showTitle && (
        <div className="flex items-center justify-between mb-7 pb-5 border-b-2 border-border/50">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/85 flex items-center justify-center shadow-lg shadow-primary/20">
                <Clock className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-accent flex items-center justify-center shadow-sm">
                <Zap className="w-3 h-3 text-accent-foreground" />
              </div>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-headline tracking-tight">{title}</h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">সকল সর্বশেষ আপডেট</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground bg-muted/60 px-4 py-2 rounded-xl border border-border/50">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-medium">লাইভ</span>
          </div>
        </div>
      )}
      <div className="space-y-1">
        {news.map((item, index) => (
          <div 
            key={item.id}
            className="animate-fade-in"
            style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
          >
            <NewsCard
              id={item.id}
              title={item.title}
              slug={item.slug}
              excerpt={item.excerpt}
              content={item.content}
              image_url={item.image_url}
              published_at={item.published_at}
              views={item.views}
              category={item.categories}
              variant={variant}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
