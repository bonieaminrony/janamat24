import { useEffect } from "react";
import { MessageSquare } from "lucide-react";

interface FacebookCommentsProps {
  url: string;
  appId?: string;
  numPosts?: number;
  width?: string;
  colorScheme?: "light" | "dark";
}

// Extend window type for Facebook SDK
declare global {
  interface Window {
    FB?: {
      XFBML: {
        parse: (element?: HTMLElement) => void;
      };
      init: (params: {
        appId?: string;
        xfbml: boolean;
        version: string;
      }) => void;
    };
    fbAsyncInit?: () => void;
  }
}

// Facebook App ID - Replace with your actual App ID for moderation features
const FACEBOOK_APP_ID = ""; // Add your Facebook App ID here

export const FacebookComments = ({
  url,
  appId = FACEBOOK_APP_ID,
  numPosts = 10,
  width = "100%",
  colorScheme = "light",
}: FacebookCommentsProps) => {
  useEffect(() => {
    // Load Facebook SDK
    const loadFacebookSDK = () => {
      // Check if SDK is already loaded
      if (window.FB) {
        window.FB.XFBML.parse();
        return;
      }

      // Check if script is already being loaded
      if (document.getElementById("facebook-jssdk")) {
        return;
      }

      // Initialize FB SDK when loaded
      window.fbAsyncInit = function () {
        window.FB?.init({
          appId: appId || undefined,
          xfbml: true,
          version: "v18.0",
        });
      };

      // Load SDK script with App ID if provided
      const sdkUrl = appId 
        ? `https://connect.facebook.net/bn_BD/sdk.js#xfbml=1&version=v18.0&appId=${appId}`
        : "https://connect.facebook.net/bn_BD/sdk.js#xfbml=1&version=v18.0";

      // Load SDK script
      const script = document.createElement("script");
      script.id = "facebook-jssdk";
      script.src = sdkUrl;
      script.async = true;
      script.defer = true;
      script.crossOrigin = "anonymous";
      
      const firstScript = document.getElementsByTagName("script")[0];
      firstScript.parentNode?.insertBefore(script, firstScript);
    };

    loadFacebookSDK();

    // Re-parse when URL changes
    return () => {
      // Cleanup if needed
    };
  }, [url, appId]);

  // Re-parse when component updates with new URL
  useEffect(() => {
    if (window.FB) {
      setTimeout(() => {
        window.FB?.XFBML.parse();
      }, 100);
    }
  }, [url]);

  return (
    <div className="mt-10 pt-8 border-t border-divider">
      {/* Header */}
      <h2 className="text-xl font-bold text-headline flex items-center gap-2 mb-6">
        <MessageSquare className="w-5 h-5" />
        মন্তব্য করুন
      </h2>

      {/* Facebook Root Element (Required) */}
      <div id="fb-root"></div>

      {/* Facebook Comments Plugin */}
      <div
        className="fb-comments"
        data-href={url}
        data-width={width}
        data-numposts={numPosts}
        data-colorscheme={colorScheme}
        data-order-by="reverse_time"
        data-lazy="true"
      ></div>

      {/* Fallback message */}
      <noscript>
        <p className="text-muted-foreground text-sm mt-4">
          মন্তব্য দেখতে JavaScript সক্রিয় করুন।
        </p>
      </noscript>
    </div>
  );
};
