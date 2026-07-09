import { Cloud, Sun, CloudRain, Wind, Thermometer, MapPin, Sunrise, Sunset } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toBanglaNumber } from "@/lib/bangla-utils";

const getBanglaWeatherCondition = (code: number) => {
  if (code === 0) return { text: "পরিষ্কার আকাশ", IconComponent: Sun };
  if (code >= 1 && code <= 3) return { text: "আংশিক মেঘলা", IconComponent: Cloud };
  if (code >= 45 && code <= 48) return { text: "কুয়াশাচ্ছন্ন", IconComponent: Cloud };
  if (code >= 51 && code <= 67) return { text: "বৃষ্টিপাত", IconComponent: CloudRain };
  if (code >= 71 && code <= 77) return { text: "তুষারপাত", IconComponent: CloudRain };
  if (code >= 80 && code <= 82) return { text: "ভারী বৃষ্টি", IconComponent: CloudRain };
  if (code >= 95 && code <= 99) return { text: "বজ্রসহ বৃষ্টি", IconComponent: CloudRain };
  return { text: "পরিষ্কার আকাশ", IconComponent: Sun };
};

const formatTimeBn = (isoString: string) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'পিএম' : 'এএম';
  hours = hours % 12;
  hours = hours ? hours : 12; 
  return `${toBanglaNumber(hours)}:${toBanglaNumber(minutes.toString().padStart(2, '0'))} ${ampm}`;
};

export function WeatherWidget() {
  const { data: weather, isLoading } = useQuery({
    queryKey: ["weather", "dhaka"],
    queryFn: async () => {
      const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=23.8103&longitude=90.4125&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=sunrise,sunset&timezone=Asia%2FDhaka");
      const data = await res.json();
      
      const current = data.current;
      const daily = data.daily;
      const condition = getBanglaWeatherCondition(current.weather_code);

      return {
        temp: Math.round(current.temperature_2m),
        condition: condition.text,
        location: "ঢাকা, বাংলাদেশ",
        Icon: condition.IconComponent,
        humidity: `${toBanglaNumber(current.relative_humidity_2m)}%`,
        wind: `${toBanglaNumber(Math.round(current.wind_speed_10m))} কিমি/ঘ`,
        sunrise: formatTimeBn(daily.sunrise[0]),
        sunset: formatTimeBn(daily.sunset[0]),
        feelsLike: Math.round(current.apparent_temperature)
      };
    },
    staleTime: 1000 * 60 * 15, // Cache for 15 mins
  });

  if (isLoading) return (
    <div className="h-[280px] bg-white dark:bg-slate-900 animate-pulse border border-border mb-8" />
  );

  return (
    <div className="bg-white dark:bg-slate-900 border border-border mb-8">
      {/* Newspaper Style Header */}
      <div className="flex items-center gap-2 border-b-2 border-primary pb-2 mb-4 mx-4 mt-4">
        <Sun className="w-4 h-4 text-primary" />
        <h3 className="text-lg font-black text-headline tracking-wide uppercase">আবহাওয়া</h3>
      </div>
      
      <div className="px-5 pb-5">
        <div className="flex justify-between items-end mb-6">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <MapPin className="w-3.5 h-3.5" />
              <span className="text-xs font-bold uppercase tracking-widest">{weather?.location}</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-headline tracking-tighter leading-none flex items-start">
              {toBanglaNumber(weather?.temp || 0)}
              <span className="text-xl mt-1 font-bold opacity-50">°C</span>
            </h2>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-sm font-black uppercase text-primary tracking-tighter mb-1">{weather?.condition}</span>
            <div className="text-xs text-muted-foreground font-bold flex flex-col items-end">
              <span>অনুভূত হচ্ছে {toBanglaNumber(weather?.feelsLike || 0)}°C</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-0 border-y border-border divide-x divide-border mt-4">
          <div className="p-3 flex flex-col items-center justify-center">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Sunrise className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-widest">সূর্যোদয়</span>
            </div>
            <span className="text-sm font-bold text-headline">{weather?.sunrise}</span>
          </div>
          <div className="p-3 flex flex-col items-center justify-center">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Sunset className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-widest">সূর্যাস্ত</span>
            </div>
            <span className="text-sm font-bold text-headline">{weather?.sunset}</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Thermometer className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground font-bold">আর্দ্রতা: <span className="text-headline">{weather?.humidity}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Wind className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground font-bold">বাতাস: <span className="text-headline">{weather?.wind}</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}
