import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Home, Search, Bookmark, LayoutGrid, ChevronRight, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchDialog } from "@/components/search/SearchDialog";
import { toBanglaNumber } from "@/lib/bangla-utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface MobileNavProps {
  categories: Category[];
}

export function MobileNav({ categories }: MobileNavProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const { data: isAuthorized } = useQuery({
    queryKey: ["user-authorized-mobile-nav"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      
      const { data, error } = await supabase.rpc('check_user_has_admin_role', {
        _user_id: user.id
      });
      
      if (error) {
         console.error("Role check failed:", error);
         return false;
      }
      return data === true;
    },
    staleTime: 1000 * 60 * 15,
  });

  return (
    <>
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
      
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-around h-14 px-1">
          
          <Link
            to="/"
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors",
              isActive("/") ? "text-primary font-black" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            )}
            onClick={() => setSheetOpen(false)}
          >
            <Home className={cn("w-5 h-5 transition-transform", isActive("/") && "scale-110 text-primary stroke-[2.5]")} />
            <span className="text-[10px] font-bold mt-0.5">প্রচ্ছদ</span>
          </Link>

          <Link
            to="/category/all"
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors",
              location.pathname.startsWith("/category") ? "text-primary font-black" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            )}
            onClick={() => setSheetOpen(false)}
          >
            <LayoutGrid className={cn("w-5 h-5 transition-transform", location.pathname.startsWith("/category") && "scale-110 text-primary stroke-[2.5]")} />
            <span className="text-[10px] font-bold mt-0.5">বিভাগ</span>
          </Link>

          {isAuthorized && (
            <Link
              to="/admin/news?create=true"
              className="flex flex-col items-center justify-center w-12 h-12 -mt-4 bg-primary rounded-full text-white shadow-lg shadow-primary/30 border-2 border-white dark:border-slate-950 transition-transform active:scale-95 shrink-0"
              onClick={() => setSheetOpen(false)}
              aria-label="সংবাদ তৈরি"
            >
              <PlusCircle className="w-6 h-6" />
            </Link>
          )}

          <button
            onClick={() => setSearchOpen(true)}
            className="flex flex-col items-center justify-center flex-1 h-full py-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            aria-label="অনুসন্ধান"
          >
            <Search className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-0.5">খুঁজুন</span>
          </button>

          <Link
            to="/bookmarks"
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors",
              isActive("/bookmarks") ? "text-primary font-black" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            )}
            onClick={() => setSheetOpen(false)}
          >
            <Bookmark className={cn("w-5 h-5 transition-transform", isActive("/bookmarks") && "scale-110 text-primary stroke-[2.5]")} />
            <span className="text-[10px] font-bold mt-0.5">সংরক্ষিত</span>
          </Link>

        </div>
      </nav>
    </>
  );
}
