import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting: max 5 comments per IP per 5 minutes
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_MAX = 5;

// Simple in-memory rate limiter (resets on function cold start)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ipHash: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ipHash);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ipHash, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetIn: RATE_LIMIT_WINDOW_MS };
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetIn: record.resetAt - now };
  }

  record.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - record.count, resetIn: record.resetAt - now };
}

// Hash IP address for privacy
async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.slice(0, 16)); // Salt with part of service key
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('cf-connecting-ip') ||
                     req.headers.get('x-real-ip') ||
                     'unknown';

    const ipHash = await hashIP(clientIP);

    // Check rate limit
    const rateLimit = checkRateLimit(ipHash);
    if (!rateLimit.allowed) {
      console.log(`Rate limit exceeded for IP hash: ${ipHash}`);
      return new Response(
        JSON.stringify({ 
          error: 'অনেক বেশি মন্তব্য। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।',
          resetIn: Math.ceil(rateLimit.resetIn / 1000)
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetIn / 1000))
          } 
        }
      );
    }

    const { news_id, parent_id, display_name, content } = await req.json();

    // Validate required fields
    if (!news_id || !content?.trim()) {
      return new Response(
        JSON.stringify({ error: 'news_id এবং content আবশ্যক' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const rawContent = content.trim();
    const decodedContent = (function decodeSafe(str: string) {
      try {
        return /%[0-9A-Fa-f]{2}/.test(str) ? decodeURIComponent(str) : str;
      } catch (e) {
        return str;
      }
    })(rawContent);

    // Validate content length
    if (decodedContent.length < 2) {
      return new Response(
        JSON.stringify({ error: 'মন্তব্য কমপক্ষে ২ অক্ষরের হতে হবে' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (decodedContent.length > 2000) {
      return new Response(
        JSON.stringify({ error: 'মন্তব্য ২০০০ অক্ষরের বেশি হতে পারবে না' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate display_name if provided
    const rawName = display_name?.trim() || "";
    const decodedName = (function decodeSafe(str: string) {
      try {
        return /%[0-9A-Fa-f]{2}/.test(str) ? decodeURIComponent(str) : str;
      } catch (e) {
        return str;
      }
    })(rawName);
    const sanitizedName = decodedName.slice(0, 50) || null;

    // Create Supabase client with service role (bypasses RLS)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verify news exists and is published
    const { data: news, error: newsError } = await supabase
      .from('news')
      .select('id')
      .eq('id', news_id)
      .eq('status', 'published')
      .single();

    if (newsError || !news) {
      console.log(`News not found or not published: ${news_id}`);
      return new Response(
        JSON.stringify({ error: 'সংবাদ খুঁজে পাওয়া যায়নি' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If parent_id provided, verify it exists and belongs to same news
    if (parent_id) {
      const { data: parentComment, error: parentError } = await supabase
        .from('comments')
        .select('id, news_id')
        .eq('id', parent_id)
        .single();

      if (parentError || !parentComment || parentComment.news_id !== news_id) {
        return new Response(
          JSON.stringify({ error: 'মূল মন্তব্য খুঁজে পাওয়া যায়নি' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Insert comment
    const { data: comment, error: insertError } = await supabase
      .from('comments')
      .insert({
        news_id,
        parent_id: parent_id || null,
        display_name: sanitizedName,
        content: decodedContent,
        ip_hash: ipHash
      })
      .select('id, display_name, content, created_at, parent_id')
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'মন্তব্য সংরক্ষণ করতে সমস্যা হয়েছে' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Comment created: ${comment.id} for news: ${news_id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        comment,
        remaining: rateLimit.remaining
      }),
      { 
        status: 201, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': String(rateLimit.remaining)
        } 
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'সার্ভার ত্রুটি' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
