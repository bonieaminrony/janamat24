import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AvatarUpload } from "@/components/admin/AvatarUpload";
import { 
  User, 
  Mail, 
  Facebook, 
  Twitter, 
  Shield, 
  Calendar,
  Loader2,
  CheckCircle2,
  Lock,
  KeyRound,
  Eye,
  Newspaper
} from "lucide-react";
import { formatBanglaDateTime, toBanglaNumber } from "@/lib/bangla-utils";
import { cn } from "@/lib/utils";

const roleLabels: Record<string, string> = {
  admin: "অ্যাডমিন",
  editor: "এডিটর",
};

export default function AdminProfile() {
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserEmail(user.email || "");
      return user;
    },
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ["admin-profile", currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return null;
      const { data, error } = await supabase.from("profiles").select("*").eq("user_id", currentUser.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!currentUser?.id,
  });

  const { data: articleStats } = useQuery({
    queryKey: ["profile-article-stats", currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return { total: 0, views: 0 };
      const { data } = await supabase.from("news").select("views").eq("author_id", currentUser.id);
      const totalViews = data?.reduce((sum, item) => sum + (item.views || 0), 0) || 0;
      return { total: data?.length || 0, views: totalViews };
    },
    enabled: !!currentUser?.id,
  });

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setBio(profile.bio || "");
      setAvatarUrl(profile.avatar_url || "");
      setFacebookUrl(profile.facebook_url || "");
      setTwitterUrl(profile.twitter_url || "");
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser?.id) throw new Error("অনুগ্রহ করে পুনরায় লগইন করুন");
      
      const updateData = {
        user_id: currentUser.id,
        full_name: fullName,
        bio,
        avatar_url: avatarUrl,
        facebook_url: facebookUrl,
        twitter_url: twitterUrl,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("profiles").upsert(updateData, {
        onConflict: 'user_id'
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-profile"] });
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
      toast({ title: "সফল", description: "প্রোফাইল আপডেট হয়েছে" });
    },
    onError: (error: any) => {
      toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
    }
  });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: "ত্রুটি", description: "পাসওয়ার্ড মিলছে না", variant: "destructive" });
      return;
    }
    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: "সফল", description: "পাসওয়ার্ড পরিবর্তন হয়েছে" });
      setNewPassword(""); setConfirmPassword("");
    } catch (e: any) {
      toast({ title: "ত্রুটি", description: e.message, variant: "destructive" });
    } finally { setIsChangingPassword(false); }
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6 pb-12 font-sans selection:bg-indigo-100/30">
      {/* Profile Banner - Professional Density */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-6 lg:p-8 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 dark:bg-indigo-500/10 rounded-full blur-[60px] -mr-32 -mt-32 opacity-60 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
           <div className="relative group/avatar shrink-0">
              <Avatar className="w-24 h-24 lg:w-28 lg:h-28 border-4 border-white dark:border-slate-800 shadow-md transition-transform duration-300 group-hover/avatar:scale-105">
                <AvatarImage src={avatarUrl || ""} className="object-cover" />
                <AvatarFallback className="text-3xl font-bold bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white">{fullName?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <div className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full shadow-sm" />
           </div>
           
           <div className="flex-1 text-center md:text-left space-y-3">
              <div className="space-y-0.5">
                 <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">{fullName || "ব্যবহারকারী"}</h1>
                 <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">জনমত ২৪ অফিসিয়াল প্রোফাইল</p>
              </div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                 <Badge className="bg-slate-900 dark:bg-primary text-white dark:text-primary-foreground rounded-md px-3 py-1 font-semibold border-none text-xs">
                    {roleLabels[profile?.role || ""] || "সদস্য"}
                 </Badge>
                 <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-md border border-slate-100 dark:border-slate-800">
                    <Mail className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="text-slate-600 dark:text-slate-400 font-medium text-xs truncate max-w-[200px]">{userEmail}</span>
                 </div>
              </div>
           </div>

           <div className="flex gap-4 w-full md:w-auto">
              <div className="flex-1 md:flex-none p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 text-center min-w-[120px]">
                 <p className="text-2xl font-bold text-slate-900 dark:text-white leading-none mb-1">{toBanglaNumber(articleStats?.total || 0)}</p>
                 <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">সংকলিত নিউজ</p>
              </div>
              <div className="flex-1 md:flex-none p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 text-center min-w-[120px]">
                 <p className="text-2xl font-bold text-slate-900 dark:text-white leading-none mb-1">{toBanglaNumber(articleStats?.views || 0)}</p>
                 <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">মোট ভিউয়ারশিপ</p>
              </div>
           </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Main Info Card */}
        <Card className="lg:col-span-3 border-none shadow-[0_40px_80px_-20px_rgba(0,0,0,0.06)] dark:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)] rounded-[4rem] bg-white dark:bg-slate-900 overflow-hidden transition-all hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)]">
          <div className="p-8 space-y-8">
             <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">প্রোফাইল কাস্টমাইজেশন</h3>
                <p className="text-sm text-slate-400 dark:text-slate-500 font-bold">আপনার ব্যক্তিগত তথ্য এবং সামাজিক যোগাযোগ রিফাইন করুন</p>
             </div>
             
             <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(); }} className="space-y-10">
                <div className="space-y-10">
                    <div className="space-y-4 group">
                      <Label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-2 transition-colors group-focus-within:text-slate-900 dark:group-focus-within:text-white">পূর্ণ নাম (Full Name)</Label>
                      <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-12 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-600 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-600/5 dark:focus:ring-indigo-500/10 font-semibold text-base transition-all text-slate-900 dark:text-white" />
                    </div>
                    <div className="space-y-4 group">
                      <Label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-2 transition-colors group-focus-within:text-slate-900 dark:group-focus-within:text-white">বায়োগ্রাফি (Biographical Note)</Label>
                      <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="আপনার সম্পর্কে কিছু লিখুন যা পাঠকরা দেখতে পাবে..." className="rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-600 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-600/5 dark:focus:ring-indigo-500/10 min-h-[140px] font-medium text-lg leading-relaxed transition-all text-slate-900 dark:text-white" />
                    </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-8">
                    <div className="space-y-4 group">
                       <Label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-2">সোশ্যাল: ফেসবুক</Label>
                       <div className="relative">
                          <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center gap-3 border-r border-slate-200 dark:border-slate-800 pr-3 mr-3">
                             <Facebook className="w-5 h-5 text-blue-600" />
                          </div>
                          <Input value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} placeholder="facebook.com/username" className="pl-16 h-12 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 font-medium text-slate-900 dark:text-white" />
                       </div>
                    </div>
                    <div className="space-y-4 group">
                       <Label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-2">সোশ্যাল: টুইটার (X)</Label>
                       <div className="relative">
                          <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center gap-3 border-r border-slate-200 dark:border-slate-800 pr-3 mr-3">
                             <Twitter className="w-5 h-5 text-slate-900 dark:text-white" />
                          </div>
                          <Input value={twitterUrl} onChange={(e) => setTwitterUrl(e.target.value)} placeholder="twitter.com/username" className="pl-16 h-12 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 font-medium text-slate-900 dark:text-white" />
                       </div>
                    </div>
                 </div>

                 <div className="flex justify-end pt-6 border-t border-slate-50 dark:border-slate-800">
                    <Button type="submit" disabled={updateMutation.isPending} className="h-12 px-8 rounded-xl bg-slate-900 dark:bg-primary hover:bg-slate-800 dark:hover:opacity-90 text-white dark:text-primary-foreground font-semibold shadow-md transition-all active:scale-95 flex gap-2 text-sm">
                       {updateMutation.isPending && <Loader2 className="w-5 h-5 animate-spin" />}
                       আপডেট নিশ্চিত করুন
                    </Button>
                 </div>
             </form>
          </div>
        </Card>

        {/* Security Info Card */}
        <div className="lg:col-span-2 space-y-10">
            <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-slate-900 overflow-hidden transition-all hover:shadow-md">
               <div className="p-8 space-y-6">
                  <div className="space-y-1">
                     <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">অ্যাকাউন্ট নিরাপত্তা</h3>
                     <p className="text-xs text-slate-400 dark:text-slate-500 font-bold">পাসওয়ার্ড পরিবর্তন ও সিকিউরিটি লগ</p>
                  </div>

                  <form onSubmit={handlePasswordChange} className="space-y-6">
                     <div className="space-y-2 group">
                        <Label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">নতুন পাসওয়ার্ড</Label>
                        <div className="relative">
                           <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-600" />
                           <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="pl-10 h-10 rounded-lg bg-slate-50/50 dark:bg-slate-800 border-slate-100 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 transition-all font-medium text-sm text-slate-900 dark:text-white" />
                        </div>
                     </div>
                     <div className="space-y-2 group">
                        <Label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">পাসওয়ার্ড নিশ্চিত করুন</Label>
                        <div className="relative">
                           <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-600" />
                           <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pl-10 h-10 rounded-lg bg-slate-50/50 dark:bg-slate-800 border-slate-100 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 transition-all font-medium text-sm text-slate-900 dark:text-white" />
                        </div>
                     </div>
                     <Button type="submit" disabled={isChangingPassword || !newPassword} className="w-full h-10 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-900 dark:text-white font-semibold transition-all shadow-sm active:scale-95 text-sm">
                        {isChangingPassword ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "পাসওয়ার্ড আপডেট করুন"}
                     </Button>
                  </form>
               </div>
            </Card>

            <div className="p-8 bg-slate-900 text-white rounded-3xl space-y-6 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
                  
                  <div className="flex items-center gap-4 relative z-10">
                     <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white"><Shield className="w-5 h-5" /></div>
                     <div>
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">সিকিউরিটি স্ট্যাটাস</p>
                        <p className="text-xl font-black text-white">সুরক্ষিত</p>
                     </div>
                  </div>
                  
                  <div className="space-y-4 pt-4 border-t border-white/5 relative z-10">
                      <div className="flex justify-between items-center text-[12px] font-black uppercase tracking-tightest">
                         <span className="text-white/40">সর্বশেষ লগিন:</span>
                         <span className="text-white">{profile?.last_login_at ? toBanglaNumber(formatBanglaDateTime(profile.last_login_at)) : "আজ"}</span>
                      </div>
                      <div className="flex justify-between items-center text-[12px] font-black uppercase tracking-tightest">
                         <span className="text-white/40">আইডি ভেরিফিকেশন:</span>
                         <span className="text-emerald-400">সফল</span>
                      </div>
                  </div>
                  
                  <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest text-center mt-4 relative z-10">আপনার ডেটা জনমত ২৪ হাই-সিকিউরিটি সার্ভারে এনক্রিপ্টেড আছে</p>
            </div>
        </div>
      </div>
    </div>
  );
}