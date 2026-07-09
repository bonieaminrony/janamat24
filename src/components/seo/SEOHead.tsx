import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
}

export function SEOHead({
  title = "জনমত ২৪ - বিশ্বস্ত সংবাদ মাধ্যম",
  description = "জনমত ২৪ একটি বিশ্বস্ত এবং নির্ভরযোগ্য বাংলা সংবাদ মাধ্যম। সর্বশেষ জাতীয়, আন্তর্জাতিক, রাজনীতি, খেলাধুলা ও বিনোদন সংবাদ পড়ুন।",
  image,
  url,
  type = "website",
}: SEOHeadProps) {
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : "https://janamat24.com";
  const fullUrl = url ? `${siteUrl}${url}` : siteUrl;
  
  // Don't append site name if title already contains it
  const fullTitle = (title.includes("জনমত ২৪") || title.includes("Janamat 24")) ? title : `${title} | Janamat 24`;
  
  // Handle image URL - if it's already absolute, use as-is; otherwise prepend siteUrl
  const getImageUrl = () => {
    if (!image) {
      return `${siteUrl}/og-image.png`;
    }
    // Check if image is already an absolute URL
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image;
    }
    // It's a relative URL, prepend siteUrl
    return `${siteUrl}${image.startsWith('/') ? '' : '/'}${image}`;
  };
  
  const imageUrl = getImageUrl();

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content="বাংলা সংবাদ, জনমত, বাংলাদেশ, জাতীয় সংবাদ, রাজনীতি, খেলাধুলা, বিনোদন, আন্তর্জাতিক" />
      <meta name="author" content="জনমত ২৪" />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="জনমত ২৪" />
      <meta property="og:locale" content="bn_BD" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
    </Helmet>
  );
}
