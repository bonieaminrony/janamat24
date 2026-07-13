import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { SEOHead } from "@/components/seo/SEOHead";
import { NewsCard } from "@/components/news/NewsCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Newspaper, Facebook, Twitter, ArrowLeft, Calendar } from "lucide-react";
import { sanitizeImageUrl, sanitizeLinkUrl } from "@/lib/url-utils";
import { formatBanglaDate } from "@/lib/bangla-utils";

interface AuthorProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  role: "admin" | "editor" | null;
  facebook_url: string | null;
  twitter_url: string | null;
  created_at: string;
}

interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  image_url: string | null;
  published_at: string | null;
  created_at: string;
  views: number | null;
  categories: { name: string; slug: string } | null;
}

const roleLabels: Record<string, string> = {
  admin: "সম্পাদক",
  editor: "সহ-সম্পাদক",
};

export default function AuthorPage() {
  const { userId } = useParams<{ userId: string }>();

  // Fetch author profile
  const { data: author, isLoading: authorLoading } = useQuery({
    queryKey: ["author-profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as AuthorProfile;
    },
    enabled: !!userId,
  });

  // Fetch author's articles
  const { data: articles = [], isLoading: articlesLoading } = useQuery({
    queryKey: ["author-articles", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("id, title, slug, excerpt, content, image_url, published_at, created_at, views, categories(name, slug)")
        .eq("author_id", userId)
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (error) throw error;
      return data as NewsArticle[];
    },
    enabled: !!userId,
  });

  const displayRole = author?.role ? (roleLabels[author.role] || author.role) : "প্রতিবেদক";
  const initials = author?.full_name ? author.full_name.split(' ').map(n => n[0]).join('').slice(0, 2) : '';
  const hasSocialLinks = author?.facebook_url || author?.twitter_url;

  if (authorLoading) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-6 mb-8">
              <Skeleton className="w-24 h-24 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (!author) {
    return (
      <PublicLayout>
        <SEOHead title="প্রতিবেদক পাওয়া যায়নি | জনমত ২৪" />
        <div className="container mx-auto px-4 py-16 text-center">
          <User className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold text-headline mb-2">প্রতিবেদক পাওয়া যায়নি</h1>
          <p className="text-subtext mb-6">এই প্রতিবেদকের তথ্য পাওয়া যায়নি</p>
          <Button asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              হোম পেজে ফিরে যান
            </Link>
          </Button>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <SEOHead 
        title={`${author.full_name || "প্রতিবেদক"} - জনমত ২৪`}
        description={author.bio || `${author.full_name} এর সকল সংবাদ পড়ুন জনমত ২৪ তে`}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back button */}
          <Button variant="ghost" size="sm" className="mb-6" asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              হোম পেজে ফিরে যান
            </Link>
          </Button>

          {/* Author Header */}
          <div className="bg-card border border-divider rounded-xl p-6 sm:p-8 mb-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <Avatar className="w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 ring-4 ring-primary/10">
                <AvatarImage 
                  src={sanitizeImageUrl(author.avatar_url) || undefined} 
                  alt={author.full_name || "প্রতিবেদক"} 
                />
                <AvatarFallback className="bg-primary/10 text-primary text-3xl font-semibold">
                  {initials || <User className="w-12 h-12" />}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-headline">
                    {author.full_name}
                  </h1>
                  <Badge variant="secondary" className="text-sm">
                    {displayRole}
                  </Badge>
                </div>

                {author.bio ? (
                  <p className="text-subtext leading-relaxed mb-4 max-w-2xl">
                    {author.bio}
                  </p>
                ) : (
                  <p className="text-muted-foreground italic mb-4">
                    {author.full_name} জনমত ২৪ এর একজন নিবেদিত {displayRole}।
                  </p>
                )}

                {/* Stats */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm text-subtext">
                    <Newspaper className="w-4 h-4" />
                    <span className="font-medium text-headline">{articles.length}</span> টি সংবাদ
                  </div>
                  <div className="flex items-center gap-2 text-sm text-subtext">
                    <Calendar className="w-4 h-4" />
                    যোগদান: {formatBanglaDate(author.created_at)}
                  </div>
                </div>

                {/* Social Media Links */}
                {hasSocialLinks && (
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    {author.facebook_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-4 gap-2"
                        asChild
                      >
                        <a 
                          href={sanitizeLinkUrl(author.facebook_url)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <Facebook className="w-4 h-4 text-[#1877F2]" />
                          ফেসবুক
                        </a>
                      </Button>
                    )}
                    {author.twitter_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-4 gap-2"
                        asChild
                      >
                        <a 
                          href={sanitizeLinkUrl(author.twitter_url)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <Twitter className="w-4 h-4 text-[#1DA1F2]" />
                          টুইটার
                        </a>
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Articles Section */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-headline mb-1">
              {author.full_name} এর সংবাদসমূহ
            </h2>
            <p className="text-subtext text-sm">
              মোট {articles.length} টি প্রকাশিত সংবাদ
            </p>
          </div>

          {articlesLoading ? (
            <div className="grid gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="w-32 h-24 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-12 bg-muted/30 rounded-lg">
              <Newspaper className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-subtext">এই প্রতিবেদকের কোনো প্রকাশিত সংবাদ নেই</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {articles.map((article) => (
                <NewsCard
                  key={article.id}
                  id={article.id}
                  title={article.title}
                  slug={article.slug}
                  excerpt={article.excerpt}
                  image_url={article.image_url}
                  published_at={article.published_at}
                  views={article.views || 0}
                  category={article.categories}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
