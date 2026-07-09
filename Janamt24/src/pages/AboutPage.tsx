import { PublicLayout } from "@/components/layout/PublicLayout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Mail, Phone, MapPin, Users, Target, Award } from "lucide-react";

const AboutPage = () => {
  return (
    <PublicLayout>
      <SEOHead
        title="আমাদের সম্পর্কে"
        description="জনমত ২৪ একটি বিশ্বস্ত এবং নির্ভরযোগ্য বাংলা সংবাদ মাধ্যম। সত্য প্রচার আমাদের অঙ্গীকার।"
        url="/about"
      />
      
      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-headline mb-4">
              আমাদের সম্পর্কে
            </h1>
            <p className="text-lg text-subtext max-w-2xl mx-auto">
              সত্য প্রচার আমাদের অঙ্গীকার। বিশ্বস্ত সংবাদ পরিবেশনে আমরা প্রতিশ্রুতিবদ্ধ।
            </p>
          </div>

          {/* Mission Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-card border border-divider rounded-lg p-6 text-center">
              <div className="w-12 h-12 bg-accent/10 text-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-headline mb-2">আমাদের লক্ষ্য</h3>
              <p className="text-sm text-subtext">
                নিরপেক্ষ ও সত্য সংবাদ পরিবেশনের মাধ্যমে জনগণকে সচেতন করা
              </p>
            </div>
            
            <div className="bg-card border border-divider rounded-lg p-6 text-center">
              <div className="w-12 h-12 bg-accent/10 text-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-headline mb-2">আমাদের দল</h3>
              <p className="text-sm text-subtext">
                অভিজ্ঞ সাংবাদিক ও পেশাদার কর্মীদের সমন্বয়ে গঠিত
              </p>
            </div>
            
            <div className="bg-card border border-divider rounded-lg p-6 text-center">
              <div className="w-12 h-12 bg-accent/10 text-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-headline mb-2">আমাদের মূল্যবোধ</h3>
              <p className="text-sm text-subtext">
                সততা, নিরপেক্ষতা এবং জনস্বার্থ আমাদের প্রধান নীতি
              </p>
            </div>
          </div>

          {/* About Content */}
          <div className="bg-card border border-divider rounded-lg p-8 mb-12">
            <h2 className="text-2xl font-bold text-headline mb-6">জনমত ২৪ পরিচিতি</h2>
            <div className="prose prose-lg max-w-none text-foreground space-y-4">
              <p>
                জনমত ২৪ একটি আধুনিক ডিজিটাল সংবাদ মাধ্যম যা বাংলাদেশের জাতীয়, আন্তর্জাতিক, রাজনীতি, 
                অর্থনীতি, খেলাধুলা, বিনোদন সহ সকল ধরনের সংবাদ পরিবেশন করে থাকে।
              </p>
              <p>
                আমরা বিশ্বাস করি যে সঠিক ও নির্ভরযোগ্য তথ্য জনগণের অধিকার। তাই আমরা সর্বদা 
                সত্য ও নিরপেক্ষ সংবাদ পরিবেশনে প্রতিশ্রুতিবদ্ধ।
              </p>
              <p>
                আমাদের অভিজ্ঞ সাংবাদিক দল দেশের বিভিন্ন প্রান্ত থেকে সংবাদ সংগ্রহ করে 
                পাঠকদের কাছে দ্রুত ও সঠিকভাবে পৌঁছে দেয়।
              </p>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-primary text-primary-foreground rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-6">যোগাযোগ করুন</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium mb-1">ঠিকানা</p>
                  <p className="text-sm text-primary-foreground/80">
                    আয়েশা মঞ্জিল, দক্ষিণ সানারপাড়া, ২ নম্বর গলি, পুলিশ মোড়, ডেমরা, ঢাকা–১৩৬১
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium mb-1">ইমেইল</p>
                  <a href="mailto:ifilmbd2025@gmail.com" className="text-sm text-primary-foreground/80 hover:text-primary-foreground">
                    ifilmbd2025@gmail.com
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium mb-1">ফোন</p>
                  <a href="tel:+8801712004052" className="text-sm text-primary-foreground/80 hover:text-primary-foreground">
                    +88 01712-004052
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default AboutPage;
