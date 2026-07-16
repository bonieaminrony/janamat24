import http.server
import socketserver
import urllib.request
import json
import re
from urllib.parse import urlparse, parse_qs, unquote, quote
import html
import os

# Load environment variables manually from .env file
def load_env():
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
    if os.path.exists(env_path):
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    parts = line.split('=', 1)
                    key = parts[0].strip()
                    val = parts[1].strip().strip('"').strip("'")
                    os.environ[key] = val

load_env()

PORT = 8000

class ProxyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.end_headers()

    def do_GET(self):
        parsed_url = urlparse(self.path)
        
        if parsed_url.path == '/fetch':
            query = parse_qs(parsed_url.query)
            if 'url' not in query:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"error": "No URL provided"}).encode('utf-8'))
                return
            if 'url' in query:
                target_url = query['url'][0]
                # Check if it's a news article URL (contains /news/slug)
                news_match = re.search(r'/news/([^/?#]+)', target_url)
                if news_match:
                    slug = news_match.group(1)
                    # Decode and re-encode to ensure safe URL parsing
                    slug = unquote(slug)
                    encoded_slug = quote(slug)
                    
                    supabase_url = f"https://gsjxolnxtckdbjpfcobx.supabase.co/rest/v1/news?slug=eq.{encoded_slug}&select=title,excerpt,content,image_url,status,categories(name)&limit=1"
                    supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzanhvbG54dGNrZGJqcGZjb2J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMDYxODMsImV4cCI6MjA4MTg4MjE4M30.Xfb1rQOelf96nq3MiPkjAEUwv5jhOtNAQWI6x-jshjU"
                    
                    req_sb = urllib.request.Request(supabase_url, headers={
                        'apikey': supabase_key,
                        'Authorization': f"Bearer {supabase_key}"
                    })
                    try:
                        with urllib.request.urlopen(req_sb, timeout=10) as resp_sb:
                            sb_data = json.loads(resp_sb.read().decode('utf-8'))
                            if isinstance(sb_data, list) and len(sb_data) > 0:
                                article = sb_data[0]
                                title = article.get('title', '')
                                image = article.get('image_url', '')
                                content = article.get('content', '')
                                excerpt = article.get('excerpt', '')
                                
                                # Access category name via nested categories relation
                                category = article.get('categories', {}).get('name', '') if article.get('categories') else ''
                                
                                # Resolve relative image paths to absolute
                                if image and not image.startswith('http'):
                                    image = 'https://janamat24.com' + ('/' if not image.startswith('/') else '') + image
                                
                                # Return JSON directly
                                data = {"title": title, "image": image, "content": content, "excerpt": excerpt, "category": category}
                                self.send_response(200)
                                self.send_header('Content-type', 'application/json')
                                self.send_header('Access-Control-Allow-Origin', '*')
                                self.end_headers()
                                self.wfile.write(json.dumps(data).encode('utf-8'))
                                return
                    except Exception as sb_err:
                        print(f"Supabase fetch failed, falling back to scraping: {sb_err}")

                try:
                    req = urllib.request.Request(target_url, headers={
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.5',
                        'Connection': 'keep-alive',
                        'Upgrade-Insecure-Requests': '1',
                        'Sec-Fetch-Dest': 'document',
                        'Sec-Fetch-Mode': 'navigate',
                        'Sec-Fetch-Site': 'none',
                        'Sec-Fetch-User': '?1'
                    })
                    with urllib.request.urlopen(req, timeout=10) as response:
                        html_content = response.read().decode('utf-8', errors='ignore')
                        
                        # Clean up HTML first: strip script, style, noscript, header, nav, footer, aside, and comments
                        html_content = re.sub(r'<script[^>]*>.*?</script>', '', html_content, flags=re.IGNORECASE | re.DOTALL)
                        html_content = re.sub(r'<style[^>]*>.*?</style>', '', html_content, flags=re.IGNORECASE | re.DOTALL)
                        html_content = re.sub(r'<noscript[^>]*>.*?</noscript>', '', html_content, flags=re.IGNORECASE | re.DOTALL)
                        html_content = re.sub(r'<header[^>]*>.*?</header>', '', html_content, flags=re.IGNORECASE | re.DOTALL)
                        html_content = re.sub(r'<nav[^>]*>.*?</nav>', '', html_content, flags=re.IGNORECASE | re.DOTALL)
                        html_content = re.sub(r'<footer[^>]*>.*?</footer>', '', html_content, flags=re.IGNORECASE | re.DOTALL)
                        html_content = re.sub(r'<aside[^>]*>.*?</aside>', '', html_content, flags=re.IGNORECASE | re.DOTALL)
                        html_content = re.sub(r'<!--.*?-->', '', html_content, flags=re.DOTALL)

                        # Extract real title: try og:title first because it is standard, otherwise h1
                        title = ""
                        title_match = re.search(r'<meta\s+(?:property|name)="og:title"\s+content="([^"]+)"', html_content, re.IGNORECASE)
                        if title_match:
                            title = title_match.group(1).strip()
                        
                        if not title or "জনমত ২৪" in title or "Ekushey" in title:
                            h1_match = re.search(r'<h1[^>]*>(.*?)</h1>', html_content, re.IGNORECASE | re.DOTALL)
                            if h1_match:
                                title = re.sub(r'<[^>]+>', '', h1_match.group(1)).strip()
                        
                        if not title:
                            title_match = re.search(r'<title>(.*?)</title>', html_content, re.IGNORECASE)
                            if title_match:
                                title = re.sub(r'<[^>]+>', '', title_match.group(1)).strip()
                        
                        # Clean title
                        if title:
                            title = html.unescape(title)
                            # Remove common site name suffixes
                            title = re.sub(r'\s*[-|]\s*(?:Ekushey Television|Ekushey TV|একুশে টেলিভিশন|একুশে টিভি|জনমত ২৪|Janamat24|Janamat 24)\s*$', '', title, flags=re.IGNORECASE)
                        
                        # Extract category
                        category = ""
                        category_match = re.search(r'<meta\s+(?:property|name)="article:section"\s+content="([^"]+)"', html_content, re.IGNORECASE)
                        if not category_match:
                            category_match = re.search(r'<meta\s+content="([^"]+)"\s+(?:property|name)="article:section"', html_content, re.IGNORECASE)
                        
                        if category_match:
                            category = category_match.group(1).strip()
                        else:
                            # Try breadcrumbs
                            breadcrumb_match = re.search(r'<ol[^>]*class="[^"]*breadcrumb[^"]*"[^>]*>(.*?)</ol>', html_content, re.IGNORECASE | re.DOTALL)
                            if not breadcrumb_match:
                                breadcrumb_match = re.search(r'<ul[^>]*class="[^"]*breadcrumb[^"]*"[^>]*>(.*?)</ul>', html_content, re.IGNORECASE | re.DOTALL)
                            
                            if breadcrumb_match:
                                breadcrumb_html = breadcrumb_match.group(1)
                                breadcrumb_items = re.findall(r'<li[^>]*>(.*?)</li>', breadcrumb_html, re.IGNORECASE | re.DOTALL)
                                if len(breadcrumb_items) > 1:
                                    # Usually the second item is the category (Home > National > News title)
                                    target_item = breadcrumb_items[1]
                                    category = re.sub(r'<[^>]+>', '', target_item).strip()
                                else:
                                    # Fallback to links inside breadcrumbs
                                    links = re.findall(r'<a[^>]*>(.*?)</a>', breadcrumb_html, re.IGNORECASE | re.DOTALL)
                                    if len(links) > 1:
                                        category = re.sub(r'<[^>]+>', '', links[1]).strip()
                        
                        # Bad image keywords — reporter photos, logos, icons, ads
                        BAD_IMG_KEYWORDS = [
                            'reporter', 'author', 'journalist', 'staff', 'profile',
                            'writer', 'byline', 'avatar', 'user', 'member',
                            'logo', 'icon', 'banner', 'adv', 'ad-', 'loader',
                            'live', 'favicon', 'etvlogo', 'logo_fb', 'logo-share',
                            'default_share', 'placeholder', 'smiley', 'emoji',
                            'watermark', '/reporter/', '/author/', '/journalist/',
                            '/profile/', '/staff/',
                        ]
                        def is_bad_image(img_url):
                            img_lower = img_url.lower()
                            if img_lower.startswith('data:'): return True
                            return any(k in img_lower for k in BAD_IMG_KEYWORDS)
                        
                        # Extract image
                        image = ""
                        
                        # 1. og:image
                        image_match = re.search(r'<meta\s+(?:property|name)="og:image"\s+content="([^"]+)"', html_content, re.IGNORECASE)
                        if not image_match:
                            image_match = re.search(r'<meta\s+content="([^"]+)"\s+(?:property|name)="og:image"', html_content, re.IGNORECASE)
                        if image_match:
                            candidate = image_match.group(1).strip()
                            if not is_bad_image(candidate):
                                image = candidate
                        
                        # 2. twitter:image
                        if not image:
                            tw_match = re.search(r'<meta\s+(?:property|name)="twitter:image"\s+content="([^"]+)"', html_content, re.IGNORECASE)
                            if tw_match:
                                candidate = tw_match.group(1).strip()
                                if not is_bad_image(candidate):
                                    image = candidate
                        
                        # 3. Image inside known article container classes
                        if not image:
                            article_classes = r'DNewsDetails|detail-details|story-element|article-content|entry-content|news-details|article-body|news-text|post-content|single-post|news-body|article__body|content-body|news__body|newsbody|bd-post-content'
                            main_img_match = re.search(
                                r'(?:class="[^"]*(?:' + article_classes + r')[^"]*").*?<img[^>]+src="([^"]+)"',
                                html_content, re.IGNORECASE | re.DOTALL
                            )
                            if main_img_match:
                                candidate = main_img_match.group(1).strip()
                                if not is_bad_image(candidate):
                                    image = candidate
                        
                        # 4. Featured image wrapper divs
                        if not image:
                            wrapper_classes = r'DetailImage|FeaturedImage|DNewsImg|main-image|featured-image|post-thumbnail|article-image|hero-image|news-img|thumb-image'
                            detail_img = re.search(
                                r'<div[^>]*class="[^"]*(?:' + wrapper_classes + r')[^"]*"[^>]*>.*?<img[^>]+src="([^"]+)"',
                                html_content, re.IGNORECASE | re.DOTALL
                            )
                            if detail_img:
                                candidate = detail_img.group(1).strip()
                                if not is_bad_image(candidate):
                                    image = candidate
                        
                        # 5. Ultimate fallback: first non-bad image
                        if not image:
                            img_matches = re.findall(r'<img[^>]+src="([^"]+)"', html_content, re.IGNORECASE)
                            for img in img_matches:
                                if not is_bad_image(img):
                                    image = img
                                    break
                        
                        # Make sure image URL is absolute
                        if image and not image.startswith('http'):
                            if image.startswith('//'):
                                image = 'https:' + image
                            else:
                                # Find domain from target_url
                                parsed_target = urlparse(target_url)
                                base_domain = f"{parsed_target.scheme}://{parsed_target.netloc}"
                                if image.startswith('/'):
                                    image = base_domain + image
                                else:
                                    image = base_domain + '/' + image
                        
                        # Extract content paragraphs
                        # First try to isolate the main news content container to avoid sidebar/footer paragraphs
                        content_area = ""
                        # List of common wrappers (greedy matching to capture nested elements)
                        wrappers = [
                            r'class="[^"]*(?:DNewsDetails|detail-details|story-element|article-content|entry-content|news-details|article-body|news-text)[^"]*"[^>]*>(.*)'
                        ]
                        for wrapper in wrappers:
                            area_match = re.search(wrapper, html_content, re.IGNORECASE | re.DOTALL)
                            if area_match:
                                content_area = area_match.group(1)[:30000]
                                break
                        
                        # Fallback to whole HTML if no container found
                        if not content_area:
                            content_area = html_content
                        
                        paragraphs = re.findall(r'<p[^>]*>(.*?)</p>', content_area, re.IGNORECASE | re.DOTALL)
                        clean_paragraphs = []
                        for p in paragraphs:
                            p_clean = re.sub(r'<[^>]+>', '', p).strip()
                            p_clean_lower = p_clean.lower()
                            
                            # Filter boilerplate text
                            if len(p_clean) > 10 and not any(term in p_clean_lower for term in ['copyright', 'terms of use', 'privacy policy', 'cookie', 'advertisement', 'subscribe', 'follow us', 'facebook', 'twitter', 'instagram', 'telegram', 'youtube', 'টেলিফোন', 'ফ্যাক্স', 'ইমেল', 'পড়ুন', 'আরও পড়ুন', 'developed by', 'designed by', '©', 'সর্বস্বত্ব']):
                                clean_paragraphs.append(f"<p>{p_clean}</p>")
                        
                        content_body = "".join(clean_paragraphs)
                        excerpt = re.sub(r'<[^>]+>', '', clean_paragraphs[0]).strip() if len(clean_paragraphs) > 0 else ""
                        
                        # Return JSON
                        data = {"title": title, "image": image, "content": content_body, "excerpt": excerpt, "category": category}
                        self.send_response(200)
                        self.send_header('Content-type', 'application/json')
                        self.send_header('Access-Control-Allow-Origin', '*')
                        self.end_headers()
                        self.wfile.write(json.dumps(data).encode('utf-8'))
                        return
                except Exception as e:
                    self.send_response(500)
                    self.send_header('Content-type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
                    return

        elif parsed_url.path == '/tts':
            query = parse_qs(parsed_url.query)
            if 'text' in query:
                text_to_speak = query['text'][0]
                
                # Parse voice parameter (default is 'male')
                voice_gender = query.get('voice', ['male'])[0]
                voice_name = "bn-BD-NabanitaNeural" if voice_gender == "female" else "bn-BD-PradeepNeural"
                
                # 1. Try Microsoft Edge Premium Free Neural TTS
                try:
                    import asyncio
                    import edge_tts
                    
                    # Create and set a new event loop to avoid Windows closed-loop errors
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                    
                    communicate = edge_tts.Communicate(text_to_speak, voice_name)
                    audio_data = []
                    
                    async def collect_audio():
                        async for chunk in communicate.stream():
                            if chunk.get("data"):
                                audio_data.append(chunk["data"])
                    
                    try:
                        loop.run_until_complete(collect_audio())
                    finally:
                        loop.close()
                        
                    mp3_data = b"".join(audio_data)
                    
                    if mp3_data:
                        self.send_response(200)
                        self.send_header('Content-type', 'audio/mpeg')
                        self.send_header('Content-Length', str(len(mp3_data)))
                        self.send_header('Access-Control-Allow-Origin', '*')
                        self.end_headers()
                        self.wfile.write(mp3_data)
                        return
                except Exception as edge_err:
                    print(f"Edge TTS failed, falling back to Google: {edge_err}")
                
                # 2. Google Translate free TTS fallback
                try:
                    encoded_text = quote(text_to_speak)
                    tts_url = f"https://translate.google.com/translate_tts?ie=UTF-8&tl=bn&client=tw-ob&q={encoded_text}"
                    
                    req = urllib.request.Request(tts_url, headers={
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
                        'Accept': '*/*',
                        'Accept-Language': 'en-US,en;q=0.5',
                        'Connection': 'keep-alive',
                    })
                    
                    with urllib.request.urlopen(req, timeout=10) as response:
                        self.send_response(200)
                        self.send_header('Content-type', response.headers.get('Content-type', 'audio/mpeg'))
                        self.send_header('Access-Control-Allow-Origin', '*')
                        self.end_headers()
                        self.wfile.write(response.read())
                        return
                except Exception as e:
                    self.send_response(500)
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(str(e).encode('utf-8'))
                    return

        elif parsed_url.path == '/proxy-image':
            query = parse_qs(parsed_url.query)
            if 'url' in query:
                target_url = query['url'][0]
                try:
                    req = urllib.request.Request(target_url, headers={
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
                        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.5',
                        'Connection': 'keep-alive',
                        'Sec-Fetch-Dest': 'image',
                        'Sec-Fetch-Mode': 'no-cors',
                        'Sec-Fetch-Site': 'cross-site'
                    })
                    with urllib.request.urlopen(req, timeout=10) as response:
                        self.send_response(200)
                        self.send_header('Content-type', response.headers.get('Content-type', 'image/jpeg'))
                        self.send_header('Access-Control-Allow-Origin', '*')
                        self.end_headers()
                        self.wfile.write(response.read())
                        return
                except Exception as e:
                    self.send_response(500)
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(str(e).encode('utf-8'))
                    return
                    
        return super().do_GET()

class ThreadingTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    daemon_threads = True

with ThreadingTCPServer(("", PORT), ProxyHTTPRequestHandler) as httpd:
    print(f"Serving at port {PORT}")
    httpd.serve_forever()
