import { PublicLayout } from "@/components/layout/PublicLayout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Mail, Phone, CheckCircle } from "lucide-react";

const AdvertisePage = () => {
  return (
    <PublicLayout>
      <SEOHead
        title="বিজ্ঞাপন"
        description="জনমত ২৪ এ বিজ্ঞাপন দিন। আপনার ব্যবসার প্রচারে আমাদের সাথে যুক্ত হোন।"
        url="/advertise"
      />
      
      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-headline mb-4">
              বিজ্ঞাপন দিন
            </h1>
            <p className="text-lg text-subtext max-w-2xl mx-auto">
              জনমত ২৪ এর লক্ষাধিক পাঠকের কাছে আপনার ব্যবসার প্রচার করুন
            </p>
          </div>

          {/* Benefits */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="bg-card border border-divider rounded-lg p-6">
              <h3 className="text-xl font-bold text-headline mb-4">কেন জনমত ২৪?</h3>
              <ul className="space-y-3">
                {[
                  "প্রতিদিন হাজার হাজার সক্রিয় পাঠক",
                  "বাংলাদেশ জুড়ে বিস্তৃত পাঠক সমাজ",
                  "সোশ্যাল মিডিয়ায় শক্তিশালী উপস্থিতি",
                  "বিশ্বস্ত ও নির্ভরযোগ্য প্ল্যাটফর্ম",
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3 text-foreground">
                    <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-card border border-divider rounded-lg p-6">
              <h3 className="text-xl font-bold text-headline mb-4">বিজ্ঞাপনের ধরন</h3>
              <ul className="space-y-3">
                {[
                  "ব্যানার বিজ্ঞাপন (হেডার/সাইডবার)",
                  "স্পন্সরড নিউজ আর্টিকেল",
                  "ভিডিও বিজ্ঞাপন",
                  "সোশ্যাল মিডিয়া প্রচার",
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3 text-foreground">
                    <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Contact CTA */}
          <div className="bg-primary text-primary-foreground rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">বিজ্ঞাপনের জন্য যোগাযোগ করুন</h2>
            <p className="text-primary-foreground/80 mb-6 max-w-xl mx-auto">
              আপনার ব্যবসার প্রয়োজন অনুযায়ী কাস্টম বিজ্ঞাপন প্যাকেজ পেতে আমাদের সাথে যোগাযোগ করুন
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="secondary" 
                size="lg"
                className="gap-2"
                asChild
              >
                <a href="mailto:ifilmbd2025@gmail.com">
                  <Mail className="w-5 h-5" />
                  ইমেইল করুন
                </a>
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="gap-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                asChild
              >
                <a href="tel:+8801712004052">
                  <Phone className="w-5 h-5" />
                  +88 01712-004052
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default AdvertisePage;
