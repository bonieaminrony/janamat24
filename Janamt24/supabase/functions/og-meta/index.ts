import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Social media crawler User-Agents
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
];

function isCrawler(userAgent: string): boolean {
  if (!userAgent) return false;
  return crawlerPatterns.some(pattern => 
    userAgent.toLowerCase().includes(pattern.toLowerCase())
  );
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get('slug');
    
    console.log('OG Meta request for slug:', slug);
    
    if (!slug) {
      console.log('No slug provided');
      return new Response(
        JSON.stringify({ error: 'Slug is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch article data
    const { data: article, error } = await supabase
      .from('news')
      .select('id, title, excerpt, content, image_url, published_at, slug, categories(name)')
      .eq('slug', slug)
      .eq('status', 'published')
      .single() as { data: { 
        id: string; 
        title: string; 
        excerpt: string | null; 
        content: string | null; 
        image_url: string | null; 
        published_at: string | null; 
        slug: string; 
        categories: { name: string } | null;
      } | null, error: Error | null };

    if (error || !article) {
      console.log('Article not found:', error?.message);
      return new Response(
        JSON.stringify({ error: 'Article not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Article found:', article.title);

    const siteUrl = 'https://janamat24.com';
    const articleUrl = `${siteUrl}/news/${article.slug}`;
    const description = article.excerpt || (article.content?.substring(0, 160) + '...') || 'জনমত ২৪ - বাংলাদেশের বিশ্বস্ত সংবাদ মাধ্যম';
    
    // Handle image URL
    let imageUrl = `${siteUrl}/og-image.png`;
    if (article.image_url) {
      if (article.image_url.startsWith('http')) {
        imageUrl = article.image_url;
      } else {
        imageUrl = `${siteUrl}${article.image_url.startsWith('/') ? '' : '/'}${article.image_url}`;
      }
    }

    // Return article data as JSON for the frontend to use
    const responseData = {
      title: article.title,
      description: description,
      image: imageUrl,
      url: articleUrl,
      type: 'article',
      siteName: 'জনমত ২৪',
      locale: 'bn_BD',
      publishedAt: article.published_at,
      category: article.categories?.name,
    };

    console.log('Returning OG data:', responseData);

    return new Response(
      JSON.stringify(responseData),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600'
        } 
      }
    );

  } catch (error) {
    console.error('Error in og-meta function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
