import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, TrendingDown, Users, FileText, Activity, Calendar } from "lucide-react";
import { toBanglaNumber } from "@/lib/bangla-utils";
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval, parseISO } from "date-fns";
import { bn } from "date-fns/locale";

interface ReporterActivity {
  id: string;
  user_id: string;
  activity_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  role: "admin" | "editor" | null;
}

const activityColors = {
  login: "hsl(var(--chart-1))",
  news_created: "hsl(var(--chart-2))",
  news_updated: "hsl(var(--chart-3))",
  news_deleted: "hsl(var(--chart-4))",
};

const activityLabels: Record<string, string> = {
  login: "লগইন",
  news_created: "সংবাদ তৈরি",
  news_updated: "সংবাদ সম্পাদনা",
  news_deleted: "সংবাদ মুছে ফেলা",
};

const chartConfig = {
  login: { label: "লগইন", color: "hsl(var(--chart-1))" },
  news_created: { label: "সংবাদ তৈরি", color: "hsl(var(--chart-2))" },
  news_updated: { label: "সংবাদ সম্পাদনা", color: "hsl(var(--chart-3))" },
  news_deleted: { label: "সংবাদ মুছে ফেলা", color: "hsl(var(--chart-4))" },
  total: { label: "মোট", color: "hsl(var(--primary))" },
};

const timeRangeOptions = [
  { value: "7", label: "গত ৭ দিন" },
  { value: "14", label: "গত ১৪ দিন" },
  { value: "30", label: "গত ৩০ দিন" },
  { value: "90", label: "গত ৯০ দিন" },
];

export default function ReporterPerformanceDashboard() {
  const [timeRange, setTimeRange] = useState("30");
  const [selectedReporter, setSelectedReporter] = useState<string>("all");

  // Fetch all profiles
  const { data: profiles = [] } = useQuery({
    queryKey: ["dashboard-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, role")
        .order("full_name", { ascending: true });
      
      if (error) throw error;
      return data as Profile[];
    },
  });

  // Fetch all activity within time range
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["dashboard-activities", timeRange],
    queryFn: async () => {
      const startDate = subDays(new Date(), parseInt(timeRange));
      
      const { data, error } = await supabase
        .from("reporter_activity")
        .select("*")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      return data as ReporterActivity[];
    },
  });

  // Filter activities by selected reporter
  const filteredActivities = useMemo(() => {
    if (selectedReporter === "all") return activities;
    const profile = profiles.find(p => p.id === selectedReporter);
    if (!profile) return activities;
    return activities.filter(a => a.user_id === profile.user_id);
  }, [activities, selectedReporter, profiles]);

  // Calculate daily activity data for charts
  const dailyActivityData = useMemo(() => {
    const days = parseInt(timeRange);
    const endDate = new Date();
    const startDate = subDays(endDate, days - 1);
    
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
    
    return dateRange.map(date => {
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      
      const dayActivities = filteredActivities.filter(a => {
        const activityDate = parseISO(a.created_at);
        return activityDate >= dayStart && activityDate <= dayEnd;
      });

      const login = dayActivities.filter(a => a.activity_type === "login").length;
      const news_created = dayActivities.filter(a => a.activity_type === "news_created").length;
      const news_updated = dayActivities.filter(a => a.activity_type === "news_updated").length;
      const news_deleted = dayActivities.filter(a => a.activity_type === "news_deleted").length;

      return {
        date: format(date, "dd MMM", { locale: bn }),
        fullDate: format(date, "EEEE, dd MMMM", { locale: bn }),
        login,
        news_created,
        news_updated,
        news_deleted,
        total: login + news_created + news_updated + news_deleted,
      };
    });
  }, [filteredActivities, timeRange]);

  // Calculate activity breakdown for pie chart
  const activityBreakdown = useMemo(() => {
    const breakdown = {
      login: 0,
      news_created: 0,
      news_updated: 0,
      news_deleted: 0,
    };

    filteredActivities.forEach(a => {
      if (a.activity_type in breakdown) {
        breakdown[a.activity_type as keyof typeof breakdown]++;
      }
    });

    return Object.entries(breakdown)
      .filter(([_, value]) => value > 0)
      .map(([key, value]) => ({
        name: key,
        label: activityLabels[key],
        value,
        fill: activityColors[key as keyof typeof activityColors],
      }));
  }, [filteredActivities]);

  // Calculate reporter leaderboard
  const reporterLeaderboard = useMemo(() => {
    const leaderboard: Record<string, { name: string; news_created: number; news_updated: number; logins: number; total: number }> = {};

    activities.forEach(a => {
      const profile = profiles.find(p => p.user_id === a.user_id);
      const userId = a.user_id;
      
      if (!leaderboard[userId]) {
        leaderboard[userId] = {
          name: profile?.full_name || "অজানা",
          news_created: 0,
          news_updated: 0,
          logins: 0,
          total: 0,
        };
      }

      if (a.activity_type === "news_created") leaderboard[userId].news_created++;
      if (a.activity_type === "news_updated") leaderboard[userId].news_updated++;
      if (a.activity_type === "login") leaderboard[userId].logins++;
      leaderboard[userId].total++;
    });

    return Object.values(leaderboard)
      .sort((a, b) => b.news_created - a.news_created)
      .slice(0, 5);
  }, [activities, profiles]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalActivities = filteredActivities.length;
    const newsCreated = filteredActivities.filter(a => a.activity_type === "news_created").length;
    const newsUpdated = filteredActivities.filter(a => a.activity_type === "news_updated").length;
    const uniqueLogins = new Set(filteredActivities.filter(a => a.activity_type === "login").map(a => a.user_id)).size;

    // Calculate trend (compare first half vs second half of period)
    const midpoint = Math.floor(dailyActivityData.length / 2);
    const firstHalf = dailyActivityData.slice(0, midpoint).reduce((sum, d) => sum + d.total, 0);
    const secondHalf = dailyActivityData.slice(midpoint).reduce((sum, d) => sum + d.total, 0);
    const trend = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0;

    return { totalActivities, newsCreated, newsUpdated, uniqueLogins, trend };
  }, [filteredActivities, dailyActivityData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">পারফরম্যান্স ড্যাশবোর্ড</h2>
          <p className="text-muted-foreground">প্রতিবেদকদের কার্যকলাপ বিশ্লেষণ</p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedReporter} onValueChange={setSelectedReporter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="সকল প্রতিবেদক" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সকল প্রতিবেদক</SelectItem>
              {profiles.map(profile => (
                <SelectItem key={profile.id} value={profile.id}>
                  {profile.full_name || "নামহীন"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeRangeOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">মোট কার্যকলাপ</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{toBanglaNumber(summaryStats.totalActivities)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {summaryStats.trend >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={summaryStats.trend >= 0 ? "text-green-500" : "text-red-500"}>
                {toBanglaNumber(Math.abs(Math.round(summaryStats.trend)))}%
              </span>
              <span className="ml-1">আগের তুলনায়</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">সংবাদ তৈরি</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{toBanglaNumber(summaryStats.newsCreated)}</div>
            <p className="text-xs text-muted-foreground">
              {toBanglaNumber(summaryStats.newsUpdated)} টি সম্পাদিত
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">সক্রিয় প্রতিবেদক</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{toBanglaNumber(summaryStats.uniqueLogins)}</div>
            <p className="text-xs text-muted-foreground">
              মোট {toBanglaNumber(profiles.length)} জন থেকে
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">সময়কাল</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{toBanglaNumber(parseInt(timeRange))} দিন</div>
            <p className="text-xs text-muted-foreground">
              {format(subDays(new Date(), parseInt(timeRange)), "dd MMM", { locale: bn })} থেকে
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">ট্রেন্ড</TabsTrigger>
          <TabsTrigger value="breakdown">বিশ্লেষণ</TabsTrigger>
          <TabsTrigger value="leaderboard">লিডারবোর্ড</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          {/* Activity Trend Area Chart */}
          <Card>
            <CardHeader>
              <CardTitle>কার্যকলাপের ট্রেন্ড</CardTitle>
              <CardDescription>সময়ের সাথে কার্যকলাপের পরিবর্তন</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <AreaChart data={dailyActivityData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorLogin" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorUpdated" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent labelKey="fullDate" />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Area
                    type="monotone"
                    dataKey="login"
                    stackId="1"
                    stroke="hsl(var(--chart-1))"
                    fillOpacity={1}
                    fill="url(#colorLogin)"
                  />
                  <Area
                    type="monotone"
                    dataKey="news_created"
                    stackId="1"
                    stroke="hsl(var(--chart-2))"
                    fillOpacity={1}
                    fill="url(#colorCreated)"
                  />
                  <Area
                    type="monotone"
                    dataKey="news_updated"
                    stackId="1"
                    stroke="hsl(var(--chart-3))"
                    fillOpacity={1}
                    fill="url(#colorUpdated)"
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Daily Total Line Chart */}
          <Card>
            <CardHeader>
              <CardTitle>দৈনিক কার্যকলাপ</CardTitle>
              <CardDescription>প্রতিদিনের মোট কার্যকলাপ</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <LineChart data={dailyActivityData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent labelKey="fullDate" />} />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Activity Type Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>কার্যকলাপের ধরন</CardTitle>
                <CardDescription>বিভিন্ন ধরনের কার্যকলাপের অনুপাত</CardDescription>
              </CardHeader>
              <CardContent>
                {activityBreakdown.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <PieChart>
                      <Pie
                        data={activityBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        dataKey="value"
                        label={({ label, percent }) => `${label} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {activityBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent nameKey="label" />} />
                    </PieChart>
                  </ChartContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    কোনো কার্যকলাপ নেই
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Activity by Type Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>কার্যকলাপ সংখ্যা</CardTitle>
                <CardDescription>ধরন অনুযায়ী কার্যকলাপের সংখ্যা</CardDescription>
              </CardHeader>
              <CardContent>
                {activityBreakdown.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <BarChart data={activityBreakdown} layout="vertical" margin={{ top: 10, right: 30, left: 80, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" className="text-xs" />
                      <YAxis type="category" dataKey="label" className="text-xs" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {activityBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    কোনো কার্যকলাপ নেই
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="leaderboard">
          <Card>
            <CardHeader>
              <CardTitle>শীর্ষ প্রতিবেদক</CardTitle>
              <CardDescription>সর্বাধিক সংবাদ তৈরিকারী প্রতিবেদক</CardDescription>
            </CardHeader>
            <CardContent>
              {reporterLeaderboard.length > 0 ? (
                <div className="space-y-4">
                  <ChartContainer config={chartConfig} className="h-[250px] w-full">
                    <BarChart data={reporterLeaderboard} margin={{ top: 10, right: 30, left: 80, bottom: 0 }} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" className="text-xs" />
                      <YAxis type="category" dataKey="name" className="text-xs" width={80} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="news_created" fill="hsl(var(--chart-2))" name="সংবাদ তৈরি" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ChartContainer>

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">বিস্তারিত তথ্য</h4>
                    <div className="space-y-2">
                      {reporterLeaderboard.map((reporter, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold text-primary">#{toBanglaNumber(index + 1)}</span>
                            <span className="font-medium">{reporter.name}</span>
                          </div>
                          <div className="flex gap-4 text-sm">
                            <span className="text-muted-foreground">
                              <span className="font-medium text-foreground">{toBanglaNumber(reporter.news_created)}</span> সংবাদ
                            </span>
                            <span className="text-muted-foreground">
                              <span className="font-medium text-foreground">{toBanglaNumber(reporter.news_updated)}</span> সম্পাদনা
                            </span>
                            <span className="text-muted-foreground">
                              <span className="font-medium text-foreground">{toBanglaNumber(reporter.logins)}</span> লগইন
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  কোনো কার্যকলাপ নেই
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
