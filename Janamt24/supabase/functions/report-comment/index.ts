import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting: max 10 reports per IP per hour
const reportLimits = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ipHash: string): boolean {
  const now = Date.now();
  const limit = reportLimits.get(ipHash);
  
  if (!limit || now > limit.resetTime) {
    reportLimits.set(ipHash, { count: 1, resetTime: now + 3600000 }); // 1 hour
    return true;
  }
  
  if (limit.count >= 10) {
    return false;
  }
  
  limit.count++;
  return true;
}

async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('cf-connecting-ip') || 
                     'unknown';
    const ipHash = await hashIP(clientIP);

    // Check rate limit
    if (!checkRateLimit(ipHash)) {
      return new Response(
        JSON.stringify({ error: 'অনেক বেশি রিপোর্ট করেছেন। পরে আবার চেষ্টা করুন।' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { comment_id, reason } = await req.json();

    // Validate input
    if (!comment_id || typeof comment_id !== 'string') {
      return new Response(
        JSON.stringify({ error: 'মন্তব্য আইডি প্রয়োজন' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
      return new Response(
        JSON.stringify({ error: 'কারণ অন্তত ৫ অক্ষর হতে হবে' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (reason.length > 500) {
      return new Response(
        JSON.stringify({ error: 'কারণ ৫০০ অক্ষরের বেশি হতে পারবে না' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify comment exists
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('id')
      .eq('id', comment_id)
      .single();

    if (commentError || !comment) {
      return new Response(
        JSON.stringify({ error: 'মন্তব্য পাওয়া যায়নি' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert report
    const { error: insertError } = await supabase
      .from('comment_reports')
      .insert({
        comment_id,
        reason: reason.trim(),
        ip_hash: ipHash
      });

    if (insertError) {
      // Check if duplicate
      if (insertError.code === '23505') {
        return new Response(
          JSON.stringify({ error: 'আপনি ইতোমধ্যে এই মন্তব্যটি রিপোর্ট করেছেন' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.error('Report insert error:', insertError);
      throw insertError;
    }

    console.log(`Comment reported: ${comment_id}`);

    return new Response(
      JSON.stringify({ success: true, message: 'রিপোর্ট সফলভাবে জমা হয়েছে' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Report error:', error);
    return new Response(
      JSON.stringify({ error: 'রিপোর্ট করতে সমস্যা হয়েছে' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});