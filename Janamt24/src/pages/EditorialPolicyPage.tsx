import { PublicLayout } from "@/components/layout/PublicLayout";
import { SEOHead } from "@/components/seo/SEOHead";

const EditorialPolicyPage = () => {
  return (
    <PublicLayout>
      <SEOHead
        title="সম্পাদকীয় নীতিমালা"
        description="জনমত ২৪ এর সম্পাদকীয় নীতিমালা - আমাদের সংবাদ সংগ্রহ, যাচাই এবং প্রকাশনার মান ও নীতি।"
        url="/editorial-policy"
      />
      <div className="container py-8 md:py-12">
        <article className="max-w-3xl mx-auto article-content">
          <h1 className="text-2xl md:text-3xl font-bold text-headline mb-6">
            সম্পাদকীয় নীতিমালা
          </h1>

          <div className="space-y-6 text-foreground">
            <section>
              <h2 className="text-xl font-semibold text-headline mb-3">আমাদের অঙ্গীকার</h2>
              <p className="article-body">
                জনমত ২৪ সত্য, নির্ভুল এবং নিরপেক্ষ সংবাদ পরিবেশনে প্রতিশ্রুতিবদ্ধ। আমরা বিশ্বাস করি যে 
                সঠিক তথ্য প্রদান একটি গণতান্ত্রিক সমাজের মূল ভিত্তি।
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-headline mb-3">সংবাদ সংগ্রহ</h2>
              <p className="article-body">
                আমাদের প্রতিবেদকরা সরাসরি ঘটনাস্থলে গিয়ে তথ্য সংগ্রহ করেন। প্রতিটি সংবাদের জন্য 
                একাধিক সূত্র থেকে তথ্য যাচাই করা হয়। অজ্ঞাত সূত্রের তথ্য প্রকাশের আগে বিশেষ 
                সতর্কতা অবলম্বন করা হয়।
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-headline mb-3">তথ্য যাচাই</h2>
              <p className="article-body">
                প্রকাশের আগে প্রতিটি সংবাদ সম্পাদকীয় দল দ্বারা পর্যালোচনা করা হয়। সন্দেহজনক তথ্য 
                স্বাধীন সূত্র থেকে যাচাই করা হয়। গুরুত্বপূর্ণ সংবাদে একাধিক সম্পাদকের অনুমোদন প্রয়োজন।
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-headline mb-3">নিরপেক্ষতা</h2>
              <p className="article-body">
                আমরা রাজনৈতিক, ধর্মীয় বা অন্য কোনো পক্ষপাত ছাড়াই সংবাদ পরিবেশন করি। মতামতমূলক 
                লেখা স্পষ্টভাবে চিহ্নিত করা হয়। সংবাদ ও মতামতের মধ্যে সুস্পষ্ট পার্থক্য রাখা হয়।
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-headline mb-3">গোপনীয়তা ও নৈতিকতা</h2>
              <p className="article-body">
                আমরা ব্যক্তির গোপনীয়তা রক্ষা করি এবং সংবেদনশীল বিষয়ে সতর্কতার সাথে প্রতিবেদন করি। 
                নাবালক ও ভুক্তভোগীদের পরিচয় সুরক্ষিত রাখা হয়।
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-headline mb-3">স্বচ্ছতা</h2>
              <p className="article-body">
                প্রতিটি সংবাদে লেখকের নাম ও প্রকাশের সময় উল্লেখ থাকে। সংশোধন করা হলে তা স্পষ্টভাবে 
                চিহ্নিত করা হয়। পাঠকদের প্রতিক্রিয়া ও অভিযোগ গুরুত্বের সাথে বিবেচনা করা হয়।
              </p>
            </section>

            <section className="border-t border-divider pt-6 mt-8">
              <p className="text-sm text-muted-foreground">
                সম্পাদকীয় বিষয়ে যোগাযোগ: editor@janamat24.com
              </p>
            </section>
          </div>
        </article>
      </div>
    </PublicLayout>
  );
};

export default EditorialPolicyPage;
