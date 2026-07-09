import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Shield, ShieldCheck, ShieldAlert, Search, UserCog, Users, Crown, Calendar, Clock } from "lucide-react";
import { formatBanglaDateTime, toBanglaNumber } from "@/lib/bangla-utils";
import { cn } from "@/lib/utils";

type AppRole = "admin" | "editor";

interface UserWithRole {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: AppRole | null;
  email?: string;
  last_login_at: string | null;
}

export default function AdminRoles() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users-roles"],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, last_login_at")
        .order("full_name");
      if (profilesError) throw profilesError;
      const { data: roles, error: rolesError } = await supabase.from("user_roles").select("user_id, role");
      if (rolesError) throw rolesError;
      return profiles.map(profile => ({
        ...profile,
        role: roles.find(r => r.user_id === profile.user_id)?.role as AppRole | null
      }));
    },
  });

  const { data: isAdmin } = useQuery({
    queryKey: ["current-user-is-admin"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      return !!data;
    },
  });

  const { data: currentUserId } = useQuery({
    queryKey: ["current-user-id"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id;
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole, userName }: { userId: string; newRole: AppRole | "remove"; userName: string }) => {
      // 1. Update user_roles table
      if (newRole === "remove") {
        await supabase.from("user_roles").delete().eq("user_id", userId);
      } else {
        await supabase.from("user_roles").upsert({ user_id: userId, role: newRole });
      }

      // 2. Sync with profiles table to ensure consistency across the app
      await supabase
        .from("profiles")
        .update({ role: newRole === "remove" ? null : newRole })
        .eq("user_id", userId);

      return { newRole, userName };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users-roles"] });
      toast({ title: "সফল", description: "রোল টি পরিবর্তন করা হয়েছে" });
    },
  });

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchQuery || user.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === "all" || (filterRole === "none" && !user.role) || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  if (!isAdmin) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center max-w-lg mx-auto mt-20 shadow-lg">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">অ্যাক্সেস সংরক্ষিত</h2>
        <p className="text-slate-500 dark:text-slate-400 font-medium">শুধুমাত্র অ্যাডমিনরা রোল ব্যবস্থাপনা করতে পারেন।</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Apple-Style Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">ইউজার রোল</h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">অ্যাডমিন প্যানেল এক্সেস এবং পারমিশন পরিচালনা করুন</p>
        </div>
        <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
           <Shield className="w-6 h-6 text-slate-900 dark:text-primary" />
           <p className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">সিস্টেম সিকিউরিটি সচল</p>
        </div>
      </div>

      {/* Control Bar */}
      <Card className="border-slate-200/60 dark:border-slate-800 shadow-sm rounded-2xl bg-white dark:bg-slate-900 overflow-hidden">
        <CardContent className="p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-600 group-focus-within:text-slate-900 dark:group-focus-within:text-slate-300 transition-colors" />
              <Input
                placeholder="ইউজার খুঁজুন..."
                className="pl-12 h-10 bg-slate-50 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-950 focus:border-slate-200 dark:focus:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white transition-all shadow-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-full lg:w-[160px] h-10 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300">
                <SelectValue placeholder="রোল ফিল্টার" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
                <SelectItem value="all" className="font-bold text-xs">সব রোল</SelectItem>
                <SelectItem value="admin" className="font-bold text-xs">অ্যাডমিন</SelectItem>
                <SelectItem value="editor" className="font-bold text-xs">এডিটর</SelectItem>
                <SelectItem value="none" className="font-bold text-xs">রোল নেই</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* User Directory - List Style */}
      <Card className="border-slate-200/60 dark:border-slate-800 shadow-sm rounded-2xl bg-white dark:bg-slate-900 overflow-hidden">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {isLoading ? (
            [1,2,3].map(i => <div key={i} className="h-24 bg-slate-50 dark:bg-slate-800/50 animate-pulse" />)
          ) : filteredUsers.length === 0 ? (
            <div className="p-20 text-center text-slate-400 font-bold">কোনো ইউজার পাওয়া যায়নি</div>
          ) : filteredUsers.map((user) => (
            <div key={user.user_id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 transition-all hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
               <div className="flex items-center gap-4 sm:gap-6">
                 <Avatar className="w-10 h-10 border-white dark:border-slate-800 shadow-sm ring-1 ring-slate-100 dark:ring-slate-800 rounded-lg">
                    <AvatarImage src={user.avatar_url || ""} />
                    <AvatarFallback className="bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold text-xs">{user.full_name?.charAt(0) || "U"}</AvatarFallback>
                 </Avatar>
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                       {user.full_name}
                       {user.user_id === currentUserId && <Badge className="bg-slate-900 dark:bg-primary text-white dark:text-primary-foreground border-none text-[8px] font-bold px-1.5 h-3.5 flex items-center">আপনি</Badge>}
                    </h4>
                    <div className="flex items-center gap-2.5">
                       <Badge variant="outline" className={cn("rounded-md font-bold text-[9px] border-none px-2 py-0.5", user.role === 'admin' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : user.role === 'editor' ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500')}>
                         {user.role === 'admin' ? 'সম্পাদক (Admin)' : user.role === 'editor' ? 'সহ-সম্পাদক (Editor)' : 'রোল নেই'}
                       </Badge>
                       {user.last_login_at && (
                         <span className="text-[9px] font-bold text-slate-300 flex items-center gap-1 uppercase tracking-wider leading-none">
                           <Clock className="w-2.5 h-2.5" />
                           {toBanglaNumber(formatBanglaDateTime(user.last_login_at).split('|')[1]?.trim() || "সম্প্রতি")}
                         </span>
                       )}
                    </div>
                  </div>
               </div>

                 <div className="flex items-center gap-4">
                    <Select
                      value={user.role || "none"}
                      onValueChange={(val) => {
                        if (user.user_id === currentUserId) return;
                        updateRoleMutation.mutate({ userId: user.user_id, newRole: val === "none" ? "remove" : val as AppRole, userName: user.full_name || "" });
                      }}
                      disabled={user.user_id === currentUserId}
                    >
                      <SelectTrigger className="w-full sm:w-32 h-9 rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-800 font-bold transition-all text-xs text-slate-700 dark:text-slate-300">
                         <SelectValue />
                      </SelectTrigger>
                     <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl">
                       <SelectItem value="admin" className="font-bold py-2 text-xs">সম্পাদক (Admin)</SelectItem>
                       <SelectItem value="editor" className="font-bold py-2 text-xs">সহ-সম্পাদক (Editor)</SelectItem>
                       <SelectItem value="none" className="font-bold py-2 text-xs text-rose-500">রোল সরান</SelectItem>
                     </SelectContent>
                   </Select>
                </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}