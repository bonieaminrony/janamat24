import { Facebook, Twitter, Link2, Share2, Send, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SocialFloatingBarProps {
  url: string;
  title: string;
}

export function SocialFloatingBar({ url, title }: SocialFloatingBarProps) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const shareLinks = [
    {
      name: "Facebook",
      icon: Facebook,
      color: "hover:bg-[#1877F2]",
      link: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      name: "X (Twitter)",
      icon: Twitter,
      color: "hover:bg-black",
      link: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      name: "WhatsApp",
      icon: Send,
      color: "hover:bg-[#25D366]",
      link: `https://api.whatsapp.com/send?text=${encodedTitle}%0A%0A${encodedUrl}`,
    },
  ];

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          url: url,
        });
      } catch (err) {
        // Just fail silently or log
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(url);
    toast.success("লিংক কপি করা হয়েছে!");
  };

  return (
    <div className="fixed left-6 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-3 z-40 animate-fade-in">
      <div className="flex flex-col gap-2 p-2 bg-card border border-divider rounded-2xl shadow-xl">
        <div className="p-2 text-center border-b border-divider mb-1">
          <Share2 className="w-4 h-4 text-muted-foreground mx-auto" />
        </div>
        
        {shareLinks.map((social) => (
          <a
            key={social.name}
            href={social.link}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 group ${social.color} hover:text-white bg-background shadow-sm hover:shadow-lg`}
            title={social.name}
          >
            <social.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </a>
        ))}

        <button
          onClick={handleNativeShare}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 group bg-[#0084FF]/5 hover:bg-[#0084FF] text-[#0084FF] hover:text-white shadow-sm hover:shadow-lg"
          title="মেসেঞ্জার ও অন্যান্য"
        >
          <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>
        
        <Button
          variant="ghost"
          size="icon"
          className="w-10 h-10 rounded-xl hover:bg-primary/10 transition-all"
          onClick={copyToClipboard}
          title="কপি লিংক"
        >
          <Link2 className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
