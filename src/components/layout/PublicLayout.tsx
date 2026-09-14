import { Header } from "./Header";
import { MobileNav } from "./MobileNav";
import { Footer } from "./Footer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UniversalAdBanner } from "@/components/ads/UniversalAdBanner";
import { BackToTop } from "@/components/ui/back-to-top";
import { InstallAppBanner } from "@/components/widgets/InstallAppBanner";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface PublicLayoutProps {
  children: React.ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    initialData: () => {
      try {
        const cached = localStorage.getItem("janamt_categories_cache");
        if (cached) return JSON.parse(cached);
      } catch (e) {}
      return [];
    },
    staleTime: 1000 * 60 * 30, // 30 minutes cache
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug")
        .order("name");
      if (error) throw error;
      if (data) {
        try {
          localStorage.setItem("janamt_categories_cache", JSON.stringify(data));
        } catch (e) {}
      }
      return data;
    },
  });
  
  const { settings } = useSiteSettings();

  return (
    <div className="min-h-screen flex flex-col bg-background relative pb-16 md:pb-0">
      <Header categories={categories} />
      <main className="flex-1">{children}</main>
      
      {/* Footer Ad Banner */}
      <div className="container py-4">
        <UniversalAdBanner placement="footer" slot="footer-slot-123" />
      </div>
      
      <Footer categories={categories} />
      <InstallAppBanner />
      <MobileNav categories={categories} />
      <BackToTop />
    </div>
  );
}
