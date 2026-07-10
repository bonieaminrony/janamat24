import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Trash2, 
  Eye, 
  Calendar, 
  Newspaper, 
  Search, 
  Clock, 
  List, 
  LayoutGrid, 
  ChevronRight,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  Pencil,
  X,
  Copy
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { formatBanglaDate, toBanglaNumber } from "@/lib/bangla-utils";
import NewsEditorForm from "@/components/admin/NewsEditorForm";
import { cn } from "@/lib/utils";
interface Category {
  id: string;
  name: string;
  slug?: string;
}

interface Profile {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface News {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  image_url: string | null;
  category_id: string | null;
  author_id: string | null;
  status: 'draft' | 'published';
  is_featured: boolean;
  published_at: string | null;
  created_at: string;
  views: number;
  kicker?: string | null;
  categories?: {
    name: string;
  };
}

export default function AdminNews() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleCopyLink = (slug: string) => {
    const url = `${window.location.origin}/news/${slug}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "লিংক কপি করা হয়েছে",
      description: "খবরের লিংকটি ক্লিপবোর্ডে কপি করা হয়েছে।"
    });
  };

  useEffect(() => {
    if (searchParams.get("create") === "true") {
      setEditingNews(null);
      setDialogOpen(true);
      // Clean up the URL
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("create");
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const { data: news = [], isLoading } = useQuery<News[]>({
    queryKey: ["admin-news"],
    queryFn: async () => {
      const { data, error } = await supabase.from("news").select(`*, categories(name)`).order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as News[];
    },
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("name");
      return data || [];
    },
  });

  const { data: profiles = [] } = useQuery<Profile[]>({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, full_name, avatar_url");
      return (data || []) as Profile[];
    },
  });

  const profilesMap = useMemo(() => {
    const map = new Map<string, Profile>();
    profiles.forEach(p => map.set(p.user_id, p));
    return map;
  }, [profiles]);

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("news").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-news"] });
      setSelectedIds(new Set());
      toast({ title: "সফল", description: "নির্বাচিত সংবাদ গুলো মুছে ফেলা হয়েছে" });
    },
  });

  const openEdit = (n: News) => {
    setEditingNews(n);
    setDialogOpen(true);
  };

  const filteredNews = useMemo(() => {
    return news.filter((n) => {
      const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "all" || n.category_id === categoryFilter;
      const matchesStatus = statusFilter === "all" || n.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [news, searchQuery, categoryFilter, statusFilter]);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-1000">
      {/* Header - Editorial Style */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="w-1 h-1 rounded-full bg-primary" />
            </span>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Editorial Dashboard</p>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">সংবাদশালা</h1>
          <p className="text-slate-500 dark:text-slate-400 font-semibold text-sm leading-relaxed max-w-2xl font-bengali">প্রতিটি সংবাদের গুণমান এবং প্রকাশনা এখান থেকে নিয়ন্ত্রণ করুন।</p>
        </div>
        <Button 
          onClick={() => { setEditingNews(null); setDialogOpen(true); }} 
          className="h-11 px-6 rounded-xl bg-primary hover:opacity-90 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-95 gap-2 border-0"
        >
          <Plus className="w-4 h-4" /> সংবাদ যোগ করুন
        </Button>
      </div>

      {/* Advanced Filter Bar */}
      <Card className="border-slate-200/60 dark:border-slate-800 shadow-sm rounded-xl bg-white dark:bg-slate-900 overflow-hidden">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500 group-focus-within:text-slate-900 dark:group-focus-within:text-white transition-colors" />
              <Input
                placeholder="সংবাদ খুঁজুন..."
                className="pl-12 h-10 bg-slate-50 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-800 focus:border-slate-200 dark:focus:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white transition-all shadow-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px] h-10 bg-slate-50 dark:bg-slate-800 border-transparent rounded-lg text-sm text-slate-700 dark:text-slate-300">
                  <SelectValue placeholder="ক্যাটাগরি" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
                  <SelectItem value="all" className="font-bold">সব ক্যাটাগরি</SelectItem>
                  {categories?.map((cat) => <SelectItem key={cat.id} value={cat.id} className="font-bold">{cat.name}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px] h-10 bg-slate-50 dark:bg-slate-800 border-transparent rounded-lg text-sm text-slate-700 dark:text-slate-300">
                  <SelectValue placeholder="স্ট্যাটাস" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
                  <SelectItem value="all" className="font-bold">সব স্ট্যাটাস</SelectItem>
                  <SelectItem value="published" className="font-bold">প্রকাশিত</SelectItem>
                  <SelectItem value="draft" className="font-bold">খসড়া</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex p-1 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                <Button variant="ghost" size="icon" className={cn("h-8 w-8 rounded-md transition-all", viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 dark:text-slate-500')} onClick={() => setViewMode('grid')}><LayoutGrid className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" className={cn("h-8 w-8 rounded-md transition-all", viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 dark:text-slate-500')} onClick={() => setViewMode('list')}><List className="w-4 h-4" /></Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Floating Selection Bar - Refined Light/Dark */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-20 duration-500 w-full max-w-lg px-4">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-6">
            <div className="flex items-center gap-3">
               <div className="bg-primary text-white w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs">
                 {toBanglaNumber(selectedIds.size)}
               </div>
               <p className="font-black text-[11px] uppercase tracking-widest text-slate-500 dark:text-slate-400">সংবাদ নির্বাচিত</p>
            </div>
            <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" className="text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-[11px] uppercase tracking-widest px-4" onClick={() => setSelectedIds(new Set())}>বাতিল</Button>
                <Button size="sm" className="bg-rose-500 hover:bg-rose-600 text-white font-black text-[11px] uppercase tracking-widest px-6 rounded-lg shadow-lg shadow-rose-500/20" onClick={() => { if(confirm("মুছে ফেলতে চান?")) deleteMutation.mutate(Array.from(selectedIds)) }}>মুছে ফেলুন</Button>
            </div>
          </div>
        </div>
      )}

      {/* News View */}
      {isLoading ? (
        <div className="grid gap-6">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 animate-pulse" />)}
        </div>
      ) : filteredNews.length === 0 ? (
        <div className="text-center py-40 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
           <Newspaper className="w-20 h-20 text-slate-100 dark:text-slate-800 mx-auto mb-6" />
           <p className="text-xl font-bold text-slate-300 dark:text-slate-700 uppercase tracking-widest">No News Found</p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredNews.map((n) => {
               const author = profilesMap.get(n.author_id || "");
               return (
                <div key={n.id} className={cn("group flex flex-col lg:flex-row lg:items-center gap-4 p-5 transition-all hover:bg-slate-50/50 dark:hover:bg-slate-800/50", selectedIds.has(n.id) && "bg-slate-50 dark:bg-slate-800")}>
                  <div className="flex items-center gap-6 flex-1 min-w-0">
                    <Checkbox checked={selectedIds.has(n.id)} onCheckedChange={() => toggleSelect(n.id)} className="w-6 h-6 rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800" />
                    <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 overflow-hidden flex-shrink-0 shadow-sm">
                       {n.image_url ? <img src={n.image_url} alt="" className="w-full h-full object-cover" /> : <Newspaper className="w-6 h-6 m-auto text-slate-200 dark:text-slate-700" />}
                    </div>
                    <div className="flex-1 min-w-0 space-y-3">
                       <div className="flex items-center gap-3">
                          <Badge variant="outline" className="rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-[10px] border-none px-3 py-1">{n.categories?.name || "বিভাগহীন"}</Badge>
                          {n.status === 'published' ? <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 uppercase tracking-wider"><CheckCircle2 className="w-3 h-3" /> Live</span> : <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500 uppercase tracking-wider"><Clock className="w-3 h-3" /> Draft</span>}
                       </div>
                       <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight leading-snug group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors line-clamp-2">{n.title}</h3>
                       <div className="flex flex-wrap items-center gap-6">
                          <div className="flex items-center gap-2">
                             <Avatar className="w-8 h-8 shadow-sm">
                                <AvatarImage src={author?.avatar_url || ""} />
                                <AvatarFallback className="bg-slate-900 dark:bg-slate-800 text-white dark:text-slate-300 text-[10px] font-bold">{author?.full_name?.charAt(0) || "U"}</AvatarFallback>
                             </Avatar>
                             <span className="text-sm font-bold text-slate-400 dark:text-slate-500 tracking-tight">{author?.full_name || "Unknown Author"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-300 dark:text-slate-700 text-xs font-bold uppercase tracking-widest">
                             <Calendar className="w-4 h-4" /> {formatBanglaDate(n.created_at)}
                          </div>
                       </div>
                    </div>
                  </div>
                    <div className="flex items-center gap-2 lg:pl-10">
                     <Button size="icon" variant="ghost" className="h-9 w-9 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm" onClick={() => openEdit(n)}><Pencil className="w-4 h-4 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white" /></Button>
                     <Button size="icon" variant="ghost" className="h-9 w-9 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm" onClick={() => deleteMutation.mutate([n.id])}><Trash2 className="w-4 h-4 text-slate-400 dark:text-slate-500 hover:text-rose-500" /></Button>
                     <Button asChild size="icon" variant="ghost" className="h-9 w-9 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm"><a href={`/news/${n.slug}`} target="_blank"><Eye className="w-4 h-4 text-slate-400 dark:text-slate-500 hover:text-blue-500" /></a></Button>
                     <Button size="icon" variant="ghost" className="h-9 w-9 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm" onClick={() => handleCopyLink(n.slug)} title="লিংক কপি করুন"><Copy className="w-4 h-4 text-slate-400 dark:text-slate-500 hover:text-emerald-500" /></Button>
                  </div>
                </div>
               );
            })}
          </div>
        </div>
       ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
           {filteredNews.map((n) => (
             <Card key={n.id} className="group border-slate-200/60 dark:border-slate-800 shadow-sm rounded-xl bg-white dark:bg-slate-900 overflow-hidden hover:shadow-md transition-all duration-300">
                <div className="relative h-56 overflow-hidden">
                   {n.image_url ? <img src={n.image_url} alt="" className="w-full h-full object-cover grayscale-[0.2] group-hover:scale-110 transition-transform duration-700" /> : <div className="w-full h-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center"><Newspaper className="w-12 h-12 text-slate-200 dark:text-slate-700" /></div>}
                   <div className="absolute top-4 left-4 flex gap-2">
                      <Checkbox checked={selectedIds.has(n.id)} onCheckedChange={() => toggleSelect(n.id)} className="w-5 h-5 rounded bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-0 shadow-sm" />
                   </div>
                   <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                      <Badge className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md text-slate-900 dark:text-white border-none font-medium rounded px-2">{n.categories?.name || "বিভাগ"}</Badge>
                      <Badge className={cn("border-none font-medium rounded px-2", n.status === 'published' ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-white')}>{n.status === 'published' ? 'Live' : 'Draft'}</Badge>
                   </div>
                </div>
                <CardContent className="p-5 space-y-4">
                   <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight leading-snug line-clamp-2 min-h-[3rem] group-hover:text-slate-700 dark:group-hover:text-slate-300">{n.title}</h3>
                   <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800">
                       <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8 shadow-sm">
                             <AvatarImage src={profilesMap.get(n.author_id || "")?.avatar_url || ""} />
                             <AvatarFallback className="bg-slate-900 dark:bg-slate-800 text-white dark:text-slate-300 text-[10px] font-bold">U</AvatarFallback>
                          </Avatar>
                          <p className="text-xs font-bold text-slate-400 dark:text-slate-500">{profilesMap.get(n.author_id || "")?.full_name || "Author"}</p>
                       </div>
                       <div className="flex gap-1.5">
                          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 shadow-none hover:shadow-sm" onClick={() => openEdit(n)}><Pencil className="w-4 h-4 text-slate-500 dark:text-slate-400" /></Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 shadow-none hover:shadow-sm text-rose-500" onClick={() => deleteMutation.mutate([n.id])}><Trash2 className="w-4 h-4" /></Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 shadow-none hover:shadow-sm" onClick={() => handleCopyLink(n.slug)} title="লিংক কপি করুন"><Copy className="w-4 h-4 text-slate-500 dark:text-slate-400 hover:text-emerald-500" /></Button>
                       </div>
                   </div>
                </CardContent>
             </Card>
           ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[1500px] w-full lg:w-[98vw] h-full lg:h-[96vh] p-0 overflow-hidden lg:rounded-3xl border-slate-200 shadow-2xl bg-[#f8f9fb]">
            <DialogTitle className="sr-only">সংবাদ সম্পাদনা</DialogTitle>
            <NewsEditorForm 
              news={editingNews} 
              onClose={() => { setDialogOpen(false); setEditingNews(null); }} 
            />
        </DialogContent>
      </Dialog>
    </div>
  );
}
