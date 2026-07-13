import { useSiteSettings } from "@/hooks/useSiteSettings";
import { InternalAdBanner } from "./InternalAdBanner";
import { GoogleAd } from "./GoogleAd";

type PlacementType = string;

interface UniversalAdBannerProps {
  placement: PlacementType;
  slot?: string; // Standard slot ID for GoogleAd if applicable
  newsId?: string; // For internal targeting
  className?: string;
  format?: "auto" | "fluid" | "rectangle" | "vertical" | "horizontal";
  responsive?: boolean;
  index?: number;
  style?: React.CSSProperties;
}

export function UniversalAdBanner({ placement, slot, newsId, className, format, responsive, index, style }: UniversalAdBannerProps) {
  const { settings, isLoading } = useSiteSettings();

  if (isLoading) {
    return (
      <div className={`bg-muted/10 animate-pulse rounded-lg flex items-center justify-center min-h-[90px] ${className || ""}`}>
        <span className="text-xs text-muted-foreground/30">Loading Ad</span>
      </div>
    );
  }

  // If entirely disabled
  if (!settings || settings.ad_system === "none") {
    return null;
  }

  // Show Google Ad if slot is provided. (If they use strict Auto-Ads without slots, 
  // you might just skip this and let Auto-Ads do its magic without hardcoded boxes).
  if (settings.ad_system === "google" && slot) {
    return <GoogleAd slot={slot} client={settings.google_client_id} className={className} format={format} responsive={responsive} />;
  }

  // Fallback / Show Internal Ad
  if (settings.ad_system === "manual") {
    return <InternalAdBanner placement={placement} newsId={newsId} className={className} index={index} style={style} />;
  }

  return null;
}
