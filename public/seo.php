<?php
// seo.php - Dynamic OpenGraph Meta Tags for Social Media Crawlers

$supabaseUrl = 'https://gsjxolnxtckdbjpfcobx.supabase.co';
$supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzanhvbG54dGNrZGJqcGZjb2J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMDYxODMsImV4cCI6MjA4MTg4MjE4M30.Xfb1rQOelf96nq3MiPkjAEUwv5jhOtNAQWI6x-jshjU';

$type = isset($_GET['type']) ? $_GET['type'] : '';
$slug = isset($_GET['slug']) ? $_GET['slug'] : '';
$urlPath = isset($_GET['path']) ? $_GET['path'] : '';

if (!$type && $urlPath) {
    $parts = explode('/', trim($urlPath, '/'));
    if (count($parts) >= 2) {
        $type = $parts[0];
        $slug = $parts[1];
    }
}

// Build site URL (always https for production)
$siteUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://$_SERVER[HTTP_HOST]";

// Build current URL properly — strip ?/& params to get the original path
$requestUri = $_SERVER['REQUEST_URI'];
// Remove seo.php query string artifacts so og:url is clean
$cleanPath = '';
if ($type && $slug) {
    $cleanPath = '/' . $type . '/' . urldecode($slug);
} else {
    $cleanPath = strtok($requestUri, '?');
}
$currentUrl = $siteUrl . $cleanPath;

$ogTitle = "জনমত ২৪ - সত্য প্রচার আমাদের অঙ্গীকার";
$ogDesc = "জনমত ২৪ একটি বিশ্বস্ত এবং নির্ভরযোগ্য বাংলা সংবাদ মাধ্যম। সর্বশেষ জাতীয়, আন্তর্জাতিক, রাজনীতি, খেলাধুলা ও বিনোদন সংবাদ পড়ুন।";
$ogImage = $siteUrl . "/og-image.png";

// Simple curl function
function fetchFromSupabase($endpoint) {
    global $supabaseUrl, $supabaseKey;
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $supabaseUrl . '/rest/v1/' . $endpoint);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array(
        'apikey: ' . $supabaseKey,
        'Authorization: Bearer ' . $supabaseKey
    ));
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    
    $result = curl_exec($ch);
    $err = curl_error($ch);
    curl_close($ch);
    
    if ($err) return null;
    return json_decode($result, true);
}

// Safely sanitize HTML contents for crawler indexing to prevent XSS
function sanitize_html($html) {
    // 1. Remove dangerous tags completely
    $html = preg_replace('/<(script|style|iframe|object|embed|applet)\b[^>]*>.*?<\/\1>/is', '', $html);
    $html = preg_replace('/<(script|style|iframe|object|embed|applet)\b[^>]*>/is', '', $html);
    
    // 2. Allow only safe formatting tags
    $allowedTags = '<p><br><b><strong><i><em><u><ul><ol><li><h1><h2><h3><h4><h5><h6><a><img><blockquote>';
    $html = strip_tags($html, $allowedTags);

    // 3. Strip event handlers (onclick, onerror, onload, etc.)
    $html = preg_replace('/\s+on[a-z]+\s*=\s*(["\'])(.*?)\1/is', '', $html);
    $html = preg_replace('/\s+on[a-z]+\s*=\s*([^\s>]+)/is', '', $html);

    // 4. Strip javascript: URIs in href
    $html = preg_replace('/href\s*=\s*(["\'])\s*javascript\s*:(.*?)\1/is', 'href="#"', $html);
    $html = preg_replace('/href\s*=\s*([^\s>]*javascript\s*:[^\s>]*)/is', 'href="#"', $html);

    return $html;
}

// ─────────────────────────────────────────────────────────────
// HANDLE /news-image/{slug} — serve the actual image binary
// ─────────────────────────────────────────────────────────────
if ($type === 'news-image' && $slug) {
    $decodedSlug = urldecode($slug);
    $encodedSlug = rawurlencode($decodedSlug);
    $data = fetchFromSupabase("news?slug=eq." . $encodedSlug . "&select=image_url&limit=1");

    if (is_array($data) && count($data) > 0 && !empty($data[0]['image_url'])) {
        $imageUrl = $data[0]['image_url'];

        if (strpos($imageUrl, 'data:image/') === 0) {
            // Serve base64 image as binary
            if (preg_match('/^data:([^;]+);base64,(.+)$/is', $imageUrl, $matches)) {
                $mimeType = trim($matches[1]);
                $base64Data = preg_replace('/\s+/', '', $matches[2]);
                $binaryData = base64_decode($base64Data);
                if ($binaryData !== false) {
                    header('Content-Type: ' . $mimeType);
                    header('Cache-Control: public, max-age=86400');
                    header('Access-Control-Allow-Origin: *');
                    header('Content-Length: ' . strlen($binaryData));
                    echo $binaryData;
                    exit;
                }
            }
        } elseif (strpos($imageUrl, 'http') === 0) {
            // External URL — redirect
            header("Location: " . $imageUrl, true, 302);
            exit;
        } else {
            // Relative URL — make absolute
            header("Location: " . $siteUrl . '/' . ltrim($imageUrl, '/'), true, 302);
            exit;
        }
    }

    // Fallback: serve default og-image
    header("Location: " . $siteUrl . "/og-image.png", true, 302);
    exit;
}

// ─────────────────────────────────────────────────────────────
// HANDLE /news/{slug} — inject OG meta for bots
// ─────────────────────────────────────────────────────────────
if ($type === 'news' && $slug) {
    $decodedSlug = urldecode($slug);
    $encodedSlug = rawurlencode($decodedSlug);
    $data = fetchFromSupabase("news?slug=eq." . $encodedSlug . "&select=title,excerpt,content,image_url,status&limit=1");

    if (is_array($data) && count($data) > 0 && isset($data[0]['status']) && $data[0]['status'] === 'published') {
        $article = $data[0];
        $ogTitle = !empty($article['title']) ? html_entity_decode($article['title'], ENT_QUOTES, 'UTF-8') : $ogTitle;

        $rawContent = !empty($article['excerpt']) ? $article['excerpt'] : (!empty($article['content']) ? $article['content'] : $ogDesc);
        $ogDesc = mb_substr(strip_tags(html_entity_decode($rawContent, ENT_QUOTES, 'UTF-8')), 0, 160) . '...';

        if (!empty($article['image_url'])) {
            if (strpos($article['image_url'], 'data:image/') === 0) {
                // Use the news-image proxy URL so Facebook can load the image
                $ogImage = $siteUrl . "/news-image/" . rawurlencode($decodedSlug);
            } elseif (strpos($article['image_url'], 'http') === 0) {
                $ogImage = $article['image_url'];
            } else {
                $ogImage = $siteUrl . '/' . ltrim($article['image_url'], '/');
            }
        }
    }

// ─────────────────────────────────────────────────────────────
// HANDLE /category/{slug} — inject OG meta for bots
// ─────────────────────────────────────────────────────────────
} elseif ($type === 'category' && $slug) {
    $decodedSlug = urldecode($slug);
    $encodedSlug = rawurlencode($decodedSlug);
    $data = fetchFromSupabase("categories?slug=eq." . $encodedSlug . "&select=name,description&limit=1");

    if (is_array($data) && count($data) > 0) {
        $cat = $data[0];
        $ogTitle = html_entity_decode($cat['name'], ENT_QUOTES, 'UTF-8') . " | জনমত ২৪";
        if (!empty($cat['description'])) {
            $ogDesc = $cat['description'];
        }
    }
}

// Determine page type for og:type
$ogType = ($type === 'news') ? 'article' : 'website';
?>
<!DOCTYPE html>
<html lang="bn">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($ogTitle, ENT_QUOTES, 'UTF-8') ?></title>

    <meta name="description" content="<?= htmlspecialchars($ogDesc, ENT_QUOTES, 'UTF-8') ?>" />

    <!-- Open Graph -->
    <meta property="og:type" content="<?= $ogType ?>" />
    <meta property="og:url" content="<?= htmlspecialchars($currentUrl, ENT_QUOTES, 'UTF-8') ?>" />
    <meta property="og:title" content="<?= htmlspecialchars($ogTitle, ENT_QUOTES, 'UTF-8') ?>" />
    <meta property="og:description" content="<?= htmlspecialchars($ogDesc, ENT_QUOTES, 'UTF-8') ?>" />
    <meta property="og:image" content="<?= htmlspecialchars($ogImage, ENT_QUOTES, 'UTF-8') ?>" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:site_name" content="জনমত ২৪" />
    <meta property="og:locale" content="bn_BD" />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="<?= htmlspecialchars($ogTitle, ENT_QUOTES, 'UTF-8') ?>" />
    <meta name="twitter:description" content="<?= htmlspecialchars($ogDesc, ENT_QUOTES, 'UTF-8') ?>" />
    <meta name="twitter:image" content="<?= htmlspecialchars($ogImage, ENT_QUOTES, 'UTF-8') ?>" />
</head>
<body>
    <?php if ($type === 'news' && !empty($article)): ?>
        <article style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: sans-serif;">
            <h1 style="font-size: 2.2rem; margin-bottom: 20px; color: #111;"><?= htmlspecialchars($ogTitle, ENT_QUOTES, 'UTF-8') ?></h1>
            <?php if (!empty($article['image_url'])): ?>
                <div style="margin: 20px 0; text-align: center;">
                    <img src="<?= htmlspecialchars($ogImage, ENT_QUOTES, 'UTF-8') ?>" alt="<?= htmlspecialchars($ogTitle, ENT_QUOTES, 'UTF-8') ?>" style="max-width: 100%; height: auto; border-radius: 8px;" />
                </div>
            <?php endif; ?>
            <div style="font-size: 1.15rem; line-height: 1.8; color: #222;">
                <?php 
                if (!empty($article['content'])) {
                    echo sanitize_html($article['content']);
                } else {
                    echo '<p>' . nl2br(htmlspecialchars($ogDesc, ENT_QUOTES, 'UTF-8')) . '</p>';
                }
                ?>
            </div>
        </article>
    <?php elseif ($type === 'category' && !empty($cat)): ?>
        <main style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: sans-serif;">
            <h1 style="font-size: 2.2rem; margin-bottom: 20px; color: #111;"><?= htmlspecialchars($ogTitle, ENT_QUOTES, 'UTF-8') ?></h1>
            <p style="font-size: 1.15rem; line-height: 1.8; color: #222;"><?= htmlspecialchars($ogDesc, ENT_QUOTES, 'UTF-8') ?></p>
        </main>
    <?php else: ?>
        <main style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: sans-serif;">
            <h1><?= htmlspecialchars($ogTitle, ENT_QUOTES, 'UTF-8') ?></h1>
            <p><?= htmlspecialchars($ogDesc, ENT_QUOTES, 'UTF-8') ?></p>
        </main>
    <?php endif; ?>

    <script>
        // Redirect real users to the SPA, appending ?spa=1 to break rewrite loop
        var currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('spa', '1');
        window.location.replace(currentUrl.toString());
    </script>
</body>
</html>
