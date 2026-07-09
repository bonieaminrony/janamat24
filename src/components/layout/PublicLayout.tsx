import { Header } from "./Header";
import { MobileNav } from "./MobileNav";
import { Footer } from "./Footer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UniversalAdBanner } from "@/components/ads/UniversalAdBanner";
import { BackToTop } from "@/components/ui/back-to-top";
import { InstallAppBanner } from "@/components/widgets/InstallAppBanner";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Helmet } from "react-helmet-async";

interface PublicLayoutProps {
  children: React.ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
  
  const { settings } = useSiteSettings();

  return (
    <div className="min-h-screen flex flex-col bg-background relative pb-16 md:pb-0">
      {settings?.ad_system === "google" && (
        <Helmet>
          <script 
            async 
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${settings?.google_client_id || 'ca-pub-1869371645821023'}`}
            crossOrigin="anonymous"
          ></script>
        </Helmet>
      )}
      <Header categories={categories} />
      
      <main className="flex-1 animate-fade-in">{children}</main>
      
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
