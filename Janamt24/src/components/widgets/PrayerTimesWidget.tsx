import { Clock, Timer } from "lucide-react";
import { useState, useEffect } from "react";
import { toBanglaNumber } from "@/lib/bangla-utils";

import { useQuery } from "@tanstack/react-query";

export function PrayerTimesWidget() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('bn-BD', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const convert24To12Bn = (time24: string) => {
    if (!time24) return { time: "", period: "" };
    const [hoursStr, minutesStr] = time24.split(':');
    let hours = parseInt(hoursStr);
    const ampm = hours >= 12 ? 'পিএম' : 'এএম';
    hours = hours % 12;
    hours = hours ? hours : 12; 
    return {
      time: `${toBanglaNumber(hours)}:${toBanglaNumber(minutesStr)}`,
      period: ampm
    };
  };

  const { data: timings, isLoading } = useQuery({
    queryKey: ["prayer-times", "dhaka"],
    queryFn: async () => {
      const res = await fetch("https://api.aladhan.com/v1/timingsByCity?city=Dhaka&country=Bangladesh&method=1");
      const json = await res.json();
      return json.data.timings;
    },
    staleTime: 1000 * 60 * 60 * 12, // Cache for 12 hours
  });

  const getPrayerTimes = () => {
    if (!timings) return [];
    
    const fajrStart = convert24To12Bn(timings.Fajr);
    const fajrEnd = convert24To12Bn(timings.Sunrise);
    
    const dhuhrStart = convert24To12Bn(timings.Dhuhr);
    const dhuhrEnd = convert24To12Bn(timings.Asr);
    
    const asrStart = convert24To12Bn(timings.Asr);
    const asrEnd = convert24To12Bn(timings.Sunset);
    
    const maghribStart = convert24To12Bn(timings.Maghrib);
    const maghribEnd = convert24To12Bn(timings.Isha);
    
    const ishaStart = convert24To12Bn(timings.Isha);
    const ishaEnd = convert24To12Bn(timings.Midnight);

    return [
      { id: 'fajr', name: "ফজর", start: fajrStart, end: fajrEnd, icon: "🌅" },
      { id: 'dhuhr', name: "যোহর", start: dhuhrStart, end: dhuhrEnd, icon: "☀️" },
      { id: 'asr', name: "আসর", start: asrStart, end: asrEnd, icon: "🌤️" },
      { id: 'maghrib', name: "মাগরিব", start: maghribStart, end: maghribEnd, icon: "🌇" },
      { id: 'isha', name: "এশা", start: ishaStart, end: ishaEnd, icon: "🌃" },
    ];
  };

  const prayerTimes = getPrayerTimes();

  if (isLoading) return (
    <div className="h-[432px] bg-white dark:bg-slate-900 animate-pulse border border-border mb-8" />
  );

  return (
    <div className="bg-white dark:bg-slate-900 border border-border mb-8">
      {/* Newspaper Style Header */}
      <div className="flex items-center gap-2 border-b-2 border-primary pb-2 mb-4 mx-4 mt-4">
        <Timer className="w-4 h-4 text-primary" />
        <h3 className="text-lg font-black text-headline tracking-wide uppercase">নামাজের সময়সূচি</h3>
      </div>
      
      <div className="px-5 pb-5">
        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-3 mb-4 border border-border">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">বর্তমান সময়</span>
            <span className="text-sm font-bold text-headline">{formatTime(currentTime)}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">স্থান</span>
            <span className="text-sm font-bold text-headline">ঢাকা</span>
          </div>
        </div>

        <div className="flex flex-col gap-0 divide-y divide-border border-y border-border">
          {prayerTimes.map((prayer) => (
            <div 
              key={prayer.id} 
              className="flex justify-between items-center py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground group-hover:text-primary transition-colors text-lg">{prayer.icon}</span>
                <span className="font-bold text-[15px] text-headline">{prayer.name}</span>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <div className="flex items-baseline gap-1">
                  <span className="text-[10px] text-muted-foreground mr-1">শুরু:</span>
                  <span className="font-bold text-[14px] text-headline">{prayer.start.time}</span>
                  <span className="text-[9px] font-bold text-muted-foreground">{prayer.start.period}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-[10px] text-muted-foreground mr-1">শেষ:</span>
                  <span className="font-bold text-[13px] text-muted-foreground">{prayer.end.time}</span>
                  <span className="text-[9px] font-bold text-muted-foreground">{prayer.end.period}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 text-center">
          <p className="text-[10px] text-muted-foreground font-medium leading-tight">
            ইসলামিক ফাউন্ডেশন বাংলাদেশ নির্ধারিত সময়সূচি
          </p>
        </div>
      </div>
    </div>
  );
}
