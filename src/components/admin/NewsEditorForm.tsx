import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  ArrowRight, 
  Save, 
  Eye, 
  Megaphone, 
  User, 
  FileText, 
  Image as ImageIcon, 
  Settings2, 
  CheckCircle2, 
  Sparkles,
  Clock,
  Send,
  X,
  Type,
  AlignLeft,
  LayoutGrid,
  Loader2
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { sanitizeImageUrl } from "@/lib/url-utils";
import { generateSlug, decodeBanglaText, formatBanglaDate, toBanglaNumber } from "@/lib/bangla-utils";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { cn } from "@/lib/utils";

interface NewsEditorFormProps {
  news: any; // Using standardized 'news' prop from the revamped AdminNews
  onClose: () => void;
}

export default function NewsEditorForm({ news, onClose }: NewsEditorFormProps) {
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const editingId = news?.id || null;
  
  // States
  const [title, setTitle] = useState(news?.title || "");
  const [kicker, setKicker] = useState(news?.kicker || "");
  const [content, setContent] = useState(news?.content || "");
  const [excerpt, setExcerpt] = useState(news?.excerpt || "");
  const [imageUrl, setImageUrl] = useState(news?.image_url || "");
  const [categoryId, setCategoryId] = useState(news?.category_id || "");
  const [authorId, setAuthorId] = useState(news?.author_id || "");
  const [isFeatured, setIsFeatured] = useState(news?.is_featured || false);
  const [status, setStatus] = useState<"draft" | "published">(news?.status || "draft");
  const [imageCaption, setImageCaption] = useState("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleImportNews = async () => {
    let cleanUrl = importUrl.trim();
    if (!cleanUrl) {
      toast({
        variant: "destructive",
        title: "ত্রুটি",
        description: "অনুগ্রহ করে নিউজ লিংকটি দিন।"
      });
      return;
    }

    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = "https://" + cleanUrl;
      setImportUrl(cleanUrl);
    }

    setImporting(true);
    toast({
      title: "ইম্পোর্ট শুরু হয়েছে",
      description: "অনুগ্রহ করে অপেক্ষা করুন, ডাটা লোড করা হচ্ছে..."
    });

    try {
      const encoded = encodeURIComponent(cleanUrl);
      const isDev = window.location.hostname === "localhost" && window.location.port === "5173";
      
      const primaryUrl = isDev 
        ? `http://localhost:8000/fetch?url=${encoded}`
        : `/fetch?url=${encoded}`;
        
      const fallbackUrl = `/proxy.php?action=fetch&url=${encoded}`;

      const response = await fetch(primaryUrl);
      const contentType = response.headers.get("content-type") || "";
      let targetResponse = response;
      if (response.status === 404 || contentType.includes("text/html")) {
        targetResponse = await fetch(fallbackUrl);
      }
      
      if (!targetResponse.ok) throw new Error("Fetch failed");
      const data = await targetResponse.json();

      if (data.error) throw new Error(data.error);

      if (data.title) {
        setTitle(data.title.replace(" - Janamat24", "").trim());
      }
      if (data.content) {
        setContent(data.content);
      }
      if (data.excerpt) {
        setExcerpt(data.excerpt);
      }
      
      // Auto-match category
      if (data.category && categories.length > 0) {
        const cleanCat = data.category.trim().toLowerCase();
        const matched = categories.find((c: any) => 
          c.name.toLowerCase().includes(cleanCat) || 
          cleanCat.includes(c.name.toLowerCase())
        );
        if (matched) {
          setCategoryId(matched.id);
        }
      }

      if (data.image) {
        let absoluteImgUrl = data.image;
        try {
          absoluteImgUrl = new URL(data.image, cleanUrl).href;
        } catch (e) {}
        
        const imgEncoded = encodeURIComponent(absoluteImgUrl);
        const imgPrimary = isDev 
          ? `http://localhost:8000/proxy-image?url=${imgEncoded}`
          : `/proxy-image?url=${imgEncoded}`;
        const imgFallback = `/proxy.php?action=image&url=${imgEncoded}`;

        const imgResp = await fetch(imgPrimary);
        const imgContentType = imgResp.headers.get("content-type") || "";
        let finalImgResp = imgResp;
        if (imgResp.status === 404 || imgContentType.includes("text/html")) {
          finalImgResp = await fetch(imgFallback);
        }

        if (finalImgResp.ok) {
          const blob = await finalImgResp.blob();
          const reader = new FileReader();
          reader.onloadend = () => {
            setImageUrl(reader.result as string);
          };
          reader.readAsDataURL(blob);
        } else {
          setImageUrl(absoluteImgUrl);
        }
      }

      toast({
        title: "সফল",
        description: "লিংক থেকে সফলভাবে টাইটেল, কন্টেন্ট এবং ইমেজ ইম্পোর্ট করা হয়েছে!"
      });
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "ইম্পোর্ট ব্যর্থ",
        description: `ডাটা আনা সম্ভব হয়নি। Error: ${err.message}`
      });
    } finally {
      setImporting(false);
    }
  };

  useEffect(() => {
    if (news?.image_url) {
      const parts = news.image_url.split('#');
      setImageUrl(parts[0]);
      if (parts[1]) {
        const params = new URLSearchParams(parts[1]);
        if (params.has('caption')) {
          setImageCaption(params.get('caption') || "");
        }
        if (params.has('kicker')) {
          setKicker(params.get('kicker') || "");
        }
      }
    }
  }, [news]);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id, name").order("name");
      return data || [];
    },
  });

  const { data: reporters = [] } = useQuery({
    queryKey: ["reporters-list"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, full_name, avatar_url").order("full_name");
      return data || [];
    },
  });



  const handlePublish = () => {
    if (!title.trim()) {
      toast({ title: "সতর্কতা", description: "শিরোনাম আবশ্যক", variant: "destructive" });
      return;
    }
    if (!imageUrl) {
      toast({ title: "সতর্কতা", description: "থাম্বনেইল ইমেজ আবশ্যক", variant: "destructive" });
      return;
    }
    if (!content) {
      toast({ title: "সতর্কতা", description: "বিস্তারিত কন্টেন্ট আবশ্যক", variant: "destructive" });
      return;
    }
    if (!categoryId) {
      toast({ title: "সতর্কতা", description: "সংবাদ বিভাগ আবশ্যক", variant: "destructive" });
      return;
    }
    saveMutation.mutate('published');
  };

  const saveMutation = useMutation({
    mutationFn: async (targetStatus: "draft" | "published") => {
      // Basic Validation (Fallback)
      if (!title.trim()) {
        throw new Error("Title required");
      }
      if (targetStatus === 'published' && (!categoryId || !content || !imageUrl)) {
        throw new Error("Fields required for publishing");
      }

      const cleanTitle = decodeBanglaText(title).trim();
      const slug = editingId ? undefined : generateSlug(cleanTitle) + "-" + Math.random().toString(36).substring(2, 7);
      
      // Store kicker and caption in image_url hash to avoid altering live database schema
      const hashParams = new URLSearchParams();
      if (imageCaption) hashParams.set('caption', imageCaption);
      if (kicker.trim()) hashParams.set('kicker', kicker.trim());
      const finalImageUrl = hashParams.toString() ? `${imageUrl}#${hashParams.toString()}` : imageUrl;

      const data: any = {
        title: cleanTitle,
        content: decodeBanglaText(content),
        excerpt: decodeBanglaText(excerpt),
        image_url: finalImageUrl,
        category_id: categoryId,
        author_id: authorId || null,
        is_featured: isFeatured,
        status: targetStatus,
        ...(targetStatus === 'published' && !news?.published_at && { published_at: new Date().toISOString() })
      };

      // Temporarily disabled until 'kicker' column is added to Supabase 'news' table
      // if (kicker.trim()) {
      //   data.kicker = kicker.trim();
      // } else {
      //   data.kicker = null;
      // }

      let finalId = editingId;
      if (editingId) {
        const { error } = await supabase.from("news").update(data).eq("id", editingId);
        if (error) throw error;
      } else {
        const { data: inserted, error } = await supabase.from("news").insert({ ...data, slug }).select("id").single();
        if (error) throw error;
        finalId = inserted?.id;
      }


      return targetStatus;
    },
    onSuccess: (st) => {
      queryClient.invalidateQueries({ queryKey: ["admin-news"] });
      queryClient.invalidateQueries({ queryKey: ["admin-recent-news"] });
      setLastSaved(new Date());
      toast({ title: "সফল", description: st === 'published' ? "সংবাদ প্রকাশিত হয়েছে" : "খসড়া সংরক্ষিত করা হয়েছে" });
      if (st === 'published') onClose();
    },
    onError: (e: unknown) => {
      toast({ title: "ত্রুটি", description: (e as Error).message || "সংরক্ষণ করা সম্ভব হয়নি", variant: "destructive" });
    }
  });

  const progress = useMemo(() => {
    let p = 0;
    if (title) p += 30;
    if (content) p += 40;
    if (imageUrl) p += 15;
    if (categoryId) p += 15;
    return p;
  }, [title, content, imageUrl, categoryId]);

  return (
    <div className="flex flex-col h-full bg-[#f8f9fb] dark:bg-slate-950 relative overflow-hidden font-sans">
      {/* Editorial Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl border-b border-slate-200/50 dark:border-slate-800/50 sticky top-0 z-[60] shadow-sm">
        <div className="flex items-center gap-12">
           <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-all bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white border border-slate-100 dark:border-slate-700 shadow-sm">
             <X className="w-5 h-5" />
           </button>
           <div className="space-y-1">
              <div className="flex items-center gap-4">
                 <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">{editingId ? "সংবাদ সম্পাদনা" : "নতুন সংবাদ এন্ট্রি"}</h2>
                 <div className="px-5 py-2 bg-emerald-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl shadow-emerald-500/30">
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    লাইভ
                 </div>
              </div>
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                    <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">স্মার্ট রাইটিং মোড সক্রিয়</p>
                 </div>
                 {lastSaved && <span className="text-[11px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest">| সংরক্ষিত: {toBanglaNumber(lastSaved.toLocaleTimeString())}</span>}
              </div>
           </div>
        </div>

        <div className="flex items-center gap-4">
           <Button variant="ghost" onClick={() => saveMutation.mutate('draft')} disabled={saveMutation.isPending || !title} className="h-10 px-6 rounded-xl font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700">খসড়া রাখুন</Button>
           <Button onClick={handlePublish} disabled={saveMutation.isPending || !title} className="h-10 px-8 rounded-xl bg-primary text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all flex gap-2.5 border-0">
              {saveMutation.isPending ? <Sparkles className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              প্রকাশ করুন
           </Button>
        </div>
      </div>

      {/* Structured Layout */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          {/* Content Viewport */}
          <div className="flex-1 overflow-y-auto bg-slate-50/30 dark:bg-slate-950/30 scroll-smooth flex flex-col">

            <Tabs value={activeTab} onValueChange={v => setActiveTab(v as "edit" | "preview")} className="h-full flex flex-col">
              <div className="flex justify-center p-4 sticky top-0 z-40 bg-slate-50/50 dark:bg-slate-950/50 backdrop-blur-xl border-b border-transparent transition-all">
                 <TabsList className="bg-slate-200/40 dark:bg-slate-800/40 p-1 rounded-full border border-slate-200/40 dark:border-slate-800/40 h-auto">
                    <TabsTrigger value="edit" className="rounded-full px-6 py-2 font-semibold flex gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm data-[state=active]:text-primary text-slate-500 dark:text-slate-400"><FileText className="w-4 h-4" /> এডিটর</TabsTrigger>
                    <TabsTrigger value="preview" className="rounded-full px-6 py-2 font-semibold flex gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm data-[state=active]:text-primary text-slate-500 dark:text-slate-400"><Eye className="w-4 h-4" /> প্রিভিউ</TabsTrigger>
                 </TabsList>
              </div>
              <div className="flex-1 p-4 lg:p-10 pb-32">
                <TabsContent value="edit" className="max-w-4xl mx-auto focus-visible:outline-none animate-in fade-in duration-500 space-y-12">
                    <div className="space-y-10">
                      {/* URL Import Card */}
                      <Card className="p-6 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/50 shadow-sm rounded-2xl">
                        <div className="space-y-3">
                          <Label className="text-xs font-black text-slate-500 uppercase tracking-widest block">অন্য সাইট থেকে নিউজ ইম্পোর্ট করুন (লিংক দিন):</Label>
                          <div className="flex gap-3">
                            <Input
                              type="text"
                              placeholder="যেমন: https://some-news-website.com/news/slug"
                              value={importUrl}
                              onChange={(e) => setImportUrl(e.target.value)}
                              className="rounded-xl border-slate-200 dark:border-slate-800 px-4 h-11 flex-1 bg-white dark:bg-slate-950"
                            />
                            <Button
                              onClick={handleImportNews}
                              disabled={importing}
                              className="rounded-xl px-6 h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all active:scale-95 flex gap-2 shrink-0 border-0"
                            >
                              {importing ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  লোডিং...
                                </>
                              ) : (
                                "ইম্পোর্ট করুন"
                              )}
                            </Button>
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium">লিংক পেস্ট করে ক্লিক করলে অটোমেটিক টাইটেল, বিস্তারিত কন্টেন্ট এবং থাম্বনেইল চলে আসবে। এরপর আপনি রিরাইট বা ১৯-২০ করে নিতে পারবেন।</p>
                        </div>
                      </Card>

                      <div className="space-y-3 group">
                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest ml-1">সুপার টাইটেল / কিকার (ঐচ্ছিক)</p>
                        <Input 
                          value={kicker} 
                          onChange={e => setKicker(e.target.value)} 
                          placeholder="এখানে লিখুন..." 
                          className="text-lg font-semibold border-none border-b border-slate-200 dark:border-slate-800 bg-transparent focus:ring-0 p-0 placeholder:text-slate-300 dark:placeholder:text-slate-700 text-slate-500 dark:text-slate-400 font-bengali rounded-none h-auto pb-2" 
                        />
                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest ml-1 mt-6">হেডলাইন</p>
                        <Textarea 
                          value={title} 
                          onChange={e => setTitle(e.target.value)} 
                          placeholder="সংবাদের বড় শিরোনাম এখানে লিখুন..." 
                          className="text-3xl lg:text-4xl font-black border-none bg-transparent focus:ring-0 p-0 placeholder:text-slate-200 dark:placeholder:text-slate-800 min-h-[80px] resize-none leading-tight tracking-tight text-slate-900 dark:text-white font-bengali mt-2" 
                        />
                      </div>
                      
                      <Card className="p-6 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 shadow-sm rounded-2xl group transition-all">
                        <div className="flex items-center justify-between mb-4 px-1">
                          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">থাম্বনেইল ইমেজ</p>
                          <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center"><ImageIcon className="w-4 h-4 text-slate-400 dark:text-slate-500" /></div>
                        </div>
                        <ImageUpload value={imageUrl} onChange={setImageUrl} />
                        <div className="mt-4">
                           <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">ছবির উৎস / ক্যাপশন (ঐচ্ছিক)</p>
                           <Input
                             value={imageCaption}
                             onChange={e => setImageCaption(e.target.value)}
                             placeholder="যেমন: সংগৃহীত / ছবি সংগৃহীত"
                             className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 font-bengali"
                           />
                        </div>
                      </Card>

                      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 shadow-sm rounded-2xl">
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 ml-1 border-l-2 border-primary pl-3">শর্ট সামারি</p>
                        <Textarea 
                          value={excerpt} 
                          onChange={e => setExcerpt(e.target.value)} 
                          placeholder="সংবাদের সারসংক্ষেপ..." 
                          className="text-base font-medium border-none bg-transparent focus:ring-0 p-0 placeholder:text-slate-300 dark:placeholder:text-slate-700 min-h-[80px] resize-none leading-relaxed text-slate-700 dark:text-slate-300" 
                        />
                      </div>
                    </div>

                    <div className="space-y-8 lg:space-y-12">
                      <div className="flex items-center justify-between px-2 lg:px-6">
                        <p className="text-[12px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] border-l-4 border-primary pl-4">বিস্তারিত কন্টেন্ট</p>
                        <div className="hidden sm:flex items-center gap-3 bg-white dark:bg-slate-900 px-5 py-2.5 rounded-full shadow-sm border border-slate-100 dark:border-slate-800">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">অটো-সেভ সক্রিয়</span>
                        </div>
                      </div>
                      <RichTextEditor value={content} onChange={setContent} />
                    </div>

                    <div className="space-y-8">
                        <div className="grid md:grid-cols-2 gap-6">
                            <Card className="border border-slate-200/60 dark:border-slate-800 shadow-sm rounded-2xl bg-white dark:bg-slate-900 p-6 space-y-4">
                                <div className="flex items-center gap-3 mb-1">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-primary"><LayoutGrid className="w-5 h-5" /></div>
                                    <p className="text-lg font-bold text-slate-900 dark:text-white">সংবাদ বিভাগ</p>
                                </div>
                                <Select value={categoryId} onValueChange={setCategoryId}>
                                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-transparent font-medium text-slate-900 dark:text-white"><SelectValue placeholder="বিভাগ পছন্দ করুন" /></SelectTrigger>
                                    <SelectContent className="rounded-xl border-none shadow-lg bg-white dark:bg-slate-950">
                                        {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </Card>

                            <Card className="border border-slate-200/60 dark:border-slate-800 shadow-sm rounded-2xl bg-white dark:bg-slate-900 p-6 space-y-4">
                                <div className="flex items-center gap-3 mb-1">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500"><User className="w-5 h-5" /></div>
                                    <p className="text-lg font-bold text-slate-900 dark:text-white">প্রতিবেদক</p>
                                </div>
                                <Select value={authorId} onValueChange={setAuthorId}>
                                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-transparent font-medium text-slate-900 dark:text-white"><SelectValue placeholder="প্রতিবেদক নির্বাচন" /></SelectTrigger>
                                    <SelectContent className="rounded-xl border-none shadow-lg bg-white dark:bg-slate-950">
                                        {reporters.map(r => <SelectItem key={r.user_id} value={r.user_id} className="cursor-pointer"><div className="flex items-center gap-3"><Avatar className="w-6 h-6"><AvatarImage src={r.avatar_url || ""} /><AvatarFallback>U</AvatarFallback></Avatar> {r.full_name}</div></SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </Card>
                        </div>

                        <Card className="border border-slate-200/60 dark:border-slate-800 shadow-sm rounded-2xl bg-white dark:bg-slate-900 overflow-hidden">
                              <div className="p-6 bg-primary text-white flex items-center justify-between">
                                  <div>
                                    <h3 className="text-lg font-black tracking-tight mb-1 flex items-center gap-2"><Settings2 className="w-5 h-5" /> পাবলিশিং কন্ট্রোল</h3>
                                    <p className="text-[10px] text-white/60 font-black uppercase tracking-widest">কন্টেন্ট সেটিংস ও অ্যাড ইন্টিগ্রেশন</p>
                                  </div>
                                  <div className="flex h-10 w-10 rounded-xl bg-white/10 items-center justify-center border border-white/10 shadow-inner"><Sparkles className="w-4 h-4 text-white" /></div>
                              </div>
                            <div className="p-8 space-y-8">
                                <div className="flex items-center justify-between p-6 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                                  <div className="space-y-1">
                                      <p className="font-semibold text-slate-900 dark:text-white">ফিচার্ড কন্টেন্ট (Featured)</p>
                                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">এটি অন করলে সংবাদটি অ্যাপের মেইন ব্যানার সেকশনে অগ্রাধিকার পাবে।</p>
                                  </div>
                                  <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
                                </div>

                            </div>
                        </Card>
                    </div>

                    <div className="flex items-center justify-end gap-4 pt-4 mt-6">
                       <Button variant="ghost" onClick={() => saveMutation.mutate('draft')} disabled={saveMutation.isPending || !title} className="h-12 px-6 rounded-xl font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">খসড়া রাখুন</Button>
                       <Button onClick={handlePublish} disabled={saveMutation.isPending || !title} className="h-12 px-10 rounded-xl bg-primary text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all flex gap-2.5 border-0">
                          {saveMutation.isPending ? <Sparkles className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                          প্রকাশ করুন
                       </Button>
                    </div>
                </TabsContent>

                <TabsContent value="preview" className="max-w-3xl mx-auto focus-visible:outline-none animate-in zoom-in-95 duration-300">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
                        {imageUrl && <div className="h-[350px] w-full overflow-hidden relative">
                           <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                           <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        </div>}
                        <div className="p-8 lg:p-12 space-y-8">
                            <div className="flex items-center gap-4">
                               <Badge className="bg-indigo-600 text-white font-medium px-4 py-1 rounded-full text-xs shadow-sm">{categories.find(c => c.id === categoryId)?.name || 'ক্যাটাগরি'}</Badge>
                               <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{formatBanglaDate(new Date().toISOString())}</span>
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white">
                              {kicker && <span className="block text-xl text-slate-500 mb-2 font-semibold">{kicker}</span>}
                              {title || "শিরোনাম এখানে দেখাবে"}
                            </h1>
                            <div className="flex items-center gap-4 py-6 border-y border-slate-100 dark:border-slate-800">
                               <Avatar className="w-12 h-12 shadow-sm"><AvatarImage src={reporters.find(r => r.user_id === authorId)?.avatar_url || ""} /><AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold">U</AvatarFallback></Avatar>
                               <div>
                                  <p className="text-base font-semibold text-slate-900 dark:text-white">{reporters.find(r => r.user_id === authorId)?.full_name || "প্রতিবেদক নাম"}</p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> জনমত ২৪ স্টাফ</p>
                               </div>
                            </div>
                            <div className="prose dark:prose-invert prose-slate max-w-none text-slate-800 dark:text-slate-200" dangerouslySetInnerHTML={{ __html: content || "<p className='text-slate-400 italic'>বিষয়বস্তু এখানে লোড হবে...</p>" }} />
                        </div>
                    </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
