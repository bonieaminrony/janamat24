import { PublicLayout } from "@/components/layout/PublicLayout";
import { SEOHead } from "@/components/seo/SEOHead";

const CorrectionsPolicyPage = () => {
  return (
    <PublicLayout>
      <SEOHead
        title="সংশোধনী নীতিমালা"
        description="জনমত ২৪ এর সংশোধনী নীতিমালা - ভুল সংশোধন ও স্পষ্টীকরণের প্রক্রিয়া।"
        url="/corrections-policy"
      />
      <div className="container py-8 md:py-12">
        <article className="max-w-3xl mx-auto article-content">
          <h1 className="text-2xl md:text-3xl font-bold text-headline mb-6">
            সংশোধনী নীতিমালা
          </h1>

          <div className="space-y-6 text-foreground">
            <section>
              <h2 className="text-xl font-semibold text-headline mb-3">আমাদের প্রতিশ্রুতি</h2>
              <p className="article-body">
                জনমত ২৪ সংবাদের নির্ভুলতায় বিশ্বাস করে। কোনো ভুল হলে আমরা দ্রুত ও স্বচ্ছভাবে 
                তা সংশোধন করতে প্রতিশ্রুতিবদ্ধ। পাঠকদের বিশ্বাস রক্ষা করা আমাদের অগ্রাধিকার।
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-headline mb-3">সংশোধনের ধরন</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-headline mb-1">ছোট সংশোধন</h3>
                  <p className="article-body">
                    বানান, ব্যাকরণ বা ছোট তথ্যগত ভুল সরাসরি সংশোধন করা হয়। এ ধরনের 
                    সংশোধনের জন্য পৃথক নোট যোগ করা হয় না।
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-headline mb-1">গুরুত্বপূর্ণ সংশোধন</h3>
                  <p className="article-body">
                    গুরুত্বপূর্ণ তথ্যগত ভুল সংশোধনের ক্ষেত্রে সংবাদের শেষে সংশোধনী নোট যোগ করা 
                    হয় এবং "সর্বশেষ সম্পাদনা" সময় আপডেট করা হয়।
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-headline mb-1">স্পষ্টীকরণ</h3>
                  <p className="article-body">
                    যখন কোনো তথ্য বিভ্রান্তিকর হতে পারে, তখন স্পষ্টীকরণ নোট যোগ করা হয়।
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-headline mb-3">ভুল জানানোর প্রক্রিয়া</h2>
              <p className="article-body">
                আপনি যদি কোনো সংবাদে ভুল লক্ষ্য করেন, অনুগ্রহ করে আমাদের জানান। আপনি ইমেইল 
                করতে পারেন corrections@janamat24.com ঠিকানায় অথবা আমাদের যোগাযোগ পৃষ্ঠা 
                ব্যবহার করতে পারেন।
              </p>
              <p className="article-body mt-3">
                অনুগ্রহ করে নিম্নলিখিত তথ্য প্রদান করুন:
              </p>
              <ul className="list-disc list-inside space-y-1 text-foreground ml-4 mt-2">
                <li>সংবাদের শিরোনাম বা লিঙ্ক</li>
                <li>ভুলের বিবরণ</li>
                <li>সঠিক তথ্য (যদি জানা থাকে)</li>
                <li>তথ্যের উৎস (যদি সম্ভব হয়)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-headline mb-3">পর্যালোচনা প্রক্রিয়া</h2>
              <p className="article-body">
                সমস্ত সংশোধনী অনুরোধ সম্পাদকীয় দল দ্বারা পর্যালোচনা করা হয়। আমরা সাধারণত 
                ২৪ ঘণ্টার মধ্যে প্রতিক্রিয়া জানাই। জটিল বিষয়ে আরও সময় লাগতে পারে।
              </p>
            </section>

            <section className="border-t border-divider pt-6 mt-8">
              <p className="text-sm text-muted-foreground">
                সংশোধনী সংক্রান্ত যোগাযোগ: corrections@janamat24.com
              </p>
            </section>
          </div>
        </article>
      </div>
    </PublicLayout>
  );
};

export default CorrectionsPolicyPage;
