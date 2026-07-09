import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface GoogleAdProps {
  slot: string;
  client?: string;
  format?: "auto" | "fluid" | "rectangle" | "vertical" | "horizontal";
  responsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function GoogleAd({
  slot,
  client,
  format = "auto",
  responsive = true,
  className,
  style,
}: GoogleAdProps) {
  const adInited = useRef(false);

  useEffect(() => {
    if (adInited.current) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const adsbygoogle = (window as any).adsbygoogle || [];
      adsbygoogle.push({});
      adInited.current = true;
    } catch (err) {
      console.error("AdSense error:", err);
    }
  }, [slot]);

  return (
    <div className={cn("w-full overflow-hidden my-4 bg-muted/10 rounded-lg flex justify-center items-center relative min-h-[90px]", className)}>
      <span className="absolute top-1 left-2 text-[10px] text-muted-foreground/40 bg-background/50 px-1 rounded z-0 pointer-events-none">
        বিজ্ঞাপন
      </span>
      <ins
        className="adsbygoogle relative z-10 block"
        style={{ display: "block", ...style }}
        data-ad-client={client || "ca-pub-1869371645821023"}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
}
