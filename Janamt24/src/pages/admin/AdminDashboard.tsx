import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Newspaper, 
  FolderOpen, 
  Eye, 
  FileText, 
  Megaphone, 
  TrendingUp, 
  Clock,
  Users,
  Activity,
  PenLine,
  ArrowRight,
  Mail
} from "lucide-react";
import { toBanglaNumber, formatBanglaDate, formatBanglaDateTime, formatBanglaRelativeTime } from "@/lib/bangla-utils";
import { Link } from "react-router-dom";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useMemo, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export default function AdminDashboard() {
  const [greeting, setGreeting] = useState("");
  const [currentUser, setCurrentUser] = useState<{ full_name: string; avatar_url: string | null } | null>(null);
  const [liveCount, setLiveCount] = useState<number>(0);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("full_name, avatar_url").eq("user_id", user.id).maybeSingle();
        if (profile) setCurrentUser(profile);
      }
    };
    fetchUser();
    
    // Greeting logic
    const hour = new Date().getHours();
    if (hour < 5) setGreeting("শুভ নিশীথ");
    else if (hour < 12) setGreeting("সুপ্রভাত");
    else if (hour < 17) setGreeting("শুভ অপরাহ্ন");
    else if (hour < 20) setGreeting("শুভ সন্ধ্যা");
    else setGreeting("শুভ রাত্রি");

    // Real-time Traffic/Presence Tracking
    let channel: any = null;
    try {
      channel = supabase.channel('online-users', {
        config: {
          presence: {
            key: 'admin-dashboard', // Unique key for the dashboard observer if needed
          },
        },
      });
      
      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const count = Object.keys(state).length;
          console.log("Presence sync. Current state:", state);
          setLiveCount(count);
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }: any) => {
          console.log('Joined:', key, newPresences);
          const state = channel.presenceState();
          setLiveCount(Object.keys(state).length);
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }: any) => {
          console.log('Left:', key, leftPresences);
          const state = channel.presenceState();
          setLiveCount(Object.keys(state).length);
        })
        .subscribe(async (status: string) => {
          if (status === 'SUBSCRIBED') {
            console.log('Admin subscribed to online-users');
          }
        });
    } catch (err) {
      console.error('Failed to setup presence tracking:', err);
    }

    return () => {
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch (e) {
          console.error("Error removing channel", e);
        }
      }
    };
  }, []);

  const { data: newsStats } = useQuery({
    queryKey: ["admin-news-stats"],
    queryFn: async () => {
      const { count: publishedCount } = await supabase.from("news").select("*", { count: "exact", head: true }).eq("status", "published");
      const { count: draftsCount } = await supabase.from("news").select("*", { count: "exact", head: true }).eq("status", "draft");
      const { data: viewsData } = await supabase.from("news").select("views").not("views", "is", null);
      const totalViews = viewsData?.reduce((sum, item) => sum + (item.views || 0), 0) || 0;
      return { published: publishedCount || 0, drafts: draftsCount || 0, totalViews };
    },
  });

  const { data: categoryCount = 0 } = useQuery({
    queryKey: ["admin-category-count"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id");
      return data?.length || 0;
    },
  });

  const { data: adStats } = useQuery({
    queryKey: ["admin-ad-stats"],
    queryFn: async () => {
      const { data: partners } = await supabase.from("ad_partners").select("id, is_active");
      const { data: banners } = await supabase.from("ad_banners").select("id, is_active");
      return { activePartners: partners?.filter(p => p.is_active).length || 0, activeBanners: banners?.filter(b => b.is_active).length || 0 };
    },
  });

  const { data: reporterCount = 0 } = useQuery({
    queryKey: ["admin-reporter-count"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id");
      return data?.length || 0;
    },
  });

  const { data: subscriberCount = 0 } = useQuery({
    queryKey: ["admin-subscriber-count"],
    queryFn: async () => {
      const { count } = await supabase.from("newsletter_subscribers").select("*", { count: 'exact', head: true });
      return count || 0;
    },
  });

  const { data: recentNews = [] } = useQuery({
    queryKey: ["admin-recent-news"],
    queryFn: async () => {
      const { data } = await supabase.from("news").select("id, title, created_at, image_url, views, categories(name)").order("created_at", { ascending: false }).limit(5);
      return data || [];
    },
  });

  const { data: topNews = [] } = useQuery({
    queryKey: ["admin-top-news"],
    queryFn: async () => {
      const { data } = await supabase.from("news").select("id, title, views, image_url, categories(name)").order("views", { ascending: false }).limit(5);
      return data || [];
    },
  });

  const { data: activityChartData = [] } = useQuery({
    queryKey: ["admin-activity-chart"],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { data } = await supabase.from("reporter_activity").select("created_at, activity_type").gte("created_at", sevenDaysAgo.toISOString()).order("created_at", { ascending: true });
      return data || [];
    },
  });

  const chartData = useMemo(() => {
    const days: { [key: string]: { date: string; activities: number } } = {};
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today); date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      const dayNames = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি'];
      days[key] = { date: dayNames[date.getDay()], activities: 0 };
    }
    activityChartData.forEach(a => {
      if (!a.created_at) return;
      const key = a.created_at.split('T')[0];
      if (days[key]) days[key].activities++;
    });
    return Object.values(days);
  }, [activityChartData]);

  const statusData = useMemo(() => [
    { name: 'প্রকাশিত', value: newsStats?.published || 0, color: '#10b981' },
    { name: 'খসড়া', value: newsStats?.drafts || 0, color: '#f59e0b' },
  ], [newsStats]);

  const quickStats = [
    { title: "লাইভ ভিজিটর", value: liveCount, icon: Activity, color: "#10b981", bg: "bg-emerald-50", trend: "বর্তমান সক্রিয়", isLive: true },
    { title: "প্রকাশিত সংবাদ", value: newsStats?.published || 0, icon: Newspaper, color: "#3b82f6", bg: "bg-blue-50", trend: "মোট সংবাদ" },
    { title: "মোট ভিউ", value: newsStats?.totalViews || 0, icon: Eye, color: "#8b5cf6", bg: "bg-purple-50", trend: "সরাসরি ট্রাফিক" },
    { title: "খসড়া সংবাদ", value: newsStats?.drafts || 0, icon: FileText, color: "#f59e0b", bg: "bg-amber-50", trend: "পেন্ডিং কন্টেন্ট" },
  ];

  const activityHub = useMemo(() => [
    { label: "নিউজলেটার", value: subscriberCount, desc: "মোট সাবস্ক্রাইবার", icon: Mail, bg: "bg-blue-50", border: "border-blue-100", color: "#3b82f6" },
    { label: "বিজ্ঞাপন ব্যানার", value: adStats?.activeBanners || 0, desc: "অ্যাক্টিভ ক্যাম্পেইন", icon: Megaphone, bg: "bg-indigo-50", border: "border-indigo-100", color: "#6366f1" },
    { label: "প্রতিবেদক প্যানেল", value: reporterCount, desc: "সক্রিয় টীম মেম্বার", icon: Users, bg: "bg-emerald-50", border: "border-emerald-100", color: "#10b981" },
    { label: "নিউজ ক্যাটাগরি", value: categoryCount, desc: "সিস্টেম বিভাগসমূহ", icon: FolderOpen, bg: "bg-amber-50", border: "border-amber-100", color: "#f59e0b" }
  ], [adStats, reporterCount, categoryCount, subscriberCount]);

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700 max-w-7xl mx-auto mt-6 px-4 lg:px-12">
      {/* High-End Command Center Header */}
      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 lg:p-8 shadow-sm overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-50/10 dark:from-indigo-900/10 to-transparent" />
        
        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-12">
           <div className="space-y-8">
              <div className="flex flex-wrap items-center gap-4">
                <span className="px-3 py-1.5 bg-slate-900 dark:bg-primary text-white dark:text-primary-foreground rounded-lg text-[10px] font-bold uppercase tracking-wider">সিস্টেম কমান্ড</span>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm transition-all hover:bg-white dark:hover:bg-slate-800">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                   <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">লাইভ ইঞ্জিন সক্রিয়</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-600 dark:from-white dark:via-slate-200 dark:to-indigo-400">
                   {greeting}, {currentUser?.full_name?.trim() ? (currentUser.full_name.split(' ')[0]) : "অ্যাডমিন"}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-bold tracking-wide uppercase flex items-center gap-2">
                  <span className="w-8 h-[2px] bg-indigo-500/20" />
                  সিস্টেম ওভারভিউ ও রিয়েল-টাইম এনালিটিক্স
                </p>
              </div>
           </div>
           
           <div className="flex items-center gap-4">
              <Button asChild className="h-12 px-8 rounded-xl bg-primary hover:opacity-90 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-95 border-0">
                <Link to="/admin/news?create=true" className="flex items-center gap-2.5">
                  <PenLine className="w-4 h-4" />
                  নতুন সংবাদ
                </Link>
              </Button>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {quickStats.map((stat, i) => (
          <Card key={stat.title} 
            className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-500"
          >
            {/* Glossy Metric Accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r" style={{ backgroundImage: `linear-gradient(to right, ${stat.color}, transparent)` }} />
            
            <CardContent className="p-6 relative">
               <div className="flex items-center justify-between mb-6">
                   <div className={cn("p-3 rounded-xl shadow-inner", stat.bg, "dark:bg-slate-800/50")}>
                    <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                  </div>
                  <div className="px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.trend}</p>
                  </div>
               </div>
                <div className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
                      {toBanglaNumber(stat.value)}
                    </p>
                    {stat.isLive && liveCount > 0 && (
                      <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                    )}
                  </div>
                  <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest opacity-80">{stat.title}</p>
               </div>
               
               {/* Background Decorative Element */}
               <stat.icon className="absolute -bottom-4 -right-4 w-24 h-24 text-slate-50 opacity-0 group-hover:opacity-100 group-hover:rotate-12 transition-all duration-700 pointer-events-none" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-stretch">
        <Card className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden h-full">
          <CardHeader className="p-8 pb-0 flex flex-row items-center justify-between">
             <div className="space-y-1">
                <CardTitle className="text-xl font-black text-slate-900 dark:text-white tracking-tight">সিস্টেম কার্যক্রম</CardTitle>
                <CardDescription className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest">গত ৭ দিনের আপডেট রেকর্ডস</CardDescription>
             </div>
             <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-900 dark:bg-white" />
                <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-800" />
             </div>
          </CardHeader>
          <CardContent className="p-6 pt-6">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAct" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f172a" stopOpacity={0.05}/>
                      <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} dx={-5} />
                  <Tooltip 
                    contentStyle={{
                      borderRadius: '8px', 
                      border: '1px solid hsl(var(--border))', 
                      background: 'hsl(var(--background))', 
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      color: 'hsl(var(--foreground))'
                    }} 
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Area type="monotone" dataKey="activities" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#colorAct)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden h-full">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-lg font-black text-slate-900 dark:text-white tracking-tight">পাবলিশ সামারি</CardTitle>
            <CardDescription className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest">কন্টেন্ট ডিস্ট্রিবিউশন</CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0 flex flex-col items-center">
            <div className="h-[220px] w-full relative mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={70} outerRadius={95} paddingAngle={4} dataKey="value" stroke="none">
                    {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} className="hover:opacity-80 transition-opacity" />)}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      borderRadius: '12px', 
                      border: '1px solid hsl(var(--border))', 
                      background: 'hsl(var(--background))', 
                      boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                      color: 'hsl(var(--foreground))'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <p className="text-4xl font-black text-slate-900 dark:text-white leading-none">{toBanglaNumber((newsStats?.published || 0) + (newsStats?.drafts || 0))}</p>
                 <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-3">টোটাল</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full">
                {statusData.map(item => (
                  <div key={item.name} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col gap-2 transition-all hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm">
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full" style={{backgroundColor: item.color}} />
                       <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{item.name}</span>
                    </div>
                     <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">{toBanglaNumber(item.value)}</p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-stretch">
        {/* Recent News Card */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden h-full flex flex-col">
          <CardHeader className="p-6 pb-4 border-b border-slate-50 dark:border-slate-800">
             <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-500" /> সাম্প্রতিক সংবাদ
                </CardTitle>
                <Button asChild variant="ghost" className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 font-medium px-4 h-9 text-xs">
                  <Link to="/admin/news">সব দেখুন <ArrowRight className="w-4 h-4 ml-2" /></Link>
                </Button>
             </div>
          </CardHeader>
          <CardContent className="p-0">
              <div className="divide-y divide-slate-50 dark:divide-slate-800">
                {recentNews.length === 0 ? <div className="p-24 text-center text-slate-300 dark:text-slate-700 font-black uppercase tracking-widest">কোন সংবাদ পাওয়া যায়নি</div> : 
                  recentNews.map(news => (
                  <Link key={news.id} to="/admin/news" className="flex items-center gap-4 p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-50 dark:border-slate-800 last:border-0 group">
                    <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200/50 overflow-hidden flex-shrink-0 shadow-sm relative">
                       {news.image_url ? <img src={news.image_url} alt="" className="w-full h-full object-cover" /> : <Newspaper className="w-5 h-5 m-auto text-slate-300" />}
                       <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-4">
                          <Badge variant="outline" className="text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 font-medium text-[10px] rounded px-2 py-0.5">
                            {Array.isArray(news.categories) ? news.categories[0]?.name : (news.categories as any)?.name || "বিভাগহীন"}
                          </Badge>
                          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 flex items-center gap-1.5 uppercase tracking-wider"><Clock className="w-3.5 h-3.5" /> {formatBanglaRelativeTime(news.created_at)}</span>
                       </div>
                       <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate tracking-tight group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">{news.title}</h4>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                       <span className="text-[10px] font-black text-slate-900 dark:text-white">{toBanglaNumber(news.views || 0)}</span>
                       <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">ভিউ</span>
                    </div>
                  </Link>
                ))}
              </div>
          </CardContent>
        </Card>

        {/* Top Trending Card */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden h-full flex flex-col">
          <CardHeader className="p-6 pb-4 border-b border-slate-50 dark:border-slate-800">
             <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-500" /> সর্বোচ্চ পঠিত
                </CardTitle>
                <div className="px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 rounded-full border border-emerald-100 dark:border-emerald-500/20">
                   <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Trending Now</p>
                </div>
             </div>
          </CardHeader>
          <CardContent className="p-0">
              <div className="divide-y divide-slate-50 dark:divide-slate-800">
                {topNews.length === 0 ? <div className="p-24 text-center text-slate-300 dark:text-slate-700 font-black uppercase tracking-widest">কোন তথ্য নেই</div> : 
                  topNews.map((news, i) => (
                  <Link key={news.id} to="/admin/news" className="flex items-center gap-4 p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-50 dark:border-slate-800 last:border-0 group">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-black text-xs text-slate-400 group-hover:text-emerald-500 group-hover:border-emerald-500/50 transition-all">
                       {toBanglaNumber(i + 1)}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                       <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate tracking-tight group-hover:text-emerald-500 transition-colors uppercase">{news.title}</h4>
                       <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{Array.isArray(news.categories) ? news.categories[0]?.name : (news.categories as any)?.name || "বিভাগহীন"}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{toBanglaNumber(news.views || 0)} ভিউ</span>
                       </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                  </Link>
                ))}
              </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Hub */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden">
           <CardHeader className="p-6 lg:p-8 pb-4">
              <CardTitle className="text-lg font-black text-slate-900 dark:text-white tracking-tight">অ্যাক্টিভিটি হাব</CardTitle>
           </CardHeader>
           <CardContent className="p-6 lg:p-8 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                 {activityHub.map((hub, i) => (
                  <div key={i} className="group flex items-center justify-between p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-pointer">
                     <div className="flex items-center gap-4">
                        <div className={cn("w-12 h-12 flex items-center justify-center rounded-xl border border-transparent shadow-sm", hub.bg, hub.border, "dark:bg-slate-800/50 dark:border-slate-700")}>
                           <hub.icon className="w-5 h-5" />
                        </div>
                         <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight leading-none mb-1">{hub.label}</p>
                            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{hub.desc}</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-xl font-bold text-slate-900 dark:text-white">{toBanglaNumber(hub.value)}</p>
                        <div className="w-8 h-1 bg-slate-100 dark:bg-slate-800 rounded-full ml-auto mt-1 group-hover:w-full group-hover:bg-slate-900 dark:group-hover:bg-primary transition-all duration-700" />
                     </div>
                  </div>
                 ))}
              </div>
           </CardContent>
        </Card>
    </div>
  );
}
