import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Megaphone, Settings, Send, Image as ImageIcon } from "lucide-react";
import { AdMediaUpload } from "@/components/admin/AdMediaUpload";
import { sanitizeLinkUrl } from "@/lib/url-utils";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const PLACEMENTS = [
  { value: "header", label: "১. একদম উপরে (লোগোর ডানপাশে)", type: "wide" },
  { value: "in_article", label: "২. হোমপেজ ফিড (খবরের মাঝে)", type: "wide" },
  { value: "sidebar", label: "৩. হোমপেজ ডানপাশে (স্কয়ার)", type: "square" },
  { value: "article_inline", label: "৪. খবরের বিস্তারিত পেজে (মাঝখানে)", type: "wide" },
  { value: "article_related", label: "৫. সম্পর্কিত খবরের নিচে", type: "wide" },
  { value: "article_side", label: "৬. খবর পাতার ডানপাশে (স্কয়ার)", type: "square" },
  { value: "quran_top_banner", label: "৭. কোরআন পেজ উপরে", type: "wide" },
  { value: "quran_side_square", label: "৮. কোরআন পেজ ডানপাশে", type: "square" },
  { value: "article_bottom", label: "৯. কনভার্টার পেজের নিচে", type: "wide" },
  { value: "footer", label: "১০. একদম নিচে (ফুটার)", type: "wide" },
  { value: "related_news_inline", label: "১১. সম্পর্কিত সংবাদের মাঝে (কার্ড)", type: "square" },
];

export default function AdminAdPartners() {
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [partnerName, setPartnerName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [companyLogo, setCompanyLogo] = useState("");
  const [adType, setAdType] = useState("single_image");
  const [placementTypes, setPlacementTypes] = useState<string[]>([]);
  
  const [imageUrl, setImageUrl] = useState("");
  const [imageUrl2, setImageUrl2] = useState("");
  const [imageUrl3, setImageUrl3] = useState("");
  
  const [linkUrl, setLinkUrl] = useState("");
  const [linkUrl2, setLinkUrl2] = useState("");
  const [linkUrl3, setLinkUrl3] = useState("");
  
  const [subtitle, setSubtitle] = useState("");
  const [isActive, setIsActive] = useState(true);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: allBanners = [], isLoading } = useQuery({
    queryKey: ["all-ad-banners"],
    queryFn: async () => {
      const { data: partnersData } = await supabase.from("ad_partners").select("*");
      const { data: bannersData } = await supabase.from("ad_banners").select("*").order("created_at", { ascending: false });
      
      return (bannersData || []).map(b => {
        const partner = partnersData?.find(p => p.id === b.partner_id);
        return {
          ...b,
          partner_name: partner?.name || "Unknown Partner",
          company_logo: partner?.logo_url || null
        };
      });
    }
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Find or create Partner based on title (partnerName)
      let partnerId = "";
      const pName = partnerName.trim() || "Uncategorized Ad";
      const { data: existingPartners } = await supabase.from("ad_partners").select("id").eq("name", pName);
      if (existingPartners && existingPartners.length > 0) {
        partnerId = existingPartners[0].id;
        if (companyLogo || websiteUrl) {
           const { error: pUpdateErr } = await supabase.from("ad_partners").update({
             ...(companyLogo && { logo_url: companyLogo }),
             ...(websiteUrl && { website_url: websiteUrl })
           }).eq("id", partnerId);
           if (pUpdateErr) throw pUpdateErr;
        }
      } else {
        const { data: newPartner, error: pInsertErr } = await supabase.from("ad_partners").insert({ 
          name: pName, 
          logo_url: companyLogo.trim() || null, 
          website_url: websiteUrl.trim() || null, 
          is_active: true 
        }).select().single();
        if (pInsertErr) throw pInsertErr;
        if (newPartner) partnerId = newPartner.id;
      }

      let finalImageUrl = imageUrl;
      let finalLinkUrl = linkUrl || null;

      if (adType === "triple_image_ad") {
        if (!imageUrl || !imageUrl2 || !imageUrl3) {
          throw new Error("৩টি ছবিই আপলোড করতে হবে");
        }
        finalImageUrl = JSON.stringify([imageUrl, imageUrl2, imageUrl3]);
        finalLinkUrl = JSON.stringify([linkUrl || "", linkUrl2 || "", linkUrl3 || ""]);
      }

      // Map UI placement values to database allowed values to bypass check constraint
      const dbPlacementTypeMap: Record<string, string> = {
        header: "header",
        in_article: "in_article",
        sidebar: "sidebar",
        featured_news_inline: "in_article",
        article_inline: "in_article",
        article_related: "in_article",
        article_side: "sidebar",
        quran_top_banner: "header",
        quran_side_square: "sidebar",
        article_bottom: "footer",
        footer: "footer",
        related_news_inline: "sidebar"
      };

      const firstPlacement = placementTypes[0] || "header";
      const dbPlacementType = dbPlacementTypeMap[firstPlacement] || firstPlacement;
      const serializedPlacements = JSON.stringify(placementTypes);

      const bannerData = {
        partner_id: partnerId,
        placement_type: dbPlacementType,
        alt_text: serializedPlacements, // Store all selected UI placement types
        image_url: finalImageUrl,
        link_url: finalLinkUrl,
        is_active: isActive
      };

      if (editingId) {
        const { error: updateErr } = await supabase.from("ad_banners").update(bannerData).eq("id", editingId);
        if (updateErr) throw updateErr;
      } else {
        const { error: insertErr } = await supabase.from("ad_banners").insert([bannerData]);
        if (insertErr) throw insertErr;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({ title: "সফল", description: "বিজ্ঞাপন সংরক্ষণ করা হয়েছে" });
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "ত্রুটি", description: error.message || "বিজ্ঞাপন সেভ করতে সমস্যা হয়েছে", variant: "destructive" });
    }
  });

  const deleteBannerMutation = useMutation({
    mutationFn: async (bannerId: string) => {
      await supabase.from("ad_banners").delete().eq("id", bannerId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({ title: "সফল", description: "বিজ্ঞাপন মুছে ফেলা হয়েছে" });
    }
  });

  const resetForm = () => {
    setEditingId(null);
    setPartnerName("");
    setWebsiteUrl("");
    setCompanyLogo("");
    setAdType("single_image");
    setPlacementTypes([]);
    setImageUrl("");
    setImageUrl2("");
    setImageUrl3("");
    setLinkUrl("");
    setLinkUrl2("");
    setLinkUrl3("");
    setSubtitle("");
    setIsActive(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEdit = (b: any) => {
    setEditingId(b.id);
    setPartnerName(b.partner_name || b.title || "");
    
    // Parse placements from alt_text or fallback to placement_type
    let initialPlacements: string[] = [];
    if (b.alt_text) {
      if (b.alt_text.startsWith('[') && b.alt_text.endsWith(']')) {
        try {
          initialPlacements = JSON.parse(b.alt_text);
        } catch (e) {
          initialPlacements = [b.alt_text];
        }
      } else {
        initialPlacements = b.alt_text.split(',').map((p: string) => p.trim());
      }
    } else if (b.placement_type) {
      initialPlacements = [b.placement_type];
    }
    setPlacementTypes(initialPlacements);

    setIsActive(b.is_active);
    setCompanyLogo(b.company_logo || "");
    setSubtitle(b.subtitle || "");

    const isTriple = b.image_url?.startsWith('[') && b.image_url?.endsWith(']');
    if (isTriple) {
      try {
        const imgs = JSON.parse(b.image_url);
        const lnks = b.link_url ? JSON.parse(b.link_url) : [];
        setAdType("triple_image_ad");
        setImageUrl(imgs[0] || "");
        setImageUrl2(imgs[1] || "");
        setImageUrl3(imgs[2] || "");
        setLinkUrl(lnks[0] || "");
        setLinkUrl2(lnks[1] || "");
        setLinkUrl3(lnks[2] || "");
      } catch (e) {
        setAdType("single_image");
        setImageUrl(b.image_url || "");
        setLinkUrl(b.link_url || "");
      }
    } else {
      setAdType("single_image");
      setImageUrl(b.image_url || "");
      setImageUrl2("");
      setImageUrl3("");
      setLinkUrl(b.link_url || "");
      setLinkUrl2("");
      setLinkUrl3("");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getPreviewImage = (b: any) => {
    if (b.image_url?.startsWith('[')) {
      try {
        return JSON.parse(b.image_url)[0];
      } catch(e) { return ""; }
    }
    return b.image_url;
  };

  const getBannerPlacements = (banner: any): string[] => {
    if (banner.alt_text) {
      if (banner.alt_text.startsWith('[') && banner.alt_text.endsWith(']')) {
        try {
          return JSON.parse(banner.alt_text);
        } catch (e) {
          return [banner.alt_text];
        }
      } else {
        return banner.alt_text.split(',').map((p: string) => p.trim());
      }
    }
    return [banner.placement_type];
  };

  return (
    <div className="space-y-6 pb-20 max-w-[1200px] mx-auto animate-in fade-in duration-500">
      
      {/* Top Form Section */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
           <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
             <Megaphone className="w-5 h-5" />
             <h2 className="font-bold">{editingId ? "বিজ্ঞাপন সম্পাদনা করুন" : "নতুন বিজ্ঞাপন দিন"}</h2>
           </div>
           {editingId && (
             <Button variant="ghost" size="sm" onClick={resetForm} className="text-rose-500 hover:text-rose-600 hover:bg-rose-50">
                বাতিল করুন
             </Button>
           )}
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
             <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">অ্যাড টাইপ</Label>
                <Select value={adType} onValueChange={setAdType}>
                   <SelectTrigger className="h-11 rounded-lg border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-200">
                      <SelectValue placeholder="অ্যাড টাইপ নির্বাচন করুন" />
                   </SelectTrigger>
                   <SelectContent>
                      <SelectItem value="single_image">সিঙ্গেল ইমেজ (স্ট্যান্ডার্ড)</SelectItem>
                      <SelectItem value="triple_image_ad">৩টি ছবির বিজ্ঞাপন (একসাথে)</SelectItem>
                   </SelectContent>
                </Select>
             </div>
             <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">অবস্থান (Position) - একাধিক সিলেক্ট করতে পারেন</Label>
                <Popover>
                   <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full h-11 justify-between text-left font-normal border-slate-200 dark:border-slate-800 bg-transparent hover:bg-transparent text-slate-800 dark:text-slate-200">
                         <span className="truncate">
                            {placementTypes.length === 0 
                              ? "অবস্থান নির্বাচন করুন" 
                              : placementTypes.map(val => PLACEMENTS.find(p => p.value === val)?.label.replace(/^\d+\.\s*/, '')).join(", ")
                            }
                         </span>
                         <span className="text-xs text-muted-foreground ml-2 shrink-0">▼</span>
                      </Button>
                   </PopoverTrigger>
                   <PopoverContent className="w-[350px] p-4 space-y-3 max-h-[400px] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md" align="start">
                      <div className="font-bold text-xs text-slate-500 uppercase tracking-wider mb-2">বিজ্ঞাপনের অবস্থানসমূহ</div>
                      <div className="space-y-2.5">
                         {PLACEMENTS.map((p) => {
                            const isChecked = placementTypes.includes(p.value);
                            const handleToggle = (checked: boolean) => {
                              if (checked) {
                                setPlacementTypes([...placementTypes, p.value]);
                              } else {
                                setPlacementTypes(placementTypes.filter(val => val !== p.value));
                              }
                            };
                            return (
                               <div key={p.value} className="flex items-start gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 p-1.5 rounded-md transition-colors">
                                  <Checkbox 
                                     id={`placement-${p.value}`} 
                                     checked={isChecked} 
                                     onCheckedChange={(checked) => handleToggle(!!checked)}
                                     className="mt-0.5"
                                  />
                                  <label 
                                     htmlFor={`placement-${p.value}`}
                                     className="text-sm font-medium leading-tight cursor-pointer text-slate-700 dark:text-slate-300 select-none"
                                  >
                                     {p.label}
                                  </label>
                               </div>
                            );
                         })}
                      </div>
                   </PopoverContent>
                </Popover>
             </div>
          </div>

          {adType === "single_image" ? (
            <>
              <div className="space-y-2">
                 <div className="flex items-center gap-2">
                   <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">বিজ্ঞাপন ইমেজ আপলোড</Label>
                   <span className="text-[10px] font-bold bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded tracking-widest uppercase">REQUIRED</span>
                 </div>
                 <AdMediaUpload 
                   value={imageUrl} 
                   onChange={setImageUrl} 
                   requiredWidth={placementTypes.some(p => p.includes('side') || p.includes('square')) ? 400 : 800} 
                   requiredHeight={placementTypes.some(p => p.includes('side') || p.includes('square')) ? 400 : 200} 
                   placementLabel="Banner" 
                 />
                 <div className="pt-2">
                    <Input 
                      value={imageUrl} 
                      onChange={e => setImageUrl(e.target.value)} 
                      placeholder="অথবা সরাসরি ছবির ইউআরএল (URL) দিন..." 
                      className="h-10 text-sm bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
                    />
                 </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">বিজ্ঞাপনের শিরোনাম (কোম্পানি নাম)</Label>
                   <Input value={partnerName} onChange={e => setPartnerName(e.target.value)} className="h-11 rounded-lg bg-transparent border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200" placeholder="এখানে কোম্পানি নাম" />
                 </div>
                 <div className="space-y-2">
                   <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">ল্যান্ডিং পেজ লিংক (URL)</Label>
                   <Input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} className="h-11 rounded-lg bg-transparent border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200" placeholder="https://example.com" />
                 </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 relative">
                <Badge variant="outline" className="absolute top-4 right-4 text-[10px] text-rose-500 border-rose-200 bg-rose-50 uppercase font-black">MULTI</Badge>
                
                <h3 className="font-bold text-slate-800 dark:text-slate-200">মিডিয়া এবং কন্টেন্ট কনফিগারেশন</h3>
                <p className="text-sm font-bold text-slate-600 dark:text-slate-400 pb-2">মাল্টি ইমেজ গ্যালারি (৩টি ছবি বাধ্যতামূলক)</p>
                
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Image 1 */}
                  <div className="space-y-3">
                     <AdMediaUpload value={imageUrl} onChange={setImageUrl} requiredWidth={400} requiredHeight={400} placementLabel="ছবি ১" />
                     <Input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} className="h-11 rounded-lg bg-white dark:bg-slate-950 border-slate-200 text-slate-800 dark:text-slate-200" placeholder="লিংক ১" />
                  </div>
                  {/* Image 2 */}
                  <div className="space-y-3">
                     <AdMediaUpload value={imageUrl2} onChange={setImageUrl2} requiredWidth={400} requiredHeight={400} placementLabel="ছবি ২" />
                     <Input value={linkUrl2} onChange={e => setLinkUrl2(e.target.value)} className="h-11 rounded-lg bg-white dark:bg-slate-950 border-slate-200 text-slate-800 dark:text-slate-200" placeholder="লিংক ২" />
                  </div>
                  {/* Image 3 */}
                  <div className="space-y-3">
                     <AdMediaUpload value={imageUrl3} onChange={setImageUrl3} requiredWidth={400} requiredHeight={400} placementLabel="ছবি ৩" />
                     <Input value={linkUrl3} onChange={e => setLinkUrl3(e.target.value)} className="h-11 rounded-lg bg-white dark:bg-slate-950 border-slate-200 text-slate-800 dark:text-slate-200" placeholder="লিংক ৩" />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 pt-4">
                 <div className="space-y-2">
                   <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">বিজ্ঞাপনের শিরোনাম (কোম্পানি নাম)</Label>
                   <Input value={partnerName} onChange={e => setPartnerName(e.target.value)} className="h-11 rounded-lg bg-transparent border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200" placeholder="যেমন: এনসিসি ব্যাংক" />
                 </div>
              </div>
            </>
          )}

          <div className="grid md:grid-cols-2 gap-6">
             <div className="space-y-2">
               <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">কোম্পানি লোগো (ঐচ্ছিক)</Label>
               <div className="flex gap-2">
                  <Input value={companyLogo} onChange={e => setCompanyLogo(e.target.value)} className="h-11 rounded-lg bg-transparent border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200" placeholder="লোগোর ইউআরএল..." />
               </div>
             </div>
             <div className="space-y-2">
               <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">সাব-টাইটেল / স্লোগান (ঐচ্ছিক)</Label>
               <Input value={subtitle} onChange={e => setSubtitle(e.target.value)} className="h-11 rounded-lg bg-transparent border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200" placeholder="এখানে সাব-টাইটেল বা স্লোগান যুক্ত করুন" />
             </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
             <Button 
               onClick={() => saveMutation.mutate()} 
               disabled={saveMutation.isPending || !partnerName || placementTypes.length === 0 || !imageUrl} 
               className="h-12 px-8 rounded-lg bg-[#E31E24] hover:bg-red-700 text-white font-bold tracking-wide shadow-md flex items-center gap-2 uppercase"
             >
               <Send className="w-4 h-4" />
               {editingId ? "Update Ad" : "Publish Ad Now"}
             </Button>
          </div>
        </div>
      </div>

      {/* Bottom List Section */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-2 text-slate-800 dark:text-slate-200">
           <Settings className="w-5 h-5" />
           <h2 className="font-bold">অ্যাক্টিভ বিজ্ঞাপনসমূহ</h2>
        </div>
        
        <div className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">লোড হচ্ছে...</div>
          ) : allBanners.length === 0 ? (
            <div className="p-8 text-center text-slate-500">কোনো বিজ্ঞাপন পাওয়া যায়নি</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
               {allBanners.map((banner) => {
                 const isTriple = banner.image_url?.startsWith('[');
                 const bannerTypeStr = isTriple ? "MULTI" : "SINGLE";
                 return (
                   <div key={banner.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                      <div className="flex items-center gap-4">
                         <div className="w-16 h-12 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                            {getPreviewImage(banner) ? (
                              <img src={getPreviewImage(banner)} className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-slate-300" />
                            )}
                         </div>
                         <div>
                            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1 truncate max-w-[200px] sm:max-w-[300px]">{banner.partner_name || "Unknown"}</h3>
                            <div className="flex gap-2">
                               <Badge variant="outline" className="text-[9px] text-blue-600 border-blue-200 bg-blue-50 px-1.5 py-0 uppercase">{bannerTypeStr}</Badge>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                               {getBannerPlacements(banner).map((pVal) => {
                                 const label = PLACEMENTS.find(p => p.value === pVal)?.label || pVal;
                                 return (
                                   <Badge key={pVal} variant="outline" className="text-[9px] text-slate-600 border-slate-200 bg-slate-50 px-1.5 py-0">
                                     {label.replace(/^\d+\.\s*/, '')}
                                   </Badge>
                                 );
                               })}
                            </div>
                         </div>
                      </div>
                      
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity md:opacity-100">
                         <Button 
                           variant="outline" 
                           size="sm" 
                           className="h-8 text-xs font-semibold text-rose-500 border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700"
                           onClick={() => handleEdit(banner)}
                         >
                            <Pencil className="w-3 h-3 mr-1" /> এডিট করুন
                         </Button>
                         <Button 
                           variant="outline" 
                           size="sm" 
                           className="h-8 text-xs font-semibold text-rose-500 border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700"
                           onClick={() => {
                             if (confirm("বিজ্ঞাপনটি মুছবেন?")) {
                               deleteBannerMutation.mutate(banner.id);
                             }
                           }}
                         >
                            <Trash2 className="w-3 h-3 mr-1" /> ডিলিট করুন
                         </Button>
                      </div>
                   </div>
                 );
               })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
