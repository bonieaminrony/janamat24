import { useEffect, useState } from "react";
import { useNavigate, Outlet, Link, useLocation, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LayoutDashboard, Newspaper, FolderOpen, LogOut, Menu, X, Megaphone, Users, Settings, Shield, ExternalLink, UserCog, Mail, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";
import { Sun, Moon } from "lucide-react";
import React from "react";

class AdminErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV;
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-4 w-full h-full z-50 absolute inset-0">
          <div className="bg-white p-8 rounded-xl shadow-2xl max-w-2xl w-full border border-red-200 text-center">
            <h2 className="text-2xl font-black text-red-600 mb-4">একটি সমস্যা হয়েছে</h2>
            <p className="text-slate-700 mb-6 font-medium">অ্যাডমিন প্যানেল লোড করতে সমস্যা হয়েছে। পেজটি রিলোড করুন।</p>
            {isDev && (
              <div className="bg-slate-900 p-4 rounded-lg text-sm overflow-auto text-red-400 whitespace-pre-wrap text-left font-mono max-h-64 shadow-inner">
                {this.state.error?.toString()}
                {'\n'}
                {this.state.error?.stack}
              </div>
            )}
            <button 
              onClick={() => window.location.reload()} 
              className="mt-6 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold transition-all shadow-lg hover:shadow-xl active:scale-95"
            >
              রিলোড করুন
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function AdminLayout() {
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hasRole, setHasRole] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  const { data: userProfile } = useQuery({
    queryKey: ["user-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase.from("profiles").select("full_name, avatar_url").eq("user_id", user.id).maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    // Set up auth state listener
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkUserRole(session.user.id);
      } else {
        setHasRole(false);
        setLoading(false);
      }
    });

    // Check for existing session
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkUserRole(session.user.id);
      } else {
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);
  const checkUserRole = async (userId: string) => {
    try {
      // Use server-side RPC function to verify role
      // This is more secure than client-side table queries
      const {
        data,
        error
      } = await supabase.rpc('check_user_has_admin_role', {
        _user_id: userId
      });
      if (error) {
        console.error('Role check error:', error);
        setHasRole(false);
      } else {
        setHasRole(data === true);
      }
    } catch (err) {
      console.error('Role check exception:', err);
      setHasRole(false);
    } finally {
      setLoading(false);
    }
  };
  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "লগআউট",
      description: "সফলভাবে লগআউট হয়েছে"
    });
    navigate("/auth");
  };
  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <img src={logo} alt="জনমত ২৪" className="h-12 w-auto mx-auto mb-4 rounded animate-pulse" />
          <p className="text-subtext">লোড হচ্ছে...</p>
        </div>
      </div>;
  }
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  const navItems = [{
    path: "/admin",
    icon: LayoutDashboard,
    label: "ড্যাশবোর্ড",
    exact: true
  }, {
    path: "/admin/news",
    icon: Newspaper,
    label: "সংবাদ"
  }, {
    path: "/admin/card-generator",
    icon: Image,
    label: "কার্ড জেনারেটর"
  }, {
    path: "/admin/categories",
    icon: FolderOpen,
    label: "বিভাগ"
  }, {
    path: "/admin/ads",
    icon: Megaphone,
    label: "বিজ্ঞাপন"
  }, {
    path: "/admin/reporters",
    icon: Users,
    label: "প্রতিবেদক"
  }, {
    path: "/admin/subscribers",
    icon: Mail,
    label: "নিউজলেটার সাবস্ক্রাইবার"
  }, {
    path: "/admin/roles",
    icon: Shield,
    label: "রোল ব্যবস্থাপনা"
  }, {
    path: "/admin/settings",
    icon: Settings,
    label: "সিস্টেম সেটিংস"
  }, {
    path: "/admin/profile",
    icon: UserCog,
    label: "প্রোফাইল সেটিংস"
  }];

  return (
    <AdminErrorBoundary>
    <div className="h-screen bg-[#F5F5F7] dark:bg-slate-950 flex overflow-hidden font-sans selection:bg-primary/30 selection:text-slate-900">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/5 backdrop-blur-md z-40 lg:hidden animate-in fade-in duration-500" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* Premium Light/Dark Newsroom Sidebar */}
      <aside className={cn(`
        fixed lg:relative inset-y-0 left-0 z-50 w-64 bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800/50
        transform transition-all duration-300 flex flex-col
        ${sidebarOpen ? 'translate-x-0 shadow-2xl shadow-black/10' : '-translate-x-full lg:translate-x-0'}
      `)}>
        {/* Brand Identity Section */}
        <div className="h-20 flex items-center px-4 relative mb-4">
          <div className="absolute inset-x-2 top-4 bottom-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm" />
          <Link to="/admin" className="flex items-center gap-3 relative z-10 w-full px-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-slate-800 flex items-center justify-center shadow-md">
              <img alt="Logo" className="h-6 w-auto object-contain" src={logo} />
            </div>
            <div>
              <p className="font-black text-base text-slate-900 dark:text-white tracking-tight leading-none">জনমত <span className="text-primary">২৪</span></p>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                নিউজ রুম কন্ট্রোল
              </p>
            </div>
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden ml-auto text-slate-400 hover:bg-slate-50"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation - Premium Light */}
        <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1 custom-scrollbar">
          {navItems.map(item => {
            const active = item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path);
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-bold transition-all group relative overflow-hidden",
                  active 
                    ? "text-primary bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm" 
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-900/50"
                )} 
                onClick={() => setSidebarOpen(false)}
              >
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-primary rounded-r-full" />
                )}
                <item.icon className={cn("w-4.5 h-4.5 transition-transform group-hover:scale-110", active ? "text-primary" : "text-slate-400 group-hover:text-slate-900")} />
                <span className="relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Quick Access */}
        <div className="p-4 mt-auto space-y-3 bg-slate-100/50 dark:bg-slate-900/30 border-t border-slate-200/50 dark:border-slate-800/30">
           <a 
             href="/" 
             target="_blank" 
             className="flex items-center justify-center gap-2 w-full h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm group"
           >
              <ExternalLink className="w-3.5 h-3.5 transition-transform group-hover:rotate-12" />
              মেইন সাইট
           </a>
 
           <Link 
             to="/admin/profile" 
             className="flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm"
             onClick={() => setSidebarOpen(false)}
           >
              <Avatar className="w-9 h-9 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm">
                <AvatarImage src={userProfile?.avatar_url || undefined} className="object-cover" />
                <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-black text-xs uppercase">
                  {userProfile?.full_name?.charAt(0) || user.email?.[0]?.toUpperCase() || "A"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-black text-slate-900 dark:text-white truncate leading-none mb-1">
                  {userProfile?.full_name || "অ্যাডমিন"}
                </p>
                <div className="flex items-center gap-1.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   <p className="text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest">Active</p>
                </div>
              </div>
           </Link>
           
           <Button 
            variant="ghost" 
            className="w-full h-9 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all font-black text-[9px] uppercase tracking-[0.15em] gap-2.5" 
            onClick={handleLogout}
          >
            <LogOut className="w-3.5 h-3.5" />
            লগআউট সেশন
          </Button>
        </div>
      </aside>

      {/* Content Area with Refined Background */}
      <div className="flex-1 flex flex-col min-w-0 relative h-full bg-[#FAF6F0] dark:bg-slate-950">
        {/* Transparent Glassmorphic Header */}
        <header className="h-16 flex items-center justify-between px-4 lg:px-12 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-b border-slate-200/50 dark:border-slate-800/50 sticky top-0 z-40">
          <div className="flex items-center gap-6">
            <Button 
              variant="outline" 
              size="icon" 
              className="lg:hidden h-10 w-10 rounded-xl border-slate-200 dark:border-slate-800 shadow-sm transition-transform active:scale-90 bg-white dark:bg-slate-900" 
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </Button>
            
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight hidden lg:block">
              {navItems.find(item => location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path)))?.label || "ড্যাশবোর্ড"}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="icon" 
              className="h-10 w-10 rounded-xl border-slate-200 dark:border-slate-800 shadow-sm" 
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5 text-slate-600" />}
            </Button>

            <div className="hidden sm:flex items-center px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-full animate-in fade-in zoom-in duration-1000">
               <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
               <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">লাইভ ট্রাফিক ইঞ্জিন</span>
            </div>
            
            <Button asChild variant="outline" className="h-10 rounded-full px-6 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm shadow-sm transition-all active:scale-95 bg-white dark:bg-slate-900">
              <Link to="/" target="_blank">
                সাইট দেখুন
                <ExternalLink className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </header>

        {/* Clean Content Area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-[1400px] mx-auto px-4 py-6 lg:px-12 lg:py-10 min-h-full">
            {!hasRole ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-12 text-center max-w-lg mx-auto mt-20 shadow-xl shadow-slate-200/20 dark:shadow-black/20 animate-in zoom-in-95 duration-700">
                <div className="w-20 h-20 bg-amber-50 dark:bg-amber-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-amber-100 dark:border-amber-900/50">
                  <Shield className="w-10 h-10 text-amber-500" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">অ্যাক্সেস প্রয়োজন</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-10 leading-relaxed text-lg">
                  আপনার অ্যাকাউন্টে এখনও প্রশাসনিক ক্ষমতা প্রদান করা হয়নি।
                </p>
                <Button onClick={handleLogout} className="w-full h-14 rounded-2xl bg-slate-900 dark:bg-primary hover:bg-slate-800 dark:hover:opacity-90 text-white dark:text-primary-foreground font-bold text-lg transition-all shadow-lg active:scale-95 border-0">
                  লগআউট করুন
                </Button>
              </div>
            ) : (
              <div className="animate-in fade-in duration-700 h-full">
                <Outlet />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
    </AdminErrorBoundary>
  );
}