import { Link } from "react-router-dom";
import { User, Facebook, Twitter, ArrowRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { sanitizeImageUrl, sanitizeLinkUrl } from "@/lib/url-utils";

interface AuthorBoxProps {
  userId?: string;
  name: string | null;
  bio?: string | null;
  role?: string | null;
  avatarUrl?: string | null;
  facebookUrl?: string | null;
  twitterUrl?: string | null;
}

export function AuthorBox({ userId, name, bio, role, avatarUrl, facebookUrl, twitterUrl }: AuthorBoxProps) {
  if (!name) return null;

  const roleLabels: Record<string, string> = {
    admin: "সম্পাদক",
    editor: "সহ-সম্পাদক",
    reporter: "রিপোর্টার",
  };

  const displayRole = role ? (roleLabels[role] || role) : "প্রতিবেদক";
  const initials = name ? name.split(' ').map(n => n[0]).join('').slice(0, 2) : '';

  return (
    <div className="relative mt-10 rounded-2xl overflow-hidden border border-border bg-card shadow-lg">
      {/* Top gradient accent */}
      <div className="h-1.5 bg-gradient-to-r from-primary via-primary/70 to-primary/30" />
      
      <div className="p-5 sm:p-7">
        {/* Label */}
        <p className="text-xs text-muted-foreground mb-4 uppercase tracking-widest font-semibold">
          লিখেছেন
        </p>
        
        <div className="flex items-start gap-4 sm:gap-5">
          <Avatar className="w-14 h-14 sm:w-18 sm:h-18 flex-shrink-0 ring-2 ring-primary/10 ring-offset-2 ring-offset-card">
            <AvatarImage 
              src={sanitizeImageUrl(avatarUrl) || undefined} 
              alt={name || "প্রতিবেদক"} 
            />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary text-lg sm:text-xl font-bold">
              {initials || <User className="w-6 h-6 sm:w-8 sm:h-8" />}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {userId ? (
                <Link 
                  to={`/author/${userId}`}
                  className="font-bold text-lg text-headline hover:text-primary transition-colors"
                >
                  {name}
                </Link>
              ) : (
                <h4 className="font-bold text-lg text-headline">{name}</h4>
              )}
              <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
                {displayRole}
              </span>
            </div>
            
            {bio ? (
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{bio}</p>
            ) : (
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {name} জনমত ২৪ এর একজন নিবেদিত {displayRole}।
              </p>
            )}
            
            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {userId && (
                <Button
                  variant="default"
                  size="sm"
                  className="h-9 px-4 gap-2 rounded-full shadow-md hover:shadow-lg transition-all"
                  asChild
                >
                  <Link to={`/author/${userId}`}>
                    সব সংবাদ দেখুন
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </Button>
              )}
              {facebookUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-3.5 gap-2 rounded-full hover:bg-[#1877F2]/10 hover:border-[#1877F2]/30 transition-all"
                  asChild
                >
                  <a href={sanitizeLinkUrl(facebookUrl)} target="_blank" rel="noopener noreferrer">
                    <Facebook className="w-3.5 h-3.5 text-[#1877F2]" />
                    <span className="text-xs">ফেসবুক</span>
                  </a>
                </Button>
              )}
              {twitterUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-3.5 gap-2 rounded-full hover:bg-[#1DA1F2]/10 hover:border-[#1DA1F2]/30 transition-all"
                  asChild
                >
                  <a href={sanitizeLinkUrl(twitterUrl)} target="_blank" rel="noopener noreferrer">
                    <Twitter className="w-3.5 h-3.5 text-[#1DA1F2]" />
                    <span className="text-xs">টুইটার</span>
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
