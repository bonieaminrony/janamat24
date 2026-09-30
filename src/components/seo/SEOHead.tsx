import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
  publishedAt?: string;
  updatedAt?: string;
  authorName?: string;
  categoryName?: string;
  keywords?: string;
  noindex?: boolean;
}

export function SEOHead({
  title = "জনমত ২৪ - বিশ্বস্ত সংবাদ মাধ্যম",
  description = "জনমত ২৪ একটি বিশ্বস্ত এবং নির্ভরযোগ্য বাংলা সংবাদ মাধ্যম। সর্বশেষ জাতীয়, আন্তর্জাতিক, রাজনীতি, খেলাধুলা ও বিনোদন সংবাদ পড়ুন।",
  image,
  url,
  type = "website",
  publishedAt,
  updatedAt,
  authorName = "জনমত ২৪ ডেস্ক",
  categoryName,
  keywords = "বাংলা সংবাদ, জনমত, বাংলাদেশ, জাতীয় সংবাদ, রাজনীতি, খেলাধুলা, বিনোদন, আন্তর্জাতিক",
  noindex = false,
}: SEOHeadProps) {
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : "https://janamat24.com";
  const fullUrl = url ? `${siteUrl}${url.startsWith('/') ? '' : '/'}${url}` : siteUrl;
  
  // Don't append site name if title already contains it
  const fullTitle = (title.includes("জনমত ২৪") || title.includes("Janamat 24")) ? title : `${title} | জনমত ২৪`;
  
  // Handle image URL - if it's already absolute, use as-is; otherwise prepend siteUrl
  const getImageUrl = () => {
    if (!image) {
      return `${siteUrl}/og-image.png`;
    }
    // Check if image is base64
    if (image.startsWith('data:image/')) {
      // If we have a news slug in url, use edge image proxy endpoint
      if (url && url.startsWith('/news/')) {
        const slug = url.replace('/news/', '');
        return `${siteUrl}/news-image/${encodeURIComponent(slug)}`;
      }
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
  const robotsContent = noindex 
    ? "noindex, nofollow" 
    : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

  // Build JSON-LD Structured Data
  let jsonLd: Record<string, any> | null = null;

  if (type === "article") {
    jsonLd = {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": fullUrl
      },
      "headline": title,
      "description": description,
      "image": [imageUrl],
      "datePublished": publishedAt || new Date().toISOString(),
      "dateModified": updatedAt || publishedAt || new Date().toISOString(),
      "author": {
        "@type": "Person",
        "name": authorName,
        "url": siteUrl
      },
      "publisher": {
        "@type": "NewsMediaOrganization",
        "name": "জনমত ২৪",
        "url": siteUrl,
        "logo": {
          "@type": "ImageObject",
          "url": `${siteUrl}/favicon.png`,
          "width": 192,
          "height": 192
        }
      },
      "inLanguage": "bn-BD",
      ...(categoryName ? { "articleSection": categoryName } : {})
    };
  } else {
    jsonLd = {
      "@context": "https://schema.org",
      "@type": "NewsMediaOrganization",
      "name": "জনমত ২৪",
      "alternateName": "Janamat 24",
      "url": siteUrl,
      "logo": `${siteUrl}/favicon.png`,
      "sameAs": [
        "https://facebook.com/janamat24",
        "https://twitter.com/janamat24"
      ],
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${siteUrl}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    };
  }

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={authorName} />
      <meta name="robots" content={robotsContent} />
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

      {type === "article" && publishedAt && (
        <meta property="article:published_time" content={publishedAt} />
      )}
      {type === "article" && (updatedAt || publishedAt) && (
        <meta property="article:modified_time" content={updatedAt || publishedAt} />
      )}
      {type === "article" && categoryName && (
        <meta property="article:section" content={categoryName} />
      )}
      {type === "article" && authorName && (
        <meta property="article:author" content={authorName} />
      )}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />

      {/* Structured Data (JSON-LD) */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
}
