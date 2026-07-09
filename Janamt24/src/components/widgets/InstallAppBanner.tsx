import { useState, useEffect } from "react";
import { X, Download, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

export function InstallAppBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      // Only show if user hasn't explicitly dismissed it recently
      const dismissed = localStorage.getItem("pwa_install_dismissed");
      if (!dismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // Optionally, send analytics event with outcome of user choice
    console.log(`User response to the install prompt: ${outcome}`);
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    // Dismiss for 7 days
    localStorage.setItem("pwa_install_dismissed", "true");
    setTimeout(() => {
      localStorage.removeItem("pwa_install_dismissed");
    }, 7 * 24 * 60 * 60 * 1000);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-[72px] md:bottom-0 left-0 right-0 z-50 p-3 sm:p-4 pb-safe animate-in slide-in-from-bottom border-t border-border bg-background/95 backdrop-blur shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
      <div className="container mx-auto flex flex-row items-center justify-between gap-3 max-w-5xl">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-primary/10 hidden sm:flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-headline text-sm sm:text-base truncate">জনমত ২৪ অ্যাপ ইনস্টল করুন!</h3>
            <p className="text-xs text-subtext mt-0.5 truncate border-none">
              দ্রুত খবর পেতে অ্যাপ ইনস্টল করুন।
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <Button 
            className="flex-1 sm:flex-none font-bold gap-2 rounded-xl shadow-lg shadow-primary/20"
            onClick={handleInstallClick}
          >
            <Download className="w-4 h-4" />
            ইনস্টল করুন
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-xl shrink-0 text-muted-foreground"
            onClick={handleDismiss}
          >
            <X className="w-4 h-4" />
            <span className="sr-only">Dismiss</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
