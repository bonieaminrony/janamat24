<?php
// Hide PHP errors on live server (errors break JSON output)
error_reporting(0);
ini_set('display_errors', 0);

// NO global Content-Type here — each action sets its own header

$action = isset($_GET['action']) ? $_GET['action'] : '';
$url    = isset($_GET['url'])    ? $_GET['url']    : '';

if (empty($url)) {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(400);
    echo json_encode(["error" => "No URL provided"], JSON_UNESCAPED_UNICODE);
    exit;
}

// --- SSRF Protection Check ---
$parsed_url = parse_url($url);
if (!$parsed_url || !isset($parsed_url['host']) || !in_array(strtolower($parsed_url['scheme'] ?? ''), ['http', 'https'])) {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(400);
    echo json_encode(["error" => "Invalid or unsupported URL format. Only HTTP and HTTPS are allowed."], JSON_UNESCAPED_UNICODE);
    exit;
}

$host = $parsed_url['host'];
$ips = gethostbynamel($host);
if ($ips === false) {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(400);
    echo json_encode(["error" => "Cannot resolve host"], JSON_UNESCAPED_UNICODE);
    exit;
}

function is_private_ip($ip) {
    if (!filter_var($ip, FILTER_VALIDATE_IP)) {
        return true; // treat invalid IPs as unsafe
    }
    
    // Check IPv4 private and reserved ranges
    // 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 127.0.0.0/8, 169.254.0.0/16, 0.0.0.0/8
    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
        $parts = explode('.', $ip);
        $first = (int)$parts[0];
        $second = (int)$parts[1];
        
        if ($first === 10 || $first === 127 || $first === 0) {
            return true;
        }
        if ($first === 172 && ($second >= 16 && $second <= 31)) {
            return true;
        }
        if ($first === 192 && $second === 168) {
            return true;
        }
        if ($first === 169 && $second === 254) {
            return true;
        }
    }
    
    // Check FILTER_FLAG_NO_PRIV_RANGE and FILTER_FLAG_NO_RES_RANGE
    if (!filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
        return true;
    }
    
    return false;
}

foreach ($ips as $ip) {
    if (is_private_ip($ip)) {
        header('Content-Type: application/json; charset=utf-8');
        http_response_code(403);
        echo json_encode(["error" => "Access to private or local network is forbidden."], JSON_UNESCAPED_UNICODE);
        exit;
    }
}
// ------------------------------

// ─── Helper: fetch a URL via cURL ────────────────────────────────────────────
function fetch_content($url, $extra_headers = []) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL,            $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_MAXREDIRS,      5);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_USERAGENT,
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    if (!empty($extra_headers)) {
        curl_setopt($ch, CURLOPT_HTTPHEADER, $extra_headers);
    }
    $data         = curl_exec($ch);
    $content_type = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    curl_close($ch);
    return [$data, $content_type];
}

// ─── Helper: check if an image URL looks like a reporter/author/logo photo ───
function is_bad_image($img_url) {
    $lower = strtolower($img_url);
    $bad_keywords = [
        'reporter', 'author', 'journalist', 'staff', 'profile',
        'writer',   'byline', 'avatar',     'user',  'member',
        'logo',     'icon',   'banner',     'adv',   'ad-',
        'loader',   'live',   'favicon',    'etvlogo',
        'logo_fb',  'logo-share', 'default_share', 'placeholder',
        'smiley',   'emoji',  'watermark',  '/reporter/',
        '/author/', '/journalist/', '/profile/', '/staff/',
    ];
    foreach ($bad_keywords as $kw) {
        if (strpos($lower, $kw) !== false) return true;
    }
    // Also skip tiny images (data URIs etc.)
    if (strpos($lower, 'data:') === 0) return true;
    return false;
}

// ─── Helper: resolve a possibly-relative URL to absolute ─────────────────────
function make_absolute($img, $base_url) {
    if (empty($img)) return '';
    if (strpos($img, 'http') === 0) return $img;
    if (strpos($img, '//') === 0) return 'https:' . $img;
    $parsed = parse_url($base_url);
    $base   = $parsed['scheme'] . '://' . $parsed['host'];
    return (strpos($img, '/') === 0) ? $base . $img : $base . '/' . $img;
}


// ═══════════════════════════════════════════════════════════════════════════════
// ACTION: fetch  — scrape a news page and return title/image/content/category
// ═══════════════════════════════════════════════════════════════════════════════
if ($action === 'fetch') {
    header('Content-Type: application/json; charset=utf-8');

    // ── Try Janamat24 Supabase first ──────────────────────────────────────────
    if (preg_match('/\/news\/([^?#]+)/', $url, $matches)) {
        $slug        = urldecode($matches[1]);
        $encodedSlug = rawurlencode($slug);

        $supabaseUrl = 'https://gsjxolnxtckdbjpfcobx.supabase.co/rest/v1/news'
                     . '?slug=eq.' . $encodedSlug
                     . '&select=title,excerpt,content,image_url,status,categories(name)&limit=1';
        $supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.'
                     . 'eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzanhvbG54dGNrZGJqcGZjb2J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMDYxODMsImV4cCI6MjA4MTg4MjE4M30.'
                     . 'Xfb1rQOelf96nq3MiPkjAEUwv5jhOtNAQWI6x-jshjU';

        list($sb_response,) = fetch_content($supabaseUrl, [
            'apikey: '       . $supabaseKey,
            'Authorization: Bearer ' . $supabaseKey,
        ]);

        $sb_data = json_decode($sb_response, true);
        if (is_array($sb_data) && count($sb_data) > 0) {
            $article = $sb_data[0];
            $title   = !empty($article['title'])    ? $article['title']    : '';
            $image   = !empty($article['image_url'])? $article['image_url']: '';
            $content = !empty($article['content'])  ? $article['content']  : '';
            $excerpt = !empty($article['excerpt'])  ? $article['excerpt']  : '';
            $cat     = (!empty($article['categories']) && !empty($article['categories']['name'])) ? $article['categories']['name'] : '';

            if (!empty($image) && strpos($image, 'http') !== 0) {
                $image = 'https://janamat24.com' . (strpos($image, '/') === 0 ? '' : '/') . $image;
            }

            if (!empty($title)) {
                echo json_encode([
                    "title"    => trim($title),
                    "image"    => trim($image),
                    "content"  => $content,
                    "excerpt"  => trim($excerpt),
                    "category" => trim($cat),
                ], JSON_UNESCAPED_UNICODE);
                exit;
            }
        }
    }

    // ── Fallback: scrape the HTML ─────────────────────────────────────────────
    list($html,) = fetch_content($url);
    if (!$html) {
        http_response_code(500);
        echo json_encode(["error" => "Failed to fetch URL"], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Strip noise
    $html = preg_replace('/<script[^>]*>.*?<\/script>/is',   '', $html);
    $html = preg_replace('/<style[^>]*>.*?<\/style>/is',     '', $html);
    $html = preg_replace('/<noscript[^>]*>.*?<\/noscript>/is','', $html);
    $html = preg_replace('/<header[^>]*>.*?<\/header>/is',   '', $html);
    $html = preg_replace('/<nav[^>]*>.*?<\/nav>/is',         '', $html);
    $html = preg_replace('/<footer[^>]*>.*?<\/footer>/is',   '', $html);
    $html = preg_replace('/<aside[^>]*>.*?<\/aside>/is',     '', $html);
    $html = preg_replace('/<!--.*?-->/s',                     '', $html);

    // ── Title ─────────────────────────────────────────────────────────────────
    $title = '';
    if (preg_match('/<meta\s+(?:property|name)="og:title"\s+content="([^"]+)"/i', $html, $m)) {
        $title = $m[1];
    }
    if (empty($title) && preg_match('/<h1[^>]*>(.*?)<\/h1>/is', $html, $m)) {
        $title = strip_tags($m[1]);
    }
    if (empty($title) && preg_match('/<title>(.*?)<\/title>/is', $html, $m)) {
        $title = strip_tags($m[1]);
    }
    $title = trim(html_entity_decode($title, ENT_QUOTES, 'UTF-8'));
    $title = preg_replace(
        '/\s*[-|]\s*(?:Ekushey Television|Ekushey TV|একুশে টেলিভিশন|একুশে টিভি|জনমত ২৪|Janamat24|Janamat 24)\s*$/ui',
        '', $title
    );

    // ── Category ──────────────────────────────────────────────────────────────
    $category = '';
    if (preg_match('/<meta\s+(?:property|name)="article:section"\s+content="([^"]+)"/i', $html, $m)
     || preg_match('/<meta\s+content="([^"]+)"\s+(?:property|name)="article:section"/i', $html, $m)) {
        $category = trim(html_entity_decode($m[1], ENT_QUOTES, 'UTF-8'));
    } else {
        // Breadcrumb fallback
        if (preg_match('/<(?:ol|ul)[^>]*class="[^"]*breadcrumb[^"]*"[^>]*>(.*?)<\/(?:ol|ul)>/is', $html, $m)) {
            if (preg_match_all('/<li[^>]*>(.*?)<\/li>/is', $m[1], $li)) {
                if (count($li[1]) > 1) $category = trim(strip_tags($li[1][1]));
            } elseif (preg_match_all('/<a[^>]*>(.*?)<\/a>/is', $m[1], $a)) {
                if (count($a[1]) > 1) $category = trim(strip_tags($a[1][1]));
            }
        }
    }

    // ── Image — prefer article featured image, skip reporter/author photos ────
    $image = '';

    // 1. Try og:image (most reliable on proper news sites)
    if (preg_match('/<meta\s+(?:property|name)="og:image"\s+content="([^"]+)"/i', $html, $m)
     || preg_match('/<meta\s+content="([^"]+)"\s+(?:property|name)="og:image"/i', $html, $m)) {
        $candidate = trim($m[1]);
        if (!is_bad_image($candidate)) {
            $image = $candidate;
        }
    }

    // 2. Structured data / twitter:image
    if (empty($image)) {
        if (preg_match('/<meta\s+(?:property|name)="twitter:image"\s+content="([^"]+)"/i', $html, $m)) {
            $candidate = trim($m[1]);
            if (!is_bad_image($candidate)) $image = $candidate;
        }
    }

    // 3. Featured/thumbnail image inside known article containers
    if (empty($image)) {
        $article_classes = 'DNewsDetails|detail-details|story-element|article-content|entry-content'
                         . '|news-details|article-body|news-text|post-content|single-post|news-body'
                         . '|article__body|content-body|news__body|newsbody|bd-post-content';
        if (preg_match(
            '/(?:class="[^"]*(?:' . $article_classes . ')[^"]*")[^>]*>.*?<img[^>]+src="([^"]+)"/is',
            $html, $m
        )) {
            $candidate = trim($m[1]);
            if (!is_bad_image($candidate)) $image = $candidate;
        }
    }

    // 4. Featured image wrapper divs
    if (empty($image)) {
        $wrapper_classes = 'DetailImage|FeaturedImage|DNewsImg|main-image|featured-image'
                         . '|post-thumbnail|article-image|hero-image|news-img|thumb-image';
        if (preg_match(
            '/<div[^>]*class="[^"]*(?:' . $wrapper_classes . ')[^"]*"[^>]*>.*?<img[^>]+src="([^"]+)"/is',
            $html, $m
        )) {
            $candidate = trim($m[1]);
            if (!is_bad_image($candidate)) $image = $candidate;
        }
    }

    // 5. Largest/first img not flagged as bad (skip very small thumbnails by path heuristic)
    if (empty($image)) {
        if (preg_match_all('/<img[^>]+src="([^"]+)"/i', $html, $all_imgs)) {
            foreach ($all_imgs[1] as $img) {
                if (!is_bad_image($img)) {
                    $image = trim($img);
                    break;
                }
            }
        }
    }

    $image = make_absolute($image, $url);

    // ── Content paragraphs ────────────────────────────────────────────────────
    $content_area = $html;
    $wrapper_pattern = '/class="[^"]*(?:DNewsDetails|detail-details|story-element|article-content'
                     . '|entry-content|news-details|article-body|news-text|post-content|single-post'
                     . '|news-body|article__body|content-body|news__body|newsbody|bd-post-content)[^"]*"[^>]*>(.*)/is';
    if (preg_match($wrapper_pattern, $html, $area_m)) {
        $content_area = substr($area_m[1], 0, 40000);
    }

    $content_body = '';
    $excerpt      = '';
    $boilerplate  = [
        'copyright','terms of use','privacy policy','cookie','advertisement',
        'subscribe','follow us','facebook','twitter','instagram','telegram',
        'youtube','টেলিফোন','ফ্যাক্স','ইমেল','পড়ুন','আরও পড়ুন',
        'developed by','designed by','©','সর্বস্বত্ব',
    ];

    if (preg_match_all('/<p[^>]*>(.*?)<\/p>/is', $content_area, $p_matches)) {
        $clean = [];
        foreach ($p_matches[1] as $p) {
            $p_text  = trim(strip_tags($p));
            $p_lower = strtolower($p_text);
            $bad     = false;
            foreach ($boilerplate as $term) {
                if (strpos($p_lower, $term) !== false) { $bad = true; break; }
            }
            if (mb_strlen($p_text, 'UTF-8') > 10 && !$bad) {
                $clean[] = '<p>' . htmlspecialchars($p_text, ENT_QUOTES, 'UTF-8') . '</p>';
            }
        }
        $content_body = implode('', $clean);
        $excerpt      = count($clean) > 0 ? trim(strip_tags($clean[0])) : '';
    }

    echo json_encode([
        "title"    => trim($title),
        "image"    => trim($image),
        "content"  => $content_body,
        "excerpt"  => $excerpt,
        "category" => $category,
    ], JSON_UNESCAPED_UNICODE);
    exit;
}


// ═══════════════════════════════════════════════════════════════════════════════
// ACTION: image  — proxy an external image (fixes CORS on live server)
// ═══════════════════════════════════════════════════════════════════════════════
if ($action === 'image') {
    // Do NOT set JSON header here — we return binary image data
    list($data, $content_type) = fetch_content($url, [
        'Accept: image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Sec-Fetch-Dest: image',
        'Sec-Fetch-Mode: no-cors',
    ]);

    if ($data) {
        // Make sure content_type is an image type
        if (empty($content_type) || strpos($content_type, 'image') === false) {
            $content_type = 'image/jpeg';
        }
        header('Content-Type: ' . $content_type);
        header('Cache-Control: public, max-age=86400');
        header('Access-Control-Allow-Origin: *');
        echo $data;
    } else {
        http_response_code(500);
        header('Content-Type: text/plain');
        echo 'Failed to load image';
    }
    exit;
}


// ═══════════════════════════════════════════════════════════════════════════════
// Unknown action
// ═══════════════════════════════════════════════════════════════════════════════
header('Content-Type: application/json; charset=utf-8');
http_response_code(400);
echo json_encode(["error" => "Invalid action"], JSON_UNESCAPED_UNICODE);
