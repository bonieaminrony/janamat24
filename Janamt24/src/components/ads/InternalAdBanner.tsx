import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { sanitizeLinkUrl } from "@/lib/url-utils";

type PlacementType = string;

interface InternalAdBannerProps {
  placement: PlacementType;
  newsId?: string;
  className?: string;
  index?: number;
}

interface AdBanner {
  id: string;
  image_url: string;
  link_url: string | null;
  alt_text: string | null;
  ad_partners: {
    id: string;
    name: string;
  } | null;
}

const placementStyles: Record<string, string> = {
  home_page_top: "w-full max-w-4xl mx-auto",
  home_page_middle: "w-full max-w-4xl mx-auto",
  home_column_center: "w-full mx-auto",
  home_feed: "w-full",
  featured_news_inline: "w-full max-w-3xl mx-auto my-4",
  article_inline: "w-full max-w-3xl mx-auto my-6",
  article_side: "w-full",
  article_related: "w-full max-w-3xl mx-auto my-6",
  quran_top_banner: "w-full max-w-4xl mx-auto",
  quran_side_square: "w-full",
  header: "w-full max-w-4xl mx-auto",
  sidebar: "w-full",
  in_article: "w-full max-w-2xl mx-auto my-6",
  footer: "w-full max-w-4xl mx-auto",
  related_news_inline: "w-full h-full min-h-[250px]",
};

// Get or create session ID for click tracking
function getSessionId(): string {
  let sessionId = sessionStorage.getItem("ad_session_id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem("ad_session_id", sessionId);
  }
  return sessionId;
}

// Track ad click
async function trackAdClick(bannerId: string, placement: PlacementType, newsId?: string) {
  try {
    const sessionId = getSessionId();
    await supabase.from("ad_banner_clicks").insert({
      banner_id: bannerId,
      session_id: sessionId,
      placement_type: placement,
      news_id: newsId || null,
    });
  } catch (error) {
    console.error("Failed to track ad click:", error);
  }
}

export function InternalAdBanner({ placement, newsId, className, index }: InternalAdBannerProps) {
  const { data: banners = [], isLoading } = useQuery({
    queryKey: ["internal-ads", placement, newsId],
    queryFn: async () => {
      // If newsId is provided, get ads from selected partners for that article
      if (newsId) {
        const { data, error } = await supabase
          .from("news_ad_partners")
          .select(`
            partner_id,
            ad_partners!inner (
              id,
              name,
              is_active,
              ad_banners!inner (
                id,
                image_url,
                link_url,
                alt_text,
                placement_type,
                is_active
              )
            )
          `)
          .eq("news_id", newsId);

        if (error) throw error;

        // Map current exact placements to legacy placements so old ads still show up
        const legacyMap: Record<string, string[]> = {
          header: ["header", "home_page_top"],
          sidebar: ["sidebar", "home_page_middle"],
          in_article: ["in_article", "home_column_center", "home_feed", "featured_news_inline"],
          article_inline: ["article_inline", "in_article", "home_column_center", "home_feed", "featured_news_inline"],
          article_side: ["article_side", "sidebar", "home_page_middle"],
        };
        const targetPlacements = legacyMap[placement] || [placement];

        // Filter banners by placement and active status
        const filteredBanners: AdBanner[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data?.forEach((nap: any) => {
          if (nap.ad_partners?.is_active) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            nap.ad_partners.ad_banners?.forEach((banner: any) => {
              if (targetPlacements.includes(banner.placement_type) && banner.is_active) {
                filteredBanners.push({
                  id: banner.id,
                  image_url: banner.image_url,
                  link_url: banner.link_url,
                  alt_text: banner.alt_text,
                  ad_partners: {
                    id: nap.ad_partners.id,
                    name: nap.ad_partners.name,
                  },
                });
              }
            });
          }
        });

        return filteredBanners;
      }

      // Map current exact placements to legacy placements so old ads still show up
      const legacyMap: Record<string, string[]> = {
        header: ["header", "home_page_top"],
        sidebar: ["sidebar", "home_page_middle"],
        in_article: ["in_article", "home_column_center", "home_feed", "featured_news_inline"],
        article_inline: ["article_inline", "in_article", "home_column_center", "home_feed", "featured_news_inline"],
        article_side: ["article_side", "sidebar", "home_page_middle"],
      };
      
      const targetPlacements = legacyMap[placement] || [placement];

      // If no newsId, get all active banners for this placement
      const { data, error } = await supabase
        .from("ad_banners")
        .select(`
          id,
          image_url,
          link_url,
          alt_text,
          ad_partners!inner (
            id,
            name,
            is_active
          )
        `)
        .in("placement_type", targetPlacements)
        .eq("is_active", true);

      if (error) throw error;

      // Filter for active partners
      return (data || [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((banner: any) => banner.ad_partners?.is_active)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((banner: any) => ({
          id: banner.id,
          image_url: banner.image_url,
          link_url: banner.link_url,
          alt_text: banner.alt_text,
          ad_partners: banner.ad_partners,
        })) as AdBanner[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  // Rotation logic
  const [currentAdIndex, setCurrentAdIndex] = useState(0);

  // Update initial index when banners load or index prop changes
  useEffect(() => {
    if (index !== undefined && banners.length > 0) {
      setCurrentAdIndex(index % banners.length);
    }
  }, [index, banners.length]);

  useEffect(() => {
    // If only one banner or index is strictly provided and we shouldn't rotate
    if (banners.length <= 1 || index !== undefined) return;

    // Pattern: 2s, 3s, 1s, 3s, 2s
    const intervals = [2000, 3000, 1000, 3000, 2000];
    let timeoutId: NodeJS.Timeout;
    let step = 0;

    const scheduleNext = () => {
      timeoutId = setTimeout(() => {
        setCurrentAdIndex((prev) => (prev + 1) % banners.length);
        step = (step + 1) % intervals.length;
        scheduleNext();
      }, intervals[step]);
    };

    scheduleNext();

    return () => clearTimeout(timeoutId);
  }, [banners.length, index]);

  if (isLoading) {
    return (
      <div className={cn("bg-muted/30 rounded-lg animate-pulse", placementStyles[placement], className)} />
    );
  }

  if (banners.length === 0) {
    if (placement === 'related_news_inline' || placement === 'featured_news_inline') {
      // Fallback to article_side (which falls back to sidebar) if no specific ad is uploaded yet
      return <InternalAdBanner placement="article_side" newsId={newsId} className={className} index={index} />;
    }
    return null; // Don't show anything if no ads
  }

  const randomBanner = banners[currentAdIndex] || banners[0];

  const handleClick = () => {
    trackAdClick(randomBanner.id, placement, newsId);
  };

  const isTripleAd = randomBanner.image_url?.startsWith('[');

  if (isTripleAd) {
    let images = ["", "", ""];
    let links = ["", "", ""];
    try {
      images = JSON.parse(randomBanner.image_url);
      if (randomBanner.link_url) {
        links = JSON.parse(randomBanner.link_url);
      }
    } catch(e) {
      console.warn("Failed to parse ad banner JSON", e);
    }

    return (
      <div className={cn("w-full flex flex-col gap-4 py-4 box-border relative", placementStyles[placement], className)}>
        <span className="absolute top-0 right-0 bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-bl-lg rounded-tr-xl z-10 uppercase tracking-widest">
          Sponsored
        </span>
        
        <div className="flex w-full gap-4 h-64 md:h-80 lg:h-96">
          <div className="w-1/2 h-full">
            {links[0] && sanitizeLinkUrl(links[0]) !== '#' ? (
              <a href={sanitizeLinkUrl(links[0])} target="_blank" rel="noopener noreferrer sponsored" className="block w-full h-full hover:opacity-95 transition-opacity" onClick={handleClick}>
                <img src={images[0]} alt="Ad 1" className="w-full h-full object-cover rounded-xl" loading="lazy" />
              </a>
            ) : (
              <div className="w-full h-full" onClick={handleClick}><img src={images[0]} alt="Ad 1" className="w-full h-full object-cover rounded-xl cursor-pointer" loading="lazy" /></div>
            )}
          </div>
          
          <div className="w-1/2 flex flex-col gap-4 h-full">
            <div className="w-full h-[calc(50%-0.5rem)]">
              {links[1] && sanitizeLinkUrl(links[1]) !== '#' ? (
                <a href={sanitizeLinkUrl(links[1])} target="_blank" rel="noopener noreferrer sponsored" className="block w-full h-full hover:opacity-95 transition-opacity" onClick={handleClick}>
                  <img src={images[1] || images[0]} alt="Ad 2" className="w-full h-full object-cover rounded-xl" loading="lazy" />
                </a>
              ) : (
                <div className="w-full h-full" onClick={handleClick}><img src={images[1] || images[0]} alt="Ad 2" className="w-full h-full object-cover rounded-xl cursor-pointer" loading="lazy" /></div>
              )}
            </div>
            
            <div className="w-full h-[calc(50%-0.5rem)]">
              {links[2] && sanitizeLinkUrl(links[2]) !== '#' ? (
                <a href={sanitizeLinkUrl(links[2])} target="_blank" rel="noopener noreferrer sponsored" className="block w-full h-full hover:opacity-95 transition-opacity" onClick={handleClick}>
                  <img src={images[2] || images[0]} alt="Ad 3" className="w-full h-full object-cover rounded-xl" loading="lazy" />
                </a>
              ) : (
                <div className="w-full h-full" onClick={handleClick}><img src={images[2] || images[0]} alt="Ad 3" className="w-full h-full object-cover rounded-xl cursor-pointer" loading="lazy" /></div>
              )}
            </div>
          </div>
        </div>

        <div className="text-center w-full mt-2">
          <h3 className="font-bold text-xl">{randomBanner.ad_partners?.name}</h3>
        </div>
        <div className="flex items-center justify-center w-full mt-2">
          <div className="h-[1px] bg-slate-200 dark:bg-slate-700 w-12 mr-4"></div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sponsored Section</span>
          <div className="h-[1px] bg-slate-200 dark:bg-slate-700 w-12 ml-4"></div>
        </div>
      </div>
    );
  }

  const isSquare = ['sidebar', 'article_side', 'quran_side_square'].includes(placement);

  const content = (
    <img
      src={randomBanner.image_url}
      alt={randomBanner.alt_text || "বিজ্ঞাপন"}
      className={cn(
        "w-full max-w-full rounded-lg transition-transform hover:scale-[1.01] shadow-sm",
        placement === 'header' 
          ? "h-full w-full object-contain" 
          : "h-auto w-full object-contain bg-slate-50 dark:bg-slate-800/50"
      )}
      loading="lazy"
    />
  );

  return (
    <div className={cn("relative overflow-hidden max-w-full box-border", placementStyles[placement], className)}>
      <span className="absolute top-0 right-0 bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-bl-lg rounded-tr-xl z-10 uppercase tracking-widest">
        Sponsored
      </span>
      {randomBanner.link_url && sanitizeLinkUrl(randomBanner.link_url) !== '#' ? (
        <a
          href={sanitizeLinkUrl(randomBanner.link_url)}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="block w-full h-full hover:opacity-95 transition-opacity"
          onClick={handleClick}
        >
          {content}
        </a>
      ) : (
        <div onClick={handleClick} className="cursor-pointer">
          {content}
        </div>
      )}
    </div>
  );
}

// Component for in-article ads (to be placed after 2-3 paragraphs)
export function InArticleAd({ newsId, className }: { newsId: string; className?: string }) {
  return (
    <div className={cn("not-prose", className)}>
      <InternalAdBanner placement="in_article" newsId={newsId} />
    </div>
  );
}
