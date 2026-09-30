import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { SEOHead } from "@/components/seo/SEOHead";
import { NewsCard } from "@/components/news/NewsCard";
import { Bookmark, Inbox, ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface BookmarkItem {
  id: string;
  title: string;
  slug: string;
  image_url: string | null;
  published_at: string | null;
  excerpt?: string;
  views?: number;
}

const BookmarksPage = () => {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = JSON.parse(localStorage.getItem('janamt_bookmarks') || '[]');
      setBookmarks(Array.isArray(saved) ? saved : []);
    } catch (e) {
      console.error("Failed to load bookmarks:", e);
      setBookmarks([]);
    }
  }, []);

  const clearAll = () => {
    if (window.confirm("আপনি কি সব সংরক্ষিত সংবাদ মুছে ফেলতে চান?")) {
      localStorage.setItem('janamt_bookmarks', '[]');
      setBookmarks([]);
      window.dispatchEvent(new CustomEvent('bookmarks-updated'));
      toast.success("সব বুকমার্ক মুছে ফেলা হয়েছে");
    }
  };

  if (!mounted) return null;

  return (
    <PublicLayout>
      <SEOHead 
        title="সংরক্ষিত সংবাদ - জনমত ২৪" 
        description="আপনার সংরক্ষণ করা গুরুত্বপূর্ণ সংবাদগুলো এখানে খুঁজে পাবেন।"
        url="/bookmarks"
      />
      
      <div className="container py-6 sm:py-8 md:py-12 min-h-[65vh]">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 mb-8 sm:mb-12 pb-6 sm:pb-8 border-b border-divider/60">
          <div className="flex items-center gap-3.5 sm:gap-5">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
              <Bookmark className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-headline tracking-tight">সংরক্ষিত সংবাদ</h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-medium">
                {bookmarks.length > 0 ? `আপনি মোট ${bookmarks.length}টি সংবাদ সংরক্ষণ করেছেন` : 'আপনার প্রিয় সংবাদগুলো সেভ করে রাখুন'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 self-end md:self-auto">
            {bookmarks.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearAll}
                className="rounded-full gap-1.5 text-destructive border-destructive/20 hover:bg-destructive/5 hover:border-destructive/40 text-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>সব মুছুন</span>
              </Button>
            )}
            <Button asChild variant="ghost" size="sm" className="rounded-full gap-1.5 hover:bg-muted text-xs">
              <Link to="/">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="font-bold">প্রচ্ছদ</span>
              </Link>
            </Button>
          </div>
        </div>

        {bookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center animate-fade-in">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-muted/40 border border-divider/50 flex items-center justify-center mb-6 shadow-inner">
              <Inbox className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground/30" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-headline mb-2 tracking-tight">কোনো সংবাদ পাওয়া যায়নি</h2>
            <p className="text-muted-foreground text-xs sm:text-sm max-w-sm mb-8 leading-relaxed">
              সংবাদের বিস্তারিত পাতায় গিয়ে "সংরক্ষণ" বাটনে ক্লিক করে আপনি আপনার পছন্দের সংবাদগুলো এখানে জমিয়ে রাখতে পারেন।
            </p>
            <Button asChild size="default" className="rounded-full px-8 shadow-md hover:shadow-primary/20 transition-all font-bold text-sm">
              <Link to="/">সংবাদ পড়ুন</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 animate-fade-in">
            {bookmarks.map((news) => (
              <NewsCard
                key={news.id}
                id={news.id}
                title={news.title}
                slug={news.slug}
                image_url={news.image_url}
                published_at={news.published_at}
                excerpt={news.excerpt || ""}
                views={news.views || 0}
              />
            ))}
          </div>
        )}
      </div>
    </PublicLayout>
  );
};

export default BookmarksPage;
