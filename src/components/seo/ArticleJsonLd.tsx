import { Helmet } from "react-helmet-async";

interface ArticleJsonLdProps {
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  publishedAt?: string;
  updatedAt?: string;
  authorName?: string;
  categoryName?: string;
}

export function ArticleJsonLd({
  title,
  description,
  url,
  imageUrl,
  publishedAt,
  updatedAt,
  authorName,
  categoryName,
}: ArticleJsonLdProps) {
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : "https://janamat24.com";
  const fullUrl = url.startsWith('http') ? url : `${siteUrl}${url}`;
  
  const getImageUrl = () => {
    if (!imageUrl) return `${siteUrl}/og-image.png`;
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${siteUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": title,
    "description": description,
    "url": fullUrl,
    "image": [getImageUrl()],
    "datePublished": publishedAt || new Date().toISOString(),
    "dateModified": updatedAt || publishedAt || new Date().toISOString(),
    "author": {
      "@type": "Person",
      "name": authorName || "জনমত ২৪ প্রতিনিধি",
    },
    "publisher": {
      "@type": "Organization",
      "name": "জনমত ২৪",
      "logo": {
        "@type": "ImageObject",
        "url": `${siteUrl}/favicon.png`,
      },
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": fullUrl,
    },
    ...(categoryName && {
      "articleSection": categoryName,
    }),
    "inLanguage": "bn-BD",
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
    </Helmet>
  );
}
