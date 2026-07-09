import type { Context } from "@netlify/edge-functions";

const crawlerPatterns = [
  'facebookexternalhit',
  'Facebot',
  'Twitterbot',
  'LinkedInBot',
  'WhatsApp',
  'Slackbot',
  'TelegramBot',
  'Discordbot',
  'Pinterest',
  'vkShare',
  'W3C_Validator',
  'Baiduspider',
  'Sogou',
  'Googlebot'
];

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  
  // 1. Handle news image rendering directly (supports both base64 and standard redirects)
  const newsImageMatch = url.pathname.match(/\/news-image\/([^/?#]+)/);
  if (newsImageMatch) {
    const slug = decodeURIComponent(newsImageMatch[1]);
    const supabaseUrl = Deno.env.get("VITE_SUPABASE_URL");
    const supabaseKey = Deno.env.get("VITE_SUPABASE_ANON_KEY") || Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY");
    
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
          return Response.redirect(`${url.origin}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`, 307);
        }
      }
    } catch (e) {
      console.error("News Image Serve Error:", e);
    }
    return new Response("Image not found", { status: 404 });
  }

  const userAgent = request.headers.get("user-agent") || "";
  
  // Only intercept bots
  const isCrawler = crawlerPatterns.some(pattern => 
    userAgent.toLowerCase().includes(pattern.toLowerCase())
  );

  if (!isCrawler) {
    return; // Pass through to standard React SPA naturally
  }

  // Identify if it's a news article or category page
  const newsMatch = url.pathname.match(/\/news\/([^/?#]+)/);
  const categoryMatch = url.pathname.match(/\/category\/([^/?#]+)/);
  
  if (!newsMatch && !categoryMatch) return;

  const supabaseUrl = Deno.env.get("VITE_SUPABASE_URL");
  const supabaseKey = Deno.env.get("VITE_SUPABASE_ANON_KEY") || Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY");
  
  // If env vars are missing, we can't fetch data, fallback to normal html
  if (!supabaseUrl || !supabaseKey) return;

  let ogTitle = "জনমত ২৪ - বিশ্বস্ত সংবাদ মাধ্যম";
  let ogDesc = "জনমত ২৪ একটি বিশ্বস্ত এবং নির্ভরযোগ্য বাংলা সংবাদ মাধ্যম।";
  let ogImage = `${url.origin}/og-image.png`;

  try {
    if (newsMatch) {
      const slug = decodeURIComponent(newsMatch[1]);
      const res = await fetch(`${supabaseUrl}/rest/v1/news?slug=eq.${encodeURIComponent(slug)}&select=title,excerpt,content,image_url,status&limit=1`, {
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`
        }
      });
      
      const articles = await res.json();
      if (articles && articles.length > 0 && articles[0].status === 'published') {
        const article = articles[0];
        
        // Ensure decoding
        ogTitle = (function decodeSafe(str: string) {
          try { return /%[0-9A-Fa-f]{2}/.test(str) ? decodeURIComponent(str) : str; } catch(e) { return str; }
        })(article.title);
        
        const rawContent = article.excerpt || article.content || ogDesc;
        const decodedContent = (function decodeSafe(str: string) {
          try { return /%[0-9A-Fa-f]{2}/.test(str) ? decodeURIComponent(str) : str; } catch(e) { return str; }
        })(rawContent);
        
        // Strip html tags for plain description
        ogDesc = decodedContent.replace(/<[^>]*>?/gm, '').substring(0, 160) + '...';
        
        if (article.image_url) {
          if (article.image_url.startsWith('data:image/')) {
            ogImage = `${url.origin}/news-image/${encodeURIComponent(slug)}`;
          } else {
            ogImage = article.image_url.startsWith('http') 
              ? article.image_url 
              : `${url.origin}${article.image_url.startsWith('/') ? '' : '/'}${article.image_url}`;
          }
        }
      }
    } else if (categoryMatch) {
      const slug = decodeURIComponent(categoryMatch[1]);
      const res = await fetch(`${supabaseUrl}/rest/v1/categories?slug=eq.${encodeURIComponent(slug)}&select=name,description&limit=1`, {
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`
        }
      });
      const cats = await res.json();
      if (cats && cats.length > 0) {
        const cat = cats[0];
        ogTitle = cat.name + " | জনমত ২৪";
        if (cat.description) ogDesc = cat.description;
      }
    }
  } catch (err) {
    console.error("SEO Meta Error:", err);
  }

  // Pre-emptively load index.html to inject the tags
  const response = await context.next(); 
  
  if (response.headers.get("content-type")?.includes("text/html")) {
    const htmlText = await response.text();
    
    // Inject our OG tags into the <head>
    const ogTags = `
      <meta property="og:type" content="article" />
      <meta property="og:url" content="${url.href}" />
      <meta property="og:title" content="${ogTitle.replace(/"/g, '&quot;')}" />
      <meta property="og:description" content="${ogDesc.replace(/"/g, '&quot;')}" />
      <meta property="og:image" content="${ogImage}" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="${ogTitle.replace(/"/g, '&quot;')}" />
      <meta name="twitter:description" content="${ogDesc.replace(/"/g, '&quot;')}" />
      <meta name="twitter:image" content="${ogImage}" />
    `;
    
    let modifiedHtml = htmlText;
    
    // Replace the default OG block if present to avoid duplicates
    const ogBlockRegex = /<!-- DEFAULT_OG_START -->[\s\S]*?<!-- DEFAULT_OG_END -->/;
    if (ogBlockRegex.test(modifiedHtml)) {
      modifiedHtml = modifiedHtml.replace(ogBlockRegex, ogTags);
    } else {
      // Fallback: inject before </head>
      modifiedHtml = modifiedHtml.replace('</head>', `${ogTags}\n</head>`);
    }
    
    // Also replace the standard <title> tag for good measure
    modifiedHtml = modifiedHtml.replace(/<title>.*?<\/title>/i, `<title>${ogTitle.replace(/"/g, '&quot;')}</title>`);
    
    // Clean up content-encoding and content-length to prevent decoding errors
    const newHeaders = new Headers(response.headers);
    newHeaders.delete("content-encoding");
    newHeaders.delete("content-length");
    
    return new Response(modifiedHtml, {
      status: response.status,
      headers: newHeaders
    });
  }

  return response;
};
