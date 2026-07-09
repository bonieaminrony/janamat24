<?php
// sitemap.php - Dynamic XML Sitemap for Search Engine Crawlers

header("Content-Type: application/xml; charset=utf-8");

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

// 1. Fetch categories
$categories = fetchFromSupabaseRange("categories?select=slug", 0, 999);

// 2. Fetch all published news articles in chunks of 1000
$news = [];
$from = 0;
$chunkSize = 1000;

while (true) {
    $to = $from + $chunkSize - 1;
    $chunk = fetchFromSupabaseRange("news?status=eq.published&select=slug,published_at&order=published_at.desc", $from, $to);
    
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

// 3. Generate XML
echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

// Homepage
echo "  <url>\n";
echo "    <loc>" . htmlspecialchars($siteUrl) . "/</loc>\n";
echo "    <changefreq>daily</changefreq>\n";
echo "    <priority>1.00</priority>\n";
echo "  </url>\n";

// Category pages
if (is_array($categories)) {
    foreach ($categories as $cat) {
        if (!empty($cat['slug'])) {
            echo "  <url>\n";
            echo "    <loc>" . htmlspecialchars($siteUrl . "/category/" . urlencode($cat['slug'])) . "</loc>\n";
            echo "    <changefreq>daily</changefreq>\n";
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
            echo "    <loc>" . htmlspecialchars($siteUrl . "/news/" . urlencode($article['slug'])) . "</loc>\n";
            if (!empty($article['published_at'])) {
                $lastmod = date('c', strtotime($article['published_at']));
                echo "    <lastmod>" . htmlspecialchars($lastmod) . "</lastmod>\n";
            }
            echo "    <changefreq>weekly</changefreq>\n";
            echo "    <priority>0.60</priority>\n";
            echo "  </url>\n";
        }
    }
}

echo '</urlset>' . "\n";
