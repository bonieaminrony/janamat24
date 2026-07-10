import { Link, useLocation } from "react-router-dom";
import { Search, ChevronDown, Sun, Moon, Clock, Bookmark, User as UserIcon, LogOut, Shield, Menu, Twitter, Youtube, Instagram, Flame, BookOpen, Home, ChevronRight, LayoutGrid } from "lucide-react";
import { MobileCategoryTabs } from "./MobileCategoryTabs";
import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { formatBanglaDateFull, formatBanglaTime, toBanglaNumber } from "@/lib/bangla-utils";
import { Button } from "@/components/ui/button";
import { SearchDialog } from "@/components/search/SearchDialog";
import { UniversalAdBanner } from "@/components/ads/UniversalAdBanner";
import { LanguageTranslator } from "@/components/widgets/LanguageTranslator";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface HeaderProps {
  categories?: Category[];
}

export function Header({ categories = [] }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [scrollProgress, setScrollProgress] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [fullName, setFullName] = useState<string | null>(null);

  type HeaderMode = 'relative' | 'fixed_hidden' | 'fixed_visible';
  const [headerMode, setHeaderMode] = useState<HeaderMode>('relative');
  
  const [headerHeights, setHeaderHeights] = useState({ row1: 88, row23: 100 });
  const row1Ref = useRef<HTMLElement>(null);
  const row23Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateHeights = () => {
      if (row1Ref.current && row23Ref.current) {
        setHeaderHeights({
          row1: row1Ref.current.getBoundingClientRect().height,
          row23: row23Ref.current.getBoundingClientRect().height
        });
      }
    };
    updateHeights();
    window.addEventListener('resize', updateHeights);
    return () => window.removeEventListener('resize', updateHeights);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;
    let modeLockTime = 0;

    const updateScroll = () => {
      const currentScrollY = window.scrollY;
      const windowHeight = document.documentElement.scrollHeight - window.innerHeight;
      const now = Date.now();
      
      setScrolled(currentScrollY > 20);
      if (windowHeight > 0) {
        setScrollProgress((currentScrollY / windowHeight) * 100);
      }
      
      if (currentScrollY <= 10) {
        setHeaderMode('relative');
      } else {
        const diff = currentScrollY - lastScrollY;
        
        setHeaderMode((currentMode) => {
          if (now - modeLockTime < 300) {
            return currentMode; // Lock state for 300ms after a change to prevent bounce
          }
          
          if (currentMode === 'relative') {
            if (currentScrollY > 250 && diff > 15) {
              modeLockTime = now;
              return 'fixed_hidden';
            }
            return currentMode;
          } else {
             // Require more deliberate scroll to show/hide
            if (diff > 15 && currentMode !== 'fixed_hidden') {
              modeLockTime = now;
              return 'fixed_hidden';
            } else if (diff < -25 && currentMode !== 'fixed_visible') {
              modeLockTime = now;
              return 'fixed_visible';
            }
            return currentMode;
          }
        });
      }
      
      lastScrollY = currentScrollY;
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScroll);
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const updateCount = () => {
      try {
        const saved = JSON.parse(localStorage.getItem('janamt_bookmarks') || '[]');
        setBookmarkCount(Array.isArray(saved) ? saved.length : 0);
      } catch (e) { setBookmarkCount(0); }
    };
    updateCount();
    window.addEventListener('bookmarks-updated', updateCount);
    window.addEventListener('storage', updateCount);
    return () => {
      window.removeEventListener('bookmarks-updated', updateCount);
      window.removeEventListener('storage', updateCount);
    };
  }, []);

  useEffect(() => {
    const checkAdmin = async (userId: string) => {
      // Temporary bypass for testing
      setIsAdmin(true);
    };

    const fetchProfile = async (userId: string) => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", userId)
          .maybeSingle();
        if (data && data.full_name) {
          setFullName(data.full_name);
        } else {
          setFullName(null);
        }
      } catch (err) {
        console.error("Error fetching profile name:", err);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdmin(session.user.id);
        fetchProfile(session.user.id);
      } else {
        setFullName(null);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdmin(session.user.id);
        fetchProfile(session.user.id);
      } else {
        setIsAdmin(false);
        setFullName(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const isActive = (path: string) => location.pathname === path;
  const isCategoryActive = (slug: string) => location.pathname === `/category/${slug}`;

  return (
    <>
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
      
      <header 
        ref={row1Ref}
        className={cn(
          "sticky top-0 z-50 w-full bg-white dark:bg-slate-950 transition-shadow duration-300", 
          scrolled && "shadow-md shadow-black/5"
        )}
      >

        {/* Row 1: Logo & Ad Banner */}
        <div className="container flex flex-col lg:flex-row items-center justify-between py-4 md:py-6 gap-4 lg:gap-0">
          <div className="w-full flex items-center justify-between lg:w-auto">
            {/* Left: Mobile Menu & Logo */}
            <div className="flex items-center gap-3 md:gap-4">
              <button 
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden text-slate-700 dark:text-slate-300 hover:text-[#e6222b] transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetContent side="left" className="w-[85vw] sm:max-w-sm p-0 flex flex-col border-r-0 z-[100]">
                  <SheetHeader className="p-6 border-b border-slate-100 dark:border-slate-800 text-left">
                    <SheetTitle className="text-2xl font-black text-slate-900 dark:text-white">মেনু</SheetTitle>
                  </SheetHeader>
                  <div className="flex-1 overflow-y-auto py-2">
                    <Link
                      to="/"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between px-6 py-4 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-3"><Home className="w-5 h-5 text-slate-400" /> হোম</span>
                      <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                    </Link>
                    <Link
                      to="/quran"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between px-6 py-4 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-3"><BookOpen className="w-5 h-5 text-slate-400" /> কুরআন পড়ুন</span>
                      <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                    </Link>
                    <Link
                      to="/converter"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between px-6 py-4 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-3"><LayoutGrid className="w-5 h-5 text-slate-400" /> বাংলা কনভার্টার</span>
                      <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                    </Link>

                    <div className="px-6 py-3 mt-2 font-black text-slate-400 uppercase tracking-wider text-xs">ক্যাটাগরি</div>
                    {categories.map((cat) => (
                      <Link
                        key={cat.id}
                        to={`/category/${cat.slug}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-between px-6 py-3 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors pl-8"
                      >
                        <span className="font-bold text-slate-600 dark:text-slate-300">{cat.name}</span>
                        <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                      </Link>
                    ))}
                  </div>
                  <div className="p-6 bg-slate-50 dark:bg-slate-900/50 text-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">© {toBanglaNumber(new Date().getFullYear())} জনমত ২৪ মিডিয়া</p>
                  </div>
                </SheetContent>
              </Sheet>
              <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2 md:gap-4 shrink-0 transition-transform hover:opacity-95">
                <img src={logo} alt="Logo" className="h-10 md:h-[60px] w-auto shadow-sm" />
                <div className="flex flex-col justify-center">
                  <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-none">জনমত<span className="text-[#e6222b]">২৪</span></h1>
                </div>
              </Link>
            </div>

            {/* Mobile Right: Search */}
            <div className="lg:hidden flex items-center">
              <button className="text-slate-700 dark:text-slate-300 hover:text-[#e6222b] transition-colors" onClick={() => setSearchOpen(true)}>
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Right: Ad Banner (Desktop & Mobile) */}
          <div className="flex items-center justify-center lg:justify-end w-full lg:w-[728px] h-auto min-h-[60px] lg:h-[90px] overflow-hidden shrink-0 border-0 lg:border lg:border-dashed border-slate-200 dark:border-slate-800">
             <UniversalAdBanner 
               placement="header" 
               slot="8219463510"
               className="w-full h-full object-contain"
               format="horizontal"
             />
          </div>
        </div>
      </header>

      {/* SubHeader Spacer to prevent layout shift when fixing the subheader */}
      {headerMode !== 'relative' && (
        <div style={{ height: `${headerHeights.row23}px` }} className="w-full" />
      )}

      {/* SubHeader (Row 2 & 3) */}
      <div 
        ref={row23Ref}
        className={cn(
          "w-full bg-white dark:bg-slate-950 flex flex-col will-change-transform",
          headerMode === 'relative' 
            ? "relative z-40" 
            : "fixed z-40 transition-transform duration-300 shadow-lg shadow-black/10",
          headerMode === 'fixed_hidden' ? "-translate-y-[150%]" : "translate-y-0"
        )}
        style={headerMode !== 'relative' ? { top: `${headerHeights.row1}px` } : undefined}
      >
        <div className="overflow-hidden flex flex-col w-full">
          {/* Row 2: Date & Links (Top Bar) */}
          <div className="bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 h-11 flex items-center overflow-x-auto no-scrollbar">
            <div className="container flex justify-between items-center text-[13px] md:text-[15px] font-medium text-slate-700 dark:text-slate-300 min-w-max md:min-w-0 gap-4">
              <div className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>{formatBanglaDateFull(currentTime).split('|')[0]}</span>
                <span className="w-[1.5px] h-4 bg-[#e6222b] mx-1.5"></span>
                <span>৩ জ্যৈষ্ঠ ১৪৩৩</span>
              </div>
              <div className="flex items-center gap-3">
                 <Link to="/converter" className="hover:text-[#e6222b] transition-colors hidden lg:block">বাংলা কনভার্টার</Link>
                 <span className="text-slate-300 hidden lg:block">|</span>
                 <Link to="/quran" className="hover:text-[#e6222b] transition-colors font-bold text-[#e6222b]">কুরআন পড়ুন</Link>
                 <span className="text-slate-300">|</span>
                 <LanguageTranslator />
                 <span className="text-slate-300">|</span>
                 
                 {/* Auth/Login */}
                 <div>
                   {user ? (
                     <DropdownMenu>
                       <DropdownMenuTrigger className="flex items-center gap-1 hover:text-[#e6222b] outline-none transition-colors">
                         <UserIcon className="w-4 h-4" />
                         <span className="hidden sm:inline truncate max-w-[100px]">{fullName || user.email?.split('@')[0]}</span>
                       </DropdownMenuTrigger>
                       <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 mt-1">
                         <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 truncate">
                           {user.email}
                         </div>
                         {isAdmin && (
                           <DropdownMenuItem asChild>
                             <Link to="/admin" className="cursor-pointer text-sm font-bold flex items-center gap-2">
                               <Shield className="w-4 h-4 text-primary" /> অ্যাডমিন প্যানেল
                             </Link>
                           </DropdownMenuItem>
                         )}
                         <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-sm font-bold text-red-500 hover:text-red-600 focus:text-red-600 flex items-center gap-2">
                           <LogOut className="w-4 h-4" /> লগআউট
                         </DropdownMenuItem>
                       </DropdownMenuContent>
                     </DropdownMenu>
                   ) : (
                     <Link to="/auth" className="hover:text-[#e6222b] flex items-center gap-1 transition-colors">
                       <UserIcon className="w-4 h-4" />
                       <span>লগইন</span>
                     </Link>
                   )}
                 </div>
                 
                 <span className="text-slate-300 ml-1">|</span>
                 <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="hover:text-[#e6222b] flex items-center justify-center transition-colors">
                    {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                 </button>
              </div>
            </div>
          </div>
          {/* Row 3: Navigation Bar - Dense, Newspaper Style */}
          <div className="block relative z-10 w-full mb-1">
             <div className="container px-0 sm:px-4">
                 <div className="bg-[#26225a] flex items-center h-[46px] md:h-[52px] px-3 md:px-6 sm:rounded-sm">
               {/* Left-Aligned Links */}
               <nav className="flex items-center justify-start gap-4 sm:gap-5 xl:gap-6 h-full overflow-x-auto no-scrollbar flex-1 snap-x">
                 <Link to="/" className={cn(
                   "flex items-center text-[15px] sm:text-[16px] font-bold transition-all whitespace-nowrap shrink-0 snap-start",
                   isActive('/') ? "text-white" : "text-white/80 hover:text-white"
                 )}>
                   <Home className="w-5 h-5" />
                 </Link>
                 <Link to="/category/all" className={cn(
                   "flex items-center text-[15px] sm:text-[16px] font-bold transition-all whitespace-nowrap shrink-0 snap-start",
                   isCategoryActive('all') ? "text-white" : "text-white/80 hover:text-white"
                 )}>
                   সর্বশেষ
                 </Link>
                 
                 {categories.map((cat, index) => (
                   <Link key={cat.id} to={`/category/${cat.slug}`} className={cn(
                     "flex items-center text-[15px] sm:text-[16px] font-bold transition-all whitespace-nowrap shrink-0 snap-start",
                     isCategoryActive(cat.slug) ? "text-white" : "text-white/80 hover:text-white",
                     index >= 12 ? "lg:hidden" : ""
                   )}>
                     {cat.name}
                   </Link>
                 ))}

                 {categories.length > 12 && (
                   <div className="hidden lg:flex shrink-0">
                     <DropdownMenu>
                       <DropdownMenuTrigger className="flex items-center gap-1 text-[16px] font-bold text-white/80 hover:text-white outline-none transition-colors whitespace-nowrap">
                          অন্যান্য <ChevronDown className="w-4 h-4" />
                       </DropdownMenuTrigger>
                       <DropdownMenuContent className="p-2 w-48 rounded-xl border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900 z-50">
                          {categories.slice(12).map(cat => (
                             <DropdownMenuItem key={cat.id} asChild>
                                <Link to={`/category/${cat.slug}`} className="p-3 rounded-lg font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#e6222b] transition-all cursor-pointer">
                                   {cat.name}
                                </Link>
                             </DropdownMenuItem>
                          ))}
                       </DropdownMenuContent>
                     </DropdownMenu>
                   </div>
                 )}
               </nav>
               
               {/* Right: Search & Socials */}
               <div className="hidden md:flex items-center justify-end gap-3 text-white/80 shrink-0 ml-4">
                  <Link to="#" className="hover:text-white transition-colors"><Twitter className="w-4 h-4" /></Link>
                  <Link to="#" className="hover:text-white transition-colors"><Youtube className="w-4 h-4" /></Link>
                  <Link to="#" className="hover:text-white transition-colors"><Instagram className="w-4 h-4" /></Link>
                  <span className="w-[1px] h-4 bg-white/30 mx-1"></span>
                  <button className="hover:text-white transition-colors" onClick={() => setSearchOpen(true)}>
                     <Search className="w-5 h-5" />
                  </button>
               </div>
               </div>
             </div>
          </div>
          
          {/* Progress Indicator */}
          <div className="absolute bottom-0 left-0 h-[2px] bg-primary z-50 transition-all duration-300" style={{ width: `${scrollProgress}%` }} />
        </div>
      </div>
    </>
  );
}
