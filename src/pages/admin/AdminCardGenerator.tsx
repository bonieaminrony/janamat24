import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Download, Upload, Link, Loader2, Settings2, Calendar, RefreshCw, ChevronDown, ChevronUp, Facebook } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Extend window interface for html2canvas
declare global {
  interface Window {
    html2canvas?: any;
  }
}

const preserveSpaces = (text: string) => text.replace(/ /g, "\u00A0");

export default function AdminCardGenerator() {
  const { toast } = useToast();
  const { settings } = useSiteSettings();
  const [templateSrc, setTemplateSrc] = useState<string>("");
  const [newsImageSrc, setNewsImageSrc] = useState<string>("");
  const [newsUrl, setNewsUrl] = useState<string>("");
  
  // Card Content State
  const [cardDate, setCardDate] = useState<string>("");
  const [headline1, setHeadline1] = useState<string>("");
  const [headline2Blue, setHeadline2Blue] = useState<string>("");
  const [headline2Red, setHeadline2Red] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [fontSize, setFontSize] = useState<number>(45);
  const [fontSizeOffset, setFontSizeOffset] = useState<number>(0);

  // Position Tuning
  const [imageTop, setImageTop] = useState<number>(28.5);
  const [imageHeight, setImageHeight] = useState<number>(44.8);

  const [loading, setLoading] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [sharing, setSharing] = useState<boolean>(false);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);



  const cardRef = useRef<HTMLDivElement>(null);
  const [cardHeight, setCardHeight] = useState<number>(1000);

  // Load Google Fonts and html2canvas dynamically
  useEffect(() => {
    // Load SolaimanLipi Font
    const fontLink = document.createElement("link");
    fontLink.href = "https://fonts.maateen.me/solaiman-lipi/font.css";
    fontLink.rel = "stylesheet";
    document.head.appendChild(fontLink);

    // Load html2canvas
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
    script.async = true;
    document.body.appendChild(script);

    // Initial Date in Bengali
    const engToBng: Record<string, string> = {
      "0": "০", "1": "১", "2": "২", "3": "৩", "4": "৪",
      "5": "৫", "6": "৬", "7": "৭", "8": "৮", "9": "৯"
    };
    const months = [
      "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
      "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
    ];

    const d = new Date();
    const day = d.getDate().toString().split("").map(c => engToBng[c] || c).join("");
    const year = d.getFullYear().toString().split("").map(c => engToBng[c] || c).join("");
    const month = months[d.getMonth()];
    const initialBngDate = `${day} ${month} ${year}`;

    setCardDate(initialBngDate);

    // One-time migration to clear any old template containing text
    const isCleared = localStorage.getItem("template_cleared_v2");
    if (!isCleared) {
      localStorage.removeItem("savedTemplate");
      localStorage.setItem("template_cleared_v2", "true");
    }

    // Load saved template or default
    const savedTemplate = localStorage.getItem("savedTemplate");
    const defaultTemplate = "/card-news-bg-default-v2.png";
    const templateToLoad = savedTemplate || defaultTemplate;
    
    setTemplateSrc(templateToLoad);
    const img = new Image();
    img.onload = () => {
      const ratio = img.height / img.width;
      setCardHeight(Math.round(800 * ratio));
    };
    img.src = templateToLoad;

    // Set default demo headline
    setHeadline1("‘লাব্বাইক আল্লাহুম্মা লাব্বাইক’");
    setHeadline2Blue("ধ্বনিতে");
    setHeadline2Red("মুখর আরাফাত ময়দান");

    return () => {
      document.head.removeChild(fontLink);
      document.body.removeChild(script);
    };
  }, []);

  // Recalculate font size dynamically to keep it strictly within 2 lines
  useEffect(() => {
    const line1Length = headline1.length;
    const line2Length = (headline2Blue + headline2Red).length;
    const maxLen = Math.max(line1Length, line2Length);

    let calculatedSize = 48;
    if (maxLen > 18) {
      // Base font size is 48px. Usable width is 720px.
      // Bengali character width is roughly 0.45 * font size in Tiro Bangla.
      calculatedSize = Math.floor(720 / (maxLen * 0.45));
      if (calculatedSize > 48) calculatedSize = 48;
      if (calculatedSize < 36) calculatedSize = 36; // Set a clear, readable minimum size
    }
    setFontSize(calculatedSize);
  }, [headline1, headline2Blue, headline2Red]);

  // Handle Template File Selection
  const handleTemplateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setTemplateSrc(result);
        const img = new Image();
        img.onload = () => {
          const ratio = img.height / img.width;
          setCardHeight(Math.round(800 * ratio));
        };
        img.src = result;
        try {
          localStorage.setItem("savedTemplate", result);
        } catch (err) {
          console.warn("Could not save template to localStorage:", err);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTemplateReset = () => {
    localStorage.removeItem("savedTemplate");
    const defaultTemplate = "/card-news-bg-default-v2.png";
    setTemplateSrc(defaultTemplate);
    const img = new Image();
    img.onload = () => {
      const ratio = img.height / img.width;
      setCardHeight(Math.round(800 * ratio));
    };
    img.src = defaultTemplate;
    toast.success("টেম্পলেট রিসেট করা হয়েছে");
  };

  // Handle News Image File Selection manually
  const handleNewsImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setNewsImageSrc(result);
        setImageUrl(""); // Clear URL input
      };
      reader.readAsDataURL(file);
    }
  };

  // Helper function to resolve proxies
  const performFetch = async (endpoint: string, fallbackEndpoint: string) => {
    try {
      const response = await fetch(endpoint);
      const contentType = response.headers.get("content-type") || "";
      if (response.status === 404 || contentType.includes("text/html")) {
        const fallbackResponse = await fetch(fallbackEndpoint);
        if (!fallbackResponse.ok) throw new Error("Fallback request failed");
        return await fallbackResponse.json();
      }
      if (!response.ok) throw new Error("Primary request failed");
      return await response.json();
    } catch (err) {
      // Force fallback
      const fallbackResponse = await fetch(fallbackEndpoint);
      if (!fallbackResponse.ok) throw new Error("Both primary and fallback failed");
      return await fallbackResponse.json();
    }
  };

  const setProxiedImage = async (imgUrl: string) => {
    if (!imgUrl) return;
    try {
      const encoded = encodeURIComponent(imgUrl);
      const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      
      const proxyUrl = isLocal 
        ? `http://localhost:8000/proxy-image?url=${encoded}`
        : `/proxy.php?action=image&url=${encoded}`;

      const response = await fetch(proxyUrl);
      const contentType = response.headers.get("content-type") || "";
      
      if (!response.ok || contentType.includes("text/html")) {
        // Direct fallback if proxy fails
        setNewsImageSrc(imgUrl);
        return;
      }
      
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewsImageSrc(reader.result as string);
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error("CORS proxy failed, loading directly:", err);
      setNewsImageSrc(imgUrl);
    }
  };

  // Fetch News Data from URL
  const fetchNewsData = async () => {
    let cleanUrl = newsUrl.trim();
    if (!cleanUrl) {
      toast({
        variant: "destructive",
        title: "ত্রুটি",
        description: "দয়া করে একটি লিংক প্রদান করুন।"
      });
      return;
    }

    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = "https://" + cleanUrl;
      setNewsUrl(cleanUrl);
    }

    setLoading(true);
    try {
      let data: any = null;
      
      // 1. Try Supabase directly from React (avoids server scraping issues)
      const match = cleanUrl.match(/\/news\/([^/?#]+)/);
      if (match) {
        try {
          const slug = decodeURIComponent(match[1]);
          const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzanhvbG54dGNrZGJqcGZjb2J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMDYxODMsImV4cCI6MjA4MTg4MjE4M30.Xfb1rQOelf96nq3MiPkjAEUwv5jhOtNAQWI6x-jshjU";
          
          // Use Supabase JS-style REST API with correct foreign key relation
          const encodedSlug = encodeURIComponent(slug);
          const supabaseUrl = `https://gsjxolnxtckdbjpfcobx.supabase.co/rest/v1/news?slug=eq.${encodedSlug}&select=title,excerpt,content,image_url,status,categories(name)&limit=1`;
          
          const sbResponse = await fetch(supabaseUrl, {
            headers: {
              "apikey": supabaseKey,
              "Authorization": `Bearer ${supabaseKey}`,
              "Accept": "application/json"
            }
          });
          
          if (sbResponse.ok) {
            const sbData = await sbResponse.json();
            if (sbData && sbData.length > 0) {
               const article = sbData[0];
               // image_url may contain '#caption=...&kicker=...' — strip the hash part
               const rawImage = article.image_url || "";
               const cleanImage = rawImage.split("#")[0];
               data = {
                 title: article.title || "",
                 image: cleanImage,
                 content: article.content || "",
                 excerpt: article.excerpt || "",
                 category: article.categories?.name || ""
               };
            }
          }
        } catch (sbErr) {
          console.error("Supabase direct fetch failed:", sbErr);
        }
      }
      
      // 2. Fallback to proxy.php if Supabase didn't work (for other websites)
      if (!data) {
        const encoded = encodeURIComponent(cleanUrl);
        const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
        const proxyUrl = isLocal
          ? `http://localhost:8000/fetch?url=${encoded}`
          : `/proxy.php?action=fetch&url=${encoded}`;
        
        const response = await fetch(proxyUrl);
        const contentType = response.headers.get("content-type") || "";
        if (!response.ok || contentType.includes("text/html")) {
          throw new Error("proxy.php ফাইলটি সার্ভারে আপলোড করা নেই। public_html-এ proxy.php আপলোড করুন।");
        }
        data = await response.json();
      }

      if (!data || data.error) throw new Error(data?.error || "No data found");

      // Handle Title
      let title = data.title || "";
      if (title) {
        title = title.replace(" - Janamat24", "").trim();
        let part1 = title;
        let part2 = "";

        const commaIdx = title.indexOf(",");
        const colonIdx = title.indexOf("ঃ");
        const engColonIdx = title.indexOf(":");
        const dariIdx = title.indexOf("।");
        
        let splitIdx = -1;
        const checkMiddle = (idx: number, len: number) => {
          const pct = idx / len;
          return pct >= 0.35 && pct <= 0.65;
        };

        if (commaIdx !== -1 && checkMiddle(commaIdx, title.length)) {
          splitIdx = commaIdx;
        } else if (colonIdx !== -1 && checkMiddle(colonIdx, title.length)) {
          splitIdx = colonIdx;
        } else if (engColonIdx !== -1 && checkMiddle(engColonIdx, title.length)) {
          splitIdx = engColonIdx;
        } else if (dariIdx !== -1 && checkMiddle(dariIdx, title.length)) {
          splitIdx = dariIdx;
        }

        if (splitIdx !== -1) {
          part1 = title.substring(0, splitIdx + 1).trim();
          part2 = title.substring(splitIdx + 1).trim();
        } else {
          // Fallback: split in the middle by words
          const words = title.split(" ");
          const mid = Math.floor(words.length / 2);
          part1 = words.slice(0, mid).join(" ");
          part2 = words.slice(mid).join(" ");
        }

        setHeadline1(part1);

        const part2Words = part2.split(" ");
        if (part2Words.length > 1) {
          const mid = Math.ceil(part2Words.length / 2);
          setHeadline2Blue(part2Words.slice(0, mid).join(" "));
          setHeadline2Red(part2Words.slice(mid).join(" "));
        } else {
          setHeadline2Blue("");
          setHeadline2Red(part2);
        }
      }

      // Handle Image
      const imgUrl = data.image;
      if (imgUrl) {
        let absoluteImgUrl = imgUrl;
        try {
          absoluteImgUrl = new URL(imgUrl, cleanUrl).href;
        } catch (e) {}
        setImageUrl(absoluteImgUrl);
        await setProxiedImage(absoluteImgUrl);
      }

      toast({
        title: "সফল",
        description: "খবরের তথ্য সফলভাবে লোড করা হয়েছে।"
      });
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "ব্যর্থ",
        description: `তথ্য আনতে সমস্যা হয়েছে। Error: ${err.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  // Download Card as PNG Image
  const downloadCard = () => {
    if (!templateSrc) {
      toast({
        variant: "destructive",
        title: "ত্রুটি",
        description: "দয়া করে প্রথমে একটি টেমপ্লেট ছবি আপলোড করুন।"
      });
      return;
    }

    if (!window.html2canvas) {
      toast({
        variant: "destructive",
        title: "ত্রুটি",
        description: "html2canvas স্ক্রিপ্টটি লোড হতে পারেনি। অনুগ্রহ করে রিফ্রেশ করে আবার চেষ্টা করুন।"
      });
      return;
    }

    setDownloading(true);
    
    // Select the card-preview element
    const preview = cardRef.current;
    if (!preview) {
      setDownloading(false);
      return;
    }

    // Clone the element to prevent html2canvas from reading CSS scale/transform styles
    const clone = preview.cloneNode(true) as HTMLDivElement;
    
    // Hide the clone off-screen and remove CSS transforms
    clone.style.position = "fixed";
    clone.style.top = "-9999px";
    clone.style.left = "-9999px";
    clone.style.transform = "none";
    clone.style.width = "800px";
    clone.style.height = `${cardHeight}px`;
    
    document.body.appendChild(clone);

    // Wait slightly for DOM to settle
    setTimeout(() => {
      window.html2canvas(clone, {
        useCORS: true,
        allowTaint: true,
        scale: 2 // High resolution output
      })
        .then((canvas: HTMLCanvasElement) => {
          const link = document.createElement("a");
          link.download = `janamat24-card-${Date.now()}.jpg`;
          link.href = canvas.toDataURL("image/jpeg", 0.9);
          link.click();
          
          toast({
            title: "ডাউনলোড সম্পন্ন",
            description: "কার্ড ইমেজটি ডাউনলোড করা হয়েছে।"
          });
        })
        .catch((err: any) => {
          console.error("Download error:", err);
          toast({
            variant: "destructive",
            title: "ডাউনলোড ব্যর্থ",
            description: "ইমেজ তৈরি করার সময় কোনো ত্রুটি ঘটেছে।"
          });
        })
        .finally(() => {
          document.body.removeChild(clone);
          setDownloading(false);
        });
    }, 100);
  };

  // Upload Card to Supabase Storage and Share/Upload to Facebook via Web Share Dialog
  const shareToFacebook = () => {
    if (!templateSrc) {
      toast({
        variant: "destructive",
        title: "ত্রুটি",
        description: "দয়া করে প্রথমে একটি টেমপ্লেট ছবি আপলোড করুন।"
      });
      return;
    }

    if (!window.html2canvas) {
      toast({
        variant: "destructive",
        title: "ত্রুটি",
        description: "html2canvas স্ক্রিপ্টটি লোড হতে পারেনি। অনুগ্রহ করে রিফ্রেশ করে আবার চেষ্টা করুন।"
      });
      return;
    }

    setSharing(true);
    
    // Select the card-preview element
    const preview = cardRef.current;
    if (!preview) {
      setSharing(false);
      return;
    }

    // Clone the element to prevent html2canvas from reading CSS scale/transform styles
    const clone = preview.cloneNode(true) as HTMLDivElement;
    
    // Hide the clone off-screen and remove CSS transforms
    clone.style.position = "fixed";
    clone.style.top = "-9999px";
    clone.style.left = "-9999px";
    clone.style.transform = "none";
    clone.style.width = "800px";
    clone.style.height = `${cardHeight}px`;
    
    document.body.appendChild(clone);

    // Wait slightly for DOM to settle
    setTimeout(() => {
      window.html2canvas(clone, {
        useCORS: true,
        allowTaint: true,
        scale: 2 // High resolution output
      })
        .then(async (canvas: HTMLCanvasElement) => {
          document.body.removeChild(clone);
          
          canvas.toBlob(async (blob) => {
            if (!blob) {
              setSharing(false);
              toast({
                variant: "destructive",
                title: "ত্রুটি",
                description: "ইমেজ তৈরি করতে সমস্যা হয়েছে।"
              });
              return;
            }

            const timestamp = Date.now();
            const caption = `${headline1}\n${preserveSpaces(headline2Blue)} ${preserveSpaces(headline2Red)}`.trim();
            const hasFbCredentials = settings?.fb_page_id && settings?.fb_access_token;

            if (hasFbCredentials) {
              // 1-Click Direct Posting to Facebook Page
              try {
                const formData = new FormData();
                formData.append("source", blob, `card-${timestamp}.jpg`);
                formData.append("message", caption);
                formData.append("access_token", settings.fb_access_token!);

                const response = await fetch(`https://graph.facebook.com/v18.0/${settings.fb_page_id}/photos`, {
                  method: "POST",
                  body: formData
                });

                const result = await response.json();

                if (result.error) {
                  throw new Error(result.error.message || "Facebook Graph API Error");
                }

                const postId = result.post_id || result.id;
                const postUrl = `https://facebook.com/${postId}`;

                toast({
                  title: "ফেসবুকে সফলভাবে পোস্ট করা হয়েছে! 🎉",
                  description: (
                    <div className="flex flex-col gap-1.5 mt-1">
                      <p className="text-xs">কার্ডটি সরাসরি আপনার ফেসবুক পেজে পোস্ট করা হয়েছে।</p>
                      <a 
                        href={postUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-xs font-black text-blue-600 dark:text-blue-400 underline hover:opacity-85 flex items-center gap-1 mt-1"
                      >
                        ফেসবুক পোস্টটি দেখতে এখানে ক্লিক করুন 🔗
                      </a>
                    </div>
                  ),
                  duration: 10000
                });
              } catch (err: any) {
                console.error("Facebook direct upload failed:", err);
                toast({
                  variant: "destructive",
                  title: "পোস্ট ব্যর্থ হয়েছে",
                  description: `সরাসরি পেজে আপলোড করতে সমস্যা হয়েছে: ${err.message}`
                });
              } finally {
                setSharing(false);
              }
            } else {
              // Fallback to Supabase upload + facebook sharer window
              const fileName = `generated-cards/card-${timestamp}.jpg`;
              const file = new File([blob], `janamat24-card-${timestamp}.jpg`, { type: "image/jpeg" });

              try {
                const { data, error } = await supabase.storage
                  .from("news-images")
                  .upload(fileName, file, {
                    contentType: "image/jpeg",
                    cacheControl: "3600",
                    upsert: true
                  });

                if (error) throw error;

                const { data: { publicUrl } } = supabase.storage
                  .from("news-images")
                  .getPublicUrl(fileName);

                const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicUrl)}`;
                window.open(fbShareUrl, "_blank", "width=600,height=450,noopener,noreferrer");

                toast({
                  title: "ফেসবুক শেয়ার উইন্ডো ওপেন হয়েছে 🔵",
                  description: "ব্রাউজারে লগইন থাকা ফেসবুক আইডি/পেজ থেকে ইমেজটি শেয়ার করুন। সরাসরি ১-ক্লিকে অটো-পোস্ট করতে এডমিন সেটিংসে পেজ টোকেন দিন।"
                });
              } catch (err: any) {
                console.error("Facebook share failed:", err);
                toast({
                  variant: "destructive",
                  title: "শেয়ার ব্যর্থ",
                  description: `ফেসবুকে শেয়ার করতে সমস্যা হয়েছে: ${err.message}`
                });
              } finally {
                setSharing(false);
              }
            }
          }, "image/jpeg", 0.9);
        })
        .catch((err: any) => {
          console.error("Canvas generation error:", err);
          document.body.removeChild(clone);
          toast({
            variant: "destructive",
            title: "ত্রুটি",
            description: "ইমেজ তৈরি করার সময় কোনো ত্রুটি ঘটেছে।"
          });
          setSharing(false);
        });
    }, 100);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start max-w-7xl mx-auto">
      {/* Control Box */}
      <div className="xl:col-span-6 space-y-6">
        <Card className="border-slate-200/60 dark:border-slate-800 shadow-sm rounded-3xl bg-white dark:bg-slate-900 overflow-hidden">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 p-6">
            <CardTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              কার্ড জেনারেটর 🚀
            </CardTitle>
            <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
              নিউজ লিংক দিন অথবা তথ্য ম্যানুয়ালি বসিয়ে খবরের ইমেজ কার্ড তৈরি করুন।
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            {/* Template Upload */}
            <div className="space-y-2">
              <Label className="text-[13px] font-bold text-slate-700 dark:text-slate-300">
                টেম্পলেট ছবি (একবার আপলোড করলেই হবে):
              </Label>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleTemplateUpload}
                  className="rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 hover:bg-slate-100/50 dark:hover:bg-slate-900 transition-colors"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTemplateReset}
                  className="rounded-xl border-slate-200 dark:border-slate-800 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 transition-colors"
                >
                  রিসেট
                </Button>
              </div>
            </div>

            <hr className="border-slate-100 dark:border-slate-800" />

            {/* Fetch controls */}
            <div className="space-y-3.5">
              <Label className="text-sm font-bold text-red-600 dark:text-red-400">
                নিউজের লিংক (URL) দিন:
              </Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="https://janamat24.com/news/some-slug"
                  value={newsUrl}
                  onChange={(e) => setNewsUrl(e.target.value)}
                  className="rounded-xl border-slate-200 dark:border-slate-800 px-4 h-12 flex-1"
                />
                <Button
                  onClick={fetchNewsData}
                  disabled={loading}
                  className="rounded-xl px-5 h-12 bg-red-600 hover:bg-red-700 font-bold transition-all active:scale-95 flex gap-2 shrink-0"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-5 h-5" />
                  )}
                  তৈরি করুন
                </Button>
              </div>
            </div>

            {/* Download & Share Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                onClick={downloadCard}
                disabled={downloading || sharing}
                className="w-full h-13 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base transition-all active:scale-95 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                {downloading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Download className="w-5 h-5" />
                )}
                ডাউনলোড করুন (JPEG) 📥
              </Button>

              <Button
                onClick={shareToFacebook}
                disabled={downloading || sharing}
                className="w-full h-13 rounded-2xl bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold text-base transition-all active:scale-95 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                {sharing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Facebook className="w-5 h-5 fill-current" />
                )}
                {settings?.fb_page_id && settings?.fb_access_token 
                  ? "ফেসবুকে সরাসরি পোস্ট (১-ক্লিক) ⚡" 
                  : "ফেসবুকে শেয়ার করুন 🔵"}
              </Button>
            </div>

            {/* Toggle Advanced Controls */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="ghost"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full justify-between font-bold text-[13px] text-slate-500 hover:text-slate-800 dark:hover:text-white px-2 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <span className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4" />
                  ম্যানুয়াল সেটিংস ও ছবি পজিশন টিউনিং
                </span>
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>

              {/* Advanced settings container */}
              {showAdvanced && (
                <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/50 space-y-4 animate-in slide-in-from-top-2 duration-300">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">তারিখ:</Label>
                    <Input
                      type="text"
                      value={cardDate}
                      onChange={(e) => setCardDate(e.target.value)}
                      className="rounded-lg h-10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">প্রথম লাইন (সম্পূর্ণ নীল):</Label>
                    <Input
                      type="text"
                      value={headline1}
                      onChange={(e) => setHeadline1(e.target.value)}
                      className="rounded-lg h-10"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">দ্বিতীয় লাইন (নীল অংশ):</Label>
                      <Input
                        type="text"
                        value={headline2Blue}
                        onChange={(e) => setHeadline2Blue(e.target.value)}
                        className="rounded-lg h-10"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">দ্বিতীয় লাইন (লাল অংশ):</Label>
                      <Input
                        type="text"
                        value={headline2Red}
                        onChange={(e) => setHeadline2Red(e.target.value)}
                        className="rounded-lg h-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-200/30 dark:border-slate-800/30">
                    <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">সরাসরি নিউজ ইমেজ আপলোড:</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleNewsImageUpload}
                      className="rounded-lg h-10 bg-white dark:bg-slate-900"
                    />
                  </div>

                  <div className="space-y-3 pt-2 border-t border-slate-200/30 dark:border-slate-800/30">
                    <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">লেখা ও ছবি পজিশন টিউনিং:</Label>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>Font Size Zoom (লেখা ছোট/বড় করুন):</span>
                        <span className="font-bold font-mono">{fontSizeOffset > 0 ? `+${fontSizeOffset}` : fontSizeOffset}px</span>
                      </div>
                      <Slider
                        min={-15}
                        max={15}
                        step={1}
                        value={[fontSizeOffset]}
                        onValueChange={(val) => setFontSizeOffset(val[0])}
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>Top Position (উপরের দূরত্ব):</span>
                        <span className="font-bold font-mono">{imageTop.toFixed(1)}%</span>
                      </div>
                      <Slider
                        min={15}
                        max={45}
                        step={0.1}
                        value={[imageTop]}
                        onValueChange={(val) => setImageTop(val[0])}
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>Height (ছবির উচ্চতা):</span>
                        <span className="font-bold font-mono">{imageHeight.toFixed(1)}%</span>
                      </div>
                      <Slider
                        min={25}
                        max={65}
                        step={0.1}
                        value={[imageHeight]}
                        onValueChange={(val) => setImageHeight(val[0])}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Card Box */}
      <div className="xl:col-span-6 flex flex-col items-center">
        <h3 className="text-base font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
          কার্ড প্রিভিউ (Real-time Preview)
        </h3>

        {/* Scaled viewport to fit the large 800x1000px poster inside dashboard */}
        <div 
          className="border border-slate-200 dark:border-slate-800/80 rounded-3xl bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-6 w-full shadow-inner overflow-hidden"
          style={{ minHeight: `${Math.round(cardHeight * 0.55) + 48}px` }}
        >
          <div 
            style={{ 
              width: "800px", 
              height: `${cardHeight}px`, 
              transform: `scale(0.55)`,
              transformOrigin: "center center",
              margin: `-${(cardHeight * 0.45) / 2}px -${(800 * 0.45) / 2}px` // offsets scaled overflow space
            }}
            className="shrink-0"
          >
            {/* The actual poster div captured by html2canvas */}
            <div
              ref={cardRef}
              id="card-preview"
              className="relative w-[800px] bg-white overflow-hidden select-none"
              style={{ 
                height: `${cardHeight}px`,
                fontFamily: "'SolaimanLipi', sans-serif"
              }}
            >
              {/* Background Template */}
              {templateSrc ? (
                <img
                  id="template-bg"
                  src={templateSrc}
                  alt="Template Background"
                  className="absolute inset-0 w-full h-full object-fill z-[1]"
                />
              ) : (
                <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-slate-100 border-4 border-dashed border-slate-300 text-slate-400 font-bold z-[1]">
                  <span>টেম্পলেট ইমেজ আপলোড করুন</span>
                </div>
              )}

              {/* Date */}
              <div
                id="card-date"
                className="absolute left-[6.5%] text-[20px] font-bold text-[#444] z-[3]"
                style={{ top: "4.8%" }}
              >
                {cardDate}
              </div>

              {/* Headline */}
              <div
                id="card-headline"
                className="absolute left-0 w-full text-center z-[3] px-[5%] box-border leading-[1.4] flex flex-col items-center"
                style={{ 
                  top: "9.5%",
                  letterSpacing: "0px",
                  fontVariantLigatures: "normal"
                }}
              >
                {/* Line 1 */}
                <div
                  className="font-bold text-[#1C2956] w-full break-words"
                  style={{ 
                    fontSize: `${fontSize + fontSizeOffset}px`,
                    letterSpacing: "0px"
                  }}
                >
                  {preserveSpaces(headline1)}
                </div>

                {/* Line 2 */}
                <div
                  className="font-bold w-full break-words flex items-center justify-center flex-wrap"
                  style={{ 
                    fontSize: `${fontSize + fontSizeOffset}px`,
                    letterSpacing: "0px"
                  }}
                >
                  {headline2Blue && (
                    <span className="text-[#1C2956] mr-1.5" style={{ letterSpacing: "0px" }}>
                      {preserveSpaces(headline2Blue)}{"\u00A0"}
                    </span>
                  )}
                  <span className="text-[#E31820]" style={{ letterSpacing: "0px" }}>
                    {preserveSpaces(headline2Red)}
                  </span>
                </div>
              </div>

              {/* Uploaded News Image */}
              {newsImageSrc ? (
                <div
                  id="news-image"
                  className="absolute left-[6.5%] w-[87%] bg-black z-[2] overflow-hidden"
                  style={{ 
                    top: `${imageTop}%`, 
                    height: `${imageHeight}%`
                  }}
                >
                  <img
                    src={newsImageSrc}
                    alt="News"
                    className="w-full h-full object-cover object-center"
                    crossOrigin="anonymous"
                  />
                </div>
              ) : (
                <div 
                  className="absolute left-[6.5%] w-[87%] bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-slate-500 font-bold z-[2]"
                  style={{ 
                    top: `${imageTop}%`, 
                    height: `${imageHeight}%` 
                  }}
                >
                  <span>নিউজ ইমেজ এরিয়া</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
