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
         // Fallback to plain session check or false if RPC fails
         console.error("Role check failed:", error);
         return false;
      }
      return data === true;
    },
    staleTime: 1000 * 60 * 15, // Cache for 15 mins
  });

  return (
    <>
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
      
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 pb-safe">
        <div className="flex items-center justify-around h-16 px-2">
          
          <Link
            to="/"
            className={cn(
              "flex flex-col items-center justify-center w-full h-full space-y-1",
              isActive("/") ? "text-primary" : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            )}
            onClick={() => setSheetOpen(false)}
          >
            <Home className={cn("w-5 h-5", isActive("/") && "fill-primary/20")} />
            <span className="text-[10px] font-bold">হোম</span>
          </Link>

          <button
            onClick={() => setSearchOpen(true)}
            className="flex flex-col items-center justify-center w-full h-full space-y-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            <Search className="w-5 h-5" />
            <span className="text-[10px] font-bold">খুঁজুন</span>
          </button>
          
          {isAuthorized && (
            <Link
              to="/admin/news?create=true"
              className="flex flex-col items-center justify-center w-14 h-14 -mt-6 bg-primary rounded-full text-white shadow-lg shadow-primary/40 border-4 border-white dark:border-slate-950 transition-transform active:scale-90"
              onClick={() => setSheetOpen(false)}
            >
              <PlusCircle className="w-6 h-6" />
            </Link>
          )}

          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <button className="flex flex-col items-center justify-center w-full h-full space-y-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">
                <LayoutGrid className="w-5 h-5" />
                <span className="text-[10px] font-bold">মেনু</span>
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85vw] sm:max-w-sm p-0 flex flex-col border-r-0">
              <SheetHeader className="p-6 border-b border-slate-100 dark:border-slate-800 text-left">
                <SheetTitle className="text-2xl font-black text-slate-900 dark:text-white">সব বিভাগ</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto py-2">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/category/${cat.slug}`}
                    onClick={() => setSheetOpen(false)}
                    className="flex items-center justify-between px-6 py-4 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <span className="font-bold text-slate-700 dark:text-slate-300">{cat.name}</span>
                    <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                  </Link>
                ))}
              </div>
              <div className="p-6 bg-slate-50 dark:bg-slate-900/50 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">© {toBanglaNumber(new Date().getFullYear())} জনমত ২৪ মিডিয়া</p>
              </div>
            </SheetContent>
          </Sheet>

          <Link
            to="/bookmarks"
            className={cn(
              "flex flex-col items-center justify-center w-full h-full space-y-1",
              isActive("/bookmarks") ? "text-primary" : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            )}
            onClick={() => setSheetOpen(false)}
          >
            <Bookmark className={cn("w-5 h-5", isActive("/bookmarks") && "fill-primary/20")} />
            <span className="text-[10px] font-bold">বুকমার্ক</span>
          </Link>

        </div>
      </div>
    </>
  );
}
