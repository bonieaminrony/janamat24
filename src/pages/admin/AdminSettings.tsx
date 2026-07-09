import { useState, useEffect } from "react";
import { useSiteSettings, AdSystemType } from "@/hooks/useSiteSettings";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Megaphone, MonitorOff, Globe, Settings, Save, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminSettings() {
  const { settings, updateSettings, isUpdating, isLoading } = useSiteSettings();
  const [clientId, setClientId] = useState("");

  useEffect(() => {
    if (settings?.google_client_id) {
      setClientId(settings.google_client_id);
    }
  }, [settings]);

  const handleSystemChange = async (system: AdSystemType) => {
    if (system === settings?.ad_system) return;
    
    try {
      await updateSettings({ ad_system: system });
      toast.success("বিজ্ঞাপন সেটিংস সফলভাবে আপডেট করা হয়েছে!");
    } catch (error) {
      toast.error("সেটিংস আপডেট করতে ব্যর্থ হয়েছে।");
    }
  };

  const handleSaveClientId = async () => {
    try {
      await updateSettings({ google_client_id: clientId.trim() });
      toast.success("পাবলিশার আইডি আপডেট করা হয়েছে!");
    } catch (error) {
      toast.error("আইডি আপডেট করতে ব্যর্থ হয়েছে।");
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 dark:text-slate-400 animate-pulse font-medium">সিস্টেম কনফিগারেশন লোড হচ্ছে...</div>;
  }

  const options: { id: AdSystemType, label: string, desc: string, icon: any, color: string, shadow: string }[] = [
    { 
      id: "manual", 
      label: "ম্যানুয়াল বিজ্ঞাপন (Internal)", 
      desc: "আপনার নিজস্ব অ্যাড পার্টনার এবং ব্যানারগুলো ওয়েবসাইটের নির্দিষ্ট স্থানে রেন্ডার করবে।",
      icon: Megaphone,
      color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500 dark:border-emerald-500/50",
      shadow: "shadow-emerald-500/20"
    },
    { 
      id: "google", 
      label: "গুগল অ্যাডস (Google Ads)", 
      desc: "গুগল অ্যাডসেন্সের অটোমেটেড বিজ্ঞাপন এবং স্লটগুলো ওয়েবসাইটে প্রদর্শিত হবে।",
      icon: Globe,
      color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-500 dark:border-blue-500/50",
      shadow: "shadow-blue-500/20"
    },
    { 
      id: "none", 
      label: "বিজ্ঞাপন বন্ধ (Off)", 
      desc: "ওয়েবসাইটের সমস্ত বিজ্ঞাপন স্লট সম্পূর্ণ বন্ধ থাকবে, যা একটি প্রিমিয়াম পড়ার অভিজ্ঞতা দেয়।",
      icon: MonitorOff,
      color: "text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border-slate-400 dark:border-slate-600",
      shadow: "shadow-slate-500/20"
    }
  ];

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-1000 slide-in-from-bottom-5">
      {/* Premium Header */}
      <div className="group relative bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800 rounded-[2rem] p-8 lg:p-10 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.04)] overflow-hidden transition-all duration-1000">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-50/50 dark:bg-indigo-500/10 rounded-full blur-[120px] -mr-60 -mt-60 transition-transform duration-[3s] group-hover:-translate-x-10 group-hover:translate-y-10" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
           <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] animate-pulse" />
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-500">Global Configuration</p>
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">সিস্টেম সেটিংস</h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-lg leading-relaxed max-w-xl">পুরো ওয়েবসাইটের বিজ্ঞাপনের আচরণ এখান থেকে কেন্দ্রীয়ভাবে নিয়ন্ত্রণ করা হয়। পরিবর্তনের সাথে সাথে তা ওয়েবসাইটে কার্যকর হবে।</p>
           </div>
           
           <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-sm">
             <Settings className="w-8 h-8 text-slate-400 dark:text-slate-500 animate-[spin_10s_linear_infinite]" />
           </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-slate-200/60 dark:border-slate-800 shadow-sm rounded-3xl overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 transition-all duration-500 bg-white dark:bg-slate-900 group">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 p-8 pb-6">
            <CardTitle className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">প্রধান অ্যাড ইঞ্জিন</CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400 text-sm mt-2">ওয়েবসাইটে কোন ধরনের বিজ্ঞাপন দেখানো হবে তা নির্বাচন করুন।</CardDescription>
          </CardHeader>
          <CardContent className="p-8 max-w-3xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {options.map((option) => {
                const active = settings?.ad_system === option.id;
                
                return (
                  <div 
                    key={option.id}
                    onClick={() => !isUpdating && handleSystemChange(option.id)}
                    className={cn(
                      "relative flex flex-col p-6 rounded-2xl border-2 transition-all duration-500 cursor-pointer overflow-hidden hover:-translate-y-1 group/item",
                      active 
                        ? `${option.color} shadow-xl ${option.shadow}` 
                        : "border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md",
                      isUpdating && "opacity-50 pointer-events-none"
                    )}
                  >
                    <div className="flex items-start gap-4 mb-5">
                      <div className={cn(
                        "p-3.5 rounded-xl shadow-sm transition-colors duration-300",
                        active ? "bg-white dark:bg-slate-900" : "bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700 group-hover/item:border-slate-300 dark:group-hover/item:border-slate-600 text-slate-400 dark:text-slate-500 group-hover/item:text-slate-700 dark:group-hover/item:text-slate-300"
                      )}>
                        <option.icon className="w-6 h-6" />
                      </div>
                    </div>
                    <div>
                      <h3 className={cn("font-bold text-[15px] mb-2 tracking-tight", active ? "" : "text-slate-900 dark:text-white")}>
                        {option.label}
                      </h3>
                      <p className={cn("text-[13px] font-medium leading-relaxed", active ? "opacity-90" : "text-slate-500 dark:text-slate-400")}>
                        {option.desc}
                      </p>
                    </div>
                    
                    {active && (
                      <div className="absolute top-5 right-5 flex items-center justify-center">
                         <div className="h-5 w-5 rounded-full bg-current opacity-20 absolute animate-ping" />
                         <div className="h-2 w-2 rounded-full bg-current relative z-10" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Configuration Properties Card */}
        <Card className="border-slate-200/60 dark:border-slate-800 shadow-sm rounded-3xl overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 transition-all duration-500 bg-white dark:bg-slate-900">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 p-8 pb-6">
            <CardTitle className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
               <KeyRound className="w-5 h-5 text-slate-400 dark:text-slate-500" />
               পাবলিশার ডাটা
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400 text-sm mt-2">গুগল অ্যাডসেন্স অ্যাকাউন্ট কনফিগারেশন</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className={cn(
               "space-y-6 transition-all duration-500",
               settings?.ad_system !== "google" && "opacity-40 grayscale pointer-events-none blur-[1px]"
            )}>
               <div className="space-y-3">
                 <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">Google Client ID (Publisher ID)</Label>
                 <Input 
                   value={clientId} 
                   onChange={(e) => setClientId(e.target.value)} 
                   placeholder="e.g. ca-pub-1869371645821023"
                   className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-950 font-mono text-sm shadow-inner text-slate-900 dark:text-white"
                 />
                 <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                   আপনার অ্যাডসেন্স ড্যাশবোর্ড থেকে পাওয়া Publisher ID এখানে দিন।
                 </p>
               </div>
               
               <Button 
                 onClick={handleSaveClientId}
                 disabled={isUpdating || !clientId.trim() || clientId === settings?.google_client_id}
                 className="w-full h-12 rounded-xl bg-slate-900 dark:bg-primary hover:bg-slate-800 dark:hover:opacity-90 text-white dark:text-primary-foreground font-bold tracking-wide shadow-lg active:scale-95 transition-all gap-2"
               >
                 <Save className="w-4 h-4" />
                 আপডেট করুন
               </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
    </div>
  );
}
