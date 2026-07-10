import { Link } from "react-router-dom";
import { Circle } from "lucide-react";

interface BreakingNewsItem {
  id: string;
  title: string;
  slug: string;
}

interface BreakingNewsTickerProps {
  news: BreakingNewsItem[];
}

export function BreakingNewsTicker({ news }: BreakingNewsTickerProps) {
  if (!news || news.length === 0) return null;

  return (
    <div className="w-full bg-white dark:bg-slate-950 pt-2 pb-4">
      <div className="container">
        <div className="flex items-stretch h-11 overflow-hidden relative border border-slate-100 dark:border-slate-800 bg-red-50 dark:bg-red-950/20">
          <div className="bg-[#e6222b] text-white px-5 md:px-7 flex items-center justify-center gap-2 font-bold text-[15px] whitespace-nowrap z-10 shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span>ব্রেকিং নিউজ</span>
          </div>
          
          <div className="flex-1 overflow-hidden relative flex items-center pl-4">
            <div className="flex whitespace-nowrap animate-marquee items-center">
              {/* Repeat news sequence twice to create seamless loop */}
              {[...news, ...news].map((item, idx) => (
                <div key={`${item.id}-${idx}`} className="flex items-center">
                  <Link 
                    to={`/news/${item.slug}`}
                    className="px-4 text-[15px] font-bold text-slate-700 dark:text-slate-300 hover:text-accent dark:hover:text-white transition-colors hover:underline decoration-primary"
                  >
                    {item.title}
                  </Link>
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mx-2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
