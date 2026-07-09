import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Mail, Users } from "lucide-react";
import { formatBanglaDateTime, toBanglaNumber } from "@/lib/bangla-utils";

export default function AdminSubscribers() {
  const { data: subscribers = [], isLoading } = useQuery({
    queryKey: ["admin-subscribers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-700 max-w-7xl mx-auto px-4 lg:px-8 py-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Mail className="w-6 h-6 text-primary" /> 
            নিউজলেটার সাবস্ক্রাইবার
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            যারা আপনার ওয়েবসাইটের নিউজলেটার পেতে ইমেইল দিয়েছেন
          </p>
        </div>
        
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-6 py-4 flex items-center gap-4 shadow-sm">
           <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
             <Users className="w-6 h-6 text-primary" />
           </div>
           <div>
             <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">মোট সাবস্ক্রাইবার</p>
             <p className="text-2xl font-black text-slate-900 dark:text-white">
               {isLoading ? "..." : toBanglaNumber(subscribers.length)}
             </p>
           </div>
        </div>
      </div>

      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-lg font-bold">ইমেইল তালিকা</CardTitle>
          <CardDescription>সবশেষ থেকে পুরোনো ক্রমানুসারে</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs font-black uppercase">
                <tr>
                  <th className="px-6 py-4">সিরিয়াল</th>
                  <th className="px-6 py-4">ইমেইল ঠিকানা</th>
                  <th className="px-6 py-4">সাবস্ক্রাইব করার সময়</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-10 text-center font-bold text-slate-500">লোড হচ্ছে...</td>
                  </tr>
                ) : subscribers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-10 text-center font-bold text-slate-500">কোনো সাবস্ক্রাইবার পাওয়া যায়নি</td>
                  </tr>
                ) : (
                  subscribers.map((sub, index) => (
                    <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 font-black">{toBanglaNumber(index + 1)}</td>
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{sub.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{formatBanglaDateTime(sub.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
