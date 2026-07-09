import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, User, Users, Plus, Trash2, Newspaper, Facebook, Twitter, Mail, Lock, Key, Shield, ShieldCheck, History, Clock, Search, Filter, UserCheck, X, ChevronDown, ChevronUp, Activity, LogIn, FileText, FilePlus, FileEdit, Trash, BarChart3, UserPlus, UserCog, CheckCircle2, Loader2 } from "lucide-react";
import { AvatarUpload } from "@/components/admin/AvatarUpload";
import { sanitizeImageUrl } from "@/lib/url-utils";
import { formatBanglaDate, formatBanglaDateTime, formatBanglaRelativeTime, toBanglaNumber } from "@/lib/bangla-utils";
import { cn } from "@/lib/utils";
import ReporterPerformanceDashboard from "@/components/admin/ReporterPerformanceDashboard";

const activityTypeLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  login: { label: "লগইন", icon: <LogIn className="w-4 h-4 text-green-500" /> },
  news_created: { label: "সংবাদ তৈরি", icon: <FilePlus className="w-4 h-4 text-blue-500" /> },
  news_updated: { label: "সংবাদ সম্পাদনা", icon: <FileEdit className="w-4 h-4 text-amber-500" /> },
  news_deleted: { label: "সংবাদ মুছে ফেলা", icon: <Trash className="w-4 h-4 text-red-500" /> },
};

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  facebook_url: string | null;
  twitter_url: string | null;
  role: "admin" | "editor" | "reporter" | null;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

interface ProfileWithStats extends Profile {
  article_count: number;
  email?: string;
  recent_activity?: ReporterActivity[];
}

interface ReporterActivity {
  id: string;
  user_id: string;
  activity_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface AuthUser {
  id: string;
  email: string;
  has_profile: boolean;
}

const roleLabels: Record<string, string> = {
  admin: "সম্পাদক",
  editor: "সহ-সম্পাদক",
  reporter: "রিপোর্টার",
};

const roleOptions = [
  { value: "admin", label: "সম্পাদক" },
  { value: "editor", label: "সহ-সম্পাদক" },
  { value: "reporter", label: "রিপোর্টার" },
];

interface RoleAuditLog {
  id: string;
  user_id: string;
  changed_by: string;
  old_role: string | null;
  new_role: string;
  changed_at: string;
  user_name: string | null;
  changed_by_name: string | null;
}

export default function AdminReporters() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [auditLogDialogOpen, setAuditLogDialogOpen] = useState(false);
  const [bulkRoleDialogOpen, setBulkRoleDialogOpen] = useState(false);
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [activityProfile, setActivityProfile] = useState<ProfileWithStats | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingProfile, setEditingProfile] = useState<ProfileWithStats | null>(null);
  const [deletingProfile, setDeletingProfile] = useState<ProfileWithStats | null>(null);
  const [passwordProfile, setPasswordProfile] = useState<ProfileWithStats | null>(null);
  const [newPassword, setNewPassword] = useState("");
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [selectedProfiles, setSelectedProfiles] = useState<Set<string>>(new Set());
  const [bulkNewRole, setBulkNewRole] = useState<string>("");
  const [auditLogExpanded, setAuditLogExpanded] = useState<Set<string>>(new Set());
  
  // Form states
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<string>("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all profiles with article counts
  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["admin-reporters"],
    queryFn: async () => {
      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("full_name", { ascending: true });
      
      if (profilesError) throw profilesError;

      // Fetch article counts for all authors in one go to avoid N+1 queries
      const { data: newsStats, error: statsError } = await supabase
        .from("news")
        .select("author_id");
      
      if (statsError) throw statsError;

      // Map counts in memory
      const countsMap: Record<string, number> = {};
      newsStats?.forEach(n => {
        if (!n.author_id) return;
        countsMap[n.author_id] = (countsMap[n.author_id] || 0) + 1;
      });

      return (profilesData as Profile[]).map(profile => ({
        ...profile,
        article_count: countsMap[profile.user_id] || 0,
      }));
    },
  });

  // Fetch role audit logs
  const { data: auditLogs = [], isLoading: isLoadingAuditLogs } = useQuery({
    queryKey: ["role-audit-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("role_audit_log")
        .select("*")
        .order("changed_at", { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as RoleAuditLog[];
    },
  });

  // Fetch reporter activity for a specific user
  const { data: reporterActivity = [], isLoading: isLoadingActivity, refetch: refetchActivity } = useQuery({
    queryKey: ["reporter-activity", activityProfile?.user_id],
    queryFn: async () => {
      if (!activityProfile) return [];
      const { data, error } = await supabase
        .from("reporter_activity")
        .select("*")
        .eq("user_id", activityProfile.user_id)
        .order("created_at", { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as ReporterActivity[];
    },
    enabled: !!activityProfile,
  });

  const openActivityDialog = (profile: ProfileWithStats) => {
    setActivityProfile(profile);
    setActivityDialogOpen(true);
  };

  // Create profile mutation using edge function
  const createMutation = useMutation({
    mutationFn: async (data: { 
      email: string;
      password: string;
      full_name: string; 
      bio: string; 
      avatar_url: string; 
      facebook_url: string; 
      twitter_url: string; 
      role: string 
    }) => {
      const { data: result, error } = await supabase.functions.invoke("create-presenter", {
        body: {
          email: data.email,
          password: data.password,
          full_name: data.full_name,
          bio: data.bio || null,
          avatar_url: data.avatar_url || null,
          facebook_url: data.facebook_url || null,
          twitter_url: data.twitter_url || null,
          role: data.role || null,
        },
      });

      if (error) throw error;
      if (result?.error) throw new Error(result.error);

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reporters"] });
      toast({ title: "সফল!", description: "নতুন প্রতিবেদক যোগ হয়েছে" });
      closeDialog();
    },
    onError: (error) => {
      toast({
        title: "ত্রুটি",
        description: error instanceof Error ? error.message : "প্রতিবেদক যোগ করতে সমস্যা হয়েছে",
        variant: "destructive",
      });
    },
  });

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; user_id: string; full_name: string; bio: string; avatar_url: string; facebook_url: string; twitter_url: string; role: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: data.full_name,
          bio: data.bio || null,
          avatar_url: data.avatar_url || null,
          facebook_url: data.facebook_url || null,
          twitter_url: data.twitter_url || null,
          role: data.role as "admin" | "editor" | "reporter" || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.id);
      
      if (error) throw error;

      // Update user_roles table
      if (data.role) {
        // Delete existing role
        await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", data.user_id);
        
        // Insert new role
        await supabase
          .from("user_roles")
          .insert({
            user_id: data.user_id,
            role: data.role as "admin" | "editor" | "reporter",
          });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reporters"] });
      toast({ title: "সফল!", description: "প্রতিবেদকের তথ্য আপডেট হয়েছে" });
      closeDialog();
    },
    onError: (error) => {
      toast({
        title: "ত্রুটি",
        description: error instanceof Error ? error.message : "আপডেট করতে সমস্যা হয়েছে",
        variant: "destructive",
      });
    },
  });

  // Delete profile mutation
  const deleteMutation = useMutation({
    mutationFn: async (profile: ProfileWithStats) => {
      // First update any news articles to remove this author
      await supabase
        .from("news")
        .update({ author_id: null })
        .eq("author_id", profile.user_id);

      // Delete from user_roles
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", profile.user_id);

      // Delete the profile
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", profile.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reporters"] });
      toast({ title: "সফল!", description: "প্রতিবেদক মুছে ফেলা হয়েছে" });
      setDeleteDialogOpen(false);
      setDeletingProfile(null);
    },
    onError: (error) => {
      toast({
        title: "ত্রুটি",
        description: error instanceof Error ? error.message : "মুছে ফেলতে সমস্যা হয়েছে",
        variant: "destructive",
      });
    },
  });

  // Password update mutation
  const passwordMutation = useMutation({
    mutationFn: async (data: { user_id: string; new_password: string }) => {
      const { data: result, error } = await supabase.functions.invoke("update-presenter-password", {
        body: {
          user_id: data.user_id,
          new_password: data.new_password,
        },
      });

      if (error) throw error;
      if (result?.error) throw new Error(result.error);

      return result;
    },
    onSuccess: () => {
      toast({ title: "সফল!", description: "পাসওয়ার্ড আপডেট হয়েছে" });
      setPasswordDialogOpen(false);
      setPasswordProfile(null);
      setNewPassword("");
    },
    onError: (error) => {
      toast({
        title: "ত্রুটি",
        description: error instanceof Error ? error.message : "পাসওয়ার্ড আপডেট করতে সমস্যা হয়েছে",
        variant: "destructive",
      });
    },
  });

  // Quick role change mutation
  const roleMutation = useMutation({
    mutationFn: async (data: { profile: ProfileWithStats; newRole: "admin" | "editor" | "reporter"; changedByName: string }) => {
      const oldRole = data.profile.role;

      // Update profile role
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          role: data.newRole,
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.profile.id);
      
      if (profileError) throw profileError;

      // Delete existing role from user_roles
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", data.profile.user_id);
      
      // Insert new role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: data.profile.user_id,
          role: data.newRole,
        });

      if (roleError) throw roleError;

      // Log the role change
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("role_audit_log")
          .insert({
            user_id: data.profile.user_id,
            changed_by: user.id,
            old_role: oldRole,
            new_role: data.newRole,
            user_name: data.profile.full_name,
            changed_by_name: data.changedByName,
          });
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-reporters"] });
      queryClient.invalidateQueries({ queryKey: ["role-audit-logs"] });
      toast({ 
        title: "সফল!", 
        description: `${variables.profile.full_name || "প্রতিবেদক"} এর পদবি ${roleLabels[variables.newRole]} করা হয়েছে` 
      });
    },
    onError: (error) => {
      toast({
        title: "ত্রুটি",
        description: error instanceof Error ? error.message : "পদবি পরিবর্তন করতে সমস্যা হয়েছে",
        variant: "destructive",
      });
    },
  });

  const handleQuickRoleChange = async (profile: ProfileWithStats, newRole: string) => {
    if (newRole === profile.role) return;
    
    // Get current user's name for audit log
    const { data: { user } } = await supabase.auth.getUser();
    const currentUserProfile = profiles.find(p => p.user_id === user?.id);
    
    roleMutation.mutate({ 
      profile, 
      newRole: newRole as "admin" | "editor" | "reporter",
      changedByName: currentUserProfile?.full_name || "অজানা",
    });
  };

  // Bulk role change mutation
  const bulkRoleMutation = useMutation({
    mutationFn: async (data: { profileIds: string[]; newRole: "admin" | "editor" | "reporter"; changedByName: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const profilesToUpdate = profiles.filter(p => data.profileIds.includes(p.id));
      
      for (const profile of profilesToUpdate) {
        const oldRole = profile.role;

        // Update profile role
        await supabase
          .from("profiles")
          .update({
            role: data.newRole,
            updated_at: new Date().toISOString(),
          })
          .eq("id", profile.id);

        // Delete existing role from user_roles
        await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", profile.user_id);
        
        // Insert new role
        await supabase
          .from("user_roles")
          .insert({
            user_id: profile.user_id,
            role: data.newRole,
          });

        // Log the role change
        await supabase
          .from("role_audit_log")
          .insert({
            user_id: profile.user_id,
            changed_by: user.id,
            old_role: oldRole,
            new_role: data.newRole,
            user_name: profile.full_name,
            changed_by_name: data.changedByName,
          });
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-reporters"] });
      queryClient.invalidateQueries({ queryKey: ["role-audit-logs"] });
      toast({ 
        title: "সফল!", 
        description: `${variables.profileIds.length} জন প্রতিবেদকের পদবি ${roleLabels[variables.newRole]} করা হয়েছে` 
      });
      setSelectedProfiles(new Set());
      setBulkRoleDialogOpen(false);
      setBulkNewRole("");
    },
    onError: (error) => {
      toast({
        title: "ত্রুটি",
        description: error instanceof Error ? error.message : "পদবি পরিবর্তন করতে সমস্যা হয়েছে",
        variant: "destructive",
      });
    },
  });

  const handleBulkRoleChange = async () => {
    if (!bulkNewRole || selectedProfiles.size === 0) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    const currentUserProfile = profiles.find(p => p.user_id === user?.id);
    
    bulkRoleMutation.mutate({
      profileIds: Array.from(selectedProfiles),
      newRole: bulkNewRole as "admin" | "editor" | "reporter",
      changedByName: currentUserProfile?.full_name || "অজানা",
    });
  };

  const toggleSelectProfile = (profileId: string) => {
    const newSelected = new Set(selectedProfiles);
    if (newSelected.has(profileId)) {
      newSelected.delete(profileId);
    } else {
      newSelected.add(profileId);
    }
    setSelectedProfiles(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedProfiles.size === filteredProfiles.length) {
      setSelectedProfiles(new Set());
    } else {
      setSelectedProfiles(new Set(filteredProfiles.map(p => p.id)));
    }
  };

  const toggleAuditLogExpand = (logId: string) => {
    const newExpanded = new Set(auditLogExpanded);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setAuditLogExpanded(newExpanded);
  };

  // Filtered profiles based on search and role filter
  const filteredProfiles = useMemo(() => {
    return profiles.filter(profile => {
      const matchesSearch = !searchQuery || 
        (profile.full_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (profile.bio?.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesRole = roleFilter === "all" || profile.role === roleFilter;
      
      return matchesSearch && matchesRole;
    });
  }, [profiles, searchQuery, roleFilter]);

  const openCreate = () => {
    setIsCreating(true);
    setEditingProfile(null);
    setFullName("");
    setBio("");
    setAvatarUrl("");
    setFacebookUrl("");
    setTwitterUrl("");
    setEmail("");
    setPassword("");
    setRole("");
    setDialogOpen(true);
  };

  const openEdit = (profile: ProfileWithStats) => {
    setIsCreating(false);
    setEditingProfile(profile);
    setFullName(profile.full_name || "");
    setBio(profile.bio || "");
    setAvatarUrl(profile.avatar_url || "");
    setFacebookUrl(profile.facebook_url || "");
    setTwitterUrl(profile.twitter_url || "");
    setEmail("");
    setPassword("");
    setRole(profile.role || "");
    setDialogOpen(true);
  };

  const openDelete = (profile: ProfileWithStats) => {
    setDeletingProfile(profile);
    setDeleteDialogOpen(true);
  };

  const openPasswordChange = (profile: ProfileWithStats) => {
    setPasswordProfile(profile);
    setNewPassword("");
    setPasswordDialogOpen(true);
  };

  const handlePasswordChange = () => {
    if (!passwordProfile) return;
    
    if (!newPassword.trim() || newPassword.length < 6) {
      toast({
        title: "পাসওয়ার্ড প্রয়োজন",
        description: "কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন",
        variant: "destructive",
      });
      return;
    }

    passwordMutation.mutate({
      user_id: passwordProfile.user_id,
      new_password: newPassword.trim(),
    });
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setIsCreating(false);
    setEditingProfile(null);
    setFullName("");
    setBio("");
    setAvatarUrl("");
    setFacebookUrl("");
    setTwitterUrl("");
    setEmail("");
    setPassword("");
    setRole("");
  };

  const handleSubmit = () => {
    if (!fullName.trim()) {
      toast({
        title: "নাম প্রয়োজন",
        description: "প্রতিবেদকের নাম লিখুন",
        variant: "destructive",
      });
      return;
    }

    if (isCreating) {
      if (!email.trim()) {
        toast({
          title: "ইমেইল প্রয়োজন",
          description: "প্রতিবেদকের ইমেইল দিন",
          variant: "destructive",
        });
        return;
      }
      if (!password.trim() || password.length < 6) {
        toast({
          title: "পাসওয়ার্ড প্রয়োজন",
          description: "কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন",
          variant: "destructive",
        });
        return;
      }
      createMutation.mutate({
        email: email.trim(),
        password: password.trim(),
        full_name: fullName.trim(),
        bio: bio.trim(),
        avatar_url: avatarUrl.trim(),
        facebook_url: facebookUrl.trim(),
        twitter_url: twitterUrl.trim(),
        role: role,
      });
    } else if (editingProfile) {
      updateMutation.mutate({
        id: editingProfile.id,
        user_id: editingProfile.user_id,
        full_name: fullName.trim(),
        bio: bio.trim(),
        avatar_url: avatarUrl.trim(),
        facebook_url: facebookUrl.trim(),
        twitter_url: twitterUrl.trim(),
        role: role,
      });
    }
  };

  const handleDelete = () => {
    if (deletingProfile) {
      deleteMutation.mutate(deletingProfile);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "";
    return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-2">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">প্রতিবেদক ব্যবস্থাপনা</h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">সিস্টেমে মোট {toBanglaNumber(profiles.length)} জন নিবন্ধিত প্রতিবেদক রয়েছেন</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => setAuditLogDialogOpen(true)}
            className="h-11 rounded-xl border-slate-200 dark:border-slate-800 px-5 font-bold text-slate-600 dark:text-slate-400 gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">পদবি ইতিহাস</span>
          </Button>
          <Button onClick={openCreate} className="h-11 rounded-xl bg-primary hover:opacity-90 text-white font-black text-xs uppercase tracking-widest px-6 shadow-lg shadow-primary/20 gap-2 border-0 active:scale-95 transition-all">
            <Plus className="w-5 h-5" />
            নতুন প্রতিবেদক
          </Button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "মোট প্রতিবেদক", value: profiles.length, icon: Users, color: "#6366f1", bg: "bg-indigo-50", gradient: "from-indigo-500/10 to-transparent" },
          { title: "সক্রিয় সম্পাদক", value: profiles.filter(p => p.role === 'admin').length, icon: ShieldCheck, color: "#3b82f6", bg: "bg-blue-50", gradient: "from-blue-500/10 to-transparent" },
          { title: "সহ-সম্পাদক", value: profiles.filter(p => p.role === 'editor').length, icon: UserCheck, color: "#10b981", bg: "bg-emerald-50", gradient: "from-emerald-500/10 to-transparent" },
          { title: "মোট সংবাদ", value: profiles.reduce((sum, p) => sum + p.article_count, 0), icon: Newspaper, color: "#f43f5e", bg: "bg-rose-50", gradient: "from-rose-500/10 to-transparent" },
        ].map((stat) => (
          <Card key={stat.title} className="group relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl">
            <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity", stat.gradient)} />
            <CardContent className="p-6 flex items-center gap-4 relative z-10">
              <div className={cn("p-3 rounded-xl transition-all duration-500 group-hover:scale-105", stat.bg, "dark:bg-slate-800/50")}>
                <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{stat.title}</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{toBanglaNumber(stat.value)}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Control Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <Input
            placeholder="নাম বা পরিচয় দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-11 bg-slate-50 dark:bg-slate-800 border-0 rounded-xl focus-visible:ring-indigo-500/10 text-slate-900 dark:text-white"
          />
        </div>
        
        <div className="flex flex-row items-center gap-3">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="flex-1 lg:w-[160px] h-11 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <Filter className="w-4 h-4 mr-2 text-slate-400" />
              <SelectValue placeholder="পদবি ফিল্টার" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
              <SelectItem value="all" className="font-bold">সকল পদবি</SelectItem>
              <SelectItem value="admin" className="font-bold">সম্পাদক</SelectItem>
              <SelectItem value="editor" className="font-bold">সহ-সম্পাদক</SelectItem>
            </SelectContent>
          </Select>
          
          {selectedProfiles.size > 0 && (
            <Button 
              onClick={() => setBulkRoleDialogOpen(true)}
              className="h-11 rounded-xl bg-slate-900 shadow-lg shadow-black/10 gap-2 flex-1 sm:flex-none"
            >
              <UserCheck className="w-4 h-4" />
              পদবি পরিবর্তন ({toBanglaNumber(selectedProfiles.size)})
            </Button>
          )}

          <div className="hidden sm:flex items-center gap-3 px-4 h-11 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-xl border border-indigo-500/10 dark:border-indigo-500/20">
            <Activity className="w-4 h-4 text-indigo-500" />
            <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
              {toBanglaNumber(filteredProfiles.length)} জন পাওয়া গেছে
            </p>
          </div>
        </div>
      </div>

      {/* Profiles Grid & Performance Tabs */}
      <Tabs defaultValue="grid" className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <TabsList className="bg-muted/30 p-1 rounded-2xl border border-divider/20 h-11">
            <TabsTrigger value="grid" className="rounded-xl px-4 gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <Users className="w-4 h-4" />
              গ্রিড ভিউ
            </TabsTrigger>
            <TabsTrigger value="table" className="hidden md:flex rounded-xl px-4 gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <Filter className="w-4 h-4" />
              টেবিল ভিউ
            </TabsTrigger>
            <TabsTrigger value="performance" className="rounded-xl px-4 gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <BarChart3 className="w-4 h-4" />
              পারফরম্যান্স
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="grid">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
              <div className="w-12 h-12 border-4 border-slate-100 dark:border-slate-800 border-t-indigo-500 rounded-full animate-spin mb-6" />
              <p className="font-bold text-slate-400 dark:text-slate-500 animate-pulse">রিপোর্টারদের তথ্য লোড হচ্ছে...</p>
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm text-center px-4">
               <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6 border border-slate-100 dark:border-slate-700">
                 <User className="w-10 h-10 text-slate-200 dark:text-slate-700" />
               </div>
               <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">কোনো প্রতিবেদক খুঁজে পাওয়া যায়নি</h3>
               <p className="text-slate-400 dark:text-slate-500 text-sm font-medium max-w-sm">সার্চ কুয়েরি পরিবর্তন করুন অথবা নতুন প্রতিবেদক যোগ করুন।</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredProfiles.map((profile) => (
                <Card key={profile.id} className="group relative overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 rounded-3xl flex flex-col pt-4 pb-8 px-2 bg-white dark:bg-slate-900">
                  <div className="absolute top-0 right-0 p-6">
                    <Checkbox
                      checked={selectedProfiles.has(profile.id)}
                      onCheckedChange={() => toggleSelectProfile(profile.id)}
                      className="rounded-lg border-slate-200 dark:border-slate-700 w-5 h-5 shadow-sm bg-white dark:bg-slate-800"
                    />
                  </div>

                  <CardContent className="p-6 space-y-6 flex-1 flex flex-col">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 rounded-3xl blur-xl group-hover:scale-125 transition-transform duration-700" />
                        <Avatar className="h-20 w-20 border-[6px] border-white dark:border-slate-900 shadow-2xl relative z-10 rounded-2xl group-hover:rotate-3 transition-all duration-500">
                          <AvatarImage src={sanitizeImageUrl(profile.avatar_url)} className="object-cover" />
                          <AvatarFallback className="bg-primary/5 text-primary text-3xl font-black">
                            {getInitials(profile.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className={cn(
                          "absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl flex items-center justify-center z-20 border-4 border-white dark:border-slate-900 shadow-lg",
                          profile.role === 'admin' ? "bg-blue-600" : "bg-emerald-600"
                        )}>
                          {profile.role === 'admin' ? <ShieldCheck className="w-5 h-5 text-white" /> : <UserCheck className="w-5 h-5 text-white" />}
                        </div>
                      </div>

                      <div className="space-y-1 pt-2">
                        <h3 className="text-xl font-black text-headline leading-tight tracking-tight group-hover:text-primary transition-colors">{profile.full_name || "অজানা নাম"}</h3>
                        <Badge variant="outline" className="rounded-full px-4 py-0.5 border-divider/20 bg-muted/50 text-xs font-black uppercase tracking-widest text-muted-foreground font-sans">
                          {roleLabels[profile.role || "editor"] || "প্রতিবেদক"}
                        </Badge>
                      </div>

                      {profile.bio && (
                        <p className="text-sm text-subtext leading-relaxed line-clamp-2 max-w-[240px] h-[2.5rem] font-medium">
                          {profile.bio}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 bg-primary/5 rounded-3xl border border-primary/10 group-hover:bg-primary/10 transition-colors">
                        <div className="flex items-center gap-2 mb-1 text-primary/60">
                          <Newspaper className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-black uppercase tracking-wider font-sans">মোট সংবাদ</span>
                        </div>
                        <p className="text-2xl font-black text-headline tracking-tighter">{toBanglaNumber(profile.article_count)}</p>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-3xl border border-divider/10 group-hover:bg-accent/5 transition-colors">
                        <div className="flex items-center gap-2 mb-1 text-muted-foreground/60">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-black uppercase tracking-wider font-sans">শেষ কাজ</span>
                        </div>
                        <p className="text-[10px] font-black text-headline uppercase leading-tight pt-1">
                          {profile.last_login_at ? formatBanglaRelativeTime(profile.last_login_at) : "সম্প্রতি নেই"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-3 pt-2">
                       {profile.facebook_url && (
                         <a href={profile.facebook_url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-[#1877F2]/10 text-[#1877F2] rounded-2xl flex items-center justify-center hover:scale-110 hover:bg-[#1877F2] hover:text-white transition-all">
                           <Facebook className="w-5 h-5" />
                         </a>
                       )}
                       {profile.twitter_url && (
                         <a href={profile.twitter_url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-[#1DA1F2]/10 text-[#1DA1F2] rounded-2xl flex items-center justify-center hover:scale-110 hover:bg-[#1DA1F2] hover:text-white transition-all">
                           <Twitter className="w-5 h-5" />
                         </a>
                       )}
                       <button onClick={() => openActivityDialog(profile)} className="w-10 h-10 bg-primary/10 text-primary rounded-2xl flex items-center justify-center hover:scale-110 hover:bg-primary hover:text-white transition-all">
                         <Activity className="w-5 h-5" />
                       </button>
                    </div>

                    <div className="flex gap-2 pt-2">
                       <Button variant="outline" className="flex-1 rounded-2xl border-divider/30 font-black text-[10px] uppercase tracking-wider h-11" onClick={() => openEdit(profile)}>
                         <Edit className="w-4 h-4 mr-2" />
                         এডিট
                       </Button>
                       <div className="flex gap-1.5">
                         <Button variant="ghost" className="w-11 h-11 rounded-2xl bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all" onClick={() => openPasswordChange(profile)} title="পাসওয়ার্ড পরিবর্তন">
                           <Lock className="w-4 h-4" />
                         </Button>
                         <Button variant="ghost" className="w-11 h-11 rounded-2xl bg-destructive/5 text-destructive hover:bg-destructive hover:text-white transition-all" onClick={() => openDelete(profile)}>
                           <Trash2 className="w-4 h-4" />
                         </Button>
                       </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="table">
          <Card className="border border-slate-200 dark:border-slate-800 shadow-2xl shadow-black/5 rounded-[32px] overflow-hidden bg-white dark:bg-slate-900">
             <div className="overflow-x-auto">
               <Table>
                 <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                   <TableRow className="hover:bg-transparent border-slate-200 dark:border-slate-800">
                     <TableHead className="w-12 h-10 pl-6">
                       <Checkbox 
                         checked={selectedProfiles.size === filteredProfiles.length && filteredProfiles.length > 0} 
                         onCheckedChange={toggleSelectAll}
                         className="rounded-lg"
                       />
                     </TableHead>
                     <TableHead className="font-black text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">প্রতিবেদক</TableHead>
                     <TableHead className="font-black text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">পদবি</TableHead>
                     <TableHead className="font-black text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">নিউজ সংখ্যা</TableHead>
                     <TableHead className="font-black text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">শেষ লগইন</TableHead>
                     <TableHead className="font-black text-[11px] uppercase tracking-wider text-right pr-6 text-slate-500 dark:text-slate-400">অ্যাকশন</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {filteredProfiles.map((p) => (
                     <TableRow key={p.id} className="hover:bg-primary/5 transition-colors border-divider/10">
                       <TableCell className="pl-6">
                         <Checkbox 
                           checked={selectedProfiles.has(p.id)} 
                           onCheckedChange={() => toggleSelectProfile(p.id)}
                           className="rounded-lg"
                         />
                       </TableCell>
                       <TableCell>
                         <div className="flex items-center gap-3">
                           <Avatar className="h-10 w-10 border-2 border-white shadow-sm rounded-xl">
                             <AvatarImage src={sanitizeImageUrl(p.avatar_url)} className="object-cover" />
                             <AvatarFallback className="bg-primary/5 text-primary text-xs font-black">{getInitials(p.full_name)}</AvatarFallback>
                           </Avatar>
                           <div>
                             <p className="font-bold text-headline text-sm">{p.full_name}</p>
                             <p className="text-[10px] text-muted-foreground font-medium">{(p as any).email || "ইমেইল গোপন"}</p>
                           </div>
                         </div>
                       </TableCell>
                       <TableCell>
                         <div className="flex items-center gap-2">
                            <Badge variant={p.role === 'admin' ? "default" : "secondary"} className="rounded-lg text-[9px] font-black uppercase tracking-wider p-2 leading-none">
                              {roleLabels[p.role || "editor"]}
                            </Badge>
                            <Select onValueChange={(val) => handleQuickRoleChange(p, val)}>
                              <SelectTrigger className="w-8 h-8 p-0 border-none bg-transparent hover:bg-muted/50 flex justify-center items-center">
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              </SelectTrigger>
                              <SelectContent>
                                {roleOptions.map(opt => (
                                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                         </div>
                       </TableCell>
                       <TableCell className="font-black text-sm text-headline">{toBanglaNumber(p.article_count)}</TableCell>
                       <TableCell className="text-[11px] font-bold text-muted-foreground lowercase">
                         {p.last_login_at ? formatBanglaRelativeTime(p.last_login_at) : "তথ্য নেই"}
                       </TableCell>
                       <TableCell className="text-right pr-6">
                         <div className="flex items-center justify-end gap-1">
                           <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/10 text-primary" onClick={() => openEdit(p)}>
                             <Edit className="w-4 h-4" />
                           </Button>
                           <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-destructive/10 text-destructive" onClick={() => openDelete(p)}>
                             <Trash2 className="w-4 h-4" />
                           </Button>
                         </div>
                       </TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
             </div>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <ReporterPerformanceDashboard />
        </TabsContent>
      </Tabs>

      {/* Footer info/filters */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-muted-foreground/60 px-6 pb-6 font-sans">
        <p>সর্বমোট {toBanglaNumber(profiles.length)} জন প্রতিবেদকের তথ্য সংরক্ষিত আছে</p>
        <div className="w-1.5 h-1.5 rounded-full bg-divider/30" />
        <p>সক্রিয় ফিল্টার: {roleFilter === 'all' ? 'সব' : roleLabels[roleFilter]}</p>
      </div>

      {/* Auth/Create/Edit Dialogs */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-none w-full h-full lg:h-[90vh] lg:max-w-2xl overflow-hidden flex flex-col lg:rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl p-0 gap-0 bg-white dark:bg-slate-950">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400">
                  {isCreating ? <UserPlus className="w-4 h-4" /> : <UserCog className="w-4 h-4" />}
                </div>
                {isCreating ? "নতুন প্রতিবেদক যোগ করুন" : "প্রতিবেদকের তথ্য সম্পাদনা"}
              </DialogTitle>
              <DialogDescription className="text-xs font-medium text-slate-400 dark:text-slate-500">
                {isCreating ? "একজন নতুন প্রতিবেদকের প্রোফাইল ও লগইন বিবরণ তৈরি করুন" : "প্রতিবেদকের প্রোফাইল ও তথ্য আপডেট করুন"}
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 bg-white dark:bg-slate-950">
            <div className="space-y-6">
              
              {/* Profile Photo Section */}
              <div className="flex flex-col sm:flex-row gap-6 items-start p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="shrink-0 mx-auto sm:mx-0">
                  <AvatarUpload
                    value={avatarUrl}
                    onChange={setAvatarUrl}
                    bucket="profile-avatars"
                  />
                </div>
                <div className="flex-1 space-y-2 text-center sm:text-left pt-2">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">প্রোফাইল ফটো</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    একটি পরিষ্কার এবং প্রফেশনাল ফটো আপলোড করুন। এটি সংবাদের নিচে এবং প্রোফাইল পাতায় প্রদর্শিত হবে।
                  </p>
                </div>
              </div>

              {/* Basic Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                  <User className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">ব্যক্তিগত তথ্য</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 ml-1">পূর্ণ নাম <span className="text-rose-500">*</span></Label>
                    <Input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="যেমন: তানভীর আহমেদ"
                      className="h-10 rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:border-slate-900 dark:focus:border-slate-600 transition-all font-semibold text-sm text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 ml-1">অফিসিয়াল পদবি</Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger className="h-10 rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-semibold transition-all text-sm text-slate-900 dark:text-white">
                        <SelectValue placeholder="পদবি নির্বাচন করুন" />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl">
                        <SelectItem value="admin" className="font-semibold cursor-pointer text-sm">সম্পাদক (Admin)</SelectItem>
                        <SelectItem value="editor" className="font-semibold cursor-pointer text-sm">সহ-সম্পাদক (Editor)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 ml-1">সংক্ষিপ্ত পরিচয়</Label>
                    <Input
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="ছোট এক কথায় পরিচয়..."
                      className="h-10 rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:border-slate-900 dark:focus:border-slate-600 transition-all font-medium text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Social Media & Contact */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">সোশ্যাল মিডিয়া</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 group">
                    <Label className="text-[11px] font-bold text-slate-500 ml-1">ফেসবুক প্রোফাইল</Label>
                    <div className="relative">
                      <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1877F2]" />
                      <Input
                        value={facebookUrl}
                        onChange={(e) => setFacebookUrl(e.target.value)}
                        placeholder="facebook.com/username"
                        className="pl-10 h-10 rounded-lg bg-white border-slate-200 focus:border-[#1877F2] transition-all font-medium text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 group">
                    <Label className="text-[11px] font-bold text-slate-500 ml-1">টুইটার / X প্রোফাইল</Label>
                    <div className="relative">
                      <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-900" />
                      <Input
                        value={twitterUrl}
                        onChange={(e) => setTwitterUrl(e.target.value)}
                        placeholder="twitter.com/username"
                        className="pl-10 h-10 rounded-lg bg-white border-slate-200 focus:border-slate-900 transition-all font-medium text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Login Credentials (Only for New) */}
              {isCreating && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                    <Lock className="w-4 h-4 text-rose-400" />
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">অ্যাকাউন্ট সিকিউরিটি</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 ml-1">লগইন ইমেইল <span className="text-rose-500">*</span></Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-600" />
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="reporter@janamat24.com"
                        className="pl-10 h-10 rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:border-slate-900 dark:focus:border-slate-600 transition-all font-semibold text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 ml-1">লগইন পাসওয়ার্ড <span className="text-rose-500">*</span></Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-600" />
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="কমপক্ষে ৬ অক্ষর"
                        className="pl-10 h-10 rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:border-slate-900 dark:focus:border-slate-600 transition-all font-semibold text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                  </div>
                </div>
              )}
            </div>
            {!isCreating && editingProfile && (
              <div className="mt-4 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/20 text-orange-500 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">মোট সংবাদ</p>
                    <p className="text-base font-bold text-slate-900 dark:text-white">{toBanglaNumber(editingProfile.article_count)}টি</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">লগইন</p>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-400">{editingProfile.last_login_at ? formatBanglaRelativeTime(editingProfile.last_login_at) : 'তথ্য নেই'}</p>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 flex items-center justify-center">
                    <Activity className="w-4 h-4" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end gap-3 rounded-b-xl">
            <Button variant="outline" onClick={closeDialog} className="rounded-lg h-10 px-4 font-semibold text-xs border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-slate-700 dark:text-slate-300">
              বাতিল
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isPending}
              className="rounded-lg h-10 px-6 font-semibold text-xs bg-slate-900 dark:bg-primary hover:bg-slate-800 dark:hover:opacity-90 text-white dark:text-primary-foreground shadow-sm transition-all flex gap-2"
            >
              {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              {isPending ? "সংরক্ষণ হচ্ছে..." : isCreating ? "যোগ করুন" : "আপডেট নিশ্চিত"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>প্রতিবেদক মুছে ফেলতে চান?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">{deletingProfile?.full_name}</span> কে মুছে ফেললে তার প্রোফাইল স্থায়ীভাবে মুছে যাবে। 
              {deletingProfile && deletingProfile.article_count > 0 && (
                <span className="block mt-2 text-amber-600">
                  ⚠️ এই প্রতিবেদকের {deletingProfile.article_count}টি সংবাদ রয়েছে। মুছে ফেললে সেগুলো থেকে লেখকের নাম সরিয়ে দেওয়া হবে।
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "মুছে ফেলা হচ্ছে..." : "মুছে ফেলুন"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Password Change Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="max-w-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              পাসওয়ার্ড পরিবর্তন
            </DialogTitle>
            <DialogDescription>
              <span className="font-medium text-foreground">{passwordProfile?.full_name}</span> এর জন্য নতুন পাসওয়ার্ড সেট করুন
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>
                নতুন পাসওয়ার্ড <span className="text-destructive">*</span>
              </Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="কমপক্ষে ৬ অক্ষর"
              />
              <p className="text-xs text-muted-foreground">
                প্রতিবেদক এই নতুন পাসওয়ার্ড দিয়ে লগইন করবেন
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => {
                setPasswordDialogOpen(false);
                setPasswordProfile(null);
                setNewPassword("");
              }}
            >
              বাতিল
            </Button>
            <Button 
              onClick={handlePasswordChange} 
              disabled={passwordMutation.isPending}
            >
              {passwordMutation.isPending ? "আপডেট হচ্ছে..." : "পাসওয়ার্ড আপডেট"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Role Audit Log Dialog */}
      <Dialog open={auditLogDialogOpen} onOpenChange={setAuditLogDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              পদবি পরিবর্তনের ইতিহাস
            </DialogTitle>
            <DialogDescription>
              সাম্প্রতিক ৫০টি পদবি পরিবর্তনের রেকর্ড
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto mt-4">
            {isLoadingAuditLogs ? (
              <div className="text-center py-8 text-subtext">লোড হচ্ছে...</div>
            ) : auditLogs.length === 0 ? (
              <div className="text-center py-12 text-subtext">
                <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p>কোন পদবি পরিবর্তনের রেকর্ড নেই</p>
              </div>
            ) : (
              <div className="space-y-2">
                {auditLogs.map((log) => (
                  <div 
                    key={log.id}
                    className="bg-muted/30 rounded-lg border border-divider overflow-hidden"
                  >
                    <div 
                      className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => toggleAuditLogExpand(log.id)}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {log.user_name?.slice(0, 2) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-headline truncate">
                              {log.user_name || "অজানা ব্যবহারকারী"}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 text-sm">
                              {log.old_role ? (
                                <>
                                  <Badge variant="outline" className="text-xs">
                                    {roleLabels[log.old_role] || log.old_role}
                                  </Badge>
                                  <span className="text-subtext">→</span>
                                </>
                              ) : (
                                <span className="text-xs text-subtext">নতুন পদবি:</span>
                              )}
                              <Badge 
                                variant={log.new_role === "admin" ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {roleLabels[log.new_role] || log.new_role}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-subtext hidden sm:inline">
                            {formatBanglaDateTime(log.changed_at)}
                          </span>
                          {auditLogExpanded.has(log.id) ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {auditLogExpanded.has(log.id) && (
                      <div className="px-4 pb-4 pt-2 border-t border-divider bg-background/50">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-xs text-subtext mb-1">পরিবর্তনকারী</p>
                            <p className="font-medium">{log.changed_by_name || "অজানা"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-subtext mb-1">সময়</p>
                            <p className="font-medium">{formatBanglaDateTime(log.changed_at)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-subtext mb-1">আগের পদবি</p>
                            <p className="font-medium">{log.old_role ? roleLabels[log.old_role] : "নেই"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-subtext mb-1">নতুন পদবি</p>
                            <p className="font-medium">{roleLabels[log.new_role]}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t mt-4">
            <Button variant="outline" onClick={() => setAuditLogDialogOpen(false)}>
              বন্ধ করুন
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Role Change Dialog */}
      <Dialog open={bulkRoleDialogOpen} onOpenChange={setBulkRoleDialogOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-primary" />
              পদবি পরিবর্তন
            </DialogTitle>
            <DialogDescription>
              {selectedProfiles.size} জন প্রতিবেদকের পদবি একসাথে পরিবর্তন করুন
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium mb-2">নির্বাচিত প্রতিবেদক:</p>
              <div className="flex flex-wrap gap-2">
                {profiles
                  .filter(p => selectedProfiles.has(p.id))
                  .map(p => (
                    <Badge key={p.id} variant="secondary" className="gap-1">
                      {p.full_name || "নাম নেই"}
                      <span className="text-xs opacity-70">
                        ({p.role ? roleLabels[p.role] : "সহ-সম্পাদক"})
                      </span>
                    </Badge>
                  ))
                }
              </div>
            </div>

            <div className="space-y-2">
              <Label>নতুন পদবি নির্বাচন করুন</Label>
              <Select value={bulkNewRole} onValueChange={setBulkNewRole}>
                <SelectTrigger>
                  <SelectValue placeholder="পদবি নির্বাচন করুন" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-primary" />
                      <span>সম্পাদক</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="editor">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-muted-foreground" />
                      <span>সহ-সম্পাদক</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => {
                setBulkRoleDialogOpen(false);
                setBulkNewRole("");
              }}
            >
              বাতিল
            </Button>
            <Button 
              onClick={handleBulkRoleChange} 
              disabled={!bulkNewRole || bulkRoleMutation.isPending}
            >
              {bulkRoleMutation.isPending ? "পরিবর্তন হচ্ছে..." : "পদবি পরিবর্তন করুন"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Activity Dialog */}
      <Dialog open={activityDialogOpen} onOpenChange={(open) => {
        setActivityDialogOpen(open);
        if (!open) setActivityProfile(null);
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              কার্যকলাপ - {activityProfile?.full_name}
            </DialogTitle>
            <DialogDescription>
              সাম্প্রতিক কার্যকলাপ এবং লগইন ইতিহাস
            </DialogDescription>
          </DialogHeader>
          
          {/* Profile summary */}
          {activityProfile && (
            <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border border-divider">
              <Avatar className="w-12 h-12">
                <AvatarImage 
                  src={sanitizeImageUrl(activityProfile.avatar_url) || undefined} 
                  alt={activityProfile.full_name || "প্রতিবেদক"} 
                />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(activityProfile.full_name) || <User className="w-5 h-5" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium text-headline">{activityProfile.full_name}</p>
                <div className="flex items-center gap-4 text-sm text-subtext mt-1">
                  <span className="flex items-center gap-1">
                    <Newspaper className="w-3.5 h-3.5" />
                    {activityProfile.article_count}টি সংবাদ
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    যোগদান: {formatBanglaDate(activityProfile.created_at)}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-subtext">শেষ লগইন</p>
                <p className="font-medium text-sm">
                  {activityProfile.last_login_at 
                    ? formatBanglaRelativeTime(activityProfile.last_login_at)
                    : "কখনো লগইন করেননি"}
                </p>
              </div>
            </div>
          )}
          
          <div className="flex-1 overflow-auto mt-4">
            {isLoadingActivity ? (
              <div className="text-center py-8 text-subtext">লোড হচ্ছে...</div>
            ) : reporterActivity.length === 0 ? (
              <div className="text-center py-12 text-subtext">
                <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p>কোন কার্যকলাপ পাওয়া যায়নি</p>
              </div>
            ) : (
              <div className="space-y-2">
                {reporterActivity.map((activity) => {
                  const typeInfo = activityTypeLabels[activity.activity_type] || {
                    label: activity.activity_type,
                    icon: <FileText className="w-4 h-4 text-muted-foreground" />
                  };
                  
                  return (
                    <div 
                      key={activity.id}
                      className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg border border-divider hover:bg-muted/40 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center border border-divider">
                        {typeInfo.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-headline">{typeInfo.label}</p>
                        {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                          <p className="text-xs text-subtext truncate">
                            {activity.activity_type === 'login' && activity.metadata.user_agent 
                              ? `ডিভাইস: ${String(activity.metadata.user_agent).slice(0, 50)}...`
                              : activity.activity_type === 'news_created' || activity.activity_type === 'news_updated'
                                ? `সংবাদ: ${activity.metadata.title || 'অজানা'}`
                                : null
                            }
                          </p>
                        )}
                      </div>
                      <div className="text-right text-xs text-subtext">
                        {formatBanglaRelativeTime(activity.created_at)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t mt-4">
            <Button variant="outline" onClick={() => {
              setActivityDialogOpen(false);
              setActivityProfile(null);
            }}>
              বন্ধ করুন
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}