import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, FolderOpen, Search, X, Newspaper, Eye, Hash, TrendingUp, ChevronRight } from "lucide-react";
import { generateSlug, toBanglaNumber } from "@/lib/bangla-utils";
import { cn } from "@/lib/utils";

export default function AdminCategories() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["admin-categories-with-stats"],
    queryFn: async () => {
      const { data: categoriesData } = await supabase.from("categories").select("*").order("name");
      const { data: newsStats } = await supabase.from("news").select("category_id, views").eq("status", "published");
      
      const statsMap: Record<string, { count: number; views: number }> = {};
      newsStats?.forEach(n => {
        if (!n.category_id) return;
        if (!statsMap[n.category_id]) statsMap[n.category_id] = { count: 0, views: 0 };
        statsMap[n.category_id].count++;
        statsMap[n.category_id].views += (n.views || 0);
      });

      return (categoriesData || []).map(category => ({
        ...category,
        news_count: statsMap[category.id]?.count || 0,
        total_views: statsMap[category.id]?.views || 0,
      }));
    },
  });

  const filteredCategories = useMemo(() => {
    return categories.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.slug.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [categories, searchQuery]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingCategory) await supabase.from("categories").update(data).eq("id", editingCategory.id);
      else await supabase.from("categories").insert(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories-with-stats"] });
      toast({ title: "সফল", description: "ক্যাটাগরি সংরক্ষিত হয়েছে" });
      setDialogOpen(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories-with-stats"] });
      toast({ title: "সফল", description: "ক্যাটাগরি মুছে ফেলা হয়েছে" });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "ত্রুটি", description: `মুছে ফেলা সম্ভব হয়নি: ${err.message}` });
    }
  });

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-1000 slide-in-from-bottom-5">
      {/* Editorial Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-900 dark:bg-primary" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">Classifiers</p>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white tracking-tightest leading-none">বিভাগীয় বিন্যাস</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-xl leading-relaxed max-w-2xl font-bengali">আপনার পোর্টালের সংবাদের প্রকারভেদ এবং শ্রেণীবিভাগ এখান থেকে সুশৃঙ্খলভাবে পরিচালনা করুন।</p>
        </div>
        <Button 
          onClick={() => { setEditingCategory(null); setName(""); setDescription(""); setDialogOpen(true); }} 
          className="h-12 px-10 rounded-2xl bg-slate-900 dark:bg-primary hover:bg-slate-800 dark:hover:opacity-90 text-white dark:text-primary-foreground font-bold text-lg shadow-2xl shadow-black/5 active:scale-95 transition-all gap-4"
        >
          <Plus className="w-6 h-6" /> নতুন বিভাগ
        </Button>
      </div>

      {/* Grid of Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: "মোট বিভাগ", val: categories.length, icon: FolderOpen, color: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500", desc: "সক্রিয় বিভাগসমূহ" },
          { label: "গড় রিডিং ভিউ", val: Math.round(categories.reduce((a,b) => a+b.total_views,0) / (categories.length || 1)), icon: TrendingUp, color: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500", desc: "ভিউ পার ক্যাটাগরি" },
          { label: "নিউজ কভারেজ", val: categories.reduce((a,b) => a+b.news_count,0), icon: Newspaper, color: "bg-amber-50 dark:bg-amber-900/20 text-amber-500", desc: "মোট আর্কাইভ কন্টেন্ট" }
        ].map((s, i) => (
          <Card key={i} className="border-slate-200/50 dark:border-slate-800 shadow-sm rounded-2xl p-4 bg-white dark:bg-slate-900 hover:shadow-xl transition-all duration-500 overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-slate-50 dark:bg-slate-800 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
            <CardContent className="p-6 relative z-10">
               <div className="flex items-center gap-5 mb-6">
                  <div className={cn("p-4 rounded-2xl", s.color)}><s.icon className="w-6 h-6" /></div>
                  <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{s.label}</h3>
               </div>
               <p className="text-5xl font-bold text-slate-900 dark:text-white tracking-tightest leading-none mb-1">{toBanglaNumber(s.val)}</p>
               <p className="text-[10px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-widest">{s.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Categories Modern Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
           <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">সকল বিভাগ</h3>
           <div className="relative group w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 dark:text-slate-600 group-focus-within:text-slate-900 dark:group-focus-within:text-white" />
              <Input placeholder="ফিল্টার করুন..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="h-11 pl-12 bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-sm text-slate-900 dark:text-white" />
           </div>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
             {[1,2,3].map(i => <div key={i} className="h-48 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
             {filteredCategories.map(cat => (
               <Card key={cat.id} className="group border-slate-200/50 dark:border-slate-800 shadow-sm rounded-2xl bg-white dark:bg-slate-900 overflow-hidden hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-black/50 transition-all duration-500 flex flex-col">
                  <CardHeader className="p-8 pb-4">
                     <div className="flex items-start justify-between">
                        <div className="w-14 h-10 bg-slate-50 dark:bg-slate-800 rounded-[1.25rem] border border-slate-100 dark:border-slate-700 flex items-center justify-center group-hover:bg-slate-900 dark:group-hover:bg-primary group-hover:text-white dark:group-hover:text-primary-foreground transition-all duration-500">
                           <Hash className="w-6 h-6" />
                        </div>
                        <Badge variant="outline" className="rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold text-[9px] border-none px-3 uppercase tracking-widest leading-none py-1.5">{cat.slug}</Badge>
                     </div>
                  </CardHeader>
                  <CardContent className="p-8 pt-0 flex-1 flex flex-col">
                     <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-2 group-hover:text-slate-700 dark:group-hover:text-slate-300">{cat.name}</h3>
                     <p className="text-sm text-slate-400 dark:text-slate-500 font-medium leading-relaxed mb-8 min-h-[3rem] line-clamp-2">{cat.description || "কোন বিবরণ যোগ করা হয়নি।"}</p>
                     
                     <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 transition-all hover:bg-white dark:hover:bg-slate-800 shadow-sm overflow-hidden relative">
                           <div className="absolute top-0 right-0 p-2 opacity-5 dark:opacity-10 dark:text-white"><Newspaper /></div>
                           <p className="text-2xl font-bold text-slate-900 dark:text-white leading-none mb-1">{toBanglaNumber(cat.news_count)}</p>
                           <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-sans">সংবাদ</p>
                        </div>
                        <div className="p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 transition-all hover:bg-white dark:hover:bg-slate-800 shadow-sm overflow-hidden relative">
                           <div className="absolute top-0 right-0 p-2 opacity-5 dark:opacity-10 dark:text-white"><Eye /></div>
                           <p className="text-2xl font-bold text-slate-900 dark:text-white leading-none mb-1">{toBanglaNumber(cat.total_views)}</p>
                           <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-sans">টোটাল ভিউ</p>
                        </div>
                     </div>

                     <div className="mt-auto pt-6 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex gap-2">
                           <Button size="icon" variant="ghost" className="h-11 w-11 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 shadow-none hover:shadow-lg transition-all" onClick={() => { setEditingCategory(cat); setName(cat.name); setDescription(cat.description || ""); setDialogOpen(true); }}>
                              <Pencil className="w-4 h-4 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white" />
                           </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-11 w-11 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 shadow-none hover:shadow-lg transition-all text-rose-400 hover:text-rose-500" 
                              disabled={cat.news_count > 0 || deleteMutation.isPending}
                              onClick={() => {
                                if (confirm("এই ক্যাটাগরিটি মুছে ফেলতে চান?")) {
                                  deleteMutation.mutate(cat.id);
                                }
                              }}
                            >
                               <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                        <Button variant="ghost" className="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold gap-2 px-0 h-10 group/btn">
                           বিস্তারিত <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                        </Button>
                     </div>
                  </CardContent>
               </Card>
             ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-none w-full h-full lg:h-auto lg:max-w-lg lg:rounded-2xl p-6 border-none shadow-2xl bg-white dark:bg-slate-900 overflow-hidden flex flex-col">
           <DialogHeader className="mb-8">
              <DialogTitle className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{editingCategory ? "বিভাগ পরিবর্তন" : "নতুন বিভাগ তৈরি"}</DialogTitle>
              <DialogDescription className="text-lg font-medium text-slate-400 dark:text-slate-500">বিভাগের নতুন নাম এবং বিবরণ প্রদান করুন।</DialogDescription>
           </DialogHeader>
           <div className="space-y-6">
              <div className="space-y-2">
                 <Label className="font-bold text-slate-900 dark:text-white ml-1">নাম</Label>
                 <Input value={name} onChange={e => setName(e.target.value)} placeholder="যেমন: বিশ্ব সংবাদ" className="h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-700 focus:border-slate-200 dark:focus:border-slate-600 font-bold text-lg dark:text-white" />
              </div>
              <div className="space-y-2">
                 <Label className="font-bold text-slate-900 dark:text-white ml-1">বিবরণ</Label>
                 <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="বিভাগ সম্পর্কে লিখুন..." className="rounded-2xl bg-slate-50 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-700 focus:border-slate-200 dark:focus:border-slate-600 font-medium min-h-[120px] dark:text-white" />
              </div>
              <Button onClick={() => saveMutation.mutate({ name, slug: generateSlug(name), description })} disabled={saveMutation.isPending || !name} className="w-full h-12 rounded-2xl bg-slate-900 dark:bg-primary text-white dark:text-primary-foreground font-bold text-lg shadow-xl active:scale-95 transition-all">সংরক্ষণ করুন</Button>
           </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
