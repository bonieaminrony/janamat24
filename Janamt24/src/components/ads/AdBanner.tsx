interface AdBannerProps {
  slot: string;
  format?: "auto" | "horizontal" | "vertical" | "rectangle";
  className?: string;
}

export function AdBanner({ slot, format = "auto", className = "" }: AdBannerProps) {
  // This is a placeholder for Google AdSense
  // To enable ads:
  // 1. Get your AdSense account approved
  // 2. Add the AdSense script to index.html
  // 3. Replace the slot prop with your actual ad slot ID
  
  return (
    <div className={`ad-wrapper bg-muted/30 border border-divider rounded-lg overflow-hidden max-w-full ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: "block", maxWidth: "100%", overflow: "hidden" }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" // Replace with your AdSense client ID
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
      {/* Placeholder for development */}
      <div className="flex items-center justify-center h-24 text-sm text-subtext">
        বিজ্ঞাপনের স্থান
      </div>
    </div>
  );
}

// Simple text ad placeholder
export function AdPlaceholder({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-secondary border border-divider rounded-lg p-4 text-center ${className}`}>
      <p className="text-xs text-secondary-foreground/70 uppercase tracking-wider mb-1">বিজ্ঞাপন</p>
      <p className="text-sm text-secondary-foreground">
        এখানে আপনার বিজ্ঞাপন দিন
      </p>
    </div>
  );
}
