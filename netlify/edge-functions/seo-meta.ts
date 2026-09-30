import type { Context } from "@netlify/edge-functions";

const crawlerPatterns = [
  'googlebot',
  'google-inspectiontool',
  'googlebot-news',
  'bingbot',
  'yandexbot',
  'duckduckbot',
  'slurp',
  'baiduspider',
  'sogou',
  'facebookexternalhit',
  'facebot',
  'twitterbot',
  'linkedinbot',
  'whatsapp',
  'slackbot',
  'telegrambot',
  'discordbot',
  'pinterest',
  'vkshare',
  'w3c_validator',
  'ia_archiver',
  'bytespider',
  'petalbot'
];

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function decodeSafe(str: string): string {
  try {
    return /%[0-9A-Fa-f]{2}/.test(str) ? decodeURIComponent(str) : str;
  } catch (e) {
    return str;
  }
}

function cleanText(text: string | null | undefined, maxLen = 160): string {
  if (!text) return '';
  const decoded = decodeSafe(text);
  const plain = decoded.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
  return plain.length > maxLen ? plain.substring(0, maxLen) + '...' : plain;
}

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  const siteUrl = url.origin;
  
  const supabaseUrl = Deno.env.get("VITE_SUPABASE_URL");
  const supabaseKey = Deno.env.get("VITE_SUPABASE_ANON_KEY") || Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY");

  // 1. Handle news image rendering directly (supports both base64 and standard redirects)
  const newsImageMatch = url.pathname.match(/\/news-image\/([^/?#]+)/);
  if (newsImageMatch) {
    const slug = decodeURIComponent(newsImageMatch[1]);
    
    if (!supabaseUrl || !supabaseKey) {
      return new Response("Configuration missing", { status: 500 });
    }
    
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/news?slug=eq.${encodeURIComponent(slug)}&select=image_url&limit=1`, {
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`
        }
      });
      const articles = await res.json();
      if (articles && articles.length > 0 && articles[0].image_url) {
        const imageUrl = articles[0].image_url;
        if (imageUrl.startsWith('data:image/')) {
          const base64Match = imageUrl.match(/^data:([^;]+);base64,(.+)$/s);
          if (base64Match) {
            const mimeType = base64Match[1];
            const base64Data = base64Match[2].replace(/\s/g, ''); // strip any whitespace
            
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            
            return new Response(bytes, {
              headers: {
                "Content-Type": mimeType,
                "Cache-Control": "public, max-age=86400",
                "Access-Control-Allow-Origin": "*"
              }
            });
          }
        } else if (imageUrl.startsWith('http')) {
          return Response.redirect(imageUrl, 307);
        } else {
          return Response.redirect(`${siteUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`, 307);
        }
      }
    } catch (e) {
      console.error("News Image Serve Error:", e);
    }
    return new Response("Image not found", { status: 404 });
  }

  const userAgent = request.headers.get("user-agent") || "";
  
  // Only intercept bots for server pre-rendering / meta tag injection
  const isCrawler = crawlerPatterns.some(pattern => 
    userAgent.toLowerCase().includes(pattern.toLowerCase())
  );

  if (!isCrawler) {
    return; // Pass through to standard React SPA naturally
  }

  // Identify path matches
  const newsMatch = url.pathname.match(/\/news\/([^/?#]+)/);
  const categoryMatch = url.pathname.match(/\/category\/([^/?#]+)/);
  const isHomePage = url.pathname === '/' || url.pathname === '';
  
  if (!newsMatch && !categoryMatch && !isHomePage) return;

  if (!supabaseUrl || !supabaseKey) return;

  let pageTitle = "জনমত ২৪ - বিশ্বস্ত সংবাদ মাধ্যম";
  let metaDescription = "জনমত ২৪ একটি বিশ্বস্ত এবং নির্ভরযোগ্য বাংলা সংবাদ মাধ্যম। সর্বশেষ জাতীয়, আন্তর্জাতিক, রাজনীতি, খেলাধুলা ও বিনোদন সংবাদ পড়ুন।";
  let ogImage = `${siteUrl}/og-image.png`;
  let canonicalUrl = url.href;
  let robotsTag = "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";
  let ogType = "website";
  let publishedTime = "";
  let modifiedTime = "";
  let authorName = "জনমত ২৪ ডেস্ক";
  let categoryName = "";
  let categorySlug = "";
  let preRenderedContent = "";
  const jsonLdSchemas: any[] = [];

  try {
    if (newsMatch) {
      const slug = decodeURIComponent(newsMatch[1]);
      canonicalUrl = `${siteUrl}/news/${encodeURIComponent(slug)}`;
      ogType = "article";

      const res = await fetch(`${supabaseUrl}/rest/v1/news?slug=eq.${encodeURIComponent(slug)}&select=id,title,excerpt,content,image_url,status,published_at,updated_at,author_id,category_id,categories(name,slug)&limit=1`, {
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`
        }
      });
      
      const articles = await res.json();
      if (articles && articles.length > 0) {
        const article = articles[0];
        
        if (article.status !== 'published') {
          robotsTag = "noindex, nofollow";
          pageTitle = "সংবাদটি অপ্রকাশিত | জনমত ২৪";
        } else {
          const rawTitle = decodeSafe(article.title || "");
          pageTitle = `${rawTitle} | জনমত ২৪`;
          metaDescription = cleanText(article.excerpt || article.content || metaDescription, 160);
          
          if (article.published_at) publishedTime = new Date(article.published_at).toISOString();
          if (article.updated_at) modifiedTime = new Date(article.updated_at).toISOString();
          else if (publishedTime) modifiedTime = publishedTime;

          if (article.categories) {
            categoryName = decodeSafe(article.categories.name || "");
            categorySlug = article.categories.slug || "";
          }

          if (article.author_id) {
            try {
              const profRes = await fetch(`${supabaseUrl}/rest/v1/profiles?user_id=eq.${article.author_id}&select=full_name&limit=1`, {
                headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` }
              });
              const profs = await profRes.json();
              if (profs && profs.length > 0 && profs[0].full_name) {
                authorName = decodeSafe(profs[0].full_name);
              }
            } catch (e) {}
          }

          if (article.image_url) {
            if (article.image_url.startsWith('data:image/')) {
              ogImage = `${siteUrl}/news-image/${encodeURIComponent(slug)}`;
            } else if (article.image_url.startsWith('http')) {
              ogImage = article.image_url.split('#')[0];
            } else {
              ogImage = `${siteUrl}${article.image_url.startsWith('/') ? '' : '/'}${article.image_url.split('#')[0]}`;
            }
          }

          // Generate Schema.org NewsArticle
          jsonLdSchemas.push({
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": canonicalUrl
            },
            "headline": rawTitle,
            "description": metaDescription,
            "image": [ogImage],
            "datePublished": publishedTime || new Date().toISOString(),
            "dateModified": modifiedTime || publishedTime || new Date().toISOString(),
            "inLanguage": "bn-BD",
            "articleSection": categoryName || "সংবাদ",
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
            }
          });

          // Generate BreadcrumbList Schema
          const breadcrumbs: any[] = [
            { "@type": "ListItem", "position": 1, "name": "প্রচ্ছদ", "item": siteUrl }
          ];
          if (categoryName && categorySlug) {
            breadcrumbs.push({
              "@type": "ListItem",
              "position": 2,
              "name": categoryName,
              "item": `${siteUrl}/category/${categorySlug}`
            });
            breadcrumbs.push({
              "@type": "ListItem",
              "position": 3,
              "name": rawTitle,
              "item": canonicalUrl
            });
          } else {
            breadcrumbs.push({
              "@type": "ListItem",
              "position": 2,
              "name": rawTitle,
              "item": canonicalUrl
            });
          }

          jsonLdSchemas.push({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": breadcrumbs
          });

          // Pre-render semantic article HTML for crawler indexation
          const articleContent = decodeSafe(article.content || "");
          preRenderedContent = `
            <article class="news-article-container" style="max-width:800px;margin:0 auto;padding:20px;font-family:sans-serif;">
              <nav aria-label="breadcrumb" style="margin-bottom:15px;font-size:14px;">
                <a href="/">প্রচ্ছদ</a> ${categoryName ? `&gt; <a href="/category/${categorySlug}">${escapeHtml(categoryName)}</a>` : ''} &gt; <span>${escapeHtml(rawTitle)}</span>
              </nav>
              <h1 style="font-size:28px;line-height:1.4;margin-bottom:12px;">${escapeHtml(rawTitle)}</h1>
              <div class="article-meta" style="font-size:14px;color:#555;margin-bottom:16px;">
                <span>প্রতিবেদক: <strong>${escapeHtml(authorName)}</strong></span> | 
                <time datetime="${publishedTime}">${publishedTime}</time>
              </div>
              <figure style="margin:0 0 20px 0;">
                <img src="${ogImage}" alt="${escapeHtml(rawTitle)}" style="max-width:100%;height:auto;border-radius:6px;" />
              </figure>
              <div class="article-body" style="font-size:18px;line-height:1.8;color:#222;">
                ${articleContent}
              </div>
            </article>
          `;
        }
      } else {
        robotsTag = "noindex, nofollow";
        pageTitle = "সংবাদ পাওয়া যায়নি | জনমত ২৪";
      }
    } else if (categoryMatch) {
      const slug = decodeURIComponent(categoryMatch[1]);
      canonicalUrl = `${siteUrl}/category/${encodeURIComponent(slug)}`;

      const res = await fetch(`${supabaseUrl}/rest/v1/categories?slug=eq.${encodeURIComponent(slug)}&select=id,name,description&limit=1`, {
        headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` }
      });
      const cats = await res.json();
      if (cats && cats.length > 0) {
        const cat = cats[0];
        const catName = decodeSafe(cat.name);
        pageTitle = `${catName} সংবাদ | জনমত ২৪`;
        if (cat.description) metaDescription = cleanText(cat.description, 160);
        else metaDescription = `${catName} বিভাগের সর্বশেষ খবর ও সংবাদ পড়ুন জনমত ২৪ এ।`;

        // Fetch top 10 articles in this category for crawlable links
        const newsRes = await fetch(`${supabaseUrl}/rest/v1/news?category_id=eq.${cat.id}&status=eq.published&select=title,slug,published_at&order=published_at.desc&limit=10`, {
          headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` }
        });
        const catArticles = await newsRes.json();
        
        let articleListHtml = '';
        if (Array.isArray(catArticles) && catArticles.length > 0) {
          articleListHtml = '<ul style="list-style:none;padding:0;">' + catArticles.map(a => `
            <li style="margin-bottom:12px;">
              <a href="/news/${encodeURIComponent(a.slug)}" style="font-size:18px;text-decoration:none;color:#0f172a;font-weight:600;">
                ${escapeHtml(decodeSafe(a.title))}
              </a>
            </li>
          `).join('') + '</ul>';
        }

        jsonLdSchemas.push({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": `${catName} সংবাদ`,
          "url": canonicalUrl,
          "description": metaDescription
        });

        preRenderedContent = `
          <div class="category-container" style="max-width:800px;margin:0 auto;padding:20px;font-family:sans-serif;">
            <nav aria-label="breadcrumb" style="margin-bottom:15px;font-size:14px;">
              <a href="/">প্রচ্ছদ</a> &gt; <span>${escapeHtml(catName)}</span>
            </nav>
            <h1 style="font-size:28px;margin-bottom:20px;">${escapeHtml(catName)} সংবাদ</h1>
            <div class="articles-list">
              ${articleListHtml}
            </div>
          </div>
        `;
      }
    } else if (isHomePage) {
      canonicalUrl = `${siteUrl}/`;
      
      jsonLdSchemas.push({
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
      });
    }
  } catch (err) {
    console.error("SEO Meta Error:", err);
  }

  // Pre-emptively load index.html to inject the tags
  const response = await context.next(); 
  
  if (response.headers.get("content-type")?.includes("text/html")) {
    const htmlText = await response.text();
    
    // Inject our full SEO & OG tags
    let injectedMeta = `
      <title>${escapeHtml(pageTitle)}</title>
      <meta name="title" content="${escapeHtml(pageTitle)}" />
      <meta name="description" content="${escapeHtml(metaDescription)}" />
      <meta name="robots" content="${robotsTag}" />
      <link rel="canonical" href="${canonicalUrl}" />

      <!-- Open Graph / Facebook -->
      <meta property="og:type" content="${ogType}" />
      <meta property="og:url" content="${canonicalUrl}" />
      <meta property="og:title" content="${escapeHtml(pageTitle)}" />
      <meta property="og:description" content="${escapeHtml(metaDescription)}" />
      <meta property="og:image" content="${ogImage}" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="জনমত ২৪" />
      <meta property="og:locale" content="bn_BD" />
      ${publishedTime ? `<meta property="article:published_time" content="${publishedTime}" />` : ''}
      ${modifiedTime ? `<meta property="article:modified_time" content="${modifiedTime}" />` : ''}
      ${categoryName ? `<meta property="article:section" content="${escapeHtml(categoryName)}" />` : ''}
      ${authorName ? `<meta property="article:author" content="${escapeHtml(authorName)}" />` : ''}

      <!-- Twitter -->
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content="${canonicalUrl}" />
      <meta name="twitter:title" content="${escapeHtml(pageTitle)}" />
      <meta name="twitter:description" content="${escapeHtml(metaDescription)}" />
      <meta name="twitter:image" content="${ogImage}" />
    `;

    if (jsonLdSchemas.length > 0) {
      for (const schema of jsonLdSchemas) {
        injectedMeta += `\n      <script type="application/ld+json">${JSON.stringify(schema)}</script>`;
      }
    }
    
    let modifiedHtml = htmlText;
    
    // Replace the default OG block if present to avoid duplicates
    const ogBlockRegex = /<!-- DEFAULT_OG_START -->[\s\S]*?<!-- DEFAULT_OG_END -->/;
    if (ogBlockRegex.test(modifiedHtml)) {
      modifiedHtml = modifiedHtml.replace(ogBlockRegex, injectedMeta);
    } else {
      // Fallback: inject before </head>
      modifiedHtml = modifiedHtml.replace('</head>', `${injectedMeta}\n</head>`);
    }
    
    // Also replace standard <title> and <meta name="description"> tags
    modifiedHtml = modifiedHtml.replace(/<title>.*?<\/title>/i, `<title>${escapeHtml(pageTitle)}</title>`);
    
    // Inject server pre-rendered content inside <div id="root"> for crawlers
    if (preRenderedContent) {
      modifiedHtml = modifiedHtml.replace('<div id="root"></div>', `<div id="root">${preRenderedContent}</div>`);
    }
    
    // Clean up content-encoding and content-length to prevent decoding errors
    const newHeaders = new Headers(response.headers);
    newHeaders.delete("content-encoding");
    newHeaders.delete("content-length");
    
    return new Response(modifiedHtml, {
      status: robotsTag.includes("noindex") && newsMatch ? 404 : response.status,
      headers: newHeaders
    });
  }

  return response;
};
