import type { Context } from "@netlify/edge-functions";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function decodeSafe(str: string): string {
  try {
    return /%[0-9A-Fa-f]{2}/.test(str) ? decodeURIComponent(str) : str;
  } catch (e) {
    return str;
  }
}

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  const siteUrl = url.origin;
  const isNewsSitemap = url.pathname.includes('news-sitemap');

  const supabaseUrl = Deno.env.get("VITE_SUPABASE_URL");
  const supabaseKey = Deno.env.get("VITE_SUPABASE_ANON_KEY") || Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY");

  if (!supabaseUrl || !supabaseKey) {
    return new Response("Configuration missing", { status: 500 });
  }

  try {
    // ----------------------------------------------------
    // GOOGLE NEWS SITEMAP (/news-sitemap.xml)
    // ----------------------------------------------------
    if (isNewsSitemap) {
      // 48 hours ago cutoff for Google News guidelines
      const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

      let newsRes = await fetch(`${supabaseUrl}/rest/v1/news?status=eq.published&published_at=gte.${encodeURIComponent(twoDaysAgo)}&select=title,slug,published_at&order=published_at.desc&limit=1000`, {
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`
        }
      });
      let news = await newsRes.json();

      // Fallback: If no news within 48 hours (e.g. testing), fetch last 50 published news
      if (!Array.isArray(news) || news.length === 0) {
        newsRes = await fetch(`${supabaseUrl}/rest/v1/news?status=eq.published&select=title,slug,published_at&order=published_at.desc&limit=50`, {
          headers: {
            "apikey": supabaseKey,
            "Authorization": `Bearer ${supabaseKey}`
          }
        });
        news = await newsRes.json();
      }

      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
      xml += `        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n`;

      if (Array.isArray(news)) {
        for (const article of news) {
          if (article.slug && article.title) {
            const encodedSlug = encodeURIComponent(article.slug);
            const rawTitle = decodeSafe(article.title);
            const pubDate = article.published_at ? new Date(article.published_at).toISOString() : new Date().toISOString();

            xml += `  <url>\n`;
            xml += `    <loc>${siteUrl}/news/${encodedSlug}</loc>\n`;
            xml += `    <news:news>\n`;
            xml += `      <news:publication>\n`;
            xml += `        <news:name>জনমত ২৪</news:name>\n`;
            xml += `        <news:language>bn</news:language>\n`;
            xml += `      </news:publication>\n`;
            xml += `      <news:publication_date>${pubDate}</news:publication_date>\n`;
            xml += `      <news:title>${escapeXml(rawTitle)}</news:title>\n`;
            xml += `    </news:news>\n`;
            xml += `  </url>\n`;
          }
        }
      }

      xml += `</urlset>\n`;

      return new Response(xml, {
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
          "Cache-Control": "public, max-age=1800" // Cache for 30 minutes
        }
      });
    }

    // ----------------------------------------------------
    // STANDARD SITEMAP (/sitemap.xml)
    // ----------------------------------------------------
    // 1. Fetch categories
    const catRes = await fetch(`${supabaseUrl}/rest/v1/categories?select=slug`, {
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`
      }
    });
    const categories = await catRes.json();

    // 2. Fetch published news articles (up to 10,000 articles)
    const newsRes = await fetch(`${supabaseUrl}/rest/v1/news?status=eq.published&select=slug,published_at,updated_at&order=published_at.desc&limit=10000`, {
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`
      }
    });
    const news = await newsRes.json();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Homepage
    xml += `  <url>\n`;
    xml += `    <loc>${siteUrl}/</loc>\n`;
    xml += `    <changefreq>always</changefreq>\n`;
    xml += `    <priority>1.00</priority>\n`;
    xml += `  </url>\n`;

    // Categories
    if (Array.isArray(categories)) {
      for (const cat of categories) {
        if (cat.slug) {
          const encodedSlug = encodeURIComponent(cat.slug);
          xml += `  <url>\n`;
          xml += `    <loc>${siteUrl}/category/${encodedSlug}</loc>\n`;
          xml += `    <changefreq>hourly</changefreq>\n`;
          xml += `    <priority>0.80</priority>\n`;
          xml += `  </url>\n`;
        }
      }
    }

    // News Articles
    if (Array.isArray(news)) {
      for (const article of news) {
        if (article.slug) {
          const encodedSlug = encodeURIComponent(article.slug);
          xml += `  <url>\n`;
          xml += `    <loc>${siteUrl}/news/${encodedSlug}</loc>\n`;
          if (article.updated_at || article.published_at) {
            try {
              const lastmod = new Date(article.updated_at || article.published_at).toISOString();
              xml += `    <lastmod>${lastmod}</lastmod>\n`;
            } catch (e) {}
          }
          xml += `    <changefreq>daily</changefreq>\n`;
          xml += `    <priority>0.70</priority>\n`;
          xml += `  </url>\n`;
        }
      }
    }

    xml += `</urlset>\n`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600" // Cache for 1 hour
      }
    });

  } catch (err) {
    console.error("Sitemap generation error:", err);
    return new Response("Error generating sitemap", { status: 500 });
  }
};
