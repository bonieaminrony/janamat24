import { useState, useEffect } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function PushNotificationPrompt() {
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if (!("Notification" in window)) {
      console.log("This browser does not support desktop notification");
      return;
    }
    setPermission(Notification.permission);
  }, []);

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      toast.error("আপনার ব্রাউজারে নোটিফিকেশন সাপোর্ট করে না");
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === "granted") {
        toast.success("নোটিফিকেশন চালু হয়েছে!", {
          description: "এখন থেকে ব্রেকিং নিউজ পাবলিশ হলেই আপনি সাথে সাথে জানতে পারবেন।"
        });
        
        // Example test notification
        new Notification("জনমত ২৪", {
          body: "নোটিফিকেশন সফলভাবে চালু হয়েছে। সত্য প্রচার আমাদের অঙ্গীকার!",
          icon: "/favicon.png",
          badge: "/favicon.png",
        });
        
      } else if (result === "denied") {
        toast.error("নোটিফিকেশন ব্লক করা হয়েছে", {
          description: "নোটিফিকেশন পেতে ব্রাউজার সেটিংস থেকে অনুমতি দিন।"
        });
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
    }
  };

  if (!("Notification" in window)) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={requestPermission}
            className={`relative rounded-full h-10 w-10 transition-colors ${
              permission === 'granted' 
                ? 'text-primary hover:bg-primary/10' 
                : permission === 'denied'
                ? 'text-muted-foreground opacity-50'
                : 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-amber-600 animate-pulse'
            }`}
            disabled={permission === "granted"}
          >
            {permission === "granted" ? (
              <BellRing className="w-5 h-5" />
            ) : permission === "denied" ? (
              <BellOff className="w-5 h-5" />
            ) : (
              <Bell className="w-5 h-5" />
            )}
            
            {/* Unread indicator dot */}
            {permission === "default" && (
              <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-amber-500 border-2 border-white dark:border-slate-950" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="center" className="font-bold text-xs bg-slate-900 border-none px-3 py-1.5">
          {permission === 'granted' 
            ? 'নোটিফিকেশন চালু আছে' 
            : permission === 'denied'
            ? 'নোটিফিকেশন বন্ধ'
            : 'ব্রেকিং নিউজ অ্যালার্ট চালু করুন'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
