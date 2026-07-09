import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, X, ArrowUpDown, TrendingUp, Newspaper, Clock, Hash, ChevronRight, CornerDownLeft } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatBanglaRelativeTime } from "@/lib/bangla-utils";
import { cn } from "@/lib/utils";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const { data: searchResults = [], isLoading } = useQuery({
    queryKey: ["search-news-modern", searchQuery],
    queryFn: async () => {
      if (searchQuery.trim().length < 2) return [];
      
      let queryBuilder = supabase
        .from("news")
        .select("id, title, slug, image_url, published_at, categories(name, slug)")
        .eq("status", "published");

      const keywords = searchQuery.trim().split(/\s+/);
      keywords.forEach(kw => {
        queryBuilder = queryBuilder.or(`title.ilike.%${kw}%,excerpt.ilike.%${kw}%`);
      });

      const { data, error } = await queryBuilder
        .order("published_at", { ascending: false })
        .limit(6);
      
      if (error) throw error;
      return data;
    },
    enabled: searchQuery.trim().length >= 2,
  });

  const handleResultClick = (slug: string) => {
    onOpenChange(false);
    setSearchQuery("");
    navigate(`/news/${slug}`);
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (searchQuery.trim().length >= 2) {
      onOpenChange(false);
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const trendingTags = ["রাজনীতি", "খেলাধুলা", "শিক্ষা", "বিনোদন", "প্রযুক্তি", "পরদেশ"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 border-none bg-transparent shadow-none top-[15%] translate-y-0">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-3xl rounded-[2.5rem] border border-white/40 dark:border-slate-800/40 shadow-[0_32px_128px_-12px_rgba(0,0,0,0.2)] overflow-hidden animate-in fade-in zoom-in-95 duration-500">
          
          {/* Spotlight Input Area */}
          <div className="relative group p-6 lg:p-8 border-b border-slate-100 dark:border-slate-800/50">
            <Search className={cn(
              "absolute left-10 lg:left-12 top-1/2 -translate-y-1/2 h-6 w-6 transition-all duration-500",
              searchQuery ? "text-primary scale-110" : "text-slate-300 dark:text-slate-600"
            )} />
            <Input
              placeholder="আপনি কি খুঁজছেন?"
              className="pl-14 lg:pl-16 h-14 bg-transparent border-none focus-visible:ring-0 text-xl lg:text-2xl font-bold text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-500 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            <div className="absolute right-10 lg:right-12 top-1/2 -translate-y-1/2 flex items-center gap-3">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                <span>ESC</span>
              </div>
            </div>
          </div>

          <div className="p-4 lg:p-6 lg:pt-4 max-h-[65vh] overflow-y-auto custom-scrollbar">
            {/* Zero State / Suggestions */}
            {!searchQuery && (
              <div className="space-y-8 py-4 px-4 bg-muted/20 rounded-3xl animate-in fade-in slide-in-from-top-4 duration-700">
                <div>
                   <div className="flex items-center gap-2 mb-4 text-[11px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-[0.2em]">
                      <TrendingUp className="w-3.5 h-3.5" />
                      জনপ্রিয় সার্চ ট্যাগ
                   </div>
                   <div className="flex flex-wrap gap-2.5">
                      {trendingTags.map((tag, idx) => (
                        <button
                          key={tag}
                          onClick={() => setSearchQuery(tag)}
                          className={cn(
                            "group flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-[13px] font-bold text-slate-600 dark:text-slate-300 hover:bg-primary/5 hover:border-primary/20 hover:text-primary transition-all duration-300 shadow-sm",
                            `animate-in fade-in slide-in-from-left-${(idx + 1) * 2} duration-700`
                          )}
                        >
                          <Hash className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-primary transition-colors" />
                          {tag}
                        </button>
                      ))}
                   </div>
                </div>

                <div className="pt-2">
                   <div className="flex items-center gap-2 mb-4 text-[11px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-[0.2em]">
                      <Clock className="w-3.5 h-3.5" />
                      দ্রুত এক্সেস
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button onClick={() => navigate('/category/all')} className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 hover:border-primary/20 hover:bg-primary/5 transition-all group">
                         <span className="font-bold text-slate-700 dark:text-slate-300">সব খবর দেখুন</span>
                         <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </button>
                      <button onClick={() => navigate('/bookmarks')} className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 hover:border-primary/20 hover:bg-primary/5 transition-all group">
                         <span className="font-bold text-slate-700 dark:text-slate-300">সংরক্ষিত সংবাদ</span>
                         <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </button>
                   </div>
                </div>
              </div>
            )}

            {/* Results Section */}
            {searchQuery.trim().length >= 2 && (
              <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                {isLoading ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-400">
                    <div className="w-8 h-8 border-3 border-slate-100 dark:border-slate-800 border-t-primary rounded-full animate-spin" />
                    <p className="font-bold text-sm tracking-widest uppercase">অনুসন্ধান করা হচ্ছে...</p>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="py-20 text-center animate-in zoom-in-95">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                       <Search className="w-8 h-8 text-slate-200 dark:text-slate-700" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">কোনো ফলাফল পাওয়া যায়নি</h3>
                    <p className="text-slate-400 text-sm font-medium">অন্য কোনো কী-ওয়ার্ড দিয়ে চেষ্টা করুন</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-4 px-4 text-[11px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-[0.2em]">
                       <Newspaper className="w-3.5 h-3.5" />
                       অনুসন্ধানের ফলাফল ({searchResults.length})
                    </div>
                    <div className="space-y-2 pb-4">
                      {searchResults.map((result, idx) => (
                        <button
                          key={result.id}
                          onClick={() => handleResultClick(result.slug)}
                          className={cn(
                            "w-full flex items-center gap-4 p-3 rounded-2xl bg-white/40 dark:bg-white/5 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-100 dark:hover:border-slate-700 hover:shadow-xl transition-all group/res",
                             `animate-in fade-in slide-in-from-bottom-${idx + 1} duration-500`
                          )}
                        >
                          {result.image_url && (
                            <div className="relative shrink-0">
                               <img
                                 src={result.image_url}
                                 alt={result.title}
                                 className="w-24 h-16 object-cover rounded-xl shadow-md group-hover/res:scale-105 transition-transform duration-500"
                               />
                               <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-xl" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-center gap-2 mb-1">
                               <span className="text-[10px] font-black text-primary uppercase bg-primary/5 px-2 py-0.5 rounded-md">
                                 {result.categories?.name || "সংবাদ"}
                               </span>
                               {result.published_at && (
                                 <span className="text-[10px] font-bold text-slate-400 dark:text-slate-600">
                                   • {formatBanglaRelativeTime(result.published_at)}
                                 </span>
                               )}
                            </div>
                            <h4 className="font-bold text-slate-900 dark:text-white line-clamp-2 text-sm lg:text-base leading-snug group-hover/res:text-accent transition-colors">
                              {result.title}
                            </h4>
                          </div>
                          <div className="hidden lg:flex shrink-0 opacity-0 group-hover/res:opacity-100 -translate-x-2 group-hover/res:translate-x-0 transition-all">
                             <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                                <ChevronRight className="w-4 h-4" />
                             </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Footer UI - Command Area */}
          {(searchResults.length > 0) && (
            <div className="p-4 bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-600 ml-4 hidden md:block">
                 উপরের যেকোনো একটি সংবাদ নির্বাচন করুন
              </p>
              <button
                onClick={handleSearchSubmit}
                className="w-full md:w-auto h-11 px-8 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-primary text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-black/10 transition-all flex items-center justify-center gap-2 group/all"
              >
                সব ফলাফল দেখুন
                <ArrowUpDown className="w-4 h-4 group-hover/all:rotate-180 transition-transform duration-500" />
                <div className="hidden sm:flex items-center gap-1.5 ml-2 py-0.5 px-1.5 rounded bg-white/10">
                   <CornerDownLeft className="w-3 h-3" />
                   <span>ENTER</span>
                </div>
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}