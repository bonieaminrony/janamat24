import { Facebook, Twitter, Linkedin, Link2, MessageCircle, Send, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface SocialShareProps {
  url: string;
  title: string;
  className?: string;
}

export function SocialShare({ url, title, className = "" }: SocialShareProps) {
  const { toast } = useToast();
  
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`,
    whatsapp: `https://api.whatsapp.com/send?text=${encodedTitle}%0A%0A${encodedUrl}`,
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "লিংক কপি হয়েছে",
        description: "সংবাদের লিংক ক্লিপবোর্ডে কপি করা হয়েছে",
      });
    } catch {
      toast({
        title: "ত্রুটি",
        description: "লিংক কপি করা যায়নি",
        variant: "destructive",
      });
    }
  };

  const handleMessengerShare = async () => {
    // Smart Share Strategy
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: title,
          url: url,
        });
      } catch (err) {
        // Fallback or user cancelled
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, "_blank");
      }
    } else {
      // Desktop Fallback
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, "_blank");
      toast({
        title: "মেসেঞ্জারে শেয়ার",
        description: "ফেসবুক শেয়ার ডায়ালগ থেকে মেসেঞ্জার সিলেক্ট করুন অথবা লিংকটি কপি করুন।",
      });
    }
  };

  const openShare = (platform: keyof typeof shareLinks) => {
    window.open(shareLinks[platform], "_blank", "width=600,height=400");
  };

  const socialButtons = [
    { platform: "facebook" as const, icon: Facebook, bg: "bg-[#1877f2]", hover: "hover:bg-[#1877f2]/85", label: "ফেসবুক" },
    { platform: "whatsapp" as const, icon: Send, bg: "bg-[#25d366]", hover: "hover:bg-[#25d366]/85", label: "হোয়াটসঅ্যাপ" },
    { platform: "twitter" as const, icon: Twitter, bg: "bg-[#000000]", hover: "hover:bg-black/80", label: "টুইটার" },
  ];

  return (
    <div className={`${className}`}>
      <p className="text-[10px] text-muted-foreground font-black mb-4 uppercase tracking-[0.2em] flex items-center gap-2">
        <span className="w-8 h-[2px] bg-primary/20 rounded-full" />
        সোশ্যাল শেয়ারিং
      </p>
      <div className="flex flex-wrap gap-3">
        {socialButtons.map(({ platform, icon: Icon, bg, hover, label }) => (
          <Button
            key={platform}
            size="sm"
            className={`h-11 px-5 rounded-2xl border-none ${bg} ${hover} text-white gap-2.5 shadow-md shadow-black/5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group`}
            onClick={() => openShare(platform)}
          >
            <div className="bg-white/20 p-1.5 rounded-lg group-hover:scale-110 transition-transform">
              <Icon className="h-4 w-4 text-white" />
            </div>
            <span className="text-xs font-bold tracking-wide text-white">{label}</span>
          </Button>
        ))}

        {/* Messenger / Native Share Button */}
        <Button
          size="sm"
          className="h-11 px-5 rounded-2xl border-none bg-[#0084FF] hover:bg-[#0084FF]/85 text-white gap-2.5 shadow-md shadow-black/5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
          onClick={handleMessengerShare}
        >
          <div className="bg-white/20 p-1.5 rounded-lg group-hover:scale-110 transition-transform">
            <MessageCircle className="h-4 w-4 text-white" />
          </div>
          <span className="text-xs font-bold tracking-wide text-white">মেসেঞ্জার</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="h-11 px-5 rounded-2xl gap-2.5 bg-muted/30 border-muted/50 hover:bg-muted hover:-translate-y-1 transition-all duration-300 group shadow-sm hover:shadow-md text-foreground"
          onClick={copyLink}
        >
          <div className="bg-muted-foreground/10 p-1.5 rounded-lg group-hover:bg-primary/10 transition-colors">
            <Link2 className="h-4 w-4" />
          </div>
          <span className="text-xs font-bold tracking-wide">কপি লিংক</span>
        </Button>
      </div>
    </div>
  );
}
