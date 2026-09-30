<?php
// sitemap.php - Dynamic XML Sitemap & Google News Sitemap for Search Engines

$isNewsSitemap = (isset($_GET['type']) && $_GET['type'] === 'news') || 
                 (isset($_SERVER['REQUEST_URI']) && strpos($_SERVER['REQUEST_URI'], 'news-sitemap') !== false);

header("Content-Type: application/xml; charset=utf-8");
header("X-Robots-Tag: noindex, follow");

$supabaseUrl = 'https://gsjxolnxtckdbjpfcobx.supabase.co';
$supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzanhvbG54dGNrZGJqcGZjb2J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMDYxODMsImV4cCI6MjA4MTg4MjE4M30.Xfb1rQOelf96nq3MiPkjAEUwv5jhOtNAQWI6x-jshjU';

$siteUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://$_SERVER[HTTP_HOST]";

function fetchFromSupabaseRange($endpoint, $from = 0, $to = 999) {
    global $supabaseUrl, $supabaseKey;
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $supabaseUrl . '/rest/v1/' . $endpoint);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array(
        'apikey: ' . $supabaseKey,
        'Authorization: Bearer ' . $supabaseKey,
        'Range: ' . $from . '-' . $to
    ));
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    
    $result = curl_exec($ch);
    $err = curl_error($ch);
    curl_close($ch);
    
    if ($err) return null;
    return json_decode($result, true);
}

function decodeSafePhp($str) {
    if (!$str) return '';
    return preg_match('/%[0-9A-Fa-f]{2}/', $str) ? urldecode($str) : $str;
}

// ---------------------------------------------------------------
// 1. GOOGLE NEWS SITEMAP (/news-sitemap.xml)
// ---------------------------------------------------------------
if ($isNewsSitemap) {
    // 48 hours ago cutoff for Google News eligibility
    $twoDaysAgo = gmdate('Y-m-d\TH:i:s\Z', time() - (48 * 60 * 60));
    
    $recentNews = fetchFromSupabaseRange("news?status=eq.published&published_at=gte." . urlencode($twoDaysAgo) . "&select=title,slug,published_at&order=published_at.desc", 0, 999);
    
    // Fallback if no news in last 48 hours (e.g. testing)
    if (!is_array($recentNews) || count($recentNews) === 0) {
        $recentNews = fetchFromSupabaseRange("news?status=eq.published&select=title,slug,published_at&order=published_at.desc", 0, 49);
    }
    
    echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"' . "\n";
    echo '        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">' . "\n";
    
    if (is_array($recentNews)) {
        foreach ($recentNews as $article) {
            if (!empty($article['slug']) && !empty($article['title'])) {
                $rawTitle = decodeSafePhp($article['title']);
                $pubDate = !empty($article['published_at']) ? gmdate('Y-m-d\TH:i:s\Z', strtotime($article['published_at'])) : gmdate('Y-m-d\TH:i:s\Z');
                
                echo "  <url>\n";
                echo "    <loc>" . htmlspecialchars($siteUrl . "/news/" . urlencode($article['slug']), ENT_XML1, 'UTF-8') . "</loc>\n";
                echo "    <news:news>\n";
                echo "      <news:publication>\n";
                echo "        <news:name>জনমত ২৪</news:name>\n";
                echo "        <news:language>bn</news:language>\n";
                echo "      </news:publication>\n";
                echo "      <news:publication_date>" . htmlspecialchars($pubDate, ENT_XML1, 'UTF-8') . "</news:publication_date>\n";
                echo "      <news:title>" . htmlspecialchars($rawTitle, ENT_XML1, 'UTF-8') . "</news:title>\n";
                echo "    </news:news>\n";
                echo "  </url>\n";
            }
        }
    }
    
    echo '</urlset>' . "\n";
    exit;
}

// ---------------------------------------------------------------
// 2. STANDARD SITEMAP (/sitemap.xml)
// ---------------------------------------------------------------
// Fetch categories
$categories = fetchFromSupabaseRange("categories?select=slug", 0, 999);

// Fetch all published news articles in chunks of 1000
$news = [];
$from = 0;
$chunkSize = 1000;

while (true) {
    $to = $from + $chunkSize - 1;
    $chunk = fetchFromSupabaseRange("news?status=eq.published&select=slug,published_at,updated_at&order=published_at.desc", $from, $to);
    
    if (is_array($chunk) && count($chunk) > 0) {
        $news = array_merge($news, $chunk);
        if (count($chunk) < $chunkSize) {
            break;
        }
        $from += $chunkSize;
    } else {
        break;
    }
}

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

// Homepage
echo "  <url>\n";
echo "    <loc>" . htmlspecialchars($siteUrl, ENT_XML1, 'UTF-8') . "/</loc>\n";
echo "    <changefreq>always</changefreq>\n";
echo "    <priority>1.00</priority>\n";
echo "  </url>\n";

// Category pages
if (is_array($categories)) {
    foreach ($categories as $cat) {
        if (!empty($cat['slug'])) {
            echo "  <url>\n";
            echo "    <loc>" . htmlspecialchars($siteUrl . "/category/" . urlencode($cat['slug']), ENT_XML1, 'UTF-8') . "</loc>\n";
            echo "    <changefreq>hourly</changefreq>\n";
            echo "    <priority>0.80</priority>\n";
            echo "  </url>\n";
        }
    }
}

// News pages
if (is_array($news)) {
    foreach ($news as $article) {
        if (!empty($article['slug'])) {
            echo "  <url>\n";
            echo "    <loc>" . htmlspecialchars($siteUrl . "/news/" . urlencode($article['slug']), ENT_XML1, 'UTF-8') . "</loc>\n";
            if (!empty($article['updated_at']) || !empty($article['published_at'])) {
                $lastmod = gmdate('Y-m-d\TH:i:s\Z', strtotime(!empty($article['updated_at']) ? $article['updated_at'] : $article['published_at']));
                echo "    <lastmod>" . htmlspecialchars($lastmod, ENT_XML1, 'UTF-8') . "</lastmod>\n";
            }
            echo "    <changefreq>daily</changefreq>\n";
            echo "    <priority>0.70</priority>\n";
            echo "  </url>\n";
        }
    }
}

echo '</urlset>' . "\n";
