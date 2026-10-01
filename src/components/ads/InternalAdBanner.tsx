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
  style?: React.CSSProperties;
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
  home_page_top: "w-full max-w-5xl mx-auto min-h-[90px]",
  home_page_middle: "w-full max-w-5xl mx-auto min-h-[90px] sm:min-h-[100px] md:min-h-[120px] my-6 sm:my-8",
  home_column_center: "w-full mx-auto min-h-[90px]",
  home_feed: "w-full min-h-[90px]",
  featured_news_inline: "w-full h-full flex items-center justify-center",
  article_inline: "w-full max-w-3xl mx-auto my-6 min-h-[90px] sm:min-h-[120px]",
  article_side: "w-full min-h-[250px]",
  article_bottom: "w-full max-w-4xl mx-auto min-h-[90px] sm:min-h-[110px] my-6",
  article_related: "w-full max-w-3xl mx-auto my-6 min-h-[90px]",
  quran_top_banner: "w-full max-w-4xl mx-auto min-h-[60px] md:min-h-[90px]",
  quran_side_square: "w-full min-h-[200px]",
  header: "w-full max-w-4xl mx-auto min-h-[50px] sm:min-h-[70px] md:min-h-[90px] flex items-center justify-center",
  sidebar: "w-full min-h-0 flex items-center justify-center",
  in_article: "w-full max-w-2xl mx-auto my-6 min-h-[90px] sm:min-h-[120px]",
  footer: "w-full max-w-5xl mx-auto min-h-[90px] sm:min-h-[110px]",
  related_news_inline: "w-full h-full min-h-[200px]",
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

const isPlacementMatched = (banner: any, targetPlacement: string): boolean => {
  const rawAltText = banner.alt_text;
  if (rawAltText) {
    if (rawAltText.startsWith("[") && rawAltText.endsWith("]")) {
      try {
        const placements = JSON.parse(rawAltText);
        if (Array.isArray(placements)) {
          if (placements.includes(targetPlacement)) return true;
          if (targetPlacement === "featured_news_inline" && (placements.includes("sidebar") || placements.includes("in_article") || placements.includes("article_side"))) {
            return true;
          }
        }
      } catch (e) {
        // Fallback on JSON error
      }
    }
    const list = rawAltText.split(",").map((p: string) => p.trim());
    if (list.includes(targetPlacement)) return true;
    if (targetPlacement === "featured_news_inline" && (list.includes("sidebar") || list.includes("in_article") || list.includes("article_side"))) {
      return true;
    }
  }
  return banner.placement_type === targetPlacement || 
         rawAltText === targetPlacement ||
         (targetPlacement === "featured_news_inline" && (banner.placement_type === "sidebar" || banner.placement_type === "in_article"));
};

export function InternalAdBanner({ placement, newsId, className, index, style }: InternalAdBannerProps) {
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

        // Filter banners by placement and active status
        const filteredBanners: AdBanner[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data?.forEach((nap: any) => {
          if (nap.ad_partners?.is_active) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            nap.ad_partners.ad_banners?.forEach((banner: any) => {
              if (banner.is_active && isPlacementMatched(banner, placement)) {
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

      // If no newsId, get all active banners
      const { data, error } = await supabase
        .from("ad_banners")
        .select(`
          id,
          image_url,
          link_url,
          alt_text,
          placement_type,
          is_active,
          ad_partners!inner (
            id,
            name,
            is_active
          )
        `)
        .eq("is_active", true);

      if (error) throw error;

      // Filter for active partners and match exact placement
      return (data || [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((banner: any) => {
          const isActive = banner.ad_partners?.is_active;
          if (!isActive) return false;
          return isPlacementMatched(banner, placement);
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((banner: any) => ({
          id: banner.id,
          image_url: banner.image_url,
          link_url: banner.link_url,
          alt_text: banner.alt_text,
          ad_partners: banner.ad_partners,
        })) as AdBanner[];
    },
    staleTime: 10 * 1000, // 10 seconds cache
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

    // Gentle 12-second interval to avoid distracting page flashing
    const interval = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % banners.length);
    }, 12000);

    return () => clearInterval(interval);
  }, [banners.length, index]);

  if (isLoading) {
    return (
      <div className={cn("bg-muted/20 rounded-xl animate-pulse flex items-center justify-center", placementStyles[placement], className)} />
    );
  }

  if (banners.length === 0) {
    if (placement === 'related_news_inline' || placement === 'featured_news_inline') {
      return null;
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
      <div className={cn("w-full flex flex-col gap-2 box-border relative rounded-xl overflow-hidden bg-slate-50/60 dark:bg-slate-900/30 border border-border/40 p-2 sm:p-3 shadow-xs", placementStyles[placement], className)} style={style}>
        <span className="absolute top-1.5 right-2 bg-background/80 dark:bg-slate-900/80 text-muted-foreground text-[9px] font-bold px-1.5 py-0.5 rounded z-10 uppercase tracking-widest border border-border/40 backdrop-blur-sm pointer-events-none">
          বিজ্ঞাপন
        </span>
        
        <div className="flex w-full gap-2 sm:gap-3 h-32 sm:h-40 md:h-52 items-center justify-center">
          {/* Left: 1 Big Image */}
          <div className="w-1/2 h-full flex items-center justify-center bg-slate-100/60 dark:bg-slate-900/60 rounded-lg overflow-hidden">
            {links[0] && sanitizeLinkUrl(links[0]) !== '#' ? (
              <a href={sanitizeLinkUrl(links[0])} target="_blank" rel="noopener noreferrer sponsored" className="flex items-center justify-center w-full h-full hover:opacity-95 transition-opacity" onClick={handleClick}>
                <img src={images[0]} alt="Ad 1" className="w-full h-full object-contain rounded-lg" loading="lazy" />
              </a>
            ) : (
              <div className="w-full h-full flex items-center justify-center" onClick={handleClick}>
                <img src={images[0]} alt="Ad 1" className="w-full h-full object-contain rounded-lg cursor-pointer" loading="lazy" />
              </div>
            )}
          </div>
          
          {/* Right: 2 Smaller Stacked Images */}
          <div className="w-1/2 flex flex-col gap-2 sm:gap-2.5 h-full">
            {/* Top Right Image */}
            <div className="w-full h-[calc(50%-0.25rem)] sm:h-[calc(50%-0.3125rem)] flex items-center justify-center bg-slate-100/60 dark:bg-slate-900/60 rounded-lg overflow-hidden">
              {links[1] && sanitizeLinkUrl(links[1]) !== '#' ? (
                <a href={sanitizeLinkUrl(links[1])} target="_blank" rel="noopener noreferrer sponsored" className="flex items-center justify-center w-full h-full hover:opacity-95 transition-opacity" onClick={handleClick}>
                  <img src={images[1] || images[0]} alt="Ad 2" className="w-full h-full object-contain rounded-lg" loading="lazy" />
                </a>
              ) : (
                <div className="w-full h-full flex items-center justify-center" onClick={handleClick}>
                  <img src={images[1] || images[0]} alt="Ad 2" className="w-full h-full object-contain rounded-lg cursor-pointer" loading="lazy" />
                </div>
              )}
            </div>
            
            {/* Bottom Right Image */}
            <div className="w-full h-[calc(50%-0.25rem)] sm:h-[calc(50%-0.3125rem)] flex items-center justify-center bg-slate-100/60 dark:bg-slate-900/60 rounded-lg overflow-hidden">
              {links[2] && sanitizeLinkUrl(links[2]) !== '#' ? (
                <a href={sanitizeLinkUrl(links[2])} target="_blank" rel="noopener noreferrer sponsored" className="flex items-center justify-center w-full h-full hover:opacity-95 transition-opacity" onClick={handleClick}>
                  <img src={images[2] || images[0]} alt="Ad 3" className="w-full h-full object-contain rounded-lg" loading="lazy" />
                </a>
              ) : (
                <div className="w-full h-full flex items-center justify-center" onClick={handleClick}>
                  <img src={images[2] || images[0]} alt="Ad 3" className="w-full h-full object-contain rounded-lg cursor-pointer" loading="lazy" />
                </div>
              )}
            </div>
          </div>
        </div>

        {randomBanner.ad_partners?.name && (
          <div className="text-center w-full mt-0.5">
            <span className="font-bold text-xs sm:text-sm text-muted-foreground">{randomBanner.ad_partners.name}</span>
          </div>
        )}
      </div>
    );
  }

  const content = (
    <img
      src={randomBanner.image_url}
      alt={randomBanner.alt_text || "বিজ্ঞাপন"}
      className={cn(
        "max-w-full rounded-xl transition-transform hover:scale-[1.005] shadow-xs",
        placement === 'header'
          ? "h-full w-full object-contain" 
          : placement === 'featured_news_inline'
            ? "max-h-full max-w-full w-auto h-auto object-contain mx-auto"
            : "h-auto w-full object-contain bg-slate-50 dark:bg-slate-900/40"
      )}
      loading="lazy"
    />
  );

  return (
    <div className={cn("relative overflow-hidden max-w-full box-border rounded-xl", placementStyles[placement], className)} style={style}>
      <span className="absolute top-1.5 right-2 bg-background/80 dark:bg-slate-900/80 text-muted-foreground text-[9px] font-bold px-1.5 py-0.5 rounded z-10 uppercase tracking-widest border border-border/40 backdrop-blur-sm pointer-events-none">
        বিজ্ঞাপন
      </span>
      {randomBanner.link_url && sanitizeLinkUrl(randomBanner.link_url) !== '#' ? (
        <a
          href={sanitizeLinkUrl(randomBanner.link_url)}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="flex items-center justify-center w-full h-full hover:opacity-95 transition-opacity"
          onClick={handleClick}
        >
          {content}
        </a>
      ) : (
        <div onClick={handleClick} className="flex items-center justify-center w-full h-full cursor-pointer">
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
