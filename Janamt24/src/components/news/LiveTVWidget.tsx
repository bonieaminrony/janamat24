import { Play, Video } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export function LiveTVWidget() {
  return (
    <Card className="rounded-none border-x-0 sm:border-x sm:rounded-lg overflow-hidden border-border bg-slate-950 text-white shadow-xl">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-800 p-3 border-b border-blue-900/50 flex flex-row items-center gap-2">
        <Video className="w-4 h-4 text-white" />
        <h3 className="text-white font-black tracking-wide flex-1 uppercase text-sm">
          ভিডিও ও লাইভ
        </h3>
      </CardHeader>
      
      <CardContent className="p-0 bg-slate-900 relative">
        <a 
          href="https://www.facebook.com/janamat247" 
          target="_blank" 
          rel="noopener noreferrer"
          className="block aspect-video w-full relative group cursor-pointer overflow-hidden border-0"
        >
          {/* A nice background graphic/gradient */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-700 via-slate-900 to-black group-hover:scale-105 transition-transform duration-700" />
          
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
            <div className="w-16 h-16 rounded-full bg-blue-600/20 flex items-center justify-center mb-4 group-hover:bg-blue-600/40 transition-colors duration-500">
               <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shadow-[0_0_30px_rgba(37,99,235,0.6)] group-hover:scale-110 transition-transform duration-500">
                  <Play className="w-5 h-5 text-white ml-1" />
               </div>
            </div>
            <h4 className="font-bold text-white text-lg leading-snug drop-shadow-md mb-2">
              জনমত ২৪ এর সব ভিডিও
            </h4>
            <p className="text-sm text-slate-300">
              আমাদের ফেসবুক পেজে যুক্ত থাকুন
            </p>
          </div>
        </a>
      </CardContent>
    </Card>
  );
}
