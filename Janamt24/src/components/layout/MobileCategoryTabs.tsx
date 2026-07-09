import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface MobileCategoryTabsProps {
  categories: Category[];
}

export function MobileCategoryTabs({ categories }: MobileCategoryTabsProps) {
  const location = useLocation();

  const isActive = (slug: string) => {
    if (slug === "/") return location.pathname === "/";
    return location.pathname === `/category/${slug}`;
  };

  return (
    <div className="lg:hidden w-full bg-slate-50 dark:bg-slate-900 border-b border-border relative z-20">
      <div className="flex px-4 overflow-x-auto no-scrollbar items-center h-12 gap-6 snap-x">
        <Link
          to="/"
          className={cn(
            "shrink-0 text-[16px] font-bold whitespace-nowrap transition-colors relative h-full flex items-center snap-start",
            isActive("/") ? "text-primary" : "text-slate-600 dark:text-slate-400 hover:text-foreground"
          )}
        >
          প্রচ্ছদ
          {isActive("/") && (
            <span className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t flex" />
          )}
        </Link>
        
        {categories.map((cat) => (
          <Link
            key={cat.id}
            to={`/category/${cat.slug}`}
            className={cn(
              "shrink-0 text-[16px] font-bold whitespace-nowrap transition-colors relative h-full flex items-center snap-start",
              isActive(cat.slug) ? "text-primary" : "text-slate-600 dark:text-slate-400 hover:text-foreground"
            )}
          >
            {cat.name}
            {isActive(cat.slug) && (
              <span className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t flex" />
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
