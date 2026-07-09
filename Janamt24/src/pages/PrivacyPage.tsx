import { PublicLayout } from "@/components/layout/PublicLayout";
import { SEOHead } from "@/components/seo/SEOHead";

const PrivacyPage = () => {
  return (
    <PublicLayout>
      <SEOHead
        title="গোপনীয়তা নীতি"
        description="জনমত ২৪ এর গোপনীয়তা নীতি। আমরা আপনার ব্যক্তিগত তথ্যের সুরক্ষায় প্রতিশ্রুতিবদ্ধ।"
        url="/privacy"
      />

      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-headline mb-8">
            গোপনীয়তা নীতি
          </h1>

          <div className="bg-card border border-divider rounded-lg p-8">
            <div className="prose prose-lg max-w-none text-foreground space-y-6">
              <section>
                <h2 className="text-xl font-bold text-headline mb-3">১. ভূমিকা</h2>
                <p className="text-subtext">
                  জনমত ২৪ আপনার গোপনীয়তার প্রতি শ্রদ্ধাশীল। এই গোপনীয়তা নীতি ব্যাখ্যা করে যে
                  আমরা কীভাবে আপনার ব্যক্তিগত তথ্য সংগ্রহ, ব্যবহার এবং সুরক্ষা করি।
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-headline mb-3">২. তথ্য সংগ্রহ</h2>
                <p className="text-subtext">
                  আমরা নিম্নলিখিত তথ্য সংগ্রহ করতে পারি:
                </p>
                <ul className="list-disc list-inside text-subtext space-y-2 mt-2">
                  <li>আপনার নাম ও ইমেইল ঠিকানা (যদি আপনি সাবস্ক্রাইব করেন)</li>
                  <li>ওয়েবসাইট ব্যবহারের তথ্য (কুকিজের মাধ্যমে)</li>
                  <li>আইপি ঠিকানা ও ব্রাউজার তথ্য</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-headline mb-3">৩. তথ্যের ব্যবহার</h2>
                <p className="text-subtext">
                  আমরা আপনার তথ্য ব্যবহার করি:
                </p>
                <ul className="list-disc list-inside text-subtext space-y-2 mt-2">
                  <li>আমাদের সেবা উন্নত করতে</li>
                  <li>আপনাকে গুরুত্বপূর্ণ সংবাদ আপডেট পাঠাতে</li>
                  <li>ওয়েবসাইটের ব্যবহার বিশ্লেষণ করতে</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-headline mb-3">৪. তথ্য সুরক্ষা</h2>
                <p className="text-subtext">
                  আমরা আপনার ব্যক্তিগত তথ্য সুরক্ষিত রাখতে যথাযথ নিরাপত্তা ব্যবস্থা গ্রহণ করি।
                  আমরা তৃতীয় পক্ষের সাথে আপনার তথ্য বিক্রি বা ভাগ করি না।
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-headline mb-3">৫. কুকিজ ও ট্র্যাকিং টেকনোলজি</h2>
                <p className="text-subtext">
                  আমাদের ওয়েবসাইট কুকিজ ব্যবহার করে আপনার ব্রাউজিং অভিজ্ঞতা উন্নত করতে।
                  আপনি আপনার ব্রাউজার সেটিংস থেকে কুকিজ নিষ্ক্রিয় করতে পারেন।
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-headline mb-3">৬. তৃতীয় পক্ষের বিজ্ঞাপন (Google AdSense)</h2>
                <p className="text-subtext">
                  আমাদের ওয়েবসাইটে থার্ড-পার্টি ভেন্ডর, বিশেষ করে Google, বিজ্ঞাপন দেখানোর জন্য কুকিজ ব্যবহার করতে পারে।
                </p>
                <ul className="list-disc list-inside text-subtext space-y-2 mt-2">
                  <li>Google এবং এর পার্টনাররা ডার্ট (DART) বা বিজ্ঞাপন কুকিজ ব্যবহার করে পূর্ববর্তী ভিজিটের ওপর ভিত্তি করে আপনাকে প্রাসঙ্গিক বিজ্ঞাপন প্রদর্শন করে।</li>
                  <li>আপনি চাইলে <a href="https://myadcenter.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Ad Settings</a>-এ গিয়ে পারসোনালাইজড অ্যাড (Personalized Ads) বন্ধ করতে পারেন।</li>
                  <li>অথবা <a href="http://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">aboutads.info</a> ওয়েবসাইট ভিজিট করে থার্ড-পার্টি ভেন্ডরদের কুকিজ থেকে অপ্ট-আউট করতে পারেন।</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-headline mb-3">৭. যোগাযোগ</h2>
                <p className="text-subtext">
                  গোপনীয়তা সম্পর্কিত কোনো প্রশ্ন থাকলে আমাদের সাথে যোগাযোগ করুন:
                </p>
                <p className="text-subtext mt-2">
                  ইমেইল: <a href="mailto:ifilmbd2025@gmail.com" className="text-accent hover:underline">ifilmbd2025@gmail.com</a>
                </p>
              </section>

              <p className="text-sm text-subtext pt-6 border-t border-divider">
                সর্বশেষ আপডেট: ডিসেম্বর ২০২৫
              </p>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default PrivacyPage;
