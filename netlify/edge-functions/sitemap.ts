import type { Context } from "@netlify/edge-functions";

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  const siteUrl = url.origin;

  const supabaseUrl = Deno.env.get("VITE_SUPABASE_URL");
  const supabaseKey = Deno.env.get("VITE_SUPABASE_ANON_KEY") || Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY");

  if (!supabaseUrl || !supabaseKey) {
    return new Response("Configuration missing", { status: 500 });
  }

  try {
    // 1. Fetch categories
    const catRes = await fetch(`${supabaseUrl}/rest/v1/categories?select=slug`, {
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`
      }
    });
    const categories = await catRes.json();

    // 2. Fetch published news articles (up to 10,000 articles)
    const newsRes = await fetch(`${supabaseUrl}/rest/v1/news?status=eq.published&select=slug,published_at&order=published_at.desc&limit=10000`, {
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`
      }
    });
    const news = await newsRes.json();

    // 3. Generate XML string
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Homepage
    xml += `  <url>\n`;
    xml += `    <loc>${siteUrl}/</loc>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>1.00</priority>\n`;
    xml += `  </url>\n`;

    // Categories
    if (Array.isArray(categories)) {
      for (const cat of categories) {
        if (cat.slug) {
          const encodedSlug = encodeURIComponent(cat.slug);
          xml += `  <url>\n`;
          xml += `    <loc>${siteUrl}/category/${encodedSlug}</loc>\n`;
          xml += `    <changefreq>daily</changefreq>\n`;
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
          if (article.published_at) {
            try {
              const lastmod = new Date(article.published_at).toISOString();
              xml += `    <lastmod>${lastmod}</lastmod>\n`;
            } catch (e) {
              // Ignore invalid dates
            }
          }
          xml += `    <changefreq>weekly</changefreq>\n`;
          xml += `    <priority>0.60</priority>\n`;
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
