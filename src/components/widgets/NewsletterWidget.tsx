import { useState } from "react";
import { Send, Mail, BellRing, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

export function NewsletterWidget() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert([{ email }]);

      if (error) {
        if (error.code === '23505') { // Postgres unique constraint violation
          toast.info("আপনি ইতিমধ্যে সাবস্ক্রাইব করেছেন!", {
            description: "আমাদের সাথে যুক্ত থাকার জন্য ধন্যবাদ।",
          });
          setEmail("");
        } else {
          throw error;
        }
      } else {
        toast.success("নিউজলেটার সাবস্ক্রিপশন সফল হয়েছে!", {
          description: "ধন্যবাদ! এখন থেকে আপনি ইমেইলে নিয়মিত আপডেট পাবেন।",
        });
        setEmail("");
      }
    } catch (error: any) {
      console.error("Subscription error:", error);
      toast.error("সাবস্ক্রাইব করতে সমস্যা হয়েছে।", {
        description: "অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-border">
      {/* Newspaper Style Header */}
      <div className="flex items-center gap-2 border-b-2 border-primary pb-2 mb-4 mx-4 mt-4">
        <Mail className="w-4 h-4 text-primary" />
        <h3 className="text-lg font-black text-headline tracking-wide uppercase">নিউজলেটার</h3>
      </div>
      
      <div className="pl-4 pr-4 pb-5">
        <p className="text-sm text-muted-foreground mb-4 font-medium leading-relaxed">
          জনমত ২৪-এর সর্বশেষ সংবাদ এবং সব আপডেট সরাসরি আপনার ইনবক্সে পেতে সাবস্ক্রাইব করুন।
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Input
              type="email"
              placeholder="আপনার ইমেইল ঠিকানা"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 bg-slate-50 dark:bg-slate-800 border-border focus:border-primary/50 transition-all rounded-none font-sans"
              required
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={isSubmitting || !email}
            className="w-full h-10 rounded-none shadow-none font-bold tracking-wider hover:bg-primary/90 transition-all"
          >
            {isSubmitting ? "সাবস্ক্রাইব হচ্ছে..." : "সাবস্ক্রাইব করুন"}
          </Button>
        </form>
        
        <p className="text-[10px] text-muted-foreground text-center mt-3 border-t border-border pt-3">
          আপনার প্রাইভেসি আমাদের কাছে গুরুত্বপূর্ণ।
        </p>
      </div>
    </div>
  );
}
