import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Zap } from "lucide-react";

export function NewsTicker() {
  const { data: news = [], isLoading, isError } = useQuery({
    queryKey: ["ticker-news"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("id, title, slug")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    retry: 2,
    staleTime: 1000 * 60, // 1 minute
  });

  // Don't show ticker if loading, error, or no news
  if (isLoading || isError || news.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-primary/20 overflow-hidden relative">
      <div className="container px-0 sm:px-4 flex items-center h-10 sm:h-12">
        <div className="flex-shrink-0 flex items-center gap-2 bg-primary text-white px-4 h-full text-[10px] sm:text-xs font-black relative z-20">
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span className="uppercase tracking-widest whitespace-nowrap">ব্রেকিং নিউজ</span>
          {/* Arrow shape */}
          <div className="absolute top-0 right-[-12px] bottom-0 w-0 h-0 border-t-[20px] sm:border-t-[24px] border-t-transparent border-l-[12px] border-l-primary border-b-[20px] sm:border-b-[24px] border-b-transparent" />
        </div>
        
        <div className="overflow-hidden flex-1 relative h-full flex items-center pl-8">
          <div className="flex gap-12 sm:gap-20 animate-marquee hover:[animation-play-state:paused] whitespace-nowrap items-center h-full">
            {news.map((item) => (
              <Link
                key={item.id}
                to={`/news/${item.slug}`}
                className="text-xs sm:text-[13px] font-bold text-slate-700 dark:text-slate-200 hover:text-primary transition-all flex items-center gap-3 group"
              >
                <span className="text-primary font-black opacity-30 group-hover:opacity-100">•</span>
                {item.title}
              </Link>
            ))}
            {/* Duplicate for seamless loop */}
            {news.map((item) => (
              <Link
                key={`dup-${item.id}`}
                to={`/news/${item.slug}`}
                className="text-xs sm:text-[13px] font-bold text-slate-700 dark:text-slate-200 hover:text-primary transition-all flex items-center gap-3 group"
              >
                <span className="text-primary font-black opacity-30 group-hover:opacity-100">•</span>
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

